import { App, CachedMetadata, TFile, parseFrontMatterAliases, parseFrontMatterTags } from "obsidian";
import { NoteWithHeader } from "./noteWithHeader";

export function filesWhereTagIsUsed(findTag: string): string[] {
    const filesList: string[] = [];
    for (const filePath of locationsWhereTagIsUsed(findTag)) {
        if (!filesList.includes(filePath)) {
            filesList.push(filePath)
        }
    }
    return filesList.sort((a: string, b: string) => a.localeCompare(b));
}

export function filesHeadersWhereTagIsUsed(app: App, findTag: string): NoteWithHeader[] {
    const fileList: string[] = filesWhereTagIsUsed(findTag);
    const resultList: NoteWithHeader[] = [];
    for (const filePath of fileList) {
        const file : TFile = app.vault.getAbstractFileByPath(filePath) as TFile
        const fileCache = app.metadataCache.getFileCache(file)
        if (!fileCache) {

        } else if (!fileCache.headings) {

        } else {
            fileCache.headings.forEach(h => {
                resultList.push({notePath: filePath, header: "#" + h.heading, startLine: h.position.start.line, noteType: null})
            })
        }   
    }
    return resultList
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