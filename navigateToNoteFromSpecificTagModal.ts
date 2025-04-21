import { NavigateToNoteFromTagModal } from "navigateToNoteFromTagModal"
import { App, FuzzySuggestModal, FuzzyMatch, Notice, CachedMetadata, parseFrontMatterTags, parseFrontMatterAliases, TFile, MarkdownView, SuggestModal } from "obsidian"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"
import { getNoteType } from "selfutil/getTaskTag"
import { NoteWithHeader, SEPARATOR } from "selfutil/noteWithHeader"


const BACK_TO_SELECT_TAG = "Back to select tag"
const OPEN_IN_SEARCH_MODE = "Open in search mode"

export class NavigateToNoteFromSpecificTagModal extends SuggestModal<NoteWithHeader> {

  tagToFind: string
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, tagToFind: string)
  {
    super(app)
    this.tagToFind = tagToFind
    this.setPlaceholder(`Which notes with tag ${tagToFind} do you want to navigate to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which notes with tag ${tagToFind} do you want to navigate to?`
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
async getSuggestions(query: string): Promise<NoteWithHeader[]> {
  const filePaths: string[] = filesWhereTagIsUsed(this.tagToFind);
  const headers: NoteWithHeader[] = [];
  const lines: NoteWithHeader[] = [];

  const isActionTag = !/^#[a-z]\/[a-z]\/[a-z]$/.test(this.tagToFind)
  && !/^#[a-z]\/[a-z]$/.test(this.tagToFind)
  && !/^#[a-z]$/.test(this.tagToFind)

  const readPromises = filePaths.map(async (filePath) => {
    const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
    const fileCache = this.app.metadataCache.getFileCache(file);
    if (!fileCache) return;

    if (isActionTag) {
      if (fileCache.tags) {
        const content = await this.app.vault.read(file);
        const fileLines = content.split('\n');
        for (const tag of fileCache.tags) {
          if (tag.tag === this.tagToFind) {
            const heading = this.getHeadingForLine(fileCache, tag.position.start.line);
            const lineContent = fileLines[tag.position.start.line].trim();
            if ((filePath + lineContent).toLowerCase().includes(query.toLowerCase()))
            // if (this.fuzzyMatch((filePath + lineContent).toLowerCase(), query.toLowerCase()))
            {
              lines.push({
                notePath: filePath,
                header: (heading ? heading + "\n     " : "") + lineContent,
                startLine: tag.position.start.line,
                noteType: null
              });
            }
          }
        }
      }
    } else {
      if (fileCache.headings) {
        fileCache.headings.forEach(h => {
          headers.push({
            notePath: filePath,
            header: "#" + h.heading,
            startLine: h.position.start.line,
            noteType: null
          });
        });
      }
    }
  });

  await Promise.all(readPromises);

  if (isActionTag) {
    return [
      { notePath: BACK_TO_SELECT_TAG, header: "", startLine: 0, noteType: null },
      { notePath: OPEN_IN_SEARCH_MODE, header: "", startLine: 0, noteType: null },
      ...lines
    ];
  }

  return [
    { notePath: BACK_TO_SELECT_TAG, header: "", startLine: 0, noteType: null },
    { notePath: OPEN_IN_SEARCH_MODE, header: "", startLine: 0, noteType: null },
    ...filePaths.filter(f => f.toLowerCase().includes(query.toLowerCase())).map(f => ({ notePath: f, header: "", startLine: 0, noteType: getNoteType(f) })),
    //    ...filePaths.filter(f => this.fuzzyMatch(f.toLowerCase(), query.toLowerCase())).map(f => ({ notePath: f, header: "", startLine: 0, noteType: getNoteType(f) })),
    { notePath: SEPARATOR, header: "", startLine: 0, noteType: null },
    ...headers
  ]
}


getHeadingForLine(fileCache: CachedMetadata, lineNumber: number): string {
  if (!fileCache || !fileCache.headings) {
    return "";
  }

  const headings = fileCache.headings;
  let currentHeading = "";

  for (const heading of headings) {
    if (heading.position.start.line <= lineNumber) {
      currentHeading = "# " + heading.heading;
    } else {
      break;
    }
  }

  return currentHeading;
}

fuzzyMatch(str: string, pattern: string): boolean {
  if (!pattern) return true;
  pattern = pattern.split('').reduce((a, b) => `${a}.*${b}`);
  return new RegExp(pattern).test(str);
}

  getItemText(path: NoteWithHeader): string {
    return path.notePath + path.header;
  }

  // Renders each suggestion item.
  //renderSuggestion(path: FuzzyMatch<NoteWithHeader>, el: HTMLElement) {
    renderSuggestion(item: NoteWithHeader, el: HTMLElement) {
    //const item: NoteWithHeader = path.item
    const pathItem: string = item.notePath
    let noteType = getNoteType(item.notePath)
    let prefix = noteType ? (noteType.prefix ? noteType.prefix + " " : "") : ""
    /*
    let prefix = ""
    if (pathItem !== BACK_TO_SELECT_TAG && pathItem !== OPEN_IN_SEARCH_MODE) {
      const noteType = getNoteType(pathItem)
      prefix = noteType ? noteType.prefix + " " : ""
    }
    */
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + prefix + pathItem });
    //if (path.item.header.length > 0) {
    if (item.header.length > 0) {
      el.createEl("small", { text: "     " + item.header})
    }
  }

  onChooseSuggestion(path: NoteWithHeader, evt: MouseEvent | KeyboardEvent) {
    
  // Perform action on the selected suggestion.
  //onChooseItem(path: NoteWithHeader, evt: MouseEvent | KeyboardEvent) {
    if (BACK_TO_SELECT_TAG === path.notePath) {
      new NavigateToNoteFromTagModal(this.app).open()
    } else if (OPEN_IN_SEARCH_MODE === path.notePath) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
				const searchPlugin = (
					this.app as any
				).internalPlugins.getPluginById("global-search");
				/* eslint-enable @typescript-eslint/no-explicit-any */
				const search = searchPlugin && searchPlugin.instance;
        const defaultTagSearchString = `tag:${this.tagToFind}`;
        search.openGlobalSearch(defaultTagSearchString);
    } else if (SEPARATOR === path.notePath) {
      // do nothing
    } else {
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
        if (path.startLine > 0)
        {
          const line : number = path.startLine
          try {
            markdownView.setEphemeralState({ line });
          } catch (error) {
            console.error(error);
          }

        }    
        //editor.scrollIntoView({from: {line: path.startLine, ch: 0}, to: {line: path.startLine, ch: 0}}, true)
      })
    }
  }
}