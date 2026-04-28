---
read_when:
    - mac アプリのヘルスインジケーターをデバッグする դեպքում
summary: macOS アプリが Gateway/Baileys のヘルス状態をどのように報告するか
title: ヘルスチェック（macOS）
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:08:23Z"
  model: gpt-5.4
  provider: openai
  source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
  source_path: platforms/mac/health.md
  workflow: 15
---

# macOS でのヘルスチェック

メニューバーアプリから、リンク済みチャネルが健全かどうかを確認する方法です。

## メニューバー

- ステータスドットは現在、Baileys のヘルスを反映します:
  - 緑: リンク済みで、最近ソケットが開かれた。
  - オレンジ: 接続中/再試行中。
  - 赤: ログアウト済み、またはプローブ失敗。
- 2 行目には「linked · auth 12m」と表示されるか、失敗理由が表示されます。
- 「Run Health Check」メニュー項目でオンデマンドプローブを実行します。

## 設定

- General タブに Health カードが追加され、次を表示します: linked auth の経過時間、session-store パス/件数、最終チェック時刻、最新エラー/ステータスコード、および Run Health Check / Reveal Logs ボタン。
- キャッシュ済みスナップショットを使うため、UI は即座に読み込まれ、オフライン時にも穏当にフォールバックします。
- **Channels タブ**では、WhatsApp/Telegram 用にチャネル状態 + コントロール（login QR、logout、probe、最後の disconnect/error）を表示します。

## プローブの動作

- アプリは `ShellExecutor` 経由で `openclaw health --json` を約 60 秒ごと、およびオンデマンドで実行します。プローブは creds を読み込み、メッセージを送信せずに状態を報告します。
- ちらつきを避けるため、最後に成功したスナップショットと最後のエラーを別々にキャッシュし、それぞれのタイムスタンプを表示します。

## 判断に迷うとき

- [Gateway health](/ja-JP/gateway/health) の CLI フロー（`openclaw status`、`openclaw status --deep`、`openclaw health --json`）は引き続き使えます。また、`/tmp/openclaw/openclaw-*.log` を tail して `web-heartbeat` / `web-reconnect` を確認してください。

## 関連

- [Gateway health](/ja-JP/gateway/health)
- [macOS アプリ](/ja-JP/platforms/macos)
