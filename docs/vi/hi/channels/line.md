---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần thiết lập LINE Webhook + thông tin xác thực
    - Bạn muốn các tùy chọn tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE kết nối với OpenClaw thông qua LINE Messaging API. Plugin chạy dưới dạng bộ nhận Webhook trên Gateway và sử dụng channel access token + channel secret của bạn để xác thực.

Trạng thái: Plugin có thể tải xuống. Hỗ trợ tin nhắn trực tiếp, trò chuyện nhóm, phương tiện, vị trí, Flex messages, template messages và trả lời nhanh. Không hỗ trợ reactions và threads.

## Cài đặt

Cài đặt LINE trước khi cấu hình channel:

```bash
openclaw plugins install @openclaw/line
```

Checkout cục bộ (khi chạy từ git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm channel **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt channel.
4. Trong phần cài đặt Messaging API, bật **Use webhook**.
5. Đặt Webhook URL thành endpoint Gateway của bạn (bắt buộc HTTPS):

```
https://gateway-host/line/webhook
```

Gateway phản hồi Webhook verification (GET) của LINE và chấp nhận signed inbound events (POST) ngay sau khi xác thực signature và payload; quá trình xử lý agent tiếp tục bất đồng bộ.
Nếu bạn cần đường dẫn tùy chỉnh, hãy đặt `channels.line.webhookPath` hoặc `channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Ghi chú bảo mật:

- LINE signature verification phụ thuộc vào body (HMAC trên raw body), vì vậy OpenClaw áp dụng strict pre-auth body limits và timeout trước khi verification.
- OpenClaw xử lý Webhook events từ raw request bytes đã được xác minh. Để đảm bảo an toàn về signature-integrity, các giá trị `req.body` đã bị upstream middleware biến đổi sẽ bị bỏ qua.

## Cấu hình

Cấu hình tối thiểu:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Cấu hình DM công khai:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Biến môi trường (chỉ tài khoản mặc định):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Tệp token/secret:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` và `secretFile` phải trỏ đến regular files. Symlinks bị từ chối.

Nhiều tài khoản:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Kiểm soát truy cập

Direct messages mặc định dùng pairing. Những người gửi không xác định sẽ nhận được pairing code và messages của họ bị bỏ qua cho đến khi được phê duyệt.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists và policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user IDs trong allowlist cho DMs; `dmPolicy: "open"` yêu cầu `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user IDs trong allowlist cho groups
- Ghi đè theo từng group: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups có thể được tham chiếu từ `allowFrom`, `groupAllowFrom` và `allowFrom` theo từng group bằng `accessGroup:<name>`.
- Ghi chú runtime: nếu thiếu hoàn toàn `channels.line`, runtime fallback về `groupPolicy="allowlist"` cho group checks (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

LINE IDs phân biệt chữ hoa chữ thường. IDs hợp lệ có dạng:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Hành vi tin nhắn

- Text được chia thành chunks ở mức 5000 characters.
- Markdown formatting bị loại bỏ; code blocks và tables được chuyển thành Flex cards khi có thể.
- Streaming responses được buffered; LINE nhận toàn bộ chunks kèm loading animation trong khi agent đang làm việc.
- Media downloads bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).
- Inbound media được lưu dưới `~/.openclaw/media/inbound/` trước khi được chuyển tới agent, khớp với shared media store mà các bundled channel plugins khác sử dụng.

## Dữ liệu channel (tin nhắn phong phú)

Sử dụng `channelData.line` để gửi quick replies, locations, Flex cards hoặc template messages.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin cũng ship lệnh `/card` cho các preset Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## Hỗ trợ ACP

LINE hỗ trợ các conversation bindings ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bind LINE chat hiện tại với ACP session mà không tạo child thread.
- Configured ACP bindings và active conversation-bound ACP sessions hoạt động trên LINE giống như các conversation channels khác.

Xem [ACP agents](/vi/tools/acp-agents) để biết chi tiết.

## Phương tiện gửi đi

LINE Plugin hỗ trợ gửi images, videos và audio files thông qua agent message tool. Media được gửi qua đường dẫn phân phối riêng cho LINE với preview và tracking handling phù hợp:

- **Images**: được gửi dưới dạng LINE image messages với automatic preview generation.
- **Videos**: được gửi với explicit preview và content-type handling.
- **Audio**: được gửi dưới dạng LINE audio messages.

Outbound media URLs phải là public HTTPS URLs. OpenClaw xác thực target hostname trước khi chuyển URL cho LINE và từ chối loopback, link-local và private-network targets.

Generic media sends fallback về existing image-only route khi không có LINE-specific path.

## Khắc phục sự cố

- **Webhook verification fails:** Đảm bảo Webhook URL dùng HTTPS và `channelSecret` khớp với LINE console.
- **No inbound events:** Xác nhận Webhook path khớp với `channels.line.webhookPath` và Gateway có thể được LINE truy cập.
- **Media download errors:** Nếu media vượt quá giới hạn mặc định, hãy tăng `channels.line.mediaMaxMb`.

## Liên quan

- [Tổng quan Channels](/vi/channels) — tất cả channels được hỗ trợ
- [Pairing](/vi/channels/pairing) — xác thực DM và pairing flow
- [Groups](/vi/channels/groups) — hành vi group chat và mention gating
- [Channel Routing](/vi/channels/channel-routing) — session routing cho messages
- [Bảo mật](/vi/gateway/security) — access model và hardening
