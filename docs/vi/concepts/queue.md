---
read_when:
    - Thay đổi cách thực thi hoặc mức đồng thời của trả lời tự động
    - Giải thích các chế độ /queue hoặc hành vi định hướng tin nhắn
summary: Chế độ hàng đợi tự động trả lời, mặc định và ghi đè theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-04-29T22:39:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59d14a2b8e1b8d5bc1433c0f052869efed42912c9b85cdd79e518633d9919729
    source_path: concepts/queue.md
    workflow: 16
---

Chúng tôi tuần tự hóa các lượt chạy tự động trả lời đến (mọi kênh) thông qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lượt chạy tác nhân va chạm với nhau, đồng thời vẫn cho phép song song hóa an toàn giữa các phiên.

## Lý do

- Các lượt chạy tự động trả lời có thể tốn kém (lệnh gọi LLM) và có thể va chạm khi nhiều tin nhắn đến gần như cùng lúc.
- Tuần tự hóa giúp tránh cạnh tranh tài nguyên dùng chung (tệp phiên, nhật ký, CLI stdin) và giảm khả năng gặp giới hạn tốc độ từ thượng nguồn.

## Cách hoạt động

- Hàng đợi FIFO nhận biết lane xử lý từng lane với giới hạn đồng thời có thể cấu hình (mặc định là 1 cho các lane chưa cấu hình; main mặc định là 4, subagent là 8).
- `runEmbeddedPiAgent` đưa vào hàng đợi theo **khóa phiên** (lane `session:<key>`) để bảo đảm mỗi phiên chỉ có một lượt chạy đang hoạt động.
- Sau đó, mỗi lượt chạy phiên được đưa vào **lane toàn cục** (`main` theo mặc định) để tổng mức song song được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lượt chạy trong hàng đợi phát ra một thông báo ngắn nếu chúng đã chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (khi kênh hỗ trợ), nên trải nghiệm người dùng không thay đổi trong lúc chờ đến lượt.

## Mặc định

Khi chưa đặt, mọi bề mặt kênh đến dùng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` là mặc định vì chế độ này giữ cho lượt mô hình đang hoạt động phản hồi nhanh mà không
khởi động lượt chạy phiên thứ hai. Nếu lượt chạy hiện tại không thể nhận điều hướng,
OpenClaw sẽ quay về một mục hàng đợi followup.

## Chế độ hàng đợi

Tin nhắn đến có thể điều hướng lượt chạy hiện tại, chờ một lượt followup, hoặc làm cả hai:

- `steer`: đưa một tin nhắn điều hướng vào lượt chạy Pi đang hoạt động. Pi phân phối tin nhắn đó **sau khi lượt trợ lý hiện tại hoàn tất việc thực thi các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo. Nếu lượt chạy không đang stream chủ động hoặc không có điều hướng, OpenClaw sẽ quay về một mục hàng đợi followup.
- `followup`: đưa từng tin nhắn vào hàng đợi cho một lượt tác nhân sau đó, khi lượt chạy hiện tại kết thúc.
- `collect`: gộp các tin nhắn đã xếp hàng thành **một** lượt followup duy nhất sau cửa sổ yên lặng. Nếu tin nhắn nhắm đến các kênh/luồng khác nhau, chúng sẽ được xử lý riêng để giữ nguyên định tuyến.
- `steer-backlog` (còn gọi là `steer+backlog`): điều hướng ngay **và** giữ cùng tin nhắn đó cho một lượt followup.
- `interrupt` (kế thừa): hủy lượt chạy đang hoạt động cho phiên đó, rồi chạy tin nhắn mới nhất.
- `queue` (bí danh kế thừa): giống `steer`.

Steer-backlog nghĩa là bạn có thể nhận một phản hồi followup sau lượt chạy đã được điều hướng, nên
các bề mặt streaming có thể trông như bị trùng lặp. Hãy ưu tiên `collect`/`steer` nếu bạn muốn
một phản hồi cho mỗi tin nhắn đến.

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

Các tùy chọn áp dụng cho `followup`, `collect`, và `steer-backlog` (và cho `steer` khi quay về followup):

- `debounceMs`: cửa sổ yên lặng trước khi xử lý các followup đã xếp hàng. Số trần là mili giây; các đơn vị `ms`, `s`, `m`, `h`, và `d` được tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa trong hàng đợi cho mỗi phiên. Giá trị dưới `1` bị bỏ qua.
- `drop: "summarize"`: mặc định. Bỏ các mục cũ nhất trong hàng đợi khi cần, giữ các bản tóm tắt gọn, và chèn chúng dưới dạng một prompt followup tổng hợp.
- `drop: "old"`: bỏ các mục cũ nhất trong hàng đợi khi cần, không giữ bản tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải:

1. Ghi đè `/queue` inline hoặc đã lưu theo phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Mặc định `steer`.

Đối với tùy chọn, các tùy chọn `/queue` inline hoặc đã lưu thắng cấu hình. Sau đó
áp dụng debounce theo kênh (`messages.queue.debounceMsByChannel`), mặc định debounce của plugin,
các tùy chọn `messages.queue` toàn cục, và các mặc định tích hợp sẵn.
`cap` và `drop` là tùy chọn toàn cục/phiên, không phải khóa cấu hình theo kênh.

## Ghi đè theo phiên

- Gửi `/queue <mode>` dưới dạng lệnh độc lập để lưu chế độ cho phiên hiện tại.
- Có thể kết hợp các tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè phiên.

## Phạm vi và bảo đảm

- Áp dụng cho các lượt chạy tác nhân tự động trả lời trên tất cả kênh đến dùng pipeline trả lời của Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Lane mặc định (`main`) áp dụng toàn tiến trình cho inbound + Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại thêm các lane khác (ví dụ `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn phản hồi đến. Các lượt tác nhân Cron cô lập giữ một slot `cron` trong khi phần thực thi tác nhân bên trong dùng `cron-nested`; cả hai đều dùng `cron.maxConcurrentRuns`. Các luồng `nested` không phải Cron dùng chung giữ hành vi lane riêng. Các lượt chạy tách rời này được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).
- Các lane theo phiên bảo đảm rằng chỉ một lượt chạy tác nhân chạm vào một phiên nhất định tại một thời điểm.
- Không có phụ thuộc bên ngoài hoặc luồng worker nền; chỉ TypeScript + promise thuần.

## Khắc phục sự cố

- Nếu các lệnh có vẻ bị kẹt, hãy bật nhật ký chi tiết và tìm các dòng “queued for …ms” để xác nhận hàng đợi đang được xử lý.
- Nếu bạn cần độ sâu hàng đợi, hãy bật nhật ký chi tiết và theo dõi các dòng thời gian hàng đợi.
- Khi bật chẩn đoán, các phiên còn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` sẽ ghi nhật ký cảnh báo phiên bị kẹt. Các lượt chạy nhúng đang hoạt động, thao tác trả lời đang hoạt động, và tác vụ lane đang hoạt động mặc định vẫn chỉ cảnh báo; dữ liệu theo dõi khởi động đã cũ không có công việc phiên đang hoạt động có thể giải phóng lane phiên bị ảnh hưởng để công việc trong hàng đợi được xử lý.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Chính sách thử lại](/vi/concepts/retry)
