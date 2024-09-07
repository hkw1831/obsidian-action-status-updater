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

export function getAllTaskMixedWithActionTagsWithFilter(app: App) {
    const files = app.vault.getMarkdownFiles();
    const taskTags: Set<string> = new Set<string>();
    const nonTaskTags: Set<string> = new Set<string>();
    const taskAndActionTags: Set<string> = new Set<string>();
    for (const file of files) {
        const cache = app.metadataCache.getCache(file.path);
        if (cache === null) {
            continue;
        }
        const allTags = getAllTags(cache)
        if (!allTags) {
            continue;
        }
        const tts : Set<string> = new Set<string>();
        const ats : Set<string> = new Set<string>();
        allTags.forEach((tag) => {
            if (/^#[a-z]\/[a-z]\/[a-z]$/.test(tag)) {
                const layerOfTag: string[] = getLayersOfTag(tag)
                for (const layer of layerOfTag) {
                    tts.add(layer);
                }
            } else {
                ats.add(tag);
            }
        });
        for (const tt of tts) {
            taskTags.add(tt)
            for (const at of ats) {
                const tag2 = tt + " " + at
                taskAndActionTags.add(tag2)
            }
        }
        for (const at of ats) {
            nonTaskTags.add(at)
        }
    }
    return [...Array.from(nonTaskTags).sort((a: string, b: string) => a.localeCompare(b)),
        ...Array.from(taskTags).sort((a: string, b: string) => a.localeCompare(b)),
        ...Array.from(taskAndActionTags).sort((a: string, b: string) => a.localeCompare(b))]
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