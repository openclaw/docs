---
read_when:
    - Bạn muốn các tác vụ đã lên lịch và các lần đánh thức
    - Bạn đang gỡ lỗi quá trình thực thi Cron và nhật ký
summary: Tham chiếu CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các tác vụ cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem toàn bộ bề mặt lệnh. Xem [Tác vụ Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

## Phiên

`--session` chấp nhận `main`, `isolated`, `current`, hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Khóa phiên">
    - `main` liên kết với phiên chính của tác nhân.
    - `isolated` tạo một bản ghi hội thoại mới và id phiên mới cho mỗi lần chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững rõ ràng.

  </Accordion>
  <Accordion title="Ngữ nghĩa phiên cô lập">
    Các lần chạy cô lập đặt lại ngữ cảnh hội thoại xung quanh. Định tuyến kênh và nhóm, chính sách gửi/xếp hàng, nâng quyền, nguồn gốc, và liên kết runtime ACP đều được đặt lại cho lần chạy mới. Các tùy chọn an toàn và các ghi đè mô hình hoặc xác thực do người dùng chọn rõ ràng có thể được giữ lại qua các lần chạy.
  </Accordion>
</AccordionGroup>

## Phân phối

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến phân phối đã phân giải. Với `channel: "last"`, bản xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ đóng khi lỗi.

<Note>
Các tác vụ `cron add` cô lập mặc định dùng phân phối `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn là bí danh đã ngừng khuyến nghị cho `--announce`.
</Note>

### Quyền sở hữu phân phối

Phân phối trò chuyện cron cô lập được chia sẻ giữa tác nhân và trình chạy:

- Tác nhân có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
- `announce` phân phối dự phòng chỉ phản hồi cuối cùng khi tác nhân chưa gửi trực tiếp đến mục tiêu đã phân giải.
- `webhook` đăng tải trọng hoàn tất lên một URL.
- `none` tắt phân phối dự phòng của trình chạy.

`--announce` là phân phối dự phòng của trình chạy cho phản hồi cuối cùng. `--no-deliver` tắt dự phòng đó nhưng không xóa công cụ `message` của tác nhân khi có tuyến trò chuyện.

Lời nhắc được tạo từ một cuộc trò chuyện đang hoạt động sẽ giữ mục tiêu phân phối trò chuyện trực tiếp để phân phối thông báo dự phòng. Khóa phiên nội bộ có thể ở dạng chữ thường; đừng dùng chúng làm nguồn sự thật cho ID nhà cung cấp phân biệt chữ hoa chữ thường như ID phòng Matrix.

### Phân phối khi lỗi

Thông báo lỗi được phân giải theo thứ tự này:

1. `delivery.failureDestination` trên tác vụ.
2. `cron.failureDestination` toàn cục.
3. Mục tiêu thông báo chính của tác vụ (khi không đặt đích lỗi rõ ràng).

<Note>
Tác vụ phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ phân phối chính là `webhook`. Tác vụ cô lập chấp nhận chế độ này trong mọi chế độ.
</Note>

Lưu ý: các lần chạy cron cô lập coi lỗi tác nhân ở cấp lần chạy là lỗi tác vụ ngay cả khi
không tạo tải trọng phản hồi, nên lỗi mô hình/nhà cung cấp vẫn tăng bộ đếm lỗi
và kích hoạt thông báo lỗi.

## Lập lịch

### Tác vụ chạy một lần

`--at <datetime>` lập lịch một lần chạy đơn. Datetime không có offset được coi là UTC trừ khi bạn cũng truyền `--tz <iana>`, khi đó thời gian theo đồng hồ được diễn giải trong múi giờ đã cho.

<Note>
Theo mặc định, tác vụ chạy một lần sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại.
</Note>

### Tác vụ định kỳ

Tác vụ định kỳ dùng backoff thử lại lũy thừa sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, 60m. Lịch trở lại bình thường sau lần chạy thành công tiếp theo.

Các lần chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến backoff thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể chọn đưa cảnh báo lỗi vào các thông báo lặp lại về lần chạy bị bỏ qua.

Với tác vụ cô lập nhắm đến nhà cung cấp mô hình được cấu hình cục bộ, cron chạy một preflight nhà cung cấp nhẹ trước khi bắt đầu lượt tác nhân. Các nhà cung cấp local loopback, mạng riêng, và `.local` `api: "ollama"` được thăm dò tại `/api/tags`; các nhà cung cấp tương thích OpenAI cục bộ như vLLM, SGLang, và LM Studio được thăm dò tại `/models`. Nếu endpoint không thể truy cập, lần chạy được ghi là `skipped` và được thử lại ở lịch sau; các endpoint chết khớp được lưu cache trong 5 phút để tránh nhiều tác vụ dồn dập gọi cùng một máy chủ cục bộ.

Lưu ý: định nghĩa tác vụ cron nằm trong `jobs.json`, còn trạng thái runtime đang chờ nằm trong `jobs-state.json`. Nếu `jobs.json` được chỉnh sửa bên ngoài, Gateway tải lại các lịch đã thay đổi và xóa các slot đang chờ đã lỗi thời; các lần ghi lại chỉ thay đổi định dạng không xóa slot đang chờ.

### Chạy thủ công

`openclaw cron run` trả về ngay khi lần chạy thủ công được đưa vào hàng đợi. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `openclaw cron runs --id <job-id>` để theo dõi kết quả cuối cùng.

<Note>
`openclaw cron run <job-id>` mặc định chạy cưỡng bức. Dùng `--due` để giữ hành vi cũ "chỉ chạy nếu đến hạn".
</Note>

## Mô hình

`cron add|edit --model <ref>` chọn một mô hình được phép cho tác vụ.

<Warning>
Nếu mô hình không được phép hoặc không thể phân giải, cron sẽ làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì rơi về lựa chọn mô hình của tác nhân tác vụ hoặc mặc định.
</Warning>

Cron `--model` là **mô hình chính của tác vụ**, không phải ghi đè `/model` của phiên trò chuyện. Điều đó có nghĩa là:

- Các dự phòng mô hình đã cấu hình vẫn áp dụng khi mô hình tác vụ đã chọn thất bại.
- Tải trọng theo tác vụ `fallbacks` thay thế danh sách dự phòng đã cấu hình khi có mặt.
- Danh sách dự phòng theo tác vụ rỗng (`fallbacks: []` trong tải trọng/API tác vụ) khiến lần chạy cron trở nên nghiêm ngặt.
- Khi một tác vụ có `--model` nhưng không có danh sách dự phòng nào được cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của tác nhân không được thêm vào như một mục tiêu thử lại ẩn.

### Thứ tự ưu tiên mô hình cron cô lập

Cron cô lập phân giải mô hình đang hoạt động theo thứ tự này:

1. Ghi đè hook Gmail.
2. `--model` theo tác vụ.
3. Ghi đè mô hình phiên cron đã lưu (khi người dùng đã chọn một mô hình).
4. Lựa chọn mô hình của tác nhân hoặc mặc định.

### Chế độ nhanh

Chế độ nhanh của cron cô lập tuân theo lựa chọn mô hình trực tiếp đã phân giải. Cấu hình mô hình `params.fastMode` áp dụng theo mặc định, nhưng ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình.

### Thử lại khi chuyển mô hình trực tiếp

Nếu một lần chạy cô lập ném `LiveSessionModelSwitchError`, cron lưu nhà cung cấp và mô hình đã chuyển (và ghi đè hồ sơ xác thực đã chuyển khi có mặt) cho lần chạy đang hoạt động trước khi thử lại. Vòng lặp thử lại bên ngoài bị giới hạn ở hai lần thử lại chuyển đổi sau lần thử ban đầu, rồi hủy thay vì lặp mãi.

## Đầu ra lần chạy và từ chối

### Chặn xác nhận lỗi thời

Các lượt cron cô lập chặn các phản hồi chỉ xác nhận đã lỗi thời. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời và không có lần chạy tác nhân con cháu nào chịu trách nhiệm cho câu trả lời cuối cùng, cron nhắc lại một lần để lấy kết quả thực trước khi phân phối.

### Chặn token im lặng

Nếu một lần chạy cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), cron chặn cả phân phối đi trực tiếp và đường dẫn tóm tắt xếp hàng dự phòng, nên không có gì được đăng lại vào trò chuyện.

### Từ chối có cấu trúc

Các lần chạy cron cô lập ưu tiên metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, rồi rơi về các dấu hiệu từ chối đã biết trong đầu ra cuối cùng, như `SYSTEM_RUN_DENIED`, `INVALID_REQUEST`, và các cụm từ từ chối liên kết phê duyệt.

`cron list` và lịch sử chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Lưu giữ và cắt tỉa được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cô lập đã hoàn tất.
- `cron.runLog.maxBytes` và `cron.runLog.keepLines` cắt tỉa `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Di chuyển tác vụ cũ hơn

<Note>
Nếu bạn có tác vụ cron từ trước định dạng phân phối và lưu trữ hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường cron cũ (`jobId`, `schedule.cron`, các trường phân phối cấp cao nhất bao gồm `threadId` cũ, bí danh phân phối `provider` trong tải trọng) và di chuyển các tác vụ dự phòng webhook `notify: true` đơn giản sang phân phối webhook rõ ràng khi `cron.webhook` được cấu hình.
</Note>

## Chỉnh sửa thường gặp

Cập nhật cài đặt phân phối mà không thay đổi tin nhắn:

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

`--light-context` chỉ áp dụng cho các tác vụ lượt tác nhân cô lập. Với các lần chạy cron, chế độ nhẹ giữ ngữ cảnh bootstrap trống thay vì chèn toàn bộ tập bootstrap workspace.

## Lệnh quản trị thường gặp

Chạy thủ công và kiểm tra:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Các mục `cron runs` bao gồm chẩn đoán phân phối với mục tiêu cron dự kiến, mục tiêu đã phân giải, các lần gửi qua công cụ tin nhắn, việc dùng dự phòng, và trạng thái đã phân phối.

Chuyển mục tiêu tác nhân và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` cảnh báo khi bỏ qua `--agent` trên các tác vụ lượt tác nhân và rơi về tác nhân mặc định (`main`). Truyền `--agent <id>` tại thời điểm tạo để ghim một tác nhân cụ thể.

Tinh chỉnh phân phối:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
