import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface CommentType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "c/h",
    description: "HQ&A - Highlight"
  },
  {
    type: "c/q",
    description: "HQ&A - Question"
  },
  {
    type: "c/a",
    description: "HQ&A - Answer"
  },
  {
    type: "c/h",
    description: "Card - Header 標題"
  },
  {
    type: "c/s",
    description: "Card - Statement 觀點"
  },
  {
    type: "c/e",
    description: "Card - Explaination 案例"
  },
  {
    type: "c/c",
    description: "Card - Conclusion 總結"
  },
  {
    type: "c/eastOppositeNote",
    description: "Idea Compass - East - What competes with this idea?"
  },
  {
    type: "c/westSimilarNote",
    description: "Idea Compass - West - What are similar / supporting idea?"
  },
  {
    type: "c/northThemeNote",
    description: "Idea Compass - North - Where does this idea come from?"
  },
  {
    type: "c/southLeadsToNote",
    description: "Idea Compass - South - Where does the idea lead to?"
  },
];

export class AddCommentTagModal extends FuzzySuggestModal<CommentType> {

  editor: Editor

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
  }

  getItems(): CommentType[] {
    return ALL_TYPES;
  }

  getItemText(noteType: CommentType): string {
    return noteType.type;
  }

  static removeTag(line: string): string {
    ALL_TYPES.forEach((noteType) => line = line.replace(`#${noteType.type} `, ''))
    return line
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<CommentType>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    el.createEl("div", { text: noteType.type });
    el.createEl("small", { text: noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenNoteType: CommentType, evt: MouseEvent | KeyboardEvent) {
    const selection = this.editor.getSelection()
    const replacedStr = `#${choosenNoteType.type} `
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