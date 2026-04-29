---
read_when:
    - Thiết lập Synology Chat với OpenClaw
    - Gỡ lỗi định tuyến Webhook của Synology Chat
summary: Thiết lập Webhook Synology Chat và cấu hình OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-29T22:27:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Trạng thái: kênh tin nhắn trực tiếp của Plugin đóng gói kèm sử dụng Webhook Synology Chat.
Plugin chấp nhận tin nhắn đến từ Webhook gửi đi của Synology Chat và gửi trả lời
thông qua Webhook nhận đến của Synology Chat.

## Plugin đóng gói kèm

Synology Chat được phát hành dưới dạng Plugin đóng gói kèm trong các bản phát hành OpenClaw hiện tại, nên các bản dựng
đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ Synology Chat,
hãy cài đặt thủ công:

Cài đặt từ checkout cục bộ:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

1. Đảm bảo Plugin Synology Chat có sẵn.
   - Các bản phát hành OpenClaw được đóng gói hiện tại đã bao gồm Plugin này.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công từ checkout mã nguồn bằng lệnh ở trên.
   - `openclaw onboard` hiện hiển thị Synology Chat trong cùng danh sách thiết lập kênh như `openclaw channels add`.
   - Thiết lập không tương tác: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Trong các tích hợp Synology Chat:
   - Tạo Webhook nhận đến và sao chép URL của nó.
   - Tạo Webhook gửi đi với token bí mật của bạn.
3. Trỏ URL Webhook gửi đi đến Gateway OpenClaw của bạn:
   - `https://gateway-host/webhook/synology` theo mặc định.
   - Hoặc `channels.synology-chat.webhookPath` tùy chỉnh của bạn.
4. Hoàn tất thiết lập trong OpenClaw.
   - Có hướng dẫn: `openclaw onboard`
   - Trực tiếp: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Khởi động lại Gateway và gửi một DM đến bot Synology Chat.

Chi tiết xác thực Webhook:

- OpenClaw chấp nhận token Webhook gửi đi từ `body.token`, rồi
  `?token=...`, rồi các header.
- Các dạng header được chấp nhận:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token trống hoặc thiếu sẽ thất bại ở trạng thái đóng.

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

`SYNOLOGY_CHAT_INCOMING_URL` không thể được đặt từ `.env` của workspace; xem [tệp `.env` của workspace](/vi/gateway/security).

## Chính sách DM và kiểm soát truy cập

- `dmPolicy: "allowlist"` là mặc định được khuyến nghị.
- `allowedUserIds` chấp nhận một danh sách (hoặc chuỗi phân tách bằng dấu phẩy) các ID người dùng Synology.
- Trong chế độ `allowlist`, danh sách `allowedUserIds` trống được xem là cấu hình sai và tuyến Webhook sẽ không khởi động (dùng `dmPolicy: "open"` với `allowedUserIds: ["*"]` để cho phép tất cả).
- `dmPolicy: "open"` chỉ cho phép DM công khai khi `allowedUserIds` bao gồm `"*"`; với các mục hạn chế, chỉ người dùng khớp mới có thể trò chuyện.
- `dmPolicy: "disabled"` chặn DM.
- Việc ràng buộc người nhận trả lời mặc định vẫn dựa trên `user_id` dạng số ổn định. `channels.synology-chat.dangerouslyAllowNameMatching: true` là chế độ tương thích phá kính khẩn cấp, bật lại tra cứu tên người dùng/biệt danh có thể thay đổi để chuyển phát trả lời.
- Phê duyệt ghép nối hoạt động với:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Gửi đi

Dùng ID người dùng Synology Chat dạng số làm đích.

Ví dụ:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Hỗ trợ gửi phương tiện bằng cách chuyển phát tệp dựa trên URL.
URL tệp gửi đi phải dùng `http` hoặc `https`, và các đích mạng riêng tư hoặc bị chặn theo cách khác sẽ bị từ chối trước khi OpenClaw chuyển tiếp URL đến Webhook NAS.

## Nhiều tài khoản

Hỗ trợ nhiều tài khoản Synology Chat trong `channels.synology-chat.accounts`.
Mỗi tài khoản có thể ghi đè token, URL nhận đến, đường dẫn Webhook, chính sách DM và các giới hạn.
Phiên tin nhắn trực tiếp được cô lập theo từng tài khoản và người dùng, nên cùng một `user_id` dạng số
trên hai tài khoản Synology khác nhau sẽ không dùng chung trạng thái bản ghi hội thoại.
Cấp cho mỗi tài khoản đã bật một `webhookPath` riêng biệt. OpenClaw hiện từ chối các đường dẫn chính xác bị trùng
và từ chối khởi động các tài khoản có tên chỉ kế thừa một đường dẫn Webhook dùng chung trong thiết lập nhiều tài khoản.
Nếu bạn cố ý cần kế thừa cũ cho một tài khoản có tên, hãy đặt
`dangerouslyAllowInheritedWebhookPath: true` trên tài khoản đó hoặc tại `channels.synology-chat`,
nhưng các đường dẫn chính xác bị trùng vẫn bị từ chối ở trạng thái đóng. Ưu tiên đường dẫn rõ ràng cho từng tài khoản.

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

- Giữ bí mật `token` và xoay vòng nếu bị rò rỉ.
- Giữ `allowInsecureSsl: false` trừ khi bạn tin cậy rõ ràng chứng chỉ NAS cục bộ tự ký.
- Yêu cầu Webhook đến được xác minh bằng token và giới hạn tốc độ theo từng người gửi.
- Kiểm tra token không hợp lệ dùng so sánh bí mật theo thời gian hằng định và thất bại ở trạng thái đóng.
- Ưu tiên `dmPolicy: "allowlist"` cho môi trường sản xuất.
- Giữ `dangerouslyAllowNameMatching` tắt trừ khi bạn cần rõ ràng cơ chế chuyển phát trả lời dựa trên tên người dùng kiểu cũ.
- Giữ `dangerouslyAllowInheritedWebhookPath` tắt trừ khi bạn chấp nhận rõ ràng rủi ro định tuyến đường dẫn dùng chung trong thiết lập nhiều tài khoản.

## Khắc phục sự cố

- `Missing required fields (token, user_id, text)`:
  - payload Webhook gửi đi thiếu một trong các trường bắt buộc
  - nếu Synology gửi token trong header, hãy đảm bảo Gateway/proxy giữ nguyên các header đó
- `Invalid token`:
  - bí mật Webhook gửi đi không khớp với `channels.synology-chat.token`
  - yêu cầu đang đi vào sai tài khoản/đường dẫn Webhook
  - proxy ngược đã loại bỏ header token trước khi yêu cầu đến OpenClaw
- `Rate limit exceeded`:
  - quá nhiều lần thử token không hợp lệ từ cùng một nguồn có thể tạm thời khóa nguồn đó
  - người gửi đã xác thực cũng có một giới hạn tốc độ tin nhắn riêng theo từng người dùng
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` đã được bật nhưng chưa cấu hình người dùng nào
- `User not authorized`:
  - `user_id` dạng số của người gửi không nằm trong `allowedUserIds`

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát nhắc tên
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
