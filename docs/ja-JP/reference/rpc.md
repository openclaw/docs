---
read_when:
    - 外部 CLI 統合を追加または変更している場合
    - RPC adapter（signal-cli、imsg）をデバッグしている場合
summary: 外部 CLI 向け RPC adapter（signal-cli、旧来 imsg）と gateway パターン
title: RPC adapter
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:18:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw は JSON-RPC を通じて外部 CLI を統合します。現在は 2 つのパターンが使われています。

## パターン A: HTTP daemon（signal-cli）

- `signal-cli` は、HTTP 上の JSON-RPC を使う daemon として動作します。
- イベントストリームは SSE（`/api/v1/events`）です。
- ヘルス probe: `/api/v1/check`。
- `channels.signal.autoStart=true` の場合、OpenClaw がライフサイクルを所有します。

セットアップとエンドポイントについては [Signal](/ja-JP/channels/signal) を参照してください。

## パターン B: stdio 子プロセス（旧来: imsg）

> **Note:** 新しい iMessage セットアップには、代わりに [BlueBubbles](/ja-JP/channels/bluebubbles) を使ってください。

- OpenClaw は `imsg rpc` を子プロセスとして起動します（旧来の iMessage 統合）。
- JSON-RPC は stdin / stdout 上で行区切りです（1 行に 1 JSON オブジェクト）。
- TCP ポートも daemon も不要です。

使われるコアメソッド:

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（probe / diagnostics）

旧来セットアップとアドレッシング（`chat_id` 推奨）については [iMessage](/ja-JP/channels/imessage) を参照してください。

## adapter ガイドライン

- Gateway がプロセスを所有する（起動 / 停止は provider ライフサイクルに連動）。
- RPC client は回復力を持たせる: timeout、終了時の再起動。
- 表示文字列より安定 ID（例: `chat_id`）を優先する。

## 関連

- [Gateway protocol](/ja-JP/gateway/protocol)
