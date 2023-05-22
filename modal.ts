import { App, Editor, Notice, SuggestModal } from "obsidian";

interface NoteType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "b/r",
    description: "Raw Notes",
  },
  {
    type: "b/c",
    description: "Coarse Notes",
  },
  {
    type: "b/f",
    description: "Fine Notes",
  },
  {
    type: "b/p",
    description: "Permanent Notes",
  },
  {
    type: "b/pt",
    description: "Permanent Notes (Tutorial)",
  },
  {
    type: "b/pw",
    description: "Permanent Notes (Workflow)",
  },
  {
    type: "b/pc",
    description: "Permanent Notes (Concept)",
  },
  {
    type: "b/pf",
    description: "Permanent Notes (Fact)",
  },
  {
    type: "b/pr",
    description: "Permanent Notes (References)",
  },
  {
    type: "b/i",
    description: "Index Notes",
  },
  {
    type: "a/blog",
    description: "Blog post in progress",
  },
  {
    type: "a/published",
    description: "Blog post published",
  },
  {
    type: "a/nn",
    description: "N Current Task",
  },
  {
    type: "a/nl",
    description: "N Later Task",
  },
  {
    type: "a/nw",
    description: "N Waiting Task",
  },
  {
    type: "a/nd",
    description: "N Done Task",
  },
  {
    type: "a/na",
    description: "N Archive Task",
  },
  {
    type: "a/wn",
    description: "W Current Task",
  },
  {
    type: "a/wl",
    description: "W Later Task",
  },
  {
    type: "a/ww",
    description: "W Waiting Task",
  },
  {
    type: "a/wd",
    description: "W Done Task",
  },
  {
    type: "a/wa",
    description: "W Archive Task",
  },
];

export class UpdateNoteTypeModal extends SuggestModal<NoteType> {

  editor: Editor

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
  }
  // Returns all available suggestions.
  getSuggestions(query: string): NoteType[] {
    return ALL_TYPES.filter((noteType) =>
        noteType.type.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Renders each suggestion item.
  renderSuggestion(noteType: NoteType, el: HTMLElement) {
    el.createEl("div", { text: noteType.type });
    el.createEl("small", { text: noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  onChooseSuggestion(choosenNoteType: NoteType, evt: MouseEvent | KeyboardEvent) {
    new Notice(`Selected ${choosenNoteType.type}`);

    const cursor = this.editor.getCursor();
    const lineNumber = this.editor.getCursor().line;
    const line = this.editor.getLine(lineNumber);


    if (this.containsType(line))
    {
        let replacedLine = line
        ALL_TYPES.forEach((noteType) => replacedLine = replacedLine.replace(noteType.type, choosenNoteType.type))
        this.editor.setLine(lineNumber, replacedLine);
        this.editor.setCursor(cursor);	 	 
    }
    else
    {
        const replacedStr = `---\ntag: ${choosenNoteType.type}\n---\n\n`
        this.editor.replaceRange(replacedStr, cursor);
        cursor.ch = cursor.ch + replacedStr.length;
        this.editor.setCursor(cursor);
    }
  }
}