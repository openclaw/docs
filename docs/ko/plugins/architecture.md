---
read_when:
    - 기본 OpenClaw Plugins 빌드 또는 디버깅 중입니다
    - Plugin 기능 모델 또는 소유권 경계를 이해하려고 합니다
    - Plugin 로드 파이프라인 또는 레지스트리 작업 중입니다
    - 공급자 런타임 훅 또는 채널 Plugins 구현 중입니다
sidebarTitle: Internals
summary: 'Plugin 내부: 기능 모델, 소유권, 계약, 로드 파이프라인 및 런타임 도우미'
title: Plugin 내부
x-i18n:
    generated_at: "2026-04-26T11:34:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

이 문서는 OpenClaw Plugin 시스템의 **심층 아키텍처 참조**입니다. 실용적인 가이드는 아래의 집중된 페이지 중 하나에서 시작하세요.

<CardGroup cols={2}>
  <Card title="Plugins 설치 및 사용" icon="plug" href="/ko/tools/plugin">
    Plugins 추가, 활성화, 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugins 빌드" icon="rocket" href="/ko/plugins/building-plugins">
    가장 작은 동작 가능한 매니페스트로 시작하는 첫 Plugin 튜토리얼입니다.
  </Card>
  <Card title="채널 Plugins" icon="comments" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin을 빌드합니다.
  </Card>
  <Card title="공급자 Plugins" icon="microchip" href="/ko/plugins/sdk-provider-plugins">
    모델 공급자 Plugin을 빌드합니다.
  </Card>
  <Card title="SDK 개요" icon="book" href="/ko/plugins/sdk-overview">
    import 맵과 등록 API 참조입니다.
  </Card>
</CardGroup>

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **기본 Plugin** 모델입니다. 모든 기본 OpenClaw Plugin은 하나 이상의 기능 유형에 등록됩니다.

| 기능                   | 등록 메서드                                     | 예시 Plugins                       |
| ---------------------- | ----------------------------------------------- | ---------------------------------- |
| 텍스트 추론            | `api.registerProvider(...)`                     | `openai`, `anthropic`              |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                   | `openai`, `anthropic`              |
| 음성                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`          |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)`| `openai`                           |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`        | `openai`                           |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                 |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`      | `qwen`                             |
| Web 가져오기           | `api.registerWebFetchProvider(...)`             | `firecrawl`                        |
| Web 검색               | `api.registerWebSearchProvider(...)`            | `google`                           |
| 채널 / 메시징          | `api.registerChannel(...)`                      | `msteams`, `matrix`                |
| Gateway 탐색           | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                          |

<Note>
기능을 하나도 등록하지 않지만 훅, 도구, 탐색 서비스 또는 백그라운드 서비스를 제공하는 Plugin은 **레거시 hook-only** Plugin입니다. 이 패턴은 여전히 완전히 지원됩니다.
</Note>

### 외부 호환성 입장

기능 모델은 core에 적용되어 오늘날 번들/기본 Plugins에서 사용되지만, 외부 Plugin 호환성에는 “export되었으므로 동결되었다”보다 더 엄격한 기준이 여전히 필요합니다.

| Plugin 상황                                     | 가이드                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 기존 외부 Plugins                               | 훅 기반 통합이 계속 작동하도록 유지하세요. 이것이 호환성 기준선입니다.                           |
| 새 번들/기본 Plugins                            | 공급자별 reach-in 또는 새로운 hook-only 설계보다 명시적 기능 등록을 선호하세요.                 |
| 기능 등록을 도입하는 외부 Plugins               | 허용되지만, 문서에서 안정적이라고 표시하지 않는 한 기능별 헬퍼 표면은 계속 발전 중이라고 보세요. |

기능 등록이 의도된 방향입니다. 전환 기간 동안 외부 Plugins에 대해 가장 안전한 무중단 경로는 레거시 훅입니다. export된 헬퍼 하위 경로가 모두 동일한 것은 아니므로, 우연히 노출된 헬퍼 export보다 좁고 문서화된 계약을 선호하세요.

### Plugin 형태

OpenClaw는 정적 메타데이터만이 아니라 실제 등록 동작을 기준으로 로드된 각 Plugin을 형태로 분류합니다.

<AccordionGroup>
  <Accordion title="plain-capability">
    정확히 하나의 기능 유형만 등록합니다(예: `mistral` 같은 공급자 전용 Plugin).
  </Accordion>
  <Accordion title="hybrid-capability">
    여러 기능 유형을 등록합니다(예: `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 소유함).
  </Accordion>
  <Accordion title="hook-only">
    기능, 도구, 명령, 서비스 없이 훅(타입 지정 또는 사용자 지정)만 등록합니다.
  </Accordion>
  <Accordion title="non-capability">
    기능은 등록하지 않고 도구, 명령, 서비스 또는 라우트만 등록합니다.
  </Accordion>
</AccordionGroup>

Plugin의 형태와 기능 세부 내역을 보려면 `openclaw plugins inspect <id>`를 사용하세요. 자세한 내용은 [CLI 참조](/ko/cli/plugins#inspect)를 참조하세요.

### 레거시 훅

`before_agent_start` 훅은 hook-only Plugins를 위한 호환 경로로 계속 지원됩니다. 실제 레거시 Plugins가 여전히 여기에 의존합니다.

방향:

- 계속 작동하도록 유지
- 레거시로 문서화
- 모델/공급자 재정의 작업에는 `before_model_resolve` 선호
- 프롬프트 변경 작업에는 `before_prompt_build` 선호
- 실제 사용량이 줄고 픽스처 커버리지가 마이그레이션 안전성을 입증한 후에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면 다음 라벨 중 하나를 볼 수 있습니다.

| 신호                       | 의미                                                      |
| -------------------------- | --------------------------------------------------------- |
| **config valid**           | 구성이 정상적으로 파싱되고 Plugins가 확인됨               |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`) |
| **legacy warning**         | Plugin이 더 이상 권장되지 않는 `before_agent_start`를 사용함 |
| **hard error**             | 구성이 잘못되었거나 Plugin 로드에 실패함                  |

`hook-only`도 `before_agent_start`도 현재 Plugin을 깨뜨리지는 않습니다. `hook-only`는 권고 사항이고, `before_agent_start`는 경고만 발생시킵니다. 이러한 신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 계층으로 구성됩니다.

<Steps>
  <Step title="매니페스트 + 탐색">
    OpenClaw는 구성된 경로, workspace 루트, 전역 Plugin 루트, 번들 Plugins에서 후보 Plugins를 찾습니다. 탐색은 먼저 기본 `openclaw.plugin.json` 매니페스트와 지원되는 번들 매니페스트를 읽습니다.
  </Step>
  <Step title="활성화 + 검증">
    core는 탐지된 Plugin이 활성화, 비활성화, 차단 또는 메모리 같은 독점 슬롯에 선택되었는지를 결정합니다.
  </Step>
  <Step title="런타임 로드">
    기본 OpenClaw Plugins는 jiti를 통해 프로세스 내부에서 로드되고 중앙 레지스트리에 기능을 등록합니다. 호환되는 번들은 런타임 코드를 import하지 않고 레지스트리 레코드로 정규화됩니다.
  </Step>
  <Step title="표면 소비">
    OpenClaw의 나머지 부분은 레지스트리를 읽어 도구, 채널, 공급자 설정, 훅, HTTP 라우트, CLI 명령, 서비스를 노출합니다.
  </Step>
</Steps>

특히 Plugin CLI의 경우 루트 명령 탐색은 두 단계로 분리됩니다.

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 가져옵니다
- 실제 Plugin CLI 모듈은 지연 로드 상태로 유지되다가 첫 호출 시 등록될 수 있습니다

이렇게 하면 Plugin 소유 CLI 코드를 Plugin 내부에 유지하면서도 OpenClaw가 파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계:

- 매니페스트/config 검증은 Plugin 코드를 실행하지 않고 **매니페스트/스키마 메타데이터**만으로 작동해야 합니다
- 기본 기능 탐색은 비활성화 상태 레지스트리 스냅샷을 빌드하기 위해 신뢰된 Plugin 엔트리 코드를 로드할 수 있습니다
- 기본 런타임 동작은 `api.registrationMode === "full"` 상태의 Plugin 모듈 `register(api)` 경로에서 나옵니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에 config를 검증하고, 누락/비활성화된 Plugins를 설명하며, UI/스키마 힌트를 구성할 수 있습니다.

### 활성화 계획

활성화 계획은 제어 평면의 일부입니다. 호출자는 더 넓은 런타임 레지스트리를 로드하기 전에 구체적인 명령, 공급자, 채널, 라우트, 에이전트 harness 또는 기능과 관련된 Plugins가 무엇인지 물어볼 수 있습니다.

플래너는 현재 매니페스트 동작과의 호환성을 유지합니다.

- `activation.*` 필드는 명시적인 플래너 힌트입니다
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, 훅은 여전히 매니페스트 소유권 대체값으로 남아 있습니다
- ID 전용 플래너 API는 기존 호출자를 위해 계속 사용 가능합니다
- plan API는 이유 라벨을 보고하므로 진단 시 명시적 힌트와 소유권 대체값을 구분할 수 있습니다

<Warning>
`activation`을 수명 주기 훅이나 `register(...)`의 대체로 취급하지 마세요. 이는 로딩 범위를 좁히기 위해 사용되는 메타데이터입니다. 이미 관계를 설명하는 소유권 필드가 있으면 그것을 우선 사용하고, 추가 플래너 힌트가 필요할 때만 `activation`을 사용하세요.
</Warning>

### 채널 Plugins와 공용 메시지 도구

채널 Plugins는 일반적인 채팅 동작을 위해 별도의 send/edit/react 도구를 등록할 필요가 없습니다. OpenClaw는 core에 하나의 공용 `message` 도구를 유지하고, 채널 Plugins가 그 뒤의 채널별 탐색과 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- core는 공용 `message` 도구 호스트, 프롬프트 연결, 세션/스레드 bookkeeping, 실행 디스패치를 소유합니다
- 채널 Plugins는 범위가 지정된 동작 탐색, 기능 탐색, 채널별 스키마 조각을 소유합니다
- 채널 Plugins는 대화 ID가 스레드 ID를 인코딩하거나 부모 대화에서 상속되는 방식처럼 공급자별 세션 대화 문법을 소유합니다
- 채널 Plugins는 자신의 동작 어댑터를 통해 최종 동작을 실행합니다

채널 Plugins의 SDK 표면은 `ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 탐색 호출을 통해 Plugin은 보이는 동작, 기능, 스키마 기여를 함께 반환할 수 있으므로 이 요소들이 서로 어긋나지 않습니다.

채널별 메시지 도구 매개변수가 로컬 경로 또는 원격 미디어 URL 같은 미디어 소스를 포함하는 경우, Plugin은 `describeMessageTool(...)`에서 `mediaSourceParams`도 반환해야 합니다. core는 이 명시적 목록을 사용해 Plugin 소유 매개변수 이름을 하드코딩하지 않고 sandbox 경로 정규화와 아웃바운드 미디어 액세스 힌트를 적용합니다. 채널 전체의 평면 목록 하나가 아니라 동작 범위별 맵을 선호하세요. 그래야 프로필 전용 미디어 매개변수가 `send` 같은 관련 없는 동작에서 정규화되지 않습니다.

core는 런타임 범위를 이 탐색 단계에 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 수신 `requesterSenderId`

이것은 컨텍스트 민감한 Plugins에 중요합니다. 채널은 core `message` 도구에 채널별 분기를 하드코딩하지 않고도 활성 계정, 현재 룸/스레드/메시지, 또는 신뢰된 요청자 ID에 따라 메시지 동작을 숨기거나 노출할 수 있습니다.

이것이 임베디드 러너 라우팅 변경이 여전히 Plugin 작업인 이유입니다. 러너는 공용 `message` 도구가 현재 턴에 맞는 채널 소유 표면을 노출하도록 현재 채팅/세션 ID를 Plugin 탐색 경계로 전달해야 할 책임이 있습니다.

채널 소유 실행 헬퍼의 경우, 번들 Plugins는 실행 런타임을 자신의 확장 모듈 내부에 유지해야 합니다. core는 더 이상 `src/agents/tools` 아래의 Discord, Slack, Telegram, WhatsApp 메시지 동작 런타임을 소유하지 않습니다. 별도의 `plugin-sdk/*-action-runtime` 하위 경로를 공개하지 않으며, 번들 Plugins는 자신의 로컬 런타임 코드를 확장 소유 모듈에서 직접 import해야 합니다.

같은 경계는 일반적인 공급자 이름 기반 SDK seam에도 적용됩니다. core는 Slack, Discord, Signal, WhatsApp 또는 유사한 확장의 채널별 편의 배럴을 import해서는 안 됩니다. core에 어떤 동작이 필요하면, 번들 Plugin의 자체 `api.ts` / `runtime-api.ts` 배럴을 사용하거나 그 필요를 공유 SDK의 좁은 일반 기능으로 승격하세요.

특히 투표의 경우 두 가지 실행 경로가 있습니다.

- `outbound.sendPoll`은 공통 투표 모델에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 투표 의미론이나 추가 투표 매개변수가 필요할 때 선호되는 경로입니다

이제 core는 Plugin 투표 디스패치가 동작을 거부한 뒤에야 공유 투표 파싱을 수행하므로, Plugin 소유 투표 핸들러는 일반 투표 파서에 먼저 막히지 않고 채널별 투표 필드를 받아들일 수 있습니다.

전체 시작 순서는 [Plugin 아키텍처 내부](/ko/plugins/architecture-internals)를 참조하세요.

## 기능 소유권 모델

OpenClaw는 기본 Plugin을 관련 없는 통합의 모음이 아니라 **회사** 또는 **기능**의 소유권 경계로 취급합니다.

즉, 다음을 의미합니다.

- 회사 Plugin은 일반적으로 해당 회사의 모든 OpenClaw 관련 표면을 소유해야 합니다
- 기능 Plugin은 일반적으로 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 공급자 동작을 임시로 다시 구현하는 대신 공용 core 기능을 소비해야 합니다

<AccordionGroup>
  <Accordion title="벤더 다중 기능">
    `openai`는 텍스트 추론, 음성, 실시간 음성, 미디어 이해, 이미지 생성을 소유합니다. `google`은 텍스트 추론과 함께 미디어 이해, 이미지 생성, Web 검색을 소유합니다. `qwen`은 텍스트 추론과 함께 미디어 이해 및 비디오 생성을 소유합니다.
  </Accordion>
  <Accordion title="벤더 단일 기능">
    `elevenlabs`와 `microsoft`는 음성을 소유하고, `firecrawl`은 Web 가져오기를 소유하며, `minimax` / `mistral` / `moonshot` / `zai`는 미디어 이해 백엔드를 소유합니다.
  </Accordion>
  <Accordion title="기능 Plugin">
    `voice-call`은 통화 전송, 도구, CLI, 라우트, Twilio 미디어 스트림 브리징을 소유하지만, 벤더 Plugins를 직접 import하지 않고 공용 음성, 실시간 전사, 실시간 음성 기능을 소비합니다.
  </Accordion>
</AccordionGroup>

의도된 최종 상태는 다음과 같습니다.

- OpenAI는 텍스트 모델, 음성, 이미지, 향후 비디오에 걸쳐 있더라도 하나의 Plugin 안에 존재합니다
- 다른 벤더도 자신의 표면 영역에 대해 같은 방식을 취할 수 있습니다
- 채널은 어떤 벤더 Plugin이 공급자를 소유하는지 신경 쓰지 않고, core가 노출하는 공용 기능 계약을 소비합니다

핵심적인 구분은 다음과 같습니다.

- **Plugin** = 소유권 경계
- **기능** = 여러 Plugins가 구현하거나 소비할 수 있는 core 계약

따라서 OpenClaw가 비디오 같은 새 도메인을 추가할 때 첫 번째 질문은 “어떤 공급자가 비디오 처리를 하드코딩해야 하는가?”가 아닙니다. 첫 번째 질문은 “core 비디오 기능 계약은 무엇인가?”입니다. 이 계약이 존재하면 벤더 Plugins가 여기에 등록할 수 있고, 채널/기능 Plugins가 이를 소비할 수 있습니다.

기능이 아직 존재하지 않는다면, 일반적으로 올바른 접근은 다음과 같습니다.

<Steps>
  <Step title="기능 정의">
    core에 누락된 기능을 정의합니다.
  </Step>
  <Step title="SDK를 통해 노출">
    타입이 지정된 방식으로 Plugin API/런타임을 통해 이를 노출합니다.
  </Step>
  <Step title="소비자 연결">
    채널/기능을 해당 기능에 연결합니다.
  </Step>
  <Step title="벤더 구현">
    벤더 Plugins가 구현을 등록하도록 합니다.
  </Step>
</Steps>

이렇게 하면 소유권을 명시적으로 유지하면서, 단일 벤더 또는 일회성 Plugin 전용 코드 경로에 의존하는 core 동작을 피할 수 있습니다.

### 기능 계층화

코드가 어디에 속하는지 결정할 때 다음 개념 모델을 사용하세요.

<Tabs>
  <Tab title="core 기능 계층">
    공통 오케스트레이션, 정책, 대체 동작, config 병합 규칙, 전달 의미론, 타입 지정 계약
  </Tab>
  <Tab title="벤더 Plugin 계층">
    벤더별 API, 인증, 모델 카탈로그, 음성 합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
  </Tab>
  <Tab title="채널/기능 Plugin 계층">
    core 기능을 소비하고 이를 표면에 제시하는 Slack/Discord/voice-call 등의 통합
  </Tab>
</Tabs>

예를 들어 TTS는 다음 구조를 따릅니다.

- core는 응답 시점 TTS 정책, 대체 순서, 기본 설정, 채널 전달을 소유합니다
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유합니다
- `voice-call`은 전화용 TTS 런타임 헬퍼를 소비합니다

향후 기능에도 같은 패턴을 선호해야 합니다.

### 다중 기능 회사 Plugin 예시

회사 Plugin은 외부에서 보았을 때 응집력 있게 느껴져야 합니다. OpenClaw에 모델, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, Web 가져오기, Web 검색을 위한 공용 계약이 있다면, 벤더는 자신의 모든 표면을 한 곳에서 소유할 수 있습니다.

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
      // vendor speech config — SpeechProviderPlugin 인터페이스를 직접 구현
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
- 채널과 기능 Plugins는 벤더 코드가 아니라 `api.runtime.*` 헬퍼를 소비함
- 계약 테스트는 Plugin이 자신이 소유한다고 주장하는 기능을 실제로 등록했는지 검증할 수 있음

### 기능 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공용 기능으로 취급합니다. 동일한 소유권 모델이 여기에 적용됩니다.

<Steps>
  <Step title="core가 계약 정의">
    core가 미디어 이해 계약을 정의합니다.
  </Step>
  <Step title="벤더 Plugins 등록">
    벤더 Plugins는 필요에 따라 `describeImage`, `transcribeAudio`, `describeVideo`를 등록합니다.
  </Step>
  <Step title="소비자는 공용 동작 사용">
    채널과 기능 Plugins는 벤더 코드에 직접 연결하는 대신 공용 core 동작을 소비합니다.
  </Step>
</Steps>

이렇게 하면 한 공급자의 비디오 가정을 core에 내장하는 것을 피할 수 있습니다. Plugin은 벤더 표면을 소유하고, core는 기능 계약과 대체 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. core가 타입이 지정된 기능 계약과 런타임 헬퍼를 소유하고, 벤더 Plugins가 `api.registerVideoGenerationProvider(...)` 구현을 여기에 등록합니다.

구체적인 출시 체크리스트가 필요하신가요? [기능 Cookbook](/ko/plugins/architecture)을 참조하세요.

## 계약 및 적용

Plugin API 표면은 의도적으로 `OpenClawPluginApi`에 타입 지정되어 중앙 집중화되어 있습니다. 이 계약은 지원되는 등록 지점과 Plugin이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유:

- Plugin 작성자는 하나의 안정적인 내부 표준을 얻게 됩니다
- core는 두 Plugins가 같은 공급자 ID를 등록하는 것 같은 중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표면화할 수 있습니다
- 계약 테스트는 번들 Plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다

적용에는 두 계층이 있습니다.

<AccordionGroup>
  <Accordion title="런타임 등록 적용">
    Plugin 레지스트리는 Plugins가 로드될 때 등록을 검증합니다. 예: 중복 공급자 ID, 중복 음성 공급자 ID, 잘못된 등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
  </Accordion>
  <Accordion title="계약 테스트">
    번들 Plugins는 테스트 실행 중 계약 레지스트리에 캡처되므로, OpenClaw는 소유권을 명시적으로 검증할 수 있습니다. 현재는 모델 공급자, 음성 공급자, Web 검색 공급자, 번들 등록 소유권에 대해 사용됩니다.
  </Accordion>
</AccordionGroup>

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤 표면을 소유하는지 미리 안다는 것입니다. 덕분에 core와 채널은 소유권이 암묵적인 것이 아니라 선언되고, 타입 지정되며, 테스트 가능하므로 매끄럽게 조합될 수 있습니다.

### 계약에 들어가야 할 것

<Tabs>
  <Tab title="좋은 계약">
    - 타입이 지정됨
    - 작음
    - 기능별로 구체적임
    - core가 소유함
    - 여러 Plugins가 재사용 가능함
    - 채널/기능이 벤더 지식 없이 소비 가능함

  </Tab>
  <Tab title="나쁜 계약">
    - core에 숨겨진 벤더별 정책
    - 레지스트리를 우회하는 일회성 Plugin 탈출구
    - 벤더 구현에 직접 접근하는 채널 코드
    - `OpenClawPluginApi` 또는 `api.runtime`의 일부가 아닌 임시 런타임 객체

  </Tab>
</Tabs>

확신이 서지 않으면 추상화 수준을 높이세요. 먼저 기능을 정의한 다음, Plugins가 여기에 연결되도록 하세요.

## 실행 모델

기본 OpenClaw Plugins는 Gateway와 **프로세스 내부**에서 실행됩니다. 샌드박스되지 않습니다. 로드된 기본 Plugin은 core 코드와 동일한 프로세스 수준 신뢰 경계를 가집니다.

<Warning>
의미:

- 기본 Plugin은 도구, 네트워크 핸들러, 훅, 서비스를 등록할 수 있습니다
- 기본 Plugin의 버그는 Gateway를 충돌시키거나 불안정하게 만들 수 있습니다
- 악의적인 기본 Plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일합니다

</Warning>

호환되는 번들은 OpenClaw가 현재 이를 메타데이터/콘텐츠 팩으로 취급하기 때문에 기본적으로 더 안전합니다. 현재 릴리스에서는 주로 번들 Skills가 이에 해당합니다.

번들이 아닌 Plugins에는 허용 목록과 명시적 설치/로드 경로를 사용하세요. workspace Plugins는 프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 workspace 패키지 이름의 경우 Plugin ID는 기본적으로 npm 이름 `@openclaw/<id>`에 고정하거나, 패키지가 더 좁은 Plugin 역할을 의도적으로 노출하는 경우 승인된 타입 접미사 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding`를 사용하세요.

<Note>
**신뢰 참고:**

- `plugins.allow`는 소스 출처가 아니라 **Plugin ID**를 신뢰합니다.
- 번들 Plugin과 같은 ID를 가진 workspace Plugin은 해당 workspace Plugin이 활성화되거나 허용 목록에 있으면 의도적으로 번들 복사본을 가립니다.
- 이는 로컬 개발, 패치 테스트, 핫픽스에 정상적이며 유용합니다.
- 번들 Plugin 신뢰는 설치 메타데이터가 아니라 소스 스냅샷, 즉 로드 시점의 디스크 상 매니페스트와 코드에서 확인됩니다. 손상되거나 대체된 설치 기록이 실제 소스가 주장하는 범위를 넘어 번들 Plugin의 신뢰 표면을 조용히 넓힐 수는 없습니다.

</Note>

## export 경계

OpenClaw는 구현 편의가 아니라 기능을 export합니다.

기능 등록은 공개 상태로 유지하세요. 계약이 아닌 헬퍼 export는 줄이세요.

- 번들 Plugin 전용 헬퍼 하위 경로
- 공개 API로 의도되지 않은 런타임 배관 하위 경로
- 벤더별 편의 헬퍼
- 구현 세부 사항인 설정/온보딩 헬퍼

일부 번들 Plugin 헬퍼 하위 경로는 호환성과 번들 Plugin 유지보수를 위해 생성된 SDK export 맵에 여전히 남아 있습니다. 현재 예시로는 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, 그리고 여러 `plugin-sdk/matrix*` seam이 있습니다. 이를 새 서드파티 Plugins에 권장되는 SDK 패턴이 아니라 예약된 구현 세부 export로 취급하세요.

## 내부 및 참조

로드 파이프라인, 레지스트리 모델, 공급자 런타임 훅, Gateway HTTP 라우트, 메시지 도구 스키마, 채널 대상 확인, 공급자 카탈로그, 컨텍스트 엔진 Plugins, 새 기능 추가 가이드는 [Plugin 아키텍처 내부](/ko/plugins/architecture-internals)를 참조하세요.

## 관련 항목

- [Plugins 빌드](/ko/plugins/building-plugins)
- [Plugin 매니페스트](/ko/plugins/manifest)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
