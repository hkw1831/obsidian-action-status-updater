import { UpdateNoteTypeModal } from 'updateNoteTypeModal';
import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile, Vault, EditorSelection, Workspace } from 'obsidian';
import { AddFootnoteTagModal } from 'addCommentTagModal';
import { AddTaskTagModal } from 'addTaskTagModal';
import { renameBlogTitle, renameTag } from 'tagrenamer/renaming';
import { ThreadsToImagesModal } from 'ThreadsToImagesModal';
import { CopyOrMoveToNewNoteModal } from 'copyOrMoveToNewNoteModal';
import { ClipboardPasteModal } from 'clipboardPasteModal';
import { OpenPlaygroundModal } from 'openPlaygroundModal';
import { ThreadsToBlogModal } from 'threadsToBlogModal';
import { ClipboardRemovalModal } from 'clipboardRemovalModal';
import { TagSearchModal } from 'tagSearchModal';
import { addIcon } from 'obsidian';
import moment from 'moment';
import { AddTextToNotesModal } from 'addTextToNotesModal';
import { NavigateToNoteFromTagModal } from 'navigateToNoteFromTagModal';
import { SelectionRange, exportCurrentSelection, getCurrentSelectionLineNumber } from 'selfutil/extractSelection';
import { getParentLine, replaceTWUselessValue, shouldSkipFrontMatter, tidyUpFrontMatterOnValue, tidyUpFrontMatteronEditor } from 'twmigration/twMigrateTools';
import { removeContentFromCursorToEndOfNote, removeContentFromStartOfNoteToCursor, removeContentLeftSameLine } from 'selfutil/removeContentFromCursor';
import { RemoveContentFromCursorModal } from 'removeContentFromCursorModal';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

const clipboardHistory: string[] = []

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	view: MarkdownView;

	async onload() {
		await this.loadSettings();

		/*
		//function displayNoteInLeftView(app: App, notePath: string) {
			console.log("===1")
			//const view = new MarkdownView(this.app.workspace.getLeaf());
			//console.log("===2")
			//view.setEphemeralState({ path: "I/Inbox.md" });
			//console.log("===3")
			//app.workspace.getLeaf().setViewState({ type: "markdown", state: view.getState() });
			//console.log("===4")

			
			this.registerView(
				"inbox",
				(leaf) => {
					this.view = new MarkdownView(leaf)
					this.view.setEphemeralState({ path: "I/Inbox.md" });
					const state = this.view.getState()
					state.pinned = true
					leaf.setViewState({ type: "markdown", state: state });
					return this.view
				},
			  );
		  //}

		  console.log("===2")

		  this.addCommand({
			id: 'recent-files-open',
			name: 'Open XXX',
			callback: async () => {
			  let [leaf] = this.app.workspace.getLeavesOfType(
				"inbox",
			  );
			  if (!leaf) {
				leaf = this.app.workspace.getLeftLeaf(false);
				await leaf.setViewState({ type: "inbox" });
			  }
	  
			  this.app.workspace.revealLeaf(leaf);
			},
		  });

		  console.log("===3")
		  */
		  

		if (navigator.clipboard) {
			document.addEventListener('copy', (event: ClipboardEvent) => {
				const copiedText = event.clipboardData?.getData('text/plain');
				if (copiedText != null) {
					this.addToClipboardHistory(copiedText)
				}
			});
			document.addEventListener('cut', (event: ClipboardEvent) => {
				const copiedText = event.clipboardData?.getData('text/plain');
				if (copiedText != null) {
					this.addToClipboardHistory(copiedText)
				}
			  });
		  } else {
			console.log('Clipboard API is not supported in this browser.');
		  }

		['n', 'l', 'w', 'd', 'a', '1', '2', '3', '4', '5', '6', '7'].forEach(t => {
			this.addActionIcon(t);
			this.addActionCommand(t);
		});

		['t', 'm', 'e'].forEach(t => {
			this.addActionIcon(t);
			this.addFollowUpCommand(t);
		});

		['n', 'w'].forEach(t => {
			this.addNewLaterActionIcon(t);
			this.addNewLaterAction(t);
		});

		this.addCommand({
			id: "obsidian-remove-clipboard-content",
			name: "RC Obsidian Remove Clipboard Content",
			icon: "obsidian-remove-clipboard-content",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new ClipboardRemovalModal(this.app, editor, clipboardHistory).open();		
			}
		});

		/*
		this.addObsidianIcon('obsidian-copy', '⌘C');
		this.addCommand({
			id: "obsidian-copy",
			name: "Obsidian Copy",
			icon: "obsidian-copy",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let content = editor.getSelection().toString()
				if (content.length == 0) {
					content = editor.getLine(editor.getCursor().line)
				}
				this.addToClipboardHistory(content);
				new Notice("```\n" + content + "\n```\nis copied to clipboard!")
			},
			hotkeys: [
				{
					modifiers: [`Meta`, `Shift`],
					key: `c`,
				}
			]
		});
		*/

		/*
		this.addObsidianIcon('obsidian-cut', '⌘X');
		this.addCommand({
			id: "obsidian-cut",
			name: "Obsidian Cut",
			icon: "obsidian-cut",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let content = editor.getSelection().toString()
				if (content.length == 0) {
					content = editor.getLine(editor.getCursor().line)
				}
				this.addToClipboardHistory(content);
				editor.replaceSelection("")
				new Notice("```\n" + content + "\n```\nis cut to clipboard!")
			},
			hotkeys: [
				{
					modifiers: [`Meta`, `Shift`],
					key: `x`,
				}
			]
		});
	*/


	this.addObsidianIcon('find-broken-link', 'BL');
	this.addCommand({
		id: "find-broken-link",
		name: "Find Broken Link BL",
		icon: "find-broken-link",
		editorCallback: (editor: Editor, view: MarkdownView) => {
			if (view.file.path !== "I/Broken Link.md") {
				
				const cursor = editor.getCursor()
				const line = cursor.line
				const lineContent = editor.getLine(line)

				// if line content has [[ and ]]  and : ? / < > in between, replace them to _
				if (/\[\[.*[:?\/\\<>].*\]\]/.test(lineContent)) {
					new Notice("Trying to fix broken line in current line: " + lineContent)
					// replace all : to _ and replace all ? to _ and replace all / to _ and replace all . to _
					editor.setLine(line, lineContent.replace(/:/g, "_").replace(/\?/g, "_").replace(/\//g, "_").replace(/\\/g, "_").replace(/</g, "_").replace(/>/g, "_")
					.replace(/^(parent\d+)_ /, "$1: ")
					.replace(/^(title\d+)_ /, "$1: ")
					)
				} else {
					// find next broken link
					const unresolvedLinks: Record<string, Record<string, number>> = this.app.metadataCache.unresolvedLinks;
					const brokenLinkRecord: Record<string, number> = unresolvedLinks[view.file.path]
					if (brokenLinkRecord == null) {
						new Notice("No broken link found in this file")	
						return
					}
					const brokenLinks = Object.keys(brokenLinkRecord)
					if (brokenLinks == null || brokenLinks.length == 0) {
						new Notice("No broken link found in this file")	
						return
					}
					for (let i = line + 1; i < editor.lineCount(); i++) {
						const lineContent = editor.getLine(i)
						for (let b = 0; b < brokenLinks.length; b++) {
							const brokenLink = brokenLinks[b]
							if (lineContent.contains("[[" + brokenLink + "]]")) {
								editor.setCursor({line: i, ch: 0})
								editor.scrollIntoView({from: {line: i, ch: 0}, to: {line: i, ch: 0}}, true)
								new Notice("Navigated to next Broken link starting from cursor")
								return
							}
						}
					}
					new Notice("No broken link found after cursor line in this file")	
				}
				return
			}
			let count = 0
			let result = ""
			const unresolvedLinks: Record<string, Record<string, number>> = this.app.metadataCache.unresolvedLinks;	
			// then loop the record data in console
			for (const [key, value] of Object.entries(unresolvedLinks)) {
				let v = ''
				for (const [k1, v1] of Object.entries(value)) {
					v += k1 + ":" + v1 + ", "
				}
				v = v.replace(/, $/, "")
				if (v !== "") {
					console.log(key + ' -> [' + v + ']')
					result += "- [[" + key.replace(/\.md$/,"") + ']]'// : [' + v + ']'
					result += "\n"
					for (const [k2, v2] of Object.entries(value)) {
						result += "\t- " + k2.replace(/\.md$/,"") + ''
						result += "\n"
					}
					count++
				}
			}
			editor.setValue(result)
			new Notice("Updated broken link. count=" + count)
			/*
			navigator.clipboard.writeText(result).then(() => {
				new Notice("count=" + count)
				new Notice("copied result to clipboard!")
			})
			*/
		},
		hotkeys: [
			{
				modifiers: [`Ctrl`, `Meta`, `Shift`],
				key: `5`,
			},
			{
				modifiers: [`Ctrl`, `Alt`, `Shift`],
				key: `5`,
			},
		]
	});

		this.addCommand({
			id: "open-tag-search",
			name: "Open tag search",
			icon: "hash",
			callback: () => {
				/* eslint-disable @typescript-eslint/no-explicit-any */
				const searchPlugin = (
					this.app as any
				).internalPlugins.getPluginById("global-search");
				/* eslint-enable @typescript-eslint/no-explicit-any */
				const search = searchPlugin && searchPlugin.instance;

				if (searchPlugin && searchPlugin.instance) {
					new TagSearchModal(this.app, search).open();
				} else {
					new Notice("Please enable the search core plugin!");
				}
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `s`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `s`,
				},
			]
		});

		this.addObsidianIcon('obsidian-paste', '⌘V');
		this.addCommand({
			id: "obsidian-paste",
			name: "Obsidian Paste",
			icon: "obsidian-paste",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new ClipboardPasteModal(this.app, editor, clipboardHistory).open();		
			},
			hotkeys: [
				{
					modifiers: [`Meta`, `Shift`],
					key: `v`,
				}
			]
		});

		this.addObsidianIcon('update-note-type-icon', 'NT');
		this.addCommand({
			id: "update-note-type",
			name: "Update Note Type",
			icon: `update-note-type-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
			  new UpdateNoteTypeModal(this.app, editor, view.file).open();
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `c`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `c`,
				},
			]
		});


		// combined version
		//this.updateSchedulingIcon()
		this.addCommand({
			id: "open-recent-days-schedule-with-updated-schedule",
			name: "OR Open Recent Days Updated Schedule",
			icon: "open-recent-day-schedule-icon",
			callback: async () => {
				// update scheduling part
				const { vault } = this.app;
				const scheduleNoteWithoutMd = "D/Scheduling"
				const scheduleNote = `${scheduleNoteWithoutMd}.md`				
				if (vault.getAbstractFileByPath(scheduleNote) == null) {
					await vault.create(scheduleNote, "");
				}
				let noteContent = ''
				Array.from(Array(7).keys()).forEach(i => noteContent += this.getQueryDateString(i, scheduleNoteWithoutMd));
				vault.modify(vault.getAbstractFileByPath(scheduleNote) as TFile, noteContent);

				this.addActionNoteContent(vault, "D", "Query W now actions", "Weekly Schedule W", "w")
				this.addActionNoteContent(vault, "D", "Query N now actions", "Weekly Schedule N", "n")
				this.add3DaysActionNoteContent(vault);
				new Notice("Updated schedule");

				// open schedule part
				const { workspace } = this.app;
				const dashboardCanvas = "D/Query Schedule and Actions next 3 days.md"
				const mode = (this.app.vault as any).getConfig("defaultViewMode");
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(dashboardCanvas) as TFile, { active : true,/* mode */});
			}
		})

		this.addObsidianIcon('update-scheduling-icon', 'US');
		this.addCommand({
			id: "update-scheduling",
			name: "Update Scheduling",
			icon: "update-scheduling-icon",
			callback: async () => {
				const { vault } = this.app;
				const scheduleNoteWithoutMd = "D/Scheduling"
				const scheduleNote = `${scheduleNoteWithoutMd}.md`				
				if (vault.getAbstractFileByPath(scheduleNote) == null) {
					await vault.create(scheduleNote, "");
				}
				let noteContent = ''
				Array.from(Array(7).keys()).forEach(i => noteContent += this.getQueryDateString(i, scheduleNoteWithoutMd));
				vault.modify(vault.getAbstractFileByPath(scheduleNote) as TFile, noteContent);

				this.addActionNoteContent(vault, "D", "Query W now actions", "Weekly Schedule W", "w")
				this.addActionNoteContent(vault, "D", "Query N now actions", "Weekly Schedule N", "n")
				this.add3DaysActionNoteContent(vault);
				new Notice("Updated schedule");
			}/*,
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `u`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `u`,
				},
			]*/
		})

		/*
		this.addObsidianIcon('open-dashboard-icon', 'OD');
		this.addCommand({
			id: "open-dashboard",
			name: "Open Dashboard",
			icon: "open-dashboard-icon",
			callback: async () => {
				const { vault } = this.app;
				const { workspace } = this.app;
				const dashboardCanvas = "D/Dashboard.canvas"
				const mode = (this.app.vault as any).getConfig("defaultViewMode");
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(dashboardCanvas) as TFile, { active : true});
			},
		})
		*/

		this.addObsidianIcon('open-recent-day-schedule-icon', 'OR');
		this.addCommand({
			id: "open-recent-days-schedule",
			name: "Open Recent Days Schedule",
			icon: "open-recent-day-schedule-icon",
			callback: async () => {
				const { vault, workspace } = this.app;
				const dashboardCanvas = "D/Query Schedule and Actions next 3 days.md"
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(dashboardCanvas) as TFile, { active : true });
			},
		})

		this.addObsidianIcon('open-inbox-icon', 'OI');
		this.addCommand({
			id: "open-inbox",
			name: "OI Open Inbox",
			icon: "open-inbox-icon",
			callback: async () => {
				const { vault, workspace } = this.app;
				const inboxMd = "I/Inbox.md"
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(inboxMd) as TFile, { active : true });
			},
		})

		this.addObsidianIcon('open-playground-icon', 'OP');
		this.addCommand({
			id: "open-playground",
			name: "OP Open Playground",
			icon: "open-playground-icon",
			callback: async () => {
				new OpenPlaygroundModal(this.app).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `p`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `p`,
				},
			]
		})

		this.addObsidianIcon('open-braindump-icon', 'OB');
		this.addCommand({
			id: "open-braindump",
			name: "OB Open BrainDump",
			icon: "open-braindump-icon",
			callback: async () => {
				const { vault, workspace } = this.app;
				const inboxMd = "I/Brain Dump.md"
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(inboxMd) as TFile, { active : true });
			},
		})

		/*
		this.addCommand({
			id: "open-actions",
			name: "Open Actions",
			icon: `aperture`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
			  new OpenActionsModal(this.app).open();
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `x`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `x`,
				},
			]
		});
		*/

		// TODO remove after TW migrate finish
		this.addObsidianIcon('format-all-notes-custom', 'FA');
		this.addCommand({
			id: "format-all-notes-custom",
			name: "FA Format All Notes (Custom usage)",
			icon: `format-all-notes-custom`,
			callback: async () => {
				const vault: Vault = this.app.vault;
				
				let startCount = 0
				let finishedCount = 0
				const files = vault.getMarkdownFiles()
				new Notice("all=" + files.length)
				console.log("all=" + files.length)
				for (const file of files) {
					// note that still async
					console.log("s: " + startCount)
					vault.read(file).then((content) => {
						const modifiedValue = tidyUpFrontMatterOnValue(content)
						return vault.modify(file, modifiedValue);
					}).then(() => {
						console.log("f: " + finishedCount)
						finishedCount++
						if (finishedCount == files.length) {
							console.log("finished")
							new Notice("finished")
						}
					})
					startCount++
				}
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `1`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `1`,
				},
			]
		});

		// TODO remove after TW migrate finish
		this.addObsidianIcon('tw-fix-broken-link', ':_');
		this.addCommand({
			id: "tw-fix-broken-link",
			name: "BL Fix TW Broken Link",
			icon: `tw-fix-broken-link`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor()
				const line = cursor.line
				const lineContent = editor.getLine(line)
				// replace all : to _ and replace all ? to _ and replace all / to _ and replace all . to _
				editor.setLine(line, lineContent.replace(/:/g, "_").replace(/\?/g, "_").replace(/\//g, "_").replace(/</g, "_").replace(/>/g, "_")
				.replace(/^(parent\d+)_ /, "$1: ")
				.replace(/^(title\d+)_ /, "$1: ")
				)
			}/*,
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `5`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `5`,
				},
			]*/
		});

		// TODO remove after TW migrate finish
		this.addObsidianIcon('format-notes-custom', 'FN');
		this.addCommand({
			id: "format-notes-custom",
			name: "FN Format Notes (Custom usage)",
			icon: `format-notes-custom`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				tidyUpFrontMatteronEditor(editor)
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `2`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `2`,
				},
			]
		});

// TODO remove after TW migrate finish
this.addObsidianIcon('tw-get-parent-link', '[]');
this.addCommand({
	id: "tw-get-parent-link",
	name: "tw-get-parent-link",
	icon: `tw-get-parent-link`,
	editorCallback: (editor: Editor, view: MarkdownView) => {
		// example cursor line is either one of following:
		// parent1: "[[ITIVITI _ ASX Trading]]"
		// - parent1: "[[ITIVITI _ ASX Trading]]"
		// goal is to copy "ITIVITI _ ASX Trading" to clipboard and remove this line
		const cursor = editor.getCursor()
		const line = cursor.line
		const ch = cursor.ch
		const lineContent = editor.getLine(line)
		if (/^parent\d+: /.test(lineContent) || /^\t+- parent\d+: /.test(lineContent)) {
			const parentLink = lineContent.replace(/^parent\d+: /, "").replace(/^\t+- parent\d+: /, "").replace(/"/g, "").replace(/\[\[/, "").replace(/\]\]/, "")
			navigator.clipboard.writeText(parentLink).then(() => {
				if (line == 0) {
					editor.setValue("")
				} else {
					const previousLine = editor.getLine(line-1)
					editor.replaceRange("", {line: line-1, ch: previousLine.length}, {line: line, ch: lineContent.length})
				}
				editor.setValue(editor.getValue().replace(/^---\n+---\n/, "---\ntag: b/n/c\n---\n").replace(/\n$/, ""))
				editor.setCursor({line: line, ch: ch > editor.getLine(line).length ? editor.getLine(line).length : ch})
				new Notice("Copied to clipboard: " + parentLink)
			})
		}
	},
	hotkeys: [
		{
			modifiers: [`Ctrl`, `Meta`, `Shift`],
			key: `y`,
		},
		{
			modifiers: [`Ctrl`, `Alt`, `Shift`],
			key: `y`,
		},
	]
});

// TODO remove after TW migrate finish
this.addObsidianIcon('tw-tidy-list-note', '==');
this.addCommand({
	id: "tw-tidy-list-note",
	name: "TL == TW Tidy List Note",
	icon: `tw-tidy-list-note`,
	editorCallback: (editor: Editor, view: MarkdownView) => {
		editor.setValue(replaceTWUselessValue(editor.getValue()))
		const lineCount = editor.lineCount()
		let fm = ""
		let c = ""
		let text = ""
		let h3Count = 0;
		let content = ""
		let taskTag = ""
		for (let i = 0; i < lineCount; i++) {
			const line = editor.getLine(i)
			if (h3Count == 0) {
				if (line.length != 0 && !/^\t*- ```$/.test(line)) {
					const modifiedLine = line.contains("[[") && line.contains("]]") 
			            ? line
						: line.replace(view.file.basename + " _ ", "").replace(/(\t*- )#+ > /, "$1").replace(/(\t+- )#+ /, "$1")
						// 	- ## > cstatus and txstat = 0
					content += (modifiedLine + "\n")
				}
			} else if (h3Count == 1) {
				if (line.startsWith("title: ") || line.startsWith("list: ")) {
					fm += (line + "\n")
				} else if (line.length != 0 && !/^\t*- ```$/.test(line)) { 
					const modifiedLine = line.contains("[[") && line.contains("]]") 
						? line
						: line.replace(view.file.basename + " _ ", "").replace(/(\t*- )#+ > /, "$1").replace(/(\t+- )#+ /, "$1")
					fm += (modifiedLine + "\n")
				}
			}
			if (h3Count >= 2) {
				if (line.length != 0 && !/^\t*- ```$/.test(line)) {
					const modifiedLine = line.contains("[[") && line.contains("]]") 
						? line
						: line.replace(view.file.basename + " _ ", "").replace(/(\t*- )#+ > /, "$1").replace(/(\t+- )#+ /, "$1")
					c += (modifiedLine + "\n")
				}
			}
			if (line === "---") {
				h3Count++;
				if (h3Count == 2) {
					fm += "\n"
				}
			}
		} 
		text += content
		if (fm.length > 0) {
			text += fm
		}
		text += c
		text = text.replace(/^---\n+---\n/m, "---\ntag: b/n/c\n---\n").replace(/\n$/, "")
		editor.setValue(text)
	},
	hotkeys: [
		{
			modifiers: [`Ctrl`, `Meta`, `Shift`],
			key: `6`,
		},
		{
			modifiers: [`Ctrl`, `Alt`, `Shift`],
			key: `6`,
		},
	]
});

// TODO remove after TW migrate finish
this.addObsidianIcon('tw-task', '--');
this.addCommand({
	id: "tw-task",
	name: "TT -- TW Task",
	icon: `tw-task`,
	editorCallback: (editor: Editor, view: MarkdownView) => {
		editor.setValue(replaceTWUselessValue(editor.getValue()))
		const lineCount = editor.lineCount()
		let fm = ""
		let c = ""
		let text = ""
		let h3Count = 0;
		let content = ""
		let taskTag = ""
		for (let i = 0; i < lineCount; i++) {
			const line = editor.getLine(i)
			if (h3Count == 0) {
				content += (line + "\n")
			} else if (h3Count == 1) {
				if (line.startsWith("title: ")) {
					// do nothing
				} else if (line.startsWith("tagsss: ")) {
					taskTag = "a/"
					if (/ N /.test(line) || / N$/.test(line)) {
						taskTag += "n/"
					}
					if (/ W /.test(line) || / W$/.test(line)) {
						taskTag += "w/"
					}
					if (/ now /.test(line) || / now$/.test(line)) {
						taskTag += "n"
					}
					if (/ later /.test(line) || / later$/.test(line)) {
						taskTag += "l"
					}
					if (/ waiting /.test(line) || / waiting$/.test(line)) {
						taskTag += "w"
					}
					if (/ done /.test(line) || / done$/.test(line)) {
						taskTag += "d"
					}
					if (/ archive /.test(line) || / archine$/.test(line)) {
						taskTag += "a"
					}
					if (taskTag.length == 5) {
						fm += ("tag: " + taskTag + "\n")
					} else {
						new Notice("error on setting action tag")
						fm += (line + "\n")
					}	
				} else {
					fm += (line + "\n")
				}
			}
			if (h3Count >= 2) {
				let modifiedLine = line
				c += (modifiedLine + "\n")
			}
			if (line === "---") {
				h3Count++;
			}
		} 
		text += content
		if (fm.length > 0) {
			text += fm
		}
		text += c
		text = text.replace(/^---\n+---\n/m, "---\ntag: b/n/c\n---\n").replace(/\n$/, "")
		editor.setValue(text)
		editor.setCursor({line: getParentLine(text), ch: 0})
		app.vault.rename(view.file, "C/" + view.file.name)
	},
	hotkeys: [
		{
			modifiers: [`Ctrl`, `Meta`, `Shift`],
			key: `7`,
		},
		{
			modifiers: [`Ctrl`, `Alt`, `Shift`],
			key: `7`,
		},
	]
});


/*
		// TODO remove after TW migrate finish
		this.addObsidianIcon('tw-checkbox', '[]');
		this.addCommand({
			id: "tw-checkbox",
			name: "CB TW Checkbox",
			icon: `tw-checkbox`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const checkboxMap = new Map<string, string>();
				const lineCount = editor.lineCount()

				let fm = ""
				let c = ""
				let text = ""
				let h3Count = 0;
				let content = ""
				for (let i = 0; i < lineCount; i++) {
					const line = editor.getLine(i)
					if (h3Count == 0) {
						content += (line + "\n")
					} else if (h3Count == 1) {
						if (line.startsWith("checkboxbytime_")) {
							const keyValueArray = line.split(":").map(item => item.trim());
							if (keyValueArray.length === 2) {
								const key = keyValueArray[0];
								const value = keyValueArray[1];

								const splitArray = key.split("_");
								const modifiedKey = `<<checkboxByTime "${splitArray[1]}">>`;

								checkboxMap.set(modifiedKey, value === "open" ? "[x]" : "[ ]");
							}
						} else {
							fm += (line + "\n")
						}
					}
					if (h3Count >= 2) {
						let modifiedLine = line

						for (const [key, value] of checkboxMap) {
							modifiedLine = modifiedLine.replace(new RegExp(key, "g"), value);
						}
						modifiedLine = modifiedLine.replace(/<<checkboxByTime "[A-Za-z0-9_]+">>/g, "[ ]")

						c += (modifiedLine + "\n")
					}
					if (line === "---") {
						h3Count++;
					}
				} 
				text += content
				if (fm.length > 0) {
					text += fm
					//text += "---\n" + fm + "---\n"
				}
				text += c
				
				editor.setValue(text.replace(/\n$/, ""))
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `7`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `7`,
				},
			]
		});
*/

		// TODO remove after TW migrate finish
		this.addObsidianIcon('note-to-tree-list', '**');
		this.addCommand({
			id: "note-to-tree-list",
			name: "NT Note to Tree List",
			icon: `note-to-tree-list`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const checkboxMap = new Map<string, string>();
				const lineCount = editor.lineCount()
				if (editor.getValue().startsWith("- " + view.file.basename + "\n")) {
					// already tidy once, here only should remove empty line and remove duplicate list name (tw hierarchy)
					const filename = view.file.basename
					let text = ""
					for (let i = 0; i < lineCount; i++) {
						const line = editor.getLine(i)
						if (line.trim().length != 0) {
							if (!/^\t*- $/.test(line) && !/^\t*\d+\. $/.test(line)) { // empty list item
								let modLine = line
								if (!modLine.contains("[[") && !modLine.contains("]]")) {
									modLine = line.replace(`${filename} _ `, "") // prevent replace link
								}
								if (line !== `- ${view.file.basename}` && /^- /.test(line)){
									modLine = "\t" + modLine
								}
								text += modLine + "\n"
							}
						}
					}
					text = text.replace(/\n$/m, "")
					editor.setValue(text)
					editor.setCursor({line: getParentLine(text), ch: 0})
				} else {
					editor.setValue(replaceTWUselessValue(editor.getValue()))
					let text = "- "
					let h3Count = 0;
					let actionTag = ""
					let content = ""
					for (let i = 0; i < lineCount; i++) {
						const line = editor.getLine(i)
						if (h3Count == 0) {
							if (line.trim().length != 0 && line != "---") {
								let modifiedLine = line
								for (let i = 0; i < 9; i++) {
									modifiedLine = modifiedLine.replace(/^    /, "\t")
								}
								modifiedLine = modifiedLine.replace(/^(\t*)\*\s/, "$1- ")
								modifiedLine = (/^\t*- /.test(modifiedLine) || /^\t*\d+\. /.test(modifiedLine)) ? ("\t" + modifiedLine) : ("\t- " + modifiedLine)
								content += "\n" + modifiedLine
							}
						} else if (h3Count == 1) {
							if (line === "---" || shouldSkipFrontMatter(line) || line.startsWith("title: ")) {
								// do nothing
							} else if (line.startsWith("tagsss: ")) {
								if (/ N /.test(line) || / N$/.test(line)) {
									actionTag = "n"
								}
								if (/ W /.test(line) || / W$/.test(line)) {
									actionTag = "w"
								}
								if (/ now /.test(line) || / now$/.test(line)) {
									actionTag += "n"
								}
								if (/ later /.test(line) || / later$/.test(line)) {
									actionTag += "l"
								}
								if (/ waiting /.test(line) || / waiting$/.test(line)) {
									actionTag += "w"
								}
								if (/ done /.test(line) || / done$/.test(line)) {
									actionTag += "d"
								}
								if (/ archive /.test(line) || / archine$/.test(line)) {
									actionTag += "w"
								}
								if (actionTag.length == 2) {
									actionTag = "#" + actionTag + " "
								} else if (actionTag.length == 1) {
									new Notice("error on setting action tag")
								}
							} else if (line.startsWith("checkboxbytime_")) {
								const keyValueArray = line.split(":").map(item => item.trim());
								if (keyValueArray.length === 2) {
									const key = keyValueArray[0];
									const value = keyValueArray[1];

									const splitArray = key.split("_");
									const modifiedKey = `<<checkboxByTime "${splitArray[1]}">>`;

									checkboxMap.set(modifiedKey, value === "open" ? "[x]" : "[ ]");
								}
							} else {
								if (line.trim().length != 0) {
									let modifiedLine = line
									for (let i = 0; i < 9; i++) {
										modifiedLine = modifiedLine.replace(/^    /, "\t")
									}
									modifiedLine = modifiedLine.replace(/^(\t*)\*\s/, "$1- ")
									modifiedLine = (/^\t*- /.test(modifiedLine) || /^\t*\d+\. /.test(modifiedLine)) ? ("\t" + modifiedLine) : ("\t- " + modifiedLine)
									content += "\n" + modifiedLine
								}
							}
						}
						if (h3Count >= 2 && line.trim().length != 0) {
							let modifiedLine = (line === "[ ] ") ? "" : line
							if (modifiedLine.trim().length != 0) {
								for (let i = 0; i < 9; i++) {
									modifiedLine = modifiedLine.replace(/^    /, "\t")
								}
								modifiedLine = modifiedLine.replace(/^(\t*)\*\s/, "$1- ")
								modifiedLine = (/^\t*- /.test(modifiedLine) || /^\t*\d+\. /.test(modifiedLine)) ? ("\t" + modifiedLine) : ("\t- " + modifiedLine)
								// modifiedLine = line === "---" ? "---" : modifiedLine

								for (const [key, value] of checkboxMap) {
									modifiedLine = modifiedLine.replace(new RegExp(key, "g"), value);
								}
								modifiedLine = modifiedLine.replace(/<<checkboxByTime "[A-Za-z0-9_]+">>/g, "[ ]")

								text += ("\n" + modifiedLine)
							}
						}
						if (line === "---") {
							let beforeH3 = h3Count
							h3Count++;
							if (beforeH3 == 1 && h3Count == 2) {
								text += actionTag + view.file.basename
							}
						}
					}
					if (h3Count < 2) { // no frontmatter
						text += view.file.basename
					} 
					text += content
					editor.setValue(text)
					editor.setCursor({line: getParentLine(text), ch: 0})
				}
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `8`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `8`,
				},
			]
		});

		this.addCommand({
			id: "remove-content-from-cursor",
			name: "Remove content from cursor",
			icon: `axe`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new RemoveContentFromCursorModal(this.app, editor).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `x`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `x`,
				},
			]
		});
		
		this.addCommand({
			id: "remove-content-left",
			name: "Remove content left same line",
			icon: `arrow-left-circle`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				removeContentLeftSameLine(editor)
			}
		});

		this.addCommand({
			id: "remove-content-right",
			name: "Remove content right same line",
			icon: `arrow-right-circle`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				removeContentLeftSameLine(editor)
			}
		});

		this.addCommand({
			id: "remove-content-top-left",
			name: "Remove content from start of note to cursor",
			icon: `arrow-up-circle`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				removeContentFromStartOfNoteToCursor(editor)
			}
		});

		this.addCommand({
			id: "remove-content-bottom-right",
			name: "Remove content from cursor to end of note",
			icon: `arrow-down-circle`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				removeContentFromCursorToEndOfNote(editor)
			}
		});

		this.addObsidianIcon('threads-to-blog-icon', 'TB');
		this.addCommand({
			id: "threads-to-blog",
			name: "TB Threads as pre Blog format to Clipboard",
			icon: `threads-to-blog-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new ThreadsToBlogModal(this.app, editor, view).open()
			}
		});

		/*
		this.addObsidianIcon('chatgpt-prompt-for-generating-summary-to-clipboard', 'GS');
		this.addCommand({
			id: "chatgpt-prompt-for-generating-summary-to-clipboard",
			name: "GS ChatGPT prompt for generating summary to clipboard",
			icon: `chatgpt-prompt-for-generating-summary-to-clipboard`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const prompt = "請將以下的文章節錄縮短成約150字的中文摘要，確保摘要內容精煉且突出重點。你需要注意以下幾點：\n" +
							   "\n" +
							   "1. 將長篇大論縮短，只保留最重要的訊息和主題。\n" +
							   "2. 去除非必要的詳細訊息，並避免使用過於繁複或不必要的語言。\n" +
							   "3. 保留文章中最重要的主題和訊息，並確保這些訊息在摘要中清楚地表達出來。\n" +
							   "4. 使用精煉且直接的語言，以吸引人的方式表達作者將在文章中深入分享這些主題的意圖。\n" +
							   "5. 使用「我」來指稱「作者」，「你」來指稱讀者。\n" +
							   "\n" +
							   "具體來說，你需要確保以下重點訊息被包含其中：\n" +
							   "1. 文章的主要主題或重點討論。\n" +
							   "2. 作者提出的建議、策略或重要觀點。\n" +
							   "3. 這些建議或策略的具體效益或結果。\n" +
							   "\n" +
							   "最後，以吸引並鼓勵讀者進行下一步行動的方式編寫摘要，並表達出文章中更多深入的內容等待讀者去探索。\n" +
							   "請寫出3個版本。\n\n" + editor.getValue();

				navigator.clipboard.writeText(prompt).then(function () {
					new Notice(`Copied prompt for generate summary to clipboard!`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			}
		});
		*/

		this.addObsidianIcon('add-comment-tag-icon', 'CT');
		this.addCommand({
			id: "add-comment-tag",
			name: "CT Add Comment Tag",
			icon: `add-comment-tag-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
			  new AddFootnoteTagModal(this.app, editor).open();
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `z`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `z`,
				},
			]
		});

		this.addObsidianIcon('action-tag-count-icon', 'CA');
		this.addCommand({
			id: "action-tag-count-icon",
			name: "CA Count Action Tag",
			icon: `action-tag-count-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const tags = ["nn", "nl", "nw", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "wn", "wl", "ww", "w1", "w2", "w3", "w4", "w5", "w6", "w7"];
				const matches: string[] = [];
				const lineNum = editor.lineCount();
				for (let i = 0; i < lineNum; i++) {
					const line = editor.getLine(i)
					const match = tags.some(tag => new RegExp(`#${tag} `, "g").test(line) || new RegExp(` #${tag}`, "g").test(line));
					if (match) {
						matches.push(`Line ${i}:\n${line.trim()}`);
					}
				}
				const trimmedAndJoinedString: string = matches.join("\n\n");
				const tasks = matches.length > 0 ? `\nTasks:\n\n${trimmedAndJoinedString}` : ``
				new Notice(`There are ${matches.length} outstanding actions in this notes${tasks}`);
			}
		});

		this.addObsidianIcon('toggle-n-w-task', '#=');
		this.addCommand({
			id: `toggle-n-w-task`,
			name: `Toggle N W Task`,
			icon: `toggle-n-w-task`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				const cursor = editor.getCursor();
				const lineNumber = editor.getCursor().line;
				const line = editor.getLine(lineNumber);
				if (line.match(/ a\/w\/./)) {
					const replacedLine = line.replace(/ a\/w\/(.)/, ` a/n/$1`)
					editor.setLine(lineNumber, replacedLine);
					editor.setCursor(cursor)
				} else if (line.match(/ a\/n\/./)) {
					const replacedLine = line.replace(/ a\/n\/(.)/, ` a/w/$1`)
					editor.setLine(lineNumber, replacedLine);
					editor.setCursor(cursor)
				} else if (line.match(/#w. /)) {
					const replacedLine = line.replace(/#w(.) /, `#n$1 `)
					editor.setLine(lineNumber, replacedLine);
					editor.setCursor(cursor)
				} else if (line.match(/#n. /)) {
					const replacedLine = line.replace(/#n(.) /, `#w$1 `)
					editor.setLine(lineNumber, replacedLine);
					editor.setCursor(cursor)
				} else if (line.match(/ #w./)) {
					const replacedLine = line.replace(/ #w(.)/, ` #n$1`)
					editor.setLine(lineNumber, replacedLine);
					editor.setCursor(cursor)
				} else if (line.match(/ #n./)) {
					const replacedLine = line.replace(/ #n(.)/, ` #w$1`)
					editor.setLine(lineNumber, replacedLine);
					editor.setCursor(cursor)
				}
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `=`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `=`,
				}
			]
		});

		/*
		this.addObsidianIcon('remove-action-icon', '-#');
		this.addCommand({
			id: "remove-action",
			name: "Remove action",
			icon: `remove-action-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor();
				const lineNumber = editor.getCursor().line;
				const line = editor.getLine(lineNumber);
				let replacedLine = line.replace('#nn ', '')
				                         .replace('#nl ', '')
										 .replace('#nw ', '')
										 .replace('#nd ', '')
										 .replace('#na ', '')
										 .replace('#nt ', '')
										 .replace('#n1 ', '')
										 .replace('#n2 ', '')
										 .replace('#n3 ', '')
										 .replace('#n4 ', '')
										 .replace('#n5 ', '')
										 .replace('#n6 ', '')
										 .replace('#n7 ', '')
										 .replace('#wn ', '')
										 .replace('#wl ', '')
										 .replace('#ww ', '')
										 .replace('#wd ', '')
										 .replace('#wa ', '')
										 .replace('#wt ', '')
										 .replace('#w1 ', '')
										 .replace('#w2 ', '')
										 .replace('#w3 ', '')
										 .replace('#w4 ', '')
										 .replace('#w5 ', '')
										 .replace('#w6 ', '')
										 .replace('#w7 ', '')
				replacedLine = AddFootnoteTagModal.removeTag(replacedLine)
				editor.setLine(lineNumber, replacedLine);
				editor.setCursor(cursor);
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `x`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `x`,
				}
			]
		});
		*/

		this.addCommand({
			id: "cursor-go-to-start-of-line",
			name: "Cursor go to start of line",
			icon: `arrow-big-left`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor();
				cursor.ch = 0;
				editor.setCursor(cursor);
			},
		});

		this.addCommand({
			id: "cursor-go-to-end-of-line",
			name: "Cursor go to end of line",
			icon: `arrow-big-right`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor();
				const lineNum = cursor.line;
				const line = editor.getLine(lineNum);
				const length = line.length;
				cursor.ch = length;
				editor.setCursor(cursor);
			},
		});

		this.addObsidianIcon('event-to-fantastical-icon', 'FE');
		this.addCommand({
			id: "add-fantastical-event",
			name: "FE Add Fantastical Event",
			icon: `event-to-fantastical-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let text = "";
				const vault: Vault = this.app.vault;
				const listSelections: EditorSelection[] = editor.listSelections();
			  
				const processLine = async (line: string, i: number) => {
					// to modify line add tm (to move) tag and add to corresponding journal note
				  if (/^- \d\d\d\d-\d\d-\d\d \d\d:\d\d /.test(line)) {
					const modifiedLine = line.replace(/^- /, `- #tm `);
					editor.setLine(i, modifiedLine);
					text += line + "\n";
			  
					const lineToAdd = '-' + line.replace(/-/g, '');
					const path = line.replace(/^- (\d\d\d\d)-(\d\d)-.*/, "J/$1-M$2.md");
			  
					let tFile = vault.getAbstractFileByPath(path);
					if (tFile == null) {
					  tFile = await vault.create(path, lineToAdd);
					} else {
					  const tFileOriginalValue = await vault.read(tFile as TFile);
					  await vault.modify(tFile as TFile, tFileOriginalValue + "\n" + lineToAdd);
					}
				  }
				};
			  
				const processSelections = async () => {
				  for (const listSelection of listSelections) {
					const a = listSelection.head.line;
					const b = listSelection.anchor.line;
					const fromLineNum = b > a ? a : b;
					const toLineNum = b > a ? b : a;
			  
					for (let i = fromLineNum; i <= toLineNum; i++) {
					  const line = editor.getLine(i);
					  await processLine(line, i);
					}
				  }
				};
			  
				processSelections().then(() => {
				  if (text.length !== 0) {
					text = encodeURI(text);
					window.open(`shortcuts://run-shortcut?name=Add%20Obsidian%20Inbox%20Event%20via%20Fantastical&input=text&text=${text}&x-success=obsidian://&x-cancel=obsidian://&x-error=obsidian://`);
				  }
				});
			  },
			  
			
		});

		/*
		this.addCommand({
			id: "remove-first-tab-from-selected-lines",
			name: "Remove first tab from selected lines",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const listSelections = editor.listSelections();
				listSelections.forEach(listSelection => {
					const fromLineNum = listSelection.head.line
					const toLineNum = listSelection.anchor.line
					for (let i = fromLineNum; i <= toLineNum; i++) {
						const line = editor.getLine(i)
						const modifiedLine = line.replace(/\t/, '')
						editor.setLine(i, modifiedLine);
					}
				})
			},
		});
		*/

		this.addCommand({
			id: "grep-title-as-link-to-clipboard",
			name: "Grep Title as link to clipboard",
			icon: `clipboard-list`,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const title = view.file.basename;
				const titleAsLink = `[[${title}]]`;
				try {
					this.addToClipboardHistory(titleAsLink);
					await navigator.clipboard.writeText(titleAsLink);
					new Notice(`Copied title "${title}" as link to clipboard!`);
				} catch (error) {
					new Notice(`Error occurred when copying to clipboard: ${error}`);
				}
			},
			hotkeys: [
				{
					modifiers: [`Meta`, `Shift`],
					key: `l`,
				},
				{
					modifiers: [`Ctrl`, `Shift`],
					key: `l`,
				}
			]
		});

		this.addObsidianIcon('move-current-selection-to-beginning-of-notes', '<<');
		this.addCommand({
			id: "move-current-selection-to-beginning-of-notes",
			name: "MB << Move current selection to beginning of notes",
			icon: `move-current-selection-to-beginning-of-notes`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let selection = exportCurrentSelection(editor)
				if (/^    +- /m.test(selection)
				  || /^- /m.test(selection)
				  || /^# /m.test(selection)
				  || /^` /m.test(selection)
				  || /^> /m.test(selection)
				  || /^\d+\. /m.test(selection)
				  )
				{
				// do nothing
				} else {
					selection = "- " + selection
				}
				let newContent = ''
				const selectionRange: SelectionRange = getCurrentSelectionLineNumber(editor)
				for (let i = 0; i < editor.lineCount(); i++) {
					if (i < selectionRange.fromLineNum || i > selectionRange.toLineNum) {
						newContent = newContent + editor.getLine(i) + "\n"
					}
				}
				
				new AddTextToNotesModal(this.app, selection, "move the selected text", true, () => editor.setValue(newContent.replace(/\n$/m, ""))).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `,`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `,`,
				},
			]
		})

		this.addObsidianIcon('move-current-selection-to-end-of-notes', '>>');
		this.addCommand({
			id: "move-current-selection-to-end-of-notes",
			name: "ME >> Move current selection to beginning of notes",
			icon: `move-current-selection-to-end-of-notes`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let selection = exportCurrentSelection(editor)
				if (/^    +- /m.test(selection)
				  || /^- /m.test(selection)
				  || /^# /m.test(selection)
				  || /^` /m.test(selection)
				  || /^> /m.test(selection)
				  || /^\d+\. /m.test(selection)
				  )
				{
				// do nothing
				} else {
					selection = "- " + selection
				}
				let newContent = ''
				const selectionRange: SelectionRange = getCurrentSelectionLineNumber(editor)
				for (let i = 0; i < editor.lineCount(); i++) {
					if (i < selectionRange.fromLineNum || i > selectionRange.toLineNum) {
						newContent = newContent + editor.getLine(i) + "\n"
					}
				}
				
				new AddTextToNotesModal(this.app, selection, "move the selected text", false, () => editor.setValue(newContent.replace(/\n$/m, ""))).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `.`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `.`,
				},
			]
		})

		this.addObsidianIcon('add-current-selection-to-beginning-of-notes', '((');
		this.addCommand({
			id: "add-current-selection-to-beginning-of-notes",
			name: "SB (( Add current selection to beginning of notes",
			icon: `add-current-selection-to-beginning-of-notes`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let selection = exportCurrentSelection(editor)
				if (/^    +- /m.test(selection)
				  || /^- /m.test(selection)
				  || /^# /m.test(selection)
				  || /^` /m.test(selection)
				  || /^> /m.test(selection)
				  || /^\d+\. /m.test(selection)
				  ) {
					// do nothing
				  } else {
					selection = "- " + selection
				  }
				new AddTextToNotesModal(this.app, selection, "add the selected text", true, () => {}).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `9`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `9`,
				},
			]
		})

		this.addObsidianIcon('add-current-selection-to-end-of-notes', '))');
		this.addCommand({
			id: "add-current-selection-to-end-of-notes",
			name: "SE )) Add current selection to end of notes",
			icon: `add-current-selection-to-end-of-notes`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let selection = exportCurrentSelection(editor)
				if (/^    +- /m.test(selection)
				  || /^- /m.test(selection)
				  || /^# /m.test(selection)
				  || /^` /m.test(selection)
				  || /^> /m.test(selection)
				  || /^\d+\. /m.test(selection)
				  ) {
					// do nothing
				  } else {
					selection = "- " + selection
				  }
				new AddTextToNotesModal(this.app, selection, "add the selected text", false, () => {}).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `0`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `0`,
				},
			]
		})

		this.addObsidianIcon('add-current-link-to-beginning-of-notes', '[[');
		this.addCommand({
			id: "add-current-link-to-beginning-of-notes",
			name: "LB [[ Add current link to beginning of notes",
			icon: `add-current-link-to-beginning-of-notes`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const link = "- [[" + view.file.basename + "]]";
				new AddTextToNotesModal(this.app, link, "add the current note link", true, () => {}).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `[`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `[`,
				},
			]
		})

		this.addObsidianIcon('add-current-link-to-end-of-notes', ']]');
		this.addCommand({
			id: "add-current-link-to-end-of-notes",
			name: "LE ]] Add current link to end-of-notes",
			icon: `add-current-link-to-end-of-notes`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const link = "- [[" + view.file.basename + "]]";
				new AddTextToNotesModal(this.app, link, "add the current note link", false, () => {}).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `]`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `]`,
				},
			]
		})

		this.addCommand({
			id: "quick-navigate-to-notes",
			name: "NN Quick Navigate to Notes",
			icon: `aperture`,
			callback: async () => {
				new NavigateToNoteFromTagModal(this.app).open()
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `;`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `;`,
				},
			]
		})

		this.addObsidianIcon('threads-to-twitter', 'TX');
		this.addCommand({
			id: "threads-to-twitter",
			name: "TT TX Threads to Twitter",
			icon: `threads-to-twitter`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const { vault } = this.app;
				const v = editor.getValue()
				const path = view.file.path
				if (!path.match(/.\/Threads \d\d\d\d\d\d\d\d/)) {
					new Notice(`Will not proceed. It is not a threads post.`);
					return;
				}
				const newPath = path.replace(/(.\/)Threads /, "$1Twitter ")

				const { workspace } = this.app;
				const leaf = workspace.getLeaf(false);
				Promise.resolve()
				.then(() => {
					return vault.adapter.exists(newPath);
				})
				.then((fileExists) => {
					if (fileExists) {
						new Notice(`Will not proceed. Twitter post already exist.`);
						return Promise.reject("Twitter post already exist")
					}
					return vault.create(newPath, v);
				})
				.then((tFile) => {
					return leaf.openFile(tFile, { active : true});
				}, reason => {})
				.then(() => {
					new Notice(`Created and opened Twitter notes!`);
				});
			}
		})

		this.addObsidianIcon('blog-to-clipboard-icon', 'BJ');
		this.addCommand({
			id: "blog-to-clipboard",
			name: "BJ Blog content to clipboard",
			icon: `blog-to-clipboard-icon`,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const v = editor.getValue();
				if (v.includes("#nn") || v.includes("#nl") || v.includes("#nw") || v.includes("#wn") || v.includes("#wl") || v.includes("#ww")) {
					new Notice(`Will not proceed. As there are unfinished action tag.`);
					return;
				}
				if (!v.includes("<!--more-->")) {
					try {
						await navigator.clipboard.writeText("<!--more-->");
						new Notice(`Require "<!--more-->" as excerpt separator before posting.\n"<!--more-->" already in clipboard`);
					} catch (error) {
						new Notice(`Require "<!--more-->" as excerpt separator before posting.\n"<!--more-->" cannot be copied to clipboard`);
					}
					return;
				}

				const path = view.file.path;
				let line = editor.lineCount();
				let text = "";
				let numLineFirstContent = 0;
				let frontMatterLineCount = 0;
				for (let i = 0; i < line; i++) {
					if (frontMatterLineCount == 2) {
						numLineFirstContent = i;
						break;
					}
					if (editor.getLine(i) == "---") {
						frontMatterLineCount++;
					}
				}
				for (let i = 0; i < line; i++) {
					if (editor.getLine(numLineFirstContent).trim() == "") {
						numLineFirstContent++;
					} else {
						break;
					}
				}

				Array.from(Array(line - numLineFirstContent).keys()).forEach(i => {
					const line = editor.getLine(i + numLineFirstContent);
					text = text + line + "\n";
				});
				text = text.replace(/\n---\n\n#nd generate summary for meta description below:\n[^\n]*\n([^\n]*)\n[^\n]*\n---\n/, "\n<!-- Meta Summary -->\n<!--\n$1\n-->\n");
				text = text.replace(/## References\:([\n]*.*)*$/, "");

				const app = this.app;
				const beforeTagCBR = "c/b/r";
				const beforeTagCBD = "c/b/d";
				const beforeTagCBI = "c/b/i";
				const afterTag = "c/b/p";

				try {
					await navigator.clipboard.writeText(text);
					new Notice(`Copied blog content to clipboard!`);
					const foundTagFromCBR = await renameTag(view.file, beforeTagCBR, afterTag);
					if (foundTagFromCBR) {
						new Notice(`Update notes type from tag="${beforeTagCBR}" to tag="${afterTag}!`);
					}
					const foundTagFromCBI = await renameTag(view.file, beforeTagCBI, afterTag);
					if (foundTagFromCBI) {
						new Notice(`Update notes type from tag="${foundTagFromCBI}" to tag="${afterTag}!`);
					}
					const foundTagFromCBD = await renameTag(view.file, beforeTagCBD, afterTag);
					if (foundTagFromCBD) {
						new Notice(`Update notes type from tag="${beforeTagCBD}" to tag="${afterTag}!`);
					}
					await renameBlogTitle(app, path, view);
					window.open(`shortcuts://run-shortcut?name=Jekyll%20blog&x-cancel=obsidian://&x-error=obsidian://`);
				} catch (error) {
					new Notice(`Error occurred during the operation: ${error}`);
				}
			},
		});

		this.addObsidianIcon('generate-chatgpt-prompt', 'GP');
		this.addCommand({
			id: "generate-chatgpt-prompt",
			name: "GP Generate ChatGPT Prompt",
			icon: `generate-chatgpt-prompt`,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				let line = editor.lineCount();

				let text = "【" + view.file.basename + "】\n\n";
				let numLineFirstContent = 0
				let frontMatterLineCount = 0
				for (let i = 0; i < line; i++) {
					if (frontMatterLineCount == 2) {
						numLineFirstContent = i;
						break;
					}
					if (editor.getLine(i) == "---") {
						frontMatterLineCount++
					}
				}
				for (let i = 0; i < line; i++) {
					if (editor.getLine(numLineFirstContent).trim() == "") {
						numLineFirstContent++;
					} else {
						break;
					}
				}

				Array.from(Array(line - numLineFirstContent).keys()).forEach(i => {
					const line = editor.getLine(i + numLineFirstContent);
					if (!line.startsWith("%%") && !line.endsWith("%%")) {
						text = text + line + "\n"
					}
				});
				
				text = text.replace(/## References\:([\n]*.*)*$/, "")
				
				navigator.clipboard.writeText(text).then(function () {
					new Notice(`Copied content to clipboard for generating prompt!`);
					window.open(`shortcuts://run-shortcut?name=Generate%20ChatGPT%20Prompt&x-success=obsidian://&x-cancel=obsidian://&x-error=obsidian://`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			},
		});

		this.addObsidianIcon('threads-to-clipboard-icon', 'TC');
		this.addCommand({
			id: "threads-to-clipboard",
			name: "TC Threads content to clipboard",
			icon: `threads-to-clipboard-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const value = editor.getValue()
				//if (!value.contains("%% #tm to zk %%") && !value.contains("%% #nd to zk %%")) {
				//	this.addTaskToPutIntoCardInThreadsContent(editor)
				//}
				const text = this.convertThreadsContentToFormatForThreadsApp(editor)
				const beforeTag = "c/t/r"
				const afterTag = "c/t/t"
			
				navigator.clipboard.writeText(text)
				.then(function () {
					return renameTag(view.file, beforeTag, afterTag)
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				})
				.then((foundTag) => {
					if (foundTag) {
						new Notice(`Update notes type from tag="${beforeTag}" to tag="${afterTag}!\nCopied thread content to clipboard!`);
					} else {
						new Notice(`Tag "${beforeTag}" not found\nCopied thread content to clipboard!`);
					}
				});
			},
		});

		this.addObsidianIcon('twitter-to-chatgpt', 'XG');
		this.addCommand({
			id: "twitter-to-chatgpt",
			name: "XG Twitter to ChatGPT",
			icon: `twitter-to-chatgpt`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const value = editor.getValue()

				if (!view.file.basename.contains("Twitter")) {
					new Notice("Note name not contains 'Twitter', did not copy from thread note?")
					return;
				}
				
				let content = this.convertThreadsContentToPOE(editor)
				let numTweet = Math.ceil(content.length / 110)
				let prompt = `You are a social media content copywriter. Convert the following content to twitter threads less than ${numTweet} tweet in traditional Chinese. Preserve the title. Merge title with the first tweet while add 2 newline characters between title and first tweet. Every tweet has to over 100 but less than 140 Chinese characters. Do not simplify the content. Do not add any additional information which is not mentioned from the original content. Preserve the example from the content. No need to add any tags to the tweet. Do not have any number in each tweet. Each tweet separated by 2 newline and 3 "-" characters and another newline. Add a space character between each English character and Chinese character. If the original content contains any URL, preserve the URL in the tweet without using any Markdown format for the URL while add 2 newline character before the URL.`
				//let prompt = `Convert the following content to twitter threads less than ${numTweet} tweet in traditional Chinese. Preserve the title. Do not add any additional information which is not mentioned from the original content. No need to add any tags to the tweet. Do not have any number in each tweet. Each tweet separated by newline character and 3 "-" characters and another newline character.`
				prompt = prompt + "\n\n" + content
				prompt = prompt.replace(/▍/g, "")
				prompt = prompt.replace(/】\n+https\:\/\/github.com[^\n]+\n/m, "】\n")
				prompt = prompt.replace(/\*\*/gm, "")
				//prompt = prompt.replace(/!\[\S*\]\(((https:|http:|www\.)\S*)\)/gm, "$1")

				navigator.clipboard.writeText(prompt).then(function () {

					let line = editor.lineCount();

					let numLineFirstContent = 0
					let frontMatterLineCount = 0
					for (let i = 0; i < line; i++) {
						if (frontMatterLineCount == 2) {
							numLineFirstContent = i;
							break;
						}
						if (editor.getLine(i) == "---") {
							frontMatterLineCount++
						}
					}
					for (let i = 0; i < line; i++) {
						if (editor.getLine(numLineFirstContent).trim() == "") {
							numLineFirstContent++;
						} else {
							break;
						}
					}

					let text = "";
					Array.from(Array(numLineFirstContent).keys()).forEach(i => {
						const line = editor.getLine(i);
						text = text + line + "\n"
					})
					editor.setValue(text)

					renameTag(view.file, "c/t/d", "c/x/d")
					renameTag(view.file, "c/t/r", "c/x/d")
					renameTag(view.file, "c/t/t", "c/x/d")
					renameTag(view.file, "c/t/p", "c/x/d")

					const cursor = editor.getCursor()
					cursor.line = editor.lineCount() - 1
					cursor.ch = 0
					editor.setCursor(cursor)

					new Notice("copied to clipboard, please open chatgpt to paste")
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			},
		});

		this.addObsidianIcon('chatgpt-to-twitter', 'GX');
		this.addCommand({
			id: "chatgpt-to-twitter",
			name: "GX ChatGPT to Twitter",
			icon: `chatgpt-to-twitter`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				if (!editor.getValue().contains("c/x/d")) {
					new Notice("Note type not c/x/d, do the action in wrong note?")
					return
				}
				const isSuccess = this.convertChatGPTToTwitterFormat(editor)
				if (isSuccess)
				{
					renameTag(view.file, "c/x/d", "c/x/r")
				}
			},
		});

		this.addObsidianIcon('reverse-twitter-number-icon', 'RT');
		this.addCommand({
			id: "reverse-twitter-numbering",
			name: "RT Reverse Twitter Numbering",
			icon: `reverse-twitter-number-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				if (!editor.getValue().contains("c/x/r") && !editor.getValue().contains("c/x/p")) {
					new Notice("Note type not c/x/r nor c/x/p, do the action in wrong note?")
					return
				}
				this.reverseTwitterNumbering(editor)
				renameTag(view.file, "c/x/p", "c/x/d")
				renameTag(view.file, "c/x/r", "c/x/d")
			},
		});

		this.addObsidianIcon('threads-as-facebook-post-to-clipboard-icon', 'FC');
		this.addCommand({
			id: "threads-as-facebook-post-to-clipboard",
			name: "FC Threads as Facebook post format to Clipboard",
			icon: `threads-as-facebook-post-to-clipboard-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const value = editor.getValue()
				//if (!value.contains("%% #nm to zk %%") && !value.contains("%% #nd to zk %%")) {
				//	this.addTaskToPutIntoCardInThreadsContent(editor)
				//}
				const text = this.convertThreadsContentToFormatForFacebookApp(editor)
			
				const beforeTag = "c/t/t"
				const afterTag = "c/t/p"
			
				navigator.clipboard.writeText(text)
				.then(function () {
					return renameTag(view.file, beforeTag, afterTag)
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				})
				.then((foundTag) => {
					if (foundTag) {
						new Notice(`Update notes type from tag="${beforeTag}" to tag="${afterTag}!\nCopied fb content to clipboard!`);
					} else {
						new Notice(`Tag "${beforeTag}" not found\nCopied fb content to clipboard!`);
					}
				});
			},
		});

		this.addObsidianIcon('threads-block-to-image', 'TI');
		this.addCommand({
			id: "threads-block-to-image",
			name: "TI Threads segment to image",
			icon: `threads-block-to-image`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const threadSegment = this.getThreadSegment(editor)
				new ThreadsToImagesModal(this.app, threadSegment).open()
			},
		});

		this.addObsidianIcon('chatgpt-generate-image', 'GI');
		this.addCommand({
			id: "chatgpt-generate-image",
			name: "GI ChatGPT image",
			icon: `chatgpt-generate-image`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				window.open('shortcuts://run-shortcut?name=ChatGPT%20Generate%20Image&x-success=obsidian://&x-cancel=obsidian://&x-error=obsidian://');
			},
		});

		/*
		this.addObsidianIcon('threads-segment-to-clipboard', 'SC');
		this.addCommand({
			id: "threads-segment-to-clipboard",
			name: "Threads segment to clipboard",
			icon: `threads-segment-to-clipboard`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const threadSegment = this.getThreadSegment(editor)
				const beforeTag = "c/x/r"
				const afterTag = "c/x/p"
				navigator.clipboard.writeText(threadSegment)
				.then(function () {	
					return renameTag(view.file, beforeTag, afterTag)
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				})
				.then((foundTag) => {
					if (foundTag) {
						new Notice(`Update notes type from tag="${beforeTag}" to tag="${afterTag}!\nCopied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
					} else {
						new Notice(`Tag "${beforeTag}" not found\nCopied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
					}
				});
			},
		});
		*/

		this.addObsidianIcon('twitter-segment-to-clipboard', 'XC');
		this.addCommand({
			id: "twitter-segment-to-clipboard",
			name: "XC Twitter segment to clipboard",
			icon: `twitter-segment-to-clipboard`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const threadSegment = this.getTwitterSegment(editor)
				const beforeTag = "c/x/r"
				const afterTag = "c/x/p"
				navigator.clipboard.writeText(threadSegment)
				.then(function () {
					return renameTag(view.file, beforeTag, afterTag)
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				})
				.then(foundTag => {
					if (foundTag) {
						new Notice(`Update notes type from tag="${beforeTag}" to tag="${afterTag}!\nCopied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
					} else {
						new Notice(`Tag "${beforeTag}" not found\nCopied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
					}
				});
			},
		});

		this.addObsidianIcon('segment-to-clipboard', 'SC');
		this.addCommand({
			id: "segment-to-clipboard",
			name: "SC Segment to clipboard",
			icon: `segment-to-clipboard`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const threadSegment = this.getSegment(editor)
				this.addToClipboardHistory(threadSegment)
				navigator.clipboard.writeText(threadSegment)
				.then(function () {
					new Notice(`Copied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				})
			},
		});

		/*
		this.addObsidianIcon('n-previous-tab', 'T<');
		this.addCommand({
			id: "n-previous-tab",
			name: "Previous tab",
			icon: `n-previous-tab`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				//console.log(this.app.commands.commands)
				this.app.commands.executeCommandById("workspace:previous-tab")
			},
		});

		this.addObsidianIcon('n-next-tab', 'T>');
		this.addCommand({
			id: "n-next-tab",
			name: "Next tab",
			icon: `n-next-tab`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				//console.log(this.app.commands.commands)
				this.app.commands.executeCommandById("workspace:next-tab")
			},
		});
		*/

		this.addCommand({
			id: "toggle-bullet-number-list",
			name: "Toggle Bullet Number List",
			icon: `bullet-list`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor()
				const ch = cursor.ch
				const line = cursor.line
				const lineContent = editor.getLine(line)
				const previousLineContent = line == 0 ? "" : editor.getLine(line - 1)

				if (/^(> )*\s*- /.test(lineContent)) { // bullet list case
					// toggle to number list
					let n = "1."
					const a = previousLineContent.match(/^\t*(\d+)\. /)
					if (a) {
						const nextN = parseInt(a[0]) + 1
						n = nextN.toString() + "."
					}
					const replacedLineContent = lineContent.replace(/^((> )*)(\s*)- /, "$1$3" + n + " ")
					editor.setLine(line, replacedLineContent)
					cursor.ch = cursor.ch + n.length - 1
					editor.setCursor(cursor)
				} else if (/^(> )*\s*[\d]+\. /.test(lineContent)) { // number list case
					// toggle to non list
					const n = lineContent.replace(/^((> )*)(\s*)([\d]+\. ).*/, "$4")
					const replacedLineContent = lineContent.replace(/^((> )*)(\s*)[\d]+\. /, "$1$3")
					editor.setLine(line, replacedLineContent)
					cursor.ch = (cursor.ch - n.length) > 0 ? (cursor.ch - n.length) : 0
					editor.setCursor(cursor)
				} else { // no list
					// toggle to bullet list
					const replacedLineContent = lineContent.replace(/^((> )*)(\s*)/, "$1$3- ")
					editor.setLine(line, replacedLineContent)
					cursor.ch = cursor.ch + 2
					editor.setCursor(cursor)
				}
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `-`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `-`,
				},
			]
		});

		this.addCommand({
			id: 'copy-or-move-to-new-note',
			name: 'Copy or Move to new note CMN',
			icon: `airplay`,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				new CopyOrMoveToNewNoteModal(this.app, editor).open();
			}
		});

		this.addCommand({
			id: "editor-copy-line-to-clipboard",
			name: "Editor Copy Line to Clipboard",
			icon: `align-vertical-space-around`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = exportCurrentSelection(editor);
				const copyContent = selection.contains("\n")
									? selection
									: selection.replace(/^\t*- /, '').replace(/^\t*\d+\. /, '')
				this.addToClipboardHistory(copyContent);
				navigator.clipboard.writeText(copyContent).then(function () {
					new Notice(`Copied content\n\`\`\`\n${copyContent}\n\`\`\`\nto clipboard!`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: "/",
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: "/",
				},
			]
		})

		this.addCommand({
			id: "editor-cut-line-to-clipboard",
			name: "Editor Cut Line to Clipboard",
			icon: `align-vertical-justify-center`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = exportCurrentSelection(editor);
				const cursor = editor.getCursor()
				const copyContent = selection.contains("\n")
									? selection
									: selection.replace(/^\t*- /, '').replace(/^\t*\d+\. /, '')
				let newContent = ''
				const selectionRange: SelectionRange = getCurrentSelectionLineNumber(editor)
				for (let i = 0; i < editor.lineCount(); i++) {
					if (i < selectionRange.fromLineNum || i > selectionRange.toLineNum) {
						newContent = newContent + editor.getLine(i) + "\n"
					}
				}
				this.addToClipboardHistory(copyContent);
				navigator.clipboard.writeText(copyContent).then(function () {
					new Notice(`Copied content\n\`\`\`\n${copyContent}\n\`\`\`\nto clipboard!`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
				editor.setValue(newContent)
				cursor.line = selectionRange.fromLineNum
				if (editor.getLine(selectionRange.fromLineNum).length < selectionRange.fromCh) {
					cursor.ch = editor.getLine(selectionRange.fromLineNum).length
				}
				editor.setCursor(cursor)
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: "\\",
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: "\\",
				},
			]
		})

		this.addCommand({
			id: "editor-indent-line",
			name: "Editor Indent Selection",
			icon: `right-arrow-with-tail`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const listSelections : EditorSelection[] = editor.listSelections()
				listSelections.forEach(listSelection => {
					const a = listSelection.head.line
					const b = listSelection.anchor.line
					const fromLineNum = b > a ? a : b
					const toLineNum = b > a ? b : a
					for (let i = fromLineNum; i <= toLineNum; i++) {
						const line = editor.getLine(i)
						editor.setLine(i, line.replace(/^/, "\t"))
					}
				})
				let lss : EditorSelection[] = []
				listSelections.forEach(ls => {
					const head = ls.head
					head.ch = head.ch + 1
					const anchor = ls.anchor
					anchor.ch = anchor.ch + 1
					const newLs: EditorSelection = {anchor, head}
					lss.push(newLs)
				})
				editor.setSelections(lss)
			}
		})

		this.addCommand({
			id: "editor-outdent-line",
			name: "Editor Outdent Selection",
			icon: `left-arrow-with-tail`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const listSelections : EditorSelection[] = editor.listSelections()
				listSelections.forEach(listSelection => {
					const a = listSelection.head.line
					const b = listSelection.anchor.line
					const fromLineNum = b > a ? a : b
					const toLineNum = b > a ? b : a
					for (let i = fromLineNum; i <= toLineNum; i++) {
						const line = editor.getLine(i)
						editor.setLine(i, line.replace(/^\t/, ""))
					}
				})
				let lss : EditorSelection[] = []
				listSelections.forEach(ls => {
					const head = ls.head
					head.ch = head.ch + 1
					const anchor = ls.anchor
					anchor.ch = anchor.ch + 1
					const newLs: EditorSelection = {anchor, head}
					lss.push(newLs)
				})
				editor.setSelections(lss)
			}
		})


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	convertChatGPTToTwitterFormat(editor: Editor) : boolean { // true means success
		let line = editor.lineCount();

		let numLineFirstContent = 0
		let frontMatterLineCount = 0
		for (let i = 0; i < line; i++) {
			if (frontMatterLineCount == 2) {
				numLineFirstContent = i;
				break;
			}
			if (editor.getLine(i) == "---") {
				frontMatterLineCount++
			}
		}
		for (let i = 0; i < line; i++) {
			if (editor.getLine(numLineFirstContent).trim() == "") {
				numLineFirstContent++;
			} else {
				break;
			}
		}

		let totalTweetCount = 1

		Array.from(Array(line - numLineFirstContent).keys()).forEach(i => {
			const line = editor.getLine(i + numLineFirstContent);
			let modifiedLine = line.replace(/^____+/, "---").replace(/^----+/, "---")
			editor.setLine(i + numLineFirstContent, modifiedLine)
			if (modifiedLine == "---") {
				totalTweetCount = totalTweetCount + 1
			}
		});

		let numTweet = 1
		let readyToAddTweetCount = true

		let text = "";
		Array.from(Array(numLineFirstContent).keys()).forEach(i => {
			const line = editor.getLine(i);
			text = text + line + "\n"
		})

		Array.from(Array(line - numLineFirstContent).keys()).forEach(i => {
			const line = editor.getLine(i + numLineFirstContent);
			let modifiedLine = line;
			if (line == "---") {
				readyToAddTweetCount = true
				numTweet = numTweet + 1
			} else if (line != "" && readyToAddTweetCount) {
				if (!/^\d+\/\d+.*/.test(line)) {
					modifiedLine = `${numTweet}/${totalTweetCount} ${line}`
				}
				readyToAddTweetCount = false
			}
			text = text + modifiedLine + "\n"
		});

		text = text.replace("▍", "")

		// should I add check segment?
		const tweets = text.split("---")
		for (let i = 0; i < tweets.length; i++)
		{
			const tweet = tweets[i].replace(/(https:|http:|www\.)\S*/gm, "").replace(/^\n+/m, "").replace(/\n+$/m, "")
			if (tweet.length > 140)
			{
				new Notice("```\n" + tweet + "\n```\n\nexceed 140 characters. Probably cannot post in twitter. Please refine the tweet. Aborting")
				return false;
			}
		}

		editor.setValue(text)
		const cursor = editor.getCursor()
		cursor.line = editor.lineCount() - 1
		editor.setCursor(cursor)
		return true
	}

	reverseTwitterNumbering(editor: Editor) {
		let line = editor.lineCount();

		let numLineFirstContent = 0
		let frontMatterLineCount = 0
		for (let i = 0; i < line; i++) {
			if (frontMatterLineCount == 2) {
				numLineFirstContent = i;
				break;
			}
			if (editor.getLine(i) == "---") {
				frontMatterLineCount++
			}
		}
		for (let i = 0; i < line; i++) {
			if (editor.getLine(numLineFirstContent).trim() == "") {
				numLineFirstContent++;
			} else {
				break;
			}
		}

		let text = "";
		Array.from(Array(numLineFirstContent).keys()).forEach(i => {
			const line = editor.getLine(i);
			text = text + line + "\n"
		})

		Array.from(Array(line - numLineFirstContent).keys()).forEach(i => {
			const line = editor.getLine(i + numLineFirstContent);
			const modifiedLine = line.replace(/^\d+\/\d+ /, "")
			text = text + modifiedLine + "\n"
		});

		editor.setValue(text)
		const cursor = editor.getCursor()
		cursor.line = editor.lineCount() - 1
		editor.setCursor(cursor)
	}


	convertThreadsContentToFormatForThreadsApp(editor: Editor) : string {
		return this.convertThreadsContentToLightPostFormat(editor, "🧵", "\n\n\n")
	}

	convertThreadsContentToFormatForFacebookApp(editor: Editor) : string {
		return this.convertThreadsContentToLightPostFormat(editor, "", "\n\nᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳ\n\n", (a) => a.replace("👇", ""))
	}

	convertThreadsContentToPOE(editor: Editor) : string {
		return this.convertThreadsContentToLightPostFormat(editor, "", "\n\n---\n\n", (a) => a.replace("👇", ""))
	}

/*
	addTaskToPutIntoCardInThreadsContent(editor: Editor) {
		let line = editor.lineCount();

		let frontMatterLineCount = 0
		let text = "";
		for (let i = 0; i < line; i++) {
			if (editor.getLine(i) == "---") {
				frontMatterLineCount++
			}
			const line = editor.getLine(i);
			
			//if (frontMatterLineCount > 2 && line == "---") {
			//	text = text + "%% #nm to zk %%\n\n"
			//}
			text = text + line + "\n"
		}

		editor.setValue(text);
	}
*/

	convertThreadsContentToLightPostFormat(editor: Editor, headerIcon: string, paragraphSeparator: string
		, additionReplaceFn: (a: string) => string = (a) => a) : string {
		let line = editor.lineCount();

		let numLineFirstContent = 0
		let frontMatterLineCount = 0
		for (let i = 0; i < line; i++) {
			if (frontMatterLineCount == 2) {
				numLineFirstContent = i;
				break;
			}
			if (editor.getLine(i) == "---") {
				frontMatterLineCount++
			}
		}
		for (let i = 0; i < line; i++) {
			if (editor.getLine(numLineFirstContent).trim() == "") {
				numLineFirstContent++;
			} else {
				break;
			}
		}

		let text = "";
		let newConsecutiveLineCount = 0;
		Array.from(Array(line - numLineFirstContent).keys()).forEach(i => {
			const line = editor.getLine(i + numLineFirstContent);
			if (!line.trim().startsWith("%%") || !line.trim().endsWith("%%")) {
				if (line == "---") {
					newConsecutiveLineCount = 0;
				}
				if (line == "") {
					newConsecutiveLineCount++;
				} else {
					newConsecutiveLineCount = 0;
				}
				if (line == "" && newConsecutiveLineCount > 1) {
					// do nothing
				} else {
					let modifiedLine = line == "---" ? "" : line
					modifiedLine = modifiedLine.replace(/^		- /g, "　　　　• ").replace(/^	- /g, "　　• ").replace(/^- /, "• ");
					modifiedLine = modifiedLine.replace(/^\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
											.replace(/[^!]\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
					modifiedLine = modifiedLine.replace(/!\[([^\[\]\(\)]+)\]\(([^\[\]\(\)]+)\)/g, "$2")
					modifiedLine = modifiedLine.replace(/\*\*/gm, "")
					text = text + modifiedLine + "\n"
				}
			}
		});
		
		text = text.replace(/🧵[ ]+(.*)/g, headerIcon + "【$1】")
		text = additionReplaceFn(text)
		// text = text.replace(/^		- /g, "　　• ").replace(/^	- /g, "　• ").replace(/^- /, "• ");
		//text = text.replace(/[\n\r]{3,}([^\n\r]+。[\n\r])/gm, `${paragraphSeparator}$1`);
		//text = text.replace(/[\n\r]{3,}([^\n\r]+：[\n\r])/gm, `${paragraphSeparator}$1`);
		//text = text.replace(/[\n\r]{3,}(http[^\n\r]+[\n\r])/gm, `${paragraphSeparator}$1`);
		text = text.replace(/[\n\r]{3,}/gm, `${paragraphSeparator}▍`);

		text = text.replace("\nᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳ\n\n▍\n", "") // remove empty line

		let text2 = ""

		text.split("\n").forEach(line => {
			var l = ""

			if (line.endsWith("。") || line.endsWith("：") || line.endsWith("～") || line.endsWith("！") || line.startsWith("▍http") || line.startsWith("▍#") || line == "▍") {
				l = line.replace(/^▍/gm, "")
			} else {
				l = line
			}
			text2 = text2 + l + "\n"
		})

		text2 = text2.replace("\n\n\n\n", "") // remove empty line
		text2 = text2.replace("\nᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳᅳ\n\n\n", "") // remove empty line
		text2 = text2.replace(/\n\n## Opinion from ChatGPT\:([\n]*.*)*$/, "")
		text2 = text2.replace(/## References\:([\n]*.*)*$/, "");
		text2 = text2.replace(/\n+$/, "")

		return text2
	}

	getThreadSegment(editor: Editor) : string {
		let cursor = editor.getCursor();
		let line = cursor.line;
		let above = line;
		let below = line;
		// first get above
		
		while (above >= 0) {
			let l = editor.getLine(above);
			if (l == '---') {
				break;
			}
			above--;
		}
		if (editor.getLine(above) == '---') {
			above++;
		}
		while(true) {
			if (editor.getLine(above) == '') {
				above++;
			} else {
				break;
			}
		}

		// then get below
		while (below < editor.lineCount()) {
			let l = editor.getLine(below);
			if (l == '---') {
				break;
			}
			below++;
		}
		if (editor.getLine(below) == '---') {
			below--;
		}

		while(true) {
			if (editor.getLine(below) == '') {
				below--;
			} else {
				break;
			}
		}

		// then put them to line

		let text = "";
		Array.from(Array(below - above + 1).keys()).forEach(i => {
			const line = editor.getLine(i + above)
			if (!line.trim().startsWith("%%") || !line.trim().endsWith("%%")) {
				let modifiedLine = editor.getLine(i + above)
				modifiedLine = modifiedLine.replace(/^\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
										   .replace(/[^!]\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
				text = text + modifiedLine + "\n"
			}
		})
		text = text.replace(/\n+$/, "")
		return text
	}

	getSegment(editor: Editor) : string {
		let cursor = editor.getCursor();
		let line = cursor.line;
		let above = line;
		let below = line;
		// first get above
		
		while (above >= 0) {
			let l = editor.getLine(above);
			if (l == '---') {
				break;
			}
			above--;
		}
		if (editor.getLine(above) == '---') {
			above++;
		}
		while(true) {
			if (editor.getLine(above) == '') {
				above++;
			} else {
				break;
			}
		}

		// then get below
		while (below < editor.lineCount()) {
			let l = editor.getLine(below);
			if (l == '---') {
				break;
			}
			below++;
		}
		if (editor.getLine(below) == '---') {
			below--;
		}

		while(true) {
			if (editor.getLine(below) == '') {
				below--;
			} else {
				break;
			}
		}

		// then put them to line

		let text = "";
		Array.from(Array(below - above + 1).keys()).forEach(i => {
			const line = editor.getLine(i + above)
			text = text + line + "\n"
		})
		text = text.replace(/\n+$/, "")
		return text
	}

	getTwitterSegment(editor: Editor) : string {
		let cursor = editor.getCursor();
		let line = cursor.line;
		let above = line;
		let below = line;
		// first get above
		
		while (above >= 0) {
			let l = editor.getLine(above);
			if (l == '---') {
				break;
			}
			above--;
		}
		if (editor.getLine(above) == '---') {
			above++;
		}
		while(true) {
			if (editor.getLine(above) == '') {
				above++;
			} else {
				break;
			}
		}

		// then get below
		while (below < editor.lineCount()) {
			let l = editor.getLine(below);
			if (l == '---') {
				break;
			}
			below++;
		}
		if (editor.getLine(below) == '---') {
			below--;
		}

		while(true) {
			if (editor.getLine(below) == '') {
				below--;
			} else {
				break;
			}
		}

		// then put them to line

		let text = "";
		Array.from(Array(below - above + 1).keys()).forEach(i => {
			const line = editor.getLine(i + above)
			if (!line.trim().startsWith("%%") || !line.trim().endsWith("%%")) {
				let modifiedLine = editor.getLine(i + above)
				if (!/\d+\/\d+ *【.*】/.test(modifiedLine)) {
					modifiedLine = modifiedLine.replace(/^\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
											.replace(/[^!]\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
											.replace(/https[^\n]+\.jpeg/g, "")
											.replace(/？([^】」\n])/g, "？\n\n$1")
											.replace(/。([^】」\n])/g, "。\n\n$1")
											.replace(/！([^】」\n])/g, "！\n\n$1")
											.replace(/～([^】」\n])/g, "～\n\n$1")
											.replace(/^\s+$/, "")
				}
				text = text + modifiedLine + "\n"
			}
		})
		text = text.replace(/\n+$/, "")
		return text
	}

	async add3DaysActionNoteContent(vault: Vault) {
		const scheduleNoteWithoutMd = "D/Query Schedule and Actions next 3 days"
		const scheduleNote = `${scheduleNoteWithoutMd}.md`				
		if (vault.getAbstractFileByPath(scheduleNote) == null) {
			await vault.create(scheduleNote, "");
		}
		let noteContent = '[[Query Schedule and Actions next 3 days]]\n'
		const excludeNotes = [scheduleNoteWithoutMd, "D/Scheduling"];
		Array.from(Array(3).keys()).forEach(i => noteContent += this.getQueryDateAndActionString(i, excludeNotes));
		const otherDays = this.getQueryActionsThisWeek(3);
		noteContent = noteContent + `## nn / wn\n\`\`\`query\ntag:#nn OR tag:#wn${otherDays}\n\`\`\`\n\n## tt\n\`\`\`query\ntag:#tt\n\`\`\`\n\n`
		noteContent = noteContent + this.getQueryFutureDaysThisWeek("Future Dates", 3, 6, excludeNotes)
		noteContent = noteContent + this.getQueryNext2MonthString(excludeNotes)
		noteContent = noteContent + this.getQueryFutureDaysThisWeek("Past Dates", -7, -1, excludeNotes)
		// noteContent = noteContent + `\n\n[[Query Schedule and Actions next 3 days]]`
		vault.modify(vault.getAbstractFileByPath(scheduleNote) as TFile, noteContent);
	}

	async addActionNoteContent(vault: Vault, folderName: String, noteTitleWithoutMd: String, scheduleNoteTitleWithoutMd: String, nOrW: String) {
		const nowActionNoteWithoutMd = `${folderName}/${noteTitleWithoutMd}`
		const nowActionNote = `${nowActionNoteWithoutMd}.md`				
		if (vault.getAbstractFileByPath(nowActionNote) == null) {
			await vault.create(nowActionNote, "");
		}
		let nowActionNoteContent = ''
		Array.from(Array(2).keys()).forEach(i => nowActionNoteContent += this.getQueryActionString(i, nOrW));
		nowActionNoteContent += `\`\`\`query\ntag:#${nOrW}t\n\`\`\`\n`
		nowActionNoteContent += `\`\`\`query\n`
		Array.from(Array(5).keys()).forEach(i => nowActionNoteContent += this.getQueryWeekDay(i + 2, nOrW));
		nowActionNoteContent += `tag:#${nOrW}n\n\`\`\`\n`
		nowActionNoteContent += `Scheduling: [[${scheduleNoteTitleWithoutMd}]]\n`
		nowActionNoteContent += `[[${noteTitleWithoutMd}]]\n`

		vault.modify(vault.getAbstractFileByPath(nowActionNote) as TFile, nowActionNoteContent);
	}

	getQueryDateAndActionString(addDay: number, excludeNotes: String[]): string {
		const dateMoment = moment().add(addDay, 'd');
		const dateYYYYMMDD = dateMoment.format('YYYYMMDD');
		const dateEachYYDD = '\\d\\d\\d\\d' + dateMoment.format('MMDD');
		const dateEachDD = '\\d\\d\\d\\d\\d\\d' + dateMoment.format('DD');
		const dayOfWeek = dateMoment.format('E');
		const dayOfWeekLong = dateMoment.format('ddd');
		const excludeNoteStr = excludeNotes.map(excludeNote => `-path:"${excludeNote}" `).join("")
		return `## ${dateYYYYMMDD} ${dayOfWeekLong}\n\`\`\`query\n(" ${dateYYYYMMDD}" OR "${dateYYYYMMDD} " OR ${dateEachYYDD} OR ${dateEachDD} OR tag:#n${dayOfWeek} OR tag:#w${dayOfWeek}) ${excludeNoteStr}-block:(query)\n\`\`\`\n\n`
	}

	getQueryActionsThisWeek(excludeNumDays: Number): string {
		let excludes : number[] = []
		let includes : number[] = [1, 2, 3, 4, 5, 6, 7]
		
		Array.from(Array(excludeNumDays).keys()).forEach(i => {
			const dateMoment = moment().add(i, 'd');
			const dayOfWeek = parseInt(dateMoment.format('E'));
			excludes.push(dayOfWeek)
		})
		let aaa = includes.filter(i => {
			for (const e of excludes)
			{
				if (e == i)
				{
					return false
				}
			}
			return true
		})
		let output = ""
		aaa.forEach(i => output += ` OR tag:#n${i} OR tag:#w${i}`)
		return output
	}

	getQueryFutureDaysThisWeek(header: String, from: number, to: number, excludeNotes: String[]): string {
		let includes = []
		for (let i = from; i <= to; i++) {
			let dateMoment = moment().add(i, 'd');
			includes.push(dateMoment)
		}
		let output = `## ${header}\n\`\`\`query\n(`
		includes.forEach(i => {
			const dateYYYYMMDD = i.format('YYYYMMDD');
			const dateEachYYDD = '\\d\\d\\d\\d' + i.format('MMDD');
			const dateEachDD = '\\d\\d\\d\\d\\d\\d' + i.format('DD');
			output += `" ${dateYYYYMMDD}" OR "${dateYYYYMMDD} " OR ${dateEachYYDD} OR ${dateEachDD} OR `
		})
		output = output.replace(/ OR $/, "")
		output += ")"
		const excludeNoteStr = excludeNotes.map(excludeNote => `-path:"${excludeNote}" `).join("")
		output += ` ${excludeNoteStr}-block:(query)`
		output += `\n\`\`\`\n\n`
		return output
	}

	getQueryNext2MonthString(excludeNotes: String[]): string {
		const currentMonthYYYYMM = moment().format('YYYYMM');
		const dateMoment = moment().add(1, 'M');
		const nextMonthYYYYMM = dateMoment.format('YYYYMM');
		const excludeNoteStr = excludeNotes.map(excludeNote => `-path:"${excludeNote}" `).join("")
		return `## ${currentMonthYYYYMM} and ${nextMonthYYYYMM}\n\`\`\`query\n(${currentMonthYYYYMM}\\d\\d OR ${nextMonthYYYYMM}\\d\\d ${excludeNoteStr}-path:"D/Scheduling" -block:(query)\n\`\`\`\n\n`
	}

	getQueryDateString(addDay: number, excludeNote: String): string {
		const dateMoment = moment().add(addDay, 'd');
		const dateYYYYMMDD = dateMoment.format('YYYYMMDD');
		const dateEachYYDD = '\\d\\d\\d\\d' + dateMoment.format('MMDD');
		const dateEachDD = '\\d\\d\\d\\d\\d\\d' + dateMoment.format('DD');
		return `${dateYYYYMMDD}\n\`\`\`query\n(${dateYYYYMMDD} OR ${dateEachYYDD} OR ${dateEachDD}) -path:"${excludeNote}" -block:(query)\n\`\`\`\n`
	}

	getQueryActionString(addDay: number, actionType: String): string {
		const dateMoment = moment().add(addDay, 'd');
		const dayOfWeek = dateMoment.format('E');
		return `\`\`\`query\ntag:#${actionType}${dayOfWeek}\n\`\`\`\n`
	}

	getQueryWeekDay(addDay: number, actionType: String): string {
		const dateMoment = moment().add(addDay, 'd');
		const dayOfWeek = dateMoment.format('E');
		return `tag:#${actionType}${dayOfWeek} OR `
	}
	  
	addNewLaterActionIcon(t: string) {
		this.addObsidianIcon(`${t}l-icon-new`, `${t}l`);
	}
	  
	addActionIcon(t: string) {
		this.addObsidianIcon(`${t}-icon`, `#${t}`);
	}

	addObsidianIcon(iconName: string, iconText: string) {
		const svg = `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>${iconText}</text>`;
		addIcon(iconName, svg);
	}

	addNewLaterAction(t: string) {
		this.addCommand({
			id: `add-new-${t}-later-action`,
			name: `Add ${t}l task`,
			icon: `${t}l-icon-new`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor();
				editor.replaceRange(`#${t}l `, cursor);
				cursor.ch = cursor.ch + 4;
				editor.setCursor(cursor);
			}/*,
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: t == 'n' ? '1' : '2'
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: t == 'n' ? '1' : '2'
				}
			]*/
		});
	}

	addActionCommand(t: string) {
		this.addCommand({
			id: `to-w${t}-n${t}`,
			name: `To w${t} or n${t}`,
			icon: `${t}-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				const cursor = editor.getCursor();
				const lineNumber = editor.getCursor().line;
				const line = editor.getLine(lineNumber);
				const replacedLine = line.replace(/ a\/w\/./, ` a/w/${t}`)
				                         .replace(/ a\/n\/./, ` a/n/${t}`)
								 	 	 .replace(/#w. /, `#w${t} `)
										 .replace(/#n. /, `#n${t} `)
										 .replace(/#w.$/, `#w${t}`)
										 .replace(/#n.$/, `#n${t}`)
				if (line.contains(`#n${t} `) || line.contains(`#w${t} `)) {
					const nt = `#n${t} `
					const wt = `#w${t} `
					
					const replaceLineToRemoveTag = line.replace(`#n${t} `, ``).replace(`#w${t} `, ``)
					editor.setLine(lineNumber, replaceLineToRemoveTag);
					// lets say "#nt " is at 3 (char for #)
					// if ch <= 3 no need to update
					// if ch >= 7 then need to -4
					// else ch == 3
					const ntIndex = line.indexOf(nt)
					const wtIndex = line.indexOf(wt)
					const index = ntIndex == -1 ? wtIndex : ntIndex
					const newCh = cursor.ch <= index ? cursor.ch : (cursor.ch >= index + 4 ? cursor.ch - 4 : index)
					cursor.ch = newCh
					editor.setCursor(cursor);
				} else if (line.contains(` #n${t}`) || line.contains(` #w${t}`)) {
					const nt = `#n${t} `
					const wt = `#w${t} `
					
					const replaceLineToRemoveTag = line.replace(` #n${t}`, ``).replace(` #w${t}`, ``)
					editor.setLine(lineNumber, replaceLineToRemoveTag);
					// lets say "#nt " is at 3 (char for #)
					// if ch <= 3 no need to update
					// if ch >= 7 then need to -4
					// else ch == 3
					const ntIndex = line.indexOf(nt)
					const wtIndex = line.indexOf(wt)
					const index = ntIndex == -1 ? wtIndex : ntIndex
					const newCh = cursor.ch <= index ? cursor.ch : (cursor.ch >= index + 4 ? cursor.ch - 4 : index)
					cursor.ch = newCh
					editor.setCursor(cursor);
				} else if (line.contains(` a/n/${t}`) || line.contains(` a/w/${t}`)) {
					// do nothing
				} else if (replacedLine == line) { // no tag, to add tag
					new AddTaskTagModal(this.app, editor, t).open();
				} else {			 
					editor.setLine(lineNumber, replacedLine);
					editor.setCursor(cursor);
				}
			},
			hotkeys: [
				{
					modifiers: this.is1To7(t) ? [`Ctrl`, `Meta`] : [`Ctrl`, `Meta`, `Shift`],
					key: `${t}`,
				},
				{
					modifiers: this.is1To7(t) ? [`Ctrl`, `Alt`] : [`Ctrl`, `Alt`, `Shift`],
					key: `${t}`,
				}
			]
		});
	}

	addFollowUpCommand(t: string) {
		let name = ""
		if (t === 't') {
			name = 'To Try'
		} else if (t === 'e') {
			name = 'To Explore'
		} else if (t === 'm') {
			name = 'To Move'
		}
		this.addCommand({
			id: `to-t${t}`,
			name: `To t${t} ${name}`,
			icon: `${t}-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				const cursor = editor.getCursor();
				const lineNumber = editor.getCursor().line;
				const line = editor.getLine(lineNumber);
				const replacedLine = line.replace(/#t. /, `#t${t} `)
										 .replace(/#t.$/, `#t${t}`)
				if (line.contains(`#t${t} `)) {
					const tt = `#t${t} `
					
					const replaceLineToRemoveTag = line.replace(`#t${t} `, ``)
					editor.setLine(lineNumber, replaceLineToRemoveTag);
					// lets say "#tt " is at 3 (char for #)
					// if ch <= 3 no need to update
					// if ch >= 7 then need to -4
					// else ch == 3
					const ttIndex = line.indexOf(tt)
					const index = ttIndex
					const newCh = cursor.ch <= index ? cursor.ch : (cursor.ch >= index + 4 ? cursor.ch - 4 : index)
					cursor.ch = newCh
					editor.setCursor(cursor);
				} else if (line.contains(` #t${t}`)) {
					const tt = `#t${t} `
					
					const replaceLineToRemoveTag = line.replace(` #t${t}`, ``)
					editor.setLine(lineNumber, replaceLineToRemoveTag);
					// lets say "#tt " is at 3 (char for #)
					// if ch <= 3 no need to update
					// if ch >= 7 then need to -4
					// else ch == 3
					const ttIndex = line.indexOf(tt)
					const index = ttIndex
					const newCh = cursor.ch <= index ? cursor.ch : (cursor.ch >= index + 4 ? cursor.ch - 4 : index)
					cursor.ch = newCh
					editor.setCursor(cursor);
				} else if (replacedLine == line) { // no tag, to add tag
					const cursor = editor.getCursor()
					const line = editor.getLine(cursor.line);
					editor.replaceRange(`${line.charAt(cursor.ch - 1) != ' ' ? ' ' : ""}#t${t} `, cursor);  
					cursor.ch = cursor.ch + 4 + (line.charAt(cursor.ch - 1) != ' ' ? 1 : 0);
					editor.setCursor(cursor);
				} else {			 
					editor.setLine(lineNumber, replacedLine);
					editor.setCursor(cursor);
				}
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `${t}`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `${t}`,
				}
			]
		});
	}


	is1To7(t: string) : boolean {
		if (t == "1" || t == "2" || t == "3" || t == "4" || t == "5" || t == "6" || t == "7") {
			return true
		} else {
			return false
		}
	}

	addToClipboardHistory(content: string) {
		const index = clipboardHistory.indexOf(content, 0);
		if (index > -1) {
			clipboardHistory.splice(index, 1);
		}
		if (content.length > 0) {
			clipboardHistory.push(content);
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}


