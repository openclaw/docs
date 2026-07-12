---
read_when:
    - macOS Canvas 패널 구현하기
    - 시각적 작업 공간을 위한 에이전트 제어 기능 추가
    - WKWebView 캔버스 로드 디버깅
summary: WKWebView + 사용자 지정 URL 스킴을 통해 임베드된 에이전트 제어 Canvas 패널
title: 캔버스
x-i18n:
    generated_at: "2026-07-12T15:24:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS 앱에는 에이전트가 제어하는 **Canvas 패널**이 `WKWebView`를 사용하여 내장되어 있으며,
HTML/CSS/JS, A2UI 및 소규모 대화형 UI 화면을 위한
경량 시각적 작업 공간을 제공합니다.

## Canvas 위치

Canvas 상태는 Application Support 아래에 저장됩니다.

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 패널은 사용자 지정 URL 스킴
`openclaw-canvas://<session>/<path>`을 통해 해당 파일을 제공합니다.

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

루트에 `index.html`이 없으면 앱에서 기본 제공 스캐폴드 페이지를 표시합니다.

## 패널 동작

- 메뉴 막대(또는 마우스 커서) 근처에 고정되는 테두리 없는 크기 조절 가능 패널입니다.
- 세션별 크기와 위치를 기억합니다.
- 로컬 Canvas 파일이 변경되면 자동으로 다시 로드합니다.
- 한 번에 하나의 Canvas 패널만 표시됩니다(필요에 따라 세션을 전환합니다).

Settings -> **Allow Canvas**에서 Canvas를 비활성화할 수 있습니다. 비활성화하면
Canvas Node 명령이 `CANVAS_DISABLED`를 반환합니다.

## 에이전트 API 화면

Canvas는 Gateway WebSocket을 통해 노출되므로 에이전트가 패널을 표시하거나 숨기고,
경로나 URL로 이동하며, JavaScript를 평가하고, 스냅샷 이미지를
캡처할 수 있습니다.

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate`는 로컬 Canvas 경로, `http(s)` URL 및 `file://`
URL을 허용합니다. `"/"`을 전달하면 로컬 스캐폴드 또는 `index.html`을 표시합니다.

`/__openclaw__/canvas/` 및
`/__openclaw__/a2ui/` 아래의 Gateway 호스팅 대상은 Node 세션의 현재 범위 지정
Canvas URL을 통해 확인됩니다. 앱은 이동 전에 해당 단기 기능을 갱신하므로
기능 URL을 직접 구성하거나 복사할 필요가 없습니다.

## Canvas의 A2UI

A2UI는 Gateway Canvas 호스트에서 호스팅되며 Canvas
패널 내부에서 렌더링됩니다. Gateway가 Canvas 호스트를 알리면 macOS 앱은 처음 열 때
A2UI 호스트 페이지로 자동 이동합니다.

알려진 URL은 기능 범위가 지정되어 있으며, 예를 들면
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`입니다.
이를 안정적인 링크가 아니라 임시 자격 증명으로 취급하십시오.

### A2UI 명령(v0.8)

Canvas는 A2UI v0.8 서버-클라이언트 메시지인 `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`를 허용합니다. `createSurface`(v0.9)는
아직 지원되지 않습니다.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"이 문장을 읽을 수 있다면 A2UI 푸시가 작동하는 것입니다."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

빠른 스모크 테스트:

```bash
openclaw nodes canvas a2ui push --node <id> --text "A2UI에서 보내는 안녕하세요"
```

## Canvas에서 에이전트 실행 트리거하기

Canvas는 `openclaw://agent?...` 딥 링크를 통해 새 에이전트 실행을 트리거할 수 있습니다.

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

지원되는 쿼리 매개변수:

| 매개변수                   | 의미                                                  |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | 미리 입력된 에이전트 프롬프트입니다.                  |
| `sessionKey`               | 안정적인 세션 식별자입니다.                           |
| `thinking`                 | 선택적 사고 프로필입니다.                             |
| `deliver`, `to`, `channel` | 전달 대상입니다.                                      |
| `timeoutSeconds`           | 선택적 실행 제한 시간입니다.                          |
| `key`                      | 신뢰할 수 있는 로컬 호출자를 위해 앱에서 생성한 안전 토큰입니다. |

유효한 키가 제공되지 않으면 앱에서 확인을 요청합니다. 키가 없는
링크는 승인 전에 메시지와 URL을 표시하고 전달 라우팅
필드를 무시하며, 키가 있는 링크는 일반 Gateway 실행 경로를 사용합니다.

## 보안 참고 사항

- Canvas 스킴은 디렉터리 순회를 차단하며, 파일은 세션 루트 아래에 있어야 합니다.
- 로컬 Canvas 콘텐츠는 사용자 지정 스킴을 사용합니다(루프백 서버가 필요하지 않습니다).
- 외부 `http(s)` URL은 명시적으로 이동한 경우에만 허용됩니다.
- 일반 웹 페이지는 렌더링 전용입니다. 에이전트 작업은 앱이 소유한
  Canvas 스킴 또는 앱이 선택한 정확한 기능 범위 지정 Gateway A2UI 문서에서만
  허용되며, 하위 프레임, 리디렉션, 만료된 기능 및 변경된
  쿼리는 작업을 디스패치할 수 없습니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [WebChat](/ko/web/webchat)
