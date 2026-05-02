---
read_when:
    - 제공자 재시도 동작 또는 기본값 업데이트
    - 프로바이더 전송 오류 또는 속도 제한 디버깅
summary: 아웃바운드 제공자 호출에 대한 재시도 정책
title: 재시도 정책
x-i18n:
    generated_at: "2026-05-02T20:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## 목표

- 다단계 흐름별이 아니라 HTTP 요청별로 재시도합니다.
- 현재 단계만 재시도하여 순서를 보존합니다.
- 멱등성이 없는 작업이 중복되지 않도록 합니다.

## 기본값

- 시도 횟수: 3
- 최대 지연 한도: 30000 ms
- 지터: 0.1(10%)
- 공급자 기본값:
  - Telegram 최소 지연: 400 ms
  - Discord 최소 지연: 500 ms

## 동작

### 모델 공급자

- OpenClaw는 공급자 SDK가 일반적인 짧은 재시도를 처리하도록 합니다.
- Anthropic 및 OpenAI와 같은 Stainless 기반 SDK의 경우, 재시도 가능한 응답
  (`408`, `409`, `429`, `5xx`)에는 `retry-after-ms` 또는
  `retry-after`가 포함될 수 있습니다. 해당 대기 시간이 60초보다 길면 OpenClaw는
  `x-should-retry: false`를 주입하여 SDK가 즉시 오류를 노출하게 하고, 모델
  장애 조치가 다른 인증 프로필 또는 대체 모델로 전환할 수 있게 합니다.
- 한도는 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`로 재정의합니다.
  SDK가 긴 `Retry-After` 대기를 내부적으로 따르게 하려면 `0`, `false`, `off`, `none` 또는 `disabled`로 설정합니다.

### Discord

- 속도 제한 오류(HTTP 429), 요청 시간 초과, HTTP 5xx 응답,
  DNS 조회 실패, 연결 재설정, 소켓 닫힘, fetch 실패와 같은 일시적인 전송 실패에서 재시도합니다.
- 사용 가능한 경우 Discord `retry_after`를 사용하고, 그렇지 않으면 지수 백오프를 사용합니다.

### Telegram

- 일시적 오류(429, 시간 초과, 연결/재설정/닫힘, 일시적으로 사용할 수 없음)에서 재시도합니다.
- 사용 가능한 경우 `retry_after`를 사용하고, 그렇지 않으면 지수 백오프를 사용합니다.
- Markdown 파싱 오류는 재시도하지 않으며, 일반 텍스트로 폴백합니다.

## 구성

`~/.openclaw/openclaw.json`에서 공급자별 재시도 정책을 설정합니다.

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 참고

- 재시도는 요청별(메시지 전송, 미디어 업로드, 반응, 투표, 스티커)로 적용됩니다.
- 복합 흐름은 완료된 단계를 재시도하지 않습니다.

## 관련

- [모델 장애 조치](/ko/concepts/model-failover)
- [명령 큐](/ko/concepts/queue)
