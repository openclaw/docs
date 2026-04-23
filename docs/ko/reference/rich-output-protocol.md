---
read_when:
    - Control UI에서 assistant 출력 렌더링을 변경하는 중입니다
    - '`[embed ...]`, `MEDIA:`, 답글 또는 오디오 프레젠테이션 지시어를 디버깅하는 중입니다'
summary: 임베드, 미디어, 오디오 힌트 및 답글을 위한 리치 출력 shortcode 프로토콜
title: 리치 출력 프로토콜
x-i18n:
    generated_at: "2026-04-23T14:08:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# 리치 출력 프로토콜

assistant 출력은 소수의 전송/렌더링 지시어를 포함할 수 있습니다:

- 첨부 파일 전송용 `MEDIA:`
- 오디오 프레젠테이션 힌트용 `[[audio_as_voice]]`
- 답글 메타데이터용 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI 리치 렌더링용 `[embed ...]`

이 지시어들은 서로 별개입니다. `MEDIA:`와 reply/voice 태그는 전송 메타데이터로 남고, `[embed ...]`는 웹 전용 리치 렌더 경로입니다.

## `[embed ...]`

`[embed ...]`는 Control UI를 위한 유일한 에이전트 대상 리치 렌더 문법입니다.

self-closing 예시:

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- `[view ...]`는 더 이상 새 출력에 대해 유효하지 않습니다.
- embed shortcode는 assistant 메시지 표면에서만 렌더링됩니다.
- URL 기반 embed만 렌더링됩니다. `ref="..."` 또는 `url="..."`를 사용하세요.
- block 형식의 inline HTML embed shortcode는 렌더링되지 않습니다.
- 웹 UI는 표시 텍스트에서 shortcode를 제거하고 embed를 인라인으로 렌더링합니다.
- `MEDIA:`는 embed 별칭이 아니며 리치 embed 렌더링에 사용해서는 안 됩니다.

## 저장된 렌더링 형태

정규화/저장된 assistant content block은 구조화된 `canvas` 항목입니다:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

저장/렌더링되는 리치 블록은 이 `canvas` 형태를 직접 사용합니다. `present_view`는 인식되지 않습니다.
