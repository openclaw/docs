---
read_when:
    - メッセージングチャネルPluginを構築またはリファクタリングしている
    - 最終返信の確実な配信、配信確認、ライブプレビューの確定、または受信確認ポリシーが必要な場合
    - レガシー返信パイプラインまたは受信返信ディスパッチヘルパーから移行しています
summary: 永続送信、受領通知、ライブプレビュー、受信確認ポリシー、レガシー移行を含む、チャネル Plugin 向けのメッセージライフサイクル API
title: チャンネルメッセージ API
x-i18n:
    generated_at: "2026-05-06T05:13:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

チャンネルPluginは、`openclaw/plugin-sdk/channel-message` から 1 つの `message` アダプターを公開する必要があります。このアダプターは、プラットフォームが対応するネイティブメッセージのライフサイクルを記述します。

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

コアは、キューイング、永続性、汎用リトライポリシー、フック、受領情報、共有 `message` ツールを所有します。Pluginは、ネイティブの送信/編集/削除呼び出し、ターゲット正規化、プラットフォームのスレッド処理、選択された引用、通知フラグ、アカウント状態、プラットフォーム固有の副作用を所有します。

このページは [チャンネルPluginの構築](/ja-JP/plugins/sdk-channel-plugins) とあわせて使用してください。

`channel-message` サブパスは、`channel.ts` のようなホットPluginブートストラップファイルにとって十分に軽量になるよう意図されています。これは、アウトバウンド配信を読み込まずに、アダプター契約、機能証明、受領情報、互換性ファサードを公開します。実行時配信ヘルパーは、すでに非同期メッセージ I/O を行っている監視/送信コードパス向けに、`openclaw/plugin-sdk/channel-message-runtime` から利用できます。

## 最小アダプター

ほとんどの新しいチャンネルPluginは、小さなアダプターから始められます。

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

次に、それをチャンネルPluginに接続します。

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

アダプターが本当に保持する機能だけを宣言してください。宣言されたすべての機能には契約テストが必要です。

## アウトバウンドブリッジ

チャンネルに互換性のある `outbound` アダプターがすでにある場合は、送信コードを重複させるのではなく、そこからメッセージアダプターを派生させることを推奨します。

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

このブリッジは、古いアウトバウンド送信結果を `MessageReceipt` 値に変換します。新しいコードでは、受領情報をエンドツーエンドで渡し、レガシー ID は互換性の境界でのみ `listMessageReceiptPlatformIds(...)` または `resolveMessageReceiptPrimaryId(...)` を使って派生させる必要があります。
受信ポリシーが指定されていない場合、`createChannelMessageAdapterFromOutbound(...)` は `manual` 受信確認ポリシーを使用します。これにより、Webhook、ソケット、ポーリングオフセットを汎用受信コンテキストの外で確認するチャンネルを変更せずに、Plugin所有のプラットフォーム確認を明示できます。

## メッセージツール送信

共有 `message(action="send")` パスは、最終返信と同じコア配信ライフサイクルを使用する必要があります。チャンネルがツール送信にプロバイダー固有の整形を必要とする場合は、`actions.handleAction(...)` から送信するのではなく、`actions.prepareSendPayload(...)` を実装してください。

`prepareSendPayload(...)` は、正規化されたコア `ReplyPayload` と完全なアクションコンテキストを受け取ります。チャンネル固有データを `payload.channelData.<channel>` に含めたペイロードを返し、コアに `sendMessage(...)`、`deliverOutboundPayloads(...)`、write-ahead キュー、メッセージ送信フック、リトライ、復旧、ack クリーンアップを呼び出させます。

送信を永続ペイロードとして表現できない場合、たとえばシリアライズ不能なコンポーネントファクトリを含む場合にのみ、`null` を返してください。コアは互換性のためにレガシーPluginアクションフォールバックを維持しますが、新しいチャンネル送信機能は永続ペイロードデータとして表現できるようにする必要があります。

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

その後、アウトバウンドアダプターは `sendPayload` 内で `payload.channelData.demo` を読み取ります。これにより、プラットフォーム固有のレンダリングはPlugin内に保ちながら、永続化、リトライ、復旧、フック、ack は引き続きコアが所有します。

準備済みの `message(action="send")` ペイロードと汎用の最終返信配信は、デフォルトでベストエフォートのキューイングを使うコア配信を使用します。必須の永続キューイングは、クラッシュ後に結果が不明な送信をチャンネルが照合できることをコアが検証した後にのみ有効です。アダプターが `reconcileUnknownSend` を実装できない場合は、準備済み送信パスをベストエフォートのままにしてください。コアは引き続き write-ahead キューを試みますが、キュー永続化や不確実なクラッシュ復旧は必須配信契約の一部ではありません。

## 永続的な最終機能

永続的な最終配信は、副作用ごとにオプトインです。コアは、ペイロードと配信オプションに必要なすべての機能をアダプターが宣言している場合にのみ、汎用の永続配信を使用します。

| 機能                   | 宣言する条件                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | アダプターがテキストを送信し、受領情報を返せる。                                      |
| `media`                | メディア送信が、表示されるすべてのプラットフォームメッセージについて受領情報を返す。 |
| `payload`              | アダプターが、テキストと 1 つのメディア URL だけでなく、リッチな返信ペイロードの意味論を保持する。 |
| `replyTo`              | ネイティブ返信ターゲットがプラットフォームに届く。                                    |
| `thread`               | ネイティブスレッド、トピック、またはチャンネルスレッドターゲットがプラットフォームに届く。 |
| `silent`               | 通知抑制がプラットフォームに届く。                                                    |
| `nativeQuote`          | 選択された引用メタデータがプラットフォームに届く。                                    |
| `messageSendingHooks`  | コアのメッセージ送信フックが、プラットフォーム I/O の前にコンテンツをキャンセルまたは書き換えできる。 |
| `batch`                | 複数部分のレンダリング済みバッチを、1 つの永続計画として再生できる。                 |
| `reconcileUnknownSend` | アダプターが、盲目的な再生なしで `unknown_after_send` 復旧を解決できる。              |
| `afterSendSuccess`     | チャンネルローカルの送信後副作用が 1 回実行される。                                  |
| `afterCommit`          | チャンネルローカルのコミット後副作用が 1 回実行される。                              |

ベストエフォートの最終配信は `reconcileUnknownSend` を必要としません。アダプターがペイロードの可視的な意味論を保持している場合は共有ライフサイクルを使用し、キュー永続化が利用できない場合は直接のプラットフォーム I/O にフォールバックします。必須の永続最終配信は、`reconcileUnknownSend` を明示的に要求する必要があります。開始済みまたは不明な送信がプラットフォームに到達したかをアダプターが判断できない場合は、その機能を宣言しないでください。コアは、キューイング前に必須の永続配信を拒否します。

呼び出し元が永続配信を必要とする場合は、手作業でマップを構築するのではなく、要件を派生させてください。

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

`messageSendingHooks` はデフォルトで必須です。グローバルメッセージ送信フックを意図的に実行できないパスにのみ、`messageSendingHooks: false` を設定してください。

## 永続送信契約

永続的な最終送信には、レガシーのチャンネル所有配信より厳格な意味論があります。

- プラットフォーム I/O の前に永続インテントを作成する。
- 永続配信が処理済み結果を返した場合、レガシー送信にフォールバックしない。
- フックによるキャンセルと未送信結果を終端として扱う。
- `unsupported` はインテント前の結果としてのみ扱う。
- 必須の永続性では、プラットフォーム送信が開始されたことをキューが記録できない場合、プラットフォーム I/O の前に失敗させる。
- 必須の最終配信と必須の準備済みメッセージツール送信では、`reconcileUnknownSend` を事前検証する。復旧は、すでに送信済みのメッセージを ack できるか、アダプターが元の送信が発生しなかったことを証明した後にのみ再生できる必要がある。
- `best_effort` では、キュー書き込み失敗時に直接のプラットフォーム I/O へフォールバックしてよい。
- 中止シグナルをメディア読み込みとプラットフォーム送信へ転送する。
- キュー ack 後に after-commit フックを実行する。直接のベストエフォートフォールバックでは、永続キューコミットがないため、プラットフォーム I/O の成功後にそれらを実行する。
- 表示されるすべてのプラットフォームメッセージ ID について受領情報を返す。
- プラットフォームが不確実な送信がすでにユーザーに届いたかを確認できる場合は、`reconcileUnknownSend` を使用する。

この契約により、クラッシュ後の重複送信を避け、メッセージ送信キャンセルフックのバイパスを避けられます。

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

既存の送信結果を適応させる場合は `createMessageReceiptFromOutboundResults(...)` を使用してください。ライブプレビューメッセージが最終受領情報になる場合は `createPreviewMessageReceipt(...)` を使用してください。新しい所有者ローカルの `messageIds` フィールドは追加しないでください。レガシーの `ChannelDeliveryResult.messageIds` は、互換性の境界で引き続き生成されます。

## ライブプレビュー

ドラフトプレビューや進捗更新をストリームするチャンネルは、ライブ機能を宣言する必要があります。

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

実行時の最終化には、`defineFinalizableLivePreviewAdapter(...)` と `deliverWithFinalizableLivePreviewAdapter(...)` を使用してください。ファイナライザーは、最終返信がプレビューをその場で編集するか、通常のフォールバックを送信するか、保留中のプレビュー状態を破棄するか、曖昧に失敗した編集をメッセージを重複させずに保持するかを決定し、最終受領情報を返します。

## 受信 ack ポリシー

プラットフォーム確認のタイミングを制御するインバウンド受信側は、受信ポリシーを宣言する必要があります。

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

受信ポリシーを宣言しないアダプターのデフォルトは次のとおりです。

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

プラットフォームに遅延できる確認応答がない、非同期処理の前にすでに確認応答する、またはプロトコル固有の応答セマンティクスが必要な場合は、デフォルトを使用します。レシーバーが受信コンテキストを実際に使用してプラットフォーム確認応答を後の時点へ移動する場合にのみ、段階的ポリシーのいずれかを宣言します。

ポリシー:

| ポリシー               | 使用する場合                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | インバウンドイベントが解析され記録された後に、プラットフォームへ確認応答できる。       |
| `after_agent_dispatch` | エージェントディスパッチが受け入れられるまで、プラットフォームが待機すべきである。     |
| `after_durable_send`   | 最終配信に永続的な判断が下されるまで、プラットフォームが待機すべきである。             |
| `manual`               | プラットフォームのセマンティクスが汎用ステージと一致しないため、Plugin が確認応答を所有する。 |

確認応答状態を遅延するレシーバーでは `createMessageReceiveContext(...)` を使用し、ステージが設定済みポリシーを満たしたかどうかをレシーバーがテストする必要がある場合は `shouldAckMessageAfterStage(...)` を使用します。

## コントラクトテスト

Capability 宣言は Plugin コントラクトの一部です。テストで裏付けます:

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

アダプターがそれらの機能を宣言する場合は、ライブと受信の証明スイートを追加します。証明がない場合は、永続的なサーフェスを暗黙に広げるのではなく、テストが失敗するようにします。

## 非推奨の互換性 API

これらの API はサードパーティ互換性のために引き続きインポートできます。新しいチャネルコードでは使用しないでください。

| 非推奨 API                                  | 置き換え先                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | 互換性ディスパッチャーでは `createChannelMessageReplyPipeline(...)`、新しいチャネルコードでは `message` アダプター |
| `deliverDurableInboundReplyPayload(...)`     | `openclaw/plugin-sdk/channel-message-runtime` の `deliverInboundReplyWithMessageSendContext(...)`                   |
| `dispatchInboundReplyWithBase(...)`          | 互換性ディスパッチャーでのみ `dispatchChannelMessageReplyWithBase(...)`                                             |
| `recordInboundSessionAndDispatchReply(...)`  | 互換性ディスパッチャーでのみ `recordChannelMessageReplyDispatch(...)`                                               |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` と `deliverWithFinalizableLivePreviewAdapter(...)`                       |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

互換性ディスパッチャーは、message ファサード経由で `createReplyPrefixContext(...)`、`createReplyPrefixOptions(...)`、`createTypingCallbacks(...)` を引き続き使用できます。新しいライフサイクルコードでは、古い `channel-reply-pipeline` サブパスを避けるべきです。

## 移行チェックリスト

1. チャネル Plugin に `message: defineChannelMessageAdapter(...)` または
   `message: createChannelMessageAdapterFromOutbound(...)` を追加する。
2. テキスト、メディア、ペイロード送信から `MessageReceipt` を返す。
3. ネイティブ動作とテストで裏付けられた Capability のみを宣言する。
4. 手書きの永続要件マップを
   `deriveDurableFinalDeliveryRequirements(...)` に置き換える。
5. チャネルがドラフトメッセージをその場で編集する場合は、ライブプレビューヘルパーを通じてプレビューのファイナライズを移行する。
6. レシーバーがプラットフォーム確認応答を本当に遅延できる場合にのみ、受信確認応答ポリシーを宣言する。
7. レガシー返信ディスパッチヘルパーは互換性境界にのみ残す。
