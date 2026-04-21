---
read_when:
    - 네이티브 OpenClaw Plugin 빌드 또는 디버깅
    - Plugin capability 모델 또는 소유권 경계 이해
    - Plugin 로드 파이프라인 또는 레지스트리 작업
    - provider 런타임 훅 또는 채널 Plugin 구현
sidebarTitle: Internals
summary: 'Plugin 내부: capability 모델, 소유권, 계약, 로드 파이프라인, 런타임 헬퍼'
title: Plugin 내부
x-i18n:
    generated_at: "2026-04-21T13:36:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin 내부

<Info>
  이것은 **심층 아키텍처 참조**입니다. 실용적인 가이드는 다음을 참고하세요:
  - [Install and use plugins](/ko/tools/plugin) — 사용자 가이드
  - [Getting Started](/ko/plugins/building-plugins) — 첫 Plugin 튜토리얼
  - [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 메시징 채널 빌드
  - [Provider Plugins](/ko/plugins/sdk-provider-plugins) — 모델 provider 빌드
  - [SDK Overview](/ko/plugins/sdk-overview) — import map 및 등록 API
</Info>

이 페이지에서는 OpenClaw Plugin 시스템의 내부 아키텍처를 다룹니다.

## 공개 capability 모델

capability는 OpenClaw 내부의 공개 **네이티브 Plugin** 모델입니다. 모든
네이티브 OpenClaw Plugin은 하나 이상의 capability 유형에 대해 등록합니다:

| Capability             | 등록 메서드                                      | 예시 Plugin                          |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 텍스트 추론            | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 음성                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 웹 fetch               | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | `google`                             |
| 채널 / 메시징          | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

capability를 하나도 등록하지 않고 훅, 도구 또는
서비스를 제공하는 Plugin은 **레거시 hook-only** Plugin입니다. 이 패턴도 여전히 완전히 지원됩니다.

### 외부 호환성 방침

capability 모델은 이미 core에 도입되었고 오늘날 번들/네이티브 Plugin에서
사용되고 있지만, 외부 Plugin 호환성은 "export되었으니 곧바로 고정되었다"보다
더 엄격한 기준이 필요합니다.

현재 지침:

- **기존 외부 Plugin:** hook 기반 통합이 계속 동작하도록 유지하고,
  이를 호환성 기준선으로 취급합니다
- **새 번들/네이티브 Plugin:** vendor별 특수 연동이나 새로운 hook-only 설계보다
  명시적인 capability 등록을 우선합니다
- **capability 등록을 도입하는 외부 Plugin:** 허용되지만, 문서에서 계약이
  안정적이라고 명시하지 않는 한 capability별 헬퍼 표면은 진화 중인 것으로 취급하세요

실용 규칙:

- capability 등록 API가 의도된 방향입니다
- 전환 기간 동안 레거시 훅이 외부 Plugin에 가장 안전한 무중단 경로로 남아 있습니다
- export된 헬퍼 하위 경로가 모두 동일한 것은 아닙니다. 부수적으로 export된 헬퍼가 아니라
  문서화된 좁은 계약을 우선하세요

### Plugin 형태

OpenClaw는 로드된 각 Plugin을 정적 메타데이터만이 아니라 실제
등록 동작을 기준으로 형태로 분류합니다:

- **plain-capability** -- 정확히 하나의 capability 유형만 등록합니다
  (예: `mistral` 같은 provider 전용 Plugin)
- **hybrid-capability** -- 여러 capability 유형을 등록합니다
  (예: `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 소유합니다)
- **hook-only** -- capability, 도구, 명령, 서비스 없이
  훅(타입 지정 또는 커스텀)만 등록합니다
- **non-capability** -- capability 없이 도구, 명령, 서비스 또는 경로를 등록합니다

Plugin의 형태와 capability 분해를 보려면 `openclaw plugins inspect <id>`를 사용하세요.
자세한 내용은 [CLI reference](/cli/plugins#inspect)를 참고하세요.

### 레거시 훅

`before_agent_start` 훅은 hook-only Plugin을 위한 호환성 경로로 여전히 지원됩니다.
실제 레거시 Plugin들이 여전히 이에 의존하고 있습니다.

방향:

- 계속 동작하도록 유지
- 레거시로 문서화
- 모델/provider override 작업에는 `before_model_resolve` 우선
- 프롬프트 변경 작업에는 `before_prompt_build` 우선
- 실제 사용량이 줄고 fixture 커버리지가 마이그레이션 안전성을 입증한 뒤에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나가 보일 수 있습니다:

| 신호                       | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config가 정상적으로 파싱되고 Plugin이 resolve됨              |
| **compatibility advisory** | Plugin이 지원되지만 더 오래된 패턴을 사용함(예: `hook-only`) |
| **legacy warning**         | Plugin이 `before_agent_start`를 사용하며, 이는 deprecated 상태임 |
| **hard error**             | Config가 유효하지 않거나 Plugin 로드에 실패함                |

`hook-only`도 `before_agent_start`도 오늘날 여러분의 Plugin을 망가뜨리지는 않습니다 --
`hook-only`는 advisory이고, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 나타납니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 개의 계층으로 구성됩니다:

1. **매니페스트 + 디스커버리**
   OpenClaw는 구성된 경로, 워크스페이스 루트,
   전역 extension 루트 및 번들 extension에서 후보 Plugin을 찾습니다.
   디스커버리는 먼저 네이티브 `openclaw.plugin.json` 매니페스트와 지원되는 번들 매니페스트를 읽습니다.
2. **활성화 + 검증**
   core는 디스커버리된 Plugin이 활성화, 비활성화, 차단되었는지,
   또는 memory 같은 배타적 슬롯에 선택되었는지를 결정합니다.
3. **런타임 로드**
   네이티브 OpenClaw Plugin은 jiti를 통해 프로세스 내에서 로드되고
   중앙 레지스트리에 capability를 등록합니다. 호환 가능한 번들은
   런타임 코드를 import하지 않고 레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 도구, 채널, provider
   설정, 훅, HTTP 경로, CLI 명령, 서비스를 노출합니다.

특히 Plugin CLI의 경우 루트 명령 디스커버리는 두 단계로 나뉩니다:

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 옵니다
- 실제 Plugin CLI 모듈은 지연 상태를 유지하다가 첫 호출 시 등록될 수 있습니다

이렇게 하면 OpenClaw가 파싱 전에 루트 명령 이름을 예약하면서도
Plugin 소유 CLI 코드를 Plugin 내부에 유지할 수 있습니다.

중요한 설계 경계:

- 디스커버리 + config 검증은 Plugin 코드를 실행하지 않고
  **매니페스트/schema 메타데이터**만으로 동작해야 합니다
- 네이티브 런타임 동작은 Plugin 모듈의 `register(api)` 경로에서 나옵니다

이 분리는 OpenClaw가 전체 런타임이 활성화되기 전에
config를 검증하고, 누락되었거나 비활성화된 Plugin을 설명하고,
UI/schema 힌트를 구성할 수 있게 해줍니다.

### 채널 Plugin과 공유 message 도구

채널 Plugin은 일반 채팅 동작을 위해 별도의 send/edit/react 도구를
등록할 필요가 없습니다. OpenClaw는 core에 하나의 공유 `message` 도구를 유지하고,
채널 Plugin이 그 뒤의 채널별 디스커버리와 실행을 소유합니다.

현재 경계는 다음과 같습니다:

- core는 공유 `message` 도구 호스트, 프롬프트 wiring, session/thread
  bookkeeping, 실행 dispatch를 소유합니다
- 채널 Plugin은 범위 지정된 action 디스커버리, capability 디스커버리,
  그리고 채널별 schema fragment를 소유합니다
- 채널 Plugin은 대화 id가 thread id를 어떻게 인코딩하거나
  부모 대화에서 어떻게 상속하는지 같은 provider별 session 대화 문법을 소유합니다
- 채널 Plugin은 action adapter를 통해 최종 action을 실행합니다

채널 Plugin의 경우 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 디스커버리
호출을 통해 Plugin은 표시 가능한 action, capability, schema
기여를 함께 반환할 수 있으므로 이 요소들이 서로 어긋나지 않습니다.

채널별 message-tool 파라미터가 로컬 경로나 원격 미디어 URL 같은
미디어 소스를 담는 경우, Plugin은 또한
`describeMessageTool(...)`에서 `mediaSourceParams`를 반환해야 합니다. core는 이 명시적
목록을 사용해 Plugin 소유 파라미터 이름을 하드코딩하지 않고
샌드박스 경로 정규화와 아웃바운드 미디어 액세스 힌트를 적용합니다.
여기서는 채널 전체의 평면 목록이 아니라 action 범위 맵을 우선하세요. 그래야
프로필 전용 미디어 파라미터가 `send` 같은 관련 없는 action에서 정규화되지 않습니다.

core는 런타임 scope를 이 디스커버리 단계에 전달합니다. 중요한 필드는 다음과 같습니다:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이는 컨텍스트 민감형 Plugin에 중요합니다. 채널은 활성 계정,
현재 room/thread/message 또는 신뢰된 requester identity에 따라
message action을 숨기거나 노출할 수 있으며, 이를 core `message` 도구에
채널별 분기를 하드코딩하지 않고 처리할 수 있습니다.

이 때문에 embedded-runner 라우팅 변경은 여전히 Plugin 작업입니다. runner는
현재 채팅/session identity를 Plugin 디스커버리 경계로 전달하여
공유 `message` 도구가 현재 턴에 맞는 채널 소유 표면을 노출하도록 해야 합니다.

채널 소유 실행 헬퍼의 경우, 번들 Plugin은 실행
런타임을 자기 extension 모듈 내부에 유지해야 합니다. core는 더 이상
`src/agents/tools` 아래의 Discord, Slack, Telegram 또는 WhatsApp 메시지 action 런타임을 소유하지 않습니다.
우리는 별도의 `plugin-sdk/*-action-runtime` 하위 경로를 공개하지 않으며, 번들
Plugin은 자기 extension 소유 모듈에서 자기 로컬 런타임 코드를 직접 import해야 합니다.

동일한 경계는 일반적인 provider 명명 SDK seam에도 적용됩니다. core는
Slack, Discord, Signal, WhatsApp 또는 유사 extension을 위한 채널별 convenience barrel을 import해서는 안 됩니다.
core에 특정 동작이 필요하다면, 번들 Plugin 자체의 `api.ts` / `runtime-api.ts`
barrel을 소비하거나 그 요구 사항을 공유 SDK의 좁은 범용 capability로 승격하세요.

특히 poll의 경우 실행 경로는 두 가지입니다:

- `outbound.sendPoll`은 공통 poll 모델에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 poll 의미론 또는 추가 poll 파라미터에
  더 적합한 우선 경로입니다

core는 이제 Plugin poll dispatch가 action을 거절한 뒤에야
공유 poll 파싱을 수행하므로, Plugin 소유 poll 핸들러가 일반 poll 파서에 먼저
가로막히지 않고 채널별 poll 필드를 받을 수 있습니다.

전체 시작 시퀀스는 [Load pipeline](#load-pipeline)을 참고하세요.

## capability 소유권 모델

OpenClaw는 네이티브 Plugin을 관련 없는 통합 기능의 잡동사니가 아니라,
**회사** 또는 **기능**의 소유권 경계로 취급합니다.

즉 다음을 의미합니다:

- 회사 Plugin은 보통 해당 회사의 OpenClaw 표면 전체를 소유해야 합니다
- 기능 Plugin은 보통 자신이 도입하는 기능 표면 전체를 소유해야 합니다
- 채널은 provider 동작을 제각각 재구현하지 말고 공유 core capability를 소비해야 합니다

예시:

- 번들된 `openai` Plugin은 OpenAI 모델 provider 동작과 OpenAI
  음성 + 실시간 음성 + 미디어 이해 + 이미지 생성 동작을 소유합니다
- 번들된 `elevenlabs` Plugin은 ElevenLabs 음성 동작을 소유합니다
- 번들된 `microsoft` Plugin은 Microsoft 음성 동작을 소유합니다
- 번들된 `google` Plugin은 Google 모델 provider 동작과 함께 Google
  미디어 이해 + 이미지 생성 + 웹 검색 동작을 소유합니다
- 번들된 `firecrawl` Plugin은 Firecrawl 웹 fetch 동작을 소유합니다
- 번들된 `minimax`, `mistral`, `moonshot`, `zai` Plugin은 각자의
  미디어 이해 백엔드를 소유합니다
- 번들된 `qwen` Plugin은 Qwen 텍스트 provider 동작과 함께
  미디어 이해 및 비디오 생성 동작을 소유합니다
- `voice-call` Plugin은 기능 Plugin입니다. 호출 전송, 도구,
  CLI, 경로, Twilio 미디어 스트림 브리징을 소유하지만, vendor Plugin을 직접 import하는 대신
  공유 음성과 실시간 전사 및 실시간 음성 capability를 소비합니다

의도된 최종 상태는 다음과 같습니다:

- OpenAI는 텍스트 모델, 음성, 이미지,
  향후 비디오까지 아우르더라도 하나의 Plugin 안에 존재합니다
- 다른 vendor도 자신의 표면 영역에 대해 같은 방식을 취할 수 있습니다
- 채널은 어느 vendor Plugin이 provider를 소유하는지 신경 쓰지 않습니다. core가 노출하는
  공유 capability 계약을 소비합니다

이것이 핵심 구분입니다:

- **plugin** = 소유권 경계
- **capability** = 여러 Plugin이 구현하거나 소비할 수 있는 core 계약

따라서 OpenClaw가 비디오 같은 새 도메인을 추가할 때, 첫 질문은
"어느 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 질문은 "core 비디오 capability
계약은 무엇인가?"입니다. 이 계약이 존재하면 vendor Plugin이
이에 대해 등록할 수 있고 채널/기능 Plugin이 이를 소비할 수 있습니다.

capability가 아직 존재하지 않는다면, 일반적으로 올바른 조치는 다음과 같습니다:

1. core에서 누락된 capability를 정의한다
2. Plugin API/런타임을 통해 이를 타입이 지정된 방식으로 노출한다
3. 채널/기능을 그 capability에 맞게 연결한다
4. vendor Plugin이 구현을 등록하게 한다

이렇게 하면 소유권을 명시적으로 유지하면서도 단일 vendor나
일회성 Plugin 전용 코드 경로에 의존하는 core 동작을 피할 수 있습니다.

### capability 계층화

코드가 어디에 속해야 하는지 결정할 때 이 정신 모델을 사용하세요:

- **core capability 계층**: 공유 orchestration, 정책, fallback, config
  병합 규칙, 전달 의미론, 타입 계약
- **vendor Plugin 계층**: vendor별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, usage 엔드포인트
- **채널/기능 Plugin 계층**: Slack/Discord/voice-call 등 통합으로,
  core capability를 소비하고 이를 표면에 제공합니다

예를 들어 TTS는 다음 형태를 따릅니다:

- core는 응답 시점 TTS 정책, fallback 순서, 기본 설정, 채널 전달을 소유합니다
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유합니다
- `voice-call`은 전화 통신 TTS 런타임 헬퍼를 소비합니다

향후 capability에도 같은 패턴을 우선 적용해야 합니다.

### 다중 capability 회사 Plugin 예시

회사 Plugin은 외부에서 보기에 응집력 있게 느껴져야 합니다. OpenClaw에
모델, 음성, 실시간 전사, 실시간 음성, 미디어
이해, 이미지 생성, 비디오 생성, 웹 fetch, 웹 검색을 위한 공유 계약이 있다면,
vendor는 자신의 모든 표면을 한곳에서 소유할 수 있습니다:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

중요한 것은 정확한 헬퍼 이름이 아닙니다. 중요한 것은 형태입니다:

- 하나의 Plugin이 vendor 표면을 소유합니다
- core는 여전히 capability 계약을 소유합니다
- 채널과 기능 Plugin은 vendor 코드가 아니라 `api.runtime.*` 헬퍼를 소비합니다
- 계약 테스트는 Plugin이 자신이 소유한다고 주장하는 capability를
  등록했는지 검증할 수 있습니다

### capability 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유
capability로 취급합니다. 동일한 소유권 모델이 여기에도 적용됩니다:

1. core가 media-understanding 계약을 정의한다
2. vendor Plugin이 해당하는 경우 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록한다
3. 채널과 기능 Plugin은 vendor 코드에 직접 연결하는 대신 공유 core 동작을 소비한다

이렇게 하면 특정 provider의 비디오 가정을 core에 굳혀 넣지 않게 됩니다. Plugin이
vendor 표면을 소유하고, core는 capability 계약과 fallback 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 따릅니다. core가 타입이 지정된
capability 계약과 런타임 헬퍼를 소유하고, vendor Plugin이
`api.registerVideoGenerationProvider(...)` 구현을 여기에 등록합니다.

구체적인 롤아웃 체크리스트가 필요하신가요? 다음을 참고하세요
[Capability Cookbook](/ko/plugins/architecture).

## 계약 및 강제

Plugin API 표면은 의도적으로
`OpenClawPluginApi`에 타입이 지정되어 중앙화되어 있습니다. 이 계약은 지원되는 등록 지점과
Plugin이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유:

- Plugin 작성자는 하나의 안정적인 내부 표준을 얻게 됩니다
- core는 두 Plugin이 같은 provider id를 등록하는 것과 같은
  중복 소유를 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있습니다
- 계약 테스트는 번들 Plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다

강제에는 두 계층이 있습니다:

1. **런타임 등록 강제**
   Plugin 레지스트리는 Plugin이 로드될 때 등록을 검증합니다. 예:
   중복 provider id, 중복 음성 provider id, 잘못된
   등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 Plugin은 테스트 실행 중 계약 레지스트리에 캡처되므로
   OpenClaw가 소유권을 명시적으로 검증할 수 있습니다. 오늘날 이는 모델
   provider, 음성 provider, 웹 검색 provider, 번들 등록
   소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤
표면을 소유하는지 미리 알고 있다는 점입니다. 덕분에 소유권이 암묵적이 아니라
선언되고, 타입이 지정되며, 테스트 가능하기 때문에 core와 채널이 매끄럽게 조합될 수 있습니다.

### 계약에 포함되어야 하는 것

좋은 Plugin 계약은 다음과 같습니다:

- 타입이 지정됨
- 작음
- capability별
- core가 소유함
- 여러 Plugin이 재사용 가능함
- 채널/기능이 vendor 지식 없이 소비 가능함

나쁜 Plugin 계약은 다음과 같습니다:

- core에 숨겨진 vendor별 정책
- 레지스트리를 우회하는 일회성 Plugin 탈출구
- vendor 구현에 직접 손을 뻗는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

확신이 서지 않으면 추상화 수준을 올리세요. 먼저 capability를 정의한 다음,
Plugin이 여기에 연결되게 하세요.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 **같은 프로세스 내에서**
실행됩니다. 샌드박싱되지 않습니다. 로드된 네이티브 Plugin은 core 코드와 같은
프로세스 수준 신뢰 경계를 가집니다.

의미하는 바:

- 네이티브 Plugin은 도구, 네트워크 핸들러, 훅, 서비스를 등록할 수 있습니다
- 네이티브 Plugin 버그는 gateway를 충돌시키거나 불안정하게 만들 수 있습니다
- 악의적인 네이티브 Plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일합니다

호환 가능한 번들은 OpenClaw가 현재 이를
메타데이터/콘텐츠 팩으로 취급하기 때문에 기본적으로 더 안전합니다. 현재 릴리스에서 이는 주로 번들된
Skills를 의미합니다.

번들되지 않은 Plugin에는 allowlist와 명시적 install/load 경로를 사용하세요. 워크스페이스 Plugin은
프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들된 워크스페이스 패키지 이름의 경우, Plugin id는 기본적으로 npm
이름 `@openclaw/<id>`에 고정하세요. 또는 패키지가 의도적으로 더 좁은 Plugin 역할을 노출할 때는
승인된 타입 접미사인
`-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding`를 사용하세요.

중요한 신뢰 메모:

- `plugins.allow`는 소스 출처가 아니라 **plugin id**를 신뢰합니다.
- 번들 Plugin과 같은 id를 가진 워크스페이스 Plugin은 해당 워크스페이스 Plugin이 활성화되거나 allowlist에 있으면
  의도적으로 번들 사본을 가립니다.
- 이는 정상이며 로컬 개발, 패치 테스트, 핫픽스에 유용합니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 capability를 export합니다.

capability 등록은 공개 상태로 유지하세요. 비계약 헬퍼 export는 줄이세요:

- 번들 Plugin 전용 헬퍼 하위 경로
- 공개 API로 의도되지 않은 런타임 plumbing 하위 경로
- vendor별 convenience 헬퍼
- 구현 세부사항인 setup/onboarding 헬퍼

일부 번들 Plugin 헬퍼 하위 경로는 호환성과 번들 Plugin 유지 관리를 위해
생성된 SDK export map에 여전히 남아 있습니다. 현재 예시로는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 그리고 여러 `plugin-sdk/matrix*` seam이 있습니다. 이를
새 서드파티 Plugin에 권장되는 SDK 패턴이 아니라 예약된 구현 세부 export로 취급하세요.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다:

1. 후보 Plugin 루트를 발견한다
2. 네이티브 또는 호환 번들 매니페스트와 패키지 메타데이터를 읽는다
3. 안전하지 않은 후보를 거부한다
4. Plugin config(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)를 정규화한다
5. 각 후보의 활성화 여부를 결정한다
6. 활성화된 네이티브 모듈을 jiti로 로드한다
7. 네이티브 `register(api)`(또는 레거시 별칭인 `activate(api)`) 훅을 호출하고 등록 내용을 Plugin 레지스트리에 수집한다
8. 레지스트리를 명령/런타임 표면에 노출한다

<Note>
`activate`는 `register`의 레거시 별칭입니다 — 로더는 존재하는 것을 해석하여(`def.register ?? def.activate`) 같은 시점에 호출합니다. 모든 번들 Plugin은 `register`를 사용합니다. 새 Plugin에는 `register`를 사용하세요.
</Note>

안전 게이트는 런타임 실행 **이전**에 수행됩니다. 후보는
엔트리가 Plugin 루트를 벗어나거나, 경로가 world-writable이거나, 번들되지 않은 Plugin의 경로
소유권이 의심스러워 보일 때 차단됩니다.

### 매니페스트 우선 동작

매니페스트는 control-plane의 단일 진실 공급원입니다. OpenClaw는 이를 사용해:

- Plugin을 식별하고
- 선언된 채널/Skills/config schema 또는 번들 capability를 발견하고
- `plugins.entries.<id>.config`를 검증하고
- Control UI 레이블/placeholder를 보강하고
- install/catalog 메타데이터를 표시하고
- Plugin 런타임을 로드하지 않고도 가벼운 activation 및 setup descriptor를 보존합니다

네이티브 Plugin의 경우, 런타임 모듈은 data-plane 부분입니다. 이는
훅, 도구, 명령 또는 provider 흐름과 같은 실제 동작을 등록합니다.

선택적 매니페스트 `activation` 및 `setup` 블록은 control plane에 남습니다.
이것들은 activation 계획과 setup 디스커버리를 위한 메타데이터 전용 descriptor이며,
런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.
첫 번째 라이브 activation 소비자는 이제 매니페스트 명령, 채널, provider 힌트를 사용해
더 넓은 레지스트리 구체화 전에 Plugin 로드를 좁힙니다:

- CLI 로딩은 요청된 기본 명령을 소유한 Plugin으로 좁혀집니다
- 채널 setup/Plugin resolve는 요청된
  채널 id를 소유한 Plugin으로 좁혀집니다
- 명시적 provider setup/런타임 resolve는 요청된
  provider id를 소유한 Plugin으로 좁혀집니다

setup 디스커버리는 이제 descriptor 소유 id인 `setup.providers`와
`setup.cliBackends`를 우선 사용해 후보 Plugin을 좁힌 뒤, 여전히 setup 시점 런타임 훅이 필요한 Plugin에 대해서만
`setup-api`로 fallback합니다. 둘 이상의 디스커버리된 Plugin이 동일한 정규화된 setup provider 또는 CLI backend
id를 주장하면, setup 조회는 디스커버리 순서에 의존하지 않고 그 모호한 소유자를 거부합니다.

### 로더가 캐시하는 것

OpenClaw는 다음에 대해 짧은 프로세스 내 캐시를 유지합니다:

- 디스커버리 결과
- 매니페스트 레지스트리 데이터
- 로드된 Plugin 레지스트리

이 캐시는 급격한 시작 부하와 반복 명령 오버헤드를 줄여 줍니다. 이것들은
지속 저장이 아니라 수명이 짧은 성능 캐시로 생각해도 안전합니다.

성능 메모:

- 이 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- 캐시 시간 창은 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS`와
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정하세요.

## 레지스트리 모델

로드된 Plugin은 임의의 core 전역 상태를 직접 변경하지 않습니다. 이들은
중앙 Plugin 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다:

- Plugin 레코드(ID, 소스, 출처, 상태, 진단)
- 도구
- 레거시 훅 및 타입 지정 훅
- 채널
- provider
- Gateway RPC 핸들러
- HTTP 경로
- CLI registrar
- 백그라운드 서비스
- Plugin 소유 명령

그런 다음 core 기능은 Plugin 모듈과 직접 통신하는 대신 이 레지스트리에서 읽습니다.
이렇게 하면 로딩이 단방향으로 유지됩니다:

- Plugin 모듈 -> 레지스트리 등록
- core 런타임 -> 레지스트리 소비

이 분리는 유지보수성에 중요합니다. 이는 대부분의 core 표면이
"모든 Plugin 모듈을 특수 처리"가 아니라 "레지스트리 읽기"라는
하나의 통합 지점만 필요하다는 뜻입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 Plugin은 승인이 해결되었을 때 반응할 수 있습니다.

바인드 요청이 승인되거나 거부된 뒤 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하세요:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` 또는 `"deny"`
- `binding`: 승인된 요청에 대해 해결된 바인딩
- `request`: 원본 요청 요약, detach 힌트, sender id, 그리고
  대화 메타데이터

이 콜백은 알림 전용입니다. 누가 대화를 바인딩할 수 있는지를 바꾸지 않으며,
core 승인 처리가 끝난 뒤 실행됩니다.

## provider 런타임 훅

provider Plugin에는 이제 두 개의 계층이 있습니다:

- 매니페스트 메타데이터: 런타임 로드 전에 저비용 provider env-auth 조회를 위한 `providerAuthEnvVars`,
  인증을 공유하는 provider 변형을 위한 `providerAuthAliases`,
  런타임 로드 전에 저비용 채널 env/setup 조회를 위한 `channelEnvVars`,
  그리고 런타임 로드 전에 저비용 onboarding/auth-choice 레이블 및
  CLI 플래그 메타데이터를 위한 `providerAuthChoices`
- config 시점 훅: `catalog` / 레거시 `discovery` 및 `applyConfigDefaults`
- 런타임 훅: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw는 여전히 범용 에이전트 루프, failover, transcript 처리, 도구 정책을 소유합니다.
이 훅은 전체 커스텀 추론 전송이 필요하지 않도록 하면서
provider별 동작을 확장하는 표면입니다.

provider에 env 기반 자격 증명이 있고
범용 auth/status/model-picker 경로가 Plugin 런타임을 로드하지 않고도 이를 봐야 한다면 매니페스트 `providerAuthEnvVars`를 사용하세요.
하나의 provider id가 다른 provider id의 env vars, auth profiles, config 기반 auth,
API 키 onboarding 선택을 재사용해야 한다면 매니페스트 `providerAuthAliases`를 사용하세요.
onboarding/auth-choice CLI 표면이 provider 런타임을 로드하지 않고도
provider의 choice id, 그룹 레이블, 단순 단일 플래그 auth wiring을 알아야 한다면 매니페스트 `providerAuthChoices`를 사용하세요.
provider 런타임 `envVars`는 onboarding 레이블이나 OAuth
client-id/client-secret setup var 같은 운영자 대상 힌트에 유지하세요.

채널에 env 기반 auth 또는 setup이 있고
범용 shell-env fallback, config/status 검사 또는 setup 프롬프트가 채널 런타임을 로드하지 않고도 이를 봐야 한다면
매니페스트 `channelEnvVars`를 사용하세요.

### 훅 순서와 사용법

모델/provider Plugin의 경우 OpenClaw는 대략 다음 순서로 훅을 호출합니다.
"사용 시점" 열은 빠른 판단 가이드입니다.

| #   | 훅                                | 기능                                                                                                           | 사용 시점                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 provider config를 `models.providers`에 게시합니다                                       | provider가 카탈로그 또는 기본 URL 기본값을 소유하는 경우                                                                                    |
| 2   | `applyConfigDefaults`             | config 구체화 중 provider 소유 전역 config 기본값을 적용합니다                                                | 기본값이 auth 모드, env 또는 provider 모델 계열 의미론에 따라 달라지는 경우                                                                |
| --  | _(내장 모델 조회)_                | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도합니다                                                    | _(Plugin 훅 아님)_                                                                                                                          |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 프리뷰 model-id 별칭을 정규화합니다                                                     | provider가 정식 모델 해석 전에 별칭 정리를 소유하는 경우                                                                                    |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 provider 계열의 `api` / `baseUrl`을 정규화합니다                                          | provider가 동일한 전송 계열 내 커스텀 provider id의 전송 정리를 소유하는 경우                                                              |
| 5   | `normalizeConfig`                 | 런타임/provider 해석 전에 `models.providers.<id>`를 정규화합니다                                              | provider에 Plugin과 함께 있어야 하는 config 정리가 필요한 경우; 번들된 Google 계열 헬퍼는 지원되는 Google config 항목도 보완합니다        |
| 6   | `applyNativeStreamingUsageCompat` | config provider에 네이티브 streaming-usage compat 재작성을 적용합니다                                         | provider에 엔드포인트 기반 네이티브 streaming usage 메타데이터 수정이 필요한 경우                                                          |
| 7   | `resolveConfigApiKey`             | 런타임 auth 로드 전에 config provider의 env-marker auth를 해석합니다                                           | provider가 provider 소유 env-marker API 키 해석을 가지는 경우; `amazon-bedrock`도 여기서 내장 AWS env-marker 해석기를 가집니다            |
| 8   | `resolveSyntheticAuth`            | 평문을 저장하지 않고 로컬/셀프호스팅 또는 config 기반 auth를 노출합니다                                        | provider가 synthetic/local credential marker로 동작할 수 있는 경우                                                                          |
| 9   | `resolveExternalAuthProfiles`     | provider 소유 외부 auth profile을 오버레이합니다; 기본 `persistence`는 CLI/app 소유 자격 증명에 대해 `runtime-only`입니다 | provider가 복사된 refresh token을 저장하지 않고 외부 auth 자격 증명을 재사용하는 경우                                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | env/config 기반 auth 뒤로 저장된 synthetic profile placeholder의 우선순위를 낮춥니다                           | provider가 우선순위를 차지하면 안 되는 synthetic placeholder profile을 저장하는 경우                                                        |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 provider 소유 model id에 대한 동기 fallback                                       | provider가 임의의 상위 model id를 허용하는 경우                                                                                             |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`을 다시 실행합니다                                                       | provider가 알 수 없는 id를 해석하기 전에 네트워크 메타데이터가 필요한 경우                                                                  |
| 13  | `normalizeResolvedModel`          | embedded runner가 해석된 모델을 사용하기 전 최종 재작성을 수행합니다                                           | provider가 전송 재작성이 필요하지만 여전히 core 전송을 사용하는 경우                                                                        |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 전송 뒤에 있는 vendor 모델에 대한 compat 플래그를 기여합니다                                         | provider가 provider를 직접 인수하지 않고도 프록시 전송에서 자기 모델을 인식하는 경우                                                       |
| 15  | `capabilities`                    | 공유 core 로직이 사용하는 provider 소유 transcript/tooling 메타데이터                                         | provider에 transcript/provider 계열 특성이 필요한 경우                                                                                      |
| 16  | `normalizeToolSchemas`            | embedded runner가 보기 전에 도구 스키마를 정규화합니다                                                         | provider에 전송 계열 스키마 정리가 필요한 경우                                                                                              |
| 17  | `inspectToolSchemas`              | 정규화 후 provider 소유 스키마 진단을 노출합니다                                                               | core에 provider 전용 규칙을 가르치지 않고 keyword 경고를 제공하려는 경우                                                                   |
| 18  | `resolveReasoningOutputMode`      | 네이티브 대 태그 기반 reasoning-output 계약을 선택합니다                                                       | provider가 네이티브 필드 대신 태그된 reasoning/final output이 필요한 경우                                                                   |
| 19  | `prepareExtraParams`              | 일반 stream 옵션 wrapper 전에 요청 파라미터를 정규화합니다                                                     | provider에 기본 요청 파라미터 또는 provider별 파라미터 정리가 필요한 경우                                                                  |
| 20  | `createStreamFn`                  | 일반 stream 경로를 완전히 커스텀 전송으로 대체합니다                                                           | provider에 wrapper만이 아니라 커스텀 wire protocol이 필요한 경우                                                                            |
| 21  | `wrapStreamFn`                    | 일반 wrapper 적용 후 stream wrapper를 적용합니다                                                               | provider에 커스텀 전송 없이 요청 헤더/본문/모델 compat wrapper가 필요한 경우                                                               |
| 22  | `resolveTransportTurnState`       | 네이티브 턴별 전송 헤더 또는 메타데이터를 붙입니다                                                             | provider가 일반 전송에서 provider 네이티브 턴 ID를 보내길 원하는 경우                                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 쿨다운 정책을 붙입니다                                                       | provider가 일반 WS 전송에서 세션 헤더 또는 fallback 정책을 조정하길 원하는 경우                                                            |
| 24  | `formatApiKey`                    | auth-profile formatter: 저장된 profile을 런타임 `apiKey` 문자열로 변환합니다                                   | provider가 추가 auth 메타데이터를 저장하고 커스텀 런타임 토큰 형태가 필요한 경우                                                           |
| 25  | `refreshOAuth`                    | 커스텀 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh override                                 | provider가 공유 `pi-ai` refresher에 맞지 않는 경우                                                                                          |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                       | provider에 refresh 실패 후 provider 소유 auth 복구 가이드가 필요한 경우                                                                    |
| 27  | `matchesContextOverflowError`     | provider 소유 컨텍스트 창 overflow matcher                                                                     | provider에 일반 휴리스틱이 놓치는 원시 overflow 오류가 있는 경우                                                                            |
| 28  | `classifyFailoverReason`          | provider 소유 failover 이유 분류                                                                                | provider가 원시 API/전송 오류를 rate-limit/overload 등으로 매핑할 수 있는 경우                                                             |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 provider를 위한 프롬프트 캐시 정책                                                                 | provider에 프록시 전용 캐시 TTL 게이팅이 필요한 경우                                                                                        |
| 30  | `buildMissingAuthMessage`         | 일반 missing-auth 복구 메시지를 대체합니다                                                                     | provider에 provider 전용 missing-auth 복구 힌트가 필요한 경우                                                                               |
| 31  | `suppressBuiltInModel`            | 오래된 상위 모델 억제와 선택적 사용자 대상 오류 힌트                                                            | provider가 오래된 상위 행을 숨기거나 vendor 힌트로 대체해야 하는 경우                                                                      |
| 32  | `augmentModelCatalog`             | 디스커버리 후 synthetic/final 카탈로그 행을 추가합니다                                                         | provider가 `models list` 및 picker에 synthetic forward-compat 행이 필요한 경우                                                             |
| 33  | `resolveThinkingProfile`          | 모델별 `/think` 수준 세트, 표시 레이블, 기본값                                                                  | provider가 선택된 모델에 대해 커스텀 thinking 단계 또는 이진 레이블을 노출하는 경우                                                        |
| 34  | `isBinaryThinking`                | 켜기/끄기 reasoning 토글 compat 훅                                                                             | provider가 이진 thinking on/off만 노출하는 경우                                                                                             |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning 지원 compat 훅                                                                               | provider가 일부 모델에서만 `xhigh`를 원할 때                                                                                                |
| 36  | `resolveDefaultThinkingLevel`     | 기본 `/think` 수준 compat 훅                                                                                   | provider가 모델 계열의 기본 `/think` 정책을 소유하는 경우                                                                                   |
| 37  | `isModernModelRef`                | 라이브 profile 필터 및 스모크 선택을 위한 modern-model matcher                                                 | provider가 live/smoke 선호 모델 매칭을 소유하는 경우                                                                                        |
| 38  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환합니다                                               | provider에 토큰 교환 또는 수명이 짧은 요청 자격 증명이 필요한 경우                                                                         |
| 39  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면에 대한 usage/billing 자격 증명을 해석합니다                                         | provider에 커스텀 usage/quota 토큰 파싱 또는 다른 usage 자격 증명이 필요한 경우                                                           |
| 40  | `fetchUsageSnapshot`              | auth가 해석된 후 provider별 usage/quota 스냅샷을 가져와 정규화합니다                                           | provider에 provider 전용 usage 엔드포인트 또는 페이로드 파서가 필요한 경우                                                                |
| 41  | `createEmbeddingProvider`         | memory/search를 위한 provider 소유 임베딩 어댑터를 구성합니다                                                  | memory 임베딩 동작이 provider Plugin과 함께 있어야 하는 경우                                                                               |
| 42  | `buildReplayPolicy`               | provider의 transcript 처리를 제어하는 replay 정책을 반환합니다                                                 | provider에 커스텀 transcript 정책이 필요한 경우(예: thinking 블록 제거)                                                                   |
| 43  | `sanitizeReplayHistory`           | 일반 transcript 정리 후 replay 기록을 재작성합니다                                                             | provider에 공유 Compaction 헬퍼를 넘어서는 provider별 replay 재작성이 필요한 경우                                                        |
| 44  | `validateReplayTurns`             | embedded runner 전에 최종 replay 턴 검증 또는 형태 재구성을 수행합니다                                         | provider 전송에 일반 정리 이후 더 엄격한 턴 검증이 필요한 경우                                                                             |
| 45  | `onModelSelected`                 | 모델이 활성화될 때 provider 소유 후처리 부작용을 실행합니다                                                    | provider에 모델 활성화 시 telemetry 또는 provider 소유 상태가 필요한 경우                                                                  |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저
일치하는 provider Plugin을 확인한 다음, model id 또는 transport/config를 실제로 변경하는 훅 가능 provider Plugin이 나올 때까지 다른 provider Plugin으로 계속 넘어갑니다.
이렇게 하면 호출자가 어떤 번들 Plugin이 해당 재작성을 소유하는지 몰라도
별칭/compat provider shim이 계속 동작합니다. 어떤 provider 훅도 지원되는
Google 계열 config 항목을 재작성하지 않으면, 번들된 Google config normalizer가 여전히
그 호환성 정리를 적용합니다.

provider에 완전한 커스텀 wire protocol 또는 커스텀 요청 실행기가 필요하다면,
그것은 다른 종류의 확장입니다. 이 훅은 여전히 OpenClaw의 일반 추론 루프 위에서
동작하는 provider 동작을 위한 것입니다.

### provider 예시

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 내장 예시

- Anthropic은 `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`,
  `wrapStreamFn`을 사용합니다. 이는 Claude 4.6 forward-compat,
  provider 계열 힌트, auth 복구 가이드, usage 엔드포인트 통합,
  프롬프트 캐시 적격성, auth 인식 config 기본값, Claude
  기본/적응형 thinking 정책, 그리고 베타 헤더,
  `/fast` / `serviceTier`, `context1m`을 위한 Anthropic 전용 stream shaping을 소유하기 때문입니다.
- Anthropic의 Claude 전용 stream 헬퍼는 현재 번들 Plugin 자체의
  공개 `api.ts` / `contract-api.ts` seam에 남아 있습니다. 이 패키지 표면은
  하나의 provider 베타 헤더 규칙 때문에 범용 SDK를 넓히는 대신
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 그리고 더 저수준의
  Anthropic wrapper builder를 export합니다.
- OpenAI는 `resolveDynamicModel`, `normalizeResolvedModel`,
  `capabilities`와 함께 `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isModernModelRef`를 사용합니다.
  이는 GPT-5.4 forward-compat, 직접 OpenAI의
  `openai-completions` -> `openai-responses` 정규화, Codex 인식 auth
  힌트, Spark 억제, synthetic OpenAI 목록 행, GPT-5 thinking /
  live-model 정책을 소유하기 때문입니다. `openai-responses-defaults` stream 계열은
  attribution 헤더,
  `/fast`/`serviceTier`, 텍스트 verbosity, 네이티브 Codex 웹 검색,
  reasoning-compat 페이로드 shaping, Responses 컨텍스트 관리에 대한
  공유 네이티브 OpenAI Responses wrapper를 소유합니다.
- OpenRouter는 `catalog`와 함께 `resolveDynamicModel`,
  `prepareDynamicModel`을 사용합니다. 이 provider는 pass-through이고 OpenClaw의 정적 카탈로그가 갱신되기 전에
  새 model id를 노출할 수 있기 때문입니다. 또한
  provider 전용 요청 헤더, 라우팅 메타데이터, reasoning 패치,
  프롬프트 캐시 정책을 core 밖에 두기 위해 `capabilities`, `wrapStreamFn`, `isCacheTtlEligible`도 사용합니다.
  replay 정책은 `passthrough-gemini` 계열에서 오며, `openrouter-thinking` stream 계열은
  프록시 reasoning 주입과 지원되지 않는 모델 / `auto` 건너뛰기를 소유합니다.
- GitHub Copilot은 `catalog`, `auth`, `resolveDynamicModel`,
  `capabilities`와 함께 `prepareRuntimeAuth`, `fetchUsageSnapshot`을 사용합니다. 이는
  provider 소유 device login, 모델 fallback 동작, Claude transcript
  특성, GitHub token -> Copilot token 교환, provider 소유 usage 엔드포인트가 필요하기 때문입니다.
- OpenAI Codex는 `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, `augmentModelCatalog`와 함께
  `prepareExtraParams`, `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다. 이는
  여전히 core OpenAI transport 위에서 동작하지만, transport/base URL
  정규화, OAuth refresh fallback 정책, 기본 transport 선택,
  synthetic Codex 카탈로그 행, ChatGPT usage 엔드포인트 통합을 소유하기 때문입니다.
  direct OpenAI와 동일한 `openai-responses-defaults` stream 계열을 공유합니다.
- Google AI Studio와 Gemini CLI OAuth는 `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, `isModernModelRef`를 사용합니다. 이는
  `google-gemini` replay 계열이 Gemini 3.1 forward-compat fallback,
  네이티브 Gemini replay 검증, bootstrap replay 정리, 태그 기반
  reasoning-output 모드, modern-model 매칭을 소유하고,
  `google-thinking` stream 계열이 Gemini thinking 페이로드 정규화를 소유하기 때문입니다.
  Gemini CLI OAuth는 또한 토큰 포맷팅, 토큰 파싱, quota 엔드포인트
  연결을 위해 `formatApiKey`, `resolveUsageAuth`, `fetchUsageSnapshot`도 사용합니다.
- Anthropic Vertex는
  `anthropic-by-model` replay 계열을 통해 `buildReplayPolicy`를 사용하므로 Claude 전용 replay 정리가
  모든 `anthropic-messages` transport가 아니라 Claude id에만 범위 지정되어 유지됩니다.
- Amazon Bedrock은 `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `resolveThinkingProfile`을 사용합니다. 이는
  Bedrock 전용 throttle/not-ready/context-overflow 오류 분류를
  Anthropic-on-Bedrock 트래픽에 대해 소유하기 때문입니다. replay 정책은 여전히 동일한
  Claude 전용 `anthropic-by-model` 가드를 공유합니다.
- OpenRouter, Kilocode, Opencode, Opencode Go는
  `passthrough-gemini` replay 계열을 통해 `buildReplayPolicy`를 사용합니다. 이는 OpenAI 호환 transport를 통해
  Gemini 모델을 프록시하고 네이티브 Gemini replay 검증이나
  bootstrap 재작성 없이 Gemini thought-signature 정리가 필요하기 때문입니다.
- MiniMax는
  `hybrid-anthropic-openai` replay 계열을 통해 `buildReplayPolicy`를 사용합니다. 이는 하나의 provider가
  Anthropic-message와 OpenAI 호환 의미론을 모두 소유하기 때문입니다. Anthropic 쪽에서는 Claude 전용
  thinking-block 제거를 유지하면서 reasoning
  output 모드는 다시 네이티브로 override하고, `minimax-fast-mode` stream 계열은
  공유 stream 경로에서 fast-mode 모델 재작성을 소유합니다.
- Moonshot은 `catalog`, `resolveThinkingProfile`, `wrapStreamFn`을 사용합니다. 여전히 공유
  OpenAI transport를 사용하지만 provider 소유 thinking 페이로드 정규화가 필요하기 때문입니다.
  `moonshot-thinking` stream 계열은 config와 `/think` 상태를
  네이티브 이진 thinking 페이로드에 매핑합니다.
- Kilocode는 `catalog`, `capabilities`, `wrapStreamFn`,
  `isCacheTtlEligible`를 사용합니다. provider 소유 요청 헤더,
  reasoning 페이로드 정규화, Gemini transcript 힌트, Anthropic
  cache-TTL 게이팅이 필요하기 때문입니다. `kilocode-thinking` stream 계열은 공유 프록시 stream 경로에서
  Kilo thinking 주입을 유지하면서 `kilo/auto` 및 명시적 reasoning 페이로드를 지원하지 않는
  다른 프록시 model id는 건너뜁니다.
- Z.AI는 `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다. 이는 GLM-5 fallback,
  `tool_stream` 기본값, 이진 thinking UX, modern-model 매칭,
  usage auth + quota 가져오기를 모두 소유하기 때문입니다. `tool-stream-default-on` stream 계열은
  기본 활성화 `tool_stream` wrapper를 provider별 수작업 glue 밖에 유지합니다.
- xAI는 `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, `isModernModelRef`를 사용합니다.
  이는 네이티브 xAI Responses transport 정규화, Grok fast-mode
  alias 재작성, 기본 `tool_stream`, strict-tool / reasoning-payload
  정리, Plugin 소유 도구를 위한 fallback auth 재사용, forward-compat Grok
  모델 해석, xAI 도구 스키마
  프로필, 지원되지 않는 스키마 키워드, 네이티브 `web_search`, HTML 엔터티
  tool-call 인자 디코딩 같은 provider 소유 compat 패치를 소유하기 때문입니다.
- Mistral, OpenCode Zen, OpenCode Go는
  transcript/tooling 특성을 core 밖에 두기 위해 `capabilities`만 사용합니다.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, `volcengine` 같은
  카탈로그 전용 번들 provider는 `catalog`만 사용합니다.
- Qwen은 텍스트 provider와 멀티모달 표면을 위한 공유 media-understanding 및
  video-generation 등록과 함께 `catalog`를 사용합니다.
- MiniMax와 Xiaomi는 추론은 여전히 공유 transport를 통해 실행되더라도 `/usage`
  동작이 Plugin 소유이기 때문에 usage 훅과 함께 `catalog`를 사용합니다.

## 런타임 헬퍼

Plugin은 `api.runtime`를 통해 선택된 core 헬퍼에 접근할 수 있습니다. TTS의 경우:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

참고:

- `textToSpeech`는 파일/voice-note 표면을 위한 일반 core TTS 출력 페이로드를 반환합니다.
- core `messages.tts` config와 provider 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 레이트를 반환합니다. Plugin은 provider에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 provider별로 선택 사항입니다. vendor 소유 voice picker 또는 setup 흐름에 사용하세요.
- voice 목록은 provider 인식 picker를 위한 locale, gender, personality 태그 같은 더 풍부한 메타데이터를 포함할 수 있습니다.
- 오늘날 전화 통신은 OpenAI와 ElevenLabs를 지원합니다. Microsoft는 지원하지 않습니다.

Plugin은 `api.registerSpeechProvider(...)`를 통해 음성 provider를 등록할 수도 있습니다.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

참고:

- TTS 정책, fallback, 응답 전달은 core에 유지하세요.
- vendor 소유 합성 동작에는 음성 provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider id로 정규화됩니다.
- 선호되는 소유권 모델은 회사 중심입니다. OpenClaw가 이러한
  capability 계약을 추가함에 따라 하나의 vendor Plugin이
  텍스트, 음성, 이미지, 향후 미디어 provider를 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우, Plugin은 일반 key/value bag 대신
하나의 타입 지정된 media-understanding provider를 등록합니다:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

참고:

- orchestration, fallback, config, 채널 wiring은 core에 유지하세요.
- vendor 동작은 provider Plugin에 유지하세요.
- 점진적 확장은 타입이 유지되어야 합니다: 새로운 선택적 메서드, 새로운 선택적
  결과 필드, 새로운 선택적 capability.
- 비디오 생성은 이미 같은 패턴을 따릅니다:
  - core가 capability 계약과 런타임 헬퍼를 소유합니다
  - vendor Plugin이 `api.registerVideoGenerationProvider(...)`를 등록합니다
  - 기능/채널 Plugin은 `api.runtime.videoGeneration.*`을 소비합니다

media-understanding 런타임 헬퍼의 경우, Plugin은 다음을 호출할 수 있습니다:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

오디오 전사의 경우, Plugin은 media-understanding 런타임 또는
이전 STT 별칭 중 하나를 사용할 수 있습니다:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`은
  이미지/오디오/비디오 이해를 위한 권장 공유 표면입니다.
- core media-understanding 오디오 config(`tools.media.audio`)와 provider fallback 순서를 사용합니다.
- 전사 출력이 생성되지 않으면 `{ text: undefined }`를 반환합니다(예: 입력이 건너뛰어졌거나 지원되지 않는 경우).
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 남아 있습니다.

Plugin은 `api.runtime.subagent`를 통해 백그라운드 subagent 실행도 시작할 수 있습니다:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

참고:

- `provider`와 `model`은 영구 세션 변경이 아니라 실행별 선택적 override입니다.
- OpenClaw는 신뢰된 호출자에 대해서만 이러한 override 필드를 허용합니다.
- Plugin 소유 fallback 실행의 경우, 운영자가 `plugins.entries.<id>.subagent.allowModelOverride: true`로 명시적으로 동의해야 합니다.
- 신뢰된 Plugin을 특정 정식 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하고, 모든 대상을 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰되지 않은 Plugin subagent 실행도 여전히 동작하지만, override 요청은 조용히 fallback되는 대신 거부됩니다.

웹 검색의 경우, Plugin은 에이전트 도구 wiring에
직접 손대는 대신 공유 런타임 헬퍼를 소비할 수 있습니다:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin은 다음을 통해 웹 검색 provider도 등록할 수 있습니다
`api.registerWebSearchProvider(...)`.

참고:

- provider 선택, 자격 증명 해석, 공유 요청 의미론은 core에 유지하세요.
- vendor별 검색 transport에는 웹 검색 provider를 사용하세요.
- `api.runtime.webSearch.*`은 검색 동작이 필요하지만 에이전트 도구 wrapper에는 의존하지 않아야 하는 기능/채널 Plugin을 위한 권장 공유 표면입니다.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: 구성된 이미지 생성 provider 체인을 사용해 이미지를 생성합니다.
- `listProviders(...)`: 사용 가능한 이미지 생성 provider와 해당 capability를 나열합니다.

## Gateway HTTP 경로

Plugin은 `api.registerHttpRoute(...)`로 HTTP 엔드포인트를 노출할 수 있습니다.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

경로 필드:

- `path`: Gateway HTTP 서버 아래의 경로 경로.
- `auth`: 필수. 일반 Gateway 인증이 필요하면 `"gateway"`를, Plugin 관리 인증/Webhook 검증이면 `"plugin"`을 사용하세요.
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`.
- `replaceExisting`: 선택 사항. 같은 Plugin이 자신의 기존 경로 등록을 교체할 수 있게 합니다.
- `handler`: 경로가 요청을 처리했으면 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 Plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin 경로는 `auth`를 명시적으로 선언해야 합니다.
- 정확한 `path + match` 충돌은 `replaceExisting: true`가 없는 한 거부되며, 한 Plugin이 다른 Plugin의 경로를 교체할 수는 없습니다.
- `auth` 수준이 다른 겹치는 경로는 거부됩니다. `exact`/`prefix` fallback 체인은 같은 auth 수준 내에서만 유지하세요.
- `auth: "plugin"` 경로는 자동으로 operator 런타임 scope를 받지 않습니다. 이는 권한 있는 Gateway 헬퍼 호출이 아니라 Plugin 관리 Webhook/서명 검증용입니다.
- `auth: "gateway"` 경로는 Gateway 요청 런타임 scope 안에서 실행되지만, 그 scope는 의도적으로 보수적입니다:
  - 공유 secret bearer 인증(`gateway.auth.mode = "token"` / `"password"`)은 호출자가 `x-openclaw-scopes`를 보내더라도 Plugin 경로 런타임 scope를 `operator.write`에 고정합니다
  - 신뢰된 ID 기반 HTTP 모드(예: `trusted-proxy` 또는 private ingress에서의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 존재할 때만 `x-openclaw-scopes`를 존중합니다
  - 이러한 ID 기반 Plugin 경로 요청에 `x-openclaw-scopes`가 없으면, 런타임 scope는 `operator.write`로 fallback합니다
- 실용 규칙: Gateway 인증 Plugin 경로가 암묵적인 관리자 표면이라고 가정하지 마세요. 경로에 관리자 전용 동작이 필요하면, ID 기반 auth 모드를 요구하고 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK import 경로

Plugin을 작성할 때는 거대한 `openclaw/plugin-sdk` import 대신
SDK 하위 경로를 사용하세요:

- Plugin 등록 기본 요소에는 `openclaw/plugin-sdk/plugin-entry`.
- 일반 공유 Plugin 대상 계약에는 `openclaw/plugin-sdk/core`.
- 루트 `openclaw.json` Zod schema
  export(`OpenClawSchema`)에는 `openclaw/plugin-sdk/config-schema`.
- `openclaw/plugin-sdk/channel-setup` 같은 안정적인 채널 기본 요소,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input`, 그리고
  공유 setup/auth/reply/Webhook
  wiring에는 `openclaw/plugin-sdk/webhook-ingress`.
  `channel-inbound`는 debounce, 멘션 매칭,
  인바운드 mention-policy 헬퍼, envelope 포맷팅, 인바운드 envelope
  컨텍스트 헬퍼를 위한 공유 위치입니다.
  `channel-setup`은 좁은 선택적 install setup seam입니다.
  `setup-runtime`은 `setupEntry` /
  지연 시작에 사용되는 런타임 안전 setup 표면이며, import 안전 setup patch adapter를 포함합니다.
  `setup-adapter-runtime`은 env 인식 account-setup adapter seam입니다.
  `setup-tools`는 작은 CLI/archive/docs 헬퍼 seam(`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`)입니다.
- `openclaw/plugin-sdk/channel-config-helpers` 같은 도메인 하위 경로,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store`, 그리고
  공유 런타임/config 헬퍼에는 `openclaw/plugin-sdk/directory-runtime`.
  `telegram-command-config`는 Telegram 커스텀
  명령 정규화/검증을 위한 좁은 공개 seam이며, 번들 Telegram 계약 표면을 일시적으로 사용할 수 없더라도 계속 제공됩니다.
  `text-runtime`은
  assistant-visible-text 제거, markdown 렌더링/청킹 헬퍼, 마스킹
  헬퍼, directive-tag 헬퍼, safe-text 유틸리티를 포함한 공유 텍스트/markdown/로깅 seam입니다.
- 승인 전용 채널 seam은 Plugin의 하나의 `approvalCapability`
  계약을 우선 사용해야 합니다. 그러면 core는 관련 없는 Plugin 필드에 승인 동작을 섞는 대신
  그 하나의 capability를 통해 승인 auth, 전달, 렌더링,
  네이티브 라우팅, 지연 네이티브 핸들러 동작을 읽습니다.
- `openclaw/plugin-sdk/channel-runtime`은 deprecated 상태이며, 오래된 Plugin을 위한
  호환성 shim으로만 남아 있습니다. 새 코드는 대신 더 좁은
  일반 기본 요소를 import해야 하며, repo 코드도 shim의 새 import를 추가해서는 안 됩니다.
- 번들 extension 내부 구현은 비공개로 유지됩니다. 외부 Plugin은 오직
  `openclaw/plugin-sdk/*` 하위 경로만 사용해야 합니다. OpenClaw core/test 코드는
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, 그리고
  `login-qr-api.js` 같은 좁은 범위 파일 등 Plugin 패키지 루트 아래의 repo
  공개 진입점을 사용할 수 있습니다. core나 다른 extension에서 Plugin 패키지의 `src/*`는 절대 import하지 마세요.
- Repo 진입점 분리:
  `<plugin-package-root>/api.js`는 헬퍼/타입 barrel,
  `<plugin-package-root>/runtime-api.js`는 런타임 전용 barrel,
  `<plugin-package-root>/index.js`는 번들 Plugin 진입점,
  `<plugin-package-root>/setup-entry.js`는 setup Plugin 진입점입니다.
- 현재 번들 provider 예시:
  - Anthropic은 `wrapAnthropicProviderStream`, 베타 헤더 헬퍼,
    `service_tier` 파싱 같은 Claude stream 헬퍼에 `api.js` / `contract-api.js`를 사용합니다.
  - OpenAI는 provider builder, 기본 모델 헬퍼,
    실시간 provider builder에 `api.js`를 사용합니다.
  - OpenRouter는 provider builder와 onboarding/config
    헬퍼에 `api.js`를 사용하며, `register.runtime.js`는 repo 로컬 사용을 위해 여전히 일반
    `plugin-sdk/provider-stream` 헬퍼를 다시 export할 수 있습니다.
- facade 로드 공개 진입점은 활성 런타임 config 스냅샷이 있으면 이를 우선 사용하고, OpenClaw가 아직 런타임 스냅샷을 제공하지 않을 때는 디스크의 해석된 config 파일로 fallback합니다.
- 일반 공유 기본 요소는 여전히 선호되는 공개 SDK 계약입니다. 번들 채널 브랜드가 붙은 소수의 예약된 호환성 헬퍼 seam은 여전히 존재합니다. 이를 새
  서드파티 import 대상이 아니라 번들 유지보수/호환성 seam으로 취급하세요. 새 교차 채널 계약은 여전히
  일반 `plugin-sdk/*` 하위 경로 또는 Plugin 로컬 `api.js` /
  `runtime-api.js` barrel에 추가되어야 합니다.

호환성 메모:

- 새 코드에서는 루트 `openclaw/plugin-sdk` barrel을 피하세요.
- 먼저 좁고 안정적인 기본 요소를 우선하세요. 더 새로운 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool 하위 경로가 새
  번들 및 외부 Plugin 작업을 위한 의도된 계약입니다.
  대상 파싱/매칭은 `openclaw/plugin-sdk/channel-targets`에 속합니다.
  메시지 action 게이트와 반응 message-id 헬퍼는
  `openclaw/plugin-sdk/channel-actions`에 속합니다.
- 번들 extension 전용 헬퍼 barrel은 기본적으로 안정적이지 않습니다. 어떤
  헬퍼가 번들 extension에만 필요하다면, 이를
  `openclaw/plugin-sdk/<extension>`로 승격하는 대신 extension의 로컬 `api.js` 또는 `runtime-api.js`
  seam 뒤에 유지하세요.
- 새 공유 헬퍼 seam은 채널 브랜드가 아니라 범용이어야 합니다. 공유 대상
  파싱은 `openclaw/plugin-sdk/channel-targets`에 속하고, 채널별
  내부 구현은 소유 Plugin의 로컬 `api.js` 또는 `runtime-api.js`
  seam 뒤에 유지됩니다.
- `image-generation`,
  `media-understanding`, `speech` 같은 capability 전용 하위 경로는 오늘날 번들/네이티브 Plugin이
  이를 사용하기 때문에 존재합니다. 이들이 존재한다고 해서
  export된 모든 헬퍼가 장기적으로 고정된 외부 계약이라는 뜻은 아닙니다.

## message 도구 스키마

Plugin은 채널별 `describeMessageTool(...)` 스키마
기여를 소유해야 합니다. provider별 필드는 공유 core가 아니라 Plugin에 두세요.

공유 가능한 이식형 스키마 fragment에는
`openclaw/plugin-sdk/channel-actions`를 통해 export된 범용 헬퍼를 재사용하세요:

- 버튼 그리드 스타일 페이로드에는 `createMessageToolButtonsSchema()`
- 구조화된 카드 페이로드에는 `createMessageToolCardSchema()`

스키마 형태가 한 provider에만 의미가 있다면,
공유 SDK로 승격하지 말고 해당 Plugin 소스 내부에 정의하세요.

## 채널 대상 해석

채널 Plugin은 채널별 대상 의미론을 소유해야 합니다. 공유
아웃바운드 호스트는 범용으로 유지하고 provider 규칙에는 메시징 adapter 표면을 사용하세요:

- `messaging.inferTargetChatType({ to })`는 정규화된 대상을 디렉터리 조회 전에
  `direct`, `group`, `channel` 중 무엇으로 취급해야 하는지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 입력이
  디렉터리 검색 대신 바로 id 유사 해석으로 가야 하는지 core에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`는 정규화 후 또는
  디렉터리 미스 후 core에 최종 provider 소유 해석이 필요할 때의 Plugin fallback입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 해석된 뒤 provider별 session
  경로 구성을 소유합니다.

권장 분리:

- peer/group 검색 전에 이루어져야 하는 범주 결정에는 `inferTargetChatType`를 사용하세요.
- "이것을 명시적/네이티브 대상 id로 취급" 검사에는 `looksLikeId`를 사용하세요.
- 광범위한 디렉터리 검색이 아니라 provider별 정규화 fallback에는 `resolveTarget`을 사용하세요.
- chat id, thread id, JID, handle, room
  id 같은 provider 네이티브 id는 범용 SDK 필드가 아니라 `target` 값이나 provider별 파라미터 안에 두세요.

## config 기반 디렉터리

config에서 디렉터리 항목을 도출하는 Plugin은 그 로직을
Plugin 안에 두고
`openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

채널에 다음 같은 config 기반 peer/group이 필요할 때 이를 사용하세요:

- allowlist 기반 DM peer
- 구성된 채널/그룹 맵
- account 범위의 정적 디렉터리 fallback

`directory-runtime`의 공유 헬퍼는 범용 작업만 처리합니다:

- 쿼리 필터링
- limit 적용
- dedupe/정규화 헬퍼
- `ChannelDirectoryEntry[]` 구성

채널별 account 검사와 id 정규화는
Plugin 구현에 남아 있어야 합니다.

## provider 카탈로그

provider Plugin은
`registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가
`models.providers`에 쓰는 것과 같은 형태를 반환합니다:

- 하나의 provider 항목에는 `{ provider }`
- 여러 provider 항목에는 `{ providers }`

Plugin이 provider별 model id, 기본 base URL,
또는 auth로 제한되는 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 Plugin의 카탈로그가 OpenClaw의
내장 암시적 provider에 비해 언제 병합되는지 제어합니다:

- `simple`: 일반 API 키 또는 env 기반 provider
- `profile`: auth profile이 있을 때 나타나는 provider
- `paired`: 여러 관련 provider 항목을 합성하는 provider
- `late`: 다른 암시적 provider 이후 마지막 단계

나중 provider가 키 충돌에서 우선하므로, Plugin은 같은 provider id를 가진
내장 provider 항목을 의도적으로 override할 수 있습니다.

호환성:

- `discovery`는 여전히 레거시 별칭으로 동작합니다
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용합니다

## 읽기 전용 채널 검사

Plugin이 채널을 등록한다면,
`resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)` 구현을 우선하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이
  완전히 구체화되었다고 가정할 수 있고 필요한 secret이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름 같은 읽기 전용 명령 경로는 구성을 설명하기 위해
  런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명용 account 상태만 반환합니다.
- `enabled`와 `configured`를 유지합니다.
- 관련될 경우 자격 증명 소스/상태 필드를 포함합니다. 예:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다.
  상태 스타일 명령에는 `tokenStatus: "available"`(및 일치하는 소스 필드)만으로 충분합니다.
- 자격 증명이 SecretRef로 구성되었지만 현재 명령 경로에서는 사용할 수 없으면 `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 충돌하거나 account를 구성되지 않은 것으로 잘못 보고하는 대신
"구성되었지만 이 명령 경로에서는 사용할 수 없음"을 보고할 수 있습니다.

## 패키지 팩

Plugin 디렉터리에는 `openclaw.extensions`가 있는 `package.json`이 포함될 수 있습니다:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 Plugin이 됩니다. 팩이 여러 extension을 나열하면 Plugin id는
`name/<fileBase>`가 됩니다.

Plugin이 npm 의존성을 import한다면,
`node_modules`를 사용할 수 있도록 해당 디렉터리에서 이를 설치하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 심볼릭 링크 해석 후에도
Plugin 디렉터리 내부에 있어야 합니다. 패키지 디렉터리를 벗어나는 항목은
거부됩니다.

보안 메모: `openclaw plugins install`은
`npm install --omit=dev --ignore-scripts`로 Plugin 의존성을 설치합니다(라이프사이클 스크립트 없음, 런타임에 dev 의존성 없음). Plugin 의존성
트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 채널 Plugin의 setup 표면이 필요하거나,
채널 Plugin이 활성화되었지만 아직 구성되지 않은 경우,
전체 Plugin 진입점 대신 `setupEntry`를 로드합니다. 이렇게 하면 메인 Plugin 진입점이 도구, 훅 또는 다른 런타임 전용
코드도 연결하는 경우 시작과 setup을 더 가볍게 유지할 수 있습니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은
채널 Plugin이 이미 구성되어 있어도
Gateway의 pre-listen 시작 단계에서 같은 `setupEntry` 경로를 사용하도록 선택할 수 있게 합니다.

이것은 `setupEntry`가 Gateway가 수신을 시작하기 전에
존재해야 하는 시작 표면을 완전히 덮을 때만 사용하세요. 실제로는
setup entry가 시작이 의존하는 모든 채널 소유 capability를 등록해야 한다는 뜻입니다. 예:

- 채널 등록 자체
- Gateway가 수신을 시작하기 전에 사용 가능해야 하는 모든 HTTP 경로
- 같은 창에서 존재해야 하는 모든 Gateway 메서드, 도구 또는 서비스

전체 진입점이 여전히 필수 시작 capability를 소유한다면 이 플래그를 활성화하지 마세요.
기본 동작을 유지하고 OpenClaw가 시작 중 전체 진입점을 로드하게 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 core가 참조할 수 있는
setup 전용 계약 표면 헬퍼도 게시할 수 있습니다. 현재 setup
승격 표면은 다음과 같습니다:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core는 레거시 단일 account 채널
config를 전체 Plugin 진입점을 로드하지 않고 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다.
현재 번들 예시는 Matrix입니다. Matrix는 이름 지정 account가 이미 존재할 때 auth/bootstrap 키만
이름이 지정된 승격 account로 옮기며, 항상
`accounts.default`를 만드는 대신 구성된 비정규 기본 account 키를 보존할 수 있습니다.

이러한 setup patch adapter는 번들 계약 표면 디스커버리를 지연 상태로 유지합니다.
import 시점은 가볍게 유지되고, 승격 표면은 모듈 import 중 번들 채널 시작에 다시 진입하는 대신 첫 사용 시에만 로드됩니다.

이러한 시작 표면에 Gateway RPC 메서드가 포함된다면, 이를
Plugin 전용 접두사에 두세요. core 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며, Plugin이 더 좁은 scope를 요청하더라도 항상
`operator.admin`으로 해석됩니다.

예시:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### 채널 카탈로그 메타데이터

채널 Plugin은 `openclaw.channel`을 통해 setup/discovery 메타데이터를,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 core 카탈로그가 데이터 비의존적으로 유지됩니다.

예시:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Nextcloud Talk Webhook 봇을 통한 셀프 호스팅 채팅.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

최소 예시 외에 유용한 `openclaw.channel` 필드:

- `detailLabel`: 더 풍부한 카탈로그/상태 표면을 위한 보조 레이블
- `docsLabel`: 문서 링크용 링크 텍스트 override
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 더 낮은 우선순위의 Plugin/채널 id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 복사 제어
- `markdownCapable`: 아웃바운드 포맷 결정용으로 채널이 markdown 가능함을 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 setup/configure picker에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭; `exposure`를 우선하세요
- `quickstartAllowFrom`: 표준 빠른 시작 `allowFrom` 흐름에 채널을 옵트인
- `forceAccountBinding`: account가 하나뿐이어도 명시적 account 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: 공지 대상 해석 시 session 조회 우선

OpenClaw는 **외부 채널 카탈로그**도 병합할 수 있습니다(예: MPM
레지스트리 export). 다음 위치 중 하나에 JSON 파일을 두세요:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를
하나 이상의 JSON 파일로 지정하세요(쉼표/세미콜론/`PATH` 구분). 각 파일은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를 포함해야 합니다. 파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

## 컨텍스트 엔진 Plugin

컨텍스트 엔진 Plugin은 수집, 조립,
Compaction을 위한 세션 컨텍스트 orchestration을 소유합니다. Plugin에서
`api.registerContextEngine(id, factory)`로 등록한 다음, 활성 엔진은
`plugins.slots.contextEngine`으로 선택하세요.

이것은 Plugin이 메모리 검색이나 훅만 추가하는 것이 아니라
기본 컨텍스트 파이프라인을 교체하거나 확장해야 할 때 사용합니다.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

엔진이 Compaction 알고리즘을 **소유하지 않는다면**, `compact()`를
구현한 채로 두고 이를 명시적으로 위임하세요:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 새 capability 추가

Plugin에 현재 API에 맞지 않는 동작이 필요할 때는,
비공개 직접 접근으로 Plugin 시스템을 우회하지 마세요. 누락된 capability를 추가하세요.

권장 순서:

1. core 계약 정의
   core가 소유해야 하는 공유 동작을 결정합니다: 정책, fallback, config 병합,
   lifecycle, 채널 대상 의미론, 런타임 헬퍼 형태.
2. 타입이 지정된 Plugin 등록/런타임 표면 추가
   `OpenClawPluginApi` 및/또는 `api.runtime`를 가장 작지만 유용한
   타입 지정 capability 표면으로 확장합니다.
3. core + 채널/기능 소비자 연결
   채널과 기능 Plugin은 vendor 구현을 직접 import하는 대신
   core를 통해 새 capability를 소비해야 합니다.
4. vendor 구현 등록
   그런 다음 vendor Plugin이 이 capability에 대해 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 하나의
provider 세계관에 하드코딩되지 않으면서도 명확한 방향성을 유지하는 방식입니다. 구체적인 파일 체크리스트와 예시는
[Capability Cookbook](/ko/plugins/architecture)를 참고하세요.

### capability 체크리스트

새 capability를 추가할 때 구현은 일반적으로 다음
표면을 함께 건드려야 합니다:

- `src/<capability>/types.ts`의 core 계약 타입
- `src/<capability>/runtime.ts`의 core runner/런타임 헬퍼
- `src/plugins/types.ts`의 Plugin API 등록 표면
- `src/plugins/registry.ts`의 Plugin 레지스트리 wiring
- 기능/채널 Plugin이 이를 소비해야 할 때 `src/plugins/runtime/*`의 Plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 capture/test 헬퍼
- `src/plugins/contracts/registry.ts`의 소유권/계약 assertion
- `docs/`의 운영자/Plugin 문서

이들 표면 중 하나가 빠져 있다면, 이는 대개 capability가
아직 완전히 통합되지 않았다는 신호입니다.

### capability 템플릿

최소 패턴:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

계약 테스트 패턴:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순해집니다:

- core가 capability 계약 + orchestration을 소유합니다
- vendor Plugin이 vendor 구현을 소유합니다
- 기능/채널 Plugin이 런타임 헬퍼를 소비합니다
- 계약 테스트가 소유권을 명시적으로 유지합니다
