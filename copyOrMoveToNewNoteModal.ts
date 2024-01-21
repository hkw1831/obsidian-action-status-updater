import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile, Vault } from "obsidian";

interface CopyOrMove {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "copy",
    description: "Copy"
  },
  {
    type: "move",
    description: "Move"
  },
];

export class CopyOrMoveToNewNoteModal extends FuzzySuggestModal<CopyOrMove> {

  editor: Editor
  taskType: String

  constructor(app: App, editor: Editor)
  {
    super(app)
    this.editor = editor
    this.setPlaceholder(`Copy or move selection to new note?`)
  }

  getItems(): CopyOrMove[] {
    return ALL_TYPES;
  }

  getItemText(noteType: CopyOrMove): string {
    return noteType.type;
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<CopyOrMove>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    el.createEl("div", { text: noteType.type });
    el.createEl("small", { text: noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  async onChooseItem(choosenOperation: CopyOrMove, evt: MouseEvent | KeyboardEvent) {
    const selection = this.editor.getSelection()
    const line = this.editor.getCursor().line
    const textToCopyOrMove = (selection.length == 0)
                ? this.editor.getLine(line)
                : selection
    
    const newFileName = "I/United Push.md"
    await this.createOrAppendFile(newFileName, textToCopyOrMove)

    if (choosenOperation.type == "move") {
      if (selection.length != 0) {
        this.editor.replaceSelection("")
      } else {
        let content = ""
        for (let i = 0; i < this.editor.lineCount(); i++) {
          if (i != line) {
            content += this.editor.getLine(i) + "\n"
          }
        }
        this.editor.setValue(content)
      }
    }

    const { vault } = this.app;
    const { workspace } = this.app;
    const mode = (this.app.vault as any).getConfig("defaultViewMode");
    const leaf = workspace.getLeaf(false);
    await leaf.openFile(vault.getAbstractFileByPath(newFileName) as TFile, { active : true,});
  }

  async createOrAppendFile(filePath: string, note: string) {
		//If files exists then append conent to existing file
		const { vault } = this.app;
		const fileExists = await vault.adapter.exists(filePath);
		if(fileExists){
			await this.appendFile(vault, filePath, note);
		} else {
			await vault.create(filePath, "---\ntag: b/n/s\n---\n\n" + note);
		}
		return filePath;
	}

    async appendFile(vault: Vault, filePath: string, note: string) {
		let existingContent = await vault.adapter.read(filePath);
		if(existingContent.length > 0) {
		  existingContent = existingContent + '\r\r';
		}
		await vault.adapter.write(filePath, existingContent + note);
	  }
}