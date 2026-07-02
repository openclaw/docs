---
read_when:
    - Lên lịch tác vụ nền hoặc đánh thức
    - Đấu nối tác nhân kích hoạt bên ngoài (webhook, Gmail) vào OpenClaw
    - Quyết định giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Tác vụ đã lên lịch, webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-07-02T01:00:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu bền vững các tác vụ, đánh thức agent vào đúng thời điểm và có thể gửi đầu ra trở lại kênh chat hoặc endpoint webhook.

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
  <Step title="Kiểm tra tác vụ của bạn">
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
- Định nghĩa tác vụ, trạng thái runtime và lịch sử chạy được lưu bền vững trong cơ sở dữ liệu trạng thái SQLite dùng chung của OpenClaw, nên việc khởi động lại không làm mất lịch.
- Khi nâng cấp, chạy `openclaw doctor --fix` để nhập các tệp cũ `~/.openclaw/cron/jobs.json`, `jobs-state.json` và `runs/*.jsonl` vào SQLite rồi đổi tên chúng với hậu tố `.migrated`. Các hàng tác vụ không đúng định dạng sẽ bị bỏ qua khỏi runtime và được sao chép vào `jobs-quarantine.json` để sửa hoặc xem xét sau.
- `cron.store` vẫn đặt tên khóa kho cron logic và đường dẫn nhập của doctor. Sau khi nhập, việc chỉnh sửa tệp JSON đó không còn thay đổi các tác vụ cron đang hoạt động; hãy dùng `openclaw cron add|edit|remove` hoặc các phương thức cron RPC của Gateway thay vào đó.
- Mọi lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các tác vụ agent-turn biệt lập đã quá hạn được lên lịch lại ra ngoài khoảng thời gian kết nối kênh thay vì phát lại ngay lập tức, để quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi tốt sau khi khởi động lại.
- Tác vụ chạy một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron biệt lập cố gắng đóng các tab/trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại tiến trình mồ côi.
- Các lần chạy cron biệt lập nhận được quyền tự dọn dẹp cron hẹp vẫn có thể đọc trạng thái bộ lập lịch, danh sách tự lọc chỉ gồm tác vụ hiện tại của chúng và lịch sử chạy của tác vụ đó, để các kiểm tra trạng thái/heartbeat có thể xem lịch của chính chúng mà không có quyền thay đổi cron rộng hơn.
- Các lần chạy cron biệt lập cũng bảo vệ khỏi các phản hồi xác nhận lỗi thời. Nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không còn lần chạy subagent hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron biệt lập dùng siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, bao gồm các wrapper node-host `UNAVAILABLE` có thông báo lỗi lồng nhau bắt đầu bằng `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là lần chạy xanh trong khi văn bản assistant thông thường không bị xem là từ chối.
- Các lần chạy cron biệt lập cũng xem lỗi agent ở cấp lần chạy là lỗi tác vụ ngay cả khi không tạo payload phản hồi, để lỗi mô hình/nhà cung cấp làm tăng bộ đếm lỗi và kích hoạt thông báo thất bại thay vì xóa tác vụ như thành công.
- Khi một tác vụ agent-turn biệt lập đạt `timeoutSeconds`, cron hủy lần chạy agent bên dưới và cho nó một khoảng thời gian dọn dẹp ngắn. Nếu lần chạy không thoát hết, quá trình dọn dẹp do Gateway sở hữu sẽ cưỡng bức xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat đang xếp hàng không bị kẹt sau một phiên xử lý lỗi thời.
- Nếu một agent-turn biệt lập bị dừng trước khi runner bắt đầu hoặc trước lệnh gọi mô hình đầu tiên, cron ghi nhận timeout theo pha cụ thể như `setup timed out before runner start` hoặc `stalled before first model call (last phase: context-engine)`. Các watchdog này bao phủ nhà cung cấp nhúng và nhà cung cấp dựa trên CLI trước khi tiến trình CLI bên ngoài của chúng thực sự được khởi động, đồng thời được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động nguội/xác thực/ngữ cảnh xuất hiện nhanh thay vì chờ toàn bộ ngân sách tác vụ.
- Nếu bạn dùng cron hệ thống hoặc bộ lập lịch bên ngoài khác để chạy `openclaw agent`, hãy bọc nó bằng cơ chế leo thang hard-kill dù CLI xử lý `SIGTERM`/`SIGINT`. Các lần chạy dựa trên Gateway yêu cầu Gateway hủy các lần chạy đã được chấp nhận; các lần chạy local và fallback nhúng nhận cùng tín hiệu hủy. Với GNU `timeout`, ưu tiên `timeout -k 60 600 openclaw agent ...` thay vì `timeout 600 ...`; giá trị `-k` là điểm chặn cuối của supervisor nếu tiến trình không thể thoát hết. Với đơn vị systemd, giữ cùng dạng bằng tín hiệu dừng `SIGTERM` cộng với một khoảng ân hạn như `TimeoutStopSec` trước bất kỳ lần kill cuối nào. Nếu một lần thử lại tái sử dụng `--run-id` trong khi lần chạy Gateway gốc vẫn đang hoạt động, bản trùng lặp được báo cáo là đang chạy thay vì bắt đầu lần chạy thứ hai.

<a id="maintenance"></a>

<Note>
Việc đối soát tác vụ cho cron trước hết thuộc quyền runtime, sau đó dựa trên lịch sử bền vững: một tác vụ cron đang hoạt động vẫn còn live trong khi runtime cron vẫn theo dõi tác vụ đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu tác vụ và khoảng ân hạn 5 phút hết hạn, kiểm tra bảo trì sẽ xem nhật ký chạy đã lưu bền vững và trạng thái tác vụ cho lần chạy khớp `cron:<jobId>:<startedAt>`. Nếu lịch sử bền vững đó cho thấy một kết quả kết thúc, sổ cái tác vụ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm toán CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không xem tập tác vụ đang hoạt động trong tiến trình rỗng của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI    | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng thời gian cố định                                |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được xem là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ địa phương trên đồng hồ treo tường.

Các biểu thức lặp lại vào đầu giờ được tự động rải lệch tối đa 5 phút để giảm đỉnh tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải wildcard, croner khớp khi **một trong hai** trường khớp, không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5-6 lần mỗi tháng thay vì 0-1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và bảo vệ trường còn lại trong prompt hoặc lệnh của tác vụ.

## Kiểu thực thi

| Kiểu            | Giá trị `--session` | Chạy trong                | Phù hợp nhất cho              |
| --------------- | ------------------- | ------------------------- | ----------------------------- |
| Phiên chính     | `main`              | Làn đánh thức cron chuyên dụng | Lời nhắc, sự kiện hệ thống    |
| Biệt lập        | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, việc nền định kỳ     |
| Phiên hiện tại  | `current`           | Lần chạy cron tách rời    | Công việc lặp lại nhận biết ngữ cảnh |
| Phiên tùy chỉnh | `session:custom-id` | Lần chạy cron tách rời    | Nhắm tới một chat/phiên đã biết |

<AccordionGroup>
  <Accordion title="Phiên chính so với biệt lập so với tùy chỉnh">
    Các tác vụ **phiên chính** xếp một sự kiện hệ thống vào làn chạy do cron sở hữu và tùy chọn đánh thức heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Chúng có thể dùng ngữ cảnh gửi cuối cùng của phiên chính đích để trả lời, nhưng không thêm các lượt cron thường lệ vào làn chat với con người và không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi cho phiên đích. Các tác vụ **biệt lập** chạy một agent turn chuyên dụng với phiên mới. Các tác vụ phiên **hiện tại** và **tùy chỉnh** (`current`, `session:xxx`) có thể dùng chat/phiên đã chọn cho ngữ cảnh gửi và gieo tùy chọn an toàn, nhưng mỗi lần chạy vẫn thực thi trong một phiên cron tách rời để công việc đã lập lịch không chặn hoặc làm bẩn transcript hội thoại live.

    Các sự kiện cron phiên chính là lời nhắc sự kiện hệ thống tự chứa. Chúng không
    tự động bao gồm chỉ dẫn "Read HEARTBEAT.md" của prompt heartbeat mặc định.
    Nếu một lời nhắc lặp lại cần tham khảo `HEARTBEAT.md`, hãy nói rõ điều đó
    trong văn bản sự kiện cron hoặc trong chỉ dẫn riêng của agent.

  </Accordion>
  <Accordion title="Ý nghĩa của 'phiên mới' đối với tác vụ tách rời">
    Đối với các tác vụ biệt lập, phiên hiện tại và phiên tùy chỉnh, "phiên mới" nghĩa là một transcript/id phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập suy nghĩ/nhanh/chi tiết, nhãn và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng. Các lần chạy tách rời không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc hoặc binding runtime ACP. Hãy đặt trạng thái công việc lặp lại bền vững trong prompt, tệp workspace, công cụ hoặc hệ thống mà tác vụ thao tác, thay vì dựa vào transcript chat live làm bộ nhớ cron.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Với các tác vụ biệt lập, quá trình teardown runtime hiện bao gồm dọn dẹp trình duyệt best-effort cho phiên cron đó. Lỗi dọn dẹp bị bỏ qua để kết quả cron thực tế vẫn thắng.

    Các lần chạy cron biệt lập cũng giải phóng mọi phiên bản runtime MCP đi kèm được tạo cho tác vụ thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách các client MCP của phiên chính và phiên tùy chỉnh được teardown, nên các tác vụ cron biệt lập không rò rỉ tiến trình con stdio hoặc kết nối MCP tồn tại lâu giữa các lần chạy.

  </Accordion>
  <Accordion title="Subagent và gửi qua Discord">
    Khi các lần chạy cron biệt lập điều phối subagent, việc gửi cũng ưu tiên đầu ra cuối cùng của hậu duệ hơn văn bản tạm thời lỗi thời của cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw chặn cập nhật cha một phần đó thay vì thông báo nó.

    Với các đích thông báo Discord chỉ có văn bản, OpenClaw gửi văn bản assistant cuối cùng chuẩn một lần thay vì phát lại cả payload văn bản được stream/trung gian và câu trả lời cuối cùng. Payload media và Discord có cấu trúc vẫn được gửi dưới dạng payload riêng để tệp đính kèm và thành phần không bị bỏ.

  </Accordion>
</AccordionGroup>

### Payload lệnh

Dùng payload lệnh cho các script tất định cần chạy bên trong bộ lập lịch Gateway mà không bắt đầu một agent turn biệt lập dựa trên mô hình. Tác vụ lệnh thực thi trên host Gateway, thu stdout/stderr, ghi nhận lần chạy trong lịch sử cron và tái sử dụng cùng các chế độ gửi `announce`, `webhook` và `none` như tác vụ biệt lập.

<Note>
Command cron là bề mặt tự động hóa Gateway dành cho operator-admin, không phải lệnh gọi
`tools.exec` của agent. Tạo, cập nhật, xóa hoặc chạy thủ công tác vụ cron
yêu cầu `operator.admin`; các lần chạy lệnh đã lập lịch sau đó thực thi bên trong
tiến trình Gateway như tự động hóa do admin đó tạo. Chính sách exec của agent như
`tools.exec.mode`, prompt phê duyệt và allowlist công cụ theo từng agent điều phối
các công cụ exec hiển thị với mô hình, không phải payload command cron.
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

Nếu stdout không rỗng, văn bản đó là kết quả được gửi. Nếu stdout rỗng và stderr không rỗng, stderr được gửi. Nếu cả hai luồng đều có nội dung, cron gửi một khối nhỏ `stdout:` / `stderr:`. Mã thoát bằng không ghi nhận lượt chạy là `ok`; thoát khác không, signal, timeout, hoặc no-output timeout ghi nhận `error` và có thể kích hoạt cảnh báo lỗi. Lệnh chỉ in `NO_REPLY` sử dụng cơ chế chặn silent-token cron thông thường và không đăng gì trở lại chat.

### Tùy chọn payload cho tác vụ cô lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc cho tác vụ cô lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; sử dụng mô hình được phép đã chọn cho tác vụ.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Danh sách mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Truyền `--fallbacks ""` để chạy nghiêm ngặt không có dự phòng.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Trên `cron edit`, xóa ghi đè dự phòng theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên dự phòng đã cấu hình. Không thể kết hợp với `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Trên `cron edit`, xóa ghi đè mô hình theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên chọn mô hình cron thông thường (ghi đè cron-session đã lưu nếu có, nếu không thì mô hình agent/mặc định). Không thể kết hợp với `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức suy nghĩ.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Trên `cron edit`, xóa ghi đè suy nghĩ theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên suy nghĩ cron thông thường. Không thể kết hợp với `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua việc tiêm tệp bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Hạn chế các công cụ mà tác vụ có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` sử dụng mô hình được phép đã chọn làm mô hình chính của tác vụ đó. Nó không giống với ghi đè `/model` trong phiên chat: các chuỗi dự phòng đã cấu hình vẫn áp dụng khi mô hình chính của tác vụ thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm quay về lựa chọn mô hình agent/mặc định của tác vụ.

Tác vụ Cron cũng có thể mang `fallbacks` ở cấp payload. Khi có mặt, danh sách đó thay thế chuỗi dự phòng đã cấu hình cho tác vụ. Dùng `fallbacks: []` trong payload/API của tác vụ khi bạn muốn một lượt chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu tác vụ có `--model` nhưng không có dự phòng trong payload cũng như dự phòng đã cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của agent không bị thêm vào như một mục tiêu thử lại bổ sung ẩn.

Các kiểm tra preflight của nhà cung cấp cục bộ duyệt qua các dự phòng đã cấu hình trước khi đánh dấu một lượt chạy cron là `skipped`; `fallbacks: []` giữ đường dẫn preflight đó ở chế độ nghiêm ngặt.

Thứ tự ưu tiên chọn mô hình cho tác vụ cô lập là:

1. Ghi đè mô hình hook Gmail (khi lượt chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong payload theo từng tác vụ
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình agent/mặc định

Chế độ nhanh cũng tuân theo lựa chọn live đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập dùng giá trị đó theo mặc định. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng. Chế độ tự động dùng ngưỡng `params.fastAutoOnSeconds` của mô hình đã chọn khi có, mặc định là 60 giây.

Nếu một lượt chạy cô lập gặp handoff chuyển đổi mô hình live, cron thử lại với nhà cung cấp/mô hình đã chuyển và lưu lựa chọn live đó cho lượt chạy đang hoạt động trước khi thử lại. Khi việc chuyển đổi cũng mang theo hồ sơ xác thực mới, cron cũng lưu ghi đè hồ sơ xác thực đó cho lượt chạy đang hoạt động. Số lần thử lại bị giới hạn: sau lần thử ban đầu cộng với 2 lần thử lại do chuyển đổi, cron hủy thay vì lặp mãi mãi.

Trước khi một lượt chạy cron cô lập đi vào agent runner, OpenClaw kiểm tra các endpoint nhà cung cấp cục bộ có thể truy cập cho những nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là loopback, mạng riêng, hoặc `.local`. Nếu endpoint đó ngừng hoạt động, lượt chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả endpoint được lưu cache trong 5 phút, nên nhiều tác vụ đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang, hoặc LM Studio cục bộ đã chết sẽ chia sẻ một probe nhỏ thay vì tạo bão yêu cầu. Các lượt chạy bị bỏ qua do provider-preflight không làm tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn thông báo lặp lại về các lượt bỏ qua.

## Gửi và đầu ra

| Chế độ     | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Gửi dự phòng văn bản cuối cùng tới đích nếu agent chưa gửi |
| `webhook`  | POST payload sự kiện hoàn tất tới một URL                                |
| `none`     | Không có gửi dự phòng từ runner                                         |

Dùng `--announce --channel telegram --to "-1001234567890"` để gửi tới kênh. Với chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; OpenClaw cũng chấp nhận dạng rút gọn do Telegram sở hữu `-1001234567890:123`. Trình gọi RPC/cấu hình trực tiếp có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Đích Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng đúng ID phòng chính xác hoặc dạng `room:!room:server` từ Matrix.

Khi gửi thông báo dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron quay về lịch sử phiên hoặc một kênh được cấu hình duy nhất. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được chỉ định rõ ràng, tiền tố đích phải nêu cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` bị từ chối thay vì để WhatsApp diễn giải ID Telegram như một số điện thoại. Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Với tác vụ cô lập, việc gửi chat được chia sẻ. Nếu có tuyến chat, agent có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu agent gửi tới đích đã cấu hình/hiện tại, OpenClaw bỏ qua thông báo dự phòng. Nếu không, `announce`, `webhook`, và `none` chỉ kiểm soát runner sẽ làm gì với phản hồi cuối cùng sau lượt agent.

Khi agent tạo một lời nhắc cô lập từ chat đang hoạt động, OpenClaw lưu đích gửi live được bảo toàn cho tuyến thông báo dự phòng. Các khóa phiên nội bộ có thể là chữ thường; đích gửi của nhà cung cấp không được tái dựng từ các khóa đó khi có ngữ cảnh chat hiện tại.

Gửi thông báo ngầm định dùng allowlist kênh đã cấu hình để xác thực và định tuyến lại các đích cũ. Phê duyệt trong kho ghép cặp DM không phải người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi tới DM.

## Ngôn ngữ đầu ra

Tác vụ Cron không suy luận ngôn ngữ trả lời từ kênh, locale, hoặc tin nhắn trước đó. Hãy đặt quy tắc ngôn ngữ trong tin nhắn hoặc mẫu đã lên lịch:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Đối với tệp mẫu, hãy giữ chỉ dẫn ngôn ngữ trong prompt đã kết xuất và
xác minh các placeholder như `{{language}}` đã được điền trước khi công việc chạy. Nếu
đầu ra trộn lẫn nhiều ngôn ngữ, hãy nêu rõ quy tắc, ví dụ: "Sử dụng tiếng Trung
cho văn bản tường thuật và giữ các thuật ngữ kỹ thuật bằng tiếng Anh."

Thông báo lỗi đi theo một đường dẫn đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè giá trị đó cho từng công việc.
- Nếu cả hai đều không được đặt và công việc đã gửi qua `announce`, thông báo lỗi hiện sẽ quay về mục tiêu announce chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các công việc `sessionTarget="isolated"` trừ khi chế độ gửi chính là `webhook`.
- `failureAlert.includeSkipped: true` đưa một công việc hoặc chính sách cảnh báo cron toàn cục vào các cảnh báo lượt chạy bị bỏ qua lặp lại. Các lượt chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến cơ chế lùi thời gian khi lỗi thực thi.

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
  <Tab title="Công việc cô lập định kỳ">
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

Gateway có thể cung cấp các endpoint HTTP webhook cho trigger bên ngoài. Bật trong cấu hình:

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

Token trong query string bị từ chối.

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
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Các ánh xạ có thể chuyển đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc chuyển đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các endpoint hook phía sau loopback, tailnet, hoặc reverse proxy tin cậy.

- Sử dụng một token hook chuyên dụng; không dùng lại token xác thực gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn tác tử hiệu lực mà hook có thể nhắm tới, bao gồm cả tác tử mặc định khi bỏ qua `agentId`.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do bên gọi chọn.
- Nếu bật `hooks.allowRequestSessionKey`, hãy đặt thêm `hooks.allowedSessionKeyPrefixes` để ràng buộc các dạng khóa phiên được phép.
- Payload hook mặc định được bọc bằng các ranh giới an toàn.

</Warning>

## Tích hợp Gmail PubSub

Kết nối trình kích hoạt hộp thư đến Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw đã bật, Tailscale cho điểm cuối HTTPS công khai.
</Note>

### Thiết lập bằng trình hướng dẫn (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail và dùng Tailscale Funnel cho điểm cuối push.

### Tự khởi động Gateway

Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động `gog gmail watch serve` khi bật máy và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để tắt.

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

`openclaw cron run <jobId>` trả về sau khi đưa lượt chạy thủ công vào hàng đợi. Dùng `--wait` cho hook tắt máy, script bảo trì hoặc tự động hóa khác phải chặn cho đến khi lượt chạy trong hàng đợi hoàn tất. Chế độ chờ thăm dò đúng `runId` được trả về; chế độ này thoát `0` với trạng thái `ok` và khác 0 với `error`, `skipped` hoặc hết thời gian chờ.

Công cụ tác tử `cron` trả về các tóm tắt tác vụ gọn (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) từ `cron(action: "list")`; dùng `cron(action: "get", jobId: "...")` cho một định nghĩa tác vụ đầy đủ. Bên gọi Gateway trực tiếp có thể truyền `compact: true` vào `cron.list`; bỏ qua tham số này sẽ giữ phản hồi đầy đủ hiện có kèm bản xem trước phân phối.

`openclaw cron create` là bí danh của `openclaw cron add`, và tác vụ mới có thể dùng lịch ở dạng đối số vị trí (`"0 9 * * 1"`, `"every 1h"`, `"20m"` hoặc dấu thời gian ISO), theo sau là lời nhắc tác tử ở dạng đối số vị trí. Dùng `--webhook <url>` trên `cron add|create` hoặc `cron edit` để POST payload lượt chạy đã hoàn tất tới một điểm cuối HTTP. Phân phối Webhook không thể kết hợp với các cờ phân phối chat như `--announce`, `--channel`, `--to`, `--thread-id` hoặc `--account`. Trên `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` và `--clear-account` bỏ đặt từng trường định tuyến đó riêng lẻ (mỗi cờ bị từ chối khi đi cùng cờ đặt tương ứng), khác với `--no-deliver` vốn tắt phân phối dự phòng của runner.

<Note>
Ghi chú về ghi đè mô hình:

- `openclaw cron add|edit --model ...` thay đổi mô hình được chọn của tác vụ.
- Nếu mô hình được phép, đúng provider/mô hình đó sẽ tới lượt chạy tác tử cô lập.
- Nếu mô hình không được phép hoặc không thể phân giải, Cron làm lỗi lượt chạy bằng lỗi xác thực rõ ràng.
- Các bản vá payload API `cron.update` có thể đặt `model: null` để xóa ghi đè mô hình đã lưu của tác vụ.
- `openclaw cron edit <job-id> --clear-model` xóa ghi đè đó khỏi CLI (cùng hiệu lực với bản vá `model: null`) và không thể kết hợp với `--model`.
- Chuỗi dự phòng đã cấu hình vẫn áp dụng vì `--model` của Cron là mô hình chính của tác vụ, không phải ghi đè `/model` của phiên.
- `openclaw cron add|edit --fallbacks ...` đặt payload `fallbacks`, thay thế các dự phòng đã cấu hình cho tác vụ đó; `--fallbacks ""` tắt dự phòng và khiến lượt chạy ở chế độ nghiêm ngặt. `openclaw cron edit <job-id> --clear-fallbacks` xóa ghi đè theo tác vụ.
- Một `--model` đơn thuần không có danh sách dự phòng rõ ràng hoặc đã cấu hình sẽ không tự động rơi về mô hình chính của tác tử như một mục tiêu thử lại bổ sung thầm lặng.

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

`maxConcurrentRuns` giới hạn cả việc điều phối Cron theo lịch và thực thi lượt tác tử cô lập, và mặc định là 8. Các lượt tác tử Cron cô lập dùng nội bộ làn thực thi chuyên dụng `cron-nested` của hàng đợi, vì vậy tăng giá trị này cho phép các lượt chạy LLM Cron độc lập tiến hành song song thay vì chỉ bắt đầu các wrapper Cron bên ngoài. Làn `nested` không phải Cron dùng chung không được mở rộng bởi thiết lập này.

`cron.store` là khóa kho lưu trữ logic và đường dẫn nhập doctor kế thừa. Chạy `openclaw doctor --fix` để nhập các kho JSON hiện có vào SQLite và lưu trữ chúng; các thay đổi Cron trong tương lai nên đi qua CLI hoặc API Gateway.

Tắt Cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) được thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn sẽ tắt ngay lập tức.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lượt chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) cắt tỉa các mục phiên chạy cô lập. `cron.runLog.keepLines` giới hạn các hàng lịch sử chạy SQLite được giữ lại trên mỗi tác vụ; `maxBytes` được giữ lại để tương thích cấu hình với nhật ký chạy cũ dựa trên tệp.
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
    - Với lịch `cron`, xác minh múi giờ (`--tz`) so với múi giờ của máy chủ.
    - `reason: not-due` trong đầu ra lượt chạy nghĩa là lượt chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và tác vụ chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không phân phối">
    - Chế độ phân phối `none` nghĩa là không kỳ vọng gửi dự phòng từ runner. Tác tử vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến chat.
    - Thiếu hoặc không hợp lệ mục tiêu phân phối (`channel`/`to`) nghĩa là gửi ra ngoài đã bị bỏ qua.
    - Với Matrix, các tác vụ được sao chép hoặc kế thừa có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là phân phối bị chặn bởi thông tin xác thực.
    - Nếu lượt chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw chặn phân phối ra ngoài trực tiếp và cũng chặn đường dẫn tóm tắt dự phòng trong hàng đợi, nên không có gì được đăng lại vào chat.
    - Nếu tác tử phải tự nhắn tin cho người dùng, hãy kiểm tra tác vụ có tuyến dùng được (`channel: "last"` với một chat trước đó, hoặc kênh/mục tiêu rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn rollover kiểu /new">
    - Độ mới của đặt lại hằng ngày và khi rảnh không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lượt chạy Heartbeat, thông báo exec và ghi sổ Gateway có thể cập nhật hàng phiên để định tuyến/trạng thái, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng kế thừa được tạo trước khi các trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ header phiên JSONL của bản ghi hội thoại khi tệp vẫn còn. Các hàng rảnh kế thừa không có `lastInteractionAt` dùng thời điểm bắt đầu đã khôi phục đó làm mốc rảnh.

  </Accordion>
  <Accordion title="Lưu ý về múi giờ">
    - Cron không có `--tz` dùng múi giờ của máy chủ gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - `activeHours` của Heartbeat dùng phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa](/vi/automation) — tất cả cơ chế tự động hóa trong một cái nhìn tổng quan
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lượt thực thi Cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
