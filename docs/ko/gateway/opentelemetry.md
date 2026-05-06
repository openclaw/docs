---
read_when:
    - OpenClaw 모델 사용량, 메시지 흐름 또는 세션 메트릭을 OpenTelemetry 수집기로 보내려는 경우
    - Grafana, Datadog, Honeycomb, New Relic, Tempo 또는 다른 OTLP 백엔드에 트레이스, 메트릭 또는 로그를 연결하는 경우
    - 대시보드 또는 알림을 구축하려면 정확한 메트릭 이름, 스팬 이름 또는 속성 형태가 필요합니다
summary: diagnostics-otel Plugin(OTLP/HTTP)을 통해 OpenClaw 진단 정보를 모든 OpenTelemetry 수집기로 내보내기
title: OpenTelemetry 내보내기
x-i18n:
    generated_at: "2026-05-06T17:56:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw는 공식 `diagnostics-otel` Plugin을 통해 **OTLP/HTTP (protobuf)**로 진단 정보를 내보냅니다. OTLP/HTTP를 수신하는 모든 컬렉터나 백엔드는 코드 변경 없이 작동합니다. 로컬 파일 로그와 읽는 방법은 [로깅](/ko/logging)을 참조하세요.

## 전체 구성 방식

- **진단 이벤트**는 Gateway와 번들 Plugin이 모델 실행, 메시지 흐름, 세션, 큐, exec에 대해 내보내는 구조화된 인프로세스 레코드입니다.
- **`diagnostics-otel` Plugin**은 이러한 이벤트를 구독하고 OTLP/HTTP를 통해 OpenTelemetry **메트릭**, **트레이스**, **로그**로 내보냅니다.
- **Provider 호출**은 provider 전송 계층이 사용자 지정 헤더를 허용할 때 OpenClaw의 신뢰된 모델 호출 span 컨텍스트에서 W3C `traceparent` 헤더를 받습니다. Plugin에서 내보낸 trace 컨텍스트는 전파되지 않습니다.
- 내보내기는 진단 표면과 Plugin이 모두 활성화된 경우에만 연결되므로, 기본적으로 인프로세스 비용은 거의 0에 가깝게 유지됩니다.

## 빠른 시작

패키지 설치에서는 먼저 Plugin을 설치하세요.

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

CLI에서 Plugin을 활성화할 수도 있습니다.

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol`은 현재 `http/protobuf`만 지원합니다. `grpc`는 무시됩니다.
</Note>

## 내보내는 신호

| 신호        | 포함되는 내용                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **메트릭**  | 토큰 사용량, 비용, 실행 시간, 메시지 흐름, Talk 이벤트, 큐 lane, 세션 상태/복구, exec, 메모리 압박에 대한 카운터와 히스토그램입니다.                           |
| **트레이스** | 모델 사용량, 모델 호출, harness 수명 주기, 도구 실행, exec, webhook/메시지 처리, 컨텍스트 조립, 도구 루프에 대한 span입니다.                                  |
| **로그**    | `diagnostics.otel.logs`가 활성화된 경우 OTLP를 통해 내보내는 구조화된 `logging.file` 레코드입니다.                                                              |

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

| 변수                                                                                                              | 목적                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint`를 재정의합니다. 값에 이미 `/v1/traces`, `/v1/metrics`, 또는 `/v1/logs`가 포함되어 있으면 그대로 사용됩니다.                                                                                                    |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 일치하는 `diagnostics.otel.*Endpoint` 구성 키가 설정되지 않았을 때 사용되는 신호별 엔드포인트 재정의입니다. 신호별 구성이 신호별 환경 변수보다 우선하고, 신호별 환경 변수가 공유 엔드포인트보다 우선합니다.                              |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName`을 재정의합니다.                                                                                                                                                                                             |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | wire 프로토콜을 재정의합니다. 현재는 `http/protobuf`만 적용됩니다.                                                                                                                                                                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 레거시 `gen_ai.system` 대신 최신 실험적 GenAI span 속성(`gen_ai.provider.name`)을 내보내려면 `gen_ai_latest_experimental`로 설정합니다. GenAI 메트릭은 항상 제한된 낮은 카디널리티의 의미론적 속성을 사용합니다.                         |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 다른 preload 또는 호스트 프로세스가 이미 전역 OpenTelemetry SDK를 등록한 경우 `1`로 설정합니다. 그러면 Plugin은 자체 NodeSDK 수명 주기를 건너뛰지만 진단 listener를 계속 연결하고 `traces`/`metrics`/`logs`를 적용합니다.               |

## 개인정보 보호 및 콘텐츠 캡처

원시 모델/도구 콘텐츠는 기본적으로 내보내지 **않습니다**. Span은 제한된 식별자(channel, provider, model, 오류 범주, 해시 전용 요청 ID)를 포함하며, 프롬프트 텍스트, 응답 텍스트, 도구 입력, 도구 출력 또는 세션 키를 절대 포함하지 않습니다.
Talk 메트릭은 mode, transport, provider, event type 같은 제한된 이벤트 메타데이터만 내보냅니다. transcript, 오디오 페이로드, 세션 ID, turn ID, call ID, room ID 또는 handoff token은 포함하지 않습니다.

아웃바운드 모델 요청에는 W3C `traceparent` 헤더가 포함될 수 있습니다. 이 헤더는 활성 모델 호출에 대해 OpenClaw가 소유한 진단 trace 컨텍스트에서만 생성됩니다. 기존 호출자 제공 `traceparent` 헤더는 교체되므로 Plugin이나 사용자 지정 provider 옵션이 서비스 간 trace 조상을 스푸핑할 수 없습니다.

컬렉터와 보존 정책이 프롬프트, 응답, 도구 또는 system-prompt 텍스트에 대해 승인된 경우에만 `diagnostics.otel.captureContent.*`를 `true`로 설정하세요. 각 하위 키는 독립적으로 opt-in입니다.

- `inputMessages` - 사용자 프롬프트 콘텐츠.
- `outputMessages` - 모델 응답 콘텐츠.
- `toolInputs` - 도구 인자 페이로드.
- `toolOutputs` - 도구 결과 페이로드.
- `systemPrompt` - 조립된 system/developer 프롬프트.

하위 키가 하나라도 활성화되면 모델 및 도구 span에는 해당 클래스에 대해서만 제한되고 수정된 `openclaw.content.*` 속성이 추가됩니다.

## 샘플링 및 플러시

- **트레이스:** `diagnostics.otel.sampleRate`(root-span만 해당, `0.0`은 모두 버리고 `1.0`은 모두 유지).
- **메트릭:** `diagnostics.otel.flushIntervalMs`(최소 `1000`).
- **로그:** OTLP 로그는 `logging.level`(파일 로그 수준)을 따릅니다. 콘솔 형식 지정이 아니라 진단 로그 레코드 수정 경로를 사용합니다. 대용량 설치에서는 로컬 샘플링보다 OTLP 컬렉터 샘플링/필터링을 선호해야 합니다.
- **파일 로그 상관관계:** JSONL 파일 로그는 로그 호출에 유효한 진단 trace 컨텍스트가 있을 때 최상위 `traceId`, `spanId`, `parentSpanId`, `traceFlags`를 포함하므로, 로그 프로세서가 로컬 로그 줄을 내보낸 span과 결합할 수 있습니다.
- **요청 상관관계:** Gateway HTTP 요청과 WebSocket 프레임은 내부 요청 trace 범위를 생성합니다. 해당 범위 안의 로그와 진단 이벤트는 기본적으로 요청 trace를 상속하고, agent 실행 및 모델 호출 span은 자식으로 생성되어 provider `traceparent` 헤더가 동일한 trace에 유지됩니다.

## 내보내는 메트릭

### 모델 사용량

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconds, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` and `openclaw.failureKind` on classified errors)
- `openclaw.model_call.request_bytes` (histogram, 최종 모델 요청 페이로드의 UTF-8 바이트 크기; 원시 페이로드 콘텐츠 없음)
- `openclaw.model_call.response_bytes` (histogram, 스트리밍된 모델 응답 이벤트의 UTF-8 바이트 크기; 원시 응답 콘텐츠 없음)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, 첫 번째 스트리밍 응답 이벤트 전까지의 경과 시간)

### 메시지 흐름

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: `openclaw.talk.event`와 동일; Talk 이벤트가 duration을 보고할 때 내보냄)
- `openclaw.talk.audio.bytes` (histogram, attrs: `openclaw.talk.event`와 동일; 바이트 길이를 보고하는 Talk 오디오 프레임 이벤트에 대해 내보냄)

### 큐와 세션

- `openclaw.queue.lane.enqueue`(카운터, 속성: `openclaw.lane`)
- `openclaw.queue.lane.dequeue`(카운터, 속성: `openclaw.lane`)
- `openclaw.queue.depth`(히스토그램, 속성: `openclaw.lane` 또는 `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms`(히스토그램, 속성: `openclaw.lane`)
- `openclaw.session.state`(카운터, 속성: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck`(카운터, 속성: `openclaw.state`; 활성 작업이 없는 오래된 세션 기록 관리에만 내보냄)
- `openclaw.session.stuck_age_ms`(히스토그램, 속성: `openclaw.state`; 활성 작업이 없는 오래된 세션 기록 관리에만 내보냄)
- `openclaw.session.recovery.requested`(카운터, 속성: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed`(카운터, 속성: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms`(히스토그램, 속성: 일치하는 복구 카운터와 동일)
- `openclaw.run.attempt`(카운터, 속성: `openclaw.attempt`)

### 세션 활성 상태 텔레메트리

`diagnostics.stuckSessionWarnMs`는 세션 활성 상태 진단을 위한 진행 없음 경과 시간 임계값입니다. OpenClaw가 응답, 도구, 상태, 블록 또는 ACP 런타임 진행을 관찰하는 동안 `processing` 세션은 이 임계값을 향해 경과 시간이 누적되지 않습니다. 입력 keepalive는 진행으로 계산되지 않으므로, 조용한 모델이나 하네스도 여전히 감지될 수 있습니다.

OpenClaw는 아직 관찰할 수 있는 작업을 기준으로 세션을 분류합니다.

- `session.long_running`: 활성 내장 작업, 모델 호출 또는 도구 호출이 여전히 진행 중입니다.
- `session.stalled`: 활성 작업이 있지만 활성 실행이 최근 진행 상황을 보고하지 않았습니다. 중단된 내장 실행은 처음에는 observe-only 상태로 유지된 다음, 진행이 없으면 `diagnostics.stuckSessionAbortMs` 이후 abort-drain되어 해당 레인 뒤에 대기 중인 턴이 재개될 수 있습니다. 설정되지 않은 경우 중단 임계값은 최소 10분 및 `diagnostics.stuckSessionWarnMs`의 5배인 더 안전한 확장 기간으로 기본 설정됩니다.
- `session.stuck`: 활성 작업이 없는 오래된 세션 기록 관리입니다. 이는 영향을 받는 세션 레인을 즉시 해제합니다.

복구는 구조화된 `session.recovery.requested` 및 `session.recovery.completed` 이벤트를 내보냅니다. 진단 세션 상태는 변경을 일으키는 복구 결과(`aborted` 또는 `released`) 이후에만, 그리고 동일한 처리 세대가 아직 현재 상태인 경우에만 유휴로 표시됩니다.

`session.stuck`만 `openclaw.session.stuck` 카운터, `openclaw.session.stuck_age_ms` 히스토그램, `openclaw.session.stuck` span을 내보냅니다. 반복되는 `session.stuck` 진단은 세션이 변경되지 않은 동안 백오프되므로, 대시보드는 모든 Heartbeat 틱이 아니라 지속적인 증가에 대해 경고해야 합니다. 구성 노브와 기본값은 [구성 참조](/ko/gateway/configuration-reference#diagnostics)를 참조하세요.

### 하네스 수명 주기

- `openclaw.harness.duration_ms`(히스토그램, 속성: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, 오류 시 `openclaw.harness.phase`)

### 실행

- `openclaw.exec.duration_ms`(히스토그램, 속성: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### 진단 내부 요소(메모리 및 도구 루프)

- `openclaw.memory.heap_used_bytes`(히스토그램, 속성: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes`(히스토그램)
- `openclaw.memory.pressure`(카운터, 속성: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations`(카운터, 속성: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms`(히스토그램, 속성: `openclaw.toolName`, `openclaw.outcome`)

## 내보낸 span

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*`(입력/출력/캐시 읽기/캐시 쓰기/합계)
  - 기본적으로 `gen_ai.system`, 또는 최신 GenAI 의미론적 규칙을 선택한 경우 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - 기본적으로 `gen_ai.system`, 또는 최신 GenAI 의미론적 규칙을 선택한 경우 `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - 오류 시 `openclaw.errorCategory` 및 선택적 `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`(업스트림 제공자 요청 ID의 경계가 있는 SHA 기반 해시; 원시 ID는 내보내지 않음)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 완료 시: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - 오류 시: `openclaw.harness.phase`, `openclaw.errorCategory`, 선택적 `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory`(프롬프트, 기록, 응답 또는 세션 키 콘텐츠 없음)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory`(루프 메시지, 매개변수 또는 도구 출력 없음)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

콘텐츠 캡처가 명시적으로 활성화된 경우, 모델 및 도구 span에는 선택한 특정 콘텐츠 클래스에 대해 경계가 있고 수정된 `openclaw.content.*` 속성도 포함될 수 있습니다.

## 진단 이벤트 카탈로그

아래 이벤트는 위의 메트릭과 span을 뒷받침합니다. Plugin은 OTLP 내보내기 없이도 이를 직접 구독할 수 있습니다.

**모델 사용량**

- `model.usage` - 토큰, 비용, 기간, 컨텍스트, 제공자/모델/채널, 세션 ID. `usage`는 비용 및 텔레메트리를 위한 제공자/턴 회계입니다. `context.used`는 현재 프롬프트/컨텍스트 스냅샷이며 캐시된 입력 또는 도구 루프 호출이 관련된 경우 제공자 `usage.total`보다 낮을 수 있습니다.

**메시지 흐름**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**큐 및 세션**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`(집계 카운터: Webhook/큐/세션)

**하네스 수명 주기**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - 에이전트 하네스의 실행별 수명 주기입니다. `harnessId`, 선택적 `pluginId`, 제공자/모델/채널, 실행 ID를 포함합니다. 완료 시 `durationMs`, `outcome`, 선택적 `resultClassification`, `yieldDetected`, `itemLifecycle` 카운트가 추가됩니다. 오류 시 `phase`(`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, 선택적 `cleanupFailed`가 추가됩니다.

**실행**

- `exec.process.completed` - 터미널 결과, 기간, 대상, 모드, 종료 코드, 실패 종류입니다. 명령 텍스트와 작업 디렉터리는 포함되지 않습니다.

## exporter 없이 사용

`diagnostics-otel`을 실행하지 않고도 진단 이벤트를 Plugin이나 사용자 지정 싱크에서 사용할 수 있게 유지할 수 있습니다.

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level`을 올리지 않고 대상 지정 디버그 출력을 사용하려면 진단 플래그를 사용하세요. 플래그는 대소문자를 구분하지 않으며 와일드카드를 지원합니다(예: `telegram.*` 또는 `*`).

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

또는 일회성 환경 변수 재정의로 사용할 수 있습니다.

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

플래그 출력은 표준 로그 파일(`logging.file`)로 이동하며, 여전히 `logging.redactSensitive`에 의해 수정됩니다. 전체 가이드: [진단 플래그](/ko/diagnostics/flags).

## 비활성화

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`plugins.allow`에서 `diagnostics-otel`을 제외하거나 `openclaw plugins disable diagnostics-otel`을 실행할 수도 있습니다.

## 관련 항목

- [로깅](/ko/logging) - 파일 로그, 콘솔 출력, CLI tailing, Control UI 로그 탭
- [Gateway 로깅 내부 요소](/ko/gateway/logging) - WS 로그 스타일, 하위 시스템 접두사, 콘솔 캡처
- [진단 플래그](/ko/diagnostics/flags) - 대상 지정 디버그 로그 플래그
- [진단 내보내기](/ko/gateway/diagnostics) - 운영자 지원 번들 도구(OTEL 내보내기와 별도)
- [구성 참조](/ko/gateway/configuration-reference#diagnostics) - 전체 `diagnostics.*` 필드 참조
