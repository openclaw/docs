---
read_when:
    - Bạn muốn các tác vụ theo lịch và các lần đánh thức
    - Bạn đang gỡ lỗi quá trình thực thi Cron và nhật ký
summary: Tài liệu tham khảo CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-05-10T19:27:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1575213cfcc6cb9991e0aed48722e737d930570ce8527532188b345810982892
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các tác vụ cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem đầy đủ phạm vi lệnh. Xem [Tác vụ Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

## Phiên

`--session` chấp nhận `main`, `isolated`, `current`, hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Khóa phiên">
    - `main` liên kết với phiên chính của agent.
    - `isolated` tạo một bản ghi hội thoại và id phiên mới cho mỗi lần chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững rõ ràng.

  </Accordion>
  <Accordion title="Ngữ nghĩa phiên cô lập">
    Các lần chạy cô lập đặt lại ngữ cảnh hội thoại xung quanh. Định tuyến kênh và nhóm, chính sách gửi/xếp hàng, nâng quyền, nguồn gốc, và liên kết runtime ACP được đặt lại cho lần chạy mới. Các tùy chọn an toàn và ghi đè model hoặc xác thực do người dùng chọn rõ ràng có thể được giữ qua các lần chạy.
  </Accordion>
</AccordionGroup>

## Phân phối

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến phân phối đã được phân giải. Với `channel: "last"`, bản xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ đóng lỗi.

Các đích có tiền tố nhà cung cấp có thể làm rõ các kênh thông báo chưa phân giải. Ví dụ, `to: "telegram:123"` chọn Telegram khi `delivery.channel` bị bỏ qua hoặc là `last`. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được đặt rõ ràng, tiền tố phải khớp với kênh đó; `channel: "whatsapp"` với `to: "telegram:123"` bị từ chối. Các tiền tố dịch vụ như `imessage:` và `sms:` vẫn là cú pháp đích do kênh sở hữu.

<Note>
Các tác vụ `cron add` cô lập mặc định dùng phân phối `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn là bí danh đã lỗi thời cho `--announce`.
</Note>

### Quyền sở hữu phân phối

Phân phối trò chuyện cron cô lập được chia sẻ giữa agent và runner:

- Agent có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
- `announce` phân phối dự phòng câu trả lời cuối cùng chỉ khi agent không gửi trực tiếp đến đích đã phân giải.
- `webhook` đăng payload hoàn tất tới một URL.
- `none` tắt phân phối dự phòng của runner.

`--announce` là phân phối dự phòng của runner cho câu trả lời cuối cùng. `--no-deliver` tắt dự phòng đó nhưng không xóa công cụ `message` của agent khi có tuyến trò chuyện.

Lời nhắc được tạo từ một cuộc trò chuyện đang hoạt động sẽ giữ nguyên đích phân phối trò chuyện trực tiếp để phân phối thông báo dự phòng. Khóa phiên nội bộ có thể là chữ thường; không dùng chúng làm nguồn sự thật cho các ID nhà cung cấp phân biệt hoa thường, chẳng hạn ID phòng Matrix.

### Phân phối khi lỗi

Thông báo lỗi được phân giải theo thứ tự này:

1. `delivery.failureDestination` trên tác vụ.
2. `cron.failureDestination` toàn cục.
3. Đích thông báo chính của tác vụ (khi không đặt đích lỗi rõ ràng).

<Note>
Các tác vụ phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ phân phối chính là `webhook`. Các tác vụ cô lập chấp nhận tùy chọn này trong mọi chế độ.
</Note>

Lưu ý: các lần chạy cron cô lập xem lỗi agent ở cấp lần chạy là lỗi tác vụ ngay cả khi
không tạo payload trả lời, vì vậy lỗi model/nhà cung cấp vẫn tăng bộ đếm lỗi
và kích hoạt thông báo lỗi.

Nếu một lần chạy cô lập hết thời gian chờ trước yêu cầu model đầu tiên, `openclaw cron show`
và `openclaw cron runs` bao gồm lỗi theo pha như
`setup timed out before runner start` hoặc
`stalled before first model call (last phase: context-engine)`.
Với các nhà cung cấp dựa trên CLI, watchdog trước model vẫn hoạt động cho đến khi lượt CLI bên ngoài
bắt đầu, vì vậy các điểm kẹt trong tra cứu phiên, hook, xác thực, prompt, và thiết lập CLI
được báo cáo là lỗi cron trước model.

## Lập lịch

### Tác vụ chạy một lần

`--at <datetime>` lập lịch một lần chạy duy nhất. Datetime không có offset được xem là UTC trừ khi bạn cũng truyền `--tz <iana>`, khi đó thời gian theo đồng hồ sẽ được diễn giải trong múi giờ đã cho.

<Note>
Theo mặc định, tác vụ chạy một lần sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại.
</Note>

### Tác vụ định kỳ

Tác vụ định kỳ dùng backoff thử lại lũy thừa sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, 60m. Lịch trở lại bình thường sau lần chạy thành công kế tiếp.

Các lần chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến backoff thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể chọn đưa cảnh báo lỗi vào các thông báo lặp lại về lần chạy bị bỏ qua.

Với các tác vụ cô lập nhắm đến một nhà cung cấp model cục bộ đã cấu hình, cron chạy một preflight nhà cung cấp nhẹ trước khi bắt đầu lượt agent. Các nhà cung cấp `api: "ollama"` qua loopback, mạng riêng, và `.local` được thăm dò tại `/api/tags`; các nhà cung cấp tương thích OpenAI cục bộ như vLLM, SGLang, và LM Studio được thăm dò tại `/models`. Nếu endpoint không truy cập được, lần chạy được ghi là `skipped` và được thử lại ở lịch sau; các endpoint chết khớp được cache trong 5 phút để tránh nhiều tác vụ dồn yêu cầu vào cùng một máy chủ cục bộ.

Lưu ý: định nghĩa tác vụ cron nằm trong `jobs.json`, còn trạng thái runtime đang chờ nằm trong `jobs-state.json`. Nếu `jobs.json` được chỉnh sửa từ bên ngoài, Gateway tải lại các lịch đã thay đổi và xóa các slot đang chờ đã cũ; các lần ghi lại chỉ thay đổi định dạng không xóa slot đang chờ.

### Lần chạy thủ công

`openclaw cron run` trả về ngay khi lần chạy thủ công được xếp hàng. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `openclaw cron runs --id <job-id>` để theo dõi kết quả cuối cùng.

<Note>
`openclaw cron run <job-id>` mặc định chạy cưỡng bức. Dùng `--due` để giữ hành vi cũ "chỉ chạy nếu đến hạn".
</Note>

## Model

`cron add|edit --model <ref>` chọn một model được phép cho tác vụ.

<Warning>
Nếu model không được phép hoặc không thể phân giải, cron làm lỗi lần chạy bằng một lỗi xác thực rõ ràng thay vì quay về lựa chọn model của agent trong tác vụ hoặc model mặc định.
</Warning>

Cron `--model` là **chính cho tác vụ**, không phải ghi đè `/model` của phiên trò chuyện. Điều đó có nghĩa là:

- Các fallback model đã cấu hình vẫn áp dụng khi model tác vụ đã chọn thất bại.
- Payload theo tác vụ `fallbacks` thay thế danh sách fallback đã cấu hình khi có mặt.
- Danh sách fallback rỗng theo tác vụ (`fallbacks: []` trong payload/API của tác vụ) làm cho lần chạy cron nghiêm ngặt.
- Khi một tác vụ có `--model` nhưng không có danh sách fallback nào được cấu hình, OpenClaw truyền một ghi đè fallback rỗng rõ ràng để model chính của agent không được thêm làm đích thử lại ẩn.

### Thứ tự ưu tiên model cron cô lập

Cron cô lập phân giải model đang hoạt động theo thứ tự này:

1. Ghi đè Gmail-hook.
2. `--model` theo tác vụ.
3. Ghi đè model phiên cron đã lưu (khi người dùng đã chọn).
4. Lựa chọn model của agent hoặc mặc định.

### Chế độ nhanh

Chế độ nhanh của cron cô lập đi theo lựa chọn model trực tiếp đã phân giải. Cấu hình model `params.fastMode` áp dụng theo mặc định, nhưng ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình.

### Thử lại khi chuyển model trực tiếp

Nếu một lần chạy cô lập ném `LiveSessionModelSwitchError`, cron lưu nhà cung cấp và model đã chuyển (và ghi đè hồ sơ xác thực đã chuyển khi có) cho lần chạy đang hoạt động trước khi thử lại. Vòng thử lại bên ngoài bị giới hạn ở hai lần thử lại chuyển đổi sau lần thử ban đầu, rồi hủy thay vì lặp mãi.

## Đầu ra lần chạy và từ chối

### Chặn xác nhận cũ

Các lượt cron cô lập chặn các câu trả lời chỉ là xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời và không có lần chạy subagent con nào chịu trách nhiệm cho câu trả lời cuối cùng, cron sẽ prompt lại một lần để lấy kết quả thật trước khi phân phối.

### Chặn token im lặng

Nếu một lần chạy cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), cron chặn cả phân phối gửi trực tiếp ra ngoài lẫn đường dẫn tóm tắt xếp hàng dự phòng, nên không có gì được đăng lại vào trò chuyện.

### Từ chối có cấu trúc

Các lần chạy cron cô lập ưu tiên metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, rồi quay về các marker từ chối đã biết trong đầu ra cuối cùng, chẳng hạn `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, và các cụm từ từ chối liên kết phê duyệt.

`cron list` và lịch sử lần chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Lưu giữ và cắt tỉa được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên lần chạy cô lập đã hoàn tất.
- `cron.runLog.maxBytes` và `cron.runLog.keepLines` cắt tỉa `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Di chuyển tác vụ cũ

<Note>
Nếu bạn có tác vụ cron từ trước định dạng phân phối và lưu trữ hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường cron cũ (`jobId`, `schedule.cron`, các trường phân phối cấp cao nhất bao gồm `threadId` cũ, bí danh phân phối `provider` trong payload) và di chuyển các tác vụ fallback webhook đơn giản `notify: true` sang phân phối webhook rõ ràng khi `cron.webhook` được cấu hình.
</Note>

## Chỉnh sửa thường gặp

Cập nhật cài đặt phân phối mà không thay đổi thông điệp:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Tắt phân phối cho một tác vụ cô lập:

```bash
openclaw cron edit <job-id> --no-deliver
```

Bật ngữ cảnh bootstrap nhẹ cho một tác vụ cô lập:

```bash
openclaw cron edit <job-id> --light-context
```

Thông báo tới một kênh cụ thể:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Thông báo tới một chủ đề diễn đàn Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Tạo một tác vụ cô lập với ngữ cảnh bootstrap nhẹ:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` chỉ áp dụng cho các tác vụ lượt agent cô lập. Với các lần chạy cron, chế độ nhẹ giữ ngữ cảnh bootstrap trống thay vì chèn toàn bộ bộ bootstrap workspace.

## Lệnh quản trị thường gặp

Chạy thủ công và kiểm tra:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` mặc định hiển thị tất cả tác vụ khớp. Truyền `--agent <id>` để chỉ hiển thị các tác vụ có id agent chuẩn hóa hiệu lực khớp; tác vụ không có id agent đã lưu được tính là agent mặc định đã cấu hình.

`cron list --json` và `cron show <job-id> --json` bao gồm trường `status` cấp cao nhất trên mỗi tác vụ, được tính từ `enabled`, `state.runningAtMs`, và `state.lastRunStatus`. Giá trị: `disabled`, `running`, `ok`, `error`, `skipped`, hoặc `idle`. Trường này phản chiếu cột trạng thái dễ đọc để công cụ bên ngoài có thể đọc trạng thái tác vụ mà không cần suy luận lại.

Các mục `cron runs` bao gồm chẩn đoán phân phối với đích cron dự kiến, đích đã phân giải, các lần gửi bằng công cụ message, việc dùng fallback, và trạng thái đã phân phối.

Đổi đích agent và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` cảnh báo khi `--agent` bị bỏ qua trên các tác vụ lượt agent và quay về agent mặc định (`main`). Truyền `--agent <id>` tại thời điểm tạo để ghim một agent cụ thể.

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
