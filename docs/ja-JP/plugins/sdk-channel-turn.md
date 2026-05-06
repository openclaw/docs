---
read_when:
    - チャンネル Plugin を構築していて、共有の受信ターンライフサイクルを利用したい
    - チャネルモニターを独自実装の記録/ディスパッチ用グルーコードから移行しています
    - 受け入れ、取り込み、分類、事前確認、解決、記録、ディスパッチ、最終処理の各ステージを理解する必要があります。
sidebarTitle: Channel turn
summary: runtime.channel.turn -- バンドル済みおよびサードパーティのチャンネルPluginがエージェントターンの記録、ディスパッチ、完了処理に使用する共有インバウンドターンカーネル
title: チャネルターンカーネル
x-i18n:
    generated_at: "2026-05-06T05:13:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

チャネルターンカーネルは、正規化されたプラットフォームイベントをエージェントターンに変換する共有インバウンド状態機械です。チャネルPluginはプラットフォームの事実情報と配信コールバックを提供します。コアは、取り込み、分類、プリフライト、解決、認可、組み立て、記録、ディスパッチ、完了処理のオーケストレーションを所有します。

Pluginがインバウンドメッセージのホットパス上にある場合に使用します。非メッセージイベント（スラッシュコマンド、モーダル、ボタン操作、ライフサイクルイベント、リアクション、音声状態）はPluginローカルに保ちます。カーネルが所有するのは、エージェントのテキストターンになる可能性があるイベントだけです。

<Info>
  カーネルには、注入されたPluginランタイムを通じて `runtime.channel.turn.*` として到達します。Pluginランタイム型は `openclaw/plugin-sdk/core` からエクスポートされるため、サードパーティのネイティブPluginは、バンドルされたチャネルPluginと同じ方法でこれらのエントリポイントを使用できます。
</Info>

## 共有カーネルが必要な理由

チャネルPluginは同じインバウンドフローを繰り返します。正規化、ルーティング、ゲート、コンテキストの構築、セッションメタデータの記録、エージェントターンのディスパッチ、配信状態の完了処理です。共有カーネルがなければ、メンションゲーティング、ツール専用の可視返信、セッションメタデータ、保留中の履歴、ディスパッチの完了処理に対する変更を、チャネルごとに適用する必要があります。

カーネルは、4つの概念を意図的に分離しています。

- `ConversationFacts`: メッセージの送信元
- `RouteFacts`: どのエージェントとセッションが処理するべきか
- `ReplyPlanFacts`: 可視返信の送信先
- `MessageFacts`: エージェントが見るべき本文と補足コンテキスト

Slack DM、Telegramトピック、Matrixスレッド、Feishuトピックセッションは、実際にはすべてこれらを区別します。これらを1つの識別子として扱うと、時間とともにずれが生じます。

## ステージのライフサイクル

カーネルはチャネルに関係なく、同じ固定パイプラインを実行します。

1. `ingest` -- アダプターが生のプラットフォームイベントを `NormalizedTurnInput` に変換します
2. `classify` -- アダプターが、このイベントがエージェントターンを開始できるかどうかを宣言します
3. `preflight` -- アダプターが重複排除、自己エコー、ハイドレーション、デバウンス、復号、部分的な事実情報の事前入力を行います
4. `resolve` -- アダプターが完全に組み立てられたターン（ルート、返信計画、メッセージ、配信）を返します
5. `authorize` -- 組み立てられた事実情報にDM、グループ、メンション、コマンドのポリシーが適用されます
6. `assemble` -- `buildContext` を通じて事実情報から `FinalizedMsgContext` が構築されます
7. `record` -- インバウンドセッションメタデータと最後のルートが永続化されます
8. `dispatch` -- バッファリングされたブロックディスパッチャーを通じてエージェントターンが実行されます
9. `finalize` -- ディスパッチエラー時でもアダプターの `onFinalize` が実行されます

`log` コールバックが指定されている場合、各ステージは構造化ログイベントを出力します。[Observability](#observability) を参照してください。

## 受付種別

カーネルは、ターンがゲートされたときに例外を投げません。`ChannelTurnAdmission` を返します。

| 種別          | 条件                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | ターンが受け付けられました。エージェントターンが実行され、可視返信パスが使われます。                                                                   |
| `observeOnly` | ターンはエンドツーエンドで実行されますが、配信アダプターは可視のものを送信しません。ブロードキャスト監視エージェントやその他の受動的なマルチエージェントフローに使用されます。 |
| `handled`     | プラットフォームイベントがローカルで消費されました（ライフサイクル、リアクション、ボタン、モーダル）。カーネルはディスパッチをスキップします。                                           |
| `drop`        | スキップパスです。任意で `recordHistory: true` にすると、将来のメンションがコンテキストを持てるように、メッセージを保留中のグループ履歴に保持します。                      |

受付は、`classify`（イベントクラスがターンを開始できないと判断した場合）、`preflight`（重複排除、自己エコー、履歴記録を伴うメンション欠落）、または `resolveTurn` 自体から発生します。

## エントリポイント

ランタイムは3つの推奨エントリポイントを公開しており、アダプターはチャネルに合うレベルでオプトインできます。

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

チャネルのインバウンドフローを `ChannelTurnAdapter<TRaw>` として表現できる場合に使用します。アダプターには、`ingest`、任意の `classify`、任意の `preflight`、必須の `resolveTurn`、任意の `onFinalize` のコールバックがあります。

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

`run` は、チャネルのアダプターロジックが小さく、フックを通じてライフサイクルを所有する利点がある場合に適した形です。

### runPrepared

チャネルに、プレビュー、リトライ、編集、またはスレッドのブートストラップを伴う複雑なローカルディスパッチャーがあり、それをチャネル所有のままにする必要がある場合に使用します。カーネルはそれでも、ディスパッチ前にインバウンドセッションを記録し、統一された `DispatchedChannelTurnResult` を公開します。

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

リッチなチャネル（Matrix、Mattermost、Microsoft Teams、Feishu、QQ Bot）は、ディスパッチャーがプラットフォーム固有の振る舞いをオーケストレーションし、それをカーネルが知るべきではないため、`runPrepared` を使用します。

### buildContext

事実情報の束を `FinalizedMsgContext` にマッピングする純粋関数です。チャネルがパイプラインの一部を手作業で実装しつつ、一貫したコンテキスト形状を必要とする場合に使用します。

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

`buildContext` は、`run` のターンを組み立てるときの `resolveTurn` コールバック内でも便利です。

<Note>
  `dispatchInboundReplyWithBase` などの非推奨SDKヘルパーは、引き続き組み立て済みターンヘルパーを通じて橋渡しされます。新しいPluginコードでは `run` または `runPrepared` を使用するべきです。
</Note>

## 事実情報の型

カーネルがアダプターから消費する事実情報は、プラットフォームに依存しません。プラットフォームオブジェクトをカーネルに渡す前に、これらの形に変換してください。

### NormalizedTurnInput

| フィールド             | 目的                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | 重複排除とログに使用される安定したメッセージID                                   |
| `timestamp`       | 任意のエポックミリ秒                                                            |
| `rawText`         | プラットフォームから受信した本文                                           |
| `textForAgent`    | エージェント向けの任意の整形済み本文（メンション除去、入力トリム）             |
| `textForCommands` | `/command` 解析に使用される任意の本文                                    |
| `raw`             | 元のオブジェクトを必要とするアダプターコールバック向けの任意のパススルー参照 |

### ChannelEventClass

| フィールド                  | 目的                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`、`command`、`interaction`、`reaction`、`lifecycle`、`unknown` |
| `canStartAgentTurn`    | falseの場合、カーネルは `{ kind: "handled" }` を返します                       |
| `requiresImmediateAck` | ディスパッチ前にACKする必要があるアダプター向けのヒント                      |

### SenderFacts

| フィールド          | 目的                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | 安定したプラットフォーム送信者ID                                      |
| `name`         | 表示名                                                   |
| `username`     | `name` と異なる場合のハンドル                                 |
| `tag`          | Discord風の判別子またはプラットフォームタグ                    |
| `roles`        | メンバーロールの許可リスト照合に使用されるロールID              |
| `isBot`        | 送信者が既知のボットの場合はtrue（カーネルがドロップに使用します） |
| `isSelf`       | 送信者が構成済みのエージェント自身の場合はtrue            |
| `displayLabel` | エンベロープテキスト用に事前レンダリングされたラベル                           |

### ConversationFacts

| フィールド             | 目的                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`、`group`、または `channel`                                      |
| `id`              | ルーティングに使用される会話ID                                     |
| `label`           | エンベロープ用の人間向けラベル                                         |
| `spaceId`         | 任意の外側のスペース識別子（Slackワークスペース、Matrixホームサーバー） |
| `parentId`        | これがスレッドである場合の外側の会話ID                          |
| `threadId`        | このメッセージがスレッド内にある場合のスレッドID                       |
| `nativeChannelId` | ルーティングIDと異なる場合のプラットフォームネイティブのチャネルID        |
| `routePeer`       | `resolveAgentRoute` ルックアップに使用されるピア                             |

### RouteFacts

| フィールド                   | 目的                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | このターンを処理するべきエージェント                         |
| `accountId`             | 任意の上書き（マルチアカウントチャネル）                 |
| `routeSessionKey`       | ルーティングに使用されるセッションキー                               |
| `dispatchSessionKey`    | ルートキーと異なる場合にディスパッチで使用されるセッションキー |
| `persistedSessionKey`   | 永続化セッションメタデータに書き込まれるセッションキー          |
| `parentSessionKey`      | ブランチ/スレッド化されたセッションの親                      |
| `modelParentSessionKey` | ブランチセッションのモデル側の親                    |
| `mainSessionKey`        | 直接会話用のメインDM所有者ピン                 |
| `createIfMissing`       | 記録ステップが欠落したセッション行を作成できるようにする          |

### ReplyPlanFacts

| フィールド                | 目的                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | コンテキストの `To` に書き込まれる論理返信先           |
| `originatingTo`           | 発信元コンテキストターゲット（`OriginatingTo`）        |
| `nativeChannelId`         | 配信用のプラットフォームネイティブなチャネル ID        |
| `replyTarget`             | `to` と異なる場合の最終的な可視返信先                  |
| `deliveryTarget`          | 低レベルの配信オーバーライド                           |
| `replyToId`               | 引用/アンカーされたメッセージ ID                       |
| `replyToIdFull`           | プラットフォームが両方を持つ場合の完全形式の引用 ID    |
| `messageThreadId`         | 配信時点のスレッド ID                                  |
| `threadParentId`          | スレッドの親メッセージ ID                              |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct`、または `none`   |

### AccessFacts

`AccessFacts` は、認可ステージが必要とするブール値を保持します。ID 照合はチャネル内にとどまります。カーネルは結果だけを消費します。

| フィールド | 目的                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| `dm`       | DM の許可/ペアリング/拒否の判断と `allowFrom` リスト                         |
| `group`    | グループポリシー、ルート許可、送信者許可、許可リスト、メンション要件        |
| `commands` | 設定済み認可機構全体でのコマンド認可                                        |
| `mentions` | メンション検出が可能かどうか、およびエージェントがメンションされたかどうか  |

### MessageFacts

| フィールド       | 目的                                                        |
| ---------------- | ----------------------------------------------------------- |
| `body`           | 最終的なエンベロープ本文（整形済み）                       |
| `rawBody`        | 生の受信本文                                                |
| `bodyForAgent`   | エージェントが見る本文                                      |
| `commandBody`    | コマンド解析に使われる本文                                  |
| `envelopeFrom`   | エンベロープ用に事前レンダリングされた送信者ラベル          |
| `senderLabel`    | レンダリングされる送信者の任意オーバーライド                |
| `preview`        | ログ用の短い編集済みプレビュー                              |
| `inboundHistory` | チャネルがバッファを保持する場合の最近の受信履歴エントリ    |

### SupplementalContextFacts

補足コンテキストは、引用、転送、およびスレッドブートストラップのコンテキストを対象にします。カーネルは設定された `contextVisibility` ポリシーを適用します。チャネルアダプターはファクトと `senderAllowed` フラグだけを提供するため、チャネル横断ポリシーは一貫します。

### InboundMediaFacts

メディアはファクト形式です。プラットフォームでのダウンロード、認証、SSRF ポリシー、CDN ルール、復号はチャネルローカルにとどまります。カーネルはファクトを `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes`、`MediaTranscribedIndexes` にマップします。

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

`resolveTurn` は `ChannelTurnResolved` を返します。これは任意のアドミッション種別を持つ `AssembledChannelTurn` です。`{ admission: { kind: "observeOnly" } }` を返すと、可視出力を生成せずにターンを実行します。アダプターは引き続き配信コールバックを所有しますが、そのターンでは no-op になります。

`onFinalize` は、ディスパッチエラーを含むすべての結果で実行されます。保留中のグループ履歴のクリア、ack リアクションの削除、ステータスインジケーターの停止、ローカル状態のフラッシュに使用します。

## 配信アダプター

カーネルはプラットフォームを直接呼び出しません。チャネルはカーネルに `ChannelTurnDeliveryAdapter` を渡します。

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

`deliver` は、バッファされた返信チャンクごとに 1 回呼び出されます。メッセージライフサイクル移行中は、組み立て済みチャネルターン配信はデフォルトでチャネル所有です。`durable` フィールドが省略されている場合、カーネルは `deliver` を直接呼び出す必要があり、汎用アウトバウンド配信を経由してはなりません。チャネルが監査済みで、汎用送信パスが返信/スレッドターゲット、メディア処理、送信済みメッセージ/自己エコーキャッシュ、ステータスクリーンアップ、返されるメッセージ ID を含む従来の配信動作を保持することを証明した後にのみ、`durable` を設定します。`durable: false` は「チャネル所有のコールバックを使用する」ための互換表記として残りますが、未移行のチャネルで追加する必要はないはずです。チャネルがプラットフォームメッセージ ID を持っている場合はそれを返し、ディスパッチャーがスレッドアンカーを保持し、後続チャンクを編集できるようにします。新しい配信パスでは、復旧、プレビューの確定、重複抑制を `messageIds` から移行できるように、`receipt` も返すべきです。observe-only ターンでは、`{ visibleReplySent: false }` を返すか、`createNoopChannelTurnDeliveryAdapter()` を使用します。

完全にチャネル所有のディスパッチャーで `runPrepared` を使用するチャネルには、`ChannelTurnDeliveryAdapter` はありません。それらのディスパッチャーはデフォルトでは durable ではありません。完全なターゲット、リプレイセーフなアダプター、受領契約、チャネルの副作用フックを備えた新しい送信コンテキストに明示的にオプトインするまでは、直接配信パスを維持するべきです。

`recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase`、直接 DM ヘルパーなどの公開互換ヘルパーは、移行中も動作を保持する必要があります。呼び出し元所有の `deliver` または `reply` コールバックより前に、汎用 durable 配信を呼び出してはいけません。

## 記録オプション

記録ステージは `recordInboundSession` をラップします。ほとんどのチャネルはデフォルトを使用できます。`record` でオーバーライドします。

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

ディスパッチャーは記録ステージを待ちます。記録が例外を投げると、カーネルは（`runPrepared` に提供されている場合）`onPreDispatchFailure` を実行してから再スローします。

## 可観測性

`log` コールバックが提供されている場合、各ステージは構造化イベントを出力します。

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

ログ記録されるステージ: `ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。生の本文をログに記録することは避けてください。短い編集済みプレビューには `MessageFacts.preview` を使用します。

## チャネルローカルに残るもの

カーネルはオーケストレーションを所有します。チャネルは引き続き次を所有します。

- プラットフォームトランスポート（Gateway、REST、websocket、ポーリング、webhooks）
- ID 解決と表示名照合
- ネイティブコマンド、スラッシュコマンド、オートコンプリート、モーダル、ボタン、音声状態
- カード、モーダル、adaptive-card レンダリング
- メディア認証、CDN ルール、暗号化メディア、文字起こし
- 編集、リアクション、編集削除、プレゼンス API
- バックフィルとプラットフォーム側履歴取得
- プラットフォーム固有の検証を必要とするペアリングフロー

2 つのチャネルがこれらのいずれかについて同じヘルパーを必要とし始めた場合は、カーネルに押し込むのではなく、共有 SDK ヘルパーとして抽出します。

## 安定性

`runtime.channel.turn.*` は公開 Plugin ランタイムサーフェスの一部です。ファクト型（`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`）とアドミッション形状（`ChannelTurnAdmission`、`ChannelEventClass`）は、`openclaw/plugin-sdk/core` から `PluginRuntime` を通じて到達可能です。

後方互換性ルールが適用されます。新しいファクトフィールドは追加的であり、アドミッション種別はリネームされず、エントリーポイント名は安定したままです。非追加的な変更を必要とする新しいチャネル要件は、Plugin SDK 移行プロセスを経由する必要があります。

## 関連

- このカーネルをラップする予定の送信/受信/ライブライフサイクルについては、[メッセージライフサイクルリファクタリング](/ja-JP/concepts/message-lifecycle-refactor)
- より広いチャネル Plugin 契約については、[チャネル Plugin の構築](/ja-JP/plugins/sdk-channel-plugins)
- その他の `runtime.*` サーフェスについては、[Plugin ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- ロードパイプラインとレジストリの仕組みについては、[Plugin 内部構造](/ja-JP/plugins/architecture-internals)
