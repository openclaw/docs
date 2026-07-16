---
read_when:
    - Lên lịch các tác vụ nền hoặc hoạt động đánh thức
    - Kết nối các trình kích hoạt bên ngoài (Webhook, Gmail) vào OpenClaw
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ theo lịch trình
sidebarTitle: Scheduled tasks
summary: Các tác vụ theo lịch, webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ đã lên lịch
x-i18n:
    generated_at: "2026-07-16T14:04:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là bộ lập lịch tích hợp sẵn của Gateway. Nó lưu bền vững các tác vụ, đánh thức tác nhân vào đúng thời điểm và có thể gửi đầu ra đến một kênh trò chuyện, một Webhook hoặc không gửi đi đâu cả.

## Bắt đầu nhanh

<Steps>
  <Step title="Thêm lời nhắc một lần">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Lời nhắc" \
      --session main \
      --system-event "Lời nhắc: kiểm tra bản nháp tài liệu cron" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Kiểm tra các tác vụ">
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

- Cron chạy **bên trong tiến trình Gateway**, không phải bên trong mô hình. Gateway phải đang chạy thì lịch mới được kích hoạt.
- Định nghĩa tác vụ, trạng thái thời gian chạy và lịch sử chạy được lưu bền vững trong cơ sở dữ liệu trạng thái SQLite dùng chung của OpenClaw, vì vậy lịch không bị mất khi khởi động lại.
- Mỗi lần thực thi cron đều tạo một bản ghi [tác vụ nền](/vi/automation/tasks).
- Theo mặc định, các tác vụ một lần (`--at`) sẽ tự động bị xóa sau khi thành công; truyền `--keep-after-run` để giữ lại.
- Ngân sách thời gian thực tế cho mỗi lần chạy: `--timeout-seconds` khi được đặt. Nếu không, các tác vụ lượt tác nhân cô lập/tách rời bị giới hạn bởi bộ giám sát 60 phút riêng của cron trước khi thời gian chờ của lượt tác nhân bên dưới (`agents.defaults.timeoutSeconds`, mặc định 48 giờ) có thể được áp dụng; tác vụ lệnh mặc định là 10 phút.
- Khi Gateway khởi động, các tác vụ lượt tác nhân cô lập đã quá hạn được lên lịch lại thay vì phát lại ngay lập tức, nhờ đó công việc khởi tạo mô hình/công cụ không diễn ra trong khoảng thời gian kết nối kênh.
- Nếu bạn điều khiển `openclaw agent` từ cron hệ thống hoặc một bộ lập lịch bên ngoài khác, hãy bọc nó bằng cơ chế nâng cấp buộc dừng dù CLI đã xử lý `SIGTERM`/`SIGINT`. Các lần chạy do Gateway hỗ trợ yêu cầu Gateway hủy những lần chạy đã được chấp nhận; các lần chạy dự phòng cục bộ và nhúng nhận cùng tín hiệu hủy. Đối với GNU `timeout`, nên dùng `timeout -k 60 600 openclaw agent ...` thay vì chỉ dùng `timeout 600 ...` — giá trị `-k` là phương án dự phòng cuối cùng nếu tiến trình không thể kết thúc kịp thời. Đối với các đơn vị systemd, hãy dùng tín hiệu dừng `SIGTERM` với một khoảng thời gian chờ (`TimeoutStopSec`) trước khi buộc dừng cuối cùng. Việc sử dụng lại một `--run-id` khi lần chạy Gateway ban đầu vẫn đang hoạt động sẽ báo lần trùng lặp là đang chạy thay vì bắt đầu lần chạy thứ hai.

<AccordionGroup>
  <Accordion title="Tăng cường an toàn cho lần chạy cô lập">
    - Khi hoàn tất, các lần chạy cô lập sẽ cố gắng hết mức để đóng các thẻ/tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng, đồng thời giải phóng mọi phiên bản thời gian chạy MCP đi kèm được tạo cho tác vụ thông qua cùng đường dẫn tháo dỡ dùng chung với các lần chạy phiên chính và phiên tùy chỉnh. Lỗi dọn dẹp được bỏ qua để kết quả cron vẫn được ưu tiên.
    - Các lần chạy cô lập có quyền tự dọn dẹp cron giới hạn có thể đọc trạng thái bộ lập lịch, danh sách tự lọc chỉ chứa tác vụ của chính chúng và lịch sử chạy của tác vụ đó, đồng thời chỉ có thể xóa tác vụ của chính chúng.
    - Các lần chạy cô lập được bảo vệ khỏi phản hồi xác nhận lỗi thời: nếu kết quả đầu tiên chỉ là cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không còn tác nhân con hậu duệ nào chịu trách nhiệm cho câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
    - Siêu dữ liệu từ chối thực thi có cấu trúc (bao gồm các trình bao bọc `UNAVAILABLE` trên máy chủ Node có lỗi lồng nhau bắt đầu bằng `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`) được nhận diện để lệnh bị chặn không được báo cáo là lần chạy thành công, trong khi văn bản thông thường của trợ lý không bị nhầm là lời từ chối.
    - Lỗi tác nhân ở cấp lần chạy được tính là lỗi tác vụ ngay cả khi không có nội dung phản hồi, vì vậy lỗi mô hình/nhà cung cấp làm tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì đánh dấu tác vụ là thành công.
    - Khi một tác vụ đạt `timeoutSeconds`, cron hủy lần chạy và dành cho nó một khoảng thời gian ngắn để dọn dẹp. Nếu nó không kết thúc, cơ chế dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi cron ghi nhận hết thời gian, để công việc trò chuyện trong hàng đợi không bị kẹt sau một phiên xử lý lỗi thời.
    - Các tình trạng đình trệ khi thiết lập/khởi động có thời gian chờ riêng theo từng giai đoạn (ví dụ `cron: isolated agent setup timed out before runner start` hoặc `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Các bộ giám sát này bao phủ cả nhà cung cấp nhúng và nhà cung cấp do CLI hỗ trợ, ngay cả trước khi tiến trình CLI bên ngoài của chúng bắt đầu, đồng thời được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động nguội/xác thực/ngữ cảnh nhanh chóng xuất hiện.

  </Accordion>
  <Accordion title="Đối soát tác vụ">
    Việc đối soát tác vụ cron trước hết do thời gian chạy sở hữu, sau đó mới dựa trên lịch sử bền vững: một tác vụ cron đang hoạt động vẫn tiếp tục hoạt động khi thời gian chạy cron còn theo dõi tác vụ đó là đang chạy, ngay cả khi một hàng phiên con cũ vẫn tồn tại. Khi thời gian chạy không còn sở hữu tác vụ và khoảng thời gian chờ 5 phút kết thúc, các bước kiểm tra bảo trì sẽ xem xét nhật ký chạy được lưu bền vững và trạng thái tác vụ cho lần chạy `cron:<jobId>:<startedAt>` tương ứng. Kết quả cuối cùng tại đó sẽ hoàn tất sổ cái tác vụ; nếu không, cơ chế bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Hoạt động kiểm tra CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng tập hợp tác vụ đang hoạt động trống trong chính tiến trình của nó không chứng minh được rằng một lần chạy do Gateway sở hữu đã biến mất.
  </Accordion>
</AccordionGroup>

## Các loại lịch

| Loại      | Cờ CLI    | Mô tả                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Dấu thời gian một lần (ISO 8601 hoặc tương đối như `20m`)                                                     |
| `every`   | `--every`   | Khoảng thời gian cố định (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | Biểu thức cron 5 trường hoặc 6 trường với `--tz` tùy chọn                                                  |
| `on-exit` | `--on-exit` | Kích hoạt một lần khi lệnh được theo dõi thoát (trình kích hoạt sự kiện; vẫn tồn tại sau khi tháo dỡ lượt; `--on-exit-cwd` tùy chọn) |

Các dấu thời gian không có múi giờ được coi là UTC. Thêm `--tz America/New_York` để diễn giải một thời gian ngày tháng `--at` không có độ lệch, hoặc để đánh giá một biểu thức cron, trong múi giờ IANA đó. Các biểu thức cron không có `--tz` sử dụng múi giờ của máy chủ Gateway. `--tz` không hợp lệ khi dùng với `--every` hoặc `--on-exit`.

Các biểu thức lặp lại vào đầu giờ (phút `0` với trường giờ là ký tự đại diện) được tự động giãn cách tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời gian chính xác hoặc `--stagger 30s` để chỉ định rõ một khoảng thời gian (chỉ dành cho lịch cron).

### Ngày trong tháng và ngày trong tuần sử dụng logic OR

Các biểu thức cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp, không phải cả hai. Đây là hành vi cron Vixie tiêu chuẩn.

```bash
# Dự định: "9 giờ sáng ngày 15, chỉ khi đó là thứ Hai"
# Thực tế: "9 giờ sáng vào mọi ngày 15 VÀ 9 giờ sáng vào mọi thứ Hai"
0 9 15 * 1
```

Lịch này kích hoạt khoảng 5-6 lần mỗi tháng thay vì 0-1 lần mỗi tháng. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của croner (`0 9 15 * +1`), hoặc lên lịch theo một trường và kiểm tra trường còn lại trong lời nhắc hoặc lệnh của tác vụ.

## Trình kích hoạt sự kiện (bộ theo dõi điều kiện)

Trình kích hoạt sự kiện thêm một tập lệnh điều kiện không giao diện vào lịch `every` hoặc `cron`. Cron đánh giá tập lệnh khi tác vụ đến hạn và chỉ chạy nội dung thông thường khi tập lệnh trả về `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Chỉ kích hoạt khi trạng thái quan sát được khác với lần đánh giá trước.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `CI của PR 123: ${trigger.state?.status ?? 'không xác định'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Điều tra thay đổi trạng thái CI." },
}
```

Tập lệnh phải trả về `{ fire, message?, state? }`. Trạng thái JSON trước đó có sẵn dưới dạng `trigger.state` được đóng băng sâu; trả về một giá trị `state` mới để lưu bền vững trạng thái đó. Trạng thái bị giới hạn ở 16 KB. Khi kết quả kích hoạt bao gồm `message`, cron sẽ nối nó vào văn bản sự kiện hệ thống hoặc thông điệp lượt tác nhân trước khi thực thi. `once: true` vô hiệu hóa tác vụ sau khi nội dung được kích hoạt thành công lần đầu.

`fire: false` lưu bền vững trạng thái đánh giá và các bộ đếm, sau đó lên lịch lại mà không tạo lịch sử chạy. Nếu lần chạy nội dung được kích hoạt thất bại, `state` trả về sẽ **không** được lưu bền vững — lần đánh giá tiếp theo nhìn thấy trạng thái trước đó và có thể kích hoạt lại, vì vậy hãy viết tập lệnh dưới dạng phép kiểm tra chỉ đọc và đặt các hành động trong nội dung. Lịch trình kích hoạt có khoảng thời gian tối thiểu có thể cấu hình (mặc định là 30 giây). Mỗi lần đánh giá có ngân sách thời gian thực tế 30 giây và tối đa 5 lệnh gọi công cụ.

<Warning>
Việc bật `cron.triggers.enabled` cho phép các tập lệnh do tác nhân tạo chạy không giao diện với **toàn bộ chính sách công cụ của tác nhân sở hữu, bao gồm `exec`**. Hãy coi đây là hoạt động thực thi mã không có người giám sát với các quyền của tác nhân đó; không bật trừ khi mọi tác nhân được phép tạo tác vụ cron đều đáng tin cậy tương ứng.
</Warning>

Tạo một bộ theo dõi từ tệp tập lệnh cục bộ (`-` đọc tập lệnh từ stdin):

```bash
openclaw cron add \
  --name "Bộ theo dõi CI của PR" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Phản hồi thay đổi trạng thái CI" \
  --session isolated
```

## Nội dung

Mỗi tác vụ chứa chính xác một loại nội dung, được chọn bằng cờ:

| Nội dung       | Cờ                                           | Cách chạy                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Sự kiện hệ thống  | `--system-event <text>`                        | Được đưa vào hàng đợi của phiên chính, bản thân nó không gọi mô hình |
| Thông điệp tác nhân | `--message <text>`                             | Một lượt tác nhân được mô hình hỗ trợ                               |
| Lệnh       | `--command <shell>` hoặc `--command-argv <json>` | Một shell/tiến trình trên máy chủ Gateway, không gọi mô hình      |

### Tùy chọn lượt tác nhân

<ParamField path="--message" type="string" required>
  Văn bản lời nhắc (bắt buộc đối với tác vụ phiên cô lập/hiện tại/tùy chỉnh).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; phải phân giải thành một mô hình được phép, nếu không lượt chạy sẽ thất bại với lỗi xác thực.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Danh sách mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Truyền `--fallbacks ""` để thực hiện lượt chạy nghiêm ngặt không có mô hình dự phòng.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Khi `cron edit`, xóa ghi đè dự phòng theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên dự phòng đã cấu hình. Không thể kết hợp với `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Khi `cron edit`, xóa ghi đè mô hình theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên mô hình cron thông thường (ghi đè phiên cron đã lưu, nếu không thì mô hình của agent/mặc định). Không thể kết hợp với `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức độ suy luận (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Các mức khả dụng vẫn phụ thuộc vào mô hình và môi trường chạy agent đã chọn.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Khi `cron edit`, xóa ghi đè mức độ suy luận theo từng tác vụ. Không thể kết hợp với `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua việc chèn tệp khởi tạo không gian làm việc.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn các công cụ mà tác vụ có thể sử dụng, ví dụ `--tools exec,read`.
</ParamField>

`--model` đặt mô hình chính của tác vụ; tùy chọn này không thay thế ghi đè `/model` của phiên, vì vậy các chuỗi dự phòng đã cấu hình vẫn được áp dụng trên đó. Mô hình không thể phân giải hoặc không được phép sẽ khiến lượt chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm chuyển về mô hình mặc định. Nếu một tác vụ có `--model` nhưng không có danh sách dự phòng rõ ràng hoặc đã cấu hình, OpenClaw sẽ truyền một ghi đè dự phòng rỗng thay vì âm thầm thêm mô hình chính của agent làm đích thử lại ẩn.

Thứ tự ưu tiên chọn mô hình cho tác vụ cô lập, từ cao xuống thấp:

1. Tải trọng theo từng tác vụ `model` (cấu hình rõ ràng; mô hình không được phép sẽ khiến lượt chạy thất bại)
2. Ghi đè mô hình của hook Gmail (chỉ khi lượt chạy bắt nguồn từ Gmail và ghi đè đó được phép)
3. Ghi đè mô hình phiên cron đã lưu do người dùng chọn
4. Lựa chọn mô hình của agent/mặc định

Chế độ nhanh tuân theo lựa chọn trực tiếp đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, cron cô lập sẽ mặc định sử dụng cấu hình đó; ghi đè `fastMode` của phiên đã lưu (sau đó là `fastModeDefault` của agent) vẫn được ưu tiên hơn cấu hình mô hình theo cả hai hướng. Chế độ tự động sử dụng ngưỡng `params.fastAutoOnSeconds` của mô hình, mặc định là 60 giây.

Nếu một lượt chạy gặp thao tác chuyển giao đổi mô hình trực tiếp, cron sẽ thử lại với nhà cung cấp/mô hình đã chuyển và duy trì lựa chọn đó (cùng mọi hồ sơ xác thực mới) cho lượt chạy đang hoạt động. Số lần thử lại có giới hạn: sau lần thử ban đầu cộng thêm 2 lần thử lại do chuyển đổi, cron sẽ hủy thay vì lặp vô hạn.

Trước khi một lượt chạy cô lập bắt đầu, OpenClaw kiểm tra các điểm cuối cục bộ có thể truy cập đối với các nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình có `baseUrl` là loopback, mạng riêng hoặc `.local`. Bước kiểm tra trước này duyệt chuỗi dự phòng đã cấu hình của tác vụ và chỉ đánh dấu lượt chạy là `skipped` sau khi mọi ứng viên đều không thể truy cập; `--fallbacks ""` giữ cho quá trình duyệt này chỉ giới hạn nghiêm ngặt ở mô hình chính. Điểm cuối không hoạt động sẽ ghi nhận lượt chạy là `skipped` với lỗi rõ ràng thay vì bắt đầu lệnh gọi mô hình. Kết quả được lưu vào bộ nhớ đệm trong 5 phút cho mỗi điểm cuối (không phải mỗi tác vụ hoặc mô hình), vì vậy nhiều tác vụ đến hạn cùng dùng chung một máy chủ Ollama/vLLM/SGLang/LM Studio cục bộ không hoạt động chỉ tốn một lần thăm dò thay vì gây ra một cơn bão yêu cầu. Các lượt chạy bị bỏ qua ở bước kiểm tra trước không làm tăng thời gian chờ lùi do lỗi thực thi; đặt `failureAlert.includeSkipped` để bật cảnh báo lặp lại khi bỏ qua.

### Tải trọng lệnh

Tải trọng lệnh chạy các tập lệnh tất định bên trong bộ lập lịch Gateway mà không bắt đầu lượt chạy dựa trên mô hình. Chúng thực thi trên máy chủ Gateway, ghi lại stdout/stderr, ghi nhận lượt chạy trong lịch sử cron và sử dụng lại các chế độ phân phối `announce`, `webhook` và `none` giống như tác vụ lượt chạy agent.

<Note>
Cron lệnh là một bề mặt tự động hóa Gateway dành cho quản trị viên vận hành, không phải lệnh gọi `tools.exec` của agent. Việc tạo, cập nhật, xóa hoặc chạy thủ công tác vụ cron yêu cầu `operator.admin`; các lượt chạy lệnh theo lịch sau đó thực thi bên trong tiến trình Gateway dưới dạng tác vụ tự động hóa do quản trị viên tạo. Chính sách thực thi của agent (`tools.exec.mode`, lời nhắc phê duyệt, danh sách công cụ được phép theo từng agent) chi phối các công cụ thực thi mà mô hình có thể thấy, không chi phối tải trọng cron lệnh.
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

`--command <shell>` lưu trữ `argv: ["sh", "-lc", <shell>]`. Sử dụng `--command-argv '["node","scripts/report.mjs"]'` để thực thi argv chính xác mà không phân tích cú pháp shell. Các tùy chọn `--command-env KEY=VALUE` (có thể lặp lại), `--command-input`, `--timeout-seconds` (mặc định 10 phút), `--no-output-timeout-seconds` và `--output-max-bytes` kiểm soát môi trường tiến trình, stdin và giới hạn đầu ra.

Văn bản được phân phối được lấy từ đầu ra tiến trình: stdout không rỗng được ưu tiên; nếu stdout rỗng và stderr không rỗng, stderr sẽ được phân phối; nếu cả hai đều có nội dung, cron gửi một khối `stdout:` / `stderr:` nhỏ. Mã thoát `0` ghi nhận lượt chạy là `ok`; mã thoát khác 0, tín hiệu, hết thời gian chờ hoặc hết thời gian chờ do không có đầu ra sẽ ghi nhận `error` và có thể kích hoạt cảnh báo lỗi. Một lệnh chỉ in `NO_REPLY` sử dụng cơ chế chặn token im lặng thông thường của cron và không đăng nội dung nào trở lại cuộc trò chuyện.

## Kiểu thực thi

| Kiểu            | Giá trị `--session` | Chạy trong                | Phù hợp nhất cho                 |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Phiên chính     | `main`              | Làn đánh thức cron chuyên dụng | Lời nhắc, sự kiện hệ thống      |
| Cô lập          | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, tác vụ nền             |
| Phiên hiện tại  | `current`           | Được liên kết khi tạo    | Công việc định kỳ theo ngữ cảnh |
| Phiên tùy chỉnh | `session:custom-id` | Phiên có tên được duy trì | Quy trình công việc dựa trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính so với cô lập và tùy chỉnh">
    Các tác vụ **phiên chính** đưa một sự kiện hệ thống vào làn chạy do cron sở hữu và tùy chọn đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Chúng có thể sử dụng ngữ cảnh phân phối gần nhất của phiên chính đích để trả lời, nhưng không thêm các lượt cron thông thường vào làn trò chuyện của con người và không kéo dài độ mới cho việc đặt lại hằng ngày/khi không hoạt động của phiên đích. Các tác vụ **cô lập** chạy một lượt agent chuyên dụng với phiên mới. **Phiên tùy chỉnh** (`session:xxx`) duy trì ngữ cảnh qua các lượt chạy, cho phép các quy trình công việc như họp cập nhật hằng ngày dựa trên những bản tóm tắt trước đó.

    Các sự kiện cron của phiên chính là lời nhắc sự kiện hệ thống độc lập. Chúng không tự động bao gồm chỉ dẫn "Read HEARTBEAT.md" của lời nhắc Heartbeat mặc định; hãy nêu rõ điều đó trong văn bản sự kiện cron nếu lời nhắc cần tham khảo `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="Ý nghĩa của 'phiên mới' đối với tác vụ cô lập">
    Mỗi lượt chạy có một bản ghi hội thoại/ID phiên mới. OpenClaw mang theo các tùy chọn an toàn (cài đặt suy luận/nhanh/chi tiết, nhãn, ghi đè mô hình/xác thực rõ ràng do người dùng chọn), nhưng không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng cron cũ: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc hoặc liên kết môi trường chạy ACP. Sử dụng `current` hoặc `session:<id>` khi một tác vụ định kỳ cần chủ ý dựa trên cùng một ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Phân phối subagent và Discord">
    Khi các lượt cron cô lập điều phối các subagent, việc phân phối ưu tiên đầu ra cuối cùng của hậu duệ hơn văn bản tạm thời đã cũ của tiến trình cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw sẽ chặn bản cập nhật một phần của tiến trình cha thay vì thông báo nó.

    Đối với các đích thông báo Discord chỉ có văn bản, OpenClaw gửi văn bản cuối cùng chuẩn của trợ lý một lần thay vì phát lại cả văn bản được truyền phát/trung gian và câu trả lời cuối cùng. Nội dung đa phương tiện và tải trọng Discord có cấu trúc vẫn được phân phối riêng để không làm mất tệp đính kèm và thành phần.

  </Accordion>
</AccordionGroup>

## Phân phối và đầu ra

| Chế độ     | Điều xảy ra                                                         |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Phân phối dự phòng văn bản cuối cùng đến đích nếu agent chưa gửi |
| `webhook`  | POST tải trọng sự kiện hoàn tất đến một URL                      |
| `none`     | Không phân phối dự phòng từ trình chạy                          |

Sử dụng `--announce --channel telegram --to "-1001234567890"` để phân phối qua kênh. Đối với chủ đề diễn đàn Telegram, sử dụng `-1001234567890:topic:123`; OpenClaw cũng chấp nhận dạng viết tắt `-1001234567890:123` do Telegram sở hữu. Các bên gọi RPC/cấu hình trực tiếp có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Đích Slack/Discord/Mattermost sử dụng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; sử dụng ID phòng chính xác hoặc dạng `room:!room:server` từ Matrix.

Khi phân phối thông báo sử dụng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron chuyển sang lịch sử phiên hoặc một kênh duy nhất đã cấu hình. Chỉ các tiền tố do Plugin đã tải công bố mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được chỉ định rõ ràng, tiền tố đích phải nêu cùng một nhà cung cấp; `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối thay vì cho phép WhatsApp diễn giải ID Telegram thành số điện thoại. Tiền tố loại đích và dịch vụ (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Đối với tác vụ cô lập, việc phân phối trò chuyện được dùng chung: nếu có tuyến trò chuyện, agent có thể sử dụng công cụ `message` ngay cả với `--no-deliver`. Nếu agent gửi đến đích đã cấu hình/hiện tại, OpenClaw sẽ bỏ qua thông báo dự phòng. Nếu không, `announce`, `webhook` và `none` chỉ kiểm soát cách trình chạy xử lý câu trả lời cuối cùng sau lượt agent.

Khi một agent tạo lời nhắc cô lập từ cuộc trò chuyện đang hoạt động, OpenClaw lưu đích phân phối trực tiếp đã bảo toàn cho tuyến thông báo dự phòng. Khóa phiên nội bộ có thể viết thường; đích phân phối của nhà cung cấp không được tái tạo từ các khóa đó khi có ngữ cảnh trò chuyện hiện tại.

Phân phối thông báo ngầm định sử dụng danh sách kênh được phép đã cấu hình để xác thực và định tuyến lại các đích cũ. Các phê duyệt trong kho ghép cặp DM không phải là người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ theo lịch cần chủ động gửi đến DM.

### Thông báo lỗi

Thông báo lỗi tuân theo một đường dẫn đích riêng:

- `cron.failureDestination` đặt giá trị mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè giá trị đó theo từng tác vụ.
- Nếu không giá trị nào được đặt và tác vụ đã gửi qua `announce`, thông báo lỗi sẽ dùng mục tiêu thông báo chính đó làm phương án dự phòng.
- `delivery.failureDestination` chỉ được hỗ trợ trên các tác vụ `sessionTarget="isolated"`, trừ khi chế độ gửi chính là `webhook`.
- `failureAlert.includeSkipped: true` cho phép chính sách cảnh báo cron của tác vụ hoặc toàn cục gửi cảnh báo lặp lại về các lượt chạy bị bỏ qua. Các lượt chạy bị bỏ qua duy trì bộ đếm số lần bỏ qua liên tiếp riêng, nên không ảnh hưởng đến cơ chế lùi thời gian khi có lỗi thực thi.
- `openclaw cron edit` cung cấp khả năng tinh chỉnh cảnh báo theo từng tác vụ: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` và `--failure-alert-account-id`.

### Ngôn ngữ đầu ra

Các tác vụ Cron không suy ra ngôn ngữ trả lời từ kênh, ngôn ngữ bản địa hoặc tin nhắn trước đó. Hãy đưa quy tắc ngôn ngữ vào tin nhắn hoặc mẫu đã lên lịch:

```bash
openclaw cron edit <jobId> \
  --message "Tóm tắt các cập nhật. Trả lời bằng tiếng Trung; giữ nguyên URL, mã và tên sản phẩm."
```

Đối với tệp mẫu, hãy giữ chỉ dẫn ngôn ngữ trong lời nhắc đã kết xuất và xác minh rằng các phần giữ chỗ như `{{language}}` đã được điền trước khi tác vụ chạy. Nếu đầu ra trộn lẫn nhiều ngôn ngữ, hãy nêu rõ quy tắc, ví dụ: "Sử dụng tiếng Trung cho văn bản diễn giải và giữ các thuật ngữ kỹ thuật bằng tiếng Anh."

## Ví dụ CLI

<Tabs>
  <Tab title="Lời nhắc chạy một lần">
    ```bash
    openclaw cron add \
      --name "Kiểm tra lịch" \
      --at "20m" \
      --session main \
      --system-event "Heartbeat tiếp theo: kiểm tra lịch." \
      --wake now
    ```
  </Tab>
  <Tab title="Tác vụ cô lập định kỳ">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Tóm tắt các cập nhật qua đêm." \
      --name "Bản tin buổi sáng" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Ghi đè mô hình và chế độ suy luận">
    ```bash
    openclaw cron add \
      --name "Phân tích chuyên sâu" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Phân tích chuyên sâu hằng tuần về tiến độ dự án." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Đầu ra Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Tóm tắt các lần triển khai hôm nay dưới dạng JSON." \
      --name "Bản tổng hợp triển khai" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Đầu ra lệnh">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Kiểm tra độ sâu hàng đợi" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Quản lý tác vụ

```bash
# Liệt kê tất cả tác vụ
openclaw cron list

# Lấy một tác vụ đã lưu dưới dạng JSON
openclaw cron get <jobId>

# Hiển thị một tác vụ, bao gồm tuyến gửi đã phân giải
openclaw cron show <jobId>

# Bật/tắt mà không xóa
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Chỉnh sửa tác vụ
openclaw cron edit <jobId> --message "Lời nhắc đã cập nhật" --model "opus"

# Buộc chạy tác vụ ngay
openclaw cron run <jobId>

# Buộc chạy tác vụ ngay và chờ trạng thái kết thúc
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Chỉ chạy nếu đến hạn
openclaw cron run <jobId> --due

# Xem lịch sử chạy
openclaw cron runs --id <jobId> --limit 50

# Xem chính xác một lượt chạy
openclaw cron runs --id <jobId> --run-id <runId>

# Xóa tác vụ
openclaw cron remove <jobId>

# Chọn tác nhân (thiết lập đa tác nhân)
openclaw cron create "0 6 * * *" "Kiểm tra hàng đợi vận hành" --name "Rà soát vận hành" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Việc lưu trữ một phiên (trong Control UI hoặc qua `sessions.patch { archived: true }` từ bên gọi có quyền quản trị vận hành) sẽ vô hiệu hóa mọi tác vụ cron đang bật được liên kết với phiên đó: phiên `cron:<jobId>` cô lập của tác vụ, mục tiêu `session:<key>` hoặc luồng gửi/đánh thức `sessionKey`. Khôi phục phiên không bật lại các tác vụ đó; hãy sử dụng `openclaw cron enable <jobId>`. Các phiên có tác vụ liên kết đang bật sẽ hiển thị huy hiệu đồng hồ trong thanh bên của Control UI.

`openclaw cron run <jobId>` trả về sau khi đưa lượt chạy thủ công vào hàng đợi. Hãy dùng `--wait` cho hook tắt hệ thống, tập lệnh bảo trì hoặc quy trình tự động hóa khác phải chặn cho đến khi lượt chạy trong hàng đợi hoàn tất; lệnh này thăm dò `runId` được trả về (thời gian chờ mặc định `10m`, khoảng thời gian thăm dò `2s`) và thoát với mã `0` khi trạng thái là `ok`, hoặc mã khác 0 khi trạng thái là `error`, `skipped` hay khi hết thời gian chờ.

Công cụ `cron` của tác nhân trả về bản tóm tắt tác vụ ngắn gọn (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) từ `cron(action: "list")`; hãy dùng `cron(action: "get", jobId: "...")` để lấy định nghĩa đầy đủ của một tác vụ. Bên gọi Gateway trực tiếp có thể truyền `compact: true` vào `cron.list`; nếu bỏ qua, phản hồi đầy đủ kèm bản xem trước việc gửi sẽ được giữ nguyên.

`openclaw cron create` là bí danh của `openclaw cron add`. Tác vụ mới có thể sử dụng lịch biểu theo vị trí (`"0 9 * * 1"`, `"every 1h"`, `"20m"` hoặc dấu thời gian ISO), theo sau là lời nhắc tác nhân theo vị trí. Hãy dùng `--webhook <url>` trên `cron add|create` hoặc `cron edit` để POST tải trọng của lượt chạy đã hoàn tất đến một điểm cuối HTTP; gửi qua webhook không thể kết hợp với các cờ gửi qua trò chuyện (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). Trên `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` và `--clear-account`, hãy bỏ đặt riêng từng trường định tuyến đó (mỗi trường sẽ bị từ chối nếu đi cùng cờ đặt tương ứng) — khác với `--no-deliver`, vốn chỉ vô hiệu hóa phương án gửi dự phòng của trình chạy.

<Note>
Lưu ý về ghi đè mô hình:

- `openclaw cron add|edit --model ...` thay đổi mô hình được chọn cho tác vụ.
- Nếu mô hình được phép, chính xác nhà cung cấp/mô hình đó sẽ được chuyển đến lượt chạy tác nhân cô lập.
- Nếu mô hình không được phép hoặc không thể phân giải, cron sẽ làm lượt chạy thất bại với lỗi xác thực rõ ràng.
- Các bản vá tải trọng `cron.update` của API có thể đặt `model: null` để xóa giá trị ghi đè mô hình đã lưu của tác vụ.
- `openclaw cron edit <job-id> --clear-model` xóa giá trị ghi đè đó khỏi CLI (có cùng tác dụng với bản vá `model: null`) và không thể kết hợp với `--model`.
- Các chuỗi dự phòng đã cấu hình vẫn được áp dụng vì `--model` của cron là mô hình chính của tác vụ, không phải giá trị ghi đè `/model` của phiên.
- `openclaw cron add|edit --fallbacks ...` đặt tải trọng `fallbacks`, thay thế các phương án dự phòng đã cấu hình cho tác vụ đó; `--fallbacks ""` vô hiệu hóa phương án dự phòng và buộc lượt chạy tuân thủ nghiêm ngặt. `openclaw cron edit <job-id> --clear-fallbacks` xóa giá trị ghi đè theo từng tác vụ.
- Một `--model` thuần túy không có danh sách dự phòng rõ ràng hoặc đã cấu hình sẽ không âm thầm chuyển sang mô hình chính của tác nhân như một mục tiêu thử lại bổ sung.

</Note>

## Webhook

Gateway có thể cung cấp các điểm cuối webhook HTTP cho tác nhân kích hoạt bên ngoài. Bật trong cấu hình:

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

Mọi yêu cầu phải bao gồm token của hook qua tiêu đề:

- `Authorization: Bearer <token>` (khuyến nghị)
- `x-openclaw-token: <token>`

Token trong chuỗi truy vấn sẽ bị từ chối.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Đưa một sự kiện hệ thống vào hàng đợi cho phiên chính:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Đã nhận email mới","mode":"now"}'
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
      -d '{"message":"Tóm tắt hộp thư đến","name":"Email","model":"openai/gpt-5.6-sol"}'
    ```

    Các trường: `message` (bắt buộc), `name`, `agentId`, `sessionKey` (yêu cầu `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook được ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải qua `hooks.mappings` trong cấu hình. Các ánh xạ có thể chuyển đổi tải trọng tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc phép chuyển đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Giữ các điểm cuối hook phía sau giao diện loopback, tailnet hoặc proxy ngược đáng tin cậy.

- Sử dụng token riêng cho hook; không tái sử dụng token xác thực của gateway.
- Giữ `hooks.path` trên một đường dẫn con riêng; `/` sẽ bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn tác nhân hiệu lực mà hook có thể nhắm đến, bao gồm cả tác nhân mặc định khi `agentId` bị bỏ qua.
- Giữ `hooks.allowRequestSessionKey=false` trừ khi cần các phiên do bên gọi lựa chọn.
- Nếu bật `hooks.allowRequestSessionKey`, hãy đặt cả `hooks.allowedSessionKeyPrefixes` để giới hạn các dạng khóa phiên được phép.
- Theo mặc định, tải trọng hook được bao bọc bằng các ranh giới an toàn.

</Warning>

## Tích hợp Gmail PubSub

Kết nối tác nhân kích hoạt hộp thư đến Gmail với OpenClaw qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw đã bật, Tailscale cho điểm cuối HTTPS công khai.
</Note>

### Thiết lập bằng trình hướng dẫn (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật cấu hình đặt sẵn của Gmail và mặc định sử dụng Tailscale Funnel cho điểm cuối đẩy (`--tailscale funnel|serve|off`).

<Warning>
Phiên theo từng tin nhắn của cấu hình đặt sẵn Gmail tách biệt ngữ cảnh hội thoại; phiên này không hạn chế công cụ hoặc không gian làm việc của tác nhân đích. Nếu không có ánh xạ tùy chỉnh đặt `agentId`, hook Gmail sẽ chạy dưới tác nhân mặc định.

Đối với hộp thư đến không đáng tin cậy, hãy định tuyến hook đến một tác nhân đọc chuyên dụng, chỉ cấp cho tác nhân đó quyền truy cập chỉ đọc hoặc không cấp quyền truy cập không gian làm việc, đồng thời từ chối quyền ghi hệ thống tệp, shell, trình duyệt và các công cụ không cần thiết khác. Nếu tác nhân cần thông báo cho tác nhân chính, chỉ cho phép hoạt động bàn giao giữa các tác nhân cần thiết. Xem [Chèn lời nhắc](/vi/gateway/security#prompt-injection), [Hộp cát và công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools) và [`tools.agentToAgent`](/vi/gateway/config-tools#toolsagenttoagent).
</Warning>

### Tự động khởi động Gateway

Khi `hooks.enabled=true` được bật và `hooks.gmail.account` được đặt, Gateway sẽ khởi động `gog gmail watch serve` khi khởi động và tự động gia hạn hoạt động theo dõi. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để không sử dụng tính năng này.

### Thiết lập thủ công một lần

<Steps>
  <Step title="Chọn dự án GCP">
    Chọn dự án GCP sở hữu ứng dụng OAuth do `gog` sử dụng:

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
  <Step title="Bắt đầu theo dõi">
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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Đối với hộp thư đến không đáng tin cậy, hãy sử dụng mô hình thế hệ mới nhất, thuộc phân hạng tốt nhất hiện có từ nhà cung cấp của bạn. Giá trị trên chỉ là ví dụ; mô hình phải tồn tại trong danh mục và danh sách cho phép đã cấu hình.

## Cấu hình

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

Các giá trị `retry` ở trên là giá trị mặc định: thử lại tối đa 3 lần với khoảng lùi `30s/60s/5m`, áp dụng cho cả năm loại lỗi tạm thời. `webhookToken` được gửi dưới dạng `Authorization: Bearer <token>` trong các yêu cầu POST Webhook của Cron.

`maxConcurrentRuns` giới hạn cả việc điều phối Cron theo lịch và thực thi lượt tác nhân cô lập, với giá trị mặc định là 8. Các lượt tác nhân Cron cô lập sử dụng nội bộ làn thực thi `cron-nested` chuyên dụng của hàng đợi, vì vậy việc tăng giá trị này cho phép các lần chạy LLM Cron độc lập tiến hành song song thay vì chỉ khởi động các trình bao Cron bên ngoài. Thiết lập này không mở rộng làn `nested` dùng chung không thuộc Cron.

`cron.store` là khóa kho lưu trữ logic và đường dẫn di chuyển của doctor, không phải tệp JSON đang hoạt động để chỉnh sửa thủ công. Dữ liệu tác vụ nằm trong SQLite; hãy dùng CLI hoặc API Gateway để thay đổi.

Tắt Cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại một lần chạy**: các lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, hết thời gian chờ, lỗi máy chủ) được thử lại tối đa `retry.maxAttempts` lần (mặc định 3) bằng `retry.backoffMs` (mặc định 30s, 60s, 5m). Lỗi vĩnh viễn sẽ vô hiệu hóa tác vụ ngay lập tức.

    **Thử lại định kỳ**: các lỗi thực thi liên tiếp sẽ lùi theo lịch mở rộng (30s, 60s, 5m, 15m, 60m). Khoảng lùi được đặt lại sau lần chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`, `false` sẽ vô hiệu hóa) dọn bỏ các mục phiên chạy cô lập. Lịch sử chạy giữ lại 2000 hàng trạng thái kết thúc mới nhất cho mỗi tác vụ; các hàng bị thất lạc vẫn giữ khoảng thời gian dọn dẹp 24 giờ.
  </Accordion>
  <Accordion title="Di chuyển kho lưu trữ cũ">
    Khi nâng cấp, hãy chạy `openclaw doctor --fix` để nhập các tệp `~/.openclaw/cron/jobs.json`, `jobs-state.json` và `runs/*.jsonl` cũ vào SQLite rồi đổi tên chúng với hậu tố `.migrated`. Các hàng tác vụ sai định dạng bị bỏ qua khi chạy và được sao chép vào `jobs-quarantine.json` để sửa chữa hoặc xem xét sau.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

### Trình tự lệnh

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
    - Đối với lịch `cron`, hãy xác minh múi giờ (`--tz`) so với múi giờ của máy chủ.
    - `reason: not-due` trong đầu ra chạy có nghĩa là lần chạy thủ công được kiểm tra bằng `openclaw cron run <jobId> --due` và tác vụ chưa đến hạn.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không chuyển gửi">
    - Chế độ chuyển gửi `none` có nghĩa là không dự kiến gửi dự phòng từ trình chạy. Tác nhân vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
    - Đích chuyển gửi bị thiếu/không hợp lệ (`channel`/`to`) có nghĩa là lượt gửi ra ngoài đã bị bỏ qua.
    - Đối với Matrix, các tác vụ được sao chép hoặc tác vụ cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Hãy sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) có nghĩa là thông tin xác thực đã chặn việc chuyển gửi.
    - Nếu lần chạy cô lập chỉ trả về mã thông báo im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn cả việc chuyển gửi trực tiếp ra ngoài lẫn đường dẫn tóm tắt dự phòng trong hàng đợi, nên không có nội dung nào được đăng lại vào cuộc trò chuyện.
    - Nếu tác nhân cần tự gửi tin nhắn cho người dùng, hãy kiểm tra rằng tác vụ có tuyến khả dụng (`channel: "last"` với một cuộc trò chuyện trước đó hoặc một kênh/đích rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat có vẻ ngăn việc chuyển phiên kiểu /new">
    - Độ mới của việc đặt lại hằng ngày và khi không hoạt động không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức Cron, lần chạy Heartbeat, thông báo exec và thao tác ghi sổ của Gateway có thể cập nhật hàng phiên phục vụ định tuyến/trạng thái, nhưng không kéo dài `sessionStartedAt` hoặc `lastInteractionAt`.
    - Đối với các hàng cũ được tạo trước khi những trường này tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ tiêu đề phiên trong bản chép lời JSONL khi tệp vẫn còn. Các hàng cũ không hoạt động không có `lastInteractionAt` sẽ sử dụng thời gian bắt đầu đã khôi phục đó làm mốc không hoạt động.

  </Accordion>
  <Accordion title="Các điểm dễ nhầm về múi giờ">
    - Cron không có `--tz` sẽ sử dụng múi giờ của máy chủ Gateway.
    - Lịch `at` không có múi giờ được xem là UTC.
    - `activeHours` của Heartbeat sử dụng cơ chế phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa](/vi/automation) — tổng quan nhanh về tất cả cơ chế tự động hóa
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho các lần thực thi Cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
