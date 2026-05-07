---
read_when:
    - Bạn muốn các tác vụ đã lên lịch và các lần đánh thức
    - Bạn đang gỡ lỗi quá trình thực thi Cron và nhật ký
summary: Tài liệu tham khảo CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các công việc Cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem toàn bộ bề mặt lệnh. Xem [Công việc Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

## Phiên

`--session` chấp nhận `main`, `isolated`, `current`, hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Khóa phiên">
    - `main` liên kết với phiên chính của agent.
    - `isolated` tạo một transcript mới và id phiên mới cho mỗi lần chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững rõ ràng.

  </Accordion>
  <Accordion title="Ngữ nghĩa phiên cô lập">
    Các lần chạy cô lập đặt lại ngữ cảnh hội thoại xung quanh. Định tuyến kênh và nhóm, chính sách gửi/xếp hàng, nâng quyền, nguồn gốc và liên kết runtime ACP được đặt lại cho lần chạy mới. Các tùy chọn an toàn và model do người dùng chọn rõ ràng hoặc ghi đè xác thực có thể được chuyển tiếp giữa các lần chạy.
  </Accordion>
</AccordionGroup>

## Phân phối

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến phân phối đã phân giải. Với `channel: "last"`, bản xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ đóng thất bại.

Các đích có tiền tố nhà cung cấp có thể phân biệt các kênh thông báo chưa phân giải. Ví dụ, `to: "telegram:123"` chọn Telegram khi `delivery.channel` bị bỏ qua hoặc là `last`. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` là rõ ràng, tiền tố phải khớp với kênh đó; `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối. Các tiền tố dịch vụ như `imessage:` và `sms:` vẫn là cú pháp đích do kênh sở hữu.

<Note>
Các công việc `cron add` cô lập mặc định dùng phân phối `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn là bí danh đã lỗi thời cho `--announce`.
</Note>

### Quyền sở hữu phân phối

Phân phối trò chuyện Cron cô lập được chia sẻ giữa agent và trình chạy:

- Agent có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
- `announce` chỉ phân phối dự phòng câu trả lời cuối cùng khi agent chưa gửi trực tiếp đến đích đã phân giải.
- `webhook` đăng payload đã hoàn tất đến một URL.
- `none` tắt phân phối dự phòng của trình chạy.

`--announce` là phân phối dự phòng của trình chạy cho câu trả lời cuối cùng. `--no-deliver` tắt dự phòng đó nhưng không loại bỏ công cụ `message` của agent khi có tuyến trò chuyện.

Các lời nhắc được tạo từ một cuộc trò chuyện đang hoạt động sẽ giữ lại đích phân phối trò chuyện trực tiếp để phân phối thông báo dự phòng. Khóa phiên nội bộ có thể là chữ thường; không dùng chúng làm nguồn sự thật cho các ID nhà cung cấp phân biệt chữ hoa chữ thường như ID phòng Matrix.

### Phân phối khi thất bại

Thông báo thất bại được phân giải theo thứ tự này:

1. `delivery.failureDestination` trên công việc.
2. `cron.failureDestination` toàn cục.
3. Đích thông báo chính của công việc (khi không đặt đích thất bại rõ ràng).

<Note>
Các công việc phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ phân phối chính là `webhook`. Các công việc cô lập chấp nhận tùy chọn này trong mọi chế độ.
</Note>

Lưu ý: các lần chạy Cron cô lập xem lỗi agent cấp lần chạy là lỗi công việc ngay cả khi
không tạo payload trả lời, vì vậy lỗi model/nhà cung cấp vẫn tăng bộ đếm lỗi
và kích hoạt thông báo thất bại.

## Lập lịch

### Công việc chạy một lần

`--at <datetime>` lập lịch một lần chạy duy nhất. Datetime không có độ lệch được xem là UTC trừ khi bạn cũng truyền `--tz <iana>`, khi đó thời gian đồng hồ treo tường được diễn giải theo múi giờ đã cho.

<Note>
Theo mặc định, công việc chạy một lần sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại chúng.
</Note>

### Công việc lặp lại

Công việc lặp lại dùng backoff thử lại lũy thừa sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, 60m. Lịch sẽ trở lại bình thường sau lần chạy thành công tiếp theo.

Các lần chạy bị bỏ qua được theo dõi tách biệt với lỗi thực thi. Chúng không ảnh hưởng đến backoff thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể chọn đưa cảnh báo thất bại vào các thông báo lặp lại về lần chạy bị bỏ qua.

Với các công việc cô lập nhắm tới một nhà cung cấp model cục bộ đã cấu hình, Cron chạy một bước kiểm tra sơ bộ nhà cung cấp nhẹ trước khi bắt đầu lượt agent. Các nhà cung cấp local loopback, mạng riêng và `.local` `api: "ollama"` được thăm dò tại `/api/tags`; các nhà cung cấp tương thích OpenAI cục bộ như vLLM, SGLang và LM Studio được thăm dò tại `/models`. Nếu endpoint không truy cập được, lần chạy được ghi nhận là `skipped` và được thử lại trong một lịch sau đó; các endpoint chết khớp sẽ được lưu bộ nhớ đệm trong 5 phút để tránh nhiều công việc dồn yêu cầu vào cùng một máy chủ cục bộ.

Lưu ý: định nghĩa công việc Cron nằm trong `jobs.json`, còn trạng thái runtime đang chờ nằm trong `jobs-state.json`. Nếu `jobs.json` được chỉnh sửa từ bên ngoài, Gateway tải lại các lịch đã thay đổi và xóa các slot đang chờ đã cũ; các lần ghi lại chỉ thay đổi định dạng không xóa slot đang chờ.

### Chạy thủ công

`openclaw cron run` trả về ngay khi lần chạy thủ công được xếp hàng. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `openclaw cron runs --id <job-id>` để theo dõi kết quả cuối cùng.

<Note>
`openclaw cron run <job-id>` mặc định chạy cưỡng bức. Dùng `--due` để giữ hành vi cũ "chỉ chạy nếu đến hạn".
</Note>

## Model

`cron add|edit --model <ref>` chọn một model được phép cho công việc.

<Warning>
Nếu model không được phép hoặc không thể phân giải, Cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì rơi về lựa chọn model của agent trong công việc hoặc model mặc định.
</Warning>

Cron `--model` là **model chính của công việc**, không phải ghi đè `/model` của phiên trò chuyện. Điều đó có nghĩa là:

- Các fallback model đã cấu hình vẫn áp dụng khi model công việc đã chọn thất bại.
- `fallbacks` trong payload theo công việc thay thế danh sách fallback đã cấu hình khi có mặt.
- Danh sách fallback theo công việc rỗng (`fallbacks: []` trong payload/API của công việc) làm lần chạy Cron nghiêm ngặt.
- Khi một công việc có `--model` nhưng không cấu hình danh sách fallback, OpenClaw truyền một ghi đè fallback rỗng rõ ràng để model chính của agent không được thêm vào như một đích thử lại ẩn.

### Thứ tự ưu tiên model của Cron cô lập

Cron cô lập phân giải model đang hoạt động theo thứ tự này:

1. Ghi đè Gmail-hook.
2. `--model` theo công việc.
3. Ghi đè model phiên Cron đã lưu (khi người dùng đã chọn một model).
4. Lựa chọn model của agent hoặc mặc định.

### Chế độ nhanh

Chế độ nhanh của Cron cô lập tuân theo lựa chọn model trực tiếp đã phân giải. Cấu hình model `params.fastMode` áp dụng theo mặc định, nhưng ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình.

### Thử lại chuyển model trực tiếp

Nếu một lần chạy cô lập ném `LiveSessionModelSwitchError`, Cron lưu nhà cung cấp và model đã chuyển (và ghi đè hồ sơ xác thực đã chuyển khi có) cho lần chạy đang hoạt động trước khi thử lại. Vòng lặp thử lại bên ngoài bị giới hạn ở hai lần thử lại chuyển đổi sau lần thử ban đầu, rồi hủy thay vì lặp mãi.

## Đầu ra lần chạy và từ chối

### Chặn xác nhận cũ

Các lượt Cron cô lập chặn các câu trả lời chỉ xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời và không có lần chạy subagent hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, Cron nhắc lại một lần để lấy kết quả thật trước khi phân phối.

### Chặn token im lặng

Nếu một lần chạy Cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), Cron chặn cả phân phối trực tiếp ra ngoài lẫn đường dẫn tóm tắt xếp hàng dự phòng, nên sẽ không có gì được đăng lại vào trò chuyện.

### Từ chối có cấu trúc

Các lần chạy Cron cô lập ưu tiên siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, sau đó rơi về các dấu hiệu từ chối đã biết trong đầu ra cuối cùng, chẳng hạn như `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, và các cụm từ từ chối liên kết phê duyệt.

`cron list` và lịch sử lần chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Lưu giữ và cắt tỉa được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cô lập đã hoàn tất.
- `cron.runLog.maxBytes` và `cron.runLog.keepLines` cắt tỉa `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Di chuyển các công việc cũ hơn

<Note>
Nếu bạn có công việc Cron từ trước định dạng phân phối và lưu trữ hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường Cron cũ (`jobId`, `schedule.cron`, các trường phân phối cấp cao nhất bao gồm `threadId` cũ, bí danh phân phối `provider` trong payload) và di chuyển các công việc fallback Webhook đơn giản `notify: true` sang phân phối Webhook rõ ràng khi `cron.webhook` được cấu hình.
</Note>

## Các chỉnh sửa phổ biến

Cập nhật cài đặt phân phối mà không thay đổi thông điệp:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Tắt phân phối cho một công việc cô lập:

```bash
openclaw cron edit <job-id> --no-deliver
```

Bật ngữ cảnh bootstrap nhẹ cho một công việc cô lập:

```bash
openclaw cron edit <job-id> --light-context
```

Thông báo đến một kênh cụ thể:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Thông báo đến một chủ đề diễn đàn Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Tạo một công việc cô lập với ngữ cảnh bootstrap nhẹ:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` chỉ áp dụng cho các công việc lượt agent cô lập. Với các lần chạy Cron, chế độ nhẹ giữ ngữ cảnh bootstrap trống thay vì chèn toàn bộ tập bootstrap của workspace.

## Các lệnh quản trị phổ biến

Chạy thủ công và kiểm tra:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` mặc định hiển thị tất cả công việc khớp. Truyền `--agent <id>` để chỉ hiển thị các công việc có id agent hiệu dụng đã chuẩn hóa khớp; các công việc không có id agent đã lưu được tính là agent mặc định đã cấu hình.

`cron list --json` và `cron show <job-id> --json` bao gồm trường cấp cao nhất `status` trên mỗi công việc, được tính từ `enabled`, `state.runningAtMs`, và `state.lastRunStatus`. Giá trị: `disabled`, `running`, `ok`, `error`, `skipped`, hoặc `idle`. Trường này phản ánh cột trạng thái dễ đọc cho con người để công cụ bên ngoài có thể đọc trạng thái công việc mà không phải tự suy diễn lại.

Các mục `cron runs` bao gồm chẩn đoán phân phối với đích Cron dự định, đích đã phân giải, các lần gửi bằng công cụ message, việc dùng fallback và trạng thái đã phân phối.

Chuyển đích agent và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` cảnh báo khi `--agent` bị bỏ qua trên các công việc lượt agent và rơi về agent mặc định (`main`). Truyền `--agent <id>` tại thời điểm tạo để ghim một agent cụ thể.

Tinh chỉnh phân phối:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tác vụ đã lập lịch](/vi/automation/cron-jobs)
