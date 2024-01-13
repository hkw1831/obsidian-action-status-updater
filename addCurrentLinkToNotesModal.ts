import { AddCurrentLinkToNotesFromSpecificTagModal } from "addCurrentLinkToNotesFromSpecificTagModal";
import { App, Editor, FuzzySuggestModal, FuzzyMatch, getAllTags } from "obsidian";
import { addLinkToEndOfNotes } from "selfutil/addlinktonotes";
import { getAllNoteTags } from "selfutil/getAllNoteTags";

export class AddCurrentLinkToNotesModal extends FuzzySuggestModal<string> {

  linkToAdd: string
  taskType: String

  constructor(app: App, linkToAdd: string)
  {
    super(app)
    this.linkToAdd = linkToAdd
  }

  getItems() : string[] {
		return [...['Inbox'], ...getAllNoteTags(this.app)];
  }

  getItemText(value: string): string {
    return value;
  }

  // Renders each suggestion item.
  renderSuggestion(value: FuzzyMatch<string>, el: HTMLElement) {
    const item = value.item
    el.createEl("div", { text: item });
  }

  // Perform action on the selected suggestion.
  async onChooseItem(choosenValue: string, evt: MouseEvent | KeyboardEvent) {
    if (choosenValue.startsWith("#")) {
      new AddCurrentLinkToNotesFromSpecificTagModal(this.app, this.linkToAdd, choosenValue).open()
    } else if (choosenValue == "Inbox") {
      const inboxMd = "I/Inbox.md"
      addLinkToEndOfNotes(this.linkToAdd, inboxMd, this.app)
    }
  }
}