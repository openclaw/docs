---
read_when:
    - メッセージングチャネル Plugin を構築またはリファクタリングしている
    - 最終返信の永続的な配信、受領確認、ライブプレビューの確定、または受信確認ポリシーが必要な場合
    - レガシー返信パイプラインまたは受信返信ディスパッチヘルパーから移行している
summary: チャネルPlugin向けのメッセージライフサイクルAPI。永続送信、受信確認、ライブプレビュー、受信確認ポリシー、レガシー移行を含む
title: チャネルメッセージ API
x-i18n:
    generated_at: "2026-05-10T19:45:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

チャンネル Plugin は `openclaw/plugin-sdk/channel-message` から 1 つの `message` アダプターを公開する必要があります。このアダプターは、プラットフォームがサポートするネイティブメッセージのライフサイクルを記述します。

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

コアは、キューイング、耐久性、汎用リトライポリシー、フック、受領情報、および共有 `message` ツールを所有します。Plugin は、ネイティブの送信/編集/削除呼び出し、ターゲットの正規化、プラットフォームのスレッド処理、選択された引用、通知フラグ、アカウント状態、プラットフォーム固有の副作用を所有します。

このページは [チャンネル Plugin の構築](/ja-JP/plugins/sdk-channel-plugins) と併せて使用してください。

`channel-message` サブパスは、`channel.ts` のようなホットな Plugin ブートストラップファイルでも十分に低コストになるよう意図されています。これは、送信配信を読み込まずに、アダプター契約、ケイパビリティ証明、受領情報、互換性ファサードを公開します。ランタイム配信ヘルパーは、すでに非同期メッセージ I/O を実行している監視/送信コードパス向けに、`openclaw/plugin-sdk/channel-message-runtime` から利用できます。

新しいチャンネルおよび Plugin の送信コードでは、`openclaw/plugin-sdk/channel-message-runtime` のメッセージライフサイクルヘルパーを使用してください: `sendDurableMessageBatch`、`withDurableMessageSendContext`、または `deliverInboundReplyWithMessageSendContext`。`openclaw/plugin-sdk/outbound-runtime` の古い `deliverOutboundPayloads(...)` ヘルパーは、送信内部、復旧、レガシーアダプター向けの非推奨の互換性/ランタイム基盤です。新しいチャンネルまたは Plugin の送信パスには使用しないでください。

`sendDurableMessageBatch(...)` は明示的なライフサイクル結果を返します。

- `sent` - 少なくとも 1 つの可視プラットフォームメッセージが配信されました。
- `suppressed` - プラットフォームメッセージを欠落として扱うべきではありません。安定した理由には `cancelled_by_message_sending_hook`、`empty_after_message_sending_hook`、`no_visible_payload`、`adapter_returned_no_identity`、およびレガシーの `no_visible_result` が含まれます。
- `partial_failed` - 後続のペイロードまたは副作用が失敗する前に、少なくとも 1 つのプラットフォームメッセージが配信されました。結果には、配信済み受領情報のプレフィックスと失敗が含まれます。
- `failed` - プラットフォーム受領情報が生成されませんでした。

バッチに送信済み、抑制済み、失敗したペイロードが混在する場合は `payloadOutcomes` を使用してください。古い直接配信配列が空かどうかを確認して、フックのキャンセルを推測しないでください。

まだバッファリングされた返信ディスパッチャーを必要とする互換性ディスパッチャーは、`openclaw/plugin-sdk/channel-message` の `createChannelMessageReplyPipeline(...)` で返信プレフィックスオプションを構築し、その後ランタイムの `channel.turn.runPrepared(...)` を呼び出してください。これにより、別の公開ターンラッパーを追加せずに、セッション記録とディスパッチ順序が共有ターンライフサイクル上に保たれます。

## 最小アダプター

ほとんどの新しいチャンネル Plugin は、小さなアダプターから始められます。

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

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

次に、それをチャンネル Plugin に取り付けます。

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

アダプターが実際に保持するケイパビリティのみを宣言してください。宣言されたすべてのケイパビリティには契約テストが必要です。

## 送信ブリッジ

チャンネルにすでに互換性のある `outbound` アダプターがある場合は、送信コードを重複させるのではなく、そこからメッセージアダプターを派生することを優先してください。

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

ブリッジは古い送信結果を `MessageReceipt` 値に変換します。新しいコードでは受領情報をエンドツーエンドで渡し、互換性の境界でのみ `listMessageReceiptPlatformIds(...)` または `resolveMessageReceiptPrimaryId(...)` を使ってレガシー ID を派生してください。
受信ポリシーが指定されていない場合、`createChannelMessageAdapterFromOutbound(...)` は `manual` 受信確認ポリシーを使用します。これにより、汎用受信コンテキストの外側で Webhook、ソケット、ポーリングオフセットを確認するチャンネルを変更せずに、Plugin 所有のプラットフォーム確認が明示的になります。

## メッセージツール送信

共有 `message(action="send")` パスは、最終返信と同じコア配信ライフサイクルを使用する必要があります。チャンネルがツール送信用にプロバイダー固有の整形を必要とする場合は、`actions.handleAction(...)` から送信するのではなく、`actions.prepareSendPayload(...)` を実装してください。

`prepareSendPayload(...)` は、正規化されたコア `ReplyPayload` と完全なアクションコンテキストを受け取ります。`payload.channelData.<channel>` にチャンネル固有データを含むペイロードを返し、コアに `sendMessage(...)`、メッセージライフサイクルランタイム、先行書き込みキュー、メッセージ送信フック、リトライ、復旧、ack クリーンアップを呼び出させてください。ライフサイクルランタイムは互換性基盤として内部的に `deliverOutboundPayloads(...)` を呼び出す場合がありますが、チャンネル Plugin は新しい送信動作のためにそれを直接呼び出すべきではありません。

送信を耐久ペイロードとして表現できない場合にのみ `null` を返してください。たとえば、シリアライズできないコンポーネントファクトリーが含まれる場合です。コアは互換性のためにレガシー Plugin アクションのフォールバックを維持しますが、新しいチャンネル送信機能は耐久ペイロードデータとして表現できるようにする必要があります。

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

その後、送信アダプターは `sendPayload` 内で `payload.channelData.demo` を読み取ります。これにより、プラットフォーム固有のレンダリングを Plugin 内に保ちながら、コアが永続化、リトライ、復旧、フック、ack を引き続き所有できます。

準備済みの `message(action="send")` ペイロードと汎用の最終返信配信は、デフォルトでベストエフォートのキューイングを伴うコア配信を使用します。必須の耐久キューイングは、クラッシュ後に結果が不明な送信をチャンネルが照合できることをコアが検証した後にのみ有効です。アダプターが `reconcileUnknownSend` を実装できない場合は、準備済み送信パスをベストエフォートのままにしてください。コアはそれでも先行書き込みキューを試行しますが、キュー永続化や不確実なクラッシュ復旧は必須配信契約の一部ではありません。

## 耐久最終ケイパビリティ

耐久最終配信は、副作用ごとのオプトインです。コアは、ペイロードと配信オプションに必要なすべてのケイパビリティをアダプターが宣言している場合にのみ、汎用の耐久配信を使用します。

| ケイパビリティ       | 宣言する場合                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | アダプターがテキストを送信し、受領情報を返せる。                                      |
| `media`                | メディア送信が、可視プラットフォームメッセージごとに受領情報を返す。                  |
| `payload`              | アダプターが、テキストと 1 つのメディア URL だけでなく、リッチ返信ペイロードの意味論を保持する。 |
| `replyTo`              | ネイティブ返信ターゲットがプラットフォームに到達する。                                |
| `thread`               | ネイティブスレッド、トピック、またはチャンネルスレッドターゲットがプラットフォームに到達する。 |
| `silent`               | 通知抑制がプラットフォームに到達する。                                                 |
| `nativeQuote`          | 選択された引用メタデータがプラットフォームに到達する。                                |
| `messageSendingHooks`  | コアのメッセージ送信フックが、プラットフォーム I/O の前にコンテンツをキャンセルまたは書き換えできる。 |
| `batch`                | 複数パートのレンダリング済みバッチを 1 つの耐久計画として再実行できる。                |
| `reconcileUnknownSend` | アダプターが、盲目的な再実行なしに `unknown_after_send` 復旧を解決できる。            |
| `afterSendSuccess`     | チャンネルローカルの送信成功後の副作用が 1 回実行される。                              |
| `afterCommit`          | チャンネルローカルのコミット後の副作用が 1 回実行される。                              |

ベストエフォートの最終配信は `reconcileUnknownSend` を必要としません。アダプターがペイロードの可視的な意味論を保持する場合は共有ライフサイクルを使用し、キュー永続化が利用できない場合は直接プラットフォーム I/O にフォールバックします。必須の耐久最終配信では、`reconcileUnknownSend` を明示的に要求する必要があります。開始済み/不明な送信がプラットフォームに到達したかどうかをアダプターが判断できない場合は、そのケイパビリティを宣言しないでください。コアはキューイング前に必須の耐久配信を拒否します。

呼び出し元が耐久配信を必要とする場合は、手動でマップを構築するのではなく、要件を派生してください。

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` はデフォルトで必須です。グローバルなメッセージ送信フックを意図的に実行できないパスの場合にのみ、`messageSendingHooks: false` を設定してください。

## 耐久送信契約

耐久最終送信は、レガシーのチャンネル所有配信よりも厳密な意味論を持ちます。

- プラットフォーム I/O の前に耐久インテントを作成する。
- 耐久配信が処理済み結果を返した場合、レガシー送信にフォールバックしない。
- フックによるキャンセルと送信なしの結果を終端として扱う。
- `unsupported` はインテント前の結果としてのみ扱う。
- 必須の耐久性では、プラットフォーム送信が開始されたことをキューが記録できない場合、プラットフォーム I/O の前に失敗する。
- 必須の最終配信および必須の準備済みメッセージツール送信では、`reconcileUnknownSend` を事前確認する。復旧は、すでに送信済みのメッセージを ack できるか、アダプターが元の送信が発生していないことを証明した後にのみ再実行できる必要がある。
- `best_effort` では、キュー書き込み失敗時に直接プラットフォーム I/O にフォールバックできる。
- メディア読み込みとプラットフォーム送信に中止シグナルを転送する。
- キュー ack 後にコミット後フックを実行する。直接のベストエフォートフォールバックでは、耐久キューコミットがないため、成功したプラットフォーム I/O の後にそれらを実行する。
- 可視プラットフォームメッセージ ID ごとに受領情報を返す。
- プラットフォームが、不確実な送信がすでにユーザーに到達したかどうかを確認できる場合は、`reconcileUnknownSend` を使用する。

この契約により、クラッシュ後の重複送信を避け、メッセージ送信キャンセルフックのバイパスを防ぎます。

## 受領情報

`MessageReceipt` は、プラットフォームが受け入れた内容の新しい内部記録です。

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

既存の送信結果を適応させる場合は `createMessageReceiptFromOutboundResults(...)` を使用します。ライブプレビューメッセージが最終的な receipt になる場合は `createPreviewMessageReceipt(...)` を使用します。新しいオーナーローカルの `messageIds` フィールドを追加しないでください。レガシーの `ChannelDeliveryResult.messageIds` は互換性境界では引き続き生成されます。

## ライブプレビュー

ドラフトプレビューまたは進捗更新をストリーミングするチャネルは、ライブ機能を宣言する必要があります:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

ランタイムの finalization には `defineFinalizableLivePreviewAdapter(...)` と `deliverWithFinalizableLivePreviewAdapter(...)` を使用します。finalizer は、最終返信がプレビューをその場で編集するか、通常の fallback を送信するか、保留中のプレビュー状態を破棄するか、曖昧に失敗した編集をメッセージの重複なしに保持するかを判断し、最終 receipt を返します。

## 受信 ack ポリシー

プラットフォームの acknowledgement タイミングを制御するインバウンド receiver は、受信ポリシーを宣言する必要があります:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

受信ポリシーを宣言しないアダプターのデフォルトは次のとおりです:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

プラットフォームに延期すべき acknowledgement がない場合、非同期処理の前にすでに acknowledgement を行う場合、またはプロトコル固有のレスポンスセマンティクスが必要な場合は、デフォルトを使用します。段階的なポリシーのいずれかを宣言するのは、receiver が実際に受信コンテキストを使ってプラットフォームの acknowledgement を後ろに移動する場合だけです。

ポリシー:

| ポリシー               | 使用する場合                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | インバウンドイベントが解析され記録された後に、プラットフォームへ acknowledgement できる場合。 |
| `after_agent_dispatch` | エージェント dispatch が受け付けられるまでプラットフォームが待つべき場合。              |
| `after_durable_send`   | 最終 delivery に durable な判断が出るまでプラットフォームが待つべき場合。               |
| `manual`               | プラットフォームのセマンティクスが汎用 stage と一致しないため、Plugin が acknowledgement を所有する場合。 |

ack 状態を延期する receiver では `createMessageReceiveContext(...)` を使用し、stage が設定済みポリシーを満たしたかどうかを receiver がテストする必要がある場合は `shouldAckMessageAfterStage(...)` を使用します。

## 契約テスト

機能宣言は Plugin 契約の一部です。テストで裏付けます:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

アダプターがこれらの機能を宣言する場合は、ライブと受信の proof suite を追加します。proof が欠けている場合は、durable surface を暗黙に広げるのではなく、テストを失敗させる必要があります。

## 非推奨の互換性 API

これらの API は、サードパーティ互換性のため引き続き import できます。新しいチャネルコードでは使用しないでください。

| 非推奨 API                                  | 置き換え                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | 互換性 dispatcher では `createChannelMessageReplyPipeline(...)`、新しいチャネルコードでは `message` アダプター             |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` と `channel.turn.runPrepared(...)`、または新しいチャネルコードでは `message` アダプター |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` と `channel.turn.runPrepared(...)`、または新しいチャネルコードでは `message` アダプター |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` と `channel.turn.runPrepared(...)`、または新しいチャネルコードでは `message` アダプター |
| `deliverOutboundPayloads(...)`               | `channel-message-runtime` の `sendDurableMessageBatch(...)` または `deliverInboundReplyWithMessageSendContext(...)`        |
| `deliverDurableInboundReplyPayload(...)`     | `openclaw/plugin-sdk/channel-message-runtime` の `deliverInboundReplyWithMessageSendContext(...)`                          |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` と `channel.turn.runPrepared(...)`、または新しいチャネルコードでは `message` アダプター |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` と `channel.turn.runPrepared(...)`、または新しいチャネルコードでは `message` アダプター |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` と `deliverWithFinalizableLivePreviewAdapter(...)`                              |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

互換性 dispatcher は、message facade を通じて `createReplyPrefixContext(...)`、`createReplyPrefixOptions(...)`、`createTypingCallbacks(...)` を引き続き使用できます。新しい lifecycle コードでは、古い `channel-reply-pipeline` サブパスを避ける必要があります。

## 移行チェックリスト

1. チャネル Plugin に `message: defineChannelMessageAdapter(...)` または `message: createChannelMessageAdapterFromOutbound(...)` を追加します。
2. text、media、payload の送信から `MessageReceipt` を返します。
3. ネイティブ動作とテストで裏付けられた機能だけを宣言します。
4. 手書きの durable requirement map を `deriveDurableFinalDeliveryRequirements(...)` に置き換えます。
5. チャネルがドラフトメッセージをその場で編集する場合は、ライブプレビューヘルパーを通じて preview finalization を移動します。
6. receiver が本当にプラットフォーム acknowledgement を延期できる場合だけ、受信 ack ポリシーを宣言します。
7. レガシーの reply dispatch helper は互換性境界にだけ残します。
