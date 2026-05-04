---
read_when:
    - Thay đổi cách thực thi hoặc mức đồng thời của tự động trả lời
    - Giải thích các chế độ /queue hoặc hành vi điều hướng tin nhắn
summary: Các chế độ hàng đợi tự động trả lời, giá trị mặc định và ghi đè theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-05-04T02:23:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Chúng tôi tuần tự hóa các lần chạy tự động trả lời đến (tất cả các kênh) thông qua một hàng đợi rất nhỏ trong tiến trình để ngăn nhiều lần chạy agent va chạm với nhau, trong khi vẫn cho phép song song hóa an toàn giữa các phiên.

## Lý do

- Các lần chạy tự động trả lời có thể tốn kém (lệnh gọi LLM) và có thể va chạm khi nhiều tin nhắn đến gần nhau.
- Tuần tự hóa giúp tránh cạnh tranh tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm khả năng gặp giới hạn tốc độ từ thượng nguồn.

## Cách hoạt động

- Một hàng đợi FIFO nhận biết lane sẽ xả từng lane với giới hạn đồng thời có thể cấu hình (mặc định là 1 cho các lane chưa cấu hình; main mặc định là 4, subagent là 8).
- `runEmbeddedPiAgent` đưa vào hàng đợi theo **khóa phiên** (lane `session:<key>`) để đảm bảo mỗi phiên chỉ có một lần chạy đang hoạt động.
- Mỗi lần chạy phiên sau đó được đưa vào một **lane toàn cục** (`main` theo mặc định) để tổng mức song song hóa được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lần chạy đang chờ sẽ phát ra một thông báo ngắn nếu chúng đã chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (khi kênh hỗ trợ), nên trải nghiệm người dùng không thay đổi trong lúc chờ đến lượt.

## Mặc định

Khi chưa đặt, tất cả bề mặt kênh đến sử dụng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` là mặc định vì nó giữ lượt mô hình đang hoạt động phản hồi nhanh mà không
bắt đầu lần chạy phiên thứ hai. Nó xả tất cả tin nhắn điều hướng đã đến
trước ranh giới mô hình tiếp theo. Nếu lần chạy hiện tại không thể nhận điều hướng,
OpenClaw sẽ quay về một mục hàng đợi followup.

## Chế độ hàng đợi

Tin nhắn đến có thể điều hướng lần chạy hiện tại, chờ một lượt followup, hoặc làm cả hai:

- `steer`: đưa tin nhắn điều hướng vào runtime đang hoạt động. Pi gửi tất cả tin nhắn điều hướng đang chờ **sau khi lượt assistant hiện tại hoàn tất việc thực thi các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo; Codex app-server nhận một `turn/steer` theo lô. Nếu lần chạy không đang stream chủ động hoặc điều hướng không khả dụng, OpenClaw sẽ quay về một mục hàng đợi followup.
- `queue` (cũ): điều hướng cũ từng tin một. Pi gửi một tin nhắn điều hướng đã xếp hàng tại mỗi ranh giới mô hình; Codex app-server nhận các yêu cầu `turn/steer` riêng biệt. Ưu tiên `steer` trừ khi bạn cần hành vi tuần tự hóa trước đó.
- `followup`: đưa từng tin nhắn vào hàng đợi cho một lượt agent sau đó, sau khi lần chạy hiện tại kết thúc.
- `collect`: gộp các tin nhắn đã xếp hàng thành một lượt followup **duy nhất** sau cửa sổ yên lặng. Nếu các tin nhắn nhắm đến các kênh/luồng khác nhau, chúng sẽ được xả riêng lẻ để bảo toàn định tuyến.
- `steer-backlog` (còn gọi là `steer+backlog`): điều hướng ngay **và** giữ nguyên cùng tin nhắn đó cho một lượt followup.
- `interrupt` (cũ): hủy lần chạy đang hoạt động cho phiên đó, rồi chạy tin nhắn mới nhất.

Steer-backlog nghĩa là bạn có thể nhận được phản hồi followup sau lần chạy đã được điều hướng, nên
các bề mặt streaming có thể trông giống như bị trùng lặp. Ưu tiên `collect`/`steer` nếu bạn muốn
một phản hồi cho mỗi tin nhắn đến.

Để biết thời điểm và hành vi phụ thuộc theo từng runtime, xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering). Đối với lệnh rõ ràng `/steer <message>`,
xem [Điều hướng](/vi/tools/steer).

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

- `debounceMs`: cửa sổ yên lặng trước khi xả các followup đã xếp hàng. Số trần là mili giây; các đơn vị `ms`, `s`, `m`, `h`, và `d` được tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa đã xếp hàng trên mỗi phiên. Các giá trị dưới `1` bị bỏ qua.
- `drop: "summarize"`: mặc định. Loại bỏ các mục đã xếp hàng cũ nhất khi cần, giữ các bản tóm tắt gọn, và chèn chúng dưới dạng prompt followup tổng hợp.
- `drop: "old"`: loại bỏ các mục đã xếp hàng cũ nhất khi cần, mà không giữ bản tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải:

1. Ghi đè `/queue` nội tuyến hoặc đã lưu theo phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` mặc định.

Đối với tùy chọn, các tùy chọn `/queue` nội tuyến hoặc đã lưu thắng cấu hình. Sau đó
debounce theo kênh (`messages.queue.debounceMsByChannel`), mặc định debounce của plugin,
các tùy chọn `messages.queue` toàn cục, và mặc định tích hợp sẵn sẽ được
áp dụng. `cap` và `drop` là các tùy chọn toàn cục/phiên, không phải khóa
cấu hình theo kênh.

## Ghi đè theo phiên

- Gửi `/queue <mode>` dưới dạng lệnh độc lập để lưu chế độ cho phiên hiện tại.
- Có thể kết hợp các tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè phiên.

## Phạm vi và đảm bảo

- Áp dụng cho các lần chạy agent tự động trả lời trên tất cả các kênh đến dùng pipeline trả lời Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Lane mặc định (`main`) có phạm vi toàn tiến trình cho tin nhắn đến + main Heartbeat; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại các lane bổ sung (ví dụ: `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn trả lời đến. Các lượt agent cron cô lập giữ một slot `cron` trong khi phần thực thi agent bên trong dùng `cron-nested`; cả hai dùng `cron.maxConcurrentRuns`. Các luồng `nested` không phải cron dùng chung vẫn giữ hành vi lane riêng. Các lần chạy tách rời này được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).
- Các lane theo phiên đảm bảo rằng chỉ một lần chạy agent chạm vào một phiên nhất định tại một thời điểm.
- Không có phụ thuộc bên ngoài hoặc luồng worker nền; thuần TypeScript + promise.

## Khắc phục sự cố

- Nếu lệnh có vẻ bị kẹt, hãy bật nhật ký chi tiết và tìm các dòng “queued for …ms” để xác nhận hàng đợi đang xả.
- Nếu bạn cần độ sâu hàng đợi, hãy bật nhật ký chi tiết và theo dõi các dòng thời gian hàng đợi.
- Các lần chạy Codex app-server nhận một lượt rồi ngừng phát tiến độ sẽ bị adapter Codex ngắt để lane phiên đang hoạt động có thể được giải phóng thay vì chờ hết thời gian chờ của lần chạy bên ngoài.
- Khi bật chẩn đoán, các phiên vẫn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` mà không quan sát thấy trả lời, công cụ, trạng thái, khối, hoặc tiến độ ACP sẽ được phân loại theo hoạt động hiện tại. Công việc đang hoạt động ghi nhật ký là `session.long_running`; công việc đang hoạt động nhưng không có tiến độ gần đây ghi nhật ký là `session.stalled`; `session.stuck` được dành cho sổ sách phiên cũ không có công việc đang hoạt động, và chỉ đường dẫn đó mới có thể giải phóng lane phiên bị ảnh hưởng để công việc đã xếp hàng được xả. Các chẩn đoán `session.stuck` lặp lại sẽ lùi dần trong khi phiên vẫn không thay đổi.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Điều hướng](/vi/tools/steer)
- [Chính sách thử lại](/vi/concepts/retry)
