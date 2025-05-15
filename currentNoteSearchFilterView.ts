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
  private compiledRegex: RegExp | null = null
  private isUsingRegex: boolean = false
  private lastFilterTime: number = 0
  private throttleTime: number = 100 // ms
  
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
    this.compiledRegex = null
    this.isUsingRegex = false
  }

  private prepareFilter(filterStr: string): void {
    if (!filterStr) {
      this.compiledRegex = null;
      this.isUsingRegex = false;
      return;
    }
    
    // Check if it looks like a regex pattern (contains special chars)
    this.isUsingRegex = /[.*+?^${}()|[\]\\]/.test(filterStr);
    
    if (this.isUsingRegex) {
      try {
        this.compiledRegex = new RegExp(filterStr, 'i');
      } catch (e) {
        // If invalid regex, fall back to plain text search
        this.compiledRegex = null;
        this.isUsingRegex = false;
      }
    } else {
      this.compiledRegex = null;
    }
  }

  public readonly redraw = async (forceRedraw: boolean): Promise<void> => {
    // Throttle redraws to prevent excessive CPU usage
    const now = Date.now();
    if (!forceRedraw && now - this.lastFilterTime < this.throttleTime) {
      setTimeout(() => this.redraw(true), this.throttleTime);
      return;
    }
    this.lastFilterTime = now;

    // Preserve the scroll position
    let scrollPosition = 0;
    const contentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
    if (contentContainer) {
      scrollPosition = contentContainer.scrollTop;
    }
    
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
      return;
    }

    if (!forceRedraw && activeFile.path === this.currentNotesPath) {
      return;
    }
    
    if (activeFile.path !== this.currentNotesPath) {
      this.clearFilter()
    }
    this.currentNotesPath = activeFile.path

    const f: TFile = this.app.vault.getAbstractFileByPath(activeFile.path) as TFile
    if (!f) {
      return
    }
    
    this.containerEl.empty();

    // Create UI elements first to improve perceived performance
    const searchContainer = this.createSearchUI();
    
    let noteType = getNoteType(activeFile.path)
    let prefix = noteType ? (noteType.prefix ? noteType.prefix + " " : "") : ""
    
    this.containerEl.createDiv({ cls: 'nav-header', text: "Path: " + prefix + activeFile.path });

    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });
    
    // Show loading indicator for large files
    const loadingIndicator = childrenEl.createDiv({ 
      cls: 'nav-file-title', 
      text: 'Loading content...' 
    });
    
    // Use setTimeout to allow UI to render before heavy processing
    setTimeout(async () => {
      // Prepare filter
      this.prepareFilter(this.filterStr.toLowerCase());
      
      // Process file content
      const content = await this.app.vault.read(f);
      const fileLines = content.split('\n');
      
      // Create a document fragment to batch DOM operations
      const fragment = document.createDocumentFragment();
      
      // Process lines in batches to prevent UI freezing
      const batchSize = 100;
      let processedLines = 0;
      const totalLines = fileLines.length;
      
      const processNextBatch = async () => {
        if (processedLines >= totalLines) {
          // Processing complete, remove loading indicator and update UI
          loadingIndicator.remove();
          childrenEl.appendChild(fragment);
          
          // Restore scroll position
          if (scrollPosition > 0) {
            setTimeout(() => {
              const newContentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
              if (newContentContainer) {
                newContentContainer.scrollTop = scrollPosition;
              }
            }, 0);
          }
          return;
        }
        
        // Update loading indicator
        loadingIndicator.setText(`Loading... ${Math.round((processedLines / totalLines) * 100)}%`);
        
        // Process a batch of lines
        const endIndex = Math.min(processedLines + batchSize, totalLines);
        
        for (let i = processedLines; i < endIndex; i++) {
          const lineContent = fileLines[i];
          const lineContentLower = lineContent.toLowerCase();
          
          // Filter lines based on criteria
          let matchesFilter = false;
          
          if (!this.filterStr) {
            matchesFilter = true;
          } else if (this.isUsingRegex && this.compiledRegex) {
            matchesFilter = this.compiledRegex.test(lineContent);
          } else {
            matchesFilter = lineContentLower.includes(this.filterStr.toLowerCase());
          }
          
          if (matchesFilter) {
            this.createLineElement(fragment, f, i, lineContent);
          }
        }
        
        processedLines = endIndex;
        
        // Allow UI to update between batches
        setTimeout(processNextBatch, 0);
      };
      
      // Start processing
      processNextBatch();
      
    }, 50); // Short delay to let UI render first
  }
  
  private createSearchUI(): HTMLElement {
    // Create a container for the search field and button
    const searchContainer = this.containerEl.createDiv({ cls: 'search-container' });

    // Create the search field
    const searchField = searchContainer.createEl('input', {
      type: 'text',
      placeholder: this.filterStr === '' ? 'Filter...' : this.filterStr,
      cls: 'width50',
      value: this.filterStr
    });

    // Just store the value without triggering redraw
    searchField.addEventListener('input', (event: Event) => {
      const value = (event.target as HTMLInputElement).value;
      this.filterStr = value.toLowerCase();
      // No redraw here - we'll wait for button click
    });

    // Add event listener for Enter key to act like Filter button
    searchField.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        // Only trigger filter on Enter key
        this.redraw(true);
      }
    });

    // Create the search button
    const searchButton = searchContainer.createEl('button', {
      text: 'Filter',
      cls: 'width25'
    });

    searchButton.addEventListener('click', () => {
      this.redraw(true);
    });

    // Create the clear button
    const clearButton = searchContainer.createEl('button', {
      text: 'Clear',
      cls: 'width25'
    });

    clearButton.addEventListener('click', () => {
      this.clearFilter();
      searchField.value = '';
      this.redraw(true);
    });

    return searchContainer;
  }
  
  private createLineElement(container: DocumentFragment | HTMLElement, file: TFile, lineNumber: number, content: string): void {
    // Create elements using document.createElement for better performance
    const navFile = document.createElement('div');
    navFile.className = 'tree-item nav-file recent-files-file';
    
    const navFileTitle = document.createElement('div');
    navFileTitle.className = 'tree-item-self is-clickable nav-file-title recent-files-title';
    
    const navFileTitleContent = document.createElement('div');
    navFileTitleContent.className = 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content';
    
    // Use textContent instead of setText for better performance
    navFileTitleContent.textContent = lineNumber + " : " + content;
    
    navFileTitle.appendChild(navFileTitleContent);
    navFile.appendChild(navFileTitle);
    
    // Use event delegation pattern for better performance with many lines
    navFileTitle.addEventListener('contextmenu', this.createContextMenuHandler(file, lineNumber));
    navFileTitle.addEventListener('click', this.createClickHandler(file, lineNumber));
    
    container.appendChild(navFile);
  }
  
  private createContextMenuHandler(file: TFile, lineNumber: number) {
    return (event: MouseEvent) => {
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setSection('action')
          .setTitle('Open in new tab')
          .setIcon('file-plus')
          .onClick(() => {
            this.focusFileAtLine(file, 'tab', lineNumber);
          })
      );
      const abstractFile = this.app.vault.getAbstractFileByPath(file?.path);
      this.app.workspace.trigger(
        'file-menu',
        menu,
        abstractFile,
        'link-context-menu',
      );
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    };
  }
  
  private createClickHandler(file: TFile, lineNumber: number) {
    return (event: MouseEvent) => {
      const newLeaf = Keymap.isModEvent(event);
      this.focusFileAtLine(file, newLeaf, lineNumber);
    };
  }

  isWindows() {
    return !Platform.isAndroidApp && !Platform.isIosApp && !Platform.isMacOS && !Platform.isSafari;
  }

  async onClose() {
    // Cleanup if necessary
  }

  private readonly focusFileAtLine = (file: TFile, newLeaf: boolean | PaneType, line: number): void => {
    // Optimize file lookup by directly using the file parameter
    if (file) {
      const leaf = this.app.workspace.getLeaf(newLeaf);
      leaf.openFile(file).then(() => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          view.editor.setCursor({ line: line, ch: 0 });
          if (line > 0) {
            try {
              view.setEphemeralState({ line });
            } catch (error) {
              console.error(error);
            }
          }
        }
      });
    } else {
      new Notice('Cannot find a file with that name');
    }
  };

  getHeadingForLine(fileCache: CachedMetadata, lineNumber: number): string {
    if (!fileCache || !fileCache.headings || fileCache.headings.length === 0) {
      return "";
    }

    // Binary search for more efficient heading lookup
    let left = 0;
    let right = fileCache.headings.length - 1;
    let lastValidHeading = null;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const heading = fileCache.headings[mid];
      
      if (heading.position.start.line <= lineNumber) {
        lastValidHeading = heading;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return lastValidHeading ? "# " + lastValidHeading.heading : "";
  }
}

export { CurrentNoteAllLineView as CurrentNoteAllLineView, VIEW_TYPE_CURRENT_NOTE_ALL_LINE as VIEW_TYPE_CURRENT_NOTE_ALL_LINE };