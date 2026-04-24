---
read_when:
    - Voice wake または PTT 経路に取り組んでいる場合
summary: mac アプリの Voice wake と push-to-talk モード、およびルーティングの詳細
title: Voice wake（macOS）
x-i18n:
    generated_at: "2026-04-24T05:08:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake と Push-to-Talk

## モード

- **ウェイクワードモード**（デフォルト）: 常時オンの Speech recognizer がトリガートークン（`swabbleTriggerWords`）を待機します。一致するとキャプチャを開始し、部分テキスト付きのオーバーレイを表示し、無音後に自動送信します。
- **Push-to-talk（右 Option 長押し）**: 右 Option キーを長押しすると即座にキャプチャします。トリガーは不要です。長押し中はオーバーレイが表示され、離すと確定され、短い遅延の後に転送されるため、テキストを微調整できます。

## ランタイム動作（ウェイクワード）

- Speech recognizer は `VoiceWakeRuntime` 内にあります。
- トリガーは、ウェイクワードと次の単語の間に **意味のある間**（約 0.55 秒のギャップ）がある場合にのみ発火します。オーバーレイ/チャイムは、コマンドが始まる前でもその間で開始されることがあります。
- 無音ウィンドウ: 発話が続いているときは 2.0 秒、トリガーだけが聞こえた場合は 5.0 秒。
- ハードストップ: 暴走セッションを防ぐため 120 秒。
- セッション間のデバウンス: 350ms。
- オーバーレイは `VoiceWakeOverlayController` により、確定/可変の色分け付きで駆動されます。
- 送信後、recognizer は次のトリガーを待つためにきれいに再起動します。

## ライフサイクル不変条件

- Voice Wake が有効で権限が付与されている場合、ウェイクワード recognizer は待機中であるべきです（明示的な push-to-talk キャプチャ中を除く）。
- オーバーレイの表示状態（X ボタンによる手動 dismiss を含む）は、recognizer の再開を妨げてはなりません。

## オーバーレイ固着の障害モード（以前）

以前は、オーバーレイが表示されたまま固着し、それを手動で閉じると、ランタイムの再起動試行がオーバーレイ表示状態によってブロックされ、その後の再起動も予定されないため、Voice Wake が「死んだ」ように見えることがありました。

ハードニング:

- ウェイクランタイムの再起動は、もはやオーバーレイ表示状態によってブロックされません。
- オーバーレイ dismiss 完了時に `VoiceSessionCoordinator` 経由で `VoiceWakeRuntime.refresh(...)` がトリガーされるため、X ボタンで手動 dismiss しても必ず待機が再開されます。

## Push-to-talk の詳細

- ホットキー検出は、**右 Option**（`keyCode 61` + `.option`）に対するグローバルな `.flagsChanged` モニターを使います。イベントは監視のみで、横取りしません。
- キャプチャパイプラインは `VoicePushToTalk` 内にあり、Speech を即時開始し、部分結果をオーバーレイへストリームし、キーを離したときに `VoiceWakeForwarder` を呼び出します。
- Push-to-talk が開始されると、音声タップの競合を避けるためにウェイクワードランタイムを一時停止します。離した後に自動再開されます。
- 権限: Microphone + Speech が必要です。イベントを見るには Accessibility/Input Monitoring の承認が必要です。
- 外付けキーボード: 期待どおりに右 Option を公開しないものもあるため、ユーザーから取りこぼし報告があれば代替ショートカットを用意してください。

## ユーザー向け設定

- **Voice Wake** トグル: ウェイクワードランタイムを有効にします。
- **Hold Cmd+Fn to talk**: push-to-talk モニターを有効にします。macOS < 26 では無効です。
- 言語とマイクの picker、ライブレベルメーター、トリガーワードテーブル、tester（ローカル専用。転送はしません）。
- マイク picker は、デバイス切断時に最後の選択を保持し、切断中ヒントを表示し、復帰するまで一時的にシステムデフォルトへフォールバックします。
- **Sounds**: トリガー検出時と送信時のチャイム。デフォルトは macOS の「Glass」システムサウンドです。各イベントごとに任意の `NSSound` 読み込み可能ファイル（例: MP3/WAV/AIFF）を選ぶか、**No Sound** を選べます。

## 転送動作

- Voice Wake が有効な場合、transcript はアクティブな gateway/agent に転送されます（mac アプリの他の部分と同じ local/remote モードを使用）。
- 返信は **最後に使用したメインプロバイダー**（WhatsApp/Telegram/Discord/WebChat）へ配信されます。配信に失敗した場合、エラーはログに記録され、実行自体は WebChat/session logs で引き続き確認できます。

## 転送ペイロード

- `VoiceWakeForwarder.prefixedTranscript(_:)` は送信前に machine hint を前置します。ウェイクワード経路と push-to-talk 経路の両方で共有されます。

## クイック検証

- Push-to-talk をオンにして Cmd+Fn を長押しし、話してから離す: オーバーレイに部分結果が表示され、その後送信されるはずです。
- 長押し中、メニューバーの耳は拡大状態のままになるはずです（`triggerVoiceEars(ttl:nil)` を使用）。離すと元に戻ります。

## 関連

- [Voice wake](/ja-JP/nodes/voicewake)
- [Voice overlay](/ja-JP/platforms/mac/voice-overlay)
- [macOS app](/ja-JP/platforms/macos)
