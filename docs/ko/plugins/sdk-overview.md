---
read_when:
    - 어느 SDK 서브패스에서 import해야 하는지 알아야 합니다
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조가 필요합니다
    - 특정 SDK export를 찾고 있습니다
sidebarTitle: SDK overview
summary: 가져오기 맵, 등록 API 참조 및 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-04-25T06:07:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK는 Plugin과 core 사이의 타입 지정 계약입니다. 이 페이지는
**무엇을 import할지**와 **무엇을 등록할 수 있는지**에 대한 참조입니다.

<Tip>
  사용 방법 가이드를 찾고 있나요?

- 첫 Plugin이라면? [Plugin 만들기](/ko/plugins/building-plugins)부터 시작하세요.
- 채널 Plugin이라면? [채널 Plugins](/ko/plugins/sdk-channel-plugins)를 참고하세요.
- 공급자 Plugin이라면? [공급자 Plugins](/ko/plugins/sdk-provider-plugins)를 참고하세요.
- 도구 또는 수명 주기 훅 Plugin이라면? [Plugin 훅](/ko/plugins/hooks)을 참고하세요.
  </Tip>

## import 규칙

항상 특정 서브패스에서 import하세요:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 서브패스는 작고 독립적인 모듈입니다. 이렇게 하면 시작 속도가 빨라지고
순환 의존성 문제를 방지할 수 있습니다. 채널별 진입점/빌드 헬퍼에는
`openclaw/plugin-sdk/channel-core`를 우선 사용하고, 더 넓은 우산형 표면과
`buildChannelConfigSchema` 같은 공유 헬퍼에는
`openclaw/plugin-sdk/core`를 사용하세요.

채널 config의 경우, 채널 소유 JSON Schema는
`openclaw.plugin.json#channelConfigs`를 통해 게시하세요. `plugin-sdk/channel-config-schema`
서브패스는 공유 스키마 기본 요소와 일반 빌더용입니다. 해당 서브패스에 있는
번들 채널 이름 기반 schema export는 레거시 호환성 export일 뿐이며,
새 Plugin의 패턴은 아닙니다.

<Warning>
  공급자 또는 채널 브랜드 편의 seam(예:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)은 import하지 마세요.
  번들 Plugins는 자신의 `api.ts` /
  `runtime-api.ts` barrel 안에서 일반 SDK 서브패스를 조합합니다. core 소비자는
  해당 Plugin 로컬 barrel을 사용하거나, 필요가 정말로
  교차 채널적인 경우에만 좁은 일반 SDK 계약을 추가해야 합니다.

번들 Plugin 유지보수 전용 helper seam 일부(`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` 등)는 여전히 생성된 export map에 나타납니다.
이들은 번들 Plugin 유지보수 전용이며, 새 서드파티 Plugin에 권장되는 import 경로는 아닙니다.
</Warning>

## 서브패스 참조

Plugin SDK는 영역별(Plugin
entry, channel, provider, auth, runtime, capability, memory, 예약된
번들 Plugin helper)로 그룹화된 좁은 서브패스 집합으로 노출됩니다. 전체 카탈로그는 —
그룹화 및 링크 포함 — [Plugin SDK 서브패스](/ko/plugins/sdk-subpaths)를 참고하세요.

생성된 200개 이상의 서브패스 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

## 등록 API

`register(api)` 콜백은 다음 메서드를 가진 `OpenClawPluginApi` 객체를 받습니다:

### capability 등록

| 메서드                                           | 등록하는 항목                      |
| ------------------------------------------------ | ---------------------------------- |
| `api.registerProvider(...)`                      | 텍스트 추론(LLM)                   |
| `api.registerAgentHarness(...)`                  | 실험적 저수준 에이전트 실행기      |
| `api.registerCliBackend(...)`                    | 로컬 CLI 추론 백엔드               |
| `api.registerChannel(...)`                       | 메시징 채널                        |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성        |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 실시간 전사               |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 실시간 음성 세션            |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/비디오 분석          |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성                        |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성                          |
| `api.registerVideoGenerationProvider(...)`       | 비디오 생성                        |
| `api.registerWebFetchProvider(...)`              | 웹 가져오기 / 스크레이프 공급자    |
| `api.registerWebSearchProvider(...)`             | 웹 검색                            |

### 도구와 명령

| 메서드                          | 등록하는 항목                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | 에이전트 도구(필수 또는 `{ optional: true }`) |
| `api.registerCommand(def)`      | 사용자 지정 명령(LLM 우회)                     |

### 인프라

| 메서드                                         | 등록하는 항목                       |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 이벤트 훅                           |
| `api.registerHttpRoute(params)`                | Gateway HTTP 엔드포인트             |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 메서드                  |
| `api.registerGatewayDiscoveryService(service)` | 로컬 Gateway 검색 광고기            |
| `api.registerCli(registrar, opts?)`            | CLI 하위 명령                       |
| `api.registerService(service)`                 | 백그라운드 서비스                   |
| `api.registerInteractiveHandler(registration)` | 대화형 핸들러                       |
| `api.registerAgentToolResultMiddleware(...)`   | 런타임 도구 결과 미들웨어           |
| `api.registerMemoryPromptSupplement(builder)`  | 추가 메모리 인접 프롬프트 섹션      |
| `api.registerMemoryCorpusSupplement(adapter)`  | 추가 메모리 검색/읽기 코퍼스        |

<Note>
  예약된 core 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`)는 Plugin이 더 좁은 Gateway 메서드 범위를 할당하려고 해도 항상
  `operator.admin`으로 유지됩니다. Plugin 소유 메서드에는 Plugin 전용 접두사를 사용하는 것이 좋습니다.
</Note>

<Accordion title="도구 결과 미들웨어를 사용해야 하는 경우">
  번들 Plugins는 `api.registerAgentToolResultMiddleware(...)`를 사용할 수 있습니다.
  이는 실행 후 런타임이 도구 결과를 모델에 다시 공급하기 전에
  도구 결과를 다시 작성해야 할 때 사용합니다. 이는 tokenjuice 같은
  비동기 출력 리듀서를 위한 신뢰된 런타임 중립 seam입니다.

번들 Plugins는 각 대상 런타임에 대해 `contracts.agentToolResultMiddleware`를
  선언해야 합니다. 예를 들면 `["pi", "codex"]`입니다. 외부 Plugins는
  이 미들웨어를 등록할 수 없습니다. 모델 직전 도구 결과 타이밍이 필요하지 않은 작업에는
  일반 OpenClaw Plugin 훅을 사용하세요. 예전의 Pi 전용 내장
  extension factory 등록 경로는 제거되었습니다.
</Accordion>

### Gateway 검색 등록

`api.registerGatewayDiscoveryService(...)`를 사용하면 Plugin이
mDNS/Bonjour 같은 로컬 검색 전송을 통해 활성 Gateway를 광고할 수 있습니다. OpenClaw는
로컬 검색이 활성화된 경우 Gateway 시작 중 이 서비스를 호출하고,
현재 Gateway 포트와 비밀이 아닌 TXT 힌트 데이터를 전달하며, Gateway 종료 시
반환된 `stop` 핸들러를 호출합니다.

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

Gateway 검색 Plugins는 광고된 TXT 값을 비밀이나
인증으로 취급해서는 안 됩니다. 검색은 라우팅 힌트일 뿐이며, 신뢰는 여전히 Gateway 인증과 TLS pinning이 담당합니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 최상위 메타데이터를 받습니다:

- `commands`: registrar가 소유한 명시적 명령 루트
- `descriptors`: 루트 CLI 도움말,
  라우팅, 지연 Plugin CLI 등록에 사용되는 파싱 시점 명령 descriptor

Plugin 명령을 일반 루트 CLI 경로에서 계속 지연 로드 상태로 유지하려면,
해당 registrar가 노출하는 모든 최상위 명령 루트를
포괄하는 `descriptors`를 제공하세요.

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
        description: "Matrix 계정, 검증, 장치, 프로필 상태 관리",
        hasSubcommands: true,
      },
    ],
  },
);
```

지연 루트 CLI 등록이 필요하지 않을 때만 `commands`만 단독으로 사용하세요.
그 eager 호환성 경로는 여전히 지원되지만, 파싱 시점 지연 로딩을 위한
descriptor 기반 placeholder는 설치하지 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`를 사용하면 Plugin이 `codex-cli` 같은 로컬
AI CLI 백엔드의 기본 config를 소유할 수 있습니다.

- 백엔드 `id`는 `codex-cli/gpt-5` 같은 모델 참조에서 공급자 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 같은 형태를 사용합니다.
- 사용자 config가 여전히 우선합니다. OpenClaw는 CLI 실행 전에
  Plugin 기본값 위로 `agents.defaults.cliBackends.<id>`를 병합합니다.
- 병합 후 백엔드에 호환성 재작성(예: 오래된 플래그 형태 정규화)이 필요하면
  `normalizeConfig`를 사용하세요.

### 독점 슬롯

| 메서드                                     | 등록하는 항목                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 컨텍스트 엔진(한 번에 하나만 활성). `assemble()` 콜백은 `availableTools`와 `citationsMode`를 받아 엔진이 프롬프트 추가 내용을 조정할 수 있습니다. |
| `api.registerMemoryCapability(capability)` | 통합 메모리 capability                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 플러시 계획 해석기                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 어댑터                                                                                                                                 |

### 메모리 임베딩 어댑터

| 메서드                                         | 등록하는 항목                            |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 Plugin용 메모리 임베딩 어댑터       |

- `registerMemoryCapability`가 권장되는 독점 메모리 Plugin API입니다.
- `registerMemoryCapability`는 companion Plugins가 특정
  메모리 Plugin의 비공개 레이아웃에 접근하지 않고 `openclaw/plugin-sdk/memory-host-core`를 통해
  내보낸 메모리 아티팩트를 사용할 수 있도록 `publicArtifacts.listArtifacts(...)`도 노출할 수 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`,
  `registerMemoryRuntime`은 레거시 호환 독점 메모리 Plugin API입니다.
- `registerMemoryEmbeddingProvider`를 사용하면 활성 메모리 Plugin이 하나 이상의
  임베딩 어댑터 id(예: `openai`, `gemini`, 또는 사용자 정의 Plugin id)를 등록할 수 있습니다.
- `agents.defaults.memorySearch.provider` 및
  `agents.defaults.memorySearch.fallback` 같은 사용자 config는
  등록된 어댑터 id 기준으로 해석됩니다.

### 이벤트와 수명 주기

| 메서드                                       | 수행하는 일               |
| -------------------------------------------- | ------------------------- |
| `api.on(hookName, handler, opts?)`           | 타입 지정 수명 주기 훅    |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백         |

예시, 일반 훅 이름, guard 의미는 [Plugin 훅](/ko/plugins/hooks)을 참고하세요.

### 훅 결정 의미

- `before_tool_call`: `{ block: true }`를 반환하면 종료됩니다. 어떤 핸들러든 이를 설정하면, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 결정 없음으로 취급됩니다(`block`을 생략한 것과 동일). 재정의로 취급되지 않습니다.
- `before_install`: `{ block: true }`를 반환하면 종료됩니다. 어떤 핸들러든 이를 설정하면, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 결정 없음으로 취급됩니다(`block`을 생략한 것과 동일). 재정의로 취급되지 않습니다.
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 종료됩니다. 어떤 핸들러든 디스패치를 주장하면, 더 낮은 우선순위 핸들러와 기본 모델 디스패치 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 종료됩니다. 어떤 핸들러든 이를 설정하면, 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 결정 없음으로 취급됩니다(`cancel`을 생략한 것과 동일). 재정의로 취급되지 않습니다.
- `message_received`: 수신 스레드/주제 라우팅이 필요할 때는 타입 지정된 `threadId` 필드를 사용하세요. `metadata`는 채널별 추가 정보용으로 유지하세요.
- `message_sending`: 채널별 `metadata`로 되돌아가기 전에 타입 지정된 `replyToId` / `threadId` 라우팅 필드를 사용하세요.
- `gateway_start`: 내부 `gateway:startup` 훅에 의존하는 대신 Gateway 소유 시작 상태에는 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`를 사용하세요.

### API 객체 필드

| 필드                     | 타입                      | 설명                                                                                           |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                      |
| `api.name`               | `string`                  | 표시 이름                                                                                      |
| `api.version`            | `string?`                 | Plugin 버전(선택 사항)                                                                         |
| `api.description`        | `string?`                 | Plugin 설명(선택 사항)                                                                         |
| `api.source`             | `string`                  | Plugin 소스 경로                                                                               |
| `api.rootDir`            | `string?`                 | Plugin 루트 디렉터리(선택 사항)                                                                |
| `api.config`             | `OpenClawConfig`          | 현재 config 스냅샷(가능한 경우 활성 메모리 내 런타임 스냅샷)                                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 Plugin 전용 config                                             |
| `api.runtime`            | `PluginRuntime`           | [런타임 헬퍼](/ko/plugins/sdk-runtime)                                                            |
| `api.logger`             | `PluginLogger`            | 범위 지정 로거(`debug`, `info`, `warn`, `error`)                                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드. `"setup-runtime"`은 가벼운 전체 진입 전 시작/설정 창입니다                     |
| `api.resolvePath(input)` | `(string) => string`      | Plugin 루트를 기준으로 경로 해석                                                               |

## 내부 모듈 규칙

Plugin 내부에서는 내부 import에 로컬 barrel 파일을 사용하세요:

```
my-plugin/
  api.ts            # 외부 소비자를 위한 공개 export
  runtime-api.ts    # 내부 전용 런타임 export
  index.ts          # Plugin 진입점
  setup-entry.ts    # 가벼운 설정 전용 진입점(선택 사항)
```

<Warning>
  프로덕션 코드에서 `openclaw/plugin-sdk/<your-plugin>`을 통해
  자신의 Plugin을 import하지 마세요. 내부 import는 `./api.ts` 또는
  `./runtime-api.ts`를 통해 라우팅하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

파사드 로드된 번들 Plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 유사한 공개 진입 파일)은
OpenClaw가 이미 실행 중이면 활성 런타임 config 스냅샷을 우선 사용합니다. 런타임
스냅샷이 아직 없으면, 디스크의 해석된 config 파일로 되돌아갑니다.

공급자 Plugins는 helper가 의도적으로 공급자 전용이고 아직 일반 SDK
서브패스에 속하지 않을 때 좁은 Plugin 로컬 계약 barrel을 노출할 수 있습니다. 번들 예시:

- **Anthropic**: Claude
  베타 헤더 및 `service_tier` 스트림 헬퍼를 위한 공개 `api.ts` / `contract-api.ts` seam.
- **`@openclaw/openai-provider`**: `api.ts`가 공급자 빌더,
  기본 모델 헬퍼, 실시간 공급자 빌더를 export합니다.
- **`@openclaw/openrouter-provider`**: `api.ts`가 공급자 빌더와
  온보딩/config 헬퍼를 export합니다.

<Warning>
  확장 프로덕션 코드도 `openclaw/plugin-sdk/<other-plugin>`
  import를 피해야 합니다. helper가 정말 공유되어야 한다면 두 Plugin을 결합하는 대신,
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` 또는 다른
  capability 지향 표면 같은 중립 SDK 서브패스로 승격하세요.
</Warning>

## 관련 문서

<CardGroup cols={2}>
  <Card title="진입점" icon="door-open" href="/ko/plugins/sdk-entrypoints">
    `definePluginEntry` 및 `defineChannelPluginEntry` 옵션.
  </Card>
  <Card title="런타임 헬퍼" icon="gears" href="/ko/plugins/sdk-runtime">
    전체 `api.runtime` 네임스페이스 참조.
  </Card>
  <Card title="설정 및 config" icon="sliders" href="/ko/plugins/sdk-setup">
    패키징, manifest, config schema.
  </Card>
  <Card title="테스트" icon="vial" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 lint 규칙.
  </Card>
  <Card title="SDK 마이그레이션" icon="arrows-turn-right" href="/ko/plugins/sdk-migration">
    더 이상 사용되지 않는 표면에서 마이그레이션.
  </Card>
  <Card title="Plugin 내부 구조" icon="diagram-project" href="/ko/plugins/architecture">
    심화 아키텍처 및 capability 모델.
  </Card>
</CardGroup>
