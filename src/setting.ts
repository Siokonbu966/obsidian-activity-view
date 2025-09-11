import { PluginSettingTab, App, Setting } from 'obsidian';

export interface TypingStatsSettings {
  dataFilePath: string; // 保存先
  ignoreLargeChangeThreshold: number; // 一度にこれ以上の変化は無視する
  maxDisplayDays: number; // View に表示する最大日数
}

export const DEFAULT_SETTINGS: TypingStatsSettings = {
  dataFilePath: '.typing-logger/aggregates.json',
  ignoreLargeChangeThreshold: 5000,
  maxDisplayDays: 30,
};

export class TypingStatsSettingTab extends PluginSettingTab {
  plugin: any;
  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Typing Stats 設定' });

    new Setting(containerEl)
      .setName('集計データ保存パス')
      .setDesc('Vault 内で集計データを保存するパス（例: .typing-logger/aggregates.json）')
      .addText(text =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.dataFilePath)
          .setValue(this.plugin.settings.dataFilePath)
          .onChange(async (value) => {
            this.plugin.settings.dataFilePath = value.trim() || DEFAULT_SETTINGS.dataFilePath;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('一度に無視する大きな変更閾値')
      .setDesc('一度の change でこれ以上の文字数変化がある場合はログに記録しません（例: 大量貼り付け回避）')
      .addText(text =>
        text
          .setValue(String(this.plugin.settings.ignoreLargeChangeThreshold))
          .onChange(async (value) => {
            const n = Number(value) || DEFAULT_SETTINGS.ignoreLargeChangeThreshold;
            this.plugin.settings.ignoreLargeChangeThreshold = n;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('View に表示する最大日数')
      .setDesc('日別集計で表示する日数（例: 30）')
      .addText(text =>
        text
          .setValue(String(this.plugin.settings.maxDisplayDays))
          .onChange(async (value) => {
            const n = Math.max(1, Number(value) || DEFAULT_SETTINGS.maxDisplayDays);
            this.plugin.settings.maxDisplayDays = n;
            await this.plugin.saveSettings();
          })
      );
  }
}