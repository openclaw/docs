---
read_when:
    - チャンネルの送受信動作のリファクタリング
    - チャンネルターン、返信ディスパッチ、送信キュー、プレビューストリーミング、または Plugin SDK メッセージ API の変更
    - 永続的な送信、受信確認、プレビュー、編集、再試行が必要な新しいチャンネルPluginの設計
summary: 統一された永続的なメッセージの受信、送信、プレビュー、編集、ストリーミングのライフサイクルに関する設計計画
title: メッセージライフサイクルのリファクタリング
x-i18n:
    generated_at: "2026-05-06T05:01:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

このページは、散在しているチャネルのターン、返信ディスパッチ、
プレビュー ストリーミング、アウトバウンド配信ヘルパーを、1 つの永続的な
メッセージ ライフサイクルに置き換えるための目標設計です。

短く言うと:

- コア プリミティブは **reply** ではなく、**receive** と **send** であるべきです。
- 返信はアウトバウンド メッセージ上の関係にすぎません。
- ターンはインバウンド処理の便宜であり、配信の所有者ではありません。
- 送信はコンテキスト ベースである必要があります: `begin`、レンダー、プレビューまたはストリーム、最終送信、
  コミット、失敗。
- 受信もコンテキスト ベースである必要があります: 正規化、重複排除、ルーティング、記録、
  ディスパッチ、プラットフォーム ack、失敗。
- 公開 Plugin SDK は、小さなチャネル メッセージ サーフェス 1 つに集約するべきです。

## 問題

現在のチャネル スタックは、いくつかの妥当なローカル要件から成長しました:

- シンプルなインバウンド アダプターは `runtime.channel.turn.run` を使います。
- 高機能なアダプターは `runtime.channel.turn.runPrepared` を使います。
- レガシー ヘルパーは `dispatchInboundReplyWithBase`、
  `recordInboundSessionAndDispatchReply`、返信ペイロード ヘルパー、返信チャンク化、
  返信参照、アウトバウンド ランタイム ヘルパーを使います。
- プレビュー ストリーミングはチャネル固有のディスパッチャーにあります。
- 最終配信の耐久性は、既存の返信ペイロード パスの周辺に追加されつつあります。

この形はローカルのバグを修正しますが、OpenClaw には公開概念が多すぎ、
配信セマンティクスがずれ得る場所も多すぎます。

これを露呈させた信頼性の問題は次のとおりです:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標の不変条件は Telegram に限りません。コアが可視のアウトバウンド
メッセージが存在すべきだと判断したら、プラットフォーム送信を試行する前に
その意図が永続化され、成功後にプラットフォームのレシートがコミットされなければなりません。
これにより OpenClaw は at-least-once リカバリーを得ます。exactly-once の挙動が存在するのは、
ネイティブの冪等性を証明できるアダプター、または送信後の不明な試行をリプレイ前に
プラットフォーム状態と照合できるアダプターだけです。

これはこのリファクターの最終状態であり、現在のすべてのパスの説明ではありません。
移行中は、既存のアウトバウンド ヘルパーがベストエフォートのキュー書き込みに失敗した場合でも、
直接送信にフォールスルーできます。このリファクターが完了するのは、永続的な最終送信が
fail closed するか、文書化された非永続ポリシーで明示的にオプトアウトする場合だけです。

## 目標

- すべてのチャネル メッセージ受信および送信パスに対する、1 つのコア ライフサイクル。
- アダプターがリプレイ安全な挙動を宣言した後の、新しいメッセージ ライフサイクルにおける
  デフォルトで永続的な最終送信。
- 共有されたプレビュー、編集、ストリーム、ファイナライズ、リトライ、リカバリー、レシート
  セマンティクス。
- サードパーティ Plugin が学習し保守できる、小さな Plugin SDK サーフェス。
- 移行中の既存 `channel.turn` 呼び出し元との互換性。
- 新しいチャネル機能のための明確な拡張ポイント。
- コアにプラットフォーム固有の分岐を置かないこと。
- トークン差分のチャネル メッセージを置かないこと。チャネル ストリーミングは、メッセージ プレビュー、
  編集、追記、または完了済みブロック配信のままです。
- 運用/システム出力のための構造化された OpenClaw 起源メタデータ。これにより、可視の
  Gateway 失敗が、共有の bot 有効ルームで新しいプロンプトとして再入力されません。

## 非目標

- 最初のフェーズで `runtime.channel.turn.*` を削除しないこと。
- すべてのチャネルに同じネイティブ トランスポート挙動を強制しないこと。
- コアに Telegram トピック、Slack ネイティブ ストリーム、Matrix リダクション、
  Feishu カード、QQ 音声、または Teams アクティビティを教え込まないこと。
- すべての内部移行ヘルパーを安定版 SDK API として公開しないこと。
- リトライで完了済みの非冪等プラットフォーム操作をリプレイしないこと。

## 参照モデル

Vercel Chat には、優れた公開メンタル モデルがあります:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- `postMessage`、`editMessage`、`deleteMessage`、
  `stream`、`startTyping`、履歴取得などのアダプター メソッド
- 重複排除、ロック、キュー、永続化のための状態アダプター

OpenClaw はその語彙を借りるべきですが、サーフェスをコピーすべきではありません。

OpenClaw がそのモデルを超えて必要とするもの:

- 直接トランスポート呼び出しの前の、永続的なアウトバウンド送信意図。
- begin、commit、fail を持つ明示的な送信コンテキスト。
- プラットフォーム ack ポリシーを知る受信コンテキスト。
- 再起動を生き残り、編集、削除、リカバリー、重複抑止を駆動できるレシート。
- より小さな公開 SDK。バンドル済み Plugin は内部ランタイム ヘルパーを使用できますが、
  サードパーティ Plugin には一貫したメッセージ API 1 つを見せるべきです。
- エージェント固有の挙動: セッション、トランスクリプト、ブロック ストリーミング、ツール進行状況、
  承認、メディア ディレクティブ、サイレント返信、グループ メンション履歴。

`thread.post()` 形式の Promise だけでは OpenClaw には不十分です。送信がリカバリー可能かどうかを
決定するトランザクション境界を隠してしまいます。

## コア モデル

新しいドメインは、`src/channels/message/*` のような内部コア名前空間の下に置くべきです。

これには 4 つの概念があります:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` はインバウンド ライフサイクルを所有します。

`send` はアウトバウンド ライフサイクルを所有します。

`live` はプレビュー、編集、進行状況、ストリーム状態を所有します。

`state` は永続的な意図ストレージ、レシート、冪等性、リカバリー、ロック、
重複排除を所有します。

## メッセージ用語

### メッセージ

正規化されたメッセージはプラットフォーム中立です:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### ターゲット

ターゲットはメッセージが存在する場所を記述します:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### 関係

返信は関係であり、API ルートではありません:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

これにより、同じ送信パスで通常の返信、Cron 通知、承認プロンプト、タスク完了、
メッセージツール送信、CLI または Control UI 送信、サブエージェント結果、自動化送信を扱えます。

### 起源

起源は、誰がメッセージを生成したか、そして OpenClaw がそのメッセージのエコーを
どのように扱うべきかを記述します。これは関係とは別です。メッセージはユーザーへの返信でありながら、
OpenClaw 起源の運用出力でもあり得ます。

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

コアは OpenClaw 起源出力の意味を所有します。チャネルは、その起源を
各自のトランスポートへどうエンコードするかを所有します。

最初に必要な用途は Gateway 失敗出力です。人間には引き続き
「Agent failed before reply」や「Missing API key」のようなメッセージが見えるべきですが、
OpenClaw 運用出力としてタグ付けされたものは、`allowBots` が有効な共有ルームで
bot 著者の入力として受け入れてはいけません。

### レシート

レシートはファーストクラスです:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

レシートは、永続的な意図から将来の編集、削除、プレビュー ファイナライズ、
重複抑止、リカバリーへの橋渡しです。

レシートは、1 つのプラットフォーム メッセージまたは複数パートの配信を記述できます。チャンク化された
テキスト、メディアとテキスト、音声とテキスト、カード フォールバックはすべてのプラットフォーム ID を保持しつつ、
スレッド化と後続編集のために primary id も公開しなければなりません。

## 受信コンテキスト

受信は裸のヘルパー呼び出しであるべきではありません。コアには、重複排除、ルーティング、
セッション記録、プラットフォーム ack ポリシーを知るコンテキストが必要です。

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

受信フロー:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

ack は 1 種類ではありません。受信契約は、これらのシグナルを分離しておく必要があります:

- **トランスポート ack:** OpenClaw がイベント エンベロープを受け入れたことを、プラットフォームの Webhook またはソケットへ伝えます。一部のプラットフォームではディスパッチ前にこれが必要です。
- **ポーリング オフセット ack:** 同じイベントが再取得されないようにカーソルを進めます。リカバリー不能な作業を越えて進めてはいけません。
- **インバウンド記録 ack:** OpenClaw が再配信の重複排除とルーティングに十分なインバウンド メタデータを永続化したことを確認します。
- **ユーザー可視レシート:** 任意の既読/ステータス/入力中挙動です。耐久性の境界にはなりません。

`ReceiveAckPolicy` はトランスポートまたはポーリングの確認応答だけを制御します。
既読レシートやステータス リアクションに再利用してはいけません。

bot 認可の前に、チャネルがメッセージ起源メタデータをデコードできる場合、受信は共有の
OpenClaw エコー ポリシーを適用しなければなりません:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

このドロップはタグ ベースであり、テキスト ベースではありません。同じ可視の Gateway 失敗テキストを持つ
bot 著者のルーム メッセージでも、OpenClaw 起源メタデータがなければ、通常の `allowBots`
認可を通過します。

ack ポリシーは明示的です:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram ポーリングは現在、永続化された再起動ウォーターマークに受信コンテキスト ack ポリシーを使います。
トラッカーは引き続き grammY 更新がミドルウェア チェーンに入るところを観測しますが、OpenClaw が永続化するのは
ディスパッチ成功後の安全な完了済み update id だけであり、失敗した更新やそれより低い保留中の更新は
再起動後にリプレイ可能なまま残します。Telegram の上流 `getUpdates` 取得オフセットは引き続き
ポーリング ライブラリによって制御されるため、OpenClaw の再起動ウォーターマークを超える
プラットフォーム レベルの再配信が必要になった場合、残るより深い切り込みは完全に永続的なポーリング ソースです。
Webhook プラットフォームでは即時 HTTP ack が必要な場合がありますが、Webhook は再配信され得るため、
インバウンド重複排除と永続的なアウトバウンド送信意図は依然として必要です。

## 送信コンテキスト

送信もコンテキスト ベースです:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

推奨されるオーケストレーション:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

このヘルパーは次のように展開される:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

このインテントはトランスポート I/O より前に存在している必要がある。開始後、commit 前の再起動は復旧可能である。

危険な境界は、プラットフォームでの成功後、receipt の commit 前にある。そこでプロセスが停止した場合、アダプターがネイティブの冪等性または receipt 照合パスを提供しない限り、OpenClaw はプラットフォームメッセージが存在するかどうかを判断できない。そのような試行は、無条件に再生するのではなく `unknown_after_send` で再開しなければならない。照合機能のないチャネルは、重複した可視メッセージがそのチャネルと関係において許容され、文書化されたトレードオフである場合にのみ、at-least-once の再生を選択できる。現在の SDK 照合ブリッジでは、アダプターが `reconcileUnknownSend` を宣言し、その後 `durableFinal.reconcileUnknownSend` に未知のエントリーを `sent`、`not_sent`、または `unresolved` に分類させる。再生を許可するのは `not_sent` のみであり、未解決のエントリーは終端状態のままにするか、照合チェックだけを再試行する。

耐久性ポリシーは明示的でなければならない:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` は、durable intent を書き込めない場合にコアが fail closed しなければならないことを意味する。`best_effort` は、永続化を利用できない場合にそのまま処理を通過できる。`disabled` は古い直接送信の挙動を維持する。移行中、レガシーラッパーと公開互換ヘルパーの既定値は `disabled` である。チャネルに汎用 outbound アダプターがあるという事実から `required` を推測してはならない。

送信コンテキストは、チャネルローカルの送信後効果も所有する。durable delivery が、以前はチャネルの直接送信パスに紐づいていたローカル挙動を迂回する場合、その移行は安全ではない。例には、自己エコー抑制キャッシュ、スレッド参加マーカー、ネイティブ編集アンカー、モデル署名レンダリング、プラットフォーム固有の重複ガードが含まれる。これらの効果は、そのチャネルが durable な汎用最終配信を有効にする前に、送信アダプター、レンダーアダプター、または名前付きの送信コンテキストフックへ移動しなければならない。

送信ヘルパーは、呼び出し元まで receipt を最後まで返さなければならない。durable ラッパーはメッセージ ID を握りつぶしたり、チャネル配信結果を `undefined` に置き換えたりできない。バッファリングされたディスパッチャーは、スレッドアンカー、後続の編集、プレビューの最終化、重複抑制にこれらの ID を使用する。

フォールバック送信は単一 payload ではなくバッチを対象にする。silent reply の書き換え、メディアフォールバック、カードフォールバック、チャンク投影はいずれも複数の配信可能メッセージを生成し得るため、送信コンテキストは投影されたバッチ全体を配信するか、1 つの payload だけが有効である理由を明示的に文書化しなければならない。

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

このようなフォールバックが durable である場合、投影されたバッチ全体は 1 つの durable send intent、または別のアトミックなバッチ計画で表現されなければならない。各 payload を 1 つずつ記録するだけでは不十分である。payload 間でクラッシュすると、残りの payload について durable な記録がない部分的に可視なフォールバックが残り得る。復旧では、どの unit がすでに receipt を持っているかを把握し、不足している unit だけを再生するか、アダプターが照合するまでバッチを `unknown_after_send` としてマークしなければならない。

## ライブコンテキスト

プレビュー、編集、進行状況、ストリームの挙動は、1 つのオプトインライフサイクルにするべきである。

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

ライブ状態は、復旧または重複抑制に十分な耐久性を持つ:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

これは現在の挙動をカバーするべきである:

- Telegram の送信とプレビュー編集、およびプレビューが古くなった後の新しい最終メッセージ。
- Discord の送信とプレビュー編集、およびメディア、エラー、明示的な reply 時のキャンセル。
- スレッド形状に応じた Slack のネイティブストリームまたはドラフトプレビュー。
- Mattermost のドラフト投稿の最終化。
- Matrix のドラフトイベント最終化、または不一致時の削除。
- Teams のネイティブ進行状況ストリーム。
- QQ Bot のストリームまたは蓄積型フォールバック。

## アダプターサーフェス

公開 SDK のターゲットは 1 つのサブパスにするべきである:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

ターゲット形状:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

送信アダプター:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

受信アダプター:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

preflight 認可の前に、`origin.decode` が OpenClaw 起源のメタデータを返す場合、コアは共有の OpenClaw エコー述語を実行しなければならない。受信アダプターは、bot author や room shape などのプラットフォーム事実を提供する。コアがドロップ判定と順序付けを所有するため、チャネルがテキストフィルターを再実装する必要はない。

起源アダプター:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

コアは `MessageOrigin` を設定する。チャネルはそれをネイティブトランスポートメタデータへ、またはそこから変換するだけである。Slack はこれを `chat.postMessage({ metadata })` と inbound `message.metadata` にマップし、Matrix は追加のイベント内容にマップできる。ネイティブメタデータのないチャネルは、それが利用可能な最善の近似である場合に receipt/outbound レジストリを使用できる。

機能:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## 公開 SDK の整理

新しい公開サーフェスは、次の概念領域を取り込むか非推奨にするべきである:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` のほとんどの公開利用
- アドホックなドラフトストリームライフサイクルヘルパー

互換サブパスはラッパーとして残してもよいが、新しいサードパーティ Plugin がそれらを必要とするべきではない。

バンドル Plugin は移行中、予約済みランタイムサブパス経由で内部ヘルパーの import を維持してもよい。公開 docs は、`plugin-sdk/channel-message` が存在するようになったら、Plugin 作者をそこへ誘導するべきである。

## チャネルターンとの関係

`runtime.channel.turn.*` は移行中も残すべきである。

これは互換アダプターになるべきである:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` も最初は残すべきである:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

すべてのバンドル Plugin と既知のサードパーティ互換パスがブリッジされた後、`channel.turn` は非推奨にできる。公開 SDK 移行パスと、古い Plugin が引き続き動作するか明確なバージョンエラーで失敗することを証明する契約テストが存在するまでは、削除するべきではない。

## 互換性のガードレール

移行中、既存の配信コールバックが「この payload を送信する」以外の副作用を持つチャネルでは、汎用 durable delivery はオプトインである。

レガシーエントリーポイントは既定で非 durable である:

- `channel.turn.run` と `dispatchAssembledChannelTurn` は、そのチャネルが監査済みの durable ポリシー/options オブジェクトを明示的に提供しない限り、チャネルの配信コールバックを使用する。
- `channel.turn.runPrepared` は、prepared ディスパッチャーが送信コンテキストを明示的に呼び出すまで、チャネル所有のままにする。
- `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase`、direct-DM ヘルパーなどの公開互換ヘルパーは、呼び出し元が提供した `deliver` または `reply` コールバックより前に汎用 durable delivery を注入しない。

移行ブリッジ型では、`durable: undefined` は「durable ではない」を意味する。durable パスは、明示的なポリシー/options 値によってのみ有効化される。`durable: false` は互換用の表記として残してもよいが、実装がすべての未移行チャネルにそれを追加することを要求するべきではない。

現在のブリッジコードは、耐久性の判断を明示的に保たなければならない:

- 耐久的な最終配信は判別可能なステータスを返します。`handled_visible` と
  `handled_no_send` は終端状態です。`unsupported` と `not_applicable` は
  チャネル所有の配信へフォールバックできます。`failed` は送信失敗を伝播します。
- 汎用の耐久的な最終配信は、サイレント配信、返信先の保持、ネイティブ引用の保持、
  メッセージ送信フックなどのアダプター機能で制御されます。同等性が欠けている場合は、
  ユーザーに見える挙動を変える汎用送信ではなく、チャネル所有の配信を選ぶ必要があります。
- キューに支えられた耐久的送信は、配信意図の参照を公開します。既存の
  `pendingFinalDelivery*` セッションフィールドは、移行中に意図 ID を保持できます。
  最終状態は、凍結された返信テキストと場当たり的なコンテキストフィールドではなく、
  `MessageSendIntent` ストアです。

次のすべてが真になるまで、チャネルで汎用の耐久的パスを有効にしないでください。

- 汎用送信アダプターが、古い直接パスと同じレンダリングおよびトランスポート挙動を実行する。
- ローカルの送信後副作用が送信コンテキストを通じて保持される。
- アダプターが、すべてのプラットフォームメッセージ ID を含む受領情報または配信結果を返す。
- 準備済みディスパッチャーパスが新しい送信コンテキストを呼び出すか、耐久保証の対象外として文書化されたままである。
- フォールバック配信が、最初の 1 件だけでなく、投影されたすべてのペイロードを処理する。
- 耐久的なフォールバック配信が、投影されたペイロード配列全体を、再生可能な 1 件の意図またはバッチ計画として記録する。

保持すべき具体的な移行上の危険性:

- iMessage モニター配信は、送信成功後に送信済みメッセージをエコーキャッシュへ記録します。耐久的な最終送信でもそのキャッシュを引き続き埋める必要があります。そうしないと、
  OpenClaw が自分自身の最終返信を受信ユーザーメッセージとして再取り込みする可能性があります。
- Tlon は任意のモデル署名を追加し、グループ返信後に参加済みスレッドを記録します。汎用の耐久的配信がこれらの効果を迂回してはいけません。Tlon のレンダリング、送信、最終化アダプターへ移すか、Tlon をチャネル所有パスに残してください。
- Discord と他の準備済みディスパッチャーは、すでに直接配信とプレビュー挙動を所有しています。それらの準備済みディスパッチャーが最終出力を送信コンテキスト経由へ明示的にルーティングするまで、組み立て済みターンの耐久保証の対象にはなりません。
- Telegram のサイレントフォールバック配信は、投影されたペイロード配列全体を配信する必要があります。単一ペイロードの近道は、投影後に追加のフォールバックペイロードを落とす可能性があります。
- LINE、BlueBubbles、Zalo、Nostr、およびその他の既存の組み立て済み/ヘルパーパスには、返信トークン処理、メディアプロキシ、送信済みメッセージキャッシュ、読み込み/ステータスのクリーンアップ、またはコールバック専用ターゲットがある場合があります。これらの意味論が送信アダプターで表現され、テストで検証されるまで、チャネル所有の配信に残します。
- 直接 DM ヘルパーには、唯一の正しいトランスポートターゲットである返信コールバックがある場合があります。汎用アウトバウンドは `OriginatingTo` や `To` から推測して、そのコールバックを省略してはいけません。
- OpenClaw Gateway の失敗出力は人間に見える状態を保つ必要がありますが、タグ付けされたボット作成のルームエコーは、`allowBots` 認可より前に破棄する必要があります。チャネルは、短期の緊急回避策を除き、可視テキストのプレフィックスフィルターでこれを実装してはいけません。耐久契約は構造化された発信元メタデータです。

## 内部ストレージ

耐久キューは返信ペイロードではなく、メッセージ送信意図を保存する必要があります。

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

復旧ループ:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

キューは、再起動後に同じアカウント、スレッド、ターゲット、フォーマットポリシー、メディアルールを通じて再生できるだけの ID 情報を保持する必要があります。

## 失敗クラス

チャネルアダプターは、トランスポート失敗を閉じたカテゴリに分類します。

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

コアポリシー:

- `transient` と `rate_limit` は再試行する。
- レンダリングフォールバックが存在しない限り、`invalid_payload` は再試行しない。
- 設定が変更されるまで、`auth` または `permission` は再試行しない。
- `not_found` では、チャネルが安全と宣言している場合、ライブ最終化が編集から新規送信へフォールバックできるようにする。
- `conflict` では、受領情報/冪等性ルールを使用して、メッセージがすでに存在するかどうかを判断する。
- アダプターがプラットフォーム I/O を完了した可能性がある後、受領情報のコミット前に発生したエラーは、アダプターがプラットフォーム操作が発生しなかったことを証明できない限り、`unknown_after_send` になります。

## チャネルマッピング

| チャンネル                  | 移行対象                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | 受信確認応答ポリシーと永続化された最終送信。ライブアダプターが送信、編集プレビュー、古いプレビューの最終送信、トピック、引用返信プレビューのスキップ、メディアフォールバック、retry-after 処理を担う。                                                                                                                                                                   |
| Discord                  | 送信アダプターが既存の永続ペイロード配信をラップする。ライブアダプターが下書き編集、進行状況下書き、メディア/エラープレビューのキャンセル、返信先の保持、メッセージ ID 受領を担う。共有ルームでボットが作成した Gateway 失敗エコーを監査する。Discord が通常メッセージで発信元メタデータを保持できない場合は、送信レジストリまたは他のネイティブ同等機能を使う。 |
| Slack                    | 送信アダプターが通常のチャット投稿を処理する。ライブアダプターはスレッド形状が対応している場合はネイティブストリームを選び、それ以外は下書きプレビューを選ぶ。受領はスレッドのタイムスタンプを保持する。発信元アダプターは OpenClaw Gateway 失敗を Slack `chat.postMessage.metadata` にマップし、`allowBots` 認可の前にタグ付きのボットルームエコーを削除する。                                  |
| WhatsApp                 | 送信アダプターが、永続的な最終意図を伴うテキスト/メディア送信を担う。受信アダプターがグループメンションと送信者 ID を処理する。WhatsApp に編集可能なトランスポートが追加されるまでは、ライブは未実装のままでよい。                                                                                                                                                                        |
| Matrix                   | ライブアダプターが下書きイベント編集、最終化、削除、暗号化メディア制約、返信先不一致フォールバックを担う。受信アダプターが暗号化イベントのハイドレーションと重複排除を担う。発信元アダプターは OpenClaw Gateway 失敗の発信元を Matrix イベント内容にエンコードし、`allowBots` 処理の前に設定済みボットのルームエコーを削除するべきである。              |
| Mattermost               | ライブアダプターが 1 つの下書き投稿、進行状況/ツールの折りたたみ、その場での最終化、新規送信フォールバックを担う。                                                                                                                                                                                                                                                       |
| Microsoft Teams          | ライブアダプターがネイティブの進行状況とブロックストリーム動作を担う。送信アダプターがアクティビティと添付/カードの受領を担う。                                                                                                                                                                                                                                        |
| Feishu                   | レンダーアダプターがテキスト/カード/生データのレンダリングを担う。ライブアダプターがストリーミングカードと重複する最終送信の抑制を担う。送信アダプターがコメント、トピックセッション、メディア、音声抑制を担う。                                                                                                                                                                      |
| QQ Bot                   | ライブアダプターが C2C ストリーミング、アキュムレーターのタイムアウト、フォールバック最終送信を担う。レンダーアダプターがメディアタグとテキストの音声化を担う。                                                                                                                                                                                                                               |
| Signal                   | 単純な受信と送信アダプター。signal-cli が信頼できる編集サポートを追加しない限り、ライブアダプターは不要。                                                                                                                                                                                                                                                                |
| iMessage and BlueBubbles | 単純な受信と送信アダプター。iMessage 送信では、永続的な最終送信がモニター配信をバイパスできるようになる前に、モニターのエコーキャッシュ投入を保持する必要がある。BlueBubbles 固有の入力中表示、リアクション、添付はアダプター機能として残る。                                                                                                                            |
| Google Chat              | スレッド関係をスペースとスレッド ID にマップする、単純な受信と送信アダプター。タグ付き OpenClaw Gateway 失敗エコーに対する `allowBots=true` ルーム動作を監査する。                                                                                                                                                                                        |
| LINE                     | 返信トークン制約をターゲット/関係機能としてモデル化する、単純な受信と送信アダプター。                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | SDK 受信ブリッジと送信アダプター。                                                                                                                                                                                                                                                                                                                          |
| IRC                      | 単純な受信と送信アダプター。永続的な編集受領はない。                                                                                                                                                                                                                                                                                                    |
| Nostr                    | 暗号化 DM 用の受信と送信アダプター。受領はイベント ID。                                                                                                                                                                                                                                                                                           |
| QA Channel               | 受信、送信、ライブ、リトライ、復旧動作用の契約テストアダプター。                                                                                                                                                                                                                                                                                   |
| Synology Chat            | 単純な受信と送信アダプター。                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | 汎用的な永続最終配信を有効化する前に、送信アダプターはモデル署名レンダリングと参加済みスレッド追跡を保持する必要がある。                                                                                                                                                                                                                        |
| Twitch                   | レート制限分類を備えた、単純な受信と送信アダプター。                                                                                                                                                                                                                                                                                               |
| Zalo                     | 単純な受信と送信アダプター。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | 単純な受信と送信アダプター。                                                                                                                                                                                                                                                                                                                              |

## 移行計画

### フェーズ 1: 内部メッセージドメイン

- メッセージ、ターゲット、関係、
  発信元、受領、機能、永続意図、受信コンテキスト、送信
  コンテキスト、ライブコンテキスト、失敗クラス用の `src/channels/message/*` 型を追加する。
- 現在の返信配信で使われる移行ブリッジペイロード型に `origin?: MessageOrigin` を追加し、
  その後、リファクターで返信ペイロードを置き換える際に、そのフィールドを `ChannelMessage` とレンダリング済み
  メッセージ型へ移動する。
- アダプターとテストで形状が証明されるまで、これは内部のままにする。
- 状態遷移とシリアライズ用の純粋な単体テストを追加する。

### フェーズ 2: 永続送信コア

- 既存の送信キューを、返信ペイロードの永続性から永続的な
  メッセージ送信意図へ移動する。
- 永続送信意図には、1 つの返信ペイロードだけでなく、投影済みペイロード配列またはバッチ計画を
  持たせる。
- 互換変換を通じて現在のキュー復旧動作を保持する。
- `deliverOutboundPayloads` が `messages.send` を呼び出すようにする。
- アダプターがリプレイ安全性を宣言した後、新しいメッセージライフサイクルで
  永続意図を書き込めない場合は、最終送信の永続性をデフォルトにし、フェイルクローズする。既存の channel-turn と SDK 互換パスは、このフェーズ中はデフォルトで直接送信のままにする。
- 受領を一貫して記録する。
- 永続送信を終端的な副作用として扱うのではなく、受領と配信結果を元のディスパッチャー呼び出し元へ返す。
- 復旧、リプレイ、チャンク化送信が OpenClaw の運用上の来歴を保持できるように、永続送信意図を通じてメッセージ発信元を永続化する。

### フェーズ 3: Channel Turn ブリッジ

- `messages.receive` と `messages.send` の上に `channel.turn.run` と `dispatchAssembledChannelTurn` を再実装する。
- 現在のファクト型を安定したままにする。
- デフォルトではレガシー動作を維持する。assembled-turn チャンネルは、そのアダプターがリプレイ安全な永続性ポリシーで明示的にオプトインした場合にのみ永続化される。
- ネイティブ編集を最終化してまだ安全にリプレイできないパス向けの互換エスケープハッチとして `durable: false` を残すが、未移行チャンネルを保護するために `false` マーカーへ依存しない。
- チャンネルマッピングにより、汎用送信パスが古いチャンネル配信セマンティクスを保持することが証明された後、新しいメッセージライフサイクルでのみ assembled-turn の永続性をデフォルトにする。

### フェーズ 4: 準備済みディスパッチャーブリッジ

- `deliverDurableInboundReplyPayload` を send-context bridge に置き換える。
- 古いヘルパーはラッパーとして残す。
- Telegram、WhatsApp、Slack、Signal、iMessage、Discord を最初に移植する。これらは
  すでに durable-final 作業があるか、送信パスがより単純なため。
- 準備済み dispatcher は、send context へ明示的に opt-in するまで未対応として扱う。
  ドキュメントと changelog エントリでは、すべての自動 final reply を主張するのではなく、
  「組み立て済み channel turn」と言うか、移行済み channel パスを名指しする必要がある。
- `recordInboundSessionAndDispatchReply`、直接 DM ヘルパー、および同様の
  public 互換ヘルパーは、挙動を維持する。後で明示的な send-context opt-in を公開してもよいが、
  caller-owned delivery callback より前に generic durable delivery を自動的に試みてはならない。

### フェーズ 5: 統合 Live Lifecycle

- 2 つの proof adapter で `messages.live` を構築する。
  - Telegram は送信、編集、stale final send 用。
  - Matrix は draft finalization と redaction fallback 用。
- その後、Discord、Slack、Mattermost、Teams、QQ Bot、Feishu を移行する。
- 各 channel に parity test ができるまでは、重複した preview finalization コードを削除しない。

### フェーズ 6: Public SDK

- `openclaw/plugin-sdk/channel-message` を追加する。
- それを推奨 channel Plugin API として文書化する。
- package export、entrypoint inventory、生成 API baseline、Plugin SDK ドキュメントを更新する。
- `MessageOrigin`、origin encode/decode hook、共有 `shouldDropOpenClawEcho` predicate を
  channel-message SDK surface に含める。
- 古い subpath 用の互換ラッパーを残す。
- バンドル Plugin の移行後、reply 名の SDK ヘルパーをドキュメントで deprecated として示す。

### フェーズ 7: すべての Sender

reply ではない outbound producer をすべて `messages.send` に移す。

- cron と heartbeat 通知
- task 完了
- hook 結果
- approval prompt と approval result
- message tool send
- subagent 完了アナウンス
- 明示的な CLI または Control UI 送信
- automation/broadcast パス

ここでモデルは「agent reply」ではなく「OpenClaw が
message を送信する」ものになる。

### フェーズ 8: Turn を deprecated にする

- `channel.turn` は少なくとも 1 つの互換期間の間、ラッパーとして残す。
- migration note を公開する。
- 古い import に対して Plugin SDK 互換テストを実行する。
- バンドル Plugin が不要になり、third-party contract に安定した代替ができた後にのみ、
  古い internal ヘルパーを削除または非表示にする。

## テスト計画

Unit test:

- Durable send intent のシリアライズと復旧。
- idempotency key の再利用と duplicate suppression。
- receipt commit と replay skip。
- adapter が reconciliation をサポートする場合に、replay 前に reconcile する
  `unknown_after_send` recovery。
- failure classification policy。
- receive ack policy sequencing。
- reply、followup、system、broadcast send の relation mapping。
- Gateway-failure origin factory と `shouldDropOpenClawEcho` predicate。
- payload normalization、chunking、durable queue serialization、recovery を通した origin preservation。

Integration test:

- `channel.turn.run` の単純な adapter が、引き続き記録して送信する。
- legacy assembled-turn delivery は、channel が明示的に opt-in しない限り durable にならない。
- `channel.turn.runPrepared` bridge が、引き続き記録して finalize する。
- Public 互換ヘルパーはデフォルトで caller-owned delivery callback を呼び出し、
  それらの callback より前に generic-send しない。
- Durable fallback delivery は再起動後に投影済み payload 配列全体を replay し、
  早期 crash 後に後続 payload が未記録のまま残らない。
- Durable assembled-turn delivery は platform message id を buffered dispatcher に返す。
- custom delivery hook は、durable delivery が無効または利用不可の場合でも
  platform message id を返す。
- assistant completion と platform send の間の再起動後も final reply が残る。
- 許可されている場合、preview draft はその場で finalize される。
- media/error/reply-target mismatch により通常 delivery が必要な場合、
  preview draft はキャンセルまたは redacted される。
- block streaming と preview streaming が同じ text を両方 delivery しない。
- 早期に streaming された media が final delivery で重複しない。

Channel test:

- Telegram topic reply は、polling ack を receive context の safe completed watermark まで遅延する。
- accepted-but-not-delivered update の Telegram polling recovery は、
  永続化された safe-completed offset model でカバーされる。
- Telegram stale preview は新しい final を送信し、preview を clean up する。
- Telegram silent fallback はすべての投影済み fallback payload を送信する。
- Telegram silent fallback durability は、loop iteration ごとに単一 payload の durable intent を 1 つ作るのではなく、
  投影済み fallback 配列全体を atomically に記録する。
- Discord preview は media/error/explicit reply で cancel する。
- Discord prepared dispatcher final は、ドキュメントまたは changelog が Discord final-reply durability を主張する前に、
  send context 経由で route される。
- iMessage durable final send は monitor sent-message echo cache を populate する。
- LINE、BlueBubbles、Zalo、Nostr の legacy delivery path は、
  adapter parity test が存在するまで generic durable send によって bypass されない。
- Direct-DM/Nostr callback delivery は、完全な message target と replay-safe send adapter に明示的に移行されない限り、
  authoritative のままにする。
- Slack の tag 付き OpenClaw Gateway failure message は outbound で visible のままになり、
  tag 付き bot-room echo は `allowBots` より前に drop され、
  同じ visible text を持つ tag なし bot message は通常の bot authorization に従う。
- Slack native stream fallback to draft preview in top-level DM。
- Matrix preview finalization と redaction fallback。
- configured bot account からの Matrix tag 付き OpenClaw gateway-failure room echo は、
  `allowBots` handling より前に drop される。
- Discord と Google Chat の shared-room gateway-failure cascade audit は、
  そこで generic protection を主張する前に `allowBots` mode をカバーする。
- Mattermost draft finalization と fresh-send fallback。
- Teams native progress finalization。
- Feishu duplicate final suppression。
- QQ Bot accumulator timeout fallback。
- Tlon durable final send は model-signature rendering と participated thread tracking を維持する。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、
  Synology Chat、Tlon、Twitch、Zalo、Zalo Personal の単純な durable final send。

Validation:

- 開発中の targeted Vitest file。
- 変更 surface 全体に対する Testbox での `pnpm check:changed`。
- 完全な refactor を landing する前、または public SDK/export 変更後の
  Testbox でのより広範な `pnpm check`。
- 互換ラッパーを削除する前に、少なくとも 1 つの編集可能 channel と 1 つの単純な send-only channel で
  live または qa-channel smoke。

## 未解決事項

- Telegram が最終的に grammY runner source を、OpenClaw の永続化された restart watermark だけでなく
  platform-level redelivery を制御できる完全な durable polling source に置き換えるべきか。
- durable live preview state を final send intent と同じ queue record に保存するべきか、
  sibling live-state store に保存するべきか。
- `plugin-sdk/channel-message` の出荷後、互換ラッパーをどのくらいの期間ドキュメントに残すか。
- third-party Plugin は receive adapter を直接実装するべきか、それとも
  `defineChannelMessageAdapter` を通じて normalize/send/live hook のみを提供するべきか。
- public SDK に公開して安全な receipt field と internal runtime state の境界。
- self-echo cache や participated-thread marker などの side effect を、
  send-context hook、adapter-owned finalize step、receipt subscriber のどれとして model 化するべきか。
- どの channel が native origin metadata を持ち、どれが persisted outbound registry を必要とし、
  どれが reliable cross-bot echo suppression を提供できないか。

## 受け入れ基準

- すべてのバンドル message channel が final visible output を `messages.send` 経由で送信する。
- すべての inbound message channel が `messages.receive` または文書化された互換ラッパー経由で入る。
- すべての preview/edit/stream channel が draft state と finalization に `messages.live` を使う。
- `channel.turn` はラッパーだけになる。
- reply 名の SDK ヘルパーは互換 export であり、推奨パスではない。
- Durable recovery は、再起動後に pending final send を replay でき、
  final response を失ったり、すでに committed の send を重複させたりしない。
  platform outcome が不明な send は replay 前に reconcile されるか、
  その adapter では at-least-once として文書化される。
- Durable final send は、caller が文書化された non-durable mode を明示的に選択していない限り、
  durable intent を書き込めない場合に fail closed する。
- Legacy channel-turn と SDK 互換ヘルパーは、デフォルトで direct channel-owned delivery を使う。
  generic durable send は明示的な opt-in のみ。
- receipt は multi-part delivery のすべての platform message id と、
  threading/edit convenience 用の primary id を維持する。
- Durable ラッパーは、direct delivery callback を置き換える前に channel-local side effect を維持する。
- Prepared dispatcher は、final delivery path が明示的に send context を使うまで durable として数えない。
- Fallback delivery はすべての投影済み payload を扱う。
- Durable fallback delivery は、すべての投影済み payload を 1 つの replayable intent または batch plan に記録する。
- OpenClaw 起点の Gateway failure output は人間に visible だが、
  origin contract のサポートを宣言する channel では、tag 付き bot-authored room echo は
  bot authorization より前に drop される。
- ドキュメントは send、receive、live、state、receipt、relation、failure policy、
  migration、test coverage を説明する。

## 関連

- [Messages](/ja-JP/concepts/messages)
- [Streaming and chunking](/ja-JP/concepts/streaming)
- [Progress drafts](/ja-JP/concepts/progress-drafts)
- [Retry policy](/ja-JP/concepts/retry)
- [Channel turn kernel](/ja-JP/plugins/sdk-channel-turn)
