import { NavigateToNoteFromTagModal } from "navigateToNoteFromTagModal"
import { App, FuzzySuggestModal, FuzzyMatch, Notice, CachedMetadata, parseFrontMatterTags, parseFrontMatterAliases, TFile } from "obsidian"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"

const BACK_TO_SELECT_TAG = "Back to select tag"

export class NavigateToNoteFromSpecificTagModal extends FuzzySuggestModal<string> {

  tagToFind: string

  constructor(app: App, tagToFind: string)
  {
    super(app)
    this.tagToFind = tagToFind
    this.setPlaceholder(`Which notes with tag ${tagToFind} do you want to navigate to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tag ${tagToFind} do you want to navigate to?`
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
      new NavigateToNoteFromTagModal(this.app).open()
    } else {
      const { vault, workspace } = this.app;
      const leaf = workspace.getLeaf(false);
      Promise.resolve()
      .then(() => {
          return leaf.openFile(vault.getAbstractFileByPath(path) as TFile, { active : true });
      })
  }
  }
}