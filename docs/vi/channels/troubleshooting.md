---
read_when:
    - Bộ vận chuyển kênh báo đã kết nối nhưng phản hồi không gửi được
    - Cần kiểm tra theo từng kênh trước khi đi sâu vào tài liệu nhà cung cấp
summary: Khắc phục sự cố nhanh ở cấp kênh với các dấu hiệu lỗi và cách khắc phục theo từng kênh
title: Khắc phục sự cố kênh
x-i18n:
    generated_at: "2026-05-05T08:25:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

Sử dụng trang này khi một kênh kết nối được nhưng hành vi không đúng.

## Thang lệnh

Chạy các lệnh này theo thứ tự trước:

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
- Kiểm tra kênh cho thấy transport đã kết nối và, khi được hỗ trợ, `works` hoặc `audit ok`

## WhatsApp

### Dấu hiệu lỗi WhatsApp

| Triệu chứng                         | Kiểm tra nhanh nhất                                | Cách khắc phục                                                                                                                         |
| ----------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Đã kết nối nhưng không trả lời DM   | `openclaw pairing list whatsapp`                   | Phê duyệt người gửi hoặc đổi chính sách/allowlist DM.                                                                                  |
| Tin nhắn nhóm bị bỏ qua             | Kiểm tra `requireMention` + mẫu nhắc đến trong cấu hình | Nhắc đến bot hoặc nới lỏng chính sách nhắc đến cho nhóm đó.                                                                            |
| Đăng nhập QR hết thời gian với 408  | Kiểm tra env `HTTPS_PROXY` / `HTTP_PROXY` của gateway | Đặt proxy có thể truy cập; chỉ dùng `NO_PROXY` cho các trường hợp bỏ qua.                                                              |
| Ngắt kết nối/vòng lặp đăng nhập lại ngẫu nhiên | `openclaw channels status --probe` + nhật ký        | Các lần kết nối lại gần đây vẫn được đánh dấu ngay cả khi hiện đang kết nối; theo dõi nhật ký, khởi động lại gateway, rồi liên kết lại nếu tình trạng chập chờn tiếp diễn. |
| Phản hồi đến trễ vài giây/phút      | `openclaw doctor --fix`                            | Doctor dừng các client TUI cục bộ cũ đã xác minh khi chúng làm suy giảm vòng lặp sự kiện Gateway.                                      |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố WhatsApp](/vi/channels/whatsapp#troubleshooting)

## Telegram

### Dấu hiệu lỗi Telegram

| Triệu chứng                         | Kiểm tra nhanh nhất                              | Cách khắc phục                                                                                                                   |
| ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `/start` nhưng không có luồng phản hồi dùng được | `openclaw pairing list telegram`                 | Phê duyệt ghép nối hoặc đổi chính sách DM.                                                                                       |
| Bot online nhưng nhóm vẫn im lặng   | Xác minh yêu cầu nhắc đến và chế độ riêng tư của bot | Tắt chế độ riêng tư để nhóm nhìn thấy hoặc nhắc đến bot.                                                                          |
| Gửi thất bại với lỗi mạng           | Kiểm tra nhật ký để tìm lỗi gọi Telegram API     | Sửa định tuyến DNS/IPv6/proxy tới `api.telegram.org`.                                                                             |
| Khởi động báo `getMe returned 401`  | Kiểm tra nguồn token đã cấu hình                 | Sao chép lại hoặc tạo lại token BotFather và cập nhật `botToken`, `tokenFile`, hoặc default-account `TELEGRAM_BOT_TOKEN`.         |
| Polling bị treo hoặc kết nối lại chậm | `openclaw logs --follow` để xem chẩn đoán polling | Nâng cấp; nếu khởi động lại là dương tính giả, điều chỉnh `pollingStallThresholdMs`. Tình trạng treo kéo dài vẫn chỉ ra proxy/DNS/IPv6. |
| `setMyCommands` bị từ chối khi khởi động | Kiểm tra nhật ký để tìm `BOT_COMMANDS_TOO_MUCH`  | Giảm số lệnh Telegram của plugin/skill/tùy chỉnh hoặc tắt menu gốc.                                                              |
| Sau khi nâng cấp, allowlist chặn bạn | `openclaw security audit` và allowlist cấu hình  | Chạy `openclaw doctor --fix` hoặc thay `@username` bằng ID người gửi dạng số.                                                     |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Telegram](/vi/channels/telegram#troubleshooting)

## Discord

### Dấu hiệu lỗi Discord

| Triệu chứng                         | Kiểm tra nhanh nhất                                                   | Cách khắc phục                                                                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online nhưng không trả lời guild | `openclaw channels status --probe`                                    | Cho phép guild/kênh và xác minh message content intent.                                                                                                                   |
| Tin nhắn nhóm bị bỏ qua             | Kiểm tra nhật ký để tìm các lần loại bỏ do cổng nhắc đến              | Nhắc đến bot hoặc đặt `requireMention: false` cho guild/kênh.                                                                                                              |
| Có hoạt động gõ/sử dụng token nhưng không có tin nhắn Discord | Nhật ký phiên hiển thị văn bản trợ lý với `didSendViaMessagingTool: false` | Mô hình đã trả lời riêng thay vì gọi công cụ nhắn tin. Dùng mô hình đáng tin cậy với tool-call, hoặc đặt `messages.groupChat.visibleReplies: "automatic"` để tự động đăng. |
| Thiếu phản hồi DM                   | `openclaw pairing list discord`                                       | Phê duyệt ghép nối DM hoặc điều chỉnh chính sách DM.                                                                                                                       |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Discord](/vi/channels/discord#troubleshooting)

## Slack

### Dấu hiệu lỗi Slack

| Triệu chứng                         | Kiểm tra nhanh nhất                         | Cách khắc phục                                                                                                                                         |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode đã kết nối nhưng không phản hồi | `openclaw channels status --probe`          | Xác minh app token + bot token và các scope bắt buộc; theo dõi `botTokenStatus` / `appTokenStatus = configured_unavailable` trên thiết lập dùng SecretRef. |
| DM bị chặn                          | `openclaw pairing list slack`               | Phê duyệt ghép nối hoặc nới lỏng chính sách DM.                                                                                                        |
| Tin nhắn kênh bị bỏ qua             | Kiểm tra `groupPolicy` và allowlist kênh    | Cho phép kênh hoặc đổi chính sách sang `open`.                                                                                                         |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Slack](/vi/channels/slack#troubleshooting)

## iMessage và BlueBubbles

### Dấu hiệu lỗi iMessage và BlueBubbles

| Triệu chứng                         | Kiểm tra nhanh nhất                                                   | Cách khắc phục                                      |
| ----------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| Không có sự kiện đến                | Xác minh khả năng truy cập webhook/server và quyền ứng dụng           | Sửa URL webhook hoặc trạng thái server BlueBubbles. |
| Có thể gửi nhưng không nhận trên macOS | Kiểm tra quyền riêng tư macOS cho tự động hóa Messages                | Cấp lại quyền TCC và khởi động lại tiến trình kênh. |
| Người gửi DM bị chặn                | `openclaw pairing list imessage` hoặc `openclaw pairing list bluebubbles` | Phê duyệt ghép nối hoặc cập nhật allowlist.         |

Khắc phục sự cố đầy đủ:

- [Khắc phục sự cố iMessage](/vi/channels/imessage#troubleshooting)
- [Khắc phục sự cố BlueBubbles](/vi/channels/bluebubbles#troubleshooting)

## Signal

### Dấu hiệu lỗi Signal

| Triệu chứng                         | Kiểm tra nhanh nhất                      | Cách khắc phục                                           |
| ----------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Daemon truy cập được nhưng bot im lặng | `openclaw channels status --probe`       | Xác minh URL/tài khoản daemon `signal-cli` và chế độ nhận. |
| DM bị chặn                          | `openclaw pairing list signal`           | Phê duyệt người gửi hoặc điều chỉnh chính sách DM.        |
| Phản hồi nhóm không kích hoạt       | Kiểm tra allowlist nhóm và mẫu nhắc đến  | Thêm người gửi/nhóm hoặc nới lỏng cổng kiểm soát.         |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Signal](/vi/channels/signal#troubleshooting)

## QQ Bot

### Dấu hiệu lỗi QQ Bot

| Triệu chứng                         | Kiểm tra nhanh nhất                         | Cách khắc phục                                                   |
| ----------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| Bot trả lời "gone to Mars"          | Xác minh `appId` và `clientSecret` trong cấu hình | Đặt thông tin xác thực hoặc khởi động lại gateway.                |
| Không có tin nhắn đến               | `openclaw channels status --probe`          | Xác minh thông tin xác thực trên QQ Open Platform.                |
| Giọng nói không được phiên âm       | Kiểm tra cấu hình nhà cung cấp STT          | Cấu hình `channels.qqbot.stt` hoặc `tools.media.audio`.           |
| Tin nhắn chủ động không đến         | Kiểm tra yêu cầu tương tác của nền tảng QQ  | QQ có thể chặn tin nhắn do bot khởi tạo nếu không có tương tác gần đây. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố QQ Bot](/vi/channels/qqbot#troubleshooting)

## Matrix

### Dấu hiệu lỗi Matrix

| Triệu chứng                         | Kiểm tra nhanh nhất                       | Cách khắc phục                                                              |
| ----------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| Đã đăng nhập nhưng bỏ qua tin nhắn phòng | `openclaw channels status --probe`        | Kiểm tra `groupPolicy`, allowlist phòng và cổng nhắc đến.                    |
| DM không được xử lý                 | `openclaw pairing list matrix`            | Phê duyệt người gửi hoặc điều chỉnh chính sách DM.                           |
| Phòng mã hóa bị lỗi                 | `openclaw matrix verify status`           | Xác minh lại thiết bị, rồi kiểm tra `openclaw matrix verify backup status`.   |
| Khôi phục bản sao lưu đang chờ/bị lỗi | `openclaw matrix verify backup status`    | Chạy `openclaw matrix verify backup restore` hoặc chạy lại với khóa khôi phục. |
| Cross-signing/bootstrap trông sai   | `openclaw matrix verify bootstrap`        | Sửa secret storage, cross-signing và trạng thái sao lưu trong một lượt.       |

Thiết lập và cấu hình đầy đủ: [Matrix](/vi/channels/matrix)

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
