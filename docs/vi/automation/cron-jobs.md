---
read_when:
    - Lên lịch tác vụ nền hoặc lần đánh thức
    - Kết nối các tác nhân kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Quyết định giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Các tác vụ đã lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-05-07T13:13:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu bền vững các tác vụ, đánh thức agent vào đúng thời điểm, và có thể gửi đầu ra trở lại một kênh chat hoặc endpoint webhook.

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
- Định nghĩa tác vụ được lưu bền vững tại `~/.openclaw/cron/jobs.json` để các lịch không bị mất khi khởi động lại.
- Trạng thái thực thi runtime được lưu bền vững cạnh đó trong `~/.openclaw/cron/jobs-state.json`. Nếu bạn theo dõi định nghĩa cron trong git, hãy theo dõi `jobs.json` và gitignore `jobs-state.json`.
- Sau khi tách, các phiên bản OpenClaw cũ hơn có thể đọc `jobs.json` nhưng có thể xem các tác vụ là mới vì các trường runtime hiện nằm trong `jobs-state.json`.
- Khi `jobs.json` được chỉnh sửa trong lúc Gateway đang chạy hoặc đã dừng, OpenClaw so sánh các trường lịch đã thay đổi với siêu dữ liệu slot runtime đang chờ và xóa các giá trị `nextRunAtMs` lỗi thời. Các lần ghi lại chỉ thay đổi định dạng thuần túy hoặc chỉ thay đổi thứ tự khóa sẽ giữ nguyên slot đang chờ.
- Tất cả các lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các tác vụ agent-turn cô lập đã quá hạn được lên lịch lại ra ngoài cửa sổ kết nối kênh thay vì phát lại ngay lập tức, để quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi tốt sau khi khởi động lại.
- Tác vụ chạy một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron cô lập cố gắng đóng các tab/tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt đã tách rời không để lại các tiến trình mồ côi.
- Các lần chạy cron cô lập nhận được quyền tự dọn dẹp cron hẹp vẫn có thể đọc trạng thái bộ lập lịch và danh sách tự lọc của tác vụ hiện tại của chúng, để kiểm tra trạng thái/Heartbeat có thể xem lịch của chính chúng mà không có quyền thay đổi cron rộng hơn.
- Các lần chạy cron cô lập cũng bảo vệ khỏi các phản hồi xác nhận lỗi thời. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời (`on it`, `pulling everything together`, và các gợi ý tương tự) và không có lần chạy subagent hậu duệ nào vẫn chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron cô lập ưu tiên siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, sau đó mới dùng đến các dấu hiệu tóm tắt/đầu ra cuối cùng đã biết như `SYSTEM_RUN_DENIED` và `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là lần chạy xanh.
- Các lần chạy cron cô lập cũng xem lỗi agent ở cấp lần chạy là lỗi tác vụ ngay cả khi không tạo ra payload phản hồi, để lỗi mô hình/nhà cung cấp tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì xóa tác vụ như thể đã thành công.
- Khi một tác vụ agent-turn cô lập đạt `timeoutSeconds`, cron hủy lần chạy agent bên dưới và cho nó một cửa sổ dọn dẹp ngắn. Nếu lần chạy không thoát hết, quy trình dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat đang xếp hàng không bị kẹt sau một phiên xử lý lỗi thời.

<a id="maintenance"></a>

<Note>
Việc đối chiếu tác vụ cho cron trước hết thuộc sở hữu của runtime, sau đó mới dựa trên lịch sử bền vững: một tác vụ cron đang hoạt động vẫn sống trong khi cron runtime vẫn theo dõi tác vụ đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime không còn sở hữu tác vụ và cửa sổ gia hạn 5 phút hết hạn, các kiểm tra bảo trì sẽ xem log lần chạy đã lưu bền vững và trạng thái tác vụ cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền vững đó cho thấy một kết quả kết thúc, sổ cái tác vụ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm toán CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không xem tập tác vụ đang hoạt động trong tiến trình rỗng của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Kiểu lịch

| Loại    | Cờ CLI    | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng thời gian cố định                                |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được xem là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ đồng hồ địa phương.

Các biểu thức lặp lại vào đầu giờ được tự động giãn ngẫu nhiên tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức Cron được phân tích bằng [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp — không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5–6 lần mỗi tháng thay vì 0–1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của tác vụ.

## Kiểu thực thi

| Kiểu            | Giá trị `--session` | Chạy trong              | Phù hợp nhất cho              |
| --------------- | ------------------- | ------------------------ | ----------------------------- |
| Phiên chính     | `main`              | Lượt Heartbeat tiếp theo | Lời nhắc, sự kiện hệ thống    |
| Cô lập          | `isolated`          | `cron:<jobId>` riêng     | Báo cáo, việc nền định kỳ     |
| Phiên hiện tại  | `current`           | Gắn tại thời điểm tạo    | Công việc lặp lại nhận biết ngữ cảnh |
| Phiên tùy chỉnh | `session:custom-id` | Phiên có tên bền vững    | Quy trình làm việc xây dựng dựa trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính so với cô lập so với tùy chỉnh">
    Các tác vụ **phiên chính** xếp hàng một sự kiện hệ thống và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Các sự kiện hệ thống đó không kéo dài độ mới của reset hằng ngày/nhàn rỗi cho phiên đích. Các tác vụ **cô lập** chạy một lượt agent riêng với phiên mới. **Phiên tùy chỉnh** (`session:xxx`) duy trì ngữ cảnh qua các lần chạy, cho phép các quy trình như standup hằng ngày xây dựng dựa trên các bản tóm tắt trước đó.
  </Accordion>
  <Accordion title="Ý nghĩa của 'phiên mới' với tác vụ cô lập">
    Với tác vụ cô lập, "phiên mới" nghĩa là một transcript/id phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập thinking/fast/verbose, nhãn, và các lựa chọn ghi đè mô hình/auth do người dùng chọn rõ ràng, nhưng nó không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc, hoặc liên kết runtime ACP. Dùng `current` hoặc `session:<id>` khi một tác vụ lặp lại cần chủ ý xây dựng dựa trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Với tác vụ cô lập, teardown runtime hiện bao gồm dọn dẹp trình duyệt theo best-effort cho phiên cron đó. Lỗi dọn dẹp được bỏ qua để kết quả cron thực tế vẫn được ưu tiên.

    Các lần chạy cron cô lập cũng hủy mọi phiên bản runtime MCP đi kèm được tạo cho tác vụ thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách client MCP của phiên chính và phiên tùy chỉnh được tháo dỡ, để tác vụ cron cô lập không rò rỉ tiến trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Gửi subagent và Discord">
    Khi các lần chạy cron cô lập điều phối subagent, việc gửi cũng ưu tiên đầu ra cuối cùng của hậu duệ hơn văn bản tạm thời lỗi thời của cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw sẽ chặn cập nhật cha một phần đó thay vì thông báo nó.

    Với các mục tiêu thông báo Discord chỉ có văn bản, OpenClaw gửi văn bản assistant cuối cùng chuẩn một lần thay vì phát lại cả payload văn bản được stream/trung gian lẫn câu trả lời cuối cùng. Payload Discord có media và cấu trúc vẫn được gửi dưới dạng payload riêng để tệp đính kèm và component không bị bỏ.

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
  Bỏ qua chèn tệp bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Hạn chế các công cụ mà tác vụ có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của tác vụ đó. Nó không giống ghi đè `/model` của phiên chat: các chuỗi fallback đã cấu hình vẫn áp dụng khi mô hình chính của tác vụ thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm fallback về lựa chọn mô hình agent/mặc định của tác vụ.

Tác vụ Cron cũng có thể mang `fallbacks` ở cấp payload. Khi có mặt, danh sách đó thay thế chuỗi fallback đã cấu hình cho tác vụ. Dùng `fallbacks: []` trong payload/API của tác vụ khi bạn muốn một lần chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu một tác vụ có `--model` nhưng không có fallback payload lẫn fallback đã cấu hình, OpenClaw truyền một ghi đè fallback rỗng rõ ràng để mô hình chính của agent không được thêm như một mục tiêu thử lại phụ ẩn.

Thứ tự ưu tiên chọn mô hình cho tác vụ cô lập là:

1. Ghi đè mô hình của hook Gmail (khi lần chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong payload theo tác vụ
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình agent/mặc định

Chế độ nhanh cũng đi theo lựa chọn live đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập mặc định dùng giá trị đó. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng.

Nếu một lần chạy cô lập gặp bàn giao chuyển mô hình live, cron thử lại với nhà cung cấp/mô hình đã chuyển và lưu bền vững lựa chọn live đó cho lần chạy đang hoạt động trước khi thử lại. Khi lần chuyển cũng mang theo một hồ sơ auth mới, cron cũng lưu bền vững ghi đè hồ sơ auth đó cho lần chạy đang hoạt động. Số lần thử lại có giới hạn: sau lần thử ban đầu cộng 2 lần thử lại do chuyển đổi, cron hủy thay vì lặp vô hạn.

Trước khi một lần chạy cron cô lập đi vào agent runner, OpenClaw kiểm tra các endpoint nhà cung cấp cục bộ có thể truy cập cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là local loopback, mạng riêng, hoặc `.local`. Nếu endpoint đó đang tắt, lần chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả endpoint được cache trong 5 phút, để nhiều tác vụ đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang, hoặc LM Studio cục bộ đã chết chia sẻ một probe nhỏ thay vì tạo bão yêu cầu. Các lần chạy bị bỏ qua do provider-preflight không tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn nhận thông báo bỏ qua lặp lại.

## Gửi và đầu ra

| Chế độ    | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Gửi fallback văn bản cuối cùng đến mục tiêu nếu agent chưa gửi      |
| `webhook`  | POST payload sự kiện đã hoàn tất đến một URL                        |
| `none`     | Không gửi fallback của runner                                      |

Use `--announce --channel telegram --to "-1001234567890"` để gửi tới kênh. Với các chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; bên gọi RPC/cấu hình trực tiếp cũng có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Đích Slack/Discord/Mattermost nên dùng tiền tố tường minh (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng đúng ID phòng hoặc dạng `room:!room:server` từ Matrix.

Khi gửi thông báo dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi Cron quay về lịch sử phiên hoặc một kênh duy nhất đã cấu hình. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được đặt tường minh, tiền tố đích phải nêu cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối thay vì để WhatsApp diễn giải ID Telegram là số điện thoại. Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Với các tác vụ tách biệt, việc gửi tới trò chuyện được dùng chung. Nếu có tuyến trò chuyện khả dụng, tác tử có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu tác tử gửi tới đích đã cấu hình/hiện tại, OpenClaw bỏ qua thông báo dự phòng. Nếu không, `announce`, `webhook`, và `none` chỉ kiểm soát việc trình chạy xử lý phản hồi cuối cùng sau lượt tác tử.

Khi một tác tử tạo lời nhắc tách biệt từ một cuộc trò chuyện đang hoạt động, OpenClaw lưu đích gửi trực tiếp được giữ lại cho tuyến thông báo dự phòng. Khóa phiên nội bộ có thể viết thường; đích gửi của nhà cung cấp không được dựng lại từ các khóa đó khi có ngữ cảnh trò chuyện hiện tại.

Việc gửi thông báo ngầm định dùng danh sách cho phép của kênh đã cấu hình để xác thực và định tuyến lại các đích cũ. Phê duyệt kho ghép cặp tin nhắn trực tiếp không phải là người nhận tự động dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi tới tin nhắn trực tiếp.

Thông báo lỗi đi theo một đường đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè giá trị đó cho từng tác vụ.
- Nếu không đặt cả hai và tác vụ đã gửi qua `announce`, thông báo lỗi giờ sẽ quay về đích thông báo chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các tác vụ `sessionTarget="isolated"` trừ khi chế độ gửi chính là `webhook`.
- `failureAlert.includeSkipped: true` đưa một tác vụ hoặc chính sách cảnh báo Cron toàn cục vào các cảnh báo lượt chạy bị bỏ qua lặp lại. Các lượt chạy bị bỏ qua giữ bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến cơ chế lùi khi lỗi thực thi.

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

Gateway có thể cung cấp các điểm cuối Webhook HTTP cho trình kích hoạt bên ngoài. Bật trong cấu hình:

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

Mỗi yêu cầu phải bao gồm mã thông báo hook qua header:

- `Authorization: Bearer <token>` (khuyến nghị)
- `x-openclaw-token: <token>`

Mã thông báo trong chuỗi truy vấn bị từ chối.

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
    Chạy một lượt tác tử tách biệt:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Trường: `message` (bắt buộc), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook đã ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Ánh xạ có thể chuyển đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc phép biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các điểm cuối hook phía sau loopback, tailnet, hoặc proxy ngược đáng tin cậy.

- Dùng mã thông báo hook chuyên dụng; không dùng lại mã thông báo xác thực Gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn định tuyến `agentId` tường minh.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do bên gọi chọn.
- Nếu bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để ràng buộc dạng khóa phiên được phép.
- Payload hook được bao bọc bằng ranh giới an toàn theo mặc định.

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

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail, và dùng Tailscale Funnel cho điểm cuối push.

### Gateway tự khởi động

Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động `gog gmail watch serve` khi boot và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không dùng.

### Thiết lập thủ công một lần

<Steps>
  <Step title="Chọn dự án GCP">
    Chọn dự án GCP sở hữu ứng dụng khách OAuth được `gog` dùng:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Tạo chủ đề và cấp quyền truy cập push cho Gmail">
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
Ghi chú về ghi đè mô hình:

- `openclaw cron add|edit --model ...` thay đổi mô hình đã chọn của tác vụ.
- Nếu mô hình được cho phép, đúng nhà cung cấp/mô hình đó sẽ đến lượt chạy tác tử tách biệt.
- Nếu không được cho phép hoặc không thể phân giải, Cron làm lỗi lượt chạy với lỗi xác thực tường minh.
- Chuỗi dự phòng đã cấu hình vẫn áp dụng vì `--model` của Cron là giá trị chính của tác vụ, không phải ghi đè `/model` của phiên.
- Payload `fallbacks` thay thế dự phòng đã cấu hình cho tác vụ đó; `fallbacks: []` tắt dự phòng và khiến lượt chạy nghiêm ngặt.
- Một `--model` đơn thuần không có danh sách dự phòng tường minh hoặc đã cấu hình sẽ không rơi tiếp sang giá trị chính của tác tử như một đích thử lại bổ sung âm thầm.

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

`maxConcurrentRuns` giới hạn cả việc điều phối Cron đã lên lịch và thực thi lượt tác tử tách biệt. Các lượt tác tử Cron tách biệt dùng làn thực thi `cron-nested` chuyên dụng của hàng đợi ở bên trong, nên tăng giá trị này cho phép các lượt chạy LLM Cron độc lập tiến triển song song thay vì chỉ bắt đầu các trình bao Cron bên ngoài. Làn `nested` không phải Cron dùng chung không được mở rộng bởi cài đặt này.

Sidecar trạng thái runtime được suy ra từ `cron.store`: một kho `.json` như `~/clawd/cron/jobs.json` dùng `~/clawd/cron/jobs-state.json`, còn đường dẫn kho không có hậu tố `.json` sẽ thêm `-state.json`.

Nếu bạn chỉnh sửa thủ công `jobs.json`, hãy để `jobs-state.json` ngoài kiểm soát mã nguồn. OpenClaw dùng sidecar đó cho các vị trí đang chờ, dấu hiệu đang hoạt động, siêu dữ liệu lần chạy gần nhất, và danh tính lịch cho bộ lập lịch biết khi nào một tác vụ đã được chỉnh sửa từ bên ngoài cần `nextRunAtMs` mới.

Tắt Cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) được thử lại tối đa 3 lần với cơ chế lùi theo hàm mũ. Lỗi vĩnh viễn sẽ tắt ngay lập tức.

    **Thử lại định kỳ**: lùi theo hàm mũ (30 giây đến 60 phút) giữa các lần thử lại. Cơ chế lùi đặt lại sau lượt chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) dọn các mục phiên chạy tách biệt. `cron.runLog.maxBytes` / `cron.runLog.keepLines` tự động dọn các tệp nhật ký chạy.
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
  <Accordion title="Cron đã chạy nhưng không có lượt gửi">
    - Chế độ gửi `none` có nghĩa là không có lượt gửi dự phòng từ trình chạy. Agent vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến chat khả dụng.
    - Mục tiêu gửi bị thiếu/không hợp lệ (`channel`/`to`) có nghĩa là lượt gửi đi đã bị bỏ qua.
    - Với Matrix, các tác vụ được sao chép hoặc tác vụ cũ có ID phòng `delivery.to` bị chuyển thành chữ thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) có nghĩa là lượt gửi đã bị chặn bởi thông tin xác thực.
    - Nếu lần chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn lượt gửi đi trực tiếp và cũng chặn đường dẫn tóm tắt xếp hàng dự phòng, nên sẽ không có gì được đăng lại vào chat.
    - Nếu agent cần tự nhắn cho người dùng, hãy kiểm tra rằng tác vụ có tuyến khả dụng (`channel: "last"` với một chat trước đó, hoặc một kênh/mục tiêu rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn việc chuyển vòng /new-style">
    - Độ mới của đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lần chạy Heartbeat, thông báo exec và thao tác sổ sách của Gateway có thể cập nhật hàng phiên để phục vụ định tuyến/trạng thái, nhưng chúng không gia hạn `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi các trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ tiêu đề phiên JSONL của transcript khi tệp vẫn còn khả dụng. Các hàng nhàn rỗi cũ không có `lastInteractionAt` sử dụng thời điểm bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Các điểm dễ sai về múi giờ">
    - Cron không có `--tz` sẽ dùng múi giờ của máy chủ gateway.
    - Lịch `at` không có múi giờ được xem là UTC.
    - `activeHours` của Heartbeat sử dụng cách phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — toàn bộ cơ chế tự động hóa trong một cái nhìn tổng quan
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
