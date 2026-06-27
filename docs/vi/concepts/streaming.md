---
read_when:
    - Giải thích cách hoạt động của phát trực tuyến hoặc chia nhỏ trên các kênh
    - Thay đổi hành vi truyền phát khối hoặc chia đoạn kênh
    - Gỡ lỗi phản hồi chặn trùng lặp/quá sớm hoặc truyền phát bản xem trước kênh
summary: Hành vi truyền phát + chia khúc (phản hồi theo khối, truyền phát bản xem trước kênh, ánh xạ chế độ)
title: Truyền phát và chia khúc
x-i18n:
    generated_at: "2026-06-27T17:26:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp phát trực tuyến riêng biệt:

- **Phát trực tuyến khối (kênh):** phát ra các **khối** đã hoàn tất khi trợ lý viết. Đây là các tin nhắn kênh thông thường (không phải delta token).
- **Phát trực tuyến bản xem trước (Telegram/Discord/Slack):** cập nhật một **tin nhắn xem trước** tạm thời trong khi tạo nội dung.

Hiện nay **không có phát trực tuyến delta token thật sự** tới tin nhắn kênh. Phát trực tuyến bản xem trước dựa trên tin nhắn (gửi + chỉnh sửa/nối thêm).

## Phát trực tuyến khối (tin nhắn kênh)

Phát trực tuyến khối gửi đầu ra của trợ lý theo các đoạn lớn khi chúng sẵn sàng.

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
- `channel send`: các tin nhắn gửi ra thực tế (phản hồi dạng khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè theo kênh: `*.blockStreaming` (và các biến thể theo từng tài khoản) để buộc `"on"`/`"off"` cho từng kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các khối được phát trực tuyến trước khi gửi).
- Giới hạn cứng của kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chia đoạn của kênh: `*.chunkMode` (`length` mặc định, `newline` tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) tách các phản hồi cao để tránh bị cắt trong giao diện.

**Ngữ nghĩa ranh giới:**

- `text_end`: phát trực tuyến các khối ngay khi bộ chia đoạn phát ra; xả ở mỗi `text_end`.
- `message_end`: chờ đến khi tin nhắn trợ lý kết thúc, rồi xả đầu ra đã đệm.

`message_end` vẫn dùng bộ chia đoạn nếu văn bản đã đệm vượt quá `maxChars`, nên nó có thể phát ra nhiều đoạn ở cuối.

### Phân phối phương tiện với phát trực tuyến khối

Phương tiện phát trực tuyến phải dùng các trường tải có cấu trúc như `mediaUrl` hoặc
`mediaUrls`; văn bản được phát trực tuyến không được phân tích như một lệnh đính kèm. Khi phát trực tuyến
khối gửi phương tiện sớm, OpenClaw ghi nhớ lần phân phối đó cho lượt này. Nếu
tải trợ lý cuối cùng lặp lại cùng URL phương tiện, lần phân phối cuối cùng
loại bỏ phương tiện trùng lặp thay vì gửi lại tệp đính kèm.

Các tải cuối cùng trùng lặp chính xác sẽ bị chặn. Nếu tải cuối cùng thêm
văn bản riêng biệt quanh phương tiện đã được phát trực tuyến, OpenClaw vẫn gửi
văn bản mới trong khi giữ phương tiện chỉ được phân phối một lần. Điều này ngăn các ghi chú thoại
hoặc tệp bị trùng lặp trên các kênh như Telegram.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Chia đoạn khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát ra cho đến khi bộ đệm >= `minChars` (trừ khi bị buộc).
- **Giới hạn cao:** ưu tiên tách trước `maxChars`; nếu bị buộc, tách tại `maxChars`.
- **Ưu tiên điểm ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Hàng rào mã:** không bao giờ tách bên trong hàng rào; khi bị buộc tại `maxChars`, đóng + mở lại hàng rào để giữ Markdown hợp lệ.

`maxChars` bị kẹp theo `textChunkLimit` của kênh, nên bạn không thể vượt quá giới hạn của từng kênh.

## Gộp (hợp nhất các khối được phát trực tuyến)

Khi phát trực tuyến khối được bật, OpenClaw có thể **hợp nhất các đoạn khối liên tiếp**
trước khi gửi ra. Điều này giảm tình trạng "spam một dòng" trong khi vẫn cung cấp
đầu ra tăng dần.

- Gộp chờ các **khoảng nhàn rỗi** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá giới hạn đó.
- `minChars` ngăn các mảnh quá nhỏ được gửi cho đến khi tích lũy đủ văn bản
  (lần xả cuối luôn gửi văn bản còn lại).
- Chuỗi nối được suy ra từ `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → dấu cách).
- Ghi đè theo kênh có sẵn qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo từng tài khoản).
- `minChars` gộp mặc định được nâng lên 1500 cho Signal/Slack/Discord trừ khi bị ghi đè.

## Nhịp giống con người giữa các khối

Khi phát trực tuyến khối được bật, bạn có thể thêm một **khoảng tạm dừng ngẫu nhiên** giữa
các phản hồi dạng khối (sau khối đầu tiên). Điều này làm cho phản hồi nhiều bong bóng có cảm giác
tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo từng tác tử qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Chỉ áp dụng cho **phản hồi dạng khối**, không áp dụng cho phản hồi cuối hoặc tóm tắt công cụ.

## "Phát trực tuyến từng đoạn hoặc toàn bộ"

Điều này ánh xạ thành:

- **Phát trực tuyến từng đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát khi tạo). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Phát trực tuyến toàn bộ ở cuối:** `blockStreamingBreak: "message_end"` (xả một lần, có thể thành nhiều đoạn nếu rất dài).
- **Không phát trực tuyến khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối).

**Ghi chú kênh:** Phát trực tuyến khối **tắt trừ khi**
`*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể phát trực tuyến bản xem trước trực tiếp
(`channels.<channel>.streaming`) mà không có phản hồi dạng khối.

Nhắc lại vị trí cấu hình: các mặc định `blockStreaming*` nằm dưới
`agents.defaults`, không phải cấu hình gốc.

## Chế độ phát trực tuyến bản xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt phát trực tuyến bản xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo các bước chia đoạn/nối thêm.
- `progress`: bản xem trước tiến độ/trạng thái trong khi tạo, câu trả lời cuối khi hoàn tất.

`streaming.mode: "block"` là chế độ phát trực tuyến bản xem trước cho các kênh có khả năng chỉnh sửa
như Discord và Telegram. Nó không bật phân phối khối qua kênh ở đó.
Dùng `streaming.block.enabled` hoặc khóa kênh cũ `blockStreaming` khi
bạn muốn các phản hồi dạng khối thông thường. Microsoft Teams là ngoại lệ: nó không có
truyền tải khối dạng bản nháp xem trước, nên `streaming.mode: "block"` ánh xạ sang phân phối khối của Teams
thay vì phát trực tuyến một phần/tiến độ gốc.

### Ánh xạ kênh

| Kênh       | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | bản nháp tiến độ có thể chỉnh sửa |
| Discord    | ✅    | ✅        | ✅      | bản nháp tiến độ có thể chỉnh sửa |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | luồng tiến độ gốc       |

Chỉ Slack:

- `channels.slack.streaming.nativeTransport` bật/tắt các lệnh gọi API phát trực tuyến gốc của Slack khi `channels.slack.streaming.mode="partial"` (mặc định: `true`).
- Phát trực tuyến gốc của Slack và trạng thái luồng trợ lý Slack yêu cầu mục tiêu là một luồng trả lời. DM cấp cao nhất không hiển thị bản xem trước kiểu luồng đó, nhưng vẫn có thể dùng các bài đăng bản nháp xem trước và chỉnh sửa của Slack.

Di chuyển khóa cũ:

- Telegram: các giá trị `streamMode` cũ và `streaming` dạng vô hướng/boolean được phát hiện và di chuyển bởi các đường dẫn tương thích doctor/cấu hình sang `streaming.mode`.
- Discord: `streamMode` + `streaming` dạng boolean vẫn là bí danh runtime cho enum `streaming`; chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu.
- Slack: `streamMode` vẫn là bí danh runtime cho `streaming.mode`; `streaming` dạng boolean vẫn là bí danh runtime cho `streaming.mode` cộng với `streaming.nativeTransport`; `nativeStreaming` cũ vẫn là bí danh runtime cho `streaming.nativeTransport`. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu.

### Hành vi runtime

Telegram:

- Dùng `sendMessage` + `editMessageText` để cập nhật bản xem trước trên DM và nhóm/chủ đề.
- Các bản xem trước ban đầu ngắn vẫn được debounce vì UX thông báo đẩy, nhưng Telegram hiện vật chất hóa chúng sau một độ trễ có giới hạn để các lượt chạy đang hoạt động không bị im lặng về mặt hiển thị.
- Văn bản cuối chỉnh sửa bản xem trước đang hoạt động tại chỗ; các kết quả cuối dài tái sử dụng tin nhắn đó cho đoạn đầu tiên và chỉ gửi các đoạn còn lại.
- Chế độ `block` xoay bản xem trước sang một tin nhắn mới tại `streaming.preview.chunk.maxChars` (mặc định 800, bị giới hạn bởi giới hạn chỉnh sửa 4096 của Telegram); các chế độ khác mở rộng một bản xem trước đến tối đa 4096 ký tự.
- Chế độ `progress` giữ tiến độ công cụ trong một bản nháp trạng thái có thể chỉnh sửa, vật chất hóa nhãn trạng thái khi phát trực tuyến câu trả lời đang hoạt động nhưng chưa có dòng công cụ nào, xóa bản nháp đó khi hoàn tất, và gửi câu trả lời cuối qua phân phối thông thường.
- Nếu chỉnh sửa cuối thất bại trước khi văn bản hoàn tất được xác nhận, OpenClaw dùng phân phối cuối thông thường và dọn dẹp bản xem trước cũ.
- Phát trực tuyến bản xem trước bị bỏ qua khi phát trực tuyến khối Telegram được bật rõ ràng (để tránh phát trực tuyến kép).
- `/reasoning stream` có thể ghi lập luận vào một bản xem trước tạm thời bị xóa sau khi phân phối cuối.

Discord:

- Dùng gửi + chỉnh sửa tin nhắn xem trước.
- Chế độ `block` dùng chia đoạn bản nháp (`draftChunk`).
- Phát trực tuyến bản xem trước bị bỏ qua khi phát trực tuyến khối Discord được bật rõ ràng.
- Các tải phương tiện cuối, lỗi và trả lời rõ ràng hủy các bản xem trước đang chờ mà không xả bản nháp mới, rồi dùng phân phối thông thường.

Slack:

- `partial` có thể dùng phát trực tuyến gốc của Slack (`chat.startStream`/`append`/`stop`) khi có sẵn.
- `block` dùng bản xem trước bản nháp kiểu nối thêm.
- `progress` dùng văn bản xem trước trạng thái, rồi câu trả lời cuối.
- DM cấp cao nhất không có luồng trả lời dùng bài đăng bản nháp xem trước và chỉnh sửa thay vì phát trực tuyến gốc của Slack.
- Phát trực tuyến bản xem trước gốc và bản nháp chặn phản hồi dạng khối cho lượt đó, nên một phản hồi Slack chỉ được phát trực tuyến bằng một đường dẫn phân phối.
- Tải phương tiện/lỗi cuối và kết quả cuối tiến độ không tạo tin nhắn bản nháp dùng một lần; chỉ các kết quả cuối dạng văn bản/khối có thể chỉnh sửa bản xem trước mới xả văn bản bản nháp đang chờ.

Mattermost:

- Phát trực tuyến suy nghĩ, hoạt động công cụ và văn bản phản hồi một phần vào một bài đăng bản nháp xem trước duy nhất, bài đăng này được hoàn tất tại chỗ khi câu trả lời cuối an toàn để gửi.
- Dự phòng bằng cách gửi một bài đăng cuối mới nếu bài đăng xem trước đã bị xóa hoặc không còn khả dụng khi hoàn tất.
- Các tải phương tiện/lỗi cuối hủy cập nhật bản xem trước đang chờ trước khi phân phối thông thường thay vì xả một bài đăng xem trước tạm thời.

Matrix:

- Bản xem trước bản nháp được hoàn tất tại chỗ khi văn bản cuối có thể tái sử dụng sự kiện xem trước.
- Các kết quả cuối chỉ có phương tiện, lỗi và không khớp mục tiêu trả lời hủy cập nhật bản xem trước đang chờ trước khi phân phối thông thường; bản xem trước cũ đã hiển thị sẽ bị biên tập lại.

### Cập nhật bản xem trước tiến độ công cụ

Phát trực tuyến bản xem trước cũng có thể bao gồm các cập nhật **tiến độ công cụ** - các dòng trạng thái ngắn như "đang tìm kiếm trên web", "đang đọc tệp" hoặc "đang gọi công cụ" - xuất hiện trong cùng tin nhắn xem trước khi công cụ đang chạy, trước phản hồi cuối. Trong chế độ máy chủ ứng dụng Codex, các tin nhắn mở đầu/bình luận của Codex dùng cùng đường dẫn xem trước này, nên các ghi chú tiến độ ngắn kiểu "Tôi đang kiểm tra..." có thể phát trực tuyến vào bản nháp có thể chỉnh sửa mà không trở thành một phần của câu trả lời cuối. Điều này giữ cho các lượt công cụ nhiều bước sống động về mặt hiển thị thay vì im lặng giữa bản xem trước suy nghĩ đầu tiên và câu trả lời cuối.

Các công cụ chạy lâu có thể phát ra tiến độ có kiểu trước khi trả về. Ví dụ,
`web_fetch` khởi động bộ hẹn giờ năm giây khi bắt đầu: nếu lần fetch vẫn
đang chờ, bản xem trước có thể hiển thị `Fetching page content...`; nếu lần fetch hoàn tất
hoặc bị hủy trước đó, không có dòng tiến độ nào được phát ra. Kết quả công cụ cuối cùng sau đó
vẫn được phân phối bình thường tới mô hình.

Bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram** và **Matrix** mặc định truyền trực tuyến tiến trình công cụ và các cập nhật phần mở đầu của Codex vào bản chỉnh sửa xem trước trực tiếp khi tính năng truyền trực tuyến bản xem trước đang hoạt động. Microsoft Teams dùng luồng tiến trình gốc của nó trong các cuộc trò chuyện cá nhân.
- Telegram đã phát hành với cập nhật bản xem trước tiến trình công cụ được bật kể từ `v2026.4.22`; tiếp tục bật chúng sẽ giữ nguyên hành vi đã phát hành đó.
- **Mattermost** đã gộp hoạt động công cụ vào một bài đăng bản xem trước nháp duy nhất của nó (xem ở trên).
- Các chỉnh sửa tiến trình công cụ tuân theo chế độ truyền trực tuyến bản xem trước đang hoạt động; chúng bị bỏ qua khi truyền trực tuyến bản xem trước là `off` hoặc khi truyền trực tuyến theo khối đã tiếp quản thông điệp. Trên Telegram, `streaming.mode: "off"` là chế độ chỉ gửi kết quả cuối cùng: phần thông báo tiến trình chung cũng bị chặn thay vì được gửi dưới dạng thông điệp trạng thái độc lập, trong khi lời nhắc phê duyệt, tải trọng phương tiện và lỗi vẫn được định tuyến bình thường.
- Để giữ truyền trực tuyến bản xem trước nhưng ẩn các dòng tiến trình công cụ, đặt `streaming.preview.toolProgress` thành `false` cho kênh đó. Để giữ các dòng tiến trình công cụ hiển thị trong khi ẩn văn bản lệnh/thực thi, đặt `streaming.preview.commandText` thành `"status"` hoặc `streaming.progress.commandText` thành `"status"`; mặc định là `"raw"` để giữ nguyên hành vi đã phát hành. Chính sách này được chia sẻ bởi các kênh nháp/tiến trình dùng trình kết xuất tiến trình gọn của OpenClaw, bao gồm Discord, Matrix, Microsoft Teams, Mattermost, bản xem trước nháp Slack và Telegram. Để tắt hoàn toàn các chỉnh sửa bản xem trước, đặt `streaming.mode` thành `off`.
- Phản hồi trích dẫn đã chọn trên Telegram là một ngoại lệ: khi `replyToMode` không phải là `"off"` và có văn bản trích dẫn đã chọn, OpenClaw bỏ qua luồng bản xem trước câu trả lời cho lượt đó để các dòng bản xem trước tiến trình công cụ không thể hiển thị. Các phản hồi cho thông điệp hiện tại không có văn bản trích dẫn đã chọn vẫn giữ truyền trực tuyến bản xem trước. Xem [tài liệu kênh Telegram](/vi/channels/telegram) để biết chi tiết.

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

Dùng cùng cấu trúc dưới một khóa kênh tiến trình gọn khác, ví dụ `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, hoặc bản xem trước nháp Slack. Đối với chế độ nháp tiến trình, đặt cùng chính sách dưới `streaming.progress`:

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

- [Tái cấu trúc vòng đời thông điệp](/vi/concepts/message-lifecycle-refactor) - thiết kế chung hướng tới bản xem trước, chỉnh sửa, luồng và hoàn tất
- [Nháp tiến trình](/vi/concepts/progress-drafts) - thông điệp công việc đang diễn ra hiển thị và cập nhật trong các lượt dài
- [Thông điệp](/vi/concepts/messages) - vòng đời và phân phối thông điệp
- [Thử lại](/vi/concepts/retry) - hành vi thử lại khi phân phối thất bại
- [Kênh](/vi/channels) - hỗ trợ truyền trực tuyến theo từng kênh
