---
read_when:
    - Gỡ lỗi chế độ xem WebChat trên mac hoặc cổng loopback
summary: Cách ứng dụng Mac nhúng Gateway WebChat và cách gỡ lỗi
title: Trò chuyện web (macOS)
x-i18n:
    generated_at: "2026-05-06T09:22:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Ứng dụng trên thanh menu macOS nhúng giao diện WebChat dưới dạng dạng xem SwiftUI gốc. Ứng dụng
kết nối với Gateway và mặc định dùng **phiên chính** cho agent đã chọn
(có bộ chuyển đổi phiên cho các phiên khác).

- **Chế độ cục bộ**: kết nối trực tiếp với WebSocket Gateway cục bộ.
- **Chế độ từ xa**: chuyển tiếp cổng điều khiển Gateway qua SSH và dùng
  đường hầm đó làm mặt phẳng dữ liệu.

## Khởi chạy và gỡ lỗi

- Thủ công: trình đơn Lobster → "Mở trò chuyện".
- Tự động mở để kiểm thử:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Nhật ký: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Cách hệ thống được nối kết

- Mặt phẳng dữ liệu: các phương thức Gateway WS `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` và các sự kiện `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` trả về các hàng bản ghi cuộc trò chuyện đã chuẩn hóa để hiển thị: các thẻ chỉ thị
  nội tuyến bị loại khỏi văn bản hiển thị, các payload XML lời gọi công cụ dạng văn bản thuần
  (bao gồm `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, và các khối lời gọi công cụ bị cắt ngắn) và
  các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ sẽ bị loại bỏ, các hàng assistant
  chỉ chứa token im lặng như chính xác `NO_REPLY` / `no_reply` sẽ bị
  bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.
- Phiên: mặc định là phiên chính (`main`, hoặc `global` khi phạm vi là
  toàn cục). Giao diện có thể chuyển đổi giữa các phiên.
- Quy trình onboarding dùng một phiên chuyên dụng để tách riêng thiết lập lần chạy đầu tiên.

## Bề mặt bảo mật

- Chế độ từ xa chỉ chuyển tiếp cổng điều khiển WebSocket của Gateway qua SSH.

## Hạn chế đã biết

- Giao diện được tối ưu cho các phiên trò chuyện (không phải sandbox trình duyệt đầy đủ).

## Liên quan

- [WebChat](/vi/web/webchat)
- [Ứng dụng macOS](/vi/platforms/macos)
