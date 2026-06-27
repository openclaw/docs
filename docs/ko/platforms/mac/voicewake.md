---
read_when:
    - 음성 깨우기 또는 PTT 경로 작업하기
summary: mac 앱의 음성 깨우기 및 푸시 투 토크 모드와 라우팅 세부 정보
title: 음성 깨우기(macOS)
x-i18n:
    generated_at: "2026-06-27T17:41:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Voice Wake 및 Push-to-Talk

## 요구 사항

Voice Wake와 push-to-talk에는 macOS 26 이상이 필요합니다. 이전 macOS 버전에서는
컨트롤이 음성 설정 페이지에서 숨겨지며, 해당 페이지에는 macOS 26
요구 사항이 표시됩니다.

## 모드

- **깨우기 단어 모드**(기본값): 항상 켜져 있는 음성 인식기가 트리거 토큰(`swabbleTriggerWords`)을 기다립니다. 일치하면 캡처를 시작하고, 부분 텍스트가 포함된 오버레이를 표시하며, 침묵 후 자동으로 전송합니다.
- **Push-to-talk(오른쪽 Option 길게 누르기)**: 오른쪽 Option 키를 길게 눌러 즉시 캡처합니다. 트리거는 필요 없습니다. 누르고 있는 동안 오버레이가 나타나며, 손을 떼면 텍스트를 조정할 수 있도록 짧은 지연 후 완료하고 전달합니다.

## 런타임 동작(깨우기 단어)

- 음성 인식기는 `VoiceWakeRuntime`에 있습니다.
- 트리거는 깨우기 단어와 다음 단어 사이에 **의미 있는 멈춤**이 있을 때만 실행됩니다(~0.55초 간격). 명령이 시작되기 전이라도 멈춤 시점에 오버레이/차임이 시작될 수 있습니다.
- 침묵 구간: 음성이 이어지는 경우 2.0초, 트리거만 들린 경우 5.0초.
- 강제 중지: 제어 불능 세션을 방지하기 위해 120초.
- 세션 간 디바운스: 350ms.
- 오버레이는 확정/휘발 색상 표시와 함께 `VoiceWakeOverlayController`를 통해 구동됩니다.
- 전송 후 인식기는 다음 트리거를 듣기 위해 깔끔하게 다시 시작됩니다.

## 수명 주기 불변 조건

- Voice Wake가 활성화되어 있고 권한이 부여된 경우, 깨우기 단어 인식기는 수신 중이어야 합니다(명시적인 push-to-talk 캡처 중인 경우 제외).
- 오버레이 표시 상태(X 버튼을 통한 수동 닫기 포함)는 인식기가 다시 시작되는 것을 절대 막아서는 안 됩니다.

## 고정된 오버레이 실패 모드(이전)

이전에는 오버레이가 표시된 채로 고정되어 수동으로 닫으면, 런타임의 재시작 시도가 오버레이 표시 상태에 의해 차단될 수 있고 이후 재시작이 예약되지 않아 Voice Wake가 "죽은" 것처럼 보일 수 있었습니다.

강화 사항:

- 깨우기 런타임 재시작은 더 이상 오버레이 표시 상태에 의해 차단되지 않습니다.
- 오버레이 닫기 완료는 `VoiceSessionCoordinator`를 통해 `VoiceWakeRuntime.refresh(...)`를 트리거하므로, 수동 X-닫기는 항상 수신을 재개합니다.

## Push-to-talk 세부 사항

- 단축키 감지는 **오른쪽 Option**(`keyCode 61` + `.option`)에 대한 전역 `.flagsChanged` 모니터를 사용합니다. 이벤트만 관찰합니다(가로채지 않음).
- 캡처 파이프라인은 `VoicePushToTalk`에 있습니다. 즉시 Speech를 시작하고, 부분 결과를 오버레이로 스트리밍하며, 손을 떼면 `VoiceWakeForwarder`를 호출합니다.
- push-to-talk가 시작되면 경쟁하는 오디오 탭을 피하기 위해 깨우기 단어 런타임을 일시 중지합니다. 손을 떼면 자동으로 다시 시작됩니다.
- 권한: 마이크 + Speech가 필요하며, 이벤트를 보려면 손쉬운 사용/입력 모니터링 승인이 필요합니다.
- 외부 키보드: 일부는 오른쪽 Option을 예상대로 노출하지 않을 수 있습니다. 사용자가 누락을 보고하면 대체 단축키를 제공하세요.

## 사용자 표시 설정

- **Voice Wake** 토글: 깨우기 단어 런타임을 활성화합니다.
- **오른쪽 Option을 길게 눌러 말하기**: push-to-talk 모니터를 활성화합니다.
- 언어 및 마이크 선택기, 실시간 레벨 미터, 트리거 단어 표, 테스터(로컬 전용, 전달하지 않음).
- 마이크 선택기는 장치 연결이 끊어져도 마지막 선택을 유지하고, 연결 끊김 힌트를 표시하며, 장치가 돌아올 때까지 일시적으로 시스템 기본값으로 대체합니다.
- **소리**: 트리거 감지 및 전송 시 차임을 재생합니다. 기본값은 macOS "Glass" 시스템 사운드입니다. 각 이벤트에 대해 `NSSound`로 로드 가능한 파일(예: MP3/WAV/AIFF)을 선택하거나 **소리 없음**을 선택할 수 있습니다.

## 전달 동작

- Voice Wake가 활성화되면 기록 텍스트가 활성 Gateway/에이전트로 전달됩니다(Mac 앱의 나머지 부분에서 사용하는 동일한 로컬 대 원격 모드).
- 응답은 **마지막으로 사용한 기본 제공자**(WhatsApp/Telegram/Discord/WebChat)로 전달됩니다. 전달에 실패하면 오류가 기록되며, 실행은 여전히 WebChat/세션 로그에서 볼 수 있습니다.

## 전달 페이로드

- `VoiceWakeForwarder.prefixedTranscript(_:)`는 전송 전에 머신 힌트를 앞에 붙입니다. 깨우기 단어 및 push-to-talk 경로에서 공유됩니다.

## 빠른 확인

- push-to-talk를 켜고, 오른쪽 Option을 길게 누른 채 말한 다음 손을 떼세요. 오버레이가 부분 결과를 표시한 뒤 전송해야 합니다.
- 누르고 있는 동안 메뉴 막대 귀는 확대된 상태를 유지해야 합니다(`triggerVoiceEars(ttl:nil)` 사용). 손을 떼면 원래대로 돌아갑니다.

## 관련 항목

- [Voice wake](/ko/nodes/voicewake)
- [Voice overlay](/ko/platforms/mac/voice-overlay)
- [macOS 앱](/ko/platforms/macos)
