---
read_when:
    - Control UI에서 어시스턴트 출력 렌더링 변경하기
    - '`[embed ...]`, 구조화된 미디어, 답장 또는 오디오 프레젠테이션 지시문 디버깅'
summary: 구조화된 미디어, 임베드, 오디오 힌트, 답글을 위한 리치 출력 프로토콜
title: 풍부한 출력 프로토콜
x-i18n:
    generated_at: "2026-06-27T18:06:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

어시스턴트 출력은 소수의 전달/렌더링 지시문을 포함할 수 있습니다.

- 첨부 파일 전달을 위한 구조화된 `mediaUrl` / `mediaUrls` 필드
- 오디오 표시 힌트를 위한 `[[audio_as_voice]]`
- 답장 메타데이터를 위한 `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI 리치 렌더링을 위한 `[embed ...]`

원격 미디어 첨부 파일은 공개 `https:` URL이어야 합니다. 일반 `http:`,
루프백, 링크 로컬, 비공개 및 내부 호스트 이름은 첨부 파일
지시문으로 무시됩니다. 서버 측 미디어 가져오기 도구는 여전히 자체 네트워크 가드를 적용합니다.

로컬 미디어 첨부 파일은 절대 경로, 워크스페이스 상대 경로 또는
홈 상대 `~/` 경로를 사용할 수 있습니다. 전달되기 전에 여전히 에이전트 파일 읽기 정책과
미디어 유형 검사를 거칩니다.

<Warning>
도구, plugins, 스트리밍 블록, 브라우저 출력 또는 메시지 액션에서 첨부 파일용 텍스트 명령을 내보내지 마세요. 대신 구조화된 미디어 필드를 사용하세요.

유효한 메시지 도구 페이로드:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

레거시 최종 어시스턴트 응답 텍스트는 호환성을 위해 여전히 정규화될 수 있지만,
일반적인 plugin/도구 프로토콜은 아닙니다.
</Warning>

일반 Markdown 이미지 문법은 기본적으로 텍스트로 유지됩니다. Markdown 이미지 응답을 미디어 첨부 파일에 의도적으로 매핑하는 채널은
아웃바운드 어댑터에서 옵트인합니다. Telegram은 이렇게 하므로 `![alt](url)`은 여전히 미디어 응답이 될 수 있습니다.

이 지시문들은 서로 분리되어 있습니다. 구조화된 미디어 필드와 답장/음성 태그는
전달 메타데이터이며, `[embed ...]`는 웹 전용 리치 렌더링 경로입니다.

블록 스트리밍이 활성화된 경우 미디어는 구조화된 페이로드
필드에 실려야 합니다. 동일한 미디어 URL이 스트리밍된 블록에 전송되고
최종 어시스턴트 페이로드에 반복되면, OpenClaw는 첨부 파일을 한 번 전달하고
최종 페이로드에서 중복 항목을 제거합니다.

## `[embed ...]`

`[embed ...]`는 Control UI를 위한 유일한 에이전트 대상 리치 렌더링 문법입니다.

자체 닫힘 예시:

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- `[view ...]`는 새 출력에서 더 이상 유효하지 않습니다.
- Embed 쇼트코드는 어시스턴트 메시지 표면에서만 렌더링됩니다.
- URL 기반 embed만 렌더링됩니다. `ref="..."` 또는 `url="..."`를 사용하세요.
- 블록 형식 인라인 HTML embed 쇼트코드는 렌더링되지 않습니다.
- 웹 UI는 표시 텍스트에서 쇼트코드를 제거하고 embed를 인라인으로 렌더링합니다.
- 구조화된 미디어는 embed 별칭이 아니며 리치 embed 렌더링에 사용해서는 안 됩니다.

## 저장된 렌더링 형태

정규화/저장된 어시스턴트 콘텐츠 블록은 구조화된 `canvas` 항목입니다.

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
