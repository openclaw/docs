---
read_when:
    - Bạn muốn Prometheus, Grafana, VictoriaMetrics hoặc một trình thu thập dữ liệu khác thu thập các chỉ số của OpenClaw Gateway
    - Bạn cần tên các chỉ số Prometheus và chính sách nhãn cho bảng điều khiển hoặc cảnh báo
    - Bạn muốn có số liệu đo lường mà không cần chạy trình thu thập OpenTelemetry
sidebarTitle: Prometheus
summary: Cung cấp dữ liệu chẩn đoán OpenClaw dưới dạng chỉ số văn bản Prometheus thông qua plugin diagnostics-prometheus
title: Chỉ số Prometheus
x-i18n:
    generated_at: "2026-07-12T07:57:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw có thể cung cấp các chỉ số chẩn đoán thông qua Plugin chính thức
  `diagnostics-prometheus`. Plugin này lắng nghe dữ liệu chẩn đoán đáng tin cậy cùng
  các sự kiện chẩn đoán được gắn thẻ nội bộ và do bộ điều phối sở hữu (các tín hiệu
  về hàng đợi, bộ nhớ và khôi phục phiên), rồi hiển thị một điểm cuối văn bản Prometheus tại:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Kiểu nội dung là `text/plain; version=0.0.4; charset=utf-8`, định dạng trình bày
  Prometheus tiêu chuẩn.

  <Warning>
  Tuyến này sử dụng xác thực Gateway (phạm vi người vận hành, bề mặt dành cho người vận hành đáng tin cậy). Không công khai tuyến này dưới dạng điểm cuối `/metrics` không xác thực. Hãy thu thập dữ liệu qua cùng đường dẫn xác thực mà bạn sử dụng cho các API dành cho người vận hành khác.
  </Warning>

  Đối với dấu vết, nhật ký, đẩy OTLP và các thuộc tính ngữ nghĩa GenAI của OpenTelemetry, hãy xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

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
    Tuyến HTTP được đăng ký khi Plugin khởi động, vì vậy hãy tải lại sau khi bật.
  </Step>
  <Step title="Thu thập dữ liệu từ tuyến được bảo vệ">
    Gửi cùng thông tin xác thực Gateway mà các máy khách dành cho người vận hành của bạn sử dụng:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Kết nối Prometheus">
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
`diagnostics.enabled` mặc định là `true`; chỉ đặt thành `false` trong các môi trường bị giới hạn nghiêm ngặt. Nếu giá trị này là `false`, Plugin vẫn đăng ký tuyến HTTP, nhưng không có sự kiện chẩn đoán nào được chuyển vào trình xuất, vì vậy phản hồi sẽ trống.
</Note>

## Các chỉ số được xuất

| Chỉ số                                           | Loại      | Nhãn                                                                                      |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | bộ đếm    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | bộ đếm    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | bộ đếm    | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | bộ đếm    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | bộ đếm    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histogram | `agent`, `channel`, `model`, `provider`                                                   |
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
| `openclaw_queue_lane_size`                       | đồng hồ   | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | bộ đếm    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | đồng hồ   | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | bộ đếm    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | bộ đếm    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | bộ đếm    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | bộ đếm    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | đồng hồ   | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | bộ đếm    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | đồng hồ   | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | không có                                                                                  |
| `openclaw_memory_pressure_total`                 | bộ đếm    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | bộ đếm    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | bộ đếm    | không có                                                                                  |
| `openclaw_diagnostic_async_queue_dropped_total`  | bộ đếm    | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | đồng hồ   | không có                                                                                  |

## Chính sách nhãn

<AccordionGroup>
  <Accordion title="Nhãn có giới hạn và độ phân biệt thấp">
    Các nhãn Prometheus luôn có giới hạn và độ phân biệt thấp. Trình xuất không phát ra các mã định danh chẩn đoán thô như `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, mã định danh tin nhắn, mã định danh cuộc trò chuyện hoặc mã định danh yêu cầu của nhà cung cấp.

    Các giá trị nhãn được biên tập ẩn và phải tuân thủ chính sách ký tự có độ phân biệt thấp của OpenClaw. Các giá trị không đáp ứng chính sách sẽ được thay thế bằng `unknown`, `other` hoặc `none`, tùy theo chỉ số. Các nhãn có dạng khóa phiên tác nhân có phạm vi cũng được thay thế bằng `unknown`.

  </Accordion>
  <Accordion title="Giới hạn chuỗi và thống kê phần vượt mức">
    Trình xuất giới hạn số chuỗi thời gian được lưu trong bộ nhớ ở mức **2048** chuỗi, tính tổng trên các bộ đếm, đồng hồ đo và histogram. Các chuỗi mới vượt quá giới hạn này sẽ bị loại bỏ và `openclaw_prometheus_series_dropped_total` tăng thêm một sau mỗi lần.

    Hãy theo dõi bộ đếm này như một tín hiệu chắc chắn cho thấy một thuộc tính ở thượng nguồn đang làm rò rỉ các giá trị có lực lượng lớn. Trình xuất không bao giờ tự động nâng giới hạn; nếu bộ đếm tăng, hãy khắc phục nguồn thay vì vô hiệu hóa giới hạn.

  </Accordion>
  <Accordion title="Những nội dung không bao giờ xuất hiện trong đầu ra Prometheus">
    - văn bản lời nhắc, văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, lời nhắc hệ thống
    - bản chép lời Talk, tải trọng âm thanh, mã cuộc gọi, mã phòng, token chuyển giao, mã lượt và mã phiên thô
    - mã yêu cầu thô của nhà cung cấp (chỉ có các giá trị băm hữu hạn, nếu áp dụng, trên các span — không bao giờ có trên số liệu)
    - khóa phiên và mã phiên
    - tên máy chủ, đường dẫn tệp, giá trị bí mật

  </Accordion>
</AccordionGroup>

## Công thức PromQL

```promql
# Số token mỗi phút, phân tách theo nhà cung cấp
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Chi phí (USD) trong giờ vừa qua, theo mô hình
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# Phân vị thứ 95 của thời lượng chạy mô hình
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO thời gian chờ hàng đợi (phân vị 95 dưới 2 giây)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Mức sử dụng Skill, phân tách theo nguồn hữu hạn
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Chuỗi Prometheus bị loại bỏ (cảnh báo lực lượng)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Ưu tiên `gen_ai_client_token_usage` cho các bảng điều khiển dùng chung giữa nhiều nhà cung cấp: số liệu này tuân theo các quy ước ngữ nghĩa GenAI của OpenTelemetry và nhất quán với số liệu từ các dịch vụ GenAI không thuộc OpenClaw.
</Tip>

## Lựa chọn giữa xuất Prometheus và OpenTelemetry

OpenClaw hỗ trợ độc lập cả hai bề mặt. Bạn có thể chạy một trong hai, cả hai hoặc không chạy bề mặt nào.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Mô hình **kéo**: Prometheus thu thập dữ liệu từ `/api/diagnostics/prometheus`.
    - Không yêu cầu trình thu thập bên ngoài.
    - Được xác thực thông qua cơ chế xác thực Gateway thông thường.
    - Bề mặt chỉ gồm số liệu (không có dấu vết hoặc nhật ký).
    - Phù hợp nhất với các hệ thống đã chuẩn hóa trên Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Mô hình **đẩy**: OpenClaw gửi OTLP/HTTP đến một trình thu thập hoặc phần phụ trợ tương thích với OTLP.
    - Bề mặt bao gồm số liệu, dấu vết và nhật ký.
    - Kết nối với Prometheus thông qua OpenTelemetry Collector (trình xuất `prometheus` hoặc `prometheusremotewrite`) khi bạn cần cả hai.
    - Xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry) để biết danh mục đầy đủ.

  </Tab>
</Tabs>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Nội dung phản hồi trống">
    - Kiểm tra để bảo đảm `diagnostics.enabled` không được đặt thành `false` trong cấu hình (giá trị mặc định là `true`).
    - Xác nhận Plugin đã được bật và tải bằng `openclaw plugins list --enabled`.
    - Tạo một ít lưu lượng; các bộ đếm và histogram chỉ xuất dòng sau khi có ít nhất một sự kiện.

  </Accordion>
  <Accordion title="401 / không được ủy quyền">
    Điểm cuối yêu cầu phạm vi người vận hành Gateway (`auth: "gateway"` với `gatewayRuntimeScopeSurface: "trusted-operator"`). Hãy dùng cùng token hoặc mật khẩu mà Prometheus sử dụng cho bất kỳ tuyến người vận hành Gateway nào khác. Không có chế độ công khai không cần xác thực.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` đang tăng">
    Một thuộc tính mới đang vượt quá giới hạn **2048** chuỗi. Hãy kiểm tra các số liệu gần đây để tìm một nhãn có lực lượng cao ngoài dự kiến và khắc phục tại nguồn. Trình xuất chủ ý loại bỏ các chuỗi mới thay vì âm thầm viết lại nhãn.
  </Accordion>
  <Accordion title="Prometheus hiển thị các chuỗi cũ sau khi khởi động lại">
    Plugin chỉ lưu trạng thái trong bộ nhớ. Sau khi Gateway khởi động lại, các bộ đếm được đặt lại về không và các đồng hồ đo bắt đầu lại từ giá trị được báo cáo tiếp theo. Hãy dùng `rate()` và `increase()` của PromQL để xử lý việc đặt lại một cách chính xác.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics) — tệp zip chẩn đoán cục bộ dành cho các gói hỗ trợ
- [Tình trạng và mức độ sẵn sàng](/vi/gateway/health) — các đầu dò `/healthz` và `/readyz`
- [Ghi nhật ký](/vi/logging) — ghi nhật ký dựa trên tệp
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — đẩy OTLP cho dấu vết, số liệu và nhật ký
