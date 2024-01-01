import { App, Editor, FuzzySuggestModal, FuzzyMatch, Notice } from "obsidian";

export class ClipboardRemovalModal extends FuzzySuggestModal<string> {

  editor: Editor

  clipboardContent: string[]

  REMOVE_ALL : string = "REMOVE ALL"

  constructor(app: App, editor: Editor, clipboardContent: string[])
  {
    super(app)
    this.editor = editor
    this.clipboardContent = clipboardContent
  }

  getItems(): string[] {
    return [...[this.REMOVE_ALL], ...this.clipboardContent.reverse()];
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
    if (selectedContent === this.REMOVE_ALL) {
      new Notice("haha")
      while(this.clipboardContent.length > 0) {
        this.clipboardContent.pop();
      }
    } else {
      const index = this.clipboardContent.indexOf(selectedContent, 0);
      if (index > -1) {
        this.clipboardContent.splice(index, 1);
      }  
    }
    /*
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
    */
  }
}