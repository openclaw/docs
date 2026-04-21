---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 警告が表示される場合'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 警告が表示される場合'
    - モダンな Plugin アーキテクチャに合わせて Plugin を更新する場合
    - 外部の OpenClaw Plugin を保守している場合
sidebarTitle: Migrate to SDK
summary: レガシー後方互換レイヤーからモダンな Plugin SDK への移行
title: Plugin SDK 移行
x-i18n:
    generated_at: "2026-04-21T04:48:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK 移行

OpenClaw は、広範な後方互換レイヤーから、目的を絞った文書化済み import を持つモダンな Plugin
アーキテクチャへ移行しました。あなたの Plugin がこの新しい
アーキテクチャ以前に作られている場合、このガイドが移行に役立ちます。

## 何が変わるのか

古い Plugin システムでは、Plugin が必要なものを単一のエントリポイントから
何でも import できる、2 つの広く開かれたサーフェスが提供されていました。

- **`openclaw/plugin-sdk/compat`** — 数十の
  helper を再エクスポートする単一の import。新しい Plugin アーキテクチャの構築中に、
  旧来の hook ベース Plugin を動かし続けるために導入されました。
- **`openclaw/extension-api`** — 組み込み agent runner のような
  host 側 helper へ Plugin が直接アクセスできる bridge。

これら 2 つのサーフェスは現在 **非推奨** です。ランタイムではまだ動作しますが、新しい
Plugin はこれらを使ってはいけません。また既存 Plugin も、次の
メジャーリリースで削除される前に移行する必要があります。

<Warning>
  後方互換レイヤーは将来のメジャーリリースで削除されます。
  これらのサーフェスから import し続ける Plugin は、その時点で壊れます。
</Warning>

## なぜ変わったのか

古いアプローチには問題がありました。

- **起動が遅い** — 1 つの helper を import すると、関係のないモジュールまで数十個読み込まれていた
- **循環依存** — 広範な再エクスポートにより import cycle を簡単に作れてしまった
- **API サーフェスが不明確** — どの export が安定版でどれが内部用か判断できなかった

モダンな Plugin SDK はこれを解決します。各 import path（`openclaw/plugin-sdk/\<subpath\>`）
は、明確な目的と文書化された契約を持つ、小さく自己完結したモジュールです。

同梱チャネル向けのレガシー provider convenience seam もなくなりました。  
`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、
チャネル名付きの helper seam、および
`openclaw/plugin-sdk/telegram-core` のような import は、安定した Plugin 契約ではなく、
モノレポ内専用のショートカットでした。代わりに、絞り込まれた汎用 SDK subpath を使ってください。同梱 Plugin workspace 内では、provider 所有の helper はその Plugin 自身の
`api.ts` または `runtime-api.ts` に保持してください。

現在の同梱 provider の例:

- Anthropic は Claude 固有の stream helper を自身の `api.ts` /
  `contract-api.ts` seam に保持している
- OpenAI は provider builder、default-model helper、realtime provider
  builder を自身の `api.ts` に保持している
- OpenRouter は provider builder と onboarding/config helper を自身の
  `api.ts` に保持している

## 移行方法

<Steps>
  <Step title="approval ネイティブ handler を capability facts に移行する">
    approval 対応チャネル Plugin は、現在 native approval の挙動を
    `approvalCapability.nativeRuntime` と共有 runtime-context registry を通じて公開します。

    主な変更点:

    - `approvalCapability.handler.loadRuntime(...)` を
      `approvalCapability.nativeRuntime` に置き換える
    - approval 固有の auth/delivery をレガシーな `plugin.auth` /
      `plugin.approvals` 配線から外し、`approvalCapability` に移す
    - `ChannelPlugin.approvals` は公開チャネル Plugin
      契約から削除されました。delivery/native/render フィールドは `approvalCapability` に移してください
    - `plugin.auth` はチャネルの login/logout フロー専用として残ります。そこにある approval auth
      hook はもはや core では読み取られません
    - client、token、Bolt
      app のようなチャネル所有ランタイムオブジェクトは `openclaw/plugin-sdk/channel-runtime-context` を通じて登録する
    - native approval handler から Plugin 所有の reroute notice を送らないこと。実際の delivery 結果に基づく routed-elsewhere notice は、現在 core が担当します
    - `channelRuntime` を `createChannelManager(...)` に渡す際は、
      実際の `createPluginRuntime().channel` サーフェスを渡してください。部分的な stub は拒否されます

    現在の approval capability
    レイアウトについては `/plugins/sdk-channel-plugins` を参照してください。

  </Step>

  <Step title="Windows wrapper のフォールバック挙動を監査する">
    Plugin が `openclaw/plugin-sdk/windows-spawn` を使用している場合、
    解決できない Windows の `.cmd`/`.bat` wrapper は、`allowShellFallback: true` を明示的に渡さない限り、現在はフェイルクローズドになります。

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

    呼び出し元が意図的に shell fallback に依存していないなら、
    `allowShellFallback` は設定せず、代わりに throw された error を処理してください。

  </Step>

  <Step title="非推奨 import を見つける">
    Plugin 内で、非推奨サーフェスのいずれかから import している箇所を検索します。

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="目的を絞った import に置き換える">
    古いサーフェスの各 export は、特定のモダンな import path に対応します。

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

    host 側 helper については、直接 import する代わりに、注入された Plugin runtime を使用してください。

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    同じパターンは、他のレガシー bridge helper にも適用されます。

    | Old import | モダンな対応先 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="ビルドとテスト">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## import path リファレンス

  <Accordion title="一般的な import path テーブル">
  | Import path | 目的 | 主な export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 正規の Plugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | チャネル entry 定義／builder 向けのレガシー umbrella 再エクスポート | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | ルート config schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 単一 provider 用 entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 目的を絞ったチャネル entry 定義と builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共有 setup wizard helper | allowlist prompt、setup status builder |
  | `plugin-sdk/setup-runtime` | setup 時の runtime helper | import-safe な setup patch adapter、lookup-note helper、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲 setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup ツール helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | マルチアカウント helper | account list/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`、account-id 正規化 |
  | `plugin-sdk/account-resolution` | account lookup helper | account lookup + default-fallback helper |
  | `plugin-sdk/account-helpers` | 絞り込まれた account helper | account list/account-action helper |
  | `plugin-sdk/channel-setup` | setup wizard adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing プリミティブ | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | reply プレフィックス + typing 配線 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema builder | チャネル config schema 型 |
  | `plugin-sdk/telegram-command-config` | Telegram command config helper | command 名正規化、description trimming、重複／衝突検証 |
  | `plugin-sdk/channel-policy` | グループ／DM policy 解決 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | アカウント status 追跡 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | 受信 envelope helper | 共有 route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | 受信 reply helper | 共有 record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | メッセージング target 解析 | target 解析／マッチ helper |
  | `plugin-sdk/outbound-media` | 送信 media helper | 共有送信 media 読み込み |
  | `plugin-sdk/outbound-runtime` | 送信 runtime helper | 送信 identity/send delegate と payload planning helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding ライフサイクルと adapter helper |
  | `plugin-sdk/agent-media-payload` | レガシー media payload helper | レガシー field layout 用 agent media payload builder |
  | `plugin-sdk/channel-runtime` | 非推奨の互換 shim | レガシーなチャネル runtime utility のみ |
  | `plugin-sdk/channel-send-result` | send result 型 | reply result 型 |
  | `plugin-sdk/runtime-store` | 永続 Plugin ストレージ | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 広範な runtime helper | runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 絞り込まれた runtime env helper | logger/runtime env、timeout、retry、backoff helper |
  | `plugin-sdk/plugin-runtime` | 共有 Plugin runtime helper | Plugin commands/hooks/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 共有 webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 共有 exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | command formatting、wait、version helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway client と channel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | config load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegram command helper | 同梱 Telegram 契約サーフェスが利用できない場合の、fallback-stable な Telegram command 検証 helper |
  | `plugin-sdk/approval-runtime` | approval prompt helper | exec/plugin approval payload、approval capability/profile helper、native approval routing/runtime helper |
  | `plugin-sdk/approval-auth-runtime` | approval auth helper | approver 解決、same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | approval client helper | native exec approval profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | approval delivery helper | native approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | approval gateway helper | 共有 approval gateway-resolution helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval adapter helper | hot channel entrypoint 用の軽量 native approval adapter 読み込み helper |
  | `plugin-sdk/approval-handler-runtime` | approval handler helper | より広範な approval handler runtime helper。より絞り込まれた adapter/gateway seam で足りる場合はそちらを優先 |
  | `plugin-sdk/approval-native-runtime` | approval target helper | native approval target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | approval reply helper | exec/plugin approval reply payload helper |
  | `plugin-sdk/channel-runtime-context` | チャネル runtime-context helper | 汎用チャネル runtime-context register/get/watch helper |
  | `plugin-sdk/security-runtime` | セキュリティ helper | 共有 trust、DM gating、external-content、secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF policy helper | host allowlist と private-network policy helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher、guarded fetch、SSRF policy helper |
  | `plugin-sdk/collection-runtime` | 境界付き cache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診断 gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | error formatting helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | ラップされた fetch/proxy helper | `resolveFetch`, proxy helper |
  | `plugin-sdk/host-runtime` | host 正規化 helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, policy runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 入力マッピング | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | command gating と command-surface helper | `resolveControlCommandGate`, sender-authorization helper, command registry helper |
  | `plugin-sdk/command-status` | command status/help renderer | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret 入力解析 | secret 入力 helper |
  | `plugin-sdk/webhook-ingress` | Webhook リクエスト helper | Webhook target utility |
  | `plugin-sdk/webhook-request-guards` | Webhook body guard helper | request body read/limit helper |
  | `plugin-sdk/reply-runtime` | 共有 reply runtime | 受信 dispatch、Heartbeat、reply planner、chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 絞り込まれた reply dispatch helper | finalize + provider dispatch helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | store path + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | state と OAuth dir helper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key 正規化 helper |
  | `plugin-sdk/status-helpers` | チャネル status helper | チャネル／アカウント status summary builder、runtime-state デフォルト、issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 共有 target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 文字列正規化 helper | slug/文字列正規化 helper |
  | `plugin-sdk/request-url` | request URL helper | request ライクな入力から文字列 URL を抽出 |
  | `plugin-sdk/run-command` | 時間制限付き command helper | 正規化済み stdout/stderr を持つ timed command runner |
  | `plugin-sdk/param-readers` | param reader | 一般的な tool/CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload 抽出 | tool result object から正規化済み payload を抽出 |
  | `plugin-sdk/tool-send` | tool send 抽出 | tool args から正規の send target field を抽出 |
  | `plugin-sdk/temp-path` | temp path helper | 共有 temp-download path helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem logger と redaction helper |
  | `plugin-sdk/markdown-table-runtime` | markdown-table helper | Markdown table モード helper |
  | `plugin-sdk/reply-payload` | メッセージ reply 型 | reply payload 型 |
  | `plugin-sdk/provider-setup` | 厳選されたローカル／セルフホスト provider setup helper | セルフホスト provider discovery/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 目的を絞った OpenAI 互換セルフホスト provider setup helper | 同じセルフホスト provider discovery/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API キー解決 helper |
  | `plugin-sdk/provider-auth-api-key` | provider API キー setup helper | API キー onboarding/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 標準 OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider interactive login helper | 共有 interactive login helper |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | provider auth env-var lookup helper |
  | `plugin-sdk/provider-model-shared` | 共有 provider model/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有 replay-policy builder、provider-endpoint helper、model-id 正規化 helper |
  | `plugin-sdk/provider-catalog-shared` | 共有 provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider オンボーディング patch | オンボーディング config helper |
  | `plugin-sdk/provider-http` | provider HTTP helper | 汎用 provider HTTP/endpoint capability helper |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch helper | web-fetch provider registration/cache helper |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search config helper | Plugin 有効化配線を必要としない provider 向けの、絞り込まれた web-search config/credential helper |
  | `plugin-sdk/provider-web-search-contract` | provider web-search contract helper | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、スコープ付き credential setter/getter などの、絞り込まれた web-search config/credential contract helper |
  | `plugin-sdk/provider-web-search` | provider web-search helper | web-search provider registration/cache/runtime helper |
  | `plugin-sdk/provider-tools` | provider tool/schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` のような xAI compat helper |
  | `plugin-sdk/provider-usage` | provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`、およびその他の provider usage helper |
  | `plugin-sdk/provider-stream` | provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、stream wrapper 型、および共有の Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
  | `plugin-sdk/provider-transport-runtime` | provider transport helper | guarded fetch、transport message transform、書き込み可能 transport event stream などの native provider transport helper |
  | `plugin-sdk/keyed-async-queue` | 順序付き async queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共有 media helper | media fetch/transform/store helper と media payload builder |
  | `plugin-sdk/media-generation-runtime` | 共有 media-generation helper | image/video/music generation 用の共有 failover helper、candidate 選択、missing-model メッセージング |
  | `plugin-sdk/media-understanding` | media-understanding helper | media understanding provider 型と provider 向け image/audio helper export |
  | `plugin-sdk/text-runtime` | 共有 text helper | assistant-visible-text stripping、markdown render/chunking/table helper、redaction helper、directive-tag helper、安全な text utility、および関連する text/logging helper |
  | `plugin-sdk/text-chunking` | text chunking helper | 送信 text chunking helper |
  | `plugin-sdk/speech` | speech helper | speech provider 型と provider 向け directive、registry、validation helper |
  | `plugin-sdk/speech-core` | 共有 speech core | speech provider 型、registry、directive、正規化 |
  | `plugin-sdk/realtime-transcription` | realtime transcription helper | provider 型と registry helper |
  | `plugin-sdk/realtime-voice` | realtime voice helper | provider 型と registry helper |
  | `plugin-sdk/image-generation-core` | 共有 image-generation core | image-generation 型、failover、auth、registry helper |
  | `plugin-sdk/music-generation` | music-generation helper | music-generation provider/request/result 型 |
  | `plugin-sdk/music-generation-core` | 共有 music-generation core | music-generation 型、failover helper、provider lookup、model-ref 解析 |
  | `plugin-sdk/video-generation` | video-generation helper | video-generation provider/request/result 型 |
  | `plugin-sdk/video-generation-core` | 共有 video-generation core | video-generation 型、failover helper、provider lookup、model-ref 解析 |
  | `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payload の正規化／縮約 |
  | `plugin-sdk/channel-config-primitives` | channel config プリミティブ | 絞り込まれた channel config-schema プリミティブ |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | channel config-write 認可 helper |
  | `plugin-sdk/channel-plugin-common` | 共有チャネル prelude | 共有チャネル Plugin prelude export |
  | `plugin-sdk/channel-status` | channel status helper | 共有チャネル status snapshot/summary helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist config helper | allowlist config edit/read helper |
  | `plugin-sdk/group-access` | group access helper | 共有 group-access 判定 helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 共有 direct-DM auth/guard helper |
  | `plugin-sdk/extension-shared` | 共有 extension helper | passive-channel/status と ambient proxy helper のプリミティブ |
  | `plugin-sdk/webhook-targets` | Webhook target helper | Webhook target registry と route-install helper |
  | `plugin-sdk/webhook-path` | Webhook path helper | Webhook path 正規化 helper |
  | `plugin-sdk/web-media` | 共有 web media helper | remote/local media 読み込み helper |
  | `plugin-sdk/zod` | Zod 再エクスポート | Plugin SDK 利用者向けに再エクスポートされた `zod` |
  | `plugin-sdk/memory-core` | 同梱 memory-core helper | memory manager/config/file/CLI helper サーフェス |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index/search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory embedding contract、registry access、local provider、汎用 batch/remote helper。具体的な remote provider はそれぞれの所有 Plugin に置かれます |
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
  | `plugin-sdk/memory-host-core` | memory host core runtime alias | memory host core runtime helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-events` | memory host event journal alias | memory host event journal helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-files` | memory host file/runtime alias | memory host file/runtime helper の vendor-neutral alias |
  | `plugin-sdk/memory-host-markdown` | managed markdown helper | memory 隣接 Plugin 向けの共有 managed-markdown helper |
  | `plugin-sdk/memory-host-search` | Active Memory search facade | lazy な Active Memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | memory host status alias | memory host status helper の vendor-neutral alias |
  | `plugin-sdk/memory-lancedb` | 同梱 memory-lancedb helper | memory-lancedb helper サーフェス |
  | `plugin-sdk/testing` | テスト utility | テスト helper と mock |
</Accordion>

このテーブルは意図的に、一般的な移行用サブセットであり、SDK の完全な
サーフェスではありません。200 以上の entrypoint を含む完全な一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

その一覧には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、
`plugin-sdk/zalo-setup`、`plugin-sdk/matrix*` のような同梱 Plugin 用 helper seam も引き続き含まれています。これらは同梱 Plugin の保守と互換性のために引き続き export されていますが、
一般的な移行テーブルからは意図的に除外されており、新しい Plugin コードの推奨対象ではありません。

同じルールは、他の同梱 helper ファミリーにも適用されます。たとえば:

- browser サポート helper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` のような、同梱 helper/Plugin サーフェス

`plugin-sdk/github-copilot-token` は現在、絞り込まれた token-helper
サーフェス `DEFAULT_COPILOT_API_BASE_URL`、
`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` を公開しています。

作業内容に合う最も絞り込まれた import を使ってください。export が見つからない場合は、
`src/plugin-sdk/` のソースを確認するか、Discord で質問してください。

## 削除タイムライン

| 時期 | 何が起きるか |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在** | 非推奨サーフェスがランタイム警告を出す |
| **次のメジャーリリース** | 非推奨サーフェスは削除され、それらを使い続ける Plugin は失敗する |

すべての core Plugin はすでに移行済みです。外部 Plugin も
次のメジャーリリース前に移行してください。

## 警告を一時的に抑制する

移行作業中は、次の環境変数を設定してください。

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

これは一時的な escape hatch であり、恒久的な解決策ではありません。

## 関連

- [はじめに](/ja-JP/plugins/building-plugins) — 最初の Plugin を作る
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — チャネル Plugin の作成
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider Plugin の作成
- [Plugin Internals](/ja-JP/plugins/architecture) — アーキテクチャの詳細
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schema リファレンス
