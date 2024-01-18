import { App } from "obsidian";

export function getRecentNotes(app: App, limit: number): string[] {
  const files = app.vault.getMarkdownFiles().sort((a, b) => b.stat.ctime - a.stat.ctime);
  const recentNotes = files.slice(0, limit).map((file) => file.path);
  return recentNotes;
}