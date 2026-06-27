---
read_when:
    - メッセージングチャネルPluginの受信パスを構築またはリファクタリングしている
    - 共有のインバウンドコンテキスト構築、セッション記録、または準備済み返信のディスパッチが必要な場合
    - 古いチャネルターンヘルパーをインバウンド/メッセージ API に移行しています
summary: 'チャネルPlugin向けの受信イベントヘルパー: コンテキスト構築、共有ランナーのオーケストレーション、セッションレコード、準備済み返信ディスパッチ'
title: チャネル受信 API
x-i18n:
    generated_at: "2026-06-27T12:30:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Channel plugins は、受信パスを inbound と message の名詞でモデル化する必要があります。

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

受信イベントの正規化、フォーマット、ルート、オーケストレーションには `openclaw/plugin-sdk/channel-inbound` を使用します。
ネイティブな送信、受領、永続的デリバリー、ライブプレビュー動作には
`openclaw/plugin-sdk/channel-outbound` を使用します。

## コアヘルパー

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: 正規化されたチャンネルのファクトを
  プロンプト/セッションコンテキストへ投影します。`channelContext` を使用して、チャンネル所有の
  送信者/チャットメタデータを Plugin hook `ctx.channelContext` に渡します。
  チャンネル固有フィールドには、このサブパスの
  `PluginHookChannelSenderContext` または `PluginHookChannelChatContext` を拡張します。
- `runChannelInboundEvent(...)`: 1 つの受信プラットフォームイベントについて、取り込み、分類、事前確認、解決、
  記録、ディスパッチ、完了処理を実行します。
- `dispatchChannelInboundReply(...)`: すでに組み立て済みの受信返信を、デリバリーアダプターで記録してディスパッチします。

注入された Plugin ランタイムは、すでにランタイムオブジェクトを受け取っているバンドル/ネイティブチャンネル向けに、
同じ高レベルヘルパーを `runtime.channel.inbound.*` の下で公開します。

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

互換ディスパッチャーは `dispatchChannelInboundReply(...)` の入力を組み立て、
プラットフォームデリバリーはデリバリーアダプター内に保つ必要があります。新しい送信パスでは、
message アダプターと永続的 message ヘルパーを優先してください。

## 移行

古い `runtime.channel.turn.*` ランタイムエイリアスは削除されました。以下を使用してください。

- 生の受信イベントには `runtime.channel.inbound.run(...)`。
- 組み立て済み返信コンテキストには `runtime.channel.inbound.dispatchReply(...)`。
- 受信コンテキストペイロードには `runtime.channel.inbound.buildContext(...)`。
- すでに独自のディスパッチクロージャーを組み立てている、チャンネル所有の準備済み
  ディスパッチパスにのみ `runtime.channel.inbound.runPreparedReply(...)`。

新しい Plugin コードでは、`turn` という名前のチャンネル API を導入しないでください。モデルまたは
agent turn の語彙は agent/provider コード内に保ち、channel plugins では inbound、
message、delivery、reply の用語を使用します。
