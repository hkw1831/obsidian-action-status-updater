import { Editor, EditorSelection } from "obsidian"

export function exportCurrentSelection(editor: Editor): string {
    let text = ""
    const listSelections: EditorSelection[] = editor.listSelections()
    listSelections.forEach(listSelection => {
        const a = listSelection.head.line
        const b = listSelection.anchor.line
        const fromLineNum = b > a ? a : b
        const toLineNum = b > a ? b : a
        for (let i = fromLineNum; i <= toLineNum; i++) {
            const line = editor.getLine(i)
            text += line + "\n"
        }
    })
    return text.replace(/\n$/, "")
}