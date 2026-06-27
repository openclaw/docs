---
read_when:
    - Thay đổi việc thực thi hoặc tính đồng thời của trả lời tự động
    - Giải thích các chế độ /queue hoặc hành vi điều hướng tin nhắn
summary: Các chế độ hàng đợi tự động trả lời, mặc định và ghi đè theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-06-27T17:25:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Chúng tôi tuần tự hóa các lượt chạy tự động trả lời đến (tất cả kênh) qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lượt chạy tác tử va chạm, trong khi vẫn cho phép chạy song song an toàn giữa các phiên.

## Lý do

- Các lượt chạy tự động trả lời có thể tốn kém (lệnh gọi LLM) và có thể va chạm khi nhiều tin nhắn đến gần nhau.
- Tuần tự hóa giúp tránh cạnh tranh tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm khả năng gặp giới hạn tốc độ từ thượng nguồn.

## Cách hoạt động

- Một hàng đợi FIFO có nhận biết làn xử lý từng làn với giới hạn đồng thời có thể cấu hình (mặc định 1 cho các làn chưa cấu hình; main mặc định là 4, subagent là 8).
- `runEmbeddedAgent` đưa vào hàng đợi theo **khóa phiên** (làn `session:<key>`) để đảm bảo chỉ có một lượt chạy đang hoạt động cho mỗi phiên.
- Sau đó, mỗi lượt chạy phiên được đưa vào một **làn toàn cục** (mặc định là `main`) để giới hạn mức song song tổng thể bằng `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lượt chạy trong hàng đợi sẽ phát ra một thông báo ngắn nếu đã chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (khi kênh hỗ trợ), nên trải nghiệm người dùng không thay đổi trong lúc chờ đến lượt.

## Mặc định

Khi chưa đặt, tất cả bề mặt kênh đến dùng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Điều hướng cùng lượt là mặc định. Một prompt đến giữa lượt chạy sẽ được chèn
vào môi trường thực thi đang hoạt động khi lượt chạy có thể nhận điều hướng, vì vậy không khởi động
lượt chạy phiên thứ hai. Nếu lượt chạy đang hoạt động không thể nhận điều hướng, OpenClaw sẽ chờ
lượt chạy đang hoạt động kết thúc trước khi bắt đầu prompt.

## Chế độ hàng đợi

`/queue` kiểm soát cách các tin nhắn đến bình thường hoạt động khi một phiên đã có
một lượt chạy đang hoạt động:

- `steer`: chèn tin nhắn vào môi trường thực thi đang hoạt động. OpenClaw gửi tất cả tin nhắn điều hướng đang chờ **sau khi lượt trợ lý hiện tại thực thi xong các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo; Codex app-server nhận một `turn/steer` được gộp. Nếu lượt chạy không đang chủ động truyền luồng hoặc không có điều hướng, OpenClaw sẽ chờ cho đến khi lượt chạy đang hoạt động kết thúc trước khi bắt đầu prompt.
- `followup`: không điều hướng. Đưa từng tin nhắn vào hàng đợi cho một lượt tác tử sau khi lượt chạy hiện tại kết thúc.
- `collect`: không điều hướng. Gộp các tin nhắn trong hàng đợi thành một lượt theo dõi **duy nhất** sau cửa sổ yên lặng. Nếu tin nhắn nhắm đến các kênh/luồng khác nhau, chúng được xả riêng để giữ nguyên định tuyến.
- `interrupt`: hủy lượt chạy đang hoạt động cho phiên đó, rồi chạy tin nhắn mới nhất.

Để biết thời điểm và hành vi phụ thuộc theo từng môi trường thực thi, xem
[Hàng đợi điều hướng](/vi/concepts/queue-steering). Đối với lệnh `/steer <message>`
rõ ràng, xem [Điều hướng](/vi/tools/steer).

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

Các tùy chọn áp dụng cho việc gửi trong hàng đợi. `debounceMs` cũng đặt cửa sổ
yên lặng điều hướng Codex trong chế độ `steer`:

- `debounceMs`: cửa sổ yên lặng trước khi xả các lượt theo dõi trong hàng đợi hoặc các lô thu thập; trong chế độ Codex `steer`, là cửa sổ yên lặng trước khi gửi `turn/steer` được gộp. Số trần là mili giây; các đơn vị `ms`, `s`, `m`, `h` và `d` được tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa trong hàng đợi cho mỗi phiên. Giá trị dưới `1` bị bỏ qua.
- `drop: "summarize"`: mặc định. Bỏ các mục cũ nhất trong hàng đợi khi cần, giữ các tóm tắt gọn và chèn chúng dưới dạng prompt theo dõi tổng hợp.
- `drop: "old"`: bỏ các mục cũ nhất trong hàng đợi khi cần, không giữ tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Điều hướng và truyền luồng

Khi truyền luồng của kênh là `partial` hoặc `block`, điều hướng có thể trông giống nhiều
phản hồi ngắn hiển thị trong lúc lượt chạy đang hoạt động đi tới các ranh giới môi trường thực thi:

- `partial`: bản xem trước có thể hoàn tất sớm, rồi một bản xem trước mới bắt đầu sau khi
  điều hướng được chấp nhận.
- `block`: các khối có kích thước như bản nháp có thể tạo ra cùng dạng xuất hiện tuần tự.
- Không có truyền luồng, điều hướng sẽ chuyển dự phòng sang một lượt theo dõi sau lượt chạy đang hoạt động khi
  môi trường thực thi không thể nhận điều hướng cùng lượt.

`steer` không hủy các công cụ đang chạy. Dùng `/queue interrupt` khi tin nhắn
mới nhất cần hủy lượt chạy hiện tại.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải:

1. Ghi đè `/queue` trực tiếp hoặc đã lưu theo từng phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Mặc định `steer`.

Đối với tùy chọn, các tùy chọn `/queue` trực tiếp hoặc đã lưu thắng cấu hình. Sau đó
áp dụng debounce theo kênh (`messages.queue.debounceMsByChannel`), mặc định
debounce của Plugin, tùy chọn `messages.queue` toàn cục và mặc định tích hợp.
`cap` và `drop` là tùy chọn toàn cục/phiên, không phải khóa cấu hình theo kênh.

## Ghi đè theo từng phiên

- Gửi `/queue <steer|followup|collect|interrupt>` như một lệnh độc lập để lưu chế độ hàng đợi cho phiên hiện tại.
- Có thể kết hợp tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa ghi đè phiên.

## Phạm vi và bảo đảm

- Áp dụng cho các lượt chạy tác tử tự động trả lời trên tất cả kênh đến dùng pipeline trả lời Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Làn mặc định (`main`) áp dụng toàn tiến trình cho tin nhắn đến + Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại các làn bổ sung (ví dụ `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn trả lời đến. Các lượt tác tử Cron cô lập giữ một vị trí `cron` trong khi phần thực thi tác tử bên trong dùng `cron-nested`; cả hai dùng `cron.maxConcurrentRuns`. Các luồng `nested` không phải Cron dùng chung giữ hành vi làn riêng. Các lượt chạy tách rời này được theo dõi như [tác vụ nền](/vi/automation/tasks).
- Các làn theo từng phiên bảo đảm rằng tại một thời điểm chỉ có một lượt chạy tác tử chạm vào một phiên nhất định.
- Không có phụ thuộc bên ngoài hoặc luồng worker nền; thuần TypeScript + promise.

## Khắc phục sự cố

- Nếu lệnh có vẻ bị kẹt, bật nhật ký chi tiết và tìm các dòng "queued for ...ms" để xác nhận hàng đợi đang xả.
- Nếu cần độ sâu hàng đợi, bật nhật ký chi tiết và theo dõi các dòng thời điểm hàng đợi.
- Các lượt chạy Codex app-server nhận một lượt rồi ngừng phát tiến trình sẽ bị adapter Codex ngắt để làn phiên đang hoạt động có thể giải phóng thay vì chờ hết thời gian chờ lượt chạy bên ngoài.
- Khi bật chẩn đoán, các phiên còn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` mà không quan sát thấy phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP sẽ được phân loại theo hoạt động hiện tại. Công việc đang hoạt động ghi nhật ký là `session.long_running`; các lệnh gọi mô hình im lặng có chủ sở hữu cũng vẫn là `session.long_running` cho đến `diagnostics.stuckSessionAbortMs` để các nhà cung cấp chậm hoặc không truyền luồng không bị báo là bị dừng quá sớm. Công việc đang hoạt động không có tiến trình gần đây ghi nhật ký là `session.stalled`; các lệnh gọi mô hình có chủ sở hữu chuyển sang `session.stalled` tại hoặc sau ngưỡng hủy, và hoạt động mô hình/công cụ cũ không có chủ sở hữu không bị ẩn dưới dạng chạy lâu. `session.stuck` được dành cho việc ghi sổ phiên cũ có thể phục hồi, bao gồm các phiên đang chờ nhàn rỗi có hoạt động mô hình/công cụ cũ không có chủ sở hữu, và chỉ đường dẫn đó mới có thể giải phóng làn phiên bị ảnh hưởng để công việc trong hàng đợi được xả. Các chẩn đoán `session.stuck` lặp lại sẽ lùi nhịp trong khi phiên vẫn không thay đổi.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Điều hướng](/vi/tools/steer)
- [Chính sách thử lại](/vi/concepts/retry)
