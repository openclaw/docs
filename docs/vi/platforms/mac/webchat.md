---
read_when:
    - Gỡ lỗi chế độ xem WebChat trên máy Mac hoặc cổng local loopback
summary: Cách ứng dụng Mac nhúng WebChat của Gateway và cách gỡ lỗi ứng dụng này
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T08:05:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Ứng dụng trên thanh menu macOS nhúng giao diện WebChat dưới dạng một chế độ xem SwiftUI gốc. Ứng dụng kết nối với Gateway và mặc định sử dụng phiên chính của tác tử đã chọn (`main`, hoặc `global` khi `session.scope` là `global`).

Cửa sổ trò chuyện đầy đủ là một chế độ xem chia đôi gốc:

- **Thanh bên phiên**: danh sách phiên có thể tìm kiếm, gồm các phần đã ghim và gần đây, chỉ báo chưa đọc và các menu ngữ cảnh để ghim/bỏ ghim, sao chép khóa phiên và xóa. Một nút trên thanh công cụ (hoặc Cmd-N) tạo phiên mới thực sự thông qua `sessions.create`.
- **Thanh công cụ cửa sổ**: vòng hiển thị mức sử dụng ngữ cảnh (token và chi phí phiên, kèm một thao tác thu gọn), bộ chọn mức độ suy luận, bộ chọn mô hình và menu thao tác phiên (phiên mới, làm mới, sao chép khóa phiên, xuất bản chép lời, thu gọn, xóa lịch sử).
- **Bản chép lời và trình soạn thảo**: tin nhắn của trợ lý hiển thị dưới dạng văn bản thuần túy kèm ảnh đại diện, còn tin nhắn của người dùng hiển thị dưới dạng bong bóng có màu nhấn. Nhập `/` sẽ mở tính năng tự động hoàn thành lệnh gạch chéo dựa trên `commands.list`, hỗ trợ điều hướng bằng các phím mũi tên/Tab/Return/Escape. Nhấp chuột phải vào một tin nhắn để sao chép.

Bảng trò chuyện nhanh được neo từ thanh menu vẫn giữ bố cục một cột thu gọn với các bộ chọn nội tuyến.

- **Chế độ cục bộ**: kết nối trực tiếp với WebSocket của Gateway cục bộ.
- **Chế độ từ xa**: chuyển tiếp cổng điều khiển Gateway qua SSH và sử dụng đường hầm đó làm mặt phẳng dữ liệu.

## Khởi chạy và gỡ lỗi

- Thủ công: menu Lobster -> "Open Chat".
- Tự động mở để kiểm thử:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` được chấp nhận làm bí danh cũ.)

- Nhật ký: `./scripts/clawlog.sh` (hệ thống con `ai.openclaw`, danh mục `WebChatSwiftUI`).

## Cách kết nối

- Mặt phẳng dữ liệu: các phương thức WS của Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject` và các sự kiện `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` trả về bản chép lời đã được chuẩn hóa để hiển thị: các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, các tải XML gọi công cụ dạng văn bản thuần túy (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, kể cả các khối bị cắt ngắn) và các token điều khiển mô hình bị rò rỉ đều bị loại bỏ, các hàng trợ lý chỉ chứa token im lặng như chính xác `NO_REPLY`/`no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng phần giữ chỗ đã cắt ngắn.
- Phiên: mặc định sử dụng phiên chính như mô tả ở trên; giao diện có thể chuyển đổi giữa các phiên.
- Quy trình làm quen ban đầu sử dụng một phiên riêng để tách biệt thiết lập lần chạy đầu tiên.
- Bộ nhớ đệm ngoại tuyến: ứng dụng duy trì một bộ nhớ đệm nhỏ chỉ đọc gồm các phiên trò chuyện và bản chép lời gần đây cho từng gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): khi khởi động nguội, ứng dụng hiển thị ngay bản chép lời gần nhất đã biết và làm mới sau khi Gateway phản hồi; các cuộc trò chuyện gần đây vẫn có thể được duyệt khi mất kết nối (tính năng gửi vẫn bị tắt cho đến khi kết nối được khôi phục).

## Phạm vi bảo mật

- Chế độ từ xa chỉ chuyển tiếp cổng điều khiển WebSocket của Gateway qua SSH.

## Các hạn chế đã biết

- Giao diện được tối ưu hóa cho các phiên trò chuyện, không phải hộp cát trình duyệt đầy đủ.

## Liên quan

- [WebChat](/vi/web/webchat)
- [Ứng dụng macOS](/vi/platforms/macos)
