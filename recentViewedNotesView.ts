import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView } from 'obsidian';
import { getRecentNotes, getRecentNotesWithInfo, RecentNoteInfo } from 'selfutil/getRecentNotes';
import { getNoteType, NoteType } from 'selfutil/getTaskTag';

export const VIEW_TYPE_RECENT_VIEWED_NOTES = 'recent-viewed-notes-view';

class RecentViewedNotesView extends ItemView {
  public currentNotesPath: string;

  constructor(leaf: WorkspaceLeaf, notesTypeTag: string) {
    super(leaf);
    this.currentNotesPath = notesTypeTag;
  }

  getViewType() {
    return VIEW_TYPE_RECENT_VIEWED_NOTES;
  }

  getDisplayText() {
    return 'Recent Viewed Notes';
  }

  async onOpen() {
    this.redraw(true);
  }

  public getIcon(): string {
    return 'history';
  }

  public readonly redraw = async (forceRedraw: boolean): Promise<void> => {
    this.containerEl.empty();
    
    // Get the combined and sorted list of recently viewed and modified notes
    const recentlyViewedNotes = getRecentNotesWithInfo(this.app, 100);
    
    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });
    
    for (let noteInfo of recentlyViewedNotes) {
      const file = this.app.vault.getAbstractFileByPath(noteInfo.path);
      if (!file || !(file instanceof TFile)) continue;
      
      const navFile = childrenEl.createDiv({
        cls: 'tree-item nav-file recent-viewed-notes-file',
      });
      
      const navFileTitle = navFile.createDiv({
        cls: 'tree-item-self is-clickable nav-file-title recent-viewed-notes-title',
      });
      
      const navFileTitleContent = navFileTitle.createDiv({
        cls: 'tree-item-inner nav-file-title-content recent-viewed-notes-title-content internal-link self-wrap-content',
      });
      
      // Just display the filename without the path for cleaner UI
      const noteType : NoteType | null = getNoteType(file.path)
      const prefix = noteType ? (noteType.prefix ? noteType.prefix + " " : "") : ""
      navFileTitleContent.setText(prefix + file.path);
      
      // Add metadata as subtitle with time info
      const navFileSubtitle = navFileTitle.createDiv({
        cls: 'tree-item-flair recent-viewed-notes-subtitle',
      });

     // Show folder path and relative time info
     const formattedDate = this.getRelativeTimeString(noteInfo);
     navFileSubtitle.setText(` • ${formattedDate}`);
      
      // Add right-click menu
      navFileTitle.addEventListener('contextmenu', (event: MouseEvent) => {
        const menu = new Menu();
        menu.addItem((item) =>
          item
            .setSection('action')
            .setTitle('Open in new tab')
            .setIcon('file-plus')
            .onClick(() => {
              this.focusFile(file, 'tab');
            })
        );
        
        this.app.workspace.trigger(
          'file-menu',
          menu,
          file,
          'link-context-menu',
        );
        
        menu.showAtPosition({ x: event.clientX, y: event.clientY });
      });

      // Add click handler to open the file
      navFileTitle.addEventListener('click', (event: MouseEvent) => {  
        const newLeaf = Keymap.isModEvent(event);
        this.focusFile(file, newLeaf);
      });
    }
    
    // Add a message if no recently viewed notes are found
    if (recentlyViewedNotes.length === 0) {
      const emptyState = childrenEl.createDiv({
        cls: 'nav-folder-empty-state',
      });
      emptyState.setText('No recently viewed notes found');
    }
  }
  
  // Helper method to format the time display based on recency
  private getRelativeTimeString(noteInfo: RecentNoteInfo): string {
    const now = Date.now();
    // Use the most recent time between last viewed and modified
    const mostRecentTime = Math.max(noteInfo.lastViewed, noteInfo.mtime);
    const diffMinutes = Math.floor((now - mostRecentTime) / 60000);
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older items, show the actual date
    return new Date(mostRecentTime).toLocaleDateString();
  }
  
  async onClose() {
    // Cleanup if necessary
  }
  
  private readonly focusFile = (file: TFile, newLeaf: boolean | PaneType): void => {
    if (file) {
      const leaf = this.app.workspace.getLeaf(newLeaf);
      leaf.openFile(file).then(() => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          // Focus on the beginning of the file
          view.editor.setCursor({ line: 0, ch: 0 });
          view.editor.scrollIntoView({ from: { line: 0, ch: 0 }, to: { line: 0, ch: 0 } }, true);
        }
      });
    } else {
      new Notice('Cannot find a file with that name');
    }
  };
}

export { RecentViewedNotesView };