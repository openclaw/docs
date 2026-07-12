---
read_when:
    - 新しいメッセージングチャネル Plugin を構築しています
    - OpenClawをメッセージングプラットフォームに接続したい場合
    - ChannelPlugin アダプターのサーフェスを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングチャネルPluginの構築手順ガイド
title: チャンネル Plugin の構築
x-i18n:
    generated_at: "2026-07-12T14:47:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fa573f956bc710b72433d3e19421ab4af4cab8fc854b93dec371e029ce268273
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw をメッセージングプラットフォームに接続するチャネル Plugin を構築します。DM のセキュリティ、ペアリング、返信のスレッド化、送信メッセージングを扱います。

<Info>
  OpenClaw の Plugin を初めて作成する場合は、まずパッケージ構造とマニフェストの設定について
  [はじめに](/ja-JP/plugins/building-plugins)を参照してください。
</Info>

## Plugin が担うもの

チャネル Plugin は送信、編集、リアクションのツールを実装しません。コアが共有の
`message` ツールを 1 つ提供します。Plugin は以下を担います。

- **設定** - アカウントの解決とセットアップウィザード
- **セキュリティ** - DM ポリシーと許可リスト
- **ペアリング** - DM 承認フロー
- **セッション文法** - プロバイダー固有の会話 ID をベースチャット、スレッド ID、
  親フォールバックにマッピングする方法
- **送信** - プラットフォームへのテキスト、メディア、投票の送信
- **スレッド化** - 返信をスレッド化する方法
- **Heartbeat 入力中表示** - Heartbeat の配信先に対する、オプションの入力中／ビジーシグナル

コアは、共有メッセージツール、プロンプトの接続、外側のセッションキー形式、
汎用の `:thread:` 管理、およびディスパッチを担います。

## メッセージアダプター

`openclaw/plugin-sdk/channel-outbound` の `defineChannelMessageAdapter` を使用して、
`message` アダプターを公開します。ネイティブトランスポートが実際にサポートする、
永続的な最終送信機能のみを宣言し、ネイティブ側の副作用と返されるレシートを証明する
コントラクトテストで裏付けてください。テキスト／メディア送信は、従来の `outbound`
アダプターが使用するものと同じトランスポート関数に接続します。完全な API コントラクト、
機能マトリクス、レシート規則、ライブプレビューの確定、受信確認ポリシー、テスト、
移行表については、[チャネル送信 API](/ja-JP/plugins/sdk-channel-outbound)を参照してください。

既存の `outbound` アダプターに適切な送信メソッドと機能メタデータがすでにある場合は、
別のブリッジを手書きせず、`createChannelMessageAdapterFromOutbound(...)` で
`message` アダプターを派生させてください。アダプターの送信は `MessageReceipt` 値を返します。
従来の ID については、並列の `messageIds` フィールドを保持するのではなく、
`listMessageReceiptPlatformIds(...)` または
`resolveMessageReceiptPrimaryId(...)` で派生させてください。

ライブ機能とファイナライザー機能を正確に宣言してください。コアはこれらを使用して
チャネルが実行できることを判断します。宣言された動作と実際の動作のずれは、
コントラクトテストの失敗になります。

| サーフェス                            | 値                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

ドラフトプレビューをその場で確定するチャネルでは、ランタイムロジックを
`defineFinalizableLivePreviewAdapter(...)` と
`deliverWithFinalizableLivePreviewAdapter(...)` を介して処理し、宣言した機能を
`verifyChannelMessageLiveCapabilityAdapterProofs(...)` および
`verifyChannelMessageLiveFinalizerProofs(...)` のテストで裏付けてください。これにより、
ネイティブプレビュー、進捗、編集、フォールバック／保持、クリーンアップ、レシートの動作が
暗黙にずれることを防ぎます。

プラットフォームへの受信確認を遅延させる受信側は、確認タイミングをモニター固有の状態に
隠すのではなく、`message.receive.defaultAckPolicy` と `supportedAckPolicies` を
宣言してください。宣言したすべてのポリシーを
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` で網羅してください。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase`、
`recordInboundSessionAndDispatchReply` などの従来の返信ヘルパーは、
互換ディスパッチャー向けに引き続き利用できます。新しいチャネルコードでは使用しないでください。
代わりに、`openclaw/plugin-sdk/channel-outbound` の `message` アダプター、レシート、
受信／送信ライフサイクルヘルパーから始めてください。

### 受信イングレス（実験的）

受信認可を移行するチャネルは、ランタイムの受信パスから実験的な
`openclaw/plugin-sdk/channel-ingress-runtime` サブパスを使用できます。
これはプラットフォームのファクト、生の許可リスト、ルート記述子、コマンドのファクト、
アクセスグループ設定を受け取り、送信者／ルート／コマンド／アクティベーションの射影と、
順序付けされたイングレスグラフを返します。一方、プラットフォームの検索と副作用は
Plugin 内に残ります。Plugin のアイデンティティ正規化は、リゾルバーに渡す記述子内に
保持してください。解決済みの状態や決定から、生の照合値をシリアライズしないでください。
API 設計、所有権の境界、テスト要件については、
[チャネルイングレス API](/ja-JP/plugins/sdk-channel-ingress)を参照してください。以前の
`openclaw/plugin-sdk/channel-ingress` サブパスは、サードパーティー Plugin 向けの
非推奨互換ファサードとして引き続きエクスポートされます。

### 入力中インジケーター

チャネルが受信返信以外でも入力中インジケーターをサポートする場合は、
チャネル Plugin で `heartbeat.sendTyping(...)` を公開してください。
コアは Heartbeat モデルの実行開始前に、解決済みの Heartbeat 配信先を指定してこれを呼び出し、
共有の入力中状態キープアライブ／クリーンアップライフサイクルを使用します。
プラットフォームで明示的な停止シグナルが必要な場合は、`heartbeat.clearTyping(...)` を追加してください。

### メディアソースパラメーター

チャネルがメディアソースを保持するメッセージツールパラメーターを追加する場合は、
`plugin.actions.describeMessageTool(...).mediaSourceParams` を通じて
それらのパラメーター名を公開してください。コアはこの明示的なリストを、
サンドボックスパスの正規化と送信メディアアクセスのポリシーに使用します。
そのため、Plugin はプロバイダー固有のアバター、添付ファイル、カバー画像のパラメーター用に、
共有コアへ特別な処理を追加する必要がありません。

`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを
推奨します。これにより、無関係なアクションが別のアクションのメディア引数を継承しません。
公開するすべてのアクションで意図的に共有するパラメーターには、フラット配列も引き続き使用できます。

プラットフォーム側のメディア取得用に一時的な公開 URL を公開する必要があるチャネルは、
Plugin の状態ストアとともに `openclaw/plugin-sdk/outbound-media` の
`createHostedOutboundMediaStore(...)` を使用できます。プラットフォームのルート解析と
トークンの強制はチャネル Plugin 内に保持してください。共有ヘルパーが担うのは、
メディアの読み込み、有効期限メタデータ、チャンク行、クリーンアップのみです。

### ネイティブペイロードの整形

チャネルで `message(action="send")` に対するプロバイダー固有の整形が必要な場合は、
`actions.prepareSendPayload(...)` を推奨します。ネイティブカード、ブロック、埋め込み、
その他の永続データを `payload.channelData.<channel>` 配下に配置し、
コアが送信／メッセージアダプターを介して送信するようにします。
`actions.handleAction(...)` を送信に使用するのは、シリアライズして再試行できない
ペイロードに対する互換フォールバックの場合のみにしてください。

### セッション会話文法

プラットフォームが会話 ID 内に追加のスコープを保存する場合は、その解析を
`messaging.resolveSessionConversation(...)` を使用して Plugin 内に保持してください。
これは、`rawId` をベース会話 ID、オプションのスレッド ID、明示的な
`baseConversationId`、任意の `parentConversationCandidates` にマッピングするための
標準フックです。`parentConversationCandidates` を返す場合は、最も限定的な親から
最も広範な親／ベース会話の順に並べてください。

`messaging.resolveParentConversationCandidates(...)` は、汎用／生の ID に加えて
親フォールバックのみを必要とする Plugin 向けの、非推奨の互換フォールバックです。
両方のフックが存在する場合、コアは最初に
`resolveSessionConversation(...).parentConversationCandidates` を使用し、
標準フックがそれらを省略した場合にのみ
`resolveParentConversationCandidates(...)` にフォールバックします。

チャネルレジストリの起動前に同じ解析が必要なバンドル Plugin は、
一致する `resolveSessionConversation(...)` エクスポートを持つトップレベルの
`session-key-api.ts` ファイルを公開できます（Feishu および Telegram Plugin を参照）。
コアは、ランタイム Plugin レジストリがまだ利用できない場合にのみ、
このブートストラップセーフなサーフェスを使用します。

Plugin コードでルート形式のフィールドを正規化する、子スレッドとその親ルートを比較する、
または `{ channel, to, accountId, threadId }` から安定した重複排除キーを構築する必要がある場合は、
`openclaw/plugin-sdk/channel-route` を使用してください。このヘルパーは数値のスレッド ID を
コアと同じ方法で正規化するため、アドホックな `String(threadId)` の比較より優先してください。
プロバイダー固有の宛先文法を持つ Plugin は
`messaging.resolveOutboundSessionRoute(...)` を公開し、コアがパーサーシムなしで
プロバイダーネイティブのセッションとスレッドのアイデンティティを取得できるようにしてください。

### アカウントスコープの会話バインディングのサポート

チャネルが汎用の現在の会話バインディングをサポートする場合は、
`conversationBindings.supportsCurrentConversationBinding` を設定してください。
`createChatChannelPlugin(...)` は、この静的機能をデフォルトで `true` に設定します。

設定済みアカウントによってサポート状況が異なる場合は、
`conversationBindings.isCurrentConversationBindingSupported({ accountId })` も実装してください。
コアは、静的機能が有効な場合にのみ、この同期フックを評価します。`false` を返すと、
そのアカウントでは汎用の現在の会話に関する機能、バインド、検索、一覧表示、更新、
バインド解除の操作を利用できなくなります。フックを省略すると、静的機能がすべてのアカウントに適用されます。

すでに読み込まれているアカウント設定またはランタイム状態から結果を解決してください。
このフックが制御するのは汎用の現在の会話バインディングのみです。設定済みのバインディング規則や、
Plugin が所有するセッションルーティングを置き換えるものではありません。
コントラクトテストでは、`openclaw/plugin-sdk/channel-core` がエクスポートする
`ChannelPlugin["conversationBindings"]` コントラクトを通じて、少なくとも 1 つの
サポート対象アカウントと 1 つの非サポートアカウントを網羅してください。

## 承認とチャネル機能

ほとんどのチャネル Plugin では、承認固有のコードは必要ありません。コアが同一チャットの
`/approve`、共有の承認ボタンペイロード、汎用フォールバック配信を担います。
`ChannelPlugin.approvals` は削除されました。代わりに、承認の配信／ネイティブ／レンダリング／認証の
ファクトを 1 つの `approvalCapability` オブジェクトに配置してください。
`plugin.auth` はログイン／ログアウト専用です。コアはこのオブジェクトから承認認証フックを読み取らなくなりました。

`approvalCapability.delivery` はネイティブ承認のルーティングまたはフォールバック抑止の場合のみに使用し、
`approvalCapability.render` は共有レンダラーではなくカスタム承認ペイロードが本当に必要なチャネルでのみ使用してください。

### 承認認証

- `approvalCapability.authorizeActorAction` と
  `approvalCapability.getActionAvailabilityState` が標準の承認認証シームです。
- 同一チャットの承認認証の可用性には `getActionAvailabilityState` を使用してください。
  ネイティブ配信が無効な場合でも、設定済みの承認者が `/approve` を利用できる状態を維持してください。
  配信／セットアップのガイダンスには、代わりにネイティブの開始サーフェス状態を使用してください。
- チャネルがネイティブの実行承認を公開する場合は、開始サーフェス／ネイティブクライアントの状態が
  同一チャットの承認認証と異なるときに、
  `approvalCapability.getExecInitiatingSurfaceState` を使用してください。
  コアはこの実行固有のフックを使用して `enabled` と `disabled` を区別し、
  開始元チャネルがネイティブの実行承認をサポートするかどうかを判断し、
  そのチャネルをネイティブクライアントのフォールバックガイダンスに含めます。
  一般的なケースでは、`createApproverRestrictedNativeApprovalCapability(...)` がこれを設定します。
- チャネルが既存の設定から安定した所有者相当の DM アイデンティティを推測できる場合は、
  `openclaw/plugin-sdk/approval-runtime` の
  `createResolvedApproverActionAuthAdapter` を使用し、承認固有のコアロジックを追加せずに
  同一チャットの `/approve` を制限してください。
- カスタム承認認証が意図的に同一チャットのフォールバックのみを許可する場合は、
  `openclaw/plugin-sdk/approval-auth-runtime` の
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` を返してください。
  それ以外の場合、コアは結果を明示的な承認者認可として扱います。
- チャネル所有のネイティブコールバックが承認を直接解決する場合は、解決前に
  `isImplicitSameChatApprovalAuthorization(...)` を使用してください。これにより、
  暗黙のフォールバックも引き続きチャネルの通常のアクター認可を経由します。

### ペイロードのライフサイクルとセットアップガイダンス

- 重複するローカル承認プロンプトを非表示にする、または配信前に入力中インジケーターを送信するなど、チャネル固有のペイロードライフサイクル動作には、`outbound.shouldSuppressLocalPayloadPrompt` または
  `outbound.beforeDeliverPayload` を使用します。
- 無効時の応答で、ネイティブ exec 承認を有効にするために必要な正確な設定項目を説明する場合は、`approvalCapability.describeExecApprovalSetup` を使用します。このフックは `{ channel, channelLabel, accountId }` を受け取ります。
  名前付きアカウントを持つチャネルでは、トップレベルのデフォルトではなく、
  `channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープのパスを表示する必要があります。
- Plugin 承認のルートなしエラーやタイムアウトエラーに対して、Plugin 承認失敗のガイダンスを安全に表示できる場合は、`approvalCapability.describePluginApprovalSetup` を使用します。
  `createApproverRestrictedNativeApprovalCapability(...)` は、これを
  `describeExecApprovalSetup` から推測しません。Plugin 承認と exec 承認が実際に同じネイティブ設定を使用する場合に限り、同じヘルパーを明示的に渡してください。

### ネイティブ承認の配信

チャネルでネイティブ承認の配信が必要な場合、チャネルコードはターゲットの正規化とトランスポート／プレゼンテーション情報に集中させます。
`openclaw/plugin-sdk/approval-runtime` の
`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、
`createChannelApproverDmTargetResolver`、および
`createApproverRestrictedNativeApprovalCapability` を使用します。チャネル固有の情報は
`approvalCapability.nativeRuntime` の背後に配置し、可能であれば
`createChannelApprovalNativeRuntimeAdapter(...)` または
`createLazyChannelApprovalNativeRuntimeAdapter(...)` を使用します。これにより、コアがハンドラーを構成し、リクエストのフィルタリング、ルーティング、重複排除、有効期限、Gateway
サブスクリプション、および別の場所へルーティングされたことを示す通知を管理できます。

`nativeRuntime` は、いくつかの小さなシームに分割されています。

- `availability` - アカウントが設定されているか、およびリクエストを処理すべきか
- `presentation` - 共有承認ビューモデルを、保留中／解決済み／期限切れのネイティブペイロードまたは最終アクションにマッピング
- `transport` - ターゲットを準備し、ネイティブ承認メッセージを送信／更新／削除
- `interactions` - ネイティブボタンまたはリアクション向けの、オプションのバインド／バインド解除／アクションクリアフックと、オプションの `cancelDelivered` フック。`deliverPending` がプロセス内または永続的な状態（リアクションターゲットストアなど）を登録する場合は、`cancelDelivered` を実装してください。これにより、`bindPending` が実行される前にハンドラーの停止によって配信がキャンセルされた場合、または
  `bindPending` がハンドルを返さない場合に、その状態を解放できます
- `observe` - オプションの配信診断フック

その他の承認ヘルパー：

- チャネルがセッション起点のネイティブ配信と明示的な承認転送先の両方をサポートする場合は、
  `openclaw/plugin-sdk/approval-native-runtime` の
  `createNativeApprovalChannelRouteGates` を使用します。このヘルパーは、承認設定の選択、`mode` の処理、エージェント／セッションフィルター、アカウントのバインド、セッションターゲットの照合、およびターゲットリストの照合を一元化します。一方、呼び出し側は引き続き、チャネル ID、デフォルトの転送モード、アカウント検索、トランスポート有効化チェック、ターゲット正規化、およびターンソースターゲットの解決を管理します。コア所有のチャネルポリシーデフォルトを作成するために使用しないでください。チャネルで文書化されたデフォルトモードを明示的に渡します。
- `createChannelNativeOriginTargetResolver` は、デフォルトで `{ to, accountId, threadId }` ターゲットに共有チャネルルートマッチャーを使用します。Slack のタイムスタンププレフィックス照合など、チャネルにプロバイダー固有の同値規則がある場合に限り、
  `targetsMatch` を渡します。デフォルトのルートマッチャーまたはカスタムの `targetsMatch` コールバックが実行される前に、チャネルでプロバイダー ID を正規化する必要があり、かつ配信用には元のターゲットを保持する場合は、
  `normalizeTargetForMatch` を渡します。解決された配信ターゲット自体を正規化する必要がある場合に限り、`normalizeTarget` を使用します。
- チャネルでクライアント、トークン、Bolt アプリ、Webhook レシーバーなどのランタイム所有オブジェクトが必要な場合は、
  `openclaw/plugin-sdk/channel-runtime-context` を介して登録します。汎用ランタイムコンテキストレジストリにより、承認固有のラッパー接着コードを追加せずに、コアがチャネルの起動状態からケイパビリティ駆動のハンドラーをブートストラップできます。
- ケイパビリティ駆動のシームではまだ十分に表現できない場合に限り、低レベルの `createChannelApprovalHandler` または
  `createChannelNativeApprovalRuntime` を使用します。
- ネイティブ承認チャネルは、これらのヘルパーを通して `accountId` と `approvalKind` の両方をルーティングする必要があります。`accountId` により、複数アカウントの承認ポリシーを適切なボットアカウントにスコープできます。また、`approvalKind` により、コアにハードコードされた分岐を設けずに、exec 承認と Plugin 承認の動作をチャネルで利用できます。
- 承認の再ルーティング通知もコアが管理します。チャネル Plugin は
  `createChannelNativeApprovalRuntime` から独自の「承認は DM／別のチャネルに送信されました」というフォローアップメッセージを送信してはいけません。代わりに、共有承認ケイパビリティヘルパーを通して正確な起点＋承認者 DM ルーティングを公開し、開始元のチャットに通知を投稿する前に、コアが実際の配信を集約できるようにします。
- 配信された承認 ID の種類をエンドツーエンドで維持します。ネイティブクライアントは、チャネルローカルの状態から exec 承認と Plugin 承認のルーティングを推測または書き換えてはいけません。
- その明示的な `approvalKind` を `resolveApprovalOverGateway` に渡します。これは正規の `approval.resolve` サービスを使用し、別のサーフェスが先に応答した場合は、記録された勝者を返します。以前の明示的な `resolveMethod` 入力は、コマンドベースのコントロール向けに引き続き存在します。新しいネイティブアクションでは、これを使用したり、ID から種類を推測したりしてはいけません。
- 承認の種類ごとに、意図的に異なるネイティブサーフェスを公開できます。現在バンドルされている例：Matrix は、exec 承認と Plugin 承認で同じネイティブ DM／チャネルルーティングとリアクション UX を維持しつつ、認証は承認の種類によって異なるようにしています。Slack は、exec ID と Plugin ID の両方でネイティブ承認ルーティングを利用可能にしています。
- `createApproverRestrictedNativeApprovalAdapter` は互換性ラッパーとして引き続き存在しますが、新しいコードではケイパビリティビルダーを優先し、Plugin 上で `approvalCapability` を公開する必要があります。

### より限定的な承認ランタイムのサブパス

頻繁に実行されるチャネルエントリポイントでは、そのファミリーの一部だけが必要な場合、広範な
`approval-runtime` バレルよりも、次の限定的なサブパスを優先してください。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、すべてが必要でない場合は、より広範な包括サーフェスよりも
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking` を優先してください。

### セットアップのサブパス

- `openclaw/plugin-sdk/setup-runtime` は、ランタイムで安全なセットアップヘルパーを対象とします：
  `createSetupTranslator`、インポート時に安全なセットアップパッチアダプター
  （`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、検索注記の出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委任セットアッププロキシビルダー。
- `openclaw/plugin-sdk/channel-setup` は、オプションインストールのセットアップビルダーと、セットアップ時に安全ないくつかのプリミティブを対象とします：`createOptionalChannelSetupSurface`、
  `createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、
  `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、
  `setSetupChannelEnabled`、および `splitSetupEntries`。
- `moveSingleAccountChannelSectionToDefaultAccount(...)` など、より重い共有セットアップ／設定ヘルパーも必要な場合に限り、より広範な `openclaw/plugin-sdk/setup` シームを使用します。

チャネルがセットアップサーフェスで「まずこの Plugin をインストールしてください」と案内するだけの場合は、`createOptionalChannelSetupSurface(...)` を優先してください。生成されるアダプター／ウィザードは、設定の書き込みと最終処理でフェイルクローズし、検証、最終処理、およびドキュメントリンクのコピーで同じインストール必須メッセージを再利用します。

チャネルが環境変数駆動のセットアップまたは認証をサポートし、汎用の起動／設定フローがランタイムのロード前にそれらの環境変数名を把握する必要がある場合は、Plugin マニフェストの `channelEnvVars` で宣言します。チャネルランタイムの `envVars` またはローカル定数は、オペレーター向けの文面専用として維持します。

Plugin ランタイムの起動前にチャネルが `status`、`channels list`、`channels status`、または
SecretRef スキャンに表示される可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加します。そのエントリポイントは読み取り専用コマンドパスで安全にインポートでき、これらの概要に必要なチャネルメタデータ、セットアップ時に安全な設定アダプター、ステータスアダプター、およびチャネルシークレットターゲットメタデータを返す必要があります。セットアップエントリからクライアント、リスナー、またはトランスポートランタイムを起動してはいけません。

メインチャネルエントリのインポートパスも限定的に保ちます。ディスカバリーは、チャネルを有効化せずにエントリとチャネル Plugin モジュールを評価して、ケイパビリティを登録できます。
`channel-plugin-api.ts` のようなファイルでは、セットアップウィザード、トランスポートクライアント、ソケットリスナー、サブプロセスランチャー、またはサービス起動モジュールをインポートせずに、チャネル Plugin オブジェクトをエクスポートする必要があります。これらのランタイム要素は、`registerFull(...)`、ランタイムセッター、または遅延ケイパビリティアダプターからロードされるモジュールに配置します。

### その他の限定的なチャネルサブパス

その他の頻繁に実行されるチャネルパスでは、より広範なレガシーサーフェスよりも限定的なヘルパーを優先してください。

- 複数アカウント設定とデフォルトアカウントへのフォールバックには、`openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers`
- 受信ルート／エンベロープおよび記録／ディスパッチの配線には、`openclaw/plugin-sdk/inbound-envelope` および
  `openclaw/plugin-sdk/channel-inbound`
- ターゲット解析ヘルパーには、`openclaw/plugin-sdk/channel-targets`
- メディアの読み込みには `openclaw/plugin-sdk/outbound-media`、送信 ID／送信デリゲートおよびペイロード計画には
  `openclaw/plugin-sdk/channel-outbound`
- 送信ルートで明示的な `replyToId`／`threadId` を維持する必要がある場合、またはベースセッションキーが引き続き一致している状態で現在の `:thread:` セッションを復元する必要がある場合は、
  `openclaw/plugin-sdk/channel-core` の
  `buildThreadAwareOutboundSessionRoute(...)`。プラットフォームにネイティブなスレッド配信セマンティクスがある場合、プロバイダー Plugin は優先順位、サフィックス動作、およびスレッド ID の正規化をオーバーライドできます。
- スレッドバインディングのライフサイクルとアダプター登録には、`openclaw/plugin-sdk/thread-bindings-runtime`
- レガシーなエージェント／メディアペイロードフィールドのレイアウトが引き続き必要な場合に限り、`openclaw/plugin-sdk/agent-media-payload`
- Telegram のカスタムコマンド正規化、重複／競合検証、およびフォールバック時も安定したコマンド設定契約には、`openclaw/plugin-sdk/telegram-command-config`（非推奨：本番環境で使用するバンドル済み Plugin はありません）。新しい Plugin コードでは、Plugin ローカルのコマンド設定処理を優先してください

認証専用チャネルは、通常はデフォルトパスまでで十分です。コアが承認を処理し、Plugin は送信／認証ケイパビリティのみを公開します。Matrix、Slack、Telegram、およびカスタムチャットトランスポートのようなネイティブ承認チャネルでは、独自の承認ライフサイクルを実装する代わりに、共有ネイティブヘルパーを使用する必要があります。

## 受信メンションポリシー

受信メンション処理は、次の 2 層に分けて維持します。

- Plugin 所有の証拠収集
- 共有ポリシー評価

メンションポリシーの判定には `openclaw/plugin-sdk/channel-mention-gating` を使用します。より広範な受信ヘルパーバレルが必要な場合に限り、`openclaw/plugin-sdk/channel-inbound` を使用します。

Plugin ローカルロジックに適するもの：

- ボットへの返信の検出
- 引用されたボットの検出
- スレッド参加のチェック
- サービス／システムメッセージの除外
- ボットの参加を証明するために必要なプラットフォームネイティブのキャッシュ

共有ヘルパーに適するもの：

- `requireMention`
- 明示的なメンション結果
- 暗黙的なメンション許可リスト
- コマンドによるバイパス
- 最終的なスキップ判定

推奨フロー：

1. ローカルのメンション情報を計算します。
2. その情報を `resolveInboundMentionDecision({ facts, policy })` に渡します。
3. 受信ゲートで `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、
   `decision.shouldSkip` を使用します。

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

`matchesMentionWithExplicit(...)` はブール値を返します。`hasAnyMention`、
`isExplicitlyMentioned`、`canResolveExplicit` は、チャンネル独自の
ネイティブなメンションメタデータ（メッセージエンティティ、ボットへの返信フラグなど）から取得します。
プラットフォームで検出できない場合は、`false`/`undefined` 値を指定してください。

`api.runtime.channel.mentions` は、すでにランタイム注入に依存している
バンドル済みチャンネルプラグイン向けに、同じ共有メンションヘルパーを公開します：
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、
`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

`implicitMentionKindWhen` と `resolveInboundMentionDecision` だけが必要な場合は、
無関係な受信ランタイムヘルパーの読み込みを避けるため、
`openclaw/plugin-sdk/channel-mention-gating` からインポートしてください。

## 手順

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準のプラグインファイルを作成します。
    `openclaw.plugin.json` の `channels` フィールド（`kind` フィールドではありません）が、
    マニフェストがチャンネルを所有することを示します。パッケージメタデータの全項目については、
    [プラグインのセットアップと設定](/ja-JP/plugins/sdk-setup#openclaw-channel)を参照してください：

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
          "blurb": "OpenClaw を Acme Chat に接続します。"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat チャンネルプラグイン",
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
              "label": "ボットトークン",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` は `plugins.entries.acme-chat.config` を検証します。チャンネルアカウント設定ではない、
    プラグインが所有する設定に使用してください。
    `channelConfigs.acme-chat.schema` は `channels.acme-chat` を検証し、
    プラグインランタイムが読み込まれる前に、設定スキーマ、セットアップ、UI サーフェスで使用される
    コールドパスのソースです。トップレベルフィールドの完全なリファレンスについては、
    [プラグインマニフェスト](/ja-JP/plugins/manifest)を参照してください。

  </Step>

  <Step title="チャンネルプラグインオブジェクトを構築する">
    `ChannelPlugin` インターフェースには、多くのオプションのアダプターサーフェスがあります。
    まず最小構成の `id`、`config`、`setup` から始め、必要に応じて
    アダプターを追加してください。

    `src/channel.ts` を作成します：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // プラットフォームの API クライアント

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
      if (!token) throw new Error("acme-chat: トークンが必要です");
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
        // アカウントの解決と検査は `setup` ではなく `config` に属します。
        // `setup` はオンボーディング時の書き込み（applyAccountConfig、validateInput）を扱います。
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

      // DM セキュリティ：ボットにメッセージを送信できるユーザー
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // ペアリング：新しい DM 連絡先の承認フロー
      pairing: {
        text: {
          idLabel: "Acme Chat ユーザー名",
          message: "本人確認のため、このコードを送信してください：",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `ペアリングコード：${code}`);
          },
        },
      },

      // スレッド処理：返信の配信方法
      threading: { topLevelReplyToMode: "reply" },

      // 送信：プラットフォームにメッセージを送信
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

    正規のトップレベル DM キーと従来のネストされたキーの両方を受け入れるチャンネルでは、`plugin-sdk/channel-config-helpers` のヘルパーを使用してください。`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom`、`normalizeChannelDmPolicy` は、継承されたルート値よりもアカウントローカルの値を優先します。同じリゾルバーを `normalizeLegacyDmAliases` による doctor 修復と組み合わせ、ランタイムと移行が同じ契約を読み取るようにしてください。

    <Accordion title="createChatChannelPlugin が自動で行うこと">
      低レベルのアダプターインターフェースを手動で実装する代わりに、
      宣言的なオプションを渡すと、ビルダーがそれらを構成します：

      | オプション | 接続される機能 |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付き DM セキュリティリゾルバー |
      | `pairing.text` | コード交換を使用するテキストベースの DM ペアリングフロー |
      | `threading` | 返信先モードのリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージ ID）を返す送信関数。コアが返された配信結果に識別情報を付与できるよう、同階層に `channel` ID が必要 |

      完全な制御が必要な場合は、宣言的なオプションの代わりに
      生のアダプターオブジェクトを渡すこともできます。

      生の送信アダプターでは、`chunker(text, limit, ctx)` 関数を定義できます。
      オプションの `ctx.formatting` には、`maxLinesPerMessage` など、
      配信時の書式設定の決定が含まれます。返信のスレッド処理とチャンク境界が
      共有送信配信によって一度だけ解決されるよう、送信前に適用してください。
      ネイティブな返信先が解決された場合、送信コンテキストには
      `replyToIdSource`（`implicit` または `explicit`）も含まれます。これにより、
      ペイロードヘルパーは暗黙的な単発返信スロットを消費せずに、
      明示的な返信タグを保持できます。
    </Accordion>

  </Step>

  <Step title="エントリーポイントを接続する">
    `index.ts` を作成します：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat チャンネルプラグイン",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat の管理");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat の管理",
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

    チャンネルが所有する CLI 記述子は `registerCliMetadata(...)` に配置してください。これにより OpenClaw は、
    チャンネルランタイム全体を有効化せずにルートヘルプへ表示でき、
    通常の完全読み込みでも実際のコマンド登録に同じ記述子を使用できます。
    ランタイム専用の処理は `registerFull(...)` に残してください。
    `defineChannelPluginEntry` は登録モードの分割を自動的に処理します。
    `registerFull(...)` で Gateway RPC メソッドを登録する場合は、
    プラグイン固有のプレフィックスを使用してください。コア管理名前空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、常に
    `operator.admin` に解決されます。すべてのオプションについては、
    [エントリーポイント](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry)を参照してください。

  </Step>

  <Step title="セットアップエントリーを追加する">
    オンボーディング中の軽量読み込み用に `setup-entry.ts` を作成します：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    チャンネルが無効または未設定の場合、OpenClaw は完全なエントリーの代わりに
    これを読み込みます。これにより、セットアップフロー中に重いランタイムコードを
    読み込まずに済みます。詳細については、
    [セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

    セットアップで安全に使用できるエクスポートをサイドカーモジュールへ分割している
    バンドル済みワークスペースチャンネルでは、セットアップ時の明示的なランタイムセッターも
    必要な場合、`openclaw/plugin-sdk/channel-entry-contract` の
    `defineBundledChannelSetupEntry(...)` を使用できます。

  </Step>

  <Step title="受信メッセージを処理する">
    プラグインは、プラットフォームからメッセージを受信して OpenClaw に転送する必要があります。
    一般的なパターンは、リクエストを検証し、チャンネルの受信ハンドラーを通じて
    ディスパッチする Webhook です：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin が管理する認証（署名は自分で検証）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 受信ハンドラーはメッセージを OpenClaw にディスパッチします。
          // 正確な接続方法はプラットフォーム SDK によって異なります。
          // バンドルされている Microsoft Teams または Google Chat の Plugin パッケージにある実例を参照してください。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      受信メッセージの処理はチャネル固有です。各チャネル Plugin が
      独自の受信パイプラインを所有します。実際のパターンについては、
      バンドルされているチャネル Plugin
      （Microsoft Teams または Google Chat の Plugin パッケージなど）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` に同じ場所に配置するテストを記述します。

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

## ファイル構成

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel メタデータ
├── openclaw.plugin.json      # 設定スキーマを含むマニフェスト
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開エクスポート（任意）
├── runtime-api.ts            # 内部ランタイムエクスポート（任意）
└── src/
    ├── channel.ts            # createChatChannelPlugin を介した ChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォーム API クライアント
    └── runtime.ts            # ランタイムストア（必要な場合）
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
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime を介した TTS、STT、メディア、サブエージェント
  </Card>
  <Card title="チャネル受信 API" icon="bolt" href="/ja-JP/plugins/sdk-channel-inbound">
    共有受信イベントのライフサイクル：取り込み、解決、記録、ディスパッチ、完了処理
  </Card>
</CardGroup>

<Note>
バンドルされた Plugin のメンテナンスと互換性のために、
バンドルされたヘルパー境界の一部は現在も存在します。
これらは新しいチャネル Plugin に推奨されるパターンではありません。
そのバンドル Plugin ファミリーを直接メンテナンスしている場合を除き、
共通 SDK サーフェスの汎用的なチャネル、セットアップ、返信、ランタイムのサブパスを優先してください。
</Note>

## 次のステップ

- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - Plugin でモデルも提供する場合
- [SDK の概要](/ja-JP/plugins/sdk-overview) - サブパスインポートの完全なリファレンス
- [SDK のテスト](/ja-JP/plugins/sdk-testing) - テストユーティリティとコントラクトテスト
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - 完全なマニフェストスキーマ

## 関連項目

- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
