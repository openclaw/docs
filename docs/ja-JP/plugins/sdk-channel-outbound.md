---
read_when:
    - メッセージングチャネル Plugin の送信パスを構築またはリファクタリングしている場合
    - 永続的な最終返信の配信、受領確認、ライブプレビューの確定、または受信確認ポリシーが必要な場合
    - channel-message、channel-message-runtime、または従来の返信ディスパッチヘルパーから移行する場合
summary: チャンネル Plugin 向け送信メッセージライフサイクル API：アダプター、受領確認、永続的な送信、ライブプレビュー、返信パイプラインヘルパー
title: チャネル送信 API
x-i18n:
    generated_at: "2026-07-12T14:44:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channel Plugin は、`openclaw/plugin-sdk/channel-outbound` から送信メッセージの動作を公開します。受信／コンテキスト／ディスパッチのオーケストレーションには、`openclaw/plugin-sdk/channel-inbound` を使用します。

コアは、キューイング、永続性、汎用的な再試行ポリシー、フック、受領情報、および共有の `message` ツールを所有します。Plugin は、ネイティブの送信／編集／削除呼び出し、送信先の正規化、プラットフォームのスレッド処理、選択した引用、通知フラグ、アカウント状態、およびプラットフォーム固有の副作用を所有します。

## アダプター

ほとんどの Plugin は、`message` アダプターを 1 つ定義します。

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

ネイティブトランスポートが実際に保持するケイパビリティのみを宣言してください。宣言した各送信、受領情報、ライブプレビュー、受信確認のケイパビリティを、このサブパスからエクスポートされるコントラクトヘルパーで網羅してください。

## プレーンテキストのサニタイズ

送信アダプターが、サポート対象の HTML 書式設定タグを軽量なテキストマークアップに変換する必要がある場合は、`sanitizeForPlainText(...)` を使用します。デフォルトでは、既存のチャット形式の太字および取り消し線マーカーが維持されます。チャネルが結果を Markdown として再解析する場合にのみ、`{ style: "markdown" }` を渡してください。

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown スタイルでは `**bold**` と `~~strikethrough~~` を使用します。斜体とインラインコードは、どちらのスタイルでも `_italic_` とバッククォートのマーカーを維持します。サニタイズ後にマーカーテキストを書き換えるのではなく、チャネル境界でスタイルを選択してください。

## 配信証拠

`MessageReceipt` は、チャネルアダプターが返した結果を記録します。具体的なプラットフォームメッセージ識別子は、プラットフォームの送信パスがメッセージを受け付けたことを示しますが、受信者のデバイスに表示されたことや、受信者が読んだことを証明するものではありません。プラットフォームメッセージ識別子のない受領情報は、ローカルの受領メタデータにすぎません。既読通知またはデバイス配信状態を備えるチャネルでは、それらの事実をチャネル固有の別のパスで追跡する必要があります。

チャネルアダプターが、失敗を再試行しても受信者に見える送信が重複せず、かつ完了処理が可能な呼び出しが開始されていないことを証明できる場合は、`openclaw/plugin-sdk/error-runtime` から `new PlatformMessageNotDispatchedError("...", { cause: error })` をスローします。これにより、コアは古い送信試行の証拠を消去し、キューに登録されたインテントを安全に再試行できます。この表明を行えるのは、最終ディスパッチ境界を所有するアダプターのみです。完了処理／送信呼び出しの開始後、または曖昧な結果が返された後には、このマーカーを決して使用しないでください。誤ってマークすると、メッセージが重複する可能性があります。

## 既存の送信アダプター

チャネルに互換性のある `outbound` アダプターがすでにある場合は、送信コードを重複させず、そこからメッセージアダプターを派生させてください。

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
- `resolveChannelDraftStreamingChunking(...)` などのドラフトストリーミング／進捗ヘルパー

`sendDurableMessageBatch(...)` は、明示的な結果を 1 つ返します。

| 結果             | 意味                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `sent`           | 少なくとも 1 件の可視プラットフォームメッセージが、プラットフォームの送信パスに受け付けられた    |
| `suppressed`     | プラットフォームメッセージが欠落したものとして扱われるべきではない                              |
| `partial_failed` | 後続のペイロードまたは副作用が失敗する前に、少なくとも 1 件のプラットフォームメッセージが受け付けられた |
| `failed`         | プラットフォームの受領情報が生成されなかった                                                    |

バッチに送信済み、抑制済み、失敗のペイロードが混在する場合は、`payloadOutcomes` を使用してください。空のレガシー直接配信結果から、フックのキャンセルを推測しないでください。

## 遅延配信の受け入れ判定

解決済みのアカウントが、コア管理の送信または遅延配信を安全に受け入れられない場合は、`message.durableFinal.admitDeferredDelivery(...)` を使用してください。コアは、キューへの永続化を省略するパスを含むライブ送信処理の前と、復旧したインテントを再実行する前に、このフックを同期的に呼び出します。コンテキストには、`cfg`、`channel`、`to`、`accountId`、および `live` または `recovery` の `phase` が含まれます。

続行するには、`{ status: "allowed" }` を返します。配信を永続化、直接送信、または再実行してはならない場合は、`{ status: "permanent_rejection", reason }` を返します。ライブで拒否された場合、キューの作成、メッセージフック、またはプラットフォーム処理より前に失敗します。復旧時に拒否された場合、キュー内のレコードを失敗としてマークし、照合および再実行を省略します。フックを省略した場合は、許可されたものとみなされます。

このフックは同期的な受け入れ判定であり、送信パスではありません。すでに読み込まれている設定またはランタイム状態のみを読み取り、ネットワーク、ファイルシステム、その他の非同期 I/O を実行しないでください。コントラクトテストでは、`openclaw/plugin-sdk/channel-outbound` の `ChannelMessageDurableFinalAdapter` を使用し、両方のフェーズと両方の結果バリアントを検証する必要があります。

## 互換性ディスパッチ

`channel-inbound` の `dispatchChannelInboundReply(...)` を使用して、受信返信のディスパッチを構成してください。プラットフォーム配信は配信アダプターに保持し、メッセージアダプター、永続的な送信、受領情報、ライブプレビュー、返信パイプラインのオプションには `channel-outbound` を使用してください。
