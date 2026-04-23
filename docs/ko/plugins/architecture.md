---
read_when:
    - 네이티브 OpenClaw Plugin 빌드 또는 디버깅하기
    - Plugin 기능 모델 또는 소유권 경계 이해하기
    - Plugin 로드 파이프라인 또는 레지스트리 작업하기
    - provider 런타임 훅 또는 채널 Plugin 구현하기
sidebarTitle: Internals
summary: 'Plugin 내부: 기능 모델, 소유권, 계약, 로드 파이프라인, 런타임 헬퍼'
title: Plugin 내부
x-i18n:
    generated_at: "2026-04-23T14:04:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin 내부

<Info>
  이것은 **심층 아키텍처 참조**입니다. 실용적인 가이드는 다음을 참조하세요:
  - [Install and use plugins](/ko/tools/plugin) — 사용자 가이드
  - [Getting Started](/ko/plugins/building-plugins) — 첫 Plugin 튜토리얼
  - [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 메시징 채널 빌드하기
  - [Provider Plugins](/ko/plugins/sdk-provider-plugins) — 모델 provider 빌드하기
  - [SDK Overview](/ko/plugins/sdk-overview) — import 맵과 등록 API
</Info>

이 페이지는 OpenClaw Plugin 시스템의 내부 아키텍처를 설명합니다.

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **네이티브 Plugin** 모델입니다. 모든
네이티브 OpenClaw Plugin은 하나 이상의 기능 유형에 대해 등록됩니다:

| 기능                   | 등록 메서드                                     | 예시 Plugin                         |
| ---------------------- | ----------------------------------------------- | ----------------------------------- |
| 텍스트 추론            | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                   | `openai`, `anthropic`               |
| 음성                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| 웹 검색                | `api.registerWebSearchProvider(...)`            | `google`                            |
| 채널 / 메시징          | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |

기능을 하나도 등록하지 않지만 훅, 도구, 서비스는 제공하는 Plugin은
**레거시 hook-only** Plugin입니다. 이 패턴도 여전히 완전히 지원됩니다.

### 외부 호환성 입장

기능 모델은 이미 core에 반영되어 있으며 현재 번들/네이티브 Plugin에서
사용되고 있지만, 외부 Plugin 호환성은 "내보내졌으니 곧 고정됨"보다 더 엄격한 기준이 필요합니다.

현재 지침:

- **기존 외부 Plugin:** 훅 기반 통합이 계속 동작하도록 유지하고, 이를 호환성 기준선으로 간주
- **새 번들/네이티브 Plugin:** vendor별 직접 접근이나 새로운 hook-only 설계보다 명시적 기능 등록을 선호
- **기능 등록을 도입하는 외부 Plugin:** 허용되지만, docs에서 명시적으로 계약이 안정적이라고 표시하지 않는 한 기능별 헬퍼 표면은 진화 중인 것으로 간주

실용적인 규칙:

- 기능 등록 API가 의도된 방향입니다
- 전환 기간 동안 레거시 훅은 외부 Plugin에 가장 안전한 무중단 경로로 남습니다
- 내보낸 헬퍼 하위 경로가 모두 같은 것은 아닙니다. 우연히 노출된 헬퍼 export가 아니라, 문서화된 좁은 계약을 선호하세요

### Plugin 형태

OpenClaw는 실제 등록 동작을 기준으로(정적 메타데이터만이 아님) 로드된 모든 Plugin을 형태로 분류합니다:

- **plain-capability** -- 정확히 하나의 기능 유형만 등록함(예: `mistral` 같은 provider 전용 Plugin)
- **hybrid-capability** -- 여러 기능 유형을 등록함(예: `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 소유)
- **hook-only** -- 훅만 등록하며(타입 지정 또는 사용자 정의), 기능, 도구, 명령, 서비스는 없음
- **non-capability** -- 도구, 명령, 서비스, 라우트는 등록하지만 기능은 없음

Plugin의 형태와 기능 구성을 보려면 `openclaw plugins inspect <id>`를 사용하세요. 자세한 내용은 [CLI reference](/ko/cli/plugins#inspect)를 참조하세요.

### 레거시 훅

`before_agent_start` 훅은 hook-only Plugin을 위한 호환성 경로로 계속 지원됩니다. 실제 레거시 Plugin들이 여전히 여기에 의존합니다.

방향:

- 계속 동작하게 유지
- 레거시로 문서화
- 모델/provider 재정의 작업에는 `before_model_resolve`를 선호
- 프롬프트 변경 작업에는 `before_prompt_build`를 선호
- 실제 사용이 줄고 fixture 커버리지가 마이그레이션 안전성을 입증한 뒤에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 라벨 중 하나를 볼 수 있습니다:

| 신호                       | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config가 정상적으로 파싱되고 Plugin이 정상 해석됨            |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`)    |
| **legacy warning**         | Plugin이 `before_agent_start`를 사용하며, 이는 deprecated됨  |
| **hard error**             | Config가 잘못되었거나 Plugin 로드에 실패함                   |

`hook-only`도 `before_agent_start`도 현재 여러분의 Plugin을 깨뜨리지는 않습니다 --
`hook-only`는 권고 수준이고, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 나타납니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 개의 계층으로 구성됩니다:

1. **Manifest + discovery**
   OpenClaw는 구성된 경로, workspace 루트,
   전역 Plugin 루트, 번들 Plugin에서 후보 Plugin을 찾습니다. Discovery는 먼저 네이티브
   `openclaw.plugin.json` manifest와 지원되는 번들 manifest를 읽습니다.
2. **활성화 + 검증**
   Core는 발견된 Plugin이 활성화, 비활성화, 차단, 또는 memory 같은 독점 슬롯용으로 선택되었는지 결정합니다.
3. **런타임 로드**
   네이티브 OpenClaw Plugin은 jiti를 통해 프로세스 내에서 로드되며
   기능을 중앙 레지스트리에 등록합니다. 호환되는 번들은 런타임 코드를 import하지 않고
   레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 도구, 채널, provider
   설정, 훅, HTTP 라우트, CLI 명령, 서비스를 노출합니다.

특히 Plugin CLI의 경우, 루트 명령 discovery는 두 단계로 나뉩니다:

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 옵니다
- 실제 Plugin CLI 모듈은 lazy 상태를 유지하다가 첫 호출 시 등록될 수 있습니다

이렇게 하면 OpenClaw가 파싱 전에 루트 명령 이름을 예약하면서도 Plugin 소유 CLI 코드를 Plugin 내부에 유지할 수 있습니다.

중요한 설계 경계:

- discovery + config 검증은 Plugin 코드를 실행하지 않고 **manifest/schema 메타데이터**만으로 동작해야 합니다
- 네이티브 런타임 동작은 Plugin 모듈의 `register(api)` 경로에서 옵니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에 config를 검증하고, 누락되거나 비활성화된 Plugin을 설명하고, UI/schema 힌트를 구성할 수 있습니다.

### 채널 Plugin과 공유 메시지 도구

채널 Plugin은 일반 채팅 작업을 위해 별도의 send/edit/react 도구를 등록할 필요가 없습니다. OpenClaw는 core에 하나의 공유 `message` 도구를 유지하고, 채널 Plugin은 그 뒤의 채널별 discovery 및 실행을 소유합니다.

현재 경계는 다음과 같습니다:

- core는 공유 `message` 도구 호스트, 프롬프트 연결, 세션/스레드 bookkeeping, 실행 디스패치를 소유
- 채널 Plugin은 범위 지정된 작업 discovery, 기능 discovery, 채널별 schema fragment를 소유
- 채널 Plugin은 대화 ID가 스레드 ID를 어떻게 인코딩하는지 또는 부모 대화에서 어떻게 상속하는지 같은 provider별 세션 대화 문법을 소유
- 채널 Plugin은 작업 어댑터를 통해 최종 작업을 실행

채널 Plugin의 경우 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 discovery
호출을 통해 Plugin은 표시되는 작업, 기능, schema 기여를 함께 반환할 수 있으므로,
이 요소들이 서로 어긋나지 않습니다.

채널별 메시지 도구 매개변수가 로컬 경로나 원격 미디어 URL 같은 미디어 소스를 담고 있을 때,
Plugin은 `describeMessageTool(...)`에서
`mediaSourceParams`도 반환해야 합니다. Core는 이 명시적 목록을 사용해 Plugin 소유 매개변수 이름을 하드코딩하지 않고도 sandbox 경로 정규화와 outbound 미디어 접근 힌트를 적용합니다.
여기서는 채널 전체의 평면 목록이 아니라 작업 범위 맵을 선호하세요. 그래야
프로필 전용 미디어 매개변수가 `send` 같은 관련 없는 작업에서 정규화되지 않습니다.

Core는 해당 discovery 단계에 런타임 범위를 전달합니다. 중요한 필드는 다음과 같습니다:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 수신 `requesterSenderId`

이는 컨텍스트 민감형 Plugin에서 중요합니다. 채널은
활성 계정, 현재 룸/스레드/메시지, 또는 신뢰된 요청자 신원에 따라
core `message` 도구에 채널별 분기를 하드코딩하지 않고도 메시지 작업을 숨기거나 노출할 수 있습니다.

이것이 내장 runner 라우팅 변경이 여전히 Plugin 작업인 이유입니다. runner는
현재 턴에 맞는 채널 소유 표면을 공유 `message` 도구가 노출할 수 있도록
현재 채팅/세션 신원을 Plugin discovery 경계로 전달할 책임이 있습니다.

채널 소유 실행 헬퍼의 경우, 번들 Plugin은 실행 런타임을
자기 확장 모듈 안에 유지해야 합니다. Core는 더 이상
`src/agents/tools` 아래의 Discord, Slack, Telegram, WhatsApp 메시지 작업 런타임을 소유하지 않습니다.
우리는 별도의 `plugin-sdk/*-action-runtime` 하위 경로를 공개하지 않으며,
번들 Plugin은 자기 확장 소유 모듈에서 로컬 런타임 코드를 직접 import해야 합니다.

같은 경계는 일반적인 provider 명명 SDK seam에도 적용됩니다. Core는
Slack, Discord, Signal, WhatsApp 또는 유사한 확장의 채널별 편의 barrel을 import해서는 안 됩니다. Core에 어떤 동작이 필요하다면, 번들 Plugin 자체의 `api.ts` / `runtime-api.ts` barrel을 소비하거나 필요를 공유 SDK의 좁은 일반 기능으로 승격해야 합니다.

특히 poll에는 두 가지 실행 경로가 있습니다:

- `outbound.sendPoll`은 공통 poll 모델에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 poll 의미론이나 추가 poll 매개변수에 권장되는 경로입니다

Core는 이제 Plugin poll 디스패치가 작업을 거절한 뒤에야 공유 poll 파싱을 지연하므로,
Plugin 소유 poll 핸들러가 일반 poll 파서에 먼저 막히지 않고 채널별 poll 필드를 받아들일 수 있습니다.

전체 시작 순서는 [Load pipeline](#load-pipeline)을 참조하세요.

## 기능 소유권 모델

OpenClaw는 네이티브 Plugin을 관련 없는 통합의 잡동사니가 아니라 **회사** 또는 **기능**의 소유권 경계로 취급합니다.

즉:

- 회사 Plugin은 보통 그 회사의 OpenClaw 대상 표면 전체를 소유해야 합니다
- 기능 Plugin은 보통 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 provider 동작을 임시방편으로 재구현하는 대신 공유 core 기능을 소비해야 합니다

예시:

- 번들 `openai` Plugin은 OpenAI 모델 provider 동작과 OpenAI
  음성 + 실시간 음성 + 미디어 이해 + 이미지 생성 동작을 소유합니다
- 번들 `elevenlabs` Plugin은 ElevenLabs 음성 동작을 소유합니다
- 번들 `microsoft` Plugin은 Microsoft 음성 동작을 소유합니다
- 번들 `google` Plugin은 Google 모델 provider 동작과 Google
  미디어 이해 + 이미지 생성 + 웹 검색 동작을 소유합니다
- 번들 `firecrawl` Plugin은 Firecrawl 웹 가져오기 동작을 소유합니다
- 번들 `minimax`, `mistral`, `moonshot`, `zai` Plugin은 각자의
  미디어 이해 백엔드를 소유합니다
- 번들 `qwen` Plugin은 Qwen 텍스트 provider 동작과
  미디어 이해 및 비디오 생성 동작을 소유합니다
- `voice-call` Plugin은 기능 Plugin입니다. 통화 전송, 도구,
  CLI, 라우트, Twilio 미디어 스트림 브리징을 소유하지만,
  vendor Plugin을 직접 import하는 대신 공유 음성과
  실시간 전사 및 실시간 음성 기능을 사용합니다

의도된 최종 상태는 다음과 같습니다:

- OpenAI는 텍스트 모델, 음성, 이미지, 미래의 비디오까지 걸쳐 있더라도 하나의 Plugin 안에 존재합니다
- 다른 vendor도 자기 표면 영역에 대해 같은 방식을 취할 수 있습니다
- 채널은 어떤 vendor Plugin이 provider를 소유하는지 신경 쓰지 않고, core가 노출하는 공유 기능 계약을 사용합니다

여기서 핵심 구분은 다음과 같습니다:

- **plugin** = 소유권 경계
- **capability** = 여러 Plugin이 구현하거나 사용할 수 있는 core 계약

따라서 OpenClaw가 비디오 같은 새 도메인을 추가할 때 첫 질문은
"어떤 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다.
첫 질문은 "core 비디오 기능 계약이 무엇인가?"입니다.
그 계약이 존재하면, vendor Plugin이 여기에 등록하고 채널/기능 Plugin이 이를 사용할 수 있습니다.

기능이 아직 존재하지 않는다면, 보통 올바른 접근은 다음과 같습니다:

1. core에 누락된 기능 정의
2. Plugin API/런타임을 통해 타입이 지정된 방식으로 노출
3. 채널/기능을 해당 기능에 연결
4. vendor Plugin이 구현을 등록하도록 함

이렇게 하면 소유권을 명확하게 유지하면서도,
단일 vendor나 일회성 Plugin 전용 코드 경로에 의존하는 core 동작을 피할 수 있습니다.

### 기능 계층화

코드가 어디에 속해야 하는지 판단할 때 다음 사고 모델을 사용하세요:

- **core capability 계층**: 공유 오케스트레이션, 정책, fallback, config
  병합 규칙, 전달 의미론, 타입 계약
- **vendor plugin 계층**: vendor별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 미래의 비디오 백엔드, 사용량 엔드포인트
- **channel/feature plugin 계층**: 공유 기능을 사용하고 표면에
  노출하는 Slack/Discord/voice-call 등 통합

예를 들어 TTS는 다음 형태를 따릅니다:

- core는 답장 시점 TTS 정책, fallback 순서, 기본 설정, 채널 전달을 소유
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유
- `voice-call`은 전화 통신 TTS 런타임 헬퍼를 사용

미래 기능에도 같은 패턴을 선호해야 합니다.

### 다중 기능 회사 Plugin 예시

회사 Plugin은 외부에서 볼 때 응집력 있게 느껴져야 합니다. OpenClaw에
모델, 음성, 실시간 전사, 실시간 음성, 미디어 이해,
이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색에 대한 공유 계약이 있다면,
vendor는 자기 표면 전체를 한 곳에서 소유할 수 있습니다:

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
- core는 여전히 기능 계약을 소유합니다
- 채널과 기능 Plugin은 vendor 코드가 아니라 `api.runtime.*` 헬퍼를 사용합니다
- 계약 테스트는 Plugin이 자신이 소유한다고 주장하는 기능을 실제로 등록했는지 검증할 수 있습니다

### 기능 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유
기능으로 취급합니다. 같은 소유권 모델이 여기에 적용됩니다:

1. core가 미디어 이해 계약을 정의
2. vendor Plugin은 해당되는 경우 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록
3. 채널과 기능 Plugin은 vendor 코드에 직접 연결하는 대신 공유 core 동작을 사용

이렇게 하면 한 provider의 비디오 가정을 core에 굳히지 않게 됩니다. Plugin은
vendor 표면을 소유하고, core는 기능 계약과 fallback 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. core가 타입이 지정된
기능 계약과 런타임 헬퍼를 소유하고, vendor Plugin이 여기에 대해
`api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 롤아웃 체크리스트가 필요하신가요? [Capability Cookbook](/ko/plugins/architecture)을 참조하세요.

## 계약과 강제

Plugin API 표면은 의도적으로 `OpenClawPluginApi`에
타입 지정되고 중앙화되어 있습니다. 이 계약은 지원되는 등록 지점과
Plugin이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유:

- Plugin 작성자는 하나의 안정적인 내부 표준을 얻습니다
- core는 두 Plugin이 같은 provider id를 등록하는 식의 중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있습니다
- 계약 테스트는 번들 Plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다

강제는 두 계층으로 이루어집니다:

1. **런타임 등록 강제**
   Plugin 레지스트리는 Plugin이 로드될 때 등록을 검증합니다. 예:
   중복 provider id, 중복 음성 provider id, 잘못된
   등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 Plugin은 테스트 실행 중 계약 레지스트리에 캡처되므로
   OpenClaw는 소유권을 명시적으로 검증할 수 있습니다. 현재는 모델
   provider, 음성 provider, 웹 검색 provider, 번들 등록 소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤
표면을 소유하는지 미리 안다는 것입니다. 이렇게 하면 소유권이
암묵적이 아니라 선언되고, 타입이 지정되며, 테스트 가능하기 때문에
core와 채널이 자연스럽게 조합될 수 있습니다.

### 계약에 포함되어야 하는 것

좋은 Plugin 계약은 다음과 같습니다:

- 타입이 지정되어 있음
- 작음
- 기능별로 구체적임
- core가 소유함
- 여러 Plugin이 재사용 가능함
- 채널/기능이 vendor 지식 없이 사용할 수 있음

나쁜 Plugin 계약은 다음과 같습니다:

- core에 숨겨진 vendor별 정책
- 레지스트리를 우회하는 일회성 Plugin 탈출구
- vendor 구현에 바로 접근하는 채널 코드
- `OpenClawPluginApi` 또는 `api.runtime`의 일부가 아닌 임시 런타임 객체

확신이 서지 않으면 추상화 수준을 높이세요. 먼저 기능을 정의하고, 그다음
Plugin이 거기에 연결되도록 하세요.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 **동일 프로세스 내에서**
실행됩니다. sandbox되지 않습니다. 로드된 네이티브 Plugin은
core 코드와 동일한 프로세스 수준의 신뢰 경계를 가집니다.

의미:

- 네이티브 Plugin은 도구, 네트워크 핸들러, 훅, 서비스를 등록할 수 있습니다
- 네이티브 Plugin 버그는 gateway를 크래시시키거나 불안정하게 만들 수 있습니다
- 악의적인 네이티브 Plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 같습니다

호환되는 번들은 OpenClaw가 현재 이를
메타데이터/콘텐츠 팩으로 취급하므로 기본적으로 더 안전합니다. 현재 릴리스에서는 주로
번들 Skills가 여기에 해당합니다.

번들이 아닌 Plugin에는 허용 목록과 명시적 설치/로드 경로를 사용하세요.
workspace Plugin은 프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 workspace 패키지 이름의 경우 Plugin id는 npm
이름에 고정되도록 유지하세요: 기본적으로 `@openclaw/<id>`,
또는 패키지가 의도적으로 더 좁은 Plugin 역할을 노출할 경우
`-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은 승인된 타입 접미사를 사용할 수 있습니다.

중요한 신뢰 참고:

- `plugins.allow`는 **plugin id**를 신뢰하며, 소스 출처를 신뢰하지는 않습니다.
- 번들 Plugin과 같은 id를 가진 workspace Plugin은
  해당 workspace Plugin이 활성화/허용 목록에 있으면 의도적으로 번들 복사본을 가립니다.
- 이것은 로컬 개발, 패치 테스트, 핫픽스에 정상적이고 유용합니다.
- 번들 Plugin 신뢰는 설치 메타데이터가 아니라 소스 스냅샷에서
  해석됩니다. 즉, 로드 시점 디스크의 manifest와 코드 기준입니다.
  손상되거나 대체된 설치 기록이 실제 소스가 주장하는 범위를 넘어
  번들 Plugin의 신뢰 표면을 조용히 넓힐 수는 없습니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 기능을 export합니다.

기능 등록은 공개 상태로 유지하세요. 계약이 아닌 헬퍼 export는 줄이세요:

- 번들 Plugin 전용 헬퍼 하위 경로
- 공개 API로 의도되지 않은 런타임 plumbing 하위 경로
- vendor별 편의 헬퍼
- 구현 세부 사항인 설정/온보딩 헬퍼

일부 번들 Plugin 헬퍼 하위 경로는 호환성과 번들 Plugin 유지보수를 위해 생성된 SDK export
맵에 여전히 남아 있습니다. 현재 예시로는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 여러 `plugin-sdk/matrix*` seam이 있습니다. 이러한 것들은
새로운 서드파티 Plugin에 권장되는 SDK 패턴이 아니라, 예약된 구현 세부 export로 취급하세요.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다:

1. 후보 Plugin 루트 발견
2. 네이티브 또는 호환 번들 manifest와 패키지 메타데이터 읽기
3. 안전하지 않은 후보 거부
4. Plugin config 정규화(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부 결정
6. 활성화된 네이티브 모듈 로드: 빌드된 번들 모듈은 네이티브 로더를 사용하고,
   빌드되지 않은 네이티브 Plugin은 jiti를 사용
7. 네이티브 `register(api)` 훅을 호출하고 등록 내용을 Plugin 레지스트리에 수집
8. 레지스트리를 명령/런타임 표면에 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다 — 로더는 존재하는 것을 해석하여 (`def.register ?? def.activate`) 같은 시점에 호출합니다. 모든 번들 Plugin은 `register`를 사용합니다. 새 Plugin에는 `register`를 선호하세요.
</Note>

안전 게이트는 런타임 실행 **이전**에 발생합니다. 진입점이 Plugin 루트 밖으로 벗어나거나, 경로가 world-writable이거나, 번들이 아닌 Plugin에서 경로 소유권이 의심스러우면 후보는 차단됩니다.

### Manifest 우선 동작

Manifest는 제어 평면의 기준 정보입니다. OpenClaw는 이를 사용해 다음을 수행합니다:

- Plugin 식별
- 선언된 채널/Skills/config schema 또는 번들 기능 발견
- `plugins.entries.<id>.config` 검증
- Control UI 라벨/플레이스홀더 보강
- 설치/카탈로그 메타데이터 표시
- Plugin 런타임을 로드하지 않고도 가벼운 활성화 및 설정 descriptor 유지

네이티브 Plugin에서 런타임 모듈은 데이터 평면 부분입니다. 이 모듈은
훅, 도구, 명령, provider 흐름 같은 실제 동작을 등록합니다.

선택적 manifest `activation` 및 `setup` 블록은 제어 평면에 머뭅니다.
이들은 활성화 계획과 설정 discovery를 위한 메타데이터 전용 descriptor이며,
런타임 등록, `register(...)`, `setupEntry`를 대체하지 않습니다.
첫 번째 실제 활성화 소비자는 이제 manifest의 명령, 채널, provider 힌트를 사용해
더 넓은 레지스트리 구체화 전에 Plugin 로드를 좁힙니다:

- CLI 로딩은 요청된 기본 명령을 소유한 Plugin으로 범위를 좁힙니다
- 채널 설정/Plugin 해석은 요청된
  채널 id를 소유한 Plugin으로 범위를 좁힙니다
- 명시적 provider 설정/런타임 해석은 요청된
  provider id를 소유한 Plugin으로 범위를 좁힙니다

설정 discovery는 이제 `setup.providers`, `setup.cliBackends` 같은 descriptor 소유 id를 우선 사용해
후보 Plugin 범위를 좁힌 뒤, 여전히 설정 시점 런타임 훅이 필요한 Plugin에 대해서만
`setup-api`로 fallback합니다. 둘 이상의 발견된 Plugin이 같은 정규화된 설정 provider 또는 CLI backend
id를 주장하면, 설정 조회는 discovery 순서에 의존하지 않고
그 모호한 소유자를 거부합니다.

### 로더가 캐시하는 것

OpenClaw는 다음에 대해 짧은 프로세스 내 캐시를 유지합니다:

- discovery 결과
- manifest 레지스트리 데이터
- 로드된 Plugin 레지스트리

이 캐시들은 갑작스러운 시작 부하와 반복 명령 오버헤드를 줄여 줍니다. 이를
영속 저장이 아니라 수명이 짧은 성능 캐시로 이해하면 됩니다.

성능 참고:

- 이 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- 캐시 창은 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 및
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정할 수 있습니다.

## 레지스트리 모델

로드된 Plugin은 임의의 core 전역 상태를 직접 수정하지 않습니다. 대신
중앙 Plugin 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다:

- Plugin 레코드(신원, 소스, 출처, 상태, 진단)
- 도구
- 레거시 훅 및 타입 지정 훅
- 채널
- provider
- Gateway RPC 핸들러
- HTTP 라우트
- CLI 등록기
- 백그라운드 서비스
- Plugin 소유 명령

그다음 core 기능은 Plugin 모듈과 직접 통신하는 대신 이 레지스트리를 읽습니다.
이렇게 하면 로딩이 한 방향으로 유지됩니다:

- Plugin 모듈 -> 레지스트리 등록
- core 런타임 -> 레지스트리 소비

이 분리는 유지보수성에 중요합니다. 즉, 대부분의 core 표면은
"모든 Plugin 모듈을 특수 처리"할 필요 없이
"레지스트리를 읽기"라는 하나의 통합 지점만 필요합니다.

## 대화 바인딩 콜백

대화를 바인딩하는 Plugin은 승인 해결 시 반응할 수 있습니다.

바인딩 요청이 승인되거나 거부된 뒤 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하세요:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 이제 이 plugin + conversation에 대한 바인딩이 존재합니다.
        console.log(event.binding?.conversationId);
        return;
      }

      // 요청이 거부되었습니다. 로컬 대기 상태를 정리하세요.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` 또는 `"deny"`
- `binding`: 승인된 요청에 대한 해석된 바인딩
- `request`: 원래 요청 요약, detach 힌트, 발신자 id,
  대화 메타데이터

이 콜백은 알림 전용입니다. 누가 대화를 바인딩할 수 있는지는 변경하지 않으며,
core 승인 처리가 끝난 뒤 실행됩니다.

## provider 런타임 훅

provider Plugin은 이제 두 계층을 가집니다:

- manifest 메타데이터: 런타임 로드 전에 저렴한 provider env 인증 조회를 위한 `providerAuthEnvVars`,
  인증을 공유하는 provider 변형을 위한 `providerAuthAliases`, 런타임
  로드 전에 저렴한 채널 env/설정 조회를 위한 `channelEnvVars`, 그리고 런타임 로드 전에
  저렴한 온보딩/인증 선택 라벨과 CLI 플래그 메타데이터를 위한
  `providerAuthChoices`
- config 시점 훅: `catalog` / 레거시 `discovery`와 `applyConfigDefaults`
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

OpenClaw는 여전히 일반적인 에이전트 루프, failover, transcript 처리,
도구 정책을 소유합니다. 이 훅들은
전체 사용자 지정 추론 전송이 없어도 provider별 동작을 확장할 수 있는 표면입니다.

provider에 env 기반 자격 증명이 있어 일반 인증/상태/모델 선택기 경로가
Plugin 런타임을 로드하지 않고도 이를 볼 수 있어야 한다면 manifest `providerAuthEnvVars`를 사용하세요.
하나의 provider id가 다른 provider id의 env 변수,
인증 프로필, config 기반 인증, API 키 온보딩 선택을 재사용해야 한다면 manifest `providerAuthAliases`를 사용하세요.
온보딩/인증 선택 CLI 표면이 provider 런타임 로드 없이도
provider의 choice id, 그룹 라벨, 단순 one-flag 인증 연결을 알아야 한다면 manifest `providerAuthChoices`를 사용하세요.
온보딩 라벨이나 OAuth
client-id/client-secret 설정 변수 같은 운영자 대상 힌트에는 provider 런타임 `envVars`를 유지하세요.

generic shell-env fallback, config/상태 검사, 설정 프롬프트가
채널 런타임 로드 없이도 env 기반 인증이나 설정을 봐야 하는 채널이라면
manifest `channelEnvVars`를 사용하세요.

### 훅 순서와 사용 시점

모델/provider Plugin의 경우 OpenClaw는 대략 다음 순서로 훅을 호출합니다.
"언제 사용할지" 열은 빠른 판단 가이드입니다.

| #   | 훅                                | 수행하는 작업                                                                                                   | 사용 시점                                                                                                                                      |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 `models.providers`에 provider config 게시                                                | provider가 카탈로그 또는 기본 base URL 값을 소유할 때                                                                                         |
| 2   | `applyConfigDefaults`             | config 구체화 중 provider 소유 전역 config 기본값 적용                                                         | 기본값이 인증 모드, env 또는 provider 모델 계열 의미론에 따라 달라질 때                                                                      |
| --  | _(내장 모델 조회)_                | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도함                                                         | _(Plugin 훅이 아님)_                                                                                                                          |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 미리보기 model-id 별칭 정규화                                                            | provider가 정식 모델 해석 전에 별칭 정리를 소유할 때                                                                                          |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 provider 계열의 `api` / `baseUrl` 정규화                                                   | 같은 전송 계열 내 사용자 지정 provider id에 대한 전송 정리를 provider가 소유할 때                                                            |
| 5   | `normalizeConfig`                 | 런타임/provider 해석 전에 `models.providers.<id>` 정규화                                                       | provider에 Plugin과 함께 있어야 하는 config 정리가 필요할 때. 번들 Google 계열 헬퍼도 여기서 지원되는 Google config 항목을 보완합니다       |
| 6   | `applyNativeStreamingUsageCompat` | config provider에 네이티브 스트리밍 사용량 호환성 재작성 적용                                                  | provider에 엔드포인트 기반 네이티브 스트리밍 사용량 메타데이터 수정이 필요할 때                                                              |
| 7   | `resolveConfigApiKey`             | 런타임 인증 로드 전에 config provider의 env-marker 인증 해석                                                   | provider가 provider 소유 env-marker API 키 해석을 가질 때. `amazon-bedrock`도 여기서 내장 AWS env-marker 해석기를 가집니다                  |
| 8   | `resolveSyntheticAuth`            | 평문을 저장하지 않고 로컬/셀프 호스팅 또는 config 기반 인증을 노출                                              | provider가 synthetic/local 자격 증명 마커로 동작할 수 있을 때                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | provider 소유 외부 인증 프로필 오버레이. 기본 `persistence`는 CLI/앱 소유 자격 증명에 대해 `runtime-only`     | provider가 복사된 refresh 토큰을 저장하지 않고 외부 인증 자격 증명을 재사용할 때. manifest에 `contracts.externalAuthProviders`를 선언하세요 |
| 10  | `shouldDeferSyntheticProfileAuth` | env/config 기반 인증보다 저장된 synthetic 프로필 플레이스홀더의 우선순위를 낮춤                                | provider가 우선순위에서 이기면 안 되는 synthetic 플레이스홀더 프로필을 저장할 때                                                             |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 provider 소유 model id에 대한 동기 fallback                                        | provider가 임의의 업스트림 model id를 허용할 때                                                                                               |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`을 다시 실행                                                              | provider가 알 수 없는 id를 해석하기 전에 네트워크 메타데이터가 필요할 때                                                                      |
| 13  | `normalizeResolvedModel`          | 내장 runner가 해석된 모델을 사용하기 전 최종 재작성                                                            | provider가 전송 재작성이 필요하지만 여전히 core 전송을 사용할 때                                                                              |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 전송 뒤에 있는 vendor 모델에 대한 호환성 플래그 기여                                                  | provider가 provider를 직접 차지하지 않고도 프록시 전송에서 자신의 모델을 인식할 때                                                           |
| 15  | `capabilities`                    | 공유 core 로직에서 사용하는 provider 소유 transcript/도구 메타데이터                                            | provider에 transcript/provider 계열별 특이점이 필요할 때                                                                                      |
| 16  | `normalizeToolSchemas`            | 내장 runner가 보기 전에 도구 스키마 정규화                                                                      | provider에 전송 계열 스키마 정리가 필요할 때                                                                                                  |
| 17  | `inspectToolSchemas`              | 정규화 후 provider 소유 스키마 진단 노출                                                                        | core에 provider별 규칙을 가르치지 않고도 provider가 키워드 경고를 제공하려 할 때                                                             |
| 18  | `resolveReasoningOutputMode`      | 네이티브 vs 태그된 추론 출력 계약 선택                                                                          | provider에 네이티브 필드 대신 태그된 추론/최종 출력이 필요할 때                                                                               |
| 19  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 매개변수 정규화                                                                 | provider에 기본 요청 매개변수 또는 provider별 매개변수 정리가 필요할 때                                                                       |
| 20  | `createStreamFn`                  | 일반 스트림 경로를 사용자 지정 전송으로 완전히 대체                                                             | provider에 래퍼가 아니라 사용자 지정 와이어 프로토콜이 필요할 때                                                                               |
| 21  | `wrapStreamFn`                    | 일반 래퍼 적용 후 스트림 래퍼                                                                                   | provider에 사용자 지정 전송 없이 요청 헤더/본문/모델 호환성 래퍼가 필요할 때                                                                 |
| 22  | `resolveTransportTurnState`       | 네이티브 턴별 전송 헤더 또는 메타데이터 첨부                                                                    | provider가 일반 전송에서 provider 네이티브 턴 신원을 보내도록 하려 할 때                                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 쿨다운 정책 첨부                                                              | provider가 일반 WS 전송에서 세션 헤더 또는 fallback 정책을 조정하려 할 때                                                                    |
| 24  | `formatApiKey`                    | 인증 프로필 포매터: 저장된 프로필을 런타임 `apiKey` 문자열로 변환                                               | provider가 추가 인증 메타데이터를 저장하고 사용자 지정 런타임 토큰 형식이 필요할 때                                                          |
| 25  | `refreshOAuth`                    | 사용자 지정 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh 재정의                               | provider가 공유 `pi-ai` refresher에 맞지 않을 때                                                                                              |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                        | provider에 refresh 실패 후 provider 소유 인증 복구 안내가 필요할 때                                                                           |
| 27  | `matchesContextOverflowError`     | provider 소유 컨텍스트 창 초과 오류 매처                                                                        | provider에 일반 휴리스틱이 놓치는 원시 overflow 오류가 있을 때                                                                                |
| 28  | `classifyFailoverReason`          | provider 소유 failover 사유 분류                                                                                | provider가 원시 API/전송 오류를 rate-limit/overload 등으로 매핑할 수 있을 때                                                                 |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 provider용 프롬프트 캐시 정책                                                                       | provider에 프록시별 캐시 TTL 게이팅이 필요할 때                                                                                                |
| 30  | `buildMissingAuthMessage`         | 일반 missing-auth 복구 메시지를 대체                                                                            | provider에 provider별 missing-auth 복구 힌트가 필요할 때                                                                                      |
| 31  | `suppressBuiltInModel`            | 오래된 업스트림 모델 숨김 및 선택적 사용자 대상 오류 힌트                                                       | provider가 오래된 업스트림 행을 숨기거나 vendor 힌트로 대체해야 할 때                                                                         |
| 32  | `augmentModelCatalog`             | discovery 후 synthetic/final 카탈로그 행 추가                                                                   | provider에 `models list` 및 선택기용 synthetic forward-compat 행이 필요할 때                                                                  |
| 33  | `resolveThinkingProfile`          | 모델별 `/think` 수준 집합, 표시 라벨, 기본값                                                                    | provider가 선택된 모델에 대해 사용자 지정 사고 수준 체계 또는 이진 라벨을 노출할 때                                                           |
| 34  | `isBinaryThinking`                | 켜기/끄기 추론 토글 호환성 훅                                                                                   | provider가 이진 사고 on/off만 노출할 때                                                                                                        |
| 35  | `supportsXHighThinking`           | `xhigh` 추론 지원 호환성 훅                                                                                     | provider가 일부 모델 집합에서만 `xhigh`를 원할 때                                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | 기본 `/think` 수준 호환성 훅                                                                                    | provider가 모델 계열의 기본 `/think` 정책을 소유할 때                                                                                         |
| 37  | `isModernModelRef`                | 라이브 프로필 필터와 스모크 선택을 위한 modern-model 매처                                                     | provider가 라이브/스모크 선호 모델 매칭을 소유할 때                                                                                           |
| 38  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                                                     | provider에 토큰 교환 또는 수명이 짧은 요청 자격 증명이 필요할 때                                                                             |
| 39  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면용 사용량/과금 자격 증명 해석                                                       | provider에 사용자 지정 사용량/할당량 토큰 파싱 또는 다른 사용량 자격 증명이 필요할 때                                                       |
| 40  | `fetchUsageSnapshot`              | 인증 해석 후 provider별 사용량/할당량 스냅샷 가져오기 및 정규화                                                | provider에 provider별 사용량 엔드포인트 또는 페이로드 파서가 필요할 때                                                                       |
| 41  | `createEmbeddingProvider`         | memory/search용 provider 소유 임베딩 어댑터 빌드                                                               | 메모리 임베딩 동작이 provider Plugin과 함께 있어야 할 때                                                                                     |
| 42  | `buildReplayPolicy`               | provider의 transcript 처리를 제어하는 replay 정책 반환                                                        | provider에 사용자 지정 transcript 정책이 필요할 때(예: 사고 블록 제거)                                                                       |
| 43  | `sanitizeReplayHistory`           | 일반 transcript 정리 후 replay 기록 재작성                                                                     | provider에 공유 Compaction 헬퍼를 넘는 provider별 replay 재작성 필요                                                                         |
| 44  | `validateReplayTurns`             | 내장 runner 이전 최종 replay 턴 검증 또는 형태 조정                                                            | provider 전송에 일반 정리 후 더 엄격한 턴 검증이 필요할 때                                                                                   |
| 45  | `onModelSelected`                 | provider 소유 모델 선택 후 부수 효과 실행                                                                      | 모델이 활성화될 때 provider에 텔레메트리나 provider 소유 상태가 필요할 때                                                                    |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저
일치한 provider Plugin을 확인하고, 이후 실제로 model id나 transport/config를 바꾸는 훅이 나올 때까지
다른 훅 가능 provider Plugin으로 계속 진행합니다. 이렇게 하면
호출자가 어떤 번들 Plugin이 재작성을 소유하는지 알 필요 없이
별칭/호환 provider shim이 계속 동작합니다. 어떤 provider 훅도 지원되는
Google 계열 config 항목을 재작성하지 않으면, 번들 Google config 정규화기가
여전히 해당 호환성 정리를 적용합니다.

provider에 완전히 사용자 지정된 와이어 프로토콜이나 사용자 지정 요청 실행기가 필요하다면,
그건 다른 종류의 확장입니다. 이 훅들은 여전히
OpenClaw의 일반 추론 루프에서 동작하는 provider 동작을 위한 것입니다.

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

번들 provider Plugin은 각
vendor의 카탈로그, 인증, 사고, replay, 사용량 추적 요구에 맞춰 위 훅들을 조합해 사용합니다. provider별 정확한
훅 집합은 `extensions/` 아래 Plugin 소스에 있으므로,
여기 내용을 복제하기보다 이를 기준 정보로 취급하세요.

예시 패턴:

- **패스스루 카탈로그 provider**(OpenRouter, Kilocode, Z.AI, xAI)는
  `catalog`와 `resolveDynamicModel`/`prepareDynamicModel`을 등록해
  OpenClaw의 정적 카탈로그보다 먼저 업스트림 model id를 노출할 수 있게 합니다.
- **OAuth + 사용량 엔드포인트 provider**(GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai)는 `prepareRuntimeAuth` 또는 `formatApiKey`를
  `resolveUsageAuth` + `fetchUsageSnapshot`과 결합해 토큰 교환과
  `/usage` 통합을 소유합니다.
- **Replay / transcript 정리**는 명명된 계열을 통해 공유됩니다:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. provider는 transcript 정리를 각각 구현하는 대신
  `buildReplayPolicy`를 통해 참여합니다.
- **카탈로그 전용** 번들 provider(`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`)는 `catalog`만 등록하고
  공유 추론 루프를 사용합니다.
- **Anthropic 전용 스트림 헬퍼**(beta 헤더, `/fast`/`serviceTier`,
  `context1m`)는 일반 SDK가 아니라 Anthropic 번들 Plugin의 공개 `api.ts` /
  `contract-api.ts` seam 내부(`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`)에 있습니다.

## 런타임 헬퍼

Plugin은 `api.runtime`를 통해 선택된 core 헬퍼에 접근할 수 있습니다. TTS 예시:

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

- `textToSpeech`는 파일/음성 메모 표면용 일반 core TTS 출력 페이로드를 반환합니다.
- core `messages.tts` config와 provider 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플레이트를 반환합니다. Plugin은 provider에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 provider별로 선택 사항입니다. vendor 소유 음성 선택기나 설정 흐름에 사용하세요.
- 음성 목록에는 locale, gender, personality 태그 같은 더 풍부한 메타데이터가 포함될 수 있어 provider 인식 선택기에 활용할 수 있습니다.
- 현재 OpenAI와 ElevenLabs는 전화 통신을 지원합니다. Microsoft는 지원하지 않습니다.

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

- TTS 정책, fallback, 답장 전달은 core에 두세요.
- vendor 소유 합성 동작에는 음성 provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider id로 정규화됩니다.
- 선호되는 소유권 모델은 회사 중심입니다. OpenClaw가 이러한
  기능 계약을 추가함에 따라 하나의 vendor Plugin이
  텍스트, 음성, 이미지, 미래의 미디어 provider를 함께 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우, Plugin은 일반 key/value bag 대신
하나의 타입 지정된 미디어 이해 provider를 등록합니다:

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

- 오케스트레이션, fallback, config, 채널 연결은 core에 두세요.
- vendor 동작은 provider Plugin에 두세요.
- 점진적 확장은 타입이 유지되어야 합니다: 새로운 선택적 메서드, 새로운 선택적
  결과 필드, 새로운 선택적 기능.
- 비디오 생성도 이미 같은 패턴을 따릅니다:
  - core가 기능 계약과 런타임 헬퍼를 소유
  - vendor Plugin은 `api.registerVideoGenerationProvider(...)`를 등록
  - 기능/채널 Plugin은 `api.runtime.videoGeneration.*`를 사용

미디어 이해 런타임 헬퍼의 경우, Plugin은 다음을 호출할 수 있습니다:

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

오디오 전사의 경우, Plugin은 미디어 이해 런타임
또는 이전 STT 별칭을 사용할 수 있습니다:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME을 신뢰성 있게 추론할 수 없을 때 선택 사항:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`는
  이미지/오디오/비디오 이해에 권장되는 공유 표면입니다.
- core 미디어 이해 오디오 config(`tools.media.audio`)와 provider fallback 순서를 사용합니다.
- 전사 출력이 생성되지 않으면(예: 건너뜀/미지원 입력) `{ text: undefined }`를 반환합니다.
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

- `provider`와 `model`은 영속 세션 변경이 아니라 실행별 선택적 재정의입니다.
- OpenClaw는 신뢰된 호출자에 대해서만 이러한 재정의 필드를 허용합니다.
- Plugin 소유 fallback 실행의 경우 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 옵트인해야 합니다.
- 신뢰된 Plugin을 특정 정식 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하고, 임의의 대상을 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰되지 않은 Plugin의 subagent 실행도 계속 동작하지만, 재정의 요청은 조용히 fallback되지 않고 거부됩니다.

웹 검색의 경우, Plugin은 에이전트 도구 연결에 직접 접근하는 대신
공유 런타임 헬퍼를 사용할 수 있습니다:

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

Plugin은
`api.registerWebSearchProvider(...)`를 통해 웹 검색 provider를 등록할 수도 있습니다.

참고:

- provider 선택, 자격 증명 해석, 공유 요청 의미론은 core에 두세요.
- vendor별 검색 전송에는 웹 검색 provider를 사용하세요.
- `api.runtime.webSearch.*`는 에이전트 도구 래퍼에 의존하지 않고 검색 동작이 필요한 기능/채널 Plugin에 권장되는 공유 표면입니다.

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
- `listProviders(...)`: 사용 가능한 이미지 생성 provider와 그 기능을 나열합니다.

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

- `path`: gateway HTTP 서버 아래의 라우트 경로.
- `auth`: 필수. 일반 gateway 인증을 요구하려면 `"gateway"`를, Plugin 관리 인증/Webhook 검증에는 `"plugin"`을 사용합니다.
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`.
- `replaceExisting`: 선택 사항. 같은 Plugin이 자신의 기존 라우트 등록을 교체할 수 있게 합니다.
- `handler`: 라우트가 요청을 처리했으면 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 Plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin 라우트는 `auth`를 명시적으로 선언해야 합니다.
- 정확히 같은 `path + match` 충돌은 `replaceExisting: true`가 아닌 한 거부되며, 한 Plugin이 다른 Plugin의 라우트를 교체할 수는 없습니다.
- `auth` 수준이 다른 중첩 라우트는 거부됩니다. `exact`/`prefix` 폴스루 체인은 같은 인증 수준 안에서만 유지하세요.
- `auth: "plugin"` 라우트는 **자동으로** operator 런타임 범위를 받지 않습니다. 이는 권한 있는 Gateway 헬퍼 호출이 아니라 Plugin 관리 Webhook/서명 검증용입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 범위 안에서 실행되지만, 그 범위는 의도적으로 보수적입니다:
  - 공유 비밀 bearer 인증(`gateway.auth.mode = "token"` / `"password"`)에서는 호출자가 `x-openclaw-scopes`를 보내더라도 plugin-route 런타임 범위가 `operator.write`에 고정됩니다
  - 신뢰된 신원 기반 HTTP 모드(예: `trusted-proxy` 또는 비공개 수신에서의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 있을 때만 `x-openclaw-scopes`를 존중합니다
  - 이러한 신원 기반 plugin-route 요청에 `x-openclaw-scopes`가 없으면, 런타임 범위는 `operator.write`로 fallback합니다
- 실용적인 규칙: gateway 인증 Plugin 라우트를 암묵적인 관리자 표면으로 가정하지 마세요. 라우트에 관리자 전용 동작이 필요하다면, 신원 기반 인증 모드를 요구하고 명시적 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK import 경로

새 Plugin을 작성할 때는 단일한 `openclaw/plugin-sdk` 루트
barrel 대신 좁은 SDK 하위 경로를 사용하세요. Core 하위 경로:

| 하위 경로                            | 용도                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 등록 기본 요소                              |
| `openclaw/plugin-sdk/channel-core`  | 채널 엔트리/빌드 헬퍼                              |
| `openclaw/plugin-sdk/core`          | 일반 공유 헬퍼와 우산형 계약                       |
| `openclaw/plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마(`OpenClawSchema`)  |

채널 Plugin은 더 좁은 seam 계열에서 선택합니다 — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`. 승인 동작은 관련 없는
Plugin 필드 여러 곳을 섞는 대신 하나의 `approvalCapability` 계약으로 통합해야 합니다.
자세한 내용은 [Channel plugins](/ko/plugins/sdk-channel-plugins)를 참조하세요.

런타임 및 config 헬퍼는 일치하는 `*-runtime` 하위 경로 아래에 있습니다
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` 등).

<Info>
`openclaw/plugin-sdk/channel-runtime`은 deprecated 상태이며, 오래된 Plugin을 위한 호환성 shim입니다. 새 코드는 더 좁은 일반 기본 요소를 import해야 합니다.
</Info>

저장소 내부 엔트리 포인트(번들 Plugin 패키지 루트별):

- `index.js` — 번들 Plugin 엔트리
- `api.js` — 헬퍼/타입 barrel
- `runtime-api.js` — 런타임 전용 barrel
- `setup-entry.js` — 설정 Plugin 엔트리

외부 Plugin은 `openclaw/plugin-sdk/*` 하위 경로만 import해야 합니다.
core나 다른 Plugin에서 다른 Plugin 패키지의 `src/*`를 절대 import하지 마세요.
Facade로 로드된 엔트리 포인트는 활성 런타임 config 스냅샷이 있으면 이를 우선 사용하고,
없으면 디스크에서 해석된 config 파일로 fallback합니다.

`image-generation`, `media-understanding`,
`speech` 같은 기능별 하위 경로는 번들 Plugin이 현재 사용하기 때문에 존재합니다. 이들이
자동으로 장기 고정 외부 계약이 되는 것은 아니므로, 의존할 때는 관련 SDK
참조 페이지를 확인하세요.

## 메시지 도구 스키마

Plugin은 반응, 읽음, poll 같은 메시지가 아닌 기본 요소에 대해
채널별 `describeMessageTool(...)` 스키마 기여를 소유해야 합니다.
공유 send 표현은 provider 네이티브 버튼, 컴포넌트, 블록, 카드 필드 대신
일반 `MessagePresentation` 계약을 사용해야 합니다.
계약, fallback 규칙, provider 매핑, Plugin 작성자 체크리스트는 [Message Presentation](/ko/plugins/message-presentation)을 참조하세요.

전송 가능한 Plugin은 메시지 기능을 통해 자신이 렌더링할 수 있는 것을 선언합니다:

- 의미론적 표현 블록(`text`, `context`, `divider`, `buttons`, `select`)용 `presentation`
- 고정 전달 요청용 `delivery-pin`

core는 표현을 네이티브로 렌더링할지, 텍스트로 강등할지 결정합니다.
일반 메시지 도구에서 provider 네이티브 UI 탈출구를 노출하지 마세요.
레거시 네이티브 스키마용 deprecated SDK 헬퍼는 기존
서드파티 Plugin을 위해 계속 export되지만, 새 Plugin은 이를 사용하지 말아야 합니다.

## 채널 대상 해석

채널 Plugin은 채널별 대상 의미론을 소유해야 합니다. 공유
outbound 호스트는 일반 상태로 유지하고, provider 규칙에는 메시징 어댑터 표면을 사용하세요:

- `messaging.inferTargetChatType({ to })`는 정규화된 대상이
  디렉터리 조회 전에 `direct`, `group`, `channel` 중 무엇으로 취급되어야 하는지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 입력이
  디렉터리 검색 대신 ID 유사 해석으로 바로 넘어가야 하는지 core에 알려 줍니다.
- `messaging.targetResolver.resolveTarget(...)`는
  정규화 후 또는 디렉터리 실패 후 최종 provider 소유 해석이 필요할 때 Plugin fallback입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 해석된 후
  provider별 세션 라우트 구성을 소유합니다.

권장 분리:

- peer/group 검색 전에 이루어져야 하는 범주 결정에는 `inferTargetChatType`을 사용하세요.
- "이것을 명시적/네이티브 대상 ID로 취급" 검사에는 `looksLikeId`를 사용하세요.
- 광범위한 디렉터리 검색이 아니라 provider별 정규화 fallback에는 `resolveTarget`을 사용하세요.
- chat id, thread id, JID, handle, room id 같은 provider 네이티브 ID는
  일반 SDK 필드가 아니라 `target` 값 또는 provider별 매개변수 내부에 유지하세요.

## config 기반 디렉터리

config에서 디렉터리 항목을 파생하는 Plugin은 그 로직을
Plugin 내부에 두고,
`openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

다음과 같은 config 기반 peer/group가 필요한 채널에서 사용하세요:

- allowlist 기반 DM peer
- 구성된 채널/그룹 맵
- 계정 범위의 정적 디렉터리 fallback

`directory-runtime`의 공유 헬퍼는 일반 작업만 처리합니다:

- 쿼리 필터링
- limit 적용
- 중복 제거/정규화 헬퍼
- `ChannelDirectoryEntry[]` 빌드

채널별 계정 검사와 ID 정규화는 Plugin 구현 내부에 남겨 두어야 합니다.

## provider 카탈로그

provider Plugin은
`registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가
`models.providers`에 기록하는 것과 같은 형태를 반환합니다:

- 하나의 provider 항목인 경우 `{ provider }`
- 여러 provider 항목인 경우 `{ providers }`

Plugin이 provider별 model id, 기본 base URL 값,
또는 인증으로 제한된 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 Plugin의 카탈로그가 OpenClaw 내장 암시적 provider에 비해
언제 병합될지를 제어합니다:

- `simple`: 평범한 API 키 또는 env 기반 provider
- `profile`: 인증 프로필이 있을 때 나타나는 provider
- `paired`: 여러 관련 provider 항목을 합성하는 provider
- `late`: 다른 암시적 provider 뒤의 마지막 단계

나중 provider가 키 충돌에서 우선하므로, Plugin은
같은 provider id를 가진 내장 provider 항목을 의도적으로 재정의할 수 있습니다.

호환성:

- `discovery`는 여전히 레거시 별칭으로 동작합니다
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용합니다

## 읽기 전용 채널 검사

Plugin이 채널을 등록한다면,
`resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)` 구현을 선호하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이
  완전히 구체화되었다고 가정할 수 있으며, 필요한 비밀이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름 같은 읽기 전용 명령 경로는 구성을 설명하기 위해 런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명용 계정 상태만 반환하세요.
- `enabled`와 `configured`를 유지하세요.
- 관련 있는 경우 다음과 같은 자격 증명 소스/상태 필드를 포함하세요:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다.
  상태 스타일 명령에는 `tokenStatus: "available"`(및 일치하는 source 필드)로 충분합니다.
- 자격 증명이 SecretRef로 구성되어 있지만
  현재 명령 경로에서 사용할 수 없는 경우 `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 크래시하거나 계정이 구성되지 않은 것으로 잘못 보고하는 대신
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

각 항목은 하나의 Plugin이 됩니다. 팩에 여러 extension이 있으면 Plugin id는
`name/<fileBase>`가 됩니다.

Plugin이 npm 의존성을 import한다면,
해당 디렉터리에 의존성을 설치해 `node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은
심볼릭 링크 해석 후에도 Plugin 디렉터리 안에 있어야 합니다. 패키지 디렉터리 밖으로 벗어나는 항목은
거부됩니다.

보안 참고: `openclaw plugins install`은 Plugin 의존성을
`npm install --omit=dev --ignore-scripts`로 설치합니다(수명 주기 스크립트 없음, 런타임 시 dev 의존성 없음). Plugin 의존성 트리는
"순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 설정 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 채널 Plugin에 대한 설정 표면이 필요하거나,
채널 Plugin이 활성화되었지만 아직 구성되지 않은 경우에는 전체 Plugin 엔트리 대신
`setupEntry`를 로드합니다. 이렇게 하면 메인 Plugin 엔트리가
도구, 훅 또는 기타 런타임 전용 코드를 연결하더라도
시작 및 설정을 더 가볍게 유지할 수 있습니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은
채널 Plugin이 이미 구성된 경우에도 gateway의
pre-listen 시작 단계 동안 같은 `setupEntry` 경로를 선택적으로 사용하게 할 수 있습니다.

이 옵션은 `setupEntry`가 gateway가 리슨을 시작하기 전에 반드시 존재해야 하는
시작 표면을 완전히 포함할 때만 사용하세요. 실제로는 설정 엔트리가
시작이 의존하는 모든 채널 소유 기능을 등록해야 함을 의미합니다. 예:

- 채널 등록 자체
- gateway가 리슨을 시작하기 전에 사용 가능해야 하는 모든 HTTP 라우트
- 같은 시점에 존재해야 하는 모든 gateway 메서드, 도구, 서비스

전체 엔트리가 여전히 필요한 시작 기능을 하나라도 소유하고 있다면
이 플래그를 활성화하지 마세요. 기본 동작을 유지하고 OpenClaw가 시작 중
전체 엔트리를 로드하게 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 core가 조회할 수 있는
설정 전용 계약 표면 헬퍼도 게시할 수 있습니다. 현재 설정
승격 표면은 다음과 같습니다:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core는 레거시 단일 계정 채널
config를 전체 Plugin 엔트리를 로드하지 않고도 `channels.<id>.accounts.*`로 승격해야 할 때
이 표면을 사용합니다.
현재 번들 예시는 Matrix입니다. Matrix는 명명된 계정이 이미 있을 때 인증/부트스트랩 키만 명명된 승격 계정으로 옮기고,
항상 `accounts.default`를 만드는 대신 구성된 비표준 기본 계정 키를 유지할 수 있습니다.

이러한 설정 패치 어댑터는 번들 계약 표면 discovery를 lazy 상태로 유지합니다.
import 시점은 가볍게 유지되고, 승격 표면은 모듈 import 중 번들 채널 시작에 재진입하는 대신
첫 사용 시에만 로드됩니다.

이러한 시작 표면에 gateway RPC 메서드가 포함될 때는
Plugin 전용 접두사를 유지하세요. Core 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며, Plugin이 더 좁은 범위를 요청하더라도
항상 `operator.admin`으로 해석됩니다.

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

채널 Plugin은 `openclaw.channel`을 통해 설정/discovery 메타데이터를,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 core 카탈로그에 데이터가 들어가지 않습니다.

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

유용한 `openclaw.channel` 필드(최소 예시 외):

- `detailLabel`: 더 풍부한 카탈로그/상태 표면용 보조 라벨
- `docsLabel`: docs 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 더 낮은 우선순위의 plugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면용 문구 제어
- `markdownCapable`: outbound 포맷 결정 시 채널이 markdown을 지원함을 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 setup/configure 선택기에서 채널 숨김
- `exposure.docs`: docs 탐색 표면에서 채널을 internal/private로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭, 가능하면 `exposure`를 선호
- `quickstartAllowFrom`: 채널을 표준 quickstart `allowFrom` 흐름에 옵트인
- `forceAccountBinding`: 계정이 하나만 있어도 명시적 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: announce 대상을 해석할 때 세션 조회를 우선

OpenClaw는 **외부 채널 카탈로그**도 병합할 수 있습니다(예: MPM
레지스트리 export). 다음 경로 중 하나에 JSON 파일을 두세요:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를
하나 이상의 JSON 파일로 지정하세요(쉼표/세미콜론/`PATH` 구분). 각 파일은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를
포함해야 합니다. 파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

## 컨텍스트 엔진 Plugin

컨텍스트 엔진 Plugin은 수집, 조립,
Compaction을 위한 세션 컨텍스트 오케스트레이션을 소유합니다. Plugin에서
`api.registerContextEngine(id, factory)`로 등록한 뒤, 활성 엔진은
`plugins.slots.contextEngine`으로 선택합니다.

기본 컨텍스트
파이프라인을 단순히 메모리 검색이나 훅 추가 수준이 아니라 교체하거나 확장해야 할 때 사용하세요.

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

엔진이 **Compaction** 알고리즘을 소유하지 않는다면 `compact()`는
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

## 새 기능 추가하기

Plugin에 현재 API에 맞지 않는 동작이 필요하다면, 비공개 직접 접근으로
Plugin 시스템을 우회하지 마세요. 누락된 기능을 추가하세요.

권장 순서:

1. core 계약 정의
   core가 어떤 공유 동작을 소유해야 하는지 결정합니다: 정책, fallback, config 병합,
   수명 주기, 채널 대상 의미론, 런타임 헬퍼 형태.
2. 타입이 지정된 Plugin 등록/런타임 표면 추가
   `OpenClawPluginApi` 및/또는 `api.runtime`를 가장 작은 유용한
   타입 기능 표면으로 확장합니다.
3. core + 채널/기능 소비자 연결
   채널과 기능 Plugin은 vendor 구현을 직접 import하지 말고
   core를 통해 새 기능을 사용해야 합니다.
4. vendor 구현 등록
   그다음 vendor Plugin이 해당 기능에 대해 자신의 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 특정
provider의 세계관에 하드코딩되지 않으면서도 분명한 방향성을 유지하는 방법입니다. 구체적인 파일 체크리스트와 예시는
[Capability Cookbook](/ko/plugins/architecture)을 참조하세요.

### 기능 체크리스트

새 기능을 추가할 때 구현은 보통 다음 표면을 함께 건드려야 합니다:

- `src/<capability>/types.ts`의 core 계약 타입
- `src/<capability>/runtime.ts`의 core runner/런타임 헬퍼
- `src/plugins/types.ts`의 Plugin API 등록 표면
- `src/plugins/registry.ts`의 Plugin 레지스트리 연결
- 기능/채널 Plugin이 사용할 필요가 있을 때 `src/plugins/runtime/*`의 Plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 헬퍼
- `src/plugins/contracts/registry.ts`의 소유권/계약 검증
- `docs/`의 운영자/Plugin 문서

이 표면 중 하나라도 빠져 있다면, 대개 그 기능이 아직 완전히 통합되지 않았다는 신호입니다.

### 기능 템플릿

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

// feature/channel plugins용 공유 런타임 헬퍼
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

계약 테스트 패턴:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순하게 유지됩니다:

- core는 기능 계약 + 오케스트레이션을 소유
- vendor Plugin은 vendor 구현을 소유
- 기능/채널 Plugin은 런타임 헬퍼를 사용
- 계약 테스트는 소유권을 명시적으로 유지
