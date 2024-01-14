import { AddCurrentLinkToNotesFromSpecificTagModal } from "addCurrentLinkToNotesFromSpecificTagModal";
import { App, Editor, FuzzySuggestModal, FuzzyMatch, getAllTags } from "obsidian";
import { addLinkToNotes } from "selfutil/addlinktonotes";
import { getAllNoteTags } from "selfutil/getAllNoteTags";

export class AddCurrentLinkToNotesModal extends FuzzySuggestModal<string> {

  linkToAdd: string
  taskType: String
  insertFromBeginning: boolean

  constructor(app: App, linkToAdd: string, insertFromBeginning: boolean)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.insertFromBeginning = insertFromBeginning
    this.setInstructions([
      {
        command: "",
        purpose: "Which notes with tags do you want to add the current note link to?"
      }
    ]);
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
      new AddCurrentLinkToNotesFromSpecificTagModal(this.app, this.linkToAdd, choosenValue, this.insertFromBeginning).open()
    } else if (choosenValue == "Inbox") {
      const inboxMd = "I/Inbox.md"
      addLinkToNotes(this.linkToAdd, inboxMd, this.app, this.insertFromBeginning)
    }
  }
}