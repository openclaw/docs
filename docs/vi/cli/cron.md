---
read_when:
    - Bạn muốn các tác vụ đã lên lịch và các lần đánh thức
    - Bạn đang gỡ lỗi việc thực thi Cron và nhật ký
summary: Tham chiếu CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-04-29T22:31:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 658498b09e0f0997d0f05dcdbdbd8822284d747df932f1c51e86f97b94cd81a7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các tác vụ Cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem toàn bộ bề mặt lệnh. Xem [tác vụ Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

## Phiên

`--session` chấp nhận `main`, `isolated`, `current`, hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` liên kết với phiên chính của agent.
    - `isolated` tạo một transcript mới và session id mới cho mỗi lần chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững rõ ràng.

  </Accordion>
  <Accordion title="Isolated session semantics">
    Các lần chạy cô lập đặt lại ngữ cảnh hội thoại xung quanh. Định tuyến kênh và nhóm, chính sách gửi/xếp hàng, nâng quyền, nguồn gốc, và liên kết runtime ACP được đặt lại cho lần chạy mới. Các tùy chọn an toàn và model do người dùng chọn rõ ràng hoặc ghi đè xác thực có thể được giữ qua các lần chạy.
  </Accordion>
</AccordionGroup>

## Phân phối

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến phân phối đã phân giải. Với `channel: "last"`, bản xem trước hiển thị tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ thất bại đóng.

<Note>
Các tác vụ `cron add` cô lập mặc định dùng phân phối `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn là bí danh đã lỗi thời cho `--announce`.
</Note>

### Quyền sở hữu phân phối

Phân phối chat Cron cô lập được chia sẻ giữa agent và runner:

- Agent có thể gửi trực tiếp bằng công cụ `message` khi có tuyến chat.
- `announce` phân phối dự phòng chỉ phản hồi cuối cùng khi agent không gửi trực tiếp đến đích đã phân giải.
- `webhook` đăng payload đã hoàn tất lên một URL.
- `none` tắt phân phối dự phòng của runner.

`--announce` là phân phối dự phòng của runner cho phản hồi cuối cùng. `--no-deliver` tắt dự phòng đó nhưng không xóa công cụ `message` của agent khi có tuyến chat.

Nhắc nhở được tạo từ một chat đang hoạt động giữ nguyên đích phân phối chat trực tiếp cho phân phối thông báo dự phòng. Khóa phiên nội bộ có thể ở dạng chữ thường; đừng dùng chúng làm nguồn sự thật cho ID nhà cung cấp phân biệt hoa thường, chẳng hạn như ID phòng Matrix.

### Phân phối lỗi

Thông báo lỗi được phân giải theo thứ tự này:

1. `delivery.failureDestination` trên tác vụ.
2. `cron.failureDestination` toàn cục.
3. Đích thông báo chính của tác vụ (khi không đặt đích lỗi rõ ràng).

<Note>
Các tác vụ phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ phân phối chính là `webhook`. Các tác vụ cô lập chấp nhận nó trong mọi chế độ.
</Note>

Lưu ý: các lần chạy Cron cô lập xem lỗi agent ở cấp lần chạy là lỗi tác vụ ngay cả khi
không tạo payload phản hồi, nên lỗi model/nhà cung cấp vẫn tăng bộ đếm lỗi
và kích hoạt thông báo lỗi.

## Lập lịch

### Tác vụ chạy một lần

`--at <datetime>` lập lịch một lần chạy một lần. Datetime không có offset được xem là UTC trừ khi bạn cũng truyền `--tz <iana>`, khi đó thời gian theo đồng hồ sẽ được diễn giải trong múi giờ đã cho.

<Note>
Theo mặc định, tác vụ chạy một lần sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại chúng.
</Note>

### Tác vụ lặp lại

Tác vụ lặp lại dùng backoff thử lại theo hàm mũ sau các lỗi liên tiếp: 30 giây, 1 phút, 5 phút, 15 phút, 60 phút. Lịch trở lại bình thường sau lần chạy thành công tiếp theo.

Các lần chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến backoff thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể chọn đưa thông báo lỗi vào các thông báo lặp lại về lần chạy bị bỏ qua.

Với các tác vụ cô lập nhắm đến một nhà cung cấp model cục bộ đã cấu hình, Cron chạy một bước kiểm tra trước nhẹ nhàng cho nhà cung cấp trước khi bắt đầu lượt agent. Các nhà cung cấp local loopback, mạng riêng, và `.local` `api: "ollama"` được thăm dò tại `/api/tags`; các nhà cung cấp tương thích OpenAI cục bộ như vLLM, SGLang, và LM Studio được thăm dò tại `/models`. Nếu endpoint không truy cập được, lần chạy được ghi nhận là `skipped` và được thử lại ở lịch sau; các endpoint chết khớp sẽ được cache trong 5 phút để tránh nhiều tác vụ dồn dập đánh vào cùng một máy chủ cục bộ.

Lưu ý: định nghĩa tác vụ Cron nằm trong `jobs.json`, trong khi trạng thái runtime đang chờ nằm trong `jobs-state.json`. Nếu `jobs.json` được chỉnh sửa từ bên ngoài, Gateway tải lại các lịch đã thay đổi và xóa các ô chờ đã cũ; các lần viết lại chỉ thay đổi định dạng không xóa ô chờ.

### Chạy thủ công

`openclaw cron run` trả về ngay khi lần chạy thủ công được xếp hàng. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `openclaw cron runs --id <job-id>` để theo dõi kết quả cuối cùng.

<Note>
`openclaw cron run <job-id>` mặc định chạy cưỡng bức. Dùng `--due` để giữ hành vi cũ "chỉ chạy nếu đã đến hạn".
</Note>

## Model

`cron add|edit --model <ref>` chọn một model được phép cho tác vụ.

<Warning>
Nếu model không được phép hoặc không thể phân giải, Cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì quay về lựa chọn model của agent trong tác vụ hoặc model mặc định.
</Warning>

Cron `--model` là **model chính của tác vụ**, không phải ghi đè `/model` của phiên chat. Điều đó có nghĩa là:

- Các fallback model đã cấu hình vẫn áp dụng khi model tác vụ đã chọn thất bại.
- Payload theo tác vụ `fallbacks` thay thế danh sách fallback đã cấu hình khi có mặt.
- Danh sách fallback theo tác vụ rỗng (`fallbacks: []` trong payload/API của tác vụ) khiến lần chạy Cron trở nên nghiêm ngặt.
- Khi một tác vụ có `--model` nhưng không cấu hình danh sách fallback, OpenClaw truyền một ghi đè fallback rỗng rõ ràng để model chính của agent không được thêm vào như một đích thử lại ẩn.

### Thứ tự ưu tiên model Cron cô lập

Cron cô lập phân giải model đang hoạt động theo thứ tự này:

1. Ghi đè Gmail-hook.
2. `--model` theo tác vụ.
3. Ghi đè model phiên Cron đã lưu (khi người dùng đã chọn một model).
4. Lựa chọn model của agent hoặc mặc định.

### Chế độ nhanh

Chế độ nhanh Cron cô lập tuân theo lựa chọn model trực tiếp đã phân giải. Cấu hình model `params.fastMode` áp dụng theo mặc định, nhưng ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình.

### Thử lại chuyển đổi model trực tiếp

Nếu một lần chạy cô lập ném `LiveSessionModelSwitchError`, Cron lưu nhà cung cấp và model đã chuyển đổi (và ghi đè hồ sơ xác thực đã chuyển đổi khi có) cho lần chạy đang hoạt động trước khi thử lại. Vòng lặp thử lại bên ngoài bị giới hạn ở hai lần thử lại chuyển đổi sau lần thử ban đầu, rồi hủy thay vì lặp vô hạn.

## Đầu ra lần chạy và từ chối

### Chặn xác nhận cũ

Các lượt Cron cô lập chặn các phản hồi chỉ xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời và không có lần chạy subagent hậu duệ chịu trách nhiệm cho câu trả lời cuối cùng, Cron nhắc lại một lần để lấy kết quả thật trước khi phân phối.

### Chặn token im lặng

Nếu một lần chạy Cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), Cron chặn cả phân phối trực tiếp đi ra và đường dẫn tóm tắt xếp hàng dự phòng, nên không có gì được đăng lại vào chat.

### Từ chối có cấu trúc

Các lần chạy Cron cô lập ưu tiên metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, rồi quay về các dấu hiệu từ chối đã biết trong đầu ra cuối cùng, chẳng hạn như `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, và các cụm từ từ chối liên kết phê duyệt.

`cron list` và lịch sử chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Lưu giữ và cắt tỉa được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cô lập đã hoàn tất.
- `cron.runLog.maxBytes` và `cron.runLog.keepLines` cắt tỉa `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Di chuyển tác vụ cũ hơn

<Note>
Nếu bạn có tác vụ Cron từ trước định dạng lưu trữ và phân phối hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường Cron cũ (`jobId`, `schedule.cron`, các trường phân phối cấp cao nhất bao gồm `threadId` cũ, các bí danh phân phối `provider` của payload) và di chuyển các tác vụ fallback webhook đơn giản `notify: true` sang phân phối webhook rõ ràng khi `cron.webhook` được cấu hình.
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

Thông báo đến một kênh cụ thể:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Thông báo đến một chủ đề diễn đàn Telegram:

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

`--light-context` chỉ áp dụng cho các tác vụ lượt agent cô lập. Với các lần chạy Cron, chế độ nhẹ giữ ngữ cảnh bootstrap trống thay vì tiêm toàn bộ tập bootstrap của workspace.

## Lệnh quản trị thường gặp

Chạy thủ công và kiểm tra:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Các mục `cron runs` bao gồm chẩn đoán phân phối với đích Cron dự kiến, đích đã phân giải, các lần gửi bằng công cụ message, việc dùng fallback, và trạng thái đã phân phối.

Đổi đích agent và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Điều chỉnh phân phối:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tác vụ đã lập lịch](/vi/automation/cron-jobs)
