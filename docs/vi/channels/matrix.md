---
read_when:
    - Thiết lập Matrix trong OpenClaw
    - Cấu hình E2EE và xác minh cho Matrix
summary: Trạng thái hỗ trợ Matrix, thiết lập và ví dụ cấu hình
title: Ma trận
x-i18n:
    generated_at: "2026-05-06T09:03:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

Matrix là một Plugin kênh có thể tải xuống cho OpenClaw.
Nó dùng `matrix-js-sdk` chính thức và hỗ trợ DM, phòng, luồng, media, phản ứng, bình chọn, vị trí và E2EE.

## Cài đặt

Cài đặt Matrix trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/matrix
```

Từ một checkout cục bộ:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` đăng ký và bật Plugin, vì vậy không cần bước `openclaw plugins enable matrix` riêng. Plugin vẫn không làm gì cho đến khi bạn cấu hình kênh bên dưới. Xem [Plugins](/vi/tools/plugin) để biết hành vi Plugin chung và quy tắc cài đặt.

## Thiết lập

1. Tạo một tài khoản Matrix trên homeserver của bạn.
2. Cấu hình `channels.matrix` bằng `homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`.
3. Khởi động lại Gateway.
4. Bắt đầu một DM với bot, hoặc mời bot vào một phòng (xem [tự động tham gia](#auto-join) - lời mời mới chỉ được nhận khi `autoJoin` cho phép).

### Thiết lập tương tác

```bash
openclaw channels add
openclaw configure --section channels
```

Trình hướng dẫn hỏi: URL homeserver, phương thức xác thực (access token hoặc mật khẩu), ID người dùng (chỉ xác thực bằng mật khẩu), tên thiết bị tùy chọn, có bật E2EE hay không, và có cấu hình quyền truy cập phòng cùng tự động tham gia hay không.

Nếu các biến môi trường `MATRIX_*` khớp đã tồn tại và tài khoản đã chọn chưa có xác thực đã lưu, trình hướng dẫn sẽ cung cấp lối tắt bằng biến môi trường. Để phân giải tên phòng trước khi lưu allowlist, chạy `openclaw channels resolve --channel matrix "Project Room"`. Khi bật E2EE, trình hướng dẫn ghi cấu hình và chạy cùng quy trình bootstrap như [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` mặc định là `off`. Với mặc định này, bot sẽ không xuất hiện trong các phòng hoặc DM mới từ lời mời mới cho đến khi bạn tham gia thủ công.

OpenClaw không thể biết tại thời điểm mời liệu phòng được mời là DM hay nhóm, vì vậy mọi lời mời - bao gồm cả lời mời kiểu DM - đều đi qua `autoJoin` trước. `dm.policy` chỉ áp dụng sau đó, khi bot đã tham gia và phòng đã được phân loại.

<Warning>
Đặt `autoJoin: "allowlist"` cộng với `autoJoinAllowlist` để giới hạn lời mời mà bot chấp nhận, hoặc `autoJoin: "always"` để chấp nhận mọi lời mời.

`autoJoinAllowlist` chỉ chấp nhận đích ổn định: `!roomId:server`, `#alias:server`, hoặc `*`. Tên phòng thuần bị từ chối; các mục bí danh được phân giải theo homeserver, không theo trạng thái mà phòng được mời khai báo.
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

Allowlist cho DM và phòng nên được điền bằng ID ổn định:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): dùng `@user:server`. Tên hiển thị chỉ phân giải khi thư mục homeserver trả về đúng một kết quả khớp.
- Phòng (`groups`, `autoJoinAllowlist`): dùng `!room:server` hoặc `#alias:server`. Tên được phân giải theo nỗ lực tốt nhất dựa trên các phòng đã tham gia; các mục không phân giải được sẽ bị bỏ qua khi chạy.

### Chuẩn hóa ID tài khoản

Trình hướng dẫn chuyển đổi một tên thân thiện thành ID tài khoản đã chuẩn hóa. Ví dụ, `Ops Bot` trở thành `ops-bot`. Dấu câu được thoát trong tên biến môi trường có phạm vi để hai tài khoản không thể trùng nhau: `-` → `_X2D_`, nên `ops-prod` ánh xạ tới `MATRIX_OPS_X2D_PROD_*`.

### Thông tin xác thực đã lưu vào bộ nhớ đệm

Matrix lưu thông tin xác thực đã lưu vào bộ nhớ đệm dưới `~/.openclaw/credentials/matrix/`:

- tài khoản mặc định: `credentials.json`
- tài khoản có tên: `credentials-<account>.json`

Khi thông tin xác thực đã lưu vào bộ nhớ đệm tồn tại ở đó, OpenClaw coi Matrix là đã được cấu hình ngay cả khi access token không có trong tệp cấu hình - điều đó bao phủ thiết lập, `openclaw doctor`, và các probe trạng thái kênh.

### Biến môi trường

Được dùng khi khóa cấu hình tương đương chưa được đặt. Tài khoản mặc định dùng tên không có tiền tố; tài khoản có tên dùng ID tài khoản được chèn trước hậu tố.

| Tài khoản mặc định   | Tài khoản có tên (`<ID>` là ID tài khoản đã chuẩn hóa) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Với tài khoản `ops`, các tên trở thành `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, v.v. Các biến môi trường recovery-key được các luồng CLI có nhận biết khôi phục đọc (`verify backup restore`, `verify device`, `verify bootstrap`) khi bạn truyền key qua `--recovery-key-stdin`.

Không thể đặt `MATRIX_HOMESERVER` từ `.env` của workspace; xem [Tệp `.env` của workspace](/vi/gateway/security).

## Ví dụ cấu hình

Một baseline thực tế với ghép đôi DM, allowlist phòng và E2EE:

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

Streaming phản hồi Matrix là tùy chọn bật. `streaming` kiểm soát cách OpenClaw gửi phản hồi assistant đang diễn ra; `blockStreaming` kiểm soát liệu mỗi khối hoàn tất có được giữ làm một tin nhắn Matrix riêng hay không.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Để giữ bản xem trước câu trả lời trực tiếp nhưng ẩn các dòng công cụ/tiến trình tạm thời, dùng dạng đối tượng:

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
| `"off"` (mặc định) | Chờ phản hồi đầy đủ, gửi một lần. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Chỉnh sửa tại chỗ một tin nhắn văn bản bình thường khi mô hình viết khối hiện tại. Các client Matrix mặc định có thể thông báo ở bản xem trước đầu tiên, không phải lần chỉnh sửa cuối.              |
| `"quiet"`         | Giống `"partial"` nhưng tin nhắn là một thông báo không gây notification. Người nhận chỉ nhận notification khi một quy tắc push theo từng người dùng khớp với lần chỉnh sửa đã hoàn tất (xem bên dưới). |

`blockStreaming` độc lập với `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (mặc định)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Bản nháp trực tiếp cho khối hiện tại, các khối hoàn tất được giữ làm tin nhắn | Bản nháp trực tiếp cho khối hiện tại, hoàn tất tại chỗ |
| `"off"`                 | Một tin nhắn Matrix có notification cho mỗi khối đã hoàn thành                     | Một tin nhắn Matrix có notification cho toàn bộ phản hồi      |

Ghi chú:

- Nếu bản xem trước tăng vượt quá giới hạn kích thước theo từng sự kiện của Matrix, OpenClaw dừng preview streaming và fallback về gửi chỉ bản cuối cùng.
- Phản hồi media luôn gửi attachment theo cách bình thường. Nếu một bản xem trước cũ không còn có thể được tái sử dụng an toàn, OpenClaw sẽ redacts nó trước khi gửi phản hồi media cuối cùng.
- Cập nhật bản xem trước tiến trình công cụ được bật theo mặc định khi Matrix preview streaming đang hoạt động. Đặt `streaming.preview.toolProgress: false` để giữ các chỉnh sửa bản xem trước cho văn bản câu trả lời nhưng để tiến trình công cụ đi theo đường gửi bình thường.
- Chỉnh sửa bản xem trước tốn thêm lệnh gọi API Matrix. Giữ `streaming: "off"` nếu bạn muốn hồ sơ rate-limit thận trọng nhất.

## Metadata phê duyệt

Lời nhắc phê duyệt native của Matrix là các sự kiện `m.room.message` bình thường với nội dung sự kiện tùy chỉnh dành riêng cho OpenClaw dưới `com.openclaw.approval`. Matrix cho phép khóa nội dung sự kiện tùy chỉnh, vì vậy client mặc định vẫn render phần thân văn bản trong khi client nhận biết OpenClaw có thể đọc ID phê duyệt có cấu trúc, loại, trạng thái, các quyết định khả dụng, và chi tiết exec/Plugin.

Khi lời nhắc phê duyệt quá dài cho một sự kiện Matrix, OpenClaw chia văn bản hiển thị thành các phần và chỉ gắn `com.openclaw.approval` vào phần đầu tiên. Phản ứng cho quyết định cho phép/từ chối được gắn với sự kiện đầu tiên đó, vì vậy lời nhắc dài giữ cùng đích phê duyệt như lời nhắc một sự kiện.

### Quy tắc push tự host cho bản xem trước yên lặng đã hoàn tất

`streaming: "quiet"` chỉ thông báo cho người nhận khi một khối hoặc lượt đã hoàn tất - một quy tắc push theo từng người dùng phải khớp với dấu hiệu bản xem trước đã hoàn tất. Xem [Quy tắc push Matrix cho bản xem trước yên lặng](/vi/channels/matrix-push-rules) để biết công thức đầy đủ (token người nhận, kiểm tra pusher, cài đặt quy tắc, ghi chú theo từng homeserver).

## Phòng bot-với-bot

Theo mặc định, tin nhắn Matrix từ các tài khoản Matrix OpenClaw khác đã cấu hình sẽ bị bỏ qua.

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
- `allowBots: "mentions"` chỉ chấp nhận các tin nhắn đó khi chúng đề cập rõ ràng đến bot này trong phòng. DM vẫn được cho phép.
- `groups.<room>.allowBots` ghi đè thiết lập cấp tài khoản cho một phòng.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng ID người dùng Matrix để tránh vòng lặp tự phản hồi.
- Matrix không cung cấp cờ bot native ở đây; OpenClaw coi "do bot soạn" là "được gửi bởi một tài khoản Matrix đã cấu hình khác trên OpenClaw gateway này".

Dùng allowlist phòng nghiêm ngặt và yêu cầu đề cập khi bật lưu lượng bot-với-bot trong phòng dùng chung.

## Mã hóa và xác minh

Trong các phòng được mã hóa (E2EE), sự kiện ảnh gửi đi dùng `thumbnail_file` để bản xem trước ảnh được mã hóa cùng attachment đầy đủ. Phòng không mã hóa vẫn dùng `thumbnail_url` thuần. Không cần cấu hình - Plugin tự động phát hiện trạng thái E2EE.

Tất cả lệnh `openclaw matrix` chấp nhận `--verbose` (chẩn đoán đầy đủ), `--json` (đầu ra đọc được bằng máy), và `--account <id>` (thiết lập nhiều tài khoản). Đầu ra mặc định ngắn gọn với logging SDK nội bộ yên lặng. Các ví dụ bên dưới thể hiện dạng chuẩn; thêm các cờ khi cần.

### Bật mã hóa

```bash
openclaw matrix encryption setup
```

Khởi tạo lưu trữ bí mật và ký chéo, tạo bản sao lưu khóa phòng nếu cần, rồi in trạng thái và các bước tiếp theo. Các cờ hữu ích:

- `--recovery-key <key>` áp dụng khóa khôi phục trước khi khởi tạo (ưu tiên dạng stdin được ghi tài liệu bên dưới)
- `--force-reset-cross-signing` loại bỏ danh tính ký chéo hiện tại và tạo danh tính mới (chỉ dùng khi có chủ ý)

Đối với tài khoản mới, bật E2EE khi tạo:

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

- `Locally trusted`: chỉ được client này tin cậy
- `Cross-signing verified`: SDK báo cáo đã xác minh qua ký chéo
- `Signed by owner`: được ký bằng khóa tự ký của chính bạn (chỉ để chẩn đoán)

`Verified by owner` chỉ trở thành `yes` khi `Cross-signing verified` là `yes`. Chỉ tin cậy cục bộ hoặc chỉ có chữ ký của chủ sở hữu là chưa đủ.

`--allow-degraded-local-state` trả về chẩn đoán theo nỗ lực tốt nhất mà không chuẩn bị tài khoản Matrix trước; hữu ích cho các phép dò ngoại tuyến hoặc được cấu hình một phần.

### Xác minh thiết bị này bằng khóa khôi phục

Khóa khôi phục là thông tin nhạy cảm - hãy truyền qua stdin thay vì truyền trên dòng lệnh. Đặt `MATRIX_RECOVERY_KEY` (hoặc `MATRIX_<ID>_RECOVERY_KEY` cho tài khoản có tên):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Lệnh báo cáo ba trạng thái:

- `Recovery key accepted`: Matrix đã chấp nhận khóa cho lưu trữ bí mật hoặc tin cậy thiết bị.
- `Backup usable`: có thể tải bản sao lưu khóa phòng bằng vật liệu khôi phục đáng tin cậy.
- `Device verified by owner`: thiết bị này có độ tin cậy danh tính ký chéo Matrix đầy đủ.

Lệnh thoát với mã khác 0 khi độ tin cậy danh tính đầy đủ chưa hoàn tất, ngay cả khi khóa khôi phục đã mở khóa vật liệu sao lưu. Trong trường hợp đó, hoàn tất tự xác minh từ một client Matrix khác:

```bash
openclaw matrix verify self
```

`verify self` chờ đến khi `Cross-signing verified: yes` rồi mới thoát thành công. Dùng `--timeout-ms <ms>` để điều chỉnh thời gian chờ.

Dạng khóa trực tiếp `openclaw matrix verify device "<recovery-key>"` cũng được chấp nhận, nhưng khóa sẽ xuất hiện trong lịch sử shell của bạn.

### Khởi tạo hoặc sửa chữa ký chéo

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` là lệnh sửa chữa và thiết lập cho các tài khoản được mã hóa. Theo thứ tự, lệnh sẽ:

- khởi tạo lưu trữ bí mật, tái sử dụng khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa công khai còn thiếu
- đánh dấu và ký chéo thiết bị hiện tại
- tạo bản sao lưu khóa phòng phía máy chủ nếu chưa có

Nếu homeserver yêu cầu UIA để tải khóa ký chéo lên, OpenClaw thử không xác thực trước, sau đó `m.login.dummy`, rồi `m.login.password` (yêu cầu `channels.matrix.password`).

Các cờ hữu ích:

- `--recovery-key-stdin` (dùng cùng `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) hoặc `--recovery-key <key>`
- `--force-reset-cross-signing` để loại bỏ danh tính ký chéo hiện tại (chỉ khi có chủ ý)

### Sao lưu khóa phòng

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` hiển thị liệu có bản sao lưu phía máy chủ hay không và thiết bị này có thể giải mã bản đó hay không. `backup restore` nhập các khóa phòng đã sao lưu vào kho crypto cục bộ; nếu khóa khôi phục đã có trên đĩa, bạn có thể bỏ qua `--recovery-key-stdin`.

Để thay thế bản sao lưu bị hỏng bằng một đường cơ sở mới (chấp nhận mất lịch sử cũ không thể khôi phục; cũng có thể tạo lại lưu trữ bí mật nếu bí mật sao lưu hiện tại không tải được):

```bash
openclaw matrix verify backup reset --yes
```

Chỉ thêm `--rotate-recovery-key` khi bạn chủ ý muốn khóa khôi phục trước đó không còn mở khóa được đường cơ sở sao lưu mới.

### Liệt kê, yêu cầu và phản hồi xác minh

```bash
openclaw matrix verify list
```

Liệt kê các yêu cầu xác minh đang chờ cho tài khoản đã chọn.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Gửi yêu cầu xác minh từ tài khoản OpenClaw này. `--own-user` yêu cầu tự xác minh (bạn chấp nhận lời nhắc trong một client Matrix khác của cùng người dùng); `--user-id`/`--device-id`/`--room-id` nhắm tới người khác. `--own-user` không thể kết hợp với các cờ nhắm đích khác.

Đối với xử lý vòng đời cấp thấp hơn - thường khi theo dõi ngầm các yêu cầu đến từ client khác - các lệnh này tác động lên một yêu cầu `<id>` cụ thể (được in bởi `verify list` và `verify request`):

| Lệnh                                       | Mục đích                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Chấp nhận một yêu cầu đến                                           |
| `openclaw matrix verify start <id>`        | Bắt đầu luồng SAS                                                   |
| `openclaw matrix verify sas <id>`          | In emoji hoặc số thập phân SAS                                      |
| `openclaw matrix verify confirm-sas <id>`  | Xác nhận SAS khớp với nội dung client kia hiển thị                  |
| `openclaw matrix verify mismatch-sas <id>` | Từ chối SAS khi emoji hoặc số thập phân không khớp                  |
| `openclaw matrix verify cancel <id>`       | Hủy; nhận tùy chọn `--reason <text>` và `--code <matrix-code>`      |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, và `cancel` đều chấp nhận `--user-id` và `--room-id` làm gợi ý theo dõi DM khi xác minh được neo vào một phòng tin nhắn trực tiếp cụ thể.

### Ghi chú nhiều tài khoản

Nếu không có `--account <id>`, các lệnh Matrix CLI dùng tài khoản mặc định ngầm định. Nếu bạn có nhiều tài khoản có tên và chưa đặt `channels.matrix.defaultAccount`, chúng sẽ từ chối đoán và yêu cầu bạn chọn. Khi E2EE bị tắt hoặc không khả dụng cho tài khoản có tên, lỗi sẽ chỉ đến khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Với `encryption: true`, `startupVerification` mặc định là `"if-unverified"`. Khi khởi động, một thiết bị chưa xác minh sẽ yêu cầu tự xác minh trong một client Matrix khác, bỏ qua các bản trùng lặp và áp dụng thời gian chờ (mặc định là 24 giờ). Điều chỉnh bằng `startupVerificationCooldownHours` hoặc tắt bằng `startupVerification: "off"`.

    Khi khởi động cũng chạy một lượt khởi tạo crypto thận trọng, tái sử dụng lưu trữ bí mật và danh tính ký chéo hiện tại. Nếu trạng thái khởi tạo bị hỏng, OpenClaw cố gắng sửa chữa có bảo vệ ngay cả khi không có `channels.matrix.password`; nếu homeserver yêu cầu UIA bằng mật khẩu, khởi động sẽ ghi cảnh báo và vẫn không gây lỗi nghiêm trọng. Các thiết bị đã được chủ sở hữu ký sẽ được giữ nguyên.

    Xem [di chuyển Matrix](/vi/channels/matrix-migration) để biết toàn bộ luồng nâng cấp.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix đăng thông báo vòng đời xác minh vào phòng xác minh DM nghiêm ngặt dưới dạng tin nhắn `m.notice`: yêu cầu, sẵn sàng (kèm hướng dẫn "Verify by emoji"), bắt đầu/hoàn tất, và chi tiết SAS (emoji/số thập phân) khi có.

    Các yêu cầu đến từ một client Matrix khác được theo dõi và tự động chấp nhận. Đối với tự xác minh, OpenClaw tự động bắt đầu luồng SAS và xác nhận phía của chính nó khi xác minh bằng emoji khả dụng - bạn vẫn cần so sánh và xác nhận "They match" trong client Matrix của mình.

    Thông báo hệ thống xác minh không được chuyển tiếp tới pipeline trò chuyện của agent.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Nếu `verify status` cho biết thiết bị hiện tại không còn được liệt kê trên homeserver, hãy tạo một thiết bị OpenClaw Matrix mới. Đối với đăng nhập bằng mật khẩu:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Đối với xác thực bằng token, tạo một access token mới trong client Matrix hoặc UI quản trị của bạn, rồi cập nhật OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Thay `assistant` bằng ID tài khoản từ lệnh thất bại, hoặc bỏ qua `--account` cho tài khoản mặc định.

  </Accordion>

  <Accordion title="Device hygiene">
    Các thiết bị cũ do OpenClaw quản lý có thể tích lũy. Liệt kê và dọn bớt:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE dùng đường dẫn crypto Rust chính thức của `matrix-js-sdk` với `fake-indexeddb` làm lớp shim IndexedDB. Trạng thái crypto được lưu bền vào `crypto-idb-snapshot.json` (quyền tệp hạn chế).

    Trạng thái runtime được mã hóa nằm dưới `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` và bao gồm kho đồng bộ, kho crypto, khóa khôi phục, bản chụp nhanh IDB, liên kết thread, và trạng thái xác minh khi khởi động. Khi token thay đổi nhưng danh tính tài khoản giữ nguyên, OpenClaw tái sử dụng gốc hiện có tốt nhất để trạng thái trước đó vẫn hiển thị.

  </Accordion>
</AccordionGroup>

## Quản lý hồ sơ

Cập nhật hồ sơ tự thân Matrix cho tài khoản đã chọn:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Bạn có thể truyền cả hai tùy chọn trong một lần gọi. Matrix chấp nhận trực tiếp URL avatar `mxc://`; khi bạn truyền `http://` hoặc `https://`, OpenClaw tải tệp lên trước và lưu URL `mxc://` đã phân giải vào `channels.matrix.avatarUrl` (hoặc ghi đè theo từng tài khoản).

## Thread

Matrix hỗ trợ thread Matrix gốc cho cả trả lời tự động và gửi bằng công cụ tin nhắn. Hai núm điều khiển độc lập kiểm soát hành vi:

### Định tuyến phiên (`sessionScope`)

`dm.sessionScope` quyết định cách các phòng DM Matrix ánh xạ tới phiên OpenClaw:

- `"per-user"` (mặc định): tất cả phòng DM với cùng peer đã định tuyến dùng chung một phiên.
- `"per-room"`: mỗi phòng DM Matrix có khóa phiên riêng, ngay cả khi peer giống nhau.

Các liên kết hội thoại rõ ràng luôn thắng `sessionScope`, vì vậy các phòng và thread đã liên kết giữ phiên đích đã chọn của chúng.

### Tạo thread cho trả lời (`threadReplies`)

`threadReplies` quyết định nơi bot đăng câu trả lời:

- `"off"`: trả lời ở cấp cao nhất. Tin nhắn có thread đến vẫn ở trên phiên cha.
- `"inbound"`: chỉ trả lời bên trong thread khi tin nhắn đến đã nằm trong thread đó.
- `"always"`: trả lời bên trong một thread có gốc là tin nhắn kích hoạt; hội thoại đó được định tuyến qua một phiên theo phạm vi thread tương ứng kể từ lần kích hoạt đầu tiên trở đi.

`dm.threadReplies` ghi đè thiết lập này chỉ cho DM - ví dụ, giữ các thread trong phòng được tách biệt trong khi giữ DM phẳng.

### Kế thừa thread và lệnh slash

- Tin nhắn theo luồng gửi vào bao gồm tin nhắn gốc của luồng dưới dạng ngữ cảnh tác nhân bổ sung.
- Các lượt gửi bằng công cụ tin nhắn tự động kế thừa luồng Matrix hiện tại khi nhắm đến cùng phòng (hoặc cùng mục tiêu người dùng DM), trừ khi cung cấp `threadId` tường minh.
- Việc tái sử dụng mục tiêu người dùng DM chỉ kích hoạt khi siêu dữ liệu phiên hiện tại chứng minh cùng một đối tác DM trên cùng tài khoản Matrix; nếu không, OpenClaw sẽ quay về định tuyến theo phạm vi người dùng thông thường.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và `/acp spawn` gắn với luồng đều hoạt động trong phòng Matrix và DM.
- `/focus` ở cấp cao nhất tạo một luồng Matrix mới và liên kết nó với phiên đích khi `threadBindings.spawnSessions` được bật.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có sẽ liên kết luồng đó tại chỗ.

Khi OpenClaw phát hiện một phòng DM Matrix xung đột với một phòng DM khác trên cùng phiên dùng chung, nó đăng một `m.notice` một lần trong phòng đó, trỏ đến lối thoát `/focus` và gợi ý thay đổi `dm.sessionScope`. Thông báo này chỉ xuất hiện khi liên kết luồng được bật.

## Liên kết cuộc hội thoại ACP

Phòng Matrix, DM, và các luồng Matrix hiện có có thể được chuyển thành workspace ACP bền vững mà không cần thay đổi bề mặt chat.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong DM Matrix, phòng, hoặc luồng hiện có mà bạn muốn tiếp tục sử dụng.
- Trong một DM Matrix hoặc phòng cấp cao nhất, DM/phòng hiện tại vẫn là bề mặt chat và các tin nhắn sau này định tuyến đến phiên ACP đã sinh.
- Bên trong một luồng Matrix hiện có, `--bind here` liên kết luồng hiện tại đó tại chỗ.
- `/new` và `/reset` đặt lại cùng phiên ACP đã liên kết tại chỗ.
- `/acp close` đóng phiên ACP và xóa liên kết.

Ghi chú:

- `--bind here` không tạo luồng Matrix con.
- `threadBindings.spawnSessions` kiểm soát `/acp spawn --thread auto|here`, nơi OpenClaw cần tạo hoặc liên kết một luồng Matrix con.

### Cấu hình liên kết luồng

Matrix kế thừa mặc định toàn cục từ `session.threadBindings`, đồng thời hỗ trợ ghi đè theo từng kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Việc sinh phiên gắn với luồng Matrix được bật mặc định:

- Đặt `threadBindings.spawnSessions: false` để chặn `/focus` cấp cao nhất và `/acp spawn --thread auto|here` tạo/liên kết các luồng Matrix.
- Đặt `threadBindings.defaultSpawnContext: "isolated"` khi việc sinh luồng tác nhân con gốc không nên fork bản ghi phiên của cha.

## Phản ứng

Matrix hỗ trợ phản ứng gửi ra, thông báo phản ứng gửi vào, và phản ứng xác nhận.

Công cụ phản ứng gửi ra được kiểm soát bởi `channels.matrix.actions.reactions`:

- `react` thêm một phản ứng vào một sự kiện Matrix.
- `reactions` liệt kê tóm tắt phản ứng hiện tại cho một sự kiện Matrix.
- `emoji=""` xóa các phản ứng của chính bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji đã chỉ định khỏi bot.

**Thứ tự phân giải** (giá trị được định nghĩa đầu tiên sẽ thắng):

| Thiết lập              | Thứ tự                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `ackReaction`          | theo tài khoản → kênh → `messages.ackReaction` → dự phòng emoji định danh tác nhân          |
| `ackReactionScope`     | theo tài khoản → kênh → `messages.ackReactionScope` → mặc định `"group-mentions"`           |
| `reactionNotifications` | theo tài khoản → kênh → mặc định `"own"`                                                    |

`reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` được thêm khi chúng nhắm đến tin nhắn Matrix do bot tạo; `"off"` tắt sự kiện hệ thống phản ứng. Việc xóa phản ứng không được tổng hợp thành sự kiện hệ thống vì Matrix hiển thị chúng dưới dạng biên tập xóa, không phải các lượt xóa `m.reaction` độc lập.

## Ngữ cảnh lịch sử

- `channels.matrix.historyLimit` kiểm soát số lượng tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng Matrix kích hoạt tác nhân. Quay về `messages.groupChat.historyLimit`; nếu cả hai đều chưa đặt, mặc định hiệu lực là `0`. Đặt `0` để tắt.
- Lịch sử phòng Matrix chỉ giới hạn trong phòng. DM tiếp tục dùng lịch sử phiên thông thường.
- Lịch sử phòng Matrix chỉ ở trạng thái chờ: OpenClaw đệm các tin nhắn phòng chưa kích hoạt phản hồi, rồi chụp nhanh cửa sổ đó khi có lượt nhắc đến hoặc kích hoạt khác.
- Tin nhắn kích hoạt hiện tại không được đưa vào `InboundHistory`; nó vẫn nằm trong thân gửi vào chính cho lượt đó.
- Các lần thử lại của cùng sự kiện Matrix tái sử dụng ảnh chụp nhanh lịch sử ban đầu thay vì trôi tới các tin nhắn phòng mới hơn.

## Khả năng hiển thị ngữ cảnh

Matrix hỗ trợ điều khiển `contextVisibility` dùng chung cho ngữ cảnh phòng bổ sung như văn bản trả lời đã lấy, gốc luồng, và lịch sử đang chờ.

- `contextVisibility: "all"` là mặc định. Ngữ cảnh bổ sung được giữ nguyên như đã nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung xuống các người gửi được cho phép bởi các kiểm tra allowlist phòng/người dùng đang hoạt động.
- `contextVisibility: "allowlist_quote"` hoạt động như `allowlist`, nhưng vẫn giữ một trả lời được trích dẫn tường minh.

Thiết lập này ảnh hưởng đến khả năng hiển thị ngữ cảnh bổ sung, không ảnh hưởng đến việc chính tin nhắn gửi vào có thể kích hoạt phản hồi hay không.
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

Xem [Nhóm](/vi/channels/groups) để biết hành vi chặn bằng nhắc đến và allowlist.

Ví dụ ghép nối cho DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được phê duyệt tiếp tục nhắn tin cho bạn trước khi phê duyệt, OpenClaw tái sử dụng cùng mã ghép nối đang chờ và có thể gửi trả lời nhắc nhở sau một khoảng cooldown ngắn thay vì tạo mã mới.

Xem [Ghép nối](/vi/channels/pairing) để biết luồng ghép nối DM dùng chung và bố cục lưu trữ.

## Sửa chữa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp lệch đồng bộ, OpenClaw có thể kết thúc với các ánh xạ `m.direct` cũ trỏ đến các phòng đơn cũ thay vì DM đang hoạt động. Kiểm tra ánh xạ hiện tại cho một đối tác:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa chữa nó:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Cả hai lệnh chấp nhận `--account <id>` cho các thiết lập nhiều tài khoản. Luồng sửa chữa:

- ưu tiên DM 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- quay về bất kỳ DM 1:1 nghiêm ngặt hiện đang tham gia nào với người dùng đó
- tạo một phòng trực tiếp mới và viết lại `m.direct` nếu không có DM khỏe mạnh nào tồn tại

Nó không tự động xóa các phòng cũ. Nó chọn DM khỏe mạnh và cập nhật ánh xạ để các lượt gửi Matrix, thông báo xác minh, và các luồng tin nhắn trực tiếp khác trong tương lai nhắm đến đúng phòng.

## Phê duyệt exec

Matrix có thể hoạt động như một máy khách phê duyệt gốc. Cấu hình trong `channels.matrix.execApprovals` (hoặc `channels.matrix.accounts.<account>.execApprovals` để ghi đè theo tài khoản):

- `enabled`: gửi phê duyệt qua lời nhắc gốc của Matrix. Khi chưa đặt hoặc là `"auto"`, Matrix tự động bật khi phân giải được ít nhất một người phê duyệt. Đặt `false` để tắt tường minh.
- `approvers`: ID người dùng Matrix (`@owner:example.org`) được phép phê duyệt yêu cầu exec. Tùy chọn - quay về `channels.matrix.dm.allowFrom`.
- `target`: nơi gửi lời nhắc. `"dm"` (mặc định) gửi đến DM của người phê duyệt; `"channel"` gửi đến phòng Matrix hoặc DM khởi nguồn; `"both"` gửi đến cả hai.
- `agentFilter` / `sessionFilter`: allowlist tùy chọn cho các tác nhân/phiên kích hoạt việc gửi qua Matrix.

Ủy quyền hơi khác nhau giữa các loại phê duyệt:

- **Phê duyệt exec** dùng `execApprovals.approvers`, quay về `dm.allowFrom`.
- **Phê duyệt Plugin** ủy quyền chỉ qua `dm.allowFrom`.

Cả hai loại dùng chung phím tắt phản ứng Matrix và cập nhật tin nhắn. Người phê duyệt thấy các phím tắt phản ứng trên tin nhắn phê duyệt chính:

- `✅` cho phép một lần
- `❌` từ chối
- `♾️` luôn cho phép (khi chính sách exec hiệu lực cho phép)

Lệnh slash dự phòng: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Chỉ những người phê duyệt đã được phân giải mới có thể phê duyệt hoặc từ chối. Gửi qua kênh cho phê duyệt exec bao gồm văn bản lệnh - chỉ bật `channel` hoặc `both` trong các phòng đáng tin cậy.

Liên quan: [Phê duyệt exec](/vi/tools/exec-approvals).

## Lệnh slash

Lệnh slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, v.v.) hoạt động trực tiếp trong DM. Trong phòng, OpenClaw cũng nhận diện các lệnh được thêm tiền tố bằng lượt nhắc đến Matrix của chính bot, vì vậy `@bot:server /new` kích hoạt đường dẫn lệnh mà không cần regex nhắc đến tùy chỉnh. Điều này giữ cho bot phản hồi được với các bài đăng kiểu phòng `@mention /command` mà Element và các máy khách tương tự phát ra khi người dùng hoàn thành bằng tab tên bot trước khi nhập lệnh.

Quy tắc ủy quyền vẫn áp dụng: người gửi lệnh phải đáp ứng cùng chính sách allowlist/chủ sở hữu của DM hoặc phòng như tin nhắn thường.

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

- Các giá trị `channels.matrix` cấp cao nhất đóng vai trò mặc định cho các tài khoản được đặt tên trừ khi tài khoản ghi đè chúng.
- Phạm vi hóa một mục phòng được kế thừa cho một tài khoản cụ thể bằng `groups.<room>.account`. Các mục không có `account` được chia sẻ giữa các tài khoản; `account: "default"` vẫn hoạt động khi tài khoản mặc định được cấu hình ở cấp cao nhất.

**Chọn tài khoản mặc định:**

- Đặt `defaultAccount` để chọn tài khoản được đặt tên mà định tuyến ngầm định, thăm dò, và lệnh CLI ưu tiên.
- Nếu bạn có nhiều tài khoản và một tài khoản có tên đúng là `default`, OpenClaw dùng nó ngầm định ngay cả khi chưa đặt `defaultAccount`.
- Nếu bạn có nhiều tài khoản được đặt tên và chưa chọn mặc định, các lệnh CLI sẽ từ chối đoán - hãy đặt `defaultAccount` hoặc truyền `--account <id>`.
- Khối `channels.matrix.*` cấp cao nhất chỉ được coi là tài khoản `default` ngầm định khi xác thực của nó hoàn chỉnh (`homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`). Các tài khoản được đặt tên vẫn có thể được phát hiện từ `homeserver` + `userId` sau khi thông tin xác thực đã lưu trong bộ nhớ đệm bao phủ xác thực.

**Thăng cấp:**

- Khi OpenClaw thăng cấp cấu hình một tài khoản thành nhiều tài khoản trong quá trình sửa chữa hoặc thiết lập, nó giữ nguyên tài khoản được đặt tên hiện có nếu có, hoặc nếu `defaultAccount` đã trỏ đến một tài khoản. Chỉ các khóa xác thực/khởi động Matrix được chuyển vào tài khoản đã thăng cấp; các khóa chính sách gửi dùng chung vẫn ở cấp cao nhất.

Xem [Tham chiếu cấu hình](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu nhiều tài khoản dùng chung.

## Homeserver riêng tư/LAN

Theo mặc định, OpenClaw chặn homeserver Matrix riêng tư/nội bộ để bảo vệ SSRF trừ khi bạn
chọn tham gia tường minh cho từng tài khoản.

Nếu homeserver của bạn chạy trên localhost, IP LAN/Tailscale, hoặc hostname nội bộ, hãy bật
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

Lựa chọn bật này chỉ cho phép các đích riêng tư/nội bộ đáng tin cậy. Các homeserver dạng văn bản rõ công khai như
`http://matrix.example.org:8008` vẫn bị chặn. Ưu tiên `https://` bất cứ khi nào có thể.

## Chuyển tiếp lưu lượng Matrix qua proxy

Nếu bản triển khai Matrix của bạn cần một proxy HTTP(S) đi ra rõ ràng, hãy đặt `channels.matrix.proxy`:

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
OpenClaw dùng cùng một thiết lập proxy cho lưu lượng Matrix khi chạy và các phép kiểm tra trạng thái tài khoản.

## Phân giải đích

Matrix chấp nhận các dạng đích này ở bất kỳ nơi nào OpenClaw yêu cầu bạn nhập đích phòng hoặc người dùng:

- Người dùng: `@user:server`, `user:@user:server`, hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server`, hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server`, hoặc `matrix:channel:#alias:server`

ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy dùng đúng cách viết hoa chữ thường của ID phòng từ Matrix
khi cấu hình các đích gửi rõ ràng, tác vụ cron, liên kết hoặc allowlist.
OpenClaw giữ các khóa phiên nội bộ ở dạng chuẩn để lưu trữ, nên các khóa chữ thường đó
không phải là nguồn đáng tin cậy cho ID gửi của Matrix.

Tra cứu thư mục trực tiếp sử dụng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng truy vấn thư mục người dùng Matrix trên homeserver đó.
- Tra cứu phòng chấp nhận trực tiếp ID phòng và bí danh rõ ràng, sau đó quay sang tìm kiếm tên phòng đã tham gia của tài khoản đó.
- Tra cứu tên phòng đã tham gia là nỗ lực tốt nhất. Nếu tên phòng không thể được phân giải thành ID hoặc bí danh, tên đó sẽ bị bỏ qua trong quá trình phân giải allowlist khi chạy.

## Tham chiếu cấu hình

Các trường kiểu allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) chấp nhận ID người dùng Matrix đầy đủ (an toàn nhất). Các kết quả khớp thư mục chính xác được phân giải khi khởi động và bất cứ khi nào allowlist thay đổi trong lúc trình giám sát đang chạy; các mục không thể phân giải sẽ bị bỏ qua khi chạy. Allowlist phòng ưu tiên ID phòng hoặc bí danh vì cùng lý do.

### Tài khoản và kết nối

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn hiển thị tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi nhiều tài khoản Matrix được cấu hình.
- `accounts`: các ghi đè theo từng tài khoản được đặt tên. Các giá trị cấp cao nhất của `channels.matrix` được kế thừa làm mặc định.
- `homeserver`: URL homeserver, ví dụ `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: cho phép tài khoản này kết nối tới `localhost`, IP LAN/Tailscale hoặc tên máy chủ nội bộ.
- `proxy`: URL proxy HTTP(S) tùy chọn cho lưu lượng Matrix. Hỗ trợ ghi đè theo từng tài khoản.
- `userId`: ID người dùng Matrix đầy đủ (`@bot:example.org`).
- `accessToken`: token truy cập cho xác thực dựa trên token. Hỗ trợ giá trị văn bản rõ và SecretRef trên các provider env/file/exec ([Quản lý bí mật](/vi/gateway/secrets)).
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu. Hỗ trợ giá trị văn bản rõ và SecretRef.
- `deviceId`: ID thiết bị Matrix rõ ràng.
- `deviceName`: tên hiển thị của thiết bị được dùng tại thời điểm đăng nhập bằng mật khẩu.
- `avatarUrl`: URL ảnh đại diện tự thân được lưu cho đồng bộ hồ sơ và cập nhật `profile set`.
- `initialSyncLimit`: số sự kiện tối đa được lấy trong quá trình đồng bộ khởi động.

### Mã hóa

- `encryption`: bật E2EE. Mặc định: `false`.
- `startupVerification`: `"if-unverified"` (mặc định khi E2EE bật) hoặc `"off"`. Tự động yêu cầu tự xác minh khi khởi động nếu thiết bị này chưa được xác minh.
- `startupVerificationCooldownHours`: thời gian chờ trước yêu cầu khởi động tự động tiếp theo. Mặc định: `24`.

### Truy cập và chính sách

- `groupPolicy`: `"open"`, `"allowlist"`, hoặc `"disabled"`. Mặc định: `"allowlist"`.
- `groupAllowFrom`: allowlist ID người dùng cho lưu lượng phòng.
- `dm.enabled`: khi `false`, bỏ qua mọi DM. Mặc định: `true`.
- `dm.policy`: `"pairing"` (mặc định), `"allowlist"`, `"open"`, hoặc `"disabled"`. Áp dụng sau khi bot đã tham gia và phân loại phòng là DM; không ảnh hưởng đến xử lý lời mời.
- `dm.allowFrom`: allowlist ID người dùng cho lưu lượng DM.
- `dm.sessionScope`: `"per-user"` (mặc định) hoặc `"per-room"`.
- `dm.threadReplies`: ghi đè chỉ dành cho DM đối với chuỗi trả lời (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: chấp nhận tin nhắn từ các tài khoản bot Matrix khác đã cấu hình (`true` hoặc `"mentions"`).
- `allowlistOnly`: khi `true`, ép tất cả chính sách DM đang hoạt động (trừ `"disabled"`) và chính sách nhóm `"open"` thành `"allowlist"`. Không thay đổi chính sách `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"`, hoặc `"off"`. Mặc định: `"off"`. Áp dụng cho mọi lời mời Matrix, bao gồm cả lời mời kiểu DM.
- `autoJoinAllowlist`: phòng/bí danh được cho phép khi `autoJoin` là `"allowlist"`. Các mục bí danh được phân giải theo homeserver, không theo trạng thái mà phòng được mời tuyên bố.
- `contextVisibility`: khả năng hiển thị ngữ cảnh bổ sung (mặc định `"all"`, `"allowlist"`, `"allowlist_quote"`).

### Hành vi trả lời

- `replyToMode`: `"off"`, `"first"`, `"all"`, hoặc `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, hoặc `"always"`.
- `threadBindings`: ghi đè theo từng kênh cho định tuyến phiên gắn với chuỗi và vòng đời.
- `streaming`: `"off"` (mặc định), `"partial"`, `"quiet"`, hoặc dạng đối tượng `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: khi `true`, các khối assistant đã hoàn tất được giữ dưới dạng thông báo tiến độ riêng biệt.
- `markdown`: cấu hình kết xuất Markdown tùy chọn cho văn bản đi ra.
- `responsePrefix`: chuỗi tùy chọn được thêm vào đầu các câu trả lời đi ra.
- `textChunkLimit`: kích thước đoạn đi ra tính bằng ký tự khi `chunkMode: "length"`. Mặc định: `4000`.
- `chunkMode`: `"length"` (mặc định, tách theo số ký tự) hoặc `"newline"` (tách tại ranh giới dòng).
- `historyLimit`: số tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng kích hoạt agent. Quay về `messages.groupChat.historyLimit`; mặc định hiệu lực là `0` (tắt).
- `mediaMaxMb`: giới hạn kích thước phương tiện tính bằng MB cho gửi đi và xử lý đầu vào.

### Thiết lập phản ứng

- `ackReaction`: ghi đè phản ứng xác nhận cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi (mặc định `"group-mentions"`, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: chế độ thông báo phản ứng đầu vào (mặc định `"own"`, `"off"`).

### Công cụ và ghi đè theo phòng

- `actions`: kiểm soát công cụ theo từng hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: bản đồ chính sách theo từng phòng. Danh tính phiên dùng ID phòng ổn định sau khi phân giải. (`rooms` là bí danh cũ.)
  - `groups.<room>.account`: giới hạn một mục phòng được kế thừa vào một tài khoản cụ thể.
  - `groups.<room>.allowBots`: ghi đè theo phòng cho thiết lập cấp kênh (`true` hoặc `"mentions"`).
  - `groups.<room>.users`: allowlist người gửi theo phòng.
  - `groups.<room>.tools`: ghi đè cho phép/từ chối công cụ theo phòng.
  - `groups.<room>.autoReply`: ghi đè kiểm soát yêu cầu nhắc đến theo phòng. `true` tắt yêu cầu nhắc đến cho phòng đó; `false` buộc bật lại.
  - `groups.<room>.skills`: bộ lọc skill theo phòng.
  - `groups.<room>.systemPrompt`: đoạn system prompt theo phòng.

### Thiết lập phê duyệt exec

- `execApprovals.enabled`: gửi phê duyệt exec thông qua prompt gốc của Matrix.
- `execApprovals.approvers`: ID người dùng Matrix được phép phê duyệt. Quay về `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (mặc định), `"channel"`, hoặc `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist agent/phiên tùy chọn để gửi.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép cặp](/vi/channels/pairing) - xác thực DM và quy trình ghép cặp
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát yêu cầu nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố bảo mật
