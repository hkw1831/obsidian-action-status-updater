import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView, CachedMetadata, Platform } from 'obsidian';
import { filesWhereTagIsUsed } from 'selfutil/findNotesFromTag';
import { getNoteType } from 'selfutil/getTaskTag';

const VIEW_TYPE_CHECK_NOTES_LINKING = 'check-notes-linking-view';

class CheckNotesLinkingView extends ItemView {
  public title: string
  public notesPath: string[]
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.title = ''
    this.notesPath = [];
  }

  getViewType() {
    return VIEW_TYPE_CHECK_NOTES_LINKING;
  }

  getDisplayText() {
    return 'Check Notes Linking';
  }

  async onOpen() {
    this.redraw();
  }

  public getIcon(): string {
    return 'shield-check';
  }

  public setNotesPath(notesPath: string[]) {
    this.notesPath = notesPath;
  }

  public setTitle(title: string) {
    this.title = title;
  }

  public readonly redraw = async (): Promise<void> => {
    // Preserve the scroll position
    let scrollPosition = 0;
    const contentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
    if (contentContainer) {
      scrollPosition = contentContainer.scrollTop;
    }

    this.containerEl.empty();

    if (this.notesPath.length <= 0) {
        return;
    }

    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable', text: "Operation: " + this.title });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    // Use DocumentFragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    
    // Render all note paths
    for (const notePath of this.notesPath) {
      if (!notePath) continue;
      
      this.renderNoteItem(notePath, rootEl, fragment);
    }

    // Append all items at once
    childrenEl.appendChild(fragment);
    
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

  // Helper method to render a note item
  private renderNoteItem(notePath: string, rootEl: HTMLElement, fragment: DocumentFragment) {
    const navFile = document.createElement('div');
    navFile.className = 'tree-item nav-file recent-files-file';
    
    const navFileTitle = document.createElement('div');
    navFileTitle.className = 'tree-item-self is-clickable nav-file-title recent-files-title';
    
    let noteType = getNoteType(notePath);
    let prefix = noteType ? noteType.prefix + " " : "";
    const navFileTitleContent = document.createElement('div');
    navFileTitleContent.className = 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content';
    navFileTitleContent.textContent = prefix + notePath;
    
    navFileTitle.appendChild(navFileTitleContent);
    navFile.appendChild(navFileTitle);
    
    // Get the TFile object for this path
    const file = this.app.vault.getAbstractFileByPath(notePath) as TFile;
    
    // Setup event listeners
    if (file) {
      this.setupEventListeners(navFileTitle, file, rootEl, navFile, 0);
    }
    
    fragment.appendChild(navFile);
  }
  
  // Setup common event listeners
  private setupEventListeners(element: HTMLElement, file: TFile, rootEl: HTMLElement, targetEl: HTMLElement, line: number) {
    element.addEventListener('mouseover', (event: MouseEvent) => {
      if (!file?.path) return;
      
      this.app.workspace.trigger('hover-link', {
        event,
        source: VIEW_TYPE_CHECK_NOTES_LINKING,
        hoverParent: rootEl,
        targetEl: targetEl,
        linktext: file.path,
      });
    });
    
    element.addEventListener('contextmenu', (event: MouseEvent) => {
      if (!file?.path) return;
      
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setSection('action')
          .setTitle('Open in new tab')
          .setIcon('file-plus')
          .onClick(() => {
            this.focusFileAtLine(file, 'tab', line);
          })
      );
      
      const abstractFile = this.app.vault.getAbstractFileByPath(file.path);
      this.app.workspace.trigger('file-menu', menu, abstractFile, 'link-context-menu');
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    });
    
    element.addEventListener('click', (event: MouseEvent) => {
      if (!file) return;
      
      const newLeaf = Keymap.isModEvent(event);
      this.focusFileAtLine(file, newLeaf, line);
    });
  }

  // Replace the original getHeadingForLine with a more efficient version that uses the headings map
  getHeadingForLine(fileCache: CachedMetadata, lineNumber: number): string {
    if (!fileCache || !fileCache.headings) {
      return "";
    }

    let currentHeading = "";
    for (const heading of fileCache.headings) {
      if (heading.position.start.line <= lineNumber) {
        currentHeading = "# " + heading.heading;
      } else {
        break;
      }
    }

    return currentHeading;
  }

  isWindows() {
    return !Platform.isAndroidApp && !Platform.isIosApp && !Platform.isMacOS && !Platform.isSafari;
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
}

export { CheckNotesLinkingView, VIEW_TYPE_CHECK_NOTES_LINKING };