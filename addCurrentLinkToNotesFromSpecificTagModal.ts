import { App, FuzzySuggestModal, FuzzyMatch } from "obsidian"
import { addLinkToNotes } from "selfutil/addlinktonotes"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"

export class AddCurrentLinkToNotesFromSpecificTagModal extends FuzzySuggestModal<string> {

  linkToAdd: string

  tagToFind: string

  insertFromBeginning: boolean

  constructor(app: App, linkToAdd: string, tagToFind: string, insertFromBeginning: boolean)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.tagToFind = tagToFind
    this.insertFromBeginning = insertFromBeginning
    this.setInstructions([
      {
        command: "",
        purpose: "Which notes do you want to add the current note link to?"
      }
    ]);
  }


  getItems(): string[] {
    return filesWhereTagIsUsed(this.tagToFind);
  }

  getItemText(path: string): string {
    return path;
  }

  // Renders each suggestion item.
  renderSuggestion(path: FuzzyMatch<string>, el: HTMLElement) {
    const pathItem: string = path.item
    el.createEl("div", { text: pathItem });
  }

  // Perform action on the selected suggestion.
  onChooseItem(path: string, evt: MouseEvent | KeyboardEvent) {
    addLinkToNotes(this.linkToAdd, path, this.app, this.insertFromBeginning)
  }
}