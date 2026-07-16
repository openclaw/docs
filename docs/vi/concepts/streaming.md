---
read_when:
    - Giải thích cách hoạt động của tính năng truyền phát hoặc phân đoạn trên các kênh
    - Thay đổi hành vi truyền phát theo khối hoặc phân đoạn kênh
    - Gỡ lỗi phản hồi khối bị trùng lặp/quá sớm hoặc luồng xem trước trên kênh
summary: Hành vi phát trực tiếp + phân đoạn (phản hồi theo khối, phát trực tiếp bản xem trước trên kênh, ánh xạ chế độ)
title: Truyền phát và phân đoạn
x-i18n:
    generated_at: "2026-07-16T14:23:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw có hai lớp phát trực tuyến độc lập, và hiện nay **không có cơ chế phát trực tuyến
delta token thực sự** đến tin nhắn kênh:

- **Phát trực tuyến theo khối (kênh):** phát ra các **khối** đã hoàn tất khi trợ lý
  viết. Đây là các tin nhắn kênh thông thường, không phải delta token.
- **Phát trực tuyến bản xem trước (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  cập nhật một **tin nhắn xem trước** tạm thời trong khi tạo (gửi + chỉnh sửa/nối thêm).

## Phát trực tuyến theo khối (tin nhắn kênh)

Phát trực tuyến theo khối gửi đầu ra của trợ lý thành các đoạn lớn khi chúng sẵn sàng.

```text
Đầu ra mô hình
  └─ text_delta/sự kiện
       ├─ (blockStreamingBreak=text_end)
       │    └─ trình chia đoạn phát ra các khối khi bộ đệm tăng
       └─ (blockStreamingBreak=message_end)
            └─ trình chia đoạn xả tại message_end
                   └─ gửi đến kênh (phản hồi theo khối)
```

- `text_delta/events`: các sự kiện luồng mô hình (có thể thưa đối với các mô hình không phát trực tuyến).
- `chunker`: `EmbeddedBlockChunker` áp dụng giới hạn tối thiểu/tối đa + tùy chọn điểm ngắt.
- `channel send`: các tin nhắn gửi đi thực tế (phản hồi theo khối).

**Các tùy chọn điều khiển** (tất cả nằm dưới `agents.defaults` trừ khi có ghi chú):

| Khóa                                                          | Giá trị / cấu trúc                                                          | Mặc định    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (hợp nhất các khối đã phát trực tuyến trước khi gửi) | -          |
| `*.streaming.block.enabled` (ghi đè theo kênh)               | `true` / `false`, buộc phát trực tuyến theo khối cho từng kênh (và từng tài khoản)  | -          |
| `*.textChunkLimit` (ví dụ: `channels.whatsapp.textChunkLimit`) | số, giới hạn cứng                                                        | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | số, giới hạn mềm theo dòng để chia các phản hồi dài theo chiều dọc nhằm tránh bị cắt trên giao diện người dùng     | 17         |

`streaming.chunkMode: "newline"` chia tại các dòng trống (ranh giới đoạn văn),
không phải tại mọi ký tự xuống dòng, trước khi chuyển sang chia theo độ dài khi văn bản
vượt quá giới hạn.

Các kênh đi kèm biểu diễn những tùy chọn ghi đè này dưới dạng
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Các dạng phẳng
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` là
dạng cũ trên mọi kênh đi kèm: `openclaw doctor --fix` di chuyển chúng sang
cấu trúc lồng nhau và các lược đồ kênh sẽ từ chối chúng. Cấu hình Plugin SDK bên ngoài
vẫn sử dụng các dạng phẳng tiếp tục hoạt động thông qua một cơ chế dự phòng đã lỗi thời
(kèm cảnh báo lúc chạy) cho đến đợt phát hành tiếp theo.

**Ngữ nghĩa ranh giới** cho `blockStreamingBreak`:

- `text_end`: phát trực tuyến các khối ngay khi trình chia đoạn phát ra; xả tại mỗi `text_end`.
- `message_end`: chờ đến khi tin nhắn của trợ lý hoàn tất, sau đó xả đầu ra
  đã đệm. Vẫn sử dụng trình chia đoạn nếu văn bản đã đệm vượt quá `maxChars`, vì vậy có thể
  phát ra nhiều đoạn ở cuối.

### Phân phối nội dung đa phương tiện với phát trực tuyến theo khối

Nội dung đa phương tiện phát trực tuyến phải sử dụng các trường tải trọng có cấu trúc như `mediaUrl` hoặc
`mediaUrls`; văn bản phát trực tuyến không được phân tích cú pháp như một lệnh đính kèm. Khi phát trực tuyến theo khối
gửi nội dung đa phương tiện sớm, OpenClaw ghi nhớ lần phân phối đó trong lượt này. Nếu
tải trọng cuối cùng của trợ lý lặp lại cùng URL nội dung đa phương tiện, lần phân phối cuối
sẽ loại bỏ nội dung đa phương tiện trùng lặp thay vì gửi lại tệp đính kèm.

Các tải trọng cuối cùng trùng khớp hoàn toàn sẽ bị loại bỏ. Nếu tải trọng cuối cùng thêm
văn bản riêng biệt xung quanh nội dung đa phương tiện đã được phát trực tuyến, OpenClaw vẫn gửi
văn bản mới trong khi chỉ phân phối nội dung đa phương tiện một lần. Điều này ngăn các ghi chú thoại
hoặc tệp bị trùng lặp trên các kênh như Telegram.

## Thuật toán chia đoạn (giới hạn thấp/cao)

Việc chia đoạn theo khối được triển khai bởi `EmbeddedBlockChunker`:

- **Giới hạn thấp:** không phát ra cho đến khi bộ đệm >= `minChars` (trừ khi bị buộc).
- **Giới hạn cao:** ưu tiên chia trước `maxChars`; nếu bị buộc, chia tại `maxChars`.
- **Chuỗi ưu tiên điểm ngắt:** `paragraph` -> `newline` -> `sentence` ->
  khoảng trắng -> ngắt cứng.
- **Hàng rào mã:** không bao giờ chia bên trong hàng rào; khi buộc tại `maxChars`, hãy đóng
  rồi mở lại hàng rào để giữ Markdown hợp lệ.

`maxChars` được giới hạn theo `textChunkLimit` của kênh, vì vậy không thể vượt quá
giới hạn của từng kênh.

## Hợp nhất (gộp các khối được phát trực tuyến)

Khi phát trực tuyến theo khối được bật, OpenClaw có thể **hợp nhất các đoạn khối
liên tiếp** trước khi gửi, giảm tình trạng tràn ngập tin nhắn một dòng trong khi vẫn cung cấp
đầu ra tuần tự.

- Việc hợp nhất chờ **khoảng thời gian rảnh** (`idleMs`) trước khi xả.
- Bộ đệm bị giới hạn bởi `maxChars` và được xả nếu vượt quá giới hạn đó.
- `minChars` ngăn gửi các mảnh quá nhỏ cho đến khi tích lũy đủ văn bản
  (lần xả cuối luôn gửi phần văn bản còn lại).
- Ký tự nối được suy ra từ `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> khoảng trắng.
- Có thể ghi đè theo kênh qua `*.streaming.block.coalesce` (bao gồm
  cấu hình theo từng tài khoản).
- Discord, Signal và Slack mặc định hợp nhất theo `{ minChars: 1500, idleMs: 1000 }`
  trừ khi được ghi đè.

## Nhịp nghỉ giống con người giữa các khối

Khi phát trực tuyến theo khối được bật, thêm một **khoảng nghỉ ngẫu nhiên** giữa các phản hồi
theo khối, sau khối đầu tiên, để phản hồi nhiều bong bóng có cảm giác tự nhiên hơn.

| `agents.defaults.humanDelay.mode` | Hành vi                |
| --------------------------------- | ----------------------- |
| `off` (mặc định)                   | Không tạm dừng                |
| `natural`                         | Tạm dừng ngẫu nhiên 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Ghi đè theo từng tác tử qua `agents.list[].humanDelay`. Chỉ áp dụng cho **phản hồi theo
khối**, không áp dụng cho phản hồi cuối cùng hoặc bản tóm tắt công cụ.

## "Phát trực tuyến các đoạn hoặc toàn bộ"

- **Phát trực tuyến các đoạn:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (phát ra trong quá trình tạo). Các kênh không phải Telegram cũng cần
  `*.streaming.block.enabled: true`.
- **Phát trực tuyến toàn bộ ở cuối:** `blockStreamingBreak: "message_end"` (xả
  một lần, có thể thành nhiều đoạn nếu rất dài).
- **Không phát trực tuyến theo khối:** `blockStreamingDefault: "off"` (chỉ phản hồi cuối cùng).

Phát trực tuyến theo khối **tắt trừ khi** `*.streaming.block.enabled` được đặt rõ ràng
thành `true` (ngoại lệ: QQ Bot không có các khóa `streaming.block` và phát trực tuyến
các phản hồi theo khối trừ khi `channels.qqbot.streaming.mode` là `"off"`). Các kênh có thể
phát trực tuyến bản xem trước trực tiếp (`channels.<channel>.streaming.mode`) mà không cần phản hồi
theo khối. Các giá trị mặc định `blockStreaming*` nằm dưới `agents.defaults`, không phải tại
gốc cấu hình.

## Các chế độ phát trực tuyến bản xem trước

Khóa chuẩn: `channels.<channel>.streaming` (`{ mode, ... }` lồng nhau; các dạng
boolean/chuỗi cấp cao nhất cũ được `openclaw doctor --fix` viết lại).

| Chế độ       | Hành vi                                                              |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Tắt phát trực tuyến bản xem trước                                             |
| `partial`  | Một bản xem trước duy nhất được thay thế bằng văn bản mới nhất                              |
| `block`    | Bản xem trước được cập nhật theo các bước chia đoạn/nối thêm                             |
| `progress` | Bản xem trước tiến trình/trạng thái trong khi tạo, câu trả lời cuối cùng khi hoàn tất |

`streaming.mode: "block"` là chế độ phát trực tuyến bản xem trước dành cho các
kênh hỗ trợ chỉnh sửa như Discord và Telegram; bản thân nó không bật cơ chế phân phối
theo khối của kênh tại đó. Sử dụng `streaming.block.enabled` cho phản hồi theo khối thông thường.
Microsoft Teams là
ngoại lệ: không có cơ chế vận chuyển khối bản xem trước nháp, vì vậy `streaming.mode:
"block"` tắt hoàn toàn cơ chế phát trực tuyến gốc và phản hồi được gửi dưới dạng
phân phối theo khối thông thường thay vì phát trực tuyến từng phần/tiến trình gốc. Mattermost cũng
khác biệt: trong chế độ `block`, nó luân phiên bản xem trước giữa văn bản đã hoàn tất và
các khối hoạt động công cụ, vì vậy các khối trước đó vẫn hiển thị dưới dạng bài đăng riêng biệt
thay vì bị ghi đè trong một bản nháp có thể chỉnh sửa.

### Ánh xạ kênh

| Kênh    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Có   | Có       | Có     | bản nháp tiến trình có thể chỉnh sửa |
| Discord    | Có   | Có       | Có     | bản nháp tiến trình có thể chỉnh sửa |
| Slack      | Có   | Có       | Có     | Có                     |
| Mattermost | Có   | Có       | Có     | Có                     |
| MS Teams   | Có   | Có       | Có     | luồng tiến trình gốc  |

Cấu hình đoạn xem trước (`streaming.preview.chunk.*`, ví dụ: dưới
`channels.discord.streaming` hoặc `channels.telegram.streaming`) mặc định là
`minChars: 200`, `maxChars: 800` (được giới hạn theo `textChunkLimit` của kênh) và
`breakPreference: "paragraph"`.

Chỉ dành cho Slack:

- `channels.slack.streaming.nativeTransport` bật/tắt các lệnh gọi API phát trực tuyến gốc của Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) khi
  `channels.slack.streaming.mode="partial"` (mặc định: `true`).
- Phát trực tuyến gốc của Slack và trạng thái luồng trợ lý Slack yêu cầu một đích
  luồng phản hồi. Tin nhắn trực tiếp cấp cao nhất không hiển thị bản xem trước kiểu luồng đó, nhưng vẫn có thể
  sử dụng các bài đăng bản xem trước nháp và thao tác chỉnh sửa của Slack.

### Di chuyển khóa cũ

| Kênh  | Khóa cũ                                                 | Trạng thái                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` dạng vô hướng/boolean                    | Được `openclaw doctor --fix` viết lại thành `streaming.mode`; không được đọc lúc chạy                                                                        |
| Discord  | `streamMode`, `streaming` dạng boolean                           | Được `openclaw doctor --fix` viết lại thành `streaming.mode`; không được đọc lúc chạy                                                                        |
| Slack    | `streamMode`; `streaming` dạng boolean; `nativeStreaming` cũ | Được `openclaw doctor --fix` viết lại thành `streaming.mode` (và `streaming.nativeTransport` cho các dạng boolean/cũ); không được đọc lúc chạy         |
| Matrix   | `streaming` dạng vô hướng/boolean                                  | Được `openclaw doctor --fix` viết lại thành `streaming.mode` (bao gồm chế độ `"quiet"` của Matrix); không được đọc lúc chạy                                    |
| Feishu   | `streaming` dạng boolean                                         | Được `openclaw doctor --fix` viết lại thành `streaming.mode`; không được đọc lúc chạy                                                                        |
| QQ Bot   | `streaming` dạng boolean; `streaming.c2cStreamApi`               | Được `openclaw doctor --fix` viết lại thành `streaming.mode` (và `streaming.nativeTransport` cho các dạng boolean/`c2cStreamApi`); không được đọc lúc chạy |

## Hành vi lúc chạy

### Telegram

- Sử dụng các bản cập nhật bản xem trước `sendMessage` + `editMessageText` trên các DM và
  nhóm/chủ đề; văn bản cuối cùng chỉnh sửa trực tiếp bản xem trước đang hoạt động. Các bản nháp
  "đang nhập" tạm thời trong 30 giây của Telegram (`sendMessageDraft`) không được dùng để
  truyền phát câu trả lời.
- Các bản xem trước ban đầu ngắn vẫn được chống dội để tối ưu trải nghiệm thông báo đẩy, nhưng
  sẽ xuất hiện sau một khoảng trễ có giới hạn để các lượt chạy đang hoạt động không im lặng về mặt hiển thị.
- Các kết quả cuối dài tái sử dụng thông báo xem trước cho đoạn đầu tiên và chỉ gửi
  các đoạn còn lại.
- Chế độ `block` luân chuyển bản xem trước sang một thông báo mới tại
  `streaming.preview.chunk.maxChars` (mặc định 800, giới hạn ở mức chỉnh sửa 4096 của
  Telegram); các chế độ khác mở rộng một bản xem trước lên đến 4096 ký tự.
- Chế độ `progress` giữ tiến trình công cụ trong một bản nháp trạng thái có thể chỉnh sửa, hiển thị
  nhãn trạng thái khi truyền phát câu trả lời đang hoạt động nhưng chưa có dòng công cụ,
  xóa bản nháp khi hoàn tất và gửi câu trả lời cuối cùng
  qua cơ chế phân phối thông thường.
- Nếu lần chỉnh sửa cuối không thành công trước khi văn bản hoàn chỉnh được xác nhận, OpenClaw sử dụng
  cơ chế phân phối kết quả cuối thông thường và dọn dẹp bản xem trước cũ.
- Truyền phát bản xem trước bị bỏ qua khi truyền phát khối của Telegram được bật rõ ràng,
  để tránh truyền phát kép.
- `/reasoning stream` có thể ghi nội dung suy luận vào một bản xem trước tạm thời
  sẽ bị xóa sau khi phân phối kết quả cuối.
- Các phản hồi trích dẫn được chọn trên Telegram là một ngoại lệ: khi `replyToMode` không phải là
  `"off"` và có văn bản trích dẫn được chọn, OpenClaw bỏ qua luồng bản xem trước câu trả lời
  cho lượt đó (câu trả lời cuối cùng phải đi qua đường dẫn phản hồi trích dẫn gốc)
  nên các dòng xem trước tiến trình công cụ không thể hiển thị. Các phản hồi cho thông báo hiện tại
  không có văn bản trích dẫn được chọn vẫn giữ truyền phát bản xem trước. Xem
  [tài liệu kênh Telegram](/vi/channels/telegram) để biết chi tiết.

### Discord

- Sử dụng thao tác gửi + chỉnh sửa thông báo xem trước.
- Chế độ `block` sử dụng chia đoạn bản nháp (`draftChunk`).
- Truyền phát bản xem trước bị bỏ qua khi truyền phát khối của Discord được bật rõ ràng.
- Chế độ `progress` nối thêm một biên nhận hoạt động `-#` nhỏ (số lượt suy nghĩ/gọi công cụ
  và thời gian đã trôi qua) vào câu trả lời cuối cùng và xóa bản nháp trạng thái
  sau khi câu trả lời đó được phân phối, để các kênh bận rộn không giữ nhật ký công cụ mồ côi
  phía trên câu trả lời. Kết quả cuối có lỗi giữ lại bản nháp làm bản ghi của lượt
  thất bại.
- Các payload phương tiện, lỗi và phản hồi rõ ràng ở kết quả cuối sẽ hủy các bản xem trước đang chờ
  mà không đẩy ra bản nháp mới, sau đó sử dụng cơ chế phân phối thông thường.

### Slack

- `partial` có thể sử dụng truyền phát gốc của Slack (`chat.startStream`/`append`/`stop`)
  khi khả dụng.
- `block` sử dụng các bản xem trước bản nháp theo kiểu nối thêm.
- `progress` sử dụng văn bản xem trước trạng thái, sau đó là câu trả lời cuối cùng.
- Các DM cấp cao nhất không có luồng phản hồi sử dụng bài đăng bản nháp xem trước và thao tác chỉnh sửa
  thay vì truyền phát gốc của Slack.
- Truyền phát bản xem trước gốc và bản nháp ngăn phản hồi khối cho lượt đó, để một
  phản hồi Slack chỉ được truyền phát qua một đường dẫn phân phối.
- Các payload phương tiện/lỗi cuối cùng và kết quả cuối tiến trình không tạo thông báo bản nháp
  dùng một lần; chỉ các kết quả cuối dạng văn bản/khối có thể chỉnh sửa bản xem trước mới đẩy
  văn bản bản nháp đang chờ.

### Mattermost

- Ở chế độ `partial`, truyền phát nội dung suy nghĩ và văn bản phản hồi từng phần vào một bài đăng
  bản nháp xem trước duy nhất, được hoàn tất tại chỗ khi câu trả lời cuối cùng có thể được gửi an toàn.
- Ở chế độ `progress`, truyền phát nội dung suy nghĩ và hoạt động công cụ vào một bản xem trước trạng thái
  duy nhất, được hoàn tất tại chỗ khi câu trả lời cuối cùng có thể được gửi an toàn.
- Ở chế độ `block`, luân chuyển giữa các bài đăng văn bản đã hoàn tất và hoạt động công cụ;
  các bản cập nhật công cụ song song và liên tiếp dùng chung bài đăng hoạt động công cụ hiện tại.
- Chuyển sang gửi một bài đăng cuối mới nếu bài đăng xem trước đã bị xóa hoặc
  không khả dụng vì lý do khác tại thời điểm hoàn tất.
- Các payload phương tiện/lỗi cuối cùng hủy các bản cập nhật bản xem trước đang chờ trước khi
  phân phối thông thường thay vì đẩy ra một bài đăng xem trước tạm thời.

### Matrix

- Các bản xem trước bản nháp được hoàn tất tại chỗ khi văn bản cuối có thể tái sử dụng sự kiện
  xem trước.
- Các kết quả cuối chỉ có phương tiện, có lỗi và không khớp đích phản hồi sẽ hủy các bản cập nhật bản xem trước
  đang chờ trước khi phân phối thông thường; bản xem trước cũ đã hiển thị sẽ bị che đi.

## Các bản cập nhật xem trước tiến trình công cụ

Truyền phát bản xem trước cũng có thể bao gồm các bản cập nhật **tiến trình công cụ**: những dòng trạng thái
ngắn như "đang tìm kiếm trên web", "đang đọc tệp" hoặc "đang gọi công cụ" xuất hiện
trong cùng thông báo xem trước khi các công cụ đang chạy, trước phản hồi cuối cùng.
Trong chế độ máy chủ ứng dụng Codex, các thông báo phần mở đầu/bình luận của Codex sử dụng cùng
đường dẫn xem trước này, vì vậy các ghi chú tiến trình ngắn "Tôi đang kiểm tra..." có thể được truyền phát vào
bản nháp có thể chỉnh sửa mà không trở thành một phần của câu trả lời cuối cùng. Điều này giúp
các lượt công cụ nhiều bước duy trì hiển thị hoạt động thay vì im lặng giữa bản xem trước
suy nghĩ đầu tiên và câu trả lời cuối cùng.

Các công cụ chạy lâu có thể phát tiến trình được định kiểu trước khi trả về. Ví dụ,
`web_fetch` kích hoạt bộ hẹn giờ năm giây khi bắt đầu: nếu thao tác tìm nạp vẫn
đang chờ, bản xem trước hiển thị `Fetching page content...`; nếu thao tác tìm nạp hoàn tất hoặc
bị hủy trước thời điểm đó, không có dòng tiến trình nào được phát. Kết quả công cụ cuối cùng sau đó
vẫn được phân phối bình thường cho mô hình.

Các bề mặt được hỗ trợ:

- **Discord**, **Slack**, **Telegram** và **Matrix** truyền phát tiến trình công cụ và
  các bản cập nhật phần mở đầu Codex vào thao tác chỉnh sửa bản xem trước trực tiếp theo mặc định khi truyền phát
  bản xem trước đang hoạt động. Microsoft Teams sử dụng luồng tiến trình gốc trong
  các cuộc trò chuyện cá nhân.
- Telegram đã phát hành với các bản cập nhật xem trước tiến trình công cụ được bật kể từ
  `v2026.4.22`; việc tiếp tục bật chúng duy trì hành vi đã phát hành đó.
- **Mattermost** gộp hoạt động công cụ vào một bài đăng xem trước trong các chế độ `partial` và
  `progress`, hoặc một bài đăng hoạt động công cụ giữa các khối văn bản trong chế độ `block`
  (xem phía trên).
- Các chỉnh sửa tiến trình công cụ tuân theo chế độ truyền phát bản xem trước đang hoạt động; chúng bị
  bỏ qua khi truyền phát bản xem trước là `off` hoặc khi truyền phát khối đã tiếp quản
  thông báo. Trên Telegram, `streaming.mode: "off"` chỉ dành cho kết quả cuối: lời dẫn tiến trình
  chung cũng bị ngăn thay vì được phân phối dưới dạng các thông báo trạng thái độc lập,
  trong khi các lời nhắc phê duyệt, payload phương tiện và lỗi vẫn được định tuyến
  bình thường.
- Để giữ truyền phát bản xem trước nhưng ẩn các dòng tiến trình công cụ, hãy đặt
  `streaming.preview.toolProgress` thành `false` cho kênh đó (mặc định
  `true`). Để giữ các dòng tiến trình công cụ hiển thị trong khi ẩn văn bản lệnh/thực thi,
  hãy đặt `streaming.preview.commandText` thành `"status"` hoặc
  `streaming.progress.commandText` thành `"status"`; mặc định là `"raw"` để
  duy trì hành vi đã phát hành. Chính sách này được dùng chung bởi các kênh bản nháp/tiến trình
  sử dụng trình kết xuất tiến trình thu gọn của OpenClaw, bao gồm Discord, Matrix,
  Microsoft Teams, Mattermost, các bản xem trước bản nháp Slack và Telegram. Để tắt
  hoàn toàn thao tác chỉnh sửa bản xem trước, hãy đặt `streaming.mode` thành `off`.

## Kết xuất bản nháp tiến trình

Các bản nháp chế độ tiến trình (`streaming.progress.*`) có giới hạn và có thể cấu hình theo từng
kênh:

| Khóa                              | Mặc định      | Hành vi                                                        |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Số dòng tiến trình thu gọn tối đa được giữ bên dưới nhãn bản nháp |
| `streaming.progress.maxLineChars` | `120`         | Số ký tự tối đa trên mỗi dòng thu gọn trước khi cắt bớt (có nhận biết từ) |
| `streaming.progress.label`        | `"auto"`      | Tiêu đề bản nháp; một chuỗi tùy chỉnh hoặc `false` để ẩn tiêu đề |
| `streaming.progress.labels`       | nhóm tích hợp sẵn | Các nhãn ứng viên được sử dụng khi `label: "auto"`                     |

### Luồng tiến trình bình luận

Ngoài tiến trình công cụ, trình kết xuất tiến trình thu gọn có thể hiển thị thêm một luồng
trong bản nháp:

- **`streaming.progress.commentary`** - kết xuất phần **bình luận** trước công cụ
  của mô hình (một lời dẫn ngắn "Tôi sẽ kiểm tra... rồi...") xen kẽ với
  các dòng công cụ trong bản nháp tiến trình. Trên Discord và Telegram ở chế độ tiến trình,
  cùng phần mở đầu đó cung cấp tiêu đề trạng thái ngay cả khi luồng tùy chọn này
  bị tắt; các kênh khác giữ nguyên hành vi tiến trình hiện có. Xem
  [Bản nháp tiến trình](/vi/concepts/progress-drafts#status-headline).

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

Sử dụng cùng cấu trúc dưới một khóa kênh tiến trình thu gọn khác, ví dụ
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` hoặc các bản xem trước bản nháp Slack. Đối với chế độ bản nháp tiến trình, hãy đặt
cùng chính sách trong `streaming.progress`:

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

- [Tái cấu trúc vòng đời thông báo](/vi/concepts/message-lifecycle-refactor) - thiết kế dùng chung mục tiêu cho bản xem trước, chỉnh sửa, truyền phát và hoàn tất
- [Bản nháp tiến trình](/vi/concepts/progress-drafts) - các thông báo công việc đang tiến hành hiển thị và cập nhật trong các lượt dài
- [Thông báo](/vi/concepts/messages) - vòng đời và phân phối thông báo
- [Thử lại](/vi/concepts/retry) - hành vi thử lại khi phân phối thất bại
- [Kênh](/vi/channels) - hỗ trợ truyền phát theo từng kênh
