---
read_when:
    - Giải thích cách các tin nhắn đến trở thành phản hồi
    - Làm rõ các phiên, chế độ xếp hàng hoặc hành vi truyền phát
    - Ghi tài liệu về khả năng hiển thị suy luận và tác động khi sử dụng
summary: Luồng tin nhắn, phiên, xếp hàng và khả năng hiển thị suy luận
title: Tin nhắn
x-i18n:
    generated_at: "2026-05-10T19:31:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw xử lý tin nhắn đến thông qua một pipeline gồm phân giải phiên, xếp hàng đợi, phát trực tuyến, thực thi công cụ và hiển thị suy luận. Trang này lập bản đồ đường đi từ tin nhắn đến đến phản hồi.

## Luồng tin nhắn (tổng quan)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Các nút điều chỉnh chính nằm trong cấu hình:

- `messages.*` cho tiền tố, xếp hàng đợi và hành vi nhóm.
- `agents.defaults.*` cho mặc định phát trực tuyến khối và chia đoạn.
- Ghi đè theo kênh (`channels.whatsapp.*`, `channels.telegram.*`, v.v.) cho giới hạn và bật/tắt phát trực tuyến.

Xem [Cấu hình](/vi/gateway/configuration) để biết schema đầy đủ.

## Khử trùng lặp tin nhắn đến

Các kênh có thể gửi lại cùng một tin nhắn sau khi kết nối lại. OpenClaw giữ một bộ nhớ đệm ngắn hạn, được khóa theo kênh/tài khoản/đối tượng ngang hàng/phiên/id tin nhắn, để các lần giao trùng lặp không kích hoạt một lượt chạy agent khác.

## Chống dội tin nhắn đến

Các tin nhắn liên tiếp nhanh từ **cùng một người gửi** có thể được gom thành một lượt agent duy nhất thông qua `messages.inbound`. Chống dội được giới hạn theo từng kênh + cuộc hội thoại và dùng tin nhắn mới nhất cho luồng phản hồi/ID.

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

- Chống dội áp dụng cho tin nhắn **chỉ có văn bản**; media/tệp đính kèm sẽ xả ngay lập tức.
- Lệnh điều khiển bỏ qua chống dội để chúng luôn độc lập. Các kênh chủ động chọn gom DM cùng người gửi có thể giữ lệnh DM trong cửa sổ chống dội để một payload gửi tách đoạn có thể nhập vào cùng một lượt agent.

## Phiên và thiết bị

Phiên thuộc sở hữu của Gateway, không thuộc về client.

- Chat trực tiếp được gộp vào khóa phiên chính của agent.
- Nhóm/kênh có khóa phiên riêng.
- Kho phiên và transcript nằm trên máy chủ Gateway.

Nhiều thiết bị/kênh có thể ánh xạ đến cùng một phiên, nhưng lịch sử không được đồng bộ đầy đủ ngược lại mọi client. Khuyến nghị: dùng một thiết bị chính cho các cuộc hội thoại dài để tránh ngữ cảnh phân kỳ. Control UI và TUI luôn hiển thị transcript phiên do Gateway hậu thuẫn, nên đó là nguồn sự thật.

Chi tiết: [Quản lý phiên](/vi/concepts/session).

## Siêu dữ liệu kết quả công cụ

`content` của kết quả công cụ là kết quả mà mô hình nhìn thấy. `details` của kết quả công cụ là siêu dữ liệu runtime cho kết xuất UI, chẩn đoán, gửi media và Plugin.

OpenClaw giữ ranh giới đó rõ ràng:

- `toolResult.details` bị loại bỏ trước khi phát lại provider và đầu vào Compaction.
- Transcript phiên được lưu bền chỉ giữ `details` có giới hạn; siêu dữ liệu quá lớn được thay bằng bản tóm tắt gọn có đánh dấu `persistedDetailsTruncated: true`.
- Plugin và công cụ nên đặt văn bản mà mô hình phải đọc vào `content`, không chỉ trong `details`.

## Nội dung tin nhắn đến và ngữ cảnh lịch sử

OpenClaw tách **nội dung prompt** khỏi **nội dung lệnh**:

- `BodyForAgent`: văn bản chính hướng đến mô hình cho tin nhắn hiện tại. Plugin kênh nên giữ phần này tập trung vào văn bản hiện tại của người gửi mang prompt.
- `Body`: dự phòng prompt cũ. Trường này có thể bao gồm phong bì kênh và wrapper lịch sử tùy chọn, nhưng các kênh hiện tại không nên dựa vào nó làm đầu vào mô hình chính khi có `BodyForAgent`.
- `CommandBody`: văn bản người dùng thô để phân tích chỉ thị/lệnh.
- `RawBody`: bí danh cũ của `CommandBody` (giữ để tương thích).

Khi một kênh cung cấp lịch sử, kênh đó dùng một wrapper chung:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Đối với **chat không trực tiếp** (nhóm/kênh/phòng), **nội dung tin nhắn hiện tại** được thêm tiền tố bằng nhãn người gửi (cùng kiểu dùng cho các mục lịch sử). Điều này giữ cho tin nhắn thời gian thực và tin nhắn hàng đợi/lịch sử nhất quán trong prompt của agent.

Bộ đệm lịch sử là **chỉ đang chờ**: chúng bao gồm các tin nhắn nhóm _không_ kích hoạt lượt chạy (ví dụ: tin nhắn bị cổng đề cập chặn) và **loại trừ** tin nhắn đã có trong transcript phiên.

Loại bỏ chỉ thị chỉ áp dụng cho phần **tin nhắn hiện tại** để lịch sử vẫn nguyên vẹn. Các kênh bọc lịch sử nên đặt `CommandBody` (hoặc `RawBody`) thành văn bản tin nhắn gốc và giữ `Body` là prompt kết hợp. Lịch sử có cấu trúc, phản hồi, tin nhắn được chuyển tiếp và siêu dữ liệu kênh được kết xuất dưới dạng các khối ngữ cảnh không tin cậy với vai trò người dùng trong quá trình lắp ráp prompt.
Bộ đệm lịch sử có thể cấu hình thông qua `messages.groupChat.historyLimit` (mặc định toàn cục) và các ghi đè theo kênh như `channels.slack.historyLimit` hoặc `channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Xếp hàng đợi và lượt tiếp theo

Nếu một lượt chạy đã hoạt động, tin nhắn đến có thể được xếp hàng đợi, được điều hướng vào lượt chạy hiện tại, hoặc được thu thập cho một lượt tiếp theo.

- Cấu hình qua `messages.queue` (và `messages.queue.byChannel`).
- Chế độ mặc định là `steer`, với chống dội followup 500ms khi điều hướng rơi về gửi followup đã xếp hàng.
- Các chế độ: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, và chế độ cũ từng tin một `queue`.

Chi tiết: [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Quyền sở hữu lượt chạy của kênh

Plugin kênh có thể giữ thứ tự, chống dội đầu vào và áp dụng áp lực ngược của transport trước khi một tin nhắn đi vào hàng đợi phiên. Chúng không nên áp một timeout riêng quanh chính lượt agent. Khi một tin nhắn được định tuyến đến một phiên, công việc chạy lâu sẽ do vòng đời phiên, công cụ và runtime chi phối để mọi kênh báo cáo và phục hồi nhất quán từ các lượt chậm.

## Phát trực tuyến, chia đoạn và gom lô

Phát trực tuyến khối gửi phản hồi một phần khi mô hình tạo ra các khối văn bản. Chia đoạn tôn trọng giới hạn văn bản của kênh và tránh tách code fence.

Các thiết lập chính:

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định tắt)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (gom lô dựa trên thời gian rảnh)
- `agents.defaults.humanDelay` (tạm dừng giống con người giữa các phản hồi khối)
- Ghi đè theo kênh: `*.blockStreaming` và `*.blockStreamingCoalesce` (các kênh không phải Telegram yêu cầu đặt rõ `*.blockStreaming: true`)

Chi tiết: [Phát trực tuyến + chia đoạn](/vi/concepts/streaming).

## Hiển thị suy luận và token

OpenClaw có thể hiển thị hoặc ẩn suy luận của mô hình:

- `/reasoning on|off|stream` điều khiển khả năng hiển thị.
- Nội dung suy luận vẫn được tính vào mức sử dụng token khi được mô hình tạo ra.
- Telegram hỗ trợ stream suy luận vào một bong bóng nháp tạm thời, bị xóa sau khi gửi cuối cùng; dùng `/reasoning on` để có đầu ra suy luận bền.

Chi tiết: [Chỉ thị suy nghĩ + suy luận](/vi/tools/thinking) và [Mức dùng token](/vi/reference/token-use).

## Tiền tố, luồng và phản hồi

Định dạng tin nhắn gửi đi được tập trung trong `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, và `channels.<channel>.accounts.<id>.responsePrefix` (chuỗi phân tầng tiền tố gửi đi), cộng với `channels.whatsapp.messagePrefix` (tiền tố tin nhắn đến của WhatsApp)
- Tạo luồng phản hồi qua `replyToMode` và mặc định theo kênh

Chi tiết: [Cấu hình](/vi/gateway/config-agents#messages) và tài liệu kênh.

## Phản hồi im lặng

Token im lặng chính xác `NO_REPLY` / `no_reply` có nghĩa là "không gửi phản hồi hiển thị với người dùng".
Khi một lượt cũng có media công cụ đang chờ, chẳng hạn âm thanh TTS đã tạo, OpenClaw loại bỏ văn bản im lặng nhưng vẫn gửi tệp media đính kèm.
OpenClaw phân giải hành vi đó theo loại cuộc hội thoại:

- Cuộc hội thoại trực tiếp mặc định không cho phép im lặng và viết lại một phản hồi chỉ có token im lặng thành một dự phòng ngắn có thể nhìn thấy.
- Nhóm/kênh mặc định cho phép im lặng.
- Điều phối nội bộ mặc định cho phép im lặng.

OpenClaw cũng dùng phản hồi im lặng cho các lỗi runner nội bộ xảy ra trước bất kỳ phản hồi assistant nào trong chat không trực tiếp, để nhóm/kênh không thấy phần văn bản mẫu lỗi Gateway. Chat trực tiếp mặc định hiển thị nội dung lỗi gọn; chi tiết runner thô chỉ hiển thị khi `/verbose` là `on` hoặc `full`.

Mặc định nằm dưới `agents.defaults.silentReply` và `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` và `surfaces.<id>.silentReplyRewrite` có thể ghi đè chúng theo từng surface.

Khi phiên cha có một hoặc nhiều lượt subagent đã sinh đang chờ, phản hồi im lặng trần sẽ bị bỏ trên mọi surface thay vì được viết lại, để phiên cha giữ im lặng cho đến khi sự kiện hoàn tất của con gửi phản hồi thật.

## Liên quan

- [Tái cấu trúc vòng đời tin nhắn](/vi/concepts/message-lifecycle-refactor) - thiết kế gửi và nhận bền vững mục tiêu
- [Phát trực tuyến](/vi/concepts/streaming) — gửi tin nhắn thời gian thực
- [Thử lại](/vi/concepts/retry) — hành vi thử lại khi gửi tin nhắn
- [Hàng đợi](/vi/concepts/queue) — hàng đợi xử lý tin nhắn
- [Kênh](/vi/channels) — tích hợp nền tảng nhắn tin
