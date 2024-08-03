import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile, Notice } from "obsidian";
import { hasFrontMatter, hasTags, renameTag } from "tagrenamer/renaming";
import { NoteType, ALL_TYPES } from "selfutil/getTaskTag";

export class UpdateNoteTypeModal extends FuzzySuggestModal<NoteType> {

  editor: Editor
  file: TFile
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, editor: Editor, file: TFile)
  {
    super(app)
    this.editor = editor
    this.file = file
    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'C') { // windows
        this.close();
      } else if (event.ctrlKey && event.metaKey && event.shiftKey && event.key === 'C') { // macos
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

  getItems(): NoteType[] {
    return ALL_TYPES;
  }

  getItemText(noteType: NoteType): string {
    return noteType.type;
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<NoteType>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + noteType.type });
    el.createEl("small", { text: "     " + noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  addFrontMatterWithTag(value: string) {
    const cursor = this.editor.getCursor()
    const oldLine = cursor.line
    const oldCh = cursor.ch
    const addText = `---\ntags: ${value}\n---\n\n${this.editor.getValue()}`
    this.editor.setValue(addText)
    cursor.line = oldLine + 4
    cursor.ch = oldCh
    this.editor.setCursor(cursor)
  }

  addTagAssumingHasFrontMatter(value: string) {
    const cursor = this.editor.getCursor()
    const oldLine = cursor.line
    const oldCh = cursor.ch

    let firstLineIndex = 0;
    const lineCount = this.editor.lineCount();
    for (let i = 0; i < lineCount; i++) {
      if (this.editor.getLine(i).trim() == "---".trim()) {
        firstLineIndex = i;
        break;
      }
    }
    if (firstLineIndex == lineCount) {
      new Notice("Something wrong here")
      return;
    }
    let text = ""
    for (let i = 0; i <= firstLineIndex; i++) {
      text = text + this.editor.getLine(i) + "\n";
    }
    text = text + `tags: ${value}\n`
    for (let i = firstLineIndex + 1; i <= this.editor.lineCount(); i++) {
      text = text + this.editor.getLine(i) + "\n";
    }

    this.editor.setValue(text)
    cursor.line = oldLine + (oldLine <= firstLineIndex ? 0 : 1)
    cursor.ch = oldCh
    this.editor.setCursor(cursor)
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenNoteType: NoteType, evt: MouseEvent | KeyboardEvent) {
    if (!hasFrontMatter(this.file)) {
      this.addFrontMatterWithTag(choosenNoteType.type)
    } else {
      if (hasTags(this.file))
      {
        ALL_TYPES.forEach(t => {
          renameTag(this.file, t.type, choosenNoteType.type)
          })
      } else {
        // new Notice("adding tag todo")
        // new File(app, this.file.path, null, 0).replaceInFrontMatter;

        // TODO add tags
        this.addTagAssumingHasFrontMatter(choosenNoteType.type)
      }
    }
  }
}