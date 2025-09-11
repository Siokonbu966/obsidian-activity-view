export type LogEvent = 'update' | 'clear' | 'error';
export type LogListener = (logs: string[]) => void;

export class Logger {
  private logs: string[] = [];
  private listeners: Map<LogEvent, Set<LogListener>> = new Map();

  constructor() {
    this.listeners.set('update', new Set());
    this.listeners.set('clear', new Set());
    this.listeners.set('error', new Set());
  }

  /**
   * イベントリスナーを登録
   * @param event リッスンするイベントタイプ
   * @param listener コールバック関数
   * @returns アンサブスクライブ関数
   */
  on(event: LogEvent, listener: LogListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    
    // アンサブスクライブ関数を返す
    return () => this.off(event, listener);
  }

  /**
   * イベントリスナーを削除
   * @param event イベントタイプ
   * @param listener 削除するリスナー
   */
  off(event: LogEvent, listener: LogListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * 全てのリスナーをクリア
   * @param event 指定した場合、そのイベントのリスナーのみクリア
   */
  clearListeners(event?: LogEvent): void {
    if (event) {
      this.listeners.get(event)?.clear();
    } else {
      this.listeners.forEach(listenerSet => listenerSet.clear());
    }
  }

  /**
   * イベントを発火
   * @param event 発火するイベント
   */
  private emit(event: LogEvent): void {
    const listeners = this.listeners.get(event);
    if (listeners && listeners.size > 0) {
      // ログのコピーを作成してリスナーに渡す（不変性保証）
      const logsCopy = [...this.logs];
      
      listeners.forEach(listener => {
        try {
          listener(logsCopy);
        } catch (error) {
          console.error(`Logger listener error for event '${event}':`, error);
          // エラーイベントを発火（再帰防止のためerrorイベント以外の場合のみ）
          if (event !== 'error') {
            this.emit('error');
          }
        }
      });
    }
  }

  /**
   * ログメッセージを追加
   * @param message ログメッセージ
   */
  log(message: string): void {
    const ts = new Date().toLocaleString();
    this.logs.push(`[${ts}] ${message}`);
    this.emit('update');
  }

  /**
   * 全てのログをクリア
   */
  clear(): void {
    this.logs = [];
    this.emit('clear');
    // clearイベントの後にupdateイベントも発火（UI更新のため）
    this.emit('update');
  }

  /**
   * 全てのログを取得
   * @returns ログの配列のコピー
   */
  getAll(): string[] {
    return [...this.logs];
  }

  /**
   * 登録されているリスナー数を取得
   * @param event 指定した場合、そのイベントのリスナー数のみ返す
   * @returns リスナー数
   */
  getListenerCount(event?: LogEvent): number {
    if (event) {
      return this.listeners.get(event)?.size || 0;
    }
    
    let total = 0;
    this.listeners.forEach(listenerSet => {
      total += listenerSet.size;
    });
    return total;
  }

  /**
   * ログが空かどうかチェック
   * @returns ログが空の場合true
   */
  isEmpty(): boolean {
    return this.logs.length === 0;
  }

  /**
   * ログ数を取得
   * @returns ログの数
   */
  getLogCount(): number {
    return this.logs.length;
  }

  // 後方互換性のためのプロパティ（既存コードとの互換性保持）
  set onUpdate(callback: (() => void) | undefined) {
    if (callback) {
      this.on('update', () => callback());
    }
  }

  get onUpdate(): (() => void) | undefined {
    const listeners = this.listeners.get('update');
    return listeners && listeners.size > 0 ? () => {} : undefined;
  }
}
