---
read_when:
    - OpenClaw 모델 사용량, 메시지 흐름 또는 세션 메트릭을 OpenTelemetry 컬렉터로 보내려는 경우
    - Grafana, Datadog, Honeycomb, New Relic, Tempo 또는 다른 OTLP 백엔드에 트레이스, 메트릭 또는 로그를 연결하는 경우
    - 대시보드나 알림을 만들려면 정확한 메트릭 이름, 스팬 이름 또는 속성 형태가 필요합니다
summary: diagnostics-otel Plugin(OTLP/HTTP)을 통해 OpenClaw 진단 정보를 모든 OpenTelemetry 컬렉터로 내보내기
title: OpenTelemetry 내보내기
x-i18n:
    generated_at: "2026-04-30T06:32:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw는 번들된 `diagnostics-otel` Plugin을 통해 **OTLP/HTTP (protobuf)**를 사용하여 진단 정보를 내보냅니다. OTLP/HTTP를 허용하는 모든 컬렉터나 백엔드는 코드 변경 없이 작동합니다. 로컬 파일 로그와 읽는 방법은 [로깅](/ko/logging)을 참조하세요.

## 전체 구성 방식

- **진단 이벤트**는 모델 실행, 메시지 흐름, 세션, 큐, exec에 대해 Gateway와 번들된 Plugin에서 내보내는 구조화된 인프로세스 레코드입니다.
- **`diagnostics-otel` Plugin**은 해당 이벤트를 구독하고 OTLP/HTTP를 통해 OpenTelemetry **메트릭**, **트레이스**, **로그**로 내보냅니다.
- **Provider 호출**은 provider 전송이 사용자 지정 헤더를 허용할 때 OpenClaw의 신뢰된 모델 호출 span 컨텍스트에서 W3C `traceparent` 헤더를 받습니다. Plugin에서 내보낸 트레이스 컨텍스트는 전파되지 않습니다.
- Exporter는 진단 표면과 Plugin이 모두 활성화된 경우에만 연결되므로 기본적으로 인프로세스 비용이 거의 0에 가깝게 유지됩니다.

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

| 신호        | 포함되는 내용                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **메트릭**  | 토큰 사용량, 비용, 실행 시간, 메시지 흐름, 큐 레인, 세션 상태, exec, 메모리 압력에 대한 카운터와 히스토그램.                              |
| **트레이스** | 모델 사용량, 모델 호출, 하니스 수명 주기, 도구 실행, exec, webhook/메시지 처리, 컨텍스트 조립, 도구 루프에 대한 span.                    |
| **로그**    | `diagnostics.otel.logs`가 활성화된 경우 OTLP를 통해 내보내는 구조화된 `logging.file` 레코드.                                               |

`traces`, `metrics`, `logs`를 독립적으로 전환할 수 있습니다. `diagnostics.otel.enabled`가 true이면 세 가지 모두 기본적으로 켜집니다.

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
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
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

### 환경 변수

| 변수                                                                                                              | 목적                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint`를 재정의합니다. 값에 이미 `/v1/traces`, `/v1/metrics`, `/v1/logs`가 포함되어 있으면 그대로 사용됩니다.                                                                                                        |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 일치하는 `diagnostics.otel.*Endpoint` 구성 키가 설정되지 않은 경우 사용하는 신호별 엔드포인트 재정의입니다. 신호별 구성은 신호별 env보다 우선하고, 신호별 env는 공유 엔드포인트보다 우선합니다.                                          |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName`을 재정의합니다.                                                                                                                                                                                            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | 와이어 프로토콜을 재정의합니다. 현재는 `http/protobuf`만 적용됩니다.                                                                                                                                                                      |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 레거시 `gen_ai.system` 대신 최신 실험적 GenAI span 속성(`gen_ai.provider.name`)을 내보내려면 `gen_ai_latest_experimental`로 설정합니다. GenAI 메트릭은 항상 제한된 낮은 카디널리티의 시맨틱 속성을 사용합니다.                         |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 다른 preload 또는 호스트 프로세스가 이미 전역 OpenTelemetry SDK를 등록한 경우 `1`로 설정합니다. 그러면 Plugin은 자체 NodeSDK 수명 주기를 건너뛰지만 진단 리스너를 계속 연결하고 `traces`/`metrics`/`logs`를 존중합니다.                |

## 개인정보 보호 및 콘텐츠 캡처

원시 모델/도구 콘텐츠는 기본적으로 내보내지 **않습니다**. Span은 제한된 식별자(채널, provider, 모델, 오류 범주, 해시 전용 요청 ID)를 담으며 프롬프트 텍스트, 응답 텍스트, 도구 입력, 도구 출력, 세션 키를 절대 포함하지 않습니다.

아웃바운드 모델 요청에는 W3C `traceparent` 헤더가 포함될 수 있습니다. 이 헤더는 활성 모델 호출에 대한 OpenClaw 소유 진단 트레이스 컨텍스트에서만 생성됩니다. 기존 호출자 제공 `traceparent` 헤더는 대체되므로 Plugin이나 사용자 지정 provider 옵션이 서비스 간 트레이스 조상을 위조할 수 없습니다.

컬렉터와 보존 정책이 프롬프트, 응답, 도구 또는 시스템 프롬프트 텍스트에 대해 승인된 경우에만 `diagnostics.otel.captureContent.*`를 `true`로 설정하세요. 각 하위 키는 독립적으로 opt-in됩니다.

- `inputMessages` — 사용자 프롬프트 콘텐츠.
- `outputMessages` — 모델 응답 콘텐츠.
- `toolInputs` — 도구 인자 페이로드.
- `toolOutputs` — 도구 결과 페이로드.
- `systemPrompt` — 조립된 시스템/developer 프롬프트.

하위 키가 활성화되면 모델 및 도구 span은 해당 클래스에 대해서만 제한되고 수정된 `openclaw.content.*` 속성을 받습니다.

## 샘플링 및 플러시

- **트레이스:** `diagnostics.otel.sampleRate`(루트 span 전용, `0.0`은 모두 드롭, `1.0`은 모두 유지).
- **메트릭:** `diagnostics.otel.flushIntervalMs`(최소 `1000`).
- **로그:** OTLP 로그는 `logging.level`(파일 로그 수준)을 따릅니다. 콘솔 포맷팅이 아니라 진단 로그 레코드 수정 경로를 사용합니다. 대용량 설치에서는 로컬 샘플링보다 OTLP 컬렉터 샘플링/필터링을 선호해야 합니다.
- **파일 로그 상관관계:** JSONL 파일 로그는 로그 호출에 유효한 진단 트레이스 컨텍스트가 포함된 경우 최상위 `traceId`, `spanId`, `parentSpanId`, `traceFlags`를 포함하며, 이를 통해 로그 프로세서가 로컬 로그 줄을 내보낸 span과 결합할 수 있습니다.
- **요청 상관관계:** Gateway HTTP 요청과 WebSocket 프레임은 내부 요청 트레이스 범위를 생성합니다. 해당 범위 내부의 로그와 진단 이벤트는 기본적으로 요청 트레이스를 상속하며, agent 실행과 모델 호출 span은 자식으로 생성되어 provider `traceparent` 헤더가 동일한 트레이스에 유지됩니다.

## 내보낸 메트릭

### 모델 사용량

- `openclaw.tokens`(카운터, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd`(카운터, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms`(히스토그램, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens`(히스토그램, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage`(히스토그램, GenAI 시맨틱 컨벤션 메트릭, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration`(히스토그램, 초 단위, GenAI 시맨틱 컨벤션 메트릭, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, 선택적 `error.type`)
- `openclaw.model_call.duration_ms`(히스토그램, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, 분류된 오류에는 `openclaw.errorCategory` 및 `openclaw.failureKind` 추가)
- `openclaw.model_call.request_bytes`(히스토그램, 최종 모델 요청 페이로드의 UTF-8 바이트 크기, 원시 페이로드 콘텐츠 없음)
- `openclaw.model_call.response_bytes`(히스토그램, 스트리밍된 모델 응답 이벤트의 UTF-8 바이트 크기, 원시 응답 콘텐츠 없음)
- `openclaw.model_call.time_to_first_byte_ms`(히스토그램, 첫 번째 스트리밍 응답 이벤트 전까지 경과한 시간)

### 메시지 흐름

- `openclaw.webhook.received`(카운터, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error`(카운터, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms`(히스토그램, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued`(카운터, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed`(카운터, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms`(히스토그램, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started`(카운터, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms`(히스토그램, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### 큐 및 세션

- `openclaw.queue.lane.enqueue`(카운터, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue`(카운터, attrs: `openclaw.lane`)
- `openclaw.queue.depth`(히스토그램, attrs: `openclaw.lane` 또는 `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms`(히스토그램, attrs: `openclaw.lane`)
- `openclaw.session.state`(카운터, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck`(카운터, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms`(히스토그램, attrs: `openclaw.state`)
- `openclaw.run.attempt`(카운터, attrs: `openclaw.attempt`)

### 하니스 수명 주기

- `openclaw.harness.duration_ms`(히스토그램, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, 오류 시 `openclaw.harness.phase`)

### Exec

- `openclaw.exec.duration_ms`(히스토그램, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### 진단 내부 항목(메모리 및 도구 루프)

- `openclaw.memory.heap_used_bytes` (히스토그램, 속성: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (히스토그램)
- `openclaw.memory.pressure` (카운터, 속성: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (카운터, 속성: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (히스토그램, 속성: `openclaw.toolName`, `openclaw.outcome`)

## 내보낸 span

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - 기본값은 `gen_ai.system`이며, 최신 GenAI 의미 규칙을 선택한 경우 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - 기본값은 `gen_ai.system`이며, 최신 GenAI 의미 규칙을 선택한 경우 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - 오류 시 `openclaw.errorCategory` 및 선택적 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (업스트림 제공자 요청 id의 제한된 SHA 기반 해시; 원시 id는 내보내지 않음)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (프롬프트, 기록, 응답 또는 세션 키 콘텐츠 없음)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (루프 메시지, 매개변수 또는 도구 출력 없음)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

콘텐츠 캡처가 명시적으로 활성화된 경우, 모델 및 도구 span에는 선택한 특정 콘텐츠 클래스에 대해 제한되고 수정된 `openclaw.content.*` 속성도 포함될 수 있습니다.

## 진단 이벤트 카탈로그

아래 이벤트는 위의 메트릭과 span을 뒷받침합니다. Plugin은 OTLP 내보내기 없이도 이를 직접 구독할 수 있습니다.

**모델 사용량**

- `model.usage` — 토큰, 비용, 기간, 컨텍스트, 제공자/모델/채널,
  세션 id. `usage`는 비용 및 텔레메트리를 위한 제공자/턴 회계이며,
  `context.used`는 현재 프롬프트/컨텍스트 스냅샷이고 캐시된 입력 또는 도구 루프 호출이 관련된 경우
  제공자 `usage.total`보다 낮을 수 있습니다.

**메시지 흐름**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**큐 및 세션**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (집계 카운터: Webhook/큐/세션)

**하네스 수명 주기**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  에이전트 하네스의 실행별 수명 주기입니다. `harnessId`, 선택적
  `pluginId`, 제공자/모델/채널 및 실행 id를 포함합니다. 완료 시
  `durationMs`, `outcome`, 선택적 `resultClassification`, `yieldDetected`,
  그리고 `itemLifecycle` 개수가 추가됩니다. 오류 시 `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` 및
  선택적 `cleanupFailed`가 추가됩니다.

**Exec**

- `exec.process.completed` — 터미널 결과, 기간, 대상, 모드, 종료
  코드 및 실패 종류입니다. 명령 텍스트와 작업 디렉터리는
  포함되지 않습니다.

## 내보내기 도구 없이

`diagnostics-otel`을 실행하지 않고도 Plugin 또는 사용자 지정 싱크에서 진단 이벤트를 사용할 수 있게 유지할 수 있습니다.

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level`을 높이지 않고 대상 지정 디버그 출력을 사용하려면 진단
플래그를 사용하세요. 플래그는 대소문자를 구분하지 않으며 와일드카드를 지원합니다(예: `telegram.*` 또는
`*`).

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

또는 일회성 env 재정의로 사용합니다.

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

플래그 출력은 표준 로그 파일(`logging.file`)로 이동하며 여전히
`logging.redactSensitive`에 의해 수정됩니다. 전체 가이드:
[진단 플래그](/ko/diagnostics/flags).

## 비활성화

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`plugins.allow`에서 `diagnostics-otel`을 제외하거나
`openclaw plugins disable diagnostics-otel`을 실행할 수도 있습니다.

## 관련 항목

- [로깅](/ko/logging) — 파일 로그, 콘솔 출력, CLI tailing 및 Control UI Logs 탭
- [Gateway 로깅 내부 구조](/ko/gateway/logging) — WS 로그 스타일, 하위 시스템 접두사 및 콘솔 캡처
- [진단 플래그](/ko/diagnostics/flags) — 대상 지정 디버그 로그 플래그
- [진단 내보내기](/ko/gateway/diagnostics) — 운영자 지원 번들 도구(OTEL 내보내기와 별개)
- [구성 참조](/ko/gateway/configuration-reference#diagnostics) — 전체 `diagnostics.*` 필드 참조
