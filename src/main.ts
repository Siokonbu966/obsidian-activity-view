import { MarkdownView, Plugin } from "obsidian";
import { MyPluginSettings, DEFAULT_SETTINGS } from "./settings";
import { SessionTracker } from "./sessionTracker";

export default class ActivityView extends Plugin {
	settings: MyPluginSettings;
	statusBarEl: any;
	sessionTracker: SessionTracker;

	async onload() {
		await this.loadSettings();

		// init SessionTracker
		this.sessionTracker = new SessionTracker();

		// init statusBarEld
		this.statusBarEl = this.addStatusBarItem();

		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.resetSession();
			}),
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				this.handleEditorChange();
			}),
		);
	}

	private handleEditorChange() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || !view.editor) {
			return;
		}

		const editor = view.editor;
		const currentContent = editor.getValue();

		this.sessionTracker.updateFormContent(currentContent);

		this.updateStatusBar();
	}

	private updateStatusBar() {
		if (!this.settings.showInStatusBar) {
			return;
		}

		const stats = this.sessionTracker.getStats();
		this.statusBarEl.setText(
			`入力: ${stats.added} | 削除: ${stats.deleted}`,
		);
	}

	private resetSession() {
		this.settings.lastSessionStats = {
			added: this.sessionTracker.addedCharacters,
			deleted: this.sessionTracker.deletedCharacters,
			date: new Date().toISOString(),
		};

		this.sessionTracker.reset();
		this.updateStatusBar();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}
}
