---
read_when:
    - iPhone Node에서 HealthKit 요약 활성화하기
    - health.summary 호출 또는 누락된 상태 메트릭 문제 해결
    - iPhone 외부로 전송될 수 있는 건강 데이터 검토하기
summary: iPhone Node에서 개인정보 보호로 제한된 HealthKit 요약을 활성화하고 호출합니다
title: HealthKit 요약
x-i18n:
    generated_at: "2026-07-16T12:48:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit 요약

OpenClaw은 연결된 iPhone Node에서 현재 달력 날짜의 읽기 전용 요약을 요청할 수 있습니다. iPhone은 기기 내에서 집계하고 걸음 수, 수면 시간, 평균 안정 시 심박수, 운동 횟수/시간만 반환합니다. 개별 HealthKit 샘플, 소스, 메타데이터, 임상 기록, 백그라운드 수집 및 쓰기는 지원되지 않습니다.

이 기능은 기본적으로 꺼져 있습니다. iPhone에서 별도의 동의가 필요하며 Gateway에서도 권한을 부여해야 합니다.

## 요구 사항

- HealthKit에서 건강 데이터를 사용할 수 있다고 보고하는 OpenClaw iOS 앱이 실행 중인 iPhone.
- 연결되고 승인된 iPhone Node. [iOS 앱 설정](/ko/platforms/ios)을 참조하십시오.
- iPhone Node에 연결할 수 있는 최신 Gateway.
- 확인하려는 메트릭에 대해 읽을 수 있는 건강 데이터. Apple Watch는 iPhone 건강 데이터 저장소에 데이터를 제공할 수 있지만 HealthKit 요약에 OpenClaw watchOS 앱이 필요하지는 않습니다.

## 액세스 활성화

### 1. Gateway 명령 권한 부여

`openclaw.json`의 기존 `gateway.nodes.allowCommands` 배열에 `health.summary`을 추가하십시오. 이미 있는 명령은 그대로 유지하십시오.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary`은 개인정보 보호에 매우 민감한 항목으로 분류되며 iOS 플랫폼 기본값에서는 절대 허용되지 않습니다. `gateway.nodes.denyCommands`의 항목은 허용 항목보다 우선합니다. [Node 명령 정책](/ko/nodes#command-policy)을 참조하십시오.

### 2. iPhone에서 공유 활성화

iOS 앱에서 다음을 수행하십시오.

1. **Settings -> Permissions -> Privacy & Access -> Health Summaries**를 여십시오.
2. **Enable & Share Summaries**를 탭하십시오.
3. 고지 내용을 읽은 다음 Apple의 권한 시트에서 OpenClaw이 읽을 수 있는 건강 카테고리를 선택하십시오.

이 스위치는 사용자가 명시적으로 선택한 OpenClaw 공유 설정을 기록합니다. Apple이 요청한 모든 카테고리에 권한을 부여했다는 의미는 아닙니다.

건강 요약을 활성화하면 Node가 선언하는 명령 표면에 `health.summary`이 추가됩니다. 이에 따라 발생하는 Node 페어링 업데이트를 승인하십시오.

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

그런 다음 연결된 iPhone에서 유효한 `health.summary` 명령이 노출되는지 확인하십시오.

```bash
openclaw nodes describe --node "<iPhone name>"
```

## 오늘의 요약 요청

`today`만 지원됩니다. iPhone의 현재 달력과 시간대를 사용하여 현지 자정부터 요청 시각까지를 다룹니다.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

에이전트는 `nodes` 도구를 사용하여 같은 명령을 호출할 수 있습니다.

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

요약 페이로드에는 다음 항목이 포함됩니다.

| 필드                     | 의미                                          |
| ------------------------ | --------------------------------------------- |
| `period`                 | 항상 `today`                                |
| `startISO`               | ISO 시점으로 인코딩된 현지 하루 시작 시각     |
| `endISO`                 | ISO 시점으로 인코딩된 요청 시각               |
| `timeZoneIdentifier`     | iPhone 시간대 식별자                          |
| `stepCount`              | 반올림된 누적 걸음 수                         |
| `sleepDurationMinutes`   | 중복 제거 후 오늘 범위로 제한된 수면 시간     |
| `restingHeartRateBpm`    | 평균 안정 시 심박수                           |
| `workoutCount`           | 오늘 시작한 운동                              |
| `workoutDurationMinutes` | 해당 운동의 총시간                            |

메트릭 필드는 선택 사항이며 HealthKit이 읽을 수 있는 값을 반환하지 않으면 생략됩니다. 시간을 계산하기 전에 수면 단계와 중복되는 소스를 병합하므로 같은 분이 두 번 계산되지 않습니다.

## 개인정보 보호 동작

- 집계는 iPhone에서 이루어집니다. 원시 샘플은 기기 밖으로 나가지 않습니다.
- 요청된 집계 데이터는 Gateway를 통해 iPhone 밖으로 전송됩니다. 에이전트가 이를 요청하면 집계 데이터가 구성된 AI 제공업체에 전달되고 채팅 기록에 남을 수 있습니다. 직접 CLI를 호출하면 CLI 운영자에게 반환됩니다.
- OpenClaw은 읽기 액세스만 요청합니다. 건강 데이터를 추가하거나 수정할 수 없습니다.
- OpenClaw은 `health.summary`이 호출될 때만 HealthKit을 읽습니다. 백그라운드 건강 데이터 수집은 없습니다.
- HealthKit은 읽기 액세스가 거부되었는지 의도적으로 공개하지 않습니다. 메트릭이 누락되었다면 액세스가 거부되었거나, 일치하는 샘플이 없거나, 데이터 유형을 사용할 수 없다는 의미일 수 있습니다. OpenClaw은 이러한 경우를 구분할 수 없습니다.
- 요약은 개인 건강 및 피트니스 상황을 위한 것이며 진단이나 의학적 조언을 위한 것이 아닙니다.

공유를 중지하려면 **Health Summaries**로 돌아가 **Disable**을 탭하십시오. 그러면 iPhone이 Node 표면에서 건강 기능과 `health.summary` 명령을 제거합니다. 또한 `gateway.nodes.allowCommands`에서 `health.summary`을 제거하여 Gateway 측 관문을 닫을 수 있습니다.

## 문제 해결

### Node에서 명령을 선언하지 않음

iOS 앱에서 건강 요약이 활성화되어 있고 iPhone이 연결되어 있는지 확인하십시오. `openclaw nodes pending`을 실행하여 기능 업데이트가 있으면 승인한 다음 `openclaw nodes describe --node "<iPhone name>"`을 다시 검사하십시오.

### 명령에 명시적인 옵트인이 필요함

`gateway.nodes.allowCommands`에 `health.summary`을 추가하십시오. 또한 `gateway.nodes.denyCommands`에 해당 항목이 포함되어 있지 않은지 확인하십시오. 거부 목록이 우선합니다.

### `HEALTH_ACCESS_DISABLED`

앱 측 공유 스위치가 꺼져 있습니다. iPhone의 **Privacy & Access** 아래에서 **Health Summaries**를 활성화하십시오.

### 요약 요청은 성공하지만 메트릭이 누락됨

Apple의 건강 앱을 열고 오늘 데이터가 있는지 확인하십시오. Apple 건강 설정에서 OpenClaw의 액세스 권한을 검토하되, 빈 결과를 액세스 거부의 증거로 간주하지 마십시오. HealthKit은 의도적으로 그 차이를 숨깁니다.

### 이전 기간 요청 실패

이 명령은 `{"period":"today"}`만 허용합니다. 여러 날짜 및 과거 요약은 지원되지 않습니다.

## 관련 문서

- [iOS 앱](/ko/platforms/ios)
- [Node](/ko/nodes)
- [Gateway 구성 참조](/ko/gateway/configuration-reference#gateway)
- [보안 감사](/ko/gateway/security)
