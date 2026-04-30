---
read_when:
    - 어느 SDK 하위 경로에서 가져올지 알아야 합니다
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조 문서가 필요합니다
    - 특정 SDK 내보내기를 조회하고 있습니다
sidebarTitle: Plugin SDK overview
summary: 임포트 맵, 등록 API 참조 및 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-04-30T06:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK는 Plugin과 코어 사이의 타입이 지정된 계약입니다. 이 페이지는
**무엇을 가져올지**와 **무엇을 등록할 수 있는지**에 대한 참조 문서입니다.

<Note>
  이 페이지는 OpenClaw 내부에서 `openclaw/plugin-sdk/*`를 사용하는 Plugin
  작성자를 위한 것입니다. Gateway를 통해 에이전트를 실행하려는 외부 앱,
  스크립트, 대시보드, CI 작업, IDE 확장에는 대신
  [OpenClaw 앱 SDK](/ko/concepts/openclaw-sdk)와 `@openclaw/sdk` 패키지를
  사용하세요.
</Note>

<Tip>
대신 방법 안내를 찾고 있나요? [Plugin 빌드](/ko/plugins/building-plugins)에서 시작하고, 채널 Plugin에는 [채널 Plugin](/ko/plugins/sdk-channel-plugins)을, 제공자 Plugin에는 [제공자 Plugin](/ko/plugins/sdk-provider-plugins)을, 도구 또는 수명 주기 훅 Plugin에는 [Plugin 훅](/ko/plugins/hooks)을 사용하세요.
</Tip>

## 가져오기 규칙

항상 특정 하위 경로에서 가져오세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 하위 경로는 작고 독립적인 모듈입니다. 이렇게 하면 시작이 빨라지고
순환 의존성 문제를 방지할 수 있습니다. 채널별 엔트리/빌드 헬퍼에는
`openclaw/plugin-sdk/channel-core`를 선호하고, 더 넓은 범위의 표면과
`buildChannelConfigSchema` 같은 공유 헬퍼에는 `openclaw/plugin-sdk/core`를
유지하세요.

채널 구성의 경우 채널이 소유한 JSON Schema를
`openclaw.plugin.json#channelConfigs`를 통해 게시하세요. `plugin-sdk/channel-config-schema`
하위 경로는 공유 스키마 프리미티브와 일반 빌더를 위한 것입니다. OpenClaw의
번들 Plugin은 유지되는 번들 채널 스키마에 `plugin-sdk/bundled-channel-config-schema`를
사용합니다. 사용 중단된 호환성 내보내기는 `plugin-sdk/channel-config-schema-legacy`에
남아 있습니다. 번들 스키마 하위 경로는 어느 것도 새 Plugin의 패턴이 아닙니다.

<Warning>
  제공자 또는 채널 브랜드가 붙은 편의 seam(예:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)을
  가져오지 마세요. 번들 Plugin은 자체 `api.ts` /
  `runtime-api.ts` 배럴 내부에서 일반 SDK 하위 경로를 조합합니다. 코어
  소비자는 이러한 Plugin 로컬 배럴을 사용하거나, 필요가 실제로 채널 간에
  공통일 때 좁은 일반 SDK 계약을 추가해야 합니다.

추적된 소유자 사용처가 있는 경우, 소수의 번들 Plugin 헬퍼 seam이 여전히
생성된 내보내기 맵에 나타납니다. 이들은 번들 Plugin 유지보수 전용이며,
새 서드파티 Plugin에 권장되는 가져오기 경로가 아닙니다.

`openclaw/plugin-sdk/discord`와 `openclaw/plugin-sdk/telegram-account`도
추적된 소유자 사용처를 위한 사용 중단된 호환성 파사드로 유지됩니다. 새
Plugin에 이러한 가져오기 경로를 복사하지 말고, 대신 주입된 런타임 헬퍼와
일반 채널 SDK 하위 경로를 사용하세요.
</Warning>

## 하위 경로 참조

Plugin SDK는 영역별(Plugin 엔트리, 채널, 제공자, 인증, 런타임, 기능, 메모리,
예약된 번들 Plugin 헬퍼)로 그룹화된 좁은 하위 경로 집합으로 노출됩니다.
그룹화되고 링크된 전체 카탈로그는 [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를
참조하세요.

생성된 200개 이상의 하위 경로 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

## 등록 API

`register(api)` 콜백은 다음 메서드를 가진 `OpenClawPluginApi` 객체를 받습니다.

### 기능 등록

| 메서드                                           | 등록 대상                              |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | 텍스트 추론(LLM)                       |
| `api.registerAgentHarness(...)`                  | 실험적 저수준 에이전트 실행기          |
| `api.registerCliBackend(...)`                    | 로컬 CLI 추론 백엔드                   |
| `api.registerChannel(...)`                       | 메시징 채널                            |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성            |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 실시간 전사                   |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 실시간 음성 세션                |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/비디오 분석             |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성                            |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성                              |
| `api.registerVideoGenerationProvider(...)`       | 비디오 생성                            |
| `api.registerWebFetchProvider(...)`              | 웹 가져오기 / 스크레이프 제공자        |
| `api.registerWebSearchProvider(...)`             | 웹 검색                                |

### 도구와 명령

| 메서드                         | 등록 대상                                      |
| ------------------------------ | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | 에이전트 도구(필수 또는 `{ optional: true }`)  |
| `api.registerCommand(def)`      | 사용자 지정 명령(LLM 우회)                     |

Plugin 명령은 에이전트에 짧은 명령 소유 라우팅 힌트가 필요할 때 `agentPromptGuidance`를
설정할 수 있습니다. 해당 텍스트는 명령 자체에 관한 내용으로 유지하세요. 코어 프롬프트
빌더에 제공자 또는 Plugin별 정책을 추가하지 마세요.

### 인프라

| 메서드                                         | 등록 대상                                  |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | 이벤트 훅                                  |
| `api.registerHttpRoute(params)`                | Gateway HTTP 엔드포인트                    |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 메서드                         |
| `api.registerGatewayDiscoveryService(service)` | 로컬 Gateway 검색 광고자                   |
| `api.registerCli(registrar, opts?)`            | CLI 하위 명령                              |
| `api.registerService(service)`                 | 백그라운드 서비스                          |
| `api.registerInteractiveHandler(registration)` | 인터랙티브 핸들러                          |
| `api.registerAgentToolResultMiddleware(...)`   | 런타임 도구 결과 미들웨어                  |
| `api.registerMemoryPromptSupplement(builder)`  | 추가형 메모리 인접 프롬프트 섹션           |
| `api.registerMemoryCorpusSupplement(adapter)`  | 추가형 메모리 검색/읽기 코퍼스             |

### 워크플로 Plugin용 호스트 훅

호스트 훅은 제공자, 채널 또는 도구만 추가하는 것이 아니라 호스트 수명 주기에
참여해야 하는 Plugin을 위한 SDK seam입니다. 이들은 일반 계약입니다. Plan Mode가
이를 사용할 수 있지만, 승인 워크플로, 워크스페이스 정책 게이트, 백그라운드 모니터,
설정 마법사, UI 동반 Plugin도 사용할 수 있습니다.

| 메서드                                                                   | 소유하는 계약                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Gateway 세션을 통해 투영되는 Plugin 소유의 JSON 호환 세션 상태                     |
| `api.enqueueNextTurnInjection(...)`                                      | 한 세션의 다음 에이전트 턴에 주입되는 지속성 있는 정확히 한 번 컨텍스트            |
| `api.registerTrustedToolPolicy(...)`                                     | 도구 매개변수를 차단하거나 다시 쓸 수 있는 번들/신뢰된 사전 Plugin 도구 정책       |
| `api.registerToolMetadata(...)`                                          | 도구 구현을 변경하지 않는 도구 카탈로그 표시 메타데이터                            |
| `api.registerCommand(...)`                                               | 범위가 지정된 Plugin 명령. 명령 결과는 `continueAgent: true`를 설정할 수 있음       |
| `api.registerControlUiDescriptor(...)`                                   | 세션, 도구, 실행 또는 설정 표면을 위한 Control UI 기여 설명자                       |
| `api.registerRuntimeLifecycle(...)`                                      | 재설정/삭제/다시 로드 경로에서 Plugin 소유 런타임 리소스의 정리 콜백               |
| `api.registerAgentEventSubscription(...)`                                | 워크플로 상태와 모니터를 위한 정리된 이벤트 구독                                    |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | 종료 실행 수명 주기에서 지워지는 실행별 Plugin 스크래치 상태                       |
| `api.registerSessionSchedulerJob(...)`                                   | 결정적 정리를 포함한 Plugin 소유 세션 스케줄러 작업 레코드                         |

계약은 의도적으로 권한을 분리합니다.

- 외부 Plugin은 세션 확장, UI 설명자, 명령, 도구 메타데이터, 다음 턴 주입, 일반 훅을 소유할 수 있습니다.
- 신뢰된 도구 정책은 일반 `before_tool_call` 훅보다 먼저 실행되며, 호스트 안전 정책에 참여하므로 번들 전용입니다.
- 예약된 명령 소유권은 번들 전용입니다. 외부 Plugin은 자체 명령 이름 또는 별칭을 사용해야 합니다.
- `allowPromptInjection=false`는 `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, 레거시 `before_agent_start`의 프롬프트 필드, `enqueueNextTurnInjection`을 포함해 프롬프트를 변경하는 훅을 비활성화합니다.

Plan이 아닌 소비자의 예:

| Plugin 원형                 | 사용되는 훅                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 승인 워크플로               | 세션 확장, 명령 계속, 다음 턴 주입, UI 설명자                                                                                            |
| 예산/워크스페이스 정책 게이트 | 신뢰된 도구 정책, 도구 메타데이터, 세션 투영                                                                                              |
| 백그라운드 수명 주기 모니터 | 런타임 수명 주기 정리, 에이전트 이벤트 구독, 세션 스케줄러 소유권/정리, Heartbeat 프롬프트 기여, UI 설명자                              |
| 설정 또는 온보딩 마법사     | 세션 확장, 범위가 지정된 명령, Control UI 설명자                                                                                         |

<Note>
  예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`)는 Plugin이 더 좁은 Gateway 메서드 범위를 할당하려고 해도 항상
  `operator.admin`으로 유지됩니다. Plugin 소유 메서드에는 Plugin별 접두사를
  선호하세요.
</Note>

<Accordion title="도구 결과 미들웨어를 사용하는 경우">
  번들 Plugin은 실행 후, 그리고 런타임이 해당 결과를 모델에 다시 공급하기 전에
  도구 결과를 다시 써야 할 때 `api.registerAgentToolResultMiddleware(...)`를
  사용할 수 있습니다. 이는 tokenjuice 같은 비동기 출력 리듀서를 위한 신뢰된
  런타임 중립 seam입니다.

번들 Plugin은 대상 런타임마다 `contracts.agentToolResultMiddleware`를 선언해야
합니다. 예를 들어 `["pi", "codex"]`입니다. 외부 Plugin은 이 미들웨어를
등록할 수 없습니다. 모델 이전 도구 결과 타이밍이 필요하지 않은 작업에는
일반 OpenClaw Plugin 훅을 유지하세요. 이전의 Pi 전용 내장 확장 팩터리 등록
경로는 제거되었습니다.
</Accordion>

### Gateway 검색 등록

`api.registerGatewayDiscoveryService(...)`를 사용하면 Plugin이 mDNS/Bonjour 같은
로컬 검색 전송에서 활성 Gateway를 광고할 수 있습니다. OpenClaw는 로컬 검색이
활성화된 경우 Gateway 시작 중에 서비스를 호출하고, 현재 Gateway 포트와 비밀이
아닌 TXT 힌트 데이터를 전달하며, Gateway 종료 중에 반환된 `stop` 핸들러를 호출합니다.

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

Gateway 검색 Plugin은 광고된 TXT 값을 비밀 값이나 인증으로 취급해서는 안 됩니다.
검색은 라우팅 힌트입니다. 신뢰는 여전히 Gateway 인증과 TLS 피닝이 담당합니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 최상위 메타데이터를 받습니다.

- `commands`: 등록자가 소유하는 명시적 명령 루트
- `descriptors`: 루트 CLI 도움말, 라우팅, 지연 Plugin CLI 등록에 사용되는 파싱 시점 명령 디스크립터

Plugin 명령이 일반 루트 CLI 경로에서 지연 로드 상태를 유지하도록 하려면
해당 등록자가 노출하는 모든 최상위 명령 루트를 포함하는 `descriptors`를
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

지연 루트 CLI 등록이 필요하지 않을 때만 `commands`를 단독으로 사용하세요.
이 즉시 로드 호환 경로는 계속 지원되지만, 파싱 시점 지연 로드를 위한
디스크립터 기반 자리표시자는 설치하지 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`를 사용하면 Plugin이 `codex-cli` 같은 로컬
AI CLI 백엔드의 기본 구성을 소유할 수 있습니다.

- 백엔드 `id`는 `codex-cli/gpt-5` 같은 모델 참조에서 제공자 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 같은 구조를 사용합니다.
- 사용자 구성은 여전히 우선합니다. OpenClaw는 CLI를 실행하기 전에
  `agents.defaults.cliBackends.<id>`를 Plugin 기본값 위에 병합합니다.
- 백엔드가 병합 후 호환성 재작성(예: 오래된 플래그 구조 정규화)을 필요로 할 때는
  `normalizeConfig`를 사용하세요.

### 전용 슬롯

| 메서드                                     | 등록하는 항목                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 컨텍스트 엔진(한 번에 하나만 활성). `assemble()` 콜백은 엔진이 프롬프트 추가 내용을 조정할 수 있도록 `availableTools`와 `citationsMode`를 받습니다. |
| `api.registerMemoryCapability(capability)` | 통합 메모리 기능                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 flush 계획 리졸버                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 어댑터                                                                                                                                    |

### 메모리 임베딩 어댑터

| 메서드                                         | 등록하는 항목                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 Plugin용 메모리 임베딩 어댑터 |

- `registerMemoryCapability`는 권장되는 전용 메모리 Plugin API입니다.
- `registerMemoryCapability`는 `publicArtifacts.listArtifacts(...)`도 노출할 수 있어,
  동반 Plugin이 특정 메모리 Plugin의 비공개 레이아웃에 접근하는 대신
  `openclaw/plugin-sdk/memory-host-core`를 통해 내보낸 메모리 아티팩트를 사용할 수 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`,
  `registerMemoryRuntime`은 레거시 호환 전용 메모리 Plugin API입니다.
- `MemoryFlushPlan.model`은 활성 fallback 체인을 상속하지 않고 flush 턴을
  `ollama/qwen3:8b` 같은 정확한 `provider/model` 참조에 고정할 수 있습니다.
- `registerMemoryEmbeddingProvider`를 사용하면 활성 메모리 Plugin이 하나 이상의
  임베딩 어댑터 ID(예: `openai`, `gemini` 또는 사용자 지정 Plugin 정의 ID)를
  등록할 수 있습니다.
- `agents.defaults.memorySearch.provider` 및
  `agents.defaults.memorySearch.fallback` 같은 사용자 구성은 등록된 어댑터 ID를
  기준으로 해석됩니다.

### 이벤트와 수명 주기

| 메서드                                       | 수행하는 작업                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | 타입이 지정된 수명 주기 hook          |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백 |

예시, 일반적인 hook 이름, guard 의미 체계는 [Plugin hook](/ko/plugins/hooks)을
참조하세요.

### Hook 결정 의미 체계

- `before_tool_call`: `{ block: true }`를 반환하면 종료됩니다. 어떤 핸들러든 이를 설정하면 우선순위가 더 낮은 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 결정 없음(`block`을 생략한 것과 동일)으로 처리되며, override가 아닙니다.
- `before_install`: `{ block: true }`를 반환하면 종료됩니다. 어떤 핸들러든 이를 설정하면 우선순위가 더 낮은 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 결정 없음(`block`을 생략한 것과 동일)으로 처리되며, override가 아닙니다.
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 종료됩니다. 어떤 핸들러든 dispatch를 처리했다고 주장하면 우선순위가 더 낮은 핸들러와 기본 모델 dispatch 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 종료됩니다. 어떤 핸들러든 이를 설정하면 우선순위가 더 낮은 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 결정 없음(`cancel`을 생략한 것과 동일)으로 처리되며, override가 아닙니다.
- `message_received`: 인바운드 스레드/토픽 라우팅이 필요할 때는 타입이 지정된 `threadId` 필드를 사용하세요. 채널별 추가 정보에는 `metadata`를 유지하세요.
- `message_sending`: 채널별 `metadata`로 fallback하기 전에 타입이 지정된 `replyToId` / `threadId` 라우팅 필드를 사용하세요.
- `gateway_start`: 내부 `gateway:startup` hook에 의존하는 대신 Gateway 소유 시작 상태에는 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`을 사용하세요.
- `cron_changed`: Gateway 소유 Cron 수명 주기 변경을 관찰합니다. 외부 wake 스케줄러를 동기화할 때는 `event.job?.state?.nextRunAtMs`와 `ctx.getCron?.()`을 사용하고, 기한 확인과 실행의 진실 공급원으로 OpenClaw를 유지하세요.

### API 객체 필드

| 필드                    | 타입                      | 설명                                                                                 |
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
| `api.logger`             | `PluginLogger`            | 범위가 지정된 logger(`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드. `"setup-runtime"`은 전체 엔트리 전의 경량 시작/설정 창입니다 |
| `api.resolvePath(input)` | `(string) => string`      | Plugin 루트를 기준으로 경로 해석                                                        |

## 내부 모듈 규칙

Plugin 안에서는 내부 import에 로컬 barrel 파일을 사용하세요.

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  프로덕션 코드에서 자체 Plugin을 `openclaw/plugin-sdk/<your-plugin>`을 통해
  import하지 마세요. 내부 import는 `./api.ts` 또는 `./runtime-api.ts`를
  거치도록 하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

Facade로 로드되는 번들 Plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 유사한 공개 엔트리 파일)은 OpenClaw가 이미
실행 중일 때 활성 런타임 구성 스냅샷을 우선합니다. 아직 런타임 스냅샷이 없으면
디스크에서 해석된 구성 파일로 fallback합니다. 패키징된 번들 Plugin facade는
OpenClaw의 Plugin facade 로더를 통해 로드해야 합니다. `dist/extensions/...`에서
직접 import하면 패키징된 설치가 Plugin 소유 의존성에 사용하는 단계적 런타임
의존성 미러를 우회합니다.

제공자 Plugin은 헬퍼가 의도적으로 제공자별이고 아직 일반 SDK 하위 경로에 속하지
않을 때 좁은 Plugin 로컬 계약 barrel을 노출할 수 있습니다. 번들 예시는 다음과
같습니다.

- **Anthropic**: Claude beta-header 및 `service_tier` 스트림 헬퍼를 위한 공개 `api.ts` / `contract-api.ts` 경계.
- **`@openclaw/openai-provider`**: `api.ts`는 제공자 빌더, 기본 모델 헬퍼, realtime 제공자 빌더를 내보냅니다.
- **`@openclaw/openrouter-provider`**: `api.ts`는 제공자 빌더와 온보딩/구성 헬퍼를 내보냅니다.

<Warning>
  Extension 프로덕션 코드도 `openclaw/plugin-sdk/<other-plugin>` import를
  피해야 합니다. 헬퍼가 정말 공유되어야 한다면 두 Plugin을 결합하는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` 또는 다른
  기능 지향 표면 같은 중립 SDK 하위 경로로 승격하세요.
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="엔트리 포인트" icon="door-open" href="/ko/plugins/sdk-entrypoints">
    `definePluginEntry`와 `defineChannelPluginEntry` 옵션.
  </Card>
  <Card title="런타임 헬퍼" icon="gears" href="/ko/plugins/sdk-runtime">
    전체 `api.runtime` 네임스페이스 참조.
  </Card>
  <Card title="설정 및 구성" icon="sliders" href="/ko/plugins/sdk-setup">
    패키징, manifest, 구성 스키마.
  </Card>
  <Card title="테스트" icon="vial" href="/ko/plugins/sdk-testing">
    테스트 유틸리티와 lint 규칙.
  </Card>
  <Card title="SDK 마이그레이션" icon="arrows-turn-right" href="/ko/plugins/sdk-migration">
    사용 중단된 표면에서 마이그레이션.
  </Card>
  <Card title="Plugin 내부 구조" icon="diagram-project" href="/ko/plugins/architecture">
    심층 아키텍처와 기능 모델.
  </Card>
</CardGroup>
