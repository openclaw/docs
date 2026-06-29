---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần cấu hình Webhook LINE và thông tin xác thực
    - Bạn cần các tham số tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE kết nối với OpenClaw thông qua LINE Messaging API. Plugin hoạt động như bộ nhận Webhook
trên Gateway và sử dụng channel access token + channel secret của bạn để
xác thực.

Trạng thái: Plugin có thể tải. Hỗ trợ tin nhắn riêng, trò chuyện nhóm, phương tiện, vị trí, Flex
messages, template messages và trả lời nhanh. Không hỗ trợ phản ứng và luồng
thảo luận.

## Cài đặt

Cài đặt LINE trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/line
```

Bản sao làm việc cục bộ (khi chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) Provider và thêm kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt kênh.
4. Bật **Use webhook** trong cài đặt Messaging API.
5. Đặt URL Webhook cho điểm cuối Gateway của bạn (yêu cầu HTTPS):

```
https://gateway-host/line/webhook
```

Gateway phản hồi kiểm tra Webhook từ LINE (GET) và xác nhận các sự kiện đến đã ký
(POST) ngay sau khi xác minh chữ ký và payload; quá trình xử lý
bởi agent tiếp tục bất đồng bộ.
Nếu cần đường dẫn tùy chỉnh, đặt `channels.line.webhookPath` hoặc
`channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Ghi chú bảo mật:

- Xác minh chữ ký LINE phụ thuộc vào nội dung yêu cầu (HMAC trên phần thân thô), vì vậy OpenClaw áp dụng giới hạn kích thước phần thân nghiêm ngặt và thời gian chờ trước xác thực trước khi xác minh.
- OpenClaw xử lý sự kiện Webhook từ các byte yêu cầu thô đã xác minh. Các giá trị `req.body` được middleware phía trước chuyển đổi sẽ bị bỏ qua để giữ nguyên tính toàn vẹn của chữ ký.

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

Cấu hình tin nhắn riêng mở:

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

`tokenFile` và `secretFile` phải trỏ đến các tệp thông thường. Liên kết tượng trưng sẽ bị từ chối.

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

## Quản lý quyền truy cập

Theo mặc định, tin nhắn riêng yêu cầu ghép đôi. Người gửi không xác định nhận mã ghép đôi, và
tin nhắn của họ bị bỏ qua cho đến khi được phê duyệt.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID người dùng LINE được phép cho tin nhắn riêng; `dmPolicy: "open"` yêu cầu `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID người dùng LINE được phép cho nhóm
- Ghi đè cho từng nhóm riêng lẻ: `channels.line.groups.<groupId>.allowFrom`
- Có thể tham chiếu các nhóm quyền truy cập người gửi tĩnh từ `allowFrom`, `groupAllowFrom` và `allowFrom` của nhóm thông qua `accessGroup:<name>`.
- Ghi chú về runtime: nếu `channels.line` hoàn toàn vắng mặt, runtime sẽ quay về `groupPolicy="allowlist"` cho các kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ có dạng:

- Người dùng: `U` + 32 ký tự thập lục phân
- Nhóm: `C` + 32 ký tự thập lục phân
- Phòng: `R` + 32 ký tự thập lục phân

## Hành vi tin nhắn

- Văn bản được chia thành các đoạn 5000 ký tự.
- Định dạng Markdown bị loại bỏ; khối mã và bảng được chuyển đổi thành Flex
  cards khi có thể.
- Phản hồi phát trực tuyến được đệm; LINE nhận các đoạn hoàn chỉnh kèm hoạt ảnh tải
  trong khi agent đang chạy.
- Tải xuống phương tiện bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).
- Phương tiện đến được lưu vào `~/.openclaw/media/inbound/` trước khi chuyển cho
  agent, phù hợp với kho phương tiện chung được các kênh Plugin tích hợp khác sử dụng.

## Dữ liệu kênh (tin nhắn mở rộng)

Sử dụng `channelData.line` để gửi trả lời nhanh, vị trí, Flex cards hoặc template
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

Plugin LINE cũng đi kèm lệnh `/card` cho các preset Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## Hỗ trợ ACP

LINE hỗ trợ liên kết cuộc trò chuyện ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` liên kết cuộc trò chuyện LINE hiện tại với phiên ACP mà không tạo luồng thảo luận con.
- Các liên kết ACP đã cấu hình và phiên ACP đang hoạt động được liên kết với cuộc trò chuyện hoạt động trong LINE giống như trong các kênh trò chuyện khác.

Xem [agent ACP](/vi/tools/acp-agents) để biết chi tiết.

## Phương tiện gửi đi

Plugin LINE hỗ trợ gửi hình ảnh, video và tệp âm thanh thông qua công cụ tin nhắn của agent. Phương tiện được gửi qua đường dẫn phân phối dành riêng cho LINE với xử lý xem trước và theo dõi phù hợp:

- **Hình ảnh**: được gửi dưới dạng tin nhắn hình ảnh LINE với tự động tạo bản xem trước.
- **Video**: được gửi với xử lý rõ ràng về bản xem trước và loại nội dung.
- **Âm thanh**: được gửi dưới dạng tin nhắn âm thanh LINE.

URL phương tiện gửi đi phải là URL HTTPS công khai. OpenClaw kiểm tra tên máy chủ đích trước khi chuyển URL cho LINE và từ chối local loopback, link-local và các đích trong mạng riêng.

Các lượt gửi phương tiện chung sẽ quay về tuyến hiện có chỉ dành cho hình ảnh khi đường dẫn dành riêng cho LINE không khả dụng.

## Khắc phục sự cố

- **Kiểm tra Webhook không thành công:** hãy đảm bảo URL Webhook sử dụng HTTPS và
  `channelSecret` khớp với LINE console.
- **Không có sự kiện đến:** xác nhận đường dẫn Webhook khớp với `channels.line.webhookPath`
  và Gateway có thể truy cập được từ LINE.
- **Lỗi tải xuống phương tiện:** tăng `channels.line.mediaMaxMb` nếu phương tiện vượt quá
  giới hạn mặc định.

## Xem thêm

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực tin nhắn riêng và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và giới hạn theo lượt nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo vệ
