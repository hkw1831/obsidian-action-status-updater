import { AddTextToNotesFromSpecificTagModal } from "addTextToNotesFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags } from "obsidian";
import { addTextToNotes } from "selfutil/addlinktonotes";
import { getAllHeaders } from "selfutil/getAllHeaders";
import { getAllNoteTags } from "selfutil/getAllNoteTags";
import { getAllNotes, getRecentNotes } from "selfutil/getRecentNotes";
import { getNoteType } from "selfutil/getTaskTag";
import { NoteWithHeader } from "selfutil/noteWithHeader";

export class AddTextToNotesModal extends FuzzySuggestModal<NoteWithHeader> {

  linkToAdd: string
  taskType: String
  description: string
  insertFromBeginning: boolean
  postAction: () => void

  constructor(app: App, linkToAdd: string, description: string, insertFromBeginning: boolean, postAction: () => void)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.description = description
    this.insertFromBeginning = insertFromBeginning
    this.postAction = postAction
    this.setPlaceholder(`Which notes with tags do you want to ${description} to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tags do you want to ${description} to?`
      }
    ]);
  }

  getItems() : NoteWithHeader[] {
    const allNotesPath = getAllNotes(this.app)
    const allHeader = getAllHeaders(this.app, allNotesPath)
		const l = [...[{notePath: 'I/Inbox.md', header: "", startLine: -1}],
               ...getRecentNotes(this.app, 7).map(s => { return {notePath: s, header: "", startLine: -1} }),
               ...getAllNoteTags(this.app).map(s => s.replace(/^#/, "@")).map(s => { return {notePath: s, header: "", startLine: -1} }),
               ...allNotesPath.map(s => { return {notePath: s, header: "", startLine: -1} }),
               ...allHeader
              ];
    // remove duplicate for l
    return l.filter((item, index) => l.indexOf(item) === index);

  }

  getItemText(value: NoteWithHeader): string {
    return value.notePath + value.header;
  }

  // Renders each suggestion item.
  renderSuggestion(value: FuzzyMatch<NoteWithHeader>, el: HTMLElement) {
    const item = value.item
    let prefix = ""
    if (!item.notePath.startsWith("@")) {
      const noteType = getNoteType(item.notePath)
      prefix = noteType ? noteType.prefix + " " : ""
    }
    el.createEl("div", { text: prefix + item.notePath})// + item.header})
    if (item.header.length > 0) {
      el.createEl("small", { text: item.header})
    }
  }

  onOpen() {
    super.onOpen();
    this.inputEl.value = "@";
    this.inputEl.trigger("input");
  }

  // Perform action on the selected suggestion.
  async onChooseItem(choosenValue: NoteWithHeader, evt: MouseEvent | KeyboardEvent) {
    if (choosenValue.notePath.startsWith("@")) {
      new AddTextToNotesFromSpecificTagModal(this.app, this.linkToAdd, choosenValue.notePath.replace(/^@/, "#"), this.description, this.insertFromBeginning, this.postAction).open()
    } else {
      addTextToNotes(this.linkToAdd, choosenValue.notePath, this.app, this.insertFromBeginning, choosenValue.startLine)
      this.postAction()
    }
  }
}