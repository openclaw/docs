---
read_when:
    - 메뉴 막대 아이콘 동작 변경하기
summary: macOS용 OpenClaw의 메뉴 막대 아이콘 상태 및 애니메이션
title: 메뉴 막대 아이콘
x-i18n:
    generated_at: "2026-07-12T15:30:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# 메뉴 막대 아이콘 상태

범위: macOS 앱(`apps/macos`). 렌더링: `CritterIconRenderer.makeIcon(...)`. 애니메이션/상태 연결: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## 상태

| 상태                  | 트리거                                    | 시각적 표현                                                                                         |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 유휴                  | 기본값                                    | 일반적인 깜박임/꿈틀거림 애니메이션이 재생되며, 눈을 뜨고 있을 때는 윤기 나는 반짝임이 유지됩니다 |
| 일시 중지             | `isPaused=true`                           | 눈을 뜬 채 더듬이가 아래로 처진("근무 중 아님") 모습이며, 움직임이 없습니다                       |
| 수면                  | Gateway 연결 끊김/미구성                  | 더듬이가 아래로 처지고 눈이 `⌣ ⌣` 모양의 눈꺼풀로 감기며, 움직임이 없습니다                       |
| 축하                  | 메시지 전송(`sendCelebrationTick`)        | 약 0.9초 동안 눈이 행복한 `∩ ∩` 모양의 곡선으로 번쩍이고 다리를 한 번 찹니다                     |
| 음성 깨우기(큰 귀)    | 깨우기 단어 감지                          | 더듬이가 곧고 더 높게 바짝 섰다가(`earScale=1.9`) 침묵 후 원래대로 돌아옵니다                     |
| 작업 중               | `isWorking=true` 또는 활성 `IconState`    | 다리가 더 빠르게 꿈틀거리고(`legWiggle` 최대 `1.0`) 가로로 약간 움직이며, 유휴 상태의 꿈틀거림에 추가됩니다 |

세션에 활성 작업 또는 도구가 있으면 도구 활동 배지(예: 실행을 나타내는 `chevron.left.slash.chevron.right` SF Symbol 퍽)를 같은 크리처 아이콘 위에 렌더링할 수 있습니다. 이 배지는 `IconState`/`ActivityKind`에서 제공됩니다. 전체 상태 모델은 [메뉴 막대](/ko/platforms/mac/menu-bar)를 참조하십시오.

## 음성 깨우기 귀

- 트리거: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`. 음성 깨우기 캡처 파이프라인(`VoiceWakeRuntime`)과 음성 깨우기 디버그/테스트 도구(`VoiceWakeTester`, `VoiceWakeOverlayController`)에서 호출됩니다.
- 중지: `stopVoiceEars()`. 캡처가 완료될 때 호출됩니다.
- 완료 전 침묵 시간: 일반적으로 `2.0s`이며, 트리거 단어만 감지되고 이후 음성이 이어지지 않으면 `5.0s`입니다(`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- 귀가 강조된 동안에는 유휴 상태의 깜박임/꿈틀거림/다리/귀 타이머가 일시 중단됩니다(`earBoostActive`가 `CritterStatusLabel+Behavior`의 애니메이션 작업을 제어합니다).

## 모양 및 크기

- 캔버스: 18x18pt 템플릿 이미지이며, Retina에서 아이콘이 선명하게 유지되도록 36x36px 비트맵 백업 저장소(2x)에 렌더링됩니다.
- 귀 배율의 기본값은 `1.0`이며, 음성 강조 시 전체 프레임을 변경하지 않고 `earScale=1.9`로 설정합니다.
- `antennaDroop`(0-1)은 일시 중지 및 수면 자세에서 더듬이를 아래로 접습니다.
- 빠른 다리 움직임에는 최대 `1.0`의 `legWiggle`과 작은 가로 흔들림을 사용합니다.

## 동작 참고 사항

- 귀 또는 작업 중 상태를 위한 외부 CLI/브로커 토글은 없습니다. 두 상태 모두 의도치 않은 반복 전환을 방지하기 위해 앱 신호(`AppState.setWorking`, `AppState.triggerVoiceEars`)에 의해 내부적으로 구동됩니다.
- 작업이 멈추더라도 아이콘이 기준 상태로 빠르게 돌아가도록 새 TTL은 짧게(10초보다 훨씬 짧게) 유지하십시오.

## 관련 문서

- [메뉴 막대](/ko/platforms/mac/menu-bar)
- [macOS 앱](/ko/platforms/macos)
