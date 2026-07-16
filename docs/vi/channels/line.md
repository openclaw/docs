---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần thiết lập Webhook LINE và thông tin xác thực
    - Bạn muốn các tùy chọn tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-16T14:50:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE kết nối với OpenClaw qua LINE Messaging API. Plugin chạy dưới dạng trình nhận webhook
trên Gateway và sử dụng mã truy cập kênh + khóa bí mật kênh của bạn để
xác thực.

Trạng thái: plugin chính thức, được cài đặt riêng. Hỗ trợ tin nhắn trực tiếp, trò chuyện nhóm, phương tiện,
vị trí, tin nhắn Flex, tin nhắn mẫu và trả lời nhanh.
Không hỗ trợ phản ứng và luồng.

## Cài đặt

Cài đặt LINE trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/line
```

Bản sao cục bộ (khi chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt kênh.
4. Bật **Use webhook** trong phần cài đặt Messaging API.
5. Đặt URL webhook thành điểm cuối Gateway của bạn (bắt buộc HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway phản hồi yêu cầu xác minh webhook (GET) của LINE và xác nhận ngay
các sự kiện đầu vào đã ký (POST) sau khi xác thực chữ ký và tải trọng; quá trình xử lý của tác nhân
tiếp tục bất đồng bộ.
Nếu cần đường dẫn tùy chỉnh, hãy đặt `channels.line.webhookPath` hoặc
`channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Lưu ý bảo mật:

- Việc xác minh chữ ký LINE phụ thuộc vào phần thân (HMAC trên phần thân thô), vì vậy OpenClaw áp dụng giới hạn nghiêm ngặt cho phần thân trước xác thực (64 KB) và thời gian chờ đọc trước khi xác minh.
- OpenClaw xử lý các sự kiện webhook từ các byte yêu cầu thô đã xác minh. Các giá trị `req.body` đã bị phần mềm trung gian phía trên biến đổi sẽ bị bỏ qua để bảo đảm tính toàn vẹn của chữ ký.

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

Cấu hình tin nhắn trực tiếp công khai:

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

Tệp mã truy cập/khóa bí mật:

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

`tokenFile` và `secretFile` phải trỏ đến các tệp thông thường. Liên kết tượng trưng bị từ chối.
Giá trị cấu hình nội tuyến được ưu tiên hơn tệp; biến môi trường là phương án dự phòng cuối cùng cho tài khoản mặc định.

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

Tin nhắn trực tiếp mặc định sử dụng ghép nối. Người gửi không xác định nhận được mã ghép nối và
tin nhắn của họ bị bỏ qua cho đến khi được phê duyệt:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định `pairing`)
- `channels.line.allowFrom`: các ID người dùng LINE trong danh sách cho phép đối với tin nhắn trực tiếp; `dmPolicy: "open"` yêu cầu `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (mặc định `allowlist`)
- `channels.line.groupAllowFrom`: các ID người dùng LINE trong danh sách cho phép đối với nhóm; các mục `allowFrom` của tin nhắn trực tiếp không cho phép người gửi trong nhóm
- Ghi đè theo từng nhóm: `channels.line.groups.<groupId>.allowFrom` (cộng với `enabled`, `requireMention`, `systemPrompt`, `skills`). Với
  `groupPolicy: "allowlist"`, hãy đặt `groupAllowFrom` hoặc `allowFrom` theo từng nhóm; danh sách cho phép nhóm trống sẽ chặn tin nhắn nhóm ngay cả khi tin nhắn trực tiếp được mở.
- Có thể tham chiếu các nhóm truy cập người gửi tĩnh từ `allowFrom`, `groupAllowFrom` và `allowFrom` theo từng nhóm bằng `accessGroup:<name>`; xem [Nhóm truy cập](/vi/channels/access-groups).
- Lưu ý về thời gian chạy: nếu hoàn toàn thiếu `channels.line`, thời gian chạy sẽ dùng dự phòng `groupPolicy="allowlist"` để kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ có dạng:

- Người dùng: `U` + 32 ký tự hex
- Nhóm: `C` + 32 ký tự hex
- Phòng: `R` + 32 ký tự hex

## Hành vi tin nhắn

- Văn bản được chia thành các đoạn tối đa 5000 ký tự.
- Định dạng Markdown bị loại bỏ; khối mã và bảng được chuyển thành thẻ Flex
  khi có thể.
- Phản hồi truyền phát được lưu vào bộ đệm; LINE nhận các đoạn hoàn chỉnh kèm hoạt ảnh
  tải trong khi tác nhân làm việc.
- Dung lượng tải xuống phương tiện bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).
- Phương tiện đầu vào được lưu trong `~/.openclaw/media/inbound/` trước khi được chuyển
  cho tác nhân, phù hợp với kho phương tiện dùng chung mà các plugin kênh khác sử dụng.

## Dữ liệu kênh (tin nhắn phong phú)

Sử dụng `channelData.line` để gửi trả lời nhanh, vị trí, thẻ Flex hoặc tin nhắn
mẫu.

```json5
{
  text: "Đây nhé",
  channelData: {
    line: {
      quickReplies: ["Trạng thái", "Trợ giúp"],
      location: {
        title: "Văn phòng",
        address: "123 Phố Main",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Thẻ trạng thái",
        contents: {/* Tải trọng Flex */},
      },
      templateMessage: {
        type: "confirm",
        text: "Tiếp tục?",
        confirmLabel: "Có",
        confirmData: "yes",
        cancelLabel: "Không",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE cũng cung cấp lệnh `/card` cho các mẫu đặt trước của tin nhắn Flex:

```text
/card info "Chào mừng" "Cảm ơn bạn đã tham gia!"
```

## Hỗ trợ ACP

LINE hỗ trợ liên kết cuộc hội thoại ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` liên kết cuộc trò chuyện LINE hiện tại với một phiên ACP mà không tạo luồng con.
- Các liên kết ACP đã cấu hình và phiên ACP đang hoạt động được liên kết với cuộc hội thoại hoạt động trên LINE giống như các kênh hội thoại khác.

Xem [tác nhân ACP](/vi/tools/acp-agents) để biết chi tiết.

## Phương tiện gửi đi

Plugin LINE gửi hình ảnh, video và âm thanh qua công cụ tin nhắn của tác nhân:

- **Hình ảnh**: được gửi dưới dạng tin nhắn hình ảnh LINE; hình ảnh xem trước mặc định là URL phương tiện.
- **Video**: yêu cầu hình ảnh xem trước; đặt `channelData.line.previewImageUrl` thành URL hình ảnh.
- **Âm thanh**: được gửi dưới dạng tin nhắn âm thanh LINE; thời lượng mặc định là 60 giây trừ khi đặt `channelData.line.durationMs`.

Loại phương tiện được lấy từ `channelData.line.mediaKind` khi được đặt, nếu không sẽ được suy luận
từ các tùy chọn LINE khác hoặc hậu tố tệp trong URL, với hình ảnh làm phương án dự phòng.

URL phương tiện gửi đi phải là URL HTTPS công khai dài tối đa 2000 ký tự. OpenClaw
xác thực tên máy chủ đích trước khi chuyển URL cho LINE và từ chối các đích loopback,
link-local và mạng riêng.

Các lượt gửi phương tiện chung không có tùy chọn dành riêng cho LINE sẽ sử dụng tuyến hình ảnh.

## Khắc phục sự cố

- **Xác minh webhook không thành công:** bảo đảm URL webhook sử dụng HTTPS và
  `channelSecret` khớp với LINE Console.
- **Không có sự kiện đầu vào:** xác nhận đường dẫn webhook khớp với `channels.line.webhookPath`
  và LINE có thể truy cập Gateway.
- **Lỗi tải xuống phương tiện:** tăng `channels.line.mediaMaxMb` nếu phương tiện vượt quá
  giới hạn mặc định.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
