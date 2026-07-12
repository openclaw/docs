---
read_when:
    - 外部 CLI 連携の追加または変更
    - RPC アダプター（signal-cli、imsg）のデバッグ
summary: 外部 CLI（signal-cli、imsg）向け RPC アダプターと Gateway パターン
title: RPC アダプター
x-i18n:
    generated_at: "2026-07-11T22:40:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw は JSON-RPC を介して外部 CLI と統合します。現在、2 つのパターンが使用されています。

## パターン A: HTTP デーモン（signal-cli）

- `signal-cli` は、HTTP 経由の JSON-RPC を使用するデーモンとして動作します。
- イベントストリームは SSE（`/api/v1/events`）です。
- ヘルスプローブ: `/api/v1/check`。
- `channels.signal.autoStart=true` の場合、OpenClaw がライフサイクルを管理します。

セットアップとエンドポイントについては、[Signal](/ja-JP/channels/signal)を参照してください。

## パターン B: stdio 子プロセス（imsg）

- OpenClaw は、[iMessage](/ja-JP/channels/imessage)用の子プロセスとして `imsg rpc` を起動します。
- JSON-RPC は stdin/stdout 経由で行区切り形式（1 行につき 1 つの JSON オブジェクト）で送受信されます。
- TCP ポートもデーモンも不要です。

使用される主要なメソッド:

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（プローブ/診断）

セットアップとアドレス指定（表示文字列より `chat_id` を推奨）については、[iMessage](/ja-JP/channels/imessage)を参照してください。

## アダプターのガイドライン

- Gateway がプロセスを管理します（開始/停止はプロバイダーのライフサイクルに連動します）。
- RPC クライアントの耐障害性を維持します。タイムアウトを設定し、終了時に再起動してください。
- 表示文字列より安定した ID（例: `chat_id`）を優先してください。

## 関連項目

- [Gateway プロトコル](/ja-JP/gateway/protocol)
