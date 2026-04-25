---
read_when:
    - 네이티브 OpenClaw plugin 빌드 또는 디버깅하기
    - plugin capability 모델 또는 소유권 경계 이해하기
    - plugin 로드 파이프라인 또는 레지스트리 작업하기
    - provider 런타임 hook 또는 채널 plugin 구현하기
sidebarTitle: Internals
summary: 'Plugin 내부 구조: capability 모델, 소유권, 계약, 로드 파이프라인, 런타임 helper'
title: Plugin 내부 구조
x-i18n:
    generated_at: "2026-04-25T06:05:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

이 문서는 OpenClaw plugin 시스템의 **심층 아키텍처 참조**입니다. 실용적인 가이드는 아래의 집중 문서 중 하나부터 시작하세요.

<CardGroup cols={2}>
  <Card title="plugin 설치 및 사용" icon="plug" href="/ko/tools/plugin">
    plugin 추가, 활성화, 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="plugin 빌드" icon="rocket" href="/ko/plugins/building-plugins">
    가장 작은 동작 manifest로 시작하는 첫 plugin 튜토리얼입니다.
  </Card>
  <Card title="채널 plugin" icon="comments" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 plugin을 빌드합니다.
  </Card>
  <Card title="provider plugin" icon="microchip" href="/ko/plugins/sdk-provider-plugins">
    모델 provider plugin을 빌드합니다.
  </Card>
  <Card title="SDK 개요" icon="book" href="/ko/plugins/sdk-overview">
    import map 및 등록 API 참조입니다.
  </Card>
</CardGroup>

## 공개 capability 모델

Capabilities는 OpenClaw 내부의 공개 **네이티브 plugin** 모델입니다. 모든
네이티브 OpenClaw plugin은 하나 이상의 capability 유형에 대해 등록됩니다.

| Capability             | 등록 메서드                                    | 예시 plugin                           |
| ---------------------- | ---------------------------------------------- | ------------------------------------ |
| 텍스트 추론            | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| 음성                   | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`       | `openai`                             |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| 웹 검색                | `api.registerWebSearchProvider(...)`           | `google`                             |
| 채널 / 메시징          | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |
| Gateway 검색           | `api.registerGatewayDiscoveryService(...)`     | `bonjour`                            |

capability를 하나도 등록하지 않지만 hook, 도구, 검색
서비스 또는 백그라운드 서비스를 제공하는 plugin은 **레거시 hook-only** plugin입니다. 이 패턴은
여전히 완전히 지원됩니다.

### 외부 호환성 입장

capability 모델은 이미 core에 반영되었고 현재 번들/네이티브 plugin에서
사용되고 있지만, 외부 plugin 호환성은 "export되었으니 고정되었다"보다 더 엄격한 기준이 필요합니다.

| Plugin 상황                                      | 지침                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 기존 외부 plugin                                 | hook 기반 통합이 계속 동작하도록 유지합니다. 이것이 호환성 기준선입니다.                         |
| 새 번들/네이티브 plugin                          | vendor별 깊숙한 접근이나 새로운 hook-only 설계보다 명시적인 capability 등록을 우선합니다.       |
| capability 등록을 채택하는 외부 plugin           | 허용되지만, 문서에서 안정적이라고 표시하지 않는 한 capability별 helper 표면은 진화 중으로 간주하세요. |

capability 등록이 의도된 방향입니다. 레거시 hook은 전환 기간 동안 외부 plugin에 대해
가장 안전한 무중단 경로로 남아 있습니다. export된 helper 하위 경로가 모두 같은 수준은 아니므로,
부수적으로 export된 helper보다 문서화된 좁은 계약을 우선하세요.

### Plugin 형태

OpenClaw는 모든 로드된 plugin을 정적 메타데이터만이 아니라 실제
등록 동작을 기준으로 형태별로 분류합니다.

- **plain-capability**: 정확히 하나의 capability 유형만 등록합니다(예:
  `mistral` 같은 provider 전용 plugin).
- **hybrid-capability**: 여러 capability 유형을 등록합니다(예:
  `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지
  생성을 소유합니다).
- **hook-only**: hook만 등록하고, capability,
  도구, 명령, 서비스는 등록하지 않습니다.
- **non-capability**: 도구, 명령, 서비스 또는 route는 등록하지만
  capability는 등록하지 않습니다.

plugin의 형태와 capability 구성을 보려면 `openclaw plugins inspect <id>`를 사용하세요.
자세한 내용은 [CLI reference](/ko/cli/plugins#inspect)를 참고하세요.

### 레거시 hook

`before_agent_start` hook은 hook-only plugin을 위한 호환 경로로 여전히 지원됩니다. 실제
레거시 plugin들이 아직 여기에 의존하고 있습니다.

방향:

- 계속 동작하도록 유지
- 레거시로 문서화
- 모델/provider 재정의 작업에는 `before_model_resolve`를 우선 사용
- prompt 변경 작업에는 `before_prompt_build`를 우선 사용
- 실제 사용량이 줄고 fixture coverage가 마이그레이션 안전성을 입증한 후에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나를 볼 수 있습니다.

| 신호                       | 의미                                                      |
| -------------------------- | --------------------------------------------------------- |
| **config valid**           | Config가 정상적으로 파싱되고 plugin이 확인됨              |
| **compatibility advisory** | plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`) |
| **legacy warning**         | plugin이 더 이상 권장되지 않는 `before_agent_start`를 사용함 |
| **hard error**             | Config가 유효하지 않거나 plugin 로드에 실패함             |

`hook-only`도 `before_agent_start`도 현재 plugin을 깨뜨리지는 않습니다:
`hook-only`는 권고 사항이며, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 나타납니다.

## 아키텍처 개요

OpenClaw의 plugin 시스템은 네 개의 계층으로 이루어져 있습니다.

1. **Manifest + 검색**
   OpenClaw는 구성된 경로, workspace 루트,
   전역 plugin 루트, 번들 plugin에서 후보 plugin을 찾습니다. 검색은 먼저 네이티브
   `openclaw.plugin.json` manifest와 지원되는 번들 manifest를 읽습니다.
2. **활성화 + 검증**
   Core는 검색된 plugin이 활성화, 비활성화, 차단, 또는 memory 같은 독점 슬롯용으로 선택되었는지를 결정합니다.
3. **런타임 로드**
   네이티브 OpenClaw plugin은 jiti를 통해 프로세스 내부에서 로드되고
   중앙 레지스트리에 capability를 등록합니다. 호환되는 번들은 런타임 코드를 import하지 않고
   레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 도구, 채널, provider
   설정, hook, HTTP route, CLI 명령, 서비스를 노출합니다.

특히 plugin CLI의 경우 루트 명령 검색은 두 단계로 나뉩니다.

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 옴
- 실제 plugin CLI 모듈은 지연된 상태를 유지하다가 첫 호출 시 등록될 수 있음

이렇게 하면 plugin 소유 CLI 코드를 plugin 내부에 유지하면서도 OpenClaw가
파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계:

- manifest/config 검증은 plugin 코드를 실행하지 않고 **manifest/schema 메타데이터**
  로부터 동작해야 함
- 네이티브 capability 검색은 비활성화된
  레지스트리 스냅샷을 만들기 위해 신뢰된 plugin 엔트리 코드를 로드할 수 있음
- 네이티브 런타임 동작은 `api.registrationMode === "full"`일 때의
  plugin 모듈 `register(api)` 경로에서 옴

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에 config를 검증하고, 누락되었거나 비활성화된 plugin을 설명하며, UI/schema 힌트를 구축할 수 있습니다.

### 활성화 계획

활성화 계획은 control plane의 일부입니다. 호출자는 더 넓은 런타임 레지스트리를 로드하기 전에
구체적인 명령, provider, 채널, route, 에이전트 harness 또는
capability와 관련된 plugin이 무엇인지 물어볼 수 있습니다.

planner는 현재 manifest 동작과의 호환성을 유지합니다.

- `activation.*` 필드는 명시적 planner 힌트입니다
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools`, hook은 여전히 manifest 소유권 fallback으로 남습니다
- id 전용 planner API는 기존 호출자용으로 계속 제공됩니다
- plan API는 이유 레이블을 보고하므로 진단에서 명시적
  힌트와 소유권 fallback을 구분할 수 있습니다

`activation`을 생명주기 hook 또는
`register(...)`의 대체물로 취급하지 마세요. 이것은 로딩 범위를 좁히기 위한 메타데이터입니다.
이미 관계를 설명하는 소유권 필드가 있다면 그것을 우선 사용하고, `activation`은 추가 planner 힌트가 필요할 때만 사용하세요.

### 채널 plugin과 공용 message 도구

채널 plugin은 일반 채팅 작업을 위해 별도의 send/edit/react 도구를 등록할 필요가 없습니다.
OpenClaw는 core 안에 하나의 공용 `message` 도구를 유지하고,
채널 plugin은 그 뒤에서 채널별 검색과 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- core는 공용 `message` 도구 호스트, prompt 연결, session/thread
  bookkeeping, 실행 dispatch를 소유합니다
- 채널 plugin은 범위가 지정된 작업 검색, capability 검색, 채널별 schema 조각을 소유합니다
- 채널 plugin은 대화 id가 thread id를 어떻게 인코딩하거나
  부모 대화에서 상속하는지와 같은 provider별 세션 대화 문법을 소유합니다
- 채널 plugin은 action adapter를 통해 최종 작업을 실행합니다

채널 plugin의 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 검색
호출을 통해 plugin은 표시 가능한 작업, capability, schema
기여를 함께 반환할 수 있으므로 이 요소들이 서로 어긋나지 않습니다.

채널별 message-tool 파라미터가
로컬 경로나 원격 미디어 URL 같은 미디어 소스를 포함하는 경우,
plugin은 `describeMessageTool(...)`에서
`mediaSourceParams`도 반환해야 합니다. Core는 하드코딩된 plugin 소유 파라미터 이름 없이
이 명시적 목록을 사용해 sandbox 경로 정규화와 아웃바운드 미디어 접근 힌트를 적용합니다.
채널 전체 단일 평면 목록보다 작업 범위 맵을 우선하세요. 그래야
프로필 전용 미디어 파라미터가 `send` 같은 관련 없는 작업에서 정규화되지 않습니다.

Core는 런타임 범위를 이 검색 단계로 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이는 컨텍스트 민감형 plugin에 중요합니다. 채널은
활성 계정, 현재 room/thread/message 또는
신뢰된 요청자 ID에 따라 message 작업을 숨기거나 노출할 수 있으며, core `message` 도구에 채널별 분기를 하드코딩할 필요가 없습니다.

이 때문에 임베디드 runner 라우팅 변경은 여전히 plugin 작업입니다. runner는
현재 채팅/세션 ID를 plugin 검색 경계로 전달하여
공용 `message` 도구가 현재 턴에 맞는 채널 소유 표면을 노출하도록 해야 합니다.

채널 소유 실행 helper의 경우, 번들 plugin은 실행
런타임을 자체 extension 모듈 내부에 유지해야 합니다. Core는 더 이상
`src/agents/tools` 아래의 Discord, Slack, Telegram, WhatsApp message-action 런타임을 소유하지 않습니다.
별도의 `plugin-sdk/*-action-runtime` 하위 경로는 공개하지 않으며, 번들
plugin은 자체 확장 소유 모듈에서 로컬 런타임 코드를 직접 import해야 합니다.

같은 경계는 일반적인 provider 이름 기반 SDK 경계에도 적용됩니다. Core는
Slack, Discord, Signal,
WhatsApp 또는 유사 extension용 채널별 편의 barrel을 import해서는 안 됩니다. Core에 특정 동작이 필요하면,
번들 plugin 자체의 `api.ts` / `runtime-api.ts` barrel을 사용하거나,
그 요구를 공용 SDK의 좁고 일반적인 capability로 승격해야 합니다.

특히 poll의 경우 실행 경로가 두 가지입니다.

- `outbound.sendPoll`은 공통
  poll 모델에 맞는 채널을 위한 공용 기본 경로입니다
- `actions.handleAction("poll")`은 채널별
  poll 의미 체계나 추가 poll 파라미터가 있을 때 권장되는 경로입니다

이제 core는 plugin poll dispatch가
해당 작업을 거부한 이후에만 공용 poll 파싱을 수행하므로, plugin 소유 poll handler가
일반 poll parser에 먼저 막히지 않고 채널별 poll
필드를 받을 수 있습니다.

전체 시작 시퀀스는 [Plugin architecture internals](/ko/plugins/architecture-internals)를 참고하세요.

## Capability 소유권 모델

OpenClaw는 네이티브 plugin을 관련 없는 통합의 모음이 아니라 **회사** 또는
**기능**의 소유권 경계로 취급합니다.

즉:

- 회사 plugin은 일반적으로 그 회사의 모든 OpenClaw 노출
  표면을 소유해야 합니다
- 기능 plugin은 일반적으로 자신이 도입한 전체 기능 표면을 소유해야 합니다
- 채널은 provider 동작을 임시로 재구현하는 대신 공용 core capability를
  소비해야 합니다

<Accordion title="번들 plugin 전반의 예시 소유권 패턴">
  - **vendor 다중 capability**: `openai`는 텍스트 추론, 음성, 실시간
    음성, 미디어 이해, 이미지 생성을 소유합니다. `google`은 텍스트
    추론과 함께 미디어 이해, 이미지 생성, 웹 검색을 소유합니다.
    `qwen`은 텍스트 추론과 함께 미디어 이해 및 비디오 생성을 소유합니다.
  - **vendor 단일 capability**: `elevenlabs`와 `microsoft`는 음성을 소유하고,
    `firecrawl`은 웹 가져오기를 소유하며, `minimax` / `mistral` / `moonshot` / `zai`는
    미디어 이해 백엔드를 소유합니다.
  - **기능 plugin**: `voice-call`은 통화 전송, 도구, CLI, route,
    Twilio 미디어 스트림 브리징을 소유하지만, vendor
    plugin을 직접 import하는 대신 공용 음성, 실시간 전사, 실시간 음성 capability를 소비합니다.
</Accordion>

의도된 최종 상태는 다음과 같습니다.

- OpenAI는 텍스트 모델, 음성, 이미지, 향후 비디오에 걸쳐 있더라도 하나의 plugin 안에 존재
- 다른 vendor도 자기 표면 영역에 대해 같은 구조를 가질 수 있음
- 채널은 어떤 vendor plugin이 provider를 소유하는지 신경 쓰지 않고, core가 노출하는
  공용 capability 계약을 소비함

이것이 핵심 구분입니다.

- **plugin** = 소유권 경계
- **capability** = 여러 plugin이 구현하거나 소비할 수 있는 core 계약

따라서 OpenClaw가 비디오 같은 새 도메인을 추가할 때 첫 번째 질문은
"어떤 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 번째 질문은 "core 비디오 capability 계약이
무엇인가?"입니다. 그 계약이 존재하면 vendor plugin은
그것에 대해 등록할 수 있고 채널/기능 plugin은 그것을 소비할 수 있습니다.

capability가 아직 존재하지 않는다면, 일반적으로 올바른 조치는 다음과 같습니다.

1. core에서 누락된 capability를 정의
2. 이를 plugin API/런타임을 통해 타입이 있는 방식으로 노출
3. 채널/기능을 해당 capability에 연결
4. vendor plugin이 구현을 등록하도록 함

이렇게 하면 소유권이 명시적으로 유지되면서도 단일 vendor나 일회성 plugin별 코드 경로에
의존하는 core 동작을 피할 수 있습니다.

### Capability 계층화

코드가 어디에 속해야 하는지 결정할 때 다음 개념 모델을 사용하세요.

- **core capability 계층**: 공용 오케스트레이션, 정책, fallback, config
  병합 규칙, 전달 의미 체계, 타입 계약
- **vendor plugin 계층**: vendor별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
- **채널/기능 plugin 계층**: 공용 capability를 소비하고
  표면에 이를 노출하는 Slack/Discord/voice-call 등의 통합

예를 들어 TTS는 다음 구조를 따릅니다.

- core는 응답 시점 TTS 정책, fallback 순서, prefs, 채널 전달을 소유
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유
- `voice-call`은 telephony TTS 런타임 helper를 소비

향후 capability에도 같은 패턴을 우선 적용해야 합니다.

### 다중 capability 회사 plugin 예시

회사 plugin은 외부에서 볼 때 응집력 있게 느껴져야 합니다. OpenClaw에
모델, 음성, 실시간 전사, 실시간 음성, 미디어
이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색에 대한 공용
계약이 있다면 vendor는 모든 표면을 한 곳에서 소유할 수 있습니다.

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

중요한 것은 정확한 helper 이름이 아닙니다. 중요한 것은 구조입니다.

- 하나의 plugin이 vendor 표면을 소유
- core는 여전히 capability 계약을 소유
- 채널과 기능 plugin은 vendor 코드가 아니라 `api.runtime.*` helper를 소비
- 계약 테스트는 plugin이 자신이 소유한다고 주장하는 capability를
  실제로 등록했는지 검증할 수 있음

### Capability 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공용
capability로 취급합니다. 같은 소유권 모델이 여기에 적용됩니다.

1. core가 media-understanding 계약을 정의
2. vendor plugin이 해당될 경우 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록
3. 채널과 기능 plugin은 vendor 코드에 직접 연결하는 대신
   공용 core 동작을 소비

이렇게 하면 특정 provider의 비디오 가정을 core에 굳혀 넣는 일을 피할 수 있습니다. plugin이
vendor 표면을 소유하고, core가 capability 계약과 fallback 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. core가 타입이 있는
capability 계약과 런타임 helper를 소유하고, vendor plugin이
`api.registerVideoGenerationProvider(...)` 구현을 여기에 등록합니다.

구체적인 롤아웃 체크리스트가 필요하신가요? [Capability Cookbook](/ko/plugins/architecture)을 참고하세요.

## 계약과 강제

plugin API 표면은 의도적으로 `OpenClawPluginApi`에 타입이 지정되고 집중되어 있습니다.
이 계약은 지원되는 등록 지점과
plugin이 의존할 수 있는 런타임 helper를 정의합니다.

이것이 중요한 이유:

- plugin 작성자는 하나의 안정적인 내부 표준을 얻게 됨
- core는 같은 provider id를 등록하는 두 plugin 같은 중복 소유권을 거부할 수 있음
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있음
- 계약 테스트는 번들 plugin 소유권을 강제하고 조용한 drift를 방지할 수 있음

강제는 두 계층으로 이루어집니다.

1. **런타임 등록 강제**
   plugin 레지스트리는 plugin이 로드될 때 등록을 검증합니다. 예:
   중복 provider id, 중복 음성 provider id, 잘못된
   등록은 정의되지 않은 동작 대신 plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 plugin은 테스트 실행 중 계약 레지스트리에 캡처되므로
   OpenClaw는 소유권을 명시적으로 검증할 수 있습니다. 현재 이는 모델
   provider, 음성 provider, 웹 검색 provider, 번들 등록
   소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 plugin이 어떤
표면을 소유하는지 미리 알고 있다는 것입니다. 소유권이 암묵적인 것이 아니라
선언되고, 타입이 있고, 테스트 가능하기 때문에 core와 채널이 자연스럽게 조합될 수 있습니다.

### 계약에 포함되어야 하는 것

좋은 plugin 계약은 다음과 같습니다.

- 타입이 있음
- 작음
- capability별로 구체적임
- core가 소유함
- 여러 plugin에서 재사용 가능함
- 채널/기능이 vendor 지식 없이 소비 가능함

나쁜 plugin 계약은 다음과 같습니다.

- core 안에 숨겨진 vendor별 정책
- 레지스트리를 우회하는 일회성 plugin 탈출구
- vendor 구현에 직접 접근하는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

확신이 서지 않으면 추상화 수준을 높이세요. 먼저 capability를 정의한 다음,
plugin이 거기에 연결되도록 하세요.

## 실행 모델

네이티브 OpenClaw plugin은 Gateway와 **같은 프로세스 안에서**
실행됩니다. sandbox되지 않습니다. 로드된 네이티브 plugin은 core 코드와 같은 프로세스 수준 신뢰 경계를 가집니다.

의미:

- 네이티브 plugin은 도구, 네트워크 핸들러, hook, 서비스를 등록할 수 있음
- 네이티브 plugin 버그는 gateway를 충돌시키거나 불안정하게 만들 수 있음
- 악의적인 네이티브 plugin은 OpenClaw 프로세스 내부에서의 임의 코드 실행과 동일함

호환 번들은 OpenClaw가 현재 이를 메타데이터/콘텐츠 팩으로 취급하기 때문에
기본적으로 더 안전합니다. 현재 릴리스에서는 주로 번들
Skills가 이에 해당합니다.

번들이 아닌 plugin에는 allowlist와 명시적 설치/로드 경로를 사용하세요. workspace
plugin은 프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 workspace 패키지 이름의 경우 plugin id는 기본적으로 npm
이름의 `@openclaw/<id>`에 고정하세요. 또는 패키지가 의도적으로 더 좁은 plugin 역할을 노출하는 경우
`-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은 승인된 타입 접미사를 사용할 수 있습니다.

중요한 신뢰 참고:

- `plugins.allow`는 **plugin id**를 신뢰하며, 소스 출처를 신뢰하는 것이 아닙니다.
- 번들 plugin과 같은 id를 가진 workspace plugin은 해당 workspace plugin이 활성화/allowlist되면 의도적으로 번들 복사본을 가립니다.
- 이는 정상적인 동작이며 로컬 개발, 패치 테스트, hotfix에 유용합니다.
- 번들 plugin 신뢰는 설치 메타데이터가 아니라 소스 스냅샷 — 즉 로드 시점의 manifest와 디스크 위 코드 — 에서 확인됩니다. 손상되었거나 대체된 설치 레코드가
  실제 소스가 주장하는 범위를 넘어서 번들 plugin의 신뢰 표면을 조용히 넓힐 수는 없습니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 capability를 export합니다.

capability 등록은 공개 상태로 유지하세요. 계약이 아닌 helper export는 줄이세요.

- 번들 plugin 전용 helper 하위 경로
- 공개 API가 아닌 런타임 plumbing 하위 경로
- vendor별 편의 helper
- 구현 세부 사항인 setup/onboarding helper

일부 번들 plugin helper 하위 경로는 호환성과 번들 plugin 유지보수를 위해 생성된 SDK export
맵에 여전히 남아 있습니다. 현재 예시로는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 그리고 여러 `plugin-sdk/matrix*` 경계가 있습니다. 이러한 것은
새 서드파티 plugin을 위한 권장 SDK 패턴이 아니라 예약된 구현 세부 사항 export로 취급하세요.

## 내부 구조와 참조

로드 파이프라인, 레지스트리 모델, provider 런타임 hook, Gateway HTTP
route, message 도구 schema, 채널 대상 확인, provider 카탈로그,
컨텍스트 엔진 plugin, 새 capability 추가 가이드는
[Plugin architecture internals](/ko/plugins/architecture-internals)를 참고하세요.

## 관련

- [Building plugins](/ko/plugins/building-plugins)
- [Plugin SDK setup](/ko/plugins/sdk-setup)
- [Plugin manifest](/ko/plugins/manifest)
