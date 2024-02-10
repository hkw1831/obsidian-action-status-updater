import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile } from "obsidian";

export class FindReplaceModal extends FuzzySuggestModal<string> {

  find : string = "find"
  replace: string = "replace"
  options: string[] = [this.find, this.replace]

  constructor(app: App)
  {
    super(app)
  }

  getItems(): string[] {
    return this.options;
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
    if (choosenOption === this.find)
    {
      // @ts-ignore
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				this.app.commands.executeCommandById("editor:open-search")
    } else {
      // @ts-ignore
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				this.app.commands.executeCommandById("obsidian-regex-replace:obsidian-regex-replace")
    }
  }
}