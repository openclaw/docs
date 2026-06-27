---
read_when:
    - 모델 또는 사용자에게 타임스탬프가 표시되는 방식을 변경하고 있습니다
    - 메시지 또는 시스템 프롬프트 출력의 시간 형식을 디버깅하고 있습니다
summary: 엔벨로프, 프롬프트, 도구, 커넥터 전반의 날짜 및 시간 처리
title: 날짜 및 시간
x-i18n:
    generated_at: "2026-06-27T17:26:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw는 기본적으로 **전송 타임스탬프에는 호스트 로컬 시간**을 사용하고, **시스템 프롬프트에서만 사용자 시간대**를 사용합니다.
Provider 타임스탬프는 보존되므로 도구가 고유한 의미 체계를 유지합니다(현재 시간은 `session_status`를 통해 사용할 수 있음).

## 메시지 엔벌로프(기본값: 로컬)

인바운드 메시지는 타임스탬프(초 단위 정밀도)로 래핑됩니다.

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

이 엔벌로프 타임스탬프는 Provider 시간대와 관계없이 **기본적으로 호스트 로컬**입니다.

이 동작은 재정의할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"`는 UTC를 사용합니다.
- `envelopeTimezone: "local"`은 호스트 시간대를 사용합니다.
- `envelopeTimezone: "user"`는 `agents.defaults.userTimezone`을 사용합니다(호스트 시간대로 폴백).
- 고정 영역에는 명시적인 IANA 시간대(예: `"America/Chicago"`)를 사용합니다.
- `envelopeTimestamp: "off"`는 엔벌로프 헤더, 직접 에이전트 프롬프트 접두사, 임베드된 모델 입력 접두사에서 절대 타임스탬프를 제거합니다.
- `envelopeElapsed: "off"`는 경과 시간 접미사(`+2m` 스타일)를 제거합니다.

### 예시

**로컬(기본값):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**사용자 시간대:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**경과 시간 활성화:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## 시스템 프롬프트: 현재 날짜와 시간

사용자 시간대를 알고 있으면, 시스템 프롬프트에는 프롬프트 캐싱을 안정적으로 유지하기 위해 **시간대만** 포함하는(시계/시간 형식 없음) 전용
**현재 날짜 및 시간** 섹션이 포함됩니다.

```
Time zone: America/Chicago
```

에이전트가 현재 시간이 필요하면 `session_status` 도구를 사용하세요. 상태
카드에는 타임스탬프 줄이 포함됩니다.

## 시스템 이벤트 줄(기본값: 로컬)

에이전트 컨텍스트에 삽입되는 대기 중인 시스템 이벤트에는 메시지 엔벌로프와 동일한
시간대 선택(기본값: 호스트 로컬)을 사용하는 타임스탬프가 접두사로 붙습니다.

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 사용자 시간대 + 형식 구성

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

- `userTimezone`은 프롬프트 컨텍스트의 **사용자 로컬 시간대**를 설정합니다.
- `timeFormat`은 프롬프트의 **12시간/24시간 표시**를 제어합니다. `auto`는 OS 환경설정을 따릅니다.

## 시간 형식 감지(auto)

`timeFormat: "auto"`일 때 OpenClaw는 OS 환경설정(macOS/Windows)을 검사하고
로캘 형식으로 폴백합니다. 감지된 값은 반복적인 시스템 호출을 피하기 위해 **프로세스별로 캐시**됩니다.

## 도구 페이로드 + 커넥터(원시 Provider 시간 + 정규화된 필드)

채널 도구는 **Provider 네이티브 타임스탬프**를 반환하고 일관성을 위해 정규화된 필드를 추가합니다.

- `timestampMs`: 에포크 밀리초(UTC)
- `timestampUtc`: ISO 8601 UTC 문자열

원시 Provider 필드는 아무것도 손실되지 않도록 보존됩니다.

- Slack: API의 에포크 유사 문자열
- Discord: UTC ISO 타임스탬프
- Telegram/WhatsApp: Provider별 숫자/ISO 타임스탬프

로컬 시간이 필요하면 알려진 시간대를 사용해 다운스트림에서 변환하세요.

## 관련 문서

- [시스템 프롬프트](/ko/concepts/system-prompt)
- [시간대](/ko/concepts/timezone)
- [메시지](/ko/concepts/messages)
