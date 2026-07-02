---
read_when:
    - 新しいメッセージングチャネル Plugin を構築している
    - OpenClaw をメッセージングプラットフォームに接続したい
    - ChannelPlugin アダプターのサーフェスを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw 用メッセージングチャネル Plugin を構築するためのステップバイステップガイド
title: OpenClaw Docs i18n 入力をビルドする
x-i18n:
    generated_at: "2026-07-02T22:22:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw をメッセージングプラットフォームに接続するチャネルPluginの構築手順を説明します。最後まで進めると、DM セキュリティ、ペアリング、返信スレッド化、アウトバウンドメッセージングを備えた動作するチャネルが完成します。

<Info>
  まだ OpenClaw Plugin を構築したことがない場合は、基本的なパッケージ構造とマニフェスト設定について、先に
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

## チャネルPluginの仕組み

チャネルPluginは、独自の送信、編集、リアクションツールを持つ必要はありません。OpenClaw は core に共有の `message` ツールを 1 つ保持します。Plugin が担当するものは次のとおりです。

- **設定** - アカウント解決とセットアップウィザード
- **セキュリティ** - DM ポリシーと許可リスト
- **ペアリング** - DM 承認フロー
- **セッション文法** - プロバイダー固有の会話 ID を、ベースチャット、スレッド ID、親フォールバックに対応付ける方法
- **アウトバウンド** - テキスト、メディア、投票をプラットフォームへ送信すること
- **スレッド化** - 返信をどのようにスレッド化するか
- **Heartbeat タイピング** - Heartbeat 配信ターゲット向けの任意の入力中/ビジーシグナル

Core は、共有メッセージツール、プロンプト配線、外側のセッションキー形状、汎用 `:thread:` ブックキーピング、ディスパッチを担当します。

新しいチャネルPluginは、`openclaw/plugin-sdk/channel-outbound` の
`defineChannelMessageAdapter` を使って `message` アダプターも公開する必要があります。このアダプターは、ネイティブトランスポートが実際に対応している永続的な最終送信機能を宣言し、テキスト/メディア送信を従来の `outbound` アダプターと同じトランスポート関数に向けます。ネイティブ側の効果と返却されるレシートを契約テストで証明できる場合にのみ、機能を宣言してください。
完全な API 契約、例、機能マトリクス、レシートルール、ライブプレビュー確定、受信 ack ポリシー、テスト、移行表については、
[チャネルアウトバウンド API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。
既存の `outbound` アダプターに適切な送信メソッドと機能メタデータがすでにある場合は、別のブリッジを手書きする代わりに `createChannelMessageAdapterFromOutbound(...)` を使って `message` アダプターを派生してください。
アダプター送信は `MessageReceipt` 値を返す必要があります。互換コードがまだレガシー ID を必要とする場合は、新しいライフサイクルコードで並列の `messageIds` フィールドを保持するのではなく、`listMessageReceiptPlatformIds(...)`
または `resolveMessageReceiptPrimaryId(...)` で派生してください。
プレビュー対応チャネルは、`draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming`、`quietFinalization` など、自身が担当する正確なライブライフサイクルを `message.live.capabilities` にも宣言する必要があります。下書きプレビューをその場で確定するチャネルは、`finalEdit`、`normalFallback`、`discardPending`、`previewReceipt`、`retainOnAmbiguousFailure` などを `message.live.finalizer.capabilities` にも宣言し、ランタイムロジックを `defineFinalizableLivePreviewAdapter(...)` と
`deliverWithFinalizableLivePreviewAdapter(...)` 経由にしてください。これらの機能は `verifyChannelMessageLiveCapabilityAdapterProofs(...)` と
`verifyChannelMessageLiveFinalizerProofs(...)` のテストで裏付け、ネイティブプレビュー、進捗、編集、フォールバック/保持、クリーンアップ、レシート動作が静かにずれないようにしてください。
プラットフォーム確認応答を遅延するインバウンド受信側は、ack タイミングをモニター内ローカル状態に隠すのではなく、`message.receive.defaultAckPolicy` と `supportedAckPolicies` を宣言する必要があります。宣言したすべてのポリシーを `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` でカバーしてください。

`createChannelTurnReplyPipeline`、
`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`
などのレガシー返信ヘルパーは、互換ディスパッチャー向けに引き続き利用できます。新しいチャネルコードでこれらの名前を使わないでください。新しいPluginは、`openclaw/plugin-sdk/channel-outbound` の `message` アダプター、レシート、受信/送信ライフサイクルヘルパーから始める必要があります。

インバウンド認可を移行するチャネルは、ランタイム受信パスから実験的な
`openclaw/plugin-sdk/channel-ingress-runtime` サブパスを使用できます。このサブパスは、許可リスト状態の解決、ルート/送信者/コマンド/イベント/アクティベーションの判断、編集済み診断、ターン許可マッピングを共有しながら、プラットフォーム検索と副作用をPlugin内に保持します。Plugin の ID 正規化はリゾルバーに渡す記述子に保持してください。解決済み状態や判断から生の一致値をシリアライズしないでください。API 設計、所有権境界、テスト期待値については、
[チャネルイングレス API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。

チャネルがインバウンド返信以外で入力インジケーターをサポートする場合は、チャネルPluginで `heartbeat.sendTyping(...)` を公開してください。Core は Heartbeat モデル実行の開始前に、解決済みの Heartbeat 配信ターゲットを使ってこれを呼び出し、共有のタイピング keepalive/cleanup ライフサイクルを使用します。プラットフォームが明示的な停止シグナルを必要とする場合は、`heartbeat.clearTyping(...)`
を追加してください。

チャネルがメディアソースを運ぶメッセージツールパラメーターを追加する場合は、それらのパラメーター名を `describeMessageTool(...).mediaSourceParams` で公開してください。Core はその明示的なリストをサンドボックスパス正規化とアウトバウンドメディアアクセスのポリシーに使用するため、Plugin はプロバイダー固有のアバター、添付ファイル、カバー画像パラメーターのために shared-core の特別扱いを必要としません。
無関係なアクションが別のアクションのメディア引数を継承しないように、
`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを返すことを推奨します。公開されるすべてのアクションで意図的に共有されるパラメーターには、フラットな配列も引き続き使えます。
プラットフォーム側のメディア取得のために一時的な公開 URL を公開する必要があるチャネルは、Plugin 状態ストアとともに
`openclaw/plugin-sdk/outbound-media` の `createHostedOutboundMediaStore(...)` を使用できます。プラットフォームルートの解析とトークン適用はチャネルPlugin内に保持してください。共有ヘルパーが担当するのは、メディア読み込み、有効期限メタデータ、チャンク行、クリーンアップのみです。

チャネルが `message(action="send")` に対してプロバイダー固有の整形を必要とする場合は、`actions.prepareSendPayload(...)` を推奨します。ネイティブカード、ブロック、埋め込み、その他の永続データは `payload.channelData.<channel>` の下に置き、実際の送信は core がアウトバウンド/メッセージアダプター経由で実行するようにしてください。`actions.handleAction(...)` は、シリアライズして再試行できないペイロードの互換フォールバックとしてのみ送信に使用してください。

プラットフォームが会話 ID の内部に追加スコープを格納する場合は、その解析を `messaging.resolveSessionConversation(...)` でPlugin内に保持してください。これは、`rawId` をベース会話 ID、任意のスレッド ID、明示的な `baseConversationId`、任意の `parentConversationCandidates` に対応付けるための標準フックです。
`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/ベース会話へ順に並べてください。

Plugin コードがルート風のフィールドを正規化する、子スレッドを親ルートと比較する、または `{ channel, to, accountId, threadId }` から安定した重複排除キーを構築する必要がある場合は、`openclaw/plugin-sdk/channel-route` を使用してください。このヘルパーは数値スレッド ID を core と同じ方法で正規化するため、Plugin は場当たり的な `String(threadId)` 比較よりもこれを優先する必要があります。
プロバイダー固有のターゲット文法を持つPluginは、core がパーサーシムを使わずにプロバイダーネイティブのセッションとスレッド ID を取得できるように、
`messaging.resolveOutboundSessionRoute(...)` を公開する必要があります。

チャネルレジストリが起動する前に同じ解析を必要とするバンドル済みPluginは、対応する
`resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルも公開できます。Core は、ランタイムPluginレジストリがまだ利用できない場合にのみ、そのブートストラップセーフなサーフェスを使用します。

`messaging.resolveParentConversationCandidates(...)` は、Plugin が汎用/生 ID の上に親フォールバックだけを必要とする場合のレガシー互換フォールバックとして引き続き利用できます。両方のフックが存在する場合、core はまず
`resolveSessionConversation(...).parentConversationCandidates` を使用し、標準フックがそれらを省略した場合にのみ
`resolveParentConversationCandidates(...)` にフォールバックします。

## 承認とチャネル機能

ほとんどのチャネルPluginには、承認専用のコードは必要ありません。

- Core は同一チャットの `/approve`、共有承認ボタンペイロード、汎用フォールバック配信を所有する。
- チャネルに承認固有の挙動が必要な場合は、チャネル Plugin 上の単一の `approvalCapability` オブジェクトを優先する。
- `ChannelPlugin.approvals` は削除された。承認の配信、ネイティブ、レンダリング、認証の事実は `approvalCapability` に置く。
- `plugin.auth` はログイン/ログアウト専用である。Core はそのオブジェクトから承認認証フックを読み取らなくなった。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` が正規の承認認証 seam である。
- 同一チャット承認認証の利用可否には `approvalCapability.getActionAvailabilityState` を使用する。ネイティブ配信が無効でも、設定済み承認者は `/approve` で利用可能にしておく。配信/セットアップ案内には、代わりにネイティブ開始サーフェス状態を使用する。
- チャネルがネイティブ exec 承認を公開する場合、同一チャット承認認証と異なるときは、開始サーフェス/ネイティブクライアント状態に `approvalCapability.getExecInitiatingSurfaceState` を使用する。Core はその exec 固有フックを使って `enabled` と `disabled` を区別し、開始チャネルがネイティブ exec 承認をサポートするかを判断し、ネイティブクライアントのフォールバック案内にそのチャネルを含める。`createApproverRestrictedNativeApprovalCapability(...)` は一般的なケースでこれを補完する。
- 重複するローカル承認プロンプトの非表示や、配信前のタイピングインジケーター送信など、チャネル固有のペイロードライフサイクル挙動には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使用する。
- `approvalCapability.delivery` は、ネイティブ承認ルーティングまたはフォールバック抑制にのみ使用する。
- チャネル所有のネイティブ承認事実には `approvalCapability.nativeRuntime` を使用する。ホットなチャネルエントリポイントでは `createLazyChannelApprovalNativeRuntimeAdapter(...)` で遅延させておく。これは必要に応じてランタイムモジュールをインポートでき、同時に Core が承認ライフサイクルを組み立てられるようにする。
- 共有レンダラーではなく、チャネルに本当にカスタム承認ペイロードが必要な場合にのみ `approvalCapability.render` を使用する。
- チャネルが、ネイティブ exec 承認を有効化するために必要な正確な設定ノブを disabled パスの返信で説明したい場合は、`approvalCapability.describeExecApprovalSetup` を使用する。このフックは `{ channel, channelLabel, accountId }` を受け取る。名前付きアカウントのチャネルは、トップレベルのデフォルトではなく `channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープのパスをレンダリングするべきである。
- Plugin 承認の no-route と timeout 失敗について、Plugin 承認失敗の案内を表示しても安全な場合は `approvalCapability.describePluginApprovalSetup` を使用する。`createApproverRestrictedNativeApprovalCapability(...)` はこれを `describeExecApprovalSetup` から推測しない。Plugin 承認と exec 承認が本当に同じネイティブセットアップを使用する場合にのみ、同じヘルパーを明示的に渡す。
- チャネルが既存設定から安定した owner 風の DM ID を推測できる場合、承認固有の Core ロジックを追加せずに同一チャット `/approve` を制限するため、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使用する。
- カスタム承認認証が意図的に同一チャットフォールバックのみを許可する場合は、`openclaw/plugin-sdk/approval-auth-runtime` から `markImplicitSameChatApprovalAuthorization({ authorized: true })` を返す。それ以外の場合、Core は結果を明示的な承認者認可として扱う。
- チャネル所有のネイティブコールバックが承認を直接解決する場合は、解決前に `isImplicitSameChatApprovalAuthorization(...)` を使用し、暗黙的フォールバックが引き続きチャネルの通常のアクター認可を通るようにする。
- チャネルにネイティブ承認配信が必要な場合、チャネルコードはターゲット正規化とトランスポート/プレゼンテーションの事実に集中させる。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使用する。チャネル固有の事実は `approvalCapability.nativeRuntime` の背後に置く。理想的には `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` を使う。これにより、Core がハンドラーを組み立て、リクエストフィルタリング、ルーティング、重複排除、有効期限、Gateway サブスクリプション、別経路ルーティング通知を所有できる。`nativeRuntime` は、いくつかのより小さな seam に分割されている。
- チャネルがセッション起点のネイティブ配信と明示的な承認転送ターゲットの両方をサポートする場合は、`openclaw/plugin-sdk/approval-native-runtime` の `createNativeApprovalChannelRouteGates` を使用する。このヘルパーは、承認設定の選択、`mode` 処理、エージェント/セッションフィルター、アカウントバインディング、セッションターゲット照合、ターゲットリスト照合を集中管理する。一方で、呼び出し元は引き続きチャネル ID、デフォルト転送モード、アカウント検索、トランスポート有効化チェック、ターゲット正規化、ターンソースターゲット解決を所有する。Core 所有のチャネルポリシーデフォルトを作成するために使用してはならない。チャネルで文書化されたデフォルトモードを明示的に渡す。
- `createChannelNativeOriginTargetResolver` は、デフォルトで `{ to, accountId, threadId }` ターゲットに共有チャネルルートマッチャーを使用する。Slack のタイムスタンプ接頭辞照合のように、チャネルにプロバイダー固有の同等性ルールがある場合にのみ `targetsMatch` を渡す。
- デフォルトルートマッチャーまたはカスタム `targetsMatch` コールバックが実行される前に、チャネルが配信の元ターゲットを保持したままプロバイダー ID を正規化する必要がある場合は、`createChannelNativeOriginTargetResolver` に `normalizeTargetForMatch` を渡す。解決された配信ターゲット自体を正規化するべき場合にのみ `normalizeTarget` を使用する。
- `availability` - アカウントが設定されているか、およびリクエストを処理するべきか
- `presentation` - 共有承認ビューモデルを pending/resolved/expired のネイティブペイロードまたは最終アクションへマップする
- `transport` - ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除する
- `interactions` - ネイティブボタンまたはリアクション向けの任意の bind/unbind/clear-action フック、および任意の `cancelDelivered` フック。`deliverPending` がプロセス内または永続状態（リアクションターゲットストアなど）を登録する場合は、`cancelDelivered` を実装する。これにより、ハンドラー停止が `bindPending` 実行前に配信をキャンセルした場合や、`bindPending` がハンドルを返さない場合に、その状態を解放できる
- `observe` - 任意の配信診断フック
- チャネルにクライアント、トークン、Bolt アプリ、Webhook レシーバーなどのランタイム所有オブジェクトが必要な場合は、`openclaw/plugin-sdk/channel-runtime-context` を通じて登録する。汎用ランタイムコンテキストレジストリにより、Core は承認固有のラッパー glue を追加せずに、チャネル起動状態から capability 駆動のハンドラーをブートストラップできる。
- capability 駆動の seam がまだ十分に表現力を持たない場合にのみ、低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` に手を伸ばす。
- ネイティブ承認チャネルは、これらのヘルパーを通じて `accountId` と `approvalKind` の両方をルーティングしなければならない。`accountId` はマルチアカウント承認ポリシーを正しい bot アカウントにスコープし、`approvalKind` は Core にハードコードされた分岐を置かずに、exec と Plugin 承認の挙動をチャネルで利用可能に保つ。
- Core は承認の再ルーティング通知も所有するようになった。チャネル Plugin は `createChannelNativeApprovalRuntime` から独自の「承認が DM / 別チャネルへ送られた」フォローアップメッセージを送信するべきではない。代わりに、共有承認 capability ヘルパーを通じて正確な origin + approver-DM ルーティングを公開し、Core に実際の配信を集約させてから、開始チャットへ通知を投稿させる。
- 配信された承認 ID の kind をエンドツーエンドで保持する。ネイティブクライアントは、チャネルローカル状態から exec と Plugin 承認のルーティングを
  推測したり書き換えたりするべきではない。
- 異なる承認 kind は、意図的に異なるネイティブサーフェスを公開できる。
  現在のバンドル例:
  - Slack は exec と Plugin ID の両方でネイティブ承認ルーティングを利用可能に保つ。
  - Matrix は exec 承認と Plugin 承認で同じネイティブ DM/チャネルルーティングとリアクション UX を維持しつつ、承認 kind ごとに認証を変えられるようにしている。
- `createApproverRestrictedNativeApprovalAdapter` は互換性ラッパーとしてまだ存在するが、新しいコードでは capability ビルダーを優先し、Plugin 上で `approvalCapability` を公開するべきである。

ホットなチャネルエントリポイントでは、そのファミリーの一部だけが必要な場合、より狭いランタイムサブパスを優先する:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広い umbrella サーフェスが不要な場合は、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking` を優先する。

セットアップについては特に:

- `openclaw/plugin-sdk/setup-runtime` は、ランタイムセーフなセットアップヘルパーをカバーする:
  `createSetupTranslator`、インポートセーフなセットアップパッチアダプター（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note 出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委譲された
  setup-proxy ビルダー
- `openclaw/plugin-sdk/setup-runtime` には、
  `createEnvPatchedAccountSetupAdapter` 向けの env 対応アダプター seam が含まれる
- `openclaw/plugin-sdk/channel-setup` は、optional-install セットアップ
  ビルダーと、いくつかの setup-safe プリミティブをカバーする:
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

チャネルが env 駆動のセットアップまたは認証をサポートし、汎用の起動/設定
フローがランタイム読み込み前にそれらの env 名を知る必要がある場合は、
Plugin マニフェストで `channelEnvVars` として宣言する。チャネルランタイムの `envVars` またはローカル定数は、
オペレーター向けコピー専用に保つ。

Plugin ランタイム開始前にチャネルが `status`、`channels list`、`channels status`、または
SecretRef スキャンに現れる可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加する。そのエントリポイントは読み取り専用コマンド
パスで安全にインポートできるべきであり、それらの要約に必要なチャネルメタデータ、セットアップセーフな設定アダプター、ステータス
アダプター、チャネルシークレットターゲットメタデータを返すべきである。セットアップエントリから
クライアント、リスナー、トランスポートランタイムを開始してはならない。

メインチャネルエントリのインポートパスも狭く保つ。Discovery はチャネルを有効化せずに、
エントリとチャネル Plugin モジュールを評価して capability を登録できる。
`channel-plugin-api.ts` などのファイルは、セットアップウィザード、トランスポートクライアント、ソケット
リスナー、サブプロセスランチャー、サービス起動モジュールをインポートせずに、チャネル
Plugin オブジェクトをエクスポートするべきである。これらのランタイム部品は、`registerFull(...)`、ランタイムセッター、または遅延
capability アダプターから読み込まれるモジュールに置く。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および
`splitSetupEntries`

- `moveSingleAccountChannelSectionToDefaultAccount(...)` のような
  より重い共有セットアップ/設定ヘルパーも必要な場合にのみ、より広い
  `openclaw/plugin-sdk/setup` seam を使用する

チャネルがセットアップサーフェスで「まずこの Plugin をインストールする」ことだけを告知したい場合は、
`createOptionalChannelSetupSurface(...)` を優先する。生成される
アダプター/ウィザードは設定書き込みと finalization で fail closed し、検証、finalize、docs-link
コピーで同じインストール必須メッセージを再利用する。

その他のホットなチャネルパスでは、より広い legacy
サーフェスよりも狭いヘルパーを優先する:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers` は、複数アカウント設定と
  default-account フォールバック用です
- `openclaw/plugin-sdk/inbound-envelope` と
  `openclaw/plugin-sdk/channel-inbound` は、インバウンド route/envelope と
  record-and-dispatch の配線用です
- `openclaw/plugin-sdk/channel-targets` は、ターゲット解析ヘルパー用です
- `openclaw/plugin-sdk/outbound-media` はメディア読み込み用、
  `openclaw/plugin-sdk/channel-outbound` はアウトバウンド identity/send デリゲート
  とペイロード計画用です
- アウトバウンド route が明示的な `replyToId`/`threadId` を保持する必要がある場合、またはベースセッションキーがまだ一致している後に現在の `:thread:` セッションを復元する必要がある場合は、
  `openclaw/plugin-sdk/channel-core` の `buildThreadAwareOutboundSessionRoute(...)` を使用します。
  Provider plugins は、プラットフォームにネイティブのスレッド配信セマンティクスがある場合、
  precedence、suffix の挙動、thread id の正規化をオーバーライドできます。
- `openclaw/plugin-sdk/thread-bindings-runtime` は、thread-binding lifecycle
  とアダプター登録用です
- `openclaw/plugin-sdk/agent-media-payload` は、レガシー agent/media
  ペイロードフィールドレイアウトがまだ必要な場合にのみ使用します
- `openclaw/plugin-sdk/telegram-command-config` は、Telegram カスタムコマンドの
  正規化、重複/競合検証、およびフォールバック安定なコマンド
  設定契約用です

認証専用チャンネルは通常、デフォルトパスで十分です。core が承認を処理し、Plugin はアウトバウンド/認証 capability を公開するだけです。Matrix、Slack、Telegram、カスタムチャットトランスポートなどのネイティブ承認チャンネルは、独自の承認 lifecycle を実装するのではなく、共有ネイティブヘルパーを使用してください。

## インバウンド mention ポリシー

インバウンド mention 処理は 2 つのレイヤーに分けたままにします。

- Plugin が所有する証拠収集
- 共有ポリシー評価

mention-policy の判断には `openclaw/plugin-sdk/channel-mention-gating` を使用します。
より広範なインバウンドヘルパーバレルが必要な場合にのみ
`openclaw/plugin-sdk/channel-inbound` を使用します。

Plugin ローカルロジックに適しているもの:

- reply-to-bot 検出
- quoted-bot 検出
- thread-participation チェック
- service/system-message 除外
- bot 参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適しているもの:

- `requireMention`
- 明示的 mention 結果
- 暗黙的 mention allowlist
- コマンド bypass
- 最終 skip 判断

推奨フロー:

1. ローカル mention facts を計算します。
2. それらの facts を `resolveInboundMentionDecision({ facts, policy })` に渡します。
3. インバウンド gate で `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip` を使用します。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` は、すでに runtime injection に依存している
バンドル済み channel plugins 向けに、同じ共有 mention ヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と
`resolveInboundMentionDecision` だけが必要な場合は、
無関係なインバウンド runtime ヘルパーを読み込まないように
`openclaw/plugin-sdk/channel-mention-gating` からインポートしてください。

mention gating には `resolveInboundMentionDecision({ facts, policy })` を使用します。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準の Plugin ファイルを作成します。`package.json` の `channel` フィールドによって、
    これが channel plugin になります。完全な package-metadata surface については、
    [Plugin Setup and Config](/ja-JP/plugins/sdk-setup#openclaw-channel) を参照してください。

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
      "kind": "channel",
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
    channel account config ではない、Plugin が所有する設定に使用してください。`channelConfigs`
    は `channels.acme-chat` を検証し、Plugin runtime が読み込まれる前に config
    schema、setup、UI surface が使用する cold-path source です。

  </Step>

  <Step title="channel plugin オブジェクトを構築する">
    `ChannelPlugin` インターフェイスには、多くの任意の adapter surface があります。まずは
    最小限の `id` と `setup` から始め、必要に応じてアダプターを追加してください。

    `src/channel.ts` を作成します。

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
        setup: {
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

    正規のトップレベル DM キーとレガシーのネストされたキーの両方を受け入れるチャンネルでは、`plugin-sdk/channel-config-helpers` のヘルパーを使用してください。`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom`、`normalizeChannelDmPolicy` は、アカウントローカル値を継承された root 値より優先します。同じ resolver を `normalizeLegacyDmAliases` による doctor repair と組み合わせることで、runtime と migration が同じ契約を読み取るようにします。

    <Accordion title="createChatChannelPlugin が行うこと">
      低レベルの adapter インターフェイスを手動で実装する代わりに、
      宣言的なオプションを渡すと、builder がそれらを合成します。

      | オプション | 配線される内容 |
      | --- | --- |
      | `security.dm` | config フィールドからのスコープ付き DM security resolver |
      | `pairing.text` | コード交換を伴うテキストベースの DM pairing flow |
      | `threading` | Reply-to-mode resolver（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | result metadata（message IDs）を返す send 関数 |

      完全な制御が必要な場合は、宣言的なオプションの代わりに
      raw adapter オブジェクトを渡すこともできます。

      Raw outbound adapters は `chunker(text, limit, ctx)` 関数を定義できます。
      任意の `ctx.formatting` には、`maxLinesPerMessage` などの配信時の formatting 判断が含まれます。
      共有アウトバウンド配信によって reply threading と chunk boundaries が一度だけ解決されるように、
      送信前に適用してください。
      send contexts には、ネイティブ reply target が解決された場合に
      `replyToIdSource`（`implicit` または `explicit`）も含まれるため、
      payload helpers は implicit な単回使用 reply slot を消費せずに
      明示的な reply tags を保持できます。
    </Accordion>

  </Step>

  <Step title="エントリーポイントを配線する">
    `index.ts` を作成します。

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

    チャネル所有の CLI 記述子は `registerCliMetadata(...)` に置くことで、OpenClaw が完全なチャネルランタイムを有効化せずにルートヘルプへ表示できるようにしつつ、通常の完全ロードでも実際のコマンド登録用に同じ記述子を取得できるようにします。ランタイム専用の作業には `registerFull(...)` を使い続けてください。
    `registerFull(...)` が gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックスを使います。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、常に `operator.admin` に解決されます。
    `defineChannelPluginEntry` は登録モードの分割を自動的に処理します。すべてのオプションについては
    [エントリポイント](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="セットアップエントリを追加する">
    オンボーディング中の軽量ロード用に `setup-entry.ts` を作成します。

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    チャネルが無効または未設定の場合、OpenClaw は完全なエントリの代わりにこれをロードします。これにより、セットアップフロー中に重いランタイムコードを読み込むことを避けられます。
    詳細は [セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップ安全なエクスポートをサイドカーモジュールに分割するバンドル済みワークスペースチャネルは、明示的なセットアップ時ランタイムセッターも必要な場合に、`openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。

  </Step>

  <Step title="受信メッセージを処理する">
    Plugin はプラットフォームからメッセージを受信し、それを OpenClaw に転送する必要があります。典型的なパターンは、リクエストを検証し、チャネルの受信ハンドラー経由でディスパッチする Webhook です。

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
      受信メッセージ処理はチャネル固有です。各チャネル Plugin は
      独自の受信パイプラインを所有します。実際のパターンについては、バンドル済みチャネル Plugin
      （たとえば Microsoft Teams または Google Chat の Plugin パッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テストする">
`src/channel.test.ts` に同じ場所のテストを書きます。

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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    共有テストヘルパーについては、[テスト](/ja-JP/plugins/sdk-testing) を参照してください。

</Step>
</Steps>

## ファイル構造

```
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
  <Card title="スレッド化オプション" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、またはカスタム返信モード
  </Card>
  <Card title="メッセージツール統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool とアクション検出
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime 経由の TTS、STT、メディア、サブエージェント
  </Card>
  <Card title="チャネル受信 API" icon="bolt" href="/ja-JP/plugins/sdk-channel-inbound">
    共有受信イベントライフサイクル: 取り込み、解決、記録、ディスパッチ、ファイナライズ
  </Card>
</CardGroup>

<Note>
一部のバンドル済みヘルパーシームは、バンドル済み Plugin の保守と互換性のためにまだ存在します。新しいチャネル Plugin には推奨パターンではありません。そのバンドル済み Plugin ファミリーを直接保守している場合を除き、共通 SDK サーフェスの汎用チャネル、セットアップ、返信、ランタイムのサブパスを優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) - Plugin がモデルも提供する場合
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [SDK テスト](/ja-JP/plugins/sdk-testing) - テストユーティリティとコントラクトテスト
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - 完全なマニフェストスキーマ

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
