---
read_when:
    - Bạn muốn các tác vụ đã lên lịch và các lần đánh thức
    - Bạn đang gỡ lỗi quá trình thực thi Cron và nhật ký
summary: Tài liệu tham chiếu CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các tác vụ Cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem toàn bộ bề mặt lệnh. Xem [Tác vụ Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

## Phiên

`--session` chấp nhận `main`, `isolated`, `current`, hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Khóa phiên">
    - `main` liên kết với phiên chính của agent.
    - `isolated` tạo một transcript và id phiên mới cho mỗi lần chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững rõ ràng.

  </Accordion>
  <Accordion title="Ngữ nghĩa phiên cô lập">
    Các lần chạy cô lập đặt lại ngữ cảnh hội thoại xung quanh. Định tuyến kênh và nhóm, chính sách gửi/xếp hàng, nâng quyền, nguồn gốc và liên kết runtime ACP được đặt lại cho lần chạy mới. Các tùy chọn an toàn và model do người dùng chọn rõ ràng hoặc ghi đè xác thực có thể được giữ qua các lần chạy.
  </Accordion>
</AccordionGroup>

## Phân phối

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến phân phối đã được phân giải. Với `channel: "last"`, bản xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ đóng lỗi.

Các đích có tiền tố nhà cung cấp có thể phân biệt các kênh thông báo chưa được phân giải. Ví dụ, `to: "telegram:123"` chọn Telegram khi `delivery.channel` bị bỏ qua hoặc là `last`. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` là rõ ràng, tiền tố phải khớp với kênh đó; `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối. Các tiền tố dịch vụ như `imessage:` và `sms:` vẫn là cú pháp đích thuộc sở hữu kênh.

<Note>
Các tác vụ `cron add` cô lập mặc định dùng phân phối `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn là bí danh đã lỗi thời cho `--announce`.
</Note>

### Quyền sở hữu phân phối

Phân phối chat Cron cô lập được chia sẻ giữa agent và runner:

- Agent có thể gửi trực tiếp bằng công cụ `message` khi có tuyến chat.
- `announce` chỉ phân phối dự phòng phản hồi cuối cùng khi agent không gửi trực tiếp đến đích đã phân giải.
- `webhook` đăng payload đã hoàn tất đến một URL.
- `none` tắt phân phối dự phòng của runner.

`--announce` là phân phối dự phòng của runner cho phản hồi cuối cùng. `--no-deliver` tắt dự phòng đó nhưng không gỡ công cụ `message` của agent khi có tuyến chat.

Nhắc việc được tạo từ một chat đang hoạt động sẽ giữ đích phân phối chat trực tiếp cho phân phối thông báo dự phòng. Các khóa phiên nội bộ có thể là chữ thường; không dùng chúng làm nguồn sự thật cho các ID nhà cung cấp phân biệt chữ hoa chữ thường, chẳng hạn ID phòng Matrix.

### Phân phối khi lỗi

Thông báo lỗi được phân giải theo thứ tự này:

1. `delivery.failureDestination` trên tác vụ.
2. `cron.failureDestination` toàn cục.
3. Đích thông báo chính của tác vụ (khi không đặt đích lỗi rõ ràng).

<Note>
Tác vụ phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ phân phối chính là `webhook`. Tác vụ cô lập chấp nhận giá trị này ở mọi chế độ.
</Note>

Lưu ý: các lần chạy Cron cô lập coi lỗi agent ở cấp lần chạy là lỗi tác vụ ngay cả khi không tạo payload phản hồi, vì vậy lỗi model/nhà cung cấp vẫn tăng bộ đếm lỗi và kích hoạt thông báo lỗi.

## Lập lịch

### Tác vụ chạy một lần

`--at <datetime>` lập lịch một lần chạy duy nhất. Datetime không có offset được coi là UTC trừ khi bạn cũng truyền `--tz <iana>`, tùy chọn này diễn giải thời gian đồng hồ tường theo múi giờ đã cho.

<Note>
Tác vụ chạy một lần mặc định sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại.
</Note>

### Tác vụ định kỳ

Tác vụ định kỳ dùng backoff thử lại theo cấp số nhân sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, 60m. Lịch sẽ trở lại bình thường sau lần chạy thành công tiếp theo.

Các lần chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến backoff thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể chọn đưa cảnh báo lỗi vào các thông báo lặp lại về lần chạy bị bỏ qua.

Với các tác vụ cô lập nhắm đến một nhà cung cấp model cục bộ đã cấu hình, Cron chạy một bước kiểm tra trước nhà cung cấp nhẹ trước khi bắt đầu lượt agent. Các nhà cung cấp local loopback, mạng riêng và `.local` `api: "ollama"` được thăm dò tại `/api/tags`; các nhà cung cấp tương thích OpenAI cục bộ như vLLM, SGLang và LM Studio được thăm dò tại `/models`. Nếu endpoint không truy cập được, lần chạy được ghi là `skipped` và thử lại ở lịch sau; các endpoint chết khớp được lưu cache trong 5 phút để tránh nhiều tác vụ dồn yêu cầu vào cùng một máy chủ cục bộ.

Lưu ý: định nghĩa tác vụ Cron nằm trong `jobs.json`, còn trạng thái runtime đang chờ nằm trong `jobs-state.json`. Nếu `jobs.json` được chỉnh sửa bên ngoài, Gateway tải lại các lịch đã thay đổi và xóa các slot đang chờ cũ; các lần ghi lại chỉ thay đổi định dạng không xóa slot đang chờ.

### Lần chạy thủ công

`openclaw cron run` trả về ngay khi lần chạy thủ công được xếp hàng. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `openclaw cron runs --id <job-id>` để theo dõi kết quả cuối cùng.

<Note>
`openclaw cron run <job-id>` mặc định chạy bắt buộc. Dùng `--due` để giữ hành vi cũ là "chỉ chạy nếu đến hạn".
</Note>

## Model

`cron add|edit --model <ref>` chọn một model được cho phép cho tác vụ.

<Warning>
Nếu model không được cho phép hoặc không thể phân giải, Cron làm lần chạy thất bại bằng lỗi xác thực rõ ràng thay vì quay về agent của tác vụ hoặc lựa chọn model mặc định.
</Warning>

Cron `--model` là **mục chính của tác vụ**, không phải ghi đè `/model` của phiên chat. Điều đó nghĩa là:

- Các fallback model đã cấu hình vẫn áp dụng khi model tác vụ đã chọn thất bại.
- Payload theo tác vụ `fallbacks` thay thế danh sách fallback đã cấu hình khi có.
- Danh sách fallback theo tác vụ rỗng (`fallbacks: []` trong payload/API của tác vụ) khiến lần chạy Cron trở nên nghiêm ngặt.
- Khi một tác vụ có `--model` nhưng không cấu hình danh sách fallback, OpenClaw truyền một ghi đè fallback rỗng rõ ràng để model chính của agent không được thêm vào như một đích thử lại ẩn.

### Thứ tự ưu tiên model Cron cô lập

Cron cô lập phân giải model đang hoạt động theo thứ tự này:

1. Ghi đè Gmail-hook.
2. `--model` theo tác vụ.
3. Ghi đè model phiên Cron đã lưu (khi người dùng đã chọn một model).
4. Lựa chọn model của agent hoặc mặc định.

### Chế độ nhanh

Chế độ nhanh của Cron cô lập đi theo lựa chọn model trực tiếp đã phân giải. Cấu hình model `params.fastMode` áp dụng theo mặc định, nhưng ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình.

### Thử lại khi chuyển model trực tiếp

Nếu một lần chạy cô lập ném `LiveSessionModelSwitchError`, Cron lưu nhà cung cấp và model đã chuyển (và ghi đè hồ sơ xác thực đã chuyển khi có) cho lần chạy đang hoạt động trước khi thử lại. Vòng thử lại bên ngoài bị giới hạn ở hai lần thử lại chuyển sau lần thử ban đầu, rồi hủy thay vì lặp mãi.

## Đầu ra lần chạy và từ chối

### Chặn xác nhận cũ

Các lượt Cron cô lập chặn các phản hồi cũ chỉ có xác nhận. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời và không có lần chạy subagent con nào chịu trách nhiệm cho câu trả lời cuối cùng, Cron nhắc lại một lần để lấy kết quả thật trước khi phân phối.

### Chặn token im lặng

Nếu một lần chạy Cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), Cron chặn cả phân phối trực tiếp ra ngoài và đường dẫn tóm tắt xếp hàng dự phòng, nên không có gì được đăng lại vào chat.

### Từ chối có cấu trúc

Các lần chạy Cron cô lập ưu tiên metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, rồi quay về các marker từ chối đã biết trong đầu ra cuối cùng, chẳng hạn `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` và các cụm từ từ chối liên kết phê duyệt.

`cron list` và lịch sử lần chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Lưu giữ và cắt tỉa được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên lần chạy cô lập đã hoàn tất.
- `cron.runLog.maxBytes` và `cron.runLog.keepLines` cắt tỉa `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Di chuyển tác vụ cũ hơn

<Note>
Nếu bạn có tác vụ Cron từ trước định dạng phân phối và lưu trữ hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường Cron cũ (`jobId`, `schedule.cron`, các trường phân phối cấp cao nhất bao gồm `threadId` cũ, bí danh phân phối `provider` của payload) và di chuyển các tác vụ fallback Webhook `notify: true` đơn giản sang phân phối Webhook rõ ràng khi `cron.webhook` đã được cấu hình.
</Note>

## Chỉnh sửa thường dùng

Cập nhật cài đặt phân phối mà không đổi thông điệp:

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

`--light-context` chỉ áp dụng cho các tác vụ lượt agent cô lập. Với các lần chạy Cron, chế độ nhẹ giữ ngữ cảnh bootstrap rỗng thay vì chèn toàn bộ tập bootstrap của workspace.

## Lệnh quản trị thường dùng

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

Các mục `cron runs` bao gồm chẩn đoán phân phối với đích Cron dự kiến, đích đã phân giải, các lần gửi bằng công cụ message, việc dùng fallback và trạng thái đã phân phối.

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
