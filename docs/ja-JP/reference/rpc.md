---
read_when:
    - 外部 CLI 統合の追加または変更
    - RPC アダプター (signal-cli, imsg) のデバッグ
summary: 外部 CLI（signal-cli、imsg）向けの RPC アダプターと gateway パターン
title: RPC アダプター
x-i18n:
    generated_at: "2026-07-05T11:45:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw は JSON-RPC 経由で外部 CLI と統合します。現在は 2 つのパターンが使われています。

## パターン A: HTTP デーモン (signal-cli)

- `signal-cli` は HTTP 経由の JSON-RPC を備えたデーモンとして実行されます。
- イベントストリームは SSE (`/api/v1/events`) です。
- ヘルスプローブ: `/api/v1/check`。
- `channels.signal.autoStart=true` の場合、OpenClaw がライフサイクルを所有します。

セットアップとエンドポイントについては [Signal](/ja-JP/channels/signal) を参照してください。

## パターン B: stdio 子プロセス (imsg)

- OpenClaw は [iMessage](/ja-JP/channels/imessage) 用の子プロセスとして `imsg rpc` を起動します。
- JSON-RPC は stdin/stdout 上で行区切りです (1 行につき 1 つの JSON オブジェクト)。
- TCP ポートもデーモンも不要です。

使用されるコアメソッド:

- `watch.subscribe` → 通知 (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (プローブ/診断)

セットアップとアドレス指定については [iMessage](/ja-JP/channels/imessage) を参照してください (表示文字列より `chat_id` を推奨)。

## アダプターのガイドライン

- Gateway がプロセスを所有します (開始/停止はプロバイダーのライフサイクルに紐づきます)。
- RPC クライアントの回復性を保ちます: タイムアウト、終了時の再起動。
- 表示文字列より安定した ID (例: `chat_id`) を優先します。

## 関連

- [Gateway プロトコル](/ja-JP/gateway/protocol)
