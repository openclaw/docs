---
read_when:
    - การตั้งค่าเวิร์กโฟลว์เอเจนต์อัตโนมัติที่ทำงานโดยไม่ต้องป้อนพรอมต์สำหรับแต่ละงาน
    - การกำหนดสิ่งที่เอเจนต์สามารถดำเนินการได้อย่างอิสระ เทียบกับสิ่งที่ต้องได้รับการอนุมัติจากมนุษย์
    - การจัดโครงสร้างเอเจนต์แบบหลายโปรแกรมโดยกำหนดขอบเขตและกฎการยกระดับอย่างชัดเจน
summary: กำหนดอำนาจดำเนินการถาวรสำหรับโปรแกรมเอเจนต์อัตโนมัติ
title: คำสั่งประจำ
x-i18n:
    generated_at: "2026-07-12T15:50:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

คำสั่งถาวรมอบ **อำนาจดำเนินงานอย่างถาวร** ให้เอเจนต์ของคุณสำหรับโปรแกรมที่กำหนดไว้ แทนที่จะสั่งเอเจนต์สำหรับทุกงาน คุณกำหนดโปรแกรมพร้อมขอบเขต ตัวกระตุ้น และกฎการยกระดับที่ชัดเจน แล้วเอเจนต์จะดำเนินการโดยอัตโนมัติภายในขอบเขตเหล่านั้น เช่น “คุณรับผิดชอบรายงานประจำสัปดาห์ จัดทำทุกวันศุกร์ ส่งรายงาน และยกระดับเฉพาะเมื่อมีสิ่งผิดปกติ”

## เหตุผลที่ควรใช้คำสั่งถาวร

**หากไม่มีคำสั่งถาวร:** คุณต้องสั่งเอเจนต์สำหรับทุกงาน งานประจำอาจถูกลืมหรือล่าช้า และคุณจะกลายเป็นคอขวด

**เมื่อมีคำสั่งถาวร:** เอเจนต์จะดำเนินการโดยอัตโนมัติภายในขอบเขตที่กำหนด งานประจำจะเกิดขึ้นตามกำหนดเวลา และคุณจะเข้ามาเกี่ยวข้องเฉพาะกรณียกเว้นและการอนุมัติเท่านั้น

## วิธีการทำงาน

คำสั่งถาวรถูกกำหนดไว้ในไฟล์ [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace) ของคุณ แนวทางที่แนะนำคือใส่คำสั่งเหล่านี้ไว้ใน `AGENTS.md` โดยตรง (ซึ่งจะถูกแทรกโดยอัตโนมัติในทุกเซสชัน) เพื่อให้เอเจนต์มีคำสั่งเหล่านี้อยู่ในบริบทเสมอ สำหรับการกำหนดค่าขนาดใหญ่ คุณยังสามารถใส่ไว้ในไฟล์เฉพาะ เช่น `standing-orders.md` และอ้างอิงไฟล์นั้นจาก `AGENTS.md`

แต่ละโปรแกรมระบุสิ่งต่อไปนี้:

1. **ขอบเขต** - สิ่งที่เอเจนต์ได้รับอนุญาตให้ทำ
2. **ตัวกระตุ้น** - เวลาที่ต้องดำเนินการ (ตามกำหนดเวลา เหตุการณ์ หรือเงื่อนไข)
3. **จุดตรวจสอบการอนุมัติ** - สิ่งที่ต้องได้รับการรับรองจากมนุษย์ก่อนดำเนินการ
4. **กฎการยกระดับ** - เวลาที่ต้องหยุดและขอความช่วยเหลือ

เอเจนต์จะโหลดคำสั่งเหล่านี้ในทุกเซสชันผ่านไฟล์เริ่มต้นของพื้นที่ทำงาน (ดูรายการไฟล์ที่ถูกแทรกโดยอัตโนมัติทั้งหมดได้ที่ [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)) และดำเนินการตามคำสั่งเหล่านี้ โดยใช้ร่วมกับ [งาน Cron](/th/automation/cron-jobs) เพื่อบังคับใช้ตามเวลา

<Tip>
ใส่คำสั่งถาวรไว้ใน `AGENTS.md` เพื่อรับประกันว่าคำสั่งจะถูกโหลดในทุกเซสชัน กระบวนการเริ่มต้นพื้นที่ทำงานจะแทรก `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` และ `MEMORY.md` โดยอัตโนมัติ แต่จะไม่แทรกไฟล์ทั่วไปในไดเรกทอรีย่อย
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

คำสั่งถาวรกำหนดว่าเอเจนต์ได้รับอนุญาตให้ทำ **อะไร** ส่วน [งาน Cron](/th/automation/cron-jobs) กำหนดว่างานจะเกิดขึ้น **เมื่อใด** ทั้งสองส่วนทำงานร่วมกันดังนี้:

```text
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

พรอมต์ของงาน Cron ควรอ้างอิงคำสั่งถาวรแทนการทำซ้ำเนื้อหา:

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

## ตัวอย่าง

### ตัวอย่างที่ 1: เนื้อหาและสื่อสังคมออนไลน์ (รอบรายสัปดาห์)

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

### ตัวอย่างที่ 2: การดำเนินงานด้านการเงิน (กระตุ้นด้วยเหตุการณ์)

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

### ตัวอย่างที่ 3: การเฝ้าติดตามและการแจ้งเตือน (ต่อเนื่อง)

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

คำสั่งถาวรจะทำงานได้ดีที่สุดเมื่อใช้ร่วมกับวินัยในการดำเนินงานที่เคร่งครัด ทุกงานในคำสั่งถาวรควรเป็นไปตามวงจรนี้:

1. **ดำเนินการ** - ทำงานจริง (อย่าเพียงรับทราบคำสั่ง)
2. **ตรวจสอบ** - ยืนยันว่าผลลัพธ์ถูกต้อง (มีไฟล์อยู่จริง ส่งข้อความสำเร็จ แยกวิเคราะห์ข้อมูลแล้ว)
3. **รายงาน** - แจ้งเจ้าของว่าได้ทำอะไรและตรวจสอบอะไรแล้ว

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

รูปแบบนี้ช่วยป้องกันความล้มเหลวที่พบบ่อยที่สุดของเอเจนต์ นั่นคือการรับทราบงานโดยไม่ได้ทำให้เสร็จ

## สถาปัตยกรรมแบบหลายโปรแกรม

สำหรับเอเจนต์ที่จัดการหลายด้าน ให้จัดระเบียบคำสั่งถาวรเป็นโปรแกรมแยกกันโดยมีขอบเขตที่ชัดเจน:

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

- **จังหวะการกระตุ้น** ของตนเอง (รายสัปดาห์ รายเดือน ตามเหตุการณ์ หรือต่อเนื่อง)
- **จุดตรวจสอบการอนุมัติ** ของตนเอง (บางโปรแกรมต้องมีการกำกับดูแลมากกว่าโปรแกรมอื่น)
- **ขอบเขต** ที่ชัดเจน (เอเจนต์ควรรู้ว่าโปรแกรมหนึ่งสิ้นสุดและอีกโปรแกรมหนึ่งเริ่มต้นตรงไหน)

## แนวทางปฏิบัติที่ดีที่สุด

### ควรทำ

- เริ่มด้วยอำนาจที่จำกัดและขยายเมื่อความไว้วางใจเพิ่มขึ้น
- กำหนดจุดตรวจสอบการอนุมัติอย่างชัดเจนสำหรับการดำเนินการที่มีความเสี่ยงสูง
- ใส่ส่วน “สิ่งที่ห้ามทำ” เพราะขอบเขตมีความสำคัญพอ ๆ กับสิทธิ์
- ใช้ร่วมกับงาน Cron เพื่อให้การดำเนินการตามเวลามีความน่าเชื่อถือ
- ตรวจสอบบันทึกของเอเจนต์ทุกสัปดาห์เพื่อยืนยันว่ามีการปฏิบัติตามคำสั่งถาวร
- ปรับปรุงคำสั่งถาวรเมื่อความต้องการของคุณเปลี่ยนไป เพราะคำสั่งเหล่านี้เป็นเอกสารที่ปรับเปลี่ยนอยู่เสมอ

### ควรหลีกเลี่ยง

- มอบอำนาจกว้างขวางตั้งแต่วันแรก (“ทำสิ่งที่คุณคิดว่าดีที่สุดได้เลย”)
- ละเว้นกฎการยกระดับ เพราะทุกโปรแกรมต้องมีข้อกำหนดว่า “เมื่อใดต้องหยุดและถาม”
- คาดว่าเอเจนต์จะจำคำสั่งที่บอกด้วยวาจาได้ ให้ใส่ทุกอย่างไว้ในไฟล์
- รวมหลายเรื่องไว้ในโปรแกรมเดียว ให้แยกโปรแกรมสำหรับแต่ละขอบเขตงาน
- ลืมบังคับใช้ด้วยงาน Cron เพราะคำสั่งถาวรที่ไม่มีตัวกระตุ้นจะกลายเป็นเพียงคำแนะนำ

## เนื้อหาที่เกี่ยวข้อง

- [ระบบอัตโนมัติ](/th/automation): ภาพรวมกลไกการทำงานอัตโนมัติทั้งหมด
- [งาน Cron](/th/automation/cron-jobs): การบังคับใช้กำหนดเวลาสำหรับคำสั่งถาวร
- [Hooks](/th/automation/hooks): สคริปต์ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับเหตุการณ์ในวงจรชีวิตของเอเจนต์
- [Webhooks](/th/automation/cron-jobs#webhooks): ตัวกระตุ้นเหตุการณ์ HTTP ขาเข้า
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace): ตำแหน่งที่เก็บคำสั่งถาวร รวมถึงรายการไฟล์เริ่มต้นที่ถูกแทรกโดยอัตโนมัติทั้งหมด (`AGENTS.md`, `SOUL.md` และอื่น ๆ)
