---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 경고가 표시됩니다
    - OPENCLAW_EXTENSION_API_DEPRECATED 경고가 표시됩니다
    - plugin을 최신 plugin 아키텍처로 업데이트하고 있습니다
    - 외부 OpenClaw plugin을 유지 관리하고 있습니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 레이어에서 최신 plugin SDK로 마이그레이션합니다
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-04-06T06:01:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94f12d1376edd8184714cc4dbea4a88fa8ed652f65e9365ede6176f3bf441b33
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK 마이그레이션

OpenClaw는 폭넓은 하위 호환성 레이어에서 집중적이고 문서화된 import를 사용하는 최신 plugin
아키텍처로 전환했습니다. 새 아키텍처 이전에 plugin을 만들었다면 이 가이드가 마이그레이션에 도움이 됩니다.

## 무엇이 변경되나요

기존 plugin 시스템은 plugin이 단일 진입점에서 필요한 모든 것을 import할 수 있도록 하는
두 개의 광범위하게 열린 표면을 제공했습니다:

- **`openclaw/plugin-sdk/compat`** — 수십 개의 helper를 다시 export하는 단일 import입니다.
  새 plugin 아키텍처가 구축되는 동안 이전 hook 기반 plugin이 계속 동작하도록 도입되었습니다.
- **`openclaw/extension-api`** — 내장 agent runner 같은 호스트 측 helper에 plugin이 직접 접근할 수 있게 해주는 브리지입니다.

이 두 표면은 이제 모두 **지원 중단(deprecated)** 되었습니다. 런타임에서는 여전히 동작하지만,
새 plugin은 이를 사용해서는 안 되며, 기존 plugin은 다음 메이저 릴리스에서 제거되기 전에 마이그레이션해야 합니다.

<Warning>
  하위 호환성 레이어는 향후 메이저 릴리스에서 제거될 예정입니다.
  여전히 이 표면들에서 import하는 plugin은 그 시점에 중단됩니다.
</Warning>

## 왜 변경되었나요

기존 접근 방식은 다음과 같은 문제를 일으켰습니다:

- **느린 시작 속도** — helper 하나를 import해도 관련 없는 수십 개의 module이 로드됨
- **순환 의존성** — 광범위한 재export로 인해 import cycle이 쉽게 생김
- **불분명한 API 표면** — 어떤 export가 안정적이고 어떤 것이 내부용인지 구분할 방법이 없음

최신 plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는
목적이 명확하고 계약이 문서화된 작고 독립적인 module입니다.

번들 채널용 레거시 provider 편의 seam도 제거되었습니다. 예를 들어
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
채널 브랜드 helper seam, 그리고
`openclaw/plugin-sdk/telegram-core` 같은 import는 안정적인 plugin 계약이 아니라
비공개 mono-repo shortcut이었습니다. 대신 더 좁고 일반적인 SDK subpath를 사용하세요. 번들
plugin workspace 내부에서는 provider 소유 helper를 해당 plugin 자체의
`api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 provider 예시:

- Anthropic은 Claude 전용 stream helper를 자체 `api.ts` /
  `contract-api.ts` seam에 유지합니다
- OpenAI는 provider builder, 기본 model helper, realtime provider
  builder를 자체 `api.ts`에 유지합니다
- OpenRouter는 provider builder와 onboarding/config helper를 자체
  `api.ts`에 유지합니다

## 마이그레이션 방법

<Steps>
  <Step title="Windows wrapper fallback 동작 감사">
    plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용한다면, 이제 해결되지 않는 Windows
    `.cmd`/`.bat` wrapper는 `allowShellFallback: true`를 명시적으로 전달하지 않는 한
    닫힌 상태로 실패합니다.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 셸 매개 fallback을 의도적으로 허용하는 신뢰된 호환성 호출자에만
      // 이 값을 설정하세요.
      allowShellFallback: true,
    });
    ```

    호출자가 셸 fallback에 의도적으로 의존하지 않는다면
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하세요.

  </Step>

  <Step title="지원 중단된 import 찾기">
    plugin에서 지원 중단된 두 표면 중 하나에서 import하는 부분을 검색하세요:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="집중된 import로 교체">
    기존 표면의 각 export는 특정 최신 import 경로에 대응됩니다:

    ```typescript
    // Before (지원 중단된 하위 호환성 레이어)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (최신 집중형 import)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 helper의 경우 직접 import하는 대신 주입된 plugin runtime을 사용하세요:

    ```typescript
    // Before (지원 중단된 extension-api 브리지)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (주입된 runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    동일한 패턴이 다른 레거시 브리지 helper에도 적용됩니다:

    | 기존 import | 최신 대응 항목 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="빌드 및 테스트">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Import 경로 참조

<Accordion title="일반적인 import 경로 표">
  | Import 경로 | 용도 | 주요 export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 정식 plugin entry helper | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 entry 정의/builder용 레거시 umbrella 재export | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 config schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 provider entry helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 집중된 채널 entry 정의 및 builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공용 setup wizard helper | Allowlist prompt, setup status builder |
  | `plugin-sdk/setup-runtime` | setup 시점 runtime helper | import-safe setup patch adapter, lookup-note helper, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 account helper | account 목록/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`, account-id normalization |
  | `plugin-sdk/account-resolution` | account 조회 helper | account 조회 + default-fallback helper |
  | `plugin-sdk/account-helpers` | 좁은 account helper | account 목록/account-action helper |
  | `plugin-sdk/channel-setup` | setup wizard adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing 기본 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | reply prefix + typing 연결 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema builder | 채널 config schema type |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 config helper | 명령 이름 normalization, 설명 trim, 중복/충돌 validation |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | account 상태 추적 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | inbound envelope helper | 공용 route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | inbound reply helper | 공용 record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | 메시징 target 파싱 | target 파싱/매칭 helper |
  | `plugin-sdk/outbound-media` | outbound media helper | 공용 outbound media loading |
  | `plugin-sdk/outbound-runtime` | outbound runtime helper | outbound identity/send delegate helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding lifecycle 및 adapter helper |
  | `plugin-sdk/agent-media-payload` | 레거시 media payload helper | 레거시 field 레이아웃용 agent media payload builder |
  | `plugin-sdk/channel-runtime` | 지원 중단된 호환성 shim | 레거시 채널 runtime utility 전용 |
  | `plugin-sdk/channel-send-result` | send 결과 type | reply 결과 type |
  | `plugin-sdk/runtime-store` | 영구 plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 runtime helper | runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 좁은 runtime env helper | logger/runtime env, timeout, retry, backoff helper |
  | `plugin-sdk/plugin-runtime` | 공용 plugin runtime helper | plugin commands/hooks/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 공용 webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | lazy runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | process helper | 공용 exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | 명령 formatting, wait, version helper |
  | `plugin-sdk/gateway-runtime` | gateway helper | gateway client 및 channel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | config load/write helper |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 helper | 번들 Telegram 계약 표면을 사용할 수 없을 때의 fallback-stable Telegram 명령 validation helper |
  | `plugin-sdk/approval-runtime` | 승인 prompt helper | exec/plugin 승인 payload, 승인 capability/profile helper, native 승인 routing/runtime helper |
  | `plugin-sdk/approval-auth-runtime` | 승인 auth helper | approver 해석, same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | 승인 client helper | native exec 승인 profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 helper | native 승인 capability/delivery adapter |
  | `plugin-sdk/approval-native-runtime` | 승인 target helper | native 승인 target/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | 승인 reply helper | exec/plugin 승인 reply payload helper |
  | `plugin-sdk/security-runtime` | 보안 helper | 공용 trust, DM gating, external-content, secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 helper | host allowlist 및 private-network 정책 helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | pinned-dispatcher, guarded fetch, SSRF 정책 helper |
  | `plugin-sdk/collection-runtime` | bounded cache helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 gating helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 formatting helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/proxy helper | `resolveFetch`, proxy helper |
  | `plugin-sdk/host-runtime` | host normalization helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, 정책 runner |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 gating 및 command-surface helper | `resolveControlCommandGate`, sender-authorization helper, command registry helper |
  | `plugin-sdk/secret-input` | secret 입력 파싱 | secret 입력 helper |
  | `plugin-sdk/webhook-ingress` | webhook 요청 helper | webhook target utility |
  | `plugin-sdk/webhook-request-guards` | webhook body guard helper | 요청 body read/limit helper |
  | `plugin-sdk/reply-runtime` | 공용 reply runtime | inbound dispatch, heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 좁은 reply dispatch helper | finalize + provider dispatch helper |
  | `plugin-sdk/reply-history` | reply-history helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk helper | text/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | session store helper | 저장소 경로 + updated-at helper |
  | `plugin-sdk/state-paths` | state path helper | state 및 OAuth 디렉터리 helper |
  | `plugin-sdk/routing` | routing/session-key helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key normalization helper |
  | `plugin-sdk/status-helpers` | 채널 상태 helper | channel/account 상태 요약 builder, runtime-state 기본값, issue metadata helper |
  | `plugin-sdk/target-resolver-runtime` | target resolver helper | 공용 target resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 문자열 normalization helper | slug/string normalization helper |
  | `plugin-sdk/request-url` | 요청 URL helper | request 유사 입력에서 string URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 helper | normalized stdout/stderr를 포함한 시간 제한 명령 runner |
  | `plugin-sdk/param-readers` | param reader | 공용 tool/CLI param reader |
  | `plugin-sdk/tool-send` | tool send 추출 | tool args에서 정식 send target field 추출 |
  | `plugin-sdk/temp-path` | temp path helper | 공용 temp-download 경로 helper |
  | `plugin-sdk/logging-core` | logging helper | subsystem logger 및 redaction helper |
  | `plugin-sdk/markdown-table-runtime` | Markdown table helper | Markdown table mode helper |
  | `plugin-sdk/reply-payload` | 메시지 reply type | reply payload type |
  | `plugin-sdk/provider-setup` | 선별된 local/self-hosted provider setup helper | self-hosted provider discovery/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 집중된 OpenAI-compatible self-hosted provider setup helper | 동일한 self-hosted provider discovery/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth helper | runtime API-key 해석 helper |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup helper | API-key onboarding/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 표준 OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider interactive login helper | 공용 interactive login helper |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | provider auth env-var 조회 helper |
  | `plugin-sdk/provider-model-shared` | 공용 provider model/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공용 replay-policy builder, provider-endpoint helper, model-id normalization helper |
  | `plugin-sdk/provider-catalog-shared` | 공용 provider catalog helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider onboarding patch | onboarding config helper |
  | `plugin-sdk/provider-http` | provider HTTP helper | 일반 provider HTTP/endpoint capability helper |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch helper | web-fetch provider registration/cache helper |
  | `plugin-sdk/provider-web-search` | provider web-search helper | web-search provider registration/cache/config helper |
  | `plugin-sdk/provider-tools` | provider tool/schema compat helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema cleanup + diagnostics, 그리고 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI compat helper |
  | `plugin-sdk/provider-usage` | provider usage helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, 기타 provider usage helper |
  | `plugin-sdk/provider-stream` | provider stream wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper type, 그리고 공용 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
  | `plugin-sdk/keyed-async-queue` | 순서 보장 async queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공용 media helper | media fetch/transform/store helper 및 media payload builder |
  | `plugin-sdk/media-generation-runtime` | 공용 media-generation helper | image/video/music generation용 공용 failover helper, candidate 선택, missing-model 메시지 |
  | `plugin-sdk/media-understanding` | media-understanding helper | media understanding provider type 및 provider 대상 image/audio helper export |
  | `plugin-sdk/text-runtime` | 공용 text helper | assistant-visible-text 제거, markdown render/chunking/table helper, redaction helper, directive-tag helper, safe-text utility, 기타 관련 text/logging helper |
  | `plugin-sdk/text-chunking` | text chunking helper | outbound text chunking helper |
  | `plugin-sdk/speech` | speech helper | speech provider type 및 provider 대상 directive, registry, validation helper |
  | `plugin-sdk/speech-core` | 공용 speech core | speech provider type, registry, directive, normalization |
  | `plugin-sdk/realtime-transcription` | realtime transcription helper | provider type 및 registry helper |
  | `plugin-sdk/realtime-voice` | realtime voice helper | provider type 및 registry helper |
  | `plugin-sdk/image-generation-core` | 공용 image-generation core | image-generation type, failover, auth, registry helper |
  | `plugin-sdk/music-generation` | music-generation helper | music-generation provider/request/result type |
  | `plugin-sdk/music-generation-core` | 공용 music-generation core | music-generation type, failover helper, provider 조회, model-ref 파싱 |
  | `plugin-sdk/video-generation` | video-generation helper | video-generation provider/request/result type |
  | `plugin-sdk/video-generation-core` | 공용 video-generation core | video-generation type, failover helper, provider 조회, model-ref 파싱 |
  | `plugin-sdk/interactive-runtime` | interactive reply helper | interactive reply payload normalization/reduction |
  | `plugin-sdk/channel-config-primitives` | channel config 기본 요소 | 좁은 channel config-schema 기본 요소 |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | channel config-write authorization helper |
  | `plugin-sdk/channel-plugin-common` | 공용 channel prelude | 공용 channel plugin prelude export |
  | `plugin-sdk/channel-status` | channel 상태 helper | 공용 channel 상태 snapshot/summary helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist config helper | allowlist config edit/read helper |
  | `plugin-sdk/group-access` | group access helper | 공용 group-access 결정 helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 공용 direct-DM auth/guard helper |
  | `plugin-sdk/extension-shared` | 공용 extension helper | passive-channel/status helper 기본 요소 |
  | `plugin-sdk/webhook-targets` | webhook target helper | webhook target registry 및 route-install helper |
  | `plugin-sdk/webhook-path` | webhook path helper | webhook path normalization helper |
  | `plugin-sdk/web-media` | 공용 web media helper | remote/local media loading helper |
  | `plugin-sdk/zod` | Zod 재export | plugin SDK 소비자를 위한 `zod` 재export |
  | `plugin-sdk/memory-core` | 번들 memory-core helper | memory manager/config/file/CLI helper 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | memory engine runtime facade | memory index/search runtime facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation engine | memory host foundation engine export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding engine | memory host embedding engine export |
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
  | `plugin-sdk/memory-host-core` | memory host core runtime alias | memory host core runtime helper용 vendor-neutral alias |
  | `plugin-sdk/memory-host-events` | memory host event journal alias | memory host event journal helper용 vendor-neutral alias |
  | `plugin-sdk/memory-host-files` | memory host file/runtime alias | memory host file/runtime helper용 vendor-neutral alias |
  | `plugin-sdk/memory-host-markdown` | managed markdown helper | memory 인접 plugin용 공용 managed-markdown helper |
  | `plugin-sdk/memory-host-search` | 활성 memory 검색 facade | lazy active-memory search-manager runtime facade |
  | `plugin-sdk/memory-host-status` | memory host status alias | memory host status helper용 vendor-neutral alias |
  | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb helper | memory-lancedb helper 표면 |
  | `plugin-sdk/testing` | 테스트 utility | 테스트 helper 및 mock |
</Accordion>

이 표는 전체 SDK 표면이 아니라 의도적으로 일반적인 마이그레이션 하위 집합만 담고 있습니다.
전체 200개 이상의 entrypoint 목록은
`scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

그 목록에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 일부 번들 plugin helper seam이 포함되어 있습니다.
이들은 번들 plugin 유지 관리 및 호환성을 위해 계속 export되지만,
일반적인 마이그레이션 표에서는 의도적으로 제외되었고 새 plugin code에 권장되는 대상은 아닙니다.

같은 규칙은 다른 번들 helper 계열에도 적용됩니다. 예:

- browser support helper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` 같은
  번들 helper/plugin 표면

`plugin-sdk/github-copilot-token`은 현재 좁은 token-helper
표면인 `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 노출합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면
`src/plugin-sdk/`의 소스를 확인하거나 Discord에서 문의하세요.

## 제거 일정

| 시점 | 발생 사항 |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금** | 지원 중단된 표면이 런타임 경고를 출력함 |
| **다음 메이저 릴리스** | 지원 중단된 표면이 제거되며, 계속 사용 중인 plugin은 실패함 |

모든 core plugin은 이미 마이그레이션되었습니다. 외부 plugin은
다음 메이저 릴리스 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 environment variable을 설정하세요:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 영구적인 해결책이 아니라 일시적인 탈출구입니다.

## 관련 문서

- [Getting Started](/ko/plugins/building-plugins) — 첫 plugin 만들기
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 subpath import 참조
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 채널 plugin 만들기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider plugin 만들기
- [Plugin Internals](/ko/plugins/architecture) — 아키텍처 심층 설명
- [Plugin Manifest](/ko/plugins/manifest) — manifest schema 참조
