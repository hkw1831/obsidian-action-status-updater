import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView, CachedMetadata, Platform } from 'obsidian';
import { getNoteType } from 'selfutil/getTaskTag';

const VIEW_TYPE_CURRENT_OURSTANDING_TASK = 'current-note-outstanding-action-view';

interface LineInfo {
  content: string;
  line: number;
  tag: string;
}

class CurrentNoteOutstandingActionView extends ItemView {
  public currentNotesPath: string
  tagsToMatch = ["#wn", "#nn", "#wl", "#nl", "#ww", "#nw", "tm"];
  constructor(leaf: WorkspaceLeaf, notesTypeTag: string) {
    super(leaf);
    this.currentNotesPath = notesTypeTag
  }

  getViewType() {
    return VIEW_TYPE_CURRENT_OURSTANDING_TASK;
  }

  getDisplayText() {
    return 'Outstanding Task of Current View';
  }

  async onOpen() {
    this.redraw(true);
  }

  public getIcon(): string {
    return 'list-checks';
  }

  public readonly redraw = async (forceRedraw: boolean): Promise<void> => {
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
    this.currentNotesPath = activeFile.path

    const path = activeFile.path

    const f : TFile = this.app.vault.getAbstractFileByPath(path) as TFile
    if (!f) {
      return
    }
    //console.log("redraw()")
    //const tag = "#c/t/p"
    
    this.containerEl.empty();

    const fileCache = this.app.metadataCache.getFileCache(f);
    let lineInfos = []
    
    if (fileCache && fileCache.tags) {
      const content = await this.app.vault.read(f);
      const fileLines = content.split('\n');
      
      for (const tagToMatch of this.tagsToMatch) {
        let lineInfosInner : LineInfo[] = []
        for (const tagMetadata of fileCache.tags) {
          if (tagToMatch === tagMetadata.tag) {
            const heading = this.getHeadingForLine(fileCache, tagMetadata.position.start.line);
            const lineContent = fileLines[tagMetadata.position.start.line].trim();
            const newLineIfNeeded = heading.length != 0 ? (this.isWindows() ? "\r\n" : "\n") : "" 
            
            lineInfosInner.push({
              content: heading + newLineIfNeeded + lineContent, 
              line: tagMetadata.position.start.line,
              tag: tagMetadata.tag
            });
          }
        }
        if (lineInfosInner.length > 0) {
          lineInfos.push(lineInfosInner)
        }
      }
    }

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
      navFile.setText(lineInfo[0].tag)
      for (let lineInfoInner of lineInfo) {
        const navFile = childrenEl.createDiv({
          cls: 'tree-item nav-file recent-files-file',
        });
        const navFileTitle = navFile.createDiv({
          cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
        });
        const navFileTitleContent = navFileTitle.createDiv({
          cls: 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content',
        });

        navFileTitleContent.setText(lineInfoInner.content);
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
          this.focusFileAtLine(f, newLeaf, lineInfoInner.line);
        });
      }
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

export { CurrentNoteOutstandingActionView as CurrentNoteOutstandingActionView, VIEW_TYPE_CURRENT_OURSTANDING_TASK as VIEW_TYPE_CURRENT_OURSTANDING_TASK };