---
read_when:
    - Lên lịch tác vụ nền hoặc đánh thức
    - Kết nối trình kích hoạt bên ngoài (webhook, Gmail) vào OpenClaw
    - Quyết định giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Công việc đã lên lịch, webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-06-27T17:08:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu bền các tác vụ, đánh thức agent vào đúng thời điểm và có thể gửi đầu ra trở lại một kênh trò chuyện hoặc endpoint webhook.

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
- Định nghĩa tác vụ, trạng thái runtime và lịch sử chạy được lưu bền trong cơ sở dữ liệu trạng thái SQLite dùng chung của OpenClaw để việc khởi động lại không làm mất lịch.
- Khi nâng cấp, chạy `openclaw doctor --fix` để nhập các tệp `~/.openclaw/cron/jobs.json`, `jobs-state.json` và `runs/*.jsonl` cũ vào SQLite rồi đổi tên chúng với hậu tố `.migrated`. Các hàng tác vụ không đúng định dạng sẽ bị bỏ qua khỏi runtime và được sao chép vào `jobs-quarantine.json` để sửa chữa hoặc xem xét sau.
- `cron.store` vẫn đặt tên khóa kho cron logic và đường dẫn nhập của doctor. Sau khi nhập, việc chỉnh sửa tệp JSON đó không còn thay đổi các tác vụ cron đang hoạt động; thay vào đó hãy dùng `openclaw cron add|edit|remove` hoặc các phương thức RPC cron của Gateway.
- Mọi lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các tác vụ agent-turn cô lập quá hạn được lên lịch lại ra ngoài khoảng thời gian kết nối kênh thay vì phát lại ngay lập tức, để quá trình khởi động Discord/Telegram và thiết lập lệnh native vẫn phản hồi tốt sau khi khởi động lại.
- Tác vụ chạy một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron cô lập sẽ cố gắng đóng các tab/trình duyệt hoặc tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại tiến trình mồ côi.
- Các lần chạy cron cô lập nhận được quyền tự dọn dẹp cron phạm vi hẹp vẫn có thể đọc trạng thái bộ lập lịch, danh sách tự lọc chỉ gồm tác vụ hiện tại của chúng và lịch sử chạy của tác vụ đó, để các kiểm tra trạng thái/heartbeat có thể kiểm tra lịch của chính chúng mà không nhận được quyền thay đổi cron rộng hơn.
- Các lần chạy cron cô lập cũng bảo vệ khỏi các phản hồi xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không còn lần chạy subagent hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron cô lập dùng metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, bao gồm các wrapper `UNAVAILABLE` của node-host có thông báo lỗi lồng nhau bắt đầu bằng `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo như một lần chạy xanh trong khi văn xuôi thông thường của assistant không bị coi là một từ chối.
- Các lần chạy cron cô lập cũng coi lỗi agent ở cấp lần chạy là lỗi tác vụ ngay cả khi không tạo ra payload phản hồi, để lỗi mô hình/nhà cung cấp tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì xóa tác vụ như thành công.
- Khi một tác vụ agent-turn cô lập đạt tới `timeoutSeconds`, cron hủy lần chạy agent bên dưới và cho nó một khoảng thời gian dọn dẹp ngắn. Nếu lần chạy không thoát hết, dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat đang xếp hàng không bị bỏ lại sau một phiên xử lý đã cũ.
- Nếu một agent-turn cô lập bị treo trước khi runner bắt đầu hoặc trước lệnh gọi mô hình đầu tiên, cron ghi nhận timeout theo pha cụ thể như `setup timed out before runner start` hoặc `stalled before first model call (last phase: context-engine)`. Các watchdog này bao phủ nhà cung cấp nhúng và nhà cung cấp dựa trên CLI trước khi tiến trình CLI bên ngoài của chúng thực sự được khởi động, đồng thời được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động lạnh/xác thực/ngữ cảnh bộc lộ nhanh thay vì chờ hết toàn bộ ngân sách tác vụ.
- Nếu bạn dùng system cron hoặc một bộ lập lịch bên ngoài khác để chạy `openclaw agent`, hãy bọc nó bằng cơ chế leo thang hard-kill dù CLI xử lý `SIGTERM`/`SIGINT`. Các lần chạy dựa trên Gateway yêu cầu Gateway hủy các lần chạy đã được chấp nhận; các lần chạy local và fallback nhúng nhận cùng tín hiệu hủy. Với GNU `timeout`, ưu tiên `timeout -k 60 600 openclaw agent ...` thay vì `timeout 600 ...` thuần; giá trị `-k` là chốt chặn của supervisor nếu tiến trình không thể thoát hết. Với systemd units, giữ cùng cấu trúc bằng cách dùng tín hiệu dừng `SIGTERM` cộng với một khoảng gia hạn như `TimeoutStopSec` trước mọi lần kill cuối cùng. Nếu một lần thử lại tái sử dụng `--run-id` trong khi lần chạy Gateway ban đầu vẫn đang hoạt động, bản trùng lặp sẽ được báo cáo là đang chạy thay vì bắt đầu lần chạy thứ hai.

<a id="maintenance"></a>

<Note>
Việc đối soát tác vụ cho cron trước hết do runtime sở hữu, sau đó được hậu thuẫn bởi lịch sử bền vững: một tác vụ cron đang hoạt động vẫn sống khi runtime cron vẫn theo dõi tác vụ đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu tác vụ và khoảng gia hạn 5 phút hết hạn, bảo trì kiểm tra nhật ký chạy đã lưu bền và trạng thái tác vụ cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền vững đó cho thấy kết quả kết thúc, sổ cái tác vụ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm toán CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không coi tập tác vụ đang hoạt động trong tiến trình rỗng của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI    | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng lặp cố định                                      |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được xử lý là UTC. Thêm `--tz America/New_York` để lập lịch theo đồng hồ tường địa phương.

Các biểu thức lặp ở đầu giờ tự động được giãn ngẫu nhiên tối đa 5 phút để giảm đỉnh tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả hai trường ngày trong tháng và ngày trong tuần đều không phải wildcard, croner khớp khi **một trong hai** trường khớp, không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Lịch này kích hoạt khoảng 5-6 lần mỗi tháng thay vì 0-1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của tác vụ.

## Kiểu thực thi

| Kiểu            | Giá trị `--session` | Chạy trong               | Phù hợp nhất cho                |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Phiên chính     | `main`              | Làn đánh thức cron riêng | Lời nhắc, sự kiện hệ thống      |
| Cô lập          | `isolated`          | `cron:<jobId>` riêng     | Báo cáo, việc nền               |
| Phiên hiện tại  | `current`           | Ràng buộc khi tạo        | Công việc lặp có nhận biết ngữ cảnh |
| Phiên tùy chỉnh | `session:custom-id` | Phiên đặt tên bền vững   | Quy trình xây dựng dựa trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính so với cô lập so với tùy chỉnh">
    Các tác vụ **phiên chính** đưa một sự kiện hệ thống vào làn chạy do cron sở hữu và tùy chọn đánh thức heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Chúng có thể dùng ngữ cảnh gửi cuối cùng của phiên chính mục tiêu để trả lời, nhưng không thêm các lượt cron thường lệ vào làn chat của con người và không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi cho phiên mục tiêu. Các tác vụ **cô lập** chạy một lượt agent riêng với một phiên mới. **Phiên tùy chỉnh** (`session:xxx`) lưu bền ngữ cảnh qua các lần chạy, cho phép các quy trình như standup hằng ngày xây dựng dựa trên các bản tóm tắt trước đó.

    Các sự kiện cron phiên chính là các lời nhắc sự kiện hệ thống tự chứa. Chúng
    không tự động bao gồm chỉ dẫn "Read
    HEARTBEAT.md" của prompt heartbeat mặc định. Nếu một lời nhắc lặp nên tham khảo
    `HEARTBEAT.md`, hãy nói rõ điều đó trong văn bản sự kiện cron hoặc trong
    hướng dẫn riêng của agent.

  </Accordion>
  <Accordion title="Ý nghĩa của 'phiên mới' đối với tác vụ cô lập">
    Đối với tác vụ cô lập, "phiên mới" nghĩa là một transcript/id phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập thinking/fast/verbose, nhãn và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng, nhưng không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc hoặc liên kết runtime ACP. Dùng `current` hoặc `session:<id>` khi một tác vụ lặp nên chủ ý xây dựng trên cùng một ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Đối với tác vụ cô lập, tháo dỡ runtime hiện bao gồm dọn dẹp trình duyệt theo best-effort cho phiên cron đó. Lỗi dọn dẹp được bỏ qua để kết quả cron thực tế vẫn thắng.

    Các lần chạy cron cô lập cũng hủy mọi phiên bản runtime MCP đi kèm được tạo cho tác vụ thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách các client MCP của phiên chính và phiên tùy chỉnh được tháo dỡ, nên tác vụ cron cô lập không rò rỉ tiến trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Subagent và gửi qua Discord">
    Khi các lần chạy cron cô lập điều phối subagent, việc gửi cũng ưu tiên đầu ra cuối cùng của hậu duệ thay vì văn bản tạm thời cũ của cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw chặn cập nhật cha một phần đó thay vì thông báo nó.

    Đối với mục tiêu thông báo Discord chỉ văn bản, OpenClaw gửi văn bản assistant cuối cùng chuẩn tắc một lần thay vì phát lại cả payload văn bản streamed/trung gian và câu trả lời cuối cùng. Media và payload Discord có cấu trúc vẫn được gửi dưới dạng payload riêng để attachment và component không bị bỏ sót.

  </Accordion>
</AccordionGroup>

### Payload lệnh

Dùng payload lệnh cho các script xác định nên chạy bên trong bộ lập lịch Gateway mà không khởi động một lượt agent cô lập dựa trên mô hình. Tác vụ lệnh thực thi trên host Gateway, ghi stdout/stderr, ghi nhận lần chạy trong lịch sử cron và dùng lại cùng các chế độ gửi `announce`, `webhook` và `none` như tác vụ cô lập.

<Note>
Cron lệnh là một bề mặt tự động hóa Gateway dành cho operator-admin, không phải một lệnh gọi
`tools.exec` của agent. Việc tạo, cập nhật, xóa hoặc chạy thủ công tác vụ cron
yêu cầu `operator.admin`; các lần chạy lệnh đã lập lịch về sau thực thi bên trong tiến trình
Gateway dưới dạng tự động hóa do admin đó tạo. Chính sách exec của agent như
`tools.exec.mode`, prompt phê duyệt và danh sách cho phép công cụ theo từng agent chi phối
các công cụ exec hiển thị với mô hình, không chi phối payload cron lệnh.
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

Nếu stdout không rỗng, văn bản đó là kết quả được gửi. Nếu stdout rỗng và stderr không rỗng, stderr sẽ được gửi. Nếu cả hai luồng đều có nội dung, cron gửi một khối nhỏ `stdout:` / `stderr:`. Mã thoát bằng không ghi nhận lượt chạy là `ok`; thoát khác không, signal, timeout, hoặc timeout do không có đầu ra ghi nhận `error` và có thể kích hoạt cảnh báo lỗi. Lệnh chỉ in `NO_REPLY` dùng cơ chế chặn token im lặng thông thường của cron và không đăng gì trở lại chat.

### Tùy chọn payload cho tác vụ tách biệt

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc cho chế độ tách biệt).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè model; dùng model được phép đã chọn cho tác vụ.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Danh sách model dự phòng theo từng tác vụ, ví dụ `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Truyền `--fallbacks ""` để chạy nghiêm ngặt không có dự phòng.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Trên `cron edit`, xóa ghi đè dự phòng theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên dự phòng đã cấu hình. Không thể kết hợp với `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Trên `cron edit`, xóa ghi đè model theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên chọn model cron thông thường (ghi đè cron-session đã lưu nếu có, nếu không thì model agent/mặc định). Không thể kết hợp với `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức suy nghĩ.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua việc chèn tệp khởi tạo workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn các công cụ mà tác vụ có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng model được phép đã chọn làm model chính của tác vụ đó. Nó không giống ghi đè `/model` của chat-session: các chuỗi dự phòng đã cấu hình vẫn áp dụng khi model chính của tác vụ thất bại. Nếu model được yêu cầu không được phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm quay về lựa chọn model agent/mặc định của tác vụ.

Tác vụ Cron cũng có thể mang `fallbacks` ở cấp payload. Khi có, danh sách đó thay thế chuỗi dự phòng đã cấu hình cho tác vụ. Dùng `fallbacks: []` trong payload/API của tác vụ khi bạn muốn một lượt chạy cron nghiêm ngặt chỉ thử model đã chọn. Nếu một tác vụ có `--model` nhưng không có dự phòng trong payload lẫn cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để model chính của agent không bị thêm làm mục tiêu thử lại ẩn.

Các kiểm tra preflight của local-provider duyệt qua các dự phòng đã cấu hình trước khi đánh dấu một lượt chạy cron là `skipped`; `fallbacks: []` giữ đường dẫn preflight đó nghiêm ngặt.

Thứ tự ưu tiên chọn model cho tác vụ tách biệt là:

1. Ghi đè model của hook Gmail (khi lượt chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong payload theo từng tác vụ
3. Ghi đè model phiên cron đã lưu do người dùng chọn
4. Lựa chọn model agent/mặc định

Chế độ nhanh cũng tuân theo lựa chọn live đã phân giải. Nếu cấu hình model đã chọn có `params.fastMode`, cron tách biệt dùng chế độ đó theo mặc định. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng. Chế độ tự động dùng ngưỡng `params.fastAutoOnSeconds` của model đã chọn khi có, mặc định là 60 giây.

Nếu một lượt chạy tách biệt gặp bàn giao chuyển model live, cron thử lại với provider/model đã chuyển và lưu lựa chọn live đó cho lượt chạy đang hoạt động trước khi thử lại. Khi lần chuyển cũng mang theo auth profile mới, cron cũng lưu ghi đè auth profile đó cho lượt chạy đang hoạt động. Số lần thử lại bị giới hạn: sau lần thử ban đầu cộng thêm 2 lần thử lại do chuyển đổi, cron hủy thay vì lặp mãi.

Trước khi một lượt chạy cron tách biệt đi vào agent runner, OpenClaw kiểm tra các endpoint provider cục bộ có thể truy cập cho những provider `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là loopback, mạng riêng, hoặc `.local`. Nếu endpoint đó ngừng hoạt động, lượt chạy được ghi nhận là `skipped` với lỗi provider/model rõ ràng thay vì bắt đầu một lời gọi model. Kết quả endpoint được lưu cache trong 5 phút, nên nhiều tác vụ đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang, hoặc LM Studio cục bộ đã chết sẽ dùng chung một probe nhỏ thay vì tạo bão yêu cầu. Các lượt chạy bị bỏ qua do provider-preflight không tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn nhận thông báo bỏ qua lặp lại.

## Phân phối và đầu ra

| Chế độ     | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Gửi văn bản cuối cùng dự phòng đến mục tiêu nếu agent chưa gửi     |
| `webhook`  | POST payload sự kiện hoàn tất đến một URL                          |
| `none`     | Không có phân phối dự phòng từ runner                              |

Dùng `--announce --channel telegram --to "-1001234567890"` để phân phối đến kênh. Với chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; OpenClaw cũng chấp nhận dạng viết tắt do Telegram sở hữu `-1001234567890:123`. Trình gọi RPC/config trực tiếp có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Mục tiêu Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng ID phòng chính xác hoặc dạng `room:!room:server` từ Matrix.

Khi phân phối announce dùng `channel: "last"` hoặc bỏ qua `channel`, mục tiêu có tiền tố provider như `telegram:123` có thể chọn kênh trước khi cron quay về lịch sử phiên hoặc một kênh đã cấu hình duy nhất. Chỉ các tiền tố được plugin đã tải quảng bá mới là bộ chọn provider. Nếu `delivery.channel` được đặt rõ ràng, tiền tố mục tiêu phải đặt tên cùng provider; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` bị từ chối thay vì để WhatsApp diễn giải ID Telegram là số điện thoại. Tiền tố loại mục tiêu và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn là cú pháp mục tiêu do kênh sở hữu, không phải bộ chọn provider.

Với tác vụ tách biệt, phân phối chat được chia sẻ. Nếu có sẵn tuyến chat, agent có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu agent gửi đến mục tiêu đã cấu hình/hiện tại, OpenClaw bỏ qua announce dự phòng. Nếu không, `announce`, `webhook`, và `none` chỉ kiểm soát việc runner xử lý phản hồi cuối cùng sau lượt agent.

Khi một agent tạo lời nhắc tách biệt từ chat đang hoạt động, OpenClaw lưu mục tiêu phân phối live được giữ lại cho tuyến announce dự phòng. Khóa phiên nội bộ có thể viết thường; mục tiêu phân phối provider không được dựng lại từ các khóa đó khi có ngữ cảnh chat hiện tại.

Phân phối announce ngầm định dùng allowlist kênh đã cấu hình để xác thực và định tuyến lại các mục tiêu cũ. Phê duyệt trong kho ghép cặp DM không phải người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi đến DM.

## Ngôn ngữ đầu ra

Tác vụ Cron không suy luận ngôn ngữ trả lời từ kênh, locale, hoặc tin nhắn trước đó. Đặt quy tắc ngôn ngữ trong tin nhắn hoặc mẫu đã lên lịch:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Với tệp mẫu, giữ hướng dẫn ngôn ngữ trong prompt được render và xác minh các placeholder như `{{language}}` đã được điền trước khi tác vụ chạy. Nếu đầu ra trộn nhiều ngôn ngữ, hãy nêu quy tắc rõ ràng, ví dụ: "Use Chinese for narrative text and keep technical terms in English."

Thông báo lỗi đi theo một đường dẫn đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè theo từng tác vụ.
- Nếu không đặt cả hai và tác vụ đã phân phối qua `announce`, thông báo lỗi nay quay về mục tiêu announce chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên tác vụ `sessionTarget="isolated"` trừ khi chế độ phân phối chính là `webhook`.
- `failureAlert.includeSkipped: true` cho phép một tác vụ hoặc chính sách cảnh báo cron toàn cục nhận cảnh báo lượt chạy bị bỏ qua lặp lại. Lượt chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến backoff lỗi thực thi.

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
  <Tab title="Tác vụ tách biệt lặp lại">
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
  <Tab title="Ghi đè model và suy nghĩ">
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

Gateway có thể công khai endpoint Webhook HTTP cho trigger bên ngoài. Bật trong config:

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
    Chạy một lượt agent tách biệt:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Trường: `message` (bắt buộc), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook đã ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong config. Mapping có thể chuyển đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ endpoint hook sau loopback, tailnet, hoặc reverse proxy đáng tin cậy.

- Dùng token hook chuyên dụng; không dùng lại token xác thực gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn agent hiệu lực mà hook có thể nhắm đến, bao gồm agent mặc định khi bỏ qua `agentId`.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do trình gọi chọn.
- Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để ràng buộc dạng khóa phiên được phép.
- Payload hook được bọc bằng ranh giới an toàn theo mặc định.

</Warning>

## Tích hợp Gmail PubSub

Kết nối trình kích hoạt hộp thư Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw đã bật, Tailscale cho điểm cuối HTTPS công khai.
</Note>

### Thiết lập bằng trình hướng dẫn (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail và dùng Tailscale Funnel cho điểm cuối push.

### Tự động khởi động Gateway

Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động `gog gmail watch serve` khi boot và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không dùng tính năng này.

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

`openclaw cron run <jobId>` trả về sau khi đưa lượt chạy thủ công vào hàng đợi. Dùng `--wait` cho hook tắt máy, script bảo trì hoặc tự động hóa khác phải chặn cho đến khi lượt chạy trong hàng đợi hoàn tất. Chế độ chờ thăm dò đúng `runId` được trả về; nó thoát `0` với trạng thái `ok` và khác 0 với `error`, `skipped` hoặc hết thời gian chờ.

Công cụ `cron` của tác tử trả về các tóm tắt tác vụ gọn (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) từ `cron(action: "list")`; dùng `cron(action: "get", jobId: "...")` cho một định nghĩa tác vụ đầy đủ. Các caller Gateway trực tiếp có thể truyền `compact: true` cho `cron.list`; nếu bỏ qua, phản hồi đầy đủ hiện có cùng bản xem trước gửi sẽ được giữ nguyên.

`openclaw cron create` là bí danh của `openclaw cron add`, và tác vụ mới có thể dùng lịch dạng đối số vị trí (`"0 9 * * 1"`, `"every 1h"`, `"20m"` hoặc dấu thời gian ISO) theo sau là prompt tác tử dạng đối số vị trí. Dùng `--webhook <url>` trên `cron add|create` hoặc `cron edit` để POST payload lượt chạy đã hoàn tất đến một điểm cuối HTTP. Gửi Webhook không thể kết hợp với các cờ gửi qua chat như `--announce`, `--channel`, `--to`, `--thread-id` hoặc `--account`. Trên `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` và `--clear-account` bỏ đặt riêng từng trường định tuyến đó (mỗi cờ bị từ chối khi đi cùng cờ đặt tương ứng), khác với việc `--no-deliver` tắt gửi dự phòng của runner.

<Note>
Lưu ý về ghi đè mô hình:

- `openclaw cron add|edit --model ...` thay đổi mô hình đã chọn của tác vụ.
- Nếu mô hình được cho phép, đúng provider/model đó sẽ đến lượt chạy tác tử cô lập.
- Nếu không được cho phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng.
- Các bản vá payload API `cron.update` có thể đặt `model: null` để xóa ghi đè mô hình đã lưu của tác vụ.
- `openclaw cron edit <job-id> --clear-model` xóa ghi đè đó từ CLI (cùng hiệu lực với bản vá `model: null`) và không thể kết hợp với `--model`.
- Các chuỗi dự phòng đã cấu hình vẫn áp dụng vì cron `--model` là mô hình chính của tác vụ, không phải ghi đè `/model` của phiên.
- `openclaw cron add|edit --fallbacks ...` đặt payload `fallbacks`, thay thế các dự phòng đã cấu hình cho tác vụ đó; `--fallbacks ""` tắt dự phòng và làm lượt chạy nghiêm ngặt. `openclaw cron edit <job-id> --clear-fallbacks` xóa ghi đè theo từng tác vụ.
- Một `--model` đơn thuần không có danh sách dự phòng rõ ràng hoặc đã cấu hình sẽ không tự động rơi về mô hình chính của tác tử như một mục tiêu thử lại bổ sung âm thầm.

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

`maxConcurrentRuns` giới hạn cả việc dispatch cron theo lịch và thực thi lượt tác tử cô lập, mặc định là 8. Các lượt tác tử cron cô lập dùng làn thực thi `cron-nested` chuyên dụng của hàng đợi ở bên trong, nên tăng giá trị này cho phép các lượt chạy LLM cron độc lập tiến triển song song thay vì chỉ khởi động các wrapper cron bên ngoài của chúng. Làn `nested` không phải cron dùng chung không được mở rộng bởi thiết lập này.

`cron.store` là khóa kho logic và đường dẫn import doctor cũ. Chạy `openclaw doctor --fix` để import các kho JSON hiện có vào SQLite và lưu trữ chúng; các thay đổi cron trong tương lai nên đi qua CLI hoặc Gateway API.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) được thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn sẽ tắt ngay lập tức.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lượt chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) dọn các mục phiên lượt chạy cô lập. `cron.runLog.keepLines` giới hạn số hàng lịch sử lượt chạy SQLite được giữ lại theo từng tác vụ; `maxBytes` được giữ lại để tương thích cấu hình với các nhật ký lượt chạy cũ dựa trên tệp.
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
    - `reason: not-due` trong đầu ra lượt chạy nghĩa là lượt chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và tác vụ chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không gửi">
    - Chế độ gửi `none` nghĩa là không kỳ vọng có gửi dự phòng từ runner. Tác tử vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến chat.
    - Thiếu hoặc không hợp lệ mục tiêu gửi (`channel`/`to`) nghĩa là outbound đã bị bỏ qua.
    - Với Matrix, các tác vụ được sao chép hoặc cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là việc gửi bị chặn bởi thông tin đăng nhập.
    - Nếu lượt chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw chặn gửi outbound trực tiếp và cũng chặn đường dẫn tóm tắt dự phòng trong hàng đợi, nên không có gì được đăng lại vào chat.
    - Nếu tác tử nên tự nhắn tin cho người dùng, hãy kiểm tra tác vụ có tuyến dùng được hay không (`channel: "last"` với một chat trước đó, hoặc kênh/mục tiêu rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn rollover /new-style">
    - Độ mới của đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lượt chạy Heartbeat, thông báo exec và ghi sổ Gateway có thể cập nhật hàng phiên cho định tuyến/trạng thái, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi các trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ header phiên transcript JSONL khi tệp vẫn còn. Các hàng nhàn rỗi cũ không có `lastInteractionAt` dùng thời gian bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Các điểm cần chú ý về múi giờ">
    - Cron không có `--tz` dùng múi giờ của host Gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - `activeHours` của Heartbeat dùng phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa](/vi/automation) — tất cả cơ chế tự động hóa trong nháy mắt
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
