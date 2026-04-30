---
read_when:
    - WebChat 액세스 디버깅 또는 구성
summary: 루프백 WebChat 정적 호스트 및 채팅 UI용 Gateway WS 사용법
title: 웹 채팅
x-i18n:
    generated_at: "2026-04-30T06:57:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

상태: macOS/iOS SwiftUI 채팅 UI가 Gateway WebSocket과 직접 통신합니다.

## 정의

- Gateway용 네이티브 채팅 UI입니다(내장 브라우저와 로컬 정적 서버 없음).
- 다른 채널과 동일한 세션 및 라우팅 규칙을 사용합니다.
- 결정적 라우팅: 답장은 항상 WebChat으로 돌아갑니다.

## 빠른 시작

1. Gateway를 시작합니다.
2. WebChat UI(macOS/iOS 앱) 또는 Control UI 채팅 탭을 엽니다.
3. 유효한 Gateway 인증 경로가 구성되어 있는지 확인합니다(기본값은 shared-secret이며,
   루프백에서도 적용됨).

## 작동 방식(동작)

- UI는 Gateway WebSocket에 연결하고 `chat.history`, `chat.send`, `chat.inject`를 사용합니다.
- `chat.history`는 안정성을 위해 제한됩니다. Gateway는 긴 텍스트 필드를 자르고, 무거운 메타데이터를 생략하며, 지나치게 큰 항목을 `[chat.history omitted: message too large]`로 대체할 수 있습니다.
- `chat.history`는 최신 append-only 세션 파일의 활성 transcript 브랜치를 따르므로, 폐기된 rewrite 브랜치와 대체된 프롬프트 사본은 WebChat에 렌더링되지 않습니다.
- Control UI는 새 `chat.send` 실행 ID를 생성하기 전에 동일한 세션, 메시지, 첨부 파일에 대해 진행 중인 중복 제출을 병합합니다. Gateway는 여전히 동일한 멱등성 키를 재사용하는 반복 요청을 중복 제거합니다.
- `chat.history`는 표시용으로도 정규화됩니다. runtime 전용 OpenClaw 컨텍스트,
  인바운드 envelope 래퍼, `[[reply_to_*]]` 및 `[[audio_as_voice]]` 같은 인라인 전달 지시문 태그,
  일반 텍스트 tool-call XML 페이로드(`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` 및 잘린 tool-call 블록 포함), 그리고
  노출된 ASCII/전각 모델 제어 토큰이 표시 텍스트에서 제거되며,
  전체 표시 텍스트가 정확히 무음 토큰 `NO_REPLY` / `no_reply`뿐인 assistant 항목은 생략됩니다.
- reasoning 플래그가 지정된 답장 페이로드(`isReasoning: true`)는 WebChat assistant 콘텐츠, transcript 재생 텍스트, 오디오 콘텐츠 블록에서 제외되므로, 사고 전용 페이로드가 표시되는 assistant 메시지나 재생 가능한 오디오로 드러나지 않습니다.
- `chat.inject`는 assistant 메모를 transcript에 직접 추가하고 UI에 브로드캐스트합니다(agent 실행 없음).
- 중단된 실행은 부분 assistant 출력을 UI에 계속 표시할 수 있습니다.
- Gateway는 버퍼링된 출력이 있을 때 중단된 부분 assistant 텍스트를 transcript 기록에 유지하고, 해당 항목에 중단 메타데이터를 표시합니다.
- 기록은 항상 Gateway에서 가져옵니다(로컬 파일 감시 없음).
- Gateway에 연결할 수 없으면 WebChat은 읽기 전용입니다.

## Control UI agents 도구 패널

- Control UI `/agents` 도구 패널에는 두 개의 별도 보기가 있습니다.
  - **지금 사용 가능**은 `tools.effective(sessionKey=...)`를 사용하며 현재
    세션이 runtime에서 실제로 사용할 수 있는 항목을 보여줍니다. 여기에는 core, Plugin, 채널 소유 도구가 포함됩니다.
  - **도구 구성**은 `tools.catalog`를 사용하며 프로필, override,
    카탈로그 semantics에 집중합니다.
- Runtime 가용성은 세션 범위입니다. 같은 agent에서 세션을 전환하면
  **지금 사용 가능** 목록이 달라질 수 있습니다.
- 구성 편집기가 runtime 가용성을 의미하지는 않습니다. effective 접근 권한은 여전히 정책
  우선순위(`allow`/`deny`, agent별 및 provider/channel override)를 따릅니다.

## 원격 사용

- 원격 모드는 SSH/Tailscale을 통해 Gateway WebSocket을 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요가 없습니다.

## 구성 참조(WebChat)

전체 구성: [구성](/ko/gateway/configuration)

WebChat 옵션:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 응답에서 텍스트 필드의 최대 문자 수입니다. transcript 항목이 이 제한을 초과하면 Gateway는 긴 텍스트 필드를 자르고 지나치게 큰 메시지를 placeholder로 대체할 수 있습니다. 클라이언트가 단일 `chat.history` 호출에 대해 이 기본값을 override하도록 요청별 `maxChars`를 보낼 수도 있습니다.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트입니다.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket 인증입니다.
- `gateway.auth.allowTailscale`: 활성화하면 브라우저 Control UI 채팅 탭이 Tailscale
  Serve identity 헤더를 사용할 수 있습니다.
- `gateway.auth.mode: "trusted-proxy"`: identity-aware **비루프백** 프록시 소스 뒤에 있는 브라우저 클라이언트를 위한 reverse-proxy 인증입니다([신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 Gateway 대상입니다.
- `session.*`: 세션 저장소 및 기본 main key 기본값입니다.

## 관련 항목

- [Control UI](/ko/web/control-ui)
- [대시보드](/ko/web/dashboard)
