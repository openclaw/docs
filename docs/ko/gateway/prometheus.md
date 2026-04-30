---
read_when:
    - Prometheus, Grafana, VictoriaMetrics 또는 다른 스크레이퍼가 OpenClaw Gateway 메트릭을 수집하도록 하려는 경우
    - 대시보드나 알림에 사용할 Prometheus 메트릭 이름과 레이블 정책이 필요합니다
    - OpenTelemetry 수집기를 실행하지 않고 메트릭을 사용하려는 경우
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin을 통해 OpenClaw 진단을 Prometheus 텍스트 메트릭으로 노출
title: Prometheus 메트릭
x-i18n:
    generated_at: "2026-04-30T06:32:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw는 번들된 `diagnostics-prometheus` Plugin을 통해 진단 메트릭을 노출할 수 있습니다. 신뢰할 수 있는 내부 진단을 수신하고 다음 위치에 Prometheus 텍스트 엔드포인트를 렌더링합니다:

```text
GET /api/diagnostics/prometheus
```

콘텐츠 유형은 표준 Prometheus 노출 형식인 `text/plain; version=0.0.4; charset=utf-8`입니다.

<Warning>
이 라우트는 Gateway 인증(operator 범위)을 사용합니다. 공개 미인증 `/metrics` 엔드포인트로 노출하지 마세요. 다른 operator API에 사용하는 것과 동일한 인증 경로를 통해 스크레이프하세요.
</Warning>

트레이스, 로그, OTLP 푸시, OpenTelemetry GenAI 의미론적 속성은 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하세요.

## 빠른 시작

<Steps>
  <Step title="Plugin 활성화">
    <Tabs>
      <Tab title="구성">
        ```json5
        {
          plugins: {
            allow: ["diagnostics-prometheus"],
            entries: {
              "diagnostics-prometheus": { enabled: true },
            },
          },
          diagnostics: {
            enabled: true,
          },
        }
        ```
      </Tab>
      <Tab title="CLI">
        ```bash
        openclaw plugins enable diagnostics-prometheus
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Gateway 다시 시작">
    HTTP 라우트는 Plugin 시작 시 등록되므로, 활성화한 뒤 다시 로드하세요.
  </Step>
  <Step title="보호된 라우트 스크레이프">
    operator 클라이언트가 사용하는 것과 동일한 Gateway 인증을 보내세요:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus 연결">
    ```yaml
    # prometheus.yml
    scrape_configs:
      - job_name: openclaw
        scrape_interval: 30s
        metrics_path: /api/diagnostics/prometheus
        authorization:
          credentials_file: /etc/prometheus/openclaw-gateway-token
        static_configs:
          - targets: ["openclaw-gateway:18789"]
    ```
  </Step>
</Steps>

<Note>
`diagnostics.enabled: true`가 필요합니다. 이 설정이 없으면 Plugin은 HTTP 라우트를 계속 등록하지만 진단 이벤트가 exporter로 흐르지 않아 응답이 비어 있습니다.
</Note>

## 내보내는 메트릭

| 메트릭                                        | 유형      | 레이블                                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | counter   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | 없음                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | 없음                                                                                      |

## 레이블 정책

<AccordionGroup>
  <Accordion title="제한된 낮은 카디널리티 레이블">
    Prometheus 레이블은 제한되고 낮은 카디널리티를 유지합니다. exporter는 `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, 메시지 ID, 채팅 ID, provider 요청 ID 같은 원시 진단 식별자를 내보내지 않습니다.

    레이블 값은 수정 처리되며 OpenClaw의 낮은 카디널리티 문자 정책과 일치해야 합니다. 정책을 통과하지 못한 값은 메트릭에 따라 `unknown`, `other` 또는 `none`으로 대체됩니다.

  </Accordion>
  <Accordion title="시리즈 한도 및 초과 계산">
    exporter는 counter, gauge, histogram을 모두 합쳐 메모리에 보존하는 시계열을 **2048**개로 제한합니다. 이 한도를 초과하는 새 시리즈는 삭제되며, 그때마다 `openclaw_prometheus_series_dropped_total`이 1씩 증가합니다.

    이 counter를 상위 속성이 높은 카디널리티 값을 누출하고 있다는 강한 신호로 관찰하세요. exporter는 한도를 자동으로 올리지 않습니다. 값이 증가하면 한도를 비활성화하지 말고 소스에서 문제를 수정하세요.

  </Accordion>
  <Accordion title="Prometheus 출력에 절대 나타나지 않는 항목">
    - 프롬프트 텍스트, 응답 텍스트, 도구 입력, 도구 출력, 시스템 프롬프트
    - 원시 provider 요청 ID(해당하는 경우 span에는 제한된 해시만 포함되며, 메트릭에는 절대 포함되지 않음)
    - 세션 키와 세션 ID
    - 호스트 이름, 파일 경로, 비밀 값

  </Accordion>
</AccordionGroup>

## PromQL 레시피

```promql
# Tokens per minute, split by provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Spend (USD) over the last hour, by model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95th percentile model run duration
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# Queue wait time SLO (95p under 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
여러 provider를 아우르는 대시보드에는 `gen_ai_client_token_usage`를 선호하세요. OpenTelemetry GenAI 의미론적 규칙을 따르며 OpenClaw가 아닌 GenAI 서비스의 메트릭과 일관됩니다.
</Tip>

## Prometheus와 OpenTelemetry 내보내기 중 선택

OpenClaw는 두 표면을 독립적으로 지원합니다. 둘 중 하나만 실행하거나, 둘 다 실행하거나, 둘 다 실행하지 않을 수 있습니다.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** 모델: Prometheus가 `/api/diagnostics/prometheus`를 스크레이프합니다.
    - 외부 collector가 필요하지 않습니다.
    - 일반 Gateway 인증을 통해 인증됩니다.
    - 표면은 메트릭만 포함합니다(트레이스나 로그 없음).
    - 이미 Prometheus + Grafana로 표준화된 스택에 가장 적합합니다.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** 모델: OpenClaw가 collector 또는 OTLP 호환 백엔드로 OTLP/HTTP를 보냅니다.
    - 표면에는 메트릭, 트레이스, 로그가 포함됩니다.
    - 둘 다 필요할 때 OpenTelemetry Collector(`prometheus` 또는 `prometheusremotewrite` exporter)를 통해 Prometheus로 연결합니다.
    - 전체 카탈로그는 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하세요.

  </Tab>
</Tabs>

## 문제 해결

<AccordionGroup>
  <Accordion title="응답 본문이 비어 있음">
    - 구성에서 `diagnostics.enabled: true`를 확인하세요.
    - `openclaw plugins list --enabled`로 Plugin이 활성화되고 로드되었는지 확인하세요.
    - 일부 트래픽을 생성하세요. counter와 histogram은 이벤트가 하나 이상 발생한 뒤에만 줄을 내보냅니다.

  </Accordion>
  <Accordion title="401 / 인증되지 않음">
    엔드포인트에는 Gateway operator 범위(`auth: "gateway"` 및 `gatewayRuntimeScopeSurface: "trusted-operator"`)가 필요합니다. Prometheus가 다른 Gateway operator 라우트에 사용하는 것과 동일한 토큰 또는 비밀번호를 사용하세요. 공개 미인증 모드는 없습니다.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total`이 증가함">
    새 속성이 **2048**개 시리즈 한도를 초과하고 있습니다. 최근 메트릭에서 예상치 못하게 카디널리티가 높은 레이블을 검사하고 소스에서 수정하세요. exporter는 레이블을 조용히 다시 쓰는 대신 의도적으로 새 시리즈를 삭제합니다.
  </Accordion>
  <Accordion title="Gateway 재시작 후 Prometheus에 오래된 시리즈가 표시됨">
    Plugin은 상태를 메모리에만 유지합니다. Gateway를 재시작하면 counter는 0으로 재설정되고 gauge는 다음에 보고되는 값에서 다시 시작됩니다. 재설정을 깔끔하게 처리하려면 PromQL `rate()`와 `increase()`를 사용하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [진단 내보내기](/ko/gateway/diagnostics) — 지원 번들을 위한 로컬 진단 zip
- [상태 및 준비성](/ko/gateway/health) — `/healthz` 및 `/readyz` probe
- [로깅](/ko/logging) — 파일 기반 로깅
- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry) — 트레이스, 메트릭, 로그를 위한 OTLP 푸시
