---
read_when:
    - 로깅에 대한 초보자 친화적인 개요가 필요합니다.
    - 로그 수준이나 형식을 구성하려고 합니다.
    - 문제를 해결 중이며 로그를 빠르게 찾아야 합니다.
summary: '로깅 개요: 파일 로그, 콘솔 출력, CLI tailing, 그리고 Control UI'
title: 로깅 개요
x-i18n:
    generated_at: "2026-04-25T06:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e179c883d98caa7fd8d3ece8962d0b628562d35568ebf452c34bededba22e2c
    source_path: logging.md
    workflow: 15
---

# 로깅

OpenClaw에는 두 가지 주요 로그 표면이 있습니다.

- Gateway가 기록하는 **파일 로그**(JSON lines)
- 터미널과 Gateway Debug UI에 표시되는 **콘솔 출력**

Control UI의 **Logs** 탭은 gateway 파일 로그를 tail합니다. 이 페이지에서는
로그가 저장되는 위치, 읽는 방법, 로그 수준과 형식을 구성하는 방법을 설명합니다.

## 로그 위치

기본적으로 Gateway는 다음 위치에 순환 로그 파일을 기록합니다.

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

날짜는 gateway 호스트의 로컬 시간대를 사용합니다.

이 위치는 `~/.openclaw/openclaw.json`에서 재정의할 수 있습니다.

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 로그 읽는 방법

### CLI: 실시간 tail(권장)

CLI를 사용해 RPC를 통해 gateway 로그 파일을 tail할 수 있습니다.

```bash
openclaw logs --follow
```

유용한 현재 옵션:

- `--local-time`: 타임스탬프를 로컬 시간대로 표시
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 표준 Gateway RPC 플래그
- `--expect-final`: 에이전트 기반 RPC 최종 응답 대기 플래그(공용 클라이언트 계층을 통해 여기서도 허용됨)

출력 모드:

- **TTY 세션**: 보기 좋고 색상이 적용된 구조화 로그 라인
- **비-TTY 세션**: 일반 텍스트
- `--json`: 줄 구분 JSON(줄당 하나의 로그 event)
- `--plain`: TTY 세션에서도 일반 텍스트 강제
- `--no-color`: ANSI 색상 비활성화

명시적으로 `--url`을 전달하면 CLI는 config 또는
환경 자격 증명을 자동 적용하지 않으므로, 대상 Gateway에
인증이 필요하면 직접 `--token`도 포함하세요.

JSON 모드에서 CLI는 `type` 태그가 붙은 객체를 출력합니다.

- `meta`: 스트림 메타데이터(file, cursor, size)
- `log`: 파싱된 로그 항목
- `notice`: 잘림 / 회전 힌트
- `raw`: 파싱되지 않은 로그 라인

local loopback Gateway가 pairing을 요구하면 `openclaw logs`는
구성된 로컬 로그 파일로 자동 fallback합니다. 명시적인 `--url` 대상에는
이 fallback이 적용되지 않습니다.

Gateway에 연결할 수 없으면 CLI는 다음을 실행하라는 짧은 힌트를 출력합니다.

```bash
openclaw doctor
```

### Control UI(웹)

Control UI의 **Logs** 탭은 `logs.tail`을 사용해 같은 파일을 tail합니다.
여는 방법은 [/web/control-ui](/ko/web/control-ui)를 참고하세요.

### 채널 전용 로그

채널 활동(WhatsApp/Telegram 등)을 필터링하려면 다음을 사용하세요.

```bash
openclaw channels logs --channel whatsapp
```

## 로그 형식

### 파일 로그(JSONL)

로그 파일의 각 줄은 JSON 객체입니다. CLI와 Control UI는 이
항목들을 파싱해 구조화된 출력(시간, 수준, 하위 시스템, 메시지)을 렌더링합니다.

### 콘솔 출력

콘솔 로그는 **TTY 인식형**이며 가독성을 위해 형식화됩니다.

- 하위 시스템 접두사(예: `gateway/channels/whatsapp`)
- 수준별 색상(info/warn/error)
- 선택적 compact 또는 JSON 모드

콘솔 형식은 `logging.consoleStyle`로 제어합니다.

### Gateway WebSocket 로그

`openclaw gateway`에는 RPC 트래픽을 위한 WebSocket 프로토콜 로깅도 있습니다.

- 일반 모드: 중요한 결과만 표시(오류, 파싱 오류, 느린 호출)
- `--verbose`: 모든 요청/응답 트래픽
- `--ws-log auto|compact|full`: 상세 렌더링 스타일 선택
- `--compact`: `--ws-log compact`의 alias

예시:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## 로깅 구성

모든 로깅 구성은 `~/.openclaw/openclaw.json`의 `logging` 아래에 있습니다.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 로그 수준

- `logging.level`: **파일 로그**(JSONL) 수준
- `logging.consoleLevel`: **콘솔** 출력 상세 수준

두 값 모두 **`OPENCLAW_LOG_LEVEL`** 환경 변수로 재정의할 수 있습니다(예: `OPENCLAW_LOG_LEVEL=debug`). 이 env var는 config 파일보다 우선하므로 `openclaw.json`을 수정하지 않고도 단일 실행에 대해 상세 수준을 높일 수 있습니다. 전역 CLI 옵션 **`--log-level <level>`**(예: `openclaw --log-level debug gateway run`)도 전달할 수 있으며, 이 경우 해당 명령에서는 환경 변수보다 우선합니다.

`--verbose`는 콘솔 출력과 WS 로그 상세 수준에만 영향을 주며,
파일 로그 수준은 변경하지 않습니다.

### 콘솔 스타일

`logging.consoleStyle`:

- `pretty`: 사람이 읽기 쉬우며, 색상이 있고, 타임스탬프 포함
- `compact`: 더 촘촘한 출력(긴 세션에 가장 적합)
- `json`: 줄당 JSON(로그 처리기용)

### redaction

도구 요약은 콘솔에 출력되기 전에 민감한 토큰을 redaction할 수 있습니다.

- `logging.redactSensitive`: `off` | `tools`(기본값: `tools`)
- `logging.redactPatterns`: 기본 집합을 재정의할 regex 문자열 목록

redaction은 **콘솔 출력에만** 영향을 주며 파일 로그는 변경하지 않습니다.

## 진단 + OpenTelemetry

진단은 모델 실행 **및**
메시지 흐름 텔레메트리(Webhook, 큐잉, 세션 상태)를 위한 구조화된 기계 판독 가능 event입니다. 이들은 로그를 **대체하지 않으며**,
메트릭, trace 및 기타 exporter에 데이터를 공급하기 위해 존재합니다.

진단 event는 프로세스 내부에서 발생하지만, exporter는
진단과 exporter plugin이 모두 활성화되었을 때만 연결됩니다.

### OpenTelemetry와 OTLP의 차이

- **OpenTelemetry (OTel)**: trace, metric, log를 위한 데이터 모델 + SDK
- **OTLP**: OTel 데이터를 collector/backend로 내보내는 데 사용되는 wire protocol
- OpenClaw는 현재 **OTLP/HTTP (protobuf)**를 통해 내보냅니다

### 내보내는 신호

- **메트릭**: 카운터 + 히스토그램(token 사용량, 메시지 흐름, 큐잉)
- **트레이스**: 모델 사용 + Webhook/메시지 처리용 span
- **로그**: `diagnostics.otel.logs`가 활성화되면 OTLP를 통해 내보냄. 로그
  양이 많을 수 있으므로 `logging.level`과 exporter 필터를 고려하세요.

### 진단 event 카탈로그

모델 사용량:

- `model.usage`: token, 비용, duration, context, provider/model/channel, session id

메시지 흐름:

- `webhook.received`: 채널별 Webhook 유입
- `webhook.processed`: Webhook 처리 완료 + duration
- `webhook.error`: Webhook 핸들러 오류
- `message.queued`: 처리를 위해 메시지가 큐에 들어감
- `message.processed`: 결과 + duration + 선택적 오류

큐 + 세션:

- `queue.lane.enqueue`: 명령 큐 lane enqueue + 깊이
- `queue.lane.dequeue`: 명령 큐 lane dequeue + 대기 시간
- `session.state`: 세션 상태 전환 + 이유
- `session.stuck`: 세션 정체 경고 + 경과 시간
- `run.attempt`: 실행 재시도/시도 메타데이터
- `diagnostic.heartbeat`: 집계 카운터(Webhook/큐/세션)

### 진단 활성화(exporter 없음)

plugin이나 사용자 지정 sink에서 진단 event를 사용할 수 있게 하려면 다음을 사용하세요.

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### 진단 플래그(대상 지정 로그)

`logging.level`을 높이지 않고도 추가적인 대상 지정 디버그 로그를 켜려면 플래그를 사용하세요.
플래그는 대소문자를 구분하지 않으며 와일드카드를 지원합니다(예: `telegram.*` 또는 `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

env 재정의(일회성):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

참고:

- 플래그 로그는 표준 로그 파일(`logging.file`과 동일)로 기록됩니다.
- 출력은 여전히 `logging.redactSensitive`에 따라 redaction됩니다.
- 전체 가이드는 [/diagnostics/flags](/ko/diagnostics/flags)를 참고하세요.

### OpenTelemetry로 내보내기

진단은 `diagnostics-otel` plugin(OTLP/HTTP)을 통해 내보낼 수 있습니다. 이는
OTLP/HTTP를 허용하는 모든 OpenTelemetry collector/backend에서 동작합니다.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

참고:

- `openclaw plugins enable diagnostics-otel`로도 plugin을 활성화할 수 있습니다.
- `protocol`은 현재 `http/protobuf`만 지원합니다. `grpc`는 무시됩니다.
- 메트릭에는 token 사용량, 비용, context 크기, 실행 duration, 메시지 흐름
  카운터/히스토그램(Webhook, 큐잉, 세션 상태, 큐 깊이/대기 시간)이 포함됩니다.
- trace/metric은 `traces` / `metrics`로 전환할 수 있습니다(기본값: 켜짐). trace에는
  모델 사용 span과 활성화 시 Webhook/메시지 처리 span이 포함됩니다.
- 원시 모델/도구 콘텐츠는 기본적으로 내보내지지 않습니다. prompt, 응답, 도구 또는 system prompt 텍스트에 대해
  collector와 보존 정책이 승인된 경우에만
  `diagnostics.otel.captureContent`를 사용하세요.
- collector에 인증이 필요하면 `headers`를 설정하세요.
- 지원되는 환경 변수: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### 내보낸 메트릭(이름 + 유형)

모델 사용량:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

메시지 흐름:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)

큐 + 세션:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` 또는
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### 내보낸 span(이름 + 주요 속성)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

콘텐츠 캡처를 명시적으로 활성화하면, 모델/도구 span에는
선택한 콘텐츠 클래스에 대해 제한되고 redaction된 `openclaw.content.*` 속성도 포함될 수 있습니다.

### 샘플링 + 플러시

- trace 샘플링: `diagnostics.otel.sampleRate` (0.0–1.0, 루트 span만)
- 메트릭 내보내기 간격: `diagnostics.otel.flushIntervalMs` (최소 1000ms)

### 프로토콜 참고

- OTLP/HTTP 엔드포인트는 `diagnostics.otel.endpoint` 또는
  `OTEL_EXPORTER_OTLP_ENDPOINT`로 설정할 수 있습니다.
- 엔드포인트에 이미 `/v1/traces` 또는 `/v1/metrics`가 포함되어 있으면 그대로 사용합니다.
- 엔드포인트에 이미 `/v1/logs`가 포함되어 있으면 로그용으로 그대로 사용합니다.
- `diagnostics.otel.logs`는 메인 logger 출력의 OTLP 로그 내보내기를 활성화합니다.

### 로그 내보내기 동작

- OTLP 로그는 `logging.file`에 기록되는 것과 동일한 구조화 레코드를 사용합니다.
- `logging.level`(파일 로그 수준)을 따릅니다. 콘솔 redaction은
  OTLP 로그에는 적용되지 않습니다.
- 대용량 설치에서는 OTLP collector 샘플링/필터링을 우선 사용하는 것이 좋습니다.

## 문제 해결 팁

- **Gateway에 연결할 수 없나요?** 먼저 `openclaw doctor`를 실행하세요.
- **로그가 비어 있나요?** Gateway가 실행 중이며 `logging.file`에 설정된 경로로
  기록하고 있는지 확인하세요.
- **더 자세한 정보가 필요하신가요?** `logging.level`을 `debug` 또는 `trace`로 설정하고 다시 시도하세요.

## 관련

- [Gateway Logging Internals](/ko/gateway/logging) — WS 로그 스타일, 하위 시스템 접두사, 콘솔 캡처
- [Diagnostics](/ko/gateway/configuration-reference#diagnostics) — OpenTelemetry 내보내기 및 캐시 trace config
