---
read_when:
    - Thay đổi việc thực thi hoặc mức đồng thời của tính năng tự động trả lời
    - Giải thích các chế độ /queue hoặc hành vi điều hướng tin nhắn
summary: Các chế độ hàng đợi tự động trả lời, giá trị mặc định và ghi đè theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-05-06T09:09:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

Chúng tôi tuần tự hóa các lượt chạy tự động trả lời đến (mọi kênh) qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lượt chạy agent va chạm nhau, trong khi vẫn cho phép song song hóa an toàn giữa các phiên.

## Lý do

- Các lượt chạy tự động trả lời có thể tốn kém (lệnh gọi LLM) và có thể va chạm khi nhiều tin nhắn đến gần như cùng lúc.
- Tuần tự hóa giúp tránh cạnh tranh tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm khả năng chạm giới hạn tốc độ từ hệ thống thượng nguồn.

## Cách hoạt động

- Một hàng đợi FIFO nhận biết lane rút từng lane với giới hạn đồng thời có thể cấu hình (mặc định là 1 cho các lane chưa cấu hình; main mặc định là 4, subagent là 8).
- `runEmbeddedPiAgent` đưa vào hàng đợi theo **khóa phiên** (lane `session:<key>`) để bảo đảm mỗi phiên chỉ có một lượt chạy đang hoạt động.
- Sau đó, mỗi lượt chạy phiên được đưa vào một **lane toàn cục** (mặc định là `main`) để tổng mức song song được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lượt chạy trong hàng đợi sẽ phát một thông báo ngắn nếu phải chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (khi kênh hỗ trợ), nên trải nghiệm người dùng không đổi trong lúc chờ đến lượt.

## Mặc định

Khi chưa đặt, mọi bề mặt kênh đến dùng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` là mặc định vì nó giữ lượt mô hình đang hoạt động phản hồi nhanh mà không
bắt đầu một lượt chạy phiên thứ hai. Nó rút tất cả tin nhắn điều hướng đã đến
trước ranh giới mô hình tiếp theo. Nếu lượt chạy hiện tại không thể nhận điều hướng,
OpenClaw chuyển dự phòng sang một mục hàng đợi followup.

## Chế độ hàng đợi

Tin nhắn đến có thể điều hướng lượt chạy hiện tại, chờ một lượt followup, hoặc làm cả hai:

- `steer`: đưa tin nhắn điều hướng vào hàng đợi trong runtime đang hoạt động. Pi chuyển tất cả tin nhắn điều hướng đang chờ **sau khi lượt assistant hiện tại hoàn tất thực thi các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo; Codex app-server nhận một `turn/steer` được gom nhóm. Nếu lượt chạy không đang streaming hoặc không có điều hướng, OpenClaw chuyển dự phòng sang một mục hàng đợi followup.
- `queue` (cũ): điều hướng từng tin nhắn một theo kiểu cũ. Pi chuyển một tin nhắn điều hướng đã xếp hàng tại mỗi ranh giới mô hình; Codex app-server nhận các yêu cầu `turn/steer` riêng biệt. Ưu tiên `steer` trừ khi bạn cần hành vi tuần tự hóa trước đây.
- `followup`: đưa từng tin nhắn vào hàng đợi cho một lượt agent sau khi lượt chạy hiện tại kết thúc.
- `collect`: gộp các tin nhắn đã xếp hàng thành **một** lượt followup duy nhất sau khoảng lặng. Nếu tin nhắn nhắm đến các kênh/luồng khác nhau, chúng được rút riêng để giữ nguyên định tuyến.
- `steer-backlog` (còn gọi là `steer+backlog`): điều hướng ngay **và** giữ nguyên cùng tin nhắn đó cho một lượt followup.
- `interrupt` (cũ): hủy lượt chạy đang hoạt động cho phiên đó, rồi chạy tin nhắn mới nhất.

Steer-backlog nghĩa là bạn có thể nhận phản hồi followup sau lượt chạy đã được điều hướng, nên
các bề mặt streaming có thể trông như bị trùng lặp. Ưu tiên `collect`/`steer` nếu bạn muốn
mỗi tin nhắn đến có một phản hồi.

Để biết thời điểm và hành vi phụ thuộc theo từng runtime cụ thể, xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering). Với lệnh `/steer <message>`
tường minh, xem [Điều hướng](/vi/tools/steer).

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

Các tùy chọn áp dụng cho `followup`, `collect` và `steer-backlog` (cũng như cho `steer` hoặc `queue` cũ khi điều hướng chuyển dự phòng sang followup):

- `debounceMs`: khoảng lặng trước khi rút các followup đã xếp hàng. Số thuần là mili giây; các đơn vị `ms`, `s`, `m`, `h` và `d` được tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa được xếp hàng cho mỗi phiên. Giá trị dưới `1` bị bỏ qua.
- `drop: "summarize"`: mặc định. Bỏ các mục đã xếp hàng cũ nhất khi cần, giữ lại tóm tắt gọn, và chèn chúng dưới dạng prompt followup tổng hợp.
- `drop: "old"`: bỏ các mục đã xếp hàng cũ nhất khi cần, không giữ lại tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải:

1. Ghi đè `/queue` nội tuyến hoặc đã lưu cho từng phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` mặc định.

Đối với tùy chọn, các tùy chọn `/queue` nội tuyến hoặc đã lưu thắng cấu hình. Sau đó
debounce theo kênh (`messages.queue.debounceMsByChannel`), mặc định debounce của Plugin,
các tùy chọn `messages.queue` toàn cục, và mặc định tích hợp sẵn được
áp dụng. `cap` và `drop` là tùy chọn toàn cục/phiên, không phải khóa cấu hình theo kênh.

## Ghi đè theo phiên

- Gửi `/queue <mode>` như một lệnh độc lập để lưu chế độ cho phiên hiện tại.
- Có thể kết hợp tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè phiên.

## Phạm vi và bảo đảm

- Áp dụng cho các lượt chạy agent tự động trả lời trên mọi kênh đến dùng pipeline trả lời của Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Lane mặc định (`main`) áp dụng trên toàn tiến trình cho inbound + Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại thêm lane (ví dụ `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn trả lời đến. Các lượt agent Cron cô lập giữ một slot `cron` trong khi phần thực thi agent bên trong dùng `cron-nested`; cả hai dùng `cron.maxConcurrentRuns`. Các luồng `nested` dùng chung nhưng không phải Cron giữ hành vi lane riêng. Các lượt chạy tách rời này được theo dõi như [tác vụ nền](/vi/automation/tasks).
- Lane theo phiên bảo đảm mỗi lần chỉ một lượt chạy agent chạm vào một phiên nhất định.
- Không có phụ thuộc bên ngoài hoặc luồng worker nền; chỉ TypeScript + promise thuần.

## Khắc phục sự cố

- Nếu lệnh có vẻ bị kẹt, hãy bật nhật ký chi tiết và tìm các dòng "queued for ...ms" để xác nhận hàng đợi đang được rút.
- Nếu bạn cần độ sâu hàng đợi, hãy bật nhật ký chi tiết và theo dõi các dòng thời gian hàng đợi.
- Các lượt chạy Codex app-server đã nhận một lượt rồi ngừng phát tiến trình sẽ bị Codex adapter ngắt để lane phiên đang hoạt động có thể giải phóng thay vì chờ timeout của lượt chạy bên ngoài.
- Khi bật chẩn đoán, các phiên vẫn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` mà không quan sát thấy phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP sẽ được phân loại theo hoạt động hiện tại. Công việc đang hoạt động ghi nhật ký là `session.long_running`; công việc đang hoạt động nhưng không có tiến trình gần đây ghi nhật ký là `session.stalled`; `session.stuck` được dành cho bookkeeping phiên cũ không có công việc đang hoạt động, và chỉ đường này mới có thể giải phóng lane phiên bị ảnh hưởng để công việc đã xếp hàng được rút. Các chẩn đoán `session.stuck` lặp lại sẽ back off trong khi phiên vẫn không đổi.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Điều hướng](/vi/tools/steer)
- [Chính sách thử lại](/vi/concepts/retry)
