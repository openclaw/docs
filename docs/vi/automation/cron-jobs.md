---
read_when:
    - Lên lịch các tác vụ nền hoặc lần đánh thức
    - Kết nối các tác nhân kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Tác vụ được lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-05-07T01:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu trữ các job lâu bền, đánh thức tác nhân vào đúng thời điểm và có thể gửi đầu ra trở lại một kênh trò chuyện hoặc điểm cuối Webhook.

## Bắt đầu nhanh

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cách cron hoạt động

- Cron chạy **bên trong tiến trình Gateway** (không chạy bên trong mô hình).
- Định nghĩa job được lưu lâu bền tại `~/.openclaw/cron/jobs.json` để các lần khởi động lại không làm mất lịch.
- Trạng thái thực thi runtime được lưu cạnh đó trong `~/.openclaw/cron/jobs-state.json`. Nếu bạn theo dõi định nghĩa cron trong git, hãy theo dõi `jobs.json` và đưa `jobs-state.json` vào gitignore.
- Sau khi tách ra, các phiên bản OpenClaw cũ hơn có thể đọc `jobs.json` nhưng có thể coi job là mới vì các trường runtime hiện nằm trong `jobs-state.json`.
- Khi `jobs.json` được chỉnh sửa trong lúc Gateway đang chạy hoặc đã dừng, OpenClaw so sánh các trường lịch đã thay đổi với siêu dữ liệu slot runtime đang chờ và xóa các giá trị `nextRunAtMs` đã lỗi thời. Các lần viết lại chỉ thay đổi định dạng hoặc thứ tự khóa vẫn giữ nguyên slot đang chờ.
- Tất cả lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các job lượt tác nhân cô lập đã quá hạn được lập lịch lại ra ngoài khoảng kết nối kênh thay vì phát lại ngay lập tức, nhờ đó quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi tốt sau khi khởi động lại.
- Job chạy một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron cô lập cố gắng đóng các tab/quy trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại quy trình mồ côi.
- Các lần chạy cron cô lập nhận được quyền tự dọn dẹp cron hẹp vẫn có thể đọc trạng thái bộ lập lịch và danh sách tự lọc của job hiện tại của chúng, để kiểm tra trạng thái/Heartbeat có thể xem lịch của chính chúng mà không có quyền thay đổi cron rộng hơn.
- Các lần chạy cron cô lập cũng bảo vệ khỏi phản hồi xác nhận lỗi thời. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không có lần chạy tác nhân con nào vẫn chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron cô lập ưu tiên siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, rồi quay về các dấu hiệu tóm tắt/đầu ra cuối đã biết như `SYSTEM_RUN_DENIED` và `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là lượt chạy thành công.
- Các lần chạy cron cô lập cũng coi lỗi tác nhân cấp lượt chạy là lỗi job ngay cả khi không tạo payload phản hồi, để lỗi mô hình/nhà cung cấp làm tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì xóa job như thể đã thành công.
- Khi một job lượt tác nhân cô lập đạt `timeoutSeconds`, cron hủy lần chạy tác nhân bên dưới và cho nó một khoảng ngắn để dọn dẹp. Nếu lần chạy không thoát hết, quá trình dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc trò chuyện trong hàng đợi không bị kẹt sau một phiên xử lý đã lỗi thời.

<a id="maintenance"></a>

<Note>
Đối soát tác vụ cho cron trước hết thuộc sở hữu runtime, sau đó được hỗ trợ bởi lịch sử lâu bền: một tác vụ cron đang hoạt động vẫn tồn tại trong khi runtime cron vẫn theo dõi job đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu job và cửa sổ gia hạn 5 phút hết hạn, các kiểm tra bảo trì sẽ xem nhật ký lần chạy đã lưu và trạng thái job cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử lâu bền đó cho thấy một kết quả kết thúc, sổ cái tác vụ sẽ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm toán CLI ngoại tuyến có thể khôi phục từ lịch sử lâu bền, nhưng nó không coi tập job đang hoạt động trong tiến trình rỗng của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Kiểu lịch

| Loại    | Cờ CLI   | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng thời gian cố định                                |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được xử lý là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ địa phương.

Các biểu thức lặp lại vào đầu giờ được tự động rải lệch tối đa 5 phút để giảm đỉnh tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức cron được phân tích bằng [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp — không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5–6 lần mỗi tháng thay vì 0–1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của job.

## Kiểu thực thi

| Kiểu            | Giá trị `--session` | Chạy trong              | Phù hợp nhất cho              |
| --------------- | ------------------- | ------------------------ | ----------------------------- |
| Phiên chính     | `main`              | Lượt Heartbeat kế tiếp   | Nhắc việc, sự kiện hệ thống   |
| Cô lập          | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, việc nền             |
| Phiên hiện tại  | `current`           | Ràng buộc tại thời điểm tạo | Công việc lặp lại có nhận biết ngữ cảnh |
| Phiên tùy chỉnh | `session:custom-id` | Phiên đặt tên lâu bền    | Quy trình công việc xây dựng trên lịch sử |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Job **phiên chính** đưa một sự kiện hệ thống vào hàng đợi và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Các sự kiện hệ thống đó không kéo dài độ mới của đặt lại hằng ngày/khi nhàn rỗi cho phiên đích. Job **cô lập** chạy một lượt tác nhân chuyên dụng với phiên mới. **Phiên tùy chỉnh** (`session:xxx`) duy trì ngữ cảnh qua các lần chạy, cho phép các quy trình công việc như standup hằng ngày xây dựng dựa trên các bản tóm tắt trước đó.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Với job cô lập, "phiên mới" nghĩa là một transcript/id phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập suy nghĩ/nhanh/chi tiết, nhãn và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng, nhưng không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc hoặc ràng buộc runtime ACP. Dùng `current` hoặc `session:<id>` khi một job lặp lại được chủ ý xây dựng trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Với job cô lập, quá trình tháo dỡ runtime hiện bao gồm dọn dẹp trình duyệt theo nỗ lực tốt nhất cho phiên cron đó. Lỗi dọn dẹp được bỏ qua để kết quả cron thực tế vẫn quyết định.

    Các lần chạy cron cô lập cũng giải phóng mọi phiên bản runtime MCP đóng gói được tạo cho job thông qua đường dọn dẹp runtime dùng chung. Điều này khớp với cách các máy khách MCP của phiên chính và phiên tùy chỉnh được tháo dỡ, để job cron cô lập không rò rỉ quy trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Khi các lần chạy cron cô lập điều phối các tác nhân con, việc gửi cũng ưu tiên đầu ra cuối cùng của hậu duệ hơn văn bản tạm thời lỗi thời của cha. Nếu hậu duệ vẫn đang chạy, OpenClaw sẽ chặn cập nhật cha một phần đó thay vì thông báo nó.

    Với mục tiêu thông báo Discord chỉ văn bản, OpenClaw gửi văn bản trợ lý cuối cùng chuẩn một lần thay vì phát lại cả payload văn bản được stream/trung gian và câu trả lời cuối cùng. Payload Discord dạng phương tiện và có cấu trúc vẫn được gửi dưới dạng payload riêng để tệp đính kèm và thành phần không bị bỏ.

  </Accordion>
</AccordionGroup>

### Tùy chọn payload cho job cô lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc cho cô lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; dùng mô hình được phép đã chọn cho job.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức suy nghĩ.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua việc chèn tệp bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Hạn chế các công cụ job có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của job đó. Nó không giống ghi đè `/model` của phiên trò chuyện: các chuỗi dự phòng đã cấu hình vẫn áp dụng khi mô hình chính của job thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm quay về lựa chọn mô hình tác nhân/mặc định của job.

Nếu các mục `jobs.json` cũ hơn hoặc được chỉnh tay lưu `payload.model` là `"default"`, `"null"`, chuỗi trống hoặc JSON `null`, hãy chạy `openclaw doctor --fix`. Doctor xóa các sentinel ghi đè đã lưu không hợp lệ đó; runtime không hỗ trợ chúng làm bí danh dự phòng. Bỏ qua trường mô hình để dùng lựa chọn mô hình tác nhân/mặc định thông thường.

Job Cron cũng có thể mang `fallbacks` cấp payload. Khi có mặt, danh sách đó thay thế chuỗi dự phòng đã cấu hình cho job. Dùng `fallbacks: []` trong payload/API của job khi bạn muốn một lần chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu một job có `--model` nhưng không có dự phòng payload hoặc dự phòng đã cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của tác nhân không được thêm làm mục tiêu thử lại ẩn.

Thứ tự ưu tiên chọn mô hình cho job cô lập là:

1. Ghi đè mô hình hook Gmail (khi lần chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong payload của từng job
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình tác nhân/mặc định

Chế độ nhanh cũng đi theo lựa chọn trực tiếp đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập mặc định dùng cấu hình đó. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng.

Nếu một lần chạy cô lập gặp bàn giao chuyển đổi mô hình trực tiếp, cron thử lại với nhà cung cấp/mô hình đã chuyển đổi và lưu lâu bền lựa chọn trực tiếp đó cho lần chạy đang hoạt động trước khi thử lại. Khi chuyển đổi cũng mang theo một hồ sơ xác thực mới, cron cũng lưu lâu bền ghi đè hồ sơ xác thực đó cho lần chạy đang hoạt động. Số lần thử lại có giới hạn: sau lần thử ban đầu cộng với 2 lần thử lại chuyển đổi, cron hủy thay vì lặp mãi mãi.

Trước khi một lần chạy cron cô lập đi vào trình chạy tác nhân, OpenClaw kiểm tra các điểm cuối nhà cung cấp cục bộ có thể truy cập cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình mà `baseUrl` là local loopback, mạng riêng hoặc `.local`. Nếu điểm cuối đó ngừng hoạt động, lần chạy được ghi là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả điểm cuối được lưu đệm trong 5 phút, nên nhiều job đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang hoặc LM Studio cục bộ đã chết sẽ dùng chung một phép thăm dò nhỏ thay vì tạo bão yêu cầu. Các lần chạy bị bỏ qua do kiểm tra trước nhà cung cấp không làm tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn thông báo bỏ qua lặp lại.

## Gửi và đầu ra

| Chế độ    | Điều xảy ra                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `announce` | Gửi dự phòng văn bản cuối cùng đến đích nếu agent chưa gửi                  |
| `webhook`  | POST payload sự kiện đã hoàn tất đến một URL                                |
| `none`     | Không có phân phối dự phòng của trình chạy                                  |

Dùng `--announce --channel telegram --to "-1001234567890"` để phân phối qua kênh. Với các chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; các trình gọi RPC/cấu hình trực tiếp cũng có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Các đích Slack/Discord/Mattermost nên dùng tiền tố tường minh (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng ID phòng chính xác hoặc dạng `room:!room:server` từ Matrix.

Khi phân phối announce dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron quay về lịch sử phiên hoặc một kênh đã cấu hình duy nhất. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` là tường minh, tiền tố đích phải đặt tên cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối thay vì để WhatsApp diễn giải ID Telegram như một số điện thoại. Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Với các tác vụ tách biệt, phân phối trò chuyện được chia sẻ. Nếu có tuyến trò chuyện, agent có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu agent gửi đến đích đã cấu hình/hiện tại, OpenClaw bỏ qua announce dự phòng. Nếu không, `announce`, `webhook`, và `none` chỉ kiểm soát cách trình chạy xử lý phản hồi cuối cùng sau lượt agent.

Khi agent tạo một lời nhắc tách biệt từ một cuộc trò chuyện đang hoạt động, OpenClaw lưu đích phân phối trực tiếp được bảo toàn cho tuyến announce dự phòng. Khóa phiên nội bộ có thể là chữ thường; đích phân phối của nhà cung cấp không được tái tạo từ các khóa đó khi ngữ cảnh trò chuyện hiện tại có sẵn.

Phân phối announce ngầm định dùng danh sách cho phép của kênh đã cấu hình để xác thực và định tuyến lại các đích cũ. Các phê duyệt từ kho ghép cặp DM không phải là người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi đến DM.

Thông báo lỗi đi theo một đường dẫn đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè thiết lập đó cho từng tác vụ.
- Nếu cả hai đều chưa được đặt và tác vụ đã phân phối qua `announce`, thông báo lỗi hiện quay về đích announce chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các tác vụ `sessionTarget="isolated"` trừ khi chế độ phân phối chính là `webhook`.
- `failureAlert.includeSkipped: true` đưa chính sách cảnh báo cron toàn cục hoặc của tác vụ vào các cảnh báo lần chạy bị bỏ qua lặp lại. Các lần chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến backoff lỗi thực thi.

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

Gateway có thể cung cấp các điểm cuối HTTP Webhook cho trình kích hoạt bên ngoài. Bật trong cấu hình:

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

Mọi yêu cầu phải bao gồm mã thông báo hook qua header:

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
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Ánh xạ có thể biến đổi payload bất kỳ thành hành động `wake` hoặc `agent` bằng mẫu hoặc phép biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các điểm cuối hook phía sau loopback, tailnet, hoặc proxy đảo ngược đáng tin cậy.

- Dùng mã thông báo hook chuyên dụng; không dùng lại mã thông báo xác thực gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn định tuyến `agentId` tường minh.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do trình gọi chọn.
- Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để ràng buộc các dạng khóa phiên được phép.
- Payload hook được bao bọc bằng ranh giới an toàn theo mặc định.

</Warning>

## Tích hợp Gmail PubSub

Nối trình kích hoạt hộp thư đến Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw đã bật, Tailscale cho điểm cuối HTTPS công khai.
</Note>

### Thiết lập bằng trình hướng dẫn (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail, và dùng Tailscale Funnel cho điểm cuối push.

### Tự khởi động Gateway

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
Ghi chú ghi đè mô hình:

- `openclaw cron add|edit --model ...` thay đổi mô hình đã chọn của tác vụ.
- Nếu mô hình được cho phép, đúng nhà cung cấp/mô hình đó sẽ đến lượt chạy agent tách biệt.
- Nếu không được cho phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực tường minh.
- Các chuỗi dự phòng đã cấu hình vẫn áp dụng vì `--model` của cron là mô hình chính của tác vụ, không phải ghi đè `/model` của phiên.
- Payload `fallbacks` thay thế các dự phòng đã cấu hình cho tác vụ đó; `fallbacks: []` tắt dự phòng và khiến lần chạy nghiêm ngặt.
- Một `--model` thuần túy không có danh sách dự phòng tường minh hoặc đã cấu hình sẽ không rơi qua mô hình chính của agent như một đích thử lại bổ sung âm thầm.

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

`maxConcurrentRuns` giới hạn cả việc điều phối cron theo lịch và thực thi lượt agent tách biệt. Các lượt agent cron tách biệt dùng nội bộ làn thực thi `cron-nested` chuyên dụng của hàng đợi, nên việc tăng giá trị này cho phép các lần chạy LLM cron độc lập tiến triển song song thay vì chỉ khởi động các wrapper cron bên ngoài của chúng. Làn `nested` không thuộc cron dùng chung không được mở rộng bởi thiết lập này.

Sidecar trạng thái runtime được dẫn xuất từ `cron.store`: một kho `.json` như `~/clawd/cron/jobs.json` dùng `~/clawd/cron/jobs-state.json`, trong khi đường dẫn kho không có hậu tố `.json` sẽ nối thêm `-state.json`.

Nếu bạn chỉnh sửa thủ công `jobs.json`, hãy để `jobs-state.json` ngoài kiểm soát mã nguồn. OpenClaw dùng sidecar đó cho slot đang chờ, marker đang hoạt động, siêu dữ liệu lần chạy gần nhất, và định danh lịch cho bộ lập lịch biết khi nào một tác vụ được chỉnh sửa bên ngoài cần `nextRunAtMs` mới.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn bị tắt ngay.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lần chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) cắt tỉa các mục phiên chạy tách biệt. `cron.runLog.maxBytes` / `cron.runLog.keepLines` tự động cắt tỉa các tệp nhật ký chạy.
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
    - `reason: not-due` trong đầu ra lần chạy nghĩa là lần chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và tác vụ chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không có chuyển phát">
    - Chế độ chuyển phát `none` nghĩa là không kỳ vọng runner gửi dự phòng. Agent vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
    - Thiếu/không hợp lệ mục tiêu chuyển phát (`channel`/`to`) nghĩa là đầu ra đã bị bỏ qua.
    - Với Matrix, các tác vụ được sao chép hoặc cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là chuyển phát đã bị chặn bởi thông tin xác thực.
    - Nếu lượt chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn chuyển phát đầu ra trực tiếp và cũng chặn đường dẫn tóm tắt dự phòng được xếp hàng, nên sẽ không có gì được đăng lại vào cuộc trò chuyện.
    - Nếu agent cần tự nhắn tin cho người dùng, hãy kiểm tra rằng tác vụ có tuyến dùng được (`channel: "last"` với một cuộc trò chuyện trước đó, hoặc một kênh/mục tiêu rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn rollover /new-style">
    - Độ mới của đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lượt chạy Heartbeat, thông báo thực thi và sổ sách Gateway có thể cập nhật hàng phiên cho định tuyến/trạng thái, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi những trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ header phiên JSONL của bản ghi khi tệp vẫn còn có sẵn. Các hàng nhàn rỗi cũ không có `lastInteractionAt` sử dụng thời gian bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Các điểm dễ nhầm về múi giờ">
    - Cron không có `--tz` sử dụng múi giờ của máy chủ Gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - `activeHours` của Heartbeat sử dụng cách phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — tất cả cơ chế tự động hóa trong một cái nhìn tổng quan
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
