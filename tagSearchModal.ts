import { App, FuzzySuggestModal } from "obsidian";
import { getAllTagsWithFilter } from "selfutil/getAllNoteTags";

interface Search {
	openGlobalSearch(_: string): void;
	getGlobalSearchQuery(): string;
}

export class TagSearchModal extends FuzzySuggestModal<string> {
	constructor(public app: App, private search: Search) {
		super(app);
		this.search = search;
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

}