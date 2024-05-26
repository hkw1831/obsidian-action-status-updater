import { App, Editor, MarkdownView, Notice, TFile, TextFileView, Vault, Workspace } from "obsidian"

// if headingLine < 0, meaning insert first or last of notes
// else insert first or last of heading line
export function addTextToNotes(textToAdd: string, toPath: string, app: App, insertFromBeginning: boolean, headingLine: number) {
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
        const trimmedLink = link.trim().replace(/^- /, '')
        if (editor.getValue().includes(trimmedLink)) {
            const errorReason = `Link ${trimmedLink} already exists in ${toPath}!`
            new Notice(errorReason)

            // Then scroll to that line
            for (let i = 0; i < editor.lineCount(); i++) {
                if (editor.getLine(i).includes(trimmedLink)) {
                    editor.setCursor({line: i, ch: 0})
                    editor.scrollIntoView({from: {line: i, ch: 0}, to: {line: i, ch: 0}}, true)
                    break
                }
            }
        } else {
            if (headingLine < 0) {
                const newValue = insertFromBeginning ? 
                getNoteValueInsertingTextFromStartOfNotes(value, link) : 
                getNoteValueInsertingTextFromEndOfNotes(value, link)
                markdownView.setViewData(newValue, false)
                editor.setValue(newValue)
                if (insertFromBeginning) {
                    const frontMatterRegex = /^(---\n[\s\S]*?\n---\n)/gm
                    if (frontMatterRegex.test(value)) {
                        const lineAfterFrontMatter = getLineAfterFrontMatter(value)
                        editor.setCursor({ line: lineAfterFrontMatter, ch: 0 }) 
                        editor.scrollIntoView({from: {line: lineAfterFrontMatter, ch: 0}, to: {line: lineAfterFrontMatter, ch: 0}}, true)
                    } else {
                        editor.setCursor({ line: 0, ch: 0 })
                        editor.scrollIntoView({from: {line: 0, ch: 0}, to: {line: 0, ch: 0}}, true)
                    }
                } else {
                    const lastLineNum = editor.lineCount() - 1
                    editor.setCursor({ line: lastLineNum, ch: 0 })
                    editor.scrollIntoView({from: {line: lastLineNum, ch: 0}, to: {line: lastLineNum, ch: 0}}, true)
                }
                new Notice(`Added link to ${insertFromBeginning ? "beginning" : "end"} of ${toPath}!`);
            } else {
                const newValue: NotesWithCursorLine = insertFromBeginning ? 
                getNoteValueInsertingTextFromStartOfNotesHeading(value, link, headingLine) : 
                getNoteValueInsertingTextFromEndOfNotesHeading(value, link, headingLine)
                markdownView.setViewData(newValue.value, false)
                editor.setValue(newValue.value)
                editor.setCursor({line: newValue.line, ch: 0})
                editor.scrollIntoView({from: {line: newValue.line, ch: 0}, to: {line: newValue.line, ch: 0}}, true)
                new Notice(`Added link to ${insertFromBeginning ? "beginning" : "end"} of Section of ${toPath}!`);
                /*
                if (insertFromBeginning) {
                    const frontMatterRegex = /^(---\n[\s\S]*?\n---\n)/gm
                    if (frontMatterRegex.test(value)) {
                        const lineAfterFrontMatter = getLineAfterFrontMatter(value)
                        editor.setCursor({ line: lineAfterFrontMatter, ch: 0 }) 
                        editor.scrollIntoView({from: {line: lineAfterFrontMatter, ch: 0}, to: {line: lineAfterFrontMatter, ch: 0}}, true)
                    } else {
                        editor.setCursor({ line: 0, ch: 0 })
                        editor.scrollIntoView({from: {line: 0, ch: 0}, to: {line: 0, ch: 0}}, true)
                    }
                } else {
                    const lastLineNum = editor.lineCount() - 1
                    editor.setCursor({ line: lastLineNum, ch: 0 })
                    editor.scrollIntoView({from: {line: lastLineNum, ch: 0}, to: {line: lastLineNum, ch: 0}}, true)
                }
                */
               
            }
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

export interface NotesWithCursorLine {
    value: string,
    line: number
}

function getNoteValueInsertingTextFromStartOfNotesHeading(value: string, text: string, headingLine: number) : NotesWithCursorLine{
    const values: string[] = value.split("\n")
    let result = ""
    let addedLine = -1
    let isAddedLine = false
    for (let i = 0; i < values.length; i++) {
        if (i <= headingLine) {
            result += values[i] + "\n"
        } else if (values[i].trim() === "") {
            result += values[i] + "\n"
        } else if (!isAddedLine) {
            result += text + "\n" + values[i] + "\n"
            addedLine = i
            isAddedLine = true
        } else {
            result += values[i] + "\n"
        }
    }
    return {value: result.replace(/\n$/, ""), line: isAddedLine ? addedLine : headingLine}
}

function getNoteValueInsertingTextFromEndOfNotesHeading(value: string, text: string, headingLine: number) : NotesWithCursorLine{
    const values: string[] = value.split("\n")

    let addedLine = headingLine 

    let endLineOfSection = values.length - 1
    // first get range of the header
    for (let i = headingLine; i < values.length; i++) {
        if (i === headingLine) {
            
        } else {
            if (/^[#]{1,6} /.test(values[i])) {
                endLineOfSection = i - 1
                break
            }
        }
    }
    //console.log(headingLine + " " + endLineOfSection)
    //console.log(values[endLineOfSection])
    let finish = false
    // then get last line of range which is non-empty
    for (let i = endLineOfSection; i > headingLine && !finish; i--) {
        if (values[i].trim() !== "") {
            addedLine = i
            finish = true
        }
    }
    //console.log(addedLine)
    //console.log(values[addedLine])
    // then add in this line
    let result = ""
    for (let i = 0; i < values.length; i++) {
        if (i != addedLine) {
            result += values[i] + "\n"
        } else {
            result += values[i] + "\n" + text + "\n"
        }
    }

    return {value: result.replace(/\n$/, ""), line: addedLine + 1}
}

