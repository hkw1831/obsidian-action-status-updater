import { AddTextToNotesFromSpecificTagModal } from "addTextToNotesFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags } from "obsidian";
import { addTextToNotes } from "selfutil/addlinktonotes";
import { getAllNoteTags } from "selfutil/getAllNoteTags";
import { getAllNotes, getRecentNotes } from "selfutil/getRecentNotes";

export class AddTextToNotesModal extends FuzzySuggestModal<string> {

  linkToAdd: string
  taskType: String
  description: string
  insertFromBeginning: boolean
  postAction: () => void

  constructor(app: App, linkToAdd: string, description: string, insertFromBeginning: boolean, postAction: () => void)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.description = description
    this.insertFromBeginning = insertFromBeginning
    this.postAction = postAction
    this.setPlaceholder(`Which notes with tags do you want to ${description} to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tags do you want to ${description} to?`
      }
    ]);
  }

  getItems() : string[] {
		return [...['I/Inbox.md'], ...getRecentNotes(this.app, 7), ...getAllNoteTags(this.app).map(s => s.replace(/^#/, "@")), ...getAllNotes(this.app)];
  }

  getItemText(value: string): string {
    return value;
  }

  // Renders each suggestion item.
  renderSuggestion(value: FuzzyMatch<string>, el: HTMLElement) {
    const item = value.item
    el.createEl("div", { text: item })
  }

  // Perform action on the selected suggestion.
  async onChooseItem(choosenValue: string, evt: MouseEvent | KeyboardEvent) {
    if (choosenValue.startsWith("@")) {
      new AddTextToNotesFromSpecificTagModal(this.app, this.linkToAdd, choosenValue.replace(/^@/, "#"), this.description, this.insertFromBeginning, this.postAction).open()
    } else {
      addTextToNotes(this.linkToAdd, choosenValue, this.app, this.insertFromBeginning)
      this.postAction()
    }
  }
}