---
read_when:
    - Bạn muốn các tác vụ đã lên lịch và đánh thức
    - Bạn đang gỡ lỗi quá trình thực thi cron và nhật ký
summary: Tham chiếu CLI cho `openclaw cron` (lên lịch và chạy tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-07-01T08:13:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các tác vụ cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem đầy đủ bề mặt lệnh. Xem [Tác vụ Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

## Tạo tác vụ nhanh

`openclaw cron create` là bí danh của `openclaw cron add`. Với tác vụ mới, đặt lịch trước và lời nhắc sau:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Dùng `--webhook <url>` khi tác vụ cần POST tải trọng đã hoàn tất thay vì gửi đến một đích trò chuyện:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Dùng `--command` cho các tác vụ kiểu shell có tính xác định cần chạy bên trong OpenClaw cron mà không khởi động một lượt chạy tác tử/mô hình biệt lập:

<Note>
Tác vụ cron dạng lệnh là tự động hóa Gateway do quản trị viên viết. Việc tạo, chỉnh sửa,
xóa hoặc chạy thủ công các tác vụ này yêu cầu `operator.admin`; lượt chạy theo lịch
sau đó thực thi trong tiến trình Gateway, không phải dưới dạng lệnh gọi công cụ `tools.exec` của tác tử.
`tools.exec.*` và phê duyệt exec vẫn chi phối các công cụ exec mà mô hình nhìn thấy.
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

`--command <shell>` lưu `argv: ["sh", "-lc", <shell>]`. Dùng `--command-argv '["node","scripts/report.mjs"]'` để thực thi argv chính xác. Tác vụ dạng lệnh ghi lại stdout/stderr, lưu lịch sử cron thông thường, và định tuyến đầu ra qua cùng các chế độ gửi `announce`, `webhook`, hoặc `none` như tác vụ biệt lập. Lệnh chỉ in `NO_REPLY` sẽ bị chặn.

## Phiên

`--session` chấp nhận `main`, `isolated`, `current`, hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Khóa phiên">
    - `main` liên kết với phiên chính của tác tử.
    - `isolated` tạo một bản ghi hội thoại và id phiên mới cho mỗi lượt chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững rõ ràng.

  </Accordion>
  <Accordion title="Ngữ nghĩa phiên biệt lập">
    Các lượt chạy biệt lập đặt lại ngữ cảnh hội thoại xung quanh. Định tuyến kênh và nhóm, chính sách gửi/hàng đợi, nâng quyền, nguồn gốc và liên kết runtime ACP được đặt lại cho lượt chạy mới. Các tùy chọn an toàn và mô hình hoặc ghi đè xác thực do người dùng chọn rõ ràng có thể được chuyển tiếp giữa các lượt chạy.
  </Accordion>
</AccordionGroup>

## Gửi

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến gửi đã phân giải. Với `channel: "last"`, bản xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ đóng khi lỗi.

Các đích có tiền tố nhà cung cấp có thể làm rõ những kênh announce chưa phân giải. Ví dụ, `to: "telegram:123"` chọn Telegram khi `delivery.channel` bị bỏ qua hoặc là `last`. Chỉ những tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được đặt rõ ràng, tiền tố phải khớp với kênh đó; `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối. Các tiền tố dịch vụ như `imessage:` và `sms:` vẫn là cú pháp đích do kênh sở hữu.

<Note>
Tác vụ `cron add` biệt lập mặc định gửi bằng `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn là bí danh đã ngừng khuyến nghị của `--announce`.
</Note>

### Quyền sở hữu gửi

Việc gửi trò chuyện cron biệt lập được chia sẻ giữa tác tử và trình chạy:

- Tác tử có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
- `announce` gửi dự phòng phản hồi cuối cùng chỉ khi tác tử chưa gửi trực tiếp đến đích đã phân giải.
- `webhook` đăng tải trọng đã hoàn tất đến một URL.
- `none` tắt gửi dự phòng của trình chạy.

Dùng `cron add|create --webhook <url>` hoặc `cron edit <job-id> --webhook <url>` để đặt gửi Webhook. Không kết hợp `--webhook` với các cờ gửi trò chuyện như `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id`, hoặc `--account`.

`cron edit <job-id>` có thể bỏ đặt từng trường định tuyến gửi bằng `--clear-channel`, `--clear-to`, `--clear-thread-id`, và `--clear-account` (mỗi cờ sẽ bị từ chối khi kết hợp với cờ đặt tương ứng). Khác với `--no-deliver`, vốn chỉ tắt gửi dự phòng của trình chạy, các cờ này xóa trường đã lưu để tác vụ lại phân giải phần đó của tuyến từ mặc định.

`--announce` là gửi dự phòng của trình chạy cho phản hồi cuối cùng. `--no-deliver` tắt dự phòng đó nhưng không xóa công cụ `message` của tác tử khi có tuyến trò chuyện.

Lời nhắc được tạo từ một cuộc trò chuyện đang hoạt động giữ lại đích gửi trò chuyện trực tiếp cho gửi announce dự phòng. Khóa phiên nội bộ có thể là chữ thường; không dùng chúng làm nguồn sự thật cho ID nhà cung cấp phân biệt hoa thường như ID phòng Matrix.

### Gửi khi lỗi

Thông báo lỗi được phân giải theo thứ tự này:

1. `delivery.failureDestination` trên tác vụ.
2. `cron.failureDestination` toàn cục.
3. Đích announce chính của tác vụ (khi không đặt đích lỗi rõ ràng).

<Note>
Tác vụ phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ gửi chính là `webhook`. Tác vụ biệt lập chấp nhận giá trị này ở mọi chế độ.
</Note>

Lưu ý: lượt chạy cron biệt lập coi lỗi tác tử cấp lượt chạy là lỗi tác vụ ngay cả khi
không tạo ra tải trọng phản hồi, vì vậy lỗi mô hình/nhà cung cấp vẫn tăng bộ đếm lỗi
và kích hoạt thông báo lỗi.

Tác vụ cron dạng lệnh không khởi động một lượt tác tử biệt lập. Mã thoát bằng không ghi
`ok`; mã thoát khác không, signal, hết thời gian, hoặc hết thời gian không có đầu ra ghi `error` và
có thể kích hoạt cùng đường dẫn thông báo lỗi.

Nếu một lượt chạy biệt lập hết thời gian trước yêu cầu mô hình đầu tiên, `openclaw cron show`
và `openclaw cron runs` bao gồm lỗi theo pha, chẳng hạn như
`setup timed out before runner start` hoặc
`stalled before first model call (last phase: context-engine)`.
Với các nhà cung cấp dựa trên CLI, bộ giám sát trước mô hình vẫn hoạt động cho đến khi lượt CLI bên ngoài
bắt đầu, vì vậy các lần kẹt tra cứu phiên, hook, xác thực, lời nhắc và thiết lập CLI
được báo cáo là lỗi cron trước mô hình.

## Lập lịch

### Tác vụ một lần

`--at <datetime>` lập lịch một lượt chạy một lần. Datetime không có độ lệch được coi là UTC trừ khi bạn cũng truyền `--tz <iana>`, khi đó thời gian theo đồng hồ tường được diễn giải trong múi giờ đã cho.

<Note>
Tác vụ một lần mặc định xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại.
</Note>

### Tác vụ định kỳ

Tác vụ định kỳ dùng lùi thời gian thử lại theo hàm mũ sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, 60m. Lịch trở lại bình thường sau lượt chạy thành công tiếp theo.

Các lượt chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến lùi thời gian thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể cho phép cảnh báo lỗi bao gồm thông báo lặp lại về lượt chạy bị bỏ qua.

Với tác vụ biệt lập nhắm đến một nhà cung cấp mô hình cục bộ đã cấu hình, cron chạy một preflight nhà cung cấp nhẹ trước khi bắt đầu lượt tác tử. Các nhà cung cấp `api: "ollama"` dạng loopback, mạng riêng và `.local` được thăm dò tại `/api/tags`; các nhà cung cấp tương thích OpenAI cục bộ như vLLM, SGLang và LM Studio được thăm dò tại `/models`. Nếu endpoint không truy cập được, lượt chạy được ghi là `skipped` và thử lại trong một lịch sau; các endpoint chết khớp được lưu đệm trong 5 phút để tránh nhiều tác vụ cùng dồn dập gọi một máy chủ cục bộ.

Lưu ý: tác vụ cron, trạng thái runtime đang chờ và lịch sử lượt chạy nằm trong cơ sở dữ liệu trạng thái SQLite dùng chung. Các tệp `jobs.json`, `jobs-state.json`, và `runs/*.jsonl` cũ được nhập một lần và đổi tên với hậu tố `.migrated`. Sau khi nhập, hãy chỉnh sửa lịch bằng `openclaw cron add|edit|remove` thay vì chỉnh sửa tệp JSON.

### Lượt chạy thủ công

`openclaw cron run <job-id>` mặc định chạy cưỡng bức và trả về ngay khi lượt chạy thủ công được đưa vào hàng đợi. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `runId` được trả về để kiểm tra kết quả sau đó:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Thêm `--wait` khi script cần chặn cho đến khi đúng lượt chạy đã xếp hàng đó ghi trạng thái kết thúc:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Với `--wait`, CLI vẫn gọi `cron.run` trước, rồi thăm dò `cron.runs` cho `runId` được trả về. Lệnh thoát `0` chỉ khi lượt chạy kết thúc với trạng thái `ok`. Lệnh thoát khác không khi lượt chạy kết thúc với `error` hoặc `skipped`, khi phản hồi Gateway không bao gồm `runId`, hoặc khi `--wait-timeout` hết hạn. `--poll-interval` phải lớn hơn không.

<Note>
Dùng `--due` khi bạn muốn lệnh thủ công chỉ chạy nếu tác vụ hiện đang đến hạn. Nếu `--due --wait` không đưa lượt chạy vào hàng đợi, lệnh trả về phản hồi không chạy thông thường thay vì thăm dò.
</Note>

## Mô hình

`cron add|edit --model <ref>` chọn một mô hình được phép cho tác vụ. `cron add|edit --fallbacks <list>` đặt các mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; truyền `--fallbacks ""` cho một lượt chạy nghiêm ngặt không có dự phòng. `cron edit <job-id> --clear-fallbacks` xóa ghi đè dự phòng theo tác vụ. `cron edit <job-id> --clear-model` xóa ghi đè mô hình theo tác vụ để tác vụ tuân theo thứ tự ưu tiên chọn mô hình cron thông thường (ghi đè cron-session đã lưu nếu có, nếu không thì mô hình tác tử/mặc định); không thể kết hợp với `--model`. `cron add|edit --thinking <level>` đặt ghi đè thinking theo tác vụ; `cron edit <job-id> --clear-thinking` xóa nó để tác vụ tuân theo thứ tự ưu tiên thinking cron thông thường, và không thể kết hợp với `--thinking`.

<Warning>
Nếu mô hình không được phép hoặc không thể phân giải, cron làm lỗi lượt chạy bằng một lỗi xác thực rõ ràng thay vì quay về lựa chọn mô hình của tác tử hoặc mặc định của tác vụ.
</Warning>

Cron `--model` là **mô hình chính của tác vụ**, không phải ghi đè `/model` của phiên trò chuyện. Điều đó có nghĩa là:

- Các dự phòng mô hình đã cấu hình vẫn áp dụng khi mô hình tác vụ đã chọn bị lỗi.
- `fallbacks` trong tải trọng theo tác vụ thay thế danh sách dự phòng đã cấu hình khi có.
- Danh sách dự phòng theo tác vụ rỗng (`--fallbacks ""` hoặc `fallbacks: []` trong tải trọng/API của tác vụ) khiến lượt chạy cron trở nên nghiêm ngặt.
- Khi tác vụ có `--model` nhưng không cấu hình danh sách dự phòng, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của tác tử không bị nối thêm làm đích thử lại ẩn.
- Kiểm tra preflight nhà cung cấp cục bộ đi qua các dự phòng đã cấu hình trước khi đánh dấu một lượt chạy cron là `skipped`.

`openclaw doctor` báo cáo các tác vụ đã đặt `payload.model`, bao gồm số lượng namespace nhà cung cấp và các điểm không khớp với `agents.defaults.model`. Dùng kiểm tra đó khi hành vi xác thực, nhà cung cấp hoặc thanh toán trông khác nhau giữa trò chuyện trực tiếp và tác vụ đã lập lịch.

### Thứ tự ưu tiên mô hình cron biệt lập

Cron biệt lập phân giải mô hình đang hoạt động theo thứ tự này:

1. Ghi đè Gmail-hook.
2. `--model` theo tác vụ.
3. Ghi đè mô hình cron-session đã lưu (khi người dùng đã chọn một mô hình).
4. Lựa chọn mô hình tác tử hoặc mặc định.

### Chế độ nhanh

Chế độ nhanh của cron biệt lập tuân theo lựa chọn mô hình trực tiếp đã phân giải. Cấu hình mô hình `params.fastMode` áp dụng theo mặc định, nhưng ghi đè `fastMode` trong phiên đã lưu vẫn thắng cấu hình. Khi chế độ đã phân giải là `auto`, ngưỡng dùng giá trị `params.fastAutoOnSeconds` của mô hình đã chọn, mặc định là 60 giây.

### Thử lại khi chuyển mô hình trực tiếp

Nếu một lượt chạy biệt lập ném `LiveSessionModelSwitchError`, cron lưu nhà cung cấp và mô hình đã chuyển (và ghi đè hồ sơ xác thực đã chuyển khi có) cho lượt chạy đang hoạt động trước khi thử lại. Vòng lặp thử lại bên ngoài bị giới hạn ở hai lần thử lại chuyển đổi sau lần thử ban đầu, rồi hủy thay vì lặp mãi.

## Đầu ra lượt chạy và từ chối

### Chặn xác nhận cũ

Các lượt cron biệt lập chặn phản hồi cũ chỉ mang tính xác nhận. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời và không có lượt chạy tác tử con hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, cron nhắc lại một lần để lấy kết quả thật trước khi gửi.

### Chặn token im lặng

Nếu một lượt chạy Cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), Cron sẽ chặn cả việc gửi trực tiếp ra ngoài lẫn đường dẫn tóm tắt được xếp hàng dự phòng, nên không có nội dung nào được đăng lại vào cuộc trò chuyện.

### Từ chối có cấu trúc

Các lượt chạy Cron cô lập dùng siêu dữ liệu từ chối thực thi có cấu trúc từ lượt chạy nhúng làm tín hiệu từ chối có thẩm quyền. Chúng cũng tôn trọng các wrapper `UNAVAILABLE` của node-host khi thông báo lỗi có cấu trúc lồng nhau bắt đầu bằng `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`.

Cron không phân loại văn bản đầu ra cuối cùng hoặc các cụm từ từ chối trông giống phê duyệt là từ chối, trừ khi lượt chạy nhúng cũng cung cấp siêu dữ liệu từ chối có cấu trúc, vì vậy văn bản thông thường của trợ lý không bị coi là lệnh bị chặn.

`cron list` và lịch sử chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Việc lưu giữ và cắt tỉa được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cô lập đã hoàn tất.
- `cron.runLog.keepLines` cắt tỉa các hàng lịch sử chạy SQLite được lưu giữ theo từng công việc. `cron.runLog.maxBytes` vẫn được chấp nhận để tương thích với các nhật ký chạy dựa trên tệp cũ hơn.

## Di chuyển công việc cũ hơn

<Note>
Nếu bạn có các công việc Cron từ trước định dạng lưu trữ và phân phối hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường Cron cũ (`jobId`, `schedule.cron`, các trường phân phối cấp cao nhất bao gồm `threadId` cũ, các bí danh phân phối `provider` của payload) và di chuyển các công việc dự phòng Webhook `notify: true` từ `cron.webhook` sang phân phối Webhook rõ ràng. Các công việc đã thông báo vào một cuộc trò chuyện sẽ giữ phân phối đó và nhận thêm đích Webhook hoàn tất. Khi `cron.webhook` chưa được đặt, dấu `notify` cấp cao nhất không hoạt động sẽ bị xóa khỏi các công việc không có đích di chuyển (phân phối hiện có được giữ nguyên), vì vậy `doctor --fix` sẽ không còn tiếp tục cảnh báo lại về chúng.
</Note>

## Chỉnh sửa thường gặp

Cập nhật cài đặt phân phối mà không thay đổi thông báo:

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

`--light-context` chỉ áp dụng cho các công việc lượt tác tử cô lập. Đối với các lượt chạy Cron, chế độ nhẹ giữ ngữ cảnh bootstrap trống thay vì chèn toàn bộ tập bootstrap của workspace.

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

## Lệnh quản trị thường gặp

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

`openclaw cron list` mặc định hiển thị tất cả công việc khớp. Truyền `--agent <id>` để chỉ hiển thị các công việc có id tác tử chuẩn hóa hiệu lực khớp; các công việc không có id tác tử đã lưu được tính là tác tử mặc định đã cấu hình.

`openclaw cron get <job-id>` trả về trực tiếp JSON công việc đã lưu. Dùng `cron show <job-id>` khi bạn muốn chế độ xem dễ đọc cho con người với bản xem trước tuyến phân phối.

`cron list --json` và `cron show <job-id> --json` bao gồm trường `status` cấp cao nhất trên mỗi công việc, được tính từ `enabled`, `state.runningAtMs` và `state.lastRunStatus`. Giá trị: `disabled`, `running`, `ok`, `error`, `skipped` hoặc `idle`. Trường này phản ánh cột trạng thái dễ đọc cho con người để công cụ bên ngoài có thể đọc trạng thái công việc mà không cần tự suy diễn lại.

Các mục `cron runs` bao gồm chẩn đoán phân phối với đích Cron dự kiến, đích đã phân giải, các lần gửi bằng công cụ thông báo, việc dùng dự phòng và trạng thái đã phân phối.

Đổi đích tác tử và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` cảnh báo khi `--agent` bị bỏ qua trên các công việc lượt tác tử và quay về tác tử mặc định (`main`). Truyền `--agent <id>` khi tạo để ghim một tác tử cụ thể.

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
- [Tác vụ theo lịch](/vi/automation/cron-jobs)
