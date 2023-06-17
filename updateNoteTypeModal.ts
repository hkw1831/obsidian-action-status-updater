import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface NoteType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "b/n/u",
    description: "Zettelkasten - Unprocessed material - add 1+ HQ&A Here",
  },
  {
    type: "b/n/c",
    description: "Zettelkasten - Cards (With omni writing method)",
  },
  {
    type: "b/n/r",
    description: "Zettelkasten - Reference",
  },
  {
    type: "b/n/m",
    description: "Zettelkasten - MOC Notes",
  },
  {
    type: "b/n/s",
    description: "Zettelkasten - Slip box",
  },
  {
    type: "b/n/i",
    description: "Index Notes",
  },
  {
    type: "b/a/p",
    description: "Area of Responsibility - Primary",
  },
  {
    type: "b/a/s",
    description: "Area of Responsibility - Secondary",
  },
  {
    type: "c/b/d",
    description: "Blog post draft",
  },
  {
    type: "c/b/o",
    description: "Blog post outlined",
  },
  {
    type: "c/b/s",
    description: "Blog post raw scripted",
  },
  {
    type: "c/b/f",
    description: "Blog post fine tuned",
  },
  {
    type: "c/b/p",
    description: "Blog post published",
  },
  {
    type: "c/b/a",
    description: "Blog post abandoned",
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