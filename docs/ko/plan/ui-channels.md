---
read_when:
    - 채널 메시지 UI, 대화형 페이로드 또는 네이티브 채널 렌더러 리팩터링
    - 메시지 도구 기능, 전달 힌트 또는 교차 컨텍스트 마커 변경
    - Discord Carbon 가져오기 팬아웃 또는 채널 Plugin 런타임 지연 로딩 디버깅
summary: 의미론적 메시지 표현을 채널 네이티브 UI 렌더러와 분리합니다.
title: 채널 표시 방식 리팩터링 계획
x-i18n:
    generated_at: "2026-07-12T00:53:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## 상태

공유 에이전트, CLI, Plugin 기능 및 아웃바운드 전달 영역에 구현되었습니다.

- `ReplyPayload.presentation`은 의미론적 메시지 UI를 전달합니다.
- `ReplyPayload.delivery.pin`은 전송된 메시지의 고정 요청을 전달합니다.
- 공유 메시지 액션은 제공자 네이티브 `components`, `blocks`, `buttons` 또는 `card` 대신 `presentation`, `delivery` 및 `pin`을 노출합니다.
- 코어는 Plugin이 선언한 아웃바운드 기능을 통해 프레젠테이션을 렌더링하거나 자동으로 대체 표현으로 전환합니다.
- Discord, Slack, Telegram, Mattermost, MS Teams 및 Feishu 렌더러는 일반 계약을 사용합니다.
- Discord 채널 제어 영역 코드는 더 이상 Carbon 기반 UI 컨테이너를 가져오지 않습니다.

현재 표준 문서는 [메시지 프레젠테이션](/ko/plugins/message-presentation)에 있습니다.
이 계획은 과거 구현 맥락으로 유지하고, 계약, 렌더러 또는 대체 동작이 변경되면
표준 가이드를 업데이트하세요.

## 문제

현재 채널 UI는 서로 호환되지 않는 여러 영역으로 나뉘어 있습니다.

- 코어는 `buildCrossContextComponents`를 통해 Discord 형태의 교차 컨텍스트 렌더러 후크를 소유합니다.
- Discord `channel.ts`는 `DiscordUiContainer`를 통해 네이티브 Carbon UI를 가져올 수 있으며, 이로 인해 런타임 UI 종속성이 채널 Plugin 제어 영역으로 유입됩니다.
- 에이전트와 CLI는 Discord `components`, Slack `blocks`, Telegram 또는 Mattermost `buttons`, Teams 또는 Feishu `card`와 같은 네이티브 페이로드 우회 수단을 노출합니다.
- `ReplyPayload.channelData`는 전송 힌트와 네이티브 UI 봉투를 모두 전달합니다.
- 일반 `interactive` 모델이 존재하지만, Discord, Slack, Teams, Feishu, LINE, Telegram 및 Mattermost에서 이미 사용하는 풍부한 레이아웃보다 범위가 좁습니다.

이로 인해 코어가 네이티브 UI 형태를 인식하게 되고, Plugin 런타임의 지연 로딩이 약화되며, 에이전트가 동일한 메시지 의도를 표현하는 데 너무 많은 제공자별 방식을 사용하게 됩니다.

## 목표

- 코어는 선언된 기능을 바탕으로 메시지에 가장 적합한 의미론적 프레젠테이션을 결정합니다.
- 확장 기능은 기능을 선언하고 의미론적 프레젠테이션을 네이티브 전송 페이로드로 렌더링합니다.
- 웹 제어 UI는 채팅 네이티브 UI와 분리된 상태를 유지합니다.
- 공유 에이전트 또는 CLI 메시지 영역을 통해 네이티브 채널 페이로드를 노출하지 않습니다.
- 지원되지 않는 프레젠테이션 기능은 가장 적합한 텍스트 표현으로 자동 전환됩니다.
- 전송된 메시지 고정과 같은 전달 동작은 프레젠테이션이 아니라 일반 전달 메타데이터입니다.

## 비목표

- `buildCrossContextComponents`에 대한 하위 호환성 심을 제공하지 않습니다.
- `components`, `blocks`, `buttons` 또는 `card`에 대한 공개 네이티브 우회 수단을 제공하지 않습니다.
- 코어에서 채널 네이티브 UI 라이브러리를 가져오지 않습니다.
- 번들 채널을 위한 제공자별 SDK 연결부를 제공하지 않습니다.

## 목표 모델

코어가 소유하는 `presentation` 필드를 `ReplyPayload`에 추가합니다.

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

마이그레이션 중에는 `interactive`가 `presentation`의 하위 집합이 됩니다.

- `interactive` 텍스트 블록은 `presentation.blocks[].type = "text"`에 매핑됩니다.
- `interactive` 버튼 블록은 `presentation.blocks[].type = "buttons"`에 매핑됩니다.
- `interactive` 선택 블록은 `presentation.blocks[].type = "select"`에 매핑됩니다.

외부 에이전트 및 CLI 스키마는 이제 `presentation`을 사용하며, `interactive`는 기존 응답 생성자를 위한 내부 레거시 파서/렌더링 도우미로 남습니다.
공개 생성자용 API에서는 `interactive`를 사용 중단된 것으로 취급합니다. 기존 승인 도우미와 이전 Plugin이 계속
작동할 수 있도록 런타임 지원은 유지하되, 새 코드는 `presentation`을 생성합니다.

## 전달 메타데이터

UI가 아닌 전송 동작을 위해 코어가 소유하는 `delivery` 필드를 추가합니다.

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

- `delivery.pin = true`는 처음으로 성공적으로 전달된 메시지를 고정한다는 의미입니다.
- `notify`의 기본값은 `false`입니다.
- `required`의 기본값은 `false`입니다. 지원하지 않는 채널이나 고정 실패가 발생하면 전달을 계속하여 자동으로 대체 동작으로 전환합니다.
- 기존 메시지에 대한 수동 `pin`, `unpin` 및 `list-pins` 메시지 액션은 유지됩니다.

현재 Telegram ACP 주제 바인딩은 `channelData.telegram.pin = true`에서 `delivery.pin = true`로 이동해야 합니다.

## 런타임 기능 계약

제어 영역 채널 Plugin이 아니라 런타임 아웃바운드 어댑터에 프레젠테이션 및 전달 렌더링 후크를 추가합니다.

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

코어 동작:

- 대상 채널과 런타임 어댑터를 확인합니다.
- 프레젠테이션 기능을 조회합니다.
- 렌더링하기 전에 지원되지 않는 블록을 대체 표현으로 전환하고 일반 기능 제한을
  적용합니다.
- `renderPresentation`을 호출합니다.
- 렌더러가 없으면 프레젠테이션을 텍스트 대체 표현으로 변환합니다.
- 전송에 성공한 후 `delivery.pin`이 요청되고 지원되는 경우 `pinDeliveredMessage`를 호출합니다.

## 채널 매핑

Discord:

- 런타임 전용 모듈에서 `presentation`을 구성 요소 v2 및 Carbon 컨테이너로 렌더링합니다.
- 강조 색상 도우미는 경량 모듈에 유지합니다.
- 채널 Plugin 제어 영역 코드에서 `DiscordUiContainer` 가져오기를 제거합니다.

Slack:

- `presentation`을 Block Kit으로 렌더링합니다.
- 에이전트 및 CLI의 `blocks` 입력을 제거합니다.

Telegram:

- 텍스트, 컨텍스트 및 구분선을 텍스트로 렌더링합니다.
- 대상 영역에 대해 구성되고 허용된 경우 액션과 선택 항목을 인라인 키보드로 렌더링합니다.
- 인라인 버튼이 비활성화된 경우 텍스트 대체 표현을 사용합니다.
- ACP 주제 고정을 `delivery.pin`으로 이동합니다.

Mattermost:

- 구성된 경우 액션을 대화형 버튼으로 렌더링합니다.
- 다른 블록은 텍스트 대체 표현으로 렌더링합니다.

MS Teams:

- `presentation`을 Adaptive Cards로 렌더링합니다.
- 수동 고정/고정 해제/고정 목록 액션을 유지합니다.
- 대상 대화에서 Graph 지원이 안정적이라면 선택적으로 `pinDeliveredMessage`를 구현합니다.

Feishu:

- `presentation`을 대화형 카드로 렌더링합니다.
- 수동 고정/고정 해제/고정 목록 액션을 유지합니다.
- API 동작이 안정적이라면 전송된 메시지 고정을 위해 선택적으로 `pinDeliveredMessage`를 구현합니다.

LINE:

- 가능한 경우 `presentation`을 Flex 또는 템플릿 메시지로 렌더링합니다.
- 지원되지 않는 블록은 텍스트로 대체합니다.
- `channelData`에서 LINE UI 페이로드를 제거합니다.

일반 또는 제한된 채널:

- 보수적인 서식을 사용하여 프레젠테이션을 텍스트로 변환합니다.

## 리팩터링 단계

1. `ui-colors.ts`를 Carbon 기반 UI에서 분리하고 `extensions/discord/src/channel.ts`에서 `DiscordUiContainer`를 제거하는 Discord 릴리스 수정 사항을 다시 적용합니다.
2. `ReplyPayload`, 아웃바운드 페이로드 정규화, 전달 요약 및 후크 페이로드에 `presentation`과 `delivery`를 추가합니다.
3. 범위가 좁은 SDK/런타임 하위 경로에 `MessagePresentation` 스키마와 파서 도우미를 추가합니다.
4. 메시지 기능 `buttons`, `cards`, `components` 및 `blocks`를 의미론적 프레젠테이션 기능으로 교체합니다.
5. 프레젠테이션 렌더링 및 전달 고정을 위한 런타임 아웃바운드 어댑터 후크를 추가합니다.
6. 교차 컨텍스트 구성 요소 생성을 `buildCrossContextPresentation`으로 교체합니다.
7. `src/infra/outbound/channel-adapters.ts`를 삭제하고 채널 Plugin 타입에서 `buildCrossContextComponents`를 제거합니다.
8. `maybeApplyCrossContextMarker`가 네이티브 매개변수 대신 `presentation`을 첨부하도록 변경합니다.
9. Plugin 디스패치 전송 경로가 의미론적 프레젠테이션과 전달 메타데이터만 사용하도록 업데이트합니다.
10. 에이전트 및 CLI 네이티브 페이로드 매개변수 `components`, `blocks`, `buttons` 및 `card`를 제거합니다.
11. 네이티브 메시지 도구 스키마를 생성하는 SDK 도우미를 제거하고 프레젠테이션 스키마 도우미로 교체합니다.
12. `channelData`에서 UI/네이티브 봉투를 제거합니다. 나머지 각 필드를 검토할 때까지 전송 메타데이터만 유지합니다.
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu 및 LINE 렌더러를 마이그레이션합니다.
14. 메시지 CLI, 채널 페이지, Plugin SDK 및 기능 설명서 문서를 업데이트합니다.
15. Discord 및 영향을 받는 채널 진입점에 대한 가져오기 확산 프로파일링을 실행합니다.

공유 에이전트, CLI, Plugin 기능 및 아웃바운드 어댑터 계약을 대상으로 한 이번 리팩터링에서 1~11단계와 13~14단계가 구현되었습니다. 12단계는 제공자 전용 `channelData` 전송 봉투를 위한 더 심층적인 내부 정리 작업으로 남아 있습니다. 유형/테스트 게이트 이상의 정량화된 가져오기 확산 수치가 필요하다면 15단계도 후속 검증으로 남아 있습니다.

## 테스트

다음을 추가하거나 업데이트합니다.

- 프레젠테이션 정규화 테스트.
- 지원되지 않는 블록에 대한 프레젠테이션 자동 대체 테스트.
- Plugin 디스패치 및 코어 전달 경로의 교차 컨텍스트 마커 테스트.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE 및 텍스트 대체 표현에 대한 채널 렌더링 매트릭스 테스트.
- 네이티브 필드가 제거되었음을 입증하는 메시지 도구 스키마 테스트.
- 네이티브 플래그가 제거되었음을 입증하는 CLI 테스트.
- Carbon을 다루는 Discord 진입점 가져오기 지연 로딩 회귀 테스트.
- Telegram 및 일반 대체 동작을 다루는 전달 고정 테스트.

## 미해결 질문

- 첫 번째 구현에서 Discord, Slack, MS Teams 및 Feishu에도 `delivery.pin`을 구현해야 합니까, 아니면 우선 Telegram에만 구현해야 합니까?
- `delivery`가 향후 `replyToId`, `replyToCurrent`, `silent` 및 `audioAsVoice`와 같은 기존 필드도 포함해야 합니까, 아니면 전송 후 동작에만 집중해야 합니까?
- 프레젠테이션이 이미지나 파일 참조를 직접 지원해야 합니까, 아니면 당분간 미디어를 UI 레이아웃과 분리된 상태로 유지해야 합니까?

## 관련 문서

- [채널 개요](/ko/channels)
- [메시지 프레젠테이션](/ko/plugins/message-presentation)
