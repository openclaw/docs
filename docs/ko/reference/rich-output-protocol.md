---
read_when:
    - Control UI에서 어시스턴트 출력 렌더링 변경하기
    - '`[embed ...]`, 구조화된 미디어, 답장 또는 오디오 표시 지시문 디버깅'
summary: 구조화된 미디어, 임베드, 오디오 힌트 및 답장을 위한 리치 출력 프로토콜
title: 리치 출력 프로토콜
x-i18n:
    generated_at: "2026-07-12T01:10:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

어시스턴트 출력은 몇 가지 전용 채널을 통해 전송/렌더링 지시어를 전달합니다.

- 첨부 파일 전송을 위한 구조화된 `mediaUrl` / `mediaUrls` 필드.
- 오디오 표시 힌트를 위한 `[[audio_as_voice]]`.
- 답장 메타데이터를 위한 `[[reply_to_current]]` / `[[reply_to:<id>]]`.
- Control UI의 리치 렌더링을 위한 `[embed ...]`.

구조화된 미디어 필드와 `[[...]]` 태그는 전송 메타데이터입니다. `[embed ...]`는 별도의 웹 전용 리치 렌더링 경로이며 미디어 별칭이 아닙니다.

## 미디어 첨부 파일

원격 첨부 파일은 공개 `https:` URL이어야 합니다. `http:`, local loopback, 링크 로컬, 비공개 및 내부 호스트 이름은 첨부 파일 지시어로 거부되며, 서버 측 미디어 가져오기 기능은 여기에 자체 네트워크 보호 조치를 추가로 적용합니다.

로컬 첨부 파일에는 절대 경로, 작업 공간 상대 경로 또는 홈 상대 `~/` 경로를 사용할 수 있습니다. 전송되기 전에 에이전트 파일 읽기 정책과 미디어 유형 검사를 거쳐야 합니다.

<Warning>
도구, Plugin, 스트리밍 블록, 브라우저 출력 또는 메시지 작업에서 첨부 파일용 텍스트 명령을 출력하지 마세요. 대신 구조화된 미디어 필드를 사용하세요.

```json
{ "message": "이미지입니다.", "mediaUrl": "/workspace/image.png" }
```

호환성을 위해 레거시 최종 답장 텍스트가 계속 정규화될 수 있지만, 이는 일반적인 Plugin/도구 프로토콜이 아닙니다.
</Warning>

일반 Markdown 이미지 구문(`![alt](url)`)은 기본적으로 텍스트로 유지됩니다. Markdown 이미지를 미디어 답장으로 처리하려는 채널은 아웃바운드 어댑터에서 이 동작을 활성화합니다. Telegram은 이를 활성화하므로 `![alt](url)`이 미디어 첨부 파일로 변환됩니다.

블록 스트리밍이 활성화된 경우 미디어는 구조화된 페이로드 필드를 통해 전달되어야 합니다. 동일한 미디어 URL이 스트리밍된 블록과 최종 어시스턴트 페이로드에 다시 나타나면 OpenClaw는 이를 한 번만 전송하고 최종 페이로드에서 중복 항목을 제거합니다.

## `[embed ...]`

`[embed ...]`는 Control UI에서 에이전트가 사용할 수 있는 유일한 리치 렌더링 구문입니다. 자체 닫힘 예시는 다음과 같습니다.

```text
[embed ref="cv_123" title="Status" /]
```

규칙:

- 새 출력에는 더 이상 `[view ...]`를 사용할 수 없습니다.
- 임베드 쇼트코드는 어시스턴트 메시지 영역에서만 렌더링됩니다.
- URL 기반 임베드만 렌더링됩니다. `ref="..."` 또는 `url="..."`을 사용하세요.
- 블록 형식의 인라인 HTML 임베드 쇼트코드는 렌더링되지 않습니다.
- 웹 UI는 표시되는 텍스트에서 쇼트코드를 제거하고 임베드를 인라인으로 렌더링합니다.

## 저장된 렌더링 형식

정규화되어 저장된 어시스턴트 콘텐츠 블록은 구조화된 `canvas` 항목입니다.

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

`present_view`는 인식되지 않습니다. 저장되거나 렌더링되는 리치 블록은 항상 이 `canvas` 형식을 사용합니다.

## 관련 문서

- [RPC 어댑터](/ko/reference/rpc)
- [Typebox](/ko/concepts/typebox)
