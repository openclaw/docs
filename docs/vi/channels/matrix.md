---
read_when:
    - Thiết lập Matrix trong OpenClaw
    - Cấu hình E2EE và xác minh cho Matrix
summary: Trạng thái hỗ trợ Matrix, thiết lập và ví dụ cấu hình
title: Ma trận
x-i18n:
    generated_at: "2026-04-29T22:26:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix là Plugin kênh được đóng gói kèm cho OpenClaw.
Plugin này dùng `matrix-js-sdk` chính thức và hỗ trợ DM, phòng, luồng, phương tiện, phản ứng, cuộc thăm dò, vị trí và E2EE.

## Plugin được đóng gói kèm

Các bản phát hành OpenClaw được đóng gói hiện tại có sẵn Plugin Matrix. Bạn không cần cài đặt gì thêm; việc cấu hình `channels.matrix.*` (xem [Thiết lập](#setup)) là thao tác kích hoạt Plugin này.

Với các bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh không bao gồm Matrix, hãy cài đặt gói npm hiện tại khi gói đó được phát hành:

```bash
openclaw plugins install @openclaw/matrix
```

Nếu npm báo gói thuộc sở hữu của OpenClaw là đã ngừng dùng, hãy dùng bản dựng OpenClaw được đóng gói hiện tại hoặc bản checkout cục bộ cho đến khi gói npm mới hơn được phát hành.

Từ một bản checkout cục bộ:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` đăng ký và bật Plugin, nên không cần bước `openclaw plugins enable matrix` riêng. Plugin vẫn không làm gì cho đến khi bạn cấu hình kênh bên dưới. Xem [Plugins](/vi/tools/plugin) để biết hành vi Plugin chung và quy tắc cài đặt.

## Thiết lập

1. Tạo một tài khoản Matrix trên homeserver của bạn.
2. Cấu hình `channels.matrix` bằng `homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`.
3. Khởi động lại Gateway.
4. Bắt đầu một DM với bot, hoặc mời bot vào một phòng (xem [tự động tham gia](#auto-join) — lời mời mới chỉ được nhận khi `autoJoin` cho phép).

### Thiết lập tương tác

```bash
openclaw channels add
openclaw configure --section channels
```

Trình hướng dẫn hỏi: URL homeserver, phương thức xác thực (mã truy cập hoặc mật khẩu), ID người dùng (chỉ với xác thực bằng mật khẩu), tên thiết bị tùy chọn, có bật E2EE hay không, và có cấu hình quyền truy cập phòng cùng tự động tham gia hay không.

Nếu các biến môi trường `MATRIX_*` tương ứng đã tồn tại và tài khoản được chọn chưa có xác thực đã lưu, trình hướng dẫn sẽ đề xuất lối tắt bằng biến môi trường. Để phân giải tên phòng trước khi lưu allowlist, hãy chạy `openclaw channels resolve --channel matrix "Project Room"`. Khi E2EE được bật, trình hướng dẫn ghi cấu hình và chạy cùng quy trình khởi động như [`openclaw matrix encryption setup`](#encryption-and-verification).

### Cấu hình tối thiểu

Dựa trên mã truy cập:

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

Dựa trên mật khẩu (mã truy cập được lưu vào bộ nhớ đệm sau lần đăng nhập đầu tiên):

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

OpenClaw không thể biết tại thời điểm được mời liệu phòng được mời là DM hay nhóm, nên mọi lời mời — bao gồm cả lời mời kiểu DM — đều đi qua `autoJoin` trước. `dm.policy` chỉ áp dụng sau đó, sau khi bot đã tham gia và phòng đã được phân loại.

<Warning>
Đặt `autoJoin: "allowlist"` cộng với `autoJoinAllowlist` để giới hạn lời mời mà bot chấp nhận, hoặc `autoJoin: "always"` để chấp nhận mọi lời mời.

`autoJoinAllowlist` chỉ chấp nhận mục tiêu ổn định: `!roomId:server`, `#alias:server`, hoặc `*`. Tên phòng thuần túy bị từ chối; mục nhập bí danh được phân giải qua homeserver, không dựa trên trạng thái do phòng được mời khai báo.
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

### Định dạng mục tiêu allowlist

Allowlist cho DM và phòng tốt nhất nên được điền bằng ID ổn định:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): dùng `@user:server`. Tên hiển thị chỉ phân giải khi thư mục homeserver trả về đúng một kết quả khớp.
- Phòng (`groups`, `autoJoinAllowlist`): dùng `!room:server` hoặc `#alias:server`. Tên được phân giải theo khả năng tốt nhất dựa trên các phòng đã tham gia; các mục không phân giải được sẽ bị bỏ qua khi chạy.

### Chuẩn hóa ID tài khoản

Trình hướng dẫn chuyển đổi tên thân thiện thành ID tài khoản đã chuẩn hóa. Ví dụ, `Ops Bot` trở thành `ops-bot`. Dấu câu được thoát trong tên biến môi trường có phạm vi để hai tài khoản không thể va chạm: `-` → `_X2D_`, nên `ops-prod` ánh xạ tới `MATRIX_OPS_X2D_PROD_*`.

### Thông tin xác thực được lưu vào bộ nhớ đệm

Matrix lưu thông tin xác thực được lưu vào bộ nhớ đệm trong `~/.openclaw/credentials/matrix/`:

- tài khoản mặc định: `credentials.json`
- tài khoản có tên: `credentials-<account>.json`

Khi thông tin xác thực được lưu vào bộ nhớ đệm tồn tại ở đó, OpenClaw coi Matrix là đã cấu hình ngay cả khi mã truy cập không có trong tệp cấu hình — điều đó bao phủ thiết lập, `openclaw doctor`, và các lần dò trạng thái kênh.

### Biến môi trường

Được dùng khi khóa cấu hình tương ứng chưa được đặt. Tài khoản mặc định dùng tên không có tiền tố; tài khoản có tên dùng ID tài khoản được chèn trước hậu tố.

| Tài khoản mặc định  | Tài khoản có tên (`<ID>` là ID tài khoản đã chuẩn hóa) |
| ------------------- | ------------------------------------------------------ |
| `MATRIX_HOMESERVER` | `MATRIX_<ID>_HOMESERVER`                              |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`    | `MATRIX_<ID>_USER_ID`                                 |
| `MATRIX_PASSWORD`   | `MATRIX_<ID>_PASSWORD`                                |
| `MATRIX_DEVICE_ID`  | `MATRIX_<ID>_DEVICE_ID`                               |
| `MATRIX_DEVICE_NAME` | `MATRIX_<ID>_DEVICE_NAME`                            |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Với tài khoản `ops`, tên sẽ thành `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, v.v. Các biến môi trường khóa khôi phục được đọc bởi các luồng CLI có nhận biết khôi phục (`verify backup restore`, `verify device`, `verify bootstrap`) khi bạn truyền khóa vào qua `--recovery-key-stdin`.

`MATRIX_HOMESERVER` không thể được đặt từ `.env` của workspace; xem [Tệp `.env` của workspace](/vi/gateway/security).

## Ví dụ cấu hình

Một nền tảng thực tế với ghép cặp DM, allowlist phòng và E2EE:

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

Streaming phản hồi Matrix là tùy chọn bật. `streaming` kiểm soát cách OpenClaw gửi phản hồi của trợ lý khi đang tạo; `blockStreaming` kiểm soát việc mỗi khối đã hoàn tất có được giữ lại dưới dạng tin nhắn Matrix riêng hay không.

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

| `streaming`       | Hành vi                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"off"` (mặc định) | Chờ toàn bộ phản hồi, gửi một lần. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                       |
| `"partial"`       | Chỉnh sửa tại chỗ một tin nhắn văn bản bình thường khi mô hình viết khối hiện tại. Các máy khách Matrix mặc định có thể thông báo ở bản xem trước đầu tiên, không phải lần chỉnh sửa cuối. |
| `"quiet"`         | Giống `"partial"` nhưng tin nhắn là thông báo không gây thông báo đẩy. Người nhận chỉ nhận thông báo khi một quy tắc đẩy theo từng người dùng khớp với lần chỉnh sửa đã hoàn tất (xem bên dưới). |

`blockStreaming` độc lập với `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (mặc định)                    |
| ----------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| `"partial"` / `"quiet"` | Bản nháp trực tiếp cho khối hiện tại, các khối đã hoàn tất được giữ làm tin nhắn | Bản nháp trực tiếp cho khối hiện tại, hoàn tất tại chỗ |
| `"off"`                 | Một tin nhắn Matrix có thông báo cho mỗi khối đã hoàn tất           | Một tin nhắn Matrix có thông báo cho toàn bộ phản hồi |

Ghi chú:

- Nếu bản xem trước vượt quá giới hạn kích thước mỗi sự kiện của Matrix, OpenClaw dừng streaming bản xem trước và chuyển về chỉ gửi bản cuối.
- Phản hồi phương tiện luôn gửi tệp đính kèm bình thường. Nếu bản xem trước cũ không còn có thể được tái sử dụng an toàn, OpenClaw sẽ biên tập lại nó trước khi gửi phản hồi phương tiện cuối cùng.
- Cập nhật bản xem trước tiến trình công cụ được bật theo mặc định khi streaming bản xem trước Matrix đang hoạt động. Đặt `streaming.preview.toolProgress: false` để giữ chỉnh sửa bản xem trước cho văn bản câu trả lời nhưng để tiến trình công cụ đi theo đường gửi bình thường.
- Chỉnh sửa bản xem trước tốn thêm lệnh gọi API Matrix. Để `streaming: "off"` nếu bạn muốn hồ sơ giới hạn tốc độ thận trọng nhất.

## Siêu dữ liệu phê duyệt

Lời nhắc phê duyệt gốc của Matrix là các sự kiện `m.room.message` bình thường với nội dung sự kiện tùy chỉnh riêng của OpenClaw trong `com.openclaw.approval`. Matrix cho phép khóa nội dung sự kiện tùy chỉnh, nên các máy khách mặc định vẫn hiển thị thân văn bản trong khi các máy khách nhận biết OpenClaw có thể đọc ID phê duyệt có cấu trúc, loại, trạng thái, các quyết định khả dụng và chi tiết thực thi/Plugin.

Khi lời nhắc phê duyệt quá dài cho một sự kiện Matrix, OpenClaw chia nhỏ văn bản hiển thị và chỉ gắn `com.openclaw.approval` vào khối đầu tiên. Phản ứng cho quyết định cho phép/từ chối được gắn với sự kiện đầu tiên đó, nên lời nhắc dài vẫn giữ cùng mục tiêu phê duyệt như lời nhắc một sự kiện.

### Quy tắc đẩy tự lưu trữ cho bản xem trước hoàn tất ở chế độ im lặng

`streaming: "quiet"` chỉ thông báo cho người nhận khi một khối hoặc lượt đã hoàn tất — một quy tắc đẩy theo từng người dùng phải khớp với dấu bản xem trước đã hoàn tất. Xem [Quy tắc đẩy Matrix cho bản xem trước im lặng](/vi/channels/matrix-push-rules) để biết công thức đầy đủ (mã truy cập người nhận, kiểm tra pusher, cài đặt quy tắc, ghi chú theo từng homeserver).

## Phòng bot-với-bot

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
- `allowBots: "mentions"` chỉ chấp nhận các tin nhắn đó khi chúng đề cập rõ ràng bot này trong phòng. DM vẫn được cho phép.
- `groups.<room>.allowBots` ghi đè thiết lập cấp tài khoản cho một phòng.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng ID người dùng Matrix để tránh vòng lặp tự trả lời.
- Matrix không cung cấp cờ bot gốc ở đây; OpenClaw coi "do bot tạo" là "được gửi bởi một tài khoản Matrix đã cấu hình khác trên Gateway OpenClaw này".

Hãy dùng allowlist phòng nghiêm ngặt và yêu cầu đề cập khi bật lưu lượng bot-với-bot trong các phòng dùng chung.

## Mã hóa và xác minh

Trong các phòng được mã hóa (E2EE), sự kiện hình ảnh gửi đi dùng `thumbnail_file` để bản xem trước hình ảnh được mã hóa cùng với tệp đính kèm đầy đủ. Các phòng không mã hóa vẫn dùng `thumbnail_url` dạng thuần. Không cần cấu hình — Plugin tự động phát hiện trạng thái E2EE.

Tất cả lệnh `openclaw matrix` chấp nhận `--verbose` (chẩn đoán đầy đủ), `--json` (đầu ra máy đọc được), và `--account <id>` (thiết lập nhiều tài khoản). Mặc định đầu ra ngắn gọn với ghi log SDK nội bộ yên lặng. Các ví dụ bên dưới hiển thị dạng chuẩn; thêm các cờ khi cần.

### Bật mã hóa

```bash
openclaw matrix encryption setup
```

Khởi tạo lưu trữ bí mật và ký chéo, tạo bản sao lưu khóa phòng nếu cần, sau đó in trạng thái và các bước tiếp theo. Các cờ hữu ích:

- `--recovery-key <key>` áp dụng khóa khôi phục trước khi khởi tạo (ưu tiên dạng stdin được ghi tài liệu bên dưới)
- `--force-reset-cross-signing` hủy danh tính ký chéo hiện tại và tạo danh tính mới (chỉ dùng khi có chủ ý)

Với tài khoản mới, bật E2EE tại thời điểm tạo:

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
- `Signed by owner`: được ký bằng khóa tự ký của chính bạn (chỉ dùng để chẩn đoán)

`Verified by owner` chỉ trở thành `yes` khi `Cross-signing verified` là `yes`. Chỉ tin cậy cục bộ hoặc chỉ có chữ ký của chủ sở hữu là chưa đủ.

`--allow-degraded-local-state` trả về chẩn đoán nỗ lực tốt nhất mà không chuẩn bị tài khoản Matrix trước; hữu ích cho các phép thăm dò ngoại tuyến hoặc cấu hình một phần.

### Xác minh thiết bị này bằng khóa khôi phục

Khóa khôi phục là thông tin nhạy cảm — hãy truyền qua stdin thay vì truyền trên dòng lệnh. Đặt `MATRIX_RECOVERY_KEY` (hoặc `MATRIX_<ID>_RECOVERY_KEY` cho tài khoản có tên):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Lệnh báo cáo ba trạng thái:

- `Recovery key accepted`: Matrix đã chấp nhận khóa cho lưu trữ bí mật hoặc tin cậy thiết bị.
- `Backup usable`: có thể tải bản sao lưu khóa phòng bằng vật liệu khôi phục đáng tin cậy.
- `Device verified by owner`: thiết bị này có đầy đủ tin cậy danh tính ký chéo Matrix.

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

- khởi tạo lưu trữ bí mật, dùng lại khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa công khai còn thiếu
- đánh dấu và ký chéo thiết bị hiện tại
- tạo bản sao lưu khóa phòng phía máy chủ nếu chưa có

Nếu homeserver yêu cầu UIA để tải khóa ký chéo lên, OpenClaw thử không xác thực trước, sau đó `m.login.dummy`, rồi `m.login.password` (yêu cầu `channels.matrix.password`).

Các cờ hữu ích:

- `--recovery-key-stdin` (dùng cùng `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) hoặc `--recovery-key <key>`
- `--force-reset-cross-signing` để hủy danh tính ký chéo hiện tại (chỉ khi có chủ ý)

### Sao lưu khóa phòng

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` cho biết có bản sao lưu phía máy chủ hay không và thiết bị này có giải mã được hay không. `backup restore` nhập các khóa phòng đã sao lưu vào kho crypto cục bộ; nếu khóa khôi phục đã có trên đĩa, bạn có thể bỏ qua `--recovery-key-stdin`.

Để thay thế bản sao lưu hỏng bằng đường cơ sở mới (chấp nhận mất lịch sử cũ không thể khôi phục; cũng có thể tạo lại lưu trữ bí mật nếu không thể tải bí mật sao lưu hiện tại):

```bash
openclaw matrix verify backup reset --yes
```

Chỉ thêm `--rotate-recovery-key` khi bạn cố ý muốn khóa khôi phục trước đó không còn mở khóa được đường cơ sở sao lưu mới.

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

Để xử lý vòng đời cấp thấp hơn — thường là khi theo dõi yêu cầu đến từ một máy khách khác — các lệnh này tác động lên một yêu cầu `<id>` cụ thể (được in bởi `verify list` và `verify request`):

| Lệnh                                       | Mục đích                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Chấp nhận một yêu cầu đến                                            |
| `openclaw matrix verify start <id>`        | Bắt đầu luồng SAS                                                   |
| `openclaw matrix verify sas <id>`          | In emoji hoặc số thập phân SAS                                      |
| `openclaw matrix verify confirm-sas <id>`  | Xác nhận SAS khớp với nội dung máy khách kia hiển thị               |
| `openclaw matrix verify mismatch-sas <id>` | Từ chối SAS khi emoji hoặc số thập phân không khớp                  |
| `openclaw matrix verify cancel <id>`       | Hủy; nhận tùy chọn `--reason <text>` và `--code <matrix-code>`      |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, và `cancel` đều chấp nhận `--user-id` và `--room-id` làm gợi ý theo dõi DM khi xác minh được neo vào một phòng tin nhắn trực tiếp cụ thể.

### Ghi chú nhiều tài khoản

Không có `--account <id>`, các lệnh Matrix CLI dùng tài khoản mặc định ngầm định. Nếu bạn có nhiều tài khoản có tên và chưa đặt `channels.matrix.defaultAccount`, các lệnh sẽ từ chối đoán và yêu cầu bạn chọn. Khi E2EE bị tắt hoặc không khả dụng cho một tài khoản có tên, lỗi sẽ trỏ tới khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Hành vi khởi động">
    Với `encryption: true`, `startupVerification` mặc định là `"if-unverified"`. Khi khởi động, một thiết bị chưa xác minh sẽ yêu cầu tự xác minh trong một máy khách Matrix khác, bỏ qua bản trùng lặp và áp dụng thời gian chờ (mặc định 24 giờ). Điều chỉnh bằng `startupVerificationCooldownHours` hoặc tắt bằng `startupVerification: "off"`.

    Khi khởi động cũng chạy một lượt khởi tạo crypto thận trọng, dùng lại lưu trữ bí mật và danh tính ký chéo hiện tại. Nếu trạng thái khởi tạo bị hỏng, OpenClaw thử sửa chữa có bảo vệ ngay cả khi không có `channels.matrix.password`; nếu homeserver yêu cầu UIA bằng mật khẩu, quá trình khởi động ghi log cảnh báo và không gây lỗi nghiêm trọng. Các thiết bị đã được chủ sở hữu ký sẵn được giữ nguyên.

    Xem [Di chuyển Matrix](/vi/channels/matrix-migration) để biết đầy đủ luồng nâng cấp.

  </Accordion>

  <Accordion title="Thông báo xác minh">
    Matrix đăng thông báo vòng đời xác minh vào phòng xác minh DM nghiêm ngặt dưới dạng thông điệp `m.notice`: yêu cầu, sẵn sàng (kèm hướng dẫn "Xác minh bằng emoji"), bắt đầu/hoàn tất, và chi tiết SAS (emoji/số thập phân) khi có.

    Các yêu cầu đến từ một máy khách Matrix khác được theo dõi và tự động chấp nhận. Với tự xác minh, OpenClaw tự động bắt đầu luồng SAS và xác nhận phía của chính nó sau khi có xác minh emoji — bạn vẫn cần so sánh và xác nhận "Chúng khớp" trong máy khách Matrix của mình.

    Thông báo hệ thống xác minh không được chuyển tiếp vào đường ống trò chuyện của agent.

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

    Với xác thực bằng token, hãy tạo access token mới trong máy khách Matrix hoặc giao diện quản trị của bạn, rồi cập nhật OpenClaw:

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

    Trạng thái runtime được mã hóa nằm trong `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` và bao gồm kho đồng bộ, kho crypto, khóa khôi phục, ảnh chụp IDB, liên kết luồng, và trạng thái xác minh khởi động. Khi token thay đổi nhưng danh tính tài khoản vẫn giữ nguyên, OpenClaw dùng lại root hiện có tốt nhất để trạng thái trước đó vẫn hiển thị.

  </Accordion>
</AccordionGroup>

## Quản lý hồ sơ

Cập nhật hồ sơ tự thân Matrix cho tài khoản đã chọn:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Bạn có thể truyền cả hai tùy chọn trong một lần gọi. Matrix chấp nhận trực tiếp URL ảnh đại diện `mxc://`; khi bạn truyền `http://` hoặc `https://`, OpenClaw tải tệp lên trước và lưu URL `mxc://` đã phân giải vào `channels.matrix.avatarUrl` (hoặc phần ghi đè theo tài khoản).

## Luồng

Matrix hỗ trợ các luồng Matrix gốc cho cả trả lời tự động và gửi bằng công cụ tin nhắn. Hai nút điều chỉnh độc lập kiểm soát hành vi:

### Định tuyến phiên (`sessionScope`)

`dm.sessionScope` quyết định cách các phòng DM Matrix ánh xạ tới phiên OpenClaw:

- `"per-user"` (mặc định): tất cả phòng DM với cùng đối tác được định tuyến dùng chung một phiên.
- `"per-room"`: mỗi phòng DM Matrix có khóa phiên riêng, ngay cả khi đối tác giống nhau.

Liên kết hội thoại rõ ràng luôn thắng `sessionScope`, vì vậy các phòng và luồng đã liên kết giữ phiên đích đã chọn.

### Tạo luồng trả lời (`threadReplies`)

`threadReplies` quyết định nơi bot đăng câu trả lời:

- `"off"`: câu trả lời nằm ở cấp cao nhất. Thông điệp theo luồng gửi đến vẫn ở phiên cha.
- `"inbound"`: chỉ trả lời bên trong luồng khi thông điệp gửi đến đã nằm trong luồng đó.
- `"always"`: trả lời bên trong một luồng có gốc là thông điệp kích hoạt; hội thoại đó được định tuyến qua một phiên có phạm vi luồng tương ứng kể từ lần kích hoạt đầu tiên trở đi.

`dm.threadReplies` ghi đè thiết lập này chỉ cho DM — ví dụ, giữ các luồng phòng tách biệt trong khi giữ DM phẳng.

### Kế thừa luồng và lệnh gạch chéo

- Tin nhắn dạng luồng gửi đến bao gồm tin nhắn gốc của luồng làm ngữ cảnh tác nhân bổ sung.
- Các lượt gửi bằng công cụ nhắn tin tự động kế thừa luồng Matrix hiện tại khi nhắm đến cùng phòng (hoặc cùng mục tiêu người dùng DM), trừ khi cung cấp `threadId` rõ ràng.
- Việc tái sử dụng mục tiêu người dùng DM chỉ kích hoạt khi siêu dữ liệu phiên hiện tại chứng minh đó là cùng một bên DM trên cùng tài khoản Matrix; nếu không, OpenClaw quay về định tuyến phạm vi người dùng thông thường.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và `/acp spawn` gắn với luồng đều hoạt động trong phòng Matrix và DM.
- `/focus` cấp cao nhất tạo một luồng Matrix mới và ràng buộc luồng đó với phiên mục tiêu khi `threadBindings.spawnSubagentSessions: true`.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có sẽ ràng buộc luồng đó tại chỗ.

Khi OpenClaw phát hiện một phòng DM Matrix xung đột với một phòng DM khác trên cùng phiên dùng chung, nó đăng một `m.notice` một lần trong phòng đó, trỏ đến lối thoát `/focus` và gợi ý thay đổi `dm.sessionScope`. Thông báo chỉ xuất hiện khi ràng buộc luồng được bật.

## Ràng buộc hội thoại ACP

Phòng Matrix, DM, và các luồng Matrix hiện có có thể được chuyển thành không gian làm việc ACP bền vững mà không thay đổi bề mặt trò chuyện.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong DM Matrix, phòng, hoặc luồng hiện có mà bạn muốn tiếp tục sử dụng.
- Trong DM hoặc phòng Matrix cấp cao nhất, DM/phòng hiện tại vẫn là bề mặt trò chuyện và các tin nhắn sau này sẽ định tuyến đến phiên ACP đã tạo.
- Bên trong một luồng Matrix hiện có, `--bind here` ràng buộc luồng hiện tại đó tại chỗ.
- `/new` và `/reset` đặt lại cùng phiên ACP đã ràng buộc tại chỗ.
- `/acp close` đóng phiên ACP và xóa ràng buộc.

Ghi chú:

- `--bind here` không tạo luồng Matrix con.
- `threadBindings.spawnAcpSessions` chỉ cần thiết cho `/acp spawn --thread auto|here`, nơi OpenClaw cần tạo hoặc ràng buộc một luồng Matrix con.

### Cấu hình ràng buộc luồng

Matrix kế thừa mặc định toàn cục từ `session.threadBindings`, và cũng hỗ trợ ghi đè theo từng kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Cờ tạo phiên gắn với luồng Matrix là tùy chọn bật:

- Đặt `threadBindings.spawnSubagentSessions: true` để cho phép `/focus` cấp cao nhất tạo và ràng buộc các luồng Matrix mới.
- Đặt `threadBindings.spawnAcpSessions: true` để cho phép `/acp spawn --thread auto|here` ràng buộc phiên ACP với luồng Matrix.

## Phản ứng

Matrix hỗ trợ phản ứng gửi đi, thông báo phản ứng gửi đến, và phản ứng xác nhận.

Công cụ phản ứng gửi đi được kiểm soát bởi `channels.matrix.actions.reactions`:

- `react` thêm một phản ứng vào một sự kiện Matrix.
- `reactions` liệt kê tóm tắt phản ứng hiện tại cho một sự kiện Matrix.
- `emoji=""` xóa các phản ứng của chính bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji đã chỉ định khỏi bot.

**Thứ tự phân giải** (giá trị được định nghĩa đầu tiên sẽ thắng):

| Cài đặt                 | Thứ tự                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | theo tài khoản → kênh → `messages.ackReaction` → phương án dự phòng emoji danh tính tác nhân |
| `ackReactionScope`      | theo tài khoản → kênh → `messages.ackReactionScope` → mặc định `"group-mentions"` |
| `reactionNotifications` | theo tài khoản → kênh → mặc định `"own"`                                          |

`reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` đã thêm khi chúng nhắm đến tin nhắn Matrix do bot viết; `"off"` tắt sự kiện hệ thống phản ứng. Các lượt xóa phản ứng không được tổng hợp thành sự kiện hệ thống vì Matrix hiển thị chúng dưới dạng biên tập xóa, không phải dưới dạng lượt xóa `m.reaction` độc lập.

## Ngữ cảnh lịch sử

- `channels.matrix.historyLimit` kiểm soát số lượng tin nhắn phòng gần đây được bao gồm dưới dạng `InboundHistory` khi một tin nhắn phòng Matrix kích hoạt tác nhân. Quay về `messages.groupChat.historyLimit`; nếu cả hai đều chưa đặt, mặc định hiệu lực là `0`. Đặt `0` để tắt.
- Lịch sử phòng Matrix chỉ dành cho phòng. DM tiếp tục dùng lịch sử phiên thông thường.
- Lịch sử phòng Matrix chỉ là phần đang chờ: OpenClaw đệm các tin nhắn phòng chưa kích hoạt phản hồi, rồi chụp nhanh cửa sổ đó khi có đề cập hoặc trình kích hoạt khác đến.
- Tin nhắn kích hoạt hiện tại không được bao gồm trong `InboundHistory`; nó vẫn ở phần nội dung gửi đến chính cho lượt đó.
- Các lần thử lại của cùng sự kiện Matrix tái sử dụng ảnh chụp lịch sử ban đầu thay vì trôi về phía các tin nhắn phòng mới hơn.

## Khả năng hiển thị ngữ cảnh

Matrix hỗ trợ điều khiển `contextVisibility` dùng chung cho ngữ cảnh phòng bổ sung như văn bản trả lời đã tìm nạp, gốc luồng, và lịch sử đang chờ.

- `contextVisibility: "all"` là mặc định. Ngữ cảnh bổ sung được giữ nguyên như đã nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung chỉ còn các người gửi được phép bởi kiểm tra danh sách cho phép phòng/người dùng đang hoạt động.
- `contextVisibility: "allowlist_quote"` hoạt động như `allowlist`, nhưng vẫn giữ một câu trả lời được trích dẫn rõ ràng.

Cài đặt này ảnh hưởng đến khả năng hiển thị ngữ cảnh bổ sung, không ảnh hưởng đến việc chính tin nhắn gửi đến có thể kích hoạt phản hồi hay không.
Ủy quyền kích hoạt vẫn đến từ `groupPolicy`, `groups`, `groupAllowFrom`, và các cài đặt chính sách DM.

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

Xem [Nhóm](/vi/channels/groups) để biết hành vi chặn bằng đề cập và danh sách cho phép.

Ví dụ ghép nối cho DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được phê duyệt tiếp tục nhắn tin cho bạn trước khi phê duyệt, OpenClaw tái sử dụng cùng mã ghép nối đang chờ và có thể gửi phản hồi nhắc nhở sau một khoảng hồi ngắn thay vì tạo mã mới.

Xem [Ghép nối](/vi/channels/pairing) để biết luồng ghép nối DM dùng chung và bố cục lưu trữ.

## Sửa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp lệch khỏi đồng bộ, OpenClaw có thể còn các ánh xạ `m.direct` cũ trỏ đến các phòng đơn cũ thay vì DM đang hoạt động. Kiểm tra ánh xạ hiện tại cho một bên:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa nó:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Cả hai lệnh đều chấp nhận `--account <id>` cho thiết lập nhiều tài khoản. Luồng sửa:

- ưu tiên một DM 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- quay về bất kỳ DM 1:1 nghiêm ngặt nào hiện đã tham gia với người dùng đó
- tạo một phòng trực tiếp mới và ghi lại `m.direct` nếu không có DM khỏe mạnh nào tồn tại

Nó không tự động xóa phòng cũ. Nó chọn DM khỏe mạnh và cập nhật ánh xạ để các lượt gửi Matrix trong tương lai, thông báo xác minh, và các luồng tin nhắn trực tiếp khác nhắm đến đúng phòng.

## Phê duyệt thực thi

Matrix có thể hoạt động như một ứng dụng khách phê duyệt gốc. Cấu hình trong `channels.matrix.execApprovals` (hoặc `channels.matrix.accounts.<account>.execApprovals` để ghi đè theo tài khoản):

- `enabled`: gửi phê duyệt qua lời nhắc gốc của Matrix. Khi chưa đặt hoặc là `"auto"`, Matrix tự động bật khi có thể phân giải ít nhất một người phê duyệt. Đặt `false` để tắt rõ ràng.
- `approvers`: ID người dùng Matrix (`@owner:example.org`) được phép phê duyệt yêu cầu exec. Tùy chọn — quay về `channels.matrix.dm.allowFrom`.
- `target`: nơi gửi lời nhắc. `"dm"` (mặc định) gửi đến DM của người phê duyệt; `"channel"` gửi đến phòng Matrix hoặc DM khởi nguồn; `"both"` gửi đến cả hai.
- `agentFilter` / `sessionFilter`: danh sách cho phép tùy chọn cho các tác nhân/phiên nào kích hoạt gửi qua Matrix.

Ủy quyền khác nhau đôi chút giữa các loại phê duyệt:

- **Phê duyệt thực thi** dùng `execApprovals.approvers`, quay về `dm.allowFrom`.
- **Phê duyệt Plugin** ủy quyền chỉ qua `dm.allowFrom`.

Cả hai loại dùng chung lối tắt phản ứng Matrix và cập nhật tin nhắn. Người phê duyệt thấy các lối tắt phản ứng trên tin nhắn phê duyệt chính:

- `✅` cho phép một lần
- `❌` từ chối
- `♾️` luôn cho phép (khi chính sách exec hiệu lực cho phép)

Lệnh gạch chéo dự phòng: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Chỉ người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối. Gửi qua kênh cho phê duyệt thực thi bao gồm văn bản lệnh — chỉ bật `channel` hoặc `both` trong các phòng đáng tin cậy.

Liên quan: [Phê duyệt thực thi](/vi/tools/exec-approvals).

## Lệnh gạch chéo

Lệnh gạch chéo (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, v.v.) hoạt động trực tiếp trong DM. Trong phòng, OpenClaw cũng nhận ra các lệnh có tiền tố là đề cập Matrix của chính bot, vì vậy `@bot:server /new` kích hoạt đường dẫn lệnh mà không cần regex đề cập tùy chỉnh. Điều này giữ cho bot phản hồi với các bài đăng kiểu phòng `@mention /command` mà Element và các ứng dụng khách tương tự phát ra khi người dùng dùng hoàn tất bằng tab cho bot trước khi nhập lệnh.

Quy tắc ủy quyền vẫn áp dụng: người gửi lệnh phải thỏa mãn cùng chính sách danh sách cho phép/chủ sở hữu của DM hoặc phòng như tin nhắn thường.

## Đa tài khoản

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

- Các giá trị `channels.matrix` cấp cao nhất đóng vai trò mặc định cho tài khoản được đặt tên trừ khi một tài khoản ghi đè chúng.
- Giới hạn phạm vi một mục phòng được kế thừa vào một tài khoản cụ thể bằng `groups.<room>.account`. Các mục không có `account` được chia sẻ giữa các tài khoản; `account: "default"` vẫn hoạt động khi tài khoản mặc định được cấu hình ở cấp cao nhất.

**Chọn tài khoản mặc định:**

- Đặt `defaultAccount` để chọn tài khoản được đặt tên mà định tuyến ngầm định, thăm dò, và lệnh CLI ưu tiên.
- Nếu bạn có nhiều tài khoản và một tài khoản có tên đúng là `default`, OpenClaw dùng ngầm định tài khoản đó ngay cả khi chưa đặt `defaultAccount`.
- Nếu bạn có nhiều tài khoản được đặt tên và chưa chọn mặc định, lệnh CLI sẽ từ chối đoán — đặt `defaultAccount` hoặc truyền `--account <id>`.
- Khối `channels.matrix.*` cấp cao nhất chỉ được xem là tài khoản `default` ngầm định khi xác thực của nó hoàn chỉnh (`homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`). Tài khoản được đặt tên vẫn có thể được phát hiện từ `homeserver` + `userId` khi thông tin xác thực đã lưu trong bộ nhớ đệm bao phủ xác thực.

**Nâng cấp:**

- Khi OpenClaw nâng cấp cấu hình một tài khoản thành nhiều tài khoản trong quá trình sửa hoặc thiết lập, nó giữ nguyên tài khoản được đặt tên hiện có nếu có hoặc nếu `defaultAccount` đã trỏ đến một tài khoản. Chỉ các khóa xác thực/khởi động Matrix được chuyển vào tài khoản đã nâng cấp; các khóa chính sách gửi dùng chung vẫn ở cấp cao nhất.

Xem [Tham chiếu cấu hình](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu nhiều tài khoản dùng chung.

## Homeserver riêng tư/LAN

Theo mặc định, OpenClaw chặn homeserver Matrix riêng tư/nội bộ để bảo vệ SSRF trừ khi bạn
rõ ràng chọn tham gia theo từng tài khoản.

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

Tùy chọn rõ ràng này chỉ cho phép các đích riêng tư/nội bộ đáng tin cậy. Các homeserver công khai dùng văn bản rõ như
`http://matrix.example.org:8008` vẫn bị chặn. Ưu tiên `https://` bất cứ khi nào có thể.

## Proxy lưu lượng Matrix

Nếu bản triển khai Matrix của bạn cần proxy HTTP(S) đi ra rõ ràng, hãy đặt `channels.matrix.proxy`:

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

Các tài khoản có tên có thể ghi đè mặc định cấp cao nhất bằng `channels.matrix.accounts.<id>.proxy`.
OpenClaw dùng cùng một thiết lập proxy cho lưu lượng Matrix lúc chạy và các lần thăm dò trạng thái tài khoản.

## Phân giải đích

Matrix chấp nhận các dạng đích này ở mọi nơi OpenClaw yêu cầu bạn cung cấp đích phòng hoặc người dùng:

- Người dùng: `@user:server`, `user:@user:server`, hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server`, hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server`, hoặc `matrix:channel:#alias:server`

ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy dùng đúng cách viết hoa/thường của ID phòng từ Matrix
khi cấu hình các đích gửi rõ ràng, Cron job, binding hoặc allowlist.
OpenClaw giữ các khóa phiên nội bộ ở dạng chuẩn hóa để lưu trữ, vì vậy các khóa viết thường đó
không phải là nguồn đáng tin cậy cho ID gửi Matrix.

Tra cứu thư mục trực tiếp dùng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng truy vấn thư mục người dùng Matrix trên homeserver đó.
- Tra cứu phòng chấp nhận trực tiếp ID phòng và bí danh rõ ràng, sau đó dự phòng sang tìm kiếm tên phòng đã tham gia cho tài khoản đó.
- Tra cứu tên phòng đã tham gia là nỗ lực tối đa. Nếu không thể phân giải tên phòng thành ID hoặc bí danh, tên đó sẽ bị quá trình phân giải allowlist lúc chạy bỏ qua.

## Tham chiếu cấu hình

Các trường kiểu allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) chấp nhận ID người dùng Matrix đầy đủ (an toàn nhất). Các kết quả khớp thư mục chính xác được phân giải lúc khởi động và bất cứ khi nào allowlist thay đổi trong khi monitor đang chạy; các mục không thể phân giải sẽ bị bỏ qua lúc chạy. Allowlist phòng ưu tiên ID phòng hoặc bí danh vì cùng lý do.

### Tài khoản và kết nối

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn hiển thị tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi nhiều tài khoản Matrix được cấu hình.
- `accounts`: các ghi đè theo từng tài khoản có tên. Các giá trị `channels.matrix` cấp cao nhất được kế thừa làm mặc định.
- `homeserver`: URL homeserver, ví dụ `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: cho phép tài khoản này kết nối tới `localhost`, IP LAN/Tailscale hoặc hostname nội bộ.
- `proxy`: URL proxy HTTP(S) tùy chọn cho lưu lượng Matrix. Hỗ trợ ghi đè theo từng tài khoản.
- `userId`: ID người dùng Matrix đầy đủ (`@bot:example.org`).
- `accessToken`: access token cho xác thực dựa trên token. Hỗ trợ giá trị văn bản rõ và SecretRef trên các provider env/file/exec ([Quản lý bí mật](/vi/gateway/secrets)).
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu. Hỗ trợ giá trị văn bản rõ và SecretRef.
- `deviceId`: ID thiết bị Matrix rõ ràng.
- `deviceName`: tên hiển thị của thiết bị được dùng tại thời điểm đăng nhập bằng mật khẩu.
- `avatarUrl`: URL ảnh đại diện tự thân đã lưu để đồng bộ hồ sơ và cập nhật `profile set`.
- `initialSyncLimit`: số sự kiện tối đa được lấy trong quá trình đồng bộ khởi động.

### Mã hóa

- `encryption`: bật E2EE. Mặc định: `false`.
- `startupVerification`: `"if-unverified"` (mặc định khi E2EE bật) hoặc `"off"`. Tự động yêu cầu tự xác minh lúc khởi động khi thiết bị này chưa được xác minh.
- `startupVerificationCooldownHours`: thời gian chờ trước yêu cầu khởi động tự động tiếp theo. Mặc định: `24`.

### Truy cập và chính sách

- `groupPolicy`: `"open"`, `"allowlist"`, hoặc `"disabled"`. Mặc định: `"allowlist"`.
- `groupAllowFrom`: allowlist ID người dùng cho lưu lượng phòng.
- `dm.enabled`: khi là `false`, bỏ qua tất cả DM. Mặc định: `true`.
- `dm.policy`: `"pairing"` (mặc định), `"allowlist"`, `"open"`, hoặc `"disabled"`. Áp dụng sau khi bot đã tham gia và phân loại phòng là DM; không ảnh hưởng đến xử lý lời mời.
- `dm.allowFrom`: allowlist ID người dùng cho lưu lượng DM.
- `dm.sessionScope`: `"per-user"` (mặc định) hoặc `"per-room"`.
- `dm.threadReplies`: ghi đè chỉ dành cho DM đối với phân luồng trả lời (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: chấp nhận tin nhắn từ các tài khoản bot Matrix khác đã cấu hình (`true` hoặc `"mentions"`).
- `allowlistOnly`: khi là `true`, buộc tất cả chính sách DM đang hoạt động (ngoại trừ `"disabled"`) và các chính sách nhóm `"open"` thành `"allowlist"`. Không thay đổi các chính sách `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"`, hoặc `"off"`. Mặc định: `"off"`. Áp dụng cho mọi lời mời Matrix, bao gồm cả lời mời kiểu DM.
- `autoJoinAllowlist`: phòng/bí danh được cho phép khi `autoJoin` là `"allowlist"`. Các mục bí danh được phân giải theo homeserver, không theo trạng thái do phòng được mời khai báo.
- `contextVisibility`: khả năng hiển thị ngữ cảnh bổ sung (`"all"` mặc định, `"allowlist"`, `"allowlist_quote"`).

### Hành vi trả lời

- `replyToMode`: `"off"`, `"first"`, `"all"`, hoặc `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, hoặc `"always"`.
- `threadBindings`: ghi đè theo kênh cho định tuyến phiên gắn với luồng và vòng đời.
- `streaming`: `"off"` (mặc định), `"partial"`, `"quiet"`, hoặc dạng đối tượng `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: khi là `true`, các khối assistant đã hoàn tất được giữ dưới dạng các tin nhắn tiến độ riêng biệt.
- `markdown`: cấu hình kết xuất Markdown tùy chọn cho văn bản gửi đi.
- `responsePrefix`: chuỗi tùy chọn được thêm vào đầu các câu trả lời gửi đi.
- `textChunkLimit`: kích thước đoạn gửi đi tính bằng ký tự khi `chunkMode: "length"`. Mặc định: `4000`.
- `chunkMode`: `"length"` (mặc định, tách theo số ký tự) hoặc `"newline"` (tách tại ranh giới dòng).
- `historyLimit`: số tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng kích hoạt agent. Dự phòng về `messages.groupChat.historyLimit`; mặc định hiệu lực là `0` (tắt).
- `mediaMaxMb`: giới hạn kích thước media tính bằng MB cho gửi đi và xử lý gửi đến.

### Thiết lập phản ứng

- `ackReaction`: ghi đè phản ứng xác nhận cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi (`"group-mentions"` mặc định, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: chế độ thông báo phản ứng gửi đến (`"own"` mặc định, `"off"`).

### Công cụ và ghi đè theo phòng

- `actions`: kiểm soát công cụ theo từng hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: ánh xạ chính sách theo từng phòng. Danh tính phiên dùng ID phòng ổn định sau khi phân giải. (`rooms` là bí danh cũ.)
  - `groups.<room>.account`: giới hạn một mục phòng kế thừa vào một tài khoản cụ thể.
  - `groups.<room>.allowBots`: ghi đè theo phòng cho thiết lập cấp kênh (`true` hoặc `"mentions"`).
  - `groups.<room>.users`: allowlist người gửi theo phòng.
  - `groups.<room>.tools`: ghi đè cho phép/từ chối công cụ theo phòng.
  - `groups.<room>.autoReply`: ghi đè theo phòng cho kiểm soát theo lượt nhắc. `true` tắt yêu cầu nhắc tên cho phòng đó; `false` buộc bật lại.
  - `groups.<room>.skills`: bộ lọc skill theo phòng.
  - `groups.<room>.systemPrompt`: đoạn system prompt theo phòng.

### Thiết lập phê duyệt exec

- `execApprovals.enabled`: gửi phê duyệt exec qua prompt gốc của Matrix.
- `execApprovals.approvers`: ID người dùng Matrix được phép phê duyệt. Dự phòng về `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (mặc định), `"channel"`, hoặc `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist agent/phiên tùy chọn cho việc gửi.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát theo lượt nhắc
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
