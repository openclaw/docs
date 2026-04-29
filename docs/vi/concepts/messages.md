---
read_when:
    - Giải thích cách các tin nhắn đến trở thành phản hồi
    - Làm rõ các phiên, chế độ xếp hàng hoặc hành vi truyền phát
    - Ghi lại khả năng hiển thị lập luận và các hệ quả về mức sử dụng
summary: Luồng tin nhắn, phiên, hàng đợi và khả năng hiển thị quá trình suy luận
title: Tin nhắn
x-i18n:
    generated_at: "2026-04-29T22:38:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32e11bec46190e37fa6ce13ff876fe7c04299ae16a3690e5bbfac1d308071660
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

Các nút điều chỉnh chính nằm trong cấu hình:

- `messages.*` cho tiền tố, xếp hàng và hành vi nhóm.
- `agents.defaults.*` cho mặc định block streaming và chunking.
- Ghi đè theo kênh (`channels.whatsapp.*`, `channels.telegram.*`, v.v.) cho giới hạn và bật/tắt streaming.

Xem [Cấu hình](/vi/gateway/configuration) để biết schema đầy đủ.

## Khử trùng lặp tin nhắn đến

Các kênh có thể gửi lại cùng một tin nhắn sau khi kết nối lại. OpenClaw duy trì một
bộ nhớ đệm ngắn hạn được định khóa theo kênh/tài khoản/peer/phiên/id tin nhắn để các lần
gửi trùng lặp không kích hoạt thêm một lượt chạy agent khác.

## Debounce tin nhắn đến

Các tin nhắn liên tiếp nhanh từ **cùng một người gửi** có thể được gom thành một
lượt agent duy nhất thông qua `messages.inbound`. Debounce được giới hạn theo từng kênh + cuộc trò chuyện
và dùng tin nhắn gần nhất cho threading/ID phản hồi.

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
- Lệnh điều khiển bỏ qua debounce để chúng vẫn đứng riêng lẻ — **ngoại trừ** khi một kênh chủ động chọn gom DM cùng người gửi (ví dụ [BlueBubbles `coalesceSameSenderDms`](/vi/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), trong đó lệnh DM chờ trong cửa sổ debounce để payload gửi tách có thể tham gia cùng một lượt agent.

## Phiên và thiết bị

Phiên do Gateway sở hữu, không phải client.

- Chat trực tiếp được gộp vào khóa phiên chính của agent.
- Nhóm/kênh có khóa phiên riêng.
- Kho phiên và transcript nằm trên máy chủ Gateway.

Nhiều thiết bị/kênh có thể ánh xạ đến cùng một phiên, nhưng lịch sử không được
đồng bộ đầy đủ ngược lại mọi client. Khuyến nghị: dùng một thiết bị chính cho các
cuộc trò chuyện dài để tránh ngữ cảnh phân kỳ. Control UI và TUI luôn hiển thị
transcript phiên do Gateway hậu thuẫn, nên chúng là nguồn sự thật.

Chi tiết: [Quản lý phiên](/vi/concepts/session).

## Metadata kết quả công cụ

`content` của kết quả công cụ là kết quả mà model nhìn thấy. `details` của kết quả công cụ là
metadata runtime cho render UI, chẩn đoán, gửi media và Plugin.

OpenClaw giữ ranh giới đó rõ ràng:

- `toolResult.details` bị loại bỏ trước khi provider replay và đầu vào compaction.
- Transcript phiên được lưu chỉ giữ `details` có giới hạn; metadata quá lớn
  được thay bằng một tóm tắt gọn có đánh dấu `persistedDetailsTruncated: true`.
- Plugin và công cụ nên đặt văn bản mà model phải đọc trong `content`, không chỉ
  trong `details`.

## Nội dung tin nhắn đến và ngữ cảnh lịch sử

OpenClaw tách **nội dung prompt** khỏi **nội dung lệnh**:

- `Body`: văn bản prompt gửi tới agent. Phần này có thể bao gồm envelope của kênh và
  các wrapper lịch sử tùy chọn.
- `CommandBody`: văn bản thô của người dùng để phân tích directive/lệnh.
- `RawBody`: alias legacy cho `CommandBody` (giữ để tương thích).

Khi một kênh cung cấp lịch sử, nó dùng wrapper chung:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Đối với **chat không trực tiếp** (nhóm/kênh/phòng), **nội dung tin nhắn hiện tại** được thêm tiền tố bằng
nhãn người gửi (cùng kiểu dùng cho các mục lịch sử). Điều này giữ cho tin nhắn thời gian thực và tin nhắn xếp hàng/lịch sử
nhất quán trong prompt của agent.

Bộ đệm lịch sử là **chỉ pending**: chúng bao gồm tin nhắn nhóm _không_
kích hoạt lượt chạy (ví dụ, tin nhắn bị chặn bởi điều kiện mention) và **loại trừ** tin nhắn
đã có trong transcript phiên.

Việc loại bỏ directive chỉ áp dụng cho phần **tin nhắn hiện tại** để lịch sử
vẫn nguyên vẹn. Các kênh bọc lịch sử nên đặt `CommandBody` (hoặc
`RawBody`) thành văn bản tin nhắn gốc và giữ `Body` là prompt đã kết hợp.
Bộ đệm lịch sử có thể cấu hình qua `messages.groupChat.historyLimit` (mặc định
toàn cục) và các ghi đè theo kênh như `channels.slack.historyLimit` hoặc
`channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Xếp hàng và followup

Nếu một lượt chạy đang hoạt động, tin nhắn đến có thể được xếp hàng, điều hướng vào
lượt chạy hiện tại, hoặc thu thập cho một lượt followup.

- Cấu hình qua `messages.queue` (và `messages.queue.byChannel`).
- Chế độ mặc định là `steer`, với debounce followup 500ms khi việc điều hướng rơi
  về gửi followup đã xếp hàng.
- Chế độ: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, và
  alias legacy `queue`.

Chi tiết: [Hàng đợi lệnh](/vi/concepts/queue).

## Quyền sở hữu lượt chạy của kênh

Plugin kênh có thể duy trì thứ tự, debounce đầu vào và áp dụng backpressure
transport trước khi tin nhắn đi vào hàng đợi phiên. Chúng không nên áp đặt
timeout riêng quanh chính lượt agent. Sau khi tin nhắn được định tuyến đến một
phiên, công việc chạy lâu được quản lý bởi vòng đời phiên, công cụ và runtime
để mọi kênh báo cáo và phục hồi nhất quán từ các lượt chậm.

## Streaming, chunking và batching

Block streaming gửi phản hồi từng phần khi model tạo ra các khối văn bản.
Chunking tôn trọng giới hạn văn bản của kênh và tránh tách fenced code.

Thiết lập chính:

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định tắt)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching dựa trên thời gian nhàn rỗi)
- `agents.defaults.humanDelay` (khoảng dừng giống con người giữa các phản hồi khối)
- Ghi đè theo kênh: `*.blockStreaming` và `*.blockStreamingCoalesce` (các kênh không phải Telegram yêu cầu đặt rõ `*.blockStreaming: true`)

Chi tiết: [Streaming + chunking](/vi/concepts/streaming).

## Hiển thị reasoning và token

OpenClaw có thể hiển thị hoặc ẩn reasoning của model:

- `/reasoning on|off|stream` điều khiển khả năng hiển thị.
- Nội dung reasoning vẫn được tính vào mức sử dụng token khi được model tạo ra.
- Telegram hỗ trợ stream reasoning vào bong bóng bản nháp.

Chi tiết: [Directive thinking + reasoning](/vi/tools/thinking) và [Sử dụng token](/vi/reference/token-use).

## Tiền tố, threading và phản hồi

Định dạng tin nhắn gửi đi được tập trung trong `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, và `channels.<channel>.accounts.<id>.responsePrefix` (chuỗi cascade tiền tố gửi đi), cộng với `channels.whatsapp.messagePrefix` (tiền tố tin nhắn đến của WhatsApp)
- Threading phản hồi qua `replyToMode` và mặc định theo kênh

Chi tiết: [Cấu hình](/vi/gateway/config-agents#messages) và tài liệu kênh.

## Phản hồi im lặng

Token im lặng chính xác `NO_REPLY` / `no_reply` nghĩa là “không gửi phản hồi hiển thị cho người dùng”.
Khi một lượt cũng có media công cụ đang chờ, chẳng hạn audio TTS được tạo, OpenClaw
loại bỏ văn bản im lặng nhưng vẫn gửi tệp đính kèm media.
OpenClaw phân giải hành vi đó theo loại cuộc trò chuyện:

- Cuộc trò chuyện trực tiếp mặc định không cho phép im lặng và viết lại một phản hồi
  im lặng trần thành một fallback ngắn hiển thị được.
- Nhóm/kênh mặc định cho phép im lặng.
- Điều phối nội bộ mặc định cho phép im lặng.

OpenClaw cũng dùng phản hồi im lặng cho lỗi runner nội bộ xảy ra
trước bất kỳ phản hồi assistant nào trong chat không trực tiếp, để nhóm/kênh không thấy
văn bản lỗi Gateway mặc định. Chat trực tiếp mặc định hiển thị nội dung lỗi ngắn gọn;
chi tiết runner thô chỉ được hiển thị khi `/verbose` là `on` hoặc `full`.

Mặc định nằm dưới `agents.defaults.silentReply` và
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` và
`surfaces.<id>.silentReplyRewrite` có thể ghi đè chúng theo từng surface.

Khi phiên cha có một hoặc nhiều lượt subagent được spawn đang chờ, các phản hồi
im lặng trần bị bỏ trên mọi surface thay vì được viết lại, để phiên
cha giữ im lặng cho đến khi sự kiện hoàn tất của con gửi phản hồi thật.

## Liên quan

- [Streaming](/vi/concepts/streaming) — gửi tin nhắn theo thời gian thực
- [Thử lại](/vi/concepts/retry) — hành vi thử lại gửi tin nhắn
- [Hàng đợi](/vi/concepts/queue) — hàng đợi xử lý tin nhắn
- [Kênh](/vi/channels) — tích hợp nền tảng nhắn tin
