import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface FootnoteType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "f/h",
    description: "HQ&A - Highlight"
  },
  {
    type: "f/q",
    description: "HQ&A - Question"
  },
  {
    type: "f/a",
    description: "HQ&A - Answer"
  },
  {
    type: "f/t",
    description: "Card - Title 標題"
  },
  {
    type: "f/s",
    description: "Card - Statement 觀點：自己的一句敍述 / 想法"
  },
  {
    type: "f/e",
    description: "Card - Explaination 案例：增加一些範例（故事 / 數據 / 生活經驗 / 解釋 / 原因）說明觀點"
  },
  {
    type: "f/c",
    description: "Card - Conclusion 總結：用一至兩句話做結論"
  },
  {
    type: "f/e⏩",
    description: "Idea Compass - East - What competes with this idea?"
  },
  {
    type: "f/w⏪",
    description: "Idea Compass - West - What are similar / supporting idea?"
  },
  {
    type: "f/n⏫",
    description: "Idea Compass - North - Where does this idea come from?"
  },
  {
    type: "f/s⏬",
    description: "Idea Compass - South - Where does the idea lead to?"
  },
  {
    type: "f/eastOppositeNote",
    description: "Idea Compass - East - What competes with this idea?"
  },
  {
    type: "f/westSimilarNote",
    description: "Idea Compass - West - What are similar / supporting idea?"
  },
  {
    type: "f/northThemeNote",
    description: "Idea Compass - North - Where does this idea come from?"
  },
  {
    type: "f/southLeadsToNote",
    description: "Idea Compass - South - Where does the idea lead to?"
  },
  {
    type: "f/toMerge",
    description: "TODO - To Merge with another note"
  },
  {
    type: "f/toSplit",
    description: "ToDO - To Split to multiple note"
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