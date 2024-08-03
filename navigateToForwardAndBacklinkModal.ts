import { App, FuzzySuggestModal, FuzzyMatch, TFile, MarkdownView, Notice, Editor, SuggestModal, CachedMetadata, FrontMatterCache, parseFrontMatterTags, Scope } from "obsidian"
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag";
import { getNoteType } from "selfutil/getTaskTag";
import { LinkType } from "selfutil/linkType";

export class NavigateToForwardAndBacklinkTagModal extends SuggestModal<LinkType> {

  view: MarkdownView
  editor: Editor
  items: LinkType[]

  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, view: MarkdownView, editor: Editor)
  {
    super(app)
    this.view = view
    this.editor = editor
    this.setPlaceholder(`Which link do you want to navigate to?`)
    this.setInstructions([
      {
        command: "",
        purpose: `Which link do you want to navigate to?`
      }
    ]);
    this.items = this.prepareItems()

    this.keydownHandler = (event: KeyboardEvent) => {
      //console.log("ctrl " + event.ctrlKey)
      //console.log("alt " + event.altKey)
      //console.log("meta " + event.metaKey)
      //console.log("shift " + event.shiftKey)
      //console.log("key " + event.key)
      // Check if Ctrl + Q was pressed
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'O') { // windows
        this.close();
      } else if (event.ctrlKey && event.metaKey && event.shiftKey && event.key === 'O') { // macos
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
      console.log(`Element ${index + 1} selected`); // Log the selection
    }
  }

  onClose() {
    super.onClose();
    // Stop listening for keydown events when the modal is closed
    document.removeEventListener('keydown', this.keydownHandler);
    //this.scope.unregister(); // Unregister the scope when the modal is closed
  }

  getLinkItems(): LinkType[] {
    const forwardLinkItems = this.getForwardlinkItems()
    let backLinkItems = []
    let childLinkItems = []
    let parentLinkItems = []

    const backlinks = this.app.metadataCache.getBacklinksForFile(this.view.file)
    const backlinksData = backlinks?.data
    if (backlinksData) {
      for (let i in backlinksData) {
        for (let j = 0; j < backlinksData[i].length; j++) {
          const index = backlinksData[i].length > 1 ? "[" + j + "]" : ""
          if (i != this.view.file.path) {
            //console.log("@@")
            //console.log(i)
            //console.log(backlinksData[i][j])
            const key = backlinksData[i][j]['key']
            if (key) {
              childLinkItems.push({path: i, type: "v ", index: index, line: 0, ch: 0})  
            } else {
              backLinkItems.push({path: i, type: "< ", index: index, line: backlinksData[i][j]['position']['start']['line'], ch: backlinksData[i][j]['position']['start']['col']})
            }
          }
        }
      }
    }

    const fileCache : CachedMetadata | null = this.app.metadataCache.getFileCache(this.view.file)
    if (fileCache) {
      const frontmatter : FrontMatterCache | undefined = fileCache.frontmatter
      if (frontmatter) {
        for (const key in frontmatter) {
          if (frontmatter.hasOwnProperty(key)) {
            const value = frontmatter[key];
            //console.log(`Key: ${key}, Value: ${value}`);
            if (value.startsWith('[[') && value.endsWith(']]')) {
              // Extract the note link without the square brackets
              const noteLink = value.slice(2, -2);
              //console.log('Note link:', noteLink);
              const linkedFile = this.app.metadataCache.getFirstLinkpathDest(noteLink, this.view.file.path);
              //console.log("linkedFile")
              //console.log(linkedFile)
              const tf = linkedFile ? this.app.vault.getAbstractFileByPath(linkedFile.path) : null
              if (tf) {
                parentLinkItems.push({path: tf.path, type: "^ ", index: "", line: 0, ch: 0}) 
              }
            }
          }
        }
      }
    }
    return [...childLinkItems, ...parentLinkItems, ...backLinkItems, ...forwardLinkItems]
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

  getSameTagItems(): LinkType[] {
    let items: LinkType[] = []
    let { frontmatter } = app.metadataCache.getFileCache(this.view.file) || {};
    const fmtags = (parseFrontMatterTags(frontmatter) || [])//.filter(t => t == "tags");
    //console.log(fmtags)
    var tag = ""
    for (let i = 0; i < fmtags.length; i++) {
      if (/#[a-z]\/[a-z]\/[a-z]/.test(fmtags[i])) {
        tag = fmtags[i]
        break
      }
    }
    //console.log("found tag = " + tag)
    if (tag !== "") {
      const filePaths : string[] = filesWhereTagIsUsed(tag)
      //console.log("filePaths: " + filePaths)
      for (let i = 0; i < filePaths.length; i++) {
        items.push({path: filePaths[i], type: "@ ", index: "", line: 0, ch: 0}) 
      }
    }
    return items
  }

  getContentItems(): LinkType[] {
    const value = this.editor.getValue()
    const lines = value.split("\n")

    let resultAsJiraLink = []
    let resultAsHeader = []
    let resultAsUnfinishedAction = []
    let resultAsFinishedAction = []
    let resultAsContent = []
    let resultAsExternalLinks = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line != "---" && line !== "" && !/^tags: [a-z]\/[a-z]\/[a-z]/.test(line)) {
        if (/^[#]{1,6} /.test(line)) {
          resultAsHeader.push({path: line.replace(/^[#]{1,6}/, ""), type: line.replace(/^([#]{1,6} ).*/, "$1"), index: "", line: i, ch: 0})
        } else if (/#[wnt][nlwdatme] /.test(line) || / #[wnt][nlwdatme]/.test(line)) {
          if (/#[wn][da] /.test(line) || / #[wn][da]/.test(line)) {
            resultAsFinishedAction.push({path: line, type: "x ", index: "", line: i, ch: 0})
          } else {
            resultAsUnfinishedAction.push({path: line, type: "z ", index: "", line: i, ch: 0})
          }
        } else {
          resultAsContent.push({path: line, type: "c ", index: "", line: i, ch: 0})
        }
      }
      const urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/g;
      const matches = line.match(urlRegex)
      if (matches) {
        for (let j = 0; j < matches.length; j++) {
          resultAsExternalLinks.push({path: matches[j], type: "w ", index: "", line: i, ch: 0})
        }
      } else {
        const jiraLinkRegex = /([A-Z]+-[0-9]+)/g
        const jiraMatches = line.match(jiraLinkRegex)
        if (jiraMatches) {
          for (let j = 0; j < jiraMatches.length; j++) {
            resultAsJiraLink.push({path: "https://jira.orcsoftware.com/browse/" + jiraMatches[j], type: "j ", index: "", line: i, ch: 0})
          }
        }
      }
    }
    return [
      ...resultAsHeader,
      ...resultAsUnfinishedAction,
      //...resultAsFinishedAction,
      ...resultAsJiraLink,
      ...resultAsExternalLinks,
      ...resultAsContent
    ]
  }

  getItems(): LinkType[] {
    return this.items
  }

  prepareItems(): LinkType[] {
    return [...this.getLinkItems(),
      ...[{path: "------------------", type: "", index: "", line: 0, ch: 0}],
      ...this.getSameTagItems(),
      ...[{path: "------------------", type: "", index: "", line: 0, ch: 0}],
      ...this.getContentItems(),      
    ]
  }

  getSuggestions(query: string): LinkType[] | Promise<LinkType[]> {
    return this.items.filter((i) => {
      const lowerQuery = query.toLowerCase()
      return new RegExp(lowerQuery).test((i.type + i.path).toLowerCase())
    });
  }

  getItemText(l: LinkType): string {
    return l.path;
  }

  // Renders each suggestion item.
  renderSuggestion(ll: LinkType, el: HTMLElement) {
    //const ll: LinkType = l.item
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    el.createEl("div", { text: index + ". " + ll.type + this.getTaskTag(ll.type, ll.path) + ll.path + ll.index});
  }

  getTaskTag(type: string, path: string): string {
    if (type === "> " || type === "< " || type === "v " || type === "^ " || type === "@ ") {
      const noteType = getNoteType(path)
      return noteType ? " " + noteType.prefix + " " : ""
    }
    return ""
  }

  // Perform action on the selected suggestion.
  onChooseSuggestion(l: LinkType, evt: MouseEvent | KeyboardEvent) {
    if (l.type === "") {
      return
    }
    if (l.type === "< " || l.type === "> " || l.type === "v " || l.type === "^ " || l.type === "@ ") {
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
          //editor.markText({line: line, ch: ch}, {line: line + 1, ch: ch + 3}, {className: "my-highlight"})
          return Promise.resolve()
      })
      .catch((reason) => { 
          new Notice(reason)
      })
      return
    }
    if (l.type === "w " || l.type === "j ") {
      window.open(l.path, '_blank');
      return
    }
    const line = l.line
    const ch = l.ch
    this.editor.setCursor({line: line, ch: ch})
    this.editor.scrollIntoView({from: {line: line, ch: ch}, to: {line: line, ch: ch}}, true)
    //this.editor.markText({line: line, ch: ch}, {line: line + 1, ch: ch}, {className: "my-highlight"})
    return
  }
}
