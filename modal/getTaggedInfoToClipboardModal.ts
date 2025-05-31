import { NavigateToNoteFromSpecificTagModal } from "navigateToNoteFromSpecificTagModal";
import { App, FuzzySuggestModal, FuzzyMatch, getAllTags, TFile, Notice, MarkdownView, CachedMetadata, Platform } from "obsidian";
import { filesWhereTagIsUsed } from "selfutil/findNotesFromTag";
import { getAllTagsWithFilter } from "selfutil/getAllNoteTags";
import { getAllNotes, getRecentNotes } from "selfutil/getRecentNotes";
import { getNoteType, getNoteDescriptionByType } from "selfutil/getTaskTag";
import { Heading } from "selfutil/heading";

interface Note {
  search: string,
  secondary: string
  type: string,
  line: number
}

interface NotesListData {
  title: string;
  lineInfo: LineInfo[];
  file: TFile | null;
}

interface LineInfo {
  content: string;
  line: number;
  tagName: string;
  heading: string;
}

const tag = "tag"

// Currently not handle tag in metadata
export class GetTaggedInfoToClipboardModal extends FuzzySuggestModal<Note> {
  items: Note[]
  taskType: Note
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App)
  {
    super(app)
    this.setPlaceholder(`Which notes with tags do you want to search?`)
    this.setInstructions([
      {
        command: "",
        purpose: "Which notes with tags do you want to search?"
      }
    ]);
    this.items = this.prepareItems()
  }

  selectElement(index: number) {
    const elements = this.resultContainerEl.querySelectorAll('.suggestion-item');
    if (elements.length > index) {
      const element = elements[index] as HTMLElement;
      element.click(); // Simulate a click to select the element
    }
  }

  getItems() : Note[] {
    return this.items
  }

  prepareItems() : Note[] {
    const allNotes = getAllNotes(this.app)
    let headings: Heading[] = []
    allNotes.forEach(n => {
      const file = this.app.vault.getAbstractFileByPath(n) as TFile
      const fileCache = this.app.metadataCache.getFileCache(file)
      if (!fileCache) {
        return
      }
      if (!fileCache.headings) {
        return
      }
      fileCache.headings.forEach(h => {
        headings.push({note: n, heading: h.heading, level: h.level, startLine: h.position.start.line})
      })
    })
        return [
      ...getAllTagsWithFilter(this.app).map(n => {
        return {search: n.replace(/^#/, "@"), secondary: "", type: tag, line: -1}
      })
    ];
  }

  getItemText(value: Note): string {
    return value.search;
  }

  // Renders each suggestion item.
  renderSuggestion(value: FuzzyMatch<Note>, el: HTMLElement) {
    const item = value.item
    let prefix = ""
    const taskType = item.type == tag ? getNoteDescriptionByType(item.search) : "";
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + prefix + item.search });
    const lineInfo = item.line > 0 ? " (line " + item.line + ")" : ""
    el.createEl("small", { text: "     " + item.type + " " + item.secondary + taskType + lineInfo });
  }

  onOpen() {
    super.onOpen();
    this.inputEl.value = "@";
    this.inputEl.trigger("input");

    this.inputEl.addEventListener('input', () => {
      if (this.inputEl.value.startsWith('@') && (this.inputEl.value.length > 4 || this.inputEl.value.contains('#')) ) {
        this.inputEl.value = this.inputEl.value.substring(1);
      }
    });

    this.inputEl.addEventListener('paste', (event) => {

      if (this.inputEl.value === "@") {
        // Prevent the pasted text from being inserted
        event.preventDefault();
    
        // Get the text from the clipboard
        const text = (event.clipboardData || window.clipboardData).getData('text');
    
        // Clear the input and insert the new text
        this.inputEl.value = text;
        this.inputEl.trigger("input");
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
        currentHeading = heading.heading;
      } else {
        break;
      }
    }
    
    return currentHeading;
  }

  // Perform action on the selected suggestion.
  async onChooseItem(choosenValue: Note, evt: MouseEvent | KeyboardEvent) {
    if (choosenValue.type == tag) {
        const tagName = choosenValue.search.replace("@", "#")
        
        // Get files with the date tag
        const files: TFile[] = filesWhereTagIsUsed(tagName)
          .map(filePath => this.app.vault.getAbstractFileByPath(filePath) as TFile)
          .filter(file => file !== null);

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
              
              if (tag.tag.startsWith(tagName + "/") || tag.tag === tagName) {
                const heading = this.getHeadingForLine(fileCache, tag.position.start.line);
                const lineContent = fileLines[tag.position.start.line].trim();
                lineInfo.push({
                  content: lineContent,
                  line: tag.position.start.line,
                  tagName: tag.tag,
                  heading: heading
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
        
        // just put all of them to clipboard first, later to format them nicely
        let clipboardContent = "";
        noteDatas.forEach(noteData => {
          if (noteData.lineInfo.length > 0) {
            clipboardContent += `# ${noteData.title}\n`;
            noteData.lineInfo.forEach(line => {
              const colonIfNeeded = line.heading.length != 0 ? " : " : "";
              clipboardContent += '- ' + line.heading + colonIfNeeded + line.content + '\n';
            });
            clipboardContent += "\n";
          }
        }
        );
        if (clipboardContent.length > 0) {
          navigator.clipboard.writeText(clipboardContent).then(() => {
            new Notice("Tagged information copied to clipboard.");
          }).catch(err => {
            console.error('Failed to copy text: ', err);
            new Notice("Failed to copy tagged information to clipboard.");
          });
        }
        else {
          new Notice("No tagged information found for " + tagName);
        }



    } 
  }
}