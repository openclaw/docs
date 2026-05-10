---
read_when:
    - Thiết lập Matrix trong OpenClaw
    - Cấu hình Matrix E2EE và xác minh
summary: Trạng thái hỗ trợ, thiết lập và ví dụ cấu hình cho Matrix
title: Ma trận
x-i18n:
    generated_at: "2026-05-10T19:22:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix là một Plugin kênh có thể tải xuống cho OpenClaw.
Plugin này dùng `matrix-js-sdk` chính thức và hỗ trợ DM, phòng, luồng, phương tiện, phản ứng, cuộc thăm dò, vị trí và E2EE.

## Cài đặt

Cài đặt Matrix từ ClawHub trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/matrix
```

Đặc tả Plugin trần sẽ thử ClawHub trước, rồi dự phòng sang npm. Để ép nguồn registry, hãy dùng `openclaw plugins install clawhub:@openclaw/matrix` hoặc `openclaw plugins install npm:@openclaw/matrix`.

Từ một bản checkout cục bộ:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` đăng ký và bật Plugin, nên không cần bước `openclaw plugins enable matrix` riêng. Plugin vẫn không làm gì cho đến khi bạn cấu hình kênh bên dưới. Xem [Plugin](/vi/tools/plugin) để biết hành vi Plugin chung và quy tắc cài đặt.

## Thiết lập

1. Tạo một tài khoản Matrix trên máy chủ chính của bạn.
2. Cấu hình `channels.matrix` với `homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`.
3. Khởi động lại Gateway.
4. Bắt đầu một DM với bot, hoặc mời bot vào một phòng (xem [tự động tham gia](#auto-join) - lời mời mới chỉ được xử lý khi `autoJoin` cho phép).

### Thiết lập tương tác

```bash
openclaw channels add
openclaw configure --section channels
```

Trình hướng dẫn sẽ hỏi: URL máy chủ chính, phương thức xác thực (mã truy cập hoặc mật khẩu), ID người dùng (chỉ với xác thực bằng mật khẩu), tên thiết bị tùy chọn, có bật E2EE hay không, và có cấu hình quyền truy cập phòng cùng tự động tham gia hay không.

Nếu các biến môi trường `MATRIX_*` tương ứng đã tồn tại và tài khoản được chọn chưa có thông tin xác thực đã lưu, trình hướng dẫn sẽ cung cấp lối tắt dùng biến môi trường. Để phân giải tên phòng trước khi lưu danh sách cho phép, hãy chạy `openclaw channels resolve --channel matrix "Project Room"`. Khi E2EE được bật, trình hướng dẫn ghi cấu hình và chạy cùng quy trình khởi tạo như [`openclaw matrix encryption setup`](#encryption-and-verification).

### Cấu hình tối thiểu

Dựa trên mã thông báo:

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

Dựa trên mật khẩu (mã thông báo được lưu đệm sau lần đăng nhập đầu tiên):

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

`channels.matrix.autoJoin` mặc định là `off`. Với mặc định này, bot sẽ không xuất hiện trong các phòng hoặc DM mới từ lời mời mới cho đến khi bạn tham gia thủ công.

OpenClaw không thể biết tại thời điểm được mời liệu phòng được mời là DM hay nhóm, nên mọi lời mời - kể cả lời mời kiểu DM - đều đi qua `autoJoin` trước. `dm.policy` chỉ áp dụng sau đó, khi bot đã tham gia và phòng đã được phân loại.

<Warning>
Đặt `autoJoin: "allowlist"` cùng với `autoJoinAllowlist` để giới hạn những lời mời bot chấp nhận, hoặc `autoJoin: "always"` để chấp nhận mọi lời mời.

`autoJoinAllowlist` chỉ chấp nhận đích ổn định: `!roomId:server`, `#alias:server`, hoặc `*`. Tên phòng thuần sẽ bị từ chối; mục bí danh được phân giải dựa trên máy chủ chính, không dựa trên trạng thái do phòng được mời khai báo.
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

Để chấp nhận mọi lời mời, hãy dùng `autoJoin: "always"`.

### Định dạng đích danh sách cho phép

Danh sách cho phép DM và phòng nên được điền bằng ID ổn định:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): dùng `@user:server`. Tên hiển thị chỉ được phân giải khi thư mục của máy chủ chính trả về đúng một kết quả khớp.
- Phòng (`groups`, `autoJoinAllowlist`): dùng `!room:server` hoặc `#alias:server`. Tên được phân giải theo khả năng tốt nhất dựa trên các phòng đã tham gia; các mục chưa phân giải được sẽ bị bỏ qua khi chạy.

### Chuẩn hóa ID tài khoản

Trình hướng dẫn chuyển đổi tên thân thiện thành ID tài khoản đã chuẩn hóa. Ví dụ, `Ops Bot` trở thành `ops-bot`. Dấu câu được thoát trong tên biến môi trường theo phạm vi để hai tài khoản không thể va chạm: `-` → `_X2D_`, nên `ops-prod` ánh xạ tới `MATRIX_OPS_X2D_PROD_*`.

### Thông tin xác thực được lưu đệm

Matrix lưu thông tin xác thực được lưu đệm trong `~/.openclaw/credentials/matrix/`:

- tài khoản mặc định: `credentials.json`
- tài khoản có tên: `credentials-<account>.json`

Khi thông tin xác thực được lưu đệm tồn tại ở đó, OpenClaw xem Matrix là đã được cấu hình ngay cả khi mã truy cập không có trong tệp cấu hình - điều này áp dụng cho thiết lập, `openclaw doctor`, và các phép dò trạng thái kênh.

### Biến môi trường

Được dùng khi khóa cấu hình tương đương chưa được đặt. Tài khoản mặc định dùng tên không có tiền tố; tài khoản có tên dùng ID tài khoản được chèn trước hậu tố.

| Tài khoản mặc định    | Tài khoản có tên (`<ID>` là ID tài khoản đã chuẩn hóa) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Với tài khoản `ops`, tên sẽ trở thành `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, v.v. Các biến môi trường khóa khôi phục được đọc bởi các luồng CLI có nhận biết khôi phục (`verify backup restore`, `verify device`, `verify bootstrap`) khi bạn đưa khóa vào qua `--recovery-key-stdin`.

`MATRIX_HOMESERVER` không thể được đặt từ `.env` của workspace; xem [tệp `.env` của workspace](/vi/gateway/security).

## Ví dụ cấu hình

Một cấu hình nền thực tế với ghép cặp DM, danh sách cho phép phòng và E2EE:

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

## Bản xem trước phát trực tuyến

Phát trực tuyến trả lời Matrix là tùy chọn bật. `streaming` kiểm soát cách OpenClaw gửi câu trả lời đang được tạo của trợ lý; `blockStreaming` kiểm soát liệu mỗi khối đã hoàn tất có được giữ lại dưới dạng tin nhắn Matrix riêng hay không.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Để giữ bản xem trước câu trả lời trực tiếp nhưng ẩn các dòng công cụ/tiến độ tạm thời, hãy dùng dạng đối tượng:

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

| `streaming`       | Hành vi                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (mặc định) | Chờ toàn bộ câu trả lời, gửi một lần. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Sửa một tin nhắn văn bản bình thường tại chỗ khi mô hình viết khối hiện tại. Client Matrix mặc định có thể thông báo ở bản xem trước đầu tiên, không phải lần sửa cuối.              |
| `"quiet"`         | Giống `"partial"` nhưng tin nhắn là thông báo không gây thông báo đẩy. Người nhận chỉ nhận thông báo khi một quy tắc đẩy theo người dùng khớp với lần sửa đã hoàn tất (xem bên dưới). |

`blockStreaming` độc lập với `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (mặc định)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Bản nháp trực tiếp cho khối hiện tại, các khối đã hoàn tất được giữ làm tin nhắn | Bản nháp trực tiếp cho khối hiện tại, hoàn tất tại chỗ |
| `"off"`                 | Một tin nhắn Matrix có thông báo cho mỗi khối hoàn tất                     | Một tin nhắn Matrix có thông báo cho toàn bộ câu trả lời      |

Ghi chú:

- Nếu bản xem trước vượt quá giới hạn kích thước theo sự kiện của Matrix, OpenClaw dừng phát trực tuyến bản xem trước và quay về chỉ gửi bản cuối.
- Trả lời bằng phương tiện luôn gửi tệp đính kèm bình thường. Nếu một bản xem trước cũ không còn có thể được tái sử dụng an toàn, OpenClaw sẽ biên tập lại nó trước khi gửi trả lời phương tiện cuối cùng.
- Cập nhật bản xem trước tiến độ công cụ được bật theo mặc định khi phát trực tuyến bản xem trước Matrix đang hoạt động. Đặt `streaming.preview.toolProgress: false` để giữ các lần sửa bản xem trước cho văn bản câu trả lời nhưng để tiến độ công cụ đi theo đường gửi bình thường.
- Các lần sửa bản xem trước tốn thêm lệnh gọi API Matrix. Giữ `streaming: "off"` nếu bạn muốn cấu hình giới hạn tốc độ thận trọng nhất.

## Siêu dữ liệu phê duyệt

Lời nhắc phê duyệt gốc của Matrix là các sự kiện `m.room.message` bình thường với nội dung sự kiện tùy chỉnh riêng của OpenClaw trong `com.openclaw.approval`. Matrix cho phép khóa nội dung sự kiện tùy chỉnh, nên client mặc định vẫn hiển thị nội dung văn bản trong khi client có nhận biết OpenClaw có thể đọc ID phê duyệt có cấu trúc, loại, trạng thái, các quyết định khả dụng và chi tiết thực thi/Plugin.

Khi lời nhắc phê duyệt quá dài cho một sự kiện Matrix, OpenClaw chia nhỏ văn bản hiển thị và chỉ gắn `com.openclaw.approval` vào khối đầu tiên. Phản ứng cho quyết định cho phép/từ chối được gắn với sự kiện đầu tiên đó, nên lời nhắc dài giữ cùng đích phê duyệt như lời nhắc một sự kiện.

### Quy tắc đẩy tự lưu trữ cho bản xem trước đã hoàn tất ở chế độ im lặng

`streaming: "quiet"` chỉ thông báo cho người nhận khi một khối hoặc lượt đã hoàn tất - một quy tắc đẩy theo người dùng phải khớp với dấu đánh dấu bản xem trước đã hoàn tất. Xem [quy tắc đẩy Matrix cho bản xem trước im lặng](/vi/channels/matrix-push-rules) để biết công thức đầy đủ (mã thông báo người nhận, kiểm tra bộ đẩy, cài đặt quy tắc, ghi chú theo máy chủ chính).

## Phòng bot với bot

Theo mặc định, tin nhắn Matrix từ các tài khoản Matrix OpenClaw đã cấu hình khác sẽ bị bỏ qua.

Dùng `allowBots` khi bạn chủ ý muốn lưu lượng Matrix giữa các tác nhân:

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

- `allowBots: true` chấp nhận tin nhắn từ các tài khoản bot Matrix đã cấu hình khác trong các phòng và DM được phép.
- `allowBots: "mentions"` chỉ chấp nhận các tin nhắn đó khi chúng nhắc đến bot này một cách hiển thị trong phòng. DM vẫn được phép.
- `groups.<room>.allowBots` ghi đè cài đặt cấp tài khoản cho một phòng.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng ID người dùng Matrix để tránh vòng lặp tự trả lời.
- Matrix không cung cấp cờ bot gốc ở đây; OpenClaw xem "do bot tạo" là "được gửi bởi một tài khoản Matrix đã cấu hình khác trên Gateway OpenClaw này".

Dùng danh sách cho phép phòng nghiêm ngặt và yêu cầu nhắc đến khi bật lưu lượng bot với bot trong phòng chung.

## Mã hóa và xác minh

Trong phòng được mã hóa (E2EE), sự kiện ảnh gửi đi dùng `thumbnail_file` để bản xem trước ảnh được mã hóa cùng với tệp đính kèm đầy đủ. Phòng không mã hóa vẫn dùng `thumbnail_url`. Không cần cấu hình - Plugin tự động phát hiện trạng thái E2EE.

Tất cả lệnh `openclaw matrix` chấp nhận `--verbose` (chẩn đoán đầy đủ), `--json` (đầu ra máy đọc được), và `--account <id>` (thiết lập nhiều tài khoản). Đầu ra mặc định ngắn gọn với ghi log SDK nội bộ ở chế độ im lặng. Các ví dụ bên dưới cho thấy dạng chuẩn; thêm các cờ khi cần.

### Bật mã hóa

```bash
openclaw matrix encryption setup
```

Khởi tạo lưu trữ bí mật và ký chéo, tạo bản sao lưu khóa phòng nếu cần, rồi in trạng thái và các bước tiếp theo. Các cờ hữu ích:

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
- `Cross-signing verified`: SDK báo cáo đã xác minh qua ký chéo
- `Signed by owner`: được ký bằng khóa tự ký của chính bạn (chỉ để chẩn đoán)

`Verified by owner` chỉ trở thành `yes` khi `Cross-signing verified` là `yes`. Chỉ tin cậy cục bộ hoặc chỉ có chữ ký chủ sở hữu là chưa đủ.

`--allow-degraded-local-state` trả về chẩn đoán nỗ lực tốt nhất mà không chuẩn bị tài khoản Matrix trước; hữu ích cho các phép dò ngoại tuyến hoặc cấu hình một phần.

### Xác minh thiết bị này bằng khóa khôi phục

Khóa khôi phục là thông tin nhạy cảm - hãy truyền qua stdin thay vì truyền trên dòng lệnh. Đặt `MATRIX_RECOVERY_KEY` (hoặc `MATRIX_<ID>_RECOVERY_KEY` cho tài khoản có tên):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Lệnh báo cáo ba trạng thái:

- `Recovery key accepted`: Matrix đã chấp nhận khóa cho lưu trữ bí mật hoặc tin cậy thiết bị.
- `Backup usable`: bản sao lưu khóa phòng có thể được tải bằng vật liệu khôi phục đáng tin cậy.
- `Device verified by owner`: thiết bị này có độ tin cậy danh tính ký chéo Matrix đầy đủ.

Lệnh thoát với mã khác không khi độ tin cậy danh tính đầy đủ chưa hoàn tất, ngay cả khi khóa khôi phục đã mở khóa vật liệu sao lưu. Trong trường hợp đó, hoàn tất tự xác minh từ một máy khách Matrix khác:

```bash
openclaw matrix verify self
```

`verify self` chờ đến khi `Cross-signing verified: yes` trước khi thoát thành công. Dùng `--timeout-ms <ms>` để điều chỉnh thời gian chờ.

Dạng khóa trực tiếp `openclaw matrix verify device "<recovery-key>"` cũng được chấp nhận, nhưng khóa sẽ nằm trong lịch sử shell của bạn.

### Khởi tạo hoặc sửa chữa ký chéo

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` là lệnh sửa chữa và thiết lập cho các tài khoản được mã hóa. Theo thứ tự, lệnh này:

- khởi tạo lưu trữ bí mật, tái sử dụng khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa công khai còn thiếu
- đánh dấu và ký chéo thiết bị hiện tại
- tạo bản sao lưu khóa phòng phía máy chủ nếu chưa có

Nếu homeserver yêu cầu UIA để tải khóa ký chéo lên, OpenClaw thử không xác thực trước, rồi `m.login.dummy`, rồi `m.login.password` (yêu cầu `channels.matrix.password`).

Các cờ hữu ích:

- `--recovery-key-stdin` (ghép với `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) hoặc `--recovery-key <key>`
- `--force-reset-cross-signing` để loại bỏ danh tính ký chéo hiện tại (chỉ khi có chủ ý)

### Sao lưu khóa phòng

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` hiển thị liệu bản sao lưu phía máy chủ có tồn tại hay không và liệu thiết bị này có thể giải mã nó hay không. `backup restore` nhập các khóa phòng đã sao lưu vào kho crypto cục bộ; nếu khóa khôi phục đã có trên đĩa, bạn có thể bỏ qua `--recovery-key-stdin`.

Để thay thế một bản sao lưu hỏng bằng đường cơ sở mới (chấp nhận mất lịch sử cũ không thể khôi phục; cũng có thể tạo lại lưu trữ bí mật nếu bí mật sao lưu hiện tại không tải được):

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

Gửi yêu cầu xác minh từ tài khoản OpenClaw này. `--own-user` yêu cầu tự xác minh (bạn chấp nhận lời nhắc trong một máy khách Matrix khác của cùng người dùng); `--user-id`/`--device-id`/`--room-id` nhắm tới người khác. Không thể kết hợp `--own-user` với các cờ nhắm mục tiêu khác.

Để xử lý vòng đời cấp thấp hơn - thường là khi theo dõi các yêu cầu đến từ máy khách khác - các lệnh này tác động lên một yêu cầu `<id>` cụ thể (được in bởi `verify list` và `verify request`):

| Lệnh                                       | Mục đích                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Chấp nhận một yêu cầu đến                                           |
| `openclaw matrix verify start <id>`        | Bắt đầu luồng SAS                                                   |
| `openclaw matrix verify sas <id>`          | In emoji hoặc số thập phân SAS                                      |
| `openclaw matrix verify confirm-sas <id>`  | Xác nhận SAS khớp với nội dung máy khách kia hiển thị               |
| `openclaw matrix verify mismatch-sas <id>` | Từ chối SAS khi emoji hoặc số thập phân không khớp                  |
| `openclaw matrix verify cancel <id>`       | Hủy; nhận tùy chọn `--reason <text>` và `--code <matrix-code>`      |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, và `cancel` đều chấp nhận `--user-id` và `--room-id` làm gợi ý theo dõi DM khi xác minh được neo vào một phòng nhắn tin trực tiếp cụ thể.

### Ghi chú nhiều tài khoản

Nếu không có `--account <id>`, các lệnh CLI Matrix dùng tài khoản mặc định ngầm định. Nếu bạn có nhiều tài khoản có tên và chưa đặt `channels.matrix.defaultAccount`, chúng sẽ từ chối đoán và yêu cầu bạn chọn. Khi E2EE bị tắt hoặc không khả dụng cho một tài khoản có tên, lỗi sẽ trỏ tới khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Hành vi khởi động">
    Với `encryption: true`, `startupVerification` mặc định là `"if-unverified"`. Khi khởi động, một thiết bị chưa xác minh sẽ yêu cầu tự xác minh trong một máy khách Matrix khác, bỏ qua bản trùng lặp và áp dụng thời gian chờ (mặc định 24 giờ). Điều chỉnh bằng `startupVerificationCooldownHours` hoặc tắt bằng `startupVerification: "off"`.

    Khi khởi động cũng chạy một lượt khởi tạo crypto thận trọng, tái sử dụng lưu trữ bí mật và danh tính ký chéo hiện tại. Nếu trạng thái khởi tạo bị hỏng, OpenClaw thử sửa chữa có bảo vệ ngay cả khi không có `channels.matrix.password`; nếu homeserver yêu cầu UIA bằng mật khẩu, quá trình khởi động ghi cảnh báo và không gây lỗi nghiêm trọng. Các thiết bị đã được chủ sở hữu ký sẵn được giữ nguyên.

    Xem [Di chuyển Matrix](/vi/channels/matrix-migration) để biết toàn bộ luồng nâng cấp.

  </Accordion>

  <Accordion title="Thông báo xác minh">
    Matrix đăng thông báo vòng đời xác minh vào phòng xác minh DM nghiêm ngặt dưới dạng tin nhắn `m.notice`: yêu cầu, sẵn sàng (với hướng dẫn "Xác minh bằng emoji"), bắt đầu/hoàn tất, và chi tiết SAS (emoji/số thập phân) khi có.

    Các yêu cầu đến từ một máy khách Matrix khác được theo dõi và tự động chấp nhận. Với tự xác minh, OpenClaw tự động bắt đầu luồng SAS và xác nhận phía của nó sau khi xác minh emoji khả dụng - bạn vẫn cần so sánh và xác nhận "Chúng khớp" trong máy khách Matrix của mình.

    Thông báo hệ thống xác minh không được chuyển tiếp tới pipeline trò chuyện agent.

  </Accordion>

  <Accordion title="Thiết bị Matrix đã xóa hoặc không hợp lệ">
    Nếu `verify status` cho biết thiết bị hiện tại không còn được liệt kê trên homeserver, hãy tạo một thiết bị Matrix OpenClaw mới. Với đăng nhập bằng mật khẩu:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Với xác thực bằng token, tạo một access token mới trong máy khách Matrix hoặc giao diện quản trị của bạn, rồi cập nhật OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Thay `assistant` bằng ID tài khoản từ lệnh thất bại, hoặc bỏ qua `--account` cho tài khoản mặc định.

  </Accordion>

  <Accordion title="Vệ sinh thiết bị">
    Các thiết bị do OpenClaw quản lý cũ có thể tích tụ. Liệt kê và dọn bớt:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kho crypto">
    Matrix E2EE dùng đường dẫn crypto Rust chính thức của `matrix-js-sdk` với `fake-indexeddb` làm shim IndexedDB. Trạng thái crypto được lưu bền vào `crypto-idb-snapshot.json` (quyền tệp hạn chế).

    Trạng thái runtime được mã hóa nằm dưới `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` và bao gồm kho đồng bộ, kho crypto, khóa khôi phục, ảnh chụp IDB, liên kết luồng và trạng thái xác minh khởi động. Khi token thay đổi nhưng danh tính tài khoản vẫn giữ nguyên, OpenClaw tái sử dụng root hiện có tốt nhất để trạng thái trước đó vẫn hiển thị.

  </Accordion>
</AccordionGroup>

## Quản lý hồ sơ

Cập nhật hồ sơ tự thân Matrix cho tài khoản đã chọn:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Bạn có thể truyền cả hai tùy chọn trong một lần gọi. Matrix chấp nhận trực tiếp URL ảnh đại diện `mxc://`; khi bạn truyền `http://` hoặc `https://`, OpenClaw tải tệp lên trước và lưu URL `mxc://` đã phân giải vào `channels.matrix.avatarUrl` (hoặc giá trị ghi đè theo từng tài khoản).

## Luồng

Matrix hỗ trợ các luồng Matrix gốc cho cả phản hồi tự động và gửi bằng công cụ tin nhắn. Hai nút điều chỉnh độc lập kiểm soát hành vi:

### Định tuyến phiên (`sessionScope`)

`dm.sessionScope` quyết định cách các phòng DM Matrix ánh xạ tới phiên OpenClaw:

- `"per-user"` (mặc định): tất cả phòng DM với cùng peer được định tuyến dùng chung một phiên.
- `"per-room"`: mỗi phòng DM Matrix có khóa phiên riêng, ngay cả khi peer giống nhau.

Liên kết hội thoại rõ ràng luôn thắng `sessionScope`, nên các phòng và luồng đã liên kết giữ phiên mục tiêu đã chọn.

### Phân luồng phản hồi (`threadReplies`)

`threadReplies` quyết định nơi bot đăng phản hồi:

- `"off"`: phản hồi là cấp cao nhất. Tin nhắn có luồng đến vẫn ở phiên cha.
- `"inbound"`: chỉ phản hồi trong luồng khi tin nhắn đến đã nằm trong luồng đó.
- `"always"`: phản hồi trong một luồng có gốc là tin nhắn kích hoạt; hội thoại đó được định tuyến qua một phiên theo phạm vi luồng khớp kể từ lần kích hoạt đầu tiên trở đi.

`dm.threadReplies` ghi đè điều này chỉ cho DM - ví dụ, giữ các luồng phòng tách biệt trong khi giữ DM phẳng.

### Kế thừa luồng và lệnh gạch chéo

- Tin nhắn theo luồng đi vào bao gồm tin nhắn gốc của luồng làm ngữ cảnh tác nhân bổ sung.
- Các lượt gửi bằng công cụ tin nhắn tự động kế thừa luồng Matrix hiện tại khi nhắm tới cùng phòng (hoặc cùng mục tiêu người dùng DM), trừ khi cung cấp `threadId` rõ ràng.
- Việc tái sử dụng mục tiêu người dùng DM chỉ kích hoạt khi siêu dữ liệu phiên hiện tại chứng minh cùng đối tác DM trên cùng tài khoản Matrix; nếu không, OpenClaw quay lại định tuyến theo phạm vi người dùng thông thường.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và `/acp spawn` bị ràng buộc theo luồng đều hoạt động trong phòng Matrix và DM.
- `/focus` ở cấp cao nhất tạo một luồng Matrix mới và ràng buộc luồng đó với phiên mục tiêu khi `threadBindings.spawnSessions` được bật.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có sẽ ràng buộc luồng đó tại chỗ.

Khi OpenClaw phát hiện một phòng DM Matrix xung đột với một phòng DM khác trên cùng phiên dùng chung, nó đăng một `m.notice` một lần trong phòng đó, trỏ tới lối thoát `/focus` và gợi ý thay đổi `dm.sessionScope`. Thông báo chỉ xuất hiện khi ràng buộc luồng được bật.

## Ràng buộc hội thoại ACP

Phòng Matrix, DM, và các luồng Matrix hiện có có thể được biến thành không gian làm việc ACP bền vững mà không thay đổi bề mặt trò chuyện.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong DM Matrix, phòng, hoặc luồng hiện có mà bạn muốn tiếp tục sử dụng.
- Trong DM hoặc phòng Matrix cấp cao nhất, DM/phòng hiện tại vẫn là bề mặt trò chuyện và các tin nhắn sau này định tuyến tới phiên ACP đã sinh.
- Bên trong một luồng Matrix hiện có, `--bind here` ràng buộc luồng hiện tại đó tại chỗ.
- `/new` và `/reset` đặt lại cùng phiên ACP đã ràng buộc tại chỗ.
- `/acp close` đóng phiên ACP và xóa ràng buộc.

Ghi chú:

- `--bind here` không tạo luồng Matrix con.
- `threadBindings.spawnSessions` kiểm soát `/acp spawn --thread auto|here`, nơi OpenClaw cần tạo hoặc ràng buộc một luồng Matrix con.

### Cấu hình ràng buộc luồng

Matrix kế thừa mặc định toàn cục từ `session.threadBindings`, và cũng hỗ trợ ghi đè theo từng kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Các lượt sinh phiên bị ràng buộc theo luồng Matrix được bật mặc định:

- Đặt `threadBindings.spawnSessions: false` để chặn `/focus` cấp cao nhất và `/acp spawn --thread auto|here` tạo/ràng buộc luồng Matrix.
- Đặt `threadBindings.defaultSpawnContext: "isolated"` khi các lượt sinh luồng tác nhân con gốc không nên phân nhánh bản ghi hội thoại của cha.

## Phản ứng

Matrix hỗ trợ phản ứng đi ra, thông báo phản ứng đi vào, và phản ứng xác nhận.

Công cụ phản ứng đi ra được kiểm soát bởi `channels.matrix.actions.reactions`:

- `react` thêm một phản ứng vào sự kiện Matrix.
- `reactions` liệt kê tóm tắt phản ứng hiện tại cho sự kiện Matrix.
- `emoji=""` xóa các phản ứng của chính bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji đã chỉ định khỏi bot.

**Thứ tự phân giải** (giá trị được định nghĩa đầu tiên sẽ thắng):

| Thiết lập               | Thứ tự                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | theo tài khoản → kênh → `messages.ackReaction` → dự phòng bằng emoji định danh tác nhân |
| `ackReactionScope`      | theo tài khoản → kênh → `messages.ackReactionScope` → mặc định `"group-mentions"` |
| `reactionNotifications` | theo tài khoản → kênh → mặc định `"own"`                                         |

`reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` đã thêm khi chúng nhắm tới tin nhắn Matrix do bot viết; `"off"` tắt sự kiện hệ thống phản ứng. Việc xóa phản ứng không được tổng hợp thành sự kiện hệ thống vì Matrix biểu diễn chúng dưới dạng biên tập xóa, không phải các lượt xóa `m.reaction` độc lập.

## Ngữ cảnh lịch sử

- `channels.matrix.historyLimit` kiểm soát số lượng tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng Matrix kích hoạt tác nhân. Dự phòng về `messages.groupChat.historyLimit`; nếu cả hai đều chưa đặt, mặc định hiệu dụng là `0`. Đặt `0` để tắt.
- Lịch sử phòng Matrix chỉ thuộc phạm vi phòng. DM tiếp tục dùng lịch sử phiên thông thường.
- Lịch sử phòng Matrix chỉ gồm các tin nhắn đang chờ: OpenClaw đệm các tin nhắn phòng chưa kích hoạt trả lời, rồi chụp nhanh cửa sổ đó khi một lượt nhắc tên hoặc tác nhân kích hoạt khác đến.
- Tin nhắn kích hoạt hiện tại không được đưa vào `InboundHistory`; nó vẫn nằm trong phần thân đi vào chính cho lượt đó.
- Các lần thử lại của cùng sự kiện Matrix tái sử dụng ảnh chụp nhanh lịch sử ban đầu thay vì trôi tới các tin nhắn phòng mới hơn.

## Khả năng hiển thị ngữ cảnh

Matrix hỗ trợ điều khiển `contextVisibility` dùng chung cho ngữ cảnh phòng bổ sung như văn bản trả lời đã lấy, gốc luồng, và lịch sử đang chờ.

- `contextVisibility: "all"` là mặc định. Ngữ cảnh bổ sung được giữ nguyên như đã nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo những người gửi được phép bởi các kiểm tra danh sách cho phép của phòng/người dùng đang hoạt động.
- `contextVisibility: "allowlist_quote"` hoạt động như `allowlist`, nhưng vẫn giữ một trả lời được trích dẫn rõ ràng.

Thiết lập này ảnh hưởng tới khả năng hiển thị ngữ cảnh bổ sung, không phải việc chính tin nhắn đi vào có thể kích hoạt trả lời hay không.
Ủy quyền kích hoạt vẫn đến từ `groupPolicy`, `groups`, `groupAllowFrom`, và các thiết lập chính sách DM.

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

Xem [Nhóm](/vi/channels/groups) để biết hành vi kiểm soát bằng nhắc tên và danh sách cho phép.

Ví dụ ghép nối cho DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được phê duyệt tiếp tục nhắn tin cho bạn trước khi được phê duyệt, OpenClaw tái sử dụng cùng mã ghép nối đang chờ và có thể gửi một trả lời nhắc nhở sau một khoảng hồi ngắn thay vì tạo mã mới.

Xem [Ghép nối](/vi/channels/pairing) để biết luồng ghép nối DM dùng chung và bố cục lưu trữ.

## Sửa chữa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp bị lệch đồng bộ, OpenClaw có thể còn các ánh xạ `m.direct` cũ trỏ tới các phòng đơn cũ thay vì DM đang hoạt động. Kiểm tra ánh xạ hiện tại cho một đối tác:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa chữa ánh xạ đó:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Cả hai lệnh đều chấp nhận `--account <id>` cho thiết lập nhiều tài khoản. Luồng sửa chữa:

- ưu tiên một DM 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- dự phòng về bất kỳ DM 1:1 nghiêm ngặt nào hiện đã tham gia với người dùng đó
- tạo một phòng trực tiếp mới và ghi lại `m.direct` nếu không tồn tại DM lành mạnh

Nó không tự động xóa các phòng cũ. Nó chọn DM lành mạnh và cập nhật ánh xạ để các lượt gửi Matrix, thông báo xác minh, và các luồng tin nhắn trực tiếp khác trong tương lai nhắm tới đúng phòng.

## Phê duyệt exec

Matrix có thể hoạt động như một ứng dụng phê duyệt gốc. Cấu hình dưới `channels.matrix.execApprovals` (hoặc `channels.matrix.accounts.<account>.execApprovals` để ghi đè theo tài khoản):

- `enabled`: gửi phê duyệt qua lời nhắc gốc Matrix. Khi chưa đặt hoặc là `"auto"`, Matrix tự động bật khi có thể phân giải ít nhất một người phê duyệt. Đặt `false` để tắt rõ ràng.
- `approvers`: ID người dùng Matrix (`@owner:example.org`) được phép phê duyệt yêu cầu exec. Tùy chọn - dự phòng về `channels.matrix.dm.allowFrom`.
- `target`: nơi gửi lời nhắc. `"dm"` (mặc định) gửi tới DM của người phê duyệt; `"channel"` gửi tới phòng Matrix hoặc DM khởi nguồn; `"both"` gửi tới cả hai.
- `agentFilter` / `sessionFilter`: danh sách cho phép tùy chọn cho những tác nhân/phiên kích hoạt gửi qua Matrix.

Ủy quyền hơi khác nhau giữa các loại phê duyệt:

- **Phê duyệt exec** dùng `execApprovals.approvers`, dự phòng về `dm.allowFrom`.
- **Phê duyệt Plugin** ủy quyền chỉ qua `dm.allowFrom`.

Cả hai loại dùng chung lối tắt phản ứng Matrix và cập nhật tin nhắn. Người phê duyệt thấy các lối tắt phản ứng trên tin nhắn phê duyệt chính:

- `✅` cho phép một lần
- `❌` từ chối
- `♾️` luôn cho phép (khi chính sách exec hiệu dụng cho phép)

Lệnh gạch chéo dự phòng: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Chỉ những người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối. Việc gửi qua kênh cho phê duyệt exec bao gồm văn bản lệnh - chỉ bật `channel` hoặc `both` trong các phòng đáng tin cậy.

Liên quan: [Phê duyệt exec](/vi/tools/exec-approvals).

## Lệnh gạch chéo

Lệnh gạch chéo (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, v.v.) hoạt động trực tiếp trong DM. Trong phòng, OpenClaw cũng nhận diện các lệnh có tiền tố là lượt nhắc Matrix của chính bot, vì vậy `@bot:server /new` kích hoạt đường dẫn lệnh mà không cần regex nhắc tên tùy chỉnh. Điều này giữ cho bot phản hồi được với các bài đăng kiểu phòng `@mention /command` mà Element và các ứng dụng tương tự phát ra khi người dùng dùng hoàn tất bằng tab tên bot trước khi gõ lệnh.

Quy tắc ủy quyền vẫn áp dụng: người gửi lệnh phải thỏa mãn cùng chính sách danh sách cho phép/chủ sở hữu của DM hoặc phòng như tin nhắn thường.

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

- Các giá trị `channels.matrix` cấp cao nhất đóng vai trò mặc định cho các tài khoản được đặt tên trừ khi một tài khoản ghi đè chúng.
- Giới hạn phạm vi một mục phòng được kế thừa cho tài khoản cụ thể bằng `groups.<room>.account`. Các mục không có `account` được dùng chung trên các tài khoản; `account: "default"` vẫn hoạt động khi tài khoản mặc định được cấu hình ở cấp cao nhất.

**Chọn tài khoản mặc định:**

- Đặt `defaultAccount` để chọn tài khoản được đặt tên mà định tuyến ngầm định, thăm dò, và lệnh CLI ưu tiên.
- Nếu bạn có nhiều tài khoản và một tài khoản có tên đúng là `default`, OpenClaw dùng nó một cách ngầm định ngay cả khi `defaultAccount` chưa đặt.
- Nếu bạn có nhiều tài khoản được đặt tên và chưa chọn mặc định, lệnh CLI từ chối đoán - hãy đặt `defaultAccount` hoặc truyền `--account <id>`.
- Khối `channels.matrix.*` cấp cao nhất chỉ được xem là tài khoản `default` ngầm định khi xác thực của nó hoàn chỉnh (`homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`). Các tài khoản được đặt tên vẫn có thể được phát hiện từ `homeserver` + `userId` khi thông tin đăng nhập đã lưu đệm bao phủ xác thực.

**Thăng cấp:**

- Khi OpenClaw thăng cấp cấu hình một tài khoản thành nhiều tài khoản trong quá trình sửa chữa hoặc thiết lập, nó giữ nguyên tài khoản được đặt tên hiện có nếu có hoặc nếu `defaultAccount` đã trỏ tới một tài khoản. Chỉ các khóa xác thực/khởi động Matrix được chuyển vào tài khoản đã thăng cấp; các khóa chính sách gửi dùng chung vẫn ở cấp cao nhất.

Xem [Tham chiếu cấu hình](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu nhiều tài khoản dùng chung.

## Homeserver riêng tư/LAN

Theo mặc định, OpenClaw chặn homeserver Matrix riêng tư/nội bộ để bảo vệ chống SSRF trừ khi bạn
chọn tham gia rõ ràng theo từng tài khoản.

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

Tùy chọn chủ động này chỉ cho phép các đích riêng tư/nội bộ đáng tin cậy. Các máy chủ homeserver công khai dùng văn bản rõ như
`http://matrix.example.org:8008` vẫn bị chặn. Ưu tiên `https://` bất cứ khi nào có thể.

## Proxy lưu lượng Matrix

Nếu triển khai Matrix của bạn cần một proxy HTTP(S) đi rõ ràng, hãy đặt `channels.matrix.proxy`:

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
OpenClaw dùng cùng một thiết lập proxy cho lưu lượng Matrix lúc chạy và các phép thăm dò trạng thái tài khoản.

## Phân giải đích

Matrix chấp nhận các dạng đích này ở bất cứ nơi nào OpenClaw yêu cầu đích phòng hoặc người dùng:

- Người dùng: `@user:server`, `user:@user:server`, hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server`, hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server`, hoặc `matrix:channel:#alias:server`

ID phòng Matrix phân biệt chữ hoa chữ thường. Dùng đúng kiểu chữ của ID phòng từ Matrix
khi cấu hình đích phân phối rõ ràng, tác vụ cron, liên kết, hoặc danh sách cho phép.
OpenClaw giữ các khóa phiên nội bộ ở dạng chuẩn hóa để lưu trữ, nên các khóa chữ thường đó
không phải là nguồn đáng tin cậy cho ID phân phối Matrix.

Tra cứu thư mục trực tiếp dùng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng truy vấn thư mục người dùng Matrix trên máy chủ homeserver đó.
- Tra cứu phòng chấp nhận trực tiếp ID phòng và bí danh rõ ràng, sau đó quay về tìm kiếm tên phòng đã tham gia cho tài khoản đó.
- Tra cứu tên phòng đã tham gia là nỗ lực tốt nhất. Nếu không thể phân giải tên phòng thành ID hoặc bí danh, tên đó sẽ bị bỏ qua khi phân giải danh sách cho phép lúc chạy.

## Tham chiếu cấu hình

Các trường kiểu danh sách cho phép (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) chấp nhận ID người dùng Matrix đầy đủ (an toàn nhất). Các kết quả khớp thư mục chính xác được phân giải khi khởi động và bất cứ khi nào danh sách cho phép thay đổi trong lúc trình giám sát đang chạy; các mục không thể phân giải sẽ bị bỏ qua lúc chạy. Danh sách cho phép phòng ưu tiên ID phòng hoặc bí danh vì cùng lý do.

### Tài khoản và kết nối

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn hiển thị tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi nhiều tài khoản Matrix được cấu hình.
- `accounts`: các ghi đè theo từng tài khoản được đặt tên. Các giá trị `channels.matrix` cấp cao nhất được kế thừa làm mặc định.
- `homeserver`: URL máy chủ homeserver, ví dụ `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: cho phép tài khoản này kết nối tới `localhost`, IP LAN/Tailscale, hoặc tên máy chủ nội bộ.
- `proxy`: URL proxy HTTP(S) tùy chọn cho lưu lượng Matrix. Hỗ trợ ghi đè theo từng tài khoản.
- `userId`: ID người dùng Matrix đầy đủ (`@bot:example.org`).
- `accessToken`: mã truy cập cho xác thực dựa trên mã. Hỗ trợ giá trị văn bản rõ và SecretRef trên các nhà cung cấp env/file/exec ([Quản lý bí mật](/vi/gateway/secrets)).
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu. Hỗ trợ giá trị văn bản rõ và SecretRef.
- `deviceId`: ID thiết bị Matrix rõ ràng.
- `deviceName`: tên hiển thị thiết bị dùng tại thời điểm đăng nhập bằng mật khẩu.
- `avatarUrl`: URL ảnh đại diện tự thân đã lưu cho đồng bộ hồ sơ và cập nhật `profile set`.
- `initialSyncLimit`: số lượng sự kiện tối đa được lấy trong quá trình đồng bộ khi khởi động.

### Mã hóa

- `encryption`: bật E2EE. Mặc định: `false`.
- `startupVerification`: `"if-unverified"` (mặc định khi E2EE bật) hoặc `"off"`. Tự động yêu cầu tự xác minh khi khởi động nếu thiết bị này chưa được xác minh.
- `startupVerificationCooldownHours`: thời gian chờ trước yêu cầu khởi động tự động tiếp theo. Mặc định: `24`.

### Truy cập và chính sách

- `groupPolicy`: `"open"`, `"allowlist"`, hoặc `"disabled"`. Mặc định: `"allowlist"`.
- `groupAllowFrom`: danh sách cho phép ID người dùng cho lưu lượng phòng.
- `dm.enabled`: khi `false`, bỏ qua tất cả DM. Mặc định: `true`.
- `dm.policy`: `"pairing"` (mặc định), `"allowlist"`, `"open"`, hoặc `"disabled"`. Áp dụng sau khi bot đã tham gia và phân loại phòng là DM; không ảnh hưởng đến xử lý lời mời.
- `dm.allowFrom`: danh sách cho phép ID người dùng cho lưu lượng DM.
- `dm.sessionScope`: `"per-user"` (mặc định) hoặc `"per-room"`.
- `dm.threadReplies`: ghi đè chỉ dành cho DM đối với luồng trả lời (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: chấp nhận tin nhắn từ các tài khoản bot Matrix khác đã cấu hình (`true` hoặc `"mentions"`).
- `allowlistOnly`: khi `true`, buộc tất cả chính sách DM đang hoạt động (trừ `"disabled"`) và chính sách nhóm `"open"` thành `"allowlist"`. Không thay đổi chính sách `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"`, hoặc `"off"`. Mặc định: `"off"`. Áp dụng cho mọi lời mời Matrix, bao gồm lời mời kiểu DM.
- `autoJoinAllowlist`: các phòng/bí danh được phép khi `autoJoin` là `"allowlist"`. Các mục bí danh được phân giải theo máy chủ homeserver, không theo trạng thái do phòng được mời khai báo.
- `contextVisibility`: khả năng hiển thị ngữ cảnh bổ sung (mặc định `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Hành vi trả lời

- `replyToMode`: `"off"`, `"first"`, `"all"`, hoặc `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, hoặc `"always"`.
- `threadBindings`: ghi đè theo kênh cho định tuyến và vòng đời phiên gắn với luồng.
- `streaming`: `"off"` (mặc định), `"partial"`, `"quiet"`, hoặc dạng đối tượng `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: khi `true`, các khối trợ lý đã hoàn tất được giữ làm các tin nhắn tiến trình riêng biệt.
- `markdown`: cấu hình hiển thị Markdown tùy chọn cho văn bản đi.
- `responsePrefix`: chuỗi tùy chọn được thêm vào đầu các trả lời đi.
- `textChunkLimit`: kích thước đoạn gửi đi tính bằng ký tự khi `chunkMode: "length"`. Mặc định: `4000`.
- `chunkMode`: `"length"` (mặc định, tách theo số ký tự) hoặc `"newline"` (tách tại ranh giới dòng).
- `historyLimit`: số lượng tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi tin nhắn phòng kích hoạt agent. Quay về `messages.groupChat.historyLimit`; mặc định hiệu lực là `0` (tắt).
- `mediaMaxMb`: giới hạn kích thước media tính bằng MB cho gửi đi và xử lý đi vào.

### Thiết lập phản ứng

- `ackReaction`: ghi đè phản ứng xác nhận cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi (`"group-mentions"` mặc định, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: chế độ thông báo phản ứng đi vào (`"own"` mặc định, `"off"`).

### Công cụ và ghi đè theo phòng

- `actions`: kiểm soát công cụ theo từng hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: bản đồ chính sách theo phòng. Danh tính phiên dùng ID phòng ổn định sau khi phân giải. (`rooms` là bí danh cũ.)
  - `groups.<room>.account`: giới hạn một mục phòng kế thừa cho một tài khoản cụ thể.
  - `groups.<room>.allowBots`: ghi đè theo phòng của thiết lập cấp kênh (`true` hoặc `"mentions"`).
  - `groups.<room>.users`: danh sách cho phép người gửi theo phòng.
  - `groups.<room>.tools`: ghi đè cho phép/từ chối công cụ theo phòng.
  - `groups.<room>.autoReply`: ghi đè kiểm soát yêu cầu nhắc đến theo phòng. `true` tắt yêu cầu nhắc đến cho phòng đó; `false` buộc bật lại.
  - `groups.<room>.skills`: bộ lọc skill theo phòng.
  - `groups.<room>.systemPrompt`: đoạn lời nhắc hệ thống theo phòng.

### Thiết lập phê duyệt exec

- `execApprovals.enabled`: phân phối phê duyệt exec qua lời nhắc gốc Matrix.
- `execApprovals.approvers`: ID người dùng Matrix được phép phê duyệt. Quay về `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (mặc định), `"channel"`, hoặc `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: danh sách cho phép agent/phiên tùy chọn để phân phối.

## Liên quan

- [Tổng quan kênh](/vi/channels) - tất cả kênh được hỗ trợ
- [Ghép cặp](/vi/channels/pairing) - xác thực DM và luồng ghép cặp
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát yêu cầu nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo vệ
