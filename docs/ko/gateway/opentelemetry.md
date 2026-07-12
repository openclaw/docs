---
read_when:
    - OpenClaw 모델 사용량, 메시지 흐름 또는 세션 메트릭을 OpenTelemetry 수집기로 전송하려는 경우
    - Grafana, Datadog, Honeycomb, New Relic, Tempo 또는 다른 OTLP 백엔드에 트레이스, 메트릭 또는 로그를 연동하고 있습니다
    - 대시보드나 알림을 구축하려면 정확한 메트릭 이름, 스팬 이름 또는 속성 구조가 필요합니다.
summary: diagnostics-otel Plugin을 통해 OpenClaw 진단 데이터를 OpenTelemetry 수집기 또는 stdout JSONL로 내보내기
title: OpenTelemetry 내보내기
x-i18n:
    generated_at: "2026-07-12T00:47:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw은 공식 `diagnostics-otel` Plugin을 통해 **OTLP/HTTP (protobuf)**를 사용하여 진단 데이터를 내보냅니다. 컨테이너 및 샌드박스 로그 파이프라인을 위해 로그를 stdout JSONL로 기록할 수도 있습니다. OTLP/HTTP를 수신하는 모든 수집기 또는 백엔드는 코드 변경 없이 작동합니다. 로컬 파일 로그는 [로깅](/ko/logging)을 참조하세요.

- **진단 이벤트**는 모델 실행, 메시지 흐름, 세션, 대기열 및 exec를 위해 Gateway와 번들 Plugin이 내보내는 구조화된 프로세스 내 레코드입니다.
- **`diagnostics-otel`**은 이러한 이벤트를 구독하고 OTLP/HTTP를 통해 OpenTelemetry **메트릭**, **트레이스**, **로그**로 내보내며, 로그 레코드를 stdout JSONL로 미러링할 수도 있습니다.
- **제공자 호출**은 제공자 전송 계층이 사용자 지정 헤더를 허용할 때 OpenClaw의 신뢰할 수 있는 모델 호출 스팬 컨텍스트에서 W3C `traceparent` 헤더를 받습니다. Plugin이 내보낸 트레이스 컨텍스트는 전파되지 않습니다.
- 내보내기는 진단 기능과 Plugin이 모두 활성화된 경우에만 연결되므로, 기본적으로 프로세스 내 비용은 거의 0으로 유지됩니다.

## 빠른 시작

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

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

또는 CLI에서 Plugin을 활성화하세요: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol`은 `http/protobuf`만 지원합니다. `traces`와 `metrics`는 기본적으로 활성화되므로, 다른 값(`grpc` 포함)을 사용하면 `unsupported protocol` 경고와 함께 전체 diagnostics-otel 구독이 중단되며 stdout 로그 내보내기도 중지됩니다. 비 OTLP 프로토콜 값과 함께 `logsExporter: "stdout"`만 사용하려면 `traces: false`와 `metrics: false`를 명시적으로 설정하세요.
</Note>

## 내보내는 신호

| 신호        | 포함되는 내용                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **메트릭** | 토큰 사용량, 비용, 실행 시간, 장애 조치, Skills 사용량, 메시지 흐름, Talk 이벤트, 대기열 레인, 세션 상태/복구, 도구 실행, exec, 메모리, 활성 상태 및 내보내기 상태에 대한 카운터/히스토그램입니다. |
| **트레이스** | 모델 사용량, 모델 호출, 하네스 수명 주기, Skills 사용량, 도구 실행, exec, Webhook/메시지 처리, 컨텍스트 구성 및 도구 루프에 대한 스팬입니다.                                                        |
| **로그**    | `diagnostics.otel.logs`가 활성화된 경우 OTLP 또는 stdout JSONL을 통해 내보내는 구조화된 `logging.file` 레코드입니다. 콘텐츠 캡처를 명시적으로 활성화하지 않으면 로그 본문은 제외됩니다.            |

`traces`, `metrics`, `logs`를 각각 독립적으로 전환할 수 있습니다. `diagnostics.otel.enabled`가 true이면 트레이스와 메트릭은 기본적으로 활성화됩니다. 로그는 기본적으로 비활성화되며 `diagnostics.otel.logs`가 명시적으로 `true`인 경우에만 내보냅니다. 로그 내보내기는 기본적으로 OTLP를 사용합니다. stdout에 JSONL로 출력하려면 `diagnostics.otel.logsExporter`를 `stdout`으로, 둘 다 사용하려면 `both`로 설정하세요.

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
      protocol: "http/protobuf", // grpc는 OTLP 내보내기를 비활성화함
      serviceName: "openclaw-gateway", // 설정하지 않으면 OTEL_SERVICE_NAME을 사용하고, 그다음 "openclaw"를 사용함
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // 루트 스팬 샘플러, 0.0..1.0
      flushIntervalMs: 60000, // 메트릭 내보내기 간격(최소 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### 환경 변수

| 변수                                                                                                              | 용도                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 구성 키가 설정되지 않은 경우 `diagnostics.otel.endpoint`의 대체 값입니다.                                                                                                                                                                                                                                      |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 일치하는 `diagnostics.otel.*Endpoint` 구성 키가 설정되지 않은 경우 사용하는 신호별 엔드포인트 대체 값입니다. 신호별 구성은 신호별 환경 변수보다 우선하며, 신호별 환경 변수는 공유 엔드포인트보다 우선합니다.                                                                                                     |
| `OTEL_SERVICE_NAME`                                                                                               | 구성 키가 설정되지 않은 경우 `diagnostics.otel.serviceName`의 대체 값입니다. 기본 서비스 이름은 `openclaw`입니다.                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | `diagnostics.otel.protocol`이 설정되지 않은 경우 전송 프로토콜의 대체 값입니다. `http/protobuf`만 내보내기를 활성화합니다.                                                                                                                                                                                       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 최신 GenAI 추론 스팬 형식을 내보내려면 `gen_ai_latest_experimental`로 설정합니다. 이 형식은 `{gen_ai.operation.name} {gen_ai.request.model}` 스팬 이름, `CLIENT` 스팬 종류, 기존 `gen_ai.system` 대신 `gen_ai.provider.name`을 사용합니다. GenAI 메트릭은 이 설정과 관계없이 항상 범위가 제한된 저카디널리티 속성을 사용합니다. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 다른 사전 로드 또는 호스트 프로세스가 전역 OpenTelemetry SDK를 이미 등록한 경우 `1`로 설정합니다. 그러면 Plugin은 자체 NodeSDK 수명 주기를 건너뛰지만 진단 리스너는 계속 연결하고 `traces`/`metrics`/`logs` 설정을 준수합니다.                                                                                     |

## 개인정보 보호 및 콘텐츠 캡처

원시 모델/도구 콘텐츠는 기본적으로 **내보내지 않습니다**. 스팬은 범위가 제한된 식별자(채널, 제공자, 모델, 오류 범주, 해시만 포함하는 요청 ID, 도구 소스, 도구 소유자, Skills 이름/소스)를 전달하며 프롬프트 텍스트, 응답 텍스트, 도구 입력, 도구 출력, Skills 파일 경로 또는 세션 키를 절대 포함하지 않습니다. 범위가 지정된 에이전트 세션 키처럼 보이는 값(예: `agent:`로 시작하는 값)은 저카디널리티 속성에서 `unknown`으로 대체됩니다. OTLP 로그 레코드는 기본적으로 심각도, 로거, 코드 위치, 신뢰할 수 있는 트레이스 컨텍스트 및 정제된 속성을 유지합니다. 원시 로그 메시지 본문은 `diagnostics.otel.captureContent`가 불리언 `true`인 경우에만 내보냅니다. 세분화된 `captureContent.*` 하위 키는 로그 본문을 활성화하지 않습니다. Talk 메트릭은 범위가 제한된 이벤트 메타데이터(모드, 전송 계층, 제공자, 이벤트 유형)만 내보내며, 대화 기록, 오디오 페이로드, 세션 ID, 턴 ID, 호출 ID, 방 ID 또는 핸드오프 토큰은 내보내지 않습니다.

외부로 전송되는 모델 요청에는 활성 모델 호출에 대해 OpenClaw이 소유한 진단 트레이스 컨텍스트에서만 생성된 W3C `traceparent` 헤더가 포함될 수 있습니다. 호출자가 기존에 제공한 `traceparent` 헤더는 대체되므로 Plugin이나 사용자 지정 제공자 옵션이 서비스 간 트레이스 계보를 위조할 수 없습니다.

수집기 및 보존 정책이 프롬프트, 응답, 도구 또는 시스템 프롬프트 텍스트를 처리하도록 승인된 경우에만 `diagnostics.otel.captureContent.*`를 `true`로 설정하세요. 각 하위 키는 독립적입니다.

- `inputMessages` - 사용자 프롬프트 콘텐츠입니다.
- `outputMessages` - 모델 응답 콘텐츠입니다.
- `toolInputs` - 도구 인수 페이로드입니다.
- `toolOutputs` - 도구 결과 페이로드입니다.
- `systemPrompt` - 구성된 시스템/개발자 프롬프트입니다.
- `toolDefinitions` - 모델 도구 이름, 설명 및 스키마입니다.

하위 키를 하나라도 활성화하면 모델 및 도구 스팬에 해당 클래스에 한정된, 범위가 제한되고 민감 정보가 제거된 `openclaw.content.*` 속성이 추가됩니다.

<Note>
불리언 `captureContent: true`는 `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` 및 OTLP 로그 본문을 함께 활성화하지만 `systemPrompt`는 활성화하지 **않습니다**. 구성된 시스템 프롬프트도 필요한 경우 `captureContent.systemPrompt: true`를 명시적으로 설정하세요.
</Note>

`toolInputs`/`toolOutputs` 콘텐츠는 기본 제공 에이전트 런타임의 도구 실행에서 캡처됩니다(완료/오류 스팬의 `openclaw.content.tool_input` 및 `gen_ai.tool.call.arguments`, 완료 스팬의 `openclaw.content.tool_output` 및 `gen_ai.tool.call.result`). `openclaw.content.*` 이름은 안정적인 OpenClaw 속성 이름으로 유지되며, `gen_ai.tool.call.*` 사본은 의미 규칙을 기본 지원하는 뷰어를 위해 이를 미러링합니다. 외부 하네스 도구 호출(Codex, Claude CLI)은 콘텐츠 페이로드 없이 `tool.execution.*` 스팬을 내보냅니다. 캡처된 콘텐츠는 신뢰할 수 있는 리스너 전용 채널을 통해 전달되며 공개 진단 이벤트 버스에는 절대 배치되지 않습니다.

## 샘플링 및 플러시

- **트레이스:** `diagnostics.otel.sampleRate`는 루트 스팬에만 `TraceIdRatioBasedSampler`를 설정합니다(`0.0`은 모두 삭제하고, `1.0`은 모두 유지). 설정하지 않으면 OpenTelemetry SDK 기본값(항상 활성화)을 사용합니다.
- **메트릭:** `diagnostics.otel.flushIntervalMs`(최솟값 `1000`으로 제한됨). 설정하지 않으면 SDK의 주기적 내보내기 기본값을 사용합니다.
- **로그:** OTLP 로그는 `logging.level`(파일 로그 수준)을 따르며 콘솔 포맷이 아닌 진단 로그 레코드 교정 경로를 사용합니다. 트래픽이 많은 설치 환경에서는 로컬 샘플링보다 OTLP 수집기 샘플링/필터링을 사용하는 것이 좋습니다. 플랫폼에서 이미 stdout/stderr를 로그 처리기로 전송하고 OTLP 로그 수집기가 없다면 `diagnostics.otel.logsExporter: "stdout"`를 설정하세요. stdout 레코드는 줄마다 하나의 JSON 객체이며, 사용 가능한 경우 `ts`, `signal`, `service.name`, 심각도, 본문, 교정된 속성 및 신뢰할 수 있는 트레이스 필드를 포함합니다.
- **파일 로그 상관관계:** 로그 호출에 유효한 진단 트레이스 컨텍스트가 포함된 경우 JSONL 파일 로그는 최상위 `traceId`, `spanId`, `parentSpanId`, `traceFlags`를 포함하므로 로그 처리기가 로컬 로그 줄을 내보낸 스팬과 연결할 수 있습니다.
- **요청 상관관계:** Gateway HTTP 요청과 WebSocket 프레임은 내부 요청 트레이스 범위를 생성합니다. 해당 범위 내의 로그와 진단 이벤트는 기본적으로 요청 트레이스를 상속하며, 에이전트 실행 및 모델 호출 스팬은 하위 항목으로 생성되므로 제공자 `traceparent` 헤더가 동일한 트레이스에 유지됩니다.
- **모델 호출 상관관계:** `openclaw.model.call` 스팬은 기본적으로 안전한 프롬프트 구성 요소 크기를 포함하며, 제공자 결과에서 사용량이 노출되면 호출별 토큰 속성도 포함합니다. `openclaw.model.usage`는 집계 비용, 컨텍스트 및 채널 대시보드를 위한 실행 수준의 사용량 계산 스팬으로 유지되며, 이벤트를 발생시키는 런타임에 신뢰할 수 있는 트레이스 컨텍스트가 있으면 동일한 진단 트레이스에 유지됩니다.

## 내보낸 메트릭

### 모델 사용량

- `openclaw.tokens`(카운터, 속성: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd`(카운터, 속성: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms`(히스토그램, 속성: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens`(히스토그램, 속성: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage`(히스토그램, GenAI 의미 규칙 메트릭, 속성: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration`(히스토그램, 초, GenAI 의미 규칙 메트릭, 속성: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, 선택적 `error.type`)
- `openclaw.model_call.duration_ms`(히스토그램, 속성: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, 분류된 오류의 경우 추가로 `openclaw.errorCategory` 및 `openclaw.failureKind`)
- `openclaw.model_call.request_bytes`(히스토그램, 최종 모델 요청 페이로드의 UTF-8 바이트 크기, 원시 페이로드 내용 없음)
- `openclaw.model_call.response_bytes`(히스토그램, 스트리밍 응답 청크 페이로드의 UTF-8 바이트 크기, 빈도가 높은 텍스트, 사고 및 도구 호출 델타는 증분 `delta` 바이트만 계산, 원시 응답 내용 없음)
- `openclaw.model_call.time_to_first_byte_ms`(히스토그램, 첫 번째 스트리밍 응답 이벤트 전까지 경과한 시간)
- `openclaw.model.failover`(카운터, 속성: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used`(카운터, 속성: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, 선택적 `openclaw.agent`, 선택적 `openclaw.toolName`)

### 메시지 흐름

- `openclaw.webhook.received`(카운터, 속성: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error`(카운터, 속성: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms`(히스토그램, 속성: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued`(카운터, 속성: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received`(카운터, 속성: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started`(카운터, 속성: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed`(카운터, 속성: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms`(히스토그램, 속성: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed`(카운터, 속성: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms`(히스토그램, 속성: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started`(카운터, 속성: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms`(히스토그램, 속성: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### 대화

- `openclaw.talk.event`(카운터, 속성: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms`(히스토그램, 속성: `openclaw.talk.event`와 동일, 대화 이벤트가 지속 시간을 보고할 때 발생)
- `openclaw.talk.audio.bytes`(히스토그램, 속성: `openclaw.talk.event`와 동일, 바이트 길이를 보고하는 대화 오디오 프레임 이벤트에서 발생)

### 큐 및 세션

- `openclaw.queue.lane.enqueue`(카운터, 속성: `openclaw.lane`)
- `openclaw.queue.lane.dequeue`(카운터, 속성: `openclaw.lane`)
- `openclaw.queue.depth`(히스토그램, 속성: `openclaw.lane` 또는 `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms`(히스토그램, 속성: `openclaw.lane`)
- `openclaw.session.state`(카운터, 속성: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck`(카운터, 속성: `openclaw.state`, 복구 가능한 오래된 세션 장부 상태에 대해 발생)
- `openclaw.session.stuck_age_ms`(히스토그램, 속성: `openclaw.state`, 복구 가능한 오래된 세션 장부 상태에 대해 발생)
- `openclaw.session.turn.created`(카운터, 속성: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested`(카운터, 속성: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed`(카운터, 속성: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms`(히스토그램, 속성: 해당 복구 카운터와 동일)
- `openclaw.run.attempt`(카운터, 속성: `openclaw.attempt`)

### 세션 활성 상태 텔레메트리

`diagnostics.stuckSessionWarnMs`는 세션 활성 상태 진단에서 진행 없음으로 간주하는 경과 시간 임계값입니다. OpenClaw가 응답, 도구, 상태, 블록 또는 ACP 런타임 진행을 관찰하는 동안에는 `processing` 세션이 이 임계값에 가까워지지 않습니다. 입력 중 상태 유지 신호는 진행으로 계산되지 않으므로 응답이 없는 모델이나 하네스도 계속 감지할 수 있습니다.

OpenClaw는 여전히 관찰할 수 있는 작업을 기준으로 세션을 분류합니다.

- `session.long_running`: 활성 임베디드 작업, 모델 호출 또는 도구 호출이 여전히 진행 중입니다. `diagnostics.stuckSessionWarnMs`가 지난 뒤에도 응답이 없는 소유 모델 호출은 `diagnostics.stuckSessionAbortMs` 이전에는 장기 실행으로 보고되므로, 중단 여부를 관찰할 수 있는 동안 느리거나 스트리밍하지 않는 모델 제공자가 정지된 Gateway 세션처럼 보이지 않습니다.
- `session.stalled`: 활성 작업이 존재하지만 활성 실행에서 최근 진행을 보고하지 않았습니다. 소유 모델 호출은 `diagnostics.stuckSessionAbortMs`에 도달하거나 이를 지난 시점에 `session.long_running`에서 `session.stalled`로 전환됩니다. 소유자가 없는 오래된 모델/도구 활동은 무해한 장기 실행 작업으로 취급되지 않습니다. 정지된 임베디드 실행은 처음에는 관찰만 유지하다가 `diagnostics.stuckSessionAbortMs` 동안 진행이 없으면 중단 후 드레이닝하여 해당 레인 뒤에 대기 중인 턴이 재개될 수 있게 합니다. 설정하지 않으면 중단 임계값은 최소 5분이면서 `diagnostics.stuckSessionWarnMs`의 3배인 더 안전한 확장 시간 범위를 기본값으로 사용합니다.
- `session.stuck`: 활성 작업이 없는 오래된 세션 장부 상태이거나, 소유자가 없는 오래된 모델/도구 활동이 있는 유휴 대기 세션입니다. 복구 게이트를 통과하면 영향을 받는 세션 레인을 즉시 해제합니다.

복구는 구조화된 `session.recovery.requested` 및 `session.recovery.completed` 이벤트를 발생시킵니다. 진단 세션 상태는 상태를 변경하는 복구 결과(`aborted` 또는 `released`) 이후에만, 그리고 동일한 처리 세대가 여전히 현재 상태인 경우에만 유휴로 표시됩니다.

`openclaw.session.stuck` 카운터, `openclaw.session.stuck_age_ms` 히스토그램 및 `openclaw.session.stuck` 스팬은 `session.stuck`에서만 발생합니다. 세션이 변경되지 않은 상태에서는 반복되는 `session.stuck` 진단의 발생 간격이 점차 늘어나므로, 대시보드에서는 각 Heartbeat 틱이 아니라 지속적인 증가를 기준으로 경고해야 합니다. 구성 옵션과 기본값은 [구성 참조](/ko/gateway/configuration-reference#diagnostics)를 참고하세요.

활성 상태 경고는 다음 항목도 발생시킵니다.

- `openclaw.liveness.warning`(카운터, 속성: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms`(히스토그램, 속성: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms`(히스토그램, 속성: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization`(히스토그램, 속성: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio`(히스토그램, 속성: `openclaw.liveness.reason`)

### 하네스 수명 주기

- `openclaw.harness.duration_ms`(히스토그램, 속성: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, 오류 발생 시 `openclaw.harness.phase`)

### 도구 실행 및 루프 감지

- `openclaw.tool.execution.duration_ms`(히스토그램, 속성: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, 오류 발생 시 추가로 `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked`(카운터, 속성: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop`(카운터, 속성: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, 선택적 `openclaw.loop.paired_tool`, 반복적인 도구 호출 루프가 감지될 때 발생)

### 실행

- `openclaw.exec.duration_ms`(히스토그램, 속성: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### 진단 내부 항목(메모리, 페이로드, 내보내기 도구 상태)

- `openclaw.payload.large`(카운터, 속성: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes`(히스토그램, 속성: `openclaw.payload.large`와 동일)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes`(히스토그램, 속성 없음, 프로세스 메모리 샘플)
- `openclaw.memory.pressure`(카운터, 속성: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped`(카운터, 속성: `openclaw.diagnostic.async_queue.drop_class`, 내부 진단 큐의 역압력으로 인한 삭제)
- `openclaw.telemetry.exporter.events`(카운터, 속성: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, 선택적 `openclaw.reason`, 선택적 `openclaw.errorCategory`, 내보내기 도구 수명 주기/실패 자체 텔레메트리)

## 내보낸 스팬

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*`(input/output/cache_read/cache_write/total)
  - 기본적으로 `gen_ai.system`, 또는 최신 GenAI 의미 체계 규칙을 사용하도록 선택한 경우 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - 기본적으로 `gen_ai.system`, 또는 최신 GenAI 의미 체계 규칙을 사용하도록 선택한 경우 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - 오류 발생 시 `openclaw.errorCategory`, `error.type` 및 선택적 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars`(안전한 구성 요소 크기만 포함하며 프롬프트 텍스트는 제외)
  - 모델 호출 결과에 해당 개별 호출의 제공자 사용량이 포함된 경우 `openclaw.model_call.usage.*` 및 `gen_ai.usage.*`
  - 업스트림 제공자 결과에 요청 ID가 노출된 경우 `openclaw.upstreamRequestIdHash` 속성(크기가 제한된 해시 기반)을 포함하는 스팬 이벤트 `openclaw.provider.request`; 원시 ID는 절대 내보내지 않음
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`을 설정하면 모델 호출 스팬은 `openclaw.model.call` 대신 최신 GenAI 추론 스팬 이름 `{gen_ai.operation.name} {gen_ai.request.model}`과 `CLIENT` 스팬 종류를 사용합니다.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 완료 시: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - 오류 발생 시: `openclaw.harness.phase`, `openclaw.errorCategory`, 선택적 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name`(`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, 선택적 `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - 오류 발생 시 선택적 `openclaw.errorCategory`/`openclaw.errorCode`, 정책 또는 샌드박스에 의해 거부된 경우 `openclaw.deniedReason` 및 `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory`(프롬프트, 기록, 응답 또는 세션 키 콘텐츠는 제외)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, 선택적 `openclaw.loop.paired_tool`(루프 메시지, 매개변수 또는 도구 출력은 제외)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, 선택적 `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

콘텐츠 캡처가 명시적으로 활성화된 경우 모델 및 도구 스팬에는 사용하도록 선택한 특정 콘텐츠 클래스에 대해 크기가 제한되고 민감 정보가 삭제된 `openclaw.content.*` 속성도 포함될 수 있습니다.

## 진단 이벤트 카탈로그

아래 이벤트는 위의 메트릭과 스팬을 지원합니다. Plugin은 OTLP로 내보내지 않고도 이를 직접 구독할 수 있습니다.

**모델 사용량**

- `model.usage` - 토큰, 비용, 소요 시간, 컨텍스트, 제공자/모델/채널, 세션 ID. `usage`는 비용 및 원격 측정을 위한 제공자/턴 단위 집계이며, `context.used`는 현재 프롬프트/컨텍스트 스냅샷입니다. 캐시된 입력이나 도구 루프 호출이 포함된 경우 `context.used`는 제공자의 `usage.total`보다 작을 수 있습니다.

**메시지 흐름**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**대기열 및 세션**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`(집계 카운터: Webhook/대기열/세션)

**하네스 수명 주기**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - 에이전트 하네스의 실행별 수명 주기입니다. `harnessId`, 선택적 `pluginId`, 제공자/모델/채널 및 실행 ID를 포함합니다. 완료 이벤트에는 `durationMs`, `outcome`, 선택적 `resultClassification`, `yieldDetected` 및 `itemLifecycle` 개수가 추가됩니다. 오류 이벤트에는 `phase`(`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` 및 선택적 `cleanupFailed`가 추가됩니다.

**실행**

- `exec.process.completed` - 터미널 결과, 소요 시간, 대상, 모드, 종료 코드 및 실패 종류입니다. 명령 텍스트와 작업 디렉터리는 포함되지 않습니다.
- `exec.approval.followup_suppressed` - 세션이 다시 연결된 후 오래된 승인 후속 처리를 삭제합니다. `approvalId`, `reason`(`session_rebound`), `phase`(`direct_delivery` 또는 `gateway_preflight`) 및 디스패처 타임스탬프를 포함합니다. 세션 키, 경로 및 명령 텍스트는 포함되지 않습니다.

## 내보내기 도구 없이 사용

`diagnostics-otel`을 실행하지 않고도 Plugin 또는 사용자 지정 싱크에서 진단 이벤트를 사용할 수 있도록 유지합니다.

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level`을 높이지 않고 특정 디버그 출력을 활성화하려면 진단 플래그를 사용합니다. 플래그는 대소문자를 구분하지 않으며 와일드카드(`telegram.*` 또는 `*`)를 지원합니다.

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

또는 일회성 환경 변수 재정의로 설정합니다.

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

플래그 출력은 표준 로그 파일(`logging.file`)에 기록되며, 여전히 `logging.redactSensitive`에 의해 민감 정보가 삭제됩니다. 전체 안내서:
[진단 플래그](/ko/diagnostics/flags).

## 비활성화

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

또는 `plugins.allow`에서 `diagnostics-otel`을 제외하거나 `openclaw plugins disable diagnostics-otel`을 실행합니다.

## 관련 항목

- [로깅](/ko/logging) - 파일 로그, 콘솔 출력, CLI 테일링 및 Control UI 로그 탭
- [Gateway 로깅 내부 구조](/ko/gateway/logging) - WS 로그 스타일, 하위 시스템 접두사 및 콘솔 캡처
- [진단 플래그](/ko/diagnostics/flags) - 특정 디버그 로그 플래그
- [진단 내보내기](/ko/gateway/diagnostics) - 운영자 지원 번들 도구(OTEL 내보내기와 별개)
- [구성 참조](/ko/gateway/configuration-reference#diagnostics) - 전체 `diagnostics.*` 필드 참조
