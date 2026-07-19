---
read_when:
    - Thiết lập Synology Chat với OpenClaw
    - Gỡ lỗi định tuyến Webhook của Synology Chat
summary: Thiết lập webhook Synology Chat và cấu hình OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-19T05:37:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3c03379944ee4187260a7287f6d2aed1ad8fdd1c22b5581c8a5d55515bbb6ad5
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat kết nối với OpenClaw thông qua một cặp webhook: webhook gửi đi của Synology Chat đăng các tin nhắn trực tiếp đến vào Gateway, còn phản hồi được gửi lại qua webhook nhận vào của Synology Chat.

Trạng thái: plugin chính thức, được cài đặt riêng. Chỉ hỗ trợ tin nhắn trực tiếp; hỗ trợ gửi văn bản và tệp dựa trên URL.

## Cài đặt

```bash
openclaw plugins install @openclaw/synology-chat
```

Bản checkout cục bộ (khi chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

1. Cài đặt plugin (ở trên).
2. Trong phần tích hợp của Synology Chat:
   - Tạo webhook nhận vào và sao chép URL của webhook đó.
   - Tạo webhook gửi đi bằng token bí mật của bạn.
3. Trỏ URL webhook gửi đi đến Gateway OpenClaw của bạn:
   - `https://gateway-host/webhook/synology` theo mặc định.
   - Hoặc `channels.synology-chat.webhookPath` tùy chỉnh của bạn.
4. Hoàn tất thiết lập trong OpenClaw. Synology Chat xuất hiện trong cùng danh sách thiết lập kênh ở cả hai luồng:
   - Có hướng dẫn: `openclaw onboard` hoặc `openclaw channels add`
   - Trực tiếp: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Khởi động lại Gateway và gửi tin nhắn trực tiếp đến bot Synology Chat.

Chi tiết xác thực webhook:

- OpenClaw chấp nhận token webhook gửi đi từ `body.token`, sau đó là
  `?token=...`, rồi đến các header.
- Các dạng header được chấp nhận:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token trống hoặc bị thiếu sẽ bị từ chối theo cơ chế fail-closed.
- Payload có thể là `application/x-www-form-urlencoded` hoặc `application/json`; bắt buộc phải có `token`, `user_id` và `text`.

## Độ bền dữ liệu gửi đến

Sau khi vượt qua các bước kiểm tra token, chính sách người gửi và giới hạn tốc độ, OpenClaw xóa token webhook khỏi phong bì đã lưu và đưa sự kiện vào hàng đợi bền vững trước khi xác nhận. Tuyến chỉ trả về `204` sau khi thao tác ghi nối đó thành công; lỗi lưu trữ trả về `503` để Synology Chat có thể thử lại thay vì âm thầm làm mất tin nhắn.

Các sự kiện đang chờ hoặc có thể thử lại vẫn tồn tại sau khi Gateway khởi động lại. `post_id` ổn định của Synology ngăn các mục hàng đợi trùng lặp trong khi bản ghi hoàn tất đang hoạt động hoặc được giữ lại tương ứng vẫn tồn tại. Việc phân phối vẫn bảo đảm ít nhất một lần xuyên suốt quá trình chuyển giao từ hàng đợi đến tác nhân, vì vậy sự cố tại ranh giới đó vẫn có thể phát lại một lượt.

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

Đối với tài khoản mặc định, bạn có thể dùng các biến môi trường:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (phân tách bằng dấu phẩy)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Các giá trị cấu hình ghi đè biến môi trường.

Không thể đặt `SYNOLOGY_CHAT_INCOMING_URL` và `SYNOLOGY_NAS_HOST` từ `.env` của không gian làm việc; xem [Tệp `.env` của không gian làm việc](/vi/gateway/security#workspace-env-files).

## Chính sách tin nhắn trực tiếp và kiểm soát truy cập

- Các giá trị `dmPolicy` được hỗ trợ: `allowlist` (mặc định), `open` và `disabled`. Synology Chat không có luồng ghép nối; phê duyệt người gửi bằng cách thêm ID người dùng Synology dạng số của họ vào `allowedUserIds`.
- `allowedUserIds` chấp nhận danh sách (hoặc chuỗi phân tách bằng dấu phẩy) gồm các ID người dùng Synology.
- Trong chế độ `allowlist`, danh sách `allowedUserIds` trống được coi là cấu hình sai và tuyến webhook sẽ không khởi động.
- `dmPolicy: "open"` chỉ cho phép tin nhắn trực tiếp công khai khi `allowedUserIds` chứa `"*"`; với các mục hạn chế, chỉ người dùng khớp mới có thể trò chuyện. `open` với danh sách `allowedUserIds` trống cũng từ chối khởi động tuyến.
- `dmPolicy: "disabled"` chặn tin nhắn trực tiếp.
- Theo mặc định, việc liên kết người nhận phản hồi vẫn dựa trên `user_id` dạng số ổn định. `channels.synology-chat.dangerouslyAllowNameMatching: true` là chế độ tương thích khẩn cấp, bật lại việc tra cứu tên người dùng/biệt danh có thể thay đổi để phân phối phản hồi.

## Phân phối gửi đi

Dùng ID người dùng Synology Chat dạng số làm đích. Các tiền tố `synology-chat:`, `synology_chat:` và `synology:` được chấp nhận.

Ví dụ:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Văn bản gửi đi được chia thành các đoạn 2000 ký tự. Hỗ trợ gửi phương tiện bằng cách phân phối tệp dựa trên URL: NAS tải xuống và đính kèm tệp (tối đa 32 MB). URL tệp gửi đi phải dùng `http` hoặc `https`, đồng thời các đích mạng riêng tư hoặc bị chặn theo cách khác sẽ bị từ chối trước khi OpenClaw chuyển tiếp URL đến webhook NAS.

## Nhiều tài khoản

Hỗ trợ nhiều tài khoản Synology Chat trong `channels.synology-chat.accounts`.
Mỗi tài khoản có thể ghi đè token, URL nhận vào, đường dẫn webhook, chính sách tin nhắn trực tiếp và các giới hạn.
Các phiên tin nhắn trực tiếp được cô lập theo từng tài khoản và người dùng, vì vậy cùng một `user_id` dạng số
trên hai tài khoản Synology khác nhau sẽ không dùng chung trạng thái bản ghi hội thoại.
Gán cho mỗi tài khoản được bật một `webhookPath` riêng biệt. OpenClaw từ chối các đường dẫn chính xác bị trùng
và từ chối khởi động những tài khoản có tên chỉ kế thừa một đường dẫn webhook dùng chung trong thiết lập nhiều tài khoản.
Nếu bạn chủ ý cần kế thừa kiểu cũ cho một tài khoản có tên, hãy đặt
`dangerouslyAllowInheritedWebhookPath: true` trên tài khoản đó hoặc tại `channels.synology-chat`,
nhưng các đường dẫn chính xác bị trùng vẫn bị từ chối theo cơ chế fail-closed. Nên ưu tiên đường dẫn rõ ràng cho từng tài khoản.

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

- Giữ bí mật `token` và luân chuyển nếu bị lộ.
- Giữ nguyên `allowInsecureSsl: false` trừ khi bạn tin cậy rõ ràng chứng chỉ NAS cục bộ tự ký.
- Các yêu cầu webhook gửi đến được xác minh bằng token và giới hạn tốc độ theo từng người gửi (`rateLimitPerMinute`, mặc định 30).
- Các bước kiểm tra token không hợp lệ sử dụng phép so sánh bí mật theo thời gian không đổi và fail-closed; các lần thử token không hợp lệ lặp lại sẽ tạm thời khóa địa chỉ IP nguồn.
- Văn bản tin nhắn gửi đến được làm sạch để chống các mẫu chèn prompt đã biết và bị cắt ngắn ở 4000 ký tự.
- Nên ưu tiên `dmPolicy: "allowlist"` cho môi trường production.
- Giữ `dangerouslyAllowNameMatching` ở trạng thái tắt trừ khi bạn cần rõ ràng cơ chế phân phối phản hồi kiểu cũ dựa trên tên người dùng.
- Giữ `dangerouslyAllowInheritedWebhookPath` ở trạng thái tắt trừ khi bạn chấp nhận rõ ràng rủi ro định tuyến bằng đường dẫn dùng chung trong thiết lập nhiều tài khoản.

## Khắc phục sự cố

- `Missing required fields (token, user_id, text)`:
  - payload webhook gửi đi thiếu một trong các trường bắt buộc
  - nếu Synology gửi token trong header, hãy bảo đảm gateway/proxy giữ nguyên các header đó
- `Invalid token`:
  - mã bí mật của webhook gửi đi không khớp với `channels.synology-chat.token`
  - yêu cầu đang đến sai tài khoản/đường dẫn webhook
  - proxy ngược đã loại bỏ header token trước khi yêu cầu đến OpenClaw
- `Rate limit exceeded`:
  - quá nhiều lần thử token không hợp lệ từ cùng một nguồn có thể tạm thời khóa nguồn đó
  - người gửi đã xác thực cũng có một giới hạn tốc độ tin nhắn riêng cho từng người dùng
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` được bật nhưng chưa cấu hình người dùng nào
- `User not authorized`:
  - `user_id` dạng số của người gửi không nằm trong `allowedUserIds`

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát bằng lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
