---
read_when:
    - 채널 메시지 UI, 대화형 페이로드 또는 네이티브 채널 렌더러 리팩터링
    - 메시지 도구 기능, 전달 힌트 또는 컨텍스트 간 마커 변경
    - Discord Carbon 임포트 팬아웃 또는 채널 Plugin 런타임 지연 로딩 디버깅
summary: 의미론적 메시지 표시를 채널 네이티브 UI 렌더러에서 분리합니다.
title: 채널 표시 방식 리팩터링 계획
x-i18n:
    generated_at: "2026-04-30T06:39:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## 상태

공유 에이전트, CLI, Plugin 기능, 아웃바운드 전달 표면에 구현됨:

- `ReplyPayload.presentation`은 의미적 메시지 UI를 전달합니다.
- `ReplyPayload.delivery.pin`은 전송된 메시지 고정 요청을 전달합니다.
- 공유 메시지 액션은 provider 네이티브 `components`, `blocks`, `buttons`, `card` 대신 `presentation`, `delivery`, `pin`을 노출합니다.
- Core는 Plugin이 선언한 아웃바운드 기능을 통해 프레젠테이션을 렌더링하거나 자동으로 degrade합니다.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu 렌더러는 generic contract를 사용합니다.
- Discord 채널 control-plane 코드는 더 이상 Carbon 기반 UI 컨테이너를 import하지 않습니다.

정식 문서는 이제 [메시지 프레젠테이션](/ko/plugins/message-presentation)에 있습니다.
이 계획은 과거 구현 맥락으로 유지하고, contract, 렌더러, fallback 동작 변경은 정식 가이드에서 업데이트하세요.

## 문제

채널 UI는 현재 여러 호환되지 않는 표면으로 나뉘어 있습니다:

- Core는 `buildCrossContextComponents`를 통해 Discord 형태의 cross-context 렌더러 hook을 소유합니다.
- Discord `channel.ts`는 `DiscordUiContainer`를 통해 네이티브 Carbon UI를 import할 수 있으며, 이로 인해 런타임 UI 의존성이 채널 Plugin control plane으로 유입됩니다.
- 에이전트와 CLI는 Discord `components`, Slack `blocks`, Telegram 또는 Mattermost `buttons`, Teams 또는 Feishu `card` 같은 네이티브 payload escape hatch를 노출합니다.
- `ReplyPayload.channelData`는 transport 힌트와 네이티브 UI envelope을 모두 전달합니다.
- generic `interactive` 모델이 존재하지만, Discord, Slack, Teams, Feishu, LINE, Telegram, Mattermost에서 이미 사용하는 더 풍부한 레이아웃보다 범위가 좁습니다.

이로 인해 Core가 네이티브 UI 형태를 인지하게 되고, Plugin 런타임 지연성이 약해지며, 에이전트가 같은 메시지 의도를 표현하는 provider별 방식을 너무 많이 갖게 됩니다.

## 목표

- Core는 선언된 기능을 바탕으로 메시지에 가장 적합한 의미적 프레젠테이션을 결정합니다.
- Extensions는 기능을 선언하고 의미적 프레젠테이션을 네이티브 transport payload로 렌더링합니다.
- Web Control UI는 채팅 네이티브 UI와 분리된 상태로 유지됩니다.
- 네이티브 채널 payload는 공유 에이전트 또는 CLI 메시지 표면을 통해 노출되지 않습니다.
- 지원되지 않는 프레젠테이션 기능은 최적의 텍스트 표현으로 자동 degrade됩니다.
- 전송된 메시지 고정 같은 전달 동작은 프레젠테이션이 아니라 generic 전달 메타데이터입니다.

## 비목표

- `buildCrossContextComponents`에 대한 이전 버전 호환성 shim은 없습니다.
- `components`, `blocks`, `buttons`, `card`에 대한 public 네이티브 escape hatch는 없습니다.
- Core가 채널 네이티브 UI 라이브러리를 import하지 않습니다.
- 번들 채널을 위한 provider별 SDK seam은 없습니다.

## 대상 모델

Core가 소유하는 `presentation` 필드를 `ReplyPayload`에 추가합니다.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

마이그레이션 중 `interactive`는 `presentation`의 subset이 됩니다:

- `interactive` 텍스트 block은 `presentation.blocks[].type = "text"`에 매핑됩니다.
- `interactive` 버튼 block은 `presentation.blocks[].type = "buttons"`에 매핑됩니다.
- `interactive` select block은 `presentation.blocks[].type = "select"`에 매핑됩니다.

외부 에이전트와 CLI 스키마는 이제 `presentation`을 사용합니다. `interactive`는 기존 reply producer를 위한 내부 legacy 파서/렌더링 helper로 남습니다.

## 전달 메타데이터

UI가 아닌 전송 동작을 위한 Core 소유 `delivery` 필드를 추가합니다.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

의미:

- `delivery.pin = true`는 성공적으로 전달된 첫 번째 메시지를 고정한다는 뜻입니다.
- `notify` 기본값은 `false`입니다.
- `required` 기본값은 `false`입니다. 지원되지 않는 채널이나 고정 실패는 전달을 계속 진행하는 방식으로 자동 degrade됩니다.
- 수동 `pin`, `unpin`, `list-pins` 메시지 액션은 기존 메시지를 위해 유지됩니다.

현재 Telegram ACP 토픽 binding은 `channelData.telegram.pin = true`에서 `delivery.pin = true`로 이동해야 합니다.

## 런타임 기능 contract

control-plane 채널 Plugin이 아니라 runtime outbound adapter에 프레젠테이션 및 전달 렌더 hook을 추가합니다.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Core 동작:

- 대상 채널과 런타임 adapter를 resolve합니다.
- 프레젠테이션 기능을 요청합니다.
- 렌더링 전에 지원되지 않는 block을 degrade합니다.
- `renderPresentation`을 호출합니다.
- 렌더러가 없으면 프레젠테이션을 텍스트 fallback으로 변환합니다.
- 성공적으로 전송한 뒤, `delivery.pin`이 요청되고 지원되는 경우 `pinDeliveredMessage`를 호출합니다.

## 채널 매핑

Discord:

- 런타임 전용 모듈에서 `presentation`을 components v2와 Carbon 컨테이너로 렌더링합니다.
- accent color helper는 가벼운 모듈에 유지합니다.
- 채널 Plugin control-plane 코드에서 `DiscordUiContainer` import를 제거합니다.

Slack:

- `presentation`을 Block Kit으로 렌더링합니다.
- 에이전트와 CLI `blocks` 입력을 제거합니다.

Telegram:

- 텍스트, context, divider를 텍스트로 렌더링합니다.
- 대상 표면에 대해 구성되고 허용된 경우 액션과 select를 inline keyboard로 렌더링합니다.
- inline button이 비활성화된 경우 텍스트 fallback을 사용합니다.
- ACP 토픽 고정을 `delivery.pin`으로 이동합니다.

Mattermost:

- 구성된 경우 액션을 interactive button으로 렌더링합니다.
- 다른 block은 텍스트 fallback으로 렌더링합니다.

MS Teams:

- `presentation`을 Adaptive Cards로 렌더링합니다.
- 수동 pin/unpin/list-pins 액션은 유지합니다.
- 대상 conversation에서 Graph 지원이 신뢰할 수 있으면 선택적으로 `pinDeliveredMessage`를 구현합니다.

Feishu:

- `presentation`을 interactive card로 렌더링합니다.
- 수동 pin/unpin/list-pins 액션은 유지합니다.
- API 동작이 신뢰할 수 있으면 전송된 메시지 고정을 위해 선택적으로 `pinDeliveredMessage`를 구현합니다.

LINE:

- 가능한 경우 `presentation`을 Flex 또는 template message로 렌더링합니다.
- 지원되지 않는 block은 텍스트로 fallback합니다.
- LINE UI payload를 `channelData`에서 제거합니다.

Plain 또는 제한된 채널:

- 보수적인 서식으로 프레젠테이션을 텍스트로 변환합니다.

## 리팩터링 단계

1. `ui-colors.ts`를 Carbon 기반 UI에서 분리하고 `extensions/discord/src/channel.ts`에서 `DiscordUiContainer`를 제거하는 Discord release fix를 다시 적용합니다.
2. `ReplyPayload`, 아웃바운드 payload normalization, 전달 summary, hook payload에 `presentation`과 `delivery`를 추가합니다.
3. 좁은 SDK/runtime subpath에 `MessagePresentation` 스키마와 parser helper를 추가합니다.
4. 메시지 기능 `buttons`, `cards`, `components`, `blocks`를 의미적 프레젠테이션 기능으로 대체합니다.
5. 프레젠테이션 렌더링과 전달 고정을 위한 런타임 아웃바운드 adapter hook을 추가합니다.
6. cross-context component 생성을 `buildCrossContextPresentation`으로 대체합니다.
7. `src/infra/outbound/channel-adapters.ts`를 삭제하고 채널 Plugin type에서 `buildCrossContextComponents`를 제거합니다.
8. `maybeApplyCrossContextMarker`를 변경해 네이티브 params 대신 `presentation`을 붙입니다.
9. Plugin-dispatch send path를 업데이트해 의미적 프레젠테이션과 전달 메타데이터만 사용하게 합니다.
10. 에이전트와 CLI 네이티브 payload params인 `components`, `blocks`, `buttons`, `card`를 제거합니다.
11. 네이티브 message-tool 스키마를 만드는 SDK helper를 제거하고 프레젠테이션 스키마 helper로 대체합니다.
12. UI/native envelope을 `channelData`에서 제거합니다. 남은 각 필드를 검토할 때까지 transport metadata만 유지합니다.
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE 렌더러를 마이그레이션합니다.
14. 메시지 CLI, 채널 페이지, Plugin SDK, 기능 cookbook 문서를 업데이트합니다.
15. Discord 및 영향을 받는 채널 entrypoint에 대해 import fanout profiling을 실행합니다.

1-11단계와 13-14단계는 이 리팩터링에서 공유 에이전트, CLI, Plugin 기능, 아웃바운드 adapter contract에 구현되었습니다. 12단계는 provider-private `channelData` transport envelope에 대한 더 깊은 내부 cleanup pass로 남아 있습니다. 15단계는 type/test gate를 넘어 정량화된 import-fanout 수치를 원할 경우의 후속 validation으로 남아 있습니다.

## 테스트

추가 또는 업데이트:

- 프레젠테이션 normalization 테스트.
- 지원되지 않는 block에 대한 프레젠테이션 자동 degrade 테스트.
- Plugin dispatch와 Core 전달 path에 대한 cross-context marker 테스트.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE, 텍스트 fallback에 대한 채널 렌더 matrix 테스트.
- 네이티브 필드가 제거되었음을 증명하는 메시지 tool 스키마 테스트.
- 네이티브 flag가 제거되었음을 증명하는 CLI 테스트.
- Carbon을 포함하는 Discord entrypoint import-laziness regression.
- Telegram 및 generic fallback을 포함하는 전달 고정 테스트.

## 열린 질문

- `delivery.pin`을 첫 pass에서 Discord, Slack, MS Teams, Feishu까지 구현해야 하나요, 아니면 Telegram만 먼저 구현해야 하나요?
- `delivery`가 결국 `replyToId`, `replyToCurrent`, `silent`, `audioAsVoice` 같은 기존 필드도 흡수해야 하나요, 아니면 전송 후 동작에 집중한 상태로 유지해야 하나요?
- 프레젠테이션이 이미지나 파일 참조를 직접 지원해야 하나요, 아니면 미디어는 지금은 UI 레이아웃과 분리된 상태로 남겨야 하나요?

## 관련

- [채널 개요](/ko/channels)
- [메시지 프레젠테이션](/ko/plugins/message-presentation)
