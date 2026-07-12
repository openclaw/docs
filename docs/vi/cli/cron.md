---
read_when:
    - Bạn muốn các tác vụ được lên lịch và cơ chế đánh thức
    - Bạn đang gỡ lỗi quá trình thực thi Cron và nhật ký
summary: Tài liệu tham khảo CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-07-12T07:44:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các tác vụ cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem toàn bộ phạm vi lệnh. Xem [Tác vụ Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

<Note>
Mọi thao tác thay đổi cron (`add`/`create`, `update`/`edit`, `remove`, `run`) đều yêu cầu `operator.admin`. Các lượt chạy có tải trọng lệnh được thực thi trực tiếp trong tiến trình Gateway, không phải dưới dạng lời gọi công cụ `tools.exec` của tác nhân; `tools.exec.*` và quy trình phê duyệt thực thi vẫn kiểm soát các công cụ thực thi hiển thị với mô hình.
</Note>

## Tạo tác vụ nhanh chóng

`openclaw cron create` là bí danh của `openclaw cron add`. Với tác vụ mới, hãy đặt lịch trước và lời nhắc sau:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Dùng `--webhook <url>` khi tác vụ cần gửi POST tải trọng đã hoàn tất thay vì gửi đến một đích trò chuyện:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Dùng `--command` cho các tác vụ kiểu shell có tính xác định, chạy bên trong cron của OpenClaw mà không khởi động một lượt chạy tác nhân/mô hình biệt lập:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` lưu `argv: ["sh", "-lc", <shell>]`. Dùng `--command-argv '["node","scripts/report.mjs"]'` để thực thi argv chính xác. Tác vụ lệnh thu thập stdout/stderr, ghi lại lịch sử cron thông thường và định tuyến đầu ra qua cùng các chế độ phân phối `announce`, `webhook` hoặc `none` như tác vụ biệt lập. Lệnh chỉ in `NO_REPLY` sẽ bị loại bỏ.

## Phiên

`--session` chấp nhận `main`, `isolated`, `current` hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Khóa phiên">
    - `main` liên kết với phiên chính của tác nhân.
    - `isolated` tạo bản ghi hội thoại và mã định danh phiên mới cho mỗi lượt chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên bền vững cụ thể.

  </Accordion>
  <Accordion title="Ngữ nghĩa của phiên biệt lập">
    Các lượt chạy biệt lập đặt lại ngữ cảnh hội thoại xung quanh. Cơ chế định tuyến kênh và nhóm, chính sách gửi/hàng đợi, nâng quyền, nguồn gốc và liên kết môi trường chạy ACP được đặt lại cho lượt chạy mới. Các tùy chọn an toàn và cấu hình ghi đè mô hình hoặc xác thực do người dùng chọn rõ ràng có thể được giữ lại giữa các lượt chạy.
  </Accordion>
</AccordionGroup>

## Phân phối

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến phân phối đã được phân giải. Với `channel: "last"`, phần xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ đóng khi gặp lỗi.

Đích có tiền tố nhà cung cấp có thể phân biệt các kênh thông báo chưa được phân giải. Ví dụ, `to: "telegram:123"` chọn Telegram khi `delivery.channel` bị bỏ qua hoặc là `last`. Chỉ các tiền tố do Plugin đã tải công bố mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được chỉ định rõ, tiền tố phải khớp với kênh đó; `channel: "whatsapp"` cùng `to: "telegram:123"` sẽ bị từ chối. Các tiền tố dịch vụ như `imessage:` và `sms:` vẫn là cú pháp đích thuộc quyền sở hữu của kênh.

<Note>
Các tác vụ `cron add` biệt lập mặc định phân phối bằng `--announce`. Dùng `--no-deliver` để giữ đầu ra nội bộ. `--deliver` vẫn được giữ làm bí danh không còn được khuyến nghị của `--announce`.
</Note>

### Quyền sở hữu phân phối

Việc phân phối trò chuyện cron biệt lập được chia sẻ giữa tác nhân và trình chạy:

- Tác nhân có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
- Cơ chế dự phòng `announce` chỉ phân phối câu trả lời cuối cùng khi tác nhân không gửi trực tiếp đến đích đã được phân giải.
- `webhook` gửi POST tải trọng đã hoàn tất đến một URL.
- `none` vô hiệu hóa phân phối dự phòng của trình chạy.

Dùng `cron add|create --webhook <url>` hoặc `cron edit <job-id> --webhook <url>` để thiết lập phân phối Webhook. Không kết hợp `--webhook` với các cờ phân phối trò chuyện như `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` hoặc `--account`.

`cron edit <job-id>` có thể bỏ thiết lập từng trường định tuyến phân phối bằng `--clear-channel`, `--clear-to`, `--clear-thread-id` và `--clear-account` (mỗi cờ sẽ bị từ chối khi kết hợp với cờ thiết lập tương ứng). Khác với `--no-deliver`, vốn chỉ vô hiệu hóa phân phối dự phòng của trình chạy, các cờ này xóa trường đã lưu để tác vụ lại phân giải phần tuyến đó từ giá trị mặc định.

`--announce` là cơ chế phân phối dự phòng của trình chạy dành cho câu trả lời cuối cùng. `--no-deliver` vô hiệu hóa cơ chế dự phòng đó nhưng không xóa công cụ `message` của tác nhân khi có tuyến trò chuyện.

Lời nhắc được tạo từ một cuộc trò chuyện đang hoạt động sẽ giữ lại đích phân phối trò chuyện trực tiếp để dùng cho phân phối thông báo dự phòng. Khóa phiên nội bộ có thể dùng chữ thường; không dùng chúng làm nguồn dữ liệu chuẩn cho mã định danh nhà cung cấp phân biệt chữ hoa chữ thường, chẳng hạn mã định danh phòng Matrix.

### Phân phối khi lỗi

Thông báo lỗi được phân giải theo thứ tự sau:

1. `delivery.failureDestination` trên tác vụ.
2. `cron.failureDestination` toàn cục.
3. Đích thông báo chính của tác vụ (khi cả hai mục trên đều không phân giải thành một đích cụ thể).

<Note>
Tác vụ phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ phân phối chính là `webhook`. Tác vụ biệt lập chấp nhận trường này ở mọi chế độ.
</Note>

Các lượt chạy cron biệt lập coi lỗi tác nhân ở cấp lượt chạy là lỗi tác vụ ngay cả khi không tạo ra tải trọng trả lời, vì vậy lỗi mô hình/nhà cung cấp vẫn làm tăng bộ đếm lỗi và kích hoạt thông báo lỗi.

Tác vụ cron dạng lệnh không khởi động lượt tác nhân biệt lập. Mã thoát bằng 0 ghi trạng thái `ok`; mã thoát khác 0, tín hiệu, hết thời gian hoặc hết thời gian chờ do không có đầu ra sẽ ghi trạng thái `error` và có thể kích hoạt cùng quy trình thông báo lỗi.

Nếu một lượt chạy biệt lập hết thời gian trước yêu cầu mô hình đầu tiên, `openclaw cron show` và `openclaw cron runs` sẽ bao gồm lỗi theo từng giai đoạn như `setup timed out before runner start` hoặc thông báo đình trệ nêu tên giai đoạn khởi động gần nhất đã biết (ví dụ `context-engine`). Với nhà cung cấp dựa trên CLI, bộ giám sát trước mô hình vẫn hoạt động cho đến khi lượt CLI bên ngoài bắt đầu, nên các trường hợp đình trệ khi tra cứu phiên, chạy hook, xác thực, xử lý lời nhắc và thiết lập CLI được báo cáo là lỗi cron trước mô hình.

## Lập lịch

### Tác vụ chạy một lần

`--at <datetime>` lên lịch cho một lượt chạy duy nhất. Giá trị ngày giờ không có độ lệch được coi là UTC, trừ khi bạn cũng truyền `--tz <iana>`; cờ này diễn giải thời gian đồng hồ theo múi giờ đã cho.

<Note>
Theo mặc định, tác vụ chạy một lần sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại.
</Note>

### Tác vụ định kỳ

Tác vụ định kỳ dùng cơ chế thời gian chờ thử lại tăng theo hàm mũ sau các lỗi liên tiếp: 30 giây, 1 phút, 5 phút, 15 phút, 60 phút. Lịch trở lại bình thường sau lượt chạy thành công tiếp theo.

Các lượt chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến thời gian chờ thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể bật thông báo lỗi cho các lượt chạy bị bỏ qua lặp lại.

Đối với tác vụ biệt lập nhắm đến một nhà cung cấp mô hình cục bộ đã cấu hình (URL cơ sở trên local loopback, mạng riêng hoặc `.local`), cron chạy bước kiểm tra sơ bộ nhà cung cấp nhẹ trước khi bắt đầu lượt tác nhân: nhà cung cấp `api: "ollama"` được thăm dò tại `/api/tags`; các nhà cung cấp cục bộ khác tương thích với OpenAI (`api: "openai-completions"`, ví dụ vLLM, SGLang, LM Studio) được thăm dò tại `/models`. Nếu không thể truy cập điểm cuối, lượt chạy được ghi là `skipped` và được thử lại vào một lịch sau; kết quả kiểm tra khả năng truy cập được lưu đệm theo từng điểm cuối trong 5 phút để nhiều tác vụ dùng cùng một máy chủ cục bộ không liên tục dồn các lần thăm dò lặp lại vào máy chủ đó.

Tác vụ cron, trạng thái môi trường chạy đang chờ và lịch sử lượt chạy nằm trong cơ sở dữ liệu trạng thái SQLite dùng chung. Các tệp `jobs.json`, `<name>-state.json` và `runs/*.jsonl` cũ được nhập một lần rồi đổi tên với hậu tố `.migrated`. Sau khi nhập, hãy chỉnh sửa lịch bằng `openclaw cron add|edit|remove` thay vì chỉnh sửa các tệp JSON.

### Chạy thủ công

`openclaw cron run <job-id>` mặc định buộc chạy và trả về ngay khi lượt chạy thủ công được đưa vào hàng đợi. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `runId` được trả về để kiểm tra kết quả sau đó:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Thêm `--wait` khi tập lệnh cần chặn cho đến khi chính lượt chạy đã xếp hàng đó ghi nhận trạng thái kết thúc:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Với `--wait`, CLI vẫn gọi `cron.run` trước, sau đó thăm dò `cron.runs` bằng `runId` được trả về. Lệnh chỉ thoát với mã `0` khi lượt chạy kết thúc ở trạng thái `ok`. Lệnh thoát với mã khác 0 khi lượt chạy kết thúc ở trạng thái `error` hoặc `skipped`, khi phản hồi của Gateway không chứa `runId`, hoặc khi hết thời gian `--wait-timeout` (mặc định `10m`, mặc định thăm dò mỗi `2s`). `--poll-interval` phải lớn hơn 0.

<Note>
Dùng `--due` khi bạn chỉ muốn lệnh thủ công chạy nếu tác vụ hiện đã đến hạn. Nếu `--due --wait` không đưa lượt chạy vào hàng đợi, lệnh trả về phản hồi không chạy thông thường thay vì thăm dò.
</Note>

## Mô hình

`cron add|edit --model <ref>` chọn một mô hình được phép cho tác vụ. `cron add|edit --fallbacks <list>` thiết lập các mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; truyền `--fallbacks ""` để chạy nghiêm ngặt không có phương án dự phòng. `cron edit <job-id> --clear-fallbacks` xóa cấu hình ghi đè dự phòng theo tác vụ. `cron edit <job-id> --clear-model` xóa cấu hình ghi đè mô hình theo tác vụ để tác vụ tuân theo thứ tự ưu tiên chọn mô hình cron thông thường (cấu hình ghi đè phiên cron đã lưu nếu có, nếu không thì mô hình của tác nhân/mặc định); không thể kết hợp cờ này với `--model`. `cron add|edit --thinking <level>` thiết lập cấu hình ghi đè mức suy luận theo tác vụ; `cron edit <job-id> --clear-thinking` xóa cấu hình này để tác vụ tuân theo thứ tự ưu tiên suy luận cron thông thường và không thể kết hợp với `--thinking`.

<Warning>
Nếu mô hình không được phép hoặc không thể phân giải, cron sẽ kết thúc lượt chạy với lỗi xác thực rõ ràng thay vì chuyển sang lựa chọn mô hình của tác nhân hoặc mô hình mặc định của tác vụ.
</Warning>

`--model` của cron là **mô hình chính của tác vụ**, không phải cấu hình ghi đè `/model` của phiên trò chuyện. Điều đó có nghĩa là:

- Các mô hình dự phòng đã cấu hình vẫn được áp dụng khi mô hình tác vụ đã chọn gặp lỗi.
- `fallbacks` trong tải trọng theo tác vụ sẽ thay thế danh sách dự phòng đã cấu hình khi có mặt.
- Danh sách dự phòng theo tác vụ rỗng (`--fallbacks ""` hoặc `fallbacks: []` trong tải trọng/API của tác vụ) khiến lượt chạy cron trở nên nghiêm ngặt.
- Khi tác vụ có `--model` nhưng không cấu hình danh sách dự phòng, OpenClaw truyền một cấu hình ghi đè dự phòng rỗng rõ ràng để mô hình chính của tác nhân không bị thêm vào làm đích thử lại ẩn.
- Các bước kiểm tra sơ bộ nhà cung cấp cục bộ duyệt qua các phương án dự phòng đã cấu hình trước khi đánh dấu một lượt chạy cron là `skipped`.

`openclaw doctor` báo cáo các tác vụ đã thiết lập `payload.model`, bao gồm số lượng theo không gian tên nhà cung cấp và các trường hợp không khớp với `agents.defaults.model`. Dùng bước kiểm tra đó khi hành vi xác thực, nhà cung cấp hoặc tính phí có vẻ khác nhau giữa trò chuyện trực tiếp và tác vụ đã lên lịch.

### Thứ tự ưu tiên mô hình cron biệt lập

Cron biệt lập phân giải mô hình đang hoạt động theo thứ tự sau:

1. Cấu hình ghi đè của hook Gmail.
2. `--model` theo tác vụ.
3. Cấu hình ghi đè mô hình của phiên cron đã lưu (khi người dùng đã chọn).
4. Lựa chọn mô hình của tác nhân hoặc mô hình mặc định.

### Chế độ nhanh

Chế độ nhanh của cron biệt lập tuân theo lựa chọn mô hình trực tiếp đã phân giải. Cấu hình mô hình `params.fastMode` được áp dụng theo mặc định, nhưng cấu hình ghi đè `fastMode` của phiên đã lưu vẫn được ưu tiên hơn cấu hình. Khi chế độ đã phân giải là `auto`, ngưỡng giới hạn dùng giá trị `params.fastAutoOnSeconds` của mô hình đã chọn, mặc định là 60 giây.

### Thử lại khi chuyển đổi mô hình trực tiếp

Nếu một lượt chạy biệt lập ném ra `LiveSessionModelSwitchError`, cron lưu nhà cung cấp và mô hình đã chuyển đổi (cùng cấu hình ghi đè hồ sơ xác thực đã chuyển đổi nếu có) cho lượt chạy đang hoạt động trước khi thử lại. Vòng lặp thử lại bên ngoài được giới hạn ở hai lần thử lại do chuyển đổi sau lần thử ban đầu, rồi hủy thay vì lặp vô hạn.

## Đầu ra lượt chạy và trường hợp bị từ chối

### Loại bỏ xác nhận lỗi thời

Các lượt cron biệt lập loại bỏ những câu trả lời chỉ chứa xác nhận lỗi thời. Nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời và không có lượt chạy tác nhân con nào chịu trách nhiệm cho câu trả lời cuối cùng, cron sẽ nhắc lại một lần để lấy kết quả thực trước khi phân phối.

### Loại bỏ token im lặng

Nếu một lần chạy cron cô lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), cron sẽ chặn cả việc gửi trực tiếp ra ngoài lẫn đường dẫn tóm tắt dự phòng trong hàng đợi, vì vậy không có nội dung nào được đăng lại vào cuộc trò chuyện.

### Từ chối có cấu trúc

Các lần chạy cron cô lập sử dụng siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng (các lỗi nghiêm trọng của công cụ thực thi có mã `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`) làm tín hiệu từ chối có thẩm quyền. Chúng cũng nhận diện các lớp bọc `UNAVAILABLE` của máy chủ Node quanh một lỗi có cấu trúc lồng nhau mang một trong các mã đó.

Cron không phân loại văn xuôi trong đầu ra cuối cùng hoặc các cụm từ từ chối có vẻ yêu cầu phê duyệt là từ chối, trừ khi lần chạy nhúng cũng cung cấp siêu dữ liệu từ chối có cấu trúc; do đó, văn bản thông thường của trợ lý không bị coi là một lệnh bị chặn.

`cron list` và lịch sử chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn là `ok`.

## Lưu giữ

Việc lưu giữ và dọn dẹp được kiểm soát trong cấu hình:

- `cron.sessionRetention` (mặc định `24h`, hoặc `false` để tắt) dọn dẹp các phiên chạy cô lập đã hoàn tất.
- `cron.runLog.keepLines` (mặc định `2000`) dọn dẹp các hàng lịch sử chạy SQLite được lưu giữ cho mỗi tác vụ. `cron.runLog.maxBytes` (mặc định `2000000`) vẫn được chấp nhận để tương thích với nhật ký chạy dựa trên tệp cũ; việc dọn dẹp SQLite dựa trên số lượng hàng.

## Di chuyển các tác vụ cũ

<Note>
Nếu bạn có các tác vụ cron từ trước định dạng gửi và lưu trữ hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường cron cũ (`jobId`, `schedule.cron`, các trường gửi cấp cao nhất, bao gồm `threadId` cũ và các bí danh gửi `provider` trong payload), đồng thời di chuyển các tác vụ dự phòng Webhook `notify: true` từ `cron.webhook` sang phương thức gửi Webhook tường minh. Các tác vụ đã thông báo vào một cuộc trò chuyện sẽ giữ nguyên phương thức gửi đó và nhận thêm một đích Webhook khi hoàn tất. Khi `cron.webhook` chưa được đặt, dấu `notify` cấp cao nhất không hoạt động sẽ bị xóa khỏi các tác vụ không có đích di chuyển (phương thức gửi hiện có được giữ nguyên), vì vậy `doctor --fix` không còn liên tục cảnh báo lại về chúng.
</Note>

## Các chỉnh sửa phổ biến

Cập nhật cài đặt gửi mà không thay đổi thông điệp:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Tắt gửi cho một tác vụ cô lập:

```bash
openclaw cron edit <job-id> --no-deliver
```

Bật ngữ cảnh khởi tạo nhẹ cho một tác vụ cô lập:

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

Tạo một tác vụ cô lập với ngữ cảnh khởi tạo nhẹ:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` chỉ áp dụng cho các tác vụ lượt chạy của tác nhân cô lập. Đối với các lần chạy cron, chế độ nhẹ giữ ngữ cảnh khởi tạo trống thay vì chèn toàn bộ tập khởi tạo không gian làm việc.

Tạo một tác vụ lệnh với argv, cwd, env, stdin và giới hạn đầu ra chính xác:

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

Theo mặc định, `openclaw cron list` hiển thị tất cả tác vụ khớp. Truyền `--agent <id>` để chỉ hiển thị các tác vụ có ID tác nhân hiệu dụng đã chuẩn hóa khớp; các tác vụ không lưu ID tác nhân được tính là thuộc tác nhân mặc định đã cấu hình.

`openclaw cron get <job-id>` trả về trực tiếp JSON tác vụ đã lưu. Sử dụng `cron show <job-id>` khi bạn muốn chế độ xem dễ đọc với bản xem trước tuyến gửi.

`cron list --json` và `cron show <job-id> --json` bao gồm trường `status` cấp cao nhất trên mỗi tác vụ, được tính từ `enabled`, `state.runningAtMs` và `state.lastRunStatus`. Các giá trị: `disabled`, `running`, `ok`, `error`, `skipped` hoặc `idle`. Trạng thái JSON được giữ ở dạng chuẩn và không trang trí để công cụ bên ngoài có thể đọc trạng thái tác vụ mà không phải tự suy ra lại; đầu ra cho người dùng có thể bổ sung số lần thất bại cho các trạng thái `error` lặp lại.

Các mục `cron runs` bao gồm thông tin chẩn đoán gửi với đích cron dự kiến, đích đã phân giải, các lần gửi bằng công cụ thông điệp, việc sử dụng phương án dự phòng và trạng thái đã gửi.

Chuyển đích tác nhân và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` cảnh báo khi bỏ qua `--agent` trên các tác vụ lượt chạy của tác nhân và dùng tác nhân mặc định (`main`) làm phương án dự phòng. Truyền `--agent <id>` khi tạo để cố định một tác nhân cụ thể.

Điều chỉnh việc gửi:

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
