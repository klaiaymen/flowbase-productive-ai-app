import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const calendarItems = pgTable("calendar_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date"), // 'YYYY-MM-DD' or null if it's a draft
  time: text("time"), // 'HH:MM' or null
  type: text("type").notNull(), // 'task' | 'reminder'
  category: text("category").notNull(), // 'work' | 'learning' | 'urgent' | 'ideas' | 'personal'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CalendarItem = typeof calendarItems.$inferSelect;
export type NewCalendarItem = typeof calendarItems.$inferInsert;

