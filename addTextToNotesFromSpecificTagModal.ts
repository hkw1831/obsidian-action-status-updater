import { AddTextToNotesModal } from "addTextToNotesModal"
import { App, FuzzySuggestModal, FuzzyMatch } from "obsidian"
import { addTextToNotes } from "selfutil/addlinktonotes"
import { filesHeadersWhereTagIsUsed, filesWhereTagIsUsed } from "selfutil/findNotesFromTag"
import { getNoteType } from "selfutil/getTaskTag"
import { NoteWithHeader, SEPARATOR } from "selfutil/noteWithHeader"

const BACK_TO_SELECT_TAG = "Back to select tag"

export class AddTextToNotesFromSpecificTagModal extends FuzzySuggestModal<NoteWithHeader> {

  linkToAdd: string

  tagToFind: string

  description: string

  insertFromBeginning: boolean

  postAction: () => void

  constructor(app: App, linkToAdd: string, tagToFind: string, description: string, insertFromBeginning: boolean, postAction: () => void)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.tagToFind = tagToFind
    this.insertFromBeginning = insertFromBeginning
    this.description = description
    this.postAction = postAction
    this.setPlaceholder(`Which notes with tag ${tagToFind} do you want to ${description} to ${insertFromBeginning ? "beginning" : "end"} of the notes?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tag ${tagToFind} do you want to ${description} to ${insertFromBeginning ? "beginning" : "end"} of the notes?`
      }
    ]);
  }


  getItems(): NoteWithHeader[] {
    const filePaths = filesWhereTagIsUsed(this.tagToFind)
    const filePathsForHeader = filesHeadersWhereTagIsUsed(this.app, this.tagToFind)
    
    return [...[{notePath: BACK_TO_SELECT_TAG, header: "", startLine: -1, noteType: null}], 
      ...filePaths.map(f => { return {notePath: f, header: "", startLine: -1, noteType: getNoteType(f)} }),
      ...[{notePath: SEPARATOR, header: "", startLine: 0, noteType: null }],
      ...filePathsForHeader];
  }

  getItemText(path: NoteWithHeader): string {
    return path.notePath + path.header;
  }

  // Renders each suggestion item.
  renderSuggestion(path: FuzzyMatch<NoteWithHeader>, el: HTMLElement) {
    const item: NoteWithHeader = path.item
    const pathItem: string = item.notePath
    let prefix = item.noteType ? (item.noteType.prefix ? item.noteType.prefix + " " : "") : ""
    /*
    let prefix = ""
    if (pathItem !== BACK_TO_SELECT_TAG) {
      const noteType = getNoteType(pathItem)
      prefix = noteType ? noteType.prefix + " " : ""
    }
    */
    //el.createEl("div", { text: prefix + pathItem + path.item.header});
    el.createEl("div", { text: prefix + item.notePath})// + item.header})
    if (path.item.header.length > 0) {
      el.createEl("small", { text: item.header})
    }
  }

  // Perform action on the selected suggestion.
  onChooseItem(path: NoteWithHeader, evt: MouseEvent | KeyboardEvent) {
    if (BACK_TO_SELECT_TAG == path.notePath) {
      new AddTextToNotesModal(this.app, this.linkToAdd, this.description, this.insertFromBeginning, this.postAction).open()
    } else if (SEPARATOR === path.notePath) {
      // do nothing
    } else {
      addTextToNotes(this.linkToAdd, path.notePath, this.app, this.insertFromBeginning, path.startLine)
      this.postAction()
    }
  }
}