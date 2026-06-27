---
read_when:
    - Bạn muốn Prometheus, Grafana, VictoriaMetrics hoặc một trình thu thập khác thu thập số liệu OpenClaw Gateway
    - Bạn cần tên chỉ số Prometheus và chính sách nhãn cho dashboard hoặc cảnh báo
    - Bạn muốn có các chỉ số mà không cần chạy bộ thu thập OpenTelemetry
sidebarTitle: Prometheus
summary: Cung cấp chẩn đoán OpenClaw dưới dạng chỉ số văn bản Prometheus thông qua Plugin diagnostics-prometheus
title: Chỉ số Prometheus
x-i18n:
    generated_at: "2026-06-27T17:31:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw có thể hiển thị các chỉ số chẩn đoán thông qua Plugin chính thức `diagnostics-prometheus`. Plugin này lắng nghe các chẩn đoán đáng tin cậy cùng các sự kiện ổn định Gateway do lõi phát ra, rồi kết xuất một điểm cuối văn bản Prometheus tại:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Kiểu nội dung là `text/plain; version=0.0.4; charset=utf-8`, định dạng trình bày tiêu chuẩn của Prometheus.

  <Warning>
  Route này sử dụng xác thực Gateway (phạm vi người vận hành). Không hiển thị nó dưới dạng điểm cuối `/metrics` công khai không cần xác thực. Hãy scrape nó thông qua cùng đường dẫn xác thực mà bạn dùng cho các API người vận hành khác.
  </Warning>

  Đối với trace, log, OTLP push và các thuộc tính ngữ nghĩa OpenTelemetry GenAI, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

  ## Bắt đầu nhanh

  <Steps>
  <Step title="Cài đặt Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Bật Plugin">
    <Tabs>
      <Tab title="Cấu hình">
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
  <Step title="Khởi động lại Gateway">
    Route HTTP được đăng ký khi Plugin khởi động, vì vậy hãy tải lại sau khi bật.
  </Step>
  <Step title="Scrape route được bảo vệ">
    Gửi cùng thông tin xác thực Gateway mà các máy khách người vận hành của bạn sử dụng:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Wire Prometheus">
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
Bắt buộc có `diagnostics.enabled: true`. Nếu không có, Plugin vẫn đăng ký tuyến HTTP nhưng không có sự kiện chẩn đoán nào chảy vào exporter, nên phản hồi sẽ trống.
</Note>

## Các metric được xuất

| Metric                                           | Loại      | Nhãn                                                                                      |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | bộ đếm    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | bộ đếm    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | bộ đếm    | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | bộ đếm    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | bộ đếm    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | bộ đếm    | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | bộ đếm    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | bộ đếm    | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | bộ đếm    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | bộ đếm    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | bộ đếm    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | bộ đếm    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | bộ đếm    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | bộ đếm    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | bộ đếm    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | bộ đếm    | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | bộ đếm    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | bộ đếm    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | bộ đếm    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | bộ đếm    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | bộ đếm    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | bộ đếm    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | bộ đếm    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | bộ đếm    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | không có                                                                                  |
| `openclaw_memory_pressure_total`                 | bộ đếm    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | bộ đếm    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | bộ đếm    | không có                                                                                  |

## Chính sách nhãn

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    Nhãn Prometheus luôn có giới hạn và có số lượng giá trị thấp. Exporter không phát ra các định danh chẩn đoán thô như `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID tin nhắn, ID cuộc trò chuyện, hoặc ID yêu cầu của provider.

    Giá trị nhãn được biên tập ẩn và phải khớp với chính sách ký tự số lượng giá trị thấp của OpenClaw. Các giá trị không đạt chính sách được thay bằng `unknown`, `other`, hoặc `none`, tùy theo metric. Các nhãn trông giống khóa phiên agent có phạm vi cũng được thay bằng `unknown`.

  </Accordion>
  <Accordion title="Series cap and overflow accounting">
    Exporter giới hạn các chuỗi thời gian được giữ trong bộ nhớ ở mức **2048** chuỗi, tính gộp trên bộ đếm, gauge và histogram. Các chuỗi mới vượt quá giới hạn đó sẽ bị bỏ, và `openclaw_prometheus_series_dropped_total` tăng thêm một mỗi lần.

    Theo dõi bộ đếm này như một tín hiệu chắc chắn rằng một thuộc tính thượng nguồn đang rò rỉ các giá trị có số lượng giá trị cao. Exporter không bao giờ tự động nâng giới hạn; nếu nó tăng, hãy sửa nguồn thay vì tắt giới hạn.

  </Accordion>
  <Accordion title="Những gì không bao giờ xuất hiện trong đầu ra Prometheus">
    - văn bản prompt, văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, prompt hệ thống
    - bản chép lời cuộc trò chuyện, tải trọng âm thanh, id cuộc gọi, id phòng, token chuyển giao, id lượt và id phiên thô
    - ID yêu cầu nhà cung cấp thô (chỉ các hàm băm giới hạn, khi áp dụng, trên các span — không bao giờ trên metrics)
    - khóa phiên và ID phiên
    - tên máy chủ, đường dẫn tệp, giá trị bí mật

  </Accordion>
</AccordionGroup>

## Công thức PromQL

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
Ưu tiên `gen_ai_client_token_usage` cho dashboard đa nhà cung cấp: metric này tuân theo quy ước ngữ nghĩa OpenTelemetry GenAI và nhất quán với metrics từ các dịch vụ GenAI không thuộc OpenClaw.
</Tip>

## Chọn giữa xuất Prometheus và OpenTelemetry

OpenClaw hỗ trợ cả hai bề mặt một cách độc lập. Bạn có thể chạy một trong hai, cả hai hoặc không chạy cái nào.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Mô hình **pull**: Prometheus thu thập `/api/diagnostics/prometheus`.
    - Không cần collector bên ngoài.
    - Được xác thực qua cơ chế xác thực Gateway thông thường.
    - Bề mặt chỉ gồm metrics (không có trace hoặc log).
    - Phù hợp nhất cho các stack đã chuẩn hóa trên Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Mô hình **push**: OpenClaw gửi OTLP/HTTP tới một collector hoặc backend tương thích OTLP.
    - Bề mặt bao gồm metrics, trace và log.
    - Kết nối sang Prometheus thông qua OpenTelemetry Collector (exporter `prometheus` hoặc `prometheusremotewrite`) khi bạn cần cả hai.
    - Xem [xuất OpenTelemetry](/vi/gateway/opentelemetry) để biết danh mục đầy đủ.

  </Tab>
</Tabs>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Nội dung phản hồi trống">
    - Kiểm tra `diagnostics.enabled: true` trong cấu hình.
    - Xác nhận Plugin đã được bật và tải bằng `openclaw plugins list --enabled`.
    - Tạo một ít lưu lượng; counter và histogram chỉ phát ra dòng sau ít nhất một sự kiện.

  </Accordion>
  <Accordion title="401 / không được ủy quyền">
    Endpoint yêu cầu phạm vi toán tử Gateway (`auth: "gateway"` với `gatewayRuntimeScopeSurface: "trusted-operator"`). Dùng cùng token hoặc mật khẩu mà Prometheus dùng cho bất kỳ tuyến toán tử Gateway nào khác. Không có chế độ công khai không xác thực.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` đang tăng">
    Một thuộc tính mới đang vượt quá giới hạn **2048** chuỗi. Kiểm tra metrics gần đây để tìm nhãn có cardinality cao bất thường và khắc phục tại nguồn. Exporter cố ý bỏ các chuỗi mới thay vì âm thầm ghi lại nhãn.
  </Accordion>
  <Accordion title="Prometheus hiển thị chuỗi cũ sau khi khởi động lại">
    Plugin chỉ giữ trạng thái trong bộ nhớ. Sau khi Gateway khởi động lại, counter đặt lại về 0 và gauge bắt đầu lại ở giá trị được báo cáo tiếp theo. Dùng PromQL `rate()` và `increase()` để xử lý việc đặt lại một cách gọn gàng.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Xuất chẩn đoán](/vi/gateway/diagnostics) — tệp zip chẩn đoán cục bộ cho gói hỗ trợ
- [Sức khỏe và sẵn sàng](/vi/gateway/health) — probe `/healthz` và `/readyz`
- [Ghi log](/vi/logging) — ghi log dựa trên tệp
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — đẩy OTLP cho trace, metrics và log
