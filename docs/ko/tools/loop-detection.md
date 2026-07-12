---
read_when:
    - 사용자가 에이전트가 도구 호출을 반복하며 멈추는 문제를 보고함
    - 반복 호출 방지 기능을 조정해야 합니다
    - 에이전트 도구/런타임 정책을 편집하고 있습니다
    - 컨텍스트 오버플로 재시도 후 `compaction_loop_persisted` 중단이 발생합니다
summary: 반복적인 도구 호출 루프를 감지하는 가드레일을 활성화하고 조정하는 방법
title: 도구 루프 감지
x-i18n:
    generated_at: "2026-07-12T01:21:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw에는 반복적인 도구 호출 패턴을 방지하는 두 가지 상호 보완적 안전장치가 있으며,
둘 다 `tools.loopDetection`에서 구성합니다.

1. **루프 감지**(`enabled`) - 기본적으로 비활성화됩니다. 순환식으로 유지되는
   도구 호출 기록을 감시하여 반복 패턴과 알 수 없는 도구에 대한 재시도를 감지합니다.
2. **Compaction 후 보호 장치**(`postCompactionGuard`) - `enabled`가 명시적으로
   `false`가 아닌 경우 활성화됩니다. Compaction 재시도 후마다 작동 준비 상태가 되며,
   에이전트가 해당 범위 내에서 동일한 `(tool, args, result)` 삼중항을 반복하면
   실행을 중단합니다.

두 안전장치를 모두 비활성화하려면 `tools.loopDetection.enabled: false`를 설정합니다.

## 이 기능이 필요한 이유

- 진행이 없는 반복 시퀀스를 감지합니다.
- 결과가 없는 고빈도 루프(동일한 도구, 동일한 입력, 반복되는 오류)를 감지합니다.
- 알려진 폴링 도구의 특정 반복 호출 패턴을 감지합니다.
- 컨텍스트 오버플로 -> Compaction -> 동일한 루프의 순환이 무한히 실행되지 않도록
  중단합니다.

## 구성 블록

문서화된 모든 필드를 표시한 전역 기본값:

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // 순환 기록 감지기의 마스터 스위치
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
        windowSize: 3, // Compaction 재시도 후 작동 준비 상태가 됨. enabled가 명시적으로 false가 아니면 실행됨
      },
    },
  },
}
```

에이전트별 재정의(선택 사항, `agents.list[].tools.loopDetection`에 설정):

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

에이전트별 설정은 전역 블록 위에 필드 단위로 덮어씌워지며(중첩된
`detectors`와 `postCompactionGuard` 포함), 에이전트는 변경하려는
필드만 설정하면 됩니다.

### 필드 동작

| 필드                             | 기본값  | 효과                                                                                                                                                           |
| -------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | 순환 기록 감지기의 마스터 스위치입니다. `false`로 설정하면 Compaction 후 보호 장치도 비활성화됩니다.                                                            |
| `historySize`                    | `30`    | 분석을 위해 보관하는 최근 도구 호출 수입니다.                                                                                                                  |
| `warningThreshold`               | `10`    | 패턴을 경고 전용으로 분류하기 전의 반복 횟수입니다.                                                                                                            |
| `criticalThreshold`              | `20`    | 진행 없는 루프 패턴을 차단하는 반복 횟수입니다. 잘못 구성된 경우 런타임이 이 값을 `warningThreshold`보다 크게 조정합니다.                                       |
| `unknownToolThreshold`           | `10`    | 동일한 사용할 수 없는 도구를 이 횟수만큼 찾지 못한 후 반복 호출을 차단합니다. `detectors`의 적용을 받지 않습니다.                                               |
| `globalCircuitBreakerThreshold`  | `30`    | 모든 감지기에 적용되는 전역 진행 없음 차단기입니다. 잘못 구성된 경우 런타임이 이 값을 `criticalThreshold`보다 크게 조정합니다. `detectors`의 적용을 받지 않습니다. |
| `detectors.genericRepeat`        | `true`  | 동일한 도구와 동일한 인수를 사용한 반복 호출에 경고하며, 해당 호출이 동일한 결과까지 반환하면 차단합니다.                                                       |
| `detectors.knownPollNoProgress`  | `true`  | 알려진 진행 없는 폴링 패턴(`action: "poll"`/`"log"`를 사용하는 `process`, `command_status`)을 감지합니다.                                                       |
| `detectors.pingPong`             | `true`  | 두 호출 간에 번갈아 발생하는 진행 없는 핑퐁 패턴을 감지합니다.                                                                                                  |
| `postCompactionGuard.windowSize` | `3`     | Compaction 후 보호 장치가 작동 준비 상태를 유지하는 시도 횟수이자, 실행을 중단시키는 동일한 삼중항의 횟수입니다.                                                |

`exec`의 경우 진행 없음 해싱은 안정적인 명령 결과(상태,
종료 코드, 시간 초과 여부 플래그, 출력)를 비교하며, 실행 시간, PID, 세션 ID,
작업 디렉터리와 같은 변동성 높은 런타임 메타데이터는 무시합니다. 외부 메시지 전송
결과는 호출마다 달라지는 ID(메시지 ID, 파일 ID, 타임스탬프)를 제거한 후 해싱하므로,
어떤 "전송됨" 결과가 다른 "전송됨" 결과와 동일한 것으로 간주되지 않습니다.
실행 ID를 사용할 수 있으면 해당 실행 내의 기록만 평가하므로, 예약된 Heartbeat
주기와 새 실행이 이전 실행의 오래된 루프 횟수를 이어받지 않습니다.

## 권장 설정

- 소형 모델의 경우 `enabled: true`를 설정하고 임계값은 기본값으로 유지합니다.
  플래그십 모델에는 순환 기록 감지가 필요한 경우가 드물므로, 마스터 스위치를
  `false`로 유지하면서도 Compaction 후 보호 장치의 이점을 얻을 수 있습니다.
- 임계값 순서를 `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold`로 유지합니다. `criticalThreshold` 또는
  `globalCircuitBreakerThreshold`를 반드시 초과해야 하는 임계값 이하로 설정하면
  런타임이 해당 값을 상향 조정합니다.
- 오탐이 발생하는 경우:
  - `warningThreshold` 및/또는 `criticalThreshold`를 높입니다.
  - 필요한 경우 `globalCircuitBreakerThreshold`를 높입니다.
  - 문제를 일으키는 특정 감지기만 비활성화합니다(`detectors.<name>: false`).
  - 기록 범위를 줄이려면 `historySize`를 낮춥니다.
- Compaction 후 보호 장치를 포함한 모든 기능을 비활성화하려면
  `tools.loopDetection.enabled: false`를 명시적으로 설정합니다.

## Compaction 후 보호 장치

컨텍스트 오버플로 후 Compaction 재시도가 발생하면, 실행기는 다음 몇 번의 도구
호출에 대해 짧은 범위의 보호 장치를 작동 준비 상태로 전환합니다. 에이전트가 해당
범위 내에서 동일한 `(toolName, argsHash, resultHash)` 삼중항을
`postCompactionGuard.windowSize`번 출력하면, 보호 장치는 Compaction으로 루프가
중단되지 않았다고 판단하고 `compaction_loop_persisted` 오류와 함께 실행을
중단합니다.

이 보호 장치는 마스터 `tools.loopDetection.enabled` 플래그의 제어를 받지만 한 가지
예외가 있습니다. 플래그가 설정되지 않았거나 `true`이면 **활성화 상태를 유지**하며,
명시적으로 `false`인 경우에만 비활성화됩니다. 이는 의도된 동작입니다. 이 보호 장치는
그렇지 않으면 제한 없이 토큰을 소모할 Compaction 루프에서 벗어나기 위해 존재하므로,
구성을 설정하지 않은 사용자도 보호를 받습니다.

```json5
{
  tools: {
    loopDetection: {
      // 마스터 스위치. 보호 장치와 순환 감지기를 함께 비활성화하려면 false로 설정
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // 기본값
      },
    },
  },
}
```

- `windowSize`가 낮을수록 더 엄격합니다(중단 전 시도 횟수가 적음).
- `windowSize`가 높을수록 에이전트에 더 많은 복구 시도를 허용합니다.
- 결과가 변경되는 동안에는 보호 장치가 실행을 중단하지 않습니다. 범위 전체에서
  바이트 단위로 동일한 결과가 발생하는 경우에만 작동합니다.
- 실행의 다른 시점이 아니라 Compaction 재시도 직후에만 작동 준비 상태가 됩니다.

<Note>
  `tools.loopDetection` 블록을 작성한 적이 없더라도 마스터 플래그가 명시적으로 `false`가 아니면 Compaction 후 보호 장치가 실행됩니다. 확인하려면 Compaction 이벤트 직후 Gateway 로그에서 `post-compaction guard armed for N attempts`를 찾으십시오.
</Note>

## 로그 및 예상 동작

루프가 감지되면 OpenClaw는 루프 이벤트를 기록하고 심각도에 따라 경고하거나
다음 도구 주기를 차단합니다. 이를 통해 정상적인 도구 접근은 유지하면서 통제되지
않는 토큰 소비와 멈춤 현상을 방지합니다.

- 경고가 먼저 발생합니다.
- 패턴이 경고 임계값을 넘어 지속되면 차단됩니다.
- 위험 임계값에 도달하면 다음 도구 주기를 차단하고 실행 기록에 명확한
  루프 감지 사유를 표시합니다.
- Compaction 후 보호 장치는 문제가 된 도구와 동일 호출 횟수를 명시하는
  `compaction_loop_persisted` 오류를 발생시킵니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec 승인" href="/ko/tools/exec-approvals" icon="shield">
    셸 실행에 대한 허용/거부 정책입니다.
  </Card>
  <Card title="사고 수준" href="/ko/tools/thinking" icon="brain">
    추론 노력 수준과 제공자 정책의 상호 작용입니다.
  </Card>
  <Card title="하위 에이전트" href="/ko/tools/subagents" icon="users">
    통제되지 않는 동작의 범위를 제한하기 위한 격리된 에이전트 생성입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-tools#toolsloopdetection" icon="gear">
    전체 `tools.loopDetection` 스키마와 병합 의미 체계입니다.
  </Card>
</CardGroup>
