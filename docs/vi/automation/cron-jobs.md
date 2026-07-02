---
read_when:
    - Lên lịch tác vụ nền hoặc đánh thức
    - Kết nối các trình kích hoạt bên ngoài (webhook, Gmail) vào OpenClaw
    - Quyết định giữa heartbeat và cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Công việc đã lên lịch, webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-07-02T08:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó duy trì các job, đánh thức agent vào đúng thời điểm và có thể chuyển đầu ra trở lại kênh chat hoặc điểm cuối webhook.

## Bắt đầu nhanh

<Steps>
  <Step title="Thêm lời nhắc chạy một lần">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Kiểm tra các job của bạn">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Xem lịch sử chạy">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cách cron hoạt động

- Cron chạy **bên trong tiến trình Gateway** (không chạy bên trong model).
- Định nghĩa job, trạng thái runtime và lịch sử chạy được duy trì trong cơ sở dữ liệu trạng thái SQLite dùng chung của OpenClaw, nên việc khởi động lại không làm mất lịch.
- Khi nâng cấp, hãy chạy `openclaw doctor --fix` để nhập các tệp cũ `~/.openclaw/cron/jobs.json`, `jobs-state.json` và `runs/*.jsonl` vào SQLite, rồi đổi tên chúng với hậu tố `.migrated`. Các hàng job sai định dạng sẽ bị bỏ qua khỏi runtime và được sao chép vào `jobs-quarantine.json` để sửa hoặc xem xét sau.
- `cron.store` vẫn đặt tên khóa kho cron logic và đường dẫn nhập của doctor. Sau khi nhập, việc chỉnh sửa tệp JSON đó không còn thay đổi các cron job đang hoạt động; thay vào đó hãy dùng `openclaw cron add|edit|remove` hoặc các phương thức Gateway cron RPC.
- Mọi lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các job lượt agent cô lập quá hạn sẽ được lên lịch lại ngoài cửa sổ kết nối kênh thay vì phát lại ngay lập tức, nhờ đó quá trình khởi động Discord/Telegram và thiết lập lệnh native vẫn phản hồi tốt sau khi khởi động lại.
- Các job chạy một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron cô lập sẽ cố gắng đóng các tab/tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại các tiến trình mồ côi.
- Các lần chạy cron cô lập nhận được quyền tự dọn dẹp cron phạm vi hẹp vẫn có thể đọc trạng thái bộ lập lịch, danh sách tự lọc của job hiện tại của chúng và lịch sử chạy của job đó, để các kiểm tra trạng thái/Heartbeat có thể kiểm tra lịch của chính mình mà không có quyền rộng hơn để thay đổi cron.
- Các lần chạy cron cô lập cũng bảo vệ khỏi các phản hồi xác nhận đã lỗi thời. Nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không còn lần chạy subagent hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi phân phối.
- Các lần chạy cron cô lập dùng metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, bao gồm các wrapper node-host `UNAVAILABLE` có thông báo lỗi lồng bên trong bắt đầu bằng `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là lần chạy xanh, trong khi văn bản trợ lý thông thường không bị xem là từ chối.
- Các lần chạy cron cô lập cũng xem lỗi agent ở cấp lần chạy là lỗi job ngay cả khi không tạo ra payload phản hồi, để lỗi model/provider tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì xóa job như thể đã thành công.
- Khi một job lượt agent cô lập đạt `timeoutSeconds`, cron hủy lần chạy agent bên dưới và cấp cho nó một cửa sổ dọn dẹp ngắn. Nếu lần chạy không thoát hết, quá trình dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat trong hàng đợi không bị kẹt sau một phiên xử lý đã lỗi thời.
- Nếu một lượt agent cô lập bị treo trước khi runner bắt đầu hoặc trước lần gọi model đầu tiên, cron ghi nhận một timeout theo pha cụ thể như `setup timed out before runner start` hoặc `stalled before first model call (last phase: context-engine)`. Các watchdog này bao phủ provider nhúng và provider dựa trên CLI trước khi tiến trình CLI bên ngoài của chúng thực sự được khởi động, và được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động lạnh/xác thực/ngữ cảnh xuất hiện nhanh thay vì chờ toàn bộ ngân sách job.
- Nếu bạn dùng cron hệ thống hoặc một bộ lập lịch bên ngoài khác để chạy `openclaw agent`, hãy bọc nó bằng cơ chế nâng cấp hard-kill dù CLI xử lý `SIGTERM`/`SIGINT`. Các lần chạy được Gateway hậu thuẫn yêu cầu Gateway hủy các lần chạy đã được chấp nhận; các lần chạy dự phòng local và nhúng nhận cùng tín hiệu hủy. Với GNU `timeout`, hãy ưu tiên `timeout -k 60 600 openclaw agent ...` hơn `timeout 600 ...` thuần túy; giá trị `-k` là chốt chặn của trình giám sát nếu tiến trình không thể thoát hết. Với các unit systemd, giữ cùng hình dạng bằng cách dùng tín hiệu dừng `SIGTERM` cùng một cửa sổ gia hạn như `TimeoutStopSec` trước bất kỳ lần kill cuối nào. Nếu một lần thử lại tái sử dụng `--run-id` trong khi lần chạy Gateway gốc vẫn đang hoạt động, bản trùng lặp sẽ được báo cáo là đang chạy thay vì bắt đầu lần chạy thứ hai.

<a id="maintenance"></a>

<Note>
Đối soát tác vụ cho cron trước hết do runtime sở hữu, sau đó được lịch sử bền vững hậu thuẫn: một tác vụ cron đang hoạt động vẫn sống khi cron runtime vẫn theo dõi job đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu job và cửa sổ gia hạn 5 phút hết hạn, kiểm tra bảo trì sẽ xem nhật ký chạy được duy trì và trạng thái job cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền vững đó cho thấy kết quả kết thúc, sổ cái tác vụ sẽ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm toán CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không xem tập job đang hoạt động trong tiến trình của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI    | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng thời gian cố định                                |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được xem là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ tường địa phương.

Các biểu thức lặp lại đúng đầu giờ được tự động rải lệch tối đa 5 phút để giảm đỉnh tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` để đặt một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp — không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5–6 lần mỗi tháng thay vì 0–1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, hãy dùng modifier ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch theo một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của job.

## Kiểu thực thi

| Kiểu            | Giá trị `--session` | Chạy trong                | Phù hợp nhất cho               |
| --------------- | ------------------- | ------------------------- | ------------------------------ |
| Phiên chính     | `main`              | Lane đánh thức cron riêng | Lời nhắc, sự kiện hệ thống     |
| Cô lập          | `isolated`          | `cron:<jobId>` riêng      | Báo cáo, việc nền định kỳ      |
| Phiên hiện tại  | `current`           | Gắn tại thời điểm tạo     | Công việc lặp lại cần ngữ cảnh |
| Phiên tùy chỉnh | `session:custom-id` | Phiên được đặt tên bền vững | Quy trình làm việc xây trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính so với cô lập so với tùy chỉnh">
    Các job **phiên chính** đưa một sự kiện hệ thống vào lane chạy do cron sở hữu và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Chúng có thể dùng ngữ cảnh phân phối cuối cùng của phiên chính đích cho phản hồi, nhưng chúng không thêm các lượt cron định kỳ vào lane chat của con người và không kéo dài độ mới của reset hằng ngày/nhàn rỗi cho phiên đích. Các job **cô lập** chạy một lượt agent riêng với phiên mới. **Phiên tùy chỉnh** (`session:xxx`) duy trì ngữ cảnh qua các lần chạy, cho phép các quy trình như standup hằng ngày xây trên các bản tóm tắt trước đó.

    Các sự kiện cron phiên chính là lời nhắc sự kiện hệ thống độc lập. Chúng
    không tự động bao gồm chỉ dẫn "Read
    HEARTBEAT.md" của prompt Heartbeat mặc định. Nếu một lời nhắc lặp lại cần tham khảo
    `HEARTBEAT.md`, hãy nói rõ điều đó trong văn bản sự kiện cron hoặc trong
    chỉ dẫn riêng của agent.

  </Accordion>
  <Accordion title="'Phiên mới' nghĩa là gì đối với job cô lập">
    Với các job cô lập, "phiên mới" nghĩa là một transcript/session id mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập thinking/fast/verbose, nhãn và các ghi đè model/auth do người dùng chọn rõ ràng, nhưng nó không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, elevation, origin hoặc ràng buộc runtime ACP. Dùng `current` hoặc `session:<id>` khi một job lặp lại cần chủ ý xây trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Với các job cô lập, quá trình teardown runtime hiện bao gồm dọn dẹp trình duyệt theo best-effort cho phiên cron đó. Lỗi dọn dẹp bị bỏ qua để kết quả cron thực tế vẫn thắng.

    Các lần chạy cron cô lập cũng dispose mọi phiên bản MCP runtime đi kèm được tạo cho job thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách client MCP của phiên chính và phiên tùy chỉnh được teardown, nên các job cron cô lập không rò rỉ tiến trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Phân phối subagent và Discord">
    Khi các lần chạy cron cô lập điều phối subagent, việc phân phối cũng ưu tiên đầu ra cuối cùng của hậu duệ hơn văn bản tạm thời đã lỗi thời của parent. Nếu các hậu duệ vẫn đang chạy, OpenClaw sẽ chặn cập nhật parent một phần đó thay vì thông báo nó.

    Với các mục tiêu thông báo Discord chỉ có văn bản, OpenClaw gửi văn bản trợ lý cuối cùng chuẩn một lần thay vì phát lại cả các payload văn bản được stream/trung gian và câu trả lời cuối cùng. Media và payload Discord có cấu trúc vẫn được phân phối dưới dạng các payload riêng để attachment và component không bị bỏ sót.

  </Accordion>
</AccordionGroup>

### Payload lệnh

Dùng payload lệnh cho các script xác định cần chạy bên trong bộ lập lịch Gateway mà không bắt đầu một lượt agent cô lập được model hậu thuẫn. Job lệnh thực thi trên host Gateway, thu stdout/stderr, ghi lại lần chạy trong lịch sử cron và tái sử dụng cùng các chế độ phân phối `announce`, `webhook` và `none` như job cô lập.

<Note>
Command cron là một bề mặt tự động hóa Gateway dành cho operator-admin, không phải một lệnh gọi
`tools.exec` của agent. Tạo, cập nhật, xóa hoặc chạy thủ công các cron job
yêu cầu `operator.admin`; các lần chạy lệnh theo lịch sau đó thực thi bên trong
tiến trình Gateway dưới dạng tự động hóa do admin đó tạo. Chính sách exec của agent như
`tools.exec.mode`, prompt phê duyệt và allowlist công cụ theo từng agent điều chỉnh
các công cụ exec hiển thị với model, không phải payload command cron.
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

`--command <shell>` lưu `argv: ["sh", "-lc", <shell>]`. Dùng `--command-argv '["node","scripts/report.mjs"]'` khi bạn muốn thực thi argv chính xác mà không phân tích shell. Các trường tùy chọn `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` và `--output-max-bytes` kiểm soát môi trường tiến trình, stdin và giới hạn đầu ra.

Nếu stdout không rỗng, văn bản đó là kết quả được gửi. Nếu stdout rỗng và stderr không rỗng, stderr được gửi. Nếu cả hai luồng đều có nội dung, cron gửi một khối `stdout:` / `stderr:` nhỏ. Mã thoát bằng không ghi nhận lượt chạy là `ok`; mã thoát khác không, tín hiệu, hết thời gian chờ, hoặc hết thời gian chờ không có đầu ra ghi nhận `error` và có thể kích hoạt cảnh báo lỗi. Lệnh chỉ in `NO_REPLY` dùng cơ chế chặn token im lặng bình thường của cron và không đăng gì trở lại cuộc trò chuyện.

### Tùy chọn payload cho tác vụ cô lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc cho chế độ cô lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; dùng mô hình được phép đã chọn cho tác vụ.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Danh sách mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Truyền `--fallbacks ""` để chạy nghiêm ngặt không có dự phòng.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Trên `cron edit`, xóa ghi đè dự phòng theo tác vụ để tác vụ tuân theo thứ tự ưu tiên dự phòng đã cấu hình. Không thể kết hợp với `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Trên `cron edit`, xóa ghi đè mô hình theo tác vụ để tác vụ tuân theo thứ tự ưu tiên chọn mô hình cron bình thường (ghi đè phiên cron đã lưu nếu có, nếu không thì mô hình agent/mặc định). Không thể kết hợp với `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức suy nghĩ.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Trên `cron edit`, xóa ghi đè suy nghĩ theo tác vụ để tác vụ tuân theo thứ tự ưu tiên suy nghĩ cron bình thường. Không thể kết hợp với `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua việc chèn tệp bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn các công cụ mà tác vụ có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của tác vụ đó. Nó không giống ghi đè `/model` của phiên trò chuyện: các chuỗi dự phòng đã cấu hình vẫn được áp dụng khi mô hình chính của tác vụ thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm quay về lựa chọn mô hình agent/mặc định của tác vụ.

Tác vụ Cron cũng có thể mang `fallbacks` ở cấp payload. Khi có, danh sách đó thay thế chuỗi dự phòng đã cấu hình cho tác vụ. Dùng `fallbacks: []` trong payload/API của tác vụ khi bạn muốn một lượt chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu tác vụ có `--model` nhưng không có dự phòng trong payload lẫn cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của agent không được thêm vào như một mục tiêu thử lại ẩn.

Các bước kiểm tra trước nhà cung cấp cục bộ duyệt qua các dự phòng đã cấu hình trước khi đánh dấu lượt chạy cron là `skipped`; `fallbacks: []` giữ đường kiểm tra trước đó ở chế độ nghiêm ngặt.

Thứ tự ưu tiên chọn mô hình cho tác vụ cô lập là:

1. Ghi đè mô hình hook Gmail (khi lượt chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong payload theo tác vụ
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình agent/mặc định

Chế độ nhanh cũng đi theo lựa chọn live đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập dùng giá trị đó theo mặc định. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng. Chế độ tự động dùng ngưỡng `params.fastAutoOnSeconds` của mô hình đã chọn khi có, mặc định là 60 giây.

Nếu một lượt chạy cô lập gặp bàn giao chuyển mô hình live, cron thử lại với nhà cung cấp/mô hình đã chuyển và lưu lựa chọn live đó cho lượt chạy đang hoạt động trước khi thử lại. Khi chuyển đổi cũng mang theo hồ sơ xác thực mới, cron cũng lưu ghi đè hồ sơ xác thực đó cho lượt chạy đang hoạt động. Số lần thử lại có giới hạn: sau lần thử ban đầu cộng 2 lần thử lại chuyển đổi, cron hủy thay vì lặp vô hạn.

Trước khi một lượt chạy cron cô lập đi vào trình chạy agent, OpenClaw kiểm tra các endpoint nhà cung cấp cục bộ có thể truy cập cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là local loopback, mạng riêng hoặc `.local`. Nếu endpoint đó ngừng hoạt động, lượt chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả endpoint được lưu cache trong 5 phút, nên nhiều tác vụ đến hạn dùng cùng máy chủ Ollama, vLLM, SGLang hoặc LM Studio cục bộ đã chết sẽ chia sẻ một probe nhỏ thay vì tạo một cơn bão yêu cầu. Các lượt chạy bị bỏ qua do kiểm tra trước nhà cung cấp không làm tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn nhận thông báo bỏ qua lặp lại.

## Gửi và đầu ra

| Chế độ     | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Gửi văn bản cuối cùng dự phòng tới đích nếu agent chưa gửi         |
| `webhook`  | POST payload sự kiện hoàn tất tới một URL                          |
| `none`     | Không gửi dự phòng từ trình chạy                                   |

Dùng `--announce --channel telegram --to "-1001234567890"` để gửi tới kênh. Với chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; OpenClaw cũng chấp nhận dạng viết tắt thuộc Telegram là `-1001234567890:123`. Các bên gọi RPC/cấu hình trực tiếp có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Đích Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng đúng ID phòng hoặc dạng `room:!room:server` từ Matrix.

Khi gửi announce dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron quay về lịch sử phiên hoặc một kênh đã cấu hình duy nhất. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được khai báo rõ, tiền tố đích phải nêu cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối thay vì để WhatsApp diễn giải ID Telegram là số điện thoại. Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Với tác vụ cô lập, việc gửi trò chuyện được chia sẻ. Nếu có tuyến trò chuyện khả dụng, agent có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu agent gửi tới đích đã cấu hình/hiện tại, OpenClaw bỏ qua announce dự phòng. Nếu không, `announce`, `webhook`, và `none` chỉ kiểm soát việc trình chạy xử lý phản hồi cuối cùng sau lượt agent.

Khi agent tạo nhắc nhở cô lập từ một cuộc trò chuyện đang hoạt động, OpenClaw lưu đích gửi live được giữ lại cho tuyến announce dự phòng. Khóa phiên nội bộ có thể là chữ thường; đích gửi của nhà cung cấp không được tái tạo từ các khóa đó khi có ngữ cảnh trò chuyện hiện tại.

Gửi announce ngầm định dùng allowlist kênh đã cấu hình để xác thực và định tuyến lại các đích cũ. Phê duyệt từ kho ghép cặp DM không phải là người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi tới DM.

## Ngôn ngữ đầu ra

Tác vụ Cron không suy luận ngôn ngữ phản hồi từ kênh, locale, hoặc tin nhắn
trước đó. Đặt quy tắc ngôn ngữ trong tin nhắn hoặc mẫu đã lên lịch:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Với tệp mẫu, giữ hướng dẫn ngôn ngữ trong prompt đã render và
xác minh các placeholder như `{{language}}` đã được điền trước khi tác vụ chạy. Nếu
đầu ra trộn nhiều ngôn ngữ, hãy đặt quy tắc rõ ràng, ví dụ: "Use Chinese
for narrative text and keep technical terms in English."

Thông báo lỗi đi theo một đường đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè giá trị đó theo từng tác vụ.
- Nếu cả hai đều không được đặt và tác vụ đã gửi qua `announce`, thông báo lỗi giờ sẽ quay về đích announce chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên tác vụ `sessionTarget="isolated"` trừ khi chế độ gửi chính là `webhook`.
- `failureAlert.includeSkipped: true` đưa một tác vụ hoặc chính sách cảnh báo cron toàn cục vào cảnh báo lượt chạy bị bỏ qua lặp lại. Lượt chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến backoff lỗi thực thi.

## Ví dụ CLI

<Tabs>
  <Tab title="Nhắc nhở một lần">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Tác vụ cô lập lặp lại">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Ghi đè mô hình và suy nghĩ">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Đầu ra Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Đầu ra lệnh">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhook

Gateway có thể mở endpoint Webhook HTTP cho trình kích hoạt bên ngoài. Bật trong cấu hình:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Xác thực

Mỗi yêu cầu phải bao gồm token hook qua header:

- `Authorization: Bearer <token>` (khuyến nghị)
- `x-openclaw-token: <token>`

Token trong chuỗi truy vấn bị từ chối.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Đưa một sự kiện hệ thống vào hàng đợi cho phiên chính:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Mô tả sự kiện.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` hoặc `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Chạy một lượt agent cô lập:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Trường: `message` (bắt buộc), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook đã ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Ánh xạ có thể chuyển đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các endpoint hook phía sau loopback, tailnet hoặc reverse proxy tin cậy.

- Dùng token hook chuyên dụng; không dùng lại token xác thực Gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn effective agent mà hook có thể nhắm tới, bao gồm agent mặc định khi bỏ qua `agentId`.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do caller chọn.
- Nếu bật `hooks.allowRequestSessionKey`, hãy đặt thêm `hooks.allowedSessionKeyPrefixes` để ràng buộc dạng session key được phép.
- Payload hook mặc định được bọc bằng các ranh giới an toàn.

</Warning>

## Tích hợp Gmail PubSub

Kết nối trigger hộp thư đến Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw đã bật, Tailscale cho endpoint HTTPS công khai.
</Note>

### Thiết lập bằng wizard (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail, và dùng Tailscale Funnel cho endpoint push.

### Tự động khởi động Gateway

Khi `hooks.enabled=true` và `hooks.gmail.account` đã được đặt, Gateway khởi động `gog gmail watch serve` khi boot và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không dùng.

### Thiết lập thủ công một lần

<Steps>
  <Step title="Chọn dự án GCP">
    Chọn dự án GCP sở hữu OAuth client được `gog` sử dụng:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Tạo topic và cấp quyền truy cập push cho Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Bắt đầu watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Ghi đè model cho Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Quản lý job

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` trả về sau khi đưa lượt chạy thủ công vào hàng đợi. Dùng `--wait` cho shutdown hook, script bảo trì, hoặc tự động hóa khác cần chặn cho đến khi lượt chạy trong hàng đợi hoàn tất. Chế độ chờ thăm dò đúng `runId` được trả về; chế độ này thoát `0` với trạng thái `ok` và khác không với `error`, `skipped`, hoặc hết thời gian chờ.

Công cụ `cron` của agent trả về tóm tắt job gọn (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) từ `cron(action: "list")`; dùng `cron(action: "get", jobId: "...")` để lấy một định nghĩa job đầy đủ. Caller Gateway trực tiếp có thể truyền `compact: true` vào `cron.list`; nếu bỏ qua, phản hồi đầy đủ hiện có kèm bản xem trước phân phối sẽ được giữ nguyên.

`openclaw cron create` là alias của `openclaw cron add`, và job mới có thể dùng lịch dạng đối số vị trí (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, hoặc timestamp ISO) theo sau là prompt agent dạng đối số vị trí. Dùng `--webhook <url>` trên `cron add|create` hoặc `cron edit` để POST payload lượt chạy đã hoàn tất tới một endpoint HTTP. Phân phối Webhook không thể kết hợp với các cờ phân phối chat như `--announce`, `--channel`, `--to`, `--thread-id`, hoặc `--account`. Trên `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id`, và `--clear-account` bỏ đặt riêng từng trường định tuyến đó (mỗi cờ bị từ chối khi đi cùng cờ đặt tương ứng), khác với việc `--no-deliver` tắt phân phối dự phòng của runner.

<Note>
Ghi chú ghi đè model:

- `openclaw cron add|edit --model ...` thay đổi model được chọn của job.
- Nếu model được phép, đúng provider/model đó sẽ tới lượt chạy agent cô lập.
- Nếu không được phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng.
- Bản vá payload API `cron.update` có thể đặt `model: null` để xóa ghi đè model đã lưu của job.
- `openclaw cron edit <job-id> --clear-model` xóa ghi đè đó khỏi CLI (cùng hiệu lực với bản vá `model: null`) và không thể kết hợp với `--model`.
- Các chuỗi fallback đã cấu hình vẫn áp dụng vì `--model` của cron là primary của job, không phải ghi đè `/model` của phiên.
- `openclaw cron add|edit --fallbacks ...` đặt payload `fallbacks`, thay thế fallback đã cấu hình cho job đó; `--fallbacks ""` tắt fallback và làm lượt chạy nghiêm ngặt. `openclaw cron edit <job-id> --clear-fallbacks` xóa ghi đè theo job.
- Một `--model` đơn thuần không có danh sách fallback tường minh hoặc đã cấu hình sẽ không rơi tiếp sang primary của agent như một mục tiêu thử lại bổ sung âm thầm.

</Note>

## Cấu hình

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` giới hạn cả việc dispatch cron đã lập lịch và thực thi lượt agent cô lập, mặc định là 8. Các lượt agent cron cô lập dùng nội bộ làn thực thi `cron-nested` chuyên dụng của hàng đợi, nên tăng giá trị này cho phép các lượt chạy LLM cron độc lập tiến triển song song thay vì chỉ khởi động wrapper cron bên ngoài của chúng. Làn `nested` không phải cron dùng chung không được mở rộng bởi thiết lập này.

`cron.store` là khóa kho logic và đường dẫn nhập doctor legacy. Chạy `openclaw doctor --fix` để nhập các kho JSON hiện có vào SQLite và lưu trữ chúng; các thay đổi cron trong tương lai nên đi qua CLI hoặc Gateway API.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (rate limit, quá tải, mạng, lỗi server) thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn tắt ngay lập tức.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lượt chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) dọn các mục phiên chạy cô lập. `cron.runLog.keepLines` giới hạn số hàng lịch sử chạy SQLite được giữ lại trên mỗi job; `maxBytes` được giữ lại để tương thích cấu hình với run log cũ dựa trên tệp.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

### Thang lệnh

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron không kích hoạt">
    - Kiểm tra biến môi trường `cron.enabled` và `OPENCLAW_SKIP_CRON`.
    - Xác nhận Gateway đang chạy liên tục.
    - Với lịch `cron`, xác minh múi giờ (`--tz`) so với múi giờ của host.
    - `reason: not-due` trong đầu ra lượt chạy nghĩa là lượt chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và job chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không có phân phối">
    - Chế độ phân phối `none` nghĩa là không mong đợi gửi dự phòng từ runner. Agent vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến chat.
    - Thiếu hoặc không hợp lệ mục tiêu phân phối (`channel`/`to`) nghĩa là outbound đã bị bỏ qua.
    - Với Matrix, job được sao chép hoặc legacy có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh job thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là phân phối đã bị chặn bởi thông tin xác thực.
    - Nếu lượt chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn phân phối outbound trực tiếp và cũng chặn đường dẫn tóm tắt dự phòng trong hàng đợi, nên không có gì được đăng lại vào chat.
    - Nếu agent cần tự nhắn cho người dùng, hãy kiểm tra job có tuyến dùng được (`channel: "last"` với một cuộc chat trước đó, hoặc kênh/mục tiêu tường minh).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn rollover kiểu /new">
    - Độ mới của đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức cron, lượt chạy Heartbeat, thông báo exec, và bookkeeping của gateway có thể cập nhật hàng phiên cho định tuyến/trạng thái, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng legacy được tạo trước khi những trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ header phiên transcript JSONL khi tệp vẫn còn sẵn có. Hàng nhàn rỗi legacy không có `lastInteractionAt` dùng thời điểm bắt đầu đã khôi phục đó làm baseline nhàn rỗi.

  </Accordion>
  <Accordion title="Lưu ý về múi giờ">
    - Cron không có `--tz` dùng múi giờ của host gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - `activeHours` của Heartbeat dùng phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa](/vi/automation) — tất cả cơ chế tự động hóa trong một cái nhìn tổng quan
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
