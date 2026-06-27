---
read_when:
    - Bạn muốn hiểu TaskFlow liên quan như thế nào đến các tác vụ nền
    - Bạn gặp Task Flow hoặc luồng tác vụ openclaw trong ghi chú phát hành hoặc tài liệu
    - Bạn muốn kiểm tra hoặc quản lý trạng thái luồng bền vững
summary: Lớp điều phối luồng tác vụ phía trên các tác vụ nền
title: Luồng tác vụ
x-i18n:
    generated_at: "2026-06-27T17:09:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow là lớp nền điều phối luồng nằm trên [tác vụ nền](/vi/automation/tasks). Nó quản lý các luồng nhiều bước bền vững với trạng thái riêng, theo dõi phiên bản sửa đổi và ngữ nghĩa đồng bộ, trong khi từng tác vụ riêng lẻ vẫn là đơn vị công việc tách rời.

## Khi nào dùng Task Flow

Dùng Task Flow khi công việc trải dài qua nhiều bước tuần tự hoặc phân nhánh và bạn cần theo dõi tiến độ bền vững qua các lần khởi động lại gateway. Với các thao tác nền đơn lẻ, một [tác vụ](/vi/automation/tasks) thường là đủ.

| Tình huống                            | Dùng                 |
| ------------------------------------- | -------------------- |
| Một công việc nền đơn lẻ              | Tác vụ thường        |
| Pipeline nhiều bước (A rồi B rồi C)   | Task Flow (được quản lý) |
| Quan sát các tác vụ được tạo bên ngoài | Task Flow (được phản chiếu) |
| Nhắc việc một lần                     | Tác vụ Cron          |

## Mẫu workflow được lên lịch đáng tin cậy

Với các workflow định kỳ như bản tóm tắt tình báo thị trường, hãy xem lịch chạy, điều phối và kiểm tra độ tin cậy là các lớp riêng biệt:

1. Dùng [Tác vụ đã lên lịch](/vi/automation/cron-jobs) để định thời.
2. Dùng một phiên cron lâu bền khi workflow cần xây dựng dựa trên ngữ cảnh trước đó.
3. Dùng [Lobster](/vi/tools/lobster) cho các bước xác định, cổng phê duyệt và token tiếp tục.
4. Dùng Task Flow để theo dõi lượt chạy nhiều bước qua các tác vụ con, thời gian chờ, lần thử lại và các lần khởi động lại gateway.

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

Dùng `session:<id>` thay vì `isolated` khi workflow định kỳ cần lịch sử có chủ đích, tóm tắt các lần chạy trước hoặc ngữ cảnh thường trực. Dùng `isolated` khi mỗi lần chạy nên bắt đầu mới và toàn bộ trạng thái bắt buộc đã được nêu rõ trong workflow.

Bên trong workflow, đặt các bước kiểm tra độ tin cậy trước bước tóm tắt bằng LLM:

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

- Tính khả dụng của trình duyệt và lựa chọn hồ sơ, ví dụ `openclaw` cho trạng thái được quản lý hoặc `user` khi cần phiên Chrome đã đăng nhập. Xem [Trình duyệt](/vi/tools/browser).
- Thông tin xác thực API và hạn mức cho từng nguồn.
- Khả năng truy cập mạng tới các endpoint bắt buộc.
- Các công cụ bắt buộc đã bật cho agent, chẳng hạn như `lobster`, `browser` và `llm-task`.
- Đích lỗi đã được cấu hình cho cron để có thể thấy lỗi kiểm tra sơ bộ. Xem [Tác vụ đã lên lịch](/vi/automation/cron-jobs#delivery-and-output).

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

Hãy để workflow từ chối hoặc đánh dấu các mục cũ trước khi tóm tắt. Bước LLM chỉ nên nhận JSON có cấu trúc và nên được yêu cầu giữ nguyên `sourceUrl`, `retrievedAt` và `asOf` trong đầu ra. Dùng [Tác vụ LLM](/vi/tools/llm-task) khi bạn cần một bước mô hình được xác thực bằng schema bên trong workflow.

Với các workflow có thể tái sử dụng cho nhóm hoặc cộng đồng, hãy đóng gói CLI, các tệp `.lobster` và mọi ghi chú thiết lập dưới dạng skill hoặc plugin rồi phát hành qua [ClawHub](/vi/clawhub). Giữ các rào chắn dành riêng cho workflow trong gói đó, trừ khi API plugin thiếu một năng lực chung cần thiết.

## Chế độ đồng bộ

### Chế độ được quản lý

Task Flow sở hữu vòng đời từ đầu đến cuối. Nó tạo tác vụ dưới dạng các bước của luồng, thúc đẩy chúng đến hoàn tất và tự động tiến trạng thái luồng.

Ví dụ: một luồng báo cáo hằng tuần (1) thu thập dữ liệu, (2) tạo báo cáo và (3) gửi báo cáo. Task Flow tạo từng bước dưới dạng tác vụ nền, chờ hoàn tất rồi chuyển sang bước tiếp theo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Chế độ phản chiếu

Task Flow quan sát các tác vụ được tạo bên ngoài và giữ trạng thái luồng đồng bộ mà không sở hữu việc tạo tác vụ. Điều này hữu ích khi tác vụ bắt nguồn từ cron job, lệnh CLI hoặc các nguồn khác và bạn muốn có một chế độ xem thống nhất về tiến độ của chúng như một luồng.

Ví dụ: ba cron job độc lập cùng tạo thành một quy trình "vận hành buổi sáng". Một luồng phản chiếu theo dõi tiến độ chung của chúng mà không kiểm soát thời điểm hoặc cách chúng chạy.

## Trạng thái bền vững và theo dõi phiên bản sửa đổi

Mỗi luồng lưu bền vững trạng thái riêng và theo dõi các phiên bản sửa đổi để tiến độ vẫn tồn tại sau khi gateway khởi động lại. Theo dõi phiên bản sửa đổi cho phép phát hiện xung đột khi nhiều nguồn cố gắng tiến cùng một luồng đồng thời.
Sổ đăng ký luồng dùng SQLite với bảo trì write-ahead-log có giới hạn, bao gồm
checkpoint định kỳ và khi tắt, để các gateway chạy lâu không giữ lại
các tệp phụ `registry.sqlite-wal` không giới hạn.

## Hành vi hủy

`openclaw tasks flow cancel` đặt một ý định hủy bám dính trên luồng. Các tác vụ đang hoạt động trong luồng sẽ bị hủy và không có bước mới nào được bắt đầu. Ý định hủy vẫn tồn tại qua các lần khởi động lại, nên một luồng đã hủy vẫn bị hủy ngay cả khi gateway khởi động lại trước khi tất cả tác vụ con đã kết thúc.

## Lệnh CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Lệnh                              | Mô tả                                         |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Hiển thị các luồng được theo dõi cùng trạng thái và chế độ đồng bộ |
| `openclaw tasks flow show <id>`   | Kiểm tra một luồng theo id luồng hoặc khóa tra cứu |
| `openclaw tasks flow cancel <id>` | Hủy một luồng đang chạy và các tác vụ đang hoạt động của nó |

## Luồng liên hệ với tác vụ như thế nào

Luồng điều phối tác vụ, không thay thế chúng. Một luồng có thể điều khiển nhiều tác vụ nền trong suốt vòng đời của nó. Dùng `openclaw tasks` để kiểm tra từng bản ghi tác vụ và `openclaw tasks flow` để kiểm tra luồng điều phối.

## Liên quan

- [Tác vụ nền](/vi/automation/tasks) — sổ cái công việc tách rời mà các luồng điều phối
- [CLI: tác vụ](/vi/cli/tasks) — tài liệu tham khảo lệnh CLI cho `openclaw tasks flow`
- [Tổng quan tự động hóa](/vi/automation) — tất cả cơ chế tự động hóa trong một góc nhìn
- [Cron Jobs](/vi/automation/cron-jobs) — các tác vụ đã lên lịch có thể nạp vào luồng
