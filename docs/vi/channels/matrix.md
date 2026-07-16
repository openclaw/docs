---
read_when:
    - Thiết lập Matrix trong OpenClaw
    - Cấu hình E2EE và xác minh cho Matrix
summary: Trạng thái hỗ trợ, thiết lập và ví dụ cấu hình Matrix
title: Matrix
x-i18n:
    generated_at: "2026-07-16T14:03:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix là một Plugin kênh có thể tải xuống (`@openclaw/matrix`), được xây dựng trên `matrix-js-sdk` chính thức. Plugin hỗ trợ tin nhắn trực tiếp, phòng, luồng, phương tiện, phản ứng, cuộc thăm dò ý kiến, vị trí và E2EE.

## Cài đặt

```bash
openclaw plugins install @openclaw/matrix
```

Các đặc tả Plugin thuần sẽ thử ClawHub trước, sau đó dự phòng sang npm. Buộc dùng một nguồn bằng `openclaw plugins install clawhub:@openclaw/matrix` hoặc `npm:@openclaw/matrix`. Từ một bản checkout cục bộ: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` đăng ký và bật Plugin; không cần bước `enable` riêng. Kênh vẫn chưa hoạt động cho đến khi được cấu hình bên dưới. Xem [Plugin](/vi/tools/plugin) để biết các quy tắc cài đặt chung.

## Thiết lập

1. Tạo tài khoản Matrix trên homeserver của bạn.
2. Cấu hình `channels.matrix` bằng `homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`.
3. Khởi động lại Gateway.
4. Bắt đầu một cuộc trò chuyện trực tiếp với bot hoặc mời bot vào một phòng. Lời mời mới chỉ được chấp nhận khi [`autoJoin`](#auto-join) cho phép.

### Thiết lập tương tác

```bash
openclaw channels add
openclaw configure --section channels
```

Trình hướng dẫn yêu cầu URL homeserver, phương thức xác thực (token hoặc mật khẩu), ID người dùng (chỉ đối với xác thực bằng mật khẩu), tên thiết bị tùy chọn, có bật E2EE hay không, cũng như quyền truy cập phòng/tự động tham gia. Nếu các biến môi trường `MATRIX_*` tương ứng đã tồn tại và tài khoản chưa lưu thông tin xác thực, trình hướng dẫn sẽ đề xuất lối tắt dùng biến môi trường. Phân giải tên phòng trước khi lưu danh sách cho phép bằng `openclaw channels resolve --channel matrix "Project Room"`. Việc bật E2EE trong trình hướng dẫn sẽ chạy cùng quy trình khởi tạo như [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` mặc định là `"off"`: bot sẽ không xuất hiện trong các phòng hoặc cuộc trò chuyện trực tiếp mới từ lời mời mới cho đến khi bạn tham gia thủ công. OpenClaw không thể xác định tại thời điểm nhận lời mời liệu đó là cuộc trò chuyện trực tiếp hay nhóm, vì vậy mọi lời mời trước tiên đều đi qua `autoJoin`; `dm.policy` chỉ áp dụng sau đó, khi bot đã tham gia và phòng đã được phân loại.

<Warning>
Đặt `autoJoin: "allowlist"` cùng `autoJoinAllowlist` để giới hạn các lời mời được chấp nhận, hoặc `autoJoin: "always"` để chấp nhận mọi lời mời.

`autoJoinAllowlist` chỉ chấp nhận `!roomId:server`, `#alias:server` hoặc `*`. Tên phòng thuần bị từ chối; bí danh được phân giải dựa trên homeserver, không dựa trên trạng thái mà phòng gửi lời mời tự khai báo.
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

### Định dạng đích của danh sách cho phép

- Tin nhắn trực tiếp (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): dùng `@user:server`. Tên hiển thị mặc định bị bỏ qua (có thể thay đổi); chỉ đặt `dangerouslyAllowNameMatching: true` để tương thích rõ ràng với tên hiển thị.
- Khóa danh sách cho phép của phòng (`groups`, bí danh cũ `rooms`): dùng `!room:server` hoặc `#alias:server`. Tên thuần bị bỏ qua trừ khi `dangerouslyAllowNameMatching: true`.
- Danh sách cho phép lời mời (`autoJoinAllowlist`): dùng `!room:server`, `#alias:server` hoặc `*`. Tên thuần luôn bị từ chối.

### Chuẩn hóa ID tài khoản

Trình hướng dẫn chuyển đổi tên thân thiện thành ID tài khoản đã chuẩn hóa (`Ops Bot` -> `ops-bot`). Dấu câu được thoát dạng hex trong tên biến môi trường có phạm vi để các tài khoản không thể xung đột: `-` (0x2D) trở thành `_X2D_`, vì vậy `ops-prod` ánh xạ tới tiền tố biến môi trường `MATRIX_OPS_X2D_PROD_`.

### Thông tin xác thực được lưu vào bộ nhớ đệm

Matrix lưu thông tin xác thực vào bộ nhớ đệm trong `~/.openclaw/credentials/matrix/`: `credentials.json` cho tài khoản mặc định, `credentials-<account>.json` cho tài khoản được đặt tên. Khi tồn tại thông tin xác thực được lưu vào bộ nhớ đệm, OpenClaw coi Matrix là đã được cấu hình ngay cả khi không có `accessToken` trong tệp cấu hình — điều này áp dụng cho quá trình thiết lập, `openclaw doctor` và các phép kiểm tra trạng thái kênh.

### Biến môi trường

Các biến môi trường dựa trên khóa cấu hình được dùng khi khóa cấu hình tương ứng chưa được đặt. Tài khoản mặc định dùng tên không có tiền tố; tài khoản được đặt tên chèn token tài khoản trước hậu tố (xem phần [chuẩn hóa](#account-id-normalization)).

| Tài khoản mặc định       | Tài khoản được đặt tên (`<ID>` = token tài khoản) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Đối với tài khoản `ops`, các tên trở thành `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, v.v. Không thể đặt `MATRIX_HOMESERVER` (và mọi biến thể `*_HOMESERVER` có phạm vi) từ `.env` của không gian làm việc; xem [Tệp `.env` của không gian làm việc](/vi/gateway/security).

<Note>
Khóa khôi phục không phải là biến môi trường dựa trên cấu hình: OpenClaw không bao giờ tự đọc khóa này từ môi trường. Văn bản hướng dẫn của CLI đề xuất truyền khóa qua pipe bằng một biến shell có tên `MATRIX_RECOVERY_KEY` cho tài khoản mặc định, hoặc `MATRIX_RECOVERY_KEY_<ID>` (ID tài khoản viết hoa đơn thuần, không thoát dạng hex) cho tài khoản được đặt tên — xem [Xác minh thiết bị này bằng khóa khôi phục](#verify-this-device-with-a-recovery-key).
</Note>

## Ví dụ cấu hình

Cấu hình cơ sở thực tế với ghép cặp tin nhắn trực tiếp, danh sách cho phép của phòng và E2EE:

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
      streaming: { mode: "partial" },
    },
  },
}
```

## Bản xem trước luồng

Tính năng truyền luồng phản hồi Matrix là tùy chọn chủ động. `streaming.mode` kiểm soát cách OpenClaw phân phối phản hồi đang được tạo của trợ lý; `streaming.block.enabled` kiểm soát việc mỗi khối đã hoàn tất có được giữ lại dưới dạng một tin nhắn Matrix riêng hay không.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

Để giữ bản xem trước câu trả lời trực tiếp nhưng ẩn các dòng công cụ/tiến trình tạm thời:

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

Cấu hình đầy đủ chấp nhận `{ mode, chunkMode, block, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // chọn từ các nhãn đã cấu hình hoặc tích hợp sẵn (false để ẩn)
          labels: ["Thinking", "Writing", "Searching"], // các ứng viên cho label: "auto"
          maxLines: 8, // số dòng tiến trình cuộn tối đa (mặc định: 8)
          maxLineChars: 120, // số ký tự tối đa mỗi dòng trước khi cắt ngắn (mặc định: 120)
          toolProgress: true, // hiển thị hoạt động công cụ/tiến trình (mặc định: true)
        },
      },
    },
  },
}
```

- `progress.label`: nhãn tùy chỉnh, `"auto"`/không đặt để chọn một nhãn đã cấu hình hoặc tích hợp sẵn, hoặc `false` để ẩn nhãn.
- `progress.labels`: các ứng viên chỉ được dùng khi `label` là `"auto"` hoặc chưa được đặt.
- `progress.maxLines`: số dòng tiến trình cuộn tối đa được giữ trong bản nháp; các dòng cũ hơn sẽ bị cắt bỏ khi vượt quá giới hạn này.
- `progress.maxLineChars`: số ký tự tối đa trên mỗi dòng tiến trình thu gọn trước khi cắt ngắn.
- `progress.toolProgress`: khi là `true` (mặc định), hoạt động công cụ/tiến trình trực tiếp xuất hiện trong bản nháp.

| `streaming.mode`  | Hành vi                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (mặc định) | Chờ toàn bộ phản hồi rồi gửi một lần.                                                                                                                      |
| `"partial"`       | Chỉnh sửa tại chỗ một tin nhắn văn bản thông thường khi mô hình viết khối hiện tại. Các ứng dụng khách tiêu chuẩn có thể thông báo khi có bản xem trước đầu tiên, thay vì lần chỉnh sửa cuối cùng.          |
| `"quiet"`         | Giống `"partial"` nhưng tin nhắn là một thông báo không kích hoạt thông báo cho người dùng. Người nhận được thông báo khi quy tắc đẩy theo người dùng khớp với lần chỉnh sửa hoàn tất (xem bên dưới). |
| `"progress"`      | Gửi từng dòng tiến trình thu gọn bằng bản nháp tiến trình.                                                                                          |

`streaming.block.enabled` (mặc định `false`) độc lập với `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (mặc định)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Bản nháp trực tiếp cho khối hiện tại, các khối đã hoàn tất được giữ lại dưới dạng tin nhắn | Bản nháp trực tiếp cho khối hiện tại, được hoàn tất tại chỗ |
| `"off"`                 | Một tin nhắn Matrix có thông báo cho mỗi khối đã hoàn tất                     | Một tin nhắn Matrix có thông báo cho toàn bộ phản hồi      |

Lưu ý:

- Nếu bản xem trước vượt quá giới hạn kích thước mỗi sự kiện của Matrix, OpenClaw sẽ dừng truyền luồng bản xem trước và chuyển sang chỉ phân phối kết quả cuối cùng.
- Phản hồi có phương tiện luôn gửi tệp đính kèm theo cách thông thường; nếu không thể tái sử dụng an toàn một bản xem trước cũ, OpenClaw sẽ biên tập ẩn bản xem trước đó trước khi gửi phản hồi phương tiện cuối cùng.
- Các bản cập nhật xem trước tiến trình công cụ được bật theo mặc định khi truyền luồng bản xem trước đang hoạt động. Đặt `streaming.preview.toolProgress: false` để giữ các lần chỉnh sửa bản xem trước cho văn bản câu trả lời nhưng để tiến trình công cụ đi theo đường phân phối thông thường.
- Các lần chỉnh sửa bản xem trước làm phát sinh thêm lệnh gọi API Matrix. Giữ nguyên `streaming.mode: "off"` để có cấu hình giới hạn tốc độ thận trọng nhất.
- Các giá trị vô hướng/boolean `streaming` cũ và các khóa phẳng `blockStreaming` / `chunkMode` được `openclaw doctor --fix` viết lại thành cấu trúc lồng nhau này.

## Tin nhắn thoại

Ghi chú thoại Matrix gửi đến được phiên âm trước cổng kiểm tra lượt đề cập trong phòng, vì vậy một ghi chú thoại nói tên bot có thể kích hoạt tác nhân trong phòng `requireMention: true`, và tác nhân nhận được bản phiên âm thay vì chỉ một phần giữ chỗ cho tệp âm thanh đính kèm.

Matrix sử dụng nhà cung cấp phương tiện âm thanh dùng chung trong `tools.media.audio`, chẳng hạn như OpenAI `gpt-4o-mini-transcribe`. Xem [Tổng quan về công cụ phương tiện](/vi/tools/media-overview) để biết cách thiết lập nhà cung cấp và các giới hạn.

- Các sự kiện `m.audio` và sự kiện `m.file` có loại MIME `audio/*` đều đủ điều kiện.
- Trong các phòng được mã hóa, OpenClaw giải mã tệp đính kèm qua đường dẫn phương tiện Matrix hiện có trước khi phiên âm.
- Bản phiên âm được đánh dấu là do máy tạo và không đáng tin cậy trong lời nhắc của tác nhân.
- Tệp đính kèm được đánh dấu là đã phiên âm để các công cụ phương tiện phía sau không phiên âm lại.
- Đặt `tools.media.audio.enabled: false` để tắt tính năng phiên âm thanh trên toàn cục.

## Siêu dữ liệu phê duyệt

Lời nhắc phê duyệt gốc của Matrix là các sự kiện `m.room.message` thông thường với nội dung dành riêng cho OpenClaw dưới khóa `com.openclaw.approval`. Các ứng dụng khách tiêu chuẩn vẫn hiển thị phần nội dung văn bản; các ứng dụng khách hỗ trợ OpenClaw có thể đọc mã định danh phê duyệt, loại, trạng thái, quyết định và chi tiết thực thi/Plugin có cấu trúc.

Khi lời nhắc quá dài đối với một sự kiện Matrix, OpenClaw chia văn bản hiển thị thành nhiều phần và chỉ đính kèm `com.openclaw.approval` vào phần đầu tiên. Các phản ứng cho phép/từ chối liên kết với sự kiện đầu tiên đó, vì vậy lời nhắc dài vẫn giữ cùng một mục tiêu phê duyệt như lời nhắc chỉ có một sự kiện.

### Quy tắc đẩy tự lưu trữ cho bản xem trước hoàn tất không gây thông báo

`streaming.mode: "quiet"` chỉ thông báo cho người nhận một lần khi một khối hoặc lượt đã hoàn tất — quy tắc đẩy riêng cho từng người dùng phải khớp với dấu hiệu bản xem trước hoàn tất. Xem [Quy tắc đẩy Matrix cho bản xem trước không gây thông báo](/vi/channels/matrix-push-rules) để biết công thức đầy đủ.

## Phòng giữa các bot

Theo mặc định, các tin nhắn Matrix từ những tài khoản Matrix OpenClaw khác đã được cấu hình sẽ bị bỏ qua. Sử dụng `allowBots` để chủ động cho phép lưu lượng giữa các tác nhân:

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

- `allowBots: true` chấp nhận tin nhắn từ các tài khoản bot Matrix đã cấu hình khác trong các phòng và tin nhắn trực tiếp được cho phép.
- `allowBots: "mentions"` chỉ chấp nhận các tin nhắn đó khi chúng đề cập rõ ràng đến bot này trong phòng; tin nhắn trực tiếp vẫn luôn được cho phép.
- `groups.<room>.allowBots` ghi đè cài đặt cấp tài khoản cho một phòng.
- Tin nhắn được chấp nhận từ bot đã cấu hình sử dụng [cơ chế bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung. Cấu hình `channels.defaults.botLoopProtection`, sau đó ghi đè theo từng tài khoản bằng `channels.matrix.botLoopProtection` hoặc theo từng phòng bằng `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng một mã định danh người dùng Matrix để tránh vòng lặp tự phản hồi.
- Matrix không có cờ bot gốc; OpenClaw coi “do bot soạn” là “được gửi bởi một tài khoản Matrix đã cấu hình khác trên Gateway OpenClaw này”.

Hãy sử dụng danh sách phòng được phép nghiêm ngặt và yêu cầu đề cập khi bật lưu lượng giữa các bot trong phòng dùng chung.

## Mã hóa và xác minh

Trong các phòng được mã hóa (E2EE), sự kiện hình ảnh gửi đi sử dụng `thumbnail_file` để bản xem trước hình ảnh được mã hóa cùng với toàn bộ tệp đính kèm; các phòng không mã hóa sử dụng `thumbnail_url` thuần túy. Không cần cấu hình — Plugin tự động phát hiện trạng thái E2EE.

Tất cả lệnh `openclaw matrix` đều chấp nhận `--verbose` (chẩn đoán đầy đủ), `--json` (đầu ra máy có thể đọc) và `--account <id>` (thiết lập nhiều tài khoản). Theo mặc định, đầu ra được trình bày ngắn gọn.

### Bật mã hóa

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Khởi tạo kho lưu trữ bí mật và ký chéo, tạo bản sao lưu khóa phòng nếu cần, sau đó in trạng thái và các bước tiếp theo. Các cờ hữu ích:

- `--recovery-key-stdin` đọc khóa khôi phục từ stdin mà không để lộ khóa trong đối số tiến trình; `--recovery-key <key>` vẫn khả dụng để bảo đảm khả năng tương thích
- `--force-reset-cross-signing` loại bỏ danh tính ký chéo hiện tại và tạo danh tính mới (chỉ sử dụng có chủ đích)

Đối với tài khoản mới, hãy bật E2EE khi tạo:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` là bí danh của `--enable-e2ee`. Cấu hình thủ công tương đương:

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

- `Locally trusted`: chỉ được ứng dụng khách này tin cậy
- `Cross-signing verified`: SDK báo cáo xác minh thông qua ký chéo
- `Signed by owner`: được ký bằng khóa tự ký của chính bạn (chỉ dùng để chẩn đoán)

`Verified by owner` chỉ là `yes` khi `Cross-signing verified` là `yes`; chỉ riêng sự tin cậy cục bộ hoặc chữ ký của chủ sở hữu là chưa đủ.

`--allow-degraded-local-state` trả về chẩn đoán theo nỗ lực tối đa mà không cần chuẩn bị tài khoản Matrix trước; hữu ích cho các phép thăm dò ngoại tuyến hoặc được cấu hình một phần.

### Xác minh thiết bị này bằng khóa khôi phục

Truyền khóa khôi phục qua stdin thay vì chuyển khóa trên dòng lệnh:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Lệnh báo cáo ba trạng thái:

- `Recovery key accepted`: Matrix đã chấp nhận khóa cho kho lưu trữ bí mật hoặc sự tin cậy thiết bị.
- `Backup usable`: có thể tải bản sao lưu khóa phòng bằng dữ liệu khôi phục đáng tin cậy.
- `Device verified by owner`: thiết bị này có đầy đủ sự tin cậy đối với danh tính ký chéo Matrix.

Lệnh thoát với mã khác 0 khi sự tin cậy đầy đủ đối với danh tính chưa hoàn tất, ngay cả khi khóa khôi phục đã mở khóa dữ liệu sao lưu. Trong trường hợp đó, hãy hoàn tất quá trình tự xác minh từ một ứng dụng khách Matrix khác:

```bash
openclaw matrix verify self
```

`verify self` chờ `Cross-signing verified: yes` trước khi thoát thành công. Sử dụng `--timeout-ms <ms>` để điều chỉnh thời gian chờ.

Dạng khóa trực tiếp `openclaw matrix verify device "<recovery-key>"` cũng hoạt động, nhưng khóa sẽ xuất hiện trong lịch sử shell.

### Khởi tạo hoặc sửa chữa ký chéo

```bash
openclaw matrix verify bootstrap
```

Lệnh sửa chữa/thiết lập dành cho các tài khoản được mã hóa. Theo thứ tự, lệnh này:

- khởi tạo kho lưu trữ bí mật, sử dụng lại khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa công khai còn thiếu
- đánh dấu và ký chéo thiết bị hiện tại
- tạo bản sao lưu khóa phòng phía máy chủ nếu chưa có

Nếu máy chủ gia đình yêu cầu UIA để tải khóa ký chéo lên, OpenClaw trước tiên thử không xác thực, sau đó thử `m.login.dummy`, rồi `m.login.password` (yêu cầu `channels.matrix.password`).

Các cờ hữu ích:

- `--recovery-key-stdin` (kết hợp với `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) hoặc `--recovery-key <key>`
- `--force-reset-cross-signing` để loại bỏ danh tính ký chéo hiện tại (chỉ sử dụng có chủ đích; yêu cầu khóa khôi phục đang hoạt động được lưu trữ hoặc cung cấp bằng `--recovery-key-stdin`)

### Bản sao lưu khóa phòng

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` cho biết liệu có bản sao lưu phía máy chủ hay không và thiết bị này có thể giải mã bản sao lưu đó hay không. `backup restore` nhập các khóa phòng đã sao lưu vào kho mật mã cục bộ; bỏ qua `--recovery-key-stdin` nếu khóa khôi phục đã có trên đĩa.

Để thay thế bản sao lưu bị hỏng bằng một đường cơ sở mới (chấp nhận mất lịch sử cũ không thể khôi phục; cũng có thể tạo lại kho lưu trữ bí mật nếu không thể tải bí mật của bản sao lưu hiện tại):

```bash
openclaw matrix verify backup reset --yes
```

Chỉ thêm `--rotate-recovery-key` khi khóa khôi phục trước đó cần được chủ động vô hiệu hóa khả năng mở khóa đường cơ sở sao lưu mới.

### Liệt kê, yêu cầu và phản hồi xác minh

```bash
openclaw matrix verify list
```

Liệt kê các yêu cầu xác minh đang chờ xử lý cho tài khoản đã chọn.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Gửi yêu cầu xác minh từ tài khoản này. `--own-user` yêu cầu tự xác minh (chấp nhận lời nhắc trong một ứng dụng khách Matrix khác của cùng người dùng); `--user-id`/`--device-id`/`--room-id` nhắm đến người khác. `--own-user` không thể kết hợp với các cờ nhắm mục tiêu khác.

Để xử lý vòng đời ở mức thấp hơn — thường là khi theo dõi song song các yêu cầu đến từ một ứng dụng khách khác — các lệnh này thao tác trên một yêu cầu cụ thể `<id>` (được in bởi `verify list` và `verify request`):

| Lệnh                                       | Mục đích                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Chấp nhận một yêu cầu đến                                           |
| `openclaw matrix verify start <id>`        | Bắt đầu luồng SAS                                                   |
| `openclaw matrix verify sas <id>`          | In biểu tượng cảm xúc hoặc số thập phân SAS                         |
| `openclaw matrix verify confirm-sas <id>`  | Xác nhận rằng SAS khớp với nội dung ứng dụng khách kia hiển thị      |
| `openclaw matrix verify mismatch-sas <id>` | Từ chối SAS khi biểu tượng cảm xúc hoặc số thập phân không khớp      |
| `openclaw matrix verify cancel <id>`       | Hủy; nhận `--reason <text>` và `--code <matrix-code>` tùy chọn |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` và `cancel` đều chấp nhận `--user-id` và `--room-id` làm gợi ý theo dõi qua tin nhắn trực tiếp khi quá trình xác minh được liên kết với một phòng tin nhắn trực tiếp cụ thể.

### Lưu ý về nhiều tài khoản

Nếu không có `--account <id>`, các lệnh CLI Matrix sử dụng tài khoản mặc định ngầm định. Khi có nhiều tài khoản được đặt tên nhưng không có `channels.matrix.defaultAccount`, các lệnh sẽ không tự suy đoán và yêu cầu bạn lựa chọn. Khi E2EE bị tắt hoặc không khả dụng cho một tài khoản được đặt tên, lỗi sẽ trỏ đến khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Hành vi khi khởi động">
    Với `encryption: true`, `startupVerification` mặc định là `"if-unverified"`. Khi khởi động, thiết bị chưa được xác minh yêu cầu tự xác minh trong một ứng dụng khách Matrix khác, bỏ qua các yêu cầu trùng lặp và áp dụng thời gian chờ (mặc định là 24 giờ). Điều chỉnh bằng `startupVerificationCooldownHours` hoặc tắt bằng `startupVerification: "off"`.

    Quá trình khởi động cũng chạy một lượt khởi tạo mật mã thận trọng, sử dụng lại kho lưu trữ bí mật và danh tính ký chéo hiện tại. Nếu trạng thái khởi tạo bị hỏng, OpenClaw sẽ thử sửa chữa có kiểm soát ngay cả khi không có `channels.matrix.password`; nếu máy chủ gia đình yêu cầu UIA bằng mật khẩu, quá trình khởi động sẽ ghi cảnh báo và tiếp tục mà không gây lỗi nghiêm trọng. Các thiết bị đã được chủ sở hữu ký vẫn được giữ nguyên.

    Xem [Di chuyển Matrix](/vi/channels/matrix-migration) để biết toàn bộ quy trình nâng cấp.

  </Accordion>

  <Accordion title="Thông báo xác minh">
    Matrix đăng các thông báo về vòng đời xác minh vào phòng xác minh tin nhắn trực tiếp nghiêm ngặt dưới dạng tin nhắn `m.notice`: yêu cầu, sẵn sàng (kèm hướng dẫn “Verify by emoji”), bắt đầu/hoàn tất và chi tiết SAS (biểu tượng cảm xúc/số thập phân) khi có.

    Các yêu cầu đến từ một ứng dụng khách Matrix khác được theo dõi và tự động chấp nhận. Đối với tự xác minh, OpenClaw tự động bắt đầu luồng SAS và xác nhận phía của mình khi tính năng xác minh bằng biểu tượng cảm xúc khả dụng — bạn vẫn cần so sánh và xác nhận “They match” trong ứng dụng khách Matrix của mình.

    Thông báo hệ thống xác minh không được chuyển tiếp đến quy trình trò chuyện của tác nhân.

  </Accordion>

  <Accordion title="Thiết bị Matrix đã bị xóa hoặc không hợp lệ">
    Nếu `verify status` cho biết thiết bị hiện tại không còn được liệt kê trên máy chủ gia đình, hãy tạo một thiết bị Matrix OpenClaw mới. Đối với đăng nhập bằng mật khẩu:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Đối với xác thực bằng token, hãy tạo một token truy cập mới trong ứng dụng khách Matrix hoặc giao diện quản trị, sau đó cập nhật OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Thay `assistant` bằng ID tài khoản từ lệnh bị lỗi, hoặc bỏ qua `--account` để dùng tài khoản mặc định.

  </Accordion>

  <Accordion title="Quản lý thiết bị">
    Các thiết bị cũ do OpenClaw quản lý có thể tích tụ. Liệt kê và dọn dẹp:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kho mã hóa">
    E2EE của Matrix sử dụng đường dẫn mã hóa Rust chính thức `matrix-js-sdk` với `fake-indexeddb` làm lớp đệm IndexedDB. Trạng thái mã hóa được lưu bền vững tại `crypto-idb-snapshot.json` (quyền truy cập tệp hạn chế).

    Trạng thái thời gian chạy đã mã hóa nằm trong `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` và bao gồm kho đồng bộ, kho mã hóa, khóa khôi phục, ảnh chụp nhanh IDB, liên kết luồng và trạng thái xác minh khi khởi động. Khi token thay đổi nhưng danh tính tài khoản vẫn giữ nguyên, OpenClaw tái sử dụng thư mục gốc hiện có phù hợp nhất để trạng thái trước đó vẫn hiển thị.

    Một thư mục gốc băm theo token cũ duy nhất có thể là đường dẫn duy trì tính liên tục khi xoay vòng token bình thường. Nếu OpenClaw ghi nhật ký `matrix: multiple populated token-hash storage roots detected`, hãy kiểm tra thư mục tài khoản và chỉ lưu trữ các thư mục gốc ngang hàng đã cũ sau khi xác nhận thư mục gốc đang hoạt động được chọn vẫn ổn định. Nên chuyển các thư mục gốc đã cũ vào thư mục `_archive/` thay vì xóa ngay lập tức.

  </Accordion>
</AccordionGroup>

## Quản lý hồ sơ

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Truyền cả hai tùy chọn trong một lần gọi. Matrix chấp nhận trực tiếp URL ảnh đại diện `mxc://`; việc truyền `http://`/`https://` sẽ tải tệp lên trước rồi lưu URL `mxc://` đã phân giải vào `channels.matrix.avatarUrl` (hoặc giá trị ghi đè theo từng tài khoản).

## Luồng

Matrix hỗ trợ luồng gốc cho cả phản hồi tự động và thao tác gửi bằng công cụ tin nhắn. Hai nút điều khiển độc lập chi phối hành vi:

### Định tuyến phiên (`sessionScope`)

`dm.sessionScope` quyết định cách các phòng DM Matrix ánh xạ tới các phiên OpenClaw:

- `"per-user"` (mặc định): tất cả phòng DM có cùng đối tượng ngang hàng được định tuyến sẽ dùng chung một phiên.
- `"per-room"`: mỗi phòng DM Matrix có khóa phiên riêng, ngay cả khi có cùng đối tượng ngang hàng.

Các liên kết cuộc trò chuyện tường minh luôn được ưu tiên hơn `sessionScope`; các phòng và luồng đã liên kết giữ nguyên phiên đích đã chọn.

### Phản hồi theo luồng (`threadReplies`)

`threadReplies` quyết định nơi bot đăng phản hồi:

- `"off"`: phản hồi ở cấp cao nhất. Tin nhắn đến trong luồng vẫn thuộc phiên cha.
- `"inbound"`: chỉ phản hồi trong luồng khi tin nhắn đến đã nằm trong luồng đó.
- `"always"`: phản hồi trong một luồng bắt nguồn từ tin nhắn kích hoạt; từ lần kích hoạt đầu tiên trở đi, cuộc trò chuyện đó được định tuyến qua một phiên có phạm vi luồng tương ứng.

`dm.threadReplies` ghi đè cài đặt này chỉ cho DM — ví dụ: giữ các luồng phòng tách biệt trong khi giữ DM ở dạng phẳng.

### Kế thừa luồng và lệnh dấu gạch chéo

- Tin nhắn đến trong luồng bao gồm tin nhắn gốc của luồng làm ngữ cảnh bổ sung cho agent.
- Các lượt gửi bằng công cụ tin nhắn tự động kế thừa luồng Matrix hiện tại khi nhắm đến cùng phòng (hoặc cùng đích người dùng DM), trừ khi cung cấp `threadId` tường minh.
- Việc tái sử dụng đích người dùng DM chỉ có hiệu lực khi siêu dữ liệu phiên hiện tại chứng minh đó là cùng đối tượng ngang hàng DM trên cùng tài khoản Matrix; nếu không, OpenClaw quay về định tuyến theo phạm vi người dùng thông thường.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` và `/acp spawn` liên kết với luồng đều hoạt động trong phòng Matrix và DM.
- `/focus` cấp cao nhất tạo một luồng Matrix mới và liên kết luồng đó với phiên đích khi `threadBindings.spawnSessions` được bật.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có sẽ liên kết trực tiếp luồng đó tại chỗ.

Khi OpenClaw phát hiện một phòng DM Matrix xung đột với một phòng DM khác trên cùng phiên dùng chung, nó đăng một lần thông báo `m.notice` trỏ đến lối thoát `/focus` và đề xuất thay đổi `dm.sessionScope`. Thông báo chỉ xuất hiện khi tính năng liên kết luồng được bật.

## Liên kết cuộc trò chuyện ACP

Các phòng, DM và luồng Matrix hiện có có thể trở thành không gian làm việc ACP bền vững mà không thay đổi giao diện trò chuyện.

Quy trình nhanh cho người vận hành:

- Chạy `/acp spawn codex --bind here` bên trong DM, phòng hoặc luồng Matrix hiện có để tiếp tục sử dụng.
- Trong DM hoặc phòng cấp cao nhất, DM/phòng hiện tại vẫn là giao diện trò chuyện và các tin nhắn sau đó được định tuyến đến phiên ACP đã tạo.
- Bên trong một luồng hiện có, `--bind here` liên kết trực tiếp luồng hiện tại tại chỗ.
- `/new` và `/reset` đặt lại tại chỗ cùng phiên ACP đã liên kết.
- `/acp close` đóng phiên ACP và xóa liên kết.

`--bind here` không tạo luồng Matrix con. `threadBindings.spawnSessions` kiểm soát `/acp spawn --thread auto|here`, nơi OpenClaw cần tạo hoặc liên kết một luồng con.

### Cấu hình liên kết luồng

Matrix kế thừa các giá trị mặc định toàn cục từ `session.threadBindings` và hỗ trợ giá trị ghi đè theo từng kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: kiểm soát cả việc tạo luồng subagent và ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: các giá trị ghi đè hẹp hơn chỉ dành cho việc tạo luồng subagent hoặc chỉ dành cho ACP.
- `threadBindings.defaultSpawnContext`

Tính năng tạo phiên liên kết với luồng Matrix được bật theo mặc định. Đặt `threadBindings.spawnSessions: false` để ngăn `/focus` và `/acp spawn --thread auto|here` cấp cao nhất tạo/liên kết các luồng Matrix. Đặt `threadBindings.defaultSpawnContext: "isolated"` khi việc tạo luồng subagent gốc không được phân nhánh bản chép lời của phiên cha.

## Phản ứng

Matrix hỗ trợ phản ứng gửi đi, thông báo phản ứng đến và phản ứng xác nhận.

Công cụ phản ứng gửi đi được kiểm soát bởi `channels.matrix.actions.reactions`:

- `react` thêm phản ứng vào một sự kiện Matrix.
- `reactions` liệt kê phần tổng hợp phản ứng hiện tại cho một sự kiện Matrix.
- `emoji=""` xóa các phản ứng của chính bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji được chỉ định của bot.

**Thứ tự phân giải** (giá trị được xác định đầu tiên sẽ được dùng):

| Cài đặt                 | Thứ tự                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | theo tài khoản -> kênh -> `messages.ackReaction` -> phương án dự phòng là emoji danh tính agent   |
| `ackReactionScope`      | theo tài khoản -> kênh -> `messages.ackReactionScope` -> mặc định `"group-mentions"` |
| `reactionNotifications` | theo tài khoản -> kênh -> mặc định `"own"`                                           |

`reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` đã thêm khi chúng nhắm đến tin nhắn Matrix do bot tạo; `"off"` vô hiệu hóa các sự kiện hệ thống về phản ứng. Việc xóa phản ứng không được tổng hợp thành sự kiện hệ thống — Matrix thể hiện chúng dưới dạng biên tập xóa, không phải các lượt xóa `m.reaction` độc lập.

## Ngữ cảnh lịch sử

- `channels.matrix.historyLimit` kiểm soát số lượng tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng kích hoạt agent. Dùng dự phòng `messages.groupChat.historyLimit`; giá trị mặc định có hiệu lực là `0` nếu cả hai đều chưa được đặt (bị vô hiệu hóa).
- Lịch sử phòng Matrix chỉ áp dụng cho phòng; DM tiếp tục sử dụng lịch sử phiên thông thường.
- Lịch sử phòng chỉ bao gồm nội dung đang chờ: OpenClaw lưu đệm các tin nhắn phòng chưa kích hoạt phản hồi, sau đó chụp nhanh cửa sổ đó khi có lượt đề cập hoặc tác nhân kích hoạt khác.
- Tin nhắn kích hoạt hiện tại không được đưa vào `InboundHistory`; tin nhắn này vẫn nằm trong phần nội dung đến chính của lượt đó.
- Các lần thử lại cùng một sự kiện Matrix tái sử dụng ảnh chụp nhanh lịch sử ban đầu thay vì dịch chuyển về phía các tin nhắn phòng mới hơn.

## Khả năng hiển thị ngữ cảnh

Matrix hỗ trợ tùy chọn dùng chung `contextVisibility` cho ngữ cảnh phòng bổ sung như văn bản phản hồi đã tìm nạp, tin nhắn gốc của luồng và lịch sử đang chờ.

- `contextVisibility: "all"` là giá trị mặc định. Ngữ cảnh bổ sung được giữ nguyên như khi nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo những người gửi được các bước kiểm tra danh sách cho phép phòng/người dùng đang hoạt động chấp nhận.
- `contextVisibility: "allowlist_quote"` hoạt động giống `allowlist`, nhưng vẫn giữ lại một phản hồi được trích dẫn tường minh.

Điều này chỉ ảnh hưởng đến khả năng hiển thị ngữ cảnh bổ sung, không ảnh hưởng đến việc bản thân tin nhắn đến có thể kích hoạt phản hồi hay không. Quyền kích hoạt vẫn đến từ `groupPolicy`, `groups`, `groupAllowFrom` và các cài đặt chính sách DM.

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

Để tắt hoàn toàn DM trong khi vẫn duy trì hoạt động của phòng, hãy đặt `dm.enabled: false`:

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

Xem [Nhóm](/vi/channels/groups) để biết hành vi kiểm soát bằng lượt đề cập và danh sách cho phép.

Ví dụ ghép nối cho DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được phê duyệt tiếp tục gửi tin nhắn trước khi được phê duyệt, OpenClaw tái sử dụng cùng mã ghép nối đang chờ và có thể gửi phản hồi nhắc nhở sau một khoảng chờ ngắn thay vì tạo mã mới.

Xem [Ghép nối](/vi/channels/pairing) để biết quy trình ghép nối DM dùng chung và bố cục lưu trữ.

## Sửa chữa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp bị sai lệch, OpenClaw có thể có các ánh xạ `m.direct` đã cũ trỏ đến các phòng đơn cũ thay vì DM đang hoạt động. Kiểm tra ánh xạ hiện tại cho một đối tượng ngang hàng:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa chữa ánh xạ:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Cả hai lệnh đều chấp nhận `--account <id>` cho cấu hình nhiều tài khoản. Quy trình sửa chữa:

- ưu tiên một DM 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- dùng dự phòng bất kỳ DM 1:1 nghiêm ngặt nào với người dùng đó mà tài khoản hiện đang tham gia
- tạo một phòng trực tiếp mới và ghi lại `m.direct` nếu không có DM ổn định nào

Quy trình này không tự động xóa các phòng cũ. Nó chọn DM ổn định và cập nhật ánh xạ để các lượt gửi Matrix, thông báo xác minh và các luồng tin nhắn trực tiếp khác trong tương lai nhắm đến đúng phòng.

## Phê duyệt thực thi

Matrix có thể hoạt động như một ứng dụng khách phê duyệt gốc. Cấu hình trong `channels.matrix.execApprovals` (hoặc `channels.matrix.accounts.<account>.execApprovals` để ghi đè theo từng tài khoản):

- `enabled`: phân phối yêu cầu phê duyệt qua lời nhắc gốc của Matrix. Khi chưa đặt hoặc là `"auto"`, tính năng sẽ tự động bật khi có thể phân giải ít nhất một người phê duyệt; đặt `false` để vô hiệu hóa tường minh.
- `approvers`: các ID người dùng Matrix (`@owner:example.org`) được phép phê duyệt yêu cầu thực thi. Dùng dự phòng `channels.matrix.dm.allowFrom`.
- `target`: nơi gửi lời nhắc. `"dm"` (mặc định) gửi đến DM của người phê duyệt; `"channel"` gửi đến phòng hoặc DM khởi tạo; `"both"` gửi đến cả hai.
- `agentFilter` / `sessionFilter`: danh sách cho phép tùy chọn xác định agent/phiên nào kích hoạt việc phân phối qua Matrix.

Việc cấp quyền khác nhau đôi chút giữa các loại phê duyệt:

- **Phê duyệt thực thi** sử dụng `execApprovals.approvers`, với `dm.allowFrom` làm phương án dự phòng.
- **Phê duyệt Plugin** chỉ cấp quyền thông qua `dm.allowFrom`.

Cả hai loại đều dùng chung các lối tắt phản ứng và cập nhật tin nhắn của Matrix. Người phê duyệt sẽ thấy các lối tắt phản ứng trên tin nhắn phê duyệt chính:

- ✅ cho phép một lần
- ❌ từ chối
- ♾️ luôn cho phép (khi chính sách thực thi có hiệu lực cho phép)

Các lệnh gạch chéo dự phòng: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Chỉ những người phê duyệt đã được phân giải mới có thể phê duyệt hoặc từ chối. Việc gửi phê duyệt thực thi đến kênh bao gồm cả nội dung lệnh - chỉ bật `channel` hoặc `both` trong các phòng đáng tin cậy.

Liên quan: [Phê duyệt thực thi](/vi/tools/exec-approvals).

## Lệnh gạch chéo

Các lệnh gạch chéo (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, v.v.) hoạt động trực tiếp trong tin nhắn riêng. Trong phòng, OpenClaw cũng nhận dạng các lệnh có tiền tố là lượt đề cập Matrix của chính bot, vì vậy `@bot:server /new` kích hoạt đường dẫn lệnh mà không cần biểu thức chính quy tùy chỉnh cho lượt đề cập - điều này giúp bot phản hồi các bài đăng kiểu phòng `@mention /command` mà Element và các ứng dụng khách tương tự phát ra khi người dùng dùng phím tab để tự động hoàn tất tên bot trước khi nhập lệnh.

Các quy tắc ủy quyền vẫn được áp dụng: người gửi lệnh phải đáp ứng cùng chính sách danh sách cho phép/chủ sở hữu đối với tin nhắn riêng hoặc phòng như tin nhắn thông thường.

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

- Các giá trị `channels.matrix` cấp cao nhất đóng vai trò mặc định cho các tài khoản có tên, trừ khi tài khoản ghi đè chúng.
- Giới hạn một mục phòng được kế thừa cho một tài khoản cụ thể bằng `groups.<room>.account`. Các mục không có `account` được dùng chung giữa các tài khoản; `account: "default"` vẫn hoạt động khi tài khoản mặc định được cấu hình ở cấp cao nhất.

**Chọn tài khoản mặc định:**

- Đặt `defaultAccount` để chọn tài khoản có tên được ưu tiên cho định tuyến ngầm định, thăm dò và các lệnh CLI.
- Nếu bạn có nhiều tài khoản và một tài khoản có tên chính xác là `default`, OpenClaw sẽ ngầm định sử dụng tài khoản đó ngay cả khi chưa đặt `defaultAccount`.
- Khi có nhiều tài khoản có tên nhưng chưa chọn tài khoản mặc định, các lệnh CLI sẽ từ chối phỏng đoán - hãy đặt `defaultAccount` hoặc truyền `--account <id>`.
- Khối `channels.matrix.*` cấp cao nhất chỉ được coi là tài khoản `default` ngầm định khi thông tin xác thực của nó đã đầy đủ (`homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`). Các tài khoản có tên vẫn có thể được phát hiện từ `homeserver` + `userId` sau khi thông tin xác thực đã lưu vào bộ nhớ đệm đáp ứng việc xác thực.

**Nâng cấp:**

- Khi OpenClaw nâng cấp cấu hình một tài khoản thành nhiều tài khoản trong quá trình sửa chữa hoặc thiết lập, nó sẽ giữ nguyên tài khoản có tên hiện có nếu có, hoặc nếu `defaultAccount` đã trỏ đến một tài khoản. Chỉ các khóa xác thực/khởi tạo Matrix được chuyển vào tài khoản đã nâng cấp; các khóa chính sách gửi dùng chung vẫn ở cấp cao nhất.

Xem [Tham chiếu cấu hình](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu dùng chung cho nhiều tài khoản.

## Homeserver riêng tư/LAN

Theo mặc định, OpenClaw chặn các homeserver Matrix riêng tư/nội bộ để bảo vệ khỏi SSRF, trừ khi bạn chủ động cho phép theo từng tài khoản.

Nếu homeserver của bạn chạy trên localhost, địa chỉ IP LAN/Tailscale hoặc tên máy chủ nội bộ, hãy bật `network.dangerouslyAllowPrivateNetwork` cho tài khoản đó:

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

Ví dụ thiết lập bằng CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Tùy chọn chủ động này chỉ cho phép các đích riêng tư/nội bộ đáng tin cậy. Các homeserver công khai dùng kết nối không mã hóa như `http://matrix.example.org:8008` vẫn bị chặn. Hãy ưu tiên `https://` bất cứ khi nào có thể.

## Định tuyến lưu lượng Matrix qua proxy

Nếu quá trình triển khai Matrix của bạn cần một proxy HTTP(S) gửi đi rõ ràng, hãy đặt `channels.matrix.proxy`:

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

Các tài khoản có tên có thể ghi đè giá trị mặc định cấp cao nhất bằng `channels.matrix.accounts.<id>.proxy`. OpenClaw sử dụng cùng một thiết lập proxy cho lưu lượng Matrix khi chạy và các lần thăm dò trạng thái tài khoản.

## Phân giải đích

Matrix chấp nhận các dạng đích sau ở bất cứ nơi nào OpenClaw yêu cầu đích là phòng hoặc người dùng:

- Người dùng: `@user:server`, `user:@user:server` hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server` hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server` hoặc `matrix:channel:#alias:server`

ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy sử dụng chính xác cách viết hoa chữ thường của ID phòng từ Matrix khi cấu hình đích gửi rõ ràng, tác vụ Cron, liên kết hoặc danh sách cho phép. OpenClaw chuẩn hóa các khóa phiên nội bộ để lưu trữ, vì vậy các khóa viết thường đó không phải là nguồn đáng tin cậy cho ID gửi của Matrix.

Việc tra cứu thư mục trực tiếp sử dụng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng sẽ truy vấn thư mục người dùng Matrix trên homeserver đó.
- Tra cứu phòng chấp nhận trực tiếp ID phòng và bí danh rõ ràng. Việc tra cứu tên phòng đã tham gia được thực hiện theo khả năng tối đa và chỉ áp dụng cho danh sách cho phép phòng khi chạy nếu đã đặt `dangerouslyAllowNameMatching: true`.
- Nếu không thể phân giải tên phòng thành ID hoặc bí danh, tên đó sẽ bị bỏ qua khi phân giải danh sách cho phép lúc chạy.

## Tham chiếu cấu hình

Các trường người dùng kiểu danh sách cho phép (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) chấp nhận ID người dùng Matrix đầy đủ (an toàn nhất). Theo mặc định, các mục không phải ID sẽ bị bỏ qua. Nếu đặt `dangerouslyAllowNameMatching: true`, các kết quả khớp chính xác với tên hiển thị trong thư mục Matrix sẽ được phân giải khi khởi động và mỗi khi danh sách cho phép thay đổi trong lúc trình giám sát đang chạy; các mục không thể phân giải sẽ bị bỏ qua khi chạy.

Các khóa danh sách cho phép phòng (`groups`, `rooms` cũ) phải là ID phòng hoặc bí danh. Theo mặc định, các khóa là tên phòng thuần túy sẽ bị bỏ qua; `dangerouslyAllowNameMatching: true` khôi phục việc tra cứu theo khả năng tối đa đối với tên phòng đã tham gia.

### Tài khoản và kết nối

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn hiển thị tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi cấu hình nhiều tài khoản Matrix.
- `accounts`: các giá trị ghi đè theo từng tài khoản có tên. Các giá trị `channels.matrix` cấp cao nhất được kế thừa làm mặc định.
- `homeserver`: URL homeserver, ví dụ `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: cho phép tài khoản này kết nối đến `localhost`, địa chỉ IP LAN/Tailscale hoặc tên máy chủ nội bộ.
- `proxy`: URL proxy HTTP(S) tùy chọn cho lưu lượng Matrix. Hỗ trợ ghi đè theo từng tài khoản.
- `userId`: ID người dùng Matrix đầy đủ (`@bot:example.org`).
- `accessToken`: mã thông báo truy cập cho xác thực dựa trên mã thông báo. Hỗ trợ giá trị văn bản thuần và SecretRef trên các nhà cung cấp env/file/exec ([Quản lý bí mật](/vi/gateway/secrets)).
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu. Hỗ trợ giá trị văn bản thuần và SecretRef.
- `deviceId`: ID thiết bị Matrix rõ ràng.
- `deviceName`: tên hiển thị của thiết bị được dùng khi đăng nhập bằng mật khẩu.
- `avatarUrl`: URL ảnh đại diện cá nhân đã lưu để đồng bộ hồ sơ và cập nhật `profile set`.
- `initialSyncLimit`: số lượng sự kiện tối đa được tải trong quá trình đồng bộ khi khởi động.

### Mã hóa

- `encryption`: bật E2EE. Mặc định: `false`.
- `startupVerification`: `"if-unverified"` (mặc định khi E2EE được bật) hoặc `"off"`. Tự động yêu cầu tự xác minh khi khởi động nếu thiết bị này chưa được xác minh.
- `startupVerificationCooldownHours`: thời gian chờ trước yêu cầu tự động tiếp theo khi khởi động. Mặc định: `24`.

### Quyền truy cập và chính sách

- `groupPolicy`: `"open"`, `"allowlist"` hoặc `"disabled"`. Mặc định: `"allowlist"`.
- `groupAllowFrom`: danh sách cho phép gồm các ID người dùng đối với lưu lượng phòng.
- `mentionPatterns`: các mẫu biểu thức chính quy có phạm vi cho lượt đề cập trong phòng. Đối tượng có `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Kiểm soát việc `agents.list[].groupChat.mentionPatterns` đã cấu hình có áp dụng theo từng phòng hay không.
- `dm.enabled`: khi là `false`, bỏ qua mọi tin nhắn riêng. Mặc định: `true`.
- `dm.policy`: `"pairing"` (mặc định), `"allowlist"`, `"open"` hoặc `"disabled"`. Áp dụng sau khi bot đã tham gia và phân loại phòng là tin nhắn riêng; không ảnh hưởng đến việc xử lý lời mời.
- `dm.allowFrom`: danh sách cho phép gồm các ID người dùng đối với lưu lượng tin nhắn riêng.
- `dm.sessionScope`: `"per-user"` (mặc định) hoặc `"per-room"`.
- `dm.threadReplies`: giá trị ghi đè chỉ dành cho tin nhắn riêng đối với luồng trả lời (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: chấp nhận tin nhắn từ các tài khoản bot Matrix đã cấu hình khác (`true` hoặc `"mentions"`).
- `allowlistOnly`: khi là `true`, buộc tất cả chính sách tin nhắn riêng đang hoạt động (ngoại trừ `"disabled"`) và các chính sách nhóm `"open"` thành `"allowlist"`. Không thay đổi các chính sách `"disabled"`.
- `dangerouslyAllowNameMatching`: khi là `true`, cho phép tra cứu tên hiển thị trong thư mục Matrix đối với các mục danh sách cho phép người dùng và tra cứu tên phòng đã tham gia đối với các khóa danh sách cho phép phòng. Hãy ưu tiên ID `@user:server` đầy đủ và ID phòng hoặc bí danh.
- `autoJoin`: `"always"`, `"allowlist"` hoặc `"off"`. Mặc định: `"off"`. Áp dụng cho mọi lời mời Matrix, bao gồm cả lời mời kiểu tin nhắn riêng.
- `autoJoinAllowlist`: các phòng/bí danh được cho phép khi `autoJoin` là `"allowlist"`. Các mục bí danh được phân giải dựa trên homeserver, không dựa trên trạng thái do phòng được mời khai báo.
- `contextVisibility`: khả năng hiển thị ngữ cảnh bổ sung (`"all"` mặc định, `"allowlist"`, `"allowlist_quote"`).

### Hành vi trả lời

- `replyToMode`: `"off"` (mặc định), `"first"`, `"all"`, hoặc `"batched"`.
- `threadReplies`: `"off"` (giá trị mặc định cấp cao nhất được phân giải thành `"inbound"` trừ khi được đặt rõ ràng), `"inbound"`, hoặc `"always"`.
- `threadBindings`: các giá trị ghi đè theo từng kênh cho việc định tuyến phiên gắn với luồng và vòng đời.
- `streaming`: đối tượng lồng nhau `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` là `"off"` (mặc định), `"partial"`, `"quiet"`, hoặc `"progress"`. Các cách biểu diễn vô hướng/boolean cũ được di chuyển qua `openclaw doctor --fix`.
- `streaming.block.enabled`: khi `true`, các khối trợ lý đã hoàn tất được giữ lại dưới dạng các thông báo tiến độ riêng biệt. Mặc định: `false`.
- `markdown`: cấu hình kết xuất Markdown tùy chọn cho văn bản gửi đi.
- `responsePrefix`: chuỗi tùy chọn được thêm vào trước các phản hồi gửi đi.
- `textChunkLimit`: kích thước đoạn gửi đi tính bằng ký tự khi `streaming.chunkMode: "length"`. Mặc định: `4000`.
- `streaming.chunkMode`: `"length"` (mặc định, chia theo số lượng ký tự) hoặc `"newline"` (chia tại ranh giới dòng).
- `historyLimit`: số lượng thông báo phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một thông báo phòng kích hoạt tác nhân. Dùng `messages.groupChat.historyLimit` làm phương án dự phòng; giá trị mặc định có hiệu lực là `0` (đã tắt).
- `mediaMaxMb`: giới hạn kích thước phương tiện tính bằng MB cho việc gửi đi và xử lý đầu vào. Mặc định: `20`.

### Cài đặt phản ứng

- `ackReaction`: giá trị ghi đè phản ứng xác nhận cho kênh/tài khoản này.
- `ackReactionScope`: giá trị ghi đè phạm vi (`"group-mentions"` mặc định, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: chế độ thông báo phản ứng đầu vào (`"own"` mặc định, `"off"`).

### Công cụ và giá trị ghi đè theo từng phòng

- `actions`: kiểm soát công cụ theo từng hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: ánh xạ chính sách theo từng phòng. Danh tính phiên sử dụng ID phòng ổn định sau khi phân giải. (`rooms` là bí danh cũ.)
  - `groups.<room>.account`: giới hạn một mục phòng được kế thừa cho một tài khoản cụ thể.
  - `groups.<room>.enabled`: công tắc theo từng phòng. Khi `false`, phòng bị bỏ qua như thể không có trong ánh xạ.
  - `groups.<room>.requireMention`: giá trị ghi đè theo từng phòng đối với yêu cầu đề cập ở cấp kênh.
  - `groups.<room>.allowBots`: giá trị ghi đè theo từng phòng đối với cài đặt cấp kênh (`true` hoặc `"mentions"`).
  - `groups.<room>.botLoopProtection`: giá trị ghi đè theo từng phòng cho hạn mức bảo vệ vòng lặp giữa các bot.
  - `groups.<room>.users`: danh sách cho phép người gửi theo từng phòng.
  - `groups.<room>.tools`: các giá trị ghi đè cho phép/từ chối công cụ theo từng phòng.
  - `groups.<room>.autoReply`: giá trị ghi đè kiểm soát bằng đề cập theo từng phòng. `true` tắt yêu cầu đề cập cho phòng đó; `false` buộc bật lại yêu cầu này.
  - `groups.<room>.skills`: bộ lọc Skills theo từng phòng.
  - `groups.<room>.systemPrompt`: đoạn lời nhắc hệ thống theo từng phòng.

### Cài đặt phê duyệt thực thi

- `execApprovals.enabled`: chuyển các yêu cầu phê duyệt thực thi qua lời nhắc gốc của Matrix.
- `execApprovals.approvers`: các ID người dùng Matrix được phép phê duyệt. Dùng `dm.allowFrom` làm phương án dự phòng.
- `execApprovals.target`: `"dm"` (mặc định), `"channel"`, hoặc `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: danh sách cho phép tác nhân/phiên tùy chọn cho việc phân phối.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - quy trình xác thực DM và ghép nối
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát bằng đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho thông báo
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
