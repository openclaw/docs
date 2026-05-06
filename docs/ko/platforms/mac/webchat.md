---
read_when:
    - mac WebChat 보기 또는 루프백 포트 디버깅
summary: Mac 앱이 Gateway WebChat을 임베드하는 방식과 이를 디버그하는 방법
title: 웹 채팅 (macOS)
x-i18n:
    generated_at: "2026-05-06T06:33:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 메뉴 막대 앱은 WebChat UI를 네이티브 SwiftUI 보기로 임베드합니다. 선택한
에이전트의 **기본 세션**에 연결되며, 다른 세션을 위한 세션 전환기를 제공합니다.

- **로컬 모드**: 로컬 Gateway WebSocket에 직접 연결합니다.
- **원격 모드**: SSH를 통해 Gateway 제어 포트를 전달하고 해당 터널을 데이터
  플레인으로 사용합니다.

## 실행 및 디버깅

- 수동: Lobster 메뉴 → "채팅 열기".
- 테스트용 자동 열기:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- 로그: `./scripts/clawlog.sh`(하위 시스템 `ai.openclaw`, 카테고리 `WebChatSwiftUI`).

## 연결 방식

- 데이터 플레인: Gateway WS 메서드 `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` 및 이벤트 `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history`는 표시용으로 정규화된 대화 기록 행을 반환합니다. 인라인 지시문
  태그는 표시 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML 페이로드
  (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함)와
  유출된 ASCII/전각 모델 제어 토큰도 제거되며, 정확히 `NO_REPLY` / `no_reply`와
  같은 순수 무음 토큰 어시스턴트 행은 생략되고, 크기가 너무 큰 행은 플레이스홀더로
  대체될 수 있습니다.
- 세션: 기본적으로 주 세션(`main`, 또는 범위가 전역이면 `global`)을 사용합니다.
  UI에서 세션 간 전환이 가능합니다.
- 온보딩은 첫 실행 설정을 분리하기 위해 전용 세션을 사용합니다.

## 보안 표면

- 원격 모드는 SSH를 통해 Gateway WebSocket 제어 포트만 전달합니다.

## 알려진 제한 사항

- UI는 채팅 세션에 최적화되어 있습니다(전체 브라우저 샌드박스가 아님).

## 관련 항목

- [WebChat](/ko/web/webchat)
- [macOS 앱](/ko/platforms/macos)
