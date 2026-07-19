---
read_when:
    - Thiết lập Matrix trong OpenClaw
    - Cấu hình E2EE và xác minh cho Matrix
summary: Trạng thái hỗ trợ, thiết lập và ví dụ cấu hình Matrix
title: Matrix
x-i18n:
    generated_at: "2026-07-19T05:36:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eabcc867ec210f57f9192b93b7bcb9d02dfb91d19eb73f5a6e3170fdf97ffdc2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix là một Plugin kênh có thể tải xuống (`@openclaw/matrix`), được xây dựng trên `matrix-js-sdk` chính thức. Plugin hỗ trợ tin nhắn trực tiếp, phòng, luồng, nội dung đa phương tiện, phản ứng, cuộc thăm dò, vị trí và E2EE.

## Cài đặt

```bash
openclaw plugins install @openclaw/matrix
```

Thông số Plugin thuần sẽ thử ClawHub trước, sau đó chuyển sang npm nếu không thành công. Buộc sử dụng một nguồn bằng `openclaw plugins install clawhub:@openclaw/matrix` hoặc `npm:@openclaw/matrix`. Từ bản checkout cục bộ: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` đăng ký và bật Plugin; không cần bước `enable` riêng. Kênh vẫn không hoạt động cho đến khi được cấu hình bên dưới. Xem [Plugin](/vi/tools/plugin) để biết các quy tắc cài đặt chung.

## Thiết lập

1. Tạo một tài khoản Matrix trên homeserver của bạn.
2. Cấu hình `channels.matrix` bằng `homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`.
3. Khởi động lại Gateway.
4. Bắt đầu nhắn tin trực tiếp với bot hoặc mời bot vào một phòng. Lời mời mới chỉ được chấp nhận khi [`autoJoin`](#auto-join) cho phép.

### Thiết lập tương tác

```bash
openclaw channels add
openclaw configure --section channels
```

Trình hướng dẫn yêu cầu URL homeserver, phương thức xác thực (token hoặc mật khẩu), ID người dùng (chỉ với xác thực bằng mật khẩu), tên thiết bị tùy chọn, có bật E2EE hay không, cùng quyền truy cập phòng/tự động tham gia. Nếu các biến môi trường `MATRIX_*` tương ứng đã tồn tại và tài khoản chưa lưu thông tin xác thực, trình hướng dẫn sẽ cung cấp lối tắt dùng biến môi trường. Phân giải tên phòng trước khi lưu danh sách cho phép bằng `openclaw channels resolve --channel matrix "Project Room"`. Việc bật E2EE trong trình hướng dẫn sẽ chạy cùng quy trình khởi tạo như [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` mặc định là `"off"`: bot sẽ không xuất hiện trong phòng hoặc tin nhắn trực tiếp mới từ lời mời mới cho đến khi bạn tham gia thủ công. Tại thời điểm nhận lời mời, OpenClaw không thể xác định lời mời đó dành cho cuộc trò chuyện trực tiếp hay nhóm, vì vậy mọi lời mời đều đi qua `autoJoin` trước; `dm.policy` chỉ áp dụng sau đó, khi bot đã tham gia và phòng đã được phân loại.

<Warning>
Đặt `autoJoin: "allowlist"` cùng `autoJoinAllowlist` để giới hạn các lời mời được chấp nhận, hoặc `autoJoin: "always"` để chấp nhận mọi lời mời.

`autoJoinAllowlist` chỉ chấp nhận `!roomId:server`, `#alias:server` hoặc `*`. Tên phòng thuần bị từ chối; bí danh được phân giải dựa trên homeserver, không dựa trên trạng thái mà phòng gửi lời mời khai báo.
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

- Tin nhắn trực tiếp (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): sử dụng `@user:server`. Tên hiển thị mặc định bị bỏ qua (có thể thay đổi); chỉ đặt `dangerouslyAllowNameMatching: true` để tương thích rõ ràng với tên hiển thị.
- Khóa danh sách cho phép của phòng (`groups`, bí danh cũ `rooms`): sử dụng `!room:server` hoặc `#alias:server`. Tên thuần bị bỏ qua trừ khi `dangerouslyAllowNameMatching: true`.
- Danh sách cho phép lời mời (`autoJoinAllowlist`): sử dụng `!room:server`, `#alias:server` hoặc `*`. Tên thuần luôn bị từ chối.

### Chuẩn hóa ID tài khoản

Trình hướng dẫn chuyển đổi tên thân thiện thành ID tài khoản đã chuẩn hóa (`Ops Bot` -> `ops-bot`). Dấu câu được thoát bằng mã thập lục phân trong tên biến môi trường theo phạm vi để các tài khoản không thể xung đột: `-` (0x2D) trở thành `_X2D_`, vì vậy `ops-prod` ánh xạ đến tiền tố biến môi trường `MATRIX_OPS_X2D_PROD_`.

### Thông tin xác thực được lưu vào bộ nhớ đệm

Matrix lưu thông tin xác thực tài khoản vào trạng thái Plugin `state/openclaw.sqlite` dùng chung. Khi có thông tin xác thực được lưu vào bộ nhớ đệm, OpenClaw coi Matrix là đã được cấu hình ngay cả khi không có `accessToken` trong tệp cấu hình — điều này áp dụng cho quá trình thiết lập, `openclaw doctor` và các phép thăm dò trạng thái kênh. Khi nâng cấp, các tệp `~/.openclaw/credentials/matrix/credentials*.json` đã ngừng sử dụng được nhập thông qua `openclaw doctor --fix`, các hàng SQLite được xác minh, sau đó các tệp được lưu trữ.

### Biến môi trường

Các biến môi trường được hậu thuẫn bởi khóa cấu hình, dùng khi khóa cấu hình tương đương chưa được đặt. Tài khoản mặc định sử dụng tên không có tiền tố; tài khoản được đặt tên sẽ chèn token tài khoản trước hậu tố (xem phần [chuẩn hóa](#account-id-normalization)).

| Tài khoản mặc định       | Tài khoản được đặt tên (`<ID>` = token tài khoản) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Đối với tài khoản `ops`, các tên trở thành `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, v.v. `MATRIX_HOMESERVER` (và mọi biến thể `*_HOMESERVER` theo phạm vi) không thể được đặt từ `.env` của không gian làm việc; xem [Các tệp `.env` của không gian làm việc](/vi/gateway/security).

<Note>
Khóa khôi phục không phải là biến môi trường được hậu thuẫn bởi cấu hình: OpenClaw không bao giờ tự đọc khóa này từ môi trường. Văn bản hướng dẫn CLI đề xuất chuyển khóa qua đường ống bằng biến shell có tên `MATRIX_RECOVERY_KEY` cho tài khoản mặc định, hoặc `MATRIX_RECOVERY_KEY_<ID>` (ID tài khoản viết hoa thuần, không thoát bằng mã thập lục phân) cho tài khoản được đặt tên — xem [Xác minh thiết bị này bằng khóa khôi phục](#verify-this-device-with-a-recovery-key).
</Note>

## Ví dụ cấu hình

Cấu hình cơ sở thực tế với ghép đôi tin nhắn trực tiếp, danh sách cho phép của phòng và E2EE:

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

## Bản xem trước truyền trực tuyến

Tính năng truyền trực tuyến phản hồi Matrix là tùy chọn chủ động. `streaming.mode` kiểm soát cách OpenClaw gửi phản hồi đang được tạo của trợ lý; `streaming.block.enabled` kiểm soát việc mỗi khối đã hoàn thành có được giữ lại dưới dạng một tin nhắn Matrix riêng hay không.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

Để giữ bản xem trước trực tiếp của câu trả lời nhưng ẩn các dòng công cụ/tiến trình tạm thời:

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
          label: "auto", // chọn từ nhãn đã cấu hình hoặc nhãn tích hợp sẵn (false để ẩn)
          labels: ["Đang suy nghĩ", "Đang viết", "Đang tìm kiếm"], // ứng viên cho label: "auto"
          maxLines: 8, // số dòng tiến trình luân phiên tối đa (mặc định: 8)
          maxLineChars: 120, // số ký tự tối đa mỗi dòng trước khi cắt bớt (mặc định: 120)
          toolProgress: true, // hiển thị hoạt động công cụ/tiến trình (mặc định: true)
        },
      },
    },
  },
}
```

- `progress.label`: nhãn tùy chỉnh, `"auto"`/không đặt để chọn nhãn đã cấu hình hoặc tích hợp sẵn, hoặc `false` để ẩn nhãn.
- `progress.labels`: các ứng viên chỉ được sử dụng khi `label` là `"auto"` hoặc chưa được đặt.
- `progress.maxLines`: số dòng tiến trình luân phiên tối đa được giữ trong bản nháp; các dòng cũ hơn sẽ bị cắt bỏ khi vượt quá giới hạn này.
- `progress.maxLineChars`: số ký tự tối đa trên mỗi dòng tiến trình thu gọn trước khi bị cắt bớt.
- `progress.toolProgress`: khi là `true` (mặc định), hoạt động công cụ/tiến trình trực tiếp xuất hiện trong bản nháp.

| `streaming.mode`  | Hành vi                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (mặc định) | Chờ phản hồi đầy đủ rồi gửi một lần.                                                                                                                      |
| `"partial"`       | Chỉnh sửa tại chỗ một tin nhắn văn bản thông thường khi mô hình viết khối hiện tại. Ứng dụng khách tiêu chuẩn có thể thông báo ở bản xem trước đầu tiên thay vì lần chỉnh sửa cuối cùng.          |
| `"quiet"`         | Giống `"partial"` nhưng tin nhắn là thông báo không kích hoạt thông báo. Người nhận được thông báo khi quy tắc đẩy riêng cho từng người dùng khớp với lần chỉnh sửa đã hoàn tất (xem bên dưới). |
| `"progress"`      | Gửi từng dòng tiến trình thu gọn bằng bản nháp tiến trình.                                                                                          |

`streaming.block.enabled` (mặc định `false`) độc lập với `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (mặc định)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Bản nháp trực tiếp cho khối hiện tại, các khối đã hoàn thành được giữ dưới dạng tin nhắn | Bản nháp trực tiếp cho khối hiện tại, được hoàn tất tại chỗ |
| `"off"`                 | Một tin nhắn Matrix có thông báo cho mỗi khối đã hoàn tất                     | Một tin nhắn Matrix có thông báo cho toàn bộ phản hồi      |

Ghi chú:

- Nếu bản xem trước vượt quá giới hạn kích thước mỗi sự kiện của Matrix, OpenClaw sẽ dừng truyền trực tuyến bản xem trước và chuyển sang chỉ gửi kết quả cuối cùng.
- Phản hồi đa phương tiện luôn gửi tệp đính kèm theo cách thông thường; nếu không thể tái sử dụng an toàn bản xem trước cũ, OpenClaw sẽ xóa bản xem trước đó trước khi gửi phản hồi đa phương tiện cuối cùng.
- Các bản cập nhật xem trước tiến trình công cụ được bật theo mặc định khi tính năng truyền trực tuyến bản xem trước đang hoạt động. Đặt `streaming.preview.toolProgress: false` để giữ các lần chỉnh sửa bản xem trước cho nội dung câu trả lời nhưng để tiến trình công cụ đi theo đường gửi thông thường.
- Các lần chỉnh sửa bản xem trước làm phát sinh thêm lệnh gọi API Matrix. Giữ `streaming.mode: "off"` để có cấu hình giới hạn tốc độ thận trọng nhất.
- Các giá trị vô hướng/boolean cũ của `streaming` và các khóa phẳng `blockStreaming` / `chunkMode` được `openclaw doctor --fix` ghi lại thành cấu trúc lồng nhau này.

## Tin nhắn thoại

Ghi chú thoại Matrix đến được phiên âm trước cổng kiểm tra lượt đề cập trong phòng, vì vậy ghi chú thoại có nói tên bot có thể kích hoạt tác nhân trong phòng `requireMention: true`, và tác nhân nhận được bản chép lời thay vì chỉ nhận phần giữ chỗ cho tệp âm thanh đính kèm.

Matrix sử dụng nhà cung cấp nội dung âm thanh dùng chung trong `tools.media.audio`, chẳng hạn như `gpt-4o-mini-transcribe` của OpenAI. Xem [Tổng quan về công cụ đa phương tiện](/vi/tools/media-overview) để biết cách thiết lập nhà cung cấp và các giới hạn.

- Các sự kiện `m.audio` và sự kiện `m.file` có kiểu MIME `audio/*` đều đủ điều kiện.
- Trong các phòng được mã hóa, OpenClaw giải mã tệp đính kèm qua đường dẫn phương tiện Matrix hiện có trước khi chuyển lời nói thành văn bản.
- Bản chép lời được đánh dấu là do máy tạo và không đáng tin cậy trong prompt của agent.
- Tệp đính kèm được đánh dấu là đã được chép lời để các công cụ phương tiện ở hạ nguồn không chép lời lại.
- Đặt `tools.media.audio.enabled: false` để tắt tính năng chép lời âm thanh trên toàn hệ thống.

## Siêu dữ liệu phê duyệt

Các prompt phê duyệt gốc của Matrix là những sự kiện `m.room.message` thông thường với nội dung dành riêng cho OpenClaw trong khóa `com.openclaw.approval`. Các client tiêu chuẩn vẫn hiển thị phần nội dung văn bản; các client hỗ trợ OpenClaw có thể đọc mã định danh phê duyệt có cấu trúc, loại, trạng thái, quyết định và chi tiết thực thi/plugin.

Khi một prompt quá dài đối với một sự kiện Matrix, OpenClaw chia văn bản hiển thị thành nhiều phần và chỉ đính kèm `com.openclaw.approval` vào phần đầu tiên. Các phản ứng cho phép/từ chối được liên kết với sự kiện đầu tiên đó, vì vậy prompt dài vẫn có cùng mục tiêu phê duyệt như prompt chỉ có một sự kiện.

### Quy tắc push tự lưu trữ cho bản xem trước đã hoàn tất ở chế độ im lặng

`streaming.mode: "quiet"` chỉ thông báo cho người nhận sau khi một khối hoặc lượt đã hoàn tất - quy tắc push theo từng người dùng phải khớp với dấu hiệu bản xem trước đã hoàn tất. Xem [Quy tắc push Matrix cho bản xem trước ở chế độ im lặng](/vi/channels/matrix-push-rules) để biết công thức đầy đủ.

## Phòng bot-với-bot

Theo mặc định, các tin nhắn Matrix từ những tài khoản Matrix OpenClaw đã cấu hình khác sẽ bị bỏ qua. Dùng `allowBots` để chủ động cho phép lưu lượng giữa các agent:

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

- `allowBots: true` chấp nhận tin nhắn từ các tài khoản bot Matrix đã cấu hình khác trong các phòng được phép và tin nhắn trực tiếp.
- `allowBots: "mentions"` chỉ chấp nhận các tin nhắn đó khi chúng đề cập rõ ràng đến bot này trong phòng; tin nhắn trực tiếp vẫn luôn được phép.
- `groups.<room>.allowBots` ghi đè cài đặt cấp tài khoản cho một phòng.
- Các tin nhắn được chấp nhận từ bot đã cấu hình sử dụng [cơ chế bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung. Cấu hình `channels.defaults.botLoopProtection`, sau đó ghi đè theo từng tài khoản bằng `channels.matrix.botLoopProtection` hoặc theo từng phòng bằng `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng một ID người dùng Matrix để tránh vòng lặp tự phản hồi.
- Matrix không có cờ bot gốc; OpenClaw coi "do bot tạo" là "được gửi bởi một tài khoản Matrix đã cấu hình khác trên Gateway OpenClaw này".

Hãy dùng danh sách phòng được phép nghiêm ngặt và yêu cầu đề cập khi bật lưu lượng bot-với-bot trong các phòng dùng chung.

## Mã hóa và xác minh

Trong các phòng được mã hóa (E2EE), sự kiện hình ảnh gửi đi sử dụng `thumbnail_file` để bản xem trước hình ảnh được mã hóa cùng với toàn bộ tệp đính kèm; các phòng không mã hóa sử dụng `thumbnail_url` thuần túy. Không cần cấu hình - plugin tự động phát hiện trạng thái E2EE.

Tất cả lệnh `openclaw matrix` đều chấp nhận `--verbose` (chẩn đoán đầy đủ), `--json` (đầu ra máy có thể đọc) và `--account <id>` (thiết lập nhiều tài khoản). Theo mặc định, đầu ra được trình bày ngắn gọn.

### Bật mã hóa

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Khởi tạo kho lưu trữ bí mật và ký chéo, tạo bản sao lưu khóa phòng nếu cần, sau đó in trạng thái và các bước tiếp theo. Các cờ hữu ích:

- `--recovery-key-stdin` đọc khóa khôi phục từ stdin mà không để lộ khóa trong đối số tiến trình; `--recovery-key <key>` vẫn khả dụng để đảm bảo tương thích
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

- `Locally trusted`: chỉ được client này tin cậy
- `Cross-signing verified`: SDK báo cáo xác minh qua ký chéo
- `Signed by owner`: được ký bằng khóa tự ký của chính bạn (chỉ dùng cho chẩn đoán)

`Verified by owner` chỉ là `yes` khi `Cross-signing verified` là `yes`; chỉ có độ tin cậy cục bộ hoặc chữ ký của chủ sở hữu là chưa đủ.

`--allow-degraded-local-state` trả về dữ liệu chẩn đoán theo khả năng tốt nhất mà không cần chuẩn bị tài khoản Matrix trước; hữu ích cho các phép thăm dò ngoại tuyến hoặc được cấu hình một phần.

### Xác minh thiết bị này bằng khóa khôi phục

Truyền khóa khôi phục qua stdin thay vì đưa khóa vào dòng lệnh:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Lệnh báo cáo ba trạng thái:

- `Recovery key accepted`: Matrix đã chấp nhận khóa cho kho lưu trữ bí mật hoặc độ tin cậy thiết bị.
- `Backup usable`: có thể tải bản sao lưu khóa phòng bằng dữ liệu khôi phục đáng tin cậy.
- `Device verified by owner`: thiết bị này có độ tin cậy đầy đủ đối với danh tính ký chéo Matrix.

Lệnh thoát với mã khác 0 khi độ tin cậy danh tính đầy đủ chưa hoàn tất, ngay cả khi khóa khôi phục đã mở khóa dữ liệu sao lưu. Trong trường hợp đó, hãy hoàn tất việc tự xác minh từ một client Matrix khác:

```bash
openclaw matrix verify self
```

`verify self` chờ `Cross-signing verified: yes` trước khi thoát thành công. Dùng `--timeout-ms <ms>` để điều chỉnh thời gian chờ.

Dạng khóa trực tiếp `openclaw matrix verify device "<recovery-key>"` cũng hoạt động, nhưng khóa sẽ được lưu trong lịch sử shell.

### Khởi tạo hoặc sửa chữa ký chéo

```bash
openclaw matrix verify bootstrap
```

Lệnh sửa chữa/thiết lập dành cho tài khoản được mã hóa. Theo thứ tự, lệnh:

- khởi tạo kho lưu trữ bí mật, tái sử dụng khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa công khai còn thiếu
- đánh dấu và ký chéo thiết bị hiện tại
- tạo bản sao lưu khóa phòng phía máy chủ nếu chưa có

Nếu homeserver yêu cầu UIA để tải lên khóa ký chéo, OpenClaw trước tiên thử không xác thực, sau đó `m.login.dummy`, rồi `m.login.password` (yêu cầu `channels.matrix.password`).

Các cờ hữu ích:

- `--recovery-key-stdin` (dùng cùng `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) hoặc `--recovery-key <key>`
- `--force-reset-cross-signing` để loại bỏ danh tính ký chéo hiện tại (chỉ sử dụng có chủ đích; yêu cầu khóa khôi phục đang hoạt động được lưu trữ hoặc cung cấp bằng `--recovery-key-stdin`)

### Bản sao lưu khóa phòng

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` cho biết có bản sao lưu phía máy chủ hay không và thiết bị này có thể giải mã bản sao lưu đó hay không. `backup restore` nhập các khóa phòng đã sao lưu vào kho mật mã cục bộ; bỏ qua `--recovery-key-stdin` nếu khóa khôi phục đã có trên đĩa.

Để thay thế bản sao lưu bị hỏng bằng một đường cơ sở mới (chấp nhận mất lịch sử cũ không thể khôi phục; cũng có thể tạo lại kho lưu trữ bí mật nếu không thể tải bí mật sao lưu hiện tại):

```bash
openclaw matrix verify backup reset --yes
```

Chỉ thêm `--rotate-recovery-key` khi bạn chủ động muốn khóa khôi phục trước đó không còn mở khóa được đường cơ sở sao lưu mới.

### Liệt kê, yêu cầu và phản hồi các phiên xác minh

```bash
openclaw matrix verify list
```

Liệt kê các yêu cầu xác minh đang chờ xử lý cho tài khoản đã chọn.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Gửi yêu cầu xác minh từ tài khoản này. `--own-user` yêu cầu tự xác minh (chấp nhận prompt trong một client Matrix khác của cùng người dùng); `--user-id`/`--device-id`/`--room-id` nhắm đến người khác. Không thể kết hợp `--own-user` với các cờ nhắm mục tiêu khác.

Để xử lý vòng đời ở cấp thấp hơn - thường là khi theo dõi song song các yêu cầu đến từ một client khác - các lệnh này tác động lên một yêu cầu `<id>` cụ thể (do `verify list` và `verify request` in ra):

| Lệnh                                       | Mục đích                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Chấp nhận yêu cầu đến                                                |
| `openclaw matrix verify start <id>`        | Bắt đầu luồng SAS                                                    |
| `openclaw matrix verify sas <id>`          | In biểu tượng cảm xúc hoặc số thập phân SAS                          |
| `openclaw matrix verify confirm-sas <id>`  | Xác nhận rằng SAS khớp với nội dung client kia hiển thị              |
| `openclaw matrix verify mismatch-sas <id>` | Từ chối SAS khi biểu tượng cảm xúc hoặc số thập phân không khớp      |
| `openclaw matrix verify cancel <id>`       | Hủy; nhận `--reason <text>` và `--code <matrix-code>` tùy chọn |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` và `cancel` đều chấp nhận `--user-id` và `--room-id` làm gợi ý theo dõi tin nhắn trực tiếp khi phiên xác minh được neo vào một phòng tin nhắn trực tiếp cụ thể.

### Lưu ý về nhiều tài khoản

Nếu không có `--account <id>`, các lệnh CLI Matrix sử dụng tài khoản mặc định ngầm định. Khi có nhiều tài khoản được đặt tên nhưng không có `channels.matrix.defaultAccount`, các lệnh sẽ không tự phỏng đoán và yêu cầu bạn chọn. Khi E2EE bị tắt hoặc không khả dụng cho một tài khoản được đặt tên, lỗi sẽ trỏ đến khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Hành vi khi khởi động">
    Với `encryption: true`, `startupVerification` mặc định là `"if-unverified"`. Khi khởi động, thiết bị chưa được xác minh sẽ yêu cầu tự xác minh trong một client Matrix khác, bỏ qua các yêu cầu trùng lặp và áp dụng thời gian hồi (mặc định là 24 giờ). Điều chỉnh bằng `startupVerificationCooldownHours` hoặc tắt bằng `startupVerification: "off"`.

    Quá trình khởi động cũng chạy một lượt khởi tạo mật mã thận trọng, tái sử dụng kho lưu trữ bí mật và danh tính ký chéo hiện tại. Nếu trạng thái khởi tạo bị hỏng, OpenClaw sẽ thử sửa chữa có kiểm soát ngay cả khi không có `channels.matrix.password`; nếu homeserver yêu cầu UIA bằng mật khẩu, quá trình khởi động sẽ ghi cảnh báo và không coi đó là lỗi nghiêm trọng. Các thiết bị đã được chủ sở hữu ký sẽ được giữ nguyên.

    Xem [Di chuyển Matrix](/vi/channels/matrix-migration) để biết toàn bộ luồng nâng cấp.

  </Accordion>

  <Accordion title="Thông báo xác minh">
    Matrix đăng các thông báo về vòng đời xác minh vào phòng xác minh tin nhắn trực tiếp nghiêm ngặt dưới dạng tin nhắn `m.notice`: yêu cầu, sẵn sàng (kèm hướng dẫn "Xác minh bằng biểu tượng cảm xúc"), bắt đầu/hoàn tất và chi tiết SAS (biểu tượng cảm xúc/số thập phân) khi có.

    Các yêu cầu đến từ một client Matrix khác được theo dõi và tự động chấp nhận. Đối với tự xác minh, OpenClaw tự động bắt đầu luồng SAS và xác nhận phía của mình khi tính năng xác minh bằng biểu tượng cảm xúc khả dụng - bạn vẫn cần so sánh và xác nhận "They match" trong client Matrix của mình.

    Các thông báo hệ thống xác minh không được chuyển tiếp đến pipeline trò chuyện của agent.

  </Accordion>

  <Accordion title="Thiết bị Matrix đã bị xóa hoặc không hợp lệ">
    Nếu `verify status` cho biết thiết bị hiện tại không còn được liệt kê trên homeserver, hãy tạo một thiết bị Matrix OpenClaw mới. Đối với đăng nhập bằng mật khẩu:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Đối với xác thực bằng token, hãy tạo access token mới trong client Matrix hoặc giao diện quản trị, sau đó cập nhật OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Thay `assistant` bằng ID tài khoản từ lệnh bị lỗi, hoặc bỏ qua `--account` đối với tài khoản mặc định.

  </Accordion>

  <Accordion title="Quản lý thiết bị">
    Các thiết bị cũ do OpenClaw quản lý có thể tích tụ. Liệt kê và dọn dẹp:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Kho mã hóa">
    E2EE của Matrix sử dụng đường dẫn mã hóa Rust chính thức `matrix-js-sdk` với `fake-indexeddb` làm lớp tương thích IndexedDB. Trạng thái mã hóa được lưu bền vững tại `crypto-idb-snapshot.json` (quyền truy cập tệp hạn chế).

    Trạng thái runtime được mã hóa nằm trong `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` và bao gồm kho đồng bộ, kho mã hóa, khóa khôi phục, ảnh chụp nhanh IDB, các liên kết luồng và trạng thái xác minh khi khởi động. Khi token thay đổi nhưng danh tính tài khoản vẫn giữ nguyên, OpenClaw tái sử dụng thư mục gốc hiện có phù hợp nhất để trạng thái trước đó vẫn hiển thị.

    Một thư mục gốc băm theo token cũ duy nhất có thể là đường dẫn duy trì tính liên tục bình thường khi xoay vòng token. Nếu OpenClaw ghi nhật ký `matrix: multiple populated token-hash storage roots detected`, hãy kiểm tra thư mục tài khoản và chỉ lưu trữ các thư mục gốc cùng cấp đã lỗi thời sau khi xác nhận thư mục gốc đang hoạt động được chọn vẫn ổn định. Nên di chuyển các thư mục gốc lỗi thời vào thư mục `_archive/` thay vì xóa chúng ngay lập tức.

  </Accordion>
</AccordionGroup>

## Quản lý hồ sơ

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Truyền cả hai tùy chọn trong một lần gọi. Matrix chấp nhận trực tiếp các URL ảnh đại diện `mxc://`; khi truyền `http://`/`https://`, tệp sẽ được tải lên trước và URL `mxc://` đã phân giải sẽ được lưu vào `channels.matrix.avatarUrl` (hoặc giá trị ghi đè theo tài khoản).

## Luồng

Matrix hỗ trợ luồng gốc cho cả phản hồi tự động và lượt gửi bằng công cụ tin nhắn. Hai tùy chọn độc lập kiểm soát hành vi:

### Định tuyến phiên (`sessionScope`)

`dm.sessionScope` quyết định cách các phòng tin nhắn trực tiếp Matrix ánh xạ tới các phiên OpenClaw:

- `"per-user"` (mặc định): tất cả phòng tin nhắn trực tiếp có cùng đối tượng ngang hàng được định tuyến sẽ dùng chung một phiên.
- `"per-room"`: mỗi phòng tin nhắn trực tiếp Matrix có khóa phiên riêng, ngay cả khi có cùng đối tượng ngang hàng.

Các liên kết cuộc trò chuyện rõ ràng luôn được ưu tiên hơn `sessionScope`; các phòng và luồng đã liên kết giữ nguyên phiên đích đã chọn.

### Phản hồi theo luồng (`threadReplies`)

`threadReplies` quyết định vị trí bot đăng phản hồi:

- `"off"`: phản hồi ở cấp cao nhất. Tin nhắn đến trong luồng vẫn ở phiên cha.
- `"inbound"`: chỉ phản hồi trong luồng khi tin nhắn đến đã nằm trong luồng đó.
- `"always"`: phản hồi trong một luồng bắt nguồn từ tin nhắn kích hoạt; cuộc trò chuyện đó được định tuyến qua một phiên tương ứng có phạm vi luồng kể từ lần kích hoạt đầu tiên.

`dm.threadReplies` ghi đè thiết lập này chỉ đối với tin nhắn trực tiếp — ví dụ: giữ các luồng trong phòng tách biệt trong khi giữ tin nhắn trực tiếp ở dạng phẳng.

### Kế thừa luồng và lệnh gạch chéo

- Tin nhắn đến trong luồng bao gồm tin nhắn gốc của luồng làm ngữ cảnh bổ sung cho tác tử.
- Các lượt gửi bằng công cụ tin nhắn tự động kế thừa luồng Matrix hiện tại khi nhắm đến cùng phòng (hoặc cùng đích người dùng tin nhắn trực tiếp), trừ khi cung cấp rõ ràng `threadId`.
- Việc tái sử dụng đích người dùng tin nhắn trực tiếp chỉ có hiệu lực khi siêu dữ liệu phiên hiện tại chứng minh đó là cùng đối tượng ngang hàng tin nhắn trực tiếp trên cùng tài khoản Matrix; nếu không, OpenClaw quay lại định tuyến thông thường theo phạm vi người dùng.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` và `/acp spawn` liên kết với luồng đều hoạt động trong các phòng và tin nhắn trực tiếp Matrix.
- `/focus` ở cấp cao nhất tạo một luồng Matrix mới và liên kết luồng đó với phiên đích khi `threadBindings.spawnSessions` được bật.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có sẽ liên kết trực tiếp luồng đó tại chỗ.

Khi OpenClaw phát hiện một phòng tin nhắn trực tiếp Matrix xung đột với một phòng tin nhắn trực tiếp khác trên cùng phiên dùng chung, hệ thống sẽ đăng một thông báo `m.notice` một lần, trỏ đến lối thoát `/focus` và đề xuất thay đổi `dm.sessionScope`. Thông báo chỉ xuất hiện khi liên kết luồng được bật.

## Liên kết cuộc trò chuyện ACP

Các phòng, tin nhắn trực tiếp và luồng Matrix hiện có có thể trở thành không gian làm việc ACP bền vững mà không thay đổi giao diện trò chuyện.

Luồng thao tác nhanh cho người vận hành:

- Chạy `/acp spawn codex --bind here` bên trong tin nhắn trực tiếp, phòng hoặc luồng Matrix hiện có để tiếp tục sử dụng.
- Trong tin nhắn trực tiếp hoặc phòng cấp cao nhất, tin nhắn trực tiếp/phòng hiện tại vẫn là giao diện trò chuyện và các tin nhắn sau đó được định tuyến đến phiên ACP đã khởi tạo.
- Bên trong một luồng hiện có, `--bind here` liên kết trực tiếp luồng hiện tại tại chỗ.
- `/new` và `/reset` đặt lại tại chỗ cùng phiên ACP đã liên kết.
- `/acp close` đóng phiên ACP và xóa liên kết.

`--bind here` không tạo luồng Matrix con. `threadBindings.spawnSessions` kiểm soát `/acp spawn --thread auto|here`, nơi OpenClaw cần tạo hoặc liên kết một luồng con.

### Cấu hình liên kết luồng

Matrix kế thừa các giá trị mặc định toàn cục từ `session.threadBindings` và hỗ trợ ghi đè theo kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: kiểm soát việc khởi tạo luồng cho cả tác tử con và ACP.
- Các khóa `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions` không còn được khuyến nghị sẽ được `openclaw doctor --fix` di chuyển sang `spawnSessions`.
- `threadBindings.defaultSpawnContext`

Việc khởi tạo phiên liên kết với luồng Matrix được bật theo mặc định. Đặt `threadBindings.spawnSessions: false` để ngăn `/focus` và `/acp spawn --thread auto|here` ở cấp cao nhất tạo/liên kết các luồng Matrix. Đặt `threadBindings.defaultSpawnContext: "isolated"` khi việc khởi tạo luồng tác tử con gốc không được phân nhánh bản chép lời của phiên cha.

## Phản ứng

Matrix hỗ trợ phản ứng gửi đi, thông báo phản ứng đến và phản ứng xác nhận.

Công cụ phản ứng gửi đi được kiểm soát bởi `channels.matrix.actions.reactions`:

- `react` thêm phản ứng vào một sự kiện Matrix.
- `reactions` liệt kê phần tổng hợp phản ứng hiện tại cho một sự kiện Matrix.
- `emoji=""` xóa các phản ứng của chính bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji đã chỉ định của bot.

**Thứ tự phân giải** (giá trị được xác định đầu tiên sẽ được dùng):

| Thiết lập                 | Thứ tự                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | theo tài khoản -> kênh -> `messages.ackReaction` -> phương án dự phòng là emoji danh tính tác tử   |
| `ackReactionScope`      | theo tài khoản -> kênh -> `messages.ackReactionScope` -> mặc định `"group-mentions"` |
| `reactionNotifications` | theo tài khoản -> kênh -> mặc định `"own"`                                           |

`reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` đã thêm khi chúng nhắm đến các tin nhắn Matrix do bot tạo; `"off"` tắt các sự kiện hệ thống phản ứng. Việc xóa phản ứng không được tổng hợp thành sự kiện hệ thống — Matrix hiển thị chúng dưới dạng biên tập xóa, không phải các lượt xóa `m.reaction` độc lập.

## Ngữ cảnh lịch sử

- `channels.matrix.historyLimit` kiểm soát số lượng tin nhắn phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một tin nhắn phòng kích hoạt tác tử. Dùng `messages.groupChat.historyLimit` làm phương án dự phòng; giá trị mặc định có hiệu lực là `0` nếu cả hai đều chưa được đặt (đã tắt).
- Lịch sử phòng Matrix chỉ áp dụng cho phòng; tin nhắn trực tiếp tiếp tục sử dụng lịch sử phiên thông thường.
- Lịch sử phòng chỉ bao gồm nội dung đang chờ: OpenClaw lưu đệm các tin nhắn phòng chưa kích hoạt phản hồi, sau đó chụp nhanh cửa sổ đó khi có lượt nhắc đến hoặc trình kích hoạt khác.
- Tin nhắn kích hoạt hiện tại không được đưa vào `InboundHistory`; tin nhắn đó vẫn nằm trong phần nội dung đến chính của lượt này.
- Các lần thử lại cùng một sự kiện Matrix tái sử dụng ảnh chụp nhanh lịch sử ban đầu thay vì dịch chuyển đến các tin nhắn phòng mới hơn.

## Khả năng hiển thị ngữ cảnh

Matrix hỗ trợ tùy chọn kiểm soát dùng chung `contextVisibility` cho ngữ cảnh phòng bổ sung, chẳng hạn như văn bản phản hồi đã tìm nạp, tin nhắn gốc của luồng và lịch sử đang chờ.

- `contextVisibility: "all"` là giá trị mặc định. Ngữ cảnh bổ sung được giữ nguyên như khi nhận.
- `contextVisibility: "allowlist"` lọc ngữ cảnh bổ sung theo những người gửi được các bước kiểm tra danh sách cho phép phòng/người dùng đang hoạt động chấp thuận.
- `contextVisibility: "allowlist_quote"` hoạt động giống `allowlist`, nhưng vẫn giữ lại một phản hồi được trích dẫn rõ ràng.

Điều này chỉ ảnh hưởng đến khả năng hiển thị ngữ cảnh bổ sung, không ảnh hưởng đến việc bản thân tin nhắn đến có thể kích hoạt phản hồi hay không. Quyền kích hoạt vẫn đến từ `groupPolicy`, `groups`, `groupAllowFrom` và các thiết lập chính sách tin nhắn trực tiếp.

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

Để tắt hoàn toàn tin nhắn trực tiếp trong khi vẫn duy trì hoạt động của các phòng, hãy đặt `dm.enabled: false`:

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

Xem [Nhóm](/vi/channels/groups) để biết hành vi kiểm soát bằng lượt nhắc đến và danh sách cho phép.

Ví dụ ghép nối cho tin nhắn trực tiếp Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được phê duyệt tiếp tục gửi tin nhắn trước khi được phê duyệt, OpenClaw sẽ tái sử dụng cùng mã ghép nối đang chờ và có thể gửi phản hồi nhắc nhở sau một khoảng chờ ngắn thay vì tạo mã mới.

Xem [Ghép nối](/vi/channels/pairing) để biết luồng ghép nối tin nhắn trực tiếp dùng chung và bố cục lưu trữ.

## Sửa chữa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp bị sai lệch, OpenClaw có thể có các ánh xạ `m.direct` lỗi thời trỏ đến các phòng đơn cũ thay vì tin nhắn trực tiếp đang hoạt động. Kiểm tra ánh xạ hiện tại cho một đối tượng ngang hàng:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa chữa ánh xạ:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Cả hai lệnh đều chấp nhận `--account <id>` cho thiết lập nhiều tài khoản. Luồng sửa chữa:

- ưu tiên một phòng tin nhắn trực tiếp 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- dùng bất kỳ phòng tin nhắn trực tiếp 1:1 nghiêm ngặt nào hiện đã tham gia với người dùng đó làm phương án dự phòng
- tạo một phòng trực tiếp mới và ghi lại `m.direct` nếu không có tin nhắn trực tiếp ổn định nào

Luồng này không tự động xóa các phòng cũ. Nó chọn tin nhắn trực tiếp ổn định và cập nhật ánh xạ để các lượt gửi Matrix, thông báo xác minh và những luồng tin nhắn trực tiếp khác trong tương lai nhắm đến đúng phòng.

## Phê duyệt thực thi

Matrix có thể hoạt động như một ứng dụng phê duyệt gốc. Cấu hình trong `channels.matrix.execApprovals` (hoặc `channels.matrix.accounts.<account>.execApprovals` để ghi đè theo tài khoản):

- `enabled`: phân phối yêu cầu phê duyệt qua lời nhắc gốc của Matrix. Khi chưa đặt hoặc đặt thành `"auto"`, tính năng sẽ tự động bật khi có thể phân giải ít nhất một người phê duyệt; đặt `false` để tắt rõ ràng.
- `approvers`: các ID người dùng Matrix (`@owner:example.org`) được phép phê duyệt yêu cầu thực thi. Dùng `channels.matrix.dm.allowFrom` làm phương án dự phòng.
- `target`: vị trí gửi lời nhắc. `"dm"` (mặc định) gửi đến tin nhắn trực tiếp của người phê duyệt; `"channel"` gửi đến phòng hoặc tin nhắn trực tiếp khởi nguồn; `"both"` gửi đến cả hai.
- `agentFilter` / `sessionFilter`: danh sách cho phép tùy chọn xác định tác tử/phiên nào kích hoạt phân phối qua Matrix.

Quyền hạn có đôi chút khác biệt giữa các loại phê duyệt:

- **Phê duyệt thực thi** sử dụng `execApprovals.approvers`, với `dm.allowFrom` làm phương án dự phòng.
- **Phê duyệt Plugin** chỉ cấp quyền thông qua `dm.allowFrom`.

Cả hai loại đều dùng chung các lối tắt phản ứng và cập nhật tin nhắn của Matrix. Người phê duyệt thấy các lối tắt phản ứng trên tin nhắn phê duyệt chính:

- ✅ cho phép một lần
- ❌ từ chối
- ♾️ luôn cho phép (khi chính sách thực thi có hiệu lực cho phép)

Các lệnh gạch chéo dự phòng: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Chỉ những người phê duyệt đã được phân giải mới có thể phê duyệt hoặc từ chối. Việc gửi phê duyệt thực thi qua kênh bao gồm nội dung lệnh — chỉ bật `channel` hoặc `both` trong các phòng đáng tin cậy.

Liên quan: [Phê duyệt thực thi](/vi/tools/exec-approvals).

## Lệnh gạch chéo

Các lệnh gạch chéo (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, v.v.) hoạt động trực tiếp trong tin nhắn riêng. Trong các phòng, OpenClaw cũng nhận diện các lệnh có tiền tố là lượt đề cập Matrix của chính bot, vì vậy `@bot:server /new` kích hoạt đường dẫn lệnh mà không cần biểu thức chính quy đề cập tùy chỉnh — điều này giúp bot phản hồi các bài đăng kiểu phòng `@mention /command` do Element và các ứng dụng tương tự tạo ra khi người dùng dùng phím tab để hoàn thành tên bot trước khi nhập lệnh.

Các quy tắc ủy quyền vẫn được áp dụng: người gửi lệnh phải đáp ứng cùng các chính sách danh sách cho phép/chủ sở hữu của tin nhắn riêng hoặc phòng như tin nhắn thông thường.

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

- Các giá trị `channels.matrix` cấp cao nhất đóng vai trò mặc định cho các tài khoản được đặt tên, trừ khi tài khoản ghi đè chúng.
- Giới hạn một mục phòng được kế thừa cho một tài khoản cụ thể bằng `groups.<room>.account`. Các mục không có `account` được dùng chung giữa các tài khoản; `account: "default"` vẫn hoạt động khi tài khoản mặc định được cấu hình ở cấp cao nhất.

**Chọn tài khoản mặc định:**

- Đặt `defaultAccount` để chọn tài khoản được đặt tên mà định tuyến ngầm định, thăm dò và các lệnh CLI ưu tiên.
- Nếu bạn có nhiều tài khoản và một tài khoản có tên chính xác là `default`, OpenClaw sẽ ngầm định sử dụng tài khoản đó ngay cả khi chưa đặt `defaultAccount`.
- Khi có nhiều tài khoản được đặt tên nhưng chưa chọn tài khoản mặc định, các lệnh CLI sẽ từ chối phỏng đoán — hãy đặt `defaultAccount` hoặc truyền `--account <id>`.
- Khối `channels.matrix.*` cấp cao nhất chỉ được coi là tài khoản `default` ngầm định khi thông tin xác thực của nó đã đầy đủ (`homeserver` + `accessToken`, hoặc `homeserver` + `userId` + `password`). Các tài khoản được đặt tên vẫn có thể được phát hiện từ `homeserver` + `userId` sau khi thông tin xác thực được lưu vào bộ nhớ đệm đáp ứng việc xác thực.

**Nâng cấp:**

- Khi OpenClaw nâng cấp cấu hình một tài khoản thành nhiều tài khoản trong quá trình sửa chữa hoặc thiết lập, hệ thống giữ nguyên tài khoản được đặt tên hiện có nếu có, hoặc nếu `defaultAccount` đã trỏ đến một tài khoản. Chỉ các khóa xác thực/khởi tạo Matrix được chuyển vào tài khoản đã nâng cấp; các khóa chính sách gửi dùng chung vẫn ở cấp cao nhất.

Xem [Tham chiếu cấu hình](/vi/gateway/config-channels#multi-account-all-channels) để biết mẫu nhiều tài khoản dùng chung.

## Homeserver riêng tư/LAN

Theo mặc định, OpenClaw chặn các homeserver Matrix riêng tư/nội bộ để bảo vệ khỏi SSRF, trừ khi bạn chủ động cho phép theo từng tài khoản.

Nếu homeserver của bạn chạy trên localhost, IP LAN/Tailscale hoặc tên máy chủ nội bộ, hãy bật `network.dangerouslyAllowPrivateNetwork` cho tài khoản đó:

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

Tùy chọn chủ động này chỉ cho phép các đích riêng tư/nội bộ đáng tin cậy. Các homeserver công khai dùng kết nối không mã hóa như `http://matrix.example.org:8008` vẫn bị chặn. Hãy ưu tiên `https://` bất cứ khi nào có thể.

## Chuyển tiếp lưu lượng Matrix qua proxy

Nếu triển khai Matrix của bạn cần proxy HTTP(S) gửi đi rõ ràng, hãy đặt `channels.matrix.proxy`:

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

Các tài khoản được đặt tên có thể ghi đè giá trị mặc định cấp cao nhất bằng `channels.matrix.accounts.<id>.proxy`. OpenClaw sử dụng cùng cài đặt proxy cho lưu lượng Matrix khi chạy và các lần thăm dò trạng thái tài khoản.

## Phân giải đích

Matrix chấp nhận các dạng đích sau ở bất kỳ nơi nào OpenClaw yêu cầu đích là phòng hoặc người dùng:

- Người dùng: `@user:server`, `user:@user:server` hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server` hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server` hoặc `matrix:channel:#alias:server`

ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy sử dụng chính xác cách viết hoa chữ thường của ID phòng từ Matrix khi cấu hình đích gửi cụ thể, tác vụ cron, liên kết hoặc danh sách cho phép. OpenClaw chuẩn hóa các khóa phiên nội bộ để lưu trữ, vì vậy các khóa viết thường đó không phải là nguồn đáng tin cậy cho ID gửi của Matrix.

Việc tra cứu thư mục trực tiếp sử dụng tài khoản Matrix đã đăng nhập:

- Các lượt tra cứu người dùng truy vấn thư mục người dùng Matrix trên homeserver đó.
- Các lượt tra cứu phòng chấp nhận trực tiếp ID và bí danh phòng cụ thể. Việc tra cứu tên phòng đã tham gia được thực hiện theo khả năng tốt nhất và chỉ áp dụng cho danh sách cho phép phòng khi chạy nếu đã đặt `dangerouslyAllowNameMatching: true`.
- Nếu không thể phân giải tên phòng thành ID hoặc bí danh, tên đó sẽ bị bỏ qua khi phân giải danh sách cho phép lúc chạy.

## Tham chiếu cấu hình

Các trường người dùng kiểu danh sách cho phép (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) chấp nhận ID người dùng Matrix đầy đủ (an toàn nhất). Các mục không phải ID bị bỏ qua theo mặc định. Nếu đã đặt `dangerouslyAllowNameMatching: true`, các kết quả khớp chính xác với tên hiển thị trong thư mục Matrix được phân giải khi khởi động và mỗi khi danh sách cho phép thay đổi trong lúc trình giám sát đang chạy; các mục không thể phân giải bị bỏ qua khi chạy.

Các khóa danh sách cho phép phòng (`groups`, `rooms` cũ) nên là ID hoặc bí danh phòng. Các khóa là tên phòng thuần túy bị bỏ qua theo mặc định; `dangerouslyAllowNameMatching: true` khôi phục việc tra cứu theo khả năng tốt nhất trong tên các phòng đã tham gia.

### Tài khoản và kết nối

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn hiển thị tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi cấu hình nhiều tài khoản Matrix.
- `accounts`: các giá trị ghi đè theo từng tài khoản được đặt tên. Các giá trị `channels.matrix` cấp cao nhất được kế thừa làm mặc định.
- `homeserver`: URL homeserver, ví dụ `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: cho phép tài khoản này kết nối với `localhost`, các IP LAN/Tailscale hoặc tên máy chủ nội bộ.
- `proxy`: URL proxy HTTP(S) tùy chọn cho lưu lượng Matrix. Hỗ trợ ghi đè theo từng tài khoản.
- `userId`: ID người dùng Matrix đầy đủ (`@bot:example.org`).
- `accessToken`: token truy cập cho xác thực dựa trên token. Hỗ trợ giá trị văn bản thuần và SecretRef trên các nhà cung cấp env/file/exec ([Quản lý bí mật](/vi/gateway/secrets)).
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu. Hỗ trợ giá trị văn bản thuần và SecretRef.
- `deviceId`: ID thiết bị Matrix cụ thể.
- `deviceName`: tên hiển thị của thiết bị được sử dụng khi đăng nhập bằng mật khẩu.
- `avatarUrl`: URL ảnh đại diện cá nhân được lưu trữ để đồng bộ hồ sơ và cập nhật `profile set`.
- `initialSyncLimit`: số lượng sự kiện tối đa được tải trong quá trình đồng bộ khi khởi động.

### Mã hóa

- `encryption`: bật E2EE. Mặc định: `false`.
- `startupVerification`: `"if-unverified"` (mặc định khi E2EE được bật) hoặc `"off"`. Tự động yêu cầu tự xác minh khi khởi động nếu thiết bị này chưa được xác minh.
- `startupVerificationCooldownHours`: thời gian chờ trước yêu cầu tự động tiếp theo khi khởi động. Mặc định: `24`.

### Quyền truy cập và chính sách

- `groupPolicy`: `"open"`, `"allowlist"` hoặc `"disabled"`. Mặc định: `"allowlist"`.
- `groupAllowFrom`: danh sách cho phép các ID người dùng đối với lưu lượng phòng.
- `mentionPatterns`: các mẫu biểu thức chính quy có phạm vi cho lượt đề cập trong phòng. Đối tượng có `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Kiểm soát việc các `agents.list[].groupChat.mentionPatterns` đã cấu hình có áp dụng theo từng phòng hay không.
- `dm.enabled`: khi `false`, bỏ qua mọi tin nhắn riêng. Mặc định: `true`.
- `dm.policy`: `"pairing"` (mặc định), `"allowlist"`, `"open"` hoặc `"disabled"`. Áp dụng sau khi bot đã tham gia và phân loại phòng là tin nhắn riêng; không ảnh hưởng đến việc xử lý lời mời.
- `dm.allowFrom`: danh sách cho phép các ID người dùng đối với lưu lượng tin nhắn riêng.
- `dm.sessionScope`: `"per-user"` (mặc định) hoặc `"per-room"`.
- `dm.threadReplies`: giá trị ghi đè chỉ dành cho tin nhắn riêng đối với việc phân luồng trả lời (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: chấp nhận tin nhắn từ các tài khoản bot Matrix đã cấu hình khác (`true` hoặc `"mentions"`).
- `allowlistOnly`: khi `true`, buộc tất cả chính sách tin nhắn riêng đang hoạt động (ngoại trừ `"disabled"`) và các chính sách nhóm `"open"` thành `"allowlist"`. Không thay đổi các chính sách `"disabled"`.
- `dangerouslyAllowNameMatching`: khi `true`, cho phép tra cứu thư mục tên hiển thị Matrix cho các mục danh sách cho phép người dùng và tra cứu tên phòng đã tham gia cho các khóa danh sách cho phép phòng. Ưu tiên các ID `@user:server` đầy đủ và ID hoặc bí danh phòng.
- `autoJoin`: `"always"`, `"allowlist"` hoặc `"off"`. Mặc định: `"off"`. Áp dụng cho mọi lời mời Matrix, bao gồm cả lời mời kiểu tin nhắn riêng.
- `autoJoinAllowlist`: các phòng/bí danh được phép khi `autoJoin` là `"allowlist"`. Các mục bí danh được phân giải theo homeserver, không theo trạng thái do phòng gửi lời mời khai báo.
- `contextVisibility`: khả năng hiển thị ngữ cảnh bổ sung (`"all"` mặc định, `"allowlist"`, `"allowlist_quote"`).

### Hành vi trả lời

- `replyToMode`: `"off"` (mặc định), `"first"`, `"all"`, hoặc `"batched"`.
- `threadReplies`: `"off"` (giá trị mặc định cấp cao nhất được phân giải thành `"inbound"` trừ khi được đặt rõ ràng), `"inbound"`, hoặc `"always"`.
- `threadBindings`: các giá trị ghi đè theo từng kênh cho việc định tuyến và vòng đời của phiên gắn với luồng.
- `streaming`: đối tượng lồng nhau `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` là `"off"` (mặc định), `"partial"`, `"quiet"`, hoặc `"progress"`. Các cách viết vô hướng/boolean cũ được di chuyển qua `openclaw doctor --fix`.
- `streaming.block.enabled`: khi `true`, các khối hoàn tất của trợ lý được giữ dưới dạng các thông báo tiến trình riêng biệt. Mặc định: `false`.
- `markdown`: cấu hình kết xuất Markdown tùy chọn cho văn bản gửi đi.
- `responsePrefix`: chuỗi tùy chọn được thêm vào trước các phản hồi gửi đi.
- `textChunkLimit`: kích thước đoạn gửi đi tính bằng ký tự khi `streaming.chunkMode: "length"`. Mặc định: `4000`.
- `streaming.chunkMode`: `"length"` (mặc định, chia theo số lượng ký tự) hoặc `"newline"` (chia tại ranh giới dòng).
- `historyLimit`: số lượng thông báo phòng gần đây được đưa vào dưới dạng `InboundHistory` khi một thông báo phòng kích hoạt tác nhân. Dùng dự phòng `messages.groupChat.historyLimit`; giá trị mặc định có hiệu lực là `0` (đã tắt).
- `mediaMaxMb`: giới hạn kích thước phương tiện tính bằng MB cho việc gửi đi và xử lý đầu vào. Mặc định: `20`.

### Cài đặt phản ứng

- `ackReaction`: ghi đè phản ứng xác nhận cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi (`"group-mentions"` mặc định, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: chế độ thông báo phản ứng đầu vào (`"own"` mặc định, `"off"`).

### Công cụ và các giá trị ghi đè theo từng phòng

- `actions`: kiểm soát quyền sử dụng công cụ theo từng hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: ánh xạ chính sách theo từng phòng. Danh tính phiên sử dụng ID phòng ổn định sau khi phân giải. (`rooms` là bí danh cũ.)
  - `groups.<room>.account`: giới hạn một mục phòng được kế thừa cho một tài khoản cụ thể.
  - `groups.<room>.enabled`: nút bật/tắt theo từng phòng. Khi `false`, phòng bị bỏ qua như thể không có trong ánh xạ.
  - `groups.<room>.requireMention`: ghi đè yêu cầu đề cập ở cấp kênh theo từng phòng.
  - `groups.<room>.allowBots`: ghi đè cài đặt cấp kênh theo từng phòng (`true` hoặc `"mentions"`).
  - `groups.<room>.botLoopProtection`: ghi đè ngân sách bảo vệ vòng lặp giữa các bot theo từng phòng.
  - `groups.<room>.users`: danh sách cho phép người gửi theo từng phòng.
  - `groups.<room>.tools`: ghi đè cho phép/từ chối công cụ theo từng phòng.
  - `groups.<room>.autoReply`: ghi đè kiểm soát bằng đề cập theo từng phòng. `true` tắt yêu cầu đề cập cho phòng đó; `false` buộc bật lại yêu cầu này.
  - `groups.<room>.skills`: bộ lọc Skills theo từng phòng.
  - `groups.<room>.systemPrompt`: đoạn lời nhắc hệ thống theo từng phòng.

### Cài đặt phê duyệt thực thi

- `execApprovals.enabled`: chuyển các yêu cầu phê duyệt thực thi qua lời nhắc gốc của Matrix.
- `execApprovals.approvers`: các ID người dùng Matrix được phép phê duyệt. Dùng dự phòng `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (mặc định), `"channel"`, hoặc `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: danh sách cho phép tác nhân/phiên tùy chọn để phân phối.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - luồng xác thực DM và ghép nối
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát bằng đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho thông báo
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố bảo mật
