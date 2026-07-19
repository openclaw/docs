---
read_when:
    - Phát triển các tính năng kênh Tlon/Urbit
summary: Trạng thái hỗ trợ, khả năng và cấu hình của Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-19T05:44:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d742628d6cf9aaf82d79a8d96b1685229905e9452c9fc4d3a494d2dee8d69943
    source_path: channels/tlon.md
    workflow: 16
---

Tlon là một trình nhắn tin phi tập trung được xây dựng trên Urbit. OpenClaw kết nối với ship Urbit của bạn và
phản hồi tin nhắn trực tiếp cũng như tin nhắn trò chuyện nhóm. Theo mặc định, phản hồi trong nhóm yêu cầu đề cập bằng @, đồng thời
áp dụng thêm các quy tắc ủy quyền và luồng phê duyệt của chủ sở hữu.

Trạng thái: plugin đi kèm. Hỗ trợ tin nhắn trực tiếp, đề cập trong nhóm, luồng thảo luận, văn bản đa dạng thức, tải lên/tải xuống hình ảnh và
hệ thống phê duyệt của chủ sở hữu. Không hỗ trợ phản ứng và cuộc thăm dò ý kiến.

## Plugin đi kèm

Tlon được cung cấp kèm trong các bản phát hành OpenClaw hiện tại; các bản dựng đóng gói không cần cài đặt riêng.

Trên bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh không bao gồm plugin này, hãy cài đặt từ npm:

```bash
openclaw plugins install @openclaw/tlon
```

Dùng tên gói thuần để theo dõi thẻ phát hành hiện tại. Chỉ ghim một phiên bản (`@openclaw/tlon@x.y.z`)
khi cần các bản cài đặt có thể tái lập.

Từ một bản checkout cục bộ:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

Hoặc chỉnh sửa trực tiếp cấu hình:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // khuyến nghị: ship của bạn, luôn được ủy quyền
    },
  },
}
```

Khởi động lại Gateway sau khi chỉnh sửa trực tiếp cấu hình. Sau đó, gửi tin nhắn trực tiếp cho bot hoặc đề cập bot bằng @ trong một
kênh nhóm.

## Độ bền của dữ liệu đầu vào

OpenClaw lưu bền vững các sự kiện tin nhắn trực tiếp và trò chuyện nhóm Tlon đã được chấp nhận trước khi chuyển đến agent. Các lượt đang chờ hoặc có thể thử lại vẫn tồn tại sau khi Gateway khởi động lại, và công việc vẫn được xử lý tuần tự theo từng kênh nhóm hoặc đối tác trực tiếp. ID tin nhắn Urbit ổn định cũng ngăn xử lý lại một sự kiện được gửi lại khi bản ghi hàng đợi hoặc bản ghi hoàn tất được lưu giữ của sự kiện đó vẫn còn tồn tại.

Việc phân phối là ít nhất một lần qua ranh giới từ hàng đợi đến agent: sự cố trong lúc bàn giao có thể phát lại một lượt. Vì vậy, các hành động của agent tạo ra tác dụng phụ bên ngoài nên duy trì tính lũy đẳng khi khả thi.

## Ship riêng tư/LAN

Theo mặc định, OpenClaw chặn tên máy chủ nội bộ/riêng tư và các dải IP để bảo vệ khỏi SSRF. Nếu
ship của bạn chạy trên mạng riêng (localhost, IP LAN, tên máy chủ nội bộ), hãy chủ động cho phép:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Áp dụng cho các đích như `http://localhost:8080`, `http://192.168.x.x:8080` và
`http://my-ship.local:8080`. Chỉ bật tùy chọn này cho URL ship mà bạn tin cậy; tùy chọn này vô hiệu hóa cơ chế bảo vệ
SSRF đối với các yêu cầu HTTP của tài khoản đó.

<Note>
`channels.tlon.allowPrivateNetwork` (khóa phẳng) đã ngừng sử dụng. `openclaw doctor --fix` tự động chuyển khóa này sang
`channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Kênh nhóm

Ghim kênh theo cách thủ công hoặc bật tự động khám phá:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

`autoDiscoverChannels` mặc định là `false` khi chưa được đặt trong cấu hình; trình hướng dẫn thiết lập mặc định
lời nhắc là có và ghi rõ `true`. Khi bật, OpenClaw truy vấn các nhóm đã tham gia lúc khởi động,
theo dõi kênh mới khi lời mời nhóm được chấp nhận và kiểm tra lại mỗi 2 phút.

## Kiểm soát truy cập

Danh sách cho phép tin nhắn trực tiếp (trống = không cho phép tin nhắn trực tiếp trừ khi người gửi là `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Theo mặc định, ủy quyền nhóm là `restricted` cho từng kênh. Đặt `defaultAuthorizedShips` làm
mức cơ sở và ghi đè theo từng nest kênh:

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

Sau khi bot đã phản hồi trong một luồng thảo luận, bot sẽ tiếp tục phản hồi các tin nhắn sau đó trong luồng đó
mà không yêu cầu đề cập lại.

Đặt `channels.tlon.implicitMentions.threadParticipation: false` để yêu cầu một lượt đề cập rõ ràng mới
cho các phản hồi tiếp theo đó. Ghi đè theo tài khoản dùng `channels.tlon.accounts.<id>.implicitMentions`. Tlon
hiện không tạo các dữ kiện `replyToBot` hoặc `quotedBot`, nên các cờ đó không có tác dụng ở đây.

## Chủ sở hữu và hệ thống phê duyệt

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship của chủ sở hữu được ủy quyền ở mọi nơi: lời mời nhắn tin trực tiếp luôn được tự động chấp nhận, lời mời nhóm
luôn được tự động chấp nhận và tin nhắn kênh luôn vượt qua bước ủy quyền. Chủ sở hữu không cần
nằm trong `dmAllowlist`, `defaultAuthorizedShips` hoặc `groupInviteAllowlist`.

Khi đặt `ownerShip`, các yêu cầu không được ủy quyền không chỉ bị loại bỏ — chúng được đưa vào hàng đợi phê duyệt
đang chờ và gửi tin nhắn trực tiếp cho chủ sở hữu:

- Yêu cầu nhắn tin trực tiếp từ các ship không có trong `dmAllowlist`
- Lượt đề cập trong các kênh mà người gửi không vượt qua bước ủy quyền
- Lời mời nhóm từ các ship không có trong `groupInviteAllowlist` (khi tự động chấp nhận bị tắt hoặc được bật nhưng
  người mời không có trong danh sách cho phép)

Chủ sở hữu phản hồi qua tin nhắn trực tiếp để xử lý một yêu cầu:

| Phản hồi của chủ sở hữu                 | Tác dụng                                                         |
| --------------------------------------- | ---------------------------------------------------------------- |
| `approve` / `deny` / `block` | Xử lý yêu cầu phê duyệt đang chờ gần nhất                        |
| `approve <id>` / `deny <id>` | Xử lý một yêu cầu phê duyệt cụ thể theo id                       |
| `block`                      | Đồng thời chặn trực tiếp ship để ship đó không thể kết nối lại   |
| `unblock ~ship`              | Đảo ngược một lượt chặn trực tiếp                                |
| `blocked`                    | Liệt kê các ship hiện đang bị chặn                               |
| `pending`                    | Liệt kê các yêu cầu phê duyệt đang chờ                           |

Nếu không cấu hình `ownerShip`, tin nhắn trực tiếp và lượt đề cập trong kênh không được ủy quyền chỉ bị loại bỏ và ghi nhật ký;
không có lời nhắc phê duyệt.

## Cài đặt tự động chấp nhận

Tự động chấp nhận lời mời nhắn tin trực tiếp từ các ship đã có trong `dmAllowlist` (chủ sở hữu luôn được tự động chấp nhận
bất kể cờ này):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Tự động chấp nhận lời mời nhóm từ một danh sách cho phép (đóng khi lỗi: với `autoAcceptGroupInvites: true` và
`groupInviteAllowlist` trống, không lời mời nào từ đối tượng không phải chủ sở hữu được chấp nhận):

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Tải lại nóng qua kho cài đặt Urbit

Hầu hết các cài đặt ở trên (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) được sao chép vào agent
`%settings` của ship (desk `moltbot`, bucket `tlon`) trong lần chạy đầu tiên, rồi được đọc trực tiếp từ đó,
nên các thay đổi được thực hiện qua một ứng dụng khách Landscape hoặc các lệnh cài đặt của skill đi kèm sẽ được áp dụng mà không cần
khởi động lại Gateway. `channelRules` và các yêu cầu phê duyệt đang chờ cũng được lưu bền vững tại đó dưới dạng JSON. Cấu hình
tệp vẫn là nguồn dữ liệu chuẩn cho các giá trị chưa từng được ghi vào kho cài đặt.

## Đích phân phối (CLI/cron)

Dùng với `openclaw message send` hoặc phân phối qua cron:

- Tin nhắn trực tiếp: `~sampel-palnet` hoặc `dm/~sampel-palnet`
- Nhóm: `chat/~host-ship/channel` hoặc `group:~host-ship/channel`

## Skill đi kèm

Plugin cung cấp kèm [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), một CLI dành cho
các thao tác Urbit trực tiếp, tự động khả dụng sau khi cài đặt plugin:

- **Hoạt động**: lượt đề cập, phản hồi, nội dung chưa đọc
- **Kênh**: liệt kê, tạo, đổi tên
- **Danh bạ**: liệt kê/lấy/cập nhật hồ sơ
- **Nhóm**: tạo, tham gia, luồng mời/yêu cầu, vai trò
- **Hook**: quản lý hook kênh
- **Tin nhắn**: lịch sử, tìm kiếm
- **Tin nhắn trực tiếp**: gửi, phản ứng, chấp nhận/từ chối
- **Bài đăng**: phản ứng, xóa
- **Sổ tay**: đăng lên các kênh nhật ký
- **Cài đặt**: tải lại nóng cấu hình plugin qua kho cài đặt ở trên

## Khả năng

| Tính năng       | Trạng thái                                                   |
| --------------- | ------------------------------------------------------------ |
| Tin nhắn trực tiếp | Được hỗ trợ                                               |
| Nhóm/kênh       | Được hỗ trợ (theo mặc định bị giới hạn bằng yêu cầu đề cập)  |
| Luồng thảo luận | Được hỗ trợ (tiếp tục phản hồi sau khi đã tham gia)          |
| Văn bản đa dạng thức | Markdown được chuyển đổi sang định dạng gốc của Tlon     |
| Hình ảnh        | Tải xuống khi nhận, tải lên khi gửi                          |
| Phản ứng        | Chỉ qua [skill đi kèm](#bundled-skill)                       |
| Cuộc thăm dò ý kiến | Không được hỗ trợ                                        |
| Lệnh gốc        | Theo mặc định chỉ dành cho chủ sở hữu                        |

## Khắc phục sự cố

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Các lỗi thường gặp:

- **Tin nhắn trực tiếp bị bỏ qua**: người gửi không có trong `dmAllowlist` và chưa cấu hình `ownerShip` cho luồng phê duyệt.
- **Tin nhắn nhóm bị bỏ qua**: kênh chưa được khám phá/ghim hoặc người gửi không vượt qua bước ủy quyền và không có
  `ownerShip` để đưa yêu cầu phê duyệt vào hàng đợi.
- **Lỗi kết nối**: kiểm tra xem URL ship có thể truy cập được hay không; đặt
  `network.dangerouslyAllowPrivateNetwork` cho các ship cục bộ.
- **Lỗi xác thực**: mã đăng nhập được luân chuyển — hãy sao chép mã hiện tại từ ship của bạn.

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

| Khóa                                                   | Ý nghĩa                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Bật/tắt quá trình khởi động kênh.                                     |
| `channels.tlon.ship`                                   | Tên ship Urbit của bot (ví dụ: `~sampel-palnet`).                    |
| `channels.tlon.url`                                    | URL ship (ví dụ: `https://sampel-palnet.tlon.network`).                                 |
| `channels.tlon.code`                                   | Mã đăng nhập ship.                                                    |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Cho phép URL ship localhost/LAN (chủ động cho phép SSRF).              |
| `channels.tlon.ownerShip`                              | Ship chủ sở hữu: luôn được ủy quyền, nhận yêu cầu phê duyệt.           |
| `channels.tlon.dmAllowlist`                            | Các ship được phép gửi tin nhắn trực tiếp (trống = không có ship nào ngoài chủ sở hữu). |
| `channels.tlon.autoAcceptDmInvites`                    | Tự động chấp nhận tin nhắn trực tiếp từ các ship trong `dmAllowlist`. |
| `channels.tlon.autoAcceptGroupInvites`                 | Tự động chấp nhận lời mời nhóm từ `groupInviteAllowlist`.                  |
| `channels.tlon.groupInviteAllowlist`                   | Các ship có lời mời nhóm được tự động chấp nhận.                       |
| `channels.tlon.autoDiscoverChannels`                   | Tự động khám phá các kênh nhóm đã tham gia (mặc định: `false`). |
| `channels.tlon.implicitMentions.threadParticipation`   | Cho phép phản hồi tiếp theo trong luồng đã tham gia bỏ qua yêu cầu đề cập. |
| `channels.tlon.groupChannels`                          | Các nest kênh được ghim thủ công.                                     |
| `channels.tlon.defaultAuthorizedShips`                 | Các ship được ủy quyền cho mọi kênh (dùng khi không có quy tắc nào khớp). |
| `channels.tlon.authorization.channelRules`             | Chế độ xác thực + danh sách cho phép theo từng nest kênh.              |
| `channels.tlon.showModelSignature`                     | Nối thêm `_[Generated by <model>]_` vào các phản hồi.                          |
| `channels.tlon.responsePrefix`                         | Tiền tố tĩnh được thêm vào đầu các phản hồi gửi đi.                    |
| `channels.tlon.accounts.<id>`                          | Các tài khoản có tên bổ sung (thiết lập nhiều ship).                   |

## Ghi chú

- Phản hồi trong nhóm cần có lượt đề cập @ (ví dụ: `~your-bot-ship`) trừ khi bot đã tham gia luồng đó.
- Phản hồi trong luồng sẽ được gửi vào chính luồng đó; bot cũng nhận 10 tin nhắn gần nhất trong ngữ cảnh luồng được thêm vào đầu
  cho tác tử.
- Văn bản đa dạng thức (in đậm, in nghiêng, mã, tiêu đề, danh sách) được chuyển đổi sang định dạng gốc của Tlon.
- Việc gửi một tin nhắn đến yêu cầu tóm tắt kênh (ví dụ: "tóm tắt
  kênh này") sẽ kích hoạt tính năng tóm tắt lịch sử tích hợp thay vì luồng phản hồi thông thường.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế yêu cầu lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
