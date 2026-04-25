---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告が表示される
    - OPENCLAW_EXTENSION_API_DEPRECATED 警告が表示される
    - OpenClaw 2026.4.25 より前に `api.registerEmbeddedExtensionFactory` を使用していた
    - PluginをモダンなPluginアーキテクチャへ更新している
    - あなたは外部OpenClaw Pluginを保守している
sidebarTitle: Migrate to SDK
summary: レガシーな後方互換レイヤーからモダンなPlugin SDKへ移行する
title: Plugin SDK移行
x-i18n:
    generated_at: "2026-04-25T18:19:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab0369fc6e43961a41cff882b0c05653a6a1e3f919ef8a3620c868c16c02ce
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClawは、広範な後方互換レイヤーから、焦点が絞られ文書化されたimportを持つモダンなPluginアーキテクチャへ移行しました。あなたのPluginが新しいアーキテクチャより前に作られたものであれば、このガイドが移行に役立ちます。

## 何が変わるのか

古いPluginシステムは、単一のエントリポイントから必要なものを何でもimportできる、2つの広く開かれたサーフェスを提供していました。

- **`openclaw/plugin-sdk/compat`** — 数十のヘルパーを再エクスポートする単一のimport。これは、新しいPluginアーキテクチャの構築中に、古いhookベースPluginを動作させ続けるために導入されました。
- **`openclaw/extension-api`** — 埋め込みagent runnerのようなホスト側ヘルパーへPluginが直接アクセスできるようにするブリッジ。
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result` のような embedded-runner イベントを観測できた、削除済みのPi専用バンドルextension hook。

これらの広範なimportサーフェスは現在**deprecated**です。ランタイムではまだ動作しますが、新しいPluginでは使用してはいけません。また、既存のPluginも、次のメジャーリリースで削除される前に移行する必要があります。Pi専用のembedded extension factory登録APIは削除されました。代わりにtool-result middlewareを使用してください。

OpenClawは、置き換えを導入したのと同じ変更で、文書化されたPlugin動作を削除したり再解釈したりしません。破壊的なコントラクト変更は、まず互換アダプター、diagnostics、docs、そして廃止予定期間を経る必要があります。これはSDK import、manifest field、setup API、hook、ランタイム登録動作に適用されます。

<Warning>
  後方互換レイヤーは将来のメジャーリリースで削除されます。
  これらのサーフェスからimportし続けるPluginは、その時点で壊れます。
  Pi専用のembedded extension factory登録は、すでに読み込まれなくなっています。
</Warning>

## なぜこれが変わったのか

古いアプローチは問題を引き起こしていました。

- **起動が遅い** — 1つのヘルパーをimportすると、無関係な数十のモジュールまで読み込まれていた
- **循環依存** — 広範な再エクスポートにより、import cycle を簡単に作れてしまった
- **不明確なAPIサーフェス** — どのexportが安定していて、どれが内部用なのか判別できなかった

モダンなPlugin SDKはこれを解決します。各import path（`openclaw/plugin-sdk/\<subpath\>`）は、明確な目的と文書化されたコントラクトを持つ、小さく自己完結したモジュールです。

バンドル済みchannel向けのレガシーなprovider convenience seamも廃止されました。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
channelブランド付きhelper seam、そして
`openclaw/plugin-sdk/telegram-core` のようなimportは、安定したPluginコントラクトではなく、非公開のmono-repoショートカットでした。代わりに、狭く汎用的なSDK subpathを使ってください。バンドル済みPlugin workspace内では、provider所有ヘルパーはそのPlugin自身の
`api.ts` または `runtime-api.ts` に置いてください。

現在のバンドル済みproviderの例:

- Anthropicは、Claude固有のstream helperを自身の `api.ts` /
  `contract-api.ts` seamに保持している
- OpenAIは、provider builder、default-model helper、realtime provider
  builderを自身の `api.ts` に保持している
- OpenRouterは、provider builderと onboarding/config helperを自身の
  `api.ts` に保持している

## 互換性ポリシー

外部Pluginについて、互換性対応は次の順序に従います。

1. 新しいコントラクトを追加する
2. 古い動作を互換アダプター経由で接続したままにする
3. 古いpathと置き換え先を示す diagnostic または warning を出す
4. 両方のpathをテストでカバーする
5. deprecation と移行パスを文書化する
6. 通知した移行ウィンドウ後、通常はメジャーリリースでのみ削除する

manifest field がまだ受け付けられているなら、Plugin作成者はdocsとdiagnosticsが別の指示を出すまで使い続けられます。新しいコードは文書化された置き換えを優先するべきですが、既存のPluginは通常のマイナーリリース中に壊れてはいけません。

## 移行方法

<Steps>
  <Step title="Piのtool-result extensionをmiddlewareへ移行する">
    バンドル済みPluginは、Pi専用の
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlerを、
    ランタイム中立のmiddlewareに置き換える必要があります。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同時にPlugin manifestも更新してください。

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部Pluginはtool-result middlewareを登録できません。これは、
    modelが見る前の高信頼なtool出力を書き換えられるためです。

  </Step>

  <Step title="approval-native handlerをcapability factへ移行する">
    approval対応channel Pluginは現在、
    `approvalCapability.nativeRuntime` と共有runtime-context registryを通じて
    ネイティブapproval動作を公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - approval固有の auth/delivery を、レガシーな `plugin.auth` /
      `plugin.approvals` 配線から `approvalCapability` へ移す
    - `ChannelPlugin.approvals` は公開channel-plugin
      contractから削除されました。delivery/native/render fieldは `approvalCapability` に移してください
    - `plugin.auth` はchannelの login/logout flow のみに残ります。そこにある approval auth
      hookは、もはやcoreからは読まれません
    - client、token、Bolt
      appのようなchannel所有runtime objectは `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - ネイティブapproval handlerからPlugin所有のreroute noticeを送信しないでください。
      routed-elsewhere noticeは実際のdelivery resultに基づいて現在はcoreが所有します
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、
      実際の `createPluginRuntime().channel` サーフェスを提供してください。部分的なstubは拒否されます。

    現在のapproval capability構成については `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows wrapper fallback動作を監査する">
    あなたのPluginが `openclaw/plugin-sdk/windows-spawn` を使用している場合、
    未解決のWindows `.cmd`/`.bat` wrapper は、明示的に
    `allowShellFallback: true` を渡さない限り fail closed するようになりました。

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

    呼び出し元が意図的にshell fallbackへ依存していない場合は、
    `allowShellFallback` を設定せず、代わりに投げられたエラーを処理してください。

  </Step>

  <Step title="deprecated importを見つける">
    あなたのPluginで、どちらかのdeprecatedサーフェスからのimportを検索してください。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="焦点の絞られたimportに置き換える">
    古いサーフェスの各exportは、特定のモダンなimport pathに対応しています。

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

    ホスト側helperについては、直接importする代わりに注入されたplugin runtimeを使ってください。

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、ほかのレガシーbridge helperにも当てはまります。

    | Old import | Modern equivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="ビルドしてテストする">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## import path リファレンス

  <Accordion title="よく使うimport pathテーブル">
  | Import path | 用途 | 主なexport |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正式なPlugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | channel entry定義/builder向けのレガシーumbrella再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルートconfig schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一provider用entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 焦点を絞ったchannel entry定義とbuilder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共通setup ウィザード helper | allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup時ランタイムhelper | import-safe なsetup patch adapter、lookup-note helper、`promptResolvedAllowFrom`、`splitSetupEntries`、delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウントhelper | account list/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`、account-id 正規化 |
  | `plugin-sdk/account-resolution` | account lookup helper | account lookup + default-fallback helper |
  | `plugin-sdk/account-helpers` | 狭いaccount helper | account list/account-action helper |
  | `plugin-sdk/channel-setup` | setup ウィザード adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing の基本要素 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | reply prefix + typing 配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema builder | 共通channel config schema の基本要素。bundled-channel-named schema exportはレガシー互換性専用 |
  | `plugin-sdk/telegram-command-config` | Telegram command config helper | command名正規化、説明のトリミング、重複/競合の検証 |
  | `plugin-sdk/channel-policy` | グループ/DM ポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | account status と draft stream lifecycle helper | `createAccountStatusSink`、draft preview finalize helper |
  | `plugin-sdk/inbound-envelope` | 受信envelope helper | 共通route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | 受信reply helper | 共通record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | メッセージングtarget解析 | target解析/一致helper |
  | `plugin-sdk/outbound-media` | 送信media helper | 共通送信media読み込み |
  | `plugin-sdk/outbound-runtime` | 送信ランタイムhelper | 送信delivery、identity/send delegate、session、formatting、payload planning helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding lifecycle と adapter helper |
  | `plugin-sdk/agent-media-payload` | レガシーmedia payload helper | レガシーfield layout向けagent media payload builder |
  | `plugin-sdk/channel-runtime` | deprecated 互換shim | レガシーchannel runtime utility のみ |
  | `plugin-sdk/channel-send-result` | send result 型 | reply result 型 |
  | `plugin-sdk/runtime-store` | 永続Pluginストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範なランタイムhelper | runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 狭いruntime env helper | logger/runtime env、timeout、retry、backoff helper |
  | `plugin-sdk/plugin-runtime` | 共通plugin runtime helper | Plugin command/hook/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 共通Webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 共通exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | command formatting、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway client と channel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | config load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegram command helper | bundled Telegram contract surfaceが利用できないときの、fallback-stable なTelegram command検証helper |
  | `plugin-sdk/approval-runtime` | approval prompt helper | exec/plugin approval payload、approval capability/profile helper、native approval routing/runtime helper、structured approval display path formatting |
  | `plugin-sdk/approval-auth-runtime` | approval auth helper | approver解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client helper | native exec approval profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery helper | native approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | approval Gateway helper | 共通approval gateway-resolution helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval adapter helper | hot channel entrypoint向け軽量native approval adapter読み込みhelper |
  | `plugin-sdk/approval-handler-runtime` | approval handler helper | より広範なapproval handler runtime helper。狭いadapter/gateway seamで十分な場合はそちらを優先 |
  | `plugin-sdk/approval-native-runtime` | approval target helper | native approval target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | approval reply helper | exec/plugin approval reply payload helper |
  | `plugin-sdk/channel-runtime-context` | channel runtime-context helper | 汎用channel runtime-context register/get/watch helper |
  | `plugin-sdk/security-runtime` | security helper | 共通信頼、DM gating、external-content、secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF policy helper | host allowlist と private-network policy helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher、guarded fetch、SSRF policy helper |
  | `plugin-sdk/collection-runtime` | 境界付きcache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | ラップ済みfetch/proxy helper | `resolveFetch`, proxy helper |
  | `plugin-sdk/host-runtime` | host正規化helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gating と command-surface helper | `resolveControlCommandGate`, sender-authorization helper、dynamic argument menu formattingを含むcommand registry helper |
  | `plugin-sdk/command-status` | command status/help renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret入力解析 | secret入力helper |
  | `plugin-sdk/webhook-ingress` | Webhook request helper | Webhook target utility |
  | `plugin-sdk/webhook-request-guards` | Webhook body guard helper | request body read/limit helper |
  | `plugin-sdk/reply-runtime` | 共通reply runtime | inbound dispatch、Heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 狭いreply dispatch helper | finalize、provider dispatch、conversation-label helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | store path + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | state と OAuth dir のhelper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key 正規化helper |
  | `plugin-sdk/status-helpers` | channel status helper | channel/account status summary builder、runtime-state default、issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共通target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化helper | slug/文字列正規化helper |
  | `plugin-sdk/request-url` | request URL helper | request風入力から文字列URLを抽出 |
  | `plugin-sdk/run-command` | 時間計測付きcommand helper | 正規化済みstdout/stderrを持つ時間計測command runner |
  | `plugin-sdk/param-readers` | param reader | 共通tool/CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload 抽出 | tool result objectから正規化payloadを抽出 |
  | `plugin-sdk/tool-send` | tool send 抽出 | tool argsから標準send target fieldを抽出 |
  | `plugin-sdk/temp-path` | temp path helper | 共通temp-download path helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem logger とredaction helper |
  | `plugin-sdk/markdown-table-runtime` | Markdown-table helper | Markdown table mode helper |
  | `plugin-sdk/reply-payload` | メッセージreply型 | reply payload 型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル/セルフホストprovider setup helper | セルフホストprovider discovery/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 焦点を絞ったOpenAI互換セルフホストprovider setup helper | 同じセルフホストprovider discovery/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API-key 解決helper |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup helper | API-key onboarding/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 標準OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider interactive login helper | 共通interactive login helper |
  | `plugin-sdk/provider-selection-runtime` | provider selection helper | configured-or-auto provider selection と raw provider config merge |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | provider auth env-var lookup helper |
  | `plugin-sdk/provider-model-shared` | 共通provider model/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共通replay-policy builder、provider-endpoint helper、model-id 正規化helper |
  | `plugin-sdk/provider-catalog-shared` | 共通provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider オンボーディング patch | オンボーディング config helper |
  | `plugin-sdk/provider-http` | provider HTTP helper | audio transcription multipart form helperを含む、汎用provider HTTP/endpoint capability helper |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch helper | web-fetch provider registration/cache helper |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search config helper | plugin-enable 配線を必要としないprovider向けの、狭い web-search config/credential helper |
  | `plugin-sdk/provider-web-search-contract` | provider web-search contract helper | `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`、scoped credential setter/getter などの、狭い web-search config/credential contract helper |
  | `plugin-sdk/provider-web-search` | provider web-search helper | web-search provider registration/cache/runtime helper |
  | `plugin-sdk/provider-tools` | provider tool/schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、`resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI compat helper |
  | `plugin-sdk/provider-usage` | provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、およびその他のprovider usage helper |
  | `plugin-sdk/provider-stream` | provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper型、共通Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
  | `plugin-sdk/provider-transport-runtime` | provider transport helper | guarded fetch、transport message transform、書き込み可能なtransport event streamなどのネイティブprovider transport helper |
  | `plugin-sdk/keyed-async-queue` | 順序付きasync queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共通media helper | media fetch/transform/store helper と media payload builder |
  | `plugin-sdk/media-generation-runtime` | 共通media generation helper | 画像/動画/音楽生成向けの共通failover helper、候補選択、missing-model メッセージング |
  | `plugin-sdk/media-understanding` | media understanding helper | media understanding provider型 と provider向け image/audio helper export |
  | `plugin-sdk/text-runtime` | 共通text helper | assistant-visible-text 除去、markdown render/chunking/table helper、redaction helper、directive-tag helper、safe-text utility、および関連する text/logging helper |
  | `plugin-sdk/text-chunking` | text chunking helper | 送信text chunking helper |
  | `plugin-sdk/speech` | speech helper | speech provider型 と provider向け directive、registry、validation helper |
  | `plugin-sdk/speech-core` | 共通speech core | speech provider型、registry、directive、正規化 |
  | `plugin-sdk/realtime-transcription` | realtime transcription helper | provider型、registry helper、共通WebSocket session helper |
  | `plugin-sdk/realtime-voice` | realtime voice helper | provider型、registry/resolution helper、bridge session helper |
  | `plugin-sdk/image-generation-core` | 共通image generation core | image generation型、failover、auth、registry helper |
  | `plugin-sdk/music-generation` | music generation helper | music generation provider/request/result 型 |
  | `plugin-sdk/music-generation-core` | 共通music generation core | music generation型、failover helper、provider lookup、model-ref 解析 |
  | `plugin-sdk/video-generation` | video generation helper | video generation provider/request/result 型 |
  | `plugin-sdk/video-generation-core` | 共通video generation core | video generation型、failover helper、provider lookup、model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payload 正規化/削減 |
  | `plugin-sdk/channel-config-primitives` | channel config の基本要素 | 狭いchannel config-schema の基本要素 |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | channel config-write 認可helper |
  | `plugin-sdk/channel-plugin-common` | 共通channel prelude | 共通channel plugin prelude export |
  | `plugin-sdk/channel-status` | channel status helper | 共通channel status snapshot/summary helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist config helper | allowlist config edit/read helper |
  | `plugin-sdk/group-access` | group access helper | 共通group-access 判定helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 共通direct-DM auth/guard helper |
  | `plugin-sdk/extension-shared` | 共通extension helper | passive-channel/status と ambient proxy helper の基本要素 |
  | `plugin-sdk/webhook-targets` | Webhook target helper | Webhook target registry と route-install helper |
  | `plugin-sdk/webhook-path` | Webhook path helper | Webhook path 正規化helper |
  | `plugin-sdk/web-media` | 共通web media helper | remote/local media 読み込みhelper |
  | `plugin-sdk/zod` | Zod 再エクスポート | Plugin SDK利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | バンドル済み memory-core helper | memory manager/config/file/CLI helper サーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index/search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory embedding contract、registry access、local provider、汎用batch/remote helper。具体的なremote providerはそれぞれのowner Pluginに存在します |
  | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD engine | memory host QMD engine export |
  | `plugin-sdk/memory-core-host-engine-storage` | memory host storage engine | memory host storage engine export |
  | `plugin-sdk/memory-core-host-multimodal` | memory host multimodal helper | memory host multimodal helper |
  | `plugin-sdk/memory-core-host-query` | memory host query helper | memory host query helper |
  | `plugin-sdk/memory-core-host-secret` | memory host secret helper | memory host secret helper |
  | `plugin-sdk/memory-core-host-events` | memory host event journal helper | memory host event journal helper |
  | `plugin-sdk/memory-core-host-status` | memory host status helper | memory host status helper |
  | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI runtime | memory host CLI runtime helper |
  | `plugin-sdk/memory-core-host-runtime-core` | memory host core runtime | memory host core runtime helper |
  | `plugin-sdk/memory-core-host-runtime-files` | memory host file/runtime helper | memory host file/runtime helper |
  | `plugin-sdk/memory-host-core` | memory host core runtime alias | memory host core runtime helper向けのvendor-neutral alias |
  | `plugin-sdk/memory-host-events` | memory host event journal alias | memory host event journal helper向けのvendor-neutral alias |
  | `plugin-sdk/memory-host-files` | memory host file/runtime alias | memory host file/runtime helper向けのvendor-neutral alias |
  | `plugin-sdk/memory-host-markdown` | managed markdown helper | memory隣接Plugin向けの共通managed-markdown helper |
  | `plugin-sdk/memory-host-search` | Active Memory search facade | lazy active-memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | memory host status alias | memory host status helper向けのvendor-neutral alias |
  | `plugin-sdk/memory-lancedb` | バンドル済み memory-lancedb helper | memory-lancedb helper サーフェス |
  | `plugin-sdk/testing` | テストユーティリティ | テストhelper と mock |
</Accordion>

このテーブルは、完全なPlugin SDKサーフェスではなく、意図的に共通の移行用サブセットです。200を超えるentrypointの完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` のような、一部のバンドル済みPlugin helper seamも引き続き含まれています。これらはバンドル済みPluginの保守と互換性のために引き続きexportされていますが、共通移行テーブルからは意図的に除外されており、新しいPluginコードの推奨対象ではありません。

同じルールは、ほかのバンドル済みhelperファミリーにも適用されます。たとえば:

- ブラウザサポートhelper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`、
  `plugin-sdk/zalouser`、`plugin-sdk/bluebubbles*`、
  `plugin-sdk/mattermost*`、`plugin-sdk/msteams`、
  `plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、
  `plugin-sdk/twitch`、
  `plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、
  `plugin-sdk/diagnostics-otel`、`plugin-sdk/diffs`、`plugin-sdk/llm-task`、
  `plugin-sdk/thread-ownership`、`plugin-sdk/voice-call` などの、バンドル済みhelper/Pluginサーフェス

`plugin-sdk/github-copilot-token` は現在、狭いtoken-helperサーフェス
`DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` を公開しています。

作業に合った最も狭いimportを使ってください。exportが見つからない場合は、
`src/plugin-sdk/` のソースを確認するか、Discordで尋ねてください。

## 現在有効な廃止予定

Plugin SDK、provider contract、ランタイムサーフェス、manifest全体に適用される、より狭い廃止予定です。いずれも現在はまだ動作しますが、将来のメジャーリリースで削除されます。各項目の下にある記述は、古いAPIを正式な置き換え先に対応付けています。

<AccordionGroup>
  <Accordion title="command-auth help builder → command-status">
    **旧 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**: シグネチャも
    exportも同じで、より狭いsubpathからimportするだけです。`command-auth`
    は互換stubとしてそれらを再エクスポートします。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helper → resolveInboundMentionDecision">
    **旧**: `resolveInboundMentionRequirement({ facts, policy })` と
    `shouldDropInboundForMention(...)`。
    提供元は
    `openclaw/plugin-sdk/channel-inbound` または
    `openclaw/plugin-sdk/channel-mention-gating`。

    **新**: `resolveInboundMentionDecision({ facts, policy })` — 2つに分かれた呼び出しではなく、
    単一の判定オブジェクトを返します。

    下流のchannel Plugin（Slack、Discord、Matrix、Microsoft Teams）はすでに切り替え済みです。

  </Accordion>

  <Accordion title="Channel runtime shim と channel actions helper">
    `openclaw/plugin-sdk/channel-runtime` は、古い
    channel Plugin向けの互換shimです。新しいコードからはimportせず、
    runtime objectの登録には
    `openclaw/plugin-sdk/channel-runtime-context` を使用してください。

    `openclaw/plugin-sdk/channel-actions` にある `channelActions*` helperは、
    生の「actions」channel exportとともにdeprecatedです。代わりに意味論的な
    `presentation` サーフェスを通じてcapabilityを公開してください。つまり、
    channel Pluginは受け付ける生のaction名ではなく、何をrenderするか
    （card、button、select）を宣言します。

  </Accordion>

  <Accordion title="Web search provider tool() helper → Plugin上の createTool()">
    **旧**: `openclaw/plugin-sdk/provider-web-search` の `tool()` factory。

    **新**: provider Plugin上に `createTool(...)` を直接実装します。
    OpenClawは、tool wrapperを登録するためのSDK helperをもはや必要としません。

  </Accordion>

  <Accordion title="プレーンテキストchannel envelope → BodyForAgent">
    **旧**: `formatInboundEnvelope(...)`（および
    `ChannelMessageForAgent.channelEnvelope`）を使って、受信channelメッセージから
    フラットなプレーンテキストのprompt envelopeを構築していました。

    **新**: `BodyForAgent` と構造化されたuser-context block。
    channel Pluginは、prompt文字列に連結する代わりに、routing metadata
    （thread、topic、reply-to、reaction）を型付きfieldとして付加します。
    `formatAgentEnvelope(...)` helperは、合成されたassistant向けenvelopeでは
    依然サポートされていますが、受信プレーンテキストenvelopeは廃止に向かっています。

    影響範囲: `inbound_claim`、`message_received`、および
    `channelEnvelope` テキストを後処理していたすべてのカスタムchannel Plugin。

  </Accordion>

  <Accordion title="Provider discovery 型 → provider catalog 型">
    4つのdiscovery型エイリアスは現在、
    catalog時代の型に対する薄いwrapperになっています。

    | 旧エイリアス | 新しい型 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    さらに、レガシーな `ProviderCapabilities` static bag もあります。provider Pluginは、
    static objectではなく、provider runtime contractを通じて capability fact を付加するべきです。

  </Accordion>

  <Accordion title="Thinking policy hook → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上の3つの分離されたhook）:
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)`、および
    `resolveDefaultThinkingLevel(ctx)`。

    **新**: 単一の `resolveThinkingProfile(ctx)`。これは
    正式な `id`、任意の `label`、ランク付けされたlevel一覧を持つ
    `ProviderThinkingProfile` を返します。OpenClawは、古い保存値を
    profile rankに基づいて自動的にダウングレードします。

    実装するhookは3つではなく1つです。レガシーhookは廃止予定期間中は引き続き動作しますが、
    profile result と合成はされません。

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **旧**: Plugin manifestでproviderを宣言せずに
    `resolveExternalOAuthProfiles(...)` を実装すること。

    **新**: Plugin manifestで `contracts.externalAuthProviders` を宣言し、
    **かつ** `resolveExternalAuthProfiles(...)` を実装してください。古い「auth
    fallback」経路はランタイムでwarningを出し、今後削除されます。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **旧**manifest field: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**: 同じenv-var lookupをmanifestの `setup.providers[].envVars` にも
    反映してください。これにより、setup/status のenv metadataが1か所に集約され、
    env-var lookupに答えるだけのためにplugin runtimeを起動せずに済みます。

    `providerAuthEnvVars` は、廃止予定期間が終わるまでは互換アダプターを通じて引き続きサポートされます。

  </Accordion>

  <Accordion title="Memory Plugin登録 → registerMemoryCapability">
    **旧**: 3つの別個の呼び出し —
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**: memory-state API上の1回の呼び出し —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    同じslotを、単一の登録呼び出しにまとめたものです。追加的なmemory helper
    （`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`）は影響を受けません。

  </Accordion>

  <Accordion title="Subagent session message型の名称変更">
    2つのレガシー型エイリアスが、現在も `src/plugins/runtime/types.ts` からexportされています。

    | 旧 | 新 |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    ランタイムメソッド `readSession` は deprecated となり、
    `getSessionMessages` が推奨されます。シグネチャは同じで、古いメソッドは
    新しいものを呼び出します。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **旧**: `runtime.tasks.flow`（単数形）は、ライブなTaskFlow accessorを返していました。

    **新**: `runtime.tasks.flows`（複数形）は、DTOベースの TaskFlow access を返します。これは
    import-safe で、完全なtask runtimeを読み込む必要がありません。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factory → agent tool-result middleware">
    これは上記「移行方法 → Piのtool-result extensionを
    middlewareへ移行する」で扱っています。完全性のためここにも記載します。削除済みのPi専用
    `api.registerEmbeddedExtensionFactory(...)` 経路は、
    `contracts.agentToolResultMiddleware` で明示的なruntime一覧を持つ
    `api.registerAgentToolResultMiddleware(...)` に置き換えられています。
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk` から再エクスポートされる `OpenClawSchemaType` は現在、
    `OpenClawConfig` の1行エイリアスです。正式名称を優先してください。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
バンドル済みchannel/provider Plugin内（`extensions/` 配下）の
extensionレベルの廃止予定は、それぞれの `api.ts` と `runtime-api.ts`
barrel内で追跡されています。これらはサードパーティPluginコントラクトには影響せず、
ここには記載していません。バンドル済みPluginのローカルbarrelを直接利用している場合は、
アップグレード前にそのbarrel内のdeprecationコメントを確認してください。
</Note>

## 削除タイムライン

| 時期 | 何が起こるか |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在** | deprecated サーフェスはランタイムwarningを出します |
| **次のメジャーリリース** | deprecated サーフェスは削除され、それらを使い続けるPluginは失敗します |

すべてのcore Pluginはすでに移行済みです。外部Pluginは、次のメジャーリリース前に移行してください。

## 警告を一時的に抑制する

移行作業中は、次の環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な回避手段であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初のPluginを作成する
- [SDK概要](/ja-JP/plugins/sdk-overview) — 完全なsubpath import リファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — channel Pluginの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider Pluginの構築
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schema リファレンス
