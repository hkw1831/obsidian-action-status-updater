import { AddTextToNotesFromSpecificTagModal } from "addTextToNotesFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags, TFile } from "obsidian";
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
  modalValueSelected: boolean
  postAction: () => void
  items: NoteWithHeader[]
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, linkToAdd: string, description: string, insertFromBeginning: boolean, postAction: () => void)
  {
    super(app)
    this.linkToAdd = linkToAdd
    this.description = description
    this.insertFromBeginning = insertFromBeginning
    this.modalValueSelected = false
    this.postAction = postAction
    this.setPlaceholder(`Which notes with tags do you want to ${description} to ${insertFromBeginning ? "beginning" : "end"} of the notes?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tags do you want to ${description} to ${insertFromBeginning ? "beginning" : "end"} of the notes?`
      }
    ]);
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
    this.items = this.prepareItems()
  }

  selectElement(index: number) {
    const elements = this.resultContainerEl.querySelectorAll('.suggestion-item');
    if (elements.length > index) {
      const element = elements[index] as HTMLElement;
      element.click(); // Simulate a click to select the element
    }
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

  onClose() {
    super.onClose();
    // Stop listening for keydown events when the modal is closed
    document.removeEventListener('keydown', this.keydownHandler);
    if (!this.modalValueSelected)
    {
      //this.postAction()
    }
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
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + prefix + item.notePath})// + item.header})
    if (item.header.length > 0) {
      el.createEl("small", { text: "     " + item.header})
      //el.createEl("small", { text: "     " + item.header + " " + item.startLine})
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
    this.modalValueSelected = true
    if (choosenValue.notePath.startsWith("@")) {
      new AddTextToNotesFromSpecificTagModal(this.app, this.linkToAdd, choosenValue.notePath.replace(/^@/, "#"), this.description, this.insertFromBeginning, this.postAction).open()
    } else {
      const tFile: TFile = app.vault.getAbstractFileByPath(choosenValue.notePath) as TFile
      const value = await app.vault.read(tFile)
      //console.log("haha")
      //console.log(value)
      await addTextToNotes(this.linkToAdd, choosenValue.notePath, this.app, this.insertFromBeginning, choosenValue.startLine)
      //this.postAction()
    }
  }
}