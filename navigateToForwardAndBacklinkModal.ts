import { App, FuzzySuggestModal, FuzzyMatch, TFile, MarkdownView, Notice, Editor } from "obsidian"

interface LinkType {
  path: string;
  type: string;
  index: string;
  line: number;
  ch: number;
}

export class NavigateToForwardAndBacklinkTagModal extends FuzzySuggestModal<LinkType> {

  view: MarkdownView
  editor: Editor

  constructor(app: App, view: MarkdownView, editor: Editor)
  {
    super(app)
    this.view = view
    this.editor = editor
    this.setPlaceholder(`Whichlink do you want to navigate to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which link do you want to navigate to?`
      }
    ]);
  }


  getForwardlinkItems(): LinkType[] {
    const forwardlinks = this.app.metadataCache.getFileCache(this.view.file)?.links

    // then resolve the path by the link name
    return (forwardlinks ? forwardlinks.map(link => {
      const linkedFile = this.app.metadataCache.getFirstLinkpathDest(link.link, this.view.file.path);
      const tf = linkedFile ? this.app.vault.getAbstractFileByPath(linkedFile.path) : null
      return tf ? tf.path : ""
    }).filter(path => path !== "")
       : []).map(p => {
          return {path: p, type: "> ", index: "", line: 0, ch: 0}
       })
  }

  getBacklinkItems(): LinkType[] {
    const backlinks = this.app.metadataCache.getBacklinksForFile(this.view.file)
    console.log(backlinks)
    const backlinksData = backlinks?.data
    if (!backlinksData) {
      return []
    }
    let result = []
    console.log(typeof backlinks.data)
    console.log(backlinksData)
    for (let i in backlinksData) {
      for (let j = 0; j < backlinksData[i].length; j++) {
        const index = backlinksData[i].length > 1 ? "[" + j + "]" : ""
        result.push({path: i, type: "< ", index: index, line: backlinksData[i][j]['position']['start']['line'], ch: backlinksData[i][j]['position']['start']['col']})
      }
    }
    return result
  }

  getExternallinkItems(): LinkType[] {
    // grep all links starts with http in the file
    const fileContent = this.editor.getValue()
    if (!fileContent) {
      return []
    }
    const lines = fileContent.split("\n")
    let result = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const matches = line.match(/([A-Za-z0-9-]+?:\/\/[^ ]*)/g)
      if (matches) {
        for (let j = 0; j < matches.length; j++) {
          result.push({path: matches[j], type: "w ", index: "", line: i, ch: 0})
        }
      }
    }
    return result

  }

  getItems(): LinkType[] {
    return [...this.getBacklinkItems(),
      ...[{path: "------------------", type: "-", index: "", line: 0, ch: 0}],
      ...this.getExternallinkItems(),
      ...this.getForwardlinkItems()];
  }

  getItemText(l: LinkType): string {
    return l.path;
  }

  // Renders each suggestion item.
  renderSuggestion(l: FuzzyMatch<LinkType>, el: HTMLElement) {
    const ll: LinkType = l.item
    el.createEl("div", { text: ll.type + ll.path + ll.index});
  }

  // Perform action on the selected suggestion.
  onChooseItem(l: LinkType, evt: MouseEvent | KeyboardEvent) {
    if (l.type === "-") {
      return
    }
    if (l.type === "w ") {
      window.open(l.path, '_blank');
    }
    const { vault, workspace } = this.app;
    const leaf = workspace.getLeaf(false);
    const line = l.line
    const ch = l.ch
    Promise.resolve()
    .then(() => {
        return leaf.openFile(vault.getAbstractFileByPath(l.path) as TFile, { active : true });
    })
    .then(() => {
      const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
      const editor = markdownView?.editor
      const value = markdownView?.getViewData()
      if (markdownView == null || editor == null || value == null) {
          const errorReason = `editor not exist. Aborting...`
          return Promise.reject(errorReason)
      }
      editor.setCursor({line: line, ch: ch})
			editor.scrollIntoView({from: {line: line, ch: ch}, to: {line: line, ch: ch}}, true)
      return Promise.resolve()
  })
  .catch((reason) => { 
      new Notice(reason)
  })
  }
}