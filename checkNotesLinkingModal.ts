import { App, FuzzySuggestModal, TFile } from 'obsidian';
import MyPlugin from './main';
import { filesWhereTagIsUsed } from 'selfutil/findNotesFromTag';
import { getNoteType } from 'selfutil/getTaskTag';

export class CheckNotesLinkingType {
    notesWithTagsToTest: string[];
    nonExistenceTagsToBeTested: string[];
    checkExistOrNotExist: boolean;
}

export class CheckNotesLinkingModal extends FuzzySuggestModal<CheckNotesLinkingType> {
    types : CheckNotesLinkingType[] = [
        {
            notesWithTagsToTest: ["#b/k/s", "#b/n/c"],
            nonExistenceTagsToBeTested: ["#b/k/c", "#b/n/z"],
            checkExistOrNotExist: false
        },
        {
            notesWithTagsToTest: ["#b/k/s", "#b/n/c"],
            nonExistenceTagsToBeTested: ["#b/k/c", "#b/n/z"],
            checkExistOrNotExist: true
        },
        {
            notesWithTagsToTest: ["#b/k/s", "#b/n/c"],
            nonExistenceTagsToBeTested: [],
            checkExistOrNotExist: false
        },
        {
            notesWithTagsToTest: ["#b/k/s", "#b/n/c"],
            nonExistenceTagsToBeTested: [],
            checkExistOrNotExist: true
        },
        {
            notesWithTagsToTest: ["#c/b/p"],
            nonExistenceTagsToBeTested: ["#b/k/c"],
            checkExistOrNotExist: false
        },
        {
            notesWithTagsToTest: ["#c/b/p"],
            nonExistenceTagsToBeTested: ["#b/k/c"],
            checkExistOrNotExist: true
        }
    ]

    allBKSWithoutLinkedToBKC : string = "All #b/k/s not linked to #b/k/c"

    private plugin: MyPlugin;
    
    constructor(app: App, plugin: MyPlugin) {
        super(app);
        this.plugin = plugin;
        this.setPlaceholder("Select notes to view links");
    }

    getItems(): CheckNotesLinkingType[] {
        return this.types;
    }

    getItemText(item: CheckNotesLinkingType): string {
        // Remove file extension and path prefix for better readability
        return this.checkNotesLinkingTypeToString(item);
    }

    private checkNotesLinkingTypeToString(item: CheckNotesLinkingType): string {
        const orVsNor = item.checkExistOrNotExist ? "or" : "nor";
        return item.nonExistenceTagsToBeTested.length != 0
        ? `All [${item.notesWithTagsToTest.join(" or ")}] ${item.checkExistOrNotExist ? "" : "not "}linked to [${item.nonExistenceTagsToBeTested.join(" " + orVsNor + " ")}]`
        : `All [${item.notesWithTagsToTest.join(" or ")}] ${item.checkExistOrNotExist ? "" : "not "}have any backlinks`;
    }

    onChooseItem(item: CheckNotesLinkingType, evt: MouseEvent | KeyboardEvent): void {
        const list: string[] = this.getFilePathWithBacklinkNoTagExist(item.notesWithTagsToTest, item.nonExistenceTagsToBeTested, item.checkExistOrNotExist);
        this.plugin.activateCheckNotesLinkingView(list, this.checkNotesLinkingTypeToString(item));
    }

    // e.g. 1 (["#b/k/s"], ["#b/k/c"], false) means find all notes tagged with #b/k/s that are not linked to any notes tagged #b/k/c
    // e.g. 2 (["#b/k/s", "#b/k/d"], ["#a/w/n", "#a/n/n"], false) means find all notes tagged with #b/k/s or #b/k/d that are not linked to any notes tagged #a/w/n nor #a/n/n
    // e.g. 3 (["#b/k/s", "#b/k/d"], [], false) means find all notes tagged with #b/k/s or #b/k/d that are not linked to any notes
    // e.g. 4 (["#b/k/s"], ["#b/k/c"], true) means find all notes tagged with #b/k/s that are linked to any notes tagged #b/k/c
    // e.g. 5 (["#b/k/s", "#b/k/d"], ["#a/w/n", "#a/n/n"], true) means find all notes tagged with #b/k/s or #b/k/d that are linked to any notes tagged #a/w/n or #a/n/n
    // e.g. 6 (["#b/k/s", "#b/k/d"], [], true) means find all notes tagged with #b/k/s or #b/k/d that are linked to any notes
    private getFilePathWithBacklinkNoTagExist(filesWithTagToTest: string[], tagsNotExistanceCheck: string[], checkExistOrNotExist: boolean): string[] {
        let files : TFile[] = []
        filesWithTagToTest.forEach(tag => {
            const fileWithTag : TFile[] = filesWhereTagIsUsed(tag).map(filePath => this.app.vault.getAbstractFileByPath(filePath) as TFile);
            files = files.concat(fileWithTag);
        })
        
        const linkedFiles = files.filter(file => {
            console.log("=== file === " + file.path);
            const backLinkItems = this.getBacklinks(file);
            if (tagsNotExistanceCheck.length === 0) {
                // test different thing: if no backlinks, then return true
                if (backLinkItems.length === 0) {
                    return !checkExistOrNotExist ? true : false;
                } else {
                    return !checkExistOrNotExist ? false : true;
                }
            } else {
                for (let i = 0; i < backLinkItems.length; i++) {
                    const filePath = backLinkItems[i];
                    let noteType = getNoteType(filePath);
                    console.log("=== filePath === " + filePath + " : noteType = " + noteType?.type);
                    for (let j = 0; j < tagsNotExistanceCheck.length; j++) {
                        if ("#" + noteType?.type === tagsNotExistanceCheck[j]) {
                            return !checkExistOrNotExist ? false : true;
                        }
                    }
                }
                return !checkExistOrNotExist ? true : false;
            }
        });
        return linkedFiles.map(file => file.path);
    }


    private getBacklinks(file: TFile): string[] {
        let backLinkItems = []
        const backlinks = this.app.metadataCache.getBacklinksForFile(file)
        //console.log(backlinks)
        const backlinksData = backlinks?.data
        //console.log(backlinksData)
        if (backlinksData) {
            for (let [i, v] of backlinksData.entries()) {
                //console.log("i = " + i + " : " + v)
                for (let j = 0; j < v.length; j++) {
                    const key = v[j]['key']
                    if (key) {
                        // ignore as it is child note
                    } else {
                        backLinkItems.push(i)
                    }
                    
                }
            }
            // then sort and remove duplicates
            backLinkItems = [...new Set(backLinkItems)]
            backLinkItems.sort((a, b) => a.localeCompare(b))
            // then return
            return backLinkItems
        }
        return []
    }
}
