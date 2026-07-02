---
read_when:
    - Bạn muốn hiểu Luồng tác vụ liên quan như thế nào đến các tác vụ chạy nền
    - Bạn gặp TaskFlow hoặc luồng tác vụ openclaw trong ghi chú phát hành hoặc tài liệu
    - Bạn muốn kiểm tra hoặc quản lý trạng thái flow bền vững
summary: Lớp điều phối luồng tác vụ phía trên các tác vụ nền
title: Luồng tác vụ
x-i18n:
    generated_at: "2026-07-02T01:00:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow là tầng nền điều phối luồng nằm bên trên [tác vụ nền](/vi/automation/tasks). Nó quản lý các luồng nhiều bước bền vững với trạng thái, theo dõi bản sửa đổi và ngữ nghĩa đồng bộ riêng, trong khi từng tác vụ vẫn là đơn vị công việc tách rời.

## Khi nào dùng Task Flow

Dùng Task Flow khi công việc trải qua nhiều bước tuần tự hoặc rẽ nhánh và bạn cần theo dõi tiến độ bền vững qua các lần khởi động lại gateway. Với các thao tác nền đơn lẻ, một [tác vụ](/vi/automation/tasks) thông thường là đủ.

| Kịch bản                              | Sử dụng               |
| ------------------------------------- | --------------------- |
| Công việc nền đơn lẻ                  | Tác vụ thông thường   |
| Pipeline nhiều bước (A rồi B rồi C)   | Task Flow (quản lý)   |
| Quan sát các tác vụ được tạo bên ngoài | Task Flow (phản chiếu) |
| Lời nhắc một lần                      | Công việc Cron        |

## Mẫu quy trình đã lên lịch đáng tin cậy

Với các quy trình định kỳ như bản tóm tắt tình báo thị trường, hãy xem lịch, điều phối và kiểm tra độ tin cậy là các lớp riêng biệt:

1. Dùng [Tác vụ đã lên lịch](/vi/automation/cron-jobs) để định thời.
2. Lưu ngữ cảnh trước đó trong các tệp, cơ sở dữ liệu hoặc trạng thái công cụ riêng của quy trình.
3. Dùng [Lobster](/vi/tools/lobster) cho các bước tất định, cổng phê duyệt và token tiếp tục.
4. Dùng Task Flow để theo dõi lần chạy nhiều bước qua các tác vụ con, chờ đợi, thử lại và các lần khởi động lại gateway.

Ví dụ dạng cron:

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

Dùng `session:<id>` khi công việc cần nhắm tới một cuộc trò chuyện/phiên đã biết để có ngữ cảnh giao hàng hoặc gieo thiết lập ưu tiên an toàn. Cron vẫn thực thi mỗi lần chạy trong một phiên tách rời, vì vậy hãy đặt các tóm tắt lần chạy trước và trạng thái quy trình thường trực vào nơi lưu trữ rõ ràng mà công việc có thể đọc.

Bên trong quy trình, đặt kiểm tra độ tin cậy trước bước tóm tắt bằng LLM:

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

- Khả dụng của trình duyệt và lựa chọn hồ sơ, ví dụ `openclaw` cho trạng thái được quản lý hoặc `user` khi cần một phiên Chrome đã đăng nhập. Xem [Browser](/vi/tools/browser).
- Thông tin xác thực API và hạn mức cho từng nguồn.
- Khả năng kết nối mạng tới các endpoint bắt buộc.
- Các công cụ bắt buộc đã được bật cho agent, chẳng hạn như `lobster`, `browser`, và `llm-task`.
- Đích lỗi được cấu hình cho cron để các lỗi preflight hiển thị được. Xem [Tác vụ đã lên lịch](/vi/automation/cron-jobs#delivery-and-output).

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

Hãy để quy trình từ chối hoặc đánh dấu các mục cũ trước khi tóm tắt. Bước LLM chỉ nên nhận JSON có cấu trúc và nên được yêu cầu giữ nguyên `sourceUrl`, `retrievedAt`, và `asOf` trong đầu ra. Dùng [LLM Task](/vi/tools/llm-task) khi bạn cần một bước mô hình được xác thực bằng schema bên trong quy trình.

Với các quy trình có thể tái sử dụng cho đội nhóm hoặc cộng đồng, hãy đóng gói CLI, các tệp `.lobster` và mọi ghi chú thiết lập dưới dạng một skill hoặc plugin rồi phát hành qua [ClawHub](/clawhub). Giữ các rào chắn riêng của quy trình trong gói đó, trừ khi API plugin thiếu một năng lực chung cần thiết.

## Chế độ đồng bộ

### Chế độ quản lý

Task Flow sở hữu toàn bộ vòng đời từ đầu đến cuối. Nó tạo tác vụ dưới dạng các bước luồng, thúc đẩy chúng hoàn tất và tự động chuyển tiếp trạng thái luồng.

Ví dụ: một luồng báo cáo hằng tuần (1) thu thập dữ liệu, (2) tạo báo cáo, và (3) giao báo cáo. Task Flow tạo từng bước dưới dạng tác vụ nền, chờ hoàn tất, rồi chuyển sang bước tiếp theo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Chế độ phản chiếu

Task Flow quan sát các tác vụ được tạo bên ngoài và giữ trạng thái luồng đồng bộ mà không sở hữu việc tạo tác vụ. Điều này hữu ích khi các tác vụ bắt nguồn từ công việc cron, lệnh CLI hoặc nguồn khác và bạn muốn có một chế độ xem thống nhất về tiến độ của chúng dưới dạng một luồng.

Ví dụ: ba công việc cron độc lập cùng tạo thành một quy trình "morning ops". Một luồng phản chiếu theo dõi tiến độ tập thể của chúng mà không kiểm soát thời điểm hoặc cách chúng chạy.

## Trạng thái bền vững và theo dõi bản sửa đổi

Mỗi luồng duy trì trạng thái riêng và theo dõi các bản sửa đổi để tiến độ vẫn tồn tại qua các lần khởi động lại gateway. Theo dõi bản sửa đổi cho phép phát hiện xung đột khi nhiều nguồn cố gắng chuyển tiếp cùng một luồng đồng thời.
Sổ đăng ký luồng dùng SQLite với bảo trì write-ahead-log có giới hạn, bao gồm
các checkpoint định kỳ và khi tắt, để gateway chạy lâu không giữ lại
các tệp sidecar `registry.sqlite-wal` không giới hạn.

## Hành vi hủy

`openclaw tasks flow cancel` đặt ý định hủy cố định trên luồng. Các tác vụ đang hoạt động trong luồng bị hủy, và không bước mới nào được khởi động. Ý định hủy vẫn tồn tại qua các lần khởi động lại, vì vậy một luồng đã hủy vẫn ở trạng thái đã hủy ngay cả khi gateway khởi động lại trước khi tất cả tác vụ con đã kết thúc.

## Lệnh CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Lệnh                              | Mô tả                                             |
| --------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Hiển thị các luồng được theo dõi cùng trạng thái và chế độ đồng bộ |
| `openclaw tasks flow show <id>`   | Kiểm tra một luồng theo id luồng hoặc khóa tra cứu |
| `openclaw tasks flow cancel <id>` | Hủy một luồng đang chạy và các tác vụ đang hoạt động của nó |

## Cách luồng liên quan đến tác vụ

Luồng điều phối tác vụ, không thay thế chúng. Một luồng có thể thúc đẩy nhiều tác vụ nền trong suốt vòng đời của nó. Dùng `openclaw tasks` để kiểm tra từng bản ghi tác vụ và `openclaw tasks flow` để kiểm tra luồng điều phối.

## Liên quan

- [Tác vụ nền](/vi/automation/tasks) — sổ cái công việc tách rời mà các luồng điều phối
- [CLI: tasks](/vi/cli/tasks) — tham chiếu lệnh CLI cho `openclaw tasks flow`
- [Tổng quan tự động hóa](/vi/automation) — toàn bộ cơ chế tự động hóa nhìn tổng quan
- [Công việc Cron](/vi/automation/cron-jobs) — các công việc đã lên lịch có thể đưa vào luồng
