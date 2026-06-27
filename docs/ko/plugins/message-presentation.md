---
read_when:
    - 메시지 카드, 버튼 또는 선택 렌더링 추가 또는 수정
    - 리치 아웃바운드 메시지를 지원하는 채널 Plugin 구축
    - 메시지 도구 표시 또는 전달 기능 변경
    - 제공자별 카드/블록/컴포넌트 렌더링 회귀 디버깅
summary: 채널 Plugin을 위한 의미론적 메시지 카드, 버튼, 선택, 대체 텍스트 및 전달 힌트
title: 메시지 표시
x-i18n:
    generated_at: "2026-06-27T17:47:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

메시지 프레젠테이션은 풍부한 아웃바운드 채팅 UI를 위한 OpenClaw의 공유 계약입니다.
이를 통해 에이전트, CLI 명령, 승인 흐름, Plugin은 메시지
의도를 한 번만 설명하고, 각 채널 Plugin은 가능한 최선의 네이티브 형태로 렌더링합니다.

이식 가능한 메시지 UI에는 프레젠테이션을 사용하세요.

- 텍스트 섹션
- 작은 컨텍스트/푸터 텍스트
- 구분선
- 버튼
- 선택 메뉴
- 카드 제목과 톤

Discord `components`, Slack `blocks`, Telegram `buttons`, Teams `card`,
Feishu `card` 같은 새 제공자 네이티브 필드를 공유 메시지 도구에
추가하지 마세요. 이는 채널 Plugin이 소유하는 렌더러 출력입니다.

## 계약

Plugin 작성자는 다음에서 공개 계약을 가져옵니다.

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

형태:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
};

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

버튼 의미:

- `action.type: "command"`는 코어의 명령 경로를 통해 네이티브 슬래시 명령을
  실행합니다. 기본 제공 명령 버튼과 메뉴에 이것을 사용하세요.
- `action.type: "callback"`은 채널의 상호작용 경로를 통해 불투명한 Plugin 데이터를
  전달합니다. 채널 Plugin은 콜백 데이터를 슬래시 명령으로 재해석해서는 안 됩니다.
- `value`는 레거시 불투명 콜백 값입니다. 새 컨트롤은 `action`을 사용해야
  채널 Plugin이 텍스트를 추측하지 않고 명령과 콜백을 매핑할 수 있습니다.
- `url`은 링크 버튼입니다. `value` 없이 존재할 수 있습니다.
- `webApp`은 채널 네이티브 웹 앱 버튼을 설명합니다. Telegram은 이를
  `web_app`으로 렌더링하며 비공개 채팅에서만 지원합니다. 호환성을 위해 느슨한
  JSON 페이로드에서는 `web_app`도 계속 허용되지만, TypeScript 생산자는
  `webApp`을 사용해야 합니다.
- `label`은 필수이며 텍스트 폴백에도 사용됩니다.
- `style`은 권고 사항입니다. 렌더러는 지원되지 않는 스타일을 안전한
  기본값으로 매핑해야 하며, 전송을 실패시키면 안 됩니다.
- `priority`는 선택 사항입니다. 채널이 액션 제한을 알리고 컨트롤을
  삭제해야 할 때, 코어는 우선순위가 더 높은 버튼을 먼저 유지하고
  우선순위가 같은 버튼 사이에서는 원래 순서를 보존합니다. 모든 컨트롤이 맞으면
  작성된 순서가 보존됩니다.
- `disabled`는 선택 사항입니다. 채널은 `supportsDisabled`로 명시적으로 지원해야 하며,
  그렇지 않으면 코어가 비활성 컨트롤을 상호작용할 수 없는 폴백 텍스트로 낮춥니다.
- `reusable`은 선택 사항입니다. 재사용 가능한 네이티브 콜백을 지원하는 채널은
  성공적인 상호작용 후에도 액션을 계속 사용할 수 있게 유지할 수 있습니다.
  새로 고침, 검사, 추가 세부 정보처럼 반복 가능하거나 멱등적인 액션에 사용하고,
  일반적인 일회성 승인과 파괴적 액션에는 설정하지 마세요.

선택 의미:

- `options[].action`은 버튼 `action`과 동일한 명령/콜백 의미를 갖습니다.
- `options[].value`는 레거시 선택 애플리케이션 값입니다.
- `placeholder`는 권고 사항이며 네이티브 선택 지원이 없는 채널에서는
  무시될 수 있습니다.
- 채널이 선택을 지원하지 않으면 폴백 텍스트가 레이블 목록을 표시합니다.

## 생산자 예시

간단한 카드:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

URL 전용 링크 버튼:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Telegram Mini App 버튼:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

선택 메뉴:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI 전송:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

고정 전달:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

명시적 JSON을 사용한 고정 전달:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 렌더러 계약

채널 Plugin은 아웃바운드 어댑터에서 렌더링 지원을 선언합니다.

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

기능 불리언은 렌더러가 상호작용 가능하게 만들 수 있는 것을 설명합니다. 선택적
`limits`는 렌더러를 호출하기 전에 코어가 조정할 수 있는 일반 엔벌로프를
설명합니다.

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

코어는 렌더링 전에 의미 있는 컨트롤에 일반 제한을 적용합니다. 렌더러는
네이티브 블록 수, 카드 크기, URL 제한, 일반 계약으로 표현할 수 없는
제공자 특성에 대한 최종 제공자별 검증과 잘라내기를 계속 소유합니다.
제한으로 블록의 모든 컨트롤이 제거되면, 코어는 전달된 메시지에 계속
보이는 폴백이 있도록 레이블을 상호작용할 수 없는 컨텍스트 텍스트로 유지합니다.

## 코어 렌더링 흐름

`ReplyPayload` 또는 메시지 액션에 `presentation`이 포함되면, 코어는 다음을 수행합니다.

1. 프레젠테이션 페이로드를 정규화합니다.
2. 대상 채널의 아웃바운드 어댑터를 확인합니다.
3. `presentationCapabilities`를 읽습니다.
4. 어댑터가 알리는 경우 액션 수, 레이블 길이, 선택 옵션 수 같은
   일반 기능 제한을 적용합니다.
5. 어댑터가 페이로드를 렌더링할 수 있으면 `renderPresentation`을 호출합니다.
6. 어댑터가 없거나 렌더링할 수 없으면 보수적인 텍스트로 폴백합니다.
7. 결과 페이로드를 일반 채널 전달 경로를 통해 전송합니다.
8. 첫 번째 성공적인 전송 메시지 후 `delivery.pin` 같은 전달 메타데이터를 적용합니다.

코어는 생산자가 채널에 구애받지 않도록 폴백 동작을 소유합니다. 채널
Plugin은 네이티브 렌더링과 상호작용 처리를 소유합니다.

## 저하 규칙

프레젠테이션은 제한된 채널에서도 안전하게 전송할 수 있어야 합니다.

폴백 텍스트에는 다음이 포함됩니다.

- 첫 줄의 `title`
- 일반 단락으로 표시되는 `text` 블록
- 간결한 컨텍스트 줄로 표시되는 `context` 블록
- 시각적 구분선으로 표시되는 `divider` 블록
- 링크 버튼의 URL을 포함한 버튼 레이블
- 선택 옵션 레이블

지원되지 않는 네이티브 컨트롤은 전체 전송을 실패시키기보다 저하되어야 합니다.
예시:

- 인라인 버튼이 비활성화된 Telegram은 텍스트 폴백을 전송합니다.
- 선택 지원이 없는 채널은 선택 옵션을 텍스트로 나열합니다.
- URL 전용 버튼은 네이티브 링크 버튼 또는 폴백 URL 줄이 됩니다.
- 선택적 고정 실패는 전달된 메시지를 실패시키지 않습니다.

주요 예외는 `delivery.pin.required: true`입니다. 고정이 필수로 요청되었고
채널이 전송된 메시지를 고정할 수 없으면, 전달은 실패를 보고합니다.

## 제공자 매핑

현재 번들 렌더러:

| 채널            | 네이티브 렌더링 대상            | 참고                                                                                                                                              |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components 및 component containers | 기존 제공자 네이티브 페이로드 생산자를 위해 레거시 `channelData.discord.components`를 보존하지만, 새 공유 전송은 `presentation`을 사용해야 합니다. |
| Slack           | Block Kit                        | 기존 제공자 네이티브 페이로드 생산자를 위해 레거시 `channelData.slack.blocks`를 보존하지만, 새 공유 전송은 `presentation`을 사용해야 합니다.       |
| Telegram        | 텍스트와 인라인 키보드           | 버튼/선택에는 대상 표면의 인라인 버튼 기능이 필요하며, 그렇지 않으면 텍스트 폴백이 사용됩니다.                                                   |
| Mattermost      | 텍스트와 상호작용 props          | 다른 블록은 텍스트로 저하됩니다.                                                                                                                  |
| Microsoft Teams | Adaptive Cards                   | 일반 `message` 텍스트는 둘 다 제공될 때 카드와 함께 포함됩니다.                                                                                  |
| Feishu          | 대화형 카드                      | 카드 헤더는 `title`을 사용할 수 있으며, 본문은 해당 제목을 중복하지 않습니다.                                                                     |
| 일반 채널       | 텍스트 폴백                      | 렌더러가 없는 채널도 읽을 수 있는 출력을 받습니다.                                                                                               |

Provider 네이티브 페이로드 호환성은 기존 응답 생성자를 위한 전환 편의 기능입니다. 새로운 공유 네이티브 필드를 추가할 이유가 아닙니다.

## Presentation과 InteractiveReply

`InteractiveReply`는 승인 및 상호작용 헬퍼에서 사용하는 더 오래된 내부 하위 집합입니다. 지원 항목은 다음과 같습니다.

- 텍스트
- 버튼
- 선택 항목

`MessagePresentation`은 표준 공유 전송 계약입니다. 다음을 추가합니다.

- 제목
- 톤
- 컨텍스트
- 구분선
- URL 전용 버튼
- `ReplyPayload.delivery`를 통한 일반 전달 메타데이터

이전 코드를 연결할 때는 `openclaw/plugin-sdk/interactive-runtime`의 헬퍼를 사용하세요.

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

새 코드는 `MessagePresentation`을 직접 받아들이거나 생성해야 합니다. 기존 `interactive` 페이로드는 `presentation`의 더 이상 권장되지 않는 하위 집합이며, 이전 생성자를 위해 런타임 지원은 유지됩니다.

레거시 `InteractiveReply*` 타입과 변환 헬퍼는 SDK에서 `@deprecated`로 표시되어 있습니다.

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, 및
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)`와
`presentationToInteractiveControlsReply(...)`는 레거시 채널 구현을 위한 렌더러 브리지로 계속 사용할 수 있습니다. 새로운 생성자 코드는 이를 호출하지 않아야 합니다. `presentation`을 전송하고 코어/채널 어댑테이션이 렌더링을 처리하게 하세요.

승인 헬퍼에도 presentation 우선 대체 항목이 있습니다.

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` 대신
  `buildApprovalPresentationFromActionDescriptors(...)` 사용
- `buildApprovalInteractiveReply(...)` 대신
  `buildApprovalPresentation(...)` 사용
- `buildExecApprovalInteractiveReply(...)` 대신
  `buildExecApprovalPresentation(...)` 사용

`renderMessagePresentationFallbackText(...)`는 구분선만 있는 presentation처럼 텍스트 폴백이 없는 presentation 블록에 대해 빈 문자열을 반환합니다. 비어 있지 않은 전송 본문이 필요한 전송 계층은 기본 폴백 계약을 변경하지 않고 최소 본문을 선택하도록 `emptyFallback`을 전달할 수 있습니다.

## 전달 고정

고정은 presentation이 아니라 전달 동작입니다. `channelData.telegram.pin` 같은 provider 네이티브 필드 대신 `delivery.pin`을 사용하세요.

의미는 다음과 같습니다.

- `pin: true`는 처음 성공적으로 전달된 메시지를 고정합니다.
- `pin.notify`의 기본값은 `false`입니다.
- `pin.required`의 기본값은 `false`입니다.
- 선택적 고정 실패는 저하 처리되며 전송된 메시지는 그대로 둡니다.
- 필수 고정 실패는 전달을 실패시킵니다.
- 청크로 나뉜 메시지는 마지막 청크가 아니라 처음 전달된 청크를 고정합니다.

수동 `pin`, `unpin`, `pins` 메시지 작업은 provider가 해당 작업을 지원하는 기존 메시지에 대해 계속 존재합니다.

## Plugin 작성자 체크리스트

- 채널이 의미론적 presentation을 렌더링하거나 안전하게 저하 처리할 수 있을 때 `describeMessageTool(...)`에서 `presentation`을 선언합니다.
- 런타임 아웃바운드 어댑터에 `presentationCapabilities`를 추가합니다.
- control-plane Plugin 설정 코드가 아니라 런타임 코드에서 `renderPresentation`을 구현합니다.
- 네이티브 UI 라이브러리를 핫 설정/카탈로그 경로 밖에 둡니다.
- 알려진 경우 `presentationCapabilities.limits`에 일반 기능 제한을 선언합니다.
- 렌더러와 테스트에서 최종 플랫폼 제한을 보존합니다.
- 지원되지 않는 버튼, 선택 항목, URL 버튼, 제목/텍스트 중복, 그리고 `message`와 `presentation` 혼합 전송에 대한 폴백 테스트를 추가합니다.
- provider가 전송된 메시지 ID를 고정할 수 있을 때만 `deliveryCapabilities.pin`과
  `pinDeliveredMessage`를 통해 전달 고정 지원을 추가합니다.
- 공유 메시지 작업 스키마를 통해 새로운 provider 네이티브 카드/블록/컴포넌트/버튼 필드를 노출하지 마세요.

## 관련 문서

- [Message CLI](/ko/cli/message)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 아키텍처](/ko/plugins/architecture-internals#message-tool-schemas)
- [채널 Presentation 리팩터링 계획](/ko/plan/ui-channels)
