---
read_when:
    - Cập nhật hành vi hoặc giá trị mặc định khi thử lại của nhà cung cấp
    - Gỡ lỗi khi nhà cung cấp gặp lỗi gửi hoặc giới hạn tốc độ
summary: Chính sách thử lại cho các lệnh gọi đến nhà cung cấp bên ngoài
title: Chính sách thử lại
x-i18n:
    generated_at: "2026-07-12T07:55:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Mục tiêu

- Thử lại theo từng yêu cầu HTTP, không theo toàn bộ luồng nhiều bước.
- Duy trì thứ tự bằng cách chỉ thử lại bước hiện tại.
- Tránh lặp lại các thao tác không lũy đẳng.

## Giá trị mặc định

| Cài đặt                    | Mặc định  |
| -------------------------- | --------- |
| Số lần thử                 | 3         |
| Giới hạn độ trễ tối đa     | 30000 ms  |
| Độ nhiễu                   | 0.1 (10%) |
| Độ trễ tối thiểu Telegram  | 400 ms    |
| Độ trễ tối thiểu Discord   | 500 ms    |

## Hành vi

### Nhà cung cấp mô hình

- OpenClaw để SDK của nhà cung cấp xử lý các lần thử lại ngắn thông thường.
- Đối với các SDK dựa trên Stainless như Anthropic và OpenAI, phản hồi có thể thử lại (`408`, `409`, `429` và `5xx`) có thể chứa `retry-after-ms` hoặc `retry-after`. Khi thời gian chờ đó dài hơn 60 giây, OpenClaw chèn `x-should-retry: false` để SDK trả lỗi ngay lập tức, cho phép cơ chế chuyển đổi dự phòng mô hình chuyển sang hồ sơ xác thực khác hoặc mô hình dự phòng.
- Ghi đè giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Đặt thành `0`, `false`, `off`, `none` hoặc `disabled` để cho phép SDK tự xử lý thời gian chờ dài từ `Retry-After`.

### Discord

- Thử lại khi gặp lỗi giới hạn tốc độ (HTTP 429), yêu cầu hết thời gian chờ, phản hồi HTTP 5xx và các lỗi truyền tải tạm thời như lỗi tra cứu DNS, đặt lại kết nối, đóng socket và lỗi tìm nạp.
- Sử dụng `retry_after` của Discord khi có; nếu không, sử dụng thời gian chờ lũy thừa.

### Telegram

- Thử lại khi gặp lỗi tạm thời (429, hết thời gian chờ, kết nối/đặt lại/đóng, tạm thời không khả dụng).
- Sử dụng `retry_after` khi có; nếu không, sử dụng thời gian chờ lũy thừa.
- Không thử lại lỗi phân tích cú pháp HTML/Markdown; hệ thống chuyển sang văn bản thuần ngay trong lần thử đầu tiên.

## Cấu hình

Đặt chính sách thử lại cho từng nhà cung cấp trong `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Ghi chú

- Việc thử lại áp dụng cho từng yêu cầu (gửi tin nhắn, tải lên nội dung đa phương tiện, phản ứng, cuộc thăm dò ý kiến, nhãn dán).
- Các luồng kết hợp không thử lại những bước đã hoàn tất.

## Liên quan

- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
- [Hàng đợi lệnh](/vi/concepts/queue)
