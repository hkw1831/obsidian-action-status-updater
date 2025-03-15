import { ItemView, WorkspaceLeaf, moment, Platform, Notice, TFile, Keymap, PaneType, MarkdownView, CachedMetadata, Menu } from 'obsidian';
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
    await this.render();
  }

  public getIcon(): string {
    return 'calendar';
  }
  
  private async render(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    
    // Create header with navigation controls
    this.headerEl = container.createEl('div', { cls: 'calendar-header' });
    
    const navigationEl = this.headerEl.createEl('div', { cls: 'calendar-navigation' });
    
    // Previous year button
    const prevYearBtn = navigationEl.createEl('button', { cls: 'calendar-nav-btn' });
    prevYearBtn.innerHTML = '&lt;&lt;';
    prevYearBtn.addEventListener('click', () => {
      this.currentDate.subtract(1, 'year');
      this.render();
    });
    
    // Previous month button
    const prevMonthBtn = navigationEl.createEl('button', { cls: 'calendar-nav-btn' });
    prevMonthBtn.innerHTML = '&lt;';
    prevMonthBtn.addEventListener('click', () => {
      this.currentDate.subtract(1, 'month');
      this.render();
    });
    
    // Month and year display
    const monthYearEl = navigationEl.createEl('span', { 
      cls: 'calendar-month-year',
      text: this.currentDate.format('MMMM YYYY')
    });
    
    // Next month button
    const nextMonthBtn = navigationEl.createEl('button', { cls: 'calendar-nav-btn' });
    nextMonthBtn.innerHTML = '&gt;';
    nextMonthBtn.addEventListener('click', () => {
      this.currentDate.add(1, 'month');
      this.render();
    });
    
    // Next year button
    const nextYearBtn = navigationEl.createEl('button', { cls: 'calendar-nav-btn' });
    nextYearBtn.innerHTML = '&gt;&gt;';
    nextYearBtn.addEventListener('click', () => {
      this.currentDate.add(1, 'year');
      this.render();
    });
    
    // Today button
    const todayBtn = navigationEl.createEl('button', {
      cls: 'calendar-today-btn',
      text: 'Today'
    });
    todayBtn.addEventListener('click', () => {
      this.currentDate = window.moment();
      this.render();
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
      
      const dayEl = this.calendarEl.createEl('div', {
        cls: `calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`
      });
      
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
    this.notesListEl.createDiv({ cls: 'nav-header', text: `Notes tagged with ${dateTag}` });
    
    const rootEl = this.notesListEl.createDiv({ cls: 'nav-folder mod-root scrollable' });
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });
    
    // Get files with the date tag
    const files: TFile[] = filesWhereTagIsUsed(dateTag)
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
          if (tag.tag === dateTag) {
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
  }
  
  async onClose(): Promise<void> {
    // Remove the container class when closing
    this.containerEl.removeClass('obsidian-calendar-container');
  }
}

export { CalendarView };