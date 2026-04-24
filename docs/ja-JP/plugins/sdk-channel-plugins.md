---
read_when:
    - 新しいメッセージングチャンネル Plugin を構築している場合
    - OpenClaw をメッセージングプラットフォームに接続したい場合
    - ChannelPlugin アダプターサーフェスを理解する必要がある場合
sidebarTitle: Channel Plugins
summary: OpenClaw 向けメッセージングチャンネル Plugin を構築するためのステップバイステップガイド
title: チャンネル Plugins の構築
x-i18n:
    generated_at: "2026-04-24T05:11:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

このガイドでは、OpenClaw をメッセージングプラットフォームに接続する
チャンネル Plugin を構築する方法を順を追って説明します。最後には、DM セキュリティ、
ペアリング、返信スレッド、送信メッセージングを備えた動作するチャンネルが手に入ります。

<Info>
  OpenClaw Plugin を一度も作ったことがない場合は、まず
  [はじめに](/ja-JP/plugins/building-plugins) を読んで、基本的なパッケージ
  構造と manifest 設定を確認してください。
</Info>

## チャンネル Plugin の仕組み

チャンネル Plugin には、独自の send/edit/react ツールは不要です。OpenClaw はコアに 1 つの
共有 `message` ツールを持っています。Plugin が所有するのは次のものです。

- **Config** — アカウント解決と setup wizard
- **Security** — DM ポリシーと allowlist
- **Pairing** — DM 承認フロー
- **Session grammar** — プロバイダー固有の conversation id を、base chat、thread id、親フォールバックへどう対応付けるか
- **Outbound** — プラットフォームへのテキスト、メディア、poll の送信
- **Threading** — 返信をどうスレッド化するか
- **Heartbeat typing** — Heartbeat 配信対象向けの任意の typing/busy signal

コアが所有するのは、共有 message ツール、prompt 配線、外側の session-key 形状、
汎用 `:thread:` bookkeeping、dispatch です。

チャンネルが受信返信以外で typing indicator をサポートする場合は、
チャンネル Plugin 上に `heartbeat.sendTyping(...)` を公開してください。コアは、
Heartbeat モデル実行開始前に解決済みの heartbeat 配信対象でそれを呼び出し、
共有 typing keepalive/cleanup ライフサイクルを使用します。プラットフォームに明示的な停止 signal が必要なら
`heartbeat.clearTyping(...)` も追加してください。

チャンネルがメディアソースを運ぶ message-tool param を追加する場合は、それらの
param 名を `describeMessageTool(...).mediaSourceParams` を通じて公開してください。コアはその明示的
リストを使って、サンドボックス path 正規化と送信メディアアクセス
ポリシーを適用するため、Plugin にプロバイダー固有 avatar、attachment、cover-image param 向けの
共有コア特例は不要です。
その場合は
`{ "set-profile": ["avatarUrl", "avatarPath"] }` のような action キー付き map を返すことを優先してください。そうしないと無関係な action が別 action の media arg を継承してしまいます。
すべての公開 action 間で意図的に共有される param なら、フラット配列でも構いません。

プラットフォームが conversation id の中に追加スコープを保持する場合は、その解析を
`messaging.resolveSessionConversation(...)` を使って Plugin 内に保ってください。これが
`rawId` を base conversation id、任意の thread
id、明示的な `baseConversationId`、任意の `parentConversationCandidates` にマップするための正規 hook です。
`parentConversationCandidates` を返す場合は、それらを
最も狭い親から最も広い/ベース conversation への順に並べてください。

チャンネルレジストリ起動前に同じ解析が必要なバンドル済み Plugin は、
同じ `resolveSessionConversation(...)` export を持つトップレベル
`session-key-api.ts` file を公開することもできます。コアは runtime Plugin レジストリがまだ利用できない場合にのみ、その bootstrap-safe サーフェスを使います。

`messaging.resolveParentConversationCandidates(...)` は、Plugin が generic/raw id の上に親フォールバックだけを必要とする場合の
レガシー互換フォールバックとして残っています。両方の hook が存在する場合、コアは
まず `resolveSessionConversation(...).parentConversationCandidates` を使い、その正規 hook が
省略した場合にのみ `resolveParentConversationCandidates(...)` へフォールバックします。

## 承認とチャンネル capabilities

ほとんどのチャンネル Plugin には承認固有のコードは不要です。

- コアが same-chat `/approve`、共有承認 button payload、汎用フォールバック配信を所有します。
- チャンネルに承認固有の挙動が必要な場合は、チャンネル Plugin 上で 1 つの `approvalCapability` オブジェクトを優先してください。
- `ChannelPlugin.approvals` は削除されました。承認配信/ネイティブ/レンダリング/認証の事実は `approvalCapability` に置いてください。
- `plugin.auth` は login/logout 専用です。コアはもはやそのオブジェクトから承認 auth hook を読みません。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` が正規の approval-auth seam です。
- same-chat 承認 auth 利用可否には `approvalCapability.getActionAvailabilityState` を使ってください。
- チャンネルがネイティブ exec 承認を公開する場合、開始サーフェス/ネイティブクライアント状態が same-chat approval auth と異なるときには `approvalCapability.getExecInitiatingSurfaceState` を使ってください。コアはこの exec 固有 hook を使って `enabled` と `disabled` を区別し、開始チャンネルがネイティブ exec 承認をサポートするかを判断し、ネイティブクライアントフォールバックガイダンスにそのチャンネルを含めます。`createApproverRestrictedNativeApprovalCapability(...)` は一般的なケースでこれを埋めます。
- 重複するローカル承認プロンプトを隠したり、配信前に typing indicator を送ったりするような、チャンネル固有ペイロードライフサイクル挙動には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使ってください。
- ネイティブ承認ルーティングまたはフォールバック抑制には `approvalCapability.delivery` のみを使ってください。
- チャンネル所有のネイティブ承認の事実には `approvalCapability.nativeRuntime` を使ってください。コアが承認ライフサイクルを組み立てられるようにしつつ、必要時にランタイム module を demand import できる `createLazyChannelApprovalNativeRuntimeAdapter(...)` を使って、ホットなチャンネル entrypoint ではそれを lazy に保ってください。
- 共有レンダラーではなくチャンネルが本当にカスタム承認 payload を必要とする場合にのみ `approvalCapability.render` を使ってください。
- チャンネルが無効化経路の返信で、ネイティブ exec 承認を有効化するために必要な正確な config knob を説明したい場合は `approvalCapability.describeExecApprovalSetup` を使ってください。この hook は `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントチャンネルでは、トップレベルデフォルトではなく `channels.<channel>.accounts.<id>.execApprovals.*` のような account スコープ path を表示すべきです。
- チャンネルが既存 config から安定した owner に近い DM identity を推論できる場合は、same-chat `/approve` を制限するために `openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使ってください。承認固有のコアロジックを追加する必要はありません。
- チャンネルにネイティブ承認配信が必要な場合は、チャンネルコードを target 正規化と transport/presentation の事実に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使ってください。チャンネル固有の事実は `approvalCapability.nativeRuntime` の背後に置いてください。理想的には `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` 経由にして、コアが handler を組み立て、request filtering、routing、dedupe、expiry、gateway subscription、routed-elsewhere notice を所有できるようにします。`nativeRuntime` はより小さないくつかの seam に分かれています:
- `availability` — アカウントが設定済みかどうか、および request を処理すべきかどうか
- `presentation` — 共有承認 view model を pending/resolved/expired のネイティブ payload または最終 action にマップする
- `transport` — target を準備し、ネイティブ承認メッセージを send/update/delete する
- `interactions` — ネイティブ button または reaction 用の任意の bind/unbind/clear-action hook
- `observe` — 任意の配信診断 hook
- チャンネルが client、token、Bolt app、webhook receiver のような runtime 所有 object を必要とする場合は、`openclaw/plugin-sdk/channel-runtime-context` を通じて登録してください。汎用 runtime-context registry により、コアは承認固有の wrapper glue を追加せずに、チャンネル起動状態から capability 駆動 handler を bootstrap できます。
- capability 駆動 seam ではまだ十分に表現できない場合にのみ、より低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` を使ってください。
- ネイティブ承認チャンネルは、`accountId` と `approvalKind` の両方をそれらの helper に通す必要があります。`accountId` は複数アカウント承認ポリシーを正しい bot account に限定し、`approvalKind` は exec と Plugin 承認の挙動をコアのハードコード分岐なしにチャンネルで利用可能にします。
- コアは現在、承認 reroute notice も所有しています。チャンネル Plugin は `createChannelNativeApprovalRuntime` から独自の「承認は DM / 別チャンネルに送られた」というフォローアップメッセージを送るべきではありません。代わりに、共有承認 capability helper を通じて正確な origin + approver-DM routing を公開し、実際の配信を集計した後で、開始チャットへ何らかの notice を返すかどうかはコアに任せてください。
- 配信された承認 id の kind は end-to-end で保持してください。ネイティブクライアントは
  exec vs Plugin 承認のルーティングをチャンネルローカル状態から推測または書き換えるべきではありません。
- 異なる approval kind が、意図的に異なるネイティブサーフェスを公開することはあり得ます。
  現在のバンドル済み例:
  - Slack は exec と Plugin id の両方に対してネイティブ承認ルーティングを利用可能なままにしています。
  - Matrix は exec
    と Plugin 承認に対して同じネイティブ DM/チャンネルルーティングと reaction UX を維持しつつ、approval kind ごとに auth を分けられるようにしています。
- `createApproverRestrictedNativeApprovalAdapter` は互換 wrapper として依然存在しますが、新しいコードでは capability builder を優先し、Plugin 上に `approvalCapability` を公開してください。

ホットなチャンネル entrypoint では、そのファミリーの一部だけが必要な場合は、
より狭い runtime subpath を優先してください。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広い umbrella
surface が不要な場合は `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking` を優先してください。

特に setup について:

- `openclaw/plugin-sdk/setup-runtime` は runtime-safe setup helper を扱います:
  import-safe setup patch adapter（`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`）、lookup-note 出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、委譲
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime` は `createEnvPatchedAccountSetupAdapter` 向けの狭い env-aware adapter
  seam です
- `openclaw/plugin-sdk/channel-setup` は optional-install setup
  builder に加え、いくつかの setup-safe primitive を扱います:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

チャンネルが env 駆動の setup または auth をサポートし、ランタイム読み込み前に汎用 startup/config
フローがそれらの env 名を知る必要がある場合は、Plugin manifest に
`channelEnvVars` として宣言してください。チャンネル runtime `envVars` やローカル
定数は、オペレーター向け説明用にだけ使ってください。

チャンネルが Plugin ランタイム起動前の `status`、`channels list`、`channels status`、または
SecretRef scan に表示される可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加してください。その entrypoint は、読み取り専用コマンド経路で安全に import できる必要があり、
チャンネルメタデータ、setup-safe config adapter、status
adapter、そしてそれらのサマリーに必要な channel secret target metadata を返すべきです。setup entry から
client、listener、transport runtime を開始しないでください。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および
`splitSetupEntries`

- これらに加えて
  `moveSingleAccountChannelSectionToDefaultAccount(...)` のような
  より重い共有 setup/config helper も必要な場合にのみ、より広い `openclaw/plugin-sdk/setup` seam を使ってください

チャンネルが setup サーフェス上で「まずこの Plugin をインストールしてください」とだけ広告したい場合は、`createOptionalChannelSetupSurface(...)` を優先してください。生成される
adapter/wizard は config 書き込みと finalize で fail closed し、validation、finalize、docs-link の文言でも同じ install-required メッセージを再利用します。

その他のホットなチャンネル経路でも、より広いレガシーサーフェスより狭い helper を優先してください。

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, および
  `openclaw/plugin-sdk/account-helpers` は、マルチアカウント config と
  default-account フォールバック用
- `openclaw/plugin-sdk/inbound-envelope` と
  `openclaw/plugin-sdk/inbound-reply-dispatch` は、inbound route/envelope と
  record-and-dispatch 配線用
- `openclaw/plugin-sdk/messaging-targets` は target の parse/match 用
- `openclaw/plugin-sdk/outbound-media` と
  `openclaw/plugin-sdk/outbound-runtime` は、メディア読み込みと outbound
  identity/send delegate および payload planning 用
- `buildThreadAwareOutboundSessionRoute(...)` は
  `openclaw/plugin-sdk/channel-core` から提供され、outbound route が明示的な `replyToId`/`threadId` を保持するか、
  base session key がなお一致する後でも現在の `:thread:` session を復元すべき場合に使います。
  プロバイダー Plugin は、自分たちのプラットフォームがネイティブ thread 配信セマンティクスを持つ場合、
  precedence、suffix 挙動、thread id 正規化を上書きできます。
- `openclaw/plugin-sdk/thread-bindings-runtime` は thread-binding ライフサイクル
  と adapter 登録用
- `openclaw/plugin-sdk/agent-media-payload` は、legacy な agent/media
  payload field layout が依然必要な場合のみ
- `openclaw/plugin-sdk/telegram-command-config` は、Telegram custom-command
  正規化、重複/競合検証、およびフォールバック安定な command
  config 契約用

auth-only チャンネルは通常、デフォルト経路で十分です。コアが承認を処理し、Plugin は outbound/auth capability を公開するだけです。Matrix、Slack、Telegram、カスタム chat transport のようなネイティブ承認チャンネルは、自前で承認ライフサイクルを作るのではなく、共有ネイティブ helper を使うべきです。

## 受信メンションポリシー

受信メンション処理は 2 層に分けてください。

- Plugin 所有の証拠収集
- 共有ポリシー評価

メンションポリシー判断には `openclaw/plugin-sdk/channel-mention-gating` を使ってください。
より広い inbound
helper barrel が必要な場合にのみ `openclaw/plugin-sdk/channel-inbound` を使ってください。

Plugin ローカルロジックに適しているもの:

- ボットへの reply 検出
- ボット引用の検出
- thread 参加状況の確認
- service/system-message の除外
- ボット参加を証明するために必要な platform-native cache

共有 helper に適しているもの:

- `requireMention`
- 明示的メンション結果
- 暗黙メンション allowlist
- command bypass
- 最終的な skip 判定

推奨フロー:

1. ローカルなメンション事実を計算する。
2. それらの事実を `resolveInboundMentionDecision({ facts, policy })` に渡す。
3. inbound gate では `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip` を使う。

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

`api.runtime.channel.mentions` は、runtime injection にすでに依存している
バンドル済みチャンネル Plugin 向けに、同じ共有メンション helper を公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と
`resolveInboundMentionDecision` だけが必要な場合は、
無関係な inbound runtime helper を読み込まないよう、
`openclaw/plugin-sdk/channel-mention-gating` から import してください。

古い `resolveMentionGating*` helper は
`openclaw/plugin-sdk/channel-inbound` に互換 export としてのみ残っています。新しいコードでは
`resolveInboundMentionDecision({ facts, policy })` を使ってください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージと manifest">
    標準の Plugin file を作成します。`package.json` 内の `channel` フィールドが、
    これをチャンネル Plugin にします。完全な package-metadata サーフェスについては、
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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="チャンネル Plugin オブジェクトを構築する">
    `ChannelPlugin` interface には多くの任意 adapter surface があります。まずは
    最小限の `id` と `setup` から始め、必要に応じて adapter を追加してください。

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

    <Accordion title="createChatChannelPlugin がしてくれること">
      低レベル adapter interface を手作業で実装する代わりに、
      宣言的オプションを渡すと builder がそれらを組み立ててくれます。

      | Option | 配線されるもの |
      | --- | --- |
      | `security.dm` | config field からのスコープ付き DM security resolver |
      | `pairing.text` | コード交換付きのテキストベース DM pairing フロー |
      | `threading` | reply-to-mode resolver（固定、account スコープ、または custom） |
      | `outbound.attachedResults` | 結果メタデータ（message ID）を返す send 関数 |

      完全な制御が必要な場合は、宣言的オプションの代わりに生の adapter object を渡すこともできます。
    </Accordion>

  </Step>

  <Step title="エントリポイントを配線する">
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

    チャンネル所有の CLI descriptor は `registerCliMetadata(...)` に置いてください。これにより OpenClaw
    は full チャンネルランタイムを有効化せずに root help にそれらを表示でき、
    同時に通常の full load では実際の command
    登録用に同じ descriptor を拾えます。`registerFull(...)` はランタイム専用作業のために残してください。
    `registerFull(...)` が gateway RPC method を登録する場合は、
    Plugin 固有の prefix を使ってください。コア admin namespace（`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`）は予約されており、常に
    `operator.admin` に解決されます。
    `defineChannelPluginEntry` は登録モードの分割を自動処理します。すべての
    オプションについては [Entry Points](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="setup entry を追加する">
    オンボーディング中の軽量ロードのために `setup-entry.ts` を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw は、チャンネルが無効または
    未設定のとき、full entry の代わりにこれを読み込みます。
    Setup フロー中に重いランタイムコードを引き込むことを避けられます。
    詳細は [Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    setup-safe export を sidecar
    module に分離している bundled workspace channel は、
    setup 時ランタイム setter を明示的に必要とする場合、
    `openclaw/plugin-sdk/channel-entry-contract` の
    `defineBundledChannelSetupEntry(...)` を使えます。

  </Step>

  <Step title="受信メッセージを処理する">
    Plugin は、プラットフォームからメッセージを受信し、それらを
    OpenClaw に転送する必要があります。典型的なパターンは、リクエストを検証し、
    チャンネルの inbound handler を通じて dispatch する webhook です:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin 管理 auth（署名検証は自分で行う）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // inbound handler がメッセージを OpenClaw に dispatch します。
          // 正確な配線はプラットフォーム SDK に依存します —
          // 実例は bundled Microsoft Teams または Google Chat Plugin package を参照してください。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      inbound message 処理はチャンネル固有です。各チャンネル Plugin は
      自分自身の inbound pipeline を所有します。実際のパターンについては、
      bundled channel plugins
      （たとえば Microsoft Teams または Google Chat Plugin package）を見てください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` に colocated test を書きます:

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

    共有テスト helper については [Testing](/ja-JP/plugins/sdk-testing) を参照してください。

  </Step>
</Steps>

## ファイル構成

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Config schema を含む Manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開 export（任意）
├── runtime-api.ts            # 内部 runtime export（任意）
└── src/
    ├── channel.ts            # createChatChannelPlugin による ChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォーム API client
    └── runtime.ts            # Runtime store（必要なら）
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="スレッド化オプション" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、または custom の reply mode
  </Card>
  <Card title="メッセージツール統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool と action discovery
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime 経由の TTS、STT、media、subagent
  </Card>
</CardGroup>

<Note>
一部の bundled helper seam は、bundled-plugin 保守と
互換性のためにまだ存在しています。これらは新しい channel plugin に対する推奨パターンではありません。
その bundled plugin ファミリーを直接保守しているのでない限り、
共通 SDK サーフェスの generic な channel/setup/reply/runtime subpath を優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — Plugin がモデルも提供する場合
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [SDK Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティと契約テスト
- [Plugin Manifest](/ja-JP/plugins/manifest) — 完全な manifest schema

## 関連

- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
- [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)
