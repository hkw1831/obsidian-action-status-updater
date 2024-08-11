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
    const button = this.containerEl.createEl('button', {
        text:'[Refresh]',
        cls: 'redraw-button'
      });
  
      button.onclick = () => {
        this.redraw();
      };

    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    //const files = this.app.vault.getMarkdownFiles().filter((file) => {file.basename.startsWith("Threads")});
    const files : TFile[] = filesWhereTagIsUsed(this.notesTypeTag).map(filePath => this.app.vault.getAbstractFileByPath(filePath) as TFile)
    //const headers : NoteWithHeader[] = []
    //filePaths.forEach(n => {
    //  const file = this.app.vault.getAbstractFileByPath(n) as TFile
    //console.log(files.length)
    files.forEach(currentFile => {
        //console.log(currentFile.basename);
      //const link = this.containerEl.createEl('a', { text: currentFile.basename });
      //link.href = `#${currentFile.path}`;
      //link.onclick = (e) => {
      //  e.preventDefault();
      //  this.app.workspace.openLinkText(currentFile.path, currentFile.path, true);
      //};
      //this.containerEl.createEl('div', { cls: 'note-item' }).appendChild(link);

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

      //if (openFile && currentFile.path === openFile.path) {
      //  navFileTitle.addClass('is-active');
     // }
/*
      navFileTitle.setAttr('draggable', 'true');
      navFileTitle.addEventListener('dragstart', (event: DragEvent) => {
        if (!currentFile?.path) return;

        const file = this.app.metadataCache.getFirstLinkpathDest(
          currentFile.path,
          '',
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dragManager = (this.app as any).dragManager;
        const dragData = dragManager.dragFile(event, file);
        dragManager.onDragStart(event, dragData);
      });
*/

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
/*
      navFileTitleContent.addEventListener('mousedown', (event: MouseEvent) => {
        if (!currentFile) return;

        if (event.button === 1) {
          event.preventDefault();
          this.focusFile(currentFile, 'tab');
        }
      });
*/
/*
      const navFileDelete = navFileTitle.createDiv({
        cls: 'recent-files-file-delete menu-item-icon',
      });
      setIcon(navFileDelete, 'lucide-x');

      navFileDelete.addEventListener('click', async (event) => {
        event.stopPropagation();

        await this.removeFile(currentFile);
        this.redraw();
      });
      */
     
    });

    // this.contentEl.setChildrenInPlace([rootEl]);
     //this.containerEl.setChildrenInPlace([rootEl]);
    
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
      /*
      this.data.recentFiles = this.data.recentFiles.filter(
        (fp) => fp.path !== file.path,
      );
      this.plugin.saveData();
      this.redraw();
      */
    }
  };
}

export { NotesTypeView, VIEW_TYPE_NOTE_LIST };