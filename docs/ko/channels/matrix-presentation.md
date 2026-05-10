---
read_when:
    - OpenClaw 리치 응답을 렌더링하는 Matrix 클라이언트 구축하기
    - com.openclaw.presentation 이벤트 콘텐츠 디버깅
summary: OpenClaw 인식 클라이언트를 위한 Matrix MessagePresentation 메타데이터
title: 매트릭스 프레젠테이션 메타데이터
x-i18n:
    generated_at: "2026-05-10T19:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw은 아웃바운드 Matrix `m.room.message` 이벤트에 정규화된 `MessagePresentation` 메타데이터를 `com.openclaw.presentation` 아래에 첨부할 수 있습니다.

기본 Matrix 클라이언트는 계속 일반 텍스트 `body`를 렌더링합니다. OpenClaw 인식 클라이언트는 구조화된 메타데이터를 읽고 버튼, 선택 메뉴, 컨텍스트 행, 구분선 같은 네이티브 UI를 렌더링할 수 있습니다.

## 이벤트 콘텐츠

메타데이터는 Matrix 이벤트 콘텐츠에 저장됩니다.

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version`은 Matrix 프레젠테이션 메타데이터 스키마 버전입니다. `type`은 OpenClaw 인식 클라이언트를 위한 안정적인 판별자입니다. 클라이언트는 알 수 없는 `type` 값, 안전하게 해석할 수 없는 알 수 없는 버전, 알 수 없는 블록 유형을 무시해야 합니다.

## 대체 동작

OpenClaw은 항상 읽을 수 있는 일반 텍스트 대체 콘텐츠를 `body`에 렌더링합니다. 구조화된 메타데이터는 추가 정보이며 기본적인 Matrix 상호 운용성에 필수여서는 안 됩니다.

지원되지 않는 클라이언트는 계속 대체 텍스트를 표시해야 합니다. OpenClaw 인식 클라이언트는 표시에는 구조화된 메타데이터를 우선 사용할 수 있지만, 복사, 검색, 알림, 접근성을 위해 대체 텍스트를 보존해야 합니다.

## 지원되는 블록

Matrix 아웃바운드 어댑터는 다음 지원을 알립니다.

- `buttons`
- `select`
- `context`
- `divider`

클라이언트는 이러한 블록을 최선형 프레젠테이션 힌트로 취급해야 합니다. 알 수 없는 필드와 알 수 없는 블록 유형은 전체 메시지 렌더링 실패를 유발하는 대신 무시해야 합니다.

## 상호작용

이 메타데이터는 Matrix 콜백 의미 체계를 추가하지 않습니다. 버튼과 선택 옵션 값은 대체 상호작용 페이로드이며, 일반적으로 슬래시 명령이나 텍스트 명령입니다. 상호작용을 지원하려는 Matrix 클라이언트는 선택된 값을 일반 메시지로 방에 다시 보낼 수 있습니다.

예를 들어 값이 `/model deepseek/deepseek-chat`인 버튼은 같은 방에 해당 값을 암호화된 Matrix 텍스트 메시지로 보내 처리할 수 있습니다.

## 승인 메타데이터와의 관계

`com.openclaw.presentation`은 일반적인 리치 메시지 프레젠테이션을 위한 것입니다.

승인 프롬프트는 전용 `com.openclaw.approval` 메타데이터를 사용합니다. 승인은 안전에 민감한 상태, 결정, exec/Plugin 세부 정보를 담기 때문입니다. 두 메타데이터 키가 같은 이벤트에 모두 있으면 클라이언트는 전용 승인 렌더러를 우선해야 합니다.

## 미디어 메시지

답장에 여러 미디어 URL이 포함된 경우 OpenClaw은 미디어 URL마다 Matrix 이벤트를 하나씩 보냅니다. 클라이언트가 하나의 안정적인 구조화 페이로드를 갖고 중복 렌더러를 피할 수 있도록 프레젠테이션 메타데이터는 첫 번째 미디어 이벤트에만 첨부됩니다.

프레젠테이션 메타데이터는 간결하게 유지하세요. 사용자가 볼 수 있는 긴 텍스트는 `body`에 두고 일반 Matrix 텍스트 청킹 경로를 사용해야 합니다.
