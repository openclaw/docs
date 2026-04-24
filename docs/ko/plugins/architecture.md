---
read_when:
    - 네이티브 OpenClaw Plugin을 빌드하거나 디버깅하는 중
    - Plugin 기능 모델 또는 소유권 경계를 이해하기
    - Plugin 로드 파이프라인 또는 레지스트리 작업 중
    - provider 런타임 훅 또는 채널 Plugin 구현 중
sidebarTitle: Internals
summary: 'Plugin 내부: 기능 모델, 소유권, 계약, 로드 파이프라인 및 런타임 헬퍼'
title: Plugin 내부
x-i18n:
    generated_at: "2026-04-24T08:58:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

이 문서는 OpenClaw Plugin 시스템의 **심층 아키텍처 참조**입니다. 실용적인 가이드는 아래의 집중된 페이지 중 하나에서 시작하세요.

<CardGroup cols={2}>
  <Card title="Plugin 설치 및 사용" icon="plug" href="/ko/tools/plugin">
    Plugin 추가, 활성화 및 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 빌드" icon="rocket" href="/ko/plugins/building-plugins">
    가장 작은 동작 Manifest로 시작하는 첫 Plugin 튜토리얼입니다.
  </Card>
  <Card title="채널 Plugin" icon="comments" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin을 빌드합니다.
  </Card>
  <Card title="provider Plugin" icon="microchip" href="/ko/plugins/sdk-provider-plugins">
    모델 provider Plugin을 빌드합니다.
  </Card>
  <Card title="SDK 개요" icon="book" href="/ko/plugins/sdk-overview">
    import 맵 및 등록 API 참조입니다.
  </Card>
</CardGroup>

## 공개 기능 모델

기능은 OpenClaw 내부에서 공개되는 **네이티브 Plugin** 모델입니다. 모든
네이티브 OpenClaw Plugin은 하나 이상의 기능 유형에 대해 등록됩니다.

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
| Gateway 검색           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

기능을 하나도 등록하지 않지만 hook, tool, 검색 서비스 또는 백그라운드
서비스를 제공하는 Plugin은 **레거시 hook-only** Plugin입니다. 이 패턴도
여전히 완전히 지원됩니다.

### 외부 호환성 입장

기능 모델은 이미 core에 도입되었고 현재 번들/네이티브 Plugin에서
사용되고 있지만, 외부 Plugin 호환성에는 여전히 "export되었으므로
고정되었다"보다 더 엄격한 기준이 필요합니다.

| Plugin 상황                                      | 지침                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 기존 외부 Plugin                                 | hook 기반 통합이 계속 동작하도록 유지합니다. 이것이 호환성 기준선입니다.                         |
| 새 번들/네이티브 Plugin                          | vendor별 직접 접근이나 새 hook-only 설계보다 명시적 기능 등록을 우선합니다.                     |
| 기능 등록을 도입하는 외부 Plugin                 | 허용되지만, 문서에서 안정적이라고 표시하지 않는 한 기능별 헬퍼 표면은 계속 변화할 수 있다고 보세요. |

기능 등록이 의도된 방향입니다. 전환 기간 동안 외부 Plugin에 대해
가장 안전한 무중단 경로는 레거시 hook입니다. export된 헬퍼 하위 경로가
모두 같은 것은 아닙니다. 우발적으로 export된 헬퍼보다 문서화된 좁은
계약을 우선하세요.

### Plugin 형태

OpenClaw는 로드된 모든 Plugin을 정적 메타데이터만이 아니라 실제
등록 동작을 기준으로 형태로 분류합니다.

- **plain-capability**: 정확히 하나의 기능 유형만 등록합니다(예:
  `mistral` 같은 provider 전용 Plugin).
- **hybrid-capability**: 여러 기능 유형을 등록합니다(예:
  `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 소유함).
- **hook-only**: 기능, tool, 명령 또는 서비스를 등록하지 않고
  hook(typed 또는 custom)만 등록합니다.
- **non-capability**: 기능은 없고 tool, 명령, 서비스 또는 route를 등록합니다.

Plugin의 형태와 기능 구성을 보려면 `openclaw plugins inspect <id>`를
사용하세요. 자세한 내용은 [CLI reference](/ko/cli/plugins#inspect)를
참조하세요.

### 레거시 hook

`before_agent_start` hook은 hook-only Plugin을 위한 호환성 경로로
계속 지원됩니다. 실제 레거시 Plugin들이 여전히 이에 의존합니다.

방향:

- 계속 동작하도록 유지
- 레거시로 문서화
- 모델/provider 재정의 작업에는 `before_model_resolve` 우선
- 프롬프트 변경 작업에는 `before_prompt_build` 우선
- 실제 사용량이 줄고 fixture 커버리지가 마이그레이션 안전성을 입증한 뒤에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나가 표시될 수 있습니다.

| 신호                       | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 구성이 정상적으로 파싱되고 Plugin이 해결됨                   |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`)    |
| **legacy warning**         | Plugin이 더 이상 권장되지 않는 `before_agent_start`를 사용함 |
| **hard error**             | 구성이 잘못되었거나 Plugin 로드에 실패함                     |

`hook-only`도 `before_agent_start`도 오늘날 Plugin을 망가뜨리지는 않습니다.
`hook-only`는 권고 사항이며, `before_agent_start`는 경고만 발생시킵니다. 이
신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 개의 계층으로 이루어집니다.

1. **Manifest + 검색**
   OpenClaw는 구성된 경로, 워크스페이스 루트,
   전역 Plugin 루트 및 번들 Plugin에서 후보 Plugin을 찾습니다.
   검색은 지원되는 번들 Manifest와 네이티브
   `openclaw.plugin.json` Manifest를 먼저 읽습니다.
2. **활성화 + 검증**
   core는 검색된 Plugin이 활성화, 비활성화, 차단 또는 메모리 같은
   배타적 슬롯에 선택되는지 결정합니다.
3. **런타임 로드**
   네이티브 OpenClaw Plugin은 jiti를 통해 프로세스 내에서 로드되며
   중앙 레지스트리에 기능을 등록합니다. 호환 가능한 번들은 런타임
   코드를 import하지 않고 레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 tool, 채널, provider
   설정, hook, HTTP route, CLI 명령 및 서비스를 노출합니다.

특히 Plugin CLI의 경우, 루트 명령 검색은 두 단계로 나뉩니다.

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 옴
- 실제 Plugin CLI 모듈은 lazy 상태를 유지하다가 첫 호출 시 등록될 수 있음

이렇게 하면 루트 명령 이름을 파싱 전에 OpenClaw가 예약할 수 있으면서도
Plugin 소유 CLI 코드는 Plugin 내부에 유지됩니다.

중요한 설계 경계:

- 검색 + 구성 검증은 Plugin 코드를 실행하지 않고
  **Manifest/schema 메타데이터**로 동작해야 합니다
- 네이티브 런타임 동작은 Plugin 모듈의 `register(api)` 경로에서 옵니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에도 구성을 검증하고,
누락/비활성화된 Plugin을 설명하며, UI/schema 힌트를 구성할 수 있습니다.

### 활성화 계획

활성화 계획은 제어 평면의 일부입니다. 호출자는 더 넓은 런타임 레지스트리를
로드하기 전에, 특정 명령, provider, 채널, route, agent 하네스 또는 기능에
어떤 Plugin이 관련되는지 물을 수 있습니다.

플래너는 현재 Manifest 동작을 호환 가능하게 유지합니다.

- `activation.*` 필드는 명시적 플래너 힌트입니다
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools`, 그리고 hook은 여전히 Manifest 소유권 대체 경로입니다
- ID 전용 플래너 API는 기존 호출자를 위해 계속 사용할 수 있습니다
- 계획 API는 이유 레이블을 보고하므로 진단에서 명시적 힌트와
  소유권 대체 경로를 구분할 수 있습니다

`activation`을 lifecycle hook이나 `register(...)`의 대체로 취급하지 마세요.
이것은 로딩 범위를 좁히기 위한 메타데이터입니다. 이미 관계를 설명하는
소유권 필드가 있다면 그것을 우선하고, 추가 플래너 힌트가 필요할 때만
`activation`을 사용하세요.

### 채널 Plugin과 공유 message tool

채널 Plugin은 일반적인 채팅 작업을 위해 별도의 send/edit/react tool을
등록할 필요가 없습니다. OpenClaw는 core에 하나의 공유 `message` tool을
유지하며, 채널 Plugin은 그 뒤의 채널별 검색과 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- core는 공유 `message` tool 호스트, 프롬프트 연결, 세션/스레드
  기록 보관, 실행 디스패치를 소유합니다
- 채널 Plugin은 범위 지정된 작업 검색, 기능 검색, 채널별 schema
  조각을 소유합니다
- 채널 Plugin은 conversation ID가 thread ID를 어떻게 인코딩하거나
  상위 conversation에서 상속하는지 같은 provider별 세션 대화 문법을 소유합니다
- 채널 Plugin은 action adapter를 통해 최종 작업을 실행합니다

채널 Plugin의 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 검색
호출을 사용하면 Plugin은 보이는 작업, 기능, schema 기여를 함께 반환할 수
있으므로 이 요소들이 서로 어긋나지 않습니다.

채널별 message-tool 매개변수가 로컬 경로나 원격 미디어 URL 같은 미디어
소스를 담는 경우, Plugin은 `describeMessageTool(...)`에서
`mediaSourceParams`도 반환해야 합니다. core는 이 명시적 목록을 사용해
Plugin이 소유한 매개변수 이름을 하드코딩하지 않고 샌드박스 경로 정규화와
발신 미디어 액세스 힌트를 적용합니다.
여기서는 채널 전체의 단일 평면 목록보다 작업 범위 맵을 우선하세요. 그래야
프로필 전용 미디어 매개변수가 `send` 같은 관련 없는 작업에서 정규화되지 않습니다.

core는 런타임 범위를 이 검색 단계에 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 수신 `requesterSenderId`

이것은 컨텍스트 민감형 Plugin에 중요합니다. 채널은 활성 계정, 현재
room/thread/message 또는 신뢰된 요청자 ID에 따라 message action을
숨기거나 노출할 수 있으며, 이를 위해 core `message` tool 안에
채널별 분기를 하드코딩할 필요가 없습니다.

이것이 embedded-runner 라우팅 변경이 여전히 Plugin 작업인 이유입니다.
runner는 현재 채팅/세션 ID를 Plugin 검색 경계로 전달하여, 공유 `message`
tool이 현재 차례에 맞는 채널 소유 표면을 노출하도록 해야 합니다.

채널 소유 실행 헬퍼의 경우, 번들 Plugin은 실행 런타임을 자체 extension
모듈 내부에 유지해야 합니다. core는 더 이상 `src/agents/tools` 아래에서
Discord, Slack, Telegram 또는 WhatsApp message-action 런타임을 소유하지 않습니다.
우리는 별도의 `plugin-sdk/*-action-runtime` 하위 경로를 publish하지 않으며,
번들 Plugin은 자체 extension 소유 모듈에서 로컬 런타임 코드를 직접 import해야 합니다.

같은 경계는 일반적으로 provider 이름이 붙은 SDK seam에도 적용됩니다.
core는 Slack, Discord, Signal, WhatsApp 또는 유사 extension을 위한
채널별 편의 barrel을 import해서는 안 됩니다. core에 어떤 동작이 필요하면,
번들 Plugin 자체의 `api.ts` / `runtime-api.ts` barrel을 사용하거나 그 필요를
공유 SDK의 좁고 일반적인 기능으로 승격하세요.

특히 poll의 경우에는 두 가지 실행 경로가 있습니다:

- `outbound.sendPoll`은 공통 poll 모델에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 poll 의미 체계나 추가 poll 매개변수에 권장되는 경로입니다

이제 core는 Plugin poll 디스패치가 작업을 거절한 뒤에야 공유 poll 파싱을 수행하므로,
Plugin 소유 poll 핸들러는 먼저 일반 poll 파서에 막히지 않고 채널별 poll 필드를 수용할 수 있습니다.

전체 시작 시퀀스는 [Plugin architecture internals](/ko/plugins/architecture-internals)를 참조하세요.

## 기능 소유권 모델

OpenClaw는 네이티브 Plugin을 관련 없는 통합의 모음이 아니라 **회사** 또는
**기능**에 대한 소유권 경계로 취급합니다.

즉, 다음을 의미합니다.

- 회사 Plugin은 일반적으로 해당 회사의 모든 OpenClaw 노출 표면을 소유해야 합니다
- 기능 Plugin은 일반적으로 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 provider 동작을 임시로 다시 구현하는 대신 공유 core 기능을 소비해야 합니다

<Accordion title="번들 Plugin 전반의 예시 소유권 패턴">
  - **벤더 다중 기능**: `openai`는 텍스트 추론, 음성, 실시간
    음성, 미디어 이해, 이미지 생성을 소유합니다. `google`은 텍스트
    추론과 미디어 이해, 이미지 생성, 웹 검색을 소유합니다.
    `qwen`은 텍스트 추론과 미디어 이해, 비디오 생성을 소유합니다.
  - **벤더 단일 기능**: `elevenlabs`와 `microsoft`는 음성을 소유하고,
    `firecrawl`은 웹 가져오기를 소유하며, `minimax` / `mistral` / `moonshot` / `zai`는
    미디어 이해 백엔드를 소유합니다.
  - **기능 Plugin**: `voice-call`은 통화 전송, tool, CLI, route,
    Twilio 미디어 스트림 브리지를 소유하지만, 벤더 Plugin을 직접 import하지 않고
    공유 음성, 실시간 전사, 실시간 음성 기능을 소비합니다.
</Accordion>

의도된 최종 상태는 다음과 같습니다.

- OpenAI는 텍스트 모델, 음성, 이미지, 미래의 비디오까지 걸치더라도 하나의 Plugin에 존재함
- 다른 벤더도 자신의 표면 영역에 대해 같은 방식을 취할 수 있음
- 채널은 어떤 벤더 Plugin이 provider를 소유하는지 신경 쓰지 않고 core가 노출한
  공유 기능 계약을 소비함

이것이 핵심적인 구분입니다.

- **Plugin** = 소유권 경계
- **기능** = 여러 Plugin이 구현하거나 소비할 수 있는 core 계약

따라서 OpenClaw가 비디오 같은 새로운 도메인을 추가한다면 첫 번째 질문은
"어떤 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 번째 질문은
"core 비디오 기능 계약은 무엇인가?"입니다. 그 계약이 존재하면 벤더 Plugin은
여기에 등록할 수 있고 채널/기능 Plugin은 이를 소비할 수 있습니다.

아직 기능이 존재하지 않는다면 일반적으로 올바른 조치는 다음과 같습니다.

1. core에 누락된 기능을 정의합니다
2. 이를 Plugin API/런타임을 통해 타입이 있는 방식으로 노출합니다
3. 채널/기능을 해당 기능에 맞게 연결합니다
4. 벤더 Plugin이 구현을 등록하도록 합니다

이렇게 하면 소유권이 명시적으로 유지되고, 단일 벤더 또는 일회성 Plugin별 코드 경로에
의존하는 core 동작을 피할 수 있습니다.

### 기능 계층화

코드가 어디에 속하는지 결정할 때 다음과 같은 사고 모델을 사용하세요.

- **core 기능 계층**: 공유 오케스트레이션, 정책, 대체 동작, 구성
  병합 규칙, 전달 의미 체계, 타입 계약
- **벤더 Plugin 계층**: 벤더별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
- **채널/기능 Plugin 계층**: 공유 기능을 소비하고 표면에
  제시하는 Slack/Discord/voice-call 등의 통합

예를 들어 TTS는 다음 구조를 따릅니다.

- core는 답장 시점 TTS 정책, 대체 순서, 기본 설정, 채널 전달을 소유함
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유함
- `voice-call`은 전화 TTS 런타임 헬퍼를 소비함

미래의 기능에도 같은 패턴을 우선해야 합니다.

### 다중 기능 회사 Plugin 예시

회사 Plugin은 외부에서 볼 때 응집력 있게 느껴져야 합니다. OpenClaw에
모델, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성,
비디오 생성, 웹 가져오기, 웹 검색을 위한 공유 계약이 있다면, 하나의 벤더가
자신의 모든 표면을 한 곳에서 소유할 수 있습니다.

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

중요한 것은 정확한 헬퍼 이름이 아닙니다. 중요한 것은 구조입니다.

- 하나의 Plugin이 벤더 표면을 소유함
- core는 여전히 기능 계약을 소유함
- 채널과 기능 Plugin은 벤더 코드가 아니라 `api.runtime.*` 헬퍼를 소비함
- 계약 테스트는 Plugin이 자신이 소유한다고 주장하는 기능을 등록했는지
  단언할 수 있음

### 기능 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유 기능으로 취급합니다.
여기에도 같은 소유권 모델이 적용됩니다.

1. core가 미디어 이해 계약을 정의합니다
2. 벤더 Plugin이 해당되는 경우 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록합니다
3. 채널과 기능 Plugin은 벤더 코드에 직접 연결하는 대신
   공유 core 동작을 소비합니다

이렇게 하면 특정 provider의 비디오 가정을 core에 내장하는 일을 피할 수 있습니다.
Plugin은 벤더 표면을 소유하고, core는 기능 계약과 대체 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. core가 타입이 있는
기능 계약과 런타임 헬퍼를 소유하고, 벤더 Plugin이 여기에 대해
`api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 롤아웃 체크리스트가 필요하신가요?
[Capability Cookbook](/ko/plugins/architecture)을 참조하세요.

## 계약 및 강제 적용

Plugin API 표면은 의도적으로 `OpenClawPluginApi`에 타입이 부여되고 중앙화되어 있습니다.
이 계약은 지원되는 등록 지점과 Plugin이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유:

- Plugin 작성자는 하나의 안정적인 내부 표준을 얻습니다
- core는 두 Plugin이 같은 provider ID를 등록하는 식의 중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있습니다
- 계약 테스트는 번들 Plugin의 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다

강제 적용에는 두 계층이 있습니다.

1. **런타임 등록 강제 적용**
   Plugin 레지스트리는 Plugin이 로드될 때 등록을 검증합니다. 예:
   중복 provider ID, 중복 음성 provider ID, 잘못된 형식의
   등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 Plugin은 테스트 실행 중 계약 레지스트리에 캡처되므로
   OpenClaw는 소유권을 명시적으로 단언할 수 있습니다. 오늘날 이는 모델
   provider, 음성 provider, 웹 검색 provider, 번들 등록
   소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤 표면을 소유하는지
사전에 안다는 것입니다. 이를 통해 소유권이 암묵적이 아니라
선언적이고, 타입이 있고, 테스트 가능하기 때문에 core와 채널이
매끄럽게 조합될 수 있습니다.

### 계약에 포함되어야 하는 것

좋은 Plugin 계약은 다음과 같습니다.

- 타입이 있음
- 작음
- 기능별임
- core가 소유함
- 여러 Plugin이 재사용 가능함
- 채널/기능이 벤더 지식 없이 소비 가능함

나쁜 Plugin 계약은 다음과 같습니다.

- core 안에 숨겨진 벤더별 정책
- 레지스트리를 우회하는 일회성 Plugin 탈출구
- 벤더 구현에 직접 접근하는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

확신이 서지 않으면 추상화 수준을 높이세요. 먼저 기능을 정의한 뒤,
Plugin이 여기에 연결되도록 하세요.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 **프로세스 내에서** 실행됩니다.
샌드박스 처리되지 않습니다. 로드된 네이티브 Plugin은 core 코드와 같은
프로세스 수준 신뢰 경계를 가집니다.

의미하는 바:

- 네이티브 Plugin은 tool, 네트워크 핸들러, hook, 서비스를 등록할 수 있음
- 네이티브 Plugin 버그는 gateway를 크래시시키거나 불안정하게 만들 수 있음
- 악의적인 네이티브 Plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일함

호환 가능한 번들은 OpenClaw가 현재 이를 메타데이터/콘텐츠 팩으로
취급하기 때문에 기본적으로 더 안전합니다. 현재 릴리스에서는 주로 번들
Skills를 의미합니다.

번들되지 않은 Plugin에는 허용 목록과 명시적인 설치/로드 경로를 사용하세요.
워크스페이스 Plugin은 프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 워크스페이스 패키지 이름의 경우 Plugin ID를 기본적으로 npm
이름 `@openclaw/<id>`에 고정하세요. 또는 패키지가 의도적으로 더 좁은 Plugin 역할을
노출하는 경우 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은
승인된 타입 접미사를 사용하세요.

중요한 신뢰 참고 사항:

- `plugins.allow`는 소스 출처가 아니라 **Plugin ID**를 신뢰합니다.
- 번들 Plugin과 같은 ID를 가진 워크스페이스 Plugin은 해당 워크스페이스 Plugin이
  활성화/허용 목록에 포함되면 의도적으로 번들 사본을 가립니다.
- 이것은 정상적이며 로컬 개발, 패치 테스트, 긴급 수정에 유용합니다.
- 번들 Plugin 신뢰는 설치 메타데이터가 아니라 소스 스냅샷,
  즉 로드 시점 디스크의 Manifest와 코드에서 해결됩니다. 손상되었거나
  대체된 설치 레코드가 실제 소스가 주장하는 범위를 넘어 번들 Plugin의 신뢰
  표면을 조용히 넓힐 수는 없습니다.

## export 경계

OpenClaw는 구현 편의 기능이 아니라 기능을 export합니다.

기능 등록은 공개 상태를 유지하세요. 비계약 헬퍼 export는 줄이세요.

- 번들 Plugin 전용 헬퍼 하위 경로
- 공개 API로 의도되지 않은 런타임 플러밍 하위 경로
- 벤더별 편의 헬퍼
- 구현 세부 사항인 설정/온보딩 헬퍼

일부 번들 Plugin 헬퍼 하위 경로는 호환성과 번들 Plugin 유지보수를 위해
생성된 SDK export 맵에 여전히 남아 있습니다. 현재 예시에는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 그리고 여러 `plugin-sdk/matrix*` seam이 포함됩니다.
이들은 새로운 서드파티 Plugin에 권장되는 SDK 패턴이 아니라,
예약된 구현 세부 사항 export로 취급하세요.

## 내부 구조 및 참조

로드 파이프라인, 레지스트리 모델, provider 런타임 hook, Gateway HTTP
route, message tool schema, 채널 대상 확인, provider 카탈로그,
컨텍스트 엔진 Plugin, 새 기능 추가 가이드는
[Plugin architecture internals](/ko/plugins/architecture-internals)를 참조하세요.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin Manifest](/ko/plugins/manifest)
