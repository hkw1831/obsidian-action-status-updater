import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView, CachedMetadata, Platform } from 'obsidian';
import { getNoteType } from 'selfutil/getTaskTag';

const VIEW_TYPE_CURRENT_NOTE_ALL_LINE = 'current-note-all-line-view';

interface LineInfo {
  content: string;
  line: number;
}

class CurrentNoteAllLineView extends ItemView {
  public currentNotesPath: string
  filterStr: string = ''
  constructor(leaf: WorkspaceLeaf, notesTypeTag: string) {
    super(leaf);
    this.currentNotesPath = notesTypeTag
  }

  getViewType() {
    return VIEW_TYPE_CURRENT_NOTE_ALL_LINE;
  }

  getDisplayText() {
    return 'Current File All Line View';
  }

  async onOpen() {
    this.redraw(true);
  }

  public getIcon(): string {
    return 'bullet-list';
  }

  clearFilter() {
    this.filterStr = ''
  }

  public readonly redraw = async (forceRedraw: boolean): Promise<void> => {
    //console.log("redraw() with forceRedraw: " + forceRedraw)
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
      //console.log("redraw() with no active file")
      return;
    }

    //console.log("redraw() with active file: " + activeFile.path)
    if (!forceRedraw && activeFile.path === this.currentNotesPath) {
      //console.log("redraw() with same path")
      return;
    }
    if (activeFile.path !== this.currentNotesPath) {
      this.clearFilter()
    }
    this.currentNotesPath = activeFile.path

    const path = activeFile.path

    const f : TFile = this.app.vault.getAbstractFileByPath(path) as TFile
    if (!f) {
      return
    }
    
    this.containerEl.empty();

    let lineInfos : LineInfo[] = []
    
    const content = await this.app.vault.read(f);
    const fileLines = content.split('\n');
    for (let i = 0; i < fileLines.length; i++) {
      const lineInfo = fileLines[i]
      const lineInfoLower = lineInfo.toLowerCase()
      const filterStrLower = this.filterStr.toLowerCase()
      if (this.filterStr === "" || lineInfoLower.includes(filterStrLower) || lineInfoLower.match(new RegExp(filterStrLower)))
        lineInfos.push({
          content: lineInfo, 
          line: i,
        });
    }
    
  const label = this.containerEl.createDiv({ cls: 'nav-folder-children' });
  label.setText("Current notes");

    // Create a container for the search field and button
    const searchContainer = this.containerEl.createDiv({ cls: 'search-container' });

    // Create the search field
    const searchField = searchContainer.createEl('input', {
      type: 'text',
      placeholder: this.filterStr === '' ? 'Filter...' : this.filterStr,
      cls: 'width50'
    });

    // Add event listener to the search field
    searchField.addEventListener('input', (event: Event) => {
      this.filterStr = (event.target as HTMLInputElement).value.toLowerCase();
    });

    // Add event listener for Enter key on the search field
    searchField.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        searchButton.click();
      }
    });

    // Create the search button
    const searchButton = searchContainer.createEl('button', {
      text: 'Filter',
      cls: 'width25'
    });

    // Add event listener to the search button
    searchButton.addEventListener('click', () => {
      this.redraw(true);
    });

    // Create the clear button
    const clearButton = searchContainer.createEl('button', {
      text: 'Clear',
      cls: 'width25'
    });

    // Add event listener to the search button
    clearButton.addEventListener('click', () => {
      this.clearFilter()
      this.redraw(true);
    });

    //console.log(lineInfos)
    let noteType = getNoteType(path)
    let prefix = noteType ? (noteType.prefix ? noteType.prefix + " " : "") : ""
    

    this.containerEl.createDiv({ cls: 'nav-header', text: "Path: " + prefix + path });


    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    for (let lineInfo of lineInfos){
        const navFile = childrenEl.createDiv({
          cls: 'tree-item nav-file recent-files-file',
        });
        const navFileTitle = navFile.createDiv({
          cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
        });
        const navFileTitleContent = navFileTitle.createDiv({
          cls: 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content',
        });

        navFileTitleContent.setText(lineInfo.line + " : " + lineInfo.content);
        navFileTitle.addEventListener('contextmenu', (event: MouseEvent) => {
          const menu = new Menu();
          menu.addItem((item) =>
            item
              .setSection('action')
              .setTitle('Open in new tab')
              .setIcon('file-plus')
              .onClick(() => {
                if (f === null) {
                  return;
                }
                this.focusFileAtLine(f, 'tab', 0);
              })
          );
          const file = this.app.vault.getAbstractFileByPath(f?.path);
          this.app.workspace.trigger(
            'file-menu',
            menu,
            file,
            'link-context-menu',
          );
          menu.showAtPosition({ x: event.clientX, y: event.clientY });
        });
  
        navFileTitle.addEventListener('click', (event: MouseEvent) => {  
          const newLeaf = Keymap.isModEvent(event)
          this.focusFileAtLine(f, newLeaf, lineInfo.line);
        });

    }
    //console.log("finish redraw")
  }

  isWindows() {
    return !Platform.isAndroidApp && !Platform.isIosApp && !Platform.isMacOS && !Platform.isSafari
  }

  async onClose() {
    // Cleanup if necessary
  }

  private readonly focusFileAtLine = (file: TFile, newLeaf: boolean | PaneType, line: number): void => {
    const targetFile = this.app.vault
      .getFiles()
      .find((f) => f.path === file.path);

    if (targetFile) {
      const leaf = this.app.workspace.getLeaf(newLeaf);
      leaf.openFile(targetFile).then(() => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          view.editor.setCursor({ line: line, ch: 0 });
          view.editor.scrollIntoView({from: {line: line, ch: 0}, to: {line: line, ch: 0}}, true)
          if (line != 0) {
            const ch = view.editor.getLine(line).length;
            view.editor.setSelection({line: line, ch: 0}, {line: line, ch: ch});
            view.editor.scrollIntoView({from: {line: line, ch: 0}, to: {line: line, ch: 0}}, true)
          }
        }
      });
    } else {
      new Notice('Cannot find a file with that name');
    }
  };


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
}

export { CurrentNoteAllLineView as CurrentNoteAllLineView, VIEW_TYPE_CURRENT_NOTE_ALL_LINE as VIEW_TYPE_CURRENT_NOTE_ALL_LINE };