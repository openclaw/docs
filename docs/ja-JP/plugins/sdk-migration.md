---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - 2026.4.25 より前の OpenClaw で api.registerEmbeddedExtensionFactory を使用していた
    - Plugin を最新の Plugin アーキテクチャに更新しています
    - 外部 OpenClaw Pluginを保守している
sidebarTitle: Migrate to SDK
summary: 従来の後方互換性レイヤーから最新の plugin SDK に移行する
title: Plugin SDK の移行
x-i18n:
    generated_at: "2026-07-05T11:36:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed78d88fde5449c4e8f979839a729e05348a4307a85ef9839be9d98a29b93178
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClawは、広範な後方互換性レイヤーを、小さく焦点を絞ったインポートで構成された現代的なPlugin
アーキテクチャに置き換えました。あなたのPluginがその変更以前のものである場合、このガイドはそれを現在のコントラクトへ移行するためのものです。

## 変更点

以前は、2つの広く開かれたインポート面により、Pluginは単一のエントリポイントからほぼ何にでもアクセスできました。

- **`openclaw/plugin-sdk/compat`** - 新しいアーキテクチャの構築中に、古いフックベースのPluginを動作させ続けるため、数十個のヘルパーを再エクスポートしていました。
- **`openclaw/plugin-sdk/infra-runtime`** - システムイベント、Heartbeat状態、配信キュー、fetch/proxyヘルパー、ファイルヘルパー、承認型、無関係なユーティリティを混在させた広範なバレルでした。
- **`openclaw/plugin-sdk/config-runtime`** - 移行期間中に非推奨の直接load/writeヘルパーをまだ含んでいた、広範なconfigバレルでした。
- **`openclaw/extension-api`** - 埋め込みエージェントランナーなど、ホスト側ヘルパーへの直接アクセスをPluginに与えるブリッジでした。
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result`などの埋め込みランナーイベントを監視する、削除済みの埋め込みランナー専用フックです。代わりにエージェントのtool-resultミドルウェアを使用してください（[埋め込みtool-result拡張をミドルウェアへ移行する](#how-to-migrate)を参照）。

これらの面は**非推奨**です。まだ動作しますが、新しいPluginは使用してはならず、既存のPluginも次のメジャーリリースで削除される前に移行する必要があります。`registerEmbeddedExtensionFactory`はすでに削除されています。レガシー登録はもうロードされません。

<Warning>
  後方互換性レイヤーは将来のメジャーリリースで削除されます。
  これらの面からまだインポートしているPluginは、その時点で壊れます。
</Warning>

OpenClawは、置き換えを導入する同じ変更で、ドキュメント化されたPluginの動作を削除または再解釈しません。破壊的なコントラクト変更は、まず互換性アダプター、診断、ドキュメント、非推奨期間を経由します。これはSDKインポート、manifestフィールド、セットアップAPI、フック、ランタイム登録の動作に適用されます。

### 理由

- **起動が遅い** - 1つのヘルパーをインポートすると、数十個の無関係なモジュールがロードされていました。
- **循環依存** - 広範な再エクスポートにより、インポートサイクルを簡単に作成できました。
- **不明確なAPI面** - 安定したエクスポートと内部用エクスポートを見分ける方法がありませんでした。

各`openclaw/plugin-sdk/<subpath>`は現在、ドキュメント化されたコントラクトを持つ、小さく自己完結したモジュールです。

バンドルされたチャンネル向けのレガシープロバイダー便利シームも削除されました。チャンネルブランド付きのヘルパーショートカットは、プライベートなモノレポ上の便宜であり、安定したPluginコントラクトではありませんでした。代わりに、狭い汎用SDKサブパスを使用してください。バンドルPluginワークスペース内では、プロバイダー所有のヘルパーをそのPlugin自身の`api.ts`または`runtime-api.ts`に保持してください。

- AnthropicはClaude固有のストリームヘルパーを自身の`api.ts` / `contract-api.ts`シームに保持します。
- OpenAIはプロバイダービルダー、デフォルトモデルヘルパー、realtimeプロバイダービルダーを自身の`api.ts`に保持します。
- OpenRouterはプロバイダービルダーとオンボーディング/configヘルパーを自身の`api.ts`に保持します。

## 互換性ポリシー

外部Pluginの互換性作業は、次の順序に従います。

1. 新しいコントラクトを追加する。
2. 互換性アダプターを通して古い動作を接続したままにする。
3. 古いパスと置き換え先を示す診断または警告を出す。
4. 両方のパスをテストでカバーする。
5. 非推奨化と移行パスをドキュメント化する。
6. 発表された移行期間の後、通常はメジャーリリースでのみ削除する。

manifestフィールドがまだ受け付けられる場合は、ドキュメントと診断が別の指示を出すまで使い続けてください。新しいコードではドキュメント化された置き換えを優先する必要がありますが、既存のPluginは通常のマイナーリリース中に壊れるべきではありません。

現在の移行キューを`pnpm plugins:boundary-report`で監査します。

| フラグ | 効果 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（または`pnpm plugins:boundary-report:summary`） | 完全な詳細ではなくコンパクトな件数を表示します。 |
| `--json` | 機械可読なレポート。 |
| `--owner <id>` | 1つのPluginまたは互換性所有者に絞り込みます。 |
| `--fail-on-cross-owner` | 所有者をまたぐ予約済みSDKインポートで非ゼロ終了します。 |
| `--fail-on-eligible-compat` | 非推奨compatレコードの`removeAfter`日付が過ぎている場合に非ゼロ終了します。 |
| `--fail-on-unclassified-unused-reserved` | 未使用の分類されていない予約済みSDKシムで非ゼロ終了します。 |

`pnpm plugins:boundary-report:ci`は3つすべてのfailフラグを付けて実行されます。各互換性レコードには、曖昧な「次のメジャーリリース」ではなく、明示的な`removeAfter`日付があります。レポートは非推奨レコードをその日付でグループ化し、ローカルのコード/ドキュメント参照を数え、所有者をまたぐ予約済みSDKインポートを表示し、プライベートなmemory-host SDKブリッジを要約します。予約済みSDKサブパスには、追跡された所有者利用が必要です。未使用の予約済みエクスポートは公開SDKから削除する必要があります。

## 移行方法

<Steps>
  <Step title="Migrate runtime config load/write helpers">
    バンドルされたPluginは、`api.runtime.config.loadConfig()`と
    `api.runtime.config.writeConfigFile(...)`を直接呼び出すのをやめる必要があります。アクティブな呼び出しパスにすでに渡されているconfigを優先してください。現在のプロセススナップショットが必要な長寿命ハンドラーは`api.runtime.config.current()`を使用できます。長寿命のエージェントツールは、config書き込み前に作成されたツールでも更新済みconfigを見られるように、`execute`内で`ctx.getRuntimeConfig()`を読む必要があります。

    config書き込みは、明示的な書き込み後ポリシーを持つトランザクションヘルパーを通します。

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    変更にクリーンなgateway再起動が必要な場合は`afterWrite: { mode: "restart", reason: "..." }`を使用し、呼び出し元が後続処理を所有し、意図的にリロードプランナーを抑制する場合にのみ`afterWrite: { mode: "none", reason: "..." }`を使用してください。ミューテーション結果には、テストとログ用の型付き`followUp`要約が含まれます。gatewayは引き続き、再起動の適用またはスケジュールを担当します。

    `loadConfig`と`writeConfigFile`は外部Plugin向けの非推奨互換性ヘルパーとして残り、`runtime-config-load-write`互換性コードで一度だけ警告します。バンドルされたPluginとリポジトリランタイムコードは、`pnpm check:deprecated-api-usage`と`pnpm check:no-runtime-action-load-config`でガードされています。新しい本番Plugin利用は即座に失敗し、直接config書き込みは失敗し、gatewayサーバーメソッドはリクエストランタイムスナップショットを使用する必要があり、ランタイムチャンネルのsend/action/clientヘルパーは境界からconfigを受け取る必要があり、長寿命ランタイムモジュールでは周囲の`loadConfig()`呼び出しをゼロにする必要があります。

    新しいPluginコードでは、広範な`openclaw/plugin-sdk/config-runtime`バレルを避ける必要があります。用途に合った狭いサブパスを使用してください。

    | 必要なもの | インポート |
    | --- | --- |
    | `OpenClawConfig`などのconfig型 | `openclaw/plugin-sdk/config-contracts` |
    | ロード済みconfigアサーションとPluginエントリconfig検索 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 現在のランタイムスナップショットの読み取り | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | config書き込み | `openclaw/plugin-sdk/config-mutation` |
    | セッションストアヘルパー | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdownテーブルconfig | `openclaw/plugin-sdk/markdown-table-runtime` |
    | グループポリシーランタイムヘルパー | `openclaw/plugin-sdk/runtime-group-policy` |
    | secret入力解決 | `openclaw/plugin-sdk/secret-input-runtime` |
    | モデル/セッションのオーバーライド | `openclaw/plugin-sdk/model-session-runtime` |

    バンドルされたPluginとそのテストは、インポートとモックが必要な動作に対してローカルに保たれるよう、広範なバレルに対してスキャナーでガードされています。バレルは外部互換性のためにまだ存在しますが、新しいコードはそれに依存すべきではありません。

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    バンドルされたPluginは、埋め込みランナー専用の
    `api.registerEmbeddedExtensionFactory(...)` tool-resultハンドラーを、ランタイム中立なミドルウェアに置き換える必要があります。

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    同時にPlugin manifestを更新します。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    インストール済みPluginも、明示的に有効化され、対象となるすべてのランタイムが`contracts.agentToolResultMiddleware`で宣言されている場合、tool-resultミドルウェアを登録できます。宣言されていないインストール済みミドルウェア登録は拒否されます。

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    承認対応チャンネルPluginは、`approvalCapability.nativeRuntime`と共有runtime-contextレジストリを通じて、ネイティブ承認動作を公開します。

    - `approvalCapability.handler.loadRuntime(...)`を`approvalCapability.nativeRuntime`に置き換えます。
    - 承認固有のauth/deliveryをレガシーの`plugin.auth` / `plugin.approvals`配線から外し、`approvalCapability`へ移します。
    - `ChannelPlugin.approvals`は公開channel-pluginコントラクトから削除されました。delivery/native/renderフィールドを`approvalCapability`へ移してください。
    - `plugin.auth`はチャンネルlogin/logoutフロー専用として残ります。coreはもうそこで承認authフックを読みません。
    - チャンネル所有のランタイムオブジェクト（clients、tokens、Bolt apps）は`openclaw/plugin-sdk/channel-runtime-context`を通じて登録します。
    - ネイティブ承認ハンドラーからPlugin所有の再ルーティング通知を送信しないでください。coreは実際の配信結果に基づく別ルート通知を所有します。
    - `channelRuntime`を`createChannelManager(...)`へ渡す場合は、本物の`createPluginRuntime().channel`面を提供してください。部分スタブは拒否されます。

    現在の承認capabilityレイアウトについては、[Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)を参照してください。

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    あなたのPluginが`openclaw/plugin-sdk/windows-spawn`を使用している場合、解決できないWindowsの`.cmd`/`.bat`ラッパーは、明示的に`allowShellFallback: true`を渡さない限り、現在はfail closedします。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    呼び出し元がshell fallbackに意図的に依存していない場合は、`allowShellFallback`を設定せず、代わりにスローされたエラーを処理してください。

  </Step>

  <Step title="Find deprecated imports">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Replace with focused imports">
    古い面の各エクスポートは、特定の現代的なインポートパスに対応します。

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    ホスト側ヘルパーには、直接 import する代わりに、注入された Plugin ランタイムを使用します。

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    他のレガシーブリッジヘルパーにも同じパターンを適用します。

    | 古い import | モダンな同等機能 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | セッションストアヘルパー | `api.runtime.agent.session.*` |

  </Step>

  <Step title="広範な infra-runtime import を置き換える">
    `openclaw/plugin-sdk/infra-runtime` は外部互換性のためにまだ存在しますが、新しいコードでは実際に必要な集約されたサーフェスを import してください。

    | 必要なもの | Import |
    | --- | --- |
    | システムイベントキューヘルパー | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat の wake、イベント、可視性ヘルパー | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 保留中の配信キューの drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | チャネルアクティビティのテレメトリ | `openclaw/plugin-sdk/channel-activity-runtime` |
    | インメモリおよび永続バックエンド付き dedupe キャッシュ | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全なローカルファイル/メディアパスヘルパー | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher 対応 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | プロキシおよびガード付き fetch ヘルパー | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher ポリシー型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 承認リクエスト/解決型 | `openclaw/plugin-sdk/approval-runtime` |
    | 承認返信ペイロードおよびコマンドヘルパー | `openclaw/plugin-sdk/approval-reply-runtime` |
    | エラー整形ヘルパー | `openclaw/plugin-sdk/error-runtime` |
    | トランスポート準備完了待機 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | セキュアトークンヘルパー | `openclaw/plugin-sdk/secure-random-runtime` |
    | 境界付き非同期タスク並行実行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数値変換 | `openclaw/plugin-sdk/number-runtime` |
    | プロセスローカル非同期ロック | `openclaw/plugin-sdk/async-lock-runtime` |
    | ファイルロック | `openclaw/plugin-sdk/file-lock` |

    バンドル Plugin は `infra-runtime` に対してスキャナーでガードされているため、リポジトリ内コードが広範な barrel に戻ることはできません。

  </Step>

  <Step title="チャネルルートヘルパーを移行する">
    新しいチャネルルートコードでは `openclaw/plugin-sdk/channel-route` を使用します。古い route-key 名と comparable-target 名は互換エイリアスとして残っています。

    | 古いヘルパー | モダンなヘルパー |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    モダンなルートヘルパーは、ネイティブ承認、返信抑制、受信 dedupe、Cron 配信、セッションルーティング全体で `{ channel, to, accountId, threadId }` を一貫して正規化します。

    `plugin-sdk/channel-route` の `ChannelMessagingAdapter.parseExplicitTarget`、パーサーバックの loaded-route ヘルパー（`parseExplicitTargetForLoadedChannel`、`resolveRouteTargetForLoadedChannel`）、または `resolveChannelRouteTargetWithParser(...)` の新しい使用は追加しないでください。これらは非推奨で、古い Plugin のためだけに残っています。新しいチャネル Plugin は、target-id 正規化とディレクトリ未検出時のフォールバックには `messaging.targetResolver.resolveTarget(...)` を、core が早期に peer 種別を必要とする場合には `messaging.inferTargetChatType(...)` を、provider ネイティブのセッションおよびスレッド identity には `messaging.resolveOutboundSessionRoute(...)` を使用してください。

  </Step>

  <Step title="ビルドとテスト">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Import パスリファレンス

  <Accordion title="Common import path table">
  | インポートパス | 目的 | 主なエクスポート |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規のPluginエントリヘルパー | `definePluginEntry` |
  | `plugin-sdk/core` | チャンネルエントリ定義/ビルダー向けのレガシー包括再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定スキーマのエクスポート | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一プロバイダーエントリヘルパー | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 焦点を絞ったチャンネルエントリ定義とビルダー | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有セットアップウィザードヘルパー | セットアップトランスレーター、allowlistプロンプト、セットアップステータスビルダー |
  | `plugin-sdk/setup-runtime` | セットアップ時ランタイムヘルパー | `createSetupTranslator`, インポート安全なセットアップパッチアダプター、lookup-noteヘルパー、`promptResolvedAllowFrom`, `splitSetupEntries`, 委譲セットアッププロキシ |
  | `plugin-sdk/setup-adapter-runtime` | 非推奨のセットアップアダプターエイリアス | `plugin-sdk/setup-runtime` を使用 |
  | `plugin-sdk/setup-tools` | セットアップツールヘルパー | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 複数アカウントヘルパー | アカウントリスト/設定/アクションゲートヘルパー |
  | `plugin-sdk/account-id` | アカウントIDヘルパー | `DEFAULT_ACCOUNT_ID`, アカウントID正規化 |
  | `plugin-sdk/account-resolution` | アカウント検索ヘルパー | アカウント検索 + デフォルトフォールバックヘルパー |
  | `plugin-sdk/account-helpers` | 範囲を絞ったアカウントヘルパー | アカウントリスト/アカウントアクションヘルパー |
  | `plugin-sdk/channel-setup` | セットアップウィザードアダプター | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DMペアリングプリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信プレフィックス、入力中表示、ソース配信の配線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定アダプターファクトリーとDMアクセスヘルパー | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定スキーマビルダー | 共有チャンネル設定スキーマプリミティブと汎用ビルダーのみ |
  | `plugin-sdk/bundled-channel-config-schema` | バンドル設定スキーマ | OpenClaw管理のバンドルPluginのみ。新しいPluginはPluginローカルスキーマを定義する必要があります |
  | `plugin-sdk/channel-config-schema-legacy` | 非推奨のバンドル設定スキーマ | 互換性エイリアスのみ。保守対象のバンドルPluginには `plugin-sdk/bundled-channel-config-schema` を使用 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンド設定ヘルパー | コマンド名正規化、説明のトリミング、重複/競合検証 |
  | `plugin-sdk/channel-policy` | グループ/DMポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/inbound-envelope` | インバウンドエンベロープヘルパー | 共有ルート + エンベロープビルダーヘルパー |
  | `plugin-sdk/channel-inbound` | インバウンド受信ヘルパー | コンテキスト構築、フォーマット、ルート、ランナー、準備済み返信ディスパッチ、ディスパッチ述語 |
  | `plugin-sdk/messaging-targets` | 非推奨のターゲット解析インポートパス | 汎用ターゲット解析ヘルパーには `plugin-sdk/channel-targets`、ルート比較には `plugin-sdk/channel-route`、プロバイダー固有のターゲット解決にはPlugin所有の `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` を使用 |
  | `plugin-sdk/outbound-media` | アウトバウンドメディアヘルパー | 共有アウトバウンドメディア読み込み |
  | `plugin-sdk/outbound-send-deps` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/channel-outbound` | アウトバウンドメッセージライフサイクルヘルパー | メッセージアダプター、受信確認、永続送信ヘルパー、ライブプレビュー/ストリーミングヘルパー、返信オプション、ライフサイクルヘルパー、アウトバウンドID、ペイロード計画 |
  | `plugin-sdk/channel-streaming` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/outbound-runtime` | 非推奨の互換性ファサード | `plugin-sdk/channel-outbound` を使用 |
  | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングヘルパー | スレッドバインディングのライフサイクルとアダプターヘルパー |
  | `plugin-sdk/agent-media-payload` | レガシーメディアペイロードヘルパー | レガシーフィールドレイアウト用のエージェントメディアペイロードビルダー |
  | `plugin-sdk/channel-runtime` | 非推奨の互換性shim | レガシーチャンネルランタイムユーティリティのみ |
  | `plugin-sdk/channel-send-result` | 送信結果型 | 返信結果型 |
  | `plugin-sdk/runtime-store` | 永続Pluginストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムヘルパー | ランタイム/ロギング/バックアップ/Pluginインストールヘルパー |
  | `plugin-sdk/runtime-env` | 範囲を絞ったランタイム環境ヘルパー | ロガー/ランタイム環境、タイムアウト、リトライ、バックオフヘルパー |
  | `plugin-sdk/plugin-runtime` | 共有Pluginランタイムヘルパー | Pluginコマンド/フック/http/インタラクティブヘルパー |
  | `plugin-sdk/hook-runtime` | フックパイプラインヘルパー | 共有Webhook/内部フックパイプラインヘルパー |
  | `plugin-sdk/lazy-runtime` | 遅延ランタイムヘルパー | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | プロセスヘルパー | 共有execヘルパー |
  | `plugin-sdk/cli-runtime` | CLIランタイムヘルパー | コマンドフォーマット、待機、バージョンヘルパー |
  | `plugin-sdk/gateway-runtime` | Gatewayヘルパー | Gatewayクライアント、イベントループ準備済み開始ヘルパー、通知されるLANホスト解決、チャンネルステータスパッチヘルパー |
  | `plugin-sdk/config-runtime` | 非推奨の設定互換性shim | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` を推奨 |
  | `plugin-sdk/telegram-command-config` | Telegramコマンドヘルパー | バンドルTelegram契約サーフェスが利用できない場合のフォールバック安定なTelegramコマンド検証ヘルパー |
  | `plugin-sdk/approval-runtime` | 承認プロンプトヘルパー | exec/Plugin承認ペイロード、承認機能/プロファイルヘルパー、ネイティブ承認ルーティング/ランタイムヘルパー、構造化承認表示パスフォーマット |
  | `plugin-sdk/approval-auth-runtime` | 承認認証ヘルパー | 承認者解決、同一チャットアクション認証 |
  | `plugin-sdk/approval-client-runtime` | 承認クライアントヘルパー | ネイティブexec承認プロファイル/フィルターヘルパー |
  | `plugin-sdk/approval-delivery-runtime` | 承認配信ヘルパー | ネイティブ承認機能/配信アダプター |
  | `plugin-sdk/approval-gateway-runtime` | 承認Gatewayヘルパー | 共有承認Gateway解決ヘルパー |
  | `plugin-sdk/approval-handler-adapter-runtime` | 承認アダプターヘルパー | ホットチャンネルエントリポイント向けの軽量ネイティブ承認アダプター読み込みヘルパー |
  | `plugin-sdk/approval-handler-runtime` | 承認ハンドラーヘルパー | より広範な承認ハンドラーランタイムヘルパー。十分な場合は、より狭いアダプター/Gateway境界を推奨 |
  | `plugin-sdk/approval-native-runtime` | 承認ターゲットヘルパー | ネイティブ承認ターゲット/アカウントバインディングヘルパー |
  | `plugin-sdk/approval-reply-runtime` | 承認返信ヘルパー | exec/Plugin承認返信ペイロードヘルパー |
  | `plugin-sdk/channel-runtime-context` | チャンネルランタイムコンテキストヘルパー | 汎用チャンネルランタイムコンテキストの登録/get/watchヘルパー |
  | `plugin-sdk/security-runtime` | セキュリティヘルパー | 共有信頼、DMゲート、ルート境界付きファイル/パスヘルパー、外部コンテンツ、シークレット収集ヘルパー |
  | `plugin-sdk/ssrf-policy` | SSRFポリシーヘルパー | ホストallowlistとプライベートネットワークポリシーヘルパー |
  | `plugin-sdk/ssrf-runtime` | SSRFランタイムヘルパー | ピン留めdispatcher、ガード付きfetch、SSRFポリシーヘルパー |
  | `plugin-sdk/system-event-runtime` | システムイベントヘルパー | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeatヘルパー | Heartbeat起動、イベント、可視性ヘルパー |
  | `plugin-sdk/delivery-queue-runtime` | 配信キューヘルパー | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | チャンネルアクティビティヘルパー | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複排除ヘルパー | インメモリおよび永続バックエンド付き重複排除キャッシュ |
  | `plugin-sdk/file-access-runtime` | ファイルアクセスヘルパー | 安全なローカルファイル/メディアパスヘルパー |
  | `plugin-sdk/transport-ready-runtime` | トランスポート準備状態ヘルパー | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | exec承認ポリシーヘルパー | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 境界付きキャッシュヘルパー | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断ゲートヘルパー | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | エラーフォーマットヘルパー | `formatUncaughtError`, `isApprovalNotFoundError`, エラーグラフヘルパー |
  | `plugin-sdk/fetch-runtime` | ラップされたfetch/プロキシヘルパー | `resolveFetch`, プロキシヘルパー、EnvHttpProxyAgentオプションヘルパー |
  | `plugin-sdk/host-runtime` | ホスト正規化ヘルパー | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | リトライヘルパー | `RetryConfig`, `retryAsync`, ポリシーランナー |
  | `plugin-sdk/allow-from` | allowlistフォーマットと入力マッピング | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | コマンドゲートとコマンドサーフェスヘルパー | `resolveControlCommandGate`, 送信者認可ヘルパー、動的引数メニューフォーマットを含むコマンドレジストリヘルパー |
  | `plugin-sdk/command-status` | コマンドステータス/ヘルプレンダラー | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | シークレット入力解析 | シークレット入力ヘルパー |
  | `plugin-sdk/webhook-ingress` | Webhookリクエストヘルパー | Webhookターゲットユーティリティ |
  | `plugin-sdk/webhook-request-guards` | Webhook本文ガードヘルパー | リクエスト本文の読み取り/制限ヘルパー |
  | `plugin-sdk/reply-runtime` | 共有返信ランタイム | インバウンドディスパッチ、Heartbeat、返信プランナー、チャンク化 |
  | `plugin-sdk/reply-dispatch-runtime` | 範囲を絞った返信ディスパッチヘルパー | finalization、プロバイダーディスパッチ、会話ラベルヘルパー |
  | `plugin-sdk/reply-history` | 返信履歴ヘルパー | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` などの非推奨mapヘルパー互換性エクスポート |
  | `plugin-sdk/reply-reference` | 返信参照計画 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 返信チャンクヘルパー | テキスト/Markdownチャンク化ヘルパー |
  | `plugin-sdk/session-store-runtime` | セッションストアヘルパー | ストアパス + updated-atヘルパー |
  | `plugin-sdk/state-paths` | 状態パスヘルパー | 状態およびOAuthディレクトリヘルパー |
  | `plugin-sdk/routing` | ルーティング/セッションキーヘルパー | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、セッションキー正規化ヘルパー |
  | `plugin-sdk/status-helpers` | チャンネルステータスヘルパー | チャンネル/アカウントステータス概要ビルダー、ランタイム状態のデフォルト、課題メタデータヘルパー |
  | `plugin-sdk/target-resolver-runtime` | ターゲット解決ヘルパー | 共有ターゲット解決ヘルパー |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化ヘルパー | スラッグ/文字列正規化ヘルパー |
  | `plugin-sdk/request-url` | リクエスト URL ヘルパー | リクエスト風入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付きコマンドヘルパー | 正規化された stdout/stderr を持つ時間制限付きコマンドランナー |
  | `plugin-sdk/param-readers` | パラメーターリーダー | 共通ツール/CLI パラメーターリーダー |
  | `plugin-sdk/tool-payload` | ツールペイロード抽出 | ツール結果オブジェクトから正規化ペイロードを抽出 |
  | `plugin-sdk/tool-send` | ツール送信抽出 | ツール引数から正規送信先フィールドを抽出 |
  | `plugin-sdk/temp-path` | 一時パスヘルパー | 共有一時ダウンロードパスヘルパー |
  | `plugin-sdk/logging-core` | ロギングヘルパー | サブシステムロガーと秘匿化ヘルパー |
  | `plugin-sdk/markdown-table-runtime` | Markdown テーブルヘルパー | Markdown テーブルモードヘルパー |
  | `plugin-sdk/reply-payload` | メッセージ返信タイプ | 返信ペイロードタイプ |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホストプロバイダーセットアップヘルパー | セルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換セルフホストプロバイダー専用セットアップヘルパー | 同じセルフホストプロバイダーの検出/設定ヘルパー |
  | `plugin-sdk/provider-auth-runtime` | プロバイダーランタイム認証ヘルパー | ランタイム API キー解決ヘルパー |
  | `plugin-sdk/provider-auth-api-key` | プロバイダー API キーセットアップヘルパー | API キーオンボーディング/プロファイル書き込みヘルパー |
  | `plugin-sdk/provider-auth-result` | プロバイダー認証結果ヘルパー | 標準 OAuth 認証結果ビルダー |
  | `plugin-sdk/provider-selection-runtime` | プロバイダー選択ヘルパー | 設定済みまたは自動のプロバイダー選択と生プロバイダー設定のマージ |
  | `plugin-sdk/provider-env-vars` | プロバイダー環境変数ヘルパー | プロバイダー認証環境変数検索ヘルパー |
  | `plugin-sdk/provider-model-shared` | 共有プロバイダーモデル/リプレイヘルパー | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共有リプレイポリシービルダー、プロバイダーエンドポイントヘルパー、モデル ID 正規化ヘルパー |
  | `plugin-sdk/provider-catalog-shared` | 共有プロバイダーカタログヘルパー | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | プロバイダーオンボーディングパッチ | オンボーディング設定ヘルパー |
  | `plugin-sdk/provider-http` | プロバイダー HTTP ヘルパー | 音声文字起こしマルチパートフォームヘルパーを含む、汎用プロバイダー HTTP/エンドポイント機能ヘルパー |
  | `plugin-sdk/provider-web-fetch` | プロバイダー web-fetch ヘルパー | web-fetch プロバイダー登録/キャッシュヘルパー |
  | `plugin-sdk/provider-web-search-config-contract` | プロバイダー Web 検索設定ヘルパー | プラグイン有効化配線を必要としないプロバイダー向けの狭い Web 検索設定/認証情報ヘルパー |
  | `plugin-sdk/provider-web-search-contract` | プロバイダー Web 検索コントラクトヘルパー | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、スコープ付き認証情報 setter/getter などの狭い Web 検索設定/認証情報コントラクトヘルパー |
  | `plugin-sdk/provider-web-search` | プロバイダー Web 検索ヘルパー | Web 検索プロバイダー登録/キャッシュ/ランタイムヘルパー |
  | `plugin-sdk/provider-tools` | プロバイダーツール/スキーマ互換ヘルパー | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、DeepSeek/Gemini/OpenAI スキーマクリーンアップ + 診断 |
  | `plugin-sdk/provider-usage` | プロバイダー使用量ヘルパー | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`、その他のプロバイダー使用量ヘルパー |
  | `plugin-sdk/provider-stream` | プロバイダーストリームラッパーヘルパー | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、ストリームラッパータイプ、共有 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot ラッパーヘルパー |
  | `plugin-sdk/provider-transport-runtime` | プロバイダートランスポートヘルパー | ガード付き fetch、ツール結果テキスト抽出、トランスポートメッセージ変換、書き込み可能トランスポートイベントストリームなどのネイティブプロバイダートランスポートヘルパー |
  | `plugin-sdk/keyed-async-queue` | 順序付き非同期キュー | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有メディアヘルパー | メディア fetch/変換/保存ヘルパー、ffprobe ベースの動画寸法プローブ、メディアペイロードビルダー |
  | `plugin-sdk/media-generation-runtime` | 共有メディア生成ヘルパー | 画像/動画/音楽生成向けの共有フェイルオーバーヘルパー、候補選択、欠落モデルメッセージング |
  | `plugin-sdk/media-understanding` | メディア理解ヘルパー | メディア理解プロバイダータイプと、プロバイダー向け画像/音声ヘルパーエクスポート |
  | `plugin-sdk/text-runtime` | 非推奨の広範なテキスト互換エクスポート | `string-coerce-runtime`、`text-chunking`、`text-utility-runtime`、`logging-core` を使用 |
  | `plugin-sdk/text-chunking` | テキストチャンク化ヘルパー | 送信テキストチャンク化ヘルパー |
  | `plugin-sdk/speech` | 音声ヘルパー | 音声プロバイダータイプと、プロバイダー向けディレクティブ、レジストリ、検証ヘルパー、OpenAI 互換 TTS ビルダー |
  | `plugin-sdk/speech-core` | 共有音声コア | 音声プロバイダータイプ、レジストリ、ディレクティブ、正規化 |
  | `plugin-sdk/realtime-transcription` | リアルタイム文字起こしヘルパー | プロバイダータイプ、レジストリヘルパー、共有 WebSocket セッションヘルパー |
  | `plugin-sdk/realtime-voice` | リアルタイム音声ヘルパー | プロバイダータイプ、レジストリ/解決ヘルパー、ブリッジセッションヘルパー、共有エージェントトークバックキュー、アクティブ実行音声制御、トランスクリプト/イベント健全性、エコー抑制、相談質問マッチング、強制相談調整、ターンコンテキスト追跡、出力アクティビティ追跡、高速コンテキスト相談ヘルパー |
  | `plugin-sdk/image-generation` | 画像生成ヘルパー | 画像生成プロバイダータイプと画像アセット/データ URL ヘルパー、OpenAI 互換画像プロバイダービルダー |
  | `plugin-sdk/image-generation-core` | 共有画像生成コア | 画像生成タイプ、フェイルオーバー、認証、レジストリヘルパー |
  | `plugin-sdk/music-generation` | 音楽生成ヘルパー | 音楽生成プロバイダー/リクエスト/結果タイプ |
  | `plugin-sdk/music-generation-core` | 共有音楽生成コア | 音楽生成タイプ、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/video-generation` | 動画生成ヘルパー | 動画生成プロバイダー/リクエスト/結果タイプ |
  | `plugin-sdk/video-generation-core` | 共有動画生成コア | 動画生成タイプ、フェイルオーバーヘルパー、プロバイダー検索、モデル参照解析 |
  | `plugin-sdk/interactive-runtime` | インタラクティブ返信ヘルパー | インタラクティブ返信ペイロードの正規化/縮約 |
  | `plugin-sdk/channel-config-primitives` | チャンネル設定プリミティブ | 狭いチャンネル設定スキーマプリミティブ |
  | `plugin-sdk/channel-config-writes` | チャンネル設定書き込みヘルパー | チャンネル設定書き込み認可ヘルパー |
  | `plugin-sdk/channel-plugin-common` | 共有チャンネルプリリュード | 共有チャンネルプラグインプリリュードエクスポート |
  | `plugin-sdk/channel-status` | チャンネルステータスヘルパー | 共有チャンネルステータススナップショット/概要ヘルパー |
  | `plugin-sdk/allowlist-config-edit` | 許可リスト設定ヘルパー | 許可リスト設定編集/読み取りヘルパー |
  | `plugin-sdk/group-access` | グループアクセスヘルパー | 共有グループアクセス判定ヘルパー |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 非推奨の互換ファサード | `plugin-sdk/channel-inbound` を使用 |
  | `plugin-sdk/direct-dm-guard-policy` | ダイレクト DM ガードヘルパー | 暗号化前の狭いガードポリシーヘルパー |
  | `plugin-sdk/extension-shared` | 共有拡張ヘルパー | パッシブチャンネル/ステータスとアンビエントプロキシヘルパープリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook ターゲットヘルパー | Webhook ターゲットレジストリとルートインストールヘルパー |
  | `plugin-sdk/webhook-path` | 非推奨の Webhook パスエイリアス | `plugin-sdk/webhook-ingress` を使用 |
  | `plugin-sdk/web-media` | 共有 Web メディアヘルパー | リモート/ローカルメディア読み込みヘルパー |
  | `plugin-sdk/zod` | 非推奨の Zod 互換再エクスポート | `zod` から `zod` を直接インポート |
  | `plugin-sdk/memory-core` | バンドルされた memory-core ヘルパー | メモリマネージャー/設定/ファイル/CLI ヘルパーサーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | メモリエンジンランタイムファサード | メモリインデックス/検索ランタイムファサード |
  | `plugin-sdk/memory-core-host-embedding-registry` | メモリ埋め込みレジストリ | 軽量メモリ埋め込みプロバイダーレジストリヘルパー |
  | `plugin-sdk/memory-core-host-engine-foundation` | メモリホスト基盤エンジン | メモリホスト基盤エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-embeddings` | メモリホスト埋め込みエンジン | メモリ埋め込みコントラクト、レジストリアクセス、ローカルプロバイダー、汎用バッチ/リモートヘルパー。具体的なリモートプロバイダーは所有元プラグインに存在 |
  | `plugin-sdk/memory-core-host-engine-qmd` | メモリホスト QMD エンジン | メモリホスト QMD エンジンエクスポート |
  | `plugin-sdk/memory-core-host-engine-storage` | メモリホストストレージエンジン | メモリホストストレージエンジンエクスポート |
  | `plugin-sdk/memory-core-host-multimodal` | メモリホストマルチモーダルヘルパー | メモリホストマルチモーダルヘルパー |
  | `plugin-sdk/memory-core-host-query` | メモリホストクエリヘルパー | メモリホストクエリヘルパー |
  | `plugin-sdk/memory-core-host-secret` | メモリホストシークレットヘルパー | メモリホストシークレットヘルパー |
  | `plugin-sdk/memory-core-host-events` | 非推奨のメモリイベントエイリアス | `plugin-sdk/memory-host-events` を使用 |
  | `plugin-sdk/memory-core-host-status` | メモリホストステータスヘルパー | メモリホストステータスヘルパー |
  | `plugin-sdk/memory-core-host-runtime-cli` | メモリホスト CLI ランタイム | メモリホスト CLI ランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-core` | メモリホストコアランタイム | メモリホストコアランタイムヘルパー |
  | `plugin-sdk/memory-core-host-runtime-files` | メモリホストファイル/ランタイムヘルパー | メモリホストファイル/ランタイムヘルパー |
  | `plugin-sdk/memory-host-core` | メモリホストコアランタイムエイリアス | ベンダー中立のメモリホストコアランタイムヘルパーエイリアス |
  | `plugin-sdk/memory-host-events` | メモリホストイベントジャーナルエイリアス | ベンダー中立のメモリホストイベントジャーナルヘルパーエイリアス |
  | `plugin-sdk/memory-host-files` | 非推奨のメモリファイル/ランタイムエイリアス | `plugin-sdk/memory-core-host-runtime-files` を使用 |
  | `plugin-sdk/memory-host-markdown` | 管理対象 Markdown ヘルパー | メモリ隣接プラグイン向けの共有管理対象 Markdown ヘルパー |
  | `plugin-sdk/memory-host-search` | Active Memory 検索ファサード | 遅延 Active Memory 検索マネージャーランタイムファサード |
  | `plugin-sdk/memory-host-status` | 非推奨のメモリホストステータスエイリアス | `plugin-sdk/memory-core-host-status` を使用 |
  | `plugin-sdk/testing` | テストユーティリティ | リポジトリローカルの非推奨互換バレル。`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`、`plugin-sdk/test-fixtures` などの焦点を絞ったリポジトリローカルのテストサブパスを使用 |
</Accordion>

この表は共通の移行サブセットであり、完全な SDK サーフェスではありません。
コンパイラーのエントリーポイント一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあります。
パッケージエクスポートは公開サブセットから生成されます。

予約済みのバンドル Plugin ヘルパーの継ぎ目は、まだ公開済みの `@openclaw/discord` パッケージを直接インポートしている外部 Plugin 向けに保持されている、非推奨の `plugin-sdk/discord` shim のような明示的に文書化された互換性ファサードを除き、公開 SDK のエクスポートマップから廃止されました。オーナー固有のヘルパーは、所有元の Plugin パッケージ内にあります。共有ホスト動作は、`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`、`plugin-sdk/plugin-config-runtime` などの汎用 SDK コントラクトを通じて移動します。

用途に合う最も狭いインポートを使用してください。エクスポートが見つからない場合は、`src/plugin-sdk/` のソースを確認するか、どの汎用コントラクトがそれを所有すべきかをメンテナーに確認してください。

## 現在の非推奨

Plugin SDK、プロバイダーコントラクト、ランタイムサーフェス、マニフェスト全体にわたる、より狭い範囲の非推奨です。それぞれは現在も動作しますが、将来のメジャーリリースで削除されます。各項目は古い API を正規の置き換え先に対応付けています。

<AccordionGroup>
  <Accordion title="command-auth ヘルプビルダー -> command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **新 (`openclaw/plugin-sdk/command-status`)**: 同じシグネチャ、同じエクスポートです。より狭いサブパスからインポートするだけです。`command-auth` は互換性スタブとしてそれらを再エクスポートします。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention ゲーティングヘルパー -> resolveInboundMentionDecision">
    **旧**: `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating` からの
    `resolveMentionGating(params)` と
    `resolveMentionGatingWithBypass(params)`。

    **新**: `resolveInboundMentionDecision({ facts, policy })`。2 つに分かれた呼び出し形状ではなく、1 つの判断オブジェクトです。

    Discord、iMessage、Matrix、MS Teams、QQBot、Signal、Telegram、WhatsApp、Zalo 全体で採用済みです。Slack 独自の `app_mention` イベントモデルはこのヘルパーを使用しません。

  </Accordion>

  <Accordion title="チャネルランタイム shim とチャネルアクションヘルパー">
    `openclaw/plugin-sdk/channel-runtime` は古いチャネル Plugin 向けの互換性 shim です。新しいコードからインポートしないでください。ランタイムオブジェクトの登録には `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` の `channelActions*` ヘルパーは、生の「actions」チャネルエクスポートとあわせて非推奨です。代わりに、意味的な `presentation` サーフェスを通じて機能を公開してください。チャネル Plugin は、受け入れる生のアクション名ではなく、何をレンダリングするか（カード、ボタン、セレクト）を宣言します。

  </Accordion>

  <Accordion title="Web 検索プロバイダーの tool() ヘルパー -> Plugin 上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` からの `tool()` ファクトリー。

    **新**: プロバイダー Plugin 上で `createTool(...)` を直接実装します。OpenClaw はツールラッパーを登録するために SDK ヘルパーを必要としなくなりました。

  </Accordion>

  <Accordion title="平文チャネルエンベロープ -> BodyForAgent">
    **旧**: 受信チャネルメッセージからフラットな平文プロンプトエンベロープを構築するための `api.runtime.channel.reply.formatInboundEnvelope(...)`（および受信メッセージオブジェクト上の `channelEnvelope` フィールド）。

    **新**: `BodyForAgent` と構造化されたユーザーコンテキストブロック。チャネル Plugin は、ルーティングメタデータ（スレッド、トピック、返信先、リアクション）をプロンプト文字列に連結する代わりに、型付きフィールドとして添付します。`formatAgentEnvelope(...)` ヘルパーは合成されたアシスタント向けエンベロープでは引き続きサポートされますが、受信用の平文エンベロープは廃止予定です。

    影響範囲: `inbound_claim`、`message_received`、および古いエンベロープテキストを後処理していた任意のカスタムチャネル Plugin。

  </Accordion>

  <Accordion title="deactivate フック -> gateway_stop">
    **旧**: `api.on("deactivate", handler)`。

    **新**: `api.on("gateway_stop", handler)`。同じシャットダウン cleanup コントラクトです。変更されるのはフック名だけです。

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` は、2026-08-16 以降に削除されるまで、非推奨の互換性エイリアスとして引き続き配線されています。

  </Accordion>

  <Accordion title="subagent_spawning フック -> core スレッドバインディング">
    **旧**: `threadBindingReady` または `deliveryOrigin` を返す
    `api.on("subagent_spawning", handler)`。

    **新**: core に、チャネルセッションバインディングアダプターを通じて `thread: true` のサブエージェントバインディングを準備させます。起動後の観測にのみ `api.on("subagent_spawned", handler)` を使用してください。

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult`、および
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` は、外部 Plugin が移行する間だけ非推奨の互換性サーフェスとして残り、2026-08-30 以降に削除されます。

  </Accordion>

  <Accordion title="プロバイダー探索型 -> プロバイダーカタログ型">
    4 つの探索型エイリアスは現在、カタログ時代の型に対する薄いラッパーです。

    | 旧エイリアス              | 新しい型                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    加えて、レガシーの `ProviderCapabilities` 静的バッグもあります。プロバイダー Plugin は、静的オブジェクトではなく、`buildReplayPolicy`、`normalizeToolSchemas`、`wrapStreamFn` などの明示的なプロバイダーフックを使用する必要があります。

  </Accordion>

  <Accordion title="Thinking ポリシーフック -> resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上の 3 つの別個のフック）:
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 正規の `id`、任意の `label`、およびランク付けされたレベルリストを含む `ProviderThinkingProfile` を返す単一の `resolveThinkingProfile(ctx)`。OpenClaw は古い保存値をプロファイルランクに基づいて自動的にダウングレードします。

    コンテキストには、`provider`、`modelId`、任意のマージ済み `reasoning`、および任意のマージ済みモデル `compat` facts が含まれます。プロバイダー Plugin はそれらのカタログ facts を使用して、設定されたリクエストコントラクトが対応している場合にのみモデル固有のプロファイルを公開できます。

    3 つではなく 1 つのフックを実装してください。レガシーフックは非推奨期間中も動作しますが、プロファイル結果とは合成されません。

  </Accordion>

  <Accordion title="外部 auth プロバイダー -> contracts.externalAuthProviders">
    **旧**: Plugin マニフェストでプロバイダーを宣言せずに外部 auth フックを実装すること。

    **新**: Plugin マニフェストで `contracts.externalAuthProviders` を宣言し、**かつ** `resolveExternalAuthProfiles(...)` を実装します。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="プロバイダー env-var lookup -> setup.providers[].envVars">
    **旧** マニフェストフィールド: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じ env-var lookup をマニフェスト上の `setup.providers[].envVars` に反映します。これにより、セットアップ/ステータスの env メタデータが 1 か所に統合され、env-var lookup に回答するだけのために Plugin ランタイムを起動する必要がなくなります。

    `providerAuthEnvVars` は、非推奨期間が終了するまで互換性アダプターを通じてサポートされます。

  </Accordion>

  <Accordion title="Memory Plugin 登録 -> registerMemoryCapability">
    **旧**: 3 つの別個の呼び出し、`api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新**: memory-state API 上の 1 つの呼び出し、
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    同じスロットで、登録呼び出しが 1 つになります。追加的なプロンプトおよびコーパスヘルパー（`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）には影響しません。

  </Accordion>

  <Accordion title="Memory embedding プロバイダー API">
    **旧**: `api.registerMemoryEmbeddingProvider(...)` と
    `contracts.memoryEmbeddingProviders`。

    **新**: `api.registerEmbeddingProvider(...)` と
    `contracts.embeddingProviders`。

    汎用 embedding プロバイダーコントラクトは Memory 以外でも再利用可能であり、新しいプロバイダーでサポートされる経路です。既存プロバイダーが移行する間、Memory 固有の登録 API は非推奨の互換性として引き続き配線されています。Plugin 検査では、非バンドルでの使用が互換性負債として報告されます。

  </Accordion>

  <Accordion title="サブエージェントセッションメッセージ型の名称変更">
    `src/plugins/runtime/types.ts` からまだエクスポートされている 2 つのレガシー型エイリアス:

    | 旧                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は、`getSessionMessages` を優先するため非推奨です。同じシグネチャで、古いメソッドは新しいメソッドへ呼び出しを通します。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **旧**: `runtime.tasks.flow`（単数）は live task-flow アクセサーを返していました。

    **新**: `runtime.tasks.managedFlows` は、フローから子タスクを作成、更新、キャンセル、または実行する Plugin 向けに、管理対象の TaskFlow mutation ランタイムを保持します。Plugin が DTO ベースの読み取りのみを必要とする場合は、`runtime.tasks.flows` を使用してください。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    2026-07-26 以降に削除されます。

  </Accordion>

  <Accordion title="埋め込み extension ファクトリー -> エージェント tool-result middleware">
    上記の [移行方法](#how-to-migrate) で説明しています。完全性のためここにも含めます。削除された embedded-runner 専用の `api.registerEmbeddedExtensionFactory(...)` 経路は、`contracts.agentToolResultMiddleware` 内の明示的なランタイムリストを伴う `api.registerAgentToolResultMiddleware(...)` に置き換えられます。
  </Accordion>

  <Accordion title="OpenClawSchemaType エイリアス -> OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は現在、`OpenClawConfig` の 1 行エイリアスです。正規の名前を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
拡張レベルの非推奨化（`extensions/` 配下のバンドルされたチャネル/プロバイダー Plugin 内）は、それぞれ自身の `api.ts` と `runtime-api.ts` バレルで追跡されます。これらはサードパーティ Plugin の契約には影響せず、ここには記載されません。バンドルされた Plugin のローカルバレルを直接利用している場合は、アップグレード前にそのバレル内の非推奨コメントを読んでください。
</Note>

## Talk とリアルタイム音声の移行

リアルタイム音声、電話、ミーティング、ブラウザーの Talk コードは、`openclaw/plugin-sdk/realtime-voice` からエクスポートされる 1 つの Talk セッションコントローラーを共有します。このコントローラーは、共通の Talk イベントエンベロープ、アクティブなターン状態、キャプチャ状態、出力音声状態、最近のイベント履歴、古いターンの拒否を所有します。プロバイダー Plugin はベンダー固有のリアルタイムセッションを所有し、サーフェス Plugin はキャプチャ、再生、電話、ミーティング固有の挙動を所有します。

すべてのバンドル済みサーフェスは共有コントローラー上で動作します。ブラウザーリレー、管理ルームへのハンドオフ、音声通話リアルタイム、音声通話ストリーミング STT、Google Meet リアルタイム、ネイティブのプッシュツートークです。Gateway は `hello-ok.features.events` で 1 つのライブ Talk イベントチャネル `talk.event` を通知します。

低レベルアダプターまたはテストフィクスチャを実装する場合を除き、新しいコードで `createTalkEventSequencer(...)` を直接呼び出すべきではありません。共有コントローラーを使用することで、ターン ID なしでターンスコープのイベントが送信されることを防ぎ、古い `turnEnd` / `turnCancel` 呼び出しが新しいアクティブターンをクリアできないようにし、電話、ミーティング、ブラウザーリレー、管理ルームへのハンドオフ、ネイティブ Talk クライアント全体で出力音声のライフサイクルイベントを一貫させます。

公開 API の形状:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

ブラウザー所有の WebRTC/プロバイダー WebSocket セッションは `talk.client.create` を使用します。ブラウザーがプロバイダーのネゴシエーションとメディアトランスポートを所有し、Gateway が認証情報、指示、ツールポリシーを所有するためです。`talk.session.*` は、gateway-relay リアルタイム、gateway-relay 文字起こし、管理ルームのネイティブ STT/TTS セッション向けの共通 Gateway 管理サーフェスです。

`talk.provider` / `talk.providers` の横にリアルタイムセレクターを配置するレガシー設定は、`openclaw doctor --fix` で修復する必要があります。ランタイム Talk は、speech/TTS プロバイダー設定をリアルタイムプロバイダー設定として再解釈しません。

サポートされる `talk.session.create` の組み合わせは意図的に小さく保たれています。

| モード            | トランスポート       | ブレイン           | 所有者              | 注記                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway を通じてブリッジされる全二重プロバイダー音声。ツール呼び出しは agent-consult ツール経由でルーティングされます。           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | ストリーミング STT のみ。呼び出し元は入力音声を送信し、文字起こしイベントを受信します。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | ネイティブ/クライアントルーム | クライアントがキャプチャ/再生を所有し、Gateway がターン状態を所有する、プッシュツートークおよびトランシーバー形式のルーム。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | ネイティブ/クライアントルーム | Gateway ツールアクションを直接実行する、信頼済みファーストパーティサーフェス向けの管理者専用ルームモード。                  |

古い `talk.realtime.*` / `talk.transcription.*` / `talk.handoff.*` ファミリー（すべて削除済み）から移行する読者向けのメソッド対応表:

| 旧                               | 新                                                       |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` または `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

統一された制御語彙も意図的に狭く保たれています。

| メソッド                          | 適用対象                                              | 契約                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 同じ Gateway 接続が所有するプロバイダーセッションに base64 PCM 音声チャンクを追加します。                                                                                            |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 管理ルームのユーザーターンを開始します。                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 古いターンの検証後にアクティブターンを終了します。                                                                                                                                         |
| `talk.session.cancelTurn`       | すべての Gateway 所有セッション                              | ターンに対するアクティブなキャプチャ/プロバイダー/エージェント/TTS 作業をキャンセルします。                                                                                                                                |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 必ずしもユーザーターンを終了せずに、アシスタント音声出力を停止します。                                                                                                                    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | リレーが送信したプロバイダーツール呼び出しを完了します。中間出力には `options.willContinue` を渡し、別のアシスタント応答なしで呼び出しを満たすには `options.suppressResponse` を渡します。 |
| `talk.session.steer`            | エージェントに支えられた Talk セッション                              | Talk セッションから解決されたアクティブな埋め込み実行へ、音声の `status`、`steer`、`cancel`、または `followup` 制御を送信します。                                                                |
| `talk.session.close`            | すべての統一セッション                                    | リレーセッションを停止するか管理ルーム状態を取り消し、その後、統一セッション ID を忘れます。                                                                                                    |

これを機能させるために、core にプロバイダーやプラットフォームの特別扱いを導入しないでください。core は Talk セッションのセマンティクスを所有します。プロバイダー Plugin はベンダーセッションのセットアップを所有します。音声通話と Google Meet は電話/ミーティングアダプターを所有します。ブラウザーとネイティブアプリはデバイスのキャプチャ/再生 UX を所有します。

## 削除タイムライン

| 時期                                        | 発生すること                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **現在**                                     | 非推奨サーフェスはランタイム警告を出します。                                                                                             |
| **各互換レコードの `removeAfter` 日付** | その特定のサーフェスは削除対象になります。日付を過ぎると `pnpm plugins:boundary-report --fail-on-eligible-compat` が CI を失敗させます。 |
| **次のメジャーリリース**                      | まだ移行されていないサーフェスはすべて削除され、それらを使用している Plugin は失敗します。                                                       |

すべての core Plugin はすでに移行済みです。外部 Plugin は次のメジャーリリース前に移行してください。Plugin が使用するサーフェスについて、どの互換レコードの期限が最も近いかを確認するには、`pnpm plugins:boundary-report` を実行します。

## 警告を一時的に抑制する

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な逃げ道であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) - 最初の Plugin を作成する
- [SDK の概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - チャネル Plugin の構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダー Plugin の構築
- [Plugin 内部構造](/ja-JP/plugins/architecture) - アーキテクチャの詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) - マニフェストスキーマリファレンス
