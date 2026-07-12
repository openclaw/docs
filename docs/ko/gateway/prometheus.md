---
read_when:
    - Prometheus, Grafana, VictoriaMetrics 또는 다른 스크레이퍼가 OpenClaw Gateway 메트릭을 수집하도록 하려는 경우
    - 대시보드 또는 알림에 사용할 Prometheus 메트릭 이름과 레이블 정책이 필요합니다
    - OpenTelemetry 수집기를 실행하지 않고 메트릭을 사용하려는 경우
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin을 통해 OpenClaw 진단 정보를 Prometheus 텍스트 메트릭으로 노출합니다
title: Prometheus 메트릭
x-i18n:
    generated_at: "2026-07-12T15:16:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw은 공식 `diagnostics-prometheus` Plugin을 통해 진단 메트릭을 제공할 수 있습니다. 이 Plugin은 신뢰할 수 있는 진단과 내부적으로 태그가 지정된 디스패처 소유 진단 이벤트(큐, 메모리 및 세션 복구 신호)를 수신하고 다음 위치에서 Prometheus 텍스트 엔드포인트를 제공합니다.

  ```text
  GET /api/diagnostics/prometheus
  ```

  콘텐츠 유형은 표준 Prometheus 노출 형식인 `text/plain; version=0.0.4; charset=utf-8`입니다.

  <Warning>
  이 경로는 Gateway 인증(운영자 범위, 신뢰할 수 있는 운영자용 표면)을 사용합니다. 인증되지 않은 공개 `/metrics` 엔드포인트로 노출하지 마십시오. 다른 운영자 API에 사용하는 것과 동일한 인증 경로를 통해 스크레이프하십시오.
  </Warning>

  트레이스, 로그, OTLP 푸시 및 OpenTelemetry GenAI 의미 체계 속성에 대해서는 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하십시오.

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
  <Step title="Gateway 다시 시작">
    HTTP 경로는 Plugin 시작 시 등록되므로 활성화한 후 다시 로드하십시오.
  </Step>
  <Step title="보호된 경로 스크레이프">
    운영자 클라이언트가 사용하는 것과 동일한 Gateway 인증을 전송하십시오.

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
`diagnostics.enabled`의 기본값은 `true`입니다. 엄격히 제한된 환경에서만 `false`로 설정하십시오. 이 값이 `false`여도 Plugin은 HTTP 경로를 등록하지만 진단 이벤트가 익스포터로 전달되지 않으므로 응답은 비어 있습니다.
</Note>

## 내보내는 메트릭

| 메트릭                                           | 유형      | 레이블                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | 카운터   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | 히스토그램 | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | 카운터   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | 히스토그램 | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | 카운터   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | 카운터   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | 히스토그램 | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | 카운터   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | 히스토그램 | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | 카운터   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | 카운터   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | 히스토그램 | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | 카운터   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | 카운터   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | 히스토그램 | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | 카운터   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | 카운터   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | 히스토그램 | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | 카운터   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | 카운터   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | 카운터   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | 히스토그램 | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | 카운터   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | 히스토그램 | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | 카운터   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | 카운터   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | 히스토그램 | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | 카운터   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | 히스토그램 | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | 히스토그램 | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | 게이지     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | 히스토그램 | `lane`                                                                                    |
| `openclaw_session_state_total`                   | 카운터   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | 게이지     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | 카운터   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | 카운터   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | 히스토그램 | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | 카운터   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | 히스토그램 | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | 카운터   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | 게이지     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | 히스토그램 | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | 히스토그램 | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | 히스토그램 | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | 히스토그램 | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | 카운터   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | 히스토그램 | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | 게이지     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | 히스토그램 | 없음                                                                                      |
| `openclaw_memory_pressure_total`                 | 카운터   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | 카운터   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | 카운터   | 없음                                                                                      |
| `openclaw_diagnostic_async_queue_dropped_total`  | 카운터   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | 게이지     | 없음                                                                                      |

## 레이블 정책

<AccordionGroup>
  <Accordion title="제한된 낮은 카디널리티 레이블">
    Prometheus 레이블은 제한된 낮은 카디널리티를 유지합니다. 익스포터는 `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, 메시지 ID, 채팅 ID 또는 제공자 요청 ID와 같은 원시 진단 식별자를 내보내지 않습니다.

    레이블 값은 삭제 처리되며 OpenClaw의 낮은 카디널리티 문자 정책과 일치해야 합니다. 정책을 충족하지 않는 값은 메트릭에 따라 `unknown`, `other` 또는 `none`으로 대체됩니다. 범위가 지정된 에이전트 세션 키처럼 보이는 레이블도 `unknown`으로 대체됩니다.

  </Accordion>
  <Accordion title="시계열 상한 및 초과분 집계">
    내보내기는 카운터, 게이지, 히스토그램을 합쳐 메모리에 유지하는 시계열을 **2048**개로 제한합니다. 이 상한을 초과하는 새 시계열은 삭제되며, 삭제될 때마다 `openclaw_prometheus_series_dropped_total`이 1씩 증가합니다.

    이 카운터를 업스트림 속성에서 높은 카디널리티의 값이 유출되고 있음을 나타내는 확실한 신호로 모니터링하십시오. 내보내기는 상한을 자동으로 높이지 않습니다. 카운터가 증가하면 상한을 비활성화하지 말고 원인을 수정하십시오.

  </Accordion>
  <Accordion title="Prometheus 출력에 절대 나타나지 않는 항목">
    - 프롬프트 텍스트, 응답 텍스트, 도구 입력, 도구 출력, 시스템 프롬프트
    - Talk 대화 기록, 오디오 페이로드, 호출 ID, 방 ID, 핸드오프 토큰, 턴 ID 및 원시 세션 ID
    - 원시 제공자 요청 ID(해당하는 경우 스팬에 한해 제한된 해시만 사용하며 메트릭에는 절대 사용하지 않음)
    - 세션 키 및 세션 ID
    - 호스트 이름, 파일 경로, 비밀 값

  </Accordion>
</AccordionGroup>

## PromQL 사용 예시

```promql
# 제공자별 분당 토큰 수
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# 최근 1시간 동안의 모델별 비용(USD)
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 모델 실행 시간의 95번째 백분위수
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# 큐 대기 시간 SLO(95번째 백분위수가 2초 미만)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# 제한된 소스별 Skills 사용량
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# 삭제된 Prometheus 시계열(카디널리티 경보)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
제공자 간 대시보드에는 `gen_ai_client_token_usage`를 사용하는 것이 좋습니다. 이 메트릭은 OpenTelemetry GenAI 시맨틱 규칙을 따르며 OpenClaw가 아닌 GenAI 서비스의 메트릭과도 일관됩니다.
</Tip>

## Prometheus와 OpenTelemetry 내보내기 중 선택하기

OpenClaw는 두 인터페이스를 독립적으로 지원합니다. 둘 중 하나만 사용하거나, 둘 다 사용하거나, 모두 사용하지 않을 수 있습니다.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **풀** 모델: Prometheus가 `/api/diagnostics/prometheus`를 스크레이핑합니다.
    - 외부 수집기가 필요하지 않습니다.
    - 일반 Gateway 인증을 통해 인증됩니다.
    - 메트릭만 제공합니다(트레이스 또는 로그는 제공하지 않음).
    - 이미 Prometheus + Grafana를 표준으로 사용하는 스택에 가장 적합합니다.

  </Tab>
  <Tab title="diagnostics-otel">
    - **푸시** 모델: OpenClaw가 수집기 또는 OTLP 호환 백엔드로 OTLP/HTTP를 전송합니다.
    - 메트릭, 트레이스 및 로그를 제공합니다.
    - 두 인터페이스가 모두 필요한 경우 OpenTelemetry Collector(`prometheus` 또는 `prometheusremotewrite` 내보내기)를 통해 Prometheus와 연동합니다.
    - 전체 목록은 [OpenTelemetry 내보내기](/ko/gateway/opentelemetry)를 참조하십시오.

  </Tab>
</Tabs>

## 문제 해결

<AccordionGroup>
  <Accordion title="빈 응답 본문">
    - 구성에서 `diagnostics.enabled`가 `false`로 설정되지 않았는지 확인하십시오(기본값은 `true`).
    - `openclaw plugins list --enabled`를 사용하여 Plugin이 활성화되고 로드되었는지 확인하십시오.
    - 트래픽을 생성하십시오. 카운터와 히스토그램은 이벤트가 하나 이상 발생한 후에만 행을 출력합니다.

  </Accordion>
  <Accordion title="401 / 인증되지 않음">
    엔드포인트에는 Gateway 운영자 범위(`auth: "gateway"`와 `gatewayRuntimeScopeSurface: "trusted-operator"`)가 필요합니다. Prometheus가 다른 Gateway 운영자 경로에 사용하는 것과 동일한 토큰 또는 비밀번호를 사용하십시오. 인증 없이 공개적으로 접근하는 모드는 없습니다.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total`이 증가하는 경우">
    새 속성이 **2048**개 시계열 상한을 초과하고 있습니다. 최근 메트릭에서 카디널리티가 예상보다 높은 레이블을 찾아 원인을 수정하십시오. 내보내기는 레이블을 조용히 다시 작성하는 대신 의도적으로 새 시계열을 삭제합니다.
  </Accordion>
  <Accordion title="재시작 후 Prometheus에 오래된 시계열이 표시되는 경우">
    Plugin은 상태를 메모리에만 보관합니다. Gateway를 재시작하면 카운터가 0으로 초기화되고 게이지는 다음에 보고되는 값부터 다시 시작합니다. 초기화를 올바르게 처리하려면 PromQL `rate()`와 `increase()`를 사용하십시오.
  </Accordion>
</AccordionGroup>

## 관련 문서

- [진단 내보내기](/ko/gateway/diagnostics) — 지원 번들용 로컬 진단 zip
- [상태 및 준비 여부](/ko/gateway/health) — `/healthz` 및 `/readyz` 프로브
- [로깅](/ko/logging) — 파일 기반 로깅
- [OpenTelemetry 내보내기](/ko/gateway/opentelemetry) — 트레이스, 메트릭 및 로그를 위한 OTLP 푸시
