---
read_when:
    - チャンネルの送信または受信動作のリファクタリング
    - チャネルのインバウンド、返信ディスパッチ、アウトバウンドキュー、プレビューストリーミング、または Plugin SDK メッセージ API を変更する
    - 耐久的な送信、受信確認、プレビュー、編集、または再試行が必要な新しいチャンネル Plugin の設計
summary: 統合された永続的メッセージの受信、送信、プレビュー、編集、ストリーミングのライフサイクルに関する設計計画
title: メッセージライフサイクルのリファクタリング
x-i18n:
    generated_at: "2026-06-27T11:11:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

このページは、散在しているチャネルの受信、返信ディスパッチ、プレビューストリーミング、送信配信ヘルパーを、1つの永続的なメッセージライフサイクルで置き換えるための目標設計です。

短く言うと:

- コアプリミティブは **返信** ではなく **受信** と **送信** であるべきです。
- 返信は送信メッセージ上の関係にすぎません。
- ターンは受信処理の利便性のためのものであり、配信の所有者ではありません。
- 送信はコンテキストベースでなければなりません: `begin`、レンダリング、プレビューまたはストリーム、最終送信、コミット、失敗。
- 受信もコンテキストベースでなければなりません: 正規化、重複排除、ルーティング、記録、ディスパッチ、プラットフォーム ack、失敗。
- 公開 Plugin SDK は、小さなチャネル送信サーフェス1つに集約するべきです。

## 問題

現在のチャネルスタックは、いくつかの妥当な局所的ニーズから成長してきました:

- 単純な受信アダプターは `runtime.channel.inbound.run` を使います。
- リッチなアダプターは `runtime.channel.inbound.runPreparedReply` を使います。
- レガシーヘルパーは `dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`、返信ペイロードヘルパー、返信チャンク化、返信参照、送信ランタイムヘルパーを使います。
- プレビューストリーミングはチャネル固有のディスパッチャー内にあります。
- 最終配信の耐久性は、既存の返信ペイロード経路の周辺に追加されています。

この形は局所的なバグを修正しますが、OpenClaw に公開概念が多すぎ、配信セマンティクスがずれ得る場所も多すぎる状態を残します。

これを表面化させた信頼性の問題は次のとおりです:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標の不変条件は Telegram より広範です。コアが可視の送信メッセージが存在すべきだと判断したら、その意図はプラットフォーム送信を試みる前に永続化されなければならず、プラットフォーム受領は成功後にコミットされなければなりません。これにより、OpenClaw は少なくとも1回のリカバリーを得ます。厳密に1回の動作は、ネイティブの冪等性を証明できるアダプター、または送信後に結果不明となった試行を再生前にプラットフォーム状態と照合できるアダプターにのみ存在します。

これはこのリファクターの最終状態であり、すべての現在の経路の説明ではありません。移行中は、既存の送信ヘルパーはベストエフォートのキュー書き込みが失敗した場合でも直接送信にフォールスルーできます。このリファクターが完了するのは、永続的な最終送信がフェイルクローズするか、文書化された非永続ポリシーで明示的にオプトアウトする場合のみです。

## 目標

- すべてのチャネルメッセージ受信および送信経路に対する1つのコアライフサイクル。
- アダプターが再生安全な動作を宣言した後、新しいメッセージライフサイクルではデフォルトで永続的な最終送信。
- 共有されたプレビュー、編集、ストリーム、最終化、再試行、リカバリー、受領セマンティクス。
- サードパーティ Plugin が学習し保守できる小さな Plugin SDK サーフェス。
- 移行中の既存の受信返信互換呼び出し元との互換性。
- 新しいチャネル機能のための明確な拡張ポイント。
- コア内にプラットフォーム固有の分岐を置かないこと。
- トークン差分のチャネルメッセージを持たないこと。チャネルストリーミングは、メッセージのプレビュー、編集、追記、または完了済みブロック配信のままです。
- 可視の Gateway 障害が、共有された bot 有効ルームに新しいプロンプトとして再入力されないようにするための、運用/システム出力向けの構造化された OpenClaw 由来メタデータ。

## 非目標

- 最初のフェーズですべての既存チャネルに永続的メッセージ配信を強制しないこと。
- すべてのチャネルに同じネイティブトランスポート動作を強制しないこと。
- コアに Telegram トピック、Slack ネイティブストリーム、Matrix リダクション、Feishu カード、QQ 音声、または Teams アクティビティを教え込まないこと。
- すべての内部移行ヘルパーを安定した SDK API として公開しないこと。
- 再試行が完了済みの非冪等プラットフォーム操作を再生しないこと。

## 参照モデル

Vercel Chat には、優れた公開メンタルモデルがあります:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- `postMessage`、`editMessage`、`deleteMessage`、`stream`、`startTyping`、履歴取得などのアダプターメソッド
- 重複排除、ロック、キュー、永続化のための状態アダプター

OpenClaw は語彙を借りるべきであり、サーフェスをコピーするべきではありません。

そのモデルに加えて OpenClaw が必要とするもの:

- 直接トランスポート呼び出しの前の、永続的な送信意図。
- begin、commit、fail を持つ明示的な送信コンテキスト。
- プラットフォーム ack ポリシーを知る受信コンテキスト。
- 再起動後も残り、編集、削除、リカバリー、重複抑制を駆動できる受領。
- より小さな公開 SDK。バンドルされた Plugin は内部ランタイムヘルパーを使用できますが、サードパーティ Plugin には一貫したメッセージ API を1つ見せるべきです。
- エージェント固有の動作: セッション、トランスクリプト、ブロックストリーミング、ツール進捗、承認、メディアディレクティブ、サイレント返信、グループメンション履歴。

`thread.post()` スタイルの Promise だけでは OpenClaw には不十分です。それらは、送信がリカバリー可能かどうかを決めるトランザクション境界を隠してしまいます。

## コアモデル

新しいドメインは `src/channels/message/*` のような内部コア名前空間の下に置くべきです。

それは4つの概念を持ちます:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` は受信ライフサイクルを所有します。

`send` は送信ライフサイクルを所有します。

`live` はプレビュー、編集、進捗、ストリーム状態を所有します。

`state` は永続的な意図ストレージ、受領、冪等性、リカバリー、ロック、重複排除を所有します。

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

ターゲットはメッセージが存在する場所を表します:

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

これにより、同じ送信経路で通常の返信、cron 通知、承認プロンプト、タスク完了、メッセージツール送信、CLI または Control UI 送信、サブエージェント結果、自動化送信を扱えます。

### 起点

起点は、誰がメッセージを生成したか、および OpenClaw がそのメッセージのエコーをどう扱うべきかを表します。これは関係とは別です。メッセージはユーザーへの返信でありながら、OpenClaw 由来の運用出力でもあり得ます。

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

コアは OpenClaw 由来出力の意味を所有します。チャネルは、その起点を自分たちのトランスポートにどうエンコードするかを所有します。

最初に必須となる用途は Gateway 障害出力です。人間には「Agent failed before reply」や「Missing API key」のようなメッセージが引き続き表示されるべきですが、タグ付けされた OpenClaw 運用出力は、`allowBots` が有効な共有ルームで bot 作成の入力として受け入れられてはいけません。

### 受領

受領は第一級です:

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

受領は、永続的な意図から将来の編集、削除、プレビュー最終化、重複抑制、リカバリーへの橋渡しです。

受領は、1つのプラットフォームメッセージまたは複数パートの配信を表せます。チャンク化されたテキスト、メディアとテキスト、音声とテキスト、カードフォールバックは、スレッド化や後続編集のために primary id を公開しつつ、すべてのプラットフォーム id を保持しなければなりません。

## 受信コンテキスト

受信は単なるヘルパー呼び出しであるべきではありません。コアには、重複排除、ルーティング、セッション記録、プラットフォーム ack ポリシーを知るコンテキストが必要です。

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

Ack は1種類ではありません。受信契約はこれらのシグナルを分離しておかなければなりません:

- **トランスポート ack:** OpenClaw がイベントエンベロープを受け入れたことを、プラットフォーム Webhook またはソケットに伝えます。一部のプラットフォームでは、ディスパッチ前にこれが必要です。
- **ポーリングオフセット ack:** 同じイベントが再取得されないようにカーソルを進めます。リカバリー不能な作業を越えて進めてはいけません。
- **受信記録 ack:** OpenClaw が再配信を重複排除およびルーティングするのに十分な受信メタデータを永続化したことを確認します。
- **ユーザー可視の受領:** 任意の既読/ステータス/入力中動作です。耐久性境界にはなりません。

`ReceiveAckPolicy` はトランスポートまたはポーリング確認応答のみを制御します。既読受領やステータスリアクションに再利用してはいけません。

bot 認可の前に、チャネルがメッセージ起点メタデータをデコードできる場合、受信は共有 OpenClaw エコーポリシーを適用しなければなりません:

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

このドロップはタグベースであり、テキストベースではありません。同じ可視の Gateway 障害テキストを持つ bot 作成のルームメッセージでも、OpenClaw 起点メタデータがない場合は、通常の `allowBots` 認可を通過します。

Ack ポリシーは明示的です:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram ポーリングは現在、永続化された再起動ウォーターマークに受信コンテキストの ack ポリシーを使います。トラッカーは引き続き grammY 更新がミドルウェアチェーンに入るところを観測しますが、OpenClaw はディスパッチ成功後に安全に完了した update id のみを永続化し、失敗した更新またはそれより小さい保留更新を再起動後に再生可能なままにします。Telegram の上流 `getUpdates` 取得オフセットは引き続きポーリングライブラリによって制御されるため、OpenClaw の再起動ウォーターマークを超えたプラットフォームレベルの再配信が必要になった場合、残るより深い変更は完全に永続的なポーリングソースです。Webhook プラットフォームでは即時 HTTP ack が必要な場合がありますが、Webhook は再配信され得るため、受信重複排除と永続的な送信意図は依然として必要です。

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

このヘルパーは次のように展開されます:

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

intent は transport I/O より前に存在している必要があります。begin 後、commit 前の再起動は復旧可能です。

危険な境界は、プラットフォームでの成功後、receipt commit 前です。そこでプロセスが停止した場合、adapter がネイティブの冪等性または receipt 照合パスを提供しない限り、OpenClaw はプラットフォームメッセージが存在するかどうかを判断できません。そのような試行は盲目的に再実行するのではなく、`unknown_after_send` で再開する必要があります。照合のないチャンネルは、重複した可視メッセージがそのチャンネルと関係における許容済みかつ文書化済みのトレードオフである場合に限り、at-least-once の再実行を選択できます。現在の SDK 照合ブリッジでは、adapter が `reconcileUnknownSend` を宣言する必要があり、その後 `durableFinal.reconcileUnknownSend` に unknown entry を `sent`、`not_sent`、または `unresolved` として分類させます。再実行を許可するのは `not_sent` のみで、未解決の entry は terminal のままにするか、照合チェックのみを再試行します。

耐久性ポリシーは明示的である必要があります:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` は、core が durable intent を書き込めない場合に fail closed しなければならないことを意味します。`best_effort` は永続化が利用できない場合にフォールスルーできます。`disabled` は従来の直接送信動作を維持します。移行中、レガシー wrapper と公開互換性ヘルパーはデフォルトで `disabled` になります。チャンネルに汎用 outbound adapter があるという事実から `required` を推論してはなりません。

送信コンテキストは、チャンネルローカルな送信後効果も所有します。durable delivery が、以前にそのチャンネルの直接送信パスに紐づいていたローカル動作をバイパスする場合、その移行は安全ではありません。例として、self-echo 抑制キャッシュ、スレッド参加マーカー、ネイティブ編集アンカー、モデル署名レンダリング、プラットフォーム固有の重複ガードがあります。これらの効果は、そのチャンネルで durable generic final delivery を有効化できるようになる前に、send adapter、render adapter、または名前付き send-context hook のいずれかへ移す必要があります。

送信ヘルパーは、receipt を呼び出し元まで最後まで返す必要があります。durable wrapper は message id を握りつぶしたり、チャンネル配信結果を `undefined` に置き換えたりできません。buffered dispatcher はそれらの id をスレッドアンカー、後続の編集、preview finalization、重複抑制に使用します。

フォールバック送信は単一の payload ではなく batch に対して動作します。silent-reply rewrite、media fallback、card fallback、chunk projection はいずれも複数の配信可能メッセージを生成し得るため、send context は投影された batch 全体を配信するか、なぜ 1 つの payload だけが有効なのかを明示的に文書化する必要があります。

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

このようなフォールバックが durable である場合、投影された batch 全体を 1 つの durable send intent または別の atomic batch plan で表現する必要があります。各 payload を 1 つずつ記録するだけでは不十分です。payload 間でクラッシュすると、残りの payload に対する durable record がないまま、部分的に可視な fallback が残る可能性があります。復旧では、どの unit がすでに receipt を持っているかを把握し、不足している unit のみを再実行するか、adapter が照合するまで batch を `unknown_after_send` としてマークする必要があります。

## ライブコンテキスト

preview、edit、progress、stream の動作は、1 つのオプトイン lifecycle であるべきです。

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

live state は復旧または重複抑制に十分な耐久性を持ちます:

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

これは現在の動作をカバーするべきです:

- Telegram の送信と編集 preview。古くなった preview age の後は新しい final を使う。
- Discord の送信と編集 preview。media/error/明示的な reply で cancel。
- スレッド形状に応じた Slack のネイティブ stream または draft preview。
- Mattermost の draft post finalization。
- Matrix の draft event finalization または不一致時の redaction。
- Teams のネイティブ progress stream。
- QQ Bot stream または蓄積 fallback。

## Adapter サーフェス

公開 SDK のターゲットは 1 つの subpath であるべきです:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

Send adapter:

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

Receive adapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

preflight authorization の前に、`origin.decode` が OpenClaw-origin metadata を返す場合は、core が共有 OpenClaw echo predicate を実行する必要があります。receive adapter は bot author や room shape などのプラットフォーム事実を提供します。core は drop 判定と順序を所有し、チャンネルが text filter を再実装しないようにします。

Origin adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

core が `MessageOrigin` を設定します。チャンネルはそれをネイティブ transport metadata との間で変換するだけです。Slack はこれを `chat.postMessage({ metadata })` と inbound `message.metadata` にマッピングし、Matrix は追加の event content にマッピングできます。ネイティブ metadata のないチャンネルは、それが利用可能な最良の近似である場合、receipt/outbound registry を使用できます。

Capabilities:

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

新しい公開サーフェスは、これらの概念領域を吸収または非推奨化するべきです:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` のほとんどの公開利用
- ad hoc な draft stream lifecycle helper

互換性 subpath は wrapper として残せますが、新しいサードパーティ Plugin がそれらを必要とするべきではありません。

bundled plugin は移行中、reserved runtime subpath 経由の内部 helper import を維持してもかまいません。公開ドキュメントでは、`plugin-sdk/channel-outbound` が存在するようになったら plugin author をそこへ案内するべきです。

## channel inbound との関係

`runtime.channel.inbound.*` は移行中の runtime bridge です。

これは compatibility adapter になるべきです:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` も最初は残すべきです:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

古い `channel.turn` runtime surface は削除されました。runtime caller は `channel.inbound.*` を使用します。チャンネルドキュメントと SDK subpath は inbound/message という名詞を使用します。

## 互換性ガードレール

移行中、既存の delivery callback が「この payload を送信する」以上の副作用を持つチャンネルについては、generic durable delivery はオプトインです。

レガシー entry point はデフォルトで非 durable です:

- `channel.inbound.run` と `dispatchChannelInboundReply` は、そのチャンネルが監査済みの durable policy/options object を明示的に提供しない限り、そのチャンネルの delivery callback を使用します。
- `channel.inbound.runPreparedReply` は、prepared dispatcher が send context を明示的に呼び出すまで channel-owned のままです。
- `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase`、direct-DM helper などの公開互換性 helper は、呼び出し元が提供する `deliver` または `reply` callback より前に generic durable delivery を注入しません。

migration bridge type では、`durable: undefined` は「durable ではない」ことを意味します。durable path は明示的な policy/options value によってのみ有効化されます。`durable: false` は互換性のある書き方として残せますが、実装は移行前のすべてのチャンネルにそれを追加することを要求するべきではありません。

現在の bridge code は durability decision を明示的に保つ必要があります:

- 耐久性のある最終配信は、判別可能なステータスを返します。`handled_visible` と
  `handled_no_send` は終端です。`unsupported` と `not_applicable` は
  チャネル所有の配信へフォールバックできます。`failed` は送信失敗を伝播します。
- 汎用の耐久性のある最終配信は、サイレント配信、返信先の保持、ネイティブ引用の保持、
  メッセージ送信フックなどのアダプター機能によって制御されます。同等性が欠けている場合は、
  ユーザーに見える動作を変える汎用送信ではなく、チャネル所有の配信を選ぶべきです。
- キューに支えられた耐久送信は、配信意図の参照を公開します。既存の
  `pendingFinalDelivery*` セッションフィールドは、移行中に意図 ID を保持できます。
  最終状態は、凍結された返信テキストと場当たり的なコンテキストフィールドではなく、
  `MessageSendIntent` ストアです。

以下のすべてが真になるまで、そのチャネルで汎用の耐久パスを有効にしないでください。

- 汎用送信アダプターが、古い直接パスと同じレンダリングおよびトランスポート動作を実行する。
- ローカルの送信後副作用が、送信コンテキストを通じて保持される。
- アダプターが、すべてのプラットフォームメッセージ ID を含む受領情報または配信結果を返す。
- 準備済みディスパッチャーパスが、新しい送信コンテキストを呼び出すか、耐久保証の範囲外として文書化されたままになっている。
- フォールバック配信が、最初の 1 件だけではなく、投影されたすべてのペイロードを処理する。
- 耐久フォールバック配信が、投影されたペイロード配列全体を、1 つの再実行可能な意図またはバッチプランとして記録する。

保持すべき具体的な移行上の危険:

- iMessage モニター配信は、送信成功後に送信済みメッセージをエコーキャッシュへ記録します。耐久性のある最終送信でもそのキャッシュを設定し続ける必要があります。そうしないと、
  OpenClaw が自分自身の最終返信を受信ユーザーメッセージとして再取り込みする可能性があります。
- Tlon は任意のモデル署名を追加し、グループ返信後に参加済みスレッドを記録します。汎用の耐久配信はこれらの効果を迂回してはいけません。それらを Tlon の render/send/finalize アダプターへ移すか、Tlon をチャネル所有パスに残してください。
- Discord およびその他の準備済みディスパッチャーは、すでに直接配信とプレビュー動作を所有しています。それらの準備済みディスパッチャーが最終出力を送信コンテキストへ明示的にルーティングするまでは、組み立て済みターンの耐久保証の対象ではありません。
- Telegram のサイレントフォールバック配信は、投影されたペイロード配列全体を配信する必要があります。単一ペイロードのショートカットは、投影後の追加フォールバックペイロードを落とす可能性があります。
- LINE、Zalo、Nostr、およびその他の既存の組み立て済み/helper パスには、
  返信トークン処理、メディアプロキシ、送信済みメッセージキャッシュ、読み込み/ステータスのクリーンアップ、callback-only ターゲットがある場合があります。これらのセマンティクスが送信アダプターで表現され、テストで検証されるまで、チャネル所有の配信に残します。
- 直接 DM helper には、唯一の正しいトランスポートターゲットである返信コールバックがある場合があります。汎用 outbound は `OriginatingTo` や `To` から推測して、そのコールバックをスキップしてはいけません。
- OpenClaw Gateway の失敗出力は人間に見える状態を保つ必要がありますが、タグ付けされた bot-authored ルームエコーは `allowBots` 認可の前に破棄する必要があります。
  チャネルは、短期の緊急回避策を除き、可視テキストのプレフィックスフィルターでこれを実装してはいけません。耐久契約は構造化された origin metadata です。

## 内部ストレージ

耐久キューは、返信ペイロードではなく、メッセージ送信意図を保存するべきです。

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

リカバリーループ:

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

キューは、再起動後に同じアカウント、スレッド、ターゲット、フォーマットポリシー、メディアルールを通じて再実行できるだけの識別情報を保持するべきです。

## 失敗クラス

チャネルアダプターは、トランスポート失敗を閉じたカテゴリへ分類します。

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
- render fallback が存在しない限り、`invalid_payload` は再試行しない。
- 設定が変更されるまで、`auth` または `permission` は再試行しない。
- `not_found` では、チャネルが安全と宣言している場合、ライブ finalization が編集から新規送信へフォールバックできるようにする。
- `conflict` では、受領情報/冪等性ルールを使って、メッセージがすでに存在するかどうかを判断する。
- アダプターがプラットフォーム I/O を完了した可能性があるものの、受領情報のコミット前に発生したエラーは、アダプターがプラットフォーム操作が発生していないことを証明できない限り、`unknown_after_send` になります。

## チャネルマッピング

| チャンネル         | 移行先                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | 確認応答ポリシーと永続的な最終送信を受け取る。ライブアダプターは、送信と編集プレビュー、古いプレビューの最終送信、トピック、引用返信プレビューのスキップ、メディアフォールバック、retry-after 処理を担う。                                                                                                                                                                   |
| Discord         | 送信アダプターは既存の永続的なペイロード配信をラップする。ライブアダプターは、下書き編集、進行状況の下書き、メディア/エラープレビューのキャンセル、返信先の保持、メッセージ ID 受領を担う。共有ルーム内のボット作成 Gateway 失敗エコーを監査する。Discord が通常メッセージで送信元メタデータを運べない場合は、アウトバウンドレジストリまたはその他のネイティブ相当機能を使う。 |
| Slack           | 送信アダプターは通常のチャット投稿を処理する。ライブアダプターは、スレッド形状が対応する場合はネイティブストリームを選び、それ以外の場合は下書きプレビューを使う。受領情報はスレッドのタイムスタンプを保持する。送信元アダプターは OpenClaw Gateway 失敗を Slack `chat.postMessage.metadata` にマッピングし、`allowBots` 認可の前に、タグ付けされたボットルームのエコーを破棄する。                                  |
| WhatsApp        | 送信アダプターは、永続的な最終インテントを伴うテキスト/メディア送信を担う。受信アダプターはグループメンションと送信者 ID を処理する。WhatsApp に編集可能なトランスポートが用意されるまで、ライブは未実装のままでよい。                                                                                                                                                                        |
| Matrix          | ライブアダプターは、下書きイベント編集、最終化、リダクション、暗号化メディア制約、返信先不一致フォールバックを担う。受信アダプターは、暗号化イベントのハイドレーションと重複排除を担う。送信元アダプターは、OpenClaw Gateway 失敗の送信元を Matrix イベント内容にエンコードし、`allowBots` 処理の前に、設定済みボットのルームエコーを破棄する必要がある。              |
| Mattermost      | ライブアダプターは、1 つの下書き投稿、進行状況/ツールの折りたたみ、その場での最終化、新規送信フォールバックを担う。                                                                                                                                                                                                                                                       |
| Microsoft Teams | ライブアダプターは、ネイティブの進行状況とブロックストリーム動作を担う。送信アダプターは、アクティビティと添付ファイル/カードの受領を担う。                                                                                                                                                                                                                                        |
| Feishu          | レンダリングアダプターは、テキスト/カード/生レンダリングを担う。ライブアダプターは、ストリーミングカードと重複する最終送信の抑制を担う。送信アダプターは、コメント、トピックセッション、メディア、音声抑制を担う。                                                                                                                                                                      |
| QQ Bot          | ライブアダプターは、C2C ストリーミング、アキュムレータータイムアウト、フォールバックの最終送信を担う。レンダリングアダプターは、メディアタグとテキストの音声化を担う。                                                                                                                                                                                                                               |
| Signal          | 単純な受信アダプターと送信アダプター。signal-cli が信頼できる編集サポートを追加しない限り、ライブアダプターは不要。                                                                                                                                                                                                                                                                |
| iMessage        | 単純な受信アダプターと送信アダプター。永続的な最終送信がモニター配信をバイパスできるようになる前に、iMessage 送信はモニターのエコーキャッシュ生成を保持する必要がある。                                                                                                                                                                                                                 |
| Google Chat     | スレッド関係をスペースとスレッド ID にマッピングする、単純な受信アダプターと送信アダプター。タグ付けされた OpenClaw Gateway 失敗エコーに対する `allowBots=true` ルーム動作を監査する。                                                                                                                                                                                        |
| LINE            | 返信トークン制約をターゲット/関係ケイパビリティとしてモデル化する、単純な受信アダプターと送信アダプター。                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK 受信ブリッジと送信アダプター。                                                                                                                                                                                                                                                                                                                          |
| IRC             | 単純な受信アダプターと送信アダプター。永続的な編集受領はない。                                                                                                                                                                                                                                                                                                    |
| Nostr           | 暗号化 DM 用の受信アダプターと送信アダプター。受領情報はイベント ID。                                                                                                                                                                                                                                                                                           |
| QA チャンネル      | 受信、送信、ライブ、再試行、復旧動作の契約テストアダプター。                                                                                                                                                                                                                                                                                   |
| Synology Chat   | 単純な受信アダプターと送信アダプター。                                                                                                                                                                                                                                                                                                                              |
| Tlon            | 汎用の永続的な最終配信を有効化する前に、送信アダプターはモデル署名レンダリングと参加済みスレッド追跡を保持する必要がある。                                                                                                                                                                                                                        |
| Twitch          | レート制限分類を伴う、単純な受信アダプターと送信アダプター。                                                                                                                                                                                                                                                                                               |
| Zalo            | 単純な受信アダプターと送信アダプター。                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | 単純な受信アダプターと送信アダプター。                                                                                                                                                                                                                                                                                                                              |

## 移行計画

### フェーズ 1: 内部メッセージドメイン

- メッセージ、ターゲット、関係、
  送信元、受領情報、ケイパビリティ、永続的インテント、受信コンテキスト、送信
  コンテキスト、ライブコンテキスト、失敗クラス用の `src/channels/message/*` 型を追加する。
- 現在の返信配信で使われている移行ブリッジのペイロード型に `origin?: MessageOrigin` を追加し、
  その後、リファクタリングで返信ペイロードを置き換えるにつれて、そのフィールドを `ChannelMessage` とレンダリング済み
  メッセージ型に移す。
- アダプターとテストが形を証明するまで、これは内部に留める。
- 状態遷移とシリアライズ用の純粋なユニットテストを追加する。

### フェーズ 2: 永続的送信コア

- 既存のアウトバウンドキューを、返信ペイロードの永続性から永続的な
  メッセージ送信インテントへ移す。
- 永続的送信インテントには、1 つの返信ペイロードだけでなく、
  投影済みペイロード配列またはバッチ計画を持たせる。
- 互換変換を通じて現在のキュー復旧動作を保持する。
- `deliverOutboundPayloads` が `messages.send` を呼ぶようにする。
- アダプターが再生安全性を宣言した後、新しいメッセージライフサイクルで永続的インテントを書き込めない場合は、
  最終送信の永続性をデフォルトにし、フェイルクローズする。既存のインバウンドランナーと SDK 互換パスは、
  このフェーズ中はデフォルトで直接送信のままにする。
- 受領情報を一貫して記録する。
- 永続的送信を終端副作用として扱うのではなく、受領情報と配信結果を元のディスパッチャー呼び出し元へ返す。
- 永続的送信インテントを通じてメッセージ送信元を永続化し、復旧、再生、分割送信が OpenClaw の運用上の由来を保持するようにする。

### フェーズ 3: チャンネルインバウンドブリッジ

- `messages.receive` と `messages.send` の上に `channel.inbound.run` と `dispatchChannelInboundReply` を再実装する。
- 現在のファクト型を安定させておく。
- デフォルトではレガシー動作を保持する。組み立て済みターンのチャンネルは、アダプターが再生安全な永続性ポリシーで明示的にオプトインした場合にのみ永続化される。
- ネイティブ編集を最終化し、まだ安全に再生できないパスの互換エスケープハッチとして `durable: false` を保持するが、
  未移行チャンネルを保護するために `false` マーカーへ依存しない。
- チャンネルマッピングが、汎用送信パスが旧チャンネル配信セマンティクスを保持することを証明した後にのみ、
  新しいメッセージライフサイクルで組み立て済みターンの永続性をデフォルトにする。

### フェーズ 4: 準備済みディスパッチャーブリッジ

- `deliverDurableInboundReplyPayload` を送信コンテキストブリッジに置き換える。
- 古いヘルパーはラッパーとして維持する。
- Telegram、WhatsApp、Slack、Signal、iMessage、Discord を先に移植する。これらはすでに durable final の作業があるか、送信パスがより単純なため。
- すべての prepared dispatcher は、送信コンテキストへ明示的にオプトインするまで未カバーとして扱う。ドキュメントと changelog のエントリでは、すべての自動 final reply を主張するのではなく、「assembled channel turns」と書くか、移行済みのチャンネルパスを名指しする必要がある。
- `recordInboundSessionAndDispatchReply`、direct-DM ヘルパー、および同様の公開互換性ヘルパーは、挙動を維持する。後で明示的な送信コンテキストのオプトインを公開してもよいが、呼び出し元が所有する配信コールバックより前に、汎用 durable delivery を自動的に試行してはならない。

### フェーズ 5: 統合ライブライフサイクル

- `messages.live` を 2 つの証明アダプターで構築する:
  - Telegram: 送信、編集、stale final send 用。
  - Matrix: draft finalization と redaction fallback 用。
- その後、Discord、Slack、Mattermost、Teams、QQ Bot、Feishu を移行する。
- 重複した preview finalization コードは、各チャンネルに parity tests が揃ってからのみ削除する。

### フェーズ 6: 公開 SDK

- `openclaw/plugin-sdk/channel-outbound` を追加する。
- 推奨されるチャンネル Plugin API として文書化する。
- package exports、entrypoint inventory、生成された API baselines、Plugin SDK ドキュメントを更新する。
- `MessageOrigin`、origin の encode/decode hooks、および共有 `shouldDropOpenClawEcho` 述語を channel-outbound SDK サーフェスに含める。
- 古い subpaths 向けの互換性ラッパーを維持する。
- バンドル済み Plugin の移行後、reply-named SDK ヘルパーをドキュメントで非推奨としてマークする。

### フェーズ 7: すべての送信者

reply ではないすべての outbound producer を `messages.send` に移す:

- cron と heartbeat notifications
- task completions
- hook results
- approval prompts と approval results
- message tool sends
- subagent completion announcements
- 明示的な CLI または Control UI sends
- automation/broadcast paths

ここでモデルは「agent replies」ではなくなり、「OpenClaw sends
messages」になる。

### フェーズ 8: Turn 名付き互換性の削除

- inbound/message 名付きラッパーを互換性期間として維持する。
- migration notes を公開する。
- 古い imports に対して Plugin SDK compatibility tests を実行する。
- 古い internal helpers は、バンドル済み Plugin が不要になり、third-party contracts に安定した代替が用意された後でのみ、削除または非表示にする。

## テスト計画

Unit tests:

- Durable send intent の serialization と recovery。
- Idempotency key の再利用と duplicate suppression。
- Receipt commit と replay skip。
- adapter が reconciliation をサポートする場合に、replay 前に reconcile する `unknown_after_send` recovery。
- Failure classification policy。
- Receive ack policy sequencing。
- reply、followup、system、broadcast sends の relation mapping。
- Gateway-failure origin factory と `shouldDropOpenClawEcho` 述語。
- payload normalization、chunking、durable queue serialization、recovery を通じた origin preservation。

Integration tests:

- `channel.inbound.run` simple adapter が引き続き記録して送信する。
- Legacy assembled-event delivery は、チャンネルが明示的にオプトインしない限り durable にならない。
- `channel.inbound.runPreparedReply` ブリッジが引き続き記録して finalizes する。
- Public compatibility helpers はデフォルトで呼び出し元が所有する delivery callbacks を呼び出し、それらの callback より前に generic-send しない。
- Durable fallback delivery は restart 後に projected payload array 全体を replay し、早期クラッシュ後に後続 payload を未記録のまま残せない。
- Durable assembled-event delivery は platform message ids を buffered dispatcher に返す。
- Custom delivery hooks は、durable delivery が無効または利用不可の場合でも platform message ids を返す。
- assistant completion と platform send の間で restart しても final reply が残る。
- Preview draft は許可されている場合にその場で finalizes される。
- media/error/reply-target mismatch により通常配信が必要な場合、Preview draft は cancelled または redacted される。
- Block streaming と preview streaming が同じテキストを二重に配信しない。
- 早期に streamed された Media は final delivery で重複しない。

Channel tests:

- Telegram topic reply で、polling ack は receive context の safe completed watermark まで遅延される。
- Telegram polling recovery で、accepted-but-not-delivered updates が永続化された safe-completed offset model によってカバーされる。
- Telegram stale preview は新しい final を送信し、preview をクリーンアップする。
- Telegram silent fallback はすべての projected fallback payload を送信する。
- Telegram silent fallback durability は、ループ反復ごとに 1 つの single-payload durable intent ではなく、projected fallback array 全体をアトミックに記録する。
- Discord preview は media/error/explicit reply で cancel する。
- Discord prepared dispatcher finals は、docs または changelog が Discord final-reply durability を主張する前に、send context を経由してルーティングされる。
- iMessage durable final sends は monitor sent-message echo cache を埋める。
- LINE、Zalo、Nostr の legacy delivery paths は、adapter parity tests が存在するまで generic durable send によってバイパスされない。
- Direct-DM/Nostr callback delivery は、complete message target と replay-safe send adapter に明示的に移行されない限り authoritative のままにする。
- Slack のタグ付き OpenClaw gateway failure messages は outbound で可視のままにし、タグ付き bot-room echoes は `allowBots` より前に drop し、同じ visible text を持つタグなし bot messages は引き続き通常の bot authorization に従う。
- Slack native stream fallback to draft preview in top-level DMs。
- Matrix preview finalization と redaction fallback。
- Matrix tagged OpenClaw gateway-failure room echoes from configured bot accounts は `allowBots` handling より前に drop する。
- Discord と Google Chat の shared-room gateway-failure cascade audits は、そこで generic protection を主張する前に `allowBots` modes をカバーする。
- Mattermost draft finalization と fresh-send fallback。
- Teams native progress finalization。
- Feishu duplicate final suppression。
- QQ Bot accumulator timeout fallback。
- Tlon durable final sends は model-signature rendering と participated thread tracking を維持する。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal の simple durable final sends。

Validation:

- 開発中は対象を絞った Vitest files。
- 変更範囲全体に対する Testbox での `pnpm check:changed`。
- 完全なリファクタの landing 前、または public SDK/export changes 後に、Testbox でより広範な `pnpm check`。
- 互換性ラッパーを削除する前に、少なくとも 1 つの edit-capable channel と 1 つの simple send-only channel に対して live または qa-channel smoke。

## 未解決の問い

- Telegram が最終的に grammY runner source を、OpenClaw の永続化された restart watermark だけでなく platform-level redelivery を制御できる完全に durable な polling source に置き換えるべきか。
- durable live preview state を final send intent と同じ queue record に保存すべきか、sibling live-state store に保存すべきか。
- `plugin-sdk/channel-outbound` の出荷後、互換性ラッパーをどれくらいの期間ドキュメントに残すか。
- third-party plugins が receive adapters を直接実装すべきか、それとも `defineChannelMessageAdapter` を通じて normalize/send/live hooks のみを提供すべきか。
- public SDK で公開して安全な receipt fields と internal runtime state の境界。
- self-echo caches や participated-thread markers などの副作用を、send-context hooks、adapter-owned finalize steps、または receipt subscribers のどれとしてモデル化すべきか。
- どのチャンネルが native origin metadata を持ち、どれが永続化された outbound registries を必要とし、どれが信頼できる cross-bot echo suppression を提供できないか。

## 受け入れ基準

- すべてのバンドル済み message channel は final visible output を `messages.send` 経由で送信する。
- すべての inbound message channel は `messages.receive` または文書化された互換性ラッパーを経由して入る。
- すべての preview/edit/stream channel は draft state と finalization に `messages.live` を使用する。
- `channel.inbound` はラッパーのみである。
- Reply-named SDK helpers は compatibility exports であり、推奨パスではない。
- Durable recovery は、restart 後に pending final sends を replay でき、final response を失ったり、すでに committed された sends を重複させたりしない。platform outcome が unknown の sends は、replay 前に reconciled されるか、その adapter では at-least-once として文書化される。
- Durable final sends は、durable intent を書き込めない場合 fail closed する。ただし、呼び出し元が文書化された non-durable mode を明示的に選択した場合を除く。
- Legacy SDK compatibility helpers はデフォルトで channel-owned delivery を直接使う。generic durable send は明示的なオプトインのみ。
- Receipts は multi-part deliveries のすべての platform message ids と、threading/edit の利便性のための primary id を維持する。
- Durable wrappers は direct delivery callbacks を置き換える前に channel-local side effects を維持する。
- Prepared dispatchers は、final delivery path が send context を明示的に使用するまで durable として数えない。
- Fallback delivery はすべての projected payload を処理する。
- Durable fallback delivery はすべての projected payload を 1 つの replayable intent または batch plan に記録する。
- OpenClaw-originated gateway failure output は人間に可視だが、origin contract のサポートを宣言するチャンネルでは、タグ付き bot-authored room echoes は bot authorization より前に drop される。
- ドキュメントは send、receive、live、state、receipts、relations、failure policy、migration、test coverage を説明する。

## 関連

- [Messages](/ja-JP/concepts/messages)
- [Streaming and chunking](/ja-JP/concepts/streaming)
- [Progress drafts](/ja-JP/concepts/progress-drafts)
- [Retry policy](/ja-JP/concepts/retry)
- [Channel inbound API](/ja-JP/plugins/sdk-channel-inbound)
