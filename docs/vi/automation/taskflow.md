---
read_when:
    - Bạn muốn hiểu Task Flow liên quan như thế nào đến các tác vụ nền
    - Bạn gặp TaskFlow hoặc luồng tác vụ openclaw trong ghi chú phát hành hoặc tài liệu
    - Bạn muốn kiểm tra hoặc quản lý trạng thái flow bền vững
summary: Lớp điều phối TaskFlow phía trên các tác vụ nền
title: Luồng tác vụ
x-i18n:
    generated_at: "2026-07-02T08:28:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow là nền tảng điều phối luồng nằm phía trên [tác vụ nền](/vi/automation/tasks). Nó quản lý các luồng nhiều bước bền vững với trạng thái riêng, theo dõi bản sửa đổi và ngữ nghĩa đồng bộ hóa, trong khi từng tác vụ vẫn là đơn vị của công việc tách rời.

## Khi nào dùng Task Flow

Dùng Task Flow khi công việc trải qua nhiều bước tuần tự hoặc phân nhánh và bạn cần theo dõi tiến độ bền vững qua các lần Gateway khởi động lại. Với các thao tác nền đơn lẻ, một [tác vụ](/vi/automation/tasks) thông thường là đủ.

| Kịch bản                              | Nên dùng              |
| ------------------------------------- | -------------------- |
| Công việc nền đơn lẻ                  | Tác vụ thông thường  |
| Pipeline nhiều bước (A rồi B rồi C)   | Task Flow (được quản lý) |
| Quan sát các tác vụ được tạo bên ngoài | Task Flow (phản chiếu) |
| Nhắc nhở một lần                      | Công việc Cron       |

## Mẫu quy trình được lên lịch đáng tin cậy

Với các quy trình lặp lại như bản tin tình báo thị trường, hãy xem lịch chạy, điều phối và kiểm tra độ tin cậy là các lớp riêng biệt:

1. Dùng [Scheduled Tasks](/vi/automation/cron-jobs) để định thời.
2. Dùng một phiên cron duy trì lâu dài khi quy trình cần xây dựng dựa trên ngữ cảnh trước đó.
3. Dùng [Lobster](/vi/tools/lobster) cho các bước xác định, cổng phê duyệt và token tiếp tục.
4. Dùng Task Flow để theo dõi lượt chạy nhiều bước qua các tác vụ con, khoảng chờ, lần thử lại và các lần Gateway khởi động lại.

Ví dụ về dạng cron:

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

Dùng `session:<id>` thay vì `isolated` khi quy trình lặp lại cần lịch sử có chủ đích, tóm tắt lượt chạy trước hoặc ngữ cảnh thường trực. Dùng `isolated` khi mỗi lượt chạy nên bắt đầu mới và mọi trạng thái bắt buộc đều được nêu rõ trong quy trình.

Bên trong quy trình, đặt các kiểm tra độ tin cậy trước bước tóm tắt bằng LLM:

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

Các kiểm tra preflight được khuyến nghị:

- Tình trạng khả dụng của trình duyệt và lựa chọn hồ sơ, ví dụ `openclaw` cho trạng thái được quản lý hoặc `user` khi cần phiên Chrome đã đăng nhập. Xem [Browser](/vi/tools/browser).
- Thông tin xác thực API và hạn ngạch cho từng nguồn.
- Khả năng truy cập mạng tới các endpoint bắt buộc.
- Các công cụ bắt buộc đã được bật cho agent, chẳng hạn như `lobster`, `browser` và `llm-task`.
- Điểm đến khi thất bại đã được cấu hình cho cron để các lỗi preflight hiển thị rõ. Xem [Scheduled Tasks](/vi/automation/cron-jobs#delivery-and-output).

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

Hãy để quy trình từ chối hoặc đánh dấu các mục cũ trước khi tóm tắt. Bước LLM chỉ nên nhận JSON có cấu trúc và nên được yêu cầu giữ nguyên `sourceUrl`, `retrievedAt` và `asOf` trong đầu ra. Dùng [LLM Task](/vi/tools/llm-task) khi bạn cần một bước mô hình được xác thực bằng schema bên trong quy trình.

Với các quy trình có thể tái sử dụng cho nhóm hoặc cộng đồng, hãy đóng gói CLI, các tệp `.lobster` và mọi ghi chú thiết lập dưới dạng skill hoặc plugin rồi phát hành qua [ClawHub](/clawhub). Giữ các biện pháp bảo vệ riêng của quy trình trong gói đó, trừ khi API plugin thiếu một năng lực chung cần thiết.

## Chế độ đồng bộ hóa

### Chế độ được quản lý

Task Flow sở hữu toàn bộ vòng đời từ đầu đến cuối. Nó tạo tác vụ dưới dạng các bước của luồng, điều khiển chúng đến khi hoàn tất và tự động tiến trạng thái luồng.

Ví dụ: một luồng báo cáo hằng tuần (1) thu thập dữ liệu, (2) tạo báo cáo và (3) gửi báo cáo. Task Flow tạo từng bước dưới dạng tác vụ nền, chờ hoàn tất rồi chuyển sang bước tiếp theo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Chế độ phản chiếu

Task Flow quan sát các tác vụ được tạo bên ngoài và giữ trạng thái luồng đồng bộ mà không sở hữu việc tạo tác vụ. Điều này hữu ích khi tác vụ bắt nguồn từ công việc cron, lệnh CLI hoặc các nguồn khác, và bạn muốn có một góc nhìn thống nhất về tiến độ của chúng như một luồng.

Ví dụ: ba công việc cron độc lập cùng tạo thành một quy trình "morning ops". Một luồng phản chiếu theo dõi tiến độ tập thể của chúng mà không kiểm soát thời điểm hoặc cách chúng chạy.

## Trạng thái bền vững và theo dõi bản sửa đổi

Mỗi luồng duy trì trạng thái riêng và theo dõi các bản sửa đổi để tiến độ vẫn tồn tại qua các lần Gateway khởi động lại. Theo dõi bản sửa đổi cho phép phát hiện xung đột khi nhiều nguồn cố gắng tiến cùng một luồng đồng thời.
Sổ đăng ký luồng dùng SQLite với bảo trì write-ahead-log có giới hạn, bao gồm
checkpoint định kỳ và khi tắt, để các Gateway chạy lâu không giữ lại
các tệp sidecar `registry.sqlite-wal` không giới hạn.

## Hành vi hủy

`openclaw tasks flow cancel` đặt một ý định hủy bám dính trên luồng. Các tác vụ đang hoạt động trong luồng bị hủy và không bước mới nào được bắt đầu. Ý định hủy vẫn tồn tại qua các lần khởi động lại, nên một luồng đã hủy vẫn giữ trạng thái đã hủy ngay cả khi Gateway khởi động lại trước khi mọi tác vụ con kết thúc.

## Lệnh CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Lệnh                              | Mô tả                                        |
| --------------------------------- | -------------------------------------------- |
| `openclaw tasks flow list`        | Hiển thị các luồng được theo dõi cùng trạng thái và chế độ đồng bộ hóa |
| `openclaw tasks flow show <id>`   | Kiểm tra một luồng theo ID luồng hoặc khóa tra cứu |
| `openclaw tasks flow cancel <id>` | Hủy một luồng đang chạy và các tác vụ đang hoạt động của nó |

## Luồng liên quan thế nào đến tác vụ

Luồng điều phối tác vụ, không thay thế chúng. Một luồng đơn lẻ có thể điều khiển nhiều tác vụ nền trong vòng đời của nó. Dùng `openclaw tasks` để kiểm tra từng bản ghi tác vụ và `openclaw tasks flow` để kiểm tra luồng điều phối.

## Liên quan

- [Background Tasks](/vi/automation/tasks) — sổ cái công việc tách rời mà các luồng điều phối
- [CLI: tasks](/vi/cli/tasks) — tham chiếu lệnh CLI cho `openclaw tasks flow`
- [Automation Overview](/vi/automation) — toàn bộ cơ chế tự động hóa trong một cái nhìn tổng quan
- [Cron Jobs](/vi/automation/cron-jobs) — các công việc được lên lịch có thể đưa dữ liệu vào luồng
