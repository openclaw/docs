---
read_when:
    - 메뉴 막대 아이콘 동작 변경
summary: macOS용 OpenClaw의 메뉴 막대 아이콘 상태 및 애니메이션
title: 메뉴 막대 아이콘
x-i18n:
    generated_at: "2026-05-06T06:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 메뉴 막대 아이콘 상태

작성자: steipete · 업데이트: 2025-12-06 · 범위: macOS 앱(`apps/macos`)

- **유휴 상태:** 일반 아이콘 애니메이션(깜박임, 간헐적인 흔들림).
- **일시 중지:** 상태 항목은 `appearsDisabled`를 사용하며, 움직임이 없습니다.
- **음성 트리거(큰 귀):** 깨우기 단어가 들리면 음성 깨우기 감지기가 `AppState.triggerVoiceEars(ttl: nil)`를 호출하여 발화를 캡처하는 동안 `earBoostActive=true`를 유지합니다. 귀가 커지고(1.9x), 가독성을 위해 원형 귀 구멍이 생긴 다음, 1초 동안 침묵이 이어지면 `stopVoiceEars()`를 통해 내려갑니다. 앱 내부 음성 파이프라인에서만 실행됩니다.
- **작업 중(에이전트 실행 중):** `AppState.isWorking=true`는 "꼬리/다리 종종걸음" 마이크로 모션을 구동합니다. 작업이 진행 중일 때 다리 흔들림이 빨라지고 약간의 오프셋이 적용됩니다. 현재 WebChat 에이전트 실행 전후에 토글됩니다. 다른 긴 작업을 연결할 때도 동일한 토글을 추가하세요.

연결 지점

- 음성 깨우기: 런타임/테스터는 캡처 창과 맞추기 위해 트리거 시 `AppState.triggerVoiceEars(ttl: nil)`를 호출하고, 1초 동안 침묵이 이어진 뒤 `stopVoiceEars()`를 호출합니다.
- 에이전트 활동: 작업 구간 전후에 `AppStateStore.shared.setWorking(true/false)`를 설정합니다(WebChat 에이전트 호출에서는 이미 완료됨). 애니메이션이 멈춘 상태로 고정되지 않도록 구간을 짧게 유지하고 `defer` 블록에서 재설정하세요.

모양 및 크기

- 기본 아이콘은 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`에서 그려집니다.
- 귀 배율 기본값은 `1.0`입니다. 음성 부스트는 전체 프레임을 변경하지 않고 `earScale=1.9`를 설정하고 `earHoles=true`를 토글합니다(18×18 pt 템플릿 이미지를 36×36 px Retina 백킹 스토어에 렌더링).
- 종종걸음은 작은 수평 흔들림과 함께 다리 흔들림을 최대 약 1.0까지 사용합니다. 기존 유휴 흔들림이 있으면 여기에 더해집니다.

동작 참고 사항

- 귀/작업 중 상태에 대한 외부 CLI/브로커 토글은 없습니다. 의도치 않은 플래핑을 방지하려면 앱 자체 신호 내부에 유지하세요.
- 작업이 멈춰도 아이콘이 빠르게 기준 상태로 돌아가도록 TTL을 짧게 유지하세요(&lt;10초).

## 관련 항목

- [메뉴 막대](/ko/platforms/mac/menu-bar)
- [macOS 앱](/ko/platforms/macos)
