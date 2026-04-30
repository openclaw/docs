---
read_when:
    - Thay đổi cách thực thi hoặc mức độ đồng thời của tính năng trả lời tự động
    - Giải thích các chế độ /queue hoặc hành vi điều hướng tin nhắn
summary: Chế độ hàng đợi tự động trả lời, giá trị mặc định và ghi đè theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-04-30T18:38:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

Chúng tôi tuần tự hóa các lượt chạy tự động trả lời đến (tất cả các kênh) thông qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lượt chạy tác nhân va chạm với nhau, trong khi vẫn cho phép song song an toàn giữa các phiên.

## Vì sao

- Các lượt chạy tự động trả lời có thể tốn kém (lệnh gọi LLM) và có thể va chạm khi nhiều tin nhắn đến gần nhau.
- Tuần tự hóa giúp tránh cạnh tranh tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm khả năng gặp giới hạn tốc độ từ thượng nguồn.

## Cách hoạt động

- Một hàng đợi FIFO có nhận biết lane xả từng lane với giới hạn đồng thời có thể cấu hình (mặc định là 1 cho các lane chưa cấu hình; main mặc định là 4, subagent là 8).
- `runEmbeddedPiAgent` đưa vào hàng đợi theo **khóa phiên** (lane `session:<key>`) để bảo đảm mỗi phiên chỉ có một lượt chạy đang hoạt động.
- Sau đó, mỗi lượt chạy phiên được đưa vào một **lane toàn cục** (`main` theo mặc định) để tổng mức song song được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lượt chạy trong hàng đợi sẽ phát ra một thông báo ngắn nếu chúng chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (khi kênh hỗ trợ), nên trải nghiệm người dùng không đổi trong lúc chúng tôi chờ đến lượt.

## Mặc định

Khi chưa đặt, tất cả bề mặt kênh đến dùng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` là mặc định vì nó giữ cho lượt mô hình đang hoạt động phản hồi nhanh mà không
khởi động lượt chạy phiên thứ hai. Nó xả tất cả tin nhắn điều hướng đã đến
trước ranh giới mô hình tiếp theo. Nếu lượt chạy hiện tại không thể chấp nhận điều hướng,
OpenClaw quay về một mục hàng đợi followup.

## Chế độ hàng đợi

Tin nhắn đến có thể điều hướng lượt chạy hiện tại, chờ một lượt followup, hoặc làm cả hai:

- `steer`: đưa tin nhắn điều hướng vào runtime đang hoạt động. Pi gửi tất cả tin nhắn điều hướng đang chờ **sau khi lượt trợ lý hiện tại thực thi xong các lệnh gọi công cụ của nó**, trước lệnh gọi LLM tiếp theo; Codex app-server nhận một `turn/steer` được gom lô. Nếu lượt chạy không đang stream chủ động hoặc không có điều hướng, OpenClaw quay về một mục hàng đợi followup.
- `queue` (kế thừa): điều hướng cũ theo từng tin nhắn một. Pi gửi một tin nhắn điều hướng trong hàng đợi tại mỗi ranh giới mô hình; Codex app-server nhận các yêu cầu `turn/steer` riêng biệt. Ưu tiên `steer` trừ khi bạn cần hành vi tuần tự hóa trước đó.
- `followup`: đưa từng tin nhắn vào hàng đợi cho một lượt tác nhân sau này sau khi lượt chạy hiện tại kết thúc.
- `collect`: gộp các tin nhắn trong hàng đợi thành một lượt followup **duy nhất** sau khoảng lặng. Nếu tin nhắn nhắm đến các kênh/luồng khác nhau, chúng sẽ được xả riêng lẻ để bảo toàn định tuyến.
- `steer-backlog` (còn gọi là `steer+backlog`): điều hướng ngay **và** giữ lại cùng tin nhắn đó cho một lượt followup.
- `interrupt` (kế thừa): hủy lượt chạy đang hoạt động cho phiên đó, rồi chạy tin nhắn mới nhất.

Steer-backlog nghĩa là bạn có thể nhận phản hồi followup sau lượt chạy đã được điều hướng, nên
các bề mặt streaming có thể trông giống như bị trùng lặp. Ưu tiên `collect`/`steer` nếu bạn muốn
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

Các tùy chọn áp dụng cho `followup`, `collect`, và `steer-backlog` (và cho `steer` hoặc `queue` kế thừa khi điều hướng quay về followup):

- `debounceMs`: khoảng lặng trước khi xả các followup trong hàng đợi. Số trần là mili giây; các đơn vị `ms`, `s`, `m`, `h`, và `d` được tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa trong hàng đợi mỗi phiên. Các giá trị dưới `1` bị bỏ qua.
- `drop: "summarize"`: mặc định. Bỏ các mục cũ nhất trong hàng đợi khi cần, giữ lại tóm tắt cô đọng và chèn chúng dưới dạng prompt followup tổng hợp.
- `drop: "old"`: bỏ các mục cũ nhất trong hàng đợi khi cần, không giữ lại tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải:

1. Ghi đè `/queue` nội tuyến hoặc đã lưu theo phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Mặc định `steer`.

Đối với tùy chọn, các tùy chọn `/queue` nội tuyến hoặc đã lưu thắng cấu hình. Sau đó
áp dụng debounce theo kênh (`messages.queue.debounceMsByChannel`), mặc định debounce của plugin,
các tùy chọn `messages.queue` toàn cục, và mặc định tích hợp sẵn.
`cap` và `drop` là tùy chọn toàn cục/phiên, không phải khóa cấu hình theo kênh.

## Ghi đè theo phiên

- Gửi `/queue <mode>` như một lệnh độc lập để lưu chế độ cho phiên hiện tại.
- Có thể kết hợp các tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè phiên.

## Phạm vi và bảo đảm

- Áp dụng cho các lượt chạy tác nhân tự động trả lời trên tất cả các kênh đến dùng pipeline trả lời Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Lane mặc định (`main`) là toàn tiến trình cho inbound + Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại các lane bổ sung (ví dụ `cron`, `cron-nested`, `nested`, `subagent`) để các công việc nền có thể chạy song song mà không chặn trả lời đến. Các lượt tác nhân cron cô lập giữ một slot `cron` trong khi phần thực thi tác nhân bên trong dùng `cron-nested`; cả hai dùng `cron.maxConcurrentRuns`. Các luồng `nested` không phải cron dùng chung giữ hành vi lane riêng của chúng. Các lượt chạy tách rời này được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).
- Lane theo phiên bảo đảm chỉ một lượt chạy tác nhân chạm vào một phiên nhất định tại một thời điểm.
- Không có phụ thuộc bên ngoài hoặc luồng worker nền; chỉ TypeScript + promises.

## Khắc phục sự cố

- Nếu lệnh có vẻ bị kẹt, bật nhật ký chi tiết và tìm các dòng “queued for …ms” để xác nhận hàng đợi đang xả.
- Nếu bạn cần độ sâu hàng đợi, bật nhật ký chi tiết và theo dõi các dòng thời gian hàng đợi.
- Các lượt chạy Codex app-server chấp nhận một lượt rồi ngừng phát tiến trình sẽ bị adapter Codex ngắt để lane phiên đang hoạt động có thể được giải phóng thay vì chờ timeout của lượt chạy ngoài.
- Khi bật chẩn đoán, các phiên vẫn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` sẽ ghi cảnh báo phiên bị kẹt. Các lượt chạy nhúng đang hoạt động, thao tác trả lời đang hoạt động và tác vụ lane đang hoạt động mặc định vẫn chỉ cảnh báo; sổ sách khởi động đã cũ mà không có công việc phiên đang hoạt động có thể giải phóng lane phiên bị ảnh hưởng để công việc trong hàng đợi được xả.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Chính sách thử lại](/vi/concepts/retry)
