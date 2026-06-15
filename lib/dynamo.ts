import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Item } from "./types";

/**
 * DynamoDB is used for persistence but is intentionally OFF the critical
 * demo path: if the table/credentials are missing, saves fail silently and
 * the app still works from client state. This keeps the live demo bulletproof.
 *
 * Table (on-demand): CampusFlowItems
 *   PK: userId (String)   SK: itemId (String)
 */
const region = process.env.AWS_REGION || "us-east-1";
const TABLE = process.env.DDB_TABLE || "CampusFlowItems";

let doc: DynamoDBDocumentClient | null = null;
function client() {
  if (!doc) {
    doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return doc;
}

export async function saveItems(userId: string, items: Item[]): Promise<void> {
  if (process.env.DDB_DISABLED === "true") return;
  try {
    await Promise.all(
      items.map((it) =>
        client().send(
          new PutCommand({
            TableName: TABLE,
            Item: { userId, itemId: it.id, ...it },
          })
        )
      )
    );
  } catch (err) {
    // Non-fatal: persistence is best-effort for the prototype.
    console.warn("[dynamo] saveItems failed (continuing):", err);
  }
}

export async function listItems(userId: string): Promise<Item[]> {
  if (process.env.DDB_DISABLED === "true") return [];
  try {
    const res = await client().send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      })
    );
    return (res.Items as Item[]) ?? [];
  } catch (err) {
    console.warn("[dynamo] listItems failed (continuing):", err);
    return [];
  }
}
