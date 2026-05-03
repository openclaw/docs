---
read_when:
    - Giải thích cách truyền luồng hoặc chia đoạn hoạt động trên các kênh
    - Thay đổi hành vi truyền phát theo khối hoặc chia đoạn kênh
    - Gỡ lỗi phản hồi khối bị trùng lặp/quá sớm hoặc phát trực tuyến bản xem trước kênh
summary: Hành vi phát trực tuyến + chia đoạn (trả lời dạng khối, phát trực tuyến bản xem trước kênh, ánh xạ chế độ)
title: Truyền luồng và chia khối
x-i18n:
    generated_at: "2026-05-03T21:30:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp phát trực tuyến riêng biệt:

- **Phát trực tuyến theo khối (kênh):** phát các **khối** đã hoàn tất khi trợ lý viết. Đây là các tin nhắn kênh bình thường (không phải delta token).
- **Phát trực tuyến bản xem trước (Telegram/Discord/Slack):** cập nhật một **tin nhắn xem trước** tạm thời trong khi tạo.

Hiện nay **không có phát trực tuyến delta token thực sự** tới tin nhắn kênh. Phát trực tuyến bản xem trước dựa trên tin nhắn (gửi + chỉnh sửa/nối thêm).

## Phát trực tuyến theo khối (tin nhắn kênh)

Phát trực tuyến theo khối gửi đầu ra của trợ lý thành các đoạn thô khi chúng sẵn sàng.

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

- `text_delta/events`: sự kiện luồng mô hình (có thể thưa thớt với các mô hình không phát trực tuyến).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn tối thiểu/tối đa + ưu tiên điểm ngắt.
- `channel send`: tin nhắn gửi ra thực tế (phản hồi dạng khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè kênh: `*.blockStreaming` (và các biến thể theo từng tài khoản) để ép `"on"`/`"off"` theo từng kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các khối được phát trực tuyến trước khi gửi).
- Giới hạn cứng của kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chia đoạn của kênh: `*.chunkMode` (`length` mặc định, `newline` chia theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) chia các phản hồi cao để tránh bị cắt trong UI.

**Ngữ nghĩa ranh giới:**

- `text_end`: phát các khối ngay khi bộ chia đoạn phát ra; xả trên mỗi `text_end`.
- `message_end`: chờ đến khi tin nhắn trợ lý kết thúc, rồi xả đầu ra đã đệm.

`message_end` vẫn dùng bộ chia đoạn nếu văn bản đã đệm vượt quá `maxChars`, vì vậy nó có thể phát nhiều đoạn ở cuối.

### Gửi phương tiện với phát trực tuyến theo khối

Chỉ thị `MEDIA:` là siêu dữ liệu gửi bình thường. Khi phát trực tuyến theo khối gửi sớm một khối phương tiện, OpenClaw ghi nhớ lần gửi đó cho lượt này. Nếu tải trọng trợ lý cuối cùng lặp lại cùng URL phương tiện, lần gửi cuối sẽ loại bỏ phương tiện trùng lặp thay vì gửi lại tệp đính kèm.

Các tải trọng cuối cùng trùng lặp hoàn toàn sẽ bị chặn. Nếu tải trọng cuối cùng thêm văn bản riêng biệt xung quanh phương tiện đã được phát trực tuyến, OpenClaw vẫn gửi văn bản mới trong khi giữ phương tiện chỉ được gửi một lần. Điều này ngăn ghi chú thoại hoặc tệp bị trùng trên các kênh như Telegram khi một agent phát `MEDIA:` trong lúc phát trực tuyến và nhà cung cấp cũng đưa nó vào phản hồi hoàn tất.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Chia đoạn theo khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát cho đến khi bộ đệm >= `minChars` (trừ khi bị ép).
- **Giới hạn cao:** ưu tiên chia trước `maxChars`; nếu bị ép, chia tại `maxChars`.
- **Ưu tiên điểm ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Hàng rào mã:** không bao giờ chia bên trong hàng rào; khi bị ép tại `maxChars`, đóng + mở lại hàng rào để giữ Markdown hợp lệ.

`maxChars` được kẹp theo `textChunkLimit` của kênh, vì vậy bạn không thể vượt quá giới hạn theo từng kênh.

## Gộp (hợp nhất các khối được phát trực tuyến)

Khi bật phát trực tuyến theo khối, OpenClaw có thể **hợp nhất các đoạn khối liên tiếp** trước khi gửi ra ngoài. Điều này giảm “spam một dòng” trong khi vẫn cung cấp đầu ra tăng dần.

- Gộp chờ các **khoảng nghỉ nhàn rỗi** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá giới hạn đó.
- `minChars` ngăn các mảnh quá nhỏ được gửi cho đến khi tích lũy đủ văn bản (lần xả cuối luôn gửi phần văn bản còn lại).
- Chuỗi nối được suy ra từ `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → dấu cách).
- Có thể ghi đè theo kênh qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo từng tài khoản).
- `minChars` gộp mặc định được tăng lên 1500 cho Signal/Slack/Discord trừ khi bị ghi đè.

## Nhịp chờ giống người giữa các khối

Khi bật phát trực tuyến theo khối, bạn có thể thêm một **khoảng tạm dừng ngẫu nhiên** giữa các phản hồi dạng khối (sau khối đầu tiên). Điều này làm cho các phản hồi nhiều bong bóng có cảm giác tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo từng agent qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Chỉ áp dụng cho **phản hồi dạng khối**, không áp dụng cho phản hồi cuối hoặc tóm tắt công cụ.

## "Phát các đoạn hoặc toàn bộ"

Ánh xạ như sau:

- **Phát các đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát khi đang tạo). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Phát toàn bộ ở cuối:** `blockStreamingBreak: "message_end"` (xả một lần, có thể thành nhiều đoạn nếu rất dài).
- **Không phát trực tuyến theo khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối).

**Lưu ý về kênh:** Phát trực tuyến theo khối **tắt trừ khi**
`*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể phát trực tuyến bản xem trước trực tiếp (`channels.<channel>.streaming`) mà không có phản hồi dạng khối.

Nhắc lại vị trí cấu hình: các mặc định `blockStreaming*` nằm dưới
`agents.defaults`, không phải cấu hình gốc.

## Chế độ phát trực tuyến bản xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt phát trực tuyến bản xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo các bước chia đoạn/nối thêm.
- `progress`: bản xem trước tiến trình/trạng thái trong khi tạo, câu trả lời cuối khi hoàn tất.

`streaming.mode: "block"` là một chế độ phát trực tuyến bản xem trước cho các kênh có thể chỉnh sửa như Discord và Telegram. Nó không bật gửi khối qua kênh ở đó. Dùng `streaming.block.enabled` hoặc khóa kênh cũ `blockStreaming` khi bạn muốn phản hồi dạng khối bình thường. Microsoft Teams là ngoại lệ: nó không có phương tiện truyền tải khối bản nháp xem trước, vì vậy `streaming.mode: "block"` ánh xạ sang gửi khối của Teams thay vì phát trực tuyến từng phần/tiến trình gốc.

### Ánh xạ kênh

| Kênh       | `off` | `partial` | `block` | `progress`                         |
| ---------- | ----- | --------- | ------- | ---------------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bản nháp tiến trình có thể chỉnh sửa |
| Discord    | ✅    | ✅        | ✅      | bản nháp tiến trình có thể chỉnh sửa |
| Slack      | ✅    | ✅        | ✅      | ✅                                 |
| Mattermost | ✅    | ✅        | ✅      | ✅                                 |
| MS Teams   | ✅    | ✅        | ✅      | luồng tiến trình gốc               |

Chỉ Slack:

- `channels.slack.streaming.nativeTransport` bật/tắt các lệnh gọi API phát trực tuyến gốc của Slack khi `channels.slack.streaming.mode="partial"` (mặc định: `true`).
- Phát trực tuyến gốc của Slack và trạng thái luồng trợ lý Slack yêu cầu mục tiêu là một luồng phản hồi. DM cấp cao nhất không hiển thị bản xem trước kiểu luồng đó, nhưng vẫn có thể dùng bài đăng bản nháp xem trước và chỉnh sửa của Slack.

Di chuyển khóa cũ:

- Telegram: các giá trị cũ `streamMode` và `streaming` dạng vô hướng/boolean được phát hiện và di chuyển bởi các đường dẫn tương thích doctor/cấu hình sang `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean tự động di chuyển sang enum `streaming`.
- Slack: `streamMode` tự động di chuyển sang `streaming.mode`; `streaming` boolean tự động di chuyển sang `streaming.mode` cùng `streaming.nativeTransport`; `nativeStreaming` cũ tự động di chuyển sang `streaming.nativeTransport`.

### Hành vi runtime

Telegram:

- Dùng các bản cập nhật xem trước `sendMessage` + `editMessageText` trên DM và nhóm/chủ đề.
- Gửi một tin nhắn cuối mới thay vì chỉnh sửa tại chỗ khi bản xem trước đã hiển thị khoảng một phút, rồi dọn bản xem trước để dấu thời gian của Telegram phản ánh thời điểm hoàn tất phản hồi.
- Bỏ qua phát trực tuyến bản xem trước khi phát trực tuyến theo khối của Telegram được bật rõ ràng (để tránh phát trực tuyến kép).
- `/reasoning stream` có thể ghi suy luận vào bản xem trước.

Discord:

- Dùng tin nhắn xem trước gửi + chỉnh sửa.
- Chế độ `block` dùng chia đoạn bản nháp (`draftChunk`).
- Bỏ qua phát trực tuyến bản xem trước khi phát trực tuyến theo khối của Discord được bật rõ ràng.
- Phương tiện cuối, lỗi và tải trọng phản hồi rõ ràng hủy các bản xem trước đang chờ mà không xả bản nháp mới, rồi dùng cơ chế gửi bình thường.

Slack:

- `partial` có thể dùng phát trực tuyến gốc của Slack (`chat.startStream`/`append`/`stop`) khi khả dụng.
- `block` dùng bản xem trước bản nháp kiểu nối thêm.
- `progress` dùng văn bản xem trước trạng thái, rồi câu trả lời cuối.
- DM cấp cao nhất không có luồng phản hồi dùng bài đăng bản nháp xem trước và chỉnh sửa thay vì phát trực tuyến gốc của Slack.
- Phát trực tuyến bản xem trước gốc và bản nháp sẽ chặn phản hồi dạng khối cho lượt đó, vì vậy một phản hồi Slack chỉ được phát trực tuyến bởi một đường dẫn gửi.
- Tải trọng phương tiện/lỗi cuối và kết quả cuối của tiến trình không tạo tin nhắn bản nháp dùng một lần; chỉ các kết quả cuối dạng văn bản/khối có thể chỉnh sửa bản xem trước mới xả văn bản bản nháp đang chờ.

Mattermost:

- Phát trực tuyến suy nghĩ, hoạt động công cụ và văn bản phản hồi từng phần vào một bài đăng bản nháp xem trước duy nhất, hoàn tất tại chỗ khi câu trả lời cuối an toàn để gửi.
- Dự phòng bằng cách gửi một bài đăng cuối mới nếu bài đăng xem trước đã bị xóa hoặc không còn khả dụng tại thời điểm hoàn tất.
- Tải trọng phương tiện/lỗi cuối hủy các cập nhật xem trước đang chờ trước khi gửi bình thường thay vì xả một bài đăng xem trước tạm thời.

Matrix:

- Bản nháp xem trước hoàn tất tại chỗ khi văn bản cuối có thể tái sử dụng sự kiện xem trước.
- Các kết quả cuối chỉ có phương tiện, lỗi và không khớp mục tiêu phản hồi sẽ hủy các cập nhật xem trước đang chờ trước khi gửi bình thường; một bản xem trước cũ đã hiển thị sẽ bị biên tập lại.

### Cập nhật xem trước tiến trình công cụ

Phát trực tuyến bản xem trước cũng có thể bao gồm các cập nhật **tiến trình công cụ** — các dòng trạng thái ngắn như "đang tìm kiếm trên web", "đang đọc tệp", hoặc "đang gọi công cụ" — xuất hiện trong cùng tin nhắn xem trước khi công cụ đang chạy, trước phản hồi cuối. Điều này giữ cho các lượt công cụ nhiều bước có tín hiệu trực quan thay vì im lặng giữa bản xem trước suy nghĩ đầu tiên và câu trả lời cuối.

Bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram**, và **Matrix** mặc định phát trực tuyến tiến trình công cụ vào chỉnh sửa bản xem trước trực tiếp khi phát trực tuyến bản xem trước đang hoạt động. Microsoft Teams dùng luồng tiến trình gốc trong trò chuyện cá nhân.
- Telegram đã phát hành với cập nhật xem trước tiến trình công cụ được bật kể từ `v2026.4.22`; giữ chúng bật sẽ duy trì hành vi đã phát hành đó.
- **Mattermost** đã gộp hoạt động công cụ vào bài đăng bản nháp xem trước duy nhất của nó (xem ở trên).
- Các chỉnh sửa tiến trình công cụ tuân theo chế độ phát trực tuyến bản xem trước đang hoạt động; chúng bị bỏ qua khi phát trực tuyến bản xem trước là `off` hoặc khi phát trực tuyến theo khối đã tiếp quản tin nhắn. Trên Telegram, `streaming.mode: "off"` là chỉ phản hồi cuối: phần trao đổi tiến trình chung cũng bị chặn thay vì được gửi dưới dạng tin nhắn trạng thái độc lập, trong khi lời nhắc phê duyệt, tải trọng phương tiện và lỗi vẫn được định tuyến bình thường.
- Để giữ phát trực tuyến bản xem trước nhưng ẩn các dòng tiến trình công cụ, đặt `streaming.preview.toolProgress` thành `false` cho kênh đó. Để tắt hoàn toàn chỉnh sửa bản xem trước, đặt `streaming.mode` thành `off`.
- Phản hồi trích dẫn đã chọn của Telegram là ngoại lệ: khi `replyToMode` không phải `"off"` và có văn bản trích dẫn đã chọn, OpenClaw bỏ qua luồng xem trước câu trả lời cho lượt đó nên các dòng xem trước tiến trình công cụ không thể hiển thị. Phản hồi tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ phát trực tuyến bản xem trước. Xem [tài liệu kênh Telegram](/vi/channels/telegram) để biết chi tiết.

Ví dụ:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Liên quan

- [Bản nháp tiến trình](/vi/concepts/progress-drafts) — các tin nhắn công việc đang thực hiện hiển thị và cập nhật trong các lượt dài
- [Tin nhắn](/vi/concepts/messages) — vòng đời và cơ chế gửi tin nhắn
- [Thử lại](/vi/concepts/retry) — hành vi thử lại khi gửi thất bại
- [Kênh](/vi/channels) — hỗ trợ phát trực tuyến theo từng kênh
