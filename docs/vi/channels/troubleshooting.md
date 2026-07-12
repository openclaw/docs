---
read_when:
    - Kênh truyền tải báo đã kết nối nhưng không thể gửi phản hồi
    - Bạn cần thực hiện các bước kiểm tra dành riêng cho từng kênh trước khi xem tài liệu chuyên sâu về nhà cung cấp
summary: Khắc phục sự cố nhanh ở cấp độ kênh với dấu hiệu lỗi và cách khắc phục riêng cho từng kênh
title: Khắc phục sự cố kênh
x-i18n:
    generated_at: "2026-07-12T07:41:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

Hãy dùng trang này khi một kênh kết nối được nhưng hoạt động không đúng.

## Trình tự lệnh

Trước tiên, hãy chạy các lệnh sau theo thứ tự:

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
- `Capability: read-only`, `write-capable` hoặc `admin-capable`
- Phép dò kênh cho thấy lớp truyền tải đã kết nối và, nếu được hỗ trợ, hiển thị `works` hoặc `audit ok`

## Sau khi cập nhật

Hãy dùng phần này khi Telegram, iMessage, cấu hình từ thời BlueBubbles hoặc một kênh Plugin khác biến mất
sau khi cập nhật.

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

Tìm `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` trong `openclaw
status --all`. Điều này có nghĩa là kênh đã được cấu hình, nhưng quá trình thiết lập/tải Plugin gặp cây
phụ thuộc bị hỏng thay vì đăng ký kênh. `openclaw doctor --fix` xóa các liên kết tượng trưng phụ thuộc
cũ của môi trường chạy Plugin và các bản sao xác thực cũ, sau đó `openclaw gateway restart` tải lại
trạng thái sạch.

## WhatsApp

### Dấu hiệu lỗi WhatsApp

| Triệu chứng | Kiểm tra nhanh nhất | Cách khắc phục |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Đã kết nối nhưng không trả lời tin nhắn trực tiếp | `openclaw pairing list whatsapp` | Phê duyệt người gửi hoặc thay đổi chính sách/danh sách cho phép đối với tin nhắn trực tiếp. |
| Tin nhắn nhóm bị bỏ qua | Kiểm tra `requireMention` và các mẫu đề cập trong cấu hình | Đề cập bot hoặc nới lỏng chính sách đề cập cho nhóm đó. |
| Đăng nhập bằng mã QR hết thời gian chờ với mã 408 | Kiểm tra biến môi trường `HTTPS_PROXY` / `HTTP_PROXY` của Gateway | Đặt proxy có thể truy cập; chỉ dùng `NO_PROXY` cho các trường hợp bỏ qua proxy. |
| Ngắt kết nối/đăng nhập lại lặp lại ngẫu nhiên | `openclaw channels status --probe` và nhật ký | Các lần kết nối lại gần đây vẫn bị đánh dấu ngay cả khi hiện đang kết nối; theo dõi nhật ký, khởi động lại Gateway, rồi liên kết lại nếu tình trạng chập chờn tiếp diễn. |
| Vòng lặp `status=408 Request Time-out` | Dò, xem nhật ký, chạy doctor, rồi kiểm tra trạng thái Gateway | Trước tiên hãy khắc phục kết nối/thời gian của máy chủ; sao lưu dữ liệu xác thực và liên kết lại tài khoản nếu vòng lặp vẫn tiếp diễn. |
| Phản hồi đến trễ vài giây/phút | `openclaw doctor --fix` | Doctor dừng các máy khách TUI cục bộ cũ đã được xác minh khi chúng làm suy giảm vòng lặp sự kiện của Gateway. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố WhatsApp](/vi/channels/whatsapp#troubleshooting)

## Telegram

### Dấu hiệu lỗi Telegram

| Triệu chứng | Kiểm tra nhanh nhất | Cách khắc phục |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Gửi `/start` nhưng không có luồng phản hồi dùng được | `openclaw pairing list telegram` | Phê duyệt ghép nối hoặc thay đổi chính sách tin nhắn trực tiếp. |
| Bot trực tuyến nhưng nhóm vẫn im lặng | Xác minh yêu cầu đề cập và chế độ riêng tư của bot | Tắt chế độ riêng tư để bot nhìn thấy nội dung nhóm hoặc đề cập bot. |
| Gửi thất bại kèm lỗi mạng | Kiểm tra nhật ký để tìm lỗi gọi API Telegram | Khắc phục định tuyến DNS/IPv6/proxy đến `api.telegram.org`. |
| Khi khởi động báo `getMe returned 401` | Kiểm tra nguồn token đã cấu hình | Sao chép lại hoặc tạo lại token BotFather rồi cập nhật `botToken`, `tokenFile` hoặc `TELEGRAM_BOT_TOKEN` của tài khoản mặc định. |
| Thăm dò bị đình trệ hoặc kết nối lại chậm | Dùng `openclaw logs --follow` để xem chẩn đoán thăm dò | Nâng cấp; nếu các lần khởi động lại là cảnh báo sai, hãy điều chỉnh `pollingStallThresholdMs`. Tình trạng đình trệ kéo dài vẫn cho thấy vấn đề về proxy/DNS/IPv6. |
| `setMyCommands` bị từ chối khi khởi động | Kiểm tra nhật ký để tìm `BOT_COMMANDS_TOO_MUCH` | Giảm số lệnh Telegram của Plugin/Skills/tùy chỉnh hoặc tắt menu gốc. |
| Sau khi nâng cấp, danh sách cho phép chặn bạn | `openclaw security audit` và các danh sách cho phép trong cấu hình | Chạy `openclaw doctor --fix` hoặc thay `@username` bằng ID người gửi dạng số. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Telegram](/vi/channels/telegram#troubleshooting)

## Discord

### Dấu hiệu lỗi Discord

| Triệu chứng | Kiểm tra nhanh nhất | Cách khắc phục |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot trực tuyến nhưng không phản hồi trong máy chủ | `openclaw channels status --probe` | Cho phép máy chủ/kênh và xác minh quyền truy cập nội dung tin nhắn. |
| Tin nhắn nhóm bị bỏ qua | Kiểm tra nhật ký để tìm các lần loại bỏ do cổng kiểm soát đề cập | Đề cập bot hoặc đặt `requireMention: false` cho máy chủ/kênh. |
| Hiển thị đang nhập/sử dụng token nhưng không có tin nhắn Discord | Kiểm tra đây có phải là sự kiện phòng xung quanh hay phòng `message_tool` đã chọn tham gia mà mô hình bỏ lỡ `message(action=send)` hay không | Kiểm tra nhật ký chi tiết của Gateway để tìm siêu dữ liệu tải trọng cuối bị chặn, xác minh `messages.groupChat.unmentionedInbound`, đọc [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events), hoặc giữ `messages.groupChat.visibleReplies: "automatic"` cho các yêu cầu nhóm thông thường. |
| Thiếu phản hồi tin nhắn trực tiếp | `openclaw pairing list discord` | Phê duyệt ghép nối tin nhắn trực tiếp hoặc điều chỉnh chính sách tin nhắn trực tiếp. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Discord](/vi/channels/discord#troubleshooting)

## Slack

### Dấu hiệu lỗi Slack

| Triệu chứng | Kiểm tra nhanh nhất | Cách khắc phục |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chế độ socket đã kết nối nhưng không có phản hồi | `openclaw channels status --probe` | Xác minh token ứng dụng, token bot và các phạm vi bắt buộc; chú ý `botTokenStatus` / `appTokenStatus = configured_unavailable` trong các thiết lập dựa trên SecretRef. |
| Tin nhắn trực tiếp bị chặn | `openclaw pairing list slack` | Phê duyệt ghép nối hoặc nới lỏng chính sách tin nhắn trực tiếp. |
| Tin nhắn kênh bị bỏ qua | Kiểm tra `groupPolicy` và danh sách cho phép của kênh | Cho phép kênh hoặc chuyển chính sách sang `open`. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Slack](/vi/channels/slack#troubleshooting)

## iMessage

### Dấu hiệu lỗi iMessage

| Triệu chứng | Kiểm tra nhanh nhất | Cách khắc phục |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Thiếu `imsg` hoặc không chạy trên hệ điều hành không phải macOS | `openclaw channels status --probe --channel imessage` | Chạy OpenClaw trên máy Mac có Messages hoặc dùng trình bao bọc SSH cho `cliPath`. |
| Có thể gửi nhưng không nhận được trên macOS | Kiểm tra quyền riêng tư của macOS dành cho tính năng tự động hóa Messages | Cấp lại quyền TCC và khởi động lại tiến trình kênh. |
| Người gửi tin nhắn trực tiếp bị chặn | `openclaw pairing list imessage` | Phê duyệt ghép nối hoặc cập nhật danh sách cho phép. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố iMessage](/vi/channels/imessage#troubleshooting)

## Signal

### Dấu hiệu lỗi Signal

| Triệu chứng | Kiểm tra nhanh nhất | Cách khắc phục |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Có thể truy cập daemon nhưng bot im lặng | `openclaw channels status --probe` | Xác minh URL/tài khoản daemon `signal-cli` và chế độ nhận. |
| Tin nhắn trực tiếp bị chặn | `openclaw pairing list signal` | Phê duyệt người gửi hoặc điều chỉnh chính sách tin nhắn trực tiếp. |
| Phản hồi nhóm không được kích hoạt | Kiểm tra danh sách cho phép của nhóm và các mẫu đề cập | Thêm người gửi/nhóm hoặc nới lỏng cổng kiểm soát. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố Signal](/vi/channels/signal#troubleshooting)

## QQ Bot

### Dấu hiệu lỗi QQ Bot

| Triệu chứng | Kiểm tra nhanh nhất | Cách khắc phục |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot trả lời "đã bay lên sao Hỏa" | Xác minh `appId` và `clientSecret` trong cấu hình | Đặt thông tin xác thực hoặc khởi động lại Gateway. |
| Không có tin nhắn đến | `openclaw channels status --probe` | Xác minh thông tin xác thực trên QQ Open Platform. |
| Giọng nói không được chuyển thành văn bản | Kiểm tra cấu hình nhà cung cấp STT | Cấu hình `channels.qqbot.stt` hoặc `tools.media.audio`. |
| Tin nhắn chủ động không đến | Kiểm tra yêu cầu tương tác của nền tảng QQ | QQ có thể chặn tin nhắn do bot khởi tạo nếu không có tương tác gần đây. |

Khắc phục sự cố đầy đủ: [Khắc phục sự cố QQ Bot](/vi/channels/qqbot#troubleshooting)

## Matrix

### Các dấu hiệu lỗi Matrix

| Triệu chứng                               | Cách kiểm tra nhanh nhất                 | Cách khắc phục                                                                 |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| Đã đăng nhập nhưng bỏ qua tin nhắn phòng  | `openclaw channels status --probe`       | Kiểm tra `groupPolicy`, danh sách phòng được phép và điều kiện yêu cầu đề cập. |
| Tin nhắn trực tiếp không được xử lý       | `openclaw pairing list matrix`           | Phê duyệt người gửi hoặc điều chỉnh chính sách tin nhắn trực tiếp.             |
| Phòng được mã hóa không hoạt động         | `openclaw matrix verify status`          | Xác minh lại thiết bị, sau đó kiểm tra `openclaw matrix verify backup status`. |
| Khôi phục bản sao lưu đang chờ/bị lỗi     | `openclaw matrix verify backup status`   | Chạy `openclaw matrix verify backup restore` hoặc chạy lại bằng khóa khôi phục. |
| Ký chéo/khởi tạo ban đầu có vẻ không đúng | `openclaw matrix verify bootstrap`       | Sửa bộ lưu trữ bí mật, trạng thái ký chéo và sao lưu trong một lần.             |

Hướng dẫn thiết lập và cấu hình đầy đủ: [Matrix](/vi/channels/matrix)

## Liên quan

- [Ghép nối](/vi/channels/pairing)
- [Định tuyến kênh](/vi/channels/channel-routing)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
