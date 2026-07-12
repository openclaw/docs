---
read_when:
    - voice-call Plugin을 사용하며 모든 CLI 진입점을 원합니다.
    - setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose 및 start에 대한 플래그 표와 기본값이 필요합니다.
summary: '`openclaw voicecall`의 CLI 참조(음성 통화 Plugin 명령 표면)'
title: 음성 통화
x-i18n:
    generated_at: "2026-07-12T15:06:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall`은 Plugin에서 제공하는 명령입니다. 음성 통화 Plugin이 설치되고 활성화된 경우에만 표시됩니다.

Gateway가 실행 중이면 운영 명령(`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`)은 해당 Gateway의 음성 통화 런타임으로 라우팅됩니다. 연결 가능한 Gateway가 없으면 독립 실행형 CLI 런타임으로 대체됩니다.

## 하위 명령

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| 하위 명령 | 설명                                                                  |
| ---------- | --------------------------------------------------------------------- |
| `setup`    | 제공자 및 Webhook 준비 상태 검사를 표시합니다.                        |
| `smoke`    | 준비 상태 검사를 실행하며, `--yes`를 지정한 경우에만 실제 테스트 전화를 겁니다. |
| `call`     | 발신 음성 통화를 시작합니다.                                          |
| `start`    | `--to`가 필수이고 `--message`가 선택 사항인 `call`의 별칭입니다.       |
| `continue` | 메시지를 말하고 다음 응답을 기다립니다.                               |
| `speak`    | 응답을 기다리지 않고 메시지를 말합니다.                               |
| `dtmf`     | 활성 통화에 DTMF 숫자를 전송합니다.                                   |
| `end`      | 활성 통화를 종료합니다.                                               |
| `status`   | 활성 통화 또는 `--call-id`로 지정한 하나의 통화를 검사합니다.         |
| `tail`     | `calls.jsonl`을 실시간으로 추적합니다(제공자 테스트 중 유용함).        |
| `latency`  | `calls.jsonl`의 턴 지연 시간 메트릭을 요약합니다.                     |
| `expose`   | Webhook 엔드포인트의 Tailscale Serve/Funnel을 전환합니다.              |

## 설정 및 스모크 테스트

### `setup`

기본적으로 사람이 읽을 수 있는 준비 상태 검사 결과를 출력합니다. 스크립트에서는 `--json`을 전달하십시오.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

동일한 준비 상태 검사를 실행합니다. `--to`와 `--yes`가 모두 지정된 경우에만 실제로 전화를 겁니다.

| 플래그             | 기본값                            | 설명                                      |
| ------------------ | --------------------------------- | ----------------------------------------- |
| `-t, --to <phone>` | (없음)                            | 실제 스모크 테스트에서 전화할 전화번호입니다. |
| `--message <text>` | `OpenClaw voice call smoke test.` | 스모크 테스트 통화 중 말할 메시지입니다.  |
| `--mode <mode>`    | `notify`                          | 통화 모드: `notify` 또는 `conversation`.  |
| `--yes`            | `false`                           | 실제 발신 통화를 겁니다.                   |
| `--json`           | `false`                           | 기계가 읽을 수 있는 JSON을 출력합니다.     |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # 모의 실행
openclaw voicecall smoke --to "+15555550123" --yes  # 실제 알림 통화
```

<Note>
외부 제공자(`plivo`, `telnyx`, `twilio`)의 경우 `setup`과 `smoke`에는 `publicUrl`, 터널 또는 Tailscale 노출을 통해 제공되는 공개 Webhook URL이 필요합니다. 통신사가 접근할 수 없으므로 루프백 또는 비공개 Serve 대체 경로는 거부됩니다.
</Note>

## 통화 수명 주기

### `call`

발신 음성 통화를 시작합니다.

| 플래그                 | 필수 | 기본값            | 설명                                                                          |
| ---------------------- | ---- | ----------------- | ----------------------------------------------------------------------------- |
| `-m, --message <text>` | 예   | (없음)            | 통화가 연결되면 말할 메시지입니다.                                            |
| `-t, --to <phone>`     | 아니요 | 구성 `toNumber` | 전화할 E.164 전화번호입니다.                                                  |
| `--mode <mode>`        | 아니요 | `conversation`  | 통화 모드: `notify`(메시지 후 종료) 또는 `conversation`(연결 유지).           |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

기본 플래그 형식이 다른 `call`의 별칭입니다.

| 플래그             | 필수   | 기본값         | 설명                                      |
| ------------------ | ------ | -------------- | ----------------------------------------- |
| `--to <phone>`     | 예     | (없음)         | 전화할 전화번호입니다.                    |
| `--message <text>` | 아니요 | (없음)         | 통화가 연결되면 말할 메시지입니다.        |
| `--mode <mode>`    | 아니요 | `conversation` | 통화 모드: `notify` 또는 `conversation`.  |

### `continue`

메시지를 말하고 응답을 기다립니다.

| 플래그             | 필수 | 설명                |
| ------------------ | ---- | ------------------- |
| `--call-id <id>`   | 예   | 통화 ID입니다.      |
| `--message <text>` | 예   | 말할 메시지입니다.  |

### `speak`

응답을 기다리지 않고 메시지를 말합니다.

| 플래그             | 필수 | 설명                |
| ------------------ | ---- | ------------------- |
| `--call-id <id>`   | 예   | 통화 ID입니다.      |
| `--message <text>` | 예   | 말할 메시지입니다.  |

### `dtmf`

활성 통화에 DTMF 숫자를 전송합니다.

| 플래그              | 필수 | 설명                                                     |
| ------------------- | ---- | -------------------------------------------------------- |
| `--call-id <id>`    | 예   | 통화 ID입니다.                                           |
| `--digits <digits>` | 예   | DTMF 숫자입니다(예: 대기 시간을 포함하려면 `ww123456#`). |

### `end`

활성 통화를 종료합니다.

| 플래그           | 필수 | 설명           |
| ---------------- | ---- | -------------- |
| `--call-id <id>` | 예   | 통화 ID입니다. |

### `status`

활성 통화를 검사합니다.

| 플래그           | 기본값  | 설명                              |
| ---------------- | ------- | --------------------------------- |
| `--call-id <id>` | (없음)  | 출력을 하나의 통화로 제한합니다.  |
| `--json`         | `false` | 기계가 읽을 수 있는 JSON을 출력합니다. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## 로그 및 메트릭

### `tail`

음성 통화 JSONL 로그를 실시간으로 추적합니다. 시작할 때 마지막 `--since`개 줄을 출력한 다음, 새 줄이 기록될 때마다 스트리밍합니다.

| 플래그          | 기본값                      | 설명                                      |
| --------------- | --------------------------- | ----------------------------------------- |
| `--file <path>` | Plugin 저장소에서 확인됨    | `calls.jsonl`의 경로입니다.               |
| `--since <n>`   | `25`                        | 실시간 추적 전에 출력할 줄 수입니다.      |
| `--poll <ms>`   | `250` (최소 50)             | 밀리초 단위 폴링 간격입니다.              |

### `latency`

`calls.jsonl`의 턴 지연 시간 및 수신 대기 메트릭을 요약합니다. 출력은 `recordsScanned`, `turnLatency`, `listenWait` 요약이 포함된 JSON입니다.

| 플래그          | 기본값                   | 설명                                   |
| --------------- | ------------------------ | -------------------------------------- |
| `--file <path>` | Plugin 저장소에서 확인됨 | `calls.jsonl`의 경로입니다.            |
| `--last <n>`    | `200` (최소 1)           | 분석할 최근 레코드 수입니다.           |

## Webhook 노출

### `expose`

음성 Webhook의 Tailscale Serve/Funnel 구성을 활성화하거나 비활성화하거나 변경합니다.

| 플래그                | 기본값                                    | 설명                                             |
| --------------------- | ----------------------------------------- | ------------------------------------------------ |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve`(tailnet) 또는 `funnel`(공개).     |
| `--path <path>`       | 구성 `tailscale.path` 또는 `--serve-path` | 노출할 Tailscale 경로입니다.                     |
| `--port <port>`       | 구성 `serve.port` 또는 `3334`             | 로컬 Webhook 포트입니다.                         |
| `--serve-path <path>` | 구성 `serve.path` 또는 `/voice/webhook`   | 로컬 Webhook 경로입니다.                         |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
신뢰하는 네트워크에만 Webhook 엔드포인트를 노출하십시오. 가능하면 Funnel보다 Tailscale Serve를 사용하십시오.
</Warning>

## 관련 항목

- [CLI 참조](/ko/cli)
- [음성 통화 Plugin](/ko/plugins/voice-call)
