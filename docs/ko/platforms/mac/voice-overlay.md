---
read_when:
    - 음성 오버레이 동작 조정하기
summary: 웨이크 워드와 눌러서 말하기가 겹칠 때의 음성 오버레이 수명 주기
title: 음성 오버레이
x-i18n:
    generated_at: "2026-07-12T15:25:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# 음성 오버레이 수명 주기(macOS)

대상: macOS 앱 기여자. 목표: 깨우기 단어와 눌러서 말하기가 겹칠 때 음성 오버레이가 예측 가능하게 동작하도록 합니다.

## 동작

- 깨우기 단어로 오버레이가 이미 표시된 상태에서 사용자가 단축키를 누르면, 단축키 세션은 기존 텍스트를 초기화하지 않고 이어받습니다. 단축키를 누르고 있는 동안 오버레이가 계속 표시됩니다. 단축키를 놓으면 공백을 제거한 텍스트가 있는 경우 전송하고, 그렇지 않으면 닫습니다.
- 깨우기 단어만 사용하는 경우에는 계속해서 무음 상태가 되면 자동으로 전송되며, 눌러서 말하기는 단축키를 놓는 즉시 전송합니다.

## 구현

- `VoiceSessionCoordinator`(`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`)는 활성 음성 세션의 단일 소유자입니다. actor가 아니라 `@MainActor @Observable` 싱글턴입니다. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. 각 세션은 `UUID` 토큰을 가지며, 오래되었거나 일치하지 않는 토큰으로 호출하면 무시됩니다.
- `VoiceWakeOverlayController`(`VoiceWakeOverlayController+Session.swift`)는 오버레이를 렌더링하고 사용자 동작(`requestSend`, `dismiss`)을 세션 토큰을 통해 코디네이터로 다시 전달합니다. 세션 상태 자체를 소유하지는 않습니다.
- 눌러서 말하기(`VoicePushToTalk.begin()`)는 표시된 오버레이의 모든 텍스트를 `adoptedPrefix`로 이어받으므로(`VoiceSessionCoordinator.shared.snapshot()` 사용), 깨우기 오버레이가 표시된 상태에서 단축키를 눌러도 텍스트가 유지되고 새로운 음성이 추가됩니다. 단축키를 놓으면 최종 기록을 최대 1.5s 동안 기다린 후, 없으면 현재 텍스트를 사용합니다.
- `dismiss` 시 오버레이는 `VoiceSessionCoordinator.overlayDidDismiss`를 호출하며, 이 호출은 `VoiceWakeRuntime.refresh(state:)`를 트리거합니다. 따라서 수동 X 닫기, 빈 텍스트 닫기, 전송 후 닫기 이후 모두 깨우기 단어 듣기가 재개됩니다.
- 통합 전송 경로: 공백을 제거한 텍스트가 비어 있으면 닫습니다. 그렇지 않으면 `sendNow`가 전송 알림음을 한 번 재생하고 `VoiceWakeForwarder`를 통해 전달한 다음 닫습니다.

## 로깅

음성 하위 시스템은 `ai.openclaw`이며, 각 컴포넌트는 자체 카테고리에 로그를 기록합니다.

| 카테고리                | 컴포넌트                                       |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | 눌러서 말하기 단축키 및 캡처                 |
| `voicewake.runtime`     | 깨우기 단어 런타임                               |
| `voicewake.chime`       | 알림음 재생                                  |
| `voicewake.sync`        | 전역 설정 동기화                            |
| `voicewake.forward`     | 기록 전달                           |
| `voicewake.meter`       | 마이크 레벨 모니터링                               |

## 디버깅 체크리스트

- 오버레이가 사라지지 않는 문제를 재현하면서 로그를 스트리밍합니다.

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 활성 세션 토큰이 하나뿐인지 확인합니다. 오래된 콜백은 코디네이터에서 무시됩니다.
- 눌러서 말하기 단축키를 놓을 때 활성 토큰으로 항상 `end()`를 호출하는지 확인합니다. 텍스트가 비어 있으면 알림음이나 전송 없이 닫혀야 합니다.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [음성 깨우기(macOS)](/ko/platforms/mac/voicewake)
- [대화 모드](/ko/nodes/talk)
