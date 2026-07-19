---
read_when:
    - Thay đổi việc thực thi hoặc xử lý đồng thời trả lời tự động
    - Giải thích các chế độ /queue hoặc hành vi điều hướng tin nhắn
summary: Các chế độ hàng đợi tự động trả lời, giá trị mặc định và tùy chỉnh theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-07-19T05:46:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 01a888217e8bcb9f379278d49943ce7b1d59e813a0f218c6b8c7f94c066b88d0
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw tuần tự hóa các lượt chạy tự động trả lời đến (tất cả các kênh) thông qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lượt chạy agent xung đột, đồng thời vẫn cho phép xử lý song song an toàn giữa các phiên.

## Lý do

- Các lượt chạy tự động trả lời có thể tốn nhiều tài nguyên (các lệnh gọi LLM) và có thể xung đột khi nhiều tin nhắn đến gần như đồng thời.
- Việc tuần tự hóa tránh tranh chấp tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm khả năng chạm giới hạn tốc độ của dịch vụ thượng nguồn.

## Cách hoạt động

- Một hàng đợi FIFO nhận biết làn xử lý từng làn với giới hạn đồng thời có thể cấu hình (mặc định là 1 cho các làn chưa được cấu hình; `main` mặc định là 4, `subagent` là 8).
- `runEmbeddedAgent` đưa vào hàng đợi theo **khóa phiên** (làn `session:<key>`) để bảo đảm mỗi phiên chỉ có một lượt chạy đang hoạt động.
- Sau đó, mỗi lượt chạy phiên được đưa vào một **làn toàn cục** (`main` theo mặc định), nhờ đó tổng mức song song được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lượt chạy trong hàng đợi sẽ phát một thông báo ngắn nếu phải chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (nếu kênh hỗ trợ), vì vậy trải nghiệm người dùng không thay đổi trong khi lượt chạy chờ đến lượt.

## Giá trị mặc định

Khi không được thiết lập, tất cả bề mặt kênh đến sử dụng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Điều hướng trong cùng lượt là chế độ mặc định. Một prompt đến giữa lượt chạy sẽ được đưa vào runtime đang hoạt động nếu lượt chạy đó có thể nhận điều hướng, vì vậy không khởi chạy lượt chạy phiên thứ hai. Nếu lượt chạy đang hoạt động không thể nhận điều hướng, OpenClaw sẽ chờ lượt chạy đó hoàn tất trước khi bắt đầu prompt.

## Chế độ hàng đợi

`/queue` kiểm soát cách xử lý các tin nhắn đến thông thường khi một phiên đã có lượt chạy đang hoạt động:

- `steer`: đưa tin nhắn vào runtime đang hoạt động. OpenClaw phân phối tất cả tin nhắn điều hướng đang chờ **sau khi lượt assistant hiện tại hoàn tất việc thực thi các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo; máy chủ ứng dụng Codex nhận một `turn/steer` theo lô. Nếu lượt chạy không chủ động truyền phát hoặc không có khả năng điều hướng, OpenClaw sẽ chờ đến khi lượt chạy đang hoạt động kết thúc rồi mới bắt đầu prompt.
- `followup`: không điều hướng. Đưa từng tin nhắn vào hàng đợi cho một lượt agent sau khi lượt chạy hiện tại kết thúc.
- `collect`: không điều hướng. Hợp nhất các tin nhắn trong hàng đợi thành **một** lượt tiếp nối duy nhất sau khoảng thời gian yên lặng. Nếu tin nhắn nhắm đến các kênh/luồng khác nhau, chúng sẽ được xử lý riêng để bảo toàn định tuyến.
- `interrupt`: hủy lượt chạy đang hoạt động của phiên đó, sau đó chạy tin nhắn mới nhất.

Để biết hành vi về thời điểm và phần phụ thuộc dành riêng cho runtime, hãy xem [Hàng đợi điều hướng](/vi/concepts/queue-steering). Đối với lệnh `/steer <message>` rõ ràng, hãy xem [Điều hướng](/vi/tools/steer).

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

Các tùy chọn áp dụng cho việc phân phối từ hàng đợi. `debounceMs` cũng thiết lập khoảng thời gian yên lặng cho điều hướng Codex ở chế độ `steer`:

- `debounceMs`: khoảng thời gian yên lặng trước khi xử lý các lượt tiếp nối hoặc lô thu thập trong hàng đợi; ở chế độ Codex `steer`, đây là khoảng thời gian yên lặng trước khi gửi `turn/steer` theo lô. Các số không kèm đơn vị được tính bằng mili giây; các đơn vị `ms`, `s`, `m`, `h` và `d` được các tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa trong hàng đợi cho mỗi phiên. Các giá trị nhỏ hơn `1` sẽ bị bỏ qua.
- `drop: "summarize"` (mặc định): loại bỏ các mục cũ nhất trong hàng đợi khi cần, giữ lại các bản tóm tắt cô đọng và đưa chúng vào dưới dạng prompt tiếp nối tổng hợp.
- `drop: "old"`: loại bỏ các mục cũ nhất trong hàng đợi khi cần mà không lưu bản tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Điều hướng và truyền phát

Khi chế độ truyền phát của kênh là `partial` hoặc `block`, điều hướng có thể trông giống như nhiều phản hồi ngắn hiển thị liên tiếp trong khi lượt chạy đang hoạt động đạt đến các ranh giới runtime:

- `partial`: bản xem trước có thể hoàn tất sớm, sau đó một bản xem trước mới bắt đầu khi điều hướng được chấp nhận.
- `block`: các khối có kích thước bản nháp có thể tạo ra hình thức tuần tự tương tự.
- Khi không truyền phát, điều hướng chuyển sang lượt tiếp nối sau lượt chạy đang hoạt động nếu runtime không thể nhận điều hướng trong cùng lượt.

`steer` không hủy các công cụ đang thực thi. Sử dụng `/queue interrupt` khi tin nhắn mới nhất cần hủy lượt chạy hiện tại.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải theo thứ tự:

1. Giá trị ghi đè `/queue` nội tuyến hoặc được lưu theo từng phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` mặc định.

Đối với các tùy chọn, tùy chọn `/queue` nội tuyến hoặc đã lưu được ưu tiên hơn cấu hình. Sau đó, độ trễ chống dội dành riêng cho kênh (`messages.queue.debounceMsByChannel`), giá trị mặc định chống dội của Plugin, tùy chọn `messages.queue` toàn cục và giá trị mặc định tích hợp sẵn được áp dụng theo thứ tự đó. `cap` và `drop` là các tùy chọn toàn cục/phiên, không phải khóa cấu hình theo từng kênh.

## Ghi đè theo từng phiên

- Gửi `/queue <steer|followup|collect|interrupt>` dưới dạng lệnh độc lập để lưu chế độ hàng đợi cho phiên hiện tại.
- Có thể kết hợp các tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` xóa giá trị ghi đè của phiên.

## Hủy lượt trong hàng đợi

Trong khi một prompt nằm trong hàng đợi tiếp nối/thu thập (ví dụ: một
`chat.send` từ TUI hoặc webchat đến trong khi một lượt khác đang hoạt động), Gateway duy trì một
**danh tính hủy do Gateway sở hữu** cho `runId` của máy khách đó cho đến khi nội dung trong hàng đợi
được chạy hoặc bị loại bỏ. Danh tính này đi theo nội dung được gộp vào một
bản tóm tắt tràn.

- `chat.abort` với một `runId` cụ thể sẽ hủy lượt đó khi nó vẫn còn
  trong hàng đợi, nếu bên yêu cầu được cấp quyền (cùng quy tắc sở hữu như các lượt chạy đang hoạt động).
- `chat.abort` cho một phiên không có `runId` sẽ hủy **các lượt được cấp quyền trong hàng đợi
  trước**, sau đó hủy các lượt chạy đang hoạt động được cấp quyền. Thứ tự này ngăn việc xử lý hàng đợi
  đẩy công việc vào một phiên chỉ dừng được một phần.
- Việc xóa toàn bộ hàng đợi của phiên mà không kiểm tra theo từng bên yêu cầu không phải là
  quy trình dừng dành cho các phiên có nhiều chủ sở hữu.
- Thời gian chờ trong hàng đợi không được biểu diễn dưới dạng lượt chạy agent đang hoạt động cho `sessions.list` và
  không sở hữu ngữ nghĩa thời gian chờ của lượt chạy đang hoạt động; chỉ giai đoạn hoạt động mới sở hữu.

Các máy khách sử dụng Gateway (bao gồm `openclaw tui`) chuyển tiếp prompt giữa lượt chạy và
để Gateway áp dụng chế độ hàng đợi. Esc/`/stop` sử dụng thao tác hủy theo phạm vi phiên
để việc mất các handle cục bộ không khiến một prompt vẫn còn trong hàng đợi tiếp tục chạy.

`openclaw chat` và `openclaw tui --local` áp dụng cùng bốn chế độ trong
runtime nhúng. `steer` cục bộ đưa vào một lượt chạy nhúng đang hoạt động khi
runtime đó chấp nhận điều hướng, nếu không sẽ trở thành một lượt tiếp nối; `followup` và
`collect` vẫn là công việc cục bộ đang chờ; `interrupt` hủy lượt chạy cục bộ đang hoạt động
trước khi bắt đầu tin nhắn mới nhất. Lệnh `/steer <message>` rõ ràng
không phải là lệnh chế độ cục bộ.

## Phạm vi và bảo đảm

- Áp dụng cho các lượt chạy agent tự động trả lời trên tất cả các kênh đến sử dụng pipeline trả lời của Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Làn mặc định (`main`) áp dụng trên toàn tiến trình cho các yêu cầu đến + Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại các làn bổ sung (ví dụ: `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn phản hồi đến. Các lượt agent Cron cô lập giữ một vị trí `cron` trong khi phần thực thi agent bên trong sử dụng `cron-nested`; cả hai đều sử dụng `cron.maxConcurrentRuns`. Các luồng `nested` dùng chung không phải Cron duy trì hành vi làn riêng. Các lượt chạy tách rời này được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).
- Các làn theo từng phiên bảo đảm tại một thời điểm chỉ có một lượt chạy agent thao tác trên một phiên nhất định.
- Không có phần phụ thuộc bên ngoài hoặc luồng worker nền; chỉ TypeScript + promise.

## Khắc phục sự cố

- Nếu các lệnh có vẻ bị kẹt, hãy bật nhật ký chi tiết và tìm các dòng "queued for ...ms" để xác nhận hàng đợi đang được xử lý.
- Các lượt chạy máy chủ ứng dụng Codex đã nhận một lượt rồi ngừng phát tiến trình sẽ bị adapter Codex ngắt để làn phiên đang hoạt động có thể được giải phóng thay vì chờ hết thời gian chờ của lượt chạy bên ngoài.
- Khi bật chẩn đoán, các phiên vẫn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` mà không quan sát thấy phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP sẽ được phân loại theo hoạt động hiện tại:
  - Công việc đang hoạt động có tiến trình gần đây được ghi nhật ký là `session.long_running`. Các lệnh gọi mô hình im lặng có chủ sở hữu cũng tiếp tục ở trạng thái `session.long_running` cho đến `diagnostics.stuckSessionAbortMs` để các nhà cung cấp chậm hoặc không truyền phát không bị báo cáo là đình trệ quá sớm.
  - Công việc đang hoạt động không có tiến trình gần đây được ghi nhật ký là `session.stalled`; các lệnh gọi mô hình có chủ sở hữu, lệnh gọi công cụ bị chặn và lượt chạy nhúng bị đình trệ chuyển sang `session.stalled` khi đạt hoặc vượt ngưỡng hủy. Hoạt động mô hình/công cụ cũ không có chủ sở hữu không bị che giấu dưới dạng hoạt động chạy dài.
  - `session.stuck` được dành riêng cho dữ liệu quản lý phiên cũ có thể khôi phục, bao gồm các phiên nhàn rỗi trong hàng đợi có hoạt động mô hình/công cụ cũ không có chủ sở hữu.
  - `session.stuck` luôn kích hoạt quá trình khôi phục có thể giải phóng làn phiên bị ảnh hưởng. Phân loại `session.stalled` kéo dài quá `diagnostics.stuckSessionAbortMs` (lệnh gọi công cụ bị chặn, lệnh gọi mô hình bị đình trệ hoặc lượt chạy nhúng bị đình trệ) cũng có thể kích hoạt quá trình khôi phục bằng cách hủy hoạt động, vì vậy cả hai phân loại đều có thể giải phóng hàng đợi bị kẹt, không chỉ `session.stuck`.
  - Các dòng nhật ký cảnh báo `session.stuck` và `session.long_running` lặp lại sẽ giảm tần suất theo cấp số nhân trong khi phiên không thay đổi; các lần thử khôi phục vẫn chạy ở mỗi nhịp Heartbeat bất kể cơ chế giảm tần suất đó.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Điều hướng](/vi/tools/steer)
- [Chính sách thử lại](/vi/concepts/retry)
