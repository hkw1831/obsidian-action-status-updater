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
    this.setPlaceholder(`Which clipboard content do you want to remove?`)
  }

  getItems(): string[] {
    return [...[this.REMOVE_ALL], ...this.clipboardContent.slice().reverse()];
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
  }
}