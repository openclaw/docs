---
read_when:
    - Thiết lập Matrix trong OpenClaw
    - Cấu hình E2EE và xác minh cho Matrix
summary: Trạng thái hỗ trợ, cách thiết lập và các ví dụ cấu hình cho Matrix
title: Ma trận
x-i18n:
    generated_at: "2026-07-12T07:40:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix là một plugin kênh có thể tải xuống (`@openclaw/matrix`), được xây dựng trên `matrix-js-sdk` chính thức. Plugin hỗ trợ tin nhắn trực tiếp, phòng, luồng, nội dung đa phương tiện, lượt bày tỏ cảm xúc, cuộc thăm dò, vị trí và E2EE.

## Cài đặt

```bash
openclaw plugins install @openclaw/matrix
```

Thông số plugin thuần túy sẽ thử ClawHub trước, sau đó chuyển sang npm nếu không thành công. Buộc dùng một nguồn bằng `openclaw plugins install clawhub:@openclaw/matrix` hoặc `npm:@openclaw/matrix`. Từ một bản sao mã nguồn cục bộ: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` đăng ký và bật plugin; không cần bước `enable` riêng. Kênh vẫn không hoạt động cho đến khi được cấu hình bên dưới. Xem [Plugin](/vi/tools/plugin) để biết các quy tắc cài đặt chung.

## Thiết lập

1. Tạo một tài khoản Matrix trên máy chủ gốc của bạn.
2. Cấu hình `channels.matrix` bằng `homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`.
3. Khởi động lại Gateway.
4. Bắt đầu một cuộc trò chuyện trực tiếp với bot hoặc mời bot vào một phòng. Lời mời mới chỉ được chấp nhận khi [`autoJoin`](#auto-join) cho phép.

### Thiết lập tương tác

```bash
openclaw channels add
openclaw configure --section channels
```

Trình hướng dẫn yêu cầu URL máy chủ gốc, phương thức xác thực (token hoặc mật khẩu), ID người dùng (chỉ với xác thực bằng mật khẩu), tên thiết bị tùy chọn, có bật E2EE hay không, cùng quyền truy cập phòng/tự động tham gia. Nếu các biến môi trường `MATRIX_*` tương ứng đã tồn tại và tài khoản chưa lưu thông tin xác thực, trình hướng dẫn sẽ đề xuất lối tắt dùng biến môi trường. Phân giải tên phòng trước khi lưu danh sách cho phép bằng `openclaw channels resolve --channel matrix "Project Room"`. Việc bật E2EE trong trình hướng dẫn chạy cùng quy trình khởi tạo như [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` mặc định là `"off"`: bot sẽ không xuất hiện trong các phòng hoặc cuộc trò chuyện trực tiếp mới từ những lời mời mới cho đến khi bạn tham gia thủ công. OpenClaw không thể xác định tại thời điểm nhận lời mời liệu đó là cuộc trò chuyện trực tiếp hay phòng nhóm, vì vậy mọi lời mời đều phải đi qua `autoJoin` trước; `dm.policy` chỉ được áp dụng sau đó, khi bot đã tham gia và phòng đã được phân loại.

<Warning>
Đặt `autoJoin: "allowlist"` cùng `autoJoinAllowlist` để giới hạn các lời mời được chấp nhận, hoặc `autoJoin: "always"` để chấp nhận mọi lời mời.

`autoJoinAllowlist` chỉ chấp nhận `!roomId:server`, `#alias:server` hoặc `*`. Tên phòng thuần túy bị từ chối; bí danh được phân giải dựa trên máy chủ gốc, không dựa trên trạng thái mà phòng gửi lời mời tuyên bố.
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

- Tin nhắn trực tiếp (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): dùng `@user:server`. Theo mặc định, tên hiển thị bị bỏ qua vì có thể thay đổi; chỉ đặt `dangerouslyAllowNameMatching: true` khi cần khả năng tương thích rõ ràng với tên hiển thị.
- Khóa danh sách cho phép của phòng (`groups`, bí danh cũ `rooms`): dùng `!room:server` hoặc `#alias:server`. Tên thuần túy bị bỏ qua trừ khi đặt `dangerouslyAllowNameMatching: true`.
- Danh sách lời mời cho phép (`autoJoinAllowlist`): dùng `!room:server`, `#alias:server` hoặc `*`. Tên thuần túy luôn bị từ chối.

### Chuẩn hóa ID tài khoản

Trình hướng dẫn chuyển đổi một tên thân thiện thành ID tài khoản đã chuẩn hóa (`Ops Bot` -> `ops-bot`). Dấu câu được mã hóa thoát dạng thập lục phân trong tên biến môi trường có phạm vi để các tài khoản không thể xung đột: `-` (0x2D) trở thành `_X2D_`, do đó `ops-prod` ánh xạ tới tiền tố môi trường `MATRIX_OPS_X2D_PROD_`.

### Thông tin xác thực được lưu vào bộ nhớ đệm

Matrix lưu thông tin xác thực vào bộ nhớ đệm trong `~/.openclaw/credentials/matrix/`: `credentials.json` dành cho tài khoản mặc định, `credentials-<account>.json` dành cho các tài khoản có tên. Khi thông tin xác thực được lưu vào bộ nhớ đệm tồn tại, OpenClaw coi Matrix là đã được cấu hình ngay cả khi không có `accessToken` trong tệp cấu hình — điều này áp dụng cho quy trình thiết lập, `openclaw doctor` và các phép kiểm tra trạng thái kênh.

### Biến môi trường

Các biến môi trường tương ứng với khóa cấu hình được dùng khi khóa cấu hình tương đương chưa được đặt. Tài khoản mặc định dùng tên không có tiền tố; tài khoản có tên chèn token tài khoản trước hậu tố (xem phần [chuẩn hóa](#account-id-normalization)).

| Tài khoản mặc định     | Tài khoản có tên (`<ID>` = token tài khoản) |
| ---------------------- | ------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Với tài khoản `ops`, các tên trở thành `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, v.v. Không thể đặt `MATRIX_HOMESERVER` (và bất kỳ biến thể có phạm vi `*_HOMESERVER` nào) từ tệp `.env` của không gian làm việc; xem [Tệp `.env` của không gian làm việc](/vi/gateway/security).

<Note>
Khóa khôi phục không phải là biến môi trường được hỗ trợ bởi cấu hình: OpenClaw không bao giờ tự đọc khóa này từ môi trường. Văn bản hướng dẫn của CLI đề xuất chuyển khóa qua một biến shell có tên `MATRIX_RECOVERY_KEY` cho tài khoản mặc định, hoặc `MATRIX_RECOVERY_KEY_<ID>` (ID tài khoản viết hoa thuần túy, không mã hóa thoát dạng thập lục phân) cho tài khoản có tên — xem [Xác minh thiết bị này bằng khóa khôi phục](#verify-this-device-with-a-recovery-key).
</Note>

## Ví dụ cấu hình

Một cấu hình cơ sở thực tế với ghép nối tin nhắn trực tiếp, danh sách phòng cho phép và E2EE:

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

## Bản xem trước truyền trực tuyến

Tính năng truyền trực tuyến câu trả lời của Matrix là tùy chọn tham gia. `streaming` kiểm soát cách OpenClaw gửi câu trả lời đang được tạo của trợ lý; `blockStreaming` kiểm soát việc mỗi khối đã hoàn tất có được giữ lại dưới dạng một tin nhắn Matrix riêng hay không.

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

Dạng đối tượng đầy đủ chấp nhận `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: nhãn tùy chỉnh, `"auto"`/không đặt để chọn một nhãn đã cấu hình hoặc tích hợp sẵn, hoặc `false` để ẩn nhãn.
- `progress.labels`: các nhãn ứng viên chỉ được dùng khi `label` là `"auto"` hoặc chưa được đặt.
- `progress.maxLines`: số dòng tiến trình cuộn tối đa được giữ trong bản nháp; các dòng cũ hơn vượt quá giới hạn này sẽ bị loại bỏ.
- `progress.maxLineChars`: số ký tự tối đa trên mỗi dòng tiến trình rút gọn trước khi bị cắt ngắn.
- `progress.toolProgress`: khi là `true` (mặc định), hoạt động trực tiếp của công cụ/tiến trình xuất hiện trong bản nháp.

| `streaming`       | Hành vi                                                                                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (mặc định) | Chờ toàn bộ câu trả lời rồi gửi một lần. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                                         |
| `"partial"`       | Chỉnh sửa tại chỗ một tin nhắn văn bản thông thường khi mô hình viết khối hiện tại. Các ứng dụng tiêu chuẩn có thể thông báo khi có bản xem trước đầu tiên, không phải lần chỉnh sửa cuối cùng. |
| `"quiet"`         | Giống `"partial"` nhưng tin nhắn là một thông báo không kích hoạt cảnh báo. Người nhận được thông báo một lần khi quy tắc đẩy riêng cho người dùng khớp với lần chỉnh sửa đã hoàn tất (xem bên dưới). |
| `"progress"`      | Gửi từng dòng tiến trình rút gọn bằng một bản nháp tiến trình.                                                                                                                |

`blockStreaming` (mặc định `false`) độc lập với `streaming`:

| `streaming`             | `blockStreaming: true`                                                        | `blockStreaming: false` (mặc định)                          |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `"partial"` / `"quiet"` | Bản nháp trực tiếp cho khối hiện tại, các khối đã hoàn tất được giữ thành tin nhắn | Bản nháp trực tiếp cho khối hiện tại, được hoàn tất tại chỗ |
| `"off"`                 | Một tin nhắn Matrix có thông báo cho mỗi khối đã hoàn tất                      | Một tin nhắn Matrix có thông báo cho toàn bộ câu trả lời    |

Lưu ý:

- Nếu bản xem trước vượt quá giới hạn kích thước mỗi sự kiện của Matrix, OpenClaw dừng truyền trực tuyến bản xem trước và chuyển sang chỉ gửi kết quả cuối cùng.
- Câu trả lời có nội dung đa phương tiện luôn gửi tệp đính kèm theo cách thông thường; nếu không thể tái sử dụng an toàn một bản xem trước cũ, OpenClaw sẽ xóa nội dung của bản xem trước đó trước khi gửi câu trả lời đa phương tiện cuối cùng.
- Các cập nhật bản xem trước tiến trình công cụ được bật theo mặc định khi truyền trực tuyến bản xem trước đang hoạt động. Đặt `streaming.preview.toolProgress: false` để giữ các lần chỉnh sửa bản xem trước cho nội dung câu trả lời nhưng đưa tiến trình công cụ về luồng gửi thông thường.
- Các lần chỉnh sửa bản xem trước làm phát sinh thêm lệnh gọi API Matrix. Giữ `streaming: "off"` để có cấu hình giới hạn tốc độ thận trọng nhất.

## Tin nhắn thoại

Ghi chú thoại Matrix gửi đến được chuyển thành văn bản trước cổng kiểm tra đề cập trong phòng, vì vậy một ghi chú thoại có nhắc tên bot có thể kích hoạt tác nhân trong phòng có `requireMention: true`, và tác nhân nhận được bản chép lời thay vì chỉ nhận phần giữ chỗ cho tệp âm thanh đính kèm.

Matrix sử dụng nhà cung cấp phương tiện âm thanh dùng chung trong `tools.media.audio`, chẳng hạn như OpenAI `gpt-4o-mini-transcribe`. Xem [Tổng quan về công cụ đa phương tiện](/vi/tools/media-overview) để biết cách thiết lập nhà cung cấp và các giới hạn.

- Các sự kiện `m.audio` và sự kiện `m.file` có loại MIME `audio/*` đủ điều kiện.
- Trong các phòng được mã hóa, OpenClaw giải mã tệp đính kèm thông qua luồng đa phương tiện Matrix hiện có trước khi chuyển thành văn bản.
- Bản chép lời được đánh dấu là do máy tạo và không đáng tin cậy trong lời nhắc của tác nhân.
- Tệp đính kèm được đánh dấu là đã được chuyển thành văn bản để các công cụ đa phương tiện phía sau không thực hiện lại.
- Đặt `tools.media.audio.enabled: false` để tắt chuyển âm thanh thành văn bản trên toàn hệ thống.

## Siêu dữ liệu phê duyệt

Các lời nhắc phê duyệt gốc của Matrix là sự kiện `m.room.message` thông thường có nội dung dành riêng cho OpenClaw trong khóa `com.openclaw.approval`. Các ứng dụng tiêu chuẩn vẫn hiển thị phần nội dung văn bản; ứng dụng nhận biết OpenClaw có thể đọc ID phê duyệt có cấu trúc, loại, trạng thái, quyết định và chi tiết thực thi/plugin.

Khi lời nhắc quá dài đối với một sự kiện Matrix, OpenClaw chia nội dung hiển thị thành nhiều phần và chỉ đính kèm `com.openclaw.approval` vào phần đầu tiên. Các lượt bày tỏ cảm xúc cho phép/từ chối được liên kết với sự kiện đầu tiên đó, vì vậy lời nhắc dài vẫn giữ cùng một mục tiêu phê duyệt như lời nhắc chỉ có một sự kiện.

### Quy tắc đẩy tự lưu trữ cho bản xem trước đã hoàn tất ở chế độ im lặng

`streaming: "quiet"` chỉ thông báo cho người nhận sau khi một khối hoặc lượt đã hoàn tất — quy tắc đẩy theo từng người dùng phải khớp với dấu hiệu bản xem trước đã hoàn tất. Xem [Quy tắc đẩy Matrix cho bản xem trước ở chế độ im lặng](/vi/channels/matrix-push-rules) để biết đầy đủ cách thiết lập.

## Phòng bot với bot

Theo mặc định, các tin nhắn Matrix từ những tài khoản Matrix OpenClaw khác đã được cấu hình sẽ bị bỏ qua. Dùng `allowBots` để chủ động cho phép lưu lượng giữa các tác nhân:

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

- `allowBots: true` chấp nhận tin nhắn từ các tài khoản bot Matrix khác đã được cấu hình trong các phòng và tin nhắn trực tiếp được cho phép.
- `allowBots: "mentions"` chỉ chấp nhận các tin nhắn đó khi chúng đề cập rõ ràng đến bot này trong phòng; tin nhắn trực tiếp vẫn luôn được cho phép.
- `groups.<room>.allowBots` ghi đè cài đặt cấp tài khoản cho một phòng.
- Tin nhắn được chấp nhận từ bot đã cấu hình sử dụng cơ chế [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung. Cấu hình `channels.defaults.botLoopProtection`, sau đó ghi đè theo từng tài khoản bằng `channels.matrix.botLoopProtection` hoặc theo từng phòng bằng `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng một ID người dùng Matrix để tránh vòng lặp tự trả lời.
- Matrix không có cờ bot gốc; OpenClaw xem nội dung "do bot gửi" là "được gửi bởi một tài khoản Matrix khác đã cấu hình trên Gateway OpenClaw này".

Hãy sử dụng danh sách phòng được phép nghiêm ngặt và yêu cầu đề cập khi bật lưu lượng bot với bot trong các phòng dùng chung.

## Mã hóa và xác minh

Trong các phòng được mã hóa (E2EE), sự kiện hình ảnh gửi đi sử dụng `thumbnail_file` để bản xem trước hình ảnh được mã hóa cùng với tệp đính kèm đầy đủ; các phòng không mã hóa sử dụng `thumbnail_url` dạng thường. Không cần cấu hình — Plugin tự động phát hiện trạng thái E2EE.

Tất cả lệnh `openclaw matrix` đều chấp nhận `--verbose` (chẩn đoán đầy đủ), `--json` (đầu ra máy có thể đọc) và `--account <id>` (thiết lập nhiều tài khoản). Theo mặc định, đầu ra được trình bày ngắn gọn.

### Bật mã hóa

```bash
openclaw matrix encryption setup
```

Khởi tạo kho bí mật và ký chéo, tạo bản sao lưu khóa phòng nếu cần, sau đó in trạng thái và các bước tiếp theo. Các cờ hữu ích:

- `--recovery-key <key>` áp dụng khóa khôi phục trước khi khởi tạo (nên dùng dạng stdin bên dưới)
- `--force-reset-cross-signing` loại bỏ danh tính ký chéo hiện tại và tạo danh tính mới (chỉ sử dụng có chủ đích)

Đối với tài khoản mới, hãy bật E2EE ngay khi tạo:

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
- `Cross-signing verified`: SDK báo cáo đã xác minh thông qua ký chéo
- `Signed by owner`: được ký bằng khóa tự ký của chính bạn (chỉ dùng để chẩn đoán)

`Verified by owner` chỉ là `yes` khi `Cross-signing verified` là `yes`; chỉ có sự tin cậy cục bộ hoặc chữ ký của chủ sở hữu là chưa đủ.

`--allow-degraded-local-state` trả về chẩn đoán theo khả năng tốt nhất mà không cần chuẩn bị tài khoản Matrix trước; hữu ích cho các phép kiểm tra ngoại tuyến hoặc chỉ được cấu hình một phần.

### Xác minh thiết bị này bằng khóa khôi phục

Truyền khóa khôi phục qua stdin thay vì đưa khóa vào dòng lệnh:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Lệnh báo cáo ba trạng thái:

- `Recovery key accepted`: Matrix đã chấp nhận khóa cho kho bí mật hoặc độ tin cậy của thiết bị.
- `Backup usable`: có thể tải bản sao lưu khóa phòng bằng dữ liệu khôi phục đáng tin cậy.
- `Device verified by owner`: thiết bị này có đầy đủ độ tin cậy từ danh tính ký chéo của Matrix.

Lệnh thoát với mã khác không khi độ tin cậy danh tính đầy đủ chưa hoàn tất, ngay cả khi khóa khôi phục đã mở khóa dữ liệu sao lưu. Trong trường hợp đó, hãy hoàn tất việc tự xác minh từ một ứng dụng khách Matrix khác:

```bash
openclaw matrix verify self
```

`verify self` chờ đến khi `Cross-signing verified: yes` rồi mới thoát thành công. Dùng `--timeout-ms <ms>` để điều chỉnh thời gian chờ.

Dạng khóa trực tiếp `openclaw matrix verify device "<recovery-key>"` cũng hoạt động, nhưng khóa sẽ xuất hiện trong lịch sử shell.

### Khởi tạo hoặc sửa chữa ký chéo

```bash
openclaw matrix verify bootstrap
```

Đây là lệnh sửa chữa/thiết lập cho các tài khoản được mã hóa. Theo thứ tự, lệnh sẽ:

- khởi tạo kho bí mật, tái sử dụng khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa công khai còn thiếu
- đánh dấu và ký chéo thiết bị hiện tại
- tạo bản sao lưu khóa phòng phía máy chủ nếu chưa có

Nếu máy chủ gia đình yêu cầu UIA để tải khóa ký chéo lên, OpenClaw trước tiên thử không xác thực, sau đó là `m.login.dummy`, rồi đến `m.login.password` (yêu cầu `channels.matrix.password`).

Các cờ hữu ích:

- `--recovery-key-stdin` (kết hợp với `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) hoặc `--recovery-key <key>`
- `--force-reset-cross-signing` để loại bỏ danh tính ký chéo hiện tại (chỉ sử dụng có chủ đích; yêu cầu khóa khôi phục đang hoạt động đã được lưu hoặc cung cấp bằng `--recovery-key-stdin`)

### Bản sao lưu khóa phòng

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` cho biết có tồn tại bản sao lưu phía máy chủ hay không và thiết bị này có thể giải mã bản sao lưu đó hay không. `backup restore` nhập các khóa phòng đã sao lưu vào kho mật mã cục bộ; bỏ qua `--recovery-key-stdin` nếu khóa khôi phục đã có trên đĩa.

Để thay thế bản sao lưu bị hỏng bằng trạng thái cơ sở mới (chấp nhận mất lịch sử cũ không thể khôi phục; cũng có thể tạo lại kho bí mật nếu không thể tải bí mật của bản sao lưu hiện tại):

```bash
openclaw matrix verify backup reset --yes
```

Chỉ thêm `--rotate-recovery-key` khi bạn chủ động muốn khóa khôi phục trước đó không còn mở khóa được trạng thái cơ sở sao lưu mới.

### Liệt kê, yêu cầu và phản hồi xác minh

```bash
openclaw matrix verify list
```

Liệt kê các yêu cầu xác minh đang chờ xử lý cho tài khoản đã chọn.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Gửi yêu cầu xác minh từ tài khoản này. `--own-user` yêu cầu tự xác minh (chấp nhận lời nhắc trong một ứng dụng khách Matrix khác của cùng người dùng); `--user-id`/`--device-id`/`--room-id` nhắm đến người khác. Không thể kết hợp `--own-user` với các cờ nhắm mục tiêu khác.

Để xử lý vòng đời ở cấp thấp hơn — thường là khi theo dõi song song các yêu cầu đến từ một ứng dụng khách khác — các lệnh này thao tác trên một yêu cầu cụ thể `<id>` (do `verify list` và `verify request` in ra):

| Lệnh                                       | Mục đích                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Chấp nhận yêu cầu đến                                                |
| `openclaw matrix verify start <id>`        | Bắt đầu luồng SAS                                                    |
| `openclaw matrix verify sas <id>`          | In biểu tượng cảm xúc hoặc số thập phân SAS                          |
| `openclaw matrix verify confirm-sas <id>`  | Xác nhận SAS khớp với nội dung ứng dụng khách kia hiển thị           |
| `openclaw matrix verify mismatch-sas <id>` | Từ chối SAS khi biểu tượng cảm xúc hoặc số thập phân không khớp      |
| `openclaw matrix verify cancel <id>`       | Hủy; chấp nhận tùy chọn `--reason <text>` và `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` và `cancel` đều chấp nhận `--user-id` và `--room-id` làm gợi ý theo dõi tin nhắn trực tiếp khi quá trình xác minh được neo vào một phòng tin nhắn trực tiếp cụ thể.

### Ghi chú về nhiều tài khoản

Khi không có `--account <id>`, các lệnh CLI Matrix sử dụng tài khoản mặc định ngầm định. Khi có nhiều tài khoản được đặt tên nhưng không có `channels.matrix.defaultAccount`, các lệnh sẽ từ chối phỏng đoán và yêu cầu bạn chọn. Khi E2EE bị tắt hoặc không khả dụng cho một tài khoản được đặt tên, lỗi sẽ trỏ đến khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Với `encryption: true`, `startupVerification` mặc định là `"if-unverified"`. Khi khởi động, thiết bị chưa được xác minh sẽ yêu cầu tự xác minh trong một ứng dụng khách Matrix khác, đồng thời bỏ qua yêu cầu trùng lặp và áp dụng thời gian chờ (mặc định là 24 giờ). Điều chỉnh bằng `startupVerificationCooldownHours` hoặc tắt bằng `startupVerification: "off"`.

    Quá trình khởi động cũng chạy một lượt khởi tạo mật mã thận trọng, tái sử dụng kho bí mật và danh tính ký chéo hiện tại. Nếu trạng thái khởi tạo bị hỏng, OpenClaw sẽ thử sửa chữa có kiểm soát ngay cả khi không có `channels.matrix.password`; nếu máy chủ gia đình yêu cầu UIA bằng mật khẩu, quá trình khởi động sẽ ghi cảnh báo và không coi đây là lỗi nghiêm trọng. Các thiết bị đã được chủ sở hữu ký sẽ được giữ nguyên.

    Xem [Di chuyển Matrix](/vi/channels/matrix-migration) để biết toàn bộ quy trình nâng cấp.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix đăng các thông báo vòng đời xác minh vào phòng xác minh tin nhắn trực tiếp nghiêm ngặt dưới dạng tin nhắn `m.notice`: yêu cầu, sẵn sàng (kèm hướng dẫn "Xác minh bằng biểu tượng cảm xúc"), bắt đầu/hoàn tất và chi tiết SAS (biểu tượng cảm xúc/số thập phân) khi có.

    Các yêu cầu đến từ một ứng dụng khách Matrix khác được theo dõi và tự động chấp nhận. Đối với tự xác minh, OpenClaw tự động bắt đầu luồng SAS và xác nhận phía của mình khi xác minh bằng biểu tượng cảm xúc khả dụng — bạn vẫn cần so sánh và xác nhận "They match" trong ứng dụng khách Matrix của mình.

    Các thông báo hệ thống xác minh không được chuyển tiếp đến quy trình trò chuyện của tác nhân.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Nếu `verify status` cho biết thiết bị hiện tại không còn được liệt kê trên máy chủ gia đình, hãy tạo một thiết bị Matrix OpenClaw mới. Đối với đăng nhập bằng mật khẩu:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Đối với xác thực bằng token, hãy tạo token truy cập mới trong ứng dụng khách Matrix hoặc giao diện quản trị, sau đó cập nhật OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Thay `assistant` bằng ID tài khoản từ lệnh bị lỗi hoặc bỏ qua `--account` đối với tài khoản mặc định.

  </Accordion>

  <Accordion title="Device hygiene">
    Các thiết bị cũ do OpenClaw quản lý có thể tích tụ theo thời gian. Liệt kê và loại bỏ:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE sử dụng đường dẫn mật mã Rust chính thức của `matrix-js-sdk`, với `fake-indexeddb` làm lớp tương thích IndexedDB. Trạng thái mật mã được lưu bền vững vào `crypto-idb-snapshot.json` (với quyền truy cập tệp hạn chế).

    Trạng thái thời gian chạy được mã hóa nằm trong `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` và bao gồm kho đồng bộ, kho mật mã, khóa khôi phục, ảnh chụp nhanh IDB, liên kết luồng và trạng thái xác minh khi khởi động. Khi token thay đổi nhưng danh tính tài khoản vẫn giữ nguyên, OpenClaw tái sử dụng thư mục gốc hiện có phù hợp nhất để trạng thái trước đó vẫn hiển thị.

    Một thư mục gốc băm token cũ duy nhất có thể là đường dẫn duy trì tính liên tục bình thường khi xoay vòng token. Nếu OpenClaw ghi nhật ký `matrix: multiple populated token-hash storage roots detected`, hãy kiểm tra thư mục tài khoản và chỉ lưu trữ các thư mục gốc ngang hàng đã lỗi thời sau khi xác nhận thư mục gốc đang hoạt động được chọn vẫn ổn định. Ưu tiên di chuyển các thư mục gốc lỗi thời vào thư mục `_archive/` thay vì xóa chúng ngay lập tức.

  </Accordion>
</AccordionGroup>

## Quản lý hồ sơ

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Truyền cả hai tùy chọn trong một lần gọi. Matrix chấp nhận trực tiếp URL ảnh đại diện `mxc://`; khi truyền `http://`/`https://`, tệp sẽ được tải lên trước và URL `mxc://` đã phân giải sẽ được lưu vào `channels.matrix.avatarUrl` (hoặc giá trị ghi đè theo từng tài khoản).

## Luồng hội thoại

Matrix hỗ trợ luồng hội thoại gốc cho cả phản hồi tự động và thao tác gửi bằng công cụ tin nhắn. Hai thiết lập độc lập kiểm soát hành vi:

### Định tuyến phiên (`sessionScope`)

`dm.sessionScope` quyết định cách các phòng tin nhắn trực tiếp Matrix ánh xạ tới các phiên OpenClaw:

- `"per-user"` (mặc định): tất cả phòng tin nhắn trực tiếp có cùng đối tác được định tuyến sẽ dùng chung một phiên.
- `"per-room"`: mỗi phòng tin nhắn trực tiếp Matrix có khóa phiên riêng, ngay cả khi cùng một đối tác.

Các liên kết cuộc trò chuyện tường minh luôn được ưu tiên hơn `sessionScope`; các phòng và luồng hội thoại đã liên kết giữ nguyên phiên đích đã chọn.

### Phản hồi theo luồng (`threadReplies`)

`threadReplies` quyết định nơi bot đăng phản hồi:

- `"off"`: phản hồi ở cấp cao nhất. Tin nhắn đến trong luồng vẫn thuộc phiên cha.
- `"inbound"`: chỉ phản hồi trong luồng khi tin nhắn đến đã nằm trong luồng đó.
- `"always"`: phản hồi trong một luồng bắt nguồn từ tin nhắn kích hoạt; từ lần kích hoạt đầu tiên trở đi, cuộc trò chuyện đó được định tuyến qua một phiên tương ứng có phạm vi theo luồng.

`dm.threadReplies` chỉ ghi đè thiết lập này cho tin nhắn trực tiếp — ví dụ: giữ các luồng trong phòng tách biệt trong khi vẫn giữ tin nhắn trực tiếp ở dạng phẳng.

### Kế thừa luồng và lệnh gạch chéo

- Tin nhắn đến trong luồng bao gồm tin nhắn gốc của luồng làm ngữ cảnh bổ sung cho tác tử.
- Các thao tác gửi bằng công cụ tin nhắn tự động kế thừa luồng Matrix hiện tại khi nhắm đến cùng phòng (hoặc cùng người dùng đích trong tin nhắn trực tiếp), trừ khi cung cấp `threadId` tường minh.
- Việc tái sử dụng đích người dùng trong tin nhắn trực tiếp chỉ diễn ra khi siêu dữ liệu phiên hiện tại chứng minh đó là cùng một đối tác tin nhắn trực tiếp trên cùng tài khoản Matrix; nếu không, OpenClaw quay về định tuyến thông thường theo phạm vi người dùng.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` và `/acp spawn` liên kết theo luồng đều hoạt động trong phòng và tin nhắn trực tiếp Matrix.
- `/focus` ở cấp cao nhất tạo một luồng Matrix mới và liên kết luồng đó với phiên đích khi `threadBindings.spawnSessions` được bật.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có sẽ liên kết luồng đó tại chỗ.

Khi OpenClaw phát hiện một phòng tin nhắn trực tiếp Matrix xung đột với phòng tin nhắn trực tiếp khác trên cùng phiên dùng chung, hệ thống đăng một thông báo `m.notice` duy nhất, chỉ đến lối thoát `/focus` và đề xuất thay đổi `dm.sessionScope`. Thông báo chỉ xuất hiện khi liên kết luồng được bật.

## Liên kết cuộc trò chuyện ACP

Các phòng, tin nhắn trực tiếp và luồng Matrix hiện có có thể trở thành không gian làm việc ACP lâu dài mà không thay đổi bề mặt trò chuyện.

Quy trình nhanh cho người vận hành:

- Chạy `/acp spawn codex --bind here` bên trong tin nhắn trực tiếp, phòng hoặc luồng Matrix hiện có mà bạn muốn tiếp tục sử dụng.
- Trong tin nhắn trực tiếp hoặc phòng ở cấp cao nhất, tin nhắn trực tiếp/phòng hiện tại vẫn là bề mặt trò chuyện và các tin nhắn sau này được định tuyến đến phiên ACP đã tạo.
- Bên trong một luồng hiện có, `--bind here` liên kết luồng hiện tại tại chỗ.
- `/new` và `/reset` đặt lại cùng phiên ACP đã liên kết tại chỗ.
- `/acp close` đóng phiên ACP và xóa liên kết.

`--bind here` không tạo luồng Matrix con. `threadBindings.spawnSessions` kiểm soát `/acp spawn --thread auto|here`, nơi OpenClaw cần tạo hoặc liên kết một luồng con.

### Cấu hình liên kết luồng

Matrix kế thừa các giá trị mặc định toàn cục từ `session.threadBindings` và hỗ trợ ghi đè theo từng kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: kiểm soát cả việc tạo luồng cho tác tử phụ và ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: các giá trị ghi đè hẹp hơn dành riêng cho việc tạo luồng chỉ cho tác tử phụ hoặc chỉ cho ACP.
- `threadBindings.defaultSpawnContext`

Việc tạo phiên liên kết theo luồng Matrix được bật theo mặc định. Đặt `threadBindings.spawnSessions: false` để ngăn `/focus` và `/acp spawn --thread auto|here` ở cấp cao nhất tạo/liên kết các luồng Matrix. Đặt `threadBindings.defaultSpawnContext: "isolated"` khi việc tạo luồng tác tử phụ gốc không nên phân nhánh bản ghi hội thoại của phiên cha.

## Phản ứng

Matrix hỗ trợ phản ứng gửi đi, thông báo phản ứng đến và phản ứng xác nhận.

Công cụ phản ứng gửi đi được kiểm soát bởi `channels.matrix.actions.reactions`:

- `react` thêm một phản ứng vào sự kiện Matrix.
- `reactions` liệt kê bản tóm tắt phản ứng hiện tại của một sự kiện Matrix.
- `emoji=""` xóa các phản ứng của chính bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji được chỉ định của bot.

**Thứ tự phân giải** (giá trị được xác định đầu tiên sẽ được dùng):

| Thiết lập               | Thứ tự                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | theo tài khoản -> kênh -> `messages.ackReaction` -> phương án dự phòng là emoji nhận dạng tác tử |
| `ackReactionScope`      | theo tài khoản -> kênh -> `messages.ackReactionScope` -> mặc định `"group-mentions"` |
| `reactionNotifications` | theo tài khoản -> kênh -> mặc định `"own"`                                           |

`reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` được thêm khi chúng nhắm đến tin nhắn Matrix do bot tạo; `"off"` vô hiệu hóa các sự kiện hệ thống về phản ứng. Việc xóa phản ứng không được tổng hợp thành sự kiện hệ thống — Matrix biểu diễn chúng dưới dạng thao tác biên tập xóa, không phải các sự kiện xóa `m.reaction` độc lập.

## Ngữ cảnh lịch sử

- `channels.matrix.historyLimit` kiểm soát số lượng tin nhắn phòng gần đây được đưa vào `InboundHistory` khi một tin nhắn trong phòng kích hoạt tác tử. Nếu không đặt, dùng `messages.groupChat.historyLimit`; mặc định có hiệu lực là `0` nếu cả hai đều không được đặt (đã tắt).
- Lịch sử phòng Matrix chỉ áp dụng cho phòng; tin nhắn trực tiếp tiếp tục sử dụng lịch sử phiên thông thường.
- Lịch sử phòng chỉ bao gồm nội dung đang chờ: OpenClaw lưu đệm các tin nhắn phòng chưa kích hoạt phản hồi, sau đó chụp lại cửa sổ đó khi có lượt đề cập hoặc tác nhân kích hoạt khác.
- Tin nhắn kích hoạt hiện tại không được đưa vào `InboundHistory`; nó vẫn nằm trong nội dung chính của tin nhắn đến cho lượt đó.
- Các lần thử lại cùng một sự kiện Matrix sẽ tái sử dụng ảnh chụp lịch sử ban đầu thay vì dịch chuyển đến các tin nhắn phòng mới hơn.

## Khả năng hiển thị ngữ cảnh

Matrix hỗ trợ thiết lập dùng chung `contextVisibility` cho ngữ cảnh phòng bổ sung như nội dung phản hồi đã truy xuất, tin nhắn gốc của luồng và lịch sử đang chờ.

- `contextVisibility: "all"` là mặc định. Ngữ cảnh bổ sung được giữ nguyên như khi nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo những người gửi được phép bởi các bước kiểm tra danh sách cho phép hiện hành của phòng/người dùng.
- `contextVisibility: "allowlist_quote"` hoạt động như `allowlist`, nhưng vẫn giữ lại một phản hồi được trích dẫn tường minh.

Thiết lập này chỉ ảnh hưởng đến khả năng hiển thị của ngữ cảnh bổ sung, không ảnh hưởng đến việc bản thân tin nhắn đến có thể kích hoạt phản hồi hay không. Quyền kích hoạt vẫn được xác định bởi `groupPolicy`, `groups`, `groupAllowFrom` và các thiết lập chính sách tin nhắn trực tiếp.

## Chính sách tin nhắn trực tiếp và phòng

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

Để tắt hoàn toàn tin nhắn trực tiếp trong khi vẫn giữ các phòng hoạt động, hãy đặt `dm.enabled: false`:

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

Xem [Nhóm](/vi/channels/groups) để biết hành vi yêu cầu đề cập và danh sách cho phép.

Ví dụ ghép nối cho tin nhắn trực tiếp Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu người dùng Matrix chưa được phê duyệt tiếp tục gửi tin nhắn trước khi được phê duyệt, OpenClaw sẽ tái sử dụng cùng mã ghép nối đang chờ và có thể gửi phản hồi nhắc nhở sau một khoảng chờ ngắn thay vì tạo mã mới.

Xem [Ghép nối](/vi/channels/pairing) để biết quy trình ghép nối tin nhắn trực tiếp dùng chung và bố cục lưu trữ.

## Sửa chữa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp bị sai lệch, OpenClaw có thể có các ánh xạ `m.direct` lỗi thời trỏ đến các phòng riêng cũ thay vì tin nhắn trực tiếp đang hoạt động. Kiểm tra ánh xạ hiện tại cho một đối tác:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa chữa ánh xạ:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Cả hai lệnh đều chấp nhận `--account <id>` cho cấu hình nhiều tài khoản. Quy trình sửa chữa:

- ưu tiên một tin nhắn trực tiếp 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- nếu không có, dùng bất kỳ tin nhắn trực tiếp 1:1 nghiêm ngặt nào đang tham gia với người dùng đó
- tạo một phòng trực tiếp mới và ghi lại `m.direct` nếu không có tin nhắn trực tiếp ổn định nào

Quy trình này không tự động xóa các phòng cũ. Nó chọn tin nhắn trực tiếp ổn định và cập nhật ánh xạ để các thao tác gửi Matrix, thông báo xác minh và các quy trình tin nhắn trực tiếp khác trong tương lai nhắm đúng phòng.

## Phê duyệt thực thi

Matrix có thể hoạt động như một trình khách phê duyệt gốc. Cấu hình trong `channels.matrix.execApprovals` (hoặc `channels.matrix.accounts.<account>.execApprovals` để ghi đè theo từng tài khoản):

- `enabled`: gửi yêu cầu phê duyệt qua lời nhắc gốc của Matrix. Khi không đặt hoặc đặt `"auto"`, tính năng tự động bật khi có thể phân giải ít nhất một người phê duyệt; đặt `false` để tắt tường minh.
- `approvers`: ID người dùng Matrix (`@owner:example.org`) được phép phê duyệt yêu cầu thực thi. Nếu không đặt, dùng `channels.matrix.dm.allowFrom`.
- `target`: nơi gửi lời nhắc. `"dm"` (mặc định) gửi đến tin nhắn trực tiếp của người phê duyệt; `"channel"` gửi đến phòng hoặc tin nhắn trực tiếp khởi nguồn; `"both"` gửi đến cả hai.
- `agentFilter` / `sessionFilter`: danh sách cho phép tùy chọn để xác định tác tử/phiên nào kích hoạt việc gửi qua Matrix.

Quyền hạn khác nhau đôi chút giữa các loại phê duyệt:

- **Phê duyệt thực thi** sử dụng `execApprovals.approvers`, nếu không có thì dùng `dm.allowFrom`.
- **Phê duyệt Plugin** chỉ cấp quyền thông qua `dm.allowFrom`.

Cả hai loại dùng chung lối tắt phản ứng và cập nhật tin nhắn của Matrix. Người phê duyệt thấy các lối tắt phản ứng trên tin nhắn phê duyệt chính:

- ✅ cho phép một lần
- ❌ từ chối
- ♾️ luôn cho phép (khi chính sách thực thi có hiệu lực cho phép)

Các lệnh gạch chéo dự phòng: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Chỉ những người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối. Việc gửi phê duyệt thực thi đến kênh bao gồm nội dung lệnh — chỉ bật `channel` hoặc `both` trong các phòng đáng tin cậy.

Liên quan: [Phê duyệt thực thi](/vi/tools/exec-approvals).

## Lệnh gạch chéo

Các lệnh gạch chéo (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, v.v.) hoạt động trực tiếp trong tin nhắn trực tiếp. Trong phòng, OpenClaw cũng nhận diện các lệnh có tiền tố là lượt đề cập Matrix đến chính bot, vì vậy `@bot:server /new` kích hoạt đường dẫn lệnh mà không cần biểu thức chính quy tùy chỉnh cho lượt đề cập — điều này giúp bot phản hồi các bài đăng kiểu phòng `@mention /command` mà Element và các trình khách tương tự tạo ra khi người dùng dùng phím tab để tự động hoàn thành tên bot trước khi nhập lệnh.

Các quy tắc cấp quyền vẫn được áp dụng: người gửi lệnh phải đáp ứng cùng chính sách danh sách cho phép/chủ sở hữu của tin nhắn trực tiếp hoặc phòng như tin nhắn thông thường.

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

- Các giá trị `channels.matrix` cấp cao nhất đóng vai trò là giá trị mặc định cho các tài khoản có tên, trừ khi tài khoản ghi đè chúng.
- Giới hạn một mục phòng được kế thừa cho một tài khoản cụ thể bằng `groups.<room>.account`. Các mục không có `account` được dùng chung giữa các tài khoản; `account: "default"` vẫn hoạt động khi tài khoản mặc định được cấu hình ở cấp cao nhất.

**Chọn tài khoản mặc định:**

- Đặt `defaultAccount` để chọn tài khoản có tên mà việc định tuyến ngầm định, thăm dò và các lệnh CLI sẽ ưu tiên.
- Nếu bạn có nhiều tài khoản và một tài khoản có tên chính xác là `default`, OpenClaw sẽ ngầm định sử dụng tài khoản đó ngay cả khi chưa đặt `defaultAccount`.
- Khi có nhiều tài khoản có tên nhưng chưa chọn tài khoản mặc định, các lệnh CLI sẽ từ chối phỏng đoán — hãy đặt `defaultAccount` hoặc truyền `--account <id>`.
- Khối `channels.matrix.*` cấp cao nhất chỉ được coi là tài khoản `default` ngầm định khi thông tin xác thực của khối đó đầy đủ (`homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`). Các tài khoản có tên vẫn có thể được phát hiện từ `homeserver` + `userId` sau khi thông tin xác thực đã lưu trong bộ nhớ đệm đáp ứng yêu cầu xác thực.

**Chuyển đổi:**

- Khi OpenClaw chuyển cấu hình một tài khoản thành cấu hình nhiều tài khoản trong quá trình sửa chữa hoặc thiết lập, hệ thống sẽ giữ nguyên tài khoản có tên hiện có nếu có, hoặc tài khoản mà `defaultAccount` đã trỏ tới. Chỉ các khóa xác thực/khởi tạo Matrix được chuyển vào tài khoản đã chuyển đổi; các khóa chính sách phân phối dùng chung vẫn ở cấp cao nhất.

Xem [Tài liệu tham chiếu cấu hình](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu nhiều tài khoản dùng chung.

## Máy chủ homeserver riêng tư/LAN

Theo mặc định, OpenClaw chặn các homeserver Matrix riêng tư/nội bộ để bảo vệ khỏi SSRF, trừ khi bạn chủ động cho phép theo từng tài khoản.

Nếu homeserver của bạn chạy trên localhost, một địa chỉ IP LAN/Tailscale hoặc một tên máy chủ nội bộ, hãy bật `network.dangerouslyAllowPrivateNetwork` cho tài khoản đó:

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

Tùy chọn chủ động này chỉ cho phép các đích riêng tư/nội bộ đáng tin cậy. Các homeserver công khai dùng kết nối văn bản rõ như `http://matrix.example.org:8008` vẫn bị chặn. Hãy ưu tiên `https://` bất cứ khi nào có thể.

## Chuyển tiếp lưu lượng Matrix qua proxy

Nếu hệ thống triển khai Matrix của bạn cần một proxy HTTP(S) đi rõ ràng, hãy đặt `channels.matrix.proxy`:

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

Các tài khoản có tên có thể ghi đè giá trị mặc định cấp cao nhất bằng `channels.matrix.accounts.<id>.proxy`. OpenClaw sử dụng cùng một thiết lập proxy cho lưu lượng Matrix khi chạy và các phép thăm dò trạng thái tài khoản.

## Phân giải đích

Matrix chấp nhận các dạng đích sau ở bất kỳ nơi nào OpenClaw yêu cầu đích là phòng hoặc người dùng:

- Người dùng: `@user:server`, `user:@user:server` hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server` hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server` hoặc `matrix:channel:#alias:server`

ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy sử dụng chính xác kiểu chữ hoa/thường của ID phòng từ Matrix khi cấu hình đích gửi rõ ràng, tác vụ cron, liên kết hoặc danh sách cho phép. OpenClaw chuẩn hóa khóa phiên nội bộ để lưu trữ, vì vậy các khóa viết thường đó không phải là nguồn đáng tin cậy cho ID gửi của Matrix.

Tra cứu thư mục trực tiếp sử dụng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng truy vấn thư mục người dùng Matrix trên homeserver đó.
- Tra cứu phòng chấp nhận trực tiếp ID phòng và bí danh rõ ràng. Tra cứu theo tên phòng đã tham gia chỉ mang tính nỗ lực tối đa và chỉ áp dụng cho danh sách phòng cho phép lúc chạy khi đặt `dangerouslyAllowNameMatching: true`.
- Nếu không thể phân giải tên phòng thành ID hoặc bí danh, tên đó sẽ bị bỏ qua khi phân giải danh sách cho phép lúc chạy.

## Tham chiếu cấu hình

Các trường người dùng dạng danh sách cho phép (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) chấp nhận ID người dùng Matrix đầy đủ (an toàn nhất). Theo mặc định, các mục không phải ID sẽ bị bỏ qua. Nếu đặt `dangerouslyAllowNameMatching: true`, các kết quả khớp chính xác với tên hiển thị trong thư mục Matrix sẽ được phân giải khi khởi động và mỗi khi danh sách cho phép thay đổi trong lúc trình giám sát đang chạy; các mục không thể phân giải sẽ bị bỏ qua lúc chạy.

Khóa danh sách phòng cho phép (`groups`, `rooms` cũ) nên là ID phòng hoặc bí danh. Theo mặc định, khóa là tên phòng thuần túy sẽ bị bỏ qua; `dangerouslyAllowNameMatching: true` khôi phục việc tra cứu theo nỗ lực tối đa đối với tên các phòng đã tham gia.

### Tài khoản và kết nối

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn hiển thị tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi cấu hình nhiều tài khoản Matrix.
- `accounts`: các ghi đè được đặt tên theo từng tài khoản. Các giá trị `channels.matrix` cấp cao nhất được kế thừa làm mặc định.
- `homeserver`: URL homeserver, ví dụ `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: cho phép tài khoản này kết nối với `localhost`, IP LAN/Tailscale hoặc tên máy chủ nội bộ.
- `proxy`: URL proxy HTTP(S) tùy chọn cho lưu lượng Matrix. Hỗ trợ ghi đè theo từng tài khoản.
- `userId`: ID người dùng Matrix đầy đủ (`@bot:example.org`).
- `accessToken`: mã thông báo truy cập cho xác thực dựa trên mã thông báo. Hỗ trợ giá trị văn bản thuần và SecretRef qua các nhà cung cấp env/file/exec ([Quản lý bí mật](/vi/gateway/secrets)).
- `password`: mật khẩu để đăng nhập bằng mật khẩu. Hỗ trợ giá trị văn bản thuần và SecretRef.
- `deviceId`: ID thiết bị Matrix được chỉ định rõ ràng.
- `deviceName`: tên hiển thị của thiết bị được dùng khi đăng nhập bằng mật khẩu.
- `avatarUrl`: URL ảnh đại diện của chính tài khoản được lưu trữ để đồng bộ hồ sơ và cập nhật bằng `profile set`.
- `initialSyncLimit`: số sự kiện tối đa được tìm nạp trong quá trình đồng bộ khi khởi động.

### Mã hóa

- `encryption`: bật E2EE. Mặc định: `false`.
- `startupVerification`: `"if-unverified"` (mặc định khi E2EE được bật) hoặc `"off"`. Tự động yêu cầu tự xác minh khi khởi động nếu thiết bị này chưa được xác minh.
- `startupVerificationCooldownHours`: khoảng chờ trước yêu cầu tự động tiếp theo khi khởi động. Mặc định: `24`.

### Quyền truy cập và chính sách

- `groupPolicy`: `"open"`, `"allowlist"` hoặc `"disabled"`. Mặc định: `"allowlist"`.
- `groupAllowFrom`: danh sách ID người dùng được phép gửi lưu lượng trong phòng.
- `mentionPatterns`: các mẫu biểu thức chính quy có phạm vi cho lượt đề cập trong phòng. Đối tượng có dạng `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Kiểm soát việc `agents.list[].groupChat.mentionPatterns` đã cấu hình có áp dụng theo từng phòng hay không.
- `dm.enabled`: khi là `false`, bỏ qua mọi tin nhắn trực tiếp. Mặc định: `true`.
- `dm.policy`: `"pairing"` (mặc định), `"allowlist"`, `"open"` hoặc `"disabled"`. Áp dụng sau khi bot đã tham gia và phân loại phòng là phòng nhắn tin trực tiếp; không ảnh hưởng đến việc xử lý lời mời.
- `dm.allowFrom`: danh sách ID người dùng được phép gửi lưu lượng tin nhắn trực tiếp.
- `dm.sessionScope`: `"per-user"` (mặc định) hoặc `"per-room"`.
- `dm.threadReplies`: ghi đè chỉ dành cho tin nhắn trực tiếp đối với việc phân luồng trả lời (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: chấp nhận tin nhắn từ các tài khoản bot Matrix khác đã được cấu hình (`true` hoặc `"mentions"`).
- `allowlistOnly`: khi là `true`, buộc mọi chính sách tin nhắn trực tiếp đang hoạt động (ngoại trừ `"disabled"`) và chính sách nhóm `"open"` thành `"allowlist"`. Không thay đổi các chính sách `"disabled"`.
- `dangerouslyAllowNameMatching`: khi là `true`, cho phép tra cứu thư mục theo tên hiển thị Matrix cho các mục người dùng trong danh sách cho phép và tra cứu theo tên phòng đã tham gia cho các khóa danh sách phòng cho phép. Nên ưu tiên ID `@user:server` đầy đủ và ID phòng hoặc bí danh.
- `autoJoin`: `"always"`, `"allowlist"` hoặc `"off"`. Mặc định: `"off"`. Áp dụng cho mọi lời mời Matrix, bao gồm cả lời mời dạng tin nhắn trực tiếp.
- `autoJoinAllowlist`: các phòng/bí danh được phép khi `autoJoin` là `"allowlist"`. Các mục bí danh được phân giải dựa trên homeserver, không dựa trên trạng thái do phòng gửi lời mời khai báo.
- `contextVisibility`: khả năng hiển thị ngữ cảnh bổ sung (`"all"` mặc định, `"allowlist"`, `"allowlist_quote"`).

### Hành vi trả lời

- `replyToMode`: `"off"` (mặc định), `"first"`, `"all"` hoặc `"batched"`.
- `threadReplies`: `"off"` (mặc định cấp cao nhất được phân giải thành `"inbound"` trừ khi được đặt rõ ràng), `"inbound"` hoặc `"always"`.
- `threadBindings`: ghi đè theo từng kênh cho định tuyến và vòng đời phiên liên kết với luồng.
- `streaming`: `"off"` (mặc định), `"partial"`, `"quiet"`, `"progress"` hoặc dạng đối tượng `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: khi là `true`, các khối hoàn chỉnh của trợ lý được giữ dưới dạng các tin nhắn tiến trình riêng biệt. Mặc định: `false`.
- `markdown`: cấu hình kết xuất Markdown tùy chọn cho văn bản gửi đi.
- `responsePrefix`: chuỗi tùy chọn được thêm vào đầu các câu trả lời gửi đi.
- `textChunkLimit`: kích thước đoạn gửi đi tính theo ký tự khi `chunkMode: "length"`. Mặc định: `4000`.
- `chunkMode`: `"length"` (mặc định, chia theo số ký tự) hoặc `"newline"` (chia tại ranh giới dòng).
- `historyLimit`: số tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn trong phòng kích hoạt tác nhân. Dùng `messages.groupChat.historyLimit` làm phương án dự phòng; mặc định hiệu lực là `0` (đã tắt).
- `mediaMaxMb`: giới hạn kích thước phương tiện tính bằng MB cho việc gửi đi và xử lý đầu vào. Mặc định: `20`.

### Cài đặt phản ứng

- `ackReaction`: ghi đè phản ứng xác nhận cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi (`"group-mentions"` mặc định, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: chế độ thông báo phản ứng đầu vào (`"own"` mặc định, `"off"`).

### Công cụ và ghi đè theo từng phòng

- `actions`: kiểm soát quyền sử dụng công cụ theo từng hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: ánh xạ chính sách theo từng phòng. Danh tính phiên sử dụng ID phòng ổn định sau khi phân giải. (`rooms` là bí danh cũ.)
  - `groups.<room>.account`: giới hạn một mục phòng được kế thừa cho một tài khoản cụ thể.
  - `groups.<room>.enabled`: nút bật/tắt theo từng phòng. Khi là `false`, phòng bị bỏ qua như thể không có trong ánh xạ.
  - `groups.<room>.requireMention`: ghi đè theo từng phòng đối với yêu cầu đề cập ở cấp kênh.
  - `groups.<room>.allowBots`: ghi đè theo từng phòng đối với cài đặt cấp kênh (`true` hoặc `"mentions"`).
  - `groups.<room>.botLoopProtection`: ghi đè theo từng phòng đối với ngân sách bảo vệ vòng lặp giữa các bot.
  - `groups.<room>.users`: danh sách người gửi được phép theo từng phòng.
  - `groups.<room>.tools`: ghi đè cho phép/từ chối công cụ theo từng phòng.
  - `groups.<room>.autoReply`: ghi đè kiểm soát bằng lượt đề cập theo từng phòng. `true` vô hiệu hóa yêu cầu đề cập cho phòng đó; `false` buộc bật lại yêu cầu.
  - `groups.<room>.skills`: bộ lọc Skills theo từng phòng.
  - `groups.<room>.systemPrompt`: đoạn lời nhắc hệ thống theo từng phòng.

### Cài đặt phê duyệt thực thi

- `execApprovals.enabled`: gửi yêu cầu phê duyệt thực thi qua lời nhắc gốc của Matrix.
- `execApprovals.approvers`: ID người dùng Matrix được phép phê duyệt. Dùng `dm.allowFrom` làm phương án dự phòng.
- `execApprovals.target`: `"dm"` (mặc định), `"channel"` hoặc `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: danh sách tác nhân/phiên tùy chọn được phép nhận yêu cầu.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - luồng xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát bằng lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
