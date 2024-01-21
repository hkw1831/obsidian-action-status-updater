import { NavigateToNoteFromSpecificTagModal } from "navigateToNoteFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags, TFile, Notice } from "obsidian";
import { getAllTagsWithFilter } from "selfutil/getAllNoteTags";
import { getAllNotes, getRecentNotes } from "selfutil/getRecentNotes";

export class NavigateToNoteFromTagModal extends FuzzySuggestModal<string> {

  taskType: String

  constructor(app: App)
  {
    super(app)
    this.setInstructions([
      {
        command: "",
        purpose: "Which notes with tags do you want to navigate to?"
      }
    ]);
  }

  getItems() : string[] {
		return [...getRecentNotes(this.app, 7), ...getAllTagsWithFilter(this.app), ...getAllNotes(this.app)];
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
    } else {
      const { vault, workspace } = this.app;
      const leaf = workspace.getLeaf(false);
      Promise.resolve()
      .then(() => {
          return leaf.openFile(vault.getAbstractFileByPath(choosenValue) as TFile, { active : true });
      })
    }
  }
}