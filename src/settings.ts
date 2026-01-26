export interface MyPluginSettings {
	showInStatusBar: boolean;
	showNotification: boolean;

	// session stats
	lastSessionStats?: {
		added: number;
		deleted: number;
		date: string;
	};
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	showInStatusBar: true,
	showNotification: true,
	lastSessionStats: undefined,
};
