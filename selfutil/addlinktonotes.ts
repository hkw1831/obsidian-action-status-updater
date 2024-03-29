import { App, Editor, MarkdownView, Notice, TFile, TextFileView, Vault, Workspace } from "obsidian"

export function addTextToNotes(textToAdd: string, toPath: string, app: App, insertFromBeginning: boolean) {
    const vault: Vault = this.app.vault;
    const workspace: Workspace = this.app.workspace
    const leaf = workspace.getLeaf(false);
    const tFile: TFile = vault.getAbstractFileByPath(toPath) as TFile
    const link = textToAdd
    Promise.resolve()
    .then(() => {
        return leaf.openFile(tFile, { active: true });
    })
    .then(() => {
        //const editor = app.workspace.getActiveViewOfType(TextFileView);
        const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
        const editor = markdownView?.editor
        const value = markdownView?.getViewData()
        if (markdownView == null || editor == null || value == null) {
            const errorReason = `editor or value ${toPath} not exist. Aborting...`
            return Promise.reject(errorReason)
        }
        const trimmedLink = link.trim().replace(/^- /, ' ')
        if (editor.getValue().includes(trimmedLink)) {
            const errorReason = `Link ${trimmedLink} already exists in ${toPath}!`
            new Notice(errorReason)
        } else {
            const newValue = insertFromBeginning ? 
            getNoteValueInsertingTextFromStartOfNotes(value, link) : 
            getNoteValueInsertingTextFromEndOfNotes(value, link)
            markdownView.setViewData(newValue, false)
            if (insertFromBeginning) {
                const frontMatterRegex = /^(---\n[\s\S]*?\n---\n)/gm
                if (frontMatterRegex.test(value)) {
                    editor.setCursor({ line: getLineAfterFrontMatter(value), ch: 0 }) 
                } else {
                    editor.setCursor({ line: 0, ch: 0 })
                }
            } else {
                editor.setCursor({ line: editor.lineCount() - 1, ch: 0 })
            }
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

function getLineAfterFrontMatter(value: string) {
    const values = value.split("\n")
    let fmCount = 0
    const lineNum = values.length
    for (let i = 0; i < lineNum; i++) {
        if (values[i] === "---") {
            fmCount++
        }
        if (fmCount == 2) {
            return Math.min(i + 1, lineNum - 1)
        }
    }
    return lineNum - 1
}

function getNoteValueInsertingTextFromStartOfNotes(value: string, text: string) {
    const frontMatterRegex = /^(---\n[\s\S]*?\n---\n)/gm
    // /^---\n(.*)*\n---\n/
    if (frontMatterRegex.test(value)) {
        return value.replace(frontMatterRegex, "$1" + text + "\n")
    } else {
        return text + "\n" + value
    }
}

function getNoteValueInsertingTextFromEndOfNotes(value: string, text: string) {
    return value + "\n" + text
}