import { AddTextToNotesModal } from "addTextToNotesModal"
import { App, FuzzySuggestModal, FuzzyMatch } from "obsidian"
import { addTextToNotes } from "selfutil/addlinktonotes"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"
import { getNoteType } from "selfutil/getTaskTag"

const BACK_TO_SELECT_TAG = "Back to select tag"

export class AddTextToNotesFromSpecificTagModal extends FuzzySuggestModal<string> {

  linkToAdd: string

  tagToFind: string

  description: string

  insertFromBeginning: boolean

  postAction: () => void

  constructor(app: App, linkToAdd: string, tagToFind: string, description: string, insertFromBeginning: boolean, postAction: () => void)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.tagToFind = tagToFind
    this.insertFromBeginning = insertFromBeginning
    this.description = description
    this.postAction = postAction
    this.setPlaceholder(`Which notes with tag ${tagToFind} do you want to ${description} to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tag ${tagToFind} do you want to ${description} to?`
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
    let prefix = ""
    if (pathItem !== BACK_TO_SELECT_TAG) {
      const noteType = getNoteType(pathItem)
      prefix = noteType ? noteType.prefix + " " : ""
    }
    el.createEl("div", { text: prefix + pathItem });
  }

  // Perform action on the selected suggestion.
  onChooseItem(path: string, evt: MouseEvent | KeyboardEvent) {
    if (BACK_TO_SELECT_TAG == path) {
      new AddTextToNotesModal(this.app, this.linkToAdd, this.description, this.insertFromBeginning, this.postAction).open()
    } else {
      addTextToNotes(this.linkToAdd, path, this.app, this.insertFromBeginning)
      this.postAction()
    }
  }
}