import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const highScores = pgTable("high_scores", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  score: integer("score").notNull(),
  maxStreak: integer("max_streak").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHighScoreSchema = createInsertSchema(highScores).omit({ 
  id: true, 
  createdAt: true 
});

export type HighScore = typeof highScores.$inferSelect;
export type InsertHighScore = z.infer<typeof insertHighScoreSchema>;
