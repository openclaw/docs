---
read_when:
    - 新しいメッセージングチャンネル Plugin を構築しています
    - OpenClaw をメッセージングプラットフォームに接続したい
    - ChannelPlugin アダプターのサーフェスを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw 向けメッセージングチャネル Plugin の構築手順ガイド
title: チャンネル Plugin の構築
x-i18n:
    generated_at: "2026-04-30T05:26:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw をメッセージングプラットフォームに接続するチャネル Plugin の構築手順を説明します。最後まで進めると、DM セキュリティ、ペアリング、返信スレッド化、アウトバウンドメッセージングを備えた動作するチャネルが完成します。

<Info>
  OpenClaw Plugin をまだ構築したことがない場合は、基本的なパッケージ
  構造とマニフェスト設定について、先に
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

## チャネル Plugin の仕組み

チャネル Plugin は、独自の送信、編集、リアクション用ツールを持つ必要はありません。OpenClaw はコア内に 1 つの共有 `message` ツールを保持します。あなたの Plugin が担うのは次の領域です。

- **設定** — アカウント解決とセットアップウィザード
- **セキュリティ** — DM ポリシーと許可リスト
- **ペアリング** — DM 承認フロー
- **セッショングラマー** — プロバイダー固有の会話 ID を、ベースチャット、スレッド ID、親フォールバックに対応付ける方法
- **アウトバウンド** — テキスト、メディア、投票をプラットフォームへ送信すること
- **スレッド化** — 返信をスレッド化する方法
- **Heartbeat 入力表示** — Heartbeat 配信先に対する任意の入力中/ビジー信号

コアは共有メッセージツール、プロンプト配線、外側のセッションキー形状、汎用 `:thread:` ブックキーピング、ディスパッチを担います。

チャネルが受信返信以外で入力インジケーターをサポートする場合は、チャネル Plugin で `heartbeat.sendTyping(...)` を公開してください。コアは Heartbeat モデル実行が始まる前に、解決済みの Heartbeat 配信先を指定してこれを呼び出し、共有の入力中 keepalive/cleanup ライフサイクルを使用します。プラットフォームが明示的な停止信号を必要とする場合は、`heartbeat.clearTyping(...)` を追加してください。

チャネルがメディアソースを運ぶメッセージツールのパラメーターを追加する場合は、それらのパラメーター名を `describeMessageTool(...).mediaSourceParams` で公開してください。コアはその明示的なリストをサンドボックスパス正規化とアウトバウンドメディアアクセスポリシーに使用するため、Plugin はプロバイダー固有のアバター、添付ファイル、カバー画像パラメーターのために共有コアの特別扱いを必要としません。
`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを返すことを推奨します。そうすれば、無関係なアクションが別のアクションのメディア引数を継承しません。公開されるすべてのアクションで意図的に共有されるパラメーターには、フラットな配列も引き続き使えます。

プラットフォームが会話 ID の中に追加スコープを保存する場合は、その解析を `messaging.resolveSessionConversation(...)` で Plugin 内に保持してください。これは、`rawId` をベース会話 ID、任意のスレッド ID、明示的な `baseConversationId`、および任意の `parentConversationCandidates` に対応付ける正規のフックです。
`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/ベース会話へ向かう順序を保ってください。

Plugin コードがルート風フィールドを正規化したり、子スレッドを親ルートと比較したり、`{ channel, to, accountId, threadId }` から安定した重複排除キーを構築したりする必要がある場合は、`openclaw/plugin-sdk/channel-route` を使用してください。このヘルパーは数値スレッド ID をコアと同じ方法で正規化するため、Plugin はアドホックな `String(threadId)` 比較よりもこれを優先してください。
プロバイダー固有のターゲットグラマーを持つ Plugin は、そのパーサーを `resolveChannelRouteTargetWithParser(...)` に注入しても、コアが使用するものと同じルートターゲット形状とスレッドフォールバックセマンティクスを得られます。

チャネルレジストリが起動する前に同じ解析を必要とする同梱 Plugin は、対応する `resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルも公開できます。コアは、ランタイム Plugin レジストリがまだ利用できない場合にのみ、そのブートストラップ安全なサーフェスを使用します。

`messaging.resolveParentConversationCandidates(...)` は、Plugin が汎用/生 ID に親フォールバックを追加するだけでよい場合のレガシー互換フォールバックとして引き続き利用できます。両方のフックが存在する場合、コアはまず `resolveSessionConversation(...).parentConversationCandidates` を使用し、正規フックがそれらを省略した場合にのみ `resolveParentConversationCandidates(...)` にフォールバックします。

## 承認とチャネル機能

ほとんどのチャネル Plugin は承認固有のコードを必要としません。

- コアは同一チャットの `/approve`、共有承認ボタンペイロード、汎用フォールバック配信を担います。
- チャネルが承認固有の動作を必要とする場合は、チャネル Plugin 上の 1 つの `approvalCapability` オブジェクトを優先してください。
- `ChannelPlugin.approvals` は削除されています。承認配信、ネイティブ、レンダリング、認可に関する事実は `approvalCapability` に置いてください。
- `plugin.auth` はログイン/ログアウト専用です。コアはそのオブジェクトから承認認可フックをもう読み取りません。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` が正規の承認認可の継ぎ目です。
- 同一チャット承認の認可可用性には `approvalCapability.getActionAvailabilityState` を使用してください。
- チャネルがネイティブ exec 承認を公開する場合、開始サーフェス/ネイティブクライアント状態が同一チャット承認認可と異なるときは `approvalCapability.getExecInitiatingSurfaceState` を使用してください。コアはこの exec 固有フックを使用して、`enabled` と `disabled` を区別し、開始チャネルがネイティブ exec 承認をサポートするかを判断し、ネイティブクライアントフォールバック案内にそのチャネルを含めます。`createApproverRestrictedNativeApprovalCapability(...)` は一般的なケース向けにこれを埋めます。
- 重複するローカル承認プロンプトの非表示や、配信前の入力インジケーター送信など、チャネル固有のペイロードライフサイクル動作には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使用してください。
- `approvalCapability.delivery` はネイティブ承認ルーティングまたはフォールバック抑制にのみ使用してください。
- チャネル所有のネイティブ承認情報には `approvalCapability.nativeRuntime` を使用してください。ホットなチャネルエントリーポイントでは `createLazyChannelApprovalNativeRuntimeAdapter(...)` で遅延化しておくと、コアが承認ライフサイクルを組み立てられる状態を保ちながら、必要に応じてランタイムモジュールをインポートできます。
- 共有レンダラーではなくチャネルが本当にカスタム承認ペイロードを必要とする場合にのみ、`approvalCapability.render` を使用してください。
- ネイティブ exec 承認を有効にするために必要な正確な設定ノブを、チャネルが無効パスの返信で説明したい場合は、`approvalCapability.describeExecApprovalSetup` を使用してください。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントのチャネルは、トップレベルのデフォルトではなく、`channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープのパスをレンダリングしてください。
- チャネルが既存設定から安定した所有者風の DM アイデンティティを推測できる場合は、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使用して、承認固有のコアロジックを追加せずに同一チャットの `/approve` を制限してください。
- チャネルがネイティブ承認配信を必要とする場合は、チャネルコードをターゲット正規化とトランスポート/プレゼンテーション情報に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使用してください。チャネル固有の情報は `approvalCapability.nativeRuntime` の背後に置き、できれば `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` 経由にしてください。そうすれば、コアがハンドラーを組み立て、リクエストフィルタリング、ルーティング、重複排除、有効期限、Gateway サブスクリプション、別ルート通知を担えます。`nativeRuntime` はいくつかの小さな継ぎ目に分割されています。
- `createChannelNativeOriginTargetResolver` は、デフォルトで `{ to, accountId, threadId }` ターゲットに共有チャネルルートマッチャーを使用します。Slack のタイムスタンプ接頭辞マッチングのような、チャネルにプロバイダー固有の等価性ルールがある場合にのみ `targetsMatch` を渡してください。
- デフォルトルートマッチャーまたはカスタム `targetsMatch` コールバックが実行される前にチャネルがプロバイダー ID を正規化する必要があり、かつ配信用には元のターゲットを保持したい場合は、`normalizeTargetForMatch` を `createChannelNativeOriginTargetResolver` に渡してください。解決済み配信ターゲット自体を正規化すべき場合にのみ、`normalizeTarget` を使用してください。
- `availability` — アカウントが設定されているか、およびリクエストを処理すべきか
- `presentation` — 共有承認ビューモデルを保留中/解決済み/期限切れのネイティブペイロードまたは最終アクションに対応付ける
- `transport` — ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除する
- `interactions` — ネイティブボタンまたはリアクション用の任意の bind/unbind/clear-action フック
- `observe` — 任意の配信診断フック
- チャネルがクライアント、トークン、Bolt アプリ、Webhook レシーバーなどのランタイム所有オブジェクトを必要とする場合は、`openclaw/plugin-sdk/channel-runtime-context` を通じて登録してください。汎用ランタイムコンテキストレジストリにより、コアは承認固有のラッパー接着コードを追加せずに、チャネル起動状態から機能駆動ハンドラーをブートストラップできます。
- 低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` は、機能駆動の継ぎ目がまだ十分に表現力を持たない場合にのみ使用してください。
- ネイティブ承認チャネルは、それらのヘルパーを通じて `accountId` と `approvalKind` の両方をルーティングしなければなりません。`accountId` はマルチアカウント承認ポリシーを正しいボットアカウントにスコープし、`approvalKind` はコアにハードコード分岐を置かずに exec と Plugin の承認動作をチャネルで利用可能にします。
- コアは承認の再ルーティング通知も担うようになりました。チャネル Plugin は `createChannelNativeApprovalRuntime` から独自の「承認は DM / 別チャネルへ送られました」フォローアップメッセージを送信しないでください。代わりに、共有承認機能ヘルパーを通じて正確なオリジンと承認者 DM ルーティングを公開し、開始チャットへ通知を投稿する前に、実際の配信をコアに集約させてください。
- 配信された承認 ID の種類をエンドツーエンドで保持してください。ネイティブクライアントは、チャネルローカル状態から exec と Plugin の承認ルーティングを推測したり書き換えたりすべきではありません。
- 異なる承認種別が、意図的に異なるネイティブサーフェスを公開することがあります。
  現在の同梱例:
  - Slack は exec ID と Plugin ID の両方でネイティブ承認ルーティングを利用可能にしています。
  - Matrix は exec 承認と Plugin 承認で認可の違いを許容しつつ、同じネイティブ DM/チャネルルーティングとリアクション UX を維持しています。
- `createApproverRestrictedNativeApprovalAdapter` は互換ラッパーとして引き続き存在しますが、新しいコードでは機能ビルダーを優先し、Plugin 上で `approvalCapability` を公開してください。

ホットなチャネルエントリーポイントでは、そのファミリーの一部だけが必要な場合、より狭いランタイムサブパスを優先してください。

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

特にセットアップについては、次のとおりです。

- `openclaw/plugin-sdk/setup-runtime` は、ランタイム安全なセットアップヘルパーを対象とします。
  インポート安全なセットアップパッチアダプター (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)、lookup-note 出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委譲型
  setup-proxy ビルダー
- `openclaw/plugin-sdk/setup-adapter-runtime` は、`createEnvPatchedAccountSetupAdapter` 向けの狭い env 対応アダプターの継ぎ目です。
- `openclaw/plugin-sdk/channel-setup` は、任意インストールのセットアップ
  ビルダーと、いくつかのセットアップ安全なプリミティブを対象とします。
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

チャネルが env 駆動のセットアップまたは認可をサポートし、汎用の起動/設定フローがランタイム読み込み前にそれらの env 名を知る必要がある場合は、Plugin マニフェストで `channelEnvVars` として宣言してください。チャネルランタイムの `envVars` またはローカル定数は、運用者向けコピー専用にしてください。

チャンネルが Plugin ランタイムの開始前に `status`、`channels list`、`channels status`、または SecretRef スキャンに表示される可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加します。このエントリポイントは読み取り専用コマンドパスで安全にインポートでき、これらの概要に必要なチャンネルメタデータ、セットアップ安全な config アダプター、status アダプター、チャンネルシークレットターゲットメタデータを返す必要があります。セットアップエントリからクライアント、リスナー、transport ランタイムを開始しないでください。

メインチャンネルエントリのインポートパスも狭く保ちます。Discovery はチャンネルを有効化せずに、エントリとチャンネル Plugin モジュールを評価して capabilities を登録できます。`channel-plugin-api.ts` のようなファイルは、セットアップウィザード、transport クライアント、ソケットリスナー、サブプロセスランチャー、サービス起動モジュールをインポートせずに、チャンネル Plugin オブジェクトをエクスポートする必要があります。これらのランタイム部品は、`registerFull(...)`、ランタイム setter、または遅延 capability アダプターから読み込まれるモジュールに配置します。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および
`splitSetupEntries`

- `moveSingleAccountChannelSectionToDefaultAccount(...)` のような、より重い共有セットアップ/config ヘルパーも必要な場合にのみ、より広い `openclaw/plugin-sdk/setup` 境界を使用します

チャンネルがセットアップサーフェスで「まずこの Plugin をインストールしてください」とだけ案内したい場合は、`createOptionalChannelSetupSurface(...)` を優先します。生成されるアダプター/ウィザードは config 書き込みと finalization で fail closed になり、validation、finalize、docs-link copy で同じインストール必須メッセージを再利用します。

その他のホットなチャンネルパスでは、広いレガシーサーフェスより狭いヘルパーを優先します。

- マルチアカウント config とデフォルトアカウント fallback には `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers`
- inbound route/envelope と record-and-dispatch wiring には `openclaw/plugin-sdk/inbound-envelope` と
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- ターゲットの parsing/matching には `openclaw/plugin-sdk/messaging-targets`
- メディア読み込みに加え、outbound identity/send delegates と payload planning には `openclaw/plugin-sdk/outbound-media` と
  `openclaw/plugin-sdk/outbound-runtime`
- outbound route が明示的な `replyToId`/`threadId` を保持する必要がある場合、またはベースセッションキーがまだ一致している後に現在の `:thread:` セッションを復元する必要がある場合は、`openclaw/plugin-sdk/channel-core` の `buildThreadAwareOutboundSessionRoute(...)`。Provider Plugin は、プラットフォームにネイティブのスレッド配信セマンティクスがある場合、優先順位、suffix behavior、thread id normalization を上書きできます。
- thread-binding lifecycle と adapter registration には `openclaw/plugin-sdk/thread-bindings-runtime`
- レガシー agent/media payload のフィールドレイアウトがまだ必要な場合にのみ `openclaw/plugin-sdk/agent-media-payload`
- Telegram カスタムコマンドの normalization、duplicate/conflict validation、fallback-stable なコマンド config contract には `openclaw/plugin-sdk/telegram-command-config`

auth 専用チャンネルは通常、デフォルトパスで十分です。core が approvals を処理し、Plugin は outbound/auth capabilities だけを公開します。Matrix、Slack、Telegram、カスタムチャット transport などのネイティブ approval チャンネルは、独自の approval lifecycle を作るのではなく、共有のネイティブヘルパーを使用する必要があります。

## inbound mention ポリシー

inbound mention handling は 2 つのレイヤーに分けておきます。

- Plugin が所有する evidence gathering
- 共有 policy evaluation

mention-policy の判断には `openclaw/plugin-sdk/channel-mention-gating` を使用します。より広い inbound helper barrel が必要な場合にのみ、`openclaw/plugin-sdk/channel-inbound` を使用します。

Plugin ローカルロジックに適したもの:

- reply-to-bot detection
- quoted-bot detection
- thread-participation checks
- service/system-message exclusions
- bot participation を証明するために必要な platform-native caches

共有ヘルパーに適したもの:

- `requireMention`
- explicit mention result
- implicit mention allowlist
- command bypass
- final skip decision

推奨フロー:

1. ローカルの mention facts を計算します。
2. それらの facts を `resolveInboundMentionDecision({ facts, policy })` に渡します。
3. inbound gate で `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、および `decision.shouldSkip` を使用します。

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

`api.runtime.channel.mentions` は、すでにランタイム injection に依存しているバンドル済みチャンネル Plugin 向けに、同じ共有 mention ヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と `resolveInboundMentionDecision` だけが必要な場合は、無関係な inbound ランタイムヘルパーの読み込みを避けるため、`openclaw/plugin-sdk/channel-mention-gating` からインポートします。

古い `resolveMentionGating*` ヘルパーは、互換性エクスポートとしてのみ `openclaw/plugin-sdk/channel-inbound` に残っています。新しいコードでは `resolveInboundMentionDecision({ facts, policy })` を使用してください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージと manifest">
    標準の Plugin ファイルを作成します。`package.json` の `channel` フィールドが、これをチャンネル Plugin にします。完全なパッケージメタデータサーフェスについては、[Plugin のセットアップと config](/ja-JP/plugins/sdk-setup#openclaw-channel) を参照してください。

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

    `configSchema` は `plugins.entries.acme-chat.config` を検証します。チャンネルアカウント config ではない、Plugin が所有する設定に使用します。`channelConfigs` は `channels.acme-chat` を検証し、Plugin ランタイムが読み込まれる前に config schema、セットアップ、UI サーフェスで使用される cold-path source です。

  </Step>

  <Step title="チャンネル Plugin オブジェクトを構築する">
    `ChannelPlugin` インターフェイスには多くの任意 adapter サーフェスがあります。最小構成である `id` と `setup` から始め、必要に応じて adapter を追加します。

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

    canonical な top-level DM keys とレガシーの nested keys の両方を受け入れるチャンネルでは、`plugin-sdk/channel-config-helpers` のヘルパーを使用します。`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom`、および `normalizeChannelDmPolicy` は、継承された root 値より account-local 値を優先します。同じ resolver を `normalizeLegacyDmAliases` による doctor repair と組み合わせることで、ランタイムと migration が同じ contract を読み取るようにします。

    <Accordion title="createChatChannelPlugin が行うこと">
      低レベルの adapter インターフェイスを手動で実装する代わりに、宣言的な options を渡すと、builder がそれらを合成します。

      | Option | wiring される内容 |
      | --- | --- |
      | `security.dm` | config フィールドからのスコープ付き DM security resolver |
      | `pairing.text` | code exchange を伴う text-based DM pairing flow |
      | `threading` | Reply-to-mode resolver (fixed、account-scoped、または custom) |
      | `outbound.attachedResults` | result metadata (message IDs) を返す send functions |

      完全な制御が必要な場合は、宣言的な options の代わりに raw adapter objects を渡すこともできます。

      Raw outbound アダプターは `chunker(text, limit, ctx)` 関数を定義できます。
      任意の `ctx.formatting` には、`maxLinesPerMessage` などの配信時のフォーマット判断が含まれます。送信前に適用することで、返信スレッド化とチャンク境界が共有アウトバウンド配信によって一度だけ解決されます。
      送信コンテキストには、ネイティブ返信先が解決されたときに `replyToIdSource`（`implicit` または `explicit`）も含まれるため、ペイロードヘルパーは暗黙的な単回使用の返信スロットを消費せずに、明示的な返信タグを保持できます。
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

    チャネル所有の CLI ディスクリプターは `registerCliMetadata(...)` に置きます。これにより OpenClaw は完全なチャネルランタイムを有効化せずにルートヘルプへ表示でき、通常の完全ロードでも実際のコマンド登録に同じディスクリプターを利用できます。
    ランタイム専用の処理は `registerFull(...)` に保持します。
    `registerFull(...)` が Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックスを使用します。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、常に `operator.admin` に解決されます。
    `defineChannelPluginEntry` は登録モードの分割を自動的に処理します。すべてのオプションについては
    [エントリーポイント](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="セットアップエントリーを追加する">
    オンボーディング中の軽量ロード用に `setup-entry.ts` を作成します。

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    チャネルが無効または未設定の場合、OpenClaw は完全エントリーの代わりにこれをロードします。
    これにより、セットアップフロー中に重いランタイムコードを読み込まずに済みます。
    詳細は [セットアップと設定](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップ安全なエクスポートをサイドカーモジュールへ分割している同梱ワークスペースチャネルは、明示的なセットアップ時ランタイム setter も必要な場合に `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。

  </Step>

  <Step title="インバウンドメッセージを処理する">
    Plugin はプラットフォームからメッセージを受け取り、それらを OpenClaw に転送する必要があります。
    典型的なパターンは、リクエストを検証し、チャネルのインバウンドハンドラーを通じてディスパッチする Webhook です。

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      インバウンドメッセージ処理はチャネル固有です。各チャネルPluginは自身のインバウンドパイプラインを所有します。
      実際のパターンについては、同梱チャネルPlugin（たとえば Microsoft Teams または Google Chat の Plugin パッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` に同じ場所のテストを記述します。

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
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime 経由の TTS、STT、メディア、サブエージェント
  </Card>
  <Card title="チャネルターンカーネル" icon="bolt" href="/ja-JP/plugins/sdk-channel-turn">
    共有インバウンドターンライフサイクル: 取り込み、解決、記録、ディスパッチ、完了処理
  </Card>
</CardGroup>

<Note>
一部の同梱ヘルパーの継ぎ目は、同梱Pluginのメンテナンスと互換性のためにまだ存在します。
これらは新しいチャネルPluginに推奨されるパターンではありません。その同梱Pluginファミリーを直接メンテナンスしている場合を除き、共通 SDK サーフェスの汎用チャネル、セットアップ、返信、ランタイムのサブパスを優先してください。
</Note>

## 次のステップ

- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) — Plugin がモデルも提供する場合
- [SDK 概要](/ja-JP/plugins/sdk-overview) — サブパスインポートの完全なリファレンス
- [SDK テスト](/ja-JP/plugins/sdk-testing) — テストユーティリティと契約テスト
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマ

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [エージェントハーネスPlugin](/ja-JP/plugins/sdk-agent-harness)
