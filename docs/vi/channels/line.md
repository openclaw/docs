---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần thiết lập Webhook LINE + thông tin xác thực
    - Bạn muốn các tùy chọn tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng Plugin LINE Messaging API
title: DÒNG
x-i18n:
    generated_at: "2026-04-29T22:26:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE kết nối với OpenClaw qua LINE Messaging API. Plugin chạy như một webhook
receiver trên Gateway và dùng channel access token + channel secret của bạn để
xác thực.

Trạng thái: Plugin đóng gói kèm. Tin nhắn trực tiếp, trò chuyện nhóm, media, vị trí, Flex
messages, template messages và quick replies được hỗ trợ. Reactions và threads
không được hỗ trợ.

## Plugin đóng gói kèm

LINE được phát hành dưới dạng Plugin đóng gói kèm trong các bản phát hành OpenClaw hiện tại, vì vậy các bản dựng
đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ LINE, hãy cài đặt
gói npm hiện tại khi gói đó được phát hành:

```bash
openclaw plugins install @openclaw/line
```

Nếu npm báo gói do OpenClaw sở hữu đã ngừng dùng hoặc bị thiếu, hãy dùng
bản dựng OpenClaw đóng gói hiện tại hoặc bản checkout cục bộ cho đến khi luồng gói npm
bắt kịp.

Checkout cục bộ (khi chạy từ git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt kênh.
4. Bật **Use webhook** trong phần cài đặt Messaging API.
5. Đặt URL webhook thành endpoint Gateway của bạn (bắt buộc HTTPS):

```
https://gateway-host/line/webhook
```

Gateway phản hồi bước xác minh webhook của LINE (GET) và các sự kiện đầu vào (POST).
Nếu bạn cần một đường dẫn tùy chỉnh, hãy đặt `channels.line.webhookPath` hoặc
`channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Ghi chú bảo mật:

- Việc xác minh chữ ký LINE phụ thuộc vào body (HMAC trên raw body), nên OpenClaw áp dụng giới hạn body trước xác thực nghiêm ngặt và timeout trước khi xác minh.
- OpenClaw xử lý sự kiện webhook từ các byte yêu cầu raw đã xác minh. Các giá trị `req.body` đã bị middleware upstream biến đổi sẽ bị bỏ qua để bảo đảm toàn vẹn chữ ký.

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

`tokenFile` và `secretFile` phải trỏ đến các tệp thông thường. Symlink bị từ chối.

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

Tin nhắn trực tiếp mặc định dùng ghép đôi. Người gửi chưa biết sẽ nhận mã ghép đôi và
tin nhắn của họ bị bỏ qua cho đến khi được phê duyệt.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID người dùng LINE trong danh sách cho phép cho DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID người dùng LINE trong danh sách cho phép cho nhóm
- Ghi đè theo nhóm: `channels.line.groups.<groupId>.allowFrom`
- Ghi chú runtime: nếu `channels.line` hoàn toàn bị thiếu, runtime sẽ fallback về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ có dạng:

- Người dùng: `U` + 32 ký tự hex
- Nhóm: `C` + 32 ký tự hex
- Phòng: `R` + 32 ký tự hex

## Hành vi tin nhắn

- Văn bản được chia thành các đoạn 5000 ký tự.
- Định dạng Markdown bị loại bỏ; code blocks và bảng được chuyển thành Flex
  cards khi có thể.
- Phản hồi streaming được buffer; LINE nhận các đoạn đầy đủ kèm hoạt ảnh loading
  trong khi agent làm việc.
- Tải xuống media bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).
- Media đầu vào được lưu trong `~/.openclaw/media/inbound/` trước khi được chuyển
  cho agent, khớp với kho media dùng chung được các Plugin kênh đóng gói kèm khác sử dụng.

## Dữ liệu kênh (tin nhắn phong phú)

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

Plugin LINE cũng đi kèm lệnh `/card` cho các preset Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## Hỗ trợ ACP

LINE hỗ trợ binding hội thoại ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` bind cuộc trò chuyện LINE hiện tại với một phiên ACP mà không tạo thread con.
- Các binding ACP đã cấu hình và phiên ACP đang hoạt động được bind với hội thoại hoạt động trên LINE như các kênh hội thoại khác.

Xem [agent ACP](/vi/tools/acp-agents) để biết chi tiết.

## Media gửi đi

Plugin LINE hỗ trợ gửi hình ảnh, video và tệp âm thanh thông qua công cụ tin nhắn của agent. Media được gửi qua đường dẫn phân phối riêng cho LINE với xử lý xem trước và theo dõi phù hợp:

- **Hình ảnh**: được gửi dưới dạng tin nhắn hình ảnh LINE với tạo bản xem trước tự động.
- **Video**: được gửi với xử lý bản xem trước và content-type rõ ràng.
- **Âm thanh**: được gửi dưới dạng tin nhắn âm thanh LINE.

URL media gửi đi phải là URL HTTPS công khai. OpenClaw xác thực hostname đích trước khi chuyển URL cho LINE và từ chối các mục tiêu loopback, link-local và mạng riêng.

Các lần gửi media chung fallback về route chỉ dành cho hình ảnh hiện có khi không có đường dẫn riêng cho LINE.

## Khắc phục sự cố

- **Xác minh webhook thất bại:** hãy bảo đảm URL webhook là HTTPS và
  `channelSecret` khớp với console LINE.
- **Không có sự kiện đầu vào:** xác nhận đường dẫn webhook khớp với `channels.line.webhookPath`
  và Gateway có thể truy cập được từ LINE.
- **Lỗi tải xuống media:** tăng `channels.line.mediaMaxMb` nếu media vượt quá
  giới hạn mặc định.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng mention
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
