import { MarkdownView, Plugin } from "obsidian";
import { MyPluginSettings, DEFAULT_SETTINGS } from "./settings";

export default class ActivityView extends Plugin {
	settings: MyPluginSettings;
	statusBarEl: any;

	async onload() {
		await this.loadSettings();

		this.statusBarEl = this.addStatusBarItem();

		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				this.updateStatusBar();
			}),
		);
	}

	private updateStatusBar() {
		if (!this.settings.showInStatusBar) {
			return;
		}
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || !view.editor) {
			return;
		}
		const editor = view.editor;
		const content = editor.getValue();
		const characters = content.length;
		const words = content
			.trim()
			.split(/\s+/)
			.filter((word: string) => word.length > 0).length;
		const lines = content.split("\n").length;

		this.statusBarEl.setText(
			`文字数: ${characters} | 単語数: ${words} | 行数: ${lines}`,
		);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}
}
