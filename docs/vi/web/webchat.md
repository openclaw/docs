---
read_when:
    - Gỡ lỗi hoặc cấu hình quyền truy cập WebChat
summary: Máy chủ tĩnh WebChat loopback và cách sử dụng WS Gateway cho giao diện trò chuyện
title: Trò chuyện web
x-i18n:
    generated_at: "2026-05-02T10:57:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Trạng thái: giao diện trò chuyện SwiftUI trên macOS/iOS giao tiếp trực tiếp với Gateway WebSocket.

## Đây là gì

- Giao diện trò chuyện native cho Gateway (không có trình duyệt nhúng và không có máy chủ tĩnh cục bộ).
- Sử dụng cùng các phiên và quy tắc định tuyến như các kênh khác.
- Định tuyến xác định: phản hồi luôn quay lại WebChat.

## Khởi động nhanh

1. Khởi động Gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc tab trò chuyện của Control UI.
3. Đảm bảo đã cấu hình đường dẫn xác thực Gateway hợp lệ (mặc định là shared-secret,
   ngay cả trên loopback).

## Cách hoạt động (hành vi)

- Giao diện kết nối tới Gateway WebSocket và sử dụng `chat.history`, `chat.send`, và `chat.inject`.
- `chat.history` được giới hạn để đảm bảo ổn định: Gateway có thể cắt bớt các trường văn bản dài, bỏ qua metadata nặng, và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`.
- `chat.history` theo nhánh transcript đang hoạt động đối với các tệp phiên append-only hiện đại, nên các nhánh ghi lại bị bỏ và các bản sao prompt đã bị thay thế sẽ không được hiển thị trong WebChat.
- Control UI ghi nhớ Gateway `sessionId` nền do `chat.history` trả về và đưa nó vào các lệnh gọi `chat.send` tiếp theo, nên việc kết nối lại và làm mới trang sẽ tiếp tục cùng cuộc trò chuyện đã lưu trừ khi người dùng bắt đầu hoặc đặt lại phiên.
- Control UI gộp các lượt gửi đang xử lý bị trùng cho cùng phiên, tin nhắn, và tệp đính kèm trước khi tạo id chạy `chat.send` mới; Gateway vẫn khử trùng lặp các yêu cầu lặp lại dùng lại cùng khóa idempotency.
- `chat.history` cũng được chuẩn hóa cho hiển thị: ngữ cảnh OpenClaw chỉ dùng lúc runtime,
  các wrapper phong bì đầu vào, các thẻ chỉ thị phân phối inline
  như `[[reply_to_*]]` và `[[audio_as_voice]]`, payload XML gọi công cụ dạng văn bản thuần
  (bao gồm `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cùng
  các token điều khiển mô hình ASCII/full-width bị rò rỉ sẽ bị loại khỏi văn bản hiển thị,
  và các mục assistant có toàn bộ văn bản hiển thị chỉ là token im lặng chính xác
  `NO_REPLY` / `no_reply` sẽ bị bỏ qua.
- Payload phản hồi được gắn cờ reasoning (`isReasoning: true`) bị loại khỏi nội dung assistant của WebChat, văn bản phát lại transcript, và các khối nội dung âm thanh, nên các payload chỉ để suy nghĩ không xuất hiện dưới dạng tin nhắn assistant hiển thị hoặc âm thanh có thể phát.
- `chat.inject` thêm trực tiếp một ghi chú assistant vào transcript và phát nó tới giao diện (không chạy agent).
- Các lượt chạy bị hủy có thể giữ đầu ra assistant một phần hiển thị trong giao diện.
- Gateway lưu văn bản assistant một phần đã bị hủy vào lịch sử transcript khi có đầu ra đã được đệm, và đánh dấu các mục đó bằng metadata hủy.
- Lịch sử luôn được lấy từ Gateway (không theo dõi tệp cục bộ).
- Nếu không thể truy cập Gateway, WebChat ở chế độ chỉ đọc.

## Bảng công cụ agent của Control UI

- Bảng Tools của Control UI `/agents` có hai chế độ xem riêng:
  - **Hiện Có Ngay** dùng `tools.effective(sessionKey=...)` và hiển thị những gì phiên hiện tại
    thực sự có thể dùng lúc runtime, bao gồm các công cụ thuộc core, plugin, và kênh.
  - **Cấu Hình Công Cụ** dùng `tools.catalog` và tập trung vào profile, override, và
    ngữ nghĩa catalog.
- Khả dụng lúc runtime có phạm vi theo phiên. Chuyển phiên trên cùng agent có thể thay đổi danh sách
  **Hiện Có Ngay**.
- Trình chỉnh sửa cấu hình không ngụ ý khả dụng lúc runtime; quyền truy cập hiệu lực vẫn tuân theo thứ tự ưu tiên chính sách
  (`allow`/`deny`, override theo agent và provider/kênh).

## Sử dụng từ xa

- Chế độ từ xa tunnel Gateway WebSocket qua SSH/Tailscale.
- Bạn không cần chạy máy chủ WebChat riêng.

## Tham chiếu cấu hình (WebChat)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn WebChat:

- `gateway.webchat.chatHistoryMaxChars`: số ký tự tối đa cho các trường văn bản trong phản hồi `chat.history`. Khi một mục transcript vượt quá giới hạn này, Gateway cắt bớt các trường văn bản dài và có thể thay thế tin nhắn quá lớn bằng placeholder. Client cũng có thể gửi `maxChars` theo từng yêu cầu để ghi đè mặc định này cho một lệnh gọi `chat.history` duy nhất.

Tùy chọn toàn cục liên quan:

- `gateway.port`, `gateway.bind`: máy chủ/cổng WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  xác thực WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab trò chuyện Control UI trong trình duyệt có thể dùng header danh tính Tailscale
  Serve khi được bật.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy cho client trình duyệt phía sau nguồn proxy **không phải loopback** nhận biết danh tính (xem [Xác Thực Trusted Proxy](/vi/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: đích Gateway từ xa.
- `session.*`: lưu trữ phiên và mặc định khóa chính.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Dashboard](/vi/web/dashboard)
