import { Plugin, App } from "obsidian";

// data.jsonの形式を定義
interface ActivityEntry {
	added: number;
	deleted: number;
	timestamp: string;
}

// 日別集計結果の形式
export interface DailyStats {
	date: string;
	added: number;
	deleted: number;
	total: number;
}

// ヒートマップ用のデータ形式
export interface HeatmapData {
	date: string;
	weekday: number; // 0(日) - 6(土)
	week: number; // 週番号
	activity: number; // 操作の合計
}

// Chart.js対応のデータセット
interface ChartDataset {
	label: string;
	data: number[];
	borderColor?: string;
	backgroundColor?: string | string[];
	fill?: boolean;
	tension?: number;
}

export interface ChartData {
	labels: string[];
	datasets: ChartDataset[];
}

export class ActivityDataProcessor {
	private app: App;
	private plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * 過去1ヶ月のデータをフィルタリング
	 */
	private filterPastMonth(entries: ActivityEntry[]): ActivityEntry[] {
		const now = new Date();
		const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		return entries.filter(entry => {
			const entryDate = new Date(entry.timestamp);
			return entryDate >= oneMonthAgo && entryDate <= now;
		});
	}

	/**
	 * タイムスタンプから日付文字列を取得 (YYYY-MM-DD形式)
	 */
	private formatDate(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toISOString().split('T')[0];
	}

	/**
	 * 日付文字列から曜日番号を取得 (0=日, 1=月, ..., 6=土)
	 */
	private getDayOfWeek(dateStr: string): number {
		return new Date(dateStr + 'T00:00:00Z').getUTCDay();
	}

	/**
	 * 日付文字列から週番号を取得 (該当月内での相対週)
	 */
	private getWeekNumber(dateStr: string, startDate: Date): number {
		const date = new Date(dateStr + 'T00:00:00Z');
		const diffTime = date.getTime() - startDate.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		return Math.floor(diffDays / 7);
	}

	/**
	 * data.jsonを読み込む
	 */
	async loadActivityData(): Promise<ActivityEntry[]> {
		try {
			const dataPath = `${this.plugin.manifest.dir}/data.json`;
			const fileContent = await this.app.vault.adapter.read(dataPath);
			const data = JSON.parse(fileContent);

			if (!Array.isArray(data)) {
				console.warn('data.json is not an array');
				return [];
			}

			return data as ActivityEntry[];
		} catch (err) {
			console.error('Error loading activity data:', err);
			return [];
		}
	}

	/**
	 * セッションデータを日別に集計
	 */
	aggregateByDate(entries: ActivityEntry[]): DailyStats[] {
		const dailyMap: Record<string, { added: number; deleted: number }> = {};

		// 日付でグループ化
		entries.forEach(entry => {
			const date = this.formatDate(entry.timestamp);
			if (!dailyMap[date]) {
				dailyMap[date] = { added: 0, deleted: 0 };
			}
			dailyMap[date].added += entry.added;
			dailyMap[date].deleted += entry.deleted;
		});

		// 日付順でソート、DailyStats配列に変換
		return Object.entries(dailyMap)
			.sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
			.map(([date, stats]) => ({
				date,
				added: stats.added,
				deleted: stats.deleted,
				total: stats.added + stats.deleted,
			}));
	}

	/**
	 * 完全な処理パイプライン
	 */
	async getDailyStats(): Promise<DailyStats[]> {
		const allData = await this.loadActivityData();
		const filtered = this.filterPastMonth(allData);
		return this.aggregateByDate(filtered);
	}

	/**
	 * ヒートマップ用データ生成 (GitHub草風)
	 */
	async generateHeatmapData(): Promise<HeatmapData[]> {
		const dailyStats = await this.getDailyStats();
		if (dailyStats.length === 0) return [];

		// 開始日を取得（最も古い日付）
		const startDate = new Date(dailyStats[0].date + 'T00:00:00Z');
		const heatmapData: HeatmapData[] = [];

		dailyStats.forEach(stat => {
			heatmapData.push({
				date: stat.date,
				weekday: this.getDayOfWeek(stat.date),
				week: this.getWeekNumber(stat.date, startDate),
				activity: stat.total, // 入力+削除の合計
			});
		});

		return heatmapData;
	}

	/**
	 * 折れ線グラフ用データ生成 (入力・削除の推移)
	 */
	async generateLineChartData(): Promise<ChartData> {
		const dailyStats = await this.getDailyStats();

		return {
			labels: dailyStats.map(s => s.date),
			datasets: [
				{
					label: '入力文字数',
					data: dailyStats.map(s => s.added),
					borderColor: '#4CAF50',
					backgroundColor: 'rgba(76, 175, 80, 0.1)',
					fill: true,
					tension: 0.4,
				},
				{
					label: '削除文字数',
					data: dailyStats.map(s => s.deleted),
					borderColor: '#f44336',
					backgroundColor: 'rgba(244, 67, 54, 0.1)',
					fill: true,
					tension: 0.4,
				},
			],
		};
	}

	/**
	 * 棒グラフ用データ生成 (日別操作量)
	 */
	async generateBarChartData(): Promise<ChartData> {
		const dailyStats = await this.getDailyStats();

		return {
			labels: dailyStats.map(s => s.date),
			datasets: [
				{
					label: '操作合計',
					data: dailyStats.map(s => s.total),
					backgroundColor: 'rgba(33, 150, 243, 0.8)',
				},
			],
		};
	}
}
