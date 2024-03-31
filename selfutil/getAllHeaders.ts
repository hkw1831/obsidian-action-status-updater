import { App, CachedMetadata, TFile } from "obsidian";

export function getAllHeaders(app: App, fileList : string[]): NoteWithHeader[] {
    const resultList: NoteWithHeader[] = [];
    for (const filePath of fileList) {
        const file : TFile = app.vault.getAbstractFileByPath(filePath) as TFile
        const fileCache : CachedMetadata | null = app.metadataCache.getFileCache(file)
        if (!fileCache) {

        } else if (!fileCache.headings) {

        } else {
            fileCache.headings.forEach(h => {
                resultList.push({notePath: filePath, header: "#" + h.heading, startLine: h.position.start.line})
            })
        }   
    }
    return resultList
}