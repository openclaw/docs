---
read_when:
    - 新しいメッセージングチャネル Plugin を構築している
    - OpenClaw をメッセージングプラットフォームに接続したい
    - ChannelPlugin アダプターサーフェスを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw 向けメッセージングチャネル Plugin を構築するためのステップバイステップガイド
title: チャンネルPluginの構築
x-i18n:
    generated_at: "2026-06-27T12:31:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw をメッセージングプラットフォームに接続するチャンネル Plugin の構築手順を説明します。最後まで進めると、DM セキュリティ、ペアリング、返信スレッド化、送信メッセージングを備えた動作するチャンネルが完成します。

<Info>
  まだ OpenClaw Plugin を構築したことがない場合は、基本的なパッケージ構造とマニフェスト設定について、先に
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

## チャンネル Plugin の仕組み

チャンネル Plugin は、独自の送信/編集/リアクションツールを持つ必要はありません。OpenClaw はコア内で 1 つの共有 `message` ツールを保持します。Plugin が担当するのは次の項目です。

- **設定** - アカウント解決とセットアップウィザード
- **セキュリティ** - DM ポリシーと許可リスト
- **ペアリング** - DM 承認フロー
- **セッション文法** - プロバイダー固有の会話 ID をベースチャット、スレッド ID、親フォールバックに対応付ける方法
- **送信** - プラットフォームへのテキスト、メディア、投票の送信
- **スレッド化** - 返信をスレッド化する方法
- **Heartbeat 入力中表示** - Heartbeat 配信ターゲット向けの任意の入力中/ビジーシグナル

コアは、共有 message ツール、プロンプトの配線、外側のセッションキー形状、汎用 `:thread:` 記録管理、ディスパッチを担当します。

新しいチャンネル Plugin は、`openclaw/plugin-sdk/channel-outbound` の
`defineChannelMessageAdapter` を使って `message` アダプターも公開する必要があります。このアダプターは、ネイティブトランスポートが実際にサポートする永続的な最終送信機能を宣言し、テキスト/メディア送信をレガシー `outbound` アダプターと同じトランスポート関数に向けます。ネイティブ側の副作用と返される受領証を契約テストで証明できる場合にのみ、機能を宣言してください。
完全な API 契約、例、機能マトリクス、受領証ルール、ライブプレビューの確定、受信 ack ポリシー、テスト、移行表については、
[チャンネル送信 API](/ja-JP/plugins/sdk-channel-outbound) を参照してください。
既存の `outbound` アダプターに適切な送信メソッドと機能メタデータがすでにある場合は、別のブリッジを手書きする代わりに `createChannelMessageAdapterFromOutbound(...)` を使って `message` アダプターを派生させてください。
アダプター送信は `MessageReceipt` 値を返す必要があります。互換コードでまだレガシー ID が必要な場合は、新しいライフサイクルコードで並列の
`messageIds` フィールドを保持するのではなく、`listMessageReceiptPlatformIds(...)`
または `resolveMessageReceiptPrimaryId(...)` で派生させてください。
プレビュー対応チャンネルは、所有する正確なライブライフサイクルに応じて、`draftPreview`、
`previewFinalization`、`progressUpdates`、`nativeStreaming`、`quietFinalization` などを含む `message.live.capabilities` も宣言する必要があります。ドラフトプレビューをその場で確定するチャンネルは、
`finalEdit`、`normalFallback`、`discardPending`、`previewReceipt`、
`retainOnAmbiguousFailure` などの `message.live.finalizer.capabilities` も宣言し、ランタイムロジックを
`defineFinalizableLivePreviewAdapter(...)` と
`deliverWithFinalizableLivePreviewAdapter(...)` 経由でルーティングする必要があります。これらの機能は、`verifyChannelMessageLiveCapabilityAdapterProofs(...)` と
`verifyChannelMessageLiveFinalizerProofs(...)` のテストで裏付け、ネイティブプレビュー、進捗、編集、フォールバック/保持、クリーンアップ、受領証の挙動が静かにずれないようにしてください。
プラットフォーム確認応答を遅延する受信レシーバーは、ack タイミングをモニター固有の状態に隠すのではなく、
`message.receive.defaultAckPolicy` と `supportedAckPolicies` を宣言する必要があります。宣言したすべてのポリシーを
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` でカバーしてください。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`
などのレガシー返信ヘルパーは、互換ディスパッチャー向けに引き続き利用できます。新しいチャンネルコードではこれらの名前を使用しないでください。新しい Plugin は、`openclaw/plugin-sdk/channel-outbound` の `message` アダプター、受領証、受信/送信ライフサイクルヘルパーから始める必要があります。

受信認可を移行するチャンネルは、ランタイム受信パスから実験的な
`openclaw/plugin-sdk/channel-ingress-runtime` サブパスを使用できます。このサブパスは、プラットフォーム検索と副作用を Plugin 内に保持しながら、許可リスト状態の解決、ルート/送信者/コマンド/イベント/アクティベーションの判断、編集済み診断、ターン受け入れマッピングを共有します。Plugin ID の正規化は、リゾルバーに渡す記述子内に保持してください。解決済み状態や判断から生のマッチ値をシリアライズしないでください。API 設計、所有権境界、テスト期待値については、
[チャンネル受信 API](/ja-JP/plugins/sdk-channel-ingress) を参照してください。

チャンネルが受信返信の外で入力中インジケーターをサポートする場合は、チャンネル Plugin で
`heartbeat.sendTyping(...)` を公開してください。コアは、Heartbeat モデル実行が開始する前に解決済みの Heartbeat 配信ターゲットを指定してこれを呼び出し、共有の入力中 keepalive/クリーンアップライフサイクルを使用します。プラットフォームで明示的な停止シグナルが必要な場合は、`heartbeat.clearTyping(...)`
を追加してください。

チャンネルがメディアソースを運ぶ message ツールパラメーターを追加する場合は、それらのパラメーター名を
`describeMessageTool(...).mediaSourceParams` で公開してください。コアはその明示的なリストをサンドボックスパス正規化と送信メディアアクセス方針に使用するため、Plugin はプロバイダー固有のアバター、添付ファイル、カバー画像パラメーターのために共有コアの特別扱いを必要としません。
無関係なアクションが別のアクションのメディア引数を継承しないように、
`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを返すことを推奨します。公開されるすべてのアクションで意図的に共有されるパラメーターには、フラットな配列も引き続き使用できます。
プラットフォーム側のメディア取得のために一時的な公開 URL を公開する必要があるチャンネルは、Plugin 状態ストアとともに
`openclaw/plugin-sdk/outbound-media` の `createHostedOutboundMediaStore(...)` を使用できます。プラットフォームルートの解析とトークン強制はチャンネル Plugin 内に保持してください。共有ヘルパーが担当するのは、メディア読み込み、有効期限メタデータ、チャンク行、クリーンアップだけです。

チャンネルが `message(action="send")` に対してプロバイダー固有の整形を必要とする場合は、
`actions.prepareSendPayload(...)` を優先してください。ネイティブカード、ブロック、埋め込み、その他の永続データは
`payload.channelData.<channel>` の下に置き、実際の送信はコアに outbound/message アダプター経由で実行させます。シリアライズして再試行できないペイロードの互換フォールバックとしてのみ、送信に
`actions.handleAction(...)` を使用してください。

プラットフォームが会話 ID の中に追加スコープを保存する場合は、その解析を Plugin 内で
`messaging.resolveSessionConversation(...)` を使って保持してください。これは、`rawId` をベース会話 ID、任意のスレッド ID、明示的な `baseConversationId`、任意の `parentConversationCandidates` に対応付けるための正規フックです。
`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/ベース会話の順に並べてください。

Plugin コードがルートのようなフィールドを正規化したり、子スレッドをその親ルートと比較したり、`{ channel, to, accountId, threadId }` から安定した重複排除キーを構築したりする必要がある場合は、`openclaw/plugin-sdk/channel-route` を使用してください。このヘルパーは、コアと同じ方法で数値スレッド ID を正規化するため、Plugin はアドホックな `String(threadId)` 比較よりもこれを優先する必要があります。
プロバイダー固有のターゲット文法を持つ Plugin は、
`messaging.resolveOutboundSessionRoute(...)` を公開し、コアがパーサーシムを使わずにプロバイダーネイティブなセッションとスレッド ID を取得できるようにしてください。

チャンネルレジストリが起動する前に同じ解析を必要とするバンドル済み Plugin は、一致する
`resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルも公開できます。コアは、ランタイム Plugin レジストリがまだ利用できない場合にのみ、このブートストラップ安全な面を使用します。

`messaging.resolveParentConversationCandidates(...)` は、Plugin が汎用/生 ID の上に親フォールバックだけを必要とする場合のレガシー互換フォールバックとして引き続き利用できます。両方のフックが存在する場合、コアはまず
`resolveSessionConversation(...).parentConversationCandidates` を使用し、正規フックがそれらを省略した場合にのみ
`resolveParentConversationCandidates(...)` にフォールバックします。

## 承認とチャンネル機能

ほとんどのチャンネル Plugin は、承認固有のコードを必要としません。

- コアは、同一チャットの `/approve`、共有承認ボタンペイロード、汎用フォールバック配信を所有します。
- チャネルに承認固有の動作が必要な場合は、チャネルPlugin上の単一の `approvalCapability` オブジェクトを優先してください。
- `ChannelPlugin.approvals` は削除されました。承認の配信、ネイティブ、レンダー、認証に関する事実は `approvalCapability` に置いてください。
- `plugin.auth` はログイン/ログアウト専用です。コアはそのオブジェクトから承認認証フックを読み取らなくなりました。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` は、標準の承認認証シームです。
- 同一チャット承認の認証可用性には `approvalCapability.getActionAvailabilityState` を使用してください。
- チャネルがネイティブ exec 承認を公開する場合、開始サーフェス/ネイティブクライアント状態が同一チャット承認認証と異なるときは、`approvalCapability.getExecInitiatingSurfaceState` を使用してください。コアはその exec 固有フックを使用して `enabled` と `disabled` を区別し、開始チャネルがネイティブ exec 承認に対応しているかを判断し、ネイティブクライアントのフォールバック案内にそのチャネルを含めます。`createApproverRestrictedNativeApprovalCapability(...)` は一般的なケースでこれを補完します。
- 重複するローカル承認プロンプトを隠す、配信前に入力中インジケーターを送信するなど、チャネル固有のペイロードライフサイクル動作には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使用してください。
- `approvalCapability.delivery` は、ネイティブ承認ルーティングまたはフォールバック抑制にのみ使用してください。
- チャネル所有のネイティブ承認事実には `approvalCapability.nativeRuntime` を使用してください。ホットなチャネルエントリポイントでは `createLazyChannelApprovalNativeRuntimeAdapter(...)` によって遅延化してください。これは、必要に応じてランタイムモジュールをインポートしながら、コアが承認ライフサイクルを組み立てられるようにします。
- 共有レンダラーではなくカスタム承認ペイロードが本当に必要なチャネルでのみ、`approvalCapability.render` を使用してください。
- チャネルが、ネイティブ exec 承認を有効にするために必要な正確な設定ノブを disabled パスの返信で説明したい場合は、`approvalCapability.describeExecApprovalSetup` を使用してください。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントのチャネルは、トップレベルのデフォルトではなく `channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープのパスをレンダーしてください。
- チャネルが既存設定から安定した所有者のような DM アイデンティティを推測できる場合は、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使用して、承認固有のコアロジックを追加せずに同一チャットの `/approve` を制限してください。
- カスタム承認認証が意図的に同一チャットフォールバックのみを許可する場合は、`openclaw/plugin-sdk/approval-auth-runtime` から `markImplicitSameChatApprovalAuthorization({ authorized: true })` を返してください。それ以外の場合、コアはその結果を明示的な承認者認可として扱います。
- チャネル所有のネイティブコールバックが承認を直接解決する場合は、解決前に `isImplicitSameChatApprovalAuthorization(...)` を使用してください。これにより、暗黙的フォールバックもチャネルの通常のアクター認可を通ります。
- チャネルにネイティブ承認配信が必要な場合は、チャネルコードをターゲット正規化とトランスポート/プレゼンテーション事実に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使用してください。チャネル固有の事実は `approvalCapability.nativeRuntime` の背後に置き、理想的には `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` 経由にしてください。そうすることで、コアがハンドラーを組み立て、リクエストフィルタリング、ルーティング、重複排除、有効期限、Gateway 購読、別ルート通知を所有できます。`nativeRuntime` は、いくつかの小さなシームに分割されています。
- チャネルがセッション起点のネイティブ配信と明示的な承認転送ターゲットの両方に対応する場合は、`openclaw/plugin-sdk/approval-native-runtime` の `createNativeApprovalChannelRouteGates` を使用してください。このヘルパーは、承認設定の選択、`mode` 処理、エージェント/セッションフィルター、アカウントバインディング、セッションターゲット照合、ターゲットリスト照合を集中管理します。一方で、呼び出し元は引き続きチャネル id、デフォルト転送モード、アカウント検索、トランスポート有効性チェック、ターゲット正規化、ターンソースターゲット解決を所有します。これを使ってコア所有のチャネルポリシーデフォルトを作成しないでください。チャネルの文書化済みデフォルトモードを明示的に渡してください。
- `createChannelNativeOriginTargetResolver` は、デフォルトで `{ to, accountId, threadId }` ターゲット用の共有チャネルルートマッチャーを使用します。Slack タイムスタンプ接頭辞照合のようなプロバイダー固有の等価ルールがチャネルにある場合のみ、`targetsMatch` を渡してください。
- デフォルトルートマッチャーまたはカスタム `targetsMatch` コールバックが実行される前に、チャネルがプロバイダー id を正規化する必要があり、かつ配信用には元のターゲットを保持したい場合は、`createChannelNativeOriginTargetResolver` に `normalizeTargetForMatch` を渡してください。解決済みの配信ターゲット自体を正規化すべき場合のみ、`normalizeTarget` を使用してください。
- `availability` - アカウントが設定済みか、およびリクエストを処理すべきか
- `presentation` - 共有承認ビューモデルを保留中/解決済み/期限切れのネイティブペイロードまたは最終アクションにマップします
- `transport` - ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除します
- `interactions` - ネイティブボタンまたはリアクション用の任意の bind/unbind/clear-action フックに加えて、任意の `cancelDelivered` フックです。`deliverPending` がリアクションターゲットストアなどのインプロセスまたは永続状態を登録する場合は、`cancelDelivered` を実装してください。これにより、ハンドラー停止が `bindPending` 実行前に配信をキャンセルした場合、または `bindPending` がハンドルを返さない場合に、その状態を解放できます
- `observe` - 任意の配信診断フックです
- チャネルにクライアント、トークン、Bolt app、webhook レシーバーなどのランタイム所有オブジェクトが必要な場合は、`openclaw/plugin-sdk/channel-runtime-context` 経由で登録してください。汎用ランタイムコンテキストレジストリにより、コアは承認固有のラッパー接着層を追加せずに、チャネル起動状態から capability 駆動のハンドラーをブートストラップできます。
- 低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` に手を伸ばすのは、capability 駆動のシームがまだ十分に表現力を持たない場合だけにしてください。
- ネイティブ承認チャネルは、これらのヘルパーを通じて `accountId` と `approvalKind` の両方をルーティングする必要があります。`accountId` はマルチアカウント承認ポリシーを正しい bot アカウントにスコープし、`approvalKind` はコアにハードコードされた分岐を入れずに、exec と Plugin 承認の動作をチャネルで利用可能にします。
- コアは承認の再ルート通知も所有するようになりました。チャネルPluginは、`createChannelNativeApprovalRuntime` から独自の「承認が DM / 別チャネルへ送られた」フォローアップメッセージを送信しないでください。代わりに、共有承認 capability ヘルパーを通じて正確な起点と承認者 DM ルーティングを公開し、開始チャットへ通知を投稿する前に、コアが実際の配信を集約できるようにしてください。
- 配信された承認 id 種別をエンドツーエンドで保持してください。ネイティブクライアントは、チャネルローカル状態から exec と Plugin の承認ルーティングを推測したり書き換えたりしてはいけません。
- 異なる承認種別は、意図的に異なるネイティブサーフェスを公開できます。
  現在のバンドル例:
  - Slack は、exec と Plugin id の両方でネイティブ承認ルーティングを利用可能にしています。
  - Matrix は、exec と Plugin 承認で同じネイティブ DM/チャネルルーティングとリアクション UX を維持しつつ、承認種別ごとに認証を変えられるようにしています。
- `createApproverRestrictedNativeApprovalAdapter` は互換ラッパーとしてまだ存在しますが、新しいコードでは capability ビルダーを優先し、Plugin上で `approvalCapability` を公開してください。

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

- `openclaw/plugin-sdk/setup-runtime` は、ランタイム安全なセットアップヘルパーをカバーします:
  `createSetupTranslator`、インポート安全なセットアップパッチアダプター（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note 出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委任された
  setup-proxy ビルダー
- `openclaw/plugin-sdk/setup-runtime` には、
  `createEnvPatchedAccountSetupAdapter` 用の env 対応アダプターシームが含まれます
- `openclaw/plugin-sdk/channel-setup` は、任意インストールのセットアップ
  ビルダーといくつかのセットアップ安全なプリミティブをカバーします:
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

チャネルが env 駆動のセットアップまたは認証に対応し、汎用の起動/設定フローがランタイム読み込み前にそれらの env 名を知る必要がある場合は、Pluginマニフェストで `channelEnvVars` として宣言してください。チャネルランタイムの `envVars` またはローカル定数は、オペレーター向けのコピー専用にしてください。

Pluginランタイムが開始する前に、チャネルが `status`、`channels list`、`channels status`、または SecretRef スキャンに現れる可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加してください。そのエントリポイントは読み取り専用コマンドパスで安全にインポートできる必要があり、これらのサマリーに必要なチャネルメタデータ、セットアップ安全な設定アダプター、ステータスアダプター、チャネルシークレットターゲットメタデータを返す必要があります。セットアップエントリからクライアント、リスナー、トランスポートランタイムを起動しないでください。

メインチャネルエントリのインポートパスも狭く保ってください。Discovery は、チャネルをアクティブ化せずに、エントリとチャネルPluginモジュールを評価して capability を登録できます。`channel-plugin-api.ts` のようなファイルは、セットアップウィザード、トランスポートクライアント、ソケットリスナー、サブプロセスランチャー、サービス起動モジュールをインポートせずに、チャネルPluginオブジェクトをエクスポートする必要があります。これらのランタイム部品は、`registerFull(...)`、ランタイムセッター、または遅延 capability アダプターから読み込まれるモジュールに置いてください。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および
`splitSetupEntries`

- `moveSingleAccountChannelSectionToDefaultAccount(...)` のような
  より重い共有セットアップ/設定ヘルパーも必要な場合にのみ、より広い
  `openclaw/plugin-sdk/setup` シームを使用してください

チャネルがセットアップサーフェスで「まずこのPluginをインストールする」と案内したいだけの場合は、`createOptionalChannelSetupSurface(...)` を優先してください。生成されたアダプター/ウィザードは設定書き込みと最終化で fail closed し、検証、finalize、docs-link コピー全体で同じインストール必須メッセージを再利用します。

その他のホットなチャネルパスでは、より広いレガシーサーフェスよりも狭いヘルパーを優先してください:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers`: マルチアカウント設定と
  デフォルトアカウントのフォールバック用
- `openclaw/plugin-sdk/inbound-envelope` および
  `openclaw/plugin-sdk/channel-inbound`: インバウンドルート/エンベロープと
  記録およびディスパッチの配線用
- `openclaw/plugin-sdk/channel-targets`: ターゲット解析ヘルパー用
- `openclaw/plugin-sdk/outbound-media`: メディア読み込み用、
  `openclaw/plugin-sdk/channel-outbound`: アウトバウンド ID/送信デリゲート
  およびペイロード計画用
- `openclaw/plugin-sdk/channel-core` の
  `buildThreadAwareOutboundSessionRoute(...)`: アウトバウンドルートで明示的な
  `replyToId`/`threadId` を保持する必要がある場合、またはベースセッションキーがまだ一致している後に
  現在の `:thread:` セッションを復元する必要がある場合に使用します。プロバイダー Plugin は、
  プラットフォームにネイティブのスレッド配信セマンティクスがある場合、優先順位、サフィックスの動作、
  スレッド ID の正規化をオーバーライドできます。
- `openclaw/plugin-sdk/thread-bindings-runtime`: スレッドバインディングのライフサイクル
  およびアダプター登録用
- `openclaw/plugin-sdk/agent-media-payload`: レガシーのエージェント/メディア
  ペイロードフィールドレイアウトがまだ必要な場合のみ
- `openclaw/plugin-sdk/telegram-command-config`: Telegram カスタムコマンドの
  正規化、重複/競合検証、およびフォールバック安定なコマンド
  設定コントラクト用

認証専用チャネルは通常、デフォルトパスで止められます。core が承認を処理し、Plugin はアウトバウンド/認証機能を公開するだけです。Matrix、Slack、Telegram、カスタムチャットトランスポートのようなネイティブ承認チャネルは、独自の承認ライフサイクルを作る代わりに、共有のネイティブヘルパーを使用する必要があります。

## インバウンドメンションポリシー

インバウンドメンション処理は 2 つのレイヤーに分けておきます。

- Plugin 所有の証拠収集
- 共有ポリシー評価

メンションポリシーの判定には `openclaw/plugin-sdk/channel-mention-gating` を使用します。
より広範なインバウンドヘルパー barrel が必要な場合にのみ、
`openclaw/plugin-sdk/channel-inbound` を使用します。

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
- 最終的なスキップ判定

推奨フロー:

1. ローカルのメンション facts を計算します。
2. それらの facts を `resolveInboundMentionDecision({ facts, policy })` に渡します。
3. インバウンドゲートで `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip` を使用します。

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
バンドル済みチャネル Plugin 向けに、同じ共有メンションヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と
`resolveInboundMentionDecision` だけが必要な場合は、無関係なインバウンド
ランタイムヘルパーの読み込みを避けるため、
`openclaw/plugin-sdk/channel-mention-gating` からインポートします。

メンションゲーティングには `resolveInboundMentionDecision({ facts, policy })` を使用します。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準の Plugin ファイルを作成します。`package.json` の `channel` フィールドが、
    これをチャネル Plugin にします。完全なパッケージメタデータサーフェスについては、
    [Plugin セットアップと設定](/ja-JP/plugins/sdk-setup#openclaw-channel) を参照してください。

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
    Plugin 所有の設定に使用します。`channelConfigs`
    は `channels.acme-chat` を検証し、Plugin ランタイムが読み込まれる前に
    設定スキーマ、セットアップ、UI サーフェスで使用されるコールドパスのソースです。

  </Step>

  <Step title="チャネル Plugin オブジェクトを構築する">
    `ChannelPlugin` インターフェイスには多くの任意のアダプターサーフェスがあります。
    最小構成の `id` と `setup` から始め、必要に応じてアダプターを追加します。

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

    正規のトップレベル DM キーとレガシーのネストされたキーの両方を受け入れるチャネルでは、`plugin-sdk/channel-config-helpers` のヘルパーを使用します。`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom`、`normalizeChannelDmPolicy` は、アカウントローカル値を継承されたルート値より優先します。同じリゾルバーを `normalizeLegacyDmAliases` による doctor 修復と組み合わせ、ランタイムとマイグレーションが同じコントラクトを読むようにします。

    <Accordion title="createChatChannelPlugin が行うこと">
      低レベルのアダプターインターフェイスを手動で実装する代わりに、
      宣言的なオプションを渡すと、ビルダーがそれらを合成します。

      | オプション | 配線されるもの |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付き DM セキュリティリゾルバー |
      | `pairing.text` | コード交換を伴うテキストベースの DM ペアリングフロー |
      | `threading` | 返信先モードリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージ ID）を返す送信関数 |

      完全な制御が必要な場合は、宣言的なオプションの代わりに
      生のアダプターオブジェクトを渡すこともできます。

      生のアウトバウンドアダプターは `chunker(text, limit, ctx)` 関数を定義できます。
      任意の `ctx.formatting` は、`maxLinesPerMessage` などの配信時のフォーマット判定を運びます。
      共有アウトバウンド配信によって返信スレッドとチャンク境界が一度だけ解決されるよう、送信前に適用してください。
      ネイティブの返信ターゲットが解決された場合、送信コンテキストには `replyToIdSource`（`implicit` または `explicit`）も含まれるため、
      ペイロードヘルパーは、暗黙的な単回使用の返信スロットを消費せずに、明示的な返信タグを保持できます。
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

    Put channel-owned CLI descriptors を `registerCliMetadata(...)` に置くことで、OpenClaw
    は完全なチャネルランタイムを有効化せずにルートヘルプでそれらを表示でき、
    通常の完全ロードでも実際のコマンド登録用に同じ記述子を取得できます。
    ランタイム専用の処理には `registerFull(...)` を使い続けてください。
    `registerFull(...)` が gateway RPC メソッドを登録する場合は、
    Plugin 固有のプレフィックスを使用してください。コア管理名前空間（`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`）は予約されたままで、常に
    `operator.admin` に解決されます。
    `defineChannelPluginEntry` は登録モードの分割を自動的に処理します。すべての
    オプションについては [エントリーポイント](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="セットアップエントリを追加する">
    オンボーディング中の軽量ロード用に `setup-entry.ts` を作成します。

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    チャネルが無効または未設定の場合、OpenClaw は完全なエントリの代わりにこれをロードします。
    これにより、セットアップフロー中に重いランタイムコードを読み込むことを避けられます。
    詳細は [セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップセーフなエクスポートをサイドカー
    モジュールに分割するバンドル済みワークスペースチャネルは、明示的な
    セットアップ時ランタイムセッターも必要な場合、`openclaw/plugin-sdk/channel-entry-contract` の
    `defineBundledChannelSetupEntry(...)` を使用できます。

  </Step>

  <Step title="受信メッセージを処理する">
    Plugin はプラットフォームからメッセージを受信し、それらを
    OpenClaw に転送する必要があります。典型的なパターンは、リクエストを検証し、
    チャネルの受信ハンドラーを通じてディスパッチする Webhook です。

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
      受信メッセージ処理はチャネル固有です。各チャネル Plugin が
      独自の受信パイプラインを所有します。実際のパターンについては、
      バンドル済みチャネル Plugin（たとえば Microsoft Teams または Google Chat の Plugin パッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テストする">
`src/channel.test.ts` にコロケートされたテストを書きます。

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
  <Card title="メッセージツール連携" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool とアクション検出
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime 経由の TTS、STT、メディア、サブエージェント
  </Card>
  <Card title="チャネル受信 API" icon="bolt" href="/ja-JP/plugins/sdk-channel-inbound">
    共有受信イベントのライフサイクル: ingest、resolve、record、dispatch、finalize
  </Card>
</CardGroup>

<Note>
一部のバンドル済みヘルパーシームは、バンドル済み Plugin のメンテナンスと
互換性のためにまだ存在します。新しいチャネル Plugin に推奨されるパターンではありません。
そのバンドル済み Plugin ファミリーを直接メンテナンスしている場合を除き、共通 SDK
サーフェスの汎用チャネル/セットアップ/返信/ランタイムサブパスを優先してください。
</Note>

## 次のステップ

- [Provider Plugin](/ja-JP/plugins/sdk-provider-plugins) - Plugin がモデルも提供する場合
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [SDK テスト](/ja-JP/plugins/sdk-testing) - テストユーティリティと契約テスト
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - 完全なマニフェストスキーマ

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
