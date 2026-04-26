---
read_when:
    - WebChat 접근 디버깅 또는 구성하기
summary: 채팅 UI용 루프백 WebChat 정적 호스트 및 Gateway WS 사용
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:42:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

상태: macOS/iOS SwiftUI 채팅 UI는 Gateway WebSocket에 직접 연결됩니다.

## 개요

- Gateway용 기본 채팅 UI입니다(임베디드 브라우저 없음, 로컬 정적 서버 없음).
- 다른 채널과 동일한 세션 및 라우팅 규칙을 사용합니다.
- 결정적 라우팅: 응답은 항상 WebChat으로 돌아갑니다.

## 빠른 시작

1. Gateway를 시작합니다.
2. WebChat UI(macOS/iOS 앱) 또는 Control UI 채팅 탭을 엽니다.
3. 유효한 gateway 인증 경로가 구성되어 있는지 확인합니다(루프백에서도 기본값은 shared-secret).

## 동작 방식

- UI는 Gateway WebSocket에 연결하고 `chat.history`, `chat.send`, `chat.inject`를 사용합니다.
- `chat.history`는 안정성을 위해 제한됩니다. Gateway는 긴 텍스트 필드를 잘라내고, 무거운 메타데이터를 생략하며, 지나치게 큰 항목을 `[chat.history omitted: message too large]`로 대체할 수 있습니다.
- `chat.history`는 표시용으로도 정규화됩니다. 런타임 전용 OpenClaw 컨텍스트, 인바운드 envelope 래퍼, `[[reply_to_*]]` 및 `[[audio_as_voice]]` 같은 인라인 전달 지시 태그, 일반 텍스트 도구 호출 XML 페이로드(` <tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함), 그리고 유출된 ASCII/전각 모델 제어 토큰은 표시 텍스트에서 제거되며, 표시 가능한 전체 텍스트가 정확히 무음 토큰 `NO_REPLY` / `no_reply`뿐인 assistant 항목은 생략됩니다.
- 추론 플래그가 지정된 응답 페이로드(`isReasoning: true`)는 WebChat assistant 콘텐츠, transcript 재생 텍스트, 오디오 콘텐츠 블록에서 제외되므로, thinking 전용 페이로드가 표시 가능한 assistant 메시지나 재생 가능한 오디오로 노출되지 않습니다.
- `chat.inject`는 assistant 메모를 transcript에 직접 추가하고 이를 UI에 브로드캐스트합니다(에이전트 실행 없음).
- 중단된 실행은 UI에 부분 assistant 출력을 계속 표시할 수 있습니다.
- Gateway는 버퍼링된 출력이 있으면 중단된 부분 assistant 텍스트를 transcript 기록에 유지하고, 해당 항목에 중단 메타데이터를 표시합니다.
- 기록은 항상 gateway에서 가져옵니다(로컬 파일 감시 없음).
- gateway에 연결할 수 없으면 WebChat은 읽기 전용입니다.

## Control UI 에이전트 도구 패널

- Control UI `/agents` 도구 패널에는 두 개의 별도 보기가 있습니다.
  - **Available Right Now**는 `tools.effective(sessionKey=...)`를 사용하며 현재 세션이 런타임에 실제로 사용할 수 있는 항목을 보여줍니다. 여기에는 코어, Plugin, 채널 소유 도구가 포함됩니다.
  - **Tool Configuration**은 `tools.catalog`를 사용하며 프로필, 재정의, 카탈로그 의미 체계에 초점을 유지합니다.
- 런타임 가용성은 세션 범위입니다. 같은 에이전트에서 세션을 전환하면 **Available Right Now** 목록이 바뀔 수 있습니다.
- 구성 편집기는 런타임 가용성을 의미하지 않습니다. 실제 접근 권한은 여전히 정책 우선순위(`allow`/`deny`, 에이전트별 및 provider/채널 재정의)를 따릅니다.

## 원격 사용

- 원격 모드는 SSH/Tailscale을 통해 gateway WebSocket을 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요는 없습니다.

## 구성 참조(WebChat)

전체 구성: [구성](/ko/gateway/configuration)

WebChat 옵션:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 응답의 텍스트 필드에 대한 최대 문자 수입니다. transcript 항목이 이 제한을 초과하면 Gateway는 긴 텍스트 필드를 잘라내고, 지나치게 큰 메시지를 플레이스홀더로 대체할 수 있습니다. 클라이언트는 요청별 `maxChars`를 보내 이 기본값을 단일 `chat.history` 호출에 대해 재정의할 수도 있습니다.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket 인증.
- `gateway.auth.allowTailscale`: 브라우저 Control UI 채팅 탭은 활성화된 경우 Tailscale
  Serve ID 헤더를 사용할 수 있습니다.
- `gateway.auth.mode: "trusted-proxy"`: ID 인식 **비루프백** 프록시 소스 뒤에 있는 브라우저 클라이언트를 위한 reverse-proxy 인증([Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth) 참고).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 gateway 대상.
- `session.*`: 세션 저장소 및 기본 main 키.

## 관련 항목

- [Control UI](/ko/web/control-ui)
- [Dashboard](/ko/web/dashboard)
