import { NavigateToNoteFromTagModal } from "navigateToNoteFromTagModal"
import { App, FuzzySuggestModal, FuzzyMatch, Notice, CachedMetadata, parseFrontMatterTags, parseFrontMatterAliases, TFile } from "obsidian"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"
import { getNoteType } from "selfutil/getTaskTag"

const BACK_TO_SELECT_TAG = "Back to select tag"
const OPEN_IN_SEARCH_MODE = "Open in search mode"

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
    return [...[BACK_TO_SELECT_TAG, OPEN_IN_SEARCH_MODE], ...filesWhereTagIsUsed(this.tagToFind)];
  }

  getItemText(path: string): string {
    return path;
  }

  // Renders each suggestion item.
  renderSuggestion(path: FuzzyMatch<string>, el: HTMLElement) {
    const pathItem: string = path.item
    let prefix = ""
    if (pathItem !== BACK_TO_SELECT_TAG && pathItem !== OPEN_IN_SEARCH_MODE) {
      const noteType = getNoteType(pathItem)
      prefix = noteType ? noteType.prefix + " " : ""
    }
    el.createEl("div", { text: prefix + pathItem });
  }

  // Perform action on the selected suggestion.
  onChooseItem(path: string, evt: MouseEvent | KeyboardEvent) {
    if (BACK_TO_SELECT_TAG === path) {
      new NavigateToNoteFromTagModal(this.app).open()
    } else if (OPEN_IN_SEARCH_MODE === path) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
				const searchPlugin = (
					this.app as any
				).internalPlugins.getPluginById("global-search");
				/* eslint-enable @typescript-eslint/no-explicit-any */
				const search = searchPlugin && searchPlugin.instance;
        const defaultTagSearchString = `tag:${this.tagToFind}`;
        search.openGlobalSearch(defaultTagSearchString);
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