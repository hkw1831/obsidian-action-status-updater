import { App } from "obsidian";

export function getRecentNotes(app: App, limit: number): string[] {
  const recentViewedNotes = app.workspace.getLastOpenFiles();
  return recentViewedNotes.slice(0, Math.min(limit, recentViewedNotes.length));
}

export function getAllNotes(app: App): string[] {
  const files = app.vault.getMarkdownFiles();
  const allNotes = files.map((file) => file.path);
  return allNotes;
}