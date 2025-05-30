import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView, CachedMetadata, Platform } from 'obsidian';
import { filesWhereTagIsUsed } from 'selfutil/findNotesFromTag';
import { getNoteType } from 'selfutil/getTaskTag';

const VIEW_TYPE_NOTE_LIST = 'note-list-view';

interface NotesTypeViewData {
  title: string;
  lineInfo: LineInfo[];
  file: TFile | null;
}

interface LineInfo {
  content: string;
  line: number;
}

class NotesTypeView extends ItemView {
  public notesTypeTag: string
  constructor(leaf: WorkspaceLeaf, notesTypeTag: string) {
    super(leaf);
    this.notesTypeTag = notesTypeTag
  }

  getViewType() {
    return VIEW_TYPE_NOTE_LIST;
  }

  getDisplayText() {
    return 'Tagged Notes';
  }

  async onOpen() {
    this.redraw();
  }

  public getIcon(): string {
    return 'hash';
  }

  public readonly redraw = async (): Promise<void> => {
    // Preserve the scroll position
    let scrollPosition = 0;
    const contentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
    if (contentContainer) {
      scrollPosition = contentContainer.scrollTop;
    }
    
    //console.log("redraw()")
    //const tag = "#c/t/p"
    

    this.containerEl.empty();

    if (this.notesTypeTag.length <= 0) {
        return;
    }
    
    this.containerEl.createDiv({ cls: 'nav-header', text: "Tags: " + this.notesTypeTag });

    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    const length = this.notesTypeTag.split(" ").length
    const tag1 = this.notesTypeTag.split(" ")[0]
    const tag2 = length > 1 ? this.notesTypeTag.split(" ")[1] : ""

    const files : TFile[] = filesWhereTagIsUsed(tag1).map(filePath => this.app.vault.getAbstractFileByPath(filePath) as TFile)

    let noteDatas: NotesTypeViewData[] = await Promise.all(files.map(async (f) => {
      let noteType = getNoteType(f.path)
      let prefix = noteType ? noteType.prefix + " " : ""

      const isActionTag = (!/^#[a-z]\/[a-z]\/[a-z]$/.test(tag1)
      && !/^#[a-z]\/[a-z]$/.test(tag1)
      && !/^#[a-z]$/.test(tag1)) || tag2.length > 0

      let lineInfo: LineInfo[] = []

      if (isActionTag) {
        const actionTag = tag2.length > 0 ? tag2 : tag1
        const fileCache = this.app.metadataCache.getFileCache(f);
        if (fileCache && fileCache.tags) {
          const content = await this.app.vault.read(f);
          const fileLines = content.split('\n');
          for (const tag of fileCache.tags) {
            if (tag.tag === actionTag) {
              const heading = this.getHeadingForLine(fileCache, tag.position.start.line);
              const lineContent = fileLines[tag.position.start.line].trim();
              const newLineIfNeeded = heading.length != 0 ? (this.isWindows() ? "\r\n" : "\n") : "" 
              lineInfo.push({
                content: heading + newLineIfNeeded + lineContent, 
                line: tag.position.start.line
              });
            }
          }
        }
      }

      if (tag2.length > 0) {
        if (lineInfo.length > 0) {
          return {
            title: prefix + f.basename,
            lineInfo: lineInfo,
            file: f
          };
        } else {
          return {
            title: "invalid",
            lineInfo: [],
            file: null
          }
        }
      }
      return {
        title: prefix + f.basename,
        lineInfo: lineInfo,
        file: f
      };
    }));

    noteDatas.forEach(data => {
      if (data.file === null) {
        return;
      }

      const navFile = childrenEl.createDiv({
        cls: 'tree-item nav-file recent-files-file',
      });
      const navFileTitle = navFile.createDiv({
        cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
      });
      const navFileTitleContent = navFileTitle.createDiv({
        cls: 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content',
      });

      navFileTitleContent.setText(data.title);

      navFileTitle.addEventListener('mouseover', (event: MouseEvent) => {
        if (!data.file?.path) return;

        this.app.workspace.trigger('hover-link', {
          event,
          source: VIEW_TYPE_NOTE_LIST,
          hoverParent: rootEl,
          targetEl: navFile,
          linktext: data.file.path,
        });
      });

      navFileTitle.addEventListener('contextmenu', (event: MouseEvent) => {
        if (data.file === null) {
          return;
        }
        if (!data.file?.path) return;

        const menu = new Menu();
        menu.addItem((item) =>
          item
            .setSection('action')
            .setTitle('Open in new tab')
            .setIcon('file-plus')
            .onClick(() => {
              if (data.file === null) {
                return;
              }
              this.focusFileAtLine(data.file, 'tab', 0);
            })
        );
        const file = this.app.vault.getAbstractFileByPath(data.file?.path);
        this.app.workspace.trigger(
          'file-menu',
          menu,
          file,
          'link-context-menu',
        );
        menu.showAtPosition({ x: event.clientX, y: event.clientY });
      });

      navFileTitle.addEventListener('click', (event: MouseEvent) => {
        if (!data) return;
        if (data.file === null) {
          return;
        }

        const newLeaf = Keymap.isModEvent(event)
        this.focusFileAtLine(data.file, newLeaf, 0);
      });

      // =============

      for (const lineInfo of data.lineInfo) {
        const navFileLine = navFile.createDiv({
          //cls: 'tree-item nav-file recent-files-file',
          cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
        });
        const navFileLineContent = navFileLine.createDiv({
          cls: 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content self-padding-left-10',
        });

        navFileLineContent.innerText = lineInfo.content;

        navFileLine.addEventListener('mouseover', (event: MouseEvent) => {
          if (!data.file?.path) return;

          this.app.workspace.trigger('hover-link', {
            event,
            source: VIEW_TYPE_NOTE_LIST,
            hoverParent: rootEl,
            targetEl: navFileLine,
            linktext: data.file.path,
          });
        });

        navFileLine.addEventListener('contextmenu', (event: MouseEvent) => {
          if (!data.file?.path) return;

          const menu = new Menu();
          menu.addItem((item) =>
            item
              .setSection('action')
              .setTitle('Open in new tab')
              .setIcon('file-plus')
              .onClick(() => {
                if (data.file === null) {
                  return;
                }
                this.focusFileAtLine(data.file, 'tab', lineInfo.line);
              })
          );
          const file = this.app.vault.getAbstractFileByPath(data.file?.path);
          this.app.workspace.trigger(
            'file-menu',
            menu,
            file,
            'link-context-menu',
          );
          menu.showAtPosition({ x: event.clientX, y: event.clientY });
        });

        navFileLine.addEventListener('click', (event: MouseEvent) => {
          if (!data) return;
          if (data.file === null) {
            return;
          }

          const newLeaf = Keymap.isModEvent(event)
          this.focusFileAtLine(data.file, newLeaf, lineInfo.line);
        });
      }


      // =================

    });
    
    // Restore the scroll position after a short delay to ensure the DOM has updated
    if (scrollPosition > 0) {
      setTimeout(() => {
        const newContentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
        if (newContentContainer) {
          newContentContainer.scrollTop = scrollPosition;
        }
      }, 0);
    }
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

export { NotesTypeView, VIEW_TYPE_NOTE_LIST };