---
read_when:
    - Phát triển các tính năng cho kênh Tlon/Urbit
summary: Trạng thái hỗ trợ, khả năng và cấu hình của Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-12T07:44:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon là một ứng dụng nhắn tin phi tập trung được xây dựng trên Urbit. OpenClaw kết nối với tàu Urbit của bạn và
phản hồi tin nhắn trực tiếp cũng như tin nhắn trò chuyện nhóm. Theo mặc định, phản hồi trong nhóm yêu cầu nhắc đến bằng @, đồng thời
áp dụng thêm các quy tắc ủy quyền và quy trình phê duyệt của chủ sở hữu.

Trạng thái: plugin tích hợp sẵn. Hỗ trợ tin nhắn trực tiếp, lượt nhắc trong nhóm, luồng thảo luận, văn bản đa dạng thức, tải lên/tải xuống hình ảnh và
hệ thống phê duyệt của chủ sở hữu. Không hỗ trợ cảm xúc và cuộc thăm dò ý kiến.

## Plugin tích hợp sẵn

Tlon được tích hợp sẵn trong các bản phát hành OpenClaw hiện tại; bản dựng đóng gói không cần cài đặt riêng.

Trên bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh không bao gồm plugin này, hãy cài đặt từ npm:

```bash
openclaw plugins install @openclaw/tlon
```

Dùng tên gói thuần để theo dõi thẻ phát hành hiện tại. Chỉ ghim phiên bản (`@openclaw/tlon@x.y.z`)
khi cần cài đặt có khả năng tái lập.

Từ bản sao mã nguồn cục bộ:

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
      ownerShip: "~your-main-ship", // khuyến nghị: tàu của bạn, luôn được ủy quyền
    },
  },
}
```

Khởi động lại Gateway sau khi chỉnh sửa trực tiếp cấu hình. Sau đó, gửi tin nhắn trực tiếp cho bot hoặc nhắc đến bot bằng @ trong
kênh nhóm.

## Tàu riêng tư/LAN

Theo mặc định, OpenClaw chặn tên máy chủ và dải IP riêng tư/nội bộ để bảo vệ khỏi SSRF. Nếu
tàu của bạn chạy trên mạng riêng (localhost, IP LAN, tên máy chủ nội bộ), hãy bật rõ ràng:

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
`http://my-ship.local:8080`. Chỉ bật tùy chọn này cho URL tàu mà bạn tin cậy; tùy chọn này vô hiệu hóa khả năng bảo vệ khỏi SSRF
cho các yêu cầu HTTP của tài khoản đó.

<Note>
`channels.tlon.allowPrivateNetwork` (khóa phẳng) đã ngừng sử dụng. `openclaw doctor --fix` tự động chuyển khóa này sang
`channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Kênh nhóm

Ghim kênh theo cách thủ công hoặc bật tính năng tự động khám phá:

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

Khi không được đặt trong cấu hình, `autoDiscoverChannels` mặc định là `false`; trình hướng dẫn thiết lập mặc định
câu hỏi thành có và ghi rõ `true`. Khi được bật, OpenClaw truy vấn các nhóm đã tham gia lúc khởi động,
theo dõi kênh mới khi lời mời vào nhóm được chấp nhận và kiểm tra lại sau mỗi 2 phút.

## Kiểm soát quyền truy cập

Danh sách cho phép tin nhắn trực tiếp (trống = không cho phép tin nhắn trực tiếp, trừ khi người gửi là `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Theo mặc định, ủy quyền nhóm được đặt thành `restricted` cho từng kênh. Đặt `defaultAuthorizedShips` làm
mức cơ sở và ghi đè theo từng tổ kênh:

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

Sau khi bot đã phản hồi trong một luồng thảo luận, bot sẽ tiếp tục phản hồi các tin nhắn sau đó trong luồng
mà không cần được nhắc đến lần nữa.

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

Tàu chủ sở hữu được ủy quyền ở mọi nơi: lời mời tin nhắn trực tiếp luôn được tự động chấp nhận, lời mời nhóm
luôn được tự động chấp nhận và tin nhắn kênh luôn vượt qua bước ủy quyền. Chủ sở hữu không cần
có trong `dmAllowlist`, `defaultAuthorizedShips` hoặc `groupInviteAllowlist`.

Khi đặt `ownerShip`, các yêu cầu không được ủy quyền không chỉ bị loại bỏ — chúng được đưa vào hàng đợi
chờ phê duyệt và hệ thống gửi tin nhắn trực tiếp cho chủ sở hữu:

- Yêu cầu tin nhắn trực tiếp từ các tàu không có trong `dmAllowlist`
- Lượt nhắc trong các kênh mà người gửi không vượt qua bước ủy quyền
- Lời mời nhóm từ các tàu không có trong `groupInviteAllowlist` (khi tính năng tự động chấp nhận bị tắt, hoặc được bật nhưng
  người mời không có trong danh sách cho phép)

Chủ sở hữu phản hồi qua tin nhắn trực tiếp để xử lý yêu cầu:

| Phản hồi của chủ sở hữu       | Tác dụng                                                        |
| ----------------------------- | --------------------------------------------------------------- |
| `approve` / `deny` / `block`  | Xử lý yêu cầu phê duyệt đang chờ gần đây nhất                   |
| `approve <id>` / `deny <id>`  | Xử lý một yêu cầu phê duyệt cụ thể theo mã định danh            |
| `block`                       | Đồng thời chặn tàu ở cấp bản địa để tàu đó không thể kết nối lại |
| `unblock ~ship`               | Gỡ một lệnh chặn bản địa                                        |
| `blocked`                     | Liệt kê các tàu hiện đang bị chặn                               |
| `pending`                     | Liệt kê các yêu cầu phê duyệt đang chờ                          |

Nếu không cấu hình `ownerShip`, tin nhắn trực tiếp và lượt nhắc trong kênh không được ủy quyền chỉ bị loại bỏ và ghi nhật ký;
không có lời nhắc phê duyệt.

## Cài đặt tự động chấp nhận

Tự động chấp nhận lời mời tin nhắn trực tiếp từ các tàu đã có trong `dmAllowlist` (chủ sở hữu luôn được tự động chấp nhận
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

Tự động chấp nhận lời mời nhóm từ danh sách cho phép (từ chối theo mặc định: khi `autoAcceptGroupInvites: true` và
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
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) được sao chiếu vào agent
`%settings` của tàu (desk `moltbot`, bucket `tlon`) trong lần chạy đầu tiên, rồi được đọc trực tiếp từ đó,
vì vậy các thay đổi được thực hiện qua ứng dụng khách Landscape hoặc các lệnh cài đặt của skill tích hợp sẵn sẽ có hiệu lực mà không cần
khởi động lại Gateway. `channelRules` và các yêu cầu phê duyệt đang chờ cũng được lưu bền vững ở đó dưới dạng JSON. Cấu hình
tệp vẫn là nguồn dữ liệu chính xác cho các giá trị chưa từng được ghi vào kho cài đặt.

## Đích gửi (`CLI`/`cron`)

Dùng với `openclaw message send` hoặc gửi qua cron:

- Tin nhắn trực tiếp: `~sampel-palnet` hoặc `dm/~sampel-palnet`
- Nhóm: `chat/~host-ship/channel` hoặc `group:~host-ship/channel`

## Skill tích hợp sẵn

Plugin tích hợp [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), một CLI dành cho
các thao tác Urbit trực tiếp, tự động khả dụng sau khi cài đặt plugin:

- **Hoạt động**: lượt nhắc, phản hồi, mục chưa đọc
- **Kênh**: liệt kê, tạo, đổi tên
- **Danh bạ**: liệt kê/lấy/cập nhật hồ sơ
- **Nhóm**: tạo, tham gia, quy trình mời/yêu cầu, vai trò
- **Hook**: quản lý hook của kênh
- **Tin nhắn**: lịch sử, tìm kiếm
- **Tin nhắn trực tiếp**: gửi, bày tỏ cảm xúc, chấp nhận/từ chối
- **Bài đăng**: bày tỏ cảm xúc, xóa
- **Sổ ghi chép**: đăng lên các kênh nhật ký
- **Cài đặt**: tải lại nóng cấu hình plugin qua kho cài đặt ở trên

## Khả năng

| Tính năng          | Trạng thái                                               |
| ------------------ | -------------------------------------------------------- |
| Tin nhắn trực tiếp | Được hỗ trợ                                              |
| Nhóm/kênh          | Được hỗ trợ (mặc định yêu cầu lượt nhắc)                 |
| Luồng thảo luận    | Được hỗ trợ (tiếp tục phản hồi sau khi đã tham gia)      |
| Văn bản đa dạng thức | Markdown được chuyển đổi sang định dạng bản địa của Tlon |
| Hình ảnh           | Tải xuống khi nhận, tải lên khi gửi                      |
| Cảm xúc            | Chỉ qua [skill tích hợp sẵn](#bundled-skill)             |
| Cuộc thăm dò ý kiến | Không được hỗ trợ                                        |
| Lệnh bản địa       | Theo mặc định chỉ dành cho chủ sở hữu                    |

## Khắc phục sự cố

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Các lỗi thường gặp:

- **Tin nhắn trực tiếp bị bỏ qua**: người gửi không có trong `dmAllowlist` và chưa cấu hình `ownerShip` cho quy trình phê duyệt.
- **Tin nhắn nhóm bị bỏ qua**: kênh chưa được khám phá/ghim hoặc người gửi không vượt qua bước ủy quyền và không có
  `ownerShip` để đưa yêu cầu phê duyệt vào hàng đợi.
- **Lỗi kết nối**: kiểm tra xem URL tàu có thể truy cập được hay không; đặt
  `network.dangerouslyAllowPrivateNetwork` cho tàu cục bộ.
- **Lỗi xác thực**: mã đăng nhập thay đổi định kỳ — hãy sao chép mã hiện tại từ tàu của bạn.

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

| Khóa                                                   | Ý nghĩa                                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Bật/tắt khởi động kênh.                                                       |
| `channels.tlon.ship`                                   | Tên tàu Urbit của bot (ví dụ: `~sampel-palnet`).                              |
| `channels.tlon.url`                                    | URL tàu (ví dụ: `https://sampel-palnet.tlon.network`).                        |
| `channels.tlon.code`                                   | Mã đăng nhập của tàu.                                                         |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Cho phép URL tàu localhost/LAN (phải chủ động bật SSRF).                      |
| `channels.tlon.ownerShip`                              | Tàu chủ sở hữu: luôn được ủy quyền, nhận các yêu cầu phê duyệt.               |
| `channels.tlon.dmAllowlist`                            | Các tàu được phép gửi tin nhắn trực tiếp (trống = không tàu nào ngoài chủ sở hữu). |
| `channels.tlon.autoAcceptDmInvites`                    | Tự động chấp nhận tin nhắn trực tiếp từ các tàu trong `dmAllowlist`.          |
| `channels.tlon.autoAcceptGroupInvites`                 | Tự động chấp nhận lời mời nhóm từ `groupInviteAllowlist`.                     |
| `channels.tlon.groupInviteAllowlist`                   | Các tàu có lời mời nhóm được tự động chấp nhận.                               |
| `channels.tlon.autoDiscoverChannels`                   | Tự động khám phá các kênh nhóm đã tham gia (mặc định: `false`).                |
| `channels.tlon.groupChannels`                          | Các tổ kênh được ghim thủ công.                                               |
| `channels.tlon.defaultAuthorizedShips`                 | Các tàu được ủy quyền cho mọi kênh (dùng khi không có quy tắc nào khớp).       |
| `channels.tlon.authorization.channelRules`             | Chế độ xác thực + danh sách cho phép theo từng tổ kênh.                       |
| `channels.tlon.showModelSignature`                     | Nối `_[Được tạo bởi <model>]_` vào phản hồi.                                  |
| `channels.tlon.responsePrefix`                         | Tiền tố tĩnh được thêm vào trước phản hồi gửi đi.                             |
| `channels.tlon.accounts.<id>`                          | Các tài khoản có tên bổ sung (thiết lập nhiều tàu).                           |

## Ghi chú

- Phản hồi nhóm cần lượt nhắc bằng @ (ví dụ: `~your-bot-ship`), trừ khi bot đã tham gia luồng thảo luận đó.
- Phản hồi cho luồng thảo luận được gửi vào chính luồng đó; bot cũng nhận 10 tin nhắn gần nhất trong ngữ cảnh luồng được thêm vào trước
  cho agent.
- Văn bản đa dạng thức (in đậm, in nghiêng, mã, tiêu đề, danh sách) được chuyển đổi sang định dạng bản địa của Tlon.
- Gửi một tin nhắn đến yêu cầu tóm tắt kênh (ví dụ: "tóm tắt
  kênh này") sẽ kích hoạt tính năng tóm tắt lịch sử tích hợp thay vì quy trình phản hồi thông thường.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — quy trình xác thực và ghép đôi qua tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế yêu cầu lượt nhắc
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
