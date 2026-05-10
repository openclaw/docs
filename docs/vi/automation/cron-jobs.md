---
read_when:
    - Lên lịch các tác vụ nền hoặc lần đánh thức
    - Kết nối các trình kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ theo lịch
sidebarTitle: Scheduled tasks
summary: Tác vụ đã lên lịch, Webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-05-10T19:20:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu bền vững các công việc, đánh thức tác tử vào đúng thời điểm, và có thể gửi đầu ra trở lại một kênh chat hoặc điểm cuối Webhook.

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

- Cron chạy **bên trong tiến trình Gateway** (không phải bên trong mô hình).
- Định nghĩa công việc được lưu bền vững tại `~/.openclaw/cron/jobs.json` nên việc khởi động lại sẽ không làm mất lịch.
- Trạng thái thực thi lúc chạy được lưu bền vững cạnh đó trong `~/.openclaw/cron/jobs-state.json`. Nếu bạn theo dõi định nghĩa cron trong git, hãy theo dõi `jobs.json` và thêm `jobs-state.json` vào gitignore.
- Sau khi tách, các phiên bản OpenClaw cũ hơn có thể đọc `jobs.json` nhưng có thể xem các công việc là mới vì các trường lúc chạy hiện nằm trong `jobs-state.json`.
- Khi `jobs.json` được chỉnh sửa trong lúc Gateway đang chạy hoặc đã dừng, OpenClaw so sánh các trường lịch đã thay đổi với siêu dữ liệu khe lúc chạy đang chờ xử lý và xóa các giá trị `nextRunAtMs` lỗi thời. Các bản ghi lại chỉ thay đổi định dạng hoặc thứ tự khóa sẽ giữ nguyên khe đang chờ.
- Mọi lần thực thi cron đều tạo bản ghi [tác vụ nền](/vi/automation/tasks).
- Khi Gateway khởi động, các công việc lượt tác tử biệt lập bị quá hạn sẽ được lập lịch lại ra ngoài khoảng thời gian kết nối kênh thay vì phát lại ngay lập tức, để quá trình khởi động Discord/Telegram và thiết lập lệnh gốc vẫn phản hồi tốt sau khi khởi động lại.
- Công việc chạy một lần (`--at`) mặc định tự động xóa sau khi thành công.
- Các lần chạy cron biệt lập sẽ cố gắng hết sức để đóng các thẻ/trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng khi lần chạy hoàn tất, để tự động hóa trình duyệt tách rời không để lại tiến trình mồ côi.
- Các lần chạy cron biệt lập nhận được cấp quyền tự dọn dẹp cron hẹp vẫn có thể đọc trạng thái bộ lập lịch, danh sách tự lọc của công việc hiện tại của chúng, và lịch sử chạy của công việc đó, để các kiểm tra trạng thái/Heartbeat có thể kiểm tra lịch của chính chúng mà không có quyền đột biến cron rộng hơn.
- Các lần chạy cron biệt lập cũng chống lại các phản hồi xác nhận lỗi thời. Nếu kết quả đầu tiên chỉ là một cập nhật trạng thái tạm thời (`on it`, `pulling everything together`, và các gợi ý tương tự) và không có lần chạy tác tử con hậu duệ nào còn chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
- Các lần chạy cron biệt lập ưu tiên siêu dữ liệu từ chối thực thi có cấu trúc từ lần chạy nhúng, rồi mới rơi lui về các dấu hiệu tóm tắt/đầu ra cuối cùng đã biết như `SYSTEM_RUN_DENIED` và `INVALID_REQUEST`, để một lệnh bị chặn không bị báo cáo là lần chạy xanh.
- Các lần chạy cron biệt lập cũng xem lỗi tác tử ở cấp lần chạy là lỗi công việc ngay cả khi không tạo ra tải phản hồi, để lỗi mô hình/nhà cung cấp làm tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì xóa công việc như đã thành công.
- Khi một công việc lượt tác tử biệt lập đạt `timeoutSeconds`, cron hủy lần chạy tác tử bên dưới và cho nó một khoảng thời gian dọn dẹp ngắn. Nếu lần chạy không thoát hết, phần dọn dẹp do Gateway sở hữu sẽ cưỡng bức xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận timeout, để công việc chat đang xếp hàng không bị kẹt phía sau một phiên xử lý lỗi thời.
- Nếu một lượt tác tử biệt lập bị đình trệ trước khi runner bắt đầu hoặc trước lệnh gọi mô hình đầu tiên, cron ghi lại timeout theo giai đoạn như `setup timed out before runner start` hoặc `stalled before first model call (last phase: context-engine)`. Các watchdog này bao phủ nhà cung cấp nhúng và nhà cung cấp dựa trên CLI trước khi tiến trình CLI bên ngoài của chúng thực sự được khởi động, và được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động nguội/xác thực/ngữ cảnh xuất hiện nhanh thay vì chờ hết toàn bộ ngân sách công việc.

<a id="maintenance"></a>

<Note>
Việc đối chiếu tác vụ cho cron trước hết do runtime sở hữu, sau đó mới được hỗ trợ bởi lịch sử bền vững: một tác vụ cron đang hoạt động vẫn tiếp tục sống khi runtime cron vẫn theo dõi công việc đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi runtime ngừng sở hữu công việc và khoảng ân hạn 5 phút hết hạn, các kiểm tra bảo trì sẽ kiểm tra nhật ký chạy đã lưu bền vững và trạng thái công việc cho lần chạy `cron:<jobId>:<startedAt>` khớp. Nếu lịch sử bền vững đó cho thấy một kết quả kết thúc, sổ cái tác vụ được hoàn tất từ đó; nếu không, phần bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Kiểm toán CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng nó không xem tập công việc đang hoạt động trong tiến trình của chính nó mà rỗng là bằng chứng rằng một lần chạy cron do Gateway sở hữu đã biến mất.
</Note>

## Loại lịch

| Loại    | Cờ CLI  | Mô tả                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`)    |
| `every` | `--every` | Khoảng thời gian cố định                                          |
| `cron`  | `--cron`  | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn |

Dấu thời gian không có múi giờ được xem là UTC. Thêm `--tz America/New_York` để lập lịch theo giờ tường địa phương.

Các biểu thức lặp lại vào đầu giờ tự động được rải lệch tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời điểm chính xác hoặc `--stagger 30s` cho một cửa sổ rõ ràng.

### Ngày trong tháng và ngày trong tuần dùng logic OR

Biểu thức Cron được phân tích bằng [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp — không phải cả hai. Đây là hành vi cron Vixie chuẩn.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Điều này kích hoạt khoảng 5–6 lần mỗi tháng thay vì 0–1 lần mỗi tháng. OpenClaw dùng hành vi OR mặc định của Croner ở đây. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của Croner (`0 9 15 * +1`) hoặc lập lịch trên một trường và kiểm tra trường còn lại trong prompt hoặc lệnh của công việc.

## Kiểu thực thi

| Kiểu           | Giá trị `--session`   | Chạy trong                  | Phù hợp nhất cho                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Phiên chính    | `main`              | Lượt Heartbeat tiếp theo      | Lời nhắc, sự kiện hệ thống        |
| Biệt lập        | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, việc nền      |
| Phiên hiện tại | `current`           | Được ràng buộc tại thời điểm tạo   | Công việc lặp lại có nhận biết ngữ cảnh    |
| Phiên tùy chỉnh  | `session:custom-id` | Phiên được đặt tên bền vững | Quy trình làm việc xây dựng trên lịch sử |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Các công việc **phiên chính** đưa một sự kiện hệ thống vào hàng đợi và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Những sự kiện hệ thống đó không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi cho phiên đích. Các công việc **biệt lập** chạy một lượt tác tử chuyên dụng với một phiên mới. **Phiên tùy chỉnh** (`session:xxx`) duy trì ngữ cảnh qua các lần chạy, cho phép các quy trình như standup hằng ngày xây dựng trên các bản tóm tắt trước đó.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Với công việc biệt lập, "fresh session" nghĩa là một transcript/id phiên mới cho mỗi lần chạy. OpenClaw có thể mang theo các tùy chọn an toàn như cài đặt suy luận/nhanh/chi tiết, nhãn, và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng, nhưng nó không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ hơn: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc, hoặc ràng buộc runtime ACP. Dùng `current` hoặc `session:<id>` khi một công việc lặp lại nên chủ ý xây dựng trên cùng ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Với công việc biệt lập, quá trình tháo dỡ runtime hiện bao gồm dọn dẹp trình duyệt kiểu cố gắng hết sức cho phiên cron đó. Lỗi dọn dẹp được bỏ qua để kết quả cron thực tế vẫn thắng.

    Các lần chạy cron biệt lập cũng hủy mọi phiên bản runtime MCP đóng gói được tạo cho công việc thông qua đường dẫn dọn dẹp runtime dùng chung. Điều này khớp với cách các client MCP của phiên chính và phiên tùy chỉnh được tháo dỡ, nên công việc cron biệt lập không rò rỉ tiến trình con stdio hoặc kết nối MCP sống lâu qua các lần chạy.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Khi các lần chạy cron biệt lập điều phối tác tử con, việc gửi cũng ưu tiên đầu ra hậu duệ cuối cùng hơn văn bản tạm thời cũ của cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw sẽ chặn cập nhật cha một phần đó thay vì thông báo nó.

    Với các đích thông báo Discord chỉ có văn bản, OpenClaw gửi văn bản trợ lý cuối cùng chuẩn một lần thay vì phát lại cả tải văn bản được stream/trung gian và câu trả lời cuối cùng. Tải Discord dạng media và có cấu trúc vẫn được gửi dưới dạng các tải riêng để tệp đính kèm và thành phần không bị bỏ sót.

  </Accordion>
</AccordionGroup>

### Tùy chọn tải cho công việc biệt lập

<ParamField path="--message" type="string" required>
  Văn bản prompt (bắt buộc cho biệt lập).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; dùng mô hình được phép đã chọn cho công việc.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức suy luận.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua chèn tệp bootstrap không gian làm việc.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn các công cụ mà công việc có thể dùng, ví dụ `--tools exec,read`.
</ParamField>

`--model` dùng mô hình được phép đã chọn làm mô hình chính của công việc đó. Nó không giống ghi đè `/model` của phiên chat: các chuỗi rơi lui đã cấu hình vẫn áp dụng khi mô hình chính của công việc thất bại. Nếu mô hình được yêu cầu không được phép hoặc không thể phân giải, cron làm lần chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm rơi lui về lựa chọn mô hình của tác tử/mặc định của công việc.

Công việc Cron cũng có thể mang `fallbacks` ở cấp tải. Khi có mặt, danh sách đó thay thế chuỗi rơi lui đã cấu hình cho công việc. Dùng `fallbacks: []` trong tải công việc/API khi bạn muốn một lần chạy cron nghiêm ngặt chỉ thử mô hình đã chọn. Nếu một công việc có `--model` nhưng không có rơi lui ở tải hoặc đã cấu hình, OpenClaw truyền một ghi đè rơi lui rỗng rõ ràng để mô hình chính của tác tử không được thêm vào như một đích thử lại phụ bị ẩn.

Thứ tự ưu tiên chọn mô hình cho công việc biệt lập là:

1. Ghi đè mô hình hook Gmail (khi lần chạy đến từ Gmail và ghi đè đó được phép)
2. `model` trong tải theo từng công việc
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình tác tử/mặc định

Chế độ nhanh cũng đi theo lựa chọn trực tiếp đã phân giải. Nếu cấu hình mô hình được chọn có `params.fastMode`, cron biệt lập sẽ dùng mặc định đó. Ghi đè `fastMode` của phiên đã lưu vẫn thắng cấu hình theo cả hai chiều.

Nếu một lần chạy biệt lập gặp bàn giao chuyển đổi mô hình trực tiếp, cron thử lại với nhà cung cấp/mô hình đã chuyển và lưu bền vững lựa chọn trực tiếp đó cho lần chạy đang hoạt động trước khi thử lại. Khi chuyển đổi cũng mang theo một hồ sơ xác thực mới, cron cũng lưu bền vững ghi đè hồ sơ xác thực đó cho lần chạy đang hoạt động. Số lần thử lại bị giới hạn: sau lần thử ban đầu cộng với 2 lần thử lại chuyển đổi, cron hủy thay vì lặp mãi.

Trước khi một lượt chạy Cron cô lập đi vào agent runner, OpenClaw kiểm tra các endpoint nhà cung cấp cục bộ có thể truy cập được cho các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là local loopback, mạng riêng hoặc `.local`. Nếu endpoint đó không hoạt động, lượt chạy được ghi nhận là `skipped` với lỗi nhà cung cấp/mô hình rõ ràng thay vì bắt đầu một lời gọi mô hình. Kết quả endpoint được lưu vào bộ nhớ đệm trong 5 phút, vì vậy nhiều tác vụ đến hạn dùng cùng một máy chủ Ollama, vLLM, SGLang hoặc LM Studio cục bộ đang chết sẽ dùng chung một lần thăm dò nhỏ thay vì tạo ra một cơn bão yêu cầu. Các lượt chạy bị bỏ qua do provider-preflight không làm tăng backoff lỗi thực thi; bật `failureAlert.includeSkipped` khi bạn muốn nhận thông báo bỏ qua lặp lại.

## Phân phối và đầu ra

| Chế độ     | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Phân phối dự phòng văn bản cuối cùng tới đích nếu agent chưa gửi   |
| `webhook`  | POST payload sự kiện đã hoàn tất tới một URL                       |
| `none`     | Không có phân phối dự phòng của runner                             |

Dùng `--announce --channel telegram --to "-1001234567890"` để phân phối tới kênh. Với các chủ đề diễn đàn Telegram, dùng `-1001234567890:topic:123`; các trình gọi RPC/cấu hình trực tiếp cũng có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Đích Slack/Discord/Mattermost nên dùng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; dùng đúng ID phòng hoặc dạng `room:!room:server` từ Matrix.

Khi phân phối announce dùng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi Cron quay về lịch sử phiên hoặc một kênh duy nhất đã cấu hình. Chỉ các tiền tố được Plugin đã tải quảng bá mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được chỉ định rõ, tiền tố đích phải đặt tên cùng nhà cung cấp; ví dụ, `channel: "whatsapp"` với `to: "telegram:123"` bị từ chối thay vì để WhatsApp diễn giải ID Telegram là số điện thoại. Các tiền tố loại đích và dịch vụ như `channel:<id>`, `user:<id>`, `imessage:<handle>` và `sms:<number>` vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Với các tác vụ cô lập, phân phối chat được chia sẻ. Nếu có tuyến chat khả dụng, agent có thể dùng công cụ `message` ngay cả khi tác vụ dùng `--no-deliver`. Nếu agent gửi tới đích đã cấu hình/hiện tại, OpenClaw bỏ qua announce dự phòng. Nếu không, `announce`, `webhook` và `none` chỉ kiểm soát runner làm gì với phản hồi cuối cùng sau lượt agent.

Khi một agent tạo lời nhắc cô lập từ một chat đang hoạt động, OpenClaw lưu đích phân phối trực tiếp được giữ lại cho tuyến announce dự phòng. Khóa phiên nội bộ có thể là chữ thường; đích phân phối của nhà cung cấp không được dựng lại từ các khóa đó khi có ngữ cảnh chat hiện tại.

Phân phối announce ngầm định dùng allowlist kênh đã cấu hình để xác thực và định tuyến lại các đích cũ. Phê duyệt trong kho ghép cặp DM không phải là người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi tới DM.

Thông báo lỗi đi theo một đường đích riêng:

- `cron.failureDestination` đặt mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè theo từng tác vụ.
- Nếu cả hai đều không được đặt và tác vụ đã phân phối qua `announce`, thông báo lỗi hiện quay về đích announce chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các tác vụ `sessionTarget="isolated"` trừ khi chế độ phân phối chính là `webhook`.
- `failureAlert.includeSkipped: true` cho phép chính sách cảnh báo Cron của tác vụ hoặc toàn cục gửi cảnh báo lượt chạy bị bỏ qua lặp lại. Các lượt chạy bị bỏ qua giữ bộ đếm bỏ qua liên tiếp riêng, nên chúng không ảnh hưởng tới backoff lỗi thực thi.

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

Mọi yêu cầu phải bao gồm hook token qua header:

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
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Ánh xạ có thể chuyển đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc chuyển đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các endpoint hook phía sau local loopback, tailnet hoặc reverse proxy đáng tin cậy.

- Dùng hook token chuyên dụng; không dùng lại token xác thực Gateway.
- Giữ `hooks.path` trên một đường dẫn con chuyên dụng; `/` bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn định tuyến `agentId` rõ ràng.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi bạn cần phiên do trình gọi chọn.
- Nếu bạn bật `hooks.allowRequestSessionKey`, cũng đặt `hooks.allowedSessionKeyPrefixes` để ràng buộc hình dạng khóa phiên được phép.
- Payload hook mặc định được bọc bằng ranh giới an toàn.

</Warning>

## Tích hợp Gmail PubSub

Nối trigger hộp thư đến Gmail với OpenClaw qua Google PubSub.

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
    Chọn dự án GCP sở hữu client OAuth được `gog` dùng:

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

- `openclaw cron add|edit --model ...` thay đổi mô hình được chọn của tác vụ.
- Nếu mô hình được phép, đúng nhà cung cấp/mô hình đó sẽ đến lượt chạy agent cô lập.
- Nếu không được phép hoặc không thể phân giải, Cron làm lượt chạy thất bại với lỗi xác thực rõ ràng.
- Chuỗi dự phòng đã cấu hình vẫn áp dụng vì Cron `--model` là mô hình chính của tác vụ, không phải ghi đè `/model` của phiên.
- Payload `fallbacks` thay thế fallback đã cấu hình cho tác vụ đó; `fallbacks: []` tắt fallback và làm lượt chạy nghiêm ngặt.
- Một `--model` đơn thuần không có danh sách fallback rõ ràng hoặc đã cấu hình sẽ không rơi xuống mô hình chính của agent như một đích thử lại bổ sung âm thầm.

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

`maxConcurrentRuns` giới hạn cả việc điều phối Cron đã lên lịch và thực thi lượt agent cô lập. Các lượt agent Cron cô lập dùng làn thực thi `cron-nested` chuyên dụng của hàng đợi ở bên trong, vì vậy tăng giá trị này cho phép các lượt chạy LLM Cron độc lập tiến triển song song thay vì chỉ bắt đầu các wrapper Cron bên ngoài của chúng. Làn `nested` không phải Cron dùng chung không được mở rộng bởi thiết lập này.

Sidecar trạng thái runtime được suy ra từ `cron.store`: một store `.json` như `~/clawd/cron/jobs.json` dùng `~/clawd/cron/jobs-state.json`, còn đường dẫn store không có hậu tố `.json` sẽ nối thêm `-state.json`.

Nếu bạn chỉnh sửa thủ công `jobs.json`, hãy để `jobs-state.json` ngoài kiểm soát mã nguồn. OpenClaw dùng sidecar đó cho các slot đang chờ, marker đang hoạt động, siêu dữ liệu lần chạy gần nhất và định danh lịch biểu cho scheduler biết khi nào một tác vụ được chỉnh sửa bên ngoài cần `nextRunAtMs` mới.

Tắt Cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần**: lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, lỗi máy chủ) được thử lại tối đa 3 lần với backoff lũy thừa. Lỗi vĩnh viễn vô hiệu hóa ngay lập tức.

    **Thử lại định kỳ**: backoff lũy thừa (30 giây đến 60 phút) giữa các lần thử lại. Backoff đặt lại sau lượt chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`) dọn bớt các mục phiên chạy cô lập. `cron.runLog.maxBytes` / `cron.runLog.keepLines` tự động dọn bớt tệp nhật ký lượt chạy.
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
  <Accordion title="Cron không chạy">
    - Kiểm tra biến môi trường `cron.enabled` và `OPENCLAW_SKIP_CRON`.
    - Xác nhận Gateway đang chạy liên tục.
    - Với lịch `cron`, hãy xác minh múi giờ (`--tz`) so với múi giờ của máy chủ.
    - `reason: not-due` trong đầu ra lượt chạy có nghĩa là lượt chạy thủ công đã được kiểm tra bằng `openclaw cron run <jobId> --due` và tác vụ chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã chạy nhưng không gửi">
    - Chế độ gửi `none` có nghĩa là không mong đợi gửi dự phòng từ trình chạy. Tác tử vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
    - Thiếu mục tiêu gửi hoặc mục tiêu không hợp lệ (`channel`/`to`) có nghĩa là lượt gửi đi đã bị bỏ qua.
    - Với Matrix, các tác vụ được sao chép hoặc tác vụ cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) có nghĩa là việc gửi đã bị chặn bởi thông tin xác thực.
    - Nếu lượt chạy cô lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn gửi đi trực tiếp và cũng chặn đường dẫn tóm tắt xếp hàng dự phòng, nên không có gì được đăng lại vào cuộc trò chuyện.
    - Nếu tác tử cần tự nhắn cho người dùng, hãy kiểm tra rằng tác vụ có tuyến khả dụng (`channel: "last"` với cuộc trò chuyện trước đó, hoặc kênh/mục tiêu rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn rollover /new-style">
    - Độ mới của đặt lại hằng ngày và khi nhàn rỗi không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lượt chạy Heartbeat, thông báo exec và việc ghi sổ của Gateway có thể cập nhật hàng phiên để định tuyến/trạng thái, nhưng chúng không gia hạn `sessionStartedAt` hoặc `lastInteractionAt`.
    - Với các hàng cũ được tạo trước khi những trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ tiêu đề phiên JSONL của bản ghi khi tệp vẫn còn khả dụng. Các hàng nhàn rỗi cũ không có `lastInteractionAt` dùng thời điểm bắt đầu đã khôi phục đó làm mốc nhàn rỗi.

  </Accordion>
  <Accordion title="Những điểm dễ nhầm về múi giờ">
    - Cron không có `--tz` dùng múi giờ của máy chủ Gateway.
    - Lịch `at` không có múi giờ được xử lý là UTC.
    - `activeHours` của Heartbeat dùng cơ chế phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa & tác vụ](/vi/automation) — toàn bộ cơ chế tự động hóa trong một cái nhìn tổng quan
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi Cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
