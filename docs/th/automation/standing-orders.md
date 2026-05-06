---
read_when:
    - การตั้งค่าเวิร์กโฟลว์เอเจนต์อัตโนมัติที่ทำงานโดยไม่ต้องป้อนพรอมป์แยกตามแต่ละงาน
    - การกำหนดว่าเอเจนต์สามารถทำอะไรได้โดยอิสระ เทียบกับสิ่งใดที่ต้องได้รับการอนุมัติจากมนุษย์
    - การจัดโครงสร้างเอเจนต์แบบหลายโปรแกรมด้วยขอบเขตที่ชัดเจนและกฎการยกระดับ
summary: กำหนดสิทธิ์ดำเนินการถาวรสำหรับโปรแกรมเอเจนต์อัตโนมัติ
title: คำสั่งถาวร
x-i18n:
    generated_at: "2026-05-06T09:02:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

คำสั่งถาวรมอบ **อำนาจปฏิบัติการแบบถาวร** ให้เอเจนต์ของคุณสำหรับโปรแกรมที่กำหนดไว้ แทนที่จะต้องให้คำสั่งงานรายครั้งทุกครั้ง คุณกำหนดโปรแกรมด้วยขอบเขต ทริกเกอร์ และกฎการยกระดับที่ชัดเจน - แล้วเอเจนต์จะดำเนินการเองภายในขอบเขตเหล่านั้น

นี่คือความแตกต่างระหว่างการบอกผู้ช่วยว่า "ส่งรายงานรายสัปดาห์" ทุกวันศุกร์ กับการมอบอำนาจถาวรว่า "คุณรับผิดชอบรายงานรายสัปดาห์ รวบรวมทุกวันศุกร์ ส่งรายงาน และยกระดับเฉพาะเมื่อมีบางอย่างดูผิดปกติ"

## เหตุผลที่ใช้คำสั่งถาวร

**เมื่อไม่มีคำสั่งถาวร:**

- คุณต้องสั่งเอเจนต์สำหรับทุกงาน
- เอเจนต์จะว่างอยู่ระหว่างคำขอ
- งานประจำถูกลืมหรือล่าช้า
- คุณกลายเป็นคอขวด

**เมื่อมีคำสั่งถาวร:**

- เอเจนต์ดำเนินการเองภายในขอบเขตที่กำหนด
- งานประจำเกิดขึ้นตามกำหนดโดยไม่ต้องสั่ง
- คุณเข้ามาเกี่ยวข้องเฉพาะกรณียกเว้นและการอนุมัติ
- เอเจนต์ใช้เวลาว่างให้เกิดประโยชน์

## วิธีทำงาน

คำสั่งถาวรถูกกำหนดไว้ในไฟล์ [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace) ของคุณ แนวทางที่แนะนำคือใส่ไว้โดยตรงใน `AGENTS.md` (ซึ่งถูกแทรกอัตโนมัติทุกเซสชัน) เพื่อให้เอเจนต์มีคำสั่งเหล่านี้ในบริบทเสมอ สำหรับการตั้งค่าขนาดใหญ่ขึ้น คุณยังสามารถวางไว้ในไฟล์เฉพาะ เช่น `standing-orders.md` และอ้างอิงจาก `AGENTS.md`

แต่ละโปรแกรมระบุ:

1. **ขอบเขต** - สิ่งที่เอเจนต์ได้รับอนุญาตให้ทำ
2. **ทริกเกอร์** - เมื่อใดให้ดำเนินการ (กำหนดเวลา เหตุการณ์ หรือเงื่อนไข)
3. **ด่านอนุมัติ** - สิ่งที่ต้องให้มนุษย์ลงนามอนุมัติก่อนดำเนินการ
4. **กฎการยกระดับ** - เมื่อใดให้หยุดและขอความช่วยเหลือ

เอเจนต์โหลดคำสั่งเหล่านี้ทุกเซสชันผ่านไฟล์บูตสแตรปของพื้นที่ทำงาน (ดู [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace) สำหรับรายการไฟล์ที่ถูกแทรกอัตโนมัติทั้งหมด) และดำเนินการตามคำสั่งเหล่านั้น ร่วมกับ [งาน Cron](/th/automation/cron-jobs) สำหรับการบังคับใช้ตามเวลา

<Tip>
ใส่คำสั่งถาวรไว้ใน `AGENTS.md` เพื่อรับประกันว่าจะถูกโหลดทุกเซสชัน บูตสแตรปของพื้นที่ทำงานจะแทรก `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` และ `MEMORY.md` อัตโนมัติ - แต่ไม่รวมไฟล์ใดๆ ในไดเรกทอรีย่อย
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
- Do not skip delivery if metrics look bad - report accurately
```

## คำสั่งถาวรร่วมกับงาน Cron

คำสั่งถาวรกำหนดว่าเอเจนต์ได้รับอนุญาตให้ทำ **อะไร** [งาน Cron](/th/automation/cron-jobs) กำหนดว่าเหตุการณ์นั้นเกิดขึ้น **เมื่อใด** ทั้งสองอย่างทำงานร่วมกัน:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

พรอมต์ของงาน Cron ควรอ้างอิงคำสั่งถาวรแทนที่จะทำซ้ำเนื้อหา:

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
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### ตัวอย่างที่ 2: การดำเนินงานด้านการเงิน (ทริกเกอร์จากเหตุการณ์)

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

1. **ดำเนินการ** - ทำงานจริง (ไม่ใช่แค่รับทราบคำสั่ง)
2. **ตรวจสอบ** - ยืนยันว่าผลลัพธ์ถูกต้อง (ไฟล์มีอยู่ ส่งข้อความแล้ว แยกวิเคราะห์ข้อมูลแล้ว)
3. **รายงาน** - บอกเจ้าของว่าทำอะไรไปแล้วและตรวจสอบอะไรแล้ว

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

รูปแบบนี้ป้องกันโหมดความล้มเหลวที่พบบ่อยที่สุดของเอเจนต์: การรับทราบงานโดยไม่ทำให้เสร็จ

## สถาปัตยกรรมหลายโปรแกรม

สำหรับเอเจนต์ที่จัดการหลายเรื่อง ให้จัดระเบียบคำสั่งถาวรเป็นโปรแกรมแยกกันพร้อมขอบเขตที่ชัดเจน:

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
- **ขอบเขต** ที่ชัดเจน (เอเจนต์ควรรู้ว่าโปรแกรมหนึ่งสิ้นสุดตรงไหนและอีกโปรแกรมเริ่มตรงไหน)

## แนวทางปฏิบัติที่ดี

### ควรทำ

- เริ่มด้วยอำนาจที่แคบและขยายเมื่อความไว้วางใจเพิ่มขึ้น
- กำหนดด่านอนุมัติที่ชัดเจนสำหรับการกระทำที่มีความเสี่ยงสูง
- ใส่ส่วน "สิ่งที่ห้ามทำ" - ขอบเขตสำคัญพอๆ กับสิทธิ์อนุญาต
- ใช้ร่วมกับงาน Cron เพื่อการดำเนินการตามเวลาที่เชื่อถือได้
- ตรวจสอบล็อกของเอเจนต์ทุกสัปดาห์เพื่อยืนยันว่ามีการปฏิบัติตามคำสั่งถาวร
- อัปเดตคำสั่งถาวรเมื่อความต้องการของคุณเปลี่ยนไป - สิ่งเหล่านี้เป็นเอกสารที่มีชีวิต

### หลีกเลี่ยง

- มอบอำนาจกว้างตั้งแต่วันแรก ("ทำอะไรก็ได้ที่คุณคิดว่าดีที่สุด")
- ข้ามกฎการยกระดับ - ทุกโปรแกรมต้องมีข้อกำหนดว่า "เมื่อใดให้หยุดและถาม"
- คิดว่าเอเจนต์จะจำคำสั่งด้วยวาจาได้ - ใส่ทุกอย่างไว้ในไฟล์
- รวมหลายเรื่องไว้ในโปรแกรมเดียว - แยกโปรแกรมสำหรับแต่ละโดเมน
- ลืมบังคับใช้ด้วยงาน Cron - คำสั่งถาวรที่ไม่มีทริกเกอร์จะกลายเป็นเพียงข้อเสนอแนะ

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation): กลไกระบบอัตโนมัติทั้งหมดในภาพรวม
- [งาน Cron](/th/automation/cron-jobs): การบังคับใช้กำหนดเวลาสำหรับคำสั่งถาวร
- [Hooks](/th/automation/hooks): สคริปต์ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับเหตุการณ์วงจรชีวิตของเอเจนต์
- [Webhooks](/th/automation/cron-jobs#webhooks): ทริกเกอร์เหตุการณ์ HTTP ขาเข้า
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace): ที่อยู่ของคำสั่งถาวร รวมถึงรายการไฟล์บูตสแตรปที่ถูกแทรกอัตโนมัติทั้งหมด (`AGENTS.md`, `SOUL.md` และอื่นๆ)
