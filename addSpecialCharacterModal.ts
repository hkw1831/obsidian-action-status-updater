import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface SpecialCharacterType {
  character: string;
  description: string;
  additionalInfo: string;
  chinese: string;
}

export const ALL_SPECIAL_CHARACTER_TYPE : SpecialCharacterType[] = [
  {
    character: " -> ",
    description: " arrow 1",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "【】",
    description: "New Title",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "── ",
    description: "Sub Title",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "▋",
    description: "Heading 1",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "▍",
    description: "Heading 2",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "→",
    description: "Arrow 1",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "⤷ ",
    description: "Arrow 2",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "▸ ",
    description: "Arrow 3",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "➤",
    description: "Arrow 4",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "• ",
    description: "Bullet 1",
    additionalInfo: "",
    chinese: ""
  },
  {
    character: "• • •" + "\n" + "```" + "\n" + "標題使用方形括號：【新的標題】" + "\n" + "副標題用橫線：── 新的副標題" + "\n" + "大段落標題用方框：▋" + "\n" + "小段落標題用細框：▍" + "\n" + "常用符號：⤷ ▸ ➤ → •" + "\n" + "• • •" + "\n",
    description: "All Characters",
    additionalInfo: "",
    chinese: ""
  }
];

export class AddSpecialCharacterModal extends FuzzySuggestModal<SpecialCharacterType> {

  editor: Editor
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
    /*
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
    */
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
    /*
    // Stop listening for keydown events when the modal is closed
    document.removeEventListener('keydown', this.keydownHandler);
    */
  }

  getItems(): SpecialCharacterType[] {
    return ALL_SPECIAL_CHARACTER_TYPE;
  }

  getItemText(noteType: SpecialCharacterType): string {
    return noteType.character + " " + noteType.description;
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<SpecialCharacterType>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + noteType.character });
    if (noteType.description.length > 0) {
      el.createEl("small", { text: "     " + noteType.description });
    }
  }

  containsType(line: String) : Boolean {
    return ALL_SPECIAL_CHARACTER_TYPE.filter((noteType) => line.contains(noteType.character)).length > 0
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenCharacterType: SpecialCharacterType, evt: MouseEvent | KeyboardEvent) {
    const selection = this.editor.getSelection()
    const replacedStr = choosenCharacterType.character;
    //let replacedStr = choosenNoteType.type.startsWith("## ") ? `${choosenNoteType.type}\n\n` : `#${choosenNoteType.type} `
    //if (choosenNoteType.additionalInfo.length > 0) {
    //  replacedStr = replacedStr + choosenNoteType.additionalInfo + "\n\n"
    //}
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