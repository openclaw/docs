---
read_when:
    - メッセージングチャンネル Plugin の送信パスを構築またはリファクタリングしている
    - 耐久性のある最終返信配信、受信確認、ライブプレビューの確定、または受信確認ポリシーが必要な場合
    - channel-message、channel-message-runtime、またはレガシーの返信ディスパッチヘルパーから移行しています
summary: 'チャネル Plugin 向けアウトバウンドメッセージライフサイクル API: アダプター、受信確認、永続送信、ライブプレビュー、返信パイプラインヘルパー'
title: チャネル送信 API
x-i18n:
    generated_at: "2026-07-05T11:36:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d85846fcfbc8d2119794dff83c851a746f696ba8273b3d0c872377a429bfe8
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channel Plugin は、`openclaw/plugin-sdk/channel-outbound` からアウトバウンドメッセージ動作を公開します。受信/コンテキスト/ディスパッチのオーケストレーションには `openclaw/plugin-sdk/channel-inbound` を使用します。

コアは、キューイング、耐久性、汎用リトライポリシー、フック、受領情報、共有 `message` ツールを所有します。Plugin は、ネイティブの送信/編集/削除呼び出し、宛先の正規化、プラットフォームのスレッド処理、選択された引用、通知フラグ、アカウント状態、プラットフォーム固有の副作用を所有します。

## アダプター

ほとんどの Plugin は 1 つの `message` アダプターを定義します。

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

ネイティブトランスポートが実際に保持する機能だけを宣言してください。宣言した各送信、受領情報、ライブプレビュー、受信 ack 機能は、このサブパスからエクスポートされる契約ヘルパーでカバーします。

## 既存のアウトバウンドアダプター

チャンネルに互換性のある `outbound` アダプターがすでにある場合は、送信コードを重複させずにメッセージアダプターを派生させます。

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## 耐久送信

ランタイム送信ヘルパーも `channel-outbound` にあります。

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- `resolveChannelDraftStreamingChunking(...)` などのドラフトストリーミング/進捗ヘルパー

`sendDurableMessageBatch(...)` は 1 つの明示的な結果を返します。

| 結果             | 意味                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `sent`           | 少なくとも 1 つの表示可能なプラットフォームメッセージが配信された                       |
| `suppressed`     | プラットフォームメッセージがないことを欠落として扱うべきではない                       |
| `partial_failed` | 後続のペイロードまたは副作用が失敗する前に、少なくとも 1 つのプラットフォームメッセージが配信された |
| `failed`         | プラットフォーム受領情報が生成されなかった                                               |

バッチに、送信済み、抑制済み、失敗したペイロードが混在する場合は `payloadOutcomes` を使用します。空のレガシー直接配信結果からフックのキャンセルを推測しないでください。

## 互換性ディスパッチ

インバウンド返信ディスパッチは、`channel-inbound` の `dispatchChannelInboundReply(...)` で組み立てます。プラットフォーム配信は配信アダプター内に保ち、メッセージアダプター、耐久送信、受領情報、ライブプレビュー、返信パイプラインオプションには `channel-outbound` を使用します。
