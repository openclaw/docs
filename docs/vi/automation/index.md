---
doc-schema-version: 1
read_when:
    - Quyết định cách tự động hóa công việc bằng OpenClaw
    - Lựa chọn giữa Heartbeat, Cron, cam kết, hook và chỉ thị thường trực
    - Tìm điểm vào tự động hóa phù hợp
summary: 'Tổng quan về các cơ chế tự động hóa: tác vụ, Cron, hook, chỉ thị thường trực và TaskFlow'
title: Tự động hóa
x-i18n:
    generated_at: "2026-07-12T07:41:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

OpenClaw chạy công việc trong nền thông qua các tác vụ, công việc theo lịch, cam kết được suy luận, hook sự kiện và chỉ thị thường trực. Hãy dùng trang này để chọn cơ chế phù hợp.

## Hướng dẫn chọn nhanh

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

| Trường hợp sử dụng                                      | Khuyến nghị                 | Lý do                                                    |
| ------------------------------------------------------- | --------------------------- | -------------------------------------------------------- |
| Gửi báo cáo hằng ngày đúng 9 giờ sáng                   | Tác vụ theo lịch (Cron)     | Thời gian chính xác, thực thi độc lập                    |
| Nhắc tôi sau 20 phút                                    | Tác vụ theo lịch (Cron)     | Chạy một lần với thời gian chính xác (`--at`)            |
| Chạy phân tích chuyên sâu hằng tuần                      | Tác vụ theo lịch (Cron)     | Tác vụ độc lập, có thể dùng mô hình khác                 |
| Kiểm tra hộp thư đến mỗi 30 phút                         | Heartbeat                   | Gộp cùng các lượt kiểm tra khác, có nhận biết ngữ cảnh   |
| Theo dõi lịch để phát hiện các sự kiện sắp tới           | Heartbeat                   | Phù hợp tự nhiên với việc nhận biết định kỳ              |
| Hỏi thăm sau một cuộc phỏng vấn đã được đề cập           | Cam kết được suy luận       | Theo dõi tương tự bộ nhớ, không yêu cầu nhắc đúng giờ    |
| Nhẹ nhàng hỏi thăm dựa trên ngữ cảnh của người dùng      | Cam kết được suy luận       | Giới hạn trong cùng agent và kênh                        |
| Kiểm tra trạng thái của một agent con hoặc lượt chạy ACP | Tác vụ nền                  | Sổ tác vụ theo dõi mọi công việc chạy tách biệt          |
| Kiểm tra nội dung đã chạy và thời điểm chạy              | Tác vụ nền                  | `openclaw tasks list` và `openclaw tasks audit`          |
| Nghiên cứu nhiều bước rồi tóm tắt                        | Luồng tác vụ                | Điều phối bền vững với khả năng theo dõi bản sửa đổi     |
| Chạy tập lệnh khi đặt lại phiên                          | Hook                        | Hoạt động theo sự kiện, kích hoạt bởi sự kiện vòng đời   |
| Thực thi mã trong mỗi lần gọi công cụ                    | Hook của Plugin             | Hook trong tiến trình có thể chặn các lệnh gọi công cụ   |
| Luôn kiểm tra tuân thủ trước khi trả lời                 | Chỉ thị thường trực         | Tự động được đưa vào mọi phiên                           |

### Tác vụ theo lịch (Cron) so với Heartbeat

| Khía cạnh       | Tác vụ theo lịch (Cron)                   | Heartbeat                                  |
| --------------- | ----------------------------------------- | ------------------------------------------ |
| Thời gian       | Chính xác (biểu thức cron, chạy một lần)  | Xấp xỉ (mặc định mỗi 30 phút)              |
| Ngữ cảnh phiên  | Mới (độc lập) hoặc dùng chung             | Toàn bộ ngữ cảnh của phiên chính           |
| Bản ghi tác vụ  | Luôn được tạo                             | Không bao giờ được tạo                     |
| Phân phối       | Kênh, webhook hoặc im lặng                | Trực tiếp trong phiên chính                |
| Phù hợp nhất cho| Báo cáo, lời nhắc, công việc nền          | Kiểm tra hộp thư, lịch và thông báo        |

Dùng Tác vụ theo lịch (Cron) khi bạn cần thời gian chính xác hoặc thực thi độc lập. Dùng Heartbeat khi công việc hưởng lợi từ toàn bộ ngữ cảnh phiên và thời gian xấp xỉ là chấp nhận được.

## Khái niệm cốt lõi

### Tác vụ theo lịch (cron)

Cron là bộ lập lịch tích hợp sẵn của Gateway dành cho thời gian chính xác. Cron lưu giữ các công việc, đánh thức agent vào đúng thời điểm và có thể phân phối đầu ra đến một kênh trò chuyện hoặc điểm cuối webhook. Cron hỗ trợ lời nhắc chạy một lần, biểu thức lặp lại và tác nhân kích hoạt webhook gửi đến.

Xem [Tác vụ theo lịch](/vi/automation/cron-jobs).

### Tác vụ

Sổ tác vụ nền theo dõi mọi công việc chạy tách biệt: lượt chạy ACP, lượt tạo agent con, lượt thực thi cron độc lập và thao tác CLI. Tác vụ là bản ghi, không phải bộ lập lịch. Dùng `openclaw tasks list` và `openclaw tasks audit` để kiểm tra chúng.

Xem [Tác vụ nền](/vi/automation/tasks).

### Cam kết được suy luận

Cam kết là những ký ức theo dõi ngắn hạn mà người dùng chủ động bật. OpenClaw suy luận chúng từ các cuộc trò chuyện thông thường, giới hạn chúng trong cùng agent và kênh, đồng thời gửi các lượt hỏi thăm đến hạn qua Heartbeat. Những lời nhắc chính xác do người dùng yêu cầu vẫn thuộc về Cron.

Xem [Cam kết được suy luận](/vi/concepts/commitments).

### Luồng tác vụ

Luồng tác vụ là nền tảng điều phối luồng nằm trên các tác vụ nền. Nó quản lý các luồng nhiều bước bền vững bằng chế độ đồng bộ được quản lý và phản chiếu, theo dõi bản sửa đổi cùng `openclaw tasks flow list|show|cancel` để kiểm tra.

Xem [Luồng tác vụ](/vi/automation/taskflow).

### Chỉ thị thường trực

Chỉ thị thường trực cấp cho agent quyền vận hành lâu dài đối với các chương trình đã xác định. Chúng nằm trong các tệp không gian làm việc (thường là `AGENTS.md`) và được đưa vào mọi phiên. Kết hợp với Cron để thực thi theo thời gian.

Xem [Chỉ thị thường trực](/vi/automation/standing-orders).

### Hook

Hook nội bộ là các tập lệnh hoạt động theo sự kiện, được kích hoạt bởi các sự kiện vòng đời của agent (`/new`, `/reset`, `/stop`), quá trình Compaction phiên, lúc Gateway khởi động và luồng thông điệp. Chúng được phát hiện từ các thư mục hook và quản lý bằng `openclaw hooks`. Để chặn lệnh gọi công cụ trong tiến trình, hãy dùng [hook của Plugin](/vi/plugins/hooks).

Xem [Hook](/vi/automation/hooks).

### Heartbeat

Heartbeat là một lượt định kỳ trong phiên chính (mặc định mỗi 30 phút). Nó gộp nhiều lượt kiểm tra (hộp thư đến, lịch, thông báo) vào một lượt của agent với toàn bộ ngữ cảnh phiên. Các lượt Heartbeat không tạo bản ghi tác vụ và không kéo dài độ mới dùng để đặt lại phiên theo ngày hoặc khi không hoạt động. Dùng `HEARTBEAT.md` cho một danh sách kiểm tra nhỏ hoặc khối `tasks:` khi bạn chỉ muốn thực hiện các lượt kiểm tra định kỳ đến hạn ngay trong Heartbeat. Tệp Heartbeat trống sẽ bị bỏ qua với trạng thái `empty-heartbeat-file`; chế độ tác vụ chỉ chạy khi đến hạn sẽ bị bỏ qua với trạng thái `no-tasks-due`. Heartbeat trì hoãn khi công việc Cron đang hoạt động hoặc nằm trong hàng đợi; `heartbeat.skipWhenBusy` cũng có thể trì hoãn một agent khi các luồng agent con gắn với khóa phiên hoặc luồng lồng nhau của chính agent đó đang bận.

Xem [Heartbeat](/vi/gateway/heartbeat).

## Cách chúng phối hợp với nhau

- **Cron** xử lý lịch biểu chính xác (báo cáo hằng ngày, đánh giá hằng tuần) và lời nhắc chạy một lần. Mọi lượt thực thi Cron đều tạo bản ghi tác vụ.
- **Heartbeat** xử lý việc giám sát thường lệ (hộp thư đến, lịch, thông báo) trong một lượt được gộp mỗi 30 phút.
- **Hook** phản ứng với các sự kiện cụ thể (đặt lại phiên, Compaction, luồng thông điệp) bằng tập lệnh tùy chỉnh. Hook của Plugin bao quát các lệnh gọi công cụ.
- **Chỉ thị thường trực** cung cấp cho agent ngữ cảnh lâu dài và các ranh giới thẩm quyền.
- **Luồng tác vụ** điều phối các luồng nhiều bước nằm trên từng tác vụ riêng lẻ.
- **Tác vụ** tự động theo dõi mọi công việc chạy tách biệt để bạn có thể kiểm tra và kiểm toán.

## Liên quan

- [Tác vụ theo lịch](/vi/automation/cron-jobs) — lập lịch chính xác và lời nhắc chạy một lần
- [Cam kết được suy luận](/vi/concepts/commitments) — các lượt hỏi thăm theo dõi tương tự bộ nhớ
- [Tác vụ nền](/vi/automation/tasks) — sổ tác vụ dành cho mọi công việc chạy tách biệt
- [Luồng tác vụ](/vi/automation/taskflow) — điều phối luồng nhiều bước bền vững
- [Hook](/vi/automation/hooks) — tập lệnh vòng đời hoạt động theo sự kiện
- [Hook của Plugin](/vi/plugins/hooks) — hook trong tiến trình dành cho công cụ, lời nhắc, thông điệp và vòng đời
- [Chỉ thị thường trực](/vi/automation/standing-orders) — chỉ thị lâu dài dành cho agent
- [Heartbeat](/vi/gateway/heartbeat) — các lượt định kỳ trong phiên chính
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — mọi khóa cấu hình
