import { App, Editor, FuzzySuggestModal, FuzzyMatch, Notice } from "obsidian";

interface CommentType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "default",
    description: "default"
  },
  {
    type: "custom-font-size",
    description: "custom font size"
  },
];

export class ThreadsToImagesModal extends FuzzySuggestModal<CommentType> {

  threadSegment: String

  constructor(app: App, threadSegment: String)
  {
    super(app)
    this.threadSegment = threadSegment
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
    let param = choosenNoteType.type
    let s = this.threadSegment.toString()
    navigator.clipboard.writeText(this.threadSegment.toString()).then(function () {
        new Notice(`Copied\n\`\`\`\n${s}\`\`\`\nto clipboard!`);
        window.open(`shortcuts://run-shortcut?name=Threads%20to%20image&input=text&text=${param}&x-success=obsidian://&x-cancel=obsidian://&x-error=obsidian://`);
    }, function (error) {
        new Notice(`error when copy to clipboard!`);
    });
  }
}