---
read_when:
    - Quyết định cách tự động hóa công việc với OpenClaw
    - Chọn giữa Heartbeat, Cron, cam kết, móc nối và lệnh thường trực
    - Tìm điểm vào tự động hóa phù hợp
summary: 'Tổng quan về các cơ chế tự động hóa: tác vụ, Cron, hook, lệnh thường trực và Task Flow'
title: Tự động hóa và tác vụ
x-i18n:
    generated_at: "2026-04-29T22:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2465c39f21db8bcb98f980a2c4b2c03018dddd5f43de59d8bf6ce0d6e97d9ef
    source_path: automation/index.md
    workflow: 16
---

OpenClaw chạy công việc trong nền thông qua tác vụ, công việc đã lên lịch, cam kết được suy luận, hook sự kiện và chỉ thị thường trực. Trang này giúp bạn chọn cơ chế phù hợp và hiểu cách chúng kết hợp với nhau.

## Hướng dẫn quyết định nhanh

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Trường hợp sử dụng                              | Khuyến nghị                | Lý do                                                   |
| ----------------------------------------------- | -------------------------- | ------------------------------------------------------- |
| Gửi báo cáo hằng ngày đúng 9 giờ sáng           | Tác vụ đã lên lịch (Cron)  | Thời điểm chính xác, thực thi tách biệt                 |
| Nhắc tôi sau 20 phút                            | Tác vụ đã lên lịch (Cron)  | Chạy một lần với thời điểm chính xác (`--at`)           |
| Chạy phân tích sâu hằng tuần                    | Tác vụ đã lên lịch (Cron)  | Tác vụ độc lập, có thể dùng mô hình khác                |
| Kiểm tra hộp thư đến mỗi 30 phút                | Heartbeat                  | Gộp với các kiểm tra khác, có nhận biết ngữ cảnh        |
| Theo dõi lịch cho các sự kiện sắp tới           | Heartbeat                  | Phù hợp tự nhiên với nhận biết định kỳ                  |
| Kiểm tra lại sau một cuộc phỏng vấn đã nhắc tới | Cam kết được suy luận      | Theo dõi giống bộ nhớ, không có yêu cầu nhắc chính xác  |
| Hỏi thăm nhẹ nhàng sau ngữ cảnh người dùng      | Cam kết được suy luận      | Giới hạn trong cùng agent và kênh                       |
| Kiểm tra trạng thái của subagent hoặc lần chạy ACP | Tác vụ nền              | Sổ cái tác vụ theo dõi mọi công việc tách rời           |
| Kiểm tra những gì đã chạy và thời điểm chạy     | Tác vụ nền                 | `openclaw tasks list` và `openclaw tasks audit`         |
| Nghiên cứu nhiều bước rồi tóm tắt               | Task Flow                  | Điều phối bền vững với theo dõi phiên bản sửa đổi       |
| Chạy script khi đặt lại phiên                   | Hook                       | Điều khiển bằng sự kiện, kích hoạt theo sự kiện vòng đời |
| Thực thi mã trong mỗi lệnh gọi công cụ          | Hook Plugin                | Hook trong tiến trình có thể chặn lệnh gọi công cụ      |
| Luôn kiểm tra tuân thủ trước khi trả lời        | Chỉ thị thường trực        | Tự động được đưa vào mọi phiên                          |

### Tác vụ đã lên lịch (Cron) so với Heartbeat

| Khía cạnh       | Tác vụ đã lên lịch (Cron)          | Heartbeat                              |
| --------------- | ---------------------------------- | -------------------------------------- |
| Thời điểm       | Chính xác (biểu thức cron, một lần) | Xấp xỉ (mặc định mỗi 30 phút)          |
| Ngữ cảnh phiên  | Mới (tách biệt) hoặc dùng chung    | Đầy đủ ngữ cảnh phiên chính            |
| Bản ghi tác vụ  | Luôn được tạo                      | Không bao giờ được tạo                 |
| Phân phối       | Kênh, webhook hoặc im lặng         | Nội tuyến trong phiên chính            |
| Phù hợp nhất cho | Báo cáo, lời nhắc, công việc nền  | Kiểm tra hộp thư, lịch, thông báo      |

Dùng Tác vụ đã lên lịch (Cron) khi bạn cần thời điểm chính xác hoặc thực thi tách biệt. Dùng Heartbeat khi công việc hưởng lợi từ ngữ cảnh phiên đầy đủ và thời điểm xấp xỉ là chấp nhận được.

## Khái niệm cốt lõi

### Tác vụ đã lên lịch (cron)

Cron là bộ lập lịch tích hợp của Gateway cho thời điểm chính xác. Nó lưu bền vững các công việc, đánh thức agent vào đúng thời điểm và có thể gửi đầu ra tới kênh trò chuyện hoặc endpoint webhook. Hỗ trợ lời nhắc một lần, biểu thức lặp lại và trigger webhook đến.

Xem [Tác vụ đã lên lịch](/vi/automation/cron-jobs).

### Tác vụ

Sổ cái tác vụ nền theo dõi mọi công việc tách rời: lần chạy ACP, tạo subagent, thực thi cron tách biệt và thao tác CLI. Tác vụ là bản ghi, không phải bộ lập lịch. Dùng `openclaw tasks list` và `openclaw tasks audit` để kiểm tra chúng.

Xem [Tác vụ nền](/vi/automation/tasks).

### Cam kết được suy luận

Cam kết là các bộ nhớ theo dõi ngắn hạn và cần bật rõ ràng. OpenClaw suy luận chúng từ các cuộc trò chuyện bình thường, giới hạn chúng trong cùng agent và kênh, rồi gửi các lần kiểm tra đến hạn thông qua heartbeat. Các lời nhắc chính xác do người dùng yêu cầu vẫn thuộc về cron.

Xem [Cam kết được suy luận](/vi/concepts/commitments).

### Task Flow

Task Flow là nền tảng điều phối luồng phía trên các tác vụ nền. Nó quản lý các luồng nhiều bước bền vững với chế độ đồng bộ được quản lý và phản chiếu, theo dõi phiên bản sửa đổi, cùng `openclaw tasks flow list|show|cancel` để kiểm tra.

Xem [Task Flow](/vi/automation/taskflow).

### Chỉ thị thường trực

Chỉ thị thường trực cấp cho agent quyền vận hành lâu dài cho các chương trình đã định nghĩa. Chúng nằm trong các tệp workspace (thường là `AGENTS.md`) và được đưa vào mọi phiên. Kết hợp với cron để thực thi theo thời gian.

Xem [Chỉ thị thường trực](/vi/automation/standing-orders).

### Hook

Hook nội bộ là các script điều khiển bằng sự kiện, được kích hoạt bởi sự kiện vòng đời agent (`/new`, `/reset`, `/stop`), compaction phiên, khởi động gateway và luồng tin nhắn. Chúng được tự động phát hiện từ các thư mục và có thể được quản lý bằng `openclaw hooks`. Để chặn lệnh gọi công cụ trong tiến trình, hãy dùng [hook Plugin](/vi/plugins/hooks).

Xem [Hook](/vi/automation/hooks).

### Heartbeat

Heartbeat là một lượt phiên chính định kỳ (mặc định mỗi 30 phút). Nó gộp nhiều kiểm tra (hộp thư đến, lịch, thông báo) trong một lượt agent với đầy đủ ngữ cảnh phiên. Các lượt Heartbeat không tạo bản ghi tác vụ và không kéo dài độ mới của việc đặt lại phiên hằng ngày/khi nhàn rỗi. Dùng `HEARTBEAT.md` cho một checklist nhỏ, hoặc khối `tasks:` khi bạn muốn các kiểm tra định kỳ chỉ chạy khi đến hạn bên trong chính heartbeat. Tệp heartbeat trống sẽ bỏ qua dưới dạng `empty-heartbeat-file`; chế độ tác vụ chỉ đến hạn bỏ qua dưới dạng `no-tasks-due`. Heartbeat trì hoãn khi công việc cron đang hoạt động hoặc đang xếp hàng, và `heartbeat.skipWhenBusy` cũng có thể trì hoãn chúng khi subagent hoặc các làn lồng nhau đang bận.

Xem [Heartbeat](/vi/gateway/heartbeat).

## Cách chúng hoạt động cùng nhau

- **Cron** xử lý lịch chính xác (báo cáo hằng ngày, đánh giá hằng tuần) và lời nhắc một lần. Mọi lần thực thi cron đều tạo bản ghi tác vụ.
- **Heartbeat** xử lý việc giám sát thường kỳ (hộp thư đến, lịch, thông báo) trong một lượt được gộp mỗi 30 phút.
- **Hook** phản ứng với các sự kiện cụ thể (đặt lại phiên, compaction, luồng tin nhắn) bằng script tùy chỉnh. Hook Plugin bao phủ lệnh gọi công cụ.
- **Chỉ thị thường trực** cung cấp cho agent ngữ cảnh bền vững và ranh giới quyền hạn.
- **Task Flow** điều phối các luồng nhiều bước phía trên từng tác vụ riêng lẻ.
- **Tác vụ** tự động theo dõi mọi công việc tách rời để bạn có thể kiểm tra và kiểm toán.

## Liên quan

- [Tác vụ đã lên lịch](/vi/automation/cron-jobs) — lập lịch chính xác và lời nhắc một lần
- [Cam kết được suy luận](/vi/concepts/commitments) — các lần kiểm tra theo dõi giống bộ nhớ
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho mọi công việc tách rời
- [Task Flow](/vi/automation/taskflow) — điều phối luồng nhiều bước bền vững
- [Hook](/vi/automation/hooks) — script vòng đời điều khiển bằng sự kiện
- [Hook Plugin](/vi/plugins/hooks) — hook trong tiến trình cho công cụ, prompt, tin nhắn và vòng đời
- [Chỉ thị thường trực](/vi/automation/standing-orders) — chỉ dẫn agent bền vững
- [Heartbeat](/vi/gateway/heartbeat) — các lượt phiên chính định kỳ
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — mọi khóa cấu hình
