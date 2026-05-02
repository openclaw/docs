---
read_when:
    - Thiết lập Synology Chat với OpenClaw
    - Gỡ lỗi định tuyến Webhook Synology Chat
summary: Thiết lập Webhook Synology Chat và cấu hình OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T10:34:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Trạng thái: kênh tin nhắn trực tiếp Plugin tích hợp sẵn sử dụng Webhook Synology Chat.
Plugin chấp nhận tin nhắn đến từ các Webhook gửi đi của Synology Chat và gửi phản hồi
thông qua Webhook nhận vào của Synology Chat.

## Plugin tích hợp sẵn

Synology Chat được phát hành dưới dạng Plugin tích hợp sẵn trong các bản phát hành OpenClaw hiện tại, vì vậy các bản dựng
đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh không bao gồm Synology Chat,
hãy cài đặt thủ công:

Cài đặt từ bản checkout cục bộ:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

1. Đảm bảo Plugin Synology Chat có sẵn.
   - Các bản phát hành OpenClaw đóng gói hiện tại đã tích hợp sẵn Plugin này.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công từ bản checkout mã nguồn bằng lệnh ở trên.
   - `openclaw onboard` hiện hiển thị Synology Chat trong cùng danh sách thiết lập kênh như `openclaw channels add`.
   - Thiết lập không tương tác: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Trong phần tích hợp Synology Chat:
   - Tạo Webhook nhận vào và sao chép URL của nó.
   - Tạo Webhook gửi đi với token bí mật của bạn.
3. Trỏ URL Webhook gửi đi đến Gateway OpenClaw của bạn:
   - `https://gateway-host/webhook/synology` theo mặc định.
   - Hoặc `channels.synology-chat.webhookPath` tùy chỉnh của bạn.
4. Hoàn tất thiết lập trong OpenClaw.
   - Có hướng dẫn: `openclaw onboard`
   - Trực tiếp: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Khởi động lại Gateway và gửi DM đến bot Synology Chat.

Chi tiết xác thực Webhook:

- OpenClaw chấp nhận token Webhook gửi đi từ `body.token`, sau đó
  `?token=...`, rồi đến các header.
- Các dạng header được chấp nhận:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token trống hoặc thiếu sẽ bị từ chối đóng.

Cấu hình tối thiểu:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Biến môi trường

Đối với tài khoản mặc định, bạn có thể dùng biến môi trường:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (phân tách bằng dấu phẩy)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Giá trị cấu hình ghi đè biến môi trường.

`SYNOLOGY_CHAT_INCOMING_URL` không thể được đặt từ tệp `.env` của workspace; xem [Tệp `.env` của workspace](/vi/gateway/security).

## Chính sách DM và kiểm soát truy cập

- `dmPolicy: "allowlist"` là mặc định được khuyến nghị.
- `allowedUserIds` chấp nhận danh sách (hoặc chuỗi phân tách bằng dấu phẩy) các ID người dùng Synology.
- Ở chế độ `allowlist`, danh sách `allowedUserIds` trống được xem là cấu hình sai và tuyến Webhook sẽ không khởi động (dùng `dmPolicy: "open"` với `allowedUserIds: ["*"]` để cho phép tất cả).
- `dmPolicy: "open"` chỉ cho phép DM công khai khi `allowedUserIds` bao gồm `"*"`; với các mục hạn chế, chỉ người dùng khớp mới có thể chat.
- `dmPolicy: "disabled"` chặn DM.
- Liên kết người nhận phản hồi mặc định vẫn dựa trên `user_id` dạng số ổn định. `channels.synology-chat.dangerouslyAllowNameMatching: true` là chế độ tương thích khẩn cấp bật lại tra cứu username/nickname có thể thay đổi để gửi phản hồi.
- Phê duyệt ghép nối hoạt động với:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Gửi ra ngoài

Dùng ID người dùng Synology Chat dạng số làm đích.

Ví dụ:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Có hỗ trợ gửi media bằng cách gửi tệp dựa trên URL.
URL tệp gửi ra ngoài phải dùng `http` hoặc `https`, và các đích mạng riêng tư hoặc bị chặn theo cách khác sẽ bị từ chối trước khi OpenClaw chuyển tiếp URL đến Webhook NAS.

## Nhiều tài khoản

Nhiều tài khoản Synology Chat được hỗ trợ trong `channels.synology-chat.accounts`.
Mỗi tài khoản có thể ghi đè token, URL nhận vào, đường dẫn Webhook, chính sách DM và giới hạn.
Phiên tin nhắn trực tiếp được cô lập theo từng tài khoản và người dùng, nên cùng một `user_id`
dạng số trên hai tài khoản Synology khác nhau sẽ không dùng chung trạng thái transcript.
Gán cho mỗi tài khoản đã bật một `webhookPath` riêng biệt. OpenClaw hiện từ chối các đường dẫn chính xác bị trùng
và từ chối khởi động các tài khoản đặt tên chỉ kế thừa một đường dẫn Webhook dùng chung trong thiết lập nhiều tài khoản.
Nếu bạn cố ý cần kế thừa kiểu cũ cho một tài khoản đặt tên, hãy đặt
`dangerouslyAllowInheritedWebhookPath: true` trên tài khoản đó hoặc tại `channels.synology-chat`,
nhưng các đường dẫn chính xác bị trùng vẫn bị từ chối đóng. Nên ưu tiên đường dẫn rõ ràng cho từng tài khoản.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Ghi chú bảo mật

- Giữ bí mật `token` và xoay vòng token nếu bị lộ.
- Giữ `allowInsecureSsl: false` trừ khi bạn tin cậy rõ ràng chứng chỉ NAS cục bộ tự ký.
- Yêu cầu Webhook đến được xác minh token và giới hạn tốc độ theo từng người gửi.
- Kiểm tra token không hợp lệ dùng so sánh bí mật hằng thời gian và từ chối đóng.
- Nên dùng `dmPolicy: "allowlist"` cho môi trường production.
- Tắt `dangerouslyAllowNameMatching` trừ khi bạn thật sự cần gửi phản hồi dựa trên username kiểu cũ.
- Tắt `dangerouslyAllowInheritedWebhookPath` trừ khi bạn chấp nhận rõ ràng rủi ro định tuyến qua đường dẫn dùng chung trong thiết lập nhiều tài khoản.

## Khắc phục sự cố

- `Missing required fields (token, user_id, text)`:
  - payload Webhook gửi đi thiếu một trong các trường bắt buộc
  - nếu Synology gửi token trong header, hãy đảm bảo Gateway/proxy giữ lại các header đó
- `Invalid token`:
  - bí mật Webhook gửi đi không khớp với `channels.synology-chat.token`
  - yêu cầu đang đi đến sai tài khoản/đường dẫn Webhook
  - reverse proxy đã loại bỏ header token trước khi yêu cầu đến OpenClaw
- `Rate limit exceeded`:
  - quá nhiều lần thử token không hợp lệ từ cùng một nguồn có thể tạm thời khóa nguồn đó
  - người gửi đã xác thực cũng có giới hạn tốc độ tin nhắn riêng theo từng người dùng
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` được bật nhưng chưa cấu hình người dùng nào
- `User not authorized`:
  - `user_id` dạng số của người gửi không nằm trong `allowedUserIds`

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi chat nhóm và kiểm soát bằng nhắc tên
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
