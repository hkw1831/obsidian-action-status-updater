import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile } from "obsidian";
import { removeContentFromCursorToEndOfNote, removeContentFromStartOfNoteToCursor, removeContentLeftSameLine, removeContentRightSameLine } from "selfutil/removeContentFromCursor";

export class RemoveContentFromCursorModal extends FuzzySuggestModal<string> {

  removeContentLeftSameLine : string = "Remove content left same line"
  removeContentRightSameLine : string = "Remove content right same line"
  removeContentFromStartOfNoteToCursor: string = "Remove content from start of note to cursor"
  removeContentFromCursorToEndOfNote: string = "Remove content from cursor to end of note"

  options: string[] = [this.removeContentLeftSameLine, this.removeContentRightSameLine, this.removeContentFromStartOfNoteToCursor, this.removeContentFromCursorToEndOfNote]
  editor: Editor;

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
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
    el.createEl("div", { text: item });
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
    }
  }
}