---
read_when:
    - Kênh truyền tải báo đã kết nối nhưng phản hồi không thành công
    - Bạn cần kiểm tra riêng theo kênh trước khi đi sâu vào tài liệu về nhà cung cấp
summary: Khắc phục sự cố nhanh ở cấp kênh với các dấu hiệu lỗi và cách khắc phục theo từng kênh
title: Khắc phục sự cố kênh
x-i18n:
    generated_at: "2026-04-29T22:28:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

Sử dụng trang này khi một kênh kết nối được nhưng hoạt động không đúng.

## Trình tự lệnh

Trước tiên, chạy các lệnh này theo thứ tự:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Mốc tham chiếu khỏe mạnh:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, hoặc `admin-capable`
- Probe kênh cho thấy transport đã kết nối và, nơi được hỗ trợ, `works` hoặc `audit ok`

## WhatsApp

### Chữ ký lỗi WhatsApp

| Triệu chứng                      | Kiểm tra nhanh nhất                                | Cách khắc phục                                                                                                                   |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Đã kết nối nhưng không trả lời DM | `openclaw pairing list whatsapp`                   | Phê duyệt người gửi hoặc chuyển chính sách/allowlist DM.                                                                         |
| Tin nhắn nhóm bị bỏ qua          | Kiểm tra `requireMention` + mẫu mention trong cấu hình | Mention bot hoặc nới lỏng chính sách mention cho nhóm đó.                                                                        |
| Đăng nhập QR hết thời gian chờ với 408 | Kiểm tra env `HTTPS_PROXY` / `HTTP_PROXY` của Gateway | Đặt proxy có thể truy cập; chỉ dùng `NO_PROXY` cho các trường hợp bỏ qua.                                                        |
| Vòng lặp ngắt kết nối/đăng nhập lại ngẫu nhiên | `openclaw channels status --probe` + nhật ký | Các lần kết nối lại gần đây được đánh dấu ngay cả khi hiện đang kết nối; theo dõi nhật ký, khởi động lại Gateway, rồi liên kết lại nếu tình trạng chập chờn tiếp diễn. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố WhatsApp](/vi/channels/whatsapp#troubleshooting)

## Telegram

### Chữ ký lỗi Telegram

| Triệu chứng                          | Kiểm tra nhanh nhất                              | Cách khắc phục                                                                                                             |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` nhưng không có luồng trả lời dùng được | `openclaw pairing list telegram`                 | Phê duyệt ghép nối hoặc thay đổi chính sách DM.                                                                            |
| Bot online nhưng nhóm vẫn im lặng    | Xác minh yêu cầu mention và chế độ riêng tư của bot | Tắt chế độ riêng tư để nhóm có thể nhìn thấy hoặc mention bot.                                                             |
| Gửi thất bại kèm lỗi mạng            | Kiểm tra nhật ký để tìm lỗi gọi API Telegram      | Sửa định tuyến DNS/IPv6/proxy tới `api.telegram.org`.                                                                      |
| Khởi động báo cáo `getMe returned 401` | Kiểm tra nguồn token đã cấu hình                 | Sao chép lại hoặc tạo lại token BotFather và cập nhật `botToken`, `tokenFile`, hoặc `TELEGRAM_BOT_TOKEN` của tài khoản mặc định. |
| Polling bị treo hoặc kết nối lại chậm | `openclaw logs --follow` để xem chẩn đoán polling | Nâng cấp; nếu các lần khởi động lại là dương tính giả, tinh chỉnh `pollingStallThresholdMs`. Treo dai dẳng vẫn trỏ tới proxy/DNS/IPv6. |
| `setMyCommands` bị từ chối khi khởi động | Kiểm tra nhật ký để tìm `BOT_COMMANDS_TOO_MUCH`  | Giảm số lệnh Plugin/skill/tùy chỉnh Telegram hoặc tắt menu gốc.                                                            |
| Đã nâng cấp và allowlist chặn bạn    | `openclaw security audit` và allowlist cấu hình  | Chạy `openclaw doctor --fix` hoặc thay `@username` bằng ID người gửi dạng số.                                               |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Telegram](/vi/channels/telegram#troubleshooting)

## Discord

### Chữ ký lỗi Discord

| Triệu chứng                    | Kiểm tra nhanh nhất                  | Cách khắc phục                                             |
| ------------------------------ | ------------------------------------ | ---------------------------------------------------------- |
| Bot online nhưng không trả lời guild | `openclaw channels status --probe`  | Cho phép guild/kênh và xác minh message content intent.    |
| Tin nhắn nhóm bị bỏ qua        | Kiểm tra nhật ký để tìm các lần chặn do mention gating | Mention bot hoặc đặt `requireMention: false` cho guild/kênh. |
| Thiếu trả lời DM               | `openclaw pairing list discord`      | Phê duyệt ghép nối DM hoặc điều chỉnh chính sách DM.       |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Discord](/vi/channels/discord#troubleshooting)

## Slack

### Chữ ký lỗi Slack

| Triệu chứng                             | Kiểm tra nhanh nhất                         | Cách khắc phục                                                                                                                                        |
| --------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode đã kết nối nhưng không có phản hồi | `openclaw channels status --probe`          | Xác minh app token + bot token và các scope bắt buộc; theo dõi `botTokenStatus` / `appTokenStatus = configured_unavailable` trên thiết lập dựa trên SecretRef. |
| DM bị chặn                              | `openclaw pairing list slack`               | Phê duyệt ghép nối hoặc nới lỏng chính sách DM.                                                                                                      |
| Tin nhắn kênh bị bỏ qua                 | Kiểm tra `groupPolicy` và allowlist kênh    | Cho phép kênh hoặc chuyển chính sách sang `open`.                                                                                                    |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Slack](/vi/channels/slack#troubleshooting)

## iMessage và BlueBubbles

### Chữ ký lỗi iMessage và BlueBubbles

| Triệu chứng                      | Kiểm tra nhanh nhất                                                   | Cách khắc phục                                      |
| -------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| Không có sự kiện đến             | Xác minh khả năng truy cập webhook/server và quyền của ứng dụng       | Sửa URL webhook hoặc trạng thái server BlueBubbles. |
| Có thể gửi nhưng không nhận trên macOS | Kiểm tra quyền riêng tư macOS cho tự động hóa Messages                | Cấp lại quyền TCC và khởi động lại tiến trình kênh. |
| Người gửi DM bị chặn             | `openclaw pairing list imessage` hoặc `openclaw pairing list bluebubbles` | Phê duyệt ghép nối hoặc cập nhật allowlist.         |

Khắc phục sự cố đầy đủ:

- [Khắc phục sự cố iMessage](/vi/channels/imessage#troubleshooting)
- [Khắc phục sự cố BlueBubbles](/vi/channels/bluebubbles#troubleshooting)

## Signal

### Chữ ký lỗi Signal

| Triệu chứng                    | Kiểm tra nhanh nhất                    | Cách khắc phục                                           |
| ------------------------------ | -------------------------------------- | -------------------------------------------------------- |
| Daemon truy cập được nhưng bot im lặng | `openclaw channels status --probe`     | Xác minh URL/tài khoản daemon `signal-cli` và chế độ nhận. |
| DM bị chặn                     | `openclaw pairing list signal`         | Phê duyệt người gửi hoặc điều chỉnh chính sách DM.       |
| Trả lời nhóm không kích hoạt   | Kiểm tra allowlist nhóm và mẫu mention | Thêm người gửi/nhóm hoặc nới lỏng gating.                |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Signal](/vi/channels/signal#troubleshooting)

## QQ Bot

### Chữ ký lỗi QQ Bot

| Triệu chứng                        | Kiểm tra nhanh nhất                         | Cách khắc phục                                                       |
| ---------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| Bot trả lời "đã bay tới sao Hỏa"   | Xác minh `appId` và `clientSecret` trong cấu hình | Đặt thông tin xác thực hoặc khởi động lại Gateway.                   |
| Không có tin nhắn đến              | `openclaw channels status --probe`          | Xác minh thông tin xác thực trên QQ Open Platform.                   |
| Giọng nói không được phiên âm      | Kiểm tra cấu hình nhà cung cấp STT          | Cấu hình `channels.qqbot.stt` hoặc `tools.media.audio`.              |
| Tin nhắn chủ động không đến        | Kiểm tra yêu cầu tương tác của nền tảng QQ   | QQ có thể chặn tin nhắn do bot khởi tạo nếu không có tương tác gần đây. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố QQ Bot](/vi/channels/qqbot#troubleshooting)

## Matrix

### Chữ ký lỗi Matrix

| Triệu chứng                          | Kiểm tra nhanh nhất                        | Cách khắc phục                                                               |
| ------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------- |
| Đã đăng nhập nhưng bỏ qua tin nhắn phòng | `openclaw channels status --probe`         | Kiểm tra `groupPolicy`, allowlist phòng và mention gating.                    |
| DM không được xử lý                  | `openclaw pairing list matrix`             | Phê duyệt người gửi hoặc điều chỉnh chính sách DM.                            |
| Phòng mã hóa bị lỗi                  | `openclaw matrix verify status`            | Xác minh lại thiết bị, rồi kiểm tra `openclaw matrix verify backup status`.   |
| Khôi phục bản sao lưu đang chờ/bị hỏng | `openclaw matrix verify backup status`     | Chạy `openclaw matrix verify backup restore` hoặc chạy lại với khóa khôi phục. |
| Cross-signing/bootstrap trông không đúng | `openclaw matrix verify bootstrap`         | Sửa secret storage, cross-signing và trạng thái sao lưu trong một lượt.       |

Thiết lập và cấu hình đầy đủ: [Matrix](/vi/channels/matrix)

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
