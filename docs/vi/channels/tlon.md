---
read_when:
    - Đang phát triển các tính năng kênh Tlon/Urbit
summary: Trạng thái hỗ trợ, khả năng và cấu hình của Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon là một trình nhắn tin phi tập trung được xây dựng trên Urbit. OpenClaw kết nối với Urbit ship của bạn và có thể
phản hồi DM cũng như tin nhắn trò chuyện nhóm. Theo mặc định, phản hồi trong nhóm yêu cầu nhắc đến bằng @ và có thể
được hạn chế thêm qua allowlist.

Trạng thái: Plugin tích hợp sẵn. DM, nhắc đến trong nhóm, phản hồi theo luồng, định dạng văn bản phong phú và
tải ảnh lên đều được hỗ trợ. Chưa hỗ trợ phản ứng và bình chọn.

## Plugin tích hợp sẵn

Tlon được phát hành dưới dạng Plugin tích hợp sẵn trong các bản phát hành OpenClaw hiện tại, vì vậy các bản dựng
đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh không bao gồm Tlon, hãy cài đặt một
gói npm hiện tại:

Cài đặt qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

Dùng gói không kèm phiên bản để theo thẻ phát hành chính thức hiện tại. Chỉ ghim một
phiên bản chính xác khi bạn cần bản cài đặt có thể tái lập.

Checkout cục bộ (khi chạy từ repo git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập

1. Đảm bảo Plugin Tlon khả dụng.
   - Các bản phát hành OpenClaw đóng gói hiện tại đã tích hợp sẵn Plugin này.
   - Bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
2. Thu thập URL ship và mã đăng nhập của bạn.
3. Cấu hình `channels.tlon`.
4. Khởi động lại Gateway.
5. DM cho bot hoặc nhắc đến bot trong một kênh nhóm.

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
Nếu ship của bạn đang chạy trên mạng riêng (localhost, IP LAN hoặc tên máy chủ nội bộ),
bạn phải bật rõ ràng:

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

⚠️ Chỉ bật tùy chọn này nếu bạn tin tưởng mạng cục bộ của mình. Thiết lập này vô hiệu hóa các biện pháp bảo vệ SSRF
cho các yêu cầu tới URL ship của bạn.

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

Allowlist DM (trống = không cho phép DM, dùng `ownerShip` cho luồng phê duyệt):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Ủy quyền nhóm (bị hạn chế theo mặc định):

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

## Hệ thống chủ sở hữu và phê duyệt

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

Owner ship được **tự động ủy quyền ở mọi nơi** — lời mời DM được tự động chấp nhận và
tin nhắn kênh luôn được cho phép. Bạn không cần thêm owner vào `dmAllowlist` hoặc
`defaultAuthorizedShips`.

Khi được đặt, owner nhận thông báo DM cho:

- Yêu cầu DM từ các ship không có trong allowlist
- Lượt nhắc đến trong các kênh không có ủy quyền
- Yêu cầu lời mời nhóm

## Thiết lập tự động chấp nhận

Tự động chấp nhận lời mời DM (cho các ship trong dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Tự động chấp nhận lời mời nhóm:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Đích gửi (CLI/cron)

Dùng các đích này với `openclaw message send` hoặc gửi qua Cron:

- DM: `~sampel-palnet` hoặc `dm/~sampel-palnet`
- Nhóm: `chat/~host-ship/channel` hoặc `group:~host-ship/channel`

## Skill tích hợp sẵn

Plugin Tlon bao gồm một skill tích hợp sẵn ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
cung cấp quyền truy cập CLI vào các thao tác Tlon:

- **Liên hệ**: lấy/cập nhật hồ sơ, liệt kê liên hệ
- **Kênh**: liệt kê, tạo, đăng tin nhắn, lấy lịch sử
- **Nhóm**: liệt kê, tạo, quản lý thành viên
- **DM**: gửi tin nhắn, phản ứng với tin nhắn
- **Phản ứng**: thêm/xóa phản ứng emoji cho bài đăng và DM
- **Thiết lập**: quản lý quyền Plugin qua lệnh slash

Skill tự động khả dụng khi Plugin được cài đặt.

## Khả năng

| Tính năng        | Trạng thái                                      |
| --------------- | --------------------------------------- |
| Tin nhắn trực tiếp | ✅ Được hỗ trợ                            |
| Nhóm/kênh | ✅ Được hỗ trợ (theo mặc định cần nhắc đến) |
| Luồng         | ✅ Được hỗ trợ (tự động phản hồi trong luồng)   |
| Văn bản phong phú       | ✅ Markdown được chuyển đổi sang định dạng Tlon    |
| Hình ảnh          | ✅ Được tải lên bộ nhớ Tlon             |
| Phản ứng       | ✅ Qua [skill tích hợp sẵn](#bundled-skill)  |
| Bình chọn           | ❌ Chưa được hỗ trợ                    |
| Lệnh native | ✅ Được hỗ trợ (theo mặc định chỉ owner)    |

## Khắc phục sự cố

Chạy chuỗi lệnh này trước:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Lỗi thường gặp:

- **DM bị bỏ qua**: người gửi không có trong `dmAllowlist` và không có `ownerShip` được cấu hình cho luồng phê duyệt.
- **Tin nhắn nhóm bị bỏ qua**: kênh chưa được phát hiện hoặc người gửi chưa được ủy quyền.
- **Lỗi kết nối**: kiểm tra URL ship có thể truy cập được; bật `allowPrivateNetwork` cho ship cục bộ.
- **Lỗi xác thực**: xác minh mã đăng nhập còn hiệu lực (mã được xoay vòng).

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn provider:

- `channels.tlon.enabled`: bật/tắt khởi động kênh.
- `channels.tlon.ship`: tên Urbit ship của bot (ví dụ `~sampel-palnet`).
- `channels.tlon.url`: URL ship (ví dụ `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: mã đăng nhập ship.
- `channels.tlon.allowPrivateNetwork`: cho phép URL localhost/LAN (bỏ qua SSRF).
- `channels.tlon.ownerShip`: owner ship cho hệ thống phê duyệt (luôn được ủy quyền).
- `channels.tlon.dmAllowlist`: các ship được phép DM (trống = không có).
- `channels.tlon.autoAcceptDmInvites`: tự động chấp nhận DM từ các ship trong allowlist.
- `channels.tlon.autoAcceptGroupInvites`: tự động chấp nhận mọi lời mời nhóm.
- `channels.tlon.autoDiscoverChannels`: tự động phát hiện kênh nhóm (mặc định: true).
- `channels.tlon.groupChannels`: các nest kênh được ghim thủ công.
- `channels.tlon.defaultAuthorizedShips`: các ship được ủy quyền cho mọi kênh.
- `channels.tlon.authorization.channelRules`: quy tắc xác thực theo từng kênh.
- `channels.tlon.showModelSignature`: thêm tên model vào tin nhắn.

## Ghi chú

- Phản hồi nhóm yêu cầu một lượt nhắc đến (ví dụ `~your-bot-ship`) để phản hồi.
- Phản hồi theo luồng: nếu tin nhắn đến nằm trong một luồng, OpenClaw phản hồi trong luồng đó.
- Văn bản phong phú: định dạng Markdown (in đậm, in nghiêng, mã, tiêu đề, danh sách) được chuyển đổi sang định dạng native của Tlon.
- Hình ảnh: URL được tải lên bộ nhớ Tlon và nhúng dưới dạng khối hình ảnh.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát bằng nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
