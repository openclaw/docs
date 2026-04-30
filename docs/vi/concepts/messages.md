---
read_when:
    - Giải thích cách tin nhắn đến trở thành phản hồi
    - Làm rõ các phiên, chế độ xếp hàng hoặc hành vi truyền phát luồng
    - Ghi tài liệu về khả năng hiển thị suy luận và các tác động khi sử dụng
summary: Luồng thông điệp, phiên, xếp hàng và khả năng hiển thị quá trình lập luận
title: Tin nhắn
x-i18n:
    generated_at: "2026-04-30T09:35:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw xử lý tin nhắn đến thông qua một pipeline gồm phân giải phiên, xếp hàng, phát trực tuyến, thực thi công cụ và hiển thị suy luận. Trang này mô tả đường đi từ tin nhắn đến đến phản hồi.

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
- `agents.defaults.*` cho mặc định phát trực tuyến theo khối và chia đoạn.
- Ghi đè theo kênh (`channels.whatsapp.*`, `channels.telegram.*`, v.v.) cho giới hạn và bật/tắt phát trực tuyến.

Xem [Cấu hình](/vi/gateway/configuration) để biết lược đồ đầy đủ.

## Khử trùng lặp tin nhắn đến

Các kênh có thể gửi lại cùng một tin nhắn sau khi kết nối lại. OpenClaw giữ một bộ nhớ đệm ngắn hạn được khóa theo kênh/tài khoản/đối tượng ngang hàng/phiên/id tin nhắn để các lần gửi trùng lặp không kích hoạt một lượt chạy agent khác.

## Chống dội tin nhắn đến

Các tin nhắn liên tiếp nhanh từ **cùng một người gửi** có thể được gom vào một lượt agent duy nhất thông qua `messages.inbound`. Chống dội được giới hạn theo từng kênh + cuộc trò chuyện và sử dụng tin nhắn mới nhất cho luồng phản hồi/id.

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

- Chống dội áp dụng cho tin nhắn **chỉ có văn bản**; phương tiện/tệp đính kèm được xả ngay lập tức.
- Lệnh điều khiển bỏ qua chống dội để chúng vẫn độc lập — **ngoại trừ** khi một kênh chủ động chọn gom DM từ cùng người gửi (ví dụ [BlueBubbles `coalesceSameSenderDms`](/vi/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), khi đó lệnh DM chờ trong cửa sổ chống dội để payload gửi tách rời có thể nhập vào cùng một lượt agent.

## Phiên và thiết bị

Phiên thuộc sở hữu của Gateway, không phải của client.

- Trò chuyện trực tiếp được gộp vào khóa phiên chính của agent.
- Nhóm/kênh có khóa phiên riêng.
- Kho phiên và bản ghi hội thoại nằm trên máy chủ Gateway.

Nhiều thiết bị/kênh có thể ánh xạ tới cùng một phiên, nhưng lịch sử không được đồng bộ đầy đủ trở lại mọi client. Khuyến nghị: dùng một thiết bị chính cho các cuộc trò chuyện dài để tránh ngữ cảnh phân kỳ. Control UI và TUI luôn hiển thị bản ghi phiên do Gateway hậu thuẫn, nên chúng là nguồn sự thật.

Chi tiết: [Quản lý phiên](/vi/concepts/session).

## Siêu dữ liệu kết quả công cụ

`content` của kết quả công cụ là kết quả mà mô hình nhìn thấy. `details` của kết quả công cụ là siêu dữ liệu runtime cho hiển thị UI, chẩn đoán, phân phối phương tiện và Plugin.

OpenClaw giữ ranh giới đó rõ ràng:

- `toolResult.details` bị loại bỏ trước khi phát lại provider và đầu vào Compaction.
- Bản ghi phiên được lưu bền vững chỉ giữ `details` có giới hạn; siêu dữ liệu quá lớn được thay bằng một tóm tắt gọn được đánh dấu `persistedDetailsTruncated: true`.
- Plugin và công cụ nên đặt văn bản mà mô hình phải đọc trong `content`, không chỉ trong `details`.

## Nội dung tin nhắn đến và ngữ cảnh lịch sử

OpenClaw tách **nội dung prompt** khỏi **nội dung lệnh**:

- `Body`: văn bản prompt được gửi tới agent. Phần này có thể bao gồm phong bì kênh và các wrapper lịch sử tùy chọn.
- `CommandBody`: văn bản người dùng thô để phân tích chỉ thị/lệnh.
- `RawBody`: bí danh cũ cho `CommandBody` (được giữ để tương thích).

Khi một kênh cung cấp lịch sử, kênh đó dùng một wrapper dùng chung:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Đối với **trò chuyện không trực tiếp** (nhóm/kênh/phòng), **nội dung tin nhắn hiện tại** được thêm tiền tố bằng nhãn người gửi (cùng kiểu dùng cho các mục lịch sử). Điều này giữ cho các tin nhắn thời gian thực và tin nhắn trong hàng đợi/lịch sử nhất quán trong prompt của agent.

Bộ đệm lịch sử là **chỉ chờ xử lý**: chúng bao gồm các tin nhắn nhóm _không_ kích hoạt lượt chạy (ví dụ tin nhắn bị chặn bởi cổng nhắc đến) và **loại trừ** các tin nhắn đã có trong bản ghi phiên.

Việc loại bỏ chỉ thị chỉ áp dụng cho phần **tin nhắn hiện tại** để lịch sử vẫn nguyên vẹn. Các kênh bọc lịch sử nên đặt `CommandBody` (hoặc `RawBody`) thành văn bản tin nhắn gốc và giữ `Body` là prompt kết hợp. Bộ đệm lịch sử có thể cấu hình qua `messages.groupChat.historyLimit` (mặc định toàn cục) và các ghi đè theo kênh như `channels.slack.historyLimit` hoặc `channels.telegram.accounts.<id>.historyLimit` (đặt `0` để tắt).

## Xếp hàng và lượt tiếp nối

Nếu một lượt chạy đã hoạt động, tin nhắn đến có thể được đưa vào hàng đợi, được điều hướng vào lượt chạy hiện tại, hoặc được thu thập cho một lượt tiếp nối.

- Cấu hình qua `messages.queue` (và `messages.queue.byChannel`).
- Chế độ mặc định là `steer`, với chống dội tiếp nối 500ms khi điều hướng quay về phân phối tiếp nối trong hàng đợi.
- Các chế độ: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, và chế độ cũ từng mục một `queue`.

Chi tiết: [Hàng đợi lệnh](/vi/concepts/queue) và [Hàng đợi điều hướng](/vi/concepts/queue-steering).

## Quyền sở hữu lượt chạy của kênh

Plugin kênh có thể giữ thứ tự, chống dội đầu vào và áp dụng áp lực ngược của tầng truyền tải trước khi một tin nhắn đi vào hàng đợi phiên. Chúng không nên áp đặt thời gian chờ riêng quanh chính lượt agent. Khi một tin nhắn đã được định tuyến tới một phiên, công việc chạy lâu được quản lý bởi vòng đời phiên, công cụ và runtime để mọi kênh báo cáo và phục hồi từ các lượt chậm một cách nhất quán.

## Phát trực tuyến, chia đoạn và gom lô

Phát trực tuyến theo khối gửi phản hồi từng phần khi mô hình tạo các khối văn bản. Chia đoạn tôn trọng giới hạn văn bản của kênh và tránh tách code fence.

Thiết lập chính:

- `agents.defaults.blockStreamingDefault` (`on|off`, mặc định tắt)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (gom lô dựa trên thời gian nhàn rỗi)
- `agents.defaults.humanDelay` (khoảng dừng giống con người giữa các phản hồi theo khối)
- Ghi đè theo kênh: `*.blockStreaming` và `*.blockStreamingCoalesce` (các kênh không phải Telegram yêu cầu đặt rõ `*.blockStreaming: true`)

Chi tiết: [Phát trực tuyến + chia đoạn](/vi/concepts/streaming).

## Hiển thị suy luận và token

OpenClaw có thể hiển thị hoặc ẩn suy luận của mô hình:

- `/reasoning on|off|stream` kiểm soát khả năng hiển thị.
- Nội dung suy luận vẫn được tính vào lượng token sử dụng khi được mô hình tạo ra.
- Telegram hỗ trợ luồng suy luận vào bong bóng nháp.

Chi tiết: [Chỉ thị suy nghĩ + suy luận](/vi/tools/thinking) và [Sử dụng token](/vi/reference/token-use).

## Tiền tố, luồng và phản hồi

Định dạng tin nhắn gửi đi được tập trung trong `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, và `channels.<channel>.accounts.<id>.responsePrefix` (chuỗi kế thừa tiền tố gửi đi), cộng với `channels.whatsapp.messagePrefix` (tiền tố tin nhắn đến của WhatsApp)
- Luồng phản hồi qua `replyToMode` và mặc định theo kênh

Chi tiết: [Cấu hình](/vi/gateway/config-agents#messages) và tài liệu kênh.

## Phản hồi im lặng

Token im lặng chính xác `NO_REPLY` / `no_reply` có nghĩa là “không gửi phản hồi hiển thị cho người dùng”.
Khi một lượt cũng có phương tiện công cụ đang chờ, chẳng hạn âm thanh TTS được tạo, OpenClaw loại bỏ văn bản im lặng nhưng vẫn gửi tệp đính kèm phương tiện.
OpenClaw phân giải hành vi đó theo loại cuộc trò chuyện:

- Cuộc trò chuyện trực tiếp mặc định không cho phép im lặng và viết lại một phản hồi im lặng trần thành một fallback ngắn hiển thị được.
- Nhóm/kênh mặc định cho phép im lặng.
- Điều phối nội bộ mặc định cho phép im lặng.

OpenClaw cũng dùng phản hồi im lặng cho các lỗi runner nội bộ xảy ra trước bất kỳ phản hồi assistant nào trong trò chuyện không trực tiếp, để nhóm/kênh không thấy nội dung lỗi Gateway mẫu. Trò chuyện trực tiếp mặc định hiển thị nội dung lỗi ngắn gọn; chi tiết runner thô chỉ được hiển thị khi `/verbose` là `on` hoặc `full`.

Mặc định nằm dưới `agents.defaults.silentReply` và `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` và `surfaces.<id>.silentReplyRewrite` có thể ghi đè chúng theo từng bề mặt.

Khi phiên cha có một hoặc nhiều lượt subagent được sinh ra đang chờ xử lý, phản hồi im lặng trần bị bỏ trên mọi bề mặt thay vì được viết lại, để phiên cha giữ im lặng cho đến khi sự kiện hoàn tất của phiên con gửi phản hồi thật.

## Liên quan

- [Phát trực tuyến](/vi/concepts/streaming) — phân phối tin nhắn thời gian thực
- [Thử lại](/vi/concepts/retry) — hành vi thử lại phân phối tin nhắn
- [Hàng đợi](/vi/concepts/queue) — hàng đợi xử lý tin nhắn
- [Kênh](/vi/channels) — tích hợp nền tảng nhắn tin
