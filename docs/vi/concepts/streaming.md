---
read_when:
    - Giải thích cách truyền luồng hoặc chia nhỏ thành khối hoạt động trên các kênh
    - Thay đổi hành vi truyền phát theo khối hoặc chia đoạn kênh
    - Gỡ lỗi phản hồi khối trùng lặp/quá sớm hoặc phát trực tuyến bản xem trước kênh
summary: Hành vi truyền phát + chia đoạn (phản hồi dạng khối, truyền phát bản xem trước của kênh, ánh xạ chế độ)
title: Truyền phát và chia đoạn
x-i18n:
    generated_at: "2026-05-04T07:04:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp truyền phát riêng biệt:

- **Truyền phát khối (kênh):** phát ra các **khối** đã hoàn tất khi trợ lý đang viết. Đây là các tin nhắn kênh thông thường (không phải delta token).
- **Truyền phát bản xem trước (Telegram/Discord/Slack):** cập nhật một **tin nhắn xem trước** tạm thời trong khi tạo nội dung.

Hiện nay **không có truyền phát delta token thực sự** tới tin nhắn kênh. Truyền phát bản xem trước dựa trên tin nhắn (gửi + chỉnh sửa/nối thêm).

## Truyền phát khối (tin nhắn kênh)

Truyền phát khối gửi đầu ra của trợ lý theo các phần lớn khi chúng sẵn sàng.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Chú giải:

- `text_delta/events`: sự kiện luồng của mô hình (có thể thưa thớt với các mô hình không truyền phát).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn tối thiểu/tối đa + ưu tiên điểm ngắt.
- `channel send`: các tin nhắn gửi ra thực tế (phản hồi dạng khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè theo kênh: `*.blockStreaming` (và các biến thể theo tài khoản) để ép `"on"`/`"off"` theo từng kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các khối đã truyền phát trước khi gửi).
- Giới hạn cứng của kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chia đoạn của kênh: `*.chunkMode` (`length` mặc định, `newline` chia theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) chia các phản hồi cao để tránh bị cắt trong UI.

**Ngữ nghĩa ranh giới:**

- `text_end`: truyền phát khối ngay khi bộ chia đoạn phát ra; xả ở mỗi `text_end`.
- `message_end`: chờ cho đến khi tin nhắn trợ lý hoàn tất, rồi xả đầu ra đã đệm.

`message_end` vẫn dùng bộ chia đoạn nếu văn bản đã đệm vượt quá `maxChars`, nên nó có thể phát ra nhiều đoạn ở cuối.

### Phân phối phương tiện với truyền phát khối

Các chỉ thị `MEDIA:` là siêu dữ liệu phân phối thông thường. Khi truyền phát khối gửi sớm một khối phương tiện, OpenClaw ghi nhớ lần phân phối đó cho lượt này. Nếu payload cuối cùng của trợ lý lặp lại cùng URL phương tiện, lần phân phối cuối sẽ loại bỏ phương tiện trùng lặp thay vì gửi lại tệp đính kèm.

Các payload cuối cùng trùng lặp chính xác sẽ bị chặn. Nếu payload cuối cùng thêm văn bản riêng biệt quanh phương tiện đã được truyền phát, OpenClaw vẫn gửi văn bản mới trong khi giữ phương tiện ở chế độ chỉ phân phối một lần. Điều này ngăn ghi chú thoại hoặc tệp bị trùng lặp trên các kênh như Telegram khi một agent phát ra `MEDIA:` trong lúc truyền phát và nhà cung cấp cũng đưa nó vào phản hồi đã hoàn tất.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Chia đoạn khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát ra cho đến khi bộ đệm >= `minChars` (trừ khi bị ép buộc).
- **Giới hạn cao:** ưu tiên chia trước `maxChars`; nếu bị ép buộc, chia tại `maxChars`.
- **Ưu tiên điểm ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Khối mã:** không bao giờ chia bên trong khối mã; khi bị ép buộc tại `maxChars`, đóng + mở lại khối mã để giữ Markdown hợp lệ.

`maxChars` được kẹp theo `textChunkLimit` của kênh, nên bạn không thể vượt quá giới hạn theo từng kênh.

## Gộp khối (gộp các khối đã truyền phát)

Khi bật truyền phát khối, OpenClaw có thể **gộp các đoạn khối liên tiếp** trước khi gửi ra ngoài. Việc này giảm “spam một dòng” trong khi vẫn cung cấp đầu ra tăng dần.

- Gộp khối chờ các **khoảng rỗi** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá giới hạn đó.
- `minChars` ngăn các mảnh rất nhỏ được gửi cho đến khi tích lũy đủ văn bản (lần xả cuối luôn gửi phần văn bản còn lại).
- Ký tự nối được suy ra từ `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → dấu cách).
- Có thể ghi đè theo kênh qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo tài khoản).
- `minChars` gộp mặc định được tăng lên 1500 cho Signal/Slack/Discord trừ khi được ghi đè.

## Nhịp độ giống con người giữa các khối

Khi bật truyền phát khối, bạn có thể thêm một **khoảng tạm dừng ngẫu nhiên** giữa các phản hồi dạng khối (sau khối đầu tiên). Điều này làm cho phản hồi nhiều bong bóng trông tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo từng agent qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Chỉ áp dụng cho **phản hồi dạng khối**, không áp dụng cho phản hồi cuối hoặc tóm tắt công cụ.

## "Truyền phát từng đoạn hoặc toàn bộ"

Điều này ánh xạ tới:

- **Truyền phát từng đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát ra khi đang tạo). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Truyền phát toàn bộ ở cuối:** `blockStreamingBreak: "message_end"` (xả một lần, có thể thành nhiều đoạn nếu rất dài).
- **Không truyền phát khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối).

**Ghi chú về kênh:** Truyền phát khối **tắt trừ khi** `*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể truyền phát bản xem trước trực tiếp (`channels.<channel>.streaming`) mà không có phản hồi dạng khối.

Nhắc lại vị trí cấu hình: các giá trị mặc định `blockStreaming*` nằm dưới `agents.defaults`, không phải cấu hình gốc.

## Chế độ truyền phát bản xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt truyền phát bản xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo các bước chia đoạn/nối thêm.
- `progress`: bản xem trước tiến độ/trạng thái trong khi tạo, câu trả lời cuối khi hoàn tất.

`streaming.mode: "block"` là một chế độ truyền phát bản xem trước cho các kênh có khả năng chỉnh sửa như Discord và Telegram. Nó không bật phân phối khối của kênh tại đó. Hãy dùng `streaming.block.enabled` hoặc khóa kênh cũ `blockStreaming` khi bạn muốn phản hồi dạng khối thông thường. Microsoft Teams là ngoại lệ: nó không có cơ chế truyền tải khối bản nháp xem trước, nên `streaming.mode: "block"` ánh xạ sang phân phối khối của Teams thay vì truyền phát một phần/tiến độ gốc.

### Ánh xạ kênh

| Kênh       | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | bản nháp tiến độ có thể chỉnh sửa |
| Discord    | ✅    | ✅        | ✅      | bản nháp tiến độ có thể chỉnh sửa |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | luồng tiến độ gốc       |

Chỉ Slack:

- `channels.slack.streaming.nativeTransport` bật/tắt các lệnh gọi API truyền phát gốc của Slack khi `channels.slack.streaming.mode="partial"` (mặc định: `true`).
- Truyền phát gốc của Slack và trạng thái luồng trợ lý Slack yêu cầu mục tiêu luồng phản hồi. DM cấp cao nhất không hiển thị bản xem trước kiểu luồng đó, nhưng vẫn có thể dùng bài đăng bản nháp xem trước của Slack và các chỉnh sửa.

Di chuyển khóa cũ:

- Telegram: các giá trị `streamMode` cũ và `streaming` dạng vô hướng/boolean được phát hiện và di chuyển bởi các đường tương thích doctor/cấu hình sang `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean tự động di chuyển sang enum `streaming`.
- Slack: `streamMode` tự động di chuyển sang `streaming.mode`; `streaming` boolean tự động di chuyển sang `streaming.mode` cộng với `streaming.nativeTransport`; `nativeStreaming` cũ tự động di chuyển sang `streaming.nativeTransport`.

### Hành vi runtime

Telegram:

- Dùng các cập nhật xem trước `sendMessage` + `editMessageText` trên DM và nhóm/chủ đề.
- Gửi một tin nhắn cuối mới thay vì chỉnh sửa tại chỗ khi bản xem trước đã hiển thị khoảng một phút, rồi dọn bản xem trước để dấu thời gian của Telegram phản ánh thời điểm hoàn tất phản hồi.
- Bỏ qua truyền phát bản xem trước khi truyền phát khối của Telegram được bật rõ ràng (để tránh truyền phát kép).
- `/reasoning stream` có thể ghi lập luận vào bản xem trước tạm thời, bản này sẽ bị xóa sau lần phân phối cuối.

Discord:

- Dùng tin nhắn xem trước gửi + chỉnh sửa.
- Chế độ `block` dùng chia đoạn bản nháp (`draftChunk`).
- Bỏ qua truyền phát bản xem trước khi truyền phát khối của Discord được bật rõ ràng.
- Phương tiện cuối, lỗi và payload phản hồi tường minh sẽ hủy các bản xem trước đang chờ mà không xả bản nháp mới, rồi dùng phân phối thông thường.

Slack:

- `partial` có thể dùng truyền phát gốc của Slack (`chat.startStream`/`append`/`stop`) khi có sẵn.
- `block` dùng bản xem trước bản nháp kiểu nối thêm.
- `progress` dùng văn bản xem trước trạng thái, rồi câu trả lời cuối.
- DM cấp cao nhất không có luồng phản hồi dùng bài đăng bản nháp xem trước và chỉnh sửa thay vì truyền phát gốc của Slack.
- Truyền phát bản xem trước gốc và bản nháp sẽ chặn phản hồi dạng khối cho lượt đó, nên một phản hồi Slack chỉ được truyền phát qua một đường phân phối.
- Payload phương tiện/lỗi cuối và các kết quả cuối dạng tiến độ không tạo tin nhắn bản nháp dùng một lần; chỉ các kết quả cuối dạng văn bản/khối có thể chỉnh sửa bản xem trước mới xả văn bản bản nháp đang chờ.

Mattermost:

- Truyền phát suy nghĩ, hoạt động công cụ và văn bản phản hồi một phần vào một bài đăng bản nháp xem trước duy nhất, bài này hoàn tất tại chỗ khi câu trả lời cuối an toàn để gửi.
- Dự phòng bằng cách gửi một bài đăng cuối mới nếu bài đăng xem trước đã bị xóa hoặc không còn khả dụng tại thời điểm hoàn tất.
- Payload phương tiện/lỗi cuối hủy các cập nhật xem trước đang chờ trước khi phân phối thông thường thay vì xả một bài đăng xem trước tạm thời.

Matrix:

- Bản nháp xem trước hoàn tất tại chỗ khi văn bản cuối có thể tái sử dụng sự kiện xem trước.
- Kết quả cuối chỉ có phương tiện, lỗi và không khớp mục tiêu phản hồi sẽ hủy các cập nhật xem trước đang chờ trước khi phân phối thông thường; một bản xem trước cũ đã hiển thị sẽ bị biên tập lại.

### Cập nhật bản xem trước tiến độ công cụ

Truyền phát bản xem trước cũng có thể bao gồm các cập nhật **tiến độ công cụ** — các dòng trạng thái ngắn như "đang tìm kiếm trên web", "đang đọc tệp" hoặc "đang gọi công cụ" — xuất hiện trong cùng tin nhắn xem trước khi công cụ đang chạy, trước phản hồi cuối. Điều này giữ cho các lượt công cụ nhiều bước có hoạt động trực quan thay vì im lặng giữa bản xem trước suy nghĩ đầu tiên và câu trả lời cuối.

Bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram** và **Matrix** mặc định truyền phát tiến độ công cụ vào chỉnh sửa bản xem trước trực tiếp khi truyền phát bản xem trước đang hoạt động. Microsoft Teams dùng luồng tiến độ gốc trong trò chuyện cá nhân.
- Telegram đã phát hành với cập nhật bản xem trước tiến độ công cụ được bật kể từ `v2026.4.22`; việc giữ chúng bật sẽ bảo toàn hành vi đã phát hành đó.
- **Mattermost** đã gộp hoạt động công cụ vào bài đăng bản nháp xem trước duy nhất của nó (xem ở trên).
- Các chỉnh sửa tiến độ công cụ tuân theo chế độ truyền phát bản xem trước đang hoạt động; chúng bị bỏ qua khi truyền phát bản xem trước là `off` hoặc khi truyền phát khối đã tiếp quản tin nhắn. Trên Telegram, `streaming.mode: "off"` là chỉ phản hồi cuối: thông báo tiến độ chung cũng bị chặn thay vì được phân phối dưới dạng tin nhắn trạng thái độc lập, trong khi lời nhắc phê duyệt, payload phương tiện và lỗi vẫn định tuyến bình thường.
- Để giữ truyền phát bản xem trước nhưng ẩn các dòng tiến độ công cụ, đặt `streaming.preview.toolProgress` thành `false` cho kênh đó. Để giữ các dòng tiến độ công cụ hiển thị trong khi ẩn văn bản lệnh/thực thi, đặt `streaming.preview.commandText` thành `"status"` hoặc `streaming.progress.commandText` thành `"status"`; mặc định là `"raw"` để bảo toàn hành vi đã phát hành. Chính sách này được chia sẻ bởi các kênh bản nháp/tiến độ dùng bộ kết xuất tiến độ gọn của OpenClaw, bao gồm Discord, Matrix, Microsoft Teams, Mattermost, bản nháp xem trước Slack và Telegram. Để tắt hoàn toàn chỉnh sửa bản xem trước, đặt `streaming.mode` thành `off`.
- Phản hồi trích dẫn đã chọn của Telegram là ngoại lệ: khi `replyToMode` không phải `"off"` và có văn bản trích dẫn đã chọn, OpenClaw bỏ qua luồng xem trước câu trả lời cho lượt đó nên các dòng xem trước tiến độ công cụ không thể hiển thị. Phản hồi tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ truyền phát bản xem trước. Xem [tài liệu kênh Telegram](/vi/channels/telegram) để biết chi tiết.

Giữ các dòng tiến trình hiển thị nhưng ẩn văn bản lệnh/exec thô:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Dùng cùng cấu trúc dưới một khóa kênh tiến trình gọn khác, ví dụ `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, hoặc bản xem trước nháp của Slack. Đối với chế độ bản nháp tiến trình, đặt cùng chính sách dưới `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Liên quan

- [Bản nháp tiến trình](/vi/concepts/progress-drafts) — các thông báo công việc đang tiến hành hiển thị và được cập nhật trong các lượt dài
- [Tin nhắn](/vi/concepts/messages) — vòng đời và quá trình gửi tin nhắn
- [Thử lại](/vi/concepts/retry) — hành vi thử lại khi gửi thất bại
- [Kênh](/vi/channels) — hỗ trợ streaming theo từng kênh
