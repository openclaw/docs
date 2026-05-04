---
read_when:
    - Giải thích cách các tin nhắn đến trở thành phản hồi
    - Làm rõ các phiên, chế độ xếp hàng hoặc hành vi truyền phát
    - Tài liệu hóa khả năng hiển thị lập luận và các hệ quả sử dụng
summary: Luồng tin nhắn, phiên, hàng đợi và khả năng hiển thị quá trình suy luận
title: Tin nhắn
x-i18n:
    generated_at: "2026-05-04T07:03:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw xử lý tin nhắn đến thông qua một pipeline gồm phân giải phiên, xếp hàng, streaming, thực thi công cụ và hiển thị reasoning. Trang này mô tả đường đi từ tin nhắn đến đến phản hồi.

## Luồng tin nhắn (cấp cao)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Các nút điều chỉnh chính nằm trong cấu hình:

- `messages.*` cho tiền tố, xếp hàng và hành vi nhóm.
- `agents.defaults.*` cho mặc định block streaming và chunking.
- Ghi đè theo kênh (`channels.whatsapp.*`, `channels.telegram.*`, v.v.) cho giới hạn và công tắc streaming.

Xem [Cấu hình](/vi/gateway/configuration) để biết schema đầy đủ.

## Khử trùng lặp tin nhắn đến

Các kênh có thể gửi lại cùng một tin nhắn sau khi kết nối lại. OpenClaw giữ một
bộ nhớ đệm tồn tại ngắn hạn, được định danh theo channel/account/peer/session/message id để các lần
phân phối trùng lặp không kích hoạt thêm một lần chạy agent khác.

## Debounce tin nhắn đến

Các tin nhắn liên tiếp nhanh từ **cùng một người gửi** có thể được gom vào một
lượt agent duy nhất qua `messages.inbound`. Debounce được giới hạn theo từng kênh + cuộc trò chuyện
và dùng tin nhắn mới nhất cho threading/ID phản hồi.

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

- Debounce áp dụng cho tin nhắn **chỉ có văn bản**; media/tệp đính kèm được flush ngay lập tức.
- Lệnh điều khiển bỏ qua debounce để chúng vẫn độc lập — **ngoại trừ** khi một kênh chủ động bật gộp DM cùng người gửi (ví dụ [BlueBubbles `coalesceSameSenderDms`](/vi/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), khi đó các lệnh DM sẽ chờ trong cửa sổ debounce để payload gửi tách có thể nhập vào cùng lượt agent.

## Phiên và thiết bị

Phiên thuộc sở hữu của gateway, không phải của client.

- Chat trực tiếp được gộp vào khóa phiên chính của agent.
- Nhóm/kênh có khóa phiên riêng.
- Kho lưu trữ phiên và transcript nằm trên máy chủ gateway.

Nhiều thiết bị/kênh có thể ánh xạ tới cùng một phiên, nhưng lịch sử không được
đồng bộ đầy đủ ngược lại mọi client. Khuyến nghị: dùng một thiết bị chính cho các
cuộc trò chuyện dài để tránh ngữ cảnh phân kỳ. Control UI và TUI luôn hiển thị
transcript phiên được gateway hỗ trợ, nên chúng là nguồn sự thật.

Chi tiết: [Quản lý phiên](/vi/concepts/session).

## Siêu dữ liệu kết quả công cụ

`content` của kết quả công cụ là kết quả mà mô hình nhìn thấy. `details` của kết quả công cụ là
siêu dữ liệu runtime cho việc render UI, chẩn đoán, phân phối media và Plugin.

OpenClaw giữ ranh giới đó rõ ràng:

- `toolResult.details` bị loại bỏ trước khi phát lại provider và đầu vào Compaction.
- Transcript phiên được lưu chỉ giữ `details` có giới hạn; siêu dữ liệu quá lớn
  được thay bằng một tóm tắt gọn có đánh dấu `persistedDetailsTruncated: true`.
- Plugin và công cụ nên đặt văn bản mà mô hình phải đọc trong `content`, không chỉ
  trong `details`.

## Nội dung tin nhắn đến và ngữ cảnh lịch sử

OpenClaw tách **thân prompt** khỏi **thân lệnh**:

- `BodyForAgent`: văn bản chính hướng tới mô hình cho tin nhắn hiện tại. Plugin
  kênh nên giữ phần này tập trung vào văn bản hiện tại có chứa prompt của người gửi.
- `Body`: fallback prompt kế thừa. Phần này có thể bao gồm envelope của kênh và
  wrapper lịch sử tùy chọn, nhưng các kênh hiện tại không nên dựa vào nó làm
  đầu vào mô hình chính khi có `BodyForAgent`.
- `CommandBody`: văn bản thô của người dùng để phân tích chỉ thị/lệnh.
- `RawBody`: alias kế thừa cho `CommandBody` (giữ để tương thích).

Khi một kênh cung cấp lịch sử, nó dùng một wrapper dùng chung:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Với **chat không trực tiếp** (nhóm/kênh/phòng), **thân tin nhắn hiện tại** được thêm tiền tố bằng
nhãn người gửi (cùng kiểu dùng cho các mục lịch sử). Điều này giữ cho tin nhắn thời gian thực và tin nhắn xếp hàng/lịch sử
nhất quán trong prompt của agent.

Bộ đệm lịch sử là **chỉ các mục đang chờ**: chúng bao gồm tin nhắn nhóm _không_
kích hoạt lần chạy (ví dụ: tin nhắn bị chặn bởi yêu cầu nhắc đến) và **loại trừ** các tin nhắn
đã có trong transcript phiên.

Việc loại bỏ chỉ thị chỉ áp dụng cho phần **tin nhắn hiện tại** để lịch sử
vẫn nguyên vẹn. Các kênh bọc lịch sử nên đặt `CommandBody` (hoặc
`RawBody`) thành văn bản tin nhắn gốc và giữ `Body` là prompt kết hợp.
Lịch sử có cấu trúc, phản hồi, tin nhắn chuyển tiếp và siêu dữ liệu kênh được render thành
các khối ngữ cảnh không tin cậy với vai trò người dùng trong quá trình lắp ráp prompt.
Bộ đệm lịch sử có thể cấu hình qua `messages.groupChat.historyLimit` (mặc định
toàn cục) và các ghi đè theo kênh như `channels.slack.historyLimit` hoặc
`channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Xếp hàng và followup

Nếu một lần chạy đã đang hoạt động, tin nhắn đến có thể được xếp hàng, được điều hướng vào
lần chạy hiện tại, hoặc được thu thập cho một lượt followup.

- Cấu hình qua `messages.queue` (và `messages.queue.byChannel`).
- Chế độ mặc định là `steer`, với debounce followup 500ms khi điều hướng rơi về
  phân phối followup đã xếp hàng.
- Các chế độ: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, và
  chế độ kế thừa từng tin một `queue`.

Chi tiết: [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Quyền sở hữu lần chạy của kênh

Plugin kênh có thể giữ thứ tự, debounce đầu vào và áp dụng backpressure truyền tải
trước khi một tin nhắn đi vào hàng đợi phiên. Chúng không nên áp đặt một timeout
riêng quanh chính lượt agent. Khi một tin nhắn được định tuyến tới một
phiên, công việc chạy lâu được quản lý bởi lifecycle của phiên, công cụ và runtime
để mọi kênh báo cáo và phục hồi nhất quán khỏi các lượt chậm.

## Streaming, chunking và batching

Block streaming gửi phản hồi từng phần khi mô hình tạo ra các khối văn bản.
Chunking tôn trọng giới hạn văn bản của kênh và tránh tách fenced code.

Thiết lập chính:

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định tắt)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching dựa trên trạng thái nhàn rỗi)
- `agents.defaults.humanDelay` (khoảng dừng giống con người giữa các phản hồi dạng khối)
- Ghi đè theo kênh: `*.blockStreaming` và `*.blockStreamingCoalesce` (các kênh không phải Telegram yêu cầu đặt rõ `*.blockStreaming: true`)

Chi tiết: [Streaming + chunking](/vi/concepts/streaming).

## Hiển thị reasoning và token

OpenClaw có thể hiển thị hoặc ẩn reasoning của mô hình:

- `/reasoning on|off|stream` điều khiển khả năng hiển thị.
- Nội dung reasoning vẫn được tính vào mức sử dụng token khi do mô hình tạo ra.
- Telegram hỗ trợ stream reasoning vào một bong bóng bản nháp tạm thời, bị xóa sau khi phân phối cuối cùng; dùng `/reasoning on` để có đầu ra reasoning bền vững.

Chi tiết: [Chỉ thị suy nghĩ + reasoning](/vi/tools/thinking) và [Sử dụng token](/vi/reference/token-use).

## Tiền tố, threading và phản hồi

Định dạng tin nhắn đi được tập trung trong `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, và `channels.<channel>.accounts.<id>.responsePrefix` (chuỗi phân tầng tiền tố đi), cộng với `channels.whatsapp.messagePrefix` (tiền tố tin nhắn đến của WhatsApp)
- Threading phản hồi qua `replyToMode` và mặc định theo kênh

Chi tiết: [Cấu hình](/vi/gateway/config-agents#messages) và tài liệu kênh.

## Phản hồi im lặng

Token im lặng chính xác `NO_REPLY` / `no_reply` có nghĩa là “không gửi phản hồi hiển thị cho người dùng”.
Khi một lượt cũng có media công cụ đang chờ, chẳng hạn âm thanh TTS được tạo, OpenClaw
loại bỏ văn bản im lặng nhưng vẫn gửi tệp đính kèm media.
OpenClaw phân giải hành vi đó theo loại cuộc trò chuyện:

- Cuộc trò chuyện trực tiếp mặc định không cho phép im lặng và viết lại một phản hồi
  chỉ gồm token im lặng thành một fallback ngắn hiển thị được.
- Nhóm/kênh mặc định cho phép im lặng.
- Điều phối nội bộ mặc định cho phép im lặng.

OpenClaw cũng dùng phản hồi im lặng cho lỗi runner nội bộ xảy ra
trước bất kỳ phản hồi assistant nào trong chat không trực tiếp, để nhóm/kênh không thấy
boilerplate lỗi gateway. Chat trực tiếp mặc định hiển thị nội dung lỗi ngắn gọn;
chi tiết runner thô chỉ được hiển thị khi `/verbose` là `on` hoặc `full`.

Mặc định nằm dưới `agents.defaults.silentReply` và
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` và
`surfaces.<id>.silentReplyRewrite` có thể ghi đè chúng theo từng surface.

Khi phiên cha có một hoặc nhiều lần chạy subagent được spawn đang chờ, các
phản hồi im lặng đơn thuần bị bỏ trên mọi surface thay vì được viết lại, để
phiên cha giữ im lặng cho đến khi sự kiện hoàn tất của con gửi phản hồi thật.

## Liên quan

- [Streaming](/vi/concepts/streaming) — phân phối tin nhắn thời gian thực
- [Thử lại](/vi/concepts/retry) — hành vi thử lại khi phân phối tin nhắn
- [Hàng đợi](/vi/concepts/queue) — hàng đợi xử lý tin nhắn
- [Kênh](/vi/channels) — tích hợp nền tảng nhắn tin
