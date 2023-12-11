import { UpdateNoteTypeModal } from 'updateNoteTypeModal';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command, TFile, Vault, EditorSelection, TAbstractFile } from 'obsidian';
import { AddFootnoteTagModal } from 'addCommentTagModal';
import { OpenActionsModal } from 'openActions';
import { Moment } from 'moment'
import { AddTaskTagModal } from 'addTaskTagModal';
import { renameTag } from 'tagrenamer/renaming';
import { ThreadsToImagesModal } from 'ThreadsToImagesModal';
import { CopyOrMoveToNewNoteModal } from 'copyOrMoveToNewNoteModal';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		['n', 'l', 'w', 'd', 'a', 't', 'm', 'e', '1', '2', '3', '4', '5', '6', '7'].forEach(t => {
			this.addIcon(t);
			this.addActionCommand(t);
		});

		['n', 'w'].forEach(t => {
			this.addNewLaterActionIcon(t);
			this.addNewLaterAction(t);
		});

		this.addUpdateNoteTypeIcon();
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
			name: "Open Recent Days Updated Schedule",
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

		this.updateSchedulingIcon()
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
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: `u`,
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: `u`,
				},
			]
		})

		this.openDashboardIcon()
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
				await leaf.openFile(vault.getAbstractFileByPath(dashboardCanvas) as TFile, { active : true,/* mode */});
			},
		})

		this.openRecentDaysScheduleIcon()
		this.addCommand({
			id: "open-recent-days-schedule",
			name: "Open Recent Days Schedule",
			icon: "open-recent-day-schedule-icon",
			callback: async () => {
				const { vault } = this.app;
				const { workspace } = this.app;
				const dashboardCanvas = "D/Query Schedule and Actions next 3 days.md"
				const mode = (this.app.vault as any).getConfig("defaultViewMode");
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(dashboardCanvas) as TFile, { active : true,/* mode */});
			},
		})

		this.openInboxIcon()
		this.addCommand({
			id: "open-inbox",
			name: "Open Inbox",
			icon: "open-inbox-icon",
			callback: async () => {
				const { vault } = this.app;
				const { workspace } = this.app;
				const inboxMd = "I/Inbox.md"
				const mode = (this.app.vault as any).getConfig("defaultViewMode");
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(inboxMd) as TFile, { active : true,/* mode */});
			},
		})

		this.openBrainDumpIcon()
		this.addCommand({
			id: "open-braindump",
			name: "Open BrainDump",
			icon: "open-braindump-icon",
			callback: async () => {
				const { vault } = this.app;
				const { workspace } = this.app;
				const inboxMd = "I/Brain Dump.md"
				const mode = (this.app.vault as any).getConfig("defaultViewMode");
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(inboxMd) as TFile, { active : true,/* mode */});
			},
		})

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

		this.addThreadsToBlogIcon();
		this.addCommand({
			id: "threads-to-blog",
			name: "Threads as pre Blog format to Clipboard",
			icon: `threads-to-blog-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const lineCount = editor.lineCount();
				let tagLineNumber = null;
				let metadataLineCount = 0;
				let text = ""
				for (let i = 0; i < lineCount; i++) {
					let line = editor.getLine(i);
					if (!line.trim().startsWith("%%") || !line.trim().endsWith("%%")) {
						let modifiedLine = line.replace('🧵 ', '# ').replace('【', '').replace('】', '').replace('👇', '')
						if (modifiedLine == '---') {
							metadataLineCount++
							if (metadataLineCount > 2) {
								modifiedLine = modifiedLine.replace('---', '## > ')
							}
						}
						if (metadataLineCount == 1 || metadataLineCount == 2) {
							modifiedLine = modifiedLine.replace("c/t/p", "c/b/d")
							modifiedLine = modifiedLine.replace("c/t/t", "c/b/d")
							modifiedLine = modifiedLine.replace("c/t/r", "c/b/d")
						}

						if (/^!\[.*\]\(.*\)/.test(modifiedLine.trim())) {
							if (!modifiedLine.contains("https://roulesophy.github.io")) {
								modifiedLine = modifiedLine.replace(/!\[([^\[\]\(\)]+)\]\(([^\[\]\(\)]+)\)/g, "$2")
							}
						}
						text = text + modifiedLine + "\n";
					}
				}
				text += `\n\n---\n\n#nl generate summary for meta description below:\n\n\n\n`
				text += `---\n\n## References:\n\n- Thread post 1: [[${view.file.basename}]]\n- Blog link: \n`

				navigator.clipboard.writeText(text).then(function () {
					new Notice(`Copied blog content to clipboard!`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			}
		});

		this.addChatGPTPromptForGeneratingSummaryToClipboard();
		this.addCommand({
			id: "chatgpt-prompt-for-generating-summary-to-clipboard",
			name: "ChatGPT prompt for generating summary to clipboard",
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

		this.addAddCommentTagIcon();
		this.addCommand({
			id: "add-comment-tag",
			name: "Add Comment Tag",
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

		this.addActionTagCountIcon();
		this.addCommand({
			id: "action-tag-count-icon",
			name: "Count Action Tag",
			icon: `action-tag-count-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const v = editor.getValue()
				let count = (v.match(/#nn/g) || []).length
				+ (v.match(/#nl/g) || []).length
				+ (v.match(/#nw/g) || []).length
				+ (v.match(/#nm/g) || []).length
				+ (v.match(/#n1/g) || []).length
				+ (v.match(/#n2/g) || []).length
				+ (v.match(/#n3/g) || []).length
				+ (v.match(/#n4/g) || []).length
				+ (v.match(/#n5/g) || []).length
				+ (v.match(/#n6/g) || []).length
				+ (v.match(/#n7/g) || []).length
				+ (v.match(/#wn/g) || []).length
				+ (v.match(/#wl/g) || []).length
				+ (v.match(/#ww/g) || []).length
				+ (v.match(/#wm/g) || []).length
				+ (v.match(/#w1/g) || []).length
				+ (v.match(/#w2/g) || []).length
				+ (v.match(/#w3/g) || []).length
				+ (v.match(/#w4/g) || []).length
				+ (v.match(/#w5/g) || []).length
				+ (v.match(/#w6/g) || []).length
				+ (v.match(/#w7/g) || []).length
				
				new Notice(`There are ${count} outstanding actions in this notes`);
			}
		});


		this.addRemoveActionIcon();
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
										 .replace('#nm ', '')
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
										 .replace('#wm ', '')
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

		this.addEventToFantasticalIcon();
		this.addCommand({
			id: "add-fantastical-event",
			name: "Add Fantastical Event",
			icon: `event-to-fantastical-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let text = ""
				const listSelections : EditorSelection[] = editor.listSelections()
				listSelections.forEach(listSelection => {
					const a = listSelection.head.line
					const b = listSelection.anchor.line
					const fromLineNum = b > a ? a : b
					const toLineNum = b > a ? b : a
					for (let i = fromLineNum; i <= toLineNum; i++) {
						const line = editor.getLine(i)
						if (/^- \d\d\d\d-\d\d-\d\d \d\d:\d\d /.test(line)) {
							const modifiedLine = line.replace(/^- /, `- #nm `)
							editor.setLine(i, modifiedLine);
							text += line + "\n"
						}
					}
				})
				if (text.length != 0) {
					text = encodeURI(text)
					window.open(`shortcuts://run-shortcut?name=Add%20Obsidian%20Inbox%20Event%20via%20Fantastical&input=text&text=${text}&x-success=obsidian://&x-cancel=obsidian://&x-error=obsidian://`);
				}
			}
		});

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

		this.addCommand({
			id: "grep-title-as-link-to-clipboard",
			name: "Grep Title as link to clipboard",
			icon: `clipboard-list`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const title = view.file.basename;
				const titleAsLink = `[[${title}]]`;
				navigator.clipboard.writeText(titleAsLink).then(function () {
					new Notice(`Copied title "${title}" as link to clipboard!`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
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


		this.addThreadsToTwitterIcon();
		this.addCommand({
			id: "threads-to-twitter",
			name: "Threads to Twitter",
			icon: `threads-to-twitter`,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const { vault } = this.app;
				const v = editor.getValue()
				const path = view.file.path
				if (!path.match(/.\/Threads \d\d\d\d\d\d\d\d/)) {
					new Notice(`Will not proceed. It is not a threads post.`);
					return;
				}
				const newPath = path.replace(/(.\/)Threads /, "$1Twitter ")
				const fileExists = await vault.adapter.exists(newPath);
				if (fileExists) {
					new Notice(`Will not proceed. Twitter post already exist.`);
					return;
				}
				await vault.create(newPath, v);


				const { workspace } = this.app;
				const mode = (this.app.vault as any).getConfig("defaultViewMode");
				const leaf = workspace.getLeaf(false);
				await leaf.openFile(vault.getAbstractFileByPath(newPath) as TFile, { active : true,});
			}
		})

		this.addGrepBlogToClipboardIcon();
		this.addCommand({
			id: "blog-to-clipboard",
			name: "Blog content to clipboard",
			icon: `blog-to-clipboard-icon`,
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const v = editor.getValue()
				if (v.contains("#nn") || v.contains("#nl") || v.contains("#nw") || v.contains("#wn") || v.contains("#wl") || v.contains("#ww")) {
					new Notice(`Will not proceed. As there are unfinished action tag.`);
					return;
				}

				const path = view.file.path
				let moment = require('moment');
				//const dateMoment = moment().add(addDay, 'd');
				const dateYYYYMMDD = moment().format('YYYYMMDD');
				if (path.match(/^.\/Blog \d\d\d\d\d\d\d\d/)) {
					//new Notice("no need to rename")
				} else if (path.match(/^.\/blog \d\d\d\d\d\d\d\d/)) {
					new Notice("start with blog with date, renaming blog to Blog")
					const renamedPath = path.replace(/^(.\/)blog /, `$1Blog `)
					//new Notice("renamedPath: " + renamedPath)
					//this.app.fileManager.renameFile(view.file, renamedPath)
					await this.renameFile(view.file, renamedPath);
				} else if (path.match(/^.\/Blog /)) {
					new Notice("starts with Blog but no date, adding date")
					const renamedPath = path.replace(/^(.\/Blog )/, `$1${dateYYYYMMDD} `)
					//new Notice("renamedPath: " + renamedPath)
					// this.app.fileManager.renameFile(view.file, renamedPath)
					await this.renameFile(view.file, renamedPath);
				} else if (path.match(/^.\/blog /)) {
					new Notice("starts with blog but no date, adding date")
					const renamedPath = path.replace(/^(.\/)blog /, `$1Blog ${dateYYYYMMDD} `)
					//new Notice("renamedPath: " + renamedPath)
					// this.app.fileManager.renameFile(view.file, renamedPath)
					await this.renameFile(view.file, renamedPath);
				} else {
					new Notice("starts without blog, adding Blog + date")
					const renamedPath = path.replace(/^(.\/)/, `$1Blog ${dateYYYYMMDD} `)
					//new Notice("renamedPath: " + renamedPath)
					// this.app.fileManager.renameFile(view.file, renamedPath)
					await this.renameFile(view.file, renamedPath);
				}
				

				let line = editor.lineCount();

				let text = "";
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
					text = text + line + "\n"
				});
				const beforeTagCBR = "c/b/r"
				const beforeTagCBD = "c/b/d"
				const afterTag = "c/b/p"

				text = text.replace(/## References\:([\n]*.*)*$/, "")
				
				navigator.clipboard.writeText(text).then(function () {
					let foundTagFromCBR = renameTag(view.file, beforeTagCBR, afterTag)
					let foundTagFromCBD = renameTag(view.file, beforeTagCBD, afterTag)
					if (foundTagFromCBR) {
						new Notice(`Update notes type from tag="${beforeTagCBR}" to tag="${afterTag}!\nCopied blog content to clipboard!`);
					} else if (foundTagFromCBD) {
						new Notice(`Update notes type from tag="${beforeTagCBD}" to tag="${afterTag}!\nCopied blog content to clipboard!`);
				    } else {
						new Notice(`Tag "${beforeTagCBR}" not found\nCopied blog content to clipboard!`);
					}
					window.open(`shortcuts://run-shortcut?name=Jekyll%20blog&x-cancel=obsidian://&x-error=obsidian://`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			},
		});

		this.addGrepThreadsToClipboardIcon();
		this.addCommand({
			id: "threads-to-clipboard",
			name: "Threads content to clipboard",
			icon: `threads-to-clipboard-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const value = editor.getValue()
				if (!value.contains("%% #nm to zk %%") && !value.contains("%% #nd to zk %%")) {
					this.addTaskToPutIntoCardInThreadsContent(editor)
				}
				const text = this.convertThreadsContentToFormatForThreadsApp(editor)
				const beforeTag = "c/t/r"
				const afterTag = "c/t/t"
			
				navigator.clipboard.writeText(text).then(function () {
					let foundTag = renameTag(view.file, beforeTag, afterTag)
					if (foundTag) {
						new Notice(`Update notes type from tag="${beforeTag}" to tag="${afterTag}!\nCopied thread content to clipboard!`);
					} else {
						new Notice(`Tag "${beforeTag}" not found\nCopied thread content to clipboard!`);
					}
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			},
		});

		this.addTwitterToChatGPTIcon();
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
				
				let prompt = this.convertThreadsContentToFormatForFacebookApp(editor)
				let numTweet = Math.ceil(prompt.length / 110)
				prompt = `Convert the following content to twitter threads less than ${numTweet} tweet in traditional Chinese. Preserve the title. Do not add any additional information which is not mentioned from the original content. No need to add any tags to the tweet. Do not have any number in each tweet. Each tweet separated by newline character and 3 "-" characters and another newline character\n\n${prompt}`
				prompt = prompt.replace(/▍/g, "")
				prompt = prompt.replace(/】\n+https\:\/\/github.com[^\n]+\n/m, "】\n")

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


		this.addChatGPTToTwitterIcon();
		this.addCommand({
			id: "chatgpt-to-twitter",
			name: "GX ChatGPT to Twitter",
			icon: `chatgpt-to-twitter`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				if (!editor.getValue().contains("c/x/d")) {
					new Notice("Note type not c/x/d, do the action in wrong note?")
					return
				}
				this.convertChatGPTToTwitterFormat(editor)
				renameTag(view.file, "c/x/d", "c/x/r")
			},
		});

		this.addReverseTwitterNumberingIcon();
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

		this.addGrepThreadsAsFacebookPostToClipboardIcon();
		this.addCommand({
			id: "threads-as-facebook-post-to-clipboard",
			name: "Threads as Facebook post format to Clipboard",
			icon: `threads-as-facebook-post-to-clipboard-icon`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const value = editor.getValue()
				if (!value.contains("%% #nm to zk %%") && !value.contains("%% #nd to zk %%")) {
					this.addTaskToPutIntoCardInThreadsContent(editor)
				}
				const text = this.convertThreadsContentToFormatForFacebookApp(editor)
			
				const beforeTag = "c/t/t"
				const afterTag = "c/t/p"
			
				navigator.clipboard.writeText(text).then(function () {
					let foundTag = renameTag(view.file, beforeTag, afterTag)
					if (foundTag) {
						new Notice(`Update notes type from tag="${beforeTag}" to tag="${afterTag}!\nCopied fb content to clipboard!`);
					} else {
						new Notice(`Tag "${beforeTag}" not found\nCopied fb content to clipboard!`);
					}
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			},
		});

		this.addGrepThreadsBlockToImageIcon();
		this.addCommand({
			id: "threads-block-to-image",
			name: "Threads segment to image",
			icon: `threads-block-to-image`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const threadSegment = this.getThreadSegment(editor)
				new ThreadsToImagesModal(this.app, threadSegment).open()
				// navigator.clipboard.writeText(threadSegment).then(function () {
				// 	new Notice(`Copied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
				// 	window.open('shortcuts://run-shortcut?name=Threads%20to%20image&x-success=obsidian://&x-cancel=obsidian://&x-error=obsidian://');
				// }, function (error) {
				// 	new Notice(`error when copy to clipboard!`);
				// });
			},
		});

		this.addGrepThreadsSegmentToClipboard();
		this.addCommand({
			id: "threads-segment-to-clipboard",
			name: "Threads segment to clipboard",
			icon: `threads-segment-to-clipboard`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const threadSegment = this.getThreadSegment(editor)
				navigator.clipboard.writeText(threadSegment).then(function () {
					const beforeTag = "c/x/r"
					const afterTag = "c/x/p"
					let foundTag = renameTag(view.file, beforeTag, afterTag)
					if (foundTag) {
						new Notice(`Update notes type from tag="${beforeTag}" to tag="${afterTag}!\nCopied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
					} else {
						new Notice(`Tag "${beforeTag}" not found\nCopied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
					}
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			},
		});

		this.addGrepTwitterSegmentToClipboard();
		this.addCommand({
			id: "twitter-segment-to-clipboard",
			name: "Twitter segment to clipboard",
			icon: `twitter-segment-to-clipboard`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const threadSegment = this.getTwitterSegment(editor)
				navigator.clipboard.writeText(threadSegment).then(function () {
					const beforeTag = "c/x/r"
					const afterTag = "c/x/p"
					let foundTag = renameTag(view.file, beforeTag, afterTag)
					if (foundTag) {
						new Notice(`Update notes type from tag="${beforeTag}" to tag="${afterTag}!\nCopied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
					} else {
						new Notice(`Tag "${beforeTag}" not found\nCopied\n\`\`\`\n${threadSegment}\`\`\`\nto clipboard!`);
					}
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
			},
		});

		this.addCommand({
			id: "toggle-bullet-number-list",
			name: "Toggle Bullet Number List",
			icon: `bullet-list`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor()
				const ch = cursor.ch
				const line = cursor.line
				const lineContent = editor.getLine(line)

				if (/^(> )*\s*- /.test(lineContent)) { // bullet list case
					// toggle to number list
					const replacedLineContent = lineContent.replace(/^((> )*)(\s*)- /, "$1$31. ")
					editor.setLine(line, replacedLineContent)
					cursor.ch = cursor.ch + 1
					editor.setCursor(cursor)
				} else if (/^(> )*\s*[\d]+\. /.test(lineContent)) { // number list case
					// toggle to non list
					const replacedLineContent = lineContent.replace(/^((> )*)(\s*)[\d]+\. /, "$1$3")
					editor.setLine(line, replacedLineContent)
					cursor.ch = cursor.ch - 3
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
			id: "editor-cut-line-to-clipboard",
			name: "Editor Cut Line to Clipboard",
			icon: `align-vertical-justify-center`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor()
			    const line = editor.getLine(cursor.line)
				const copyContent = line.replace(/^\t*- /, '').replace(/^\t*\d+\. /, '')
				let newContent = ''
				for (let i = 0; i < editor.lineCount(); i++) {
					if (i != cursor.line) {
						newContent = newContent + editor.getLine(i) + "\n"
					}
				}
				navigator.clipboard.writeText(copyContent).then(function () {
					new Notice(`Copied content "${copyContent}" to clipboard!`);
				}, function (error) {
					new Notice(`error when copy to clipboard!`);
				});
				editor.setValue(newContent)
				cursor.ch = cursor.line + 1
				editor.setCursor(cursor)
			}
		})

		this.addCommand({
			id: "editor-indent-line",
			name: "Editor Indent Line",
			icon: `right-arrow-with-tail`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor()
			    const line = editor.getLine(cursor.line)
				editor.setLine(cursor.line, line.replace(/^/, "\t"))
				cursor.ch = cursor.ch + 1
				editor.setCursor(cursor)
			}
		})

		this.addCommand({
			id: "editor-outdent-line",
			name: "Editor Outdent Line",
			icon: `left-arrow-with-tail`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor()
			    const line = editor.getLine(cursor.line)
				if (line.match(/^\t+.*/)) {
					editor.setLine(cursor.line, line.replace(/^\t/, ""))
					cursor.ch = cursor.ch - 1
					editor.setCursor(cursor)
				}
			}
		})


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	async renameFile(file : TAbstractFile, newPath: string) {
		this.app.fileManager.renameFile(file, newPath)
	}

	convertChatGPTToTwitterFormat(editor: Editor) {
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

		editor.setValue(text)
		const cursor = editor.getCursor()
		cursor.line = editor.lineCount() - 1
		editor.setCursor(cursor)
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

	addTaskToPutIntoCardInThreadsContent(editor: Editor) {
		let line = editor.lineCount();

		let frontMatterLineCount = 0
		let text = "";
		for (let i = 0; i < line; i++) {
			if (editor.getLine(i) == "---") {
				frontMatterLineCount++
			}
			const line = editor.getLine(i);
			
			if (frontMatterLineCount > 2 && line == "---") {
				text = text + "%% #nm to zk %%\n\n"
			}
			text = text + line + "\n"
		}

		editor.setValue(text);
	}

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
		Array.from(Array(line - numLineFirstContent).keys()).forEach(i => {
			const line = editor.getLine(i + numLineFirstContent);
			if (!line.trim().startsWith("%%") || !line.trim().endsWith("%%")) {
				let modifiedLine = line == "---" ? "" : line
				modifiedLine = modifiedLine.replace(/^		- /g, "　　　　• ").replace(/^	- /g, "　　• ").replace(/^- /, "• ");
				modifiedLine = modifiedLine.replace(/^\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
				                           .replace(/[^!]\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
				modifiedLine = modifiedLine.replace(/!\[([^\[\]\(\)]+)\]\(([^\[\]\(\)]+)\)/g, "$2")
				text = text + modifiedLine + "\n"
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
				modifiedLine = modifiedLine.replace(/^\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
										   .replace(/[^!]\[([^\[\]\(\)]+)\]\([^\[\]\(\)]+\)/g, "$1")
										   .replace(/https[^\n]+\.jpeg/g, "")
										   .replace(/？([^】」\n])/g, "？\n\n$1")
										   .replace(/。([^】」\n])/g, "。\n\n$1")
										   .replace(/！([^】」\n])/g, "！\n\n$1")
										   .replace(/～([^】」\n])/g, "～\n\n$1")
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
		noteContent = noteContent + `## nn / wn\n\`\`\`query\ntag:#nn OR tag:#wn${otherDays}\n\`\`\`\n\n## nt / wt\n\`\`\`query\ntag:#nt OR tag:#wt\n\`\`\`\n\n`
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

	updateSchedulingIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`update-scheduling-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>US</text>`);
	}

	openDashboardIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`open-dashboard-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>OD</text>`);
	}

	openRecentDaysScheduleIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`open-recent-day-schedule-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>OR</text>`);
	}

	openInboxIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`open-inbox-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>OI</text>`);
	}

	openBrainDumpIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`open-braindump-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>OB</text>`);
	}

	getQueryDateAndActionString(addDay: Number, excludeNotes: String[]): string {
		let moment = require('moment');
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
		let excludes : Number[] = []
		let includes : Number[] = [1, 2, 3, 4, 5, 6, 7]
		
		Array.from(Array(excludeNumDays).keys()).forEach(i => {
			let moment = require('moment');
			const dateMoment = moment().add(i, 'd');
			const dayOfWeek = dateMoment.format('E');
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
		let moment = require('moment');
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
		let moment = require('moment');
		const currentMonthYYYYMM = moment().format('YYYYMM');
		const dateMoment = moment().add(1, 'M');
		const nextMonthYYYYMM = dateMoment.format('YYYYMM');
		const excludeNoteStr = excludeNotes.map(excludeNote => `-path:"${excludeNote}" `).join("")
		return `## ${currentMonthYYYYMM} and ${nextMonthYYYYMM}\n\`\`\`query\n(${currentMonthYYYYMM}\\d\\d OR ${nextMonthYYYYMM}\\d\\d ${excludeNoteStr}-path:"D/Scheduling" -block:(query)\n\`\`\`\n\n`
	}

	getQueryDateString(addDay: Number, excludeNote: String): string {
		let moment = require('moment');
		const dateMoment = moment().add(addDay, 'd');
		const dateYYYYMMDD = dateMoment.format('YYYYMMDD');
		const dateEachYYDD = '\\d\\d\\d\\d' + dateMoment.format('MMDD');
		const dateEachDD = '\\d\\d\\d\\d\\d\\d' + dateMoment.format('DD');
		return `${dateYYYYMMDD}\n\`\`\`query\n(${dateYYYYMMDD} OR ${dateEachYYDD} OR ${dateEachDD}) -path:"${excludeNote}" -block:(query)\n\`\`\`\n`
	}

	getQueryActionString(addDay: Number, actionType: String): string {
		let moment = require('moment');
		const dateMoment = moment().add(addDay, 'd');
		const dayOfWeek = dateMoment.format('E');
		return `\`\`\`query\ntag:#${actionType}${dayOfWeek}\n\`\`\`\n`
	}

	getQueryWeekDay(addDay: Number, actionType: String): string {
		let moment = require('moment');
		const dateMoment = moment().add(addDay, 'd');
		const dayOfWeek = dateMoment.format('E');
		return `tag:#${actionType}${dayOfWeek} OR `
	}

	addActionTagCountIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`action-tag-count-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>CA</text>`);
	}

	addGrepThreadsToClipboardIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`threads-to-clipboard-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>TC</text>`);
	}

	addGrepThreadsAsFacebookPostToClipboardIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`threads-as-facebook-post-to-clipboard-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>FC</text>`);
	}

	addThreadsToTwitterIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`threads-to-twitter`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>TT</text>`);
	}

	addTwitterToChatGPTIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`twitter-to-chatgpt`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>XG</text>`);
	}

	addChatGPTToTwitterIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`chatgpt-to-twitter`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>GX</text>`);
	}

	addReverseTwitterNumberingIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`reverse-twitter-number-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>RT</text>`);
	}

	addEventToFantasticalIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`event-to-fantastical-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>FE</text>`);
	}

	addGrepBlogToClipboardIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`blog-to-clipboard-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>BJ</text>`);
	}

	addGrepThreadsBlockToImageIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`threads-block-to-image`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>TI</text>`);
	}

	addGrepTwitterSegmentToClipboard() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`twitter-segment-to-clipboard`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>XC</text>`);
	}

	addGrepThreadsSegmentToClipboard() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`threads-segment-to-clipboard`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>SC</text>`);
	}

	addChatGPTPromptForGeneratingSummaryToClipboard() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`chatgpt-prompt-for-generating-summary-to-clipboard`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>GS</text>`);
	}

	addRemoveActionIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`remove-action-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>-#</text>`);
	}

	addUpdateNoteTypeIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`update-note-type-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>NT</text>`);
	}

	addThreadsToBlogIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`threads-to-blog-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>PB</text>`);
	}

	addAddCommentTagIcon() {
		var obsidian = require('obsidian');
		obsidian.addIcon(`add-comment-tag-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>CT</text>`);
	}

	addNewLaterActionIcon(t: string) {
		var obsidian = require('obsidian');
		obsidian.addIcon(`${t}l-icon-new`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>${t}l</text>`);
	}

	addIcon(t: string) {
		var obsidian = require('obsidian');
		obsidian.addIcon(`${t}-icon`, `<text stroke='#000' transform='matrix(2.79167 0 0 2.12663 -34.0417 -25.2084)' xml:space='preserve' text-anchor='start' font-family='monospace' font-size='24' y='44' x='19' stroke-width='0' fill='currentColor'>#${t}</text>`);
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
			},
			hotkeys: [
				{
					modifiers: [`Ctrl`, `Meta`, `Shift`],
					key: t == 'n' ? ',' : '.'
				},
				{
					modifiers: [`Ctrl`, `Alt`, `Shift`],
					key: t == 'n' ? ',' : '.'
				}
			]
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

	is1To7(t: string) : boolean {
		if (t == "1" || t == "2" || t == "3" || t == "4" || t == "5" || t == "6" || t == "7") {
			return true
		} else {
			return false
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
