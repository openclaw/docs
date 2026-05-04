---
read_when:
    - Gỡ lỗi hoặc cấu hình quyền truy cập WebChat
summary: Host tĩnh Loopback WebChat và cách sử dụng Gateway WS cho giao diện chat
title: WebChat
x-i18n:
    generated_at: "2026-05-04T02:26:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Trạng thái: giao diện chat SwiftUI trên macOS/iOS giao tiếp trực tiếp với Gateway WebSocket.

## Đây là gì

- Một giao diện chat gốc cho Gateway (không có trình duyệt nhúng và không có máy chủ tĩnh cục bộ).
- Sử dụng cùng phiên và quy tắc định tuyến như các kênh khác.
- Định tuyến xác định: câu trả lời luôn quay lại WebChat.

## Bắt đầu nhanh

1. Khởi động Gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc tab chat của Control UI.
3. Đảm bảo đã cấu hình đường dẫn xác thực Gateway hợp lệ (mặc định là shared-secret,
   kể cả trên local loopback).

## Cách hoạt động (hành vi)

- Giao diện kết nối tới Gateway WebSocket và dùng `chat.history`, `chat.send` và `chat.inject`.
- `chat.history` được giới hạn để ổn định: Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua siêu dữ liệu nặng và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`.
- `chat.history` đi theo nhánh bản ghi hội thoại đang hoạt động đối với các tệp phiên append-only hiện đại, vì vậy các nhánh viết lại đã bị bỏ và các bản sao lời nhắc đã bị thay thế sẽ không được hiển thị trong WebChat.
- Các mục Compaction hiển thị dưới dạng một dải phân cách lịch sử đã được nén rõ ràng. Dải phân cách giải thích rằng các lượt trước đó được giữ trong một checkpoint và liên kết tới các điều khiển checkpoint của Sessions, nơi người vận hành có thể tạo nhánh hoặc khôi phục chế độ xem trước Compaction khi quyền của họ cho phép.
- Control UI ghi nhớ `sessionId` Gateway nền do `chat.history` trả về và đưa nó vào các lệnh gọi `chat.send` tiếp theo, vì vậy việc kết nối lại và làm mới trang tiếp tục cùng cuộc hội thoại đã lưu trừ khi người dùng bắt đầu hoặc đặt lại phiên.
- Control UI gộp các lượt gửi đang chạy trùng lặp cho cùng phiên, thông điệp và tệp đính kèm trước khi tạo id chạy `chat.send` mới; Gateway vẫn khử trùng lặp các yêu cầu lặp lại dùng lại cùng khóa idempotency.
- Các tệp khởi động workspace và chỉ dẫn `BOOTSTRAP.md` đang chờ được cung cấp qua Project Context trong lời nhắc hệ thống của agent, không được sao chép vào thông điệp người dùng WebChat. Việc cắt ngắn bootstrap chỉ thêm một thông báo khôi phục ngắn gọn trong lời nhắc hệ thống; số lượng chi tiết và các núm cấu hình vẫn nằm trên các bề mặt chẩn đoán.
- `chat.history` cũng được chuẩn hóa hiển thị: ngữ cảnh OpenClaw chỉ dùng lúc chạy,
  các lớp bọc phong bì đầu vào, thẻ chỉ thị giao hàng nội tuyến
  như `[[reply_to_*]]` và `[[audio_as_voice]]`, payload XML gọi công cụ dạng văn bản thuần
  (bao gồm `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cùng
  các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ đều bị loại khỏi văn bản hiển thị,
  và các mục assistant mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác
  `NO_REPLY` / `no_reply` sẽ bị bỏ qua.
- Các payload trả lời được gắn cờ suy luận (`isReasoning: true`) bị loại khỏi nội dung assistant của WebChat, văn bản phát lại bản ghi hội thoại và các khối nội dung âm thanh, vì vậy payload chỉ dùng cho suy nghĩ không xuất hiện dưới dạng thông điệp assistant hiển thị hoặc âm thanh có thể phát.
- `chat.inject` thêm trực tiếp một ghi chú assistant vào bản ghi hội thoại và phát nó tới giao diện (không chạy agent).
- Các lượt chạy bị hủy có thể giữ đầu ra assistant một phần hiển thị trong giao diện.
- Gateway lưu văn bản assistant một phần đã bị hủy vào lịch sử bản ghi hội thoại khi có đầu ra đã đệm, và đánh dấu các mục đó bằng siêu dữ liệu hủy.
- Lịch sử luôn được lấy từ Gateway (không theo dõi tệp cục bộ).
- Nếu không truy cập được Gateway, WebChat ở chế độ chỉ đọc.

### Bản ghi hội thoại và mô hình giao hàng

WebChat có hai đường dữ liệu riêng biệt:

- Tệp JSONL của phiên là bản ghi hội thoại bền vững cho mô hình/runtime. Đối với các lượt chạy agent thông thường, Pi lưu các thông điệp `user`, `assistant` và `toolResult` mà mô hình nhìn thấy thông qua trình quản lý phiên của nó. WebChat không ghi tùy tiện văn bản giao hàng, trạng thái hoặc trợ giúp vào bản ghi hội thoại đó.
- Các sự kiện `ReplyPayload` của Gateway là phép chiếu giao hàng trực tiếp. Chúng có thể được chuẩn hóa cho hiển thị WebChat/kênh, block streaming, thẻ chỉ thị, nhúng media, cờ TTS/âm thanh và hành vi dự phòng của giao diện. Bản thân chúng không phải là nhật ký phiên chính quy.
- WebChat chỉ chèn các mục bản ghi hội thoại assistant khi Gateway sở hữu một thông điệp đã hiển thị ngoài một lượt assistant Pi thông thường: `chat.inject`, câu trả lời lệnh không phải agent, đầu ra một phần đã bị hủy và phần bổ sung bản ghi hội thoại media do WebChat quản lý.
- `chat.history` đọc bản ghi hội thoại phiên đã lưu và áp dụng phép chiếu hiển thị WebChat. Nếu văn bản assistant trực tiếp xuất hiện trong một lượt chạy nhưng biến mất sau khi tải lại lịch sử, trước tiên hãy kiểm tra JSONL thô có chứa văn bản assistant hay không, sau đó kiểm tra phép chiếu `chat.history` có loại bỏ nó hay không, rồi kiểm tra phần gộp đuôi lạc quan của Control UI có thay thế trạng thái giao hàng cục bộ bằng snapshot đã lưu hay không.

Câu trả lời cuối cùng của lượt chạy agent thông thường phải bền vững vì Pi ghi `message_end` của assistant. Bất kỳ cơ chế dự phòng nào phản chiếu một payload cuối cùng đã giao vào bản ghi hội thoại trước hết phải tránh nhân đôi một lượt assistant mà Pi đã ghi.

## Bảng công cụ agent của Control UI

- Bảng Tools của Control UI `/agents` có hai chế độ xem riêng:
  - **Có sẵn ngay bây giờ** dùng `tools.effective(sessionKey=...)` và hiển thị những gì phiên hiện tại
    thực sự có thể dùng lúc chạy, bao gồm các công cụ thuộc lõi, Plugin và kênh.
  - **Cấu hình công cụ** dùng `tools.catalog` và tiếp tục tập trung vào hồ sơ, ghi đè và
    ngữ nghĩa danh mục.
- Khả năng sử dụng lúc chạy được giới hạn theo phiên. Việc chuyển phiên trên cùng agent có thể thay đổi danh sách
  **Có sẵn ngay bây giờ**.
- Trình chỉnh sửa cấu hình không hàm ý khả năng sử dụng lúc chạy; quyền truy cập hiệu lực vẫn tuân theo thứ tự ưu tiên chính sách
  (`allow`/`deny`, ghi đè theo agent và provider/kênh).

## Sử dụng từ xa

- Chế độ từ xa tạo đường hầm Gateway WebSocket qua SSH/Tailscale.
- Bạn không cần chạy một máy chủ WebChat riêng.

## Tham chiếu cấu hình (WebChat)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn WebChat:

- `gateway.webchat.chatHistoryMaxChars`: số ký tự tối đa cho các trường văn bản trong phản hồi `chat.history`. Khi một mục bản ghi hội thoại vượt quá giới hạn này, Gateway cắt ngắn các trường văn bản dài và có thể thay thế thông điệp quá lớn bằng một placeholder. Client cũng có thể gửi `maxChars` theo từng yêu cầu để ghi đè mặc định này cho một lệnh gọi `chat.history` duy nhất.

Tùy chọn toàn cục liên quan:

- `gateway.port`, `gateway.bind`: máy chủ/cổng WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  xác thực WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat Control UI trên trình duyệt có thể dùng header danh tính Tailscale
  Serve khi được bật.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy cho client trình duyệt phía sau nguồn proxy **không phải loopback** có nhận biết danh tính (xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: mục tiêu Gateway từ xa.
- `session.*`: lưu trữ phiên và mặc định khóa chính.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Bảng điều khiển](/vi/web/dashboard)
