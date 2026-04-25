---
read_when:
    - Control UI에서 assistant 출력 렌더링 변경
    - '`[embed ...]`, `MEDIA:`, 답글 또는 오디오 프레젠테이션 지시어 디버깅'
summary: 임베드, 미디어, 오디오 힌트 및 답글을 위한 리치 출력 shortcode 프로토콜
title: 리치 출력 프로토콜
x-i18n:
    generated_at: "2026-04-25T18:22:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e01037a8cb80c9de36effd4642701dcc86131a2b8fb236d61c687845e64189
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

assistant 출력은 소수의 전송/렌더링 지시어를 포함할 수 있습니다:

- 첨부파일 전송용 `MEDIA:`
- 오디오 프레젠테이션 힌트용 `[[audio_as_voice]]`
- 답글 메타데이터용 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI 리치 렌더링용 `[embed ...]`

이 지시어들은 서로 별개입니다. `MEDIA:`와 답글/음성 태그는 전송 메타데이터로 유지되며, `[embed ...]`는 웹 전용 리치 렌더 경로입니다.
신뢰된 tool-result 미디어는 전송 전에 동일한 `MEDIA:` / `[[audio_as_voice]]` 파서를 사용하므로, 텍스트 도구 출력도 여전히 오디오 첨부파일을 음성 노트로 표시할 수 있습니다.

block 스트리밍이 활성화된 경우에도 `MEDIA:`는 한 턴에 대한 단일 전송 메타데이터로 유지됩니다. 동일한 미디어 URL이 스트리밍된 블록에서 전송되고 최종
assistant payload에 반복되면, OpenClaw는 첨부파일을 한 번만 전송하고 최종 payload에서는 중복 항목을 제거합니다.

## `[embed ...]`

`[embed ...]`는 Control UI를 위한 유일한 agent 대상 리치 렌더 문법입니다.

self-closing 예시:

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- `[view ...]`는 새 출력에 더 이상 유효하지 않습니다.
- embed shortcode는 assistant 메시지 표면에서만 렌더링됩니다.
- URL 기반 embed만 렌더링됩니다. `ref="..."` 또는 `url="..."`를 사용하세요.
- 블록 형식 인라인 HTML embed shortcode는 렌더링되지 않습니다.
- 웹 UI는 보이는 텍스트에서 shortcode를 제거하고 embed를 인라인으로 렌더링합니다.
- `MEDIA:`는 embed 별칭이 아니며 리치 embed 렌더링에 사용해서는 안 됩니다.

## 저장된 렌더링 형태

정규화되어 저장되는 assistant 콘텐츠 블록은 구조화된 `canvas` 항목입니다:

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

## 관련

- [RPC adapters](/ko/reference/rpc)
- [Typebox](/ko/concepts/typebox)
