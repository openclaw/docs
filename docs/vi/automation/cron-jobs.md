---
read_when:
    - Lên lịch các tác vụ nền hoặc lượt đánh thức
    - Kết nối các tác nhân kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Các tác vụ đã lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-05-02T10:33:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp của Gateway. Nó lưu bền các tác vụ, đánh thức agent đúng thời điểm và có thể gửi đầu ra trở lại kênh chat hoặc điểm cuối Webhook.

## Bắt đầu nhanh

<Steps>
  <Step title="Thêm lời nhắc chạy một lần">
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
  <Step title="Kiểm tra các tác vụ của bạn">
    ```bash
    openclaw cron list
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

- Cron chạy **bên trong tiến trình Gateway** (không phải bên trong mô hình).
- Định nghĩa tác vụ được lưu bền tại `~/.openclaw/cron/jobs.json` nên việc khởi động lại không làm mất lịch.
- Trạng thái thực thi runtime được lưu bền bên cạnh nó trong `~/.openclaw/cron/jobs-state.json`. Nếu bạn theo dõi định nghĩa cron trong git, hãy theo dõi `jobs.json` và gitignore `jobs-state.json`.
- Sau khi tách, các phiên bản OpenClaw cũ hơn có thể đọc `jobs.json` nhưng có thể coi tác vụ là mới vì các trường runtime hiện nằm trong `jobs-state.json`.
- Khi `jobs.json` được chỉnh sửa trong lúc Gateway đang chạy hoặc đã dừng, OpenClaw so sánh các trường lịch đã thay đổi với siêu dữ liệu slot runtime đang chờ và xóa các giá trị `nextRunAtMs` cũ. Các lần ghi lại chỉ thay đổi định dạng hoặc thứ tự khóa sẽ giữ nguyên slot đang chờ.
- Mọi lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các tác vụ lượt agent cô lập đã quá hạn được lên lịch lại ra ngoài cửa sổ kết nối kênh thay vì phát lại ngay, để quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi tốt sau khi khởi động lại.
- Tác vụ chạy một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron cô lập cố gắng hết sức để đóng các tab/trình duyệt và tiến trình được theo dõi cho session `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại tiến trình mồ côi.
- Các lần chạy cron cô lập cũng bảo vệ khỏi các phản hồi xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không còn lần chạy subagent hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron cô lập ưu tiên siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, rồi mới quay về các marker tóm tắt/đầu ra cuối đã biết như `SYSTEM_RUN_DENIED` và `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là lần chạy xanh.
- Các lần chạy cron cô lập cũng coi lỗi agent ở cấp lần chạy là lỗi tác vụ ngay cả khi không tạo payload phản hồi, để lỗi mô hình/nhà cung cấp tăng bộ đếm lỗi và kích hoạt thông báo thất bại thay vì xóa tác vụ như thể đã thành công.
- Khi một tác vụ lượt agent cô lập đạt `timeoutSeconds`, cron hủy lần chạy agent bên dưới và cho nó một khoảng thời gian ngắn để dọn dẹp. Nếu lần chạy không thoát hết, quy trình dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu session của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat đang xếp hàng không bị kẹt sau một session xử lý đã cũ.

<a id="maintenance"></a>

<Note>
Đối soát tác vụ cho cron trước hết thuộc sở hữu runtime, sau đó được lịch sử bền hỗ trợ: một tác vụ cron đang hoạt động vẫn sống trong khi runtime cron còn theo dõi tác vụ đó là đang chạy, ngay cả khi một hàng session con cũ vẫn tồn tại. Khi runtime không còn sở hữu tác vụ và cửa sổ ân hạn 5 phút hết hạn, bảo trì sẽ kiểm tra nhật ký chạy đã lưu bền và trạng thái tác vụ cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền đó cho thấy kết quả cuối, sổ cái tác vụ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm tra CLI offline có thể khôi phục từ lịch sử bền, nhưng nó không coi tập tác vụ đang hoạt động trong tiến trình của chính nó bị rỗng là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI    | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng thời gian cố định                                |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được coi là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ tường cục bộ.

Các biểu thức lặp lại đúng đầu giờ sẽ tự động được rải lệch tối đa 5 phút để giảm đỉnh tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức Cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp — không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5–6 lần mỗi tháng thay vì 0–1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner tại đây. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch theo một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của tác vụ.

## Kiểu thực thi

| Kiểu             | Giá trị `--session` | Chạy trong               | Phù hợp nhất cho              |
| ---------------- | ------------------- | ------------------------ | ----------------------------- |
| Session chính    | `main`              | Lượt Heartbeat tiếp theo | Lời nhắc, sự kiện hệ thống    |
| Cô lập           | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, việc nền             |
| Session hiện tại | `current`           | Gắn tại thời điểm tạo    | Công việc lặp lại có ngữ cảnh |
| Session tùy chỉnh | `session:custom-id` | Session được đặt tên bền | Quy trình làm việc xây dựng trên lịch sử |

<AccordionGroup>
  <Accordion title="Session chính so với cô lập so với tùy chỉnh">
    Các tác vụ **session chính** xếp hàng một sự kiện hệ thống và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Những sự kiện hệ thống đó không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi cho session đích. Tác vụ **cô lập** chạy một lượt agent chuyên dụng với một session mới. **Session tùy chỉnh** (`session:xxx`) lưu bền ngữ cảnh qua các lần chạy, cho phép các quy trình làm việc như daily standup xây dựng trên các bản tóm tắt trước đó.
  </Accordion>
  <Accordion title="Ý nghĩa của 'session mới' đối với tác vụ cô lập">
    Với tác vụ cô lập, "session mới" nghĩa là một transcript/session id mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như cài đặt thinking/fast/verbose, nhãn và các ghi đè mô hình/auth do người dùng chọn rõ ràng, nhưng nó không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, elevation, origin hoặc liên kết runtime ACP. Dùng `current` hoặc `session:<id>` khi một tác vụ lặp lại cần cố ý xây dựng trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Với tác vụ cô lập, việc tháo dỡ runtime hiện bao gồm dọn dẹp trình duyệt theo best-effort cho session cron đó. Lỗi dọn dẹp bị bỏ qua để kết quả cron thực tế vẫn là kết quả quyết định.

    Các lần chạy cron cô lập cũng hủy mọi phiên bản runtime MCP đóng gói được tạo cho tác vụ thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách các client MCP của session chính và session tùy chỉnh được tháo dỡ, nên tác vụ cron cô lập không làm rò rỉ tiến trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Subagent và gửi tới Discord">
    Khi các lần chạy cron cô lập điều phối subagent, việc gửi cũng ưu tiên đầu ra cuối của hậu duệ hơn văn bản tạm thời đã cũ của cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw sẽ chặn cập nhật cha một phần đó thay vì thông báo nó.

    Với mục tiêu thông báo Discord chỉ văn bản, OpenClaw gửi văn bản assistant cuối chuẩn một lần thay vì phát lại cả payload văn bản được stream/trung gian và câu trả lời cuối. Payload Discord dạng media và có cấu trúc vẫn được gửi như các payload riêng để tệp đính kèm và thành phần không bị bỏ.

  </Accordion>
</AccordionGroup>

### Tùy chọn payload cho tác vụ cô lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc với cô lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; dùng mô hình được phép đã chọn cho tác vụ.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua chèn tệp khởi tạo workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn công cụ mà tác vụ có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của tác vụ đó. Nó không giống ghi đè `/model` của chat-session: các chuỗi fallback đã cấu hình vẫn áp dụng khi mô hình chính của tác vụ thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm fallback về lựa chọn mô hình agent/mặc định của tác vụ.

Tác vụ Cron cũng có thể mang `fallbacks` ở cấp payload. Khi có mặt, danh sách đó thay thế chuỗi fallback đã cấu hình cho tác vụ. Dùng `fallbacks: []` trong payload/API của tác vụ khi bạn muốn một lần chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu một tác vụ có `--model` nhưng không có fallback trong payload hoặc cấu hình, OpenClaw truyền một ghi đè fallback rỗng rõ ràng để mô hình chính của agent không bị thêm vào như một mục tiêu thử lại ẩn.

Thứ tự ưu tiên chọn mô hình cho tác vụ cô lập là:

1. Ghi đè mô hình hook Gmail (khi lần chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong payload theo từng tác vụ
3. Ghi đè mô hình session cron đã lưu do người dùng chọn
4. Lựa chọn mô hình agent/mặc định

Chế độ nhanh cũng theo lựa chọn live đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập dùng nó theo mặc định. Ghi đè `fastMode` của session đã lưu vẫn thắng cấu hình theo cả hai hướng.

Nếu một lần chạy cô lập gặp chuyển giao đổi mô hình live, cron thử lại với nhà cung cấp/mô hình đã chuyển và lưu bền lựa chọn live đó cho lần chạy đang hoạt động trước khi thử lại. Khi lần chuyển cũng mang một hồ sơ auth mới, cron cũng lưu bền ghi đè hồ sơ auth đó cho lần chạy đang hoạt động. Số lần thử lại bị giới hạn: sau lần thử ban đầu cộng 2 lần thử lại chuyển đổi, cron hủy thay vì lặp mãi.

Trước khi một lần chạy cron cô lập đi vào agent runner, OpenClaw kiểm tra các điểm cuối nhà cung cấp cục bộ có thể truy cập cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình mà `baseUrl` là loopback, mạng riêng hoặc `.local`. Nếu điểm cuối đó ngừng hoạt động, lần chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả điểm cuối được lưu cache trong 5 phút, nên nhiều tác vụ đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang hoặc LM Studio cục bộ đã chết sẽ chia sẻ một probe nhỏ thay vì tạo bão yêu cầu. Các lần chạy bị bỏ qua do preflight nhà cung cấp không tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn thông báo bỏ qua lặp lại.

## Gửi và đầu ra

| Chế độ     | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Fallback gửi văn bản cuối tới đích nếu agent chưa gửi              |
| `webhook`  | POST payload sự kiện hoàn tất tới một URL                          |
| `none`     | Không có gửi fallback của runner                                   |

Sử dụng `--announce --channel telegram --to "-1001234567890"` để gửi tới kênh. Với các chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; các trình gọi RPC/cấu hình trực tiếp cũng có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Đích Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng đúng ID phòng hoặc dạng `room:!room:server` từ Matrix.

Khi gửi thông báo dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron quay về lịch sử phiên hoặc một kênh đã cấu hình duy nhất. Chỉ các tiền tố do plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được đặt rõ ràng, tiền tố đích phải đặt tên cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` bị từ chối thay vì để WhatsApp diễn giải ID Telegram thành số điện thoại. Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn là cú pháp đích thuộc sở hữu kênh, không phải bộ chọn nhà cung cấp.

Đối với các tác vụ cô lập, việc gửi chat được chia sẻ. Nếu có tuyến chat, agent có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu agent gửi tới đích đã cấu hình/hiện tại, OpenClaw bỏ qua thông báo dự phòng. Nếu không, `announce`, `webhook`, và `none` chỉ kiểm soát runner làm gì với phản hồi cuối cùng sau lượt agent.

Khi agent tạo một lời nhắc cô lập từ chat đang hoạt động, OpenClaw lưu đích gửi trực tiếp được giữ lại cho tuyến thông báo dự phòng. Khóa phiên nội bộ có thể viết thường; đích gửi của nhà cung cấp không được tái tạo từ các khóa đó khi có ngữ cảnh chat hiện tại.

Gửi thông báo ngầm định dùng danh sách cho phép của kênh đã cấu hình để xác thực và định tuyến lại các đích đã cũ. Phê duyệt kho ghép cặp DM không phải là người nhận tự động hóa dự phòng; hãy đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi tới DM.

Thông báo lỗi đi theo một đường dẫn đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè mặc định đó cho từng tác vụ.
- Nếu cả hai đều chưa được đặt và tác vụ đã gửi qua `announce`, thông báo lỗi giờ sẽ quay về đích thông báo chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các tác vụ `sessionTarget="isolated"` trừ khi chế độ gửi chính là `webhook`.
- `failureAlert.includeSkipped: true` cho phép một tác vụ hoặc chính sách cảnh báo cron toàn cục nhận các cảnh báo lượt chạy bị bỏ qua lặp lại. Các lượt chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến backoff lỗi thực thi.

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
  <Tab title="Ghi đè model và thinking">
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
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Ánh xạ có thể chuyển đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng template hoặc biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ endpoint hook phía sau loopback, tailnet, hoặc reverse proxy đáng tin cậy.

- Dùng một token hook chuyên dụng; không dùng lại token xác thực gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn định tuyến `agentId` rõ ràng.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do trình gọi chọn.
- Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để ràng buộc hình dạng khóa phiên được phép.
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

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail, và dùng Tailscale Funnel cho endpoint push.

### Gateway tự khởi động

Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động `gog gmail watch serve` khi boot và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không dùng.

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
  <Step title="Bắt đầu watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Ghi đè model Gmail

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
Ghi chú ghi đè model:

- `openclaw cron add|edit --model ...` thay đổi model đã chọn của tác vụ.
- Nếu model được phép, đúng nhà cung cấp/model đó sẽ tới lượt chạy agent cô lập.
- Nếu model không được phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng.
- Chuỗi dự phòng đã cấu hình vẫn áp dụng vì cron `--model` là model chính của tác vụ, không phải ghi đè `/model` của phiên.
- Payload `fallbacks` thay thế các dự phòng đã cấu hình cho tác vụ đó; `fallbacks: []` tắt dự phòng và làm lượt chạy nghiêm ngặt.
- Một `--model` thuần không có danh sách dự phòng rõ ràng hoặc đã cấu hình sẽ không rơi tiếp về model chính của agent như một đích thử lại phụ im lặng.

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

`maxConcurrentRuns` giới hạn cả việc điều phối cron đã lên lịch và thực thi lượt agent cô lập. Các lượt agent cron cô lập dùng nội bộ làn thực thi `cron-nested` chuyên dụng của hàng đợi, nên tăng giá trị này cho phép các lượt chạy LLM cron độc lập tiến hành song song thay vì chỉ khởi động các wrapper cron bên ngoài của chúng. Làn `nested` không phải cron dùng chung không được mở rộng bởi thiết lập này.

Sidecar trạng thái runtime được suy ra từ `cron.store`: một store `.json` như `~/clawd/cron/jobs.json` dùng `~/clawd/cron/jobs-state.json`, còn đường dẫn store không có hậu tố `.json` thì thêm `-state.json`.

Nếu bạn chỉnh sửa thủ công `jobs.json`, đừng đưa `jobs-state.json` vào kiểm soát mã nguồn. OpenClaw dùng sidecar đó cho slot đang chờ, marker đang hoạt động, metadata lần chạy cuối, và định danh lịch cho scheduler biết khi nào một tác vụ được chỉnh sửa bên ngoài cần `nextRunAtMs` mới.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) được thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn bị tắt ngay lập tức.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lượt chạy thành công kế tiếp.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) dọn các mục phiên chạy cô lập. `cron.runLog.maxBytes` / `cron.runLog.keepLines` tự động dọn các tệp nhật ký chạy.
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
    - `reason: not-due` trong đầu ra lượt chạy nghĩa là lượt chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và tác vụ chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không gửi được">
    - Chế độ gửi `none` nghĩa là không mong đợi lượt gửi dự phòng của trình chạy. Agent vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện khả dụng.
    - Thiếu/không hợp lệ đích gửi (`channel`/`to`) nghĩa là lượt gửi đi đã bị bỏ qua.
    - Với Matrix, các tác vụ đã sao chép hoặc tác vụ cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là việc gửi đã bị chặn bởi thông tin xác thực.
    - Nếu lần chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn việc gửi trực tiếp ra ngoài và cũng chặn đường dẫn tóm tắt xếp hàng dự phòng, nên sẽ không có gì được đăng lại vào cuộc trò chuyện.
    - Nếu agent cần tự nhắn tin cho người dùng, hãy kiểm tra rằng tác vụ có một tuyến dùng được (`channel: "last"` với một cuộc trò chuyện trước đó, hoặc một kênh/đích rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat dường như ngăn rollover /new-style">
    - Độ mới cho việc đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lần chạy Heartbeat, thông báo exec và việc ghi sổ của Gateway có thể cập nhật hàng phiên để định tuyến/trạng thái, nhưng chúng không gia hạn `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi các trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ phần đầu phiên JSONL của bản ghi khi tệp vẫn còn khả dụng. Các hàng nhàn rỗi cũ không có `lastInteractionAt` dùng thời điểm bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Những điểm dễ sai về múi giờ">
    - Cron không có `--tz` sẽ dùng múi giờ của máy chủ Gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - `activeHours` của Heartbeat dùng cách phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — toàn bộ cơ chế tự động hóa trong nháy mắt
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi Cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt định kỳ trong phiên chính
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
