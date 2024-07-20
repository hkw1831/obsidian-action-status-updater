import { App, Editor, FuzzySuggestModal, FuzzyMatch, TFile, Vault, MarkdownView, Notice } from "obsidian";
import moment from 'moment';
import { renameTag } from "tagrenamer/renaming";
import { NavigateRewritableThreadsModal } from "navigateRewritableThreadsModal";

interface FindOrRewrite {
  type: string;
  description: string;
}

const ALL_TYPES = [
  {
    type: "find",
    description: "Find Threads to rewrite"
  },
  {
    type: "rewrite",
    description: "Rewrite Threads"
  },
];

export class RewriteThreadsModal extends FuzzySuggestModal<FindOrRewrite> {

  editor: Editor
  taskType: String
  view: MarkdownView

  constructor(app: App, editor: Editor, view: MarkdownView)
  {
    super(app)
    this.editor = editor
    this.view = view
    this.setPlaceholder(`Find or Rewrite?`)
  }

  getItems(): FindOrRewrite[] {
    return ALL_TYPES;
  }

  getItemText(noteType: FindOrRewrite): string {
    return noteType.type;
  }

  // Renders each suggestion item.
  renderSuggestion(choosenNoteTypeMatch: FuzzyMatch<FindOrRewrite>, el: HTMLElement) {
    const noteType = choosenNoteTypeMatch.item
    el.createEl("div", { text: noteType.type });
    el.createEl("small", { text: noteType.description });
  }

  containsType(line: String) : Boolean {
    return ALL_TYPES.filter((noteType) => line.contains(noteType.type)).length > 0
  }

  // Perform action on the selected suggestion.
  async onChooseItem(choosenOperation: FindOrRewrite, evt: MouseEvent | KeyboardEvent) {
    if (choosenOperation.type === "find") {
      new NavigateRewritableThreadsModal(this.app).open()
      return
    }
    if (choosenOperation.type === "rewrite") {
      const { vault } = this.app;
				let v = "---\ntags: c/t/d\n---\n\n🧵 \n\n\n---\n\n## References\n\n- \n\n"

				const path = this.view.file.path
        const file = this.view.file
        const editor = this.editor
				if (!path.match(/.\/Threads \d\d\d\d\d\d\d\d/)) {
					new Notice(`Will not proceed. It is not a threads post.`);
					return;
				}
				
				const todayYYYYMMDD = moment().format('YYYYMMDD');
				const newPath = path.replace(/^(.\/Threads) \d\d\d\d\d\d\d\d (.*)/, "$1 " + todayYYYYMMDD + " $2")
				const newNoteName = newPath.replace(/^.\//, "").replace(/.md$/, "")

				const { workspace } = this.app;
				const leaf = workspace.getLeaf(false);
				Promise.resolve()
				.then(() => {
					return vault.adapter.exists(newPath);
				})
				.then((fileExists) => {
					if (fileExists) {
						new Notice(`Will not proceed. Rewritten Thread post post already exist.`);
						return Promise.reject("Threads post already exist")
					}
				}).then(function () {
					const beforeTag = "c/t/p"
					const afterTag = "c/t/o"
					return renameTag(file, beforeTag, afterTag)
				}, function (error) {
					new Notice(`error when rename tag!`);
				})
				.then((renameSuccess) => {
					if (!renameSuccess) {
						new Notice(`Will not proceed. The old post not published (not c/t/p).`);
						return Promise.reject("Will not proceed. The old post not published (not c/t/p).")
					}
					const value = editor.getValue();
					let modifiedValue
					if (/---\n\n## [Rr]eference[s]*[:]*\n\n/m.test(value)) {
						modifiedValue = value.replace(/(## [Rr]eference[s]*[:]*\n\n)/m, "$1- Rewrite: [[" + newNoteName + "]]\n")
					} else if (/---[\n\s]*$/.test(value)) { // end with ---
						modifiedValue = value + "\n\n## References\n\n- Rewrite: [[" + newNoteName + "]]\n"
					} else {
						modifiedValue = value + "\n---\n\n## References\n\n- Rewrite: [[" + newNoteName + "]]\n"
					}
					editor.setValue(modifiedValue)
					return vault.create(newPath, v);
				})
				.then((tFile) => {
					return leaf.openFile(tFile, { active : true});
				}, reason => {})
				.then(() => {
					new Notice(`Created and opened Threads notes for rewrite!`);
				});
      return
    }
  }
}