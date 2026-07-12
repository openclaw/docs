---
read_when:
    - 웹 채팅 내에 대화형 결과를 렌더링할 에이전트가 필요합니다.
    - show_widget 입력, 보안 또는 보존 계약이 필요합니다
sidebarTitle: Show widget
summary: 웹 채팅에서 독립 실행형 SVG 또는 HTML 위젯을 인라인으로 렌더링합니다
title: 위젯 표시
x-i18n:
    generated_at: "2026-07-12T01:16:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget`은 Control UI 채팅 대화 기록에 자체 완결형 SVG 또는 HTML 조각을 인라인으로 렌더링합니다. 번들 Canvas Plugin이 이 도구를 소유하며 각 결과를 동일 출처의 Canvas 문서로 호스팅합니다.

이 도구는 요청을 시작한 Gateway 클라이언트가 `inline-widgets` 기능을 선언한 경우에만 사용할 수 있습니다. Control UI는 이 기능을 자동으로 선언합니다. Telegram 및 WhatsApp과 같은 채널 실행에는 `show_widget`이 제공되지 않습니다.

기능 전송은 임베디드, Codex 앱 서버 및 CLI 기반 모델 백엔드를 지원합니다. 권한 부여로 인증된 MCP 호출자와 직접 HTTP 도구 호출자는 클라이언트 기능을 선언하지 않으므로 계속 실패 시 차단됩니다.

## 도구 사용

에이전트는 두 개의 필수 문자열을 제공합니다.

<ParamField path="title" type="string" required>
  인라인 미리보기와 호스팅된 문서 제목에 표시되는 짧은 제목입니다.
</ParamField>

<ParamField path="widget_code" type="string" required>
  자체 완결형 SVG 또는 HTML 조각입니다. 공백을 제거한 후 `<svg`로 시작하는 입력은 SVG 모드로 렌더링되며, 그 외의 모든 입력은 HTML 조각으로 처리됩니다. 최대 길이: 262,144자.
</ParamField>

도구 결과에는 Canvas 미리보기 핸들이 포함되므로 웹 채팅은 도구 호출에서 위젯을 직접 렌더링하고 기록을 다시 불러온 후에도 이를 복원합니다. 미리보기를 렌더링하지 않는 대화 기록에도 호스팅된 Canvas 경로는 계속 표시됩니다.

## 보안 및 저장소

위젯 문서는 제한적인 콘텐츠 보안 정책을 사용합니다. 인라인 스타일과 스크립트는 허용되고, 이미지는 `data:` URL을 사용할 수 있으며, 외부 가져오기와 리소스 로드는 차단됩니다. 모든 마크업, 스타일, 스크립트 및 이미지 데이터를 `widget_code` 내부에 포함하세요.

Control UI의 전역 임베드 모드가 `trusted`인 경우에도 iframe은 항상 `allow-same-origin`을 생략하므로 위젯 스크립트가 상위 애플리케이션 출처를 읽을 수 없습니다. Canvas 호스트도 `Content-Security-Policy: sandbox allow-scripts` 응답 헤더와 함께 위젯 문서를 제공하므로, 호스팅된 URL을 직접 열어도 위젯은 Control UI 출처가 아닌 불투명 출처에서 실행됩니다. 브라우저 샌드박스는 스크립트가 자체 iframe을 탐색하는 것을 방지하지 않습니다. 해당 격리 프레임에서 실행해도 되는 위젯 코드만 렌더링하세요.

iframe은 [`gateway.controlUi.embedSandbox`](/ko/web/control-ui#hosted-embeds)도 따릅니다. 기본 `scripts` 계층은 출처 격리를 유지하면서 대화형 위젯을 지원합니다.

Canvas는 세션당 최대 32개의 위젯을 유지합니다(세션을 사용할 수 없는 경우 에이전트당 최대 32개). 위젯을 추가로 생성하면 해당 범위에서 가장 오래된 문서가 제거됩니다.

## 관련 항목

- [Control UI 호스팅 임베드](/ko/web/control-ui#hosted-embeds)
- [Canvas Plugin](/ko/plugins/reference/canvas)
- [Gateway 프로토콜 클라이언트 기능](/ko/gateway/protocol#client-capabilities)
