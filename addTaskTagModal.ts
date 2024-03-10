import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface CommentType {
  type: string;
  cursor: string;
  description: string;
}

const ALL_TYPES = [
  /*
  {
    type: "n",
    cursor: "c",
    description: "N Cursor"
  },
  */
  {
    type: "n",
    cursor: "b",
    description: "N Beginning of line"
  },
  /*
  {
    type: "n",
    cursor: "e",
    description: "N End of line"
  },
  {
    type: "w",
    cursor: "c",
    description: "W Cursor"
  },
  */
  {
    type: "w",
    cursor: "b",
    description: "W Beginning of line"
  },
  /*
  {
    type: "w",
    cursor: "e",
    description: "W End of line"
  }
  */
];

export class AddTaskTagModal extends FuzzySuggestModal<CommentType> {

  editor: Editor
  taskType: String

  constructor(app: App, editor: Editor, taskType: String)
  {
    super(app)
    this.editor = editor
    this.taskType = taskType
  }

  getItems(): CommentType[] {
    return ALL_TYPES;
  }

  getItemText(noteType: CommentType): string {
    return noteType.type + noteType.cursor;
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<CommentType>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    el.createEl("div", { text: noteType.type + " " + noteType.cursor });
    el.createEl("small", { text: noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenNoteType: CommentType, evt: MouseEvent | KeyboardEvent) {
    const cursor = this.editor.getCursor()
    const line = this.editor.getLine(cursor.line);
    
    if (choosenNoteType.cursor == "c") {
      this.editor.replaceRange(`${line.charAt(cursor.ch - 1) != ' ' ? ' ' : ""}#${choosenNoteType.type}${this.taskType} `, cursor);  
      cursor.ch = cursor.ch + 4 + (line.charAt(cursor.ch - 1) != ' ' ? 1 : 0);
		  this.editor.setCursor(cursor);
    } else if (choosenNoteType.cursor == "b") {
      let modifiedLine = line;
      if (/^\t*- /.test(line)) {
        modifiedLine = line.replace(/^(\t*- )/, `$1#${choosenNoteType.type}${this.taskType} `);
      } else if (/^\t*\d+\. /.test(line)) {
        modifiedLine = line.replace(/^(\t*\d+\. )/, `$1${choosenNoteType.type}${this.taskType} `);
      } else {
        modifiedLine = line.replace(/^/, `#${choosenNoteType.type}${this.taskType} `);
      }
      this.editor.setLine(cursor.line, modifiedLine);
      cursor.ch = cursor.ch + 4;
		  this.editor.setCursor(cursor);
    } else if (choosenNoteType.cursor == "e") {
      let modifiedLine = line.replace(/$/, ` #${choosenNoteType.type}${this.taskType}`);
      this.editor.setLine(cursor.line, modifiedLine);
      cursor.ch = cursor.ch;
		  this.editor.setCursor(cursor);
    }
    
  }
}