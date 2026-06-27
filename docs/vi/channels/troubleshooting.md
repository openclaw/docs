---
read_when:
    - Kênh truyền tải báo đã kết nối nhưng trả lời không thành công
    - Bạn cần các bước kiểm tra dành riêng cho kênh trước khi đi sâu vào tài liệu nhà cung cấp
summary: Khắc phục sự cố nhanh ở cấp kênh với dấu hiệu lỗi và cách khắc phục theo từng kênh
title: Khắc phục sự cố kênh
x-i18n:
    generated_at: "2026-06-27T17:12:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
    source_path: channels/troubleshooting.md
    workflow: 16
---

Dùng trang này khi một kênh kết nối được nhưng hành vi không đúng.

## Bậc thang lệnh

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

## Sau khi cập nhật

Dùng mục này khi Telegram, iMessage, cấu hình thời BlueBubbles, hoặc một kênh Plugin khác biến mất sau khi cập nhật.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Tìm `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix` trong `openclaw status --all`. Điều đó nghĩa là kênh đã được cấu hình, nhưng đường dẫn thiết lập/tải Plugin gặp cây phụ thuộc bị hỏng thay vì đăng ký kênh. `openclaw doctor --fix` xóa các thư mục dàn dựng phụ thuộc Plugin cũ và các bóng xác thực cũ, sau đó `openclaw gateway restart` tải lại trạng thái sạch.

## WhatsApp

### Dấu hiệu lỗi WhatsApp

| Triệu chứng                         | Kiểm tra nhanh nhất                                 | Cách khắc phục                                                                                                                   |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Đã kết nối nhưng không có phản hồi DM | `openclaw pairing list whatsapp`                    | Phê duyệt người gửi hoặc chuyển chính sách/danh sách cho phép DM.                                                                |
| Tin nhắn nhóm bị bỏ qua             | Kiểm tra `requireMention` + mẫu nhắc đến trong cấu hình | Nhắc đến bot hoặc nới lỏng chính sách nhắc đến cho nhóm đó.                                                                      |
| Đăng nhập QR hết thời gian với 408  | Kiểm tra env `HTTPS_PROXY` / `HTTP_PROXY` của gateway | Đặt proxy có thể truy cập; chỉ dùng `NO_PROXY` cho các trường hợp bỏ qua.                                                        |
| Vòng lặp ngắt kết nối/đăng nhập lại ngẫu nhiên | `openclaw channels status --probe` + nhật ký       | Các lần kết nối lại gần đây vẫn được gắn cờ ngay cả khi hiện đang kết nối; theo dõi nhật ký, khởi động lại gateway, rồi liên kết lại nếu vẫn chập chờn. |
| Vòng lặp `status=408 Request Time-out` | Kiểm tra, nhật ký, doctor, rồi trạng thái gateway   | Sửa kết nối/thời điểm của máy chủ trước; sao lưu xác thực và liên kết lại tài khoản nếu vòng lặp vẫn tiếp diễn.                  |
| Phản hồi đến trễ vài giây/phút      | `openclaw doctor --fix`                             | Doctor dừng các client TUI cục bộ cũ đã xác minh khi chúng làm suy giảm vòng lặp sự kiện Gateway.                               |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố WhatsApp](/vi/channels/whatsapp#troubleshooting)

## Telegram

### Dấu hiệu lỗi Telegram

| Triệu chứng                         | Kiểm tra nhanh nhất                              | Cách khắc phục                                                                                                            |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` nhưng không có luồng phản hồi dùng được | `openclaw pairing list telegram`                 | Phê duyệt ghép đôi hoặc thay đổi chính sách DM.                                                                            |
| Bot trực tuyến nhưng nhóm vẫn im lặng | Xác minh yêu cầu nhắc đến và chế độ riêng tư của bot | Tắt chế độ riêng tư để nhóm nhìn thấy hoặc nhắc đến bot.                                                                   |
| Gửi thất bại với lỗi mạng           | Kiểm tra nhật ký để tìm lỗi gọi API Telegram     | Sửa định tuyến DNS/IPv6/proxy tới `api.telegram.org`.                                                                      |
| Khởi động báo `getMe returned 401`  | Kiểm tra nguồn token đã cấu hình                 | Sao chép lại hoặc tạo lại token BotFather và cập nhật `botToken`, `tokenFile`, hoặc tài khoản mặc định `TELEGRAM_BOT_TOKEN`. |
| Polling bị kẹt hoặc kết nối lại chậm | `openclaw logs --follow` để xem chẩn đoán polling | Nâng cấp; nếu khởi động lại là dương tính giả, tinh chỉnh `pollingStallThresholdMs`. Kẹt kéo dài vẫn chỉ tới proxy/DNS/IPv6. |
| `setMyCommands` bị từ chối lúc khởi động | Kiểm tra nhật ký để tìm `BOT_COMMANDS_TOO_MUCH`  | Giảm lệnh Telegram của Plugin/skill/tùy chỉnh hoặc tắt menu gốc.                                                           |
| Đã nâng cấp và danh sách cho phép chặn bạn | `openclaw security audit` và danh sách cho phép trong cấu hình | Chạy `openclaw doctor --fix` hoặc thay `@username` bằng ID người gửi dạng số.                                               |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Telegram](/vi/channels/telegram#troubleshooting)

## Discord

### Dấu hiệu lỗi Discord

| Triệu chứng                         | Kiểm tra nhanh nhất                                                                                                           | Cách khắc phục                                                                                                                                                                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot trực tuyến nhưng không phản hồi trong guild | `openclaw channels status --probe`                                                                                            | Cho phép guild/kênh và xác minh intent nội dung tin nhắn.                                                                                                                                                                                                             |
| Tin nhắn nhóm bị bỏ qua             | Kiểm tra nhật ký để tìm các lần loại bỏ do cổng nhắc đến                                                                       | Nhắc đến bot hoặc đặt `requireMention: false` cho guild/kênh.                                                                                                                                                                                                         |
| Có chỉ báo đang nhập/sử dụng token nhưng không có tin nhắn Discord | Kiểm tra đây là sự kiện phòng nền hay phòng `message_tool` đã chọn tham gia nơi mô hình bỏ lỡ `message(action=send)` | Kiểm tra nhật ký chi tiết của gateway để tìm siêu dữ liệu payload cuối bị chặn, xác minh `messages.groupChat.unmentionedInbound`, đọc [Sự kiện phòng nền](/vi/channels/ambient-room-events), hoặc giữ `messages.groupChat.visibleReplies: "automatic"` cho yêu cầu nhóm thông thường. |
| Thiếu phản hồi DM                   | `openclaw pairing list discord`                                                                                               | Phê duyệt ghép đôi DM hoặc điều chỉnh chính sách DM.                                                                                                                                                                                                                  |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Discord](/vi/channels/discord#troubleshooting)

## Slack

### Dấu hiệu lỗi Slack

| Triệu chứng                         | Kiểm tra nhanh nhất                          | Cách khắc phục                                                                                                                                       |
| ----------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chế độ socket đã kết nối nhưng không có phản hồi | `openclaw channels status --probe`           | Xác minh app token + bot token và các phạm vi bắt buộc; theo dõi `botTokenStatus` / `appTokenStatus = configured_unavailable` trên các thiết lập dựa trên SecretRef. |
| DM bị chặn                          | `openclaw pairing list slack`                | Phê duyệt ghép đôi hoặc nới lỏng chính sách DM.                                                                                                      |
| Tin nhắn kênh bị bỏ qua             | Kiểm tra `groupPolicy` và danh sách cho phép kênh | Cho phép kênh hoặc chuyển chính sách sang `open`.                                                                                                    |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Slack](/vi/channels/slack#troubleshooting)

## iMessage

### Dấu hiệu lỗi iMessage

| Triệu chứng                         | Kiểm tra nhanh nhất                                      | Cách khắc phục                                                               |
| ----------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Thiếu `imsg` hoặc lỗi trên không phải macOS | `openclaw channels status --probe --channel imessage`    | Chạy OpenClaw trên máy Mac Messages hoặc dùng wrapper SSH cho `cliPath`.    |
| Có thể gửi nhưng không nhận trên macOS | Kiểm tra quyền riêng tư macOS cho tự động hóa Messages   | Cấp lại quyền TCC và khởi động lại tiến trình kênh.                         |
| Người gửi DM bị chặn                | `openclaw pairing list imessage`                         | Phê duyệt ghép đôi hoặc cập nhật danh sách cho phép.                        |

Khắc phục sự cố đầy đủ:

- [Khắc phục sự cố iMessage](/vi/channels/imessage#troubleshooting)

## Signal

### Dấu hiệu lỗi Signal

| Triệu chứng                         | Kiểm tra nhanh nhất                         | Cách khắc phục                                           |
| ----------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Daemon truy cập được nhưng bot im lặng | `openclaw channels status --probe`          | Xác minh URL/tài khoản daemon `signal-cli` và chế độ nhận. |
| DM bị chặn                          | `openclaw pairing list signal`              | Phê duyệt người gửi hoặc điều chỉnh chính sách DM.       |
| Phản hồi nhóm không kích hoạt       | Kiểm tra danh sách cho phép nhóm và mẫu nhắc đến | Thêm người gửi/nhóm hoặc nới lỏng cổng kiểm soát.        |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Signal](/vi/channels/signal#troubleshooting)

## QQ Bot

### Dấu hiệu lỗi QQ Bot

| Triệu chứng                         | Kiểm tra nhanh nhất                              | Cách khắc phục                                                    |
| ----------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Bot trả lời "đã lên Sao Hỏa"        | Xác minh `appId` và `clientSecret` trong cấu hình | Đặt thông tin xác thực hoặc khởi động lại gateway.                |
| Không có tin nhắn đến               | `openclaw channels status --probe`               | Xác minh thông tin xác thực trên QQ Open Platform.                |
| Giọng nói không được phiên âm       | Kiểm tra cấu hình nhà cung cấp STT               | Cấu hình `channels.qqbot.stt` hoặc `tools.media.audio`.           |
| Tin nhắn chủ động không đến         | Kiểm tra yêu cầu tương tác của nền tảng QQ        | QQ có thể chặn tin nhắn do bot khởi tạo nếu không có tương tác gần đây. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố QQ Bot](/vi/channels/qqbot#troubleshooting)

## Matrix

### Dấu hiệu lỗi Matrix

| Triệu chứng                         | Kiểm tra nhanh nhất                    | Cách khắc phục                                                           |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Đã đăng nhập nhưng bỏ qua tin nhắn phòng | `openclaw channels status --probe`     | Kiểm tra `groupPolicy`, danh sách cho phép phòng và kiểm soát theo lượt nhắc. |
| Tin nhắn trực tiếp không được xử lý | `openclaw pairing list matrix`         | Phê duyệt người gửi hoặc điều chỉnh chính sách tin nhắn trực tiếp.       |
| Phòng được mã hóa bị lỗi            | `openclaw matrix verify status`        | Xác minh lại thiết bị, sau đó kiểm tra `openclaw matrix verify backup status`. |
| Khôi phục bản sao lưu đang chờ/bị hỏng | `openclaw matrix verify backup status` | Chạy `openclaw matrix verify backup restore` hoặc chạy lại bằng khóa khôi phục. |
| Ký chéo/khởi tạo có vẻ không đúng   | `openclaw matrix verify bootstrap`     | Sửa kho lưu trữ bí mật, ký chéo và trạng thái sao lưu trong một lượt.    |

Thiết lập và cấu hình đầy đủ: [Matrix](/vi/channels/matrix)

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
