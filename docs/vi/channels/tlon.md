---
read_when:
    - Làm việc trên các tính năng kênh Tlon/Urbit
summary: Trạng thái hỗ trợ, khả năng và cấu hình Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-29T22:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon là một trình nhắn tin phi tập trung được xây dựng trên Urbit. OpenClaw kết nối với Urbit ship của bạn và có thể
phản hồi tin nhắn trực tiếp cũng như tin nhắn trò chuyện nhóm. Theo mặc định, phản hồi trong nhóm yêu cầu nhắc đến bằng @ và có thể
được giới hạn thêm qua danh sách cho phép.

Trạng thái: Plugin đi kèm. Tin nhắn trực tiếp, nhắc đến trong nhóm, phản hồi trong luồng, định dạng văn bản phong phú và
tải ảnh lên đều được hỗ trợ. Phản ứng và bình chọn hiện chưa được hỗ trợ.

## Plugin đi kèm

Tlon được phát hành dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại, nên các bản dựng
đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh không bao gồm Tlon, hãy cài đặt một
gói npm hiện tại khi gói đó được phát hành:

Cài đặt qua CLI (npm registry, khi có gói hiện tại):

```bash
openclaw plugins install @openclaw/tlon
```

Nếu npm báo gói do OpenClaw sở hữu là không còn được khuyến nghị sử dụng, hãy dùng một bản dựng OpenClaw
đóng gói hiện tại hoặc đường dẫn checkout cục bộ cho đến khi một gói npm mới hơn được
phát hành.

Checkout cục bộ (khi chạy từ một git repo):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Chi tiết: [Plugins](/vi/tools/plugin)

## Thiết lập

1. Đảm bảo Plugin Tlon có sẵn.
   - Các bản phát hành OpenClaw đóng gói hiện tại đã đi kèm Plugin này.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
2. Thu thập URL ship và mã đăng nhập của bạn.
3. Cấu hình `channels.tlon`.
4. Khởi động lại Gateway.
5. Nhắn tin trực tiếp cho bot hoặc nhắc đến bot trong một kênh nhóm.

Cấu hình tối thiểu (một tài khoản):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Ship riêng tư/LAN

Theo mặc định, OpenClaw chặn tên máy chủ và dải IP riêng tư/nội bộ để bảo vệ chống SSRF.
Nếu ship của bạn đang chạy trên mạng riêng tư (localhost, IP LAN hoặc tên máy chủ nội bộ),
bạn phải chủ động bật tùy chọn này:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Điều này áp dụng cho các URL như:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Chỉ bật tùy chọn này nếu bạn tin cậy mạng cục bộ của mình. Thiết lập này tắt các biện pháp bảo vệ SSRF
cho các yêu cầu đến URL ship của bạn.

## Kênh nhóm

Tự động phát hiện được bật theo mặc định. Bạn cũng có thể ghim kênh thủ công:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Tắt tự động phát hiện:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Kiểm soát truy cập

Danh sách cho phép tin nhắn trực tiếp (rỗng = không cho phép tin nhắn trực tiếp, dùng `ownerShip` cho luồng phê duyệt):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Ủy quyền nhóm (bị giới hạn theo mặc định):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Chủ sở hữu và hệ thống phê duyệt

Đặt một owner ship để nhận yêu cầu phê duyệt khi người dùng chưa được ủy quyền cố gắng tương tác:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Owner ship được **tự động ủy quyền ở mọi nơi** — lời mời nhắn tin trực tiếp được tự động chấp nhận và
tin nhắn kênh luôn được cho phép. Bạn không cần thêm owner vào `dmAllowlist` hoặc
`defaultAuthorizedShips`.

Khi được đặt, owner sẽ nhận thông báo tin nhắn trực tiếp cho:

- Yêu cầu nhắn tin trực tiếp từ các ship không nằm trong danh sách cho phép
- Lượt nhắc đến trong các kênh không có ủy quyền
- Yêu cầu mời vào nhóm

## Thiết lập tự động chấp nhận

Tự động chấp nhận lời mời nhắn tin trực tiếp (cho các ship trong dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Tự động chấp nhận lời mời vào nhóm:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Đích gửi (CLI/Cron)

Dùng các đích này với `openclaw message send` hoặc gửi qua Cron:

- Tin nhắn trực tiếp: `~sampel-palnet` hoặc `dm/~sampel-palnet`
- Nhóm: `chat/~host-ship/channel` hoặc `group:~host-ship/channel`

## Skill đi kèm

Plugin Tlon bao gồm một Skill đi kèm ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
cung cấp quyền truy cập CLI vào các thao tác Tlon:

- **Liên hệ**: lấy/cập nhật hồ sơ, liệt kê liên hệ
- **Kênh**: liệt kê, tạo, đăng tin nhắn, lấy lịch sử
- **Nhóm**: liệt kê, tạo, quản lý thành viên
- **Tin nhắn trực tiếp**: gửi tin nhắn, phản ứng với tin nhắn
- **Phản ứng**: thêm/xóa phản ứng emoji vào bài đăng và tin nhắn trực tiếp
- **Thiết lập**: quản lý quyền Plugin qua lệnh slash

Skill tự động có sẵn khi Plugin được cài đặt.

## Khả năng

| Tính năng       | Trạng thái                              |
| --------------- | --------------------------------------- |
| Tin nhắn trực tiếp | ✅ Được hỗ trợ                       |
| Nhóm/kênh       | ✅ Được hỗ trợ (mặc định có cổng nhắc đến) |
| Luồng           | ✅ Được hỗ trợ (tự động phản hồi trong luồng) |
| Văn bản phong phú | ✅ Markdown được chuyển đổi sang định dạng Tlon |
| Ảnh             | ✅ Được tải lên bộ lưu trữ Tlon         |
| Phản ứng        | ✅ Qua [Skill đi kèm](#bundled-skill)   |
| Bình chọn       | ❌ Chưa được hỗ trợ                     |
| Lệnh gốc        | ✅ Được hỗ trợ (mặc định chỉ owner)     |

## Khắc phục sự cố

Chạy chuỗi kiểm tra này trước:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Các lỗi thường gặp:

- **Tin nhắn trực tiếp bị bỏ qua**: người gửi không nằm trong `dmAllowlist` và chưa cấu hình `ownerShip` cho luồng phê duyệt.
- **Tin nhắn nhóm bị bỏ qua**: kênh chưa được phát hiện hoặc người gửi chưa được ủy quyền.
- **Lỗi kết nối**: kiểm tra URL ship có thể truy cập được; bật `allowPrivateNetwork` cho ship cục bộ.
- **Lỗi xác thực**: xác minh mã đăng nhập còn hiện hành (mã được luân phiên thay đổi).

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.tlon.enabled`: bật/tắt khởi động kênh.
- `channels.tlon.ship`: tên Urbit ship của bot (ví dụ: `~sampel-palnet`).
- `channels.tlon.url`: URL ship (ví dụ: `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: mã đăng nhập ship.
- `channels.tlon.allowPrivateNetwork`: cho phép URL localhost/LAN (bỏ qua SSRF).
- `channels.tlon.ownerShip`: owner ship cho hệ thống phê duyệt (luôn được ủy quyền).
- `channels.tlon.dmAllowlist`: các ship được phép nhắn tin trực tiếp (rỗng = không ship nào).
- `channels.tlon.autoAcceptDmInvites`: tự động chấp nhận tin nhắn trực tiếp từ các ship trong danh sách cho phép.
- `channels.tlon.autoAcceptGroupInvites`: tự động chấp nhận tất cả lời mời vào nhóm.
- `channels.tlon.autoDiscoverChannels`: tự động phát hiện kênh nhóm (mặc định: true).
- `channels.tlon.groupChannels`: các nest kênh được ghim thủ công.
- `channels.tlon.defaultAuthorizedShips`: các ship được ủy quyền cho tất cả kênh.
- `channels.tlon.authorization.channelRules`: quy tắc xác thực theo từng kênh.
- `channels.tlon.showModelSignature`: thêm tên mô hình vào tin nhắn.

## Ghi chú

- Phản hồi trong nhóm yêu cầu nhắc đến (ví dụ: `~your-bot-ship`) để phản hồi.
- Phản hồi trong luồng: nếu tin nhắn đến nằm trong một luồng, OpenClaw sẽ phản hồi trong luồng đó.
- Văn bản phong phú: định dạng Markdown (in đậm, in nghiêng, code, tiêu đề, danh sách) được chuyển đổi sang định dạng gốc của Tlon.
- Ảnh: URL được tải lên bộ lưu trữ Tlon và nhúng dưới dạng khối ảnh.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực tin nhắn trực tiếp và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
