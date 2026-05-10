---
read_when:
    - チャンネルPluginを構築していて、共有の受信ターンライフサイクルを利用したい場合
    - チャネルモニターを手製の記録/ディスパッチ用グルーコードから移行しています
    - 受け入れ、取り込み、分類、事前チェック、解決、記録、ディスパッチ、最終化の各段階を理解する必要があります
sidebarTitle: Channel turn
summary: runtime.channel.turn -- 同梱およびサードパーティのチャネルプラグインがエージェントターンを記録、ディスパッチ、確定するために使用する共有受信ターンカーネル
title: チャネルターンカーネル
x-i18n:
    generated_at: "2026-05-10T19:46:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

チャンネルターンカーネルは、正規化されたプラットフォームイベントをエージェントターンに変換する共有インバウンド状態機械です。チャンネルPluginはプラットフォームの事実情報と配信コールバックを提供します。Core はオーケストレーション、つまり ingest、classify、preflight、resolve、authorize、assemble、record、dispatch、finalize を所有します。

Pluginがインバウンドメッセージのホットパス上にある場合にこれを使用します。メッセージ以外のイベント（スラッシュコマンド、モーダル、ボタン操作、ライフサイクルイベント、リアクション、音声状態）はPluginローカルに保ちます。カーネルが所有するのは、エージェントのテキストターンになり得るイベントのみです。

<Info>
  カーネルには、注入されたPluginランタイムを通じて `runtime.channel.turn.*` として到達します。Pluginランタイム型は `openclaw/plugin-sdk/core` からエクスポートされるため、サードパーティのネイティブPluginは、バンドル済みチャンネルPluginと同じ方法でこれらのエントリポイントを使用できます。
</Info>

## 共有カーネルが必要な理由

チャンネルPluginは同じインバウンドフローを繰り返します。正規化、ルーティング、ゲート、コンテキストの構築、セッションメタデータの記録、エージェントターンのディスパッチ、配信状態の確定です。共有カーネルがないと、メンションゲート、ツール専用の可視返信、セッションメタデータ、保留中履歴、ディスパッチ確定への変更をチャンネルごとに適用する必要があります。

カーネルは、4つの概念を意図的に分離します。

- `ConversationFacts`: メッセージの発生元
- `RouteFacts`: どのエージェントとセッションが処理すべきか
- `ReplyPlanFacts`: 可視返信の送信先
- `MessageFacts`: エージェントが参照すべき本文と補足コンテキスト

Slack のDM、Telegram のトピック、Matrix のスレッド、Feishu のトピックセッションは、実際にはすべてこれらを区別します。これらを1つの識別子として扱うと、時間の経過とともにずれが生じます。

## ステージライフサイクル

カーネルは、チャンネルに関係なく同じ固定パイプラインを実行します。

1. `ingest` -- アダプターが生のプラットフォームイベントを `NormalizedTurnInput` に変換する
2. `classify` -- アダプターが、このイベントでエージェントターンを開始できるかどうかを宣言する
3. `preflight` -- アダプターが重複排除、自己エコー、ハイドレーション、デバウンス、復号、部分的な事実情報の事前入力を行う
4. `resolve` -- アダプターが完全に組み立てられたターン（ルート、返信計画、メッセージ、配信）を返す
5. `authorize` -- 組み立てられた事実情報にDM、グループ、メンション、コマンドポリシーを適用する
6. `assemble` -- `buildContext` を介して事実情報から `FinalizedMsgContext` を構築する
7. `record` -- インバウンドセッションメタデータと最後のルートを永続化する
8. `dispatch` -- バッファリングされたブロックディスパッチャーを通じてエージェントターンを実行する
9. `finalize` -- ディスパッチエラー時でもアダプターの `onFinalize` を実行する

`log` コールバックが指定されている場合、各ステージは構造化ログイベントを出力します。[可観測性](#observability)を参照してください。

## 受け入れ種別

カーネルは、ターンがゲートされた場合に例外を投げません。`ChannelTurnAdmission` を返します。

| 種別          | 場合                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | ターンが受け入れられます。エージェントターンが実行され、可視返信パスが使われます。                                                                   |
| `observeOnly` | ターンはエンドツーエンドで実行されますが、配信アダプターは可視のものを送信しません。ブロードキャスト監視エージェントやその他の受動的なマルチエージェントフローに使用します。 |
| `handled`     | プラットフォームイベントがローカルで消費されました（ライフサイクル、リアクション、ボタン、モーダル）。カーネルはディスパッチをスキップします。                                           |
| `drop`        | スキップパスです。任意で `recordHistory: true` にすると、将来のメンションにコンテキストを持たせるため、メッセージを保留中のグループ履歴に保持します。                      |

受け入れは `classify`（イベントクラスがターンを開始できないと示した場合）、`preflight`（重複排除、自己エコー、履歴記録を伴うメンション欠落）、または `resolveTurn` 自体から発生します。

## エントリポイント

ランタイムは、アダプターがチャンネルに合ったレベルでオプトインできるように、3つの推奨エントリポイントを公開します。

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Plugin SDK 互換性のために、2つの古いランタイムヘルパーも引き続き利用できます。

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

チャンネルがインバウンドフローを `ChannelTurnAdapter<TRaw>` として表現できる場合に使用します。アダプターには、`ingest`、任意の `classify`、任意の `preflight`、必須の `resolveTurn`、任意の `onFinalize` のコールバックがあります。

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` は、チャンネルのアダプターロジックが小さく、フックを通じてライフサイクルを所有する利点がある場合に適した形です。

### runAssembled

チャンネルがすでにルーティングを解決し、`FinalizedMsgContext` を構築済みで、
共有の記録、返信パイプライン、ディスパッチ、finalize
順序だけが必要な場合に使用します。これは、単純なバンドル済みインバウンドパスに推奨される形で、
そうしない場合は `createChannelMessageReplyPipeline(...)` と
`runPrepared(...)` の定型処理を繰り返すことになります。

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

チャンネル所有のディスパッチ動作が、最終ペイロード配信と、任意の入力中表示、返信オプション、永続的配信、またはエラーログだけである場合は、`runPrepared` ではなく `runAssembled` を選択します。

### runPrepared

チャンネルに、プレビュー、リトライ、編集、またはスレッドブートストラップを備えた複雑なローカルディスパッチャーがあり、チャンネル所有のままにする必要がある場合に使用します。カーネルはそれでも、ディスパッチ前にインバウンドセッションを記録し、統一された `DispatchedChannelTurnResult` を公開します。

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

リッチなチャンネル（Matrix、Mattermost、Microsoft Teams、Feishu、QQ Bot）は、ディスパッチャーがカーネルに学習させるべきではないプラットフォーム固有の動作をオーケストレーションするため、`runPrepared` を使用します。

### buildContext

事実情報のバンドルを `FinalizedMsgContext` にマッピングする純粋関数です。チャンネルがパイプラインの一部を手作業で構築しつつ、一貫したコンテキスト形状を求める場合に使用します。

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` は、`run` 用のターンを組み立てるときに `resolveTurn` コールバック内でも有用です。

<Note>
  `dispatchInboundReplyWithBase` などの非推奨 SDK ヘルパーは、引き続き組み立て済みターンヘルパーを経由してブリッジします。新しいPluginコードでは `run` または `runPrepared` を使用してください。
</Note>

## 事実情報の型

カーネルがアダプターから受け取る事実情報は、プラットフォームに依存しません。プラットフォームオブジェクトをこれらの形に変換してから、カーネルに渡してください。

### NormalizedTurnInput

| フィールド             | 目的                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | 重複排除とログに使用する安定したメッセージID                                   |
| `timestamp`       | 任意のエポックミリ秒                                                            |
| `rawText`         | プラットフォームから受信した本文                                           |
| `textForAgent`    | エージェント向けの任意のクリーン済み本文（メンション除去、入力中トリム）             |
| `textForCommands` | `/command` 解析に使用する任意の本文                                    |
| `raw`             | 元のオブジェクトを必要とするアダプターコールバック向けの任意のパススルー参照 |

### ChannelEventClass

| フィールド                  | 目的                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`、`command`、`interaction`、`reaction`、`lifecycle`、`unknown` |
| `canStartAgentTurn`    | false の場合、カーネルは `{ kind: "handled" }` を返します                       |
| `requiresImmediateAck` | ディスパッチ前に ACK が必要なアダプター向けのヒント                      |

### SenderFacts

| フィールド          | 目的                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | 安定したプラットフォーム送信者ID                                      |
| `name`         | 表示名                                                   |
| `username`     | `name` と異なる場合のハンドル                                 |
| `tag`          | Discord 形式の識別子またはプラットフォームタグ                    |
| `roles`        | メンバーロールの許可リスト照合に使用するロールID              |
| `isBot`        | 送信者が既知のボットである場合は true（カーネルはドロップに使用） |
| `isSelf`       | 送信者が設定済みエージェント自身である場合は true            |
| `displayLabel` | エンベロープテキスト用に事前レンダリングされたラベル                           |

### ConversationFacts

| フィールド             | 目的                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`、`group`、または `channel`                                      |
| `id`              | ルーティングに使用する会話ID                                     |
| `label`           | エンベロープ用の人間向けラベル                                         |
| `spaceId`         | 任意の外側スペース識別子（Slack ワークスペース、Matrix ホームサーバー） |
| `parentId`        | これがスレッドである場合の外側会話ID                          |
| `threadId`        | このメッセージがスレッド内にある場合のスレッドID                       |
| `nativeChannelId` | ルーティングIDと異なる場合のプラットフォームネイティブなチャンネルID        |
| `routePeer`       | `resolveAgentRoute` ルックアップに使用するピア                             |

### RouteFacts

| フィールド                   | 目的                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | このターンを処理するべきエージェント                         |
| `accountId`             | 任意の上書き（複数アカウントのチャンネル）                 |
| `routeSessionKey`       | ルーティングに使われるセッションキー                               |
| `dispatchSessionKey`    | ルートキーと異なる場合にディスパッチで使われるセッションキー |
| `persistedSessionKey`   | 永続化されたセッションメタデータに書き込まれるセッションキー          |
| `parentSessionKey`      | 分岐/スレッド化されたセッションの親                      |
| `modelParentSessionKey` | 分岐セッションのモデル側の親                    |
| `mainSessionKey`        | 直接会話用のメインDMオーナーピン                 |
| `createIfMissing`       | 欠落しているセッション行をレコード段階で作成できるようにする          |

### ReplyPlanFacts

| フィールド                     | 目的                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | コンテキスト `To` に書き込まれる論理返信先          |
| `originatingTo`           | 発生元のコンテキストターゲット（`OriginatingTo`）            |
| `nativeChannelId`         | 配信用のプラットフォームネイティブなチャンネルID                 |
| `replyTarget`             | `to` と異なる場合の最終的な表示返信先 |
| `deliveryTarget`          | 下位レベルの配信上書き                           |
| `replyToId`               | 引用/アンカーされたメッセージID                              |
| `replyToIdFull`           | プラットフォームが両方を持つ場合の完全形式の引用ID          |
| `messageThreadId`         | 配信時のスレッドID                              |
| `threadParentId`          | スレッドの親メッセージID                         |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct`、または `none`       |

### AccessFacts

`AccessFacts` は承認段階に必要な真偽値を保持します。ID照合はチャンネル内にとどまります。カーネルは結果のみを使用します。

| フィールド      | 目的                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DMの許可/ペアリング/拒否の判定と `allowFrom` リスト                       |
| `group`    | グループポリシー、ルート許可、送信者許可、許可リスト、メンション要件   |
| `commands` | 設定済みオーソライザー全体でのコマンド承認                       |
| `mentions` | メンション検出が可能か、およびエージェントがメンションされたか |

### MessageFacts

| フィールド            | 目的                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | 最終的なエンベロープ本文（整形済み）                                |
| `rawBody`        | 生の受信本文                                               |
| `bodyForAgent`   | エージェントが見る本文                                            |
| `commandBody`    | コマンド解析に使われる本文                                  |
| `envelopeFrom`   | エンベロープ用に事前レンダリングされた送信者ラベル                     |
| `senderLabel`    | レンダリング済み送信者の任意の上書き                      |
| `preview`        | ログ用の短い編集済みプレビュー                                |
| `inboundHistory` | チャンネルがバッファを保持する場合の最近の受信履歴エントリ |

### SupplementalContextFacts

補足コンテキストは、引用、転送、スレッドのブートストラップコンテキストを扱います。カーネルは設定済みの `contextVisibility` ポリシーを適用します。チャンネルアダプターはファクトと `senderAllowed` フラグのみを提供するため、チャンネル横断ポリシーは一貫したままです。

### InboundMediaFacts

メディアはファクトとして表現されます。プラットフォームのダウンロード、認証、SSRFポリシー、CDNルール、復号はチャンネルローカルにとどまります。カーネルはファクトを `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes`、`MediaTranscribedIndexes` にマッピングします。

## アダプター契約

完全な `run` では、アダプターの形は次のとおりです。

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` は `ChannelTurnResolved` を返します。これは任意のアドミッション種別を持つ `AssembledChannelTurn` です。`{ admission: { kind: "observeOnly" } }` を返すと、表示される出力を生成せずにターンを実行します。アダプターは引き続き配信コールバックを所有しますが、そのターンでは no-op になります。

`onFinalize` はディスパッチエラーを含むすべての結果で実行されます。保留中のグループ履歴のクリア、ackリアクションの削除、ステータスインジケーターの停止、ローカル状態のフラッシュに使用します。

## 配信アダプター

カーネルはプラットフォームを直接呼び出しません。チャンネルは `ChannelTurnDeliveryAdapter` をカーネルに渡します。

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` はバッファされた返信チャンクごとに1回呼び出されます。メッセージライフサイクル移行中、組み立て済みチャンネルターンの配信はデフォルトでチャンネル所有です。`durable` フィールドが省略されている場合、カーネルは `deliver` を直接呼び出す必要があり、汎用アウトバウンド配信経由でルーティングしてはいけません。チャンネルが監査され、返信/スレッドターゲット、メディア処理、送信済みメッセージ/自己エコーキャッシュ、ステータスクリーンアップ、返却されるメッセージIDを含め、汎用送信パスが従来の配信動作を保持することが証明された後にのみ `durable` を設定します。`durable: false` は「チャンネル所有のコールバックを使う」ための互換表記として残りますが、未移行のチャンネルが追加する必要はありません。チャンネルがプラットフォームメッセージIDを持っている場合は返し、ディスパッチャーがスレッドアンカーを保持し、後続チャンクを編集できるようにします。新しい配信パスでは `receipt` も返すべきです。これにより、リカバリー、プレビューの確定、重複抑制を `messageIds` から移行できます。観察のみのターンでは、`{ visibleReplySent: false }` を返すか、`createNoopChannelTurnDeliveryAdapter()` を使用します。

完全にチャンネル所有のディスパッチャーで `runPrepared` を使うチャンネルには `ChannelTurnDeliveryAdapter` がありません。それらのディスパッチャーはデフォルトでは durable ではありません。完全なターゲット、リプレイセーフなアダプター、receipt 契約、チャンネルの副作用フックを備えた新しい送信コンテキストに明示的にオプトインするまでは、直接配信パスを維持するべきです。

`recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase`、直接DMヘルパーなどの公開互換ヘルパーは、移行中も動作を保持する必要があります。呼び出し元所有の `deliver` または `reply` コールバックより前に、汎用 durable 配信を呼び出してはいけません。

## レコードオプション

レコード段階は `recordInboundSession` をラップします。ほとんどのチャンネルはデフォルトを使用できます。`record` で上書きします。

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

ディスパッチャーはレコード段階を待ちます。record が例外を投げた場合、カーネルは `onPreDispatchFailure`（`runPrepared` に指定されている場合）を実行して再スローします。

## 可観測性

`log` コールバックが指定されている場合、各段階は構造化イベントを発行します。

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

ログに記録される段階: `ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。生の本文をログに記録するのは避け、短い編集済みプレビューには `MessageFacts.preview` を使用します。

## チャンネルローカルにとどまるもの

カーネルはオーケストレーションを所有します。チャンネルは引き続き次を所有します。

- プラットフォームトランスポート（Gateway、REST、websocket、polling、webhooks）
- ID解決と表示名照合
- ネイティブコマンド、スラッシュコマンド、オートコンプリート、モーダル、ボタン、音声状態
- カード、モーダル、adaptive-cardのレンダリング
- メディア認証、CDNルール、暗号化メディア、文字起こし
- 編集、リアクション、リダクション、プレゼンスAPI
- バックフィルとプラットフォーム側の履歴取得
- プラットフォーム固有の検証を必要とするペアリングフロー

2つのチャンネルがこれらのいずれかについて同じヘルパーを必要とし始めた場合は、カーネルに押し込むのではなく、共有SDKヘルパーを抽出します。

## 安定性

`runtime.channel.turn.*` は公開Pluginランタイムサーフェスの一部です。ファクト型（`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`）とアドミッション形状（`ChannelTurnAdmission`、`ChannelEventClass`）は、`openclaw/plugin-sdk/core` の `PluginRuntime` から到達できます。

後方互換性ルールが適用されます。新しいファクトフィールドは追加的であり、アドミッション種別はリネームされず、エントリーポイント名は安定したままです。非追加的な変更を必要とする新しいチャンネル要件は、Plugin SDK移行プロセスを経る必要があります。

## 関連

- このカーネルをラップする予定の送信/受信/ライブのライフサイクルについては、[メッセージライフサイクルリファクター](/ja-JP/concepts/message-lifecycle-refactor)
- より広範なチャンネルPlugin契約については、[チャンネルPluginの構築](/ja-JP/plugins/sdk-channel-plugins)
- その他の `runtime.*` サーフェスについては、[Pluginランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- ロードパイプラインとレジストリの仕組みについては、[Plugin内部構造](/ja-JP/plugins/architecture-internals)
