---
read_when:
    - Bạn muốn hiểu Task Flow liên quan như thế nào đến các tác vụ nền
    - Bạn bắt gặp Task Flow hoặc luồng tác vụ OpenClaw trong ghi chú phát hành hoặc tài liệu
    - Bạn muốn kiểm tra hoặc quản lý trạng thái luồng bền vững
summary: Lớp điều phối TaskFlow phía trên các tác vụ nền
title: Luồng tác vụ
x-i18n:
    generated_at: "2026-07-12T07:41:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Luồng tác vụ là lớp điều phối nằm trên [các tác vụ nền](/vi/automation/tasks). Một luồng là bản ghi bền vững về công việc gồm nhiều bước, có trạng thái, trạng thái JSON, bộ đếm bản sửa đổi và các bản ghi tác vụ được liên kết riêng. Các luồng vẫn tồn tại sau khi Gateway khởi động lại; từng tác vụ riêng lẻ vẫn là đơn vị công việc tách rời.

## Khi nào nên sử dụng Luồng tác vụ

| Tình huống                                      | Sử dụng                                            |
| ------------------------------------------------ | -------------------------------------------------- |
| Một công việc nền                                | Tác vụ thông thường                                |
| Quy trình nhiều bước do mã Plugin điều khiển     | Luồng tác vụ (được quản lý)                        |
| Khởi chạy ACP hoặc tác tử con theo kiểu tách rời | Luồng tác vụ (phản chiếu, được tạo tự động)        |
| Lời nhắc dùng một lần                            | Công việc Cron                                     |

## Chế độ đồng bộ hóa

### Chế độ được quản lý

Một luồng được quản lý có bộ điều khiển: mã Plugin tạo luồng thông qua API Luồng tác vụ của môi trường chạy Plugin, kèm theo mục tiêu và mã định danh bộ điều khiển bắt buộc, sau đó điều khiển luồng một cách tường minh.

- Mỗi bước chạy dưới dạng một tác vụ nền được tạo trong luồng; khóa chủ sở hữu và nguồn gốc người yêu cầu của luồng được truyền sang các tác vụ con.
- Bộ điều khiển chuyển luồng giữa `running`, `waiting` và các trạng thái kết thúc, đồng thời lưu trạng thái bước JSON tùy ý trong bản ghi luồng.
- Mỗi thao tác thay đổi đều truyền bản sửa đổi dự kiến của luồng. Một thao tác ghi dựa trên bản sửa đổi cũ sẽ bị từ chối do xung đột bản sửa đổi thay vì ghi đè lên trạng thái mới hơn.
- Sau khi có yêu cầu hủy, các tác vụ con mới sẽ bị từ chối và luồng kết thúc với trạng thái `cancelled` khi không còn tác vụ con nào đang hoạt động.

Ví dụ: một luồng báo cáo hằng tuần (1) thu thập dữ liệu, (2) tạo báo cáo và (3) phân phối báo cáo, với một tác vụ nền cho mỗi bước:

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Chế độ phản chiếu

OpenClaw tự động tạo một luồng phản chiếu gồm một tác vụ khi một lượt chạy ACP hoặc tác tử con tách rời bắt đầu (các tác vụ theo phạm vi phiên có kết quả hoàn thành có thể chuyển giao). Bản ghi luồng phản chiếu tác vụ nền duy nhất của nó — trạng thái, mục tiêu và thời gian — để các lượt khởi chạy tách rời có một định danh luồng ổn định cho các giao diện trạng thái và thử lại mà không cần bộ điều khiển. Các luồng phản chiếu hiển thị chế độ đồng bộ hóa `task_mirrored` trong CLI.

## Trạng thái luồng

| Trạng thái  | Ý nghĩa                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------- |
| `queued`    | Đã tạo, chưa bắt đầu tiến triển                                                              |
| `running`   | Luồng đang tích cực tiến triển                                                               |
| `waiting`   | Luồng được quản lý đang tạm dừng theo siêu dữ liệu chờ (bộ hẹn giờ, sự kiện bên ngoài)       |
| `blocked`   | Một bước đã kết thúc nhưng không có kết quả sử dụng được; `blockedTaskId`/bản tóm tắt cho biết bước nào |
| `succeeded` | Hoàn tất thành công                                                                          |
| `failed`    | Hoàn tất với lỗi                                                                             |
| `cancelled` | Đã yêu cầu hủy và tất cả tác vụ con đã ổn định                                               |
| `lost`      | Luồng đã mất trạng thái nền có thẩm quyền                                                    |

## Trạng thái bền vững và theo dõi bản sửa đổi

Các bản ghi luồng được lưu bền vững trong cơ sở dữ liệu trạng thái SQLite dùng chung (`~/.openclaw/state/openclaw.sqlite`, bảng `flow_runs`) cùng với các bản ghi tác vụ, vì vậy tiến trình vẫn được giữ lại sau khi Gateway khởi động lại. Mỗi thao tác ghi làm tăng `revision` của luồng; các trình ghi đồng thời truyền bản sửa đổi dự kiến cũ sẽ nhận được xung đột và phải đọc lại. Mức tăng trưởng WAL được giới hạn bằng cơ chế tự động tạo điểm kiểm tra của SQLite kết hợp với các điểm kiểm tra thụ động định kỳ và các điểm kiểm tra cắt gọn khi tắt. Tệp cơ sở dữ liệu phụ `flows/registry.sqlite` cũ từ các bản cài đặt trước đây được nhập bởi `openclaw doctor`.

## Hành vi hủy

`openclaw tasks flow cancel` đặt ý định hủy cố định cho luồng, hủy các tác vụ con đang hoạt động và từ chối các tác vụ con được quản lý mới. Khi không còn tác vụ con nào đang hoạt động, luồng kết thúc với trạng thái `cancelled` — ngay lập tức hoặc thông qua lượt quét bảo trì nếu các tác vụ con cần nhiều thời gian hơn để ổn định. Ý định này được lưu bền vững, vì vậy một luồng đã hủy vẫn giữ trạng thái hủy ngay cả khi Gateway khởi động lại trước khi tất cả tác vụ con chấm dứt.

## Các lệnh CLI

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Lệnh                              | Mô tả                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `openclaw tasks flow list`        | Các luồng được theo dõi cùng chế độ đồng bộ hóa, trạng thái, bản sửa đổi, bộ điều khiển và số lượng tác vụ |
| `openclaw tasks flow show <id>`   | Kiểm tra một luồng theo mã định danh luồng hoặc khóa chủ sở hữu, bao gồm các tác vụ được liên kết |
| `openclaw tasks flow cancel <id>` | Hủy một luồng đang chạy và các tác vụ đang hoạt động của luồng                              |

Các luồng cũng được `openclaw tasks audit` kiểm tra (phát hiện luồng cũ hoặc bị lỗi) và được `openclaw tasks maintenance` bảo trì (hoàn tất các lượt hủy bị kẹt, xóa các luồng đã kết thúc sau 7 ngày).

## Mẫu quy trình công việc theo lịch đáng tin cậy

Đối với các quy trình công việc định kỳ như bản tin tình báo thị trường, hãy xem lịch chạy, việc điều phối và các bước kiểm tra độ tin cậy là những lớp riêng biệt:

1. Sử dụng [Tác vụ theo lịch](/vi/automation/cron-jobs) để định thời gian.
2. Sử dụng một phiên Cron bền vững khi quy trình công việc cần xây dựng dựa trên ngữ cảnh trước đó.
3. Sử dụng [Lobster](/vi/tools/lobster) cho các bước có tính xác định, các cổng phê duyệt và mã thông báo tiếp tục.
4. Sử dụng Luồng tác vụ để theo dõi lượt chạy nhiều bước qua các tác vụ con, thời gian chờ, lần thử lại và các lần Gateway khởi động lại.

Ví dụ về cấu trúc Cron:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Sử dụng `--session session:<id>` thay cho `isolated` khi quy trình công việc định kỳ cần chủ ý sử dụng lịch sử, bản tóm tắt các lượt chạy trước hoặc ngữ cảnh thường trực. Sử dụng `isolated` khi mỗi lượt chạy cần bắt đầu mới hoàn toàn và mọi trạng thái bắt buộc đều được khai báo tường minh trong quy trình công việc.

Bên trong quy trình công việc, hãy đặt các bước kiểm tra độ tin cậy trước bước tóm tắt bằng LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Các bước kiểm tra sơ bộ được khuyến nghị:

- Tính khả dụng của trình duyệt và lựa chọn hồ sơ, chẳng hạn `openclaw` cho trạng thái được quản lý hoặc `user` khi cần một phiên Chrome đã đăng nhập. Xem [Trình duyệt](/vi/tools/browser).
- Thông tin xác thực API và hạn ngạch cho từng nguồn.
- Khả năng kết nối mạng đến các điểm cuối bắt buộc.
- Các công cụ bắt buộc được bật cho tác tử, chẳng hạn `lobster`, `browser` và `llm-task`.
- Đích nhận lỗi được cấu hình cho Cron để các lỗi kiểm tra sơ bộ có thể được nhìn thấy. Xem [Tác vụ theo lịch](/vi/automation/cron-jobs#delivery-and-output).

Các trường nguồn gốc dữ liệu được khuyến nghị cho mọi mục đã thu thập:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Yêu cầu quy trình công việc từ chối hoặc đánh dấu các mục đã cũ trước khi tóm tắt. Bước LLM chỉ nên nhận JSON có cấu trúc và cần được yêu cầu giữ nguyên `sourceUrl`, `retrievedAt` và `asOf` trong đầu ra. Sử dụng [Tác vụ LLM](/vi/tools/llm-task) khi bạn cần một bước mô hình được xác thực bằng lược đồ bên trong quy trình công việc.

Đối với các quy trình công việc có thể tái sử dụng trong nhóm hoặc cộng đồng, hãy đóng gói CLI, các tệp `.lobster` và mọi ghi chú thiết lập dưới dạng một skill hoặc Plugin rồi phát hành thông qua [ClawHub](/clawhub). Giữ các biện pháp bảo vệ dành riêng cho quy trình công việc trong gói đó, trừ khi API Plugin thiếu một khả năng chung cần thiết.

## Mối quan hệ giữa luồng và tác vụ

Các luồng điều phối tác vụ chứ không thay thế tác vụ. Một luồng có thể điều khiển nhiều tác vụ nền trong suốt vòng đời của nó. Sử dụng `openclaw tasks` để kiểm tra từng bản ghi tác vụ và `openclaw tasks flow` để kiểm tra luồng điều phối.

## Liên quan

- [Tác vụ nền](/vi/automation/tasks) — sổ ghi công việc tách rời mà các luồng điều phối
- [CLI: tác vụ](/vi/cli/tasks) — tài liệu tham khảo lệnh CLI cho `openclaw tasks flow`
- [Tổng quan về tự động hóa](/vi/automation) — tổng quan nhanh về tất cả cơ chế tự động hóa
- [Công việc Cron](/vi/automation/cron-jobs) — các công việc theo lịch có thể cung cấp đầu vào cho các luồng
