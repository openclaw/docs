---
read_when:
    - 新しいメッセージングチャネルのPluginを構築しています
    - OpenClaw をメッセージングプラットフォームに接続したい
    - ChannelPlugin アダプターのインターフェイスを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングチャネルPluginの構築手順ガイド
title: チャネルPluginの構築
x-i18n:
    generated_at: "2026-05-10T19:45:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw をメッセージングプラットフォームに接続するチャンネル Plugin の構築手順を説明します。最後まで進めると、DM セキュリティ、ペアリング、返信スレッド化、アウトバウンドメッセージングを備えた動作するチャンネルが完成します。

<Info>
  OpenClaw Plugin をまだ構築したことがない場合は、基本的なパッケージ構造とマニフェスト設定について、まず
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

## チャンネル Plugin の仕組み

チャンネル Plugin に独自の送信、編集、リアクションツールは必要ありません。OpenClaw はコア内で共有の `message` ツールを 1 つ保持します。Plugin が所有するものは次のとおりです。

- **設定** - アカウント解決とセットアップウィザード
- **セキュリティ** - DM ポリシーと許可リスト
- **ペアリング** - DM 承認フロー
- **セッション文法** - プロバイダー固有の会話 ID をベースチャット、スレッド ID、親フォールバックへマッピングする方法
- **アウトバウンド** - テキスト、メディア、投票をプラットフォームへ送信
- **スレッド化** - 返信をスレッド化する方法
- **Heartbeat 入力中表示** - Heartbeat 配信ターゲット向けの任意の入力中/ビジーシグナル

コアは、共有メッセージツール、プロンプト配線、外側のセッションキー形状、汎用の `:thread:` 記録管理、ディスパッチを所有します。

新しいチャンネル Plugin は、`openclaw/plugin-sdk/channel-message` の `defineChannelMessageAdapter` で `message` アダプターも公開する必要があります。このアダプターは、ネイティブトランスポートが実際にサポートする耐久的な最終送信機能を宣言し、テキスト/メディア送信を従来の `outbound` アダプターと同じトランスポート関数へ向けます。ネイティブ側の副作用と返されるレシートを契約テストで証明できる場合にのみ、機能を宣言してください。
完全な API 契約、例、機能マトリクス、レシートルール、ライブプレビュー最終化、受信 ack ポリシー、テスト、移行表については、[チャンネルメッセージ API](/ja-JP/plugins/sdk-channel-message) を参照してください。
既存の `outbound` アダプターに適切な送信メソッドと機能メタデータがすでにある場合は、別のブリッジを手書きする代わりに `createChannelMessageAdapterFromOutbound(...)` を使用して `message` アダプターを派生させてください。
アダプター送信は `MessageReceipt` 値を返す必要があります。互換性コードでまだ従来の ID が必要な場合は、新しいライフサイクルコードで並列の `messageIds` フィールドを保持する代わりに、`listMessageReceiptPlatformIds(...)` または `resolveMessageReceiptPrimaryId(...)` で派生させてください。
プレビュー対応チャンネルは、`draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming`、`quietFinalization` など、所有する正確なライブライフサイクルを `message.live.capabilities` でも宣言する必要があります。ドラフトプレビューをその場で最終化するチャンネルは、`finalEdit`、`normalFallback`、`discardPending`、`previewReceipt`、`retainOnAmbiguousFailure` などを `message.live.finalizer.capabilities` でも宣言し、ランタイムロジックを `defineFinalizableLivePreviewAdapter(...)` と `deliverWithFinalizableLivePreviewAdapter(...)` 経由でルーティングする必要があります。これらの機能は `verifyChannelMessageLiveCapabilityAdapterProofs(...)` と `verifyChannelMessageLiveFinalizerProofs(...)` のテストで裏付け、ネイティブプレビュー、進行状況、編集、フォールバック/保持、クリーンアップ、レシート動作が静かにずれないようにしてください。
プラットフォーム確認応答を遅延するインバウンド受信側は、ack タイミングをモニター固有の状態に隠すのではなく、`message.receive.defaultAckPolicy` と `supportedAckPolicies` を宣言する必要があります。宣言した各ポリシーを `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` でカバーしてください。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply` などの従来の返信/ターンヘルパーは、互換性ディスパッチャー向けに引き続き利用できます。新しいチャンネルコードではこれらの名前を使用しないでください。新しい Plugin は、`openclaw/plugin-sdk/channel-message` 上の `message` アダプター、レシート、受信/送信ライフサイクルヘルパーから始める必要があります。

インバウンド認可を移行するチャンネルは、ランタイム受信パスから実験的な `openclaw/plugin-sdk/channel-ingress-runtime` サブパスを使用できます。このサブパスは、プラットフォーム検索と副作用を Plugin 内に保持しながら、許可リスト状態の解決、ルート/送信者/コマンド/イベント/アクティベーションの判断、編集済み診断、ターン受け入れマッピングを共有します。Plugin の ID 正規化はリゾルバーに渡す記述子内に保持してください。解決済み状態や判断から生のマッチ値をシリアライズしないでください。API 設計、所有境界、テスト期待値については、[チャンネル ingress API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。

チャンネルがインバウンド返信以外で入力中インジケーターをサポートする場合は、チャンネル Plugin で `heartbeat.sendTyping(...)` を公開してください。コアは Heartbeat モデル実行の開始前に、解決済み Heartbeat 配信ターゲットを指定してこれを呼び出し、共有の入力中 keepalive/cleanup ライフサイクルを使用します。プラットフォームが明示的な停止シグナルを必要とする場合は、`heartbeat.clearTyping(...)` を追加してください。

チャンネルがメディアソースを運ぶメッセージツールパラメーターを追加する場合は、それらのパラメーター名を `describeMessageTool(...).mediaSourceParams` で公開してください。コアはサンドボックスパス正規化とアウトバウンドメディアアクセスポリシーにその明示的なリストを使用するため、Plugin はプロバイダー固有のアバター、添付ファイル、カバー画像パラメーターについて共有コアの特別扱いを必要としません。
関連しないアクションが別のアクションのメディア引数を継承しないように、`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを返すことを推奨します。すべての公開アクションで意図的に共有されるパラメーターには、フラット配列も引き続き機能します。

チャンネルが `message(action="send")` に対してプロバイダー固有の整形を必要とする場合は、`actions.prepareSendPayload(...)` を優先してください。ネイティブカード、ブロック、埋め込み、その他の耐久的なデータは `payload.channelData.<channel>` の下に置き、実際の送信はコアがアウトバウンド/message アダプター経由で実行できるようにします。シリアライズして再試行できないペイロード向けの互換性フォールバックとしてのみ、送信に `actions.handleAction(...)` を使用してください。

プラットフォームが会話 ID 内に追加のスコープを保存する場合、その解析は `messaging.resolveSessionConversation(...)` を使って Plugin 内に保持してください。これは、`rawId` をベース会話 ID、任意のスレッド ID、明示的な `baseConversationId`、および任意の `parentConversationCandidates` へマッピングするための正規フックです。
`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/ベース会話へ向けて並べてください。

Plugin コードがルートのようなフィールドを正規化する、子スレッドを親ルートと比較する、または `{ channel, to, accountId, threadId }` から安定した重複排除キーを構築する必要がある場合は、`openclaw/plugin-sdk/channel-route` を使用してください。このヘルパーは数値スレッド ID をコアと同じ方法で正規化するため、Plugin はアドホックな `String(threadId)` 比較よりもこれを優先する必要があります。
プロバイダー固有のターゲット文法を持つ Plugin は、パーサーを `resolveChannelRouteTargetWithParser(...)` に注入しながら、コアが使用するものと同じルートターゲット形状とスレッドフォールバックセマンティクスを得られます。

チャンネルレジストリの起動前に同じ解析を必要とするバンドル Plugin は、一致する `resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルも公開できます。コアは、ランタイム Plugin レジストリがまだ利用できない場合にのみ、このブートストラップセーフなサーフェスを使用します。

`messaging.resolveParentConversationCandidates(...)` は、Plugin が汎用/生 ID の上に親フォールバックだけを必要とする場合の従来の互換性フォールバックとして引き続き利用できます。両方のフックが存在する場合、コアはまず `resolveSessionConversation(...).parentConversationCandidates` を使用し、正規フックがそれらを省略した場合にのみ `resolveParentConversationCandidates(...)` にフォールバックします。

## 承認とチャンネル機能

ほとんどのチャンネル Plugin には、承認固有のコードは必要ありません。

- コアは、同一チャットの `/approve`、共有承認ボタンペイロード、汎用フォールバック配信を所有します。
- チャネルに承認固有の挙動が必要な場合は、チャネル Plugin 上の単一の `approvalCapability` オブジェクトを優先してください。
- `ChannelPlugin.approvals` は削除されました。承認の配信、ネイティブ、レンダー、認証の情報は `approvalCapability` に置いてください。
- `plugin.auth` はログイン/ログアウト専用です。コアは、そのオブジェクトから承認認証フックを読み取らなくなりました。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` は、正規の承認認証シームです。
- 同一チャット承認の認証可用性には `approvalCapability.getActionAvailabilityState` を使用してください。
- チャネルがネイティブ exec 承認を公開する場合、開始サーフェス/ネイティブクライアント状態が同一チャット承認認証と異なるときは、`approvalCapability.getExecInitiatingSurfaceState` を使用してください。コアはその exec 固有フックを使用して、`enabled` と `disabled` を区別し、開始チャネルがネイティブ exec 承認をサポートするかどうかを判断し、ネイティブクライアントのフォールバック案内にそのチャネルを含めます。`createApproverRestrictedNativeApprovalCapability(...)` は一般的なケースについてこれを補完します。
- 重複するローカル承認プロンプトを隠したり、配信前にタイピングインジケーターを送信したりするような、チャネル固有のペイロードライフサイクル挙動には、`outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使用してください。
- `approvalCapability.delivery` は、ネイティブ承認ルーティングまたはフォールバック抑制にのみ使用してください。
- チャネル所有のネイティブ承認情報には `approvalCapability.nativeRuntime` を使用してください。ホットなチャネルエントリポイントでは `createLazyChannelApprovalNativeRuntimeAdapter(...)` で遅延化してください。これは、コアが承認ライフサイクルを組み立てられる状態を保ちながら、必要に応じてランタイムモジュールを import できます。
- `approvalCapability.render` は、共有レンダラーではなくカスタム承認ペイロードが本当に必要なチャネルでのみ使用してください。
- チャネルが、ネイティブ exec 承認を有効化するために必要な正確な設定ノブを disabled パスの返信で説明したい場合は、`approvalCapability.describeExecApprovalSetup` を使用してください。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントのチャネルは、トップレベルのデフォルトではなく、`channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープのパスをレンダーする必要があります。
- チャネルが既存設定から安定した所有者風の DM ID を推測できる場合は、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使用して、承認固有のコアロジックを追加せずに同一チャットの `/approve` を制限してください。
- チャネルにネイティブ承認配信が必要な場合、チャネルコードはターゲット正規化とトランスポート/表示情報に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使用してください。チャネル固有の情報は `approvalCapability.nativeRuntime` の背後に置き、できれば `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` 経由にしてください。そうすれば、コアがハンドラーを組み立て、リクエストフィルタリング、ルーティング、重複排除、期限切れ、Gateway サブスクリプション、別経路ルーティング通知を所有できます。`nativeRuntime` は、いくつかの小さなシームに分割されています。
- `createChannelNativeOriginTargetResolver` は、デフォルトで `{ to, accountId, threadId }` ターゲット向けの共有チャネルルートマッチャーを使用します。Slack のタイムスタンププレフィックス照合のように、チャネルにプロバイダー固有の等価性ルールがある場合にのみ `targetsMatch` を渡してください。
- デフォルトのルートマッチャーまたはカスタム `targetsMatch` コールバックが実行される前に、チャネルがプロバイダー ID を正規化する必要があり、かつ配信用には元のターゲットを保持したい場合は、`createChannelNativeOriginTargetResolver` に `normalizeTargetForMatch` を渡してください。解決済みの配信ターゲット自体を正規化すべき場合にのみ `normalizeTarget` を使用してください。
- `availability` - アカウントが設定済みかどうか、およびリクエストを処理すべきかどうか
- `presentation` - 共有承認ビューモデルを、保留中/解決済み/期限切れのネイティブペイロードまたは最終アクションにマップします
- `transport` - ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除します
- `interactions` - ネイティブボタンまたはリアクション用の任意のバインド/バインド解除/アクション消去フック
- `observe` - 任意の配信診断フック
- チャネルにクライアント、トークン、Bolt アプリ、Webhook レシーバーなどのランタイム所有オブジェクトが必要な場合は、`openclaw/plugin-sdk/channel-runtime-context` 経由で登録してください。汎用ランタイムコンテキストレジストリにより、コアは承認固有のラッパー接着コードを追加せずに、チャネル起動状態から capability 駆動のハンドラーをブートストラップできます。
- 低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` に手を伸ばすのは、capability 駆動のシームでまだ十分に表現できない場合だけにしてください。
- ネイティブ承認チャネルは、これらのヘルパーを通じて `accountId` と `approvalKind` の両方をルーティングする必要があります。`accountId` はマルチアカウント承認ポリシーを正しい bot アカウントにスコープし、`approvalKind` はコアにハードコードされた分岐を置かずに exec と Plugin 承認の挙動をチャネルで利用可能にします。
- コアは承認の再ルーティング通知も所有するようになりました。チャネル Plugin は、`createChannelNativeApprovalRuntime` から独自の「承認は DM / 別のチャネルに送られました」というフォローアップメッセージを送信しないでください。代わりに、共有承認 capability ヘルパーを通じて正確な発信元 + 承認者 DM ルーティングを公開し、開始チャットへ通知を投稿する前に、コアが実際の配信を集約できるようにしてください。
- 配信された承認 ID の種類をエンドツーエンドで保持してください。ネイティブクライアントは、チャネルローカル状態から exec と Plugin 承認ルーティングを推測したり書き換えたりしてはいけません。
- 異なる承認の種類は、意図的に異なるネイティブサーフェスを公開できます。
  現在の同梱例:
  - Slack は exec と Plugin ID の両方でネイティブ承認ルーティングを利用可能にしています。
  - Matrix は exec と Plugin 承認で同じネイティブ DM/チャネルルーティングとリアクション UX を維持しつつ、承認の種類ごとに認証を変えられるようにしています。
- `createApproverRestrictedNativeApprovalAdapter` は互換ラッパーとして引き続き存在しますが、新しいコードでは capability ビルダーを優先し、Plugin 上で `approvalCapability` を公開してください。

ホットなチャネルエントリポイントでは、そのファミリーの一部だけが必要な場合、より狭いランタイムサブパスを優先してください。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広い包括サーフェスが不要な場合は、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking` を優先してください。

セットアップについては特に:

- `openclaw/plugin-sdk/setup-runtime` は、ランタイムセーフなセットアップヘルパーをカバーします:
  import セーフなセットアップパッチアダプター (`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`)、lookup-note 出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委譲された
  setup-proxy ビルダー
- `openclaw/plugin-sdk/setup-runtime` には、
  `createEnvPatchedAccountSetupAdapter` 向けの env 対応アダプターシームが含まれます
- `openclaw/plugin-sdk/channel-setup` は、optional-install セットアップ
  ビルダーに加え、いくつかのセットアップセーフなプリミティブをカバーします:
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

チャネルが env 駆動のセットアップまたは認証をサポートし、汎用の起動/設定フローがランタイム読み込み前にそれらの env 名を知る必要がある場合は、Plugin マニフェストで `channelEnvVars` を宣言してください。チャネルランタイムの `envVars` またはローカル定数は、運用者向けコピー専用に保ってください。

チャネルが Plugin ランタイム開始前に `status`、`channels list`、`channels status`、または SecretRef スキャンに現れる可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加してください。そのエントリポイントは読み取り専用コマンドパスで安全に import できる必要があり、それらのサマリーに必要なチャネルメタデータ、セットアップセーフな設定アダプター、ステータスアダプター、チャネルシークレットターゲットメタデータを返す必要があります。セットアップエントリからクライアント、リスナー、トランスポートランタイムを開始しないでください。

メインのチャネルエントリ import パスも狭く保ってください。Discovery はチャネルを有効化せずに、エントリとチャネル Plugin モジュールを評価して capability を登録できます。`channel-plugin-api.ts` のようなファイルは、セットアップ ウィザード、トランスポートクライアント、ソケットリスナー、サブプロセスランチャー、サービス起動モジュールを import せずに、チャネル Plugin オブジェクトを export する必要があります。これらのランタイム部品は、`registerFull(...)`、ランタイム setter、または遅延 capability アダプターから読み込まれるモジュールに置いてください。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および
`splitSetupEntries`

- `moveSingleAccountChannelSectionToDefaultAccount(...)` のような、より重い共有セットアップ/設定ヘルパーも必要な場合にのみ、より広い `openclaw/plugin-sdk/setup` シームを使用してください

チャネルがセットアップサーフェスで「まずこの Plugin をインストールしてください」と案内するだけでよい場合は、`createOptionalChannelSetupSurface(...)` を優先してください。生成されたアダプター/ウィザードは設定書き込みと finalize で fail closed し、検証、finalize、docs-link コピー全体で同じインストール必須メッセージを再利用します。

その他のホットなチャネルパスでは、より広いレガシーサーフェスよりも狭いヘルパーを優先してください。

- マルチアカウント設定とデフォルトアカウントフォールバックには
  `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers`
- インバウンドルート/エンベロープと記録してディスパッチする配線には
  `openclaw/plugin-sdk/inbound-envelope` と
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- ターゲット解析/照合には `openclaw/plugin-sdk/messaging-targets`
- メディア読み込みに加え、アウトバウンド ID/送信 delegate とペイロード計画には
  `openclaw/plugin-sdk/outbound-media` と
  `openclaw/plugin-sdk/outbound-runtime`
- ベースセッションキーがまだ一致した後に、アウトバウンドルートが明示的な `replyToId`/`threadId` を保持する、または現在の `:thread:` セッションを復元する必要がある場合は、
  `openclaw/plugin-sdk/channel-core` の `buildThreadAwareOutboundSessionRoute(...)`。
  Provider Plugin は、プラットフォームにネイティブスレッド配信セマンティクスがある場合、優先順位、サフィックス挙動、スレッド ID 正規化を上書きできます。
- スレッドバインディングのライフサイクルとアダプター登録には
  `openclaw/plugin-sdk/thread-bindings-runtime`
- レガシー agent/media ペイロードフィールドレイアウトがまだ必要な場合にのみ
  `openclaw/plugin-sdk/agent-media-payload`
- Telegram カスタムコマンドの正規化、重複/競合検証、およびフォールバック安定なコマンド設定契約には
  `openclaw/plugin-sdk/telegram-command-config`

認証専用チャネルは通常、デフォルトパスで止められます。コアが承認を処理し、Plugin はアウトバウンド/認証 capability を公開するだけです。Matrix、Slack、Telegram、カスタムチャットトランスポートのようなネイティブ承認チャネルは、独自の承認ライフサイクルを実装するのではなく、共有ネイティブヘルパーを使用してください。

## インバウンドメンションポリシー

インバウンドメンション処理は、2 つのレイヤーに分けて保ってください。

- Plugin 所有の証拠収集
- 共有ポリシー評価

メンションポリシーの判断には `openclaw/plugin-sdk/channel-mention-gating` を使用してください。
より広いインバウンドヘルパーバレルが必要な場合にのみ `openclaw/plugin-sdk/channel-inbound` を使用してください。

Plugin ローカルロジックに適したもの:

- bot への返信検出
- 引用された bot の検出
- スレッド参加チェック
- サービス/システムメッセージの除外
- bot 参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適したもの:

- `requireMention`
- 明示的なメンション結果
- 暗黙的メンション許可リスト
- コマンドのバイパス
- 最終的なスキップ判定

推奨フロー:

1. ローカルのメンション事実を計算します。
2. それらの事実を `resolveInboundMentionDecision({ facts, policy })` に渡します。
3. 受信ゲートで `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip` を使用します。

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

`api.runtime.channel.mentions` は、すでにランタイム注入に依存している
同梱チャネル Plugin 向けに、同じ共有メンションヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と
`resolveInboundMentionDecision` だけが必要な場合は、
関係のない受信ランタイムヘルパーの読み込みを避けるため、
`openclaw/plugin-sdk/channel-mention-gating` からインポートします。

古い `resolveMentionGating*` ヘルパーは、互換性エクスポートとしてのみ
`openclaw/plugin-sdk/channel-inbound` に残っています。新しいコードでは
`resolveInboundMentionDecision({ facts, policy })` を使用してください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準の Plugin ファイルを作成します。`package.json` の `channel` フィールドにより、
    これがチャネル Plugin になります。パッケージメタデータの全体的なサーフェスについては、
    [Plugin のセットアップと設定](/ja-JP/plugins/sdk-setup#openclaw-channel) を参照してください。

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

    `configSchema` は `plugins.entries.acme-chat.config` を検証します。チャネルアカウント設定ではない、
    Plugin 所有の設定に使用してください。`channelConfigs` は `channels.acme-chat` を検証し、
    Plugin ランタイムが読み込まれる前に設定スキーマ、セットアップ、UI サーフェスで使用される
    コールドパスのソースです。

  </Step>

  <Step title="チャネル Plugin オブジェクトを構築する">
    `ChannelPlugin` インターフェイスには、多くの任意アダプターサーフェスがあります。まずは
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

    正規のトップレベル DM キーと従来のネストされたキーの両方を受け付けるチャネルでは、`plugin-sdk/channel-config-helpers` のヘルパーを使用します。`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom`、`normalizeChannelDmPolicy` は、アカウントローカルの値を継承されたルート値より優先します。同じリゾルバーを `normalizeLegacyDmAliases` による doctor 修復と組み合わせることで、ランタイムと移行が同じコントラクトを読み取るようにします。

    <Accordion title="createChatChannelPlugin が行うこと">
      低レベルのアダプターインターフェイスを手動で実装する代わりに、
      宣言的なオプションを渡すと、ビルダーがそれらを合成します。

      | オプション | 配線される内容 |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付き DM セキュリティリゾルバー |
      | `pairing.text` | コード交換を伴うテキストベースの DM ペアリングフロー |
      | `threading` | 返信先モードリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージ ID）を返す送信関数 |

      完全な制御が必要な場合は、宣言的オプションの代わりに
      生のアダプターオブジェクトを渡すこともできます。

      生の送信アダプターは `chunker(text, limit, ctx)` 関数を定義できます。
      任意の `ctx.formatting` には、`maxLinesPerMessage` などの配信時のフォーマット判断が含まれます。
      送信前に適用することで、返信スレッド化とチャンク境界が共有送信配信によって一度だけ解決されます。
      送信コンテキストには、ネイティブの返信先が解決された場合に
      `replyToIdSource`（`implicit` または `explicit`）も含まれるため、ペイロードヘルパーは
      暗黙的な単回使用の返信スロットを消費せずに、明示的な返信タグを保持できます。
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

    チャネル所有の CLI ディスクリプターは `registerCliMetadata(...)` に配置します。これにより OpenClaw は、
    完全なチャネルランタイムを有効化せずにルートヘルプでそれらを表示でき、
    通常の完全読み込みでも実際のコマンド登録に同じディスクリプターが使用されます。
    ランタイム専用の処理には `registerFull(...)` を使用してください。
    `registerFull(...)` が Gateway RPC メソッドを登録する場合は、
    Plugin 固有のプレフィックスを使用します。コア管理名前空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）は予約済みのままで、常に
    `operator.admin` に解決されます。
    `defineChannelPluginEntry` は登録モードの分割を自動的に処理します。すべての
    オプションについては [エントリーポイント](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="セットアップエントリーを追加する">
    オンボーディング中の軽量読み込み用に `setup-entry.ts` を作成します。

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    チャネルが無効または未設定の場合、OpenClaw は完全エントリーの代わりにこれを読み込みます。
    これにより、セットアップフロー中に重いランタイムコードを読み込まずに済みます。
    詳細は [セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップセーフなエクスポートをサイドカーモジュールに分割する同梱ワークスペースチャネルは、
    明示的なセットアップ時ランタイムセッターも必要な場合に、
    `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。

  </Step>

  <Step title="受信メッセージを処理する">
    Plugin はプラットフォームからメッセージを受信し、それを OpenClaw に転送する必要があります。
    一般的なパターンは、リクエストを検証し、チャネルの受信ハンドラーを通じて
    ディスパッチする Webhook です。

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
      受信メッセージの処理はチャネルごとに異なります。各チャネル Plugin が
      独自の受信パイプラインを所有します。実際のパターンについては、バンドル済みのチャネル Plugin
      （たとえば Microsoft Teams または Google Chat Plugin パッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` にコロケートされたテストを記述します。

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

    共有テストヘルパーについては、[テスト](/ja-JP/plugins/sdk-testing)を参照してください。

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
    固定、アカウントスコープ、またはカスタムの返信モード
  </Card>
  <Card title="メッセージツール統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool とアクション検出
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    TTS、STT、メディア、api.runtime 経由のサブエージェント
  </Card>
  <Card title="チャネルターンカーネル" icon="bolt" href="/ja-JP/plugins/sdk-channel-turn">
    共有受信ターンライフサイクル: ingest、resolve、record、dispatch、finalize
  </Card>
</CardGroup>

<Note>
一部のバンドル済みヘルパー境界は、バンドル済み Plugin のメンテナンスと
互換性のためにまだ存在します。新しいチャネル Plugin で推奨されるパターンではありません。
そのバンドル済み Plugin ファミリーを直接メンテナンスしている場合を除き、
共通 SDK サーフェスの汎用 channel/setup/reply/runtime サブパスを優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) - Plugin がモデルも提供する場合
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [SDK テスト](/ja-JP/plugins/sdk-testing) - テストユーティリティと契約テスト
- [Plugin Manifest](/ja-JP/plugins/manifest) - 完全なマニフェストスキーマ

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
