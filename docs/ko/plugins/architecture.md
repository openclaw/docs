---
read_when:
    - 네이티브 OpenClaw Plugin 빌드 또는 디버깅
    - Plugin 기능 모델 또는 소유권 경계 이해하기
    - Plugin 로드 파이프라인 또는 레지스트리 작업하기
    - 공급자 런타임 훅 또는 채널 Plugin 구현하기
sidebarTitle: Internals
summary: 'Plugin 내부: 기능 모델, 소유권, 계약, 로드 파이프라인, 런타임 헬퍼'
title: Plugin 내부
x-i18n:
    generated_at: "2026-06-27T17:42:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

OpenClaw Plugin 시스템의 **심층 아키텍처 레퍼런스**입니다. 실용적인 가이드는 아래의 집중 페이지 중 하나에서 시작하세요.

<CardGroup cols={2}>
  <Card title="Plugin 설치 및 사용" icon="plug" href="/ko/tools/plugin">
    Plugin 추가, 활성화, 문제 해결을 위한 최종 사용자 가이드입니다.
  </Card>
  <Card title="Plugin 빌드" icon="rocket" href="/ko/plugins/building-plugins">
    가장 작은 동작 manifest를 사용하는 첫 Plugin 튜토리얼입니다.
  </Card>
  <Card title="Channel Plugin" icon="comments" href="/ko/plugins/sdk-channel-plugins">
    메시징 channel Plugin을 빌드합니다.
  </Card>
  <Card title="Provider Plugin" icon="microchip" href="/ko/plugins/sdk-provider-plugins">
    모델 provider Plugin을 빌드합니다.
  </Card>
  <Card title="SDK 개요" icon="book" href="/ko/plugins/sdk-overview">
    Import map 및 registration API 레퍼런스입니다.
  </Card>
</CardGroup>

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **네이티브 Plugin** 모델입니다. 모든 네이티브 OpenClaw Plugin은 하나 이상의 기능 유형에 등록됩니다.

| 기능                   | 등록 메서드                                      | 예시 Plugin                          |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 텍스트 추론            | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 임베딩                 | `api.registerEmbeddingProvider(...)`             | Provider 소유 vector Plugin          |
| 음성                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Transcript 소스        | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 동영상 생성            | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / 메시징       | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway 검색           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
기능을 하나도 등록하지 않지만 hook, 도구, discovery service 또는 백그라운드 서비스를 제공하는 Plugin은 **레거시 hook-only** Plugin입니다. 이 패턴은 여전히 완전히 지원됩니다.
</Note>

### 외부 호환성 입장

기능 모델은 core에 반영되어 현재 번들/네이티브 Plugin에서 사용되고 있지만, 외부 Plugin 호환성에는 "export되었으므로 고정되었다"보다 더 엄격한 기준이 필요합니다.

| Plugin 상황                                      | 지침                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 기존 외부 Plugin                                 | Hook 기반 통합이 계속 동작하도록 유지합니다. 이것이 호환성 기준선입니다.                         |
| 새 번들/네이티브 Plugin                          | Vendor별 내부 접근이나 새 hook-only 설계보다 명시적 기능 등록을 선호합니다.                      |
| 기능 등록을 채택하는 외부 Plugin                 | 허용되지만, 문서에서 안정적이라고 표시하지 않는 한 기능별 helper surface는 진화 중으로 취급합니다. |

기능 등록은 의도된 방향입니다. 레거시 hook은 전환 기간 동안 외부 Plugin에 가장 안전한 무중단 경로로 남아 있습니다. Export된 helper subpath가 모두 같은 것은 아닙니다 — 부수적인 helper export보다 좁게 문서화된 contract를 선호하세요.

### Plugin 형태

OpenClaw는 로드된 모든 Plugin을 정적 metadata만이 아니라 실제 등록 동작을 기준으로 형태로 분류합니다.

<AccordionGroup>
  <Accordion title="plain-capability">
    정확히 하나의 기능 유형을 등록합니다(예: `mistral` 같은 provider 전용 Plugin).
  </Accordion>
  <Accordion title="hybrid-capability">
    여러 기능 유형을 등록합니다(예: `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 소유합니다).
  </Accordion>
  <Accordion title="hook-only">
    Hook(typed 또는 custom)만 등록하고 기능, 도구, 명령, 서비스는 등록하지 않습니다.
  </Accordion>
  <Accordion title="non-capability">
    도구, 명령, 서비스 또는 route를 등록하지만 기능은 등록하지 않습니다.
  </Accordion>
</AccordionGroup>

Plugin의 형태와 기능 breakdown을 보려면 `openclaw plugins inspect <id>`를 사용하세요. 자세한 내용은 [CLI 레퍼런스](/ko/cli/plugins#inspect)를 참고하세요.

### 레거시 hook

`before_agent_start` hook은 hook-only Plugin을 위한 호환성 경로로 계속 지원됩니다. 레거시 실제 Plugin은 여전히 이것에 의존합니다.

방향:

- 계속 동작하게 유지
- 레거시로 문서화
- 모델/provider override 작업에는 `before_model_resolve` 선호
- prompt mutation 작업에는 `before_prompt_build` 선호
- 실제 사용량이 줄고 fixture coverage가 migration 안전성을 증명한 뒤에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면 다음 label 중 하나가 표시될 수 있습니다.

| 신호                       | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config가 정상적으로 parse되고 Plugin이 resolve됨             |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`)     |
| **legacy warning**         | Plugin이 deprecated된 `before_agent_start`를 사용함           |
| **hard error**             | Config가 유효하지 않거나 Plugin 로드에 실패함                |

`hook-only`와 `before_agent_start`는 현재 Plugin을 깨뜨리지 않습니다. `hook-only`는 advisory이고, `before_agent_start`는 warning만 트리거합니다. 이러한 신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 개의 계층으로 구성됩니다.

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw는 설정된 경로, workspace root, global Plugin root, 번들 Plugin에서 후보 Plugin을 찾습니다. Discovery는 먼저 네이티브 `openclaw.plugin.json` manifest와 지원되는 bundle manifest를 읽습니다.
  </Step>
  <Step title="활성화 + 검증">
    Core는 발견된 Plugin이 enabled, disabled, blocked인지 또는 memory 같은 exclusive slot에 선택되었는지 결정합니다.
  </Step>
  <Step title="Runtime loading">
    네이티브 OpenClaw Plugin은 in-process로 로드되고 기능을 중앙 registry에 등록합니다. 패키지된 JavaScript는 네이티브 `require`를 통해 로드됩니다. 서드파티 local source TypeScript는 긴급 Jiti fallback입니다. 호환 bundle은 runtime code를 import하지 않고 registry record로 정규화됩니다.
  </Step>
  <Step title="Surface consumption">
    OpenClaw의 나머지는 registry를 읽어 도구, channel, provider setup, hook, HTTP route, CLI 명령, 서비스를 노출합니다.
  </Step>
</Steps>

특히 Plugin CLI의 경우 root command discovery는 두 단계로 나뉩니다.

- parse-time metadata는 `registerCli(..., { descriptors: [...] })`에서 가져옵니다.
- 실제 Plugin CLI module은 lazy 상태를 유지하고 첫 invocation 때 등록될 수 있습니다.

이렇게 하면 Plugin 소유 CLI code를 Plugin 내부에 유지하면서도 OpenClaw가 parsing 전에 root command 이름을 예약할 수 있습니다.

중요한 설계 경계는 다음과 같습니다.

- manifest/config 검증은 Plugin code를 실행하지 않고 **manifest/schema metadata**에서 동작해야 합니다.
- 네이티브 기능 discovery는 trusted Plugin entry code를 로드해 non-activating registry snapshot을 만들 수 있습니다.
- 네이티브 runtime 동작은 `api.registrationMode === "full"`인 Plugin module의 `register(api)` 경로에서 나옵니다.

이 분리는 full runtime이 활성화되기 전에 OpenClaw가 config를 검증하고, 누락/비활성 Plugin을 설명하며, UI/schema hint를 빌드할 수 있게 합니다.

### Plugin metadata snapshot 및 lookup table

Gateway startup은 현재 config snapshot에 대해 하나의 `PluginMetadataSnapshot`을 빌드합니다. Snapshot은 metadata 전용입니다. 설치된 Plugin index, manifest registry, manifest diagnostic, owner map, Plugin id normalizer, manifest record를 저장합니다. 로드된 Plugin module, provider SDK, package contents 또는 runtime export는 보관하지 않습니다.

Plugin-aware config validation, startup auto-enable, Gateway Plugin bootstrap은 manifest/index metadata를 독립적으로 다시 빌드하는 대신 해당 snapshot을 사용합니다. `PluginLookUpTable`은 같은 snapshot에서 파생되며 현재 runtime config의 startup Plugin plan을 추가합니다.

Startup 이후 Gateway는 현재 metadata snapshot을 교체 가능한 runtime product로 유지합니다. 반복되는 runtime provider discovery는 각 provider-catalog pass마다 설치된 index와 manifest registry를 재구성하는 대신 해당 snapshot을 빌릴 수 있습니다. Snapshot은 Gateway shutdown, config/Plugin inventory 변경, 설치된 index write 시 clear되거나 교체됩니다. 호환되는 현재 snapshot이 없으면 caller는 cold manifest/index 경로로 fallback합니다. Workspace Plugin은 metadata scope의 일부이므로 compatibility check에는 `plugins.load.paths` 및 default agent workspace 같은 Plugin discovery root가 포함되어야 합니다.

Snapshot과 lookup table은 반복되는 startup 결정을 fast path에 유지합니다.

- channel ownership
- deferred channel startup
- startup Plugin id
- provider 및 CLI backend ownership
- setup provider, command alias, model catalog provider, manifest contract ownership
- Plugin config schema 및 channel config schema 검증
- startup auto-enable 결정

안전 경계는 mutation이 아니라 snapshot replacement입니다. Config, Plugin inventory, install record 또는 persisted index policy가 변경되면 snapshot을 다시 빌드하세요. 이를 광범위한 mutable global registry로 취급하지 말고, 무제한 historical snapshot을 보관하지 마세요. Runtime Plugin loading은 metadata snapshot과 계속 분리되어 stale runtime state가 metadata cache 뒤에 숨겨지지 않도록 합니다.

Cache 규칙은 [Plugin architecture internals](/ko/plugins/architecture-internals#plugin-cache-boundary)에 문서화되어 있습니다. Manifest와 discovery metadata는 caller가 현재 flow에 대한 명시적 snapshot, lookup table 또는 manifest registry를 보유하지 않는 한 fresh입니다. Hidden metadata cache와 wall-clock TTL은 Plugin loading의 일부가 아닙니다. Runtime loader, module, dependency-artifact cache만 code 또는 설치된 artifact가 실제로 로드된 뒤에도 유지될 수 있습니다.

일부 cold-path caller는 여전히 Gateway `PluginLookUpTable`을 받는 대신 persisted installed Plugin index에서 직접 manifest registry를 재구성합니다. 이제 해당 경로는 필요할 때 registry를 재구성합니다. Caller가 이미 보유한 경우 current lookup table 또는 명시적 manifest registry를 runtime flow로 전달하는 것을 선호하세요.

### Activation planning

Activation planning은 control plane의 일부입니다. Caller는 더 넓은 runtime registry를 로드하기 전에 구체적인 command, provider, channel, route, agent harness 또는 capability와 관련된 Plugin이 무엇인지 물을 수 있습니다.

Planner는 현재 manifest behavior와 호환성을 유지합니다:

- `activation.*` 필드는 명시적인 플래너 힌트입니다
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, 훅은 manifest 소유권 fallback으로 남습니다
- ID 전용 플래너 API는 기존 호출자에게 계속 제공됩니다
- plan API는 진단에서 명시적 힌트와 소유권 fallback을 구분할 수 있도록 reason label을 보고합니다

<Warning>
`activation`을 lifecycle hook이나 `register(...)`의 대체물로 취급하지 마세요. 이는 로딩 범위를 좁히는 데 사용하는 metadata입니다. 관계를 이미 설명하는 ownership 필드가 있다면 그것을 우선 사용하고, 추가 플래너 힌트가 필요할 때만 `activation`을 사용하세요.
</Warning>

### 채널 Plugin과 공유 메시지 도구

채널 Plugin은 일반 채팅 작업을 위해 별도의 send/edit/react 도구를 등록할 필요가 없습니다. OpenClaw는 코어에 하나의 공유 `message` 도구를 유지하고, 채널 Plugin은 그 뒤의 채널별 discovery와 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- 코어는 공유 `message` 도구 호스트, 프롬프트 연결, 세션/스레드 bookkeeping, 실행 dispatch를 소유합니다
- 채널 Plugin은 범위가 지정된 action discovery, capability discovery, 채널별 schema fragment를 소유합니다
- 채널 Plugin은 conversation id가 thread id를 인코딩하거나 parent conversation에서 상속하는 방식 같은 provider별 세션 conversation grammar를 소유합니다
- 채널 Plugin은 action adapter를 통해 최종 action을 실행합니다

채널 Plugin의 경우 SDK 표면은 `ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 discovery 호출을 통해 Plugin은 표시되는 action, capability, schema contribution을 함께 반환할 수 있으므로 해당 요소들이 서로 어긋나지 않습니다.

채널별 메시지 도구 param이 로컬 path나 원격 media URL 같은 media source를 전달하는 경우, Plugin은 `describeMessageTool(...)`에서 `mediaSourceParams`도 반환해야 합니다. 코어는 Plugin이 소유한 param 이름을 하드코딩하지 않고도 sandbox path normalization과 outbound media-access hint를 적용하기 위해 이 명시적 목록을 사용합니다. 여기서는 채널 전체에 대한 단일 flat list가 아니라 action 범위의 map을 선호하세요. 그래야 profile 전용 media param이 `send` 같은 관련 없는 action에서 normalize되지 않습니다.

코어는 해당 discovery 단계에 runtime scope를 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 inbound `requesterSenderId`

이는 context-sensitive Plugin에 중요합니다. 채널은 코어 `message` 도구에 채널별 branch를 하드코딩하지 않고도 active account, 현재 room/thread/message, 신뢰된 requester identity를 기준으로 메시지 action을 숨기거나 노출할 수 있습니다.

embedded-runner routing 변경이 여전히 Plugin 작업인 이유도 이것입니다. runner는 현재 chat/session identity를 Plugin discovery 경계로 전달하여 공유 `message` 도구가 현재 turn에 맞는 올바른 채널 소유 표면을 노출하도록 할 책임이 있습니다.

채널 소유 실행 helper의 경우, bundled Plugin은 실행 runtime을 자체 extension module 안에 유지해야 합니다. 코어는 더 이상 `src/agents/tools` 아래의 Discord, Slack, Telegram, WhatsApp message-action runtime을 소유하지 않습니다. 별도의 `plugin-sdk/*-action-runtime` subpath를 publish하지 않으며, bundled Plugin은 자신의 extension 소유 module에서 자체 local runtime code를 직접 import해야 합니다.

동일한 경계는 일반적으로 provider 이름이 붙은 SDK seam에도 적용됩니다. 코어는 Slack, Discord, Signal, WhatsApp 또는 유사한 extension의 채널별 convenience barrel을 import해서는 안 됩니다. 코어에 어떤 behavior가 필요하다면 bundled Plugin 자체의 `api.ts` / `runtime-api.ts` barrel을 사용하거나, 그 필요를 공유 SDK의 좁은 generic capability로 승격하세요.

Bundled Plugin도 같은 규칙을 따릅니다. bundled Plugin의 `runtime-api.ts`는 자체 branded `openclaw/plugin-sdk/<plugin-id>` facade를 다시 export해서는 안 됩니다. 이러한 branded facade는 external Plugin과 오래된 consumer를 위한 compatibility shim으로 남지만, bundled Plugin은 local export와 `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, `openclaw/plugin-sdk/webhook-ingress` 같은 좁은 generic SDK subpath를 사용해야 합니다. 기존 external ecosystem의 compatibility boundary가 요구하지 않는 한, 새 코드는 plugin-id-specific SDK facade를 추가해서는 안 됩니다.

poll의 경우 구체적으로 두 가지 실행 경로가 있습니다.

- `outbound.sendPoll`은 공통 poll model에 맞는 채널을 위한 공유 baseline입니다
- `actions.handleAction("poll")`은 채널별 poll semantic이나 추가 poll parameter를 위한 권장 경로입니다

코어는 이제 Plugin poll dispatch가 action을 거절한 뒤에야 공유 poll parsing을 지연 수행하므로, Plugin 소유 poll handler는 generic poll parser에 먼저 차단되지 않고 채널별 poll field를 받을 수 있습니다.

전체 startup sequence는 [Plugin architecture internals](/ko/plugins/architecture-internals)를 참고하세요.

## Capability 소유권 모델

OpenClaw는 native Plugin을 서로 관련 없는 integration 묶음이 아니라 **회사** 또는 **기능**의 소유권 경계로 취급합니다.

이는 다음을 의미합니다.

- 회사 Plugin은 일반적으로 해당 회사의 OpenClaw-facing surface 전체를 소유해야 합니다
- 기능 Plugin은 일반적으로 자신이 도입하는 전체 feature surface를 소유해야 합니다
- 채널은 provider behavior를 ad hoc으로 다시 구현하는 대신 공유 코어 capability를 사용해야 합니다

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai`는 text inference, speech, realtime voice, media understanding, image generation을 소유합니다. `google`은 text inference와 media understanding, image generation, web search를 소유합니다. `qwen`은 text inference와 media understanding, video generation을 소유합니다.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs`와 `microsoft`는 speech를 소유하고, `firecrawl`은 web-fetch를 소유하며, `minimax` / `mistral` / `moonshot` / `zai`는 media-understanding backend를 소유합니다.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call`은 call transport, tool, CLI, route, Twilio media-stream bridging을 소유하지만, vendor Plugin을 직접 import하는 대신 공유 speech, realtime transcription, realtime voice capability를 사용합니다.
  </Accordion>
</AccordionGroup>

의도한 최종 상태는 다음과 같습니다.

- OpenAI는 text model, speech, image, 향후 video에 걸쳐 있더라도 하나의 Plugin에 있습니다
- 다른 vendor도 자신의 surface area에 대해 같은 방식을 사용할 수 있습니다
- 채널은 어떤 vendor Plugin이 provider를 소유하는지 신경 쓰지 않고, 코어가 노출하는 공유 capability contract를 사용합니다

핵심 구분은 다음과 같습니다.

- **Plugin** = 소유권 경계
- **capability** = 여러 Plugin이 구현하거나 사용할 수 있는 코어 contract

따라서 OpenClaw가 video 같은 새 domain을 추가한다면 첫 질문은 "어떤 provider가 video handling을 하드코딩해야 하는가?"가 아닙니다. 첫 질문은 "코어 video capability contract가 무엇인가?"입니다. 그 contract가 존재하면 vendor Plugin은 그것에 대해 register할 수 있고, channel/feature Plugin은 그것을 사용할 수 있습니다.

capability가 아직 존재하지 않는다면 올바른 이동은 보통 다음과 같습니다.

<Steps>
  <Step title="Define the capability">
    누락된 capability를 코어에 정의합니다.
  </Step>
  <Step title="Expose through the SDK">
    Plugin API/runtime을 통해 typed 방식으로 노출합니다.
  </Step>
  <Step title="Wire consumers">
    채널/기능을 해당 capability에 연결합니다.
  </Step>
  <Step title="Vendor implementations">
    Vendor Plugin이 implementation을 register하게 합니다.
  </Step>
</Steps>

이렇게 하면 소유권을 명시적으로 유지하면서, 단일 vendor나 일회성 Plugin-specific code path에 의존하는 코어 behavior를 피할 수 있습니다.

### Capability layering

코드가 어디에 속하는지 결정할 때 이 mental model을 사용하세요.

<Tabs>
  <Tab title="Core capability layer">
    공유 orchestration, policy, fallback, config merge rule, delivery semantic, typed contract.
  </Tab>
  <Tab title="Vendor plugin layer">
    Vendor-specific API, auth, model catalog, speech synthesis, image generation, 향후 video backend, usage endpoint.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    코어 capability를 사용하고 이를 표면에 표시하는 Slack/Discord/voice-call/etc. integration.
  </Tab>
</Tabs>

예를 들어 TTS는 이 구조를 따릅니다.

- 코어는 reply-time TTS policy, fallback order, pref, channel delivery를 소유합니다
- `openai`, `elevenlabs`, `microsoft`는 synthesis implementation을 소유합니다
- `voice-call`은 telephony TTS runtime helper를 사용합니다

향후 capability에도 같은 pattern을 선호해야 합니다.

### Multi-capability company Plugin 예시

회사 Plugin은 외부에서 응집력 있게 느껴져야 합니다. OpenClaw에 model, speech, realtime transcription, realtime voice, media understanding, image generation, video generation, web fetch, web search에 대한 공유 contract가 있다면, vendor는 자신의 모든 surface를 한곳에서 소유할 수 있습니다.

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

중요한 것은 정확한 helper 이름이 아닙니다. 구조가 중요합니다.

- 하나의 Plugin이 vendor surface를 소유합니다
- 코어는 여전히 capability contract를 소유합니다
- 채널과 기능 Plugin은 vendor code가 아니라 `api.runtime.*` helper를 사용합니다
- contract test는 Plugin이 소유한다고 주장하는 capability를 register했는지 assert할 수 있습니다

### Capability 예시: video understanding

OpenClaw는 이미 image/audio/video understanding을 하나의 공유 capability로 취급합니다. 동일한 소유권 모델이 여기에 적용됩니다.

<Steps>
  <Step title="Core defines the contract">
    코어가 media-understanding contract를 정의합니다.
  </Step>
  <Step title="Vendor plugins register">
    Vendor Plugin은 해당되는 경우 `describeImage`, `transcribeAudio`, `describeVideo`를 register합니다.
  </Step>
  <Step title="Consumers use the shared behavior">
    채널과 기능 Plugin은 vendor code에 직접 연결하는 대신 공유 코어 behavior를 사용합니다.
  </Step>
</Steps>

이는 하나의 provider video assumption을 코어에 bake하는 일을 피합니다. Plugin은 vendor surface를 소유하고, 코어는 capability contract와 fallback behavior를 소유합니다.

Video generation도 이미 같은 sequence를 사용합니다. 코어는 typed capability contract와 runtime helper를 소유하고, vendor Plugin은 이에 대해 `api.registerVideoGenerationProvider(...)` implementation을 register합니다.

구체적인 rollout checklist가 필요하신가요? [Capability Cookbook](/ko/plugins/adding-capabilities)을 참고하세요.

## Contract와 enforcement

Plugin API surface는 의도적으로 `OpenClawPluginApi`에 typed되고 centralized되어 있습니다. 이 contract는 지원되는 registration point와 Plugin이 의존할 수 있는 runtime helper를 정의합니다.

이것이 중요한 이유는 다음과 같습니다.

- Plugin author는 하나의 안정적인 internal standard를 얻습니다
- 코어는 같은 provider id를 두 Plugin이 register하는 것 같은 중복 소유권을 거절할 수 있습니다
- startup은 잘못된 registration에 대해 actionable diagnostic을 표시할 수 있습니다
- contract test는 bundled-Plugin ownership을 enforce하고 silent drift를 방지할 수 있습니다

enforcement에는 두 layer가 있습니다.

<AccordionGroup>
  <Accordion title="Runtime registration enforcement">
    Plugin 레지스트리는 Plugin이 로드될 때 등록을 검증합니다. 예: 중복된 provider id, 중복된 speech provider id, 잘못된 형식의 등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
  </Accordion>
  <Accordion title="Contract tests">
    번들된 Plugin은 테스트 실행 중 계약 레지스트리에 캡처되어 OpenClaw가 소유권을 명시적으로 검증할 수 있습니다. 현재 이는 모델 provider, speech provider, 웹 검색 provider, 번들 등록 소유권에 사용됩니다.
  </Accordion>
</AccordionGroup>

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤 표면을 소유하는지 사전에 안다는 것입니다. 이를 통해 소유권이 암묵적이지 않고 선언되고, 타입이 지정되며, 테스트 가능하므로 core와 채널이 매끄럽게 조합될 수 있습니다.

### 계약에 포함되어야 하는 것

<Tabs>
  <Tab title="Good contracts">
    - 타입이 지정됨
    - 작음
    - capability별로 구체적임
    - core가 소유함
    - 여러 Plugin에서 재사용 가능함
    - 벤더 지식 없이 채널/기능에서 사용할 수 있음

  </Tab>
  <Tab title="Bad contracts">
    - core 안에 숨겨진 벤더별 정책
    - 레지스트리를 우회하는 일회성 Plugin 탈출구
    - 채널 코드가 벤더 구현에 직접 접근함
    - `OpenClawPluginApi` 또는 `api.runtime`의 일부가 아닌 임시 런타임 객체

  </Tab>
</Tabs>

확신이 없을 때는 추상화 수준을 높이세요. 먼저 capability를 정의한 다음, Plugin이 거기에 연결되게 하세요.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 **같은 프로세스 안에서** 실행됩니다. 샌드박스 처리되지 않습니다. 로드된 네이티브 Plugin은 core 코드와 동일한 프로세스 수준 신뢰 경계를 가집니다.

<Warning>
네이티브 Plugin의 영향: Plugin은 도구, 네트워크 핸들러, 훅, 서비스를 등록할 수 있습니다. Plugin 버그는 Gateway를 충돌시키거나 불안정하게 만들 수 있습니다. 악의적인 네이티브 Plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일합니다.
</Warning>

호환 번들은 OpenClaw가 현재 이를 메타데이터/콘텐츠 팩으로 취급하므로 기본적으로 더 안전합니다. 현재 릴리스에서는 이는 주로 번들된 Skills를 의미합니다.

번들되지 않은 Plugin에는 allowlist와 명시적인 설치/로드 경로를 사용하세요. 워크스페이스 Plugin은 프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들된 워크스페이스 패키지 이름의 경우, Plugin id를 npm 이름에 고정하세요. 기본값은 `@openclaw/<id>`이며, 패키지가 의도적으로 더 좁은 Plugin 역할을 노출하는 경우 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은 승인된 타입 접미사를 사용할 수 있습니다.

<Note>
**신뢰 참고:** `plugins.allow`는 소스 출처가 아니라 **Plugin id**를 신뢰합니다. 번들된 Plugin과 동일한 id를 가진 워크스페이스 Plugin은 해당 워크스페이스 Plugin이 활성화되거나 allowlist에 포함될 때 의도적으로 번들된 복사본을 가립니다. 이는 정상이며 로컬 개발, 패치 테스트, 핫픽스에 유용합니다. 번들된 Plugin의 신뢰는 설치 메타데이터가 아니라 로드 시점의 디스크에 있는 매니페스트와 코드인 소스 스냅샷에서 해석됩니다. 손상되었거나 대체된 설치 레코드는 실제 소스가 주장하는 범위를 넘어 번들된 Plugin의 신뢰 표면을 조용히 넓힐 수 없습니다.
</Note>

## 내보내기 경계

OpenClaw는 구현 편의성이 아니라 capability를 내보냅니다.

capability 등록은 공개로 유지하세요. 계약이 아닌 헬퍼 내보내기는 줄이세요.

- 번들된 Plugin별 헬퍼 하위 경로
- 공개 API로 의도되지 않은 런타임 배관 하위 경로
- 벤더별 편의 헬퍼
- 구현 세부 사항인 setup/onboarding 헬퍼

예약된 번들 Plugin 헬퍼 하위 경로는 생성된 SDK 내보내기 맵에서 폐기되었습니다. 소유자별 헬퍼는 소유하는 Plugin 패키지 안에 유지하세요. 재사용 가능한 host 동작만 `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 계약으로 승격하세요.

## 내부 구조 및 참고 자료

로드 파이프라인, 레지스트리 모델, provider 런타임 훅, Gateway HTTP 라우트, 메시지 도구 스키마, 채널 대상 해석, provider 카탈로그, context engine Plugin, 새 capability 추가 가이드는 [Plugin 아키텍처 내부 구조](/ko/plugins/architecture-internals)를 참조하세요.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin 매니페스트](/ko/plugins/manifest)
- [Plugin SDK setup](/ko/plugins/sdk-setup)
