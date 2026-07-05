---
read_when:
    - チャネルの送信または受信動作のリファクタリング
    - チャネルの受信、返信ディスパッチ、送信キュー、プレビューストリーミング、または Plugin SDK メッセージ API の変更
    - 耐久性のある送信、受信確認、プレビュー、編集、または再試行を必要とする新しいチャネル plugin の設計
summary: '永続的なメッセージ受信/送信ライフサイクルの状況: リリース済みのもの、当初設計から変更されたもの、未解決のもの'
title: メッセージライフサイクルのリファクタリング
x-i18n:
    generated_at: "2026-07-05T11:18:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
このページは、将来を見据えた設計提案として作成されました。その設計の中核は、その後 `src/channels/message/*` と公開 `openclaw/plugin-sdk/channel-outbound` / `channel-inbound` サブパスで出荷されています。現在の API については、[Channel outbound API](/ja-JP/plugins/sdk-channel-outbound) と [Channel inbound API](/ja-JP/plugins/sdk-channel-inbound) を使用してください。このページでは、出荷済みの内容、実装が元のスケッチから逸脱した箇所、そしてまだ未解決の内容を追跡します。
</Note>

## このリファクタリングが行われた理由

チャンネルスタックは、いくつかの局所的な修正から大きくなりました。成熟度レベルごとに分かれた個別のインバウンドヘルパー（単純なアダプター向けの `runtime.channel.inbound.run`、高機能なもの向けの `runtime.channel.inbound.runPreparedReply`）、レガシーな返信ディスパッチヘルパー（`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`）、チャンネル固有のプレビューストリーミング、そして既存の返信ペイロードパスに後付けされた最終配信の耐久性です。この形により、公開概念が多くなりすぎ、配信セマンティクスがずれうる場所も多くなりすぎました。

再設計を強制した信頼性のギャップ:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

目標の不変条件: コアが表示可能なアウトバウンドメッセージが存在すべきだと判断したら、プラットフォーム呼び出しを試行する前に送信意図が耐久化されていなければならず、成功後にプラットフォームの受領情報がコミットされなければなりません。これにより、デフォルトで少なくとも 1 回のリカバリーが可能になります。正確に 1 回の動作は、アダプターがネイティブの冪等性を証明する場合、または送信後の成否不明な試行を再生前にプラットフォーム状態と照合する場合にのみ存在します。

## 出荷済みの内容

内部ドメインは `src/channels/message/*` にあります:

| ファイル                    | 所有するもの                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | アダプター、送信コンテキスト、受領情報、耐久化意図の型コントラクト                                                |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — 耐久化送信コンテキスト                              |
| `receive.ts`                | `createMessageReceiveContext` — インバウンド ack ポリシーの状態マシン                                             |
| `live.ts`                   | ライブプレビュー状態と、その場で確定またはフォールバックするロジック                                             |
| `state.ts`                  | `classifyDurableSendRecoveryState` — 中断後のリカバリー分類                                                       |
| `receipt.ts`                | プラットフォーム送信結果を `MessageReceipt` に正規化                                                              |
| `capabilities.ts`           | ペイロードから必要な耐久化最終機能を導出                                                                         |
| `contracts.ts`              | 宣言されたアダプター機能のコントラクト証明検証                                                                   |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — レガシーな `sendText`/`sendMedia`/`sendPayload`/`sendPoll` 関数をラップ |
| `ingress-queue.ts`          | `createChannelIngressQueue` — 耐久化インバウンドイベントキュー                                                    |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — インバウンド重複排除のための accept/pending/complete/release ジャーナル    |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` とレガシー名のラッパー                                                              |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`、返信プレフィックスと typing コールバックヘルパー                                    |

公開サーフェス: `openclaw/plugin-sdk/channel-outbound`（送信/受領情報/耐久化/ライブ/返信パイプラインヘルパー）と `openclaw/plugin-sdk/channel-inbound`（インバウンドコンテキスト、`runChannelInboundEvent`、`dispatchChannelInboundReply`）。アダプター例、現在の型名、移行メモについては、それらのページを参照してください。API 形状の信頼できる情報源は以下のスケッチではなく、それらのページです。

### 送信コンテキスト

`withDurableMessageSendContext` は、1 件のアウトバウンドメッセージの周辺で、チャンネルコードに `render`、`previewUpdate`、`send`、`edit`、`delete`、`commit`、`fail` のステップを提供します。`sendDurableMessageBatch` は一般的なケースのラッパーです。レンダリングし、送信し、その後 `sent`/`suppressed` ではコミットし、エラーでは失敗させます。

`sendDurableMessageBatch` は、1 つの判別可能な結果を返します:

| ステータス     | 意味                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------ |
| `sent`         | 少なくとも 1 件の表示可能なプラットフォームメッセージが配信された                         |
| `suppressed`   | プラットフォームメッセージを欠落として扱うべきではない（フックでキャンセル、dry-run など） |
| `partial_failed` | 後続のペイロードまたは副作用が失敗する前に、少なくとも 1 件のメッセージが配信された    |
| `failed`       | プラットフォーム受領情報が生成されなかった                                                 |

耐久性は `required`、`best_effort`、`disabled` のいずれかです（`src/channels/message/types.ts` の `MessageDurabilityPolicy`）。`required` は耐久化意図を書き込めない場合にフェイルクローズします。`best_effort` は永続化が利用できない場合に直接送信へフォールスルーします。`disabled` はリファクタリング前の直接送信の動作を維持します。レガシー互換ヘルパーはデフォルトで `disabled` になり、チャンネルに汎用アウトバウンドアダプターがあるという理由だけで `required` を推論しません。

危険なまま残る境界: プラットフォーム呼び出しが成功した後、受領情報がコミットされる前です。そこでプロセスが終了した場合、アダプターが `reconcileUnknownSend` を宣言していない限り、コアはプラットフォームメッセージが存在するかどうかを知ることができません。そのフックは、中断された送信を `sent`、`not_sent`、`unresolved` に分類します。`not_sent` の場合だけ再生が許可されます。照合を持たないチャンネルは `unknown_after_send` 状態（`src/channels/message/state.ts`、`src/infra/outbound/delivery-queue-recovery.ts`）にフォールバックし、表示メッセージの重複がそのチャンネルにとって許容され、文書化されたトレードオフである場合にのみ、少なくとも 1 回の再生を選択できます。

### 受信コンテキスト

`createMessageReceiveContext` は、インバウンドイベントごとに ack/nack 状態を、冪等な `ack()` と明示的な `nack(error)` で追跡します。ack ポリシー（`ChannelMessageReceiveAckPolicy`）は次のいずれかです:

| ポリシー               | ack するタイミング                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | コアが再配信の重複排除/ルーティングに十分なインバウンドメタデータを永続化したとき       |
| `after_agent_dispatch` | エージェント実行がディスパッチされたとき                                                 |
| `after_durable_send`   | このターンの耐久化アウトバウンド送信がコミットされたとき                                 |
| `manual`               | 呼び出し元が ack タイミングを明示的に制御する（ポリシーを宣言しないアダプターのデフォルト） |

Telegram ポーリングはこれを使って、安全に完了した更新ウォーターマーク（`extensions/telegram/src/bot-update-tracker.ts` の `safeCompletedUpdateId`）を永続化します。grammY は各更新がミドルウェアチェーンに入る時点で引き続きすべて観測しますが、OpenClaw はディスパッチを完了した更新の先までしか永続化された再起動ウォーターマークを進めないため、失敗した更新やまだ保留中の更新は再起動後に再生されます。Telegram の上流 `getUpdates` offset は引き続き grammY が所有します。このウォーターマークを超えてプラットフォームレベルの再配信を制御する完全に耐久化されたポーリングソースは構築されていません（未解決の質問を参照）。

### ライブプレビュー

`src/channels/message/live.ts` は、preview/edit/finalize を 1 つのライフサイクルとしてモデル化します。`createLiveMessageState`、`markLiveMessagePreviewUpdated`、`markLiveMessageFinalized`、`markLiveMessageCancelled`、`deliverFinalizableLivePreviewAdapter`（下書きから最終編集を構築し、適用し、編集が不可能または失敗した場合は通常送信にフォールバック）です。`LiveMessageState.phase` は `idle | previewing | finalizing | finalized | cancelled` です。`canFinalizeInPlace` は、プレビューを新規送信ではなく編集によって最終メッセージにできるかどうかを制御します。

### 耐久化受領情報

`MessageReceipt`（`src/channels/message/types.ts`）は、単一の論理送信から得られる 1 件以上のプラットフォームメッセージ ID を、`platformMessageIds` とパートごとの `parts`（種類、インデックス、スレッド ID、返信先 ID）に正規化します。スレッド化と後続編集のために、プライマリ ID が保持されます。これにより、複数パートの配信（テキストとメディア、分割テキスト、カードフォールバック）を、再起動後に再生可能かつ重複排除可能にできます。

### 公開 SDK の削減

このリファクタリングにより、公開 API として露出していた `reply-runtime`、`reply-dispatch-runtime`、`reply-reference`、`reply-chunking`、`reply-payload` ヘルパー、`inbound-reply-dispatch`、`channel-reply-pipeline`、および `outbound-runtime` の多くの公開利用が吸収または非推奨化されました。`src/plugin-sdk/channel-message.ts` は現在、`channel-outbound` / `channel-inbound` を指す `@deprecated` 再エクスポートバレルです。`channel.turn` ランタイムエイリアスは削除され、古い `/plugins/sdk-channel-turn` ドキュメントページは [Channel inbound API](/ja-JP/plugins/sdk-channel-inbound) にリダイレクトします。新しい Plugin コードは `channel-outbound` と `channel-inbound` を直接対象にするべきです。

## 実装が元の設計から逸脱した箇所

以下の設計スケッチは、記述どおりには出荷されませんでした。歴史的な正確性のために記録を残しています。これらの型名を現在の API として扱わないでください。

- **`MessageOrigin` / `shouldDropOpenClawEcho` はありません。** 元の計画では、Gateway 失敗メッセージに `source: "openclaw"` origin タグを付け、共有ルームでタグ付きのボット作成エコーを `allowBots` 認可前にドロップする共有述語を用意する予定でした。その型と述語はコードベースに存在しません。`allowBots` 自体は実在するチャンネルごとの設定キー（Slack、Discord、Google Chat など）ですが、それを保護するはずだった origin タグ付け機構は構築されませんでした。ボット有効ルームでの Gateway 失敗エコー抑制は、出荷済みの保証ではなく、未解決のギャップのままです。
- **統一された `core.messages.receive/send/live/state` 名前空間はありません。** 出荷済みの関数は、`core.messages.*` ファサードの背後ではなく、`src/channels/message/*` に直接存在します（`withDurableMessageSendContext`、`createMessageReceiveContext`、`createLiveMessageState`、`classifyDurableSendRecoveryState`）。
- **汎用の `ChannelMessage` / `MessageTarget` / `MessageRelation` 正規化メッセージ型はありません。** コアは、`kind: "reply" | "followup" | "broadcast" | "system"` 関係を持つ 1 つのプラットフォーム中立メッセージ形状ではなく、具体的な返信ペイロード（`ReplyPayload`）とチャンネル固有コンテキストを送信アダプターに渡し続けています。
- **ack ポリシー名はスケッチと異なります。** 出荷済み: `after_receive_record | after_agent_dispatch | after_durable_send | manual`。元のスケッチでは、webhook タイムアウト理由フィールドを持つ `immediate | after-record | after-durable-send | manual` を使用していましたが、その形は構築されませんでした。
- **`DurableFinalDeliveryRequirementMap` 機能キーが、スケッチされた `MessageCapabilities` オブジェクトを置き換えました。** 機能は、ネストされた `text.chunking` / `attachments.voice` 形式の構造ではなく、`text`、`media`、`poll`、`payload`、`silent`、`replyTo`、`thread`、`nativeQuote`、`messageSendingHooks`、`batch`、`reconcileUnknownSend`、`afterSendSuccess`、`afterCommit` というフラットな真偽値フラグで、`verifyDurableFinalCapabilityProofs` を通じて検証されます。

## 具体的な移行上の危険（現在も関連あり）

これらのチャンネル固有の副作用はリファクタリング以前から存在しており、新しい送信パスでも動作し続ける必要があります。これは仮説ではありません。各項目は現在実装済みで、重要な役割を担っています。

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): モニターは送信成功後、送信済みメッセージをエコーキャッシュに記録します。耐久性のある最終送信でもこのキャッシュを引き続き埋める必要があります。そうしないと、OpenClaw が自分自身の返信を受信ユーザーメッセージとして再取り込みする可能性があります。
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): グループ返信後に任意のモデル署名を追加し、参加済みスレッドを記録します。耐久性のある配信でこれらの効果を迂回してはいけません。
- **Discord とその他の準備済みディスパッチャー**は、すでに直接配信とプレビュー動作を所有しています。準備済みディスパッチャーが最終送信を送信コンテキスト経由で明示的にルーティングするまで、そのチャンネルはエンドツーエンドで耐久性があるとはいえません。汎用アダプターだけでカバーされていると仮定しないでください。
- **Telegram のサイレントフォールバック配信**は、チャンク化/フォールバック投影後に、最初のペイロードだけでなく、投影されたペイロード配列全体を配信する必要があります。
- **LINE、Zalo、Nostr**、および類似のヘルパーパスには、返信トークン処理、メディアプロキシ、送信済みメッセージキャッシュ、またはコールバック専用ターゲットがある場合があります。これらのセマンティクスが送信アダプターで表現され、テストでカバーされるまで、チャンネル所有の配信に留まります。
- **Direct-DM ヘルパー**には、唯一の正しいトランスポートターゲットである返信コールバックがある場合があります。汎用アウトバウンドは、生のプラットフォームフィールドからターゲットを推測してそのコールバックをスキップしてはいけません。

## 失敗分類

アダプターはトランスポート失敗を `DeliveryFailureKind` 形式の閉じたカテゴリ（一時的、レート制限、認証、権限、未検出、無効なペイロード、競合、キャンセル済み、不明）に分類します。コアポリシー:

- 一時的な失敗とレート制限の失敗は再試行します。
- レンダリングフォールバックが存在しない限り、無効なペイロードの失敗は再試行しません。
- 設定が変更されるまで、認証または権限の失敗は再試行しません。
- 未検出の場合、チャンネルが安全であると宣言しているときは、ライブ最終化で編集から新規送信へフォールバックできるようにします。
- 競合の場合、受領/idempotency 状態を使用してメッセージがすでに存在するかどうかを判断します。
- プラットフォーム呼び出し後、受領コミット前に発生したエラーは、アダプターがプラットフォーム操作が発生しなかったことを証明しない限り、`unknown_after_send` になります。

## 未解決の質問

- Telegram が最終的に、grammY (`1.43.0`) のポーリングランナーを、OpenClaw の永続化された再起動ウォーターマーク (`safeCompletedUpdateId`) だけでなく、プラットフォームレベルの再配信を制御する完全に耐久性のあるポーリングソースに置き換えるべきかどうか。
- ライブプレビュー状態を最終送信インテントと同じレコードに置くべきか、兄弟のライブ状態ストアに置くべきか。
- 共有のボット有効ルームにおける Gateway 失敗時のエコー抑制に、当初計画されていたオリジンタグ付け機構が必要なのか、より単純なチャンネル単位の契約でよいのか、またはスコープ外なのか。
- どのチャンネルがクロスボットのエコー抑制向けにネイティブのオリジン/メタデータサポートを持ち、どのチャンネルが永続化されたアウトバウンドレジストリを必要とするのか。

## 関連

- [メッセージ](/ja-JP/concepts/messages)
- [ストリーミングとチャンク化](/ja-JP/concepts/streaming)
- [進行状況ドラフト](/ja-JP/concepts/progress-drafts)
- [再試行ポリシー](/ja-JP/concepts/retry)
- [チャンネルアウトバウンド API](/ja-JP/plugins/sdk-channel-outbound)
- [チャンネルインバウンド API](/ja-JP/plugins/sdk-channel-inbound)
