import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

export class ClipboardPasteModal extends FuzzySuggestModal<string> {

  editor: Editor

  clipboardContent: string[]

  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, editor: Editor, clipboardContent: string[])
  {
    super(app)
    this.editor = editor
    this.clipboardContent = clipboardContent
    this.setPlaceholder(`Which clipboard content do you want to paste?`)
    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.metaKey && event.shiftKey && event.key === 'V') { // macos
        this.close();
      } else if (event.metaKey || event.ctrlKey) {
        const key = parseInt(event.key, 10);
        if (key >= 1 && key <= 9) {
          event.preventDefault(); // Prevent default action
          this.selectElement(key - 1); // Select the element (index key - 1)
        }
      }
    };

    // Listen for keydown events at the document level
    document.addEventListener('keydown', this.keydownHandler);
  }

  onClose() {
    super.onClose();
    // Stop listening for keydown events when the modal is closed
    document.removeEventListener('keydown', this.keydownHandler);
  }

  selectElement(index: number) {
    const elements = this.resultContainerEl.querySelectorAll('.suggestion-item');
    if (elements.length > index) {
      const element = elements[index] as HTMLElement;
      element.click(); // Simulate a click to select the element
    }
  }

  getItems(): string[] {
    return this.clipboardContent.slice().reverse();
  }

  getItemText(item: string): string {
    return item;
  }

  // Renders each suggestion item.
  renderSuggestion(i: FuzzyMatch<string>, el: HTMLElement) {
    const item = i.item
    //el.createEl("div", { text: item });
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + item.replace(/\n/gm, "").substring(0, 100) });
  }

  // Perform action on the selected suggestion.
  onChooseItem(selectedContent: string, evt: MouseEvent | KeyboardEvent) {
    const index = this.clipboardContent.indexOf(selectedContent, 0);
    if (index > -1) {
      this.clipboardContent.remove(selectedContent);
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