import { Editor, Notice } from "obsidian"

export function removeContentFromStartOfNoteToCursor(editor: Editor) {
    const cursor = editor.getCursor()
    const line = cursor.line
    const ch = cursor.ch
    const lineContent = editor.getLine(line)
    // remove content from first character to ch character of lineContent
    let newContent = lineContent.substring(ch)
    for (let i = line + 1; i < editor.lineCount(); i++) {
        newContent += "\n" + editor.getLine(i)
    }
    editor.setValue(newContent)
    cursor.line = 0
    cursor.ch = 0
    editor.setCursor(cursor)
}

export function removeContentFromCursorToEndOfNote(editor: Editor) {
    const cursor = editor.getCursor()
    const line = cursor.line
    const ch = cursor.ch
    const lineContent = editor.getLine(line)
    let newContent = ""
    for (let i = 0; i < line; i++) {
        newContent += editor.getLine(i) + "\n"
    }
    newContent += lineContent.substring(0, ch)
    editor.setValue(newContent)
    cursor.line = line
    cursor.ch = ch
    editor.setCursor(cursor)
}

export function copyContentFromStartOfNoteToCursor(editor: Editor) {
    const cursor = editor.getCursor()
    const line = cursor.line
    const ch = cursor.ch
    let newContent = ""
    for (let i = 0; i < line; i++) {
        newContent += editor.getLine(i) + "\n"
    }
    const lineContent = editor.getLine(line)
    newContent += lineContent.substring(0, ch)
    navigator.clipboard.writeText(newContent).then(function () {
        new Notice(`Copied content from cursor to end of note to clipboard!`);
    }, function (error) {
        new Notice(`error when copy to clipboard!`);
    });
}

export function copyContentFromCursorToEndOfNote(editor: Editor) {
    const cursor = editor.getCursor()
    const line = cursor.line
    const ch = cursor.ch
    const lineContent = editor.getLine(line)
    let newContent = ""
    newContent += lineContent.substring(ch)
    for (let i = line + 1; i < editor.lineCount(); i++) {
        newContent += "\n" + editor.getLine(i)
    }
    navigator.clipboard.writeText(newContent).then(function () {
        new Notice(`Copied content from cursor to end of note to clipboard!`);
    }, function (error) {
        new Notice(`error when copy to clipboard!`);
    });
}

export function removeContentLeftSameLine(editor: Editor) {
    const cursor = editor.getCursor()
    const line = cursor.line
    const ch = cursor.ch
    const lineContent = editor.getLine(line)
    // remove content from first character to ch character of lineContent
    editor.setLine(line, lineContent.substring(ch))
    cursor.ch = 0
    editor.setCursor(cursor)
}

export function removeContentRightSameLine(editor: Editor) {
    const cursor = editor.getCursor()
    const line = cursor.line
    const ch = cursor.ch
    const lineContent = editor.getLine(line)
    // remove content from ch character to end of lineContent
    editor.setLine(line, lineContent.substring(0, ch))
    cursor.ch = editor.getLine(line).length
    editor.setCursor(cursor)
}