---
read_when:
    - 어떤 SDK 하위 경로에서 가져와야 하는지 알아야 할 때
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조가 필요할 때
    - 특정 SDK export를 찾고 있을 때
sidebarTitle: SDK Overview
summary: 가져오기 맵, 등록 API 참조, 그리고 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-04-06T06:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: acd2887ef52c66b2f234858d812bb04197ecd0bfb3e4f7bf3622f8fdc765acad
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK 개요

plugin SDK는 plugins와 core 사이의 타입이 지정된 계약입니다. 이 페이지는
**무엇을 import해야 하는지**와 **무엇을 등록할 수 있는지**에 대한 참조입니다.

<Tip>
  **사용 방법 가이드를 찾고 있나요?**
  - 첫 번째 plugin인가요? [시작하기](/ko/plugins/building-plugins)부터 시작하세요
  - Channel plugin인가요? [Channel Plugins](/ko/plugins/sdk-channel-plugins)를 참고하세요
  - Provider plugin인가요? [Provider Plugins](/ko/plugins/sdk-provider-plugins)를 참고하세요
</Tip>

## 가져오기 규칙

항상 특정 하위 경로에서 import하세요:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 하위 경로는 작고 독립적인 모듈입니다. 이렇게 하면 시작 속도를 빠르게
유지하고 순환 의존성 문제를 방지할 수 있습니다. channel별
entry/build helper의 경우 `openclaw/plugin-sdk/channel-core`를 우선 사용하고,
더 넓은 umbrella surface와 `buildChannelConfigSchema` 같은 공용 helper에는
`openclaw/plugin-sdk/core`를 사용하세요.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` 같은 provider 이름의
편의 seam이나 channel 브랜드 helper seam을 추가하거나 이에 의존하지 마세요.
Bundled plugins는 자체 `api.ts` 또는 `runtime-api.ts` barrel 안에서 일반적인
SDK 하위 경로를 조합해야 하며, core는 해당 필요가 실제로 channel 간 공통일 때만
그 plugin 로컬 barrel을 사용하거나 좁은 범위의 일반적인 SDK 계약을 추가해야 합니다.

생성된 export map에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 소수의
bundled-plugin helper seam이 포함되어 있습니다. 이러한 하위 경로는 bundled-plugin
유지 관리와 호환성만을 위해 존재하며, 아래의 일반 표에서는 의도적으로 제외되었고
새로운 third-party plugins에 권장되는 import 경로가 아닙니다.

## 하위 경로 참조

용도별로 그룹화한 가장 일반적으로 사용되는 하위 경로입니다. 200개가 넘는
하위 경로의 생성된 전체 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

예약된 bundled-plugin helper 하위 경로도 생성된 목록에는 계속 나타납니다.
문서 페이지에서 명시적으로 공개용으로 권장하지 않는 한, 이를 구현 세부 사항/호환성
surface로 취급하세요.

### Plugin entry

| Subpath                     | 주요 exports                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Channel 하위 경로">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공용 setup wizard helper, allowlist 프롬프트, setup 상태 builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 config/action-gate helper, 기본 계정 fallback helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 helper |
    | `plugin-sdk/account-resolution` | 계정 조회 + 기본 fallback helper |
    | `plugin-sdk/account-helpers` | 좁은 범위의 account-list/account-action helper |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel config 스키마 타입 |
    | `plugin-sdk/telegram-command-config` | bundled-contract fallback이 포함된 Telegram custom-command 정규화/검증 helper |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 공용 inbound route + envelope builder helper |
    | `plugin-sdk/inbound-reply-dispatch` | 공용 inbound record-and-dispatch helper |
    | `plugin-sdk/messaging-targets` | 대상 파싱/매칭 helper |
    | `plugin-sdk/outbound-media` | 공용 outbound media 로딩 helper |
    | `plugin-sdk/outbound-runtime` | outbound identity/send delegate helper |
    | `plugin-sdk/thread-bindings-runtime` | thread-binding 수명 주기 및 adapter helper |
    | `plugin-sdk/agent-media-payload` | 레거시 agent media payload builder |
    | `plugin-sdk/conversation-runtime` | conversation/thread binding, pairing, configured-binding helper |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 config 스냅샷 helper |
    | `plugin-sdk/runtime-group-policy` | 런타임 group-policy 해석 helper |
    | `plugin-sdk/channel-status` | 공용 channel 상태 스냅샷/요약 helper |
    | `plugin-sdk/channel-config-primitives` | 좁은 범위의 channel config-schema 기본 구성 요소 |
    | `plugin-sdk/channel-config-writes` | channel config-write 권한 부여 helper |
    | `plugin-sdk/channel-plugin-common` | 공용 channel plugin prelude export |
    | `plugin-sdk/allowlist-config-edit` | allowlist config 편집/읽기 helper |
    | `plugin-sdk/group-access` | 공용 group-access 결정 helper |
    | `plugin-sdk/direct-dm` | 공용 direct-DM auth/guard helper |
    | `plugin-sdk/interactive-runtime` | interactive reply payload 정규화/축소 helper |
    | `plugin-sdk/channel-inbound` | debounce, mention matching, envelope helper |
    | `plugin-sdk/channel-send-result` | reply 결과 타입 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | 대상 파싱/매칭 helper |
    | `plugin-sdk/channel-contract` | Channel 계약 타입 |
    | `plugin-sdk/channel-feedback` | feedback/reaction 연결 |
  </Accordion>

  <Accordion title="Provider 하위 경로">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 엄선된 local/self-hosted provider setup helper |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 self-hosted provider setup helper에 초점을 맞춘 경로 |
    | `plugin-sdk/provider-auth-runtime` | provider plugins용 런타임 API 키 해석 helper |
    | `plugin-sdk/provider-auth-api-key` | API 키 온보딩/profile-write helper |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth auth-result builder |
    | `plugin-sdk/provider-auth-login` | provider plugins용 공용 interactive login helper |
    | `plugin-sdk/provider-env-vars` | provider auth env-var 조회 helper |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공용 replay-policy builder, provider-endpoint helper, 그리고 `normalizeNativeXaiModelId` 같은 model-id 정규화 helper |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 일반적인 provider HTTP/endpoint capability helper |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider 등록/캐시 helper |
    | `plugin-sdk/provider-web-search` | web-search provider 등록/캐시/config helper |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, 그리고 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환 helper |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 및 유사 helper |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper 타입, 그리고 공용 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
    | `plugin-sdk/provider-onboard` | 온보딩 config patch helper |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache helper |
  </Accordion>

  <Accordion title="Auth 및 보안 하위 경로">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, command registry helper, sender-authorization helper |
    | `plugin-sdk/approval-auth-runtime` | approver 해석 및 same-chat action-auth helper |
    | `plugin-sdk/approval-client-runtime` | native exec approval profile/filter helper |
    | `plugin-sdk/approval-delivery-runtime` | native approval capability/delivery adapter |
    | `plugin-sdk/approval-native-runtime` | native approval target + account-binding helper |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin approval reply payload helper |
    | `plugin-sdk/command-auth-native` | native command auth + native session-target helper |
    | `plugin-sdk/command-detection` | 공용 command 감지 helper |
    | `plugin-sdk/command-surface` | command-body 정규화 및 command-surface helper |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | 공용 trust, DM gating, external-content, secret-collection helper |
    | `plugin-sdk/ssrf-policy` | host allowlist 및 private-network SSRF 정책 helper |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF-guarded fetch, SSRF 정책 helper |
    | `plugin-sdk/secret-input` | secret input 파싱 helper |
    | `plugin-sdk/webhook-ingress` | webhook request/target helper |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/timeout helper |
  </Accordion>

  <Accordion title="런타임 및 저장소 하위 경로">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/runtime` | 넓은 범위의 runtime/logging/backup/plugin-install helper |
    | `plugin-sdk/runtime-env` | 좁은 범위의 runtime env, logger, timeout, retry, backoff helper |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공용 plugin command/hook/http/interactive helper |
    | `plugin-sdk/hook-runtime` | 공용 webhook/internal hook pipeline helper |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 lazy runtime import/binding helper |
    | `plugin-sdk/process-runtime` | 프로세스 exec helper |
    | `plugin-sdk/cli-runtime` | CLI 서식, 대기, 버전 helper |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트 및 channel-status patch helper |
    | `plugin-sdk/config-runtime` | config 로드/쓰기 helper |
    | `plugin-sdk/telegram-command-config` | bundled Telegram 계약 surface를 사용할 수 없는 경우에도 Telegram command-name/description 정규화와 중복/충돌 검사 제공 |
    | `plugin-sdk/approval-runtime` | exec/plugin approval helper, approval-capability builder, auth/profile helper, native routing/runtime helper |
    | `plugin-sdk/reply-runtime` | 공용 inbound/reply runtime helper, chunking, dispatch, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 reply dispatch/finalize helper |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 공용 short-window reply-history helper |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 범위의 text/markdown chunking helper |
    | `plugin-sdk/session-store-runtime` | session store 경로 + updated-at helper |
    | `plugin-sdk/state-paths` | state/OAuth 디렉터리 경로 helper |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 route/session-key/account binding helper |
    | `plugin-sdk/status-helpers` | 공용 channel/account 상태 요약 helper, runtime-state 기본값, issue 메타데이터 helper |
    | `plugin-sdk/target-resolver-runtime` | 공용 target resolver helper |
    | `plugin-sdk/string-normalization-runtime` | slug/string 정규화 helper |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | 정규화된 stdout/stderr 결과를 제공하는 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공용 tool/CLI 파라미터 reader |
    | `plugin-sdk/tool-send` | tool 인수에서 표준 send target 필드 추출 |
    | `plugin-sdk/temp-path` | 공용 임시 다운로드 경로 helper |
    | `plugin-sdk/logging-core` | subsystem logger 및 redaction helper |
    | `plugin-sdk/markdown-table-runtime` | Markdown 테이블 모드 helper |
    | `plugin-sdk/json-store` | 작은 JSON 상태 읽기/쓰기 helper |
    | `plugin-sdk/file-lock` | 재진입 가능한 file-lock helper |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 dedupe 캐시 helper |
    | `plugin-sdk/acp-runtime` | ACP runtime/session 및 reply-dispatch helper |
    | `plugin-sdk/agent-config-primitives` | 좁은 범위의 agent runtime config-schema 기본 구성 요소 |
    | `plugin-sdk/boolean-param` | 느슨한 boolean 파라미터 reader |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 해석 helper |
    | `plugin-sdk/device-bootstrap` | 장치 부트스트랩 및 pairing token helper |
    | `plugin-sdk/extension-shared` | 공용 passive-channel 및 상태 helper 기본 구성 요소 |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply helper |
    | `plugin-sdk/skill-commands-runtime` | Skills command 목록 helper |
    | `plugin-sdk/native-command-registry` | native command registry/build/serialize helper |
    | `plugin-sdk/provider-zai-endpoint` | Z.A.I endpoint 감지 helper |
    | `plugin-sdk/infra-runtime` | 시스템 event/heartbeat helper |
    | `plugin-sdk/collection-runtime` | 작은 bounded cache helper |
    | `plugin-sdk/diagnostic-runtime` | diagnostic flag 및 event helper |
    | `plugin-sdk/error-runtime` | error graph, formatting, 공용 error 분류 helper, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | wrapped fetch, proxy, pinned lookup helper |
    | `plugin-sdk/host-runtime` | hostname 및 SCP host 정규화 helper |
    | `plugin-sdk/retry-runtime` | retry config 및 retry runner helper |
    | `plugin-sdk/agent-runtime` | agent 디렉터리/identity/workspace helper |
    | `plugin-sdk/directory-runtime` | config 기반 디렉터리 조회/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability 및 테스트 하위 경로">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | media payload builder를 포함한 공용 media fetch/transform/store helper |
    | `plugin-sdk/media-generation-runtime` | 공용 media-generation failover helper, candidate selection, missing-model 메시지 처리 |
    | `plugin-sdk/media-understanding` | media understanding provider 타입과 provider용 image/audio helper export |
    | `plugin-sdk/text-runtime` | assistant-visible-text 제거, markdown render/chunking/table helper, redaction helper, directive-tag helper, safe-text 유틸리티 등 공용 text/markdown/logging helper |
    | `plugin-sdk/text-chunking` | outbound text chunking helper |
    | `plugin-sdk/speech` | speech provider 타입과 provider용 directive, registry, validation helper |
    | `plugin-sdk/speech-core` | 공용 speech provider 타입, registry, directive, normalization helper |
    | `plugin-sdk/realtime-transcription` | realtime transcription provider 타입 및 registry helper |
    | `plugin-sdk/realtime-voice` | realtime voice provider 타입 및 registry helper |
    | `plugin-sdk/image-generation` | image generation provider 타입 |
    | `plugin-sdk/image-generation-core` | 공용 image-generation 타입, failover, auth, registry helper |
    | `plugin-sdk/music-generation` | music generation provider/request/result 타입 |
    | `plugin-sdk/music-generation-core` | 공용 music-generation 타입, failover helper, provider lookup, model-ref 파싱 |
    | `plugin-sdk/video-generation` | video generation provider/request/result 타입 |
    | `plugin-sdk/video-generation-core` | 공용 video-generation 타입, failover helper, provider lookup, model-ref 파싱 |
    | `plugin-sdk/webhook-targets` | webhook target registry 및 route-install helper |
    | `plugin-sdk/webhook-path` | webhook 경로 정규화 helper |
    | `plugin-sdk/web-media` | 공용 remote/local media 로딩 helper |
    | `plugin-sdk/zod` | plugin SDK 소비자를 위한 `zod` 재export |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory 하위 경로">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI helper용 bundled memory-core helper surface |
    | `plugin-sdk/memory-core-engine-runtime` | Memory index/search runtime facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding engine export |
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
    | `plugin-sdk/memory-host-core` | memory host core runtime helper의 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-events` | Memory host event journal helper의 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-files` | Memory host file/runtime helper의 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-markdown` | memory-adjacent plugins를 위한 공용 managed-markdown helper |
    | `plugin-sdk/memory-host-search` | search-manager 접근을 위한 active memory runtime facade |
    | `plugin-sdk/memory-host-status` | Memory host status helper의 vendor-neutral 별칭 |
    | `plugin-sdk/memory-lancedb` | bundled memory-lancedb helper surface |
  </Accordion>

  <Accordion title="예약된 bundled-helper 하위 경로">
    | Family | 현재 하위 경로 | 의도된 용도 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | bundled browser plugin 지원 helper (`browser-support`는 호환성 barrel로 유지됨) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | bundled Matrix helper/runtime surface |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | bundled LINE helper/runtime surface |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | bundled IRC helper surface |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | bundled channel 호환성/helper seam |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | bundled 기능/plugin helper seam; `plugin-sdk/github-copilot-token`은 현재 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 export함 |
  </Accordion>
</AccordionGroup>

## 등록 API

`register(api)` 콜백은 다음 메서드를 가진 `OpenClawPluginApi` 객체를 받습니다:

### Capability 등록

| Method                                           | 등록하는 항목                  |
| ------------------------------------------------ | ------------------------------ |
| `api.registerProvider(...)`                      | 텍스트 추론 (LLM)              |
| `api.registerChannel(...)`                       | 메시징 channel                 |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성    |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 realtime transcription |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 realtime voice 세션     |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/비디오 분석      |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성                    |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성                      |
| `api.registerVideoGenerationProvider(...)`       | 비디오 생성                    |
| `api.registerWebFetchProvider(...)`              | 웹 fetch / scrape provider     |
| `api.registerWebSearchProvider(...)`             | 웹 검색                        |

### Tools 및 commands

| Method                          | 등록하는 항목                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | agent tool (`required` 또는 `{ optional: true }`) |
| `api.registerCommand(def)`      | custom command (LLM 우회)                     |

### 인프라

| Method                                         | 등록하는 항목                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 이벤트 hook                           |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                    |
| `api.registerCli(registrar, opts?)`            | CLI 하위 명령                         |
| `api.registerService(service)`                 | 백그라운드 서비스                     |
| `api.registerInteractiveHandler(registration)` | interactive handler                   |
| `api.registerMemoryPromptSupplement(builder)`  | 추가형 memory 인접 프롬프트 섹션      |
| `api.registerMemoryCorpusSupplement(adapter)`  | 추가형 memory 검색/읽기 corpus        |

예약된 core admin 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`)는 plugin이 더 좁은 gateway method scope를 할당하려고 해도 항상
`operator.admin`으로 유지됩니다. plugin 소유 method에는 plugin별 접두사를
사용하는 것이 좋습니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 최상위 메타데이터를 받습니다:

- `commands`: registrar가 소유한 명시적 command 루트
- `descriptors`: 루트 CLI 도움말, 라우팅, lazy plugin CLI 등록에 사용되는 parse 시점 command descriptor

plugin command를 일반 루트 CLI 경로에서 lazy-loaded 상태로 유지하려면,
해당 registrar가 노출하는 모든 최상위 command 루트를 포괄하는 `descriptors`를
제공하세요.

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
        description: "Matrix 계정, verification, 장치, profile 상태 관리",
        hasSubcommands: true,
      },
    ],
  },
);
```

lazy 루트 CLI 등록이 필요하지 않을 때만 `commands`를 단독으로 사용하세요.
이 eager 호환성 경로는 계속 지원되지만, parse 시점 lazy loading을 위한
descriptor 기반 placeholder는 설치하지 않습니다.

### 독점 슬롯

| Method                                     | 등록하는 항목                           |
| ------------------------------------------ | --------------------------------------- |
| `api.registerContextEngine(id, factory)`   | context engine (한 번에 하나만 활성)    |
| `api.registerMemoryPromptSection(builder)` | memory prompt section builder           |
| `api.registerMemoryFlushPlan(resolver)`    | memory flush plan resolver              |
| `api.registerMemoryRuntime(runtime)`       | memory runtime adapter                  |

### Memory embedding adapter

| Method                                         | 등록하는 항목                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 plugin용 memory embedding adapter         |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, 그리고
  `registerMemoryRuntime`은 memory plugins 전용의 독점 항목입니다.
- `registerMemoryEmbeddingProvider`를 사용하면 활성 memory plugin이 하나 이상의
  embedding adapter id(예: `openai`, `gemini`, 또는 custom plugin-defined id)를
  등록할 수 있습니다.
- `agents.defaults.memorySearch.provider` 및
  `agents.defaults.memorySearch.fallback` 같은 사용자 config는 이렇게 등록된
  adapter id를 기준으로 해석됩니다.

### 이벤트 및 수명 주기

| Method                                       | 수행하는 작업              |
| -------------------------------------------- | -------------------------- |
| `api.on(hookName, handler, opts?)`           | 타입이 지정된 수명 주기 hook |
| `api.onConversationBindingResolved(handler)` | conversation binding 콜백  |

### Hook 결정 의미

- `before_tool_call`: `{ block: true }`를 반환하면 종료됩니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위의 handler는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 결정 없음으로 취급됩니다(`block`을 생략한 것과 동일). override가 아닙니다.
- `before_install`: `{ block: true }`를 반환하면 종료됩니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위의 handler는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 결정 없음으로 취급됩니다(`block`을 생략한 것과 동일). override가 아닙니다.
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 종료됩니다. 어떤 handler든 dispatch를 처리했다고 선언하면 더 낮은 우선순위의 handler와 기본 model dispatch 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 종료됩니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위의 handler는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 결정 없음으로 취급됩니다(`cancel`을 생략한 것과 동일). override가 아닙니다.

### API 객체 필드

| Field                    | Type                      | 설명                                                                                      |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                 |
| `api.name`               | `string`                  | 표시 이름                                                                                 |
| `api.version`            | `string?`                 | Plugin 버전(선택 사항)                                                                    |
| `api.description`        | `string?`                 | Plugin 설명(선택 사항)                                                                    |
| `api.source`             | `string`                  | Plugin 소스 경로                                                                          |
| `api.rootDir`            | `string?`                 | Plugin 루트 디렉터리(선택 사항)                                                           |
| `api.config`             | `OpenClawConfig`          | 현재 config 스냅샷(사용 가능하면 활성 메모리 내 runtime 스냅샷)                           |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 plugin 전용 config                                        |
| `api.runtime`            | `PluginRuntime`           | [런타임 helper](/ko/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 범위가 지정된 logger (`debug`, `info`, `warn`, `error`)                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드. `"setup-runtime"`은 전체 entry 이전의 경량 시작/setup 구간입니다          |
| `api.resolvePath(input)` | `(string) => string`      | plugin 루트를 기준으로 경로 해석                                                          |

## 내부 모듈 규칙

plugin 내부에서는 내부 import에 로컬 barrel 파일을 사용하세요:

```
my-plugin/
  api.ts            # 외부 소비자를 위한 공개 exports
  runtime-api.ts    # 내부 전용 runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # 경량 setup 전용 entry (선택 사항)
```

<Warning>
  프로덕션 코드에서 `openclaw/plugin-sdk/<your-plugin>`를 통해 자기 자신의 plugin을
  import하지 마세요. 내부 import는 `./api.ts` 또는 `./runtime-api.ts`를
  통해 처리하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

facade로 로드되는 bundled plugin 공개 surface(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 유사한 공개 entry 파일)는 이제 OpenClaw가 이미
실행 중이면 활성 runtime config 스냅샷을 우선 사용합니다. 아직 runtime 스냅샷이
없다면 디스크에서 해석된 config 파일로 fallback합니다.

Provider plugins는 helper가 의도적으로 provider 전용이고 아직 일반적인 SDK
하위 경로에 속하지 않는 경우, 좁은 범위의 plugin 로컬 계약 barrel을 노출할 수도
있습니다. 현재 bundled 예시: Anthropic provider는 Anthropic beta-header와
`service_tier` 로직을 일반적인 `plugin-sdk/*` 계약으로 승격하는 대신, 자체 공개
`api.ts` / `contract-api.ts` seam에 Claude stream helper를 유지합니다.

다른 현재 bundled 예시:

- `@openclaw/openai-provider`: `api.ts`는 provider builder,
  default-model helper, realtime provider builder를 export합니다
- `@openclaw/openrouter-provider`: `api.ts`는 provider builder와
  onboarding/config helper를 export합니다

<Warning>
  extension 프로덕션 코드도 `openclaw/plugin-sdk/<other-plugin>` import를 피해야
  합니다. helper가 정말 공용이라면 두 plugin을 결합하는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` 또는 다른
  capability 지향 surface 같은 중립적인 SDK 하위 경로로 승격하세요.
</Warning>

## 관련 항목

- [Entry Points](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry` 옵션
- [Runtime Helpers](/ko/plugins/sdk-runtime) — 전체 `api.runtime` 네임스페이스 참조
- [Setup and Config](/ko/plugins/sdk-setup) — 패키징, 매니페스트, config 스키마
- [Testing](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 lint 규칙
- [SDK Migration](/ko/plugins/sdk-migration) — deprecated surface에서 마이그레이션하기
- [Plugin Internals](/ko/plugins/architecture) — 심층 아키텍처 및 capability 모델
