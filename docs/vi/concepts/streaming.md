---
read_when:
    - Giải thích cách hoạt động của truyền phát hoặc chia đoạn trên các kênh
    - Thay đổi hành vi truyền phát khối hoặc chia đoạn kênh
    - Gỡ lỗi các phản hồi dạng khối trùng lặp/quá sớm hoặc truyền phát bản xem trước kênh
summary: Hành vi truyền phát + chia đoạn (phản hồi dạng khối, truyền phát bản xem trước kênh, ánh xạ chế độ)
title: Truyền phát và chia đoạn
x-i18n:
    generated_at: "2026-05-06T17:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp truyền phát riêng biệt:

- **Truyền phát khối (kênh):** phát ra các **khối** đã hoàn tất khi trợ lý đang viết. Đây là các tin nhắn kênh thông thường (không phải delta token).
- **Truyền phát bản xem trước (Telegram/Discord/Slack):** cập nhật một **tin nhắn xem trước** tạm thời trong lúc tạo nội dung.

Hiện nay **không có truyền phát delta token thật sự** tới tin nhắn kênh. Truyền phát bản xem trước dựa trên tin nhắn (gửi + chỉnh sửa/nối thêm).

## Truyền phát khối (tin nhắn kênh)

Truyền phát khối gửi đầu ra của trợ lý theo các đoạn thô khi chúng sẵn sàng.

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

- `text_delta/events`: sự kiện luồng mô hình (có thể thưa với các mô hình không truyền phát).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn min/max + ưu tiên điểm ngắt.
- `channel send`: tin nhắn gửi ra thực tế (phản hồi khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè theo kênh: `*.blockStreaming` (và các biến thể theo tài khoản) để ép `"on"`/`"off"` cho từng kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các khối được truyền phát trước khi gửi).
- Giới hạn cứng của kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chia đoạn của kênh: `*.chunkMode` (`length` mặc định, `newline` tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) tách các phản hồi cao để tránh bị cắt giao diện.

**Ngữ nghĩa ranh giới:**

- `text_end`: truyền phát khối ngay khi chunker phát ra; xả ở mỗi `text_end`.
- `message_end`: đợi đến khi tin nhắn của trợ lý hoàn tất, rồi xả đầu ra đã đệm.

`message_end` vẫn dùng chunker nếu văn bản đã đệm vượt quá `maxChars`, vì vậy nó có thể phát ra nhiều đoạn ở cuối.

### Phân phối media với truyền phát khối

Chỉ thị `MEDIA:` là metadata phân phối thông thường. Khi truyền phát khối gửi sớm một khối media, OpenClaw ghi nhớ lần phân phối đó cho lượt này. Nếu payload cuối cùng của trợ lý lặp lại cùng URL media, lần phân phối cuối sẽ loại bỏ media trùng lặp thay vì gửi lại tệp đính kèm.

Các payload cuối cùng trùng khớp chính xác sẽ bị chặn. Nếu payload cuối cùng thêm văn bản riêng biệt xung quanh media đã được truyền phát, OpenClaw vẫn gửi văn bản mới trong khi giữ media chỉ được phân phối một lần. Điều này ngăn ghi chú thoại hoặc tệp bị lặp trên các kênh như Telegram khi một agent phát ra `MEDIA:` trong lúc truyền phát và provider cũng đưa nó vào phản hồi hoàn tất.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Chia đoạn khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát ra cho đến khi bộ đệm >= `minChars` (trừ khi bị ép).
- **Giới hạn cao:** ưu tiên tách trước `maxChars`; nếu bị ép, tách tại `maxChars`.
- **Ưu tiên điểm ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Code fence:** không bao giờ tách bên trong fence; khi bị ép tại `maxChars`, đóng + mở lại fence để giữ Markdown hợp lệ.

`maxChars` bị kẹp theo `textChunkLimit` của kênh, nên bạn không thể vượt quá giới hạn của từng kênh.

## Gộp (hợp nhất các khối được truyền phát)

Khi truyền phát khối được bật, OpenClaw có thể **gộp các đoạn khối liên tiếp** trước khi gửi chúng ra ngoài. Điều này giảm “spam một dòng” trong khi vẫn cung cấp đầu ra lũy tiến.

- Gộp sẽ đợi **khoảng nghỉ nhàn rỗi** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá giới hạn đó.
- `minChars` ngăn các mảnh quá nhỏ được gửi cho đến khi tích lũy đủ văn bản (lần xả cuối luôn gửi phần văn bản còn lại).
- Ký tự nối được suy ra từ `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → dấu cách).
- Có thể ghi đè theo kênh qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo tài khoản).
- `minChars` gộp mặc định được tăng lên 1500 cho Signal/Slack/Discord trừ khi được ghi đè.

## Nhịp chờ giống con người giữa các khối

Khi truyền phát khối được bật, bạn có thể thêm một **khoảng tạm dừng ngẫu nhiên** giữa các phản hồi khối (sau khối đầu tiên). Điều này làm các phản hồi nhiều bong bóng có cảm giác tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo agent qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Chỉ áp dụng cho **phản hồi khối**, không áp dụng cho phản hồi cuối hoặc tóm tắt công cụ.

## "Truyền phát từng đoạn hoặc toàn bộ"

Điều này ánh xạ thành:

- **Truyền phát từng đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát ra khi đang chạy). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Truyền phát toàn bộ ở cuối:** `blockStreamingBreak: "message_end"` (xả một lần, có thể thành nhiều đoạn nếu rất dài).
- **Không truyền phát khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối).

**Ghi chú về kênh:** Truyền phát khối **tắt trừ khi**
`*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể truyền phát bản xem trước trực tiếp
(`channels.<channel>.streaming`) mà không có phản hồi khối.

Nhắc lại vị trí cấu hình: các mặc định `blockStreaming*` nằm dưới
`agents.defaults`, không phải cấu hình gốc.

## Chế độ truyền phát bản xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt truyền phát bản xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo các bước chia đoạn/nối thêm.
- `progress`: bản xem trước tiến độ/trạng thái trong lúc tạo, câu trả lời cuối khi hoàn tất.

`streaming.mode: "block"` là một chế độ truyền phát bản xem trước cho các kênh có thể chỉnh sửa như Discord và Telegram. Nó không bật phân phối khối qua kênh ở đó. Dùng `streaming.block.enabled` hoặc khóa kênh cũ `blockStreaming` khi bạn muốn phản hồi khối thông thường. Microsoft Teams là ngoại lệ: nó không có cơ chế truyền khối dạng bản nháp xem trước, nên `streaming.mode: "block"` ánh xạ sang phân phối khối của Teams thay vì truyền phát partial/progress gốc.

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
- Truyền phát gốc của Slack và trạng thái luồng trợ lý Slack yêu cầu mục tiêu là một luồng trả lời. DM cấp cao nhất không hiển thị bản xem trước kiểu luồng đó, nhưng vẫn có thể dùng bài đăng bản nháp xem trước và chỉnh sửa của Slack.

Di trú khóa cũ:

- Telegram: các giá trị `streamMode` cũ và `streaming` dạng vô hướng/boolean được phát hiện và di trú bởi các đường dẫn tương thích doctor/cấu hình sang `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean vẫn là bí danh runtime cho enum `streaming`; chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu.
- Slack: `streamMode` vẫn là bí danh runtime cho `streaming.mode`; `streaming` boolean vẫn là bí danh runtime cho `streaming.mode` cộng với `streaming.nativeTransport`; `nativeStreaming` cũ vẫn là bí danh runtime cho `streaming.nativeTransport`. Chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu.

### Hành vi runtime

Telegram:

- Dùng `sendMessage` + cập nhật bản xem trước bằng `editMessageText` trên DM và nhóm/chủ đề.
- Văn bản cuối chỉnh sửa bản xem trước đang hoạt động tại chỗ; kết quả cuối dài sẽ dùng lại tin nhắn đó cho đoạn đầu tiên và chỉ gửi các đoạn còn lại.
- Chế độ `progress` giữ tiến độ công cụ trong một bản nháp trạng thái có thể chỉnh sửa, xóa bản nháp đó khi hoàn tất, rồi gửi câu trả lời cuối qua phân phối thông thường.
- Nếu chỉnh sửa cuối thất bại trước khi văn bản hoàn tất được xác nhận, OpenClaw dùng phân phối cuối thông thường và dọn bản xem trước cũ.
- Truyền phát bản xem trước bị bỏ qua khi truyền phát khối Telegram được bật rõ ràng (để tránh truyền phát kép).
- `/reasoning stream` có thể ghi phần suy luận vào một bản xem trước tạm thời, bản này sẽ bị xóa sau khi phân phối cuối.

Discord:

- Dùng tin nhắn xem trước gửi + chỉnh sửa.
- Chế độ `block` dùng chia đoạn bản nháp (`draftChunk`).
- Truyền phát bản xem trước bị bỏ qua khi truyền phát khối Discord được bật rõ ràng.
- Payload cuối là media, lỗi, và trả lời rõ ràng sẽ hủy các bản xem trước đang chờ mà không xả bản nháp mới, rồi dùng phân phối thông thường.

Slack:

- `partial` có thể dùng truyền phát gốc của Slack (`chat.startStream`/`append`/`stop`) khi khả dụng.
- `block` dùng bản xem trước bản nháp kiểu nối thêm.
- `progress` dùng văn bản xem trước trạng thái, rồi câu trả lời cuối.
- DM cấp cao nhất không có luồng trả lời dùng bài đăng bản nháp xem trước và chỉnh sửa thay vì truyền phát gốc của Slack.
- Truyền phát bản xem trước gốc và bản nháp sẽ chặn phản hồi khối cho lượt đó, nên một phản hồi Slack chỉ được truyền phát bởi một đường dẫn phân phối.
- Payload media/lỗi cuối và kết quả cuối tiến độ không tạo tin nhắn bản nháp dùng rồi bỏ; chỉ các kết quả cuối dạng văn bản/khối có thể chỉnh sửa bản xem trước mới xả văn bản bản nháp đang chờ.

Mattermost:

- Truyền phát suy nghĩ, hoạt động công cụ, và văn bản phản hồi từng phần vào một bài đăng bản nháp xem trước duy nhất, được hoàn tất tại chỗ khi câu trả lời cuối an toàn để gửi.
- Dự phòng bằng cách gửi một bài đăng cuối mới nếu bài đăng xem trước đã bị xóa hoặc không còn khả dụng khi hoàn tất.
- Payload media/lỗi cuối hủy các cập nhật xem trước đang chờ trước khi phân phối thông thường, thay vì xả một bài đăng xem trước tạm thời.

Matrix:

- Bản nháp xem trước được hoàn tất tại chỗ khi văn bản cuối có thể dùng lại sự kiện xem trước.
- Kết quả cuối chỉ có media, lỗi, và mục tiêu trả lời không khớp sẽ hủy các cập nhật xem trước đang chờ trước khi phân phối thông thường; một bản xem trước cũ đã hiển thị sẽ bị gỡ bỏ.

### Cập nhật bản xem trước tiến độ công cụ

Truyền phát bản xem trước cũng có thể bao gồm các cập nhật **tiến độ công cụ** - các dòng trạng thái ngắn như "đang tìm kiếm trên web", "đang đọc tệp", hoặc "đang gọi công cụ" - xuất hiện trong cùng tin nhắn xem trước khi công cụ đang chạy, trước phản hồi cuối. Điều này giữ cho các lượt công cụ nhiều bước vẫn sống động về mặt hình ảnh thay vì im lặng giữa bản xem trước suy nghĩ đầu tiên và câu trả lời cuối.

Bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram** và **Matrix** mặc định truyền trực tuyến tiến trình công cụ vào bản chỉnh sửa xem trước trực tiếp khi truyền trực tuyến bản xem trước đang hoạt động. Microsoft Teams dùng luồng tiến trình gốc trong các cuộc trò chuyện cá nhân.
- Telegram đã phát hành với các bản cập nhật xem trước tiến trình công cụ được bật kể từ `v2026.4.22`; việc tiếp tục bật chúng sẽ giữ nguyên hành vi đã phát hành đó.
- **Mattermost** đã gộp hoạt động công cụ vào bài đăng xem trước bản nháp duy nhất của nó (xem ở trên).
- Các chỉnh sửa tiến trình công cụ tuân theo chế độ truyền trực tuyến bản xem trước đang hoạt động; chúng bị bỏ qua khi truyền trực tuyến bản xem trước là `off` hoặc khi truyền trực tuyến khối đã tiếp quản tin nhắn. Trên Telegram, `streaming.mode: "off"` là chỉ gửi kết quả cuối cùng: nội dung trò chuyện tiến trình chung cũng bị chặn thay vì được gửi dưới dạng tin nhắn trạng thái độc lập, trong khi lời nhắc phê duyệt, tải trọng phương tiện và lỗi vẫn được định tuyến bình thường.
- Để giữ truyền trực tuyến bản xem trước nhưng ẩn các dòng tiến trình công cụ, đặt `streaming.preview.toolProgress` thành `false` cho kênh đó. Để giữ các dòng tiến trình công cụ hiển thị trong khi ẩn văn bản lệnh/thực thi, đặt `streaming.preview.commandText` thành `"status"` hoặc `streaming.progress.commandText` thành `"status"`; mặc định là `"raw"` để giữ nguyên hành vi đã phát hành. Chính sách này được chia sẻ bởi các kênh bản nháp/tiến trình dùng trình kết xuất tiến trình gọn của OpenClaw, bao gồm Discord, Matrix, Microsoft Teams, Mattermost, bản xem trước bản nháp Slack và Telegram. Để tắt hoàn toàn các chỉnh sửa xem trước, đặt `streaming.mode` thành `off`.
- Phản hồi trích dẫn đã chọn trên Telegram là một ngoại lệ: khi `replyToMode` không phải là `"off"` và có văn bản trích dẫn đã chọn, OpenClaw bỏ qua luồng xem trước câu trả lời cho lượt đó nên các dòng xem trước tiến trình công cụ không thể hiển thị. Các phản hồi tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ truyền trực tuyến bản xem trước. Xem [tài liệu kênh Telegram](/vi/channels/telegram) để biết chi tiết.

Giữ các dòng tiến trình hiển thị nhưng ẩn văn bản lệnh/thực thi thô:

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

Dùng cùng cấu trúc dưới một khóa kênh tiến trình gọn khác, ví dụ `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, hoặc bản xem trước bản nháp Slack. Với chế độ bản nháp tiến trình, đặt cùng chính sách dưới `streaming.progress`:

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

- [Tái cấu trúc vòng đời tin nhắn](/vi/concepts/message-lifecycle-refactor) - thiết kế mục tiêu chung cho bản xem trước, chỉnh sửa, luồng và hoàn tất
- [Bản nháp tiến trình](/vi/concepts/progress-drafts) - các tin nhắn công việc đang tiến hành hiển thị được cập nhật trong các lượt dài
- [Tin nhắn](/vi/concepts/messages) - vòng đời và phân phối tin nhắn
- [Thử lại](/vi/concepts/retry) - hành vi thử lại khi phân phối thất bại
- [Kênh](/vi/channels) - hỗ trợ truyền trực tuyến theo từng kênh
