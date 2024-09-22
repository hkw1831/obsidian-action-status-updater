import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface FootnoteType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "## Tips : ",
    description: ""
  },
  {
    type: "## Stats : ",
    description: ""
  },
  {
    type: "## Steps : ",
    description: ""
  },
  {
    type: "## Reasons : ",
    description: ""
  },
  {
    type: "## Mistakes : ",
    description: ""
  },
  {
    type: "## Benefits : ",
    description: ""
  },
  {
    type: "## Lessons : ",
    description: ""
  },
  {
    type: "## Examples : ",
    description: ""
  },
  {
    type: "## Questions : ",
    description: ""
  },
  {
    type: "## Personal Stories : ",
    description: ""
  },
  {
    type: "## Frameworks : ",
    description: ""
  },
  {
    type: "## Observations : ",
    description: ""
  },
  {
    type: "## Rules : ",
    description: ""
  },
  {
    type: "## Resources : ",
    description: ""
  },
  {
    type: "## Reflections : ",
    description: ""
  },
  {
    type: "## Tools : ",
    description: ""
  },
  {
    type: "## Problems : ",
    description: ""
  },
  {
    type: "## Solutions : ",
    description: ""
  },
  {
    type: "## Context : ",
    description: ""
  },
  {
    type: "## Target Auduience : ",
    description: ""
  },
  {
    type: "## Hooks : ",
    description: ""
  },
  {
    type: "## Conclusions : ",
    description: ""
  },
  {
    type: "## References : ",
    description: ""
  },
  {
    type: "d/💫",
    description: "Echo from"
  },
  {
    type: "d/⏫",
    description: "Idea/Task/Action Compass - Up - North - Where does this idea come from / Reason of this idea? OR What is the goal/prereq of this task/action?"
  },
  {
    type: "d/⏬",
    description: "Idea/Task/Action Compass - Down - Sorth - Where does the idea lead to / It can solve what problem? OR What is the result/next task/action of this task/action?"
  },
  {
    type: "d/⏩️",
    description: "Idea/Task/Action Compass - Right - East - What are similar / supporting idea? OR Same Goal Different Task/Action?"
  },
  {
    type: "d/⏪",
    description: "Idea/Task/Action Compass - Left - West - What are oppose idea? OR Same Task/Action Different Goal?"
  },
  {
    type: "d/🔄",
    description: "Context"
  },
  {
    type: "d/⏹️",
    description: "A1 - my experience"
  },
  {
    type: "d/⬅️",
    description: "(Deprecated) Previous version of this idea"
  },
  {
    type: "d/➡️",
    description: "(deprecated) Next version of this idea"
  }
  /*
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
    type: "d/a2⏺️",
    description: "A2 - future action"
  },
  */
  /*
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
  */
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
    return ALL_TYPES;
  }

  getItemText(noteType: FootnoteType): string {
    return noteType.type + " " + noteType.description;
  }

  static removeTag(line: string): string {
    ALL_TYPES.forEach((noteType) => line = line.replace(`#${noteType.type} `, ''))
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
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenNoteType: FootnoteType, evt: MouseEvent | KeyboardEvent) {
    const selection = this.editor.getSelection()
    const replacedStr = choosenNoteType.type.startsWith("## ") ? `${choosenNoteType.type}\n\n` : `#${choosenNoteType.type} `
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