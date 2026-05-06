---
read_when:
    - Thiết lập các quy trình làm việc của tác nhân tự trị chạy mà không cần nhắc theo từng tác vụ
    - Xác định những gì tác nhân có thể tự thực hiện so với những gì cần sự phê duyệt của con người
    - Cấu trúc các tác tử đa chương trình với ranh giới và quy tắc chuyển cấp rõ ràng
summary: Xác định thẩm quyền vận hành thường trực cho các chương trình tác nhân tự trị
title: Chỉ thị thường trực
x-i18n:
    generated_at: "2026-05-06T09:02:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

Lệnh thường trực cấp cho tác tử của bạn **quyền vận hành lâu dài** đối với các chương trình đã xác định. Thay vì đưa ra chỉ dẫn cho từng tác vụ mỗi lần, bạn định nghĩa các chương trình với phạm vi, điều kiện kích hoạt và quy tắc leo thang rõ ràng - và tác tử sẽ tự chủ thực thi trong các ranh giới đó.

Đây là khác biệt giữa việc bảo trợ lý của bạn "gửi báo cáo hằng tuần" vào mỗi thứ Sáu với việc cấp quyền thường trực: "Bạn phụ trách báo cáo hằng tuần. Tổng hợp vào mỗi thứ Sáu, gửi đi, và chỉ leo thang nếu có điều gì đó không ổn."

## Vì sao cần lệnh thường trực

**Không có lệnh thường trực:**

- Bạn phải nhắc tác tử cho từng tác vụ
- Tác tử ở trạng thái nhàn rỗi giữa các yêu cầu
- Công việc thường lệ bị quên hoặc trì hoãn
- Bạn trở thành điểm nghẽn

**Có lệnh thường trực:**

- Tác tử tự chủ thực thi trong các ranh giới đã xác định
- Công việc thường lệ diễn ra đúng lịch mà không cần nhắc
- Bạn chỉ tham gia khi có ngoại lệ và phê duyệt
- Tác tử dùng thời gian nhàn rỗi một cách hiệu quả

## Cách chúng hoạt động

Lệnh thường trực được định nghĩa trong các tệp [không gian làm việc tác tử](/vi/concepts/agent-workspace) của bạn. Cách được khuyến nghị là đưa chúng trực tiếp vào `AGENTS.md` (được tự động chèn vào mỗi phiên) để tác tử luôn có chúng trong ngữ cảnh. Với cấu hình lớn hơn, bạn cũng có thể đặt chúng trong một tệp chuyên biệt như `standing-orders.md` và tham chiếu tệp đó từ `AGENTS.md`.

Mỗi chương trình chỉ định:

1. **Phạm vi** - tác tử được phép làm gì
2. **Điều kiện kích hoạt** - khi nào thực thi (lịch, sự kiện hoặc điều kiện)
3. **Cổng phê duyệt** - việc gì cần con người ký duyệt trước khi hành động
4. **Quy tắc leo thang** - khi nào dừng lại và yêu cầu trợ giúp

Tác tử tải các chỉ dẫn này trong mỗi phiên qua các tệp khởi tạo không gian làm việc (xem [Không gian làm việc tác tử](/vi/concepts/agent-workspace) để biết danh sách đầy đủ các tệp được tự động chèn) và thực thi theo chúng, kết hợp với [công việc Cron](/vi/automation/cron-jobs) để bắt buộc thực hiện theo thời gian.

<Tip>
Đặt lệnh thường trực trong `AGENTS.md` để bảo đảm chúng được tải trong mỗi phiên. Quy trình khởi tạo không gian làm việc tự động chèn `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` và `MEMORY.md` - nhưng không chèn các tệp tùy ý trong thư mục con.
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

## Lệnh thường trực cộng với công việc Cron

Lệnh thường trực định nghĩa tác tử được phép làm **gì**. [Công việc Cron](/vi/automation/cron-jobs) định nghĩa việc đó xảy ra **khi nào**. Chúng hoạt động cùng nhau:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Prompt của công việc Cron nên tham chiếu lệnh thường trực thay vì sao chép lại nó:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
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

Lệnh thường trực hoạt động tốt nhất khi được kết hợp với kỷ luật thực thi nghiêm ngặt. Mọi tác vụ trong một lệnh thường trực nên tuân theo vòng lặp này:

1. **Thực thi** - Làm công việc thực tế (không chỉ xác nhận chỉ dẫn)
2. **Xác minh** - Xác nhận kết quả là đúng (tệp tồn tại, tin nhắn đã được gửi, dữ liệu đã được phân tích)
3. **Báo cáo** - Cho chủ sở hữu biết đã làm gì và đã xác minh gì

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Mẫu này ngăn chế độ lỗi phổ biến nhất của tác tử: xác nhận một tác vụ mà không hoàn thành nó.

## Kiến trúc nhiều chương trình

Với các tác tử quản lý nhiều mối quan tâm, hãy tổ chức lệnh thường trực thành các chương trình riêng biệt với ranh giới rõ ràng:

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
- **Cổng phê duyệt** riêng (một số chương trình cần giám sát nhiều hơn chương trình khác)
- **Ranh giới** rõ ràng (tác tử nên biết nơi một chương trình kết thúc và chương trình khác bắt đầu)

## Phương pháp hay nhất

### Nên làm

- Bắt đầu với quyền hạn hẹp và mở rộng khi niềm tin tăng lên
- Định nghĩa các cổng phê duyệt rõ ràng cho các hành động rủi ro cao
- Bao gồm các phần "Không được làm gì" - ranh giới quan trọng không kém quyền hạn
- Kết hợp với công việc Cron để thực thi đáng tin cậy theo thời gian
- Xem lại nhật ký tác tử hằng tuần để xác minh lệnh thường trực đang được tuân thủ
- Cập nhật lệnh thường trực khi nhu cầu của bạn thay đổi - chúng là tài liệu sống

### Tránh

- Cấp quyền rộng ngay ngày đầu ("làm bất cứ điều gì bạn nghĩ là tốt nhất")
- Bỏ qua quy tắc leo thang - mọi chương trình đều cần một điều khoản "khi nào dừng lại và hỏi"
- Giả định tác tử sẽ nhớ các chỉ dẫn bằng lời - hãy đặt mọi thứ vào tệp
- Trộn nhiều mối quan tâm trong một chương trình duy nhất - dùng chương trình riêng cho từng miền riêng
- Quên bắt buộc thực thi bằng công việc Cron - lệnh thường trực không có điều kiện kích hoạt sẽ trở thành gợi ý

## Liên quan

- [Tự động hóa và tác vụ](/vi/automation): tất cả cơ chế tự động hóa trong một cái nhìn tổng quan.
- [Công việc Cron](/vi/automation/cron-jobs): bắt buộc theo lịch cho lệnh thường trực.
- [Hook](/vi/automation/hooks): tập lệnh theo sự kiện cho các sự kiện vòng đời tác tử.
- [Webhook](/vi/automation/cron-jobs#webhooks): điều kiện kích hoạt sự kiện HTTP gửi vào.
- [Không gian làm việc tác tử](/vi/concepts/agent-workspace): nơi lệnh thường trực được đặt, bao gồm danh sách đầy đủ các tệp khởi tạo được tự động chèn (`AGENTS.md`, `SOUL.md`, v.v.).
