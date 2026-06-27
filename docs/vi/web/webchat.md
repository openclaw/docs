---
read_when:
    - Gỡ lỗi hoặc cấu hình quyền truy cập WebChat
summary: Máy chủ tĩnh Loopback WebChat và cách dùng Gateway WS cho giao diện trò chuyện
title: WebChat
x-i18n:
    generated_at: "2026-06-27T18:21:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Trạng thái: giao diện chat SwiftUI trên macOS/iOS nói chuyện trực tiếp với Gateway WebSocket.

## Đây là gì

- Giao diện chat native cho gateway (không có trình duyệt nhúng và không có máy chủ tĩnh cục bộ).
- Dùng cùng phiên và quy tắc định tuyến như các kênh khác.
- Định tuyến tất định: câu trả lời luôn quay lại WebChat.

## Khởi động nhanh

1. Khởi động gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc tab chat của Control UI.
3. Đảm bảo đã cấu hình đường dẫn xác thực gateway hợp lệ (mặc định là shared-secret,
   ngay cả trên loopback).

## Cách hoạt động (hành vi)

- Giao diện kết nối tới Gateway WebSocket và dùng `chat.history`, `chat.send`, và `chat.inject`.
- `chat.history` được giới hạn để ổn định: Gateway có thể cắt bớt các trường văn bản dài, bỏ qua metadata nặng, và thay các mục quá lớn bằng `[chat.history omitted: message too large]`.
- Khi một tin nhắn trợ lý hiển thị đã bị cắt bớt trong `chat.history`, Control UI có thể mở trình đọc bên cạnh và lấy mục đầy đủ đã chuẩn hóa để hiển thị theo yêu cầu qua `chat.message.get` mà không tăng payload lịch sử mặc định.
- `chat.history` đi theo nhánh bản ghi đang hoạt động cho các tệp phiên append-only hiện đại, nên các nhánh viết lại bị bỏ và các bản sao prompt đã bị thay thế sẽ không được render trong WebChat.
- Các mục Compaction render dưới dạng một vạch chia lịch sử đã nén rõ ràng. Vạch chia giải thích rằng bản ghi đã nén được giữ lại như một checkpoint và liên kết tới các điều khiển checkpoint của Sessions, nơi operator có thể tạo nhánh hoặc khôi phục từ chế độ xem đã nén đó khi quyền của họ cho phép.
- Control UI ghi nhớ Gateway `sessionId` nền do `chat.history` trả về và đưa nó vào các lệnh gọi `chat.send` tiếp theo, nên việc kết nối lại và làm mới trang tiếp tục cùng cuộc trò chuyện đã lưu trừ khi người dùng bắt đầu hoặc đặt lại một phiên.
- Control UI gộp các lượt gửi đang xử lý bị trùng cho cùng phiên, tin nhắn, và tệp đính kèm trước khi tạo một id lượt chạy `chat.send` mới; Gateway vẫn khử trùng lặp các yêu cầu lặp lại dùng lại cùng idempotency key.
- Các tệp khởi động workspace và hướng dẫn `BOOTSTRAP.md` đang chờ được cung cấp qua Project Context trong system prompt của agent, không được sao chép vào tin nhắn người dùng WebChat. Việc cắt bớt bootstrap chỉ thêm một thông báo khôi phục ngắn gọn trong system prompt; số đếm chi tiết và núm cấu hình vẫn nằm trên các bề mặt chẩn đoán.
- `chat.history` cũng được chuẩn hóa để hiển thị: ngữ cảnh OpenClaw chỉ dùng trong runtime,
  các wrapper phong bì inbound, thẻ chỉ thị gửi nội tuyến
  như `[[reply_to_*]]` và `[[audio_as_voice]]`, payload XML tool-call dạng plain-text
  (bao gồm `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, và các khối tool-call bị cắt bớt), cùng
  các token điều khiển mô hình ASCII/full-width bị lộ sẽ bị loại khỏi văn bản hiển thị,
  và các mục trợ lý mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác
  `NO_REPLY` / `no_reply` sẽ bị bỏ qua.
- Payload trả lời được gắn cờ reasoning (`isReasoning: true`) bị loại khỏi nội dung trợ lý WebChat, văn bản phát lại bản ghi, và các khối nội dung âm thanh, nên payload chỉ để suy nghĩ không xuất hiện như tin nhắn trợ lý hiển thị hoặc âm thanh có thể phát.
- `chat.inject` thêm trực tiếp một ghi chú trợ lý vào bản ghi và phát nó tới giao diện (không có lượt chạy agent).
- Các lượt chạy bị hủy có thể giữ đầu ra trợ lý một phần hiển thị trong giao diện.
- Gateway lưu văn bản trợ lý một phần đã bị hủy vào lịch sử bản ghi khi có đầu ra trong bộ đệm, và đánh dấu các mục đó bằng metadata hủy.
- Lịch sử luôn được lấy từ gateway (không theo dõi tệp cục bộ).
- Nếu không thể kết nối gateway, WebChat ở chế độ chỉ đọc.

### Mô hình bản ghi và gửi

WebChat có hai đường dữ liệu riêng biệt:

- Tệp JSONL của phiên là bản ghi model/runtime bền vững. Với các lượt chạy agent bình thường, runtime OpenClaw nhúng lưu các tin nhắn `user`, `assistant`, và `toolResult` mà mô hình thấy được thông qua trình quản lý phiên của nó. WebChat không ghi nội dung gửi, trạng thái, hoặc văn bản trợ giúp tùy ý vào bản ghi đó.
- Các sự kiện Gateway `ReplyPayload` là phép chiếu gửi trực tiếp. Chúng có thể được chuẩn hóa để hiển thị trong WebChat/kênh, stream khối, thẻ chỉ thị, nhúng media, cờ TTS/âm thanh, và hành vi fallback của giao diện. Bản thân chúng không phải nhật ký phiên chuẩn tắc.
- Các harness yêu cầu trả lời hiển thị qua `tools.message` vẫn dùng WebChat làm sink trả lời nguồn nội bộ cho lượt chạy hiện tại. Một `message.send` không có target từ lượt chạy WebChat đang hoạt động đó được chiếu vào cùng chat và phản chiếu vào bản ghi phiên; WebChat không trở thành một kênh outbound có thể tái sử dụng và không bao giờ kế thừa `lastChannel`.
- WebChat chỉ chèn các mục bản ghi trợ lý khi Gateway sở hữu một tin nhắn được hiển thị bên ngoài lượt agent nhúng bình thường: `chat.inject`, trả lời lệnh không phải agent, đầu ra một phần bị hủy, và phần bổ sung bản ghi media do WebChat quản lý.
- `chat.history` đọc bản ghi phiên đã lưu và áp dụng phép chiếu hiển thị WebChat. Nếu văn bản trợ lý trực tiếp xuất hiện trong một lượt chạy nhưng biến mất sau khi tải lại lịch sử, trước tiên hãy kiểm tra liệu JSONL thô có chứa văn bản trợ lý hay không, sau đó kiểm tra liệu phép chiếu `chat.history` có loại bỏ nó hay không, rồi kiểm tra liệu merge optimistic-tail của Control UI có thay thế trạng thái gửi cục bộ bằng snapshot đã lưu hay không.
- `chat.message.get` dùng cùng nhánh bản ghi và quy tắc phép chiếu hiển thị như `chat.history`, bao gồm phạm vi agent đang hoạt động, nhưng nhắm tới một mục bản ghi theo `messageId` và trả về lý do không khả dụng trung thực khi không còn có thể trả về nội dung đầy đủ.

Câu trả lời cuối của lượt chạy agent bình thường phải bền vững vì runtime nhúng ghi `message_end` của trợ lý. Bất kỳ fallback nào phản chiếu payload cuối đã gửi vào bản ghi trước tiên phải tránh nhân đôi một lượt trợ lý mà runtime nhúng đã ghi.

## Bảng công cụ agent trong Control UI

- Bảng Tools `/agents` của Control UI có hai chế độ xem riêng:
  - **Hiện Có Ngay Bây Giờ** dùng `tools.effective(sessionKey=...)` và hiển thị một phép chiếu chỉ đọc do máy chủ suy ra
    của kho công cụ phiên hiện tại, bao gồm công cụ core, plugin, do kênh sở hữu,
    và công cụ MCP server đã được phát hiện.
  - **Cấu Hình Công Cụ** dùng `tools.catalog` và vẫn tập trung vào hồ sơ, override, và
    ngữ nghĩa catalog.
- Tính khả dụng runtime có phạm vi theo phiên. Chuyển phiên trên cùng agent có thể thay đổi
  danh sách **Hiện Có Ngay Bây Giờ**. Nếu các MCP server đã cấu hình chưa được kết nối hoặc đã thay đổi
  kể từ lần phát hiện gần nhất, bảng hiển thị một thông báo thay vì âm thầm khởi động MCP transport
  từ đường đọc.
- Trình chỉnh sửa cấu hình không ngụ ý tính khả dụng runtime; quyền truy cập hiệu dụng vẫn tuân theo thứ tự ưu tiên chính sách
  (`allow`/`deny`, override theo agent và provider/kênh).

## Sử dụng từ xa

- Chế độ từ xa tunnel Gateway WebSocket qua SSH/Tailscale.
- Bạn không cần chạy máy chủ WebChat riêng.

## Tham chiếu cấu hình (WebChat)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

WebChat không có phần cấu hình được lưu bền vững. Gateway dùng giới hạn hiển thị `chat.history` tích hợp; client API có thể gửi `maxChars` theo từng yêu cầu để override nó cho một lệnh gọi `chat.history` duy nhất. Cấu hình cũ `channels.webchat` và `gateway.webchat` đã bị loại bỏ; chạy `openclaw doctor --fix` để xóa nó.

Các tùy chọn global liên quan:

- `gateway.port`, `gateway.bind`: host/cổng WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  xác thực WebSocket bằng shared-secret.
- `gateway.auth.allowTailscale`: tab chat Control UI trên trình duyệt có thể dùng header danh tính Tailscale
  Serve khi được bật.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy cho client trình duyệt phía sau nguồn proxy **không phải loopback** có nhận biết danh tính (xem [Xác Thực Trusted Proxy](/vi/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target gateway từ xa.
- `session.*`: lưu trữ phiên và giá trị mặc định của khóa chính.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Dashboard](/vi/web/dashboard)
