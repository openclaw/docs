---
read_when:
    - Lên lịch tác vụ nền hoặc lần đánh thức
    - Kết nối các trình kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ theo lịch
sidebarTitle: Scheduled tasks
summary: Các tác vụ đã lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-04-29T22:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp của Gateway. Nó lưu bền vững các tác vụ, đánh thức tác nhân vào đúng thời điểm, và có thể gửi đầu ra trở lại một kênh chat hoặc điểm cuối Webhook.

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

- Cron chạy **bên trong tiến trình Gateway** (không chạy bên trong mô hình).
- Định nghĩa tác vụ được lưu bền vững tại `~/.openclaw/cron/jobs.json` để việc khởi động lại không làm mất lịch.
- Trạng thái thực thi khi chạy được lưu bền vững bên cạnh đó trong `~/.openclaw/cron/jobs-state.json`. Nếu bạn theo dõi định nghĩa cron trong git, hãy theo dõi `jobs.json` và thêm `jobs-state.json` vào gitignore.
- Sau khi tách ra, các phiên bản OpenClaw cũ hơn có thể đọc `jobs.json` nhưng có thể coi các tác vụ là mới vì các trường runtime hiện nằm trong `jobs-state.json`.
- Khi `jobs.json` được chỉnh sửa trong lúc Gateway đang chạy hoặc đã dừng, OpenClaw so sánh các trường lịch đã thay đổi với siêu dữ liệu khe runtime đang chờ và xóa các giá trị `nextRunAtMs` đã cũ. Những lần ghi lại chỉ thay đổi định dạng hoặc thứ tự khóa sẽ giữ nguyên khe đang chờ.
- Tất cả lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các tác vụ lượt tác nhân biệt lập bị quá hạn được lập lịch lại ra ngoài cửa sổ kết nối kênh thay vì phát lại ngay lập tức, nhờ đó quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi tốt sau khi khởi động lại.
- Tác vụ một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron biệt lập cố gắng đóng các tab/tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại tiến trình mồ côi.
- Các lần chạy cron biệt lập cũng bảo vệ khỏi các phản hồi xác nhận đã cũ. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời (`on it`, `pulling everything together`, và các gợi ý tương tự) và không có lần chạy tác nhân con hậu duệ nào vẫn chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron biệt lập ưu tiên siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, sau đó dự phòng về các dấu hiệu tóm tắt/đầu ra cuối đã biết như `SYSTEM_RUN_DENIED` và `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo như một lần chạy thành công.
- Các lần chạy cron biệt lập cũng coi lỗi tác nhân ở cấp lần chạy là lỗi tác vụ ngay cả khi không có payload phản hồi nào được tạo, để lỗi mô hình/nhà cung cấp làm tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì xóa tác vụ như đã thành công.
- Khi một tác vụ lượt tác nhân biệt lập đạt `timeoutSeconds`, cron hủy lần chạy tác nhân bên dưới và cho nó một khoảng thời gian ngắn để dọn dẹp. Nếu lần chạy không thoát hết, phần dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận thời gian chờ, để công việc chat đã xếp hàng không bị bỏ lại phía sau một phiên xử lý đã cũ.

<a id="maintenance"></a>

<Note>
Đối soát tác vụ cho cron trước hết do runtime sở hữu, sau đó được sao lưu bằng lịch sử bền vững: một tác vụ cron đang hoạt động vẫn tồn tại trong khi runtime cron vẫn theo dõi tác vụ đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime không còn sở hữu tác vụ và cửa sổ gia hạn 5 phút hết hạn, bảo trì sẽ kiểm tra nhật ký chạy đã lưu bền vững và trạng thái tác vụ cho lần chạy `cron:<jobId>:<startedAt>` tương ứng. Nếu lịch sử bền vững đó cho thấy một kết quả kết thúc, sổ cái tác vụ sẽ được hoàn tất từ đó; nếu không, bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm tra CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không coi tập tác vụ đang hoạt động trong tiến trình rỗng của chính nó là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI    | Mô tả                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian một lần (ISO 8601 hoặc tương đối như `20m`) |
| `every` | `--every` | Khoảng thời gian cố định                                |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được coi là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ địa phương trên đồng hồ.

Các biểu thức lặp lại vào đầu giờ được tự động rải lệch tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp — không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Biểu thức này kích hoạt khoảng 5–6 lần mỗi tháng thay vì 0–1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch theo một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của tác vụ.

## Kiểu thực thi

| Kiểu             | Giá trị `--session` | Chạy trong               | Phù hợp nhất cho                         |
| ---------------- | ------------------- | ------------------------ | ---------------------------------------- |
| Phiên chính      | `main`              | Lượt Heartbeat tiếp theo | Lời nhắc, sự kiện hệ thống               |
| Biệt lập         | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, việc nền                         |
| Phiên hiện tại   | `current`           | Gắn tại thời điểm tạo    | Công việc lặp lại cần ngữ cảnh           |
| Phiên tùy chỉnh  | `session:custom-id` | Phiên được đặt tên bền vững | Quy trình công việc xây dựng trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính so với biệt lập so với tùy chỉnh">
    Các tác vụ **phiên chính** xếp hàng một sự kiện hệ thống và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Các sự kiện hệ thống đó không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi cho phiên đích. Các tác vụ **biệt lập** chạy một lượt tác nhân chuyên dụng với một phiên mới. **Phiên tùy chỉnh** (`session:xxx`) lưu bền vững ngữ cảnh qua các lần chạy, cho phép các quy trình công việc như standup hằng ngày xây dựng trên các bản tóm tắt trước đó.
  </Accordion>
  <Accordion title="Ý nghĩa của 'phiên mới' với tác vụ biệt lập">
    Với tác vụ biệt lập, "phiên mới" nghĩa là một id bản ghi/phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như cài đặt suy nghĩ/nhanh/chi tiết, nhãn, và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng, nhưng nó không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc, hoặc liên kết runtime ACP. Dùng `current` hoặc `session:<id>` khi một tác vụ lặp lại cần chủ ý xây dựng trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Dọn dẹp runtime">
    Với tác vụ biệt lập, quá trình tháo dỡ runtime hiện bao gồm dọn dẹp trình duyệt theo kiểu cố gắng tối đa cho phiên cron đó. Lỗi dọn dẹp bị bỏ qua để kết quả cron thực tế vẫn được ưu tiên.

    Các lần chạy cron biệt lập cũng giải phóng mọi thực thể runtime MCP đi kèm được tạo cho tác vụ thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách các máy khách MCP của phiên chính và phiên tùy chỉnh được tháo dỡ, nên tác vụ cron biệt lập không rò rỉ tiến trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Tác nhân con và gửi qua Discord">
    Khi các lần chạy cron biệt lập điều phối tác nhân con, việc gửi cũng ưu tiên đầu ra hậu duệ cuối cùng hơn văn bản tạm thời đã cũ của tác nhân cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw sẽ chặn cập nhật một phần đó từ tác nhân cha thay vì thông báo nó.

    Với mục tiêu thông báo Discord chỉ văn bản, OpenClaw gửi văn bản trợ lý cuối cùng chuẩn một lần thay vì phát lại cả payload văn bản được stream/tạm thời và câu trả lời cuối cùng. Payload Discord dạng media và có cấu trúc vẫn được gửi như các payload riêng để tệp đính kèm và thành phần không bị bỏ.

  </Accordion>
</AccordionGroup>

### Tùy chọn payload cho tác vụ biệt lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc với biệt lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; dùng mô hình được phép đã chọn cho tác vụ.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức suy nghĩ.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua việc chèn tệp bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn công cụ mà tác vụ có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của tác vụ đó. Nó không giống ghi đè `/model` của phiên chat: các chuỗi dự phòng đã cấu hình vẫn áp dụng khi mô hình chính của tác vụ thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm dự phòng về lựa chọn mô hình tác nhân/mặc định của tác vụ.

Tác vụ cron cũng có thể mang `fallbacks` ở cấp payload. Khi có, danh sách đó thay thế chuỗi dự phòng đã cấu hình cho tác vụ. Dùng `fallbacks: []` trong payload/API của tác vụ khi bạn muốn một lần chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu tác vụ có `--model` nhưng không có dự phòng trong payload lẫn cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng rõ ràng để mô hình chính của tác nhân không được thêm vào như một mục tiêu thử lại ẩn.

Thứ tự ưu tiên chọn mô hình cho tác vụ biệt lập là:

1. Ghi đè mô hình hook Gmail (khi lần chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong payload từng tác vụ
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình tác nhân/mặc định

Chế độ nhanh cũng theo lựa chọn trực tiếp đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron biệt lập mặc định dùng cấu hình đó. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai hướng.

Nếu một lần chạy biệt lập gặp bàn giao chuyển đổi mô hình trực tiếp, cron thử lại với nhà cung cấp/mô hình đã chuyển và lưu bền vững lựa chọn trực tiếp đó cho lần chạy đang hoạt động trước khi thử lại. Khi việc chuyển đổi cũng mang theo hồ sơ xác thực mới, cron cũng lưu bền vững ghi đè hồ sơ xác thực đó cho lần chạy đang hoạt động. Số lần thử lại có giới hạn: sau lần thử ban đầu cộng thêm 2 lần thử lại chuyển đổi, cron hủy thay vì lặp mãi.

Trước khi một lần chạy cron biệt lập đi vào trình chạy tác nhân, OpenClaw kiểm tra các điểm cuối nhà cung cấp cục bộ có thể truy cập cho các nhà cung cấp đã cấu hình `api: "ollama"` và `api: "openai-completions"` có `baseUrl` là loopback, mạng riêng, hoặc `.local`. Nếu điểm cuối đó không hoạt động, lần chạy được ghi là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lệnh gọi mô hình. Kết quả điểm cuối được lưu cache trong 5 phút, nên nhiều tác vụ đến hạn dùng cùng máy chủ Ollama, vLLM, SGLang, hoặc LM Studio cục bộ đã chết sẽ chia sẻ một phép thăm dò nhỏ thay vì tạo bão yêu cầu. Các lần chạy bị bỏ qua do kiểm tra trước nhà cung cấp không làm tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn thông báo bỏ qua lặp lại.

## Gửi và đầu ra

| Chế độ     | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Dự phòng gửi văn bản cuối tới mục tiêu nếu tác nhân chưa gửi        |
| `webhook`  | POST payload sự kiện hoàn tất tới một URL                           |
| `none`     | Không có gửi dự phòng từ trình chạy                                 |

Dùng `--announce --channel telegram --to "-1001234567890"` để gửi đến kênh. Với các chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; các bên gọi RPC/cấu hình trực tiếp cũng có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Các đích Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; hãy dùng đúng ID phòng hoặc dạng `room:!room:server` từ Matrix.

Với các tác vụ cô lập, việc gửi qua chat được chia sẻ. Nếu có tuyến chat, agent có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu agent gửi đến đích đã cấu hình/hiện tại, OpenClaw sẽ bỏ qua thông báo dự phòng. Nếu không, `announce`, `webhook` và `none` chỉ kiểm soát runner sẽ làm gì với phản hồi cuối cùng sau lượt agent.

Khi agent tạo lời nhắc cô lập từ một chat đang hoạt động, OpenClaw lưu đích gửi trực tiếp đã được giữ lại cho tuyến thông báo dự phòng. Khóa phiên nội bộ có thể viết thường; đích gửi của nhà cung cấp không được dựng lại từ các khóa đó khi có ngữ cảnh chat hiện tại.

Thông báo lỗi đi theo một đường đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè mặc định đó theo từng tác vụ.
- Nếu cả hai đều chưa được đặt và tác vụ đã gửi qua `announce`, thông báo lỗi hiện sẽ dùng đích thông báo chính đó làm dự phòng.
- `delivery.failureDestination` chỉ được hỗ trợ trên các tác vụ `sessionTarget="isolated"` trừ khi chế độ gửi chính là `webhook`.
- `failureAlert.includeSkipped: true` chọn cho một tác vụ hoặc chính sách cảnh báo cron toàn cục nhận cảnh báo lặp lại về các lần chạy bị bỏ qua. Các lần chạy bị bỏ qua giữ bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng đến backoff lỗi thực thi.

## Ví dụ CLI

<Tabs>
  <Tab title="Lời nhắc chạy một lần">
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
  <Accordion title="Hook được ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Mapping có thể chuyển đổi payload bất kỳ thành hành động `wake` hoặc `agent` bằng template hoặc chuyển đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các điểm cuối hook sau loopback, tailnet hoặc reverse proxy đáng tin cậy.

- Dùng token hook chuyên dụng; không dùng lại token xác thực gateway.
- Giữ `hooks.path` trên một đường dẫn con riêng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn định tuyến `agentId` rõ ràng.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do bên gọi chọn.
- Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để ràng buộc dạng khóa phiên được phép.
- Payload hook mặc định được bọc bằng các ranh giới an toàn.

</Warning>

## Tích hợp Gmail PubSub

Nối trình kích hoạt hộp thư đến Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw đã bật, Tailscale cho điểm cuối HTTPS công khai.
</Note>

### Thiết lập bằng wizard (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật preset Gmail và dùng Tailscale Funnel cho điểm cuối push.

### Tự động khởi động Gateway

Khi `hooks.enabled=true` và `hooks.gmail.account` được đặt, Gateway khởi động `gog gmail watch serve` khi boot và tự động gia hạn watch. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không dùng tính năng này.

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
  <Step title="Tạo topic và cấp quyền truy cập Gmail push">
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
- Nếu mô hình được phép, đúng provider/model đó sẽ tới lượt chạy agent cô lập.
- Nếu không được phép hoặc không thể phân giải, cron sẽ làm lần chạy thất bại với lỗi xác thực rõ ràng.
- Các chuỗi dự phòng đã cấu hình vẫn áp dụng vì cron `--model` là mô hình chính của tác vụ, không phải ghi đè `/model` của phiên.
- Payload `fallbacks` thay thế fallback đã cấu hình cho tác vụ đó; `fallbacks: []` tắt fallback và làm lần chạy nghiêm ngặt.
- Một `--model` đơn thuần không có danh sách fallback rõ ràng hoặc đã cấu hình sẽ không tự rơi về mô hình chính của agent như một đích thử lại bổ sung âm thầm.

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

`maxConcurrentRuns` giới hạn cả việc điều phối cron theo lịch và thực thi lượt agent cô lập. Các lượt agent cron cô lập dùng nội bộ lane thực thi `cron-nested` chuyên dụng của hàng đợi, nên tăng giá trị này cho phép các lần chạy LLM cron độc lập tiến hành song song thay vì chỉ khởi động các wrapper cron bên ngoài. Lane `nested` không phải cron dùng chung không được mở rộng bởi thiết lập này.

Sidecar trạng thái runtime được suy ra từ `cron.store`: một kho `.json` như `~/clawd/cron/jobs.json` dùng `~/clawd/cron/jobs-state.json`, còn đường dẫn kho không có hậu tố `.json` sẽ nối thêm `-state.json`.

Nếu bạn chỉnh tay `jobs.json`, đừng đưa `jobs-state.json` vào kiểm soát mã nguồn. OpenClaw dùng sidecar đó cho các slot đang chờ, marker đang hoạt động, metadata lần chạy gần nhất và danh tính lịch cho scheduler biết khi nào một tác vụ được chỉnh sửa từ bên ngoài cần `nextRunAtMs` mới.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) được thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn sẽ tắt ngay.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lần chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
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
  <Accordion title="Cron không kích hoạt">
    - Kiểm tra `cron.enabled` và biến môi trường `OPENCLAW_SKIP_CRON`.
    - Xác nhận Gateway đang chạy liên tục.
    - Với lịch `cron`, kiểm tra múi giờ (`--tz`) so với múi giờ của host.
    - `reason: not-due` trong đầu ra lần chạy nghĩa là lần chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và tác vụ chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không gửi">
    - Chế độ gửi `none` nghĩa là không mong đợi runner gửi dự phòng. Agent vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến chat.
    - Thiếu/không hợp lệ đích gửi (`channel`/`to`) nghĩa là outbound đã bị bỏ qua.
    - Với Matrix, các tác vụ được sao chép hoặc cũ có ID phòng `delivery.to` đã bị viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) nghĩa là việc gửi đã bị chặn bởi thông tin xác thực.
    - Nếu lần chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn gửi outbound trực tiếp và cũng chặn đường tóm tắt dự phòng trong hàng đợi, nên sẽ không có gì được đăng lại vào chat.
    - Nếu agent cần tự nhắn cho người dùng, hãy kiểm tra rằng tác vụ có tuyến dùng được (`channel: "last"` với chat trước đó, hoặc một kênh/đích rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat dường như ngăn quá trình chuyển đổi /new-style">
    - Độ mới của việc đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lần chạy Heartbeat, thông báo exec và việc ghi nhận nội bộ của Gateway có thể cập nhật hàng phiên cho routing/status, nhưng chúng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Đối với các hàng cũ được tạo trước khi những trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ tiêu đề phiên JSONL của bản ghi hội thoại khi tệp vẫn còn khả dụng. Các hàng nhàn rỗi cũ không có `lastInteractionAt` dùng thời điểm bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Những điểm dễ sai về múi giờ">
    - Cron không có `--tz` sẽ dùng múi giờ của máy chủ Gateway.
    - Lịch `at` không có múi giờ được xem là UTC.
    - Heartbeat `activeHours` dùng cách phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — tổng quan tất cả cơ chế tự động hóa
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
