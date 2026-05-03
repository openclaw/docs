---
read_when:
    - Plugin 가져오기에 적합한 plugin-sdk 하위 경로 선택
    - 번들 Plugin 하위 경로 및 헬퍼 인터페이스 감사
summary: 'Plugin SDK 하위 경로 카탈로그: 어떤 가져오기가 어디에 있는지 영역별로 그룹화'
title: Plugin SDK 하위 경로
x-i18n:
    generated_at: "2026-05-03T21:36:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK는 `openclaw/plugin-sdk/` 아래의 좁은 하위 경로 집합으로 노출됩니다.
  이 페이지는 목적별로 그룹화된 일반적으로 사용되는 하위 경로를 카탈로그화합니다. 생성된
  200개 이상의 하위 경로 전체 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.
  예약된 번들 Plugin 도우미 하위 경로도 거기에 표시되지만, 문서 페이지에서 명시적으로 승격하지 않는 한 구현
  세부 사항입니다. 유지관리자는 `pnpm plugins:boundary-report:summary`로 활성
  예약 도우미 하위 경로를 감사할 수 있습니다. 사용되지 않는 예약 도우미 export는 휴면 호환성 부채로
  공개 SDK에 남는 대신 CI 보고서를 실패시킵니다.

  Plugin 작성 가이드는 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참조하세요.

  ## Plugin 진입점

  | 하위 경로                                  | 주요 export                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | 레거시 Plugin 테스트를 위한 넓은 호환성 배럴입니다. 새 확장 테스트에는 초점이 맞춰진 테스트 하위 경로를 선호하세요                                                                     |
  | `plugin-sdk/plugin-test-api`              | 직접 Plugin 등록 단위 테스트를 위한 최소 `OpenClawPluginApi` mock 빌더                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | 인증 프로필, 전달 억제, fallback 분류, 도구 hook, prompt overlay, schema, transcript repair를 위한 네이티브 agent-runtime adapter 계약 fixture |
  | `plugin-sdk/channel-test-helpers`         | 채널 account 생명주기, directory, send-config, runtime mock, hook, 번들 채널 entry, envelope timestamp, pairing reply, 범용 채널 계약 테스트 도우미   |
  | `plugin-sdk/channel-target-testing`       | 공유 채널 target-resolution 오류 사례 테스트 suite                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Plugin 등록, package manifest, public artifact, runtime API, import side-effect, direct import 계약 도우미                                                  |
  | `plugin-sdk/plugin-test-runtime`          | 테스트를 위한 Plugin runtime, registry, provider-registration, setup-wizard, runtime task-flow fixture                                                                      |
  | `plugin-sdk/provider-test-contracts`      | provider runtime, auth, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch, wizard 계약 도우미                 |
  | `plugin-sdk/provider-http-test-mocks`     | `plugin-sdk/provider-http`를 실행하는 provider 테스트를 위한 opt-in Vitest HTTP/auth mock                                                                                    |
  | `plugin-sdk/test-env`                     | 테스트 환경, fetch/network, disposable HTTP server, incoming request, live-test, temporary filesystem, time-control fixture                                        |
  | `plugin-sdk/test-fixtures`                | 범용 CLI, sandbox, skill, agent-message, system-event, module reload, 번들 Plugin path, terminal, chunking, auth-token, typed-case 테스트 fixture                   |
  | `plugin-sdk/test-node-mocks`              | Vitest `vi.mock("node:*")` factory 내부에서 사용하기 위한 초점이 맞춰진 Node builtin mock 도우미                                                                                        |
  | `plugin-sdk/migration`                    | `createMigrationItem`, reason constant, item status marker, redaction helper, `summarizeMigrationItems` 같은 migration provider item 도우미                       |
  | `plugin-sdk/migration-runtime`            | `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, `writeMigrationReport` 같은 runtime migration 도우미                                                    |

  <AccordionGroup>
  <Accordion title="채널 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod schema export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공유 setup wizard 도우미, allowlist prompt, setup status 빌더 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 account config/action-gate 도우미, default-account fallback 도우미 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 도우미 |
    | `plugin-sdk/account-resolution` | account lookup + default-fallback 도우미 |
    | `plugin-sdk/account-helpers` | 좁은 account-list/account-action 도우미 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 공유 채널 config schema primitive와 Zod 및 직접 JSON/TypeBox 빌더 |
    | `plugin-sdk/bundled-channel-config-schema` | 유지관리되는 번들 Plugin 전용 번들 OpenClaw 채널 config schema |
    | `plugin-sdk/channel-config-schema-legacy` | bundled-channel config schema를 위한 더 이상 사용되지 않는 호환성 alias |
    | `plugin-sdk/telegram-command-config` | 번들 계약 fallback이 있는 Telegram custom-command 정규화/검증 도우미 |
    | `plugin-sdk/command-gating` | 좁은 command authorization gate 도우미 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, draft stream 생명주기/마무리 도우미 |
    | `plugin-sdk/inbound-envelope` | 공유 inbound route + envelope 빌더 도우미 |
    | `plugin-sdk/inbound-reply-dispatch` | 공유 inbound record-and-dispatch 도우미 |
    | `plugin-sdk/messaging-targets` | target parsing/matching 도우미 |
    | `plugin-sdk/outbound-media` | 공유 outbound media loading 도우미 |
    | `plugin-sdk/outbound-send-deps` | 채널 adapter를 위한 경량 outbound send dependency lookup |
    | `plugin-sdk/outbound-runtime` | outbound delivery, identity, send delegate, session, formatting, payload planning 도우미 |
    | `plugin-sdk/poll-runtime` | 좁은 poll 정규화 도우미 |
    | `plugin-sdk/thread-bindings-runtime` | thread-binding 생명주기 및 adapter 도우미 |
    | `plugin-sdk/agent-media-payload` | 레거시 agent media payload 빌더 |
    | `plugin-sdk/conversation-runtime` | conversation/thread binding, pairing, configured-binding 도우미 |
    | `plugin-sdk/runtime-config-snapshot` | runtime config snapshot 도우미 |
    | `plugin-sdk/runtime-group-policy` | runtime group-policy resolution 도우미 |
    | `plugin-sdk/channel-status` | 공유 채널 status snapshot/summary 도우미 |
    | `plugin-sdk/channel-config-primitives` | 좁은 채널 config-schema primitive |
    | `plugin-sdk/channel-config-writes` | 채널 config-write authorization 도우미 |
    | `plugin-sdk/channel-plugin-common` | 공유 채널 Plugin prelude export |
    | `plugin-sdk/allowlist-config-edit` | allowlist config edit/read 도우미 |
    | `plugin-sdk/group-access` | 공유 group-access decision 도우미 |
    | `plugin-sdk/direct-dm` | 공유 direct-DM auth/guard 도우미 |
    | `plugin-sdk/discord` | 게시된 `@openclaw/discord@2026.3.13` 및 추적되는 owner 호환성을 위한 더 이상 사용되지 않는 Discord 호환성 facade입니다. 새 Plugin은 범용 채널 SDK 하위 경로를 사용해야 합니다 |
    | `plugin-sdk/telegram-account` | 추적되는 owner 호환성을 위한 더 이상 사용되지 않는 Telegram account-resolution 호환성 facade입니다. 새 Plugin은 주입된 runtime 도우미 또는 범용 채널 SDK 하위 경로를 사용해야 합니다 |
    | `plugin-sdk/zalouser` | sender command authorization을 아직 import하는 게시된 Lark/Zalo package를 위한 더 이상 사용되지 않는 Zalo Personal 호환성 facade입니다. 새 Plugin은 `plugin-sdk/command-auth`를 사용해야 합니다 |
    | `plugin-sdk/interactive-runtime` | 의미론적 message presentation, delivery, 레거시 interactive reply 도우미. [메시지 표시](/ko/plugins/message-presentation)를 참조하세요 |
    | `plugin-sdk/channel-inbound` | inbound debounce, mention matching, mention-policy 도우미, envelope 도우미를 위한 호환성 배럴 |
    | `plugin-sdk/channel-inbound-debounce` | 좁은 inbound debounce 도우미 |
    | `plugin-sdk/channel-mention-gating` | 더 넓은 inbound runtime surface 없이 제공되는 좁은 mention-policy, mention marker, mention text 도우미 |
    | `plugin-sdk/channel-envelope` | 좁은 inbound envelope formatting 도우미 |
    | `plugin-sdk/channel-location` | 채널 location context 및 formatting 도우미 |
    | `plugin-sdk/channel-logging` | inbound drop 및 typing/ack failure를 위한 채널 logging 도우미 |
    | `plugin-sdk/channel-send-result` | reply result type |
    | `plugin-sdk/channel-actions` | 채널 message-action 도우미와 Plugin 호환성을 위해 유지되는 더 이상 사용되지 않는 native schema 도우미 |
    | `plugin-sdk/channel-route` | 공유 route 정규화, parser-driven target resolution, thread-id stringification, dedupe/compact route key, parsed-target type, route/target 비교 도우미 |
    | `plugin-sdk/channel-targets` | target parsing 도우미. route 비교 호출자는 `plugin-sdk/channel-route`를 사용해야 합니다 |
    | `plugin-sdk/channel-contract` | 채널 계약 type |
    | `plugin-sdk/channel-feedback` | feedback/reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, secret target type 같은 좁은 secret-contract 도우미 |
  </Accordion>

  <Accordion title="Provider 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 설정, 카탈로그 탐색, 런타임 모델 준비를 위한 지원되는 LM Studio Provider facade |
    | `plugin-sdk/lmstudio-runtime` | 로컬 서버 기본값, 모델 탐색, 요청 헤더, 로드된 모델 헬퍼를 위한 지원되는 LM Studio 런타임 facade |
    | `plugin-sdk/provider-setup` | 선별된 로컬/자체 호스팅 Provider 설정 헬퍼 |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 자체 호스팅 Provider 설정에 특화된 헬퍼 |
    | `plugin-sdk/cli-backend` | CLI 백엔드 기본값 + watchdog 상수 |
    | `plugin-sdk/provider-auth-runtime` | Provider 플러그인을 위한 런타임 API 키 해석 헬퍼 |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 온보딩/프로필 쓰기 헬퍼 |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth 인증 결과 빌더 |
    | `plugin-sdk/provider-auth-login` | Provider 플러그인을 위한 공유 대화형 로그인 헬퍼 |
    | `plugin-sdk/provider-env-vars` | Provider 인증 환경 변수 조회 헬퍼 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 재생 정책 빌더, Provider 엔드포인트 헬퍼, `normalizeNativeXaiModelId` 같은 모델 ID 정규화 헬퍼 |
    | `plugin-sdk/provider-catalog-runtime` | 계약 테스트를 위한 Provider 카탈로그 보강 런타임 훅 및 Plugin Provider 레지스트리 seam |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 범용 Provider HTTP/엔드포인트 기능 헬퍼, Provider HTTP 오류, 오디오 전사 multipart form 헬퍼 |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig` 및 `WebFetchProviderPlugin` 같은 좁은 웹 가져오기 구성/선택 계약 헬퍼 |
    | `plugin-sdk/provider-web-fetch` | 웹 가져오기 Provider 등록/캐시 헬퍼 |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 활성화 배선이 필요 없는 Provider를 위한 좁은 웹 검색 구성/자격 증명 헬퍼 |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위가 지정된 자격 증명 setter/getter 같은 좁은 웹 검색 구성/자격 증명 계약 헬퍼 |
    | `plugin-sdk/provider-web-search` | 웹 검색 Provider 등록/캐시/런타임 헬퍼 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환성 헬퍼 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 및 유사 항목 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 wrapper 타입, 공유 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper 헬퍼 |
    | `plugin-sdk/provider-transport-runtime` | 보호된 fetch, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 Provider 전송 헬퍼 |
    | `plugin-sdk/provider-onboard` | 온보딩 구성 패치 헬퍼 |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache 헬퍼 |
    | `plugin-sdk/group-activation` | 좁은 그룹 활성화 모드 및 명령 파싱 헬퍼 |
  </Accordion>

  <Accordion title="인증 및 보안 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 동적 인수 메뉴 형식을 포함한 명령 레지스트리 헬퍼, 발신자 권한 부여 헬퍼 |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated` 및 `buildHelpMessage` 같은 명령/도움말 메시지 빌더 |
    | `plugin-sdk/approval-auth-runtime` | 승인자 해석 및 동일 채팅 작업 인증 헬퍼 |
    | `plugin-sdk/approval-client-runtime` | 네이티브 exec 승인 프로필/필터 헬퍼 |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 기능/전달 어댑터 |
    | `plugin-sdk/approval-gateway-runtime` | 공유 승인 Gateway 해석 헬퍼 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 핫 채널 엔트리포인트를 위한 가벼운 네이티브 승인 어댑터 로딩 헬퍼 |
    | `plugin-sdk/approval-handler-runtime` | 더 넓은 승인 핸들러 런타임 헬퍼. 충분할 때는 더 좁은 어댑터/Gateway seam을 선호하세요 |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상 + 계정 바인딩 헬퍼 |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 승인 응답 페이로드 헬퍼 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 페이로드 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼, `formatApprovalDisplayPath` 같은 구조화된 승인 표시 헬퍼 |
    | `plugin-sdk/reply-dedupe` | 좁은 인바운드 응답 중복 제거 초기화 헬퍼 |
    | `plugin-sdk/channel-contract-testing` | 넓은 테스트 barrel 없는 좁은 채널 계약 테스트 헬퍼 |
    | `plugin-sdk/command-auth-native` | 네이티브 명령 인증, 동적 인수 메뉴 형식, 네이티브 세션 대상 헬퍼 |
    | `plugin-sdk/command-detection` | 공유 명령 감지 헬퍼 |
    | `plugin-sdk/command-primitives-runtime` | 핫 채널 경로를 위한 가벼운 명령 텍스트 predicate |
    | `plugin-sdk/command-surface` | 명령 본문 정규화 및 명령 surface 헬퍼 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 채널/Plugin secret surface를 위한 좁은 secret 계약 수집 헬퍼 |
    | `plugin-sdk/secret-ref-runtime` | secret 계약/구성 파싱을 위한 좁은 `coerceSecretRef` 및 SecretRef 타이핑 헬퍼 |
    | `plugin-sdk/security-runtime` | 공유 신뢰, DM 게이팅, 외부 콘텐츠, 민감한 텍스트 수정, constant-time secret 비교, secret 수집 헬퍼 |
    | `plugin-sdk/ssrf-policy` | 호스트 allowlist 및 private-network SSRF 정책 헬퍼 |
    | `plugin-sdk/ssrf-dispatcher` | 넓은 인프라 런타임 surface 없는 좁은 pinned-dispatcher 헬퍼 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF로 보호되는 fetch, SSRF 오류, SSRF 정책 헬퍼 |
    | `plugin-sdk/secret-input` | Secret 입력 파싱 헬퍼 |
    | `plugin-sdk/webhook-ingress` | Webhook 요청/대상 헬퍼 및 원시 websocket/body 강제 변환 |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/타임아웃 헬퍼 |
  </Accordion>

  <Accordion title="런타임 및 스토리지 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/runtime` | 광범위한 런타임/로깅/백업/Plugin 설치 헬퍼 |
    | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 env, 로거, 제한 시간, 재시도 및 백오프 헬퍼 |
    | `plugin-sdk/browser-config` | 정규화된 프로필/기본값, CDP URL 파싱 및 브라우저 제어 인증 헬퍼를 위한 지원되는 브라우저 설정 facade |
    | `plugin-sdk/channel-runtime-context` | 일반 채널 런타임 컨텍스트 등록 및 조회 헬퍼 |
    | `plugin-sdk/matrix` | 이전 서드파티 채널 패키지를 위한 사용 중단된 Matrix 호환성 facade; 새 플러그인은 `plugin-sdk/run-command`를 직접 가져와야 함 |
    | `plugin-sdk/mattermost` | 이전 서드파티 채널 패키지를 위한 사용 중단된 Mattermost 호환성 facade; 새 플러그인은 일반 SDK 하위 경로를 직접 가져와야 함 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공유 Plugin 명령/훅/http/인터랙티브 헬퍼 |
    | `plugin-sdk/hook-runtime` | 공유 Webhook/내부 훅 파이프라인 헬퍼 |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 지연 런타임 가져오기/바인딩 헬퍼 |
    | `plugin-sdk/process-runtime` | 프로세스 exec 헬퍼 |
    | `plugin-sdk/cli-runtime` | CLI 포맷팅, 대기, 버전, 인수 호출 및 지연 명령 그룹 헬퍼 |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트, 이벤트 루프 준비 클라이언트 시작 헬퍼, Gateway CLI RPC, Gateway 프로토콜 오류 및 채널 상태 패치 헬퍼 |
    | `plugin-sdk/config-types` | `OpenClawConfig` 및 채널/프로바이더 설정 타입 같은 Plugin 설정 형태를 위한 타입 전용 설정 표면 |
    | `plugin-sdk/plugin-config-runtime` | `requireRuntimeConfig`, `resolvePluginConfigObject`, `resolveLivePluginConfigObject` 같은 런타임 Plugin 설정 조회 헬퍼 |
    | `plugin-sdk/config-mutation` | `mutateConfigFile`, `replaceConfigFile`, `logConfigUpdated` 같은 트랜잭션 설정 변경 헬퍼 |
    | `plugin-sdk/runtime-config-snapshot` | `getRuntimeConfig`, `getRuntimeConfigSnapshot` 및 테스트 스냅샷 setter 같은 현재 프로세스 설정 스냅샷 헬퍼 |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram 계약 표면을 사용할 수 없는 경우에도 Telegram 명령 이름/설명 정규화 및 중복/충돌 검사 |
    | `plugin-sdk/text-autolink-runtime` | 광범위한 text-runtime 배럴 없이 파일 참조 자동 링크 감지 |
    | `plugin-sdk/approval-runtime` | Exec/Plugin 승인 헬퍼, 승인 기능 빌더, 인증/프로필 헬퍼, 네이티브 라우팅/런타임 헬퍼 및 구조화된 승인 표시 경로 포맷팅 |
    | `plugin-sdk/reply-runtime` | 공유 인바운드/응답 런타임 헬퍼, 청킹, 디스패치, Heartbeat, 응답 플래너 |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 응답 디스패치/완료 및 대화 레이블 헬퍼 |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 공유 짧은 기간 응답 기록 헬퍼 및 마커 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 범위의 텍스트/Markdown 청킹 헬퍼 |
    | `plugin-sdk/session-store-runtime` | 세션 저장소 경로, 세션 키, updated-at 및 저장소 변경 헬퍼 |
    | `plugin-sdk/cron-store-runtime` | Cron 저장소 경로/로드/저장 헬퍼 |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 헬퍼 |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 라우트/세션 키/계정 바인딩 헬퍼 |
    | `plugin-sdk/status-helpers` | 공유 채널/계정 상태 요약 헬퍼, 런타임 상태 기본값 및 이슈 메타데이터 헬퍼 |
    | `plugin-sdk/target-resolver-runtime` | 공유 대상 resolver 헬퍼 |
    | `plugin-sdk/string-normalization-runtime` | 슬러그/문자열 정규화 헬퍼 |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | 정규화된 stdout/stderr 결과가 있는 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공통 도구/CLI 매개변수 reader |
    | `plugin-sdk/tool-payload` | 도구 결과 객체에서 정규화된 페이로드 추출 |
    | `plugin-sdk/tool-send` | 도구 인수에서 표준 전송 대상 필드 추출 |
    | `plugin-sdk/temp-path` | 공유 임시 다운로드 경로 헬퍼 |
    | `plugin-sdk/logging-core` | 서브시스템 로거 및 수정 헬퍼 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 표 모드 및 변환 헬퍼 |
    | `plugin-sdk/model-session-runtime` | `applyModelOverrideToSessionEntry`, `resolveAgentMaxConcurrent` 같은 모델/세션 override 헬퍼 |
    | `plugin-sdk/talk-config-runtime` | Talk 프로바이더 설정 해석 헬퍼 |
    | `plugin-sdk/json-store` | 작은 JSON 상태 읽기/쓰기 헬퍼 |
    | `plugin-sdk/file-lock` | 재진입 가능 파일 잠금 헬퍼 |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 중복 제거 캐시 헬퍼 |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 응답 디스패치 헬퍼 |
    | `plugin-sdk/acp-runtime-backend` | 시작 시 로드되는 플러그인을 위한 경량 ACP 백엔드 등록 및 응답 디스패치 헬퍼 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 수명 주기 시작 가져오기 없이 읽기 전용 ACP 바인딩 해석 |
    | `plugin-sdk/agent-config-primitives` | 좁은 범위의 에이전트 런타임 설정 스키마 primitives |
    | `plugin-sdk/boolean-param` | 느슨한 불리언 매개변수 reader |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 해석 헬퍼 |
    | `plugin-sdk/device-bootstrap` | 디바이스 부트스트랩 및 페어링 토큰 헬퍼 |
    | `plugin-sdk/extension-shared` | 공유 수동 채널, 상태 및 ambient 프록시 헬퍼 primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` 명령/프로바이더 응답 헬퍼 |
    | `plugin-sdk/skill-commands-runtime` | Skill 명령 나열 헬퍼 |
    | `plugin-sdk/native-command-registry` | 네이티브 명령 레지스트리/빌드/직렬화 헬퍼 |
    | `plugin-sdk/agent-harness` | 저수준 에이전트 harness를 위한 실험적 신뢰 Plugin 표면: harness 타입, active-run steer/abort 헬퍼, OpenClaw 도구 브리지 헬퍼, 런타임 계획 도구 정책 헬퍼, 터미널 결과 분류, 도구 진행 상황 포맷팅/상세 헬퍼 및 시도 결과 유틸리티 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 엔드포인트 감지 헬퍼 |
    | `plugin-sdk/async-lock-runtime` | 작은 런타임 상태 파일을 위한 프로세스 로컬 비동기 잠금 헬퍼 |
    | `plugin-sdk/channel-activity-runtime` | 채널 활동 텔레메트리 헬퍼 |
    | `plugin-sdk/concurrency-runtime` | 제한된 비동기 작업 동시성 헬퍼 |
    | `plugin-sdk/dedupe-runtime` | 인메모리 중복 제거 캐시 헬퍼 |
    | `plugin-sdk/delivery-queue-runtime` | 아웃바운드 보류 중 전송 drain 헬퍼 |
    | `plugin-sdk/file-access-runtime` | 안전한 로컬 파일 및 미디어 소스 경로 헬퍼 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 이벤트 및 가시성 헬퍼 |
    | `plugin-sdk/number-runtime` | 숫자 강제 변환 헬퍼 |
    | `plugin-sdk/secure-random-runtime` | 보안 토큰/UUID 헬퍼 |
    | `plugin-sdk/system-event-runtime` | 시스템 이벤트 큐 헬퍼 |
    | `plugin-sdk/transport-ready-runtime` | 전송 준비 상태 대기 헬퍼 |
    | `plugin-sdk/infra-runtime` | 사용 중단된 호환성 shim; 위의 집중된 런타임 하위 경로를 사용 |
    | `plugin-sdk/collection-runtime` | 작은 제한 캐시 헬퍼 |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그, 이벤트 및 trace-context 헬퍼 |
    | `plugin-sdk/error-runtime` | 오류 그래프, 포맷팅, 공유 오류 분류 헬퍼, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, 프록시, EnvHttpProxyAgent 옵션 및 고정 lookup 헬퍼 |
    | `plugin-sdk/runtime-fetch` | 프록시/보호된 fetch 가져오기 없는 dispatcher 인식 런타임 fetch |
    | `plugin-sdk/response-limit-runtime` | 광범위한 미디어 런타임 표면 없는 제한된 응답 본문 reader |
    | `plugin-sdk/session-binding-runtime` | 설정된 바인딩 라우팅 또는 페어링 저장소 없는 현재 대화 바인딩 상태 |
    | `plugin-sdk/session-store-runtime` | 광범위한 설정 쓰기/유지보수 가져오기 없는 세션 저장소 헬퍼 |
    | `plugin-sdk/context-visibility-runtime` | 광범위한 설정/보안 가져오기 없는 컨텍스트 가시성 해석 및 보충 컨텍스트 필터링 |
    | `plugin-sdk/string-coerce-runtime` | markdown/로깅 가져오기 없는 좁은 범위의 primitive 레코드/문자열 강제 변환 및 정규화 헬퍼 |
    | `plugin-sdk/host-runtime` | 호스트 이름 및 SCP 호스트 정규화 헬퍼 |
    | `plugin-sdk/retry-runtime` | 재시도 설정 및 재시도 실행기 헬퍼 |
    | `plugin-sdk/agent-runtime` | 에이전트 디렉터리/ID/워크스페이스 헬퍼 |
    | `plugin-sdk/directory-runtime` | 설정 기반 디렉터리 쿼리/중복 제거 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="기능 및 테스트 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 공유 미디어 가져오기/변환/저장 헬퍼, ffprobe 기반 비디오 크기 탐색, 미디어 페이로드 빌더 |
    | `plugin-sdk/media-store` | `saveMediaBuffer` 같은 제한적인 미디어 저장소 헬퍼 |
    | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 장애 조치 헬퍼, 후보 선택, 누락된 모델 메시지 |
    | `plugin-sdk/media-understanding` | 미디어 이해 제공자 타입 및 제공자용 이미지/오디오 헬퍼 내보내기 |
    | `plugin-sdk/text-runtime` | 어시스턴트에 표시되는 텍스트 제거, 마크다운 렌더링/청킹/테이블 헬퍼, 편집 헬퍼, 지시문 태그 헬퍼, 안전 텍스트 유틸리티 같은 공유 텍스트/마크다운/로깅 헬퍼 |
    | `plugin-sdk/text-chunking` | 아웃바운드 텍스트 청킹 헬퍼 |
    | `plugin-sdk/speech` | 음성 제공자 타입 및 제공자용 지시문, 레지스트리, 검증, OpenAI 호환 TTS 빌더, 음성 헬퍼 내보내기 |
    | `plugin-sdk/speech-core` | 공유 음성 제공자 타입, 레지스트리, 지시문, 정규화, 음성 헬퍼 내보내기 |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 제공자 타입, 레지스트리 헬퍼, 공유 WebSocket 세션 헬퍼 |
    | `plugin-sdk/realtime-voice` | 실시간 음성 제공자 타입 및 레지스트리 헬퍼 |
    | `plugin-sdk/image-generation` | 이미지 생성 제공자 타입 및 이미지 에셋/데이터 URL 헬퍼, OpenAI 호환 이미지 제공자 빌더 |
    | `plugin-sdk/image-generation-core` | 공유 이미지 생성 타입, 장애 조치, 인증, 레지스트리 헬퍼 |
    | `plugin-sdk/music-generation` | 음악 생성 제공자/요청/결과 타입 |
    | `plugin-sdk/music-generation-core` | 공유 음악 생성 타입, 장애 조치 헬퍼, 제공자 조회, 모델 참조 파싱 |
    | `plugin-sdk/video-generation` | 비디오 생성 제공자/요청/결과 타입 |
    | `plugin-sdk/video-generation-core` | 공유 비디오 생성 타입, 장애 조치 헬퍼, 제공자 조회, 모델 참조 파싱 |
    | `plugin-sdk/webhook-targets` | Webhook 대상 레지스트리 및 경로 설치 헬퍼 |
    | `plugin-sdk/webhook-path` | Webhook 경로 정규화 헬퍼 |
    | `plugin-sdk/web-media` | 공유 원격/로컬 미디어 로딩 헬퍼 |
    | `plugin-sdk/zod` | Plugin SDK 소비자를 위해 다시 내보낸 `zod` |
    | `plugin-sdk/testing` | 레거시 Plugin 테스트를 위한 광범위한 호환성 배럴. 새 확장 테스트는 대신 `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, 또는 `plugin-sdk/test-fixtures` 같은 집중 SDK 하위 경로를 가져와야 합니다 |
    | `plugin-sdk/plugin-test-api` | 저장소 테스트 헬퍼 브리지를 가져오지 않고 직접 Plugin 등록 단위 테스트를 수행하기 위한 최소 `createTestPluginApi` 헬퍼 |
    | `plugin-sdk/agent-runtime-test-contracts` | 인증, 전달, 폴백, 도구 훅, 프롬프트 오버레이, 스키마, 전사 투영 테스트를 위한 네이티브 에이전트 런타임 어댑터 계약 픽스처 |
    | `plugin-sdk/channel-test-helpers` | 일반 작업/설정/상태 계약, 디렉터리 어설션, 계정 시작 생명주기, 전송 구성 스레딩, 런타임 목, 상태 문제, 아웃바운드 전달, 훅 등록을 위한 채널 중심 테스트 헬퍼 |
    | `plugin-sdk/channel-target-testing` | 채널 테스트를 위한 공유 대상 확인 오류 사례 모음 |
    | `plugin-sdk/plugin-test-contracts` | Plugin 패키지, 등록, 공개 아티팩트, 직접 가져오기, 런타임 API, 가져오기 부작용 계약 헬퍼 |
    | `plugin-sdk/provider-test-contracts` | 제공자 런타임, 인증, 탐색, 온보딩, 카탈로그, 마법사, 미디어 기능, 재생 정책, 실시간 STT 라이브 오디오, 웹 검색/가져오기, 스트림 계약 헬퍼 |
    | `plugin-sdk/provider-http-test-mocks` | `plugin-sdk/provider-http`를 실행하는 제공자 테스트를 위한 옵트인 Vitest HTTP/인증 목 |
    | `plugin-sdk/test-fixtures` | 일반 CLI 런타임 캡처, 샌드박스 컨텍스트, Skill 작성기, 에이전트 메시지, 시스템 이벤트, 모듈 재로드, 번들 Plugin 경로, 터미널 텍스트, 청킹, 인증 토큰, 타입 지정 사례 픽스처 |
    | `plugin-sdk/test-node-mocks` | Vitest `vi.mock("node:*")` 팩토리 내부에서 사용하기 위한 집중 Node 내장 목 헬퍼 |
  </Accordion>

  <Accordion title="메모리 하위 경로">
    | 하위 경로 | 주요 내보내기 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 관리자/구성/파일/CLI 헬퍼를 위한 번들 memory-core 헬퍼 표면 |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 인덱스/검색 런타임 파사드 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 계약, 레지스트리 접근, 로컬 제공자, 일반 배치/원격 헬퍼 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 내보내기 |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 비밀 헬퍼 |
    | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 헬퍼 |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 헬퍼를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 헬퍼를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 헬퍼를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 Plugin을 위한 공유 관리형 마크다운 헬퍼 |
    | `plugin-sdk/memory-host-search` | 검색 관리자 접근을 위한 Active Memory 런타임 파사드 |
    | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 헬퍼를 위한 벤더 중립 별칭 |
  </Accordion>

  <Accordion title="예약된 번들 헬퍼 하위 경로">
    현재 예약된 번들 헬퍼 SDK 하위 경로는 없습니다. 소유자별
    헬퍼는 소유 Plugin 패키지 내부에 있으며, 재사용 가능한 호스트 계약은
    `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 하위 경로를 사용합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
