import { NavigateToNoteFromSpecificTagModal } from "navigateToNoteFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags, TFile, Notice, MarkdownView } from "obsidian";
import { getAllTagsWithFilter } from "selfutil/getAllNoteTags";
import { getAllNotes, getRecentNotes } from "selfutil/getRecentNotes";
import { getNoteType } from "selfutil/getTaskTag";
import { Heading } from "selfutil/heading";

interface Note {
  search: string,
  secondary: string
  type: string
}

const note = "note"
const history = "history"
const tag = "tag"
const heading = "heading"

export class NavigateToNoteFromTagModal extends FuzzySuggestModal<Note> {
  items: Note[]
  taskType: Note
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App)
  {
    super(app)
    this.setPlaceholder(`Which notes with tags do you want to navigate to?`)
    this.setInstructions([
      {
        command: "",
        purpose: "Which notes with tags do you want to navigate to?"
      }
    ]);
    this.keydownHandler = (event: KeyboardEvent) => {
      //console.log("ctrl " + event.ctrlKey)
      //console.log("alt " + event.altKey)
      //console.log("meta " + event.metaKey)
      //console.log("shift " + event.shiftKey)
      //console.log("key " + event.key)
      // Check if Ctrl + Q was pressed
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === ';') { // windows
        this.close();
      } else if (event.ctrlKey && event.metaKey && event.shiftKey && event.key === ';') { // macos
        this.close();
      }
    };

    // Listen for keydown events at the document level
    document.addEventListener('keydown', this.keydownHandler);
    this.items = this.prepareItems()
  }

  onClose() {
    super.onClose();
    // Stop listening for keydown events when the modal is closed
    document.removeEventListener('keydown', this.keydownHandler);
  }

  getItems() : Note[] {
    return this.items
  }

  prepareItems() : Note[] {
    const allNotes = getAllNotes(this.app)
    let headings: Heading[] = []
    allNotes.forEach(n => {
      const file = this.app.vault.getAbstractFileByPath(n) as TFile
      const fileCache = this.app.metadataCache.getFileCache(file)
      if (!fileCache) {
        return
      }
      if (!fileCache.headings) {
        return
      }
      fileCache.headings.forEach(h => {
        headings.push({note: n, heading: h.heading, level: h.level, startLine: h.position.start.line})
      })
    })
		return [
      ...getRecentNotes(this.app, 50).map(n => {
        return {search: n, secondary: "", type: history}
      }),
      ...getAllTagsWithFilter(this.app).map(n => {
        return {search: n.replace(/^#/, "@"), secondary: "", type: tag}
      }),
      ...allNotes.map(n => {
        return {search: n, secondary: "", type: note}
      }),
      ...headings.map(h => {
        return {search: '#'.repeat(h.level) + " " + h.heading, secondary: h.note, type: heading}
      })
    ];
  }

  getItemText(value: Note): string {
    return value.search;
  }

  // Renders each suggestion item.
  renderSuggestion(value: FuzzyMatch<Note>, el: HTMLElement) {
    const item = value.item
    let prefix = ""
    if (item.type === note || item.type === history) {
      const noteType = getNoteType(item.search)
      prefix = noteType ? noteType.prefix + " " : ""
    }
    el.createEl("div", { text: prefix + item.search });
    el.createEl("small", { text: item.type + " " + item.secondary });
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
  async onChooseItem(choosenValue: Note, evt: MouseEvent | KeyboardEvent) {
    if (choosenValue.type == tag) {
      new NavigateToNoteFromSpecificTagModal(this.app, choosenValue.search.replace("@", "#")).open()
    } else if (choosenValue.type == note || choosenValue.type == history) {
      const { vault, workspace } = this.app;
      const leaf = workspace.getLeaf(false);
      Promise.resolve()
      .then(() => {
          return leaf.openFile(vault.getAbstractFileByPath(choosenValue.search) as TFile, { active : true });
      })
    } else if (choosenValue.type == heading) {
      const { vault, workspace } = this.app;
      const leaf = workspace.getLeaf(false);
      Promise.resolve()
      .then(() => {
          return leaf.openFile(vault.getAbstractFileByPath(choosenValue.secondary) as TFile, { active : true });
      })
      .then(() => {
        const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
        const editor = markdownView?.editor
        if (markdownView == null || editor == null) {
            const errorReason = `editor or value ${choosenValue.secondary} not exist. Aborting...`
            return Promise.reject(errorReason)
        }
        const totalLineNum = editor.lineCount()
        for (let i = 0; i < totalLineNum; i++) {
          const line = editor.getLine(i)
          if (line == choosenValue.search) {
            editor.setCursor({line: i, ch: 0})
            // scroll the view to the cursor
            editor.scrollIntoView({from: {line: i, ch: 0}, to: {line: i, ch: 0}}, true)
            return
          }
        }
      })
    }
  }
}