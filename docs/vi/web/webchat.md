---
read_when:
    - Gỡ lỗi hoặc cấu hình quyền truy cập WebChat
summary: Máy chủ tĩnh WebChat vòng lặp cục bộ và cách sử dụng WS của Gateway cho giao diện trò chuyện
title: Trò chuyện web
x-i18n:
    generated_at: "2026-05-02T23:39:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

Trạng thái: giao diện trò chuyện SwiftUI macOS/iOS giao tiếp trực tiếp với Gateway WebSocket.

## Đây là gì

- Giao diện trò chuyện native cho gateway (không có trình duyệt nhúng và không có máy chủ tĩnh cục bộ).
- Sử dụng cùng phiên và quy tắc định tuyến như các kênh khác.
- Định tuyến xác định: phản hồi luôn quay lại WebChat.

## Khởi động nhanh

1. Khởi động gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc thẻ trò chuyện của Control UI.
3. Đảm bảo đã cấu hình một đường dẫn xác thực gateway hợp lệ (mặc định là shared-secret,
   ngay cả trên loopback).

## Cách hoạt động (hành vi)

- Giao diện kết nối với Gateway WebSocket và sử dụng `chat.history`, `chat.send`, `chat.inject`, và `chat.transcribeAudio`.
- `chat.history` được giới hạn để ổn định: Gateway có thể cắt bớt các trường văn bản dài, bỏ qua metadata nặng, và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`.
- `chat.history` đi theo nhánh bản ghi hội thoại đang hoạt động đối với các tệp phiên append-only hiện đại, nên các nhánh viết lại bị bỏ và bản sao prompt đã bị thay thế sẽ không được hiển thị trong WebChat.
- Control UI ghi nhớ Gateway `sessionId` nền do `chat.history` trả về và đưa nó vào các lệnh gọi `chat.send` tiếp theo, nên các lần kết nối lại và làm mới trang tiếp tục cùng cuộc trò chuyện đã lưu trữ trừ khi người dùng bắt đầu hoặc đặt lại phiên.
- Control UI gộp các lần gửi đang xử lý trùng lặp cho cùng phiên, tin nhắn và tệp đính kèm trước khi tạo id lần chạy `chat.send` mới; Gateway vẫn khử trùng lặp các yêu cầu lặp lại tái sử dụng cùng khóa idempotency.
- `chat.history` cũng được chuẩn hóa để hiển thị: ngữ cảnh OpenClaw chỉ dùng lúc chạy,
  wrapper phong bì đầu vào, thẻ chỉ thị gửi nội tuyến
  như `[[reply_to_*]]` và `[[audio_as_voice]]`, payload XML gọi công cụ dạng văn bản thuần
  (bao gồm `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), và
  token điều khiển mô hình ASCII/full-width bị rò rỉ sẽ bị loại khỏi văn bản hiển thị,
  và các mục assistant có toàn bộ văn bản hiển thị chỉ là token im lặng chính xác
  `NO_REPLY` / `no_reply` sẽ bị bỏ qua.
- Payload phản hồi được gắn cờ suy luận (`isReasoning: true`) bị loại khỏi nội dung assistant của WebChat, văn bản phát lại bản ghi hội thoại và các khối nội dung âm thanh, nên payload chỉ dùng để suy nghĩ không xuất hiện dưới dạng tin nhắn assistant hiển thị hoặc âm thanh có thể phát.
- `chat.transcribeAudio` cung cấp tính năng đọc chính tả phía máy chủ trong trình soạn trò chuyện của Control UI. Trình duyệt ghi âm microphone, gửi dưới dạng base64 đến Gateway, và Gateway chạy pipeline `tools.media.audio` đã cấu hình. Bản chép lời trả về được chèn vào bản nháp; không có lần chạy agent nào được bắt đầu cho đến khi người dùng gửi.
- `chat.inject` thêm trực tiếp một ghi chú assistant vào bản ghi hội thoại và phát nó đến giao diện (không có lần chạy agent).
- Các lần chạy bị hủy có thể giữ đầu ra assistant một phần hiển thị trong giao diện.
- Gateway lưu văn bản assistant một phần đã bị hủy vào lịch sử bản ghi hội thoại khi có đầu ra được đệm, và đánh dấu các mục đó bằng metadata hủy.
- Lịch sử luôn được lấy từ gateway (không theo dõi tệp cục bộ).
- Nếu không thể truy cập gateway, WebChat ở chế độ chỉ đọc.

## Bảng công cụ agent của Control UI

- Bảng Tools của Control UI `/agents` có hai chế độ xem riêng biệt:
  - **Khả dụng ngay bây giờ** sử dụng `tools.effective(sessionKey=...)` và hiển thị những gì phiên hiện tại
    thực sự có thể dùng lúc chạy, bao gồm công cụ thuộc core, plugin và kênh.
  - **Cấu hình công cụ** sử dụng `tools.catalog` và tiếp tục tập trung vào hồ sơ, ghi đè và
    ngữ nghĩa catalog.
- Khả dụng lúc chạy được giới hạn theo phiên. Chuyển phiên trên cùng một agent có thể thay đổi danh sách
  **Khả dụng ngay bây giờ**.
- Trình chỉnh sửa cấu hình không ngụ ý khả dụng lúc chạy; quyền truy cập hiệu lực vẫn tuân theo thứ tự ưu tiên chính sách
  (`allow`/`deny`, ghi đè theo từng agent và provider/kênh).

## Sử dụng từ xa

- Chế độ từ xa đường hầm Gateway WebSocket qua SSH/Tailscale.
- Bạn không cần chạy máy chủ WebChat riêng.

## Tham chiếu cấu hình (WebChat)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn WebChat:

- `gateway.webchat.chatHistoryMaxChars`: số ký tự tối đa cho các trường văn bản trong phản hồi `chat.history`. Khi một mục bản ghi hội thoại vượt quá giới hạn này, Gateway sẽ cắt bớt các trường văn bản dài và có thể thay thế tin nhắn quá lớn bằng placeholder. `maxChars` theo từng yêu cầu cũng có thể được client gửi để ghi đè mặc định này cho một lệnh gọi `chat.history` duy nhất.

Tùy chọn toàn cục liên quan:

- `gateway.port`, `gateway.bind`: máy chủ/cổng WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  xác thực WebSocket shared-secret.
- `gateway.auth.allowTailscale`: thẻ trò chuyện Control UI trên trình duyệt có thể dùng header định danh Tailscale
  Serve khi được bật.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy cho client trình duyệt phía sau một nguồn proxy **không phải loopback** nhận biết danh tính (xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: mục tiêu gateway từ xa.
- `session.*`: lưu trữ phiên và mặc định khóa chính.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Bảng điều khiển](/vi/web/dashboard)
