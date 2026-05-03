---
read_when:
    - 사용자가 에이전트들이 도구 호출을 반복한 채 멈춘다고 보고합니다
    - 반복 호출 보호를 조정해야 합니다
    - 에이전트 도구/런타임 정책을 편집하고 있습니다
summary: 반복적인 도구 호출 루프를 감지하는 가드레일을 활성화하고 조정하는 방법
title: 도구 루프 감지
x-i18n:
    generated_at: "2026-05-03T21:38:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw는 에이전트가 반복되는 도구 호출 패턴에 갇히지 않도록 할 수 있습니다.
이 보호 기능은 **기본적으로 비활성화되어 있습니다**.

엄격한 설정에서는 정상적인 반복 호출도 차단할 수 있으므로 필요한 곳에서만 활성화하세요.

## 존재 이유

- 진행이 없는 반복 시퀀스를 감지합니다.
- 고빈도 무결과 루프(같은 도구, 같은 입력, 반복 오류)를 감지합니다.
- 알려진 폴링 도구의 특정 반복 호출 패턴을 감지합니다.

## 구성 블록

전역 기본값:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

에이전트별 재정의(선택 사항):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### 필드 동작

- `enabled`: 마스터 스위치입니다. `false`이면 루프 감지가 수행되지 않습니다.
- `historySize`: 분석을 위해 보관하는 최근 도구 호출 수입니다.
- `warningThreshold`: 패턴을 경고 전용으로 분류하기 전의 임계값입니다.
- `criticalThreshold`: 반복 루프 패턴을 차단하는 임계값입니다.
- `globalCircuitBreakerThreshold`: 전역 무진행 차단기 임계값입니다.
- `detectors.genericRepeat`: 같은 도구 + 같은 매개변수 패턴의 반복을 감지합니다.
- `detectors.knownPollNoProgress`: 상태 변경이 없는 알려진 폴링 유사 패턴을 감지합니다.
- `detectors.pingPong`: 교대로 반복되는 핑퐁 패턴을 감지합니다.

`exec`의 경우 무진행 검사는 안정적인 명령 결과를 비교하며, 지속 시간, PID, 세션 ID, 작업 디렉터리 같은 변동성 있는 런타임 메타데이터는 무시합니다.
실행 ID를 사용할 수 있으면 최근 도구 호출 기록은 해당 실행 내에서만 평가되므로 예약된 Heartbeat 사이클과 새 실행이 이전 실행의 오래된 루프 횟수를 물려받지 않습니다.

## 권장 설정

- 더 작은 모델의 경우 `enabled: true`로 시작하고 기본값은 변경하지 마세요. 플래그십 모델은 루프 감지가 거의 필요하지 않으며 비활성화된 상태로 둘 수 있습니다.
- 임계값은 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` 순서로 유지하세요.
- 오탐이 발생하는 경우:
  - `warningThreshold` 및/또는 `criticalThreshold`를 높입니다.
  - (선택 사항) `globalCircuitBreakerThreshold`를 높입니다.
  - 문제를 일으키는 감지기만 비활성화합니다.
  - 덜 엄격한 기록 컨텍스트를 위해 `historySize`를 줄입니다.

## 로그와 예상 동작

루프가 감지되면 OpenClaw는 루프 이벤트를 보고하고 심각도에 따라 다음 도구 사이클을 차단하거나 완화합니다.
이를 통해 정상적인 도구 접근은 유지하면서 폭주하는 토큰 사용과 멈춤으로부터 사용자를 보호합니다.

- 먼저 경고와 임시 억제를 선호하세요.
- 반복된 증거가 누적될 때만 에스컬레이션하세요.

## 참고

- `tools.loopDetection`은 에이전트 수준 재정의와 병합됩니다.
- 에이전트별 구성은 전역 값을 완전히 재정의하거나 확장합니다.
- 구성이 없으면 보호 기능은 꺼진 상태로 유지됩니다.

## 관련 항목

- [Exec 승인](/ko/tools/exec-approvals)
- [사고 수준](/ko/tools/thinking)
- [하위 에이전트](/ko/tools/subagents)
