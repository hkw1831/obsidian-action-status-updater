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
  heading: string;
}

class NotesTypeView extends ItemView {
  public notesTypeTag: string
  public clipboardString : string
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
    this.clipboardString = "";
    // Preserve the scroll position
    let scrollPosition = 0;
    const contentContainer = this.containerEl.querySelector('.nav-folder.mod-root.scrollable');
    if (contentContainer) {
      scrollPosition = contentContainer.scrollTop;
    }

    this.containerEl.empty();

    if (this.notesTypeTag.length <= 0) {
        return;
    }
    
    // Create header container to hold both header text and button
    const headerContainer = this.containerEl.createDiv({ cls: 'nav-header' });
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between'; // This already aligns items to opposite ends
    headerContainer.style.alignItems = 'center';
    
    // Add the header text with flex-grow to take available space
    const headerText = headerContainer.createSpan();
    headerText.textContent = "Tags: " + this.notesTypeTag;
    headerText.style.flexGrow = '1'; // Take up available space
    this.clipboardString += "Tagged with " + this.notesTypeTag + ":\n\n";
    
    // Add the button with margin-left for extra spacing
    const logButton = headerContainer.createEl('button', { 
      text: 'Copy results to clipboard',
    });
    logButton.style.marginLeft = 'auto'; // Forces button to right edge
    
    logButton.addEventListener('click', () => {
      // copy clipboardString to clipboard
      navigator.clipboard.writeText(this.clipboardString).then(() => {
        //console.log(this.clipboardString);
        new Notice('Copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy: ', err);
        new Notice('Failed to copy to clipboard');
      });
    });

    const rootEl = this.containerEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    // Process tags once outside of loops
    const tagParts = this.notesTypeTag.split(" ");
    const tag1 = tagParts[0];
    const tag2 = tagParts.length > 1 ? tagParts[1] : "";
    
    // Pre-calculate this once
    const isActionTag = (!/^#[a-z]\/[a-z]\/[a-z]$/.test(tag1)
      && !/^#[a-z]\/[a-z]$/.test(tag1)
      && !/^#[a-z]$/.test(tag1)) || tag2.length > 0;

    // Use DocumentFragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    
    const files = filesWhereTagIsUsed(tag1).map(filePath => this.app.vault.getAbstractFileByPath(filePath) as TFile);
    
    // Process files in smaller batches to prevent UI freezing
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const batchData = await Promise.all(batch.map(async (f) => {
        if (!f) return null;
        
        let noteType = getNoteType(f.path);
        let prefix = noteType ? noteType.prefix + " " : "";
        let lineInfo: LineInfo[] = [];

        if (isActionTag) {
          const actionTag = tag2.length > 0 ? tag2 : tag1;
          const fileCache = this.app.metadataCache.getFileCache(f);
          
          if (fileCache && fileCache.tags) {
            // Only read the file if we need to
            let fileLines: string[] | null = null;
            let headingsMap: Map<number, string> | null = null;
            
            // Find relevant tags first
            const relevantTags = fileCache.tags.filter(tag => tag.tag === actionTag || tag.tag.startsWith(actionTag + "/"));
            
            if (relevantTags.length > 0) {
              fileLines = (await this.app.vault.read(f)).split('\n');
              
              
              
              for (const tag of relevantTags) {
                const heading = this.getHeadingForLine(fileCache, tag.position.start.line);
                const lineContent = fileLines[tag.position.start.line]?.trim() || "";
                
                lineInfo.push({
                  content: lineContent,
                  line: tag.position.start.line,
                  heading: heading
                });
              }
            }
          }
        }

        if (tag2.length > 0 && lineInfo.length === 0) {
          return {
            title: "invalid",
            lineInfo: [],
            file: null
          };
        }
        
        return {
          title: prefix + f.basename,
          lineInfo: lineInfo,
          file: f
        };
      }));

      // Render this batch
      for (const data of batchData) {
        if (!data || data.file === null) continue;
        
        this.renderNoteItem(data, rootEl, childrenEl, fragment);
      }
      
      // Allow UI to update between batches
      await new Promise(resolve => setTimeout(resolve, 0));
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

  // Helper method to build a mapping of line numbers to headings
  private buildHeadingsMap(fileCache: CachedMetadata): Map<number, string> {
    const headingsMap = new Map<number, string>();
    
    if (!fileCache || !fileCache.headings) {
      return headingsMap;
    }
    
    let currentHeading = "";
    let lastHeadingLine = -1;
    
    // Sort headings by line number
    const sortedHeadings = [...fileCache.headings].sort((a, b) => 
      a.position.start.line - b.position.start.line
    );
    
    for (const heading of sortedHeadings) {
      const line = heading.position.start.line;
      currentHeading = "# " + heading.heading;
      
      // Fill in headings for all lines since the last heading
      for (let i = lastHeadingLine + 1; i <= line; i++) {
        if (i !== line) {
          headingsMap.set(i, currentHeading);
        }
      }
      
      lastHeadingLine = line;
    }
    
    // Fill in the remaining lines with the last heading
    if (fileCache.sections) {
      const maxLine = Math.max(...fileCache.sections.map(s => s.position.end.line));
      for (let i = lastHeadingLine + 1; i <= maxLine; i++) {
        headingsMap.set(i, currentHeading);
      }
    }
    
    return headingsMap;
  }
  
  // Helper method to render a note item
  private renderNoteItem(data: NotesTypeViewData, rootEl: HTMLElement, childrenEl: HTMLElement, fragment: DocumentFragment) {
    const newLineChar = this.isWindows() ? "\r\n" : "\n";
    
    const navFile = document.createElement('div');
    navFile.className = 'tree-item nav-file recent-files-file';
    
    const navFileTitle = document.createElement('div');
    navFileTitle.className = 'tree-item-self is-clickable nav-file-title recent-files-title';
    
    const navFileTitleContent = document.createElement('div');
    navFileTitleContent.className = 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content';
    navFileTitleContent.textContent = data.title;
    this.clipboardString += "## > " + data.title + newLineChar;

    navFileTitle.appendChild(navFileTitleContent);
    navFile.appendChild(navFileTitle);
    
    // Setup event listeners
    this.setupEventListeners(navFileTitle, data.file, rootEl, navFile, 0);
    
    // Render line info items
    let lastHeading = "";
    for (const lineInfo of data.lineInfo) {

      const navFileLine = document.createElement('div');
      navFileLine.className = 'tree-item-self is-clickable nav-file-title recent-files-title';
      
      const navFileLineContent = document.createElement('div');
      navFileLineContent.className = 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content self-padding-left-10';
    
      const newLineIfNeeded = lineInfo.heading.length !== 0 ? newLineChar : "";
      const content = lineInfo.heading + newLineIfNeeded + lineInfo.content;
      navFileLineContent.innerText = content;

      let clipboardHeading = "";
      if (lineInfo.heading !== lastHeading && !data.title.endsWith(lineInfo.heading.replace(/^# /g, ''))) {
        lastHeading = lineInfo.heading;
        clipboardHeading = lineInfo.heading.length !== 0 ? "##" + lineInfo.heading + newLineIfNeeded + newLineIfNeeded : "";
      }      
      this.clipboardString += clipboardHeading + lineInfo.content + newLineChar;
      
      navFileLine.appendChild(navFileLineContent);
      navFile.appendChild(navFileLine);
      
      // Setup event listeners
      this.setupEventListeners(navFileLine, data.file, rootEl, navFileLine, lineInfo.line);
    }
    
    fragment.appendChild(navFile);
  }
  
  // Setup common event listeners
  private setupEventListeners(element: HTMLElement, file: TFile | null, rootEl: HTMLElement, targetEl: HTMLElement, line: number) {
    element.addEventListener('mouseover', (event: MouseEvent) => {
      if (!file?.path) return;
      
      this.app.workspace.trigger('hover-link', {
        event,
        source: VIEW_TYPE_NOTE_LIST,
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
            view.setEphemeralState({ line });
          }
        }
      });
    } else {
      new Notice('Cannot find a file with that name');
    }
  };
}

export { NotesTypeView, VIEW_TYPE_NOTE_LIST };