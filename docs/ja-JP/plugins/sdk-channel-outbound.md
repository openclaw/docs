---
read_when:
    - メッセージングチャネルPluginの送信経路を構築またはリファクタリングしている場合
    - 永続的な最終返信の配信、受領確認、ライブプレビューの確定処理、または受信確認ポリシーが必要であること
    - channel-message、channel-message-runtime、または従来の返信ディスパッチヘルパーから移行する場合
summary: チャネルPlugin向け送信メッセージライフサイクルAPI：アダプター、受領確認、永続的送信、ライブプレビュー、返信パイプラインヘルパー
title: チャンネル送信 API
x-i18n:
    generated_at: "2026-07-11T22:33:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channel Plugin は、`openclaw/plugin-sdk/channel-outbound` から送信メッセージの動作を公開します。受信、コンテキスト、ディスパッチのオーケストレーションには、`openclaw/plugin-sdk/channel-inbound` を使用します。

コアは、キューイング、永続性、汎用的な再試行ポリシー、フック、受領情報、および共有 `message` ツールを所有します。Plugin は、ネイティブの送信、編集、削除呼び出し、送信先の正規化、プラットフォームのスレッド処理、選択された引用、通知フラグ、アカウント状態、およびプラットフォーム固有の副作用を所有します。

## アダプター

ほとんどの Plugin は、1 つの `message` アダプターを定義します。

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

ネイティブトランスポートが実際に保持する機能のみを宣言してください。宣言した送信、受領情報、ライブプレビュー、および受信確認の各機能を、このサブパスからエクスポートされるコントラクトヘルパーで網羅してください。

## プレーンテキストのサニタイズ

送信アダプターが、サポートされている HTML 書式タグを軽量なテキストマークアップに変換する必要がある場合は、`sanitizeForPlainText(...)` を使用します。デフォルトでは、既存のチャット形式の太字および取り消し線マーカーが維持されます。チャンネルが結果を Markdown として再解析する場合にのみ、`{ style: "markdown" }` を渡してください。

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown スタイルでは、`**bold**` と `~~strikethrough~~` を使用します。斜体とインラインコードでは、どちらのスタイルでも `_italic_` とバッククォートのマーカーを維持します。サニタイズ後にマーカーテキストを書き換えるのではなく、チャンネル境界でスタイルを選択してください。

## 配信証拠

`MessageReceipt` は、チャンネルアダプターが返した結果を記録します。具体的なプラットフォームメッセージ識別子は、プラットフォームの送信経路がメッセージを受け付けたことを示しますが、受信者のデバイスに表示されたことや、受信者が読んだことを証明するものではありません。プラットフォームメッセージ識別子のない受領情報は、ローカルの受領メタデータにすぎません。既読確認またはデバイス配信状態を備えるチャンネルでは、それらの事実をチャンネル固有の別経路で追跡する必要があります。

チャンネルアダプターが、失敗を再試行しても受信者に見える送信が重複せず、かつ確定処理が可能な呼び出しが開始されていないことを証明できる場合は、`openclaw/plugin-sdk/error-runtime` から `new PlatformMessageNotDispatchedError("...", { cause: error })` をスローしてください。これにより、コアは古い送信試行の証拠を消去し、キューに入った意図を安全に再試行できます。この断定を行えるのは、最終ディスパッチ境界を所有するアダプターだけです。確定処理または送信の呼び出しが開始された後や、曖昧な結果が返された後には、このマーカーを決して使用しないでください。誤ってマークすると、メッセージが重複する可能性があります。

## 既存の送信アダプター

チャンネルに互換性のある `outbound` アダプターがすでに存在する場合は、送信コードを複製せずに、そこからメッセージアダプターを派生させます。

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

## 永続的な送信

ランタイムの送信ヘルパーも `channel-outbound` にあります。

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- `resolveChannelDraftStreamingChunking(...)` などの下書きストリーミングおよび進行状況ヘルパー

`sendDurableMessageBatch(...)` は、次のいずれか 1 つの明示的な結果を返します。

| 結果             | 意味                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `sent`           | 少なくとも 1 件の可視プラットフォームメッセージが、プラットフォームの送信経路で受け付けられた     |
| `suppressed`     | プラットフォームメッセージが欠落したものとして扱われるべきではない                                 |
| `partial_failed` | 後続のペイロードまたは副作用が失敗する前に、少なくとも 1 件のプラットフォームメッセージが受け付けられた |
| `failed`         | プラットフォームの受領情報が生成されなかった                                                       |

バッチに送信済み、抑制済み、失敗のペイロードが混在する場合は、`payloadOutcomes` を使用してください。空のレガシー直接配信結果から、フックのキャンセルを推測しないでください。

## 遅延配信の受け入れ判定

解決済みアカウントが、コア管理の送信または遅延配信を安全に受け入れられない場合は、`message.durableFinal.admitDeferredDelivery(...)` を使用します。コアは、キューへの永続化を省略する経路を含め、ライブ送信処理の前にこのフックを同期的に呼び出し、復元された意図を再実行する前にも再度呼び出します。コンテキストには、`cfg`、`channel`、`to`、`accountId`、および `live` または `recovery` の `phase` が含まれます。

続行するには、`{ status: "allowed" }` を返します。配信を永続化、直接送信、または再実行してはならない場合は、`{ status: "permanent_rejection", reason }` を返します。ライブで拒否された場合は、キューの作成、メッセージフック、またはプラットフォーム処理の前に失敗します。復旧時に拒否された場合は、キュー内のレコードが失敗としてマークされ、整合処理と再実行が省略されます。フックを省略した場合は、許可されたものとして扱われます。

このフックは同期的な受け入れ判定であり、送信経路ではありません。すでに読み込まれている設定またはランタイム状態のみを読み取り、ネットワーク、ファイルシステム、その他の非同期 I/O を実行しないでください。コントラクトテストでは、`openclaw/plugin-sdk/channel-outbound` の `ChannelMessageDurableFinalAdapter` を通じて、両方のフェーズと両方の結果バリアントを検証する必要があります。

## 互換性ディスパッチ

受信返信のディスパッチは、`channel-inbound` の `dispatchChannelInboundReply(...)` を使用して構成します。プラットフォーム配信は配信アダプターに保持し、メッセージアダプター、永続的な送信、受領情報、ライブプレビュー、および返信パイプラインオプションには `channel-outbound` を使用してください。
