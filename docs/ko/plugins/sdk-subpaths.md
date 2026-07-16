---
read_when:
    - Plugin 가져오기에 적합한 plugin-sdk 하위 경로 선택하기
    - 번들 Plugin 하위 경로 및 헬퍼 표면 감사하기
summary: 'Plugin SDK 하위 경로 카탈로그: 영역별로 그룹화한 가져오기 위치 안내'
title: Plugin SDK 하위 경로
x-i18n:
    generated_at: "2026-07-16T12:55:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK는 `openclaw/plugin-sdk/` 아래의 제한된 공개 하위 경로 집합으로
제공됩니다. 이 페이지에서는 일반적으로 사용되는 하위 경로를 목적별로 분류하여
정리합니다. 다음 세 파일이 공개 영역을 정의합니다.

- `scripts/lib/plugin-sdk-entrypoints.json`: 빌드에서 컴파일하는 유지 관리 대상 진입점 목록입니다.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: 저장소 로컬
  테스트/내부 하위 경로입니다. 패키지 내보내기는 전체 목록에서 이 목록을 제외한 항목입니다.
- `src/plugin-sdk/entrypoints.ts`: 사용 중단된
  하위 경로, 예약된 번들 헬퍼, 지원되는 번들 퍼사드 및
  Plugin 소유 공개 영역에 대한 분류 메타데이터입니다.

유지관리자는 `pnpm plugin-sdk:surface`로 공개 내보내기 수를 감사하고
`pnpm plugins:boundary-report:summary`로 사용 중인 예약 헬퍼 하위 경로를 감사합니다.
사용되지 않는 예약 헬퍼 내보내기는 휴면 상태의 호환성 부채로 공개 SDK에 남지 않고
CI 보고서에서 실패로 처리됩니다.

Plugin 작성 가이드는 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참조하십시오.

## Plugin 진입점

| 하위 경로                        | 주요 내보내기                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | `createMigrationItem` 등의 마이그레이션 공급자 항목 헬퍼, 사유 상수, 항목 상태 마커, 수정 헬퍼 및 `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` 및 `writeMigrationReport` 등의 런타임 마이그레이션 헬퍼                                             |
| `plugin-sdk/health`            | 번들 상태 검사 소비자를 위한 Doctor 상태 검사 등록, 탐지, 복구, 선택, 심각도 및 발견 항목 유형                                                                                |
| `plugin-sdk/config-schema`     | 사용 중단되었습니다. 루트 `openclaw.json` Zod 스키마(`OpenClawSchema`)입니다. 대신 Plugin 로컬 스키마를 정의하고 `plugin-sdk/json-schema-runtime`로 검증하십시오.                                                  |

### 사용 중단된 호환성 및 테스트 헬퍼

이전 Plugin을 위해 사용 중단된 하위 경로가 계속 내보내지지만, 새 코드에서는
아래의 용도별 SDK 하위 경로를 사용해야 합니다. 유지 관리 대상 목록은
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`이며, CI는 이 목록에서 번들
프로덕션 가져오기를 수행하면 거부합니다. `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` 및
`plugin-sdk/text-runtime` 같은 광범위한 배럴은 호환성 용도로만 제공되며, `plugin-sdk/zod`은
호환성 재내보내기입니다. `zod`에서 `zod`을 직접 가져오십시오. 광범위한 도메인
배럴인 `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` 및
`plugin-sdk/security-runtime`도 마찬가지로 용도별
하위 경로를 위해 사용 중단되었습니다.

OpenClaw의 Vitest 기반 테스트 헬퍼 하위 경로는 저장소 로컬 전용이며 더 이상
패키지 내보내기가 아닙니다. 해당 경로는 `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` 및 `testing`입니다. 비공개 번들 헬퍼 영역인
`ssrf-runtime-internal`와 `codex-native-task-runtime`도 저장소 로컬
전용입니다.

### 예약된 번들 Plugin 헬퍼 하위 경로

`plugin-sdk/codex-mcp-projection`은 유일하게 예약된 하위 경로입니다. 이는 번들 Codex Plugin이 소유하는
호환성 영역이며 일반 SDK API가 아닙니다.
소유자가 다른 Plugin 간 가져오기는 패키지 계약 가드레일에 의해 차단되며,
예약된 하위 경로를 더 이상 가져오지 않으면 CI가 실패합니다.
`plugin-sdk/codex-native-task-runtime`은 저장소 로컬 전용이며 패키지
내보내기가 아닙니다.

`src/plugin-sdk/entrypoints.ts`은 일반 계약으로 대체될 때까지 해당 번들 Plugin이 지원하는 SDK
진입점인 지원 대상 번들 퍼사드도 추적합니다. 해당 진입점은 `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` 및 `plugin-sdk/zalouser`입니다. 이 가운데 일부는 새 코드에서도
사용이 중단되었습니다. 아래의 각 행에 있는 참고 사항을 확인하십시오.

<AccordionGroup>
  <Accordion title="채널 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | 플러그인 소유 스키마를 위한 캐시된 JSON Schema 검증 도우미 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공유 설정 마법사 도우미, 설정 번역기, 허용 목록 프롬프트, 설정 상태 빌더 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 사용 중단된 호환성 별칭입니다. `plugin-sdk/setup-runtime`을 사용하십시오. |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 구성/작업 게이트 도우미, 기본 계정 폴백 도우미 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, 계정 ID 정규화 도우미 |
    | `plugin-sdk/account-resolution` | 계정 조회 및 기본 폴백 도우미 |
    | `plugin-sdk/account-helpers` | 제한된 계정 목록/계정 작업 도우미 |
    | `plugin-sdk/access-groups` | 액세스 그룹 허용 목록 구문 분석 및 편집된 그룹 진단 도우미 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`을 사용하십시오. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 공유 채널 구성 스키마 기본 요소와 Zod 및 직접 JSON/TypeBox 빌더 |
    | `plugin-sdk/bundled-channel-config-schema` | 유지 관리되는 번들 플러그인 전용의 번들 OpenClaw 채널 구성 스키마 |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. 자체 테이블을 하드코딩하지 않고 봉투 접두사가 붙은 텍스트를 인식해야 하는 플러그인을 위한 표준 번들/공식 채팅 채널 ID와 포매터 레이블/별칭입니다. |
    | `plugin-sdk/channel-config-schema-legacy` | 번들 채널 구성 스키마를 위한 사용 중단된 호환성 별칭 |
    | `plugin-sdk/telegram-command-config` | 사용 중단된 Telegram 명령 이름/설명 정규화 및 중복/충돌 검사입니다. 새 플러그인 코드에서는 플러그인 로컬 명령 구성 처리를 사용하십시오. |
    | `plugin-sdk/command-gating` | 제한된 명령 권한 부여 게이트 도우미 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | 마이그레이션된 채널 수신 경로를 위한 실험적 고수준 채널 인그레스 런타임 리졸버 및 경로 팩트 빌더입니다. 각 플러그인에서 유효 허용 목록, 명령 허용 목록 및 레거시 프로젝션을 조합하는 대신 이를 사용하는 것이 좋습니다. [채널 인그레스 API](/ko/plugins/sdk-channel-ingress)를 참조하십시오. |
    | `plugin-sdk/channel-lifecycle` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`을 사용하십시오. |
    | `plugin-sdk/channel-outbound` | 메시지 수명 주기 계약과 응답 파이프라인 옵션, 수신 확인, 실시간 미리 보기/스트리밍, 수명 주기 도우미, 아웃바운드 ID, 페이로드 계획, 영속적 전송 및 메시지 전송 컨텍스트 도우미입니다. [채널 아웃바운드 API](/ko/plugins/sdk-channel-outbound)를 참조하십시오. |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound`의 사용 중단된 호환성 별칭입니다. |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound`의 사용 중단된 호환성 별칭입니다. |
    | `plugin-sdk/inbound-envelope` | 공유 인바운드 경로 및 봉투 빌더 도우미 |
    | `plugin-sdk/inbound-reply-dispatch` | 사용 중단된 호환성 퍼사드입니다. 인바운드 실행기 및 디스패치 조건자에는 `plugin-sdk/channel-inbound`을, 메시지 전달 도우미에는 `plugin-sdk/channel-outbound`을 사용하십시오. |
    | `plugin-sdk/messaging-targets` | 사용 중단된 대상 구문 분석 별칭입니다. `plugin-sdk/channel-targets`을 사용하십시오. |
    | `plugin-sdk/outbound-media` | 공유 아웃바운드 미디어 로딩 및 호스팅 미디어 상태 도우미 |
    | `plugin-sdk/outbound-send-deps` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`을 사용하십시오. |
    | `plugin-sdk/outbound-runtime` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`을 사용하십시오. |
    | `plugin-sdk/poll-runtime` | 제한된 설문 정규화 도우미 |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 어댑터 도우미 |
    | `plugin-sdk/agent-media-payload` | 에이전트 미디어 페이로드 루트 및 로더 |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, 페어링 및 구성된 바인딩 도우미를 위한 사용 중단된 광범위 배럴입니다. `plugin-sdk/thread-bindings-runtime` 및 `plugin-sdk/session-binding-runtime`과 같은 범위가 한정된 바인딩 하위 경로를 사용하는 것이 좋습니다. |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 확인 도우미 |
    | `plugin-sdk/channel-status` | 공유 채널 상태 스냅샷/요약 도우미 |
    | `plugin-sdk/channel-config-primitives` | 제한된 채널 구성 스키마 기본 요소 |
    | `plugin-sdk/channel-config-writes` | 채널 구성 쓰기 권한 부여 도우미 |
    | `plugin-sdk/channel-plugin-common` | 공유 채널 플러그인 프렐류드 내보내기 |
    | `plugin-sdk/allowlist-config-edit` | 허용 목록 구성 편집/읽기 도우미 |
    | `plugin-sdk/group-access` | 사용 중단된 그룹 액세스 결정 도우미입니다. `plugin-sdk/channel-ingress-runtime`의 `resolveChannelMessageIngress`을 사용하십시오. |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-inbound`을 사용하십시오. |
    | `plugin-sdk/direct-dm-guard-policy` | 제한된 직접 DM 암호화 전 가드 정책 도우미 |
    | `plugin-sdk/discord` | 게시된 `@openclaw/discord@2026.3.13` 및 추적 중인 소유자 호환성을 위한 사용 중단된 Discord 호환성 퍼사드입니다. 새 플러그인은 일반 채널 SDK 하위 경로를 사용해야 합니다. |
    | `plugin-sdk/telegram-account` | 추적 중인 소유자 호환성을 위한 사용 중단된 Telegram 계정 확인 호환성 퍼사드입니다. 새 플러그인은 주입된 런타임 도우미 또는 일반 채널 SDK 하위 경로를 사용해야 합니다. |
    | `plugin-sdk/zalouser` | 발신자 명령 권한 부여를 계속 가져오는 게시된 Lark/Zalo 패키지를 위한 사용 중단된 Zalo Personal 호환성 퍼사드입니다. 새 플러그인은 일반 채널 SDK 하위 경로를 사용해야 합니다. |
    | `plugin-sdk/interactive-runtime` | 의미론적 메시지 프레젠테이션, 전달 및 레거시 대화형 응답 도우미입니다. [메시지 프레젠테이션](/ko/plugins/message-presentation)을 참조하십시오. |
    | `plugin-sdk/channel-inbound` | 이벤트 분류, 컨텍스트 빌드, 서식 지정, 루트, 디바운스, 멘션 일치, 멘션 정책 및 인바운드 로깅을 위한 공유 인바운드 도우미 |
    | `plugin-sdk/channel-inbound-debounce` | 제한된 인바운드 디바운스 도우미 |
    | `plugin-sdk/channel-mention-gating` | 더 광범위한 인바운드 런타임 표면 없이 제공되는 제한된 멘션 정책, 멘션 마커 및 멘션 텍스트 도우미 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-inbound` 또는 `plugin-sdk/channel-outbound`을 사용하십시오. |
    | `plugin-sdk/channel-pairing-paths` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-pairing`을 사용하십시오. |
    | `plugin-sdk/channel-reply-options-runtime` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`을 사용하십시오. |
    | `plugin-sdk/channel-streaming` | 사용 중단된 호환성 퍼사드입니다. `plugin-sdk/channel-outbound`을 사용하십시오. |
    | `plugin-sdk/channel-send-result` | 응답 결과 유형 |
    | `plugin-sdk/channel-actions` | 채널 메시지 작업 도우미와 플러그인 호환성을 위해 유지되는 사용 중단된 네이티브 스키마 도우미 |
    | `plugin-sdk/channel-route` | 공유 경로 정규화, 파서 기반 대상 확인, 스레드 ID 문자열화, 중복 제거/축약 경로 키, 구문 분석된 대상 유형 및 경로/대상 비교 도우미 |
    | `plugin-sdk/channel-targets` | 대상 구문 분석 도우미입니다. 경로 비교 호출자는 `plugin-sdk/channel-route`을 사용해야 합니다. |
    | `plugin-sdk/channel-contract` | 채널 계약 유형 |
    | `plugin-sdk/channel-feedback` | 피드백/반응 연결 |
  </Accordion>

사용 중단된 채널 도우미 계열은 게시된 플러그인과의
호환성을 위해서만 계속 제공됩니다. 제거 계획은 외부 플러그인
마이그레이션 기간 동안 이를 유지하고, 저장소/번들 플러그인은 `channel-inbound` 및
`channel-outbound`을 계속 사용하도록 한 다음, 다음 주요
SDK 정리에서 호환성 하위 경로를 제거하는 것입니다. 이는 기존 채널 메시지/런타임, 채널
스트리밍, 직접 DM 액세스, 분리된 인바운드 도우미, 응답 옵션
및 페어링 경로 계열에 적용됩니다.

  <Accordion title="공급자 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 설정, 카탈로그 검색 및 런타임 모델 준비를 위해 지원되는 LM Studio 공급자 퍼사드 |
    | `plugin-sdk/lmstudio-runtime` | 로컬 서버 기본값, 모델 검색, 요청 헤더 및 로드된 모델 도우미를 위해 지원되는 LM Studio 런타임 퍼사드 |
    | `plugin-sdk/provider-setup` | 엄선된 로컬/자체 호스팅 공급자 설정 도우미 |
    | `plugin-sdk/self-hosted-provider-setup` | 더 이상 사용되지 않는 OpenAI 호환 자체 호스팅 설정 도우미입니다. `plugin-sdk/provider-setup` 또는 Plugin 소유 설정 도우미를 사용하십시오 |
    | `plugin-sdk/cli-backend` | CLI 백엔드 기본값 + 감시 타이머 상수 |
    | `plugin-sdk/provider-auth-runtime` | 공급자 인증 런타임 도우미: OAuth 루프백 흐름, 토큰 교환, 인증 유지 및 API 키 확인 |
    | `plugin-sdk/provider-oauth-runtime` | 일반 공급자 OAuth 콜백 유형, 콜백 페이지 렌더링, PKCE/상태 도우미, 권한 부여 입력 파싱, 토큰 만료 도우미 및 중단 도우미 |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 등의 API 키 온보딩/프로필 쓰기 도우미 |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth 인증 결과 빌더 |
    | `plugin-sdk/provider-env-vars` | 공급자 인증 환경 변수 조회 도우미 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex 인증 가져오기 도우미, 더 이상 사용되지 않는 `resolveOpenClawAgentDir` 호환성 내보내기 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 재생 정책 빌더, 공급자 엔드포인트 도우미 및 공유 모델 ID 정규화 도우미 |
    | `plugin-sdk/provider-catalog-live-runtime` | 보호된 `/models` 방식 검색을 위한 라이브 공급자 모델 카탈로그 도우미: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, 모델 ID 필터링, TTL 캐시 및 정적 대체 경로 |
    | `plugin-sdk/provider-catalog-runtime` | 계약 테스트용 공급자 카탈로그 확장 런타임 훅 및 Plugin 공급자 레지스트리 연결부 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 일반 공급자 HTTP/엔드포인트 기능 도우미, 공급자 HTTP 오류 및 오디오 전사 멀티파트 양식 도우미 |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` 및 `WebFetchProviderPlugin` 등의 제한된 웹 가져오기 구성/선택 계약 도우미 |
    | `plugin-sdk/provider-web-fetch` | 웹 가져오기 공급자 등록/캐시 도우미 |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 활성화 연결이 필요하지 않은 공급자를 위한 제한된 웹 검색 구성/자격 증명 도우미 |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 및 범위가 지정된 자격 증명 설정자/접근자 등의 제한된 웹 검색 구성/자격 증명 계약 도우미 |
    | `plugin-sdk/provider-web-search` | 웹 검색 공급자 등록/캐시/런타임 도우미 |
    | `plugin-sdk/embedding-providers` | `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` 및 `listEmbeddingProviders(...)`를 포함한 일반 임베딩 공급자 유형 및 읽기 도우미. 매니페스트 소유권을 적용하도록 Plugin은 `api.registerEmbeddingProvider(...)`을 통해 공급자를 등록합니다 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` 및 DeepSeek/Gemini/OpenAI 스키마 정리 + 진단 |
    | `plugin-sdk/provider-usage` | 공급자 사용량 스냅샷 유형, 공유 사용량 가져오기 도우미 및 `fetchClaudeUsage` 등의 공급자 가져오기 함수 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 유형, 일반 텍스트 도구 호출 호환성 및 공유 Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI 래퍼 도우미 |
    | `plugin-sdk/provider-stream-shared` | `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` 및 Anthropic/DeepSeek/OpenAI 호환 스트림 유틸리티를 포함한 공개 공유 공급자 스트림 래퍼 도우미 |
    | `plugin-sdk/provider-transport-runtime` | 보호된 가져오기, 도구 결과 텍스트 추출, 전송 메시지 변환 및 쓰기 가능한 전송 이벤트 스트림 등의 네이티브 공급자 전송 도우미 |
    | `plugin-sdk/provider-onboard` | 온보딩 구성 패치 도우미 |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 싱글턴/맵/캐시 도우미 |
    | `plugin-sdk/group-activation` | 제한된 그룹 활성화 모드 및 명령 파싱 도우미 |
  </Accordion>

공급자 사용량 스냅샷은 일반적으로 하나 이상의 할당량 `windows`을 보고하며, 각각
레이블, 사용 비율 및 선택적 재설정 시간을 포함합니다. 재설정 가능한 할당량 기간 대신 잔액 또는
계정 상태 텍스트를 제공하는 공급자는 비율을 임의로 생성하지 말고 빈 `windows` 배열과 함께
`summary`을 반환해야 합니다.
OpenClaw는 해당 요약 텍스트를 상태 출력에 표시합니다. 사용량 엔드포인트가 실패했거나 사용할 수 있는
사용량 데이터를 반환하지 않은 경우에만 `error`을 사용하십시오.

  <Accordion title="인증 및 보안 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/command-auth` | 더 이상 사용되지 않는 광범위한 명령 권한 부여 표면(`resolveControlCommandGate`, 동적 인수 메뉴 형식을 포함한 명령 레지스트리 도우미, 발신자 권한 부여 도우미). 채널 수신/런타임 권한 부여 또는 명령 상태 도우미를 사용하십시오 |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` 및 `buildHelpMessage` 등의 명령/도움말 메시지 빌더 |
    | `plugin-sdk/approval-auth-runtime` | 승인자 확인 및 동일 채팅 작업 인증 도우미 |
    | `plugin-sdk/approval-client-runtime` | 네이티브 실행 승인 프로필/필터 도우미 |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 기능/전달 어댑터 |
    | `plugin-sdk/approval-gateway-runtime` | 공유 승인 Gateway 확인자 |
    | `plugin-sdk/approval-reference-runtime` | 전송 제약이 있는 승인 콜백을 위한 결정론적 영속 로케이터 도우미 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 빈번히 호출되는 채널 진입점을 위한 경량 네이티브 승인 어댑터 로딩 도우미 |
    | `plugin-sdk/approval-handler-runtime` | 더 광범위한 승인 처리기 런타임 도우미. 더 제한된 어댑터/Gateway 연결부로 충분한 경우 이를 우선 사용하십시오 |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상, 계정 바인딩, 경로 게이트, 전달 대체 경로 및 로컬 네이티브 실행 프롬프트 억제 도우미 |
    | `plugin-sdk/approval-reaction-runtime` | 하드코딩된 승인 반응 바인딩, 반응 프롬프트 페이로드, 반응 대상 저장소, 반응 힌트 텍스트 도우미 및 로컬 네이티브 실행 프롬프트 억제용 호환성 내보내기 |
    | `plugin-sdk/approval-reply-runtime` | 실행/Plugin 승인 응답 페이로드 도우미 |
    | `plugin-sdk/approval-runtime` | 실행/Plugin 승인 페이로드 도우미, 승인 기능 빌더, 승인 인증/프로필 도우미, 네이티브 승인 라우팅/런타임 도우미 및 `formatApprovalDisplayPath` 등의 구조화된 승인 표시 도우미 |
    | `plugin-sdk/reply-dedupe` | 더 이상 사용되지 않는 제한된 수신 응답 중복 제거 재설정 도우미 |
    | `plugin-sdk/command-auth-native` | 네이티브 명령 인증, 동적 인수 메뉴 형식 및 네이티브 세션 대상 도우미 |
    | `plugin-sdk/command-detection` | 공유 명령 감지 도우미 |
    | `plugin-sdk/command-primitives-runtime` | 빈번히 호출되는 채널 경로를 위한 경량 명령 텍스트 조건자 |
    | `plugin-sdk/command-surface` | 명령 본문 정규화 및 명령 표면 도우미 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 비공개 채널 및 Web UI 장치 코드 페어링을 위한 지연 공급자 인증 로그인 흐름 도우미 |
    | `plugin-sdk/channel-secret-runtime` | 더 이상 사용되지 않는 광범위한 비밀 계약 표면(`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, 비밀 대상 유형). 아래의 집중된 하위 경로를 우선 사용하십시오 |
    | `plugin-sdk/channel-secret-basic-runtime` | TTS 이외의 채널/Plugin 비밀 표면을 위한 제한된 비밀 계약 내보내기 및 대상 레지스트리 빌더 |
    | `plugin-sdk/channel-secret-tts-runtime` | 제한된 중첩 채널 TTS 비밀 할당 도우미 |
    | `plugin-sdk/secret-ref-runtime` | 비밀 계약/구성 파싱을 위한 제한된 SecretRef 유형 지정, 확인 및 계획 대상 경로 조회 |
    | `plugin-sdk/secret-provider-integration` | 외부 비밀 공급자 사전 설정을 게시하는 Plugin을 위한 유형 전용 SecretRef 공급자 통합 매니페스트 및 사전 설정 계약 |
    | `plugin-sdk/security-runtime` | 신뢰, DM 게이팅, 생성 전용 쓰기, 동기/비동기 원자적 파일 교체, 동일 디렉터리 임시 파일 쓰기, 장치 간 이동 대체 경로, 비공개 파일 저장소 도우미, 심볼릭 링크 상위 경로 보호, 외부 콘텐츠, 민감한 텍스트 가림 처리, 상수 시간 비밀 비교 및 비밀 수집 도우미를 포함한 루트 경계 파일/경로 도우미의 더 이상 사용되지 않는 광범위한 배럴. 집중된 보안/SSRF/비밀 하위 경로를 우선 사용하십시오 |
    | `plugin-sdk/ssrf-policy` | 호스트 허용 목록 및 사설 네트워크 SSRF 정책 도우미 |
    | `plugin-sdk/ssrf-dispatcher` | 광범위한 인프라 런타임 표면이 없는 제한된 고정 디스패처 도우미 |
    | `plugin-sdk/ssrf-runtime` | 고정 디스패처, SSRF 보호 가져오기, SSRF 오류 및 SSRF 정책 도우미 |
    | `plugin-sdk/secret-input` | 비밀 입력 파싱 도우미 |
    | `plugin-sdk/webhook-ingress` | Webhook 요청/대상 도우미 및 원시 웹소켓/본문 강제 변환 |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/시간 제한 도우미 및 추적되는 승인 후 처리를 위한 `runDetachedWebhookWork` |
  </Accordion>

  <Accordion title="런타임 및 스토리지 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/runtime` | 런타임/로깅/백업 도우미, Plugin 설치 경로 경고 및 프로세스 도우미 |
    | `plugin-sdk/runtime-env` | 범위가 좁은 런타임 환경, 로거, 시간 제한, 재시도 및 백오프 도우미 |
    | `plugin-sdk/browser-config` | 정규화된 프로필/기본값, CDP URL 구문 분석 및 브라우저 제어 인증 도우미를 위한 지원 브라우저 구성 퍼사드 |
    | `plugin-sdk/agent-harness-task-runtime` | 호스트가 발급한 작업 범위를 사용하는 하네스 기반 에이전트를 위한 범용 작업 수명 주기 및 완료 전달 도우미 |
    | `plugin-sdk/codex-mcp-projection` | 사용자 MCP 서버 구성을 Codex 스레드 구성에 투영하기 위해 예약된 번들 Codex 도우미. 서드 파티 Plugin용이 아님 |
    | `plugin-sdk/codex-native-task-runtime` | 네이티브 작업 미러/런타임 연결을 위한 저장소 로컬 번들 Codex 도우미. 패키지 내보내기가 아님 |
    | `plugin-sdk/channel-runtime-context` | 범용 채널 런타임 컨텍스트 등록 및 조회 도우미 |
    | `plugin-sdk/matrix` | 이전 서드 파티 채널 패키지를 위한 사용 중단된 Matrix 호환성 퍼사드. 새 Plugin은 `plugin-sdk/run-command`을 직접 가져와야 함 |
    | `plugin-sdk/mattermost` | 이전 서드 파티 채널 패키지를 위한 사용 중단된 Mattermost 호환성 퍼사드. 새 Plugin은 범용 SDK 하위 경로를 직접 가져와야 함 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Plugin 명령/훅/HTTP/대화형 도우미를 위한 사용 중단된 광범위한 배럴. 용도별 Plugin 런타임 하위 경로 권장 |
    | `plugin-sdk/hook-runtime` | Webhook/내부 훅 파이프라인 도우미를 위한 사용 중단된 광범위한 배럴. 용도별 훅/Plugin 런타임 하위 경로 권장 |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 등의 지연 런타임 가져오기/바인딩 도우미 |
    | `plugin-sdk/process-runtime` | 프로세스 실행 도우미 |
    | `plugin-sdk/node-host` | Node 호스트 실행 파일 확인 및 PTY 재개 도우미 |
    | `plugin-sdk/cli-runtime` | CLI 서식 지정, 대기, 버전, 인수 호출 및 지연 명령 그룹 도우미를 위한 사용 중단된 광범위한 배럴. 용도별 CLI/런타임 하위 경로 권장 |
    | `plugin-sdk/qa-runner-runtime` | CLI 명령 표면을 통해 Plugin QA 시나리오를 노출하는 지원 퍼사드 |
    | `plugin-sdk/tts-runtime` | 텍스트 음성 변환 구성 스키마 및 런타임 도우미를 위한 지원 퍼사드 |
    | `plugin-sdk/gateway-method-runtime` | `contracts.gatewayMethodDispatch: ["authenticated-request"]`을 선언하는 Plugin HTTP 경로를 위해 예약된 Gateway 메서드 디스패치 도우미 |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트, 이벤트 루프 준비 완료 클라이언트 시작 도우미, Gateway CLI RPC, Gateway 프로토콜 오류, 공지된 LAN 호스트 확인 및 채널 상태 패치 도우미 |
    | `plugin-sdk/config-contracts` | `OpenClawConfig` 및 채널/제공자 구성 유형과 같은 Plugin 구성 형태를 위한 용도별 유형 전용 구성 표면 |
    | `plugin-sdk/plugin-config-runtime` | `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject`, `resolveLivePluginConfigObject` 등의 런타임 Plugin 구성 도우미 |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile`, `logConfigUpdated` 등의 트랜잭션 구성 변경 도우미 |
    | `plugin-sdk/message-tool-delivery-hints` | 공유 메시지 도구 전달 메타데이터 힌트 문자열 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` 및 테스트 스냅샷 설정자 등의 현재 프로세스 구성 스냅샷 도우미 |
    | `plugin-sdk/text-autolink-runtime` | 광범위한 텍스트 배럴을 사용하지 않는 파일 참조 자동 링크 감지 |
    | `plugin-sdk/reply-runtime` | 공유 인바운드/응답 런타임 도우미, 청킹, 디스패치, Heartbeat, 응답 플래너 |
    | `plugin-sdk/reply-dispatch-runtime` | 범위가 좁은 응답 디스패치/완료 및 대화 레이블 도우미 |
    | `plugin-sdk/reply-history` | 공유 단기 응답 기록 도우미. 새 메시지 턴 코드는 `createChannelHistoryWindow`을 사용해야 하며, 하위 수준 맵 도우미는 사용 중단된 호환성 내보내기로만 유지됨 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 범위가 좁은 텍스트/마크다운 청킹 도우미 |
    | `plugin-sdk/session-store-runtime` | 세션 워크플로 도우미(`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), 복구/수명 주기 도우미(`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), 전환기 `sessionFile` 값을 위한 마커 도우미, 세션 ID별로 범위가 제한된 최근 사용자/어시스턴트 트랜스크립트 텍스트 읽기, 세션 저장소 경로/세션 키 도우미 및 업데이트 시각 읽기. 광범위한 구성 쓰기/유지 관리 가져오기는 제외 |
    | `plugin-sdk/session-transcript-runtime` | 트랜스크립트 ID, 범위 지정 대상/읽기/쓰기 도우미, 표시 메시지 항목 투영, 업데이트 게시, 쓰기 잠금 및 트랜스크립트 메모리 적중 키 |
    | `plugin-sdk/sqlite-runtime` | 데이터베이스 수명 주기 제어를 제외한 자사 런타임용 용도별 SQLite 에이전트 스키마, 경로 및 트랜잭션 도우미 |
    | `plugin-sdk/cron-store-runtime` | Cron 저장소 경로/로드/저장 도우미 |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 도우미 |
    | `plugin-sdk/plugin-state-runtime` | Plugin 소유 데이터베이스를 위한 Plugin 사이드카 SQLite 키 기반 상태 유형과 중앙 집중식 연결 pragma, 검증된 WAL 유지 관리 및 원자적 STRICT 스키마 마이그레이션 도우미 |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 등의 경로/세션 키/계정 바인딩 도우미 |
    | `plugin-sdk/status-helpers` | 공유 채널/계정 상태 요약 도우미, 런타임 상태 기본값 및 문제 메타데이터 도우미 |
    | `plugin-sdk/target-resolver-runtime` | 공유 대상 확인 도우미 |
    | `plugin-sdk/string-normalization-runtime` | 슬러그/문자열 정규화 도우미 |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | 정규화된 stdout/stderr 결과를 제공하는 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공통 도구/CLI 매개변수 판독기 |
    | `plugin-sdk/tool-plugin` | 단순한 유형 지정 에이전트 도구 Plugin을 정의하고 매니페스트 생성을 위한 정적 메타데이터 노출 |
    | `plugin-sdk/tool-payload` | 도구 결과 객체에서 정규화된 페이로드 추출 |
    | `plugin-sdk/tool-send` | 도구 인수에서 표준 전송 대상 필드 추출 |
    | `plugin-sdk/sandbox` | 즉시 실패 실행 명령 사전 검사를 포함한 샌드박스 백엔드 유형 및 SSH/OpenShell 명령 도우미 |
    | `plugin-sdk/temp-path` | 공유 임시 다운로드 경로 도우미 및 비공개 보안 임시 작업 공간 |
    | `plugin-sdk/logging-core` | 하위 시스템 로거 및 민감 정보 제거 도우미 |
    | `plugin-sdk/markdown-table-runtime` | 마크다운 표 모드 및 변환 도우미 |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`, `resolveAgentMaxConcurrent` 등의 모델/세션 재정의 도우미 |
    | `plugin-sdk/talk-config-runtime` | Talk 제공자 구성 확인 도우미 |
    | `plugin-sdk/json-store` | 소규모 JSON 상태 읽기/쓰기 도우미 |
    | `plugin-sdk/json-unsafe-integers` | 안전하지 않은 정수 리터럴을 문자열로 보존하는 JSON 구문 분석 도우미 |
    | `plugin-sdk/file-lock` | 재진입 가능 파일 잠금 도우미 |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 중복 제거 캐시 도우미 |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 응답 디스패치 도우미 |
    | `plugin-sdk/acp-runtime-backend` | 시작 시 로드되는 Plugin을 위한 경량 ACP 백엔드 등록 및 응답 디스패치 도우미 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 수명 주기 시작 가져오기를 사용하지 않는 읽기 전용 ACP 바인딩 확인 |
    | `plugin-sdk/agent-config-primitives` | 사용 중단된 에이전트 런타임 구성 스키마 기본 요소. 유지 관리되는 Plugin 소유 표면에서 스키마 기본 요소를 가져올 것 |
    | `plugin-sdk/boolean-param` | 느슨한 불리언 매개변수 판독기 |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 일치 확인 도우미 |
    | `plugin-sdk/device-bootstrap` | `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES`을 포함한 기기 부트스트랩 및 페어링 토큰 도우미 |
    | `plugin-sdk/extension-shared` | 공유 수동 채널, 상태 및 앰비언트 프록시 도우미 기본 요소 |
    | `plugin-sdk/models-provider-runtime` | `/models` 명령/제공자 응답 도우미 |
    | `plugin-sdk/skill-commands-runtime` | Skill 명령 목록 도우미 |
    | `plugin-sdk/native-command-registry` | 네이티브 명령 레지스트리/빌드/직렬화 도우미 |
    | `plugin-sdk/agent-harness` | 하위 수준 에이전트 하네스를 위한 실험적 신뢰 Plugin 표면: 하네스 유형, 활성 실행 조정/중단 도우미, OpenClaw 도구 브리지 도우미, 런타임 계획 도구 정책 도우미, 터미널 결과 분류, 도구 진행 상황 서식 지정/세부 정보 도우미 및 시도 결과 유틸리티 |
    | `plugin-sdk/provider-zai-endpoint` | 사용 중단된 Z.AI 제공자 소유 엔드포인트 감지 퍼사드. Z.AI Plugin 공개 API를 사용할 것 |
    | `plugin-sdk/async-lock-runtime` | 소규모 런타임 상태 파일을 위한 프로세스 로컬 비동기 잠금 도우미 |
    | `plugin-sdk/channel-activity-runtime` | 채널 활동 텔레메트리 도우미 |
    | `plugin-sdk/concurrency-runtime` | 범위가 제한된 비동기 작업 동시성 도우미 |
    | `plugin-sdk/dedupe-runtime` | 메모리 내 및 영구 저장소 기반 중복 제거 캐시 도우미 |
    | `plugin-sdk/delivery-queue-runtime` | 아웃바운드 보류 전달 비우기 도우미 |
    | `plugin-sdk/file-access-runtime` | 안전한 로컬 파일 및 미디어 소스 경로 도우미 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 깨우기, 이벤트 및 가시성 도우미 |
    | `plugin-sdk/expect-runtime` | 증명 가능한 런타임 불변 조건을 위한 필수 값 어설션 도우미 |
    | `plugin-sdk/number-runtime` | 숫자 강제 변환 도우미 |
    | `plugin-sdk/secure-random-runtime` | 보안 토큰/UUID 도우미 |
    | `plugin-sdk/system-event-runtime` | 시스템 이벤트 큐 도우미 |
    | `plugin-sdk/transport-ready-runtime` | 전송 준비 상태 대기 도우미 |
    | `plugin-sdk/exec-approvals-runtime` | 광범위한 인프라 런타임 배럴을 사용하지 않는 실행 승인 정책 파일 도우미 |
    | `plugin-sdk/infra-runtime` | 사용 중단된 호환성 심. 위의 용도별 런타임 하위 경로를 사용할 것 |
    | `plugin-sdk/collection-runtime` | 범위가 제한된 소규모 캐시 도우미 |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그, 이벤트 및 추적 컨텍스트 도우미 |
    | `plugin-sdk/error-runtime` | 오류 그래프, 서식 지정, 공유 오류 분류 도우미, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, 프록시, EnvHttpProxyAgent 옵션 및 고정 조회 도우미 |
    | `plugin-sdk/runtime-fetch` | 프록시/보호된 fetch 가져오기를 사용하지 않는 디스패처 인식 런타임 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 광범위한 미디어 런타임 표면을 사용하지 않는 인라인 이미지 데이터 URL 정리 및 시그니처 감지 도우미 |
    | `plugin-sdk/response-limit-runtime` | 광범위한 미디어 런타임 표면을 사용하지 않는 바이트, 유휴 시간 및 기한 제한 응답 본문 판독기 |
    | `plugin-sdk/session-binding-runtime` | 구성된 바인딩 라우팅 또는 페어링 저장소를 사용하지 않는 현재 대화 바인딩 상태 |
    | `plugin-sdk/context-visibility-runtime` | 광범위한 구성/보안 가져오기를 사용하지 않는 컨텍스트 가시성 확인 및 보충 컨텍스트 필터링 |
    | `plugin-sdk/string-coerce-runtime` | 마크다운/로깅 가져오기를 사용하지 않는 범위가 좁은 기본 레코드/문자열 강제 변환 및 정규화 도우미 |
    | `plugin-sdk/html-entity-runtime` | 광범위한 텍스트 유틸리티를 사용하지 않는 단일 패스 세미콜론 종결 HTML5 엔터티 디코딩 |
    | `plugin-sdk/text-utility-runtime` | 5개 엔터티 HTML 이스케이프를 포함한 하위 수준 텍스트 및 경로 도우미 |
    | `plugin-sdk/widget-html` | 독립형 HTML 위젯을 위한 전체 문서 감지, 크기 검증 및 도구 입력 오류 |
    | `plugin-sdk/host-runtime` | 호스트 이름 및 SCP 호스트 정규화 도우미 |
    | `plugin-sdk/retry-runtime` | 재시도 구성 및 재시도 실행기 도우미 |
    | `plugin-sdk/agent-runtime` | `resolveAgentDir`, `resolveDefaultAgentDir` 및 사용 중단된 `resolveOpenClawAgentDir` 호환성 내보내기를 포함한 에이전트 디렉터리/ID/작업 공간 도우미용 사용 중단된 광범위한 배럴. 용도별 에이전트/런타임 하위 경로 권장 |
    | `plugin-sdk/directory-runtime` | 구성 기반 디렉터리 조회/중복 제거 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="기능 및 테스트 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` 및 사용 중단된 `fetchRemoteMedia`을 포함하는 사용 중단된 광범위한 미디어 배럴입니다. `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` 및 기능 런타임 하위 경로를 우선 사용하고, URL을 OpenClaw 미디어로 변환해야 하는 경우 버퍼 읽기보다 저장소 헬퍼를 우선 사용하십시오. |
    | `plugin-sdk/media-mime` | 범위가 좁은 MIME 정규화, 파일 확장자 매핑, MIME 감지 및 미디어 종류 헬퍼 |
    | `plugin-sdk/media-store` | `saveMediaBuffer` 및 `saveMediaStream` 같은 범위가 좁은 미디어 저장소 헬퍼 |
    | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 장애 조치 헬퍼, 후보 선택 및 모델 누락 메시지 |
    | `plugin-sdk/media-understanding` | 미디어 이해 공급자 유형과 공급자용 이미지/오디오/구조화 추출 헬퍼 내보내기 |
    | `plugin-sdk/text-chunking` | 발신 텍스트 및 오프셋 보존 범위 청킹, 마크다운 청킹/렌더링 헬퍼, 인용부호를 인식하는 HTML 태그 토큰화, 마크다운 표 변환, 지시문 태그 제거 및 안전한 텍스트 유틸리티 |
    | `plugin-sdk/speech` | 음성 공급자 유형과 공급자용 지시문, 레지스트리, 검증, OpenAI 호환 TTS 빌더 및 음성 헬퍼 내보내기 |
    | `plugin-sdk/speech-core` | 공유 음성 공급자 유형, 레지스트리, 지시문, 정규화 및 음성 헬퍼 내보내기 |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 공급자 유형, 레지스트리 헬퍼 및 공유 WebSocket 세션 헬퍼 |
    | `plugin-sdk/realtime-bootstrap-context` | 제한된 `IDENTITY.md`, `USER.md` 및 `SOUL.md` 컨텍스트 주입을 위한 실시간 프로필 부트스트랩 헬퍼 |
    | `plugin-sdk/realtime-voice` | 출력 활동 추적을 포함한 실시간 음성 공급자 유형, 레지스트리 헬퍼 및 공유 실시간 음성 동작 헬퍼 |
    | `plugin-sdk/image-generation` | 이미지 생성 공급자 유형과 이미지 자산/데이터 URL 헬퍼 및 OpenAI 호환 이미지 공급자 빌더 |
    | `plugin-sdk/image-generation-core` | 공유 이미지 생성 유형, 장애 조치, 인증 및 레지스트리 헬퍼 |
    | `plugin-sdk/music-generation` | 음악 생성 공급자/요청/결과 유형 |
    | `plugin-sdk/music-generation-core` | 사용 중단된 공유 음악 생성 유형, 장애 조치 헬퍼, 공급자 조회 및 모델 참조 구문 분석입니다. Plugin 소유 음악 공급자 표면을 우선 사용하십시오. |
    | `plugin-sdk/video-generation` | 동영상 생성 공급자/요청/결과 유형 |
    | `plugin-sdk/video-generation-core` | 공유 동영상 생성 유형, 장애 조치 헬퍼, 공급자 조회 및 모델 참조 구문 분석 |
    | `plugin-sdk/transcripts` | 공유 트랜스크립트 소스 공급자 유형, 레지스트리 헬퍼, 세션 설명자 및 발화 메타데이터 |
    | `plugin-sdk/webhook-targets` | Webhook 대상 레지스트리 및 경로 설치 헬퍼 |
    | `plugin-sdk/webhook-path` | 사용 중단된 호환성 별칭입니다. `plugin-sdk/webhook-ingress`을 사용하십시오. |
    | `plugin-sdk/web-media` | 공유 원격/로컬 미디어 로딩 헬퍼 |
    | `plugin-sdk/zod` | 사용 중단된 호환성 재내보내기입니다. `zod`에서 `zod`을 직접 가져오십시오. |
    | `plugin-sdk/plugin-test-api` | 저장소 테스트 헬퍼 브리지를 가져오지 않고 직접 Plugin 등록 단위 테스트를 수행하기 위한 저장소 로컬 최소 `createTestPluginApi` 헬퍼 |
    | `plugin-sdk/agent-runtime-test-contracts` | 인증, 전달, 대체, 도구 훅, 프롬프트 오버레이, 스키마 및 트랜스크립트 프로젝션 테스트를 위한 저장소 로컬 네이티브 에이전트 런타임 어댑터 계약 픽스처 |
    | `plugin-sdk/channel-test-helpers` | 일반 작업/설정/상태 계약, 디렉터리 어설션, 계정 시작 수명 주기, 전송 구성 스레딩, 런타임 모의 객체, 상태 문제, 발신 전달 및 훅 등록을 위한 저장소 로컬 채널 중심 테스트 헬퍼 |
    | `plugin-sdk/channel-target-testing` | 채널 테스트를 위한 저장소 로컬 공유 대상 해석 오류 사례 제품군 |
    | `plugin-sdk/channel-contract-testing` | 광범위한 테스트 배럴을 사용하지 않는 저장소 로컬의 범위가 좁은 채널 계약 테스트 헬퍼 |
    | `plugin-sdk/plugin-test-contracts` | 저장소 로컬 Plugin 패키지, 등록, 공개 아티팩트, 직접 가져오기, 런타임 API 및 가져오기 부작용 계약 헬퍼 |
    | `plugin-sdk/plugin-state-test-runtime` | 저장소 로컬 Plugin 상태 저장소, 수신 큐 및 상태 DB 테스트 헬퍼 |
    | `plugin-sdk/provider-test-contracts` | 저장소 로컬 공급자 런타임, 인증, 검색, 온보딩, 카탈로그, 마법사, 미디어 기능, 재생 정책, 실시간 STT 라이브 오디오, 웹 검색/가져오기 및 스트림 계약 헬퍼 |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http`을 실행하는 공급자 테스트를 위한 저장소 로컬 옵트인 Vitest HTTP/인증 모의 객체 |
    | `plugin-sdk/reply-payload-testing` | 응답 페이로드 픽스처에 메타데이터를 첨부하기 위한 저장소 로컬 헬퍼 |
    | `plugin-sdk/sqlite-runtime-testing` | 자사 테스트를 위한 저장소 로컬 SQLite 수명 주기 헬퍼 |
    | `plugin-sdk/test-fixtures` | 저장소 로컬 일반 CLI 런타임 캡처, 샌드박스 컨텍스트, 스킬 작성기, 에이전트 메시지, 시스템 이벤트, 모듈 다시 로드, 번들 Plugin 경로, 터미널 텍스트, 청킹, 인증 토큰 및 형식화된 사례 픽스처 |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` 팩터리 내부에서 사용하기 위한 저장소 로컬의 집중된 Node 기본 제공 모의 객체 헬퍼 |
  </Accordion>

  <Accordion title="메모리 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 사용 중단된 호환성 별칭입니다. `plugin-sdk/memory-host-core`을 사용하십시오. |
    | `plugin-sdk/memory-core-engine-runtime` | 사용 중단된 메모리 인덱스/검색 런타임 퍼사드입니다. 공급업체 중립적인 메모리 호스트 하위 경로를 우선 사용하십시오. |
    | `plugin-sdk/memory-core-host-embedding-registry` | 경량 메모리 임베딩 공급자 레지스트리 헬퍼 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 계약, 레지스트리 접근, 로컬 공급자 및 일반 배치/원격 헬퍼입니다. 이 표면의 `registerMemoryEmbeddingProvider`은 사용 중단되었습니다. 새 공급자에는 일반 임베딩 공급자 API를 사용하십시오. |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-multimodal` | 사용 중단된 메모리 호스트 멀티모달 헬퍼입니다. 공급업체 중립적인 메모리 호스트 하위 경로를 우선 사용하십시오. |
    | `plugin-sdk/memory-core-host-query` | 사용 중단된 메모리 호스트 쿼리 헬퍼입니다. 공급업체 중립적인 메모리 호스트 하위 경로를 우선 사용하십시오. |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 보안 비밀 헬퍼 |
    | `plugin-sdk/memory-core-host-events` | 사용 중단된 호환성 별칭입니다. `plugin-sdk/memory-host-events`을 사용하십시오. |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 헬퍼의 공급업체 중립적 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 헬퍼의 공급업체 중립적 별칭 |
    | `plugin-sdk/memory-host-files` | 사용 중단된 호환성 별칭입니다. `plugin-sdk/memory-core-host-runtime-files`을 사용하십시오. |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 Plugin을 위한 공유 관리형 마크다운 헬퍼 |
    | `plugin-sdk/memory-host-search` | 검색 관리자 접근을 위한 Active Memory 런타임 퍼사드 |
    | `plugin-sdk/memory-host-status` | 사용 중단된 호환성 별칭입니다. `plugin-sdk/memory-core-host-status`을 사용하십시오. |
  </Accordion>

  <Accordion title="예약된 번들 헬퍼 하위 경로">
    예약된 번들 헬퍼 SDK 하위 경로는 번들 Plugin 코드를 위한 범위가 좁은
    소유자별 표면입니다. 패키지 빌드와 별칭 지정의 결정성을 유지하기 위해
    SDK 인벤토리에서 추적되지만, 일반적인 Plugin 작성 API는 아닙니다.
    재사용 가능한 새 호스트 계약에는 `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime`,
    `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 하위 경로를 사용해야 합니다.

    | 하위 경로 | 소유자 및 목적 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 사용자 MCP 서버 구성을 Codex 앱 서버 스레드 구성에 프로젝션하기 위한 번들 Codex Plugin 헬퍼(예약된 패키지 내보내기) |
    | `plugin-sdk/codex-native-task-runtime` | Codex 앱 서버 네이티브 하위 에이전트를 OpenClaw 작업 상태에 미러링하기 위한 번들 Codex Plugin 헬퍼(저장소 로컬 전용, 패키지 내보내기 아님) |

  </Accordion>
</AccordionGroup>

## 관련 항목

- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
