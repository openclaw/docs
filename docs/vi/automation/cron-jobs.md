---
read_when:
    - Lên lịch tác vụ nền hoặc sự kiện đánh thức
    - Kết nối các trình kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Chọn giữa Heartbeat và Cron cho các tác vụ được lên lịch
sidebarTitle: Scheduled tasks
summary: Tác vụ đã lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-05-06T17:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu giữ công việc, đánh thức tác nhân vào đúng thời điểm và có thể gửi đầu ra trở lại kênh trò chuyện hoặc điểm cuối webhook.

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
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Xem lịch sử chạy">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron hoạt động như thế nào

- Cron chạy **bên trong tiến trình Gateway** (không phải bên trong mô hình).
- Định nghĩa công việc được lưu giữ tại `~/.openclaw/cron/jobs.json` nên việc khởi động lại sẽ không làm mất lịch.
- Trạng thái thực thi runtime được lưu giữ bên cạnh tại `~/.openclaw/cron/jobs-state.json`. Nếu bạn theo dõi định nghĩa cron trong git, hãy theo dõi `jobs.json` và gitignore `jobs-state.json`.
- Sau khi tách, các phiên bản OpenClaw cũ hơn có thể đọc `jobs.json` nhưng có thể xem công việc là mới vì các trường runtime hiện nằm trong `jobs-state.json`.
- Khi `jobs.json` được chỉnh sửa trong lúc Gateway đang chạy hoặc đã dừng, OpenClaw so sánh các trường lịch đã thay đổi với siêu dữ liệu khe runtime đang chờ xử lý và xóa các giá trị `nextRunAtMs` đã lỗi thời. Các lần ghi lại chỉ thay đổi định dạng hoặc thứ tự khóa sẽ giữ nguyên khe đang chờ.
- Tất cả lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các công việc lượt tác nhân cô lập bị quá hạn được lập lịch lại ra ngoài cửa sổ kết nối kênh thay vì phát lại ngay lập tức, nên quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi tốt sau khi khởi động lại.
- Công việc một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron cô lập sẽ cố gắng đóng các tab/trình duyệt/quy trình được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại các quy trình mồ côi.
- Các lần chạy cron cô lập nhận được quyền tự dọn dẹp cron hẹp vẫn có thể đọc trạng thái bộ lập lịch và danh sách tự lọc của công việc hiện tại của chúng, nên các kiểm tra trạng thái/Heartbeat có thể kiểm tra lịch của chính chúng mà không có quyền rộng hơn để thay đổi cron.
- Các lần chạy cron cô lập cũng bảo vệ khỏi các phản hồi xác nhận đã lỗi thời. Nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không còn lần chạy tác nhân con nào chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron cô lập ưu tiên siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, sau đó dự phòng về các dấu mốc tóm tắt/đầu ra cuối cùng đã biết như `SYSTEM_RUN_DENIED` và `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là lần chạy thành công.
- Các lần chạy cron cô lập cũng xem lỗi tác nhân cấp lần chạy là lỗi công việc ngay cả khi không tạo tải phản hồi, nên lỗi mô hình/nhà cung cấp sẽ tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì xóa công việc như đã thành công.
- Khi một công việc lượt tác nhân cô lập đạt `timeoutSeconds`, cron hủy lần chạy tác nhân bên dưới và cho nó một khoảng thời gian dọn dẹp ngắn. Nếu lần chạy không thoát hết, quá trình dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận thời gian chờ, nên công việc trò chuyện đang xếp hàng không bị kẹt sau một phiên xử lý lỗi thời.

<a id="maintenance"></a>

<Note>
Đối soát tác vụ cho cron trước hết thuộc sở hữu runtime, sau đó dựa trên lịch sử bền vững: một tác vụ cron đang hoạt động vẫn sống khi runtime cron vẫn theo dõi công việc đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu công việc và cửa sổ gia hạn 5 phút hết hạn, bảo trì sẽ kiểm tra nhật ký chạy được lưu giữ và trạng thái công việc cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền vững đó cho thấy kết quả cuối, sổ cái tác vụ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm tra CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không xem tập công việc đang hoạt động trong tiến trình trống của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI  | Mô tả                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian một lần (ISO 8601 hoặc tương đối như `20m`)    |
| `every` | `--every` | Khoảng thời gian cố định                                          |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được xem là UTC. Thêm `--tz America/New_York` để lập lịch theo đồng hồ địa phương.

Các biểu thức lặp lại ở đầu giờ được tự động rải lệch tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức Cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp — không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5-6 lần mỗi tháng thay vì 0-1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của công việc.

## Kiểu thực thi

| Kiểu           | Giá trị `--session`   | Chạy trong                  | Phù hợp nhất cho                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Phiên chính    | `main`              | Lượt Heartbeat tiếp theo      | Lời nhắc, sự kiện hệ thống        |
| Cô lập        | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, việc nền      |
| Phiên hiện tại | `current`           | Được ràng buộc tại thời điểm tạo   | Công việc lặp lại nhận biết ngữ cảnh    |
| Phiên tùy chỉnh  | `session:custom-id` | Phiên đặt tên bền vững | Quy trình công việc xây dựng dựa trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính so với cô lập so với tùy chỉnh">
    Công việc **phiên chính** đưa một sự kiện hệ thống vào hàng đợi và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Các sự kiện hệ thống đó không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi cho phiên đích. Công việc **cô lập** chạy một lượt tác nhân chuyên dụng với phiên mới. **Phiên tùy chỉnh** (`session:xxx`) lưu giữ ngữ cảnh qua các lần chạy, cho phép các quy trình công việc như họp đứng hằng ngày xây dựng dựa trên các bản tóm tắt trước đó.
  </Accordion>
  <Accordion title="'Phiên mới' nghĩa là gì với công việc cô lập">
    Với công việc cô lập, "phiên mới" nghĩa là một bản ghi hội thoại/id phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như thiết lập thinking/fast/verbose, nhãn và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng, nhưng không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc hoặc ràng buộc runtime ACP. Dùng `current` hoặc `session:<id>` khi một công việc lặp lại cần chủ ý xây dựng trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Với công việc cô lập, tháo dỡ runtime hiện bao gồm dọn dẹp trình duyệt theo best-effort cho phiên cron đó. Lỗi dọn dẹp bị bỏ qua để kết quả cron thực tế vẫn được ưu tiên.

    Các lần chạy cron cô lập cũng hủy mọi phiên bản runtime MCP đi kèm được tạo cho công việc thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách các máy khách MCP phiên chính và phiên tùy chỉnh được tháo dỡ, nên công việc cron cô lập không rò rỉ quy trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Tác nhân con và gửi qua Discord">
    Khi các lần chạy cron cô lập điều phối tác nhân con, việc gửi cũng ưu tiên đầu ra cuối cùng của hậu duệ hơn văn bản tạm thời lỗi thời của cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw chặn bản cập nhật cha một phần đó thay vì công bố nó.

    Với các đích thông báo Discord chỉ văn bản, OpenClaw gửi văn bản trợ lý cuối cùng chuẩn một lần thay vì phát lại cả tải văn bản được phát trực tuyến/trung gian và câu trả lời cuối cùng. Tải Discord có phương tiện và có cấu trúc vẫn được gửi dưới dạng các tải riêng để tệp đính kèm và thành phần không bị bỏ.

  </Accordion>
</AccordionGroup>

### Tùy chọn tải cho công việc cô lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc cho cô lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; dùng mô hình được phép đã chọn cho công việc.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua chèn tệp khởi tạo workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn công cụ mà công việc có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của công việc đó. Nó không giống ghi đè `/model` của phiên trò chuyện: các chuỗi dự phòng đã cấu hình vẫn áp dụng khi mô hình chính của công việc thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm dự phòng về lựa chọn mô hình của tác nhân/mặc định của công việc.

Công việc Cron cũng có thể mang `fallbacks` cấp tải. Khi có, danh sách đó thay thế chuỗi dự phòng đã cấu hình cho công việc. Dùng `fallbacks: []` trong tải/API công việc khi bạn muốn một lần chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu một công việc có `--model` nhưng không có dự phòng trong tải hoặc cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của tác nhân không được nối thêm như một mục tiêu thử lại ẩn.

Thứ tự ưu tiên chọn mô hình cho công việc cô lập là:

1. Ghi đè mô hình hook Gmail (khi lần chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong tải theo từng công việc
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình tác nhân/mặc định

Chế độ nhanh cũng theo lựa chọn trực tiếp đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập dùng giá trị đó theo mặc định. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng.

Nếu một lần chạy cô lập gặp chuyển giao đổi mô hình trực tiếp, cron thử lại với nhà cung cấp/mô hình đã chuyển và lưu giữ lựa chọn trực tiếp đó cho lần chạy đang hoạt động trước khi thử lại. Khi lần chuyển cũng mang hồ sơ xác thực mới, cron cũng lưu giữ ghi đè hồ sơ xác thực đó cho lần chạy đang hoạt động. Số lần thử lại có giới hạn: sau lần thử ban đầu cộng thêm 2 lần thử lại đổi, cron hủy thay vì lặp mãi.

Trước khi một lần chạy cron cô lập đi vào trình chạy tác nhân, OpenClaw kiểm tra các điểm cuối nhà cung cấp cục bộ có thể truy cập cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là loopback, mạng riêng hoặc `.local`. Nếu điểm cuối đó ngừng hoạt động, lần chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả điểm cuối được lưu bộ nhớ đệm trong 5 phút, nên nhiều công việc đến hạn dùng cùng máy chủ Ollama, vLLM, SGLang hoặc LM Studio cục bộ đã chết sẽ chia sẻ một lần thăm dò nhỏ thay vì tạo bão yêu cầu. Các lần chạy bị bỏ qua do kiểm tra trước nhà cung cấp không tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn thông báo bỏ qua lặp lại.

## Gửi và đầu ra

| Chế độ       | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Gửi dự phòng văn bản cuối cùng tới đích nếu tác nhân chưa gửi |
| `webhook`  | POST tải sự kiện đã hoàn tất tới một URL                                |
| `none`     | Không có gửi dự phòng từ trình chạy                                         |

Dùng `--announce --channel telegram --to "-1001234567890"` để gửi đến kênh. Với các chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; trình gọi RPC/cấu hình trực tiếp cũng có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Các đích Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng đúng ID phòng hoặc dạng `room:!room:server` từ Matrix.

Khi gửi thông báo dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron quay về lịch sử phiên hoặc một kênh đã cấu hình duy nhất. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được đặt rõ ràng, tiền tố đích phải nêu đúng cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối thay vì để WhatsApp diễn giải ID Telegram là số điện thoại. Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>`, và `sms:<number>` vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Với các công việc cô lập, việc gửi qua trò chuyện được chia sẻ. Nếu có tuyến trò chuyện, tác nhân có thể dùng công cụ `message` ngay cả khi công việc dùng `--no-deliver`. Nếu tác nhân gửi đến đích đã cấu hình/hiện tại, OpenClaw bỏ qua thông báo dự phòng. Nếu không, `announce`, `webhook`, và `none` chỉ kiểm soát cách trình chạy xử lý phản hồi cuối cùng sau lượt của tác nhân.

Khi tác nhân tạo lời nhắc cô lập từ một cuộc trò chuyện đang hoạt động, OpenClaw lưu đích gửi trực tiếp đã bảo toàn cho tuyến thông báo dự phòng. Khóa phiên nội bộ có thể viết thường; các đích gửi của nhà cung cấp không được dựng lại từ những khóa đó khi có ngữ cảnh trò chuyện hiện tại.

Gửi thông báo ngầm dùng danh sách cho phép của kênh đã cấu hình để xác thực và định tuyến lại các đích cũ. Các phê duyệt kho ghép cặp DM không phải người nhận tự động dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một công việc đã lên lịch cần chủ động gửi đến DM.

Thông báo lỗi đi theo một đường đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè thiết lập đó theo từng công việc.
- Nếu cả hai đều chưa được đặt và công việc đã gửi qua `announce`, thông báo lỗi giờ sẽ quay về đích thông báo chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các công việc `sessionTarget="isolated"` trừ khi chế độ gửi chính là `webhook`.
- `failureAlert.includeSkipped: true` chọn cho một công việc hoặc chính sách cảnh báo cron toàn cục tham gia các cảnh báo lượt chạy bị bỏ qua lặp lại. Các lượt chạy bị bỏ qua giữ một bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến cơ chế lùi khi có lỗi thực thi.

## Ví dụ CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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

Gateway có thể phơi bày các điểm cuối Webhook HTTP cho trình kích hoạt bên ngoài. Bật trong cấu hình:

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Ánh xạ có thể chuyển đổi payload bất kỳ thành hành động `wake` hoặc `agent` bằng mẫu hoặc biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Đặt các điểm cuối hook phía sau loopback, tailnet, hoặc reverse proxy đáng tin cậy.

- Dùng một token hook chuyên dụng; không dùng lại token xác thực Gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn định tuyến `agentId` rõ ràng.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do trình gọi chọn.
- Nếu bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để giới hạn hình dạng khóa phiên được phép.
- Payload hook được bọc bằng các ranh giới an toàn theo mặc định.

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

Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động `gog gmail watch serve` lúc boot và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không tham gia.

### Thiết lập thủ công một lần

<Steps>
  <Step title="Select the GCP project">
    Chọn dự án GCP sở hữu OAuth client được `gog` dùng:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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

- `openclaw cron add|edit --model ...` thay đổi mô hình đã chọn của công việc.
- Nếu mô hình được phép, đúng nhà cung cấp/mô hình đó sẽ đến lượt chạy tác nhân cô lập.
- Nếu mô hình không được phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng.
- Các chuỗi dự phòng đã cấu hình vẫn áp dụng vì `--model` của cron là lựa chọn chính của công việc, không phải ghi đè `/model` của phiên.
- Payload `fallbacks` thay thế dự phòng đã cấu hình cho công việc đó; `fallbacks: []` tắt dự phòng và làm lượt chạy nghiêm ngặt.
- Một `--model` thuần túy không có danh sách dự phòng rõ ràng hoặc đã cấu hình sẽ không tự rơi xuống mô hình chính của tác nhân như một đích thử lại bổ sung âm thầm.

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

`maxConcurrentRuns` giới hạn cả việc điều phối cron theo lịch và thực thi lượt tác nhân cô lập. Các lượt tác nhân cron cô lập dùng nội bộ làn thực thi `cron-nested` chuyên dụng của hàng đợi, nên tăng giá trị này cho phép các lượt chạy LLM cron độc lập tiến triển song song thay vì chỉ khởi động các wrapper cron bên ngoài của chúng. Làn `nested` không phải cron dùng chung không được mở rộng bởi thiết lập này.

Sidecar trạng thái runtime được suy ra từ `cron.store`: một kho `.json` như `~/clawd/cron/jobs.json` dùng `~/clawd/cron/jobs-state.json`, còn đường dẫn kho không có hậu tố `.json` sẽ nối thêm `-state.json`.

Nếu bạn chỉnh sửa thủ công `jobs.json`, đừng đưa `jobs-state.json` vào kiểm soát mã nguồn. OpenClaw dùng sidecar đó cho các slot đang chờ, marker đang hoạt động, siêu dữ liệu lượt chạy cuối, và danh tính lịch giúp bộ lập lịch biết khi nào một công việc được chỉnh sửa bên ngoài cần `nextRunAtMs` mới.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) được thử lại tối đa 3 lần với lùi hàm mũ. Lỗi vĩnh viễn sẽ vô hiệu hóa ngay lập tức.

    **Thử lại định kỳ**: lùi hàm mũ (30 giây đến 60 phút) giữa các lần thử lại. Lùi được đặt lại sau lượt chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (mặc định `24h`) cắt tỉa các mục phiên chạy cô lập. `cron.runLog.maxBytes` / `cron.runLog.keepLines` tự động cắt tỉa tệp nhật ký chạy.
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
    - Với lịch `cron`, xác minh múi giờ (`--tz`) so với múi giờ của máy chủ.
    - `reason: not-due` trong đầu ra lượt chạy nghĩa là lượt chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và công việc chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã chạy nhưng không gửi gì">
    - Chế độ gửi `none` nghĩa là không mong đợi lượt gửi dự phòng từ trình chạy. Tác nhân vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện khả dụng.
    - Thiếu/không hợp lệ đích gửi (`channel`/`to`) nghĩa là lượt gửi đi đã bị bỏ qua.
    - Với Matrix, các tác vụ được sao chép hoặc cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là lượt gửi đã bị chặn bởi thông tin xác thực.
    - Nếu lượt chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn lượt gửi đi trực tiếp và cũng chặn đường dẫn tóm tắt được xếp hàng dự phòng, nên sẽ không có gì được đăng lại vào cuộc trò chuyện.
    - Nếu tác nhân nên tự nhắn cho người dùng, hãy kiểm tra rằng tác vụ có tuyến dùng được (`channel: "last"` với một cuộc trò chuyện trước đó, hoặc một kênh/đích rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn chuyển phiên /new-style">
    - Độ mới của đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Lượt đánh thức Cron, lượt chạy Heartbeat, thông báo exec và việc ghi sổ của Gateway có thể cập nhật hàng phiên cho định tuyến/trạng thái, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi các trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ phần đầu phiên trong transcript JSONL khi tệp vẫn còn. Các hàng nhàn rỗi cũ không có `lastInteractionAt` sử dụng thời điểm bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Những điểm dễ sai về múi giờ">
    - Cron không có `--tz` sử dụng múi giờ của máy chủ Gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - `activeHours` của Heartbeat sử dụng cách phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — tất cả cơ chế tự động hóa trong nháy mắt
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi Cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
