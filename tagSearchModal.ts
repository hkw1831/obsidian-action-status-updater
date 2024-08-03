import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";
import { getAllTagsWithFilter } from "selfutil/getAllNoteTags";

interface Search {
	openGlobalSearch(_: string): void;
	getGlobalSearchQuery(): string;
}

export class TagSearchModal extends FuzzySuggestModal<string> {

	keydownHandler: (event: KeyboardEvent) => void;

	constructor(public app: App, private search: Search) {
		super(app);
		this.search = search;
		this.keydownHandler = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'S') { // windows
			  this.close();
			} else if (event.ctrlKey && event.metaKey && event.shiftKey && event.key === 'S') { // macos
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

	getItems(): string[] {
		return getAllTagsWithFilter(this.app);
	}

	getItemText(item: string): string {
		return item;
	}

	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
		const defaultTagSearchString = `tag:${item}`;
        this.search.openGlobalSearch(defaultTagSearchString);
	}

	onClose() {
		super.onClose();
		// Stop listening for keydown events when the modal is closed
		document.removeEventListener('keydown', this.keydownHandler);
		//this.scope.unregister(); // Unregister the scope when the modal is closed
	}

	renderSuggestion(tag: FuzzyMatch<string>, el: HTMLElement) {
		const noteType = tag.item
		const index = this.resultContainerEl.querySelectorAll('.suggestion-item').length;
		const itemIndex = index < 10 ? index + ". " : "    "
		el.createEl("div", { text: itemIndex + noteType });
	}

}