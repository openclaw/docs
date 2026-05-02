---
read_when:
    - Cập nhật hành vi thử lại hoặc giá trị mặc định của nhà cung cấp
    - Gỡ lỗi lỗi gửi hoặc giới hạn tốc độ của nhà cung cấp
summary: Chính sách thử lại cho các lệnh gọi đi tới nhà cung cấp
title: Chính sách thử lại
x-i18n:
    generated_at: "2026-05-02T10:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## Mục tiêu

- Thử lại theo từng yêu cầu HTTP, không phải theo từng luồng nhiều bước.
- Giữ nguyên thứ tự bằng cách chỉ thử lại bước hiện tại.
- Tránh lặp lại các thao tác không có tính idempotent.

## Mặc định

- Số lần thử: 3
- Giới hạn độ trễ tối đa: 30000 ms
- Jitter: 0.1 (10 phần trăm)
- Mặc định của nhà cung cấp:
  - Độ trễ tối thiểu của Telegram: 400 ms
  - Độ trễ tối thiểu của Discord: 500 ms

## Hành vi

### Nhà cung cấp mô hình

- OpenClaw để SDK của nhà cung cấp xử lý các lần thử lại ngắn thông thường.
- Với các SDK dựa trên Stainless như Anthropic và OpenAI, các phản hồi có thể thử lại
  (`408`, `409`, `429`, và `5xx`) có thể bao gồm `retry-after-ms` hoặc
  `retry-after`. Khi thời gian chờ đó dài hơn 60 giây, OpenClaw chèn
  `x-should-retry: false` để SDK trả lỗi ngay lập tức và chuyển đổi dự phòng mô hình
  có thể chuyển sang hồ sơ xác thực khác hoặc mô hình dự phòng.
- Ghi đè giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Đặt thành `0`, `false`, `off`, `none`, hoặc `disabled` để SDK tự xử lý các lần ngủ
  `Retry-After` dài ở bên trong.

### Discord

- Thử lại khi gặp lỗi giới hạn tốc độ (HTTP 429), hết thời gian chờ yêu cầu, phản hồi HTTP 5xx,
  và các lỗi truyền tải tạm thời như lỗi tra cứu DNS, đặt lại kết nối,
  đóng socket, và lỗi fetch.
- Sử dụng `retry_after` của Discord khi có, nếu không thì dùng trì hoãn lùi theo cấp số nhân.

### Telegram

- Thử lại khi gặp lỗi tạm thời (429, hết thời gian chờ, kết nối/đặt lại/đã đóng, tạm thời không khả dụng).
- Sử dụng `retry_after` khi có, nếu không thì dùng trì hoãn lùi theo cấp số nhân.
- Lỗi phân tích cú pháp Markdown không được thử lại; chúng chuyển về văn bản thuần.

## Cấu hình

Đặt chính sách thử lại theo từng nhà cung cấp trong `~/.openclaw/openclaw.json`:

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

- Thử lại áp dụng theo từng yêu cầu (gửi tin nhắn, tải lên phương tiện, phản ứng, bình chọn, sticker).
- Các luồng tổng hợp không thử lại những bước đã hoàn tất.

## Liên quan

- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
- [Hàng đợi lệnh](/vi/concepts/queue)
