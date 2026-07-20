---
read_when:
    - Thay đổi cách thực thi hoặc mức đồng thời của tính năng tự động trả lời
    - Giải thích các chế độ /queue hoặc hành vi điều hướng tin nhắn
summary: Các chế độ hàng đợi tự động trả lời, giá trị mặc định và ghi đè theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-07-20T04:36:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 69b40f67146226b0315492b27fc9d2218cace8bbd1eaff6514f7efb33b69d763
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw tuần tự hóa các lượt tự động trả lời đến (trên tất cả các kênh) thông qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lượt chạy agent xung đột, đồng thời vẫn cho phép xử lý song song an toàn giữa các phiên.

## Lý do

- Các lượt tự động trả lời có thể tốn nhiều tài nguyên (lệnh gọi LLM) và có thể xung đột khi nhiều tin nhắn đến gần như đồng thời.
- Việc tuần tự hóa giúp tránh tranh chấp tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm nguy cơ gặp giới hạn tốc độ từ dịch vụ thượng nguồn.

## Cách hoạt động

- Một hàng đợi FIFO nhận biết lane xử lý từng lane theo giới hạn đồng thời có thể cấu hình (mặc định là 1 đối với các lane chưa được cấu hình; `main` mặc định là 4, `subagent` là 8).
- `runEmbeddedAgent` đưa vào hàng đợi theo **khóa phiên** (lane `session:<key>`) để bảo đảm mỗi phiên chỉ có một lượt chạy đang hoạt động.
- Sau đó, mỗi lượt chạy phiên được đưa vào một **lane toàn cục** (`main` theo mặc định), nhờ đó tổng mức xử lý song song được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lượt chạy trong hàng đợi sẽ phát một thông báo ngắn nếu phải chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn được kích hoạt ngay khi đưa vào hàng đợi (nếu kênh hỗ trợ), vì vậy trải nghiệm người dùng không thay đổi trong lúc lượt chạy chờ đến lượt.

## Giá trị mặc định

Khi không được thiết lập, tất cả các bề mặt kênh đến sử dụng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Điều hướng trong cùng lượt là hành vi mặc định. Một prompt đến giữa lượt chạy sẽ được đưa vào runtime đang hoạt động nếu lượt chạy có thể chấp nhận điều hướng, vì vậy không khởi chạy lượt chạy phiên thứ hai. Nếu lượt chạy đang hoạt động không thể chấp nhận điều hướng, OpenClaw sẽ chờ lượt chạy đó hoàn tất rồi mới bắt đầu prompt.

## Chế độ hàng đợi

`/queue` kiểm soát cách xử lý các tin nhắn đến thông thường khi một phiên đã có lượt chạy đang hoạt động:

- `steer`: đưa tin nhắn vào runtime đang hoạt động. OpenClaw chuyển tất cả tin nhắn điều hướng đang chờ **sau khi lượt assistant hiện tại hoàn tất việc thực thi các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo; app-server Codex nhận một `turn/steer` được gom nhóm. Nếu lượt chạy không chủ động truyền phát hoặc không hỗ trợ điều hướng, OpenClaw sẽ chờ đến khi lượt chạy đang hoạt động kết thúc rồi mới bắt đầu prompt.
- `followup`: không điều hướng. Đưa từng tin nhắn vào hàng đợi để xử lý trong một lượt agent sau khi lượt chạy hiện tại kết thúc.
- `collect`: không điều hướng. Gộp các tin nhắn trong hàng đợi thành **một** lượt tiếp nối duy nhất sau khoảng thời gian yên lặng. Nếu các tin nhắn nhắm đến các kênh/luồng khác nhau, chúng sẽ được xử lý riêng để bảo toàn định tuyến.
- `interrupt`: hủy lượt chạy đang hoạt động của phiên đó, rồi chạy tin nhắn mới nhất.

Để biết hành vi phụ thuộc và thời điểm dành riêng cho từng runtime, hãy xem [Hàng đợi điều hướng](/vi/concepts/queue-steering). Đối với lệnh `/steer <message>` tường minh, hãy xem [Điều hướng](/vi/tools/steer).

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

Các tùy chọn áp dụng cho việc chuyển nội dung trong hàng đợi. `debounceMs` cũng thiết lập khoảng thời gian yên lặng để điều hướng Codex trong chế độ `steer`:

- `debounceMs`: khoảng thời gian yên lặng trước khi xử lý các lượt tiếp nối trong hàng đợi hoặc các lô thu thập; trong chế độ `steer` của Codex, đây là khoảng thời gian yên lặng trước khi gửi `turn/steer` được gom nhóm. Các số không có đơn vị được hiểu là mili giây; các đơn vị `ms`, `s`, `m`, `h` và `d` được các tùy chọn `/queue` chấp nhận.
- `cap`: số tin nhắn tối đa trong hàng đợi cho mỗi phiên. Các giá trị nhỏ hơn `1` bị bỏ qua.
- `drop: "summarize"` (mặc định): loại bỏ các mục cũ nhất trong hàng đợi khi cần, giữ lại các bản tóm tắt cô đọng và đưa chúng vào dưới dạng một prompt tiếp nối tổng hợp.
- `drop: "old"`: loại bỏ các mục cũ nhất trong hàng đợi khi cần mà không giữ lại bản tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Giá trị mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Điều hướng và truyền phát

Khi chế độ truyền phát của kênh là `partial` hoặc `block`, điều hướng có thể hiển thị giống như nhiều phản hồi ngắn trong lúc lượt chạy đang hoạt động đạt đến các ranh giới runtime:

- `partial`: bản xem trước có thể hoàn tất sớm, sau đó một bản xem trước mới bắt đầu khi điều hướng được chấp nhận.
- `block`: các khối có kích thước bản nháp có thể tạo ra cách hiển thị tuần tự tương tự.
- Nếu không truyền phát, điều hướng sẽ chuyển thành một lượt tiếp nối sau lượt chạy đang hoạt động khi runtime không thể chấp nhận điều hướng trong cùng lượt.

`steer` không hủy các công cụ đang thực thi. Sử dụng `/queue interrupt` khi tin nhắn mới nhất cần hủy lượt chạy hiện tại.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải theo thứ tự:

1. Giá trị ghi đè `/queue` nội tuyến hoặc được lưu theo từng phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` mặc định.

Đối với các tùy chọn, tùy chọn `/queue` nội tuyến hoặc được lưu sẽ được ưu tiên hơn cấu hình. Sau đó, độ trễ chống dội dành riêng cho kênh (`messages.queue.debounceMsByChannel`), giá trị mặc định chống dội của plugin, tùy chọn `messages.queue` toàn cục và giá trị mặc định tích hợp được áp dụng theo thứ tự đó. `cap` và `drop` là các tùy chọn toàn cục/phiên, không phải khóa cấu hình theo kênh.

## Giá trị ghi đè theo phiên

- Gửi `/queue <steer|followup|collect|interrupt>` dưới dạng một lệnh độc lập để lưu chế độ hàng đợi cho phiên hiện tại.
- Có thể kết hợp các tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` sẽ xóa giá trị ghi đè của phiên.

## Hủy lượt trong hàng đợi

Trong khi một prompt nằm trong hàng đợi tiếp nối/thu thập (ví dụ: một `chat.send` từ TUI hoặc
webchat đến khi một lượt khác đang hoạt động), Gateway duy trì một
**danh tính hủy do Gateway sở hữu** cho `runId` của client đó cho đến khi nội dung
trong hàng đợi chạy hoặc bị loại bỏ. Danh tính này đi theo nội dung được gộp vào một
bản tóm tắt tràn.

- `chat.abort` với một `runId` cụ thể sẽ hủy lượt đó khi lượt vẫn còn
  trong hàng đợi, nếu bên yêu cầu được ủy quyền (cùng quy tắc sở hữu như các lượt chạy đang hoạt động).
- `chat.abort` cho một phiên không có `runId` sẽ hủy **các lượt trong hàng đợi được ủy quyền
  trước**, sau đó hủy các lượt chạy đang hoạt động được ủy quyền. Thứ tự này ngăn việc xử lý hàng đợi
  đưa công việc vào một phiên chỉ mới dừng một phần.
- Xóa toàn bộ hàng đợi của phiên mà không kiểm tra theo từng bên yêu cầu không phải là
  quy trình dừng dành cho các phiên có nhiều chủ sở hữu.
- Thời gian chờ trong hàng đợi không được biểu diễn thành các lượt chạy agent đang hoạt động đối với `sessions.list` và
  không sở hữu ngữ nghĩa hết thời gian của lượt chạy đang hoạt động; chỉ giai đoạn hoạt động mới có.

Các client dựa trên Gateway (bao gồm `openclaw tui`) chuyển tiếp các prompt giữa lượt chạy và
để Gateway áp dụng chế độ hàng đợi. Esc/`/stop` sử dụng thao tác hủy ở phạm vi phiên
để việc mất các handle cục bộ không khiến một prompt vẫn còn trong hàng đợi tiếp tục chạy.

`openclaw chat` và `openclaw tui --local` áp dụng cùng bốn chế độ trong
runtime nhúng. `steer` cục bộ đưa nội dung vào một lượt chạy nhúng đang hoạt động khi
runtime đó chấp nhận điều hướng và nếu không thì trở thành một lượt tiếp nối; `followup` và
`collect` vẫn là công việc cục bộ đang chờ; `interrupt` hủy lượt chạy cục bộ đang hoạt động
trước khi bắt đầu tin nhắn mới nhất. Lệnh `/steer <message>` tường minh
không phải là lệnh chế độ cục bộ.

## Phạm vi và bảo đảm

- Áp dụng cho các lượt chạy agent tự động trả lời trên tất cả các kênh đến sử dụng pipeline phản hồi của Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, v.v.).
- Lane mặc định (`main`) áp dụng trên toàn tiến trình đối với lưu lượng đến và các Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại các lane bổ sung (ví dụ: `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn phản hồi đến. Các lượt agent cron cô lập giữ một vị trí `cron` trong khi quá trình thực thi agent bên trong sử dụng `cron-nested`. Các luồng `nested` dùng chung không phải cron giữ nguyên hành vi lane riêng. Các lượt chạy tách rời này được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).
- Các lane theo phiên bảo đảm mỗi lần chỉ có một lượt chạy agent thao tác trên một phiên nhất định.
- Không có phần phụ thuộc bên ngoài hoặc luồng worker nền; chỉ dùng TypeScript + promise.

## Khắc phục sự cố

- Nếu các lệnh có vẻ bị kẹt, hãy bật nhật ký chi tiết và tìm các dòng "queued for ...ms" để xác nhận hàng đợi đang được xử lý.
- Các lượt chạy app-server Codex chấp nhận một lượt rồi ngừng phát tiến trình sẽ bị adapter Codex ngắt để lane phiên đang hoạt động có thể được giải phóng thay vì chờ hết thời gian của lượt chạy bên ngoài.
- Khi bật chẩn đoán, các phiên vẫn ở trạng thái `processing` quá ngưỡng cảnh báo tích hợp mà không ghi nhận phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP sẽ được phân loại theo hoạt động hiện tại:
  - Công việc đang hoạt động có tiến trình gần đây được ghi nhật ký là `session.long_running`. Các lệnh gọi mô hình im lặng có chủ sở hữu cũng giữ trạng thái `session.long_running` cho đến ngưỡng hủy tích hợp để các nhà cung cấp chậm hoặc không truyền phát không bị báo cáo là đình trệ quá sớm.
  - Công việc đang hoạt động nhưng không có tiến trình gần đây được ghi nhật ký là `session.stalled`; các lệnh gọi mô hình có chủ sở hữu, lệnh gọi công cụ bị chặn và lượt chạy nhúng bị đình trệ chuyển sang `session.stalled` tại hoặc sau ngưỡng hủy. Hoạt động mô hình/công cụ cũ không có chủ sở hữu không bị che giấu dưới dạng hoạt động kéo dài.
  - `session.stuck` được dành riêng cho trạng thái theo dõi phiên cũ có thể khôi phục, bao gồm các phiên đang chờ trong hàng đợi nhưng không hoạt động với hoạt động mô hình/công cụ cũ không có chủ sở hữu.
  - `session.stuck` luôn kích hoạt quá trình khôi phục có thể giải phóng lane phiên bị ảnh hưởng. Phân loại `session.stalled` quá ngưỡng hủy (lệnh gọi công cụ bị chặn, lệnh gọi mô hình bị đình trệ hoặc lượt chạy nhúng bị đình trệ) cũng có thể kích hoạt khôi phục bằng cách hủy hoạt động, vì vậy cả hai phân loại đều có thể giải phóng hàng đợi bị kẹt, không chỉ `session.stuck`.
  - Các dòng nhật ký cảnh báo `session.stuck` và `session.long_running` lặp lại sẽ tăng thời gian chờ theo cấp số nhân khi phiên không thay đổi; các lần thử khôi phục vẫn chạy ở mỗi nhịp Heartbeat bất kể cơ chế tăng thời gian chờ đó.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Điều hướng](/vi/tools/steer)
- [Chính sách thử lại](/vi/concepts/retry)
