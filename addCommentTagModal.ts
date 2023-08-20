import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface FootnoteType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "d/question",
    description: "Question"
  },
  {
    type: "d/answer",
    description: "Answer"
  },
  {
    type: "d/solves",
    description: "Solves some problem"
  },
  {
    type: "d/ref",
    description: "Reference"
  },
  {
    type: "d/selfthink",
    description: "Self think"
  },
  {
    type: "d/notsure",
    description: "Not sure"
  },
  {
    type: "d/a1⏹️",
    description: "A1 - my experience"
  },
  {
    type: "d/a2⏺️",
    description: "A2 - future action"
  },
  {
    type: "d/c🔄",
    description: "Context"
  },
  {
    type: "d/w⏪",
    description: "Idea Compass - West - What are similar / supporting idea?"
  },
  {
    type: "d/n⏫",
    description: "Idea Compass - North - Where does this idea come from?"
  },
  {
    type: "d/s⏬",
    description: "Idea Compass - South - Where does the idea lead to?"
  },
  {
    type: "d/toMerge",
    description: "TODO - To Merge with another note"
  },
  {
    type: "d/toMove",
    description: "TODO - To Merge with another note"
  },
  {
    type: "d/toSplit",
    description: "ToDO - To Split to multiple note"
  },
  {
    type: "d/toCard",
    description: "TODO - To Write card"
  },
];

export class AddFootnoteTagModal extends FuzzySuggestModal<FootnoteType> {

  editor: Editor

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
  }

  getItems(): FootnoteType[] {
    return ALL_TYPES;
  }

  getItemText(noteType: FootnoteType): string {
    return noteType.type;
  }

  static removeTag(line: string): string {
    ALL_TYPES.forEach((noteType) => line = line.replace(`#${noteType.type} `, ''))
    return line
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<FootnoteType>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    el.createEl("div", { text: noteType.type });
    el.createEl("small", { text: noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenNoteType: FootnoteType, evt: MouseEvent | KeyboardEvent) {
    const selection = this.editor.getSelection()
    const replacedStr = `#${choosenNoteType.type} `
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