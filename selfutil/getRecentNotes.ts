import { App, CachedMetadata, FrontMatterCache, TFile } from "obsidian";

export interface RecentNoteInfo {
  path: string;
  mtime: number;
  lastViewed: number; // Estimated last viewed time based on position in recent files list
}

export function getRecentNotes(app: App, limit: number): string[] {
  const recentViewedNotes = app.workspace.getLastOpenFiles().filter(path => app.vault.getAbstractFileByPath(path) !== null);
  return recentViewedNotes.slice(0, Math.min(limit, recentViewedNotes.length));
}

export function getRecentNotesWithInfo(app: App, limit: number): RecentNoteInfo[] {
  // Get recently viewed notes from Obsidian's internal tracking
  const recentViewedPaths = app.workspace.getLastOpenFiles();
  const now = Date.now();
  
  // Create a map to track the highest "recency score" for each file
  const noteInfoMap = new Map<string, RecentNoteInfo>();
  
  // Process recently viewed notes (higher weight)
  recentViewedPaths.forEach((path, index) => {
    const file = app.vault.getAbstractFileByPath(path);
    if (file && file instanceof TFile) {
      // Give recently viewed files a score based on position in the list
      // The higher in the list, the more recently it was viewed
      const lastViewedEstimate = now - (index * 60000); // Rough estimate, each position = 1 minute older
      
      noteInfoMap.set(path, {
        path: path,
        mtime: file.stat.mtime,
        lastViewed: lastViewedEstimate
      });
    }
  });
  
  // Process all files to catch any with recent mtimes that aren't in the recent files list
  const allFiles = app.vault.getMarkdownFiles();
  allFiles.forEach(file => {
    if (!noteInfoMap.has(file.path) && file.stat.mtime > now - (31 * 24 * 60 * 60 * 1000)) { // Files modified within the last 31 days
      noteInfoMap.set(file.path, {
        path: file.path,
        mtime: file.stat.mtime,
        lastViewed: 0 // Not recently viewed, rely on mtime for sorting
      });
    }
  });
  
  // Convert map to array and sort by combined score
  const result = Array.from(noteInfoMap.values()).sort((a, b) => {
    // Compute a combined recency score that weighs both last viewed time and modification time
    const scoreA = Math.max(a.lastViewed, a.mtime);
    const scoreB = Math.max(b.lastViewed, b.mtime);
    return scoreB - scoreA; // Most recent first
  });
  
  return result.slice(0, Math.min(limit, result.length));
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
