import { App, FuzzySuggestModal, FuzzyMatch, getAllTags, TFile, Editor, MarkdownView, Notice } from "obsidian";
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag";
import { getAllNoteTags } from "selfutil/getAllNoteTags";

export class QueryOrphanNotesByTagModal extends FuzzySuggestModal<string> {

  editor: Editor
  view: MarkdownView
  keydownHandler: (event: KeyboardEvent) => void;

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
    this.keydownHandler = (event: KeyboardEvent) => {
     if (event.metaKey || event.ctrlKey) {
        const key = parseInt(event.key, 10);
        if (key >= 1 && key <= 9) {
          event.preventDefault(); // Prevent default action
          this.selectElement(key - 1); // Select the element (index key - 1)
        }
      }
    };

    // Listen for keydown events at the document level
    document.addEventListener('keydown', this.keydownHandler);
  }

  selectElement(index: number) {
    const elements = this.resultContainerEl.querySelectorAll('.suggestion-item');
    if (elements.length > index) {
      const element = elements[index] as HTMLElement;
      element.click(); // Simulate a click to select the element
    }
  }

  onClose() {
    super.onClose();
    // Stop listening for keydown events when the modal is closed
    document.removeEventListener('keydown', this.keydownHandler);
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
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + item })
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