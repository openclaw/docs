---
read_when:
    - Plugin 가져오기에 적합한 plugin-sdk 하위 경로 선택
    - 번들 Plugin 하위 경로와 헬퍼 표면 감사
summary: 'Plugin SDK 하위 경로 카탈로그: 영역별로 그룹화한 import 위치'
title: Plugin SDK 하위 경로
x-i18n:
    generated_at: "2026-07-04T10:34:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK는 `openclaw/plugin-sdk/` 아래의 좁은 공개 하위 경로 집합으로 노출됩니다. 이 페이지는 목적별로 그룹화된 일반적으로 사용되는 하위 경로를 정리합니다. 생성된 컴파일러 엔트리포인트 인벤토리는 `scripts/lib/plugin-sdk-entrypoints.json`에 있으며, 패키지 exports는 `scripts/lib/plugin-sdk-private-local-only-subpaths.json`에 나열된 repo-local 테스트/내부 하위 경로를 제외한 공개 부분집합입니다. Maintainer는 `pnpm plugin-sdk:surface`로 공개 export 수를, `pnpm plugins:boundary-report:summary`로 활성 예약 헬퍼 하위 경로를 감사할 수 있습니다. 사용되지 않는 예약 헬퍼 exports는 휴면 호환성 부채로 공개 SDK에 남아 있지 않고 CI 보고서를 실패시킵니다.

Plugin 작성 가이드는 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참조하세요.

## Plugin 항목

| 하위 경로                      | 주요 exports                                                                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | `createMigrationItem` 같은 마이그레이션 provider 항목 헬퍼, reason 상수, 항목 상태 마커, redaction 헬퍼, `summarizeMigrationItems`                                    |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, `writeMigrationReport` 같은 런타임 마이그레이션 헬퍼                    |
| `plugin-sdk/health`            | 번들 health 소비자를 위한 Doctor health-check 등록, 감지, 복구, 선택, 심각도, finding 타입                                                                             |

### 사용 중단된 호환성 및 테스트 헬퍼

사용 중단된 하위 경로는 이전 Plugin을 위해 계속 export되지만, 새 코드는 아래의 집중된 SDK 하위 경로를 사용해야 합니다. 유지 관리되는 목록은 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`에 있으며, CI는 여기에서 번들 프로덕션 import를 거부합니다. `compat`, `config-types`, `infra-runtime`, `text-runtime`, `zod` 같은 broad barrel은 호환성 전용입니다. `zod`는 `zod`에서 직접 import하세요.

OpenClaw의 Vitest 기반 test-helper 하위 경로는 repo-local 전용이며 더 이상 패키지 exports가 아닙니다: `agent-runtime-test-contracts`, `channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`, `plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`, `testing`.

### 예약된 번들 Plugin 헬퍼 하위 경로

이 하위 경로는 일반 SDK API가 아니라 소유 번들 Plugin을 위한 Plugin 소유 호환성 표면입니다: `plugin-sdk/codex-mcp-projection` 및 `plugin-sdk/codex-native-task-runtime`. 교차 소유자 extension import는 패키지 계약 가드레일에 의해 차단됩니다.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 내보내기(`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin 소유 스키마용 캐시된 JSON Schema 검증 헬퍼 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공유 설정 마법사 헬퍼, 설정 번역기, 허용 목록 프롬프트, 설정 상태 빌더 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 사용 중단된 호환성 별칭입니다. `plugin-sdk/setup-runtime`을 사용하세요. |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 설정/액션 게이트 헬퍼, 기본 계정 폴백 헬퍼 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, 계정 ID 정규화 헬퍼 |
    | `plugin-sdk/account-resolution` | 계정 조회 및 기본 폴백 헬퍼 |
    | `plugin-sdk/account-helpers` | 좁은 계정 목록/계정 액션 헬퍼 |
    | `plugin-sdk/access-groups` | 접근 그룹 허용 목록 파싱 및 편집된 그룹 진단 헬퍼 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 공유 채널 설정 스키마 프리미티브와 Zod 및 직접 JSON/TypeBox 빌더 |
    | `plugin-sdk/bundled-channel-config-schema` | 유지 관리되는 번들 Plugin 전용 번들 OpenClaw 채널 설정 스키마 |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. 자체 테이블을 하드코딩하지 않고도 봉투 접두사가 붙은 텍스트를 인식해야 하는 Plugin을 위한 정식 번들/공식 채팅 채널 ID와 포매터 레이블/별칭입니다. |
    | `plugin-sdk/channel-config-schema-legacy` | 번들 채널 설정 스키마의 사용 중단된 호환성 별칭 |
    | `plugin-sdk/telegram-command-config` | 번들 계약 폴백이 있는 Telegram 사용자 지정 명령 정규화/검증 헬퍼 |
    | `plugin-sdk/command-gating` | 좁은 명령 권한 부여 게이트 헬퍼 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 사용 중단된 저수준 채널 인그레스 호환성 퍼사드입니다. 새 수신 경로는 `plugin-sdk/channel-ingress-runtime`을 사용해야 합니다. |
    | `plugin-sdk/channel-ingress-runtime` | 마이그레이션된 채널 수신 경로를 위한 실험적 고수준 채널 인그레스 런타임 리졸버 및 라우트 팩트 빌더입니다. 각 Plugin에서 유효 허용 목록, 명령 허용 목록, 레거시 프로젝션을 조립하는 대신 이것을 선호하세요. [채널 인그레스 API](/ko/plugins/sdk-channel-ingress)를 참조하세요. |
    | `plugin-sdk/channel-lifecycle` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-outbound` | 메시지 수명 주기 계약과 응답 파이프라인 옵션, 수신 확인, 실시간 미리보기/스트리밍, 수명 주기 헬퍼, 아웃바운드 ID, 페이로드 계획, 지속적 전송, 메시지 전송 컨텍스트 헬퍼입니다. [채널 아웃바운드 API](/ko/plugins/sdk-channel-outbound)를 참조하세요. |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound`의 사용 중단된 호환성 별칭과 레거시 응답 디스패치 퍼사드입니다. |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound`의 사용 중단된 호환성 별칭과 레거시 응답 디스패치 퍼사드입니다. |
    | `plugin-sdk/inbound-envelope` | 공유 인바운드 라우트 및 봉투 빌더 헬퍼 |
    | `plugin-sdk/inbound-reply-dispatch` | 사용 중단된 호환성 퍼사드입니다. 인바운드 러너와 디스패치 조건에는 `plugin-sdk/channel-inbound`를, 메시지 전달 헬퍼에는 `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/messaging-targets` | 사용 중단된 대상 파싱 별칭입니다. `plugin-sdk/channel-targets`를 사용하세요. |
    | `plugin-sdk/outbound-media` | 공유 아웃바운드 미디어 로딩 및 호스팅된 미디어 상태 헬퍼 |
    | `plugin-sdk/outbound-send-deps` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/outbound-runtime` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/poll-runtime` | 좁은 폴 정규화 헬퍼 |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 어댑터 헬퍼 |
    | `plugin-sdk/agent-media-payload` | 레거시 에이전트 미디어 페이로드 빌더 |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, 페어링, 구성된 바인딩 헬퍼 |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 설정 스냅샷 헬퍼 |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 해석 헬퍼 |
    | `plugin-sdk/channel-status` | 공유 채널 상태 스냅샷/요약 헬퍼 |
    | `plugin-sdk/channel-config-primitives` | 좁은 채널 설정 스키마 프리미티브 |
    | `plugin-sdk/channel-config-writes` | 채널 설정 쓰기 권한 부여 헬퍼 |
    | `plugin-sdk/channel-plugin-common` | 공유 채널 Plugin 프렐류드 내보내기 |
    | `plugin-sdk/allowlist-config-edit` | 허용 목록 설정 편집/읽기 헬퍼 |
    | `plugin-sdk/group-access` | 공유 그룹 접근 결정 헬퍼 |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-inbound`를 사용하세요. |
    | `plugin-sdk/direct-dm-guard-policy` | 좁은 직접 DM 사전 암호화 가드 정책 헬퍼 |
    | `plugin-sdk/discord` | 게시된 `@openclaw/discord@2026.3.13` 및 추적되는 소유자 호환성을 위한 사용 중단된 Discord 호환성 퍼사드입니다. 새 Plugin은 일반 채널 SDK 하위 경로를 사용해야 합니다. |
    | `plugin-sdk/telegram-account` | 추적되는 소유자 호환성을 위한 사용 중단된 Telegram 계정 해석 호환성 퍼사드입니다. 새 Plugin은 주입된 런타임 헬퍼나 일반 채널 SDK 하위 경로를 사용해야 합니다. |
    | `plugin-sdk/zalouser` | 발신자 명령 권한 부여를 아직 가져오는 게시된 Lark/Zalo 패키지를 위한 사용 중단된 Zalo Personal 호환성 퍼사드입니다. 새 Plugin은 `plugin-sdk/command-auth`를 사용해야 합니다. |
    | `plugin-sdk/interactive-runtime` | 의미론적 메시지 프레젠테이션, 전달, 레거시 인터랙티브 응답 헬퍼입니다. [메시지 프레젠테이션](/ko/plugins/message-presentation)을 참조하세요. |
    | `plugin-sdk/channel-inbound` | 이벤트 분류, 컨텍스트 빌드, 포매팅, 루트, 디바운스, 멘션 매칭, 멘션 정책, 인바운드 로깅을 위한 공유 인바운드 헬퍼 |
    | `plugin-sdk/channel-inbound-debounce` | 좁은 인바운드 디바운스 헬퍼 |
    | `plugin-sdk/channel-mention-gating` | 더 넓은 인바운드 런타임 표면 없이 제공되는 좁은 멘션 정책, 멘션 마커, 멘션 텍스트 헬퍼 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-inbound` 또는 `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-pairing-paths` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-pairing`을 사용하세요. |
    | `plugin-sdk/channel-reply-options-runtime` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-streaming` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`를 사용하세요. |
    | `plugin-sdk/channel-send-result` | 응답 결과 타입 |
    | `plugin-sdk/channel-actions` | 채널 메시지 액션 헬퍼와 Plugin 호환성을 위해 유지되는 사용 중단된 네이티브 스키마 헬퍼 |
    | `plugin-sdk/channel-route` | 공유 라우트 정규화, 파서 기반 대상 해석, 스레드 ID 문자열화, 중복 제거/압축 라우트 키, 파싱된 대상 타입, 라우트/대상 비교 헬퍼 |
    | `plugin-sdk/channel-targets` | 대상 파싱 헬퍼입니다. 라우트 비교 호출자는 `plugin-sdk/channel-route`를 사용해야 합니다. |
    | `plugin-sdk/channel-contract` | 채널 계약 타입 |
    | `plugin-sdk/channel-feedback` | 피드백/반응 연결 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` 및 비밀 대상 타입 같은 좁은 비밀 계약 헬퍼 |
  </Accordion>

사용 중단된 채널 헬퍼 계열은 게시된 Plugin 호환성을 위해서만 계속 제공됩니다. 제거 계획은 다음과 같습니다. 외부 Plugin 마이그레이션 기간 동안 유지하고, repo/번들 Plugin은 `channel-inbound` 및 `channel-outbound`에 유지한 다음, 다음 주요 SDK 정리에서 호환성 하위 경로를 제거합니다. 이는 기존 채널 메시지/런타임, 채널 스트리밍, 직접 DM 접근, 인바운드 헬퍼 분할, 응답 옵션, 페어링 경로 계열에 적용됩니다.

  <Accordion title="프로바이더 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 설정, 카탈로그 검색, 런타임 모델 준비를 위한 지원되는 LM Studio 프로바이더 facade |
    | `plugin-sdk/lmstudio-runtime` | 로컬 서버 기본값, 모델 검색, 요청 헤더, 로드된 모델 헬퍼를 위한 지원되는 LM Studio 런타임 facade |
    | `plugin-sdk/provider-setup` | 선별된 로컬/셀프 호스팅 프로바이더 설정 헬퍼 |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 셀프 호스팅 프로바이더 설정 헬퍼 |
    | `plugin-sdk/cli-backend` | CLI 백엔드 기본값 + watchdog 상수 |
    | `plugin-sdk/provider-auth-runtime` | 프로바이더 Plugin용 런타임 API 키 확인 헬퍼 |
    | `plugin-sdk/provider-oauth-runtime` | 일반 프로바이더 OAuth 콜백 타입, 콜백 페이지 렌더링, PKCE/상태 헬퍼, 인가 입력 파싱, 토큰 만료 헬퍼, 중단 헬퍼 |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 온보딩/프로필 쓰기 헬퍼 |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth 인증 결과 빌더 |
    | `plugin-sdk/provider-env-vars` | 프로바이더 인증 환경 변수 조회 헬퍼 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex 인증 가져오기 헬퍼, 더 이상 권장되지 않는 `resolveOpenClawAgentDir` 호환성 내보내기 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 replay-policy 빌더, 프로바이더 엔드포인트 헬퍼, 공유 모델 ID 정규화 헬퍼 |
    | `plugin-sdk/provider-catalog-live-runtime` | 보호된 `/models` 스타일 검색을 위한 라이브 프로바이더 모델 카탈로그 헬퍼: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, 모델 ID 필터링, TTL 캐시, 정적 fallback |
    | `plugin-sdk/provider-catalog-runtime` | 계약 테스트를 위한 프로바이더 카탈로그 보강 런타임 hook 및 Plugin-프로바이더 레지스트리 연결부 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 일반 프로바이더 HTTP/엔드포인트 기능 헬퍼, 프로바이더 HTTP 오류, 오디오 전사 multipart form 헬퍼 |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` 및 `WebFetchProviderPlugin` 같은 좁은 웹 가져오기 설정/선택 계약 헬퍼 |
    | `plugin-sdk/provider-web-fetch` | 웹 가져오기 프로바이더 등록/캐시 헬퍼 |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 활성화 배선이 필요 없는 프로바이더를 위한 좁은 웹 검색 설정/자격 증명 헬퍼 |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 자격 증명 setter/getter 같은 좁은 웹 검색 설정/자격 증명 계약 헬퍼 |
    | `plugin-sdk/provider-web-search` | 웹 검색 프로바이더 등록/캐시/런타임 헬퍼 |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, `listEmbeddingProviders(...)`를 포함한 일반 임베딩 프로바이더 타입 및 읽기 헬퍼. Plugin은 `api.registerEmbeddingProvider(...)`를 통해 프로바이더를 등록하므로 manifest 소유권이 강제됩니다 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, DeepSeek/Gemini/OpenAI 스키마 정리 + 진단 |
    | `plugin-sdk/provider-usage` | 프로바이더 사용량 스냅샷 타입, 공유 사용량 가져오기 헬퍼, `fetchClaudeUsage` 같은 프로바이더 fetcher |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 wrapper 타입, 일반 텍스트 도구 호출 호환성, 공유 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper 헬퍼 |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, Anthropic/DeepSeek/OpenAI 호환 스트림 유틸리티를 포함한 공개 공유 프로바이더 스트림 wrapper 헬퍼 |
    | `plugin-sdk/provider-transport-runtime` | 보호된 fetch, 도구 결과 텍스트 추출, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 프로바이더 전송 헬퍼 |
    | `plugin-sdk/provider-onboard` | 온보딩 설정 패치 헬퍼 |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache 헬퍼 |
    | `plugin-sdk/group-activation` | 좁은 그룹 활성화 모드 및 명령 파싱 헬퍼 |
  </Accordion>

프로바이더 사용량 스냅샷은 일반적으로 하나 이상의 할당량 `windows`를 보고하며, 각 항목에는
레이블, 사용률, 선택적 초기화 시간이 포함됩니다. 초기화 가능한 할당량 창 대신 잔액 또는
계정 상태 텍스트를 노출하는 프로바이더는 비율을 조작해 만들지 말고
빈 `windows` 배열과 함께 `summary`를 반환해야 합니다.
OpenClaw는 상태 출력에 해당 요약 텍스트를 표시합니다. 사용량 엔드포인트가 실패했거나
사용 가능한 사용량 데이터를 반환하지 않은 경우에만 `error`를 사용하세요.

  <Accordion title="인증 및 보안 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 동적 인수 메뉴 형식을 포함한 명령 레지스트리 헬퍼, 발신자 인가 헬퍼 |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` 및 `buildHelpMessage` 같은 명령/도움말 메시지 빌더 |
    | `plugin-sdk/approval-auth-runtime` | 승인자 확인 및 동일 채팅 작업 인증 헬퍼 |
    | `plugin-sdk/approval-client-runtime` | 네이티브 exec 승인 프로필/필터 헬퍼 |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 기능/전달 adapter |
    | `plugin-sdk/approval-gateway-runtime` | 공유 승인 Gateway 확인 헬퍼 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 핫 채널 진입점을 위한 가벼운 네이티브 승인 adapter 로딩 헬퍼 |
    | `plugin-sdk/approval-handler-runtime` | 더 넓은 승인 handler 런타임 헬퍼. 충분한 경우 더 좁은 adapter/Gateway 연결부를 선호하세요 |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상, 계정 바인딩, route gate, 전달 fallback, 로컬 네이티브 exec 프롬프트 억제 헬퍼 |
    | `plugin-sdk/approval-reaction-runtime` | 하드코딩된 승인 reaction 바인딩, reaction 프롬프트 payload, reaction 대상 저장소, reaction 힌트 텍스트 헬퍼, 로컬 네이티브 exec 프롬프트 억제를 위한 호환성 내보내기 |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 승인 reply payload 헬퍼 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 payload 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼, `formatApprovalDisplayPath` 같은 구조화된 승인 표시 헬퍼 |
    | `plugin-sdk/reply-dedupe` | 좁은 인바운드 reply dedupe 초기화 헬퍼 |
    | `plugin-sdk/channel-contract-testing` | 넓은 testing barrel 없는 좁은 채널 계약 테스트 헬퍼 |
    | `plugin-sdk/command-auth-native` | 네이티브 명령 인증, 동적 인수 메뉴 형식, 네이티브 세션 대상 헬퍼 |
    | `plugin-sdk/command-detection` | 공유 명령 감지 헬퍼 |
    | `plugin-sdk/command-primitives-runtime` | 핫 채널 경로를 위한 가벼운 명령 텍스트 predicate |
    | `plugin-sdk/command-surface` | 명령 본문 정규화 및 명령 surface 헬퍼 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 비공개 채널 및 Web UI device-code 페어링을 위한 지연 프로바이더 인증 로그인 흐름 헬퍼 |
    | `plugin-sdk/channel-secret-runtime` | 채널/Plugin secret surface를 위한 좁은 secret-contract collection 헬퍼 |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config 파싱을 위한 좁은 `coerceSecretRef` 및 SecretRef typing 헬퍼 |
    | `plugin-sdk/secret-provider-integration` | 외부 secret 프로바이더 preset을 게시하는 Plugin을 위한 타입 전용 SecretRef 프로바이더 통합 manifest 및 preset 계약 |
    | `plugin-sdk/security-runtime` | 공유 신뢰, DM gating, create-only 쓰기, 동기/비동기 원자적 파일 교체, sibling temp 쓰기, 교차 장치 move fallback, 비공개 파일 저장소 헬퍼, symlink-parent guard, 외부 콘텐츠, 민감 텍스트 redact, constant-time secret 비교, secret collection 헬퍼를 포함한 root-bounded 파일/경로 헬퍼 |
    | `plugin-sdk/ssrf-policy` | 호스트 allowlist 및 private-network SSRF 정책 헬퍼 |
    | `plugin-sdk/ssrf-dispatcher` | 넓은 infra 런타임 surface 없는 좁은 pinned-dispatcher 헬퍼 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF 보호 fetch, SSRF 오류, SSRF 정책 헬퍼 |
    | `plugin-sdk/secret-input` | Secret 입력 파싱 헬퍼 |
    | `plugin-sdk/webhook-ingress` | Webhook 요청/대상 헬퍼 및 raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/timeout 헬퍼 |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/runtime` | 광범위한 런타임/로깅/백업/Plugin 설치 헬퍼 |
    | `plugin-sdk/runtime-env` | 좁은 런타임 env, 로거, 타임아웃, 재시도, 백오프 헬퍼 |
    | `plugin-sdk/browser-config` | 정규화된 프로필/기본값, CDP URL 파싱, 브라우저 제어 인증 헬퍼를 위한 지원 브라우저 config facade |
    | `plugin-sdk/agent-harness-task-runtime` | 호스트가 발급한 작업 범위를 사용하는 harness 기반 agent를 위한 일반 작업 수명 주기 및 완료 전달 헬퍼 |
    | `plugin-sdk/codex-mcp-projection` | 사용자 MCP server config를 Codex thread config로 투영하기 위한 예약된 번들 Codex 헬퍼; 서드파티 plugins용 아님 |
    | `plugin-sdk/codex-native-task-runtime` | 네이티브 작업 미러/런타임 연결을 위한 비공개 번들 Codex 헬퍼; 서드파티 plugins용 아님 |
    | `plugin-sdk/channel-runtime-context` | 일반 channel runtime-context 등록 및 조회 헬퍼 |
    | `plugin-sdk/matrix` | 이전 서드파티 channel packages를 위한 사용 중단된 Matrix 호환성 facade; 새 plugins는 `plugin-sdk/run-command`를 직접 import해야 함 |
    | `plugin-sdk/mattermost` | 이전 서드파티 channel packages를 위한 사용 중단된 Mattermost 호환성 facade; 새 plugins는 일반 SDK 하위 경로를 직접 import해야 함 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공유 plugin command/hook/http/interactive 헬퍼 |
    | `plugin-sdk/hook-runtime` | 공유 webhook/internal hook pipeline 헬퍼 |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 지연 런타임 import/binding 헬퍼 |
    | `plugin-sdk/process-runtime` | 프로세스 exec 헬퍼 |
    | `plugin-sdk/cli-runtime` | CLI formatting, wait, version, argument-invocation, 지연 command-group 헬퍼 |
    | `plugin-sdk/qa-live-transport-scenarios` | 공유 라이브 transport QA scenario id, 기준 coverage 헬퍼, scenario-selection 헬퍼 |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]`를 선언하는 plugin HTTP routes를 위한 예약된 Gateway method dispatch 헬퍼 |
    | `plugin-sdk/gateway-runtime` | Gateway client, event-loop-ready client start 헬퍼, gateway CLI RPC, gateway protocol errors, advertised LAN host resolution, channel-status patch 헬퍼 |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` 및 channel/provider config types 같은 plugin config shapes를 위한 집중형 type-only config surface |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject`, `resolveLivePluginConfigObject` 같은 런타임 plugin-config 조회 헬퍼 |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile`, `logConfigUpdated` 같은 transactional config mutation 헬퍼 |
    | `plugin-sdk/message-tool-delivery-hints` | 공유 message-tool delivery metadata hint 문자열 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot`, test snapshot setter 같은 현재 프로세스 config snapshot 헬퍼 |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram contract surface를 사용할 수 없는 경우에도 Telegram command-name/description 정규화 및 duplicate/conflict 검사 |
    | `plugin-sdk/text-autolink-runtime` | 광범위한 text barrel 없이 file-reference autolink 감지 |
    | `plugin-sdk/approval-reaction-runtime` | 하드코딩된 approval reaction bindings, reaction prompt payloads, reaction target stores, reaction hint text 헬퍼, local native exec prompt suppression을 위한 호환성 export |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval 헬퍼, approval-capability builders, auth/profile 헬퍼, native routing/runtime 헬퍼, structured approval display path formatting |
    | `plugin-sdk/reply-runtime` | 공유 inbound/reply runtime 헬퍼, chunking, dispatch, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 reply dispatch/finalize 및 conversation-label 헬퍼 |
    | `plugin-sdk/reply-history` | 공유 short-window reply-history 헬퍼. 새 message-turn 코드는 `createChannelHistoryWindow`를 사용해야 하며, 하위 수준 map 헬퍼는 사용 중단된 호환성 export로만 유지됨 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 text/markdown chunking 헬퍼 |
    | `plugin-sdk/session-store-runtime` | 세션 워크플로 헬퍼(`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), 세션 identity별 제한된 최근 user/assistant transcript text 읽기, legacy session store path/session-key 헬퍼, updated-at 읽기, 전환 전용 whole-store/file-path 호환성 헬퍼 |
    | `plugin-sdk/session-transcript-runtime` | Transcript identity, scoped target/read/write 헬퍼, update publishing, write locks, transcript memory hit keys |
    | `plugin-sdk/sqlite-runtime` | first-party 런타임을 위한 집중형 SQLite agent-schema, path, transaction 헬퍼 |
    | `plugin-sdk/cron-store-runtime` | Cron store path/load/save 헬퍼 |
    | `plugin-sdk/state-paths` | State/OAuth dir path 헬퍼 |
    | `plugin-sdk/plugin-state-runtime` | Plugin sidecar SQLite keyed-state types와 plugin 소유 databases를 위한 중앙 집중식 connection pragma 및 WAL maintenance setup |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 route/session-key/account binding 헬퍼 |
    | `plugin-sdk/status-helpers` | 공유 channel/account status summary 헬퍼, runtime-state defaults, issue metadata 헬퍼 |
    | `plugin-sdk/target-resolver-runtime` | 공유 target resolver 헬퍼 |
    | `plugin-sdk/string-normalization-runtime` | Slug/string 정규화 헬퍼 |
    | `plugin-sdk/request-url` | fetch/request-like 입력에서 string URLs 추출 |
    | `plugin-sdk/run-command` | 정규화된 stdout/stderr 결과를 제공하는 timed command runner |
    | `plugin-sdk/param-readers` | 공통 tool/CLI param reader |
    | `plugin-sdk/tool-plugin` | 간단한 typed agent-tool plugin을 정의하고 manifest 생성을 위한 static metadata 노출 |
    | `plugin-sdk/tool-payload` | tool result objects에서 정규화된 payloads 추출 |
    | `plugin-sdk/tool-send` | tool args에서 표준 send target fields 추출 |
    | `plugin-sdk/sandbox` | fail-fast exec command preflight를 포함한 Sandbox backend types 및 SSH/OpenShell command 헬퍼 |
    | `plugin-sdk/temp-path` | 공유 temp-download path 헬퍼 및 비공개 보안 temp workspaces |
    | `plugin-sdk/logging-core` | Subsystem logger 및 redaction 헬퍼 |
    | `plugin-sdk/markdown-table-runtime` | Markdown table mode 및 conversion 헬퍼 |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`, `resolveAgentMaxConcurrent` 같은 model/session override 헬퍼 |
    | `plugin-sdk/talk-config-runtime` | Talk provider config resolution 헬퍼 |
    | `plugin-sdk/json-store` | 작은 JSON state read/write 헬퍼 |
    | `plugin-sdk/json-unsafe-integers` | 안전하지 않은 integer literals를 strings로 보존하는 JSON parsing 헬퍼 |
    | `plugin-sdk/file-lock` | Re-entrant file-lock 헬퍼 |
    | `plugin-sdk/persistent-dedupe` | Disk-backed dedupe cache 헬퍼 |
    | `plugin-sdk/acp-runtime` | ACP runtime/session 및 reply-dispatch 헬퍼 |
    | `plugin-sdk/acp-runtime-backend` | startup-loaded plugins를 위한 경량 ACP backend registration 및 reply-dispatch 헬퍼 |
    | `plugin-sdk/acp-binding-resolve-runtime` | lifecycle startup imports 없는 read-only ACP binding resolution |
    | `plugin-sdk/agent-config-primitives` | 좁은 agent runtime config-schema primitives |
    | `plugin-sdk/boolean-param` | 느슨한 boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | Dangerous-name matching resolution 헬퍼 |
    | `plugin-sdk/device-bootstrap` | Device bootstrap 및 pairing token 헬퍼 |
    | `plugin-sdk/extension-shared` | 공유 passive-channel, status, ambient proxy helper primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply 헬퍼 |
    | `plugin-sdk/skill-commands-runtime` | Skill command listing 헬퍼 |
    | `plugin-sdk/native-command-registry` | Native command registry/build/serialize 헬퍼 |
    | `plugin-sdk/agent-harness` | low-level agent harnesses를 위한 실험적 trusted-plugin surface: harness types, active-run steer/abort 헬퍼, OpenClaw tool bridge 헬퍼, runtime-plan tool policy 헬퍼, terminal outcome classification, tool progress formatting/detail 헬퍼, attempt result utilities |
    | `plugin-sdk/provider-zai-endpoint` | 사용 중단된 Z.AI provider-owned endpoint detection facade; Z.AI plugin public API를 사용 |
    | `plugin-sdk/async-lock-runtime` | 작은 runtime state files를 위한 process-local async lock 헬퍼 |
    | `plugin-sdk/channel-activity-runtime` | Channel activity telemetry 헬퍼 |
    | `plugin-sdk/concurrency-runtime` | 제한된 async task concurrency 헬퍼 |
    | `plugin-sdk/dedupe-runtime` | In-memory 및 persistent-backed dedupe cache 헬퍼 |
    | `plugin-sdk/delivery-queue-runtime` | Outbound pending-delivery drain 헬퍼 |
    | `plugin-sdk/file-access-runtime` | 안전한 local-file 및 media-source path 헬퍼 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat wake, event, visibility 헬퍼 |
    | `plugin-sdk/number-runtime` | Numeric coercion 헬퍼 |
    | `plugin-sdk/secure-random-runtime` | Secure token/UUID 헬퍼 |
    | `plugin-sdk/system-event-runtime` | System event queue 헬퍼 |
    | `plugin-sdk/transport-ready-runtime` | Transport readiness wait 헬퍼 |
    | `plugin-sdk/exec-approvals-runtime` | 광범위한 infra-runtime barrel 없이 exec approval policy file 헬퍼 |
    | `plugin-sdk/infra-runtime` | 사용 중단된 compatibility shim; 위의 집중형 runtime 하위 경로를 사용 |
    | `plugin-sdk/collection-runtime` | 작은 bounded cache 헬퍼 |
    | `plugin-sdk/diagnostic-runtime` | Diagnostic flag, event, trace-context 헬퍼 |
    | `plugin-sdk/error-runtime` | Error graph, formatting, shared error classification 헬퍼, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, EnvHttpProxyAgent option, pinned lookup 헬퍼 |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch imports 없는 dispatcher-aware runtime fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 광범위한 media runtime surface 없는 inline image data URL sanitizer 및 signature sniffing 헬퍼 |
    | `plugin-sdk/response-limit-runtime` | 광범위한 media runtime surface 없는 bounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | configured binding routing 또는 pairing stores 없는 현재 conversation binding state |
    | `plugin-sdk/session-store-runtime` | 광범위한 config writes/maintenance imports 없는 session-store 헬퍼 |
    | `plugin-sdk/sqlite-runtime` | database lifecycle controls 없는 집중형 SQLite agent-schema, path, transaction 헬퍼 |
    | `plugin-sdk/context-visibility-runtime` | 광범위한 config/security imports 없는 context visibility resolution 및 supplemental context filtering |
    | `plugin-sdk/string-coerce-runtime` | markdown/logging imports 없는 좁은 primitive record/string coercion 및 normalization 헬퍼 |
    | `plugin-sdk/host-runtime` | Hostname 및 SCP host normalization 헬퍼 |
    | `plugin-sdk/retry-runtime` | Retry config 및 retry runner 헬퍼 |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir`, 사용 중단된 `resolveOpenClawAgentDir` 호환성 export를 포함한 agent dir/identity/workspace 헬퍼 |
    | `plugin-sdk/directory-runtime` | Config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="기능 및 테스트 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, 더 이상 사용되지 않는 `fetchRemoteMedia`를 포함한 공유 미디어 가져오기/변환/저장 헬퍼. URL이 OpenClaw 미디어가 되어야 할 때는 버퍼 읽기보다 저장소 헬퍼를 우선 사용하세요 |
    | `plugin-sdk/media-mime` | 좁은 MIME 정규화, 파일 확장자 매핑, MIME 감지, 미디어 종류 헬퍼 |
    | `plugin-sdk/media-store` | `saveMediaBuffer`, `saveMediaStream` 같은 좁은 미디어 저장소 헬퍼 |
    | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 장애 조치 헬퍼, 후보 선택, 누락된 모델 메시징 |
    | `plugin-sdk/media-understanding` | 미디어 이해 제공자 타입 및 제공자 대상 이미지/오디오/구조화 추출 헬퍼 내보내기 |
    | `plugin-sdk/text-chunking` | 텍스트 및 마크다운 청킹/렌더링 헬퍼, 마크다운 표 변환, 지시문 태그 제거, 안전한 텍스트 유틸리티 |
    | `plugin-sdk/text-chunking` | 아웃바운드 텍스트 청킹 헬퍼 |
    | `plugin-sdk/speech` | 음성 제공자 타입 및 제공자 대상 지시문, 레지스트리, 검증, OpenAI 호환 TTS 빌더, 음성 헬퍼 내보내기 |
    | `plugin-sdk/speech-core` | 공유 음성 제공자 타입, 레지스트리, 지시문, 정규화, 음성 헬퍼 내보내기 |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 제공자 타입, 레지스트리 헬퍼, 공유 WebSocket 세션 헬퍼 |
    | `plugin-sdk/realtime-bootstrap-context` | 제한된 `IDENTITY.md`, `USER.md`, `SOUL.md` 컨텍스트 주입을 위한 실시간 프로필 부트스트랩 헬퍼 |
    | `plugin-sdk/realtime-voice` | 출력 활동 추적을 포함한 실시간 음성 제공자 타입, 레지스트리 헬퍼, 공유 실시간 음성 동작 헬퍼 |
    | `plugin-sdk/image-generation` | 이미지 생성 제공자 타입 및 이미지 에셋/데이터 URL 헬퍼, OpenAI 호환 이미지 제공자 빌더 |
    | `plugin-sdk/image-generation-core` | 공유 이미지 생성 타입, 장애 조치, 인증, 레지스트리 헬퍼 |
    | `plugin-sdk/music-generation` | 음악 생성 제공자/요청/결과 타입 |
    | `plugin-sdk/music-generation-core` | 공유 음악 생성 타입, 장애 조치 헬퍼, 제공자 조회, 모델 참조 파싱 |
    | `plugin-sdk/video-generation` | 비디오 생성 제공자/요청/결과 타입 |
    | `plugin-sdk/video-generation-core` | 공유 비디오 생성 타입, 장애 조치 헬퍼, 제공자 조회, 모델 참조 파싱 |
    | `plugin-sdk/transcripts` | 공유 트랜스크립트 소스 제공자 타입, 레지스트리 헬퍼, 세션 설명자, 발화 메타데이터 |
    | `plugin-sdk/webhook-targets` | Webhook 대상 레지스트리 및 라우트 설치 헬퍼 |
    | `plugin-sdk/webhook-path` | 더 이상 사용되지 않는 호환성 별칭. `plugin-sdk/webhook-ingress`를 사용하세요 |
    | `plugin-sdk/web-media` | 공유 원격/로컬 미디어 로딩 헬퍼 |
    | `plugin-sdk/zod` | 더 이상 사용되지 않는 호환성 재내보내기. `zod`에서 `zod`를 직접 가져오세요 |
    | `plugin-sdk/testing` | 레거시 OpenClaw 테스트를 위한 저장소 로컬의 더 이상 사용되지 않는 호환성 배럴입니다. 새 저장소 테스트는 대신 `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures` 같은 집중된 로컬 테스트 하위 경로를 가져와야 합니다 |
    | `plugin-sdk/plugin-test-api` | 저장소 테스트 헬퍼 브리지를 가져오지 않고 직접 Plugin 등록 단위 테스트를 위한 저장소 로컬 최소 `createTestPluginApi` 헬퍼 |
    | `plugin-sdk/agent-runtime-test-contracts` | 인증, 전달, 폴백, 도구 훅, 프롬프트 오버레이, 스키마, 트랜스크립트 프로젝션 테스트를 위한 저장소 로컬 네이티브 에이전트 런타임 어댑터 계약 픽스처 |
    | `plugin-sdk/channel-test-helpers` | 일반 작업/설정/상태 계약, 디렉터리 어설션, 계정 시작 수명 주기, 전송 구성 스레딩, 런타임 목, 상태 문제, 아웃바운드 전달, 훅 등록을 위한 저장소 로컬 채널 지향 테스트 헬퍼 |
    | `plugin-sdk/channel-target-testing` | 채널 테스트를 위한 저장소 로컬 공유 대상 확인 오류 사례 스위트 |
    | `plugin-sdk/plugin-test-contracts` | 저장소 로컬 Plugin 패키지, 등록, 공개 아티팩트, 직접 가져오기, 런타임 API, 가져오기 부작용 계약 헬퍼 |
    | `plugin-sdk/provider-test-contracts` | 저장소 로컬 제공자 런타임, 인증, 검색, 온보딩, 카탈로그, 마법사, 미디어 기능, 리플레이 정책, 실시간 STT 라이브 오디오, 웹 검색/가져오기, 스트림 계약 헬퍼 |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http`를 실행하는 제공자 테스트를 위한 저장소 로컬 옵트인 Vitest HTTP/인증 목 |
    | `plugin-sdk/test-fixtures` | 저장소 로컬 일반 CLI 런타임 캡처, 샌드박스 컨텍스트, Skill 작성기, 에이전트 메시지, 시스템 이벤트, 모듈 리로드, 번들 Plugin 경로, 터미널 텍스트, 청킹, 인증 토큰, 타입 지정 사례 픽스처 |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` 팩토리 내부에서 사용하기 위한 저장소 로컬 집중 Node 내장 목 헬퍼 |
  </Accordion>

  <Accordion title="메모리 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 관리자/구성/파일/CLI 헬퍼를 위한 번들 메모리 코어 헬퍼 표면 |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 인덱스/검색 런타임 파사드 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 경량 메모리 임베딩 제공자 레지스트리 헬퍼 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 계약, 레지스트리 접근, 로컬 제공자, 일반 배치/원격 헬퍼. 이 표면의 `registerMemoryEmbeddingProvider`는 더 이상 사용되지 않습니다. 새 제공자에는 일반 임베딩 제공자 API를 사용하세요. |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 스토리지 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 시크릿 헬퍼 |
    | `plugin-sdk/memory-core-host-events` | 더 이상 사용되지 않는 호환성 별칭. `plugin-sdk/memory-host-events`를 사용하세요 |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 헬퍼를 위한 공급업체 중립 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 헬퍼를 위한 공급업체 중립 별칭 |
    | `plugin-sdk/memory-host-files` | 더 이상 사용되지 않는 호환성 별칭. `plugin-sdk/memory-core-host-runtime-files`를 사용하세요 |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 Plugin을 위한 공유 관리형 마크다운 헬퍼 |
    | `plugin-sdk/memory-host-search` | 검색 관리자 접근을 위한 Active Memory 런타임 파사드 |
    | `plugin-sdk/memory-host-status` | 더 이상 사용되지 않는 호환성 별칭. `plugin-sdk/memory-core-host-status`를 사용하세요 |
  </Accordion>

  <Accordion title="예약된 번들 헬퍼 하위 경로">
    예약된 번들 헬퍼 SDK 하위 경로는 번들 Plugin 코드를 위한 좁은 소유자별 표면입니다.
    패키지 빌드와 별칭 처리가 결정적으로 유지되도록 SDK 인벤토리에서 추적되지만,
    일반 Plugin 작성 API는 아닙니다. 새 재사용 가능한 호스트 계약은
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
    `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 하위 경로를 사용해야 합니다.

    | 하위 경로 | 소유자 및 목적 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 사용자 MCP 서버 구성을 Codex 앱 서버 스레드 구성으로 프로젝션하기 위한 번들 Codex Plugin 헬퍼 |
    | `plugin-sdk/codex-native-task-runtime` | Codex 앱 서버 네이티브 서브에이전트를 OpenClaw 작업 상태로 미러링하기 위한 번들 Codex Plugin 헬퍼 |

  </Accordion>
</AccordionGroup>

## 관련 항목

- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
