---
read_when:
    - 新しいメッセージングチャネルPluginを構築しています
    - OpenClaw をメッセージングプラットフォームに接続したい
    - ChannelPlugin アダプターサーフェスを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw 用メッセージングチャネル Plugin を構築するためのステップバイステップガイド
title: チャネル Plugin の構築
x-i18n:
    generated_at: "2026-07-05T11:40:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c0151fad0915cda90987aa2401d1d4a326f7922cf5d838171a4014a84ad713f
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw をメッセージングプラットフォームに接続するチャネル Plugin を構築します。DM セキュリティ、ペアリング、返信スレッド化、アウトバウンドメッセージングを扱います。

<Info>
  OpenClaw plugins が初めての場合は、まずパッケージ構造とマニフェスト設定について [はじめに](/ja-JP/plugins/building-plugins)
  を読んでください。
</Info>

## Plugin が所有するもの

チャネル plugins は送信/編集/リアクションツールを実装しません。コアが共有の
`message` ツールを提供します。Plugin が所有するものは次のとおりです。

- **設定** - アカウント解決とセットアップウィザード
- **セキュリティ** - DM ポリシーと許可リスト
- **ペアリング** - DM 承認フロー
- **セッション文法** - プロバイダー固有の会話 ID をベースチャット、スレッド ID、親フォールバックにマッピングする方法
- **アウトバウンド** - テキスト、メディア、投票をプラットフォームへ送信すること
- **スレッド化** - 返信をスレッド化する方法
- **Heartbeat タイピング** - Heartbeat 配信ターゲット向けの任意のタイピング/ビジー信号

コアは、共有メッセージツール、プロンプト配線、外側のセッションキー形状、汎用的な `:thread:` ブックキーピング、ディスパッチを所有します。

## メッセージアダプター

`openclaw/plugin-sdk/channel-outbound` の `defineChannelMessageAdapter` で `message` アダプターを公開します。宣言するのは、ネイティブトランスポートが実際にサポートする永続的な最終送信機能だけにし、ネイティブ側の副作用と返される受領情報を証明する契約テストで裏付けてください。テキスト/メディア送信は、レガシー `outbound` アダプターが使うものと同じトランスポート関数に向けます。完全な API 契約、機能マトリクス、受領ルール、ライブプレビューの最終化、受信 ack ポリシー、テスト、移行表については、[チャネルアウトバウンド API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。

既存の `outbound` アダプターが適切な送信メソッドと機能メタデータをすでに持っている場合は、別のブリッジを手書きするのではなく、`createChannelMessageAdapterFromOutbound(...)` で `message` アダプターを導出します。アダプター送信は `MessageReceipt` 値を返します。レガシー ID については、並列の `messageIds` フィールドを保持するのではなく、`listMessageReceiptPlatformIds(...)` または `resolveMessageReceiptPrimaryId(...)` で導出してください。

ライブ機能と最終化機能は正確に宣言してください。コアはこれらを使ってチャネルが何をできるか判断し、宣言と実際の挙動がずれると契約テスト失敗になります。

| サーフェス | 値 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities` | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure` |

ドラフトプレビューをその場で最終化するチャネルは、ランタイムロジックを `defineFinalizableLivePreviewAdapter(...)` と `deliverWithFinalizableLivePreviewAdapter(...)` に通し、宣言された機能を `verifyChannelMessageLiveCapabilityAdapterProofs(...)` と `verifyChannelMessageLiveFinalizerProofs(...)` のテストで裏付けてください。これにより、ネイティブプレビュー、進捗、編集、フォールバック/保持、クリーンアップ、受領の挙動が静かにずれることを防げます。

プラットフォーム確認応答を遅延するインバウンド受信側は、monitor ローカル状態に ack タイミングを隠すのではなく、`message.receive.defaultAckPolicy` と `supportedAckPolicies` を宣言してください。宣言した各ポリシーを `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` でカバーします。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply` などのレガシー返信ヘルパーは、互換性ディスパッチャー向けに引き続き利用できます。新しいチャネルコードでは使わず、代わりに `openclaw/plugin-sdk/channel-outbound` の `message` アダプター、受領情報、受信/送信ライフサイクルヘルパーから始めてください。

### インバウンド入口（実験的）

インバウンド認可を移行するチャネルは、ランタイム受信パスから実験的な `openclaw/plugin-sdk/channel-ingress-runtime` サブパスを使用できます。これは、プラットフォーム facts、生の許可リスト、ルート記述子、コマンド facts、アクセスグループ設定を受け取り、送信者/ルート/コマンド/有効化の射影と順序付き ingress graph を返します。一方で、プラットフォーム検索と副作用は Plugin に残ります。Plugin identity の正規化はリゾルバーに渡す記述子内に保持してください。解決済み状態や決定から生のマッチ値をシリアライズしないでください。API 設計、所有境界、テスト期待値については [チャネル ingress API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。古い `openclaw/plugin-sdk/channel-ingress` サブパスは、サードパーティ plugins 向けの非推奨互換 facade としてエクスポートされたままです。

### タイピングインジケーター

チャネルがインバウンド返信以外でタイピングインジケーターをサポートする場合は、チャネル Plugin で `heartbeat.sendTyping(...)` を公開します。コアは、Heartbeat モデル実行が始まる前に、解決済みの Heartbeat 配信ターゲットでこれを呼び出し、共有のタイピング keepalive/cleanup ライフサイクルを使用します。プラットフォームが明示的な停止信号を必要とする場合は、`heartbeat.clearTyping(...)` を追加してください。

### メディアソースパラメーター

チャネルがメディアソースを持つメッセージツールパラメーターを追加する場合は、それらのパラメーター名を `plugin.actions.describeMessageTool(...).mediaSourceParams` で公開してください。コアはサンドボックスパス正規化とアウトバウンドメディアアクセスポリシーにその明示的なリストを使うため、plugins はプロバイダー固有のアバター、添付ファイル、カバー画像パラメーターのために共有コアの特別ケースを必要としません。

`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを推奨します。これにより、無関係なアクションが別アクションのメディア引数を継承しません。公開されるすべてのアクションで意図的に共有するパラメーターには、フラット配列も引き続き使えます。

プラットフォーム側のメディア取得のために一時的な公開 URL を公開する必要があるチャネルは、Plugin 状態ストアとともに `openclaw/plugin-sdk/outbound-media` の `createHostedOutboundMediaStore(...)` を使用できます。プラットフォームルート解析とトークン強制はチャネル Plugin 内に保持してください。共有ヘルパーは、メディア読み込み、有効期限メタデータ、チャンク行、クリーンアップだけを所有します。

### ネイティブペイロード整形

チャネルが `message(action="send")` にプロバイダー固有の整形を必要とする場合は、`actions.prepareSendPayload(...)` を優先してください。ネイティブカード、ブロック、埋め込み、その他の永続データは `payload.channelData.<channel>` の下に置き、コアにアウトバウンド/メッセージアダプター経由で送信させます。シリアライズして再試行できないペイロードの互換性フォールバックとしてのみ、送信に `actions.handleAction(...)` を使用してください。

### セッション会話文法

プラットフォームが会話 ID 内に追加スコープを保存する場合は、その解析を `messaging.resolveSessionConversation(...)` で Plugin 内に保持してください。これは、`rawId` をベース会話 ID、任意のスレッド ID、明示的な `baseConversationId`、任意の `parentConversationCandidates` にマッピングするための標準フックです。`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/ベース会話へ順序付けます。

`messaging.resolveParentConversationCandidates(...)` は、汎用/生 ID の上に親フォールバックだけが必要な plugins 向けの非推奨互換フォールバックです。両方のフックが存在する場合、コアはまず `resolveSessionConversation(...).parentConversationCandidates` を使用し、標準フックがそれらを省略した場合のみ `resolveParentConversationCandidates(...)` にフォールバックします。

チャネルレジストリ起動前に同じ解析が必要なバンドル plugins は、一致する `resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルを公開できます（Feishu と Telegram plugins を参照）。コアは、ランタイム Plugin レジストリがまだ利用できない場合にのみ、そのブートストラップセーフなサーフェスを使用します。

Plugin コードがルート風フィールドを正規化したり、子スレッドを親ルートと比較したり、`{ channel, to, accountId, threadId }` から安定した重複排除キーを構築したりする必要がある場合は、`openclaw/plugin-sdk/channel-route` を使用してください。このヘルパーは、コアと同じ方法で数値スレッド ID を正規化するため、アドホックな `String(threadId)` 比較より優先してください。プロバイダー固有のターゲット文法を持つ plugins は、`messaging.resolveOutboundSessionRoute(...)` を公開して、コアがパーサーシムなしでプロバイダーネイティブなセッションとスレッド identity を取得できるようにしてください。

## 承認とチャネル機能

ほとんどのチャネル plugins は承認固有コードを必要としません。コアが同一チャットの `/approve`、共有承認ボタンペイロード、汎用フォールバック配信を所有します。`ChannelPlugin.approvals` は削除されました。代わりに、承認の配信/ネイティブ/レンダリング/認可 facts を 1 つの `approvalCapability` オブジェクトに置いてください。`plugin.auth` はログイン/ログアウト専用です。コアはそのオブジェクトから承認 auth フックを読み取らなくなりました。

`approvalCapability.delivery` はネイティブ承認ルーティングまたはフォールバック抑制にのみ使用し、`approvalCapability.render` は共有レンダラーではなくカスタム承認ペイロードが本当に必要なチャネルの場合にのみ使用してください。

### 承認 auth

- `approvalCapability.authorizeActorAction` と
  `approvalCapability.getActionAvailabilityState` は標準の承認 auth seam です。
- 同一チャット承認 auth の可用性には `getActionAvailabilityState` を使用します。
  ネイティブ配信が無効な場合でも、設定済み承認者は `/approve` で利用可能にしてください。代わりに、配信/セットアップガイダンスにはネイティブ開始サーフェス状態を使用します。
- チャネルがネイティブ exec 承認を公開する場合は、同一チャット承認 auth と異なるときの開始サーフェス/ネイティブクライアント状態に
  `approvalCapability.getExecInitiatingSurfaceState` を使用します。コアはその exec 固有フックを使って `enabled` と `disabled` を区別し、開始チャネルがネイティブ exec 承認をサポートするか判断し、ネイティブクライアントフォールバックガイダンスにそのチャネルを含めます。
  `createApproverRestrictedNativeApprovalCapability(...)` は、この一般的なケースを補完します。
- チャネルが既存設定から安定した owner 風の DM identity を推測できる場合は、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使って、承認固有のコアロジックを追加せずに同一チャット `/approve` を制限してください。
- カスタム承認 auth が意図的に同一チャットフォールバックだけを許可する場合は、
  `openclaw/plugin-sdk/approval-auth-runtime` から `markImplicitSameChatApprovalAuthorization({ authorized: true })` を返します。そうでない場合、コアは結果を明示的な承認者認可として扱います。
- チャネル所有のネイティブコールバックが承認を直接解決する場合は、解決前に
  `isImplicitSameChatApprovalAuthorization(...)` を使用してください。これにより、暗黙的フォールバックが引き続きチャネルの通常の actor 認可を通ります。

### ペイロードライフサイクルとセットアップガイダンス

- 重複するローカル承認プロンプトを隠す、配信前にタイピングインジケーターを送る、といったチャネル固有のペイロードライフサイクル挙動には、`outbound.shouldSuppressLocalPayloadPrompt` または
  `outbound.beforeDeliverPayload` を使用します。
- チャネルが無効パスの返信でネイティブ exec 承認を有効化するために必要な正確な設定ノブを説明したい場合は、`approvalCapability.describeExecApprovalSetup` を使用します。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントチャネルは、トップレベルのデフォルトではなく、
  `channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープのパスをレンダリングする必要があります。
- Plugin 承認失敗ガイダンスを Plugin 承認の no-route および timeout 失敗で表示しても安全な場合は、`approvalCapability.describePluginApprovalSetup` を使用します。`createApproverRestrictedNativeApprovalCapability(...)` は、これを `describeExecApprovalSetup` から推測しません。Plugin 承認と exec 承認が本当に同じネイティブセットアップを使う場合のみ、同じヘルパーを明示的に渡してください。

### ネイティブ承認配信

チャネルがネイティブ承認配信を必要とする場合は、チャネルコードを
ターゲット正規化とトランスポート/プレゼンテーションの事実に集中させる。`openclaw/plugin-sdk/approval-runtime` から
`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、
`createChannelApproverDmTargetResolver`、および
`createApproverRestrictedNativeApprovalCapability` を使用する。チャネル固有の事実は
`approvalCapability.nativeRuntime` の背後に置き、理想的には
`createChannelApprovalNativeRuntimeAdapter(...)` または
`createLazyChannelApprovalNativeRuntimeAdapter(...)` 経由にする。そうすることで、core は
ハンドラーを組み立て、リクエストのフィルタリング、ルーティング、重複排除、有効期限、Gateway
サブスクリプション、別経路ルーティング通知を所有できる。

`nativeRuntime` は、いくつかの小さな継ぎ目に分割されている。

- `availability` - アカウントが設定済みかどうか、およびリクエストを
  処理すべきかどうか
- `presentation` - 共有承認ビューモデルを
  保留中/解決済み/期限切れのネイティブペイロード、または最終アクションへマップする
- `transport` - ターゲットを準備し、ネイティブ承認
  メッセージを送信/更新/削除する
- `interactions` - ネイティブボタンまたはリアクション向けの任意の bind/unbind/clear-action フックと、
  任意の `cancelDelivered` フック。`deliverPending` がインプロセスまたは永続的な
  状態（リアクションターゲットストアなど）を登録する場合は、`cancelDelivered` を実装する。
  これにより、ハンドラー停止が `bindPending` の実行前に配信をキャンセルした場合、または
  `bindPending` がハンドルを返さない場合に、その状態を解放できる
- `observe` - 任意の配信診断フック

その他の承認ヘルパー:

- チャネルがセッション起点のネイティブ配信と明示的な承認転送ターゲットの両方をサポートする場合は、
  `openclaw/plugin-sdk/approval-native-runtime` の
  `createNativeApprovalChannelRouteGates` を使用する。このヘルパーは、承認設定の選択、`mode` の処理、
  エージェント/セッションフィルター、アカウントバインディング、セッションターゲット照合、ターゲットリスト照合を
  集約する。一方で、呼び出し側は引き続きチャネル id、デフォルト転送モード、アカウント検索、
  トランスポート有効化チェック、ターゲット正規化、ターンソースターゲット解決を所有する。
  core 所有のチャネルポリシーデフォルトを作成するために使用してはならない。チャネルの
  文書化されたデフォルトモードを明示的に渡す。
- `createChannelNativeOriginTargetResolver` は、デフォルトで `{ to, accountId, threadId }`
  ターゲット向けの共有チャネルルートマッチャーを使用する。Slack タイムスタンプ接頭辞照合のような、
  プロバイダー固有の等価ルールをチャネルが持つ場合にのみ、`targetsMatch` を渡す。
  デフォルトのルートマッチャーまたはカスタム `targetsMatch` コールバックが実行される前に、
  配信用の元のターゲットを保持しながらプロバイダー id を正規化する必要がある場合は、
  `normalizeTargetForMatch` を渡す。解決済みの配信ターゲット自体を正規化すべき場合にのみ
  `normalizeTarget` を使用する。
- チャネルがクライアント、トークン、Bolt app、webhook レシーバーなどのランタイム所有オブジェクトを必要とする場合は、
  `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する。汎用 runtime-context
  レジストリにより、core は承認固有のラッパー接着剤を追加せずに、チャネル起動状態から
  capability 駆動ハンドラーをブートストラップできる。
- 低レベルの `createChannelApprovalHandler` または
  `createChannelNativeApprovalRuntime` は、capability 駆動の継ぎ目がまだ十分に表現力を持たない場合にのみ使用する。
- ネイティブ承認チャネルは、`accountId` と `approvalKind` の両方をこれらのヘルパー経由で
  ルーティングする必要がある。`accountId` はマルチアカウント承認ポリシーを正しいボットアカウントにスコープし、
  `approvalKind` は core にハードコードされた分岐を置かずに、exec と Plugin の承認動作を
  チャネルで利用できるようにする。
- core は承認の再ルーティング通知も所有する。チャネル Plugin は
  `createChannelNativeApprovalRuntime` から独自の「承認は DM / 別チャネルに送信されました」フォローアップメッセージを
  送信してはならない。代わりに、共有承認 capability ヘルパーを通じて正確な起点 +
  承認者 DM ルーティングを公開し、開始元チャットに通知を投稿する前に、core に実際の配信を集約させる。
- 配信された承認 id の種類をエンドツーエンドで保持する。ネイティブクライアントは、チャネルローカル状態から
  exec と Plugin の承認ルーティングを推測したり書き換えたりしてはならない。
- 異なる承認種別が、意図的に異なるネイティブサーフェスを公開することがある。現在のバンドル例:
  Matrix は exec と Plugin の承認で同じネイティブ DM/チャネルルーティングとリアクション UX を維持しつつ、
  承認種別ごとに auth を変えられる。Slack は exec と Plugin の id の両方で
  ネイティブ承認ルーティングを利用可能にしている。
- `createApproverRestrictedNativeApprovalAdapter` は互換ラッパーとしてまだ存在するが、
  新しいコードでは capability ビルダーを優先し、Plugin 上で `approvalCapability` を公開するべきである。

### より狭い承認ランタイムサブパス

ホットなチャネルエントリポイントでは、そのファミリーの一部だけが必要な場合、より広い
`approval-runtime` バレルよりも、これらの狭いサブパスを優先する。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、すべてが必要でない場合は、より広い包括サーフェスよりも
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking` を優先する。

### セットアップサブパス

- `openclaw/plugin-sdk/setup-runtime` は、ランタイムセーフなセットアップヘルパーを対象とする:
  `createSetupTranslator`、インポートセーフなセットアップパッチアダプター
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)、lookup-note 出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委譲された
  setup-proxy ビルダー。
- `openclaw/plugin-sdk/channel-setup` は、任意インストールのセットアップ
  ビルダーと、いくつかのセットアップセーフなプリミティブを対象とする: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled`, および `splitSetupEntries`。
- `moveSingleAccountChannelSectionToDefaultAccount(...)` のような、より重い共有セットアップ/設定ヘルパーも必要な場合にのみ、
  より広い `openclaw/plugin-sdk/setup` 継ぎ目を使用する。

チャネルがセットアップサーフェスで「この Plugin を先にインストールする」ことだけを案内したい場合は、
`createOptionalChannelSetupSurface(...)` を優先する。生成されたアダプター/ウィザードは、
設定書き込みと finalization でフェイルクローズし、検証、finalize、docs-link コピー全体で
同じインストール必須メッセージを再利用する。

チャネルが env 駆動のセットアップまたは auth をサポートし、汎用 startup/config フローがランタイム読み込み前に
それらの env 名を知る必要がある場合は、Plugin マニフェストの `channelEnvVars` で宣言する。
チャネルランタイムの `envVars` またはローカル定数は、operator 向けコピーのみに使う。

Plugin ランタイム開始前に、チャネルが `status`、`channels list`、`channels status`、または
SecretRef スキャンに現れる可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加する。
そのエントリポイントは読み取り専用コマンドパスでインポートしても安全であるべきで、これらの概要に必要な
チャネルメタデータ、セットアップセーフな設定アダプター、ステータスアダプター、チャネル secret ターゲットメタデータを
返すべきである。セットアップエントリからクライアント、リスナー、トランスポートランタイムを開始してはならない。

メインのチャネルエントリインポートパスも狭く保つ。Discovery は、チャネルをアクティブ化せずに、
エントリとチャネル Plugin モジュールを評価して capability を登録できる。`channel-plugin-api.ts` のようなファイルは、
セットアップウィザード、トランスポートクライアント、ソケットリスナー、サブプロセスランチャー、サービス起動モジュールを
インポートせずに、チャネル Plugin オブジェクトをエクスポートするべきである。これらのランタイム部品は、
`registerFull(...)`、ランタイム setter、または遅延 capability アダプターから読み込まれるモジュールに置く。

### その他の狭いチャネルサブパス

その他のホットなチャネルパスでは、より広いレガシーサーフェスよりも狭いヘルパーを優先する。

- マルチアカウント設定とデフォルトアカウントフォールバックには、
  `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers`
- インバウンドルート/エンベロープと record-and-dispatch 配線には、
  `openclaw/plugin-sdk/inbound-envelope` および
  `openclaw/plugin-sdk/channel-inbound`
- ターゲット解析ヘルパーには `openclaw/plugin-sdk/channel-targets`
- メディア読み込みには `openclaw/plugin-sdk/outbound-media`、アウトバウンド identity/send デリゲートと
  ペイロード計画には `openclaw/plugin-sdk/channel-outbound`
- アウトバウンドルートが明示的な `replyToId`/`threadId` を保持するべき場合、またはベースセッションキーがまだ一致した後に
  現在の `:thread:` セッションを復元するべき場合は、
  `openclaw/plugin-sdk/channel-core` の `buildThreadAwareOutboundSessionRoute(...)`。
  プロバイダー Plugin は、プラットフォームにネイティブスレッド配信セマンティクスがある場合、
  precedence、suffix 動作、thread id 正規化をオーバーライドできる。
- thread-binding ライフサイクルとアダプター登録には
  `openclaw/plugin-sdk/thread-bindings-runtime`
- レガシーのエージェント/メディアペイロードフィールドレイアウトがまだ必要な場合にのみ
  `openclaw/plugin-sdk/agent-media-payload`
- Telegram カスタムコマンドの正規化、重複/競合検証、フォールバック安定なコマンド設定コントラクトには
  `openclaw/plugin-sdk/telegram-command-config`（非推奨: 本番環境で使用するバンドル Plugin はない）。
  新しい Plugin コードでは Plugin ローカルのコマンド設定処理を優先する

auth のみのチャネルは、通常デフォルトパスで足りる。core が承認を処理し、Plugin は outbound/auth
capability を公開するだけでよい。Matrix、Slack、Telegram、カスタムチャットトランスポートのような
ネイティブ承認チャネルは、独自の承認ライフサイクルを作るのではなく、共有ネイティブヘルパーを使用するべきである。

## インバウンドメンションポリシー

インバウンドメンション処理は 2 つのレイヤーに分けておく。

- Plugin 所有の証拠収集
- 共有ポリシー評価

メンションポリシー判断には `openclaw/plugin-sdk/channel-mention-gating` を使用する。
より広いインバウンドヘルパーバレルが必要な場合にのみ、`openclaw/plugin-sdk/channel-inbound` を使用する。

Plugin ローカルロジックに適しているもの:

- ボットへの返信検出
- 引用されたボットの検出
- スレッド参加チェック
- サービス/システムメッセージの除外
- ボット参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適しているもの:

- `requireMention`
- 明示的メンション結果
- 暗黙的メンション許可リスト
- コマンドバイパス
- 最終的なスキップ判断

推奨フロー:

1. ローカルメンション事実を計算する。
2. それらの事実を `resolveInboundMentionDecision({ facts, policy })` に渡す。
3. インバウンドゲートで `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、および
   `decision.shouldSkip` を使用する。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` は boolean を返す。`hasAnyMention`、
`isExplicitlyMentioned`、および `canResolveExplicit` は、チャネル独自の
ネイティブメンションメタデータ（メッセージエンティティ、reply-to-bot フラグなど）から来る。
プラットフォームがそれらを検出できない場合は、`false`/`undefined` 値を指定する。

`api.runtime.channel.mentions` は、すでにランタイム注入に依存している
バンドル済みチャンネル Plugin 向けに、同じ共有メンションヘルパーを公開します:
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、
`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

`implicitMentionKindWhen` と `resolveInboundMentionDecision` だけが必要な場合は、
無関係なインバウンドランタイムヘルパーの読み込みを避けるため、
`openclaw/plugin-sdk/channel-mention-gating` からインポートします。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準の Plugin ファイルを作成します。
    マニフェストがチャンネルを所有することを示すのは、`kind` フィールドではなく
    `openclaw.plugin.json` の `channels` フィールドです。
    パッケージメタデータの全体的なサーフェスについては、
    [Plugin のセットアップと設定](/ja-JP/plugins/sdk-setup#openclaw-channel) を参照してください:

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` は `plugins.entries.acme-chat.config` を検証します。
    チャンネルアカウント設定ではない、Plugin 所有の設定に使用します。
    `channelConfigs.acme-chat.schema` は `channels.acme-chat` を検証し、
    Plugin ランタイムが読み込まれる前に設定スキーマ、セットアップ、UI サーフェスで使用される
    コールドパスのソースです。トップレベルフィールドの完全なリファレンスについては、
    [Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。

  </Step>

  <Step title="チャンネル Plugin オブジェクトを構築する">
    `ChannelPlugin` インターフェイスには、多くの任意アダプターサーフェスがあります。
    最小構成の `id`、`config`、`setup` から始め、必要に応じてアダプターを追加します。

    `src/channel.ts` を作成します:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // Account resolution/inspection belongs on `config`, not `setup`.
        // `setup` covers onboarding writes (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    正規のトップレベル DM キーとレガシーのネストされたキーの両方を受け入れるチャンネルでは、`plugin-sdk/channel-config-helpers` のヘルパーを使用します: `resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom`、`normalizeChannelDmPolicy` は、継承されたルート値よりもアカウントローカル値を優先します。同じリゾルバーを `normalizeLegacyDmAliases` による doctor 修復と組み合わせることで、ランタイムとマイグレーションが同じ契約を読み取るようにします。

    <Accordion title="createChatChannelPlugin が提供すること">
      低レベルのアダプターインターフェイスを手動で実装する代わりに、
      宣言的なオプションを渡すと、ビルダーがそれらを合成します:

      | オプション | 接続するもの |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付き DM セキュリティリゾルバー |
      | `pairing.text` | コード交換を伴うテキストベースの DM ペアリングフロー |
      | `threading` | reply-to モードリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージ ID）を返す送信関数。コアが返された配信結果にスタンプできるように、兄弟の `channel` ID が必要です |

      完全に制御する必要がある場合は、宣言的なオプションの代わりに
      生のアダプターオブジェクトを渡すこともできます。

      生のアウトバウンドアダプターは `chunker(text, limit, ctx)` 関数を定義できます。
      任意の `ctx.formatting` は、`maxLinesPerMessage` などの配信時のフォーマット判断を保持します。
      共有アウトバウンド配信によって返信スレッド化とチャンク境界が一度だけ解決されるように、
      送信前に適用します。
      ネイティブ返信ターゲットが解決された場合、送信コンテキストには
      `replyToIdSource`（`implicit` または `explicit`）も含まれるため、
      ペイロードヘルパーは暗黙の単回使用返信スロットを消費せずに、
      明示的な返信タグを保持できます。
    </Accordion>

  </Step>

  <Step title="エントリーポイントを接続する">
    `index.ts` を作成します:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    チャンネル所有の CLI ディスクリプターは `registerCliMetadata(...)` に置きます。
    これにより OpenClaw は、完全なチャンネルランタイムを有効化せずにルートヘルプへ表示できます。
    通常の完全ロードでも、実際のコマンド登録に同じディスクリプターが使用されます。
    ランタイム専用の処理には `registerFull(...)` を使い続けます。
    `defineChannelPluginEntry` は登録モードの分割を自動的に処理します。
    `registerFull(...)` が Gateway RPC メソッドを登録する場合は、
    Plugin 固有のプレフィックスを使用します。コア管理名前空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、常に
    `operator.admin` に解決されます。すべてのオプションについては
    [エントリーポイント](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="セットアップエントリを追加する">
    オンボーディング中の軽量ロード用に `setup-entry.ts` を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    チャンネルが無効または未設定の場合、OpenClaw は完全エントリの代わりにこれを読み込みます。
    これにより、セットアップフロー中に重いランタイムコードを取り込まずに済みます。
    詳細は [セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップセーフなエクスポートをサイドカーモジュールに分割するバンドル済みワークスペースチャンネルは、
    明示的なセットアップ時ランタイムセッターも必要な場合、
    `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。

  </Step>

  <Step title="インバウンドメッセージを処理する">
    Plugin はプラットフォームからメッセージを受け取り、OpenClaw に転送する必要があります。
    典型的なパターンは、リクエストを検証し、チャンネルのインバウンドハンドラー経由で
    ディスパッチする Webhook です:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      インバウンドメッセージ処理はチャンネル固有です。各チャンネル Plugin は、
      独自のインバウンドパイプラインを所有します。実際のパターンについては、
      バンドル済みチャンネル Plugin（たとえば Microsoft Teams または Google Chat Plugin パッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` に同じ場所のテストを書きます:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    共有テストヘルパーについては、[テスト](/ja-JP/plugins/sdk-testing)を参照してください。

</Step>
</Steps>

## ファイル構造

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、またはカスタムの返信モード
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool とアクション検出
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/ja-JP/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    TTS、STT、メディア、api.runtime 経由のサブエージェント
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/ja-JP/plugins/sdk-channel-inbound">
    共有インバウンドイベントのライフサイクル: ingest、resolve、record、dispatch、finalize
  </Card>
</CardGroup>

<Note>
一部のバンドル済みヘルパーシームは、バンドルPluginのメンテナンスと
互換性のためにまだ存在します。これらは新しいチャンネルPluginに推奨されるパターンではありません。
そのバンドルPluginファミリーを直接メンテナンスしている場合を除き、共通SDK
サーフェスから汎用のチャンネル/setup/reply/runtimeサブパスを使用してください。
</Note>

## 次のステップ

- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) - Pluginがモデルも提供する場合
- [SDK概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [SDKテスト](/ja-JP/plugins/sdk-testing) - テストユーティリティと契約テスト
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - 完全なマニフェストスキーマ

## 関連

- [Plugin SDKセットアップ](/ja-JP/plugins/sdk-setup)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [エージェントハーネスPlugin](/ja-JP/plugins/sdk-agent-harness)
