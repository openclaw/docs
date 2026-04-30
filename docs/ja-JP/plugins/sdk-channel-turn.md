---
read_when:
    - チャネルPluginを構築していて、共有の受信ターンライフサイクルを利用したい場合
    - チャネルモニターを手作りのレコード/ディスパッチ用グルーコードから移行しています
    - 受け入れ、取り込み、分類、事前確認、解決、記録、振り分け、完了処理の各ステージを理解する必要があります
sidebarTitle: Channel turn
summary: runtime.channel.turn -- バンドル済みおよびサードパーティのチャネルプラグインがエージェントターンを記録、ディスパッチ、確定するために使用する共有インバウンドターンカーネル
title: チャンネルターンカーネル
x-i18n:
    generated_at: "2026-04-30T05:26:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

チャネルターンカーネルは、正規化されたプラットフォームイベントをエージェントターンに変換する共有インバウンド状態マシンです。チャネルPluginはプラットフォームの事実情報と配信コールバックを提供します。コアはオーケストレーション、つまり取り込み、分類、プリフライト、解決、認可、組み立て、記録、ディスパッチ、完了処理を所有します。

Pluginがインバウンドメッセージのホットパス上にある場合にこれを使用してください。メッセージ以外のイベント（スラッシュコマンド、モーダル、ボタン操作、ライフサイクルイベント、リアクション、音声状態）は、Pluginローカルに保ってください。カーネルが所有するのは、エージェントのテキストターンになる可能性があるイベントだけです。

<Info>
  カーネルには、注入されたPluginランタイムを通じて `runtime.channel.turn.*` として到達します。Pluginランタイム型は `openclaw/plugin-sdk/core` からエクスポートされるため、サードパーティのネイティブPluginは、バンドルされたチャネルPluginと同じ方法でこれらのエントリーポイントを使用できます。
</Info>

## 共有カーネルが必要な理由

チャネルPluginは同じインバウンドフローを繰り返します。正規化、ルーティング、ゲート、コンテキストの構築、セッションメタデータの記録、エージェントターンのディスパッチ、配信状態の完了処理です。共有カーネルがない場合、メンションゲート、ツール専用の可視返信、セッションメタデータ、保留履歴、ディスパッチ完了処理への変更をチャネルごとに適用する必要があります。

カーネルは4つの概念を意図的に分離します。

- `ConversationFacts`: メッセージの送信元
- `RouteFacts`: どのエージェントとセッションが処理すべきか
- `ReplyPlanFacts`: 可視返信をどこへ送るべきか
- `MessageFacts`: エージェントが見るべき本文と補足コンテキスト

Slack DM、Telegramトピック、Matrixスレッド、Feishuトピックセッションは、実際にはすべてこれらを区別します。これらを1つの識別子として扱うと、時間の経過とともにずれが生じます。

## ステージライフサイクル

カーネルは、チャネルに関係なく同じ固定パイプラインを実行します。

1. `ingest` -- アダプターが生のプラットフォームイベントを `NormalizedTurnInput` に変換する
2. `classify` -- アダプターがこのイベントでエージェントターンを開始できるかを宣言する
3. `preflight` -- アダプターが重複排除、自己エコー、ハイドレーション、デバウンス、復号、部分的な事実情報の事前入力を行う
4. `resolve` -- アダプターが完全に組み立てられたターン（ルート、返信計画、メッセージ、配信）を返す
5. `authorize` -- 組み立て済みの事実情報にDM、グループ、メンション、コマンドポリシーを適用する
6. `assemble` -- `buildContext` を介して事実情報から `FinalizedMsgContext` を構築する
7. `record` -- インバウンドセッションメタデータと最後のルートを永続化する
8. `dispatch` -- バッファリングされたブロックディスパッチャーを通じてエージェントターンを実行する
9. `finalize` -- ディスパッチエラー時でもアダプターの `onFinalize` が実行される

`log` コールバックが提供されると、各ステージは構造化ログイベントを出力します。[可観測性](#observability)を参照してください。

## 受け入れ種別

ターンがゲートされた場合でも、カーネルは例外をスローしません。`ChannelTurnAdmission` を返します。

| 種別          | 条件                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | ターンが受け入れられます。エージェントターンが実行され、可視返信パスが使用されます。                                                                   |
| `observeOnly` | ターンはエンドツーエンドで実行されますが、配信アダプターは可視のものを何も送信しません。ブロードキャスト監視エージェントやその他の受動的なマルチエージェントフローに使用します。 |
| `handled`     | プラットフォームイベントがローカルで消費されました（ライフサイクル、リアクション、ボタン、モーダル）。カーネルはディスパッチをスキップします。                                           |
| `drop`        | スキップパスです。任意で `recordHistory: true` にすると、将来のメンションがコンテキストを持てるように、メッセージを保留中のグループ履歴に保持します。                      |

受け入れは、`classify`（イベントクラスがターンを開始できないと言った場合）、`preflight`（重複排除、自己エコー、履歴記録を伴うメンション欠落）、または `resolveTurn` 自体から発生します。

## エントリーポイント

ランタイムは、アダプターがチャネルに合ったレベルでオプトインできるように、3つの推奨エントリーポイントを公開します。

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Plugin SDK互換性のため、2つの古いランタイムヘルパーも引き続き利用できます。

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

チャネルがインバウンドフローを `ChannelTurnAdapter<TRaw>` として表現できる場合に使用します。アダプターには、`ingest`、任意の `classify`、任意の `preflight`、必須の `resolveTurn`、任意の `onFinalize` の各コールバックがあります。

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

`run` は、チャネルのアダプターロジックが小さく、フックを通じてライフサイクルを所有するメリットがある場合に適した形です。

### runPrepared

プレビュー、再試行、編集、スレッドのブートストラップを含む複雑なローカルディスパッチャーがチャネルにあり、それをチャネル所有のままにする必要がある場合に使用します。カーネルは引き続き、ディスパッチ前にインバウンドセッションを記録し、統一された `DispatchedChannelTurnResult` を公開します。

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

リッチなチャネル（Matrix、Mattermost、Microsoft Teams、Feishu、QQ Bot）は `runPrepared` を使用します。ディスパッチャーが、カーネルが知るべきではないプラットフォーム固有の動作をオーケストレーションするためです。

### buildContext

事実情報の束を `FinalizedMsgContext` にマッピングする純粋関数です。チャネルがパイプラインの一部を手作業で実装しつつ、一貫したコンテキスト形状を求める場合に使用します。

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

`buildContext` は、`run` のターンを組み立てる際に `resolveTurn` コールバック内でも有用です。

<Note>
  `dispatchInboundReplyWithBase` などの非推奨SDKヘルパーは、現在も組み立て済みターンヘルパーを介して橋渡しされます。新しいPluginコードでは `run` または `runPrepared` を使用してください。
</Note>

## 事実情報の型

カーネルがアダプターから消費する事実情報は、プラットフォーム非依存です。プラットフォームオブジェクトをカーネルへ渡す前に、これらの形に変換してください。

### NormalizedTurnInput

| フィールド             | 目的                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | 重複排除とログに使用される安定したメッセージID                                   |
| `timestamp`       | 任意のエポックミリ秒                                                            |
| `rawText`         | プラットフォームから受信した本文                                           |
| `textForAgent`    | エージェント向けの任意のクリーン済み本文（メンション削除、入力トリム）             |
| `textForCommands` | `/command` 解析に使用される任意の本文                                    |
| `raw`             | 元の値が必要なアダプターコールバック向けの任意のパススルー参照 |

### ChannelEventClass

| フィールド                  | 目的                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`、`command`、`interaction`、`reaction`、`lifecycle`、`unknown` |
| `canStartAgentTurn`    | falseの場合、カーネルは `{ kind: "handled" }` を返す                       |
| `requiresImmediateAck` | ディスパッチ前にACKが必要なアダプター向けのヒント                      |

### SenderFacts

| フィールド          | 目的                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | 安定したプラットフォーム送信者ID                                      |
| `name`         | 表示名                                                   |
| `username`     | `name` と異なる場合のハンドル                                 |
| `tag`          | Discordスタイルの識別子またはプラットフォームタグ                    |
| `roles`        | メンバーロール許可リスト照合に使用されるロールID              |
| `isBot`        | 送信者が既知のボットの場合はtrue（カーネルはドロップに使用） |
| `isSelf`       | 送信者が設定済みのエージェント自身の場合はtrue            |
| `displayLabel` | エンベロープテキスト用の事前レンダリング済みラベル                           |

### ConversationFacts

| フィールド             | 目的                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`、`group`、または `channel`                                      |
| `id`              | ルーティングに使用される会話ID                                     |
| `label`           | エンベロープ用の人間向けラベル                                         |
| `spaceId`         | 任意の外側のスペース識別子（Slackワークスペース、Matrixホームサーバー） |
| `parentId`        | これがスレッドの場合の外側の会話ID                          |
| `threadId`        | このメッセージがスレッド内にある場合のスレッドID                       |
| `nativeChannelId` | ルーティングIDと異なる場合のプラットフォームネイティブのチャネルID        |
| `routePeer`       | `resolveAgentRoute` ルックアップに使用されるピア                             |

### RouteFacts

| フィールド                   | 目的                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | このターンを処理すべきエージェント                         |
| `accountId`             | 任意の上書き（マルチアカウントチャネル）                 |
| `routeSessionKey`       | ルーティングに使用されるセッションキー                               |
| `dispatchSessionKey`    | ルートキーと異なる場合にディスパッチで使用されるセッションキー |
| `persistedSessionKey`   | 永続化されたセッションメタデータに書き込まれるセッションキー          |
| `parentSessionKey`      | 分岐セッションまたはスレッドセッションの親                      |
| `modelParentSessionKey` | 分岐セッションのモデル側の親                    |
| `mainSessionKey`        | 直接会話用のメインDM所有者ピン                 |
| `createIfMissing`       | 記録ステップが存在しないセッション行を作成できるようにする          |

### ReplyPlanFacts

| フィールド                  | 目的                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | コンテキスト `To` に書き込まれる論理返信先          |
| `originatingTo`           | 元のコンテキスト対象 (`OriginatingTo`)            |
| `nativeChannelId`         | 配信用のプラットフォームネイティブなチャネル ID                 |
| `replyTarget`             | `to` と異なる場合の最終的な可視返信先 |
| `deliveryTarget`          | 低レベルの配信オーバーライド                           |
| `replyToId`               | 引用/アンカーされたメッセージ ID                              |
| `replyToIdFull`           | プラットフォームが両方を持つ場合の完全形式の引用 ID          |
| `messageThreadId`         | 配信時点のスレッド ID                              |
| `threadParentId`          | スレッドの親メッセージ ID                         |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct`、または `none`       |

### AccessFacts

`AccessFacts` は authorize 段階が必要とする真偽値を保持します。ID 照合はチャネル内にとどまり、カーネルはその結果だけを使用します。

| フィールド      | 目的                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM の許可/ペアリング/拒否判定と `allowFrom` リスト                       |
| `group`    | グループポリシー、ルート許可、送信者許可、許可リスト、メンション要件   |
| `commands` | 構成済み authorizer 全体でのコマンド認可                       |
| `mentions` | メンション検出が可能か、およびエージェントがメンションされたか |

### MessageFacts

| フィールド            | 目的                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | 最終的なエンベロープ本文 (整形済み)                                |
| `rawBody`        | 生の受信本文                                               |
| `bodyForAgent`   | エージェントが見る本文                                            |
| `commandBody`    | コマンド解析に使用される本文                                  |
| `envelopeFrom`   | エンベロープ用に事前レンダリングされた送信者ラベル                     |
| `senderLabel`    | レンダリングされる送信者の任意のオーバーライド                      |
| `preview`        | ログ用の短い伏せ字プレビュー                                |
| `inboundHistory` | チャネルがバッファを保持する場合の最近の受信履歴エントリ |

### SupplementalContextFacts

補足コンテキストは、引用、転送、スレッド初期化コンテキストを扱います。カーネルは構成済みの `contextVisibility` ポリシーを適用します。チャネルアダプターはファクトと `senderAllowed` フラグだけを提供するため、チャネル横断ポリシーの一貫性が保たれます。

### InboundMediaFacts

メディアはファクト形式です。プラットフォームのダウンロード、認証、SSRF ポリシー、CDN ルール、復号はチャネルローカルにとどまります。カーネルはファクトを `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes`、`MediaTranscribedIndexes` にマップします。

## アダプター契約

完全な `run` の場合、アダプターの形は次のとおりです。

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

`resolveTurn` は `ChannelTurnResolved` を返します。これは任意の admission kind を持つ `AssembledChannelTurn` です。`{ admission: { kind: "observeOnly" } }` を返すと、可視出力を生成せずにターンを実行します。アダプターは引き続き配信コールバックを所有しますが、そのターンでは no-op になります。

`onFinalize` は、dispatch エラーを含むすべての結果で実行されます。保留中のグループ履歴のクリア、ack リアクションの削除、ステータスインジケーターの停止、ローカル状態のフラッシュに使用します。

## 配信アダプター

カーネルはプラットフォームを直接呼び出しません。チャネルは `ChannelTurnDeliveryAdapter` をカーネルに渡します。

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` はバッファされた返信チャンクごとに 1 回呼び出されます。チャネルがプラットフォームメッセージ ID を持っている場合は返してください。これにより dispatcher はスレッドアンカーを保持し、後続チャンクを編集できます。observe-only ターンでは、`{ visibleReplySent: false }` を返すか、`createNoopChannelTurnDeliveryAdapter()` を使用します。

## 記録オプション

record 段階は `recordInboundSession` をラップします。ほとんどのチャネルはデフォルトを使用できます。`record` でオーバーライドします。

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

dispatcher は record 段階を待ちます。record が throw した場合、カーネルは (`runPrepared` に提供されていれば) `onPreDispatchFailure` を実行し、再 throw します。

## 可観測性

`log` コールバックが提供されている場合、各段階は構造化イベントを発行します。

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

ログ出力される段階: `ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。生の本文のログ出力は避け、短い伏せ字プレビューには `MessageFacts.preview` を使用してください。

## チャネルローカルにとどまるもの

カーネルはオーケストレーションを所有します。チャネルは引き続き次を所有します。

- プラットフォームトランスポート (gateway、REST、websocket、polling、webhooks)
- ID 解決と表示名の照合
- ネイティブコマンド、スラッシュコマンド、オートコンプリート、モーダル、ボタン、音声状態
- カード、モーダル、adaptive-card のレンダリング
- メディア認証、CDN ルール、暗号化メディア、文字起こし
- 編集、リアクション、伏せ字化、プレゼンス API
- backfill とプラットフォーム側の履歴取得
- プラットフォーム固有の検証を必要とするペアリングフロー

これらのいずれかについて 2 つのチャネルが同じヘルパーを必要とし始めた場合は、カーネルに押し込むのではなく、共有 SDK ヘルパーとして抽出してください。

## 安定性

`runtime.channel.turn.*` は公開 Plugin ランタイムサーフェスの一部です。ファクト型 (`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`) と admission 形状 (`ChannelTurnAdmission`、`ChannelEventClass`) は、`openclaw/plugin-sdk/core` から `PluginRuntime` 経由で到達できます。

後方互換性ルールが適用されます。新しいファクトフィールドは追加的であり、admission kind はリネームされず、エントリポイント名は安定したままです。非追加的な変更を必要とする新しいチャネル要件は、plugin SDK の移行プロセスを経る必要があります。

## 関連

- より広範なチャネル Plugin 契約については [チャネル Plugin の構築](/ja-JP/plugins/sdk-channel-plugins)
- 他の `runtime.*` サーフェスについては [Plugin ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- ロードパイプラインとレジストリの仕組みについては [Plugin 内部](/ja-JP/plugins/architecture-internals)
