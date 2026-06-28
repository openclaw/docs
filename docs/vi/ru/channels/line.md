---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần cấu hình Webhook LINE và thông tin xác thực
    - Bạn cần các tham số tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:45:23Z"
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

Trạng thái: Plugin có thể tải. Hỗ trợ tin nhắn cá nhân, trò chuyện nhóm, media, vị trí, Flex
messages, template messages và trả lời nhanh. Không hỗ trợ reaction và thread.

## Cài đặt

Cài đặt LINE trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/line
```

Bản sao làm việc cục bộ (khi chạy từ git repository):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Cấu hình

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) Provider và thêm kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt kênh.
4. Bật **Use webhook** trong phần cài đặt Messaging API.
5. Đặt URL Webhook cho endpoint Gateway của bạn (yêu cầu HTTPS):

```
https://gateway-host/line/webhook
```

Gateway phản hồi kiểm tra Webhook của LINE (GET) và xác nhận các sự kiện đến đã ký
(POST) ngay sau khi kiểm tra chữ ký và payload; quá trình xử lý
bởi agent tiếp tục bất đồng bộ.
Nếu cần đường dẫn tùy chỉnh, đặt `channels.line.webhookPath` hoặc
`channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Ghi chú bảo mật:

- Việc kiểm tra chữ ký LINE phụ thuộc vào thân yêu cầu (HMAC trên thân thô), vì vậy OpenClaw áp dụng giới hạn kích thước thân nghiêm ngặt và thời gian chờ trước xác thực trước khi kiểm tra.
- OpenClaw xử lý sự kiện Webhook từ các byte yêu cầu thô đã xác minh. Giá trị `req.body` do middleware phía trước chuyển đổi sẽ bị bỏ qua để giữ toàn vẹn chữ ký.

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

Cấu hình tin nhắn cá nhân mở:

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

`tokenFile` và `secretFile` phải trỏ đến tệp thông thường. Symbolic link bị từ chối.

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

Theo mặc định, tin nhắn cá nhân yêu cầu ghép đôi. Người gửi không xác định sẽ nhận mã ghép đôi, và
tin nhắn của họ bị bỏ qua cho đến khi được phê duyệt.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID người dùng LINE được phép cho tin nhắn cá nhân; `dmPolicy: "open"` yêu cầu `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID người dùng LINE được phép cho nhóm
- Ghi đè cho từng nhóm: `channels.line.groups.<groupId>.allowFrom`
- Có thể tham chiếu các nhóm truy cập người gửi tĩnh từ `allowFrom`, `groupAllowFrom` và `allowFrom` của nhóm bằng `accessGroup:<name>`.
- Ghi chú về runtime: nếu `channels.line` hoàn toàn không có, runtime quay về `groupPolicy="allowlist"` cho các kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ có dạng:

- Người dùng: `U` + 32 ký tự thập lục phân
- Nhóm: `C` + 32 ký tự thập lục phân
- Phòng: `R` + 32 ký tự thập lục phân

## Hành vi tin nhắn

- Văn bản được chia thành các phần 5000 ký tự.
- Định dạng Markdown bị loại bỏ; khối mã và bảng được chuyển đổi thành thẻ Flex
  khi có thể.
- Phản hồi streaming được đệm; LINE nhận các phần hoàn chỉnh kèm hiệu ứng loading
  trong khi agent đang chạy.
- Tải media xuống bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).
- Media đến được lưu trong `~/.openclaw/media/inbound/` trước khi chuyển cho
  agent, khớp với kho lưu trữ media chung được các Plugin kênh tích hợp khác sử dụng.

## Dữ liệu kênh (tin nhắn mở rộng)

Dùng `channelData.line` để gửi trả lời nhanh, vị trí, thẻ Flex hoặc template
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

- `/acp spawn <agent> --bind here` liên kết cuộc trò chuyện LINE hiện tại với phiên ACP mà không tạo thread con.
- Các liên kết ACP đã cấu hình và phiên ACP đang hoạt động được liên kết với cuộc trò chuyện hoạt động trong LINE giống như trong các kênh hội thoại khác.

Xem [agent ACP](/vi/tools/acp-agents) để biết chi tiết.

## Media gửi đi

Plugin LINE hỗ trợ gửi hình ảnh, video và tệp âm thanh thông qua công cụ tin nhắn của agent. Media được gửi qua đường dẫn phân phối dành riêng cho LINE với xử lý preview và theo dõi phù hợp:

- **Hình ảnh**: được gửi dưới dạng tin nhắn hình ảnh LINE với tạo preview tự động.
- **Video**: được gửi với xử lý preview và loại nội dung rõ ràng.
- **Âm thanh**: được gửi dưới dạng tin nhắn âm thanh LINE.

URL media gửi đi phải là URL HTTPS công khai. OpenClaw kiểm tra tên máy chủ đích trước khi chuyển URL cho LINE và từ chối local loopback, link-local và đích trong mạng riêng.

Các lượt gửi media chung quay về tuyến hiện có chỉ dành cho hình ảnh khi đường dẫn dành riêng cho LINE không khả dụng.

## Khắc phục sự cố

- **Kiểm tra Webhook không thành công:** hãy đảm bảo URL Webhook dùng HTTPS và
  `channelSecret` khớp với LINE console.
- **Không có sự kiện đến:** xác nhận đường dẫn Webhook khớp với `channels.line.webhookPath`
  và Gateway có thể truy cập từ LINE.
- **Lỗi tải media xuống:** tăng `channels.line.mediaMaxMb` nếu media vượt quá
  giới hạn mặc định.

## Xem thêm

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực tin nhắn cá nhân và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và giới hạn theo lượt nhắc
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo vệ
