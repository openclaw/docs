---
read_when:
    - OpenClaw 리치 응답을 렌더링하는 Matrix 클라이언트 구축하기
    - com.openclaw.presentation 이벤트 콘텐츠 디버깅
summary: OpenClaw 인식 클라이언트용 Matrix MessagePresentation 메타데이터
title: Matrix 표시 메타데이터
x-i18n:
    generated_at: "2026-07-12T00:34:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw은 발신 Matrix `m.room.message` 이벤트에 정규화된 `MessagePresentation` 메타데이터를 `com.openclaw.presentation` 콘텐츠 키로 첨부합니다.

기본 Matrix 클라이언트는 일반 텍스트 `body`를 계속 렌더링합니다. OpenClaw을 인식하는 클라이언트는 구조화된 메타데이터를 읽고 버튼, 선택 메뉴, 컨텍스트 행, 구분선과 같은 네이티브 UI를 렌더링할 수 있습니다.

## 이벤트 콘텐츠

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version`은 메타데이터 스키마 버전이며 현재 버전은 `1`입니다. `type`은 안정적인 판별자로, 항상 `"message.presentation"`입니다. Matrix 어댑터는 이 버전 및 유형과 정확히 일치하는 페이로드만 내보냅니다. 마찬가지로 클라이언트도 안전하게 해석할 수 없는 알 수 없는 버전, 알 수 없는 `type` 값, 알 수 없는 블록 유형을 무시해야 합니다.
- `title`과 `tone`(`info`, `success`, `warning`, `danger`, `neutral`)은 선택적 힌트입니다.
- 버튼과 선택 옵션에는 레거시 문자열 `value`와 함께 유형이 지정된 `action`(`{ "type": "command", "command": "/..." }` 또는 `{ "type": "callback", "value": "..." }`)을 포함할 수 있습니다. 둘 다 있으면 `action`을 우선 사용하세요.

## 대체 동작

OpenClaw은 항상 읽을 수 있는 일반 텍스트 대체 표현을 `body`에 렌더링합니다. 구조화된 메타데이터는 부가적인 것이며 기본적인 Matrix 상호 운용성에 필수여서는 안 됩니다.

대체 렌더링 규칙:

- `title`, `text`, `context` 콘텐츠는 일반 텍스트 줄로 렌더링됩니다.
- `command` 액션이 있는 버튼은 명령을 복사할 수 있도록 ``label: `/command` `` 형식으로 렌더링됩니다. `callback` 액션이 있거나 레거시 `value`만 있는 버튼은 불투명한 콜백 값이 비공개로 유지되도록 레이블만 렌더링되며, 비활성화된 버튼은 항상 레이블만 렌더링됩니다. URL 및 웹 앱 버튼은 `label: URL` 형식으로 렌더링됩니다.
- 선택 블록은 플레이스홀더(또는 `Options:`)를 제목으로 렌더링하고 그 아래에 레이블만 포함한 옵션 줄을 표시합니다.
- 구분선만 있는 프레젠테이션처럼 렌더링되는 항목이 없으면 본문은 `---`로 대체됩니다.

지원하지 않는 클라이언트는 대체 텍스트를 계속 표시합니다. OpenClaw을 인식하는 클라이언트는 표시에 구조화된 메타데이터를 우선 사용할 수 있으며, 복사, 검색, 알림 및 접근성을 위해 대체 표현을 유지할 수 있습니다.

## 지원되는 블록

Matrix 발신 어댑터는 다음 항목에 대한 네이티브 지원을 명시합니다.

- `buttons`
- `select`
- `context`
- `divider`

`text` 블록은 대체 본문을 통해 항상 지원됩니다. 모든 블록을 최선형 프레젠테이션 힌트로 취급하고, 전체 메시지를 실패 처리하지 말고 알 수 없는 필드와 블록 유형을 무시하세요.

## 상호작용

이 메타데이터는 Matrix 콜백 의미 체계를 추가하지 않습니다. 버튼 및 선택 값은 대체 상호작용 페이로드이며, 일반적으로 슬래시 명령이나 텍스트 명령입니다. 상호작용을 지원하려는 Matrix 클라이언트는 컨트롤 값(`action.command`, 그다음 `action.value`, 그다음 `value`)을 확인하고 일반 메시지로 대화방에 다시 보냅니다.

예를 들어 값이 `/model deepseek/deepseek-chat`인 버튼은 같은 대화방에서 해당 값을 암호화된 Matrix 텍스트 메시지로 전송하여 처리할 수 있습니다.

## 승인 메타데이터와의 관계

`com.openclaw.presentation`은 일반적인 리치 메시지 표현에 사용됩니다.

승인 프롬프트는 안전에 민감한 상태, 결정, 실행/Plugin 세부 정보를 포함하므로 전용 `com.openclaw.approval` 메타데이터를 사용합니다. 같은 이벤트에 두 메타데이터 키가 모두 있으면 클라이언트는 전용 승인 렌더러를 우선해야 합니다.

## 미디어 메시지

응답에 여러 미디어 URL이 포함되면 OpenClaw은 미디어 URL마다 하나의 Matrix 이벤트를 전송합니다. 클라이언트가 렌더러 중복 없이 하나의 안정적인 구조화 페이로드를 받도록 캡션 텍스트와 프레젠테이션 메타데이터는 첫 번째 이벤트에만 첨부됩니다. 긴 텍스트가 여러 이벤트로 분할되는 경우에도 같은 규칙이 적용되어 메타데이터는 첫 번째 이벤트에만 포함됩니다.

프레젠테이션 메타데이터는 간결하게 유지하세요. 사용자에게 표시되는 긴 텍스트는 `body`에 두고 일반적인 Matrix 텍스트 분할 경로를 사용해야 합니다.
