---
read_when:
    - Gỡ lỗi hoặc cấu hình quyền truy cập WebChat
summary: Máy chủ tĩnh WebChat trên loopback và việc sử dụng Gateway WS cho giao diện trò chuyện
title: WebChat
x-i18n:
    generated_at: "2026-07-19T06:06:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05309caff8e3fe5d14627ea9bc50667c5154a2f493ef4fd1e813d9d9bf82fbc4
    source_path: web/webchat.md
    workflow: 16
---

Trạng thái: giao diện chat SwiftUI trên macOS/iOS giao tiếp trực tiếp với Gateway WebSocket. Không có trình duyệt nhúng, không có máy chủ tĩnh cục bộ.

## Đây là gì

- Giao diện chat gốc cho Gateway.
- Sử dụng cùng các phiên và quy tắc định tuyến như các kênh khác.
- Định tuyến xác định: phản hồi luôn được gửi trở lại WebChat.
- Lịch sử luôn được truy xuất từ Gateway (không theo dõi tệp cục bộ). Nếu không thể kết nối với Gateway, WebChat chỉ cho phép đọc.

## Bắt đầu nhanh

1. Khởi động Gateway.
2. Mở giao diện WebChat (ứng dụng macOS/iOS) hoặc thẻ chat trong Control UI.
3. Đảm bảo đã cấu hình đường dẫn xác thực Gateway hợp lệ (mặc định dùng bí mật dùng chung, ngay cả trên loopback).

## Cách hoạt động

- Giao diện kết nối với Gateway WebSocket và sử dụng các phương thức RPC `chat.history`, `chat.send`, `chat.inject` và `chat.message.get`.
- `chat.history` được giới hạn để đảm bảo tính ổn định: Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua siêu dữ liệu nặng và thay thế các mục quá lớn bằng `[chat.history omitted: message too large]`. Máy khách API có thể gửi `maxChars` cho từng yêu cầu để ghi đè giới hạn mặc định cho một lệnh gọi.
- Khi một thông báo trợ lý hiển thị bị cắt ngắn trong `chat.history`, Control UI có thể mở trình đọc bên cạnh và truy xuất mục đầy đủ đã được chuẩn hóa để hiển thị theo yêu cầu qua `chat.message.get`, mà không làm tăng tải lịch sử mặc định. `chat.message.get` sử dụng cùng nhánh bản ghi và quy tắc hiển thị như `chat.history`, nhưng nhắm đến một mục theo `messageId` và trả về lý do không khả dụng trung thực khi không còn có thể trả về nội dung đầy đủ.
- `chat.history` đi theo nhánh bản ghi đang hoạt động đối với các tệp phiên chỉ cho phép nối thêm, vì vậy các nhánh ghi lại đã bị bỏ và các bản sao prompt đã bị thay thế sẽ không được hiển thị trong WebChat.
- Các mục Compaction được hiển thị dưới dạng dấu phân cách "Lịch sử đã được rút gọn", giải thích rằng bản ghi đã được rút gọn được lưu giữ làm điểm kiểm tra, kèm thao tác mở các điểm kiểm tra phiên (tạo nhánh hoặc khôi phục, khi quyền cho phép).
- Control UI ghi nhớ `sessionId` Gateway nền do `chat.history` trả về và đưa nó vào các lệnh gọi `chat.send` tiếp theo, vì vậy việc kết nối lại và làm mới trang tiếp tục cùng cuộc hội thoại đã lưu, trừ khi người dùng bắt đầu hoặc đặt lại một phiên.
- `chat.send` nhận một khóa đảm bảo tính lũy đẳng (Control UI sử dụng mã định danh lượt chạy); Gateway loại bỏ các yêu cầu lặp lại sử dụng lại cùng một khóa, vì vậy các lần gửi lại hoặc gửi trùng đang xử lý cho cùng một phiên/thông báo/tệp đính kèm không tạo ra lượt chạy thứ hai.
- Việc trả lời một thông báo cụ thể (nhấp chuột phải → Reply) sẽ gửi mã định danh bản ghi của mục tiêu dưới dạng `replyToId` trên `chat.send`. Gateway phân giải thông báo đó từ lịch sử phiên và điền cùng siêu dữ liệu ngữ cảnh trả lời không phụ thuộc kênh mà các phản hồi Discord sử dụng: các tác tử thấy `has_reply_context` cùng khối không đáng tin cậy "Mục tiêu trả lời của thông báo hiện tại từ người dùng" với nhãn người gửi và nội dung. (Các prompt WebChat vẫn ẩn các mã định danh cuộc hội thoại dễ thay đổi như `reply_to_id`, theo chính sách prompt ổn định từng byte hiện có dành cho các phiên WebChat trực tiếp.) Các mục tiêu trả lời không có mã định danh bản ghi được lưu bền vững (ví dụ các lần gửi đang chờ) sẽ chuyển sang dùng trích dẫn nội tuyến trong nội dung thông báo.
- Các tệp khởi động không gian làm việc và hướng dẫn `BOOTSTRAP.md` đang chờ được cung cấp qua phần `# Project Context` trong prompt hệ thống của tác tử, thay vì được sao chép vào thông báo người dùng WebChat. Nếu nội dung khởi động bị cắt ngắn, prompt hệ thống sẽ nhận một "Thông báo ngữ cảnh khởi động" ngắn thay thế; số lượng chi tiết và các núm cấu hình vẫn nằm trên các bề mặt chẩn đoán.
- Chuẩn hóa hiển thị trên `chat.history` loại bỏ: ngữ cảnh OpenClaw chỉ dành cho thời gian chạy, các trình bao bọc phong bì đầu vào, thẻ chỉ thị phân phối nội tuyến như `[[reply_to_current]]`, `[[reply_to:<id>]]` và `[[audio_as_voice]]`, tải XML lệnh gọi công cụ dạng văn bản thuần túy (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, bao gồm cả các khối bị cắt ngắn), cùng các token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ. Các mục trợ lý mà toàn bộ văn bản hiển thị chỉ là token im lặng `NO_REPLY` (không phân biệt chữ hoa chữ thường) sẽ bị bỏ qua.
- Tải phản hồi được gắn cờ suy luận (`isReasoning: true`) bị loại khỏi nội dung trợ lý WebChat, văn bản phát lại bản ghi và các khối nội dung âm thanh, do đó tải chỉ chứa quá trình suy nghĩ không xuất hiện dưới dạng thông báo trợ lý hiển thị hoặc âm thanh có thể phát.
- `chat.inject` nối trực tiếp một ghi chú của trợ lý vào bản ghi và phát nó đến giao diện (không chạy tác tử).
- Các lượt chạy bị hủy có thể giữ phần đầu ra trợ lý chưa hoàn chỉnh hiển thị trong giao diện. Gateway lưu bền vững phần văn bản chưa hoàn chỉnh đó vào lịch sử bản ghi khi có đầu ra trong bộ đệm và đánh dấu mục này bằng siêu dữ liệu hủy.

### Mô hình bản ghi và phân phối

WebChat có hai đường dẫn dữ liệu riêng biệt:

- Các hàng bản ghi SQLite là bản ghi mô hình/thời gian chạy bền vững. Đối với các lượt chạy tác tử thông thường, thời gian chạy OpenClaw nhúng lưu bền vững các thông báo `user`, `assistant` và `toolResult` mà mô hình có thể thấy thông qua trình truy cập phiên. WebChat không ghi văn bản phân phối, trạng thái hoặc trợ giúp tùy ý vào bản ghi đó.
- Các sự kiện `ReplyPayload` của Gateway là phép chiếu phân phối trực tiếp: được chuẩn hóa để hiển thị trên WebChat/kênh, phát trực tuyến theo khối, thẻ chỉ thị, nhúng phương tiện, cờ TTS/âm thanh và hành vi dự phòng của giao diện. Bản thân chúng không phải là nhật ký phiên chuẩn tắc.
- Các bộ kiểm thử yêu cầu phản hồi hiển thị thông qua `tools.message` vẫn sử dụng WebChat làm đích nhận phản hồi nguồn nội bộ cho lượt chạy hiện tại. Một `message.send` không có mục tiêu từ lượt chạy WebChat đang hoạt động đó được chiếu vào cùng cuộc chat và phản chiếu sang bản ghi phiên; WebChat không trở thành một kênh gửi đi có thể tái sử dụng và không bao giờ kế thừa `lastChannel`.
- WebChat chỉ chèn các mục bản ghi trợ lý khi Gateway sở hữu một thông báo được hiển thị nằm ngoài lượt tác tử nhúng thông thường: `chat.inject`, phản hồi lệnh không do tác tử tạo, đầu ra chưa hoàn chỉnh bị hủy và phần bổ sung bản ghi phương tiện do WebChat quản lý.
- Nếu văn bản trợ lý trực tiếp xuất hiện trong một lượt chạy nhưng biến mất sau khi tải lại lịch sử, hãy kiểm tra theo thứ tự: bản ghi SQLite có chứa văn bản trợ lý hay không, phép chiếu hiển thị `chat.history` có loại bỏ văn bản đó hay không, sau đó kiểm tra việc hợp nhất phần đuôi lạc quan của Control UI có thay thế trạng thái phân phối cục bộ bằng ảnh chụp nhanh đã lưu bền vững hay không.

Câu trả lời cuối cùng của lượt chạy tác tử thông thường phải được lưu bền vững vì thời gian chạy nhúng ghi `message_end` của trợ lý. Mọi cơ chế dự phòng phản chiếu tải cuối cùng đã phân phối vào bản ghi trước tiên phải tránh sao chép một lượt trợ lý mà thời gian chạy nhúng đã ghi.

## Bảng công cụ tác tử trong Control UI

- Bảng Tools `/agents` của Control UI có chế độ xem "Hiện có ngay lúc này" dựa trên `tools.effective(sessionKey=...)`: một phép chiếu chỉ đọc, do máy chủ tạo ra, về kho công cụ của phiên hiện tại, bao gồm công cụ lõi, Plugin, thuộc sở hữu của kênh và công cụ máy chủ MCP đã được phát hiện.
- Một chế độ xem chỉnh sửa cấu hình riêng biệt (dựa trên `tools.catalog`) bao gồm hồ sơ, ghi đè theo từng tác tử và ngữ nghĩa danh mục.
- Tính khả dụng khi chạy có phạm vi theo phiên. Việc chuyển đổi phiên trên cùng một tác tử có thể thay đổi danh sách "Hiện có ngay lúc này". Nếu các máy chủ MCP đã cấu hình chưa được kết nối hoặc đã thay đổi kể từ lần phát hiện gần nhất, bảng sẽ hiển thị thông báo thay vì âm thầm khởi động các phương thức truyền tải MCP từ đường dẫn đọc.
- Trình chỉnh sửa cấu hình không đồng nghĩa với tính khả dụng khi chạy; quyền truy cập hiệu lực vẫn tuân theo thứ tự ưu tiên chính sách (`allow`/`deny`, các ghi đè theo từng tác tử và nhà cung cấp/kênh).

## Sử dụng từ xa

- Chế độ từ xa tạo đường hầm cho Gateway WebSocket qua SSH/Tailscale.
- Bạn không cần chạy một máy chủ WebChat riêng biệt.

## Tham chiếu cấu hình (WebChat)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

WebChat không có phần cấu hình được lưu bền vững. Gateway sử dụng giới hạn hiển thị `chat.history` tích hợp sẵn; máy khách API có thể gửi `maxChars` cho từng yêu cầu để ghi đè giới hạn này cho một lệnh gọi. Cấu hình `channels.webchat` và `gateway.webchat` cũ đã ngừng sử dụng; chạy `openclaw doctor --fix` để xóa cấu hình đó.

Các tùy chọn toàn cục liên quan:

- `gateway.port`, `gateway.bind`: máy chủ/cổng WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  xác thực WebSocket bằng bí mật dùng chung.
- `gateway.auth.allowTailscale`: thẻ chat Control UI trong trình duyệt có thể sử dụng các tiêu đề danh tính
  Tailscale Serve khi được bật.
- `gateway.auth.mode: "trusted-proxy"`: xác thực proxy ngược cho máy khách trình duyệt nằm sau nguồn proxy **không phải loopback** có nhận biết danh tính (xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: mục tiêu Gateway từ xa.
- `session.*`: lưu trữ phiên và giá trị mặc định của khóa chính.

## Liên quan

- [Control UI](/vi/web/control-ui)
- [Bảng điều khiển](/vi/web/dashboard)
