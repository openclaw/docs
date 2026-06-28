---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần thiết lập LINE Webhook + thông tin xác thực
    - Bạn muốn các tùy chọn tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE kết nối với OpenClaw thông qua LINE Messaging API. Plugin chạy dưới dạng bộ nhận Webhook
trên Gateway và sử dụng channel access token + channel secret của bạn để
xác thực.

Trạng thái: Plugin có thể tải xuống. Hỗ trợ tin nhắn trực tiếp, trò chuyện nhóm, phương tiện, vị trí, Flex
messages, template messages và quick replies. Không hỗ trợ reactions và threads.

## Cài đặt

Cài đặt LINE trước khi cấu hình channel:

```bash
openclaw plugins install @openclaw/line
```

Bản checkout cục bộ (khi chạy từ git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm channel **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt channel.
4. Trong phần cài đặt Messaging API, bật **Use webhook**.
5. Đặt Webhook URL thành endpoint Gateway của bạn (bắt buộc dùng HTTPS):

```
https://gateway-host/line/webhook
```

Gateway phản hồi Webhook verification (GET) của LINE và chấp nhận các
inbound events đã ký (POST) ngay sau khi xác thực chữ ký và payload; quá trình xử lý của agent
tiếp tục bất đồng bộ.
Nếu bạn cần path tùy chỉnh, hãy đặt `channels.line.webhookPath` hoặc
`channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Ghi chú bảo mật:

- Việc xác minh chữ ký LINE phụ thuộc vào body (HMAC trên raw body), nên OpenClaw áp dụng strict pre-auth body limits và timeout trước khi xác minh.
- OpenClaw xử lý Webhook events từ raw request bytes đã được xác minh. Các giá trị `req.body` đã bị upstream middleware biến đổi sẽ bị bỏ qua để bảo đảm an toàn toàn vẹn chữ ký.

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

Biến môi trường (chỉ dành cho tài khoản mặc định):

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

`tokenFile` và `secretFile` phải trỏ đến các tệp thông thường. Symlinks bị từ chối.

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

## Kiểm soát quyền truy cập

Tin nhắn trực tiếp mặc định dùng pairing. Người gửi không xác định sẽ nhận mã pairing và
tin nhắn của họ bị bỏ qua cho đến khi được phê duyệt.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID người dùng LINE được cho phép cho DM; `dmPolicy: "open"` yêu cầu `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID người dùng LINE được cho phép cho nhóm
- Ghi đè theo từng nhóm: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups có thể được tham chiếu từ `allowFrom`, `groupAllowFrom` và `allowFrom` theo từng nhóm bằng `accessGroup:<name>`.
- Ghi chú runtime: nếu thiếu hoàn toàn `channels.line`, runtime fallback về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ có dạng:

- Người dùng: `U` + 32 ký tự hex
- Nhóm: `C` + 32 ký tự hex
- Phòng: `R` + 32 ký tự hex

## Hành vi tin nhắn

- Văn bản được chia thành các chunk 5000 ký tự.
- Định dạng Markdown bị loại bỏ; code blocks và bảng được chuyển thành Flex
  cards khi có thể.
- Phản hồi streaming được đệm; trong khi agent làm việc, LINE nhận các chunk đầy đủ kèm
  animation tải.
- Tải xuống phương tiện bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).
- Phương tiện inbound được lưu dưới `~/.openclaw/media/inbound/` trước khi chuyển cho agent,
  khớp với shared media store được các Plugin channel
  đi kèm khác sử dụng.

## Dữ liệu channel (tin nhắn phong phú)

Dùng `channelData.line` để gửi quick replies, vị trí, Flex cards hoặc template
messages.

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

LINE Plugin cũng cung cấp command `/card` cho các preset Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## Hỗ trợ ACP

LINE hỗ trợ conversation bindings ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bind cuộc trò chuyện LINE hiện tại với ACP session mà không tạo child thread.
- Các ACP bindings đã cấu hình và ACP sessions đang hoạt động được ràng buộc với cuộc trò chuyện hoạt động trên LINE giống như các conversation channels khác.

Xem [ACP agents](/vi/tools/acp-agents) để biết chi tiết.

## Phương tiện outbound

LINE Plugin hỗ trợ gửi hình ảnh, video và tệp âm thanh thông qua công cụ agent message. Phương tiện được gửi qua đường dẫn phân phối riêng cho LINE với xử lý preview và tracking phù hợp:

- **Hình ảnh**: được gửi dưới dạng LINE image messages với preview tự động được tạo.
- **Video**: được gửi với xử lý preview rõ ràng và content-type.
- **Âm thanh**: được gửi dưới dạng LINE audio messages.

URL phương tiện outbound phải là URL HTTPS công khai. OpenClaw xác thực hostname đích trước khi chuyển URL cho LINE và từ chối các mục tiêu loopback, link-local và mạng riêng.

Các lần gửi phương tiện chung sẽ fallback về route chỉ dành cho hình ảnh hiện có khi không có đường dẫn riêng cho LINE.

## Khắc phục sự cố

- **Webhook verification thất bại:** hãy bảo đảm Webhook URL dùng HTTPS và
  `channelSecret` khớp với LINE console.
- **Không có inbound events:** xác nhận Webhook path khớp với `channels.line.webhookPath`
  và Gateway có thể được LINE truy cập.
- **Lỗi tải xuống phương tiện:** nếu phương tiện vượt quá giới hạn mặc định, hãy tăng `channels.line.mediaMaxMb`.

## Liên quan

- [Tổng quan về Channels](/vi/channels) — tất cả channels được hỗ trợ
- [Pairing](/vi/channels/pairing) — xác thực DM và luồng pairing
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và mention gating
- [Định tuyến Channel](/vi/channels/channel-routing) — định tuyến session cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
