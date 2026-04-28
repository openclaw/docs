---
read_when:
    - 新しいメッセージングチャンネルPluginを構築しています
    - OpenClawをメッセージングプラットフォームに接続したい場合
    - ChannelPluginアダプターのサーフェスを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングチャンネルPluginを構築するためのステップバイステップガイド
title: チャンネルPluginの構築
x-i18n:
    generated_at: "2026-04-25T13:54:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

このガイドでは、OpenClawをメッセージングプラットフォームに接続するチャンネルPluginの構築手順を説明します。最終的には、DMセキュリティ、ペアリング、返信スレッディング、送信メッセージングを備えた動作するチャンネルを構築できます。

<Info>
  OpenClawのPluginをまだ一度も構築したことがない場合は、基本的なパッケージ構造とmanifest設定について、先に
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

## チャンネルPluginの仕組み

チャンネルPluginは、自前のsend/edit/reactツールを必要としません。OpenClawはcore内で1つの共有 `message` ツールを維持します。あなたのPluginが担当するのは次の部分です。

- **設定** — アカウント解決とセットアップウィザード
- **セキュリティ** — DMポリシーとallowlist
- **ペアリング** — DM承認フロー
- **セッショングラマー** — プロバイダー固有の会話IDを、どのようにベースチャット、スレッドID、親フォールバックへ対応付けるか
- **送信** — プラットフォームへのテキスト、メディア、pollの送信
- **スレッディング** — 返信をどのようにスレッド化するか
- **Heartbeat typing** — heartbeat配信先向けの任意の入力中/処理中シグナル

coreが担当するのは、共有messageツール、prompt配線、外側のsession-key形状、汎用 `:thread:` 管理、およびディスパッチです。

チャンネルが受信返信以外でも入力中インジケーターをサポートする場合は、チャンネルPlugin上で `heartbeat.sendTyping(...)` を公開してください。coreは、heartbeatモデル実行開始前に、解決済みheartbeat配信先を使ってこれを呼び出し、共有の入力中keepalive/cleanupライフサイクルを使います。プラットフォームで明示的な停止シグナルが必要な場合は、`heartbeat.clearTyping(...)` も追加してください。

チャンネルが、message-toolパラメーターとしてメディアソースを運ぶものを追加する場合は、`describeMessageTool(...).mediaSourceParams` を通じてそれらのパラメーター名を公開してください。coreはその明示的な一覧を使ってsandboxパス正規化と送信メディアアクセスポリシーを行うため、Pluginはプロバイダー固有のavatar、attachment、cover-imageパラメーター向けに共有coreの特別扱いを必要としません。  
無関係なアクションが別のアクションのメディア引数を継承しないよう、`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを返すことを推奨します。フラットな配列でも、意図的にすべての公開アクションで共有されるパラメーターには引き続き使えます。

プラットフォームが会話ID内に追加のスコープを保持する場合、そのパースはPlugin内の `messaging.resolveSessionConversation(...)` に残してください。これは `rawId` をベース会話ID、任意のスレッドID、明示的な `baseConversationId`、および任意の `parentConversationCandidates` に対応付けるための正規フックです。`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/ベース会話までの順序を維持してください。

チャンネルレジストリ起動前に同じパースが必要なバンドル済みPluginは、対応する `resolveSessionConversation(...)` exportを持つトップレベルの `session-key-api.ts` ファイルも公開できます。coreは、実行時Pluginレジストリがまだ利用できない場合にのみ、このbootstrap-safeなサーフェスを使います。

`messaging.resolveParentConversationCandidates(...)` は、Pluginが汎用/raw idの上に親フォールバックだけを必要とする場合の旧来互換フォールバックとして引き続き利用できます。両方のフックが存在する場合、coreはまず `resolveSessionConversation(...).parentConversationCandidates` を使い、その正規フックがそれらを省略した場合にのみ `resolveParentConversationCandidates(...)` にフォールバックします。

## 承認とチャンネルcapability

ほとんどのチャンネルPluginでは、承認専用コードは不要です。

- coreは、同一チャット内 `/approve`、共有承認ボタンペイロード、汎用フォールバック配信を担当します。
- チャンネルが承認固有の動作を必要とする場合は、チャンネルPlugin上で1つの `approvalCapability` オブジェクトを使うことを推奨します。
- `ChannelPlugin.approvals` は削除されました。承認配信/ネイティブ/レンダリング/認証の事実は `approvalCapability` に置いてください。
- `plugin.auth` は login/logout 専用です。coreは、そのオブジェクトから承認認証フックをもう読みません。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` が正規の承認認証シームです。
- 同一チャット承認認証の可用性には `approvalCapability.getActionAvailabilityState` を使ってください。
- チャンネルがネイティブexec承認を公開する場合、開始元サーフェス/ネイティブクライアント状態が同一チャット承認認証と異なるときは `approvalCapability.getExecInitiatingSurfaceState` を使ってください。coreはこのexec専用フックを使って `enabled` と `disabled` を区別し、開始元チャンネルがネイティブexec承認をサポートするかを判断し、ネイティブクライアントのフォールバックガイダンスにそのチャンネルを含めます。一般的なケースでは `createApproverRestrictedNativeApprovalCapability(...)` がこれを埋めます。
- 重複するローカル承認プロンプトを隠す、配信前に入力中シグナルを送るなど、チャンネル固有のペイロードライフサイクル動作には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使ってください。
- `approvalCapability.delivery` は、ネイティブ承認ルーティングまたはフォールバック抑制にのみ使ってください。
- `approvalCapability.nativeRuntime` は、チャンネル所有のネイティブ承認情報に使ってください。hotなチャンネルエントリーポイントでは、`createLazyChannelApprovalNativeRuntimeAdapter(...)` を使ってこれをlazyに保ってください。これにより、coreが承認ライフサイクルを組み立てられる状態を保ちながら、必要時にランタイムモジュールをimportできます。
- `approvalCapability.render` は、チャンネルが共有rendererではなく、本当にカスタム承認ペイロードを必要とする場合にのみ使ってください。
- `approvalCapability.describeExecApprovalSetup` は、チャンネルが無効パスの返信で、ネイティブexec承認を有効にするために必要な正確な設定ノブを説明したい場合に使ってください。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントチャンネルでは、トップレベルのデフォルトではなく、`channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープ付きパスを表示してください。
- 既存の設定から安定したowner風DMアイデンティティを推測できるチャンネルでは、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使って、approval固有のcoreロジックを追加せずに同一チャット `/approve` を制限してください。
- チャンネルがネイティブ承認配信を必要とする場合、チャンネルコードは対象の正規化と転送/表示の事実に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使ってください。チャンネル固有の事実は `approvalCapability.nativeRuntime` の背後に置き、理想的には `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` 経由にしてください。そうすることで、coreはhandlerを組み立て、リクエストフィルタリング、ルーティング、重複排除、期限切れ、Gateway購読、別経路通知を担当できます。`nativeRuntime` はいくつかの小さなシームに分割されています:
- `availability` — アカウントが設定済みか、また要求を処理すべきか
- `presentation` — 共有承認view modelを保留中/解決済み/期限切れのネイティブペイロードまたは最終アクションへマッピングする
- `transport` — 対象を準備し、ネイティブ承認メッセージを送信/更新/削除する
- `interactions` — ネイティブボタンまたはリアクション向けの任意の bind/unbind/clear-action フック
- `observe` — 任意の配信診断フック
- チャンネルが、client、token、Bolt app、webhook receiver のようなランタイム所有オブジェクトを必要とする場合は、`openclaw/plugin-sdk/channel-runtime-context` を通じて登録してください。汎用runtime-contextレジストリにより、coreはチャンネル起動状態から capability 駆動handlerをbootstrapできます。承認専用のラッパーglueを追加する必要はありません。
- capability 駆動シームではまだ表現力が足りない場合にのみ、より低レベルな `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` に手を伸ばしてください。
- ネイティブ承認チャンネルでは、`accountId` と `approvalKind` の両方をそれらのヘルパー経由でルーティングする必要があります。`accountId` はマルチアカウント承認ポリシーを正しいbotアカウントにスコープし、`approvalKind` はexecとplugin承認の動作を、coreにハードコード分岐を入れずにチャンネル側で利用可能にします。
- coreは現在、承認の再ルーティング通知も担当します。チャンネルPluginは `createChannelNativeApprovalRuntime` から自前の「承認はDM/別チャンネルに送られました」フォローアップメッセージを送るべきではありません。代わりに、共有承認capabilityヘルパー経由で正確なorigin + approver-DMルーティングを公開し、coreが実際の配信を集約してから開始チャットへ通知を返すようにしてください。
- 配信された承認id種別は端から端まで保持してください。ネイティブクライアントは、チャンネルローカル状態からexecかpluginかの承認ルーティングを推測または書き換えてはいけません。
- 異なる承認種別は、意図的に異なるネイティブサーフェスを公開できます。現在のバンドル済み例:
  - Slackは、execとplugin idの両方でネイティブ承認ルーティングを利用可能なままにしています。
  - Matrixは、execとplugin承認で同じネイティブDM/チャンネルルーティングとreaction UXを維持しつつ、承認種別ごとにauthを変えられるようにしています。
- `createApproverRestrictedNativeApprovalAdapter` は互換ラッパーとしてまだ存在しますが、新しいコードでは capability builder を優先し、Plugin上で `approvalCapability` を公開してください。

hotなチャンネルエントリーポイントでは、そのファミリー全体ではなく1部分だけが必要な場合、より狭いruntimeサブパスを優先してください。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広いアンブレラサーフェスが不要な場合は、`openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference`、`openclaw/plugin-sdk/reply-chunking` を優先してください。

セットアップについて特に言うと:

- `openclaw/plugin-sdk/setup-runtime` はランタイム安全なセットアップヘルパーを扱います:
  import-safe なセットアップpatchアダプター（`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`）、lookup-note出力、`promptResolvedAllowFrom`、`splitSetupEntries`、および委譲セットアップproxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime` は、`createEnvPatchedAccountSetupAdapter` 向けの狭いenv対応アダプターシームです
- `openclaw/plugin-sdk/channel-setup` は、任意インストールのセットアップbuilderと、いくつかのセットアップ安全プリミティブを扱います:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

チャンネルがenv駆動のセットアップまたはauthをサポートし、汎用の起動/設定フローがランタイム読み込み前にそれらのenv名を知る必要がある場合は、Plugin manifest内で `channelEnvVars` として宣言してください。チャンネルランタイムの `envVars` やローカル定数は、operator向けコピー専用にしておいてください。

チャンネルが、Pluginランタイム開始前に `status`、`channels list`、`channels status`、または SecretRef スキャンに現れる可能性があるなら、`package.json` に `openclaw.setupEntry` を追加してください。そのエントリーポイントは読み取り専用コマンド経路で安全にimportできる必要があり、チャンネルメタデータ、セットアップ安全なconfigアダプター、statusアダプター、そしてそれらのサマリーに必要なチャンネルsecret targetメタデータを返すべきです。セットアップエントリからclient、listener、transport runtime を開始してはいけません。

メインチャンネルエントリのimportパスも狭く保ってください。discoveryは、そのエントリとチャンネルPluginモジュールを評価してcapabilityを登録できますが、その時点ではチャンネルを有効化しません。`channel-plugin-api.ts` のようなファイルは、セットアップウィザード、transport client、socket listener、subprocess launcher、service startup module をimportせずにチャンネルPluginオブジェクトをexportするべきです。そうしたランタイム部品は、`registerFull(...)`、runtime setter、またはlazy capability adapter から読み込まれるモジュールに置いてください。

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, および
`splitSetupEntries`

- より重い共有セットアップ/configヘルパー、たとえば
  `moveSingleAccountChannelSectionToDefaultAccount(...)` も必要な場合にのみ、より広い `openclaw/plugin-sdk/setup` シームを使用してください

チャンネルがセットアップサーフェスで単に「まずこのPluginをインストールしてください」と広告したいだけなら、`createOptionalChannelSetupSurface(...)` を優先してください。生成されるアダプター/ウィザードは、config書き込みと最終化で fail closed し、検証、finalize、docs-link コピーの各所で同じ install-required メッセージを再利用します。

その他のhotなチャンネル経路でも、より広い旧来サーフェスより狭いヘルパーを優先してください。

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, および
  `openclaw/plugin-sdk/account-helpers` は、マルチアカウント設定と
  default-account フォールバック向け
- `openclaw/plugin-sdk/inbound-envelope` と
  `openclaw/plugin-sdk/inbound-reply-dispatch` は、受信route/envelope と
  record-and-dispatch 配線向け
- `openclaw/plugin-sdk/messaging-targets` は、targetのパース/マッチング向け
- `openclaw/plugin-sdk/outbound-media` と
  `openclaw/plugin-sdk/outbound-runtime` は、メディア読み込みと送信
  identity/send delegate および payload planning 向け
- `openclaw/plugin-sdk/channel-core` の
  `buildThreadAwareOutboundSessionRoute(...)` は、送信routeが明示的な
  `replyToId`/`threadId` を保持する、またはベースsession key がまだ一致する後に
  現在の `:thread:` セッションを復元するべき場合向けです。
  プロバイダーPluginは、自身のプラットフォームにネイティブなthread配信セマンティクスがある場合、
  優先順位、suffix動作、thread id正規化を上書きできます。
- `openclaw/plugin-sdk/thread-bindings-runtime` は、thread-bindingライフサイクル
  とアダプター登録向け
- `openclaw/plugin-sdk/agent-media-payload` は、旧来のagent/media
  payloadフィールドレイアウトがまだ必要な場合のみ
- `openclaw/plugin-sdk/telegram-command-config` は、Telegramカスタムコマンド
  の正規化、重複/競合検証、フォールバック安定なコマンド設定契約向け

認証専用チャンネルでは、通常はデフォルト経路で十分です。coreが承認を処理し、Pluginは送信/auth capability を公開するだけです。Matrix、Slack、Telegram、カスタムチャット転送のようなネイティブ承認チャンネルでは、独自の承認ライフサイクルを作る代わりに共有ネイティブヘルパーを使ってください。

## 受信メンションポリシー

受信メンション処理は、次の2層に分けてください。

- Plugin所有の証拠収集
- 共有ポリシー評価

メンションポリシー判定には `openclaw/plugin-sdk/channel-mention-gating` を使ってください。より広い受信ヘルパーバレルが必要な場合にのみ `openclaw/plugin-sdk/channel-inbound` を使ってください。

Pluginローカルロジックに適しているもの:

- ボットへの返信検出
- ボット引用検出
- スレッド参加チェック
- service/system message 除外
- ボット参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適しているもの:

- `requireMention`
- 明示的メンション結果
- 暗黙的メンションallowlist
- コマンドバイパス
- 最終スキップ判定

推奨フロー:

1. ローカルなメンション事実を計算する。
2. その事実を `resolveInboundMentionDecision({ facts, policy })` に渡す。
3. 受信ゲートでは `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip` を使う。

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

`api.runtime.channel.mentions` は、実行時注入にすでに依存しているバンドル済みチャンネルPlugin向けに、同じ共有メンションヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と
`resolveInboundMentionDecision` だけが必要なら、
無関係な受信ランタイムヘルパーを読み込まないよう
`openclaw/plugin-sdk/channel-mention-gating` からimportしてください。

古い `resolveMentionGating*` ヘルパーは、
`openclaw/plugin-sdk/channel-inbound` 上に互換exportとしてのみ残っています。新しいコードでは
`resolveInboundMentionDecision({ facts, policy })` を使ってください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとmanifest">
    標準のPluginファイルを作成します。`package.json` 内の `channel` フィールドが、これをチャンネルPluginにします。完全なパッケージメタデータサーフェスについては、
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
          "blurb": "OpenClawをAcme Chatに接続します。"
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
      "description": "Acme ChatチャンネルPlugin",
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
              "label": "Botトークン",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` は `plugins.entries.acme-chat.config` を検証します。チャンネルアカウント設定ではない、Plugin所有の設定に使ってください。`channelConfigs` は `channels.acme-chat` を検証し、Pluginランタイム読み込み前に config schema、setup、UIサーフェスで使われるcold-pathソースです。

  </Step>

  <Step title="チャンネルPluginオブジェクトを構築する">
    `ChannelPlugin` インターフェースには、多数の任意アダプターサーフェスがあります。最小限の `id` と `setup` から始め、必要に応じてアダプターを追加してください。

    `src/channel.ts` を作成します:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // あなたのプラットフォームAPIクライアント

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

      // DMセキュリティ: 誰がボットにメッセージできるか
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // ペアリング: 新しいDM連絡先の承認フロー
      pairing: {
        text: {
          idLabel: "Acme Chatユーザー名",
          message: "本人確認のため、このコードを送信してください:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // スレッディング: 返信をどう配信するか
      threading: { topLevelReplyToMode: "reply" },

      // 送信: プラットフォームにメッセージを送る
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

    <Accordion title="createChatChannelPlugin が代わりにやってくれること">
      低レベルのアダプターインターフェースを手動で実装する代わりに、宣言的なオプションを渡すと、builderがそれらを組み立てます。

      | オプション | 配線されるもの |
      | --- | --- |
      | `security.dm` | configフィールドからのスコープ付きDMセキュリティリゾルバー |
      | `pairing.text` | コード交換を伴うテキストベースDMペアリングフロー |
      | `threading` | reply-to-modeリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージID）を返す送信関数 |

      完全な制御が必要な場合は、宣言的オプションの代わりに生のアダプターオブジェクトを渡すこともできます。

      生の送信アダプターは `chunker(text, limit, ctx)` 関数を定義できます。任意の `ctx.formatting` には、`maxLinesPerMessage` のような配信時フォーマット判定が入ります。返信スレッディングとチャンク境界が共有送信配信によって一度だけ解決されるよう、送信前にそれを適用してください。
      Send context には、ネイティブ返信対象が解決された場合の `replyToIdSource`（`implicit` または `explicit`）も含まれます。これにより、payloadヘルパーは暗黙の単回使用replyスロットを消費せずに、明示的replyタグを保持できます。
    </Accordion>

  </Step>

  <Step title="エントリーポイントを配線する">
    `index.ts` を作成します:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme ChatチャンネルPlugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat管理");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat管理",
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

    チャンネル所有のCLI descriptor は `registerCliMetadata(...)` に置いてください。これにより、OpenClawは完全なチャンネルランタイムを有効化せずにルートhelpへそれらを表示でき、通常の完全ロードでは実際のコマンド登録に同じdescriptorを引き続き使えます。`registerFull(...)` はランタイム専用の処理に残してください。  
`registerFull(...)` がGateway RPCメソッドを登録する場合は、Plugin固有のprefixを使ってください。core管理名前空間（`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`）は予約済みで、常に `operator.admin` に解決されます。  
`defineChannelPluginEntry` は登録モード分岐を自動処理します。全オプションについては [Entry Points](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="セットアップエントリを追加する">
    オンボーディング中の軽量ロード用に `setup-entry.ts` を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClawは、チャンネルが無効または未設定のとき、完全なエントリの代わりにこれを読み込みます。これにより、セットアップフロー中に重いランタイムコードを引き込まずに済みます。詳細は [Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップ安全なexportをsidecarモジュールへ分割しているバンドル済みワークスペースチャンネルでは、
    `openclaw/plugin-sdk/channel-entry-contract` の
    `defineBundledChannelSetupEntry(...)` を、明示的なセットアップ時ランタイムsetterも必要な場合に使えます。

  </Step>

  <Step title="受信メッセージを処理する">
    Pluginはプラットフォームからメッセージを受信し、それをOpenClawへ転送する必要があります。典型的なパターンは、リクエストを検証し、チャンネルの受信handlerを通してディスパッチするwebhookです:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin管理auth（署名検証は自分で行う）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 受信handlerがメッセージをOpenClawへディスパッチします。
          // 正確な配線はプラットフォームSDKに依存します —
          // 実例はバンドル済みの Microsoft Teams または Google Chat Plugin パッケージを参照してください。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      受信メッセージ処理はチャンネル固有です。各チャンネルPluginがそれぞれの受信パイプラインを所有します。実際のパターンについては、バンドル済みチャンネルPlugin
      （たとえば Microsoft Teams または Google Chat Plugin パッケージ）を見てください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` にcolocated testを書きます:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("configからアカウントを解決する", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("secretを実体化せずにアカウントを検査する", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("設定不足を報告する", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    共有テストヘルパーについては、[Testing](/ja-JP/plugins/sdk-testing) を参照してください。

</Step>
</Steps>

## ファイル構成

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel メタデータ
├── openclaw.plugin.json      # 設定スキーマ付きmanifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開export（任意）
├── runtime-api.ts            # 内部ランタイムexport（任意）
└── src/
    ├── channel.ts            # createChatChannelPlugin による ChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォームAPIクライアント
    └── runtime.ts            # ランタイムストア（必要なら）
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="スレッディングオプション" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、またはカスタムのreply mode
  </Card>
  <Card title="メッセージツール統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool とアクション検出
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime 経由の TTS, STT, media, subagent
  </Card>
</CardGroup>

<Note>
一部のバンドル済みヘルパーシームは、バンドル済みPluginの保守と互換性のために依然として存在します。これらは新しいチャンネルPlugin向けの推奨パターンではありません。そのバンドル済みPluginファミリーを直接保守しているのでない限り、共通SDKサーフェスの汎用 channel/setup/reply/runtime サブパスを優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — Pluginがモデルも提供する場合
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なサブパスimportリファレンス
- [SDK Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティと契約テスト
- [Plugin Manifest](/ja-JP/plugins/manifest) — 完全なmanifestスキーマ

## 関連

- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
- [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)
