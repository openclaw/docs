---
read_when:
    - チャネルの送信または受信動作のリファクタリング
    - チャネルの受信、返信ディスパッチ、送信キュー、プレビューストリーミング、または Plugin SDK メッセージ API の変更
    - 永続的な送信、受信確認、プレビュー、編集、または再試行を必要とする新しいチャンネルPluginの設計
summary: 耐久性のあるメッセージ受信・送信ライフサイクルの状況：リリース済みの内容、当初の設計からの変更点、未解決の課題
title: メッセージライフサイクルのリファクタリング
x-i18n:
    generated_at: "2026-07-11T22:12:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
このページは、将来を見据えた設計提案として作成されました。その設計の中核は、その後 `src/channels/message/*` および公開されている `openclaw/plugin-sdk/channel-outbound` / `channel-inbound` サブパスに実装されました。現在の API については、[チャンネル送信 API](/ja-JP/plugins/sdk-channel-outbound) および[チャンネル受信 API](/ja-JP/plugins/sdk-channel-inbound)を参照してください。このページでは、実装済みの内容、元の構想から実装が分岐した箇所、および未解決の項目を追跡します。
</Note>

## このリファクタリングが行われた理由

チャンネルスタックは、複数の局所的な修正から発展しました。具体的には、成熟度ごとに分かれた受信ヘルパー（単純なアダプター向けの `runtime.channel.inbound.run`、高機能なアダプター向けの `runtime.channel.inbound.runPreparedReply`）、旧式の返信ディスパッチヘルパー（`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`）、チャンネル固有のプレビューストリーミング、既存の返信ペイロード経路に後付けされた最終配信の耐久性です。この構造により、公開される概念が多くなりすぎ、配信セマンティクスにずれが生じ得る箇所も増えすぎました。

再設計を必要とした信頼性上の欠陥は次のとおりです。

```text
Telegram のポーリング更新を確認応答済み
  -> アシスタントの最終テキストが存在
  -> sendMessage が成功する前にプロセスが再起動
  -> 最終応答が失われる
```

目標とする不変条件：表示可能な送信メッセージが存在すべきだとコアが判断したら、プラットフォーム呼び出しを試行する前に送信意図を永続化し、成功後にプラットフォームの受領情報をコミットする必要があります。これにより、デフォルトで少なくとも1回の復旧が可能になります。厳密に1回の動作が成立するのは、アダプターがネイティブな冪等性を証明する場合、または再試行前に送信後の結果不明な試行をプラットフォーム状態と照合する場合のみです。

## 実装済みの内容

内部ドメインは `src/channels/message/*` にあります。

| ファイル                    | 担当                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | アダプター、送信コンテキスト、受領情報、永続的意図の型契約                                                        |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — 永続的な送信コンテキスト                             |
| `receive.ts`                | `createMessageReceiveContext` — 受信確認応答ポリシーの状態機械                                                     |
| `live.ts`                   | ライブプレビュー状態と、その場で確定するかフォールバックするロジック                                               |
| `state.ts`                  | `classifyDurableSendRecoveryState` — 中断後の復旧分類                                                              |
| `receipt.ts`                | プラットフォームの送信結果を `MessageReceipt` に正規化                                                            |
| `capabilities.ts`           | ペイロードから必要な永続的最終配信機能を導出                                                                      |
| `contracts.ts`              | 宣言されたアダプター機能の契約証明を検証                                                                          |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — 旧式の `sendText`/`sendMedia`/`sendPayload`/`sendPoll` 関数をラップ    |
| `ingress-queue.ts`          | `createChannelIngressQueue` — 永続的な受信イベントキュー                                                          |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — 受信重複排除用の受付/保留/完了/解放ジャーナル                               |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` および旧式の名前を持つラッパー                                                       |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`、返信プレフィックスおよび入力中コールバックのヘルパー                                |

公開インターフェース：`openclaw/plugin-sdk/channel-outbound`（送信/受領情報/永続化/ライブ/返信パイプラインのヘルパー）および `openclaw/plugin-sdk/channel-inbound`（受信コンテキスト、`runChannelInboundEvent`、`dispatchChannelInboundReply`）。アダプターの例、現在の型名、移行に関する注意事項については、これらのページを参照してください。API の構造について信頼すべき情報源は、以下の構想ではなく、これらのページです。

### 送信コンテキスト

`withDurableMessageSendContext` は、1つの送信メッセージを処理するための `render`、`previewUpdate`、`send`、`edit`、`delete`、`commit`、`fail` ステップをチャンネルコードに提供します。`sendDurableMessageBatch` は一般的なケース向けのラッパーで、レンダリング、送信を行い、`sent`/`suppressed` の場合はコミットし、エラーの場合は失敗として処理します。

`sendDurableMessageBatch` は、次のいずれかの判別可能な結果を返します。

| ステータス       | 意味                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `sent`           | 少なくとも1つの表示可能なプラットフォームメッセージが配信された                         |
| `suppressed`     | プラットフォームメッセージが欠落したものとして扱うべきではない（フックによるキャンセル、ドライランなど） |
| `partial_failed` | 後続のペイロードまたは副作用が失敗する前に、少なくとも1つのメッセージが配信された       |
| `failed`         | プラットフォームの受領情報が生成されなかった                                             |

耐久性は `required`、`best_effort`、`disabled` のいずれかです（`src/channels/message/types.ts` の `MessageDurabilityPolicy`）。`required` は永続的な意図を書き込めない場合に安全側で失敗します。`best_effort` は永続化を利用できない場合に直接送信へフォールスルーします。`disabled` はリファクタリング前の直接送信動作を維持します。旧式の互換性ヘルパーはデフォルトで `disabled` を使用し、チャンネルに汎用送信アダプターがあるという理由だけで `required` を推定することはありません。

依然として危険な境界は、プラットフォーム呼び出しの成功後から受領情報のコミット前までです。そこでプロセスが停止した場合、アダプターが `reconcileUnknownSend` を宣言していない限り、コアはプラットフォームメッセージが存在するかどうかを判断できません。このフックは、中断された送信を `sent`、`not_sent`、`unresolved` のいずれかに分類します。再試行が許可されるのは `not_sent` の場合のみです。照合機能を持たないチャンネルは `unknown_after_send` 状態（`src/channels/message/state.ts`、`src/infra/outbound/delivery-queue-recovery.ts`）にフォールバックします。また、表示メッセージが重複することを、そのチャンネルで許容可能かつ文書化されたトレードオフとして扱える場合に限り、少なくとも1回の再試行を選択できます。

### 受信コンテキスト

`createMessageReceiveContext` は、冪等な `ack()` と明示的な `nack(error)` により、受信イベントごとの確認応答/否定応答の状態を追跡します。確認応答ポリシー（`ChannelMessageReceiveAckPolicy`）は次のいずれかです。

| ポリシー               | 確認応答するタイミング                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `after_receive_record` | 再配信の重複排除やルーティングに十分な受信メタデータをコアが永続化した後                   |
| `after_agent_dispatch` | エージェント実行がディスパッチされた後                                                       |
| `after_durable_send`   | このターンの永続的な送信がコミットされた後                                                   |
| `manual`               | 呼び出し元が確認応答のタイミングを明示的に制御する（ポリシーを宣言しないアダプターのデフォルト） |

Telegram のポーリングでは、これを使用して安全に完了した更新のウォーターマーク（`extensions/telegram/src/bot-update-tracker.ts` の `safeCompletedUpdateId`）を永続化します。grammY は引き続き、ミドルウェアチェーンに入るすべての更新を監視しますが、OpenClaw はディスパッチを完了した更新を越える場合にのみ、永続化された再起動用ウォーターマークを進めます。そのため、失敗した更新や処理中の更新は再起動後に再試行されます。Telegram の上流 `getUpdates` オフセットは引き続き grammY が管理します。このウォーターマークを越えてプラットフォームレベルの再配信を制御する、完全に永続的なポーリングソースはまだ構築されていません（未解決の項目を参照）。

### ライブプレビュー

`src/channels/message/live.ts` は、プレビュー/編集/確定を1つのライフサイクルとしてモデル化します。`createLiveMessageState`、`markLiveMessagePreviewUpdated`、`markLiveMessageFinalized`、`markLiveMessageCancelled`、および `deliverFinalizableLivePreviewAdapter`（下書きから最終編集内容を構築して適用し、編集が不可能または失敗した場合は通常の送信にフォールバック）で構成されます。`LiveMessageState.phase` は `idle | previewing | finalizing | finalized | cancelled` です。`canFinalizeInPlace` は、新規送信ではなく編集によってプレビューを最終メッセージにできるかどうかを判定します。

### 永続的な受領情報

`MessageReceipt`（`src/channels/message/types.ts`）は、単一の論理送信から得られる1つ以上のプラットフォームメッセージ ID を、`platformMessageIds` とパートごとの `parts`（種別、インデックス、スレッド ID、返信先 ID）に正規化します。スレッド化や後からの編集のために、プライマリ ID が保持されます。これにより、複数パートの配信（テキストとメディア、分割されたテキスト、カードのフォールバック）を再起動後に再試行し、重複排除できるようになります。

### 公開 SDK の縮小

このリファクタリングでは、公開 API として公開されていた `reply-runtime`、`reply-dispatch-runtime`、`reply-reference`、`reply-chunking`、`reply-payload` ヘルパー、`inbound-reply-dispatch`、`channel-reply-pipeline`、および `outbound-runtime` の公開利用の大部分を吸収または非推奨化しました。`src/plugin-sdk/channel-message.ts` は現在、`channel-outbound` / `channel-inbound` を指す `@deprecated` 再エクスポートバレルです。`channel.turn` ランタイムエイリアスは削除され、旧 `/plugins/sdk-channel-turn` ドキュメントページは[チャンネル受信 API](/ja-JP/plugins/sdk-channel-inbound)へリダイレクトされます。新しい Plugin コードは `channel-outbound` と `channel-inbound` を直接対象にしてください。

## 実装が元の設計から分岐した箇所

以下の設計構想は、記述どおりの形では実装されませんでした。履歴上の正確性のために記録を残していますが、これらの型名を現在の API として扱わないでください。

- **`MessageOrigin` / `shouldDropOpenClawEcho` はありません。** 元の計画では、Gateway 障害メッセージに `source: "openclaw"` という送信元タグを付け、共有ルームでタグ付けされたボット作成のエコーを `allowBots` 認可より前に破棄する共通述語を用意することになっていました。この型と述語はコードベースに存在しません。`allowBots` 自体は実際に存在するチャンネルごとの設定キー（Slack、Discord、Google Chat など）ですが、それを保護するための送信元タグ付け機構は構築されませんでした。ボットが有効なルームにおける Gateway 障害エコーの抑制は、実装済みの保証ではなく、未解決の欠陥として残っています。
- **統一された `core.messages.receive/send/live/state` 名前空間はありません。** 実装された関数は、`core.messages.*` ファサードの背後ではなく、`src/channels/message/*` に直接配置されています（`withDurableMessageSendContext`、`createMessageReceiveContext`、`createLiveMessageState`、`classifyDurableSendRecoveryState`）。
- **汎用の `ChannelMessage` / `MessageTarget` / `MessageRelation` 正規化メッセージ型はありません。** コアは、`kind: "reply" | "followup" | "broadcast" | "system"` の関係を持つ単一のプラットフォーム非依存メッセージ構造ではなく、具体的な返信ペイロード（`ReplyPayload`）とチャンネル固有のコンテキストを送信アダプターに引き続き渡します。
- **確認応答ポリシー名は構想と異なります。** 実装済み：`after_receive_record | after_agent_dispatch | after_durable_send | manual`。元の構想では、Webhook タイムアウトの理由フィールドを持つ `immediate | after-record | after-durable-send | manual` を使用していましたが、その構造は実装されませんでした。
- **`DurableFinalDeliveryRequirementMap` の機能キーが、構想されていた `MessageCapabilities` オブジェクトに置き換わりました。** 機能は、ネストされた `text.chunking` / `attachments.voice` 形式の構造ではなく、フラットな真偽値フラグ（`text`、`media`、`poll`、`payload`、`silent`、`replyTo`、`thread`、`nativeQuote`、`messageSendingHooks`、`batch`、`reconcileUnknownSend`、`afterSendSuccess`、`afterCommit`）であり、`verifyDurableFinalCapabilityProofs` によって検証されます。

## 具体的な移行上の危険（現在も該当）

これらのチャネル固有の副作用はリファクタリング以前から存在しており、新しい送信パスでも
引き続き機能しなければなりません。これらは仮定上のものではなく、現在それぞれが
実装され、重要な役割を担っています。

- **iMessage**（`extensions/imessage/src/monitor/echo-cache.ts`、
  `persisted-echo-cache.ts`）：モニターは送信成功後、送信したメッセージをエコー
  キャッシュに記録します。永続化される最終送信でも引き続きこのキャッシュに
  記録しなければ、OpenClaw が自身の返信を受信ユーザーメッセージとして再取り込みする
  可能性があります。
- **Tlon**（`extensions/tlon/src/monitor/index.ts`）：オプションのモデル
  署名を追加し、グループへの返信後に参加したスレッドを記録します。永続的な
  配信でこれらの処理を迂回してはなりません。
- **Discord およびその他の準備済みディスパッチャー**は、すでに直接配信と
  プレビュー動作を担っています。準備済みディスパッチャーが最終メッセージを送信コンテキスト経由で
  明示的にルーティングするまで、そのチャネルはエンドツーエンドで永続的ではありません。
  汎用アダプターだけで対応できると想定しないでください。
- **Telegram のサイレントフォールバック配信**では、チャンク分割とフォールバック
  プロジェクションの後、最初のペイロードだけでなく、プロジェクションされた
  ペイロード配列全体を配信しなければなりません。
- **LINE、Zalo、Nostr** および同様のヘルパーパスには、返信トークンの
  処理、メディアのプロキシ、送信済みメッセージのキャッシュ、またはコールバック専用ターゲットが
  ある場合があります。それらのセマンティクスが送信アダプターで表現され、
  テストで網羅されるまでは、チャネル所有の配信を維持します。
- **ダイレクト DM ヘルパー**には、唯一の正しいトランスポートターゲットである返信コールバックが
  存在する場合があります。汎用の送信処理は、生のプラットフォームフィールドから
  ターゲットを推測してそのコールバックを省略してはなりません。

## 失敗の分類

アダプターはトランスポート障害を `DeliveryFailureKind` 形式の閉じた
カテゴリ（一時的、レート制限、認証、権限、未検出、無効な
ペイロード、競合、キャンセル済み、不明）に分類します。コアポリシーは次のとおりです。

- 一時的な障害とレート制限による障害は再試行します。
- レンダリングのフォールバックが存在しない限り、無効なペイロードによる障害は再試行しません。
- 設定が変更されるまで、認証または権限による障害は再試行しません。
- 未検出の場合、チャネルが安全であると宣言しているときは、ライブ最終処理で
  編集から新規送信へフォールバックできるようにします。
- 競合の場合、受領情報と冪等性の状態を使用して、メッセージが
  すでに存在するかどうかを判断します。
- プラットフォーム呼び出しは成功した可能性があるものの、受領情報の
  コミット前にエラーが発生した場合、アダプターがプラットフォーム操作が
  実行されなかったことを証明しない限り、`unknown_after_send` とします。

## 未解決事項

- Telegram が将来的に grammY（`1.43.0`）のポーリング
  ランナーを、OpenClaw の永続化された再起動ウォーターマーク
  （`safeCompletedUpdateId`）だけでなく、プラットフォームレベルの
  再配信を制御する完全に永続的なポーリングソースへ置き換えるべきか。
- ライブプレビューの状態を最終送信インテントと同じレコードに格納すべきか、
  それとも隣接するライブ状態ストアに格納すべきか。
- 共有のボット有効化ルームにおける Gateway 障害時のエコー抑制に、
  当初計画されていた送信元タグ付けの仕組み、より単純なチャネル単位の
  契約が必要なのか、あるいはスコープ外なのか。
- ボット間のエコー抑制にネイティブの送信元情報／メタデータを利用できるチャネルと、
  永続化された送信レジストリが必要なチャネルはどれか。

## 関連項目

- [メッセージ](/ja-JP/concepts/messages)
- [ストリーミングとチャンク分割](/ja-JP/concepts/streaming)
- [進行状況の下書き](/ja-JP/concepts/progress-drafts)
- [再試行ポリシー](/ja-JP/concepts/retry)
- [チャネル送信 API](/ja-JP/plugins/sdk-channel-outbound)
- [チャネル受信 API](/ja-JP/plugins/sdk-channel-inbound)
