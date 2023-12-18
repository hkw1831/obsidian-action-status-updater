import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile, Notice } from "obsidian";
import { hasFrontMatter, hasTags, renameTag } from "tagrenamer/renaming";
import {File} from "tagrenamer/File";

interface NoteType {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "a/n/n",
    description: "N Current Task",
  },
  {
    type: "a/w/n",
    description: "W Current Task",
  },
  {
    type: "a/n/l",
    description: "N Later Task",
  },
  {
    type: "a/w/l",
    description: "W Later Task",
  },
  {
    type: "a/n/p",
    description: "N Permanent Task",
  },
  {
    type: "a/w/p",
    description: "W Permanent Task",
  },
  {
    type: "b/n/s",
    description: "Zettelkasten - Source notes (like books / video / thoughts / conversation)",
  },
  {
    type: "b/n/c",
    description: "Zettelkasten - Cards (With your own thought)",
  },
  {
    type: "c/t/d",
    description: "Threads post draft",
  },
  {
    type: "c/b/d",
    description: "Blog post draft",
  },
  {
    type: "b/n/u",
    description: "Zettelkasten - Unprocessed material like an inbox",
  },
  {
    type: "b/n/m",
    description: "Zettelkasten - MOC Notes for a small topic",
  },
  {
    type: "b/n/z",
    description: "Zettelkasten - Slip box",
  },
  {
    type: "b/n/i",
    description: "Index Notes for a big topic",
  },
  {
    type: "b/n/n",
    description: "Zettelkasten - Notes (Deprecated)",
  },
  {
    type: "b/n/v",
    description: "Zettelkasten - Voice script (Deprecated?)",
  },
  {
    type: "b/n/r",
    description: "Zettelkasten - Reference (Deprecated?)",
  },
  {
    type: "b/n/p",
    description: "Placeholder Notes (Deprecated?)",
  },
  {
    type: "b/a/p",
    description: "Area of Responsibility - Primary",
  },
  {
    type: "b/a/s",
    description: "Area of Responsibility - Secondary",
  },
  {
    type: "c/b/i",
    description: "Blog post content completed but awaiting upload image",
  },
  {
    type: "c/b/r",
    description: "Blog post ready to publish",
  },
  {
    type: "c/b/p",
    description: "Blog post published",
  },
  {
    type: "c/b/i",
    description: "Blog post series index",
  },
  {
    type: "c/b/a",
    description: "Blog post abandoned",
  },
  {
    type: "c/b/o",
    description: "Blog post outlined (Deprecated?)",
  },
  {
    type: "c/b/f",
    description: "Blog post fine tuned (Deprecated?)",
  },
  {
    type: "c/t/r",
    description: "Threads post ready to post",
  },
  {
    type: "c/t/t",
    description: "Threads post threads published",
  },
  {
    type: "c/t/p",
    description: "Threads post published",
  },
  {
    type: "c/t/i",
    description: "Threads post series index",
  },
  {
    type: "c/t/a",
    description: "Threads post abandoned",
  },
  {
    type: "c/x/d",
    description: "Twitter post drafting",
  },
  {
    type: "c/x/r",
    description: "Twitter post ready to publish",
  },
  {
    type: "c/x/p",
    description: "Twitter post published",
  },
  {
    type: "a/n/w",
    description: "N Waiting Task",
  },
  {
    type: "a/n/d",
    description: "N Done Task",
  },
  {
    type: "a/n/a",
    description: "N Archive Task",
  },
  {
    type: "a/w/w",
    description: "W Waiting Task",
  },
  {
    type: "a/w/d",
    description: "W Done Task",
  },
  {
    type: "a/w/a",
    description: "W Archive Task",
  },
];

export class UpdateNoteTypeModal extends FuzzySuggestModal<NoteType> {

  editor: Editor
  file: TFile

  constructor(app: App, editor: Editor, file: TFile)
  {
    super(app)
    this.editor = editor
    this.file = file
  }

  getItems(): NoteType[] {
    return ALL_TYPES;
  }

  getItemText(noteType: NoteType): string {
    return noteType.type;
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<NoteType>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    el.createEl("div", { text: noteType.type });
    el.createEl("small", { text: noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  addFrontMatterWithTag(value: string) {
    const cursor = this.editor.getCursor()
    const oldLine = cursor.line
    const oldCh = cursor.ch
    const addText = `---\ntag: ${value}\n---\n\n${this.editor.getValue()}`
    this.editor.setValue(addText)
    cursor.line = oldLine + 4
    cursor.ch = oldCh
    this.editor.setCursor(cursor)
  }

  addTagAssumingHasFrontMatter(value: string) {
    const cursor = this.editor.getCursor()
    const oldLine = cursor.line
    const oldCh = cursor.ch

    let firstLineIndex = 0;
    const lineCount = this.editor.lineCount();
    for (let i = 0; i < lineCount; i++) {
      new Notice(this.editor.getLine(i))
      if (this.editor.getLine(i).trim() == "---".trim()) {
        firstLineIndex = i;
        break;
      }
    }
    if (firstLineIndex == lineCount) {
      new Notice("Something wrong here")
      return;
    }
    let text = ""
    for (let i = 0; i <= firstLineIndex; i++) {
      text = text + this.editor.getLine(i) + "\n";
    }
    text = text + `tag: ${value}\n`
    for (let i = firstLineIndex + 1; i <= this.editor.lineCount(); i++) {
      text = text + this.editor.getLine(i) + "\n";
    }

    this.editor.setValue(text)
    cursor.line = oldLine + (oldLine <= firstLineIndex ? 0 : 1)
    cursor.ch = oldCh
    this.editor.setCursor(cursor)
  }

  // Perform action on the selected suggestion.
  onChooseItem(choosenNoteType: NoteType, evt: MouseEvent | KeyboardEvent) {
    if (!hasFrontMatter(this.file)) {
      this.addFrontMatterWithTag(choosenNoteType.type)
    } else {
      if (hasTags(this.file))
      {
        ALL_TYPES.forEach(t => {
          renameTag(this.file, t.type, choosenNoteType.type)
          })
      } else {
        // new Notice("adding tag todo")
        // new File(app, this.file.path, null, 0).replaceInFrontMatter;

        // TODO add tags
        this.addTagAssumingHasFrontMatter(choosenNoteType.type)
      }
    

  // old solution
  //   const selection = this.editor.getSelection()
  //   const replacedStr = `---\ntag: ${choosenNoteType.type}\n---\n\n`
  //   if (selection.length != 0) {
  //       this.editor.replaceSelection(replacedStr);
  //   } else {
  //       const cursor = this.editor.getCursor();

  //       const lineCount = this.editor.lineCount();
  //       let tagLineNumber = null;
  //       for (let i = 0; i < lineCount; i++) {
  //         if (this.editor.getLine(i).startsWith('tag: ')) {
  //           tagLineNumber = i;
  //           break;
  //         }
  //       }

  //       if (tagLineNumber != null) {
  //         const line = this.editor.getLine(tagLineNumber);
  //         if (this.containsType(line)) {
  //           let replacedLine = line
  //           ALL_TYPES.forEach((noteType) => replacedLine = replacedLine.replace(noteType.type, choosenNoteType.type))
  //           this.editor.setLine(tagLineNumber, replacedLine);
  //           this.editor.setCursor(cursor);	
  //         }
  //       } else {
  //         const lineNumber = this.editor.getCursor().line;
  //         const line = this.editor.getLine(lineNumber);
  //         this.editor.replaceRange(replacedStr, cursor);
  //         cursor.ch = cursor.ch + replacedStr.length;
  //         this.editor.setCursor(cursor);
  //       }
  //   }
    }
  }
}