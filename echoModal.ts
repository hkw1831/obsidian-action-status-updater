import { App, Notice, TFile, MarkdownView, SuggestModal } from "obsidian"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag"
import { getNoteType } from "selfutil/getTaskTag"

interface EchoItem {
  notePath: string;
  lineNumber: number;
  lineContent: string;
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

  renderSuggestion(item: EchoItem, el: HTMLElement) {
    const pathItem: string = item.notePath
    let noteType = getNoteType(item.notePath)
    let prefix = noteType ? (noteType.prefix ? noteType.prefix + " " : "") : ""
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + prefix + (pathItem === "" ? "NOT ADD TO ANY ZK" : pathItem)})
    if (item.lineContent.length > 0) {
      el.createEl("small", { text: "     " + item.lineContent})
    }
  }

  async onChooseSuggestion(echoItem: EchoItem, evt: MouseEvent | KeyboardEvent) {
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
  }
}