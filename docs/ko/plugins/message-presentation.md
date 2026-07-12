---
read_when:
    - 메시지 카드, 차트, 표, 버튼 또는 선택 항목 렌더링 추가 또는 수정
    - 리치 아웃바운드 메시지를 지원하는 채널 Plugin 구축하기
    - 메시지 도구의 표시 또는 전달 기능 변경
    - 제공자별 카드/블록/컴포넌트 렌더링 회귀 디버깅
summary: 채널 Plugin을 위한 시맨틱 메시지 카드, 차트, 표, 컨트롤, 대체 텍스트 및 전송 힌트
title: 메시지 표시 방식
x-i18n:
    generated_at: "2026-07-12T15:28:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

메시지 프레젠테이션은 풍부한 아웃바운드 채팅 UI를 위한 OpenClaw의 공통 계약입니다.
에이전트, CLI 명령, 승인 흐름 및 Plugin이 메시지 의도를 한 번만 기술하면,
각 채널 Plugin이 가능한 최상의 네이티브 형태로 렌더링할 수 있습니다.

이식 가능한 메시지 UI에는 프레젠테이션을 사용하십시오. 텍스트 섹션, 짧은 컨텍스트/바닥글
텍스트, 구분선, 차트, 표, 버튼, 선택 메뉴 및 카드 제목/톤을 지원합니다.

Discord `components`, Slack `blocks`, Telegram `buttons`, Teams `card` 또는
Feishu `card` 같은 새로운 제공자 네이티브 필드를 공통 메시지 도구에 추가하지 마십시오.
이러한 필드는 채널 Plugin이 소유하는 렌더러 출력입니다.

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** 레거시 콜백 값입니다. 새 컨트롤에는 action을 사용하는 것이 좋습니다. */
  value?: string;
  /** @deprecated type이 "url"인 action을 사용하십시오. */
  url?: string;
  /** @deprecated type이 "web-app"인 action을 사용하십시오. */
  webApp?: { url: string };
  /** @deprecated type이 "web-app"인 action을 사용하십시오. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** 레거시 콜백 값입니다. 새 컨트롤에는 action을 사용하는 것이 좋습니다. */
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

버튼 의미 체계:

- `action.type: "command"`는 코어의 명령 경로를 통해 네이티브 슬래시 명령을
  실행합니다. 기본 제공 명령 버튼과 메뉴에 사용하십시오.
- `action.type: "callback"`은 불투명한 Plugin 데이터를 채널의 상호작용
  경로를 통해 전달합니다. 채널 Plugin은 콜백 데이터를 슬래시 명령으로
  재해석해서는 안 됩니다.
- `action.type: "approval"`은 하나의 지속 가능한 운영자 승인, 명시적인
  `exec` 또는 `plugin` 종류 및 요청된 결정을 식별합니다. 채널 Plugin은
  해당 작업을 전송 계층 전용 콜백으로 인코딩하고 승인 서비스를 통해
  처리합니다. `/approve` 명령 텍스트를 파싱하거나 ID에서 종류를 추론해서는
  안 됩니다.
- `action.type: "url"`은 일반 링크를 엽니다.
- `action.type: "web-app"`은 채널 네이티브 웹 앱을 실행합니다.
- `value`는 레거시 불투명 콜백 값입니다. 채널 Plugin이 텍스트를 추측하지
  않고 명령과 콜백을 매핑할 수 있도록 새 컨트롤에서는 `action`을 사용해야 합니다.
- `url`, `webApp` 및 `web_app`은 사용 중단된 경계 입력으로 계속 허용됩니다.
  정규화기는 렌더러가 출시된 레거시 의미 체계와 명시적인 타입 지정 작업을
  구분할 수 있도록 이러한 필드를 보존합니다. 새 생성자는 `action`을 사용해야 합니다.
- `label`은 필수이며 텍스트 폴백에도 사용됩니다.
- `style`은 권고 사항입니다. 렌더러는 지원되지 않는 스타일을 안전한
  기본값에 매핑해야 하며, 전송을 실패 처리해서는 안 됩니다.
- `priority`는 선택 사항입니다. 채널이 작업 제한을 알리고 일부 컨트롤을
  제거해야 하는 경우, 코어는 우선순위가 높은 버튼을 먼저 유지하고
  우선순위가 같은 버튼 간에는 원래 순서를 보존합니다. 모든 컨트롤이 제한에
  맞으면 작성된 순서를 보존합니다.
- `disabled`는 선택 사항입니다. 채널은 `supportsDisabled`로 명시적으로
  지원을 선언해야 합니다. 그렇지 않으면 코어는 비활성화된 컨트롤을
  상호작용할 수 없는 폴백 텍스트로 전환합니다. 비활성화된 버튼은 `command`
  작업을 포함하더라도 폴백 텍스트에서 항상 레이블만 렌더링합니다.
- `reusable`은 선택 사항입니다. 재사용 가능한 네이티브 콜백을 지원하는
  채널은 상호작용이 성공한 후에도 작업을 계속 사용할 수 있게 유지할 수 있습니다.
  새로 고침, 검사 또는 세부 정보 보기와 같이 반복 가능하거나 멱등적인 작업에
  사용하십시오. 일반적인 일회성 승인과 파괴적인 작업에는 설정하지 마십시오.

선택 의미 체계:

- `options[].action`은 `command` 또는 `callback`만 허용합니다. 승인 및 링크 작업은 버튼에서만 사용할 수 있습니다.
- `options[].value`는 레거시 선택 애플리케이션 값입니다.
- `placeholder`는 권고 사항이며 네이티브 선택 기능을 지원하지 않는 채널에서는
  무시될 수 있습니다.
- 채널이 선택 기능을 지원하지 않으면 폴백 텍스트에 레이블이 나열됩니다.

차트 의미 체계:

- `pie`에는 양수인 세그먼트 값이 필요합니다.
- `bar`, `area` 및 `line`은 순서가 지정된 하나의 `categories` 배열을 사용합니다.
  모든 시리즈는 동일한 순서로 각 범주마다 정확히 하나의 유한 값을 제공합니다.
- 범주 레이블과 시리즈 이름은 고유해야 합니다. 유효하지 않거나 불완전한 차트
  블록은 데이터를 암묵적으로 변경하는 대신 정규화 과정에서 제거됩니다.
- 네이티브 차트 렌더링은 `presentationCapabilities.charts`를 통해 명시적으로
  지원해야 합니다. 다른 채널은 차트 제목, 축, 범주, 시리즈 및 값을
  결정론적 텍스트로 수신합니다. 이는 접근성 폴백이기도 합니다.

표 의미 체계:

- `caption`은 필수인 짧은 제목입니다. `headers`에는 고유하고 비어 있지 않은
  열 레이블이 하나 이상 포함되어야 합니다.
- `rows`에는 행이 하나 이상 포함되어야 합니다. 모든 행에는 헤더마다 정확히
  하나의 셀이 있어야 하며, 모든 셀은 비어 있지 않은 문자열 또는 유한 숫자여야 합니다.
- `rowHeaderColumnIndex`는 네이티브 렌더러가 해당 셀을 행 헤더로 노출해야 하는
  열을 식별하는 선택적 0부터 시작하는 인덱스입니다.
- 표 정규화는 원자적으로 수행됩니다. 유효하지 않은 캡션, 헤더, 행 너비, 셀
  또는 행 헤더 인덱스가 있으면 데이터를 잘라내거나 수정하는 대신 표 블록을 제거합니다.
- 네이티브 표 렌더링은 `presentationCapabilities.tables`를 통해 명시적으로
  지원해야 합니다. 다른 채널은 내부 공백이 축약된 상태로 캡션과 모든 행을
  결정론적인 선형 텍스트로 수신합니다.

  ```text
  진행 중인 파이프라인(표)
  - 계정: Acme; 단계: 수주; ARR: 125000
  - 계정: Globex; 단계: 검토; ARR: 82000
  ```

별도의 `report` 판별자는 없습니다. `title`, `tone`, `text`, `context`,
`chart`, `table` 및 작업 블록으로 보고서를 구성하십시오. 이렇게 하면 각
블록을 독립적으로 렌더링할 수 있고 전체 보고서에도 동일한 결정론적 텍스트
폴백이 제공됩니다.

## 생성자 예시

간단한 카드:

```json
{
  "title": "배포 승인",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary를 승격할 준비가 되었습니다." },
    { "type": "context", "text": "빌드 1234, 스테이징을 통과했습니다." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "승인",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "거부",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

URL 전용 링크 버튼:

```json
{
  "blocks": [
    { "type": "text", "text": "릴리스 노트가 준비되었습니다." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "노트 열기",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
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
      "buttons": [
        {
          "label": "실행",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

선택 메뉴:

```json
{
  "title": "환경 선택",
  "blocks": [
    {
      "type": "select",
      "placeholder": "환경",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "프로덕션", "value": "env:prod" }
      ]
    }
  ]
}
```

차트:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "분기별 매출",
      "categories": ["Q1", "Q2", "Q3"],
      "series": [
        { "name": "제품", "values": [120, 145, 138] },
        { "name": "서비스", "values": [80, 95, 104] }
      ],
      "xLabel": "분기",
      "yLabel": "매출"
    }
  ]
}
```

표 보고서:

```json
{
  "title": "파이프라인 보고서",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "단계별 현재 영업 기회입니다." },
    {
      "type": "table",
      "caption": "진행 중인 파이프라인",
      "headers": ["계정", "단계", "ARR"],
      "rows": [
        ["Acme", "수주", 125000],
        ["Globex", "검토", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "CRM 스냅샷에서 업데이트되었습니다." }
  ]
}
```

CLI 전송:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "배포 승인" \
  --presentation '{"title":"배포 승인","tone":"warning","blocks":[{"type":"text","text":"Canary가 준비되었습니다."},{"type":"buttons","buttons":[{"label":"승인","value":"deploy:approve","style":"success"},{"label":"거부","value":"deploy:decline","style":"danger"}]}]}'
```

고정 전송:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "주제가 열렸습니다" \
  --pin
```

명시적 JSON을 사용한 고정 전송:

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
    charts: false,
    tables: false,
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

기능 불리언은 렌더러가 상호작용 가능하게 만들 수 있는 항목을 나타냅니다. 선택적
`limits`는 렌더러를 호출하기 전에 코어가 조정할 수 있는 일반적인 범위를 나타냅니다.

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

Core는 렌더링 전에 시맨틱 컨트롤에 일반 제한을 적용합니다. 렌더러는
네이티브 블록 수, 카드 크기, URL 제한 및 일반 계약으로 표현할 수 없는
제공자별 특성에 대한 최종 검증과 잘라내기를 계속 담당합니다. 제한으로 인해
블록에서 모든 컨트롤이 제거되면, Core는 레이블을 비대화형 컨텍스트 텍스트로
유지하여 전달된 메시지에 표시 가능한 폴백이 남도록 합니다.

## Core 렌더링 흐름

CLI 및 표준 메시지 작업에서 사용하는 정식 아웃바운드 경로에서 Core는 다음을 수행합니다.

1. 프레젠테이션 페이로드를 정규화합니다.
2. 대상 채널의 아웃바운드 어댑터를 확인합니다.
3. `presentationCapabilities`를 읽습니다.
4. 어댑터가 기능 제한을 알리는 경우 작업 수, 레이블 길이 및
   선택 옵션 수와 같은 일반 기능 제한을 적용합니다. 어댑터가 각각
   `charts: true` 또는 `tables: true`를 명시적으로 알리지 않는 한 차트 및 표 블록은
   결정론적 텍스트로 변환됩니다.
5. 어댑터가 페이로드를 렌더링할 수 있으면 `renderPresentation`을 호출합니다.
6. 어댑터가 없거나 렌더링할 수 없으면 보수적인 텍스트로 폴백합니다.
7. 생성된 페이로드를 일반 채널 전달 경로를 통해 전송합니다.
8. 첫 번째 메시지가 성공적으로 전송된 후 `delivery.pin`과 같은
   전달 메타데이터를 적용합니다.

`ReplyPayload`를 직접 사용하는 채널 로컬 응답 또는 미리보기 흐름은
해당 정식 경로로 진입하거나, 페이로드를 일반 텍스트/미디어로 투영하기 전에
동일한 프레젠테이션 폴백을 구체화해야 합니다.

Core가 폴백 동작을 담당하므로 생성자는 채널에 구애받지 않을 수 있습니다. 채널
Plugin은 네이티브 렌더링과 상호작용 처리를 담당합니다.

## 성능 저하 규칙

프레젠테이션은 기능이 제한된 채널에서도 안전하게 전송할 수 있어야 합니다.

폴백 텍스트에는 다음이 포함됩니다.

- 첫 번째 줄에 `title`
- 일반 문단 형식의 `text` 블록
- 간결한 컨텍스트 줄 형식의 `context` 블록
- 시각적 구분선 형식의 `divider` 블록
- 링크 버튼의 URL을 포함한 버튼 레이블
- 선택 옵션 레이블
- 차트 제목, 유형, 축, 범주, 계열 및 값
- 표 캡션, 머리글 및 모든 행의 값

### 버튼 값 폴백 표시 여부

채널에서 대화형 컨트롤을 렌더링할 수 없는 경우 버튼 및 선택 항목 값은
일반 텍스트로 대체됩니다. 이 대체 동작은 불투명한 콜백 데이터를 비공개로
유지하면서도 사용성을 보존합니다.

- **`command` 형식의 작업**은 `label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`**로 렌더링됩니다.
  입력은 URL이 사용자에게 표시되므로 버튼 레이블과 함께 URL 텍스트를
  렌더링합니다.
- **선택 옵션**은 레이블만 렌더링합니다. 기본 옵션 값은
  대체 텍스트에 노출되지 않습니다.

대체 UI에 수동 명령 안내를 추가하는 채널 어댑터(예:
Feishu 문서 댓글 지침)는 대체 렌더러가 사용하는 것과 동일한 프레젠테이션 블록에서
명령 표시 여부를 확인해야 하며, 실제로 수동 명령이 표시될 때만
안내 텍스트가 나타나도록 해야 합니다.

지원되지 않는 네이티브 컨트롤이 있더라도 전체 전송이 실패해서는 안 되며 대체 방식으로 처리해야 합니다.
예:

- 인라인 버튼이 비활성화된 Telegram은 텍스트 대체 콘텐츠를 전송합니다.
- 선택 기능을 지원하지 않는 채널은 선택 옵션을 텍스트로 나열합니다.
- 네이티브 차트 기능을 지원하지 않는 채널은 차트 데이터를 텍스트로 나열합니다.
- 네이티브 표 기능을 지원하지 않는 채널은 모든 표 행을 텍스트로 나열합니다.
- URL 전용 버튼은 네이티브 링크 버튼 또는 대체 URL 줄로 변환됩니다.
- 선택적인 고정 작업이 실패해도 전달된 메시지는 실패로 처리되지 않습니다.

주요 예외는 `delivery.pin.required: true`입니다. 고정이 필수로 요청되었지만
채널에서 전송한 메시지를 고정할 수 없으면 전달 실패가 보고됩니다.

## 제공자 매핑

현재 번들로 제공되는 렌더러:

| 채널            | 네이티브 렌더링 대상                        | 참고                                                                                                                                                                                                              |
| --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 컴포넌트 및 컴포넌트 컨테이너               | 기존 제공자 네이티브 페이로드 생성자를 위해 레거시 `channelData.discord.components`를 유지하지만, 새로운 공유 전송에서는 `presentation`을 사용해야 합니다.                                                         |
| Feishu          | 대화형 카드                                 | 카드 헤더에는 `title`을 사용할 수 있으며, 본문에서는 해당 제목을 중복하지 않습니다.                                                                                                                               |
| Matrix          | 텍스트 폴백 및 구조화된 이벤트 필드         | 버튼/선택 항목은 지원되는 것으로 표시되지만, 현재 모든 블록은 네이티브 대화형 위젯이 아니라 `com.openclaw.presentation` 이벤트 필드에 담긴 `renderMessagePresentationFallbackText` 출력으로 렌더링됩니다.           |
| Mattermost      | 텍스트 및 대화형 속성                        | 선택 항목과 구분선은 지원되지 않으며, 해당 블록은 텍스트로 대체됩니다.                                                                                                                                             |
| Microsoft Teams | Adaptive Cards                              | `message` 일반 텍스트와 카드가 모두 제공되면 카드와 함께 포함됩니다. 선택 항목, 스타일 및 비활성화 상태는 지원되지 않습니다.                                                                                      |
| Slack           | Block Kit                                   | `chart`를 네이티브 `data_visualization`으로, `table`을 네이티브 `data_table`로 렌더링합니다. 레거시 `channelData.slack.blocks`를 유지하지만, 새로운 공유 전송에서는 `presentation`을 사용해야 합니다.               |
| Telegram        | 텍스트 및 인라인 키보드                      | 버튼/선택 항목을 사용하려면 대상 표면에 인라인 버튼 기능이 필요하며, 그렇지 않으면 텍스트 폴백이 사용됩니다.                                                                                                      |
| 일반 채널       | 텍스트 폴백                                 | 렌더러가 없는 채널에서도 읽을 수 있는 출력을 제공합니다.                                                                                                                                                           |

제공자 네이티브 페이로드 호환성은 기존 응답 생성자를 위한 전환 편의 기능입니다.
새로운 공유 네이티브 필드를 추가해야 할 근거는 아닙니다.

## Presentation과 InteractiveReply 비교

`InteractiveReply`는 승인 및 상호작용 헬퍼에서 사용하는 이전 내부 하위 집합입니다.
다음을 지원합니다.

- 텍스트
- 버튼
- 선택 항목

`MessagePresentation`은 표준 공유 전송 계약입니다. 다음 기능을 추가합니다.

- 제목
- 어조
- 컨텍스트
- 구분선
- 차트
- 표
- URL 전용 버튼
- `ReplyPayload.delivery`를 통한 일반 전송 메타데이터

이전 코드와 연결할 때는 `openclaw/plugin-sdk/interactive-runtime`의 헬퍼를
사용하십시오.
__OC_I18N_900014__
새 코드는 `MessagePresentation`을 직접 받거나 생성해야 합니다. 기존
`interactive` 페이로드는 `presentation`의 사용 중단된 하위 집합이며, 이전
생성자를 위한 런타임 지원은 유지됩니다.

알아 두면 유용한 사용 중단되지 않은 헬퍼는 다음과 같습니다.

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`는
  형식이 지정되지 않은 페이로드(예: CLI `--presentation` 플래그의 JSON)를
  검증하고 `MessagePresentation`으로 변환합니다.
- `isMessagePresentationInteractiveBlock(block)`은 블록의 형식을
  `buttons` | `select` 유니온으로 좁힙니다.
- `resolveMessagePresentationButtonAction(button)`과
  `resolveMessagePresentationOptionAction(option)`은 사용 중단된 경계 필드를
  허용하면서 표준 형식의 작업을 반환합니다. 명시적 `action`이 항상 우선합니다.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)`은 명령/콜백의 스칼라 값만
  읽습니다. 스칼라가 아닌 표준 작업은 레거시 섀도 `value`로 절대 폴백되지
  않으므로 승인 ID와 링크 대상의 형식이 유지됩니다.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)`은 하나의 구조화된
  데이터 블록을 채널별 폴백 경로를 위한 결정적 텍스트로 렌더링합니다.

레거시 `InteractiveReply*` 형식과 변환 헬퍼는 SDK에서
`@deprecated`로 표시됩니다.

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
`presentationToInteractiveControlsReply(...)`는 레거시 채널 구현을 위한
렌더러 브리지로 계속 사용할 수 있습니다. 새로운 생성자 코드는 이를 호출하면
안 됩니다. `presentation`을 전송하고 코어/채널 조정에서 렌더링을 처리하도록
하십시오.

승인 헬퍼에도 presentation 우선 대체 기능이 있습니다.

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` 대신
  `buildApprovalPresentationFromActionDescriptors(...)`를 사용하십시오.
- `buildApprovalInteractiveReply(...)` 대신
  `buildApprovalPresentation(...)`을 사용하십시오.
- `buildExecApprovalInteractiveReply(...)` 대신
  `buildExecApprovalPresentation(...)`을 사용하십시오.

배포된 해당 빌더는 Plugin 호환성을 위해 계속 명령 기반으로 작동합니다. 지속적인
승인 종류를 소유하는 Gateway 및 번들 채널 코드는
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` 또는
`buildTypedPluginApprovalPendingReplyPayload(...)`를 사용해야 합니다. 그러면
전송 계층에서 `/approve` 텍스트로 의미를 추론하는 대신 명시적인 `approval`
작업을 받습니다.

`renderMessagePresentationFallbackText(...)`는 구분선만 있는
presentation처럼 텍스트 폴백이 없는 presentation 블록에 대해 빈 문자열을
반환합니다. 비어 있지 않은 전송 본문이 필요한 전송 계층은 `emptyFallback`을
전달하여 기본 폴백 계약을 변경하지 않고 최소 본문을 사용하도록 선택할 수
있습니다.

## 전송 고정

고정은 표시 방식이 아니라 전달 동작입니다. `channelData.telegram.pin`과 같은
공급자 네이티브 필드 대신 `delivery.pin`을 사용하십시오.

의미:

- `pin: true`는 처음으로 성공적으로 전달된 메시지를 고정합니다.
- `pin.notify`의 기본값은 `false`입니다.
- `pin.required`의 기본값은 `false`입니다.
- 선택적 고정 실패 시 기능이 저하되지만 전송된 메시지는 그대로 유지됩니다.
- 필수 고정 실패 시 전달에 실패합니다.
- 청크로 분할된 메시지는 마지막 청크가 아니라 처음 전달된 청크를 고정합니다.

공급자가 해당 작업을 지원하는 경우 기존 메시지에 대한 수동 `pin`, `unpin`,
`pins` 메시지 작업은 계속 사용할 수 있습니다.

## Plugin 작성자 체크리스트

- 채널이 의미론적 표시를 렌더링하거나 안전하게 기능을 저하시킬 수 있으면
  `describeMessageTool(...)`에서 `presentation`을 선언하십시오.
- 런타임 아웃바운드 어댑터에 `presentationCapabilities`를 추가하십시오.
- `renderPresentation`은 제어 영역 Plugin 설정 코드가 아니라 런타임 코드에서
  구현하십시오.
- 네이티브 UI 라이브러리를 핫 설정/카탈로그 경로에 포함하지 마십시오.
- 일반 기능 제한을 알고 있다면 `presentationCapabilities.limits`에
  선언하십시오.
- 렌더러와 테스트에서 최종 플랫폼 제한을 유지하십시오.
- 지원되지 않는 차트, 표, 버튼, 선택 항목, URL 버튼, 제목/텍스트 중복,
  `message`와 `presentation`의 혼합 전송에 대한 폴백 테스트를 추가하십시오.
- 공급자가 전송된 메시지 ID를 고정할 수 있는 경우에만
  `deliveryCapabilities.pin`과 `pinDeliveredMessage`를 통해 전달 고정 지원을
  추가하십시오.
- 공유 메시지 작업 스키마를 통해 새로운 공급자 네이티브
  카드/블록/컴포넌트/버튼 필드를 노출하지 마십시오.

## 관련 문서

- [메시지 CLI](/ko/cli/message)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 아키텍처](/ko/plugins/architecture-internals#message-tool-schemas)
- [채널 표시 리팩터링 계획](/ko/plan/ui-channels)
