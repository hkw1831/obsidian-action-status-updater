import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile } from "obsidian";
import { copyContentFromCursorToEndOfNote, copyContentFromStartOfNoteToCursor, removeContentFromCursorToEndOfNote, removeContentFromStartOfNoteToCursor, removeContentLeftSameLine, removeContentRightSameLine } from "selfutil/removeContentFromCursor";

export class RemoveContentFromCursorModal extends FuzzySuggestModal<string> {

  copyContentFromCursorToEndOfNote: string = "Copy content from cursor to end of note"
  cutContentFromCursorToEndOfNote: string = "Cut content from cursor to end of note"
  copyContentFromStartOfNoteToCursor: string = "Copy content from start of note to cursor"
  cutContentFromStartOfNoteToCursor: string = "Cut content from start of note to cursor"
  removeContentLeftSameLine : string = "Remove content left same line"
  removeContentRightSameLine : string = "Remove content right same line"
  removeContentFromStartOfNoteToCursor: string = "Remove content from start of note to cursor"
  removeContentFromCursorToEndOfNote: string = "Remove content from cursor to end of note"

  options: string[] = [this.copyContentFromCursorToEndOfNote, this.cutContentFromCursorToEndOfNote, this.copyContentFromStartOfNoteToCursor, this.cutContentFromStartOfNoteToCursor, this.removeContentLeftSameLine, this.removeContentRightSameLine, this.removeContentFromStartOfNoteToCursor, this.removeContentFromCursorToEndOfNote]
  editor: Editor;
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'X') { // windows
        this.close();
      } else if (event.ctrlKey && event.metaKey && event.shiftKey && event.key === 'X') { // macos
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

  selectElement(index: number) {
    const elements = this.resultContainerEl.querySelectorAll('.suggestion-item');
    if (elements.length > index) {
      const element = elements[index] as HTMLElement;
      element.click(); // Simulate a click to select the element
    }
  }

  onClose() {
    super.onClose();
    // Stop listening for keydown events when the modal is closed
    document.removeEventListener('keydown', this.keydownHandler);
    //this.scope.unregister(); // Unregister the scope when the modal is closed
  }

  getItems(): string[] {
    return this.options;
  }

  getItemText(item: string): string {
    return item;
  }

  // Renders each suggestion item.
  renderSuggestion(i: FuzzyMatch<string>, el: HTMLElement) {
    const item = i.item
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + item });
  }

  // Perform action on the selected suggestion.
  async onChooseItem(selectedContent: string, evt: MouseEvent | KeyboardEvent) {
    const choosenOption = selectedContent
    if (choosenOption === this.removeContentLeftSameLine) {
      removeContentLeftSameLine(this.editor)
    } else if (choosenOption === this.removeContentRightSameLine) {
      removeContentRightSameLine(this.editor)
    } else if (choosenOption === this.removeContentFromStartOfNoteToCursor) {
      removeContentFromStartOfNoteToCursor(this.editor)
    } else if (choosenOption === this.removeContentFromCursorToEndOfNote) {
      removeContentFromCursorToEndOfNote(this.editor)
    } else if (choosenOption === this.copyContentFromCursorToEndOfNote) {
      copyContentFromCursorToEndOfNote(this.editor)
    } else if (choosenOption === this.cutContentFromCursorToEndOfNote) {
      copyContentFromCursorToEndOfNote(this.editor)
      removeContentFromCursorToEndOfNote(this.editor)
    } else if (choosenOption === this.copyContentFromStartOfNoteToCursor) {
      copyContentFromStartOfNoteToCursor(this.editor)
    } else if (choosenOption === this.cutContentFromStartOfNoteToCursor) {
      copyContentFromCursorToEndOfNote(this.editor)
      removeContentFromStartOfNoteToCursor(this.editor)
    }
  }
}