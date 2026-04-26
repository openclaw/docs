---
read_when:
    - OpenClaw 모델 사용량, 메시지 흐름 또는 세션 메트릭을 OpenTelemetry 수집기로 보내려고 합니다
    - Grafana, Datadog, Honeycomb, New Relic, Tempo 또는 다른 OTLP 백엔드에 trace, metric 또는 로그를 연결하고 있습니다
    - 대시보드나 알림을 만들기 위해 정확한 metric 이름, span 이름 또는 attribute 형식이 필요합니다
summary: diagnostics-otel Plugin(OTLP/HTTP)을 통해 OpenClaw 진단을 모든 OpenTelemetry 수집기로 내보내기
title: OpenTelemetry 내보내기
x-i18n:
    generated_at: "2026-04-26T11:29:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw는 번들된 `diagnostics-otel` Plugin을 통해
**OTLP/HTTP (protobuf)** 방식으로 진단 데이터를 내보냅니다. OTLP/HTTP를 수신할 수 있는
모든 수집기 또는 백엔드는 코드 변경 없이 동작합니다. 로컬 파일 로그와 이를 읽는 방법은
[로깅](/ko/logging)을 참조하세요.

## 전체 구성 방식

- **진단 이벤트**는 모델 실행, 메시지 흐름, 세션, 큐,
  exec를 위해 Gateway와 번들 Plugin이 내보내는 구조화된 인프로세스 레코드입니다.
- **`diagnostics-otel` Plugin**은 이 이벤트를 구독하고 이를 OpenTelemetry
  **metrics**, **traces**, **logs**로 OTLP/HTTP를 통해 내보냅니다.
- **provider 호출**은 provider 전송이 사용자 지정
  헤더를 허용할 때 OpenClaw의 신뢰된 모델 호출 span 컨텍스트에서 W3C `traceparent` 헤더를 받습니다.
  Plugin이 내보낸 trace 컨텍스트는 전파되지 않습니다.
- 내보내기기는 진단 표면과 Plugin이 모두 활성화된 경우에만 연결되므로,
  기본적으로 인프로세스 비용은 거의 0에 가깝습니다.

## 빠른 시작

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

CLI에서도 Plugin을 활성화할 수 있습니다.

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol`은 현재 `http/protobuf`만 지원합니다. `grpc`는 무시됩니다.
</Note>

## 내보내는 신호

| 신호        | 포함되는 내용                                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | 토큰 사용량, 비용, 실행 시간, 메시지 흐름, 큐 레인, 세션 상태, exec, 메모리 압박에 대한 카운터 및 히스토그램                           |
| **Traces**  | 모델 사용량, 모델 호출, 하네스 생명주기, 도구 실행, exec, Webhook/메시지 처리, 컨텍스트 조합, 도구 루프에 대한 span                  |
| **Logs**    | `diagnostics.otel.logs`가 활성화된 경우 OTLP를 통해 내보내는 구조화된 `logging.file` 레코드                                           |

`traces`, `metrics`, `logs`는 각각 독립적으로 전환할 수 있습니다. 세 가지 모두
`diagnostics.otel.enabled`가 true일 때 기본적으로 활성화됩니다.

## 구성 참조

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc는 무시됨
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // 루트 span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric 내보내기 간격(최소 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### env var

| 변수                                                                                                            | 목적                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                   | `diagnostics.otel.endpoint`를 override합니다. 값에 이미 `/v1/traces`, `/v1/metrics`, 또는 `/v1/logs`가 포함되어 있으면 그대로 사용합니다.                                                                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 일치하는 `diagnostics.otel.*Endpoint` config 키가 설정되지 않은 경우 사용되는 신호별 엔드포인트 override입니다. 신호별 config가 신호별 env보다 우선하고, 신호별 env가 공유 엔드포인트보다 우선합니다.                                    |
| `OTEL_SERVICE_NAME`                                                                                             | `diagnostics.otel.serviceName`을 override합니다.                                                                                                                                                                                          |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                   | wire protocol을 override합니다(현재는 `http/protobuf`만 유효).                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                 | 레거시 `gen_ai.system` 대신 최신 실험적 GenAI span attribute(`gen_ai.provider.name`)를 내보내려면 `gen_ai_latest_experimental`로 설정하세요. GenAI metrics는 관계없이 항상 제한된 저카디널리티 semantic attribute를 사용합니다.         |
| `OPENCLAW_OTEL_PRELOADED`                                                                                       | 다른 preload 또는 호스트 프로세스가 이미 전역 OpenTelemetry SDK를 등록한 경우 `1`로 설정하세요. 그러면 Plugin은 자체 NodeSDK 생명주기를 건너뛰지만 진단 리스너는 계속 연결하고 `traces`/`metrics`/`logs`를 그대로 존중합니다.         |

## 개인정보 보호 및 콘텐츠 캡처

원시 모델/도구 콘텐츠는 기본적으로 **내보내지지 않습니다**. span은 제한된
식별자(채널, provider, 모델, 오류 카테고리, 해시 전용 요청 ID)를 담고,
프롬프트 텍스트, 응답 텍스트, 도구 입력, 도구 출력, 세션 키는 절대 포함하지 않습니다.

발신 모델 요청에는 W3C `traceparent` 헤더가 포함될 수 있습니다. 이 헤더는
활성 모델 호출에 대한 OpenClaw 소유 진단 trace 컨텍스트에서만 생성됩니다.
기존 호출자 제공 `traceparent` 헤더는 대체되므로, Plugin이나
사용자 지정 provider 옵션이 서비스 간 trace 조상을 위조할 수 없습니다.

프롬프트, 응답, 도구, 시스템 프롬프트
텍스트에 대해 수집기와 보존 정책이 승인된 경우에만 `diagnostics.otel.captureContent.*`를 `true`로 설정하세요.
각 하위 키는 독립적으로 opt-in됩니다.

- `inputMessages` — 사용자 프롬프트 콘텐츠
- `outputMessages` — 모델 응답 콘텐츠
- `toolInputs` — 도구 인자 페이로드
- `toolOutputs` — 도구 결과 페이로드
- `systemPrompt` — 조합된 시스템/개발자 프롬프트

어떤 하위 키든 활성화되면 모델 및 도구 span은 해당 클래스에 대해서만
제한되고 마스킹된 `openclaw.content.*` attribute를 가집니다.

## 샘플링 및 플러시

- **Traces:** `diagnostics.otel.sampleRate` (루트 span만, `0.0`은 전부 버림,
  `1.0`은 전부 유지)
- **Metrics:** `diagnostics.otel.flushIntervalMs` (최소 `1000`)
- **Logs:** OTLP 로그는 `logging.level`(파일 로그 레벨)을 따릅니다. 콘솔
  마스킹은 OTLP 로그에 적용되지 않습니다. 고트래픽 설치에서는
  로컬 샘플링보다 OTLP 수집기 샘플링/필터링을 우선하는 것이 좋습니다.

## 내보내는 metrics

### 모델 사용량

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, 초 단위, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, 선택적 `error.type`)

### 메시지 흐름

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### 큐 및 세션

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` 또는 `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### 하네스 생명주기

- `openclaw.harness.duration_ms` (histogram, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, 오류 시 `openclaw.harness.phase`)

### Exec

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### 진단 내부 항목(메모리 및 도구 루프)

- `openclaw.memory.heap_used_bytes` (histogram, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attrs: `openclaw.toolName`, `openclaw.outcome`)

## 내보내는 span

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (`input`/`output`/`cache_read`/`cache_write`/`total`)
  - 기본적으로 `gen_ai.system`, 또는 최신 GenAI semantic conventions를 opt-in한 경우 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - 기본적으로 `gen_ai.system`, 또는 최신 GenAI semantic conventions를 opt-in한 경우 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (업스트림 provider 요청 ID의 제한된 SHA 기반 해시이며, 원시 ID는 내보내지 않음)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 완료 시: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - 오류 시: `openclaw.harness.phase`, `openclaw.errorCategory`, 선택적 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (프롬프트, 기록, 응답, 세션 키 콘텐츠는 포함하지 않음)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (루프 메시지, params, 도구 출력은 포함하지 않음)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

콘텐츠 캡처를 명시적으로 활성화하면, 모델 및 도구 span은
opt-in한 특정 콘텐츠 클래스에 대해 제한되고 마스킹된 `openclaw.content.*` attribute를
추가로 포함할 수 있습니다.

## 진단 이벤트 카탈로그

아래 이벤트는 위의 metrics 및 span의 기반이 됩니다. Plugin은 OTLP 내보내기 없이도
이를 직접 구독할 수 있습니다.

**모델 사용량**

- `model.usage` — 토큰, 비용, 실행 시간, 컨텍스트, provider/모델/채널,
  세션 ID. `usage`는 비용 및 telemetry용 provider/턴 회계 정보이며,
  `context.used`는 현재 프롬프트/컨텍스트 스냅샷으로서 캐시된 입력이나 도구 루프 호출이 있을 때
  provider `usage.total`보다 작을 수 있습니다.

**메시지 흐름**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**큐 및 세션**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (웹훅/큐/세션의 집계 카운터)

**하네스 생명주기**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  에이전트 하네스의 실행별 생명주기입니다. `harnessId`, 선택적
  `pluginId`, provider/모델/채널, 실행 ID를 포함합니다. 완료 이벤트에는
  `durationMs`, `outcome`, 선택적 `resultClassification`, `yieldDetected`,
  `itemLifecycle` 카운트가 추가됩니다. 오류 이벤트에는 `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`,
  선택적 `cleanupFailed`가 추가됩니다.

**Exec**

- `exec.process.completed` — 최종 결과, 실행 시간, 대상, 모드, 종료
  코드, 실패 종류를 포함합니다. 명령 텍스트와 작업 디렉터리는
  포함되지 않습니다.

## exporter 없이 사용하기

`diagnostics-otel`을 실행하지 않고도 Plugin 또는 사용자 지정 sink에 대해
진단 이벤트를 계속 사용할 수 있습니다.

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level`을 올리지 않고 특정 디버그 출력을 얻으려면 diagnostics
플래그를 사용하세요. 플래그는 대소문자를 구분하지 않으며 와일드카드를 지원합니다(예: `telegram.*` 또는
`*`).

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

또는 일회성 env override로:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

플래그 출력은 표준 로그 파일(`logging.file`)로 기록되며,
여전히 `logging.redactSensitive`에 의해 마스킹됩니다. 전체 가이드:
[진단 플래그](/ko/diagnostics/flags).

## 비활성화

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

또는 `plugins.allow`에서 `diagnostics-otel`을 제외하거나,
`openclaw plugins disable diagnostics-otel`을 실행해도 됩니다.

## 관련 항목

- [로깅](/ko/logging) — 파일 로그, 콘솔 출력, CLI tailing, Control UI Logs 탭
- [Gateway 로깅 내부](/ko/gateway/logging) — WS 로그 스타일, 하위 시스템 접두사, 콘솔 캡처
- [진단 플래그](/ko/diagnostics/flags) — 대상 지정 디버그 로그 플래그
- [진단 내보내기](/ko/gateway/diagnostics) — 운영자용 지원 번들 도구(OTEL 내보내기와 별개)
- [구성 참조](/ko/gateway/configuration-reference#diagnostics) — 전체 `diagnostics.*` 필드 참조
