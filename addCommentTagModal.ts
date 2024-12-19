import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface FootnoteType {
  type: string;
  description: string;
  additionalInfo: string;
  chinese: string;
}

export const ALL_FOOTNOTE_TYPES = [
  {
    type: "## Event Thought / Exp / Notes : ",
    description: "",
    additionalInfo: "",
    chinese: ""
  },
  {
    type: "## Tips : ",
    description: "",
    additionalInfo: "",
    chinese: "## 訣竅："
  },
  {
    type: "## Stats : ",
    description: "",
    additionalInfo: "",
    chinese: "## 統計："
  },
  {
    type: "## Steps : ",
    description: "",
    additionalInfo: "",
    chinese: "## 步驟："
  },
  {
    type: "## Reasons : ",
    description: "",
    additionalInfo: "",
    chinese: "## 原因："
  },
  {
    type: "## Mistakes : ",
    description: "",
    additionalInfo: "",
    chinese: "## 錯誤："
  },
  {
    type: "## Benefits : ",
    description: "",
    additionalInfo: "",
    chinese: "## 好處："
  },
  {
    type: "## Lessons : ",
    description: "",
    additionalInfo: "",
    chinese: "## 教訓："
  },
  {
    type: "## Examples : ",
    description: "",
    additionalInfo: "",
    chinese: "## 例子："
  },
  {
    type: "## Questions : ",
    description: "",
    additionalInfo: "",
    chinese: "## 問題："
  },
  {
    type: "## Personal Stories : ",
    description: "",
    additionalInfo: "",
    chinese: "## 個人故事："
  },
  {
    type: "## Frameworks : ",
    description: "",
    additionalInfo: "",
    chinese: "## 框架："
  },
  {
    type: "## Observations : ",
    description: "",
    additionalInfo: "",
    chinese: "## 觀察："
  },
  {
    type: "## Rules : ",
    description: "",
    additionalInfo: "",
    chinese: "## 規則："
  },
  {
    type: "## Resources : ",
    description: "",
    additionalInfo: "",
    chinese: "## 資源："
  },
  {
    type: "## Reflections : ",
    description: "",
    additionalInfo: "",
    chinese: "## 反思："
  },
  {
    type: "## Tools : ",
    description: "",
    additionalInfo: "",
    chinese: "## 工具："
  },
  {
    type: "## Problems : ",
    description: "",
    additionalInfo: "",
    chinese: "## 問題："
  },
  {
    type: "## Solutions : ",
    description: "",
    additionalInfo: "",
    chinese: "## 解決方案："
  },
  {
    type: "## Context : ",
    description: "",
    additionalInfo: "",
    chinese: "## 情景："
  },
  {
    type: "## Analogy : ",
    description: "",
    additionalInfo: "",
    chinese: "## 類比："
  },
  {
    type: "## Comparison : ",
    description: "",
    additionalInfo: "",
    chinese: "## 比較："
  },
  {
    type: "## Application : ",
    description: "",
    additionalInfo: "",
    chinese: "## 應用："
  },
  {
    type: "## Action : ",
    description: "",
    additionalInfo: "",
    chinese: "## 行動："
  },
  {
    type: "## Counter Example : ",
    description: "",
    additionalInfo: "",
    chinese: "## 反例："
  },
  {
    type: "## Why Important : ",
    description: "",
    additionalInfo: "",
    chinese: "## 為什麼重要："
  },
  {
    type: "## Target Auduience : ",
    description: "",
    additionalInfo: `This piece is about {Topic}.\n\nIt's written for {Audience} who have {Problem}.\n\nBy the time they finish, they will feel {Emotion}.\n\nAnd they will {learn, have, be able to} do {Benefit}.\n\nAfter reading this piece they will releaze {Point}, so they will {Next desired action, belief, or thought}.\n\nThe immediate next step the reader should take is {CTA}.`,
    chinese: "## 目標受眾："
  },
  {
    type: "## Hooks : ",
    description: "",
    additionalInfo: "",
    chinese: "## 開頭："
  },
  {
    type: "## Conclusions : ",
    description: "",
    additionalInfo: "",
    chinese: "## 結論："
  },
  {
    type: "## Raw : ",
    description: "",
    additionalInfo: "```\n\n```",
    chinese: ""
  },
  {
    type: "## GPT Summary : ",
    description: "",
    additionalInfo: "```\n\n```",
    chinese: ""
  },
  {
    type: "## References : ",
    description: "",
    additionalInfo: "",
    chinese: "## 參考："
  },
  {
    type: "d/💫",
    description: "Echo from",
    additionalInfo: "",
    chinese: ""
  },
  {
    type: "d/⏫",
    description: "Idea/Task/Action Compass - Up - North - Where does this idea come from / Reason of this idea? OR What is the goal/prereq of this task/action?",
    additionalInfo: "",
    chinese: ""
  },
  {
    type: "d/⏬",
    description: "Idea/Task/Action Compass - Down - Sorth - Where does the idea lead to / It can solve what problem? OR What is the result/next task/action of this task/action?",
    additionalInfo: "",
    chinese: ""
  },
  {
    type: "d/⏩️",
    description: "Idea/Task/Action Compass - Right - East - What are similar / supporting idea? OR Same Goal Different Task/Action?",
    additionalInfo: "",
    chinese: ""
  },
  {
    type: "d/⏪",
    description: "Idea/Task/Action Compass - Left - West - What are oppose idea? OR Same Task/Action Different Goal?",
    additionalInfo: "",
    chinese: ""
  },
];

export class AddFootnoteTagModal extends FuzzySuggestModal<FootnoteType> {

  editor: Editor
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
    this.keydownHandler = (event: KeyboardEvent) => {
      //console.log("ctrl " + event.ctrlKey)
      //console.log("alt " + event.altKey)
      //console.log("meta " + event.metaKey)
      //console.log("shift " + event.shiftKey)
      //console.log("key " + event.key)
      // Check if Ctrl + Q was pressed
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'Z') { // windows
        this.close();
      } else if (event.ctrlKey && event.metaKey && event.shiftKey && event.key === 'Z') { // macos
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
  }

  getItems(): FootnoteType[] {
    return ALL_FOOTNOTE_TYPES;
  }

  getItemText(noteType: FootnoteType): string {
    return noteType.type + " " + noteType.description;
  }

  static removeTag(line: string): string {
    ALL_FOOTNOTE_TYPES.forEach((noteType) => line = line.replace(`#${noteType.type} `, ''))
    return line
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<FootnoteType>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + noteType.type });
    if (noteType.description.length > 0) {
      el.createEl("small", { text: "     " + noteType.description });
    }
  }

  containsType(line: String) : Boolean {
    return ALL_FOOTNOTE_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenNoteType: FootnoteType, evt: MouseEvent | KeyboardEvent) {
    const selection = this.editor.getSelection()
    let replacedStr = choosenNoteType.type.startsWith("## ") ? `${choosenNoteType.type}\n\n` : `#${choosenNoteType.type} `
    if (choosenNoteType.additionalInfo.length > 0) {
      replacedStr = replacedStr + choosenNoteType.additionalInfo + "\n\n"
    }
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