---
read_when:
    - 메시지 카드, 버튼 또는 선택 메뉴 렌더링 추가 또는 수정
    - 풍부한 아웃바운드 메시지를 지원하는 채널 Plugin 빌드하기
    - 메시지 도구 표시 방식 또는 전달 기능 변경
    - 공급자별 카드/블록/컴포넌트 렌더링 회귀 디버깅
summary: 채널 Plugin을 위한 의미론적 메시지 카드, 버튼, 선택 메뉴, 대체 텍스트 및 전달 힌트
title: 메시지 표시
x-i18n:
    generated_at: "2026-04-30T06:42:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

메시지 프레젠테이션은 풍부한 발신 채팅 UI를 위한 OpenClaw의 공유 계약입니다.
이를 통해 에이전트, CLI 명령, 승인 흐름, Plugin이 메시지
의도를 한 번만 설명하면, 각 채널 Plugin은 가능한 최적의 네이티브 형태로 렌더링할 수 있습니다.

이식 가능한 메시지 UI에는 프레젠테이션을 사용하세요.

- 텍스트 섹션
- 작은 컨텍스트/푸터 텍스트
- 구분선
- 버튼
- 선택 메뉴
- 카드 제목 및 톤

Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, Feishu `card` 같은 새 제공자 네이티브 필드를 공유
메시지 도구에 추가하지 마세요. 이러한 항목은 채널 Plugin이 소유하는 렌더러 출력입니다.

## 계약

Plugin 작성자는 공개 계약을 다음에서 가져옵니다.

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

- `value`는 채널이 클릭 가능한 컨트롤을 지원할 때 채널의
  기존 상호작용 경로를 통해 다시 라우팅되는 애플리케이션 동작 값입니다.
- `url`은 링크 버튼입니다. `value` 없이도 존재할 수 있습니다.
- `label`은 필수이며 텍스트 대체 표시에도 사용됩니다.
- `style`은 권고 사항입니다. 렌더러는 지원되지 않는 스타일을 안전한
  기본값으로 매핑해야 하며, 전송을 실패시켜서는 안 됩니다.

선택 의미:

- `options[].value`는 선택된 애플리케이션 값입니다.
- `placeholder`는 권고 사항이며 네이티브
  선택 지원이 없는 채널에서는 무시될 수 있습니다.
- 채널이 선택을 지원하지 않으면, 대체 텍스트가 레이블을 나열합니다.

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

채널 Plugin은 발신 어댑터에 렌더링 지원을 선언합니다.

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
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

기능 필드는 의도적으로 단순한 불리언입니다. 이는 렌더러가 상호작용 가능하게 만들 수 있는 것을
설명하며, 모든 네이티브 플랫폼 제한을 설명하지는 않습니다. 최대 버튼 수, 블록 수,
카드 크기 같은 플랫폼별 제한은 여전히
렌더러가 소유합니다.

## Core 렌더링 흐름

`ReplyPayload` 또는 메시지 동작에 `presentation`이 포함되면, core는 다음을 수행합니다.

1. 프레젠테이션 페이로드를 정규화합니다.
2. 대상 채널의 발신 어댑터를 확인합니다.
3. `presentationCapabilities`를 읽습니다.
4. 어댑터가 페이로드를 렌더링할 수 있으면 `renderPresentation`을 호출합니다.
5. 어댑터가 없거나 렌더링할 수 없으면 보수적인 텍스트로 대체합니다.
6. 결과 페이로드를 일반 채널 전달 경로를 통해 전송합니다.
7. 첫 번째 성공적으로 전송된 메시지 이후 `delivery.pin` 같은 전달 메타데이터를 적용합니다.

Core는 대체 동작을 소유하므로 생산자는 채널에 구애받지 않을 수 있습니다. 채널
Plugin은 네이티브 렌더링과 상호작용 처리를 소유합니다.

## 성능 저하 규칙

프레젠테이션은 제한된 채널에서도 안전하게 전송될 수 있어야 합니다.

대체 텍스트에는 다음이 포함됩니다.

- 첫 줄로 `title`
- 일반 단락으로 `text` 블록
- 간결한 컨텍스트 줄로 `context` 블록
- 시각적 구분선으로 `divider` 블록
- 링크 버튼의 URL을 포함한 버튼 레이블
- 선택 옵션 레이블

지원되지 않는 네이티브 컨트롤은 전체 전송을 실패시키기보다 성능 저하되어야 합니다.
예:

- 인라인 버튼이 비활성화된 Telegram은 텍스트 대체 표시를 전송합니다.
- 선택 지원이 없는 채널은 선택 옵션을 텍스트로 나열합니다.
- URL 전용 버튼은 네이티브 링크 버튼 또는 대체 URL 줄이 됩니다.
- 선택적 고정 실패는 전달된 메시지를 실패시키지 않습니다.

주요 예외는 `delivery.pin.required: true`입니다. 고정이
필수로 요청되었고 채널이 전송된 메시지를 고정할 수 없으면 전달은 실패를 보고합니다.

## 제공자 매핑

현재 번들 렌더러:

| 채널            | 네이티브 렌더링 대상                  | 참고                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 구성 요소 및 구성 요소 컨테이너       | 기존 제공자 네이티브 페이로드 생산자를 위해 레거시 `channelData.discord.components`를 보존하지만, 새 공유 전송은 `presentation`을 사용해야 합니다. |
| Slack           | Block Kit                           | 기존 제공자 네이티브 페이로드 생산자를 위해 레거시 `channelData.slack.blocks`를 보존하지만, 새 공유 전송은 `presentation`을 사용해야 합니다.       |
| Telegram        | 텍스트와 인라인 키보드                | 버튼/선택에는 대상 표면의 인라인 버튼 기능이 필요합니다. 그렇지 않으면 텍스트 대체 표시가 사용됩니다.                                         |
| Mattermost      | 텍스트와 상호작용 props              | 다른 블록은 텍스트로 성능 저하됩니다.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | 둘 다 제공되면 일반 `message` 텍스트가 카드와 함께 포함됩니다.                                                                            |
| Feishu          | 상호작용 카드                         | 카드 헤더는 `title`을 사용할 수 있으며, 본문은 해당 제목을 중복하지 않습니다.                                                                                  |
| 일반 채널        | 텍스트 대체 표시                      | 렌더러가 없는 채널도 읽을 수 있는 출력을 받습니다.                                                                                            |

제공자 네이티브 페이로드 호환성은 기존
응답 생산자를 위한 전환 편의 기능입니다. 이는 새 공유 네이티브 필드를 추가할 이유가 아닙니다.

## Presentation과 InteractiveReply

`InteractiveReply`는 승인 및 상호작용
도우미에서 사용하는 이전 내부 하위 집합입니다. 다음을 지원합니다.

- 텍스트
- 버튼
- 선택

`MessagePresentation`은 표준 공유 전송 계약입니다. 다음을 추가합니다.

- 제목
- 톤
- 컨텍스트
- 구분선
- URL 전용 버튼
- `ReplyPayload.delivery`를 통한 일반 전달 메타데이터

이전 코드를 연결할 때는 `openclaw/plugin-sdk/interactive-runtime`의 도우미를 사용하세요.

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

새 코드는 `MessagePresentation`을 직접 수락하거나 생성해야 합니다.

## 전달 고정

고정은 프레젠테이션이 아니라 전달 동작입니다. `channelData.telegram.pin` 같은
제공자 네이티브 필드 대신 `delivery.pin`을 사용하세요.

의미:

- `pin: true`는 첫 번째 성공적으로 전달된 메시지를 고정합니다.
- `pin.notify`의 기본값은 `false`입니다.
- `pin.required`의 기본값은 `false`입니다.
- 선택적 고정 실패는 성능 저하되어 전송된 메시지를 그대로 둡니다.
- 필수 고정 실패는 전달을 실패시킵니다.
- 청크된 메시지는 마지막 청크가 아니라 첫 번째 전달된 청크를 고정합니다.

수동 `pin`, `unpin`, `pins` 메시지 동작은 제공자가 해당 작업을 지원하는
기존 메시지에 대해 여전히 존재합니다.

## Plugin 작성자 체크리스트

- 채널이 의미론적 프레젠테이션을 렌더링하거나 안전하게 성능 저하시킬 수 있으면
  `describeMessageTool(...)`에서 `presentation`을 선언하세요.
- 런타임 발신 어댑터에 `presentationCapabilities`를 추가하세요.
- 제어 플레인 Plugin 설정 코드가 아니라 런타임 코드에서 `renderPresentation`을 구현하세요.
- 네이티브 UI 라이브러리를 핫 설정/카탈로그 경로에서 제외하세요.
- 렌더러와 테스트에서 플랫폼 제한을 보존하세요.
- 지원되지 않는 버튼, 선택, URL 버튼, 제목/텍스트
  중복, 그리고 `message`와 `presentation`을 함께 전송하는 경우에 대한 대체 테스트를 추가하세요.
- 제공자가 전송된 메시지 ID를 고정할 수 있을 때만 `deliveryCapabilities.pin` 및
  `pinDeliveredMessage`를 통해 전달 고정 지원을 추가하세요.
- 공유 메시지 동작 스키마를 통해 새 제공자 네이티브 카드/블록/구성 요소/버튼 필드를 노출하지 마세요.

## 관련 문서

- [메시지 CLI](/ko/cli/message)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 아키텍처](/ko/plugins/architecture-internals#message-tool-schemas)
- [채널 프레젠테이션 리팩터링 계획](/ko/plan/ui-channels)
