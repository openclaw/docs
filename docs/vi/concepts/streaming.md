---
read_when:
    - Giải thích cách hoạt động của truyền phát trực tiếp hoặc chia khối trên các kênh
    - Thay đổi hành vi truyền phát theo khối hoặc chia đoạn kênh
    - Gỡ lỗi phản hồi chặn bị trùng lặp/quá sớm hoặc phát trực tuyến bản xem trước kênh
summary: Hành vi streaming + chia khúc (phản hồi dạng khối, streaming bản xem trước kênh, ánh xạ chế độ)
title: Phát trực tuyến và chia khối
x-i18n:
    generated_at: "2026-07-01T08:11:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp streaming riêng biệt:

- **Streaming theo khối (kênh):** phát ra các **khối** hoàn chỉnh khi assistant viết. Đây là các tin nhắn kênh bình thường (không phải delta token).
- **Streaming bản xem trước (Telegram/Discord/Slack):** cập nhật một **tin nhắn xem trước** tạm thời trong khi tạo nội dung.

Hiện nay **không có streaming delta token thực sự** tới tin nhắn kênh. Streaming bản xem trước dựa trên tin nhắn (gửi + chỉnh sửa/nối thêm).

## Streaming theo khối (tin nhắn kênh)

Streaming theo khối gửi đầu ra của assistant theo các đoạn thô khi chúng sẵn sàng.

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

- `text_delta/events`: sự kiện stream của mô hình (có thể thưa thớt với các mô hình không streaming).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn tối thiểu/tối đa + ưu tiên điểm ngắt.
- `channel send`: các tin nhắn gửi ra thực tế (phản hồi theo khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè theo kênh: `*.blockStreaming` (và các biến thể theo tài khoản) để buộc `"on"`/`"off"` cho từng kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các khối được stream trước khi gửi).
- Giới hạn cứng của kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chia đoạn của kênh: `*.chunkMode` (`length` mặc định, `newline` tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) tách các phản hồi cao để tránh bị cắt trong UI.

**Ngữ nghĩa ranh giới:**

- `text_end`: stream các khối ngay khi chunker phát ra; xả sau mỗi `text_end`.
- `message_end`: đợi đến khi tin nhắn assistant hoàn tất, rồi xả đầu ra đã đệm.

`message_end` vẫn dùng chunker nếu văn bản đã đệm vượt quá `maxChars`, vì vậy nó có thể phát ra nhiều đoạn ở cuối.

### Phân phối phương tiện với streaming theo khối

Phương tiện streaming phải dùng các trường payload có cấu trúc như `mediaUrl` hoặc
`mediaUrls`; văn bản được stream không được phân tích như một lệnh đính kèm. Khi streaming theo khối
gửi phương tiện sớm, OpenClaw ghi nhớ lần phân phối đó cho lượt này. Nếu
payload cuối cùng của assistant lặp lại cùng URL phương tiện, lần phân phối cuối
sẽ loại bỏ phương tiện trùng lặp thay vì gửi lại tệp đính kèm.

Các payload cuối cùng trùng lặp chính xác sẽ bị chặn. Nếu payload cuối cùng thêm
văn bản riêng biệt xung quanh phương tiện đã được stream, OpenClaw vẫn gửi
văn bản mới trong khi giữ phương tiện chỉ được phân phối một lần. Điều này ngăn trùng lặp ghi chú thoại
hoặc tệp trên các kênh như Telegram.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Chia đoạn theo khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát ra cho đến khi bộ đệm >= `minChars` (trừ khi bị buộc).
- **Giới hạn cao:** ưu tiên tách trước `maxChars`; nếu bị buộc, tách tại `maxChars`.
- **Ưu tiên điểm ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Khối mã:** không bao giờ tách bên trong khối mã; khi bị buộc tại `maxChars`, đóng + mở lại khối mã để giữ Markdown hợp lệ.

`maxChars` được giới hạn theo `textChunkLimit` của kênh, nên bạn không thể vượt quá giới hạn từng kênh.

## Gộp (hợp nhất các khối được stream)

Khi streaming theo khối được bật, OpenClaw có thể **hợp nhất các đoạn khối liên tiếp**
trước khi gửi chúng ra ngoài. Điều này giảm "spam một dòng" trong khi vẫn cung cấp
đầu ra tăng dần.

- Gộp chờ các **khoảng nghỉ không hoạt động** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá giới hạn đó.
- `minChars` ngăn các mảnh quá nhỏ được gửi cho đến khi tích lũy đủ văn bản
  (lần xả cuối luôn gửi phần văn bản còn lại).
- Dấu nối được suy ra từ `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → dấu cách).
- Có thể ghi đè theo kênh qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo tài khoản).
- `minChars` gộp mặc định được tăng lên 1500 cho Signal/Slack/Discord trừ khi được ghi đè.

## Nhịp tự nhiên giữa các khối

Khi streaming theo khối được bật, bạn có thể thêm một **khoảng tạm dừng ngẫu nhiên** giữa
các phản hồi theo khối (sau khối đầu tiên). Điều này khiến phản hồi nhiều bong bóng trông
tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo từng agent qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Chỉ áp dụng cho **phản hồi theo khối**, không áp dụng cho phản hồi cuối cùng hoặc tóm tắt công cụ.

## "Stream các đoạn hay toàn bộ"

Điều này ánh xạ tới:

- **Truyền phát từng đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát ra khi có nội dung). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Truyền phát mọi thứ ở cuối:** `blockStreamingBreak: "message_end"` (xả một lần, có thể thành nhiều đoạn nếu rất dài).
- **Không truyền phát block:** `blockStreamingDefault: "off"` (chỉ trả lời cuối cùng).

**Ghi chú về kênh:** Truyền phát block **tắt trừ khi**
`*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể truyền phát bản xem trước trực tiếp
(`channels.<channel>.streaming`) mà không có trả lời block.

Nhắc lại vị trí cấu hình: các mặc định `blockStreaming*` nằm trong
`agents.defaults`, không phải cấu hình gốc.

## Chế độ truyền phát bản xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt truyền phát bản xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo các bước chia đoạn/nối thêm.
- `progress`: bản xem trước tiến độ/trạng thái trong khi tạo, câu trả lời cuối cùng khi hoàn tất.

`streaming.mode: "block"` là chế độ truyền phát bản xem trước cho các kênh có thể chỉnh sửa
như Discord và Telegram. Nó không bật phân phối block của kênh tại đó.
Dùng `streaming.block.enabled` hoặc khóa kênh cũ `blockStreaming` khi
bạn muốn trả lời block thông thường. Microsoft Teams là ngoại lệ: kênh này không có
cơ chế truyền tải block bản xem trước nháp, nên `streaming.mode: "block"` ánh xạ sang phân phối block của Teams
thay vì truyền phát một phần/tiến độ gốc.

### Ánh xạ kênh

| Kênh       | `off` | `partial` | `block` | `progress`                    |
| ---------- | ----- | --------- | ------- | ----------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bản nháp tiến độ có thể sửa   |
| Discord    | ✅    | ✅        | ✅      | bản nháp tiến độ có thể sửa   |
| Slack      | ✅    | ✅        | ✅      | ✅                            |
| Mattermost | ✅    | ✅        | ✅      | ✅                            |
| MS Teams   | ✅    | ✅        | ✅      | luồng tiến độ gốc             |

Chỉ Slack:

- `channels.slack.streaming.nativeTransport` bật/tắt các lệnh gọi API truyền phát gốc của Slack khi `channels.slack.streaming.mode="partial"` (mặc định: `true`).
- Truyền phát gốc của Slack và trạng thái chuỗi trợ lý Slack yêu cầu mục tiêu chuỗi trả lời. DM cấp cao nhất không hiển thị bản xem trước kiểu chuỗi đó, nhưng vẫn có thể dùng bài đăng bản xem trước nháp và chỉnh sửa của Slack.

Di chuyển khóa cũ:

- Telegram: các giá trị cũ `streamMode` và `streaming` dạng vô hướng/boolean được phát hiện và di chuyển bởi các đường dẫn tương thích doctor/config sang `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean vẫn là alias runtime cho enum `streaming`; chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu.
- Slack: `streamMode` vẫn là alias runtime cho `streaming.mode`; `streaming` boolean vẫn là alias runtime cho `streaming.mode` cộng với `streaming.nativeTransport`; `nativeStreaming` cũ vẫn là alias runtime cho `streaming.nativeTransport`. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu.

### Hành vi runtime

Telegram:

- Dùng `sendMessage` + các bản cập nhật xem trước `editMessageText` trên DM và nhóm/chủ đề.
- Các bản xem trước ban đầu ngắn vẫn được debounce cho UX thông báo đẩy, nhưng Telegram hiện hiện thực hóa chúng sau một độ trễ có giới hạn để các lượt chạy đang hoạt động không bị im lặng về mặt hiển thị.
- Văn bản cuối cùng chỉnh sửa bản xem trước đang hoạt động tại chỗ; các kết quả cuối dài tái sử dụng tin nhắn đó cho đoạn đầu tiên và chỉ gửi các đoạn còn lại.
- Chế độ `block` xoay bản xem trước thành một tin nhắn mới tại `streaming.preview.chunk.maxChars` (mặc định 800, bị giới hạn bởi giới hạn chỉnh sửa 4096 của Telegram); các chế độ khác mở rộng một bản xem trước lên tối đa 4096 ký tự.
- Chế độ `progress` giữ tiến độ công cụ trong một bản nháp trạng thái có thể chỉnh sửa, hiện thực hóa nhãn trạng thái khi truyền phát câu trả lời đang hoạt động nhưng chưa có dòng công cụ, xóa bản nháp đó khi hoàn tất, và gửi câu trả lời cuối cùng qua cơ chế phân phối thông thường.
- Nếu chỉnh sửa cuối cùng thất bại trước khi văn bản hoàn tất được xác nhận, OpenClaw dùng phân phối cuối thông thường và dọn bản xem trước cũ.
- Truyền phát bản xem trước bị bỏ qua khi truyền phát block Telegram được bật rõ ràng (để tránh truyền phát hai lần).
- `/reasoning stream` có thể ghi phần suy luận vào một bản xem trước tạm thời sẽ bị xóa sau khi phân phối cuối cùng.

Discord:

- Dùng gửi + chỉnh sửa tin nhắn xem trước.
- Chế độ `block` dùng chia đoạn nháp (`draftChunk`).
- Truyền phát bản xem trước bị bỏ qua khi truyền phát block Discord được bật rõ ràng.
- Phương tiện cuối, lỗi, và payload trả lời rõ ràng hủy các bản xem trước đang chờ mà không xả bản nháp mới, rồi dùng phân phối thông thường.

Slack:

- `partial` có thể dùng truyền phát gốc của Slack (`chat.startStream`/`append`/`stop`) khi khả dụng.
- `block` dùng bản xem trước nháp kiểu nối thêm.
- `progress` dùng văn bản xem trước trạng thái, rồi câu trả lời cuối cùng.
- DM cấp cao nhất không có chuỗi trả lời dùng bài đăng bản xem trước nháp và chỉnh sửa thay vì truyền phát gốc của Slack.
- Truyền phát bản xem trước gốc và nháp chặn trả lời block cho lượt đó, nên một trả lời Slack chỉ được truyền phát bởi một đường dẫn phân phối.
- Payload phương tiện/lỗi cuối và kết quả cuối tiến độ không tạo tin nhắn nháp dùng một lần; chỉ các kết quả cuối dạng văn bản/block có thể chỉnh sửa bản xem trước mới xả văn bản nháp đang chờ.

Mattermost:

- Truyền phát suy nghĩ, hoạt động công cụ, và văn bản trả lời một phần vào một bài đăng bản xem trước nháp duy nhất, rồi hoàn tất tại chỗ khi câu trả lời cuối cùng an toàn để gửi.
- Rơi về gửi một bài đăng cuối mới nếu bài đăng xem trước đã bị xóa hoặc không còn khả dụng tại thời điểm hoàn tất.
- Payload phương tiện/lỗi cuối hủy các bản cập nhật xem trước đang chờ trước khi phân phối thông thường thay vì xả một bài đăng xem trước tạm thời.

Matrix:

- Bản xem trước nháp hoàn tất tại chỗ khi văn bản cuối cùng có thể tái sử dụng sự kiện xem trước.
- Kết quả cuối chỉ có phương tiện, lỗi, và không khớp mục tiêu trả lời hủy các bản cập nhật xem trước đang chờ trước khi phân phối thông thường; một bản xem trước cũ đã hiển thị sẽ bị biên tập lại.

### Cập nhật bản xem trước tiến độ công cụ

Truyền phát bản xem trước cũng có thể bao gồm các cập nhật **tiến độ công cụ** - các dòng trạng thái ngắn như "đang tìm kiếm trên web", "đang đọc tệp", hoặc "đang gọi công cụ" - xuất hiện trong cùng tin nhắn xem trước khi công cụ đang chạy, trước câu trả lời cuối cùng. Trong chế độ máy chủ ứng dụng Codex, các tin nhắn mở đầu/bình luận của Codex dùng cùng đường dẫn xem trước này, nên các ghi chú tiến độ ngắn như "Tôi đang kiểm tra..." có thể truyền phát vào bản nháp có thể chỉnh sửa mà không trở thành một phần của câu trả lời cuối cùng. Điều này giúp các lượt công cụ nhiều bước luôn có phản hồi hiển thị thay vì im lặng giữa bản xem trước suy nghĩ đầu tiên và câu trả lời cuối cùng.

Các công cụ chạy lâu có thể phát tiến độ có kiểu trước khi trả về. Ví dụ,
`web_fetch` đặt một bộ hẹn giờ năm giây khi bắt đầu: nếu thao tác fetch vẫn
đang chờ, bản xem trước có thể hiển thị `Fetching page content...`; nếu fetch hoàn tất
hoặc bị hủy trước đó, không có dòng tiến độ nào được phát. Kết quả công cụ cuối cùng sau đó
vẫn được phân phối bình thường cho mô hình.

Bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram** và **Matrix** mặc định truyền phát tiến trình công cụ và các cập nhật phần mở đầu của Codex vào bản chỉnh sửa xem trước trực tiếp khi tính năng truyền phát bản xem trước đang hoạt động. Microsoft Teams dùng luồng tiến trình gốc của nó trong các cuộc trò chuyện cá nhân.
- Telegram đã phát hành với các cập nhật xem trước tiến trình công cụ được bật kể từ `v2026.4.22`; giữ chúng bật sẽ duy trì hành vi đã phát hành đó.
- **Mattermost** đã gộp hoạt động công cụ vào một bài đăng xem trước bản nháp duy nhất của nó (xem ở trên).
- Các chỉnh sửa tiến trình công cụ tuân theo chế độ truyền phát bản xem trước đang hoạt động; chúng bị bỏ qua khi truyền phát bản xem trước là `off` hoặc khi truyền phát khối đã tiếp quản tin nhắn. Trên Telegram, `streaming.mode: "off"` là chỉ-kết-quả-cuối: phần trò chuyện tiến trình chung cũng bị chặn thay vì được gửi dưới dạng tin nhắn trạng thái độc lập, trong khi lời nhắc phê duyệt, tải trọng phương tiện và lỗi vẫn được định tuyến bình thường.
- Để giữ truyền phát bản xem trước nhưng ẩn các dòng tiến trình công cụ, đặt `streaming.preview.toolProgress` thành `false` cho kênh đó. Để giữ các dòng tiến trình công cụ hiển thị trong khi ẩn văn bản lệnh/thực thi, đặt `streaming.preview.commandText` thành `"status"` hoặc `streaming.progress.commandText` thành `"status"`; mặc định là `"raw"` để duy trì hành vi đã phát hành. Chính sách này được chia sẻ bởi các kênh nháp/tiến trình dùng trình kết xuất tiến trình gọn của OpenClaw, bao gồm Discord, Matrix, Microsoft Teams, Mattermost, bản xem trước nháp Slack và Telegram. Để tắt hoàn toàn các chỉnh sửa xem trước, đặt `streaming.mode` thành `off`.
- Các phản hồi trích dẫn đã chọn của Telegram là một ngoại lệ: khi `replyToMode` không phải là `"off"` và có văn bản trích dẫn đã chọn, OpenClaw bỏ qua luồng xem trước câu trả lời cho lượt đó để các dòng xem trước tiến trình công cụ không thể hiển thị. Các phản hồi tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ truyền phát bản xem trước. Xem [tài liệu kênh Telegram](/vi/channels/telegram) để biết chi tiết.

### Làn tiến trình bình luận

Ngoài tiến trình công cụ, trình kết xuất tiến trình gọn có thể hiển thị thêm một làn nữa trong bản nháp:

- **`streaming.progress.commentary`** — kết xuất **bình luận** trước công cụ của mô hình (💬) — phần tường thuật ngắn "Tôi sẽ kiểm tra… rồi…" — xen kẽ với các dòng công cụ trong bản nháp tiến trình.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

Dùng cùng dạng dưới khóa kênh tiến trình gọn khác, ví dụ `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, hoặc bản xem trước nháp Slack. Với chế độ bản nháp tiến trình, đặt cùng chính sách dưới `streaming.progress`:

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

- [Tái cấu trúc vòng đời tin nhắn](/vi/concepts/message-lifecycle-refactor) - thiết kế chung mục tiêu cho xem trước, chỉnh sửa, truyền phát và hoàn tất
- [Bản nháp tiến trình](/vi/concepts/progress-drafts) - các tin nhắn công việc đang diễn ra hiển thị và cập nhật trong các lượt dài
- [Tin nhắn](/vi/concepts/messages) - vòng đời và phân phối tin nhắn
- [Thử lại](/vi/concepts/retry) - hành vi thử lại khi phân phối thất bại
- [Kênh](/vi/channels) - hỗ trợ truyền phát theo từng kênh
