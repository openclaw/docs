---
read_when:
    - 사용자가 에이전트가 도구 호출을 반복하며 멈춘다고 보고합니다
    - 반복 호출 보호를 조정해야 합니다
    - 에이전트 도구/런타임 정책을 편집하고 있습니다
summary: 반복적인 도구 호출 루프를 감지하는 가드레일을 활성화하고 조정하는 방법
title: 도구 루프 감지
x-i18n:
    generated_at: "2026-05-05T01:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw는 에이전트가 반복적인 도구 호출 패턴에 갇히지 않도록 할 수 있습니다.
가드는 **기본적으로 비활성화되어 있습니다**.

엄격한 설정에서는 정상적인 반복 호출도 차단할 수 있으므로 필요한 곳에서만 활성화하세요.

## 존재 이유

- 진행이 없는 반복 시퀀스를 감지합니다.
- 고빈도 무결과 루프를 감지합니다(같은 도구, 같은 입력, 반복된 오류).
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

- `enabled`: 마스터 스위치입니다. `false`는 루프 감지를 수행하지 않음을 의미합니다.
- `historySize`: 분석을 위해 보관하는 최근 도구 호출 수입니다.
- `warningThreshold`: 패턴을 경고 전용으로 분류하기 전의 임계값입니다.
- `criticalThreshold`: 반복 루프 패턴을 차단하기 위한 임계값입니다.
- `globalCircuitBreakerThreshold`: 전역 무진행 차단기 임계값입니다.
- `detectors.genericRepeat`: 같은 도구 + 같은 매개변수 패턴이 반복되는 것을 감지합니다.
- `detectors.knownPollNoProgress`: 상태 변화가 없는 알려진 폴링 유사 패턴을 감지합니다.
- `detectors.pingPong`: 번갈아 나타나는 핑퐁 패턴을 감지합니다.

`exec`의 경우 무진행 검사는 안정적인 명령 결과를 비교하고, 실행 시간, PID, 세션 ID, 작업 디렉터리 같은 변동적인 런타임 메타데이터는 무시합니다.
실행 ID를 사용할 수 있으면 최근 도구 호출 기록은 해당 실행 내에서만 평가되므로, 예약된 Heartbeat 주기와 새 실행이 이전 실행의 오래된 루프 카운트를 이어받지 않습니다.

## 권장 설정

- 더 작은 모델의 경우 `enabled: true`로 시작하고 기본값은 변경하지 마세요. 플래그십 모델은 루프 감지가 필요한 경우가 드물며 비활성화 상태로 둘 수 있습니다.
- 임계값은 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` 순서로 유지하세요.
- 오탐이 발생하는 경우:
  - `warningThreshold` 및/또는 `criticalThreshold`를 높입니다.
  - (선택 사항) `globalCircuitBreakerThreshold`를 높입니다.
  - 문제를 일으키는 감지기만 비활성화합니다.
  - 덜 엄격한 기록 컨텍스트가 필요하면 `historySize`를 줄입니다.

## Compaction 후 가드

러너가 자동 Compaction 재시도를 완료하면(컨텍스트 오버플로 이후), 짧은 시간 창의 가드를 준비해 다음 몇 번의 도구 호출을 감시합니다. 에이전트가 해당 창 안에서 _동일한_ `(toolName, args, result)` 3요소를 여러 번 내보내면, 가드는 Compaction이 루프를 끊지 못했다고 판단하고 `compaction_loop_persisted` 오류로 실행을 중단합니다.

이는 전역 `tools.loopDetection` 감지기와는 별도의 코드 경로입니다. 독립적으로 구성할 수 있습니다.

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize`: Compaction 후 가드가 준비 상태로 유지되는 도구 호출 수이자, 중단을 트리거하는 동일한 (도구, 인수, 결과) 3요소의 횟수입니다.

가드는 결과가 변경되는 경우에는 절대 중단하지 않고, 창 전체에서 결과가 바이트 단위로 동일할 때만 중단합니다. 의도적으로 범위가 좁습니다. Compaction 재시도 직후에만 작동합니다.

## 로그와 예상 동작

루프가 감지되면 OpenClaw는 루프 이벤트를 보고하고 심각도에 따라 다음 도구 주기를 차단하거나 완화합니다.
이는 정상적인 도구 접근을 유지하면서 사용자를 과도한 토큰 지출과 멈춤 상태로부터 보호합니다.

- 먼저 경고와 임시 억제를 선호하세요.
- 반복 증거가 누적될 때만 단계적으로 격상하세요.

## 참고

- `tools.loopDetection`은 에이전트 수준 재정의와 병합됩니다.
- 에이전트별 구성은 전역 값을 완전히 재정의하거나 확장합니다.
- 구성이 없으면 보호 장치는 꺼진 상태로 유지됩니다.

## 관련 항목

- [Exec 승인](/ko/tools/exec-approvals)
- [Thinking 수준](/ko/tools/thinking)
- [하위 에이전트](/ko/tools/subagents)
