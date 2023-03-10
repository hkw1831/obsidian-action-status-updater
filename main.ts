import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command } from 'obsidian';

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

		['n', 'l', 'w', 'd', 'a', 't'].forEach(t => {
			this.addIcon(t);
			this.addActionCommand(t);
		});

		['n', 'w'].forEach(t => {
			this.addNewLaterActionIcon(t);
			this.addNewLaterAction(t);
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
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
			}
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
				const replacedLine = line.replace(`#wn `, `#w${t} `)
				                         .replace(`#wl `, `#w${t} `)
				                         .replace(`#ww `, `#w${t} `)
										 .replace(`#wd `, `#w${t} `)
										 .replace(`#wa `, `#w${t} `)
										 .replace(`#wt `, `#w${t} `)
										 .replace(`#w1 `, `#w${t} `)
										 .replace(`#w2 `, `#w${t} `)
										 .replace(`#w3 `, `#w${t} `)
										 .replace(`#w4 `, `#w${t} `)
										 .replace(`#w5 `, `#w${t} `)
										 .replace(`#w6 `, `#w${t} `)
										 .replace(`#w7 `, `#w${t} `)
										 .replace(`#nn `, `#n${t} `)
										 .replace(`#nl `, `#n${t} `)
										 .replace(`#nw `, `#n${t} `)
										 .replace(`#nd `, `#n${t} `)
										 .replace(`#na `, `#n${t} `)
										 .replace(`#nt `, `#n${t} `)
										 .replace(`#n1 `, `#n${t} `)
										 .replace(`#n2 `, `#n${t} `)
										 .replace(`#n3 `, `#n${t} `)
										 .replace(`#n4 `, `#n${t} `)
										 .replace(`#n5 `, `#n${t} `)
										 .replace(`#n6 `, `#n${t} `)
										 .replace(`#n7 `, `#n${t} `);
				editor.setLine(lineNumber, replacedLine);
				editor.setCursor(cursor);
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
