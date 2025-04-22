import { NavigateToNoteFromSpecificTagModal } from "navigateToNoteFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags, TFile, Notice, MarkdownView } from "obsidian";
import { getAllTagsWithFilter } from "selfutil/getAllNoteTags";
import { getAllNotes, getRecentNotes } from "selfutil/getRecentNotes";
import { getNoteType, getNoteDescriptionByType } from "selfutil/getTaskTag";
import { Heading } from "selfutil/heading";

interface Note {
  search: string,
  secondary: string
  type: string,
  line: number
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
      } else if (event.metaKey || event.ctrlKey) {
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
        return {search: n, secondary: "", type: history, line: -1}
      }),
      ...getAllTagsWithFilter(this.app).map(n => {
        return {search: n.replace(/^#/, "@"), secondary: "", type: tag, line: -1}
      }),
      ...allNotes.map(n => {
        return {search: n, secondary: "", type: note, line: -1}
      }),
      ...headings.map(h => {
        return {search: '#'.repeat(h.level) + " " + h.heading, secondary: h.note, type: heading, line: h.startLine}
      })
    ];
  }

  getItemText(value: Note): string {
    return value.type === heading ? value.secondary + value.search : value.search;
  }

  // Renders each suggestion item.
  renderSuggestion(value: FuzzyMatch<Note>, el: HTMLElement) {
    const item = value.item
    let prefix = ""
    if (item.type === note || item.type === history) {
      const noteType = getNoteType(item.search)
      prefix = noteType ? noteType.prefix + " " : ""
    }
    const taskType = item.type == tag ? getNoteDescriptionByType(item.search) : "";
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + prefix + item.search });
    const lineInfo = item.line > 0 ? " (line " + item.line + ")" : ""
    el.createEl("small", { text: "     " + item.type + " " + item.secondary + taskType + lineInfo });
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

        editor.setCursor({line: choosenValue.line, ch: 0})
        if (choosenValue.line > 0) {
          const line = choosenValue.line
          try {
            markdownView.setEphemeralState({ line });
            //markdownView.setEphemeralState({ l });
          } catch (error) {
            console.error(error);
          }
        }
        /*
        const totalLineNum = editor.lineCount()
        for (let i = 0; i < totalLineNum; i++) {
          const line = editor.getLine(i)
          if (line == choosenValue.search) {
            editor.setCursor({line: i, ch: 0})
            if (i > 0)
            {
              // scroll the view to the cursor
              editor.scrollIntoView({from: {line: i, ch: 0}, to: {line: i, ch: 0}}, true)
              try {
                markdownView.setEphemeralState({ i });
              } catch (error) {
                console.error(error);
              }
            }
            return
          }
        }
          */
      })
    }
  }
}