---
read_when:
    - Plugin 가져오기에 적합한 plugin-sdk 하위 경로 선택
    - 번들 Plugin 하위 경로 및 헬퍼 표면 감사
summary: 'Plugin SDK 하위 경로 카탈로그: 어떤 import가 어디에 있는지 영역별로 그룹화'
title: Plugin SDK 하위 경로
x-i18n:
    generated_at: "2026-07-01T20:15:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK는 `openclaw/plugin-sdk/` 아래의 좁은 공개 하위 경로 집합으로 노출됩니다. 이 페이지는 일반적으로 사용되는 하위 경로를 목적별로 묶어 정리합니다. 생성된 컴파일러 엔트리포인트 인벤토리는 `scripts/lib/plugin-sdk-entrypoints.json`에 있으며, 패키지 export는 `scripts/lib/plugin-sdk-private-local-only-subpaths.json`에 나열된 repo-local 테스트/내부 하위 경로를 제외한 공개 하위 집합입니다. Maintainer는 `pnpm plugin-sdk:surface`로 공개 export 수를 감사하고 `pnpm plugins:boundary-report:summary`로 활성 예약 helper 하위 경로를 감사할 수 있습니다. 사용되지 않는 예약 helper export는 휴면 호환성 부채로 공개 SDK에 남지 않고 CI 보고서에서 실패합니다.

Plugin 작성 가이드는 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참고하세요.

## Plugin entry

| 하위 경로                       | 주요 export                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` 같은 마이그레이션 provider 항목 helper, reason 상수, 항목 상태 marker, redaction helper, `summarizeMigrationItems`                               |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, `writeMigrationReport` 같은 런타임 마이그레이션 helper                                                    |
| `plugin-sdk/health`            | 번들 health consumer를 위한 Doctor health-check 등록, 감지, 복구, 선택, 심각도 및 finding 타입                                                                         |

### 폐기 예정 호환성 및 테스트 helper

폐기 예정 하위 경로는 이전 Plugin을 위해 계속 export되지만, 새 코드는 아래의 집중된 SDK 하위 경로를 사용해야 합니다. 유지 관리되는 목록은 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`입니다. CI는 번들 production import가 이 목록에서 가져오는 것을 거부합니다. `compat`, `config-types`, `infra-runtime`, `text-runtime`, `zod` 같은 broad barrel은 호환성 전용입니다. `zod`는 `zod`에서 직접 import하세요.

OpenClaw의 Vitest 기반 test-helper 하위 경로는 repo-local 전용이며 더 이상 패키지 export가 아닙니다: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`, `testing`.

### 예약된 번들 Plugin helper 하위 경로

이 하위 경로는 일반 SDK API가 아니라 해당 번들 Plugin이 소유하는 Plugin 소유 호환성 표면입니다: `plugin-sdk/codex-mcp-projection`, `plugin-sdk/codex-native-task-runtime`. 소유자가 다른 extension import는 패키지 계약 guardrail에 의해 차단됩니다.

  <AccordionGroup>
  <Accordion title="채널 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 내보내기(`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin 소유 스키마용 캐시된 JSON Schema 검증 헬퍼 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공유 설정 마법사 헬퍼, 설정 번역기, 허용 목록 프롬프트, 설정 상태 빌더 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 지원 중단된 호환성 별칭입니다. `plugin-sdk/setup-runtime`을 사용하세요. |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 config/action-gate 헬퍼, 기본 계정 폴백 헬퍼 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 헬퍼 |
    | `plugin-sdk/account-resolution` | 계정 조회 및 기본 폴백 헬퍼 |
    | `plugin-sdk/account-helpers` | 좁은 account-list/account-action 헬퍼 |
    | `plugin-sdk/access-groups` | 액세스 그룹 허용 목록 파싱 및 수정된 그룹 진단 헬퍼 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 공유 채널 config 스키마 프리미티브와 Zod 및 직접 JSON/TypeBox 빌더 |
    | `plugin-sdk/bundled-channel-config-schema` | 유지 관리되는 번들 Plugin 전용 번들 OpenClaw 채널 config 스키마 |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. 표준 번들/공식 채팅 채널 ID와, 자체 테이블을 하드코딩하지 않고 envelope 접두사가 붙은 텍스트를 인식해야 하는 Plugin용 포매터 레이블/별칭입니다. |
    | `plugin-sdk/channel-config-schema-legacy` | 번들 채널 config 스키마의 지원 중단된 호환성 별칭 |
    | `plugin-sdk/telegram-command-config` | 번들 계약 폴백이 포함된 Telegram 사용자 지정 명령 정규화/검증 헬퍼 |
    | `plugin-sdk/command-gating` | 좁은 명령 권한 부여 게이트 헬퍼 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 지원 중단된 저수준 채널 인그레스 호환성 파사드입니다. 새 수신 경로는 `plugin-sdk/channel-ingress-runtime`을 사용해야 합니다. |
    | `plugin-sdk/channel-ingress-runtime` | 마이그레이션된 채널 수신 경로를 위한 실험적 고수준 채널 인그레스 런타임 리졸버 및 라우트 팩트 빌더입니다. 각 Plugin에서 유효 허용 목록, 명령 허용 목록, 레거시 프로젝션을 조립하는 대신 이것을 선호하세요. [채널 인그레스 API](/ko/plugins/sdk-channel-ingress)를 참조하세요. |
    | `plugin-sdk/channel-lifecycle` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-outbound` | 메시지 수명 주기 계약과 응답 파이프라인 옵션, 영수증, 실시간 미리 보기/스트리밍, 수명 주기 헬퍼, 아웃바운드 ID, 페이로드 계획, 내구성 있는 전송, 메시지 전송 컨텍스트 헬퍼입니다. [채널 아웃바운드 API](/ko/plugins/sdk-channel-outbound)를 참조하세요. |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound`의 지원 중단된 호환성 별칭과 레거시 응답 디스패치 파사드입니다. |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound`의 지원 중단된 호환성 별칭과 레거시 응답 디스패치 파사드입니다. |
    | `plugin-sdk/inbound-envelope` | 공유 인바운드 라우트 및 envelope 빌더 헬퍼 |
    | `plugin-sdk/inbound-reply-dispatch` | 지원 중단된 호환성 파사드입니다. 인바운드 러너와 디스패치 조건자에는 `plugin-sdk/channel-inbound`를, 메시지 전달 헬퍼에는 `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/messaging-targets` | 지원 중단된 대상 파싱 별칭입니다. `plugin-sdk/channel-targets`를 사용하세요. |
    | `plugin-sdk/outbound-media` | 공유 아웃바운드 미디어 로딩 및 호스팅 미디어 상태 헬퍼 |
    | `plugin-sdk/outbound-send-deps` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/outbound-runtime` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/poll-runtime` | 좁은 설문 정규화 헬퍼 |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 어댑터 헬퍼 |
    | `plugin-sdk/agent-media-payload` | 레거시 에이전트 미디어 페이로드 빌더 |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, 페어링, 구성된 바인딩 헬퍼 |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 config 스냅샷 헬퍼 |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 해석 헬퍼 |
    | `plugin-sdk/channel-status` | 공유 채널 상태 스냅샷/요약 헬퍼 |
    | `plugin-sdk/channel-config-primitives` | 좁은 채널 config-schema 프리미티브 |
    | `plugin-sdk/channel-config-writes` | 채널 config 쓰기 권한 부여 헬퍼 |
    | `plugin-sdk/channel-plugin-common` | 공유 채널 Plugin 프렐류드 내보내기 |
    | `plugin-sdk/allowlist-config-edit` | 허용 목록 config 편집/읽기 헬퍼 |
    | `plugin-sdk/group-access` | 공유 그룹 액세스 결정 헬퍼 |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-inbound`를 사용하세요. |
    | `plugin-sdk/direct-dm-guard-policy` | 좁은 직접 DM pre-crypto 가드 정책 헬퍼 |
    | `plugin-sdk/discord` | 게시된 `@openclaw/discord@2026.3.13` 및 추적된 소유자 호환성을 위한 지원 중단된 Discord 호환성 파사드입니다. 새 Plugin은 일반 채널 SDK 하위 경로를 사용해야 합니다. |
    | `plugin-sdk/telegram-account` | 추적된 소유자 호환성을 위한 지원 중단된 Telegram 계정 해석 호환성 파사드입니다. 새 Plugin은 주입된 런타임 헬퍼 또는 일반 채널 SDK 하위 경로를 사용해야 합니다. |
    | `plugin-sdk/zalouser` | 아직 발신자 명령 권한 부여를 가져오는 게시된 Lark/Zalo 패키지를 위한 지원 중단된 Zalo Personal 호환성 파사드입니다. 새 Plugin은 `plugin-sdk/command-auth`를 사용해야 합니다. |
    | `plugin-sdk/interactive-runtime` | 의미론적 메시지 표현, 전달, 레거시 인터랙티브 응답 헬퍼입니다. [메시지 표현](/ko/plugins/message-presentation)을 참조하세요. |
    | `plugin-sdk/channel-inbound` | 이벤트 분류, 컨텍스트 빌드, 포매팅, 루트, 디바운스, 멘션 매칭, 멘션 정책, 인바운드 로깅을 위한 공유 인바운드 헬퍼 |
    | `plugin-sdk/channel-inbound-debounce` | 좁은 인바운드 디바운스 헬퍼 |
    | `plugin-sdk/channel-mention-gating` | 더 넓은 인바운드 런타임 표면 없이 제공되는 좁은 멘션 정책, 멘션 마커, 멘션 텍스트 헬퍼 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-inbound` 또는 `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-pairing-paths` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-pairing`을 사용하세요. |
    | `plugin-sdk/channel-reply-options-runtime` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-streaming` | 지원 중단된 호환성 파사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-send-result` | 응답 결과 타입 |
    | `plugin-sdk/channel-actions` | 채널 메시지 액션 헬퍼와 Plugin 호환성을 위해 유지되는 지원 중단된 네이티브 스키마 헬퍼 |
    | `plugin-sdk/channel-route` | 공유 라우트 정규화, 파서 기반 대상 해석, thread-id 문자열화, 중복 제거/압축 라우트 키, 파싱된 대상 타입, 라우트/대상 비교 헬퍼 |
    | `plugin-sdk/channel-targets` | 대상 파싱 헬퍼입니다. 라우트 비교 호출자는 `plugin-sdk/channel-route`를 사용해야 합니다. |
    | `plugin-sdk/channel-contract` | 채널 계약 타입 |
    | `plugin-sdk/channel-feedback` | 피드백/반응 연결 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` 같은 좁은 시크릿 계약 헬퍼와 시크릿 대상 타입 |
  </Accordion>

지원 중단된 채널 헬퍼 계열은 게시된 Plugin 호환성을 위해서만 계속 사용할 수 있습니다. 제거 계획은 다음과 같습니다. 외부 Plugin 마이그레이션 기간 동안 유지하고, repo/번들 Plugin은 `channel-inbound` 및 `channel-outbound`를 사용하도록 유지한 다음, 다음 주요 SDK 정리에서 호환성 하위 경로를 제거합니다. 이는 기존 채널 메시지/런타임, 채널 스트리밍, 직접 DM 액세스, 인바운드 헬퍼 분기, reply-options 및 pairing-path 계열에 적용됩니다.

  <Accordion title="제공자 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 설정, 카탈로그 검색, 런타임 모델 준비를 위한 지원되는 LM Studio 제공자 파사드 |
    | `plugin-sdk/lmstudio-runtime` | 로컬 서버 기본값, 모델 검색, 요청 헤더, 로드된 모델 헬퍼를 위한 지원되는 LM Studio 런타임 파사드 |
    | `plugin-sdk/provider-setup` | 선별된 로컬/셀프 호스팅 제공자 설정 헬퍼 |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 셀프 호스팅 제공자 설정에 집중한 헬퍼 |
    | `plugin-sdk/cli-backend` | CLI 백엔드 기본값 + 워치독 상수 |
    | `plugin-sdk/provider-auth-runtime` | 제공자 Plugin용 런타임 API 키 해석 헬퍼 |
    | `plugin-sdk/provider-oauth-runtime` | 범용 제공자 OAuth 콜백 타입, 콜백 페이지 렌더링, PKCE/상태 헬퍼, 권한 부여 입력 파싱, 토큰 만료 헬퍼, 중단 헬퍼 |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 온보딩/프로필 쓰기 헬퍼 |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth 인증 결과 빌더 |
    | `plugin-sdk/provider-env-vars` | 제공자 인증 환경 변수 조회 헬퍼 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex 인증 가져오기 헬퍼, 사용 중단된 `resolveOpenClawAgentDir` 호환성 내보내기 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 리플레이 정책 빌더, 제공자 엔드포인트 헬퍼, 공유 모델 ID 정규화 헬퍼 |
    | `plugin-sdk/provider-catalog-live-runtime` | 보호된 `/models` 스타일 검색을 위한 라이브 제공자 모델 카탈로그 헬퍼: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, 모델 ID 필터링, TTL 캐시, 정적 폴백 |
    | `plugin-sdk/provider-catalog-runtime` | 계약 테스트를 위한 제공자 카탈로그 보강 런타임 훅 및 Plugin 제공자 레지스트리 이음부 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 범용 제공자 HTTP/엔드포인트 기능 헬퍼, 제공자 HTTP 오류, 오디오 전사 multipart 양식 헬퍼 |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` 및 `WebFetchProviderPlugin` 같은 좁은 웹 fetch 구성/선택 계약 헬퍼 |
    | `plugin-sdk/provider-web-fetch` | 웹 fetch 제공자 등록/캐시 헬퍼 |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 활성화 배선이 필요 없는 제공자를 위한 좁은 웹 검색 구성/자격 증명 헬퍼 |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 자격 증명 설정자/조회자 같은 좁은 웹 검색 구성/자격 증명 계약 헬퍼 |
    | `plugin-sdk/provider-web-search` | 웹 검색 제공자 등록/캐시/런타임 헬퍼 |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, `listEmbeddingProviders(...)`를 포함한 일반 임베딩 제공자 타입과 읽기 헬퍼. manifest 소유권이 강제되도록 Plugin은 `api.registerEmbeddingProvider(...)`를 통해 제공자를 등록합니다 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, DeepSeek/Gemini/OpenAI 스키마 정리 + 진단 |
    | `plugin-sdk/provider-usage` | 제공자 사용량 스냅샷 타입, 공유 사용량 가져오기 헬퍼, `fetchClaudeUsage` 같은 제공자 가져오기 함수 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입, 일반 텍스트 도구 호출 호환성, 공유 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 헬퍼 |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, Anthropic/DeepSeek/OpenAI 호환 스트림 유틸리티를 포함한 공개 공유 제공자 스트림 래퍼 헬퍼 |
    | `plugin-sdk/provider-transport-runtime` | 보호된 fetch, 도구 결과 텍스트 추출, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 제공자 전송 헬퍼 |
    | `plugin-sdk/provider-onboard` | 온보딩 구성 패치 헬퍼 |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 싱글턴/맵/캐시 헬퍼 |
    | `plugin-sdk/group-activation` | 좁은 그룹 활성화 모드 및 명령 파싱 헬퍼 |
  </Accordion>

제공자 사용량 스냅샷은 일반적으로 하나 이상의 할당량 `windows`를 보고하며, 각 항목에는
레이블, 사용된 비율, 선택적 재설정 시간이 포함됩니다. 재설정 가능한 할당량 창 대신 잔액 또는
계정 상태 텍스트를 노출하는 제공자는 비율을 지어내지 말고 빈 `windows` 배열과 함께
`summary`를 반환해야 합니다.
OpenClaw는 상태 출력에 해당 요약 텍스트를 표시합니다. 사용량 엔드포인트가 실패했거나
사용 가능한 사용량 데이터를 반환하지 않은 경우에만 `error`를 사용하세요.

  <Accordion title="인증 및 보안 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 동적 인수 메뉴 형식을 포함한 명령 레지스트리 헬퍼, 발신자 권한 부여 헬퍼 |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` 및 `buildHelpMessage` 같은 명령/도움말 메시지 빌더 |
    | `plugin-sdk/approval-auth-runtime` | 승인자 해석 및 동일 채팅 작업 인증 헬퍼 |
    | `plugin-sdk/approval-client-runtime` | 네이티브 exec 승인 프로필/필터 헬퍼 |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 기능/전달 어댑터 |
    | `plugin-sdk/approval-gateway-runtime` | 공유 승인 Gateway 해석 헬퍼 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 핫 채널 진입점을 위한 가벼운 네이티브 승인 어댑터 로딩 헬퍼 |
    | `plugin-sdk/approval-handler-runtime` | 더 넓은 승인 핸들러 런타임 헬퍼. 충분한 경우 더 좁은 어댑터/Gateway 이음부를 선호하세요 |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상, 계정 바인딩, 라우트 게이트, 전달 폴백, 로컬 네이티브 exec 프롬프트 억제 헬퍼 |
    | `plugin-sdk/approval-reaction-runtime` | 하드코딩된 승인 리액션 바인딩, 리액션 프롬프트 페이로드, 리액션 대상 저장소, 로컬 네이티브 exec 프롬프트 억제를 위한 호환성 내보내기 |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 승인 응답 페이로드 헬퍼 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 페이로드 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼, `formatApprovalDisplayPath` 같은 구조화된 승인 표시 헬퍼 |
    | `plugin-sdk/reply-dedupe` | 좁은 인바운드 응답 중복 제거 재설정 헬퍼 |
    | `plugin-sdk/channel-contract-testing` | 넓은 테스트 배럴 없이 제공되는 좁은 채널 계약 테스트 헬퍼 |
    | `plugin-sdk/command-auth-native` | 네이티브 명령 인증, 동적 인수 메뉴 형식, 네이티브 세션 대상 헬퍼 |
    | `plugin-sdk/command-detection` | 공유 명령 감지 헬퍼 |
    | `plugin-sdk/command-primitives-runtime` | 핫 채널 경로를 위한 가벼운 명령 텍스트 조건자 |
    | `plugin-sdk/command-surface` | 명령 본문 정규화 및 명령 표면 헬퍼 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 비공개 채널 및 Web UI 디바이스 코드 페어링을 위한 지연 제공자 인증 로그인 흐름 헬퍼 |
    | `plugin-sdk/channel-secret-runtime` | 채널/Plugin 시크릿 표면을 위한 좁은 시크릿 계약 수집 헬퍼 |
    | `plugin-sdk/secret-ref-runtime` | 시크릿 계약/구성 파싱을 위한 좁은 `coerceSecretRef` 및 SecretRef 타이핑 헬퍼 |
    | `plugin-sdk/secret-provider-integration` | 외부 시크릿 제공자 프리셋을 게시하는 Plugin을 위한 타입 전용 SecretRef 제공자 통합 manifest 및 프리셋 계약 |
    | `plugin-sdk/security-runtime` | 공유 신뢰, DM 게이팅, 생성 전용 쓰기, 동기/비동기 원자적 파일 교체, 형제 임시 쓰기, 교차 디바이스 이동 폴백, 비공개 파일 저장소 헬퍼, 심볼릭 링크 부모 가드, 외부 콘텐츠, 민감 텍스트 삭제, 상수 시간 시크릿 비교, 시크릿 수집 헬퍼를 포함한 루트 경계 파일/경로 헬퍼 |
    | `plugin-sdk/ssrf-policy` | 호스트 허용 목록 및 비공개 네트워크 SSRF 정책 헬퍼 |
    | `plugin-sdk/ssrf-dispatcher` | 넓은 인프라 런타임 표면 없는 좁은 고정 디스패처 헬퍼 |
    | `plugin-sdk/ssrf-runtime` | 고정 디스패처, SSRF 보호 fetch, SSRF 오류, SSRF 정책 헬퍼 |
    | `plugin-sdk/secret-input` | 시크릿 입력 파싱 헬퍼 |
    | `plugin-sdk/webhook-ingress` | Webhook 요청/대상 헬퍼 및 원시 websocket/본문 강제 변환 |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/시간 제한 헬퍼 |
  </Accordion>

  <Accordion title="런타임 및 스토리지 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/runtime` | 광범위한 런타임/로깅/백업/Plugin 설치 도우미 |
    | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 환경, 로거, 타임아웃, 재시도 및 백오프 도우미 |
    | `plugin-sdk/browser-config` | 정규화된 프로필/기본값, CDP URL 파싱, 브라우저 제어 인증 도우미를 위한 지원되는 브라우저 구성 퍼사드 |
    | `plugin-sdk/agent-harness-task-runtime` | 호스트가 발급한 작업 범위를 사용하는 하네스 기반 에이전트를 위한 일반 작업 수명 주기 및 완료 전달 도우미 |
    | `plugin-sdk/codex-mcp-projection` | 사용자 MCP 서버 구성을 Codex 스레드 구성으로 투영하기 위한 예약된 번들 Codex 도우미; 타사 Plugin용이 아님 |
    | `plugin-sdk/codex-native-task-runtime` | 네이티브 작업 미러/런타임 배선을 위한 비공개 번들 Codex 도우미; 타사 Plugin용이 아님 |
    | `plugin-sdk/channel-runtime-context` | 일반 채널 런타임 컨텍스트 등록 및 조회 도우미 |
    | `plugin-sdk/matrix` | 이전 타사 채널 패키지를 위한 사용 중단된 Matrix 호환성 퍼사드; 새 Plugin은 `plugin-sdk/run-command`를 직접 가져와야 함 |
    | `plugin-sdk/mattermost` | 이전 타사 채널 패키지를 위한 사용 중단된 Mattermost 호환성 퍼사드; 새 Plugin은 일반 SDK 하위 경로를 직접 가져와야 함 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공유 Plugin 명령/훅/http/대화형 도우미 |
    | `plugin-sdk/hook-runtime` | 공유 Webhook/내부 훅 파이프라인 도우미 |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 지연 런타임 가져오기/바인딩 도우미 |
    | `plugin-sdk/process-runtime` | 프로세스 실행 도우미 |
    | `plugin-sdk/cli-runtime` | CLI 서식 지정, 대기, 버전, 인수 호출, 지연 명령 그룹 도우미 |
    | `plugin-sdk/qa-live-transport-scenarios` | 공유 라이브 전송 QA 시나리오 ID, 기준 적용 범위 도우미, 시나리오 선택 도우미 |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]`를 선언하는 Plugin HTTP 라우트를 위한 예약된 Gateway 메서드 디스패치 도우미 |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트, 이벤트 루프 준비 완료 클라이언트 시작 도우미, Gateway CLI RPC, Gateway 프로토콜 오류, 광고된 LAN 호스트 확인, 채널 상태 패치 도우미 |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` 및 채널/제공자 구성 타입 같은 Plugin 구성 형태를 위한 집중된 타입 전용 구성 표면 |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject`, `resolveLivePluginConfigObject` 같은 런타임 Plugin 구성 조회 도우미 |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile`, `logConfigUpdated` 같은 트랜잭션 구성 변경 도우미 |
    | `plugin-sdk/message-tool-delivery-hints` | 공유 메시지 도구 전달 메타데이터 힌트 문자열 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot`, 테스트 스냅샷 설정자 같은 현재 프로세스 구성 스냅샷 도우미 |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram 계약 표면을 사용할 수 없는 경우에도 Telegram 명령 이름/설명 정규화 및 중복/충돌 검사 |
    | `plugin-sdk/text-autolink-runtime` | 광범위한 텍스트 배럴 없이 파일 참조 자동 링크 감지 |
    | `plugin-sdk/approval-reaction-runtime` | 하드코딩된 승인 반응 바인딩, 반응 프롬프트 페이로드, 반응 대상 저장소, 로컬 네이티브 실행 프롬프트 억제를 위한 호환성 내보내기 |
    | `plugin-sdk/approval-runtime` | 실행/Plugin 승인 도우미, 승인 기능 빌더, 인증/프로필 도우미, 네이티브 라우팅/런타임 도우미, 구조화된 승인 표시 경로 서식 지정 |
    | `plugin-sdk/reply-runtime` | 공유 인바운드/답장 런타임 도우미, 청크 분할, 디스패치, Heartbeat, 답장 플래너 |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 답장 디스패치/완료 및 대화 레이블 도우미 |
    | `plugin-sdk/reply-history` | 공유 짧은 기간 답장 기록 도우미. 새 메시지 턴 코드는 `createChannelHistoryWindow`를 사용해야 하며, 더 낮은 수준의 맵 도우미는 사용 중단된 호환성 내보내기로만 남음 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 범위의 텍스트/마크다운 청크 분할 도우미 |
    | `plugin-sdk/session-store-runtime` | 세션 워크플로 도우미(`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), 세션 ID별 제한된 최근 사용자/어시스턴트 트랜스크립트 텍스트 읽기, 레거시 세션 저장소 경로/세션 키 도우미, 업데이트 시각 읽기, 전환 전용 전체 저장소/파일 경로 호환성 도우미 |
    | `plugin-sdk/session-transcript-runtime` | 트랜스크립트 ID, 범위 지정 대상/읽기/쓰기 도우미, 업데이트 게시, 쓰기 잠금, 트랜스크립트 메모리 적중 키 |
    | `plugin-sdk/sqlite-runtime` | 퍼스트 파티 런타임을 위한 집중된 SQLite 에이전트 스키마, 경로, 트랜잭션 도우미 |
    | `plugin-sdk/cron-store-runtime` | Cron 저장소 경로/로드/저장 도우미 |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 도우미 |
    | `plugin-sdk/plugin-state-runtime` | Plugin 소유 데이터베이스를 위한 Plugin 사이드카 SQLite 키 지정 상태 타입 및 중앙 집중식 연결 pragma와 WAL 유지 관리 설정 |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 라우트/세션 키/계정 바인딩 도우미 |
    | `plugin-sdk/status-helpers` | 공유 채널/계정 상태 요약 도우미, 런타임 상태 기본값, 이슈 메타데이터 도우미 |
    | `plugin-sdk/target-resolver-runtime` | 공유 대상 확인자 도우미 |
    | `plugin-sdk/string-normalization-runtime` | 슬러그/문자열 정규화 도우미 |
    | `plugin-sdk/request-url` | fetch/요청 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | 정규화된 stdout/stderr 결과를 제공하는 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공통 도구/CLI 매개변수 읽기 도우미 |
    | `plugin-sdk/tool-plugin` | 단순한 타입 지정 에이전트 도구 Plugin을 정의하고 매니페스트 생성을 위한 정적 메타데이터 노출 |
    | `plugin-sdk/tool-payload` | 도구 결과 객체에서 정규화된 페이로드 추출 |
    | `plugin-sdk/tool-send` | 도구 인수에서 표준 전송 대상 필드 추출 |
    | `plugin-sdk/sandbox` | 빠른 실패 실행 명령 사전 검사를 포함한 샌드박스 백엔드 타입 및 SSH/OpenShell 명령 도우미 |
    | `plugin-sdk/temp-path` | 공유 임시 다운로드 경로 도우미 및 비공개 보안 임시 작업 공간 |
    | `plugin-sdk/logging-core` | 하위 시스템 로거 및 수정 도우미 |
    | `plugin-sdk/markdown-table-runtime` | 마크다운 테이블 모드 및 변환 도우미 |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`, `resolveAgentMaxConcurrent` 같은 모델/세션 재정의 도우미 |
    | `plugin-sdk/talk-config-runtime` | Talk 제공자 구성 확인 도우미 |
    | `plugin-sdk/json-store` | 작은 JSON 상태 읽기/쓰기 도우미 |
    | `plugin-sdk/json-unsafe-integers` | 안전하지 않은 정수 리터럴을 문자열로 보존하는 JSON 파싱 도우미 |
    | `plugin-sdk/file-lock` | 재진입 파일 잠금 도우미 |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 중복 제거 캐시 도우미 |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 답장 디스패치 도우미 |
    | `plugin-sdk/acp-runtime-backend` | 시작 시 로드되는 Plugin을 위한 경량 ACP 백엔드 등록 및 답장 디스패치 도우미 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 수명 주기 시작 가져오기 없이 읽기 전용 ACP 바인딩 확인 |
    | `plugin-sdk/agent-config-primitives` | 좁은 범위의 에이전트 런타임 구성 스키마 기본 요소 |
    | `plugin-sdk/boolean-param` | 느슨한 불리언 매개변수 읽기 도우미 |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 확인 도우미 |
    | `plugin-sdk/device-bootstrap` | 기기 부트스트랩 및 페어링 토큰 도우미 |
    | `plugin-sdk/extension-shared` | 공유 수동 채널, 상태, 주변 프록시 도우미 기본 요소 |
    | `plugin-sdk/models-provider-runtime` | `/models` 명령/제공자 답장 도우미 |
    | `plugin-sdk/skill-commands-runtime` | Skill 명령 목록 도우미 |
    | `plugin-sdk/native-command-registry` | 네이티브 명령 레지스트리/빌드/직렬화 도우미 |
    | `plugin-sdk/agent-harness` | 저수준 에이전트 하네스를 위한 실험적 신뢰 Plugin 표면: 하네스 타입, 활성 실행 조정/중단 도우미, OpenClaw 도구 브리지 도우미, 런타임 계획 도구 정책 도우미, 터미널 결과 분류, 도구 진행률 서식 지정/세부 정보 도우미, 시도 결과 유틸리티 |
    | `plugin-sdk/provider-zai-endpoint` | 사용 중단된 Z.AI 제공자 소유 엔드포인트 감지 퍼사드; Z.AI Plugin 공개 API 사용 |
    | `plugin-sdk/async-lock-runtime` | 작은 런타임 상태 파일을 위한 프로세스 로컬 비동기 잠금 도우미 |
    | `plugin-sdk/channel-activity-runtime` | 채널 활동 텔레메트리 도우미 |
    | `plugin-sdk/concurrency-runtime` | 제한된 비동기 작업 동시성 도우미 |
    | `plugin-sdk/dedupe-runtime` | 인메모리 중복 제거 캐시 도우미 |
    | `plugin-sdk/delivery-queue-runtime` | 아웃바운드 보류 전달 드레인 도우미 |
    | `plugin-sdk/file-access-runtime` | 안전한 로컬 파일 및 미디어 소스 경로 도우미 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 깨우기, 이벤트, 가시성 도우미 |
    | `plugin-sdk/number-runtime` | 숫자 강제 변환 도우미 |
    | `plugin-sdk/secure-random-runtime` | 보안 토큰/UUID 도우미 |
    | `plugin-sdk/system-event-runtime` | 시스템 이벤트 큐 도우미 |
    | `plugin-sdk/transport-ready-runtime` | 전송 준비 상태 대기 도우미 |
    | `plugin-sdk/exec-approvals-runtime` | 광범위한 인프라 런타임 배럴 없이 실행 승인 정책 파일 도우미 |
    | `plugin-sdk/infra-runtime` | 사용 중단된 호환성 shim; 위의 집중된 런타임 하위 경로 사용 |
    | `plugin-sdk/collection-runtime` | 작은 제한 캐시 도우미 |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그, 이벤트, 추적 컨텍스트 도우미 |
    | `plugin-sdk/error-runtime` | 오류 그래프, 서식 지정, 공유 오류 분류 도우미, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, 프록시, EnvHttpProxyAgent 옵션, 고정 조회 도우미 |
    | `plugin-sdk/runtime-fetch` | 프록시/보호된 fetch 가져오기 없는 디스패처 인식 런타임 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 광범위한 미디어 런타임 표면 없이 인라인 이미지 데이터 URL 새니타이저 및 시그니처 스니핑 도우미 |
    | `plugin-sdk/response-limit-runtime` | 광범위한 미디어 런타임 표면 없는 제한된 응답 본문 읽기 도우미 |
    | `plugin-sdk/session-binding-runtime` | 구성된 바인딩 라우팅 또는 페어링 저장소 없는 현재 대화 바인딩 상태 |
    | `plugin-sdk/session-store-runtime` | 광범위한 구성 쓰기/유지 관리 가져오기 없는 세션 저장소 도우미 |
    | `plugin-sdk/sqlite-runtime` | 데이터베이스 수명 주기 제어 없는 집중된 SQLite 에이전트 스키마, 경로, 트랜잭션 도우미 |
    | `plugin-sdk/context-visibility-runtime` | 광범위한 구성/보안 가져오기 없는 컨텍스트 가시성 확인 및 보충 컨텍스트 필터링 |
    | `plugin-sdk/string-coerce-runtime` | 마크다운/로깅 가져오기 없는 좁은 범위의 기본 레코드/문자열 강제 변환 및 정규화 도우미 |
    | `plugin-sdk/host-runtime` | 호스트 이름 및 SCP 호스트 정규화 도우미 |
    | `plugin-sdk/retry-runtime` | 재시도 구성 및 재시도 실행기 도우미 |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir`, 사용 중단된 `resolveOpenClawAgentDir` 호환성 내보내기를 포함한 에이전트 디렉터리/ID/작업 공간 도우미 |
    | `plugin-sdk/directory-runtime` | 구성 기반 디렉터리 쿼리/중복 제거 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="기능 및 테스트 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, 더 이상 사용되지 않는 `fetchRemoteMedia`를 포함한 공유 미디어 가져오기/변환/저장 헬퍼. URL을 OpenClaw 미디어로 만들어야 할 때는 버퍼 읽기보다 저장소 헬퍼를 우선 사용하세요. |
    | `plugin-sdk/media-mime` | 좁은 MIME 정규화, 파일 확장자 매핑, MIME 감지, 미디어 종류 헬퍼 |
    | `plugin-sdk/media-store` | `saveMediaBuffer` 및 `saveMediaStream` 같은 좁은 미디어 저장소 헬퍼 |
    | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 페일오버 헬퍼, 후보 선택, 누락된 모델 메시징 |
    | `plugin-sdk/media-understanding` | 미디어 이해 제공자 타입과 제공자용 이미지/오디오/구조화 추출 헬퍼 내보내기 |
    | `plugin-sdk/text-chunking` | 텍스트 및 Markdown 청킹/렌더링 헬퍼, Markdown 표 변환, 지시문 태그 제거, 안전한 텍스트 유틸리티 |
    | `plugin-sdk/text-chunking` | 아웃바운드 텍스트 청킹 헬퍼 |
    | `plugin-sdk/speech` | 음성 제공자 타입과 제공자용 지시문, 레지스트리, 검증, OpenAI 호환 TTS 빌더, 음성 헬퍼 내보내기 |
    | `plugin-sdk/speech-core` | 공유 음성 제공자 타입, 레지스트리, 지시문, 정규화, 음성 헬퍼 내보내기 |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 제공자 타입, 레지스트리 헬퍼, 공유 WebSocket 세션 헬퍼 |
    | `plugin-sdk/realtime-bootstrap-context` | 제한된 `IDENTITY.md`, `USER.md`, `SOUL.md` 컨텍스트 주입을 위한 실시간 프로필 부트스트랩 헬퍼 |
    | `plugin-sdk/realtime-voice` | 실시간 음성 제공자 타입, 레지스트리 헬퍼, 출력 활동 추적을 포함한 공유 실시간 음성 동작 헬퍼 |
    | `plugin-sdk/image-generation` | 이미지 생성 제공자 타입과 이미지 자산/데이터 URL 헬퍼, OpenAI 호환 이미지 제공자 빌더 |
    | `plugin-sdk/image-generation-core` | 공유 이미지 생성 타입, 페일오버, 인증, 레지스트리 헬퍼 |
    | `plugin-sdk/music-generation` | 음악 생성 제공자/요청/결과 타입 |
    | `plugin-sdk/music-generation-core` | 공유 음악 생성 타입, 페일오버 헬퍼, 제공자 조회, 모델 참조 파싱 |
    | `plugin-sdk/video-generation` | 동영상 생성 제공자/요청/결과 타입 |
    | `plugin-sdk/video-generation-core` | 공유 동영상 생성 타입, 페일오버 헬퍼, 제공자 조회, 모델 참조 파싱 |
    | `plugin-sdk/transcripts` | 공유 transcript 소스 제공자 타입, 레지스트리 헬퍼, 세션 설명자, 발화 메타데이터 |
    | `plugin-sdk/webhook-targets` | Webhook 대상 레지스트리 및 라우트 설치 헬퍼 |
    | `plugin-sdk/webhook-path` | 더 이상 사용되지 않는 호환성 별칭입니다. `plugin-sdk/webhook-ingress`를 사용하세요. |
    | `plugin-sdk/web-media` | 공유 원격/로컬 미디어 로딩 헬퍼 |
    | `plugin-sdk/zod` | 더 이상 사용되지 않는 호환성 재내보내기입니다. `zod`에서 `zod`를 직접 가져오세요. |
    | `plugin-sdk/testing` | 기존 OpenClaw 테스트를 위한 리포지토리 로컬의 더 이상 사용되지 않는 호환성 배럴입니다. 새 리포지토리 테스트는 대신 `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures` 같은 집중된 로컬 테스트 하위 경로를 가져와야 합니다. |
    | `plugin-sdk/plugin-test-api` | 리포지토리 테스트 헬퍼 브리지를 가져오지 않고 직접 Plugin 등록 단위 테스트를 수행하기 위한 리포지토리 로컬의 최소 `createTestPluginApi` 헬퍼 |
    | `plugin-sdk/agent-runtime-test-contracts` | 인증, 전달, 폴백, 도구 훅, 프롬프트 오버레이, 스키마, transcript 프로젝션 테스트를 위한 리포지토리 로컬 네이티브 에이전트 런타임 어댑터 계약 fixture |
    | `plugin-sdk/channel-test-helpers` | 일반 액션/설정/상태 계약, 디렉터리 assertion, 계정 시작 생명주기, 전송 구성 스레딩, 런타임 mock, 상태 이슈, 아웃바운드 전달, 훅 등록을 위한 리포지토리 로컬 채널 중심 테스트 헬퍼 |
    | `plugin-sdk/channel-target-testing` | 채널 테스트를 위한 리포지토리 로컬 공유 대상 해석 오류 사례 suite |
    | `plugin-sdk/plugin-test-contracts` | 리포지토리 로컬 Plugin 패키지, 등록, 공개 아티팩트, 직접 가져오기, 런타임 API, 가져오기 부작용 계약 헬퍼 |
    | `plugin-sdk/provider-test-contracts` | 리포지토리 로컬 제공자 런타임, 인증, 발견, 온보딩, 카탈로그, 마법사, 미디어 기능, 리플레이 정책, 실시간 STT 라이브 오디오, 웹 검색/가져오기, 스트림 계약 헬퍼 |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http`를 실행하는 제공자 테스트를 위한 리포지토리 로컬 옵트인 Vitest HTTP/인증 mock |
    | `plugin-sdk/test-fixtures` | 리포지토리 로컬의 일반 CLI 런타임 캡처, 샌드박스 컨텍스트, skill 작성기, 에이전트 메시지, 시스템 이벤트, 모듈 재로드, 번들된 Plugin 경로, 터미널 텍스트, 청킹, 인증 토큰, 타입 지정 사례 fixture |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` 팩토리 내부에서 사용하기 위한 리포지토리 로컬의 집중된 Node 내장 mock 헬퍼 |
  </Accordion>

  <Accordion title="메모리 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 관리자/구성/파일/CLI 헬퍼를 위한 번들된 memory-core 헬퍼 표면 |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 인덱스/검색 런타임 파사드 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 경량 메모리 임베딩 제공자 레지스트리 헬퍼 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 파운데이션 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 계약, 레지스트리 접근, 로컬 제공자, 일반 배치/원격 헬퍼. 이 표면의 `registerMemoryEmbeddingProvider`는 더 이상 사용되지 않습니다. 새 제공자에는 일반 임베딩 제공자 API를 사용하세요. |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret 헬퍼 |
    | `plugin-sdk/memory-core-host-events` | 더 이상 사용되지 않는 호환성 별칭입니다. `plugin-sdk/memory-host-events`를 사용하세요. |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 헬퍼를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 헬퍼를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-host-files` | 더 이상 사용되지 않는 호환성 별칭입니다. `plugin-sdk/memory-core-host-runtime-files`를 사용하세요. |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 Plugin을 위한 공유 관리형 Markdown 헬퍼 |
    | `plugin-sdk/memory-host-search` | 검색 관리자 접근을 위한 Active Memory 런타임 파사드 |
    | `plugin-sdk/memory-host-status` | 더 이상 사용되지 않는 호환성 별칭입니다. `plugin-sdk/memory-core-host-status`를 사용하세요. |
  </Accordion>

  <Accordion title="예약된 번들 헬퍼 하위 경로">
    예약된 번들 헬퍼 SDK 하위 경로는 번들된 Plugin 코드를 위한 좁은 소유자별 표면입니다.
    패키지 빌드와 별칭 처리가 결정적으로 유지되도록 SDK 인벤토리에서 추적되지만,
    일반 Plugin 작성 API는 아닙니다. 새 재사용 가능 호스트 계약은
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
    `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 하위 경로를 사용해야 합니다.

    | 하위 경로 | 소유자 및 목적 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 사용자 MCP 서버 구성을 Codex 앱 서버 스레드 구성으로 프로젝션하기 위한 번들된 Codex Plugin 헬퍼 |
    | `plugin-sdk/codex-native-task-runtime` | Codex 앱 서버 네이티브 하위 에이전트를 OpenClaw 작업 상태로 미러링하기 위한 번들된 Codex Plugin 헬퍼 |

  </Accordion>
</AccordionGroup>

## 관련 항목

- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
