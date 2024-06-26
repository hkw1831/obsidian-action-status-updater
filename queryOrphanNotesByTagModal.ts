import { App, FuzzySuggestModal, FuzzyMatch, getAllTags, TFile, Editor, MarkdownView, Notice } from "obsidian";
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag";
import { getAllNoteTags } from "selfutil/getAllNoteTags";

export class QueryOrphanNotesByTagModal extends FuzzySuggestModal<string> {

  editor: Editor
  view: MarkdownView

  constructor(app: App, editor: Editor, view: MarkdownView)
  {
    super(app)
    this.setPlaceholder(`Which notes with tags do you want to search orphan?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tags do you want to search orphan?`
      }
    ]);
    this.editor = editor
    this.view = view
  }

  getItems() : string[] {
		const l = [...getAllNoteTags(this.app).map(s => s.replace(/^#/, "@"))];
    // remove duplicate for l
    return l.filter((item, index) => l.indexOf(item) === index);
  }

  getItemText(value: string): string {
    return value;
  }

  // Renders each suggestion item.
  renderSuggestion(value: FuzzyMatch<string>, el: HTMLElement) {
    const item = value.item
    el.createEl("div", { text: item })
  }

  // Perform action on the selected suggestion.
  async onChooseItem(choosenValue: string, evt: MouseEvent | KeyboardEvent) {
    //console.log(this.view.file.path)
    const queryMd = "I/Self Query.md"
    if (this.view.file.path === queryMd) {
      new Notice("Checking... may need some time")
      const tag =  choosenValue.replace(/^@/, "#")
      const filePaths = filesWhereTagIsUsed(tag)
      let result = "## Orphan notes for tag `" + tag + "`\n"
      for (const filePath of filePaths) {
        //console.log(`Checking backlinks for ${filePath}`)
        const tFile: TFile = this.app.vault.getAbstractFileByPath(filePath) as TFile
        const backlinks = this.app.metadataCache.getBacklinksForFile(tFile)
        //console.log(backlinks)
        //console.log(backlinks.data)
        if (!backlinks || !backlinks.data || Object.keys(backlinks.data).length === 0) {
          console.log(`No backlinks for ${tFile.path}`)
          result += "\n" + "- [[" + tFile.basename + "]]"
        } else {
          // remove key "aaa" from backlinks.data
          delete backlinks.data[queryMd]
          if (Object.keys(backlinks.data).length === 0) {
            //console.log(`No backlinks for ${tFile.path}`)
            result += "\n" + "- [[" + tFile.basename + "]]"
          } else {
            //console.log(`Has backlinks for ${tFile.path}`)
          }
        }
      }
      this.editor.setValue(result)
      new Notice("Updated orphan")
    } else {
      new Notice("Please go to '" + queryMd + "' to run this action")
    }
    
    
  } 
}