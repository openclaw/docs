---
read_when:
    - WebChat 액세스 디버깅 또는 구성
summary: 채팅 UI를 위한 Loopback WebChat 정적 호스트 및 Gateway WS 사용법
title: 웹 채팅
x-i18n:
    generated_at: "2026-05-02T23:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

상태: macOS/iOS SwiftUI 채팅 UI는 Gateway WebSocket과 직접 통신합니다.

## 개요

- 게이트웨이를 위한 네이티브 채팅 UI입니다(임베디드 브라우저와 로컬 정적 서버 없음).
- 다른 채널과 동일한 세션 및 라우팅 규칙을 사용합니다.
- 결정적 라우팅: 응답은 항상 WebChat으로 돌아갑니다.

## 빠른 시작

1. 게이트웨이를 시작합니다.
2. WebChat UI(macOS/iOS 앱) 또는 Control UI 채팅 탭을 엽니다.
3. 유효한 게이트웨이 인증 경로가 구성되어 있는지 확인합니다(기본값은 공유 비밀이며,
   루프백에서도 동일).

## 작동 방식(동작)

- UI는 Gateway WebSocket에 연결하고 `chat.history`, `chat.send`, `chat.inject`, `chat.transcribeAudio`를 사용합니다.
- 안정성을 위해 `chat.history`에는 제한이 있습니다. Gateway는 긴 텍스트 필드를 잘라내고, 무거운 메타데이터를 생략하며, 지나치게 큰 항목을 `[chat.history omitted: message too large]`로 대체할 수 있습니다.
- `chat.history`는 최신 append-only 세션 파일의 활성 트랜스크립트 브랜치를 따르므로, 폐기된 재작성 브랜치와 대체된 프롬프트 복사본은 WebChat에 렌더링되지 않습니다.
- Control UI는 `chat.history`가 반환한 기반 Gateway `sessionId`를 기억하고 후속 `chat.send` 호출에 포함하므로, 사용자가 세션을 시작하거나 재설정하지 않는 한 재연결과 페이지 새로 고침 후에도 동일한 저장된 대화를 계속합니다.
- Control UI는 새 `chat.send` 실행 id를 생성하기 전에 같은 세션, 메시지, 첨부 파일에 대한 중복 진행 중 제출을 병합합니다. Gateway는 여전히 동일한 멱등성 키를 재사용하는 반복 요청을 중복 제거합니다.
- `chat.history`는 표시용으로도 정규화됩니다. 런타임 전용 OpenClaw 컨텍스트,
  인바운드 엔벌로프 래퍼, `[[reply_to_*]]` 및 `[[audio_as_voice]]` 같은
  인라인 전달 지시 태그, `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록을 포함한
  일반 텍스트 도구 호출 XML 페이로드, 그리고 누출된 ASCII/전각 모델 제어 토큰은
  보이는 텍스트에서 제거되며, 전체 표시 텍스트가 정확한 무음 토큰
  `NO_REPLY` / `no_reply`뿐인 어시스턴트 항목은 생략됩니다.
- 추론 플래그가 지정된 응답 페이로드(`isReasoning: true`)는 WebChat 어시스턴트 콘텐츠, 트랜스크립트 재생 텍스트, 오디오 콘텐츠 블록에서 제외되므로, 생각 전용 페이로드는 보이는 어시스턴트 메시지나 재생 가능한 오디오로 표시되지 않습니다.
- `chat.transcribeAudio`는 Control UI 채팅 작성기의 서버 측 받아쓰기를 구동합니다. 브라우저가 마이크 오디오를 녹음하여 base64로 Gateway에 보내면, Gateway가 구성된 `tools.media.audio` 파이프라인을 실행합니다. 반환된 트랜스크립트는 초안에 삽입되며, 사용자가 전송하기 전까지 에이전트 실행은 시작되지 않습니다.
- `chat.inject`는 어시스턴트 메모를 트랜스크립트에 직접 추가하고 UI에 브로드캐스트합니다(에이전트 실행 없음).
- 중단된 실행은 부분 어시스턴트 출력을 UI에 계속 표시할 수 있습니다.
- Gateway는 버퍼링된 출력이 있을 때 중단된 부분 어시스턴트 텍스트를 트랜스크립트 기록에 유지하고, 해당 항목에 중단 메타데이터를 표시합니다.
- 기록은 항상 게이트웨이에서 가져옵니다(로컬 파일 감시 없음).
- 게이트웨이에 연결할 수 없으면 WebChat은 읽기 전용입니다.

## Control UI 에이전트 도구 패널

- Control UI `/agents` 도구 패널에는 두 개의 별도 보기가 있습니다.
  - **지금 사용 가능**은 `tools.effective(sessionKey=...)`를 사용하며 현재
    세션이 런타임에 실제로 사용할 수 있는 항목을 보여줍니다. 여기에는 코어, Plugin, 채널 소유 도구가 포함됩니다.
  - **도구 구성**은 `tools.catalog`를 사용하며 프로필, 재정의,
    카탈로그 의미 체계에 집중합니다.
- 런타임 가용성은 세션 범위입니다. 같은 에이전트에서 세션을 전환하면
  **지금 사용 가능** 목록이 바뀔 수 있습니다.
- 구성 편집기가 런타임 가용성을 의미하지는 않습니다. 유효 접근 권한은 여전히 정책
  우선순위(`allow`/`deny`, 에이전트별 및 공급자/채널 재정의)를 따릅니다.

## 원격 사용

- 원격 모드는 SSH/Tailscale을 통해 게이트웨이 WebSocket을 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요가 없습니다.

## 구성 참조(WebChat)

전체 구성: [구성](/ko/gateway/configuration)

WebChat 옵션:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 응답의 텍스트 필드에 대한 최대 문자 수입니다. 트랜스크립트 항목이 이 제한을 초과하면 Gateway는 긴 텍스트 필드를 잘라내고 지나치게 큰 메시지를 자리 표시자로 대체할 수 있습니다. 클라이언트는 단일 `chat.history` 호출에 대해 이 기본값을 재정의하도록 요청별 `maxChars`도 보낼 수 있습니다.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  공유 비밀 WebSocket 인증.
- `gateway.auth.allowTailscale`: 활성화되면 브라우저 Control UI 채팅 탭이 Tailscale
  Serve ID 헤더를 사용할 수 있습니다.
- `gateway.auth.mode: "trusted-proxy"`: ID 인식 **비루프백** 프록시 소스 뒤의 브라우저 클라이언트를 위한 역방향 프록시 인증입니다([신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 게이트웨이 대상.
- `session.*`: 세션 저장소와 기본 키 기본값.

## 관련

- [Control UI](/ko/web/control-ui)
- [대시보드](/ko/web/dashboard)
