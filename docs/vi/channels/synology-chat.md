---
read_when:
    - Thiết lập Synology Chat với OpenClaw
    - Gỡ lỗi định tuyến webhook của Synology Chat
summary: Thiết lập webhook Synology Chat và cấu hình OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T07:41:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat kết nối với OpenClaw thông qua một cặp Webhook: Webhook gửi đi của Synology Chat đăng các tin nhắn trực tiếp đến vào Gateway, còn phản hồi được gửi ngược lại qua Webhook nhận vào của Synology Chat.

Trạng thái: Plugin chính thức, được cài đặt riêng. Chỉ hỗ trợ tin nhắn trực tiếp; hỗ trợ gửi văn bản và tệp dựa trên URL.

## Cài đặt

```bash
openclaw plugins install @openclaw/synology-chat
```

Bản mã nguồn cục bộ (khi chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

1. Cài đặt Plugin (ở trên).
2. Trong phần tích hợp của Synology Chat:
   - Tạo một Webhook nhận vào và sao chép URL của Webhook đó.
   - Tạo một Webhook gửi đi bằng mã thông báo bí mật của bạn.
3. Trỏ URL Webhook gửi đi đến OpenClaw Gateway của bạn:
   - Theo mặc định là `https://gateway-host/webhook/synology`.
   - Hoặc `channels.synology-chat.webhookPath` tùy chỉnh của bạn.
4. Hoàn tất thiết lập trong OpenClaw. Synology Chat xuất hiện trong cùng danh sách thiết lập kênh ở cả hai quy trình:
   - Có hướng dẫn: `openclaw onboard` hoặc `openclaw channels add`
   - Trực tiếp: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Khởi động lại Gateway và gửi tin nhắn trực tiếp cho bot Synology Chat.

Chi tiết xác thực Webhook:

- OpenClaw chấp nhận mã thông báo Webhook gửi đi từ `body.token`, sau đó là
  `?token=...`, rồi đến các tiêu đề.
- Các dạng tiêu đề được chấp nhận:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Mã thông báo trống hoặc bị thiếu sẽ khiến yêu cầu bị từ chối theo cơ chế đóng an toàn.
- Tải trọng có thể là `application/x-www-form-urlencoded` hoặc `application/json`; bắt buộc phải có `token`, `user_id` và `text`.

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

Đối với tài khoản mặc định, bạn có thể sử dụng các biến môi trường:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (phân tách bằng dấu phẩy)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Giá trị cấu hình ghi đè các biến môi trường.

Không thể đặt `SYNOLOGY_CHAT_INCOMING_URL` và `SYNOLOGY_NAS_HOST` từ tệp `.env` của không gian làm việc; xem [Tệp `.env` của không gian làm việc](/vi/gateway/security#workspace-env-files).

## Chính sách tin nhắn trực tiếp và kiểm soát truy cập

- Các giá trị `dmPolicy` được hỗ trợ: `allowlist` (mặc định), `open` và `disabled`. Synology Chat không có quy trình ghép đôi; hãy phê duyệt người gửi bằng cách thêm ID người dùng Synology dạng số của họ vào `allowedUserIds`.
- `allowedUserIds` chấp nhận danh sách (hoặc chuỗi phân tách bằng dấu phẩy) gồm các ID người dùng Synology.
- Trong chế độ `allowlist`, danh sách `allowedUserIds` trống được xem là cấu hình sai và tuyến Webhook sẽ không khởi động.
- `dmPolicy: "open"` chỉ cho phép tin nhắn trực tiếp công khai khi `allowedUserIds` chứa `"*"`; nếu có các mục giới hạn, chỉ những người dùng khớp mới có thể trò chuyện. Chế độ `open` với danh sách `allowedUserIds` trống cũng từ chối khởi động tuyến.
- `dmPolicy: "disabled"` chặn tin nhắn trực tiếp.
- Theo mặc định, việc liên kết người nhận phản hồi vẫn dựa trên `user_id` dạng số ổn định. `channels.synology-chat.dangerouslyAllowNameMatching: true` là chế độ tương thích khẩn cấp, cho phép lại việc tra cứu tên người dùng/biệt danh có thể thay đổi để gửi phản hồi.

## Gửi đi

Sử dụng ID người dùng Synology Chat dạng số làm đích. Các tiền tố `synology-chat:`, `synology_chat:` và `synology:` đều được chấp nhận.

Ví dụ:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Văn bản gửi đi được chia thành các đoạn tối đa 2.000 ký tự. Hỗ trợ gửi phương tiện bằng cách phân phối tệp dựa trên URL: NAS tải xuống và đính kèm tệp (tối đa 32 MB). URL tệp gửi đi phải sử dụng `http` hoặc `https`; các đích mạng riêng tư hoặc bị chặn theo cách khác sẽ bị từ chối trước khi OpenClaw chuyển tiếp URL đến Webhook của NAS.

## Nhiều tài khoản

Hỗ trợ nhiều tài khoản Synology Chat trong `channels.synology-chat.accounts`.
Mỗi tài khoản có thể ghi đè mã thông báo, URL nhận vào, đường dẫn Webhook, chính sách tin nhắn trực tiếp và các giới hạn.
Các phiên tin nhắn trực tiếp được tách biệt theo tài khoản và người dùng, vì vậy cùng một `user_id` dạng số
trên hai tài khoản Synology khác nhau sẽ không dùng chung trạng thái bản ghi hội thoại.
Hãy cấp cho mỗi tài khoản được bật một `webhookPath` riêng biệt. OpenClaw từ chối các đường dẫn trùng khớp hoàn toàn
và từ chối khởi động các tài khoản được đặt tên nếu chúng chỉ kế thừa một đường dẫn Webhook dùng chung trong thiết lập nhiều tài khoản.
Nếu bạn chủ đích cần hành vi kế thừa cũ cho một tài khoản được đặt tên, hãy đặt
`dangerouslyAllowInheritedWebhookPath: true` trên tài khoản đó hoặc tại `channels.synology-chat`,
nhưng các đường dẫn trùng khớp hoàn toàn vẫn bị từ chối theo cơ chế đóng an toàn. Nên ưu tiên đặt đường dẫn rõ ràng cho từng tài khoản.

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

## Lưu ý bảo mật

- Giữ bí mật `token` và thay mới nếu bị rò rỉ.
- Giữ `allowInsecureSsl: false` trừ khi bạn tin cậy rõ ràng chứng chỉ NAS cục bộ tự ký.
- Các yêu cầu Webhook đến được xác minh bằng mã thông báo và giới hạn tốc độ theo từng người gửi (`rateLimitPerMinute`, mặc định là 30).
- Kiểm tra mã thông báo không hợp lệ sử dụng phép so sánh bí mật theo thời gian cố định và từ chối theo cơ chế đóng an toàn; các lần thử mã thông báo không hợp lệ lặp lại sẽ tạm thời khóa địa chỉ IP nguồn.
- Văn bản tin nhắn đến được làm sạch để chống các mẫu chèn lệnh nhắc đã biết và bị cắt ngắn ở 4.000 ký tự.
- Nên dùng `dmPolicy: "allowlist"` trong môi trường sản xuất.
- Giữ `dangerouslyAllowNameMatching` ở trạng thái tắt trừ khi bạn thực sự cần cách gửi phản hồi cũ dựa trên tên người dùng.
- Giữ `dangerouslyAllowInheritedWebhookPath` ở trạng thái tắt trừ khi bạn chủ đích chấp nhận rủi ro định tuyến qua đường dẫn dùng chung trong thiết lập nhiều tài khoản.

## Khắc phục sự cố

- `Missing required fields (token, user_id, text)`:
  - tải trọng Webhook gửi đi đang thiếu một trong các trường bắt buộc
  - nếu Synology gửi mã thông báo trong tiêu đề, hãy bảo đảm Gateway/proxy giữ nguyên các tiêu đề đó
- `Invalid token`:
  - mã bí mật của Webhook gửi đi không khớp với `channels.synology-chat.token`
  - yêu cầu đang đi đến sai tài khoản/đường dẫn Webhook
  - proxy ngược đã loại bỏ tiêu đề mã thông báo trước khi yêu cầu đến OpenClaw
- `Rate limit exceeded`:
  - quá nhiều lần thử mã thông báo không hợp lệ từ cùng một nguồn có thể tạm thời khóa nguồn đó
  - người gửi đã xác thực cũng có một giới hạn tốc độ tin nhắn riêng theo từng người dùng
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` đã được bật nhưng chưa cấu hình người dùng nào
- `User not authorized`:
  - `user_id` dạng số của người gửi không có trong `allowedUserIds`

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế kiểm soát bằng lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
