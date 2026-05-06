---
read_when:
    - Giải thích cách hoạt động của truyền luồng hoặc chia thành khối trên các kênh
    - Thay đổi hành vi phát trực tuyến khối hoặc chia nhỏ kênh
    - Gỡ lỗi phản hồi khối trùng lặp/sớm hoặc phát trực tuyến bản xem trước kênh
summary: Hành vi truyền phát + chia đoạn (phản hồi dạng khối, truyền phát bản xem trước kênh, ánh xạ chế độ)
title: Truyền luồng và chia đoạn
x-i18n:
    generated_at: "2026-05-06T09:10:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp truyền trực tuyến riêng biệt:

- **Truyền trực tuyến theo khối (kênh):** phát ra các **khối** đã hoàn tất khi trợ lý viết. Đây là các tin nhắn kênh bình thường (không phải delta token).
- **Truyền trực tuyến bản xem trước (Telegram/Discord/Slack):** cập nhật một **tin nhắn xem trước** tạm thời trong khi tạo nội dung.

Hiện nay **không có truyền trực tuyến delta token thực sự** tới tin nhắn kênh. Truyền trực tuyến bản xem trước dựa trên tin nhắn (gửi + chỉnh sửa/nối thêm).

## Truyền trực tuyến theo khối (tin nhắn kênh)

Truyền trực tuyến theo khối gửi đầu ra của trợ lý thành các đoạn thô khi chúng sẵn sàng.

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

- `text_delta/events`: sự kiện luồng của mô hình (có thể thưa thớt với các mô hình không truyền trực tuyến).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn tối thiểu/tối đa + ưu tiên điểm ngắt.
- `channel send`: tin nhắn gửi ra thực tế (phản hồi dạng khối).

**Điều khiển:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (mặc định tắt).
- Ghi đè theo kênh: `*.blockStreaming` (và các biến thể theo tài khoản) để ép `"on"`/`"off"` cho từng kênh.
- `agents.defaults.blockStreamingBreak`: `"text_end"` hoặc `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gộp các khối đã truyền trước khi gửi).
- Giới hạn cứng của kênh: `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`).
- Chế độ chia đoạn của kênh: `*.chunkMode` (`length` là mặc định, `newline` tách theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài).
- Giới hạn mềm của Discord: `channels.discord.maxLinesPerMessage` (mặc định 17) tách các phản hồi cao để tránh bị cắt trong UI.

**Ngữ nghĩa ranh giới:**

- `text_end`: truyền các khối ngay khi bộ chia đoạn phát ra; xả ở mỗi `text_end`.
- `message_end`: chờ đến khi tin nhắn trợ lý hoàn tất, rồi xả đầu ra đã đệm.

`message_end` vẫn dùng bộ chia đoạn nếu văn bản đã đệm vượt quá `maxChars`, nên nó có thể phát ra nhiều đoạn ở cuối.

### Phân phối media với truyền trực tuyến theo khối

Chỉ thị `MEDIA:` là siêu dữ liệu phân phối bình thường. Khi truyền trực tuyến theo khối gửi sớm một khối media, OpenClaw ghi nhớ lần phân phối đó cho lượt này. Nếu payload trợ lý cuối cùng lặp lại cùng URL media, lần phân phối cuối sẽ loại bỏ media trùng lặp thay vì gửi lại tệp đính kèm.

Các payload cuối trùng lặp chính xác sẽ bị chặn. Nếu payload cuối thêm văn bản riêng biệt quanh media đã được truyền, OpenClaw vẫn gửi văn bản mới trong khi giữ media chỉ được phân phối một lần. Điều này ngăn trùng lặp ghi chú thoại hoặc tệp trên các kênh như Telegram khi một tác nhân phát ra `MEDIA:` trong khi truyền trực tuyến và nhà cung cấp cũng bao gồm nó trong phản hồi đã hoàn tất.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Chia đoạn theo khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát ra cho đến khi bộ đệm >= `minChars` (trừ khi bị ép).
- **Giới hạn cao:** ưu tiên tách trước `maxChars`; nếu bị ép, tách tại `maxChars`.
- **Ưu tiên điểm ngắt:** `paragraph` → `newline` → `sentence` → `whitespace` → ngắt cứng.
- **Khối mã:** không bao giờ tách bên trong khối; khi bị ép tại `maxChars`, đóng + mở lại khối để giữ Markdown hợp lệ.

`maxChars` bị kẹp theo `textChunkLimit` của kênh, nên bạn không thể vượt quá giới hạn của từng kênh.

## Gộp (hợp nhất các khối đã truyền)

Khi truyền trực tuyến theo khối được bật, OpenClaw có thể **hợp nhất các đoạn khối liên tiếp** trước khi gửi ra. Việc này giảm “spam một dòng” trong khi vẫn cung cấp đầu ra tăng dần.

- Gộp chờ **khoảng nghỉ nhàn rỗi** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và sẽ xả nếu vượt quá giới hạn đó.
- `minChars` ngăn các mảnh quá nhỏ được gửi cho đến khi tích lũy đủ văn bản (lần xả cuối luôn gửi văn bản còn lại).
- Bộ nối được suy ra từ `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → dấu cách).
- Có thể ghi đè theo kênh qua `*.blockStreamingCoalesce` (bao gồm cấu hình theo tài khoản).
- `minChars` gộp mặc định được tăng lên 1500 cho Signal/Slack/Discord trừ khi bị ghi đè.

## Nhịp giống con người giữa các khối

Khi truyền trực tuyến theo khối được bật, bạn có thể thêm **khoảng dừng ngẫu nhiên** giữa các phản hồi dạng khối (sau khối đầu tiên). Điều này làm cho phản hồi nhiều bong bóng có cảm giác tự nhiên hơn.

- Cấu hình: `agents.defaults.humanDelay` (ghi đè theo tác nhân qua `agents.list[].humanDelay`).
- Chế độ: `off` (mặc định), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Chỉ áp dụng cho **phản hồi dạng khối**, không áp dụng cho phản hồi cuối hoặc tóm tắt công cụ.

## "Truyền các đoạn hoặc mọi thứ"

Điều này ánh xạ thành:

- **Truyền các đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (phát ra trong khi chạy). Các kênh không phải Telegram cũng cần `*.blockStreaming: true`.
- **Truyền mọi thứ ở cuối:** `blockStreamingBreak: "message_end"` (xả một lần, có thể nhiều đoạn nếu rất dài).
- **Không truyền trực tuyến theo khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối).

**Ghi chú kênh:** Truyền trực tuyến theo khối **tắt trừ khi**
`*.blockStreaming` được đặt rõ ràng thành `true`. Các kênh có thể truyền một bản xem trước trực tiếp
(`channels.<channel>.streaming`) mà không có phản hồi dạng khối.

Nhắc lại vị trí cấu hình: các mặc định `blockStreaming*` nằm dưới
`agents.defaults`, không phải cấu hình gốc.

## Chế độ truyền trực tuyến bản xem trước

Khóa chuẩn: `channels.<channel>.streaming`

Chế độ:

- `off`: tắt truyền trực tuyến bản xem trước.
- `partial`: một bản xem trước duy nhất được thay thế bằng văn bản mới nhất.
- `block`: bản xem trước cập nhật theo các bước chia đoạn/nối thêm.
- `progress`: bản xem trước tiến độ/trạng thái trong khi tạo, câu trả lời cuối khi hoàn tất.

`streaming.mode: "block"` là một chế độ truyền trực tuyến bản xem trước cho các kênh có thể chỉnh sửa
như Discord và Telegram. Nó không bật phân phối khối theo kênh ở đó.
Dùng `streaming.block.enabled` hoặc khóa kênh cũ `blockStreaming` khi
bạn muốn phản hồi dạng khối bình thường. Microsoft Teams là ngoại lệ: nó không có
cơ chế vận chuyển khối bản nháp xem trước, nên `streaming.mode: "block"` ánh xạ sang phân phối khối của Teams
thay vì truyền trực tuyến từng phần/tiến độ gốc.

### Ánh xạ kênh

| Kênh       | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | ✅    | ✅        | ✅      | bản nháp tiến độ chỉnh sửa được |
| Discord    | ✅    | ✅        | ✅      | bản nháp tiến độ chỉnh sửa được |
| Slack      | ✅    | ✅        | ✅      | ✅                         |
| Mattermost | ✅    | ✅        | ✅      | ✅                         |
| MS Teams   | ✅    | ✅        | ✅      | luồng tiến độ gốc          |

Chỉ dành cho Slack:

- `channels.slack.streaming.nativeTransport` bật/tắt các lệnh gọi API truyền trực tuyến gốc của Slack khi `channels.slack.streaming.mode="partial"` (mặc định: `true`).
- Truyền trực tuyến gốc của Slack và trạng thái luồng trợ lý Slack yêu cầu mục tiêu luồng phản hồi. DM cấp cao nhất không hiển thị bản xem trước kiểu luồng đó, nhưng vẫn có thể dùng bài đăng bản nháp xem trước và chỉnh sửa của Slack.

Di chuyển khóa cũ:

- Telegram: các giá trị `streamMode` cũ và `streaming` dạng vô hướng/boolean được phát hiện và di chuyển bởi các đường dẫn tương thích doctor/config sang `streaming.mode`.
- Discord: `streamMode` + boolean `streaming` tự động di chuyển sang enum `streaming`.
- Slack: `streamMode` tự động di chuyển sang `streaming.mode`; boolean `streaming` tự động di chuyển sang `streaming.mode` cộng với `streaming.nativeTransport`; `nativeStreaming` cũ tự động di chuyển sang `streaming.nativeTransport`.

### Hành vi runtime

Telegram:

- Dùng `sendMessage` + `editMessageText` để cập nhật bản xem trước trên DM và nhóm/chủ đề.
- Văn bản cuối chỉnh sửa bản xem trước đang hoạt động tại chỗ; phần cuối dài tái sử dụng tin nhắn đó cho đoạn đầu tiên và chỉ gửi các đoạn còn lại.
- Chế độ `progress` giữ tiến độ công cụ trong một bản nháp trạng thái có thể chỉnh sửa, xóa bản nháp đó khi hoàn tất, và gửi câu trả lời cuối qua phân phối bình thường.
- Nếu chỉnh sửa cuối thất bại trước khi văn bản đã hoàn tất được xác nhận, OpenClaw dùng phân phối cuối bình thường và dọn dẹp bản xem trước cũ.
- Truyền trực tuyến bản xem trước bị bỏ qua khi truyền trực tuyến theo khối của Telegram được bật rõ ràng (để tránh truyền hai lần).
- `/reasoning stream` có thể ghi phần suy luận vào một bản xem trước tạm thời bị xóa sau phân phối cuối.

Discord:

- Dùng tin nhắn xem trước gửi + chỉnh sửa.
- Chế độ `block` dùng chia đoạn bản nháp (`draftChunk`).
- Truyền trực tuyến bản xem trước bị bỏ qua khi truyền trực tuyến theo khối của Discord được bật rõ ràng.
- Payload media cuối, lỗi và phản hồi tường minh hủy các bản xem trước đang chờ mà không xả bản nháp mới, rồi dùng phân phối bình thường.

Slack:

- `partial` có thể dùng truyền trực tuyến gốc của Slack (`chat.startStream`/`append`/`stop`) khi có sẵn.
- `block` dùng bản xem trước nháp kiểu nối thêm.
- `progress` dùng văn bản xem trước trạng thái, rồi câu trả lời cuối.
- DM cấp cao nhất không có luồng phản hồi dùng bài đăng bản nháp xem trước và chỉnh sửa thay vì truyền trực tuyến gốc của Slack.
- Truyền trực tuyến gốc và bản nháp xem trước chặn phản hồi dạng khối cho lượt đó, nên một phản hồi Slack chỉ được truyền bởi một đường dẫn phân phối.
- Payload media/lỗi cuối và phần cuối tiến độ không tạo tin nhắn bản nháp dùng một lần; chỉ phần cuối văn bản/khối có thể chỉnh sửa bản xem trước mới xả văn bản bản nháp đang chờ.

Mattermost:

- Truyền suy nghĩ, hoạt động công cụ và văn bản phản hồi từng phần vào một bài đăng bản nháp xem trước duy nhất, được hoàn tất tại chỗ khi câu trả lời cuối an toàn để gửi.
- Quay lui sang gửi một bài đăng cuối mới nếu bài đăng xem trước đã bị xóa hoặc không còn khả dụng tại thời điểm hoàn tất.
- Payload media/lỗi cuối hủy các cập nhật bản xem trước đang chờ trước khi phân phối bình thường thay vì xả một bài đăng xem trước tạm thời.

Matrix:

- Bản nháp xem trước hoàn tất tại chỗ khi văn bản cuối có thể tái sử dụng sự kiện xem trước.
- Các phần cuối chỉ có media, lỗi và không khớp mục tiêu phản hồi sẽ hủy cập nhật bản xem trước đang chờ trước khi phân phối bình thường; bản xem trước cũ đã hiển thị sẽ bị biên tập lại.

### Cập nhật bản xem trước tiến độ công cụ

Truyền trực tuyến bản xem trước cũng có thể bao gồm cập nhật **tiến độ công cụ** - các dòng trạng thái ngắn như "đang tìm kiếm trên web", "đang đọc tệp", hoặc "đang gọi công cụ" - xuất hiện trong cùng tin nhắn xem trước khi công cụ đang chạy, trước phản hồi cuối. Điều này giữ cho các lượt công cụ nhiều bước sống động về mặt trực quan thay vì im lặng giữa bản xem trước suy nghĩ đầu tiên và câu trả lời cuối.

Bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram** và **Matrix** mặc định truyền tiến trình công cụ vào bản chỉnh sửa xem trước trực tiếp khi phát trực tuyến bản xem trước đang hoạt động. Microsoft Teams sử dụng luồng tiến trình gốc trong các cuộc trò chuyện cá nhân.
- Telegram đã phát hành với các bản cập nhật xem trước tiến trình công cụ được bật kể từ `v2026.4.22`; giữ chúng ở trạng thái bật sẽ duy trì hành vi đã phát hành đó.
- **Mattermost** đã gộp hoạt động công cụ vào bài đăng xem trước bản nháp duy nhất của mình (xem ở trên).
- Các chỉnh sửa tiến trình công cụ tuân theo chế độ phát trực tuyến bản xem trước đang hoạt động; chúng bị bỏ qua khi phát trực tuyến bản xem trước là `off` hoặc khi phát trực tuyến khối đã tiếp quản tin nhắn. Trên Telegram, `streaming.mode: "off"` chỉ gửi kết quả cuối cùng: lời nhắc tiến trình chung cũng bị chặn thay vì được gửi dưới dạng tin nhắn trạng thái độc lập, trong khi lời nhắc phê duyệt, tải trọng phương tiện và lỗi vẫn được định tuyến bình thường.
- Để giữ phát trực tuyến bản xem trước nhưng ẩn các dòng tiến trình công cụ, đặt `streaming.preview.toolProgress` thành `false` cho kênh đó. Để giữ các dòng tiến trình công cụ hiển thị trong khi ẩn văn bản lệnh/thực thi, đặt `streaming.preview.commandText` thành `"status"` hoặc `streaming.progress.commandText` thành `"status"`; mặc định là `"raw"` để duy trì hành vi đã phát hành. Chính sách này được dùng chung bởi các kênh bản nháp/tiến trình dùng trình kết xuất tiến trình gọn của OpenClaw, bao gồm Discord, Matrix, Microsoft Teams, Mattermost, bản xem trước bản nháp Slack và Telegram. Để tắt hoàn toàn các chỉnh sửa xem trước, đặt `streaming.mode` thành `off`.
- Phản hồi trích dẫn đã chọn trên Telegram là một ngoại lệ: khi `replyToMode` không phải là `"off"` và có văn bản trích dẫn đã chọn, OpenClaw bỏ qua luồng xem trước câu trả lời cho lượt đó, vì vậy các dòng xem trước tiến trình công cụ không thể hiển thị. Các phản hồi tin nhắn hiện tại không có văn bản trích dẫn đã chọn vẫn giữ phát trực tuyến bản xem trước. Xem [tài liệu kênh Telegram](/vi/channels/telegram) để biết chi tiết.

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

Dùng cùng cấu trúc dưới một khóa kênh tiến trình gọn khác, ví dụ `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, hoặc bản xem trước bản nháp Slack. Đối với chế độ bản nháp tiến trình, đặt cùng chính sách dưới `streaming.progress`:

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

- [Tái cấu trúc vòng đời tin nhắn](/vi/concepts/message-lifecycle-refactor) - nhắm tới thiết kế chung cho xem trước, chỉnh sửa, luồng và hoàn tất
- [Bản nháp tiến trình](/vi/concepts/progress-drafts) - các tin nhắn công việc đang tiến hành hiển thị được cập nhật trong các lượt dài
- [Tin nhắn](/vi/concepts/messages) - vòng đời và phân phối tin nhắn
- [Thử lại](/vi/concepts/retry) - hành vi thử lại khi phân phối thất bại
- [Kênh](/vi/channels) - hỗ trợ phát trực tuyến theo từng kênh
