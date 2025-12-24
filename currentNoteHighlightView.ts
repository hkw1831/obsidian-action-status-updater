import { ItemView, WorkspaceLeaf, TFile, Keymap, PaneType, Notice, Menu, MarkdownView, CachedMetadata, Platform, debounce } from 'obsidian';
import { getNoteType } from 'selfutil/getTaskTag';

const VIEW_TYPE_CURRENT_NOTE_HIGHLIGHT = 'current-note-highlight-view';

interface LineInfo {
  content: string;       // text inside == ... ==
  line: number;          // file line number where the highlight occurs
  headingLine: number;   // line number of the heading the highlight belongs to (0 if none)
  headingText: string;   // heading text (e.g. "# My Section")
}

class CurrentNoteHighlightView extends ItemView {
  public currentNotesPath: string
  filterStr: string = ''
  // no tag matching here anymore — we use highlight scanning
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
    return VIEW_TYPE_CURRENT_NOTE_HIGHLIGHT;
  }

  getDisplayText() {
    return 'Highlighted item of Current View';
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
    return 'lucide-highlighter';
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
    label.textContent = "Highlighted Items";
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
  private async processFile(file: TFile): Promise<Map<number, LineInfo[]>> {
    const fileCache = this.app.metadataCache.getFileCache(file);
    const grouped = new Map<number, LineInfo[]>(); // key: headingLine

    const content = await this.app.vault.read(file);
    const lines = content.split('\n');
    const highlightRe = /==([^=]+)==/g;

    for (let i = 0; i < lines.length; i++) {
      const textLine = lines[i];
      let m: RegExpExecArray | null;
      highlightRe.lastIndex = 0;
      while ((m = highlightRe.exec(textLine)) !== null) {
        const inner = m[1].trim();
        // find heading line number and text for this line
        const headingInfo = this.getHeadingInfo(fileCache, i);
        const key = headingInfo.line;
        const li: LineInfo = {
          content: inner,
          line: i,
          headingLine: headingInfo.line,
          headingText: headingInfo.text
        };
        const arr = grouped.get(key) || [];
        arr.push(li);
        grouped.set(key, arr);
      }
    }

    return grouped;
  }

  // helper: returns heading line and text for given line (0 / empty if none)
  private getHeadingInfo(fileCache: CachedMetadata | null, lineNumber: number): { line: number; text: string } {
    if (!fileCache || !fileCache.headings || fileCache.headings.length === 0) {
      return { line: 0, text: '' };
    }
    let lastHeadingLine = 0;
    let lastHeadingText = '';
    for (const heading of fileCache.headings) {
      if (heading.position.start.line <= lineNumber) {
        lastHeadingLine = heading.position.start.line;
        lastHeadingText = "# " + heading.heading;
      } else {
        break;
      }
    }
    return { line: lastHeadingLine, text: lastHeadingText };
  }

  // Filter LineInfos based on the current filter string
  private filterLineInfos(grouped: Map<number, LineInfo[]>): Map<number, LineInfo[]> {
    if (!this.filterStr || this.filterStr.trim() === '') {
      return grouped;
    }
    const filterStrLower = this.filterStr.toLowerCase();
    const out = new Map<number, LineInfo[]>();
    for (const [headingLine, arr] of grouped) {
      const filtered = arr.filter(info => {
        const lower = info.content.toLowerCase();
        try {
          return lower.includes(filterStrLower) || new RegExp(filterStrLower).test(lower);
        } catch {
          return lower.includes(filterStrLower);
        }
      });
      if (filtered.length > 0) out.set(headingLine, filtered);
    }
    return out;
  }

  // Render task items efficiently
  private renderTaskItems(container: HTMLElement, grouped: Map<number, LineInfo[]>, file: TFile): void {
    const fragment = new DocumentFragment();

    for (const [headingLine, items] of grouped) {
      if (!items || items.length === 0) continue;

      // heading header (clickable -> jump to heading)
      const headingHeader = document.createElement('div');
      headingHeader.className = 'tree-item nav-file recent-files-file';
      headingHeader.textContent = (items[0].headingText && items[0].headingText.length > 0) ? items[0].headingText + ` ( ${items.length} )` : `Top ( ${items.length} )`;
      headingHeader.style.cursor = 'pointer';
      headingHeader.addEventListener('click', () => {
        const jumpLine = headingLine || 0;
        this.focusFileAtLine(file, false, jumpLine);
      });
      fragment.appendChild(headingHeader);

      // highlights under heading
      for (const li of items) {
        const navFile = document.createElement('div');
        navFile.className = 'tree-item nav-file recent-files-file';

        const navFileTitle = document.createElement('div');
        navFileTitle.className = 'tree-item-self is-clickable nav-file-title recent-files-title';

        const navFileTitleContent = document.createElement('div');
        navFileTitleContent.className = 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content';
        navFileTitleContent.textContent = li.content;

        navFileTitle.appendChild(navFileTitleContent);
        navFile.appendChild(navFileTitle);

        // click jumps to the highlight line
        this.addTaskEventListeners(navFileTitle, file, li.line);

        fragment.appendChild(navFile);
      }
    }

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

export { CurrentNoteHighlightView as CurrentNoteHighlightView, VIEW_TYPE_CURRENT_NOTE_HIGHLIGHT as VIEW_TYPE_CURRENT_NOTE_HIGHLIGHT };