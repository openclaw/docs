---
read_when:
    - 新しいメッセージングチャネルPluginを構築しています
    - OpenClawをメッセージングプラットフォームに接続したいと考えています
    - ChannelPluginアダプターの公開インターフェースを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングチャネルPluginを構築するためのステップバイステップガイド
title: チャネルPluginの構築
x-i18n:
    generated_at: "2026-04-15T04:43:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f4c746fe3163a8880e14c433f4db4a1475535d91716a53fb879551d8d62f65
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# チャネルPluginの構築

このガイドでは、OpenClawをメッセージングプラットフォームに接続するチャネルPluginの構築方法を説明します。最後には、DMセキュリティ、ペアリング、返信スレッド化、送信メッセージングを備えた動作するチャネルが完成します。

<Info>
  OpenClaw Pluginをまだ一度も構築したことがない場合は、基本的なパッケージ
  構造とマニフェスト設定について最初に
  [はじめに](/ja-JP/plugins/building-plugins)を読んでください。
</Info>

## チャネルPluginの仕組み

チャネルPluginには独自の送信・編集・リアクション用ツールは不要です。OpenClawはコアで1つの共有`message`ツールを維持します。Pluginが担当するのは次の項目です。

- **設定** — アカウント解決とセットアップウィザード
- **セキュリティ** — DMポリシーと許可リスト
- **ペアリング** — DM承認フロー
- **セッショングラマー** — プロバイダー固有の会話idをベースチャット、スレッドid、親フォールバックにどう対応付けるか
- **送信** — テキスト、メディア、投票をプラットフォームに送信すること
- **スレッド化** — 返信をどうスレッド化するか

コアは共有messageツール、プロンプト配線、外側のセッションキー形状、汎用的な`:thread:`管理、およびディスパッチを担当します。

チャネルでメディアソースを運ぶmessage-toolパラメータを追加する場合は、それらの
パラメータ名を`describeMessageTool(...).mediaSourceParams`を通じて公開してください。コアはその明示的な一覧をサンドボックスパス正規化と送信メディアアクセスポリシーに使用するため、Plugin側でプロバイダー固有のアバター、添付ファイル、カバー画像パラメータに対して共有コアの特別扱いは不要です。
可能であれば、`{ "set-profile": ["avatarUrl", "avatarPath"] }`のようなアクションキー付きマップを返してください。そうすることで、無関係なアクションが別アクションのメディア引数を継承しません。意図的に公開されるすべてのアクションで共有するパラメータであれば、フラットな配列でも引き続き使用できます。

プラットフォームが会話id内に追加のスコープを格納する場合は、その解析を
`messaging.resolveSessionConversation(...)`でPlugin内に保持してください。これは、`rawId`をベース会話id、任意のスレッドid、明示的な`baseConversationId`、および任意の`parentConversationCandidates`に対応付けるための正規のフックです。
`parentConversationCandidates`を返す場合は、最も狭い親から最も広い親/ベース会話の順に並べてください。

チャネルレジストリの起動前に同じ解析が必要な同梱Pluginでは、対応する
`resolveSessionConversation(...)`エクスポートを持つトップレベルの`session-key-api.ts`ファイルも公開できます。コアは、実行時Pluginレジストリがまだ利用できない場合にのみ、このブートストラップ安全な公開インターフェースを使用します。

`messaging.resolveParentConversationCandidates(...)`は、Pluginが汎用/raw idに加えて親フォールバックのみを必要とする場合の、従来の互換性フォールバックとして引き続き利用できます。両方のフックが存在する場合、コアはまず
`resolveSessionConversation(...).parentConversationCandidates`を使用し、その正規フックがそれらを省略した場合にのみ`resolveParentConversationCandidates(...)`へフォールバックします。

## 承認とチャネル機能

ほとんどのチャネルPluginでは、承認固有のコードは不要です。

- コアは同一チャット内の`/approve`、共有承認ボタンのペイロード、および汎用フォールバック配信を担当します。
- チャネルで承認固有の動作が必要な場合は、チャネルPlugin上に1つの`approvalCapability`オブジェクトを置くことを推奨します。
- `ChannelPlugin.approvals`は削除されました。承認の配信/ネイティブ/レンダリング/認証に関する情報は`approvalCapability`に置いてください。
- `plugin.auth`はlogin/logout専用です。コアはそのオブジェクトから承認認証フックを読み取らなくなりました。
- `approvalCapability.authorizeActorAction`と`approvalCapability.getActionAvailabilityState`が正規の承認認証インターフェースです。
- 同一チャット内の承認認証の可用性には`approvalCapability.getActionAvailabilityState`を使用してください。
- チャネルがネイティブexec承認を公開する場合、開始サーフェス/ネイティブクライアント状態が同一チャット内承認認証と異なるときは、`approvalCapability.getExecInitiatingSurfaceState`を使用してください。コアはこのexec固有のフックを使用して`enabled`と`disabled`を区別し、開始チャネルがネイティブexec承認をサポートしているかを判断し、ネイティブクライアントのフォールバック案内にそのチャネルを含めます。`createApproverRestrictedNativeApprovalCapability(...)`は一般的なケースに対してこれを補います。
- 重複するローカル承認プロンプトの非表示や、配信前の入力中インジケーター送信のような、チャネル固有のペイロードライフサイクル動作には、`outbound.shouldSuppressLocalPayloadPrompt`または`outbound.beforeDeliverPayload`を使用してください。
- `approvalCapability.delivery`は、ネイティブ承認ルーティングまたはフォールバック抑制にのみ使用してください。
- チャネル所有のネイティブ承認情報には`approvalCapability.nativeRuntime`を使用してください。`createLazyChannelApprovalNativeRuntimeAdapter(...)`を使って、ホットなチャネルエントリーポイントではこれを遅延ロードにしてください。これにより、コアは承認ライフサイクルを組み立てつつ、必要時に実行時モジュールをimportできます。
- 共有レンダラーではなく、チャネルが本当に独自の承認ペイロードを必要とする場合にのみ`approvalCapability.render`を使用してください。
- チャネルが、無効時パスの返信でネイティブexec承認を有効化するために必要な正確な設定項目を説明したい場合は、`approvalCapability.describeExecApprovalSetup`を使用してください。このフックは`{ channel, channelLabel, accountId }`を受け取ります。名前付きアカウントのチャネルでは、トップレベルのデフォルトではなく、`channels.<channel>.accounts.<id>.execApprovals.*`のようなアカウントスコープのパスを表示してください。
- 既存設定から安定した所有者相当のDMアイデンティティを推測できるチャネルでは、承認固有のコアロジックを追加せずに同一チャット内の`/approve`を制限するため、`openclaw/plugin-sdk/approval-runtime`の`createResolvedApproverActionAuthAdapter`を使用してください。
- チャネルにネイティブ承認配信が必要な場合、チャネルコードはターゲット正規化とトランスポート/プレゼンテーション情報に集中させてください。`openclaw/plugin-sdk/approval-runtime`の`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability`を使用してください。チャネル固有の情報は`approvalCapability.nativeRuntime`の背後に置き、理想的には`createChannelApprovalNativeRuntimeAdapter(...)`または`createLazyChannelApprovalNativeRuntimeAdapter(...)`を通してください。これにより、コアはハンドラーを組み立て、リクエストフィルタリング、ルーティング、重複排除、有効期限、Gatewayサブスクリプション、別経路通知を担当できます。`nativeRuntime`はいくつかの小さなインターフェースに分割されています。
- `availability` — アカウントが設定済みか、およびリクエストを処理すべきかどうか
- `presentation` — 共有承認ビューモデルを、保留/解決済み/期限切れのネイティブペイロードまたは最終アクションにマッピングする
- `transport` — ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除する
- `interactions` — ネイティブボタンやリアクション向けの任意のbind/unbind/clear-actionフック
- `observe` — 任意の配信診断フック
- チャネルにclient、token、Boltアプリ、Webhookレシーバーのような実行時所有オブジェクトが必要な場合は、`openclaw/plugin-sdk/channel-runtime-context`を通じて登録してください。汎用runtime-contextレジストリにより、コアは承認固有のラッパーを追加せずに、チャネル起動状態から機能駆動ハンドラーをブートストラップできます。
- capability駆動インターフェースでまだ十分に表現できない場合にのみ、より低レベルの`createChannelApprovalHandler`または`createChannelNativeApprovalRuntime`を使用してください。
- ネイティブ承認チャネルでは、これらのヘルパーを通じて`accountId`と`approvalKind`の両方をルーティングする必要があります。`accountId`はマルチアカウント承認ポリシーを正しいボットアカウントにスコープし、`approvalKind`はコアでハードコードされた分岐なしにexecとplugin承認の動作をチャネルで利用可能にします。
- コアは承認の再ルーティング通知も担当するようになりました。チャネルPluginは、`createChannelNativeApprovalRuntime`から独自の「承認はDM/別チャネルに送られました」という追跡メッセージを送信すべきではありません。代わりに、共有承認capabilityヘルパーを通じて正確なoriginとapprover-DMルーティングを公開し、開始チャットに通知を投稿する前にコアが実際の配信を集約するようにしてください。
- 配信された承認idの種類をエンドツーエンドで保持してください。ネイティブクライアントは、チャネルローカルの状態からexecとplugin承認のルーティングを推測または書き換えるべきではありません。
- 異なる承認種類で、意図的に異なるネイティブサーフェスを公開してもかまいません。
  現在の同梱例:
  - Slackは、exec idとplugin idの両方でネイティブ承認ルーティングを利用可能にしています。
  - Matrixは、exec承認とplugin承認で同じネイティブDM/チャネルルーティングとリアクションUXを維持しつつ、承認種類による認証の違いも許可しています。
- `createApproverRestrictedNativeApprovalAdapter`は互換性ラッパーとしてまだ存在しますが、新しいコードではcapability builderを推奨し、Plugin上で`approvalCapability`を公開してください。

ホットなチャネルエントリーポイントでは、そのファミリーのうち1つの部分だけが必要な場合、より狭いruntimeサブパスを優先してください。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広い包括的な公開インターフェースが不要な場合は、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking`
を優先してください。

セットアップに関しては特に次のとおりです。

- `openclaw/plugin-sdk/setup-runtime`はruntime-safeなセットアップヘルパーを提供します:
  import-safeなセットアップパッチアダプター（`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`）、lookup-note出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委譲された
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime`は、`createEnvPatchedAccountSetupAdapter`向けの狭いenv-aware adapterインターフェースです
- `openclaw/plugin-sdk/channel-setup`は、オプションインストール用セットアップbuilderと、いくつかのセットアップ安全なプリミティブを提供します:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

チャネルがenv駆動のセットアップまたは認証をサポートし、汎用の起動/設定フローでruntimeロード前にそれらのenv名を把握する必要がある場合は、Pluginマニフェストで`channelEnvVars`として宣言してください。チャネルruntimeの`envVars`やローカル定数は、オペレーター向け文言専用にとどめてください。
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, および
`splitSetupEntries`

- より重い共有セットアップ/設定ヘルパー、たとえば
  `moveSingleAccountChannelSectionToDefaultAccount(...)`
  も必要な場合にのみ、より広い`openclaw/plugin-sdk/setup`インターフェースを使用してください

チャネルがセットアップ画面で「まずこのPluginをインストールしてください」と案内したいだけなら、`createOptionalChannelSetupSurface(...)`を優先してください。生成されるadapter/wizardは設定書き込みと最終化でfail closedし、検証、最終化、ドキュメントリンク文言で同じインストール必須メッセージを再利用します。

そのほかのホットなチャネルパスでも、より広い従来の公開インターフェースより狭いヘルパーを優先してください。

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, および
  `openclaw/plugin-sdk/account-helpers` は、マルチアカウント設定と
  デフォルトアカウントへのフォールバック用です
- `openclaw/plugin-sdk/inbound-envelope` および
  `openclaw/plugin-sdk/inbound-reply-dispatch` は、受信route/envelopeと
  record-and-dispatch配線用です
- `openclaw/plugin-sdk/messaging-targets` はターゲット解析/照合用です
- `openclaw/plugin-sdk/outbound-media` および
  `openclaw/plugin-sdk/outbound-runtime` は、メディア読み込みと送信
  identity/send delegate用です
- `openclaw/plugin-sdk/thread-bindings-runtime` は、スレッドbindingライフサイクル
  とadapter登録用です
- `openclaw/plugin-sdk/agent-media-payload` は、従来のagent/media
  ペイロードフィールド配置がまだ必要な場合にのみ使用してください
- `openclaw/plugin-sdk/telegram-command-config` は、Telegramカスタムコマンドの
  正規化、重複/競合検証、およびフォールバック安定なコマンド設定コントラクト用です

認証専用チャネルは通常、デフォルトの経路で十分です。コアが承認を処理し、Pluginは送信/認証capabilityを公開するだけで済みます。Matrix、Slack、Telegram、カスタムチャットトランスポートのようなネイティブ承認チャネルは、独自の承認ライフサイクルを実装するのではなく、共有のネイティブヘルパーを使用してください。

## 受信メンションポリシー

受信メンション処理は、次の2層に分けたままにしてください。

- Plugin所有の証拠収集
- 共有ポリシー評価

共有レイヤーには`openclaw/plugin-sdk/channel-inbound`を使用してください。

Pluginローカルロジックに適しているもの:

- botへの返信の検出
- botを引用したメッセージの検出
- スレッド参加チェック
- サービス/システムメッセージの除外
- botの参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適しているもの:

- `requireMention`
- 明示的メンション結果
- 暗黙的メンション許可リスト
- コマンドバイパス
- 最終的なスキップ判定

推奨フロー:

1. ローカルのメンション情報を計算します。
2. その情報を`resolveInboundMentionDecision({ facts, policy })`に渡します。
3. 受信ゲートで`decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip`を使用します。

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

`api.runtime.channel.mentions`は、すでにruntime injectionに依存している同梱チャネルPlugin向けに、同じ共有メンションヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

古い`resolveMentionGating*`ヘルパーは、
`openclaw/plugin-sdk/channel-inbound`上に互換性エクスポートとしてのみ残されています。新しいコードでは
`resolveInboundMentionDecision({ facts, policy })`を使用してください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準的なPluginファイルを作成します。`package.json`の`channel`フィールドが、
    これをチャネルPluginにします。完全なパッケージメタデータの公開インターフェースについては、
    [Plugin Setup and Config](/ja-JP/plugins/sdk-setup#openclaw-channel)を参照してください。

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

  <Step title="チャネルPluginオブジェクトを構築する">
    `ChannelPlugin`インターフェースには、多くの任意のアダプター公開インターフェースがあります。まずは
    最小構成である`id`と`setup`から始め、必要に応じてアダプターを追加してください。

    `src/channel.ts`を作成します:

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

    <Accordion title="createChatChannelPluginが行うこと">
      低レベルのアダプターインターフェースを手動で実装する代わりに、
      宣言的なオプションを渡すと、builderがそれらを組み合わせます。

      | Option | 配線されるもの |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付きDMセキュリティリゾルバー |
      | `pairing.text` | コード交換を伴うテキストベースのDMペアリングフロー |
      | `threading` | reply-to-modeリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（message ID）を返す送信関数 |

      完全な制御が必要な場合は、宣言的オプションの代わりに
      生のアダプターオブジェクトを渡すこともできます。
    </Accordion>

  </Step>

  <Step title="エントリーポイントを配線する">
    `index.ts`を作成します:

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

    チャネル所有のCLI descriptorは`registerCliMetadata(...)`に置いてください。これにより、OpenClawは完全なチャネルruntimeを有効化せずに
    ルートヘルプでそれらを表示でき、通常の完全ロードでも実際のコマンド登録のために
    同じdescriptorを取得できます。`registerFull(...)`はruntime専用の処理に残してください。
    `registerFull(...)`がGateway RPCメソッドを登録する場合は、
    Plugin固有のprefixを使用してください。コア管理namespace（`config.*`、
    `exec.approvals.*`, `wizard.*`, `update.*`）は予約されたままで、
    常に`operator.admin`に解決されます。
    `defineChannelPluginEntry`は登録モードの分岐を自動的に処理します。すべての
    オプションについては[Entry Points](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry)を参照してください。

  </Step>

  <Step title="setup entryを追加する">
    オンボーディング中の軽量ロード用に`setup-entry.ts`を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClawは、チャネルが無効または未設定のとき、完全なentryの代わりにこれをロードします。
    これにより、セットアップフロー中に重いruntimeコードを読み込まずに済みます。
    詳細は[Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

  </Step>

  <Step title="受信メッセージを処理する">
    Pluginはプラットフォームからメッセージを受信し、それを
    OpenClawに転送する必要があります。典型的なパターンは、リクエストを検証し、
    チャネルの受信ハンドラーを通してディスパッチするWebhookです。

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
      受信メッセージ処理はチャネル固有です。各チャネルPluginは
      独自の受信パイプラインを所有します。実際のパターンについては、
      同梱チャネルPlugin
      （たとえばMicrosoft TeamsまたはGoogle ChatのPluginパッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts`に同じ場所のテストを書きます:

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

    共有テストヘルパーについては、[Testing](/ja-JP/plugins/sdk-testing)を参照してください。

  </Step>
</Steps>

## ファイル構成

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channelメタデータ
├── openclaw.plugin.json      # 設定スキーマを含むマニフェスト
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開エクスポート（任意）
├── runtime-api.ts            # 内部runtimeエクスポート（任意）
└── src/
    ├── channel.ts            # createChatChannelPlugin経由のChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォームAPIクライアント
    └── runtime.ts            # runtimeストア（必要な場合）
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="スレッド化オプション" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、またはカスタムの返信モード
  </Card>
  <Card title="messageツール統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageToolとアクション検出
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="runtimeヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime経由のTTS、STT、メディア、subagent
  </Card>
</CardGroup>

<Note>
一部の同梱ヘルパーインターフェースは、同梱Pluginのメンテナンスと
互換性のためにまだ存在します。これらは新しいチャネルPluginに推奨される
パターンではありません。その同梱Pluginファミリーを直接メンテナンスしている場合を除き、
共通SDK公開インターフェースの汎用channel/setup/reply/runtimeサブパスを
優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — Pluginがモデルも提供する場合
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なサブパスimportリファレンス
- [SDK Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティとコントラクトテスト
- [Plugin Manifest](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマ
