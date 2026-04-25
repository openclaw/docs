---
read_when:
    - Plugin import에 적합한 plugin-sdk 서브패스 선택하기
    - 번들 Plugin 서브패스 및 helper 표면 감사하기
summary: 'Plugin SDK 서브패스 카탈로그: 어떤 import가 어디에 있는지, 영역별로 그룹화됨'
title: Plugin SDK 서브패스
x-i18n:
    generated_at: "2026-04-25T06:08:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff08a1f6801329cd9c20353e77983c3333a4237db9217d19a621b670c1b636f
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK는 `openclaw/plugin-sdk/` 아래의 좁은 서브패스 집합으로 노출됩니다.
  이 페이지는 일반적으로 사용되는 서브패스를 용도별로 그룹화해 정리합니다. 생성된
  전체 200개 이상의 서브패스 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있으며,
  예약된 번들 Plugin helper 서브패스도 সেখানে 나타나지만, 문서 페이지에서 명시적으로 권장하지 않는 한
  구현 세부 사항입니다.

  Plugin 작성 가이드는 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참고하세요.

  ## Plugin entry

  | 서브패스                    | 주요 export                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="채널 서브패스">
    | 서브패스 | 주요 export |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod schema export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공유 설정 마법사 헬퍼, 허용 목록 프롬프트, 설정 상태 빌더 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 config/작업 게이트 헬퍼, 기본 계정 대체 헬퍼 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 헬퍼 |
    | `plugin-sdk/account-resolution` | 계정 조회 + 기본 대체 헬퍼 |
    | `plugin-sdk/account-helpers` | 좁은 account-list/account-action 헬퍼 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 채널 config schema 타입 |
    | `plugin-sdk/telegram-command-config` | 번들 계약 대체값이 포함된 Telegram 사용자 지정 명령 정규화/검증 헬퍼 |
    | `plugin-sdk/command-gating` | 좁은 명령 권한 게이트 헬퍼 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, 초안 스트림 수명 주기/최종화 헬퍼 |
    | `plugin-sdk/inbound-envelope` | 공유 수신 라우트 + envelope 빌더 헬퍼 |
    | `plugin-sdk/inbound-reply-dispatch` | 공유 수신 기록 및 디스패치 헬퍼 |
    | `plugin-sdk/messaging-targets` | 대상 파싱/매칭 헬퍼 |
    | `plugin-sdk/outbound-media` | 공유 발신 미디어 로딩 헬퍼 |
    | `plugin-sdk/outbound-runtime` | 발신 전달, ID, send delegate, 세션, 포맷팅, payload 계획 헬퍼 |
    | `plugin-sdk/poll-runtime` | 좁은 poll 정규화 헬퍼 |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 어댑터 헬퍼 |
    | `plugin-sdk/agent-media-payload` | 레거시 에이전트 미디어 payload 빌더 |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, 페어링, 구성된 바인딩 헬퍼 |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 config 스냅샷 헬퍼 |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 해석 헬퍼 |
    | `plugin-sdk/channel-status` | 공유 채널 상태 스냅샷/요약 헬퍼 |
    | `plugin-sdk/channel-config-primitives` | 좁은 채널 config-schema 기본 요소 |
    | `plugin-sdk/channel-config-writes` | 채널 config 쓰기 권한 부여 헬퍼 |
    | `plugin-sdk/channel-plugin-common` | 공유 채널 Plugin 프렐류드 export |
    | `plugin-sdk/allowlist-config-edit` | 허용 목록 config 편집/읽기 헬퍼 |
    | `plugin-sdk/group-access` | 공유 그룹 액세스 결정 헬퍼 |
    | `plugin-sdk/direct-dm` | 공유 direct-DM 인증/가드 헬퍼 |
    | `plugin-sdk/interactive-runtime` | 의미 기반 메시지 표현, 전달, 레거시 대화형 답장 헬퍼. [메시지 표현](/ko/plugins/message-presentation) 참고 |
    | `plugin-sdk/channel-inbound` | 수신 디바운스, 멘션 매칭, 멘션 정책 헬퍼, envelope 헬퍼용 호환성 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 좁은 수신 디바운스 헬퍼 |
    | `plugin-sdk/channel-mention-gating` | 더 넓은 수신 런타임 표면 없이 사용하는 좁은 멘션 정책 및 멘션 텍스트 헬퍼 |
    | `plugin-sdk/channel-envelope` | 좁은 수신 envelope 포맷팅 헬퍼 |
    | `plugin-sdk/channel-location` | 채널 위치 컨텍스트 및 포맷팅 헬퍼 |
    | `plugin-sdk/channel-logging` | 수신 드롭 및 입력 중/ack 실패용 채널 로깅 헬퍼 |
    | `plugin-sdk/channel-send-result` | 답장 결과 타입 |
    | `plugin-sdk/channel-actions` | 채널 메시지 작업 헬퍼 및 Plugin 호환성을 위해 유지되는 deprecated native schema 헬퍼 |
    | `plugin-sdk/channel-targets` | 대상 파싱/매칭 헬퍼 |
    | `plugin-sdk/channel-contract` | 채널 계약 타입 |
    | `plugin-sdk/channel-feedback` | 피드백/반응 연결 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` 같은 좁은 secret 계약 헬퍼와 secret 대상 타입 |
  </Accordion>

  <Accordion title="공급자 서브패스">
    | 서브패스 | 주요 export |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 선별된 로컬/자체 호스팅 공급자 설정 헬퍼 |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 자체 호스팅 공급자에 집중한 설정 헬퍼 |
    | `plugin-sdk/cli-backend` | CLI 백엔드 기본값 + watchdog 상수 |
    | `plugin-sdk/provider-auth-runtime` | 공급자 Plugins용 런타임 API 키 해석 헬퍼 |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 온보딩/프로필 쓰기 헬퍼 |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth auth-result 빌더 |
    | `plugin-sdk/provider-auth-login` | 공급자 Plugins용 공유 대화형 로그인 헬퍼 |
    | `plugin-sdk/provider-env-vars` | 공급자 인증 env-var 조회 헬퍼 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 replay-policy 빌더, 공급자 엔드포인트 헬퍼, `normalizeNativeXaiModelId` 같은 모델 id 정규화 헬퍼 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 일반 공급자 HTTP/엔드포인트 capability 헬퍼, 공급자 HTTP 오류, 오디오 전사용 multipart form 헬퍼 |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig`, `WebFetchProviderPlugin` 같은 좁은 web-fetch config/선택 계약 헬퍼 |
    | `plugin-sdk/provider-web-fetch` | web-fetch 공급자 등록/캐시 헬퍼 |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 활성화 wiring이 필요 없는 공급자용 좁은 web-search config/자격 증명 헬퍼 |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 자격 증명 setter/getter 같은 좁은 web-search config/자격 증명 계약 헬퍼 |
    | `plugin-sdk/provider-web-search` | web-search 공급자 등록/캐시/런타임 헬퍼 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 정리 + 진단, `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환 헬퍼 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 등 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입, 공유 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 헬퍼 |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch, transport message transform, 쓰기 가능한 transport 이벤트 스트림 같은 기본 공급자 transport 헬퍼 |
    | `plugin-sdk/provider-onboard` | 온보딩 config 패치 헬퍼 |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache 헬퍼 |
    | `plugin-sdk/group-activation` | 좁은 그룹 활성화 모드 및 명령 파싱 헬퍼 |
  </Accordion>

  <Accordion title="인증 및 보안 서브패스">
    | 서브패스 | 주요 export |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 명령 레지스트리 헬퍼, 발신자 권한 부여 헬퍼 |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated`, `buildHelpMessage` 같은 명령/도움말 메시지 빌더 |
    | `plugin-sdk/approval-auth-runtime` | 승인자 해석 및 동일 채팅 action-auth 헬퍼 |
    | `plugin-sdk/approval-client-runtime` | 네이티브 exec 승인 프로필/필터 헬퍼 |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 capability/전달 어댑터 |
    | `plugin-sdk/approval-gateway-runtime` | 공유 승인 Gateway 해석 헬퍼 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 핫 채널 진입점을 위한 경량 네이티브 승인 어댑터 로딩 헬퍼 |
    | `plugin-sdk/approval-handler-runtime` | 더 넓은 승인 핸들러 런타임 헬퍼. 더 좁은 adapter/gateway seam으로 충분할 때는 그것을 우선 사용하세요 |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상 + 계정 바인딩 헬퍼 |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 승인 답장 payload 헬퍼 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 payload 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼, `formatApprovalDisplayPath` 같은 구조화된 승인 표시 헬퍼 |
    | `plugin-sdk/reply-dedupe` | 좁은 수신 답장 중복 제거 reset 헬퍼 |
    | `plugin-sdk/channel-contract-testing` | 넓은 테스트 barrel 없이 사용하는 좁은 채널 계약 테스트 헬퍼 |
    | `plugin-sdk/command-auth-native` | 네이티브 명령 인증 + 네이티브 세션 대상 헬퍼 |
    | `plugin-sdk/command-detection` | 공유 명령 감지 헬퍼 |
    | `plugin-sdk/command-primitives-runtime` | 핫 채널 경로를 위한 경량 명령 텍스트 predicate |
    | `plugin-sdk/command-surface` | 명령 본문 정규화 및 명령 표면 헬퍼 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 채널/Plugin secret 표면용 좁은 secret 계약 수집 헬퍼 |
    | `plugin-sdk/secret-ref-runtime` | secret 계약/config 파싱을 위한 좁은 `coerceSecretRef` 및 SecretRef 타이핑 헬퍼 |
    | `plugin-sdk/security-runtime` | 공유 신뢰, DM 게이팅, 외부 콘텐츠, secret 수집 헬퍼 |
    | `plugin-sdk/ssrf-policy` | 호스트 허용 목록 및 사설 네트워크 SSRF 정책 헬퍼 |
    | `plugin-sdk/ssrf-dispatcher` | 넓은 infra 런타임 표면 없이 사용하는 좁은 pinned-dispatcher 헬퍼 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF 보호 fetch, SSRF 정책 헬퍼 |
    | `plugin-sdk/secret-input` | secret 입력 파싱 헬퍼 |
    | `plugin-sdk/webhook-ingress` | Webhook 요청/대상 헬퍼 |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/타임아웃 헬퍼 |
  </Accordion>

  <Accordion title="런타임 및 저장소 서브패스">
    | 서브패스 | 주요 export |
    | --- | --- |
    | `plugin-sdk/runtime` | 넓은 런타임/로깅/백업/Plugin 설치 헬퍼 |
    | `plugin-sdk/runtime-env` | 좁은 런타임 env, 로거, 타임아웃, 재시도, 백오프 헬퍼 |
    | `plugin-sdk/channel-runtime-context` | 일반 채널 런타임 컨텍스트 등록 및 조회 헬퍼 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공유 Plugin 명령/훅/HTTP/대화형 헬퍼 |
    | `plugin-sdk/hook-runtime` | 공유 Webhook/내부 훅 파이프라인 헬퍼 |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 지연 런타임 import/바인딩 헬퍼 |
    | `plugin-sdk/process-runtime` | 프로세스 exec 헬퍼 |
    | `plugin-sdk/cli-runtime` | CLI 포맷팅, 대기, 버전 헬퍼 |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트 및 채널 상태 패치 헬퍼 |
    | `plugin-sdk/config-runtime` | config 로드/쓰기 헬퍼 및 Plugin config 조회 헬퍼 |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram 계약 표면을 사용할 수 없을 때도 동작하는 Telegram 명령 이름/설명 정규화 및 중복/충돌 검사 |
    | `plugin-sdk/text-autolink-runtime` | 넓은 text-runtime barrel 없이 사용하는 파일 참조 자동 링크 감지 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 헬퍼, 승인 capability 빌더, 인증/프로필 헬퍼, 네이티브 라우팅/런타임 헬퍼, 구조화된 승인 표시 경로 포맷팅 |
    | `plugin-sdk/reply-runtime` | 공유 수신/답장 런타임 헬퍼, 청크 분할, 디스패치, Heartbeat, 답장 플래너 |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 답장 디스패치/최종화 및 대화 레이블 헬퍼 |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 공유 짧은 창 답장 기록 헬퍼 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 텍스트/Markdown 청크 분할 헬퍼 |
    | `plugin-sdk/session-store-runtime` | 세션 저장소 경로 + updated-at 헬퍼 |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 헬퍼 |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 라우트/세션 키/계정 바인딩 헬퍼 |
    | `plugin-sdk/status-helpers` | 공유 채널/계정 상태 요약 헬퍼, 런타임 상태 기본값, 이슈 메타데이터 헬퍼 |
    | `plugin-sdk/target-resolver-runtime` | 공유 대상 해석 헬퍼 |
    | `plugin-sdk/string-normalization-runtime` | slug/string 정규화 헬퍼 |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | 정규화된 stdout/stderr 결과를 갖는 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공통 tool/CLI 매개변수 읽기 도구 |
    | `plugin-sdk/tool-payload` | 도구 결과 객체에서 정규화된 payload 추출 |
    | `plugin-sdk/tool-send` | 도구 인수에서 표준 send 대상 필드 추출 |
    | `plugin-sdk/temp-path` | 공유 임시 다운로드 경로 헬퍼 |
    | `plugin-sdk/logging-core` | 서브시스템 로거 및 redaction 헬퍼 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 테이블 모드 및 변환 헬퍼 |
    | `plugin-sdk/json-store` | 작은 JSON 상태 읽기/쓰기 헬퍼 |
    | `plugin-sdk/file-lock` | 재진입 가능한 파일 잠금 헬퍼 |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 중복 제거 캐시 헬퍼 |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 답장 디스패치 헬퍼 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 수명 주기 시작 import 없이 읽기 전용 ACP 바인딩 해석 |
    | `plugin-sdk/agent-config-primitives` | 좁은 에이전트 런타임 config-schema 기본 요소 |
    | `plugin-sdk/boolean-param` | 느슨한 boolean 매개변수 읽기 도구 |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 해석 헬퍼 |
    | `plugin-sdk/device-bootstrap` | 장치 bootstrap 및 페어링 토큰 헬퍼 |
    | `plugin-sdk/extension-shared` | 공유 passive-channel, 상태, ambient 프록시 helper 기본 요소 |
    | `plugin-sdk/models-provider-runtime` | `/models` 명령/공급자 답장 헬퍼 |
    | `plugin-sdk/skill-commands-runtime` | skill 명령 목록 헬퍼 |
    | `plugin-sdk/native-command-registry` | 네이티브 명령 레지스트리/빌드/직렬화 헬퍼 |
    | `plugin-sdk/agent-harness` | 저수준 에이전트 harness를 위한 실험적 신뢰 Plugin 표면: harness 타입, 활성 실행 steer/abort 헬퍼, OpenClaw 도구 브리지 헬퍼, 도구 진행 포맷팅/세부 헬퍼, 시도 결과 유틸리티 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 엔드포인트 감지 헬퍼 |
    | `plugin-sdk/infra-runtime` | 시스템 이벤트/Heartbeat 헬퍼 |
    | `plugin-sdk/collection-runtime` | 작은 제한 캐시 헬퍼 |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그 및 이벤트 헬퍼 |
    | `plugin-sdk/error-runtime` | 오류 그래프, 포맷팅, 공유 오류 분류 헬퍼, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, 프록시, pinned 조회 헬퍼 |
    | `plugin-sdk/runtime-fetch` | 프록시/guarded-fetch import 없이 dispatcher 인식 런타임 fetch |
    | `plugin-sdk/response-limit-runtime` | 넓은 media 런타임 표면 없이 사용하는 제한된 응답 본문 읽기 도구 |
    | `plugin-sdk/session-binding-runtime` | 구성된 바인딩 라우팅 또는 페어링 저장소 없이 현재 대화 바인딩 상태 |
    | `plugin-sdk/session-store-runtime` | 넓은 config 쓰기/유지보수 import 없이 사용하는 세션 저장소 읽기 헬퍼 |
    | `plugin-sdk/context-visibility-runtime` | 넓은 config/보안 import 없이 사용하는 컨텍스트 가시성 해석 및 보조 컨텍스트 필터링 |
    | `plugin-sdk/string-coerce-runtime` | Markdown/로깅 import 없이 사용하는 좁은 기본 레코드/문자열 강제 변환 및 정규화 헬퍼 |
    | `plugin-sdk/host-runtime` | 호스트명 및 SCP 호스트 정규화 헬퍼 |
    | `plugin-sdk/retry-runtime` | 재시도 config 및 재시도 실행기 헬퍼 |
    | `plugin-sdk/agent-runtime` | 에이전트 디렉터리/ID/작업공간 헬퍼 |
    | `plugin-sdk/directory-runtime` | config 기반 디렉터리 조회/중복 제거 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="capability 및 테스트 서브패스">
    | 서브패스 | 주요 export |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 공유 미디어 fetch/변환/저장 헬퍼 및 미디어 payload 빌더 |
    | `plugin-sdk/media-store` | `saveMediaBuffer` 같은 좁은 미디어 저장소 헬퍼 |
    | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 failover 헬퍼, 후보 선택, 누락된 모델 메시징 |
    | `plugin-sdk/media-understanding` | 미디어 이해 공급자 타입 및 공급자 측 이미지/오디오 헬퍼 export |
    | `plugin-sdk/text-runtime` | assistant 표시 텍스트 제거, Markdown 렌더링/청크 분할/테이블 헬퍼, redaction 헬퍼, directive-tag 헬퍼, 안전 텍스트 유틸리티 같은 공유 텍스트/Markdown/로깅 헬퍼 |
    | `plugin-sdk/text-chunking` | 발신 텍스트 청크 분할 헬퍼 |
    | `plugin-sdk/speech` | 음성 공급자 타입 및 공급자 측 directive, 레지스트리, 검증, 음성 헬퍼 export |
    | `plugin-sdk/speech-core` | 공유 음성 공급자 타입, 레지스트리, directive, 정규화, 음성 헬퍼 export |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 공급자 타입, 레지스트리 헬퍼, 공유 WebSocket 세션 헬퍼 |
    | `plugin-sdk/realtime-voice` | 실시간 음성 공급자 타입 및 레지스트리 헬퍼 |
    | `plugin-sdk/image-generation` | 이미지 생성 공급자 타입 |
    | `plugin-sdk/image-generation-core` | 공유 이미지 생성 타입, failover, 인증, 레지스트리 헬퍼 |
    | `plugin-sdk/music-generation` | 음악 생성 공급자/요청/결과 타입 |
    | `plugin-sdk/music-generation-core` | 공유 음악 생성 타입, failover 헬퍼, 공급자 조회, 모델 ref 파싱 |
    | `plugin-sdk/video-generation` | 비디오 생성 공급자/요청/결과 타입 |
    | `plugin-sdk/video-generation-core` | 공유 비디오 생성 타입, failover 헬퍼, 공급자 조회, 모델 ref 파싱 |
    | `plugin-sdk/webhook-targets` | Webhook 대상 레지스트리 및 라우트 설치 헬퍼 |
    | `plugin-sdk/webhook-path` | Webhook 경로 정규화 헬퍼 |
    | `plugin-sdk/web-media` | 공유 원격/로컬 미디어 로딩 헬퍼 |
    | `plugin-sdk/zod` | Plugin SDK 소비자를 위한 재export된 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="메모리 서브패스">
    | 서브패스 | 주요 export |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI 헬퍼를 위한 번들 memory-core helper 표면 |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 인덱스/검색 런타임 파사드 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation 엔진 export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 계약, 레지스트리 접근, 로컬 공급자, 일반 batch/원격 헬퍼 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 export |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 export |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret 헬퍼 |
    | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 헬퍼 |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 core 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 core 런타임 헬퍼의 공급자 중립 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 헬퍼의 공급자 중립 별칭 |
    | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 헬퍼의 공급자 중립 별칭 |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 Plugins용 공유 managed-markdown 헬퍼 |
    | `plugin-sdk/memory-host-search` | 검색 관리자 액세스를 위한 Active Memory 런타임 파사드 |
    | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 헬퍼의 공급자 중립 별칭 |
    | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb helper 표면 |
  </Accordion>

  <Accordion title="예약된 번들 helper 서브패스">
    | 계열 | 현재 서브패스 | 의도된 용도 |
    | --- | --- | --- |
    | 브라우저 | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 번들 브라우저 Plugin 지원 헬퍼. `browser-profiles`는 정규화된 `browser.tabCleanup` 형태를 위한 `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, `ResolvedBrowserTabCleanupConfig`를 export합니다. `browser-support`는 호환성 barrel로 유지됩니다. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 번들 Matrix helper/런타임 표면 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 번들 LINE helper/런타임 표면 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 번들 IRC helper 표면 |
    | 채널별 헬퍼 | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 번들 채널 호환성/helper seam |
    | 인증/Plugin 전용 헬퍼 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 번들 기능/Plugin helper seam. `plugin-sdk/github-copilot-token`은 현재 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 export합니다. |
  </Accordion>
</AccordionGroup>

## 관련 문서

- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 만들기](/ko/plugins/building-plugins)
