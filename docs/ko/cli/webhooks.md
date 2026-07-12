---
read_when:
    - Gmail Pub/Sub 이벤트를 OpenClaw에 연결하려고 합니다
    - 전체 플래그 목록과 기본값이 필요합니다.
summary: '`openclaw webhooks`용 CLI 참조(Gmail Pub/Sub 설정 및 실행기)'
title: Webhook들
x-i18n:
    generated_at: "2026-07-12T15:08:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook 도우미 및 통합 기능입니다. 현재 이 기능은 번들된 `gog` 감시기를 기반으로 구축된 Gmail Pub/Sub 흐름으로 범위가 제한됩니다.

## 하위 명령

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| 하위 명령     | 설명                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- |
| `gmail setup` | 일회성 마법사: Gmail 감시, Pub/Sub 주제/구독 및 OpenClaw 훅 전송을 설정합니다.             |
| `gmail run`   | `gog watch serve`와 감시 자동 갱신 루프를 포그라운드에서 실행합니다.                       |

<Note>
`hooks.enabled=true`이고 `hooks.gmail.account`가 설정되면(`gmail setup`에서 설정) Gateway는 부팅 시 `gog gmail watch serve`도 자동으로 시작합니다. `gmail run`은 동일한 로직을 포그라운드에서 실행하며, 디버깅하거나 Gateway 감시기가 비활성화된 경우 유용합니다. 자동 시작 세부 정보와 `OPENCLAW_SKIP_GMAIL_WATCHER` 옵트아웃은 [Gmail Pub/Sub 통합](/ko/automation/cron-jobs#gmail-pubsub-integration)을 참조하십시오.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

`gcloud`와 `gog`가 없으면 설치하고, `gcloud`를 인증하며, Pub/Sub 주제와 구독을 생성하고, Gmail 감시를 시작한 후 `hooks.enabled=true`와 함께 `hooks.gmail` 구성을 작성합니다. `Next: openclaw webhooks gmail run`을 출력합니다.

### 필수

| 플래그              | 설명                       |
| ------------------- | -------------------------- |
| `--account <email>` | 감시할 Gmail 계정입니다.   |

### Pub/Sub 옵션

| 플래그                  | 기본값                 | 설명                                                                                                                                                            |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (없음)                 | GCP 프로젝트 ID(OAuth 클라이언트 소유자)입니다. 지정하지 않으면 주제 자체의 프로젝트 ID를 사용하고, 그다음에는 `gog` 자격 증명에서 확인된 프로젝트를 사용합니다. |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub 주제 이름입니다.                                                                                                                                        |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub 구독 이름입니다.                                                                                                                                        |
| `--label <label>`       | `INBOX`                | 감시할 Gmail 라벨입니다.                                                                                                                                        |
| `--push-endpoint <url>` | (없음)                 | 명시적인 Pub/Sub 푸시 엔드포인트입니다. Tailscale 설정보다 우선합니다.                                                                                           |

### OpenClaw 전송 옵션

| 플래그                 | 기본값                                       | 설명                         |
| ---------------------- | -------------------------------------------- | ---------------------------- |
| `--hook-url <url>`     | `hooks.path`와 Gateway 포트에서 생성         | OpenClaw Webhook URL입니다.  |
| `--hook-token <token>` | `hooks.token` 또는 생성된 토큰               | OpenClaw Webhook 토큰입니다. |
| `--push-token <token>` | 생성된 토큰                                  | `gog watch serve`에 전달되는 푸시 토큰입니다. |

### `gog watch serve` 옵션

| 플래그                | 기본값          | 설명                                                                                                                                                                       |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` 바인드 호스트입니다.                                                                                                                                     |
| `--port <port>`       | `8788`          | `gog watch serve` 포트입니다.                                                                                                                                              |
| `--path <path>`       | `/gmail-pubsub` | 명시적인 대상 없이 Tailscale이 활성화되면 프록시 처리 전에 Tailscale이 경로를 제거하므로 `/`로 강제 설정되는 `gog watch serve` 경로입니다.                                  |
| `--include-body`      | `true`          | 이메일 본문 일부를 포함합니다. 이를 끄는 CLI 플래그는 없습니다. 대신 구성에서 `hooks.gmail.includeBody: false`를 설정하십시오.                                             |
| `--max-bytes <n>`     | `20000`         | 본문 일부당 최대 바이트 수입니다.                                                                                                                                          |
| `--renew-minutes <n>` | `720` (12h)     | N분마다 Gmail 감시를 갱신합니다.                                                                                                                                            |

### Tailscale 노출

| 플래그                    | 기본값   | 설명                                                                          |
| ------------------------- | -------- | ----------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | tailscale을 통해 푸시 엔드포인트를 노출합니다: `funnel`, `serve` 또는 `off`. |
| `--tailscale-path <path>` | (없음)   | tailscale serve/funnel의 경로입니다.                                          |
| `--tailscale-target <t>`  | (없음)   | Tailscale serve/funnel 대상(포트, `host:port` 또는 URL)입니다.                 |

### 출력

| 플래그   | 설명                                           |
| -------- | ---------------------------------------------- |
| `--json` | 텍스트 대신 머신 판독 가능 요약을 출력합니다. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

`gog watch serve`와 감시 자동 갱신 루프를 포그라운드에서 실행하며, `gog watch serve`가 예기치 않게 종료되면 2s 지연 후 다시 시작합니다.

`run`은 `setup`과 동일한 Pub/Sub, OpenClaw 전송, `gog watch serve` 및 Tailscale 플래그를 허용하지만 다음은 예외입니다.

- `run`에서는 `--account`가 **선택 사항**이며, 지정하지 않으면 `hooks.gmail.account`를 사용합니다.
- `run`은 `--project`, `--push-endpoint` 또는 `--json`을 허용하지 **않습니다**.
- 각 플래그는 먼저 일치하는 `hooks.gmail.*` 구성 값(`setup`에서 작성)을 사용하고, 그다음에는 `setup`에서 사용하는 것과 동일한 기본 제공 값을 사용합니다. 단, 플래그와 `hooks.gmail.tailscale.mode`가 모두 설정되지 않은 경우 `run`에서 `--tailscale`의 기본값은 `funnel`이 아닌 `off`입니다.

| 범주              | 플래그                                                                           |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw 전송     | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
`run`에서 `--topic` 값은 짧은 주제 이름이 아니라 전체 Pub/Sub 주제 경로(`projects/.../topics/...`)입니다.
</Note>

## 관련 항목

- [CLI 참조](/ko/cli)
- [Webhook 자동화](/ko/automation/cron-jobs)
- [Gmail Pub/Sub 통합](/ko/automation/cron-jobs#gmail-pubsub-integration)
