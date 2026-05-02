---
read_when:
    - 네이티브 OpenClaw Plugin 빌드 또는 디버깅
    - Plugin 기능 모델 또는 소유권 경계 이해하기
    - Plugin 로드 파이프라인 또는 레지스트리에서 작업하기
    - 프로바이더 런타임 훅 또는 채널 Plugin 구현
sidebarTitle: Internals
summary: 'Plugin 내부: 기능 모델, 소유권, 계약, 로드 파이프라인 및 런타임 헬퍼'
title: Plugin 내부 구조
x-i18n:
    generated_at: "2026-05-02T20:57:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

이 문서는 OpenClaw Plugin 시스템의 **심층 아키텍처 참조**입니다. 실용적인 가이드는 아래의 집중 페이지 중 하나에서 시작하세요.

<CardGroup cols={2}>
  <Card title="Plugin 설치 및 사용" icon="plug" href="/ko/tools/plugin">
    Plugin 추가, 활성화 및 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 빌드" icon="rocket" href="/ko/plugins/building-plugins">
    최소 동작 매니페스트로 시작하는 첫 Plugin 튜토리얼입니다.
  </Card>
  <Card title="채널 Plugin" icon="comments" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin을 빌드합니다.
  </Card>
  <Card title="제공자 Plugin" icon="microchip" href="/ko/plugins/sdk-provider-plugins">
    모델 제공자 Plugin을 빌드합니다.
  </Card>
  <Card title="SDK 개요" icon="book" href="/ko/plugins/sdk-overview">
    가져오기 맵 및 등록 API 참조입니다.
  </Card>
</CardGroup>

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **네이티브 Plugin** 모델입니다. 모든 네이티브 OpenClaw Plugin은 하나 이상의 기능 유형에 등록됩니다.

| 기능                   | 등록 메서드                                      | 예시 Plugin                          |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 텍스트 추론            | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 음성                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 동영상 생성            | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | `google`                             |
| 채널 / 메시징          | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway 검색           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
기능을 하나도 등록하지 않지만 훅, 도구, 검색 서비스 또는 백그라운드 서비스를 제공하는 Plugin은 **레거시 훅 전용** Plugin입니다. 이 패턴은 여전히 완전히 지원됩니다.
</Note>

### 외부 호환성 방침

기능 모델은 코어에 반영되어 현재 번들/네이티브 Plugin에서 사용되고 있지만, 외부 Plugin 호환성에는 “내보내졌으므로 고정되었다”보다 더 엄격한 기준이 필요합니다.

| Plugin 상황                                      | 지침                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 기존 외부 Plugin                                 | 훅 기반 통합이 계속 동작하도록 유지합니다. 이것이 호환성 기준선입니다.                           |
| 새 번들/네이티브 Plugin                          | 공급업체별 내부 접근이나 새 훅 전용 설계보다 명시적 기능 등록을 선호합니다.                      |
| 기능 등록을 도입하는 외부 Plugin                 | 허용되지만, 문서에서 안정적이라고 표시하지 않는 한 기능별 헬퍼 표면은 진화 중인 것으로 취급합니다. |

기능 등록은 의도된 방향입니다. 레거시 훅은 전환 기간 동안 외부 Plugin에 가장 안전한 무중단 경로로 남아 있습니다. 내보낸 헬퍼 하위 경로가 모두 같은 수준은 아닙니다. 우발적인 헬퍼 내보내기보다 좁고 문서화된 계약을 선호하세요.

### Plugin 형태

OpenClaw는 로드된 모든 Plugin을 정적 메타데이터만이 아니라 실제 등록 동작을 기준으로 형태별로 분류합니다.

<AccordionGroup>
  <Accordion title="plain-capability">
    정확히 하나의 기능 유형을 등록합니다(예: `mistral` 같은 제공자 전용 Plugin).
  </Accordion>
  <Accordion title="hybrid-capability">
    여러 기능 유형을 등록합니다(예: `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 소유합니다).
  </Accordion>
  <Accordion title="hook-only">
    훅(타입 지정 또는 사용자 지정)만 등록하고, 기능, 도구, 명령 또는 서비스는 등록하지 않습니다.
  </Accordion>
  <Accordion title="non-capability">
    도구, 명령, 서비스 또는 라우트를 등록하지만 기능은 등록하지 않습니다.
  </Accordion>
</AccordionGroup>

Plugin의 형태와 기능 분석을 보려면 `openclaw plugins inspect <id>`를 사용하세요. 자세한 내용은 [CLI 참조](/ko/cli/plugins#inspect)를 확인하세요.

### 레거시 훅

`before_agent_start` 훅은 훅 전용 Plugin을 위한 호환성 경로로 계속 지원됩니다. 레거시 실제 Plugin은 여전히 이 훅에 의존합니다.

방향:

- 계속 동작하게 유지합니다
- 레거시로 문서화합니다
- 모델/제공자 오버라이드 작업에는 `before_model_resolve`를 선호합니다
- 프롬프트 변경 작업에는 `before_prompt_build`를 선호합니다
- 실제 사용량이 줄고 픽스처 커버리지가 마이그레이션 안전성을 입증한 후에만 제거합니다

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면 다음 레이블 중 하나가 표시될 수 있습니다.

| 신호                       | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config가 정상적으로 파싱되고 Plugin이 해석됩니다             |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴(예: `hook-only`)을 사용합니다 |
| **legacy warning**         | Plugin이 사용 중단된 `before_agent_start`를 사용합니다       |
| **hard error**             | Config가 유효하지 않거나 Plugin 로드에 실패했습니다          |

`hook-only`와 `before_agent_start` 모두 현재 Plugin을 중단시키지 않습니다. `hook-only`는 안내이며, `before_agent_start`는 경고만 발생시킵니다. 이러한 신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템에는 네 개의 계층이 있습니다.

<Steps>
  <Step title="매니페스트 + 검색">
    OpenClaw는 구성된 경로, 워크스페이스 루트, 전역 Plugin 루트 및 번들 Plugin에서 후보 Plugin을 찾습니다. 검색은 먼저 네이티브 `openclaw.plugin.json` 매니페스트와 지원되는 번들 매니페스트를 읽습니다.
  </Step>
  <Step title="활성화 + 검증">
    코어는 검색된 Plugin이 활성화, 비활성화, 차단되었는지 또는 메모리 같은 독점 슬롯에 선택되었는지 결정합니다.
  </Step>
  <Step title="런타임 로딩">
    네이티브 OpenClaw Plugin은 프로세스 내에서 로드되고 중앙 레지스트리에 기능을 등록합니다. 패키징된 JavaScript는 네이티브 `require`를 통해 로드되며, 서드파티 로컬 소스 TypeScript는 비상용 Jiti 폴백입니다. 호환 번들은 런타임 코드를 가져오지 않고 레지스트리 레코드로 정규화됩니다.
  </Step>
  <Step title="표면 소비">
    OpenClaw의 나머지 부분은 레지스트리를 읽어 도구, 채널, 제공자 설정, 훅, HTTP 라우트, CLI 명령 및 서비스를 노출합니다.
  </Step>
</Steps>

Plugin CLI에 한정하면, 루트 명령 검색은 두 단계로 나뉩니다.

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 옵니다
- 실제 Plugin CLI 모듈은 지연 상태를 유지하고 첫 호출 시 등록될 수 있습니다

이를 통해 Plugin 소유 CLI 코드는 Plugin 내부에 유지하면서도, OpenClaw가 파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계는 다음과 같습니다.

- 매니페스트/config 검증은 Plugin 코드를 실행하지 않고 **매니페스트/스키마 메타데이터**에서 동작해야 합니다
- 네이티브 기능 검색은 신뢰할 수 있는 Plugin 엔트리 코드를 로드하여 비활성화 레지스트리 스냅샷을 빌드할 수 있습니다
- 네이티브 런타임 동작은 `api.registrationMode === "full"`인 Plugin 모듈의 `register(api)` 경로에서 옵니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에 config를 검증하고, 누락/비활성화된 Plugin을 설명하며, UI/스키마 힌트를 빌드할 수 있습니다.

### Plugin 메타데이터 스냅샷 및 조회 테이블

Gateway 시작은 현재 config 스냅샷에 대해 하나의 `PluginMetadataSnapshot`을 빌드합니다. 이 스냅샷은 메타데이터 전용입니다. 설치된 Plugin 인덱스, 매니페스트 레지스트리, 매니페스트 진단, 소유자 맵, Plugin id 정규화기 및 매니페스트 레코드를 저장합니다. 로드된 Plugin 모듈, 제공자 SDK, 패키지 콘텐츠 또는 런타임 내보내기는 보유하지 않습니다.

Plugin 인식 config 검증, 시작 자동 활성화 및 Gateway Plugin 부트스트랩은 매니페스트/인덱스 메타데이터를 독립적으로 다시 빌드하는 대신 이 스냅샷을 사용합니다. `PluginLookUpTable`은 같은 스냅샷에서 파생되며 현재 런타임 config에 대한 시작 Plugin 계획을 추가합니다.

시작 후 Gateway는 현재 메타데이터 스냅샷을 교체 가능한 런타임 산출물로 유지합니다. 반복되는 런타임 제공자 검색은 각 제공자 카탈로그 패스마다 설치된 인덱스와 매니페스트 레지스트리를 재구성하는 대신 이 스냅샷을 빌릴 수 있습니다. 스냅샷은 Gateway 종료, config/Plugin 인벤토리 변경 및 설치된 인덱스 쓰기 시 지워지거나 교체됩니다. 호환되는 현재 스냅샷이 없으면 호출자는 콜드 매니페스트/인덱스 경로로 폴백합니다. 워크스페이스 Plugin은 메타데이터 범위의 일부이므로, 호환성 검사에는 `plugins.load.paths` 및 기본 에이전트 워크스페이스 같은 Plugin 검색 루트가 포함되어야 합니다.

스냅샷과 조회 테이블은 반복되는 시작 결정을 빠른 경로에 유지합니다.

- 채널 소유권
- 지연된 채널 시작
- 시작 Plugin id
- 제공자 및 CLI 백엔드 소유권
- 설정 제공자, 명령 별칭, 모델 카탈로그 제공자 및 매니페스트 계약 소유권
- Plugin config 스키마 및 채널 config 스키마 검증
- 시작 자동 활성화 결정

안전 경계는 스냅샷 변경이 아니라 스냅샷 교체입니다. config, Plugin 인벤토리, 설치 레코드 또는 지속된 인덱스 정책이 변경되면 스냅샷을 다시 빌드하세요. 이를 광범위한 변경 가능한 전역 레지스트리로 취급하지 말고, 무제한의 과거 스냅샷을 보관하지 마세요. 오래된 런타임 상태가 메타데이터 캐시 뒤에 숨겨지지 않도록 런타임 Plugin 로딩은 메타데이터 스냅샷과 별도로 유지됩니다.

캐시 규칙은 [Plugin 아키텍처 내부](/ko/plugins/architecture-internals#plugin-cache-boundary)에 문서화되어 있습니다. 매니페스트 및 검색 메타데이터는 호출자가 현재 흐름에 대한 명시적 스냅샷, 조회 테이블 또는 매니페스트 레지스트리를 보유하지 않는 한 최신 상태입니다. 숨겨진 메타데이터 캐시와 벽시계 TTL은 Plugin 로딩의 일부가 아닙니다. 런타임 로더, 모듈 및 의존성 아티팩트 캐시만 코드 또는 설치된 아티팩트가 실제로 로드된 후에도 지속될 수 있습니다.

일부 콜드 경로 호출자는 여전히 Gateway `PluginLookUpTable`을 받는 대신 지속된 설치 Plugin 인덱스에서 매니페스트 레지스트리를 직접 재구성합니다. 이제 해당 경로는 필요할 때 레지스트리를 재구성합니다. 호출자가 이미 현재 조회 테이블이나 명시적 매니페스트 레지스트리를 가지고 있다면, 런타임 흐름을 통해 이를 전달하는 방식을 선호하세요.

### 활성화 계획

활성화 계획은 제어 평면의 일부입니다. 호출자는 더 넓은 런타임 레지스트리를 로드하기 전에 구체적인 명령, 제공자, 채널, 라우트, 에이전트 하니스 또는 기능과 관련된 Plugin을 요청할 수 있습니다.

플래너는 현재 매니페스트 동작과의 호환성을 유지합니다.

- `activation.*` 필드는 명시적 플래너 힌트입니다
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` 및 훅은 매니페스트 소유권 폴백으로 남습니다
- id 전용 플래너 API는 기존 호출자에게 계속 제공됩니다
- 계획 API는 진단이 명시적 힌트와 소유권 폴백을 구분할 수 있도록 이유 레이블을 보고합니다

<Warning>
`activation`을 수명 주기 훅이나 `register(...)`의 대체물로 취급하지 마세요. 이는 로딩 범위를 좁히는 데 사용되는 메타데이터입니다. 관계를 이미 설명하는 소유권 필드가 있으면 그것을 우선 사용하고, `activation`은 추가 플래너 힌트에만 사용하세요.
</Warning>

### 채널 Plugin과 공유 메시지 도구

채널 Plugin은 일반 채팅 작업을 위해 별도의 보내기/편집/반응 도구를 등록할 필요가 없습니다. OpenClaw는 코어에 하나의 공유 `message` 도구를 유지하며, 채널 Plugin은 그 뒤의 채널별 탐색과 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- 코어는 공유 `message` 도구 호스트, 프롬프트 연결, 세션/스레드 장부 관리, 실행 디스패치를 소유합니다
- 채널 Plugin은 범위가 지정된 작업 탐색, 기능 탐색, 모든 채널별 스키마 조각을 소유합니다
- 채널 Plugin은 대화 id가 스레드 id를 인코딩하거나 부모 대화에서 상속하는 방식 같은 제공자별 세션 대화 문법을 소유합니다
- 채널 Plugin은 자체 작업 어댑터를 통해 최종 작업을 실행합니다

채널 Plugin의 경우 SDK 표면은 `ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 그 통합 탐색 호출을 통해 Plugin은 표시되는 작업, 기능, 스키마 기여를 함께 반환할 수 있으므로 해당 부분들이 서로 어긋나지 않습니다.

채널별 메시지 도구 매개변수가 로컬 경로나 원격 미디어 URL 같은 미디어 소스를 전달하는 경우, Plugin은 `describeMessageTool(...)`에서 `mediaSourceParams`도 반환해야 합니다. 코어는 명시적인 이 목록을 사용해 Plugin 소유 매개변수 이름을 하드코딩하지 않고 샌드박스 경로 정규화와 아웃바운드 미디어 접근 힌트를 적용합니다. 이때 채널 전체의 평면 목록이 아니라 작업 범위 맵을 선호하세요. 그래야 프로필 전용 미디어 매개변수가 `send` 같은 관련 없는 작업에서 정규화되지 않습니다.

코어는 해당 탐색 단계에 런타임 범위를 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이는 컨텍스트에 민감한 Plugin에 중요합니다. 채널은 코어 `message` 도구에 채널별 분기를 하드코딩하지 않고도 활성 계정, 현재 방/스레드/메시지, 신뢰된 요청자 ID를 기준으로 메시지 작업을 숨기거나 노출할 수 있습니다.

이것이 임베디드 러너 라우팅 변경이 여전히 Plugin 작업인 이유입니다. 러너는 현재 채팅/세션 ID를 Plugin 탐색 경계로 전달해 공유 `message` 도구가 현재 턴에 맞는 채널 소유 표면을 노출하도록 할 책임이 있습니다.

채널 소유 실행 헬퍼의 경우, 번들 Plugin은 실행 런타임을 자체 확장 모듈 안에 유지해야 합니다. 코어는 더 이상 `src/agents/tools` 아래의 Discord, Slack, Telegram, WhatsApp 메시지 작업 런타임을 소유하지 않습니다. 별도의 `plugin-sdk/*-action-runtime` 하위 경로를 게시하지 않으며, 번들 Plugin은 자체 확장 소유 모듈에서 로컬 런타임 코드를 직접 가져와야 합니다.

동일한 경계는 일반적으로 제공자 이름이 붙은 SDK 연결부에도 적용됩니다. 코어는 Slack, Discord, Signal, WhatsApp 또는 유사한 확장을 위한 채널별 편의 배럴을 가져오면 안 됩니다. 코어에 어떤 동작이 필요하다면 번들 Plugin 자체의 `api.ts` / `runtime-api.ts` 배럴을 사용하거나, 그 필요를 공유 SDK의 좁은 범용 기능으로 승격하세요.

번들 Plugin도 같은 규칙을 따릅니다. 번들 Plugin의 `runtime-api.ts`는 자체 브랜드 `openclaw/plugin-sdk/<plugin-id>` 퍼사드를 다시 내보내면 안 됩니다. 이러한 브랜드 퍼사드는 외부 Plugin과 이전 소비자를 위한 호환성 shim으로 남아 있지만, 번들 Plugin은 로컬 내보내기와 `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, `openclaw/plugin-sdk/webhook-ingress` 같은 좁은 범용 SDK 하위 경로를 사용해야 합니다. 새 코드는 기존 외부 생태계의 호환성 경계가 요구하지 않는 한 Plugin id별 SDK 퍼사드를 추가하면 안 됩니다.

투표의 경우 구체적으로 두 가지 실행 경로가 있습니다.

- `outbound.sendPoll`은 공통 투표 모델에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 투표 의미론이나 추가 투표 매개변수에 선호되는 경로입니다

코어는 이제 Plugin 투표 디스패치가 해당 작업을 거절한 뒤에야 공유 투표 파싱을 지연 수행하므로, Plugin 소유 투표 핸들러는 범용 투표 파서에 먼저 막히지 않고 채널별 투표 필드를 받을 수 있습니다.

전체 시작 순서는 [Plugin 아키텍처 내부](/ko/plugins/architecture-internals)를 참조하세요.

## 기능 소유권 모델

OpenClaw는 네이티브 Plugin을 관련 없는 통합의 모음이 아니라 **회사** 또는 **기능**의 소유권 경계로 취급합니다.

이는 다음을 의미합니다.

- 회사 Plugin은 일반적으로 해당 회사의 OpenClaw 대면 표면 전체를 소유해야 합니다
- 기능 Plugin은 일반적으로 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 제공자 동작을 임시로 다시 구현하는 대신 공유 코어 기능을 사용해야 합니다

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai`는 텍스트 추론, 음성, 실시간 음성, 미디어 이해, 이미지 생성을 소유합니다. `google`은 텍스트 추론과 미디어 이해, 이미지 생성, 웹 검색을 소유합니다. `qwen`은 텍스트 추론과 미디어 이해, 비디오 생성을 소유합니다.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs`와 `microsoft`는 음성을 소유하고, `firecrawl`은 웹 가져오기를 소유하며, `minimax` / `mistral` / `moonshot` / `zai`는 미디어 이해 백엔드를 소유합니다.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call`은 통화 전송, 도구, CLI, 라우트, Twilio 미디어 스트림 브리징을 소유하지만, 공급업체 Plugin을 직접 가져오는 대신 공유 음성, 실시간 전사, 실시간 음성 기능을 사용합니다.
  </Accordion>
</AccordionGroup>

의도한 최종 상태는 다음과 같습니다.

- OpenAI는 텍스트 모델, 음성, 이미지, 미래의 비디오까지 걸치더라도 하나의 Plugin에 존재합니다
- 다른 공급업체도 자체 표면 영역에 대해 동일하게 할 수 있습니다
- 채널은 어떤 공급업체 Plugin이 제공자를 소유하는지 신경 쓰지 않고, 코어가 노출하는 공유 기능 계약을 사용합니다

핵심 구분은 다음과 같습니다.

- **Plugin** = 소유권 경계
- **기능** = 여러 Plugin이 구현하거나 사용할 수 있는 코어 계약

따라서 OpenClaw가 비디오 같은 새 도메인을 추가한다면, 첫 번째 질문은 "어떤 제공자가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 번째 질문은 "코어 비디오 기능 계약은 무엇인가?"입니다. 그 계약이 존재하면 공급업체 Plugin은 그에 맞춰 등록할 수 있고, 채널/기능 Plugin은 이를 사용할 수 있습니다.

기능이 아직 없다면 일반적으로 올바른 조치는 다음과 같습니다.

<Steps>
  <Step title="Define the capability">
    코어에서 누락된 기능을 정의합니다.
  </Step>
  <Step title="Expose through the SDK">
    Plugin API/런타임을 통해 타입이 지정된 방식으로 노출합니다.
  </Step>
  <Step title="Wire consumers">
    채널/기능을 해당 기능에 연결합니다.
  </Step>
  <Step title="Vendor implementations">
    공급업체 Plugin이 구현을 등록하도록 합니다.
  </Step>
</Steps>

이렇게 하면 소유권을 명확히 유지하면서 단일 공급업체나 일회성 Plugin별 코드 경로에 의존하는 코어 동작을 피할 수 있습니다.

### 기능 계층화

코드가 어디에 속하는지 결정할 때 이 사고 모델을 사용하세요.

<Tabs>
  <Tab title="Core capability layer">
    공유 오케스트레이션, 정책, fallback, 설정 병합 규칙, 전달 의미론, 타입이 지정된 계약입니다.
  </Tab>
  <Tab title="Vendor plugin layer">
    공급업체별 API, 인증, 모델 카탈로그, 음성 합성, 이미지 생성, 미래 비디오 백엔드, 사용량 엔드포인트입니다.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    코어 기능을 사용하고 이를 표면에 표시하는 Slack/Discord/voice-call/etc. 통합입니다.
  </Tab>
</Tabs>

예를 들어 TTS는 다음 구조를 따릅니다.

- 코어는 응답 시점 TTS 정책, fallback 순서, 환경설정, 채널 전달을 소유합니다
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유합니다
- `voice-call`은 전화 통신 TTS 런타임 헬퍼를 사용합니다

미래 기능에도 동일한 패턴을 선호해야 합니다.

### 다중 기능 회사 Plugin 예시

회사 Plugin은 외부에서 보기에 응집력 있게 느껴져야 합니다. OpenClaw에 모델, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색에 대한 공유 계약이 있다면, 공급업체는 모든 표면을 한곳에서 소유할 수 있습니다.

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

중요한 것은 정확한 헬퍼 이름이 아닙니다. 구조가 중요합니다.

- 하나의 Plugin이 공급업체 표면을 소유합니다
- 코어는 여전히 기능 계약을 소유합니다
- 채널과 기능 Plugin은 공급업체 코드가 아니라 `api.runtime.*` 헬퍼를 사용합니다
- 계약 테스트는 Plugin이 소유한다고 주장하는 기능을 등록했는지 검증할 수 있습니다

### 기능 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유 기능으로 취급합니다. 동일한 소유권 모델이 여기에 적용됩니다.

<Steps>
  <Step title="Core defines the contract">
    코어가 미디어 이해 계약을 정의합니다.
  </Step>
  <Step title="Vendor plugins register">
    공급업체 Plugin은 적용 가능한 경우 `describeImage`, `transcribeAudio`, `describeVideo`를 등록합니다.
  </Step>
  <Step title="Consumers use the shared behavior">
    채널과 기능 Plugin은 공급업체 코드에 직접 연결하는 대신 공유 코어 동작을 사용합니다.
  </Step>
</Steps>

이렇게 하면 한 제공자의 비디오 관련 가정이 코어에 굳어지는 것을 피할 수 있습니다. Plugin은 공급업체 표면을 소유하고, 코어는 기능 계약과 fallback 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. 코어는 타입이 지정된 기능 계약과 런타임 헬퍼를 소유하고, 공급업체 Plugin은 이에 대해 `api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 출시 체크리스트가 필요하신가요? [기능 Cookbook](/ko/plugins/architecture)을 참조하세요.

## 계약과 강제

Plugin API 표면은 의도적으로 `OpenClawPluginApi`에 타입이 지정되고 중앙화되어 있습니다. 그 계약은 지원되는 등록 지점과 Plugin이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유는 다음과 같습니다.

- Plugin 작성자는 하나의 안정적인 내부 표준을 얻습니다
- 코어는 두 Plugin이 같은 제공자 id를 등록하는 것 같은 중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있습니다
- 계약 테스트는 번들 Plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다

강제에는 두 계층이 있습니다.

<AccordionGroup>
  <Accordion title="런타임 등록 강제">
    Plugin 레지스트리는 Plugin이 로드될 때 등록을 검증합니다. 예: 중복된 제공자 ID, 중복된 음성 제공자 ID, 잘못된 형식의 등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
  </Accordion>
  <Accordion title="계약 테스트">
    번들 Plugin은 테스트 실행 중 계약 레지스트리에 캡처되어 OpenClaw가 소유권을 명시적으로 단언할 수 있습니다. 현재 이는 모델 제공자, 음성 제공자, 웹 검색 제공자, 번들 등록 소유권에 사용됩니다.
  </Accordion>
</AccordionGroup>

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤 표면을 소유하는지 미리 안다는 것입니다. 따라서 소유권이 암시적이지 않고 선언되고, 타입이 지정되며, 테스트 가능하므로 core와 채널이 매끄럽게 구성될 수 있습니다.

### 계약에 포함해야 할 것

<Tabs>
  <Tab title="좋은 계약">
    - 타입이 지정됨
    - 작음
    - 기능별로 특화됨
    - core가 소유함
    - 여러 Plugin에서 재사용 가능함
    - 공급업체 지식 없이 채널/기능에서 소비 가능함

  </Tab>
  <Tab title="나쁜 계약">
    - core에 숨겨진 공급업체별 정책
    - 레지스트리를 우회하는 일회성 Plugin 예외 경로
    - 채널 코드가 공급업체 구현에 직접 접근함
    - `OpenClawPluginApi` 또는 `api.runtime`의 일부가 아닌 임시 런타임 객체

  </Tab>
</Tabs>

확신이 없을 때는 추상화 수준을 높이세요. 먼저 기능을 정의한 다음, Plugin이 그 기능에 연결되도록 하세요.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 **동일 프로세스 내에서** 실행됩니다. 샌드박스 처리되지 않습니다. 로드된 네이티브 Plugin은 core 코드와 동일한 프로세스 수준의 신뢰 경계를 가집니다.

<Warning>
네이티브 Plugin의 의미: Plugin은 도구, 네트워크 핸들러, 훅, 서비스를 등록할 수 있습니다. Plugin 버그는 Gateway를 중단시키거나 불안정하게 만들 수 있습니다. 악성 네이티브 Plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일합니다.
</Warning>

호환 번들은 OpenClaw가 현재 이를 메타데이터/콘텐츠 팩으로 취급하므로 기본적으로 더 안전합니다. 현재 릴리스에서는 주로 번들 Skills를 의미합니다.

번들되지 않은 Plugin에는 허용 목록과 명시적인 설치/로드 경로를 사용하세요. 워크스페이스 Plugin은 프로덕션 기본값이 아니라 개발 시점의 코드로 취급하세요.

번들 워크스페이스 패키지 이름의 경우 Plugin ID를 npm 이름에 고정하세요. 기본값은 `@openclaw/<id>`이며, 패키지가 의도적으로 더 좁은 Plugin 역할을 노출하는 경우 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은 승인된 타입 접미사를 사용할 수 있습니다.

<Note>
**신뢰 참고:** `plugins.allow`는 소스 출처가 아니라 **Plugin ID**를 신뢰합니다. 번들 Plugin과 동일한 ID를 가진 워크스페이스 Plugin은 해당 워크스페이스 Plugin이 활성화/허용 목록에 포함되면 의도적으로 번들 복사본을 가립니다. 이는 로컬 개발, 패치 테스트, 핫픽스에 정상적이고 유용합니다. 번들 Plugin 신뢰는 설치 메타데이터가 아니라 로드 시점의 디스크에 있는 매니페스트와 코드인 소스 스냅샷에서 해석됩니다. 손상되었거나 대체된 설치 기록은 실제 소스가 주장하는 범위를 넘어 번들 Plugin의 신뢰 표면을 조용히 넓힐 수 없습니다.
</Note>

## 내보내기 경계

OpenClaw는 구현 편의가 아니라 기능을 내보냅니다.

기능 등록은 공개로 유지하세요. 계약이 아닌 헬퍼 내보내기는 줄이세요.

- 번들 Plugin 전용 헬퍼 하위 경로
- 공개 API로 의도되지 않은 런타임 배관 하위 경로
- 공급업체별 편의 헬퍼
- 구현 세부 사항인 설정/온보딩 헬퍼

예약된 번들 Plugin 헬퍼 하위 경로는 생성된 SDK 내보내기 맵에서 폐기되었습니다. 소유자별 헬퍼는 소유 Plugin 패키지 내부에 유지하세요. 재사용 가능한 호스트 동작만 `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 계약으로 승격하세요.

## 내부 구조와 참조

로드 파이프라인, 레지스트리 모델, 제공자 런타임 훅, Gateway HTTP 라우트, 메시지 도구 스키마, 채널 대상 해석, 제공자 카탈로그, 컨텍스트 엔진 Plugin, 새 기능 추가 가이드는 [Plugin 아키텍처 내부 구조](/ko/plugins/architecture-internals)를 참조하세요.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin 매니페스트](/ko/plugins/manifest)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
