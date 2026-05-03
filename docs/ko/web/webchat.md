---
read_when:
    - 웹 채팅 액세스 디버깅 또는 구성
summary: 채팅 UI를 위한 Loopback WebChat 정적 호스트 및 Gateway WS 사용법
title: 웹 채팅
x-i18n:
    generated_at: "2026-05-03T06:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

상태: macOS/iOS SwiftUI 채팅 UI는 Gateway WebSocket과 직접 통신합니다.

## 개요

- 게이트웨이를 위한 네이티브 채팅 UI입니다(임베디드 브라우저와 로컬 정적 서버 없음).
- 다른 채널과 동일한 세션 및 라우팅 규칙을 사용합니다.
- 결정적 라우팅: 답장은 항상 WebChat으로 돌아갑니다.

## 빠른 시작

1. 게이트웨이를 시작합니다.
2. WebChat UI(macOS/iOS 앱) 또는 Control UI 채팅 탭을 엽니다.
3. 유효한 게이트웨이 인증 경로가 구성되어 있는지 확인합니다(기본값은 shared-secret,
   loopback에서도 동일).

## 작동 방식(동작)

- UI는 Gateway WebSocket에 연결하고 `chat.history`, `chat.send`, `chat.inject`를 사용합니다.
- `chat.history`는 안정성을 위해 제한됩니다. Gateway는 긴 텍스트 필드를 잘라내고, 무거운 메타데이터를 생략하며, 너무 큰 항목을 `[chat.history omitted: message too large]`로 대체할 수 있습니다.
- `chat.history`는 최신 append-only 세션 파일의 활성 transcript 브랜치를 따르므로, 폐기된 rewrite 브랜치와 대체된 prompt 복사본은 WebChat에 렌더링되지 않습니다.
- Compaction 항목은 명시적인 압축된 기록 구분선으로 렌더링됩니다. 구분선은 이전 턴이 체크포인트에 보존되어 있음을 설명하고, 권한이 허용되는 경우 운영자가 Compaction 이전 보기로 브랜치하거나 복원할 수 있는 Sessions 체크포인트 컨트롤로 연결합니다.
- Control UI는 `chat.history`가 반환한 백킹 Gateway `sessionId`를 기억하고 후속 `chat.send` 호출에 포함하므로, 사용자가 세션을 시작하거나 재설정하지 않는 한 재연결 및 페이지 새로고침 후에도 동일한 저장 대화가 계속됩니다.
- Control UI는 새 `chat.send` 실행 id를 생성하기 전에 동일한 세션, 메시지, 첨부 파일에 대한 중복 진행 중 제출을 병합합니다. Gateway는 동일한 idempotency key를 재사용하는 반복 요청도 계속 중복 제거합니다.
- `chat.history`는 표시용으로도 정규화됩니다. 런타임 전용 OpenClaw 컨텍스트,
  인바운드 envelope 래퍼, `[[reply_to_*]]` 및 `[[audio_as_voice]]` 같은
  인라인 전달 지시 태그, 일반 텍스트 tool-call XML payload
  (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` 및 잘린 tool-call 블록 포함), 그리고
  누출된 ASCII/전각 모델 제어 토큰은 표시 텍스트에서 제거되며,
  전체 표시 텍스트가 정확한 silent token `NO_REPLY` / `no_reply`뿐인
  assistant 항목은 생략됩니다.
- Reasoning 플래그가 지정된 reply payload(`isReasoning: true`)는 WebChat assistant 콘텐츠, transcript replay 텍스트, 오디오 콘텐츠 블록에서 제외되므로, thinking-only payload는 표시되는 assistant 메시지나 재생 가능한 오디오로 노출되지 않습니다.
- `chat.inject`는 assistant note를 transcript에 직접 추가하고 UI로 브로드캐스트합니다(agent 실행 없음).
- 중단된 실행은 부분 assistant 출력을 UI에 계속 표시할 수 있습니다.
- Gateway는 버퍼링된 출력이 있을 때 중단된 부분 assistant 텍스트를 transcript 기록에 유지하고, 해당 항목에 중단 메타데이터를 표시합니다.
- 기록은 항상 게이트웨이에서 가져옵니다(로컬 파일 감시 없음).
- 게이트웨이에 연결할 수 없으면 WebChat은 읽기 전용입니다.

## Control UI agents tools 패널

- Control UI `/agents` Tools 패널에는 두 개의 별도 보기가 있습니다.
  - **지금 사용 가능**은 `tools.effective(sessionKey=...)`를 사용하며 현재
    세션이 런타임에 실제로 사용할 수 있는 core, plugin, channel-owned 도구를 보여줍니다.
  - **도구 구성**은 `tools.catalog`를 사용하며 profiles, overrides,
    catalog semantics에 집중합니다.
- 런타임 가용성은 세션 범위입니다. 동일한 agent에서 세션을 전환하면
  **지금 사용 가능** 목록이 바뀔 수 있습니다.
- config editor는 런타임 가용성을 의미하지 않습니다. effective access는 여전히 policy
  precedence(`allow`/`deny`, per-agent 및 provider/channel overrides)를 따릅니다.

## 원격 사용

- 원격 모드는 SSH/Tailscale을 통해 gateway WebSocket을 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요가 없습니다.

## 구성 참조(WebChat)

전체 구성: [구성](/ko/gateway/configuration)

WebChat 옵션:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 응답의 텍스트 필드에 대한 최대 문자 수입니다. transcript 항목이 이 제한을 초과하면 Gateway는 긴 텍스트 필드를 잘라내고 너무 큰 메시지를 placeholder로 대체할 수 있습니다. 클라이언트는 단일 `chat.history` 호출에서 이 기본값을 재정의하기 위해 요청별 `maxChars`도 보낼 수 있습니다.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket 인증.
- `gateway.auth.allowTailscale`: 활성화된 경우 브라우저 Control UI 채팅 탭이 Tailscale
  Serve identity headers를 사용할 수 있습니다.
- `gateway.auth.mode: "trusted-proxy"`: identity-aware **non-loopback** 프록시 소스 뒤의 브라우저 클라이언트를 위한 reverse-proxy 인증([Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth) 참조).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 게이트웨이 대상.
- `session.*`: 세션 저장소 및 main key 기본값.

## 관련 항목

- [Control UI](/ko/web/control-ui)
- [Dashboard](/ko/web/dashboard)
