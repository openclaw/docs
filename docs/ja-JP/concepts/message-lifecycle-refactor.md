---
read_when:
    - チャネルの送信または受信動作のリファクタリング
    - チャネルターン、返信ディスパッチ、送信キュー、プレビューストリーミング、または Plugin SDK メッセージ API の変更
    - 永続的な送信、受信確認、プレビュー、編集、または再試行が必要な新しいチャネルPluginを設計する
summary: 統合された永続メッセージの受信、送信、プレビュー、編集、ストリーミングのライフサイクルに関する設計計画
title: メッセージライフサイクルのリファクタリング
x-i18n:
    generated_at: "2026-05-10T19:31:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

このページは、散在しているチャネルターン、返信ディスパッチ、プレビュー ストリーミング、送信配送ヘルパーを、1つの耐久性のあるメッセージライフサイクルに置き換えるための目標設計です。

要約:

- コアプリミティブは **reply** ではなく **receive** と **send** にする。
- 返信は送信メッセージ上の関係にすぎない。
- ターンはインバウンド処理の便宜であり、配送の所有者ではない。
- 送信はコンテキストベースである必要がある: `begin`、レンダリング、プレビューまたはストリーム、最終送信、コミット、失敗。
- 受信もコンテキストベースである必要がある: 正規化、重複排除、ルーティング、記録、ディスパッチ、プラットフォーム ack、失敗。
- 公開 Plugin SDK は、小さなチャネルメッセージサーフェス1つに統合するべきである。

## 問題

現在のチャネルスタックは、いくつかの妥当な局所的ニーズから成長してきました。

- シンプルなインバウンドアダプターは `runtime.channel.turn.run` を使用する。
- 高機能なアダプターは `runtime.channel.turn.runPrepared` を使用する。
- レガシーヘルパーは `dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`、返信ペイロードヘルパー、返信チャンク化、返信参照、送信ランタイムヘルパーを使用する。
- プレビュー ストリーミングはチャネル固有のディスパッチャー内にある。
- 最終配送の耐久性は、既存の返信ペイロード経路の周辺に追加されつつある。

この形は局所的なバグを修正しますが、OpenClaw に公開概念が多すぎ、配送セマンティクスがずれ得る場所が多すぎる状態を残しています。

この問題を露呈させた信頼性の問題は次のとおりです。

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標の不変条件は Telegram より広いものです。コアが可視の送信メッセージが存在すべきだと判断したら、プラットフォーム送信を試みる前にその意図が耐久化され、成功後にプラットフォーム受領がコミットされなければなりません。これにより OpenClaw は少なくとも1回のリカバリーを得ます。厳密に1回の動作が存在するのは、ネイティブな冪等性を証明できるアダプター、または送信後の結果不明な試行を再生前にプラットフォーム状態と照合できるアダプターだけです。

これはこのリファクタリングの最終状態であり、すべての現在の経路の説明ではありません。移行中は、ベストエフォートのキュー書き込みが失敗した場合でも、既存の送信ヘルパーが直接送信にフォールスルーしてよいものとします。このリファクタリングが完了するのは、耐久化された最終送信が fail closed になるか、文書化された非耐久ポリシーで明示的にオプトアウトする場合だけです。

## 目標

- すべてのチャネルメッセージの受信および送信経路に対する1つのコアライフサイクル。
- アダプターが再生安全な動作を宣言した後、新しいメッセージライフサイクルでは耐久化された最終送信をデフォルトにする。
- 共有されたプレビュー、編集、ストリーム、最終化、リトライ、リカバリー、受領セマンティクス。
- サードパーティ Plugin が習得し保守できる小さな Plugin SDK サーフェス。
- 移行中の既存 `channel.turn` 呼び出し元との互換性。
- 新しいチャネル機能のための明確な拡張ポイント。
- コア内にプラットフォーム固有の分岐を置かない。
- トークンデルタのチャネルメッセージを置かない。チャネル ストリーミングは、メッセージのプレビュー、編集、追加、または完了済みブロック配送のままにする。
- 可視の Gateway 障害が、bot が有効な共有ルームに新しいプロンプトとして再投入されないようにする、OpenClaw 起源の運用/システム出力向けの構造化メタデータ。

## 非目標

- 第1フェーズでは `runtime.channel.turn.*` を削除しない。
- すべてのチャネルに同じネイティブ転送動作を強制しない。
- コアに Telegram トピック、Slack ネイティブストリーム、Matrix リダクション、Feishu カード、QQ 音声、Teams アクティビティを教えない。
- すべての内部移行ヘルパーを安定した SDK API として公開しない。
- 完了済みの非冪等なプラットフォーム操作をリトライで再生しない。

## 参照モデル

Vercel Chat には優れた公開メンタルモデルがあります。

- `Chat`
- `Thread`
- `Channel`
- `Message`
- `postMessage`、`editMessage`、`deleteMessage`、`stream`、`startTyping`、履歴取得などのアダプターメソッド
- 重複排除、ロック、キュー、永続化のための状態アダプター

OpenClaw はその語彙を借りるべきですが、サーフェスをコピーするべきではありません。

そのモデルを超えて OpenClaw に必要なもの:

- 直接転送呼び出しの前に、耐久化された送信意図を置く。
- begin、commit、fail を持つ明示的な送信コンテキスト。
- プラットフォーム ack ポリシーを知っている受信コンテキスト。
- 再起動後も残り、編集、削除、リカバリー、重複抑制を駆動できる受領。
- より小さな公開 SDK。バンドルされた Plugin は内部ランタイムヘルパーを使用できるが、サードパーティ Plugin には1つの一貫したメッセージ API を見せるべきである。
- エージェント固有の動作: セッション、トランスクリプト、ブロック ストリーミング、ツール進捗、承認、メディアディレクティブ、サイレント返信、グループメンション履歴。

`thread.post()` スタイルの Promise だけでは OpenClaw には不十分です。送信がリカバリー可能かどうかを決めるトランザクション境界を隠してしまうためです。

## コアモデル

新しいドメインは `src/channels/message/*` のような内部コア名前空間の下に置くべきです。

4つの概念があります。

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` はインバウンドライフサイクルを所有します。

`send` はアウトバウンドライフサイクルを所有します。

`live` はプレビュー、編集、進捗、ストリーム状態を所有します。

`state` は耐久化された意図ストレージ、受領、冪等性、リカバリー、ロック、重複排除を所有します。

## メッセージ用語

### メッセージ

正規化されたメッセージはプラットフォーム中立です。

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

ターゲットはメッセージが存在する場所を表します。

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

返信は関係であり、API ルートではありません。

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

これにより、同じ送信経路で通常の返信、Cron 通知、承認プロンプト、タスク完了、メッセージツール送信、CLI または Control UI 送信、サブエージェント結果、自動化送信を処理できます。

### 起源

起源は、誰がメッセージを生成したか、そして OpenClaw がそのメッセージのエコーをどう扱うべきかを表します。これは関係とは別です。メッセージはユーザーへの返信でありながら、OpenClaw 起源の運用出力でもあり得ます。

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

コアは OpenClaw 起源の出力の意味を所有します。チャネルはその起源を転送内にエンコードする方法を所有します。

最初に必要な用途は Gateway 障害出力です。「Agent failed before reply」や「Missing API key」のようなメッセージは人間には引き続き表示されるべきですが、OpenClaw 運用出力としてタグ付けされたものは、`allowBots` が有効な共有ルームで bot 作成の入力として受け入れてはなりません。

### 受領

受領は第一級です。

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

受領は、耐久化された意図から将来の編集、削除、プレビュー最終化、重複抑制、リカバリーへの橋渡しです。

受領は、1つのプラットフォームメッセージまたは複数パートの配送を表せます。チャンク化されたテキスト、メディアとテキスト、音声とテキスト、カードのフォールバックは、スレッド化や後続編集のためのプライマリ ID を公開しつつ、すべてのプラットフォーム ID を保持しなければなりません。

## 受信コンテキスト

受信は裸のヘルパー呼び出しであるべきではありません。コアには、重複排除、ルーティング、セッション記録、プラットフォーム ack ポリシーを知っているコンテキストが必要です。

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

Ack は1つのものではありません。受信契約は、これらのシグナルを分離しておく必要があります。

- **転送 ack:** OpenClaw がイベントエンベロープを受け入れたことをプラットフォーム Webhook またはソケットに伝える。一部のプラットフォームでは、ディスパッチ前にこれが必要である。
- **ポーリングオフセット ack:** 同じイベントが再取得されないようにカーソルを進める。リカバリーできない作業を越えて進めてはならない。
- **インバウンド記録 ack:** OpenClaw が再配送を重複排除およびルーティングするのに十分なインバウンドメタデータを永続化したことを確認する。
- **ユーザー可視の受領:** 任意の既読/ステータス/入力中動作。耐久性境界にはならない。

`ReceiveAckPolicy` は転送またはポーリングの確認応答だけを制御します。既読受領やステータスリアクションに再利用してはなりません。

bot 認可の前に、チャネルがメッセージ起源メタデータをデコードできる場合、受信は共有 OpenClaw エコーポリシーを適用しなければなりません。

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

このドロップはタグベースであり、テキストベースではありません。同じ可視 Gateway 障害テキストを持つ bot 作成のルームメッセージでも、OpenClaw 起源メタデータがなければ通常の `allowBots` 認可を通過します。

Ack ポリシーは明示的です。

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram ポーリングは現在、永続化された再起動ウォーターマークに受信コンテキストの ack ポリシーを使用します。トラッカーは grammY 更新がミドルウェアチェーンに入るときに引き続き観測しますが、OpenClaw はディスパッチ成功後に安全な完了済み更新 ID だけを永続化し、失敗した更新やより小さい保留中の更新を再起動後に再生可能なままにします。Telegram の上流 `getUpdates` 取得オフセットは引き続きポーリングライブラリによって制御されるため、OpenClaw の再起動ウォーターマークを超えたプラットフォームレベルの再配送が必要になった場合、残るより深い変更は完全に耐久化されたポーリングソースです。Webhook プラットフォームでは即時 HTTP ack が必要な場合がありますが、それでも Webhook は再配送され得るため、インバウンドの重複排除と耐久化されたアウトバウンド送信意図が必要です。

## 送信コンテキスト

送信もコンテキストベースです:

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

intent はトランスポート I/O の前に存在している必要がある。begin 後、commit 前の再起動は復旧可能。

危険な境界は、プラットフォームでの成功後、receipt commit 前にある。そこでプロセスが終了した場合、アダプターがネイティブな冪等性または receipt 調整パスを提供しない限り、OpenClaw はプラットフォームメッセージが存在するかどうかを判断できない。そのような試行は、やみくもに再実行するのではなく、`unknown_after_send` で再開する必要がある。調整機能のないチャネルは、そのチャネルと関係において可視メッセージの重複が許容される文書化済みのトレードオフである場合に限り、at-least-once の再実行を選択できる。現在の SDK 調整ブリッジでは、アダプターが `reconcileUnknownSend` を宣言する必要があり、その後 `durableFinal.reconcileUnknownSend` に unknown エントリを `sent`、`not_sent`、`unresolved` のいずれかに分類させる。再実行を許可するのは `not_sent` のみで、unresolved エントリは終端状態のままにするか、調整チェックのみを再試行する。

耐久性ポリシーは明示的でなければならない:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` は、コアが durable intent を書き込めない場合に fail closed しなければならないことを意味する。`best_effort` は永続化を利用できない場合にフォールスルーできる。`disabled` は従来の直接送信の動作を維持する。移行中、レガシーラッパーと公開互換ヘルパーは既定で `disabled` になる。チャネルが汎用 outbound アダプターを持つという事実から `required` を推論してはならない。

send context はチャネルローカルの送信後効果も所有する。durable delivery が、以前はチャネルの直接送信パスに付随していたローカル動作を迂回する場合、その移行は安全ではない。例として、self-echo 抑制キャッシュ、スレッド参加マーカー、ネイティブ編集アンカー、モデル署名レンダリング、プラットフォーム固有の重複ガードがある。これらの効果は、そのチャネルが durable な汎用 final delivery を有効にする前に、send アダプター、render アダプター、または名前付き send-context フックへ移す必要がある。

send ヘルパーは、呼び出し元まで receipt を返し続けなければならない。durable ラッパーはメッセージ ID を飲み込んだり、チャネル配送結果を `undefined` に置き換えたりできない。バッファリングされたディスパッチャーは、これらの ID をスレッドアンカー、後続の編集、プレビューの finalization、重複抑制に使用する。

フォールバック送信は単一ペイロードではなくバッチに対して動作する。silent-reply の書き換え、メディアフォールバック、カードフォールバック、チャンク投影は、いずれも複数の配送可能メッセージを生成し得る。そのため send context は、投影されたバッチ全体を配送するか、1 つのペイロードだけが有効である理由を明示的に文書化する必要がある。

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

このようなフォールバックが durable である場合、投影されたバッチ全体を 1 つの durable send intent、または別の atomic batch plan で表現する必要がある。各ペイロードを 1 つずつ記録するだけでは不十分である。ペイロード間でクラッシュすると、残りのペイロードに対する durable record がないまま、部分的に可視なフォールバックが残る可能性がある。復旧では、どの unit がすでに receipt を持っているかを把握し、不足している unit だけを再実行するか、アダプターが調整するまでバッチを `unknown_after_send` としてマークする必要がある。

## ライブコンテキスト

プレビュー、編集、進捗、ストリーム動作は、1 つのオプトインライフサイクルにするべきである。

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

live state は、復旧または重複抑制に十分なだけ durable である:

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

これは現在の動作をカバーするべきである:

- Telegram の送信と編集プレビュー。古いプレビュー age の後は新しい final を送る。
- Discord の送信と編集プレビュー。メディア、エラー、明示的な返信ではキャンセルする。
- Slack のネイティブストリームまたはドラフトプレビュー。スレッド形状に応じて使い分ける。
- Mattermost のドラフト投稿 finalization。
- Matrix のドラフトイベント finalization、または不一致時の redaction。
- Teams のネイティブ進捗ストリーム。
- QQ Bot のストリームまたは蓄積フォールバック。

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

send アダプター:

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

receive アダプター:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

preflight authorization の前に、`origin.decode` が OpenClaw-origin メタデータを返す場合、コアは共有 OpenClaw echo predicate を実行しなければならない。receive アダプターは bot author や room shape などのプラットフォーム事実を提供する。コアは drop 判定と順序付けを所有するため、チャネルがテキストフィルターを再実装する必要はない。

origin アダプター:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

コアは `MessageOrigin` を設定する。チャネルはそれをネイティブトランスポートメタデータとの間で変換するだけである。Slack はこれを `chat.postMessage({ metadata })` と inbound `message.metadata` にマップする。Matrix は追加のイベントコンテンツにマップできる。ネイティブメタデータのないチャネルは、それが利用可能な最善の近似である場合、receipt/outbound registry を使用できる。

capabilities:

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

## 公開 SDK の縮小

新しい公開サーフェスは、以下の概念領域を吸収または非推奨化するべきである:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` の公開利用の大半
- ad hoc なドラフトストリームライフサイクルヘルパー

互換サブパスはラッパーとして残せるが、新しいサードパーティ Plugin がそれらを必要とするべきではない。

バンドル済み Plugin は、移行中、予約済み runtime サブパスを通じた内部ヘルパー import を維持してよい。公開ドキュメントでは、`plugin-sdk/channel-message` が存在するようになったら、Plugin author をそこへ誘導するべきである。

## チャネルターンとの関係

`runtime.channel.turn.*` は移行中は残すべきである。

これは互換アダプターになるべきである:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` も当初は残すべきである:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

すべてのバンドル済み Plugin と既知のサードパーティ互換パスがブリッジされた後、`channel.turn` は非推奨化できる。公開済みの SDK 移行パスと、古い Plugin が引き続き動作するか明確なバージョンエラーで失敗することを証明する contract test が存在するまでは、削除するべきではない。

## 互換性のガードレール

移行中、既存の配送コールバックが「このペイロードを送信する」以上の副作用を持つチャネルでは、汎用 durable delivery はオプトインである。

レガシーエントリポイントは既定では non-durable である:

- `channel.turn.run` と `dispatchAssembledChannelTurn` は、そのチャネルが監査済みの durable policy/options オブジェクトを明示的に提供しない限り、チャネルの配送コールバックを使用する。
- `channel.turn.runPrepared` は、prepared dispatcher が send context を明示的に呼び出すまでチャネル所有のままにする。
- `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase`、direct-DM ヘルパーなどの公開互換ヘルパーは、呼び出し元が提供する `deliver` または `reply` コールバックの前に、汎用 durable delivery を注入しない。

移行ブリッジ型では、`durable: undefined` は「durable ではない」ことを意味する。durable path は、明示的な policy/options 値によってのみ有効化される。`durable:
false` は互換表記として残せるが、実装は未移行のすべてのチャネルにそれを追加することを要求するべきではない。

現在のブリッジコードは、耐久性の判断を明示的に保たなければならない:

- 耐久性のある最終配信は判別可能なステータスを返します。`handled_visible` と
  `handled_no_send` は終端です。`unsupported` と `not_applicable` は
  チャンネル所有の配信にフォールバックする場合があります。`failed` は送信失敗を伝播します。
- 汎用の耐久性のある最終配信は、サイレント配信、返信先の保持、ネイティブ引用の保持、
  メッセージ送信フックなどのアダプター能力によって制御されます。同等性が欠けている場合は、
  ユーザーに見える動作を変える汎用送信ではなく、チャンネル所有の配信を選ぶ必要があります。
- キューを基盤とする耐久性のある送信は、配信インテント参照を公開します。既存の
  `pendingFinalDelivery*` セッションフィールドは、移行中にインテント ID を保持できます。
  最終状態は、凍結された返信テキストと場当たり的なコンテキストフィールドではなく、
  `MessageSendIntent` ストアです。

以下がすべて真になるまで、チャンネルで汎用の耐久性のあるパスを有効にしないでください。

- 汎用送信アダプターが、古い直接パスと同じレンダリングおよびトランスポート動作を実行する。
- ローカルの送信後副作用が送信コンテキストを通じて保持される。
- アダプターが、すべてのプラットフォームメッセージ ID を含む受領情報または配信結果を返す。
- 準備済みディスパッチャーパスが、新しい送信コンテキストを呼び出すか、耐久性保証の対象外として文書化されたままである。
- フォールバック配信が、最初の 1 件だけでなく、射影されたすべてのペイロードを処理する。
- 耐久性のあるフォールバック配信が、射影されたペイロード配列全体を、1 つの再生可能なインテントまたはバッチ計画として記録する。

保持すべき具体的な移行上の危険:

- iMessage モニター配信は、送信成功後に送信済みメッセージをエコーキャッシュに記録します。耐久性のある最終送信でもそのキャッシュを必ず埋める必要があります。そうしないと、
  OpenClaw が自身の最終返信を、受信ユーザーメッセージとして再取り込みする可能性があります。
- Tlon は任意のモデル署名を付加し、グループ返信後に参加済みスレッドを記録します。汎用の耐久性のある配信は、これらの効果を迂回してはなりません。それらを Tlon のレンダリング、送信、最終化アダプターへ移すか、Tlon をチャンネル所有パスに留めてください。
- Discord やその他の準備済みディスパッチャーは、直接配信とプレビュー動作をすでに所有しています。それらの準備済みディスパッチャーが最終メッセージを送信コンテキストへ明示的にルーティングするまで、組み立て済みターンの耐久性保証の対象にはなりません。
- Telegram のサイレントフォールバック配信は、射影されたペイロード配列全体を配信する必要があります。単一ペイロードのショートカットは、射影後の追加フォールバックペイロードを落とす可能性があります。
- LINE、Zalo、Nostr、およびその他の既存の組み立て済みパスやヘルパーパスには、
  返信トークン処理、メディアプロキシ、送信済みメッセージキャッシュ、読み込み/ステータスのクリーンアップ、またはコールバック専用ターゲットがある場合があります。それらのセマンティクスが送信アダプターで表現され、テストで検証されるまで、チャンネル所有の配信に留めます。
- Direct-DM ヘルパーには、唯一の正しいトランスポートターゲットである返信コールバックがある場合があります。汎用アウトバウンドは、`OriginatingTo` や `To` から推測してそのコールバックをスキップしてはなりません。
- OpenClaw Gateway の失敗出力は人間に見える状態を保つ必要がありますが、タグ付けされたボット作成のルームエコーは、`allowBots` 認可の前に破棄する必要があります。短期の緊急停止策を除き、チャンネルは可視テキストの接頭辞フィルターでこれを実装してはなりません。耐久性契約は構造化された発信元メタデータです。

## 内部ストレージ

耐久性キューは、返信ペイロードではなくメッセージ送信インテントを保存する必要があります。

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

キューは、再起動後に同じアカウント、スレッド、ターゲット、書式設定ポリシー、メディアルールを通じて再生するために十分な識別情報を保持する必要があります。

## 失敗クラス

チャンネルアダプターは、トランスポート失敗を閉じたカテゴリへ分類します。

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
- `not_found` では、チャンネルが安全であると宣言している場合、ライブ最終化で編集から新規送信へフォールバックできるようにする。
- `conflict` では、受領情報/冪等性ルールを使ってメッセージがすでに存在するかどうかを判断する。
- アダプターがプラットフォーム I/O を完了した可能性がある後、受領情報のコミット前に発生したエラーは、プラットフォーム操作が発生しなかったことをアダプターが証明できる場合を除き、すべて `unknown_after_send` になります。

## チャンネルマッピング

| チャネル         | 移行対象                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | ack ポリシーと耐久性のある最終送信を受信します。ライブアダプターは、送信と編集プレビュー、古いプレビューの最終送信、トピック、引用返信プレビューのスキップ、メディアフォールバック、retry-after 処理を所有します。                                                                                                                                                                   |
| Discord         | 送信アダプターは既存の耐久性のあるペイロード配信をラップします。ライブアダプターは、ドラフト編集、進捗ドラフト、メディア/エラープレビューのキャンセル、返信先の保持、メッセージ ID 受領を所有します。共有ルーム内の bot 作成 Gateway 失敗エコーを監査します。Discord が通常メッセージで origin メタデータを保持できない場合は、アウトバウンドレジストリまたは他のネイティブ同等機能を使用します。 |
| Slack           | 送信アダプターは通常のチャット投稿を処理します。ライブアダプターは、スレッド形状が対応している場合はネイティブストリームを選択し、それ以外の場合はドラフトプレビューを選択します。受領はスレッドタイムスタンプを保持します。origin アダプターは OpenClaw gateway 失敗を Slack `chat.postMessage.metadata` にマッピングし、`allowBots` 認可の前にタグ付き bot ルームエコーを破棄します。                                  |
| WhatsApp        | 送信アダプターは、耐久性のある最終 intent を伴うテキスト/メディア送信を所有します。受信アダプターは、グループメンションと送信者 ID を処理します。WhatsApp に編集可能なトランスポートができるまで、ライブは未実装のままで構いません。                                                                                                                                                                        |
| Matrix          | ライブアダプターは、ドラフトイベント編集、最終化、redaction、暗号化メディア制約、返信先不一致フォールバックを所有します。受信アダプターは、暗号化イベントの hydration と重複排除を所有します。origin アダプターは、OpenClaw gateway 失敗 origin を Matrix イベント内容にエンコードし、`allowBots` 処理の前に設定済み bot ルームエコーを破棄する必要があります。              |
| Mattermost      | ライブアダプターは、1 つのドラフト投稿、進捗/ツールの折りたたみ、その場での最終化、新規送信フォールバックを所有します。                                                                                                                                                                                                                                                       |
| Microsoft Teams | ライブアダプターは、ネイティブ進捗とブロックストリーム動作を所有します。送信アダプターは、アクティビティと添付ファイル/カード受領を所有します。                                                                                                                                                                                                                                        |
| Feishu          | render アダプターは、テキスト/カード/raw レンダリングを所有します。ライブアダプターは、ストリーミングカードと重複最終送信の抑制を所有します。送信アダプターは、コメント、トピックセッション、メディア、音声抑制を所有します。                                                                                                                                                                      |
| QQ Bot          | ライブアダプターは、C2C ストリーミング、accumulator タイムアウト、フォールバック最終送信を所有します。render アダプターは、メディアタグとテキストの音声化を所有します。                                                                                                                                                                                                                               |
| Signal          | 単純な受信と送信アダプターです。signal-cli が信頼できる編集サポートを追加しない限り、ライブアダプターはありません。                                                                                                                                                                                                                                                                |
| iMessage        | 単純な受信と送信アダプターです。iMessage 送信は、耐久性のある最終送信がモニター配信をバイパスできるようになる前に、モニター echo-cache の投入を保持する必要があります。                                                                                                                                                                                                                 |
| Google Chat     | スレッド関係をスペースとスレッド ID にマッピングする、単純な受信と送信アダプターです。タグ付き OpenClaw gateway 失敗エコーについて、`allowBots=true` ルーム動作を監査します。                                                                                                                                                                                        |
| LINE            | reply-token 制約を target/relation capability としてモデル化する、単純な受信と送信アダプターです。                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK 受信ブリッジと送信アダプターです。                                                                                                                                                                                                                                                                                                                          |
| IRC             | 単純な受信と送信アダプターで、耐久性のある編集受領はありません。                                                                                                                                                                                                                                                                                                    |
| Nostr           | 暗号化 DM 用の受信と送信アダプターです。受領はイベント ID です。                                                                                                                                                                                                                                                                                           |
| QA Channel      | 受信、送信、ライブ、リトライ、復旧動作の契約テストアダプターです。                                                                                                                                                                                                                                                                                   |
| Synology Chat   | 単純な受信と送信アダプターです。                                                                                                                                                                                                                                                                                                                              |
| Tlon            | 汎用の耐久性のある最終配信を有効化する前に、送信アダプターはモデル署名レンダリングと参加済みスレッド追跡を保持する必要があります。                                                                                                                                                                                                                        |
| Twitch          | レート制限分類を伴う、単純な受信と送信アダプターです。                                                                                                                                                                                                                                                                                               |
| Zalo            | 単純な受信と送信アダプターです。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | 単純な受信と送信アダプターです。                                                                                                                                                                                                                                                                                                                              |

## 移行計画

### フェーズ 1: 内部メッセージドメイン

- メッセージ、ターゲット、関係、
  origin、受領、capability、耐久性のある intent、受信コンテキスト、送信
  コンテキスト、ライブコンテキスト、失敗クラス用の `src/channels/message/*` 型を追加します。
- 現在の返信配信で使われる移行ブリッジペイロード型に
  `origin?: MessageOrigin` を追加し、その後、リファクタリングで返信ペイロードが置き換えられるにつれて、そのフィールドを `ChannelMessage` とレンダリング済み
  メッセージ型へ移動します。
- アダプターとテストで形が証明されるまで、これは内部に保ちます。
- 状態遷移とシリアライズの純粋なユニットテストを追加します。

### フェーズ 2: 耐久性のある送信コア

- 既存のアウトバウンドキューを、返信ペイロードの耐久性から、耐久性のある
  メッセージ送信 intent に移動します。
- 耐久性のある送信 intent は、1 つの返信ペイロードだけでなく、
  投影済みペイロード配列またはバッチ計画を保持できるようにします。
- 互換変換を通じて、現在のキュー復旧動作を保持します。
- `deliverOutboundPayloads` が `messages.send` を呼び出すようにします。
- アダプターがリプレイ安全性を宣言した後、新しいメッセージライフサイクルで耐久性のある intent を書き込めない場合は、最終送信の耐久性をデフォルトにし、fail closed します。既存の channel-turn と SDK 互換パスは、このフェーズ中はデフォルトで direct-send のままにします。
- 受領を一貫して記録します。
- 耐久性のある送信を終端の副作用として扱うのではなく、受領と配信結果を元の dispatcher 呼び出し元へ返します。
- 復旧、リプレイ、チャンク化送信で OpenClaw の運用上の由来を保持できるよう、耐久性のある送信 intent を通じてメッセージ origin を永続化します。

### フェーズ 3: Channel Turn ブリッジ

- `messages.receive` と `messages.send` の上に
  `channel.turn.run` と `dispatchAssembledChannelTurn` を再実装します。
- 現在の fact 型を安定したまま保ちます。
- デフォルトではレガシー動作を維持します。assembled-turn チャネルは、そのアダプターがリプレイ安全な耐久性ポリシーで明示的に opt in した場合にのみ耐久性を持ちます。
- ネイティブ編集を最終化してまだ安全にリプレイできないパス向けの互換エスケープハッチとして、`durable: false` を維持します。ただし、未移行チャネルを保護するために `false` マーカーへ依存しないでください。
- チャネルマッピングによって汎用送信パスが古いチャネル配信セマンティクスを保持することが証明された後、新しいメッセージライフサイクルでのみ assembled-turn の耐久性をデフォルトにします。

### フェーズ 4: Prepared Dispatcher ブリッジ

- `deliverDurableInboundReplyPayload` を送信コンテキストブリッジに置き換える。
- 古いヘルパーはラッパーとして維持する。
- Telegram、WhatsApp、Slack、Signal、iMessage、Discord を先に移植する。これらはすでに durable-final 作業があるか、送信パスがより単純なため。
- prepared dispatcher は、送信コンテキストに明示的にオプトインするまで未対応として扱う。ドキュメントと changelog エントリでは、すべての自動最終返信を主張するのではなく、「assembled channel turns」と書くか、移行済みのチャネルパス名を挙げる必要がある。
- `recordInboundSessionAndDispatchReply`、direct-DM ヘルパー、および同様の公開互換ヘルパーは、挙動を維持する。後で明示的な送信コンテキストへのオプトインを公開してもよいが、呼び出し元が所有する配送コールバックより前に、汎用の durable 配送を自動で試みてはならない。

### フェーズ 5: 統一されたライブライフサイクル

- 2 つの proof adapter で `messages.live` を構築する:
  - Telegram は送信、編集、stale final send 用。
  - Matrix は draft finalization と redaction fallback 用。
- その後、Discord、Slack、Mattermost、Teams、QQ Bot、Feishu を移行する。
- 各チャネルに parity tests が揃ってから、重複した preview finalization コードを削除する。

### フェーズ 6: 公開 SDK

- `openclaw/plugin-sdk/channel-message` を追加する。
- これを推奨されるチャネル Plugin API として文書化する。
- package exports、entrypoint inventory、生成された API baselines、Plugin SDK ドキュメントを更新する。
- `MessageOrigin`、origin encode/decode hooks、共有 `shouldDropOpenClawEcho` predicate を channel-message SDK surface に含める。
- 古い subpaths の互換ラッパーを維持する。
- bundled plugins の移行後、reply-named SDK helpers をドキュメント上で deprecated としてマークする。

### フェーズ 7: すべての送信元

返信以外のすべての outbound producers を `messages.send` に移す:

- cron と heartbeat 通知
- task completions
- hook results
- approval prompts と approval results
- message tool sends
- subagent completion announcements
- 明示的な CLI または Control UI sends
- automation/broadcast paths

ここでモデルは「agent replies」ではなくなり、「OpenClaw sends messages」になる。

### フェーズ 8: Turn の非推奨化

- `channel.turn` は少なくとも 1 つの互換期間ではラッパーとして維持する。
- migration notes を公開する。
- 古い imports に対して Plugin SDK compatibility tests を実行する。
- bundled plugin が不要になり、third-party contracts に安定した代替ができた後でのみ、古い内部ヘルパーを削除または非表示にする。

## テスト計画

Unit tests:

- durable send intent serialization と recovery。
- idempotency key reuse と duplicate suppression。
- receipt commit と replay skip。
- adapter が reconciliation をサポートする場合に、replay 前に reconciles する `unknown_after_send` recovery。
- failure classification policy。
- receive ack policy sequencing。
- reply、followup、system、broadcast sends の relation mapping。
- Gateway-failure origin factory と `shouldDropOpenClawEcho` predicate。
- payload normalization、chunking、durable queue serialization、recovery を通じた origin preservation。

Integration tests:

- `channel.turn.run` の simple adapter が引き続き record と send を行う。
- Legacy assembled-turn delivery は、チャネルが明示的に opt in しない限り durable にならない。
- `channel.turn.runPrepared` bridge が引き続き record と finalize を行う。
- Public compatibility helpers はデフォルトで caller-owned delivery callbacks を呼び出し、それらの callbacks より前に generic-send しない。
- Durable fallback delivery は restart 後に projected payload array 全体を replay し、early crash 後に後続 payloads が unrecorded のまま残らない。
- Durable assembled-turn delivery は platform message ids を buffered dispatcher に返す。
- durable delivery が disabled または unavailable の場合でも、custom delivery hooks は platform message ids を返す。
- assistant completion と platform send の間で restart しても final reply が残る。
- Preview draft は許可される場合にその場で finalize される。
- media/error/reply-target mismatch により normal delivery が必要な場合、Preview draft は cancel または redact される。
- Block streaming と preview streaming が同じテキストを両方配送しない。
- 早期に streamed された media が final delivery で重複しない。

Channel tests:

- Telegram topic reply で polling ack が receive context の safe completed watermark まで遅延される。
- Telegram polling recovery で、persisted safe-completed offset model により accepted-but-not-delivered updates がカバーされる。
- Telegram stale preview が fresh final を送信し、preview をクリーンアップする。
- Telegram silent fallback が projected fallback payload をすべて送信する。
- Telegram silent fallback durability は、ループ反復ごとの単一 payload durable intent ではなく、projected fallback array 全体を atomic に記録する。
- Discord preview cancel on media/error/explicit reply。
- Discord prepared dispatcher finals は、ドキュメントまたは changelog が Discord final-reply durability を主張する前に、send context 経由で route される。
- iMessage durable final sends は monitor sent-message echo cache を populate する。
- LINE、Zalo、Nostr の legacy delivery paths は、adapter parity tests が存在するまで generic durable send によって bypass されない。
- Direct-DM/Nostr callback delivery は、complete message target と replay-safe send adapter に明示的に移行されない限り authoritative のまま。
- Slack tagged OpenClaw gateway failure messages は outbound で visible のままになり、tagged bot-room echoes は `allowBots` の前に drop され、同じ visible text を持つ untagged bot messages は通常の bot authorization に従う。
- Slack native stream fallback to draft preview in top-level DMs。
- Matrix preview finalization と redaction fallback。
- Matrix tagged OpenClaw gateway-failure room echoes from configured bot accounts は `allowBots` handling の前に drop される。
- Discord と Google Chat の shared-room gateway-failure cascade audits は、そこで generic protection を主張する前に `allowBots` modes をカバーする。
- Mattermost draft finalization と fresh-send fallback。
- Teams native progress finalization。
- Feishu duplicate final suppression。
- QQ Bot accumulator timeout fallback。
- Tlon durable final sends は model-signature rendering と participated thread tracking を保持する。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal の simple durable final sends。

Validation:

- 開発中は対象を絞った Vitest files。
- full changed surface について Testbox で `pnpm check:changed`。
- complete refactor を landing する前、または public SDK/export changes の後に、Testbox でより広範な `pnpm check`。
- compatibility wrappers を削除する前に、少なくとも 1 つの edit-capable channel と 1 つの simple send-only channel で live または qa-channel smoke。

## 未解決の質問

- Telegram が最終的に grammY runner source を、OpenClaw の persisted restart watermark だけでなく platform-level redelivery を制御できる fully durable polling source に置き換えるべきか。
- durable live preview state を final send intent と同じ queue record に保存すべきか、sibling live-state store に保存すべきか。
- `plugin-sdk/channel-message` の出荷後、compatibility wrappers をどのくらいの期間文書化しておくか。
- third-party plugins は receive adapters を直接実装すべきか、それとも `defineChannelMessageAdapter` を通じて normalize/send/live hooks のみを提供すべきか。
- public SDK に公開して安全な receipt fields と、internal runtime state に留めるべきものはどれか。
- self-echo caches や participated-thread markers などの side effects を、send-context hooks、adapter-owned finalize steps、receipt subscribers のどれとしてモデル化すべきか。
- どのチャネルが native origin metadata を持ち、どのチャネルが persisted outbound registries を必要とし、どのチャネルが reliable cross-bot echo suppression を提供できないか。

## 受け入れ基準

- すべての bundled message channel が final visible output を `messages.send` 経由で送信する。
- すべての inbound message channel が `messages.receive` または文書化された compatibility wrapper 経由で入る。
- すべての preview/edit/stream channel が draft state と finalization に `messages.live` を使用する。
- `channel.turn` はラッパーのみである。
- Reply-named SDK helpers は compatibility exports であり、推奨パスではない。
- Durable recovery は restart 後に pending final sends を replay でき、final response を失わず、すでに committed sends を重複させない。platform outcome が unknown の sends は replay 前に reconciled されるか、その adapter について at-least-once として文書化される。
- Durable final sends は durable intent を書き込めない場合に fail closed する。ただし caller が文書化された non-durable mode を明示的に選択した場合を除く。
- Legacy channel-turn と SDK compatibility helpers は、デフォルトで direct channel-owned delivery を使用する。generic durable send は明示的な opt-in のみ。
- Receipts は multi-part deliveries のすべての platform message ids と、threading/edit convenience 用の primary id を保持する。
- Durable wrappers は direct delivery callbacks を置き換える前に channel-local side effects を保持する。
- Prepared dispatchers は、その final delivery path が明示的に send context を使用するまで durable として数えない。
- Fallback delivery はすべての projected payload を処理する。
- Durable fallback delivery はすべての projected payload を 1 つの replayable intent または batch plan に記録する。
- OpenClaw-originated gateway failure output は humans に visible だが、origin contract のサポートを宣言するチャネルでは tagged bot-authored room echoes が bot authorization の前に drop される。
- ドキュメントは send、receive、live、state、receipts、relations、failure policy、migration、test coverage を説明する。

## 関連

- [メッセージ](/ja-JP/concepts/messages)
- [ストリーミングとチャンク化](/ja-JP/concepts/streaming)
- [進行状況ドラフト](/ja-JP/concepts/progress-drafts)
- [リトライポリシー](/ja-JP/concepts/retry)
- [Channel turn kernel](/ja-JP/plugins/sdk-channel-turn)
