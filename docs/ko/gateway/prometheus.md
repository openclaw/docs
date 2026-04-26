---
read_when:
    - Prometheus, Grafana, VictoriaMetrics 또는 다른 스크레이퍼가 OpenClaw Gateway 메트릭을 수집하도록 하려는 경우
    - 대시보드 또는 알림을 위해 Prometheus 메트릭 이름과 라벨 정책이 필요한 경우
    - OpenTelemetry collector를 실행하지 않고 메트릭을 사용하려는 경우
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin을 통해 OpenClaw 진단을 Prometheus 텍스트 메트릭으로 노출하기
title: Prometheus 메트릭
x-i18n:
    generated_at: "2026-04-26T11:30:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw는 번들된 `diagnostics-prometheus` Plugin을 통해 진단 메트릭을 노출할 수 있습니다. 이 Plugin은 신뢰된 내부 진단을 수신하고 다음 위치에 Prometheus 텍스트 엔드포인트를 렌더링합니다.

```text
GET /api/diagnostics/prometheus
```

Content type은 표준 Prometheus exposition 형식인 `text/plain; version=0.0.4; charset=utf-8`입니다.

<Warning>
이 경로는 Gateway 인증(operator 범위)을 사용합니다. 이를 공개된 인증 없는 `/metrics` 엔드포인트로 노출하지 마세요. 다른 operator API에 사용하는 것과 동일한 인증 경로를 통해 스크레이프하세요.
</Warning>

트레이스, 로그, OTLP push, OpenTelemetry GenAI semantic attribute는 [OpenTelemetry export](/ko/gateway/opentelemetry)를 참고하세요.

## 빠른 시작

<Steps>
  <Step title="Plugin 활성화">
    <Tabs>
      <Tab title="Config">
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
  <Step title="Gateway 재시작">
    HTTP 경로는 Plugin 시작 시 등록되므로, 활성화 후 다시 로드하세요.
  </Step>
  <Step title="보호된 경로 스크레이프">
    operator 클라이언트가 사용하는 것과 동일한 gateway 인증을 전송하세요.

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
`diagnostics.enabled: true`가 필요합니다. 이것이 없으면 Plugin은 HTTP 경로를 등록하더라도 exporter로 진단 이벤트가 흐르지 않으므로 응답이 비어 있습니다.
</Note>

## 내보내는 메트릭

| 메트릭                                        | 유형      | 라벨                                                                                      |
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

## 라벨 정책

<AccordionGroup>
  <Accordion title="제한되고 낮은 카디널리티 라벨">
    Prometheus 라벨은 제한되고 낮은 카디널리티를 유지합니다. exporter는 `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, 메시지 ID, chat ID, provider 요청 ID 같은 원시 진단 식별자를 내보내지 않습니다.

    라벨 값은 마스킹되며 OpenClaw의 낮은 카디널리티 문자 정책과 일치해야 합니다. 정책을 통과하지 못하는 값은 메트릭에 따라 `unknown`, `other`, `none`으로 대체됩니다.

  </Accordion>
  <Accordion title="시리즈 상한 및 초과 집계">
    exporter는 counter, gauge, histogram을 모두 합쳐 메모리에 유지되는 시계열을 **2048**개로 제한합니다. 이 상한을 넘는 새 시리즈는 버려지며, 그때마다 `openclaw_prometheus_series_dropped_total`이 1씩 증가합니다.

    이 counter를 업스트림 attribute에서 높은 카디널리티 값이 새고 있다는 강한 신호로 관찰하세요. exporter는 상한을 자동으로 높이지 않습니다. 값이 증가한다면 상한을 끄는 대신 원인을 수정하세요.

  </Accordion>
  <Accordion title="Prometheus 출력에 절대 나타나지 않는 항목">
    - 프롬프트 텍스트, 응답 텍스트, 도구 입력, 도구 출력, system prompt
    - 원시 provider 요청 ID(해당하는 경우 span에는 제한된 해시만 존재할 수 있으나, 메트릭에는 절대 없음)
    - 세션 키와 세션 ID
    - 호스트 이름, 파일 경로, 비밀 값
  </Accordion>
</AccordionGroup>

## PromQL 예시

```promql
# 분당 토큰 수, provider별 분리
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# 지난 1시간 동안의 비용(USD), model별
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 모델 실행 시간 95백분위수
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# 큐 대기 시간 SLO (95p가 2초 미만)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# 버려진 Prometheus 시리즈(카디널리티 경보)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
교차-provider 대시보드에는 `gen_ai_client_token_usage`를 우선 사용하세요. 이 메트릭은 OpenTelemetry GenAI semantic convention을 따르며, OpenClaw가 아닌 다른 GenAI 서비스의 메트릭과도 일관됩니다.
</Tip>

## Prometheus 내보내기와 OpenTelemetry export 중 선택하기

OpenClaw는 두 표면을 독립적으로 모두 지원합니다. 둘 중 하나만 실행해도 되고, 둘 다 실행해도 되고, 둘 다 실행하지 않아도 됩니다.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** 모델: Prometheus가 `/api/diagnostics/prometheus`를 스크레이프합니다.
    - 외부 collector가 필요 없습니다.
    - 일반 Gateway 인증을 통해 인증됩니다.
    - 표면은 메트릭만 포함합니다(트레이스 또는 로그 없음).
    - 이미 Prometheus + Grafana를 표준으로 사용하는 스택에 가장 적합합니다.
  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** 모델: OpenClaw가 collector 또는 OTLP 호환 백엔드로 OTLP/HTTP를 전송합니다.
    - 표면에는 메트릭, 트레이스, 로그가 포함됩니다.
    - 둘 다 필요할 때 OpenTelemetry Collector의 `prometheus` 또는 `prometheusremotewrite` exporter를 통해 Prometheus로 브리지할 수 있습니다.
    - 전체 카탈로그는 [OpenTelemetry export](/ko/gateway/opentelemetry)를 참고하세요.
  </Tab>
</Tabs>

## 문제 해결

<AccordionGroup>
  <Accordion title="응답 본문이 비어 있음">
    - config에서 `diagnostics.enabled: true`를 확인하세요.
    - `openclaw plugins list --enabled`로 Plugin이 활성화되어 로드되었는지 확인하세요.
    - 약간의 트래픽을 발생시키세요. counter와 histogram은 적어도 한 번 이벤트가 발생한 뒤에만 라인을 출력합니다.
  </Accordion>
  <Accordion title="401 / unauthorized">
    이 엔드포인트는 Gateway operator 범위(`auth: "gateway"`, `gatewayRuntimeScopeSurface: "trusted-operator"`)를 요구합니다. Prometheus가 다른 Gateway operator 경로에 사용하는 것과 동일한 token 또는 password를 사용하세요. 공개 무인증 모드는 없습니다.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total`이 증가 중">
    새 attribute가 **2048** 시리즈 상한을 초과하고 있습니다. 최근 메트릭에서 예상보다 카디널리티가 높은 라벨을 찾아 소스에서 수정하세요. exporter는 라벨을 조용히 재작성하는 대신 의도적으로 새 시리즈를 버립니다.
  </Accordion>
  <Accordion title="재시작 후 Prometheus에 오래된 시리즈가 표시됨">
    Plugin은 상태를 메모리에만 유지합니다. Gateway 재시작 후 counter는 0으로 재설정되고 gauge는 다음 보고 값에서 다시 시작합니다. 재설정을 깔끔하게 처리하려면 PromQL의 `rate()`와 `increase()`를 사용하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [Diagnostics export](/ko/gateway/diagnostics) — 지원 번들용 로컬 diagnostics zip
- [Health and readiness](/ko/gateway/health) — `/healthz` 및 `/readyz` probe
- [Logging](/ko/logging) — 파일 기반 로깅
- [OpenTelemetry export](/ko/gateway/opentelemetry) — 트레이스, 메트릭, 로그용 OTLP push
