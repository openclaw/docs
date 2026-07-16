---
read_when:
    - Giải thích cách tin nhắn đến được chuyển thành phản hồi
    - Làm rõ các phiên, chế độ xếp hàng hoặc hành vi truyền trực tuyến
    - Ghi lại khả năng hiển thị quá trình suy luận và các tác động đối với việc sử dụng
summary: Luồng tin nhắn, phiên, hàng đợi và khả năng hiển thị quá trình suy luận
title: Tin nhắn
x-i18n:
    generated_at: "2026-07-16T14:20:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

Các tin nhắn đến đi qua quá trình định tuyến, loại bỏ trùng lặp/trì hoãn, một lượt chạy của tác tử và chuyển phát đi:

```text
Tin nhắn đến
  -> định tuyến/liên kết -> khóa phiên
  -> loại bỏ trùng lặp + trì hoãn
  -> hàng đợi (nếu một lượt chạy đã hoạt động)
  -> lượt chạy của tác tử (truyền phát + công cụ)
  -> phản hồi gửi đi (giới hạn kênh + chia đoạn)
```

Các bề mặt cấu hình chính:

- `messages.*` cho tiền tố, xếp hàng đợi, trì hoãn tin nhắn đến và hành vi nhóm.
- `agents.defaults.*` cho truyền phát theo khối, chia đoạn và giá trị mặc định của phản hồi im lặng.
- Các ghi đè theo kênh (`channels.telegram.*`, `channels.whatsapp.*`, v.v.) cho giới hạn và công tắc truyền phát của từng kênh.

Xem [Cấu hình](/vi/gateway/configuration) để biết lược đồ đầy đủ.

## Loại bỏ trùng lặp tin nhắn đến

Các kênh có thể chuyển phát lại cùng một tin nhắn sau khi kết nối lại. OpenClaw duy trì một bộ nhớ đệm trong bộ nhớ, được định khóa theo phạm vi tác tử, tuyến kênh (kênh + đối tác + tài khoản + luồng) và id tin nhắn, để tin nhắn được chuyển phát lại không kích hoạt lượt chạy tác tử thứ hai. Mục nhập bộ nhớ đệm hết hạn sau 20 phút hoặc khi đã theo dõi 5000 mục nhập, tùy điều kiện nào đến trước.

## Trì hoãn tin nhắn đến

Các tin nhắn văn bản liên tiếp nhanh chóng từ cùng một người gửi có thể được gom thành một lượt tác tử thông qua `messages.inbound`. Việc trì hoãn có phạm vi theo từng kênh + cuộc trò chuyện và sử dụng tin nhắn gần nhất cho luồng/id phản hồi.

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

- Việc trì hoãn áp dụng cho tin nhắn chỉ có văn bản; phương tiện/tệp đính kèm được đẩy ngay lập tức.
- Các lệnh điều khiển (dừng/hủy/trạng thái, v.v.) bỏ qua việc trì hoãn để được gửi đi ngay lập tức.
- Bị tắt theo mặc định: `messages.inbound.debounceMs` không có giá trị mặc định tích hợp, vì vậy việc trì hoãn chỉ kích hoạt sau khi bạn thiết lập nó (toàn cục hoặc theo từng kênh).
- Tùy chọn tham gia `coalesceSameSenderDms` của iMessage là ngoại lệ duy nhất: nó giữ tất cả văn bản DM từ cùng người gửi (bao gồm cả lệnh) đủ lâu để phần lệnh+URL do Apple gửi tách biệt đến trong cùng một lượt. Trò chuyện nhóm luôn được gửi đi ngay lập tức bất kể cài đặt này.

## Phiên và thiết bị

Các phiên thuộc quyền sở hữu của Gateway, không phải của máy khách.

- Các cuộc trò chuyện trực tiếp được gộp vào khóa phiên chính của tác tử.
- Các nhóm/kênh có khóa phiên riêng.
- Kho phiên và bản chép lời nằm trên máy chủ Gateway.

Nhiều thiết bị/kênh có thể ánh xạ đến cùng một phiên, nhưng lịch sử không được đồng bộ đầy đủ trở lại mọi máy khách. Hãy sử dụng một thiết bị chính cho các cuộc trò chuyện dài để tránh ngữ cảnh phân kỳ. Giao diện điều khiển và TUI luôn hiển thị bản chép lời phiên do Gateway hỗ trợ, vì vậy đây là nguồn dữ liệu chuẩn.

Chi tiết: [Quản lý phiên](/vi/concepts/session).

## Nội dung lời nhắc và ngữ cảnh lịch sử

Các Plugin kênh điền một số trường văn bản vào ngữ cảnh tin nhắn đến, theo thứ tự ưu tiên từ cao đến thấp:

| Trường             | Mục đích                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Văn bản dành cho mô hình trong lượt hiện tại. Dự phòng về `CommandBody` / `RawBody` / `Body` khi chưa được đặt.        |
| `BodyForCommands` | Văn bản sạch dùng để phân tích chỉ thị/lệnh. Dự phòng về `CommandBody` / `RawBody` / `Body` khi chưa được đặt. |
| `CommandBody`     | Nội dung trung gian cũ; ưu tiên `BodyForCommands`.                                                         |
| `RawBody`         | Bí danh không còn được khuyến nghị của `CommandBody`.                                                                         |
| `Body`            | Nội dung lời nhắc cũ; có thể bao gồm phong bì kênh và trình bao lịch sử.                                     |

Khi một kênh cung cấp lịch sử, nó bao bọc lịch sử bằng:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Đối với các cuộc trò chuyện không trực tiếp (nhóm/kênh/phòng), nội dung tin nhắn hiện tại được thêm tiền tố là nhãn người gửi, khớp với kiểu dùng cho các mục lịch sử. Việc loại bỏ chỉ thị chỉ áp dụng cho phần tin nhắn hiện tại, vì vậy lịch sử vẫn nguyên vẹn. Các kênh bao bọc lịch sử nên đặt `BodyForCommands` (hoặc `CommandBody` / `RawBody` cũ) thành văn bản tin nhắn gốc và giữ `Body` làm lời nhắc kết hợp.

Bộ đệm lịch sử chỉ chứa nội dung đang chờ xử lý: chúng bao gồm các tin nhắn nhóm không kích hoạt lượt chạy (ví dụ: tin nhắn bị kiểm soát bằng lượt đề cập) và loại trừ các tin nhắn đã có trong bản chép lời phiên. Lịch sử có cấu trúc, nội dung trả lời, chuyển tiếp và siêu dữ liệu kênh được kết xuất dưới dạng các khối ngữ cảnh vai trò người dùng không đáng tin cậy trong quá trình tập hợp lời nhắc.

Cấu hình kích thước lịch sử bằng `messages.groupChat.historyLimit` (mặc định toàn cục) hoặc các ghi đè theo kênh như `channels.slack.historyLimit` và `channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Siêu dữ liệu kết quả công cụ

`content` của kết quả công cụ là kết quả hiển thị cho mô hình; `details` là siêu dữ liệu thời gian chạy dùng cho kết xuất giao diện người dùng, chẩn đoán, chuyển phát phương tiện và Plugin.

- `toolResult.details` bị loại bỏ trước khi phát lại cho nhà cung cấp và trước đầu vào Compaction.
- Bản chép lời phiên được lưu trữ chỉ giữ lại `details` có giới hạn; siêu dữ liệu quá lớn được thay thế bằng bản tóm tắt nhỏ gọn có đánh dấu `persistedDetailsTruncated: true`.
- Plugin và công cụ nên đặt văn bản mà mô hình phải đọc trong `content`, không chỉ trong `details`.

## Xếp hàng đợi và lượt theo sau

Khi một lượt chạy đã hoạt động, theo mặc định các tin nhắn đến sẽ được chuyển hướng vào lượt đó. `messages.queue` kiểm soát chế độ:

| Chế độ              | Hành vi                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (mặc định) | Chèn lời nhắc mới vào lượt chạy đang hoạt động.          |
| `followup`        | Chạy tin nhắn sau khi lượt chạy đang hoạt động kết thúc.      |
| `collect`         | Gom các tin nhắn tương thích vào một lượt sau đó.      |
| `interrupt`       | Hủy lượt chạy đang hoạt động, sau đó bắt đầu lời nhắc mới nhất. |

Giá trị mặc định: `messages.queue.debounceMs` là 500ms (áp dụng như nhau cho việc chuyển hướng, theo sau và gom nhóm thu thập), `messages.queue.cap` là 20 tin nhắn trong hàng đợi và `messages.queue.drop` là `summarize` (`old` và `new` cũng khả dụng). Cấu hình ghi đè theo kênh thông qua `messages.queue.byChannel` và `messages.queue.debounceMsByChannel`.

Chi tiết: [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi chuyển hướng](/vi/concepts/queue-steering).

## Quyền sở hữu lượt chạy của kênh

Các Plugin kênh có thể duy trì thứ tự, trì hoãn đầu vào và áp dụng áp lực ngược của phương thức truyền tải trước khi tin nhắn đi vào hàng đợi phiên. Chúng không nên áp đặt thời gian chờ riêng quanh chính lượt tác tử. Sau khi tin nhắn được định tuyến đến một phiên, vòng đời phiên, công cụ và thời gian chạy sẽ chi phối công việc chạy lâu để tất cả các kênh báo cáo và khôi phục sau lượt xử lý chậm một cách nhất quán.

## Truyền phát, chia đoạn và gom nhóm

Truyền phát theo khối gửi các phản hồi từng phần khi mô hình tạo ra các khối văn bản; việc chia đoạn tuân thủ giới hạn văn bản của kênh và tránh tách mã có hàng rào.

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (gom nhóm dựa trên trạng thái nhàn rỗi)
- `agents.defaults.humanDelay` (khoảng dừng giống con người giữa các phản hồi theo khối)
- Ghi đè theo kênh: `*.streaming.block.enabled` và `*.streaming.block.coalesce` trên các kênh được đóng gói; các khóa phẳng cũ được di chuyển bởi `openclaw doctor --fix`. Truyền phát theo khối bị tắt trừ khi được bật rõ ràng, trên mọi kênh bao gồm Telegram. QQ Bot là ngoại lệ: nó không có khóa `streaming.block` và truyền phát phản hồi theo khối trừ khi `channels.qqbot.streaming.mode` là `"off"`.

Chi tiết: [Truyền phát + chia đoạn](/vi/concepts/streaming).

## Khả năng hiển thị lập luận và token

- `/reasoning on|off|stream` kiểm soát khả năng hiển thị.
- Nội dung lập luận vẫn được tính vào mức sử dụng token khi mô hình tạo ra nội dung đó.
- Telegram hỗ trợ truyền phát lập luận vào một bong bóng bản nháp tạm thời sẽ bị xóa sau lần chuyển phát cuối cùng; dùng `/reasoning on` để xuất lập luận liên tục.

Chi tiết: [Chỉ thị suy nghĩ + lập luận](/vi/tools/thinking) và [Mức sử dụng token](/vi/reference/token-use).

## Tiền tố, luồng và phản hồi

- Chuỗi phân cấp tiền tố gửi đi: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp cũng có `channels.whatsapp.messagePrefix` cho tiền tố tin nhắn đến.
- Phân luồng phản hồi thông qua `replyToMode` và các giá trị mặc định theo kênh.

Chi tiết: [Cấu hình](/vi/gateway/config-agents#messages) và tài liệu kênh.

## Phản hồi im lặng

Token im lặng `NO_REPLY` (không phân biệt chữ hoa chữ thường, vì vậy `no_reply` cũng khớp) có nghĩa là "không chuyển phát phản hồi hiển thị cho người dùng." Khi một lượt cũng có phương tiện công cụ đang chờ xử lý, chẳng hạn như âm thanh TTS được tạo, OpenClaw loại bỏ văn bản im lặng nhưng vẫn chuyển phát tệp phương tiện đính kèm.

Chính sách im lặng được xác định theo loại cuộc trò chuyện:

- Các cuộc trò chuyện trực tiếp không bao giờ nhận hướng dẫn lời nhắc `NO_REPLY`. Nếu một lượt chạy trực tiếp vô tình trả về một token im lặng đơn lẻ, OpenClaw sẽ chặn token đó thay vì viết lại hoặc chuyển phát.
- Nhóm/kênh mặc định cho phép im lặng. Trong chế độ phản hồi hiển thị `message_tool`, im lặng có nghĩa là mô hình không gọi `message(action=send)`.
- Hoạt động điều phối nội bộ mặc định cho phép im lặng.

Các giá trị mặc định nằm dưới `agents.defaults.silentReply`; `surfaces.<id>.silentReply` có thể ghi đè chính sách nhóm/nội bộ theo từng bề mặt.

OpenClaw cũng sử dụng phản hồi im lặng cho các lỗi trình chạy nội bộ chung trong những cuộc trò chuyện không trực tiếp, để nhóm/kênh không thấy văn bản lỗi mẫu của Gateway. Các lỗi đã phân loại có nội dung khôi phục dành cho người dùng, chẳng hạn như thông báo thiếu xác thực, giới hạn tốc độ hoặc quá tải, vẫn có thể được chuyển phát. Theo mặc định, trò chuyện trực tiếp hiển thị nội dung lỗi ngắn gọn; chi tiết thô của trình chạy chỉ hiển thị khi `/verbose full` được bật.

Phản hồi im lặng đơn lẻ bị loại bỏ trên mọi bề mặt, vì vậy các phiên cha vẫn giữ im lặng thay vì viết lại văn bản dấu hiệu thành nội dung trò chuyện dự phòng.

## Liên quan

- [Tái cấu trúc vòng đời tin nhắn](/vi/concepts/message-lifecycle-refactor) - thiết kế đích bền vững cho việc gửi và nhận
- [Truyền phát](/vi/concepts/streaming) - chuyển phát tin nhắn theo thời gian thực
- [Thử lại](/vi/concepts/retry) - hành vi thử lại khi chuyển phát tin nhắn
- [Hàng đợi](/vi/concepts/queue) - hàng đợi xử lý tin nhắn
- [Kênh](/vi/channels) - tích hợp nền tảng nhắn tin
