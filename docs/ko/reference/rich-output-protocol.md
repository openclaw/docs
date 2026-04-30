---
read_when:
    - Control UI에서 어시스턴트 출력 렌더링 변경하기
    - '`[embed ...]`, `MEDIA:`, 응답 또는 오디오 프레젠테이션 지시문 디버깅'
summary: 임베드, 미디어, 오디오 힌트 및 답글을 위한 리치 출력 숏코드 프로토콜
title: 풍부한 출력 프로토콜
x-i18n:
    generated_at: "2026-04-30T06:49:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

어시스턴트 출력은 작은 전달/렌더링 지시어 집합을 포함할 수 있습니다:

- `MEDIA:`: 첨부 파일 전달
- `[[audio_as_voice]]`: 오디오 표시 힌트
- `[[reply_to_current]]` / `[[reply_to:<id>]]`: 답장 메타데이터
- `[embed ...]`: Control UI 리치 렌더링

원격 `MEDIA:` 첨부 파일은 공개 `https:` URL이어야 합니다. 일반 `http:`,
루프백, 링크-로컬, 비공개 및 내부 호스트 이름은 첨부 파일
지시어로 무시됩니다. 서버 측 미디어 fetcher는 여전히 자체 네트워크 가드를 적용합니다.

일반 Markdown 이미지 문법은 기본적으로 텍스트로 유지됩니다. Markdown 이미지 답장을 의도적으로
미디어 첨부 파일에 매핑하는 채널은 아웃바운드
어댑터에서 옵트인합니다. Telegram은 이를 수행하므로 `![alt](url)`도 여전히 미디어 답장이 될 수 있습니다.

이 지시어들은 서로 별개입니다. `MEDIA:`와 답장/음성 태그는 전달 메타데이터로 유지되며, `[embed ...]`는 웹 전용 리치 렌더링 경로입니다.
신뢰된 도구 결과 미디어는 전달 전에 동일한 `MEDIA:` / `[[audio_as_voice]]` 파서를 사용하므로, 텍스트 도구 출력도 오디오 첨부 파일을 음성 메모로 표시할 수 있습니다.

블록 스트리밍이 활성화된 경우 `MEDIA:`는 한 턴에 대해 단일 전달 메타데이터로 유지됩니다. 동일한 미디어 URL이 스트리밍된 블록에서 전송되고 최종
어시스턴트 페이로드에서 반복되면, OpenClaw는 첨부 파일을 한 번만 전달하고 최종 페이로드에서 중복을 제거합니다.

## `[embed ...]`

`[embed ...]`는 Control UI를 위한 유일한 에이전트 대상 리치 렌더링 문법입니다.

자체 닫힘 예시:

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- `[view ...]`는 새 출력에 더 이상 유효하지 않습니다.
- Embed 쇼트코드는 어시스턴트 메시지 화면에서만 렌더링됩니다.
- URL 기반 embed만 렌더링됩니다. `ref="..."` 또는 `url="..."`를 사용하세요.
- 블록 형식의 인라인 HTML embed 쇼트코드는 렌더링되지 않습니다.
- 웹 UI는 표시 텍스트에서 쇼트코드를 제거하고 embed를 인라인으로 렌더링합니다.
- `MEDIA:`는 embed 별칭이 아니며 리치 embed 렌더링에 사용하면 안 됩니다.

## 저장된 렌더링 형태

정규화/저장된 어시스턴트 콘텐츠 블록은 구조화된 `canvas` 항목입니다:

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

저장/렌더링된 리치 블록은 이 `canvas` 형태를 직접 사용합니다. `present_view`는 인식되지 않습니다.

## 관련 항목

- [RPC 어댑터](/ko/reference/rpc)
- [Typebox](/ko/concepts/typebox)
