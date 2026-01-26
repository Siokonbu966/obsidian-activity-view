export class SessionTracker {
	addedCharacters = 0;
	deletedCharacters = 0;
	lastContent = "";
	sessionStartTime: number = Date.now();

	/**
	 * @description エディタの変更内容を検出して、入力・削除の数を更新
	 * @param currentContent - 現在のエディタ内容
	 */
	updateFormContent(currentContent: string) {
		const currentLength = currentContent.length;
		const lastLength = this.lastContent.length;
		const difference = currentLength - lastLength;

		if (difference > 0) {
			this.addedCharacters += difference;
		} else if (difference < 0) {
			this.deletedCharacters += Math.abs(difference);
		}

		this.lastContent = currentContent;
	}

	/**
	 * @description セッションをリセット
	 */
	reset() {
		this.addedCharacters = 0;
		this.deletedCharacters = 0;
		this.lastContent = "";
		this.sessionStartTime = Date.now();
	}

	/**
	 * @description セッション統計を取得
	 */
	getStats() {
		return {
			added: this.addedCharacters,
			deleted: this.deletedCharacters,
			sessionDuration: Date.now() - this.sessionStartTime,
		};
	}
}
