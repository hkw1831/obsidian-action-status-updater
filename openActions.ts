import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile, Notice } from "obsidian";

const ALL_NOTES = [
  "D/Query N now actions.md",
  "D/Query W now actions.md",
  "D/Query N waiting actions or tasks.md",
  "D/Query W waiting actions or tasks.md",
  "D/Scheduling.md"
];

export class OpenActionsModal extends FuzzySuggestModal<string> {

  constructor(app: App)
  {
    super(app)
  }

  getItems(): string[] {
    return ALL_NOTES;
  }

  getItemText(noteName: string): string {
    return noteName;
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<string>, el: HTMLElement) {
    const noteName = choosenNoteTypeMatch.item
    el.createEl("div", { text: noteName });
  }

  // Perform action on the selected suggestion.
  async onChooseItem(choosenNote: string, evt: MouseEvent | KeyboardEvent) {
      const { vault } = this.app;
      const { workspace } = this.app;
      const mode = (this.app.vault as any).getConfig("defaultViewMode");
      const leaf = workspace.getLeaf(false);
      await leaf.openFile(vault.getAbstractFileByPath(choosenNote) as TFile, { active : true,/* mode */});
  }
}