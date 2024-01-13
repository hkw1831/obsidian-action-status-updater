import { App, getAllTags } from "obsidian";

export function getAllNoteTags(app: App) {
    const files = app.vault.getMarkdownFiles();
    const items: string[] = [];
    for (const file of files) {
        const cache = app.metadataCache.getCache(file.path);
        if (cache === null) {
            continue;
        }
        getAllTags(cache)?.forEach((tag) => {
            if (/^#[a-z]\/[a-z]\/[a-z]$/.test(tag) && !items.includes(tag)) {
                items.push(tag);
            }
        });
    }
    return items.sort((a: string, b: string) => a.localeCompare(b));
}