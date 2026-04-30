---
read_when:
    - Thay đổi cách thực thi hoặc tính đồng thời của tự động trả lời
    - Giải thích các chế độ /queue hoặc hành vi điều hướng tin nhắn
summary: Các chế độ hàng đợi tự động trả lời, giá trị mặc định và ghi đè theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-04-30T09:36:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Chúng tôi tuần tự hóa các lượt chạy tự động trả lời đến (mọi kênh) qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lượt chạy agent va chạm nhau, đồng thời vẫn cho phép xử lý song song an toàn giữa các phiên.

## Lý do

- Các lượt chạy tự động trả lời có thể tốn kém (lệnh gọi LLM) và có thể va chạm khi nhiều tin nhắn đến gần như cùng lúc.
- Tuần tự hóa giúp tránh tranh chấp tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm khả năng gặp giới hạn tốc độ từ upstream.

## Cách hoạt động

- Một hàng đợi FIFO nhận biết lane sẽ xả từng lane với giới hạn đồng thời có thể cấu hình (mặc định là 1 cho các lane chưa cấu hình; main mặc định là 4, subagent là 8).
- `runEmbeddedPiAgent` đưa vào hàng đợi theo **khóa phiên** (lane `session:<key>`) để bảo đảm mỗi phiên chỉ có một lượt chạy đang hoạt động.
- Sau đó, mỗi lượt chạy phiên được đưa vào một **lane toàn cục** (`main` theo mặc định) để mức song song tổng thể được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lượt chạy trong hàng đợi sẽ phát một thông báo ngắn nếu đã chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (khi kênh hỗ trợ), nên trải nghiệm người dùng không đổi trong lúc chờ đến lượt.

## Mặc định

Khi chưa đặt, mọi bề mặt kênh đến dùng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` là mặc định vì nó giữ lượt mô hình đang hoạt động phản hồi nhanh mà không
khởi động lượt chạy phiên thứ hai. Nó xả tất cả tin nhắn điều hướng đã đến
trước ranh giới mô hình tiếp theo. Nếu lượt chạy hiện tại không thể nhận điều hướng,
OpenClaw sẽ quay về một mục hàng đợi followup.

## Chế độ hàng đợi

Tin nhắn đến có thể điều hướng lượt chạy hiện tại, chờ một lượt followup, hoặc cả hai:

- `steer`: đưa tin nhắn điều hướng vào runtime đang hoạt động. Pi chuyển tất cả tin nhắn điều hướng đang chờ **sau khi lượt assistant hiện tại thực thi xong các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo; Codex app-server nhận một `turn/steer` được gom lô. Nếu lượt chạy không chủ động streaming hoặc không hỗ trợ điều hướng, OpenClaw sẽ quay về một mục hàng đợi followup.
- `queue` (cũ): điều hướng từng tin nhắn một kiểu cũ. Pi chuyển một tin nhắn điều hướng trong hàng đợi tại mỗi ranh giới mô hình; Codex app-server nhận các yêu cầu `turn/steer` riêng biệt. Ưu tiên `steer` trừ khi bạn cần hành vi tuần tự hóa trước đây.
- `followup`: đưa từng tin nhắn vào hàng đợi cho một lượt agent về sau sau khi lượt chạy hiện tại kết thúc.
- `collect`: gộp các tin nhắn trong hàng đợi thành một lượt followup **duy nhất** sau khoảng lặng. Nếu tin nhắn nhắm đến các kênh/luồng khác nhau, chúng được xả riêng để giữ đúng định tuyến.
- `steer-backlog` (còn gọi là `steer+backlog`): điều hướng ngay **và** giữ cùng tin nhắn đó cho một lượt followup.
- `interrupt` (cũ): hủy lượt chạy đang hoạt động cho phiên đó, rồi chạy tin nhắn mới nhất.

Steer-backlog nghĩa là bạn có thể nhận một phản hồi followup sau lượt chạy đã được điều hướng, nên
các bề mặt streaming có thể trông như bị trùng lặp. Ưu tiên `collect`/`steer` nếu bạn muốn
một phản hồi cho mỗi tin nhắn đến.

Để biết thời điểm và hành vi phụ thuộc theo từng runtime, xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Cấu hình toàn cục hoặc theo kênh qua `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Tùy chọn hàng đợi

Các tùy chọn áp dụng cho `followup`, `collect`, và `steer-backlog` (và cho `steer` hoặc `queue` cũ khi điều hướng quay về followup):

- `debounceMs`: khoảng lặng trước khi xả các followup trong hàng đợi. Số thuần là mili giây; các đơn vị `ms`, `s`, `m`, `h`, và `d` được tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa trong hàng đợi mỗi phiên. Giá trị dưới `1` bị bỏ qua.
- `drop: "summarize"`: mặc định. Bỏ các mục cũ nhất trong hàng đợi khi cần, giữ bản tóm tắt gọn, và chèn chúng như một prompt followup tổng hợp.
- `drop: "old"`: bỏ các mục cũ nhất trong hàng đợi khi cần, không giữ bản tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải:

1. Ghi đè `/queue` nội tuyến hoặc đã lưu cho từng phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Mặc định `steer`.

Đối với tùy chọn, các tùy chọn `/queue` nội tuyến hoặc đã lưu thắng cấu hình. Sau đó
debounce theo kênh (`messages.queue.debounceMsByChannel`), mặc định debounce của plugin,
các tùy chọn `messages.queue` toàn cục, và mặc định tích hợp sẵn được
áp dụng. `cap` và `drop` là tùy chọn toàn cục/phiên, không phải khóa cấu hình theo kênh.

## Ghi đè theo phiên

- Gửi `/queue <mode>` dưới dạng lệnh độc lập để lưu chế độ cho phiên hiện tại.
- Có thể kết hợp các tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè của phiên.

## Phạm vi và bảo đảm

- Áp dụng cho các lượt chạy agent tự động trả lời trên mọi kênh đến dùng pipeline trả lời của Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Lane mặc định (`main`) là toàn tiến trình cho inbound + Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại các lane bổ sung (ví dụ `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn trả lời đến. Các lượt agent Cron cô lập giữ một slot `cron` trong khi phần thực thi agent bên trong dùng `cron-nested`; cả hai dùng `cron.maxConcurrentRuns`. Các luồng `nested` không phải Cron và dùng chung giữ hành vi lane riêng. Các lượt chạy tách rời này được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).
- Lane theo phiên bảo đảm tại một thời điểm chỉ có một lượt chạy agent chạm vào một phiên nhất định.
- Không có phụ thuộc bên ngoài hoặc luồng worker nền; chỉ TypeScript + promises thuần.

## Khắc phục sự cố

- Nếu các lệnh có vẻ bị kẹt, bật nhật ký chi tiết và tìm các dòng “queued for …ms” để xác nhận hàng đợi đang xả.
- Nếu bạn cần độ sâu hàng đợi, bật nhật ký chi tiết và theo dõi các dòng thời gian hàng đợi.
- Khi bật chẩn đoán, các phiên còn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` sẽ ghi cảnh báo phiên bị kẹt. Các lượt chạy nhúng đang hoạt động, thao tác trả lời đang hoạt động, và tác vụ lane đang hoạt động mặc định vẫn chỉ cảnh báo; sổ sách khởi động đã cũ mà không có công việc phiên đang hoạt động có thể nhả lane phiên bị ảnh hưởng để công việc trong hàng đợi được xả.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Chính sách thử lại](/vi/concepts/retry)
