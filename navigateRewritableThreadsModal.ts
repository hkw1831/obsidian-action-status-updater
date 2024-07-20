import { App, FuzzySuggestModal, FuzzyMatch, Notice, CachedMetadata, parseFrontMatterTags, parseFrontMatterAliases, TFile, MarkdownView } from "obsidian"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"
import { getNoteType } from "selfutil/getTaskTag"
import { NoteWithHeader, SEPARATOR } from "selfutil/noteWithHeader"
import moment from 'moment';

const BACK_TO_SELECT_TAG = "Back to select tag"
const OPEN_IN_SEARCH_MODE = "Open in search mode"

export class NavigateRewritableThreadsModal extends FuzzySuggestModal<NoteWithHeader> {

  tagToFind: string
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App)
  {
    super(app)
    this.tagToFind = "#c/t/p"
    this.setPlaceholder(`Which published notes do you want to rewrite?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which published notes do you want to rewrite?`
      }
    ]);
  }

  getItems(): NoteWithHeader[] {
    const filePaths : string[] = filesWhereTagIsUsed(this.tagToFind)
    return filePaths.filter((f) => {
      const time = f.replace(/.*(\d\d\d\d\d\d\d\d).*/,"$1")
      if (/\d\d\d\d\d\d\d\d/.test(time)) {
        const oldDate = moment(time, 'YYYYMMDD');
        const today = moment();
        const diff = today.diff(oldDate, 'days');
        return diff > 90
      }
      return false
    }).map(f => { return {notePath: f, header: "", startLine: 0, noteType: getNoteType(f)} });
  }

  getItemText(path: NoteWithHeader): string {
    return path.notePath + path.header;
  }

  // Renders each suggestion item.
  renderSuggestion(path: FuzzyMatch<NoteWithHeader>, el: HTMLElement) {
    const item: NoteWithHeader = path.item
    const pathItem: string = item.notePath
    let prefix = item.noteType ? (item.noteType.prefix ? item.noteType.prefix + " " : "") : ""
    el.createEl("div", { text: prefix + pathItem });
    if (path.item.header.length > 0) {
      el.createEl("small", { text: item.header})
    }
  }

  // Perform action on the selected suggestion.
  onChooseItem(path: NoteWithHeader, evt: MouseEvent | KeyboardEvent) {
    const { vault, workspace } = this.app;
    const leaf = workspace.getLeaf(false);
    Promise.resolve()
    .then(() => {
        return leaf.openFile(vault.getAbstractFileByPath(path.notePath) as TFile, { active : true });
        
    })
    .then(() => {
      const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
      const editor = markdownView?.editor
      if (markdownView == null || editor == null) {
          const errorReason = `editor or value ${path.notePath} not exist. Aborting...`
          return Promise.reject(errorReason)
      }
      editor.setCursor({line: path.startLine, ch: 0})
          // scroll the view to the cursor
      editor.scrollIntoView({from: {line: path.startLine, ch: 0}, to: {line: path.startLine, ch: 0}}, true)
    })
  }
}