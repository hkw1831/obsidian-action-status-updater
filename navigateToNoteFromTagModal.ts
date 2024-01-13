import { NavigateToNoteFromSpecificTagModal } from "navigateToNoteFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags } from "obsidian";
import { getAllTagsWithFilter } from "selfutil/getAllNoteTags";

export class NavigateToNoteFromTagModal extends FuzzySuggestModal<string> {

  taskType: String

  constructor(app: App)
  {
    super(app)
  }

  getItems() : string[] {
		return getAllTagsWithFilter(this.app);
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
      new NavigateToNoteFromSpecificTagModal(this.app, choosenValue).open()
    }
  }
}