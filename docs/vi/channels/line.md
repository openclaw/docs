---
read_when:
    - Bạn muốn kết nối OpenClaw với LINE
    - Bạn cần thiết lập Webhook LINE và thông tin xác thực
    - Bạn muốn các tùy chọn tin nhắn dành riêng cho LINE
summary: Thiết lập, cấu hình và sử dụng plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-19T05:34:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa160970278e0899637307136139f7d2fc83bf57defc30771d77649060f77274
    source_path: channels/line.md
    workflow: 16
---

LINE kết nối với OpenClaw qua LINE Messaging API. Plugin chạy trên Gateway dưới dạng trình nhận webhook và sử dụng channel access token + channel secret của bạn để xác thực.

Trạng thái: Plugin chính thức, được cài đặt riêng. Hỗ trợ tin nhắn trực tiếp, trò chuyện nhóm, phương tiện, vị trí, tin nhắn Flex, tin nhắn mẫu và trả lời nhanh.
Không hỗ trợ cảm xúc và luồng thảo luận.

## Cài đặt

Cài đặt LINE trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/line
```

Bản checkout cục bộ (khi chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Thiết lập

1. Tạo tài khoản LINE Developers và mở Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Tạo (hoặc chọn) một Provider và thêm kênh **Messaging API**.
3. Sao chép **Channel access token** và **Channel secret** từ phần cài đặt kênh.
4. Bật **Use webhook** trong phần cài đặt Messaging API.
5. Đặt URL webhook thành điểm cuối Gateway của bạn (bắt buộc dùng HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway phản hồi yêu cầu xác minh webhook của LINE (GET). Đối với các sự kiện gửi đến đã ký
(POST), Gateway ghi từng sự kiện vào hàng đợi đầu vào bền vững trước khi trả về `200`;
quá trình xử lý của tác nhân tiếp tục bất đồng bộ. Hoạt động phân phối không thành công được thử lại từ
hàng đợi, kể cả sau khi Gateway khởi động lại, và các sự kiện độc hại trở thành bản ghi hàng đợi
thất bại sau số lần thử lại hữu hạn. Nếu lưu trữ bền vững thất bại, yêu cầu trả về
`500` thay vì xác nhận một sự kiện có thể bị mất.
Việc phân phối được thực hiện ít nhất một lần qua ranh giới từ hàng đợi đến tác nhân: Gateway tắt hoặc
gặp sự cố trong khi đang phân phối có thể phát lại lượt tương tác. Các sự kiện tin nhắn được loại bỏ trùng lặp theo
ID tin nhắn LINE; các loại sự kiện khác sử dụng `webhookEventId`. Các bản ghi hoàn tất được giữ lại
ngăn chặn webhook trùng lặp thông thường, nhưng các trình xử lý thực hiện tác dụng phụ bên ngoài
vẫn phải có tính lũy đẳng.
Nếu cần đường dẫn tùy chỉnh, hãy đặt `channels.line.webhookPath` hoặc
`channels.line.accounts.<id>.webhookPath` và cập nhật URL tương ứng.

Lưu ý bảo mật:

- Việc xác minh chữ ký LINE phụ thuộc vào phần thân (HMAC trên phần thân thô), vì vậy OpenClaw áp dụng giới hạn nghiêm ngặt 64 KB cho phần thân trước khi xác thực và thời gian chờ đọc trước khi xác minh.
- OpenClaw xử lý các sự kiện webhook từ các byte yêu cầu thô đã được xác minh. Các giá trị `req.body` đã bị phần mềm trung gian phía trước biến đổi sẽ bị bỏ qua để bảo đảm tính toàn vẹn của chữ ký.

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

Tin nhắn trực tiếp mặc định sử dụng ghép đôi. Người gửi không xác định nhận được mã ghép đôi và
tin nhắn của họ bị bỏ qua cho đến khi được phê duyệt:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Danh sách cho phép và chính sách:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định `pairing`)
- `channels.line.allowFrom`: các ID người dùng LINE trong danh sách cho phép dành cho tin nhắn trực tiếp; `dmPolicy: "open"` yêu cầu `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (mặc định `allowlist`)
- `channels.line.groupAllowFrom`: các ID người dùng LINE trong danh sách cho phép dành cho nhóm; các mục `allowFrom` của tin nhắn trực tiếp không cho phép người gửi trong nhóm
- Ghi đè theo từng nhóm: `channels.line.groups.<groupId>.allowFrom` (cùng với `enabled`, `requireMention`, `systemPrompt`, `skills`). Với
  `groupPolicy: "allowlist"`, hãy đặt `groupAllowFrom` hoặc `allowFrom` theo từng nhóm; danh sách cho phép nhóm trống sẽ chặn tin nhắn nhóm ngay cả khi tin nhắn trực tiếp đang mở.
- Các nhóm truy cập người gửi tĩnh có thể được tham chiếu từ `allowFrom`, `groupAllowFrom` và `allowFrom` theo từng nhóm bằng `accessGroup:<name>`; xem [Nhóm truy cập](/vi/channels/access-groups).
- Lưu ý khi chạy: nếu hoàn toàn thiếu `channels.line`, môi trường chạy sẽ dùng `groupPolicy="allowlist"` làm phương án dự phòng để kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

ID LINE phân biệt chữ hoa chữ thường. ID hợp lệ có dạng:

- Người dùng: `U` + 32 ký tự thập lục phân
- Nhóm: `C` + 32 ký tự thập lục phân
- Phòng: `R` + 32 ký tự thập lục phân

## Hành vi tin nhắn

- Văn bản được chia thành các đoạn dài 5000 ký tự.
- Định dạng Markdown bị loại bỏ; khối mã và bảng được chuyển đổi thành thẻ Flex
  khi có thể.
- Phản hồi truyền trực tuyến được lưu vào bộ đệm; LINE nhận các đoạn hoàn chỉnh kèm hiệu ứng
  tải trong khi tác nhân làm việc.
- Lượt tải phương tiện xuống bị giới hạn bởi `channels.line.mediaMaxMb` (mặc định 10).
- Phương tiện gửi đến được lưu trong `~/.openclaw/media/inbound/` trước khi được chuyển
  cho tác nhân, tương ứng với kho phương tiện dùng chung mà các Plugin kênh khác sử dụng.

## Dữ liệu kênh (tin nhắn đa dạng thức)

Sử dụng `channelData.line` để gửi câu trả lời nhanh, vị trí, thẻ Flex hoặc tin nhắn
mẫu.

```json5
{
  text: "Đây nhé",
  channelData: {
    line: {
      quickReplies: ["Trạng thái", "Trợ giúp"],
      location: {
        title: "Văn phòng",
        address: "123 Main St",
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

Plugin LINE cũng cung cấp lệnh `/card` cho các thiết lập sẵn của tin nhắn Flex:

```text
/card info "Chào mừng" "Cảm ơn bạn đã tham gia!"
```

## Hỗ trợ ACP

LINE hỗ trợ liên kết cuộc trò chuyện ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` liên kết cuộc trò chuyện LINE hiện tại với một phiên ACP mà không tạo luồng con.
- Các liên kết ACP đã cấu hình và phiên ACP đang hoạt động được liên kết với cuộc trò chuyện hoạt động trên LINE giống như trên các kênh trò chuyện khác.

Xem [Tác nhân ACP](/vi/tools/acp-agents) để biết chi tiết.

## Phương tiện gửi đi

Plugin LINE gửi hình ảnh, video và âm thanh thông qua công cụ tin nhắn của tác nhân:

- **Hình ảnh**: được gửi dưới dạng tin nhắn hình ảnh LINE; hình ảnh xem trước mặc định là URL phương tiện.
- **Video**: yêu cầu hình ảnh xem trước; đặt `channelData.line.previewImageUrl` thành URL hình ảnh.
- **Âm thanh**: được gửi dưới dạng tin nhắn âm thanh LINE; thời lượng mặc định là 60 giây trừ khi đặt `channelData.line.durationMs`.

Loại phương tiện được lấy từ `channelData.line.mediaKind` khi được đặt, nếu không sẽ được suy ra
từ các tùy chọn LINE khác hoặc hậu tố tệp trong URL, với hình ảnh làm phương án dự phòng.

URL phương tiện gửi đi phải là URL HTTPS công khai dài tối đa 2000 ký tự. OpenClaw
xác thực tên máy chủ đích trước khi chuyển URL cho LINE và từ chối các đích loopback,
link-local và mạng riêng.

Việc gửi phương tiện chung mà không có tùy chọn dành riêng cho LINE sẽ sử dụng tuyến hình ảnh.

## Khắc phục sự cố

- **Xác minh webhook không thành công:** hãy bảo đảm URL webhook sử dụng HTTPS và
  `channelSecret` khớp với LINE console.
- **Không có sự kiện gửi đến:** xác nhận đường dẫn webhook khớp với `channels.line.webhookPath`
  và LINE có thể truy cập Gateway.
- **Lỗi tải phương tiện xuống:** tăng `channels.line.mediaMaxMb` nếu phương tiện vượt quá
  giới hạn mặc định.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — quy trình xác thực và ghép đôi tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
