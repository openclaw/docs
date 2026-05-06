---
read_when:
    - 新しいメッセージングチャネル Plugin を構築しています
    - OpenClawをメッセージングプラットフォームに接続したい
    - ChannelPlugin アダプターサーフェスを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw 向けメッセージングチャネル Plugin を構築するためのステップバイステップガイド
title: チャネル Plugin の構築
x-i18n:
    generated_at: "2026-05-06T05:13:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw をメッセージングプラットフォームへ接続するチャネル Plugin の構築手順を説明します。最後まで進めると、DM セキュリティ、ペアリング、返信スレッド化、アウトバウンドメッセージングを備えた動作するチャネルが完成します。

<Info>
  まだ OpenClaw Plugin を構築したことがない場合は、基本的なパッケージ構造とマニフェスト設定について、まず
  [はじめに](/ja-JP/plugins/building-plugins)を読んでください。
</Info>

## チャネル Plugin の仕組み

チャネル Plugin には、独自の送信/編集/リアクションツールは不要です。OpenClaw はコア内に 1 つの共有 `message` ツールを保持します。Plugin が担当するのは次の項目です。

- **設定** - アカウント解決とセットアップウィザード
- **セキュリティ** - DM ポリシーと許可リスト
- **ペアリング** - DM 承認フロー
- **セッション文法** - プロバイダー固有の会話 ID を、ベースチャット、スレッド ID、親フォールバックへどうマッピングするか
- **アウトバウンド** - テキスト、メディア、投票をプラットフォームへ送信
- **スレッド化** - 返信をどうスレッド化するか
- **Heartbeat 入力中表示** - Heartbeat 配信ターゲット向けの任意の入力中/ビジーシグナル

コアは共有メッセージツール、プロンプト配線、外側のセッションキー形状、汎用 `:thread:` 帳簿管理、ディスパッチを担当します。

新しいチャネル Plugin では、`openclaw/plugin-sdk/channel-message` の
`defineChannelMessageAdapter` を使って `message` アダプターも公開する必要があります。このアダプターは、ネイティブトランスポートが実際にサポートする永続的な最終送信機能を宣言し、テキスト/メディア送信をレガシー `outbound` アダプターと同じトランスポート関数へ向けます。機能は、ネイティブの副作用と返される受領書を契約テストで証明できる場合にのみ宣言してください。
完全な API 契約、例、機能マトリクス、受領書ルール、ライブプレビューの確定、受信 ack ポリシー、テスト、移行表については、[チャネルメッセージ API](/ja-JP/plugins/sdk-channel-message)を参照してください。
既存の `outbound` アダプターに適切な送信メソッドと機能メタデータがすでにある場合は、別のブリッジを手書きする代わりに、`createChannelMessageAdapterFromOutbound(...)` を使って `message` アダプターを導出してください。
アダプター送信は `MessageReceipt` 値を返す必要があります。互換性コードでまだレガシー ID が必要な場合は、新しいライフサイクルコードに並列の `messageIds` フィールドを保持するのではなく、`listMessageReceiptPlatformIds(...)` または `resolveMessageReceiptPrimaryId(...)` で導出してください。
プレビュー対応チャネルでは、`draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming`、`quietFinalization` など、自身が所有する正確なライブライフサイクルを `message.live.capabilities` で宣言する必要もあります。ドラフトプレビューをその場で確定するチャネルは、`finalEdit`、`normalFallback`、`discardPending`、`previewReceipt`、`retainOnAmbiguousFailure` などを `message.live.finalizer.capabilities` でも宣言し、ランタイムロジックを `defineFinalizableLivePreviewAdapter(...)` と `deliverWithFinalizableLivePreviewAdapter(...)` に通してください。これらの機能は、`verifyChannelMessageLiveCapabilityAdapterProofs(...)` と `verifyChannelMessageLiveFinalizerProofs(...)` のテストで裏付け、ネイティブプレビュー、進捗、編集、フォールバック/保持、クリーンアップ、受領書の挙動が静かにずれないようにしてください。
プラットフォーム確認応答を遅延するインバウンド受信側は、ack タイミングをモニター内ローカル状態に隠すのではなく、`message.receive.defaultAckPolicy` と `supportedAckPolicies` を宣言する必要があります。宣言したすべてのポリシーを `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` でカバーしてください。

`createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply` などのレガシー返信/ターンヘルパーは、互換性ディスパッチャー向けに引き続き利用できます。新しいチャネルコードではこれらの名前を使用しないでください。新しい Plugin は、`openclaw/plugin-sdk/channel-message` 上の `message` アダプター、受領書、受信/送信ライフサイクルヘルパーから始める必要があります。

チャネルがインバウンド返信以外で入力中インジケーターをサポートする場合は、チャネル Plugin で `heartbeat.sendTyping(...)` を公開してください。コアは Heartbeat モデル実行が開始する前に、解決済みの Heartbeat 配信ターゲットでこれを呼び出し、共有の入力中 keepalive/クリーンアップライフサイクルを使用します。プラットフォームが明示的な停止シグナルを必要とする場合は、`heartbeat.clearTyping(...)` を追加してください。

チャネルがメディアソースを運ぶメッセージツールパラメーターを追加する場合は、それらのパラメーター名を `describeMessageTool(...).mediaSourceParams` で公開してください。コアはその明示的なリストをサンドボックスパス正規化とアウトバウンドメディアアクセスポリシーに使用するため、Plugin はプロバイダー固有のアバター、添付ファイル、カバー画像パラメーターのために共有コアの特別扱いを必要としません。
`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを返すことを推奨します。そうすれば、無関係なアクションが別のアクションのメディア引数を継承しません。すべての公開アクションで意図的に共有されるパラメーターには、フラット配列も引き続き使用できます。

チャネルで `message(action="send")` にプロバイダー固有の整形が必要な場合は、`actions.prepareSendPayload(...)` を優先してください。ネイティブカード、ブロック、埋め込み、その他の永続データは `payload.channelData.<channel>` の下に置き、実際の送信はコアにアウトバウンド/メッセージアダプター経由で実行させてください。シリアライズして再試行できないペイロードの互換性フォールバックとしてのみ、送信に `actions.handleAction(...)` を使用してください。

プラットフォームが会話 ID の内部に追加スコープを保存する場合は、その解析を Plugin 内の `messaging.resolveSessionConversation(...)` に保持してください。これは `rawId` をベース会話 ID、任意のスレッド ID、明示的な `baseConversationId`、任意の `parentConversationCandidates` にマッピングするための正規フックです。
`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/ベース会話の順に並べてください。

Plugin コードでルートのようなフィールドを正規化する、子スレッドを親ルートと比較する、または `{ channel, to, accountId, threadId }` から安定した重複排除キーを構築する必要がある場合は、`openclaw/plugin-sdk/channel-route` を使用してください。このヘルパーは、コアと同じ方法で数値スレッド ID を正規化するため、Plugin はアドホックな `String(threadId)` 比較よりもこれを優先する必要があります。
プロバイダー固有のターゲット文法を持つ Plugin は、そのパーサーを `resolveChannelRouteTargetWithParser(...)` に注入しながら、コアが使用するものと同じルートターゲット形状とスレッドフォールバックセマンティクスを得ることができます。

チャネルレジストリが起動する前に同じ解析を必要とする同梱 Plugin は、対応する `resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルを公開することもできます。コアは、ランタイム Plugin レジストリがまだ利用できない場合にのみ、そのブートストラップセーフなサーフェスを使用します。

`messaging.resolveParentConversationCandidates(...)` は、Plugin が汎用/生 ID の上に親フォールバックだけを必要とする場合のレガシー互換性フォールバックとして引き続き利用できます。両方のフックが存在する場合、コアはまず `resolveSessionConversation(...).parentConversationCandidates` を使用し、正規フックがそれを省略した場合にのみ `resolveParentConversationCandidates(...)` にフォールバックします。

## 承認とチャネル機能

ほとんどのチャネル Plugin には、承認固有のコードは不要です。

- コアは同一チャットの `/approve`、共有承認ボタンのペイロード、汎用フォールバック配信を所有します。
- チャンネルが承認固有の動作を必要とする場合は、チャンネル Plugin 上の単一の `approvalCapability` オブジェクトを優先してください。
- `ChannelPlugin.approvals` は削除されています。承認の配信、ネイティブ、レンダリング、認可に関する事実は `approvalCapability` に置いてください。
- `plugin.auth` はログイン/ログアウト専用です。コアはそのオブジェクトから承認 auth フックを読み取らなくなりました。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` が標準の承認 auth シームです。
- 同一チャット承認 auth の可用性には `approvalCapability.getActionAvailabilityState` を使ってください。
- チャンネルがネイティブ exec 承認を公開する場合、開始サーフェス/ネイティブクライアントの状態が同一チャット承認 auth と異なるときは、`approvalCapability.getExecInitiatingSurfaceState` を使ってください。コアはその exec 固有フックを使って `enabled` と `disabled` を区別し、開始元チャンネルがネイティブ exec 承認をサポートするかを判断し、ネイティブクライアントのフォールバック案内にそのチャンネルを含めます。`createApproverRestrictedNativeApprovalCapability(...)` は一般的なケースでこれを補完します。
- 重複するローカル承認プロンプトを隠す、配信前に入力中インジケーターを送信するなど、チャンネル固有のペイロードライフサイクル動作には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使ってください。
- `approvalCapability.delivery` はネイティブ承認ルーティングまたはフォールバック抑制のみに使ってください。
- チャンネル所有のネイティブ承認情報には `approvalCapability.nativeRuntime` を使ってください。ホットなチャンネルエントリポイントでは `createLazyChannelApprovalNativeRuntimeAdapter(...)` で遅延させてください。これにより、コアが承認ライフサイクルを組み立てられる状態を保ちながら、必要に応じてランタイムモジュールを import できます。
- `approvalCapability.render` は、チャンネルが共有レンダラーではなく本当にカスタム承認ペイロードを必要とする場合にのみ使ってください。
- チャンネルが、ネイティブ exec 承認を有効にするために必要な正確な設定ノブを disabled パスの返信で説明したい場合は、`approvalCapability.describeExecApprovalSetup` を使ってください。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントのチャンネルは、トップレベルのデフォルトではなく `channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープのパスをレンダリングしてください。
- チャンネルが既存設定から安定した所有者風の DM ID を推論できる場合は、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使い、承認固有のコアロジックを追加せずに同一チャットの `/approve` を制限してください。
- チャンネルがネイティブ承認配信を必要とする場合は、チャンネルコードをターゲット正規化とトランスポート/表示に関する事実に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使ってください。チャンネル固有の事実は `approvalCapability.nativeRuntime` の背後に置き、理想的には `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` 経由にします。そうすれば、コアがハンドラーを組み立て、リクエストのフィルタリング、ルーティング、重複排除、有効期限、Gateway サブスクリプション、別ルート通知を所有できます。`nativeRuntime` はいくつかの小さなシームに分かれています。
- `createChannelNativeOriginTargetResolver` はデフォルトで、`{ to, accountId, threadId }` ターゲットに共有チャンネルルートマッチャーを使います。Slack タイムスタンプのプレフィックスマッチングのように、チャンネルにプロバイダー固有の等価ルールがある場合にのみ `targetsMatch` を渡してください。
- デフォルトのルートマッチャーまたはカスタム `targetsMatch` コールバックが実行される前に、配信のための元のターゲットを保持しつつプロバイダー ID を正規化する必要がある場合は、`createChannelNativeOriginTargetResolver` に `normalizeTargetForMatch` を渡してください。解決された配信ターゲット自体を正規化すべき場合にのみ `normalizeTarget` を使ってください。
- `availability` - アカウントが設定済みかどうか、およびリクエストを処理すべきかどうか
- `presentation` - 共有承認ビューモデルを保留中/解決済み/期限切れのネイティブペイロードまたは最終アクションにマッピングします
- `transport` - ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除します
- `interactions` - ネイティブボタンまたはリアクション用の任意の bind/unbind/clear-action フック
- `observe` - 任意の配信診断フック
- チャンネルがクライアント、トークン、Bolt アプリ、webhook レシーバーなどのランタイム所有オブジェクトを必要とする場合は、`openclaw/plugin-sdk/channel-runtime-context` 経由で登録してください。汎用ランタイムコンテキストレジストリにより、コアは承認固有のラッパー接着コードを追加せずに、チャンネル起動状態から capability 駆動のハンドラーをブートストラップできます。
- capability 駆動のシームではまだ表現力が足りない場合にのみ、低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` を使ってください。
- ネイティブ承認チャンネルは、それらのヘルパーを通じて `accountId` と `approvalKind` の両方をルーティングする必要があります。`accountId` はマルチアカウント承認ポリシーを適切な bot アカウントにスコープし、`approvalKind` はコアにハードコードされた分岐なしで exec と Plugin 承認の動作をチャンネルで利用可能に保ちます。
- コアは承認の再ルート通知も所有するようになりました。チャンネル Plugin は `createChannelNativeApprovalRuntime` から独自の「承認は DM / 別チャンネルに送られました」フォローアップメッセージを送信しないでください。代わりに、共有承認 capability ヘルパーを通じて正確な origin と承認者 DM ルーティングを公開し、開始元チャットに通知を投稿する前に、コアが実際の配信を集約できるようにしてください。
- 配信された承認 ID の種類をエンドツーエンドで保持してください。ネイティブクライアントは、チャンネルローカル状態から exec と Plugin 承認のルーティングを推測したり書き換えたりしないでください。
- 承認の種類ごとに、意図的に異なるネイティブサーフェスを公開できます。
  現在のバンドル例:
  - Slack は exec と Plugin ID の両方でネイティブ承認ルーティングを利用可能に保ちます。
  - Matrix は exec と Plugin 承認で同じネイティブ DM/チャンネルルーティングとリアクション UX を維持しつつ、承認の種類ごとに auth を変えられるようにしています。
- `createApproverRestrictedNativeApprovalAdapter` は互換性ラッパーとしてまだ存在しますが、新しいコードでは capability ビルダーを優先し、Plugin 上で `approvalCapability` を公開してください。

ホットなチャンネルエントリポイントでは、そのファミリーの一部だけが必要な場合、
より狭いランタイムサブパスを優先してください。

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
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking` を優先してください。

setup については特に:

- `openclaw/plugin-sdk/setup-runtime` はランタイムセーフな setup ヘルパーを対象にします:
  import セーフな setup パッチアダプター（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note 出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委譲された
  setup-proxy ビルダー
- `openclaw/plugin-sdk/setup-adapter-runtime` は `createEnvPatchedAccountSetupAdapter` 用の狭い env 対応アダプターシームです
- `openclaw/plugin-sdk/channel-setup` は optional-install setup
  ビルダーと、いくつかの setup セーフなプリミティブを対象にします:
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

チャンネルが env 駆動の setup または auth をサポートし、汎用の起動/config
フローがランタイム読み込み前にそれらの env 名を知る必要がある場合は、Plugin
マニフェストの `channelEnvVars` で宣言してください。チャンネルランタイムの `envVars` またはローカル定数は、operator 向けの文面専用に保ってください。

チャンネルが Plugin ランタイム開始前に `status`、`channels list`、`channels status`、または
SecretRef スキャンに現れる可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加してください。そのエントリポイントは読み取り専用コマンドパスで安全に import できる必要があり、それらのサマリーに必要なチャンネルメタデータ、setup セーフな config アダプター、status アダプター、チャンネル secret ターゲットメタデータを返す必要があります。setup エントリからクライアント、リスナー、トランスポートランタイムを起動しないでください。

メインチャンネルエントリの import パスも狭く保ってください。Discovery は、チャンネルをアクティブ化せずに、エントリとチャンネル Plugin モジュールを評価して capability を登録できます。`channel-plugin-api.ts` などのファイルは、setup ウィザード、トランスポートクライアント、ソケットリスナー、サブプロセスランチャー、サービス起動モジュールを import せずに、チャンネル Plugin オブジェクトを export してください。それらのランタイム部分は、`registerFull(...)`、ランタイム setter、または遅延 capability アダプターから読み込まれるモジュールに置いてください。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および
`splitSetupEntries`

- `moveSingleAccountChannelSectionToDefaultAccount(...)` などの重い共有 setup/config ヘルパーも必要な場合にのみ、より広い `openclaw/plugin-sdk/setup` シームを使ってください

チャンネルが setup サーフェスで「まずこの Plugin をインストール」とだけ知らせたい場合は、`createOptionalChannelSetupSurface(...)` を優先してください。生成されるアダプター/ウィザードは config 書き込みと finalization で fail closed し、validation、finalize、docs-link 文面で同じインストール必須メッセージを再利用します。

その他のホットなチャンネルパスでは、より広い legacy サーフェスよりも狭いヘルパーを優先してください。

- マルチアカウント config とデフォルトアカウントのフォールバックには
  `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers`
- inbound ルート/envelope と record-and-dispatch 配線には
  `openclaw/plugin-sdk/inbound-envelope` および
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- ターゲットの解析/マッチングには `openclaw/plugin-sdk/messaging-targets`
- メディア読み込みと outbound identity/send delegate およびペイロード計画には
  `openclaw/plugin-sdk/outbound-media` および
  `openclaw/plugin-sdk/outbound-runtime`
- outbound ルートが明示的な `replyToId`/`threadId` を保持する必要がある場合、または base session key がまだ一致した後に現在の `:thread:` セッションを復元する必要がある場合は、
  `openclaw/plugin-sdk/channel-core` の `buildThreadAwareOutboundSessionRoute(...)` を使ってください。Provider Plugin は、そのプラットフォームがネイティブスレッド配信セマンティクスを持つ場合、優先順位、サフィックス動作、thread id 正規化をオーバーライドできます。
- thread-binding ライフサイクルとアダプター登録には
  `openclaw/plugin-sdk/thread-bindings-runtime`
- legacy agent/media ペイロードフィールドレイアウトがまだ必要な場合にのみ
  `openclaw/plugin-sdk/agent-media-payload`
- Telegram カスタムコマンドの正規化、重複/競合検証、フォールバック安定のコマンド config 契約には
  `openclaw/plugin-sdk/telegram-command-config`

auth のみのチャンネルは、通常デフォルトパスで止められます。コアが承認を処理し、Plugin は outbound/auth capability を公開するだけです。Matrix、Slack、Telegram、カスタムチャットトランスポートなどのネイティブ承認チャンネルは、独自の承認ライフサイクルを実装するのではなく、共有ネイティブヘルパーを使ってください。

## inbound メンションポリシー

inbound メンション処理は 2 つのレイヤーに分けて保ってください。

- Plugin 所有の証拠収集
- 共有ポリシー評価

メンションポリシーの判断には `openclaw/plugin-sdk/channel-mention-gating` を使ってください。
より広い inbound ヘルパーバレルが必要な場合にのみ `openclaw/plugin-sdk/channel-inbound` を使ってください。

Plugin ローカルロジックに適したもの:

- bot への返信検出
- 引用された bot の検出
- スレッド参加チェック
- service/system メッセージの除外
- bot 参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適したもの:

- `requireMention`
- 明示的メンション結果
- 暗黙的メンション許可リスト
- コマンドバイパス
- 最終スキップ判定

推奨フロー:

1. ローカルのメンション情報を計算します。
2. それらの情報を `resolveInboundMentionDecision({ facts, policy })` に渡します。
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

`api.runtime.channel.mentions` は、すでにランタイム注入に依存している同梱チャンネルPlugin向けに、同じ共有メンションヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と
`resolveInboundMentionDecision` だけが必要な場合は、関連しないインバウンドランタイムヘルパーの読み込みを避けるため、
`openclaw/plugin-sdk/channel-mention-gating` からインポートしてください。

古い `resolveMentionGating*` ヘルパーは、互換性エクスポートとしてのみ
`openclaw/plugin-sdk/channel-inbound` に残っています。新しいコードでは
`resolveInboundMentionDecision({ facts, policy })` を使用してください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準のPluginファイルを作成します。`package.json` の `channel` フィールドが、これをチャンネルPluginにします。パッケージメタデータ全体のサーフェスについては、[Plugin のセットアップと設定](/ja-JP/plugins/sdk-setup#openclaw-channel)を参照してください。

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

    `configSchema` は `plugins.entries.acme-chat.config` を検証します。チャンネルアカウント設定ではない、Plugin所有の設定に使用してください。`channelConfigs` は `channels.acme-chat` を検証し、Pluginランタイムが読み込まれる前に、設定スキーマ、セットアップ、UIサーフェスで使用されるコールドパスのソースです。

  </Step>

  <Step title="チャンネルPluginオブジェクトを構築する">
    `ChannelPlugin` インターフェイスには、多くの任意のアダプターサーフェスがあります。最小構成である `id` と `setup` から始め、必要に応じてアダプターを追加してください。

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

    正規のトップレベルDMキーと従来のネストされたキーの両方を受け付けるチャンネルでは、`plugin-sdk/channel-config-helpers` のヘルパーを使用します。`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom`、`normalizeChannelDmPolicy` は、継承されたルート値よりもアカウントローカルの値を優先します。同じリゾルバーを `normalizeLegacyDmAliases` による doctor 修復と組み合わせることで、ランタイムと移行が同じ契約を読み取るようにします。

    <Accordion title="createChatChannelPlugin が代行すること">
      低レベルのアダプターインターフェイスを手動で実装する代わりに、宣言的なオプションを渡すと、ビルダーがそれらを合成します。

      | オプション | 配線される内容 |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付きDMセキュリティリゾルバー |
      | `pairing.text` | コード交換を伴うテキストベースのDMペアリングフロー |
      | `threading` | 返信先モードリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージID）を返す送信関数 |

      完全な制御が必要な場合は、宣言的なオプションの代わりに生のアダプターオブジェクトを渡すこともできます。

      生のアウトバウンドアダプターは、`chunker(text, limit, ctx)` 関数を定義できます。任意の `ctx.formatting` には、`maxLinesPerMessage` などの配信時のフォーマット判定が含まれます。共有アウトバウンド配信によって返信スレッド化とチャンク境界が一度だけ解決されるよう、送信前に適用してください。送信コンテキストには、ネイティブ返信ターゲットが解決された場合に `replyToIdSource`（`implicit` または `explicit`）も含まれるため、ペイロードヘルパーは暗黙の一回限りの返信スロットを消費せずに、明示的な返信タグを保持できます。
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

    OpenClaw が完全なチャンネルランタイムを有効化せずにルートヘルプで表示できるよう、チャンネル所有のCLIディスクリプターは `registerCliMetadata(...)` に配置してください。一方で、通常の完全ロードでも実際のコマンド登録のために同じディスクリプターが取得されます。ランタイム専用の作業には `registerFull(...)` を使い続けてください。
    `registerFull(...)` が Gateway RPC メソッドを登録する場合は、Plugin固有のプレフィックスを使用してください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、常に `operator.admin` に解決されます。
    `defineChannelPluginEntry` は登録モードの分割を自動的に処理します。すべてのオプションについては、[エントリーポイント](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry)を参照してください。

  </Step>

  <Step title="セットアップエントリーを追加する">
    オンボーディング中の軽量ロード用に `setup-entry.ts` を作成します。

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    チャンネルが無効または未設定の場合、OpenClaw は完全なエントリーの代わりにこれを読み込みます。これにより、セットアップフロー中に重いランタイムコードを取り込まずに済みます。詳細は[セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

    セットアップセーフなエクスポートをサイドカーモジュールに分割する同梱ワークスペースチャンネルは、明示的なセットアップ時ランタイムセッターも必要な場合に、
    `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。

  </Step>

  <Step title="インバウンドメッセージを処理する">
    Plugin は、プラットフォームからメッセージを受信し、それを OpenClaw に転送する必要があります。一般的なパターンは、リクエストを検証し、チャンネルのインバウンドハンドラーを通じてディスパッチする Webhook です。

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
      インバウンドメッセージ処理はチャンネル固有です。各チャンネルPluginが
      独自のインバウンドパイプラインを所有します。実際のパターンについては、
      バンドル済みチャンネルPlugin
      （たとえば Microsoft Teams または Google Chat のPluginパッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
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
  <Card title="チャンネルターンカーネル" icon="bolt" href="/ja-JP/plugins/sdk-channel-turn">
    共有インバウンドターンのライフサイクル: 取り込み、解決、記録、ディスパッチ、ファイナライズ
  </Card>
</CardGroup>

<Note>
バンドル済みPluginのメンテナンスと互換性のために、一部のバンドル済みヘルパーシームはまだ存在します。
新しいチャンネルPluginに推奨されるパターンではありません。
そのバンドル済みPluginファミリーを直接メンテナンスしている場合を除き、共通SDKサーフェスの汎用的な channel/setup/reply/runtime サブパスを優先してください。
</Note>

## 次のステップ

- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) - Pluginがモデルも提供する場合
- [SDK概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [SDKテスト](/ja-JP/plugins/sdk-testing) - テストユーティリティとコントラクトテスト
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - 完全なマニフェストスキーマ

## 関連

- [Plugin SDKセットアップ](/ja-JP/plugins/sdk-setup)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [エージェントハーネスPlugin](/ja-JP/plugins/sdk-agent-harness)
