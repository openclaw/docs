---
read_when:
    - Control UI에서 assistant 출력 렌더링 변경하기
    - '`[embed ...]`, `MEDIA:`, 답장 또는 오디오 프레젠테이션 지시문 디버깅하기'
summary: 임베드, 미디어, 오디오 힌트 및 답장을 위한 리치 출력 쇼트코드 프로토콜
title: 리치 출력 프로토콜
x-i18n:
    generated_at: "2026-04-25T06:10:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

assistant 출력은 소수의 전달/렌더링 지시문을 포함할 수 있습니다:

- 첨부파일 전달용 `MEDIA:`
- 오디오 프레젠테이션 힌트용 `[[audio_as_voice]]`
- 답장 메타데이터용 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI 리치 렌더링용 `[embed ...]`

이 지시문들은 서로 별개입니다. `MEDIA:`와 답장/음성 태그는 전달 메타데이터로 남고, `[embed ...]`는 웹 전용 리치 렌더 경로입니다.

블록 스트리밍이 활성화되면 `MEDIA:`는 여전히 한 턴에 대한 단일 전달 메타데이터로 유지됩니다. 동일한 미디어 URL이 스트리밍 블록에서 전송되고 최종 assistant payload에서 반복되면, OpenClaw는 첨부파일을 한 번만 전달하고 최종 payload에서는 중복 항목을 제거합니다.

## `[embed ...]`

`[embed ...]`는 Control UI용 에이전트 대상 리치 렌더 문법에서 유일한 형식입니다.

self-closing 예시:

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- `[view ...]`는 더 이상 새 출력에 유효하지 않습니다.
- embed 쇼트코드는 assistant 메시지 표면에서만 렌더링됩니다.
- URL 기반 embed만 렌더링됩니다. `ref="..."` 또는 `url="..."`를 사용하세요.
- block 형식 인라인 HTML embed 쇼트코드는 렌더링되지 않습니다.
- 웹 UI는 보이는 텍스트에서 쇼트코드를 제거하고 embed를 인라인으로 렌더링합니다.
- `MEDIA:`는 embed 별칭이 아니며 리치 embed 렌더링에 사용해서는 안 됩니다.

## 저장되는 렌더링 형태

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

## 관련 문서

- [RPC 어댑터](/ko/reference/rpc)
- [Typebox](/ko/concepts/typebox)
