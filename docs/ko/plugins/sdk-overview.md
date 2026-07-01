---
read_when:
    - 어느 SDK 하위 경로에서 가져와야 하는지 알아야 합니다
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조가 필요합니다
    - 특정 SDK 내보내기를 조회하고 있습니다
sidebarTitle: Plugin SDK overview
summary: Import map, 등록 API 참조 및 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-07-01T18:10:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK는 Plugin과 코어 사이의 타입이 지정된 계약입니다. 이 페이지는
**무엇을 import할지**와 **무엇을 등록할 수 있는지**에 대한 참조입니다.

<Note>
  이 페이지는 OpenClaw 내부에서 `openclaw/plugin-sdk/*`를 사용하는 Plugin 작성자를 위한
  것입니다. Gateway를 통해 에이전트를 실행하려는 외부 앱, 스크립트, 대시보드, CI 작업,
  IDE 확장은 대신 [외부 앱을 위한 Gateway 통합](/ko/gateway/external-apps)을 사용하세요.
</Note>

<Tip>
대신 방법 안내를 찾고 있나요? [Plugin 빌드](/ko/plugins/building-plugins)에서 시작하고, 채널 Plugin에는 [채널 Plugin](/ko/plugins/sdk-channel-plugins)을, 공급자 Plugin에는 [공급자 Plugin](/ko/plugins/sdk-provider-plugins)을, 로컬 AI CLI 백엔드에는 [CLI 백엔드 Plugin](/ko/plugins/cli-backend-plugins)을, 도구 또는 수명 주기 훅 Plugin에는 [Plugin 훅](/ko/plugins/hooks)을 사용하세요.
</Tip>

## Import 규칙

항상 특정 하위 경로에서 import하세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 하위 경로는 작고 독립적인 모듈입니다. 이렇게 하면 시작이 빠르게 유지되고
순환 의존성 문제가 방지됩니다. 채널별 엔트리/빌드 헬퍼에는
`openclaw/plugin-sdk/channel-core`를 선호하고, 더 넓은 포괄 표면과
`buildChannelConfigSchema` 같은 공유 헬퍼에는 `openclaw/plugin-sdk/core`를
유지하세요.

채널 구성의 경우 채널이 소유한 JSON Schema를
`openclaw.plugin.json#channelConfigs`를 통해 게시하세요. `plugin-sdk/channel-config-schema`
하위 경로는 공유 스키마 프리미티브와 범용 빌더를 위한 것입니다. OpenClaw의
번들 Plugin은 유지되는 번들 채널 스키마에 `plugin-sdk/bundled-channel-config-schema`를
사용합니다. 사용 중단된 호환성 export는 `plugin-sdk/channel-config-schema-legacy`에
남아 있습니다. 두 번들 스키마 하위 경로 모두 새 Plugin을 위한 패턴이 아닙니다.

<Warning>
  공급자 또는 채널 브랜드가 붙은 편의 접합부(예:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)를 import하지 마세요.
  번들 Plugin은 자체 `api.ts` / `runtime-api.ts` 배럴 내부에서 범용 SDK 하위 경로를
  조합합니다. 코어 소비자는 해당 Plugin 로컬 배럴을 사용하거나, 필요가 실제로
  채널 간 공통일 때 좁은 범용 SDK 계약을 추가해야 합니다.

추적된 소유자 사용이 있는 경우, 생성된 export 맵에 소수의 번들 Plugin 헬퍼 접합부가
아직 표시됩니다. 이들은 번들 Plugin 유지 관리를 위해서만 존재하며, 새 서드파티
Plugin에 권장되는 import 경로가 아닙니다.

`openclaw/plugin-sdk/discord`와 `openclaw/plugin-sdk/telegram-account`도 추적된 소유자 사용을 위한
사용 중단된 호환성 파사드로 유지됩니다. 이러한 import 경로를 새 Plugin에 복사하지
마세요. 대신 주입된 런타임 헬퍼와 범용 채널 SDK 하위 경로를 사용하세요.
</Warning>

## 하위 경로 참조

Plugin SDK는 영역별(Plugin 엔트리, 채널, 공급자, 인증, 런타임, 기능, 메모리,
예약된 번들 Plugin 헬퍼)로 그룹화된 좁은 하위 경로 집합으로 노출됩니다.
그룹화되고 링크된 전체 카탈로그는 [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를
참조하세요.

컴파일러 엔트리포인트 인벤토리는 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.
패키지 export는 `scripts/lib/plugin-sdk-private-local-only-subpaths.json`에 나열된
저장소 로컬 테스트/내부 하위 경로를 제외한 뒤 공개 하위 집합에서 생성됩니다.
공개 export 수를 감사하려면 `pnpm plugin-sdk:surface`를 실행하세요. 충분히 오래되었고
번들 확장 프로덕션 코드에서 사용되지 않는 사용 중단 공개 하위 경로는
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`에서 추적됩니다. 광범위한
사용 중단 재export 배럴은 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`에서
추적됩니다.

## 등록 API

`register(api)` 콜백은 다음 메서드가 있는 `OpenClawPluginApi` 객체를 받습니다.

### 기능 등록

| 메서드                                           | 등록하는 항목                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | 텍스트 추론(LLM)                      |
| `api.registerAgentHarness(...)`                  | 실험적 저수준 에이전트 실행기         |
| `api.registerCliBackend(...)`                    | 로컬 CLI 추론 백엔드                  |
| `api.registerChannel(...)`                       | 메시징 채널                           |
| `api.registerEmbeddingProvider(...)`             | 재사용 가능한 벡터 임베딩 공급자      |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성           |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 실시간 전사                  |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 실시간 음성 세션               |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/비디오 분석             |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성                           |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성                             |
| `api.registerVideoGenerationProvider(...)`       | 비디오 생성                           |
| `api.registerWebFetchProvider(...)`              | 웹 fetch / 스크레이프 공급자          |
| `api.registerWebSearchProvider(...)`             | 웹 검색                               |

`api.registerEmbeddingProvider(...)`로 등록된 임베딩 공급자는 Plugin 매니페스트의
`contracts.embeddingProviders`에도 나열되어야 합니다. 이는 재사용 가능한 벡터 생성을 위한
범용 임베딩 표면입니다. 메모리 검색은 이 범용 공급자 표면을 사용할 수 있습니다. 이전
`api.registerMemoryEmbeddingProvider(...)` 및 `contracts.memoryEmbeddingProviders` 접합부는 기존
메모리별 공급자가 마이그레이션하는 동안의 사용 중단된 호환성입니다.

아직 런타임 `batchEmbed(...)`를 노출하는 메모리별 공급자는 런타임이 명시적으로
`sourceWideBatchEmbed: true`를 설정하지 않는 한 기존 파일별 배치 처리 계약에 남습니다.
이 opt-in은 메모리 호스트가 여러 더티 메모리 파일과 활성화된 소스의 청크를 호스트
배치 한도까지 하나의 `batchEmbed(...)` 호출로 제출할 수 있게 합니다. JSONL 요청 파일을
업로드하는 배치 어댑터는 요청 수 한도뿐 아니라 업로드 크기 상한 전에 공급자 작업도
분할해야 합니다. 공급자는 `batch.chunks`와 동일한 순서로 입력 청크당 하나의 임베딩을
반환해야 합니다. 공급자가 파일 로컬 배치를 예상하거나 더 큰 소스 전체 작업에서 입력
순서를 보존할 수 없는 경우 이 플래그를 생략하세요.

### 도구 및 명령

고정된 도구 이름을 가진 단순 도구 전용 Plugin에는 [`defineToolPlugin`](/ko/plugins/tool-plugins)을
사용하세요. 혼합 Plugin 또는 완전 동적 도구 등록에는 `api.registerTool(...)`을 직접
사용하세요.

| 메서드                          | 등록하는 항목                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | 에이전트 도구(필수 또는 `{ optional: true }`) |
| `api.registerCommand(def)`      | 사용자 지정 명령(LLM 우회)                    |

Plugin 명령은 에이전트에 짧은 명령 소유 라우팅 힌트가 필요할 때
`agentPromptGuidance`를 설정할 수 있습니다. 그 텍스트는 명령 자체에 관한 내용으로 유지하고,
공급자 또는 Plugin별 정책을 코어 프롬프트 빌더에 추가하지 마세요.

가이드 항목은 모든 프롬프트 표면에 적용되는 레거시 문자열이거나 구조화된 항목일 수 있습니다.

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

구조화된 `surfaces`에는 `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, `subagent`가 포함될 수 있습니다. `pi_main`은
`openclaw_main`의 사용 중단된 별칭으로 남아 있습니다. 의도적으로 모든 표면에 대한
가이드인 경우 `surfaces`를 생략하세요. 빈 `surfaces` 배열을 전달하지 마세요. 우발적인
범위 손실이 전역 프롬프트 텍스트가 되지 않도록 거부됩니다.

네이티브 Codex 앱 서버 개발자 지침은 다른 프롬프트 표면보다 더 엄격합니다.
`codex_app_server`로 명시적으로 범위가 지정된 가이드만 해당 더 높은 우선순위 레인으로
승격됩니다. 레거시 문자열 가이드와 범위가 지정되지 않은 구조화된 가이드는 호환성을 위해
비 Codex 프롬프트 표면에서 계속 사용할 수 있습니다.

### 인프라

| 메서드                                         | 등록하는 항목                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 이벤트 훅                               |
| `api.registerHttpRoute(params)`                | Gateway HTTP 엔드포인트                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 메서드                      |
| `api.registerGatewayDiscoveryService(service)` | 로컬 Gateway 발견 알림자                |
| `api.registerCli(registrar, opts?)`            | CLI 하위 명령                           |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 아래의 Node 기능 CLI   |
| `api.registerService(service)`                 | 백그라운드 서비스                       |
| `api.registerInteractiveHandler(registration)` | 인터랙티브 핸들러                       |
| `api.registerAgentToolResultMiddleware(...)`   | 런타임 도구 결과 미들웨어               |
| `api.registerMemoryPromptSupplement(builder)`  | 추가형 메모리 인접 프롬프트 섹션        |
| `api.registerMemoryCorpusSupplement(adapter)`  | 추가형 메모리 검색/읽기 코퍼스          |

### 워크플로 Plugin을 위한 호스트 훅

호스트 훅은 공급자, 채널 또는 도구만 추가하는 것이 아니라 호스트 수명 주기에 참여해야 하는
Plugin을 위한 SDK 접합부입니다. 이들은 범용 계약입니다. Plan Mode가 사용할 수 있지만,
승인 워크플로, 워크스페이스 정책 게이트, 백그라운드 모니터, 설정 마법사, UI 동반
Plugin도 사용할 수 있습니다.

| 메서드                                                                               | 소유하는 계약                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway 세션을 통해 투영되는 Plugin 소유의 JSON 호환 세션 상태                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 한 세션의 다음 에이전트 턴에 주입되는 내구성 있는 정확히 한 번의 컨텍스트                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | 도구 매개변수를 차단하거나 다시 쓸 수 있는, 매니페스트로 게이트되는 신뢰할 수 있는 Plugin 전 도구 정책                                                                        |
| `api.registerToolMetadata(...)`                                                      | 도구 구현을 변경하지 않는 도구 카탈로그 표시 메타데이터                                                                                     |
| `api.registerCommand(...)`                                                           | 범위가 지정된 Plugin 명령; 명령 결과는 `continueAgent: true` 또는 `suppressReply: true`를 설정할 수 있음; Discord 네이티브 명령은 `descriptionLocalizations`를 지원함 |
| `api.session.controls.registerControlUiDescriptor(...)`                              | 세션, 도구, 실행 또는 설정 표면을 위한 Control UI 기여 디스크립터                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | 재설정/삭제/다시 로드 경로에서 Plugin 소유 런타임 리소스를 정리하는 콜백                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 워크플로 상태 및 모니터를 위한 정제된 이벤트 구독                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 터미널 실행 수명 주기에서 정리되는 실행별 Plugin 스크래치 상태                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 소유 스케줄러 작업을 위한 정리 메타데이터; 작업을 예약하거나 작업 레코드를 만들지 않음                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 활성 직접 아웃바운드 세션 경로로 번들 전용 호스트 중재 파일 첨부 전달                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 번들 전용 Cron 기반 예약 세션 턴과 태그 기반 정리                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | 클라이언트가 Gateway를 통해 디스패치할 수 있는 형식 지정된 세션 작업                                                                                             |

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

동등한 플랫 메서드는 기존 Plugin을 위한 사용 중단된 호환성
별칭으로 계속 사용할 수 있습니다. `api.registerSessionExtension`,
`api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`,
`api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`,
`api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`,
`api.clearRunContext`, `api.registerSessionSchedulerJob`,
`api.registerSessionAction`, `api.sendSessionAttachment`,
`api.scheduleSessionTurn` 또는 `api.unscheduleSessionTurnsByTag`를
직접 호출하는 새 Plugin 코드는 추가하지 마세요.

`scheduleSessionTurn(...)`은 Gateway Cron 스케줄러 위에 있는 세션 범위
편의 기능입니다. Cron은 타이밍을 소유하고 턴이 실행될 때 백그라운드 작업
레코드를 만듭니다. Plugin SDK는 대상 세션, Plugin 소유 이름 지정,
정리만 제한합니다. 작업 자체에 내구성 있는 다단계 Task Flow 상태가 필요한
경우 예약된 턴 안에서 `api.runtime.tasks.managedFlows`를 사용하세요.

계약은 의도적으로 권한을 나눕니다.

- 외부 Plugin은 세션 확장, UI 디스크립터, 명령, 도구
  메타데이터, 다음 턴 주입 및 일반 훅을 소유할 수 있습니다.
- 신뢰할 수 있는 도구 정책은 일반 `before_tool_call` 훅보다 먼저 실행되며
  호스트가 신뢰합니다. 번들 정책이 먼저 실행되고, 설치된 Plugin 정책은
  명시적 활성화와 `contracts.trustedToolPolicies`의 로컬 ID가 필요하며,
  그다음 Plugin 로드 순서대로 실행됩니다. 정책 ID는 등록하는 Plugin으로
  범위가 지정됩니다.
- 예약된 명령 소유권은 번들 전용입니다. 외부 Plugin은 자체
  명령 이름이나 별칭을 사용해야 합니다.
- `allowPromptInjection=false`는 `agent_turn_prepare`,
  `before_prompt_build`, `heartbeat_prompt_contribution`, 레거시
  `before_agent_start`의 프롬프트 필드, `enqueueNextTurnInjection`을
  포함한 프롬프트 변경 훅을 비활성화합니다.

Plan이 아닌 소비자의 예:

| Plugin 원형             | 사용되는 훅                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 승인 워크플로            | 세션 확장, 명령 계속 실행, 다음 턴 주입, UI 디스크립터                                                            |
| 예산/워크스페이스 정책 게이트 | 신뢰할 수 있는 도구 정책, 도구 메타데이터, 세션 투영                                                                                 |
| 백그라운드 수명 주기 모니터 | 런타임 수명 주기 정리, 에이전트 이벤트 구독, 세션 스케줄러 소유권/정리, Heartbeat 프롬프트 기여, UI 디스크립터 |
| 설정 또는 온보딩 마법사   | 세션 확장, 범위가 지정된 명령, Control UI 디스크립터                                                                              |

<Note>
  예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`)는 Plugin이 더 좁은 gateway 메서드 범위를 할당하려고 해도 항상
  `operator.admin`으로 유지됩니다. Plugin 소유 메서드에는 Plugin별 접두사를
  선호하세요.
</Note>

<Accordion title="When to use tool-result middleware">
  번들 Plugin과 일치하는 매니페스트 계약으로 명시적으로 활성화된 설치 Plugin은
  실행 후 런타임이 해당 결과를 모델에 다시 제공하기 전에 도구 결과를 다시 써야
  할 때 `api.registerAgentToolResultMiddleware(...)`를 사용할 수 있습니다.
  이것은 tokenjuice 같은 비동기 출력 리듀서를 위한 신뢰할 수 있는 런타임 중립
  이음매입니다.

Plugin은 대상 런타임마다 `contracts.agentToolResultMiddleware`를 선언해야
합니다. 예: `["openclaw", "codex"]`. 해당 계약이 없거나 명시적으로
활성화되지 않은 설치 Plugin은 이 미들웨어를 등록할 수 없습니다. 모델 전
도구 결과 타이밍이 필요하지 않은 작업에는 일반 OpenClaw Plugin 훅을
유지하세요. 이전의 임베디드 러너 전용 확장 팩터리 등록 경로는 제거되었습니다.
</Accordion>

### Gateway 탐색 등록

`api.registerGatewayDiscoveryService(...)`를 사용하면 Plugin이 mDNS/Bonjour
같은 로컬 탐색 전송에서 활성 Gateway를 알릴 수 있습니다. OpenClaw는 로컬
탐색이 활성화된 경우 Gateway 시작 중 서비스를 호출하고, 현재 Gateway 포트와
비밀이 아닌 TXT 힌트 데이터를 전달하며, Gateway 종료 중 반환된 `stop`
핸들러를 호출합니다.

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

Gateway 탐색 Plugin은 광고된 TXT 값을 비밀이나 인증으로 취급해서는 안 됩니다.
탐색은 라우팅 힌트입니다. Gateway 인증과 TLS 핀 고정이 여전히 신뢰를
소유합니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 명령 메타데이터를 받습니다.

- `commands`: 등록자가 소유한 명시적 명령 이름
- `descriptors`: CLI 도움말, 라우팅, 지연 Plugin CLI 등록에 사용되는
  파싱 시점 명령 디스크립터
- `parentPath`: `["nodes"]` 같은 중첩 명령 그룹의 선택적 부모 명령 경로

페어링된 노드 기능에는 `api.registerNodeCliFeature(registrar, opts?)`를
선호하세요. 이것은 `api.registerCli(..., { parentPath: ["nodes"] })`를
감싼 작은 래퍼이며 `openclaw nodes canvas` 같은 명령을 명시적인 Plugin 소유
노드 기능으로 만듭니다.

Plugin 명령을 일반 루트 CLI 경로에서 지연 로드 상태로 유지하려면 해당
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

중첩 명령은 해석된 부모 명령을 `program`으로 받습니다.

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
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

지연 루트 CLI 등록이 필요하지 않을 때만 `commands`만 사용하세요.
이 즉시 호환성 경로는 계속 지원되지만, 파싱 시점 지연 로딩을 위한
디스크립터 기반 자리표시자를 설치하지는 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`를 사용하면 Plugin이 `claude-cli` 또는
`my-cli` 같은 로컬 AI CLI 백엔드의 기본 구성을 소유할 수 있습니다.

- 백엔드 `id`는 `my-cli/gpt-5` 같은 모델 참조에서 provider 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 같은 형태를 사용합니다.
- 사용자 구성은 여전히 우선합니다. OpenClaw는 CLI를 실행하기 전에 Plugin 기본값 위에
  `agents.defaults.cliBackends.<id>`를 병합합니다.
- 백엔드가 병합 후 호환성 재작성(예: 이전 플래그 형태 정규화)이 필요할 때는
  `normalizeConfig`를 사용하세요.
- OpenClaw 사고 수준을 네이티브 effort 플래그에 매핑하는 것처럼
  CLI 방언에 속하는 요청 범위 argv 재작성에는 `resolveExecutionArgs`를 사용하세요.
  이 훅은 `ctx.executionMode`를 받습니다. 일시적인 `/btw` 호출에
  백엔드 네이티브 격리 플래그를 추가하려면 `"side-question"`을 사용하세요. 이러한 플래그가
  원래 항상 켜져 있는 CLI에서 네이티브 도구를 안정적으로 비활성화한다면
  `sideQuestionToolMode: "disabled"`도 선언하세요.

엔드투엔드 작성 가이드는
[CLI 백엔드 Plugin](/ko/plugins/cli-backend-plugins)을 참조하세요.

### 독점 슬롯

| 메서드                                     | 등록하는 항목                                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 컨텍스트 엔진(한 번에 하나만 활성). 호스트가 모델/provider/모드 진단을 제공할 수 있으면 수명 주기 콜백은 `runtimeSettings`를 받으며, 이전 strict 엔진은 해당 키 없이 다시 시도됩니다. |
| `api.registerMemoryCapability(capability)` | 통합 메모리 기능                                                                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더                                                                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 플러시 계획 리졸버                                                                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 어댑터                                                                                                                                                                               |

### 사용 중단된 메모리 임베딩 어댑터

| 메서드                                         | 등록하는 항목                              |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 Plugin의 메모리 임베딩 어댑터 |

- `registerMemoryCapability`는 선호되는 독점 메모리 Plugin API입니다.
- `registerMemoryCapability`는 `publicArtifacts.listArtifacts(...)`도 노출할 수 있어
  동반 Plugin이 특정 메모리 Plugin의 비공개 레이아웃에 접근하는 대신
  `openclaw/plugin-sdk/memory-host-core`를 통해 내보낸 메모리 아티팩트를 사용할 수 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`,
  `registerMemoryRuntime`은 레거시 호환 독점 메모리 Plugin API입니다.
- `MemoryFlushPlan.model`은 활성 폴백 체인을 상속하지 않고
  `ollama/qwen3:8b` 같은 정확한 `provider/model` 참조로 플러시 턴을 고정할 수 있습니다.
- `registerMemoryEmbeddingProvider`는 사용 중단되었습니다. 새 임베딩 provider는
  `api.registerEmbeddingProvider(...)`와 `contracts.embeddingProviders`를 사용해야 합니다.
- 기존 메모리 전용 provider는 마이그레이션 기간 동안 계속 작동하지만,
  Plugin 검사에서는 번들에 포함되지 않은 Plugin에 대해 이를 호환성 부채로 보고합니다.

### 이벤트와 수명 주기

| 메서드                                       | 수행하는 작업                  |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | 타입이 지정된 수명 주기 훅     |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백               |

예시, 일반적인 훅 이름, 가드 의미론은 [Plugin 훅](/ko/plugins/hooks)을 참조하세요.

### 훅 결정 의미론

`before_install`은 Plugin 런타임 수명 주기 훅이며, 운영자 설치 정책 표면이 아닙니다.
허용/차단 결정이 CLI 및 Gateway 기반 설치 또는 업데이트 경로를 포괄해야 할 때는
`security.installPolicy`를 사용하세요.

- `before_tool_call`: `{ block: true }`를 반환하면 종료 결정입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 결정 없음(`block` 생략과 동일)으로 처리되며, 재정의가 아닙니다.
- `before_install`: `{ block: true }`를 반환하면 종료 결정입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 결정 없음(`block` 생략과 동일)으로 처리되며, 재정의가 아닙니다.
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 종료 결정입니다. 어떤 핸들러든 디스패치를 맡으면 더 낮은 우선순위 핸들러와 기본 모델 디스패치 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 종료 결정입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 결정 없음(`cancel` 생략과 동일)으로 처리되며, 재정의가 아닙니다.
- `message_received`: 인바운드 스레드/주제 라우팅이 필요할 때 타입이 지정된 `threadId` 필드를 사용하세요. 채널별 추가 항목에는 `metadata`를 유지하세요.
- `message_sending`: 채널별 `metadata`로 폴백하기 전에 타입이 지정된 `replyToId` / `threadId` 라우팅 필드를 사용하세요.
- `gateway_start`: 내부 `gateway:startup` 훅에 의존하는 대신 Gateway가 소유하는 시작 상태에는 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`을 사용하세요.
- `cron_changed`: Gateway가 소유하는 Cron 수명 주기 변경을 관찰합니다. 외부 깨우기 스케줄러를 동기화할 때 `event.job?.state?.nextRunAtMs`와 `ctx.getCron?.()`을 사용하고, 만기 확인 및 실행의 신뢰 원본은 OpenClaw로 유지하세요.

### API 객체 필드

| 필드                     | 타입                      | 설명                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                    |
| `api.name`               | `string`                  | 표시 이름                                                                                    |
| `api.version`            | `string?`                 | Plugin 버전(선택 사항)                                                                       |
| `api.description`        | `string?`                 | Plugin 설명(선택 사항)                                                                       |
| `api.source`             | `string`                  | Plugin 소스 경로                                                                             |
| `api.rootDir`            | `string?`                 | Plugin 루트 디렉터리(선택 사항)                                                              |
| `api.config`             | `OpenClawConfig`          | 현재 구성 스냅샷(사용 가능한 경우 활성 인메모리 런타임 스냅샷)                              |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 Plugin별 구성                                                |
| `api.runtime`            | `PluginRuntime`           | [런타임 헬퍼](/ko/plugins/sdk-runtime)                                                          |
| `api.logger`             | `PluginLogger`            | 범위 지정 로거(`debug`, `info`, `warn`, `error`)                                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드. `"setup-runtime"`은 전체 엔트리 전의 경량 시작/설정 구간입니다               |
| `api.resolvePath(input)` | `(string) => string`      | Plugin 루트를 기준으로 경로 해석                                                             |

## 내부 모듈 규칙

Plugin 내부에서는 내부 가져오기에 로컬 배럴 파일을 사용하세요.

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  프로덕션 코드에서 `openclaw/plugin-sdk/<your-plugin>`을 통해 자신의 Plugin을
  가져오지 마세요. 내부 가져오기는 `./api.ts` 또는
  `./runtime-api.ts`를 통해 라우팅하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

Facade로 로드되는 번들 Plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 유사한 공개 엔트리 파일)은 OpenClaw가 이미 실행 중이면
활성 런타임 구성 스냅샷을 선호합니다. 아직 런타임 스냅샷이 없으면 디스크의 해석된 구성 파일로
폴백합니다. 패키징된 번들 Plugin facade는 OpenClaw의 Plugin facade 로더를 통해
로드해야 합니다. `dist/extensions/...`에서 직접 가져오면 패키징 설치가 Plugin 소유 코드에
사용하는 매니페스트 및 런타임 사이드카 검사를 우회합니다.

provider Plugin은 헬퍼가 의도적으로 provider 전용이고 아직 일반 SDK 하위 경로에
속하지 않을 때 좁은 Plugin 로컬 계약 배럴을 노출할 수 있습니다. 번들 예시:

- **Anthropic**: Claude beta-header 및 `service_tier` 스트림 헬퍼를 위한 공개 `api.ts` / `contract-api.ts` 경계.
- **`@openclaw/openai-provider`**: `api.ts`는 provider 빌더, 기본 모델 헬퍼, 실시간 provider 빌더를 내보냅니다.
- **`@openclaw/openrouter-provider`**: `api.ts`는 provider 빌더와 온보딩/구성 헬퍼를 내보냅니다.

<Warning>
  Extension 프로덕션 코드도 `openclaw/plugin-sdk/<other-plugin>` 가져오기를 피해야 합니다.
  헬퍼가 실제로 공유된다면 두 Plugin을 서로 결합하는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` 또는 다른
  기능 지향 표면 같은 중립 SDK 하위 경로로 승격하세요.
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/ko/plugins/sdk-entrypoints">
    `definePluginEntry` 및 `defineChannelPluginEntry` 옵션.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/ko/plugins/sdk-runtime">
    전체 `api.runtime` 네임스페이스 참조.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/ko/plugins/sdk-setup">
    패키징, 매니페스트, 구성 스키마.
  </Card>
  <Card title="Testing" icon="vial" href="/ko/plugins/sdk-testing">
    테스트 유틸리티와 lint 규칙.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ko/plugins/sdk-migration">
    사용 중단된 표면에서 마이그레이션.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ko/plugins/architecture">
    심층 아키텍처와 기능 모델.
  </Card>
</CardGroup>
