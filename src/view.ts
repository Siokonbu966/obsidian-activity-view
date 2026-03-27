import { ItemView, WorkspaceLeaf } from "obsidian";
import { ActivityDataProcessor } from "./utils/dataProcessor";
import ActivityView from "./main";

export const VIEW_TYPE_ACTIVITY = "activity-dashboard-view";

export class ActivityDashboardView extends ItemView {
	private plugin: ActivityView;
	private dataProcessor: ActivityDataProcessor;

	constructor(leaf: WorkspaceLeaf, plugin: ActivityView) {
		super(leaf);
		this.plugin = plugin;
		this.dataProcessor = new ActivityDataProcessor(this.app, plugin);
	}

	getViewType(): string {
		return VIEW_TYPE_ACTIVITY;
	}

	getDisplayText(): string {
		return "Activity Dashboard";
	}

	getIcon(): string {
		return "calendar";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("activity-dashboard-container");

		// ヒートマップコンテナ
		const heatmapContainer = container.createDiv({ cls: "activity-heatmap-container" });
		await this.renderHeatmap(heatmapContainer);
	}

	private async renderHeatmap(container: HTMLElement) {
		const heatmapData = await this.dataProcessor.generateHeatmapData();

		if (heatmapData.length === 0) {
			container.createEl("p", { text: "データがありません", cls: "activity-no-data" });
			return;
		}

		const heatmapWrapper = container.createDiv({ cls: "activity-heatmap" });
		
		// 週のラベル
		const weeksCount = Math.max(...heatmapData.map(d => d.week)) + 1;
		const grid = heatmapWrapper.createDiv({ cls: "heatmap-grid" });
		
		// 曜日ラベル
		const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
		const labelColumn = grid.createDiv({ cls: "heatmap-weekday-labels" });
		weekdayLabels.forEach(label => {
			labelColumn.createDiv({ text: label, cls: "heatmap-weekday-label" });
		});

		// 最大活動量を取得（色の正規化用）
		const maxActivity = Math.max(...heatmapData.map(d => d.activity));

		// 週ごとにセルを生成
		for (let week = 0; week < weeksCount; week++) {
			const weekColumn = grid.createDiv({ cls: "heatmap-week" });
			
			for (let day = 0; day < 7; day++) {
				const dayData = heatmapData.find(d => d.week === week && d.weekday === day);
				const cell = weekColumn.createDiv({ cls: "heatmap-cell" });
				
				if (dayData && dayData.activity > 0) {
					const intensity = maxActivity > 0 ? dayData.activity / maxActivity : 0;
					const color = this.getHeatmapColor(intensity);
					cell.style.backgroundColor = color;
					cell.setAttribute("data-date", dayData.date);
					cell.setAttribute("data-activity", dayData.activity.toString());
					cell.setAttribute("title", `${dayData.date}: ${dayData.activity}文字`);
				} else {
					cell.addClass("heatmap-cell-empty");
				}
			}
		}
	}

	private getHeatmapColor(intensity: number): string {
		// GitHub風の緑グラデーション
		if (intensity === 0) return "#ebedf0";
		if (intensity < 0.25) return "#9be9a8";
		if (intensity < 0.5) return "#40c463";
		if (intensity < 0.75) return "#30a14e";
		return "#216e39";
	}

	async onClose() {
		// cleanup if needed
	}
}

