import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

export class ClipboardPasteModal extends FuzzySuggestModal<string> {

  editor: Editor

  clipboardContent: string[]

  constructor(app: App, editor: Editor, clipboardContent: string[])
  {
    super(app)
    this.editor = editor
    this.clipboardContent = clipboardContent
  }

  getItems(): string[] {
    return this.clipboardContent.reverse();
  }

  getItemText(item: string): string {
    return item;
  }

  //static removeTag(line: string): string {
  //  ALL_TYPES.forEach((noteType) => line = line.replace(`#${noteType.type} `, ''))
  //  return line
  //}

  // Renders each suggestion item.
  renderSuggestion(i: FuzzyMatch<string>, el: HTMLElement) {
    const item = i.item
    el.createEl("div", { text: item });
  }

  //containsType(line: String) : Boolean {
  //  return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  //}

  // Perform action on the selected suggestion.
  onChooseItem(selectedContent: string, evt: MouseEvent | KeyboardEvent) {
    const selection = this.editor.getSelection()
    const replacedStr = selectedContent
    if (selection.length != 0) {
        this.editor.replaceSelection(replacedStr);
    } else {
        const cursor = this.editor.getCursor();
        this.editor.replaceRange(replacedStr, cursor);
        cursor.ch = cursor.ch + replacedStr.length;
        this.editor.setCursor(cursor);
    }
  }
}