---
read_when:
    - Lớp truyền tải của kênh báo đã kết nối nhưng phản hồi thất bại
    - Bạn cần kiểm tra riêng theo từng kênh trước khi đi sâu vào tài liệu về nhà cung cấp
summary: Khắc phục sự cố nhanh ở cấp kênh với các dấu hiệu lỗi và cách sửa theo từng kênh
title: Khắc phục sự cố kênh
x-i18n:
    generated_at: "2026-05-10T19:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

Dùng trang này khi một kênh kết nối được nhưng hành vi không đúng.

## Bậc thang lệnh

Trước tiên, hãy chạy các lệnh này theo thứ tự:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Đường cơ sở khỏe mạnh:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, hoặc `admin-capable`
- Kiểm tra kênh cho thấy transport đã kết nối và, nơi được hỗ trợ, `works` hoặc `audit ok`

## WhatsApp

### Dấu hiệu lỗi WhatsApp

| Triệu chứng                         | Kiểm tra nhanh nhất                                  | Cách khắc phục                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Đã kết nối nhưng không có trả lời tin nhắn trực tiếp | `openclaw pairing list whatsapp`                     | Phê duyệt người gửi hoặc chuyển chính sách/danh sách cho phép tin nhắn trực tiếp.                                                  |
| Tin nhắn nhóm bị bỏ qua             | Kiểm tra `requireMention` + các mẫu nhắc đến trong cấu hình | Nhắc đến bot hoặc nới lỏng chính sách nhắc đến cho nhóm đó.                                                                        |
| Đăng nhập QR hết thời gian chờ với 408 | Kiểm tra biến môi trường `HTTPS_PROXY` / `HTTP_PROXY` của Gateway | Đặt proxy có thể truy cập; chỉ dùng `NO_PROXY` cho các trường hợp bỏ qua.                                                          |
| Vòng lặp ngắt kết nối/đăng nhập lại ngẫu nhiên | `openclaw channels status --probe` + nhật ký          | Các lần kết nối lại gần đây vẫn bị đánh dấu ngay cả khi hiện đang kết nối; theo dõi nhật ký, khởi động lại Gateway, rồi liên kết lại nếu tình trạng chập chờn tiếp diễn. |
| Trả lời đến muộn vài giây/phút      | `openclaw doctor --fix`                              | Doctor dừng các máy khách TUI cục bộ lỗi thời đã được xác minh khi chúng làm suy giảm vòng lặp sự kiện Gateway.                    |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố WhatsApp](/vi/channels/whatsapp#troubleshooting)

## Telegram

### Dấu hiệu lỗi Telegram

| Triệu chứng                         | Kiểm tra nhanh nhất                                  | Cách khắc phục                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/start` nhưng không có luồng trả lời dùng được | `openclaw pairing list telegram`                     | Phê duyệt ghép nối hoặc thay đổi chính sách tin nhắn trực tiếp.                                                                  |
| Bot trực tuyến nhưng nhóm vẫn im lặng | Xác minh yêu cầu nhắc đến và chế độ quyền riêng tư của bot | Tắt chế độ quyền riêng tư để nhóm có thể hiển thị, hoặc nhắc đến bot.                                                            |
| Gửi thất bại do lỗi mạng            | Kiểm tra nhật ký để tìm lỗi gọi API Telegram          | Sửa định tuyến DNS/IPv6/proxy tới `api.telegram.org`.                                                                            |
| Khởi động báo cáo `getMe returned 401` | Kiểm tra nguồn token đã cấu hình                     | Sao chép lại hoặc tạo lại token BotFather và cập nhật `botToken`, `tokenFile`, hoặc `TELEGRAM_BOT_TOKEN` của tài khoản mặc định. |
| Polling bị treo hoặc kết nối lại chậm | `openclaw logs --follow` để xem chẩn đoán polling    | Nâng cấp; nếu khởi động lại là báo động giả, tinh chỉnh `pollingStallThresholdMs`. Tình trạng treo kéo dài vẫn chỉ ra proxy/DNS/IPv6. |
| `setMyCommands` bị từ chối khi khởi động | Kiểm tra nhật ký để tìm `BOT_COMMANDS_TOO_MUCH`       | Giảm số lệnh Telegram của Plugin/Skills/tùy chỉnh hoặc tắt menu gốc.                                                            |
| Đã nâng cấp và danh sách cho phép chặn bạn | `openclaw security audit` và danh sách cho phép trong cấu hình | Chạy `openclaw doctor --fix` hoặc thay `@username` bằng ID người gửi dạng số.                                                     |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Telegram](/vi/channels/telegram#troubleshooting)

## Discord

### Dấu hiệu lỗi Discord

| Triệu chứng                         | Kiểm tra nhanh nhất                                  | Cách khắc phục                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot trực tuyến nhưng không trả lời trong máy chủ | `openclaw channels status --probe`                  | Cho phép máy chủ/kênh và xác minh intent nội dung tin nhắn.                                                                                                             |
| Tin nhắn nhóm bị bỏ qua             | Kiểm tra nhật ký để tìm các lần bỏ qua do cổng nhắc đến | Nhắc đến bot hoặc đặt `requireMention: false` cho máy chủ/kênh.                                                                                                         |
| Có trạng thái đang gõ/sử dụng token nhưng không có tin nhắn Discord | Nhật ký phiên hiển thị văn bản trợ lý với `didSendViaMessagingTool: false` | Mô hình đã trả lời riêng tư thay vì gọi công cụ nhắn tin. Dùng mô hình đáng tin cậy với lệnh gọi công cụ, hoặc đặt `messages.groupChat.visibleReplies: "automatic"` để tự động đăng. |
| Thiếu trả lời tin nhắn trực tiếp    | `openclaw pairing list discord`                      | Phê duyệt ghép nối tin nhắn trực tiếp hoặc điều chỉnh chính sách tin nhắn trực tiếp.                                                                                    |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Discord](/vi/channels/discord#troubleshooting)

## Slack

### Dấu hiệu lỗi Slack

| Triệu chứng                         | Kiểm tra nhanh nhất                                  | Cách khắc phục                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chế độ socket đã kết nối nhưng không có phản hồi | `openclaw channels status --probe`                   | Xác minh app token + bot token và các scope bắt buộc; theo dõi `botTokenStatus` / `appTokenStatus = configured_unavailable` trên các thiết lập dựa trên SecretRef. |
| Tin nhắn trực tiếp bị chặn          | `openclaw pairing list slack`                        | Phê duyệt ghép nối hoặc nới lỏng chính sách tin nhắn trực tiếp.                                                                                        |
| Tin nhắn kênh bị bỏ qua             | Kiểm tra `groupPolicy` và danh sách cho phép kênh    | Cho phép kênh hoặc chuyển chính sách sang `open`.                                                                                                      |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Slack](/vi/channels/slack#troubleshooting)

## iMessage

### Dấu hiệu lỗi iMessage

| Triệu chứng                         | Kiểm tra nhanh nhất                                  | Cách khắc phục                                                        |
| ----------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| Thiếu `imsg` hoặc lỗi trên hệ không phải macOS | `openclaw channels status --probe --channel imessage` | Chạy OpenClaw trên máy Mac Messages hoặc dùng trình bọc SSH cho `cliPath`. |
| Có thể gửi nhưng không nhận trên macOS | Kiểm tra quyền riêng tư macOS cho tự động hóa Messages | Cấp lại quyền TCC và khởi động lại tiến trình kênh.                   |
| Người gửi tin nhắn trực tiếp bị chặn | `openclaw pairing list imessage`                     | Phê duyệt ghép nối hoặc cập nhật danh sách cho phép.                  |

Khắc phục sự cố đầy đủ:

- [Khắc phục sự cố iMessage](/vi/channels/imessage#troubleshooting)

## Signal

### Dấu hiệu lỗi Signal

| Triệu chứng                         | Kiểm tra nhanh nhất                                  | Cách khắc phục                                             |
| ----------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Daemon có thể truy cập nhưng bot im lặng | `openclaw channels status --probe`                   | Xác minh URL/tài khoản daemon `signal-cli` và chế độ nhận. |
| Tin nhắn trực tiếp bị chặn          | `openclaw pairing list signal`                       | Phê duyệt người gửi hoặc điều chỉnh chính sách tin nhắn trực tiếp. |
| Trả lời nhóm không kích hoạt        | Kiểm tra danh sách cho phép nhóm và các mẫu nhắc đến | Thêm người gửi/nhóm hoặc nới lỏng cơ chế kiểm soát.        |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Signal](/vi/channels/signal#troubleshooting)

## QQ Bot

### Dấu hiệu lỗi QQ Bot

| Triệu chứng                         | Kiểm tra nhanh nhất                                  | Cách khắc phục                                                   |
| ----------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| Bot trả lời "đã lên Sao Hỏa"        | Xác minh `appId` và `clientSecret` trong cấu hình    | Đặt thông tin xác thực hoặc khởi động lại Gateway.               |
| Không có tin nhắn đến               | `openclaw channels status --probe`                   | Xác minh thông tin xác thực trên QQ Open Platform.               |
| Giọng nói không được phiên âm       | Kiểm tra cấu hình nhà cung cấp STT                   | Cấu hình `channels.qqbot.stt` hoặc `tools.media.audio`.          |
| Tin nhắn chủ động không đến         | Kiểm tra yêu cầu tương tác của nền tảng QQ           | QQ có thể chặn tin nhắn do bot khởi tạo nếu không có tương tác gần đây. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố QQ Bot](/vi/channels/qqbot#troubleshooting)

## Matrix

### Dấu hiệu lỗi Matrix

| Triệu chứng                         | Kiểm tra nhanh nhất                                  | Cách khắc phục                                                              |
| ----------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Đã đăng nhập nhưng bỏ qua tin nhắn phòng | `openclaw channels status --probe`                   | Kiểm tra `groupPolicy`, danh sách cho phép phòng và cơ chế kiểm soát nhắc đến. |
| Tin nhắn trực tiếp không được xử lý | `openclaw pairing list matrix`                       | Phê duyệt người gửi hoặc điều chỉnh chính sách tin nhắn trực tiếp.          |
| Phòng mã hóa bị lỗi                 | `openclaw matrix verify status`                      | Xác minh lại thiết bị, rồi kiểm tra `openclaw matrix verify backup status`. |
| Khôi phục sao lưu đang chờ/bị hỏng  | `openclaw matrix verify backup status`               | Chạy `openclaw matrix verify backup restore` hoặc chạy lại với khóa khôi phục. |
| Cross-signing/bootstrap trông không đúng | `openclaw matrix verify bootstrap`                   | Sửa lưu trữ bí mật, cross-signing và trạng thái sao lưu trong một lượt.     |

Thiết lập và cấu hình đầy đủ: [Matrix](/vi/channels/matrix)

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
