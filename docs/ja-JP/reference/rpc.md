---
read_when:
    - 外部 CLI 統合を追加または変更する
    - RPC アダプターのデバッグ (signal-cli, imsg)
summary: 外部 CLI（signal-cli、imsg）向け RPC アダプターと Gateway パターン
title: RPC アダプター
x-i18n:
    generated_at: "2026-05-10T19:51:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw は JSON-RPC 経由で外部 CLI を統合します。現在は 2 つのパターンが使われています。

## パターン A: HTTP デーモン (signal-cli)

- `signal-cli` は HTTP 経由の JSON-RPC を備えたデーモンとして動作します。
- イベントストリームは SSE (`/api/v1/events`) です。
- ヘルスプローブ: `/api/v1/check`。
- `channels.signal.autoStart=true` の場合、OpenClaw がライフサイクルを所有します。

セットアップとエンドポイントについては、[Signal](/ja-JP/channels/signal) を参照してください。

## パターン B: stdio 子プロセス (imsg)

- OpenClaw は [iMessage](/ja-JP/channels/imessage) 用に `imsg rpc` を子プロセスとして起動します。
- JSON-RPC は stdin/stdout 上で行区切りです (1 行につき 1 つの JSON オブジェクト)。
- TCP ポートもデーモンも不要です。

使用されるコアメソッド:

- `watch.subscribe` → 通知 (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (プローブ/診断)

従来のセットアップとアドレス指定 (`chat_id` 推奨) については、[iMessage](/ja-JP/channels/imessage) を参照してください。

## アダプターのガイドライン

- Gateway がプロセスを所有します (開始/停止はプロバイダーのライフサイクルに連動)。
- RPC クライアントは堅牢に保ってください: タイムアウト、終了時の再起動。
- 表示文字列よりも安定した ID (例: `chat_id`) を優先してください。

## 関連

- [Gateway protocol](/ja-JP/gateway/protocol)
