---
read_when:
    - メッセージングチャネル Plugin の受信パスを構築またはリファクタリングしています
    - 共有の受信コンテキスト構築、セッション記録、または準備済み返信の送信が必要です
    - 古いチャンネルターンヘルパーを inbound/message API に移行しています
summary: チャンネル Plugin 向け受信イベントヘルパー：コンテキスト構築、共有ランナーのオーケストレーション、セッションレコード、準備済み返信のディスパッチ
title: チャネル受信 API
x-i18n:
    generated_at: "2026-07-11T22:33:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

チャネルの受信パスは、次の 1 つのフローに従います。

```text
プラットフォームイベント -> 受信ファクト/コンテキスト -> エージェントの応答 -> メッセージ配信
```

受信イベントの正規化、フォーマット、ルート、およびオーケストレーションには `openclaw/plugin-sdk/channel-inbound` を使用します。ネイティブ送信、受領情報、永続的な配信、およびライブプレビューの動作には `openclaw/plugin-sdk/channel-outbound` を使用します。

## コアヘルパー

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: 正規化されたチャネルのファクトをプロンプト/セッションコンテキストに投影します。チャネルが所有する送信者/チャットのメタデータを `channelContext` 経由で渡します。Plugin フックからは `ctx.channelContext` として参照できます。チャネル固有のフィールドについては、このサブパスの `PluginHookChannelSenderContext` または `PluginHookChannelChatContext` を拡張します。
- `runChannelInboundEvent(...)`: 1 つの受信プラットフォームイベントについて、取り込み、分類、事前チェック、解決、記録、ディスパッチ、および完了処理を実行します。
- `dispatchChannelInboundReply(...)`: すでに組み立てられた受信応答を、配信アダプターを使用して記録およびディスパッチします。

注入された Plugin ランタイムオブジェクトをすでに受け取っている同梱/ネイティブチャネルは、このサブパスを直接インポートする代わりに、`runtime.channel.inbound.*` 配下の同じヘルパーを呼び出せます。

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

プラットフォームへの配信を配信アダプター内に保持する互換ディスパッチャーでは、`dispatchChannelInboundReply(...)` の入力を組み立てます。新しい送信パスでは、代わりに `channel-outbound` のメッセージアダプターと永続的なメッセージヘルパーを使用してください。

## 移行

`runtime.channel.turn.*` ランタイムエイリアスは削除されました。次を使用してください。

- 生の受信イベントには `runtime.channel.inbound.run(...)`。
- 組み立て済みの応答コンテキストには `runtime.channel.inbound.dispatchReply(...)`。
- 受信コンテキストのペイロードには `runtime.channel.inbound.buildContext(...)`。
- `runtime.channel.inbound.runPreparedReply(...)` は非推奨であり、独自のディスパッチクロージャをすでに組み立てる、チャネル所有の準備済みディスパッチパスにのみ使用します。

新しい Plugin コードに、`turn` という名前のチャネル API を導入しないでください。モデルまたはエージェントのターンという語彙はエージェント/プロバイダーコード内に限定し、チャネル Plugin では受信、メッセージ、配信、および応答という用語を使用します。
