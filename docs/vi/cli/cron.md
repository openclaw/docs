---
read_when:
    - Bạn muốn các tác vụ theo lịch và các lần đánh thức
    - Bạn đang gỡ lỗi quá trình thực thi Cron và nhật ký
summary: Tham chiếu CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-05-02T10:36:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các cron job cho trình lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem toàn bộ bề mặt lệnh. Xem [Cron job](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

## Phiên

`--session` chấp nhận `main`, `isolated`, `current`, hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` liên kết với phiên chính của agent.
    - `isolated` tạo một transcript mới và id phiên mới cho mỗi lần chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững rõ ràng.

  </Accordion>
  <Accordion title="Isolated session semantics">
    Các lần chạy cô lập đặt lại ngữ cảnh hội thoại xung quanh. Định tuyến kênh và nhóm, chính sách gửi/xếp hàng, nâng quyền, nguồn gốc, và liên kết runtime ACP được đặt lại cho lần chạy mới. Các tùy chọn an toàn và model do người dùng chọn rõ ràng hoặc ghi đè xác thực có thể được mang qua các lần chạy.
  </Accordion>
</AccordionGroup>

## Phân phối

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến phân phối đã được phân giải. Với `channel: "last"`, bản xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ đóng khi lỗi.

Các đích có tiền tố nhà cung cấp có thể phân biệt rõ các kênh thông báo chưa phân giải. Ví dụ, `to: "telegram:123"` chọn Telegram khi `delivery.channel` bị bỏ qua hoặc là `last`. Chỉ các tiền tố được plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` là rõ ràng, tiền tố phải khớp với kênh đó; `channel: "whatsapp"` với `to: "telegram:123"` bị từ chối. Các tiền tố dịch vụ như `imessage:` và `sms:` vẫn là cú pháp đích do kênh sở hữu.

<Note>
Các job `cron add` cô lập mặc định dùng phân phối `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn là bí danh đã lỗi thời cho `--announce`.
</Note>

### Quyền sở hữu phân phối

Phân phối trò chuyện cron cô lập được chia sẻ giữa agent và runner:

- Agent có thể gửi trực tiếp bằng công cụ `message` khi có sẵn tuyến trò chuyện.
- `announce` phân phối dự phòng phản hồi cuối cùng chỉ khi agent chưa gửi trực tiếp đến đích đã phân giải.
- `webhook` đăng payload đã hoàn tất lên một URL.
- `none` tắt phân phối dự phòng của runner.

`--announce` là phân phối dự phòng của runner cho phản hồi cuối cùng. `--no-deliver` tắt dự phòng đó nhưng không xóa công cụ `message` của agent khi có sẵn tuyến trò chuyện.

Các lời nhắc được tạo từ một cuộc trò chuyện đang hoạt động sẽ giữ lại đích phân phối trò chuyện trực tiếp để phân phối thông báo dự phòng. Khóa phiên nội bộ có thể là chữ thường; không dùng chúng làm nguồn chân lý cho các ID nhà cung cấp phân biệt chữ hoa chữ thường như ID phòng Matrix.

### Phân phối khi lỗi

Thông báo lỗi được phân giải theo thứ tự này:

1. `delivery.failureDestination` trên job.
2. `cron.failureDestination` toàn cục.
3. Đích thông báo chính của job (khi không đặt đích lỗi rõ ràng).

<Note>
Các job phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ phân phối chính là `webhook`. Các job cô lập chấp nhận trường này ở mọi chế độ.
</Note>

Lưu ý: các lần chạy cron cô lập coi lỗi agent cấp lần chạy là lỗi job ngay cả khi
không tạo payload phản hồi, vì vậy lỗi model/nhà cung cấp vẫn tăng bộ đếm lỗi
và kích hoạt thông báo lỗi.

## Lập lịch

### Job chạy một lần

`--at <datetime>` lập lịch một lần chạy duy nhất. Datetime không có offset được coi là UTC trừ khi bạn cũng truyền `--tz <iana>`, khi đó thời gian đồng hồ treo tường sẽ được diễn giải theo múi giờ đã cho.

<Note>
Job chạy một lần mặc định sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại chúng.
</Note>

### Job định kỳ

Job định kỳ dùng backoff thử lại theo cấp số nhân sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, 60m. Lịch trình trở lại bình thường sau lần chạy thành công tiếp theo.

Các lần chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến backoff thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể chọn đưa thông báo lỗi vào các thông báo lặp lại về lần chạy bị bỏ qua.

Với các job cô lập nhắm đến một nhà cung cấp model cục bộ đã cấu hình, cron chạy một preflight nhà cung cấp nhẹ trước khi bắt đầu lượt agent. Các nhà cung cấp `api: "ollama"` qua loopback, mạng riêng và `.local` được thăm dò tại `/api/tags`; các nhà cung cấp tương thích OpenAI cục bộ như vLLM, SGLang và LM Studio được thăm dò tại `/models`. Nếu endpoint không thể truy cập, lần chạy được ghi là `skipped` và được thử lại theo một lịch trình sau; các endpoint chết khớp được lưu cache trong 5 phút để tránh nhiều job dồn yêu cầu vào cùng một máy chủ cục bộ.

Lưu ý: định nghĩa cron job nằm trong `jobs.json`, trong khi trạng thái runtime đang chờ nằm trong `jobs-state.json`. Nếu `jobs.json` được chỉnh sửa bên ngoài, Gateway tải lại các lịch trình đã thay đổi và xóa các khe đang chờ đã cũ; các lần ghi lại chỉ thay đổi định dạng không xóa khe đang chờ.

### Chạy thủ công

`openclaw cron run` trả về ngay khi lần chạy thủ công được xếp hàng. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `openclaw cron runs --id <job-id>` để theo dõi kết quả cuối cùng.

<Note>
`openclaw cron run <job-id>` mặc định chạy cưỡng bức. Dùng `--due` để giữ hành vi cũ là "chỉ chạy nếu đến hạn".
</Note>

## Model

`cron add|edit --model <ref>` chọn một model được phép cho job.

<Warning>
Nếu model không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì quay về lựa chọn model của agent hoặc model mặc định của job.
</Warning>

Cron `--model` là **chính của job**, không phải ghi đè `/model` của phiên trò chuyện. Điều đó nghĩa là:

- Các fallback model đã cấu hình vẫn áp dụng khi model job đã chọn thất bại.
- Payload theo job `fallbacks` thay thế danh sách fallback đã cấu hình khi có.
- Danh sách fallback theo job rỗng (`fallbacks: []` trong payload/API của job) làm lần chạy cron trở nên nghiêm ngặt.
- Khi một job có `--model` nhưng không cấu hình danh sách fallback, OpenClaw truyền một ghi đè fallback rỗng rõ ràng để model chính của agent không được thêm vào như một đích thử lại ẩn.

### Thứ tự ưu tiên model của cron cô lập

Cron cô lập phân giải model đang hoạt động theo thứ tự này:

1. Ghi đè hook Gmail.
2. `--model` theo job.
3. Ghi đè model phiên cron đã lưu (khi người dùng đã chọn).
4. Lựa chọn model của agent hoặc mặc định.

### Chế độ nhanh

Chế độ nhanh của cron cô lập tuân theo lựa chọn model trực tiếp đã phân giải. Cấu hình model `params.fastMode` áp dụng theo mặc định, nhưng ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình.

### Thử lại chuyển model trực tiếp

Nếu một lần chạy cô lập ném `LiveSessionModelSwitchError`, cron lưu nhà cung cấp và model đã chuyển (và ghi đè hồ sơ xác thực đã chuyển khi có) cho lần chạy đang hoạt động trước khi thử lại. Vòng lặp thử lại bên ngoài được giới hạn ở hai lần thử lại chuyển sau lần thử ban đầu, rồi hủy thay vì lặp vô hạn.

## Đầu ra lần chạy và từ chối

### Chặn xác nhận cũ

Các lượt cron cô lập chặn các phản hồi chỉ xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời và không có lần chạy subagent hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, cron nhắc lại một lần để lấy kết quả thật trước khi phân phối.

### Chặn token im lặng

Nếu một lần chạy cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), cron chặn cả phân phối đi trực tiếp lẫn đường dẫn tóm tắt xếp hàng dự phòng, nên không có gì được đăng lại vào trò chuyện.

### Từ chối có cấu trúc

Các lần chạy cron cô lập ưu tiên metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, rồi quay về các marker từ chối đã biết trong đầu ra cuối cùng, chẳng hạn như `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, và các cụm từ từ chối liên kết phê duyệt.

`cron list` và lịch sử lần chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Việc lưu giữ và cắt tỉa được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên lần chạy cô lập đã hoàn tất.
- `cron.runLog.maxBytes` và `cron.runLog.keepLines` cắt tỉa `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Di chuyển job cũ hơn

<Note>
Nếu bạn có cron job từ trước định dạng phân phối và lưu trữ hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường cron cũ (`jobId`, `schedule.cron`, các trường phân phối cấp cao nhất bao gồm `threadId` cũ, các bí danh phân phối `provider` của payload) và di chuyển các job dự phòng webhook `notify: true` đơn giản sang phân phối webhook rõ ràng khi `cron.webhook` được cấu hình.
</Note>

## Chỉnh sửa thường gặp

Cập nhật cài đặt phân phối mà không thay đổi thông điệp:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Tắt phân phối cho một job cô lập:

```bash
openclaw cron edit <job-id> --no-deliver
```

Bật ngữ cảnh bootstrap nhẹ cho một job cô lập:

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

Tạo một job cô lập với ngữ cảnh bootstrap nhẹ:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` chỉ áp dụng cho các job lượt agent cô lập. Với các lần chạy cron, chế độ nhẹ giữ ngữ cảnh bootstrap trống thay vì chèn toàn bộ bộ bootstrap workspace.

## Lệnh quản trị thường dùng

Chạy thủ công và kiểm tra:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Các mục `cron runs` bao gồm chẩn đoán phân phối với đích cron dự kiến, đích đã phân giải, các lần gửi bằng công cụ message, sử dụng fallback, và trạng thái đã phân phối.

Đổi đích agent và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` cảnh báo khi `--agent` bị bỏ qua trên các job lượt agent và quay về agent mặc định (`main`). Truyền `--agent <id>` tại thời điểm tạo để ghim một agent cụ thể.

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
