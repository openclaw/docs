---
read_when:
    - Bạn muốn các tác vụ theo lịch và cơ chế đánh thức
    - Bạn đang gỡ lỗi quá trình thực thi và nhật ký Cron
summary: Tài liệu tham khảo CLI cho `openclaw cron` (lên lịch và chạy các tác vụ nền)
title: Cron
x-i18n:
    generated_at: "2026-07-19T16:57:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0e6e56a465700eb42c1f0c0c7d5af9dddb390cd48c1f44c471d08b6a8c2c4c6a
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Quản lý các tác vụ cron cho bộ lập lịch Gateway.

<Tip>
Chạy `openclaw cron --help` để xem toàn bộ bề mặt lệnh. Xem [Tác vụ Cron](/vi/automation/cron-jobs) để đọc hướng dẫn khái niệm.
</Tip>

<Note>
Mọi thao tác thay đổi cron (`add`/`create`, `update`/`edit`, `remove`, `run`) đều yêu cầu `operator.admin`. Các lượt chạy bằng tải trọng lệnh được thực thi trực tiếp trong tiến trình Gateway, không phải dưới dạng lệnh gọi công cụ `tools.exec` của tác tử; `tools.exec.*` và các phê duyệt thực thi vẫn chi phối những công cụ thực thi mà mô hình có thể thấy.
</Note>

## Tạo tác vụ nhanh chóng

`openclaw cron create` là bí danh của `openclaw cron add`. Với tác vụ mới, hãy đặt lịch trước và lời nhắc sau:

```bash
openclaw cron create "0 7 * * *" \
  "Tóm tắt các cập nhật qua đêm." \
  --name "Bản tin buổi sáng" \
  --agent ops
```

Dùng `--webhook <url>` khi tác vụ cần gửi tải trọng hoàn chỉnh bằng POST thay vì phân phối đến một đích trò chuyện:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Tóm tắt các lần triển khai hôm nay dưới dạng JSON." \
  --name "Tổng hợp triển khai" \
  --webhook "https://example.invalid/openclaw/cron"
```

Dùng `--command` cho các tác vụ kiểu shell có tính xác định, chạy bên trong cron của OpenClaw mà không khởi động một lượt chạy tác tử/mô hình cô lập:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Thăm dò độ sâu hàng đợi" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` lưu trữ `argv: ["sh", "-lc", <shell>]`. Dùng `--command-argv '["node","scripts/report.mjs"]'` để thực thi argv chính xác. Tác vụ lệnh ghi lại stdout/stderr, lưu lịch sử cron thông thường và định tuyến đầu ra thông qua cùng các chế độ phân phối `announce`, `webhook` hoặc `none` như tác vụ cô lập. Lệnh chỉ in `NO_REPLY` sẽ bị bỏ qua.

## Phiên

`--session` chấp nhận `main`, `isolated`, `current` hoặc `session:<id>`.

<AccordionGroup>
  <Accordion title="Khóa phiên">
    - `main` liên kết với phiên chính của tác tử.
    - `isolated` tạo bản chép lời và ID phiên mới cho mỗi lượt chạy.
    - `current` liên kết với phiên đang hoạt động tại thời điểm tạo.
    - `session:<id>` ghim vào một khóa phiên cố định được chỉ định rõ.

  </Accordion>
  <Accordion title="Ngữ nghĩa của phiên cô lập">
    Các lượt chạy cô lập đặt lại ngữ cảnh hội thoại xung quanh. Việc định tuyến kênh và nhóm, chính sách gửi/xếp hàng đợi, nâng quyền, nguồn gốc và liên kết môi trường chạy ACP đều được đặt lại cho lượt chạy mới. Các tùy chọn an toàn và lựa chọn ghi đè mô hình hoặc xác thực rõ ràng của người dùng có thể được giữ lại giữa các lượt chạy.
  </Accordion>
</AccordionGroup>

## Phân phối

`openclaw cron list` và `openclaw cron show <job-id>` xem trước tuyến phân phối đã được phân giải. Với `channel: "last"`, bản xem trước cho biết tuyến được phân giải từ phiên chính hay phiên hiện tại, hoặc sẽ đóng an toàn khi thất bại.

Các đích có tiền tố nhà cung cấp có thể phân định rõ những kênh thông báo chưa được phân giải. Ví dụ, `to: "telegram:123"` chọn Telegram khi `delivery.channel` bị bỏ qua hoặc là `last`. Chỉ các tiền tố do plugin đã tải công bố mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được chỉ định rõ, tiền tố phải khớp với kênh đó; `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối. Các tiền tố dịch vụ như `imessage:` và `sms:` vẫn là cú pháp đích do kênh sở hữu.

<Note>
Các tác vụ `cron add` cô lập mặc định dùng chế độ phân phối `--announce`. Dùng `--no-deliver` để giữ đầu ra ở nội bộ. `--deliver` vẫn tồn tại dưới dạng bí danh không còn được khuyến nghị cho `--announce`.
</Note>

### Quyền sở hữu việc phân phối

Việc phân phối trò chuyện cron cô lập được chia sẻ giữa tác tử và trình chạy:

- Tác tử có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
- `announce` chỉ phân phối dự phòng câu trả lời cuối cùng khi tác tử không gửi trực tiếp đến đích đã phân giải.
- `webhook` gửi tải trọng hoàn chỉnh đến một URL.
- `none` vô hiệu hóa phân phối dự phòng của trình chạy.

Dùng `cron add|create --webhook <url>` hoặc `cron edit <job-id> --webhook <url>` để thiết lập phân phối Webhook. Không kết hợp `--webhook` với các cờ phân phối trò chuyện như `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` hoặc `--account`.

`cron edit <job-id>` có thể bỏ thiết lập từng trường định tuyến phân phối bằng `--clear-channel`, `--clear-to`, `--clear-thread-id` và `--clear-account` (mỗi trường sẽ bị từ chối khi kết hợp với cờ thiết lập tương ứng). Không giống `--no-deliver`, vốn chỉ vô hiệu hóa phân phối dự phòng của trình chạy, các tùy chọn này xóa trường đã lưu để tác vụ lại phân giải phần đó của tuyến từ các giá trị mặc định.

`--announce` là cơ chế phân phối dự phòng của trình chạy cho câu trả lời cuối cùng. `--no-deliver` vô hiệu hóa cơ chế dự phòng đó nhưng không loại bỏ công cụ `message` của tác tử khi có tuyến trò chuyện.

Lời nhắc được tạo từ một cuộc trò chuyện đang hoạt động sẽ bảo toàn đích phân phối trò chuyện trực tiếp để dùng cho phân phối thông báo dự phòng. Khóa phiên nội bộ có thể viết thường; không dùng chúng làm nguồn sự thật cho các ID nhà cung cấp phân biệt chữ hoa chữ thường, chẳng hạn như ID phòng Matrix.

### Phân phối khi thất bại

Thông báo thất bại được phân giải theo thứ tự sau:

1. `delivery.failureDestination` trên tác vụ.
2. `cron.failureDestination` toàn cục.
3. Đích thông báo chính của tác vụ (khi cả hai mục trên đều không phân giải thành một đích cụ thể).

<Note>
Tác vụ phiên chính chỉ có thể dùng `delivery.failureDestination` khi chế độ phân phối chính là `webhook`. Tác vụ cô lập chấp nhận tùy chọn này trong mọi chế độ.
</Note>

Các lượt chạy cron cô lập coi lỗi cấp lượt chạy của tác tử là lỗi tác vụ ngay cả khi không tạo ra tải trọng phản hồi, vì vậy lỗi mô hình/nhà cung cấp vẫn làm tăng bộ đếm lỗi và kích hoạt thông báo thất bại.

Tác vụ cron dạng lệnh không khởi động một lượt tác tử cô lập. Mã thoát bằng không ghi lại `ok`; mã thoát khác không, tín hiệu, hết thời gian chờ hoặc hết thời gian chờ do không có đầu ra sẽ ghi lại `error` và có thể kích hoạt cùng một đường dẫn thông báo thất bại.

Nếu một lượt chạy cô lập hết thời gian chờ trước yêu cầu mô hình đầu tiên, `openclaw cron show` và `openclaw cron runs` sẽ chứa lỗi theo từng giai đoạn, chẳng hạn như `setup timed out before runner start`, hoặc thông báo đình trệ nêu tên giai đoạn khởi động gần nhất đã biết (ví dụ: `context-engine`). Với các nhà cung cấp dựa trên CLI, bộ giám sát trước mô hình duy trì hoạt động cho đến khi lượt CLI bên ngoài bắt đầu, vì vậy các tình trạng đình trệ khi tra cứu phiên, chạy hook, xác thực, tạo lời nhắc và thiết lập CLI được báo cáo là lỗi cron trước mô hình.

## Lập lịch

### Tác vụ chạy một lần

`--at <datetime>` lên lịch cho một lượt chạy một lần. Ngày giờ không có độ lệch được coi là UTC, trừ khi bạn cũng truyền `--tz <iana>`, tùy chọn này diễn giải giờ đồng hồ theo múi giờ đã cho.

<Note>
Theo mặc định, tác vụ chạy một lần sẽ bị xóa sau khi thành công. Dùng `--keep-after-run` để giữ lại chúng.
</Note>

### Tác vụ định kỳ

Tác vụ định kỳ sử dụng thời gian chờ thử lại tăng theo cấp số nhân sau các lỗi liên tiếp: 30s, 1m, 5m, 15m, 60m. Lịch trở lại bình thường sau lượt chạy thành công tiếp theo.

Các lượt chạy bị bỏ qua được theo dõi riêng với lỗi thực thi. Chúng không ảnh hưởng đến thời gian chờ thử lại, nhưng `openclaw cron edit <job-id> --failure-alert-include-skipped` có thể cho phép cảnh báo thất bại bao gồm thông báo về các lượt chạy bị bỏ qua nhiều lần.

Đối với tác vụ cô lập nhắm đến một nhà cung cấp mô hình cục bộ đã cấu hình (URL cơ sở trên loopback, mạng riêng hoặc `.local`), cron thực hiện một bước kiểm tra sơ bộ nhẹ đối với nhà cung cấp trước khi bắt đầu lượt tác tử: các nhà cung cấp `api: "ollama"` được thăm dò tại `/api/tags`; các nhà cung cấp cục bộ khác tương thích với OpenAI (`api: "openai-completions"`, ví dụ: vLLM, SGLang, LM Studio) được thăm dò tại `/models`. Nếu không thể truy cập điểm cuối, lượt chạy được ghi nhận là `skipped` và thử lại ở một lịch sau; kết quả khả năng truy cập được lưu vào bộ nhớ đệm theo từng điểm cuối trong 5 phút để nhiều tác vụ dùng cùng một máy chủ cục bộ không liên tục dồn dập thăm dò.

Tác vụ cron, trạng thái môi trường chạy đang chờ xử lý và lịch sử lượt chạy nằm trong cơ sở dữ liệu trạng thái SQLite dùng chung. Các tệp `jobs.json`, `<name>-state.json` và `runs/*.jsonl` cũ được nhập một lần rồi đổi tên với hậu tố `.migrated`. Sau khi nhập, hãy chỉnh sửa lịch bằng `openclaw cron add|edit|remove` thay vì chỉnh sửa tệp JSON.

### Lượt chạy thủ công

`openclaw cron run <job-id>` mặc định buộc chạy và trả về ngay khi lượt chạy thủ công được đưa vào hàng đợi. Phản hồi thành công bao gồm `{ ok: true, enqueued: true, runId }`. Dùng `runId` được trả về để kiểm tra kết quả sau đó:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Thêm `--wait` khi một tập lệnh cần chặn cho đến khi chính lượt chạy đã xếp hàng đó ghi nhận trạng thái kết thúc:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Với `--wait`, CLI vẫn gọi `cron.run` trước, sau đó thăm dò `cron.runs` bằng `runId` được trả về. Lệnh chỉ thoát với `0` khi lượt chạy kết thúc với trạng thái `ok`. Lệnh thoát khác không khi lượt chạy kết thúc với `error` hoặc `skipped`, khi phản hồi Gateway không chứa `runId`, hoặc khi `--wait-timeout` hết hạn (mặc định `10m`, được thăm dò mỗi `2s` theo mặc định). `--poll-interval` phải lớn hơn không.

<Note>
Dùng `--due` khi bạn muốn lệnh thủ công chỉ chạy nếu tác vụ hiện đến hạn. Nếu `--due --wait` không đưa lượt chạy vào hàng đợi, lệnh trả về phản hồi không chạy thông thường thay vì thăm dò.
</Note>

## Mô hình

`cron add|edit --model <ref>` chọn một mô hình được phép cho tác vụ. `cron add|edit --fallbacks <list>` thiết lập các mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; truyền `--fallbacks ""` để chạy nghiêm ngặt mà không có mô hình dự phòng. `cron edit <job-id> --clear-fallbacks` xóa ghi đè dự phòng theo từng tác vụ. `cron edit <job-id> --clear-model` xóa ghi đè mô hình theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên chọn mô hình cron thông thường (ghi đè phiên cron đã lưu nếu có, nếu không thì dùng mô hình của tác tử/mô hình mặc định); tùy chọn này không thể kết hợp với `--model`. `cron add|edit --thinking <level>` thiết lập ghi đè mức suy luận theo từng tác vụ; `cron edit <job-id> --clear-thinking` xóa ghi đè đó để tác vụ tuân theo thứ tự ưu tiên mức suy luận cron thông thường và không thể kết hợp với `--thinking`.

<Warning>
Nếu mô hình không được phép hoặc không thể phân giải, cron sẽ làm lượt chạy thất bại với lỗi xác thực rõ ràng thay vì quay về lựa chọn mô hình của tác tử hoặc mô hình mặc định của tác vụ.
</Warning>

`--model` của cron là một **mô hình chính của tác vụ**, không phải ghi đè `/model` của phiên trò chuyện. Điều đó có nghĩa là:

- Các mô hình dự phòng đã cấu hình vẫn được áp dụng khi mô hình tác vụ đã chọn thất bại.
- `fallbacks` trong tải trọng theo từng tác vụ thay thế danh sách dự phòng đã cấu hình khi có.
- Danh sách dự phòng theo từng tác vụ rỗng (`--fallbacks ""` hoặc `fallbacks: []` trong tải trọng/API của tác vụ) khiến lượt chạy cron trở nên nghiêm ngặt.
- Khi một tác vụ có `--model` nhưng không cấu hình danh sách dự phòng, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của tác tử không bị nối thêm dưới dạng đích thử lại ẩn.
- Các bước kiểm tra sơ bộ nhà cung cấp cục bộ duyệt qua các mô hình dự phòng đã cấu hình trước khi đánh dấu một lượt chạy cron là `skipped`.

`openclaw doctor` báo cáo các tác vụ đã thiết lập `payload.model`, bao gồm số lượng theo không gian tên nhà cung cấp và các trường hợp không khớp với `agents.defaults.model`. Dùng bước kiểm tra đó khi hành vi xác thực, nhà cung cấp hoặc thanh toán có vẻ khác nhau giữa trò chuyện trực tiếp và tác vụ được lập lịch.

### Thứ tự ưu tiên mô hình cron cô lập

Cron cô lập phân giải mô hình đang hoạt động theo thứ tự sau:

1. Ghi đè từ hook Gmail.
2. `--model` theo từng tác vụ.
3. Ghi đè mô hình phiên cron đã lưu (khi người dùng đã chọn một mô hình).
4. Lựa chọn mô hình của tác tử hoặc mô hình mặc định.

### Chế độ nhanh

Chế độ nhanh của Cron biệt lập tuân theo lựa chọn mô hình trực tiếp đã được phân giải. Cấu hình mô hình `params.fastMode` được áp dụng theo mặc định, nhưng giá trị ghi đè `fastMode` của phiên đã lưu vẫn được ưu tiên hơn cấu hình. Khi chế độ đã phân giải là `auto`, ngưỡng cắt sử dụng giá trị `params.fastAutoOnSeconds` của mô hình đã chọn, với giá trị mặc định là 60 giây.

### Thử lại khi chuyển đổi mô hình trực tiếp

Nếu một lượt chạy biệt lập phát sinh `LiveSessionModelSwitchError`, Cron lưu nhà cung cấp và mô hình đã chuyển đổi (cùng giá trị ghi đè hồ sơ xác thực đã chuyển đổi nếu có) cho lượt chạy đang hoạt động trước khi thử lại. Vòng lặp thử lại bên ngoài được giới hạn ở hai lần thử chuyển đổi sau lần thử ban đầu, sau đó sẽ hủy thay vì lặp vô hạn.

## Đầu ra lượt chạy và trường hợp từ chối

### Loại bỏ xác nhận lỗi thời

Các lượt Cron biệt lập loại bỏ những phản hồi lỗi thời chỉ có nội dung xác nhận. Nếu kết quả đầu tiên chỉ là một bản cập nhật trạng thái tạm thời và không có lượt chạy tác tử con hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, Cron sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.

### Loại bỏ token im lặng

Nếu một lượt chạy Cron biệt lập chỉ trả về token im lặng (`NO_REPLY` hoặc `no_reply`), Cron sẽ loại bỏ cả việc gửi trực tiếp ra ngoài lẫn đường dẫn dự phòng của bản tóm tắt trong hàng đợi, vì vậy không có nội dung nào được gửi trở lại cuộc trò chuyện.

### Từ chối có cấu trúc

Các lượt chạy Cron biệt lập sử dụng siêu dữ liệu từ chối thực thi có cấu trúc từ lượt chạy nhúng (lỗi nghiêm trọng của công cụ thực thi có mã `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`) làm tín hiệu từ chối có thẩm quyền. Chúng cũng nhận diện các trình bao bọc `UNAVAILABLE` của máy chủ Node quanh một lỗi có cấu trúc lồng nhau mang một trong các mã đó.

Cron không phân loại văn bản đầu ra cuối cùng hoặc các cụm từ từ chối trông giống yêu cầu phê duyệt là trường hợp từ chối, trừ khi lượt chạy nhúng cũng cung cấp siêu dữ liệu từ chối có cấu trúc; do đó, văn bản thông thường của trợ lý không bị coi là một lệnh bị chặn.

`cron list` và lịch sử lượt chạy hiển thị lý do từ chối thay vì báo cáo một lệnh bị chặn dưới dạng `ok`.

## Lưu giữ

Cơ chế lưu giữ:

- `cron.sessionRetention` (mặc định `24h`, hoặc `false` để tắt) dọn dẹp các phiên lượt chạy biệt lập đã hoàn tất.
- Lịch sử lượt chạy giữ lại 2000 hàng kết thúc mới nhất cho mỗi tác vụ Cron. Các hàng bị mất vẫn sử dụng khoảng thời gian dọn dẹp tác vụ bị mất tiêu chuẩn là 24 giờ.

## Di chuyển các tác vụ cũ

<Note>
Nếu bạn có các tác vụ Cron từ trước định dạng gửi và lưu trữ hiện tại, hãy chạy `openclaw doctor --fix`. Doctor chuẩn hóa các trường Cron cũ (`jobId`, `schedule.cron`, các trường gửi cấp cao nhất bao gồm `threadId` cũ, các bí danh gửi `provider` của payload) và di chuyển các tác vụ dự phòng Webhook `notify: true` từ giá trị thô `cron.webhook` đã ngừng sử dụng sang hình thức gửi Webhook rõ ràng trước khi xóa khóa cấu hình đó. Các tác vụ đã thông báo đến một cuộc trò chuyện sẽ giữ nguyên hình thức gửi đó và nhận thêm một đích Webhook hoàn tất. Khi không có Webhook cũ, dấu `notify` cấp cao nhất không hoạt động sẽ bị xóa khỏi các tác vụ không có đích di chuyển (hình thức gửi hiện có được giữ nguyên không thay đổi), vì vậy `doctor --fix` sẽ không còn liên tục cảnh báo lại về chúng.
</Note>

## Các chỉnh sửa thường gặp

Cập nhật cài đặt gửi mà không thay đổi thông báo:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Tắt gửi đối với một tác vụ biệt lập:

```bash
openclaw cron edit <job-id> --no-deliver
```

Bật ngữ cảnh khởi động nhẹ cho một tác vụ biệt lập:

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

Tạo một tác vụ biệt lập với ngữ cảnh khởi động nhẹ:

```bash
openclaw cron create "0 7 * * *" \
  "Tóm tắt các cập nhật qua đêm." \
  --name "Bản tin sáng nhẹ" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` chỉ áp dụng cho các tác vụ lượt tác tử biệt lập. Đối với các lượt chạy Cron, chế độ nhẹ giữ ngữ cảnh khởi động trống thay vì chèn toàn bộ tập hợp khởi động của không gian làm việc.

Tạo một tác vụ lệnh với argv, cwd, env, stdin và giới hạn đầu ra chính xác:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Xuất vị thế" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Các lệnh quản trị thường dùng

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

`openclaw cron list` hiển thị tất cả tác vụ khớp theo mặc định. Truyền `--agent <id>` để chỉ hiển thị các tác vụ có ID tác tử chuẩn hóa hiệu dụng khớp; các tác vụ không có ID tác tử được lưu sẽ được tính là tác tử mặc định đã cấu hình.

`openclaw cron get <job-id>` trả về trực tiếp JSON của tác vụ đã lưu. Sử dụng `cron show <job-id>` khi bạn muốn chế độ xem dễ đọc với bản xem trước tuyến gửi.

`cron list --json` và `cron show <job-id> --json` bao gồm trường `status` cấp cao nhất trên mỗi tác vụ, được tính từ `enabled`, `state.runningAtMs` và `state.lastRunStatus`. Các giá trị: `disabled`, `running`, `ok`, `error`, `skipped` hoặc `idle`. Trạng thái JSON vẫn ở dạng chuẩn và không được trang trí để công cụ bên ngoài có thể đọc trạng thái tác vụ mà không cần tự suy ra lại; đầu ra dành cho người dùng có thể trang trí các trạng thái `error` lặp lại bằng số lần thất bại.

Các mục `cron runs` bao gồm thông tin chẩn đoán gửi với đích Cron dự kiến, đích đã phân giải, các lần gửi của công cụ thông báo, việc sử dụng phương án dự phòng và trạng thái đã gửi.

Đổi đích tác tử và phiên:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` cảnh báo khi `--agent` bị bỏ qua trong các tác vụ lượt tác tử và chuyển sang dùng tác tử mặc định (`main`). Truyền `--agent <id>` tại thời điểm tạo để ghim một tác tử cụ thể.

Điều chỉnh hình thức gửi:

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
