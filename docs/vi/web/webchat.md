---
read_when:
    - Gỡ lỗi hoặc cấu hình quyền truy cập WebChat
summary: Máy chủ tĩnh WebChat loopback và cách dùng Gateway WS cho giao diện trò chuyện
title: Trò chuyện web
x-i18n:
    generated_at: "2026-04-29T23:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

Trạng thái: giao diện trò chuyện SwiftUI macOS/iOS giao tiếp trực tiếp với WebSocket của Gateway.

## Đây là gì

- Một giao diện trò chuyện native cho gateway (không có trình duyệt nhúng và không có máy chủ tĩnh cục bộ).
- Sử dụng cùng các phiên và quy tắc định tuyến như các kênh khác.
- Định tuyến xác định: phản hồi luôn quay lại WebChat.

## Khởi động nhanh

1. Khởi động gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc tab trò chuyện của Control UI.
3. Đảm bảo đã cấu hình một đường dẫn xác thực gateway hợp lệ (mặc định là shared-secret,
   ngay cả trên loopback).

## Cách hoạt động (hành vi)

- Giao diện kết nối tới WebSocket của Gateway và sử dụng `chat.history`, `chat.send`, và `chat.inject`.
- `chat.history` được giới hạn để ổn định: Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua siêu dữ liệu nặng, và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`.
- `chat.history` đi theo nhánh bản ghi hội thoại đang hoạt động đối với các tệp phiên append-only hiện đại, vì vậy các nhánh ghi lại đã bị bỏ và các bản sao prompt đã bị thay thế sẽ không được hiển thị trong WebChat.
- Control UI gộp các lần gửi trùng lặp đang chờ xử lý cho cùng phiên, tin nhắn, và tệp đính kèm trước khi tạo id chạy `chat.send` mới; Gateway vẫn khử trùng lặp các yêu cầu lặp lại dùng lại cùng khóa idempotency.
- `chat.history` cũng được chuẩn hóa để hiển thị: ngữ cảnh OpenClaw chỉ dùng lúc chạy,
  các lớp bọc phong bì đầu vào, các thẻ chỉ thị gửi nội tuyến
  như `[[reply_to_*]]` và `[[audio_as_voice]]`, payload XML gọi công cụ dạng văn bản thuần
  (bao gồm `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), và
  các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ sẽ bị loại khỏi văn bản hiển thị,
  và các mục assistant có toàn bộ văn bản hiển thị chỉ là token im lặng chính xác
  `NO_REPLY` / `no_reply` sẽ bị bỏ qua.
- Các payload phản hồi được gắn cờ suy luận (`isReasoning: true`) bị loại khỏi nội dung assistant của WebChat, văn bản phát lại bản ghi hội thoại, và các khối nội dung âm thanh, vì vậy payload chỉ dùng để suy nghĩ sẽ không xuất hiện dưới dạng tin nhắn assistant hiển thị hoặc âm thanh có thể phát.
- `chat.inject` thêm trực tiếp một ghi chú assistant vào bản ghi hội thoại và phát nó tới giao diện (không chạy agent).
- Các lượt chạy bị hủy có thể giữ phần đầu ra assistant một phần hiển thị trong giao diện.
- Gateway lưu văn bản assistant một phần đã bị hủy vào lịch sử bản ghi hội thoại khi có đầu ra được đệm, và đánh dấu các mục đó bằng siêu dữ liệu hủy.
- Lịch sử luôn được lấy từ gateway (không theo dõi tệp cục bộ).
- Nếu không thể kết nối tới gateway, WebChat ở chế độ chỉ đọc.

## Bảng công cụ agent của Control UI

- Bảng Tools của Control UI `/agents` có hai chế độ xem riêng:
  - **Khả dụng ngay bây giờ** dùng `tools.effective(sessionKey=...)` và hiển thị những gì phiên hiện tại
    thực sự có thể dùng lúc chạy, bao gồm công cụ lõi, Plugin, và công cụ thuộc sở hữu kênh.
  - **Cấu hình công cụ** dùng `tools.catalog` và tập trung vào hồ sơ, ghi đè, và
    ngữ nghĩa catalog.
- Tính khả dụng lúc chạy có phạm vi theo phiên. Chuyển phiên trên cùng một agent có thể thay đổi
  danh sách **Khả dụng ngay bây giờ**.
- Trình chỉnh sửa cấu hình không ngụ ý tính khả dụng lúc chạy; quyền truy cập hiệu lực vẫn tuân theo thứ tự ưu tiên chính sách
  (`allow`/`deny`, các ghi đè theo agent và nhà cung cấp/kênh).

## Sử dụng từ xa

- Chế độ từ xa tạo đường hầm cho WebSocket của gateway qua SSH/Tailscale.
- Bạn không cần chạy một máy chủ WebChat riêng.

## Tham chiếu cấu hình (WebChat)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn WebChat:

- `gateway.webchat.chatHistoryMaxChars`: số ký tự tối đa cho các trường văn bản trong phản hồi `chat.history`. Khi một mục bản ghi hội thoại vượt quá giới hạn này, Gateway sẽ cắt ngắn các trường văn bản dài và có thể thay thế các tin nhắn quá lớn bằng một placeholder. Client cũng có thể gửi `maxChars` theo từng yêu cầu để ghi đè mặc định này cho một lệnh gọi `chat.history` duy nhất.

Tùy chọn toàn cục liên quan:

- `gateway.port`, `gateway.bind`: máy chủ/cổng WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  xác thực WebSocket bằng shared-secret.
- `gateway.auth.allowTailscale`: tab trò chuyện Control UI trong trình duyệt có thể dùng các header danh tính Tailscale
  Serve khi được bật.
- `gateway.auth.mode: "trusted-proxy"`: xác thực proxy đảo ngược cho client trình duyệt phía sau một nguồn proxy **không phải loopback** nhận biết danh tính (xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: mục tiêu gateway từ xa.
- `session.*`: lưu trữ phiên và mặc định khóa chính.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Dashboard](/vi/web/dashboard)
