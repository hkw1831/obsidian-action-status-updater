import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface NoteType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "b/t/r",
    description: "Transient Notes - Raw Stage",
  },
  {
    type: "b/t/c",
    description: "Transient Notes - Coarse Stage",
  },
  {
    type: "b/t/o",
    description: "Transient Notes - Outline Stage",
  },
  {
    type: "b/t/f",
    description: "Transient Notes - Fine Stage",
  },
  {
    type: "b/o/i",
    description: "Index Notes",
  },
  {
    type: "b/o/m",
    description: "MOC Notes",
  },
  {
    type: "b/o/p",
    description: "People Notes",
  },
  {
    type: "b/o/z",
    description: "Zettelkasten Index Notes",
  },
  {
    type: "b/p/t",
    description: "Permanent Notes - Tutorial",
  },
  {
    type: "b/p/w",
    description: "Permanent Notes - Workflow",
  },
  {
    type: "b/p/c",
    description: "Permanent Notes - Concept",
  },
  {
    type: "b/p/f",
    description: "Permanent Notes - Fact",
  },
  {
    type: "b/p/r",
    description: "Permanent Notes - References",
  },
  {
    type: "b/p/m",
    description: "Permanent Notes - Meta Knowledge",
  },
  {
    type: "b/b/d",
    description: "Blog post draft",
  },
  {
    type: "b/b/o",
    description: "Blog post outlined",
  },
  {
    type: "b/b/s",
    description: "Blog post raw scripted",
  },
  {
    type: "b/b/f",
    description: "Blog post fine tuned",
  },
  {
    type: "b/b/p",
    description: "Blog post published",
  },
  {
    type: "a/n/n",
    description: "N Current Task",
  },
  {
    type: "a/n/l",
    description: "N Later Task",
  },
  {
    type: "a/n/w",
    description: "N Waiting Task",
  },
  {
    type: "a/n/d",
    description: "N Done Task",
  },
  {
    type: "a/n/a",
    description: "N Archive Task",
  },
  {
    type: "a/n/p",
    description: "N Permanent Task",
  },
  {
    type: "a/w/n",
    description: "W Current Task",
  },
  {
    type: "a/w/l",
    description: "W Later Task",
  },
  {
    type: "a/w/w",
    description: "W Waiting Task",
  },
  {
    type: "a/w/d",
    description: "W Done Task",
  },
  {
    type: "a/w/a",
    description: "W Archive Task",
  },
  {
    type: "a/w/p",
    description: "W Permanent Task",
  },
];

export class UpdateNoteTypeModal extends FuzzySuggestModal<NoteType> {

  editor: Editor

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
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
    el.createEl("div", { text: noteType.type });
    el.createEl("small", { text: noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenNoteType: NoteType, evt: MouseEvent | KeyboardEvent) {
    const selection = this.editor.getSelection()
    const replacedStr = `---\ntag: ${choosenNoteType.type}\n---\n\n`
    if (selection.length != 0) {
        this.editor.replaceSelection(replacedStr);
    } else {
        const cursor = this.editor.getCursor();
        const lineNumber = this.editor.getCursor().line;
        const line = this.editor.getLine(lineNumber);

        if (this.containsType(line)){
            let replacedLine = line
            ALL_TYPES.forEach((noteType) => replacedLine = replacedLine.replace(noteType.type, choosenNoteType.type))
            this.editor.setLine(lineNumber, replacedLine);
            this.editor.setCursor(cursor);	 	 
        } else {
            this.editor.replaceRange(replacedStr, cursor);
            cursor.ch = cursor.ch + replacedStr.length;
            this.editor.setCursor(cursor);
        }
    }
  }
}