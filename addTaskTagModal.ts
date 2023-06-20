import { App, Editor, FuzzySuggestModal, FuzzyMatch } from "obsidian";

interface CommentType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "n",
    description: "N"
  },
  {
    type: "w",
    description: "W"
  },
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
    return noteType.type;
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
    const cursor = this.editor.getCursor()
    const line = this.editor.getLine(cursor.line);
    // console.log(cursor.line)
    // console.log(cursor.ch)
    // console.log(`#0#=${line.charAt(0)}#`)
    // console.log(`#1#=${line.charAt(1)}#`)
    // console.log(`#2#=${line.charAt(2)}#`)
    // console.log(`#3#=${line.charAt(3)}#`)
    
    this.editor.replaceRange(`${line.charAt(cursor.ch - 1) != ' ' ? ' ' : ""}#${choosenNoteType.type}${this.taskType} `, cursor);  
    cursor.ch = cursor.ch + 4 + (line.charAt(cursor.ch - 1) != ' ' ? 1 : 0);
		this.editor.setCursor(cursor);
  }
}