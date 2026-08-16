import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export type Role = "superuser" | "pmo" | "chef_projet" | "member";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  role: text("role").$type<Role>().notNull().default("member"),
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
  description: text("description").default(""),
  manualStatus: text("manual_status"), // null | 'auto' | 'on_hold' | 'cancelled'
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
  assignedTo: text("assigned_to"), // email of assignee
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

// ─── Spaces & Pages ───────────────────────────────────────────────────────────

export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),        // owner
  name: text("name").notNull(),
  description: text("description").default(""),
  color: text("color").notNull().default("violet"),    // violet | sky | emerald | amber | rose | indigo | cyan | fuchsia
  isFavorited: boolean("is_favorited").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  lastOpenedAt: timestamp("last_opened_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Space = typeof spaces.$inferSelect;
export type NewSpace = typeof spaces.$inferInsert;

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").references(() => spaces.id, { onDelete: "cascade" }).notNull(),
  clerkUserId: text("clerk_user_id").notNull(),        // last editor
  name: text("name").notNull(),
  description: text("description").default(""),
  template: text("template").notNull().default("blank"), // blank | project-plan | meeting-notes | prd | research-notes | task-plan
  content: text("content").default(""),               // page body content (plain text or markdown)
  isFavorited: boolean("is_favorited").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  commentsCount: integer("comments_count").notNull().default(0),
  linkedTaskIds: text("linked_task_ids").default("[]"), // JSON: number[]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

export const spaceMembers = pgTable("space_members", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").references(() => spaces.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SpaceMember = typeof spaceMembers.$inferSelect;
export type NewSpaceMember = typeof spaceMembers.$inferInsert;

// ─── Page Comments ────────────────────────────────────────────────────────────

export const pageComments = pgTable("page_comments", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => pages.id, { onDelete: "cascade" }).notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PageComment = typeof pageComments.$inferSelect;
export type NewPageComment = typeof pageComments.$inferInsert;

// ─── AI Templates (Generated Mini Apps) ───────────────────────────────────────

export const aiTemplates = pgTable("ai_templates", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  appName: text("app_name").notNull(),
  description: text("description").default(""),
  icon: text("icon").notNull().default("Sparkles"), // Lucide icon name
  color: text("color").notNull().default("#8B5CF6"), // Theme color hex/name
  layout: text("layout").notNull().default("single-page"),
  schemaJson: text("schema_json").notNull(), // JSON layout structure & fields
  dataJson: text("data_json").notNull().default("{}"), // User interactive state data
  isPinnedToSidebar: boolean("is_pinned_to_sidebar").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AiTemplate = typeof aiTemplates.$inferSelect;
export type NewAiTemplate = typeof aiTemplates.$inferInsert;


