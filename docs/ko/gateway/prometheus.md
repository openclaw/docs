---
read_when:
    - Prometheus, Grafana, VictoriaMetrics 또는 다른 스크레이퍼가 OpenClaw Gateway 메트릭을 수집하도록 하려는 경우
    - 대시보드 또는 알림을 위한 Prometheus 메트릭 이름과 레이블 정책이 필요합니다
    - OpenTelemetry 컬렉터를 실행하지 않고 메트릭을 원합니다
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin을 통해 OpenClaw 진단 정보를 Prometheus 텍스트 메트릭으로 노출하기
title: Prometheus 메트릭
x-i18n:
    generated_at: "2026-06-27T17:30:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw은 공식 `diagnostics-prometheus` Plugin을 통해 진단 메트릭을 노출할 수 있습니다. 신뢰할 수 있는 진단과 코어에서 내보내는 Gateway 안정성 이벤트를 수신한 다음, 다음 위치에서 Prometheus 텍스트 엔드포인트를 렌더링합니다.

  ```text
  GET /api/diagnostics/prometheus
  ```

  콘텐츠 유형은 표준 Prometheus 노출 형식인 `text/plain; version=0.0.4; charset=utf-8`입니다.

  <Warning>
  이 라우트는 Gateway 인증(운영자 범위)을 사용합니다. 공개 무인증 `/metrics` 엔드포인트로 노출하지 마세요. 다른 운영자 API에 사용하는 것과 동일한 인증 경로를 통해 스크레이프하세요.
  </Warning>

  트레이스, 로그, OTLP 푸시, OpenTelemetry GenAI 의미 속성은 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하세요.

  ## 빠른 시작

  <Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
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
  <Step title="Gateway 재시작">
    HTTP 라우트는 Plugin 시작 시 등록되므로, 활성화한 뒤 다시 로드하세요.
  </Step>
  <Step title="보호된 라우트 스크레이프">
    운영자 클라이언트가 사용하는 것과 동일한 Gateway 인증을 보내세요.

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
`diagnostics.enabled: true`가 필요합니다. 이 설정이 없으면 Plugin은 여전히 HTTP 라우트를 등록하지만 진단 이벤트가 exporter로 흐르지 않으므로 응답은 비어 있습니다.
</Note>

## 내보내는 메트릭

| 메트릭                                           | 유형      | 레이블                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | counter   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | counter   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | counter   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | counter   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | counter   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | counter   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | counter   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | counter   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | 없음                                                                                      |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | 없음                                                                                      |

## 레이블 정책

<AccordionGroup>
  <Accordion title="제한된 낮은 카디널리티 레이블">
    Prometheus 레이블은 제한된 낮은 카디널리티를 유지합니다. exporter는 `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, 메시지 ID, 채팅 ID 또는 provider 요청 ID 같은 원시 진단 식별자를 내보내지 않습니다.

    레이블 값은 수정 처리되며 OpenClaw의 낮은 카디널리티 문자 정책과 일치해야 합니다. 정책을 통과하지 못한 값은 메트릭에 따라 `unknown`, `other` 또는 `none`으로 대체됩니다. 범위가 지정된 agent 세션 키처럼 보이는 레이블도 `unknown`으로 대체됩니다.

  </Accordion>
  <Accordion title="시리즈 한도 및 오버플로 계정 처리">
    exporter는 counter, gauge, histogram을 합쳐 메모리에 보관되는 시계열을 **2048**개로 제한합니다. 이 한도를 초과하는 새 시리즈는 삭제되며, 그때마다 `openclaw_prometheus_series_dropped_total`이 1씩 증가합니다.

    이 counter를 upstream 속성이 높은 카디널리티 값을 누출하고 있다는 강한 신호로 감시하세요. exporter는 한도를 자동으로 올리지 않습니다. 값이 증가하면 한도를 비활성화하지 말고 원인을 수정하세요.

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - 프롬프트 텍스트, 응답 텍스트, 도구 입력, 도구 출력, 시스템 프롬프트
    - Talk 기록, 오디오 페이로드, 호출 ID, 방 ID, 핸드오프 토큰, 턴 ID, 원시 세션 ID
    - 원시 제공자 요청 ID(해당하는 경우 span에는 제한된 해시만 포함되며, 메트릭에는 절대 포함되지 않음)
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

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
교차 제공자 대시보드에는 `gen_ai_client_token_usage`를 선호하세요. 이 메트릭은 OpenTelemetry GenAI 의미 체계를 따르며 OpenClaw가 아닌 GenAI 서비스의 메트릭과도 일관됩니다.
</Tip>

## Prometheus와 OpenTelemetry 내보내기 중 선택하기

OpenClaw는 두 표면을 독립적으로 모두 지원합니다. 둘 중 하나를 실행하거나, 둘 다 실행하거나, 아무것도 실행하지 않을 수 있습니다.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** 모델: Prometheus가 `/api/diagnostics/prometheus`를 스크레이프합니다.
    - 외부 컬렉터가 필요 없습니다.
    - 일반 Gateway 인증을 통해 인증됩니다.
    - 표면은 메트릭 전용입니다(트레이스나 로그 없음).
    - 이미 Prometheus + Grafana로 표준화된 스택에 가장 적합합니다.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** 모델: OpenClaw가 OTLP/HTTP를 컬렉터 또는 OTLP 호환 백엔드로 전송합니다.
    - 표면에는 메트릭, 트레이스, 로그가 포함됩니다.
    - 둘 다 필요할 때 OpenTelemetry Collector(`prometheus` 또는 `prometheusremotewrite` exporter)를 통해 Prometheus로 연결합니다.
    - 전체 카탈로그는 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하세요.

  </Tab>
</Tabs>

## 문제 해결

<AccordionGroup>
  <Accordion title="Empty response body">
    - 설정에서 `diagnostics.enabled: true`를 확인하세요.
    - `openclaw plugins list --enabled`로 Plugin이 활성화되고 로드되었는지 확인하세요.
    - 약간의 트래픽을 생성하세요. 카운터와 히스토그램은 이벤트가 하나 이상 발생한 뒤에만 줄을 내보냅니다.

  </Accordion>
  <Accordion title="401 / unauthorized">
    엔드포인트에는 Gateway 운영자 범위(`gatewayRuntimeScopeSurface: "trusted-operator"`와 함께 `auth: "gateway"`)가 필요합니다. Prometheus가 다른 Gateway 운영자 경로에 사용하는 것과 동일한 토큰 또는 비밀번호를 사용하세요. 공개 비인증 모드는 없습니다.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    새 속성이 **2048**개 시리즈 상한을 초과하고 있습니다. 최근 메트릭에서 예상치 못한 고카디널리티 레이블을 검사하고 원본에서 수정하세요. exporter는 레이블을 조용히 다시 쓰는 대신 의도적으로 새 시리즈를 버립니다.
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    Plugin은 상태를 메모리에만 유지합니다. Gateway를 다시 시작하면 카운터는 0으로 재설정되고 게이지는 다음 보고 값부터 다시 시작됩니다. 재설정을 깔끔하게 처리하려면 PromQL `rate()`와 `increase()`를 사용하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [진단 내보내기](/ko/gateway/diagnostics) — 지원 번들용 로컬 진단 zip
- [상태 및 준비성](/ko/gateway/health) — `/healthz` 및 `/readyz` 프로브
- [로깅](/ko/logging) — 파일 기반 로깅
- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry) — 트레이스, 메트릭, 로그를 위한 OTLP Push
