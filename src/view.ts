import { ItemView, WorkspaceLeaf } from "obsidian";
import { ActivityDataProcessor, HeatmapData } from "./utils/dataProcessor";
import ActivityView from "./main";

export const VIEW_TYPE_ACTIVITY = "activity-dashboard-view";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
		
		const weeksCount = Math.max(...heatmapData.map(d => d.week)) + 1;
		
		// 月ラベル行を作成
		const monthRow = heatmapWrapper.createDiv({ cls: "heatmap-month-row" });
		// 曜日ラベル列の分の空白
		monthRow.createDiv({ cls: "heatmap-month-spacer" });
		
		// 各週の月を取得してラベルを配置
		const weekMonths = this.getWeekMonths(heatmapData, weeksCount);
		let lastMonth = -1;
		for (let week = 0; week < weeksCount; week++) {
			const monthLabel = monthRow.createDiv({ cls: "heatmap-month-label" });
			if (weekMonths[week] !== lastMonth) {
				monthLabel.setText(MONTH_LABELS[weekMonths[week]]);
				lastMonth = weekMonths[week];
			}
		}

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

	private getWeekMonths(heatmapData: HeatmapData[], weeksCount: number): number[] {
		const weekMonths: number[] = [];
		
		for (let week = 0; week < weeksCount; week++) {
			// その週のデータを取得
			const weekData = heatmapData.filter(d => d.week === week);
			if (weekData.length > 0) {
				// 週の最初の日の月を使用
				const firstDay = weekData.reduce((min, d) => d.weekday < min.weekday ? d : min);
				const month = new Date(firstDay.date + 'T00:00:00Z').getUTCMonth();
				weekMonths.push(month);
			} else {
				// データがない場合は前の週の月を継続
				weekMonths.push(weekMonths.length > 0 ? weekMonths[weekMonths.length - 1] : 0);
			}
		}
		
		return weekMonths;
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

