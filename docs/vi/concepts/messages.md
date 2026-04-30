---
read_when:
    - Giải thích cách tin nhắn đến trở thành phản hồi
    - Làm rõ phiên, chế độ xếp hàng hoặc hành vi truyền phát
    - Ghi lại khả năng hiển thị quá trình lập luận và các tác động đối với việc sử dụng
summary: Luồng tin nhắn, phiên, xếp hàng và khả năng hiển thị quá trình suy luận
title: Tin nhắn
x-i18n:
    generated_at: "2026-04-30T16:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw xử lý tin nhắn đến thông qua một pipeline gồm phân giải phiên, xếp hàng, streaming, thực thi công cụ và hiển thị reasoning. Trang này mô tả đường đi từ tin nhắn đến đến phản hồi.

## Luồng tin nhắn (mức cao)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Các nút cấu hình chính nằm trong phần cấu hình:

- `messages.*` cho tiền tố, xếp hàng và hành vi nhóm.
- `agents.defaults.*` cho mặc định streaming theo khối và chunking.
- Ghi đè theo kênh (`channels.whatsapp.*`, `channels.telegram.*`, v.v.) cho giới hạn và công tắc streaming.

Xem [Cấu hình](/vi/gateway/configuration) để biết schema đầy đủ.

## Khử trùng lặp tin nhắn đến

Các kênh có thể gửi lại cùng một tin nhắn sau khi kết nối lại. OpenClaw giữ một
bộ nhớ đệm ngắn hạn được khóa theo kênh/tài khoản/đối tượng ngang hàng/phiên/id tin nhắn để các lần
gửi trùng lặp không kích hoạt một lần chạy agent khác.

## Chống dội tin nhắn đến

Các tin nhắn liên tiếp nhanh từ **cùng một người gửi** có thể được gom thành một
lượt agent duy nhất qua `messages.inbound`. Chống dội được giới hạn theo từng kênh + cuộc trò chuyện
và dùng tin nhắn mới nhất cho luồng phản hồi/ID.

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

- Chống dội áp dụng cho tin nhắn **chỉ có văn bản**; media/tệp đính kèm được xả ngay lập tức.
- Lệnh điều khiển bỏ qua chống dội để chúng vẫn độc lập — **ngoại trừ** khi một kênh chủ động bật gom DM cùng người gửi (ví dụ [BlueBubbles `coalesceSameSenderDms`](/vi/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), trong đó các lệnh DM chờ trong cửa sổ chống dội để payload gửi tách có thể tham gia cùng lượt agent.

## Phiên và thiết bị

Phiên thuộc sở hữu của Gateway, không thuộc về client.

- Trò chuyện trực tiếp được gộp vào khóa phiên chính của agent.
- Nhóm/kênh có khóa phiên riêng.
- Kho phiên và bản ghi cuộc trò chuyện nằm trên máy chủ Gateway.

Nhiều thiết bị/kênh có thể ánh xạ tới cùng một phiên, nhưng lịch sử không được
đồng bộ đầy đủ trở lại mọi client. Khuyến nghị: dùng một thiết bị chính cho các
cuộc trò chuyện dài để tránh ngữ cảnh bị phân kỳ. Control UI và TUI luôn hiển thị
bản ghi phiên do Gateway hậu thuẫn, nên chúng là nguồn sự thật.

Chi tiết: [Quản lý phiên](/vi/concepts/session).

## Siêu dữ liệu kết quả công cụ

`content` của kết quả công cụ là kết quả hiển thị cho mô hình. `details` của kết quả công cụ là
siêu dữ liệu runtime để render UI, chẩn đoán, gửi media và Plugin.

OpenClaw giữ ranh giới đó rõ ràng:

- `toolResult.details` bị loại bỏ trước khi replay provider và đầu vào Compaction.
- Bản ghi phiên được lưu chỉ giữ `details` có giới hạn; siêu dữ liệu quá lớn
  được thay bằng bản tóm tắt gọn có đánh dấu `persistedDetailsTruncated: true`.
- Plugin và công cụ nên đặt văn bản mà mô hình phải đọc vào `content`, không chỉ
  trong `details`.

## Nội dung tin nhắn đến và ngữ cảnh lịch sử

OpenClaw tách **nội dung prompt** khỏi **nội dung lệnh**:

- `BodyForAgent`: văn bản chính dành cho mô hình của tin nhắn hiện tại. Plugin
  kênh nên giữ phần này tập trung vào văn bản hiện tại mang prompt của người gửi.
- `Body`: phương án dự phòng prompt cũ. Phần này có thể bao gồm vỏ bọc kênh và
  các wrapper lịch sử tùy chọn, nhưng các kênh hiện tại không nên dựa vào nó làm
  đầu vào mô hình chính khi có `BodyForAgent`.
- `CommandBody`: văn bản người dùng thô để phân tích chỉ thị/lệnh.
- `RawBody`: bí danh cũ của `CommandBody` (được giữ để tương thích).

Khi một kênh cung cấp lịch sử, kênh đó dùng wrapper dùng chung:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Đối với **trò chuyện không trực tiếp** (nhóm/kênh/phòng), **nội dung tin nhắn hiện tại** được thêm tiền tố bằng
nhãn người gửi (cùng kiểu dùng cho các mục lịch sử). Điều này giữ cho tin nhắn thời gian thực và tin nhắn trong hàng đợi/lịch sử
nhất quán trong prompt của agent.

Bộ đệm lịch sử là **chỉ pending**: chúng bao gồm các tin nhắn nhóm _không_
kích hoạt một lần chạy (ví dụ: tin nhắn bị chặn bởi yêu cầu nhắc đến) và **loại trừ** các tin nhắn
đã có trong bản ghi phiên.

Việc tách chỉ thị chỉ áp dụng cho phần **tin nhắn hiện tại** để lịch sử
vẫn nguyên vẹn. Các kênh bọc lịch sử nên đặt `CommandBody` (hoặc
`RawBody`) thành văn bản tin nhắn gốc và giữ `Body` là prompt kết hợp.
Lịch sử có cấu trúc, phản hồi, tin chuyển tiếp và siêu dữ liệu kênh được render dưới dạng
khối ngữ cảnh không tin cậy ở vai trò người dùng trong quá trình lắp ráp prompt.
Bộ đệm lịch sử có thể cấu hình qua `messages.groupChat.historyLimit` (mặc định
toàn cục) và các ghi đè theo kênh như `channels.slack.historyLimit` hoặc
`channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Xếp hàng và followup

Nếu một lần chạy đã hoạt động, tin nhắn đến có thể được xếp hàng, điều hướng vào
lần chạy hiện tại, hoặc được thu thập cho một lượt followup.

- Cấu hình qua `messages.queue` (và `messages.queue.byChannel`).
- Chế độ mặc định là `steer`, với chống dội followup 500ms khi điều hướng rơi
  về gửi followup đã xếp hàng.
- Các chế độ: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, và
  chế độ cũ từng mục một `queue`.

Chi tiết: [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Quyền sở hữu lần chạy của kênh

Plugin kênh có thể giữ thứ tự, chống dội đầu vào và áp dụng backpressure
truyền tải trước khi một tin nhắn đi vào hàng đợi phiên. Chúng không nên áp đặt
timeout riêng quanh chính lượt agent. Khi một tin nhắn được định tuyến tới một
phiên, công việc chạy lâu được quản lý bởi vòng đời phiên, công cụ và runtime
để mọi kênh báo cáo và phục hồi từ các lượt chậm một cách nhất quán.

## Streaming, chunking và batching

Streaming theo khối gửi phản hồi từng phần khi mô hình tạo các khối văn bản.
Chunking tôn trọng giới hạn văn bản của kênh và tránh tách fenced code.

Thiết lập chính:

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định tắt)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching dựa trên thời gian nhàn rỗi)
- `agents.defaults.humanDelay` (khoảng dừng giống con người giữa các phản hồi theo khối)
- Ghi đè theo kênh: `*.blockStreaming` và `*.blockStreamingCoalesce` (các kênh không phải Telegram yêu cầu bật rõ ràng `*.blockStreaming: true`)

Chi tiết: [Streaming + chunking](/vi/concepts/streaming).

## Hiển thị reasoning và token

OpenClaw có thể hiển thị hoặc ẩn reasoning của mô hình:

- `/reasoning on|off|stream` kiểm soát khả năng hiển thị.
- Nội dung reasoning vẫn được tính vào mức sử dụng token khi do mô hình tạo ra.
- Telegram hỗ trợ stream reasoning vào bong bóng nháp.

Chi tiết: [Chỉ thị thinking + reasoning](/vi/tools/thinking) và [Sử dụng token](/vi/reference/token-use).

## Tiền tố, luồng và phản hồi

Định dạng tin nhắn gửi ra được tập trung trong `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, và `channels.<channel>.accounts.<id>.responsePrefix` (chuỗi phân tầng tiền tố gửi ra), cùng với `channels.whatsapp.messagePrefix` (tiền tố tin nhắn đến WhatsApp)
- Luồng phản hồi qua `replyToMode` và mặc định theo kênh

Chi tiết: [Cấu hình](/vi/gateway/config-agents#messages) và tài liệu kênh.

## Phản hồi im lặng

Token im lặng chính xác `NO_REPLY` / `no_reply` nghĩa là “không gửi phản hồi hiển thị cho người dùng”.
Khi một lượt cũng có media công cụ đang chờ, chẳng hạn âm thanh TTS được tạo, OpenClaw
loại bỏ văn bản im lặng nhưng vẫn gửi tệp media đính kèm.
OpenClaw phân giải hành vi đó theo loại cuộc trò chuyện:

- Cuộc trò chuyện trực tiếp không cho phép im lặng theo mặc định và viết lại một phản hồi
  im lặng đơn thuần thành một phương án dự phòng ngắn có thể nhìn thấy.
- Nhóm/kênh cho phép im lặng theo mặc định.
- Điều phối nội bộ cho phép im lặng theo mặc định.

OpenClaw cũng dùng phản hồi im lặng cho các lỗi runner nội bộ xảy ra
trước bất kỳ phản hồi assistant nào trong trò chuyện không trực tiếp, để nhóm/kênh không thấy
mẫu lỗi Gateway. Trò chuyện trực tiếp hiển thị nội dung lỗi gọn theo mặc định;
chi tiết runner thô chỉ được hiển thị khi `/verbose` là `on` hoặc `full`.

Mặc định nằm dưới `agents.defaults.silentReply` và
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` và
`surfaces.<id>.silentReplyRewrite` có thể ghi đè chúng theo từng surface.

Khi phiên cha có một hoặc nhiều lần chạy subagent được spawn đang chờ, các phản hồi
im lặng đơn thuần bị bỏ trên mọi surface thay vì được viết lại, để phiên
cha giữ im lặng cho đến khi sự kiện hoàn tất của con gửi phản hồi thật.

## Liên quan

- [Streaming](/vi/concepts/streaming) — gửi tin nhắn theo thời gian thực
- [Thử lại](/vi/concepts/retry) — hành vi thử lại khi gửi tin nhắn
- [Hàng đợi](/vi/concepts/queue) — hàng đợi xử lý tin nhắn
- [Kênh](/vi/channels) — tích hợp nền tảng nhắn tin
