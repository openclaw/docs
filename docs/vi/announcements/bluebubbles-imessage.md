---
read_when:
    - Bạn đã dùng kênh BlueBubbles cũ và cần chuyển sang iMessage
    - Bạn đang chọn thiết lập iMessage được OpenClaw hỗ trợ
    - Bạn cần một lời giải thích ngắn gọn về việc loại bỏ BlueBubbles
summary: Hỗ trợ BlueBubbles đã bị loại bỏ khỏi OpenClaw. Hãy sử dụng plugin iMessage đi kèm với imsg cho các thiết lập iMessage mới và được di chuyển.
title: Loại bỏ BlueBubbles và lộ trình iMessage qua imsg
x-i18n:
    generated_at: "2026-07-12T07:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Loại bỏ BlueBubbles và lộ trình iMessage qua imsg

OpenClaw không còn cung cấp kênh BlueBubbles. Khả năng hỗ trợ iMessage hoạt động thông qua plugin `imessage` đi kèm: Gateway khởi chạy [`imsg`](https://github.com/steipete/imsg) dưới dạng tiến trình con, cục bộ hoặc thông qua trình bao bọc SSH, rồi giao tiếp bằng JSON-RPC qua stdin/stdout. Không máy chủ, không webhook, không cổng.

Nếu cấu hình của bạn vẫn chứa `channels.bluebubbles`, hãy di chuyển sang `channels.imessage`. URL tài liệu cũ `/channels/bluebubbles` chuyển hướng đến [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles), trong đó có đầy đủ bảng chuyển đổi cấu hình và danh sách kiểm tra chuyển đổi.

## Những thay đổi

- Lộ trình iMessage được hỗ trợ không có máy chủ HTTP BlueBubbles, tuyến webhook, mật khẩu REST hoặc môi trường chạy plugin BlueBubbles.
- OpenClaw đọc và theo dõi Tin nhắn thông qua `imsg` trên máy Mac đã đăng nhập vào Messages.app.
- Các chức năng gửi, nhận, lịch sử và nội dung đa phương tiện cơ bản sử dụng các giao diện `imsg` thông thường và quyền của macOS.
- Các thao tác nâng cao (trả lời theo luồng, phản ứng tapback, chỉnh sửa, thu hồi, hiệu ứng, thông báo đã đọc, chỉ báo đang nhập, quản lý nhóm) cần cầu nối API riêng tư: chạy `imsg launch`, thao tác này yêu cầu tắt SIP.
- Gateway trên Linux và Windows vẫn có thể sử dụng iMessage bằng cách trỏ `channels.imessage.cliPath` đến trình bao bọc SSH chạy `imsg` trên máy Mac đã đăng nhập.

## Việc cần làm

1. Cài đặt và xác minh `imsg` trên máy Mac chạy Tin nhắn:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Cấp quyền Truy cập toàn bộ ổ đĩa và Tự động hóa cho ngữ cảnh tiến trình chạy `imsg` và OpenClaw.

3. Chuyển đổi cấu hình cũ:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Khởi động lại Gateway và xác minh:

   ```bash
   openclaw channels status --probe
   ```

5. Kiểm tra tin nhắn trực tiếp, nhóm, tệp đính kèm và mọi thao tác API riêng tư mà bạn phụ thuộc vào trước khi xóa máy chủ BlueBubbles cũ.

## Ghi chú di chuyển

- `channels.bluebubbles.serverUrl` và `channels.bluebubbles.password` không có mục tương đương trong iMessage; không có máy chủ nào để kết nối hoặc xác thực.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` và `actions.*` giữ nguyên ý nghĩa trong `channels.imessage`.
- `channels.imessage.includeAttachments` vẫn bị tắt theo mặc định. Hãy đặt giá trị này một cách rõ ràng nếu bạn muốn ảnh, bản ghi âm, video hoặc tệp nhận được chuyển đến tác nhân.
- Với `groupPolicy: "allowlist"`, hãy sao chép khối `groups` cũ, bao gồm mọi mục ký tự đại diện `"*"`. Danh sách cho phép người gửi trong nhóm và sổ đăng ký nhóm là hai cổng kiểm soát riêng biệt; khối `groups` có các mục nhưng không có `chat_id` khớp (hoặc không có `"*"`) sẽ loại bỏ tin nhắn trong thời gian chạy, còn khối `groups` trống sẽ ghi cảnh báo khi khởi động mặc dù bộ lọc người gửi vẫn cho phép tin nhắn đi qua.
- Các liên kết ACP có `match.channel: "bluebubbles"` phải được đổi thành `"imessage"`.
- Khóa phiên BlueBubbles cũ không trở thành khóa phiên iMessage. Phê duyệt ghép nối dựa trên định danh người gửi, vì vậy các mục `allowFrom` đã sao chép vẫn hoạt động, nhưng lịch sử hội thoại dưới các khóa phiên BlueBubbles không được chuyển sang.

## Xem thêm

- [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles)
- [iMessage](/vi/channels/imessage)
- [Tham chiếu cấu hình - iMessage](/vi/gateway/config-channels#imessage)
