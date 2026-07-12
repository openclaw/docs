---
read_when:
    - 어떤 SDK 하위 경로에서 가져와야 하는지 알아야 합니다
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조가 필요합니다
    - 특정 SDK 내보내기 항목을 찾고 있습니다
sidebarTitle: Plugin SDK overview
summary: 가져오기 맵, 등록 API 참조 및 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-07-12T01:08:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK는 Plugin과 코어 사이의 타입이 지정된 계약입니다. 이 페이지는
**무엇을 가져와야 하는지**와 **무엇을 등록할 수 있는지**에 대한
참조 문서입니다.

<Note>
  이 페이지는 OpenClaw 내에서 `openclaw/plugin-sdk/*`를 사용하는
  Plugin 작성자를 위한 것입니다. Gateway를 통해 에이전트를 실행하려는
  외부 앱, 스크립트, 대시보드, CI 작업 및 IDE 확장에는 대신
  [외부 앱용 Gateway 통합](/ko/gateway/external-apps)을 사용하세요.
</Note>

<Tip>
대신 방법 안내서를 찾고 계신가요? [Plugin 빌드하기](/ko/plugins/building-plugins)부터 시작하세요. 채널에는 [채널 Plugin](/ko/plugins/sdk-channel-plugins), 모델 제공자에는 [제공자 Plugin](/ko/plugins/sdk-provider-plugins), 로컬 AI CLI 백엔드에는 [CLI 백엔드 Plugin](/ko/plugins/cli-backend-plugins), 네이티브 에이전트 실행기에는 [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness), 도구 또는 수명 주기 훅에는 [Plugin 훅](/ko/plugins/hooks)을 사용하세요.
</Tip>

## 가져오기 규칙

항상 특정 하위 경로에서 가져오세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 하위 경로는 작고 독립적인 모듈입니다. 이를 통해 시작 속도를 높이고
순환 종속성 문제를 방지합니다. 채널별 진입점/빌드 헬퍼에는
`openclaw/plugin-sdk/channel-core`를 우선 사용하고, 더 광범위한 통합 표면과
`buildChannelConfigSchema` 같은 공유 헬퍼에는 `openclaw/plugin-sdk/core`를
사용하세요.

채널 구성의 경우 채널이 소유한 JSON Schema를
`openclaw.plugin.json#channelConfigs`를 통해 게시하세요.
`plugin-sdk/channel-config-schema` 하위 경로는 공유 스키마 기본 요소와
범용 빌더를 위한 것입니다. OpenClaw의 번들 Plugin은 유지되는 번들 채널
스키마에 `plugin-sdk/bundled-channel-config-schema`를 사용합니다.
사용 중단된 호환성 내보내기는 `plugin-sdk/channel-config-schema-legacy`에
남아 있으며, 어느 번들 스키마 하위 경로도 새 Plugin의 패턴으로 사용해서는
안 됩니다.

<Warning>
  제공자 또는 채널 브랜드가 지정된 편의 연결부(예:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)를
  가져오지 마세요. 번들 Plugin은 자체 `api.ts` / `runtime-api.ts` 배럴 내에서
  범용 SDK 하위 경로를 조합합니다. 코어 소비자는 해당 Plugin 로컬 배럴을
  사용하거나, 요구 사항이 실제로 여러 채널에 공통되는 경우에만 좁은 범용
  SDK 계약을 추가해야 합니다.

소수의 번들 Plugin 헬퍼 연결부는 추적되는 소유자 사용처가 있을 경우 생성된
내보내기 맵에 계속 나타납니다. 이들은 번들 Plugin 유지 관리만을 위한 것이며,
새 서드 파티 Plugin에 권장되는 가져오기 경로가 아닙니다.

`openclaw/plugin-sdk/discord`와 `openclaw/plugin-sdk/telegram-account`도
추적되는 소유자 사용처를 위해 사용 중단된 호환성 퍼사드로 유지됩니다.
이러한 가져오기 경로를 새 Plugin에 복사하지 마세요. 대신 주입된 런타임
헬퍼와 범용 채널 SDK 하위 경로를 사용하세요.
</Warning>

## 하위 경로 참조

Plugin SDK는 영역별(Plugin 진입점, 채널, 제공자, 인증, 런타임, 기능,
메모리 및 예약된 번들 Plugin 헬퍼)로 그룹화된 좁은 하위 경로 집합으로
노출됩니다. 그룹화되고 링크가 연결된 전체 카탈로그는
[Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참조하세요.

컴파일러 진입점 인벤토리는 `scripts/lib/plugin-sdk-entrypoints.json`에 있으며,
패키지 내보내기는
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`에 나열된
저장소 로컬 테스트/내부 하위 경로를 제외한 공개 하위 집합에서 생성됩니다.
공개 내보내기 수를 감사하려면 `pnpm plugin-sdk:surface`를 실행하세요.
충분히 오래되었고 번들 확장 프로덕션 코드에서 사용되지 않는 사용 중단된
공개 하위 경로는 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`에서
추적되며, 광범위한 사용 중단 재내보내기 배럴은
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`에서 추적됩니다.

## 등록 API

`register(api)` 콜백은 다음 메서드를 포함하는 `OpenClawPluginApi` 객체를
받습니다.

### 기능 등록

| 메서드                                           | 등록 대상                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | 텍스트 추론(LLM)                                                                |
| `api.registerWorkerProvider(...)`                | 클라우드 워커 수명 주기 임대                                                     |
| `api.registerModelCatalogProvider(...)`          | 텍스트 및 미디어 생성용 모델 카탈로그 행                                         |
| `api.registerAgentHarness(...)`                  | [실험적 기능](/ko/plugins/sdk-agent-harness) 네이티브 에이전트 실행기(Codex, Copilot) |
| `api.registerCliBackend(...)`                    | 로컬 CLI 추론 백엔드                                                            |
| `api.registerChannel(...)`                       | 메시징 채널                                                                     |
| `api.registerEmbeddingProvider(...)`             | 재사용 가능한 벡터 임베딩 제공자                                                |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성                                                     |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 실시간 음성 기록                                                       |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 실시간 음성 세션                                                         |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/동영상 분석                                                       |
| `api.registerTranscriptSourceProvider(...)`      | 실시간 또는 가져온 회의 기록 소스                                               |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성                                                                     |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성                                                                       |
| `api.registerVideoGenerationProvider(...)`       | 동영상 생성                                                                     |
| `api.registerWebFetchProvider(...)`              | 웹 가져오기 / 스크래핑 제공자                                                   |
| `api.registerWebSearchProvider(...)`             | 웹 검색                                                                         |
| `api.registerCompactionProvider(...)`            | 교체 가능한 대화 기록 Compaction 백엔드                                         |

워커 제공자는 Plugin 매니페스트의 `contracts.workerProviders`에도 해당 ID를 선언해야 합니다.
코어는 `provision(profile, operationId)` 전에 지속적인 의도를 저장합니다. 제공자는 외부 할당 전에 설정을 검증하고 영구적인 프로필 거부 시 `WorkerProviderError`를 발생시킵니다. 작업 ID가 반복되면 `provision`은 동일한 임대를 채택해야 합니다.
코어는 검증된 프로필 설정을 임대와 함께 저장하고 해당 스냅샷을 `destroy({ leaseId, profile })`와 `inspect({ leaseId, profile })`에 제공합니다. `destroy`는 멱등성을 가져야 하며, `inspect`는 `active`, `destroyed` 또는 `unknown`을 반환합니다. 이를 통해 제공자는 Gateway 재시작 또는 명명된 프로필 제거 이후에도 수명 주기 호출을 라우팅할 수 있습니다. SSH 엔드포인트는 `keyRef`에 인라인 키 자료가 아닌 `SecretRef`를 사용하며, 신뢰할 수 있는 프로비저닝 출력의 `hostKey`를 호스트 이름이나 주석 없이 정확히 `algorithm base64` 형식으로 포함합니다. 코어는 `hostKey`를 고정하며 첫 연결에서 받은 키를 절대 신뢰하지 않습니다. 동적 `keyRef`를 생성하는 제공자는 `resolveSshIdentity({ leaseId, profile, keyRef })`를 구현할 수 있습니다. 이 메서드가 있으면 해당 리졸버가 최종 권한을 가지며, 이 메서드가 없는 제공자는 구성된 범용 비밀 리졸버를 사용합니다.
갱신 가능한 임대를 사용하는 제공자는 `renew(leaseId)`도 구현할 수 있습니다.
`inspect`는 일시적이거나 확정할 수 없는 실패 시 예외를 발생시켜야 합니다. 권한 있는 확인을 통해 부재가 확정된 경우에만 `unknown`을 반환하세요. 코어는 활성 로컬 레코드를 고립 상태로 표시하거나, 저장된 폐기 요청 이후에는 해당 부재를 정리 완료로 처리합니다.

`api.registerEmbeddingProvider(...)`로 등록된 임베딩 제공자는 Plugin
매니페스트의 `contracts.embeddingProviders`에도 나열되어야 합니다. 이는
재사용 가능한 벡터 생성을 위한 범용 임베딩 표면입니다. 메모리 검색은 이
범용 제공자 표면을 사용할 수 있습니다. 기존
`api.registerMemoryEmbeddingProvider(...)`와
`contracts.memoryEmbeddingProviders` 연결부는 기존 메모리 전용 제공자가
마이그레이션되는 동안 유지되는 사용 중단된 호환성 기능입니다.

런타임 `batchEmbed(...)`를 계속 노출하는 메모리 전용 제공자는 해당 런타임이
명시적으로 `sourceWideBatchEmbed: true`를 설정하지 않는 한 기존 파일별
일괄 처리 계약을 유지합니다. 이 옵트인을 사용하면 메모리 호스트가 호스트의
일괄 처리 한도까지 여러 변경된 메모리 파일과 활성화된 소스의 청크를 하나의
`batchEmbed(...)` 호출로 제출할 수 있습니다. JSONL 요청 파일을 업로드하는
일괄 처리 어댑터는 요청 수 한도뿐 아니라 업로드 크기 한도에 도달하기
전에도 제공자 작업을 분할해야 합니다. 제공자는 `batch.chunks`와 동일한
순서로 입력 청크당 하나의 임베딩을 반환해야 합니다. 제공자가 파일 로컬
일괄 처리를 예상하거나 더 큰 소스 전체 작업에서 입력 순서를 보존할 수 없는
경우에는 이 플래그를 생략하세요.

### 도구 및 명령

고정된 도구 이름을 사용하는 간단한 도구 전용 Plugin에는
[`defineToolPlugin`](/ko/plugins/tool-plugins)을 사용하세요. 혼합 Plugin 또는
완전히 동적인 도구 등록에는 `api.registerTool(...)`을 직접 사용하세요.

| 메서드                                 | 등록 대상                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerTool(tool, opts?)`        | 에이전트 도구(필수 또는 `{ optional: true }`)                                                                                        |
| `api.registerCommand(def)`             | 사용자 지정 명령(LLM을 우회)                                                                                                        |
| `api.registerNodeHostCommand(command)` | `openclaw node run`에서 처리하는 명령. 선택적 `agentTool` 메타데이터를 사용하면 Node가 연결된 동안 에이전트에 표시되는 도구로 노출 가능 |

에이전트에 명령이 소유하는 짧은 라우팅 힌트가 필요한 경우 Plugin 명령에
`agentPromptGuidance`를 설정할 수 있습니다. 해당 텍스트는 명령 자체에 관한
내용으로 제한하세요. 코어 프롬프트 빌더에 제공자 또는 Plugin별 정책을
추가하지 마세요.

지침 항목은 모든 프롬프트 표면에 적용되는 레거시 문자열이거나 구조화된
항목일 수 있습니다.

```ts
agentPromptGuidance: [
  "전역 명령 힌트.",
  { text: "기본 OpenClaw 프롬프트에만 이를 표시합니다.", surfaces: ["openclaw_main"] },
];
```

구조화된 `surfaces`에는 `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` 또는 `subagent`가 포함될 수 있습니다.
`pi_main`은 `openclaw_main`의 사용 중단된 별칭으로 유지됩니다. 의도적으로
모든 표면에 적용하는 지침에는 `surfaces`를 생략하세요. 빈 `surfaces`
배열을 전달하지 마세요. 실수로 범위가 사라져 전역 프롬프트 텍스트가 되는
것을 방지하기 위해 거부됩니다.

네이티브 Codex 앱 서버 개발자 지침은 다른 프롬프트 표면보다 더 엄격합니다.
`codex_app_server`로 범위가 명시된 지침만 해당 우선순위가 더 높은 영역으로
승격됩니다. 레거시 문자열 지침과 범위가 지정되지 않은 구조화된 지침은
호환성을 위해 Codex가 아닌 프롬프트 표면에서 계속 사용할 수 있습니다.

Node 호스트 명령은 Gateway 프로세스 내부가 아니라 연결된 Node 호스트에서 실행됩니다. `agentTool`이 있으면 Node는 Gateway 연결에 성공한 후 설명자를 게시합니다. Gateway는 해당 Node가 연결되어 있고 설명자의 `command`가 Node의 승인된 명령 범위에 포함된 동안에만 이를 에이전트 실행에 노출합니다. 위험하지 않은 명령을 기본 Node 명령 허용 목록에 포함하려면 `agentTool.defaultPlatforms`를 설정하세요. 그렇지 않으면 명시적인 `gateway.nodes.allowCommands` 또는 Node 호출 정책이 필요합니다. `agentTool.name`은 제공자에서 안전하게 사용할 수 있어야 합니다. 문자로 시작하고 문자, 숫자, 밑줄 또는 하이픈만 사용하며 64자 이내여야 합니다. MCP 기반 Node 도구는 카탈로그 및 도구 검색 화면에 원격 MCP 서버/도구 ID를 표시할 수 있도록 `agentTool.mcp` 메타데이터를 설정할 수 있지만, 실행은 여전히 게시된 Node 명령을 통해 이루어집니다.

### 인프라

| 메서드                                          | 등록하는 항목                                                  |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | 이벤트 훅                                                      |
| `api.registerHttpRoute(params)`                 | Gateway HTTP 엔드포인트                                        |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC 메서드                                             |
| `api.registerGatewayDiscoveryService(service)`  | 로컬 Gateway 검색 광고자                                       |
| `api.registerCli(registrar, opts?)`             | CLI 하위 명령                                                  |
| `api.registerNodeCliFeature(registrar, opts?)`  | `openclaw nodes` 아래의 Node 기능 CLI                           |
| `api.registerService(service)`                  | 백그라운드 서비스                                              |
| `api.registerInteractiveHandler(registration)`  | 대화형 핸들러                                                  |
| `api.registerAgentToolResultMiddleware(...)`    | 런타임 도구 결과 미들웨어                                      |
| `api.registerMemoryPromptSupplement(builder)`   | 메모리 인접 프롬프트 섹션 추가                                  |
| `api.registerMemoryCorpusSupplement(adapter)`   | 메모리 검색/읽기 코퍼스 추가                                   |
| `api.registerHostedMediaResolver(resolver)`     | 브라우저 방식의 호스팅 미디어 URL 리졸버                        |
| `api.registerTextTransforms(transforms)`        | Plugin 소유의 프롬프트/메시지 호환성 텍스트 재작성              |
| `api.registerConfigMigration(migrate)`          | Plugin 런타임 로드 전에 실행되는 경량 구성 마이그레이션          |
| `api.registerMigrationProvider(provider)`       | `openclaw migrate`용 가져오기 도구                              |
| `api.registerAutoEnableProbe(probe)`            | 이 Plugin을 자동으로 활성화할 수 있는 구성 프로브               |
| `api.registerReload(registration)`              | 다시 로드 처리를 위한 재시작/핫/무작동 구성 접두사 정책          |
| `api.registerNodeHostCommand(command)`          | 페어링된 Node에 노출되는 명령 핸들러                             |
| `api.registerNodeInvokePolicy(policy)`          | Node에서 호출하는 명령의 허용 목록/승인 정책                     |
| `api.registerSecurityAuditCollector(collector)` | `openclaw security audit`용 발견 항목 수집기                     |

메모리 프롬프트 보충 빌더는 선택적 `agentId`, `agentSessionKey`, `sandboxed` 컨텍스트를 받습니다. 메모리 코퍼스 보충의 `search` 및 `get` 호출은 선택적 `agentId`와 `sandboxed` 컨텍스트를 받습니다. 에이전트 소유 저장소가 있는 Plugin은 등록 중에 하나의 전역 경로를 캡처하지 말고 호출마다 해당 저장소를 확인해야 합니다. 다중 에이전트 작업에 에이전트 ID가 필요하지만 누락된 경우 임의의 에이전트를 선택하지 말고 안전하게 실패해야 합니다.

Telegram 대화형 핸들러는 핸들러가 성공한 후 Telegram의 일반 수신 에이전트 경로를 통해 텍스트를 전달하도록 `{ submitText }`를 반환할 수 있습니다. 수신 정책이 텍스트를 건너뛰거나 처리에 실패하면 OpenClaw는 콜백 버튼을 유지하므로, 차단 조건이 변경된 후 사용자가 다시 시도할 수 있습니다. 이 결과 필드는 Telegram 전용이며, 다른 채널은 자체 대화형 결과 계약을 유지합니다.

### 워크플로 Plugin용 호스트 훅

호스트 훅은 제공자, 채널 또는 도구만 추가하는 것이 아니라 호스트 수명 주기에 참여해야 하는 Plugin을 위한 SDK 연결 지점입니다. 이는 일반적인 계약입니다. Plan Mode에서 사용할 수 있지만 승인 워크플로, 작업 공간 정책 게이트, 백그라운드 모니터, 설정 마법사 및 UI 도우미 Plugin에서도 사용할 수 있습니다.

| 메서드                                                                               | 소유하는 계약                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway 세션을 통해 투영되는 Plugin 소유의 JSON 호환 세션 상태                                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 한 세션의 다음 에이전트 턴에 정확히 한 번 삽입되는 영속적 컨텍스트                                                                                         |
| `api.registerTrustedToolPolicy(...)`                                                 | 도구 매개변수를 차단하거나 재작성할 수 있는, 매니페스트로 제한되는 신뢰된 사전 Plugin 도구 정책                                                            |
| `api.registerToolMetadata(...)`                                                      | 도구 구현을 변경하지 않는 도구 카탈로그 표시 메타데이터                                                                                                    |
| `api.registerCommand(...)`                                                           | 범위가 지정된 Plugin 명령. 명령 결과에서 `continueAgent: true` 또는 `suppressReply: true`를 설정할 수 있으며, Discord 네이티브 명령은 `descriptionLocalizations`를 지원함 |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 세션, 도구, 실행, 설정 또는 탭 화면을 위한 Control UI 기여 설명자                                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 초기화/삭제/다시 로드 경로에서 Plugin 소유 런타임 리소스를 위한 정리 콜백                                                                                   |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 워크플로 상태 및 모니터를 위한 정제된 이벤트 구독                                                                                                          |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 종료 실행 수명 주기에 지워지는 실행별 Plugin 임시 상태                                                                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 소유 스케줄러 작업의 정리 메타데이터. 작업을 예약하거나 태스크 레코드를 생성하지 않음                                                                |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 활성 직접 송신 세션 경로로 호스트가 중개하는 파일 첨부 전송. 번들 Plugin 전용                                                                              |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Cron 기반 예약 세션 턴 및 태그 기반 정리. 번들 Plugin 전용                                                                                                 |
| `api.session.controls.registerSessionAction(...)`                                    | 클라이언트가 Gateway를 통해 전달할 수 있는 형식화된 세션 작업                                                                                              |

`surface: "tab"` 설명자는 Control UI에 사이드바 탭을 추가합니다. 활성 Plugin의 탭 설명자는 Gateway hello(`controlUiTabs`)에서 대시보드 클라이언트에 게시되므로 Plugin이 활성화된 동안에만 탭이 표시됩니다. 번들 Plugin은 해당 탭을 위한 일급 대시보드 뷰를 제공할 수 있습니다. 그 밖의 Plugin은 대시보드가 샌드박스 프레임에서 렌더링하는 Plugin HTTP 경로(`api.registerHttpRoute(...)` 참조)를 `path`로 설정할 수 있습니다. `icon`은 대시보드 아이콘 이름 힌트이고, `group`은 사이드바 섹션(`control` 또는 `agent`)을 선택하며, `order`는 Plugin 탭 간 정렬 순서를 지정하고, `requiredScopes`는 해당 운영자 범위가 없는 연결에서 탭을 숨깁니다.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbook",
  description: "Your day as a timeline, built from screen snapshots.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

새 Plugin 코드에는 그룹화된 네임스페이스를 사용하세요.

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

동등한 플랫 메서드는 기존 Plugin을 위한 사용 중단 예정 호환성 별칭으로 계속 제공됩니다. `api.registerSessionExtension`, `api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`, `api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`, `api.clearRunContext`, `api.registerSessionSchedulerJob`, `api.registerSessionAction`, `api.sendSessionAttachment`, `api.scheduleSessionTurn` 또는 `api.unscheduleSessionTurnsByTag`를 직접 호출하는 새 Plugin 코드를 추가하지 마세요.

`scheduleSessionTurn(...)`은 Gateway Cron 스케줄러를 세션 범위에서 편리하게 사용하기 위한 기능입니다. Cron은 타이밍을 소유하며 턴이 실행될 때 백그라운드 태스크 레코드를 생성합니다. Plugin SDK는 대상 세션, Plugin 소유 명명 및 정리만 제한합니다. 작업 자체에 영속적인 다단계 Task Flow 상태가 필요한 경우 예약된 턴 내부에서 `api.runtime.tasks.managedFlows`를 사용하세요.

계약은 의도적으로 권한을 분리합니다.

- 외부 Plugin은 세션 확장, UI 설명자, 명령, 도구 메타데이터, 다음 턴 삽입 및 일반 훅을 소유할 수 있습니다.
- 신뢰된 도구 정책은 일반 `before_tool_call` 훅보다 먼저 실행되며 호스트의 신뢰를 받습니다. 번들 정책이 먼저 실행됩니다. 설치된 Plugin 정책은 명시적 활성화와 `contracts.trustedToolPolicies`에 포함된 해당 로컬 ID가 필요하며, 그다음 Plugin 로드 순서에 따라 실행됩니다. 정책 ID의 범위는 이를 등록한 Plugin으로 제한됩니다.
- 예약된 명령의 소유권은 번들 Plugin 전용입니다. 외부 Plugin은 자체 명령 이름이나 별칭을 사용해야 합니다.
- `allowPromptInjection=false`는 `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, 레거시 `before_agent_start`의 프롬프트 필드 및 `enqueueNextTurnInjection`을 포함하여 프롬프트를 변경하는 훅을 비활성화합니다.

Plan 이외의 사용 예:

| Plugin 원형                  | 사용되는 훅                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 승인 워크플로                | 세션 확장, 명령 계속 실행, 다음 턴 주입, UI 설명자                                                                                     |
| 예산/작업 공간 정책 게이트   | 신뢰할 수 있는 도구 정책, 도구 메타데이터, 세션 프로젝션                                                                               |
| 백그라운드 수명 주기 모니터  | 런타임 수명 주기 정리, 에이전트 이벤트 구독, 세션 스케줄러 소유권/정리, Heartbeat 프롬프트 기여, UI 설명자                              |
| 설정 또는 온보딩 마법사      | 세션 확장, 범위 지정 명령, Control UI 설명자                                                                                           |

<Note>
  예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`)는 Plugin이 더 좁은 Gateway 메서드 범위를 할당하려 해도 항상
  `operator.admin`으로 유지됩니다. Plugin 소유 메서드에는 Plugin별 접두사를
  사용하는 것이 좋습니다.
</Note>

<Accordion title="도구 결과 미들웨어를 사용해야 하는 경우">
  번들 Plugin과 일치하는 매니페스트 계약을 갖고 명시적으로 활성화된 설치
  Plugin은 실행 후 런타임이 결과를 모델에 다시 전달하기 전에 도구 결과를
  재작성해야 할 때 `api.registerAgentToolResultMiddleware(...)`를 사용할 수
  있습니다. 이는 tokenjuice와 같은 비동기 출력 리듀서를 위한 신뢰할 수 있는
  런타임 중립적 연결 지점입니다.

Plugin은 대상으로 지정한 각 런타임에 대해
`contracts.agentToolResultMiddleware`를 선언해야 합니다(예:
`["openclaw", "codex"]`). 해당 계약이 없거나 명시적으로 활성화되지 않은 설치
Plugin은 이 미들웨어를 등록할 수 없습니다. 모델에 전달되기 전 도구 결과 처리
시점이 필요하지 않은 작업에는 일반 OpenClaw Plugin 훅을 사용하세요. 이전의
임베디드 러너 전용 확장 팩터리 등록 경로는 제거되었습니다.
</Accordion>

### Gateway 검색 등록

`api.registerGatewayDiscoveryService(...)`를 사용하면 Plugin이 mDNS/Bonjour와
같은 로컬 검색 전송 방식을 통해 활성 Gateway를 알릴 수 있습니다. 로컬 검색이
활성화된 경우 OpenClaw는 Gateway 시작 중에 서비스를 호출하고 현재 Gateway
포트와 비밀이 아닌 TXT 힌트 데이터를 전달하며, Gateway 종료 중에 반환된
`stop` 핸들러를 호출합니다.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway 검색 Plugin은 알려진 TXT 값을 비밀이나 인증 정보로 취급해서는 안
됩니다. 검색은 라우팅 힌트일 뿐이며, 신뢰는 여전히 Gateway 인증과 TLS 고정이
담당합니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 명령 메타데이터를 받습니다.

- `commands`: 등록자가 소유하는 명시적 명령 이름
- `descriptors`: CLI 도움말, 라우팅, 지연 Plugin CLI 등록에 사용되는
  파싱 시점 명령 설명자
- `parentPath`: `["nodes"]`와 같은 중첩 명령 그룹의 선택적 상위 명령 경로

페어링된 Node 기능에는 `api.registerNodeCliFeature(registrar, opts?)`를
사용하는 것이 좋습니다. 이는
`api.registerCli(..., { parentPath: ["nodes"] })`를 감싸는 작은 래퍼이며,
`openclaw nodes canvas`와 같은 명령을 명시적인 Plugin 소유 Node 기능으로
만듭니다.

Plugin 명령이 일반 루트 CLI 경로에서 지연 로드된 상태로 유지되게 하려면 해당
등록자가 노출하는 모든 최상위 명령 루트를 포괄하는 `descriptors`를
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
        description: "Matrix 계정, 검증, 기기 및 프로필 상태 관리",
        hasSubcommands: true,
      },
    ],
  },
);
```

중첩 명령은 확인된 상위 명령을 `program`으로 받습니다.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "페어링된 Node에서 캔버스 콘텐츠 캡처 또는 렌더링",
        hasSubcommands: true,
      },
    ],
  },
);
```

루트 CLI 지연 등록이 필요하지 않은 경우에만 `commands`를 단독으로 사용하세요.
이 즉시 로드 호환성 경로는 계속 지원되지만, 파싱 시점 지연 로드를 위한 설명자
기반 자리표시자는 설치하지 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`를 사용하면 Plugin이 `claude-cli` 또는
`my-cli`와 같은 로컬 AI CLI 백엔드의 기본 구성을 소유할 수 있습니다.

- 백엔드 `id`는 `my-cli/gpt-5`와 같은 모델 참조에서 제공자 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 동일한 형태를
  사용합니다.
- 사용자 구성이 여전히 우선합니다. OpenClaw는 CLI를 실행하기 전에
  `agents.defaults.cliBackends.<id>`를 Plugin 기본값 위에 병합합니다.
- 백엔드가 병합 후 호환성 재작성을 필요로 할 때 `normalizeConfig`를
  사용하세요(예: 이전 플래그 형태 정규화).
- OpenClaw 사고 수준을 네이티브 노력 플래그에 매핑하는 것처럼 CLI 방언에
  속하는 요청 범위의 argv 재작성에는 `resolveExecutionArgs`를 사용하세요.
  이 훅은 `ctx.executionMode`를 받습니다. 일시적인 `/btw` 호출에 백엔드
  네이티브 격리 플래그를 추가하려면 `"side-question"`을 사용하세요. 이러한
  플래그가 다른 경우에는 항상 켜져 있는 CLI의 네이티브 도구를 안정적으로
  비활성화한다면 `sideQuestionToolMode: "disabled"`도 선언하세요.
- 특정 실행에서 모든 네이티브 도구를 비활성화할 수 있는 백엔드는
  `nativeToolMode: "selectable"`을 선언할 수 있습니다. 제한된 호출은 빈
  `ctx.toolAvailability.native` 튜플과 정확한 호스트 격리 MCP 허용 목록을
  전달합니다. `resolveExecutionArgs`는 최종 신규 또는 재개 argv 모두에서
  이를 강제해야 합니다. 백엔드가 그렇게 할 수 없으면 OpenClaw는 실패 시
  차단합니다.

처음부터 끝까지 다루는 작성 가이드는
[CLI 백엔드 Plugin](/ko/plugins/cli-backend-plugins)을 참조하세요.

### 독점 슬롯

| 메서드                                     | 등록 대상                                                                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 컨텍스트 엔진(한 번에 하나만 활성화). 호스트가 모델/제공자/모드 진단 정보를 제공할 수 있으면 수명 주기 콜백이 `runtimeSettings`를 받으며, 이전의 엄격한 엔진은 해당 키 없이 재시도됩니다.             |
| `api.registerMemoryCapability(capability)` | 통합 메모리 기능                                                                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더                                                                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 플러시 계획 리졸버                                                                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 어댑터                                                                                                                                                                                |

### 사용 중단된 메모리 임베딩 어댑터

| 메서드                                         | 등록 대상                            |
| ---------------------------------------------- | ------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 Plugin의 메모리 임베딩 어댑터  |

- `registerMemoryCapability`는 권장되는 독점 메모리 Plugin API입니다.
- `registerMemoryCapability`는 `publicArtifacts.listArtifacts(...)`를 노출할
  수도 있으므로, 동반 Plugin은 특정 메모리 Plugin의 비공개 레이아웃에 직접
  접근하는 대신 `openclaw/plugin-sdk/memory-host-core`를 통해 내보낸 메모리
  아티팩트를 사용할 수 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`,
  `registerMemoryRuntime`은 레거시 호환 독점 메모리 Plugin API입니다.
- `MemoryFlushPlan.model`은 활성 폴백 체인을 상속하지 않고 플러시 턴을
  `ollama/qwen3:8b`와 같은 정확한 `provider/model` 참조로 고정할 수 있습니다.
- `registerMemoryEmbeddingProvider`는 사용 중단되었습니다. 새 임베딩 제공자는
  `api.registerEmbeddingProvider(...)`와 `contracts.embeddingProviders`를
  사용해야 합니다.
- 기존 메모리 전용 제공자는 마이그레이션 기간 동안 계속 작동하지만, Plugin
  검사에서는 번들되지 않은 Plugin에 대해 이를 호환성 부채로 보고합니다.

### 이벤트 및 수명 주기

| 메서드                                       | 수행 작업                   |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | 형식화된 수명 주기 훅       |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백            |

예시, 일반적인 훅 이름, 가드 의미 체계는
[Plugin 훅](/ko/plugins/hooks)을 참조하세요.

### 훅 결정 의미 체계

`before_install`은 운영자 설치 정책 표면이 아니라 Plugin 런타임 수명 주기
훅입니다. 허용/차단 결정이 CLI 및 Gateway 기반 설치 또는 업데이트 경로를
포괄해야 하는 경우 `security.installPolicy`를 사용하세요.

- `before_tool_call`: `{ block: true }`를 반환하면 종결됩니다. 어떤 핸들러든 이 값을 설정하면 우선순위가 더 낮은 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 재정의가 아니라 결정 없음(`block` 생략과 동일)으로 처리됩니다.
- `before_install`: `{ block: true }`를 반환하면 종결됩니다. 어떤 핸들러든 이 값을 설정하면 우선순위가 더 낮은 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 재정의가 아니라 결정 없음(`block` 생략과 동일)으로 처리됩니다.
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 종결됩니다. 어떤 핸들러든 디스패치를 처리한다고 선언하면 우선순위가 더 낮은 핸들러와 기본 모델 디스패치 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 종결됩니다. 어떤 핸들러든 이 값을 설정하면 우선순위가 더 낮은 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 재정의가 아니라 결정 없음(`cancel` 생략과 동일)으로 처리됩니다.
- `message_received`: 수신 스레드/주제 라우팅이 필요할 때 형식화된 `threadId` 필드를 사용합니다. 채널별 추가 정보에는 `metadata`를 사용합니다.
- `message_sending`: 채널별 `metadata`로 대체하기 전에 형식화된 `replyToId` / `threadId` 라우팅 필드를 사용합니다.
- `gateway_start`: 내부 `gateway:startup` 훅에 의존하지 말고 Gateway가 소유하는 시작 상태에 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`을 사용합니다. 이 시점에는 Cron이 아직 로드 중일 수 있습니다.
- `cron_reconciled`: 시작 또는 스케줄러 다시 로드 후 전체 외부 Cron 프로젝션을 다시 구성합니다. 여기에는 `reason`과 `enabled: false`를 포함한 실효 `enabled` 상태가 포함되며, `ctx.getCron?.()`은 정확히 조정된 스케줄러를 반환합니다. 영속 프로젝션 작업에 `ctx.abortSignal`을 전달합니다. 해당 스케줄러 스냅샷이 대체되거나 Gateway가 닫히면 중단됩니다.
- `cron_changed`: Gateway가 소유하는 Cron 수명 주기 변경을 관찰합니다. `scheduled` 및 `removed` 이벤트는 커밋 후 조정 힌트이며, 순서가 보장된 델타 로그가 아닙니다. 작업에 다음 기상 시점이 없으면 예약된 이벤트의 `event.nextRunAtMs`가 존재하지 않으며, 삭제 이벤트에는 삭제된 작업 스냅샷이 계속 포함됩니다.

외부 기상 스케줄러는 `cron_changed` 이벤트에 디바운스 또는 병합을 적용한 다음,
`cron_reconciled`가 마지막으로 캡처한 스케줄러에서 전체 영속 뷰를 다시 읽어야
합니다. `cron_changed` 컨텍스트의 스케줄러를 채택하지 마십시오. 이전
스케줄러에서 분리된 힌트가 이후 다시 로드와 겹칠 수 있습니다.

Gateway 시작 또는 스케줄러 교체 시 로드되는 영속 상태의 전체 스냅샷
트리거로 `cron_reconciled`를 사용합니다. Plugin만 핫 리로드할 때는 다시
재생되지 않습니다. 관찰 핸들러는 병렬로 실행되며, 실행 후 결과를 기다리지 않는
디스패치는 서로 겹칠 수 있으므로 소비자는 이벤트 완료 순서에 의존해서는 안 됩니다.
기한 확인과 실행의 단일 진실 공급원은 OpenClaw로 유지합니다.

영속 교체, 재시도/백오프, 정상 종료를 지원하는 단일 실행 어댑터는
[안전한 외부 Cron 프로젝션](/ko/plugins/hooks#safe-external-cron-projection)을 참조하십시오.

### API 객체 필드

| 필드                     | 유형                      | 설명                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                   |
| `api.name`               | `string`                  | 표시 이름                                                                                   |
| `api.version`            | `string?`                 | Plugin 버전(선택 사항)                                                                      |
| `api.description`        | `string?`                 | Plugin 설명(선택 사항)                                                                      |
| `api.source`             | `string`                  | Plugin 소스 경로                                                                            |
| `api.rootDir`            | `string?`                 | Plugin 루트 디렉터리(선택 사항)                                                             |
| `api.config`             | `OpenClawConfig`          | 현재 구성 스냅샷(사용 가능한 경우 활성 메모리 내 런타임 스냅샷)                            |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 Plugin별 구성                                                |
| `api.runtime`            | `PluginRuntime`           | [런타임 도우미](/ko/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | 범위 지정 로거(`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드. `"setup-runtime"`은 전체 진입점 이전의 경량 시작/설정 구간입니다            |
| `api.resolvePath(input)` | `(string) => string`      | Plugin 루트 기준으로 경로 확인                                                              |

## 내부 모듈 규칙

Plugin 내부 가져오기에는 로컬 배럴 파일을 사용합니다.

```text
my-plugin/
  api.ts            # 외부 소비자를 위한 공개 내보내기
  runtime-api.ts    # 내부 전용 런타임 내보내기
  index.ts          # Plugin 진입점
  setup-entry.ts    # 경량 설정 전용 진입점(선택 사항)
```

<Warning>
  프로덕션 코드에서 `openclaw/plugin-sdk/<your-plugin>`을 통해 자체 Plugin을
  가져오지 마십시오. 내부 가져오기는 `./api.ts` 또는
  `./runtime-api.ts`를 통해 라우팅하십시오. SDK 경로는 외부 계약 전용입니다.
</Warning>

퍼사드로 로드되는 번들 Plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 이와 유사한 공개 진입 파일)은
OpenClaw가 이미 실행 중인 경우 활성 런타임 구성 스냅샷을 우선 사용합니다.
아직 런타임 스냅샷이 없으면 디스크에서 확인된 구성 파일을 대신 사용합니다.
패키징된 번들 Plugin 퍼사드는 OpenClaw의 Plugin 퍼사드 로더를 통해
로드해야 합니다. `dist/extensions/...`에서 직접 가져오면 패키징된 설치가
Plugin 소유 코드에 사용하는 매니페스트 및 런타임 사이드카 검사를 우회합니다.

도우미가 의도적으로 공급자에 특화되어 있고 아직 일반 SDK 하위 경로에
속하지 않는 경우, 공급자 Plugin은 범위가 좁은 Plugin 로컬 계약 배럴을
노출할 수 있습니다. 번들 예시는 다음과 같습니다.

- **Anthropic**: Claude 베타 헤더 및 `service_tier` 스트림 도우미를 위한
  공개 `api.ts` / `contract-api.ts` 경계.
- **`@openclaw/openai-provider`**: `api.ts`에서 공급자 빌더,
  기본 모델 도우미 및 실시간 공급자 빌더를 내보냅니다.
- **`@openclaw/openrouter-provider`**: `api.ts`에서 공급자 빌더와
  온보딩/구성 도우미를 내보냅니다.

<Warning>
  확장 프로덕션 코드에서도 `openclaw/plugin-sdk/<other-plugin>`
  가져오기를 피해야 합니다. 도우미가 실제로 공유된다면 두 Plugin을
  결합하는 대신 `openclaw/plugin-sdk/speech`, `.../provider-model-shared`
  또는 다른 기능 중심 표면과 같은 중립적인 SDK 하위 경로로 승격하십시오.
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="진입점" icon="door-open" href="/ko/plugins/sdk-entrypoints">
    `definePluginEntry` 및 `defineChannelPluginEntry` 옵션.
  </Card>
  <Card title="런타임 도우미" icon="gears" href="/ko/plugins/sdk-runtime">
    전체 `api.runtime` 네임스페이스 참조.
  </Card>
  <Card title="설정 및 구성" icon="sliders" href="/ko/plugins/sdk-setup">
    패키징, 매니페스트 및 구성 스키마.
  </Card>
  <Card title="테스트" icon="vial" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 린트 규칙.
  </Card>
  <Card title="SDK 마이그레이션" icon="arrows-turn-right" href="/ko/plugins/sdk-migration">
    사용 중단된 표면에서 마이그레이션하기.
  </Card>
  <Card title="Plugin 내부 구조" icon="diagram-project" href="/ko/plugins/architecture">
    심층 아키텍처 및 기능 모델.
  </Card>
</CardGroup>
