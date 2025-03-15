import { ItemView, WorkspaceLeaf, moment, Platform, Notice } from 'obsidian';

export const VIEW_TYPE_CALENDAR = 'calendar-view';

class CalendarView extends ItemView {
  private currentDate: moment.Moment;
  private calendarEl: HTMLElement;
  private headerEl: HTMLElement;
  
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
      
      const dayEl = this.calendarEl.createEl('div', {
        cls: `calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}`
      });
      
      dayEl.createEl('span', {
        text: date.format('D')
      });
      
      // Make clickable to search for tags
      const dateTag = date.format('YYYYMMDD');
      dayEl.addEventListener('click', () => {
        this.openDateTagSearch(dateTag);
      });
      
      // Stop after completing the week that contains the last day of the month
      if (i > 28 && date.month() !== this.currentDate.month() && date.day() === 0) {
        break;
      }
    }
  }
  
  // Open search view with the date tag
  private openDateTagSearch(dateString: string): void {
    // eslint-disable @typescript-eslint/no-explicit-any
    const searchPlugin = (this.app as any).internalPlugins.getPluginById("global-search");
    // eslint-enable @typescript-eslint/no-explicit-any
    const search = searchPlugin && searchPlugin.instance;
    
    if (searchPlugin && search) {
      search.openGlobalSearch(`tag:#d/${dateString}`);
    } else {
      new Notice("Please enable the search core plugin!");
    }
  }
  
  async onClose(): Promise<void> {
    // Remove the container class when closing
    this.containerEl.removeClass('obsidian-calendar-container');
  }
}

export { CalendarView };