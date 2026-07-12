---
read_when:
    - 시간대 처리 방식을 빠르게 이해하고 싶습니다
    - 시간대를 설정하거나 재정의할 위치를 결정하고 있습니다
summary: OpenClaw에서 시간대가 표시되는 위치 — 엔벌로프, 도구 페이로드, 시스템 프롬프트
title: 시간대
x-i18n:
    generated_at: "2026-07-12T00:44:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw은 모델이 제공자별 로컬 시계가 뒤섞인 시간 대신 **하나의 기준 시간**을 보도록 타임스탬프를 표준화합니다. 시간대를 표시하는 세 가지 표면이 있으며, 각각 용도가 다릅니다.

## 세 가지 시간대 표면

| 표면              | 표시 내용                                                                                                       | 기본값                                      | 구성 방법                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| 메시지 봉투       | 인바운드 채널 메시지를 감쌉니다: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                              | 호스트 로컬                                 | `agents.defaults.envelopeTimezone`                      |
| 도구 페이로드     | 채널 `readMessages` 유형 도구는 원시 제공자 시간과 정규화된 `timestampMs` / `timestampUtc`를 반환합니다          | UTC 필드는 항상 포함됨                      | 구성할 수 없음. 제공자 네이티브 타임스탬프를 보존함     |
| 시스템 프롬프트   | **시간대만** 포함하는 작은 `Current Date & Time` 블록입니다(캐시 안정성을 위해 시각 값은 포함하지 않음)         | `userTimezone` 미설정 시 호스트 시간대      | `agents.defaults.userTimezone`                          |

시스템 프롬프트는 턴 간 프롬프트 캐싱을 안정적으로 유지하기 위해 의도적으로 실시간 시각을 생략합니다. 에이전트에 현재 시간이 필요하면 `session_status`를 호출합니다.

## 사용자 시간대 설정

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

`userTimezone`이 설정되지 않은 경우 OpenClaw은 런타임에 `Intl.DateTimeFormat().resolvedOptions().timeZone`을 통해 호스트 시간대를 확인합니다(구성에 기록하지 않음). `agents.defaults.timeFormat`(`auto` | `12` | `24`)은 봉투와 후속 표면의 12시간제/24시간제 렌더링을 제어하지만, 시스템 프롬프트 섹션에는 적용되지 않습니다.

## 봉투 시간대 값

`agents.defaults.envelopeTimezone`은 다음 값을 허용합니다.

- `"local"`(기본값) 또는 `"host"` - 호스트 머신의 시간대입니다.
- `"utc"` 또는 `"gmt"` - UTC입니다.
- `"user"` - 확인된 `agents.defaults.userTimezone`입니다(설정되지 않은 경우 호스트 시간대로 대체).
- `"Europe/Vienna"`과 같은 명시적인 IANA 시간대 문자열입니다.

## 재정의해야 하는 경우

- **`"utc"` 사용**: 서로 다른 지역의 호스트에서 일관된 타임스탬프를 유지하거나 UTC 기준 진단/로그 출력과 일치시킬 때 사용합니다.
- **`"user"` 사용**: Gateway 호스트가 실행되는 시간대와 관계없이 봉투를 구성된 사용자 시간대에 맞출 때 사용합니다.
- **고정 IANA 시간대 사용**: Gateway 호스트가 한 시간대에 있지만 호스트가 이전되더라도 봉투는 항상 다른 시간대로 표시되어야 할 때 사용합니다.
- **`envelopeTimestamp: "off"` 설정**: 대화에 타임스탬프 컨텍스트가 유용하지 않을 때 설정합니다. 이 설정은 봉투, 에이전트 직접 프롬프트 접두사, 포함된 모델 입력 접두사에서 절대 타임스탬프를 제거합니다.

전체 동작 참조, 제공자별 예시, 경과 시간 형식은 [날짜 및 시간](/ko/date-time)을 참조하세요.

## 관련 항목

- [날짜 및 시간](/ko/date-time) - 봉투/도구/프롬프트의 전체 동작 및 예시입니다.
- [Heartbeat](/ko/gateway/heartbeat) - 활동 시간은 예약에 시간대를 사용합니다.
- [Cron 작업](/ko/automation/cron-jobs) - Cron 표현식은 예약에 시간대를 사용합니다.
