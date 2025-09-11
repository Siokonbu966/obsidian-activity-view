import { ItemView, WorkspaceLeaf, ButtonComponent } from "obsidian";
import { Logger } from "../utils/logger";

export const VIEW_TYPE_LOG = "debug-log-view";

export class LogView extends ItemView {
  private unsubscribe?: () => void;

  constructor(leaf: WorkspaceLeaf, private logger: Logger) {
    super(leaf);
    // 新しいイベントエミッター方式でリスナー登録
    this.unsubscribe = logger.on('update', () => this.update());
  }

  getViewType(): string {
    return VIEW_TYPE_LOG;
  }

  getDisplayText(): string {
    return "デバッグログ";
  }

  async onOpen() {
    this.update();
  }

  async onClose() {
    // メモリリーク防止のためリスナー削除
    this.unsubscribe?.();
  }

  update() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();

    // ログ内容表示
    const debugInfo = container.createEl("div", {
      text: `リスナー数： ${this.logger.getListenerCount('update')}`,
      cls: "debug-info"
    })

    const logBox = container.createEl("textarea", {
      cls: "debug-log-box",
      attr: { readonly: "true", rows: 20, style: "width:100%;" },
      text: this.logger.getAll().join("\n"),
    });

    // クリアボタン
    new ButtonComponent(container)
      .setButtonText("クリア")
      .onClick(() => this.logger.clear());

    // コピー
    new ButtonComponent(container)
      .setButtonText("コピー")
      .onClick(() => {
        navigator.clipboard.writeText(this.logger.getAll().join("\n"));
      });
  }
}
