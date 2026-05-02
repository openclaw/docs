---
read_when:
    - 제어 UI에서 어시스턴트 출력 렌더링 변경하기
    - '`[embed ...]`, `MEDIA:`, 답장 또는 오디오 프레젠테이션 지시문 디버깅'
summary: 임베드, 미디어, 오디오 힌트 및 답장을 위한 풍부한 출력 쇼트코드 프로토콜
title: 리치 출력 프로토콜
x-i18n:
    generated_at: "2026-05-02T22:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Assistant 출력은 작은 전달/렌더링 지시문 집합을 포함할 수 있습니다.

- 첨부 파일 전달용 `MEDIA:`
- 오디오 표시 힌트용 `[[audio_as_voice]]`
- 답장 메타데이터용 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI 리치 렌더링용 `[embed ...]`

원격 `MEDIA:` 첨부 파일은 공개 `https:` URL이어야 합니다. 일반 `http:`,
loopback, link-local, private, internal 호스트 이름은 첨부 파일
지시문으로 무시됩니다. 서버 측 미디어 페처는 여전히 자체 네트워크 가드를 적용합니다.

로컬 `MEDIA:` 첨부 파일은 절대 경로, 작업 영역 기준 상대 경로 또는
홈 기준 `~/` 경로를 사용할 수 있습니다. 전달 전에 여전히 에이전트 파일 읽기 정책과
미디어 유형 검사를 거칩니다.

일반 Markdown 이미지 문법은 기본적으로 텍스트로 유지됩니다. Markdown 이미지 답장을 의도적으로
미디어 첨부 파일로 매핑하는 채널은 아웃바운드 어댑터에서 이를 옵트인합니다.
Telegram은 이렇게 처리하므로 `![alt](url)`도 미디어 답장이 될 수 있습니다.

이 지시문들은 서로 독립적입니다. `MEDIA:` 및 답장/음성 태그는 전달 메타데이터로 유지되며, `[embed ...]`는 웹 전용 리치 렌더링 경로입니다.
신뢰할 수 있는 도구 결과 미디어는 전달 전에 동일한 `MEDIA:` / `[[audio_as_voice]]` 파서를 사용하므로, 텍스트 도구 출력도 오디오 첨부 파일을 음성 메모로 표시할 수 있습니다.

블록 스트리밍이 활성화된 경우 `MEDIA:`는 한 턴에 대해 단일 전달 메타데이터로 유지됩니다. 동일한 미디어 URL이 스트리밍된 블록에서 전송되고 최종 assistant 페이로드에서 반복되면, OpenClaw는 첨부 파일을 한 번만 전달하고 최종 페이로드에서 중복 항목을 제거합니다.

## `[embed ...]`

`[embed ...]`는 Control UI를 위한 유일한 에이전트 대상 리치 렌더링 문법입니다.

자체 닫힘 예:

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- `[view ...]`는 더 이상 새 출력에 유효하지 않습니다.
- Embed 쇼트코드는 assistant 메시지 표면에서만 렌더링됩니다.
- URL 기반 embed만 렌더링됩니다. `ref="..."` 또는 `url="..."`를 사용하세요.
- 블록 형식 인라인 HTML embed 쇼트코드는 렌더링되지 않습니다.
- 웹 UI는 표시 텍스트에서 쇼트코드를 제거하고 embed를 인라인으로 렌더링합니다.
- `MEDIA:`는 embed 별칭이 아니며 리치 embed 렌더링에 사용하면 안 됩니다.

## 저장된 렌더링 형태

정규화/저장된 assistant 콘텐츠 블록은 구조화된 `canvas` 항목입니다.

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
