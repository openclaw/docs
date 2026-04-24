---
read_when:
    - 어느 SDK 하위 경로에서 import해야 하는지 알아야 합니다
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조가 필요합니다
    - 특정 SDK export를 찾고 있습니다
sidebarTitle: SDK overview
summary: import map, 등록 API 참조 및 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-04-24T09:00:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK는 Plugin과 코어 사이의 타입 지정 계약입니다. 이 페이지는
**무엇을 import해야 하는지**와 **무엇을 등록할 수 있는지**에 대한 참조입니다.

<Tip>
  사용 방법 가이드를 찾고 있나요?

- 첫 Plugin인가요? [Plugin 빌드하기](/ko/plugins/building-plugins)에서 시작하세요.
- 채널 Plugin인가요? [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참조하세요.
- provider Plugin인가요? [provider Plugin](/ko/plugins/sdk-provider-plugins)을 참조하세요.
  </Tip>

## Import 규칙

항상 특정 하위 경로에서 import하세요:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 하위 경로는 작고 독립적인 모듈입니다. 이렇게 하면 시작 속도가 빨라지고
순환 의존성 문제를 방지할 수 있습니다. 채널별 엔트리/빌드 헬퍼의 경우
`openclaw/plugin-sdk/channel-core`를 우선 사용하고, 더 넓은 umbrella 표면과
`buildChannelConfigSchema` 같은 공유 헬퍼에는 `openclaw/plugin-sdk/core`를 사용하세요.

<Warning>
  provider 또는 채널 이름이 붙은 편의 seam(예:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)을 import하지 마세요.
  번들된 Plugin은 자체 `api.ts` /
  `runtime-api.ts` barrel 내부에서 일반 SDK 하위 경로를 조합합니다. 코어 소비자는
  해당 Plugin 로컬 barrel을 사용하거나, 정말로
  채널 간 공통 필요가 있을 때 좁은 일반 SDK 계약을 추가해야 합니다.

번들된 Plugin 헬퍼 seam의 소규모 집합(`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` 등)은 여전히 생성된
export map에 나타납니다. 이것들은 번들된 Plugin 유지보수 전용이며,
새로운 서드파티 Plugin에 권장되는 import 경로는 아닙니다.
</Warning>

## 하위 경로 참조

Plugin SDK는 영역별(Plugin
엔트리, 채널, provider, 인증, 런타임, capability, 메모리, 예약된
번들 Plugin 헬퍼)로 그룹화된 좁은 하위 경로 집합으로 노출됩니다. 전체 카탈로그는
그룹화 및 링크와 함께 [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)를 참조하세요.

생성된 200개 이상의 하위 경로 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

## 등록 API

`register(api)` 콜백은 다음 메서드를 가진 `OpenClawPluginApi` 객체를 받습니다:

### Capability 등록

| 메서드                                           | 등록하는 항목                    |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | 텍스트 추론(LLM)                 |
| `api.registerAgentHarness(...)`                  | 실험적 저수준 에이전트 실행기    |
| `api.registerCliBackend(...)`                    | 로컬 CLI 추론 백엔드            |
| `api.registerChannel(...)`                       | 메시징 채널                      |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성      |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 realtime 전사           |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 realtime 음성 세션        |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/비디오 분석        |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성                      |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성                        |
| `api.registerVideoGenerationProvider(...)`       | 비디오 생성                      |
| `api.registerWebFetchProvider(...)`              | 웹 fetch / 스크레이프 provider   |
| `api.registerWebSearchProvider(...)`             | 웹 검색                          |

### 도구 및 명령

| 메서드                          | 등록하는 항목                              |
| ------------------------------- | ------------------------------------------ |
| `api.registerTool(tool, opts?)` | 에이전트 도구(필수 또는 `{ optional: true }`) |
| `api.registerCommand(def)`      | 사용자 지정 명령(LLM 우회)                 |

### 인프라

| 메서드                                          | 등록하는 항목                      |
| ----------------------------------------------- | ---------------------------------- |
| `api.registerHook(events, handler, opts?)`      | 이벤트 hook                        |
| `api.registerHttpRoute(params)`                 | Gateway HTTP 엔드포인트            |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC 메서드                 |
| `api.registerGatewayDiscoveryService(service)`  | 로컬 Gateway 검색 광고자           |
| `api.registerCli(registrar, opts?)`             | CLI 하위 명령                      |
| `api.registerService(service)`                  | 백그라운드 서비스                  |
| `api.registerInteractiveHandler(registration)`  | 대화형 핸들러                      |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi 임베디드 러너 확장 factory      |
| `api.registerMemoryPromptSupplement(builder)`   | 가산형 메모리 인접 프롬프트 섹션   |
| `api.registerMemoryCorpusSupplement(adapter)`   | 가산형 메모리 검색/읽기 corpus     |

<Note>
  예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`)는 Plugin이 더
  좁은 Gateway 메서드 범위를 할당하려고 해도 항상 `operator.admin`으로 유지됩니다.
  Plugin 소유 메서드에는 Plugin별 접두사를 사용하는 것이 좋습니다.
</Note>

<Accordion title="registerEmbeddedExtensionFactory를 언제 사용해야 하는가">
  Plugin이 OpenClaw 임베디드 실행 중 Pi 네이티브
  이벤트 타이밍이 필요할 때 `api.registerEmbeddedExtensionFactory(...)`를 사용하세요. 예를 들어
  최종 tool-result 메시지가 emit되기 전에 발생해야 하는 비동기 `tool_result`
  재작성 같은 경우입니다.

이것은 현재 번들된 Plugin seam입니다. 번들된 Plugin만 하나를 등록할 수 있고,
`openclaw.plugin.json`에
`contracts.embeddedExtensionFactories: ["pi"]`를 선언해야 합니다. 더 낮은 수준의 seam이
필요하지 않은 모든 경우에는 일반 OpenClaw Plugin hook을 유지하세요.
</Accordion>

### Gateway 검색 등록

`api.registerGatewayDiscoveryService(...)`를 사용하면 Plugin이 mDNS/Bonjour 같은
로컬 검색 전송에서 활성 Gateway를 광고할 수 있습니다. OpenClaw는
로컬 검색이 활성화되어 있을 때 Gateway 시작 중 이 서비스를 호출하고, 현재
Gateway 포트 및 비밀이 아닌 TXT 힌트 데이터를 전달하며, Gateway 종료 중
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

Gateway 검색 Plugin은 광고된 TXT 값을 비밀 또는
인증으로 취급해서는 안 됩니다. 검색은 라우팅 힌트이며, 신뢰는 여전히 Gateway 인증과 TLS pinning이 담당합니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 최상위 메타데이터를 받습니다:

- `commands`: registrar가 소유하는 명시적 명령 루트
- `descriptors`: 루트 CLI 도움말,
  라우팅 및 지연 Plugin CLI 등록에 사용되는 파싱 시점 명령 descriptor

Plugin 명령이 일반 루트 CLI 경로에서 지연 로드 상태를 유지하도록 하려면,
해당 registrar가 노출하는 모든 최상위 명령 루트를 포괄하는 `descriptors`를 제공하세요.

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

지연 루트 CLI 등록이 필요하지 않을 때만 `commands`를 단독으로 사용하세요.
그 eager 호환성 경로는 계속 지원되지만, 파싱 시점 지연 로딩을 위한
descriptor 기반 placeholder는 설치하지 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`를 사용하면 Plugin이 `codex-cli` 같은
로컬 AI CLI 백엔드의 기본 구성을 소유할 수 있습니다.

- 백엔드 `id`는 `codex-cli/gpt-5` 같은 모델 ref에서 provider 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 동일한 형태를 사용합니다.
- 사용자 구성이 항상 우선합니다. OpenClaw는 CLI를 실행하기 전에
  Plugin 기본값 위에 `agents.defaults.cliBackends.<id>`를 병합합니다.
- 병합 후 백엔드에 호환성 재작성이 필요하다면
  (예: 이전 flag 형태 정규화) `normalizeConfig`를 사용하세요.

### 독점 슬롯

| 메서드                                     | 등록하는 항목                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | 컨텍스트 엔진(한 번에 하나만 활성). `assemble()` 콜백은 엔진이 프롬프트 추가를 조정할 수 있도록 `availableTools`와 `citationsMode`를 받습니다. |
| `api.registerMemoryCapability(capability)` | 통합 메모리 capability                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 flush 계획 resolver                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 adapter                                                                                                                                  |

### 메모리 임베딩 adapter

| 메서드                                         | 등록하는 항목                               |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 Plugin용 메모리 임베딩 adapter         |

- `registerMemoryCapability`가 권장되는 독점 메모리 Plugin API입니다.
- `registerMemoryCapability`는 companion Plugin이 특정
  메모리 Plugin의 private 레이아웃에 접근하는 대신
  `openclaw/plugin-sdk/memory-host-core`를 통해 내보낸 메모리 artifact를 소비할 수 있도록
  `publicArtifacts.listArtifacts(...)`를 노출할 수도 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`,
  `registerMemoryRuntime`은 레거시 호환 독점 메모리 Plugin API입니다.
- `registerMemoryEmbeddingProvider`는 활성 메모리 Plugin이 하나 이상의
  임베딩 adapter ID(예: `openai`, `gemini` 또는 사용자 정의
  Plugin 정의 ID)를 등록할 수 있게 합니다.
- `agents.defaults.memorySearch.provider` 및
  `agents.defaults.memorySearch.fallback` 같은 사용자 구성은
  등록된 해당 adapter ID에 대해 해석됩니다.

### 이벤트 및 라이프사이클

| 메서드                                       | 수행하는 작업            |
| -------------------------------------------- | ------------------------ |
| `api.on(hookName, handler, opts?)`           | 타입 지정 라이프사이클 hook |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백         |

### Hook 결정 의미론

- `before_tool_call`: `{ block: true }`를 반환하면 종료입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 재정의가 아니라 결정 없음(`block` 생략과 동일)으로 처리됩니다.
- `before_install`: `{ block: true }`를 반환하면 종료입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 재정의가 아니라 결정 없음(`block` 생략과 동일)으로 처리됩니다.
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 종료입니다. 어떤 핸들러든 디스패치를 가져가면 더 낮은 우선순위 핸들러와 기본 모델 디스패치 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 종료입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 재정의가 아니라 결정 없음(`cancel` 생략과 동일)으로 처리됩니다.
- `message_received`: 수신 thread/topic 라우팅이 필요할 때는 타입 지정된 `threadId` 필드를 사용하세요. `metadata`는 채널별 추가 정보용으로 유지하세요.
- `message_sending`: 채널별 `metadata`로 폴백하기 전에 타입 지정된 `replyToId` / `threadId` 라우팅 필드를 사용하세요.
- `gateway_start`: 내부 `gateway:startup` hook에 의존하지 말고, Gateway 소유 시작 상태에는 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`를 사용하세요.

### API 객체 필드

| 필드                     | 타입                      | 설명                                                                                     |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                                |
| `api.name`               | `string`                  | 표시 이름                                                                                |
| `api.version`            | `string?`                 | Plugin 버전(선택 사항)                                                                   |
| `api.description`        | `string?`                 | Plugin 설명(선택 사항)                                                                   |
| `api.source`             | `string`                  | Plugin 소스 경로                                                                         |
| `api.rootDir`            | `string?`                 | Plugin 루트 디렉터리(선택 사항)                                                          |
| `api.config`             | `OpenClawConfig`          | 현재 구성 스냅샷(사용 가능할 때 활성 메모리 내 런타임 스냅샷)                            |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 Plugin별 구성                                            |
| `api.runtime`            | `PluginRuntime`           | [런타임 헬퍼](/ko/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | 범위 지정 로거(`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드. `"setup-runtime"`은 가벼운 전체 엔트리 전 시작/설정 창입니다 |
| `api.resolvePath(input)` | `(string) => string`      | Plugin 루트를 기준으로 경로 해석                                                         |

## 내부 모듈 규칙

Plugin 내부에서는 내부 import에 로컬 barrel 파일을 사용하세요:

```
my-plugin/
  api.ts            # 외부 소비자를 위한 공개 export
  runtime-api.ts    # 내부 전용 런타임 export
  index.ts          # Plugin 엔트리 포인트
  setup-entry.ts    # 가벼운 설정 전용 엔트리(선택 사항)
```

<Warning>
  프로덕션 코드에서 `openclaw/plugin-sdk/<your-plugin>`을 통해
  자기 자신의 Plugin을 import하지 마세요. 내부 import는 `./api.ts` 또는
  `./runtime-api.ts`를 통해 처리하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

Facade 로드된 번들 Plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 유사한 공개 엔트리 파일)은 OpenClaw가 이미 실행 중이면
활성 런타임 구성 스냅샷을 우선 사용합니다. 아직 런타임
스냅샷이 없으면 디스크의 해석된 구성 파일로 폴백합니다.

provider Plugin은 헬퍼가 의도적으로 provider 전용이고 아직 일반 SDK
하위 경로에 속하지 않을 때 좁은 Plugin 로컬 계약 barrel을 노출할 수 있습니다. 번들 예시:

- **Anthropic**: Claude
  베타 헤더 및 `service_tier` 스트림 헬퍼를 위한 공개 `api.ts` / `contract-api.ts` seam.
- **`@openclaw/openai-provider`**: `api.ts`는 provider 빌더,
  기본 모델 헬퍼 및 realtime provider 빌더를 export합니다.
- **`@openclaw/openrouter-provider`**: `api.ts`는 provider 빌더와
  온보딩/구성 헬퍼를 export합니다.

<Warning>
  확장 프로덕션 코드도 `openclaw/plugin-sdk/<other-plugin>`
  import를 피해야 합니다. 헬퍼가 정말 공유되어야 한다면 두 Plugin을 결합하는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` 또는 다른
  capability 지향 표면 같은 중립적인 SDK 하위 경로로 승격하세요.
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="엔트리 포인트" icon="door-open" href="/ko/plugins/sdk-entrypoints">
    `definePluginEntry` 및 `defineChannelPluginEntry` 옵션.
  </Card>
  <Card title="런타임 헬퍼" icon="gears" href="/ko/plugins/sdk-runtime">
    전체 `api.runtime` 네임스페이스 참조.
  </Card>
  <Card title="설정 및 구성" icon="sliders" href="/ko/plugins/sdk-setup">
    패키징, 매니페스트 및 구성 스키마.
  </Card>
  <Card title="테스트" icon="vial" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 lint 규칙.
  </Card>
  <Card title="SDK 마이그레이션" icon="arrows-turn-right" href="/ko/plugins/sdk-migration">
    사용 중단된 표면에서 마이그레이션하기.
  </Card>
  <Card title="Plugin 내부 구조" icon="diagram-project" href="/ko/plugins/architecture">
    심층 아키텍처 및 capability 모델.
  </Card>
</CardGroup>
