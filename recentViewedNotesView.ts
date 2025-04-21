import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView, setIcon, debounce } from 'obsidian';
import { getRecentNotes, getRecentNotesWithInfo, RecentNoteInfo } from 'selfutil/getRecentNotes';
import { getNoteType, NoteType } from 'selfutil/getTaskTag';

export const VIEW_TYPE_RECENT_VIEWED_NOTES = 'recent-viewed-notes-view';

class RecentViewedNotesView extends ItemView {
  public currentNotesPath: string;
  public filterText: string = '';
  private pendingFilterText: string = '';
  private debouncedFilter: () => void;
  private batchSize = 20; // Number of items to render at once
  
  constructor(leaf: WorkspaceLeaf, notesTypeTag: string) {
    super(leaf);
    this.currentNotesPath = notesTypeTag;
    
    // Create debounced filter function
    this.debouncedFilter = debounce(() => {
      this.filterText = this.pendingFilterText;
      this.redraw(false);
    }, 300, true);
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
    // Preserve the scroll position
    let scrollPosition = 0;
    const contentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
    if (contentContainer) {
      scrollPosition = contentContainer.scrollTop;
    }
    
    // Use DocumentFragment for all DOM operations
    const fragment = document.createDocumentFragment();
    
    // Add filter input at the top with a search button
    const filterContainerEl = document.createElement('div');
    filterContainerEl.className = 'recent-viewed-notes-filter-container';
    fragment.appendChild(filterContainerEl);
    
    // Create a wrapper for the search input and button to sit side by side
    const searchInputWrapperEl = document.createElement('div');
    searchInputWrapperEl.className = 'recent-viewed-notes-search-wrapper';
    filterContainerEl.appendChild(searchInputWrapperEl);
    
    const filterInputEl = document.createElement('input');
    filterInputEl.type = 'text';
    filterInputEl.placeholder = 'Filter notes...';
    filterInputEl.className = 'recent-viewed-notes-filter-input';
    filterInputEl.value = this.pendingFilterText || this.filterText;
    searchInputWrapperEl.appendChild(filterInputEl);
    
    // Create search button
    const searchButtonEl = document.createElement('button');
    searchButtonEl.className = 'recent-viewed-notes-search-button';
    setIcon(searchButtonEl, 'search');
    searchInputWrapperEl.appendChild(searchButtonEl);
    
    // Handle input changes with debouncing
    filterInputEl.addEventListener('input', (e: InputEvent) => {
      const target = e.target as HTMLInputElement;
      this.pendingFilterText = target.value;
      this.debouncedFilter();
    });
    
    // Apply filter when Enter is pressed in the input field
    filterInputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.filterText = this.pendingFilterText;
        this.redraw(false);
      }
    });
    
    // Apply filter when search button is clicked
    searchButtonEl.addEventListener('click', () => {
      this.filterText = this.pendingFilterText;
      this.redraw(false);
    });
    
    // Get the combined and sorted list of recently viewed and modified notes
    const recentlyViewedNotes = getRecentNotesWithInfo(this.app, 100);
    
    const rootEl = document.createElement('div');
    rootEl.className = 'nav-folder mod-root scrollable';
    fragment.appendChild(rootEl);
    
    const childrenEl = document.createElement('div');
    childrenEl.className = 'nav-folder-children';
    rootEl.appendChild(childrenEl);
    
    // Create filtered list first to avoid DOM operations on files we won't display
    const filteredNotes = recentlyViewedNotes.filter(noteInfo => {
      const file = this.app.vault.getAbstractFileByPath(noteInfo.path);
      if (!file || !(file instanceof TFile)) return false;
      
      if (this.filterText && !file.path.toLowerCase().includes(this.filterText.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Batch rendering for better performance
    this.renderBatchedNotes(childrenEl, filteredNotes);
    
    // Add a message if no recently viewed notes are found or nothing matches filter
    if (filteredNotes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'nav-folder-empty-state';
      
      if (this.filterText) {
        emptyState.textContent = `No notes matching "${this.filterText}"`;
      } else {
        emptyState.textContent = 'No recently viewed notes found';
      }
      
      childrenEl.appendChild(emptyState);
    }
    
    // Clear and replace container content in one operation
    this.containerEl.empty();
    this.containerEl.appendChild(fragment);
    
    // Restore the scroll position after a short delay to ensure the DOM has updated
    if (scrollPosition > 0) {
      window.requestAnimationFrame(() => {
        const newContentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
        if (newContentContainer) {
          newContentContainer.scrollTop = scrollPosition;
        }
      });
    }
    
    // Focus on filter input if it was focused before redraw
    if (document.activeElement === filterInputEl) {
      filterInputEl.focus();
    }
  }
  
  // Render notes in batches to avoid UI freezing
  private renderBatchedNotes(container: HTMLElement, notes: RecentNoteInfo[]): void {
    // Create all notes in a single document fragment
    const fragment = document.createDocumentFragment();
    
    // Process in smaller chunks to avoid long-running tasks
    for (let i = 0; i < notes.length; i++) {
      const noteInfo = notes[i];
      const file = this.app.vault.getAbstractFileByPath(noteInfo.path);
      if (!file || !(file instanceof TFile)) continue;
      
      // Create the note element
      const noteEl = this.createNoteElement(file, noteInfo);
      fragment.appendChild(noteEl);
      
      // If we've reached a batch boundary and there are more items,
      // schedule the next batch to allow UI to update
      if ((i + 1) % this.batchSize === 0 && i + 1 < notes.length) {
        window.requestAnimationFrame(() => {
          // Just allow the UI thread to breathe
        });
      }
    }
    
    // Append all elements at once
    container.appendChild(fragment);
  }
  
  // Create a single note element
  private createNoteElement(file: TFile, noteInfo: RecentNoteInfo): HTMLElement {
    const navFile = document.createElement('div');
    navFile.className = 'tree-item nav-file recent-viewed-notes-file';
    
    const navFileTitle = document.createElement('div');
    navFileTitle.className = 'tree-item-self is-clickable nav-file-title recent-viewed-notes-title';
    navFile.appendChild(navFileTitle);
    
    const navFileTitleContent = document.createElement('div');
    navFileTitleContent.className = 'tree-item-inner nav-file-title-content recent-viewed-notes-title-content internal-link self-wrap-content';
    
    // Just display the filename without the path for cleaner UI
    const noteType: NoteType | null = getNoteType(file.path);
    const prefix = noteType ? (noteType.prefix ? noteType.prefix + " " : "") : "";
    navFileTitleContent.textContent = prefix + file.path;
    navFileTitle.appendChild(navFileTitleContent);
    
    // Add metadata as subtitle with time info
    const navFileSubtitle = document.createElement('div');
    navFileSubtitle.className = 'tree-item-flair recent-viewed-notes-subtitle';
    
    // Show folder path and relative time info
    const formattedDate = this.getRelativeTimeString(noteInfo);
    navFileSubtitle.textContent = ` • ${formattedDate}`;
    navFileTitle.appendChild(navFileSubtitle);
    
    // Use event delegation for better performance
    this.addNoteEventListeners(navFileTitle, file);
    
    return navFile;
  }
  
  // Add event listeners to note elements
  private addNoteEventListeners(element: HTMLElement, file: TFile): void {
    // Add right-click menu
    element.addEventListener('contextmenu', (event: MouseEvent) => {
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
    element.addEventListener('click', (event: MouseEvent) => {  
      const newLeaf = Keymap.isModEvent(event);
      this.focusFile(file, newLeaf);
    });
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