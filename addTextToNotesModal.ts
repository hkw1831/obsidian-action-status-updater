import { AddTextToNotesFromSpecificTagModal } from "addTextToNotesFromSpecificTagModal";
import { App, Editor, FuzzySuggestModal, FuzzyMatch, getAllTags } from "obsidian";
import { addTextToNotes } from "selfutil/addlinktonotes";
import { getAllNoteTags } from "selfutil/getAllNoteTags";

export class AddTextToNotesModal extends FuzzySuggestModal<string> {

  linkToAdd: string
  taskType: String
  description: string
  insertFromBeginning: boolean

  constructor(app: App, linkToAdd: string, description: string, insertFromBeginning: boolean)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.description = description
    this.insertFromBeginning = insertFromBeginning
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tags do you want to add the ${description} to?`
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
      new AddTextToNotesFromSpecificTagModal(this.app, this.linkToAdd, choosenValue, this.description, this.insertFromBeginning).open()
    } else if (choosenValue == "Inbox") {
      const inboxMd = "I/Inbox.md"
      addTextToNotes(this.linkToAdd, inboxMd, this.app, this.insertFromBeginning)
    }
  }
}