---
read_when:
    - Lên lịch tác vụ nền hoặc đánh thức
    - Kết nối các trình kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Các tác vụ đã lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-05-11T20:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu giữ các job, đánh thức agent vào đúng thời điểm, và có thể gửi đầu ra trở lại một kênh chat hoặc endpoint webhook.

## Bắt đầu nhanh

<Steps>
  <Step title="Thêm lời nhắc một lần">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
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
- Định nghĩa job được lưu giữ tại `~/.openclaw/cron/jobs.json` nên việc khởi động lại sẽ không làm mất lịch.
- Trạng thái thực thi runtime được lưu giữ cạnh đó trong `~/.openclaw/cron/jobs-state.json`. Nếu bạn theo dõi định nghĩa cron trong git, hãy theo dõi `jobs.json` và gitignore `jobs-state.json`.
- Sau khi tách ra, các phiên bản OpenClaw cũ hơn có thể đọc `jobs.json` nhưng có thể xem job là mới vì các trường runtime hiện nằm trong `jobs-state.json`.
- Khi `jobs.json` được chỉnh sửa trong lúc Gateway đang chạy hoặc đã dừng, OpenClaw so sánh các trường lịch đã thay đổi với metadata slot runtime đang chờ và xóa các giá trị `nextRunAtMs` lỗi thời. Các lần ghi lại chỉ thay đổi định dạng hoặc thứ tự khóa sẽ giữ nguyên slot đang chờ.
- Mọi lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các job lượt agent cô lập bị quá hạn được lên lịch lại ra ngoài cửa sổ kết nối kênh thay vì phát lại ngay lập tức, để quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi tốt sau khi khởi động lại.
- Job một lần (`--at`) mặc định sẽ tự động xóa sau khi thành công.
- Các lần chạy cron cô lập cố gắng đóng các tab/tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại tiến trình mồ côi.
- Các lần chạy cron cô lập nhận được quyền tự dọn dẹp cron hẹp vẫn có thể đọc trạng thái bộ lập lịch, danh sách tự lọc của job hiện tại của chúng, và lịch sử chạy của job đó, để các kiểm tra trạng thái/heartbeat có thể kiểm tra lịch của chính chúng mà không có quyền truy cập chỉnh sửa cron rộng hơn.
- Các lần chạy cron cô lập cũng bảo vệ khỏi các phản hồi xác nhận lỗi thời. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời (`on it`, `pulling everything together`, và các gợi ý tương tự) và không có lần chạy subagent con nào vẫn chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron cô lập ưu tiên metadata từ chối thực thi có cấu trúc từ lần chạy nhúng, sau đó fallback về các marker tóm tắt/đầu ra cuối cùng đã biết như `SYSTEM_RUN_DENIED` và `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là một lần chạy thành công.
- Các lần chạy cron cô lập cũng xem lỗi agent ở cấp lần chạy là lỗi job ngay cả khi không tạo payload phản hồi, để lỗi model/provider làm tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì đánh dấu job là thành công.
- Khi một job lượt agent cô lập đạt `timeoutSeconds`, cron hủy lần chạy agent bên dưới và cho nó một khoảng thời gian dọn dẹp ngắn. Nếu lần chạy không thoát hết, phần dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat đang xếp hàng không bị kẹt phía sau một phiên xử lý lỗi thời.
- Nếu một lượt agent cô lập bị đình trệ trước khi runner khởi động hoặc trước lần gọi model đầu tiên, cron ghi nhận timeout theo pha cụ thể như `setup timed out before runner start` hoặc `stalled before first model call (last phase: context-engine)`. Các watchdog này bao phủ provider nhúng và provider dựa trên CLI trước khi tiến trình CLI bên ngoài của chúng thực sự được khởi động, và được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động nguội/xác thực/ngữ cảnh hiện ra nhanh chóng thay vì chờ hết toàn bộ ngân sách job.

<a id="maintenance"></a>

<Note>
Đối soát tác vụ cho cron trước hết thuộc sở hữu runtime, sau đó mới dựa trên lịch sử bền vững: một tác vụ cron đang hoạt động vẫn duy trì live trong khi runtime cron vẫn theo dõi job đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu job và cửa sổ ân hạn 5 phút hết hạn, quy trình bảo trì kiểm tra log chạy đã lưu giữ và trạng thái job cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền vững đó cho thấy kết quả kết thúc, sổ cái tác vụ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm toán CLI offline có thể khôi phục từ lịch sử bền vững, nhưng nó không xem tập active-job trong tiến trình đang rỗng của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI    | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng thời gian cố định                                |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được xử lý là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ tường cục bộ.

Các biểu thức lặp lại ở đầu giờ được tự động giãn ngẫu nhiên tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả hai trường ngày trong tháng và ngày trong tuần đều không phải wildcard, croner khớp khi **một trong hai** trường khớp, chứ không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5-6 lần mỗi tháng thay vì 0-1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, hãy dùng modifier ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và chặn trường còn lại trong prompt hoặc lệnh của job.

## Kiểu thực thi

| Kiểu            | Giá trị `--session` | Chạy trong               | Phù hợp nhất cho               |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| Phiên chính     | `main`              | Lượt heartbeat tiếp theo | Lời nhắc, sự kiện hệ thống     |
| Cô lập          | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, việc nền định kỳ      |
| Phiên hiện tại  | `current`           | Gắn tại thời điểm tạo    | Công việc lặp lại có nhận biết ngữ cảnh |
| Phiên tùy chỉnh | `session:custom-id` | Phiên được đặt tên bền vững | Quy trình làm việc xây dựng trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính so với cô lập so với tùy chỉnh">
    Job **phiên chính** xếp hàng một sự kiện hệ thống và tùy chọn đánh thức heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Các sự kiện hệ thống đó không kéo dài độ mới của reset hằng ngày/nhàn rỗi cho phiên mục tiêu. Job **cô lập** chạy một lượt agent chuyên dụng với phiên mới. **Phiên tùy chỉnh** (`session:xxx`) lưu giữ ngữ cảnh qua các lần chạy, cho phép các quy trình như standup hằng ngày xây dựng trên các bản tóm tắt trước đó.
  </Accordion>
  <Accordion title="&quot;Phiên mới&quot; nghĩa là gì với job cô lập">
    Với job cô lập, "phiên mới" nghĩa là một transcript/session id mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập suy nghĩ/nhanh/chi tiết, nhãn, và override model/auth do người dùng chọn rõ ràng, nhưng nó không kế thừa ngữ cảnh hội thoại môi trường từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc, hoặc liên kết runtime ACP. Dùng `current` hoặc `session:<id>` khi một job lặp lại chủ ý cần xây dựng trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Với job cô lập, quá trình teardown runtime hiện bao gồm nỗ lực dọn dẹp trình duyệt cho phiên cron đó. Lỗi dọn dẹp được bỏ qua để kết quả cron thực tế vẫn được ưu tiên.

    Các lần chạy cron cô lập cũng dispose mọi phiên bản runtime MCP đi kèm được tạo cho job thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách các client MCP phiên chính và phiên tùy chỉnh được teardown, nên job cron cô lập không làm rò rỉ tiến trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Gửi subagent và Discord">
    Khi các lần chạy cron cô lập điều phối subagent, việc gửi cũng ưu tiên đầu ra con cuối cùng hơn văn bản tạm thời lỗi thời của cha. Nếu các con vẫn đang chạy, OpenClaw sẽ chặn cập nhật cha một phần đó thay vì thông báo nó.

    Với mục tiêu thông báo Discord chỉ có văn bản, OpenClaw gửi văn bản assistant cuối cùng chuẩn một lần thay vì phát lại cả payload văn bản được stream/trung gian và câu trả lời cuối cùng. Payload media và Discord có cấu trúc vẫn được gửi dưới dạng các payload riêng để tệp đính kèm và component không bị bỏ sót.

  </Accordion>
</AccordionGroup>

### Tùy chọn payload cho job cô lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc với cô lập).
</ParamField>
<ParamField path="--model" type="string">
  Override model; dùng model được phép đã chọn cho job.
</ParamField>
<ParamField path="--thinking" type="string">
  Override mức suy nghĩ.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua việc inject tệp bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn các tool mà job có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng model được phép đã chọn làm model chính của job đó. Nó không giống override `/model` của phiên chat: các chuỗi fallback đã cấu hình vẫn áp dụng khi model chính của job lỗi. Nếu model được yêu cầu không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm fallback về lựa chọn model agent/mặc định của job.

Job cron cũng có thể mang `fallbacks` ở cấp payload. Khi có mặt, danh sách đó thay thế chuỗi fallback đã cấu hình cho job. Dùng `fallbacks: []` trong payload/API của job khi bạn muốn một lần chạy cron nghiêm ngặt chỉ thử model đã chọn. Nếu một job có `--model` nhưng không có fallback trong payload hoặc cấu hình, OpenClaw truyền một override fallback rỗng rõ ràng để model chính của agent không được thêm vào như một mục tiêu thử lại ẩn.

Thứ tự ưu tiên chọn model cho job cô lập là:

1. Override model hook Gmail (khi lần chạy đến từ Gmail và override đó được phép)
2. `model` trong payload theo job
3. Override model phiên cron đã lưu do người dùng chọn
4. Lựa chọn model agent/mặc định

Chế độ nhanh cũng theo lựa chọn live đã phân giải. Nếu cấu hình model đã chọn có `params.fastMode`, cron cô lập mặc định dùng giá trị đó. Override `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng.

Nếu một lần chạy cô lập gặp chuyển giao đổi model live, cron thử lại với provider/model đã chuyển và lưu giữ lựa chọn live đó cho lần chạy đang hoạt động trước khi thử lại. Khi việc chuyển đổi cũng mang theo một auth profile mới, cron cũng lưu giữ override auth profile đó cho lần chạy đang hoạt động. Số lần thử lại bị giới hạn: sau lần thử ban đầu cộng với 2 lần thử lại do chuyển đổi, cron hủy thay vì lặp mãi.

Trước khi một lần chạy cron cô lập đi vào trình chạy tác nhân, OpenClaw kiểm tra các endpoint nhà cung cấp cục bộ có thể truy cập được cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là loopback, mạng riêng hoặc `.local`. Nếu endpoint đó không hoạt động, lần chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả endpoint được lưu trong bộ nhớ đệm trong 5 phút, nên nhiều tác vụ đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang hoặc LM Studio cục bộ không hoạt động sẽ dùng chung một phép dò nhỏ thay vì tạo ra một cơn bão yêu cầu. Các lần chạy bị bỏ qua ở bước tiền kiểm nhà cung cấp không tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn nhận thông báo bỏ qua lặp lại.

## Phân phối và đầu ra

| Chế độ     | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Phân phối dự phòng văn bản cuối cùng tới đích nếu tác nhân chưa gửi |
| `webhook`  | POST payload sự kiện hoàn tất tới một URL                           |
| `none`     | Không phân phối dự phòng từ trình chạy                              |

Dùng `--announce --channel telegram --to "-1001234567890"` để phân phối tới kênh. Với các chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; các caller RPC/cấu hình trực tiếp cũng có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Các đích Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng chính xác ID phòng hoặc dạng `room:!room:server` từ Matrix.

Khi phân phối announce dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron quay lại lịch sử phiên hoặc một kênh đã cấu hình duy nhất. Chỉ các tiền tố do plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được đặt rõ ràng, tiền tố đích phải chỉ cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối thay vì để WhatsApp diễn giải ID Telegram là số điện thoại. Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>` và `sms:<number>` vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Đối với các tác vụ cô lập, phân phối trò chuyện được dùng chung. Nếu có tuyến trò chuyện khả dụng, tác nhân có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu tác nhân gửi tới đích đã cấu hình/hiện tại, OpenClaw bỏ qua announce dự phòng. Nếu không, `announce`, `webhook` và `none` chỉ kiểm soát việc trình chạy xử lý phản hồi cuối cùng sau lượt tác nhân.

Khi một tác nhân tạo lời nhắc cô lập từ một cuộc trò chuyện đang hoạt động, OpenClaw lưu đích phân phối trực tiếp được giữ lại cho tuyến announce dự phòng. Khóa phiên nội bộ có thể là chữ thường; các đích phân phối nhà cung cấp không được dựng lại từ các khóa đó khi có ngữ cảnh trò chuyện hiện tại.

Phân phối announce ngầm định dùng danh sách cho phép kênh đã cấu hình để xác thực và định tuyến lại các đích cũ. Các phê duyệt trong kho ghép cặp DM không phải người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi tới DM.

Thông báo lỗi đi theo một đường đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè theo từng tác vụ.
- Nếu cả hai đều không được đặt và tác vụ đã phân phối qua `announce`, thông báo lỗi hiện sẽ quay lại đích announce chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các tác vụ `sessionTarget="isolated"` trừ khi chế độ phân phối chính là `webhook`.
- `failureAlert.includeSkipped: true` cho phép một tác vụ hoặc chính sách cảnh báo cron toàn cục nhận cảnh báo lặp lại cho các lần chạy bị bỏ qua. Các lần chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng tới backoff lỗi thực thi.

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
  <Tab title="Tác vụ cô lập lặp lại">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
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
</Tabs>

## Webhook

Gateway có thể cung cấp các endpoint Webhook HTTP cho trigger bên ngoài. Bật trong cấu hình:

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
    Chạy một lượt tác nhân cô lập:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Trường: `message` (bắt buộc), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook được ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Mapping có thể biến đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc phép biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các endpoint hook phía sau loopback, tailnet hoặc reverse proxy đáng tin cậy.

- Dùng token hook chuyên dụng; không dùng lại token xác thực gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn định tuyến `agentId` rõ ràng.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do caller chọn.
- Nếu bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để ràng buộc hình dạng khóa phiên được phép.
- Payload hook mặc định được bọc bằng các ranh giới an toàn.

</Warning>

## Tích hợp Gmail PubSub

Kết nối trigger hộp thư Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw đã bật, Tailscale cho endpoint HTTPS công khai.
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
  <Step title="Tạo topic và cấp quyền truy cập push Gmail">
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

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Ghi chú ghi đè mô hình:

- `openclaw cron add|edit --model ...` thay đổi mô hình đã chọn của tác vụ.
- Nếu mô hình được phép, đúng nhà cung cấp/mô hình đó sẽ đến lần chạy tác nhân cô lập.
- Nếu mô hình không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng.
- Các chuỗi dự phòng đã cấu hình vẫn áp dụng vì `--model` của cron là mô hình chính của tác vụ, không phải ghi đè `/model` của phiên.
- Payload `fallbacks` thay thế fallback đã cấu hình cho tác vụ đó; `fallbacks: []` tắt fallback và làm lần chạy trở nên nghiêm ngặt.
- Một `--model` thuần túy không có danh sách fallback rõ ràng hoặc đã cấu hình sẽ không rơi tiếp tới mô hình chính của tác nhân như một đích thử lại bổ sung âm thầm.

</Note>

## Cấu hình

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
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

`maxConcurrentRuns` giới hạn cả điều phối cron đã lên lịch và thực thi lượt tác nhân cô lập. Các lượt tác nhân cron cô lập dùng nội bộ làn thực thi `cron-nested` chuyên dụng của hàng đợi, nên tăng giá trị này cho phép các lần chạy LLM cron độc lập tiến triển song song thay vì chỉ bắt đầu các wrapper cron bên ngoài của chúng. Làn `nested` không phải cron dùng chung không được mở rộng bởi thiết lập này.

Sidecar trạng thái runtime được dẫn xuất từ `cron.store`: một kho `.json` như `~/clawd/cron/jobs.json` dùng `~/clawd/cron/jobs-state.json`, còn một đường dẫn kho không có hậu tố `.json` sẽ thêm `-state.json`.

Nếu bạn chỉnh sửa thủ công `jobs.json`, hãy để `jobs-state.json` ngoài kiểm soát mã nguồn. OpenClaw dùng sidecar đó cho slot đang chờ, marker đang hoạt động, siêu dữ liệu lần chạy cuối và danh tính lịch biểu cho bộ lập lịch biết khi một tác vụ được chỉnh sửa bên ngoài cần một `nextRunAtMs` mới.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) thử lại tối đa 3 lần với backoff hàm mũ. Lỗi vĩnh viễn sẽ vô hiệu hóa ngay lập tức.

    **Thử lại định kỳ**: backoff hàm mũ (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lần chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) dọn dẹp các mục phiên chạy cô lập. `cron.runLog.maxBytes` / `cron.runLog.keepLines` tự động dọn dẹp các tệp nhật ký chạy.
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
    - Kiểm tra `cron.enabled` và biến môi trường `OPENCLAW_SKIP_CRON`.
    - Xác nhận Gateway đang chạy liên tục.
    - Với lịch `cron`, xác minh múi giờ (`--tz`) so với múi giờ của máy chủ.
    - `reason: not-due` trong đầu ra chạy nghĩa là lần chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và công việc chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không phân phối">
    - Chế độ phân phối `none` nghĩa là không mong đợi gửi dự phòng từ trình chạy. Agent vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
    - Thiếu/không hợp lệ đích phân phối (`channel`/`to`) nghĩa là gửi đi đã bị bỏ qua.
    - Với Matrix, các công việc được sao chép hoặc cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa công việc thành giá trị `!room:server` hoặc `room:!room:server` chính xác từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là phân phối đã bị chặn bởi thông tin đăng nhập.
    - Nếu lần chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn phân phối gửi đi trực tiếp và cũng chặn đường dẫn tóm tắt xếp hàng dự phòng, nên không có gì được đăng lại vào cuộc trò chuyện.
    - Nếu agent nên tự nhắn tin cho người dùng, hãy kiểm tra rằng công việc có tuyến dùng được (`channel: "last"` với một cuộc trò chuyện trước đó, hoặc một kênh/đích rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat dường như ngăn chuyển vòng /new-style">
    - Độ mới của đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lần chạy Heartbeat, thông báo exec và ghi sổ Gateway có thể cập nhật hàng phiên cho định tuyến/trạng thái, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi các trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ header phiên JSONL của bản ghi khi tệp vẫn còn khả dụng. Các hàng nhàn rỗi cũ không có `lastInteractionAt` dùng thời điểm bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Các lưu ý dễ nhầm về múi giờ">
    - Cron không có `--tz` dùng múi giờ của máy chủ gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - Heartbeat `activeHours` dùng cơ chế phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — toàn bộ cơ chế tự động hóa trong một cái nhìn tổng quan
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
