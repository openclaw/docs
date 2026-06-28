---
read_when:
    - macOS Canvas 패널 구현하기
    - 시각적 작업 공간을 위한 에이전트 제어 추가
    - WKWebView canvas 로드 디버깅
summary: 에이전트가 제어하는 Canvas 패널이 WKWebView + 사용자 지정 URL 스킴을 통해 임베드됨
title: 캔버스
x-i18n:
    generated_at: "2026-06-28T00:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS 앱은 `WKWebView`를 사용해 에이전트가 제어하는 **Canvas 패널**을 내장합니다. 이는 HTML/CSS/JS, A2UI, 작은 인터랙티브 UI 표면을 위한 가벼운 시각적 작업 공간입니다.

## Canvas가 위치하는 곳

Canvas 상태는 Application Support 아래에 저장됩니다.

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 패널은 **사용자 지정 URL 스킴**을 통해 해당 파일을 제공합니다.

- `openclaw-canvas://<session>/<path>`

예시:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

루트에 `index.html`이 없으면 앱은 **내장 스캐폴드 페이지**를 표시합니다.

## 패널 동작

- 메뉴 막대(또는 마우스 커서) 근처에 고정되는 테두리 없는 크기 조절 가능 패널입니다.
- 세션별로 크기/위치를 기억합니다.
- 로컬 canvas 파일이 변경되면 자동으로 다시 로드합니다.
- 한 번에 하나의 Canvas 패널만 표시됩니다(필요에 따라 세션이 전환됨).

Canvas는 Settings → **Allow Canvas**에서 비활성화할 수 있습니다. 비활성화되면 canvas 노드 명령은 `CANVAS_DISABLED`를 반환합니다.

## 에이전트 API 표면

Canvas는 **Gateway WebSocket**을 통해 노출되므로 에이전트는 다음을 수행할 수 있습니다.

- 패널 표시/숨기기
- 경로 또는 URL로 이동
- JavaScript 평가
- 스냅샷 이미지 캡처

CLI 예시:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

참고:

- `canvas.navigate`는 **로컬 canvas 경로**, `http(s)` URL, `file://` URL을 허용합니다.
- `"/"`를 전달하면 Canvas는 로컬 스캐폴드 또는 `index.html`을 표시합니다.

## Canvas의 A2UI

A2UI는 Gateway canvas 호스트에서 호스팅되며 Canvas 패널 안에서 렌더링됩니다.
Gateway가 Canvas 호스트를 알리면 macOS 앱은 처음 열 때 A2UI 호스트 페이지로 자동 이동합니다.

기본 A2UI 호스트 URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI 명령(v0.8)

Canvas는 현재 **A2UI v0.8** 서버→클라이언트 메시지를 허용합니다.

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface`(v0.9)는 지원되지 않습니다.

CLI 예시:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

간단한 스모크 테스트:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas에서 에이전트 실행 트리거하기

Canvas는 딥 링크를 통해 새 에이전트 실행을 트리거할 수 있습니다.

- `openclaw://agent?...`

예시(JS에서):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

지원되는 쿼리 매개변수:

- `message`: 미리 채워진 에이전트 프롬프트.
- `sessionKey`: 안정적인 세션 식별자.
- `thinking`: 선택적 thinking 프로필.
- `deliver`, `to` 또는 `channel`: 전달 대상.
- `timeoutSeconds`: 선택적 실행 제한 시간.
- `key`: 신뢰할 수 있는 로컬 호출자를 위한 앱 생성 안전 토큰.

유효한 키가 제공되지 않으면 앱이 확인을 요청합니다. 키가 없는 링크는 승인 전에 메시지와 URL을 표시하고 전달 라우팅 필드를 무시합니다. 키가 있는 링크는 일반 Gateway 실행 경로를 사용합니다.

## 보안 참고 사항

- Canvas 스킴은 디렉터리 순회를 차단합니다. 파일은 세션 루트 아래에 있어야 합니다.
- 로컬 Canvas 콘텐츠는 사용자 지정 스킴을 사용합니다(루프백 서버가 필요 없음).
- 외부 `http(s)` URL은 명시적으로 이동한 경우에만 허용됩니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [WebChat](/ko/web/webchat)
