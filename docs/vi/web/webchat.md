---
read_when:
    - Gỡ lỗi hoặc cấu hình quyền truy cập WebChat
summary: Máy chủ tĩnh Loopback WebChat và cách sử dụng WS của Gateway cho giao diện trò chuyện
title: Trò chuyện web
x-i18n:
    generated_at: "2026-05-03T10:43:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Trạng thái: giao diện chat SwiftUI macOS/iOS giao tiếp trực tiếp với Gateway WebSocket.

## Nó là gì

- Giao diện chat native cho gateway (không có trình duyệt nhúng và không có máy chủ tĩnh cục bộ).
- Sử dụng cùng phiên và quy tắc định tuyến như các kênh khác.
- Định tuyến xác định: phản hồi luôn quay lại WebChat.

## Bắt đầu nhanh

1. Khởi động gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc thẻ chat Control UI.
3. Đảm bảo đã cấu hình đường dẫn xác thực gateway hợp lệ (mặc định là shared-secret,
   ngay cả trên loopback).

## Cách hoạt động (hành vi)

- Giao diện kết nối với Gateway WebSocket và dùng `chat.history`, `chat.send`, và `chat.inject`.
- `chat.history` được giới hạn để ổn định: Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua metadata nặng, và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`.
- `chat.history` đi theo nhánh transcript đang hoạt động đối với các tệp phiên append-only hiện đại, vì vậy các nhánh rewrite bị bỏ và các bản sao prompt đã bị thay thế sẽ không được hiển thị trong WebChat.
- Các mục Compaction hiển thị như một vạch phân cách lịch sử đã compact rõ ràng. Vạch phân cách giải thích rằng các lượt trước đó được giữ trong một checkpoint và liên kết tới các điều khiển checkpoint của Sessions, nơi người vận hành có thể tạo nhánh hoặc khôi phục chế độ xem trước Compaction khi quyền của họ cho phép.
- Control UI ghi nhớ Gateway `sessionId` nền do `chat.history` trả về và đưa nó vào các lệnh gọi `chat.send` tiếp theo, vì vậy các lần kết nối lại và làm mới trang tiếp tục cùng cuộc trò chuyện đã lưu trữ trừ khi người dùng bắt đầu hoặc đặt lại một phiên.
- Control UI gộp các lần gửi đang xử lý trùng lặp cho cùng phiên, tin nhắn, và tệp đính kèm trước khi tạo một id lần chạy `chat.send` mới; Gateway vẫn khử trùng lặp các yêu cầu lặp lại dùng lại cùng khóa idempotency.
- `chat.history` cũng được chuẩn hóa để hiển thị: ngữ cảnh OpenClaw chỉ dùng lúc runtime,
  các wrapper envelope inbound, các thẻ chỉ thị phân phối inline
  như `[[reply_to_*]]` và `[[audio_as_voice]]`, các payload XML gọi công cụ dạng văn bản thuần
  (bao gồm `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), và
  các token điều khiển mô hình ASCII/full-width bị rò rỉ đều bị loại khỏi văn bản hiển thị,
  và các mục assistant mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác
  `NO_REPLY` / `no_reply` sẽ bị bỏ qua.
- Các payload phản hồi được gắn cờ reasoning (`isReasoning: true`) bị loại khỏi nội dung assistant của WebChat, văn bản phát lại transcript, và các khối nội dung âm thanh, vì vậy các payload chỉ suy nghĩ không xuất hiện dưới dạng tin nhắn assistant hiển thị hoặc âm thanh có thể phát.
- `chat.inject` thêm trực tiếp một ghi chú assistant vào transcript và phát nó tới giao diện (không chạy agent).
- Các lần chạy bị hủy có thể giữ đầu ra assistant một phần hiển thị trong giao diện.
- Gateway lưu văn bản assistant một phần đã bị hủy vào lịch sử transcript khi có đầu ra đã đệm, và đánh dấu các mục đó bằng metadata hủy.
- Lịch sử luôn được lấy từ gateway (không theo dõi tệp cục bộ).
- Nếu không thể truy cập gateway, WebChat ở chế độ chỉ đọc.

## Bảng công cụ agent của Control UI

- Bảng Công cụ `/agents` của Control UI có hai chế độ xem riêng:
  - **Có sẵn ngay bây giờ** dùng `tools.effective(sessionKey=...)` và hiển thị những gì phiên hiện tại
    thực sự có thể dùng lúc runtime, bao gồm các công cụ thuộc core, Plugin, và kênh.
  - **Cấu hình công cụ** dùng `tools.catalog` và tập trung vào hồ sơ, override, và
    ngữ nghĩa catalog.
- Tính khả dụng lúc runtime được giới hạn theo phiên. Chuyển phiên trên cùng agent có thể thay đổi
  danh sách **Có sẵn ngay bây giờ**.
- Trình chỉnh sửa cấu hình không ngụ ý tính khả dụng lúc runtime; quyền truy cập hiệu lực vẫn tuân theo thứ tự ưu tiên của chính sách
  (`allow`/`deny`, override theo agent và provider/kênh).

## Sử dụng từ xa

- Chế độ từ xa tạo tunnel Gateway WebSocket qua SSH/Tailscale.
- Bạn không cần chạy một máy chủ WebChat riêng.

## Tham chiếu cấu hình (WebChat)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn WebChat:

- `gateway.webchat.chatHistoryMaxChars`: số ký tự tối đa cho các trường văn bản trong phản hồi `chat.history`. Khi một mục transcript vượt quá giới hạn này, Gateway cắt ngắn các trường văn bản dài và có thể thay thế các tin nhắn quá lớn bằng placeholder. Client cũng có thể gửi `maxChars` theo từng yêu cầu để ghi đè mặc định này cho một lệnh gọi `chat.history` duy nhất.

Tùy chọn toàn cục liên quan:

- `gateway.port`, `gateway.bind`: máy chủ/cổng WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  xác thực WebSocket shared-secret.
- `gateway.auth.allowTailscale`: thẻ chat Control UI trong trình duyệt có thể dùng các header định danh Tailscale
  Serve khi được bật.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy cho client trình duyệt phía sau nguồn proxy **không phải loopback** nhận biết danh tính (xem [Xác thực Trusted Proxy](/vi/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: mục tiêu gateway từ xa.
- `session.*`: lưu trữ phiên và các mặc định khóa chính.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Dashboard](/vi/web/dashboard)
