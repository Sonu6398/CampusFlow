import { promises as fs } from "node:fs";
import path from "node:path";
import type { Item, RoutineEntry, User } from "./types";

/**
 * Storage abstraction with two backends, chosen at runtime:
 *  - DynamoDB   when STORE=dynamo (or DDB_TABLE + AWS creds are present)
 *  - JSON file  otherwise (great for local dev — no AWS setup needed)
 *
 * Same interface either way, so the rest of the app never cares which is live.
 *
 * DynamoDB single-table design (table name = DDB_TABLE, default "CampusFlow"):
 *   pk = "USER#<email|userId>"
 *   sk = "PROFILE" | "ITEM#<itemId>" | "ROUTINE#<id>"
 */

export interface Store {
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: User): Promise<void>;

  getItems(userId: string): Promise<Item[]>;
  addItems(userId: string, items: Item[]): Promise<void>;
  updateItem(userId: string, itemId: string, patch: Partial<Item>): Promise<void>;
  deleteItem(userId: string, itemId: string): Promise<void>;

  getRoutine(userId: string): Promise<RoutineEntry[]>;
  setRoutine(userId: string, entries: RoutineEntry[]): Promise<void>;
}

/* ----------------------------- File backend ----------------------------- */

type DbShape = {
  users: Record<string, User>;
  items: Record<string, Item[]>;
  routines: Record<string, RoutineEntry[]>;
};

class FileStore implements Store {
  private file = path.join(process.cwd(), ".data", "db.json");
  private chain: Promise<unknown> = Promise.resolve();

  private async read(): Promise<DbShape> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      return JSON.parse(raw) as DbShape;
    } catch {
      return { users: {}, items: {}, routines: {} };
    }
  }

  private async write(db: DbShape): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(db, null, 2), "utf8");
  }

  /** Serialize read-modify-write to avoid clobbering concurrent writes. */
  private mutate<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
    const run = this.chain.then(async () => {
      const db = await this.read();
      const result = await fn(db);
      await this.write(db);
      return result;
    });
    this.chain = run.catch(() => {});
    return run;
  }

  async getUserByEmail(email: string) {
    const db = await this.read();
    return db.users[email.toLowerCase()] ?? null;
  }
  async createUser(user: User) {
    await this.mutate((db) => {
      db.users[user.email.toLowerCase()] = user;
    });
  }
  async getItems(userId: string) {
    const db = await this.read();
    return db.items[userId] ?? [];
  }
  async addItems(userId: string, items: Item[]) {
    await this.mutate((db) => {
      db.items[userId] = [...(db.items[userId] ?? []), ...items];
    });
  }
  async updateItem(userId: string, itemId: string, patch: Partial<Item>) {
    await this.mutate((db) => {
      const arr = db.items[userId] ?? [];
      db.items[userId] = arr.map((i) =>
        i.id === itemId ? { ...i, ...patch } : i
      );
    });
  }
  async deleteItem(userId: string, itemId: string) {
    await this.mutate((db) => {
      db.items[userId] = (db.items[userId] ?? []).filter(
        (i) => i.id !== itemId
      );
    });
  }
  async getRoutine(userId: string) {
    const db = await this.read();
    return db.routines[userId] ?? [];
  }
  async setRoutine(userId: string, entries: RoutineEntry[]) {
    await this.mutate((db) => {
      db.routines[userId] = entries;
    });
  }
}

/* --------------------------- DynamoDB backend --------------------------- */

class DynamoStore implements Store {
  private table = process.env.DDB_TABLE || "CampusFlow";
  private doc: any;

  private async client() {
    if (!this.doc) {
      const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
      const { DynamoDBDocumentClient } = await import("@aws-sdk/lib-dynamodb");

      // Use CF_AWS_* names so they don't collide with the AWS_* env vars that
      // Amplify/Lambda reserve. Fall back to the default credential chain locally.
      const region =
        process.env.CF_AWS_REGION || process.env.AWS_REGION || "us-east-1";
      const accessKeyId = process.env.CF_AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.CF_AWS_SECRET_ACCESS_KEY;
      const creds =
        accessKeyId && secretAccessKey
          ? { credentials: { accessKeyId, secretAccessKey } }
          : {};

      this.doc = DynamoDBDocumentClient.from(
        new DynamoDBClient({ region, ...creds }),
        { marshallOptions: { removeUndefinedValues: true } }
      );
    }
    return this.doc;
  }

  private async cmds() {
    return await import("@aws-sdk/lib-dynamodb");
  }

  async getUserByEmail(email: string) {
    const { GetCommand } = await this.cmds();
    const doc = await this.client();
    const res = await doc.send(
      new GetCommand({
        TableName: this.table,
        Key: { pk: `USER#${email.toLowerCase()}`, sk: "PROFILE" },
      })
    );
    return (res.Item?.data as User) ?? null;
  }
  async createUser(user: User) {
    const { PutCommand } = await this.cmds();
    const doc = await this.client();
    await doc.send(
      new PutCommand({
        TableName: this.table,
        Item: {
          pk: `USER#${user.email.toLowerCase()}`,
          sk: "PROFILE",
          data: user,
        },
      })
    );
  }
  async getItems(userId: string): Promise<Item[]> {
    const { QueryCommand } = await this.cmds();
    const doc = await this.client();
    const res = await doc.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: "pk = :p AND begins_with(sk, :s)",
        ExpressionAttributeValues: { ":p": `USER#${userId}`, ":s": "ITEM#" },
      })
    );
    return (res.Items ?? []).map((r: any) => r.data as Item);
  }
  async addItems(userId: string, items: Item[]) {
    const { PutCommand } = await this.cmds();
    const doc = await this.client();
    await Promise.all(
      items.map((it) =>
        doc.send(
          new PutCommand({
            TableName: this.table,
            Item: { pk: `USER#${userId}`, sk: `ITEM#${it.id}`, data: it },
          })
        )
      )
    );
  }
  async updateItem(userId: string, itemId: string, patch: Partial<Item>) {
    const items: Item[] = await this.getItems(userId);
    const cur = items.find((i: Item) => i.id === itemId);
    if (!cur) return;
    await this.addItems(userId, [{ ...cur, ...patch }]); // Put overwrites
  }
  async deleteItem(userId: string, itemId: string) {
    const { DeleteCommand } = await this.cmds();
    const doc = await this.client();
    await doc.send(
      new DeleteCommand({
        TableName: this.table,
        Key: { pk: `USER#${userId}`, sk: `ITEM#${itemId}` },
      })
    );
  }
  async getRoutine(userId: string): Promise<RoutineEntry[]> {
    const { QueryCommand } = await this.cmds();
    const doc = await this.client();
    const res = await doc.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: "pk = :p AND begins_with(sk, :s)",
        ExpressionAttributeValues: { ":p": `USER#${userId}`, ":s": "ROUTINE#" },
      })
    );
    return (res.Items ?? []).map((r: any) => r.data as RoutineEntry);
  }
  async setRoutine(userId: string, entries: RoutineEntry[]) {
    const { PutCommand, DeleteCommand } = await this.cmds();
    const doc = await this.client();
    const existing: RoutineEntry[] = await this.getRoutine(userId);
    await Promise.all(
      existing.map((e: RoutineEntry) =>
        doc.send(
          new DeleteCommand({
            TableName: this.table,
            Key: { pk: `USER#${userId}`, sk: `ROUTINE#${e.id}` },
          })
        )
      )
    );
    await Promise.all(
      entries.map((e) =>
        doc.send(
          new PutCommand({
            TableName: this.table,
            Item: { pk: `USER#${userId}`, sk: `ROUTINE#${e.id}`, data: e },
          })
        )
      )
    );
  }
}

/* ------------------------------ Selection ------------------------------- */

function useDynamo(): boolean {
  if (process.env.STORE === "dynamo") return true;
  if (process.env.STORE === "file") return false;
  return Boolean(process.env.DDB_TABLE && process.env.AWS_ACCESS_KEY_ID);
}

let _store: Store | null = null;
export function store(): Store {
  if (!_store) _store = useDynamo() ? new DynamoStore() : new FileStore();
  return _store;
}
