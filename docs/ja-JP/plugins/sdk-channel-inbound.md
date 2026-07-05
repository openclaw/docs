---
read_when:
    - メッセージングチャネルPluginの受信パスを構築またはリファクタリングしている
    - 共有受信コンテキストの構築、セッション記録、または準備済み返信のディスパッチが必要です
    - 古いチャネルターンヘルパーを受信/メッセージ API に移行しています
summary: 'チャネルPlugin向けの受信イベントヘルパー: コンテキスト構築、共有ランナーのオーケストレーション、セッションレコード、準備済み返信のディスパッチ'
title: チャネル受信 API
x-i18n:
    generated_at: "2026-07-05T11:35:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

チャネル受信パスは1つのフローに従います。

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

インバウンドイベントの正規化、フォーマット、ルート、オーケストレーションには `openclaw/plugin-sdk/channel-inbound` を使用します。
ネイティブ送信、受信確認、永続的な配信、ライブプレビューの動作には
`openclaw/plugin-sdk/channel-outbound` を使用します。

## コアヘルパー

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: 正規化されたチャネル情報を
  プロンプト/セッションコンテキストに投影します。チャネルが所有する送信者/チャットのメタデータは
  `channelContext` 経由で渡します。Plugin フックからは `ctx.channelContext` として見えます。
  チャネル固有のフィールドには、このサブパスの `PluginHookChannelSenderContext` または
  `PluginHookChannelChatContext` を拡張します。
- `runChannelInboundEvent(...)`: 1つのインバウンドプラットフォームイベントに対して、取り込み、分類、プリフライト、解決、
  記録、ディスパッチ、完了処理を実行します。
- `dispatchChannelInboundReply(...)`: すでに組み立て済みのインバウンド返信を、配信アダプターで
  記録してディスパッチします。

注入された Plugin ランタイムオブジェクトをすでに受け取っているバンドル/ネイティブチャネルは、
このサブパスを直接インポートする代わりに、`runtime.channel.inbound.*` 配下の同じヘルパーを呼び出せます。

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

プラットフォーム配信を配信アダプター内に保持する互換ディスパッチャー向けに、
`dispatchChannelInboundReply(...)` の入力を組み立てます。新しい送信パスでは、代わりに
`channel-outbound` のメッセージアダプターと永続メッセージヘルパーを使用する必要があります。

## 移行

`runtime.channel.turn.*` ランタイムエイリアスは削除されました。次を使用してください。

- 生のインバウンドイベントには `runtime.channel.inbound.run(...)`。
- 組み立て済みの返信コンテキストには `runtime.channel.inbound.dispatchReply(...)`。
- インバウンドコンテキストペイロードには `runtime.channel.inbound.buildContext(...)`。
- `runtime.channel.inbound.runPreparedReply(...)` は非推奨で、自身の
  ディスパッチクロージャーをすでに組み立てている、チャネル所有の準備済みディスパッチパスにのみ使用します。

新しい Plugin コードでは、`turn` という名前のチャネル API を導入しないでください。モデルまたは
エージェントターンの語彙はエージェント/プロバイダーコード内にとどめます。チャネル Plugin では、inbound、
message、delivery、reply の用語を使用します。
