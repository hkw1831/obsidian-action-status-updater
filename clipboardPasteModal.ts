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

  // Renders each suggestion item.
  renderSuggestion(i: FuzzyMatch<string>, el: HTMLElement) {
    const item = i.item
    //el.createEl("div", { text: item });
    el.createEl("div", { text: "• " + item.replace(/\n/gm, "").substring(0, 100) });
  }

  // Perform action on the selected suggestion.
  onChooseItem(selectedContent: string, evt: MouseEvent | KeyboardEvent) {
    const index = this.clipboardContent.indexOf(selectedContent, 0);
    if (index > -1) {
      this.clipboardContent.splice(index, 1);
    }
    this.clipboardContent.push(selectedContent);
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