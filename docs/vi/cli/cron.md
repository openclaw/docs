---
read_when:
    - Bạn muốn các tác vụ được lên lịch và các lần đánh thức
    - Bạn đang gỡ lỗi việc thực thi cron và nhật ký
summary: Tham chiếu CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:17:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các tác vụ Cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem toàn bộ bề mặt lệnh. Xem [Tác vụ Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

## Tạo tác vụ nhanh

`openclaw cron create` là bí danh của `openclaw cron add`. Với tác vụ mới, đặt lịch trước và prompt sau:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Dùng `--webhook <url>` khi tác vụ cần POST payload đã hoàn tất thay vì gửi đến một đích trò chuyện:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Dùng `--command` cho các tác vụ kiểu shell có tính xác định cần chạy bên trong OpenClaw cron mà không khởi động một lượt chạy agent/mô hình cô lập:

<Note>
Tác vụ Cron dạng lệnh là tự động hóa Gateway do quản trị viên tạo. Việc tạo, chỉnh sửa,
xóa hoặc chạy thủ công chúng yêu cầu `operator.admin`; lượt chạy theo lịch
sau đó thực thi trong tiến trình Gateway, không phải dưới dạng lệnh gọi công cụ `tools.exec` của agent.
`tools.exec.*` và phê duyệt exec vẫn quản lý các công cụ exec hiển thị với mô hình.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` lưu `argv: ["sh", "-lc", <shell>]`. Dùng `--command-argv '["node","scripts/report.mjs"]'` để thực thi argv chính xác. Tác vụ dạng lệnh thu stdout/stderr, ghi lại lịch sử Cron bình thường, và định tuyến đầu ra qua cùng các chế độ gửi `announce`, `webhook`, hoặc `none` như tác vụ cô lập. Lệnh chỉ in `NO_REPLY` sẽ bị chặn.

## Phiên

`--session` chấp nhận `main`, `isolated`, `current`, hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` liên kết với phiên chính của agent.
    - `isolated` tạo một transcript mới và id phiên mới cho mỗi lượt chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững rõ ràng.

  </Accordion>
  <Accordion title="Isolated session semantics">
    Các lượt chạy cô lập đặt lại ngữ cảnh hội thoại xung quanh. Định tuyến kênh và nhóm, chính sách gửi/hàng đợi, nâng quyền, nguồn gốc và liên kết runtime ACP được đặt lại cho lượt chạy mới. Các tùy chọn an toàn và ghi đè mô hình hoặc auth do người dùng chọn rõ ràng có thể được mang qua các lượt chạy.
  </Accordion>
</AccordionGroup>

## Gửi

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến gửi đã phân giải. Với `channel: "last"`, bản xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ fail closed.

Các đích có tiền tố nhà cung cấp có thể làm rõ các kênh announce chưa phân giải. Ví dụ, `to: "telegram:123"` chọn Telegram khi `delivery.channel` bị bỏ qua hoặc là `last`. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` là rõ ràng, tiền tố phải khớp kênh đó; `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối. Các tiền tố dịch vụ như `imessage:` và `sms:` vẫn là cú pháp đích do kênh sở hữu.

<Note>
Các tác vụ `cron add` cô lập mặc định dùng gửi `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn là bí danh đã lỗi thời của `--announce`.
</Note>

### Quyền sở hữu việc gửi

Việc gửi trò chuyện Cron cô lập được chia sẻ giữa agent và trình chạy:

- Agent có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
- `announce` gửi dự phòng phản hồi cuối cùng chỉ khi agent không gửi trực tiếp đến đích đã phân giải.
- `webhook` đăng payload đã hoàn tất đến một URL.
- `none` tắt gửi dự phòng của trình chạy.

Dùng `cron add|create --webhook <url>` hoặc `cron edit <job-id> --webhook <url>` để đặt gửi qua Webhook. Không kết hợp `--webhook` với các cờ gửi trò chuyện như `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, hoặc `--account`.

`cron edit <job-id>` có thể bỏ đặt từng trường định tuyến gửi bằng `--clear-channel`, `--clear-to`, `--clear-thread-id`, và `--clear-account` (mỗi cờ sẽ bị từ chối khi kết hợp với cờ đặt tương ứng). Khác với `--no-deliver`, vốn chỉ tắt gửi dự phòng của trình chạy, các cờ này xóa trường đã lưu để tác vụ phân giải lại phần đó của tuyến từ giá trị mặc định.

`--announce` là gửi dự phòng của trình chạy cho phản hồi cuối cùng. `--no-deliver` tắt dự phòng đó nhưng không xóa công cụ `message` của agent khi có tuyến trò chuyện.

Nhắc nhở được tạo từ một trò chuyện đang hoạt động sẽ giữ lại đích gửi trò chuyện trực tiếp cho gửi announce dự phòng. Khóa phiên nội bộ có thể ở chữ thường; đừng dùng chúng làm nguồn sự thật cho ID nhà cung cấp phân biệt hoa thường như ID phòng Matrix.

### Gửi khi thất bại

Thông báo thất bại phân giải theo thứ tự này:

1. `delivery.failureDestination` trên tác vụ.
2. `cron.failureDestination` toàn cục.
3. Đích announce chính của tác vụ (khi không đặt đích thất bại rõ ràng).

<Note>
Tác vụ phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ gửi chính là `webhook`. Tác vụ cô lập chấp nhận trường này ở mọi chế độ.
</Note>

Lưu ý: các lượt chạy Cron cô lập coi lỗi agent cấp lượt chạy là lỗi tác vụ ngay cả khi
không tạo payload phản hồi, vì vậy lỗi mô hình/nhà cung cấp vẫn tăng bộ đếm lỗi
và kích hoạt thông báo thất bại.

Tác vụ Cron dạng lệnh không khởi động một lượt agent cô lập. Mã thoát bằng không ghi
`ok`; mã thoát khác không, signal, timeout, hoặc timeout không có đầu ra ghi `error` và
có thể kích hoạt cùng đường dẫn thông báo thất bại.

Nếu một lượt chạy cô lập timeout trước yêu cầu mô hình đầu tiên, `openclaw cron show`
và `openclaw cron runs` bao gồm lỗi theo pha như
`setup timed out before runner start` hoặc
`stalled before first model call (last phase: context-engine)`.
Với các nhà cung cấp dựa trên CLI, watchdog trước mô hình vẫn hoạt động cho đến khi lượt
CLI bên ngoài bắt đầu, vì vậy tình trạng kẹt ở tra cứu phiên, hook, auth, prompt và thiết lập CLI
được báo cáo là lỗi Cron trước mô hình.

## Lập lịch

### Tác vụ một lần

`--at <datetime>` lên lịch một lượt chạy một lần. Datetime không có offset được coi là UTC trừ khi bạn cũng truyền `--tz <iana>`, khi đó thời gian theo đồng hồ sẽ được diễn giải trong múi giờ đã cho.

<Note>
Theo mặc định, tác vụ một lần sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại chúng.
</Note>

### Tác vụ lặp lại

Tác vụ lặp lại dùng backoff thử lại theo hàm mũ sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, 60m. Lịch quay lại bình thường sau lượt chạy thành công tiếp theo.

Các lượt chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến backoff thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể bật cảnh báo thất bại cho các thông báo lượt chạy bị bỏ qua lặp lại.

Với tác vụ cô lập nhắm đến một nhà cung cấp mô hình cục bộ đã cấu hình, Cron chạy một preflight nhà cung cấp nhẹ trước khi bắt đầu lượt agent. Loopback, mạng riêng và nhà cung cấp `.local` `api: "ollama"` được thăm dò tại `/api/tags`; các nhà cung cấp tương thích OpenAI cục bộ như vLLM, SGLang và LM Studio được thăm dò tại `/models`. Nếu endpoint không thể truy cập, lượt chạy được ghi là `skipped` và thử lại vào một lịch sau; các endpoint chết khớp được lưu cache trong 5 phút để tránh nhiều tác vụ dồn dập vào cùng một máy chủ cục bộ.

Lưu ý: tác vụ Cron, trạng thái runtime đang chờ và lịch sử lượt chạy nằm trong cơ sở dữ liệu trạng thái SQLite dùng chung. Các tệp `jobs.json`, `jobs-state.json`, và `runs/*.jsonl` cũ được nhập một lần và đổi tên với hậu tố `.migrated`. Sau khi nhập, hãy chỉnh sửa lịch bằng `openclaw cron add|edit|remove` thay vì chỉnh sửa tệp JSON.

### Lượt chạy thủ công

`openclaw cron run <job-id>` mặc định chạy cưỡng bức và trả về ngay khi lượt chạy thủ công được đưa vào hàng đợi. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `runId` được trả về để kiểm tra kết quả sau đó:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Thêm `--wait` khi một script cần chặn cho đến khi chính lượt chạy đã xếp hàng đó ghi trạng thái kết thúc:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Với `--wait`, CLI vẫn gọi `cron.run` trước, rồi thăm dò `cron.runs` cho `runId` được trả về. Lệnh thoát `0` chỉ khi lượt chạy kết thúc với trạng thái `ok`. Lệnh thoát khác không khi lượt chạy kết thúc với `error` hoặc `skipped`, khi phản hồi Gateway không bao gồm `runId`, hoặc khi `--wait-timeout` hết hạn. `--poll-interval` phải lớn hơn không.

<Note>
Dùng `--due` khi bạn muốn lệnh thủ công chỉ chạy nếu tác vụ hiện đang đến hạn. Nếu `--due --wait` không xếp hàng một lượt chạy, lệnh trả về phản hồi không chạy bình thường thay vì thăm dò.
</Note>

## Mô hình

`cron add|edit --model <ref>` chọn một mô hình được phép cho tác vụ. `cron add|edit --fallbacks <list>` đặt các mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; truyền `--fallbacks ""` cho lượt chạy nghiêm ngặt không có dự phòng. `cron edit <job-id> --clear-fallbacks` xóa ghi đè dự phòng theo tác vụ. `cron edit <job-id> --clear-model` xóa ghi đè mô hình theo tác vụ để tác vụ tuân theo thứ tự ưu tiên chọn mô hình Cron bình thường (ghi đè cron-session đã lưu nếu có, nếu không thì mô hình agent/mặc định); không thể kết hợp cờ này với `--model`.

<Warning>
Nếu mô hình không được phép hoặc không thể phân giải, Cron làm lượt chạy thất bại với lỗi xác thực rõ ràng thay vì dự phòng về lựa chọn agent hoặc mô hình mặc định của tác vụ.
</Warning>

Cron `--model` là **mô hình chính của tác vụ**, không phải ghi đè `/model` của phiên trò chuyện. Điều đó có nghĩa là:

- Các dự phòng mô hình đã cấu hình vẫn áp dụng khi mô hình tác vụ đã chọn thất bại.
- Payload `fallbacks` theo tác vụ thay thế danh sách dự phòng đã cấu hình khi có mặt.
- Danh sách dự phòng theo tác vụ rỗng (`--fallbacks ""` hoặc `fallbacks: []` trong payload/API của tác vụ) làm lượt chạy Cron trở nên nghiêm ngặt.
- Khi tác vụ có `--model` nhưng không cấu hình danh sách dự phòng, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của agent không bị nối thêm như một đích thử lại ẩn.
- Kiểm tra preflight nhà cung cấp cục bộ duyệt qua các dự phòng đã cấu hình trước khi đánh dấu một lượt chạy Cron là `skipped`.

`openclaw doctor` báo cáo các tác vụ đã có `payload.model` được đặt, bao gồm số lượng namespace nhà cung cấp và điểm không khớp với `agents.defaults.model`. Dùng kiểm tra đó khi hành vi auth, nhà cung cấp hoặc thanh toán trông khác nhau giữa trò chuyện trực tiếp và tác vụ đã lên lịch.

### Thứ tự ưu tiên mô hình Cron cô lập

Cron cô lập phân giải mô hình đang hoạt động theo thứ tự này:

1. Ghi đè Gmail-hook.
2. `--model` theo tác vụ.
3. Ghi đè mô hình cron-session đã lưu (khi người dùng đã chọn một mô hình).
4. Lựa chọn mô hình agent hoặc mặc định.

### Chế độ nhanh

Chế độ nhanh của Cron cô lập tuân theo lựa chọn mô hình trực tiếp đã phân giải. Cấu hình mô hình `params.fastMode` áp dụng theo mặc định, nhưng ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình. Khi chế độ đã phân giải là `auto`, ngưỡng dùng giá trị `params.fastAutoOnSeconds` của mô hình đã chọn, mặc định là 60 giây.

### Thử lại chuyển mô hình trực tiếp

Nếu một lượt chạy cô lập ném `LiveSessionModelSwitchError`, Cron lưu nhà cung cấp và mô hình đã chuyển (và ghi đè hồ sơ auth đã chuyển khi có) cho lượt chạy đang hoạt động trước khi thử lại. Vòng lặp thử lại bên ngoài bị giới hạn ở hai lần thử lại chuyển sau lần thử ban đầu, rồi hủy thay vì lặp mãi.

## Đầu ra lượt chạy và từ chối

### Chặn xác nhận cũ

Các lượt Cron cô lập chặn các phản hồi chỉ xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời và không có lượt chạy subagent hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, Cron nhắc lại một lần để lấy kết quả thật trước khi gửi.

### Chặn token im lặng

Nếu một lượt chạy Cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), Cron chặn cả gửi trực tiếp ra ngoài lẫn đường dẫn tóm tắt dự phòng đã xếp hàng, nên không có gì được đăng lại vào trò chuyện.

### Từ chối có cấu trúc

Các lần chạy cron cô lập dùng siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng làm tín hiệu từ chối có thẩm quyền. Chúng cũng tôn trọng các wrapper `UNAVAILABLE` của node-host khi thông báo lỗi có cấu trúc lồng bên trong bắt đầu bằng `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`.

Cron không phân loại văn xuôi đầu ra cuối cùng hoặc các cụm từ từ chối trông giống yêu cầu phê duyệt là từ chối, trừ khi lần chạy nhúng cũng cung cấp siêu dữ liệu từ chối có cấu trúc, nên văn bản thông thường của trợ lý không bị xem là một lệnh bị chặn.

`cron list` và lịch sử chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Việc lưu giữ và cắt tỉa được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cô lập đã hoàn tất.
- `cron.runLog.keepLines` cắt tỉa các hàng lịch sử chạy SQLite được giữ lại theo từng công việc. `cron.runLog.maxBytes` vẫn được chấp nhận để tương thích với các nhật ký chạy dựa trên tệp cũ hơn.

## Di chuyển các công việc cũ hơn

<Note>
Nếu bạn có các công việc cron từ trước định dạng phân phối và lưu trữ hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường cron cũ (`jobId`, `schedule.cron`, các trường phân phối cấp cao nhất bao gồm `threadId` cũ, các bí danh phân phối `provider` trong payload) và di chuyển các công việc dự phòng webhook `notify: true` từ `cron.webhook` sang phân phối webhook tường minh. Các công việc đã thông báo tới một cuộc trò chuyện sẽ giữ phân phối đó và nhận thêm một đích webhook hoàn tất. Khi `cron.webhook` chưa được đặt, dấu `notify` cấp cao nhất không hoạt động sẽ bị xóa khỏi các công việc không có đích di chuyển (phân phối hiện có được giữ nguyên), nên `doctor --fix` không còn liên tục cảnh báo lại về chúng.
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

Thông báo tới một kênh cụ thể:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Thông báo tới một chủ đề diễn đàn Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Tạo một công việc cô lập với ngữ cảnh bootstrap nhẹ:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` chỉ áp dụng cho các công việc lượt tác nhân cô lập. Đối với các lần chạy cron, chế độ nhẹ giữ ngữ cảnh bootstrap trống thay vì tiêm toàn bộ tập bootstrap của workspace.

Tạo một công việc lệnh với argv, cwd, env, stdin và giới hạn đầu ra chính xác:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Các lệnh quản trị phổ biến

Chạy thủ công và kiểm tra:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` mặc định hiển thị tất cả công việc khớp. Truyền `--agent <id>` để chỉ hiển thị các công việc có id tác nhân chuẩn hóa hiệu lực khớp; các công việc không có id tác nhân đã lưu được tính là tác nhân mặc định đã cấu hình.

`openclaw cron get <job-id>` trả về trực tiếp JSON công việc đã lưu. Dùng `cron show <job-id>` khi bạn muốn chế độ xem dễ đọc với phần xem trước tuyến phân phối.

`cron list --json` và `cron show <job-id> --json` bao gồm trường `status` cấp cao nhất trên mỗi công việc, được tính từ `enabled`, `state.runningAtMs` và `state.lastRunStatus`. Các giá trị: `disabled`, `running`, `ok`, `error`, `skipped` hoặc `idle`. Trường này phản ánh cột trạng thái dễ đọc để công cụ bên ngoài có thể đọc trạng thái công việc mà không cần suy ra lại.

Các mục `cron runs` bao gồm chẩn đoán phân phối với đích cron dự kiến, đích đã phân giải, các lần gửi bằng công cụ thông điệp, việc sử dụng dự phòng và trạng thái đã phân phối.

Nhắm lại tác nhân và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` cảnh báo khi `--agent` bị bỏ qua trên các công việc lượt tác nhân và quay về tác nhân mặc định (`main`). Truyền `--agent <id>` khi tạo để ghim một tác nhân cụ thể.

Tinh chỉnh phân phối:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
