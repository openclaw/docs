---
read_when:
    - Bạn muốn Prometheus, Grafana, VictoriaMetrics hoặc một trình thu thập khác thu thập các chỉ số của OpenClaw Gateway
    - Bạn cần tên các chỉ số Prometheus và chính sách nhãn cho bảng điều khiển hoặc cảnh báo
    - Bạn muốn các số liệu đo lường mà không cần chạy bộ thu thập OpenTelemetry
sidebarTitle: Prometheus
summary: Cung cấp chẩn đoán OpenClaw dưới dạng chỉ số văn bản Prometheus thông qua Plugin diagnostics-prometheus
title: Chỉ số Prometheus
x-i18n:
    generated_at: "2026-04-29T22:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw có thể hiển thị các chỉ số chẩn đoán thông qua Plugin `diagnostics-prometheus` được đi kèm. Plugin này lắng nghe các chẩn đoán nội bộ đáng tin cậy và hiển thị một endpoint văn bản Prometheus tại:

```text
GET /api/diagnostics/prometheus
```

Kiểu nội dung là `text/plain; version=0.0.4; charset=utf-8`, định dạng hiển thị tiêu chuẩn của Prometheus.

<Warning>
Route này dùng xác thực Gateway (phạm vi operator). Không để lộ route này như một endpoint `/metrics` công khai không xác thực. Hãy scrape route này qua cùng đường dẫn xác thực mà bạn dùng cho các API operator khác.
</Warning>

Đối với trace, log, OTLP push và thuộc tính ngữ nghĩa OpenTelemetry GenAI, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).

## Bắt đầu nhanh

<Steps>
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
    Gửi cùng xác thực gateway mà các client operator của bạn dùng:

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
Cần có `diagnostics.enabled: true`. Nếu không, Plugin vẫn đăng ký route HTTP nhưng không có sự kiện chẩn đoán nào chảy vào exporter, nên phản hồi sẽ trống.
</Note>

## Chỉ số được xuất

| Chỉ số                                        | Loại      | Nhãn                                                                                      |
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
| `openclaw_memory_rss_bytes`                   | histogram | không có                                                                                  |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | không có                                                                                  |

## Chính sách nhãn

<AccordionGroup>
  <Accordion title="Nhãn có giới hạn, cardinality thấp">
    Nhãn Prometheus luôn có giới hạn và cardinality thấp. Exporter không phát ra mã định danh chẩn đoán thô như `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID tin nhắn, ID cuộc trò chuyện hoặc ID yêu cầu provider.

    Giá trị nhãn được biên tập lại và phải khớp với chính sách ký tự cardinality thấp của OpenClaw. Các giá trị không đạt chính sách được thay bằng `unknown`, `other` hoặc `none`, tùy theo chỉ số.

  </Accordion>
  <Accordion title="Giới hạn chuỗi thời gian và ghi nhận tràn">
    Exporter giới hạn số chuỗi thời gian được giữ trong bộ nhớ ở mức **2048** chuỗi tổng cộng trên counter, gauge và histogram. Chuỗi mới vượt quá giới hạn đó sẽ bị loại bỏ, và `openclaw_prometheus_series_dropped_total` tăng thêm một mỗi lần.

    Theo dõi counter này như một tín hiệu chắc chắn rằng một thuộc tính phía upstream đang rò rỉ giá trị cardinality cao. Exporter không bao giờ tự động nâng giới hạn; nếu giá trị tăng, hãy sửa nguồn thay vì tắt giới hạn.

  </Accordion>
  <Accordion title="Những gì không bao giờ xuất hiện trong đầu ra Prometheus">
    - văn bản prompt, văn bản phản hồi, đầu vào công cụ, đầu ra công cụ, system prompt
    - ID yêu cầu provider thô (chỉ có hash có giới hạn, khi áp dụng, trên span — không bao giờ trên chỉ số)
    - khóa phiên và ID phiên
    - hostname, đường dẫn tệp, giá trị bí mật

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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Ưu tiên `gen_ai_client_token_usage` cho dashboard xuyên provider: chỉ số này tuân theo quy ước ngữ nghĩa OpenTelemetry GenAI và nhất quán với chỉ số từ các dịch vụ GenAI không thuộc OpenClaw.
</Tip>

## Chọn giữa xuất Prometheus và OpenTelemetry

OpenClaw hỗ trợ cả hai bề mặt một cách độc lập. Bạn có thể chạy một trong hai, cả hai hoặc không cái nào.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Mô hình **pull**: Prometheus scrape `/api/diagnostics/prometheus`.
    - Không cần collector bên ngoài.
    - Được xác thực qua xác thực Gateway thông thường.
    - Bề mặt chỉ là chỉ số (không có trace hoặc log).
    - Phù hợp nhất cho stack đã tiêu chuẩn hóa trên Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Mô hình **push**: OpenClaw gửi OTLP/HTTP đến collector hoặc backend tương thích OTLP.
    - Bề mặt bao gồm chỉ số, trace và log.
    - Kết nối sang Prometheus thông qua OpenTelemetry Collector (`prometheus` hoặc exporter `prometheusremotewrite`) khi bạn cần cả hai.
    - Xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry) để biết danh mục đầy đủ.

  </Tab>
</Tabs>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Phần thân phản hồi trống">
    - Kiểm tra `diagnostics.enabled: true` trong cấu hình.
    - Xác nhận Plugin đã được bật và tải bằng `openclaw plugins list --enabled`.
    - Tạo một ít lưu lượng; counter và histogram chỉ phát ra dòng sau khi có ít nhất một sự kiện.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Endpoint yêu cầu phạm vi operator của Gateway (`auth: "gateway"` với `gatewayRuntimeScopeSurface: "trusted-operator"`). Dùng cùng token hoặc mật khẩu mà Prometheus dùng cho bất kỳ route operator Gateway nào khác. Không có chế độ công khai không xác thực.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` đang tăng">
    Một thuộc tính mới đang vượt quá giới hạn **2048** chuỗi. Kiểm tra các chỉ số gần đây để tìm nhãn có cardinality cao bất thường và sửa tại nguồn. Exporter cố ý loại bỏ chuỗi mới thay vì âm thầm viết lại nhãn.
  </Accordion>
  <Accordion title="Prometheus hiển thị chuỗi cũ sau khi khởi động lại">
    Plugin chỉ giữ trạng thái trong bộ nhớ. Sau khi Gateway khởi động lại, counter đặt lại về không và gauge bắt đầu lại ở giá trị được báo cáo tiếp theo. Dùng PromQL `rate()` và `increase()` để xử lý reset gọn gàng.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Xuất chẩn đoán](/vi/gateway/diagnostics) — tệp zip chẩn đoán cục bộ cho gói hỗ trợ
- [Sức khỏe và sẵn sàng](/vi/gateway/health) — probe `/healthz` và `/readyz`
- [Ghi log](/vi/logging) — ghi log dựa trên tệp
- [Xuất OpenTelemetry](/vi/gateway/opentelemetry) — OTLP push cho trace, chỉ số và log
