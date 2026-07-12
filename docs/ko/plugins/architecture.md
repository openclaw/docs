---
read_when:
    - 네이티브 OpenClaw Plugin 빌드 또는 디버깅
    - Plugin 기능 모델 또는 소유권 경계 이해하기
    - Plugin 로드 파이프라인 또는 레지스트리 작업하기
    - 제공자 런타임 훅 또는 채널 Plugin 구현하기
sidebarTitle: Internals
summary: 'Plugin 내부 구조: 기능 모델, 소유권, 계약, 로드 파이프라인 및 런타임 헬퍼'
title: Plugin 내부 구조
x-i18n:
    generated_at: "2026-07-12T15:26:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

이 문서는 OpenClaw Plugin 시스템의 **심층 아키텍처 참조 문서**입니다. 실용적인 가이드는 아래의 주제별 페이지 중 하나에서 시작하십시오.

<CardGroup cols={2}>
  <Card title="Plugin 설치 및 사용" icon="plug" href="/ko/tools/plugin">
    Plugin 추가, 활성화 및 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 빌드" icon="rocket" href="/ko/plugins/building-plugins">
    작동하는 최소 매니페스트를 사용하는 첫 Plugin 튜토리얼입니다.
  </Card>
  <Card title="채널 Plugin" icon="comments" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin을 빌드합니다.
  </Card>
  <Card title="프로바이더 Plugin" icon="microchip" href="/ko/plugins/sdk-provider-plugins">
    모델 프로바이더 Plugin을 빌드합니다.
  </Card>
  <Card title="SDK 개요" icon="book" href="/ko/plugins/sdk-overview">
    임포트 맵 및 등록 API 참조 문서입니다.
  </Card>
</CardGroup>

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **네이티브 Plugin** 모델입니다. 모든 네이티브 OpenClaw Plugin은 하나 이상의 기능 유형에 등록됩니다.

| 기능                   | 등록 메서드                                      | Plugin 예시                     |
| ---------------------- | ------------------------------------------------ | ------------------------------- |
| 텍스트 추론            | `api.registerProvider(...)`                      | `anthropic`, `openai`           |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | `anthropic`, `openai`           |
| 임베딩                 | `api.registerEmbeddingProvider(...)`             | 프로바이더 소유 벡터 Plugin     |
| 음성                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`       |
| 실시간 음성 인식       | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`              |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`              |
| 트랜스크립트 소스      | `api.registerTranscriptSourceProvider(...)`      | `discord`                       |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`       |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`      |
| 동영상 생성            | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`         |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | `firecrawl`                     |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google`  |
| 채널 / 메시징          | `api.registerChannel(...)`                       | `matrix`, `msteams`             |
| Gateway 검색           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                       |

<Note>
기능을 하나도 등록하지 않지만 훅, 도구, 검색 서비스 또는 백그라운드 서비스를 제공하는 Plugin은 **레거시 훅 전용** Plugin입니다. 이 패턴은 여전히 완전히 지원됩니다.
</Note>

### 외부 호환성 방침

기능 모델은 코어에 도입되어 현재 번들/네이티브 Plugin에서 사용되고 있지만, 외부 Plugin 호환성에는 "내보내졌으므로 동결되었다"보다 더 엄격한 기준이 필요합니다.

| Plugin 상황                                  | 지침                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 기존 외부 Plugin                             | 훅 기반 통합이 계속 작동하도록 유지합니다. 이것이 호환성 기준선입니다.                                |
| 새로운 번들/네이티브 Plugin                 | 공급업체별 내부 접근이나 새로운 훅 전용 설계보다 명시적인 기능 등록을 우선합니다.                      |
| 기능 등록을 도입하는 외부 Plugin            | 허용되지만, 문서에서 안정적이라고 명시하지 않는 한 기능별 헬퍼 표면은 계속 발전하는 것으로 간주합니다. |

기능 등록이 지향하는 방향입니다. 전환 기간에는 레거시 훅이 외부 Plugin의 호환성을 깨뜨리지 않는 가장 안전한 경로로 유지됩니다. 내보낸 헬퍼 하위 경로가 모두 동등한 것은 아닙니다. 부수적으로 내보낸 헬퍼보다 범위가 좁고 문서화된 계약을 우선하십시오.

### Plugin 형태

OpenClaw는 정적 메타데이터뿐 아니라 실제 등록 동작을 기준으로 로드된 모든 Plugin을 다음 형태 중 하나로 분류합니다.

<AccordionGroup>
  <Accordion title="plain-capability">
    정확히 하나의 기능 유형을 등록합니다(예: `arcee` 또는 `chutes`와 같은 프로바이더 전용 Plugin).
  </Accordion>
  <Accordion title="hybrid-capability">
    여러 기능 유형을 등록합니다(예: `openai`는 텍스트 추론, 음성, 미디어 이해 및 이미지 생성을 소유합니다).
  </Accordion>
  <Accordion title="hook-only">
    훅(타입 지정 또는 사용자 정의)만 등록하며 기능, 도구, 명령 또는 서비스는 등록하지 않습니다.
  </Accordion>
  <Accordion title="non-capability">
    도구, 명령, 서비스 또는 라우트를 등록하지만 기능은 등록하지 않습니다.
  </Accordion>
</AccordionGroup>

Plugin의 형태와 기능별 분석을 확인하려면 `openclaw plugins inspect <id>`를 사용하십시오. 자세한 내용은 [CLI 참조 문서](/ko/cli/plugins#inspect)를 참조하십시오.

### 레거시 훅

`before_agent_start` 훅은 훅 전용 Plugin을 위한 호환성 경로로 계속 지원됩니다. 실제로 사용 중인 레거시 Plugin이 여전히 이 훅에 의존합니다.

방향:

- 계속 작동하도록 유지합니다
- 레거시로 문서화합니다
- 모델/프로바이더 재정의 작업에는 `before_model_resolve`를 우선합니다
- 프롬프트 변경 작업에는 `before_prompt_build`를 우선합니다
- 실제 사용량이 감소하고 픽스처 적용 범위로 마이그레이션 안전성이 입증된 후에만 제거합니다

### 호환성 신호

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all`, `openclaw plugins doctor`는 다음 호환성 알림을 표시합니다.

| 신호                                       | 의미                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **구성이 유효함**                          | 구성이 정상적으로 파싱되고 Plugin이 확인됩니다                                                                         |
| **훅 전용**(정보)                          | Plugin이 훅만 등록합니다. 지원되는 경로이지만 아직 기능 등록으로 마이그레이션되지 않았습니다                             |
| **레거시 `before_agent_start`**(경고)      | Plugin이 `before_model_resolve`/`before_prompt_build` 대신 사용 중단 예정인 `before_agent_start` 훅을 사용합니다         |
| **사용 중단 예정 메모리 임베딩 API**(경고) | 번들에 포함되지 않은 Plugin이 `registerEmbeddingProvider` 대신 기존의 메모리 전용 임베딩 프로바이더 API를 사용합니다     |
| **치명적 오류**                            | 구성이 유효하지 않거나 Plugin 로드에 실패했습니다                                                                       |

현재 알림/경고 신호 중 어느 것도 Plugin의 작동을 중단시키지 않습니다. 이러한 신호는 `openclaw status --all`과 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 개의 계층으로 구성됩니다.

<Steps>
  <Step title="매니페스트 + 검색">
    OpenClaw는 구성된 경로, 워크스페이스 루트, 전역 Plugin 루트 및 번들 Plugin에서 후보 Plugin을 찾습니다. 검색 시 먼저 네이티브 `openclaw.plugin.json` 매니페스트와 지원되는 번들 매니페스트를 읽습니다.
  </Step>
  <Step title="활성화 + 유효성 검사">
    코어는 검색된 Plugin의 활성화, 비활성화, 차단 여부 또는 메모리와 같은 독점 슬롯에 선택할지를 결정합니다.
  </Step>
  <Step title="런타임 로드">
    네이티브 OpenClaw Plugin은 프로세스 내에서 로드되고 중앙 레지스트리에 기능을 등록합니다. 패키징된 JavaScript는 네이티브 `require`를 통해 로드되며, 서드 파티 로컬 소스 TypeScript에는 비상용 Jiti 폴백이 사용됩니다. 호환되는 번들은 런타임 코드를 임포트하지 않고 레지스트리 레코드로 정규화됩니다.
  </Step>
  <Step title="표면 사용">
    OpenClaw의 나머지 부분은 레지스트리를 읽어 도구, 채널, 프로바이더 설정, 훅, HTTP 라우트, CLI 명령 및 서비스를 노출합니다.
  </Step>
</Steps>

특히 Plugin CLI의 경우 루트 명령 검색은 두 단계로 나뉩니다.

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 가져옵니다
- 실제 Plugin CLI 모듈은 지연 상태를 유지하다가 처음 호출될 때 등록될 수 있습니다

이를 통해 Plugin 소유 CLI 코드는 Plugin 내부에 유지하면서도 OpenClaw가 파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계는 다음과 같습니다.

- 매니페스트/구성 유효성 검사는 Plugin 코드를 실행하지 않고 **매니페스트/스키마 메타데이터**만으로 작동해야 합니다
- 네이티브 기능 검색은 활성화되지 않는 레지스트리 스냅샷을 빌드하기 위해 신뢰할 수 있는 Plugin 진입점 코드를 로드할 수 있습니다
- 네이티브 런타임 동작은 `api.registrationMode === "full"`인 Plugin 모듈의 `register(api)` 경로에서 제공됩니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에 구성을 검증하고, 누락되거나 비활성화된 Plugin을 설명하며, UI/스키마 힌트를 빌드할 수 있습니다.

### Plugin 메타데이터 스냅샷 및 조회 테이블

Gateway 시작 시 현재 구성 스냅샷에 대해 하나의 `PluginMetadataSnapshot`을 빌드합니다. 이 스냅샷은 메타데이터 전용이며, 설치된 Plugin 인덱스, 매니페스트 레지스트리, 매니페스트 진단 정보, 소유자 맵, Plugin ID 정규화 도구 및 매니페스트 레코드를 저장합니다. 로드된 Plugin 모듈, 프로바이더 SDK, 패키지 콘텐츠 또는 런타임 내보내기는 보관하지 않습니다.

Plugin 인식 구성 유효성 검사, 시작 시 자동 활성화 및 Gateway Plugin 부트스트랩은 각각 독립적으로 매니페스트/인덱스 메타데이터를 다시 빌드하는 대신 해당 스냅샷을 사용합니다. `PluginLookUpTable`은 동일한 스냅샷에서 파생되며 현재 런타임 구성을 위한 시작 Plugin 계획을 추가합니다.

시작 후 Gateway는 현재 메타데이터 스냅샷을 교체 가능한 런타임 산출물로 유지합니다. 반복되는 런타임 프로바이더 검색은 프로바이더 카탈로그를 순회할 때마다 설치된 인덱스와 매니페스트 레지스트리를 재구성하는 대신 해당 스냅샷을 빌려 사용할 수 있습니다. Gateway 종료, 구성/Plugin 인벤토리 변경 및 설치된 인덱스 쓰기 시 스냅샷이 지워지거나 교체됩니다. 호환되는 현재 스냅샷이 없으면 호출자는 콜드 매니페스트/인덱스 경로를 사용합니다. 워크스페이스 Plugin은 메타데이터 범위에 포함되므로 호환성 검사에는 `plugins.load.paths` 및 기본 에이전트 워크스페이스와 같은 Plugin 검색 루트가 포함되어야 합니다.

스냅샷과 조회 테이블은 반복되는 시작 결정을 빠른 경로에서 처리하도록 합니다.

- 채널 소유권
- 지연된 채널 시작
- 시작 Plugin ID
- 프로바이더 및 CLI 백엔드 소유권
- 설정 프로바이더, 명령 별칭, 모델 카탈로그 프로바이더 및 매니페스트 계약 소유권
- Plugin 구성 스키마 및 채널 구성 스키마 유효성 검사
- 시작 시 자동 활성화 결정

안전 경계는 스냅샷 변경이 아니라 스냅샷 교체입니다. 구성, Plugin 인벤토리, 설치 레코드 또는 영구 저장된 인덱스 정책이 변경되면 스냅샷을 다시 빌드하십시오. 이를 광범위하게 변경 가능한 전역 레지스트리로 취급하지 말고, 과거 스냅샷을 제한 없이 유지하지 마십시오. 런타임 Plugin 로드는 메타데이터 스냅샷과 계속 분리되므로 오래된 런타임 상태가 메타데이터 캐시 뒤에 숨겨질 수 없습니다.

캐시 규칙은 [Plugin 아키텍처 내부 구조](/ko/plugins/architecture-internals#plugin-cache-boundary)에 문서화되어 있습니다. 호출자가 현재 흐름을 위한 명시적 스냅샷, 조회 테이블 또는 매니페스트 레지스트리를 보유하지 않는 한 매니페스트 및 검색 메타데이터는 최신 상태입니다. 숨겨진 메타데이터 캐시와 실제 시간 기반 TTL은 Plugin 로드에 포함되지 않습니다. 런타임 로더, 모듈 및 종속성 아티팩트 캐시만 코드나 설치된 아티팩트가 실제로 로드된 후에도 유지될 수 있습니다.

일부 콜드 경로 호출자는 Gateway `PluginLookUpTable`을 전달받는 대신 영구 저장된 설치 Plugin 인덱스에서 직접 매니페스트 레지스트리를 재구성합니다. 이제 이 경로는 필요할 때 레지스트리를 재구성합니다. 호출자가 이미 현재 조회 테이블이나 명시적 매니페스트 레지스트리를 보유하고 있다면 런타임 흐름을 통해 이를 전달하는 방식을 우선하십시오.

### 활성화 계획

활성화 계획은 제어 영역의 일부입니다. 호출자는 더 광범위한 런타임 레지스트리를 로드하기 전에 구체적인 명령, 제공자, 채널, 경로, 에이전트 하네스 또는 기능과 관련된 플러그인을 확인할 수 있습니다.

플래너는 현재 매니페스트 동작과의 호환성을 유지합니다.

- `activation.*` 필드는 명시적인 플래너 힌트입니다
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` 및 훅은 계속 매니페스트 소유권 폴백으로 사용됩니다
- 기존 호출자를 위해 ID 전용 플래너 API가 계속 제공됩니다
- 계획 API는 진단 시 명시적 힌트와 소유권 폴백을 구분할 수 있도록 이유 레이블을 보고합니다

<Warning>
`activation`을 수명 주기 훅이나 `register(...)`의 대체 수단으로 취급하지 마십시오. 이는 로드 범위를 좁히는 데 사용하는 메타데이터입니다. 소유권 필드가 이미 관계를 설명한다면 해당 필드를 우선 사용하고, 추가적인 플래너 힌트에만 `activation`을 사용하십시오.
</Warning>

### 채널 플러그인과 공유 메시지 도구

채널 플러그인은 일반적인 채팅 작업을 위해 별도의 전송/편집/반응 도구를 등록할 필요가 없습니다. OpenClaw는 코어에 하나의 공유 `message` 도구를 유지하며, 채널 플러그인은 그 뒤에서 채널별 탐색과 실행을 담당합니다.

현재 경계는 다음과 같습니다.

- 코어는 공유 `message` 도구 호스트, 프롬프트 연결, 세션/스레드 관리 및 실행 디스패치를 담당합니다
- 채널 플러그인은 범위가 지정된 작업 탐색, 기능 탐색 및 모든 채널별 스키마 조각을 담당합니다
- 채널 플러그인은 대화 ID가 스레드 ID를 인코딩하거나 상위 대화에서 상속되는 방식 등 제공자별 세션 대화 문법을 담당합니다
- 채널 플러그인은 작업 어댑터를 통해 최종 작업을 실행합니다

채널 플러그인용 SDK 표면은 `ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 탐색 호출을 사용하면 플러그인이 표시되는 작업, 기능 및 스키마 기여를 함께 반환할 수 있으므로 이러한 요소가 서로 어긋나지 않습니다.

채널별 메시지 도구 매개변수가 로컬 경로나 원격 미디어 URL 같은 미디어 소스를 전달하는 경우, 플러그인은 `describeMessageTool(...)`에서 `mediaSourceParams`도 반환해야 합니다. 코어는 이 명시적 목록을 사용하여 플러그인이 소유한 매개변수 이름을 하드코딩하지 않고 샌드박스 경로 정규화와 아웃바운드 미디어 접근 힌트를 적용합니다. 프로필 전용 미디어 매개변수가 `send` 같은 관련 없는 작업에서 정규화되지 않도록, 채널 전체에 적용되는 하나의 평면 목록 대신 작업 범위 맵을 우선 사용하십시오.

코어는 해당 탐색 단계에 런타임 범위를 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰할 수 있는 인바운드 `requesterSenderId`

이는 컨텍스트에 민감한 플러그인에서 중요합니다. 채널은 코어 `message` 도구에 채널별 분기를 하드코딩하지 않고도 활성 계정, 현재 방/스레드/메시지 또는 신뢰할 수 있는 요청자 ID에 따라 메시지 작업을 숨기거나 표시할 수 있습니다.

임베디드 러너의 라우팅 변경이 여전히 플러그인 작업인 이유가 이것입니다. 러너는 현재 채팅/세션 ID를 플러그인 탐색 경계로 전달하여 공유 `message` 도구가 현재 턴에 적합한 채널 소유 표면을 노출하도록 해야 합니다.

채널 소유 실행 헬퍼의 경우, 번들 플러그인은 실행 런타임을 자체 플러그인 모듈 내부에 유지해야 합니다. 코어는 더 이상 `src/agents/tools` 아래에서 Discord, Slack, Telegram 또는 WhatsApp 메시지 작업 런타임을 소유하지 않습니다. 별도의 `plugin-sdk/*-action-runtime` 하위 경로를 게시하지 않으며, 번들 플러그인은 자체 플러그인 소유 모듈에서 로컬 런타임 코드를 직접 가져와야 합니다.

일반적인 제공자 이름 기반 SDK 경계에도 동일한 원칙이 적용됩니다. 코어는 Discord, Signal, Slack, WhatsApp 또는 유사한 플러그인을 위한 채널별 편의 배럴을 가져오지 않아야 합니다. 코어에 특정 동작이 필요한 경우 번들 플러그인 자체의 `api.ts` / `runtime-api.ts` 배럴을 사용하거나, 해당 요구 사항을 공유 SDK의 좁고 일반적인 기능으로 승격하십시오.

번들 플러그인에도 동일한 규칙이 적용됩니다. 번들 플러그인의 `runtime-api.ts`는 자체 브랜드의 `openclaw/plugin-sdk/<plugin-id>` 퍼사드를 다시 내보내지 않아야 합니다. 이러한 브랜드 퍼사드는 외부 플러그인과 이전 소비자를 위한 호환성 심으로 유지되지만, 번들 플러그인은 로컬 내보내기와 `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` 또는 `openclaw/plugin-sdk/webhook-ingress` 같은 좁고 일반적인 SDK 하위 경로를 사용해야 합니다. 기존 외부 생태계의 호환성 경계에 필요하지 않은 한, 새 코드에 플러그인 ID별 SDK 퍼사드를 추가하지 마십시오.

설문 조사에는 구체적으로 두 가지 실행 경로가 있습니다.

- `outbound.sendPoll`은 공통 설문 조사 모델에 맞는 채널을 위한 공유 기준 경로입니다
- `actions.handleAction("poll")`은 채널별 설문 조사 의미 체계 또는 추가 설문 조사 매개변수를 위한 권장 경로입니다

이제 코어는 플러그인 설문 조사 디스패치가 작업을 거부할 때까지 공유 설문 조사 구문 분석을 미룹니다. 따라서 플러그인 소유 설문 조사 핸들러는 일반 설문 조사 파서에 먼저 차단되지 않고 채널별 설문 조사 필드를 받을 수 있습니다.

전체 시작 순서는 [플러그인 아키텍처 내부 구조](/ko/plugins/architecture-internals)를 참조하십시오.

## 기능 소유권 모델

OpenClaw는 네이티브 플러그인을 관련 없는 통합의 잡다한 모음이 아니라 **회사** 또는 **기능**의 소유권 경계로 취급합니다.

이는 다음을 의미합니다.

- 회사 플러그인은 일반적으로 해당 회사의 모든 OpenClaw 연동 표면을 소유해야 합니다
- 기능 플러그인은 일반적으로 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 제공자 동작을 임의로 다시 구현하지 않고 공유 코어 기능을 사용해야 합니다

<AccordionGroup>
  <Accordion title="공급업체 다중 기능">
    `google`은 텍스트 추론, CLI 백엔드, 임베딩, 음성, 실시간 음성, 미디어 이해, 이미지/음악/동영상 생성 및 웹 검색을 담당합니다. `openai`는 텍스트 추론, 임베딩, 음성, 실시간 전사, 실시간 음성, 미디어 이해 및 이미지/동영상 생성을 담당합니다. `minimax`는 텍스트 추론과 함께 미디어 이해, 음성, 이미지/음악/동영상 생성 및 웹 검색을 담당합니다.
  </Accordion>
  <Accordion title="공급업체 단일 기능">
    `arcee`와 `chutes`는 텍스트 추론만 담당하고, `microsoft`는 음성만 담당합니다. 공급업체 플러그인은 해당 공급업체의 표면을 더 많이 포괄해야 할 때까지 이처럼 좁은 범위를 유지할 수 있습니다.
  </Accordion>
  <Accordion title="기능 플러그인">
    `voice-call`은 통화 전송, 도구, CLI, 경로 및 Twilio 미디어 스트림 브리징을 담당하지만, 공급업체 플러그인을 직접 가져오는 대신 공유 음성, 실시간 전사 및 실시간 음성 기능을 사용합니다.
  </Accordion>
</AccordionGroup>

의도하는 최종 상태는 다음과 같습니다.

- 공급업체의 OpenClaw 연동 표면이 텍스트 모델, 음성, 이미지 및 동영상에 걸쳐 있더라도 하나의 플러그인에 존재합니다
- 다른 공급업체도 자체 표면 영역에 동일한 방식을 적용할 수 있습니다
- 채널은 어떤 공급업체 플러그인이 제공자를 소유하는지 신경 쓰지 않고 코어가 노출하는 공유 기능 계약을 사용합니다

핵심적인 차이는 다음과 같습니다.

- **플러그인** = 소유권 경계
- **기능** = 여러 플러그인이 구현하거나 사용할 수 있는 코어 계약

따라서 OpenClaw가 동영상 같은 새로운 도메인을 추가할 때 첫 번째 질문은 "어떤 제공자가 동영상 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 번째 질문은 "코어 동영상 기능 계약은 무엇인가?"입니다. 해당 계약이 마련되면 공급업체 플러그인이 이를 대상으로 등록하고 채널/기능 플러그인이 이를 사용할 수 있습니다.

기능이 아직 존재하지 않는 경우, 일반적으로 올바른 절차는 다음과 같습니다.

<Steps>
  <Step title="기능 정의">
    코어에서 누락된 기능을 정의합니다.
  </Step>
  <Step title="SDK를 통해 노출">
    플러그인 API/런타임을 통해 형식이 지정된 방식으로 노출합니다.
  </Step>
  <Step title="소비자 연결">
    채널/기능을 해당 기능에 연결합니다.
  </Step>
  <Step title="공급업체 구현">
    공급업체 플러그인이 구현을 등록하도록 합니다.
  </Step>
</Steps>

이를 통해 소유권을 명확히 유지하면서 단일 공급업체나 일회성 플러그인별 코드 경로에 의존하는 코어 동작을 방지할 수 있습니다.

### 기능 계층화

코드가 어디에 속하는지 결정할 때 다음 정신 모델을 사용하십시오.

<Tabs>
  <Tab title="코어 기능 계층">
    공유 오케스트레이션, 정책, 폴백, 구성 병합 규칙, 전달 의미 체계 및 형식이 지정된 계약입니다.
  </Tab>
  <Tab title="공급업체 플러그인 계층">
    공급업체별 API, 인증, 모델 카탈로그, 음성 합성, 이미지 생성, 동영상 백엔드 및 사용량 엔드포인트입니다.
  </Tab>
  <Tab title="채널/기능 플러그인 계층">
    코어 기능을 사용하여 특정 표면에 제공하는 Discord/Slack/voice-call 등의 통합입니다.
  </Tab>
</Tabs>

예를 들어 TTS는 다음 구조를 따릅니다.

- 코어는 응답 시점의 TTS 정책, 폴백 순서, 기본 설정 및 채널 전달을 담당합니다
- `elevenlabs`, `google`, `microsoft` 및 `openai`는 합성 구현을 담당합니다
- `voice-call`은 전화 통신 TTS 런타임 헬퍼를 사용합니다

향후 기능에도 동일한 패턴을 우선 적용해야 합니다.

### 다중 기능 회사 플러그인 예제

회사 플러그인은 외부에서 보기에 응집력 있어야 합니다. OpenClaw가 모델, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 동영상 생성, 웹 가져오기 및 웹 검색을 위한 공유 계약을 제공한다면, 공급업체는 모든 표면을 한곳에서 소유할 수 있습니다.

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // 인증/모델 카탈로그/런타임 훅
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // 공급업체 음성 구성 — SpeechProviderPlugin 인터페이스를 직접 구현
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // 자격 증명 + 가져오기 로직
      }),
    );
  },
};

export default plugin;
```

중요한 것은 정확한 헬퍼 이름이 아니라 구조입니다.

- 하나의 플러그인이 공급업체 표면을 소유합니다
- 코어는 계속 기능 계약을 소유합니다
- 채널과 기능 플러그인은 공급업체 코드가 아니라 `api.runtime.*` 헬퍼를 사용합니다
- 계약 테스트는 플러그인이 소유한다고 주장하는 기능을 등록했는지 검증할 수 있습니다

### 기능 예제: 동영상 이해

OpenClaw는 이미 이미지/오디오/동영상 이해를 하나의 공유 기능으로 취급합니다. 동일한 소유권 모델이 여기에 적용됩니다.

<Steps>
  <Step title="코어에서 계약 정의">
    코어에서 미디어 이해 계약을 정의합니다.
  </Step>
  <Step title="공급업체 플러그인 등록">
    공급업체 플러그인은 해당하는 경우 `describeImage`, `transcribeAudio` 및 `describeVideo`를 등록합니다.
  </Step>
  <Step title="소비자가 공유 동작 사용">
    채널과 기능 플러그인은 공급업체 코드에 직접 연결하는 대신 공유 코어 동작을 사용합니다.
  </Step>
</Steps>

이를 통해 한 제공자의 동영상 관련 가정이 코어에 내장되는 것을 방지합니다. 플러그인은 공급업체 표면을 소유하고, 코어는 기능 계약과 폴백 동작을 소유합니다.

동영상 생성에도 이미 동일한 순서가 적용됩니다. 코어는 형식이 지정된 기능 계약과 런타임 헬퍼를 소유하고, 공급업체 플러그인은 이를 대상으로 `api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 출시 체크리스트가 필요하십니까? [기능 Cookbook](/ko/plugins/adding-capabilities)을 참조하십시오.

## 계약 및 적용

Plugin API 표면은 의도적으로 `OpenClawPluginApi`에 타입이 지정되고 중앙화되어 있습니다. 이 계약은 지원되는 등록 지점과 Plugin이 사용할 수 있는 런타임 도우미를 정의합니다.

이것이 중요한 이유는 다음과 같습니다.

- Plugin 작성자는 하나의 안정적인 내부 표준을 사용할 수 있습니다.
- 코어는 두 Plugin이 동일한 공급자 ID를 등록하는 것과 같은 소유권 중복을 거부할 수 있습니다.
- 시작 시 잘못된 형식의 등록에 대해 실행 가능한 진단을 표시할 수 있습니다.
- 계약 테스트를 통해 번들 Plugin의 소유권을 적용하고 예고 없는 변경을 방지할 수 있습니다.

적용은 두 계층으로 이루어집니다.

<AccordionGroup>
  <Accordion title="런타임 등록 적용">
    Plugin 레지스트리는 Plugin을 로드할 때 등록을 검증합니다. 예를 들어 공급자 ID 중복, 음성 공급자 ID 중복, 잘못된 형식의 등록이 발생하면 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
  </Accordion>
  <Accordion title="계약 테스트">
    테스트 실행 중 번들 Plugin을 계약 레지스트리에 기록하여 OpenClaw가 소유권을 명시적으로 검증할 수 있도록 합니다. 현재 모델 공급자, 음성 공급자, 웹 검색 공급자 및 번들 등록 소유권에 이를 사용합니다.
  </Accordion>
</AccordionGroup>

실질적인 효과는 OpenClaw가 어떤 표면을 어떤 Plugin이 소유하는지 미리 알 수 있다는 것입니다. 소유권이 암시적인 것이 아니라 선언되고, 타입이 지정되며, 테스트 가능하므로 코어와 채널이 원활하게 결합될 수 있습니다.

### 계약에 포함해야 하는 항목

<Tabs>
  <Tab title="좋은 계약">
    - 타입이 지정됨
    - 작음
    - 기능별로 특화됨
    - 코어가 소유함
    - 여러 Plugin에서 재사용할 수 있음
    - 채널과 기능이 공급업체에 대한 지식 없이 사용할 수 있음

  </Tab>
  <Tab title="나쁜 계약">
    - 코어에 숨겨진 공급업체별 정책
    - 레지스트리를 우회하는 일회성 Plugin 탈출구
    - 공급업체 구현에 직접 접근하는 채널 코드
    - `OpenClawPluginApi` 또는 `api.runtime`에 포함되지 않는 임시 런타임 객체

  </Tab>
</Tabs>

확실하지 않다면 추상화 수준을 높이십시오. 먼저 기능을 정의한 다음 Plugin이 해당 기능에 연결되도록 하십시오.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 동일한 **프로세스 내에서** 실행됩니다. 샌드박스가 적용되지 않습니다. 로드된 네이티브 Plugin은 코어 코드와 동일한 프로세스 수준의 신뢰 경계를 갖습니다.

<Warning>
네이티브 Plugin이 미치는 영향은 다음과 같습니다. Plugin은 도구, 네트워크 핸들러, 훅 및 서비스를 등록할 수 있고, Plugin 버그는 Gateway를 비정상 종료하거나 불안정하게 만들 수 있으며, 악성 네이티브 Plugin은 OpenClaw 프로세스 내부에서 임의 코드를 실행하는 것과 같습니다.
</Warning>

호환 번들은 OpenClaw가 현재 이를 메타데이터/콘텐츠 팩으로 취급하므로 기본적으로 더 안전합니다. 현재 릴리스에서는 대부분 번들 Skills를 의미합니다.

번들에 포함되지 않은 Plugin에는 허용 목록과 명시적인 설치/로드 경로를 사용하십시오. 워크스페이스 Plugin은 프로덕션 기본값이 아니라 개발 시점의 코드로 취급하십시오.

번들 워크스페이스 패키지 이름의 경우 Plugin ID를 npm 이름에 기반하도록 유지하십시오. 기본값은 `@openclaw/<id>`이며, 패키지가 의도적으로 더 제한된 Plugin 역할을 노출하는 경우 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding`처럼 승인되고 타입이 지정된 접미사를 사용하십시오.

<Note>
**신뢰 참고 사항:** `plugins.allow`는 출처가 아니라 **Plugin ID**를 신뢰합니다. 번들 Plugin과 동일한 ID를 가진 워크스페이스 Plugin이 활성화되거나 허용 목록에 포함되면 의도적으로 번들 복사본을 대체합니다. 이는 정상적인 동작이며 로컬 개발, 패치 테스트 및 핫픽스에 유용합니다. 번들 Plugin 신뢰는 설치 메타데이터가 아니라 로드 시점에 디스크에 있는 매니페스트와 코드인 소스 스냅샷을 기준으로 결정됩니다. 손상되거나 대체된 설치 레코드로는 실제 소스가 명시한 범위를 넘어 번들 Plugin의 신뢰 표면을 조용히 확장할 수 없습니다.
</Note>

## 내보내기 경계

OpenClaw는 구현 편의가 아니라 기능을 내보냅니다.

기능 등록은 공개 상태로 유지하십시오. 계약에 포함되지 않는 다음 도우미 내보내기는 제거하십시오.

- 번들 Plugin 전용 도우미 하위 경로
- 공개 API로 제공할 목적이 없는 런타임 배관 하위 경로
- 공급업체별 편의 도우미
- 구현 세부 사항에 해당하는 설정/온보딩 도우미

예약된 번들 Plugin 도우미 하위 경로는 생성된 SDK 내보내기 맵에서 폐기되었습니다. 소유자별 도우미는 해당 소유 Plugin 패키지 내부에 유지하고, 재사용 가능한 호스트 동작만 `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, `plugin-sdk/plugin-config-runtime`과 같은 일반 SDK 계약으로 승격하십시오.

## 내부 구조 및 참고 자료

로드 파이프라인, 레지스트리 모델, 공급자 런타임 훅, Gateway HTTP 경로, 메시지 도구 스키마, 채널 대상 확인, 공급자 카탈로그, 컨텍스트 엔진 Plugin 및 새 기능 추가 가이드는 [Plugin 아키텍처 내부 구조](/ko/plugins/architecture-internals)를 참조하십시오.

## 관련 문서

- [Plugin 빌드하기](/ko/plugins/building-plugins)
- [Plugin 매니페스트](/ko/plugins/manifest)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
