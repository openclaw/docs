---
read_when:
    - Lên lịch tác vụ nền hoặc đánh thức
    - Kết nối các trình kích hoạt bên ngoài (webhook, Gmail) vào OpenClaw
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Tác vụ đã lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-07-01T08:11:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu bền các tác vụ, đánh thức agent vào đúng thời điểm và có thể gửi đầu ra trở lại kênh chat hoặc endpoint Webhook.

## Bắt đầu nhanh

<Steps>
  <Step title="Thêm một lời nhắc chạy một lần">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Kiểm tra các tác vụ của bạn">
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

- Cron chạy **bên trong tiến trình Gateway** (không chạy bên trong mô hình).
- Định nghĩa tác vụ, trạng thái runtime và lịch sử chạy được lưu bền trong cơ sở dữ liệu trạng thái SQLite dùng chung của OpenClaw, nên việc khởi động lại không làm mất lịch.
- Khi nâng cấp, chạy `openclaw doctor --fix` để nhập các tệp cũ `~/.openclaw/cron/jobs.json`, `jobs-state.json` và `runs/*.jsonl` vào SQLite rồi đổi tên chúng với hậu tố `.migrated`. Các hàng tác vụ sai định dạng sẽ bị bỏ qua khỏi runtime và được sao chép vào `jobs-quarantine.json` để sửa hoặc xem xét sau.
- `cron.store` vẫn đặt tên cho khóa kho lưu trữ cron logic và đường dẫn nhập của doctor. Sau khi nhập, việc chỉnh sửa tệp JSON đó không còn thay đổi các tác vụ cron đang hoạt động; thay vào đó hãy dùng `openclaw cron add|edit|remove` hoặc các phương thức RPC cron của Gateway.
- Mọi lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các tác vụ agent-turn biệt lập đã quá hạn được lên lịch lại ra ngoài cửa sổ kết nối kênh thay vì phát lại ngay lập tức, để quá trình khởi động Discord/Telegram và thiết lập native-command vẫn phản hồi nhanh sau khi khởi động lại.
- Các tác vụ chạy một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron biệt lập cố gắng đóng các tab/tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại tiến trình mồ côi.
- Các lần chạy cron biệt lập nhận được quyền tự dọn dẹp cron hẹp vẫn có thể đọc trạng thái bộ lập lịch, danh sách tự lọc của tác vụ hiện tại của chính chúng và lịch sử chạy của tác vụ đó, để các kiểm tra trạng thái/Heartbeat có thể kiểm tra lịch của chính chúng mà không có quyền đột biến cron rộng hơn.
- Các lần chạy cron biệt lập cũng bảo vệ khỏi các phản hồi xác nhận đã lỗi thời. Nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không có lần chạy subagent hậu duệ nào vẫn chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron biệt lập dùng metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, bao gồm các wrapper node-host `UNAVAILABLE` có thông báo lỗi lồng nhau bắt đầu bằng `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`, để một lệnh bị chặn không được báo cáo là lần chạy xanh trong khi văn bản thông thường của assistant không bị coi là từ chối.
- Các lần chạy cron biệt lập cũng coi lỗi agent ở cấp lần chạy là lỗi tác vụ ngay cả khi không tạo ra payload phản hồi, để lỗi mô hình/nhà cung cấp tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì xóa tác vụ như đã thành công.
- Khi một tác vụ agent-turn biệt lập đạt `timeoutSeconds`, cron hủy lần chạy agent bên dưới và cho nó một khoảng thời gian dọn dẹp ngắn. Nếu lần chạy không thoát hết, quá trình dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat đang xếp hàng không bị kẹt sau một phiên xử lý đã lỗi thời.
- Nếu một agent-turn biệt lập bị đình trệ trước khi runner bắt đầu hoặc trước lệnh gọi mô hình đầu tiên, cron ghi nhận một timeout theo từng giai đoạn, chẳng hạn `setup timed out before runner start` hoặc `stalled before first model call (last phase: context-engine)`. Các watchdog này bao phủ nhà cung cấp nhúng và nhà cung cấp dựa trên CLI trước khi tiến trình CLI bên ngoài của chúng thực sự được khởi động, và được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động nguội/xác thực/ngữ cảnh xuất hiện nhanh thay vì chờ toàn bộ ngân sách tác vụ.
- Nếu bạn dùng system cron hoặc một bộ lập lịch bên ngoài khác để chạy `openclaw agent`, hãy bọc nó bằng cơ chế leo thang hard-kill dù CLI xử lý `SIGTERM`/`SIGINT`. Các lần chạy dựa trên Gateway yêu cầu Gateway hủy các lần chạy đã được chấp nhận; các lần chạy fallback cục bộ và nhúng nhận cùng tín hiệu hủy. Với GNU `timeout`, ưu tiên `timeout -k 60 600 openclaw agent ...` thay vì `timeout 600 ...` thuần; giá trị `-k` là chốt chặn của supervisor nếu tiến trình không thể thoát hết. Với các unit systemd, giữ cùng dạng bằng cách dùng tín hiệu dừng `SIGTERM` cộng với một cửa sổ gia hạn như `TimeoutStopSec` trước mọi lần kill cuối cùng. Nếu một lần thử lại tái sử dụng `--run-id` trong khi lần chạy Gateway ban đầu vẫn đang hoạt động, bản trùng lặp sẽ được báo cáo là đang chạy thay vì bắt đầu lần chạy thứ hai.

<a id="maintenance"></a>

<Note>
Đối chiếu tác vụ cho cron trước hết do runtime sở hữu, sau đó dựa trên lịch sử bền vững: một tác vụ cron đang hoạt động vẫn sống khi runtime cron vẫn theo dõi tác vụ đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu tác vụ và cửa sổ gia hạn 5 phút hết hạn, các kiểm tra bảo trì sẽ xem nhật ký chạy được lưu bền và trạng thái tác vụ cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền vững đó cho thấy một kết quả kết thúc, sổ cái tác vụ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm tra CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không coi tập tác vụ đang hoạt động trong tiến trình rỗng của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Kiểu lịch

| Loại    | Cờ CLI    | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng thời gian cố định                                |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được coi là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ địa phương trên đồng hồ tường.

Các biểu thức lặp lại ở đầu giờ được tự động giãn cách tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức Cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải wildcard, croner khớp khi **một trong hai** trường khớp, chứ không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5-6 lần mỗi tháng thay vì 0-1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của job.

## Kiểu thực thi

| Kiểu            | Giá trị `--session` | Chạy trong               | Phù hợp nhất cho               |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| Phiên chính     | `main`              | Làn đánh thức cron riêng | Nhắc nhở, sự kiện hệ thống     |
| Cô lập          | `isolated`          | `cron:<jobId>` riêng     | Báo cáo, việc nền định kỳ      |
| Phiên hiện tại  | `current`           | Được gắn khi tạo         | Công việc định kỳ theo ngữ cảnh |
| Phiên tùy chỉnh | `session:custom-id` | Phiên có tên bền vững    | Quy trình làm việc xây dựng trên lịch sử |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Job **phiên chính** đưa một sự kiện hệ thống vào làn chạy do cron sở hữu và tùy chọn đánh thức heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Chúng có thể dùng ngữ cảnh gửi gần nhất của phiên chính đích để trả lời, nhưng không thêm lượt cron thường lệ vào làn chat với người dùng và không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi cho phiên đích. Job **cô lập** chạy một lượt agent riêng với một phiên mới. **Phiên tùy chỉnh** (`session:xxx`) duy trì ngữ cảnh qua các lần chạy, cho phép các quy trình như standup hằng ngày xây dựng trên các bản tóm tắt trước đó.

    Sự kiện cron của phiên chính là các nhắc nhở sự kiện hệ thống độc lập. Chúng không tự động bao gồm chỉ dẫn "Đọc HEARTBEAT.md" trong prompt heartbeat mặc định. Nếu một nhắc nhở định kỳ cần tham khảo `HEARTBEAT.md`, hãy nói rõ điều đó trong văn bản sự kiện cron hoặc trong chỉ dẫn riêng của agent.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Với job cô lập, "phiên mới" nghĩa là một id transcript/phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập thinking/fast/verbose, nhãn và các ghi đè model/auth do người dùng chọn rõ ràng, nhưng không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, elevation, origin hoặc ràng buộc runtime ACP. Dùng `current` hoặc `session:<id>` khi một job định kỳ cần chủ ý xây dựng trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Với job cô lập, việc dọn dẹp runtime hiện bao gồm dọn dẹp trình duyệt theo nỗ lực tốt nhất cho phiên cron đó. Lỗi dọn dẹp được bỏ qua để kết quả cron thực tế vẫn là kết quả quyết định.

    Các lần chạy cron cô lập cũng hủy mọi phiên bản runtime MCP đi kèm được tạo cho job thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách client MCP của phiên chính và phiên tùy chỉnh được gỡ bỏ, nên job cron cô lập không rò rỉ tiến trình con stdio hoặc kết nối MCP tồn tại lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Khi các lần chạy cron cô lập điều phối subagent, việc gửi cũng ưu tiên đầu ra cuối cùng của hậu duệ thay vì văn bản tạm thời cũ của cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw sẽ chặn bản cập nhật cha một phần đó thay vì thông báo nó.

    Với đích thông báo Discord chỉ văn bản, OpenClaw gửi văn bản assistant cuối cùng chuẩn một lần thay vì phát lại cả payload văn bản được stream/trung gian và câu trả lời cuối cùng. Payload Discord dạng media và có cấu trúc vẫn được gửi dưới dạng payload riêng để tệp đính kèm và thành phần không bị bỏ sót.

  </Accordion>
</AccordionGroup>

### Payload lệnh

Dùng payload lệnh cho các script tất định cần chạy bên trong bộ lập lịch Gateway mà không khởi động một lượt agent cô lập có model hỗ trợ. Job lệnh thực thi trên host Gateway, thu stdout/stderr, ghi lại lần chạy trong lịch sử cron và tái sử dụng cùng các chế độ gửi `announce`, `webhook` và `none` như job cô lập.

<Note>
Cron lệnh là một bề mặt tự động hóa Gateway dành cho quản trị viên vận hành, không phải một lệnh gọi `tools.exec` của agent. Việc tạo, cập nhật, xóa hoặc chạy thủ công job cron yêu cầu `operator.admin`; các lần chạy lệnh đã lập lịch sau đó thực thi bên trong tiến trình Gateway dưới dạng tự động hóa do quản trị viên đó tạo. Chính sách exec của agent như `tools.exec.mode`, prompt phê duyệt và danh sách cho phép công cụ theo từng agent chi phối các công cụ exec hiển thị với model, không phải payload cron lệnh.
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

`--command <shell>` lưu `argv: ["sh", "-lc", <shell>]`. Dùng `--command-argv '["node","scripts/report.mjs"]'` khi bạn muốn thực thi argv chính xác mà không phân tích cú pháp shell. Các trường tùy chọn `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` và `--output-max-bytes` kiểm soát môi trường tiến trình, stdin và giới hạn đầu ra.

Nếu stdout không rỗng, văn bản đó là kết quả được gửi. Nếu stdout rỗng và stderr không rỗng, stderr được gửi. Nếu cả hai luồng đều có nội dung, cron gửi một khối `stdout:` / `stderr:` nhỏ. Mã thoát bằng không ghi nhận lượt chạy là `ok`; mã thoát khác không, signal, timeout, hoặc timeout không có đầu ra ghi nhận `error` và có thể kích hoạt cảnh báo lỗi. Một lệnh chỉ in `NO_REPLY` sẽ dùng cơ chế chặn token im lặng thông thường của cron và không đăng gì lại vào cuộc trò chuyện.

### Tùy chọn payload cho tác vụ cô lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc với chế độ cô lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; dùng mô hình được phép đã chọn cho tác vụ.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Danh sách mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Truyền `--fallbacks ""` để chạy nghiêm ngặt, không có dự phòng.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Với `cron edit`, xóa ghi đè dự phòng theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên dự phòng đã cấu hình. Không thể kết hợp với `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Với `cron edit`, xóa ghi đè mô hình theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên chọn mô hình cron thông thường (ghi đè cron-session đã lưu nếu được đặt, nếu không thì mô hình agent/mặc định). Không thể kết hợp với `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức thinking.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Với `cron edit`, xóa ghi đè thinking theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên thinking cron thông thường. Không thể kết hợp với `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua chèn tệp bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn công cụ mà tác vụ có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của tác vụ đó. Nó không giống ghi đè `/model` của phiên trò chuyện: các chuỗi dự phòng đã cấu hình vẫn được áp dụng khi mô hình chính của tác vụ thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm quay về lựa chọn mô hình agent/mặc định của tác vụ.

Tác vụ Cron cũng có thể mang `fallbacks` ở cấp payload. Khi có mặt, danh sách đó thay thế chuỗi dự phòng đã cấu hình cho tác vụ. Dùng `fallbacks: []` trong payload/API của tác vụ khi bạn muốn một lượt chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu một tác vụ có `--model` nhưng không có dự phòng payload hay dự phòng đã cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của agent không được thêm vào như một mục tiêu thử lại bổ sung ẩn.

Kiểm tra preflight nhà cung cấp cục bộ sẽ duyệt qua các dự phòng đã cấu hình trước khi đánh dấu một lượt chạy cron là `skipped`; `fallbacks: []` giữ đường dẫn preflight đó ở chế độ nghiêm ngặt.

Thứ tự ưu tiên chọn mô hình cho tác vụ cô lập là:

1. Ghi đè mô hình Gmail hook (khi lượt chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong payload theo từng tác vụ
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình agent/mặc định

Chế độ nhanh cũng tuân theo lựa chọn live đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập dùng giá trị đó theo mặc định. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng. Chế độ tự động dùng ngưỡng `params.fastAutoOnSeconds` của mô hình đã chọn khi có, mặc định là 60 giây.

Nếu một lượt chạy cô lập gặp bàn giao chuyển mô hình live, cron thử lại với nhà cung cấp/mô hình đã chuyển và lưu lựa chọn live đó cho lượt chạy đang hoạt động trước khi thử lại. Khi lần chuyển cũng mang theo hồ sơ xác thực mới, cron cũng lưu ghi đè hồ sơ xác thực đó cho lượt chạy đang hoạt động. Số lần thử lại có giới hạn: sau lần thử ban đầu cộng thêm 2 lần thử lại do chuyển, cron hủy thay vì lặp mãi.

Trước khi một lượt chạy cron cô lập đi vào agent runner, OpenClaw kiểm tra các endpoint nhà cung cấp cục bộ có thể truy cập cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là loopback, mạng riêng, hoặc `.local`. Nếu endpoint đó ngừng hoạt động, lượt chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả endpoint được lưu cache trong 5 phút, nên nhiều tác vụ đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang, hoặc LM Studio cục bộ đã chết sẽ chia sẻ một phép thử nhỏ thay vì tạo bão yêu cầu. Các lượt chạy bị bỏ qua do provider-preflight không tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn nhận thông báo bỏ qua lặp lại.

## Gửi và đầu ra

| Chế độ     | Điều xảy ra                                                          |
| ---------- | --------------------------------------------------------------------- |
| `announce` | Gửi dự phòng văn bản cuối cùng đến đích nếu agent chưa gửi            |
| `webhook`  | POST payload sự kiện hoàn tất đến một URL                             |
| `none`     | Không có gửi dự phòng từ runner                                       |

Dùng `--announce --channel telegram --to "-1001234567890"` để gửi đến kênh. Với chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; OpenClaw cũng chấp nhận dạng viết tắt do Telegram sở hữu `-1001234567890:123`. Trình gọi RPC/config trực tiếp có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Đích Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng ID phòng chính xác hoặc dạng `room:!room:server` từ Matrix.

Khi gửi announce dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron quay về lịch sử phiên hoặc một kênh duy nhất đã cấu hình. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được chỉ định rõ, tiền tố đích phải nêu cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` bị từ chối thay vì để WhatsApp diễn giải ID Telegram như một số điện thoại. Tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Với tác vụ cô lập, gửi trò chuyện được chia sẻ. Nếu có tuyến trò chuyện, agent có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu agent gửi đến đích đã cấu hình/hiện tại, OpenClaw bỏ qua announce dự phòng. Nếu không, `announce`, `webhook`, và `none` chỉ kiểm soát runner làm gì với trả lời cuối cùng sau lượt agent.

Khi agent tạo lời nhắc cô lập từ một cuộc trò chuyện đang hoạt động, OpenClaw lưu đích gửi live đã giữ lại cho tuyến announce dự phòng. Khóa phiên nội bộ có thể là chữ thường; các đích gửi của nhà cung cấp không được tái tạo từ các khóa đó khi có ngữ cảnh trò chuyện hiện tại.

Gửi announce ngầm định dùng allowlist kênh đã cấu hình để xác thực và định tuyến lại các đích cũ. Phê duyệt trong kho ghép cặp DM không phải là người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi đến DM.

## Ngôn ngữ đầu ra

Tác vụ Cron không suy luận ngôn ngữ trả lời từ kênh, locale, hoặc các tin nhắn trước đó. Đặt quy tắc ngôn ngữ trong tin nhắn hoặc mẫu đã lên lịch:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Với tệp mẫu, giữ hướng dẫn ngôn ngữ trong prompt đã render và xác minh các placeholder như `{{language}}` đã được điền trước khi tác vụ chạy. Nếu đầu ra trộn nhiều ngôn ngữ, hãy đặt quy tắc rõ ràng, ví dụ: "Use Chinese for narrative text and keep technical terms in English."

Thông báo lỗi đi theo một đường dẫn đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè giá trị đó theo từng tác vụ.
- Nếu cả hai đều không được đặt và tác vụ đã gửi qua `announce`, thông báo lỗi hiện sẽ quay về đích announce chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên tác vụ `sessionTarget="isolated"` trừ khi chế độ gửi chính là `webhook`.
- `failureAlert.includeSkipped: true` đưa một tác vụ hoặc chính sách cảnh báo cron toàn cục vào cảnh báo lượt chạy bị bỏ qua lặp lại. Lượt chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến backoff lỗi thực thi.

## Ví dụ CLI

<Tabs>
  <Tab title="Lời nhắc một lần">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Tác vụ cô lập định kỳ">
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
  <Tab title="Ghi đè mô hình và thinking">
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

Gateway có thể hiển thị các endpoint Webhook HTTP cho trigger bên ngoài. Bật trong cấu hình:

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

Mọi yêu cầu phải bao gồm token hook qua header:

- `Authorization: Bearer <token>` (khuyến nghị)
- `x-openclaw-token: <token>`

Token trong query-string bị từ chối.

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
  <Accordion title="Hook được ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Mapping có thể biến đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc biến đổi bằng mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ endpoint hook sau loopback, tailnet, hoặc reverse proxy đáng tin cậy.

- Sử dụng token hook chuyên dụng; không dùng lại token xác thực Gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` sẽ bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn tác nhân hiệu lực mà một hook có thể nhắm tới, bao gồm tác nhân mặc định khi bỏ qua `agentId`.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do bên gọi chọn.
- Nếu bật `hooks.allowRequestSessionKey`, hãy đặt thêm `hooks.allowedSessionKeyPrefixes` để ràng buộc các dạng khóa phiên được phép.
- Payload hook mặc định được bọc bằng các ranh giới an toàn.

</Warning>

## Tích hợp Gmail PubSub

Kết nối trigger hộp thư Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), đã bật hook OpenClaw, Tailscale cho endpoint HTTPS công khai.
</Note>

### Thiết lập bằng trình hướng dẫn (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail và dùng Tailscale Funnel cho endpoint push.

### Tự động khởi động Gateway

Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động `gog gmail watch serve` khi boot và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để chọn không dùng.

### Thiết lập thủ công một lần

<Steps>
  <Step title="Chọn dự án GCP">
    Chọn dự án GCP sở hữu OAuth client được `gog` dùng:

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
  <Step title="Khởi động watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Ghi đè mô hình Gmail

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

## Quản lý tác vụ

```bash
# Liệt kê tất cả tác vụ
openclaw cron list

# Lấy một tác vụ đã lưu dưới dạng JSON
openclaw cron get <jobId>

# Hiển thị một tác vụ, bao gồm tuyến phân phối đã phân giải
openclaw cron show <jobId>

# Chỉnh sửa tác vụ
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Buộc chạy tác vụ ngay bây giờ
openclaw cron run <jobId>

# Buộc chạy tác vụ ngay bây giờ và chờ trạng thái kết thúc của nó
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Chỉ chạy nếu đã đến hạn
openclaw cron run <jobId> --due

# Xem lịch sử chạy
openclaw cron runs --id <jobId> --limit 50

# Xem một lượt chạy chính xác
openclaw cron runs --id <jobId> --run-id <runId>

# Xóa tác vụ
openclaw cron remove <jobId>

# Chọn tác nhân (thiết lập nhiều tác nhân)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` trả về sau khi đưa lượt chạy thủ công vào hàng đợi. Dùng `--wait` cho hook tắt, script bảo trì hoặc tự động hóa khác phải chặn cho đến khi lượt chạy trong hàng đợi hoàn tất. Chế độ chờ thăm dò đúng `runId` được trả về; chế độ này thoát `0` với trạng thái `ok` và khác 0 với `error`, `skipped` hoặc hết thời gian chờ.

Công cụ tác nhân `cron` trả về các tóm tắt tác vụ gọn (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) từ `cron(action: "list")`; dùng `cron(action: "get", jobId: "...")` để lấy một định nghĩa tác vụ đầy đủ. Bên gọi Gateway trực tiếp có thể truyền `compact: true` vào `cron.list`; nếu bỏ qua, phản hồi đầy đủ hiện có kèm bản xem trước phân phối sẽ được giữ nguyên.

`openclaw cron create` là bí danh của `openclaw cron add`, và tác vụ mới có thể dùng lịch theo vị trí (`"0 9 * * 1"`, `"every 1h"`, `"20m"` hoặc timestamp ISO), theo sau là prompt tác nhân theo vị trí. Dùng `--webhook <url>` trên `cron add|create` hoặc `cron edit` để POST payload lượt chạy đã hoàn tất tới một endpoint HTTP. Phân phối Webhook không thể kết hợp với các cờ phân phối chat như `--announce`, `--channel`, `--to`, `--thread-id` hoặc `--account`. Trên `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` và `--clear-account` bỏ đặt riêng từng trường định tuyến đó (mỗi cờ bị từ chối khi đi cùng cờ đặt tương ứng), khác với việc `--no-deliver` tắt phân phối dự phòng của runner.

<Note>
Ghi chú ghi đè mô hình:

- `openclaw cron add|edit --model ...` thay đổi mô hình đã chọn của tác vụ.
- Nếu mô hình được phép, đúng provider/model đó sẽ đến lượt chạy tác nhân cô lập.
- Nếu không được phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng.
- Các patch payload API `cron.update` có thể đặt `model: null` để xóa ghi đè mô hình tác vụ đã lưu.
- `openclaw cron edit <job-id> --clear-model` xóa ghi đè đó khỏi CLI (cùng hiệu lực với patch `model: null`) và không thể kết hợp với `--model`.
- Các chuỗi dự phòng đã cấu hình vẫn áp dụng vì cron `--model` là mô hình chính của tác vụ, không phải ghi đè `/model` của phiên.
- `openclaw cron add|edit --fallbacks ...` đặt payload `fallbacks`, thay thế các dự phòng đã cấu hình cho tác vụ đó; `--fallbacks ""` tắt dự phòng và khiến lượt chạy nghiêm ngặt. `openclaw cron edit <job-id> --clear-fallbacks` xóa ghi đè theo tác vụ.
- Một `--model` trơn không có danh sách dự phòng tường minh hoặc đã cấu hình sẽ không rơi tiếp sang mô hình chính của tác nhân như một mục tiêu thử lại bổ sung âm thầm.

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

`maxConcurrentRuns` giới hạn cả việc dispatch cron theo lịch và thực thi lượt tác nhân cô lập, mặc định là 8. Các lượt tác nhân cron cô lập dùng lane thực thi `cron-nested` chuyên dụng của hàng đợi ở bên trong, nên việc tăng giá trị này cho phép các lượt chạy LLM cron độc lập tiến hành song song thay vì chỉ khởi động các wrapper cron bên ngoài của chúng. Lane `nested` dùng chung ngoài cron không được mở rộng bởi thiết lập này.

`cron.store` là khóa kho lưu trữ logic và đường dẫn nhập doctor cũ. Chạy `openclaw doctor --fix` để nhập các kho JSON hiện có vào SQLite và lưu trữ chúng; các thay đổi cron sau này nên đi qua CLI hoặc API Gateway.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) được thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn sẽ tắt ngay lập tức.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lượt chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) cắt tỉa các mục phiên chạy cô lập. `cron.runLog.keepLines` giới hạn số hàng lịch sử chạy SQLite được giữ lại cho mỗi tác vụ; `maxBytes` được giữ lại để tương thích cấu hình với nhật ký chạy cũ dựa trên tệp.
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
    - Với lịch `cron`, xác minh múi giờ (`--tz`) so với múi giờ máy chủ.
    - `reason: not-due` trong đầu ra lượt chạy nghĩa là lượt chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và tác vụ chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không phân phối">
    - Chế độ phân phối `none` nghĩa là không kỳ vọng gửi dự phòng từ runner. Tác nhân vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến chat.
    - Thiếu/không hợp lệ mục tiêu phân phối (`channel`/`to`) nghĩa là outbound đã bị bỏ qua.
    - Với Matrix, các tác vụ được sao chép hoặc cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là phân phối bị chặn bởi thông tin đăng nhập.
    - Nếu lượt chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn phân phối outbound trực tiếp và cũng chặn đường dẫn tóm tắt đưa vào hàng đợi dự phòng, nên không có gì được đăng lại vào chat.
    - Nếu tác nhân phải tự nhắn tin cho người dùng, hãy kiểm tra tác vụ có tuyến khả dụng (`channel: "last"` với chat trước đó, hoặc kênh/mục tiêu tường minh).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn rollover kiểu /new">
    - Độ mới của đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lượt chạy Heartbeat, thông báo exec và sổ sách Gateway có thể cập nhật hàng phiên cho định tuyến/trạng thái, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi những trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ header phiên transcript JSONL khi tệp vẫn còn. Các hàng nhàn rỗi cũ không có `lastInteractionAt` dùng thời điểm bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Các lưu ý về múi giờ">
    - Cron không có `--tz` dùng múi giờ máy chủ Gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - Heartbeat `activeHours` dùng phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa](/vi/automation) — tất cả cơ chế tự động hóa trong nháy mắt
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
