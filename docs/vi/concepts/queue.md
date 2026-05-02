---
read_when:
    - Thay đổi việc thực thi hoặc mức đồng thời của trả lời tự động
    - Giải thích các chế độ /queue hoặc hành vi điều hướng tin nhắn
summary: Chế độ hàng đợi trả lời tự động, giá trị mặc định và ghi đè theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-05-02T10:39:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

Chúng tôi tuần tự hóa các lần chạy tự động trả lời đầu vào (mọi kênh) qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lần chạy agent va chạm với nhau, trong khi vẫn cho phép chạy song song an toàn giữa các phiên.

## Vì sao

- Các lần chạy tự động trả lời có thể tốn kém (lời gọi LLM) và có thể va chạm khi nhiều tin nhắn đầu vào đến sát nhau.
- Tuần tự hóa giúp tránh tranh chấp tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm khả năng gặp giới hạn tốc độ từ thượng nguồn.

## Cách hoạt động

- Một hàng đợi FIFO nhận biết lane sẽ xả từng lane với giới hạn đồng thời có thể cấu hình (mặc định là 1 cho các lane chưa cấu hình; main mặc định là 4, subagent là 8).
- `runEmbeddedPiAgent` đưa vào hàng đợi theo **khóa phiên** (lane `session:<key>`) để đảm bảo mỗi phiên chỉ có một lần chạy đang hoạt động.
- Sau đó mỗi lần chạy phiên được xếp vào một **lane toàn cục** (`main` theo mặc định) để mức song song tổng thể được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lần chạy trong hàng đợi sẽ phát một thông báo ngắn nếu chúng đã chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (khi kênh hỗ trợ), nên trải nghiệm người dùng không đổi trong khi chờ đến lượt.

## Giá trị mặc định

Khi chưa đặt, tất cả bề mặt kênh đầu vào dùng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` là mặc định vì nó giữ lượt mô hình đang hoạt động phản hồi nhanh mà không
khởi động lần chạy phiên thứ hai. Nó xả tất cả tin nhắn điều hướng đã đến
trước ranh giới mô hình tiếp theo. Nếu lần chạy hiện tại không thể nhận điều hướng,
OpenClaw sẽ chuyển dự phòng sang một mục hàng đợi followup.

## Chế độ hàng đợi

Tin nhắn đầu vào có thể điều hướng lần chạy hiện tại, chờ một lượt followup, hoặc làm cả hai:

- `steer`: xếp tin nhắn điều hướng vào runtime đang hoạt động. Pi gửi tất cả tin nhắn điều hướng đang chờ **sau khi lượt assistant hiện tại chạy xong các lời gọi công cụ**, trước lời gọi LLM tiếp theo; Codex app-server nhận một `turn/steer` được gom lô. Nếu lần chạy không đang stream tích cực hoặc không có điều hướng, OpenClaw sẽ chuyển dự phòng sang một mục hàng đợi followup.
- `queue` (cũ): điều hướng từng mục một kiểu cũ. Pi gửi một tin nhắn điều hướng đã xếp hàng tại mỗi ranh giới mô hình; Codex app-server nhận các yêu cầu `turn/steer` riêng biệt. Ưu tiên `steer` trừ khi bạn cần hành vi tuần tự hóa trước đây.
- `followup`: đưa từng tin nhắn vào hàng đợi cho một lượt agent sau khi lần chạy hiện tại kết thúc.
- `collect`: gộp các tin nhắn đã xếp hàng thành **một** lượt followup duy nhất sau khoảng lặng. Nếu tin nhắn nhắm đến các kênh/luồng khác nhau, chúng được xả riêng lẻ để giữ nguyên định tuyến.
- `steer-backlog` (còn gọi là `steer+backlog`): điều hướng ngay **và** giữ lại cùng tin nhắn đó cho một lượt followup.
- `interrupt` (cũ): hủy lần chạy đang hoạt động cho phiên đó, rồi chạy tin nhắn mới nhất.

Steer-backlog nghĩa là bạn có thể nhận phản hồi followup sau lần chạy đã được điều hướng, nên
các bề mặt streaming có thể trông như bị trùng lặp. Ưu tiên `collect`/`steer` nếu bạn muốn
một phản hồi cho mỗi tin nhắn đầu vào.

Để biết thời điểm và hành vi phụ thuộc theo từng runtime, xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering).

Cấu hình toàn cục hoặc theo từng kênh qua `messages.queue`:

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

Các tùy chọn áp dụng cho `followup`, `collect`, và `steer-backlog` (và cho `steer` hoặc `queue` cũ khi điều hướng chuyển dự phòng sang followup):

- `debounceMs`: khoảng lặng trước khi xả các followup đã xếp hàng. Số trần là mili giây; các đơn vị `ms`, `s`, `m`, `h`, và `d` được tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa trong hàng đợi cho mỗi phiên. Giá trị dưới `1` bị bỏ qua.
- `drop: "summarize"`: mặc định. Loại bỏ các mục cũ nhất trong hàng đợi khi cần, giữ lại bản tóm tắt gọn, và chèn chúng dưới dạng prompt followup tổng hợp.
- `drop: "old"`: loại bỏ các mục cũ nhất trong hàng đợi khi cần, không giữ lại bản tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải:

1. Ghi đè `/queue` nội tuyến hoặc đã lưu theo phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Mặc định `steer`.

Đối với tùy chọn, các tùy chọn `/queue` nội tuyến hoặc đã lưu sẽ thắng cấu hình. Sau đó
debounce theo kênh (`messages.queue.debounceMsByChannel`), mặc định debounce của Plugin,
tùy chọn `messages.queue` toàn cục, và mặc định tích hợp sẵn được
áp dụng. `cap` và `drop` là tùy chọn toàn cục/phiên, không phải khóa cấu hình
theo kênh.

## Ghi đè theo phiên

- Gửi `/queue <mode>` như một lệnh độc lập để lưu chế độ cho phiên hiện tại.
- Có thể kết hợp các tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè phiên.

## Phạm vi và bảo đảm

- Áp dụng cho các lần chạy agent tự động trả lời trên mọi kênh đầu vào dùng pipeline phản hồi Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Lane mặc định (`main`) áp dụng toàn tiến trình cho đầu vào + Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại các lane bổ sung (ví dụ `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn phản hồi đầu vào. Các lượt agent cron cô lập giữ một slot `cron` trong khi phần thực thi agent bên trong dùng `cron-nested`; cả hai dùng `cron.maxConcurrentRuns`. Các luồng `nested` không phải cron dùng chung giữ hành vi lane riêng. Các lần chạy tách rời này được theo dõi như [tác vụ nền](/vi/automation/tasks).
- Lane theo phiên đảm bảo mỗi lần chỉ một lần chạy agent chạm vào một phiên nhất định.
- Không có phụ thuộc bên ngoài hoặc luồng worker nền; chỉ TypeScript + promise thuần.

## Khắc phục sự cố

- Nếu các lệnh có vẻ bị kẹt, hãy bật nhật ký chi tiết và tìm các dòng “queued for …ms” để xác nhận hàng đợi đang xả.
- Nếu bạn cần độ sâu hàng đợi, hãy bật nhật ký chi tiết và theo dõi các dòng thời gian hàng đợi.
- Các lần chạy Codex app-server chấp nhận một lượt rồi ngừng phát tiến trình sẽ bị adapter Codex ngắt để lane phiên đang hoạt động có thể nhả ra thay vì chờ hết thời gian chờ của lần chạy bên ngoài.
- Khi bật chẩn đoán, các phiên vẫn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` mà không quan sát thấy phản hồi, công cụ, trạng thái, khối, hoặc tiến trình ACP sẽ được phân loại theo hoạt động hiện tại. Công việc đang hoạt động ghi nhật ký là `session.long_running`; công việc đang hoạt động nhưng không có tiến trình gần đây ghi nhật ký là `session.stalled`; `session.stuck` được dành cho sổ sách phiên đã cũ không có công việc đang hoạt động, và chỉ đường dẫn đó mới có thể nhả lane phiên bị ảnh hưởng để công việc trong hàng đợi được xả. Chẩn đoán `session.stuck` lặp lại sẽ lùi dần trong khi phiên vẫn không đổi.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Chính sách thử lại](/vi/concepts/retry)
