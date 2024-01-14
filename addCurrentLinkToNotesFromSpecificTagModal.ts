import { AddCurrentLinkToNotesModal } from "addCurrentLinkToNotesModal"
import { App, FuzzySuggestModal, FuzzyMatch } from "obsidian"
import { addLinkToNotes } from "selfutil/addlinktonotes"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"

const BACK_TO_SELECT_TAG = "Back to select tag"

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
        purpose: `Which notes with tag ${tagToFind} do you want to add the current note link to?`
      }
    ]);
  }

  getItems(): string[] {
    return [...[BACK_TO_SELECT_TAG], ...filesWhereTagIsUsed(this.tagToFind)];
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
    if (BACK_TO_SELECT_TAG == path) {
      new AddCurrentLinkToNotesModal(this.app, this.linkToAdd, this.insertFromBeginning).open()
    } else {
      addLinkToNotes(this.linkToAdd, path, this.app, this.insertFromBeginning)
    }
  }
}