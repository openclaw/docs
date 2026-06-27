---
read_when:
    - Thiết lập Matrix trong OpenClaw
    - Cấu hình Matrix E2EE và xác minh
summary: Trạng thái hỗ trợ Matrix, thiết lập và ví dụ cấu hình
title: Ma trận
x-i18n:
    generated_at: "2026-06-27T17:11:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix là một Plugin kênh có thể tải xuống cho OpenClaw.
Nó sử dụng `matrix-js-sdk` chính thức và hỗ trợ DM, phòng, luồng, phương tiện, phản ứng, bình chọn, vị trí và E2EE.

## Cài đặt

Cài đặt Matrix từ ClawHub trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/matrix
```

Thông số Plugin trần sẽ thử ClawHub trước, rồi mới dự phòng sang npm. Để buộc nguồn registry, hãy dùng `openclaw plugins install clawhub:@openclaw/matrix` hoặc `openclaw plugins install npm:@openclaw/matrix`.

Từ một checkout cục bộ:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` đăng ký và bật Plugin, nên không cần bước `openclaw plugins enable matrix` riêng. Plugin vẫn chưa làm gì cho đến khi bạn cấu hình kênh bên dưới. Xem [Plugins](/vi/tools/plugin) để biết hành vi Plugin chung và quy tắc cài đặt.

## Thiết lập

1. Tạo tài khoản Matrix trên homeserver của bạn.
2. Cấu hình `channels.matrix` bằng `homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`.
3. Khởi động lại gateway.
4. Bắt đầu một DM với bot, hoặc mời bot vào một phòng (xem [tự động tham gia](#auto-join) - lời mời mới chỉ được chấp nhận khi `autoJoin` cho phép).

### Thiết lập tương tác

```bash
openclaw channels add
openclaw configure --section channels
```

Trình hướng dẫn sẽ hỏi: URL homeserver, phương thức xác thực (access token hoặc mật khẩu), ID người dùng (chỉ với xác thực bằng mật khẩu), tên thiết bị tùy chọn, có bật E2EE hay không, và có cấu hình quyền truy cập phòng cùng tự động tham gia hay không.

Nếu các biến môi trường `MATRIX_*` tương ứng đã tồn tại và tài khoản đã chọn chưa có xác thực đã lưu, trình hướng dẫn sẽ đề xuất lối tắt bằng biến môi trường. Để phân giải tên phòng trước khi lưu allowlist, hãy chạy `openclaw channels resolve --channel matrix "Project Room"`. Khi E2EE được bật, trình hướng dẫn ghi cấu hình và chạy cùng bootstrap như [`openclaw matrix encryption setup`](#encryption-and-verification).

### Cấu hình tối thiểu

Dựa trên token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Dựa trên mật khẩu (token được lưu vào bộ nhớ đệm sau lần đăng nhập đầu tiên):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### Tự động tham gia

`channels.matrix.autoJoin` mặc định là `off`. Với mặc định này, bot sẽ không xuất hiện trong phòng hoặc DM mới từ các lời mời mới cho đến khi bạn tham gia thủ công.

OpenClaw không thể biết tại thời điểm được mời liệu phòng được mời là DM hay nhóm, nên mọi lời mời - bao gồm cả lời mời kiểu DM - đều đi qua `autoJoin` trước. `dm.policy` chỉ áp dụng sau đó, khi bot đã tham gia và phòng đã được phân loại.

<Warning>
Đặt `autoJoin: "allowlist"` cộng với `autoJoinAllowlist` để giới hạn những lời mời bot chấp nhận, hoặc `autoJoin: "always"` để chấp nhận mọi lời mời.

`autoJoinAllowlist` chỉ chấp nhận các đích ổn định: `!roomId:server`, `#alias:server`, hoặc `*`. Tên phòng dạng văn bản thường bị từ chối; các mục alias được phân giải theo homeserver, không theo trạng thái mà phòng được mời khai báo.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Để chấp nhận mọi lời mời, dùng `autoJoin: "always"`.

### Định dạng đích allowlist

Allowlist cho DM và phòng tốt nhất nên được điền bằng ID ổn định:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): dùng `@user:server`. Tên hiển thị mặc định bị bỏ qua vì có thể thay đổi; chỉ đặt `dangerouslyAllowNameMatching: true` khi bạn thật sự cần tương thích với các mục tên hiển thị.
- Khóa allowlist của phòng (`groups`, `rooms` cũ): dùng `!room:server` hoặc `#alias:server`. Tên phòng dạng văn bản thường mặc định bị bỏ qua; chỉ đặt `dangerouslyAllowNameMatching: true` khi bạn thật sự cần tương thích với tra cứu tên phòng đã tham gia.
- Allowlist lời mời (`autoJoinAllowlist`): dùng `!room:server`, `#alias:server`, hoặc `*`. Tên phòng dạng văn bản thường bị từ chối.

### Chuẩn hóa ID tài khoản

Trình hướng dẫn chuyển một tên thân thiện thành ID tài khoản đã chuẩn hóa. Ví dụ, `Ops Bot` trở thành `ops-bot`. Dấu câu được escape trong tên biến môi trường có phạm vi để hai tài khoản không thể trùng nhau: `-` → `_X2D_`, nên `ops-prod` ánh xạ tới `MATRIX_OPS_X2D_PROD_*`.

### Thông tin xác thực đã lưu trong bộ nhớ đệm

Matrix lưu thông tin xác thực đã cache dưới `~/.openclaw/credentials/matrix/`:

- tài khoản mặc định: `credentials.json`
- tài khoản có tên: `credentials-<account>.json`

Khi thông tin xác thực đã cache tồn tại ở đó, OpenClaw xem Matrix là đã được cấu hình ngay cả khi access token không nằm trong tệp cấu hình - điều này bao gồm thiết lập, `openclaw doctor`, và các probe trạng thái kênh.

### Biến môi trường

Được dùng khi khóa cấu hình tương đương chưa được đặt. Tài khoản mặc định dùng tên không có tiền tố; tài khoản có tên dùng ID tài khoản được chèn trước hậu tố.

| Tài khoản mặc định    | Tài khoản có tên (`<ID>` là ID tài khoản đã chuẩn hóa) |
| --------------------- | ------------------------------------------------------ |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                              |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                             |

Với tài khoản `ops`, tên sẽ trở thành `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, v.v. Các biến môi trường recovery-key được đọc bởi các luồng CLI có nhận biết khôi phục (`verify backup restore`, `verify device`, `verify bootstrap`) khi bạn pipe khóa vào qua `--recovery-key-stdin`.

`MATRIX_HOMESERVER` không thể được đặt từ `.env` của workspace; xem [Tệp `.env` của workspace](/vi/gateway/security).

## Ví dụ cấu hình

Một baseline thực tế với ghép đôi DM, allowlist phòng, và E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Bản xem trước streaming

Streaming trả lời của Matrix là tùy chọn bật. `streaming` kiểm soát cách OpenClaw gửi trả lời của trợ lý khi đang tạo; `blockStreaming` kiểm soát việc mỗi khối đã hoàn tất có được giữ lại như một tin nhắn Matrix riêng hay không.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Để giữ bản xem trước câu trả lời trực tiếp nhưng ẩn các dòng công cụ/tiến trình tạm thời, hãy dùng dạng đối tượng:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`          | Hành vi                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (mặc định)   | Chờ toàn bộ trả lời, gửi một lần. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                   |
| `"partial"`          | Sửa một tin nhắn văn bản bình thường tại chỗ khi mô hình viết khối hiện tại. Các client Matrix mặc định có thể thông báo ở bản xem trước đầu tiên, không phải lần sửa cuối. |
| `"quiet"`            | Giống `"partial"` nhưng tin nhắn là một notice không phát thông báo. Người nhận chỉ nhận thông báo khi một quy tắc push theo người dùng khớp với lần sửa đã hoàn tất (xem bên dưới). |

`blockStreaming` độc lập với `streaming`:

| `streaming`             | `blockStreaming: true`                                      | `blockStreaming: false` (mặc định)                  |
| ----------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `"partial"` / `"quiet"` | Bản nháp trực tiếp cho khối hiện tại, khối đã hoàn tất được giữ làm tin nhắn | Bản nháp trực tiếp cho khối hiện tại, hoàn tất tại chỗ |
| `"off"`                 | Một tin nhắn Matrix có thông báo cho mỗi khối hoàn tất      | Một tin nhắn Matrix có thông báo cho toàn bộ trả lời |

Ghi chú:

- Nếu một bản xem trước vượt quá giới hạn kích thước mỗi sự kiện của Matrix, OpenClaw dừng streaming bản xem trước và dự phòng sang chỉ gửi bản cuối.
- Các trả lời phương tiện luôn gửi tệp đính kèm bình thường. Nếu một bản xem trước cũ không còn có thể được tái sử dụng an toàn, OpenClaw sẽ redact nó trước khi gửi trả lời phương tiện cuối cùng.
- Cập nhật bản xem trước tiến trình công cụ được bật mặc định khi streaming bản xem trước Matrix đang hoạt động. Đặt `streaming.preview.toolProgress: false` để giữ các chỉnh sửa bản xem trước cho văn bản câu trả lời nhưng để tiến trình công cụ đi theo đường gửi bình thường.
- Chỉnh sửa bản xem trước tốn thêm lệnh gọi API Matrix. Giữ `streaming: "off"` nếu bạn muốn hồ sơ rate-limit thận trọng nhất.

## Tin nhắn thoại

Ghi chú thoại Matrix gửi vào được phiên âm trước cổng kiểm tra nhắc tên trong phòng. Điều này cho phép một ghi chú thoại nói tên bot kích hoạt agent trong phòng `requireMention: true`, và cung cấp cho agent bản phiên âm thay vì chỉ một placeholder tệp đính kèm âm thanh.

Matrix sử dụng nhà cung cấp phương tiện âm thanh dùng chung được cấu hình dưới `tools.media.audio`, chẳng hạn OpenAI `gpt-4o-mini-transcribe`. Xem [Tổng quan công cụ phương tiện](/vi/tools/media-overview) để biết thiết lập nhà cung cấp và giới hạn.

Chi tiết hành vi:

- Sự kiện `m.audio` và sự kiện `m.file` có MIME type `audio/*` đủ điều kiện.
- Trong phòng được mã hóa, OpenClaw giải mã tệp đính kèm qua đường dẫn phương tiện Matrix hiện có trước khi phiên âm.
- Bản phiên âm được đánh dấu là do máy tạo và không đáng tin cậy trong prompt của agent.
- Tệp đính kèm được đánh dấu là đã phiên âm để các công cụ phương tiện downstream không phiên âm lại cùng ghi chú thoại.
- Đặt `tools.media.audio.enabled: false` để tắt phiên âm âm thanh trên toàn cục.

## Metadata phê duyệt

Prompt phê duyệt native của Matrix là các sự kiện `m.room.message` bình thường với nội dung sự kiện tùy chỉnh dành riêng cho OpenClaw dưới `com.openclaw.approval`. Matrix cho phép khóa nội dung sự kiện tùy chỉnh, nên các client mặc định vẫn render phần thân văn bản trong khi client có nhận biết OpenClaw có thể đọc id phê duyệt có cấu trúc, loại, trạng thái, các quyết định khả dụng, và chi tiết exec/Plugin.

Khi một prompt phê duyệt quá dài cho một sự kiện Matrix, OpenClaw chia nhỏ văn bản hiển thị và chỉ gắn `com.openclaw.approval` vào khối đầu tiên. Phản ứng cho quyết định cho phép/từ chối được ràng buộc với sự kiện đầu tiên đó, nên prompt dài vẫn giữ cùng đích phê duyệt như prompt một sự kiện.

### Quy tắc push tự host cho bản xem trước đã hoàn tất ở chế độ quiet

`streaming: "quiet"` chỉ thông báo cho người nhận sau khi một khối hoặc lượt đã hoàn tất - một quy tắc push theo người dùng phải khớp với marker bản xem trước đã hoàn tất. Xem [Quy tắc push Matrix cho bản xem trước quiet](/vi/channels/matrix-push-rules) để có công thức đầy đủ (token người nhận, kiểm tra pusher, cài đặt quy tắc, ghi chú theo homeserver).

## Phòng bot với bot

Theo mặc định, tin nhắn Matrix từ các tài khoản Matrix OpenClaw đã cấu hình khác bị bỏ qua.

Dùng `allowBots` khi bạn chủ động muốn lưu lượng Matrix giữa các agent:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` chấp nhận tin nhắn từ các tài khoản bot Matrix đã cấu hình khác trong các phòng và DM được cho phép.
- `allowBots: "mentions"` chỉ chấp nhận các tin nhắn đó khi chúng nhắc đến bot này một cách hiển thị trong phòng. DM vẫn được cho phép.
- `groups.<room>.allowBots` ghi đè thiết lập cấp tài khoản cho một phòng.
- Tin nhắn từ bot đã cấu hình được chấp nhận sẽ dùng chung [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection). Cấu hình `channels.defaults.botLoopProtection`, rồi ghi đè bằng `channels.matrix.botLoopProtection` hoặc `channels.matrix.groups.<room>.botLoopProtection` khi một phòng cần ngân sách khác.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng một ID người dùng Matrix để tránh vòng lặp tự trả lời.
- Matrix không cung cấp cờ bot gốc ở đây; OpenClaw xem "do bot viết" là "được gửi bởi một tài khoản Matrix đã cấu hình khác trên Gateway OpenClaw này".

Hãy dùng danh sách phòng cho phép nghiêm ngặt và yêu cầu nhắc đến khi bật lưu lượng bot với bot trong các phòng dùng chung.

## Mã hóa và xác minh

Trong các phòng được mã hóa (E2EE), sự kiện ảnh gửi đi dùng `thumbnail_file` để bản xem trước ảnh cũng được mã hóa cùng với tệp đính kèm đầy đủ. Phòng không mã hóa vẫn dùng `thumbnail_url` dạng thường. Không cần cấu hình - Plugin tự động phát hiện trạng thái E2EE.

Tất cả lệnh `openclaw matrix` đều chấp nhận `--verbose` (chẩn đoán đầy đủ), `--json` (đầu ra đọc được bằng máy), và `--account <id>` (thiết lập nhiều tài khoản). Đầu ra mặc định ngắn gọn với ghi nhật ký SDK nội bộ ở chế độ yên lặng. Các ví dụ bên dưới hiển thị dạng chuẩn; thêm cờ khi cần.

### Bật mã hóa

```bash
openclaw matrix encryption setup
```

Khởi tạo kho bí mật và ký chéo, tạo bản sao lưu khóa phòng nếu cần, rồi in trạng thái và các bước tiếp theo. Các cờ hữu ích:

- `--recovery-key <key>` áp dụng khóa khôi phục trước khi khởi tạo (ưu tiên dạng stdin được ghi tài liệu bên dưới)
- `--force-reset-cross-signing` loại bỏ danh tính ký chéo hiện tại và tạo danh tính mới (chỉ dùng khi có chủ ý)

Với tài khoản mới, bật E2EE khi tạo:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` là bí danh của `--enable-e2ee`.

Cấu hình thủ công tương đương:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### Trạng thái và tín hiệu tin cậy

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` báo cáo ba tín hiệu tin cậy độc lập (`--verbose` hiển thị tất cả):

- `Locally trusted`: chỉ được máy khách này tin cậy
- `Cross-signing verified`: SDK báo cáo xác minh qua ký chéo
- `Signed by owner`: được ký bằng khóa tự ký của chính bạn (chỉ để chẩn đoán)

`Verified by owner` chỉ trở thành `yes` khi `Cross-signing verified` là `yes`. Chỉ riêng tin cậy cục bộ hoặc chữ ký của chủ sở hữu là chưa đủ.

`--allow-degraded-local-state` trả về chẩn đoán nỗ lực tốt nhất mà không chuẩn bị tài khoản Matrix trước; hữu ích cho thăm dò ngoại tuyến hoặc cấu hình một phần.

### Xác minh thiết bị này bằng khóa khôi phục

Khóa khôi phục là dữ liệu nhạy cảm - hãy truyền qua stdin thay vì truyền trên dòng lệnh. Đặt `MATRIX_RECOVERY_KEY` (hoặc `MATRIX_<ID>_RECOVERY_KEY` cho tài khoản có tên):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Lệnh báo cáo ba trạng thái:

- `Recovery key accepted`: Matrix đã chấp nhận khóa cho kho bí mật hoặc tin cậy thiết bị.
- `Backup usable`: có thể tải bản sao lưu khóa phòng bằng vật liệu khôi phục đáng tin cậy.
- `Device verified by owner`: thiết bị này có tin cậy danh tính ký chéo Matrix đầy đủ.

Lệnh thoát với mã khác không khi tin cậy danh tính đầy đủ chưa hoàn tất, ngay cả khi khóa khôi phục đã mở khóa vật liệu sao lưu. Trong trường hợp đó, hãy hoàn tất tự xác minh từ một máy khách Matrix khác:

```bash
openclaw matrix verify self
```

`verify self` chờ đến khi `Cross-signing verified: yes` trước khi thoát thành công. Dùng `--timeout-ms <ms>` để điều chỉnh thời gian chờ.

Dạng khóa trực tiếp `openclaw matrix verify device "<recovery-key>"` cũng được chấp nhận, nhưng khóa sẽ nằm trong lịch sử shell của bạn.

### Khởi tạo hoặc sửa ký chéo

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` là lệnh sửa chữa và thiết lập cho tài khoản được mã hóa. Theo thứ tự, lệnh này:

- khởi tạo kho bí mật, tái sử dụng khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa công khai còn thiếu
- đánh dấu và ký chéo thiết bị hiện tại
- tạo bản sao lưu khóa phòng phía máy chủ nếu chưa tồn tại

Nếu homeserver yêu cầu UIA để tải khóa ký chéo lên, OpenClaw thử không xác thực trước, rồi `m.login.dummy`, rồi `m.login.password` (yêu cầu `channels.matrix.password`).

Các cờ hữu ích:

- `--recovery-key-stdin` (dùng cùng `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) hoặc `--recovery-key <key>`
- `--force-reset-cross-signing` để loại bỏ danh tính ký chéo hiện tại (chỉ khi có chủ ý; yêu cầu khóa khôi phục đang hoạt động được lưu hoặc được cung cấp bằng `--recovery-key-stdin`)

### Sao lưu khóa phòng

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` hiển thị liệu bản sao lưu phía máy chủ có tồn tại hay không và liệu thiết bị này có thể giải mã nó hay không. `backup restore` nhập các khóa phòng đã sao lưu vào kho mã hóa cục bộ; nếu khóa khôi phục đã có trên đĩa, bạn có thể bỏ qua `--recovery-key-stdin`.

Để thay bản sao lưu bị hỏng bằng đường cơ sở mới (chấp nhận mất lịch sử cũ không thể khôi phục; cũng có thể tạo lại kho bí mật nếu bí mật sao lưu hiện tại không tải được):

```bash
openclaw matrix verify backup reset --yes
```

Chỉ thêm `--rotate-recovery-key` khi bạn có chủ ý muốn khóa khôi phục trước đó ngừng mở khóa đường cơ sở sao lưu mới.

### Liệt kê, yêu cầu và phản hồi xác minh

```bash
openclaw matrix verify list
```

Liệt kê các yêu cầu xác minh đang chờ cho tài khoản đã chọn.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Gửi yêu cầu xác minh từ tài khoản OpenClaw này. `--own-user` yêu cầu tự xác minh (bạn chấp nhận lời nhắc trong một máy khách Matrix khác của cùng người dùng); `--user-id`/`--device-id`/`--room-id` nhắm đến người khác. Không thể kết hợp `--own-user` với các cờ nhắm mục tiêu khác.

Để xử lý vòng đời cấp thấp hơn - thường là khi theo dõi các yêu cầu đến từ một máy khách khác - các lệnh này tác động lên một yêu cầu `<id>` cụ thể (được in bởi `verify list` và `verify request`):

| Lệnh                                       | Mục đích                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Chấp nhận một yêu cầu đến                                           |
| `openclaw matrix verify start <id>`        | Bắt đầu luồng SAS                                                   |
| `openclaw matrix verify sas <id>`          | In emoji hoặc số thập phân SAS                                      |
| `openclaw matrix verify confirm-sas <id>`  | Xác nhận SAS khớp với nội dung máy khách kia hiển thị               |
| `openclaw matrix verify mismatch-sas <id>` | Từ chối SAS khi emoji hoặc số thập phân không khớp                  |
| `openclaw matrix verify cancel <id>`       | Hủy; nhận tùy chọn `--reason <text>` và `--code <matrix-code>`      |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, và `cancel` đều chấp nhận `--user-id` và `--room-id` làm gợi ý theo dõi DM khi xác minh được neo vào một phòng tin nhắn trực tiếp cụ thể.

### Ghi chú nhiều tài khoản

Khi không có `--account <id>`, các lệnh CLI Matrix dùng tài khoản mặc định ngầm định. Nếu bạn có nhiều tài khoản có tên và chưa đặt `channels.matrix.defaultAccount`, chúng sẽ từ chối đoán và yêu cầu bạn chọn. Khi E2EE bị tắt hoặc không khả dụng cho một tài khoản có tên, lỗi sẽ trỏ đến khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Với `encryption: true`, `startupVerification` mặc định là `"if-unverified"`. Khi khởi động, một thiết bị chưa xác minh sẽ yêu cầu tự xác minh trong một máy khách Matrix khác, bỏ qua bản trùng lặp và áp dụng thời gian chờ (mặc định 24 giờ). Điều chỉnh bằng `startupVerificationCooldownHours` hoặc tắt bằng `startupVerification: "off"`.

    Khởi động cũng chạy một lượt khởi tạo mã hóa thận trọng, tái sử dụng kho bí mật và danh tính ký chéo hiện tại. Nếu trạng thái khởi tạo bị hỏng, OpenClaw thử sửa chữa có bảo vệ ngay cả khi không có `channels.matrix.password`; nếu homeserver yêu cầu UIA bằng mật khẩu, khởi động ghi cảnh báo và vẫn không gây lỗi nghiêm trọng. Các thiết bị đã được chủ sở hữu ký được giữ nguyên.

    Xem [di chuyển Matrix](/vi/channels/matrix-migration) để biết đầy đủ luồng nâng cấp.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix đăng thông báo vòng đời xác minh vào phòng xác minh DM nghiêm ngặt dưới dạng tin nhắn `m.notice`: yêu cầu, sẵn sàng (với hướng dẫn "Xác minh bằng emoji"), bắt đầu/hoàn tất, và chi tiết SAS (emoji/số thập phân) khi có.

    Yêu cầu đến từ một máy khách Matrix khác được theo dõi và tự động chấp nhận. Với tự xác minh, OpenClaw tự động bắt đầu luồng SAS và xác nhận phía của nó khi xác minh emoji khả dụng - bạn vẫn cần so sánh và xác nhận "Chúng khớp" trong máy khách Matrix của mình.

    Thông báo hệ thống xác minh không được chuyển tiếp vào pipeline trò chuyện của agent.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Nếu `verify status` cho biết thiết bị hiện tại không còn được liệt kê trên homeserver, hãy tạo thiết bị Matrix OpenClaw mới. Với đăng nhập bằng mật khẩu:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Với xác thực token, tạo access token mới trong máy khách Matrix hoặc giao diện quản trị, rồi cập nhật OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Thay `assistant` bằng ID tài khoản từ lệnh thất bại, hoặc bỏ qua `--account` cho tài khoản mặc định.

  </Accordion>

  <Accordion title="Device hygiene">
    Các thiết bị cũ do OpenClaw quản lý có thể tích lũy. Liệt kê và dọn bỏ:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    E2EE Matrix dùng đường dẫn mã hóa Rust chính thức của `matrix-js-sdk` với `fake-indexeddb` làm shim IndexedDB. Trạng thái mã hóa được lưu vào `crypto-idb-snapshot.json` (quyền tệp hạn chế).

    Trạng thái runtime được mã hóa nằm dưới `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` và bao gồm kho đồng bộ, kho mã hóa, khóa khôi phục, ảnh chụp IDB, liên kết luồng, và trạng thái xác minh khởi động. Khi token thay đổi nhưng danh tính tài khoản giữ nguyên, OpenClaw tái sử dụng gốc hiện có tốt nhất để trạng thái trước đó vẫn hiển thị.

  </Accordion>
</AccordionGroup>

## Quản lý hồ sơ

Cập nhật hồ sơ tự thân Matrix cho tài khoản đã chọn:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Bạn có thể truyền cả hai tùy chọn trong một lần gọi. Matrix chấp nhận trực tiếp URL ảnh đại diện `mxc://`; khi bạn truyền `http://` hoặc `https://`, OpenClaw sẽ tải tệp lên trước và lưu URL `mxc://` đã phân giải vào `channels.matrix.avatarUrl` (hoặc phần ghi đè theo từng tài khoản).

## Luồng

Matrix hỗ trợ luồng Matrix gốc cho cả trả lời tự động và gửi qua công cụ nhắn tin. Hai nút điều khiển độc lập kiểm soát hành vi:

### Định tuyến phiên (`sessionScope`)

`dm.sessionScope` quyết định cách các phòng DM Matrix ánh xạ tới phiên OpenClaw:

- `"per-user"` (mặc định): tất cả phòng DM có cùng peer được định tuyến dùng chung một phiên.
- `"per-room"`: mỗi phòng DM Matrix có khóa phiên riêng, ngay cả khi peer giống nhau.

Ràng buộc cuộc trò chuyện rõ ràng luôn thắng `sessionScope`, vì vậy các phòng và luồng đã ràng buộc giữ phiên đích đã chọn.

### Trả lời theo luồng (`threadReplies`)

`threadReplies` quyết định nơi bot đăng câu trả lời:

- `"off"`: câu trả lời ở cấp cao nhất. Tin nhắn có luồng gửi đến vẫn nằm trên phiên cha.
- `"inbound"`: chỉ trả lời bên trong luồng khi tin nhắn gửi đến đã nằm trong luồng đó.
- `"always"`: trả lời bên trong một luồng bắt nguồn từ tin nhắn kích hoạt; cuộc trò chuyện đó được định tuyến qua một phiên theo phạm vi luồng tương ứng từ lần kích hoạt đầu tiên trở đi.

`dm.threadReplies` ghi đè tùy chọn này chỉ cho DM - ví dụ, giữ luồng phòng tách biệt trong khi giữ DM phẳng.

### Kế thừa luồng và lệnh gạch chéo

- Tin nhắn có luồng gửi đến bao gồm tin nhắn gốc của luồng dưới dạng ngữ cảnh agent bổ sung.
- Các lần gửi qua công cụ nhắn tin tự động kế thừa luồng Matrix hiện tại khi nhắm tới cùng phòng (hoặc cùng đích người dùng DM), trừ khi cung cấp `threadId` rõ ràng.
- Việc tái sử dụng đích người dùng DM chỉ được kích hoạt khi siêu dữ liệu phiên hiện tại chứng minh cùng peer DM trên cùng tài khoản Matrix; nếu không, OpenClaw quay về định tuyến theo phạm vi người dùng bình thường.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và `/acp spawn` đã ràng buộc luồng đều hoạt động trong phòng Matrix và DM.
- `/focus` cấp cao nhất tạo một luồng Matrix mới và ràng buộc luồng đó với phiên đích khi `threadBindings.spawnSessions` được bật.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có sẽ ràng buộc luồng đó tại chỗ.

Khi OpenClaw phát hiện một phòng DM Matrix va chạm với một phòng DM khác trên cùng phiên dùng chung, nó đăng một lần `m.notice` trong phòng đó trỏ tới lối thoát `/focus` và đề xuất thay đổi `dm.sessionScope`. Thông báo chỉ xuất hiện khi ràng buộc luồng được bật.

## Ràng buộc cuộc trò chuyện ACP

Phòng Matrix, DM và các luồng Matrix hiện có có thể được chuyển thành không gian làm việc ACP bền vững mà không thay đổi bề mặt chat.

Luồng thao tác nhanh cho người vận hành:

- Chạy `/acp spawn codex --bind here` bên trong DM Matrix, phòng hoặc luồng hiện có mà bạn muốn tiếp tục sử dụng.
- Trong DM hoặc phòng Matrix cấp cao nhất, DM/phòng hiện tại vẫn là bề mặt chat và các tin nhắn tương lai định tuyến tới phiên ACP đã sinh.
- Bên trong một luồng Matrix hiện có, `--bind here` ràng buộc luồng hiện tại đó tại chỗ.
- `/new` và `/reset` đặt lại cùng phiên ACP đã ràng buộc tại chỗ.
- `/acp close` đóng phiên ACP và xóa ràng buộc.

Ghi chú:

- `--bind here` không tạo luồng Matrix con.
- `threadBindings.spawnSessions` kiểm soát `/acp spawn --thread auto|here`, khi OpenClaw cần tạo hoặc ràng buộc một luồng Matrix con.

### Cấu hình ràng buộc luồng

Matrix kế thừa mặc định toàn cục từ `session.threadBindings`, đồng thời cũng hỗ trợ ghi đè theo từng kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Sinh phiên đã ràng buộc luồng Matrix được bật mặc định:

- Đặt `threadBindings.spawnSessions: false` để chặn `/focus` cấp cao nhất và `/acp spawn --thread auto|here` tạo/ràng buộc luồng Matrix.
- Đặt `threadBindings.defaultSpawnContext: "isolated"` khi việc sinh luồng subagent gốc không nên fork bản ghi phiên cha.

## Phản ứng

Matrix hỗ trợ phản ứng gửi đi, thông báo phản ứng gửi đến và phản ứng xác nhận.

Công cụ phản ứng gửi đi được kiểm soát bởi `channels.matrix.actions.reactions`:

- `react` thêm một phản ứng vào sự kiện Matrix.
- `reactions` liệt kê tóm tắt phản ứng hiện tại cho sự kiện Matrix.
- `emoji=""` xóa các phản ứng của chính bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji đã chỉ định khỏi bot.

**Thứ tự phân giải** (giá trị được định nghĩa đầu tiên sẽ thắng):

| Cài đặt                 | Thứ tự                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | theo tài khoản → kênh → `messages.ackReaction` → dự phòng emoji danh tính agent   |
| `ackReactionScope`      | theo tài khoản → kênh → `messages.ackReactionScope` → mặc định `"group-mentions"` |
| `reactionNotifications` | theo tài khoản → kênh → mặc định `"own"`                                          |

`reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` đã thêm khi chúng nhắm tới tin nhắn Matrix do bot viết; `"off"` tắt sự kiện hệ thống phản ứng. Các lần xóa phản ứng không được tổng hợp thành sự kiện hệ thống vì Matrix hiển thị chúng dưới dạng redaction, không phải dưới dạng các lần xóa `m.reaction` độc lập.

## Ngữ cảnh lịch sử

- `channels.matrix.historyLimit` kiểm soát số lượng tin nhắn phòng gần đây được bao gồm dưới dạng `InboundHistory` khi một tin nhắn phòng Matrix kích hoạt agent. Quay về `messages.groupChat.historyLimit`; nếu cả hai đều chưa đặt, mặc định hiệu dụng là `0`. Đặt `0` để tắt.
- Lịch sử phòng Matrix chỉ dành cho phòng. DM tiếp tục dùng lịch sử phiên bình thường.
- Lịch sử phòng Matrix chỉ ở trạng thái chờ: OpenClaw đệm các tin nhắn phòng chưa kích hoạt trả lời, sau đó chụp nhanh cửa sổ đó khi có lượt nhắc đến hoặc kích hoạt khác đến.
- Tin nhắn kích hoạt hiện tại không được bao gồm trong `InboundHistory`; nó vẫn nằm trong nội dung gửi đến chính cho lượt đó.
- Các lần thử lại cùng sự kiện Matrix tái sử dụng ảnh chụp lịch sử ban đầu thay vì trôi tới các tin nhắn phòng mới hơn.

## Khả năng hiển thị ngữ cảnh

Matrix hỗ trợ điều khiển `contextVisibility` dùng chung cho ngữ cảnh phòng bổ sung như văn bản trả lời đã lấy, gốc luồng và lịch sử đang chờ.

- `contextVisibility: "all"` là mặc định. Ngữ cảnh bổ sung được giữ nguyên như đã nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo những người gửi được các kiểm tra allowlist phòng/người dùng đang hoạt động cho phép.
- `contextVisibility: "allowlist_quote"` hoạt động như `allowlist`, nhưng vẫn giữ một câu trả lời trích dẫn rõ ràng.

Cài đặt này ảnh hưởng đến khả năng hiển thị ngữ cảnh bổ sung, không ảnh hưởng đến việc chính tin nhắn gửi đến có thể kích hoạt trả lời hay không.
Ủy quyền kích hoạt vẫn đến từ `groupPolicy`, `groups`, `groupAllowFrom` và các cài đặt chính sách DM.

## Chính sách DM và phòng

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Để tắt hoàn toàn DM trong khi vẫn giữ phòng hoạt động, đặt `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Xem [Nhóm](/vi/channels/groups) để biết hành vi chặn theo lượt nhắc đến và allowlist.

Ví dụ ghép đôi cho DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được phê duyệt tiếp tục nhắn tin cho bạn trước khi được phê duyệt, OpenClaw tái sử dụng cùng mã ghép đôi đang chờ và có thể gửi một câu trả lời nhắc sau một khoảng hồi ngắn thay vì tạo mã mới.

Xem [Ghép đôi](/vi/channels/pairing) để biết luồng ghép đôi DM dùng chung và bố cục lưu trữ.

## Sửa chữa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp lệch đồng bộ, OpenClaw có thể kết thúc với các ánh xạ `m.direct` lỗi thời trỏ tới các phòng solo cũ thay vì DM đang hoạt động. Kiểm tra ánh xạ hiện tại cho một peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa chữa:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Cả hai lệnh chấp nhận `--account <id>` cho thiết lập nhiều tài khoản. Luồng sửa chữa:

- ưu tiên một DM 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- quay về bất kỳ DM 1:1 nghiêm ngặt hiện đang tham gia nào với người dùng đó
- tạo một phòng trực tiếp mới và ghi lại `m.direct` nếu không có DM lành mạnh

Nó không tự động xóa phòng cũ. Nó chọn DM lành mạnh và cập nhật ánh xạ để các lần gửi Matrix, thông báo xác minh và các luồng tin nhắn trực tiếp khác trong tương lai nhắm tới đúng phòng.

## Phê duyệt exec

Matrix có thể hoạt động như một client phê duyệt gốc. Cấu hình trong `channels.matrix.execApprovals` (hoặc `channels.matrix.accounts.<account>.execApprovals` để ghi đè theo từng tài khoản):

- `enabled`: gửi phê duyệt qua lời nhắc gốc của Matrix. Khi chưa đặt hoặc là `"auto"`, Matrix tự động bật khi có thể phân giải ít nhất một người phê duyệt. Đặt `false` để tắt rõ ràng.
- `approvers`: ID người dùng Matrix (`@owner:example.org`) được phép phê duyệt yêu cầu exec. Tùy chọn - quay về `channels.matrix.dm.allowFrom`.
- `target`: nơi gửi lời nhắc. `"dm"` (mặc định) gửi tới DM của người phê duyệt; `"channel"` gửi tới phòng Matrix hoặc DM khởi nguồn; `"both"` gửi tới cả hai.
- `agentFilter` / `sessionFilter`: allowlist tùy chọn cho những agent/phiên kích hoạt gửi qua Matrix.

Ủy quyền hơi khác nhau giữa các loại phê duyệt:

- **Phê duyệt exec** dùng `execApprovals.approvers`, quay về `dm.allowFrom`.
- **Phê duyệt Plugin** ủy quyền chỉ qua `dm.allowFrom`.

Cả hai loại dùng chung lối tắt phản ứng Matrix và cập nhật tin nhắn. Người phê duyệt thấy các lối tắt phản ứng trên tin nhắn phê duyệt chính:

- `✅` cho phép một lần
- `❌` từ chối
- `♾️` luôn cho phép (khi chính sách exec hiệu dụng cho phép)

Lệnh gạch chéo dự phòng: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Chỉ những người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối. Gửi qua kênh cho phê duyệt exec bao gồm văn bản lệnh - chỉ bật `channel` hoặc `both` trong phòng đáng tin cậy.

Liên quan: [Phê duyệt exec](/vi/tools/exec-approvals).

## Lệnh gạch chéo

Lệnh gạch chéo (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, v.v.) hoạt động trực tiếp trong DM. Trong phòng, OpenClaw cũng nhận diện các lệnh có tiền tố là lượt nhắc Matrix của chính bot, vì vậy `@bot:server /new` kích hoạt đường dẫn lệnh mà không cần regex nhắc đến tùy chỉnh. Điều này giúp bot phản hồi các bài đăng kiểu phòng `@mention /command` mà Element và các client tương tự phát ra khi người dùng dùng tab để hoàn tất tên bot trước khi nhập lệnh.

Quy tắc ủy quyền vẫn áp dụng: người gửi lệnh phải thỏa các chính sách allowlist/chủ sở hữu của DM hoặc phòng giống như tin nhắn thường.

## Nhiều tài khoản

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**Kế thừa:**

- Các giá trị `channels.matrix` cấp cao nhất đóng vai trò mặc định cho tài khoản có tên trừ khi tài khoản ghi đè chúng.
- Đặt phạm vi một mục phòng được kế thừa cho một tài khoản cụ thể bằng `groups.<room>.account`. Các mục không có `account` được dùng chung trên các tài khoản; `account: "default"` vẫn hoạt động khi tài khoản mặc định được cấu hình ở cấp cao nhất.

**Lựa chọn tài khoản mặc định:**

- Đặt `defaultAccount` để chọn tài khoản có tên mà định tuyến ngầm định, thăm dò và các lệnh CLI ưu tiên.
- Nếu bạn có nhiều tài khoản và một tài khoản có tên đúng là `default`, OpenClaw sẽ dùng tài khoản đó một cách ngầm định ngay cả khi chưa đặt `defaultAccount`.
- Nếu bạn có nhiều tài khoản được đặt tên và chưa chọn mặc định, các lệnh CLI sẽ từ chối đoán - hãy đặt `defaultAccount` hoặc truyền `--account <id>`.
- Khối cấp cao nhất `channels.matrix.*` chỉ được xem là tài khoản `default` ngầm định khi xác thực của nó đã hoàn chỉnh (`homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`). Các tài khoản được đặt tên vẫn có thể được phát hiện từ `homeserver` + `userId` khi thông tin xác thực đã lưu trong bộ nhớ đệm đủ để xác thực.

**Thăng cấp:**

- Khi OpenClaw thăng cấp cấu hình một tài khoản thành nhiều tài khoản trong quá trình sửa chữa hoặc thiết lập, nó giữ nguyên tài khoản đã đặt tên hiện có nếu có, hoặc nếu `defaultAccount` đã trỏ tới một tài khoản. Chỉ các khóa xác thực/khởi động Matrix được chuyển vào tài khoản đã thăng cấp; các khóa chính sách phân phối dùng chung vẫn ở cấp cao nhất.

Xem [Tham chiếu cấu hình](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu nhiều tài khoản dùng chung.

## Homeserver riêng tư/LAN

Theo mặc định, OpenClaw chặn các homeserver Matrix riêng tư/nội bộ để bảo vệ khỏi SSRF trừ khi bạn
chọn tham gia rõ ràng cho từng tài khoản.

Nếu homeserver của bạn chạy trên localhost, IP LAN/Tailscale, hoặc tên máy chủ nội bộ, hãy bật
`network.dangerouslyAllowPrivateNetwork` cho tài khoản Matrix đó:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Ví dụ thiết lập CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Tùy chọn tham gia này chỉ cho phép các đích riêng tư/nội bộ đáng tin cậy. Các homeserver văn bản rõ công khai như
`http://matrix.example.org:8008` vẫn bị chặn. Ưu tiên `https://` bất cứ khi nào có thể.

## Proxy lưu lượng Matrix

Nếu triển khai Matrix của bạn cần proxy HTTP(S) đi ra rõ ràng, hãy đặt `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Các tài khoản được đặt tên có thể ghi đè mặc định cấp cao nhất bằng `channels.matrix.accounts.<id>.proxy`.
OpenClaw dùng cùng thiết lập proxy cho lưu lượng Matrix lúc chạy và các thăm dò trạng thái tài khoản.

## Phân giải đích

Matrix chấp nhận các dạng đích này ở bất cứ nơi nào OpenClaw yêu cầu bạn cung cấp đích phòng hoặc người dùng:

- Người dùng: `@user:server`, `user:@user:server`, hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server`, hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server`, hoặc `matrix:channel:#alias:server`

ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy dùng đúng kiểu chữ của ID phòng từ Matrix
khi cấu hình các đích phân phối rõ ràng, tác vụ cron, liên kết hoặc danh sách cho phép.
OpenClaw giữ khóa phiên nội bộ ở dạng chuẩn để lưu trữ, nên các khóa chữ thường đó
không phải là nguồn đáng tin cậy cho ID phân phối Matrix.

Tra cứu thư mục trực tiếp dùng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng truy vấn thư mục người dùng Matrix trên homeserver đó.
- Tra cứu phòng chấp nhận trực tiếp ID phòng và bí danh rõ ràng. Tra cứu tên phòng đã tham gia là nỗ lực tốt nhất và chỉ áp dụng cho danh sách cho phép phòng lúc chạy khi đặt `dangerouslyAllowNameMatching: true`.
- Nếu không thể phân giải tên phòng thành ID hoặc bí danh, tên đó sẽ bị bỏ qua trong quá trình phân giải danh sách cho phép lúc chạy.

## Tham chiếu cấu hình

Các trường người dùng kiểu danh sách cho phép (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) chấp nhận ID người dùng Matrix đầy đủ (an toàn nhất). Các mục người dùng không phải ID bị bỏ qua theo mặc định. Nếu bạn đặt `dangerouslyAllowNameMatching: true`, các kết quả khớp chính xác với tên hiển thị trong thư mục Matrix sẽ được phân giải lúc khởi động và bất cứ khi nào danh sách cho phép thay đổi trong lúc trình giám sát đang chạy; các mục không thể phân giải sẽ bị bỏ qua lúc chạy.

Các khóa danh sách cho phép phòng (`groups`, `rooms` cũ) nên là ID phòng hoặc bí danh. Khóa tên phòng thuần bị bỏ qua theo mặc định; `dangerouslyAllowNameMatching: true` khôi phục tra cứu nỗ lực tốt nhất theo tên phòng đã tham gia.

### Tài khoản và kết nối

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn hiển thị tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi cấu hình nhiều tài khoản Matrix.
- `accounts`: các ghi đè theo tài khoản được đặt tên. Các giá trị cấp cao nhất `channels.matrix` được kế thừa làm mặc định.
- `homeserver`: URL homeserver, ví dụ `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: cho phép tài khoản này kết nối tới `localhost`, IP LAN/Tailscale hoặc tên máy chủ nội bộ.
- `proxy`: URL proxy HTTP(S) tùy chọn cho lưu lượng Matrix. Hỗ trợ ghi đè theo tài khoản.
- `userId`: ID người dùng Matrix đầy đủ (`@bot:example.org`).
- `accessToken`: mã truy cập cho xác thực dựa trên mã. Hỗ trợ giá trị văn bản thuần và SecretRef trên các nhà cung cấp env/file/exec ([Quản lý bí mật](/vi/gateway/secrets)).
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu. Hỗ trợ giá trị văn bản thuần và SecretRef.
- `deviceId`: ID thiết bị Matrix rõ ràng.
- `deviceName`: tên hiển thị của thiết bị được dùng tại thời điểm đăng nhập bằng mật khẩu.
- `avatarUrl`: URL ảnh đại diện tự thân đã lưu để đồng bộ hồ sơ và cập nhật `profile set`.
- `initialSyncLimit`: số lượng sự kiện tối đa được nạp trong quá trình đồng bộ khi khởi động.

### Mã hóa

- `encryption`: bật E2EE. Mặc định: `false`.
- `startupVerification`: `"if-unverified"` (mặc định khi E2EE bật) hoặc `"off"`. Tự động yêu cầu tự xác minh khi khởi động nếu thiết bị này chưa được xác minh.
- `startupVerificationCooldownHours`: thời gian chờ trước yêu cầu khởi động tự động tiếp theo. Mặc định: `24`.

### Truy cập và chính sách

- `groupPolicy`: `"open"`, `"allowlist"`, hoặc `"disabled"`. Mặc định: `"allowlist"`.
- `groupAllowFrom`: danh sách cho phép gồm các ID người dùng cho lưu lượng phòng.
- `dm.enabled`: khi `false`, bỏ qua tất cả DM. Mặc định: `true`.
- `dm.policy`: `"pairing"` (mặc định), `"allowlist"`, `"open"`, hoặc `"disabled"`. Áp dụng sau khi bot đã tham gia và phân loại phòng là DM; không ảnh hưởng đến xử lý lời mời.
- `dm.allowFrom`: danh sách cho phép gồm các ID người dùng cho lưu lượng DM.
- `dm.sessionScope`: `"per-user"` (mặc định) hoặc `"per-room"`.
- `dm.threadReplies`: ghi đè chỉ dành cho DM đối với phân luồng trả lời (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: chấp nhận tin nhắn từ các tài khoản bot Matrix đã cấu hình khác (`true` hoặc `"mentions"`).
- `allowlistOnly`: khi `true`, ép tất cả chính sách DM đang hoạt động (trừ `"disabled"`) và chính sách nhóm `"open"` thành `"allowlist"`. Không thay đổi chính sách `"disabled"`.
- `dangerouslyAllowNameMatching`: khi `true`, cho phép tra cứu thư mục tên hiển thị Matrix cho các mục danh sách cho phép người dùng và tra cứu tên phòng đã tham gia cho khóa danh sách cho phép phòng. Ưu tiên ID `@user:server` đầy đủ và ID phòng hoặc bí danh.
- `autoJoin`: `"always"`, `"allowlist"`, hoặc `"off"`. Mặc định: `"off"`. Áp dụng cho mọi lời mời Matrix, bao gồm lời mời kiểu DM.
- `autoJoinAllowlist`: phòng/bí danh được phép khi `autoJoin` là `"allowlist"`. Các mục bí danh được phân giải theo homeserver, không theo trạng thái mà phòng mời đã khai báo.
- `contextVisibility`: khả năng hiển thị ngữ cảnh bổ sung (`"all"` mặc định, `"allowlist"`, `"allowlist_quote"`).

### Hành vi trả lời

- `replyToMode`: `"off"`, `"first"`, `"all"`, hoặc `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, hoặc `"always"`.
- `threadBindings`: các ghi đè theo kênh cho định tuyến phiên gắn với luồng và vòng đời.
- `streaming`: `"off"` (mặc định), `"partial"`, `"quiet"`, hoặc dạng đối tượng `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: khi `true`, các khối trợ lý đã hoàn tất được giữ dưới dạng tin nhắn tiến trình riêng biệt.
- `markdown`: cấu hình kết xuất Markdown tùy chọn cho văn bản gửi đi.
- `responsePrefix`: chuỗi tùy chọn được thêm vào đầu các phản hồi gửi đi.
- `textChunkLimit`: kích thước đoạn gửi đi tính bằng ký tự khi `chunkMode: "length"`. Mặc định: `4000`.
- `chunkMode`: `"length"` (mặc định, tách theo số ký tự) hoặc `"newline"` (tách tại ranh giới dòng).
- `historyLimit`: số lượng tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng kích hoạt tác tử. Quay về `messages.groupChat.historyLimit`; mặc định hiệu dụng là `0` (tắt).
- `mediaMaxMb`: giới hạn kích thước phương tiện tính bằng MB cho gửi đi và xử lý gửi đến.

### Thiết lập phản ứng

- `ackReaction`: ghi đè phản ứng xác nhận cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi (`"group-mentions"` mặc định, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: chế độ thông báo phản ứng gửi đến (`"own"` mặc định, `"off"`).

### Công cụ và ghi đè theo phòng

- `actions`: kiểm soát công cụ theo hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: bản đồ chính sách theo phòng. Định danh phiên dùng ID phòng ổn định sau khi phân giải. (`rooms` là bí danh cũ.)
  - `groups.<room>.account`: giới hạn một mục phòng được kế thừa vào một tài khoản cụ thể.
  - `groups.<room>.allowBots`: ghi đè theo phòng cho thiết lập cấp kênh (`true` hoặc `"mentions"`).
  - `groups.<room>.users`: danh sách cho phép người gửi theo phòng.
  - `groups.<room>.tools`: ghi đè cho phép/từ chối công cụ theo phòng.
  - `groups.<room>.autoReply`: ghi đè kiểm soát yêu cầu nhắc đến theo phòng. `true` tắt yêu cầu nhắc đến cho phòng đó; `false` ép bật lại yêu cầu này.
  - `groups.<room>.skills`: bộ lọc Skills theo phòng.
  - `groups.<room>.systemPrompt`: đoạn prompt hệ thống theo phòng.

### Thiết lập phê duyệt exec

- `execApprovals.enabled`: gửi phê duyệt exec qua lời nhắc gốc của Matrix.
- `execApprovals.approvers`: ID người dùng Matrix được phép phê duyệt. Quay về `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (mặc định), `"channel"`, hoặc `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: danh sách cho phép tác tử/phiên tùy chọn cho việc phân phối.

## Liên quan

- [Tổng quan kênh](/vi/channels) - tất cả kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) - xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát yêu cầu nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
