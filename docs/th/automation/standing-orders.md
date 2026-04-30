---
read_when:
    - การตั้งค่าเวิร์กโฟลว์เอเจนต์อัตโนมัติที่ทำงานได้โดยไม่ต้องป้อนพรอมป์สำหรับแต่ละงาน
    - การกำหนดสิ่งที่เอเจนต์สามารถทำได้ด้วยตนเอง เทียบกับสิ่งที่ต้องได้รับการอนุมัติจากมนุษย์
    - การจัดโครงสร้างเอเจนต์หลายโปรแกรมด้วยขอบเขตที่ชัดเจนและกฎการยกระดับ
summary: กำหนดอำนาจการปฏิบัติงานถาวรสำหรับโปรแกรมเอเจนต์อัตโนมัติ
title: คำสั่งถาวร
x-i18n:
    generated_at: "2026-04-30T09:35:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

คำสั่งถาวรมอบ **อำนาจปฏิบัติการแบบถาวร** ให้ตัวแทนของคุณสำหรับโปรแกรมที่กำหนดไว้ แทนที่จะให้คำสั่งงานรายครั้งทุกครั้ง คุณกำหนดโปรแกรมพร้อมขอบเขต ทริกเกอร์ และกฎการยกระดับที่ชัดเจน — แล้วตัวแทนจะดำเนินการเองภายในขอบเขตเหล่านั้น

นี่คือความแตกต่างระหว่างการบอกผู้ช่วยว่า "ส่งรายงานรายสัปดาห์" ทุกวันศุกร์ กับการมอบอำนาจถาวรว่า: "คุณเป็นเจ้าของรายงานรายสัปดาห์ รวบรวมทุกวันศุกร์ ส่งรายงาน และยกระดับเฉพาะเมื่อมีบางอย่างดูผิดปกติ"

## ทำไมต้องใช้คำสั่งถาวร

**หากไม่มีคำสั่งถาวร:**

- คุณต้อง prompt ตัวแทนสำหรับทุกงาน
- ตัวแทนนั่งว่างระหว่างคำขอ
- งานประจำถูกลืมหรือล่าช้า
- คุณกลายเป็นคอขวด

**เมื่อมีคำสั่งถาวร:**

- ตัวแทนดำเนินการเองภายในขอบเขตที่กำหนด
- งานประจำเกิดขึ้นตามกำหนดโดยไม่ต้อง prompt
- คุณเข้ามาเกี่ยวข้องเฉพาะข้อยกเว้นและการอนุมัติ
- ตัวแทนใช้เวลาว่างให้เกิดประโยชน์

## วิธีทำงาน

คำสั่งถาวรถูกกำหนดในไฟล์ [พื้นที่ทำงานของตัวแทน](/th/concepts/agent-workspace) ของคุณ แนวทางที่แนะนำคือใส่ไว้โดยตรงใน `AGENTS.md` (ซึ่งจะถูกฉีดเข้าให้อัตโนมัติทุกเซสชัน) เพื่อให้ตัวแทนมีคำสั่งเหล่านี้อยู่ในบริบทเสมอ สำหรับการตั้งค่าที่ใหญ่ขึ้น คุณยังสามารถวางไว้ในไฟล์เฉพาะ เช่น `standing-orders.md` แล้วอ้างอิงจาก `AGENTS.md` ได้

แต่ละโปรแกรมระบุ:

1. **ขอบเขต** — สิ่งที่ตัวแทนได้รับอนุญาตให้ทำ
2. **ทริกเกอร์** — เวลาที่ต้องดำเนินการ (กำหนดการ เหตุการณ์ หรือเงื่อนไข)
3. **ด่านอนุมัติ** — สิ่งที่ต้องให้มนุษย์อนุมัติก่อนดำเนินการ
4. **กฎการยกระดับ** — เวลาที่ต้องหยุดและขอความช่วยเหลือ

ตัวแทนโหลดคำสั่งเหล่านี้ทุกเซสชันผ่านไฟล์ bootstrap ของพื้นที่ทำงาน (ดู [พื้นที่ทำงานของตัวแทน](/th/concepts/agent-workspace) สำหรับรายการไฟล์ทั้งหมดที่ถูกฉีดเข้าให้อัตโนมัติ) และดำเนินการตามคำสั่งเหล่านั้น ร่วมกับ [งาน Cron](/th/automation/cron-jobs) สำหรับการบังคับใช้ตามเวลา

<Tip>
ใส่คำสั่งถาวรไว้ใน `AGENTS.md` เพื่อรับประกันว่าจะถูกโหลดทุกเซสชัน bootstrap ของพื้นที่ทำงานจะฉีด `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, และ `MEMORY.md` โดยอัตโนมัติ — แต่ไม่รวมไฟล์ตามอำเภอใจในไดเรกทอรีย่อย
</Tip>

## โครงสร้างของคำสั่งถาวร

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
- Do not skip delivery if metrics look bad — report accurately
```

## คำสั่งถาวรบวกงาน Cron

คำสั่งถาวรกำหนดว่า ตัวแทนได้รับอนุญาตให้ทำ **อะไร** [งาน Cron](/th/automation/cron-jobs) กำหนดว่า จะเกิดขึ้น **เมื่อไร** ทั้งสองทำงานร่วมกัน:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

prompt ของงาน Cron ควรอ้างอิงคำสั่งถาวรแทนการทำซ้ำเนื้อหา:

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

## ตัวอย่าง

### ตัวอย่างที่ 1: เนื้อหาและโซเชียลมีเดีย (รอบรายสัปดาห์)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### ตัวอย่างที่ 2: การดำเนินงานการเงิน (ทริกเกอร์ด้วยเหตุการณ์)

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

### ตัวอย่างที่ 3: การมอนิเตอร์และการแจ้งเตือน (ต่อเนื่อง)

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

## รูปแบบดำเนินการ-ตรวจสอบ-รายงาน

คำสั่งถาวรทำงานได้ดีที่สุดเมื่อรวมกับวินัยในการดำเนินการที่เข้มงวด ทุกงานในคำสั่งถาวรควรทำตามลูปนี้:

1. **ดำเนินการ** — ทำงานจริง (ไม่ใช่แค่รับทราบคำสั่ง)
2. **ตรวจสอบ** — ยืนยันว่าผลลัพธ์ถูกต้อง (ไฟล์มีอยู่ ส่งข้อความแล้ว แยกวิเคราะห์ข้อมูลแล้ว)
3. **รายงาน** — บอกเจ้าของว่าทำอะไรแล้วและตรวจสอบอะไรแล้ว

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

รูปแบบนี้ป้องกันโหมดความล้มเหลวที่พบบ่อยที่สุดของตัวแทน: การรับทราบงานโดยไม่ได้ทำให้เสร็จ

## สถาปัตยกรรมหลายโปรแกรม

สำหรับตัวแทนที่จัดการหลายประเด็น ให้จัดระเบียบคำสั่งถาวรเป็นโปรแกรมแยกกันพร้อมขอบเขตที่ชัดเจน:

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

แต่ละโปรแกรมควรมี:

- **จังหวะทริกเกอร์** ของตัวเอง (รายสัปดาห์ รายเดือน ขับเคลื่อนด้วยเหตุการณ์ ต่อเนื่อง)
- **ด่านอนุมัติ** ของตัวเอง (บางโปรแกรมต้องการการกำกับดูแลมากกว่าโปรแกรมอื่น)
- **ขอบเขต** ที่ชัดเจน (ตัวแทนควรรู้ว่าโปรแกรมหนึ่งสิ้นสุดที่ไหน และอีกโปรแกรมเริ่มที่ไหน)

## แนวทางปฏิบัติที่ดี

### ควรทำ

- เริ่มด้วยอำนาจที่แคบและขยายเมื่อความไว้วางใจเพิ่มขึ้น
- กำหนดด่านอนุมัติอย่างชัดเจนสำหรับการดำเนินการที่มีความเสี่ยงสูง
- รวมส่วน "สิ่งที่ห้ามทำ" — ขอบเขตสำคัญพอ ๆ กับสิทธิ์อนุญาต
- ใช้ร่วมกับงาน Cron เพื่อการดำเนินการตามเวลาที่เชื่อถือได้
- ตรวจสอบบันทึกของตัวแทนทุกสัปดาห์เพื่อยืนยันว่ามีการทำตามคำสั่งถาวร
- อัปเดตคำสั่งถาวรเมื่อความต้องการของคุณเปลี่ยนไป — เอกสารเหล่านี้เป็นเอกสารที่มีชีวิต

### ควรหลีกเลี่ยง

- มอบอำนาจกว้างตั้งแต่วันแรก ("ทำอะไรก็ได้ที่คุณคิดว่าดีที่สุด")
- ข้ามกฎการยกระดับ — ทุกโปรแกรมต้องมีข้อกำหนดว่า "เมื่อไรต้องหยุดและถาม"
- สมมติว่าตัวแทนจะจำคำสั่งด้วยวาจาได้ — ใส่ทุกอย่างไว้ในไฟล์
- ปะปนหลายประเด็นไว้ในโปรแกรมเดียว — แยกโปรแกรมสำหรับแต่ละโดเมน
- ลืมบังคับใช้ด้วยงาน Cron — คำสั่งถาวรที่ไม่มีทริกเกอร์จะกลายเป็นเพียงข้อเสนอแนะ

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation): กลไกระบบอัตโนมัติทั้งหมดโดยสรุป
- [งาน Cron](/th/automation/cron-jobs): การบังคับใช้กำหนดการสำหรับคำสั่งถาวร
- [Hooks](/th/automation/hooks): สคริปต์ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับเหตุการณ์ในวงจรชีวิตของตัวแทน
- [Webhooks](/th/automation/cron-jobs#webhooks): ทริกเกอร์เหตุการณ์ HTTP ขาเข้า
- [พื้นที่ทำงานของตัวแทน](/th/concepts/agent-workspace): ตำแหน่งที่คำสั่งถาวรอยู่ รวมถึงรายการไฟล์ bootstrap ทั้งหมดที่ถูกฉีดเข้าให้อัตโนมัติ (`AGENTS.md`, `SOUL.md`, ฯลฯ)
