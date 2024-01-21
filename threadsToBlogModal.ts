import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile, Notice, MarkdownView } from "obsidian";

export class ThreadsToBlogModal extends FuzzySuggestModal<string> {

  toNewNote : string = "To New Note"
  toClipboard: string = "To Clipboard"
  options: string[] = [this.toNewNote, this.toClipboard]
  editor: Editor
  view: MarkdownView

  constructor(app: App, editor: Editor, view: MarkdownView)
  {
    super(app)
    this.editor = editor
    this.view = view
    this.setPlaceholder(`Putting Threads content to Blog notes. Which option do you want to proceed?`)
  }

  getItems(): string[] {
    return this.options;
  }

  getItemText(item: string): string {
    return item;
  }

  // Renders each suggestion item.
  renderSuggestion(i: FuzzyMatch<string>, el: HTMLElement) {
    const item = i.item
    el.createEl("div", { text: item });
  }

  // Perform action on the selected suggestion.
  onChooseItem(selectedContent: string, evt: MouseEvent | KeyboardEvent) {
    const choosenOption = selectedContent

    const lineCount = this.editor.lineCount();
    let tagLineNumber = null;
    let metadataLineCount = 0;
    let text = ""
    for (let i = 0; i < lineCount; i++) {
      let line = this.editor.getLine(i);
      if (!line.trim().startsWith("%%") || !line.trim().endsWith("%%")) {
        let modifiedLine = line.replace('🧵 ', '# ').replace('【', '').replace('】', '').replace('👇', '')
        if (modifiedLine == '---') {
          metadataLineCount++
          if (metadataLineCount > 2) {
            if (metadataLineCount == 3) {
              modifiedLine = modifiedLine.replace('---', '')
            } else if (metadataLineCount == 4) {
              modifiedLine = modifiedLine.replace('---', '<!--more-->\n\n**目錄：**\n\n* Table of Content\n{:toc}\n\n## .')
            } else {
              modifiedLine = modifiedLine.replace('---', '## .')
            }
            
          }
        }
        if (metadataLineCount == 1 || metadataLineCount == 2) {
          modifiedLine = modifiedLine.replace("c/t/p", "c/b/d")
          modifiedLine = modifiedLine.replace("c/t/t", "c/b/d")
          modifiedLine = modifiedLine.replace("c/t/r", "c/b/d")
        }

        if (/^!\[.*\]\(.*\)/.test(modifiedLine.trim())) {
          if (!modifiedLine.contains("https://roulesophy.github.io")) {
            modifiedLine = modifiedLine.replace(/!\[([^\[\]\(\)]+)\]\(([^\[\]\(\)]+)\)/g, "$2")
          }
        }
        text = text + modifiedLine + "\n";
      }
    }
    text += `\n\n---\n\n#nl generate summary for meta description below:\n\n\n\n`
    text += `---\n\n## References:\n\n- Thread post 1: [[${this.view.file.basename}]]\n- Blog link: \n`

    const { vault } = this.app;

    if (this.toNewNote === choosenOption) {
      const { vault } = this.app;
      const path = this.view.file.path
      const newPath = path.match(/.\/Threads \d\d\d\d\d\d\d\d/)
                      ? path.replace(/(.\/)Threads \d\d\d\d\d\d\d\d/, "$1Blog ")
                      : path.replace(/(.\/)/, "$1Blog ")

      const { workspace } = this.app;
      const leaf = workspace.getLeaf(false);
      Promise.resolve()
      .then(() => {
        return vault.adapter.exists(newPath);
      })
      .then((fileExists) => {
        if (fileExists) {
          new Notice(`Will not proceed. Blog post "${newPath}" already exist.`);
          return Promise.reject("Blog post exist");
        }
        return vault.create(newPath, text);
      })
      .then((tFile) => {
        return leaf.openFile(tFile, { active : true});
      },
      (rejectReason) => {})
    }
    if (this.toClipboard === choosenOption) {
      navigator.clipboard.writeText(text).then(function () {
        new Notice(`Copied blog content to clipboard!`);
      }, function (error) {
        new Notice(`error when copy to clipboard!`);
      });
    }
  }
}