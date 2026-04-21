---
read_when:
    - どの SDK subpath から import すべきかを知る必要がある
    - OpenClawPluginApi 上のすべての登録メソッドのリファレンスが必要です
    - 特定の SDK export を調べている
sidebarTitle: SDK Overview
summary: import map、登録 API リファレンス、および SDK アーキテクチャ
title: Plugin SDK の概要
x-i18n:
    generated_at: "2026-04-21T04:49:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK の概要

Plugin SDK は、Plugin と core の間の型付きコントラクトです。このページは、**何を import するか** と **何を登録できるか** のリファレンスです。

<Tip>
  **ハウツーガイドを探していますか？**
  - 最初の Plugin? [はじめに](/ja-JP/plugins/building-plugins) から始めてください
  - channel Plugin? [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください
  - provider Plugin? [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください
</Tip>

## import 規約

必ず特定の subpath から import してください:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

各 subpath は小さく自己完結したモジュールです。これにより起動が高速に保たれ、
循環依存の問題を防げます。channel 固有の entry/build helper には、
`openclaw/plugin-sdk/channel-core` を優先してください。より広い umbrella surface と
`buildChannelConfigSchema` のような共有 helper には
`openclaw/plugin-sdk/core` を使ってください。

`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、
`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、または
channel ブランドの helper seam のような、provider 名付き convenience seam を追加したり依存したりしないでください。
同梱 Plugin は、自身の `api.ts` または `runtime-api.ts` barrel の中で汎用的な
SDK subpath を組み合わせるべきであり、core はそれらの plugin ローカル barrel を使うか、
必要が本当に cross-channel の場合にのみ狭い汎用 SDK コントラクトを追加すべきです。

生成された export map には、`plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、
`plugin-sdk/zalo`、`plugin-sdk/zalo-setup`、および `plugin-sdk/matrix*` のような、
少数の同梱 Plugin helper seam も含まれています。これらの
subpath は、同梱 Plugin の保守と互換性のためだけに存在します。意図的に下の一般テーブルには含めておらず、
新しいサードパーティ Plugin に推奨される import path ではありません。

## Subpath リファレンス

用途ごとにまとめた、最もよく使われる subpath です。200 以上ある subpath の生成済み完全一覧は
`scripts/lib/plugin-sdk-entrypoints.json` にあります。

予約済みの同梱 Plugin helper subpath も、その生成済み一覧には引き続き現れます。  
ドキュメントページが明示的に public として推奨していない限り、それらは実装詳細/互換性 surface として扱ってください。

### Plugin entry

| Subpath                     | 主な export                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subpath | 主な export |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod schema export（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有セットアップウィザード helper、allowlist プロンプト、セットアップステータス builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチアカウント config/action-gate helper、default-account fallback helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 正規化 helper |
    | `plugin-sdk/account-resolution` | アカウント lookup + default-fallback helper |
    | `plugin-sdk/account-helpers` | 狭い account-list/account-action helper |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel config schema 型 |
    | `plugin-sdk/telegram-command-config` | 同梱コントラクト fallback を持つ Telegram custom-command の正規化/検証 helper |
    | `plugin-sdk/command-gating` | 狭いコマンド認可 gate helper |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 共有 inbound route + envelope builder helper |
    | `plugin-sdk/inbound-reply-dispatch` | 共有 inbound record-and-dispatch helper |
    | `plugin-sdk/messaging-targets` | ターゲットの解析/一致 helper |
    | `plugin-sdk/outbound-media` | 共有 outbound media 読み込み helper |
    | `plugin-sdk/outbound-runtime` | outbound identity、send delegate、payload planning helper |
    | `plugin-sdk/poll-runtime` | 狭い poll 正規化 helper |
    | `plugin-sdk/thread-bindings-runtime` | スレッドバインディングのライフサイクルと adapter helper |
    | `plugin-sdk/agent-media-payload` | 旧式の agent media payload builder |
    | `plugin-sdk/conversation-runtime` | 会話/スレッドバインディング、pairing、設定済み binding helper |
    | `plugin-sdk/runtime-config-snapshot` | runtime config スナップショット helper |
    | `plugin-sdk/runtime-group-policy` | runtime group-policy 解決 helper |
    | `plugin-sdk/channel-status` | 共有 channel status スナップショット/要約 helper |
    | `plugin-sdk/channel-config-primitives` | 狭い channel config-schema primitive |
    | `plugin-sdk/channel-config-writes` | channel config-write 認可 helper |
    | `plugin-sdk/channel-plugin-common` | 共有 channel Plugin prelude export |
    | `plugin-sdk/allowlist-config-edit` | allowlist config 編集/読み取り helper |
    | `plugin-sdk/group-access` | 共有 group-access 判定 helper |
    | `plugin-sdk/direct-dm` | 共有 direct-DM auth/guard helper |
    | `plugin-sdk/interactive-runtime` | 対話型 reply payload の正規化/削減 helper |
    | `plugin-sdk/channel-inbound` | inbound debounce、mention matching、mention-policy helper、および envelope helper の互換性 barrel |
    | `plugin-sdk/channel-mention-gating` | より広い inbound runtime surface を含まない狭い mention-policy helper |
    | `plugin-sdk/channel-location` | channel location context と整形 helper |
    | `plugin-sdk/channel-logging` | inbound drop および typing/ack failure 用の channel logging helper |
    | `plugin-sdk/channel-send-result` | reply result 型 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | ターゲットの解析/一致 helper |
    | `plugin-sdk/channel-contract` | channel contract 型 |
    | `plugin-sdk/channel-feedback` | フィードバック/リアクションの配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、および secret target 型のような狭い secret-contract helper |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Subpath | 主な export |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選された local/self-hosted provider セットアップ helper |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 互換 self-hosted provider に特化したセットアップ helper |
    | `plugin-sdk/cli-backend` | CLI backend デフォルト + watchdog 定数 |
    | `plugin-sdk/provider-auth-runtime` | provider Plugin 用の runtime API key 解決 helper |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` などの API key オンボーディング/profile-write helper |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth auth-result builder |
    | `plugin-sdk/provider-auth-login` | provider Plugin 用の共有対話型ログイン helper |
    | `plugin-sdk/provider-env-vars` | provider auth env var lookup helper |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共有 replay-policy builder、provider-endpoint helper、`normalizeNativeXaiModelId` のような model-id 正規化 helper |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 汎用 provider HTTP/endpoint capability helper |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` のような狭い web-fetch config/selection contract helper |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider の登録/cache helper |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin enable 配線を必要としない provider 向けの、狭い web-search config/credential helper |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`、およびスコープ付き credential setter/getter のような狭い web-search config/credential contract helper |
    | `plugin-sdk/provider-web-search` | web-search provider の登録/cache/runtime helper |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、および `resolveXaiModelCompatPatch` / `applyXaiModelCompat` のような xAI compat helper |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper 型、および共有 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transport message transform、書き込み可能な transport event stream のようなネイティブ provider transport helper |
    | `plugin-sdk/provider-onboard` | オンボーディング config patch helper |
    | `plugin-sdk/global-singleton` | プロセスローカル singleton/map/cache helper |
  </Accordion>

  <Accordion title="認証とセキュリティの subpath">
    | Subpath | 主な export |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、command registry helper、送信者認可 helper |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` と `buildHelpMessage` のような command/help message builder |
    | `plugin-sdk/approval-auth-runtime` | approver 解決と同一チャット action-auth helper |
    | `plugin-sdk/approval-client-runtime` | ネイティブ exec approval profile/filter helper |
    | `plugin-sdk/approval-delivery-runtime` | ネイティブ approval capability/delivery adapter |
    | `plugin-sdk/approval-gateway-runtime` | 共有 approval gateway 解決 helper |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot channel entrypoint 向けの軽量なネイティブ approval adapter 読み込み helper |
    | `plugin-sdk/approval-handler-runtime` | より広い approval handler runtime helper。狭い adapter/gateway seam で足りる場合はそちらを優先してください |
    | `plugin-sdk/approval-native-runtime` | ネイティブ approval target + account-binding helper |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin approval reply payload helper |
    | `plugin-sdk/command-auth-native` | ネイティブ command auth + ネイティブ session-target helper |
    | `plugin-sdk/command-detection` | 共有 command 検出 helper |
    | `plugin-sdk/command-surface` | command-body 正規化と command-surface helper |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/Plugin secret surface 用の狭い secret-contract 収集 helper |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config 解析用の狭い `coerceSecretRef` と SecretRef 型 helper |
    | `plugin-sdk/security-runtime` | 共有の trust、DM gating、external-content、および secret-collection helper |
    | `plugin-sdk/ssrf-policy` | host allowlist とプライベートネットワーク SSRF policy helper |
    | `plugin-sdk/ssrf-dispatcher` | より広い infra runtime surface を含まない狭い pinned-dispatcher helper |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher、SSRF 保護付き fetch、および SSRF policy helper |
    | `plugin-sdk/secret-input` | secret input 解析 helper |
    | `plugin-sdk/webhook-ingress` | Webhook request/target helper |
    | `plugin-sdk/webhook-request-guards` | request body size/timeout helper |
  </Accordion>

  <Accordion title="Runtime と storage の subpath">
    | Subpath | 主な export |
    | --- | --- |
    | `plugin-sdk/runtime` | より広い runtime/logging/backup/Plugin install helper |
    | `plugin-sdk/runtime-env` | 狭い runtime env、logger、timeout、retry、および backoff helper |
    | `plugin-sdk/channel-runtime-context` | 汎用 channel runtime-context 登録および lookup helper |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有 Plugin command/hook/http/interactive helper |
    | `plugin-sdk/hook-runtime` | 共有 Webhook/internal hook pipeline helper |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeSurface` のような lazy runtime import/binding helper |
    | `plugin-sdk/process-runtime` | プロセス exec helper |
    | `plugin-sdk/cli-runtime` | CLI 整形、wait、および version helper |
    | `plugin-sdk/gateway-runtime` | Gateway client と channel-status patch helper |
    | `plugin-sdk/config-runtime` | config load/write helper |
    | `plugin-sdk/telegram-command-config` | 同梱 Telegram contract surface が利用できない場合でも使える、Telegram command-name/description の正規化および重複/衝突チェック |
    | `plugin-sdk/text-autolink-runtime` | より広い text-runtime barrel を使わない file-reference autolink 検出 |
    | `plugin-sdk/approval-runtime` | exec/Plugin approval helper、approval-capability builder、auth/profile helper、ネイティブルーティング/runtime helper |
    | `plugin-sdk/reply-runtime` | 共有 inbound/reply runtime helper、chunking、dispatch、Heartbeat、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 狭い reply dispatch/finalize helper |
    | `plugin-sdk/reply-history` | `buildHistoryContext`、`recordPendingHistoryEntry`、`clearHistoryEntriesIfEnabled` のような共有 short-window reply-history helper |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭い text/markdown chunking helper |
    | `plugin-sdk/session-store-runtime` | session store path + updated-at helper |
    | `plugin-sdk/state-paths` | state/OAuth ディレクトリ path helper |
    | `plugin-sdk/routing` | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId` のような route/session-key/account binding helper |
    | `plugin-sdk/status-helpers` | 共有 channel/account status 要約 helper、runtime-state デフォルト、および issue metadata helper |
    | `plugin-sdk/target-resolver-runtime` | 共有 target resolver helper |
    | `plugin-sdk/string-normalization-runtime` | slug/string 正規化 helper |
    | `plugin-sdk/request-url` | fetch/request 風入力から文字列 URL を抽出 |
    | `plugin-sdk/run-command` | 正規化された stdout/stderr 結果を持つ timed command runner |
    | `plugin-sdk/param-readers` | 共通 tool/CLI param reader |
    | `plugin-sdk/tool-payload` | tool result object から正規化 payload を抽出 |
    | `plugin-sdk/tool-send` | tool args から canonical send target field を抽出 |
    | `plugin-sdk/temp-path` | 共有 temp-download path helper |
    | `plugin-sdk/logging-core` | subsystem logger と redaction helper |
    | `plugin-sdk/markdown-table-runtime` | Markdown table mode helper |
    | `plugin-sdk/json-store` | 小さな JSON state の read/write helper |
    | `plugin-sdk/file-lock` | 再入可能な file-lock helper |
    | `plugin-sdk/persistent-dedupe` | ディスク backed の dedupe cache helper |
    | `plugin-sdk/acp-runtime` | ACP runtime/session と reply-dispatch helper |
    | `plugin-sdk/acp-binding-resolve-runtime` | lifecycle startup import を伴わない読み取り専用 ACP binding 解決 |
    | `plugin-sdk/agent-config-primitives` | 狭い agent runtime config-schema primitive |
    | `plugin-sdk/boolean-param` | 緩い boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | dangerous-name の一致解決 helper |
    | `plugin-sdk/device-bootstrap` | device bootstrap と pairing token helper |
    | `plugin-sdk/extension-shared` | 共有 passive-channel、status、および ambient proxy helper primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply helper |
    | `plugin-sdk/skill-commands-runtime` | Skill command 一覧 helper |
    | `plugin-sdk/native-command-registry` | ネイティブ command registry/build/serialize helper |
    | `plugin-sdk/agent-harness` | 低レベル agent harness 向けの実験的 trusted-Plugin surface: harness 型、active-run の steer/abort helper、OpenClaw tool bridge helper、および attempt result utility |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I endpoint 検出 helper |
    | `plugin-sdk/infra-runtime` | system event/Heartbeat helper |
    | `plugin-sdk/collection-runtime` | 小さな bounded cache helper |
    | `plugin-sdk/diagnostic-runtime` | diagnostic flag と event helper |
    | `plugin-sdk/error-runtime` | error graph、整形、共有 error 分類 helper、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | wrapped fetch、proxy、および pinned lookup helper |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch import を伴わない dispatcher-aware runtime fetch |
    | `plugin-sdk/response-limit-runtime` | より広い media runtime surface を使わない bounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | 設定済み binding routing や pairing store を伴わない現在の会話 binding 状態 |
    | `plugin-sdk/session-store-runtime` | より広い config write/maintenance import を伴わない session-store read helper |
    | `plugin-sdk/context-visibility-runtime` | より広い config/security import を伴わない context visibility 解決と補助コンテキストのフィルタリング |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging import を伴わない狭い primitive record/string coercion と正規化 helper |
    | `plugin-sdk/host-runtime` | hostname と SCP host の正規化 helper |
    | `plugin-sdk/retry-runtime` | retry config と retry runner helper |
    | `plugin-sdk/agent-runtime` | agent ディレクトリ/identity/workspace helper |
    | `plugin-sdk/directory-runtime` | config-backed ディレクトリ query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability と testing の subpath">
    | Subpath | 主な export |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有 media fetch/transform/store helper と media payload builder |
    | `plugin-sdk/media-generation-runtime` | 共有 media-generation failover helper、候補選択、および missing-model メッセージング |
    | `plugin-sdk/media-understanding` | Media understanding provider 型と provider 向け image/audio helper export |
    | `plugin-sdk/text-runtime` | assistant-visible-text 除去、markdown render/chunking/table helper、redaction helper、directive-tag helper、安全な text utility などの共有 text/markdown/logging helper |
    | `plugin-sdk/text-chunking` | outbound text chunking helper |
    | `plugin-sdk/speech` | Speech provider 型と provider 向け directive、registry、および validation helper |
    | `plugin-sdk/speech-core` | 共有 speech provider 型、registry、directive、および正規化 helper |
    | `plugin-sdk/realtime-transcription` | Realtime transcription provider 型と registry helper |
    | `plugin-sdk/realtime-voice` | Realtime voice provider 型と registry helper |
    | `plugin-sdk/image-generation` | Image generation provider 型 |
    | `plugin-sdk/image-generation-core` | 共有 image-generation 型、failover、auth、および registry helper |
    | `plugin-sdk/music-generation` | Music generation provider/request/result 型 |
    | `plugin-sdk/music-generation-core` | 共有 music-generation 型、failover helper、provider lookup、および model-ref 解析 |
    | `plugin-sdk/video-generation` | Video generation provider/request/result 型 |
    | `plugin-sdk/video-generation-core` | 共有 video-generation 型、failover helper、provider lookup、および model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook target registry と route-install helper |
    | `plugin-sdk/webhook-path` | Webhook path 正規化 helper |
    | `plugin-sdk/web-media` | 共有 remote/local media 読み込み helper |
    | `plugin-sdk/zod` | Plugin SDK 利用者向けに再 export された `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory の subpath">
    | Subpath | 主な export |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI helper 用の同梱 memory-core helper surface |
    | `plugin-sdk/memory-core-engine-runtime` | Memory index/search runtime facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding contract、registry access、local provider、および汎用 batch/remote helper |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine export |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine export |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host multimodal helper |
    | `plugin-sdk/memory-core-host-query` | Memory host query helper |
    | `plugin-sdk/memory-core-host-secret` | Memory host secret helper |
    | `plugin-sdk/memory-core-host-events` | Memory host event journal helper |
    | `plugin-sdk/memory-core-host-status` | Memory host status helper |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI runtime helper |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host core runtime helper |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host file/runtime helper |
    | `plugin-sdk/memory-host-core` | Memory host core runtime helper の vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-events` | Memory host event journal helper の vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-files` | Memory host file/runtime helper の vendor-neutral エイリアス |
    | `plugin-sdk/memory-host-markdown` | memory 隣接 Plugin 用の共有 managed-markdown helper |
    | `plugin-sdk/memory-host-search` | search-manager access 用の Active Memory runtime facade |
    | `plugin-sdk/memory-host-status` | Memory host status helper の vendor-neutral エイリアス |
    | `plugin-sdk/memory-lancedb` | 同梱 memory-lancedb helper surface |
  </Accordion>

  <Accordion title="予約済みの bundled-helper subpath">
    | Family | 現在の subpath | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 同梱 browser Plugin のサポート helper（`browser-support` は引き続き互換性 barrel） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 同梱 Matrix helper/runtime surface |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 同梱 LINE helper/runtime surface |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 同梱 IRC helper surface |
    | channel 固有 helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 同梱 channel 互換性/helper seam |
    | auth/Plugin 固有 helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 同梱 feature/Plugin helper seam。`plugin-sdk/github-copilot-token` は現在 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken`、`resolveCopilotApiToken` を export しています |
  </Accordion>
</AccordionGroup>

## 登録 API

`register(api)` コールバックは、次のメソッドを持つ `OpenClawPluginApi` オブジェクトを受け取ります:

### Capability の登録

| Method                                           | 登録するもの                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | テキスト推論（LLM）                   |
| `api.registerAgentHarness(...)`                  | 実験的な低レベル agent executor       |
| `api.registerCliBackend(...)`                    | local CLI 推論 backend                |
| `api.registerChannel(...)`                       | メッセージング channel                |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis        |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcription      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime voice セッション      |
| `api.registerMediaUnderstandingProvider(...)`    | 画像/音声/動画解析                    |
| `api.registerImageGenerationProvider(...)`       | 画像生成                              |
| `api.registerMusicGenerationProvider(...)`       | 音楽生成                              |
| `api.registerVideoGenerationProvider(...)`       | 動画生成                              |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider           |
| `api.registerWebSearchProvider(...)`             | Web 検索                              |

### ツールとコマンド

| Method                          | 登録するもの                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | agent tool（必須、または `{ optional: true }`） |
| `api.registerCommand(def)`      | カスタムコマンド（LLM をバイパスする）         |

### インフラ

| Method                                         | 登録するもの                          |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | event hook                            |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                    |
| `api.registerCli(registrar, opts?)`            | CLI subcommand                        |
| `api.registerService(service)`                 | バックグラウンド service              |
| `api.registerInteractiveHandler(registration)` | interactive handler                   |
| `api.registerMemoryPromptSupplement(builder)`  | 加算的な memory 隣接 prompt section   |
| `api.registerMemoryCorpusSupplement(adapter)`  | 加算的な memory search/read corpus    |

予約済みの core admin namespace（`config.*`、`exec.approvals.*`、`wizard.*`、
`update.*`）は、Plugin がより狭い gateway method scope を割り当てようとしても、
常に `operator.admin` のままです。Plugin 所有の method には
Plugin 固有の prefix を推奨します。

### CLI 登録メタデータ

`api.registerCli(registrar, opts?)` は、2 種類のトップレベルメタデータを受け付けます:

- `commands`: registrar が所有する明示的なコマンドルート
- `descriptors`: ルート CLI ヘルプ、ルーティング、および lazy Plugin CLI 登録に使われる parse-time command descriptor

Plugin コマンドを通常のルート CLI パスで lazy-load のままにしたい場合は、
その registrar が公開するすべてのトップレベル command root をカバーする
`descriptors` を指定してください。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrix accounts, verification, devices, and profile state を管理する",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands` 単独を使うのは、lazy なルート CLI 登録が不要な場合だけにしてください。  
その eager 互換パスも引き続きサポートされますが、parse-time lazy loading 用の
descriptor-backed placeholder はインストールされません。

### CLI backend の登録

`api.registerCliBackend(...)` を使うと、`codex-cli` のような local
AI CLI backend のデフォルト config を Plugin が所有できます。

- backend の `id` は、`codex-cli/gpt-5` のような model ref の provider prefix になります。
- backend の `config` は、`agents.defaults.cliBackends.<id>` と同じ shape を使います。
- ユーザー config が常に優先されます。OpenClaw は、CLI 実行前に
  Plugin デフォルトの上に `agents.defaults.cliBackends.<id>` をマージします。
- マージ後に互換性のための書き換えが必要な backend には `normalizeConfig` を使ってください
  （たとえば古い flag shape の正規化など）。

### 排他的スロット

| Method                                     | 登録するもの                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine（一度に 1 つだけ有効）。`assemble()` コールバックは `availableTools` と `citationsMode` を受け取るため、engine はそれに合わせて prompt 追加を調整できます。 |
| `api.registerMemoryCapability(capability)` | 統合 memory capability                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | memory prompt section builder                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | memory flush plan resolver                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | memory runtime adapter                                                                                                                                   |

### Memory embedding adapter

| Method                                         | 登録するもの                                    |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | アクティブ Plugin 用の memory embedding adapter |

- `registerMemoryCapability` が、推奨される排他的 memory-Plugin API です。
- `registerMemoryCapability` は `publicArtifacts.listArtifacts(...)` も公開できるため、
  companion Plugin は特定の memory Plugin の private layout に触れる代わりに
  `openclaw/plugin-sdk/memory-host-core` 経由で export された memory artifact を利用できます。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan`、および
  `registerMemoryRuntime` は、旧互換の排他的 memory-Plugin API です。
- `registerMemoryEmbeddingProvider` により、アクティブ memory Plugin は 1 つ以上の
  embedding adapter id（たとえば `openai`、`gemini`、または
  Plugin 定義のカスタム id）を登録できます。
- `agents.defaults.memorySearch.provider` や
  `agents.defaults.memorySearch.fallback` のようなユーザー config は、
  それらの登録済み adapter id に対して解決されます。

### イベントとライフサイクル

| Method                                       | 動作内容                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 型付きライフサイクル hook     |
| `api.onConversationBindingResolved(handler)` | 会話 binding callback         |

### Hook 判定セマンティクス

- `before_tool_call`: `{ block: true }` を返すと終端です。いずれかの handler がこれを設定すると、それより低優先度の handler はスキップされます。
- `before_tool_call`: `{ block: false }` を返しても判定なしとして扱われます（`block` を省略した場合と同じ）であり、上書きではありません。
- `before_install`: `{ block: true }` を返すと終端です。いずれかの handler がこれを設定すると、それより低優先度の handler はスキップされます。
- `before_install`: `{ block: false }` を返しても判定なしとして扱われます（`block` を省略した場合と同じ）であり、上書きではありません。
- `reply_dispatch`: `{ handled: true, ... }` を返すと終端です。いずれかの handler が dispatch を引き受けると、それより低優先度の handler とデフォルトのモデル dispatch パスはスキップされます。
- `message_sending`: `{ cancel: true }` を返すと終端です。いずれかの handler がこれを設定すると、それより低優先度の handler はスキップされます。
- `message_sending`: `{ cancel: false }` を返しても判定なしとして扱われます（`cancel` を省略した場合と同じ）であり、上書きではありません。

### API オブジェクトのフィールド

| Field                    | Type                      | 説明                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                    |
| `api.name`               | `string`                  | 表示名                                                                                       |
| `api.version`            | `string?`                 | Plugin version（任意）                                                                       |
| `api.description`        | `string?`                 | Plugin の説明（任意）                                                                        |
| `api.source`             | `string`                  | Plugin source path                                                                           |
| `api.rootDir`            | `string?`                 | Plugin root ディレクトリ（任意）                                                             |
| `api.config`             | `OpenClawConfig`          | 現在の config スナップショット（利用可能な場合はアクティブな in-memory runtime スナップショット） |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` からの Plugin 固有 config                                     |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/ja-JP/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | スコープ付き logger（`debug`, `info`, `warn`, `error`）                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | 現在の load mode。`"setup-runtime"` は full-entry 前の軽量な起動/セットアップ用ウィンドウです |
| `api.resolvePath(input)` | `(string) => string`      | Plugin root からの相対パスを解決する                                                        |

## 内部モジュール規約

Plugin 内では、内部 import にローカル barrel file を使用してください:

```
my-plugin/
  api.ts            # 外部利用者向け public export
  runtime-api.ts    # 内部専用 runtime export
  index.ts          # Plugin entry point
  setup-entry.ts    # 軽量な setup 専用 entry（任意）
```

<Warning>
  本番コードから `openclaw/plugin-sdk/<your-plugin>` 経由で自分自身の Plugin を import してはいけません。
  内部 import は `./api.ts` または
  `./runtime-api.ts` を経由させてください。SDK path は外部コントラクト専用です。
</Warning>

facade-loaded な同梱 Plugin の public surface（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts`、および同様の public entry file）は、
OpenClaw がすでに動作中であれば、現在の runtime config スナップショットを優先して使います。  
まだ runtime スナップショットが存在しない場合は、ディスク上の解決済み config file にフォールバックします。

provider Plugin は、helper が意図的に provider 固有で、まだ汎用 SDK
subpath に属さない場合、狭い plugin ローカル contract barrel を公開することもできます。  
現在の同梱例: Anthropic provider は、Anthropic のベータヘッダーや
`service_tier` ロジックを汎用 `plugin-sdk/*` コントラクトへ昇格させる代わりに、
Claude stream helper を自身の public `api.ts` / `contract-api.ts` seam に保持しています。

その他の現在の同梱例:

- `@openclaw/openai-provider`: `api.ts` は provider builder、
  default-model helper、および realtime provider builder を export します
- `@openclaw/openrouter-provider`: `api.ts` は provider builder と
  onboarding/config helper を export します

<Warning>
  extension の本番コードでも `openclaw/plugin-sdk/<other-plugin>` の
  import は避けてください。helper が本当に共有されるべきなら、
  2 つの Plugin を結合させる代わりに、`openclaw/plugin-sdk/speech`、`.../provider-model-shared`、
  または別の capability 指向 surface のような中立的な SDK subpath に昇格させてください。
</Warning>

## 関連

- [Entry Points](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry` のオプション
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime) — 完全な `api.runtime` namespace リファレンス
- [Setup and Config](/ja-JP/plugins/sdk-setup) — パッケージング、manifest、config schema
- [Testing](/ja-JP/plugins/sdk-testing) — テスト utility と lint rule
- [SDK Migration](/ja-JP/plugins/sdk-migration) — 非推奨 surface からの移行
- [Plugin Internals](/ja-JP/plugins/architecture) — 詳細なアーキテクチャと capability モデル
