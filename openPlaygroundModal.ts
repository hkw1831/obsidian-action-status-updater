import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile } from "obsidian";

export class OpenPlaygroundModal extends FuzzySuggestModal<string> {

  removeExistingContent : string = "Remove playground content"
  notRemoveExistingContent: string = "Not remove existing playground content"
  playgroundMd: string = "I/Playground.md"
  options: string[] = [this.removeExistingContent, this.notRemoveExistingContent]

  constructor(app: App)
  {
    super(app)
  }

  getItems(): string[] {
    return this.options.reverse();
  }

  getItemText(item: string): string {
    return item;
  }

  // Renders each suggestion item.
  renderSuggestion(i: FuzzyMatch<string>, el: HTMLElement) {
    const item = i.item
    el.createEl("div", { text: item });
  }

  // Perform action on the selected suggestion.
  async onChooseItem(selectedContent: string, evt: MouseEvent | KeyboardEvent) {
    const choosenOption = selectedContent

    const { vault } = this.app;

    if (vault.getAbstractFileByPath(this.playgroundMd) == null) {
        await vault.create(this.playgroundMd, "");
    }

    if (this.removeExistingContent === choosenOption) {
        vault.modify(vault.getAbstractFileByPath(this.playgroundMd) as TFile, "");
    }
    
    const { workspace } = this.app;
    const leaf = workspace.getLeaf(false);
    await leaf.openFile(vault.getAbstractFileByPath(this.playgroundMd) as TFile, { active : true,/* mode */});
  }
}