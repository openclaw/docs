---
read_when:
    - Gỡ lỗi chế độ xem WebChat trên mac hoặc cổng loopback
summary: Cách ứng dụng Mac nhúng WebChat của Gateway và cách gỡ lỗi
title: Trò chuyện web (macOS)
x-i18n:
    generated_at: "2026-04-29T22:57:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Ứng dụng thanh menu macOS nhúng UI WebChat dưới dạng chế độ xem SwiftUI gốc. Ứng dụng
kết nối với Gateway và mặc định dùng **phiên chính** cho agent đã chọn
(có bộ chuyển phiên cho các phiên khác).

- **Chế độ cục bộ**: kết nối trực tiếp tới WebSocket Gateway cục bộ.
- **Chế độ từ xa**: chuyển tiếp cổng điều khiển Gateway qua SSH và dùng
  đường hầm đó làm mặt phẳng dữ liệu.

## Khởi chạy & gỡ lỗi

- Thủ công: menu Lobster → “Mở trò chuyện”.
- Tự động mở để kiểm thử:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Nhật ký: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Cách hệ thống được nối dây

- Mặt phẳng dữ liệu: các phương thức WS của Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` và các sự kiện `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` trả về các hàng bản ghi đã được chuẩn hóa để hiển thị: các thẻ chỉ thị nội tuyến
  được loại khỏi văn bản hiển thị, các payload XML gọi công cụ dạng văn bản thuần
  (bao gồm `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn) cùng
  các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ đều được loại bỏ, các hàng
  assistant chỉ chứa token im lặng như chính xác `NO_REPLY` / `no_reply` sẽ bị
  bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.
- Phiên: mặc định dùng phiên chính (`main`, hoặc `global` khi phạm vi là
  toàn cục). UI có thể chuyển đổi giữa các phiên.
- Onboarding dùng một phiên chuyên dụng để tách riêng thiết lập lần chạy đầu tiên.

## Bề mặt bảo mật

- Chế độ từ xa chỉ chuyển tiếp cổng điều khiển WebSocket của Gateway qua SSH.

## Hạn chế đã biết

- UI được tối ưu hóa cho các phiên trò chuyện (không phải sandbox trình duyệt đầy đủ).

## Liên quan

- [WebChat](/vi/web/webchat)
- [Ứng dụng macOS](/vi/platforms/macos)
