---
read_when:
    - Thay đổi cách thực thi hoặc mức độ đồng thời của tính năng tự động trả lời
    - Giải thích các chế độ `/queue` hoặc hành vi điều hướng tin nhắn
summary: Các chế độ hàng đợi tự động trả lời, giá trị mặc định và tùy chỉnh theo từng phiên
title: Hàng đợi lệnh
x-i18n:
    generated_at: "2026-07-12T07:49:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw tuần tự hóa các lượt chạy tự động trả lời đến (trên tất cả các kênh) thông qua một hàng đợi nhỏ trong tiến trình để ngăn nhiều lượt chạy tác tử xung đột với nhau, đồng thời vẫn cho phép xử lý song song an toàn giữa các phiên.

## Lý do

- Các lượt chạy tự động trả lời có thể tốn nhiều tài nguyên (lệnh gọi LLM) và có thể xung đột khi nhiều tin nhắn đến gần như cùng lúc.
- Việc tuần tự hóa tránh tranh chấp tài nguyên dùng chung (tệp phiên, nhật ký, stdin của CLI) và giảm nguy cơ chạm giới hạn tốc độ của dịch vụ thượng nguồn.

## Cách hoạt động

- Một hàng đợi FIFO nhận biết làn xử lý sẽ rút từng làn với giới hạn đồng thời có thể cấu hình (mặc định là 1 đối với các làn chưa được cấu hình; `main` mặc định là 4, `subagent` là 8).
- `runEmbeddedAgent` đưa tác vụ vào hàng đợi theo **khóa phiên** (làn `session:<key>`) để bảo đảm mỗi phiên chỉ có một lượt chạy đang hoạt động.
- Sau đó, mỗi lượt chạy phiên được đưa vào một **làn toàn cục** (mặc định là `main`) để mức xử lý song song tổng thể được giới hạn bởi `agents.defaults.maxConcurrent`.
- Khi bật ghi nhật ký chi tiết, các lượt chạy trong hàng đợi sẽ phát một thông báo ngắn nếu phải chờ hơn khoảng 2 giây trước khi bắt đầu.
- Chỉ báo đang nhập vẫn kích hoạt ngay khi đưa vào hàng đợi (nếu kênh hỗ trợ), nên trải nghiệm người dùng không thay đổi trong lúc lượt chạy chờ đến lượt.

## Giá trị mặc định

Khi không được đặt, mọi bề mặt kênh đến đều sử dụng:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Điều hướng trong cùng lượt là hành vi mặc định. Một lời nhắc đến giữa lúc đang chạy sẽ được chèn vào môi trường thực thi đang hoạt động nếu lượt chạy có thể nhận điều hướng, vì vậy không khởi động lượt chạy phiên thứ hai. Nếu lượt chạy đang hoạt động không thể nhận điều hướng, OpenClaw sẽ chờ lượt chạy đó hoàn tất trước khi bắt đầu xử lý lời nhắc.

## Chế độ hàng đợi

`/queue` kiểm soát cách xử lý các tin nhắn đến thông thường khi một phiên đã có lượt chạy đang hoạt động:

- `steer`: chèn tin nhắn vào môi trường thực thi đang hoạt động. OpenClaw chuyển tất cả tin nhắn điều hướng đang chờ **sau khi lượt phản hồi hiện tại của trợ lý thực thi xong các lệnh gọi công cụ**, trước lệnh gọi LLM tiếp theo; máy chủ ứng dụng Codex nhận một `turn/steer` được gộp. Nếu lượt chạy không chủ động truyền luồng hoặc không thể điều hướng, OpenClaw sẽ chờ lượt chạy đang hoạt động kết thúc trước khi bắt đầu xử lý lời nhắc.
- `followup`: không điều hướng. Đưa từng tin nhắn vào hàng đợi để xử lý trong một lượt tác tử sau đó, khi lượt chạy hiện tại kết thúc.
- `collect`: không điều hướng. Gộp các tin nhắn trong hàng đợi thành **một** lượt tiếp nối duy nhất sau khoảng thời gian yên lặng. Nếu các tin nhắn nhắm đến các kênh/luồng khác nhau, chúng sẽ được rút riêng để giữ nguyên định tuyến.
- `interrupt`: hủy lượt chạy đang hoạt động của phiên đó, rồi chạy tin nhắn mới nhất.

Để biết thời điểm và hành vi phụ thuộc cụ thể theo môi trường thực thi, hãy xem [Hàng đợi điều hướng](/vi/concepts/queue-steering). Đối với lệnh tường minh `/steer <message>`, hãy xem [Điều hướng](/vi/tools/steer).

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

Các tùy chọn áp dụng cho việc chuyển nội dung trong hàng đợi. `debounceMs` cũng đặt khoảng thời gian yên lặng cho điều hướng Codex ở chế độ `steer`:

- `debounceMs`: khoảng thời gian yên lặng trước khi rút các lượt tiếp nối hoặc lô thu thập trong hàng đợi; ở chế độ `steer` của Codex, đây là khoảng thời gian yên lặng trước khi gửi `turn/steer` được gộp. Các số không kèm đơn vị được tính bằng mili giây; các đơn vị `ms`, `s`, `m`, `h` và `d` được chấp nhận trong tùy chọn `/queue`.
- `cap`: số tin nhắn tối đa trong hàng đợi của mỗi phiên. Các giá trị nhỏ hơn `1` bị bỏ qua.
- `drop: "summarize"` (mặc định): loại bỏ các mục cũ nhất trong hàng đợi khi cần, giữ lại các bản tóm tắt ngắn gọn và chèn chúng dưới dạng lời nhắc tiếp nối tổng hợp.
- `drop: "old"`: loại bỏ các mục cũ nhất trong hàng đợi khi cần mà không giữ lại bản tóm tắt.
- `drop: "new"`: từ chối tin nhắn mới nhất khi hàng đợi đã đầy.

Mặc định: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Điều hướng và truyền luồng

Khi chế độ truyền luồng của kênh là `partial` hoặc `block`, hoạt động điều hướng có thể trông giống như nhiều câu trả lời ngắn hiển thị liên tiếp khi lượt chạy đang hoạt động đạt đến các ranh giới của môi trường thực thi:

- `partial`: bản xem trước có thể kết thúc sớm, sau đó một bản xem trước mới bắt đầu khi điều hướng được chấp nhận.
- `block`: các khối có kích thước tương đương bản nháp có thể tạo ra hình thức tuần tự tương tự.
- Khi không truyền luồng, hoạt động điều hướng sẽ chuyển thành một lượt tiếp nối sau lượt chạy đang hoạt động nếu môi trường thực thi không thể chấp nhận điều hướng trong cùng lượt.

`steer` không hủy các công cụ đang thực thi. Hãy dùng `/queue interrupt` khi tin nhắn mới nhất cần hủy lượt chạy hiện tại.

## Thứ tự ưu tiên

Để chọn chế độ, OpenClaw phân giải theo thứ tự:

1. Ghi đè `/queue` nội tuyến hoặc đã lưu theo từng phiên.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Giá trị mặc định `steer`.

Đối với các tùy chọn, tùy chọn `/queue` nội tuyến hoặc đã lưu được ưu tiên hơn cấu hình. Sau đó, thời gian chống dội riêng theo kênh (`messages.queue.debounceMsByChannel`), giá trị chống dội mặc định của Plugin, các tùy chọn `messages.queue` toàn cục và giá trị mặc định tích hợp sẵn được áp dụng theo thứ tự đó. `cap` và `drop` là các tùy chọn toàn cục/phiên, không phải khóa cấu hình theo từng kênh.

## Ghi đè theo từng phiên

- Gửi `/queue <steer|followup|collect|interrupt>` dưới dạng một lệnh độc lập để lưu chế độ hàng đợi cho phiên hiện tại.
- Có thể kết hợp các tùy chọn: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` hoặc `/queue reset` sẽ xóa ghi đè của phiên.

## Hủy lượt trong hàng đợi

Khi một lời nhắc nằm trong hàng đợi tiếp nối/thu thập (ví dụ: một lệnh `chat.send` từ TUI hoặc trò chuyện web đến trong khi một lượt khác đang hoạt động), Gateway giữ một **định danh hủy do Gateway sở hữu** cho `runId` của máy khách đó cho đến khi nội dung trong hàng đợi được chạy hoặc bị loại bỏ. Định danh này đi theo nội dung được gộp vào bản tóm tắt tràn hàng đợi.

- `chat.abort` với một `runId` cụ thể sẽ hủy lượt đó khi nó vẫn còn trong hàng đợi, nếu bên yêu cầu được ủy quyền (theo cùng các quy tắc sở hữu như lượt chạy đang hoạt động).
- `chat.abort` cho một phiên không có `runId` sẽ hủy **các lượt trong hàng đợi được ủy quyền trước**, sau đó hủy các lượt chạy đang hoạt động được ủy quyền. Thứ tự này ngăn việc rút hàng đợi đẩy tác vụ vào một phiên mới chỉ dừng một phần.
- Việc xóa toàn bộ hàng đợi của phiên mà không kiểm tra theo từng bên yêu cầu không phải là đường dẫn dừng dành cho các phiên có nhiều chủ sở hữu.
- Thời gian chờ trong hàng đợi không được biểu diễn thành lượt chạy tác tử đang hoạt động trong `sessions.list` và không sở hữu ngữ nghĩa thời gian chờ của lượt chạy đang hoạt động; chỉ giai đoạn đang hoạt động mới có.

Các máy khách (bao gồm TUI) chuyển tiếp lời nhắc đến giữa lượt chạy và để Gateway áp dụng chế độ hàng đợi. Esc/`/stop` sử dụng thao tác hủy trong phạm vi phiên để các tham chiếu cục bộ bị mất không thể khiến một lời nhắc vẫn còn trong hàng đợi tiếp tục chạy.

## Phạm vi và bảo đảm

- Áp dụng cho các lượt chạy tác tử tự động trả lời trên tất cả các kênh đến sử dụng quy trình phản hồi của Gateway (web WhatsApp, Telegram, Slack, Discord, Signal, iMessage, trò chuyện web, v.v.).
- Làn mặc định (`main`) áp dụng trên toàn tiến trình cho các yêu cầu đến và Heartbeat chính; đặt `agents.defaults.maxConcurrent` để cho phép nhiều phiên chạy song song.
- Có thể tồn tại các làn bổ sung (ví dụ: `cron`, `cron-nested`, `nested`, `subagent`) để các tác vụ nền có thể chạy song song mà không chặn phản hồi đến. Các lượt tác tử Cron biệt lập giữ một vị trí `cron`, trong khi quá trình thực thi tác tử bên trong dùng `cron-nested`; cả hai đều dùng `cron.maxConcurrentRuns`. Các luồng `nested` dùng chung không thuộc Cron duy trì hành vi làn riêng. Các lượt chạy tách rời này được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).
- Các làn theo từng phiên bảo đảm mỗi lần chỉ có một lượt chạy tác tử truy cập một phiên cụ thể.
- Không có phụ thuộc bên ngoài hoặc luồng thực thi nền; chỉ sử dụng TypeScript + promise.

## Khắc phục sự cố

- Nếu các lệnh có vẻ bị kẹt, hãy bật nhật ký chi tiết và tìm các dòng `"queued for ...ms"` để xác nhận hàng đợi đang được rút.
- Các lượt chạy máy chủ ứng dụng Codex đã chấp nhận một lượt nhưng sau đó ngừng phát tiến trình sẽ bị bộ điều hợp Codex ngắt để làn phiên đang hoạt động có thể được giải phóng thay vì chờ hết thời gian của lượt chạy bên ngoài.
- Khi bật chẩn đoán, các phiên vẫn ở trạng thái `processing` quá `diagnostics.stuckSessionWarnMs` mà không ghi nhận phản hồi, công cụ, trạng thái, khối hoặc tiến trình ACP sẽ được phân loại theo hoạt động hiện tại:
  - Công việc đang hoạt động có tiến trình gần đây được ghi nhật ký dưới dạng `session.long_running`. Các lệnh gọi mô hình im lặng có chủ sở hữu cũng vẫn ở trạng thái `session.long_running` cho đến `diagnostics.stuckSessionAbortMs`, để các nhà cung cấp chậm hoặc không truyền luồng không bị báo cáo là đình trệ quá sớm.
  - Công việc đang hoạt động không có tiến trình gần đây được ghi nhật ký dưới dạng `session.stalled`; các lệnh gọi mô hình có chủ sở hữu, lệnh gọi công cụ bị chặn và lượt chạy nhúng bị đình trệ sẽ chuyển sang `session.stalled` khi đạt hoặc vượt ngưỡng hủy. Hoạt động mô hình/công cụ cũ không có chủ sở hữu không bị che giấu dưới dạng đang chạy lâu.
  - `session.stuck` được dành riêng cho trạng thái ghi sổ phiên cũ có thể khôi phục, bao gồm các phiên nhàn rỗi trong hàng đợi có hoạt động mô hình/công cụ cũ không có chủ sở hữu.
  - `session.stuck` luôn kích hoạt quá trình khôi phục có thể giải phóng làn phiên bị ảnh hưởng. Phân loại `session.stalled` vượt quá `diagnostics.stuckSessionAbortMs` (lệnh gọi công cụ bị chặn, lệnh gọi mô hình bị đình trệ hoặc lượt chạy nhúng bị đình trệ) cũng có thể kích hoạt khôi phục bằng cách hủy chủ động, vì vậy cả hai phân loại đều có thể gỡ kẹt hàng đợi, không chỉ `session.stuck`.
  - Các dòng nhật ký cảnh báo `session.stuck` và `session.long_running` lặp lại sẽ giãn cách theo cấp số nhân trong khi phiên không thay đổi; các lần thử khôi phục vẫn chạy ở mỗi nhịp Heartbeat bất kể cơ chế giãn cách đó.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Hàng đợi điều hướng](/vi/concepts/queue-steering)
- [Điều hướng](/vi/tools/steer)
- [Chính sách thử lại](/vi/concepts/retry)
