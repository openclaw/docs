---
read_when:
    - Gỡ lỗi hoặc cấu hình quyền truy cập WebChat
summary: Máy chủ tĩnh WebChat loopback và cách sử dụng Gateway WS cho giao diện trò chuyện
title: WebChat
x-i18n:
    generated_at: "2026-07-16T15:56:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Trạng thái: giao diện trò chuyện SwiftUI trên macOS/iOS giao tiếp trực tiếp với Gateway WebSocket. Không có trình duyệt nhúng, không có máy chủ tĩnh cục bộ.

## Đây là gì

- Giao diện trò chuyện gốc cho Gateway.
- Sử dụng cùng các phiên và quy tắc định tuyến như những kênh khác.
- Định tuyến xác định: phản hồi luôn được gửi trở lại WebChat.
- Lịch sử luôn được truy xuất từ Gateway (không theo dõi tệp cục bộ). Nếu không thể kết nối với Gateway, WebChat ở chế độ chỉ đọc.

## Bắt đầu nhanh

1. Khởi động Gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc thẻ trò chuyện trong Control UI.
3. Đảm bảo đã cấu hình đường dẫn xác thực Gateway hợp lệ (mặc định dùng bí mật dùng chung, ngay cả trên loopback).

## Cách hoạt động

- Giao diện kết nối với Gateway WebSocket và sử dụng các phương thức RPC `chat.history`, `chat.send`, `chat.inject` và `chat.message.get`.
- `chat.history` được giới hạn để đảm bảo tính ổn định: Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua siêu dữ liệu nặng và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`. Máy khách API có thể gửi `maxChars` cho từng yêu cầu để ghi đè giới hạn mặc định trong một lần gọi.
- Khi một tin nhắn hiển thị của trợ lý bị cắt ngắn trong `chat.history`, Control UI có thể mở trình đọc bên cạnh và truy xuất mục đầy đủ đã chuẩn hóa để hiển thị theo yêu cầu thông qua `chat.message.get` mà không làm tăng tải lịch sử mặc định. `chat.message.get` sử dụng cùng nhánh bản ghi và quy tắc hiển thị như `chat.history`, nhưng nhắm đến một mục theo `messageId` và trả về lý do không khả dụng chính xác khi không còn có thể trả về toàn bộ nội dung.
- `chat.history` đi theo nhánh bản ghi đang hoạt động đối với các tệp phiên chỉ nối thêm, vì vậy các nhánh ghi lại đã bị bỏ và bản sao lời nhắc đã bị thay thế không được kết xuất trong WebChat.
- Các mục Compaction được kết xuất dưới dạng dấu phân cách "Lịch sử đã được Compaction", giải thích rằng bản ghi đã được Compaction được lưu giữ làm điểm kiểm tra, cùng một thao tác để mở các điểm kiểm tra phiên (tạo nhánh hoặc khôi phục khi quyền cho phép).
- Control UI ghi nhớ `sessionId` của Gateway nền do `chat.history` trả về và đưa nó vào các lần gọi `chat.send` tiếp theo, vì vậy việc kết nối lại và làm mới trang tiếp tục cùng cuộc hội thoại đã lưu trữ, trừ khi người dùng bắt đầu hoặc đặt lại một phiên.
- `chat.send` nhận một khóa đảm bảo tính lũy đẳng (Control UI sử dụng mã định danh lượt chạy); Gateway loại bỏ yêu cầu trùng lặp sử dụng lại cùng khóa, vì vậy các lần gửi đang xử lý được thử lại hoặc bị trùng lặp cho cùng phiên/tin nhắn/tệp đính kèm sẽ không tạo ra lượt chạy thứ hai.
- Các tệp khởi động không gian làm việc và chỉ dẫn `BOOTSTRAP.md` đang chờ được cung cấp thông qua phần `# Project Context` trong lời nhắc hệ thống của tác nhân, thay vì được sao chép vào tin nhắn người dùng WebChat. Nếu nội dung khởi động bị cắt ngắn, lời nhắc hệ thống sẽ nhận một "Thông báo về ngữ cảnh khởi động" ngắn; số lượng chi tiết và các tùy chọn cấu hình vẫn nằm trên các bề mặt chẩn đoán.
- Quá trình chuẩn hóa hiển thị trên `chat.history` loại bỏ: ngữ cảnh OpenClaw chỉ dành cho thời gian chạy, trình bao bọc phong bì đầu vào, các thẻ chỉ thị phân phối nội tuyến như `[[reply_to_current]]`, `[[reply_to:<id>]]` và `[[audio_as_voice]]`, tải XML cuộc gọi công cụ dạng văn bản thuần túy (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, bao gồm cả các khối bị cắt ngắn) và các token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ. Các mục của trợ lý có toàn bộ văn bản hiển thị chỉ là token im lặng `NO_REPLY` (không phân biệt chữ hoa chữ thường) sẽ bị bỏ qua.
- Các tải phản hồi được đánh dấu là suy luận (`isReasoning: true`) bị loại khỏi nội dung trợ lý WebChat, văn bản phát lại bản ghi và các khối nội dung âm thanh, vì vậy các tải chỉ chứa quá trình suy nghĩ không xuất hiện dưới dạng tin nhắn hiển thị của trợ lý hoặc âm thanh có thể phát.
- `chat.inject` nối trực tiếp ghi chú của trợ lý vào bản ghi và phát nó tới giao diện (không chạy tác nhân).
- Các lượt chạy bị hủy có thể giữ phần đầu ra trợ lý chưa hoàn chỉnh hiển thị trong giao diện. Gateway lưu văn bản chưa hoàn chỉnh đó vào lịch sử bản ghi khi có đầu ra được lưu trong bộ đệm và đánh dấu mục bằng siêu dữ liệu hủy.

### Mô hình bản ghi và phân phối

WebChat có hai đường dẫn dữ liệu riêng biệt:

- Các hàng bản ghi SQLite là bản ghi bền vững của mô hình/thời gian chạy. Đối với các lượt chạy tác nhân thông thường, thời gian chạy OpenClaw nhúng lưu các tin nhắn `user`, `assistant` và `toolResult` hiển thị với mô hình thông qua bộ truy cập phiên. WebChat không ghi tùy ý văn bản phân phối, trạng thái hoặc trợ giúp vào bản ghi đó.
- Các sự kiện `ReplyPayload` của Gateway là phép chiếu phân phối trực tiếp: được chuẩn hóa để hiển thị trên WebChat/kênh, truyền phát theo khối, thẻ chỉ thị, nhúng phương tiện, cờ TTS/âm thanh và hành vi dự phòng của giao diện. Bản thân chúng không phải là nhật ký phiên chuẩn tắc.
- Các bộ kiểm thử yêu cầu phản hồi hiển thị thông qua `tools.message` vẫn sử dụng WebChat làm đích nhận phản hồi nguồn nội bộ của lượt chạy hiện tại. Một `message.send` không có đích từ lượt chạy WebChat đang hoạt động đó được chiếu vào cùng cuộc trò chuyện và phản chiếu vào bản ghi phiên; WebChat không trở thành kênh gửi đi có thể tái sử dụng và không bao giờ kế thừa `lastChannel`.
- WebChat chỉ chèn các mục bản ghi của trợ lý khi Gateway sở hữu một tin nhắn hiển thị nằm ngoài lượt tác nhân nhúng thông thường: `chat.inject`, phản hồi lệnh không qua tác nhân, đầu ra chưa hoàn chỉnh bị hủy và phần bổ sung bản ghi phương tiện do WebChat quản lý.
- Nếu văn bản trợ lý trực tiếp xuất hiện trong một lượt chạy nhưng biến mất sau khi tải lại lịch sử, hãy kiểm tra theo thứ tự: bản ghi SQLite có chứa văn bản trợ lý hay không, phép chiếu hiển thị `chat.history` có loại bỏ văn bản đó hay không, sau đó phép hợp nhất phần đuôi lạc quan của Control UI có thay thế trạng thái phân phối cục bộ bằng ảnh chụp nhanh đã lưu hay không.

Các câu trả lời cuối cùng của lượt chạy tác nhân thông thường phải bền vững vì thời gian chạy nhúng ghi `message_end` của trợ lý. Mọi phương án dự phòng phản chiếu tải cuối cùng đã phân phối vào bản ghi trước tiên phải tránh sao chép một lượt trợ lý mà thời gian chạy nhúng đã ghi.

## Bảng công cụ tác nhân của Control UI

- Bảng Công cụ `/agents` của Control UI có chế độ xem "Hiện khả dụng" dựa trên `tools.effective(sessionKey=...)`: một phép chiếu chỉ đọc do máy chủ tạo ra về kho công cụ của phiên hiện tại, bao gồm công cụ lõi, Plugin, công cụ thuộc sở hữu của kênh và công cụ máy chủ MCP đã được phát hiện.
- Một chế độ xem chỉnh sửa cấu hình riêng biệt (dựa trên `tools.catalog`) bao gồm hồ sơ, các giá trị ghi đè theo từng tác nhân và ngữ nghĩa danh mục.
- Tính khả dụng trong thời gian chạy được giới hạn theo phiên. Chuyển đổi phiên trên cùng một tác nhân có thể thay đổi danh sách "Hiện khả dụng". Nếu các máy chủ MCP đã cấu hình chưa được kết nối hoặc thay đổi kể từ lần phát hiện gần nhất, bảng sẽ hiển thị thông báo thay vì âm thầm khởi động các cơ chế truyền tải MCP từ đường dẫn đọc.
- Trình chỉnh sửa cấu hình không ngụ ý tính khả dụng trong thời gian chạy; quyền truy cập thực tế vẫn tuân theo thứ tự ưu tiên chính sách (`allow`/`deny`, các giá trị ghi đè theo từng tác nhân và nhà cung cấp/kênh).

## Sử dụng từ xa

- Chế độ từ xa tạo đường hầm cho Gateway WebSocket qua SSH/Tailscale.
- Bạn không cần chạy máy chủ WebChat riêng.

## Tham chiếu cấu hình (WebChat)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

WebChat không có phần cấu hình được lưu bền vững. Gateway sử dụng giới hạn hiển thị `chat.history` tích hợp; máy khách API có thể gửi `maxChars` theo từng yêu cầu để ghi đè giới hạn đó trong một lần gọi. Cấu hình `channels.webchat` và `gateway.webchat` cũ đã ngừng sử dụng; chạy `openclaw doctor --fix` để xóa cấu hình đó.

Các tùy chọn toàn cục liên quan:

- `gateway.port`, `gateway.bind`: máy chủ/cổng WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  xác thực WebSocket bằng bí mật dùng chung.
- `gateway.auth.allowTailscale`: thẻ trò chuyện Control UI trên trình duyệt có thể sử dụng tiêu đề danh tính
  Tailscale Serve khi được bật.
- `gateway.auth.mode: "trusted-proxy"`: xác thực proxy ngược cho máy khách trình duyệt phía sau nguồn proxy **không phải loopback** có nhận biết danh tính (xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: đích Gateway từ xa.
- `session.*`: lưu trữ phiên và giá trị mặc định của khóa chính.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Bảng điều khiển](/vi/web/dashboard)
