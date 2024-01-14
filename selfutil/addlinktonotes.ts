import { App, Notice, TFile, TextFileView, Vault, Workspace } from "obsidian"

export function addLinkToNotes(linkToAdd: string, toPath: string, app: App, insertFromBeginning: boolean) {
    const vault: Vault = this.app.vault;
    const workspace: Workspace = this.app.workspace
    const leaf = workspace.getLeaf(false);
    const tFile: TFile = vault.getAbstractFileByPath(toPath) as TFile
    const link = "[[" + linkToAdd + "]]"
    Promise.resolve()
    .then(() => {
        return leaf.openFile(tFile, { active: true });
    })
    .then(() => {
        const editor = app.workspace.getActiveViewOfType(TextFileView);
        const value = editor?.getViewData()
        if (editor == null || value == null) {
            const errorReason = `editor or value ${toPath} not exist. Aborting...`
            return Promise.reject(errorReason)
        }
        
        if (value.includes(link)) {
            const errorReason = `Link ${link} already exists in ${toPath}!`
            new Notice(errorReason)
        } else {
            const newValue = insertFromBeginning ? 
            getNoteValueInsertingNoteLinkFromStartOfNotes(value, link) : 
            getNoteValueInsertingNoteLinkFromEndOfNotes(value, link)
            editor.setViewData(newValue, false)
            new Notice(`Added link to ${insertFromBeginning ? "beginning" : "end"} of ${toPath}!`);
        }
        return Promise.resolve()
    })
    .catch((reason) => { 
        new Notice(reason)
    })
    /* this version cannot redo, can remove if above
    Promise.resolve()
        .then(() => {
            return vault.read(tFile)
        }, reason => { new Notice("Error occurred when reading " + toPath) })
        .then((value) => {
            if (value.includes(link)) {
                const errorReason = `Link ${linkToAdd} already exists in ${toPath}!`
                return Promise.reject(errorReason)
            }
            const newValue = insertFromBeginning ? 
                getNoteValueInsertingNoteLinkFromStartOfNotes(value, link) : 
                getNoteValueInsertingNoteLinkFromEndOfNotes(value, link)
            return vault.modify(tFile, newValue)
        })
        .then(() => {
            new Notice(`Added link to ${insertFromBeginning ? "beginning" : "end"} of ${toPath}!`);
            const leaf = workspace.getLeaf(false);
            return leaf.openFile(tFile, { active: true });
        }, (reason) => { 
            new Notice(reason) 
            const leaf = workspace.getLeaf(false);
            return leaf.openFile(tFile, { active: true });
        })
        */
}

function getNoteValueInsertingNoteLinkFromStartOfNotes(value: string, link: string) {
    const frontMatterRegex = /^(---\n[\s\S]*?\n---\n)/gm
    // /^---\n(.*)*\n---\n/
    if (frontMatterRegex.test(value)) {
        return value.replace(frontMatterRegex, "$1- " + link + "\n")
    } else {
        return "- " + link + "\n" + value
    }
}

function getNoteValueInsertingNoteLinkFromEndOfNotes(value: string, link: string) {
    return value + "\n- " + link
}