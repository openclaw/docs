---
read_when:
    - mac WebChat 보기 또는 루프백 포트 디버깅
summary: Mac 앱이 Gateway WebChat을 내장하는 방식과 디버깅 방법
title: WebChat(macOS)
x-i18n:
    generated_at: "2026-07-12T15:27:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 메뉴 막대 앱은 WebChat UI를 네이티브 SwiftUI 뷰로 내장합니다. Gateway에 연결되며 선택한 에이전트의 기본 세션(`main`, 또는 `session.scope`가 `global`인 경우 `global`)을 기본값으로 사용합니다.

전체 채팅 창은 네이티브 분할 뷰입니다.

- **세션 사이드바**: 검색 가능한 세션 목록으로, 고정 및 최근 섹션, 읽지 않음 표시기, 고정/고정 해제, 세션 키 복사, 삭제를 위한 컨텍스트 메뉴를 제공합니다. 도구 모음 버튼(또는 Cmd-N)은 `sessions.create`를 통해 실제 새 세션을 생성합니다.
- **창 도구 모음**: 컨텍스트 사용량 링(토큰 및 세션 비용과 간결한 작업 포함), 사고 수준 선택기, 모델 선택기, 세션 작업 메뉴(새 세션, 새로 고침, 세션 키 복사, 대화 내용 내보내기, 압축, 기록 지우기)를 제공합니다.
- **대화 내용 및 작성기**: 어시스턴트 메시지는 아바타와 함께 일반 텍스트로 렌더링되고, 사용자 메시지는 강조색 말풍선으로 렌더링됩니다. `/`를 입력하면 `commands.list`를 기반으로 하는 슬래시 명령 자동 완성이 열리며, 화살표/Tab/Return/Escape 키로 탐색할 수 있습니다. 메시지를 마우스 오른쪽 버튼으로 클릭하면 복사할 수 있습니다.

메뉴 막대에 고정된 빠른 채팅 패널은 인라인 선택기가 포함된 간결한 단일 열 레이아웃을 유지합니다.

- **로컬 모드**: 로컬 Gateway WebSocket에 직접 연결합니다.
- **원격 모드**: SSH를 통해 Gateway 제어 포트를 전달하고 해당 터널을 데이터 플레인으로 사용합니다.

## 실행 및 디버깅

- 수동: Lobster 메뉴 -> "Open Chat".
- 테스트 시 자동 열기:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat`은 레거시 별칭으로 허용됩니다.)

- 로그: `./scripts/clawlog.sh`(하위 시스템 `ai.openclaw`, 범주 `WebChatSwiftUI`).

## 연결 구조

- 데이터 플레인: Gateway WS 메서드 `chat.history`, `chat.send`, `chat.abort`, `chat.inject` 및 이벤트 `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history`는 표시용으로 정규화된 대화 내용을 반환합니다. 인라인 지시문 태그는 표시되는 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` 및 잘린 블록 포함)와 노출된 모델 제어 토큰도 제거됩니다. 정확히 `NO_REPLY`/`no_reply`인 경우처럼 무응답 토큰만 포함된 어시스턴트 행은 생략되며, 지나치게 큰 행은 잘림 자리표시자로 대체될 수 있습니다.
- 세션: 위에서 설명한 기본 세션을 기본값으로 사용하며, UI에서 세션을 전환할 수 있습니다.
- 온보딩은 최초 실행 설정을 별도로 유지하기 위해 전용 세션을 사용합니다.
- 오프라인 캐시: 앱은 Gateway별 최근 채팅 세션과 대화 내용의 소규모 읽기 전용 캐시(`~/Library/Application Support/OpenClaw/chat-cache.sqlite`)를 유지합니다. 콜드 오픈 시 마지막으로 알려진 대화 내용을 즉시 표시하고 Gateway가 응답하면 새로 고치며, 연결이 끊긴 동안에도 최근 채팅을 탐색할 수 있습니다(연결이 복구될 때까지 전송은 비활성화됩니다).

## 보안 범위

- 원격 모드는 SSH를 통해 Gateway WebSocket 제어 포트만 전달합니다.

## 알려진 제한 사항

- UI는 전체 브라우저 샌드박스가 아니라 채팅 세션에 최적화되어 있습니다.

## 관련 문서

- [WebChat](/ko/web/webchat)
- [macOS 앱](/ko/platforms/macos)
