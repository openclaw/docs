---
read_when:
    - Giải thích cách tin nhắn đến trở thành phản hồi
    - Làm rõ các phiên, chế độ xếp hàng, hoặc hành vi truyền phát
    - Ghi lại khả năng hiển thị reasoning và các tác động về cách sử dụng
summary: Luồng tin nhắn, phiên, xếp hàng và khả năng hiển thị quá trình suy luận
title: Tin nhắn
x-i18n:
    generated_at: "2026-06-27T17:24:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw xử lý tin nhắn gửi đến thông qua một pipeline gồm phân giải phiên, xếp hàng, truyền trực tuyến, thực thi công cụ và hiển thị quá trình reasoning. Trang này mô tả đường đi từ tin nhắn gửi đến đến phản hồi.

## Luồng tin nhắn (cấp cao)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Các nút cấu hình chính nằm trong cấu hình:

- `messages.*` cho tiền tố, xếp hàng và hành vi nhóm.
- `agents.defaults.*` cho mặc định truyền trực tuyến theo khối và chia đoạn.
- Ghi đè theo kênh (`channels.whatsapp.*`, `channels.telegram.*`, v.v.) cho giới hạn và công tắc truyền trực tuyến.

Xem [Cấu hình](/vi/gateway/configuration) để biết schema đầy đủ.

## Chống trùng lặp tin nhắn gửi đến

Các kênh có thể gửi lại cùng một tin nhắn sau khi kết nối lại. OpenClaw giữ một bộ nhớ đệm ngắn hạn được định khóa theo kênh/tài khoản/đối tượng ngang hàng/phiên/id tin nhắn để các lần gửi trùng lặp không kích hoạt một lượt chạy agent khác.

## Gom trễ tin nhắn gửi đến

Các tin nhắn liên tiếp nhanh từ **cùng một người gửi** có thể được gom thành một lượt agent duy nhất thông qua `messages.inbound`. Việc gom trễ được giới hạn theo từng kênh + cuộc hội thoại và dùng tin nhắn mới nhất cho chuỗi phản hồi/ID.

Cấu hình (mặc định toàn cục + ghi đè theo kênh):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Ghi chú:

- Gom trễ áp dụng cho tin nhắn **chỉ có văn bản**; phương tiện/tệp đính kèm sẽ xả ngay lập tức.
- Lệnh điều khiển bỏ qua gom trễ để chúng vẫn độc lập. Các kênh chủ động chọn gom DM từ cùng người gửi có thể giữ lệnh DM trong cửa sổ gom trễ để một payload gửi tách đoạn có thể tham gia cùng một lượt agent.

## Phiên và thiết bị

Phiên thuộc sở hữu của Gateway, không thuộc về client.

- Trò chuyện trực tiếp được gộp vào khóa phiên chính của agent.
- Nhóm/kênh có khóa phiên riêng.
- Kho phiên và bản ghi hội thoại nằm trên máy chủ Gateway.

Nhiều thiết bị/kênh có thể ánh xạ tới cùng một phiên, nhưng lịch sử không được đồng bộ đầy đủ ngược về mọi client. Khuyến nghị: dùng một thiết bị chính cho các cuộc hội thoại dài để tránh ngữ cảnh phân kỳ. Control UI và TUI luôn hiển thị bản ghi phiên dựa trên Gateway, vì vậy chúng là nguồn sự thật.

Chi tiết: [Quản lý phiên](/vi/concepts/session).

## Siêu dữ liệu kết quả công cụ

`content` của kết quả công cụ là kết quả mà mô hình thấy được. `details` của kết quả công cụ là siêu dữ liệu runtime để kết xuất UI, chẩn đoán, gửi phương tiện và Plugin.

OpenClaw giữ ranh giới đó rõ ràng:

- `toolResult.details` bị loại bỏ trước đầu vào phát lại provider và Compaction.
- Bản ghi phiên được lưu trữ chỉ giữ `details` có giới hạn; siêu dữ liệu quá lớn được thay bằng bản tóm tắt gọn có đánh dấu `persistedDetailsTruncated: true`.
- Plugin và công cụ nên đặt văn bản mà mô hình phải đọc vào `content`, không chỉ trong `details`.

## Nội dung gửi đến và ngữ cảnh lịch sử

OpenClaw tách **nội dung prompt** khỏi **nội dung lệnh**:

- `BodyForAgent`: văn bản chính hướng đến mô hình cho tin nhắn hiện tại. Plugin kênh nên giữ phần này tập trung vào văn bản hiện tại của người gửi có chứa prompt.
- `Body`: phương án dự phòng prompt kế thừa. Phần này có thể bao gồm phong bì kênh và các wrapper lịch sử tùy chọn, nhưng các kênh hiện tại không nên dựa vào nó làm đầu vào mô hình chính khi có `BodyForAgent`.
- `CommandBody`: văn bản người dùng thô để phân tích chỉ thị/lệnh.
- `RawBody`: bí danh kế thừa cho `CommandBody` (được giữ để tương thích).

Khi kênh cung cấp lịch sử, nó dùng một wrapper dùng chung:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Đối với **trò chuyện không trực tiếp** (nhóm/kênh/phòng), **nội dung tin nhắn hiện tại** được thêm tiền tố bằng nhãn người gửi (cùng kiểu dùng cho các mục lịch sử). Điều này giữ cho tin nhắn thời gian thực và tin nhắn được xếp hàng/lịch sử nhất quán trong prompt của agent.

Bộ đệm lịch sử **chỉ chứa tin đang chờ**: chúng bao gồm tin nhắn nhóm _không_ kích hoạt lượt chạy (ví dụ: tin nhắn bị chặn bởi yêu cầu nhắc đến) và **loại trừ** tin nhắn đã có trong bản ghi phiên.

Việc loại bỏ chỉ thị chỉ áp dụng cho phần **tin nhắn hiện tại** để lịch sử vẫn nguyên vẹn. Các kênh bọc lịch sử nên đặt `CommandBody` (hoặc `RawBody`) thành văn bản tin nhắn gốc và giữ `Body` là prompt kết hợp. Lịch sử có cấu trúc, phản hồi, tin được chuyển tiếp và siêu dữ liệu kênh được kết xuất thành các khối ngữ cảnh không tin cậy với vai trò người dùng trong quá trình lắp ráp prompt.
Bộ đệm lịch sử có thể cấu hình qua `messages.groupChat.historyLimit` (mặc định toàn cục) và các ghi đè theo kênh như `channels.slack.historyLimit` hoặc `channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Xếp hàng và followup

Nếu một lượt chạy đã hoạt động, tin nhắn gửi đến mặc định được điều hướng vào lượt chạy hiện tại. `messages.queue` chọn liệu tin nhắn khi đang có lượt chạy hoạt động sẽ điều hướng, xếp hàng để xử lý sau, gom vào một lượt sau, hay ngắt lượt chạy đang hoạt động.

- Cấu hình qua `messages.queue` (và `messages.queue.byChannel`).
- Chế độ mặc định là `steer`, với gom trễ 500ms cho các lô điều hướng Codex và hàng đợi followup/collect.
- Chế độ: `steer`, `followup`, `collect` và `interrupt`.

Chi tiết: [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Quyền sở hữu lượt chạy của kênh

Plugin kênh có thể giữ thứ tự, gom trễ đầu vào và áp dụng backpressure truyền tải trước khi một tin nhắn đi vào hàng đợi phiên. Chúng không nên áp đặt timeout riêng quanh chính lượt agent. Sau khi một tin nhắn được định tuyến đến một phiên, công việc chạy lâu được quản lý bởi vòng đời phiên, công cụ và runtime để mọi kênh báo cáo và phục hồi nhất quán trước các lượt chậm.

## Truyền trực tuyến, chia đoạn và gom lô

Truyền trực tuyến theo khối gửi các phản hồi từng phần khi mô hình tạo ra các khối văn bản. Chia đoạn tôn trọng giới hạn văn bản của kênh và tránh tách các khối mã có rào.

Thiết lập chính:

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định tắt)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (gom lô dựa trên thời gian rỗi)
- `agents.defaults.humanDelay` (tạm dừng giống con người giữa các phản hồi theo khối)
- Ghi đè theo kênh: `*.blockStreaming` và `*.blockStreamingCoalesce` (các kênh không phải Telegram yêu cầu đặt rõ `*.blockStreaming: true`)

Chi tiết: [Truyền trực tuyến + chia đoạn](/vi/concepts/streaming).

## Hiển thị reasoning và token

OpenClaw có thể hiển thị hoặc ẩn reasoning của mô hình:

- `/reasoning on|off|stream` điều khiển mức hiển thị.
- Nội dung reasoning vẫn được tính vào mức sử dụng token khi được mô hình tạo ra.
- Telegram hỗ trợ luồng reasoning vào một bong bóng bản nháp tạm thời, bong bóng này bị xóa sau khi gửi cuối cùng; dùng `/reasoning on` để có đầu ra reasoning được giữ lại.

Chi tiết: [Chỉ thị thinking + reasoning](/vi/tools/thinking) và [Sử dụng token](/vi/reference/token-use).

## Tiền tố, chuỗi và phản hồi

Định dạng tin nhắn gửi đi được tập trung trong `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` và `channels.<channel>.accounts.<id>.responsePrefix` (chuỗi ưu tiên tiền tố gửi đi), cộng với `channels.whatsapp.messagePrefix` (tiền tố gửi đến của WhatsApp)
- Chuỗi phản hồi qua `replyToMode` và mặc định theo kênh

Chi tiết: [Cấu hình](/vi/gateway/config-agents#messages) và tài liệu kênh.

## Phản hồi im lặng

Token im lặng chính xác `NO_REPLY` / `no_reply` có nghĩa là "không gửi phản hồi mà người dùng thấy được".
Khi một lượt cũng có phương tiện công cụ đang chờ, chẳng hạn âm thanh TTS được tạo, OpenClaw loại bỏ văn bản im lặng nhưng vẫn gửi tệp đính kèm phương tiện.
OpenClaw phân giải hành vi đó theo loại cuộc hội thoại:

- Cuộc hội thoại trực tiếp không bao giờ nhận hướng dẫn prompt `NO_REPLY`. Nếu một lượt chạy trực tiếp vô tình trả về một token im lặng trần, OpenClaw chặn nó thay vì viết lại hoặc gửi nó.
- Nhóm/kênh mặc định chỉ cho phép im lặng đối với phản hồi nhóm tự động. Trong chế độ phản hồi hiển thị `message_tool`, im lặng nghĩa là mô hình không gọi `message(action=send)`.
- Điều phối nội bộ mặc định cho phép im lặng.

OpenClaw cũng dùng phản hồi im lặng cho lỗi runner nội bộ chung trong trò chuyện không trực tiếp, để nhóm/kênh không thấy văn bản lỗi Gateway rập khuôn.
Các lỗi đã phân loại có nội dung phục hồi hướng đến người dùng, chẳng hạn thiếu xác thực, giới hạn tốc độ hoặc thông báo quá tải, vẫn có thể được gửi. Trò chuyện trực tiếp mặc định hiển thị nội dung lỗi gọn; chi tiết runner thô chỉ hiển thị khi bật `/verbose full`.

Mặc định nằm dưới `agents.defaults.silentReply`; `surfaces.<id>.silentReply` có thể ghi đè chính sách nhóm/nội bộ theo từng bề mặt.

Phản hồi im lặng trần bị loại bỏ trên mọi bề mặt, vì vậy các phiên cha vẫn im lặng thay vì viết lại văn bản sentinel thành lời trò chuyện dự phòng.

## Liên quan

- [Tái cấu trúc vòng đời tin nhắn](/vi/concepts/message-lifecycle-refactor) - thiết kế gửi và nhận bền vững mục tiêu
- [Truyền trực tuyến](/vi/concepts/streaming) — gửi tin nhắn thời gian thực
- [Thử lại](/vi/concepts/retry) — hành vi thử lại gửi tin nhắn
- [Hàng đợi](/vi/concepts/queue) — hàng đợi xử lý tin nhắn
- [Kênh](/vi/channels) — tích hợp nền tảng nhắn tin
