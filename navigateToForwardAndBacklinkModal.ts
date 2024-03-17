import { App, FuzzySuggestModal, FuzzyMatch, TFile, MarkdownView } from "obsidian"

interface LinkType {
  path: string;
  type: string;
}

export class NavigateToForwardAndBacklinkTagModal extends FuzzySuggestModal<LinkType> {

  view: MarkdownView

  constructor(app: App, view: MarkdownView)
  {
    super(app)
    this.view = view
    this.setPlaceholder(`Whichlink do you want to navigate to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which link do you want to navigate to?`
      }
    ]);
  }


  getForwardlinkItems(): string[] {
    const forwardlinks = this.app.metadataCache.getFileCache(this.view.file)?.links

    // then resolve the path by the link name
    return forwardlinks ? forwardlinks.map(link => {
      const linkedFile = this.app.metadataCache.getFirstLinkpathDest(link.link, this.view.file.path);
      const tf = linkedFile ? this.app.vault.getAbstractFileByPath(linkedFile.path) : null
      return tf ? tf.path : ""
    }).filter(path => path !== "")
       : []
  }

  getBacklinkItems(): string[] {
    const backlinks = this.app.metadataCache.getBacklinksForFile(this.view.file)
    console.log(backlinks)
    const backlinksData = backlinks?.data
    if (!backlinksData) {
      return []
    }
    console.log(typeof backlinks.data)
    return Object.keys(backlinks.data)
  }

  getItems(): LinkType[] {
    return [...this.getBacklinkItems().map(l => {
        return {path: l, type: "< "}
      }),
      ...[{path: "------------------", type: "-"}],
      ...this.getForwardlinkItems().map(l => {
        return {path: l, type: "> "}
      })];
  }

  getItemText(l: LinkType): string {
    return l.path;
  }

  // Renders each suggestion item.
  renderSuggestion(l: FuzzyMatch<LinkType>, el: HTMLElement) {
    const ll: LinkType = l.item
    el.createEl("div", { text: ll.type + ll.path });
  }

  // Perform action on the selected suggestion.
  onChooseItem(l: LinkType, evt: MouseEvent | KeyboardEvent) {
    if (l.type === "-") {
      return
    }
    const { vault, workspace } = this.app;
    const leaf = workspace.getLeaf(false);
    Promise.resolve()
    .then(() => {
        return leaf.openFile(vault.getAbstractFileByPath(l.path) as TFile, { active : true });
    })
  
  }
}