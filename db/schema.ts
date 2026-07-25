import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

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

export const kanbanBoards = pgTable("kanban_boards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type NewKanbanBoard = typeof kanbanBoards.$inferInsert;

export const kanbanColumns = pgTable("kanban_columns", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => kanbanBoards.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type NewKanbanColumn = typeof kanbanColumns.$inferInsert;

export const kanbanTasks = pgTable("kanban_tasks", {
  id: serial("id").primaryKey(),
  columnId: integer("column_id").references(() => kanbanColumns.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"), // 'YYYY-MM-DD'
  priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high'
  labels: text("labels"), // JSON stringified array of labels: [{ text: string, color: string }]
  syncCalendar: boolean("sync_calendar").notNull().default(false),
  syncNotes: boolean("sync_notes").notNull().default(false),
  calendarItemId: integer("calendar_item_id").references(() => calendarItems.id, { onDelete: "set null" }),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KanbanTask = typeof kanbanTasks.$inferSelect;
export type NewKanbanTask = typeof kanbanTasks.$inferInsert;

export const kanbanBoardShares = pgTable("kanban_board_shares", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => kanbanBoards.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KanbanBoardShare = typeof kanbanBoardShares.$inferSelect;
export type NewKanbanBoardShare = typeof kanbanBoardShares.$inferInsert;

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull().default("Untitled"),
  content: text("content").default(""), // Tiptap HTML string
  color: text("color").notNull().default("rose"), // rose | violet | amber | sky | emerald | slate
  isPinned: boolean("is_pinned").notNull().default(false),
  isTrashed: boolean("is_trashed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export const whiteboards = pgTable("whiteboards", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull().default("Untitled Whiteboard"),
  elements: text("elements").default("[]"), // JSON stringified Excalidraw elements
  appState: text("app_state").default("{}"), // JSON stringified Excalidraw appState
  color: text("color").notNull().default("emerald"), // emerald | violet | sky | amber | rose | indigo
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Whiteboard = typeof whiteboards.$inferSelect;
export type NewWhiteboard = typeof whiteboards.$inferInsert;





