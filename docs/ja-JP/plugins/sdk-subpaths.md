---
read_when:
    - plugin-sdk importに適したsubpathを選ぶ
    - 同梱pluginのsubpathとhelperサーフェスを監査する
summary: 'Plugin SDK subpathカタログ: どのimportがどこにあるか、領域ごとに整理したもの'
title: Plugin SDK subpath怎么领奖 to=final code  天天购彩票 omitted
x-i18n:
    generated_at: "2026-04-24T05:12:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753c7202a8a59ae9e420d436c7f3770ea455d810f2af52b716d438b84b8b986e
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  plugin SDKは `openclaw/plugin-sdk/` 配下の狭いsubpath群として公開されています。
  このページは、よく使われるsubpathを目的別にまとめたカタログです。生成済みの
  完全な200以上のsubpath一覧は `scripts/lib/plugin-sdk-entrypoints.json` にあり、
  予約された同梱plugin helper subpathもそこに現れますが、
  doc pageが明示的に昇格させない限り、それらは実装詳細です。

  plugin作成ガイドについては [Plugin SDK overview](/ja-JP/plugins/sdk-overview) を参照してください。

  ## Plugin entry

  | Subpath                     | 主なexport                                                                                                                             |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Channel subpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | ルート `openclaw.json` Zod schema export（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, および `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共有setup wizard helper、allowlist prompt、setup status builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | マルチaccount config/action-gate helper、default-account fallback helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id正規化helper |
    | `plugin-sdk/account-resolution` | Account lookup + default-fallback helper |
    | `plugin-sdk/account-helpers` | 狭いaccount-list/account-action helper |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel config schema型 |
    | `plugin-sdk/telegram-command-config` | Telegram custom-command正規化/検証helper（bundled-contract fallback付き） |
    | `plugin-sdk/command-gating` | 狭いcommand authorization gate helper |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, draft stream lifecycle/finalization helper |
    | `plugin-sdk/inbound-envelope` | 共有inbound route + envelope builder helper |
    | `plugin-sdk/inbound-reply-dispatch` | 共有inbound record-and-dispatch helper |
    | `plugin-sdk/messaging-targets` | Target parsing/matching helper |
    | `plugin-sdk/outbound-media` | 共有outbound media loading helper |
    | `plugin-sdk/outbound-runtime` | Outbound identity, send delegate, payload planning helper |
    | `plugin-sdk/poll-runtime` | 狭いpoll正規化helper |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding lifecycleとadapter helper |
    | `plugin-sdk/agent-media-payload` | レガシーagent media payload builder |
    | `plugin-sdk/conversation-runtime` | Conversation/thread binding, pairing, configured-binding helper |
    | `plugin-sdk/runtime-config-snapshot` | Runtime config snapshot helper |
    | `plugin-sdk/runtime-group-policy` | Runtime group-policy解決helper |
    | `plugin-sdk/channel-status` | 共有channel status snapshot/summary helper |
    | `plugin-sdk/channel-config-primitives` | 狭いchannel config-schema primitive |
    | `plugin-sdk/channel-config-writes` | Channel config-write authorization helper |
    | `plugin-sdk/channel-plugin-common` | 共有channel plugin prelude export |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config edit/read helper |
    | `plugin-sdk/group-access` | 共有group-access decision helper |
    | `plugin-sdk/direct-dm` | 共有direct-DM auth/guard helper |
    | `plugin-sdk/interactive-runtime` | semantic message presentation, delivery, legacy interactive reply helper。[Message Presentation](/ja-JP/plugins/message-presentation) を参照 |
    | `plugin-sdk/channel-inbound` | inbound debounce, mention matching, mention-policy helper, envelope helperの互換barrel |
    | `plugin-sdk/channel-inbound-debounce` | 狭いinbound debounce helper |
    | `plugin-sdk/channel-mention-gating` | より広いinbound runtime surfaceなしの、狭いmention-policyとmention text helper |
    | `plugin-sdk/channel-envelope` | 狭いinbound envelope formatting helper |
    | `plugin-sdk/channel-location` | Channel location contextとformatting helper |
    | `plugin-sdk/channel-logging` | inbound dropとtyping/ack failure向けchannel logging helper |
    | `plugin-sdk/channel-send-result` | Reply result型 |
    | `plugin-sdk/channel-actions` | Channel message-action helperと、plugin互換性のため残された非推奨native schema helper |
    | `plugin-sdk/channel-targets` | Target parsing/matching helper |
    | `plugin-sdk/channel-contract` | Channel contract型 |
    | `plugin-sdk/channel-feedback` | Feedback/reaction配線 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`、secret target型のような狭いsecret-contract helper |
  </Accordion>

  <Accordion title="Provider subpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 厳選されたlocal/self-hosted provider setup helper |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI互換self-hosted provider setup helperに特化 |
    | `plugin-sdk/cli-backend` | CLI backendデフォルト + watchdog定数 |
    | `plugin-sdk/provider-auth-runtime` | provider plugin向けランタイムAPI-key解決helper |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` のようなAPI-key onboarding/profile-write helper |
    | `plugin-sdk/provider-auth-result` | 標準OAuth auth-result builder |
    | `plugin-sdk/provider-auth-login` | provider plugin向け共有interactive login helper |
    | `plugin-sdk/provider-env-vars` | Provider auth env-var lookup helper |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, shared replay-policy builder, provider-endpoint helper、`normalizeNativeXaiModelId` のようなmodel-id正規化helper |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 音声文字起こしmultipart form helperを含む、汎用provider HTTP/endpoint capability helper |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` や `WebFetchProviderPlugin` のような狭いweb-fetch config/selection contract helper |
    | `plugin-sdk/provider-web-fetch` | Web-fetch provider registration/cache helper |
    | `plugin-sdk/provider-web-search-config-contract` | plugin-enable wiringを必要としないprovider向けの狭いweb-search config/credential helper |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, scope付きcredential setter/getterのような狭いweb-search config/credential contract helper |
    | `plugin-sdk/provider-web-search` | Web-search provider registration/cache/runtime helper |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics、`resolveXaiModelCompatPatch` / `applyXaiModelCompat` のようなxAI compat helper |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` など |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper型、および共有のAnthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch、transport message transform、書き込み可能transport event streamのようなnative provider transport helper |
    | `plugin-sdk/provider-onboard` | Onboarding config patch helper |
    | `plugin-sdk/global-singleton` | process-local singleton/map/cache helper |
    | `plugin-sdk/group-activation` | 狭いgroup activation modeとcommand parsing helper |
  </Accordion>

  <Accordion title="Authとsecurityのsubpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, command registry helper, sender-authorization helper |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated`, `buildHelpMessage` のようなcommand/help message builder |
    | `plugin-sdk/approval-auth-runtime` | approver解決とsame-chat action-auth helper |
    | `plugin-sdk/approval-client-runtime` | native exec approval profile/filter helper |
    | `plugin-sdk/approval-delivery-runtime` | native approval capability/delivery adapter |
    | `plugin-sdk/approval-gateway-runtime` | 共有approval gateway解決helper |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot channel entrypoint向け軽量native approval adapter loading helper |
    | `plugin-sdk/approval-handler-runtime` | より広いapproval handler runtime helper。narrower adapter/gateway seamで足りる場合はそちらを優先してください |
    | `plugin-sdk/approval-native-runtime` | native approval target + account-binding helper |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin approval reply payload helper |
    | `plugin-sdk/reply-dedupe` | 狭いinbound reply dedupe reset helper |
    | `plugin-sdk/channel-contract-testing` | 広いtesting barrelなしの、狭いchannel contract test helper |
    | `plugin-sdk/command-auth-native` | native command auth + native session-target helper |
    | `plugin-sdk/command-detection` | 共有command detection helper |
    | `plugin-sdk/command-primitives-runtime` | hot channel path向け軽量command text predicate |
    | `plugin-sdk/command-surface` | command-body正規化とcommand-surface helper |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/plugin secret surface向け狭いsecret-contract collection helper |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config parsing向けの狭い `coerceSecretRef` と SecretRef typing helper |
    | `plugin-sdk/security-runtime` | 共有trust, DM gating, external-content, secret-collection helper |
    | `plugin-sdk/ssrf-policy` | host allowlistとprivate-network SSRF policy helper |
    | `plugin-sdk/ssrf-dispatcher` | 広いinfra runtime surfaceなしの狭いpinned-dispatcher helper |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF-guarded fetch, SSRF policy helper |
    | `plugin-sdk/secret-input` | secret input parsing helper |
    | `plugin-sdk/webhook-ingress` | Webhook request/target helper |
    | `plugin-sdk/webhook-request-guards` | request body size/timeout helper |
  </Accordion>

  <Accordion title="Runtimeとstorageのsubpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/runtime` | 広いruntime/logging/backup/plugin-install helper |
    | `plugin-sdk/runtime-env` | 狭いruntime env, logger, timeout, retry, backoff helper |
    | `plugin-sdk/channel-runtime-context` | generic channel runtime-context registrationとlookup helper |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共有plugin command/hook/http/interactive helper |
    | `plugin-sdk/hook-runtime` | 共有Webhook/internal hook pipeline helper |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` のようなlazy runtime import/binding helper |
    | `plugin-sdk/process-runtime` | process exec helper |
    | `plugin-sdk/cli-runtime` | CLI formatting, wait, version helper |
    | `plugin-sdk/gateway-runtime` | Gateway clientとchannel-status patch helper |
    | `plugin-sdk/config-runtime` | config load/write helperとplugin-config lookup helper |
    | `plugin-sdk/telegram-command-config` | bundled Telegram contract surfaceが利用できない場合でも、Telegram command-name/description正規化とduplicate/conflict check |
    | `plugin-sdk/text-autolink-runtime` | 広いtext-runtime barrelなしのfile-reference autolink detection |
    | `plugin-sdk/approval-runtime` | exec/plugin approval helper, approval-capability builder, auth/profile helper, native routing/runtime helper |
    | `plugin-sdk/reply-runtime` | 共有inbound/reply runtime helper, chunking, dispatch, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 狭いreply dispatch/finalize helper |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` のような共有short-window reply-history helper |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭いtext/markdown chunking helper |
    | `plugin-sdk/session-store-runtime` | session store path + updated-at helper |
    | `plugin-sdk/state-paths` | state/OAuth dir path helper |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` のようなroute/session-key/account binding helper |
    | `plugin-sdk/status-helpers` | 共有channel/account status summary helper, runtime-state default, issue metadata helper |
    | `plugin-sdk/target-resolver-runtime` | 共有target resolver helper |
    | `plugin-sdk/string-normalization-runtime` | slug/string正規化helper |
    | `plugin-sdk/request-url` | fetch/request風入力から文字列URLを抽出 |
    | `plugin-sdk/run-command` | 正規化済みstdout/stderr結果を持つtimed command runner |
    | `plugin-sdk/param-readers` | 共通tool/CLI param reader |
    | `plugin-sdk/tool-payload` | tool result objectから正規化payloadを抽出 |
    | `plugin-sdk/tool-send` | tool argからcanonical send target fieldを抽出 |
    | `plugin-sdk/temp-path` | 共有temp-download path helper |
    | `plugin-sdk/logging-core` | subsystem loggerとredaction helper |
    | `plugin-sdk/markdown-table-runtime` | markdown table modeとconversion helper |
    | `plugin-sdk/json-store` | 小さなJSON state read/write helper |
    | `plugin-sdk/file-lock` | re-entrant file-lock helper |
    | `plugin-sdk/persistent-dedupe` | disk-backed dedupe cache helper |
    | `plugin-sdk/acp-runtime` | ACP runtime/sessionとreply-dispatch helper |
    | `plugin-sdk/acp-binding-resolve-runtime` | lifecycle startup importなしのread-only ACP binding resolution |
    | `plugin-sdk/agent-config-primitives` | 狭いagent runtime config-schema primitive |
    | `plugin-sdk/boolean-param` | 緩いboolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | dangerous-name matching resolution helper |
    | `plugin-sdk/device-bootstrap` | device bootstrapとpairing token helper |
    | `plugin-sdk/extension-shared` | 共有passive-channel, status, ambient proxy helper primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply helper |
    | `plugin-sdk/skill-commands-runtime` | skill command listing helper |
    | `plugin-sdk/native-command-registry` | native command registry/build/serialize helper |
    | `plugin-sdk/agent-harness` | low-level agent harness向け実験的trusted-pluginサーフェス: harness型、active-run steer/abort helper、OpenClaw tool bridge helper、attempt result utility |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint detection helper |
    | `plugin-sdk/infra-runtime` | system event/heartbeat helper |
    | `plugin-sdk/collection-runtime` | 小さなbounded cache helper |
    | `plugin-sdk/diagnostic-runtime` | diagnostic flagとevent helper |
    | `plugin-sdk/error-runtime` | error graph, formatting, 共有error classification helper, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | wrapped fetch, proxy, pinned lookup helper |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch importなしのdispatcher-aware runtime fetch |
    | `plugin-sdk/response-limit-runtime` | 広いmedia runtime surfaceなしのbounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | configured binding routingやpairing storeなしのcurrent conversation binding state |
    | `plugin-sdk/session-store-runtime` | 広いconfig write/maintenance importなしのsession-store read helper |
    | `plugin-sdk/context-visibility-runtime` | 広いconfig/security importなしのcontext visibility解決とsupplemental context filtering |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging importなしの狭いprimitive record/string coercionと正規化helper |
    | `plugin-sdk/host-runtime` | hostnameとSCP host正規化helper |
    | `plugin-sdk/retry-runtime` | retry configとretry runner helper |
    | `plugin-sdk/agent-runtime` | agent dir/identity/workspace helper |
    | `plugin-sdk/directory-runtime` | config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capabilityとtestingのsubpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共有media fetch/transform/store helperとmedia payload builder |
    | `plugin-sdk/media-store` | `saveMediaBuffer` のような狭いmedia store helper |
    | `plugin-sdk/media-generation-runtime` | 共有media-generation failover helper, candidate selection, missing-model messaging |
    | `plugin-sdk/media-understanding` | media understanding provider型とprovider向けimage/audio helper export |
    | `plugin-sdk/text-runtime` | assistant-visible-text stripping、markdown render/chunking/table helper、redaction helper、directive-tag helper、安全なtext utilityのような共有text/markdown/logging helper |
    | `plugin-sdk/text-chunking` | outbound text chunking helper |
    | `plugin-sdk/speech` | speech provider型とprovider向けdirective, registry, validation helper |
    | `plugin-sdk/speech-core` | 共有speech provider型、registry、directive、正規化helper |
    | `plugin-sdk/realtime-transcription` | realtime transcription provider型、registry helper、共有WebSocket session helper |
    | `plugin-sdk/realtime-voice` | realtime voice provider型とregistry helper |
    | `plugin-sdk/image-generation` | image generation provider型 |
    | `plugin-sdk/image-generation-core` | 共有image-generation型、failover、auth、registry helper |
    | `plugin-sdk/music-generation` | music generation provider/request/result型 |
    | `plugin-sdk/music-generation-core` | 共有music-generation型、failover helper、provider lookup、model-ref parsing |
    | `plugin-sdk/video-generation` | video generation provider/request/result型 |
    | `plugin-sdk/video-generation-core` | 共有video-generation型、failover helper、provider lookup、model-ref parsing |
    | `plugin-sdk/webhook-targets` | Webhook target registryとroute-install helper |
    | `plugin-sdk/webhook-path` | Webhook path正規化helper |
    | `plugin-sdk/web-media` | 共有remote/local media loading helper |
    | `plugin-sdk/zod` | plugin SDK consumer向けに再exportされた `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memoryのsubpath">
    | Subpath | 主なexport |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI helper向けの同梱memory-core helperサーフェス |
    | `plugin-sdk/memory-core-engine-runtime` | Memory index/search runtime facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding contract、registry access、local provider、汎用batch/remote helper |
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
    | `plugin-sdk/memory-host-core` | memory host core runtime helper向けvendor-neutral alias |
    | `plugin-sdk/memory-host-events` | memory host event journal helper向けvendor-neutral alias |
    | `plugin-sdk/memory-host-files` | memory host file/runtime helper向けvendor-neutral alias |
    | `plugin-sdk/memory-host-markdown` | memory隣接plugin向けの共有managed-markdown helper |
    | `plugin-sdk/memory-host-search` | search-manager access向けactive memory runtime facade |
    | `plugin-sdk/memory-host-status` | memory host status helper向けvendor-neutral alias |
    | `plugin-sdk/memory-lancedb` | 同梱memory-lancedb helperサーフェス |
  </Accordion>

  <Accordion title="予約済みの同梱helper subpath">
    | Family | 現在のsubpath | 想定用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 同梱browser plugin support helper（`browser-support` は互換barrelとして残る） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 同梱Matrix helper/runtimeサーフェス |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 同梱LINE helper/runtimeサーフェス |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 同梱IRC helperサーフェス |
    | channel固有helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 同梱channelのcompatibility/helper seam |
    | auth/plugin固有helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 同梱feature/plugin helper seam。`plugin-sdk/github-copilot-token` は現在 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken` をexportする |
  </Accordion>
</AccordionGroup>

## 関連

- [Plugin SDK overview](/ja-JP/plugins/sdk-overview)
- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Building plugins](/ja-JP/plugins/building-plugins)
