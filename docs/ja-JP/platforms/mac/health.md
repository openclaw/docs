---
read_when:
    - macアプリのヘルスインジケーターのデバッグ
summary: OpenClawのmacOSアプリがGateway/チャンネルの健全性状態を報告する方法
title: ヘルスチェック（macOS）
x-i18n:
    generated_at: "2026-07-05T11:35:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS のヘルスチェック

メニューバーアプリからリンク済みチャネルのヘルス状態を読み取る方法。

## メニューバー

ステータスドット:

- 緑: リンク済み + プローブ正常。
- オレンジ: リンク済みだが、チャネルプローブが劣化/未接続を報告している。
- 赤: まだリンクされていない。

セカンダリ行には「リンク済み · 認証 12分」と表示されるか、失敗理由が表示されます。
メニューの「今すぐヘルスチェックを実行」は、オンデマンドのプローブをトリガーします。

## 設定

- 一般タブにはヘルスカードが表示されます: ステータスドット、概要行（リンク状態 +
  認証経過時間）、任意の失敗詳細行、そして **今すぐ再試行** と
  **ログを開く** ボタン。
- **チャネルタブ** には、WhatsApp と Telegram のチャネルごとのステータスとコントロール（ログイン QR、
  ログアウト、プローブ、最後の切断/エラー）が表示されます。

## プローブの仕組み

アプリは既存の WebSocket 接続（CLI シェルアウトではない）経由で、Gateway の `health` RPC を
約 60 秒ごとおよびオンデマンドで呼び出します。RPC は
認証情報を読み込み、メッセージを送信せずにステータスを報告します。アプリは最後の
正常なスナップショットと最後のエラーを別々にキャッシュするため、UI は即座に読み込まれ、
オフライン中もちらつきません。

## 迷ったとき

[Gateway ヘルス](/ja-JP/gateway/health) の CLI フロー（`openclaw status`,
`openclaw status --deep`, `openclaw health --json`）を使用し、
`/tmp/openclaw/openclaw-*.log` を tail して、`web-heartbeat` / `web-reconnect` でフィルタリングします。

## 関連

- [Gateway ヘルス](/ja-JP/gateway/health)
- [macOS アプリ](/ja-JP/platforms/macos)
