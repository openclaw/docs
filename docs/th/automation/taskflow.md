---
read_when:
    - คุณต้องการทำความเข้าใจว่า Task Flow เกี่ยวข้องกับงานเบื้องหลังอย่างไร
    - คุณพบ Task Flow หรือโฟลว์งานของ openclaw ในบันทึกประจำรุ่นหรือเอกสาร
    - คุณต้องการตรวจสอบหรือจัดการสถานะโฟลว์แบบคงทน
summary: ชั้นการประสานลำดับงานของ TaskFlow ที่อยู่เหนือ background tasks
title: ลำดับงาน
x-i18n:
    generated_at: "2026-04-25T13:41:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

Task Flow คือเลเยอร์พื้นฐานสำหรับการประสานลำดับงานที่อยู่เหนือ [background tasks](/th/automation/tasks) โดยจะจัดการโฟลว์หลายขั้นตอนแบบคงทนซึ่งมีสถานะของตัวเอง การติดตาม revision และความหมายเชิงการซิงก์ ขณะที่ task แต่ละรายการยังคงเป็นหน่วยของงานแบบแยกตัว

## ควรใช้ Task Flow เมื่อใด

ใช้ Task Flow เมื่องานครอบคลุมหลายขั้นตอนตามลำดับหรือแบบแตกแขนง และคุณต้องการการติดตามความคืบหน้าแบบคงทนข้ามการรีสตาร์ต Gateway สำหรับการดำเนินการเบื้องหลังเพียงรายการเดียว [task](/th/automation/tasks) แบบปกติก็เพียงพอ

| สถานการณ์                              | ใช้                     |
| ------------------------------------- | ----------------------- |
| งานเบื้องหลังรายการเดียว                 | task แบบปกติ             |
| ไปป์ไลน์หลายขั้นตอน (A แล้ว B แล้ว C)     | Task Flow (จัดการเอง)    |
| สังเกต tasks ที่ถูกสร้างจากภายนอก      | Task Flow (สะท้อนสถานะ) |
| การเตือนแบบครั้งเดียว                    | งาน Cron                |

## รูปแบบเวิร์กโฟลว์ตามกำหนดเวลาที่เชื่อถือได้

สำหรับเวิร์กโฟลว์ที่เกิดซ้ำ เช่น การสรุปข่าวกรองตลาด ให้แยกการตั้งเวลา การประสานงาน และการตรวจสอบความน่าเชื่อถือออกเป็นคนละชั้น:

1. ใช้ [Scheduled Tasks](/th/automation/cron-jobs) สำหรับการตั้งเวลา
2. ใช้เซสชัน Cron แบบถาวรเมื่อเวิร์กโฟลว์ควรต่อยอดจากบริบทก่อนหน้า
3. ใช้ [Lobster](/th/tools/lobster) สำหรับขั้นตอนที่กำหนดแน่นอน จุดอนุมัติ และโทเค็นสำหรับกลับมาทำต่อ
4. ใช้ Task Flow เพื่อติดตามการรันหลายขั้นตอนข้าม child tasks การรอ การลองใหม่ และการรีสตาร์ต Gateway

ตัวอย่างรูปแบบ Cron:

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

ใช้ `session:<id>` แทน `isolated` เมื่อเวิร์กโฟลว์ที่เกิดซ้ำต้องใช้ประวัติโดยตั้งใจ สรุปผลจากการรันก่อนหน้า หรือบริบทถาวร ใช้ `isolated` เมื่อแต่ละการรันควรเริ่มใหม่ทั้งหมด และสถานะที่จำเป็นทั้งหมดระบุไว้อย่างชัดเจนในเวิร์กโฟลว์

ภายในเวิร์กโฟลว์ ให้วางการตรวจสอบความน่าเชื่อถือไว้ก่อนขั้นตอนสรุปของ LLM:

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

การตรวจสอบ preflight ที่แนะนำ:

- ความพร้อมใช้งานของ Browser และการเลือกโปรไฟล์ เช่น `openclaw` สำหรับสถานะที่มีการจัดการ หรือ `user` เมื่อต้องใช้เซสชัน Chrome ที่ลงชื่อเข้าใช้แล้ว ดู [Browser](/th/tools/browser)
- ข้อมูลรับรอง API และโควตาสำหรับแต่ละแหล่งข้อมูล
- การเข้าถึงเครือข่ายสำหรับเอ็นด์พอยต์ที่จำเป็น
- เครื่องมือที่จำเป็นถูกเปิดใช้สำหรับเอเจนต์ เช่น `lobster`, `browser` และ `llm-task`
- กำหนดปลายทางเมื่อเกิดข้อผิดพลาดไว้สำหรับ Cron เพื่อให้มองเห็นความล้มเหลวของ preflight ดู [Scheduled Tasks](/th/automation/cron-jobs#delivery-and-output)

ฟิลด์แหล่งที่มาของข้อมูลที่แนะนำสำหรับรายการที่เก็บรวบรวมทุกชิ้น:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

ให้เวิร์กโฟลว์ปฏิเสธหรือทำเครื่องหมายรายการที่ล้าสมัยก่อนการสรุป ขั้นตอน LLM ควรได้รับเฉพาะ JSON ที่มีโครงสร้าง และควรถูกสั่งให้คง `sourceUrl`, `retrievedAt` และ `asOf` ไว้ในผลลัพธ์ ใช้ [LLM Task](/th/tools/llm-task) เมื่อต้องการขั้นตอน model ที่ตรวจสอบกับ schema ได้ภายในเวิร์กโฟลว์

สำหรับเวิร์กโฟลว์ที่นำกลับใช้ซ้ำได้สำหรับทีมหรือชุมชน ให้จัดแพ็กเกจ CLI, ไฟล์ `.lobster` และบันทึกการตั้งค่าที่เกี่ยวข้องเป็น skill หรือ Plugin และเผยแพร่ผ่าน [ClawHub](/th/tools/clawhub) ให้เก็บ guardrail เฉพาะของเวิร์กโฟลว์ไว้ในแพ็กเกจนั้น เว้นแต่ว่า Plugin API จะยังขาดความสามารถทั่วไปที่จำเป็น

## โหมดการซิงก์

### โหมดที่จัดการเอง

Task Flow เป็นเจ้าของวงจรชีวิตแบบครบต้นจนจบ มันสร้าง tasks เป็นขั้นตอนของโฟลว์ ขับเคลื่อนจนเสร็จสมบูรณ์ และเลื่อนสถานะโฟลว์โดยอัตโนมัติ

ตัวอย่าง: โฟลว์รายงานรายสัปดาห์ที่ (1) รวบรวมข้อมูล (2) สร้างรายงาน และ (3) ส่งมอบรายงาน Task Flow จะสร้างแต่ละขั้นตอนเป็น background task รอจนเสร็จสิ้น แล้วจึงไปยังขั้นตอนถัดไป

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### โหมดสะท้อนสถานะ

Task Flow จะสังเกต tasks ที่ถูกสร้างจากภายนอก และคงสถานะโฟลว์ให้ซิงก์กันโดยไม่เข้ามาเป็นเจ้าของการสร้าง task สิ่งนี้มีประโยชน์เมื่อ tasks มีต้นทางมาจากงาน Cron, คำสั่ง CLI หรือแหล่งอื่น และคุณต้องการมุมมองรวมของความคืบหน้าในรูปของโฟลว์

ตัวอย่าง: งาน Cron อิสระ 3 งานที่รวมกันเป็นกิจวัตร "morning ops" โฟลว์แบบสะท้อนสถานะจะติดตามความคืบหน้าโดยรวมของงานเหล่านั้นโดยไม่ควบคุมว่าเมื่อใดหรืออย่างไรที่งานเหล่านั้นทำงาน

## สถานะแบบคงทนและการติดตาม revision

แต่ละโฟลว์จะคงสถานะของตัวเองไว้และติดตาม revision เพื่อให้ความคืบหน้ายังคงอยู่แม้ Gateway จะรีสตาร์ต การติดตาม revision ช่วยให้ตรวจจับความขัดแย้งได้เมื่อมีหลายแหล่งพยายามเลื่อนโฟลว์เดียวกันพร้อมกัน

## พฤติกรรมการยกเลิก

`openclaw tasks flow cancel` จะตั้งเจตนาการยกเลิกแบบ sticky บนโฟลว์ tasks ที่ยังทำงานอยู่ภายในโฟลว์จะถูกยกเลิก และจะไม่เริ่มขั้นตอนใหม่ใด ๆ อีก เจตนาการยกเลิกนี้จะคงอยู่ข้ามการรีสตาร์ต ดังนั้นโฟลว์ที่ถูกยกเลิกจะยังคงถูกยกเลิก แม้ Gateway จะรีสตาร์ตก่อนที่ child tasks ทั้งหมดจะสิ้นสุดลงก็ตาม

## คำสั่ง CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| คำสั่ง                           | คำอธิบาย                                      |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | แสดงโฟลว์ที่ติดตามอยู่พร้อมสถานะและโหมดการซิงก์ |
| `openclaw tasks flow show <id>`   | ตรวจสอบโฟลว์หนึ่งรายการตาม flow id หรือ lookup key |
| `openclaw tasks flow cancel <id>` | ยกเลิกโฟลว์ที่กำลังทำงานและ tasks ที่ยังทำงานอยู่ |

## โฟลว์เกี่ยวข้องกับ tasks อย่างไร

โฟลว์ทำหน้าที่ประสานงาน tasks ไม่ได้มาแทนที่ tasks โฟลว์เดียวอาจขับเคลื่อน background tasks หลายรายการตลอดอายุการทำงานของมัน ใช้ `openclaw tasks` เพื่อตรวจสอบระเบียน task แต่ละรายการ และใช้ `openclaw tasks flow` เพื่อตรวจสอบโฟลว์ที่ทำหน้าที่ประสานงาน

## ที่เกี่ยวข้อง

- [Background Tasks](/th/automation/tasks) — บัญชีงานแบบแยกตัวที่โฟลว์ใช้ประสานงาน
- [CLI: tasks](/th/cli/tasks) — เอกสารอ้างอิงคำสั่ง CLI สำหรับ `openclaw tasks flow`
- [Automation Overview](/th/automation) — ภาพรวมของกลไก automation ทั้งหมด
- [Cron Jobs](/th/automation/cron-jobs) — งานตามกำหนดเวลาที่อาจป้อนเข้าสู่โฟลว์
