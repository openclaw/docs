---
read_when:
    - 모델 또는 사용자에게 타임스탬프가 표시되는 방식을 변경하고 있습니다
    - 메시지 또는 시스템 프롬프트 출력의 시간 형식을 디버깅하는 경우
summary: 엔벌로프, 프롬프트, 도구 및 커넥터 전반의 날짜 및 시간 처리
title: 날짜 및 시간
x-i18n:
    generated_at: "2026-07-12T00:43:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw은 **전송 타임스탬프에 호스트 현지 시간을 사용**하며 시스템 프롬프트에는 **시간대만** 포함합니다.
도구가 공급자의 고유 의미 체계를 유지하도록 공급자 타임스탬프는 보존됩니다. 에이전트에 현재
시간이 필요하면 `session_status` 도구를 실행합니다.

## 메시지 봉투(기본값: 현지 시간)

수신 메시지는 요일과 초 단위 정밀도의 타임스탬프로 감싸집니다.

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

봉투 타임스탬프는 공급자 시간대와 관계없이 **기본적으로 호스트 현지 시간**입니다.
`agents.defaults`에서 재정의할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA 시간대
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

| 키                  | 값                                                   | 동작                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local`(기본값), `utc`, `user`, 명시적 IANA 이름     | `user`는 `agents.defaults.userTimezone`을 사용합니다(설정하지 않으면 호스트 시간대). 명시적 IANA 이름(예: `"America/Chicago"`)은 고정 시간대를 지정하며, 인식할 수 없는 이름은 UTC로 대체됩니다. |
| `envelopeTimestamp` | `on`(기본값), `off`                                  | `off`는 봉투 헤더, 에이전트 직접 프롬프트 접두사, 포함된 모델 입력 접두사에서 절대 타임스탬프를 제거합니다.                                                                                   |
| `envelopeElapsed`   | `on`(기본값), `off`                                  | `off`는 세션의 이전 메시지 이후 경과 시간을 나타내는 접미사(`+30s` / `+2m` 형식)를 제거합니다.                                                                                              |

### 예시

**현지 시간(기본값):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**사용자 시간대:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**`envelopeTimezone: "utc"`를 사용한 경과 시간:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## 시스템 프롬프트: 현재 날짜 및 시간

프롬프트 캐싱을 안정적으로 유지하기 위해 시스템 프롬프트에는 시계 시각이나 시간 형식 없이
**시간대만** 표시하는 **현재 날짜 및 시간** 섹션이 포함됩니다.

```
Time zone: America/Chicago
```

설정된 경우 시간대는 `agents.defaults.userTimezone`이며, 그렇지 않으면 호스트 시간대입니다.
또한 시스템 프롬프트는 현재 날짜, 시간 또는 요일이 필요할 때마다 에이전트가
`session_status` 도구를 실행하도록 지시합니다.

## 시스템 이벤트 줄(기본값: 현지 시간)

에이전트 컨텍스트에 삽입되는 대기 중인 시스템 이벤트에는 메시지 봉투와 동일한
`envelopeTimezone` 선택을 사용한 타임스탬프 접두사가 붙습니다(기본값: 호스트 현지 시간).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 사용자 시간대 및 형식 구성

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone`은 프롬프트 컨텍스트의 **사용자 현지 시간대**를 설정합니다(`envelopeTimezone: "user"`에도 사용).
- `timeFormat`은 프롬프트에 표시되는 시간의 **12시간제/24시간제 표시**를 제어합니다. `auto`는 운영 체제 환경설정을 따릅니다.

## 시간 형식 감지(auto)

`timeFormat: "auto"`인 경우 OpenClaw은 운영 체제 환경설정(macOS 및 Windows)을
확인하고, 확인할 수 없으면 로캘 형식을 사용합니다. 감지된 값은 반복적인 시스템 호출을
방지하기 위해 **프로세스별로 캐시**됩니다.

## 도구 페이로드 및 커넥터(공급자의 원시 시간 및 정규화된 필드)

채널 도구는 **공급자 고유 타임스탬프**를 반환하며 일관성을 위해 정규화된 필드를 추가합니다.

- `timestampMs`: 에포크 밀리초(UTC)
- `timestampUtc`: ISO 8601 UTC 문자열

정보가 손실되지 않도록 공급자의 원시 필드는 보존됩니다.

- Discord: UTC ISO 타임스탬프
- Slack: API의 에포크 형식 문자열
- Telegram/WhatsApp: 공급자별 숫자/ISO 타임스탬프

현지 시간이 필요하면 알려진 시간대를 사용하여 후속 처리 단계에서 변환하십시오.

## 관련 문서

- [시스템 프롬프트](/ko/concepts/system-prompt)
- [시간대](/ko/concepts/timezone)
- [메시지](/ko/concepts/messages)
