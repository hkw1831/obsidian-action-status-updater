import { App, getAllTags } from "obsidian";

export function getAllNoteTags(app: App) {
    return getAllTagsWithFilter(app, (tag) => /^#[a-z]\/[a-z]\/[a-z]$/.test(tag))
}

export function getAllTagsWithFilter(app: App, filter?: (tag: string) => boolean | null) {
    const files = app.vault.getMarkdownFiles();
    const items: string[] = [];
    for (const file of files) {
        const cache = app.metadataCache.getCache(file.path);
        if (cache === null) {
            continue;
        }
        getAllTags(cache)?.forEach((tag) => {
            if (!items.includes(tag)) {
                if (filter == null || filter(tag)) {
                    items.push(tag);
                }
            }
        });
    }
    return items.sort((a: string, b: string) => a.localeCompare(b));
}