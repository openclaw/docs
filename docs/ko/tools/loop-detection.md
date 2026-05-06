---
read_when:
    - 사용자가 에이전트가 도구 호출을 반복하는 상태로 멈춘다고 보고합니다
    - 반복 호출 보호를 조정해야 합니다
    - 에이전트 도구/런타임 정책을 편집하고 있습니다
    - 컨텍스트 오버플로 재시도 후 `compaction_loop_persisted` 중단이 발생합니다
summary: 반복적인 도구 호출 루프를 감지하는 가드레일을 활성화하고 조정하는 방법
title: 도구 루프 감지
x-i18n:
    generated_at: "2026-05-06T06:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw에는 반복적인 도구 호출 패턴을 위한 두 가지 협력형 가드레일이 있습니다.

1. **루프 감지**(`tools.loopDetection.enabled`) — 기본적으로 비활성화되어 있습니다. 반복 패턴과 알 수 없는 도구 재시도를 확인하기 위해 롤링 도구 호출 기록을 감시합니다.
2. **Compaction 이후 가드**(`tools.loopDetection.postCompactionGuard`) — `tools.loopDetection.enabled`가 명시적으로 `false`가 아닌 한 기본적으로 활성화됩니다. 모든 Compaction 재시도 후 준비 상태가 되며, 에이전트가 창 내에서 동일한 `(tool, args, result)` 트리플을 내보내면 실행을 중단합니다.

둘 다 같은 `tools.loopDetection` 블록 아래에서 구성되지만, Compaction 이후 가드는 마스터 스위치가 명시적으로 꺼져 있지 않을 때마다 실행됩니다. 두 표면을 모두 끄려면 `tools.loopDetection.enabled: false`를 설정하세요.

## 존재 이유

- 진행이 없는 반복 시퀀스를 감지합니다.
- 고빈도 무결과 루프(같은 도구, 같은 입력, 반복 오류)를 감지합니다.
- 알려진 폴링 도구의 특정 반복 호출 패턴을 감지합니다.
- 컨텍스트 오버플로 후 Compaction, 그다음 동일 루프 주기가 무기한 실행되는 것을 방지합니다.

## 구성 블록

문서화된 모든 필드를 표시한 전역 기본값:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
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

| 필드                             | 기본값  | 효과                                                                                                                            |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | 롤링 기록 감지기의 마스터 스위치입니다. `false`로 설정하면 Compaction 이후 가드도 비활성화됩니다.                               |
| `historySize`                    | `30`    | 분석을 위해 보관되는 최근 도구 호출 수입니다.                                                                                   |
| `warningThreshold`               | `10`    | 패턴이 경고 전용으로 분류되기 전 임계값입니다.                                                                                  |
| `criticalThreshold`              | `20`    | 반복 루프 패턴을 차단하기 위한 임계값입니다.                                                                                    |
| `unknownToolThreshold`           | `10`    | 사용할 수 없는 동일한 도구에 대한 반복 호출을 이 횟수만큼 실패한 뒤 차단합니다.                                                  |
| `globalCircuitBreakerThreshold`  | `30`    | 모든 감지기에 걸친 전역 무진행 차단기 임계값입니다.                                                                             |
| `detectors.genericRepeat`        | `true`  | 같은 도구 + 같은 매개변수 패턴의 반복을 감지합니다.                                                                             |
| `detectors.knownPollNoProgress`  | `true`  | 상태 변화가 없는 알려진 폴링 유사 패턴을 감지합니다.                                                                            |
| `detectors.pingPong`             | `true`  | 교대로 반복되는 핑퐁 패턴을 감지합니다.                                                                                         |
| `postCompactionGuard.windowSize` | `3`     | 가드가 준비 상태로 유지되는 Compaction 이후 도구 호출 수이자, 실행을 중단하는 동일 트리플 횟수입니다.                           |

`exec`의 경우 무진행 검사는 안정적인 명령 결과를 비교하며, 지속 시간, PID, 세션 ID, 작업 디렉터리 같은 변동성 런타임 메타데이터는 무시합니다. 실행 ID를 사용할 수 있으면 최근 도구 호출 기록은 해당 실행 내에서만 평가되므로 예약된 Heartbeat 주기와 새 실행이 이전 실행의 오래된 루프 횟수를 상속하지 않습니다.

## 권장 설정

- 더 작은 모델의 경우 `enabled: true`를 설정하고 임계값은 기본값으로 둡니다. 플래그십 모델은 롤링 기록 감지가 거의 필요하지 않으며, 마스터 스위치를 `false`로 두면서도 Compaction 이후 가드의 이점을 계속 얻을 수 있습니다.
- 임계값 순서는 `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`로 유지하세요.
- 오탐이 발생하는 경우:
  - `warningThreshold` 및/또는 `criticalThreshold`를 높입니다.
  - 선택적으로 `globalCircuitBreakerThreshold`를 높입니다.
  - 문제를 일으키는 특정 감지기만 비활성화합니다(`detectors.<name>: false`).
  - 덜 엄격한 기록 컨텍스트를 위해 `historySize`를 줄입니다.
- Compaction 이후 가드를 포함해 모든 것을 비활성화하려면 `tools.loopDetection.enabled: false`를 명시적으로 설정하세요.

## Compaction 이후 가드

러너가 컨텍스트 오버플로 후 Compaction 재시도를 완료하면, 다음 몇 번의 도구 호출을 감시하는 짧은 창 가드를 준비 상태로 만듭니다. 에이전트가 창 내에서 동일한 `(toolName, argsHash, resultHash)` 트리플을 여러 번 내보내면, 가드는 Compaction이 루프를 끊지 못했다고 판단하고 `compaction_loop_persisted` 오류로 실행을 중단합니다.

가드는 마스터 `tools.loopDetection.enabled` 플래그에 의해 제어되지만 한 가지 예외가 있습니다. 플래그가 설정되지 않았거나 `true`이면 **활성화된 상태를 유지**하고, 플래그가 명시적으로 `false`일 때만 비활성화됩니다. 이는 의도된 동작입니다. 가드는 그렇지 않으면 제한 없이 토큰을 소모할 Compaction 루프를 벗어나기 위해 존재하므로, 구성이 없는 사용자도 보호를 받습니다.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- 낮은 `windowSize`는 더 엄격합니다(중단 전 시도 횟수가 더 적음).
- 높은 `windowSize`는 에이전트에 더 많은 복구 시도를 허용합니다.
- 결과가 바뀌고 있을 때는 가드가 절대 중단하지 않으며, 창 전체에서 결과가 바이트 단위로 동일할 때만 중단합니다.
- 의도적으로 범위가 좁습니다. Compaction 재시도 직후에만 작동합니다.

<Note>
  Compaction 이후 가드는 `tools.loopDetection` 블록을 작성한 적이 없더라도 마스터 플래그가 명시적으로 `false`가 아닌 한 실행됩니다. 확인하려면 Compaction 이벤트 직후 Gateway 로그에서 `post-compaction guard armed for N attempts`를 찾으세요.
</Note>

## 로그와 예상 동작

루프가 감지되면 OpenClaw는 루프 이벤트를 보고하고 심각도에 따라 다음 도구 주기를 완화하거나 차단합니다. 이를 통해 정상적인 도구 접근은 유지하면서도 사용자를 과도한 토큰 지출과 잠김으로부터 보호합니다.

- 경고가 먼저 발생합니다.
- 패턴이 경고 임계값을 넘어서 계속되면 억제가 이어집니다.
- 심각 임계값은 다음 도구 주기를 차단하고 실행 기록에 명확한 루프 감지 이유를 표시합니다.
- Compaction 이후 가드는 문제가 된 도구 이름과 동일 호출 횟수를 포함한 `compaction_loop_persisted` 오류를 내보냅니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec 승인" href="/ko/tools/exec-approvals" icon="shield">
    셸 실행에 대한 허용/거부 정책입니다.
  </Card>
  <Card title="사고 수준" href="/ko/tools/thinking" icon="brain">
    추론 노력 수준과 제공자 정책 상호작용입니다.
  </Card>
  <Card title="하위 에이전트" href="/ko/tools/subagents" icon="users">
    폭주 동작을 제한하기 위해 격리된 에이전트를 생성합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    전체 `tools.loopDetection` 스키마와 병합 의미론입니다.
  </Card>
</CardGroup>
