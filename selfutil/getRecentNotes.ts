import { App, CachedMetadata, FrontMatterCache } from "obsidian";

export function getRecentNotes(app: App, limit: number): string[] {
  const recentViewedNotes = app.workspace.getLastOpenFiles().filter(path => app.vault.getAbstractFileByPath(path) !== null);
  return recentViewedNotes.slice(0, Math.min(limit, recentViewedNotes.length));
}

export function getAllNotes(app: App): string[] {
  const files = app.vault.getMarkdownFiles();
  const allNotes = files.map((file) => file.path);
  return allNotes;
}

export function getAllNotesWithoutMetadata(app: App): string[] {
  let getAllNotesWithoutMetadata: string[] = [];
  const files = app.vault.getMarkdownFiles();
  files.forEach((file) => {
    const fileCache : CachedMetadata | null = this.app.metadataCache.getFileCache(file)
    if (fileCache) {
      const frontmatter : FrontMatterCache | undefined = fileCache.frontmatter
      if (!frontmatter) {
        getAllNotesWithoutMetadata.push(file.path);
      }
    }
  })
  return getAllNotesWithoutMetadata;
}
