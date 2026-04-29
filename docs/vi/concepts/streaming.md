---
read_when:
    - Giải thích cách truyền phát hoặc chia nhỏ thành khối hoạt động trên các kênh
    - Thay đổi hành vi phát luồng khối hoặc chia đoạn kênh
    - Gỡ lỗi phản hồi khối bị trùng lặp/đến sớm hoặc truyền phát bản xem trước kênh
summary: Hành vi truyền phát + chia đoạn (phản hồi dạng khối, truyền phát bản xem trước kênh, ánh xạ chế độ)
title: Truyền phát và chia nhỏ
x-i18n:
    generated_at: "2026-04-29T22:40:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp truyền phát riêng biệt:

- **Truyền phát khối (kênh):** phát ra các **khối** hoàn chỉnh khi assistant đang viết. Đây là các thông điệp kênh thông thường (không phải token delta).
- **Truyền phát bản xem trước (Telegram/Discord/Slack):** cập nhật một **thông điệp xem trước** tạm thời trong khi tạo nội dung.

Hiện nay **không có truyền phát token-delta thực sự** tới thông điệp kênh. Truyền phát bản xem trước dựa trên thông điệp (gửi + chỉnh sửa/nối thêm).

## Truyền phát khối (thông điệp kênh)

Truyền phát khối gửi đầu ra của assistant theo các đoạn lớn khi chúng sẵn sàng.

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

- `text_delta/events`: sự kiện luồng mô hình (có thể thưa thớt với các mô hình không truyền phát).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn tối thiểu/tối đa + ưu tiên điểm ngắt.
- `channel send`: thông điệp gửi đi thực tế (phản hồi khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè theo kênh: `*.blockStreaming` (và các biến thể theo tài khoản) để buộc `"on"`/`"off"` cho từng kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các khối đã truyền phát trước khi gửi).
- Giới hạn cứng theo kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chia đoạn của kênh: `*.chunkMode` (`length` là mặc định, `newline` tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) tách các phản hồi cao để tránh bị cắt trong UI.

**Ngữ nghĩa ranh giới:**

- `text_end`: truyền phát khối ngay khi chunker phát ra; xả ở mỗi `text_end`.
- `message_end`: đợi đến khi thông điệp assistant hoàn tất, rồi xả đầu ra đã đệm.

`message_end` vẫn dùng chunker nếu văn bản đã đệm vượt quá `maxChars`, nên nó có thể phát ra nhiều đoạn ở cuối.

### Phân phối phương tiện với truyền phát khối

Chỉ thị `MEDIA:` là siêu dữ liệu phân phối thông thường. Khi truyền phát khối gửi sớm một khối phương tiện, OpenClaw ghi nhớ lần phân phối đó cho lượt này. Nếu payload assistant cuối cùng lặp lại cùng URL phương tiện, lần phân phối cuối sẽ loại bỏ phương tiện trùng lặp thay vì gửi lại tệp đính kèm.

Các payload cuối cùng trùng khớp chính xác sẽ bị chặn. Nếu payload cuối cùng thêm văn bản riêng biệt quanh phương tiện đã được truyền phát, OpenClaw vẫn gửi văn bản mới trong khi giữ phương tiện chỉ được phân phối một lần. Điều này ngăn ghi chú thoại hoặc tệp bị trùng lặp trên các kênh như Telegram khi agent phát ra `MEDIA:` trong lúc truyền phát và provider cũng đưa nó vào phản hồi hoàn tất.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Việc chia đoạn khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát ra cho đến khi bộ đệm >= `minChars` (trừ khi bị buộc).
- **Giới hạn cao:** ưu tiên tách trước `maxChars`; nếu bị buộc, tách tại `maxChars`.
- **Ưu tiên điểm ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Hàng rào mã:** không bao giờ tách bên trong hàng rào; khi bị buộc tại `maxChars`, đóng + mở lại hàng rào để giữ Markdown hợp lệ.

`maxChars` bị giới hạn theo `textChunkLimit` của kênh, nên bạn không thể vượt quá giới hạn của từng kênh.

## Gộp (hợp nhất các khối đã truyền phát)

Khi truyền phát khối được bật, OpenClaw có thể **gộp các đoạn khối liên tiếp** trước khi gửi chúng ra ngoài. Điều này giảm “spam một dòng” trong khi vẫn cung cấp đầu ra tăng dần.

- Gộp sẽ chờ **khoảng nghỉ không hoạt động** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá giới hạn đó.
- `minChars` ngăn các mảnh quá nhỏ được gửi cho đến khi tích lũy đủ văn bản (lần xả cuối luôn gửi văn bản còn lại).
- Bộ nối được suy ra từ `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → dấu cách).
- Ghi đè theo kênh có sẵn qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo tài khoản).
- `minChars` gộp mặc định được tăng lên 1500 cho Signal/Slack/Discord trừ khi bị ghi đè.

## Nhịp độ giống con người giữa các khối

Khi truyền phát khối được bật, bạn có thể thêm một **khoảng tạm dừng ngẫu nhiên** giữa các phản hồi khối (sau khối đầu tiên). Điều này làm cho các phản hồi nhiều bong bóng có cảm giác tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo agent qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Chỉ áp dụng cho **phản hồi khối**, không áp dụng cho phản hồi cuối cùng hoặc tóm tắt công cụ.

## "Truyền phát từng đoạn hoặc toàn bộ"

Điều này ánh xạ thành:

- **Truyền phát từng đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát ra khi đang tạo). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Truyền phát toàn bộ ở cuối:** `blockStreamingBreak: "message_end"` (xả một lần, có thể thành nhiều đoạn nếu rất dài).
- **Không truyền phát khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối cùng).

**Ghi chú kênh:** Truyền phát khối **tắt trừ khi**
`*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể truyền phát bản xem trước trực tiếp (`channels.<channel>.streaming`) mà không có phản hồi khối.

Nhắc lại vị trí cấu hình: các mặc định `blockStreaming*` nằm dưới `agents.defaults`, không phải cấu hình gốc.

## Chế độ truyền phát bản xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt truyền phát bản xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo các bước được chia đoạn/nối thêm.
- `progress`: bản xem trước tiến trình/trạng thái trong khi tạo, câu trả lời cuối cùng khi hoàn tất.

### Ánh xạ kênh

| Kênh       | `off` | `partial` | `block` | `progress`             |
| ---------- | ----- | --------- | ------- | ---------------------- |
| Telegram   | ✅    | ✅        | ✅      | ánh xạ tới `partial`   |
| Discord    | ✅    | ✅        | ✅      | ánh xạ tới `partial`   |
| Slack      | ✅    | ✅        | ✅      | ✅                     |
| Mattermost | ✅    | ✅        | ✅      | ✅                     |

Chỉ Slack:

- `channels.slack.streaming.nativeTransport` bật/tắt các lệnh gọi API truyền phát gốc của Slack khi `channels.slack.streaming.mode="partial"` (mặc định: `true`).
- Truyền phát gốc của Slack và trạng thái luồng assistant của Slack yêu cầu mục tiêu luồng phản hồi; DM cấp cao nhất không hiển thị bản xem trước kiểu luồng đó.

Di chuyển khóa cũ:

- Telegram: `streamMode` cũ và các giá trị `streaming` dạng vô hướng/boolean được phát hiện và di chuyển bởi các đường dẫn tương thích doctor/cấu hình sang `streaming.mode`.
- Discord: `streamMode` + boolean `streaming` tự động di chuyển sang enum `streaming`.
- Slack: `streamMode` tự động di chuyển sang `streaming.mode`; boolean `streaming` tự động di chuyển sang `streaming.mode` cộng với `streaming.nativeTransport`; `nativeStreaming` cũ tự động di chuyển sang `streaming.nativeTransport`.

### Hành vi runtime

Telegram:

- Dùng các cập nhật bản xem trước `sendMessage` + `editMessageText` trên DM và nhóm/chủ đề.
- Gửi thông điệp cuối cùng mới thay vì chỉnh sửa tại chỗ khi bản xem trước đã hiển thị khoảng một phút, rồi dọn bản xem trước để dấu thời gian của Telegram phản ánh thời điểm hoàn tất phản hồi.
- Bỏ qua truyền phát bản xem trước khi truyền phát khối của Telegram được bật rõ ràng (để tránh truyền phát kép).
- `/reasoning stream` có thể ghi lập luận vào bản xem trước.

Discord:

- Dùng gửi + chỉnh sửa thông điệp xem trước.
- Chế độ `block` dùng chia đoạn bản nháp (`draftChunk`).
- Bỏ qua truyền phát bản xem trước khi truyền phát khối của Discord được bật rõ ràng.
- Phương tiện cuối cùng, lỗi và payload phản hồi rõ ràng sẽ hủy các bản xem trước đang chờ mà không xả bản nháp mới, rồi dùng phân phối thông thường.

Slack:

- `partial` có thể dùng truyền phát gốc của Slack (`chat.startStream`/`append`/`stop`) khi có sẵn.
- `block` dùng bản xem trước bản nháp kiểu nối thêm.
- `progress` dùng văn bản xem trước trạng thái, rồi câu trả lời cuối cùng.
- Truyền phát bản xem trước gốc và bản nháp sẽ chặn phản hồi khối cho lượt đó, để một phản hồi Slack chỉ được truyền phát qua một đường phân phối.
- Payload phương tiện/lỗi cuối cùng và kết thúc tiến trình không tạo thông điệp bản nháp dùng một lần; chỉ các kết thúc văn bản/khối có thể chỉnh sửa bản xem trước mới xả văn bản bản nháp đang chờ.

Mattermost:

- Truyền phát suy nghĩ, hoạt động công cụ và văn bản phản hồi từng phần vào một bài đăng xem trước bản nháp duy nhất, hoàn tất tại chỗ khi câu trả lời cuối cùng an toàn để gửi.
- Quay về gửi một bài đăng cuối cùng mới nếu bài đăng xem trước đã bị xóa hoặc không khả dụng khi hoàn tất.
- Payload phương tiện/lỗi cuối cùng hủy các cập nhật xem trước đang chờ trước khi phân phối thông thường, thay vì xả một bài đăng xem trước tạm thời.

Matrix:

- Bản xem trước bản nháp hoàn tất tại chỗ khi văn bản cuối cùng có thể tái sử dụng sự kiện xem trước.
- Các kết thúc chỉ có phương tiện, lỗi và không khớp mục tiêu phản hồi sẽ hủy các cập nhật xem trước đang chờ trước khi phân phối thông thường; bản xem trước cũ đã hiển thị sẽ bị biên tập xóa.

### Cập nhật bản xem trước tiến trình công cụ

Truyền phát bản xem trước cũng có thể bao gồm các cập nhật **tiến trình công cụ** — các dòng trạng thái ngắn như "đang tìm kiếm trên web", "đang đọc tệp" hoặc "đang gọi công cụ" — xuất hiện trong cùng thông điệp xem trước khi công cụ đang chạy, trước phản hồi cuối cùng. Điều này giữ cho các lượt công cụ nhiều bước có chuyển động trực quan thay vì im lặng giữa bản xem trước suy nghĩ đầu tiên và câu trả lời cuối cùng.

Bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram** và **Matrix** mặc định truyền phát tiến trình công cụ vào chỉnh sửa bản xem trước trực tiếp khi truyền phát bản xem trước đang hoạt động.
- Telegram đã phát hành với cập nhật bản xem trước tiến trình công cụ được bật kể từ `v2026.4.22`; giữ chúng được bật sẽ duy trì hành vi đã phát hành đó.
- **Mattermost** đã gộp hoạt động công cụ vào một bài đăng xem trước bản nháp duy nhất của nó (xem ở trên).
- Các chỉnh sửa tiến trình công cụ tuân theo chế độ truyền phát bản xem trước đang hoạt động; chúng bị bỏ qua khi truyền phát bản xem trước là `off` hoặc khi truyền phát khối đã tiếp quản thông điệp. Trên Telegram, `streaming.mode: "off"` là chỉ-final: cuộc trao đổi tiến trình chung cũng bị chặn thay vì được phân phối dưới dạng các thông điệp "Working..." độc lập, trong khi lời nhắc phê duyệt, payload phương tiện và lỗi vẫn được định tuyến bình thường.
- Để giữ truyền phát bản xem trước nhưng ẩn các dòng tiến trình công cụ, đặt `streaming.preview.toolProgress` thành `false` cho kênh đó. Để tắt hoàn toàn chỉnh sửa bản xem trước, đặt `streaming.mode` thành `off`.

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

- [Thông điệp](/vi/concepts/messages) — vòng đời và phân phối thông điệp
- [Thử lại](/vi/concepts/retry) — hành vi thử lại khi phân phối thất bại
- [Kênh](/vi/channels) — hỗ trợ truyền phát theo từng kênh
