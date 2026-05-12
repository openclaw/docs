---
read_when:
    - Lên lịch các tác vụ nền hoặc lần đánh thức
    - Kết nối các trình kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Quyết định giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Scheduled tasks
summary: Các tác vụ đã lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-05-12T00:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó duy trì các công việc, đánh thức agent vào đúng thời điểm, và có thể chuyển đầu ra trở lại một kênh chat hoặc điểm cuối webhook.

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
  <Step title="Kiểm tra các công việc của bạn">
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

- Cron chạy **bên trong tiến trình Gateway** (không phải bên trong mô hình).
- Định nghĩa công việc được duy trì tại `~/.openclaw/cron/jobs.json` nên việc khởi động lại không làm mất lịch.
- Trạng thái thực thi khi chạy được duy trì bên cạnh trong `~/.openclaw/cron/jobs-state.json`. Nếu bạn theo dõi định nghĩa cron trong git, hãy theo dõi `jobs.json` và đưa `jobs-state.json` vào gitignore.
- Sau khi tách, các phiên bản OpenClaw cũ hơn có thể đọc `jobs.json` nhưng có thể coi các công việc là mới vì các trường runtime hiện nằm trong `jobs-state.json`.
- Khi `jobs.json` được chỉnh sửa trong lúc Gateway đang chạy hoặc đã dừng, OpenClaw so sánh các trường lịch đã thay đổi với siêu dữ liệu slot runtime đang chờ và xóa các giá trị `nextRunAtMs` đã cũ. Việc chỉ định dạng lại hoặc viết lại chỉ thay đổi thứ tự khóa sẽ giữ nguyên slot đang chờ.
- Tất cả các lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các công việc lượt agent cô lập đã quá hạn được lập lịch lại ra ngoài cửa sổ kết nối kênh thay vì phát lại ngay lập tức, để quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi nhanh sau khi khởi động lại.
- Các công việc một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron cô lập cố gắng tối đa để đóng các tab/tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại các tiến trình mồ côi.
- Các lần chạy cron cô lập nhận được quyền tự dọn dẹp cron phạm vi hẹp vẫn có thể đọc trạng thái bộ lập lịch, danh sách tự lọc của công việc hiện tại của chúng, và lịch sử chạy của công việc đó, để các kiểm tra trạng thái/Heartbeat có thể kiểm tra lịch của chính chúng mà không có quyền thay đổi cron rộng hơn.
- Các lần chạy cron cô lập cũng bảo vệ trước các phản hồi xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời (`on it`, `pulling everything together`, và các gợi ý tương tự) và không có lần chạy subagent con cháu nào vẫn chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron cô lập ưu tiên siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, sau đó dự phòng về các dấu mốc tóm tắt/đầu ra cuối cùng đã biết như `SYSTEM_RUN_DENIED` và `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là lần chạy xanh.
- Các lần chạy cron cô lập cũng coi lỗi agent ở cấp lần chạy là lỗi công việc ngay cả khi không tạo ra payload phản hồi, để lỗi mô hình/nhà cung cấp tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì đánh dấu công việc là thành công.
- Khi một công việc lượt agent cô lập đạt `timeoutSeconds`, cron hủy lần chạy agent bên dưới và cho nó một cửa sổ dọn dẹp ngắn. Nếu lần chạy không xả hết, dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat trong hàng đợi không bị kẹt sau một phiên xử lý đã cũ.
- Nếu một lượt agent cô lập bị đình trệ trước khi runner bắt đầu hoặc trước lệnh gọi mô hình đầu tiên, cron ghi nhận timeout theo từng pha như `setup timed out before runner start` hoặc `stalled before first model call (last phase: context-engine)`. Các watchdog này bao phủ các nhà cung cấp nhúng và nhà cung cấp dựa trên CLI trước khi tiến trình CLI bên ngoài của chúng thực sự được khởi động, và được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động nguội/xác thực/ngữ cảnh hiển thị nhanh thay vì chờ toàn bộ ngân sách công việc.

<a id="maintenance"></a>

<Note>
Điều hòa tác vụ cho cron trước hết thuộc sở hữu runtime, sau đó mới dựa vào lịch sử bền vững: một tác vụ cron đang hoạt động vẫn sống khi runtime cron vẫn theo dõi công việc đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu công việc và cửa sổ ân hạn 5 phút hết hạn, bảo trì kiểm tra nhật ký chạy đã duy trì và trạng thái công việc cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền vững đó cho thấy một kết quả kết thúc, sổ cái tác vụ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm toán CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không coi tập công việc đang hoạt động trong tiến trình rỗng của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI  | Mô tả                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian một lần (ISO 8601 hoặc tương đối như `20m`)    |
| `every` | `--every` | Khoảng thời gian cố định                                          |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được coi là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ treo tường cục bộ.

Các biểu thức lặp lại ở đầu giờ được tự động giãn lệch tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức cron được phân tích cú pháp bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp — không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5–6 lần mỗi tháng thay vì 0–1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của công việc.

## Kiểu thực thi

| Kiểu           | Giá trị `--session`   | Chạy trong                  | Phù hợp nhất cho                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Phiên chính    | `main`              | Lượt Heartbeat tiếp theo      | Lời nhắc, sự kiện hệ thống        |
| Cô lập        | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, việc nền      |
| Phiên hiện tại | `current`           | Được ràng buộc lúc tạo   | Công việc lặp lại có nhận biết ngữ cảnh    |
| Phiên tùy chỉnh  | `session:custom-id` | Phiên có tên bền vững | Quy trình công việc xây dựng dựa trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính so với cô lập so với tùy chỉnh">
    Công việc **phiên chính** xếp hàng một sự kiện hệ thống và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Các sự kiện hệ thống đó không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi cho phiên đích. Công việc **cô lập** chạy một lượt agent chuyên dụng với phiên mới. **Phiên tùy chỉnh** (`session:xxx`) duy trì ngữ cảnh qua các lần chạy, cho phép các quy trình công việc như standup hằng ngày xây dựng dựa trên các bản tóm tắt trước đó.
  </Accordion>
  <Accordion title="'Phiên mới' nghĩa là gì đối với công việc cô lập">
    Đối với công việc cô lập, "phiên mới" nghĩa là một transcript/id phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập suy nghĩ/nhanh/chi tiết, nhãn, và ghi đè mô hình/xác thực do người dùng chọn rõ ràng, nhưng không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc, hoặc liên kết runtime ACP. Dùng `current` hoặc `session:<id>` khi một công việc lặp lại cần chủ ý xây dựng trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Đối với công việc cô lập, teardown runtime hiện bao gồm dọn dẹp trình duyệt với nỗ lực tối đa cho phiên cron đó. Lỗi dọn dẹp bị bỏ qua để kết quả cron thực tế vẫn được ưu tiên.

    Các lần chạy cron cô lập cũng dispose mọi phiên bản runtime MCP đi kèm được tạo cho công việc thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách các client MCP của phiên chính và phiên tùy chỉnh được tháo dỡ, nên công việc cron cô lập không rò rỉ tiến trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Subagent và gửi qua Discord">
    Khi các lần chạy cron cô lập điều phối subagent, việc gửi cũng ưu tiên đầu ra con cháu cuối cùng hơn văn bản tạm thời của cha đã cũ. Nếu các con cháu vẫn đang chạy, OpenClaw chặn cập nhật cha một phần đó thay vì thông báo nó.

    Đối với mục tiêu thông báo Discord chỉ có văn bản, OpenClaw gửi văn bản assistant cuối cùng chuẩn một lần thay vì phát lại cả payload văn bản được stream/trung gian và câu trả lời cuối cùng. Payload Discord có media và có cấu trúc vẫn được gửi như các payload riêng để không làm rơi tệp đính kèm và thành phần.

  </Accordion>
</AccordionGroup>

### Tùy chọn payload cho công việc cô lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc cho cô lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; dùng mô hình được phép đã chọn cho công việc.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức suy nghĩ.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua chèn tệp bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn các công cụ mà công việc có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của công việc đó. Nó không giống với ghi đè `/model` của phiên chat: các chuỗi dự phòng đã cấu hình vẫn áp dụng khi mô hình chính của công việc thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm dự phòng về lựa chọn mô hình agent/mặc định của công việc.

Công việc Cron cũng có thể mang `fallbacks` cấp payload. Khi có, danh sách đó thay thế chuỗi dự phòng đã cấu hình cho công việc. Dùng `fallbacks: []` trong payload/API công việc khi bạn muốn một lần chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu một công việc có `--model` nhưng không có dự phòng ở payload hoặc đã cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của agent không được thêm vào như một mục tiêu thử lại phụ ẩn.

Thứ tự ưu tiên chọn mô hình cho công việc cô lập là:

1. Ghi đè mô hình hook Gmail (khi lần chạy đến từ Gmail và ghi đè đó được phép)
2. `model` theo payload từng công việc
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình agent/mặc định

Chế độ nhanh cũng đi theo lựa chọn trực tiếp đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập mặc định dùng giá trị đó. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng.

Nếu một lần chạy cô lập gặp bàn giao chuyển đổi mô hình trực tiếp, cron thử lại với nhà cung cấp/mô hình đã chuyển đổi và duy trì lựa chọn trực tiếp đó cho lần chạy đang hoạt động trước khi thử lại. Khi chuyển đổi cũng mang theo một hồ sơ xác thực mới, cron cũng duy trì ghi đè hồ sơ xác thực đó cho lần chạy đang hoạt động. Số lần thử lại được giới hạn: sau lần thử ban đầu cộng thêm 2 lần thử lại chuyển đổi, cron hủy thay vì lặp vô hạn.

Trước khi một lần chạy Cron cô lập đi vào agent runner, OpenClaw kiểm tra các endpoint nhà cung cấp cục bộ có thể truy cập cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là local loopback, mạng riêng hoặc `.local`. Nếu endpoint đó không hoạt động, lần chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả endpoint được lưu trong bộ nhớ đệm 5 phút, vì vậy nhiều công việc đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang hoặc LM Studio cục bộ không hoạt động sẽ chia sẻ một phép dò nhỏ thay vì tạo ra một cơn bão yêu cầu. Các lần chạy bị bỏ qua do kiểm tra trước nhà cung cấp không làm tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn nhận thông báo bỏ qua lặp lại.

## Phân phối và đầu ra

| Chế độ     | Điều xảy ra                                                               |
| ---------- | ------------------------------------------------------------------------- |
| `announce` | Phân phối dự phòng văn bản cuối cùng đến mục tiêu nếu agent chưa gửi      |
| `webhook`  | POST payload sự kiện đã hoàn tất đến một URL                              |
| `none`     | Không có phân phối dự phòng từ runner                                     |

Dùng `--announce --channel telegram --to "-1001234567890"` để phân phối đến kênh. Với các chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; các trình gọi RPC/cấu hình trực tiếp cũng có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Mục tiêu Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng đúng ID phòng hoặc dạng `room:!room:server` từ Matrix.

Khi phân phối announce dùng `channel: "last"` hoặc bỏ qua `channel`, một mục tiêu có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi Cron chuyển dự phòng sang lịch sử phiên hoặc một kênh đã cấu hình duy nhất. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được khai báo rõ ràng, tiền tố mục tiêu phải đặt tên cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối thay vì để WhatsApp diễn giải ID Telegram như một số điện thoại. Các tiền tố loại mục tiêu và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>` và `sms:<number>` vẫn là cú pháp mục tiêu do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Với các công việc cô lập, phân phối chat được chia sẻ. Nếu có tuyến chat khả dụng, agent có thể dùng công cụ `message` ngay cả khi công việc dùng `--no-deliver`. Nếu agent gửi đến mục tiêu đã cấu hình/hiện tại, OpenClaw sẽ bỏ qua announce dự phòng. Nếu không, `announce`, `webhook` và `none` chỉ kiểm soát runner xử lý phản hồi cuối cùng sau lượt agent như thế nào.

Khi agent tạo một nhắc việc cô lập từ một chat đang hoạt động, OpenClaw lưu mục tiêu phân phối trực tiếp đã giữ lại cho tuyến announce dự phòng. Khóa phiên nội bộ có thể là chữ thường; mục tiêu phân phối nhà cung cấp không được dựng lại từ các khóa đó khi có ngữ cảnh chat hiện tại.

Phân phối announce ngầm định dùng allowlist kênh đã cấu hình để xác thực và định tuyến lại các mục tiêu cũ. Các phê duyệt từ kho ghép cặp DM không phải là người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một công việc đã lên lịch cần chủ động gửi đến DM.

Thông báo lỗi đi theo một đường dẫn đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè giá trị đó theo từng công việc.
- Nếu cả hai đều chưa được đặt và công việc đã phân phối qua `announce`, thông báo lỗi giờ đây sẽ dự phòng về mục tiêu announce chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các công việc `sessionTarget="isolated"` trừ khi chế độ phân phối chính là `webhook`.
- `failureAlert.includeSkipped: true` cho phép một công việc hoặc chính sách cảnh báo Cron toàn cục nhận cảnh báo lặp lại về các lần chạy bị bỏ qua. Các lần chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến backoff lỗi thực thi.

## Ví dụ CLI

<Tabs>
  <Tab title="Nhắc việc một lần">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Công việc cô lập lặp lại">
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

Gateway có thể phơi bày các endpoint Webhook HTTP cho trình kích hoạt bên ngoài. Bật trong cấu hình:

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
  <Accordion title="Hook được ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Ánh xạ có thể chuyển đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng template hoặc biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các endpoint hook phía sau local loopback, tailnet hoặc reverse proxy đáng tin cậy.

- Dùng một token hook chuyên dụng; không dùng lại token xác thực Gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn định tuyến `agentId` rõ ràng.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do trình gọi chọn.
- Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để ràng buộc dạng khóa phiên được phép.
- Payload hook được bọc bằng các ranh giới an toàn theo mặc định.

</Warning>

## Tích hợp Gmail PubSub

Kết nối trình kích hoạt hộp thư đến Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw đã bật, Tailscale cho endpoint HTTPS công khai.
</Note>

### Thiết lập bằng wizard (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail và dùng Tailscale Funnel cho endpoint push.

### Tự động khởi động Gateway

Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động `gog gmail watch serve` khi boot và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để chọn không dùng.

### Thiết lập thủ công một lần

<Steps>
  <Step title="Chọn dự án GCP">
    Chọn dự án GCP sở hữu client OAuth được `gog` sử dụng:

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

## Quản lý công việc

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

- `openclaw cron add|edit --model ...` thay đổi mô hình đã chọn của công việc.
- Nếu mô hình được cho phép, đúng nhà cung cấp/mô hình đó sẽ đến được lần chạy agent cô lập.
- Nếu mô hình không được cho phép hoặc không thể phân giải, Cron làm lần chạy thất bại với lỗi xác thực rõ ràng.
- Các chuỗi dự phòng đã cấu hình vẫn áp dụng vì `--model` của Cron là mô hình chính của công việc, không phải ghi đè `/model` của phiên.
- Payload `fallbacks` thay thế các dự phòng đã cấu hình cho công việc đó; `fallbacks: []` tắt dự phòng và khiến lần chạy trở nên nghiêm ngặt.
- Một `--model` thuần túy không có danh sách dự phòng rõ ràng hoặc đã cấu hình sẽ không tự chuyển xuống mô hình chính của agent như một mục tiêu thử lại bổ sung im lặng.

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

`maxConcurrentRuns` giới hạn cả việc điều phối Cron đã lên lịch lẫn thực thi lượt agent cô lập. Các lượt agent Cron cô lập dùng nội bộ làn thực thi `cron-nested` chuyên dụng của hàng đợi, nên tăng giá trị này cho phép các lần chạy LLM Cron độc lập tiến triển song song thay vì chỉ khởi động các wrapper Cron bên ngoài của chúng. Làn `nested` không phải Cron dùng chung không được mở rộng bởi thiết lập này.

Sidecar trạng thái runtime được suy ra từ `cron.store`: một kho `.json` như `~/clawd/cron/jobs.json` dùng `~/clawd/cron/jobs-state.json`, còn đường dẫn kho không có hậu tố `.json` sẽ nối thêm `-state.json`.

Nếu bạn chỉnh sửa thủ công `jobs.json`, hãy để `jobs-state.json` ngoài hệ thống quản lý mã nguồn. OpenClaw dùng sidecar đó cho các slot đang chờ, dấu hiệu đang hoạt động, metadata lần chạy gần nhất và danh tính lịch cho bộ lập lịch biết khi một công việc đã được chỉnh sửa bên ngoài cần một `nextRunAtMs` mới.

Tắt Cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn tắt ngay lập tức.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lần chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (mặc định `24h`) dọn bớt các mục phiên chạy cô lập. `cron.runLog.maxBytes` / `cron.runLog.keepLines` tự động dọn bớt các tệp nhật ký chạy.
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
  <Accordion title="Cron not firing">
    - Kiểm tra biến môi trường `cron.enabled` và `OPENCLAW_SKIP_CRON`.
    - Xác nhận Gateway đang chạy liên tục.
    - Với lịch `cron`, hãy xác minh múi giờ (`--tz`) so với múi giờ của máy chủ.
    - `reason: not-due` trong đầu ra chạy nghĩa là lần chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và công việc chưa đến hạn.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Chế độ gửi `none` nghĩa là không kỳ vọng runner gửi dự phòng. Agent vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
    - Thiếu hoặc không hợp lệ mục tiêu gửi (`channel`/`to`) nghĩa là gửi đi đã bị bỏ qua.
    - Với Matrix, các công việc được sao chép hoặc cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa công việc thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là việc gửi bị chặn bởi thông tin xác thực.
    - Nếu lần chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn gửi trực tiếp ra ngoài và cũng chặn đường dẫn tóm tắt xếp hàng dự phòng, nên sẽ không có gì được đăng lại vào trò chuyện.
    - Nếu agent cần tự nhắn tin cho người dùng, hãy kiểm tra rằng công việc có tuyến dùng được (`channel: "last"` với một cuộc trò chuyện trước đó, hoặc một kênh/mục tiêu rõ ràng).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - Độ mới của đặt lại hằng ngày và khi rảnh không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lần chạy heartbeat, thông báo exec và ghi sổ Gateway có thể cập nhật hàng phiên để định tuyến/trạng thái, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi các trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ phần đầu phiên transcript JSONL khi tệp vẫn còn sẵn có. Các hàng rảnh cũ không có `lastInteractionAt` dùng thời điểm bắt đầu được khôi phục đó làm mốc rảnh.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron không có `--tz` dùng múi giờ của máy chủ gateway.
    - Lịch `at` không có múi giờ được xem là UTC.
    - Heartbeat `activeHours` dùng cơ chế phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa](/vi/automation) — tất cả cơ chế tự động hóa trong một cái nhìn tổng quan
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
