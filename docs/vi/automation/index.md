---
doc-schema-version: 1
read_when:
    - Quyết định cách tự động hóa công việc với OpenClaw
    - Chọn giữa Heartbeat, Cron, cam kết, hook và chỉ thị thường trực
    - Tìm điểm vào tự động hóa phù hợp
summary: 'Tổng quan về các cơ chế tự động hóa: tác vụ, Cron, móc nối, lệnh thường trực và Task Flow'
title: Tự động hóa
x-i18n:
    generated_at: "2026-05-12T23:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311ebbd557e40e38cd25b2f11b887baa4576657095d5a0841d4cb7f71898927d
    source_path: automation/index.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw chạy công việc trong nền thông qua tác vụ, công việc đã lên lịch, cam kết được suy luận,
event hook và chỉ dẫn thường trực. Trang này giúp bạn chọn
cơ chế phù hợp và hiểu cách chúng kết hợp với nhau.

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

| Trường hợp sử dụng                                | Khuyến nghị            | Lý do                                              |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| Gửi báo cáo hằng ngày đúng 9 giờ sáng         | Tác vụ đã lên lịch (Cron) | Thời điểm chính xác, thực thi tách biệt                 |
| Nhắc tôi sau 20 phút                 | Tác vụ đã lên lịch (Cron) | Chạy một lần với thời điểm chính xác (`--at`)            |
| Chạy phân tích sâu hằng tuần                | Tác vụ đã lên lịch (Cron) | Tác vụ độc lập, có thể dùng model khác         |
| Kiểm tra hộp thư đến mỗi 30 phút                | Heartbeat              | Gộp với các lần kiểm tra khác, có nhận biết ngữ cảnh         |
| Theo dõi lịch cho các sự kiện sắp tới    | Heartbeat              | Phù hợp tự nhiên với nhận biết định kỳ               |
| Kiểm tra lại sau một buổi phỏng vấn đã được nhắc tới    | Cam kết được suy luận   | Theo dõi giống bộ nhớ, không phải yêu cầu nhắc nhở chính xác |
| Kiểm tra quan tâm nhẹ nhàng sau ngữ cảnh người dùng | Cam kết được suy luận   | Giới hạn trong cùng agent và kênh             |
| Kiểm tra trạng thái của một subagent hoặc lần chạy ACP | Tác vụ nền       | Sổ cái tác vụ theo dõi mọi công việc tách rời            |
| Kiểm tra những gì đã chạy và khi nào                 | Tác vụ nền       | `openclaw tasks list` và `openclaw tasks audit` |
| Nghiên cứu nhiều bước rồi tóm tắt      | Luồng tác vụ              | Điều phối bền vững với theo dõi bản sửa đổi     |
| Chạy script khi đặt lại phiên           | Hook                  | Theo sự kiện, kích hoạt trên các sự kiện vòng đời          |
| Thực thi mã trên mỗi lần gọi công cụ         | Hook Plugin           | Hook trong tiến trình có thể chặn các lần gọi công cụ        |
| Luôn kiểm tra tuân thủ trước khi trả lời | Chỉ dẫn thường trực        | Tự động được chèn vào mọi phiên        |

### Tác vụ đã lên lịch (Cron) so với Heartbeat

| Khía cạnh       | Tác vụ đã lên lịch (Cron)              | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| Thời điểm          | Chính xác (biểu thức cron, chạy một lần)  | Xấp xỉ (mặc định mỗi 30 phút)    |
| Ngữ cảnh phiên | Mới (tách biệt) hoặc dùng chung          | Toàn bộ ngữ cảnh phiên chính             |
| Bản ghi tác vụ    | Luôn được tạo                      | Không bao giờ được tạo                         |
| Phân phối        | Kênh, webhook hoặc im lặng         | Nội tuyến trong phiên chính                |
| Phù hợp nhất cho        | Báo cáo, lời nhắc, công việc nền | Kiểm tra hộp thư đến, lịch, thông báo |

Dùng Tác vụ đã lên lịch (Cron) khi bạn cần thời điểm chính xác hoặc thực thi tách biệt. Dùng Heartbeat khi công việc được lợi từ toàn bộ ngữ cảnh phiên và thời điểm xấp xỉ là đủ.

## Khái niệm cốt lõi

### Tác vụ đã lên lịch (cron)

Cron là bộ lập lịch tích hợp sẵn của Gateway để định thời chính xác. Nó lưu giữ công việc, đánh thức agent vào đúng thời điểm và có thể phân phối đầu ra tới một kênh chat hoặc endpoint webhook. Hỗ trợ lời nhắc chạy một lần, biểu thức lặp lại và trình kích hoạt webhook đi vào.

Xem [Tác vụ đã lên lịch](/vi/automation/cron-jobs).

### Tác vụ

Sổ cái tác vụ nền theo dõi mọi công việc tách rời: lần chạy ACP, tạo subagent, thực thi cron tách biệt và thao tác CLI. Tác vụ là bản ghi, không phải bộ lập lịch. Dùng `openclaw tasks list` và `openclaw tasks audit` để kiểm tra chúng.

Xem [Tác vụ nền](/vi/automation/tasks).

### Cam kết được suy luận

Cam kết là các bộ nhớ theo dõi ngắn hạn, bật theo lựa chọn. OpenClaw suy luận chúng
từ các cuộc trò chuyện thông thường, giới hạn chúng trong cùng agent và kênh, rồi
phân phối các lần kiểm tra đến hạn thông qua heartbeat. Các lời nhắc chính xác do người dùng yêu cầu vẫn
thuộc về cron.

Xem [Cam kết được suy luận](/vi/concepts/commitments).

### Luồng tác vụ

Luồng tác vụ là nền tảng điều phối luồng phía trên các tác vụ nền. Nó quản lý các luồng nhiều bước bền vững với chế độ đồng bộ được quản lý và phản chiếu, theo dõi bản sửa đổi và `openclaw tasks flow list|show|cancel` để kiểm tra.

Xem [Luồng tác vụ](/vi/automation/taskflow).

### Chỉ dẫn thường trực

Chỉ dẫn thường trực cấp cho agent quyền vận hành lâu dài cho các chương trình đã xác định. Chúng nằm trong các tệp workspace (thường là `AGENTS.md`) và được chèn vào mọi phiên. Kết hợp với cron để thực thi theo thời gian.

Xem [Chỉ dẫn thường trực](/vi/automation/standing-orders).

### Hook

Hook nội bộ là các script theo sự kiện được kích hoạt bởi sự kiện vòng đời agent
(`/new`, `/reset`, `/stop`), Compaction phiên, khởi động gateway và luồng
tin nhắn. Chúng được tự động phát hiện từ các thư mục và có thể được quản lý
bằng `openclaw hooks`. Để chặn lần gọi công cụ trong tiến trình, hãy dùng
[hook Plugin](/vi/plugins/hooks).

Xem [Hook](/vi/automation/hooks).

### Heartbeat

Heartbeat là một lượt phiên chính định kỳ (mặc định mỗi 30 phút). Nó gộp nhiều lần kiểm tra (hộp thư đến, lịch, thông báo) trong một lượt agent với toàn bộ ngữ cảnh phiên. Các lượt Heartbeat không tạo bản ghi tác vụ và không kéo dài độ mới của việc đặt lại phiên hằng ngày/nhàn rỗi. Dùng `HEARTBEAT.md` cho một danh sách kiểm tra nhỏ, hoặc khối `tasks:` khi bạn muốn kiểm tra định kỳ chỉ khi đến hạn bên trong chính heartbeat. Tệp heartbeat rỗng được bỏ qua dưới dạng `empty-heartbeat-file`; chế độ tác vụ chỉ khi đến hạn được bỏ qua dưới dạng `no-tasks-due`. Heartbeat sẽ trì hoãn khi công việc cron đang hoạt động hoặc đang xếp hàng, và `heartbeat.skipWhenBusy` cũng có thể trì hoãn một agent khi subagent có khóa theo phiên của cùng agent đó hoặc các làn lồng nhau đang bận.

Xem [Heartbeat](/vi/gateway/heartbeat).

## Cách chúng hoạt động cùng nhau

- **Cron** xử lý lịch chính xác (báo cáo hằng ngày, đánh giá hằng tuần) và lời nhắc chạy một lần. Mọi lần thực thi cron đều tạo bản ghi tác vụ.
- **Heartbeat** xử lý giám sát thường lệ (hộp thư đến, lịch, thông báo) trong một lượt được gộp mỗi 30 phút.
- **Hook** phản ứng với các sự kiện cụ thể (đặt lại phiên, Compaction, luồng tin nhắn) bằng script tùy chỉnh. Hook Plugin bao phủ các lần gọi công cụ.
- **Chỉ dẫn thường trực** cung cấp cho agent ngữ cảnh bền vững và ranh giới quyền hạn.
- **Luồng tác vụ** điều phối các luồng nhiều bước phía trên từng tác vụ riêng lẻ.
- **Tác vụ** tự động theo dõi mọi công việc tách rời để bạn có thể kiểm tra và audit chúng.

## Liên quan

- [Tác vụ đã lên lịch](/vi/automation/cron-jobs) — lập lịch chính xác và lời nhắc chạy một lần
- [Cam kết được suy luận](/vi/concepts/commitments) — các lần kiểm tra theo dõi giống bộ nhớ
- [Tác vụ nền](/vi/automation/tasks) — sổ cái tác vụ cho mọi công việc tách rời
- [Luồng tác vụ](/vi/automation/taskflow) — điều phối luồng nhiều bước bền vững
- [Hook](/vi/automation/hooks) — script vòng đời theo sự kiện
- [hook Plugin](/vi/plugins/hooks) — hook công cụ, prompt, tin nhắn và vòng đời trong tiến trình
- [Chỉ dẫn thường trực](/vi/automation/standing-orders) — chỉ dẫn agent bền vững
- [Heartbeat](/vi/gateway/heartbeat) — lượt phiên chính định kỳ
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — tất cả khóa cấu hình
