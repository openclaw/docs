---
read_when:
    - 가져올 SDK 하위 경로를 알아야 합니다
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조 문서가 필요합니다
    - 특정 SDK 내보내기 항목을 찾고 있습니다
sidebarTitle: Plugin SDK overview
summary: 임포트 맵, 등록 API 참조 및 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-05-11T20:34:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK는 Plugin과 core 사이의 타입이 지정된 계약입니다. 이 페이지는
**무엇을 import해야 하는지**와 **무엇을 등록할 수 있는지**에 대한
참조입니다.

<Note>
  이 페이지는 OpenClaw 내부에서 `openclaw/plugin-sdk/*`를 사용하는 Plugin
  작성자를 위한 것입니다. Gateway를 통해 agent를 실행하려는 외부 앱,
  스크립트, 대시보드, CI 작업, IDE 확장에는 대신
  [OpenClaw App SDK](/ko/concepts/openclaw-sdk)와 `@openclaw/sdk` 패키지를
  사용하세요.
</Note>

<Tip>
대신 방법 안내를 찾고 있나요? [Plugin 빌드](/ko/plugins/building-plugins)부터 시작하고, channel Plugin에는 [Channel plugins](/ko/plugins/sdk-channel-plugins), provider Plugin에는 [Provider plugins](/ko/plugins/sdk-provider-plugins), 로컬 AI CLI backend에는 [CLI backend plugins](/ko/plugins/cli-backend-plugins), tool 또는 lifecycle hook Plugin에는 [Plugin hooks](/ko/plugins/hooks)를 사용하세요.
</Tip>

## Import 규칙

항상 특정 subpath에서 import하세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 subpath는 작고 독립적인 모듈입니다. 이렇게 하면 시작이 빠르게 유지되고
순환 의존성 문제가 방지됩니다. channel별 entry/build helper에는
`openclaw/plugin-sdk/channel-core`를 선호하고, 더 넓은 umbrella surface와
`buildChannelConfigSchema` 같은 shared helper에는 `openclaw/plugin-sdk/core`를
유지하세요.

channel config의 경우 channel이 소유한 JSON Schema를
`openclaw.plugin.json#channelConfigs`를 통해 게시하세요. `plugin-sdk/channel-config-schema`
subpath는 shared schema primitive와 generic builder를 위한 것입니다. OpenClaw의
bundled Plugin은 유지되는 bundled-channel schema에 `plugin-sdk/bundled-channel-config-schema`를
사용합니다. deprecated compatibility export는
`plugin-sdk/channel-config-schema-legacy`에 남아 있습니다. bundled schema subpath 중
어느 것도 새 Plugin을 위한 패턴이 아닙니다.

<Warning>
  provider 또는 channel 브랜드의 convenience seam(예:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)을
  import하지 마세요. bundled Plugin은 자체 `api.ts` /
  `runtime-api.ts` barrel 안에서 generic SDK subpath를 조합합니다. core consumer는
  해당 Plugin-local barrel을 사용하거나, 필요가 실제로 cross-channel일 때 좁은
  generic SDK contract를 추가해야 합니다.

tracked owner usage가 있는 경우 소수의 bundled-Plugin helper seam이 generated export
map에 여전히 나타납니다. 이것들은 bundled-Plugin maintenance 전용이며, 새로운
third-party Plugin에 권장되는 import path가 아닙니다.

`openclaw/plugin-sdk/discord`와 `openclaw/plugin-sdk/telegram-account`도
tracked owner usage를 위한 deprecated compatibility facade로 유지됩니다. 이런
import path를 새 Plugin에 복사하지 마세요. 대신 injected runtime helper와
generic channel SDK subpath를 사용하세요.
</Warning>

## Subpath 참조

Plugin SDK는 영역별로 그룹화된 좁은 subpath 집합(plugin
entry, channel, provider, auth, runtime, capability, memory, reserved
bundled-Plugin helper)으로 노출됩니다. 그룹화되고 링크된 전체 catalog는
[Plugin SDK subpaths](/ko/plugins/sdk-subpaths)를 참조하세요.

compiler entrypoint inventory는
`scripts/lib/plugin-sdk-entrypoints.json`에 있습니다. package export는
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`에 나열된 repo-local test/internal subpath를
제외한 뒤 public subset에서 생성됩니다. public export 수를 감사하려면
`pnpm plugin-sdk:surface`를 실행하세요. 충분히 오래되었고 bundled extension production code에서
사용되지 않는 deprecated public subpath는
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`에서 추적됩니다. 광범위한
deprecated re-export barrel은
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`에서 추적됩니다.

## Registration API

`register(api)` callback은 다음 메서드가 있는 `OpenClawPluginApi` 객체를 받습니다.

### Capability 등록

| Method                                           | 등록하는 항목                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Text inference (LLM)                  |
| `api.registerAgentHarness(...)`                  | Experimental low-level agent executor |
| `api.registerCliBackend(...)`                    | Local CLI inference backend           |
| `api.registerChannel(...)`                       | Messaging channel                     |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis        |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcription      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime voice sessions        |
| `api.registerMediaUnderstandingProvider(...)`    | Image/audio/video analysis            |
| `api.registerImageGenerationProvider(...)`       | Image generation                      |
| `api.registerMusicGenerationProvider(...)`       | Music generation                      |
| `api.registerVideoGenerationProvider(...)`       | Video generation                      |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider           |
| `api.registerWebSearchProvider(...)`             | Web search                            |

### Tool 및 command

| Method                          | 등록하는 항목                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent tool (required 또는 `{ optional: true }`) |
| `api.registerCommand(def)`      | Custom command (LLM을 우회)                   |

Plugin command는 agent에 짧은 command 소유 routing hint가 필요할 때
`agentPromptGuidance`를 설정할 수 있습니다. 해당 텍스트는 command 자체에 관한 내용으로
유지하세요. provider 또는 Plugin별 policy를 core prompt builder에 추가하지 마세요.

### Infrastructure

| Method                                         | 등록하는 항목                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                      |
| `api.registerGatewayDiscoveryService(service)` | Local Gateway discovery advertiser      |
| `api.registerCli(registrar, opts?)`            | CLI subcommand                          |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 아래의 Node feature CLI |
| `api.registerService(service)`                 | Background service                      |
| `api.registerInteractiveHandler(registration)` | Interactive handler                     |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime tool-result middleware          |
| `api.registerMemoryPromptSupplement(builder)`  | Additive memory-adjacent prompt section |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additive memory search/read corpus      |

### Workflow Plugin용 host hook

host hook은 provider, channel 또는 tool을 추가하는 것만이 아니라 host
lifecycle에 참여해야 하는 Plugin을 위한 SDK seam입니다. 이것들은
generic contract입니다. Plan Mode도 사용할 수 있지만, approval workflow,
workspace policy gate, background monitor, setup wizard, UI companion
Plugin도 사용할 수 있습니다.

| Method                                                                               | 소유하는 계약                                                                                                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Gateway session을 통해 투영되는 Plugin 소유 JSON-compatible session state                                                        |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 하나의 session에서 다음 agent turn에 주입되는 durable exactly-once context                                                       |
| `api.registerTrustedToolPolicy(...)`                                                 | tool param을 차단하거나 다시 쓸 수 있는 bundled/trusted pre-Plugin tool policy                                                   |
| `api.registerToolMetadata(...)`                                                      | tool implementation을 변경하지 않는 tool catalog display metadata                                                                |
| `api.registerCommand(...)`                                                           | scoped Plugin command. command result는 `continueAgent: true`를 설정할 수 있음. Discord native command는 `descriptionLocalizations` 지원 |
| `api.session.controls.registerControlUiDescriptor(...)`                              | session, tool, run 또는 settings surface용 control UI contribution descriptor                                                    |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | reset/delete/reload path에서 Plugin 소유 runtime resource를 위한 cleanup callback                                                |
| `api.agent.events.registerAgentEventSubscription(...)`                               | workflow state와 monitor를 위한 sanitized event subscription                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | terminal run lifecycle에서 지워지는 per-run Plugin scratch state                                                                 |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 소유 scheduler job을 위한 cleanup metadata. work를 schedule하거나 task record를 만들지 않음                               |
| `api.session.workflow.sendSessionAttachment(...)`                                    | active direct-outbound session route로 전달되는 bundled-only host-mediated file attachment delivery                              |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | bundled-only Cron-backed scheduled session turn 및 tag-based cleanup                                                             |
| `api.session.controls.registerSessionAction(...)`                                    | client가 Gateway를 통해 dispatch할 수 있는 typed session action                                                                  |

새 Plugin code에는 grouped namespace를 사용하세요.

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

동등한 flat method는 기존 Plugin을 위한 deprecated compatibility alias로 계속 사용할 수 있습니다.
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` 또는
`api.unscheduleSessionTurnsByTag`를 직접 호출하는 새 Plugin code를 추가하지 마세요.

`scheduleSessionTurn(...)`은 Gateway Cron 스케줄러를 세션 범위에서 편리하게 감싼 기능입니다. Cron은 타이밍을 소유하고 턴이 실행될 때 백그라운드 작업 레코드를 생성합니다. Plugin SDK는 대상 세션, Plugin 소유 이름 지정, 정리만 제한합니다. 작업 자체에 내구성 있는 다단계 TaskFlow 상태가 필요할 때는 예약된 턴 안에서 `api.runtime.tasks.managedFlows`를 사용하세요.

계약은 의도적으로 권한을 분리합니다.

- 외부 Plugin은 세션 확장, UI 설명자, 명령, 도구 메타데이터, 다음 턴 주입, 일반 훅을 소유할 수 있습니다.
- 신뢰할 수 있는 도구 정책은 일반 `before_tool_call` 훅보다 먼저 실행되며, 호스트 안전 정책에 참여하므로 번들 전용입니다.
- 예약된 명령 소유권은 번들 전용입니다. 외부 Plugin은 자체 명령 이름이나 별칭을 사용해야 합니다.
- `allowPromptInjection=false`는 `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, 레거시 `before_agent_start`의 프롬프트 필드, `enqueueNextTurnInjection`을 포함한 프롬프트 변경 훅을 비활성화합니다.

Plan이 아닌 소비자의 예:

| Plugin 원형                  | 사용되는 훅                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 승인 워크플로                | 세션 확장, 명령 계속 실행, 다음 턴 주입, UI 설명자                                                                                  |
| 예산/워크스페이스 정책 게이트 | 신뢰할 수 있는 도구 정책, 도구 메타데이터, 세션 프로젝션                                                                            |
| 백그라운드 수명 주기 모니터 | 런타임 수명 주기 정리, 에이전트 이벤트 구독, 세션 스케줄러 소유권/정리, Heartbeat 프롬프트 기여, UI 설명자                         |
| 설정 또는 온보딩 마법사     | 세션 확장, 범위 지정 명령, Control UI 설명자                                                                                        |

<Note>
  예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`)는 Plugin이 더 좁은 Gateway 메서드 범위를 할당하려 해도 항상
  `operator.admin`으로 유지됩니다. Plugin 소유 메서드에는 Plugin별 접두사를
  사용하는 것이 좋습니다.
</Note>

<Accordion title="When to use tool-result middleware">
  번들 Plugin은 실행 후 런타임이 해당 결과를 모델에 다시 전달하기 전에 도구 결과를 다시 작성해야 할 때 `api.registerAgentToolResultMiddleware(...)`를 사용할 수 있습니다. 이는 tokenjuice 같은 비동기 출력 리듀서를 위한 신뢰할 수 있는 런타임 중립 접점입니다.

번들 Plugin은 대상 런타임마다 `contracts.agentToolResultMiddleware`를 선언해야 합니다. 예: `["pi", "codex"]`. 외부 Plugin은 이 미들웨어를 등록할 수 없습니다. 모델 이전 도구 결과 타이밍이 필요하지 않은 작업에는 일반 OpenClaw Plugin 훅을 계속 사용하세요. 이전 Pi 전용 내장 확장 팩터리 등록 경로는 제거되었습니다.
</Accordion>

### Gateway 디스커버리 등록

`api.registerGatewayDiscoveryService(...)`를 사용하면 Plugin이 mDNS/Bonjour 같은 로컬 디스커버리 전송에서 활성 Gateway를 알릴 수 있습니다. OpenClaw는 로컬 디스커버리가 활성화된 경우 Gateway 시작 중에 서비스를 호출하고, 현재 Gateway 포트와 비밀이 아닌 TXT 힌트 데이터를 전달하며, Gateway 종료 중에 반환된 `stop` 핸들러를 호출합니다.

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

Gateway 디스커버리 Plugin은 광고된 TXT 값을 비밀이나 인증으로 취급해서는 안 됩니다. 디스커버리는 라우팅 힌트입니다. Gateway 인증과 TLS 고정이 여전히 신뢰를 소유합니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 명령 메타데이터를 받습니다.

- `commands`: 등록자가 소유한 명시적 명령 이름
- `descriptors`: CLI 도움말, 라우팅, 지연 Plugin CLI 등록에 사용되는 파싱 시점 명령 설명자
- `parentPath`: `["nodes"]` 같은 중첩 명령 그룹의 선택적 부모 명령 경로

페어링된 노드 기능에는 `api.registerNodeCliFeature(registrar, opts?)`를 사용하는 것이 좋습니다. 이는 `api.registerCli(..., { parentPath: ["nodes"] })`를 감싼 작은 래퍼이며, `openclaw nodes canvas` 같은 명령을 명시적인 Plugin 소유 노드 기능으로 만듭니다.

Plugin 명령을 일반 루트 CLI 경로에서 지연 로드 상태로 유지하려면 해당 등록자가 노출하는 모든 최상위 명령 루트를 포괄하는 `descriptors`를 제공하세요.

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

지연 루트 CLI 등록이 필요하지 않을 때만 `commands`를 단독으로 사용하세요. 해당 즉시 호환성 경로는 계속 지원되지만, 파싱 시점 지연 로드를 위한 설명자 기반 자리표시자를 설치하지는 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`를 사용하면 Plugin이 `codex-cli` 같은 로컬 AI CLI 백엔드의 기본 구성을 소유할 수 있습니다.

- 백엔드 `id`는 `codex-cli/gpt-5` 같은 모델 참조에서 제공자 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 같은 형태를 사용합니다.
- 사용자 구성이 여전히 우선합니다. OpenClaw는 CLI를 실행하기 전에 `agents.defaults.cliBackends.<id>`를 Plugin 기본값 위에 병합합니다.
- 백엔드가 병합 후 호환성 재작성(예: 이전 플래그 형태 정규화)을 필요로 할 때는 `normalizeConfig`를 사용하세요.
- OpenClaw 사고 수준을 네이티브 effort 플래그에 매핑하는 것처럼 CLI 방언에 속한 요청 범위 argv 재작성에는 `resolveExecutionArgs`를 사용하세요.

엔드투엔드 작성 가이드는 [CLI 백엔드 Plugin](/ko/plugins/cli-backend-plugins)을 참조하세요.

### 배타적 슬롯

| 메서드                                     | 등록하는 항목                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 컨텍스트 엔진(한 번에 하나만 활성). `assemble()` 콜백은 엔진이 프롬프트 추가 내용을 조정할 수 있도록 `availableTools`와 `citationsMode`를 받습니다. |
| `api.registerMemoryCapability(capability)` | 통합 메모리 기능                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 플러시 계획 리졸버                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 어댑터                                                                                                                               |

### 메모리 임베딩 어댑터

| 메서드                                         | 등록하는 항목                       |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 Plugin의 메모리 임베딩 어댑터 |

- `registerMemoryCapability`는 권장되는 배타적 메모리 Plugin API입니다.
- `registerMemoryCapability`는 컴패니언 Plugin이 특정 메모리 Plugin의 비공개 레이아웃에 접근하는 대신 `openclaw/plugin-sdk/memory-host-core`를 통해 내보낸 메모리 아티팩트를 소비할 수 있도록 `publicArtifacts.listArtifacts(...)`도 노출할 수 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, `registerMemoryRuntime`은 레거시 호환 배타적 메모리 Plugin API입니다.
- `MemoryFlushPlan.model`은 활성 폴백 체인을 상속하지 않고 플러시 턴을 `ollama/qwen3:8b` 같은 정확한 `provider/model` 참조에 고정할 수 있습니다.
- `registerMemoryEmbeddingProvider`를 사용하면 활성 메모리 Plugin이 하나 이상의 임베딩 어댑터 ID(예: `openai`, `gemini` 또는 사용자 지정 Plugin 정의 ID)를 등록할 수 있습니다.
- `agents.defaults.memorySearch.provider`와 `agents.defaults.memorySearch.fallback` 같은 사용자 구성은 등록된 해당 어댑터 ID에 대해 해석됩니다.

### 이벤트 및 수명 주기

| 메서드                                       | 수행하는 작업          |
| -------------------------------------------- | ---------------------- |
| `api.on(hookName, handler, opts?)`           | 타입 지정 수명 주기 훅 |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백       |

예시, 일반적인 훅 이름, 가드 의미론은 [Plugin 훅](/ko/plugins/hooks)을 참조하세요.

### 훅 결정 의미론

- `before_tool_call`: `{ block: true }` 반환은 종료 조건입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }` 반환은 재정의가 아니라 결정 없음(`block` 생략과 동일)으로 처리됩니다.
- `before_install`: `{ block: true }` 반환은 종료 조건입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }` 반환은 재정의가 아니라 결정 없음(`block` 생략과 동일)으로 처리됩니다.
- `reply_dispatch`: `{ handled: true, ... }` 반환은 종료 조건입니다. 어떤 핸들러든 디스패치를 처리했다고 선언하면 더 낮은 우선순위의 핸들러와 기본 모델 디스패치 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }` 반환은 종료 조건입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위의 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }` 반환은 재정의가 아니라 결정 없음(`cancel` 생략과 동일)으로 처리됩니다.
- `message_received`: 인바운드 스레드/토픽 라우팅이 필요할 때는 타입 지정 `threadId` 필드를 사용하세요. 채널별 추가 정보에는 `metadata`를 유지하세요.
- `message_sending`: 채널별 `metadata`로 폴백하기 전에 타입 지정 `replyToId` / `threadId` 라우팅 필드를 사용하세요.
- `gateway_start`: 내부 `gateway:startup` 훅에 의존하는 대신 Gateway 소유 시작 상태에는 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`을 사용하세요.
- `cron_changed`: Gateway 소유 Cron 수명 주기 변경을 관찰합니다. 외부 깨우기 스케줄러를 동기화할 때는 `event.job?.state?.nextRunAtMs`와 `ctx.getCron?.()`을 사용하고, 만료 확인과 실행의 진실 공급원은 OpenClaw로 유지하세요.

### API 객체 필드

| 필드                    | 유형                      | 설명                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                   |
| `api.name`               | `string`                  | 표시 이름                                                                                |
| `api.version`            | `string?`                 | Plugin 버전(선택 사항)                                                                   |
| `api.description`        | `string?`                 | Plugin 설명(선택 사항)                                                               |
| `api.source`             | `string`                  | Plugin 소스 경로                                                                          |
| `api.rootDir`            | `string?`                 | Plugin 루트 디렉터리(선택 사항)                                                            |
| `api.config`             | `OpenClawConfig`          | 현재 구성 스냅샷(사용 가능한 경우 활성 인메모리 런타임 스냅샷)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 Plugin별 구성                                   |
| `api.runtime`            | `PluginRuntime`           | [런타임 헬퍼](/ko/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | 범위가 지정된 로거(`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드; `"setup-runtime"`은 전체 진입점 시작 전의 가벼운 시작/설정 기간입니다 |
| `api.resolvePath(input)` | `(string) => string`      | Plugin 루트를 기준으로 경로 확인                                                        |

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
  프로덕션 코드에서 자체 Plugin을 `openclaw/plugin-sdk/<your-plugin>`을 통해
  가져오지 마세요. 내부 가져오기는 `./api.ts` 또는
  `./runtime-api.ts`를 통해 라우팅하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

Facade로 로드되는 번들 Plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 유사한 공개 진입 파일)은 OpenClaw가 이미 실행 중일 때
활성 런타임 구성 스냅샷을 선호합니다. 아직 런타임
스냅샷이 없으면 디스크의 확인된 구성 파일로 폴백합니다.
패키징된 번들 Plugin facade는 OpenClaw의 Plugin
facade 로더를 통해 로드해야 합니다. `dist/extensions/...`에서 직접 가져오면 패키징된 설치가 Plugin 소유 코드에 사용하는 manifest
및 런타임 sidecar 검사를 우회합니다.

Provider Plugin은 헬퍼가 의도적으로 Provider에 한정되고 아직 일반 SDK
하위 경로에 속하지 않는 경우 좁은 Plugin 로컬 계약 배럴을 노출할 수 있습니다.
번들 예시:

- **Anthropic**: Claude 베타 헤더 및 `service_tier` 스트림 헬퍼를 위한 공개 `api.ts` / `contract-api.ts` 이음매.
- **`@openclaw/openai-provider`**: `api.ts`는 Provider 빌더,
  기본 모델 헬퍼, 실시간 Provider 빌더를 내보냅니다.
- **`@openclaw/openrouter-provider`**: `api.ts`는 온보딩/구성 헬퍼와 함께 Provider 빌더를 내보냅니다.

<Warning>
  확장 프로덕션 코드도 `openclaw/plugin-sdk/<other-plugin>`
  가져오기를 피해야 합니다. 헬퍼가 정말 공유되어야 한다면 두 Plugin을 서로 결합하는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` 또는 다른
  기능 지향 표면 같은 중립 SDK 하위 경로로 승격하세요.
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="진입점" icon="door-open" href="/ko/plugins/sdk-entrypoints">
    `definePluginEntry` 및 `defineChannelPluginEntry` 옵션.
  </Card>
  <Card title="런타임 헬퍼" icon="gears" href="/ko/plugins/sdk-runtime">
    전체 `api.runtime` 네임스페이스 참조.
  </Card>
  <Card title="설정 및 구성" icon="sliders" href="/ko/plugins/sdk-setup">
    패키징, manifest, 구성 스키마.
  </Card>
  <Card title="테스트" icon="vial" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 린트 규칙.
  </Card>
  <Card title="SDK 마이그레이션" icon="arrows-turn-right" href="/ko/plugins/sdk-migration">
    더 이상 권장되지 않는 표면에서 마이그레이션하기.
  </Card>
  <Card title="Plugin 내부 구조" icon="diagram-project" href="/ko/plugins/architecture">
    심층 아키텍처 및 기능 모델.
  </Card>
</CardGroup>
