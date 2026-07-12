---
read_when:
    - 제공자 재시도 동작 또는 기본값 업데이트
    - 제공자 전송 오류 또는 속도 제한 디버깅
summary: 아웃바운드 공급자 호출 재시도 정책
title: 재시도 정책
x-i18n:
    generated_at: "2026-07-12T00:46:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## 목표

- 여러 단계의 흐름 단위가 아니라 각 HTTP 요청 단위로 재시도합니다.
- 현재 단계만 재시도하여 순서를 유지합니다.
- 멱등성이 없는 작업의 중복 실행을 방지합니다.

## 기본값

| 설정                  | 기본값    |
| --------------------- | --------- |
| 시도 횟수             | 3         |
| 최대 지연 상한        | 30000 ms  |
| 지터                  | 0.1 (10%) |
| Telegram 최소 지연    | 400 ms    |
| Discord 최소 지연     | 500 ms    |

## 동작

### 모델 제공자

- OpenClaw는 일반적인 짧은 재시도를 제공자 SDK가 처리하도록 합니다.
- Anthropic 및 OpenAI와 같은 Stainless 기반 SDK에서 재시도 가능한 응답(`408`, `409`, `429`, `5xx`)에는 `retry-after-ms` 또는 `retry-after`가 포함될 수 있습니다. 이 대기 시간이 60초보다 길면 OpenClaw는 `x-should-retry: false`를 주입하여 SDK가 오류를 즉시 노출하도록 하고, 모델 장애 조치가 다른 인증 프로필이나 대체 모델로 전환할 수 있게 합니다.
- `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`로 상한을 재정의합니다. SDK가 긴 `Retry-After` 대기를 내부적으로 따르도록 하려면 `0`, `false`, `off`, `none` 또는 `disabled`로 설정합니다.

### Discord

- 속도 제한 오류(HTTP 429), 요청 시간 초과, HTTP 5xx 응답 및 DNS 조회 실패, 연결 재설정, 소켓 종료, 가져오기 실패와 같은 일시적인 전송 오류가 발생하면 재시도합니다.
- 사용할 수 있으면 Discord의 `retry_after`를 사용하고, 그렇지 않으면 지수 백오프를 사용합니다.

### Telegram

- 일시적인 오류(429, 시간 초과, 연결/재설정/종료, 일시적으로 사용할 수 없음)가 발생하면 재시도합니다.
- 사용할 수 있으면 `retry_after`를 사용하고, 그렇지 않으면 지수 백오프를 사용합니다.
- HTML/Markdown 구문 분석 오류는 재시도하지 않으며, 첫 번째 시도에서 일반 텍스트로 대체합니다.

## 구성

`~/.openclaw/openclaw.json`에서 제공자별 재시도 정책을 설정합니다.

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

- 재시도는 각 요청(메시지 전송, 미디어 업로드, 반응, 투표, 스티커) 단위로 적용됩니다.
- 복합 흐름에서는 완료된 단계를 재시도하지 않습니다.

## 관련 문서

- [모델 장애 조치](/ko/concepts/model-failover)
- [명령 큐](/ko/concepts/queue)
