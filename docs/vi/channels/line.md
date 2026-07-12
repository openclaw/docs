---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần thiết lập Webhook LINE và thông tin xác thực
    - Bạn muốn các tùy chọn tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T07:43:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE kết nối với OpenClaw qua LINE Messaging API. Plugin chạy trên Gateway dưới dạng bộ nhận Webhook và sử dụng mã truy cập kênh + bí mật kênh của bạn để xác thực.

Trạng thái: Plugin chính thức, được cài đặt riêng. Hỗ trợ tin nhắn trực tiếp, trò chuyện nhóm, nội dung đa phương tiện, vị trí, tin nhắn Flex, tin nhắn mẫu và câu trả lời nhanh.
Không hỗ trợ cảm xúc và luồng hội thoại.

## Cài đặt

Cài đặt LINE trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/line
```

Bản mã nguồn cục bộ (khi chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt kênh.
4. Bật **Use webhook** trong phần cài đặt Messaging API.
5. Đặt URL Webhook thành điểm cuối Gateway của bạn (bắt buộc dùng HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway phản hồi yêu cầu xác minh Webhook của LINE (GET) và xác nhận ngay các sự kiện đến đã ký (POST) sau khi xác thực chữ ký và tải trọng; quá trình xử lý của tác nhân tiếp tục bất đồng bộ.
Nếu cần đường dẫn tùy chỉnh, hãy đặt `channels.line.webhookPath` hoặc
`channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Lưu ý bảo mật:

- Việc xác minh chữ ký LINE phụ thuộc vào phần thân (HMAC trên phần thân thô), vì vậy OpenClaw áp dụng giới hạn nghiêm ngặt 64 KB cho phần thân trước khi xác thực và thời gian chờ đọc trước khi xác minh.
- OpenClaw xử lý các sự kiện Webhook từ các byte yêu cầu thô đã xác minh. Các giá trị `req.body` bị phần mềm trung gian phía trước biến đổi sẽ bị bỏ qua để bảo đảm tính toàn vẹn của chữ ký.

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

Biến môi trường (chỉ dành cho tài khoản mặc định):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Tệp mã truy cập/bí mật:

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

Tin nhắn trực tiếp mặc định sử dụng ghép nối. Người gửi không xác định sẽ nhận được mã ghép nối và tin nhắn của họ bị bỏ qua cho đến khi được phê duyệt:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định `pairing`)
- `channels.line.allowFrom`: các ID người dùng LINE trong danh sách cho phép đối với tin nhắn trực tiếp; `dmPolicy: "open"` yêu cầu `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (mặc định `allowlist`)
- `channels.line.groupAllowFrom`: các ID người dùng LINE trong danh sách cho phép đối với nhóm
- Ghi đè theo nhóm: `channels.line.groups.<groupId>.allowFrom` (cùng với `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Có thể tham chiếu các nhóm truy cập tĩnh dành cho người gửi từ `allowFrom`, `groupAllowFrom` và `allowFrom` theo nhóm bằng `accessGroup:<name>`; xem [Nhóm truy cập](/vi/channels/access-groups).
- Lưu ý về thời gian chạy: nếu hoàn toàn không có `channels.line`, thời gian chạy sẽ dùng dự phòng `groupPolicy="allowlist"` khi kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ có dạng:

- Người dùng: `U` + 32 ký tự thập lục phân
- Nhóm: `C` + 32 ký tự thập lục phân
- Phòng: `R` + 32 ký tự thập lục phân

## Hành vi tin nhắn

- Văn bản được chia thành các đoạn dài tối đa 5000 ký tự.
- Định dạng Markdown bị loại bỏ; khối mã và bảng được chuyển đổi thành thẻ Flex khi có thể.
- Phản hồi truyền phát được lưu vào bộ đệm; LINE nhận các đoạn hoàn chỉnh kèm ảnh động tải trong khi tác nhân làm việc.
- Kích thước tải xuống nội dung đa phương tiện bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định là 10).
- Nội dung đa phương tiện đến được lưu trong `~/.openclaw/media/inbound/` trước khi chuyển cho tác nhân, tương ứng với kho lưu trữ nội dung đa phương tiện dùng chung của các Plugin kênh khác.

## Dữ liệu kênh (tin nhắn phong phú)

Sử dụng `channelData.line` để gửi câu trả lời nhanh, vị trí, thẻ Flex hoặc tin nhắn mẫu.

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
        contents: {/* Flex payload */},
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

Plugin LINE cũng cung cấp lệnh `/card` cho các thiết lập sẵn của tin nhắn Flex:

```text
/card info "Welcome" "Thanks for joining!"
```

## Hỗ trợ ACP

LINE hỗ trợ liên kết cuộc hội thoại ACP (Giao thức giao tiếp tác nhân):

- `/acp spawn <agent> --bind here` liên kết cuộc trò chuyện LINE hiện tại với một phiên ACP mà không tạo luồng con.
- Các liên kết ACP đã cấu hình và những phiên ACP đang hoạt động được liên kết với cuộc hội thoại hoạt động trên LINE giống như các kênh hội thoại khác.

Xem [Tác nhân ACP](/vi/tools/acp-agents) để biết chi tiết.

## Nội dung đa phương tiện gửi đi

Plugin LINE gửi hình ảnh, video và âm thanh qua công cụ tin nhắn của tác nhân:

- **Hình ảnh**: được gửi dưới dạng tin nhắn hình ảnh LINE; hình ảnh xem trước mặc định là URL nội dung đa phương tiện.
- **Video**: yêu cầu hình ảnh xem trước; đặt `channelData.line.previewImageUrl` thành URL hình ảnh.
- **Âm thanh**: được gửi dưới dạng tin nhắn âm thanh LINE; thời lượng mặc định là 60 giây trừ khi đặt `channelData.line.durationMs`.

Loại nội dung đa phương tiện được lấy từ `channelData.line.mediaKind` khi được đặt; nếu không, loại này được suy ra từ các tùy chọn LINE khác hoặc hậu tố tệp trong URL, với hình ảnh làm phương án dự phòng.

URL nội dung đa phương tiện gửi đi phải là URL HTTPS công khai có độ dài tối đa 2000 ký tự. OpenClaw xác thực tên máy chủ đích trước khi chuyển URL cho LINE và từ chối các đích local loopback, liên kết cục bộ và mạng riêng.

Các thao tác gửi nội dung đa phương tiện chung không có tùy chọn dành riêng cho LINE sẽ sử dụng tuyến hình ảnh.

## Khắc phục sự cố

- **Xác minh Webhook thất bại:** bảo đảm URL Webhook sử dụng HTTPS và `channelSecret` khớp với LINE Console.
- **Không có sự kiện đến:** xác nhận đường dẫn Webhook khớp với `channels.line.webhookPath` và LINE có thể truy cập Gateway.
- **Lỗi tải xuống nội dung đa phương tiện:** tăng `channels.line.mediaMaxMb` nếu nội dung đa phương tiện vượt quá giới hạn mặc định.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát yêu cầu đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
