import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu } from 'obsidian';
import { filesWhereTagIsUsed } from 'selfutil/findNotesFromTag';
import { getNoteType } from 'selfutil/getTaskTag';

const VIEW_TYPE_NOTE_LIST = 'note-list-view';


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

  public readonly redraw = (): void => {
    //console.log("redraw()")
    //const tag = "#c/t/p"
    

    this.containerEl.empty();

    if (this.notesTypeTag.length <= 0) {
        return;
    }
    
    this.containerEl.createDiv({ cls: 'nav-header', text: "Tags: " + this.notesTypeTag });

    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    const files : TFile[] = filesWhereTagIsUsed(this.notesTypeTag).map(filePath => this.app.vault.getAbstractFileByPath(filePath) as TFile)

    files.forEach(currentFile => {

      const navFile = childrenEl.createDiv({
        cls: 'tree-item nav-file recent-files-file',
      });
      const navFileTitle = navFile.createDiv({
        cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
      });
      const navFileTitleContent = navFileTitle.createDiv({
        cls: 'tree-item-inner nav-file-title-content recent-files-title-content internal-link',
      });

      let noteType = getNoteType(currentFile.path)
      let prefix = noteType ? noteType.prefix + " " : ""
      navFileTitleContent.setText(prefix + currentFile.basename);

      navFileTitle.addEventListener('mouseover', (event: MouseEvent) => {
        if (!currentFile?.path) return;

        this.app.workspace.trigger('hover-link', {
          event,
          source: VIEW_TYPE_NOTE_LIST,
          hoverParent: rootEl,
          targetEl: navFile,
          linktext: currentFile.path,
        });
      });
      

      navFileTitle.addEventListener('contextmenu', (event: MouseEvent) => {
        if (!currentFile?.path) return;

        const menu = new Menu();
        menu.addItem((item) =>
          item
            .setSection('action')
            .setTitle('Open in new tab')
            .setIcon('file-plus')
            .onClick(() => {
              this.focusFile(currentFile, 'tab');
            })
        );
        const file = this.app.vault.getAbstractFileByPath(currentFile?.path);
        this.app.workspace.trigger(
          'file-menu',
          menu,
          file,
          'link-context-menu',
        );
        menu.showAtPosition({ x: event.clientX, y: event.clientY });
      });

      navFileTitle.addEventListener('click', (event: MouseEvent) => {
        if (!currentFile) return;

        const newLeaf = Keymap.isModEvent(event)
        this.focusFile(currentFile, newLeaf);
      });
    });
    
  }

  async onClose() {
    // Cleanup if necessary
  }

  private readonly focusFile = (file: TFile, newLeaf: boolean | PaneType): void => {
    const targetFile = this.app.vault
      .getFiles()
      .find((f) => f.path === file.path);

    if (targetFile) {
      const leaf = this.app.workspace.getLeaf(newLeaf);
      leaf.openFile(targetFile);
    } else {
      new Notice('Cannot find a file with that name');
    }
  };
}

export { NotesTypeView, VIEW_TYPE_NOTE_LIST };