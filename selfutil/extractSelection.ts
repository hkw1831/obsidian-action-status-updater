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

export interface SelectionRange {
    fromLineNum: number
    fromCh: number
    toLineNum: number
    toCh: number
}

// assume 1 selection
export function getCurrentSelectionLineNumber(editor: Editor): SelectionRange {
    let text = ""
    let fromLineNum = 0
    let fromCh = 0
    let toLineNum = 0
    let toCh = 0
    const listSelections: EditorSelection[] = editor.listSelections()
    listSelections.forEach(listSelection => {
        const a = listSelection.head.line
        const ach = listSelection.head.ch
        const b = listSelection.anchor.line
        const bch = listSelection.anchor.ch
        fromLineNum = b > a ? a : b
        fromCh = b > a ? ach : bch
        toLineNum = b > a ? b : a
        toCh = b > a ? bch : ach
    })
    return { fromLineNum, fromCh, toLineNum, toCh }
}