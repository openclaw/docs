---
read_when:
    - 外部 CLI 連携の追加または変更
    - RPC アダプターのデバッグ (signal-cli, imsg)
summary: 外部 CLI（signal-cli、imsg）向けの RPC アダプターと Gateway パターン
title: RPC アダプター
x-i18n:
    generated_at: "2026-05-07T01:53:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw は JSON-RPC 経由で外部 CLI と統合します。現在は 2 つのパターンが使われています。

## パターン A: HTTP デーモン (signal-cli)

- `signal-cli` は HTTP 上の JSON-RPC を使うデーモンとして実行されます。
- イベントストリームは SSE (`/api/v1/events`) です。
- ヘルスプローブ: `/api/v1/check`。
- `channels.signal.autoStart=true` の場合、ライフサイクルは OpenClaw が管理します。

セットアップとエンドポイントについては [Signal](/ja-JP/channels/signal) を参照してください。

## パターン B: stdio 子プロセス (レガシー: imsg)

> **注:** 新しい iMessage セットアップでは、代わりに [BlueBubbles](/ja-JP/channels/bluebubbles) を使用してください。

- OpenClaw は `imsg rpc` を子プロセスとして起動します (レガシー iMessage 統合)。
- JSON-RPC は stdin/stdout 上で行区切りです (1 行につき 1 つの JSON オブジェクト)。
- TCP ポートもデーモンも不要です。

使用されるコアメソッド:

- `watch.subscribe` → 通知 (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (プローブ/診断)

レガシーセットアップとアドレッシング (`chat_id` 推奨) については [iMessage](/ja-JP/channels/imessage) を参照してください。

## アダプターのガイドライン

- Gateway がプロセスを管理します (開始/停止はプロバイダーのライフサイクルに連動します)。
- RPC クライアントは回復力を持たせます: タイムアウト、終了時の再起動。
- 表示文字列よりも安定した ID (例: `chat_id`) を優先します。

## 関連

- [Gateway プロトコル](/ja-JP/gateway/protocol)
