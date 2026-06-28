---
read_when:
    - Thiết lập các quy trình làm việc của tác tử tự trị chạy mà không cần nhắc lệnh cho từng tác vụ
    - Xác định những việc tác tử có thể tự thực hiện so với những việc cần sự phê duyệt của con người
    - Cấu trúc các tác nhân đa chương trình với ranh giới rõ ràng và quy tắc chuyển cấp
summary: Xác định thẩm quyền vận hành thường trực cho các chương trình tác nhân tự trị
title: Chỉ thị thường trực
x-i18n:
    generated_at: "2026-05-12T00:56:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Các lệnh thường trực cấp cho agent của bạn **quyền vận hành lâu dài** đối với các chương trình đã xác định. Thay vì đưa hướng dẫn riêng lẻ cho từng tác vụ mỗi lần, bạn định nghĩa các chương trình với phạm vi, điều kiện kích hoạt và quy tắc leo thang rõ ràng - và agent tự động thực thi trong các ranh giới đó.

Đây là khác biệt giữa việc bảo trợ lý của bạn "gửi báo cáo hằng tuần" vào mỗi thứ Sáu và việc cấp quyền thường trực: "Bạn phụ trách báo cáo hằng tuần. Tổng hợp báo cáo vào mỗi thứ Sáu, gửi đi, và chỉ leo thang nếu có điều gì đó có vẻ không ổn."

## Vì sao cần lệnh thường trực

**Không có lệnh thường trực:**

- Bạn phải nhắc agent cho từng tác vụ
- Agent ở trạng thái nhàn rỗi giữa các yêu cầu
- Công việc định kỳ bị quên hoặc trì hoãn
- Bạn trở thành điểm nghẽn

**Có lệnh thường trực:**

- Agent tự động thực thi trong các ranh giới đã xác định
- Công việc định kỳ diễn ra đúng lịch mà không cần nhắc
- Bạn chỉ tham gia khi có ngoại lệ và phê duyệt
- Agent tận dụng thời gian nhàn rỗi một cách hiệu quả

## Cách hoạt động

Lệnh thường trực được định nghĩa trong các tệp [không gian làm việc của agent](/vi/concepts/agent-workspace). Cách được khuyến nghị là đưa chúng trực tiếp vào `AGENTS.md` (được tự động chèn vào mỗi phiên) để agent luôn có chúng trong ngữ cảnh. Với các cấu hình lớn hơn, bạn cũng có thể đặt chúng trong một tệp chuyên dụng như `standing-orders.md` và tham chiếu tệp đó từ `AGENTS.md`.

Mỗi chương trình chỉ định:

1. **Phạm vi** - agent được phép làm gì
2. **Điều kiện kích hoạt** - khi nào thực thi (lịch, sự kiện hoặc điều kiện)
3. **Cổng phê duyệt** - việc gì cần con người ký duyệt trước khi hành động
4. **Quy tắc leo thang** - khi nào dừng lại và yêu cầu trợ giúp

Agent tải các hướng dẫn này trong mỗi phiên thông qua các tệp khởi tạo không gian làm việc (xem [Không gian làm việc của agent](/vi/concepts/agent-workspace) để biết danh sách đầy đủ các tệp được tự động chèn) và thực thi theo chúng, kết hợp với [công việc Cron](/vi/automation/cron-jobs) để áp dụng theo thời gian.

<Tip>
Đặt lệnh thường trực trong `AGENTS.md` để đảm bảo chúng được tải trong mỗi phiên. Khởi tạo không gian làm việc tự động chèn `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` và `MEMORY.md` - nhưng không chèn các tệp tùy ý trong thư mục con.
</Tip>

## Cấu trúc của một lệnh thường trực

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## Lệnh thường trực kết hợp với công việc Cron

Lệnh thường trực định nghĩa agent được phép làm **gì**. [Công việc Cron](/vi/automation/cron-jobs) định nghĩa việc đó diễn ra **khi nào**. Chúng hoạt động cùng nhau:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Prompt của công việc Cron nên tham chiếu lệnh thường trực thay vì lặp lại nội dung của nó:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Ví dụ

### Ví dụ 1: nội dung và mạng xã hội (chu kỳ hằng tuần)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Ví dụ 2: vận hành tài chính (kích hoạt theo sự kiện)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Ví dụ 3: giám sát và cảnh báo (liên tục)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Mẫu thực thi-xác minh-báo cáo

Lệnh thường trực hiệu quả nhất khi kết hợp với kỷ luật thực thi nghiêm ngặt. Mọi tác vụ trong một lệnh thường trực nên tuân theo vòng lặp này:

1. **Thực thi** - Làm công việc thực tế (đừng chỉ xác nhận hướng dẫn)
2. **Xác minh** - Xác nhận kết quả là đúng (tệp tồn tại, tin nhắn đã gửi, dữ liệu đã phân tích)
3. **Báo cáo** - Cho chủ sở hữu biết việc gì đã được làm và điều gì đã được xác minh

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Mẫu này ngăn chế độ thất bại phổ biến nhất của agent: xác nhận một tác vụ mà không hoàn thành nó.

## Kiến trúc nhiều chương trình

Với các agent quản lý nhiều mối quan tâm, hãy tổ chức lệnh thường trực thành các chương trình riêng biệt với ranh giới rõ ràng:

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Mỗi chương trình nên có:

- **Nhịp kích hoạt** riêng (hằng tuần, hằng tháng, theo sự kiện, liên tục)
- **Cổng phê duyệt** riêng (một số chương trình cần giám sát nhiều hơn các chương trình khác)
- **Ranh giới** rõ ràng (agent nên biết một chương trình kết thúc ở đâu và chương trình khác bắt đầu ở đâu)

## Phương pháp tốt nhất

### Nên làm

- Bắt đầu với quyền hạn hẹp và mở rộng khi mức độ tin cậy tăng lên
- Định nghĩa cổng phê duyệt rõ ràng cho các hành động rủi ro cao
- Bao gồm các phần "Không được làm gì" - ranh giới cũng quan trọng như quyền hạn
- Kết hợp với công việc Cron để thực thi theo thời gian một cách đáng tin cậy
- Xem lại nhật ký agent hằng tuần để xác minh các lệnh thường trực đang được tuân thủ
- Cập nhật lệnh thường trực khi nhu cầu của bạn thay đổi - chúng là tài liệu sống

### Tránh

- Cấp quyền rộng ngay từ ngày đầu tiên ("làm bất cứ điều gì bạn nghĩ là tốt nhất")
- Bỏ qua quy tắc leo thang - mọi chương trình đều cần một điều khoản "khi nào dừng lại và hỏi"
- Giả định agent sẽ nhớ hướng dẫn bằng lời - hãy đưa mọi thứ vào tệp
- Trộn lẫn các mối quan tâm trong một chương trình duy nhất - tách chương trình cho từng miền riêng
- Quên áp dụng bằng công việc Cron - lệnh thường trực không có điều kiện kích hoạt sẽ trở thành gợi ý

## Liên quan

- [Tự động hóa](/vi/automation): tổng quan về tất cả cơ chế tự động hóa.
- [Công việc Cron](/vi/automation/cron-jobs): thực thi lịch cho lệnh thường trực.
- [Hook](/vi/automation/hooks): script theo sự kiện cho các sự kiện vòng đời của agent.
- [Webhook](/vi/automation/cron-jobs#webhooks): điều kiện kích hoạt sự kiện HTTP đầu vào.
- [Không gian làm việc của agent](/vi/concepts/agent-workspace): nơi lưu lệnh thường trực, bao gồm danh sách đầy đủ các tệp khởi tạo được tự động chèn (`AGENTS.md`, `SOUL.md`, v.v.).
