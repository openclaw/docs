---
read_when:
    - WebChat 액세스 디버깅 또는 구성
summary: 채팅 UI를 위한 루프백 WebChat 정적 호스트 및 Gateway WS 사용법
title: 웹 채팅
x-i18n:
    generated_at: "2026-07-12T15:52:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

상태: macOS/iOS SwiftUI 채팅 UI는 Gateway WebSocket과 직접 통신합니다. 내장 브라우저나 로컬 정적 서버를 사용하지 않습니다.

## 개요

- Gateway용 네이티브 채팅 UI입니다.
- 다른 채널과 동일한 세션 및 라우팅 규칙을 사용합니다.
- 결정론적 라우팅: 응답은 항상 WebChat으로 돌아갑니다.
- 기록은 항상 Gateway에서 가져옵니다(로컬 파일 감시 없음). Gateway에 연결할 수 없으면 WebChat은 읽기 전용입니다.

## 빠른 시작

1. Gateway를 시작합니다.
2. WebChat UI(macOS/iOS 앱) 또는 Control UI 채팅 탭을 엽니다.
3. 유효한 Gateway 인증 경로가 구성되어 있는지 확인합니다(루프백에서도 기본적으로 공유 비밀을 사용함).

## 작동 방식

- UI는 Gateway WebSocket에 연결하고 `chat.history`, `chat.send`, `chat.inject`, `chat.message.get` RPC 메서드를 사용합니다.
- `chat.history`는 안정성을 위해 제한됩니다. Gateway는 긴 텍스트 필드를 잘라내고, 용량이 큰 메타데이터를 생략하며, 지나치게 큰 항목을 `[chat.history omitted: message too large]`로 대체할 수 있습니다. API 클라이언트는 요청별 `maxChars`를 전송하여 한 번의 호출에 대해 기본 제한을 재정의할 수 있습니다.
- `chat.history`에서 표시되는 어시스턴트 메시지가 잘린 경우, Control UI는 기본 기록 페이로드를 늘리지 않고도 사이드 리더를 열고 `chat.message.get`을 통해 표시용으로 정규화된 전체 항목을 필요할 때 가져올 수 있습니다. `chat.message.get`은 `chat.history`와 동일한 트랜스크립트 브랜치 및 표시 규칙을 사용하지만, `messageId`로 하나의 항목을 대상으로 하며 전체 콘텐츠를 더 이상 반환할 수 없을 때 정확한 사용 불가 사유를 반환합니다.
- `chat.history`는 추가 전용 세션 파일의 활성 트랜스크립트 브랜치를 따르므로, 폐기된 재작성 브랜치와 대체된 프롬프트 사본은 WebChat에 렌더링되지 않습니다.
- Compaction 항목은 압축된 트랜스크립트가 체크포인트로 보존됨을 설명하는 "압축된 기록" 구분선으로 렌더링되며, 세션 체크포인트를 여는 작업이 제공됩니다(권한이 허용하는 경우 브랜치 생성 또는 복원).
- Control UI는 `chat.history`가 반환한 기반 Gateway `sessionId`를 기억하고 후속 `chat.send` 호출에 포함하므로, 사용자가 세션을 시작하거나 재설정하지 않는 한 재연결 및 페이지 새로 고침 후에도 저장된 동일한 대화가 계속됩니다.
- `chat.send`는 멱등성 키를 받습니다(Control UI는 실행 ID를 사용함). Gateway는 동일한 키를 재사용하는 반복 요청의 중복을 제거하므로, 동일한 세션/메시지/첨부 파일에 대해 재시도되거나 중복된 진행 중 제출이 두 번째 실행을 생성하지 않습니다.
- 작업 공간 시작 파일과 대기 중인 `BOOTSTRAP.md` 지침은 WebChat 사용자 메시지에 복사되지 않고 에이전트 시스템 프롬프트의 `# Project Context` 섹션을 통해 제공됩니다. 부트스트랩 콘텐츠가 잘리면 시스템 프롬프트에는 대신 짧은 "부트스트랩 컨텍스트 알림"이 포함되며, 자세한 개수와 구성 조정 항목은 진단 화면에 유지됩니다.
- `chat.history`의 표시 정규화는 다음을 제거합니다. 런타임 전용 OpenClaw 컨텍스트, 인바운드 봉투 래퍼, `[[reply_to_current]]`, `[[reply_to:<id>]]`, `[[audio_as_voice]]` 같은 인라인 전달 지시문 태그, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, 잘린 블록 포함), 유출된 ASCII/전각 모델 제어 토큰. 표시되는 전체 텍스트가 대소문자를 구분하지 않고 무응답 토큰 `NO_REPLY`뿐인 어시스턴트 항목은 생략됩니다.
- 추론 플래그가 지정된 응답 페이로드(`isReasoning: true`)는 WebChat 어시스턴트 콘텐츠, 트랜스크립트 재생 텍스트 및 오디오 콘텐츠 블록에서 제외되므로, 사고 전용 페이로드가 표시되는 어시스턴트 메시지나 재생 가능한 오디오로 노출되지 않습니다.
- `chat.inject`는 어시스턴트 메모를 트랜스크립트에 직접 추가하고 UI에 브로드캐스트합니다(에이전트 실행 없음).
- 중단된 실행은 부분적인 어시스턴트 출력을 UI에 계속 표시할 수 있습니다. 버퍼링된 출력이 있으면 Gateway는 해당 부분 텍스트를 트랜스크립트 기록에 유지하고 항목에 중단 메타데이터를 표시합니다.

### 트랜스크립트 및 전달 모델

WebChat에는 서로 분리된 두 가지 데이터 경로가 있습니다.

- SQLite 트랜스크립트 행은 영구적인 모델/런타임 트랜스크립트입니다. 일반적인 에이전트 실행의 경우 내장 OpenClaw 런타임은 세션 접근자를 통해 모델에 표시되는 `user`, `assistant`, `toolResult` 메시지를 유지합니다. WebChat은 임의의 전달, 상태 또는 도우미 텍스트를 해당 트랜스크립트에 기록하지 않습니다.
- Gateway `ReplyPayload` 이벤트는 실시간 전달 프로젝션입니다. WebChat/채널 표시, 블록 스트리밍, 지시문 태그, 미디어 삽입, TTS/오디오 플래그 및 UI 폴백 동작에 맞게 정규화됩니다. 이러한 이벤트 자체는 정식 세션 로그가 아닙니다.
- `tools.message`를 통해 표시되는 응답이 필요한 하네스는 현재 실행의 내부 소스 응답 싱크로 WebChat을 계속 사용합니다. 해당 활성 WebChat 실행에서 대상을 지정하지 않은 `message.send`는 동일한 채팅에 프로젝션되고 세션 트랜스크립트에 미러링됩니다. WebChat은 재사용 가능한 아웃바운드 채널이 되지 않으며 `lastChannel`을 상속하지 않습니다.
- WebChat은 Gateway가 일반적인 내장 에이전트 턴 외부에서 표시 메시지를 소유하는 경우에만 어시스턴트 트랜스크립트 항목을 삽입합니다. 해당 경우는 `chat.inject`, 비에이전트 명령 응답, 중단된 부분 출력 및 WebChat에서 관리하는 미디어 트랜스크립트 보충 항목입니다.
- 실행 중 실시간 어시스턴트 텍스트가 표시되지만 기록을 다시 불러온 후 사라지는 경우 다음 순서로 확인합니다. SQLite 트랜스크립트에 어시스턴트 텍스트가 포함되어 있는지, `chat.history` 표시 프로젝션이 이를 제거했는지, 그런 다음 Control UI의 낙관적 꼬리 병합이 로컬 전달 상태를 유지된 스냅샷으로 대체했는지 확인합니다.

일반적인 에이전트 실행의 최종 답변은 내장 런타임이 어시스턴트 `message_end`를 기록하므로 영구적으로 유지되어야 합니다. 전달된 최종 페이로드를 트랜스크립트에 미러링하는 모든 폴백은 먼저 내장 런타임이 이미 기록한 어시스턴트 턴과 중복되지 않도록 해야 합니다.

## Control UI 에이전트 도구 패널

- Control UI `/agents` 도구 패널에는 `tools.effective(sessionKey=...)`를 기반으로 하는 "지금 사용 가능" 보기가 있습니다. 이는 코어, Plugin, 채널 소유 도구 및 이미 검색된 MCP 서버 도구를 포함하여 현재 세션의 도구 인벤토리를 서버에서 생성한 읽기 전용 형태로 보여줍니다.
- 별도의 구성 편집 보기(`tools.catalog` 기반)에서는 프로필, 에이전트별 재정의 및 카탈로그 의미 체계를 다룹니다.
- 런타임 가용성은 세션 범위로 한정됩니다. 같은 에이전트에서 세션을 전환하면 "지금 사용 가능" 목록이 달라질 수 있습니다. 구성된 MCP 서버가 아직 연결되지 않았거나 마지막 검색 이후 변경된 경우, 패널은 읽기 경로에서 MCP 전송을 자동으로 시작하는 대신 알림을 표시합니다.
- 구성 편집기는 런타임 가용성을 보장하지 않습니다. 유효한 접근 권한에는 여전히 정책 우선순위(`allow`/`deny`, 에이전트별 및 공급자/채널 재정의)가 적용됩니다.

## 원격 사용

- 원격 모드는 SSH/Tailscale을 통해 Gateway WebSocket을 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요가 없습니다.

## 구성 참조(WebChat)

전체 구성: [구성](/ko/gateway/configuration)

WebChat에는 영구 저장되는 구성 섹션이 없습니다. Gateway는 기본 제공 `chat.history` 표시 제한을 사용하며, API 클라이언트는 요청별 `maxChars`를 전송하여 단일 호출에 한해 이를 재정의할 수 있습니다. 레거시 `channels.webchat` 및 `gateway.webchat` 구성은 폐기되었습니다. 이를 제거하려면 `openclaw doctor --fix`를 실행하십시오.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트입니다.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  공유 비밀 WebSocket 인증입니다.
- `gateway.auth.allowTailscale`: 활성화하면 브라우저 Control UI 채팅 탭에서 Tailscale
  Serve ID 헤더를 사용할 수 있습니다.
- `gateway.auth.mode: "trusted-proxy"`: ID 인식 **비루프백** 프록시 소스 뒤에 있는 브라우저 클라이언트용 역방향 프록시 인증입니다([신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 Gateway 대상입니다.
- `session.*`: 세션 저장소 및 기본 키의 기본값입니다.

## 관련 문서

- [Control UI](/ko/web/control-ui)
- [대시보드](/ko/web/dashboard)
