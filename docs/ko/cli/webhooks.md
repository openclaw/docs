---
read_when:
    - Gmail Pub/Sub 이벤트를 OpenClaw에 연결하려고 합니다
    - 전체 플래그 목록과 기본값이 필요합니다
summary: '`openclaw webhooks`에 대한 CLI 참조(Gmail Pub/Sub 설정 및 실행기)'
title: Webhook
x-i18n:
    generated_at: "2026-05-10T19:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw webhooks`

Webhook 헬퍼 및 통합. 현재 이 인터페이스는 번들된 `gog` 감시기와 통합되는 Gmail Pub/Sub 흐름으로 범위가 지정되어 있습니다.

## 하위 명령

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| 하위 명령     | 설명                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | Gmail watch, Pub/Sub 주제/구독, OpenClaw Webhook 전달 대상을 구성합니다.                    |
| `gmail run`   | `gog watch serve`와 watch 자동 갱신 루프를 실행합니다.                                      |

## `webhooks gmail setup`

Gmail watch, Pub/Sub, OpenClaw Webhook 전달을 구성합니다.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### 필수

| 플래그              | 설명                    |
| ------------------- | ----------------------- |
| `--account <email>` | 감시할 Gmail 계정입니다. |

### Pub/Sub 옵션

| 플래그                  | 기본값                 | 설명                                                    |
| ----------------------- | ---------------------- | ------------------------------------------------------- |
| `--project <id>`        | (없음)                 | GCP 프로젝트 id(OAuth 클라이언트 소유자)입니다.         |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub 주제 이름입니다.                                |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub 구독 이름입니다.                                |
| `--label <label>`       | `INBOX`                | 감시할 Gmail 라벨입니다.                                |
| `--push-endpoint <url>` | (없음)                 | 명시적 Pub/Sub 푸시 엔드포인트입니다. Tailscale보다 우선합니다. |

### OpenClaw 전달 옵션

| 플래그                 | 기본값 | 설명                            |
| ---------------------- | ------- | ------------------------------- |
| `--hook-url <url>`     | (없음)  | OpenClaw Webhook URL입니다.     |
| `--hook-token <token>` | (없음)  | OpenClaw Webhook 토큰입니다.    |
| `--push-token <token>` | (없음)  | `gog watch serve`로 전달되는 푸시 토큰입니다. |

### `gog watch serve` 옵션

| 플래그                | 기본값          | 설명                                                       |
| --------------------- | --------------- | ---------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` 바인드 호스트입니다.                     |
| `--port <port>`       | `8788`          | `gog watch serve` 포트입니다.                              |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` 경로입니다.                              |
| `--include-body`      | `true`          | 이메일 본문 스니펫을 포함합니다. 비활성화하려면 `--no-include-body`를 전달하세요. |
| `--max-bytes <n>`     | `20000`         | 본문 스니펫당 최대 바이트 수입니다.                       |
| `--renew-minutes <n>` | `720` (12h)     | N분마다 Gmail watch를 갱신합니다.                          |

### Tailscale 노출

| 플래그                    | 기본값   | 설명                                                         |
| ------------------------- | -------- | ------------------------------------------------------------ |
| `--tailscale <mode>`      | `funnel` | tailscale을 통해 푸시 엔드포인트를 노출합니다: `funnel`, `serve` 또는 `off`. |
| `--tailscale-path <path>` | (없음)   | tailscale serve/funnel 경로입니다.                           |
| `--tailscale-target <t>`  | (없음)   | Tailscale serve/funnel 대상입니다(포트, `host:port` 또는 URL). |

### 출력

| 플래그   | 설명                                             |
| -------- | ------------------------------------------------ |
| `--json` | 텍스트 대신 기계가 읽을 수 있는 요약을 출력합니다. |

## `webhooks gmail run`

`gog watch serve`와 watch 자동 갱신 루프를 포그라운드에서 실행합니다.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run`은 `setup`과 동일한 `gog watch serve`, OpenClaw 전달, Pub/Sub, Tailscale 플래그를 허용하지만 다음은 예외입니다.

- `--account`는 `run`에서 **선택 사항**입니다(구성된 계정으로 대체됩니다).
- `run`은 `--project`, `--push-endpoint` 또는 `--json`을 허용하지 **않습니다**.
- `run` 플래그에는 내장 기본값이 없습니다. 누락된 값은 `setup`이 작성한 값으로 대체됩니다.

| 범주              | 플래그                                                                           |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw 전달     | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
`run`의 경우 `--topic` 값은 짧은 주제 이름이 아니라 전체 Pub/Sub 주제 경로(`projects/.../topics/...`)입니다.
</Note>

## 엔드 투 엔드 흐름

이러한 CLI 명령과 함께 사용하는 GCP 프로젝트, OAuth, Gateway 측 설정은 [Gmail Pub/Sub 통합](/ko/automation/cron-jobs#gmail-pubsub-integration)을 참조하세요.

## 관련

- [CLI 참조](/ko/cli)
- [Webhook 자동화](/ko/automation/cron-jobs)
- [Gmail Pub/Sub](/ko/automation/cron-jobs#gmail-pubsub-integration)
