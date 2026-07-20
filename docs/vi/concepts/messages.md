---
read_when:
    - Giải thích cách tin nhắn đến được chuyển thành phản hồi
    - Làm rõ phiên, chế độ xếp hàng đợi hoặc hành vi truyền trực tuyến
    - Tài liệu hóa khả năng hiển thị quá trình suy luận và các tác động đối với việc sử dụng
summary: Luồng tin nhắn, phiên, xếp hàng và khả năng hiển thị quá trình suy luận
title: Tin nhắn
x-i18n:
    generated_at: "2026-07-20T04:36:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 843b9defdd56f55b8cb43c366f247a740cf851fb86bbef66a422cf8efdebe059
    source_path: concepts/messages.md
    workflow: 16
---

Tin nhắn đến đi qua quá trình định tuyến, loại bỏ trùng lặp/chống dội, một lượt chạy của agent và phân phối đầu ra:

```text
Tin nhắn đến
  -> định tuyến/liên kết -> khóa phiên
  -> loại bỏ trùng lặp + chống dội
  -> hàng đợi (nếu một lượt chạy đang hoạt động)
  -> lượt chạy của agent (phát trực tuyến + công cụ)
  -> phản hồi đầu ra (giới hạn kênh + chia đoạn)
```

Các bề mặt cấu hình chính:

- `messages.*` dành cho tiền tố, xếp hàng, chống dội đầu vào và hành vi nhóm.
- `agents.defaults.*` dành cho phát trực tuyến theo khối, chia đoạn và giá trị mặc định của phản hồi im lặng.
- Các phần ghi đè theo kênh (`channels.telegram.*`, `channels.whatsapp.*`, v.v.) dành cho giới hạn và tùy chọn phát trực tuyến của từng kênh.

Xem [Cấu hình](/vi/gateway/configuration) để biết lược đồ đầy đủ.

## Loại bỏ trùng lặp đầu vào

Các kênh có thể phân phối lại cùng một tin nhắn sau khi kết nối lại. OpenClaw duy trì một bộ nhớ đệm trong bộ nhớ, được định khóa theo phạm vi agent, tuyến kênh (kênh + bên đối thoại + tài khoản + luồng) và ID tin nhắn, vì vậy tin nhắn được phân phối lại không kích hoạt lượt chạy agent thứ hai. Mục nhập bộ nhớ đệm hết hạn sau 20 phút hoặc khi đã theo dõi 5000 mục nhập, tùy điều kiện nào đến trước.

## Chống dội đầu vào

Các tin nhắn văn bản liên tiếp nhanh từ cùng một người gửi có thể được gộp thành một lượt của agent thông qua `messages.inbound`. Chống dội được giới hạn theo từng kênh + cuộc trò chuyện và sử dụng tin nhắn gần nhất cho luồng/ID phản hồi.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- Chống dội áp dụng cho tin nhắn chỉ có văn bản; nội dung đa phương tiện/tệp đính kèm được đẩy ngay lập tức.
- Các lệnh điều khiển (dừng/hủy bỏ/trạng thái, v.v.) bỏ qua chống dội để được gửi đi ngay lập tức.
- Mặc định bị tắt: `messages.inbound.debounceMs` không có giá trị mặc định tích hợp, vì vậy chống dội chỉ kích hoạt sau khi bạn thiết lập nó (toàn cục hoặc theo từng kênh).
- Tùy chọn tham gia `coalesceSameSenderDms` của iMessage là ngoại lệ duy nhất: nó giữ toàn bộ văn bản tin nhắn trực tiếp từ cùng một người gửi (bao gồm cả lệnh) đủ lâu để thao tác gửi tách lệnh+URL của Apple được tiếp nhận thành một lượt. Trò chuyện nhóm luôn được gửi đi ngay lập tức bất kể cài đặt này.

## Phiên và thiết bị

Các phiên thuộc quyền sở hữu của Gateway, không phải của máy khách.

- Các cuộc trò chuyện trực tiếp được gộp vào khóa phiên chính của agent.
- Các nhóm/kênh có khóa phiên riêng.
- Kho lưu trữ phiên và bản ghi hội thoại nằm trên máy chủ Gateway.

Nhiều thiết bị/kênh có thể ánh xạ đến cùng một phiên, nhưng lịch sử không được đồng bộ đầy đủ trở lại mọi máy khách. Hãy sử dụng một thiết bị chính cho các cuộc trò chuyện dài để tránh ngữ cảnh phân kỳ. Giao diện điều khiển và TUI luôn hiển thị bản ghi phiên do Gateway hỗ trợ, vì vậy đây là nguồn thông tin xác thực.

Chi tiết: [Quản lý phiên](/vi/concepts/session).

## Nội dung lời nhắc và ngữ cảnh lịch sử

Các Plugin kênh điền một số trường văn bản trong ngữ cảnh đầu vào, theo thứ tự ưu tiên từ cao nhất đến thấp nhất:

| Trường             | Mục đích                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Văn bản dành cho mô hình của lượt hiện tại. Dùng `CommandBody` / `RawBody` / `Body` làm phương án dự phòng khi chưa đặt.        |
| `BodyForCommands` | Văn bản sạch dùng để phân tích chỉ thị/lệnh. Dùng `CommandBody` / `RawBody` / `Body` làm phương án dự phòng khi chưa đặt. |
| `CommandBody`     | Nội dung trung gian cũ; ưu tiên `BodyForCommands`.                                                         |
| `RawBody`         | Bí danh không còn được khuyến nghị của `CommandBody`.                                                                         |
| `Body`            | Nội dung lời nhắc cũ; có thể bao gồm phong bì kênh và trình bao lịch sử.                                     |

Khi một kênh cung cấp lịch sử, kênh đó bao bọc lịch sử bằng:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Đối với các cuộc trò chuyện không trực tiếp (nhóm/kênh/phòng), nội dung tin nhắn hiện tại được thêm tiền tố là nhãn người gửi, khớp với kiểu được dùng cho các mục lịch sử. Việc loại bỏ chỉ thị chỉ áp dụng cho phần tin nhắn hiện tại, nên lịch sử vẫn nguyên vẹn. Các kênh bao bọc lịch sử nên đặt `BodyForCommands` (hoặc `CommandBody` / `RawBody` cũ) thành văn bản tin nhắn gốc và giữ `Body` làm lời nhắc kết hợp.

Bộ đệm lịch sử chỉ chứa nội dung đang chờ: chúng bao gồm các tin nhắn nhóm không kích hoạt lượt chạy (ví dụ: tin nhắn bị giới hạn bởi yêu cầu đề cập) và loại trừ các tin nhắn đã có trong bản ghi phiên. Lịch sử có cấu trúc, nội dung trả lời, nội dung chuyển tiếp và siêu dữ liệu kênh được kết xuất thành các khối ngữ cảnh có vai trò người dùng không đáng tin cậy trong quá trình tập hợp lời nhắc.

Cấu hình kích thước lịch sử bằng `messages.groupChat.historyLimit` (mặc định toàn cục) hoặc các phần ghi đè theo từng kênh như `channels.slack.historyLimit` và `channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Siêu dữ liệu kết quả công cụ

`content` của kết quả công cụ là kết quả hiển thị với mô hình; `details` là siêu dữ liệu thời gian chạy dành cho kết xuất giao diện người dùng, chẩn đoán, phân phối nội dung đa phương tiện và các Plugin.

- `toolResult.details` bị loại bỏ trước khi phát lại cho nhà cung cấp và trước đầu vào Compaction.
- Các bản ghi phiên được lưu bền vững chỉ giữ lại `details` có giới hạn; siêu dữ liệu quá lớn được thay thế bằng một bản tóm tắt gọn được đánh dấu `persistedDetailsTruncated: true`.
- Các Plugin và công cụ nên đặt văn bản mà mô hình phải đọc trong `content`, không chỉ trong `details`.

## Xếp hàng và lượt tiếp theo

Khi một lượt chạy đang hoạt động, theo mặc định, các tin nhắn đến sẽ điều hướng vào lượt chạy đó. `messages.queue` kiểm soát chế độ:

| Chế độ              | Hành vi                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (mặc định) | Chèn lời nhắc mới vào lượt chạy đang hoạt động.          |
| `followup`        | Chạy tin nhắn sau khi lượt chạy đang hoạt động kết thúc.      |
| `collect`         | Gộp các tin nhắn tương thích vào một lượt sau đó.      |
| `interrupt`       | Hủy bỏ lượt chạy đang hoạt động, sau đó bắt đầu lời nhắc mới nhất. |

Hàng đợi sử dụng cơ chế chống dội tích hợp 500ms để điều hướng, xử lý lượt tiếp theo và gộp thu thập. `messages.queue.cap` mặc định là 20 tin nhắn được xếp hàng và `messages.queue.drop` mặc định là `summarize` (`old` và `new` cũng có sẵn). Cấu hình phần ghi đè theo từng kênh thông qua `messages.queue.byChannel` và `messages.queue.debounceMsByChannel`.

Chi tiết: [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Quyền sở hữu lượt chạy của kênh

Các Plugin kênh có thể duy trì thứ tự, chống dội đầu vào và áp dụng áp lực ngược truyền tải trước khi tin nhắn đi vào hàng đợi phiên. Chúng không nên áp đặt thời gian chờ riêng quanh chính lượt của agent. Sau khi tin nhắn được định tuyến đến một phiên, vòng đời của phiên, công cụ và thời gian chạy quản lý công việc chạy dài để mọi kênh báo cáo và khôi phục từ các lượt chạy chậm một cách nhất quán.

## Phát trực tuyến, chia đoạn và gộp

Phát trực tuyến theo khối gửi các phản hồi từng phần khi mô hình tạo ra các khối văn bản; việc chia đoạn tuân thủ giới hạn văn bản của kênh và tránh tách mã có hàng rào.

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (gộp dựa trên thời gian nhàn rỗi)
- `agents.defaults.humanDelay` (khoảng dừng giống con người giữa các phản hồi theo khối)
- Các phần ghi đè theo kênh: `*.streaming.block.enabled` và `*.streaming.block.coalesce` trên các kênh đi kèm; các khóa phẳng lỗi thời được `openclaw doctor --fix` di chuyển. Phát trực tuyến theo khối bị tắt trừ khi được bật rõ ràng trên mọi kênh, bao gồm Telegram. QQ Bot là ngoại lệ: nó không có khóa `streaming.block` và phát trực tuyến các phản hồi theo khối trừ khi `channels.qqbot.streaming.mode` là `"off"`.

Chi tiết: [Phát trực tuyến + chia đoạn](/vi/concepts/streaming).

## Khả năng hiển thị lập luận và token

- `/reasoning on|off|stream` kiểm soát khả năng hiển thị.
- Nội dung lập luận vẫn được tính vào mức sử dụng token khi mô hình tạo ra nội dung đó.
- Telegram hỗ trợ phát trực tuyến lập luận vào một bong bóng bản nháp tạm thời bị xóa sau lần phân phối cuối cùng; sử dụng `/reasoning on` để duy trì đầu ra lập luận.

Chi tiết: [Chỉ thị suy nghĩ + lập luận](/vi/tools/thinking) và [Mức sử dụng token](/vi/reference/token-use).

## Tiền tố, luồng và phản hồi

- Chuỗi ưu tiên tiền tố đầu ra: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp cũng có `channels.whatsapp.messagePrefix` dành cho tiền tố đầu vào.
- Tạo luồng phản hồi thông qua `replyToMode` và các giá trị mặc định theo từng kênh.

Chi tiết: [Cấu hình](/vi/gateway/config-agents#messages) và tài liệu về kênh.

## Phản hồi im lặng

Token im lặng `NO_REPLY` (không phân biệt chữ hoa chữ thường, vì vậy `no_reply` cũng khớp) có nghĩa là "không phân phối phản hồi hiển thị với người dùng." Khi một lượt cũng có nội dung đa phương tiện từ công cụ đang chờ, chẳng hạn như âm thanh TTS được tạo, OpenClaw loại bỏ văn bản im lặng nhưng vẫn phân phối tệp đa phương tiện đính kèm.

Chính sách im lặng được xác định theo loại cuộc trò chuyện:

- Các cuộc trò chuyện trực tiếp không bao giờ nhận hướng dẫn lời nhắc `NO_REPLY`. Nếu một lượt chạy trực tiếp vô tình trả về một token im lặng đơn lẻ, OpenClaw sẽ chặn token đó thay vì viết lại hoặc phân phối.
- Các nhóm/kênh mặc định cho phép im lặng. Trong chế độ phản hồi hiển thị `message_tool`, im lặng có nghĩa là mô hình không gọi `message(action=send)`.
- Hoạt động điều phối nội bộ mặc định cho phép im lặng.

Các giá trị mặc định nằm trong `agents.defaults.silentReply`; `surfaces.<id>.silentReply` có thể ghi đè chính sách nhóm/nội bộ theo từng bề mặt.

OpenClaw cũng sử dụng phản hồi im lặng cho các lỗi chung của trình chạy nội bộ trong các cuộc trò chuyện không trực tiếp, để các nhóm/kênh không thấy văn bản lỗi soạn sẵn của Gateway. Các lỗi đã phân loại với nội dung khôi phục dành cho người dùng, chẳng hạn như thông báo thiếu xác thực, giới hạn tốc độ hoặc quá tải, vẫn có thể được phân phối. Theo mặc định, trò chuyện trực tiếp hiển thị nội dung lỗi ngắn gọn; chi tiết thô của trình chạy chỉ hiển thị khi `/verbose full` được bật.

Các phản hồi im lặng đơn lẻ bị loại bỏ trên mọi bề mặt, vì vậy các phiên cha vẫn im lặng thay vì viết lại văn bản sentinel thành nội dung trò chuyện dự phòng.

## Liên quan

- [Tái cấu trúc vòng đời tin nhắn](/vi/concepts/message-lifecycle-refactor) - thiết kế đích bền vững cho việc gửi và nhận
- [Phát trực tuyến](/vi/concepts/streaming) - phân phối tin nhắn theo thời gian thực
- [Thử lại](/vi/concepts/retry) - hành vi thử lại khi phân phối tin nhắn
- [Hàng đợi](/vi/concepts/queue) - hàng đợi xử lý tin nhắn
- [Kênh](/vi/channels) - tích hợp nền tảng nhắn tin
