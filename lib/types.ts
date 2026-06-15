export type ItemType = "deadline" | "event" | "class" | "notice" | "personal";
export type Priority = "high" | "medium" | "low";

export type Item = {
  id: string;
  type: ItemType;
  title: string;
  description?: string;
  /** ISO datetime string if known, else null */
  dueAt: string | null;
  priority: Priority;
  source?: string;
  status?: "open" | "done";
  createdAt?: string;
};

export type RoutineEntry = {
  id: string;
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  start: string; // "09:00"
  end: string; // "10:00"
  title: string;
  location?: string;
};

export type User = {
  id: string; // same as email (lowercased)
  email: string;
  name: string;
  college?: string;
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = Omit<User, "passwordHash">;

export type Digest = {
  date: string; // YYYY-MM-DD
  summary: string;
  nudges: string[];
  generatedAt: string;
};
