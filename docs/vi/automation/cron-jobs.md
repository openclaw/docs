---
read_when:
    - Lập lịch tác vụ nền hoặc đánh thức
    - Kết nối các trigger bên ngoài (webhook, Gmail) vào OpenClaw
    - Lựa chọn giữa heartbeat và cron cho các tác vụ theo lịch
sidebarTitle: Scheduled tasks
summary: Tác vụ theo lịch, webhook và trình kích hoạt Gmail PubSub cho bộ lập lịch Gateway
title: Tác vụ theo lịch
x-i18n:
    generated_at: "2026-07-20T04:19:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3365e59e06517169306425b639d45082e3331616c4c62b5f05e5e2b8181fc212
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron là trình lập lịch tích hợp sẵn của Gateway. Cron lưu bền vững các công việc, đánh thức tác tử vào đúng thời điểm và có thể gửi đầu ra đến một kênh trò chuyện, Webhook hoặc không gửi đi đâu cả.

## Bắt đầu nhanh

<Steps>
  <Step title="Thêm lời nhắc chạy một lần">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Kiểm tra các công việc">
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

## Cách Cron hoạt động

- Cron chạy **bên trong tiến trình Gateway**, không phải bên trong mô hình. Gateway phải đang chạy thì lịch mới được kích hoạt.
- Định nghĩa công việc, trạng thái thời gian chạy và lịch sử chạy được lưu bền vững trong cơ sở dữ liệu trạng thái SQLite dùng chung của OpenClaw, vì vậy việc khởi động lại không làm mất lịch.
- Mỗi lần thực thi Cron tạo một bản ghi [tác vụ nền](/vi/automation/tasks).
- Theo mặc định, các công việc chạy một lần (`--at`) sẽ tự động bị xóa sau khi thành công; truyền `--keep-after-run` để giữ lại.
- Ngân sách thời gian thực tế cho mỗi lần chạy: `--timeout-seconds` khi được đặt. Nếu không, các công việc lượt tác tử cô lập/tách rời bị giới hạn bởi bộ giám sát 60 phút riêng của Cron trước khi thời gian chờ lượt tác tử bên dưới (`agents.defaults.timeoutSeconds`, mặc định 48 giờ) có thể được áp dụng; công việc lệnh mặc định là 10 phút và tải trọng tập lệnh mặc định là 5 phút.
- Khi Gateway khởi động, các công việc lượt tác tử cô lập đã quá hạn được lên lịch lại thay vì phát lại ngay lập tức, giúp công việc khởi tạo mô hình/công cụ không diễn ra trong khoảng thời gian kết nối kênh.
- Nếu bạn điều khiển `openclaw agent` bằng Cron hệ thống hoặc một trình lập lịch bên ngoài khác, hãy bọc nó bằng cơ chế leo thang buộc dừng ngay cả khi CLI đã xử lý `SIGTERM`/`SIGINT`. Các lần chạy dựa trên Gateway yêu cầu Gateway hủy những lần chạy đã được chấp nhận; các lần chạy dự phòng cục bộ và nhúng nhận cùng tín hiệu hủy. Với GNU `timeout`, nên dùng `timeout -k 60 600 openclaw agent ...` thay vì chỉ dùng `timeout 600 ...` — giá trị `-k` là biện pháp dự phòng nếu tiến trình không thể kết thúc kịp thời. Với các đơn vị systemd, hãy dùng tín hiệu dừng `SIGTERM` với khoảng thời gian gia hạn (`TimeoutStopSec`) trước khi buộc dừng cuối cùng. Việc sử dụng lại một `--run-id` khi lần chạy Gateway ban đầu vẫn đang hoạt động sẽ báo cáo bản trùng lặp là đang thực thi thay vì bắt đầu lần chạy thứ hai.

<AccordionGroup>
  <Accordion title="Gia cố lần chạy cô lập">
    - Khi hoàn tất, các lần chạy cô lập cố gắng tối đa để đóng những thẻ/tiến trình trình duyệt được theo dõi cho phiên `cron:<jobId>` của chúng, đồng thời hủy mọi phiên bản thời gian chạy MCP đi kèm được tạo cho công việc thông qua cùng đường dẫn dọn dẹp dùng chung mà các lần chạy phiên chính và phiên tùy chỉnh sử dụng. Lỗi dọn dẹp được bỏ qua để kết quả Cron vẫn được ưu tiên.
    - Các lần chạy cô lập có quyền tự dọn dẹp Cron giới hạn có thể đọc trạng thái trình lập lịch, danh sách tự lọc chỉ chứa công việc của chính chúng và lịch sử chạy của công việc đó, đồng thời chỉ có thể xóa công việc của chính chúng.
    - Các lần chạy cô lập có cơ chế bảo vệ khỏi phản hồi xác nhận lỗi thời: nếu kết quả đầu tiên chỉ là bản cập nhật trạng thái tạm thời (`on it`, `pulling everything together` và các gợi ý tương tự) và không còn tác tử con hậu duệ nào chịu trách nhiệm về câu trả lời cuối cùng, OpenClaw sẽ nhắc lại một lần để lấy kết quả thực tế trước khi gửi.
    - Siêu dữ liệu từ chối thực thi có cấu trúc (bao gồm các trình bao bọc `UNAVAILABLE` của máy chủ Node có lỗi lồng nhau bắt đầu bằng `SYSTEM_RUN_DENIED` hoặc `INVALID_REQUEST`) được nhận diện để lệnh bị chặn không bị báo cáo là một lần chạy thành công, trong khi văn xuôi thông thường của trợ lý không bị nhầm là lời từ chối.
    - Lỗi tác tử ở cấp lần chạy được tính là lỗi công việc ngay cả khi không có tải trọng phản hồi, vì vậy lỗi mô hình/nhà cung cấp làm tăng bộ đếm lỗi và kích hoạt thông báo lỗi thay vì đánh dấu công việc là thành công.
    - Khi một công việc đạt `timeoutSeconds`, Cron hủy lần chạy và cấp cho nó một khoảng thời gian dọn dẹp ngắn. Nếu lần chạy không kết thúc, cơ chế dọn dẹp do Gateway sở hữu sẽ buộc xóa quyền sở hữu phiên của lần chạy đó trước khi Cron ghi nhận hết thời gian chờ, để công việc trò chuyện trong hàng đợi không bị kẹt phía sau một phiên xử lý lỗi thời.
    - Tình trạng đình trệ khi thiết lập/khởi động nhận thời gian chờ riêng theo từng giai đoạn (ví dụ `cron: isolated agent setup timed out before runner start` hoặc `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Các bộ giám sát này bao phủ cả nhà cung cấp nhúng và nhà cung cấp dựa trên CLI ngay cả trước khi tiến trình CLI bên ngoài của chúng khởi động, đồng thời được giới hạn độc lập với các giá trị `timeoutSeconds` dài để lỗi khởi động nguội/xác thực/ngữ cảnh xuất hiện nhanh chóng.

  </Accordion>
  <Accordion title="Đối soát tác vụ">
    Quá trình đối soát tác vụ Cron trước hết thuộc quyền sở hữu của thời gian chạy, sau đó mới dựa trên lịch sử bền vững: một tác vụ Cron đang hoạt động vẫn tiếp tục hoạt động khi thời gian chạy Cron còn theo dõi công việc đó là đang chạy, ngay cả khi vẫn còn một hàng phiên con cũ. Khi thời gian chạy không còn sở hữu công việc và khoảng thời gian gia hạn 5 phút đã hết, các bước kiểm tra bảo trì sẽ kiểm tra nhật ký chạy và trạng thái công việc được lưu bền vững cho lần chạy `cron:<jobId>:<startedAt>` tương ứng. Kết quả kết thúc tại đó sẽ hoàn tất sổ cái tác vụ; nếu không, cơ chế bảo trì do Gateway sở hữu có thể đánh dấu tác vụ là `lost`. Quá trình kiểm tra CLI ngoại tuyến có thể khôi phục từ lịch sử bền vững, nhưng tập hợp công việc đang hoạt động trong tiến trình của chính nó bị rỗng không chứng minh rằng một lần chạy do Gateway sở hữu đã biến mất.
  </Accordion>
</AccordionGroup>

## Các loại lịch

| Loại      | Cờ CLI    | Mô tả                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Dấu thời gian chạy một lần (ISO 8601 hoặc tương đối như `20m`)                                                     |
| `every`   | `--every`   | Khoảng thời gian cố định (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | Biểu thức Cron 5 trường hoặc 6 trường với `--tz` tùy chọn                                                  |
| `on-exit` | `--on-exit` | Kích hoạt một lần khi lệnh được theo dõi thoát (trình kích hoạt sự kiện; tồn tại sau khi lượt bị hủy; `--on-exit-cwd` tùy chọn) |

Các dấu thời gian không có múi giờ được xem là UTC. Thêm `--tz America/New_York` để diễn giải một giá trị ngày giờ `--at` không có độ lệch, hoặc để đánh giá một biểu thức Cron, trong múi giờ IANA đó. Các biểu thức Cron không có `--tz` sử dụng múi giờ của máy chủ Gateway. `--tz` không hợp lệ với `--every` hoặc `--on-exit`.

Các biểu thức lặp lại vào đầu giờ (phút `0` với trường giờ là ký tự đại diện) được tự động phân tán tối đa 5 phút để giảm đột biến tải. Dùng `--exact` để buộc thời gian chính xác hoặc `--stagger 30s` để đặt khoảng thời gian rõ ràng (chỉ dành cho lịch Cron).

### Nhịp động (điều tiết)

Các công việc lặp lại có thể đặt `pacing.min` và/hoặc `pacing.max` thành chuỗi thời lượng như `15m` hoặc `4h`; cần ít nhất một giới hạn. Dùng `--pacing-min` và `--pacing-max` với `cron add|edit` (`--clear-pacing` xóa cả hai giới hạn).

Trong một lần chạy cô lập, công việc có điều tiết có thể gọi công cụ `cron` với `action: "next_check"` và `in: "30m"`. Đề xuất chỉ áp dụng cho công việc hiện đang chạy đó và được tính từ khi lần chạy hoàn tất thành công. OpenClaw âm thầm giới hạn đề xuất trong các giới hạn đã cấu hình.

Việc điều tiết không có đề xuất sẽ giữ nguyên lịch thông thường. Các lần chạy thất bại, hết thời gian chờ và bị bỏ qua sẽ loại bỏ đề xuất, vì vậy hành vi thử lại và tăng thời gian chờ khi có lỗi hiện tại được ưu tiên. Việc buộc chạy thủ công một công việc lặp lại nằm ngoài luồng và giữ nguyên khung giờ tự nhiên hoặc được điều tiết đang chờ. Với các công việc được kích hoạt theo điều kiện, khoảng thời gian tối thiểu tích hợp vẫn là giới hạn dưới ngay cả khi đề xuất yêu cầu kiểm tra sớm hơn.

### Ngày trong tháng và ngày trong tuần sử dụng logic OR

Các biểu thức Cron được phân tích bởi [croner](https://github.com/Hexagon/croner). Khi cả trường ngày trong tháng và ngày trong tuần đều không phải ký tự đại diện, croner khớp khi **một trong hai** trường khớp, không phải cả hai. Đây là hành vi Cron Vixie tiêu chuẩn.

```bash
# Mục đích: "9 giờ sáng ngày 15, chỉ khi đó là thứ Hai"
# Thực tế:  "9 giờ sáng vào mọi ngày 15, VÀ 9 giờ sáng vào mọi thứ Hai"
0 9 15 * 1
```

Lịch này kích hoạt khoảng 5-6 lần mỗi tháng thay vì 0-1 lần mỗi tháng. Để yêu cầu cả hai điều kiện, hãy dùng bộ sửa đổi ngày trong tuần `+` của croner (`0 9 15 * +1`), hoặc lập lịch theo một trường và kiểm tra trường còn lại trong lời nhắc hoặc lệnh của công việc.

## Trình kích hoạt sự kiện (trình theo dõi điều kiện)

Trình kích hoạt sự kiện thêm một tập lệnh điều kiện không giao diện vào lịch `every` hoặc `cron`. Cron đánh giá tập lệnh khi đến hạn công việc và chỉ chạy tải trọng thông thường khi tập lệnh trả về `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Chỉ kích hoạt khi trạng thái quan sát được khác với lần đánh giá trước.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investigate the CI status change." },
}
```

Tập lệnh phải trả về `{ fire, message?, state? }`. Trạng thái JSON trước đó có sẵn dưới dạng `trigger.state` được đóng băng sâu; trả về một giá trị `state` mới để lưu bền vững trạng thái đó. Trạng thái được giới hạn ở 16 KB. Khi kết quả kích hoạt bao gồm `message`, Cron nối nó vào văn bản sự kiện hệ thống hoặc thông điệp lượt tác tử trước khi thực thi. `once: true` vô hiệu hóa công việc sau tải trọng được kích hoạt thành công đầu tiên.

`fire: false` lưu bền vững trạng thái đánh giá và các bộ đếm, sau đó lên lịch lại mà không tạo lịch sử chạy. Nếu lần chạy tải trọng được kích hoạt thất bại, `state` được trả về sẽ **không** được lưu bền vững — lần đánh giá tiếp theo thấy trạng thái trước đó và có thể kích hoạt lại, vì vậy hãy viết tập lệnh dưới dạng phép kiểm tra chỉ đọc và giữ các hành động trong tải trọng. Lịch trình kích hoạt có khoảng thời gian tối thiểu có thể cấu hình (mặc định là 30 giây). Mỗi lần đánh giá có ngân sách thời gian thực tế là 30 giây và tối đa 5 lần gọi công cụ.

Hãy xây dựng trình theo dõi dựa trên **trạng thái có thể hành động**, không chỉ thành công: một trình theo dõi ngừng phản hồi khi phép kiểm tra thất bại hoặc hết thời gian chờ sẽ có vẻ vẫn hoạt động tốt dù đã hỏng. So sánh quan sát với `trigger.state` và trả về trạng thái mới để loại bỏ trùng lặp; không dựa vào bộ nhớ của mô hình hoặc tiến trình. Khi kích hoạt, hãy làm cho `message` tự chứa đầy đủ thông tin vì nó trở thành toàn bộ ngữ cảnh sự kiện của lần chạy được kích hoạt.

<Warning>
Việc bật `cron.triggers.enabled` cho phép cả tập lệnh kích hoạt theo điều kiện và tải trọng `script` chạy không giao diện với **toàn bộ chính sách công cụ của tác tử sở hữu, bao gồm `exec`**. Hãy xem đây là việc thực thi mã không giám sát với quyền của tác tử đó; giữ tính năng này ở trạng thái tắt trừ khi mọi tác tử được phép tạo công việc Cron đều được tin cậy tương ứng.
</Warning>

Tạo một trình theo dõi từ tệp tập lệnh cục bộ (`-` đọc tập lệnh từ đầu vào chuẩn):

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Respond to the CI status change" \
  --session isolated
```

## Tải trọng

Mỗi công việc mang chính xác một loại tải trọng, được chọn bằng cờ:

| Tải trọng       | Cờ                                           | Cách chạy                                                       |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Sự kiện hệ thống  | `--system-event <text>`                        | Được đưa vào hàng đợi của phiên chính, tự nó không gọi mô hình    |
| Thông báo của tác tử | `--message <text>`                             | Một lượt tác tử được mô hình hỗ trợ                                  |
| Lệnh       | `--command <shell>` hoặc `--command-argv <json>` | Một shell/tiến trình trên máy chủ Gateway, không gọi mô hình         |
| Tập lệnh        | `--script <file\|->`                           | Một tập lệnh chế độ mã không giao diện, sử dụng các công cụ của tác tử sở hữu |

### Tùy chọn lượt tác tử

<ParamField path="--message" type="string" required>
  Văn bản lời nhắc (bắt buộc đối với các tác vụ phiên cô lập/hiện tại/tùy chỉnh).
</ParamField>
<ParamField path="--model" type="string">
  Ghi đè mô hình; phải phân giải thành một mô hình được phép, nếu không lượt chạy sẽ thất bại với lỗi xác thực.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Danh sách mô hình dự phòng theo từng tác vụ, ví dụ `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Truyền `--fallbacks ""` để chạy nghiêm ngặt không có mô hình dự phòng.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Với `cron edit`, xóa ghi đè dự phòng theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên dự phòng đã cấu hình. Không thể kết hợp với `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Với `cron edit`, xóa ghi đè mô hình theo từng tác vụ để tác vụ tuân theo thứ tự ưu tiên mô hình Cron thông thường (ghi đè phiên Cron đã lưu, nếu không thì mô hình tác tử/mặc định). Không thể kết hợp với `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Ghi đè mức suy luận (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Các mức khả dụng vẫn phụ thuộc vào mô hình và môi trường chạy tác tử đã chọn.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Với `cron edit`, xóa ghi đè mức suy luận theo từng tác vụ. Không thể kết hợp với `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Bỏ qua việc chèn tệp khởi tạo không gian làm việc.
</ParamField>
<ParamField path="--tools" type="string">
  Giới hạn các công cụ mà tác vụ có thể sử dụng, ví dụ `--tools exec,read`.
</ParamField>

`--model` đặt mô hình chính của tác vụ; nó không thay thế ghi đè `/model` của phiên, vì vậy các chuỗi dự phòng đã cấu hình vẫn được áp dụng trên đó. Một mô hình không thể phân giải hoặc không được phép khiến lượt chạy thất bại với lỗi xác thực rõ ràng thay vì âm thầm chuyển về mô hình mặc định. Nếu tác vụ có `--model` nhưng không có danh sách dự phòng rõ ràng hoặc đã cấu hình, OpenClaw truyền một ghi đè dự phòng rỗng thay vì âm thầm nối thêm mô hình chính của tác tử làm mục tiêu thử lại ẩn.

Thứ tự ưu tiên chọn mô hình cho tác vụ cô lập, từ cao nhất:

1. Tải trọng theo từng tác vụ `model` (cấu hình rõ ràng; mô hình không được phép khiến lượt chạy thất bại)
2. Ghi đè mô hình của hook Gmail (chỉ khi lượt chạy đến từ Gmail và ghi đè đó được phép)
3. Ghi đè mô hình phiên Cron đã lưu do người dùng chọn
4. Lựa chọn mô hình tác tử/mặc định

Chế độ nhanh tuân theo lựa chọn trực tiếp đã phân giải. Nếu cấu hình mô hình đã chọn có `params.fastMode`, Cron cô lập sử dụng nó theo mặc định; ghi đè `fastMode` của phiên đã lưu (sau đó là `fastModeDefault` của tác tử) vẫn được ưu tiên hơn cấu hình mô hình theo cả hai hướng. Chế độ tự động sử dụng ngưỡng `params.fastAutoOnSeconds` của mô hình, mặc định là 60 giây.

Nếu một lượt chạy gặp bàn giao chuyển đổi mô hình trực tiếp, Cron thử lại với nhà cung cấp/mô hình đã chuyển đổi và lưu lựa chọn đó (cùng mọi hồ sơ xác thực mới) cho lượt chạy đang hoạt động. Số lần thử lại có giới hạn: sau lần thử ban đầu cộng thêm 2 lần thử lại do chuyển đổi, Cron hủy bỏ thay vì lặp vô hạn.

Trước khi một lượt chạy cô lập bắt đầu, OpenClaw kiểm tra các điểm cuối cục bộ có thể truy cập của những nhà cung cấp `api: "ollama"` và `api: "openai-completions"` đã cấu hình mà `baseUrl` là loopback, mạng riêng hoặc `.local`. Bước kiểm tra trước này duyệt chuỗi dự phòng đã cấu hình của tác vụ và chỉ đánh dấu lượt chạy là `skipped` khi mọi ứng viên đều không thể truy cập; `--fallbacks ""` giữ việc duyệt nghiêm ngặt chỉ với mô hình chính. Một điểm cuối ngừng hoạt động ghi lượt chạy là `skipped` kèm lỗi rõ ràng thay vì bắt đầu gọi mô hình. Kết quả được lưu vào bộ nhớ đệm trong 5 phút cho mỗi điểm cuối (không phải mỗi tác vụ hoặc mô hình), vì vậy nhiều tác vụ đến hạn dùng chung một máy chủ Ollama/vLLM/SGLang/LM Studio cục bộ đã ngừng hoạt động chỉ tốn một lần thăm dò thay vì gây bão yêu cầu. Các lượt chạy bị bỏ qua trong bước kiểm tra trước không làm tăng thời gian chờ lũy tiến do lỗi thực thi; đặt `failureAlert.includeSkipped` để nhận cảnh báo bỏ qua lặp lại.

### Tải trọng lệnh

Tải trọng lệnh chạy các tập lệnh xác định bên trong bộ lập lịch Gateway mà không bắt đầu lượt được mô hình hỗ trợ. Chúng thực thi trên máy chủ Gateway, thu thập stdout/stderr, ghi lượt chạy vào lịch sử Cron và sử dụng lại các chế độ gửi `announce`, `webhook` và `none` giống như tác vụ lượt tác tử.

<Note>
Cron lệnh là một bề mặt tự động hóa Gateway dành cho quản trị viên vận hành, không phải lệnh gọi `tools.exec` của tác tử. Việc tạo, cập nhật, xóa hoặc chạy thủ công các tác vụ Cron yêu cầu `operator.admin`; các lượt chạy lệnh theo lịch sau đó thực thi bên trong tiến trình Gateway dưới dạng hoạt động tự động hóa do quản trị viên đó tạo. Chính sách thực thi của tác tử (`tools.exec.mode`, lời nhắc phê duyệt, danh sách công cụ được phép theo tác tử) chi phối các công cụ thực thi mà mô hình nhìn thấy, không chi phối tải trọng Cron lệnh.
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

`--command <shell>` lưu `argv: ["sh", "-lc", <shell>]`. Sử dụng `--command-argv '["node","scripts/report.mjs"]'` để thực thi argv chính xác mà không phân tích cú pháp shell. Các tùy chọn `--command-env KEY=VALUE` (có thể lặp lại), `--command-input`, `--timeout-seconds` (mặc định 10 phút), `--no-output-timeout-seconds` và `--output-max-bytes` kiểm soát môi trường tiến trình, stdin và giới hạn đầu ra.

Văn bản được gửi bắt nguồn từ đầu ra tiến trình: stdout không rỗng được ưu tiên; nếu stdout rỗng và stderr không rỗng, stderr được gửi; nếu có cả hai, Cron gửi một khối `stdout:` / `stderr:` nhỏ. Mã thoát `0` ghi lượt chạy là `ok`; mã thoát khác không, tín hiệu, hết thời gian hoặc hết thời gian chờ không có đầu ra ghi `error` và có thể kích hoạt cảnh báo lỗi. Một lệnh chỉ in `NO_REPLY` sử dụng cơ chế chặn mã thông báo im lặng thông thường của Cron và không đăng gì trở lại cuộc trò chuyện.

### Tải trọng tập lệnh

Tải trọng tập lệnh chạy không giao diện trong cùng trình thực thi chế độ mã như các tập lệnh kích hoạt, mà không bắt đầu một lượt tác tử hội thoại. Bật `cron.triggers.enabled` trước khi tạo hoặc chạy chúng; cổng tự động hóa nguy hiểm này áp dụng cho cả tập lệnh kích hoạt và tải trọng tập lệnh. Tác vụ tập lệnh chỉ hỗ trợ các đích phiên `main` và `isolated`.

```bash
openclaw cron create "0 * * * *" \
  --name "Hourly queue check" \
  --script ./automation/check-queue.js \
  --script-timeout-seconds 300 \
  --script-tool-budget 50 \
  --session isolated \
  --announce
```

Sử dụng `--script <file|->` để đọc JavaScript từ tệp hoặc stdin. Thời gian chờ mặc định là 300 giây và tối đa là 900; ngân sách công cụ mặc định là 50 lượt gọi và tối đa là 200. Các ngân sách tải trọng này tách biệt với ngân sách đánh giá cổng kích hoạt nhỏ hơn.

Tập lệnh có thể trả về một đối tượng với các trường tùy chọn sau:

- `notify`: Văn bản được gửi qua chế độ gửi `announce`, `webhook` hoặc `none` của tác vụ. Nếu bỏ qua, không có gì được gửi. Với tác vụ `main`, văn bản trở thành một sự kiện hệ thống.
- `wake`: `"now"` yêu cầu Heartbeat ngay lập tức sau khi đưa `notify` (hoặc một sự kiện hoàn thành ngắn gọn) vào hàng đợi; `"next-heartbeat"` đưa sự kiện vào hàng đợi cho Heartbeat tiếp theo.
- `state`: Trạng thái JSON, giới hạn ở 16 KB và chỉ được lưu sau một lượt chạy thành công. Lượt chạy tiếp theo nhận một bản sao bất biến dưới dạng `trigger.state`, tương tự các tập lệnh kích hoạt. Vì không gian tên đó chỉ có một chủ sở hữu trạng thái lưu trữ, tải trọng tập lệnh không thể kết hợp với trình kích hoạt có điều kiện trên cùng một tác vụ.
- `nextCheck`: Một khoảng thời gian như `"15m"`. Chỉ hợp lệ với các tác vụ đã bật điều tiết nhịp độ và sử dụng cùng giới hạn điều tiết như các đề xuất lượt tác tử.

Ngoại lệ, hết thời gian, cạn ngân sách công cụ, kết quả không hợp lệ và `nextCheck` khi không có điều tiết nhịp độ đều là lỗi lượt chạy Cron thông thường: chúng được đưa vào lịch sử lượt chạy, cơ chế chờ lũy tiến và xử lý cảnh báo lỗi mà không lưu trạng thái trả về.

## Kiểu thực thi

| Kiểu           | Giá trị `--session`   | Chạy trong                  | Phù hợp nhất cho                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Phiên chính    | `main`              | Làn đánh thức Cron chuyên dụng | Lời nhắc, sự kiện hệ thống        |
| Cô lập        | `isolated`          | `cron:<jobId>` chuyên dụng | Báo cáo, công việc nền      |
| Phiên hiện tại | `current`           | Được liên kết tại thời điểm tạo   | Công việc định kỳ nhận biết ngữ cảnh    |
| Phiên tùy chỉnh  | `session:custom-id` | Phiên có tên tồn tại lâu dài | Quy trình làm việc phát triển dựa trên lịch sử |

<AccordionGroup>
  <Accordion title="Phiên chính, phiên cô lập và phiên tùy chỉnh">
    Các tác vụ **phiên chính** đưa một sự kiện hệ thống vào làn chạy do Cron sở hữu và có thể đánh thức Heartbeat (`--wake now` hoặc `--wake next-heartbeat`). Chúng có thể sử dụng ngữ cảnh gửi gần nhất của phiên chính đích để trả lời, nhưng không nối các lượt Cron thường lệ vào làn trò chuyện với con người và không kéo dài độ mới của lần đặt lại hằng ngày/do không hoạt động cho phiên đích. Các tác vụ **cô lập** chạy một lượt tác tử chuyên dụng với một phiên mới. **Phiên tùy chỉnh** (`session:xxx`) duy trì ngữ cảnh qua các lượt chạy, cho phép các quy trình làm việc như họp cập nhật hằng ngày phát triển dựa trên các bản tóm tắt trước đó.

    Các sự kiện Cron của phiên chính là lời nhắc sự kiện hệ thống độc lập. Chúng không tự động bao gồm hướng dẫn "Read HEARTBEAT.md" của lời nhắc Heartbeat mặc định; hãy nêu rõ điều đó trong văn bản sự kiện Cron nếu lời nhắc cần tham khảo `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="Ý nghĩa của 'phiên mới' đối với tác vụ cô lập">
    Một mã bản ghi/phiên mới cho mỗi lượt chạy. OpenClaw mang theo các tùy chọn an toàn (cài đặt suy luận/nhanh/chi tiết, nhãn, ghi đè mô hình/xác thực do người dùng chọn rõ ràng), nhưng không kế thừa ngữ cảnh hội thoại xung quanh từ một hàng Cron cũ: định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc hay liên kết môi trường chạy ACP. Sử dụng `current` hoặc `session:<id>` khi một tác vụ định kỳ cần chủ ý phát triển dựa trên cùng một ngữ cảnh hội thoại.
  </Accordion>
  <Accordion title="Hợp đồng chạy không giám sát">
    Các lượt tác tử Cron cô lập và hook hoàn toàn không có người giám sát: không có ai hiện diện để làm rõ hoặc phê duyệt. Phản hồi cuối cùng phải là sản phẩm bàn giao thay vì kế hoạch, lời xác nhận hoặc yêu cầu nhập liệu. Tác tử trả về `HEARTBEAT_OK` khi không cần làm gì và nêu rõ lỗi; Cron sở hữu chính sách thử lại và cảnh báo lỗi.

    Đối với tác vụ theo lịch đáng tin cậy, hướng dẫn riêng của tác vụ được ưu tiên khi chúng chủ ý yêu cầu câu hỏi hoặc kế hoạch, và tác tử có thể xóa một tác vụ không còn cần thiết. Các lượt hook bên ngoài chỉ nhận hợp đồng không giám sát chung; chúng không nhận ghi đè đó hoặc hướng dẫn tự xóa qua ranh giới nội dung bên ngoài.

  </Accordion>
  <Accordion title="Gửi kết quả của tác tử phụ và Discord">
    Khi các lượt Cron cô lập điều phối tác tử phụ, việc gửi ưu tiên đầu ra cuối cùng của hậu duệ hơn văn bản tạm thời đã cũ của tác tử cha. Nếu các hậu duệ vẫn đang chạy, OpenClaw chặn bản cập nhật một phần đó của tác tử cha thay vì thông báo.

    Đối với các đích thông báo Discord chỉ có văn bản, OpenClaw gửi văn bản phản hồi cuối cùng chuẩn của trợ lý một lần thay vì phát lại cả văn bản được truyền phát/trung gian và câu trả lời cuối cùng. Nội dung đa phương tiện và payload Discord có cấu trúc vẫn được gửi riêng để không làm mất tệp đính kèm và thành phần.

  </Accordion>
</AccordionGroup>

## Phân phối và đầu ra

| Chế độ       | Điều xảy ra                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Phân phối dự phòng văn bản cuối cùng đến đích nếu agent chưa gửi |
| `webhook`  | POST payload sự kiện hoàn tất đến một URL                                |
| `none`     | Không phân phối dự phòng từ trình chạy                                         |

Sử dụng `--announce --channel telegram --to "-1001234567890"` để phân phối qua kênh. Đối với các chủ đề diễn đàn Telegram, sử dụng `-1001234567890:topic:123`; OpenClaw cũng chấp nhận dạng viết tắt `-1001234567890:123` do Telegram sở hữu. Các trình gọi RPC/cấu hình trực tiếp có thể truyền `delivery.threadId` dưới dạng chuỗi hoặc số. Các đích Slack/Discord/Mattermost sử dụng tiền tố rõ ràng (`channel:<id>`, `user:<id>`). ID phòng Matrix phân biệt chữ hoa chữ thường; sử dụng chính xác ID phòng hoặc dạng `room:!room:server` từ Matrix.

Khi phân phối thông báo sử dụng `channel: "last"` hoặc bỏ qua `channel`, một đích có tiền tố nhà cung cấp như `telegram:123` có thể chọn kênh trước khi cron quay về lịch sử phiên hoặc một kênh duy nhất đã cấu hình. Chỉ các tiền tố do plugin đã tải công bố mới là bộ chọn nhà cung cấp. Nếu `delivery.channel` được chỉ định rõ ràng, tiền tố đích phải nêu cùng nhà cung cấp; `channel: "whatsapp"` với `to: "telegram:123"` sẽ bị từ chối thay vì để WhatsApp diễn giải ID Telegram thành số điện thoại. Các tiền tố loại đích và dịch vụ (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) vẫn là cú pháp đích do kênh sở hữu, không phải bộ chọn nhà cung cấp.

Đối với các tác vụ cô lập, việc phân phối trò chuyện được dùng chung: nếu có tuyến trò chuyện, agent có thể sử dụng công cụ `message` ngay cả với `--no-deliver`. Nếu agent gửi đến đích đã cấu hình/hiện tại, OpenClaw bỏ qua thông báo dự phòng. Nếu không, `announce`, `webhook` và `none` chỉ kiểm soát cách trình chạy xử lý phản hồi cuối cùng sau lượt agent.

Khi agent tạo lời nhắc cô lập từ một cuộc trò chuyện đang hoạt động, OpenClaw lưu đích phân phối trực tiếp được giữ nguyên cho tuyến thông báo dự phòng. Khóa phiên nội bộ có thể viết thường; đích phân phối của nhà cung cấp không được tái tạo từ các khóa đó khi có ngữ cảnh trò chuyện hiện tại.

Phân phối thông báo ngầm định sử dụng danh sách cho phép của kênh đã cấu hình để xác thực và định tuyến lại các đích lỗi thời. Các phê duyệt trong kho ghép cặp DM không phải là người nhận tự động hóa dự phòng; đặt `delivery.to` hoặc cấu hình mục `allowFrom` của kênh khi một tác vụ đã lên lịch cần chủ động gửi đến DM.

### Thông báo lỗi

Thông báo lỗi đi theo một đường dẫn đích riêng:

- `cron.failureDestination` đặt giá trị mặc định toàn cục cho thông báo lỗi.
- `job.delivery.failureDestination` ghi đè giá trị đó cho từng tác vụ.
- Nếu cả hai đều chưa được đặt và tác vụ đã phân phối qua `announce`, thông báo lỗi quay về đích thông báo chính đó.
- `delivery.failureDestination` chỉ được hỗ trợ trên các tác vụ `sessionTarget="isolated"`, trừ khi chế độ phân phối chính là `webhook`.
- `failureAlert.includeSkipped: true` cho phép một tác vụ hoặc chính sách cảnh báo cron toàn cục nhận cảnh báo lặp lại về các lượt chạy bị bỏ qua. Các lượt chạy bị bỏ qua duy trì bộ đếm bỏ qua liên tiếp riêng, vì vậy chúng không ảnh hưởng đến cơ chế lùi thời gian do lỗi thực thi.
- `openclaw cron edit` cung cấp khả năng tinh chỉnh cảnh báo theo từng tác vụ: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` và `--failure-alert-account-id`.

### Ngôn ngữ đầu ra

Các tác vụ Cron không suy luận ngôn ngữ phản hồi từ kênh, ngôn ngữ hoặc tin nhắn trước đó. Đặt quy tắc ngôn ngữ trong tin nhắn hoặc mẫu đã lên lịch:

```bash
openclaw cron edit <jobId> \
  --message "Tóm tắt các bản cập nhật. Trả lời bằng tiếng Trung; giữ nguyên URL, mã và tên sản phẩm."
```

Đối với tệp mẫu, giữ chỉ dẫn ngôn ngữ trong lời nhắc đã kết xuất và xác minh rằng các phần giữ chỗ như `{{language}}` đã được điền trước khi tác vụ chạy. Nếu đầu ra trộn lẫn các ngôn ngữ, hãy nêu rõ quy tắc, ví dụ: "Sử dụng tiếng Trung cho văn bản tường thuật và giữ các thuật ngữ kỹ thuật bằng tiếng Anh."

## Ví dụ CLI

<Tabs>
  <Tab title="Lời nhắc một lần">
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
      "Tóm tắt các bản cập nhật qua đêm." \
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
      --name "Thăm dò độ sâu hàng đợi" \
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

# Hiển thị một tác vụ, bao gồm tuyến phân phối đã phân giải
openclaw cron show <jobId>

# Bật/tắt mà không xóa
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Chỉnh sửa một tác vụ
openclaw cron edit <jobId> --message "Lời nhắc đã cập nhật" --model "opus"

# Buộc chạy một tác vụ ngay bây giờ
openclaw cron run <jobId>

# Buộc chạy một tác vụ ngay bây giờ và chờ trạng thái kết thúc
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Chỉ chạy nếu đến hạn
openclaw cron run <jobId> --due

# Xem lịch sử chạy
openclaw cron runs --id <jobId> --limit 50

# Xem chính xác một lượt chạy
openclaw cron runs --id <jobId> --run-id <runId>

# Xóa một tác vụ
openclaw cron remove <jobId>

# Chọn agent (thiết lập nhiều agent)
openclaw cron create "0 6 * * *" "Kiểm tra hàng đợi vận hành" --name "Rà soát vận hành" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Việc lưu trữ một phiên (Control UI hoặc `sessions.patch { archived: true }` từ trình gọi operator-admin) sẽ tắt mọi tác vụ cron đang bật được liên kết với phiên đó: phiên `cron:<jobId>` cô lập của nó, một đích `session:<key>`, hoặc một làn phân phối/đánh thức `sessionKey`. Khôi phục phiên không bật lại các tác vụ đó; sử dụng `openclaw cron enable <jobId>`. Các phiên có tác vụ liên kết đang bật hiển thị huy hiệu đồng hồ trong thanh bên Control UI.

`openclaw cron run <jobId>` trả về sau khi đưa lượt chạy thủ công vào hàng đợi. Sử dụng `--wait` cho hook tắt hệ thống, tập lệnh bảo trì hoặc tác vụ tự động hóa khác phải chặn cho đến khi lượt chạy trong hàng đợi hoàn tất; lệnh này thăm dò `runId` được trả về (thời gian chờ mặc định `10m`, khoảng thăm dò `2s`) và thoát với mã `0` cho trạng thái `ok`, mã khác không cho `error`, `skipped` hoặc khi hết thời gian chờ.

Công cụ agent `cron` trả về bản tóm tắt tác vụ nhỏ gọn (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) từ `cron(action: "list")`; sử dụng `cron(action: "get", jobId: "...")` để lấy một định nghĩa tác vụ đầy đủ. Các trình gọi Gateway trực tiếp có thể truyền `compact: true` đến `cron.list`; việc bỏ qua giá trị này giữ nguyên phản hồi đầy đủ cùng bản xem trước phân phối.

`openclaw cron create` là bí danh của `openclaw cron add`. Tác vụ mới có thể sử dụng lịch biểu theo vị trí (`"0 9 * * 1"`, `"every 1h"`, `"20m"` hoặc dấu thời gian ISO), sau đó là lời nhắc agent theo vị trí. Sử dụng `--webhook <url>` trên `cron add|create` hoặc `cron edit` để POST payload của lượt chạy đã hoàn tất đến một điểm cuối HTTP; phân phối Webhook không thể kết hợp với các cờ phân phối trò chuyện (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). Trên `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` và `--clear-account`, hãy hủy đặt riêng từng trường định tuyến đó (mỗi trường bị từ chối khi dùng cùng cờ đặt tương ứng) — khác với `--no-deliver`, chỉ tắt phân phối dự phòng của trình chạy.

<Note>
Lưu ý về ghi đè mô hình:

- `openclaw cron add|edit --model ...` thay đổi mô hình đã chọn của tác vụ.
- Nếu mô hình được cho phép, chính xác nhà cung cấp/mô hình đó sẽ được chuyển đến lượt chạy agent cô lập.
- Nếu mô hình không được cho phép hoặc không thể phân giải, cron làm lượt chạy thất bại với lỗi xác thực rõ ràng.
- Các bản vá payload `cron.update` của API có thể đặt `model: null` để xóa ghi đè mô hình đã lưu của tác vụ.
- `openclaw cron edit <job-id> --clear-model` xóa ghi đè đó khỏi CLI (có cùng hiệu lực với bản vá `model: null`) và không thể kết hợp với `--model`.
- Các chuỗi dự phòng đã cấu hình vẫn áp dụng vì `--model` của cron là mô hình chính của tác vụ, không phải ghi đè `/model` của phiên.
- `openclaw cron add|edit --fallbacks ...` đặt payload `fallbacks`, thay thế các phương án dự phòng đã cấu hình cho tác vụ đó; `--fallbacks ""` tắt dự phòng và khiến lượt chạy trở nên nghiêm ngặt. `openclaw cron edit <job-id> --clear-fallbacks` xóa ghi đè theo tác vụ.
- Một `--model` thuần túy không có danh sách dự phòng rõ ràng hoặc đã cấu hình sẽ không chuyển tiếp sang mô hình chính của agent như một đích thử lại bổ sung ngầm định.

</Note>

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
    Chạy một lượt agent cô lập:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Tóm tắt hộp thư đến","name":"Email","model":"openai/gpt-5.6-sol"}'
    ```

    Các trường: `message` (bắt buộc), `name`, `agentId`, `sessionKey` (yêu cầu `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook đã ánh xạ (POST /hooks/<name>)">
    Tên hook tùy chỉnh được phân giải thông qua `hooks.mappings` trong cấu hình. Các ánh xạ có thể chuyển đổi payload tùy ý thành hành động `wake` hoặc `agent` bằng mẫu hoặc phép biến đổi mã.
  </Accordion>
</AccordionGroup>

<Warning>
Đặt các endpoint hook phía sau loopback, tailnet hoặc reverse proxy đáng tin cậy.

- Sử dụng token hook chuyên dụng; không sử dụng lại token xác thực Gateway.
- Đặt `hooks.path` trên một đường dẫn con chuyên dụng; `/` sẽ bị từ chối.
- Đặt `hooks.allowedAgentIds` để giới hạn agent thực tế mà hook có thể nhắm đến, bao gồm agent mặc định khi `agentId` bị bỏ qua.
- Giữ nguyên `hooks.allowRequestSessionKey=false` trừ khi cần phiên do bên gọi lựa chọn.
- Nếu bật `hooks.allowRequestSessionKey`, hãy đặt cả `hooks.allowedSessionKeyPrefixes` để giới hạn các dạng khóa phiên được phép.
- Theo mặc định, payload của hook được bao bọc bằng các ranh giới an toàn.

</Warning>

## Tích hợp Gmail PubSub

Kết nối các trình kích hoạt hộp thư đến Gmail với OpenClaw thông qua Google PubSub.

<Note>
**Điều kiện tiên quyết:** CLI `gcloud`, `gog` (gogcli), đã bật hook OpenClaw, Tailscale cho endpoint HTTPS công khai.
</Note>

### Thiết lập bằng trình hướng dẫn (khuyến nghị)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Lệnh này ghi cấu hình `hooks.gmail`, bật thiết lập sẵn Gmail và mặc định dùng Tailscale Funnel cho endpoint push (`--tailscale funnel|serve|off`).

<Warning>
Phiên riêng cho từng thư của thiết lập sẵn Gmail tách biệt ngữ cảnh hội thoại; phiên này không hạn chế công cụ hoặc không gian làm việc của agent đích. Nếu không có ánh xạ tùy chỉnh đặt `agentId`, hook Gmail sẽ chạy dưới dạng agent mặc định.

Đối với hộp thư đến không đáng tin cậy, hãy định tuyến hook đến một agent đọc chuyên dụng, chỉ cấp cho agent đó quyền chỉ đọc hoặc không cấp quyền truy cập không gian làm việc, đồng thời từ chối công cụ ghi hệ thống tệp, shell, trình duyệt và các công cụ không cần thiết khác. Nếu agent đó cần thông báo cho agent chính, chỉ cho phép việc chuyển giao giữa các agent cần thiết. Xem [Chèn prompt](/vi/gateway/security#prompt-injection), [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) và [`tools.agentToAgent`](/vi/gateway/config-tools#toolsagenttoagent).
</Warning>

### Tự động khởi động Gateway

Khi `hooks.enabled=true` được bật và `hooks.gmail.account` được đặt, Gateway sẽ khởi động `gog gmail watch serve` khi khởi động hệ thống và tự động gia hạn việc theo dõi. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để tắt tính năng này.

### Thiết lập thủ công một lần

<Steps>
  <Step title="Chọn dự án GCP">
    Chọn dự án GCP sở hữu ứng dụng OAuth được `gog` sử dụng:

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

Đối với hộp thư đến không đáng tin cậy, hãy sử dụng mô hình thế hệ mới nhất thuộc hạng tốt nhất hiện có từ nhà cung cấp. Giá trị trên chỉ là ví dụ; mô hình phải tồn tại trong danh mục và danh sách cho phép đã cấu hình.

## Cấu hình

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    triggers: {
      enabled: false,
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

`webhookToken` được gửi dưới dạng `Authorization: Bearer <token>` trong các yêu cầu POST Webhook cron.

`cron.store` là khóa kho lưu trữ logic và đường dẫn di chuyển của doctor, không phải tệp JSON trực tiếp để chỉnh sửa thủ công. Dữ liệu tác vụ nằm trong SQLite; hãy sử dụng CLI hoặc API Gateway để thay đổi.

Tắt cron: `cron.enabled: false` hoặc `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Hành vi thử lại">
    **Thử lại tác vụ một lần**: các lỗi tạm thời (giới hạn tốc độ, quá tải, mạng, hết thời gian chờ, lỗi máy chủ) sử dụng lịch thử lại tích hợp sẵn. Lỗi vĩnh viễn sẽ vô hiệu hóa tác vụ ngay lập tức.

    **Thử lại tác vụ định kỳ**: các lỗi thực thi liên tiếp sẽ lùi thời gian theo lịch mở rộng (30s, 60s, 5m, 15m, 60m). Khoảng lùi được đặt lại sau lần chạy thành công tiếp theo.

  </Accordion>
  <Accordion title="Bảo trì">
    `cron.sessionRetention` (mặc định `24h`, `false` sẽ tắt) dọn dẹp các mục phiên chạy biệt lập. Lịch sử chạy giữ lại 2000 hàng kết thúc mới nhất cho mỗi tác vụ; các hàng bị mất vẫn giữ thời hạn dọn dẹp 24 giờ.
  </Accordion>
  <Accordion title="Di chuyển kho lưu trữ cũ">
    Khi nâng cấp, hãy chạy `openclaw doctor --fix` để nhập các tệp `~/.openclaw/cron/jobs.json`, `jobs-state.json` và `runs/*.jsonl` cũ vào SQLite rồi đổi tên chúng với hậu tố `.migrated`. Các hàng tác vụ có định dạng sai sẽ bị bỏ qua khi chạy và được sao chép vào `jobs-quarantine.json` để sửa chữa hoặc xem xét sau.
  </Accordion>
</AccordionGroup>

## Khắc phục sự cố

### Chuỗi lệnh kiểm tra

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
    - `reason: not-due` trong đầu ra chạy có nghĩa là lần chạy thủ công đã được kiểm tra với `openclaw cron run <jobId> --due` và chưa đến hạn chạy tác vụ.

  </Accordion>
  <Accordion title="Cron đã kích hoạt nhưng không gửi">
    - Chế độ gửi `none` có nghĩa là không có lần gửi dự phòng từ trình chạy. Agent vẫn có thể gửi trực tiếp bằng công cụ `message` khi có tuyến trò chuyện.
    - Đích gửi bị thiếu hoặc không hợp lệ (`channel`/`to`) có nghĩa là lần gửi ra ngoài đã bị bỏ qua.
    - Đối với Matrix, các tác vụ được sao chép hoặc tác vụ cũ có ID phòng `delivery.to` viết thường có thể thất bại vì ID phòng Matrix phân biệt chữ hoa chữ thường. Chỉnh sửa tác vụ thành đúng giá trị `!room:server` hoặc `room:!room:server` từ Matrix.
    - Lỗi xác thực kênh (`unauthorized`, `Forbidden`) có nghĩa là việc gửi đã bị thông tin xác thực chặn.
    - Nếu lần chạy biệt lập chỉ trả về token im lặng (`NO_REPLY` / `no_reply`), OpenClaw sẽ chặn việc gửi trực tiếp ra ngoài và đường dẫn tóm tắt được xếp hàng dự phòng, vì vậy không có nội dung nào được đăng lại vào cuộc trò chuyện.
    - Nếu agent phải tự gửi tin nhắn cho người dùng, hãy kiểm tra xem tác vụ có tuyến khả dụng hay không (`channel: "last"` với cuộc trò chuyện trước đó hoặc một kênh/đích rõ ràng).

  </Accordion>
  <Accordion title="Cron hoặc Heartbeat dường như ngăn việc chuyển phiên kiểu /new">
    - Độ mới của việc đặt lại hằng ngày và khi không hoạt động không dựa trên `updatedAt`; xem [Quản lý phiên](/vi/concepts/session#session-lifecycle).
    - Các lần đánh thức cron, lần chạy Heartbeat, thông báo exec và hoạt động quản lý sổ sách của Gateway có thể cập nhật hàng phiên để định tuyến/trạng thái, nhưng chúng không gia hạn `sessionStartedAt` hoặc `lastInteractionAt`.
    - Đối với các hàng cũ được tạo trước khi những trường đó tồn tại, OpenClaw có thể khôi phục `sessionStartedAt` từ tiêu đề phiên của bản ghi JSONL khi tệp vẫn còn. Các hàng không hoạt động cũ không có `lastInteractionAt` sẽ sử dụng thời gian bắt đầu đã khôi phục đó làm mốc không hoạt động.

  </Accordion>
  <Accordion title="Các lưu ý về múi giờ">
    - Cron không có `--tz` sẽ sử dụng múi giờ của máy chủ Gateway.
    - Lịch `at` không có múi giờ sẽ được coi là UTC.
    - `activeHours` của Heartbeat sử dụng quy trình phân giải múi giờ đã cấu hình.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa](/vi/automation) — tổng quan nhanh về tất cả cơ chế tự động hóa
- [Tác vụ nền](/vi/automation/tasks) — sổ theo dõi tác vụ cho các lần thực thi cron
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Múi giờ](/vi/concepts/timezone) — cấu hình múi giờ
