import { NavigateToNoteFromTagModal } from "navigateToNoteFromTagModal"
import { App, FuzzySuggestModal, FuzzyMatch, Notice, CachedMetadata, parseFrontMatterTags, parseFrontMatterAliases, TFile, MarkdownView, SuggestModal } from "obsidian"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"
import { getNoteType } from "selfutil/getTaskTag"
import { NoteWithHeader, SEPARATOR } from "selfutil/noteWithHeader"


const NO_ZK = "Not add to any zk notes"

interface EchoItem {
  notePath: string;
  lineNumber: number;
  lineContent: string;
}

interface FilePair {
  zkFile: TFile;
  newFile: TFile;
}

export class EchoModal extends SuggestModal<EchoItem> {
  fileToEcho: TFile
  fileNameToEcho: string
  fileNameLinkToEcho: string
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, fileToEcho: TFile)
  {
    super(app)
    this.fileToEcho = fileToEcho
    this.fileNameToEcho = fileToEcho.basename
    this.fileNameLinkToEcho = "[[" + this.fileNameToEcho + "]]"
    this.setPlaceholder(`File to echo: ${this.fileNameToEcho} : Which zk notes you want to put to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `File to echo: ${this.fileNameToEcho} : Which zk notes you want to put to?`
      }
    ]);
    this.keydownHandler = (event: KeyboardEvent) => {
      //console.log("ctrl " + event.ctrlKey)
      //console.log("alt " + event.altKey)
      //console.log("meta " + event.metaKey)
      //console.log("shift " + event.shiftKey)
      //console.log("key " + event.key)
      // Check if Ctrl + Q was pressed
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'q') { // windows
        this.close();
      } else if (event.ctrlKey && event.metaKey && event.shiftKey && event.key === 'q') { // macos
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

async getSuggestions(query: string): Promise<EchoItem[]> {
  const filePaths: string[] = filesWhereTagIsUsed("#b/n/z");
  const items: EchoItem[] = [];

  items.push({
    notePath: "",
    lineNumber: 0,
    lineContent: ""
  })

  // find zk content in each file
  const readPromises = filePaths.map(async (filePath) => {
    const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
    const content = await this.app.vault.read(file);
    const fileLines = content.split('\n');
    for (let i = 0; i < fileLines.length; i++) {
      const lineContent = fileLines[i].trim();
      if (lineContent.includes(this.fileNameLinkToEcho)) {
        items.push({
          notePath: filePath,
          lineNumber: i,
          lineContent: lineContent
        })
      }
    }
  })

  await Promise.all(readPromises);

  // Then add all zk files (add to end of file)
  const readPromises2 = filePaths.map(async (filePath) => {
    items.push({
      notePath: filePath,
      lineNumber: 0,
      lineContent: ""
    })
  })

  await Promise.all(readPromises2);
/*
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
      { notePath: NO_ZK, header: "", startLine: 0, noteType: null },
      { notePath: OPEN_IN_SEARCH_MODE, header: "", startLine: 0, noteType: null },
      ...lines
    ];
  }

  return [
    { notePath: NO_ZK, header: "", startLine: 0, noteType: null },
    { notePath: OPEN_IN_SEARCH_MODE, header: "", startLine: 0, noteType: null },
    ...filePaths.filter(f => f.toLowerCase().includes(query.toLowerCase())).map(f => ({ notePath: f, header: "", startLine: 0, noteType: getNoteType(f) })),
    //    ...filePaths.filter(f => this.fuzzyMatch(f.toLowerCase(), query.toLowerCase())).map(f => ({ notePath: f, header: "", startLine: 0, noteType: getNoteType(f) })),
    { notePath: SEPARATOR, header: "", startLine: 0, noteType: null },
    ...headers
  ]
  
    */
   return items
}

  fuzzyMatch(str: string, pattern: string): boolean {
    if (!pattern) return true;
    pattern = pattern.split('').reduce((a, b) => `${a}.*${b}`);
    return new RegExp(pattern).test(str);
  }

  getItemText(path: EchoItem): string {
    return path.notePath + path.lineContent;
  }

  // Renders each suggestion item.
  //renderSuggestion(path: FuzzyMatch<NoteWithHeader>, el: HTMLElement) {
  renderSuggestion(item: EchoItem, el: HTMLElement) {
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
    el.createEl("div", { text: itemIndex + prefix + (pathItem === "" ? "NOT ADD TO ANY ZK" : pathItem)})
    //if (path.item.header.length > 0) {
    if (item.lineContent.length > 0) {
      el.createEl("small", { text: "     " + item.lineContent})
    }
  }

  async onChooseSuggestion(echoItem: EchoItem, evt: MouseEvent | KeyboardEvent) {
    console.log(echoItem.notePath)
    // Step 1: create a new file with echo file
    let text = ""
    text += "---\ntags: b/k/s\n---\n\n"
    text += "#d/💫 ";
    text += "[[" + this.fileToEcho.basename + "]]\n\n"
    const { vault } = this.app;
    const path = this.fileToEcho.path
    const newPath = path.replace(/^([A-Z]\/)/, "$1Echo ")
    const { workspace } = this.app;
    const leaf = workspace.getLeaf(false);

    const fileExists = await vault.adapter.exists(newPath);
    if (fileExists) {
      new Notice(`Will not proceed. Echo file "${newPath}" already exist.`);
      return;
    }
    const newFile = await vault.create(newPath, text);

    // Step 2: insert the echo link to the echoItem Path Line
    if (echoItem.notePath === "") {

    } else if (echoItem.lineContent === "") {
      const { vault } = this.app;
      const path = echoItem.notePath
      const zkFile : TFile = vault.getAbstractFileByPath(path) as TFile
      const content = await vault.read(zkFile);
      const text = content + "\n" + "- [[" + newFile.basename + "]]"
      await vault.modify(zkFile, text)
    } else {
      const zkFile : TFile = vault.getAbstractFileByPath(echoItem.notePath) as TFile
      await leaf.openFile(zkFile, {active: true});
      const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
      const editor = markdownView?.editor
      if (markdownView == null || editor == null) {
        const errorReason = `editor or value ${path} not exist. Aborting...`
        return;
      }

      let result = ""
      for (let i = 0; i < editor.lineCount(); i++) {
          if (i === echoItem.lineNumber) {
            console.log("lineContent: " + editor.getLine(i))
            result += editor.getLine(i) + "\n"
            const lineContent = editor.getLine(i)
            const prefix = lineContent.replace(/(\t*- ).*/, "$1")
            result += "\t" + prefix + "[[" + newFile.basename + "]]" + "\n"
          } else {
              result += editor.getLine(i) + "\n"
          }
      }
      result = result.replace(/\n$/, "")
      editor.setValue(result)
    }

    // Step 3: open the newly created file
    await leaf.openFile(newFile, { active : true});


/*
    Promise.resolve()
    .then(() => {
      return vault.adapter.exists(newPath);
    })
    .then((fileExists) => {
      if (fileExists) {
        new Notice(`Will not proceed. Echo file "${newPath}" already exist.`);
        return Promise.reject("Echo file exist");
      }
      return vault.create(newPath, text);
    })
    // Step 2: insert the echo link to the echoItem Path Line
    .then((newFile) => {
      return leaf.openFile(tFile, { active: true });
    })
    .then(() => {
        //const editor = app.workspace.getActiveViewOfType(TextFileView);
        const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
        const editor = markdownView?.editor
    })
    // Step 3: open the newly created file
    .then((tFile) => {
      return leaf.openFile(tFile, { active : true});
    },
    (rejectReason) => {})

    */

    



    /*
  // Perform action on the selected suggestion.
  //onChooseItem(path: NoteWithHeader, evt: MouseEvent | KeyboardEvent) {
    if (NO_ZK === path.notePath) {
      new NavigateToNoteFromTagModal(this.app).open()
    } else if (OPEN_IN_SEARCH_MODE === path.notePath) {
      
				const searchPlugin = (
					this.app as any
				).internalPlugins.getPluginById("global-search");
				
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
        editor.scrollIntoView({from: {line: path.startLine, ch: 0}, to: {line: path.startLine, ch: 0}}, true)
      })
      
    }
      */
  }
}