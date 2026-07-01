---
read_when:
    - Thiết lập Matrix trong OpenClaw
    - Cấu hình Matrix E2EE và xác minh
summary: Trạng thái hỗ trợ ma trận, thiết lập và ví dụ cấu hình
title: Ma trận
x-i18n:
    generated_at: "2026-07-01T13:08:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix là một Plugin kênh có thể tải xuống cho OpenClaw.
Nó dùng `matrix-js-sdk` chính thức và hỗ trợ DM, phòng, luồng, phương tiện, phản ứng, bình chọn, vị trí và E2EE.

## Cài đặt

Cài đặt Matrix từ ClawHub trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/matrix
```

Đặc tả Plugin dạng trần sẽ thử ClawHub trước, rồi dự phòng sang npm. Để buộc dùng nguồn registry, hãy dùng `openclaw plugins install clawhub:@openclaw/matrix` hoặc `openclaw plugins install npm:@openclaw/matrix`.

Từ một bản checkout cục bộ:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` đăng ký và bật Plugin, nên không cần bước `openclaw plugins enable matrix` riêng. Plugin vẫn chưa làm gì cho đến khi bạn cấu hình kênh bên dưới. Xem [Plugin](/vi/tools/plugin) để biết hành vi Plugin chung và quy tắc cài đặt.

## Thiết lập

1. Tạo một tài khoản Matrix trên homeserver của bạn.
2. Cấu hình `channels.matrix` bằng `homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`.
3. Khởi động lại Gateway.
4. Bắt đầu một DM với bot, hoặc mời bot vào một phòng (xem [tự động tham gia](#auto-join) - lời mời mới chỉ được chấp nhận khi `autoJoin` cho phép).

### Thiết lập tương tác

```bash
openclaw channels add
openclaw configure --section channels
```

Trình hướng dẫn sẽ hỏi: URL homeserver, phương thức xác thực (access token hoặc mật khẩu), ID người dùng (chỉ với xác thực bằng mật khẩu), tên thiết bị tùy chọn, có bật E2EE hay không, và có cấu hình quyền truy cập phòng cùng tự động tham gia hay không.

Nếu các biến môi trường `MATRIX_*` khớp đã tồn tại và tài khoản được chọn chưa có xác thực đã lưu, trình hướng dẫn sẽ đề xuất lối tắt bằng biến môi trường. Để phân giải tên phòng trước khi lưu allowlist, chạy `openclaw channels resolve --channel matrix "Project Room"`. Khi E2EE được bật, trình hướng dẫn ghi cấu hình và chạy cùng bước khởi tạo như [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` mặc định là `off`. Với mặc định này, bot sẽ không xuất hiện trong phòng hoặc DM mới từ lời mời mới cho đến khi bạn tham gia thủ công.

OpenClaw không thể biết tại thời điểm được mời liệu phòng được mời là DM hay nhóm, nên mọi lời mời - kể cả lời mời kiểu DM - đều đi qua `autoJoin` trước. `dm.policy` chỉ áp dụng sau đó, khi bot đã tham gia và phòng đã được phân loại.

<Warning>
Đặt `autoJoin: "allowlist"` cùng `autoJoinAllowlist` để giới hạn lời mời bot chấp nhận, hoặc `autoJoin: "always"` để chấp nhận mọi lời mời.

`autoJoinAllowlist` chỉ chấp nhận đích ổn định: `!roomId:server`, `#alias:server`, hoặc `*`. Tên phòng dạng văn bản thường bị từ chối; mục alias được phân giải theo homeserver, không theo trạng thái do phòng được mời khai báo.
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

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): dùng `@user:server`. Tên hiển thị mặc định bị bỏ qua vì có thể thay đổi; chỉ đặt `dangerouslyAllowNameMatching: true` khi bạn thật sự cần tương thích với các mục dùng tên hiển thị.
- Khóa allowlist phòng (`groups`, `rooms` cũ): dùng `!room:server` hoặc `#alias:server`. Tên phòng dạng văn bản thường mặc định bị bỏ qua; chỉ đặt `dangerouslyAllowNameMatching: true` khi bạn thật sự cần tương thích với tra cứu tên phòng đã tham gia.
- Allowlist lời mời (`autoJoinAllowlist`): dùng `!room:server`, `#alias:server`, hoặc `*`. Tên phòng dạng văn bản thường bị từ chối.

### Chuẩn hóa ID tài khoản

Trình hướng dẫn chuyển đổi tên thân thiện thành ID tài khoản đã chuẩn hóa. Ví dụ, `Ops Bot` trở thành `ops-bot`. Dấu câu được thoát trong tên biến môi trường theo phạm vi để hai tài khoản không thể va chạm: `-` → `_X2D_`, nên `ops-prod` ánh xạ tới `MATRIX_OPS_X2D_PROD_*`.

### Thông tin xác thực đã lưu vào bộ nhớ đệm

Matrix lưu thông tin xác thực đã lưu vào bộ nhớ đệm dưới `~/.openclaw/credentials/matrix/`:

- tài khoản mặc định: `credentials.json`
- tài khoản có tên: `credentials-<account>.json`

Khi thông tin xác thực đã lưu vào bộ nhớ đệm tồn tại ở đó, OpenClaw coi Matrix là đã được cấu hình ngay cả khi access token không có trong tệp cấu hình - điều đó bao gồm thiết lập, `openclaw doctor`, và các phép dò trạng thái kênh.

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

Với tài khoản `ops`, các tên trở thành `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, và tương tự. Các biến môi trường recovery-key được đọc bởi các luồng CLI có nhận biết phục hồi (`verify backup restore`, `verify device`, `verify bootstrap`) khi bạn truyền khóa vào qua `--recovery-key-stdin`.

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

## Bản xem trước phát trực tuyến

Phát trực tuyến trả lời Matrix là tùy chọn bật. `streaming` kiểm soát cách OpenClaw gửi trả lời của trợ lý đang diễn ra; `blockStreaming` kiểm soát liệu mỗi khối đã hoàn tất có được giữ lại như một tin nhắn Matrix riêng hay không.

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

- `progress.label`: nhãn tùy chỉnh, `"auto"` hoặc không đặt để chọn từ nhãn đã cấu hình hoặc nhãn tích hợp, hoặc `false` để ẩn dòng nhãn.
- `progress.labels`: các nhãn ứng viên chỉ dùng khi `label` là `"auto"` hoặc không đặt. Không đặt để dùng mặc định tích hợp.
- `progress.maxLines`: số dòng tiến trình cuộn tối đa được giữ trong bản nháp. Sau giới hạn này, các dòng cũ hơn sẽ bị cắt bớt.
- `progress.maxLineChars`: số ký tự tối đa cho mỗi dòng tiến trình thu gọn trước khi cắt ngắn.
- `progress.toolProgress`: khi là `true` (mặc định), hoạt động công cụ/tiến trình trực tiếp xuất hiện trong bản nháp.

| `streaming`       | Hành vi                                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (mặc định) | Chờ toàn bộ trả lời, gửi một lần. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                 |
| `"partial"`       | Chỉnh sửa tại chỗ một tin nhắn văn bản bình thường khi mô hình viết khối hiện tại. Client Matrix phổ biến có thể thông báo ở bản xem trước đầu tiên, không phải lần chỉnh sửa cuối. |
| `"quiet"`         | Giống `"partial"` nhưng tin nhắn là thông báo không gây thông báo đẩy. Người nhận chỉ nhận thông báo khi một quy tắc push theo người dùng khớp với lần chỉnh sửa đã hoàn tất (xem bên dưới). |
| `"progress"`      | Gửi các dòng tiến trình thu gọn riêng lẻ bằng bản nháp tiến trình.                                                                                                         |

`blockStreaming` độc lập với `streaming`:

| `streaming`             | `blockStreaming: true`                                                  | `blockStreaming: false` (mặc định)                  |
| ----------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `"partial"` / `"quiet"` | Bản nháp trực tiếp cho khối hiện tại, các khối hoàn tất được giữ làm tin nhắn | Bản nháp trực tiếp cho khối hiện tại, hoàn tất tại chỗ |
| `"off"`                 | Một tin nhắn Matrix có thông báo cho mỗi khối đã hoàn tất               | Một tin nhắn Matrix có thông báo cho toàn bộ trả lời |

Ghi chú:

- Nếu bản xem trước vượt quá giới hạn kích thước theo sự kiện của Matrix, OpenClaw dừng phát trực tuyến bản xem trước và dự phòng về chỉ gửi kết quả cuối cùng.
- Trả lời phương tiện luôn gửi tệp đính kèm theo cách bình thường. Nếu một bản xem trước cũ không còn có thể được tái sử dụng an toàn, OpenClaw sẽ biên tập lại trước khi gửi trả lời phương tiện cuối cùng.
- Cập nhật bản xem trước tiến trình công cụ được bật mặc định khi phát trực tuyến bản xem trước Matrix đang hoạt động. Đặt `streaming.preview.toolProgress: false` để giữ các chỉnh sửa bản xem trước cho văn bản câu trả lời nhưng để tiến trình công cụ đi theo đường gửi thông thường.
- Chỉnh sửa bản xem trước tốn thêm lệnh gọi API Matrix. Giữ `streaming: "off"` nếu bạn muốn hồ sơ giới hạn tốc độ thận trọng nhất.

## Tin nhắn thoại

Ghi âm thoại Matrix đầu vào được phiên âm trước cổng nhắc đến phòng. Điều này cho phép một ghi âm thoại nói tên bot kích hoạt agent trong phòng `requireMention: true`, và cung cấp cho agent bản chép lời thay vì chỉ là placeholder tệp âm thanh đính kèm.

Matrix dùng nhà cung cấp phương tiện âm thanh dùng chung được cấu hình dưới `tools.media.audio`, chẳng hạn OpenAI `gpt-4o-mini-transcribe`. Xem [Tổng quan công cụ phương tiện](/vi/tools/media-overview) để biết thiết lập nhà cung cấp và giới hạn.

Chi tiết hành vi:

- Các sự kiện `m.audio` và sự kiện `m.file` có kiểu MIME `audio/*` đủ điều kiện.
- Trong phòng được mã hóa, OpenClaw giải mã tệp đính kèm thông qua đường dẫn phương tiện Matrix hiện có trước khi phiên âm.
- Bản phiên âm được đánh dấu là do máy tạo và không đáng tin cậy trong prompt của agent.
- Tệp đính kèm được đánh dấu là đã phiên âm để các công cụ phương tiện hạ nguồn không phiên âm lại cùng ghi chú thoại.
- Đặt `tools.media.audio.enabled: false` để tắt phiên âm âm thanh trên toàn cục.

## Siêu dữ liệu phê duyệt

Các prompt phê duyệt gốc của Matrix là các sự kiện `m.room.message` thông thường với nội dung sự kiện tùy chỉnh dành riêng cho OpenClaw trong `com.openclaw.approval`. Matrix cho phép các khóa nội dung sự kiện tùy chỉnh, nên các ứng dụng khách mặc định vẫn hiển thị phần thân văn bản, trong khi các ứng dụng khách nhận biết OpenClaw có thể đọc id phê duyệt có cấu trúc, loại, trạng thái, các quyết định có sẵn, và chi tiết exec/Plugin.

Khi một prompt phê duyệt quá dài cho một sự kiện Matrix, OpenClaw chia nhỏ văn bản hiển thị và chỉ gắn `com.openclaw.approval` vào đoạn đầu tiên. Các phản ứng cho quyết định cho phép/từ chối được ràng buộc với sự kiện đầu tiên đó, nên các prompt dài vẫn giữ cùng mục tiêu phê duyệt như các prompt một sự kiện.

### Quy tắc push tự lưu trữ cho bản xem trước hoàn tất yên lặng

`streaming: "quiet"` chỉ thông báo cho người nhận một lần khi một khối hoặc lượt được hoàn tất - một quy tắc push theo từng người dùng phải khớp với dấu bản xem trước đã hoàn tất. Xem [Quy tắc push Matrix cho bản xem trước yên lặng](/vi/channels/matrix-push-rules) để biết công thức đầy đủ (token người nhận, kiểm tra pusher, cài đặt quy tắc, ghi chú theo từng homeserver).

## Phòng bot-với-bot

Theo mặc định, tin nhắn Matrix từ các tài khoản Matrix OpenClaw đã cấu hình khác sẽ bị bỏ qua.

Dùng `allowBots` khi bạn chủ ý muốn có lưu lượng Matrix giữa các agent:

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
- `groups.<room>.allowBots` ghi đè thiết lập cấp tài khoản cho một phòng.
- Tin nhắn từ bot đã cấu hình được chấp nhận dùng chung [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection). Cấu hình `channels.defaults.botLoopProtection`, rồi ghi đè bằng `channels.matrix.botLoopProtection` hoặc `channels.matrix.groups.<room>.botLoopProtection` khi một phòng cần ngân sách khác.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng ID người dùng Matrix để tránh vòng lặp tự trả lời.
- Matrix không cung cấp cờ bot gốc ở đây; OpenClaw xem "do bot tạo" là "được gửi bởi một tài khoản Matrix đã cấu hình khác trên Gateway OpenClaw này".

Dùng danh sách cho phép phòng nghiêm ngặt và yêu cầu nhắc đến khi bật lưu lượng bot-với-bot trong phòng dùng chung.

## Mã hóa và xác minh

Trong các phòng được mã hóa (E2EE), sự kiện hình ảnh gửi ra dùng `thumbnail_file` để bản xem trước hình ảnh được mã hóa cùng với tệp đính kèm đầy đủ. Phòng không mã hóa vẫn dùng `thumbnail_url` thuần. Không cần cấu hình - Plugin tự động phát hiện trạng thái E2EE.

Tất cả lệnh `openclaw matrix` đều chấp nhận `--verbose` (chẩn đoán đầy đủ), `--json` (đầu ra máy đọc được), và `--account <id>` (thiết lập nhiều tài khoản). Theo mặc định, đầu ra ngắn gọn với ghi log SDK nội bộ yên lặng. Các ví dụ bên dưới cho thấy dạng chuẩn; thêm cờ khi cần.

### Bật mã hóa

```bash
openclaw matrix encryption setup
```

Khởi tạo lưu trữ bí mật và ký chéo, tạo bản sao lưu khóa phòng nếu cần, rồi in trạng thái và các bước tiếp theo. Các cờ hữu ích:

- `--recovery-key <key>` áp dụng khóa khôi phục trước khi khởi tạo (ưu tiên dạng stdin được ghi tài liệu bên dưới)
- `--force-reset-cross-signing` loại bỏ danh tính ký chéo hiện tại và tạo danh tính mới (chỉ dùng có chủ ý)

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

- `Locally trusted`: chỉ được ứng dụng khách này tin cậy
- `Cross-signing verified`: SDK báo cáo xác minh qua ký chéo
- `Signed by owner`: được ký bằng khóa tự ký của chính bạn (chỉ dùng để chẩn đoán)

`Verified by owner` chỉ trở thành `yes` khi `Cross-signing verified` là `yes`. Chỉ tin cậy cục bộ hoặc chỉ có chữ ký của chủ sở hữu là chưa đủ.

`--allow-degraded-local-state` trả về chẩn đoán nỗ lực tốt nhất mà không chuẩn bị tài khoản Matrix trước; hữu ích cho các phép thăm dò ngoại tuyến hoặc cấu hình một phần.

### Xác minh thiết bị này bằng khóa khôi phục

Khóa khôi phục là nhạy cảm - hãy pipe khóa qua stdin thay vì truyền trên dòng lệnh. Đặt `MATRIX_RECOVERY_KEY` (hoặc `MATRIX_<ID>_RECOVERY_KEY` cho tài khoản có tên):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Lệnh báo cáo ba trạng thái:

- `Recovery key accepted`: Matrix đã chấp nhận khóa cho lưu trữ bí mật hoặc tin cậy thiết bị.
- `Backup usable`: bản sao lưu khóa phòng có thể được tải bằng vật liệu khôi phục tin cậy.
- `Device verified by owner`: thiết bị này có đầy đủ tin cậy danh tính ký chéo Matrix.

Lệnh thoát với mã khác 0 khi tin cậy danh tính đầy đủ chưa hoàn tất, ngay cả khi khóa khôi phục đã mở khóa vật liệu sao lưu. Trong trường hợp đó, hoàn tất tự xác minh từ một ứng dụng khách Matrix khác:

```bash
openclaw matrix verify self
```

`verify self` chờ đến khi `Cross-signing verified: yes` trước khi thoát thành công. Dùng `--timeout-ms <ms>` để điều chỉnh thời gian chờ.

Dạng khóa nguyên văn `openclaw matrix verify device "<recovery-key>"` cũng được chấp nhận, nhưng khóa sẽ nằm trong lịch sử shell của bạn.

### Khởi tạo hoặc sửa ký chéo

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` là lệnh sửa chữa và thiết lập cho các tài khoản được mã hóa. Theo thứ tự, lệnh này:

- khởi tạo lưu trữ bí mật, tái sử dụng khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa công khai còn thiếu
- đánh dấu và ký chéo thiết bị hiện tại
- tạo bản sao lưu khóa phòng phía máy chủ nếu chưa có

Nếu homeserver yêu cầu UIA để tải lên khóa ký chéo, OpenClaw thử không xác thực trước, rồi `m.login.dummy`, rồi `m.login.password` (yêu cầu `channels.matrix.password`).

Các cờ hữu ích:

- `--recovery-key-stdin` (ghép với `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) hoặc `--recovery-key <key>`
- `--force-reset-cross-signing` để loại bỏ danh tính ký chéo hiện tại (chỉ có chủ ý; yêu cầu khóa khôi phục đang hoạt động đã được lưu trữ hoặc được cung cấp bằng `--recovery-key-stdin`)

### Bản sao lưu khóa phòng

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` cho biết có bản sao lưu phía máy chủ hay không và thiết bị này có thể giải mã nó hay không. `backup restore` nhập các khóa phòng đã sao lưu vào kho crypto cục bộ; nếu khóa khôi phục đã có trên đĩa, bạn có thể bỏ qua `--recovery-key-stdin`.

Để thay thế bản sao lưu hỏng bằng một baseline mới (chấp nhận mất lịch sử cũ không thể khôi phục; cũng có thể tạo lại lưu trữ bí mật nếu bí mật sao lưu hiện tại không thể tải):

```bash
openclaw matrix verify backup reset --yes
```

Chỉ thêm `--rotate-recovery-key` khi bạn chủ ý muốn khóa khôi phục trước đó ngừng mở khóa baseline sao lưu mới.

### Liệt kê, yêu cầu và phản hồi xác minh

```bash
openclaw matrix verify list
```

Liệt kê các yêu cầu xác minh đang chờ cho tài khoản đã chọn.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Gửi yêu cầu xác minh từ tài khoản OpenClaw này. `--own-user` yêu cầu tự xác minh (bạn chấp nhận prompt trong một ứng dụng khách Matrix khác của cùng người dùng); `--user-id`/`--device-id`/`--room-id` nhắm tới người khác. `--own-user` không thể kết hợp với các cờ nhắm mục tiêu khác.

Để xử lý vòng đời cấp thấp hơn - thường là khi theo dõi các yêu cầu đến từ một ứng dụng khách khác - các lệnh này tác động lên một yêu cầu `<id>` cụ thể (được in bởi `verify list` và `verify request`):

| Lệnh                                       | Mục đích                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Chấp nhận một yêu cầu đến                                           |
| `openclaw matrix verify start <id>`        | Bắt đầu luồng SAS                                                   |
| `openclaw matrix verify sas <id>`          | In emoji hoặc số thập phân SAS                                      |
| `openclaw matrix verify confirm-sas <id>`  | Xác nhận SAS khớp với những gì ứng dụng khách kia hiển thị          |
| `openclaw matrix verify mismatch-sas <id>` | Từ chối SAS khi emoji hoặc số thập phân không khớp                  |
| `openclaw matrix verify cancel <id>`       | Hủy; nhận tùy chọn `--reason <text>` và `--code <matrix-code>`      |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas`, và `cancel` đều chấp nhận `--user-id` và `--room-id` làm gợi ý theo dõi DM khi xác minh được neo vào một phòng tin nhắn trực tiếp cụ thể.

### Ghi chú nhiều tài khoản

Nếu không có `--account <id>`, các lệnh CLI Matrix dùng tài khoản mặc định ngầm định. Nếu bạn có nhiều tài khoản có tên và chưa đặt `channels.matrix.defaultAccount`, chúng sẽ từ chối đoán và yêu cầu bạn chọn. Khi E2EE bị tắt hoặc không khả dụng cho một tài khoản có tên, lỗi sẽ trỏ đến khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Hành vi khởi động">
    Với `encryption: true`, `startupVerification` mặc định là `"if-unverified"`. Khi khởi động, một thiết bị chưa xác minh sẽ yêu cầu tự xác minh trong một ứng dụng khách Matrix khác, bỏ qua các bản trùng lặp và áp dụng thời gian chờ (mặc định là 24 giờ). Điều chỉnh bằng `startupVerificationCooldownHours` hoặc tắt bằng `startupVerification: "off"`.

    Khởi động cũng chạy một lượt khởi tạo crypto thận trọng, tái sử dụng lưu trữ bí mật và danh tính ký chéo hiện tại. Nếu trạng thái khởi tạo bị hỏng, OpenClaw thử sửa chữa có bảo vệ ngay cả khi không có `channels.matrix.password`; nếu homeserver yêu cầu UIA bằng mật khẩu, khởi động ghi cảnh báo và vẫn không gây lỗi nghiêm trọng. Các thiết bị đã được chủ sở hữu ký được giữ nguyên.

    Xem [di chuyển Matrix](/vi/channels/matrix-migration) để biết luồng nâng cấp đầy đủ.

  </Accordion>

  <Accordion title="Thông báo xác minh">
    Matrix đăng thông báo vòng đời xác minh vào phòng xác minh DM nghiêm ngặt dưới dạng tin nhắn `m.notice`: yêu cầu, sẵn sàng (kèm hướng dẫn "Xác minh bằng emoji"), bắt đầu/hoàn tất, và chi tiết SAS (emoji/thập phân) khi có.

    Các yêu cầu đến từ một ứng dụng khách Matrix khác được theo dõi và tự động chấp nhận. Với tự xác minh, OpenClaw tự động bắt đầu luồng SAS và xác nhận phía của chính nó khi xác minh emoji có sẵn - bạn vẫn cần so sánh và xác nhận "Chúng khớp" trong ứng dụng khách Matrix của mình.

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

    Đối với xác thực bằng token, hãy tạo một access token mới trong Matrix client hoặc giao diện quản trị của bạn, rồi cập nhật OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Thay `assistant` bằng ID tài khoản từ lệnh thất bại, hoặc bỏ qua `--account` để dùng tài khoản mặc định.

  </Accordion>

  <Accordion title="Vệ sinh thiết bị">
    Các thiết bị cũ do OpenClaw quản lý có thể tích tụ. Liệt kê và dọn bớt:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kho crypto">
    Matrix E2EE dùng đường dẫn crypto Rust chính thức của `matrix-js-sdk` với `fake-indexeddb` làm shim IndexedDB. Trạng thái crypto được lưu bền vào `crypto-idb-snapshot.json` (quyền tệp hạn chế).

    Trạng thái runtime được mã hóa nằm dưới `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` và bao gồm sync store, crypto store, recovery key, IDB snapshot, liên kết luồng và trạng thái xác minh khởi động. Khi token thay đổi nhưng danh tính tài khoản vẫn giữ nguyên, OpenClaw dùng lại root hiện có phù hợp nhất để trạng thái trước đó vẫn hiển thị.

    Một root token-hash cũ duy nhất có thể là đường dẫn liên tục bình thường khi xoay vòng token. Nếu OpenClaw ghi log `matrix: multiple populated token-hash storage roots detected`, hãy kiểm tra thư mục tài khoản và chỉ lưu trữ các root ngang hàng đã cũ sau khi xác nhận root đang hoạt động được chọn là lành mạnh. Ưu tiên chuyển các root đã cũ vào thư mục `_archive/` thay vì xóa ngay lập tức.

  </Accordion>
</AccordionGroup>

## Quản lý hồ sơ

Cập nhật self-profile Matrix cho tài khoản đã chọn:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Bạn có thể truyền cả hai tùy chọn trong một lần gọi. Matrix chấp nhận trực tiếp URL ảnh đại diện `mxc://`; khi bạn truyền `http://` hoặc `https://`, OpenClaw tải tệp lên trước và lưu URL `mxc://` đã phân giải vào `channels.matrix.avatarUrl` (hoặc ghi đè theo từng tài khoản).

## Luồng

Matrix hỗ trợ luồng Matrix gốc cho cả trả lời tự động và gửi bằng công cụ tin nhắn. Hai núm điều khiển độc lập quyết định hành vi:

### Định tuyến phiên (`sessionScope`)

`dm.sessionScope` quyết định cách các phòng DM Matrix ánh xạ tới phiên OpenClaw:

- `"per-user"` (mặc định): tất cả phòng DM có cùng peer được định tuyến sẽ chia sẻ một phiên.
- `"per-room"`: mỗi phòng DM Matrix có khóa phiên riêng, ngay cả khi peer giống nhau.

Các liên kết cuộc trò chuyện rõ ràng luôn thắng `sessionScope`, vì vậy các phòng và luồng đã liên kết giữ phiên đích đã chọn.

### Tạo luồng trả lời (`threadReplies`)

`threadReplies` quyết định nơi bot đăng câu trả lời:

- `"off"`: câu trả lời ở cấp cao nhất. Tin nhắn có luồng đến vẫn ở trên phiên cha.
- `"inbound"`: chỉ trả lời bên trong một luồng khi tin nhắn đến đã nằm trong luồng đó.
- `"always"`: trả lời bên trong một luồng bắt nguồn từ tin nhắn kích hoạt; cuộc trò chuyện đó được định tuyến qua một phiên theo phạm vi luồng khớp từ lần kích hoạt đầu tiên trở đi.

`dm.threadReplies` chỉ ghi đè điều này cho DM - ví dụ, giữ các luồng phòng tách biệt trong khi giữ DM phẳng.

### Kế thừa luồng và lệnh gạch chéo

- Tin nhắn có luồng đến bao gồm tin nhắn gốc của luồng làm ngữ cảnh agent bổ sung.
- Gửi bằng công cụ tin nhắn tự động kế thừa luồng Matrix hiện tại khi nhắm tới cùng phòng (hoặc cùng đích người dùng DM), trừ khi cung cấp `threadId` rõ ràng.
- Việc dùng lại đích người dùng DM chỉ kích hoạt khi siêu dữ liệu phiên hiện tại chứng minh cùng peer DM trên cùng tài khoản Matrix; nếu không OpenClaw quay lại định tuyến theo phạm vi người dùng thông thường.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` và `/acp spawn` được liên kết luồng đều hoạt động trong phòng Matrix và DM.
- `/focus` cấp cao nhất tạo một luồng Matrix mới và liên kết nó với phiên đích khi `threadBindings.spawnSessions` được bật.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có sẽ liên kết luồng đó tại chỗ.

Khi OpenClaw phát hiện một phòng DM Matrix xung đột với một phòng DM khác trên cùng phiên dùng chung, nó đăng một `m.notice` một lần trong phòng đó, trỏ tới lối thoát `/focus` và gợi ý thay đổi `dm.sessionScope`. Thông báo chỉ xuất hiện khi liên kết luồng được bật.

## Liên kết cuộc trò chuyện ACP

Phòng Matrix, DM và các luồng Matrix hiện có có thể được chuyển thành workspace ACP bền vững mà không thay đổi bề mặt chat.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong DM Matrix, phòng hoặc luồng hiện có mà bạn muốn tiếp tục sử dụng.
- Trong DM hoặc phòng Matrix cấp cao nhất, DM/phòng hiện tại vẫn là bề mặt chat và các tin nhắn sau này định tuyến tới phiên ACP đã sinh.
- Bên trong một luồng Matrix hiện có, `--bind here` liên kết luồng hiện tại đó tại chỗ.
- `/new` và `/reset` đặt lại cùng phiên ACP đã liên kết tại chỗ.
- `/acp close` đóng phiên ACP và gỡ liên kết.

Ghi chú:

- `--bind here` không tạo luồng Matrix con.
- `threadBindings.spawnSessions` kiểm soát `/acp spawn --thread auto|here`, nơi OpenClaw cần tạo hoặc liên kết một luồng Matrix con.

### Cấu hình liên kết luồng

Matrix kế thừa các mặc định toàn cục từ `session.threadBindings`, đồng thời cũng hỗ trợ ghi đè theo từng kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Mặc định bật sinh phiên liên kết luồng Matrix:

- Đặt `threadBindings.spawnSessions: false` để chặn `/focus` cấp cao nhất và `/acp spawn --thread auto|here` tạo/liên kết luồng Matrix.
- Đặt `threadBindings.defaultSpawnContext: "isolated"` khi việc sinh luồng subagent gốc không nên fork transcript cha.

## Phản ứng

Matrix hỗ trợ phản ứng gửi ra, thông báo phản ứng gửi vào và phản ứng xác nhận.

Công cụ phản ứng gửi ra được kiểm soát bởi `channels.matrix.actions.reactions`:

- `react` thêm một phản ứng vào một sự kiện Matrix.
- `reactions` liệt kê tóm tắt phản ứng hiện tại cho một sự kiện Matrix.
- `emoji=""` gỡ các phản ứng của chính bot trên sự kiện đó.
- `remove: true` chỉ gỡ phản ứng emoji được chỉ định khỏi bot.

**Thứ tự phân giải** (giá trị được định nghĩa đầu tiên sẽ thắng):

| Thiết lập              | Thứ tự                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `ackReaction`          | theo tài khoản → kênh → `messages.ackReaction` → dự phòng emoji danh tính agent        |
| `ackReactionScope`     | theo tài khoản → kênh → `messages.ackReactionScope` → mặc định `"group-mentions"`      |
| `reactionNotifications` | theo tài khoản → kênh → mặc định `"own"`                                               |

`reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` đã thêm khi chúng nhắm tới tin nhắn Matrix do bot soạn; `"off"` tắt các sự kiện hệ thống phản ứng. Việc gỡ phản ứng không được tổng hợp thành sự kiện hệ thống vì Matrix biểu thị chúng dưới dạng redaction, không phải dưới dạng các lượt gỡ `m.reaction` độc lập.

## Ngữ cảnh lịch sử

- `channels.matrix.historyLimit` kiểm soát số lượng tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng Matrix kích hoạt agent. Quay về `messages.groupChat.historyLimit`; nếu cả hai đều chưa đặt, mặc định hiệu dụng là `0`. Đặt `0` để tắt.
- Lịch sử phòng Matrix chỉ thuộc về phòng. DM tiếp tục dùng lịch sử phiên thông thường.
- Lịch sử phòng Matrix chỉ ở trạng thái chờ: OpenClaw đệm các tin nhắn phòng chưa kích hoạt trả lời, rồi chụp nhanh cửa sổ đó khi có lượt nhắc đến hoặc kích hoạt khác đến.
- Tin nhắn kích hoạt hiện tại không được đưa vào `InboundHistory`; nó vẫn ở trong phần thân tin nhắn đến chính cho lượt đó.
- Các lần thử lại cùng sự kiện Matrix dùng lại snapshot lịch sử ban đầu thay vì trôi về phía trước tới các tin nhắn phòng mới hơn.

## Khả năng hiển thị ngữ cảnh

Matrix hỗ trợ điều khiển `contextVisibility` dùng chung cho ngữ cảnh phòng bổ sung như văn bản trả lời đã lấy, gốc luồng và lịch sử đang chờ.

- `contextVisibility: "all"` là mặc định. Ngữ cảnh bổ sung được giữ nguyên như đã nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung xuống các người gửi được các kiểm tra allowlist phòng/người dùng đang hoạt động cho phép.
- `contextVisibility: "allowlist_quote"` hoạt động như `allowlist`, nhưng vẫn giữ một trích dẫn trả lời rõ ràng.

Thiết lập này ảnh hưởng đến khả năng hiển thị ngữ cảnh bổ sung, không ảnh hưởng đến việc bản thân tin nhắn đến có thể kích hoạt trả lời hay không.
Ủy quyền kích hoạt vẫn đến từ `groupPolicy`, `groups`, `groupAllowFrom` và các thiết lập chính sách DM.

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

Xem [Nhóm](/vi/channels/groups) để biết hành vi kiểm soát bằng nhắc đến và allowlist.

Ví dụ ghép đôi cho DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được phê duyệt tiếp tục nhắn tin cho bạn trước khi phê duyệt, OpenClaw dùng lại cùng mã ghép đôi đang chờ và có thể gửi một câu trả lời nhắc nhở sau một khoảng cooldown ngắn thay vì tạo mã mới.

Xem [Ghép đôi](/vi/channels/pairing) để biết luồng ghép đôi DM dùng chung và bố cục lưu trữ.

## Sửa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp lệch đồng bộ, OpenClaw có thể còn các ánh xạ `m.direct` đã cũ trỏ tới các phòng đơn cũ thay vì DM đang hoạt động. Kiểm tra ánh xạ hiện tại cho một peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa nó:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Cả hai lệnh chấp nhận `--account <id>` cho thiết lập nhiều tài khoản. Luồng sửa:

- ưu tiên một DM 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- quay về bất kỳ DM 1:1 nghiêm ngặt nào hiện đã tham gia với người dùng đó
- tạo một phòng trực tiếp mới và ghi lại `m.direct` nếu không có DM lành mạnh nào tồn tại

Nó không tự động xóa các phòng cũ. Nó chọn DM lành mạnh và cập nhật ánh xạ để các lần gửi Matrix, thông báo xác minh và các luồng tin nhắn trực tiếp khác trong tương lai nhắm đúng phòng.

## Phê duyệt exec

Matrix có thể hoạt động như một client phê duyệt gốc. Cấu hình dưới `channels.matrix.execApprovals` (hoặc `channels.matrix.accounts.<account>.execApprovals` để ghi đè theo từng tài khoản):

- `enabled`: gửi phê duyệt qua lời nhắc gốc của Matrix. Khi chưa đặt hoặc là `"auto"`, Matrix tự động bật sau khi có thể phân giải ít nhất một người phê duyệt. Đặt `false` để tắt rõ ràng.
- `approvers`: ID người dùng Matrix (`@owner:example.org`) được phép phê duyệt yêu cầu exec. Tùy chọn - quay về `channels.matrix.dm.allowFrom`.
- `target`: nơi gửi lời nhắc. `"dm"` (mặc định) gửi tới DM của người phê duyệt; `"channel"` gửi tới phòng hoặc DM Matrix khởi nguồn; `"both"` gửi tới cả hai.
- `agentFilter` / `sessionFilter`: allowlist tùy chọn cho agent/phiên nào kích hoạt gửi qua Matrix.

Ủy quyền hơi khác nhau giữa các loại phê duyệt:

- **Phê duyệt exec** dùng `execApprovals.approvers`, quay về `dm.allowFrom`.
- **Phê duyệt Plugin** ủy quyền chỉ qua `dm.allowFrom`.

Cả hai loại dùng chung phím tắt phản ứng Matrix và cập nhật tin nhắn. Người phê duyệt thấy phím tắt phản ứng trên tin nhắn phê duyệt chính:

- `✅` cho phép một lần
- `❌` từ chối
- `♾️` luôn cho phép (khi chính sách exec hiệu dụng cho phép)

Các lệnh gạch chéo dự phòng: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Chỉ những người phê duyệt đã được phân giải mới có thể phê duyệt hoặc từ chối. Việc gửi qua kênh cho phê duyệt exec bao gồm văn bản lệnh - chỉ bật `channel` hoặc `both` trong các phòng đáng tin cậy.

Liên quan: [Phê duyệt exec](/vi/tools/exec-approvals).

## Lệnh gạch chéo

Các lệnh gạch chéo (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, v.v.) hoạt động trực tiếp trong DM. Trong phòng, OpenClaw cũng nhận diện các lệnh có tiền tố là lượt nhắc Matrix của chính bot, vì vậy `@bot:server /new` kích hoạt đường dẫn lệnh mà không cần regex nhắc tùy chỉnh. Điều này giúp bot phản hồi với các bài đăng kiểu phòng `@mention /command` mà Element và các máy khách tương tự phát ra khi người dùng dùng tab để hoàn tất tên bot trước khi nhập lệnh.

Các quy tắc ủy quyền vẫn áp dụng: người gửi lệnh phải đáp ứng cùng chính sách allowlist/chủ sở hữu cho DM hoặc phòng như tin nhắn thường.

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

- Các giá trị `channels.matrix` cấp cao nhất đóng vai trò làm mặc định cho các tài khoản được đặt tên, trừ khi một tài khoản ghi đè chúng.
- Giới hạn một mục phòng được kế thừa cho một tài khoản cụ thể bằng `groups.<room>.account`. Các mục không có `account` được chia sẻ giữa các tài khoản; `account: "default"` vẫn hoạt động khi tài khoản mặc định được cấu hình ở cấp cao nhất.

**Chọn tài khoản mặc định:**

- Đặt `defaultAccount` để chọn tài khoản được đặt tên mà định tuyến ngầm định, thăm dò và lệnh CLI ưu tiên dùng.
- Nếu bạn có nhiều tài khoản và một tài khoản có tên đúng là `default`, OpenClaw sẽ dùng ngầm định tài khoản đó ngay cả khi chưa đặt `defaultAccount`.
- Nếu bạn có nhiều tài khoản được đặt tên và chưa chọn mặc định, các lệnh CLI sẽ từ chối đoán - hãy đặt `defaultAccount` hoặc truyền `--account <id>`.
- Khối `channels.matrix.*` cấp cao nhất chỉ được xem là tài khoản `default` ngầm định khi thông tin xác thực của nó đầy đủ (`homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`). Các tài khoản được đặt tên vẫn có thể được phát hiện từ `homeserver` + `userId` sau khi thông tin xác thực đã lưu trong bộ nhớ đệm bao phủ xác thực.

**Nâng cấp:**

- Khi OpenClaw nâng cấp cấu hình một tài khoản thành nhiều tài khoản trong quá trình sửa chữa hoặc thiết lập, nó giữ nguyên tài khoản được đặt tên hiện có nếu có hoặc nếu `defaultAccount` đã trỏ đến một tài khoản. Chỉ các khóa xác thực/bootstrap của Matrix được chuyển vào tài khoản đã nâng cấp; các khóa chính sách gửi dùng chung vẫn ở cấp cao nhất.

Xem [Tham chiếu cấu hình](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu nhiều tài khoản dùng chung.

## Homeserver riêng tư/LAN

Theo mặc định, OpenClaw chặn các homeserver Matrix riêng tư/nội bộ để bảo vệ khỏi SSRF trừ khi bạn
chủ động bật theo từng tài khoản.

Nếu homeserver của bạn chạy trên localhost, IP LAN/Tailscale hoặc hostname nội bộ, hãy bật
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

Tùy chọn bật này chỉ cho phép các mục tiêu riêng tư/nội bộ đáng tin cậy. Các homeserver công khai không mã hóa như
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
OpenClaw dùng cùng thiết lập proxy cho lưu lượng Matrix khi chạy và các lần thăm dò trạng thái tài khoản.

## Phân giải mục tiêu

Matrix chấp nhận các dạng mục tiêu này ở mọi nơi OpenClaw yêu cầu bạn nhập mục tiêu phòng hoặc người dùng:

- Người dùng: `@user:server`, `user:@user:server`, hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server`, hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server`, hoặc `matrix:channel:#alias:server`

ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy dùng đúng cách viết hoa/thường của ID phòng từ Matrix
khi cấu hình mục tiêu gửi rõ ràng, cron job, liên kết hoặc allowlist.
OpenClaw giữ các khóa phiên nội bộ ở dạng chuẩn để lưu trữ, vì vậy các khóa chữ thường đó
không phải là nguồn đáng tin cậy cho ID gửi của Matrix.

Tra cứu thư mục trực tiếp dùng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng truy vấn thư mục người dùng Matrix trên homeserver đó.
- Tra cứu phòng chấp nhận trực tiếp ID phòng và bí danh rõ ràng. Tra cứu tên phòng đã tham gia là nỗ lực tối đa và chỉ áp dụng cho allowlist phòng khi chạy nếu đặt `dangerouslyAllowNameMatching: true`.
- Nếu tên phòng không thể được phân giải thành ID hoặc bí danh, nó sẽ bị bỏ qua trong quá trình phân giải allowlist khi chạy.

## Tham chiếu cấu hình

Các trường người dùng kiểu allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) chấp nhận ID người dùng Matrix đầy đủ (an toàn nhất). Các mục người dùng không phải ID bị bỏ qua theo mặc định. Nếu bạn đặt `dangerouslyAllowNameMatching: true`, các kết quả khớp chính xác với tên hiển thị trong thư mục Matrix được phân giải khi khởi động và bất cứ khi nào allowlist thay đổi trong lúc trình giám sát đang chạy; các mục không thể phân giải sẽ bị bỏ qua khi chạy.

Các khóa allowlist phòng (`groups`, `rooms` cũ) nên là ID phòng hoặc bí danh. Các khóa là tên phòng thuần túy bị bỏ qua theo mặc định; `dangerouslyAllowNameMatching: true` khôi phục tra cứu nỗ lực tối đa dựa trên tên phòng đã tham gia.

### Tài khoản và kết nối

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn hiển thị tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi cấu hình nhiều tài khoản Matrix.
- `accounts`: các ghi đè theo từng tài khoản được đặt tên. Các giá trị `channels.matrix` cấp cao nhất được kế thừa làm mặc định.
- `homeserver`: URL homeserver, ví dụ `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: cho phép tài khoản này kết nối tới `localhost`, IP LAN/Tailscale hoặc hostname nội bộ.
- `proxy`: URL proxy HTTP(S) tùy chọn cho lưu lượng Matrix. Hỗ trợ ghi đè theo từng tài khoản.
- `userId`: ID người dùng Matrix đầy đủ (`@bot:example.org`).
- `accessToken`: token truy cập cho xác thực dựa trên token. Hỗ trợ giá trị văn bản thuần và SecretRef qua các provider env/file/exec ([Quản lý bí mật](/vi/gateway/secrets)).
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu. Hỗ trợ giá trị văn bản thuần và SecretRef.
- `deviceId`: ID thiết bị Matrix rõ ràng.
- `deviceName`: tên hiển thị thiết bị dùng tại thời điểm đăng nhập bằng mật khẩu.
- `avatarUrl`: URL ảnh đại diện tự thân đã lưu để đồng bộ hồ sơ và cập nhật `profile set`.
- `initialSyncLimit`: số lượng sự kiện tối đa được tải trong đồng bộ khởi động.

### Mã hóa

- `encryption`: bật E2EE. Mặc định: `false`.
- `startupVerification`: `"if-unverified"` (mặc định khi bật E2EE) hoặc `"off"`. Tự động yêu cầu tự xác minh khi khởi động nếu thiết bị này chưa được xác minh.
- `startupVerificationCooldownHours`: thời gian chờ trước yêu cầu khởi động tự động tiếp theo. Mặc định: `24`.

### Truy cập và chính sách

- `groupPolicy`: `"open"`, `"allowlist"`, hoặc `"disabled"`. Mặc định: `"allowlist"`.
- `groupAllowFrom`: allowlist ID người dùng cho lưu lượng phòng.
- `mentionPatterns`: các mẫu regex theo phạm vi cho lượt nhắc trong phòng. Đối tượng với `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Kiểm soát việc `agents.list[].groupChat.mentionPatterns` đã cấu hình có áp dụng theo từng phòng hay không.
- `dm.enabled`: khi `false`, bỏ qua tất cả DM. Mặc định: `true`.
- `dm.policy`: `"pairing"` (mặc định), `"allowlist"`, `"open"`, hoặc `"disabled"`. Áp dụng sau khi bot đã tham gia và phân loại phòng là DM; không ảnh hưởng đến xử lý lời mời.
- `dm.allowFrom`: allowlist ID người dùng cho lưu lượng DM.
- `dm.sessionScope`: `"per-user"` (mặc định) hoặc `"per-room"`.
- `dm.threadReplies`: ghi đè chỉ cho DM đối với phân luồng trả lời (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: chấp nhận tin nhắn từ các tài khoản bot Matrix đã cấu hình khác (`true` hoặc `"mentions"`).
- `allowlistOnly`: khi `true`, buộc tất cả chính sách DM đang hoạt động (ngoại trừ `"disabled"`) và chính sách phòng `"open"` thành `"allowlist"`. Không thay đổi chính sách `"disabled"`.
- `dangerouslyAllowNameMatching`: khi `true`, cho phép tra cứu thư mục tên hiển thị Matrix cho các mục allowlist người dùng và tra cứu tên phòng đã tham gia cho khóa allowlist phòng. Ưu tiên ID `@user:server` đầy đủ và ID phòng hoặc bí danh.
- `autoJoin`: `"always"`, `"allowlist"`, hoặc `"off"`. Mặc định: `"off"`. Áp dụng cho mọi lời mời Matrix, bao gồm lời mời kiểu DM.
- `autoJoinAllowlist`: các phòng/bí danh được cho phép khi `autoJoin` là `"allowlist"`. Các mục bí danh được phân giải dựa trên homeserver, không dựa trên trạng thái do phòng mời tuyên bố.
- `contextVisibility`: mức hiển thị ngữ cảnh bổ sung (`"all"` mặc định, `"allowlist"`, `"allowlist_quote"`).

### Hành vi trả lời

- `replyToMode`: `"off"`, `"first"`, `"all"`, hoặc `"batched"`.
- `threadReplies`: `"off"`, `"inbound"`, hoặc `"always"`.
- `threadBindings`: ghi đè theo từng kênh cho định tuyến phiên gắn với luồng và vòng đời.
- `streaming`: `"off"` (mặc định), `"partial"`, `"quiet"`, `"progress"`, hoặc dạng đối tượng `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: khi `true`, các khối assistant đã hoàn tất được giữ làm thông báo tiến độ riêng.
- `markdown`: cấu hình hiển thị Markdown tùy chọn cho văn bản gửi đi.
- `responsePrefix`: chuỗi tùy chọn được thêm vào đầu các phản hồi gửi đi.
- `textChunkLimit`: kích thước đoạn gửi đi tính bằng ký tự khi `chunkMode: "length"`. Mặc định: `4000`.
- `chunkMode`: `"length"` (mặc định, tách theo số ký tự) hoặc `"newline"` (tách tại ranh giới dòng).
- `historyLimit`: số lượng tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng kích hoạt agent. Dự phòng về `messages.groupChat.historyLimit`; mặc định hiệu lực là `0` (tắt).
- `mediaMaxMb`: giới hạn kích thước media tính bằng MB cho gửi đi và xử lý gửi đến.

### Thiết lập phản ứng

- `ackReaction`: ghi đè phản ứng xác nhận cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi (`"group-mentions"` mặc định, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: chế độ thông báo phản ứng gửi đến (`"own"` mặc định, `"off"`).

### Công cụ và ghi đè theo từng phòng

- `actions`: kiểm soát công cụ theo từng hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: bản đồ chính sách theo từng phòng. Danh tính phiên sử dụng ID phòng ổn định sau khi phân giải. (`rooms` là bí danh cũ.)
  - `groups.<room>.account`: giới hạn một mục phòng được kế thừa cho một tài khoản cụ thể.
  - `groups.<room>.enabled`: nút bật/tắt theo từng phòng. Khi là `false`, phòng bị bỏ qua như thể không có trong bản đồ.
  - `groups.<room>.requireMention`: ghi đè theo từng phòng cho yêu cầu nhắc đến ở cấp kênh.
  - `groups.<room>.allowBots`: ghi đè theo từng phòng cho cài đặt cấp kênh (`true` hoặc `"mentions"`).
  - `groups.<room>.botLoopProtection`: ghi đè theo từng phòng cho ngân sách bảo vệ vòng lặp bot-với-bot.
  - `groups.<room>.users`: danh sách cho phép người gửi theo từng phòng.
  - `groups.<room>.tools`: ghi đè cho phép/từ chối công cụ theo từng phòng.
  - `groups.<room>.autoReply`: ghi đè kiểm soát theo nhắc đến theo từng phòng. `true` tắt yêu cầu nhắc đến cho phòng đó; `false` buộc bật lại yêu cầu này.
  - `groups.<room>.skills`: bộ lọc skill theo từng phòng.
  - `groups.<room>.systemPrompt`: đoạn prompt hệ thống theo từng phòng.

### Cài đặt phê duyệt exec

- `execApprovals.enabled`: gửi phê duyệt exec qua lời nhắc gốc của Matrix.
- `execApprovals.approvers`: ID người dùng Matrix được phép phê duyệt. Dự phòng về `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (mặc định), `"channel"`, hoặc `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: danh sách cho phép tác tử/phiên tùy chọn để gửi.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát theo nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố
