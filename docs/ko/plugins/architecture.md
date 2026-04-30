---
read_when:
    - 네이티브 OpenClaw Plugin 빌드 또는 디버깅
    - Plugin 기능 모델 또는 소유권 경계 이해
    - Plugin 로드 파이프라인 또는 레지스트리 작업
    - 프로바이더 런타임 훅 또는 채널 Plugin 구현
sidebarTitle: Internals
summary: 'Plugin 내부: 기능 모델, 소유권, 계약, 로드 파이프라인 및 런타임 헬퍼'
title: Plugin 내부 구조
x-i18n:
    generated_at: "2026-04-30T06:40:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

이 문서는 OpenClaw Plugin 시스템의 **심층 아키텍처 참조**입니다. 실용적인 가이드는 아래의 집중 페이지 중 하나에서 시작하세요.

<CardGroup cols={2}>
  <Card title="Plugin 설치 및 사용" icon="plug" href="/ko/tools/plugin">
    Plugin 추가, 활성화, 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 빌드" icon="rocket" href="/ko/plugins/building-plugins">
    가장 작은 동작 manifest로 시작하는 첫 Plugin 튜토리얼입니다.
  </Card>
  <Card title="Channel Plugin" icon="comments" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin을 빌드합니다.
  </Card>
  <Card title="Provider Plugin" icon="microchip" href="/ko/plugins/sdk-provider-plugins">
    모델 provider Plugin을 빌드합니다.
  </Card>
  <Card title="SDK 개요" icon="book" href="/ko/plugins/sdk-overview">
    import map 및 등록 API 참조입니다.
  </Card>
</CardGroup>

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **네이티브 Plugin** 모델입니다. 모든 네이티브 OpenClaw Plugin은 하나 이상의 기능 유형에 대해 등록됩니다.

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
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | `google`                             |
| 채널 / 메시징          | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway discovery      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
기능을 하나도 등록하지 않지만 hooks, 도구, discovery 서비스 또는 백그라운드 서비스를 제공하는 Plugin은 **레거시 hook-only** Plugin입니다. 이 패턴은 여전히 완전히 지원됩니다.
</Note>

### 외부 호환성 입장

기능 모델은 core에 반영되어 현재 번들/네이티브 Plugin에서 사용되고 있지만, 외부 Plugin 호환성에는 "export되었으니 고정되었다"보다 더 엄격한 기준이 필요합니다.

| Plugin 상황                                      | 지침                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 기존 외부 Plugin                                 | hook 기반 통합이 계속 동작하게 유지합니다. 이것이 호환성 기준선입니다.                           |
| 새 번들/네이티브 Plugin                          | vendor별 reach-in 또는 새로운 hook-only 설계보다 명시적 기능 등록을 선호합니다.                  |
| 기능 등록을 채택하는 외부 Plugin                 | 허용되지만, 문서에서 안정적이라고 표시하지 않는 한 기능별 helper surface는 진화 중으로 취급하세요. |

기능 등록은 의도된 방향입니다. 전환 기간 동안 외부 Plugin에는 레거시 hooks가 가장 안전한 무중단 경로로 남아 있습니다. export된 helper subpath가 모두 같은 것은 아닙니다. 우발적인 helper export보다 좁고 문서화된 contract를 선호하세요.

### Plugin 형태

OpenClaw는 로드된 모든 Plugin을 정적 metadata만이 아니라 실제 등록 동작에 따라 형태로 분류합니다.

<AccordionGroup>
  <Accordion title="plain-capability">
    정확히 하나의 기능 유형을 등록합니다. 예를 들어 `mistral` 같은 provider 전용 Plugin입니다.
  </Accordion>
  <Accordion title="hybrid-capability">
    여러 기능 유형을 등록합니다. 예를 들어 `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 소유합니다.
  </Accordion>
  <Accordion title="hook-only">
    hooks(typed 또는 custom)만 등록하고 기능, 도구, 명령 또는 서비스는 등록하지 않습니다.
  </Accordion>
  <Accordion title="non-capability">
    도구, 명령, 서비스 또는 route는 등록하지만 기능은 등록하지 않습니다.
  </Accordion>
</AccordionGroup>

Plugin의 형태와 기능 구성을 보려면 `openclaw plugins inspect <id>`를 사용하세요. 자세한 내용은 [CLI 참조](/ko/cli/plugins#inspect)를 보세요.

### 레거시 hooks

`before_agent_start` hook은 hook-only Plugin을 위한 호환성 경로로 계속 지원됩니다. 레거시 실제 Plugin은 여전히 이에 의존합니다.

방향:

- 계속 동작하게 유지
- 레거시로 문서화
- 모델/provider override 작업에는 `before_model_resolve` 선호
- 프롬프트 변경 작업에는 `before_prompt_build` 선호
- 실제 사용량이 줄고 fixture coverage가 마이그레이션 안전성을 입증한 뒤에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면 다음 label 중 하나가 표시될 수 있습니다.

| 신호                       | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | config가 정상적으로 파싱되고 Plugin이 resolve됨              |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴(예: `hook-only`)을 사용함    |
| **legacy warning**         | Plugin이 deprecated된 `before_agent_start`를 사용함          |
| **hard error**             | config가 유효하지 않거나 Plugin 로드에 실패함                |

`hook-only`와 `before_agent_start` 어느 쪽도 현재 Plugin을 중단시키지 않습니다. `hook-only`는 advisory이고, `before_agent_start`는 warning만 발생시킵니다. 이러한 신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 개의 계층으로 구성됩니다.

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw는 설정된 경로, workspace roots, 전역 Plugin roots, 번들 Plugin에서 후보 Plugin을 찾습니다. discovery는 먼저 네이티브 `openclaw.plugin.json` manifest와 지원되는 bundle manifest를 읽습니다.
  </Step>
  <Step title="Enablement + validation">
    core는 발견된 Plugin이 활성화, 비활성화, 차단되었는지 또는 memory 같은 exclusive slot에 선택되었는지를 결정합니다.
  </Step>
  <Step title="Runtime loading">
    네이티브 OpenClaw Plugin은 jiti를 통해 in-process로 로드되고 중앙 registry에 기능을 등록합니다. 호환 bundle은 runtime code를 import하지 않고 registry record로 정규화됩니다.
  </Step>
  <Step title="Surface consumption">
    OpenClaw의 나머지 부분은 registry를 읽어 도구, 채널, provider setup, hooks, HTTP routes, CLI commands, services를 노출합니다.
  </Step>
</Steps>

Plugin CLI에 한정하면, root command discovery는 두 단계로 나뉩니다.

- parse-time metadata는 `registerCli(..., { descriptors: [...] })`에서 옵니다
- 실제 Plugin CLI module은 lazy 상태를 유지하고 첫 호출 시 등록할 수 있습니다

이렇게 하면 Plugin 소유 CLI code를 Plugin 내부에 유지하면서도 OpenClaw가 parsing 전에 root command name을 예약할 수 있습니다.

중요한 설계 경계:

- manifest/config validation은 Plugin code를 실행하지 않고 **manifest/schema metadata**만으로 동작해야 합니다
- 네이티브 기능 discovery는 비활성 registry snapshot을 만들기 위해 신뢰된 Plugin entry code를 로드할 수 있습니다
- 네이티브 runtime behavior는 `api.registrationMode === "full"`인 Plugin module의 `register(api)` 경로에서 옵니다

이 분리는 full runtime이 active 상태가 되기 전에 OpenClaw가 config를 검증하고, 누락/비활성화된 Plugin을 설명하며, UI/schema hints를 만들 수 있게 합니다.

### Plugin metadata snapshot 및 lookup table

Gateway 시작은 현재 config snapshot에 대해 하나의 `PluginMetadataSnapshot`을 만듭니다. snapshot은 metadata 전용입니다. 설치된 Plugin index, manifest registry, manifest diagnostics, owner maps, Plugin id normalizer, manifest records를 저장합니다. 로드된 Plugin modules, provider SDKs, package contents 또는 runtime exports는 보유하지 않습니다.

Plugin-aware config validation, startup auto-enable, Gateway Plugin bootstrap은 manifest/index metadata를 독립적으로 다시 만드는 대신 해당 snapshot을 사용합니다. `PluginLookUpTable`은 같은 snapshot에서 파생되며 현재 runtime config의 startup Plugin plan을 추가합니다.

시작 후 Gateway는 현재 metadata snapshot을 교체 가능한 runtime product로 유지합니다. 반복되는 runtime provider discovery는 각 provider-catalog pass마다 설치된 index와 manifest registry를 재구성하는 대신 해당 snapshot을 빌릴 수 있습니다. snapshot은 Gateway 종료, config/Plugin inventory 변경, 설치된 index 쓰기 시 지워지거나 교체됩니다. 호환되는 현재 snapshot이 없으면 caller는 cold manifest/index path로 fallback합니다. workspace Plugin은 metadata scope의 일부이므로 compatibility check에는 `plugins.load.paths` 및 기본 agent workspace 같은 Plugin discovery roots가 포함되어야 합니다.

snapshot과 lookup table은 반복되는 startup 결정을 fast path에 유지합니다.

- channel ownership
- deferred channel startup
- startup Plugin ids
- provider 및 CLI backend ownership
- setup provider, command alias, model catalog provider, manifest contract ownership
- Plugin config schema 및 channel config schema validation
- startup auto-enable decisions

안전 경계는 mutation이 아니라 snapshot replacement입니다. config, Plugin inventory, install records 또는 persisted index policy가 변경되면 snapshot을 다시 빌드하세요. 이를 광범위한 mutable global registry로 취급하지 말고, 제한 없는 historical snapshots를 보관하지 마세요. Runtime Plugin loading은 metadata snapshot과 분리된 상태로 유지되므로 오래된 runtime state가 metadata cache 뒤에 숨겨질 수 없습니다.

cache 규칙은 [Plugin architecture internals](/ko/plugins/architecture-internals#plugin-cache-boundary)에 문서화되어 있습니다. caller가 현재 flow에 대한 명시적 snapshot, lookup table 또는 manifest registry를 보유하지 않는 한 manifest 및 discovery metadata는 fresh합니다. hidden metadata cache와 wall-clock TTL은 Plugin loading의 일부가 아닙니다. code 또는 installed artifacts가 실제로 로드된 후에는 runtime loader, module, dependency-artifact cache만 유지될 수 있습니다.

일부 cold-path caller는 여전히 Gateway `PluginLookUpTable`을 받는 대신 persisted installed Plugin index에서 직접 manifest registry를 재구성합니다. 이제 해당 path는 필요할 때 registry를 재구성합니다. caller가 이미 가지고 있다면 runtime flow를 통해 현재 lookup table 또는 명시적 manifest registry를 전달하는 방식을 선호하세요.

### 활성화 계획

활성화 계획은 control plane의 일부입니다. caller는 더 넓은 runtime registry를 로드하기 전에 구체적인 command, provider, channel, route, agent harness 또는 기능과 관련된 Plugin을 물어볼 수 있습니다.

planner는 현재 manifest behavior와의 호환성을 유지합니다.

- `activation.*` fields는 명시적 planner hints입니다
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, hooks는 manifest ownership fallback으로 유지됩니다
- ids-only planner API는 기존 caller를 위해 계속 사용할 수 있습니다
- plan API는 진단이 명시적 hints와 ownership fallback을 구분할 수 있도록 reason labels를 보고합니다

<Warning>
`activation`을 수명 주기 훅이나 `register(...)`의 대체 수단으로 취급하지 마세요. 이는 로딩 범위를 좁히는 데 사용되는 메타데이터입니다. 관계를 이미 설명하는 소유권 필드가 있으면 이를 우선 사용하고, `activation`은 추가 플래너 힌트에만 사용하세요.
</Warning>

### 채널 Plugin과 공유 메시지 도구

채널 Plugin은 일반 채팅 동작을 위해 별도의 보내기/수정/반응 도구를 등록할 필요가 없습니다. OpenClaw는 코어에 하나의 공유 `message` 도구를 유지하며, 채널 Plugin은 그 뒤의 채널별 검색과 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- 코어는 공유 `message` 도구 호스트, 프롬프트 연결, 세션/스레드 장부 관리, 실행 디스패치를 소유합니다.
- 채널 Plugin은 범위가 지정된 동작 검색, 기능 검색, 모든 채널별 스키마 조각을 소유합니다.
- 채널 Plugin은 대화 ID가 스레드 ID를 인코딩하거나 상위 대화에서 상속되는 방식 같은 제공자별 세션 대화 문법을 소유합니다.
- 채널 Plugin은 해당 동작 어댑터를 통해 최종 동작을 실행합니다.

채널 Plugin에서 SDK 표면은 `ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 검색 호출을 통해 Plugin은 표시되는 동작, 기능, 스키마 기여분을 함께 반환할 수 있으므로 해당 요소들이 서로 어긋나지 않습니다.

채널별 메시지 도구 매개변수가 로컬 경로나 원격 미디어 URL 같은 미디어 소스를 전달하는 경우, Plugin은 `describeMessageTool(...)`에서 `mediaSourceParams`도 반환해야 합니다. 코어는 이 명시적 목록을 사용해 Plugin 소유 매개변수 이름을 하드코딩하지 않고 샌드박스 경로 정규화와 아웃바운드 미디어 접근 힌트를 적용합니다. 여기서는 하나의 채널 전체 플랫 목록이 아니라 동작 범위 맵을 우선 사용하세요. 그래야 프로필 전용 미디어 매개변수가 `send` 같은 관련 없는 동작에서 정규화되지 않습니다.

코어는 해당 검색 단계에 런타임 범위를 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이는 컨텍스트에 민감한 Plugin에서 중요합니다. 채널은 코어 `message` 도구에 채널별 분기를 하드코딩하지 않고도 활성 계정, 현재 방/스레드/메시지, 신뢰된 요청자 신원을 기준으로 메시지 동작을 숨기거나 노출할 수 있습니다.

이것이 임베디드 러너 라우팅 변경이 여전히 Plugin 작업인 이유입니다. 러너는 현재 턴에서 공유 `message` 도구가 올바른 채널 소유 표면을 노출하도록 현재 채팅/세션 신원을 Plugin 검색 경계로 전달할 책임이 있습니다.

채널 소유 실행 헬퍼의 경우, 번들 Plugin은 실행 런타임을 자체 확장 모듈 안에 유지해야 합니다. 코어는 더 이상 `src/agents/tools` 아래의 Discord, Slack, Telegram, WhatsApp 메시지 동작 런타임을 소유하지 않습니다. 별도의 `plugin-sdk/*-action-runtime` 하위 경로는 게시하지 않으며, 번들 Plugin은 자체 확장 소유 모듈에서 로컬 런타임 코드를 직접 가져와야 합니다.

동일한 경계는 일반적으로 제공자 이름이 붙은 SDK 이음부에도 적용됩니다. 코어는 Slack, Discord, Signal, WhatsApp 또는 유사한 확장을 위한 채널별 편의 배럴을 가져오면 안 됩니다. 코어에 어떤 동작이 필요하면 번들 Plugin의 자체 `api.ts` / `runtime-api.ts` 배럴을 사용하거나, 그 필요를 공유 SDK의 좁은 일반 기능으로 승격하세요.

번들 Plugin도 같은 규칙을 따릅니다. 번들 Plugin의 `runtime-api.ts`는 자체 브랜드가 붙은 `openclaw/plugin-sdk/<plugin-id>` 파사드를 다시 내보내면 안 됩니다. 이러한 브랜드 파사드는 외부 Plugin과 이전 소비자를 위한 호환성 shim으로 남지만, 번들 Plugin은 로컬 내보내기와 `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, `openclaw/plugin-sdk/webhook-ingress` 같은 좁은 일반 SDK 하위 경로를 사용해야 합니다. 기존 외부 생태계에 대한 호환성 경계가 요구하지 않는 한, 새 코드는 Plugin ID별 SDK 파사드를 추가하면 안 됩니다.

투표의 경우에는 구체적으로 두 가지 실행 경로가 있습니다.

- `outbound.sendPoll`은 공통 투표 모델에 맞는 채널을 위한 공유 기준선입니다.
- `actions.handleAction("poll")`은 채널별 투표 의미론이나 추가 투표 매개변수에 권장되는 경로입니다.

이제 코어는 Plugin 투표 디스패치가 동작을 거절한 뒤에 공유 투표 파싱을 수행하므로, Plugin 소유 투표 핸들러는 일반 투표 파서에 먼저 막히지 않고 채널별 투표 필드를 받을 수 있습니다.

전체 시작 순서는 [Plugin 아키텍처 내부](/ko/plugins/architecture-internals)를 참조하세요.

## 기능 소유권 모델

OpenClaw는 네이티브 Plugin을 관련 없는 통합 묶음이 아니라 **회사** 또는 **기능**의 소유권 경계로 취급합니다.

이는 다음을 의미합니다.

- 회사 Plugin은 보통 해당 회사의 OpenClaw 대상 표면을 모두 소유해야 합니다.
- 기능 Plugin은 보통 자신이 도입하는 전체 기능 표면을 소유해야 합니다.
- 채널은 제공자 동작을 임의로 다시 구현하는 대신 공유 코어 기능을 사용해야 합니다.

<AccordionGroup>
  <Accordion title="벤더 다중 기능">
    `openai`는 텍스트 추론, 음성, 실시간 음성, 미디어 이해, 이미지 생성을 소유합니다. `google`은 텍스트 추론과 미디어 이해, 이미지 생성, 웹 검색을 소유합니다. `qwen`은 텍스트 추론과 미디어 이해, 동영상 생성을 소유합니다.
  </Accordion>
  <Accordion title="벤더 단일 기능">
    `elevenlabs`와 `microsoft`는 음성을 소유하고, `firecrawl`은 웹 가져오기를 소유하며, `minimax` / `mistral` / `moonshot` / `zai`는 미디어 이해 백엔드를 소유합니다.
  </Accordion>
  <Accordion title="기능 Plugin">
    `voice-call`은 통화 전송, 도구, CLI, 라우트, Twilio 미디어 스트림 브리징을 소유하지만, 벤더 Plugin을 직접 가져오는 대신 공유 음성, 실시간 전사, 실시간 음성 기능을 사용합니다.
  </Accordion>
</AccordionGroup>

의도한 최종 상태는 다음과 같습니다.

- OpenAI는 텍스트 모델, 음성, 이미지, 향후 동영상까지 걸치더라도 하나의 Plugin에 있습니다.
- 다른 벤더도 자신의 표면 영역에 대해 동일하게 할 수 있습니다.
- 채널은 어느 벤더 Plugin이 제공자를 소유하는지 신경 쓰지 않고, 코어가 노출하는 공유 기능 계약을 사용합니다.

핵심 구분은 다음과 같습니다.

- **Plugin** = 소유권 경계
- **기능** = 여러 Plugin이 구현하거나 사용할 수 있는 코어 계약

따라서 OpenClaw가 동영상 같은 새 도메인을 추가한다면, 첫 번째 질문은 "어느 제공자가 동영상 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 번째 질문은 "코어 동영상 기능 계약은 무엇인가?"입니다. 그 계약이 존재하면 벤더 Plugin은 그것에 맞춰 등록할 수 있고, 채널/기능 Plugin은 그것을 사용할 수 있습니다.

기능이 아직 존재하지 않는 경우, 올바른 조치는 보통 다음과 같습니다.

<Steps>
  <Step title="기능 정의">
    누락된 기능을 코어에 정의합니다.
  </Step>
  <Step title="SDK를 통해 노출">
    Plugin API/런타임을 통해 타입이 지정된 방식으로 노출합니다.
  </Step>
  <Step title="소비자 연결">
    채널/기능을 해당 기능에 연결합니다.
  </Step>
  <Step title="벤더 구현">
    벤더 Plugin이 구현을 등록하게 합니다.
  </Step>
</Steps>

이렇게 하면 소유권을 명시적으로 유지하면서, 단일 벤더나 일회성 Plugin별 코드 경로에 의존하는 코어 동작을 피할 수 있습니다.

### 기능 계층화

코드가 어디에 속하는지 결정할 때 다음 정신 모델을 사용하세요.

<Tabs>
  <Tab title="코어 기능 계층">
    공유 오케스트레이션, 정책, 폴백, 설정 병합 규칙, 전달 의미론, 타입이 지정된 계약입니다.
  </Tab>
  <Tab title="벤더 Plugin 계층">
    벤더별 API, 인증, 모델 카탈로그, 음성 합성, 이미지 생성, 향후 동영상 백엔드, 사용량 엔드포인트입니다.
  </Tab>
  <Tab title="채널/기능 Plugin 계층">
    코어 기능을 사용하고 이를 표면에 제시하는 Slack/Discord/voice-call/기타 통합입니다.
  </Tab>
</Tabs>

예를 들어 TTS는 다음 형태를 따릅니다.

- 코어는 응답 시점 TTS 정책, 폴백 순서, 기본 설정, 채널 전달을 소유합니다.
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유합니다.
- `voice-call`은 전화 통신 TTS 런타임 헬퍼를 사용합니다.

향후 기능에도 같은 패턴을 우선 적용해야 합니다.

### 다중 기능 회사 Plugin 예시

회사 Plugin은 외부에서 볼 때 응집력 있게 느껴져야 합니다. OpenClaw에 모델, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 동영상 생성, 웹 가져오기, 웹 검색에 대한 공유 계약이 있다면, 벤더는 자신의 모든 표면을 한곳에서 소유할 수 있습니다.

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

중요한 것은 정확한 헬퍼 이름이 아닙니다. 형태가 중요합니다.

- 하나의 Plugin이 벤더 표면을 소유합니다.
- 코어는 여전히 기능 계약을 소유합니다.
- 채널과 기능 Plugin은 벤더 코드가 아니라 `api.runtime.*` 헬퍼를 사용합니다.
- 계약 테스트는 Plugin이 소유한다고 주장하는 기능을 등록했는지 단언할 수 있습니다.

### 기능 예시: 동영상 이해

OpenClaw는 이미 이미지/오디오/동영상 이해를 하나의 공유 기능으로 취급합니다. 같은 소유권 모델이 여기에도 적용됩니다.

<Steps>
  <Step title="코어가 계약 정의">
    코어가 미디어 이해 계약을 정의합니다.
  </Step>
  <Step title="벤더 Plugin 등록">
    벤더 Plugin은 해당되는 경우 `describeImage`, `transcribeAudio`, `describeVideo`를 등록합니다.
  </Step>
  <Step title="소비자가 공유 동작 사용">
    채널과 기능 Plugin은 벤더 코드에 직접 연결하는 대신 공유 코어 동작을 사용합니다.
  </Step>
</Steps>

이렇게 하면 한 제공자의 동영상 가정을 코어에 굳히는 일을 피할 수 있습니다. Plugin은 벤더 표면을 소유하고, 코어는 기능 계약과 폴백 동작을 소유합니다.

동영상 생성도 이미 같은 순서를 사용합니다. 코어가 타입이 지정된 기능 계약과 런타임 헬퍼를 소유하고, 벤더 Plugin은 이에 대해 `api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 롤아웃 체크리스트가 필요하신가요? [기능 Cookbook](/ko/plugins/architecture)을 참조하세요.

## 계약과 강제 적용

Plugin API 표면은 의도적으로 `OpenClawPluginApi`에 타입이 지정되고 중앙화되어 있습니다. 이 계약은 지원되는 등록 지점과 Plugin이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유는 다음과 같습니다.

- Plugin 작성자는 하나의 안정적인 내부 표준을 얻습니다.
- 코어는 두 Plugin이 같은 제공자 ID를 등록하는 것 같은 중복 소유권을 거부할 수 있습니다.
- 시작 시 잘못된 등록에 대한 실행 가능한 진단을 드러낼 수 있습니다.
- 계약 테스트는 번들 Plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다.

강제 적용에는 두 계층이 있습니다.

<AccordionGroup>
  <Accordion title="런타임 등록 적용">
    Plugin 레지스트리는 Plugin이 로드될 때 등록을 검증합니다. 예: 중복 provider id, 중복 speech provider id, 잘못된 등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
  </Accordion>
  <Accordion title="계약 테스트">
    번들된 Plugin은 테스트 실행 중 계약 레지스트리에 캡처되어 OpenClaw가 소유권을 명시적으로 검증할 수 있습니다. 현재 이는 모델 provider, speech provider, web search provider, 번들된 등록 소유권에 사용됩니다.
  </Accordion>
</AccordionGroup>

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤 표면을 소유하는지 미리 안다는 것입니다. 따라서 소유권이 암묵적이지 않고 선언되고, 타입이 지정되며, 테스트 가능하기 때문에 core와 channel이 원활하게 결합될 수 있습니다.

### 계약에 포함되어야 하는 것

<Tabs>
  <Tab title="좋은 계약">
    - 타입이 지정됨
    - 작음
    - capability별로 구분됨
    - core가 소유함
    - 여러 Plugin에서 재사용 가능함
    - vendor 지식 없이 channel/feature에서 소비 가능함

  </Tab>
  <Tab title="나쁜 계약">
    - core에 숨겨진 vendor별 정책
    - 레지스트리를 우회하는 일회성 Plugin 탈출구
    - channel 코드가 vendor 구현에 직접 접근함
    - `OpenClawPluginApi` 또는 `api.runtime`의 일부가 아닌 임시 런타임 객체

  </Tab>
</Tabs>

확실하지 않다면 추상화 수준을 높이세요. 먼저 capability를 정의한 다음, Plugin이 거기에 연결되도록 하세요.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 함께 **in-process**로 실행됩니다. 샌드박스 처리되지 않습니다. 로드된 네이티브 Plugin은 core 코드와 동일한 프로세스 수준 신뢰 경계를 가집니다.

<Warning>
네이티브 Plugin의 영향: Plugin은 tool, network handler, hook, service를 등록할 수 있습니다. Plugin 버그는 Gateway를 크래시시키거나 불안정하게 만들 수 있습니다. 악의적인 네이티브 Plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 같습니다.
</Warning>

호환 번들은 OpenClaw가 현재 이를 metadata/content pack으로 취급하므로 기본적으로 더 안전합니다. 현재 릴리스에서는 대체로 번들된 Skills를 의미합니다.

비번들 Plugin에는 허용 목록과 명시적인 설치/로드 경로를 사용하세요. workspace Plugin은 프로덕션 기본값이 아니라 개발 시간 코드로 취급하세요.

번들된 workspace 패키지 이름의 경우 Plugin id를 npm 이름에 고정하세요. 기본값은 `@openclaw/<id>`이며, 패키지가 의도적으로 더 좁은 Plugin 역할을 노출하는 경우 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은 승인된 타입 suffix를 사용할 수 있습니다.

<Note>
**신뢰 참고:** `plugins.allow`는 소스 출처가 아니라 **Plugin id**를 신뢰합니다. 번들된 Plugin과 동일한 id를 가진 workspace Plugin은 해당 workspace Plugin이 활성화/허용 목록에 포함되면 의도적으로 번들된 복사본을 가립니다. 이는 로컬 개발, 패치 테스트, hotfix에 정상적이고 유용합니다. 번들된 Plugin의 신뢰는 설치 metadata가 아니라 소스 snapshot, 즉 로드 시점 디스크의 manifest와 코드에서 해석됩니다. 손상되었거나 대체된 설치 기록은 실제 소스가 주장하는 범위를 넘어 번들된 Plugin의 신뢰 표면을 조용히 넓힐 수 없습니다.
</Note>

## 내보내기 경계

OpenClaw는 구현 편의성이 아니라 capability를 내보냅니다.

capability 등록은 공개 상태로 유지하세요. 계약이 아닌 helper export는 정리하세요.

- 번들된 Plugin별 helper subpath
- public API로 의도되지 않은 runtime plumbing subpath
- vendor별 convenience helper
- 구현 세부 사항인 setup/onboarding helper

예약된 번들된 Plugin helper subpath는 생성된 SDK export map에서 폐기되었습니다. 소유자별 helper는 소유 Plugin 패키지 안에 유지하세요. 재사용 가능한 host 동작만 `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 계약으로 승격하세요.

## 내부 구조 및 참조

로드 pipeline, registry model, provider runtime hook, Gateway HTTP route, message tool schema, channel target resolution, provider catalog, context engine Plugin, 새 capability 추가 가이드는 [Plugin architecture internals](/ko/plugins/architecture-internals)를 참조하세요.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin manifest](/ko/plugins/manifest)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
