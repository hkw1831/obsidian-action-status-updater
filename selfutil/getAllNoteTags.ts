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
            if (filter == null || filter(tag)) {
                const layerOfTag: string[] = getLayersOfTag(tag)
                for (const layer of layerOfTag) {
                    if (!items.includes(layer)) {
                        items.push(layer);
                    }
                }
            }
        });
    }
    return items.sort((a: string, b: string) => a.localeCompare(b));
}

function getLayersOfTag(tag: string): string[] {
    // provide a tag with #zzz/bbb/ccc, return [#zzz, #zzz/bbb, #zzz/bbb/ccc]
    // if tag without / (e.g. #zzz), return [#zzz]
    const layers: string[] = []
    const tagSplit = tag.split("/")
    let tagLayer = tagSplit[0]
    layers.push(tagLayer)
    for (const tagPart of tagSplit.slice(1, tagSplit.length)) {
        tagLayer += "/" + tagPart
        layers.push(tagLayer)
    }
    return layers
}