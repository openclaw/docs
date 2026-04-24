---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告が表示されている場合＿日本assistant to=functions.read in commentary даҩjson เติมเงินไทยฟรี{"path":"/home/runner/work/docs/docs/source/.agents/skills/README.md"}'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 警告が表示されている場合'
    - Plugin を最新の Plugin アーキテクチャに更新している場合
    - 外部 OpenClaw Plugin を保守している場合
sidebarTitle: Migrate to SDK
summary: 旧来の後方互換レイヤーから最新の Plugin SDK へ移行する
title: Plugin SDK 移行
x-i18n:
    generated_at: "2026-04-24T05:11:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b53d2e6c1a332c928aae62323619b3983a1b0b68ec178451bb5d3a0819585c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw は、広範な後方互換レイヤーから、焦点が絞られ文書化された import を持つ最新の Plugin
アーキテクチャへ移行しました。あなたの Plugin が新しい
アーキテクチャ以前に作られたものであれば、このガイドが移行を手助けします。

## 何が変わるのか

旧 Plugin システムは、Plugin が必要なものを 1 つのエントリポイントから
何でも import できる、広く開かれた 2 つの surface を提供していました:

- **`openclaw/plugin-sdk/compat`** — 数十の
  helper を再エクスポートする単一 import。これは、新しい Plugin アーキテクチャが
  構築される間、古い hook ベース Plugin を動かし続けるために導入されました。
- **`openclaw/extension-api`** — 埋め込みエージェントランナーのような
  host 側 helper に Plugin が直接アクセスできる bridge。

これら 2 つの surface は現在 **非推奨** です。ランタイムではまだ動作しますが、
新しい Plugin は使ってはいけません。また、既存 Plugin も、次の major release で
削除される前に移行する必要があります。

<Warning>
  この後方互換レイヤーは、将来の major release で削除されます。
  これらの surface から import している Plugin は、その時点で壊れます。
</Warning>

## なぜ変わったのか

旧方式には問題がありました:

- **起動が遅い** — 1 つの helper を import するだけで、無関係な多数のモジュールまで読み込まれていた
- **循環依存** — 広い再エクスポートにより import cycle が生まれやすかった
- **不明確な API surface** — どの export が安定していて、どれが internal なのか判別できなかった

最新の Plugin SDK ではこれが改善されます。各 import パス（`openclaw/plugin-sdk/<subpath>`）
は、小さく自己完結したモジュールであり、明確な目的と文書化された契約を持ちます。

同梱チャネル向けの旧来の provider convenience seam も削除されました。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
チャネル名付き helper seam、および
`openclaw/plugin-sdk/telegram-core` のような import は、安定した Plugin 契約ではなく、mono-repo 内部専用のショートカットでした。代わりに、絞られた汎用 SDK subpath を使ってください。同梱 Plugin workspace 内では、provider 所有 helper はその Plugin 自身の
`api.ts` または `runtime-api.ts` に置いてください。

現在の同梱 provider 例:

- Anthropic は Claude 固有の stream helper を自前の `api.ts` /
  `contract-api.ts` seam に保持している
- OpenAI は provider builder、default-model helper、realtime provider
  builder を自前の `api.ts` に保持している
- OpenRouter は provider builder と onboarding / config helper を自前の
  `api.ts` に保持している

## 移行方法

<Steps>
  <Step title="approval-native handler を capability facts に移行する">
    承認可能チャネル Plugin は現在、ネイティブ承認動作を
    `approvalCapability.nativeRuntime` と共有 runtime-context registry を通じて公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - 承認固有の auth / delivery を旧来の `plugin.auth` /
      `plugin.approvals` 配線から外し、`approvalCapability` に移す
    - `ChannelPlugin.approvals` は公開 channel-plugin
      契約から削除された。delivery / native / render フィールドは `approvalCapability` へ移す
    - `plugin.auth` はチャネルの login / logout フロー専用として残る。そこにある approval auth
      hook は core からはもう読まれない
    - client、token、Bolt
      app のようなチャネル所有 runtime object は `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - ネイティブ承認 handler から Plugin 所有の reroute notice を送らないこと。core が実際の delivery 結果から routed-elsewhere notice を所有するようになった
    - `channelRuntime` を `createChannelManager(...)` に渡すときは、
      実際の `createPluginRuntime().channel` surface を渡すこと。部分的な stub は拒否される

    現在の approval capability
    レイアウトについては `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows wrapper fallback 動作を監査する">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使っている場合、
    解決できない Windows `.cmd` / `.bat` wrapper は、明示的に
    `allowShellFallback: true` を渡さない限り fail closed するようになりました。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // シェル経由フォールバックを意図的に受け入れる、信頼済み互換呼び出し元にのみ設定してください。
      allowShellFallback: true,
    });
    ```

    呼び出し元が意図的に shell fallback に依存していない場合は、
    `allowShellFallback` を設定せず、代わりに投げられたエラーを処理してください。

  </Step>

  <Step title="非推奨 import を見つける">
    Plugin 内で、いずれかの非推奨 surface から import している箇所を検索してください:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="絞られた import に置き換える">
    旧 surface の各 export は、特定の最新 import パスに対応します:

    ```typescript
    // Before（非推奨の後方互換レイヤー）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After（最新の絞られた import）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    host 側 helper には、直接 import するのではなく、注入された plugin runtime を使ってください:

    ```typescript
    // Before（非推奨の extension-api bridge）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After（注入された runtime）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは他の旧来 bridge helper にも当てはまります:

    | 旧 import | 最新の対応先 |
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

## import パスリファレンス

  <Accordion title="よく使う import パステーブル">
  | Import path | 用途 | 主な exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正式な Plugin エントリ helper | `definePluginEntry` |
  | `plugin-sdk/core` | チャネルエントリ定義 / builder 向け旧来 umbrella 再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート設定 schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一 provider エントリ helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 絞られたチャネルエントリ定義と builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有 setup ウィザード helper | Allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup 時ランタイム helper | import-safe な setup patch adapter、lookup-note helper、`promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウント helper | account list / config / action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`, account-id 正規化 |
  | `plugin-sdk/account-resolution` | account lookup helper | account lookup + default-fallback helper |
  | `plugin-sdk/account-helpers` | 絞られた account helper | account list / account-action helper |
  | `plugin-sdk/channel-setup` | setup ウィザード adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 加えて `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing primitive | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 返信接頭辞 + typing 配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema builder | チャネル config schema 型 |
  | `plugin-sdk/telegram-command-config` | Telegram コマンド config helper | コマンド名正規化、説明切り詰め、重複 / 競合検証 |
  | `plugin-sdk/channel-policy` | グループ / DM ポリシー解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | account status と draft stream lifecycle helper | `createAccountStatusSink`, draft preview finalization helper |
  | `plugin-sdk/inbound-envelope` | inbound envelope helper | 共有 route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | inbound reply helper | 共有 record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | messaging target 解析 | target parsing / matching helper |
  | `plugin-sdk/outbound-media` | outbound media helper | 共有 outbound media loading |
  | `plugin-sdk/outbound-runtime` | outbound runtime helper | outbound ID / send delegate と payload planning helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding lifecycle と adapter helper |
  | `plugin-sdk/agent-media-payload` | 旧来 media payload helper | 旧来 field layout 向け agent media payload builder |
  | `plugin-sdk/channel-runtime` | 非推奨互換 shim | 旧来 channel runtime utility のみ |
  | `plugin-sdk/channel-send-result` | send result 型 | reply result 型 |
  | `plugin-sdk/runtime-store` | 永続 Plugin storage | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範な runtime helper | runtime / logging / backup / plugin-install helper |
  | `plugin-sdk/runtime-env` | 絞られた runtime env helper | logger / runtime env、timeout、retry、backoff helper |
  | `plugin-sdk/plugin-runtime` | 共有 plugin runtime helper | Plugin commands / hooks / http / interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 共有 webhook / internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 共有 exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | command formatting、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway client と channel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | config load / write helper |
  | `plugin-sdk/telegram-command-config` | Telegram コマンド helper | 同梱 Telegram 契約 surface が使えない場合の、fallback 安定な Telegram コマンド検証 helper |
  | `plugin-sdk/approval-runtime` | approval prompt helper | exec / plugin approval payload、approval capability / profile helper、native approval routing / runtime helper |
  | `plugin-sdk/approval-auth-runtime` | approval auth helper | approver 解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client helper | native exec approval profile / filter helper |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery helper | native approval capability / delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | approval gateway helper | 共有 approval gateway-resolution helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval adapter helper | hot channel entrypoint 向け軽量 native approval adapter loading helper |
  | `plugin-sdk/approval-handler-runtime` | approval handler helper | より広い approval handler runtime helper。adapter / gateway seam で十分ならそちらを優先 |
  | `plugin-sdk/approval-native-runtime` | approval target helper | native approval target / account binding helper |
  | `plugin-sdk/approval-reply-runtime` | approval reply helper | exec / plugin approval reply payload helper |
  | `plugin-sdk/channel-runtime-context` | channel runtime-context helper | 汎用 channel runtime-context register / get / watch helper |
  | `plugin-sdk/security-runtime` | security helper | 共有 trust、DM gating、external-content、secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF policy helper | host allowlist と private-network policy helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher、guarded fetch、SSRF policy helper |
  | `plugin-sdk/collection-runtime` | 境界付き cache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | wrapped fetch / proxy helper | `resolveFetch`, proxy helper |
  | `plugin-sdk/host-runtime` | host normalization helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist input mapping | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gating と command-surface helper | `resolveControlCommandGate`, sender-authorization helper, command registry helper |
  | `plugin-sdk/command-status` | command status / help renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret input parsing | secret input helper |
  | `plugin-sdk/webhook-ingress` | Webhook request helper | Webhook target utility |
  | `plugin-sdk/webhook-request-guards` | Webhook body guard helper | request body read / limit helper |
  | `plugin-sdk/reply-runtime` | 共有 reply runtime | inbound dispatch、Heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 絞られた reply dispatch helper | finalize + provider dispatch helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text / markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | store path + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | state と OAuth dir helper |
  | `plugin-sdk/routing` | routing / session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key normalization helper |
  | `plugin-sdk/status-helpers` | channel status helper | channel / account status summary builder、runtime-state default、issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共有 target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | string normalization helper | slug / string normalization helper |
  | `plugin-sdk/request-url` | request URL helper | request-like input から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | timed command helper | stdout / stderr を正規化した timed command runner |
  | `plugin-sdk/param-readers` | param reader | 共通 tool / CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload 抽出 | tool result object から正規化 payload を抽出 |
  | `plugin-sdk/tool-send` | tool send 抽出 | tool args から canonical send target field を抽出 |
  | `plugin-sdk/temp-path` | temp path helper | 共有 temp-download path helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem logger と redaction helper |
  | `plugin-sdk/markdown-table-runtime` | markdown-table helper | markdown table mode helper |
  | `plugin-sdk/reply-payload` | message reply 型 | reply payload 型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル / セルフホスト provider setup helper | self-hosted provider discovery / config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 絞られた OpenAI 互換セルフホスト provider setup helper | 同じ self-hosted provider discovery / config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API-key 解決 helper |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup helper | API-key onboarding / profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 標準 OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider interactive login helper | 共有 interactive login helper |
  | `plugin-sdk/provider-selection-runtime` | provider selection helper | configured-or-auto provider selection と raw provider config merging |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | provider auth env-var lookup helper |
  | `plugin-sdk/provider-model-shared` | 共有 provider model / replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有 replay-policy builder、provider-endpoint helper、model-id normalization helper |
  | `plugin-sdk/provider-catalog-shared` | 共有 provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider オンボーディング patch | オンボーディング config helper |
  | `plugin-sdk/provider-http` | provider HTTP helper | audio transcription multipart form helper を含む、汎用 provider HTTP / endpoint capability helper |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch helper | web-fetch provider registration / cache helper |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search config helper | plugin-enable 配線を必要としない provider 向けの、絞られた web-search config / credential helper |
  | `plugin-sdk/provider-web-search-contract` | provider web-search contract helper | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, scoped credential setter / getter などの、絞られた web-search config / credential contract helper |
  | `plugin-sdk/provider-web-search` | provider web-search helper | web-search provider registration / cache / runtime helper |
  | `plugin-sdk/provider-tools` | provider tool / schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、さらに `resolveXaiModelCompatPatch` / `applyXaiModelCompat` などの xAI compat helper |
  | `plugin-sdk/provider-usage` | provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、その他 provider usage helper |
  | `plugin-sdk/provider-stream` | provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper 型、および共有 Anthropic / Bedrock / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot wrapper helper |
  | `plugin-sdk/provider-transport-runtime` | provider transport helper | guarded fetch、transport message transform、writable transport event stream などの native provider transport helper |
  | `plugin-sdk/keyed-async-queue` | 順序付き async queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有 media helper | media fetch / transform / store helper と media payload builder |
  | `plugin-sdk/media-generation-runtime` | 共有 media-generation helper | 画像 / 動画 / 音楽生成向けの共有 failover helper、candidate selection、missing-model messaging |
  | `plugin-sdk/media-understanding` | media-understanding helper | media understanding provider 型と provider 向け image / audio helper export |
  | `plugin-sdk/text-runtime` | 共有 text helper | assistant-visible-text stripping、markdown render / chunking / table helper、redaction helper、directive-tag helper、safe-text utility、および関連する text / logging helper |
  | `plugin-sdk/text-chunking` | text chunking helper | outbound text chunking helper |
  | `plugin-sdk/speech` | speech helper | speech provider 型と provider 向け directive、registry、validation helper |
  | `plugin-sdk/speech-core` | 共有 speech core | speech provider 型、registry、directive、normalization |
  | `plugin-sdk/realtime-transcription` | realtime transcription helper | provider 型、registry helper、共有 WebSocket session helper |
  | `plugin-sdk/realtime-voice` | realtime voice helper | provider 型、registry / resolution helper、bridge session helper |
  | `plugin-sdk/image-generation-core` | 共有 image-generation core | image-generation 型、failover、auth、registry helper |
  | `plugin-sdk/music-generation` | music-generation helper | music-generation provider / request / result 型 |
  | `plugin-sdk/music-generation-core` | 共有 music-generation core | music-generation 型、failover helper、provider lookup、model-ref parsing |
  | `plugin-sdk/video-generation` | video-generation helper | video-generation provider / request / result 型 |
  | `plugin-sdk/video-generation-core` | 共有 video-generation core | video-generation 型、failover helper、provider lookup、model-ref parsing |
  | `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payload normalization / reduction |
  | `plugin-sdk/channel-config-primitives` | channel config primitive | 絞られた channel config-schema primitive |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | channel config-write authorization helper |
  | `plugin-sdk/channel-plugin-common` | 共有 channel prelude | 共有 channel plugin prelude export |
  | `plugin-sdk/channel-status` | channel status helper | 共有 channel status snapshot / summary helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist config helper | allowlist config edit / read helper |
  | `plugin-sdk/group-access` | group access helper | 共有 group-access decision helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 共有 direct-DM auth / guard helper |
  | `plugin-sdk/extension-shared` | 共有 extension helper | passive-channel / status と ambient proxy helper primitive |
  | `plugin-sdk/webhook-targets` | Webhook target helper | Webhook target registry と route-install helper |
  | `plugin-sdk/webhook-path` | Webhook path helper | Webhook path normalization helper |
  | `plugin-sdk/web-media` | 共有 web media helper | remote / local media loading helper |
  | `plugin-sdk/zod` | Zod 再エクスポート | plugin SDK 利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | 同梱 memory-core helper | memory manager / config / file / CLI helper surface |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index / search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine exports |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory embedding contract、registry access、local provider、および汎用 batch / remote helper。具体的な remote provider はそれぞれの所有 Plugin に置かれる |
  | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD engine | memory host QMD engine exports |
  | `plugin-sdk/memory-core-host-engine-storage` | memory host storage engine | memory host storage engine exports |
  | `plugin-sdk/memory-core-host-multimodal` | memory host multimodal helper | memory host multimodal helper |
  | `plugin-sdk/memory-core-host-query` | memory host query helper | memory host query helper |
  | `plugin-sdk/memory-core-host-secret` | memory host secret helper | memory host secret helper |
  | `plugin-sdk/memory-core-host-events` | memory host event journal helper | memory host event journal helper |
  | `plugin-sdk/memory-core-host-status` | memory host status helper | memory host status helper |
  | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI runtime | memory host CLI runtime helper |
  | `plugin-sdk/memory-core-host-runtime-core` | memory host core runtime | memory host core runtime helper |
  | `plugin-sdk/memory-core-host-runtime-files` | memory host file / runtime helper | memory host file / runtime helper |
  | `plugin-sdk/memory-host-core` | memory host core runtime alias | memory host core runtime helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-events` | memory host event journal alias | memory host event journal helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-files` | memory host file / runtime alias | memory host file / runtime helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-markdown` | managed markdown helper | memory 隣接 Plugin 向けの共有 managed-markdown helper |
  | `plugin-sdk/memory-host-search` | Active Memory search facade | lazy active-memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | memory host status alias | memory host status helper の vendor-neutral alias |
  | `plugin-sdk/memory-lancedb` | 同梱 memory-lancedb helper | memory-lancedb helper surface |
  | `plugin-sdk/testing` | テストユーティリティ | テスト helper と mock |
</Accordion>

このテーブルは、意図的に一般的な移行向けサブセットであり、SDK
surface 全体ではありません。200 以上の entrypoint の完全一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には、`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` のような、同梱 Plugin 用 helper seam も
まだ含まれています。これらは同梱 Plugin の保守と互換性のために引き続き export されていますが、
一般的な移行テーブルからは意図的に除外されており、新しい Plugin コードの
推奨ターゲットではありません。

同じルールは、次のような他の bundled-helper ファミリにも適用されます:

- browser support helper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- 同梱 helper / Plugin surface: `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` は現在、絞られた token-helper
surface `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` を公開しています。

作業に一致する、もっとも狭い import を使ってください。export が見つからない場合は、
`src/plugin-sdk/` のソースを確認するか、Discord で質問してください。

## 削除タイムライン

| いつ                   | 何が起こるか                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| **現在**               | 非推奨 surface はランタイム警告を出す                                 |
| **次の major release** | 非推奨 surface は削除され、それを使い続ける Plugin は失敗する         |

すべての core Plugin はすでに移行済みです。外部 Plugin も、
次の major release までに移行してください。

## 一時的に警告を抑制する

移行作業中は、次の環境変数を設定してください:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な escape hatch であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初の Plugin を作る
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — channel Plugin の作成
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider Plugin の作成
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャ詳細解説
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schema リファレンス
