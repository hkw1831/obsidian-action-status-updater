import { AddTextToNotesFromSpecificTagModal } from "addTextToNotesFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags } from "obsidian";
import { addTextToNotes } from "selfutil/addlinktonotes";
import { getAllHeaders } from "selfutil/getAllHeaders";
import { getAllNoteTags } from "selfutil/getAllNoteTags";
import { getAllNotes, getRecentNotes } from "selfutil/getRecentNotes";
import { NoteType, getNoteType } from "selfutil/getTaskTag";
import { NoteWithHeader } from "selfutil/noteWithHeader";

export class AddTextToNotesModal extends FuzzySuggestModal<NoteWithHeader> {

  linkToAdd: string
  taskType: String
  description: string
  insertFromBeginning: boolean
  postAction: () => void
  items: NoteWithHeader[]

  constructor(app: App, linkToAdd: string, description: string, insertFromBeginning: boolean, postAction: () => void)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.description = description
    this.insertFromBeginning = insertFromBeginning
    this.postAction = postAction
    this.setPlaceholder(`Which notes with tags do you want to ${description} to ${insertFromBeginning ? "beginning" : "end"} of the notes?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tags do you want to ${description} to ${insertFromBeginning ? "beginning" : "end"} of the notes?`
      }
    ]);
    this.items = this.prepareItems()
  }

  getItems() : NoteWithHeader[] {
    return this.items
  }

  prepareItems() : NoteWithHeader[] {
    const allNotesPath = getAllNotes(this.app)
    const allHeader = getAllHeaders(this.app, allNotesPath)
		const l = [...[{notePath: 'I/Inbox.md', header: "", startLine: -1, noteType: getNoteType('I/Inbox.md')}],
               ...getRecentNotes(this.app, 50).map(s => { return {notePath: s, header: "", startLine: -1, noteType: getNoteType(s)} }),
               ...getAllNoteTags(this.app).map(s => s.replace(/^#/, "@")).map(s => { return {notePath: s, header: "", startLine: -1, noteType: null} }),
               ...allNotesPath.map(s => { return {notePath: s, header: "", startLine: -1, noteType: getNoteType(s)} }),
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
    let prefix = item.noteType ? (item.noteType.prefix ? item.noteType.prefix + " " : "") : ""
    /*
    if (!item.notePath.startsWith("@")) {
      const noteType : NoteType | null = getNoteType(item.notePath)
      prefix = noteType ? noteType.prefix + " " : ""
    }
    */
    el.createEl("div", { text: prefix + item.notePath})// + item.header})
    if (item.header.length > 0) {
      el.createEl("small", { text: item.header})
    }
  }

  onOpen() {
    super.onOpen();
    this.inputEl.value = "@";
    this.inputEl.trigger("input");

    this.inputEl.addEventListener('input', () => {
      if (this.inputEl.value.startsWith('@') && (this.inputEl.value.length > 4 || this.inputEl.value.contains('#')) ) {
        this.inputEl.value = this.inputEl.value.substring(1);
      }
    });

    this.inputEl.addEventListener('paste', (event) => {

      if (this.inputEl.value === "@") {
        // Prevent the pasted text from being inserted
        event.preventDefault();
    
        // Get the text from the clipboard
        const text = (event.clipboardData || window.clipboardData).getData('text');
    
        // Clear the input and insert the new text
        this.inputEl.value = text;
        this.inputEl.trigger("input");
      }
    });
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