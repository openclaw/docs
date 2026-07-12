---
read_when:
    - Macアプリのヘルスインジケーターのデバッグ
summary: macOS アプリでの Gateway／チャンネルの稼働状態の表示方法
title: ヘルスチェック（macOS）
x-i18n:
    generated_at: "2026-07-11T22:24:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS のヘルスチェック

メニューバーアプリで、リンク済みチャネルのヘルス状態を確認する方法です。

## メニューバー

ステータスドット：

- 緑：リンク済みで、プローブは正常です。
- オレンジ：リンク済みですが、チャネルプローブが機能低下または未接続を報告しています。
- 赤：まだリンクされていません。

2 行目には「リンク済み · 認証 12 分前」と表示されるか、失敗の理由が表示されます。
メニューの「今すぐヘルスチェックを実行」を選択すると、オンデマンドのプローブが実行されます。

## 設定

- 「一般」タブにはヘルスカードが表示されます。ステータスドット、概要行（リンク状態 +
  認証からの経過時間）、任意の失敗詳細行、および **今すぐ再試行** と
  **ログを開く** ボタンが含まれます。
- **チャネルタブ**には、WhatsApp と Telegram のチャネルごとの状態と操作（ログイン用 QR コード、
  ログアウト、プローブ、最後の切断／エラー）が表示されます。

## プローブの仕組み

アプリは、既存の WebSocket 接続を介して Gateway の `health` RPC を
約 60 秒ごと、およびオンデマンドで呼び出します（CLI のシェルアウトは使用しません）。RPC は
認証情報を読み込み、メッセージを送信せずに状態を報告します。アプリは直近の
正常なスナップショットと直近のエラーを個別にキャッシュするため、UI は即座に読み込まれ、
オフライン中もちらつきません。

## 判断に迷う場合

[Gateway のヘルス](/ja-JP/gateway/health)に記載されている CLI の手順（`openclaw status`、
`openclaw status --deep`、`openclaw health --json`）を使用し、
`/tmp/openclaw/openclaw-*.log` を追跡して、`web-heartbeat` / `web-reconnect` で絞り込んでください。

## 関連項目

- [Gateway のヘルス](/ja-JP/gateway/health)
- [macOS アプリ](/ja-JP/platforms/macos)
