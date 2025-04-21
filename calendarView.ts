import { ItemView, WorkspaceLeaf, moment, Platform, Notice, TFile, Keymap, PaneType, MarkdownView, CachedMetadata, Menu, EventRef } from 'obsidian';
import { filesWhereTagIsUsed } from 'selfutil/findNotesFromTag';
import { getNoteType } from 'selfutil/getTaskTag';

export const VIEW_TYPE_CALENDAR = 'calendar-view';

interface NotesListData {
  title: string;
  lineInfo: LineInfo[];
  file: TFile | null;
}

interface LineInfo {
  content: string;
  line: number;
}

class CalendarView extends ItemView {
  private currentDate: moment.Moment;
  private calendarEl: HTMLElement;
  private headerEl: HTMLElement;
  private notesListEl: HTMLElement;
  private selectedDateTag: string | null = null;
  private datesWithNotes: Set<string> = new Set(); // Store dates that have notes
  private vaultChangeRef: EventRef;
  private metadataChangeRef: EventRef;
  
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.currentDate = window.moment(); // Use window.moment() to access moment in Obsidian
  }

  getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText(): string {
    return 'Calendar View';
  }

  async onOpen(): Promise<void> {
    // Add a specific class to the container for better CSS targeting
    this.containerEl.addClass('obsidian-calendar-container');
    
    // Set up event listeners for vault changes
    this.registerVaultEvents();
    
    // Pre-cache dates with notes for current month
    await this.updateDatesWithNotes();
    
    await this.render();
    
    // Select current date by default when opening
    const today = window.moment().format('YYYYMMDD');
    this.displayDateNotes(today);
  }

  /**
   * Register event listeners for vault and metadata changes
   */
  private registerVaultEvents(): void {
    // Listen for file modifications
    this.vaultChangeRef = this.app.vault.on('modify', async (file) => {
      if (file instanceof TFile && file.extension === 'md') {
        // A markdown file was modified, refresh our dates cache
        await this.updateDatesWithNotes();
        this.render(); // Re-render the calendar to update the date stylings
      }
    });
    
    // Listen for metadata changes (which happen when tags are added/modified)
    this.metadataChangeRef = this.app.metadataCache.on('changed', async (file) => {
      if (file && file.path) {
        // File metadata changed, refresh our dates cache
        await this.updateDatesWithNotes();
        this.render(); // Re-render the calendar to update the date stylings
      }
    });
    
    // Make sure to register these references for cleanup
    this.registerEvent(this.vaultChangeRef);
    this.registerEvent(this.metadataChangeRef);
  }

  public getIcon(): string {
    return 'calendar';
  }
  
  // Collect all dates that have notes in the current month view
  private async updateDatesWithNotes(): Promise<void> {
    // Clear the existing cache
    this.datesWithNotes.clear();
    
    // Calculate the range of dates to check (including days from adjacent months that appear in the view)
    const firstDayOfMonth = this.currentDate.clone().startOf('month');
    let startDate = firstDayOfMonth.clone();
    if (firstDayOfMonth.day() === 0) { // If Sunday
      startDate.subtract(6, 'days');
    } else {
      startDate.subtract(firstDayOfMonth.day() - 1, 'days');
    }
    
    const lastDayOfMonth = this.currentDate.clone().endOf('month');
    const endDate = lastDayOfMonth.clone();
    // Extend to the end of the week
    if (endDate.day() !== 0) { // If not Sunday
      endDate.add(7 - endDate.day(), 'days');
    }
    
    // Loop through each date in the range
    const currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate, 'day')) {
      const dateString = currentDate.format('YYYYMMDD')
      const layerDateTag = `#d/${dateString.slice(0, 4)}/${dateString.slice(4, 6)}/${dateString.slice(6, 8)}`;
      // Check if any files contain this date tag
      const filesWithTag = filesWhereTagIsUsed(layerDateTag);
      
      if (filesWithTag.length > 0) {
        // This date has notes, add it to our cache
        this.datesWithNotes.add(currentDate.format('YYYYMMDD'));
      }
      
      currentDate.add(1, 'day');
    }
  }
  
  private async render(): Promise<void> {
    // Preserve the scroll position of the notes list
    let notesListScrollTop = 0;
    if (this.notesListEl) {
      notesListScrollTop = this.notesListEl.scrollTop;
    }
    
    const container = this.containerEl.children[1];
    container.empty();
    
    // Create header with navigation controls
    this.headerEl = container.createEl('div', { cls: 'calendar-header' });
    
    const navigationEl = this.headerEl.createEl('div', { cls: 'calendar-navigation' });
    
    // Previous year button
    const prevYearBtn = navigationEl.createEl('button', { cls: 'calendar-nav-btn' });
    prevYearBtn.innerHTML = '&lt;&lt;';
    prevYearBtn.addEventListener('click', async () => {
      this.currentDate.subtract(1, 'year');
      await this.updateDatesWithNotes();
      this.render().then(() => {
        // After rendering, display notes for the 1st day of the month
        const newDate = this.currentDate.format('YYYYMMDD');
        this.displayDateNotes(newDate);
      });
    });
    
    // Previous month button
    const prevMonthBtn = navigationEl.createEl('button', { cls: 'calendar-nav-btn' });
    prevMonthBtn.innerHTML = '&lt;';
    prevMonthBtn.addEventListener('click', async () => {
      this.currentDate.subtract(1, 'month');
      await this.updateDatesWithNotes();
      this.render().then(() => {
        // After rendering, display notes for the 1st day of the month
        const newDate = this.currentDate.format('YYYYMMDD');
        this.displayDateNotes(newDate);
      });
    });
    
    // Month and year display
    const monthYearEl = navigationEl.createEl('span', { 
      cls: 'calendar-month-year',
      text: this.currentDate.format('MMMM YYYY')
    });
    
    // Next month button
    const nextMonthBtn = navigationEl.createEl('button', { cls: 'calendar-nav-btn' });
    nextMonthBtn.innerHTML = '&gt;';
    nextMonthBtn.addEventListener('click', async () => {
      this.currentDate.add(1, 'month');
      await this.updateDatesWithNotes();
      this.render().then(() => {
        // After rendering, display notes for the 1st day of the month
        const newDate = this.currentDate.format('YYYYMMDD');
        this.displayDateNotes(newDate);
      });
    });
    
    // Next year button
    const nextYearBtn = navigationEl.createEl('button', { cls: 'calendar-nav-btn' });
    nextYearBtn.innerHTML = '&gt;&gt;';
    nextYearBtn.addEventListener('click', async () => {
      this.currentDate.add(1, 'year');
      await this.updateDatesWithNotes();
      this.render().then(() => {
        // After rendering, display notes for the 1st day of the month
        const newDate = this.currentDate.format('YYYYMMDD');
        this.displayDateNotes(newDate);
      });
    });
    
    // Today button
    const todayBtn = navigationEl.createEl('button', {
      cls: 'calendar-today-btn',
      text: 'Today'
    });
    todayBtn.addEventListener('click', async () => {
      this.currentDate = window.moment();
      await this.updateDatesWithNotes();
      this.render().then(() => {
        // After rendering, display notes for today
        const today = window.moment().format('YYYYMMDD');
        this.displayDateNotes(today);
      });
    });
    
    // Create calendar grid
    this.calendarEl = container.createEl('div', { cls: 'calendar-grid' });
    
    // Render weekday headers (starting from Monday)
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    weekdays.forEach(day => {
      this.calendarEl.createEl('div', { 
        cls: 'calendar-day-header',
        text: day
      });
    });
    
    // Calculate first day to display (could be from previous month)
    // Get the first day of current month
    const firstDayOfMonth = this.currentDate.clone().startOf('month');
    // Adjust to show complete weeks (from Monday)
    // momentjs treats Monday as 1 and Sunday as 0
    let startDate = firstDayOfMonth.clone();
    if (firstDayOfMonth.day() === 0) { // If Sunday
      startDate.subtract(6, 'days');
    } else {
      startDate.subtract(firstDayOfMonth.day() - 1, 'days');
    }
    
    // Render calendar days (42 days = 6 weeks)
    const today = window.moment();
    for (let i = 0; i < 42; i++) {
      const date = startDate.clone().add(i, 'days');
      const isCurrentMonth = date.month() === this.currentDate.month();
      const isToday = date.isSame(today, 'day');
      const dateTag = date.format('YYYYMMDD');
      const isSelected = this.selectedDateTag === dateTag;
      const hasNotes = this.datesWithNotes.has(dateTag);
      
      // Build the classes for this calendar day
      let classNames = 'calendar-day';
      
      // Check if it's current month or other month
      classNames += isCurrentMonth ? ' current-month' : ' other-month';
      
      // Check if it's today
      if (isToday) classNames += ' today';
      
      // Check if it's selected
      if (isSelected) classNames += ' selected';
      
      // Check if it has notes
      classNames += hasNotes ? ' has-notes' : ' no-notes';
      
      const dayEl = this.calendarEl.createEl('div', { cls: classNames });
      
      dayEl.createEl('span', {
        text: date.format('D')
      });
      
      // Make clickable to display notes with the date tag
      dayEl.addEventListener('click', () => {
        this.displayDateNotes(dateTag);
        
        // Update selected styling
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
          el.classList.remove('selected');
        });
        dayEl.classList.add('selected');
      });
      
      // Stop after completing the week that contains the last day of the month
      if (i > 28 && date.month() !== this.currentDate.month() && date.day() === 0) {
        break;
      }
    }
    
    // Create notes list container
    this.notesListEl = container.createEl('div', { cls: 'calendar-notes-list' });
    
    // Restore scroll position
    if (notesListScrollTop > 0) {
      setTimeout(() => {
        this.notesListEl.scrollTop = notesListScrollTop;
      }, 0);
    }
    
    // If we had a selected date, redisplay its notes
    if (this.selectedDateTag) {
      this.displayDateNotes(this.selectedDateTag, false);
    }
  }
  
  // Display notes with the date tag
  private async displayDateNotes(dateString: string, updateSelected: boolean = true): Promise<void> {
    if (updateSelected) {
      this.selectedDateTag = dateString;
    }
    
    // Clear the notes list
    this.notesListEl.empty();
    
    const dateTag = `#d/${dateString}`;
    
    // Add journal file link
    const journalPath = `J/${dateString}.md`;
    const journalExists = this.fileExists(journalPath);
    
    // Create properly styled journal link
    const journalContainer = this.notesListEl.createDiv({
      cls: 'journal-link-container metadata-container',
    });
    
    const formattedDate = window.moment(dateString, "YYYYMMDD").format("MMMM D, YYYY");
    
    // The key is to use the correct classes:
    // - 'internal-link' is for all internal links
    // - 'is-unresolved' should be added only when file doesn't exist
    const linkEl = journalContainer.createEl('a', {
      cls: `internal-link${!journalExists ? ' is-unresolved' : ''}`, 
      text: `J/${dateString}.md`,
      attr: {
        'data-href': journalPath
      }
    });
    
    // Add click handler to open journal file
    linkEl.addEventListener('click', (event) => {
      event.preventDefault();
      const targetPath = journalPath;
      
      if (journalExists) {
        // If file exists, open it
        const targetFile = this.app.vault.getAbstractFileByPath(targetPath);
        if (targetFile instanceof TFile) {
          const newLeaf = Keymap.isModEvent(event);
          const leaf = this.app.workspace.getLeaf(newLeaf);
          leaf.openFile(targetFile);
        }
      } else {
        // If file doesn't exist, create it
        const folderPath = targetPath.substring(0, targetPath.lastIndexOf('/'));
        
        // Check if folder exists, create it if not
        this.app.vault.adapter.exists(folderPath).then(exists => {
          if (!exists) {
            this.app.vault.createFolder(folderPath).then(() => {
              this.createAndOpenJournalFile(targetPath, dateString);
            });
          } else {
            this.createAndOpenJournalFile(targetPath, dateString);
          }
        });
      }
    });
    
    // #d/20250323 -> #d/2025/03/23
    const layerDateTag = `#d/${dateString.slice(0, 4)}/${dateString.slice(4, 6)}/${dateString.slice(6, 8)}`;
    
    this.notesListEl.createDiv({ cls: 'note-header', text: `Notes tagged with ${layerDateTag}` });
    
    const rootEl = this.notesListEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });
    
    // Get files with the date tag
    const files: TFile[] = filesWhereTagIsUsed(layerDateTag)
      .map(filePath => this.app.vault.getAbstractFileByPath(filePath) as TFile)
      .filter(file => file !== null);
    
    if (files.length === 0) {
      childrenEl.createDiv({ cls: 'nav-empty', text: 'No notes found with this tag' });
      return;
    }
    
    // Process files and render them
    const noteDatas: NotesListData[] = await Promise.all(files.map(async (f) => {
      let noteType = getNoteType(f.path);
      let prefix = noteType ? noteType.prefix + " " : "";
      
      let lineInfo: LineInfo[] = [];
      
      const fileCache = this.app.metadataCache.getFileCache(f);
      if (fileCache && fileCache.tags) {
        const content = await this.app.vault.read(f);
        const fileLines = content.split('\n');
        for (const tag of fileCache.tags) {
          if (tag.tag === layerDateTag) {
            const heading = this.getHeadingForLine(fileCache, tag.position.start.line);
            const lineContent = fileLines[tag.position.start.line].trim();
            const newLineIfNeeded = heading.length != 0 ? (this.isWindows() ? "\r\n" : "\n") : "";
            lineInfo.push({
              content: heading + newLineIfNeeded + lineContent,
              line: tag.position.start.line
            });
          }
        }
      }
      
      return {
        title: prefix + f.basename,
        lineInfo: lineInfo,
        file: f
      };
    }));
    
    // Render the note data
    noteDatas.forEach(data => {
      if (data.file === null) {
        return;
      }
      
      const navFile = childrenEl.createDiv({
        cls: 'tree-item nav-file recent-files-file',
      });
      
      const navFileTitle = navFile.createDiv({
        cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
      });
      
      const navFileTitleContent = navFileTitle.createDiv({
        cls: 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content',
      });
      
      navFileTitleContent.setText(data.title);
      
      navFileTitle.addEventListener('mouseover', (event: MouseEvent) => {
        if (!data.file?.path) return;
        
        this.app.workspace.trigger('hover-link', {
          event,
          source: VIEW_TYPE_CALENDAR,
          hoverParent: rootEl,
          targetEl: navFile,
          linktext: data.file.path,
        });
      });
      
      navFileTitle.addEventListener('contextmenu', (event: MouseEvent) => {
        if (data.file === null) return;
        if (!data.file?.path) return;
        
        const menu = new Menu();
        menu.addItem((item) =>
          item
            .setSection('action')
            .setTitle('Open in new tab')
            .setIcon('file-plus')
            .onClick(() => {
              if (data.file === null) return;
              this.focusFileAtLine(data.file, 'tab', 0);
            })
        );
        
        const file = this.app.vault.getAbstractFileByPath(data.file?.path);
        this.app.workspace.trigger(
          'file-menu',
          menu,
          file,
          'link-context-menu',
        );
        
        menu.showAtPosition({ x: event.clientX, y: event.clientY });
      });
      
      navFileTitle.addEventListener('click', (event: MouseEvent) => {
        if (!data || data.file === null) return;
        
        const newLeaf = Keymap.isModEvent(event);
        this.focusFileAtLine(data.file, newLeaf, 0);
      });
      
      // Render each line info
      for (const lineInfo of data.lineInfo) {
        const navFileLine = navFile.createDiv({
          cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
        });
        
        const navFileLineContent = navFileLine.createDiv({
          cls: 'tree-item-inner nav-file-title-content recent-files-title-content internal-link self-wrap-content self-padding-left-10',
        });
        
        navFileLineContent.innerText = lineInfo.content;
        
        navFileLine.addEventListener('mouseover', (event: MouseEvent) => {
          if (!data.file?.path) return;
          
          this.app.workspace.trigger('hover-link', {
            event,
            source: VIEW_TYPE_CALENDAR,
            hoverParent: rootEl,
            targetEl: navFileLine,
            linktext: data.file.path,
          });
        });
        
        navFileLine.addEventListener('contextmenu', (event: MouseEvent) => {
          if (!data.file?.path) return;
          
          const menu = new Menu();
          menu.addItem((item) =>
            item
              .setSection('action')
              .setTitle('Open in new tab')
              .setIcon('file-plus')
              .onClick(() => {
                if (data.file === null) return;
                this.focusFileAtLine(data.file, 'tab', lineInfo.line);
              })
          );
          
          const file = this.app.vault.getAbstractFileByPath(data.file?.path);
          this.app.workspace.trigger(
            'file-menu',
            menu,
            file,
            'link-context-menu',
          );
          
          menu.showAtPosition({ x: event.clientX, y: event.clientY });
        });
        
        navFileLine.addEventListener('click', (event: MouseEvent) => {
          if (!data || data.file === null) return;
          
          const newLeaf = Keymap.isModEvent(event);
          this.focusFileAtLine(data.file, newLeaf, lineInfo.line);
        });
      }
    });
  }
  
  // Helper method to check if a file exists in the vault
  private fileExists(path: string): boolean {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile;
  }
  
  // Helper method to create and open a journal file
  private async createAndOpenJournalFile(path: string, dateString: string): Promise<void> {
    const formattedDate = window.moment(dateString, "YYYYMMDD").format("MMMM D, YYYY");
    const content = `---\ntags: b/n/j\n---\n\n`;
    
    try {
      const file = await this.app.vault.create(path, content);
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    } catch (error) {
      new Notice(`Failed to create journal file: ${error}`);
    }
  }
  
  // Helper method to determine if running on Windows
  private isWindows(): boolean {
    return !Platform.isAndroidApp && !Platform.isIosApp && !Platform.isMacOS && !Platform.isSafari;
  }
  
  // Helper method to get heading for a line
  private getHeadingForLine(fileCache: CachedMetadata, lineNumber: number): string {
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
  
  // Open file and set cursor to specific line
  private focusFileAtLine(file: TFile, newLeaf: boolean | PaneType, line: number): void {
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
  }
  
  async onClose(): Promise<void> {
    // Remove the container class when closing
    this.containerEl.removeClass('obsidian-calendar-container');
  }
}

export { CalendarView };