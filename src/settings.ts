export interface MyPluginSettings {
	showInStatusBar: boolean;
	showNotification: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	showInStatusBar: true,
	showNotification: true,
};
