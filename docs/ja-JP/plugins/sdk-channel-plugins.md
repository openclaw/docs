---
read_when:
    - 新しいメッセージングチャネルPluginを構築しています
    - OpenClawをメッセージングプラットフォームに接続したいです
    - ChannelPluginアダプタ画面を理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングチャネルPluginを構築するためのステップバイステップガイド
title: チャネルPluginの構築
x-i18n:
    generated_at: "2026-04-21T04:48:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# チャネルPluginの構築

このガイドでは、OpenClawをメッセージングプラットフォームに接続するチャネルPluginの構築方法を順を追って説明します。最後には、DMセキュリティ、ペアリング、返信スレッド、送信メッセージングを備えた動作するチャネルが完成します。

<Info>
  まだOpenClaw Pluginを一度も作成したことがない場合は、まず [Getting Started](/ja-JP/plugins/building-plugins) を読んで、基本的なパッケージ構造とマニフェスト設定を確認してください。
</Info>

## チャネルPluginの仕組み

チャネルPluginには、独自の送信/編集/リアクションツールは不要です。OpenClawは、コアに1つの共有 `message` ツールを保持します。あなたのPluginが所有するのは次の要素です。

- **設定** — アカウント解決とセットアップウィザード
- **セキュリティ** — DMポリシーと許可リスト
- **ペアリング** — DM承認フロー
- **セッショングラマー** — プロバイダ固有の会話IDが、どのようにベースチャット、スレッドID、親フォールバックに対応付けられるか
- **送信** — プラットフォームへのテキスト、メディア、投票の送信
- **スレッド化** — 返信をどのようにスレッド化するか

コアは、共有messageツール、プロンプト配線、外側のセッションキー形状、汎用 `:thread:` 管理、およびディスパッチを所有します。

チャネルがメディアソースを運ぶmessage-toolパラメータを追加する場合は、それらのパラメータ名を `describeMessageTool(...).mediaSourceParams` で公開してください。コアはこの明示的な一覧を、サンドボックスパス正規化と送信メディアアクセスポリシーに使用するため、Plugin側でプロバイダ固有のアバター、添付ファイル、カバー画像パラメータに対する共有コアの特別扱いは不要です。  
`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを返すことを推奨します。これにより、無関係なアクションが他のアクションのメディア引数を引き継がずに済みます。意図的にすべての公開アクションで共有されるパラメータについては、フラットな配列でも引き続き動作します。

プラットフォームが会話IDの内部に追加スコープを保存している場合、その解析はPlugin内の `messaging.resolveSessionConversation(...)` に保持してください。これは、`rawId` をベース会話ID、任意のスレッドID、明示的な `baseConversationId`、および任意の `parentConversationCandidates` に対応付けるための正規フックです。`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/ベース会話の順に並べてください。

チャネルレジストリ起動前にも同じ解析が必要なバンドル版Pluginは、一致する `resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルを公開することもできます。コアは、実行時Pluginレジストリがまだ利用できないときだけ、このブートストラップ安全な画面を使います。

`messaging.resolveParentConversationCandidates(...)` は、Pluginが汎用/raw idの上に親フォールバックだけを必要とする場合の、レガシー互換フォールバックとして引き続き利用できます。両方のフックが存在する場合、コアはまず `resolveSessionConversation(...).parentConversationCandidates` を使い、その正規フックがそれらを省略したときだけ `resolveParentConversationCandidates(...)` にフォールバックします。

## 承認とチャネルcapability

ほとんどのチャネルPluginでは、承認固有のコードは不要です。

- コアは、同一チャット内の `/approve`、共有承認ボタンペイロード、および汎用フォールバック配信を所有します。
- チャネルが承認固有の動作を必要とする場合は、チャネルPlugin上に1つの `approvalCapability` オブジェクトを置くことを推奨します。
- `ChannelPlugin.approvals` は削除されました。承認の配信/ネイティブ/描画/認証に関する情報は `approvalCapability` に置いてください。
- `plugin.auth` はログイン/ログアウト専用です。コアはそのオブジェクトから承認認証フックをもう読み取りません。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` が正規の承認認証境界です。
- 同一チャット承認認証の可用性には `approvalCapability.getActionAvailabilityState` を使ってください。
- チャネルがネイティブexec承認を公開する場合は、起点画面/ネイティブクライアント状態が同一チャット承認認証と異なるときに `approvalCapability.getExecInitiatingSurfaceState` を使ってください。コアはこのexec専用フックを使って `enabled` と `disabled` を区別し、起点チャネルがネイティブexec承認をサポートするかを判断し、ネイティブクライアントのフォールバック案内にそのチャネルを含めます。`createApproverRestrictedNativeApprovalCapability(...)` は一般的なケースでこれを補います。
- 重複するローカル承認プロンプトの非表示や、配信前のtyping indicator送信など、チャネル固有のペイロードライフサイクル動作には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使ってください。
- `approvalCapability.delivery` はネイティブ承認ルーティングまたはフォールバック抑制にのみ使ってください。
- チャネル所有のネイティブ承認情報には `approvalCapability.nativeRuntime` を使ってください。ホットなチャネルエントリポイントでは、`createLazyChannelApprovalNativeRuntimeAdapter(...)` によってこれを遅延化し、必要時に実行時モジュールをimportできるようにしつつ、コアが承認ライフサイクルを組み立てられるようにしてください。
- `approvalCapability.render` は、チャネルが共有レンダラの代わりに本当にカスタム承認ペイロードを必要とする場合にのみ使ってください。
- チャネルが無効時レスポンスで、ネイティブexec承認を有効にするために必要な正確な設定ノブを説明したい場合は、`approvalCapability.describeExecApprovalSetup` を使ってください。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントのチャネルでは、トップレベルデフォルトではなく `channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープ付きパスを描画してください。
- チャネルが既存設定から安定した所有者風DMアイデンティティを推測できる場合は、承認固有のコアロジックを追加せずに同一チャット `/approve` を制限するために `openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使ってください。
- チャネルがネイティブ承認配信を必要とする場合は、チャネルコードはターゲット正規化とトランスポート/提示情報に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability` を使ってください。チャネル固有の情報は `approvalCapability.nativeRuntime` の背後に置き、理想的には `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` を通して置いてください。そうすることで、コアがハンドラを組み立て、リクエストフィルタリング、ルーティング、重複排除、期限管理、Gateway購読、および別経路配信通知を所有できます。`nativeRuntime` はいくつかの小さな境界に分割されています:
- `availability` — アカウントが設定済みか、およびリクエストを処理すべきか
- `presentation` — 共有承認ビューモデルを保留/解決済み/期限切れのネイティブペイロードまたは最終アクションに対応付ける
- `transport` — ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除する
- `interactions` — ネイティブボタンまたはリアクション向けの任意のbind/unbind/clear-actionフック
- `observe` — 任意の配信診断フック
- チャネルがクライアント、トークン、Boltアプリ、Webhook受信器などの実行時所有オブジェクトを必要とする場合は、`openclaw/plugin-sdk/channel-runtime-context` を通して登録してください。汎用runtime-contextレジストリにより、コアは承認固有のラッパーコードを追加せずに、チャネル起動状態からcapability駆動ハンドラをブートストラップできます。
- capability駆動の境界だけではまだ十分に表現できない場合にのみ、より低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` を使ってください。
- ネイティブ承認チャネルでは、`accountId` と `approvalKind` の両方をそれらのヘルパー経由でルーティングする必要があります。`accountId` はマルチアカウント承認ポリシーを正しいボットアカウントにスコープし、`approvalKind` はコア内にハードコード分岐を作らずに、execとPlugin承認の動作をチャネル側で利用可能に保ちます。
- コアは現在、承認の再ルーティング通知も所有します。チャネルPluginは、`createChannelNativeApprovalRuntime` から「承認はDM/別チャネルへ送られました」という独自の追跡メッセージを送るべきではありません。代わりに、共有承認capabilityヘルパーを通して正確な起点 + 承認者DMルーティングを公開し、起点チャットへ通知を返す前にコアが実際の配信を集約するようにしてください。
- 配信された承認IDの種類をエンドツーエンドで保持してください。ネイティブクライアントは、チャネルローカル状態からexecかPluginかの承認ルーティングを推測または書き換えてはいけません。
- 異なる承認種類は、意図的に異なるネイティブ画面を公開してよいものです。
  現在のバンドル例:
  - Slackは、execとPluginの両方のIDについてネイティブ承認ルーティングを利用可能に保ちます。
  - Matrixは、execとPlugin承認の間で認証が異なることを許しつつも、同じネイティブDM/チャネルルーティングとリアクションUXを維持します。
- `createApproverRestrictedNativeApprovalAdapter` は互換ラッパーとしてまだ存在しますが、新しいコードではcapability builderを優先し、Plugin上で `approvalCapability` を公開してください。

ホットなチャネルエントリポイントでは、そのファミリーの一部だけが必要な場合、より狭い実行時サブパスを優先してください。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広い包括画面が不要な場合は、`openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference`、`openclaw/plugin-sdk/reply-chunking` を優先してください。

セットアップについて特に言うと:

- `openclaw/plugin-sdk/setup-runtime` は、実行時安全なセットアップヘルパーを扱います:
  import安全なセットアップパッチアダプタ（`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`）、lookup-note出力、`promptResolvedAllowFrom`、`splitSetupEntries`、および委譲セットアッププロキシbuilder
- `openclaw/plugin-sdk/setup-adapter-runtime` は、`createEnvPatchedAccountSetupAdapter` 向けの狭い環境変数対応アダプタ境界です
- `openclaw/plugin-sdk/channel-setup` は、任意インストールのセットアップbuilderに加え、いくつかのセットアップ安全な基本要素を扱います:
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

チャネルが環境変数駆動セットアップまたは認証をサポートし、汎用起動/設定フローが実行時ロード前にそれらの環境変数名を知る必要がある場合は、Pluginマニフェスト内で `channelEnvVars` として宣言してください。チャネル実行時の `envVars` またはローカル定数は、オペレータ向けコピー専用にしてください。  
`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および `splitSetupEntries`

- より重い共有セットアップ/設定ヘルパー、たとえば `moveSingleAccountChannelSectionToDefaultAccount(...)` も必要な場合にのみ、より広い `openclaw/plugin-sdk/setup` 境界を使ってください

チャネルがセットアップ画面で「まずこのPluginをインストールしてください」と告知したいだけなら、`createOptionalChannelSetupSurface(...)` を優先してください。生成されるadapter/wizardは設定書き込みと最終化でfail closedし、検証、finalize、ドキュメントリンク文言の間で同じインストール必須メッセージを再利用します。

他のホットなチャネル経路でも、より広いレガシー画面より狭いヘルパーを優先してください。

- マルチアカウント設定とデフォルトアカウントフォールバックには `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、`openclaw/plugin-sdk/account-resolution`、`openclaw/plugin-sdk/account-helpers`
- 受信ルート/エンベロープとrecord-and-dispatch配線には `openclaw/plugin-sdk/inbound-envelope` と `openclaw/plugin-sdk/inbound-reply-dispatch`
- ターゲット解析/照合には `openclaw/plugin-sdk/messaging-targets`
- メディア読み込みと送信アイデンティティ/送信デリゲート、およびペイロード計画には `openclaw/plugin-sdk/outbound-media` と `openclaw/plugin-sdk/outbound-runtime`
- スレッドbindingライフサイクルとadapter登録には `openclaw/plugin-sdk/thread-bindings-runtime`
- レガシーなagent/mediaペイロード項目レイアウトがまだ必要な場合にのみ `openclaw/plugin-sdk/agent-media-payload`
- Telegramカスタムコマンド正規化、重複/競合検証、およびフォールバック安定コマンド設定契約には `openclaw/plugin-sdk/telegram-command-config`

認証専用チャネルは通常、デフォルト経路で十分です。コアが承認を処理し、Pluginは送信/認証capabilityを公開するだけです。Matrix、Slack、Telegram、カスタムチャットトランスポートのようなネイティブ承認チャネルでは、独自の承認ライフサイクルを実装するのではなく、共有ネイティブヘルパーを使ってください。

## 受信メンションポリシー

受信メンション処理は、次の2層に分けてください。

- Plugin所有の証拠収集
- 共有ポリシー評価

メンションポリシーの判定には `openclaw/plugin-sdk/channel-mention-gating` を使ってください。より広い受信ヘルパーバレルが必要な場合だけ `openclaw/plugin-sdk/channel-inbound` を使ってください。

Pluginローカルロジックに適したもの:

- ボット宛て返信の検出
- ボット引用の検出
- スレッド参加チェック
- サービス/システムメッセージの除外
- ボット参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適したもの:

- `requireMention`
- 明示的メンション結果
- 暗黙的メンション許可リスト
- コマンドバイパス
- 最終的なスキップ判定

推奨フロー:

1. ローカルのメンション情報を計算する。
2. その情報を `resolveInboundMentionDecision({ facts, policy })` に渡す。
3. 受信ゲートで `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip` を使う。

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

`api.runtime.channel.mentions` は、すでに実行時注入に依存しているバンドル版チャネルPlugin向けに、同じ共有メンションヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と `resolveInboundMentionDecision` だけが必要な場合は、無関係な受信実行時ヘルパーを読み込まないように、`openclaw/plugin-sdk/channel-mention-gating` からimportしてください。

古い `resolveMentionGating*` ヘルパーは、`openclaw/plugin-sdk/channel-inbound` 上に互換エクスポートとしてのみ残っています。新しいコードでは `resolveInboundMentionDecision({ facts, policy })` を使ってください。

## 手順

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準のPluginファイルを作成します。`package.json` 内の `channel` フィールドが、これをチャネルPluginにします。完全なパッケージメタデータ画面については、[Plugin Setup and Config](/ja-JP/plugins/sdk-setup#openclaw-channel) を参照してください。

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
      "description": "Acme ChatチャネルPlugin",
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
    `ChannelPlugin` インターフェースには、多くの任意adapter画面があります。最小構成の `id` と `setup` から始め、必要に応じてadapterを追加してください。

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

      // DM security: 誰がボットにメッセージできるか
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: 新しいDM連絡先の承認フロー
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: 返信をどう配信するか
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: プラットフォームへメッセージを送る
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

    <Accordion title="createChatChannelPluginが行ってくれること">
      低レベルadapterインターフェースを手動実装する代わりに、宣言的オプションを渡すと、builderがそれらを組み立てます。

      | オプション | 配線される内容 |
      | --- | --- |
      | `security.dm` | 設定項目からのスコープ付きDMセキュリティリゾルバ |
      | `pairing.text` | コード交換付きのテキストベースDMペアリングフロー |
      | `threading` | reply-to-modeリゾルバ（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージID）を返す送信関数 |

      完全な制御が必要な場合は、宣言的オプションの代わりに生のadapterオブジェクトを渡すこともできます。
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

    チャネル所有のCLI descriptorは `registerCliMetadata(...)` に置いてください。これにより、OpenClawは完全なチャネル実行時を有効化せずにルートヘルプへ表示でき、通常の完全ロードでも実際のコマンド登録に同じdescriptorを取り込めます。`registerFull(...)` は実行時専用の作業に使ってください。  
    `registerFull(...)` がGateway RPCメソッドを登録する場合は、Plugin固有のプレフィックスを使ってください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されており、常に `operator.admin` に解決されます。  
    `defineChannelPluginEntry` はこの登録モード分割を自動処理します。すべてのオプションについては [Entry Points](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="セットアップエントリを追加する">
    オンボーディング時の軽量ロード用に `setup-entry.ts` を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClawは、チャネルが無効または未設定のときに完全エントリの代わりにこれを読み込みます。これにより、セットアップフロー中に重い実行時コードを引き込まずに済みます。詳細は [Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップ安全なエクスポートをサイドカーモジュールへ分割しているバンドル版ワークスペースチャネルは、明示的なセットアップ時runtime setterも必要な場合、`openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使えます。

  </Step>

  <Step title="受信メッセージを処理する">
    Pluginは、プラットフォームからメッセージを受け取り、それをOpenClawへ転送する必要があります。典型的なパターンは、リクエストを検証し、チャネルの受信ハンドラ経由でディスパッチするWebhookです:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin管理認証（署名検証は自分で行う）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // あなたの受信ハンドラがメッセージをOpenClawへディスパッチします。
          // 正確な配線はプラットフォームSDKに依存します —
          // 実例はバンドル版Microsoft TeamsまたはGoogle Chat Pluginパッケージを参照してください。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      受信メッセージ処理はチャネル固有です。各チャネルPluginは独自の受信パイプラインを所有します。実際のパターンは、バンドル版チャネルPlugin（たとえばMicrosoft TeamsまたはGoogle Chat Pluginパッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` に同居テストを書いてください:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("設定からアカウントを解決する", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("シークレットを具体化せずにアカウントを検査する", () => {
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
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # 設定スキーマ付きマニフェスト
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開エクスポート（任意）
├── runtime-api.ts            # 内部実行時エクスポート（任意）
└── src/
    ├── channel.ts            # createChatChannelPlugin経由のChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォームAPIクライアント
    └── runtime.ts            # 実行時ストア（必要な場合）
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="スレッド化オプション" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、またはカスタムの返信モード
  </Card>
  <Card title="Messageツール統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageToolとアクション検出
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="実行時ヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime経由のTTS、STT、メディア、subagent
  </Card>
</CardGroup>

<Note>
一部のバンドル版ヘルパー境界は、バンドル版Pluginの保守と互換性のためにまだ存在します。これらは新しいチャネルPlugin向けの推奨パターンではありません。直接そのバンドル版Pluginファミリーを保守している場合を除き、共通SDK画面から汎用のchannel/setup/reply/runtimeサブパスを優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — Pluginがモデルも提供する場合
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なサブパスimportリファレンス
- [SDK Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティと契約テスト
- [Plugin Manifest](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマ
