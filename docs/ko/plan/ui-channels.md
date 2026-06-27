---
read_when:
    - 채널 메시지 UI, 대화형 페이로드 또는 네이티브 채널 렌더러 리팩터링
    - 메시지 도구 기능, 전달 힌트 또는 교차 컨텍스트 마커 변경
    - Discord Carbon 가져오기 팬아웃 또는 채널 Plugin 런타임 지연 로딩 디버깅
summary: 의미론적 메시지 표시를 채널 네이티브 UI 렌더러와 분리합니다.
title: 채널 프레젠테이션 리팩터링 계획
x-i18n:
    generated_at: "2026-06-27T17:39:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## 상태

공유 agent, CLI, Plugin capability, outbound delivery 표면에 구현되었습니다.

- `ReplyPayload.presentation`은 의미론적 메시지 UI를 전달합니다.
- `ReplyPayload.delivery.pin`은 전송된 메시지 고정 요청을 전달합니다.
- 공유 메시지 액션은 provider 네이티브 `components`, `blocks`, `buttons`, 또는 `card` 대신 `presentation`, `delivery`, `pin`을 노출합니다.
- Core는 Plugin이 선언한 outbound capability를 통해 presentation을 렌더링하거나 자동으로 degrade합니다.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu 렌더러는 generic contract를 사용합니다.
- Discord channel control-plane 코드는 더 이상 Carbon 기반 UI 컨테이너를 import하지 않습니다.

Canonical 문서는 이제 [메시지 presentation](/ko/plugins/message-presentation)에 있습니다.
이 계획은 과거 구현 맥락으로 유지하고, contract, renderer, fallback 동작 변경은 canonical 가이드에서 업데이트하세요.

## 문제

Channel UI는 현재 서로 호환되지 않는 여러 표면으로 나뉘어 있습니다.

- Core는 `buildCrossContextComponents`를 통해 Discord 형태의 cross-context renderer hook을 소유합니다.
- Discord `channel.ts`는 `DiscordUiContainer`를 통해 네이티브 Carbon UI를 import할 수 있으며, 이로 인해 runtime UI dependency가 channel Plugin control plane으로 들어옵니다.
- agent와 CLI는 Discord `components`, Slack `blocks`, Telegram 또는 Mattermost `buttons`, Teams 또는 Feishu `card` 같은 네이티브 payload escape hatch를 노출합니다.
- `ReplyPayload.channelData`는 transport hint와 네이티브 UI envelope를 모두 전달합니다.
- generic `interactive` 모델은 존재하지만, Discord, Slack, Teams, Feishu, LINE, Telegram, Mattermost에서 이미 사용하는 더 풍부한 layout보다 범위가 좁습니다.

이로 인해 core가 네이티브 UI shape를 알게 되고, Plugin runtime laziness가 약해지며, agent가 동일한 메시지 의도를 표현하는 provider별 방법을 너무 많이 갖게 됩니다.

## 목표

- Core는 선언된 capability를 기반으로 메시지에 가장 적합한 의미론적 presentation을 결정합니다.
- Extension은 capability를 선언하고 의미론적 presentation을 네이티브 transport payload로 렌더링합니다.
- Web Control UI는 chat 네이티브 UI와 분리된 상태로 유지됩니다.
- 네이티브 channel payload는 공유 agent 또는 CLI 메시지 표면을 통해 노출되지 않습니다.
- 지원되지 않는 presentation 기능은 최선의 텍스트 표현으로 자동 degrade됩니다.
- 전송된 메시지 고정 같은 delivery 동작은 presentation이 아니라 generic delivery metadata입니다.

## 비목표

- `buildCrossContextComponents`에 대한 이전 버전 호환성 shim은 없습니다.
- `components`, `blocks`, `buttons`, 또는 `card`에 대한 public 네이티브 escape hatch는 없습니다.
- channel-native UI library를 core에서 import하지 않습니다.
- 번들 channel을 위한 provider별 SDK seam은 없습니다.

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

`interactive`는 migration 중 `presentation`의 subset이 됩니다.

- `interactive` text block은 `presentation.blocks[].type = "text"`에 매핑됩니다.
- `interactive` buttons block은 `presentation.blocks[].type = "buttons"`에 매핑됩니다.
- `interactive` select block은 `presentation.blocks[].type = "select"`에 매핑됩니다.

외부 agent와 CLI schema는 이제 `presentation`을 사용합니다. `interactive`는 기존 reply producer를 위한 내부 legacy parser/rendering helper로 남습니다.
public producer-facing API는 `interactive`를 deprecated로 취급합니다. 기존 approval helper와 오래된 Plugin이 계속 작동하는 동안 새 코드는 `presentation`을 emit할 수 있도록 runtime 지원은 유지됩니다.

## Delivery metadata

UI가 아닌 send 동작을 위한 core 소유 `delivery` 필드를 추가합니다.

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
- `required` 기본값은 `false`입니다. 지원되지 않는 channel 또는 pinning 실패는 delivery를 계속 진행하는 방식으로 자동 degrade됩니다.
- 수동 `pin`, `unpin`, `list-pins` 메시지 액션은 기존 메시지에 대해 유지됩니다.

현재 Telegram ACP topic binding은 `channelData.telegram.pin = true`에서 `delivery.pin = true`로 이동해야 합니다.

## Runtime capability contract

control-plane channel Plugin이 아니라 runtime outbound adapter에 presentation 및 delivery render hook을 추가합니다.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
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

- 대상 channel과 runtime adapter를 resolve합니다.
- presentation capability를 요청합니다.
- 렌더링 전에 지원되지 않는 block을 degrade하고 generic capability limit을 적용합니다.
- `renderPresentation`을 호출합니다.
- renderer가 없으면 presentation을 text fallback으로 변환합니다.
- send 성공 후 `delivery.pin`이 요청되고 지원되는 경우 `pinDeliveredMessage`를 호출합니다.

## Channel mapping

Discord:

- runtime-only module에서 `presentation`을 components v2와 Carbon container로 렌더링합니다.
- accent color helper는 light module에 유지합니다.
- channel Plugin control-plane 코드에서 `DiscordUiContainer` import를 제거합니다.

Slack:

- `presentation`을 Block Kit으로 렌더링합니다.
- agent와 CLI `blocks` input을 제거합니다.

Telegram:

- text, context, divider를 text로 렌더링합니다.
- target surface에 대해 구성되고 허용된 경우 action과 select를 inline keyboard로 렌더링합니다.
- inline button이 비활성화된 경우 text fallback을 사용합니다.
- ACP topic pinning을 `delivery.pin`으로 이동합니다.

Mattermost:

- 구성된 경우 action을 interactive button으로 렌더링합니다.
- 다른 block은 text fallback으로 렌더링합니다.

MS Teams:

- `presentation`을 Adaptive Card로 렌더링합니다.
- 수동 pin/unpin/list-pins action을 유지합니다.
- 대상 conversation에 대해 Graph 지원이 신뢰할 수 있다면 선택적으로 `pinDeliveredMessage`를 구현합니다.

Feishu:

- `presentation`을 interactive card로 렌더링합니다.
- 수동 pin/unpin/list-pins action을 유지합니다.
- API 동작이 신뢰할 수 있다면 sent-message pinning을 위해 선택적으로 `pinDeliveredMessage`를 구현합니다.

LINE:

- 가능한 경우 `presentation`을 Flex 또는 template message로 렌더링합니다.
- 지원되지 않는 block은 text로 fallback합니다.
- `channelData`에서 LINE UI payload를 제거합니다.

Plain 또는 제한된 channel:

- 보수적인 formatting으로 presentation을 text로 변환합니다.

## Refactor 단계

1. `ui-colors.ts`를 Carbon 기반 UI에서 분리하고 `extensions/discord/src/channel.ts`에서 `DiscordUiContainer`를 제거하는 Discord release fix를 다시 적용합니다.
2. `ReplyPayload`, outbound payload normalization, delivery summary, hook payload에 `presentation`과 `delivery`를 추가합니다.
3. 좁은 SDK/runtime subpath에 `MessagePresentation` schema와 parser helper를 추가합니다.
4. 메시지 capability `buttons`, `cards`, `components`, `blocks`를 의미론적 presentation capability로 교체합니다.
5. presentation render와 delivery pinning을 위한 runtime outbound adapter hook을 추가합니다.
6. cross-context component construction을 `buildCrossContextPresentation`으로 교체합니다.
7. `src/infra/outbound/channel-adapters.ts`를 삭제하고 channel Plugin type에서 `buildCrossContextComponents`를 제거합니다.
8. `maybeApplyCrossContextMarker`를 변경해 네이티브 param 대신 `presentation`을 attach하도록 합니다.
9. plugin-dispatch send path가 의미론적 presentation과 delivery metadata만 사용하도록 업데이트합니다.
10. agent와 CLI 네이티브 payload param인 `components`, `blocks`, `buttons`, `card`를 제거합니다.
11. 네이티브 message-tool schema를 생성하는 SDK helper를 제거하고 presentation schema helper로 대체합니다.
12. `channelData`에서 UI/native envelope를 제거합니다. 남은 각 field가 review될 때까지 transport metadata만 유지합니다.
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE renderer를 migrate합니다.
14. message CLI, channel page, Plugin SDK, capability cookbook 문서를 업데이트합니다.
15. Discord 및 영향을 받는 channel entrypoint에 대해 import fanout profiling을 실행합니다.

1-11단계와 13-14단계는 이 refactor에서 공유 agent, CLI, Plugin capability, outbound adapter contract에 대해 구현되었습니다. 12단계는 provider-private `channelData` transport envelope에 대한 더 깊은 내부 cleanup pass로 남아 있습니다. 15단계는 type/test gate를 넘어 정량화된 import-fanout 수치를 원할 경우 follow-up validation으로 남아 있습니다.

## 테스트

추가 또는 업데이트:

- Presentation normalization test.
- 지원되지 않는 block에 대한 presentation auto-degrade test.
- Plugin dispatch 및 core delivery path에 대한 cross-context marker test.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE, text fallback에 대한 channel render matrix test.
- 네이티브 field가 제거되었음을 증명하는 message tool schema test.
- 네이티브 flag가 제거되었음을 증명하는 CLI test.
- Carbon을 다루는 Discord entrypoint import-laziness regression.
- Telegram과 generic fallback을 다루는 delivery pin test.

## 미해결 질문

- `delivery.pin`을 첫 번째 pass에서 Discord, Slack, MS Teams, Feishu에 구현해야 하나요, 아니면 먼저 Telegram에만 구현해야 하나요?
- `delivery`가 결국 `replyToId`, `replyToCurrent`, `silent`, `audioAsVoice` 같은 기존 field를 흡수해야 하나요, 아니면 post-send 동작에 집중해야 하나요?
- presentation이 image 또는 file reference를 직접 지원해야 하나요, 아니면 당분간 media를 UI layout과 분리된 상태로 유지해야 하나요?

## 관련 문서

- [Channel 개요](/ko/channels)
- [메시지 presentation](/ko/plugins/message-presentation)
