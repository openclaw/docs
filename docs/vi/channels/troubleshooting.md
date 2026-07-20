---
read_when:
    - Kênh truyền tải báo đã kết nối nhưng không thể trả lời
    - Bạn cần kiểm tra theo từng kênh trước khi xem tài liệu chuyên sâu về nhà cung cấp
summary: Khắc phục sự cố nhanh ở cấp độ kênh với dấu hiệu lỗi và cách sửa cho từng kênh
title: Khắc phục sự cố kênh
x-i18n:
    generated_at: "2026-07-20T04:19:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3891595e4b5aca9de7997a6e908fa1c9246579032bfdfa1656a6992d644c3ecc
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

Trạng thái cơ sở bình thường:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, hoặc `admin-capable`
- Phép thăm dò kênh cho thấy phương thức truyền tải đã kết nối và, khi được hỗ trợ, `works` hoặc `audit ok`

## Sau khi cập nhật

Sử dụng phần này khi Telegram, iMessage, cấu hình thời BlueBubbles hoặc một kênh Plugin khác biến mất
sau khi cập nhật.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Tìm `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` trong `openclaw
status --all`. Điều đó có nghĩa là kênh đã được cấu hình, nhưng quá trình thiết lập/tải Plugin gặp phải cây
phụ thuộc bị hỏng thay vì đăng ký kênh. `openclaw doctor --fix` xóa các liên kết tượng trưng phụ thuộc
thời gian chạy Plugin đã lỗi thời và các bản sao xác thực đã lỗi thời, sau đó `openclaw gateway restart` tải lại
trạng thái sạch.

## WhatsApp

### Dấu hiệu lỗi WhatsApp

| Triệu chứng                          | Kiểm tra nhanh nhất                                | Cách khắc phục                                                                                                                      |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Đã kết nối nhưng không trả lời DM    | `openclaw pairing list whatsapp`                    | Phê duyệt người gửi hoặc chuyển đổi chính sách/danh sách cho phép DM.                                                            |
| Tin nhắn nhóm bị bỏ qua              | Kiểm tra `requireMention` + mẫu đề cập trong cấu hình | Đề cập bot hoặc nới lỏng chính sách đề cập cho nhóm đó.                                                                          |
| Đăng nhập bằng mã QR hết thời gian chờ với lỗi 408 | Kiểm tra biến môi trường `HTTPS_PROXY` / `HTTP_PROXY` của Gateway | Đặt proxy có thể truy cập; chỉ sử dụng `NO_PROXY` để bỏ qua.                                                                         |
| Vòng lặp ngắt kết nối/đăng nhập lại ngẫu nhiên | `openclaw channels status --probe` + nhật ký           | Các lần kết nối lại gần đây vẫn được gắn cờ ngay cả khi hiện đang kết nối; theo dõi nhật ký, khởi động lại Gateway, sau đó liên kết lại nếu tình trạng chập chờn tiếp diễn. |
| Vòng lặp `status=408 Request Time-out`  | Thăm dò, nhật ký, doctor, rồi trạng thái Gateway            | Trước tiên, khắc phục khả năng kết nối/định thời của máy chủ; sao lưu xác thực và liên kết lại tài khoản nếu vòng lặp vẫn tiếp diễn.                                   |
| Phản hồi đến chậm vài giây/phút | `openclaw doctor --fix`                             | Doctor dừng các máy khách TUI cục bộ đã lỗi thời được xác minh khi chúng làm suy giảm vòng lặp sự kiện của Gateway.                                    |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố WhatsApp](/vi/channels/whatsapp#troubleshooting)

## Telegram

### Dấu hiệu lỗi Telegram

| Triệu chứng                              | Kiểm tra nhanh nhất                                    | Cách khắc phục                                                                                                                    |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `/start` nhưng không có luồng phản hồi khả dụng    | `openclaw pairing list telegram`                 | Phê duyệt ghép nối hoặc thay đổi chính sách DM.                                                                                   |
| Bot trực tuyến nhưng nhóm vẫn im lặng    | Xác minh yêu cầu đề cập và chế độ riêng tư của bot  | Tắt chế độ riêng tư để nhóm có thể hiển thị hoặc đề cập bot.                                                              |
| Gửi thất bại kèm lỗi mạng    | Kiểm tra nhật ký để tìm lỗi gọi API Telegram      | Khắc phục định tuyến DNS/IPv6/proxy tới `api.telegram.org`.                                                                      |
| Khi khởi động báo cáo `getMe returned 401` | Kiểm tra nguồn token đã cấu hình                    | Sao chép lại hoặc tạo lại token BotFather và cập nhật `botToken`, `tokenFile`, hoặc `TELEGRAM_BOT_TOKEN` của tài khoản mặc định. |
| Polling bị đình trệ hoặc kết nối lại chậm  | `openclaw logs --follow` để chẩn đoán polling | Nâng cấp; tình trạng đình trệ kéo dài thường chỉ ra vấn đề với proxy/DNS/IPv6.                                                            |
| `setMyCommands` bị từ chối khi khởi động  | Kiểm tra nhật ký để tìm `BOT_COMMANDS_TOO_MUCH`         | Giảm số lượng lệnh Telegram của Plugin/skill/tùy chỉnh hoặc tắt menu gốc.                                                  |
| Sau khi nâng cấp, danh sách cho phép chặn bạn    | `openclaw security audit` và danh sách cho phép trong cấu hình  | Chạy `openclaw doctor --fix` hoặc thay thế `@username` bằng ID người gửi dạng số.                                            |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Telegram](/vi/channels/telegram#troubleshooting)

## Discord

### Dấu hiệu lỗi Discord

| Triệu chứng                                   | Kiểm tra nhanh nhất                                                                                                                | Cách khắc phục                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot trực tuyến nhưng không trả lời trong guild           | `openclaw channels status --probe`                                                                                           | Cho phép guild/kênh và xác minh intent nội dung tin nhắn.                                                                                                                                                                                                                |
| Tin nhắn nhóm bị bỏ qua                    | Kiểm tra nhật ký để tìm các trường hợp bị loại do cổng đề cập                                                                                          | Đề cập bot hoặc đặt `requireMention: false` cho guild/kênh.                                                                                                                                                                                                             |
| Có hoạt động nhập/sử dụng token nhưng không có tin nhắn Discord | Kiểm tra xem đây có phải là sự kiện phòng nền hay phòng `message_tool` đã chọn tham gia mà mô hình bỏ sót `message(action=send)` hay không | Kiểm tra nhật ký chi tiết của Gateway để tìm siêu dữ liệu payload cuối cùng bị chặn, xác minh `messages.groupChat.unmentionedInbound`, đọc [Sự kiện phòng nền](/vi/channels/ambient-room-events), hoặc giữ `messages.groupChat.visibleReplies: "automatic"` cho các yêu cầu nhóm thông thường. |
| Thiếu phản hồi DM                        | `openclaw pairing list discord`                                                                                              | Phê duyệt ghép nối DM hoặc điều chỉnh chính sách DM.                                                                                                                                                                                                                               |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Discord](/vi/channels/discord#troubleshooting)

## Slack

### Dấu hiệu lỗi Slack

| Triệu chứng                                | Kiểm tra nhanh nhất                             | Cách khắc phục                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chế độ socket đã kết nối nhưng không có phản hồi | `openclaw channels status --probe`        | Xác minh token ứng dụng + token bot và các phạm vi bắt buộc; theo dõi `botTokenStatus` / `appTokenStatus = configured_unavailable` trong các thiết lập dựa trên SecretRef. |
| DM bị chặn                            | `openclaw pairing list slack`             | Phê duyệt ghép nối hoặc nới lỏng chính sách DM.                                                                                                                  |
| Tin nhắn kênh bị bỏ qua                | Kiểm tra `groupPolicy` và danh sách cho phép của kênh | Cho phép kênh hoặc chuyển chính sách sang `open`.                                                                                                        |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Slack](/vi/channels/slack#troubleshooting)

## iMessage

### Dấu hiệu lỗi iMessage

| Triệu chứng                              | Kiểm tra nhanh nhất                                           | Cách khắc phục                                                                   |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Thiếu `imsg` hoặc thất bại trên hệ điều hành không phải macOS | `openclaw channels status --probe --channel imessage`   | Chạy OpenClaw trên máy Mac chạy Messages hoặc sử dụng trình bao bọc SSH cho `cliPath`. |
| Có thể gửi nhưng không thể nhận trên macOS     | Kiểm tra quyền riêng tư của macOS đối với tự động hóa Messages | Cấp lại quyền TCC và khởi động lại tiến trình kênh.                 |
| Người gửi DM bị chặn                    | `openclaw pairing list imessage`                        | Phê duyệt ghép nối hoặc cập nhật danh sách cho phép.                                  |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố iMessage](/vi/channels/imessage#troubleshooting)

## Signal

### Dấu hiệu lỗi Signal

| Triệu chứng                         | Kiểm tra nhanh nhất                              | Cách khắc phục                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Có thể truy cập daemon nhưng bot im lặng | `openclaw channels status --probe`         | Xác minh URL/tài khoản daemon `signal-cli` và chế độ nhận. |
| DM bị chặn                      | `openclaw pairing list signal`             | Phê duyệt người gửi hoặc điều chỉnh chính sách DM.                      |
| Phản hồi nhóm không được kích hoạt    | Kiểm tra danh sách cho phép của nhóm và các mẫu đề cập | Thêm người gửi/nhóm hoặc nới lỏng cơ chế kiểm soát.                       |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Signal](/vi/channels/signal#troubleshooting)

## QQ Bot

### Dấu hiệu lỗi QQ Bot

| Triệu chứng                         | Kiểm tra nhanh nhất                               | Cách khắc phục                                                             |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot trả lời "đã lên sao Hỏa"      | Xác minh `appId` và `clientSecret` trong cấu hình | Đặt thông tin xác thực hoặc khởi động lại Gateway.                         |
| Không có tin nhắn đến             | `openclaw channels status --probe`          | Xác minh thông tin xác thực trên QQ Open Platform.                     |
| Giọng nói không được chuyển biên           | Kiểm tra cấu hình nhà cung cấp STT                   | Cấu hình `channels.qqbot.stt` hoặc `tools.media.audio`.          |
| Tin nhắn chủ động không đến | Kiểm tra các yêu cầu tương tác của nền tảng QQ  | QQ có thể chặn tin nhắn do bot khởi tạo nếu không có tương tác gần đây. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố QQ Bot](/vi/channels/qqbot#troubleshooting)

## Matrix

### Dấu hiệu lỗi Matrix

| Triệu chứng                             | Cách kiểm tra nhanh nhất                          | Cách khắc phục                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Đã đăng nhập nhưng bỏ qua tin nhắn trong phòng | `openclaw channels status --probe`     | Kiểm tra `groupPolicy`, danh sách cho phép của phòng và cơ chế yêu cầu đề cập.                  |
| Tin nhắn trực tiếp không được xử lý                  | `openclaw pairing list matrix`         | Phê duyệt người gửi hoặc điều chỉnh chính sách tin nhắn trực tiếp.                                       |
| Phòng mã hóa không hoạt động                | `openclaw matrix verify status`        | Xác minh lại thiết bị, sau đó kiểm tra `openclaw matrix verify backup status`.  |
| Khôi phục bản sao lưu đang chờ hoặc bị lỗi    | `openclaw matrix verify backup status` | Chạy `openclaw matrix verify backup restore` hoặc chạy lại bằng khóa khôi phục. |
| Ký chéo/khởi tạo có vẻ không chính xác | `openclaw matrix verify bootstrap`     | Sửa chữa kho lưu trữ bí mật, trạng thái ký chéo và sao lưu trong một lượt.       |

Thiết lập và cấu hình đầy đủ: [Matrix](/vi/channels/matrix)

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
