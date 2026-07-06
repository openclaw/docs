---
read_when:
    - メッセージングチャネルPluginの送信パスを構築またはリファクタリングしている
    - 耐久性のある最終返信の配信、受領確認、ライブプレビューの確定、または受信確認ポリシーが必要です
    - channel-message、channel-message-runtime、またはレガシーの返信ディスパッチヘルパーから移行している
summary: 'チャネル Plugin 向けアウトバウンドメッセージライフサイクル API: アダプター、受領情報、耐久送信、ライブプレビュー、返信パイプラインヘルパー'
title: Channel アウトバウンド API
x-i18n:
    generated_at: "2026-07-06T10:50:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dea22c6a8de9a90a9ea182b18d922711e332efcd97ff429c7bc95d5807a7d1ad
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

チャネルPluginは、`openclaw/plugin-sdk/channel-outbound` からアウトバウンドメッセージの動作を公開します。受信、コンテキスト、ディスパッチのオーケストレーションには `openclaw/plugin-sdk/channel-inbound` を使用します。

コアはキューイング、耐久性、汎用リトライポリシー、フック、受領情報、共有 `message` ツールを所有します。Pluginはネイティブの送信、編集、削除呼び出し、ターゲットの正規化、プラットフォームのスレッド処理、選択された引用、通知フラグ、アカウント状態、プラットフォーム固有の副作用を所有します。

## アダプター

ほとんどのPluginは 1 つの `message` アダプターを定義します。

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

ネイティブトランスポートが実際に保持する機能だけを宣言してください。宣言した各送信、受領情報、ライブプレビュー、受信確認機能は、このサブパスからエクスポートされる契約ヘルパーでカバーしてください。

## 配信エビデンス

`MessageReceipt` はチャネルアダプターが返した結果を記録します。具体的なプラットフォームメッセージ識別子は、プラットフォームの送信パスがメッセージを受け入れたことを示しますが、受信者のデバイスに表示された、または読まれたことを証明するものではありません。プラットフォームメッセージ識別子のない受領情報は、ローカルの受領メタデータにすぎません。既読受領情報またはデバイス配信状態を持つチャネルは、それらの事実を別のチャネル固有のパスで追跡する必要があります。

## 既存のアウトバウンドアダプター

チャネルに互換性のある `outbound` アダプターがすでにある場合は、送信コードを重複させるのではなく、メッセージアダプターを派生させてください。

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

## 永続送信

ランタイム送信ヘルパーも `channel-outbound` にあります。

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- `resolveChannelDraftStreamingChunking(...)` などのドラフトストリーミング/進捗ヘルパー

`sendDurableMessageBatch(...)` は 1 つの明示的な結果を返します。

| 結果             | 意味                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | 少なくとも 1 つの表示可能なプラットフォームメッセージが、プラットフォーム送信パスに受け入れられた |
| `suppressed`     | プラットフォームメッセージを欠落として扱うべきではない                                  |
| `partial_failed` | 後続のペイロードまたは副作用が失敗する前に、少なくとも 1 つのプラットフォームメッセージが受け入れられた |
| `failed`         | プラットフォーム受領情報が生成されなかった                                              |

バッチに送信済み、抑制済み、失敗したペイロードが混在する場合は `payloadOutcomes` を使用してください。空のレガシー直接配信結果からフックのキャンセルを推測しないでください。

## 互換性ディスパッチ

インバウンド返信ディスパッチは、`channel-inbound` の `dispatchChannelInboundReply(...)` を通じて組み立ててください。プラットフォーム配信は配信アダプターに保持し、メッセージアダプター、永続送信、受領情報、ライブプレビュー、返信パイプラインオプションには `channel-outbound` を使用してください。
