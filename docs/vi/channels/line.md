---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần thiết lập webhook LINE và thông tin xác thực
    - Bạn muốn các tùy chọn tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng Plugin LINE Messaging API
title: DÒNG
x-i18n:
    generated_at: "2026-05-06T09:03:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE kết nối với OpenClaw qua LINE Messaging API. Plugin chạy dưới dạng bộ nhận Webhook
trên Gateway và dùng channel access token + channel secret của bạn để
xác thực.

Trạng thái: Plugin có thể tải xuống. Hỗ trợ tin nhắn trực tiếp, trò chuyện nhóm, phương tiện, vị trí, tin nhắn Flex,
tin nhắn mẫu và trả lời nhanh. Không hỗ trợ phản ứng và luồng.

## Cài đặt

Cài đặt LINE trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/line
```

Checkout cục bộ (khi chạy từ một kho git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt kênh.
4. Bật **Use webhook** trong cài đặt Messaging API.
5. Đặt URL Webhook thành endpoint Gateway của bạn (bắt buộc HTTPS):

```
https://gateway-host/line/webhook
```

Gateway phản hồi xác minh Webhook của LINE (GET) và sự kiện gửi vào (POST).
Nếu cần đường dẫn tùy chỉnh, đặt `channels.line.webhookPath` hoặc
`channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Ghi chú bảo mật:

- Việc xác minh chữ ký LINE phụ thuộc vào phần thân (HMAC trên phần thân thô), vì vậy OpenClaw áp dụng giới hạn phần thân trước xác thực và thời gian chờ nghiêm ngặt trước khi xác minh.
- OpenClaw xử lý sự kiện Webhook từ các byte yêu cầu thô đã xác minh. Các giá trị `req.body` đã bị middleware thượng nguồn biến đổi sẽ bị bỏ qua để bảo đảm tính toàn vẹn chữ ký.

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

`tokenFile` và `secretFile` phải trỏ đến các tệp thông thường. Symlink sẽ bị từ chối.

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

Tin nhắn trực tiếp mặc định dùng ghép đôi. Người gửi không xác định nhận được mã ghép đôi và
tin nhắn của họ sẽ bị bỏ qua cho đến khi được phê duyệt.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID người dùng LINE trong danh sách cho phép cho DM; `dmPolicy: "open"` yêu cầu `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID người dùng LINE trong danh sách cho phép cho nhóm
- Ghi đè theo nhóm: `channels.line.groups.<groupId>.allowFrom`
- Ghi chú runtime: nếu `channels.line` hoàn toàn không có, runtime sẽ quay về `groupPolicy="allowlist"` cho các kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ có dạng:

- Người dùng: `U` + 32 ký tự hex
- Nhóm: `C` + 32 ký tự hex
- Phòng: `R` + 32 ký tự hex

## Hành vi tin nhắn

- Văn bản được chia thành các đoạn 5000 ký tự.
- Định dạng Markdown bị loại bỏ; khối mã và bảng được chuyển thành thẻ Flex
  khi có thể.
- Phản hồi phát trực tiếp được đệm; LINE nhận các đoạn đầy đủ kèm hoạt ảnh tải
  trong khi agent làm việc.
- Tải xuống phương tiện bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).
- Phương tiện gửi vào được lưu trong `~/.openclaw/media/inbound/` trước khi được chuyển
  cho agent, khớp với kho phương tiện dùng chung được các Plugin kênh đóng gói khác sử dụng.

## Dữ liệu kênh (tin nhắn phong phú)

Dùng `channelData.line` để gửi trả lời nhanh, vị trí, thẻ Flex hoặc tin nhắn mẫu.

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

Plugin LINE cũng cung cấp lệnh `/card` cho các preset tin nhắn Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Hỗ trợ ACP

LINE hỗ trợ liên kết hội thoại ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` liên kết cuộc trò chuyện LINE hiện tại với một phiên ACP mà không tạo luồng con.
- Các liên kết ACP đã cấu hình và phiên ACP đang hoạt động được liên kết với hội thoại hoạt động trên LINE giống như các kênh hội thoại khác.

Xem [agent ACP](/vi/tools/acp-agents) để biết chi tiết.

## Phương tiện gửi ra

Plugin LINE hỗ trợ gửi hình ảnh, video và tệp âm thanh thông qua công cụ tin nhắn của agent. Phương tiện được gửi qua đường dẫn phân phối riêng của LINE với xử lý xem trước và theo dõi phù hợp:

- **Hình ảnh**: được gửi dưới dạng tin nhắn hình ảnh LINE với tính năng tự động tạo bản xem trước.
- **Video**: được gửi với xử lý bản xem trước và loại nội dung rõ ràng.
- **Âm thanh**: được gửi dưới dạng tin nhắn âm thanh LINE.

URL phương tiện gửi ra phải là URL HTTPS công khai. OpenClaw xác thực hostname đích trước khi chuyển URL cho LINE và từ chối các đích local loopback, link-local và mạng riêng.

Các lần gửi phương tiện chung sẽ quay về tuyến chỉ hỗ trợ hình ảnh hiện có khi không có đường dẫn riêng cho LINE.

## Khắc phục sự cố

- **Xác minh Webhook thất bại:** bảo đảm URL Webhook dùng HTTPS và
  `channelSecret` khớp với console LINE.
- **Không có sự kiện gửi vào:** xác nhận đường dẫn Webhook khớp với `channels.line.webhookPath`
  và Gateway có thể được LINE truy cập.
- **Lỗi tải xuống phương tiện:** tăng `channels.line.mediaMaxMb` nếu phương tiện vượt quá
  giới hạn mặc định.

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng kiểm tra nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
