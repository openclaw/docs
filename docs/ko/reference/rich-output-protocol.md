---
read_when:
    - Control UI에서 어시스턴트 출력 렌더링 변경하기
    - '`[embed ...]`, `MEDIA:`, reply 또는 오디오 프레젠테이션 지시어 디버깅하기'
summary: 임베드, 미디어, 오디오 힌트 및 응답을 위한 리치 출력 쇼트코드 프로토콜
title: 리치 출력 프로토콜
x-i18n:
    generated_at: "2026-04-26T11:38:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

어시스턴트 출력에는 소수의 전송/렌더링 지시어를 포함할 수 있습니다:

- 첨부 전송용 `MEDIA:`
- 오디오 표시 힌트용 `[[audio_as_voice]]`
- 응답 메타데이터용 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI 리치 렌더링용 `[embed ...]`

원격 `MEDIA:` 첨부는 공개된 `https:` URL이어야 합니다. 일반 `http:`,
loopback, link-local, private, 내부 호스트명은 첨부
지시어로 무시됩니다. 서버 측 미디어 페처는 계속 자체 네트워크 가드를 적용합니다.

이 지시어들은 서로 별개입니다. `MEDIA:`와 reply/voice 태그는 계속 전송 메타데이터이고, `[embed ...]`는 웹 전용 리치 렌더 경로입니다.
신뢰된 tool-result 미디어는 전송 전에 동일한 `MEDIA:` / `[[audio_as_voice]]` 파서를 사용하므로, 텍스트 도구 출력도 오디오 첨부를 음성 노트로 표시할 수 있습니다.

블록 스트리밍이 활성화된 경우 `MEDIA:`는 계속 한 턴에 대한 단일 전송 메타데이터로 유지됩니다.
동일한 미디어 URL이 스트리밍된 블록으로 전송되고 최종
어시스턴트 payload에서 반복되면, OpenClaw는 첨부를 한 번만 전송하고 최종 payload에서
중복 항목을 제거합니다.

## `[embed ...]`

`[embed ...]`는 Control UI용으로 agent가 사용하는 유일한 리치 렌더 구문입니다.

자체 종료 예시:

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- `[view ...]`는 새 출력에서는 더 이상 유효하지 않습니다.
- Embed 쇼트코드는 어시스턴트 메시지 화면에서만 렌더링됩니다.
- URL 기반 embed만 렌더링됩니다. `ref="..."` 또는 `url="..."`를 사용하세요.
- 블록 형식 인라인 HTML embed 쇼트코드는 렌더링되지 않습니다.
- 웹 UI는 표시 텍스트에서 쇼트코드를 제거하고 embed를 인라인으로 렌더링합니다.
- `MEDIA:`는 embed 별칭이 아니며 리치 embed 렌더링에 사용해서는 안 됩니다.

## 저장된 렌더링 형태

정규화되어 저장되는 어시스턴트 콘텐츠 블록은 구조화된 `canvas` 항목입니다:

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

저장되거나 렌더링되는 리치 블록은 이 `canvas` 형태를 직접 사용합니다. `present_view`는 인식되지 않습니다.

## 관련 항목

- [RPC adapters](/ko/reference/rpc)
- [Typebox](/ko/concepts/typebox)
