import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile, Notice } from "obsidian";
import { copyContentFromCursorToEndOfNote, copyContentFromStartOfNoteToCursor, removeContentFromCursorToEndOfNote, removeContentFromStartOfNoteToCursor, removeContentLeftSameLine, removeContentRightSameLine } from "selfutil/removeContentFromCursor";

export class RemoveContentFromCursorModal extends FuzzySuggestModal<string> {

  copyContentFromCursorToEndOfNote: string = "Copy content from cursor to end of note"
  cutContentFromCursorToEndOfNote: string = "Cut content from cursor to end of note"
  copyContentFromStartOfNoteToCursor: string = "Copy content from start of note to cursor"
  cutContentFromStartOfNoteToCursor: string = "Cut content from start of note to cursor"
  removeContentLeftSameLine : string = "Remove content left same line"
  removeContentRightSameLine : string = "Remove content right same line"
  removeContentFromStartOfNoteToCursor: string = "Remove content from start of note to cursor"
  removeContentFromCursorToEndOfNote: string = "Remove content from cursor to end of note"
  renameFilenameWithCurrentLineValue: string = "Rename Filename with Current Line value"
  copyCurrentHeadingSectionWithHeading: string = "Copy current heading section with heading"
  copyCurrentHeadingSectionWithoutHeading: string = "Copy current heading section without heading"
  replaceCurrentLineToClipboardLine: string = "Replace current line to clipboard line"
  replaceCurrentLineToClipboardAsListLine: string = "Replace current line to clipboard as list line"
  tabToFourSpaces: string = "Tab to four spaces"
  fourSpacesToTab: string = "Four spaces to tab"
  addNewLineToContinuousNewLine: string = "Add new line to continuous new line"

  options: string[] = [
    this.copyContentFromCursorToEndOfNote, 
    this.cutContentFromCursorToEndOfNote, 
    this.copyContentFromStartOfNoteToCursor, 
    this.cutContentFromStartOfNoteToCursor, 
    this.removeContentLeftSameLine, 
    this.removeContentRightSameLine, 
    this.removeContentFromStartOfNoteToCursor, 
    this.removeContentFromCursorToEndOfNote,
    this.renameFilenameWithCurrentLineValue,
    this.replaceCurrentLineToClipboardLine,
    this.replaceCurrentLineToClipboardAsListLine,
    this.copyCurrentHeadingSectionWithHeading,
    this.copyCurrentHeadingSectionWithoutHeading,
    this.tabToFourSpaces,
    this.fourSpacesToTab,
    this.addNewLineToContinuousNewLine,
  ]
  editor: Editor;
  keydownHandler: (event: KeyboardEvent) => void;

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'X') { // windows
        this.close();
      } else if (event.ctrlKey && event.metaKey && event.shiftKey && event.key === 'X') { // macos
        this.close();
      } else if (event.metaKey || event.ctrlKey) {
        const key = parseInt(event.key, 10);
        if (key >= 1 && key <= 9) {
          event.preventDefault(); // Prevent default action
          this.selectElement(key - 1); // Select the element (index key - 1)
        }
      }
    };

    // Listen for keydown events at the document level
    document.addEventListener('keydown', this.keydownHandler);
  }

  selectElement(index: number) {
    const elements = this.resultContainerEl.querySelectorAll('.suggestion-item');
    if (elements.length > index) {
      const element = elements[index] as HTMLElement;
      element.click(); // Simulate a click to select the element
    }
  }

  onClose() {
    super.onClose();
    // Stop listening for keydown events when the modal is closed
    document.removeEventListener('keydown', this.keydownHandler);
    //this.scope.unregister(); // Unregister the scope when the modal is closed
  }

  getItems(): string[] {
    return this.options;
  }

  getItemText(item: string): string {
    return item;
  }

  // Renders each suggestion item.
  renderSuggestion(i: FuzzyMatch<string>, el: HTMLElement) {
    const item = i.item
    const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
    const itemIndex = index < 10 ? index + ". " : "    "
    el.createEl("div", { text: itemIndex + item });
  }

  // Perform action on the selected suggestion.
  async onChooseItem(selectedContent: string, evt: MouseEvent | KeyboardEvent) {
    const choosenOption = selectedContent
    if (choosenOption === this.removeContentLeftSameLine) {
      removeContentLeftSameLine(this.editor)
    } else if (choosenOption === this.removeContentRightSameLine) {
      removeContentRightSameLine(this.editor)
    } else if (choosenOption === this.removeContentFromStartOfNoteToCursor) {
      removeContentFromStartOfNoteToCursor(this.editor)
    } else if (choosenOption === this.removeContentFromCursorToEndOfNote) {
      removeContentFromCursorToEndOfNote(this.editor)
    } else if (choosenOption === this.copyContentFromCursorToEndOfNote) {
      copyContentFromCursorToEndOfNote(this.editor)
    } else if (choosenOption === this.cutContentFromCursorToEndOfNote) {
      copyContentFromCursorToEndOfNote(this.editor)
      removeContentFromCursorToEndOfNote(this.editor)
    } else if (choosenOption === this.copyContentFromStartOfNoteToCursor) {
      copyContentFromStartOfNoteToCursor(this.editor)
    } else if (choosenOption === this.cutContentFromStartOfNoteToCursor) {
      copyContentFromCursorToEndOfNote(this.editor)
      removeContentFromStartOfNoteToCursor(this.editor)
    } else if (choosenOption === this.renameFilenameWithCurrentLineValue) {
      const cursor = this.editor.getCursor();
      const lineContent = this.editor.getLine(cursor.line)
      if (lineContent.contains("\\") || lineContent.contains("/") || lineContent.contains("'") || lineContent.contains('"') || lineContent.contains("<") || lineContent.contains(">") || lineContent.contains(":") || lineContent.contains("?") || lineContent.contains("*") || lineContent.contains("|")) {
        new Notice("Line contains special character (\\ / : * ? \" < > |)so cannot rename file")
        return;
      }
      const file = this.app.workspace.getActiveFile();
      if (file && lineContent !== "") {
        const newPath = file.path.replace(/[^\/]+$/, lineContent + ".md");
        this.app.fileManager.renameFile(file, newPath)
        .then(() => {
          new Notice(`Renamed file to ${this.app.workspace.getActiveFile()?.path}`);
          // then remove the line
          this.editor.replaceRange("", { line: cursor.line, ch: 0 }, { line: cursor.line, ch: this.editor.getLine(cursor.line).length + 1 });
        }).catch((error) => {
          new Notice(`Error renaming file: ${error}`);
        });
        return;
      }
      new Notice(`Error renaming file: file path not found or lineContent is empty`);
    } else if (choosenOption === this.replaceCurrentLineToClipboardLine) {
      const cursor = this.editor.getCursor();
      const clipboardContent = await this.getClipboardContent();
      if (clipboardContent !== "") {
        this.editor.replaceRange(clipboardContent, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: this.editor.getLine(cursor.line).length });
      }
    } else if (choosenOption === this.replaceCurrentLineToClipboardAsListLine) {
      const cursor = this.editor.getCursor();
      const clipboardContent = await this.getClipboardContent();
      if (clipboardContent !== "") {
        const lineContent = this.editor.getLine(cursor.line)
        const prefix = lineContent.replace(/(\t*- ).*/, "$1")
        const clipboardContent2 = clipboardContent.replace(/(\t*- )?(.*)/, "$2")
        this.editor.replaceRange(prefix + clipboardContent2, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: this.editor.getLine(cursor.line).length });
      }
    } else if (choosenOption === this.copyCurrentHeadingSectionWithHeading) {
      this.copyCurrentHeadingSection(true);
    } else if (choosenOption === this.copyCurrentHeadingSectionWithoutHeading) {
      this.copyCurrentHeadingSection(false);
    } else if (choosenOption === this.tabToFourSpaces) {
      // replace tab with four spaces for whole file
      const cursor = this.editor.getCursor();
      const text = this.editor.getValue();
      const lines = text.split('\n');
      const newLines = lines.map(line => line.replace(/\t/g, '    '));
      const newText = newLines.join('\n');
      this.editor.setValue(newText);
      this.editor.setCursor(cursor.line, 0);
      this.editor.scrollIntoView({from: {line: cursor.line, ch: 0}, to: {line: cursor.line, ch: 0}}, true)

      new Notice(`Replaced tab with four spaces for whole file`);
    } else if (choosenOption === this.fourSpacesToTab) {
      // replace four spaces with tab for whole file
      const cursor = this.editor.getCursor();
      const text = this.editor.getValue();
      const lines = text.split('\n');
      const newLines = lines.map(line => line.replace(/ {4}/g, '\t'));
      const newText = newLines.join('\n');
      this.editor.setValue(newText);
      this.editor.setCursor(cursor.line, 0);
      this.editor.scrollIntoView({from: {line: cursor.line, ch: 0}, to: {line: cursor.line, ch: 0}}, true)

      new Notice(`Replaced four spaces with tab for whole file`);
    } else if (choosenOption === this.addNewLineToContinuousNewLine) {
      const text = this.editor.getValue();

      // extract the metadata section and the rest of the text
      const metadataMatch = text.match(/---\n([\s\S]*?)\n---/);
      const metadataSection = metadataMatch ? metadataMatch[0] : "";
      const restOfText = metadataMatch ? text.replace(metadataSection, "") : text;
      const restOfTextWithoutMetadata = restOfText.replace(/---\n([\s\S]*?)\n---/, "");

      // replace single \n to \n\n, but do not replace any \n{2,3,4...} by single regexp, except metadata section
      const newText = restOfTextWithoutMetadata.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
      
      // add the metadata section back to the text
      const newTextWithMetadata = metadataSection + newText;

      this.editor.setValue(newTextWithMetadata);
      const cursor = this.editor.getCursor();
      this.editor.setCursor(cursor.line, 0);
      this.editor.scrollIntoView({from: {line: cursor.line, ch: 0}, to: {line: cursor.line, ch: 0}}, true)
    }
  }

  // Copy the current markdown heading section
  private copyCurrentHeadingSection(includeHeading: boolean) {
    const cursor = this.editor.getCursor();
    const text = this.editor.getValue();
    const lines = text.split('\n');
    
    // Find the current heading line
    let currentLine = cursor.line;
    let headingLineNumber = -1;
    let headingLevel = 0;
    
    // Search upward for the nearest heading
    for (let i = currentLine; i >= 0; i--) {
      const line = lines[i];
      const headingMatch = line.match(/^(#+)\s+/);
      if (headingMatch) {
        headingLineNumber = i;
        headingLevel = headingMatch[1].length;
        break;
      }
    }

    // Find the end of the section (next heading of same or higher level, or EOF)
    let endLineNumber = lines.length - 1;
    for (let i = currentLine + 1; i < lines.length; i++) {
      const line = lines[i];
      const nextHeadingMatch = line.match(/^(#+)\s+/);
      if (nextHeadingMatch) {
        if (headingLineNumber === -1) {
          // No heading found, copy from start of note to cursor line
          endLineNumber = i - 1;
          break;
        } else {
          if (nextHeadingMatch[1].length <= headingLevel)
          {
            endLineNumber = i - 1;
            break;
          }
        }
      }
      
    }
    
    if (headingLineNumber === -1) {
      // No heading found, copy from start of note to cursor line
      let startLine = 0;
      
      // Skip YAML frontmatter if it exists
      if (lines[0]?.trim() === "---") {
        for (let i = 1; i < lines.length; i++) {
          if (lines[i]?.trim() === "---") {
            startLine = i + 1;
            break;
          }
        }
      }
      
      // Extract content from start of note (after frontmatter) to cursor
      const sectionContent = lines.slice(startLine, endLineNumber + 1).join('\n');
      
      // Copy to clipboard
      navigator.clipboard.writeText(sectionContent).then(function () {
        new Notice(`Copied\n\`\`\`\n${sectionContent}\n\`\`\`\nfrom beginning of note to cursor`);
      }, function (error) {
        new Notice(`Error when copying to clipboard!`);
      });
      
      return;
    }
    
    // Extract the section content
    const startLine = includeHeading ? headingLineNumber : headingLineNumber + 1;
    const sectionContent = lines.slice(startLine, endLineNumber + 1).join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(sectionContent).then(function () {
      new Notice(`Copied\n\`\`\`\n${sectionContent}\n\`\`\`\nto clipboard!`);
    }, function (error) {
      new Notice(`error when copy to clipboard!`);
    });
  }

  // Read from clipboard
  async getClipboardContent() : Promise<string> {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (error) {
      new Notice("Failed to read clipboard: " + error);
      return "";
    }
  }
}