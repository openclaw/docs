---
read_when:
    - 네이티브 OpenClaw Plugin을 빌드하거나 디버깅하기
    - Plugin capability 모델 또는 소유권 경계를 이해하기
    - Plugin 로드 파이프라인 또는 레지스트리 작업하기
    - provider 런타임 Hook 또는 채널 Plugin 구현하기
sidebarTitle: Internals
summary: 'Plugin 내부: capability 모델, 소유권, 계약, 로드 파이프라인 및 런타임 헬퍼'
title: Plugin 내부
x-i18n:
    generated_at: "2026-04-12T23:28:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37361c1e9d2da57c77358396f19dfc7f749708b66ff68f1bf737d051b5d7675d
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin 내부

<Info>
  이 페이지는 **심층 아키텍처 참조**입니다. 실용적인 가이드는 다음을 참고하세요:
  - [플러그인 설치 및 사용](/ko/tools/plugin) — 사용자 가이드
  - [시작하기](/ko/plugins/building-plugins) — 첫 번째 Plugin 튜토리얼
  - [채널 Plugin](/ko/plugins/sdk-channel-plugins) — 메시징 채널 빌드하기
  - [Provider Plugin](/ko/plugins/sdk-provider-plugins) — 모델 provider 빌드하기
  - [SDK 개요](/ko/plugins/sdk-overview) — import 맵 및 등록 API
</Info>

이 페이지에서는 OpenClaw Plugin 시스템의 내부 아키텍처를 다룹니다.

## 공개 capability 모델

capability는 OpenClaw 내부의 공개 **네이티브 Plugin** 모델입니다. 모든
네이티브 OpenClaw Plugin은 하나 이상의 capability 유형에 대해 등록합니다:

| Capability             | 등록 방법                                        | 예시 Plugin                          |
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
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | `google`                             |
| 채널 / 메시징          | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

capability를 하나도 등록하지 않지만 Hook, 도구 또는
서비스를 제공하는 Plugin은 **레거시 hook-only** Plugin입니다. 이 패턴도 여전히 완전히 지원됩니다.

### 외부 호환성 방침

capability 모델은 이미 코어에 적용되었고 오늘날 번들/네이티브 Plugin에서
사용되고 있지만, 외부 Plugin 호환성에는 여전히 "내보내졌으니 고정되었다"보다
더 엄격한 기준이 필요합니다.

현재 지침:

- **기존 외부 Plugin:** Hook 기반 통합이 계속 동작하도록 유지하고,
  이를 호환성 기준선으로 취급합니다
- **새 번들/네이티브 Plugin:** vendor별 직접 접근이나 새로운 hook-only 설계보다
  명시적인 capability 등록을 우선합니다
- **capability 등록을 도입하는 외부 Plugin:** 허용되지만, 문서에서 계약이 안정적이라고
  명시하지 않는 한 capability별 헬퍼 표면은 진화 중인 것으로 취급합니다

실용적인 규칙:

- capability 등록 API가 의도된 방향입니다
- 전환 기간 동안 외부 Plugin에 가장 안전하고 비파괴적인 경로는 레거시 Hook입니다
- 내보내진 헬퍼 하위 경로가 모두 동일한 것은 아닙니다. 우발적으로 노출된 헬퍼 export가 아니라
  문서화된 좁은 계약을 우선하세요

### Plugin 형태

OpenClaw는 로드된 모든 Plugin을 정적 메타데이터가 아니라 실제 등록 동작에 따라
형태로 분류합니다:

- **plain-capability** -- 정확히 하나의 capability 유형만 등록합니다(예:
  `mistral`과 같은 provider 전용 Plugin)
- **hybrid-capability** -- 여러 capability 유형을 등록합니다(예:
  `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 담당합니다)
- **hook-only** -- Hook만 등록하며(typed 또는 custom), capability,
  도구, 명령 또는 서비스는 등록하지 않습니다
- **non-capability** -- capability 없이 도구, 명령, 서비스 또는 라우트를 등록합니다

`openclaw plugins inspect <id>`를 사용하면 Plugin의 형태와 capability
구성을 확인할 수 있습니다. 자세한 내용은 [CLI 참조](/cli/plugins#inspect)를 참고하세요.

### 레거시 Hook

`before_agent_start` Hook은 hook-only Plugin을 위한 호환성 경로로 계속 지원됩니다.
실제 레거시 Plugin들이 여전히 여기에 의존합니다.

방향성:

- 계속 동작하게 유지합니다
- 레거시로 문서화합니다
- 모델/provider 재정의 작업에는 `before_model_resolve`를 우선합니다
- 프롬프트 변형 작업에는 `before_prompt_build`를 우선합니다
- 실제 사용이 줄고 fixture 커버리지가 마이그레이션 안전성을 입증한 후에만 제거합니다

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나가 표시될 수 있습니다:

| Signal                     | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | config가 정상적으로 파싱되고 Plugin이 확인됨                 |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴(예: `hook-only`)을 사용함    |
| **legacy warning**         | Plugin이 더 이상 권장되지 않는 `before_agent_start`를 사용함 |
| **hard error**             | config가 잘못되었거나 Plugin 로드에 실패함                   |

`hook-only`와 `before_agent_start` 모두 현재 Plugin을 깨뜨리지는 않습니다 --
`hook-only`는 권고 사항이며, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 나타납니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 개의 계층으로 구성됩니다:

1. **manifest + discovery**
   OpenClaw는 구성된 경로, 워크스페이스 루트,
   전역 확장 루트 및 번들 확장에서 후보 Plugin을 찾습니다. discovery는
   먼저 네이티브 `openclaw.plugin.json` manifest와 지원되는 번들 manifest를 읽습니다.
2. **활성화 + 검증**
   코어는 발견된 Plugin이 활성화, 비활성화, 차단 또는
   메모리와 같은 독점 슬롯에 선택되었는지를 결정합니다.
3. **런타임 로딩**
   네이티브 OpenClaw Plugin은 jiti를 통해 프로세스 내에서 로드되며
   capability를 중앙 레지스트리에 등록합니다. 호환되는 번들은 런타임 코드를 import하지 않고도
   레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 도구, 채널, provider
   설정, Hook, HTTP 라우트, CLI 명령 및 서비스를 노출합니다.

특히 Plugin CLI의 경우, 루트 명령 discovery는 두 단계로 나뉩니다:

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 가져옵니다
- 실제 Plugin CLI 모듈은 지연 로드 상태를 유지하고 첫 호출 시 등록될 수 있습니다

이렇게 하면 OpenClaw가 파싱 전에 루트 명령 이름을 예약하면서도
Plugin 소유 CLI 코드를 Plugin 내부에 유지할 수 있습니다.

중요한 설계 경계:

- discovery + config 검증은 Plugin 코드를 실행하지 않고도 **manifest/schema metadata**로부터
  동작해야 합니다
- 네이티브 런타임 동작은 Plugin 모듈의 `register(api)` 경로에서 나옵니다

이 분리는 OpenClaw가 전체 런타임이 활성화되기 전에
config를 검증하고, 누락/비활성화된 Plugin을 설명하고, UI/schema 힌트를
구축할 수 있게 해줍니다.

### 채널 Plugin과 공유 message 도구

채널 Plugin은 일반적인 채팅 작업을 위해 별도의 send/edit/react 도구를
등록할 필요가 없습니다. OpenClaw는 코어에 하나의 공유 `message` 도구를 유지하고,
채널 Plugin은 그 뒤에서 채널별 discovery와 실행을 담당합니다.

현재 경계는 다음과 같습니다:

- 코어는 공유 `message` 도구 호스트, 프롬프트 연결, 세션/스레드
  bookkeeping 및 실행 dispatch를 담당합니다
- 채널 Plugin은 범위가 지정된 작업 discovery, capability discovery 및
  채널별 스키마 조각을 담당합니다
- 채널 Plugin은 conversation id가 thread id를 인코딩하거나
  부모 conversation에서 상속하는 방식과 같은 provider별 세션 대화 문법을 담당합니다
- 채널 Plugin은 action adapter를 통해 최종 작업을 실행합니다

채널 Plugin의 경우 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 discovery
호출을 통해 Plugin은 표시되는 작업, capability 및 스키마 기여를 함께 반환할 수 있으므로
이 요소들이 서로 어긋나지 않습니다.

코어는 런타임 scope를 이 discovery 단계에 전달합니다. 중요한 필드는 다음과 같습니다:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 수신 `requesterSenderId`

이는 컨텍스트 민감형 Plugin에서 중요합니다. 채널은 코어 `message` 도구에
채널별 분기를 하드코딩하지 않고도, 활성 계정, 현재 방/스레드/메시지 또는
신뢰된 요청자 신원에 따라 메시지 작업을 숨기거나 노출할 수 있습니다.

이 때문에 임베디드 러너 라우팅 변경도 여전히 Plugin 작업입니다. 러너는
현재 턴에 맞는 채널 소유 표면이 공유 `message` 도구에 노출되도록
현재 채팅/세션 신원을 Plugin discovery 경계로 전달해야 합니다.

채널 소유 실행 헬퍼의 경우, 번들 Plugin은 실행
런타임을 자체 확장 모듈 내부에 유지해야 합니다. 코어는 더 이상
`src/agents/tools` 아래의 Discord, Slack, Telegram 또는 WhatsApp 메시지 작업 런타임을 소유하지 않습니다.
별도의 `plugin-sdk/*-action-runtime` 하위 경로도 공개하지 않으며, 번들
Plugin은 자체 확장 소유 모듈에서 로컬 런타임 코드를 직접 import해야 합니다.

동일한 경계는 일반적인 provider 명명 SDK 경계에도 적용됩니다. 코어는
Slack, Discord, Signal, WhatsApp 또는 유사한 확장을 위한 채널별 편의 배럴을
import해서는 안 됩니다. 코어에 동작이 필요하다면, 번들 Plugin의 자체
`api.ts` / `runtime-api.ts` 배럴을 사용하거나 필요 사항을 공유 SDK의
좁은 범용 capability로 승격해야 합니다.

특히 poll의 경우 두 가지 실행 경로가 있습니다:

- `outbound.sendPoll`은 공통 poll 모델에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 poll 시맨틱 또는
  추가 poll 매개변수에 권장되는 경로입니다

이제 코어는 Plugin poll dispatch가 해당 작업을 거절한 뒤에야 공유 poll 파싱을 수행하므로,
Plugin 소유 poll 핸들러는 먼저 범용 poll 파서에 가로막히지 않고도
채널별 poll 필드를 받아들일 수 있습니다.

전체 시작 순서는 [로드 파이프라인](#load-pipeline)을 참고하세요.

## capability 소유권 모델

OpenClaw는 네이티브 Plugin을 관련 없는 통합의 모음이 아니라 **회사** 또는 **기능**에 대한
소유권 경계로 취급합니다.

즉, 다음을 의미합니다:

- 회사 Plugin은 일반적으로 해당 회사의 OpenClaw 노출 표면 전체를 소유해야 합니다
- 기능 Plugin은 일반적으로 자신이 도입하는 기능 표면 전체를 소유해야 합니다
- 채널은 provider 동작을 임시방편으로 다시 구현하는 대신 공유 코어 capability를 소비해야 합니다

예시:

- 번들 `openai` Plugin은 OpenAI 모델 provider 동작과 OpenAI
  음성 + 실시간 음성 + 미디어 이해 + 이미지 생성 동작을 소유합니다
- 번들 `elevenlabs` Plugin은 ElevenLabs 음성 동작을 소유합니다
- 번들 `microsoft` Plugin은 Microsoft 음성 동작을 소유합니다
- 번들 `google` Plugin은 Google 모델 provider 동작과 함께 Google
  미디어 이해 + 이미지 생성 + 웹 검색 동작을 소유합니다
- 번들 `firecrawl` Plugin은 Firecrawl 웹 가져오기 동작을 소유합니다
- 번들 `minimax`, `mistral`, `moonshot`, `zai` Plugin은 해당
  미디어 이해 백엔드를 소유합니다
- 번들 `qwen` Plugin은 Qwen 텍스트 provider 동작과 함께
  미디어 이해 및 비디오 생성 동작을 소유합니다
- `voice-call` Plugin은 기능 Plugin입니다. 이 Plugin은 통화 전송, 도구,
  CLI, 라우트 및 Twilio 미디어 스트림 브리징을 소유하지만, vendor Plugin을 직접 import하는 대신
  공유 음성과 실시간 전사 및 실시간 음성 capability를 소비합니다

의도된 최종 상태는 다음과 같습니다:

- OpenAI는 텍스트 모델, 음성, 이미지, 그리고
  향후 비디오까지 아우르더라도 하나의 Plugin 안에 존재합니다
- 다른 vendor도 자신의 표면 영역에 대해 동일하게 할 수 있습니다
- 채널은 어떤 vendor Plugin이 provider를 소유하는지 신경 쓰지 않으며, 코어가 노출하는
  공유 capability 계약을 소비합니다

이것이 핵심적인 구분입니다:

- **plugin** = 소유권 경계
- **capability** = 여러 Plugin이 구현하거나 소비할 수 있는 코어 계약

따라서 OpenClaw가 비디오와 같은 새 도메인을 추가할 때, 첫 질문은
"어떤 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 질문은 "코어 비디오
capability 계약은 무엇인가?"입니다. 그 계약이 존재하면, vendor Plugin은 여기에
등록할 수 있고 채널/기능 Plugin은 이를 소비할 수 있습니다.

capability가 아직 존재하지 않는다면, 일반적으로 올바른 방식은 다음과 같습니다:

1. 코어에서 누락된 capability를 정의합니다
2. 이를 typed 방식으로 plugin API/런타임을 통해 노출합니다
3. 채널/기능을 그 capability에 맞게 연결합니다
4. vendor Plugin이 구현을 등록하도록 합니다

이렇게 하면 소유권을 명시적으로 유지하면서도 특정
vendor 또는 일회성 Plugin별 코드 경로에 의존하는 코어 동작을 피할 수 있습니다.

### Capability 계층화

코드가 어디에 속해야 하는지 결정할 때 다음 사고 모델을 사용하세요:

- **코어 capability 계층**: 공유 orchestration, 정책, fallback, config
  병합 규칙, 전달 시맨틱 및 typed 계약
- **vendor Plugin 계층**: vendor별 API, auth, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
- **채널/기능 Plugin 계층**: 코어 capability를 소비하고 이를 표면에 제공하는
  Slack/Discord/voice-call 등의 통합

예를 들어 TTS는 다음 형태를 따릅니다:

- 코어는 응답 시점의 TTS 정책, fallback 순서, prefs 및 채널 전달을 소유합니다
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유합니다
- `voice-call`은 전화 TTS 런타임 헬퍼를 소비합니다

향후 capability에도 동일한 패턴을 우선 적용해야 합니다.

### 다중 capability 회사 Plugin 예시

회사 Plugin은 외부에서 볼 때 응집력 있게 느껴져야 합니다. OpenClaw에
모델, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색을 위한
공유 계약이 있다면, vendor는 자신의 모든 표면을 한곳에서 소유할 수 있습니다:

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
- 코어는 여전히 capability 계약을 소유합니다
- 채널과 기능 Plugin은 vendor 코드가 아니라 `api.runtime.*` 헬퍼를 소비합니다
- 계약 테스트는 Plugin이 자신이 소유한다고 주장하는 capability를
  등록했는지 검증할 수 있습니다

### Capability 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유
capability로 취급합니다. 여기에도 동일한 소유권 모델이 적용됩니다:

1. 코어가 media-understanding 계약을 정의합니다
2. vendor Plugin은 해당되는 경우 `describeImage`, `transcribeAudio`, 및
   `describeVideo`를 등록합니다
3. 채널과 기능 Plugin은 vendor 코드에 직접 연결하는 대신 공유 코어 동작을 소비합니다

이렇게 하면 특정 provider의 비디오 가정을 코어에 굳혀 넣는 일을 피할 수 있습니다. Plugin은
vendor 표면을 소유하고, 코어는 capability 계약과 fallback 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. 코어가 typed
capability 계약과 런타임 헬퍼를 소유하고, vendor Plugin은
`api.registerVideoGenerationProvider(...)` 구현을 여기에 등록합니다.

구체적인 출시 체크리스트가 필요하신가요? [Capability Cookbook](/ko/plugins/architecture)을
참고하세요.

## 계약과 강제 적용

Plugin API 표면은 의도적으로
`OpenClawPluginApi`에 타입화되고 중앙화되어 있습니다. 이 계약은 지원되는 등록 지점과
Plugin이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유:

- Plugin 작성자는 하나의 안정적인 내부 표준을 얻습니다
- 코어는 두 Plugin이 같은 provider id를 등록하는 것과 같은 중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있습니다
- 계약 테스트는 번들 Plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다

강제 적용에는 두 계층이 있습니다:

1. **런타임 등록 강제 적용**
   Plugin 레지스트리는 Plugin이 로드될 때 등록을 검증합니다. 예:
   중복 provider id, 중복 speech provider id, 잘못된
   등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 Plugin은 테스트 실행 중 계약 레지스트리에 캡처되어
   OpenClaw가 소유권을 명시적으로 검증할 수 있게 합니다. 현재는 모델
   provider, speech provider, web search provider 및 번들 등록
   소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤
표면을 소유하는지 미리 알고 있다는 점입니다. 이렇게 하면 소유권이 암묵적이지 않고
선언되고, 타입화되며, 테스트 가능하기 때문에 코어와 채널이 원활하게 조합될 수 있습니다.

### 계약에 포함되어야 하는 것

좋은 Plugin 계약은 다음과 같습니다:

- 타입화되어 있음
- 작음
- capability별로 구체적임
- 코어가 소유함
- 여러 Plugin에서 재사용 가능함
- vendor 지식 없이 채널/기능에서 소비 가능함

나쁜 Plugin 계약은 다음과 같습니다:

- 코어에 숨겨진 vendor별 정책
- 레지스트리를 우회하는 일회성 Plugin 탈출구
- vendor 구현에 직접 접근하는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

확실하지 않다면 추상화 수준을 높이세요. 먼저 capability를 정의한 다음,
Plugin이 여기에 연결되도록 하세요.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 **동일 프로세스 내에서** 실행됩니다. 이들은
샌드박스되지 않습니다. 로드된 네이티브 Plugin은 코어 코드와 동일한 프로세스 수준
신뢰 경계를 가집니다.

의미하는 바:

- 네이티브 Plugin은 도구, 네트워크 핸들러, Hook 및 서비스를 등록할 수 있습니다
- 네이티브 Plugin 버그는 Gateway를 크래시시키거나 불안정하게 만들 수 있습니다
- 악의적인 네이티브 Plugin은 OpenClaw 프로세스 내부에서의 임의 코드 실행과 동일합니다

호환되는 번들은 OpenClaw가 현재 이를
메타데이터/콘텐츠 팩으로 취급하기 때문에 기본적으로 더 안전합니다. 현재 릴리스에서는 이는 주로 번들
Skills를 의미합니다.

번들이 아닌 Plugin에는 허용 목록과 명시적 설치/로드 경로를 사용하세요. 워크스페이스 Plugin은
프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 워크스페이스 패키지 이름의 경우 Plugin id가 npm
이름에 고정되도록 유지하세요: 기본값은 `@openclaw/<id>`이고, 또는 패키지가 의도적으로 더 좁은 Plugin 역할을 노출하는 경우
승인된 typed 접미사인
`-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding`를 사용할 수 있습니다.

중요한 신뢰 참고 사항:

- `plugins.allow`는 소스 출처가 아니라 **plugin id**를 신뢰합니다.
- 번들 Plugin과 동일한 id를 가진 워크스페이스 Plugin은 해당 워크스페이스 Plugin이 활성화되거나 허용 목록에 있으면
  의도적으로 번들 사본을 가립니다.
- 이는 정상이며 로컬 개발, 패치 테스트 및 핫픽스에 유용합니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 capability를 export합니다.

capability 등록은 공개로 유지하세요. 계약이 아닌 헬퍼 export는 줄이세요:

- 번들 Plugin 전용 헬퍼 하위 경로
- 공개 API로 의도되지 않은 런타임 연결 하위 경로
- vendor별 편의 헬퍼
- 구현 세부 사항인 setup/onboarding 헬퍼

일부 번들 Plugin 헬퍼 하위 경로는 호환성과 번들 Plugin 유지보수를 위해
생성된 SDK export 맵에 여전히 남아 있습니다. 현재 예시에는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` 및 여러 `plugin-sdk/matrix*` 경계가 포함됩니다. 이들은
새 서드파티 Plugin을 위한 권장 SDK 패턴이 아니라 예약된 구현 세부 사항 export로 취급하세요.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다:

1. 후보 Plugin 루트를 발견합니다
2. 네이티브 또는 호환 번들 manifest 및 패키지 메타데이터를 읽습니다
3. 안전하지 않은 후보를 거부합니다
4. Plugin config(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)를 정규화합니다
5. 각 후보의 활성화 여부를 결정합니다
6. 활성화된 네이티브 모듈을 jiti로 로드합니다
7. 네이티브 `register(api)`(또는 레거시 별칭인 `activate(api)`) Hook을 호출하고 등록 내용을 Plugin 레지스트리로 수집합니다
8. 레지스트리를 명령/런타임 표면에 노출합니다

<Note>
`activate`는 `register`의 레거시 별칭입니다 — 로더는 존재하는 쪽(`def.register ?? def.activate`)을 확인해 같은 지점에서 호출합니다. 모든 번들 Plugin은 `register`를 사용합니다. 새 Plugin에는 `register`를 우선 사용하세요.
</Note>

안전 게이트는 런타임 실행 **이전**에 발생합니다. 엔트리가 Plugin 루트를 벗어나거나,
경로가 world-writable이거나, 번들이 아닌 Plugin의 경로 소유권이 수상해 보이면 후보는 차단됩니다.

### Manifest 우선 동작

manifest는 컨트롤 플레인의 기준 진실 공급원입니다. OpenClaw는 이를 사용해 다음을 수행합니다:

- Plugin 식별
- 선언된 채널/Skills/config 스키마 또는 번들 capability discovery
- `plugins.entries.<id>.config` 검증
- Control UI 레이블/placeholder 보강
- 설치/카탈로그 메타데이터 표시
- Plugin 런타임을 로드하지 않고도 저비용 활성화 및 setup descriptor 유지

네이티브 Plugin의 경우 런타임 모듈은 데이터 플레인 부분입니다. 이 모듈은 Hook, 도구, 명령 또는 provider 흐름과 같은
실제 동작을 등록합니다.

선택적 manifest `activation` 및 `setup` 블록은 컨트롤 플레인에 남습니다.
이들은 활성화 계획 및 setup discovery를 위한 메타데이터 전용 descriptor이며,
런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.
현재 첫 번째 라이브 활성화 소비자는 이제 manifest 명령, 채널 및 provider 힌트를 사용해
더 넓은 레지스트리 구체화 전에 Plugin 로딩 범위를 좁힙니다:

- CLI 로딩은 요청된 기본 명령을 소유한 Plugin으로 범위를 좁힙니다
- 채널 setup/Plugin 확인은 요청된
  채널 id를 소유한 Plugin으로 범위를 좁힙니다
- 명시적 provider setup/런타임 확인은 요청된
  provider id를 소유한 Plugin으로 범위를 좁힙니다

이제 setup discovery는 `setup-api`로 폴백하기 전에 `setup.providers`와
`setup.cliBackends` 같은 descriptor 소유 id를 우선 사용해 후보 Plugin 범위를 좁힙니다. 둘 이상의 발견된 Plugin이 같은 정규화된 setup provider 또는 CLI backend
id를 주장하면, setup 조회는 discovery 순서에 의존하는 대신
그 모호한 소유자를 거부합니다.

### 로더가 캐시하는 것

OpenClaw는 다음에 대해 짧은 프로세스 내 캐시를 유지합니다:

- discovery 결과
- manifest 레지스트리 데이터
- 로드된 Plugin 레지스트리

이 캐시는 급격한 시작 부하와 반복 명령 오버헤드를 줄여줍니다. 이들은
영속성이 아니라 수명이 짧은 성능 캐시로 생각하면 됩니다.

성능 참고 사항:

- 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- 캐시 윈도우는 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 및
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정할 수 있습니다.

## 레지스트리 모델

로드된 Plugin은 임의의 코어 전역 상태를 직접 변경하지 않습니다. 대신
중앙 Plugin 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다:

- Plugin 레코드(신원, 소스, 출처, 상태, 진단)
- 도구
- 레거시 Hook 및 typed Hook
- 채널
- provider
- Gateway RPC 핸들러
- HTTP 라우트
- CLI registrar
- 백그라운드 서비스
- Plugin 소유 명령

그런 다음 코어 기능은 Plugin 모듈과 직접 통신하는 대신 이 레지스트리를 읽습니다.
이렇게 하면 로딩이 한 방향으로 유지됩니다:

- Plugin 모듈 -> 레지스트리 등록
- 코어 런타임 -> 레지스트리 소비

이 분리는 유지보수성 측면에서 중요합니다. 즉, 대부분의 코어 표면은
"모든 Plugin 모듈을 특수 처리"가 아니라 "레지스트리를 읽기"라는
하나의 통합 지점만 필요합니다.

## 대화 바인딩 콜백

대화를 바인딩하는 Plugin은 승인이 해결될 때 반응할 수 있습니다.

bind 요청이 승인되거나 거부된 후 콜백을 받으려면
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

콜백 payload 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` 또는 `"deny"`
- `binding`: 승인된 요청에 대해 확인된 바인딩
- `request`: 원래 요청 요약, detach 힌트, 발신자 id 및
  대화 메타데이터

이 콜백은 알림 전용입니다. 이는 누가 대화를 바인딩할 수 있는지를 변경하지 않으며,
코어 승인 처리가 끝난 뒤에 실행됩니다.

## Provider 런타임 Hook

이제 provider Plugin에는 두 계층이 있습니다:

- manifest 메타데이터: 런타임 로드 전에 저비용 provider env-auth 조회를 위한 `providerAuthEnvVars`,
  auth를 공유하는 provider variant를 위한 `providerAuthAliases`,
  런타임 로드 전에 저비용 채널 env/setup 조회를 위한 `channelEnvVars`,
  그리고 런타임 로드 전에 저비용 onboarding/auth-choice 레이블 및
  CLI 플래그 메타데이터를 위한 `providerAuthChoices`
- config 시점 Hook: `catalog` / 레거시 `discovery` 및 `applyConfigDefaults`
- 런타임 Hook: `normalizeModelId`, `normalizeTransport`,
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw는 여전히 범용 에이전트 루프, failover, 전사본 처리 및
도구 정책을 소유합니다. 이러한 Hook은 전체 커스텀 추론 전송이
필요하지 않도록 하면서 provider별 동작을 위한 확장 표면 역할을 합니다.

provider에 env 기반 자격 증명이 있고, 일반 auth/status/model-picker 경로가
Plugin 런타임을 로드하지 않고도 이를 볼 수 있어야 한다면 manifest의 `providerAuthEnvVars`를 사용하세요.
하나의 provider id가 다른 provider id의 env var, auth profile, config 기반 auth, API-key onboarding 선택을
재사용해야 한다면 manifest의 `providerAuthAliases`를 사용하세요. onboarding/auth-choice
CLI 표면이 provider 런타임을 로드하지 않고도 provider의 선택 id, 그룹 레이블, 단순
단일 플래그 auth 연결 방식을 알아야 한다면 manifest의 `providerAuthChoices`를 사용하세요.
provider 런타임의 `envVars`는 onboarding 레이블이나 OAuth
client-id/client-secret 설정 변수와 같은 운영자 대상 힌트를 위해 유지하세요.

채널에 env 기반 auth 또는 setup이 있고 일반 shell-env fallback, config/status 검사,
또는 setup 프롬프트가 채널 런타임을 로드하지 않고도 이를 볼 수 있어야 한다면
manifest의 `channelEnvVars`를 사용하세요.

### Hook 순서와 사용법

모델/provider Plugin의 경우, OpenClaw는 대략 다음 순서로 Hook을 호출합니다.
"사용 시점" 열은 빠른 판단 가이드입니다.

| #   | Hook                              | 역할                                                                                                           | 사용 시점                                                                                                                                    |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 provider config를 `models.providers`에 게시                                             | provider가 카탈로그 또는 기본 base URL을 소유할 때                                                                                           |
| 2   | `applyConfigDefaults`             | config 구체화 중 provider 소유 전역 config 기본값 적용                                                        | 기본값이 auth 모드, env 또는 provider 모델 계열 시맨틱에 따라 달라질 때                                                                     |
| --  | _(기본 제공 모델 조회)_           | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도함                                                        | _(Plugin Hook 아님)_                                                                                                                         |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 preview model-id 별칭을 정규화                                                          | provider가 정식 모델 확인 전에 별칭 정리를 소유할 때                                                                                        |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 provider 계열의 `api` / `baseUrl`을 정규화                                                | provider가 동일한 전송 계열 내 커스텀 provider id에 대한 전송 정리를 소유할 때                                                              |
| 5   | `normalizeConfig`                 | 런타임/provider 확인 전에 `models.providers.<id>`를 정규화                                                    | provider에 Plugin과 함께 있어야 할 config 정리가 필요할 때; 번들 Google 계열 헬퍼도 지원되는 Google config 항목의 백스톱 역할을 수행함     |
| 6   | `applyNativeStreamingUsageCompat` | config provider에 네이티브 스트리밍 사용량 호환성 재작성 적용                                                 | provider에 엔드포인트 기반 네이티브 스트리밍 사용량 메타데이터 수정이 필요할 때                                                             |
| 7   | `resolveConfigApiKey`             | 런타임 auth 로드 전에 config provider의 env-marker auth를 확인                                                | provider에 provider 소유 env-marker API 키 확인이 있을 때; `amazon-bedrock`도 여기서 내장 AWS env-marker 확인자를 가짐                     |
| 8   | `resolveSyntheticAuth`            | 일반 텍스트를 영속화하지 않고 local/self-hosted 또는 config 기반 auth를 노출                                  | provider가 합성/local 자격 증명 marker로 동작할 수 있을 때                                                                                  |
| 9   | `resolveExternalAuthProfiles`     | provider 소유 외부 auth profile을 오버레이함; 기본 `persistence`는 CLI/app 소유 자격 증명에 대해 `runtime-only` | provider가 복사된 refresh token을 영속화하지 않고 외부 auth 자격 증명을 재사용할 때                                                         |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 합성 profile placeholder의 우선순위를 env/config 기반 auth보다 낮춤                                    | provider가 우선순위를 갖지 않아야 하는 합성 placeholder profile을 저장할 때                                                                  |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 provider 소유 model id에 대한 동기 fallback                                       | provider가 임의의 업스트림 model id를 허용할 때                                                                                              |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`을 다시 실행                                                             | provider가 알 수 없는 id를 확인하기 전에 네트워크 메타데이터가 필요할 때                                                                     |
| 13  | `normalizeResolvedModel`          | 임베디드 러너가 확인된 모델을 사용하기 전에 최종 재작성                                                       | provider가 전송 재작성이 필요하지만 여전히 코어 전송을 사용할 때                                                                             |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 전송 뒤에 있는 vendor 모델에 대한 compat 플래그 기여                                                | provider가 provider를 직접 인수하지 않고도 프록시 전송에서 자신의 모델을 인식할 때                                                           |
| 15  | `capabilities`                    | 공유 코어 로직에서 사용하는 provider 소유 전사본/도구 메타데이터                                              | provider에 전사본/provider 계열 특성이 필요할 때                                                                                             |
| 16  | `normalizeToolSchemas`            | 임베디드 러너가 보기 전에 도구 스키마를 정규화                                                                | provider에 전송 계열 스키마 정리가 필요할 때                                                                                                 |
| 17  | `inspectToolSchemas`              | 정규화 후 provider 소유 스키마 진단을 노출                                                                    | 코어에 provider별 규칙을 가르치지 않고도 provider가 키워드 경고를 원할 때                                                                    |
| 18  | `resolveReasoningOutputMode`      | 네이티브와 태그 기반 reasoning-output 계약 중 선택                                                            | provider에 네이티브 필드 대신 태그된 reasoning/final 출력이 필요할 때                                                                        |
| 19  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 매개변수 정규화                                                               | provider에 기본 요청 매개변수 또는 provider별 매개변수 정리가 필요할 때                                                                      |
| 20  | `createStreamFn`                  | 일반 스트림 경로를 커스텀 전송으로 완전히 대체                                                                | provider에 단순 래퍼가 아닌 커스텀 wire protocol이 필요할 때                                                                                 |
| 21  | `wrapStreamFn`                    | 일반 래퍼가 적용된 후 스트림 래핑                                                                              | provider에 커스텀 전송 없이 요청 헤더/본문/모델 compat 래퍼가 필요할 때                                                                      |
| 22  | `resolveTransportTurnState`       | 네이티브 턴별 전송 헤더 또는 메타데이터를 부착                                                                | provider가 일반 전송이 provider 네이티브 턴 식별자를 보내기를 원할 때                                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 쿨다운 정책을 부착                                                          | provider가 일반 WS 전송에서 세션 헤더나 fallback 정책을 조정하기 원할 때                                                                     |
| 24  | `formatApiKey`                    | auth-profile formatter: 저장된 profile이 런타임 `apiKey` 문자열이 됨                                          | provider가 추가 auth 메타데이터를 저장하고 커스텀 런타임 토큰 형태가 필요할 때                                                               |
| 25  | `refreshOAuth`                    | 커스텀 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh 재정의                                  | provider가 공유 `pi-ai` refresher에 맞지 않을 때                                                                                             |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트 생성                                                                 | provider에 refresh 실패 후 provider 소유 auth 복구 안내가 필요할 때                                                                          |
| 27  | `matchesContextOverflowError`     | provider 소유 컨텍스트 윈도우 초과 매처                                                                       | provider에 일반 휴리스틱으로 놓칠 수 있는 원시 overflow 오류가 있을 때                                                                        |
| 28  | `classifyFailoverReason`          | provider 소유 failover 이유 분류                                                                               | provider가 원시 API/전송 오류를 rate-limit/overload 등으로 매핑할 수 있을 때                                                                 |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 provider에 대한 프롬프트 캐시 정책                                                                | provider에 프록시별 캐시 TTL 게이팅이 필요할 때                                                                                              |
| 30  | `buildMissingAuthMessage`         | 일반 누락 auth 복구 메시지를 대체                                                                             | provider에 provider별 누락 auth 복구 힌트가 필요할 때                                                                                       |
| 31  | `suppressBuiltInModel`            | 오래된 업스트림 모델 숨김 및 선택적 사용자 대상 오류 힌트                                                     | provider가 오래된 업스트림 행을 숨기거나 vendor 힌트로 대체해야 할 때                                                                        |
| 32  | `augmentModelCatalog`             | discovery 후 합성/최종 카탈로그 행 추가                                                                       | provider에 `models list` 및 picker에서 사용할 합성 forward-compat 행이 필요할 때                                                            |
| 33  | `isBinaryThinking`                | binary-thinking provider를 위한 on/off reasoning 토글                                                         | provider가 바이너리 thinking on/off만 노출할 때                                                                                              |
| 34  | `supportsXHighThinking`           | 선택된 모델에 대한 `xhigh` reasoning 지원                                                                     | provider가 일부 모델에서만 `xhigh`를 원할 때                                                                                                 |
| 35  | `resolveDefaultThinkingLevel`     | 특정 모델 계열에 대한 기본 `/think` 수준 확인                                                                 | provider가 특정 모델 계열의 기본 `/think` 정책을 소유할 때                                                                                   |
| 36  | `isModernModelRef`                | 라이브 profile 필터와 smoke 선택을 위한 현대 모델 매처                                                        | provider가 라이브/smoke 선호 모델 매칭을 소유할 때                                                                                           |
| 37  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                                                    | provider에 토큰 교환 또는 수명이 짧은 요청 자격 증명이 필요할 때                                                                             |
| 38  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면에 대한 사용량/청구 자격 증명을 확인                                               | provider에 커스텀 사용량/쿼터 토큰 파싱 또는 다른 사용량 자격 증명이 필요할 때                                                             |
| 39  | `fetchUsageSnapshot`              | auth가 확인된 후 provider별 사용량/쿼터 스냅샷을 가져와 정규화                                                | provider에 provider별 사용량 엔드포인트 또는 payload 파서가 필요할 때                                                                       |
| 40  | `createEmbeddingProvider`         | 메모리/검색을 위한 provider 소유 임베딩 adapter를 빌드                                                       | 메모리 임베딩 동작은 provider Plugin과 함께 있어야 할 때                                                                                    |
| 41  | `buildReplayPolicy`               | provider의 전사본 처리를 제어하는 replay 정책을 반환                                                         | provider에 커스텀 전사본 정책(예: thinking 블록 제거)이 필요할 때                                                                           |
| 42  | `sanitizeReplayHistory`           | 일반 전사본 정리 후 replay 기록을 재작성                                                                      | provider에 공유 Compaction 헬퍼를 넘어서는 provider별 replay 재작성이 필요할 때                                                            |
| 43  | `validateReplayTurns`             | 임베디드 러너 전에 최종 replay 턴 검증 또는 재구성                                                            | provider 전송에 일반 정리 후 더 엄격한 턴 검증이 필요할 때                                                                                  |
| 44  | `onModelSelected`                 | 모델이 활성화될 때 provider 소유 후속 효과를 실행                                                            | provider에 모델이 활성화될 때 telemetry 또는 provider 소유 상태가 필요할 때                                                                 |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저
일치하는 provider Plugin을 확인한 다음, model id 또는 transport/config를 실제로 변경하는 Plugin이 나올 때까지
다른 Hook 지원 provider Plugin으로 넘어갑니다. 이렇게 하면
호출자가 어떤 번들 Plugin이 재작성을 소유하는지 알 필요 없이 별칭/호환 provider shim이 계속 동작합니다.
어떤 provider Hook도 지원되는 Google 계열 config 항목을 재작성하지 않으면,
번들 Google config 정규화기가 여전히 해당 호환성 정리를 적용합니다.

provider에 완전히 커스텀 wire protocol 또는 커스텀 요청 실행기가 필요하다면,
그것은 다른 종류의 확장입니다. 이러한 Hook은 여전히 OpenClaw의 일반 추론 루프에서
실행되는 provider 동작을 위한 것입니다.

### Provider 예시

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

### 기본 제공 예시

- Anthropic은 `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `wrapStreamFn`을 사용합니다. 이는 Claude 4.6 forward-compat,
  provider 계열 힌트, auth 복구 안내, usage 엔드포인트 통합,
  프롬프트 캐시 적격성, auth 인식 config 기본값, Claude
  기본/적응형 thinking 정책, 그리고 beta 헤더, `/fast` / `serviceTier`,
  `context1m`에 대한 Anthropic 전용 스트림 형태 조정을 소유하기 때문입니다.
- Anthropic의 Claude 전용 스트림 헬퍼는 현재 번들 Plugin 자체의
  공개 `api.ts` / `contract-api.ts` 경계에 남아 있습니다. 이 패키지 표면은
  한 provider의 beta-header 규칙을 위해 범용 SDK를 넓히는 대신
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 그리고 더 저수준의
  Anthropic 래퍼 빌더를 export합니다.
- OpenAI는 `resolveDynamicModel`, `normalizeResolvedModel`,
  `capabilities`와 함께 `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, `isModernModelRef`를 사용합니다.
  이는 GPT-5.4 forward-compat, 직접 OpenAI의
  `openai-completions` -> `openai-responses` 정규화, Codex 인식 auth
  힌트, Spark 숨김, 합성 OpenAI 목록 행, GPT-5 thinking /
  라이브 모델 정책을 소유하기 때문입니다. `openai-responses-defaults` 스트림 계열은
  attribution 헤더, `/fast`/`serviceTier`, 텍스트 verbosity, 네이티브 Codex 웹 검색,
  reasoning-compat payload 형태 조정, Responses 컨텍스트 관리를 위한
  공유 네이티브 OpenAI Responses 래퍼를 소유합니다.
- OpenRouter는 `catalog`와 함께 `resolveDynamicModel`,
  `prepareDynamicModel`을 사용합니다. 이 provider는 패스스루이며 OpenClaw의 정적 카탈로그가 업데이트되기 전에
  새 model id를 노출할 수 있기 때문입니다. 또한
  provider별 요청 헤더, 라우팅 메타데이터, reasoning 패치,
  프롬프트 캐시 정책을 코어 밖에 유지하기 위해 `capabilities`, `wrapStreamFn`,
  `isCacheTtlEligible`도 사용합니다. replay 정책은
  `passthrough-gemini` 계열에서 오며, `openrouter-thinking` 스트림 계열은
  프록시 reasoning 주입과 미지원 모델 / `auto` 건너뛰기를 소유합니다.
- GitHub Copilot은 `catalog`, `auth`, `resolveDynamicModel`,
  `capabilities`와 함께 `prepareRuntimeAuth`, `fetchUsageSnapshot`을 사용합니다.
  이는 provider 소유 디바이스 로그인, 모델 fallback 동작, Claude 전사본 특성,
  GitHub 토큰 -> Copilot 토큰 교환, provider 소유 usage 엔드포인트가 필요하기 때문입니다.
- OpenAI Codex는 `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, `augmentModelCatalog`와 함께
  `prepareExtraParams`, `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다.
  이는 여전히 코어 OpenAI transport에서 실행되지만 transport/base URL
  정규화, OAuth refresh fallback 정책, 기본 transport 선택,
  합성 Codex 카탈로그 행, ChatGPT usage 엔드포인트 통합을 소유하기 때문입니다. 또한
  직접 OpenAI와 동일한 `openai-responses-defaults` 스트림 계열을 공유합니다.
- Google AI Studio와 Gemini CLI OAuth는 `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, `isModernModelRef`를 사용합니다. 이는
  `google-gemini` replay 계열이 Gemini 3.1 forward-compat fallback,
  네이티브 Gemini replay 검증, bootstrap replay 정리, 태그 기반
  reasoning-output 모드, 현대 모델 매칭을 소유하고,
  `google-thinking` 스트림 계열이 Gemini thinking payload 정규화를 소유하기 때문입니다.
  Gemini CLI OAuth는 토큰 포맷팅, 토큰 파싱, 쿼터 엔드포인트
  연결을 위해 `formatApiKey`, `resolveUsageAuth`, `fetchUsageSnapshot`도 사용합니다.
- Anthropic Vertex는
  `anthropic-by-model` replay 계열을 통해 `buildReplayPolicy`를 사용합니다. 이로써 Claude 전용 replay 정리가
  모든 `anthropic-messages` transport가 아니라 Claude id에만 범위가 지정된 상태로 유지됩니다.
- Amazon Bedrock은 `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `resolveDefaultThinkingLevel`을 사용합니다. 이는
  Anthropic-on-Bedrock 트래픽에 대한 Bedrock 전용 throttle/not-ready/context-overflow 오류 분류를
  소유하기 때문입니다. replay 정책은 여전히
  동일한 Claude 전용 `anthropic-by-model` 가드를 공유합니다.
- OpenRouter, Kilocode, Opencode, Opencode Go는
  `passthrough-gemini` replay 계열을 통해 `buildReplayPolicy`를 사용합니다. 이들은 OpenAI 호환 transport를 통해
  Gemini 모델을 프록시하며, 네이티브 Gemini replay 검증이나
  bootstrap 재작성 없이 Gemini thought-signature 정리가 필요하기 때문입니다.
- MiniMax는
  `hybrid-anthropic-openai` replay 계열을 통해 `buildReplayPolicy`를 사용합니다. 이는 하나의 provider가 Anthropic-message와 OpenAI 호환 시맨틱을 모두 소유하기 때문입니다.
  이 방식은 Anthropic 측에서 Claude 전용
  thinking 블록 제거를 유지하면서 reasoning 출력 모드를 다시 네이티브로 재정의하고,
  `minimax-fast-mode` 스트림 계열은 공유 스트림 경로에서 fast-mode 모델 재작성을 소유합니다.
- Moonshot은 `catalog`와 `wrapStreamFn`을 사용합니다. 이는 여전히 공유
  OpenAI transport를 사용하지만 provider 소유 thinking payload 정규화가 필요하기 때문입니다.
  `moonshot-thinking` 스트림 계열은 config와 `/think` 상태를
  네이티브 바이너리 thinking payload에 매핑합니다.
- Kilocode는 `catalog`, `capabilities`, `wrapStreamFn`,
  `isCacheTtlEligible`를 사용합니다. 이는 provider 소유 요청 헤더,
  reasoning payload 정규화, Gemini 전사본 힌트, Anthropic
  캐시 TTL 게이팅이 필요하기 때문입니다. `kilocode-thinking` 스트림 계열은
  공유 프록시 스트림 경로에서 Kilo thinking 주입을 유지하면서,
  명시적 reasoning payload를 지원하지 않는 `kilo/auto` 및
  기타 프록시 model id는 건너뜁니다.
- Z.AI는 `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다. 이는 GLM-5 fallback,
  `tool_stream` 기본값, 바이너리 thinking UX, 현대 모델 매칭, 그리고
  usage auth + quota 가져오기를 모두 소유하기 때문입니다. `tool-stream-default-on` 스트림 계열은
  기본 활성화된 `tool_stream` 래퍼를 provider별 수기 연결 코드 밖에 유지합니다.
- xAI는 `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, `isModernModelRef`를 사용합니다.
  이는 네이티브 xAI Responses transport 정규화, Grok fast-mode
  별칭 재작성, 기본 `tool_stream`, strict-tool / reasoning-payload
  정리, Plugin 소유 도구를 위한 fallback auth 재사용, forward-compat Grok
  모델 확인, 그리고 xAI 도구 스키마
  프로필, 미지원 스키마 키워드, 네이티브 `web_search`, HTML 엔터티
  도구 호출 인수 디코딩과 같은 provider 소유 compat 패치를 소유하기 때문입니다.
- Mistral, OpenCode Zen, OpenCode Go는 코어 밖에
  전사본/도구 특성을 유지하기 위해 `capabilities`만 사용합니다.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, `volcengine`과 같은
  카탈로그 전용 번들 provider는 `catalog`만 사용합니다.
- Qwen은 텍스트 provider를 위해 `catalog`를 사용하며, 멀티모달 표면을 위해
  공유 media-understanding 및 video-generation 등록도 함께 사용합니다.
- MiniMax와 Xiaomi는 `/usage`
  동작이 Plugin 소유이지만 추론은 여전히 공유 transport를 통해 실행되므로 `catalog`와 usage Hook을 함께 사용합니다.

## 런타임 헬퍼

Plugin은 `api.runtime`를 통해 선택된 코어 헬퍼에 접근할 수 있습니다. TTS의 경우:

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

- `textToSpeech`는 파일/음성 노트 표면을 위한 일반 코어 TTS 출력 payload를 반환합니다.
- 코어 `messages.tts` 구성과 provider 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 레이트를 반환합니다. Plugin은 provider에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 provider별로 선택 사항입니다. vendor 소유 음성 선택기 또는 setup 흐름에 사용하세요.
- 음성 목록에는 locale, gender, personality 태그와 같은 더 풍부한 메타데이터가 포함될 수 있어 provider 인식 선택기에 활용할 수 있습니다.
- 현재 전화 기능은 OpenAI와 ElevenLabs가 지원합니다. Microsoft는 지원하지 않습니다.

Plugin은 `api.registerSpeechProvider(...)`를 통해 speech provider를 등록할 수도 있습니다.

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

- TTS 정책, fallback, 응답 전달은 코어에 두세요.
- vendor 소유 합성 동작에는 speech provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider id로 정규화됩니다.
- 선호되는 소유권 모델은 회사 중심입니다. 하나의 vendor Plugin이
  OpenClaw가 이러한 capability 계약을 추가함에 따라 텍스트, 음성, 이미지, 향후 미디어 provider를
  함께 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우, Plugin은 범용 키/값 가방 대신
하나의 typed media-understanding provider를 등록합니다:

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

- orchestration, fallback, config, 채널 연결은 코어에 유지하세요.
- vendor 동작은 provider Plugin에 유지하세요.
- 점진적 확장은 타입을 유지해야 합니다: 새로운 선택적 메서드, 새로운 선택적
  결과 필드, 새로운 선택적 capability.
- 비디오 생성도 이미 같은 패턴을 따릅니다:
  - 코어가 capability 계약과 런타임 헬퍼를 소유합니다
  - vendor Plugin은 `api.registerVideoGenerationProvider(...)`를 등록합니다
  - 기능/채널 Plugin은 `api.runtime.videoGeneration.*`를 소비합니다

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

오디오 전사의 경우, Plugin은 media-understanding 런타임이나
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

- `api.runtime.mediaUnderstanding.*`는
  이미지/오디오/비디오 이해를 위한 선호되는 공유 표면입니다.
- 코어 media-understanding 오디오 구성(`tools.media.audio`)과 provider fallback 순서를 사용합니다.
- 전사 출력이 생성되지 않으면 `{ text: undefined }`를 반환합니다(예: 입력이 건너뛰어졌거나 지원되지 않는 경우).
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 계속 유지됩니다.

Plugin은 `api.runtime.subagent`를 통해 백그라운드 하위 에이전트 실행도 시작할 수 있습니다:

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

- `provider`와 `model`은 영구적인 세션 변경이 아니라 실행별 선택적 재정의입니다.
- OpenClaw는 신뢰된 호출자에 대해서만 이러한 재정의 필드를 허용합니다.
- Plugin 소유 fallback 실행의 경우, 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 명시적으로 동의해야 합니다.
- 신뢰된 Plugin을 특정 정식 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하고, 모든 대상을 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰되지 않은 Plugin 하위 에이전트 실행도 여전히 동작하지만, 재정의 요청은 조용히 fallback되지 않고 거부됩니다.

웹 검색의 경우, Plugin은 에이전트 도구 연결에 직접 접근하는 대신
공유 런타임 헬퍼를 소비할 수 있습니다:

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

Plugin은 또한
`api.registerWebSearchProvider(...)`를 통해 웹 검색 provider를 등록할 수 있습니다.

참고:

- provider 선택, 자격 증명 확인, 공유 요청 시맨틱은 코어에 유지하세요.
- vendor별 검색 transport에는 웹 검색 provider를 사용하세요.
- `api.runtime.webSearch.*`는 에이전트 도구 래퍼에 의존하지 않고 검색 동작이 필요한 기능/채널 Plugin을 위한 선호되는 공유 표면입니다.

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

## Gateway HTTP 라우트

Plugin은 `api.registerHttpRoute(...)`를 사용해 HTTP 엔드포인트를 노출할 수 있습니다.

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

라우트 필드:

- `path`: Gateway HTTP 서버 아래의 라우트 경로.
- `auth`: 필수. 일반 Gateway auth가 필요하면 `"gateway"`를, Plugin 관리 auth/Webhook 검증에는 `"plugin"`을 사용합니다.
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`.
- `replaceExisting`: 선택 사항. 동일한 Plugin이 자신의 기존 라우트 등록을 교체할 수 있게 합니다.
- `handler`: 라우트가 요청을 처리했을 때 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 Plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin 라우트는 `auth`를 명시적으로 선언해야 합니다.
- 정확히 같은 `path + match` 충돌은 `replaceExisting: true`가 아닌 한 거부되며, 한 Plugin이 다른 Plugin의 라우트를 교체할 수는 없습니다.
- 서로 다른 `auth` 수준을 가진 겹치는 라우트는 거부됩니다. `exact`/`prefix` 폴스루 체인은 동일한 auth 수준에서만 유지하세요.
- `auth: "plugin"` 라우트는 운영자 런타임 scope를 자동으로 받지 **않습니다**. 이는 권한 있는 Gateway 헬퍼 호출이 아니라 Plugin 관리 Webhook/서명 검증을 위한 것입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 scope 내부에서 실행되지만, 이 scope는 의도적으로 보수적입니다:
  - 공유 비밀 bearer auth(`gateway.auth.mode = "token"` / `"password"`)는 호출자가 `x-openclaw-scopes`를 보내더라도 Plugin 라우트 런타임 scope를 `operator.write`로 고정합니다
  - 신뢰된 신원 기반 HTTP 모드(예: `trusted-proxy` 또는 비공개 ingress에서의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 존재할 때만 `x-openclaw-scopes`를 존중합니다
  - 해당 신원 기반 Plugin 라우트 요청에 `x-openclaw-scopes`가 없으면 런타임 scope는 `operator.write`로 fallback됩니다
- 실용적인 규칙: Gateway auth Plugin 라우트가 암묵적인 관리자 표면이라고 가정하지 마세요. 라우트에 관리자 전용 동작이 필요하다면, 신원 기반 auth 모드를 요구하고 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK import 경로

Plugin 작성 시에는 단일 `openclaw/plugin-sdk` import 대신
SDK 하위 경로를 사용하세요:

- Plugin 등록 기본 요소에는 `openclaw/plugin-sdk/plugin-entry`.
- 범용 공유 Plugin 대상 계약에는 `openclaw/plugin-sdk/core`.
- 루트 `openclaw.json` Zod 스키마
  export(`OpenClawSchema`)에는 `openclaw/plugin-sdk/config-schema`.
- 안정적인 채널 기본 요소인 `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress`는 공유 setup/auth/reply/Webhook
  연결에 사용합니다. `channel-inbound`는 debounce, mention 매칭,
  수신 mention-policy 헬퍼, envelope 포맷팅, 수신 envelope
  컨텍스트 헬퍼를 위한 공유 위치입니다.
  `channel-setup`은 좁은 선택적 설치 setup 경계입니다.
  `setup-runtime`은 `setupEntry` /
  지연된 시작에서 사용되는 런타임 안전 setup 표면으로, import 안전 setup 패치 adapter를 포함합니다.
  `setup-adapter-runtime`은 env 인식 account-setup adapter 경계입니다.
  `setup-tools`는 작은 CLI/archive/docs 헬퍼 경계(`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`)입니다.
- `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime`와 같은 도메인 하위 경로는 공유 런타임/config 헬퍼에 사용합니다.
  `telegram-command-config`는 Telegram 커스텀
  명령 정규화/검증을 위한 좁은 공개 경계이며, 번들
  Telegram 계약 표면을 일시적으로 사용할 수 없더라도 계속 제공됩니다.
  `text-runtime`은 assistant 표시 텍스트 제거,
  markdown 렌더링/청킹 헬퍼, redaction
  헬퍼, directive-tag 헬퍼, safe-text 유틸리티를 포함한 공유 텍스트/markdown/로깅 경계입니다.
- 승인 전용 채널 경계는 Plugin에 하나의 `approvalCapability`
  계약을 두는 방식을 우선해야 합니다. 그러면 코어는 승인 auth, 전달, 렌더링,
  네이티브 라우팅, 지연 네이티브 핸들러 동작을 관련 없는 Plugin 필드에 섞는 대신
  이 하나의 capability를 통해 읽습니다.
- `openclaw/plugin-sdk/channel-runtime`은 더 이상 권장되지 않으며 오래된 Plugin과의
  호환성 shim으로만 남아 있습니다. 새 코드는 대신 더 좁은 범용 기본 요소를 import해야 하며,
  리포지토리 코드도 이 shim에 대한 새 import를 추가해서는 안 됩니다.
- 번들 확장 내부 요소는 비공개로 유지됩니다. 외부 Plugin은 `openclaw/plugin-sdk/*` 하위 경로만 사용해야 합니다.
  OpenClaw 코어/테스트 코드는 `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, `login-qr-api.js`와 같은 좁은 범위 파일 등
  Plugin 패키지 루트 아래의 리포지토리 공개 엔트리 포인트를 사용할 수 있습니다.
  코어 또는 다른 확장에서 Plugin 패키지의 `src/*`를 import하지 마세요.
- 리포지토리 엔트리 포인트 분리:
  `<plugin-package-root>/api.js`는 헬퍼/타입 배럴,
  `<plugin-package-root>/runtime-api.js`는 런타임 전용 배럴,
  `<plugin-package-root>/index.js`는 번들 Plugin 엔트리,
  `<plugin-package-root>/setup-entry.js`는 setup Plugin 엔트리입니다.
- 현재 번들 provider 예시:
  - Anthropic은 `wrapAnthropicProviderStream`, beta-header 헬퍼,
    `service_tier` 파싱과 같은 Claude 스트림 헬퍼에 `api.js` / `contract-api.js`를 사용합니다.
  - OpenAI는 provider 빌더, 기본 모델 헬퍼, 실시간 provider 빌더에
    `api.js`를 사용합니다.
  - OpenRouter는 provider 빌더와 onboarding/config
    헬퍼에 `api.js`를 사용하며, `register.runtime.js`는 여전히 리포지토리 로컬 사용을 위해
    범용 `plugin-sdk/provider-stream` 헬퍼를 다시 export할 수 있습니다.
- facade로 로드되는 공개 엔트리 포인트는 활성 런타임 config 스냅샷이 있으면 이를 우선 사용하고,
  OpenClaw가 아직 런타임 스냅샷을 제공하지 않을 때는 디스크의 확인된 config 파일로 fallback됩니다.
- 범용 공유 기본 요소는 여전히 선호되는 공개 SDK 계약입니다. 소수의 예약된
  번들 채널 브랜드 헬퍼 경계 집합은 여전히 존재합니다. 이들은 새
  서드파티 import 대상이 아니라 번들 유지보수/호환성 경계로 취급하세요. 새로운 교차 채널 계약은 여전히
  범용 `plugin-sdk/*` 하위 경로나 Plugin 로컬 `api.js` /
  `runtime-api.js` 배럴에 추가되어야 합니다.

호환성 참고 사항:

- 새 코드에서는 루트 `openclaw/plugin-sdk` 배럴을 피하세요.
- 먼저 좁고 안정적인 기본 요소를 우선 사용하세요. 더 새로운 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool 하위 경로가 새 번들 및 외부 Plugin 작업을 위한
  의도된 계약입니다.
  대상 파싱/매칭은 `openclaw/plugin-sdk/channel-targets`에 있어야 합니다.
  메시지 작업 게이트와 reaction message-id 헬퍼는
  `openclaw/plugin-sdk/channel-actions`에 있어야 합니다.
- 번들 확장 전용 헬퍼 배럴은 기본적으로 안정적이지 않습니다. 어떤 헬퍼가
  번들 확장에만 필요하다면, 이를
  `openclaw/plugin-sdk/<extension>`으로 승격하는 대신 확장의 로컬 `api.js` 또는 `runtime-api.js`
  경계 뒤에 유지하세요.
- 새 공유 헬퍼 경계는 채널 브랜드가 아니라 범용이어야 합니다. 공유 대상
  파싱은 `openclaw/plugin-sdk/channel-targets`에 있어야 하며, 채널별
  내부 요소는 소유 Plugin의 로컬 `api.js` 또는 `runtime-api.js`
  경계 뒤에 유지되어야 합니다.
- `image-generation`,
  `media-understanding`, `speech`와 같은 capability별 하위 경로는 번들/네이티브 Plugin이
  오늘날 이를 사용하기 때문에 존재합니다. 이들의 존재만으로 export된 모든 헬퍼가
  장기적으로 고정된 외부 계약이라는 뜻은 아닙니다.

## 메시지 도구 스키마

Plugin은 채널별 `describeMessageTool(...)` 스키마
기여를 소유해야 합니다. provider별 필드는 공유 코어가 아니라 Plugin에 두세요.

공유 가능한 이식형 스키마 조각은
`openclaw/plugin-sdk/channel-actions`를 통해 export되는 범용 헬퍼를 재사용하세요:

- 버튼 그리드 스타일 payload에는 `createMessageToolButtonsSchema()`
- 구조화된 카드 payload에는 `createMessageToolCardSchema()`

스키마 형태가 한 provider에서만 의미가 있다면, 이를 공유 SDK로 승격하는 대신
해당 Plugin 자체 소스에 정의하세요.

## 채널 대상 확인

채널 Plugin은 채널별 대상 시맨틱을 소유해야 합니다. 공유
발신 호스트는 범용으로 유지하고 provider 규칙에는 메시징 adapter 표면을 사용하세요:

- `messaging.inferTargetChatType({ to })`는 정규화된 대상을
  디렉터리 조회 전에 `direct`, `group`, `channel` 중 무엇으로 취급할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 입력이
  디렉터리 검색 대신 바로 id 유사 확인으로 넘어가야 하는지 코어에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`는 정규화 후 또는
  디렉터리 미스 후 코어가 최종 provider 소유 확인이 필요할 때 사용하는 Plugin fallback입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 확인된 후
  provider별 세션 라우트 구성을 소유합니다.

권장 분리:

- peer/group 검색 전에 수행되어야 하는 범주 결정에는 `inferTargetChatType`을 사용하세요.
- "이를 명시적/네이티브 대상 id로 취급" 검사에는 `looksLikeId`를 사용하세요.
- provider별 정규화 fallback에는 `resolveTarget`을 사용하고, 광범위한 디렉터리 검색에는 사용하지 마세요.
- chat id, thread id, JID, handle, room id와 같은 provider 네이티브 id는
  범용 SDK 필드가 아니라 `target` 값 또는 provider별 매개변수 안에 유지하세요.

## config 기반 디렉터리

config에서 디렉터리 항목을 도출하는 Plugin은 그 로직을 Plugin 내부에 두고
`openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

다음과 같은 config 기반 peer/group가 채널에 필요할 때 이를 사용하세요:

- 허용 목록 기반 DM peer
- 구성된 채널/그룹 맵
- account 범위의 정적 디렉터리 fallback

`directory-runtime`의 공유 헬퍼는 범용 작업만 처리합니다:

- 쿼리 필터링
- limit 적용
- 중복 제거/정규화 헬퍼
- `ChannelDirectoryEntry[]` 빌드

채널별 account 검사와 id 정규화는 Plugin 구현에 남아 있어야 합니다.

## Provider 카탈로그

Provider Plugin은
`registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 기록하는 것과 같은 형태를 반환합니다:

- 하나의 provider 항목에는 `{ provider }`
- 여러 provider 항목에는 `{ providers }`

Plugin이 provider별 model id, 기본 base URL,
또는 auth 게이트 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 Plugin의 카탈로그가 OpenClaw의
기본 제공 암시적 provider에 비해 언제 병합되는지를 제어합니다:

- `simple`: 일반 API 키 또는 env 기반 provider
- `profile`: auth profile이 있을 때 나타나는 provider
- `paired`: 여러 관련 provider 항목을 합성하는 provider
- `late`: 다른 암시적 provider 이후의 마지막 패스

나중 provider가 키 충돌 시 우선하므로, Plugin은 같은 provider id를 가진
기본 제공 provider 항목을 의도적으로 재정의할 수 있습니다.

호환성:

- `discovery`는 레거시 별칭으로 계속 동작합니다
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용합니다

## 읽기 전용 채널 검사

Plugin이 채널을 등록한다면, `resolveAccount(...)`와 함께
`plugin.config.inspectAccount(cfg, accountId)` 구현을 우선 고려하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이
  완전히 구체화되었다고 가정할 수 있으며, 필요한 secret이 없으면 빠르게 실패할 수 있습니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름과 같은 읽기 전용 명령 경로는 구성을 설명하기 위해
  런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장되는 `inspectAccount(...)` 동작:

- 설명적인 account 상태만 반환합니다.
- `enabled`와 `configured`를 유지합니다.
- 관련이 있으면 다음과 같은 자격 증명 소스/상태 필드를 포함합니다:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 사용 가능성만 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다.
  상태 스타일 명령에는 `tokenStatus: "available"`(및 해당 소스 필드)만 반환해도 충분합니다.
- 자격 증명이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 사용할 수 없을 때는
  `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 크래시하거나 account를 구성되지 않은 것으로 잘못 보고하는 대신
"구성되었지만 이 명령 경로에서는 사용할 수 없음"을 보고할 수 있습니다.

## 패키지 팩

Plugin 디렉터리에는 `openclaw.extensions`가 포함된 `package.json`이 있을 수 있습니다:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 하나의 Plugin이 됩니다. 팩에 여러 확장이 나열되어 있으면, Plugin id는
`name/<fileBase>`가 됩니다.

Plugin이 npm 의존성을 import한다면, 해당 디렉터리에서 이를 설치해
`node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 심볼릭 링크 확인 후에도
Plugin 디렉터리 내부에 있어야 합니다. 패키지 디렉터리를 벗어나는 항목은
거부됩니다.

보안 참고 사항: `openclaw plugins install`은
`npm install --omit=dev --ignore-scripts`로 Plugin 의존성을 설치합니다(라이프사이클 스크립트 없음, 런타임에 dev dependency 없음). Plugin dependency
트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 채널 Plugin의 setup 표면이 필요하거나,
채널 Plugin이 활성화되었지만 아직 구성되지 않은 경우,
전체 Plugin 엔트리 대신 `setupEntry`를 로드합니다. 이렇게 하면 메인 Plugin 엔트리가 도구, Hook 또는 기타 런타임 전용
코드도 연결하는 경우 시작과 setup을 더 가볍게 유지할 수 있습니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은
채널이 이미 구성된 경우에도 채널 Plugin이 Gateway의
pre-listen 시작 단계 동안 동일한 `setupEntry` 경로를 사용하도록 선택할 수 있게 합니다.

이는 `setupEntry`가 Gateway가 수신을 시작하기 전에 반드시 존재해야 하는
시작 표면을 완전히 포괄할 때만 사용하세요. 실제로는 setup 엔트리가 시작이 의존하는
모든 채널 소유 capability를 등록해야 한다는 뜻입니다. 예:

- 채널 등록 자체
- Gateway가 수신을 시작하기 전에 사용 가능해야 하는 모든 HTTP 라우트
- 같은 시간 창에 존재해야 하는 모든 Gateway 메서드, 도구 또는 서비스

전체 엔트리가 여전히 필요한 시작 capability를 하나라도 소유한다면,
이 플래그를 활성화하지 마세요. 기본 동작을 유지하고 OpenClaw가 시작 중에 전체 엔트리를 로드하도록 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 코어가 참조할 수 있는
setup 전용 계약 표면 헬퍼도 게시할 수 있습니다. 현재 setup
승격 표면은 다음과 같습니다:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

코어는 레거시 단일 account 채널
config를 전체 Plugin 엔트리를 로드하지 않고 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다.
현재 번들 예시는 Matrix입니다. Matrix는 이름 있는 account가 이미 존재할 때
auth/bootstrap 키만 이름 있는 승격 account로 이동하며,
항상 `accounts.default`를 만드는 대신 구성된 비정규 기본 account 키를 보존할 수 있습니다.

이러한 setup 패치 adapter는 번들 계약 표면 discovery를 지연 상태로 유지합니다.
import 시점은 가볍게 유지되며, 승격 표면은 모듈 import 중 번들 채널 시작에 다시 들어가는 대신
처음 사용할 때만 로드됩니다.

이러한 시작 표면에 Gateway RPC 메서드가 포함될 때는
Plugin별 접두사에 유지하세요. 코어 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며 Plugin이 더 좁은 scope를 요청하더라도
항상 `operator.admin`으로 확인됩니다.

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
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 코어 카탈로그가 데이터 비종속적으로 유지됩니다.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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
- `docsLabel`: 문서 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 항목이 더 낮은 우선순위의 Plugin/채널 id보다 앞서야 함을 나타냄
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 복사 제어
- `markdownCapable`: 발신 포맷 결정용으로 채널을 markdown 가능 채널로 표시
- `exposure.configured`: `false`로 설정 시 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정 시 대화형 setup/configure 선택기에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭; `exposure`를 우선 사용하세요
- `quickstartAllowFrom`: 채널을 표준 quickstart `allowFrom` 흐름에 포함
- `forceAccountBinding`: account가 하나만 있어도 명시적 account 바인딩을 요구
- `preferSessionLookupForAnnounceTarget`: announce 대상 확인 시 세션 조회를 우선

OpenClaw는 **외부 채널 카탈로그**(예: MPM
레지스트리 export)도 병합할 수 있습니다. 다음 위치 중 하나에 JSON 파일을 두세요:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를
하나 이상의 JSON 파일로 지정하세요(쉼표/세미콜론/`PATH` 구분). 각 파일은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를 포함해야 합니다.
파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

## 컨텍스트 엔진 Plugin

컨텍스트 엔진 Plugin은 수집, 조립,
Compaction을 위한 세션 컨텍스트 orchestration을 소유합니다. Plugin에서
`api.registerContextEngine(id, factory)`로 등록한 다음, 활성 엔진은
`plugins.slots.contextEngine`으로 선택하세요.

기본 컨텍스트
파이프라인에 메모리 검색이나 Hook을 추가하는 수준이 아니라 이를 교체하거나 확장해야 할 때 사용하세요.

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

엔진이 Compaction 알고리즘을 **소유하지 않는다면**, `compact()`는 계속
구현하되 이를 명시적으로 위임하세요:

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

## 새 capability 추가하기

Plugin에 현재 API에 맞지 않는 동작이 필요할 때는,
비공개 직접 접근으로 Plugin 시스템을 우회하지 마세요. 누락된 capability를 추가하세요.

권장 순서:

1. 코어 계약 정의
   코어가 어떤 공유 동작을 소유해야 하는지 결정합니다: 정책, fallback, config 병합,
   수명 주기, 채널 대상 시맨틱, 런타임 헬퍼 형태.
2. typed Plugin 등록/런타임 표면 추가
   가장 작지만 유용한 typed capability 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`를 확장합니다.
3. 코어 + 채널/기능 소비자 연결
   채널과 기능 Plugin은 vendor 구현을 직접 import하지 말고,
   코어를 통해 새 capability를 소비해야 합니다.
4. vendor 구현 등록
   그런 다음 vendor Plugin이 해당 capability에 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 특정
provider의 관점에 하드코딩되지 않으면서도 명확한 방향성을 유지하는 방식입니다. 구체적인 파일 체크리스트와 예시는
[Capability Cookbook](/ko/plugins/architecture)을 참고하세요.

### Capability 체크리스트

새 capability를 추가할 때, 구현은 일반적으로 다음
표면을 함께 건드려야 합니다:

- `src/<capability>/types.ts`의 코어 계약 타입
- `src/<capability>/runtime.ts`의 코어 러너/런타임 헬퍼
- `src/plugins/types.ts`의 Plugin API 등록 표면
- `src/plugins/registry.ts`의 Plugin 레지스트리 연결
- 기능/채널 Plugin이 이를 소비해야 할 때 `src/plugins/runtime/*`의 Plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 헬퍼
- `src/plugins/contracts/registry.ts`의 소유권/계약 검증
- `docs/`의 운영자/Plugin 문서

이 표면 중 하나가 빠져 있다면, 이는 대체로 capability가 아직
완전히 통합되지 않았다는 신호입니다.

### Capability 템플릿

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

- 코어는 capability 계약 + orchestration을 소유합니다
- vendor Plugin은 vendor 구현을 소유합니다
- 기능/채널 Plugin은 런타임 헬퍼를 소비합니다
- 계약 테스트는 소유권을 명시적으로 유지합니다
