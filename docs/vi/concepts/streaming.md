---
read_when:
    - Giải thích cách hoạt động của truyền phát hoặc chia đoạn trên các kênh
    - Thay đổi hành vi phát trực tuyến theo khối hoặc chia đoạn kênh
    - Gỡ lỗi phản hồi khối bị trùng lặp/quá sớm hoặc truyền phát bản xem trước kênh
summary: Hành vi phát trực tuyến + chia đoạn (phản hồi dạng khối, phát trực tuyến bản xem trước kênh, ánh xạ chế độ)
title: Truyền phát và chia đoạn
x-i18n:
    generated_at: "2026-05-03T10:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85f6cb33031a6c818bb709e0ed14d8dd0f8c30a3dd90468a40396b3a515b5e65
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp phát trực tuyến riêng biệt:

- **Phát trực tuyến khối (kênh):** phát các **khối** đã hoàn tất khi trợ lý viết. Đây là các tin nhắn kênh thông thường (không phải delta token).
- **Phát trực tuyến bản xem trước (Telegram/Discord/Slack):** cập nhật một **tin nhắn xem trước** tạm thời trong khi tạo nội dung.

Hiện nay **không có phát trực tuyến delta token thực sự** tới tin nhắn kênh. Phát trực tuyến bản xem trước dựa trên tin nhắn (gửi + chỉnh sửa/nối thêm).

## Phát trực tuyến khối (tin nhắn kênh)

Phát trực tuyến khối gửi đầu ra của trợ lý theo các đoạn thô khi chúng sẵn sàng.

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
- `channel send`: tin nhắn gửi ra thực tế (phản hồi khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè kênh: `*.blockStreaming` (và các biến thể theo từng tài khoản) để buộc `"on"`/`"off"` cho mỗi kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các khối được phát trực tuyến trước khi gửi).
- Giới hạn cứng của kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chia đoạn của kênh: `*.chunkMode` (`length` mặc định, `newline` tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài).
- Giới hạn mềm Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) tách các phản hồi cao để tránh bị cắt trong UI.

**Ngữ nghĩa ranh giới:**

- `text_end`: phát các khối ngay khi bộ chia đoạn phát ra; xả ở mỗi `text_end`.
- `message_end`: chờ đến khi tin nhắn trợ lý hoàn tất, rồi xả đầu ra đã đệm.

`message_end` vẫn dùng bộ chia đoạn nếu văn bản đã đệm vượt quá `maxChars`, nên có thể phát ra nhiều đoạn ở cuối.

### Gửi media với phát trực tuyến khối

Các chỉ thị `MEDIA:` là siêu dữ liệu gửi thông thường. Khi phát trực tuyến khối gửi sớm một khối media, OpenClaw ghi nhớ lần gửi đó cho lượt này. Nếu payload cuối cùng của trợ lý lặp lại cùng URL media, lần gửi cuối sẽ loại bỏ media trùng lặp thay vì gửi lại tệp đính kèm.

Các payload cuối trùng khớp chính xác sẽ bị chặn. Nếu payload cuối thêm văn bản riêng quanh media đã được phát trực tuyến, OpenClaw vẫn gửi văn bản mới trong khi giữ media chỉ được gửi một lần. Điều này ngăn ghi chú thoại hoặc tệp bị trùng trên các kênh như Telegram khi một agent phát ra `MEDIA:` trong quá trình phát trực tuyến và nhà cung cấp cũng đưa nó vào phản hồi đã hoàn tất.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Chia đoạn khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát cho đến khi bộ đệm >= `minChars` (trừ khi bị ép buộc).
- **Giới hạn cao:** ưu tiên tách trước `maxChars`; nếu bị ép buộc, tách tại `maxChars`.
- **Ưu tiên điểm ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Hàng rào mã:** không bao giờ tách bên trong hàng rào; khi bị ép buộc tại `maxChars`, đóng + mở lại hàng rào để giữ Markdown hợp lệ.

`maxChars` được kẹp theo `textChunkLimit` của kênh, nên bạn không thể vượt quá giới hạn theo từng kênh.

## Gộp (hợp nhất các khối được phát trực tuyến)

Khi phát trực tuyến khối được bật, OpenClaw có thể **hợp nhất các đoạn khối liên tiếp** trước khi gửi ra. Điều này giảm “rác một dòng” trong khi vẫn cung cấp đầu ra tăng dần.

- Gộp chờ **khoảng nghỉ nhàn rỗi** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá giới hạn đó.
- `minChars` ngăn các mảnh quá nhỏ được gửi cho đến khi tích lũy đủ văn bản (lần xả cuối luôn gửi văn bản còn lại).
- Bộ nối được suy ra từ `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → dấu cách).
- Có thể ghi đè theo kênh qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo từng tài khoản).
- `minChars` gộp mặc định được tăng lên 1500 cho Signal/Slack/Discord trừ khi bị ghi đè.

## Nhịp chờ giống con người giữa các khối

Khi phát trực tuyến khối được bật, bạn có thể thêm một **khoảng dừng ngẫu nhiên** giữa các phản hồi khối (sau khối đầu tiên). Điều này giúp các phản hồi nhiều bong bóng có cảm giác tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo từng agent qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Chỉ áp dụng cho **phản hồi khối**, không áp dụng cho phản hồi cuối hoặc tóm tắt công cụ.

## "Phát trực tuyến theo đoạn hoặc toàn bộ"

Ánh xạ như sau:

- **Phát trực tuyến theo đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát khi đang tạo). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Phát trực tuyến toàn bộ ở cuối:** `blockStreamingBreak: "message_end"` (xả một lần, có thể thành nhiều đoạn nếu rất dài).
- **Không phát trực tuyến khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối).

**Ghi chú kênh:** Phát trực tuyến khối **tắt trừ khi**
`*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể phát trực tuyến bản xem trước trực tiếp (`channels.<channel>.streaming`) mà không có phản hồi khối.

Nhắc lại vị trí cấu hình: các mặc định `blockStreaming*` nằm dưới
`agents.defaults`, không phải cấu hình gốc.

## Chế độ phát trực tuyến bản xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt phát trực tuyến bản xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo các bước chia đoạn/nối thêm.
- `progress`: bản xem trước tiến độ/trạng thái trong khi tạo, câu trả lời cuối khi hoàn tất.

### Ánh xạ kênh

| Kênh       | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | ánh xạ tới `partial`    |
| Discord    | ✅    | ✅        | ✅      | ánh xạ tới `partial`    |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Chỉ Slack:

- `channels.slack.streaming.nativeTransport` bật/tắt các lệnh gọi API phát trực tuyến gốc của Slack khi `channels.slack.streaming.mode="partial"` (mặc định: `true`).
- Phát trực tuyến gốc của Slack và trạng thái chuỗi trợ lý Slack cần một mục tiêu chuỗi phản hồi. DM cấp cao nhất không hiển thị bản xem trước kiểu chuỗi đó, nhưng vẫn có thể dùng bài đăng bản nháp xem trước và chỉnh sửa của Slack.

Di chuyển khóa cũ:

- Telegram: các giá trị cũ `streamMode` và `streaming` dạng vô hướng/boolean được phát hiện và di chuyển bởi các đường dẫn tương thích doctor/config sang `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean tự động di chuyển sang enum `streaming`.
- Slack: `streamMode` tự động di chuyển sang `streaming.mode`; `streaming` boolean tự động di chuyển sang `streaming.mode` cùng `streaming.nativeTransport`; `nativeStreaming` cũ tự động di chuyển sang `streaming.nativeTransport`.

### Hành vi runtime

Telegram:

- Dùng bản cập nhật xem trước `sendMessage` + `editMessageText` trên DM và nhóm/chủ đề.
- Gửi một tin nhắn cuối mới thay vì chỉnh sửa tại chỗ khi bản xem trước đã hiển thị khoảng một phút, rồi dọn bản xem trước để dấu thời gian của Telegram phản ánh lúc hoàn tất phản hồi.
- Bỏ qua phát trực tuyến bản xem trước khi phát trực tuyến khối Telegram được bật rõ ràng (để tránh phát trực tuyến kép).
- `/reasoning stream` có thể ghi lập luận vào bản xem trước.

Discord:

- Dùng tin nhắn xem trước gửi + chỉnh sửa.
- Chế độ `block` dùng chia đoạn bản nháp (`draftChunk`).
- Bỏ qua phát trực tuyến bản xem trước khi phát trực tuyến khối Discord được bật rõ ràng.
- Media cuối, lỗi và payload phản hồi tường minh hủy các bản xem trước đang chờ mà không xả bản nháp mới, rồi dùng cơ chế gửi thông thường.

Slack:

- `partial` có thể dùng phát trực tuyến gốc của Slack (`chat.startStream`/`append`/`stop`) khi có sẵn.
- `block` dùng bản xem trước bản nháp kiểu nối thêm.
- `progress` dùng văn bản xem trước trạng thái, rồi câu trả lời cuối.
- DM cấp cao nhất không có chuỗi phản hồi dùng bài đăng bản nháp xem trước và chỉnh sửa thay vì phát trực tuyến gốc của Slack.
- Phát trực tuyến bản xem trước gốc và bản nháp chặn phản hồi khối cho lượt đó, nên phản hồi Slack chỉ được phát trực tuyến qua một đường dẫn gửi.
- Payload media/lỗi cuối và kết thúc tiến độ không tạo tin nhắn bản nháp dùng một lần; chỉ các kết thúc văn bản/khối có thể chỉnh sửa bản xem trước mới xả văn bản bản nháp đang chờ.

Mattermost:

- Phát trực tuyến suy nghĩ, hoạt động công cụ và văn bản phản hồi từng phần vào một bài đăng bản nháp xem trước duy nhất, rồi hoàn tất tại chỗ khi câu trả lời cuối an toàn để gửi.
- Dự phòng bằng cách gửi một bài đăng cuối mới nếu bài đăng xem trước đã bị xóa hoặc không khả dụng tại thời điểm hoàn tất.
- Payload media/lỗi cuối hủy các bản cập nhật xem trước đang chờ trước khi gửi thông thường thay vì xả một bài đăng xem trước tạm thời.

Matrix:

- Bản xem trước bản nháp hoàn tất tại chỗ khi văn bản cuối có thể tái sử dụng sự kiện xem trước.
- Các kết thúc chỉ media, lỗi và không khớp mục tiêu phản hồi hủy các bản cập nhật xem trước đang chờ trước khi gửi thông thường; bản xem trước cũ đã hiển thị sẽ bị biên tập lại.

### Bản cập nhật xem trước tiến độ công cụ

Phát trực tuyến bản xem trước cũng có thể bao gồm các bản cập nhật **tiến độ công cụ** — các dòng trạng thái ngắn như "đang tìm kiếm trên web", "đang đọc tệp" hoặc "đang gọi công cụ" — xuất hiện trong cùng tin nhắn xem trước khi công cụ đang chạy, trước phản hồi cuối. Điều này giữ cho các lượt công cụ nhiều bước trông vẫn đang hoạt động thay vì im lặng giữa bản xem trước suy nghĩ đầu tiên và câu trả lời cuối.

Bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram** và **Matrix** mặc định phát trực tuyến tiến độ công cụ vào chỉnh sửa bản xem trước trực tiếp khi phát trực tuyến bản xem trước đang hoạt động.
- Telegram đã phát hành với bản cập nhật xem trước tiến độ công cụ được bật kể từ `v2026.4.22`; giữ chúng bật sẽ bảo toàn hành vi đã phát hành đó.
- **Mattermost** đã gộp hoạt động công cụ vào bài đăng bản nháp xem trước duy nhất của nó (xem ở trên).
- Các chỉnh sửa tiến độ công cụ tuân theo chế độ phát trực tuyến bản xem trước đang hoạt động; chúng bị bỏ qua khi phát trực tuyến bản xem trước là `off` hoặc khi phát trực tuyến khối đã tiếp quản tin nhắn. Trên Telegram, `streaming.mode: "off"` là chỉ-cuối: các thông báo tiến độ chung cũng bị chặn thay vì được gửi dưới dạng tin nhắn "Đang làm việc..." độc lập, trong khi lời nhắc phê duyệt, payload media và lỗi vẫn được định tuyến bình thường.
- Để giữ phát trực tuyến bản xem trước nhưng ẩn các dòng tiến độ công cụ, đặt `streaming.preview.toolProgress` thành `false` cho kênh đó. Để tắt hoàn toàn chỉnh sửa bản xem trước, đặt `streaming.mode` thành `off`.

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

- [Tin nhắn](/vi/concepts/messages) — vòng đời và gửi tin nhắn
- [Thử lại](/vi/concepts/retry) — hành vi thử lại khi gửi thất bại
- [Kênh](/vi/channels) — hỗ trợ phát trực tuyến theo từng kênh
