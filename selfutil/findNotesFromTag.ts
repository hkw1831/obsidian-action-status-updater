import { App, CachedMetadata, parseFrontMatterAliases, parseFrontMatterTags } from "obsidian";

export function filesWhereTagIsUsed(findTag: string): string[] {
    const filesList: string[] = [];
    for (const filePath of locationsWhereTagIsUsed(findTag)) {
        if (!filesList.includes(filePath)) {
            filesList.push(filePath)
        }
    }
    return filesList.sort((a: string, b: string) => a.localeCompare(b));
}

// return array of file path
function locationsWhereTagIsUsed(findTag: string): Array<string> {
    const oApp: App = app;
    const results: string[] = [];

    for (const file of oApp.vault.getMarkdownFiles()) {
        const cache: CachedMetadata | null = oApp.metadataCache.getFileCache(file);
        if (cache != null && cache.tags) {
            for (const tag of cache.tags) {
                if (findTag === tag.tag) {
                    results.push(file.path)
                }
            }
        }
        if (cache != null && cache.frontmatter) {
            const fmtags = (parseFrontMatterTags(cache.frontmatter) || []).filter(tag => findTag == tag || tag.startsWith(findTag + "/"));
            if (fmtags.length) {
                results.push(file.path)
            }
            const fmtags2 = (parseFrontMatterAliases(cache.frontmatter) || []).filter(tag => findTag == tag || tag.startsWith(findTag + "/"));
            if (fmtags2.length) {
                results.push(file.path)
            }
        }
    }
    return results
}