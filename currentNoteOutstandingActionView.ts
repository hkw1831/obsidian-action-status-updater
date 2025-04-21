import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView, CachedMetadata, Platform, debounce } from 'obsidian';
import { getNoteType } from 'selfutil/getTaskTag';

const VIEW_TYPE_CURRENT_OURSTANDING_TASK = 'current-note-outstanding-action-view';

interface LineInfo {
  content: string;
  line: number;
  tag: string;
}

class CurrentNoteOutstandingActionView extends ItemView {
  public currentNotesPath: string
  filterStr: string = ''
  tagsToMatch = ["#wn", "#nn", "#wl", "#nl", "#ww", "#nw", "tm"];
  private debouncedRedraw: () => void;
  
  constructor(leaf: WorkspaceLeaf, notesTypeTag: string) {
    super(leaf);
    this.currentNotesPath = notesTypeTag;
    
    // Set up debounced redraw to prevent excessive updates
    this.debouncedRedraw = debounce(
      () => this.redraw(false),
      300, // 300ms debounce time
      true
    );
  }

  getViewType() {
    return VIEW_TYPE_CURRENT_OURSTANDING_TASK;
  }

  getDisplayText() {
    return 'Outstanding Task of Current View';
  }

  async onOpen() {
    this.redraw(true);
    
    // Register event listener for active leaf changes
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.debouncedRedraw();
      })
    );
    
    // Register event for file modifications
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.path === this.currentNotesPath) {
          this.debouncedRedraw();
        }
      })
    );
    
    // Register event for metadata changes
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        if (file && file.path === this.currentNotesPath) {
          this.debouncedRedraw();
        }
      })
    );
  }

  public getIcon(): string {
    return 'list-checks';
  }

  clearFilter() {
    this.filterStr = ''
  }

  public readonly redraw = async (forceRedraw: boolean): Promise<void> => {
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

    const path = activeFile.path

    const f : TFile = this.app.vault.getAbstractFileByPath(path) as TFile
    if (!f) {
      return
    }
    
    // Create document fragment for better performance
    const fragment = new DocumentFragment();
    
    // Always process the file directly (no caching)
    const lineInfosByTag = await this.processFile(f);
    
    // Filter the line infos based on the current filter string
    const filteredLineInfosByTag = this.filterLineInfos(lineInfosByTag);
    
    // Count total actions
    let allActionCount = 0;
    for (const [_, lineInfos] of filteredLineInfosByTag) {
      allActionCount += lineInfos.length;
    }
    
    // Clear the container
    this.containerEl.empty();

    // Create UI components
    const label = document.createElement('div');
    label.className = 'nav-folder-children';
    label.textContent = "Outstanding Actions";
    fragment.appendChild(label);

    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    fragment.appendChild(searchContainer);

    // Create search field
    const searchField = document.createElement('input');
    searchField.type = 'text';
    searchField.placeholder = this.filterStr === '' ? 'Filter...' : this.filterStr;
    searchField.className = 'width50';
    searchContainer.appendChild(searchField);

    // Add event listeners to search field
    searchField.addEventListener('input', (event: Event) => {
      this.filterStr = (event.target as HTMLInputElement).value.toLowerCase();
    });

    searchField.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.redraw(true);
      }
    });

    // Create search button
    const searchButton = document.createElement('button');
    searchButton.textContent = 'Filter';
    searchButton.className = 'width25';
    searchButton.addEventListener('click', () => {
      this.redraw(true);
    });
    searchContainer.appendChild(searchButton);

    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.className = 'width25';
    clearButton.addEventListener('click', () => {
      this.clearFilter();
      this.redraw(true);
    });
    searchContainer.appendChild(clearButton);

    // Create header with path and count
    let noteType = getNoteType(path);
    let prefix = noteType ? (noteType.prefix ? noteType.prefix + " " : "") : "";
    
    const header = document.createElement('div');
    header.className = 'nav-header';
    header.textContent = "Path: " + prefix + path + " ( " + allActionCount + " )";
    fragment.appendChild(header);

    // Create root container for tasks
    const rootEl = document.createElement('div');
    rootEl.className = 'nav-folder mod-root scrollable';
    fragment.appendChild(rootEl);
    
    const childrenEl = document.createElement('div');
    childrenEl.className = 'nav-folder-children';
    rootEl.appendChild(childrenEl);

    // Batch render the task items
    this.renderTaskItems(childrenEl, filteredLineInfosByTag, f);
    
    // Append the fragment to the container (single DOM operation)
    this.containerEl.appendChild(fragment);
    
    // Restore scroll position
    if (scrollPosition > 0) {
      setTimeout(() => {
        const newContentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
        if (newContentContainer) {
          newContentContainer.scrollTop = scrollPosition;
        }
      }, 0);
    }
  }

  // Process file content and extract LineInfos grouped by tag
  private async processFile(file: TFile): Promise<Map<string, LineInfo[]>> {
    const fileCache = this.app.metadataCache.getFileCache(file);
    const lineInfosByTag = new Map<string, LineInfo[]>();
    
    if (fileCache && fileCache.tags) {
      const content = await this.app.vault.read(file);
      const fileLines = content.split('\n');
      
      // Pre-initialize the map with empty arrays for all tags
      this.tagsToMatch.forEach(tag => {
        lineInfosByTag.set(tag, []);
      });
      
      // Process all tags at once to avoid multiple iterations
      for (const tagMetadata of fileCache.tags) {
        const tag = tagMetadata.tag;
        if (this.tagsToMatch.includes(tag)) {
          const line = tagMetadata.position.start.line;
          const heading = this.getHeadingForLine(fileCache, line);
          const lineContent = fileLines[line].trim();
          const newLineIfNeeded = heading.length != 0 ? (this.isWindows() ? "\r\n" : "\n") : "";
          const contentToDisplay = heading + newLineIfNeeded + lineContent;
          
          const lineInfoArray = lineInfosByTag.get(tag) || [];
          lineInfoArray.push({
            content: contentToDisplay,
            line: line,
            tag: tag
          });
          
          lineInfosByTag.set(tag, lineInfoArray);
        }
      }
    }
    
    return lineInfosByTag;
  }

  // Filter LineInfos based on the current filter string
  private filterLineInfos(lineInfosByTag: Map<string, LineInfo[]>): Map<string, LineInfo[]> {
    if (this.filterStr === '') {
      return lineInfosByTag;
    }
    
    const filteredMap = new Map<string, LineInfo[]>();
    const filterStrLower = this.filterStr.toLowerCase();
    
    for (const [tag, lineInfos] of lineInfosByTag) {
      const filteredLineInfos = lineInfos.filter(info => {
        const contentToDisplayLower = info.content.toLowerCase();
        return contentToDisplayLower.includes(filterStrLower) || 
               contentToDisplayLower.match(new RegExp(filterStrLower));
      });
      
      if (filteredLineInfos.length > 0) {
        filteredMap.set(tag, filteredLineInfos);
      }
    }
    
    return filteredMap;
  }

  // Render task items efficiently
  private renderTaskItems(container: HTMLElement, lineInfosByTag: Map<string, LineInfo[]>, file: TFile): void {
    // Use document fragment for batch updates
    const fragment = new DocumentFragment();
    
    // Iterate through each tag group
    for (const [tag, lineInfos] of lineInfosByTag) {
      if (lineInfos.length === 0) continue;
      
      // Create tag header
      const tagHeader = document.createElement('div');
      tagHeader.className = 'tree-item nav-file recent-files-file';
      tagHeader.textContent = tag + " ( " + lineInfos.length + " )";
      fragment.appendChild(tagHeader);
      
      // Create task items for this tag
      for (const lineInfo of lineInfos) {
        const navFile = document.createElement('div');
        navFile.className = 'tree-item nav-file recent-files-file';
        
        const navFileTitle = document.createElement('div');
        navFileTitle.className = 'tree-item-self is-clickable nav-file-title recent-files-title';
        
        const navFileTitleContent = document.createElement('div');
        navFileTitleContent.className = 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content';
        navFileTitleContent.textContent = lineInfo.content;
        
        navFileTitle.appendChild(navFileTitleContent);
        navFile.appendChild(navFileTitle);
        
        // Add event listeners
        this.addTaskEventListeners(navFileTitle, file, lineInfo.line);
        
        fragment.appendChild(navFile);
      }
    }
    
    // Append all elements in one operation
    container.appendChild(fragment);
  }
  
  // Add event listeners to task items
  private addTaskEventListeners(element: HTMLElement, file: TFile, line: number): void {
    element.addEventListener('contextmenu', (event: MouseEvent) => {
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setSection('action')
          .setTitle('Open in new tab')
          .setIcon('file-plus')
          .onClick(() => {
            if (file === null) {
              return;
            }
            this.focusFileAtLine(file, 'tab', line);
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
    });

    element.addEventListener('click', (event: MouseEvent) => {  
      const newLeaf = Keymap.isModEvent(event);
      this.focusFileAtLine(file, newLeaf, line);
    });
  }

  isWindows() {
    return !Platform.isAndroidApp && !Platform.isIosApp && !Platform.isMacOS && !Platform.isSafari;
  }

  async onClose() {
    // Nothing to clean up anymore
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
          if (line > 0)
          {
            try {
              view.setEphemeralState({ line });
              } catch (error) {
                console.error(error);
              }
          }
          /*
          view.editor.scrollIntoView({from: {line: line, ch: 0}, to: {line: line, ch: 0}}, true)
          if (line != 0) {
            const ch = view.editor.getLine(line).length;
            view.editor.setSelection({line: line, ch: 0}, {line: line, ch: ch});
            view.editor.scrollIntoView({from: {line: line, ch: 0}, to: {line: line, ch: 0}}, true)
          }
            */
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