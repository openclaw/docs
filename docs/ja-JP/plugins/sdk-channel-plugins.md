---
read_when:
    - 新しいメッセージングチャネル Plugin を構築しています
    - OpenClawをメッセージングプラットフォームに接続する場合
    - ChannelPlugin アダプターのインターフェースを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングチャネルPlugin構築のステップバイステップガイド
title: チャンネル Plugin の構築
x-i18n:
    generated_at: "2026-07-16T12:07:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw をメッセージングプラットフォームに接続するチャンネル Plugin を構築します。DM のセキュリティ、ペアリング、返信のスレッド化、送信メッセージを扱います。

<Info>
  OpenClaw の Plugin を初めて使用しますか？まず[はじめに](/ja-JP/plugins/building-plugins)を読み、パッケージ構造とマニフェストの設定を確認してください。
</Info>

## Plugin が担うもの

チャンネル Plugin は送信、編集、リアクションのツールを実装しません。コアが共有の
`message` ツールを提供します。Plugin は次を担います。

- **設定** - アカウントの解決とセットアップウィザード
- **セキュリティ** - DM ポリシーと許可リスト
- **ペアリング** - DM の承認フロー
- **セッション文法** - プロバイダー固有の会話 ID をベースチャット、スレッド ID、親フォールバックにマッピングする方法
- **送信** - プラットフォームへのテキスト、メディア、投票の送信
- **スレッド化** - 返信をスレッド化する方法
- **Heartbeat の入力中表示** - Heartbeat の配信先に対する任意の入力中／処理中シグナル

コアは、共有メッセージツール、プロンプトの配線、外側のセッションキー形式、汎用の `:thread:` 管理、ディスパッチを担います。

## メッセージアダプター

`openclaw/plugin-sdk/channel-outbound` の `defineChannelMessageAdapter` を使用して、`message` アダプターを公開します。ネイティブトランスポートが実際に対応する、永続的な最終送信機能のみを宣言し、ネイティブ側の作用と返却された受領情報を証明するコントラクトテストで裏付けます。テキスト／メディア送信では、従来の `outbound` アダプターが使用するものと同じトランスポート関数を指定します。完全な API コントラクト、機能マトリクス、受領情報のルール、ライブプレビューの確定、受信確認ポリシー、テスト、移行表については、[チャンネル送信 API](/ja-JP/plugins/sdk-channel-outbound)を参照してください。

既存の `outbound` アダプターに適切な送信メソッドと機能メタデータがすでにある場合は、別のブリッジを手作業で記述せず、`createChannelMessageAdapterFromOutbound(...)` を使用して `message` アダプターを派生させます。アダプターの送信は `MessageReceipt` 値を返します。従来の ID については、並行する `messageIds` フィールドを維持せず、`listMessageReceiptPlatformIds(...)` または `resolveMessageReceiptPrimaryId(...)` で派生させます。

ライブ機能と確定処理機能は正確に宣言してください。コアはこれらを使用してチャンネルで可能な処理を判断し、宣言と実際の動作の不一致はコントラクトテストの失敗となります。

| サーフェス                            | 値                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`                    | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities`                    | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure` |

下書きプレビューをその場で確定するチャンネルでは、ランタイムロジックを `defineFinalizableLivePreviewAdapter(...)` と `deliverWithFinalizableLivePreviewAdapter(...)` を介して処理し、宣言した機能を `verifyChannelMessageLiveCapabilityAdapterProofs(...)` および `verifyChannelMessageLiveFinalizerProofs(...)` テストで裏付けてください。これにより、ネイティブプレビュー、進行状況、編集、フォールバック／保持、クリーンアップ、受領情報の動作が暗黙に乖離するのを防ぎます。

プラットフォームへの確認応答を遅延させる受信処理では、確認応答のタイミングをモニター内のローカル状態に隠さず、`message.receive.defaultAckPolicy` と `supportedAckPolicies` を宣言してください。宣言したすべてのポリシーを `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` で網羅してください。

`dispatchInboundReplyWithBase` や `recordInboundSessionAndDispatchReply` などの従来の返信ヘルパーは、互換性ディスパッチャー向けに引き続き使用できます。新しいチャンネルコードでは使用しないでください。代わりに、`message` アダプター、受領情報、`openclaw/plugin-sdk/channel-outbound` の受信／送信ライフサイクルヘルパーから始めてください。

### 受信イングレス（実験的）

受信認可を移行するチャンネルは、ランタイムの受信パスから実験的な `openclaw/plugin-sdk/channel-ingress-runtime` サブパスを使用できます。これは、プラットフォームのファクト、生の許可リスト、ルート記述子、コマンドのファクト、アクセスグループ設定を受け取り、送信者、ルート、コマンド、アクティベーションのプロジェクションと、順序付けされたイングレスグラフを返します。一方、プラットフォームの検索と副作用は Plugin 内に残ります。Plugin の識別情報の正規化はリゾルバーに渡す記述子内で行ってください。解決済みの状態や判断から、生の一致値をシリアライズしないでください。API 設計、責任範囲、テスト要件については、[チャンネルイングレス API](/ja-JP/plugins/sdk-channel-ingress)を参照してください。

### 入力中インジケーター

チャンネルが受信返信以外でも入力中インジケーターに対応する場合は、チャンネル Plugin で `heartbeat.sendTyping(...)` を公開します。コアは Heartbeat のモデル実行が開始される前に、解決済みの Heartbeat 配信先を指定してこれを呼び出し、共有の入力中状態維持／クリーンアップライフサイクルを使用します。プラットフォームで明示的な停止シグナルが必要な場合は、`heartbeat.clearTyping(...)` を追加します。

### メディアソースのパラメーター

チャンネルがメディアソースを保持するメッセージツールパラメーターを追加する場合は、そのパラメーター名を `plugin.actions.describeMessageTool(...).mediaSourceParams` で公開します。コアはこの明示的なリストをサンドボックスパスの正規化と送信メディアのアクセスポリシーに使用するため、Plugin はプロバイダー固有のアバター、添付ファイル、カバー画像のパラメーターについて共有コアに特別な処理を追加する必要がありません。

無関係なアクションが別のアクションのメディア引数を継承しないよう、`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー形式のマップを推奨します。公開されるすべてのアクションで意図的に共有するパラメーターについては、フラットな配列も引き続き使用できます。

プラットフォーム側でメディアを取得するために一時的な公開 URL を公開する必要があるチャンネルは、Plugin の状態ストアとともに `openclaw/plugin-sdk/outbound-media` の `createHostedOutboundMediaStore(...)` を使用できます。プラットフォームのルート解析とトークンの強制はチャンネル Plugin 内に維持してください。共有ヘルパーが担うのは、メディアの読み込み、有効期限メタデータ、チャンク行、クリーンアップのみです。

### ネイティブペイロードの整形

チャンネルで `message(action="send")` をプロバイダー固有の形式に整形する必要がある場合は、`actions.prepareSendPayload(...)` を推奨します。ネイティブカード、ブロック、埋め込み、その他の永続的なデータを `payload.channelData.<channel>` 配下に配置し、コアから送信／メッセージアダプターを介して送信します。シリアライズして再試行できないペイロードに限り、互換性フォールバックとして送信用の `actions.handleAction(...)` を使用してください。

### セッション会話文法

プラットフォームが会話 ID 内に追加のスコープを保存する場合は、その解析を `messaging.resolveSessionConversation(...)` を使用して Plugin 内に維持します。これは、`rawId` をベース会話 ID、任意のスレッド ID、明示的な `baseConversationId`、任意の `parentConversationCandidates` にマッピングするための正規フックです。`parentConversationCandidates` を返す場合は、最も狭い親から最も広い親／ベース会話の順に並べます。

`messaging.resolveParentConversationCandidates(...)` は、汎用／生の ID に親フォールバックを追加するだけの Plugin 向けに用意された、非推奨の互換性フォールバックです。両方のフックが存在する場合、コアは最初に `resolveSessionConversation(...).parentConversationCandidates` を使用し、正規フックで省略された場合にのみ `resolveParentConversationCandidates(...)` にフォールバックします。

チャンネルレジストリが起動する前に同じ解析を必要とする同梱 Plugin は、対応する `resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルを公開できます（Feishu と Telegram の Plugin を参照）。コアは、ランタイム Plugin レジストリがまだ使用できない場合にのみ、このブートストラップセーフなサーフェスを使用します。

Plugin コードでルート形式のフィールドを正規化する場合、子スレッドとその親ルートを比較する場合、または `{ channel, to, accountId, threadId }` から安定した重複排除キーを構築する場合は、`openclaw/plugin-sdk/channel-route` を使用します。このヘルパーは数値のスレッド ID をコアと同じ方法で正規化するため、アドホックな `String(threadId)` 比較より優先してください。プロバイダー固有のターゲット文法を持つ Plugin は `messaging.resolveOutboundSessionRoute(...)` を公開し、パーサーシムを使用せずにプロバイダーネイティブのセッションとスレッドの識別情報をコアに提供してください。

### アカウントスコープの会話バインディング対応

チャンネルが汎用の現在会話バインディングに対応する場合は、`conversationBindings.supportsCurrentConversationBinding` を設定します。`createChatChannelPlugin(...)` は、デフォルトでこの静的機能を `true` に設定します。

設定済みのアカウントによって対応状況が異なる場合は、`conversationBindings.isCurrentConversationBindingSupported({ accountId })` も実装します。コアは、静的機能が有効になった後にのみ、この同期フックを評価します。`false` を返すと、そのアカウントでは、汎用の現在会話に対する機能確認、バインド、検索、一覧表示、更新、バインド解除の各操作が使用できなくなります。フックを省略すると、静的機能がすべてのアカウントに適用されます。

すでに読み込まれたアカウント設定またはランタイム状態から回答を解決してください。このフックが制御するのは汎用の現在会話バインディングのみであり、設定済みのバインディングルールや Plugin 所有のセッションルーティングを置き換えるものではありません。コントラクトテストでは、`openclaw/plugin-sdk/channel-core` がエクスポートする `ChannelPlugin["conversationBindings"]` コントラクトを通じて、少なくとも対応アカウントと非対応アカウントを 1 つずつ網羅してください。

## 承認とチャンネル機能

ほとんどのチャンネル Plugin では、承認固有のコードは不要です。コアが同一チャットの `/approve`、共有の承認ボタンペイロード、汎用フォールバック配信を担います。`ChannelPlugin.approvals` は削除されました。代わりに、承認の配信、ネイティブ、レンダリング、認可に関するファクトを 1 つの `approvalCapability` オブジェクトに配置してください。`plugin.auth` はログイン／ログアウト専用です。コアはこのオブジェクトから承認認可フックを読み取らなくなりました。

`approvalCapability.delivery` はネイティブ承認のルーティングまたはフォールバック抑制にのみ使用し、`approvalCapability.render` は共有レンダラーではなくカスタム承認ペイロードが本当に必要な場合にのみ使用してください。

### 承認認可

- `approvalCapability.authorizeActorAction` と
  `approvalCapability.getActionAvailabilityState` が正規の承認認可シームです。
- 同一チャットの承認認可が利用可能かどうかには、`getActionAvailabilityState` を使用します。
  ネイティブ配信が無効な場合でも、設定済みの承認者を `/approve` で利用可能な状態に維持してください。配信／セットアップのガイダンスには、代わりにネイティブの開始元サーフェス状態を使用します。
- チャンネルがネイティブの実行承認を公開し、開始元サーフェス／ネイティブクライアントの状態が同一チャットの承認認可と異なる場合は、`approvalCapability.getExecInitiatingSurfaceState` を使用します。コアはこの実行固有のフックを使用して `enabled` と `disabled` を区別し、開始元チャンネルがネイティブの実行承認に対応するかどうかを判断し、ネイティブクライアントのフォールバックガイダンスにそのチャンネルを含めます。一般的なケースでは、`createApproverRestrictedNativeApprovalCapability(...)` がこれを設定します。
- チャンネルが既存の設定から安定した所有者相当の DM 識別情報を推論できる場合は、承認固有のコアロジックを追加せずに同一チャットの `/approve` を制限するため、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使用します。
- カスタム承認認可が意図的に同一チャットのフォールバックのみを許可する場合は、`openclaw/plugin-sdk/approval-auth-runtime` から `markImplicitSameChatApprovalAuthorization({ authorized: true })` を返してください。それ以外の場合、コアは結果を明示的な承認者の認可として扱います。
- チャンネル所有のネイティブコールバックが承認を直接解決する場合は、解決前に `isImplicitSameChatApprovalAuthorization(...)` を使用し、暗黙的なフォールバックもチャンネルの通常のアクター認可を通過するようにします。

### ペイロードのライフサイクルとセットアップガイダンス

- ローカルで重複する承認プロンプトを非表示にする、配信前に入力中インジケーターを送信するなど、チャンネル固有のペイロードライフサイクル動作には、`outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使用します。
- 無効時の返信で、ネイティブの実行承認を有効にするために必要な設定項目を正確に説明する場合は、`approvalCapability.describeExecApprovalSetup` を使用します。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントを使用するチャンネルでは、トップレベルのデフォルトではなく、`channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープのパスをレンダリングしてください。
- Plugin 承認でルートが見つからない場合やタイムアウトした場合に、その失敗ガイダンスを安全に表示できる場合は、`approvalCapability.describePluginApprovalSetup` を使用します。`createApproverRestrictedNativeApprovalCapability(...)` は `describeExecApprovalSetup` からこれを推論しません。Plugin の承認と実行承認が本当に同じネイティブセットアップを使用する場合に限り、同じヘルパーを明示的に渡してください。

### ネイティブ承認の配信

チャンネルでネイティブ承認の配信が必要な場合は、チャンネルコードをターゲットの正規化とトランスポート／プレゼンテーションのファクトに集中させます。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使用します。チャンネル固有のファクトを `approvalCapability.nativeRuntime` の背後に配置し、可能であれば `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` を使用してください。これにより、コアがハンドラーを組み立て、リクエストのフィルタリング、ルーティング、重複排除、有効期限、Gateway サブスクリプション、別ルートに配信された旨の通知を担えます。

`nativeRuntime` は、いくつかの小さなシームに分割されています。

- `availability` - アカウントが設定されているか、およびリクエストを
  処理すべきか
- `presentation` - 共有承認ビューモデルを
  保留中／解決済み／期限切れのネイティブペイロードまたは最終アクションにマッピング
- `transport` - ターゲットを準備し、ネイティブ承認メッセージを
  送信／更新／削除
- `interactions` - ネイティブボタンまたはリアクション用のオプションのバインド／バインド解除／アクション消去フックと、オプションの `cancelDelivered` フック。`deliverPending` がプロセス内または永続的な
  状態（リアクションターゲットストアなど）を登録する場合は、
  ハンドラーの停止によって `bindPending` の実行前に配信がキャンセルされたとき、または
  `bindPending` がハンドルを返さないときにその状態を解放できるよう、`cancelDelivered` を実装
- `observe` - オプションの配信診断フック

その他の承認ヘルパー：

- チャネルがセッション起点のネイティブ配信と明示的な承認転送ターゲットの両方をサポートする場合は、
  `openclaw/plugin-sdk/approval-native-runtime` の `createNativeApprovalChannelRouteGates` を使用します。この
  ヘルパーは、承認設定の選択、`mode` の処理、エージェント／セッション
  フィルター、アカウントのバインド、セッションターゲットの照合、ターゲットリストの照合を一元化します。
  一方、呼び出し元は引き続きチャネル ID、デフォルトの転送モード、アカウント
  検索、トランスポート有効化チェック、ターゲットの正規化、ターンソースの
  ターゲット解決を担います。コア所有のチャネルポリシーの
  デフォルトを作成するために使用しないでください。チャネルに文書化されたデフォルトモードを明示的に渡します。
- `createChannelNativeOriginTargetResolver` は、デフォルトで `{ to, accountId, threadId }` ターゲットに共有チャネルルート
  マッチャーを使用します。Slack のタイムスタンプ接頭辞照合など、チャネルにプロバイダー固有の同値ルールがある場合にのみ
  `targetsMatch` を渡します。元のターゲットを配信用に保持しながら、
  デフォルトのルートマッチャーまたはカスタムの `targetsMatch` コールバックが実行される前に
  プロバイダー ID を正規化する必要がある場合は、`normalizeTargetForMatch` を渡します。解決された
  配信ターゲット自体を正規化する必要がある場合にのみ `normalizeTarget` を使用します。
- チャネルがクライアント、トークン、Bolt
  アプリ、Webhook レシーバーなどのランタイム所有オブジェクトを必要とする場合は、
  `openclaw/plugin-sdk/channel-runtime-context` を介して登録します。汎用ランタイムコンテキスト
  レジストリにより、承認固有のラッパー接着コードを追加することなく、コアがチャネルの
  起動状態からケイパビリティ駆動のハンドラーをブートストラップできます。
- ケイパビリティ駆動の境界ではまだ十分に表現できない場合にのみ、低レベルの `createChannelApprovalHandler` または
  `createChannelNativeApprovalRuntime` を使用します。
- ネイティブ承認チャネルは、`accountId` と `approvalKind` の両方を
  これらのヘルパー経由でルーティングする必要があります。`accountId` は複数アカウントの承認ポリシーを
  正しいボットアカウントのスコープに保ち、`approvalKind` はコアにハードコードされた分岐を設けることなく、
  exec と Plugin の承認動作をチャネルで利用可能に保ちます。
- コアは承認の再ルーティング通知も所有します。チャネル Plugin は
  `createChannelNativeApprovalRuntime` から独自の「承認は DM／別のチャネルに送信されました」というフォローアップメッセージを送信しては
  なりません。代わりに、共有承認ケイパビリティヘルパーを通じて正確な送信元 +
  承認者 DM ルーティングを公開し、開始元のチャットへ通知を投稿する前に、
  コアが実際の配信を集約できるようにします。
- 配信された承認 ID の種別をエンドツーエンドで保持します。ネイティブクライアントは
  チャネルローカルの状態から exec と Plugin の承認ルーティングを推測または書き換えてはなりません。
- その明示的な `approvalKind` を `resolveApprovalOverGateway` に渡します。これにより
  正規の `approval.resolve` サービスが使用され、別のサーフェスが先に応答した場合は
  記録された勝者が返されます。古い明示的な `resolveMethod` 入力は
  コマンドベースのコントロール用に残されています。新しいネイティブアクションでは、これを使用したり
  ID から種別を推測したりしてはなりません。
- 承認の種別ごとに、意図的に異なるネイティブ
  サーフェスを公開できます。現在バンドルされている例：Matrix は exec と Plugin の承認で
  同じネイティブ DM／チャネルルーティングとリアクション UX を維持しつつ、
  承認種別ごとに認証を変えられます。Slack は exec と Plugin の両方の ID でネイティブ承認ルーティングを
  利用可能に保ちます。
- `createApproverRestrictedNativeApprovalAdapter` は互換性ラッパーとして
  引き続き存在しますが、新しいコードではケイパビリティビルダーを優先し、
  Plugin 上で `approvalCapability` を公開する必要があります。

### より限定的な承認ランタイムサブパス

ホットなチャネルエントリポイントでは、そのファミリーの一部だけが必要な場合、
より広範な `approval-runtime` バレルよりも、次の限定的なサブパスを優先します：

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

同様に、すべてが必要でない場合は、より広範な包括的サーフェスよりも
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking` を優先します。

### セットアップサブパス

- `openclaw/plugin-sdk/setup-runtime` はランタイムセーフなセットアップヘルパーを対象とします：
  `createSetupTranslator`、インポートセーフなセットアップパッチアダプター
  （`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、検索注記の出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委任された
  セットアッププロキシビルダー。
- `openclaw/plugin-sdk/channel-setup` はオプションインストール用のセットアップ
  ビルダーと、いくつかのセットアップセーフなプリミティブを対象とします：`createOptionalChannelSetupSurface`、
  `createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、
  `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、
  `setSetupChannelEnabled`、および `splitSetupEntries`。
- `moveSingleAccountChannelSectionToDefaultAccount(...)` などの、より重い共有セットアップ／設定ヘルパーも必要な場合にのみ、
  より広範な `openclaw/plugin-sdk/setup` の境界を使用します。

チャネルがセットアップサーフェスで「最初にこの Plugin をインストールしてください」と案内するだけの場合は、
`createOptionalChannelSetupSurface(...)` を優先します。生成された
アダプター／ウィザードは、設定の書き込みと完了処理でフェイルクローズし、
検証、完了処理、ドキュメントリンクのコピーで同じインストール必須メッセージを再利用します。

チャネルが環境変数駆動のセットアップまたは認証をサポートし、汎用の起動／設定
フローがランタイムのロード前にそれらの環境変数名を把握する必要がある場合は、
Plugin マニフェストで `channelEnvVars` を使用して宣言します。チャネルランタイムの `envVars` またはローカル
定数は、オペレーター向けの文言にのみ使用します。

Plugin ランタイムの起動前に、チャネルが `status`、`channels list`、`channels status`、または
SecretRef スキャンに現れる可能性がある場合は、
`package.json` に `openclaw.setupEntry` を追加します。そのエントリポイントは読み取り専用コマンド
パスで安全にインポートでき、それらの概要に必要なチャネルメタデータ、セットアップセーフな設定アダプター、
ステータスアダプター、チャネルシークレットターゲットメタデータを返す必要があります。
セットアップエントリからクライアント、リスナー、トランスポートランタイムを起動しないでください。

メインチャネルエントリのインポートパスも限定的に保ちます。ディスカバリーは、
チャネルを有効化せずにエントリとチャネル Plugin モジュールを評価してケイパビリティを登録できます。
`channel-plugin-api.ts` などのファイルは、セットアップウィザード、トランスポート
クライアント、ソケットリスナー、サブプロセスランチャー、サービス起動モジュールをインポートせずに、
チャネル Plugin オブジェクトをエクスポートする必要があります。
これらのランタイム要素は、`registerFull(...)`、ランタイム
セッター、または遅延ケイパビリティアダプターからロードされるモジュールに配置します。

### その他の限定的なチャネルサブパス

その他のホットなチャネルパスでは、より広範なレガシー
サーフェスよりも限定的なヘルパーを優先します：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers`：複数アカウント設定と
  デフォルトアカウントへのフォールバック用
- `openclaw/plugin-sdk/inbound-envelope` および
  `openclaw/plugin-sdk/channel-inbound`：受信ルート／エンベロープと
  記録・ディスパッチの配線用
- `openclaw/plugin-sdk/channel-targets`：ターゲット解析ヘルパー用
- `openclaw/plugin-sdk/outbound-media`：メディア読み込み用、
  `openclaw/plugin-sdk/channel-outbound`：送信 ID／送信デリゲートおよび
  ペイロード計画用
- 送信ルートが明示的な `replyToId`/`threadId` を保持する必要がある場合、または
  ベースセッションキーが引き続き一致するときに現在の `:thread:`
  セッションを復元する必要がある場合は、`openclaw/plugin-sdk/channel-core` の `buildThreadAwareOutboundSessionRoute(...)` を使用します。
  プラットフォームにネイティブなスレッド配信セマンティクスがある場合、プロバイダー Plugin は
  優先順位、接尾辞の動作、スレッド ID の正規化をオーバーライドできます。
- `openclaw/plugin-sdk/thread-bindings-runtime`：スレッドバインディングのライフサイクルと
  アダプター登録用
- `openclaw/plugin-sdk/agent-media-payload`：レガシーなエージェント／メディア
  ペイロードのフィールド配置が引き続き必要な場合のみ
- `openclaw/plugin-sdk/telegram-command-config`（非推奨：バンドルされた
  Plugin は本番環境で使用していません）：Telegram カスタムコマンドの正規化、
  重複／競合の検証、フォールバック時も安定したコマンド設定
  コントラクト用。新しい Plugin コードでは Plugin ローカルのコマンド設定処理を優先してください

認証専用チャネルでは通常、デフォルトパスだけで十分です。コアが
承認を処理し、Plugin は送信／認証ケイパビリティのみを公開します。Matrix、Slack、Telegram、
カスタムチャットトランスポートなどのネイティブ承認チャネルは、独自の承認
ライフサイクルを実装するのではなく、共有ネイティブヘルパーを使用する必要があります。

## 受信メンションポリシー

受信メンション処理を次の 2 層に分けて維持します：

- Plugin 所有の根拠収集
- 共有ポリシー評価

メンションポリシーの判断には `openclaw/plugin-sdk/channel-mention-gating` を使用します。
より広範な受信ヘルパーバレルが必要な場合にのみ
`openclaw/plugin-sdk/channel-inbound` を使用します。

Plugin ローカルのロジックに適した処理：

- ボットへの返信の検出
- 引用されたボットの検出
- スレッド参加のチェック
- サービス／システムメッセージの除外
- ボットの参加を証明するために必要なプラットフォームネイティブのキャッシュ

共有ヘルパーに適した処理：

- `requireMention`
- 明示的メンションの結果
- 暗黙的メンションの許可リスト
- コマンドのバイパス
- 最終的なスキップ判定

推奨フロー：

1. ローカルのメンション情報を計算します。
2. それらの情報を `resolveInboundMentionDecision({ facts, policy })` に渡します。
3. 受信ゲートで `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、および
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
`isExplicitlyMentioned`、および `canResolveExplicit` は、チャネル独自の
ネイティブメンションメタデータ（メッセージエンティティ、ボットへの返信フラグなど）から取得します。
プラットフォームがそれらを検出できない場合は、`false`/`undefined` の値を指定します。

`api.runtime.channel.mentions` は、すでにランタイム注入に依存している
バンドル済みチャネル Plugin 向けに、同じ共有メンションヘルパーを公開します：
`buildMentionRegexes`、`matchesMentionPatterns`、`matchesMentionWithExplicit`、
`implicitMentionKindWhen`、`resolveInboundMentionDecision`。

`implicitMentionKindWhen` と `resolveInboundMentionDecision` だけが必要な場合は、
無関係な受信ランタイムヘルパーの読み込みを避けるため、
`openclaw/plugin-sdk/channel-mention-gating` からインポートします。

## 手順解説

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準のPluginファイルを作成します。マニフェストがチャンネルを所有することを示すのは、
    `openclaw.plugin.json` 内の `channels` フィールド
    （`kind` フィールドではありません）です。パッケージメタデータの全項目については、
    [Pluginのセットアップと設定](/ja-JP/plugins/sdk-setup#openclaw-channel)を参照してください。

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
    チャンネルアカウント設定ではない、Pluginが所有する設定に使用してください。
    `channelConfigs.acme-chat.schema` は `channels.acme-chat` を検証し、
    Pluginランタイムが読み込まれる前に、設定スキーマ、セットアップ、UIサーフェスで使用される
    コールドパスのソースです。トップレベルフィールドの完全なリファレンスについては、
    [Pluginマニフェスト](/ja-JP/plugins/manifest)を参照してください。

  </Step>

  <Step title="チャンネルPluginオブジェクトを構築する">
    `ChannelPlugin` インターフェースには、多数のオプションのアダプターサーフェスがあります。
    まず最小構成の `id`、`config`、`setup` から始め、
    必要に応じてアダプターを追加してください。

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

    正規のトップレベルDMキーと従来のネストされたキーの両方を受け付けるチャンネルでは、
    `plugin-sdk/channel-config-helpers` のヘルパーを使用してください。`resolveChannelDmAccess`、`resolveChannelDmPolicy`、
    `resolveChannelDmAllowFrom`、`normalizeChannelDmPolicy` は、アカウントローカルの値を継承されたルート値より
    優先します。ランタイムと移行処理が同じコントラクトを読み取るように、同じリゾルバーを
    `normalizeLegacyDmAliases` によるdoctor修復と組み合わせてください。

    <Accordion title="createChatChannelPluginが提供する機能">
      低レベルのアダプターインターフェースを手動で実装する代わりに、
      宣言的なオプションを渡すと、ビルダーがそれらを構成します。

      | オプション | 接続される機能 |
      | --- | --- |
      | `security.dm` | 設定フィールドからスコープ付きDMセキュリティリゾルバーを構成 |
      | `pairing.text` | コード交換を使用するテキストベースのDMペアリングフロー |
      | `threading` | 返信先モードのリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージID）を返す送信関数。コアが返された配信結果に情報を付与できるよう、同階層の `channel` IDが必要 |

      完全な制御が必要な場合は、宣言的なオプションの代わりに
      生のアダプターオブジェクトを渡すこともできます。

      生のアウトバウンドアダプターでは、`chunker(text, limit, ctx)` 関数を定義できます。
      オプションの `ctx.formatting` は、`maxLinesPerMessage` などの
      配信時のフォーマット判断を保持します。共有アウトバウンド配信によって返信スレッド化と
      チャンク境界が一度だけ解決されるよう、送信前に適用してください。
      ネイティブの返信先が解決された場合、送信コンテキストには
      `replyToIdSource`（`implicit` または `explicit`）も含まれるため、
      ペイロードヘルパーは暗黙の一度限りの返信スロットを消費せずに、
      明示的な返信タグを保持できます。
    </Accordion>

  </Step>

  <Step title="エントリーポイントを接続する">
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

    チャンネルが所有するCLI記述子は `registerCliMetadata(...)` に配置してください。これによりOpenClawは、
    チャンネルランタイム全体を有効化せずにルートヘルプへ表示でき、通常の完全読み込みでも、
    実際のコマンド登録に同じ記述子が使用されます。`registerFull(...)` は
    ランタイム専用処理に使用してください。
    `defineChannelPluginEntry` は登録モードの分割を自動的に処理します。
    `registerFull(...)` でGateway RPCメソッドを登録する場合は、
    Plugin固有のプレフィックスを使用してください。コア管理名前空間
    （`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は
    予約されたままで、常に `operator.admin` に解決されます。
    すべてのオプションについては、
    [エントリーポイント](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry)を参照してください。

  </Step>

  <Step title="セットアップエントリーを追加する">
    オンボーディング中の軽量読み込み用に `setup-entry.ts` を作成します。

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    チャンネルが無効または未設定の場合、OpenClawは完全なエントリーの代わりにこれを読み込みます。
    これにより、セットアップフロー中に重いランタイムコードが読み込まれるのを回避できます。
    詳細については、[セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

    セットアップで安全に使用できるエクスポートをサイドカーモジュールに分割する
    バンドル済みワークスペースチャンネルでは、セットアップ時の明示的なランタイムセッターも
    必要な場合、`openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。

  </Step>

  <Step title="受信メッセージを処理する">
    Pluginはプラットフォームからメッセージを受信し、OpenClawへ転送する必要があります。
    一般的なパターンは、リクエストを検証し、チャンネルの受信ハンドラーを通じて
    ディスパッチするWebhookです。

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
      受信メッセージの処理はチャンネル固有です。各チャンネルPluginは、
      独自の受信パイプラインを所有します。実際のパターンについては、
      バンドル済みのチャンネルPlugin（Microsoft TeamsまたはGoogle ChatのPluginパッケージなど）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` に同一場所のテストを作成します。

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

    共通のテストヘルパーについては、[テスト](/ja-JP/plugins/sdk-testing)を参照してください。

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
    ├── channel.ts            # createChatChannelPlugin による ChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォーム API クライアント
    └── runtime.ts            # ランタイムストア（必要な場合）
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="スレッド化オプション" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、またはカスタムの返信モード
  </Card>
  <Card title="メッセージツールの統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool とアクション検出
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、reservedLiterals、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime を介した TTS、STT、メディア、サブエージェント
  </Card>
  <Card title="チャンネル受信 API" icon="bolt" href="/ja-JP/plugins/sdk-channel-inbound">
    共通の受信イベントライフサイクル：取り込み、解決、記録、ディスパッチ、完了処理
  </Card>
</CardGroup>

<Note>
バンドル済み Plugin の保守と互換性のため、一部のバンドル済みヘルパー境界は現在も存在します。
これらは新しいチャンネル Plugin で推奨されるパターンではありません。
そのバンドル済み Plugin ファミリーを直接保守している場合を除き、共通 SDK
サーフェスの汎用的なチャンネル、セットアップ、返信、ランタイムのサブパスを優先してください。
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
