import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView, CachedMetadata, Platform } from 'obsidian';
import { getNoteType, NoteType } from 'selfutil/getTaskTag';

const VIEW_TYPE_RECENT_FILE = 'recent-file-view';

interface FileInfo {
  file: TFile;
  modifiedTime: number;
}

class RecentFilesView extends ItemView {
  public currentNotesPath: string
  filterStr: string = ''
  constructor(leaf: WorkspaceLeaf, notesTypeTag: string) {
    super(leaf);
    this.currentNotesPath = notesTypeTag
  }

  getViewType() {
    return VIEW_TYPE_RECENT_FILE;
  }

  getDisplayText() {
    return 'Recent File View';
  }

  async onOpen() {
    this.redraw(true);
  }

  public getIcon(): string {
    return 'lucide-pencil';
  }

  clearFilter() {
    this.filterStr = ''
  }

  public readonly redraw = async (forceRedraw: boolean): Promise<void> => {
    this.containerEl.empty();
    const fileInfos : FileInfo[] = []
    const now = Date.now();
    app.vault.getMarkdownFiles().forEach((f) => {
      if (f.stat.mtime - now > -7 * 24 * 60 * 60 * 1000) { // 7 days
        fileInfos.push({
          file: f,
          modifiedTime: f.stat.mtime,
        });
      }
    });

    fileInfos.sort((a, b) => b.modifiedTime - a.modifiedTime);

    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    for (let fileInfo of fileInfos){
        const navFile = childrenEl.createDiv({
          cls: 'tree-item nav-file recent-files-file',
        });
        const navFileTitle = navFile.createDiv({
          cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
        });
        const navFileTitleContent = navFileTitle.createDiv({
          cls: 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content',
        });
        const noteType : NoteType | null = getNoteType(fileInfo.file.path)
        const prefix = noteType ? (noteType.prefix ? noteType.prefix + " " : "") : ""
        navFileTitleContent.setText(prefix + fileInfo.file.path);
        navFileTitle.addEventListener('contextmenu', (event: MouseEvent) => {
          const menu = new Menu();
          menu.addItem((item) =>
            item
              .setSection('action')
              .setTitle('Open in new tab')
              .setIcon('file-plus')
              .onClick(() => {
                this.focusFileAtLine(fileInfo.file, 'tab', 0);
              })
          );
          //const file = this.app.vault.getAbstractFileByPath(f?.path);
          this.app.workspace.trigger(
            'file-menu',
            menu,
            fileInfo.file,
            'link-context-menu',
          );
          menu.showAtPosition({ x: event.clientX, y: event.clientY });
        });
  
        navFileTitle.addEventListener('click', (event: MouseEvent) => {  
          const newLeaf = Keymap.isModEvent(event)
          this.focusFileAtLine(fileInfo.file, newLeaf, 0);
        });

    }
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

export { RecentFilesView as RecentFilesView, VIEW_TYPE_RECENT_FILE as VIEW_TYPE_RECENT_FILE };