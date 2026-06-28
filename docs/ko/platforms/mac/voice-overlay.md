---
read_when:
    - 음성 오버레이 동작 조정
summary: 웨이크 워드와 푸시 투 토크가 겹칠 때의 음성 오버레이 수명 주기
title: 음성 오버레이
x-i18n:
    generated_at: "2026-05-06T06:33:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 음성 오버레이 수명 주기 (macOS)

대상: macOS 앱 기여자. 목표: 웨이크 워드와 푸시 투 토크가 겹칠 때 음성 오버레이가 예측 가능하게 동작하도록 유지합니다.

## 현재 의도

- 오버레이가 이미 웨이크 워드로 표시된 상태에서 사용자가 단축키를 누르면, 단축키 세션은 기존 텍스트를 초기화하는 대신 _채택_합니다. 단축키를 누르고 있는 동안 오버레이는 계속 표시됩니다. 사용자가 손을 떼면: 앞뒤 공백을 제거한 텍스트가 있으면 전송하고, 없으면 닫습니다.
- 웨이크 워드만 사용하는 경우에는 여전히 침묵 시 자동 전송됩니다. 푸시 투 토크는 손을 떼는 즉시 전송됩니다.

## 구현됨 (2025년 12월 9일)

- 이제 오버레이 세션은 각 캡처(웨이크 워드 또는 푸시 투 토크)마다 토큰을 가집니다. 토큰이 일치하지 않으면 partial/final/send/dismiss/level 업데이트를 버려 오래된 콜백을 방지합니다.
- 푸시 투 토크는 표시 중인 오버레이 텍스트를 접두사로 채택합니다(따라서 웨이크 오버레이가 표시된 상태에서 단축키를 누르면 텍스트를 유지하고 새 음성을 덧붙입니다). 최종 transcript를 최대 1.5초 동안 기다린 뒤 현재 텍스트로 폴백합니다.
- 차임/오버레이 로깅은 `voicewake.overlay`, `voicewake.ptt`, `voicewake.chime` 카테고리에서 `info`로 내보냅니다(세션 시작, partial, final, send, dismiss, 차임 이유).

## 다음 단계

1. **VoiceSessionCoordinator (actor)**
   - 한 번에 정확히 하나의 `VoiceSession`을 소유합니다.
   - API(토큰 기반): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - 오래된 토큰이 포함된 콜백을 버립니다(이전 recognizer가 오버레이를 다시 열지 못하게 함).
2. **VoiceSession (model)**
   - 필드: `token`, `source` (wakeWord|pushToTalk), 커밋된/휘발성 텍스트, 차임 플래그, 타이머(자동 전송, 유휴), `overlayMode` (display|editing|sending), 쿨다운 기한.
3. **오버레이 바인딩**
   - `VoiceSessionPublisher`(`ObservableObject`)는 활성 세션을 SwiftUI에 미러링합니다.
   - `VoiceWakeOverlayView`는 게시자를 통해서만 렌더링하며, 전역 싱글턴을 직접 변경하지 않습니다.
   - 오버레이 사용자 동작(`sendNow`, `dismiss`, `edit`)은 세션 토큰과 함께 코디네이터로 다시 호출됩니다.
4. **통합 전송 경로**
   - `endCapture` 시: 앞뒤 공백을 제거한 텍스트가 비어 있으면 → 닫기; 아니면 `performSend(session:)`(전송 차임을 한 번 재생하고, 전달하고, 닫음).
   - 푸시 투 토크: 지연 없음. 웨이크 워드: 자동 전송을 위한 선택적 지연.
   - 푸시 투 토크가 끝난 뒤 웨이크 런타임에 짧은 쿨다운을 적용하여 웨이크 워드가 즉시 다시 트리거되지 않도록 합니다.
5. **로깅**
   - 코디네이터는 `ai.openclaw` 서브시스템, `voicewake.overlay` 및 `voicewake.chime` 카테고리에서 `.info` 로그를 내보냅니다.
   - 주요 이벤트: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## 디버깅 체크리스트

- 고정된 오버레이를 재현하는 동안 로그를 스트리밍합니다.

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 활성 세션 토큰이 하나뿐인지 확인합니다. 오래된 콜백은 코디네이터가 버려야 합니다.
- 푸시 투 토크에서 손을 뗄 때 항상 활성 토큰으로 `endCapture`를 호출하는지 확인합니다. 텍스트가 비어 있으면 차임이나 전송 없이 `dismiss`가 예상됩니다.

## 마이그레이션 단계(제안)

1. `VoiceSessionCoordinator`, `VoiceSession`, `VoiceSessionPublisher`를 추가합니다.
2. `VoiceWakeRuntime`을 리팩터링하여 `VoiceWakeOverlayController`를 직접 건드리는 대신 세션을 생성/업데이트/종료하도록 합니다.
3. `VoicePushToTalk`를 리팩터링하여 기존 세션을 채택하고 손을 뗄 때 `endCapture`를 호출하도록 합니다. 런타임 쿨다운을 적용합니다.
4. `VoiceWakeOverlayController`를 게시자에 연결하고, 런타임/PTT의 직접 호출을 제거합니다.
5. 세션 채택, 쿨다운, 빈 텍스트 닫기에 대한 통합 테스트를 추가합니다.

## 관련

- [macOS 앱](/ko/platforms/macos)
- [음성 깨우기(macOS)](/ko/platforms/mac/voicewake)
- [대화 모드](/ko/nodes/talk)
