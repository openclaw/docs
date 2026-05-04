---
read_when:
    - WebChat 액세스 디버깅 또는 구성
summary: 채팅 UI용 루프백 WebChat 정적 호스트 및 Gateway WS 사용
title: 웹 채팅
x-i18n:
    generated_at: "2026-05-04T02:26:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

상태: macOS/iOS SwiftUI 채팅 UI는 Gateway WebSocket과 직접 통신합니다.

## 정의

- 게이트웨이를 위한 네이티브 채팅 UI입니다(내장 브라우저와 로컬 정적 서버 없음).
- 다른 채널과 동일한 세션 및 라우팅 규칙을 사용합니다.
- 결정적 라우팅: 응답은 항상 WebChat으로 돌아갑니다.

## 빠른 시작

1. 게이트웨이를 시작합니다.
2. WebChat UI(macOS/iOS 앱) 또는 Control UI 채팅 탭을 엽니다.
3. 유효한 게이트웨이 인증 경로가 구성되어 있는지 확인합니다(기본값은 공유 비밀이며,
   루프백에서도 동일).

## 작동 방식(동작)

- UI는 Gateway WebSocket에 연결하고 `chat.history`, `chat.send`, `chat.inject`를 사용합니다.
- `chat.history`는 안정성을 위해 제한됩니다. Gateway는 긴 텍스트 필드를 잘라내거나, 무거운 메타데이터를 생략하거나, 너무 큰 항목을 `[chat.history omitted: message too large]`로 대체할 수 있습니다.
- `chat.history`는 최신 추가 전용 세션 파일의 활성 트랜스크립트 분기를 따르므로, 버려진 재작성 분기와 대체된 프롬프트 복사본은 WebChat에 렌더링되지 않습니다.
- Compaction 항목은 명시적인 압축된 기록 구분선으로 렌더링됩니다. 이 구분선은 이전 턴이 체크포인트에 보존되어 있음을 설명하고 Sessions 체크포인트 컨트롤로 연결합니다. 운영자는 권한이 허용하는 경우 여기에서 Compaction 이전 보기를 분기하거나 복원할 수 있습니다.
- Control UI는 `chat.history`가 반환한 백엔드 Gateway `sessionId`를 기억하고 후속 `chat.send` 호출에 포함하므로, 사용자가 세션을 시작하거나 재설정하지 않는 한 재연결 및 페이지 새로고침 후에도 동일하게 저장된 대화가 계속됩니다.
- Control UI는 새 `chat.send` 실행 ID를 생성하기 전에 동일한 세션, 메시지, 첨부 파일에 대한 중복 진행 중 제출을 병합합니다. Gateway는 여전히 동일한 멱등성 키를 재사용하는 반복 요청을 중복 제거합니다.
- 워크스페이스 시작 파일과 대기 중인 `BOOTSTRAP.md` 지침은 WebChat 사용자 메시지에 복사되지 않고 에이전트 시스템 프롬프트의 Project Context를 통해 제공됩니다. 부트스트랩 잘림은 간결한 시스템 프롬프트 복구 알림만 추가하며, 상세 개수와 구성 조정값은 진단 화면에 유지됩니다.
- `chat.history`는 표시용으로도 정규화됩니다. 런타임 전용 OpenClaw 컨텍스트,
  인바운드 봉투 래퍼, `[[reply_to_*]]` 및 `[[audio_as_voice]]` 같은 인라인 전달 지시문 태그,
  일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함),
  그리고 유출된 ASCII/전각 모델 제어 토큰은 보이는 텍스트에서 제거되며,
  전체 보이는 텍스트가 정확히 무음 토큰 `NO_REPLY` / `no_reply`뿐인 어시스턴트 항목은 생략됩니다.
- 추론으로 표시된 응답 페이로드(`isReasoning: true`)는 WebChat 어시스턴트 콘텐츠, 트랜스크립트 재생 텍스트, 오디오 콘텐츠 블록에서 제외되므로, 사고 전용 페이로드가 보이는 어시스턴트 메시지나 재생 가능한 오디오로 표시되지 않습니다.
- `chat.inject`는 어시스턴트 메모를 트랜스크립트에 직접 추가하고 UI로 브로드캐스트합니다(에이전트 실행 없음).
- 중단된 실행은 부분 어시스턴트 출력을 UI에 계속 표시할 수 있습니다.
- Gateway는 버퍼링된 출력이 있을 때 중단된 부분 어시스턴트 텍스트를 트랜스크립트 기록에 저장하고, 해당 항목에 중단 메타데이터를 표시합니다.
- 기록은 항상 게이트웨이에서 가져옵니다(로컬 파일 감시 없음).
- 게이트웨이에 연결할 수 없으면 WebChat은 읽기 전용입니다.

### 트랜스크립트 및 전달 모델

WebChat에는 두 개의 별도 데이터 경로가 있습니다.

- 세션 JSONL 파일은 지속성 있는 모델/런타임 트랜스크립트입니다. 일반 에이전트 실행의 경우 Pi는 세션 관리자를 통해 모델에 보이는 `user`, `assistant`, `toolResult` 메시지를 저장합니다. WebChat은 임의의 전달, 상태 또는 보조 텍스트를 해당 트랜스크립트에 쓰지 않습니다.
- Gateway `ReplyPayload` 이벤트는 실시간 전달 투영입니다. WebChat/채널 표시, 블록 스트리밍, 지시문 태그, 미디어 임베딩, TTS/오디오 플래그, UI 폴백 동작에 맞게 정규화될 수 있습니다. 이것들 자체가 표준 세션 로그는 아닙니다.
- WebChat은 Gateway가 일반 Pi 어시스턴트 턴 밖에서 표시된 메시지를 소유할 때만 어시스턴트 트랜스크립트 항목을 삽입합니다. `chat.inject`, 비에이전트 명령 응답, 중단된 부분 출력, WebChat 관리 미디어 트랜스크립트 보충 항목이 이에 해당합니다.
- `chat.history`는 저장된 세션 트랜스크립트를 읽고 WebChat 표시 투영을 적용합니다. 실행 중 실시간 어시스턴트 텍스트가 나타났지만 기록 재로드 후 사라진 경우, 먼저 원시 JSONL에 어시스턴트 텍스트가 있는지 확인하고, 그다음 `chat.history` 투영이 이를 제거했는지 확인한 뒤, Control UI 낙관적 꼬리 병합이 로컬 전달 상태를 저장된 스냅샷으로 대체했는지 확인합니다.

일반 에이전트 실행 최종 답변은 Pi가 어시스턴트 `message_end`를 기록하므로 지속되어야 합니다. 전달된 최종 페이로드를 트랜스크립트에 미러링하는 폴백은 먼저 Pi가 이미 기록한 어시스턴트 턴을 중복하지 않아야 합니다.

## Control UI 에이전트 도구 패널

- Control UI `/agents` Tools 패널에는 두 개의 별도 보기가 있습니다.
  - **지금 사용 가능**은 `tools.effective(sessionKey=...)`를 사용하며, 현재
    세션이 런타임에서 실제로 사용할 수 있는 항목을 표시합니다. 여기에는 코어, Plugin, 채널 소유 도구가 포함됩니다.
  - **도구 구성**은 `tools.catalog`를 사용하며 프로필, 재정의, 카탈로그 의미 체계에 집중합니다.
- 런타임 가용성은 세션 범위입니다. 같은 에이전트에서 세션을 전환하면
  **지금 사용 가능** 목록이 바뀔 수 있습니다.
- 구성 편집기는 런타임 가용성을 의미하지 않습니다. 유효 접근은 여전히 정책
  우선순위(`allow`/`deny`, 에이전트별 및 제공자/채널 재정의)를 따릅니다.

## 원격 사용

- 원격 모드는 SSH/Tailscale을 통해 게이트웨이 WebSocket을 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요가 없습니다.

## 구성 참조(WebChat)

전체 구성: [구성](/ko/gateway/configuration)

WebChat 옵션:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` 응답에서 텍스트 필드의 최대 문자 수입니다. 트랜스크립트 항목이 이 제한을 초과하면 Gateway는 긴 텍스트 필드를 잘라내고 너무 큰 메시지를 플레이스홀더로 대체할 수 있습니다. 클라이언트는 단일 `chat.history` 호출에 대해 이 기본값을 재정의하도록 요청별 `maxChars`를 보낼 수도 있습니다.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  공유 비밀 WebSocket 인증.
- `gateway.auth.allowTailscale`: 활성화하면 브라우저 Control UI 채팅 탭이 Tailscale
  Serve ID 헤더를 사용할 수 있습니다.
- `gateway.auth.mode: "trusted-proxy"`: ID 인식 **비루프백** 프록시 소스 뒤의 브라우저 클라이언트를 위한 역방향 프록시 인증입니다([신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 게이트웨이 대상.
- `session.*`: 세션 저장소 및 기본 키 기본값.

## 관련 항목

- [Control UI](/ko/web/control-ui)
- [대시보드](/ko/web/dashboard)
