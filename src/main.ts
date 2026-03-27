import { MarkdownView, Plugin } from "obsidian";
import { MyPluginSettings, DEFAULT_SETTINGS } from "./settings";
import { SessionTracker } from "./sessionTracker";
import { ActivityDashboardView, VIEW_TYPE_ACTIVITY } from "./view";

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

		// Register the dashboard view
		this.registerView(
			VIEW_TYPE_ACTIVITY,
			(leaf) => new ActivityDashboardView(leaf, this)
		);

		// Add ribbon icon to open dashboard
		this.addRibbonIcon("bar-chart-2", "Activity Dashboard", () => {
			this.activateDashboardView();
		});

		// Add command to open dashboard
		this.addCommand({
			id: "open-activity-dashboard",
			name: "Open Activity Dashboard",
			callback: () => {
				this.activateDashboardView();
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.handleSessionEnd();
			}),
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				this.handleEditorChange();
			}),
		);
	}

	async activateDashboardView() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_ACTIVITY)[0];

		if (!leaf) {
			// メインエディターエリアに新しいタブとして開く
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_ACTIVITY,
				active: true,
			});
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
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

	private async handleSessionEnd() {
		// JSONに記録してからセッションをリセット
		await this.writeLog();
		this.resetSession();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async writeLog() {
		const sessionData = {
			added: this.sessionTracker.addedCharacters,
			deleted: this.sessionTracker.deletedCharacters,
			timestamp: new Date().toISOString(),
		};

		try {
			const dataPath = `${this.manifest.dir}/data.json`;
			let allData: any[] = [];

			// 既存ファイルを読み込む
			try {
				const fileContent = await this.app.vault.adapter.read(dataPath);
				allData = JSON.parse(fileContent);
				if (!Array.isArray(allData)) {
					allData = [];
				}
			} catch {
				// ファイルが存在しない場合は新規作成
				allData = [];
			}

			// 新しいセッションデータを追加
			allData.push(sessionData);

			// ファイルに書き込む
			await this.app.vault.adapter.write(dataPath, JSON.stringify(allData, null, 2));
			console.log('Session data saved successfully', sessionData);
		} catch (err) {
			console.error('Error writing session data', err);
		}
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_ACTIVITY);
	}
}
