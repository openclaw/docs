---
doc-schema-version: 1
read_when:
    - การตัดสินใจว่าจะทำให้งานเป็นอัตโนมัติด้วย OpenClaw อย่างไร
    - การเลือกระหว่าง Heartbeat, Cron, ข้อผูกมัด, ฮุก และคำสั่งถาวร
    - กำลังมองหาจุดเริ่มต้นการทำงานอัตโนมัติที่เหมาะสม
summary: 'ภาพรวมของกลไกการทำงานอัตโนมัติ: งาน, Cron, hook, คำสั่งประจำ และลำดับงาน'
title: ระบบอัตโนมัติ
x-i18n:
    generated_at: "2026-05-12T23:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311ebbd557e40e38cd25b2f11b887baa4576657095d5a0841d4cb7f71898927d
    source_path: automation/index.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw รันงานเบื้องหลังผ่านงาน, งานตามกำหนดเวลา, commitment ที่อนุมานได้, event hook และคำสั่งถาวร หน้านี้ช่วยให้คุณเลือกกลไกที่เหมาะสมและเข้าใจว่ากลไกเหล่านี้ทำงานร่วมกันอย่างไร

## คู่มือตัดสินใจแบบรวดเร็ว

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

| กรณีใช้งาน                              | แนะนำ                  | เหตุผล                                           |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| ส่งรายงานรายวันตรงเวลา 9 โมงเช้า        | งานตามกำหนดเวลา (Cron) | เวลาที่แน่นอน, การดำเนินการแบบแยกส่วน           |
| เตือนฉันในอีก 20 นาที                   | งานตามกำหนดเวลา (Cron) | แบบครั้งเดียวด้วยเวลาที่แม่นยำ (`--at`)          |
| รันการวิเคราะห์เชิงลึกรายสัปดาห์        | งานตามกำหนดเวลา (Cron) | งานแบบสแตนด์อโลน, ใช้โมเดลอื่นได้               |
| ตรวจกล่องจดหมายทุก 30 นาที             | Heartbeat              | รวมเป็นชุดกับการตรวจอื่น ๆ, รับรู้บริบท          |
| ตรวจปฏิทินสำหรับเหตุการณ์ที่กำลังจะมาถึง | Heartbeat              | เหมาะโดยธรรมชาติกับการรับรู้เป็นระยะ            |
| เช็กหลังการสัมภาษณ์ที่มีการกล่าวถึง      | commitment ที่อนุมานได้ | การติดตามผลแบบคล้ายหน่วยความจำ, ไม่ใช่คำขอเตือนเวลาที่แน่นอน |
| เช็กอินอย่างนุ่มนวลหลังบริบทของผู้ใช้    | commitment ที่อนุมานได้ | จำกัดขอบเขตอยู่ที่ agent และช่องทางเดิม          |
| ตรวจสอบสถานะของ subagent หรือการรัน ACP | งานเบื้องหลัง          | บัญชีแยกประเภทของงานติดตามงานแยกทั้งหมด          |
| ตรวจสอบว่ามีอะไรรันและเมื่อใด           | งานเบื้องหลัง          | `openclaw tasks list` และ `openclaw tasks audit` |
| วิจัยหลายขั้นตอนแล้วสรุป                | Task Flow              | การจัดลำดับงานที่คงทนพร้อมการติดตาม revision    |
| รันสคริปต์เมื่อรีเซ็ต session           | Hook                   | ขับเคลื่อนด้วย event, เรียกทำงานเมื่อมี lifecycle event |
| ดำเนินการโค้ดทุกครั้งที่เรียก tool       | Plugin hook            | hook ในกระบวนการสามารถดัก tool call ได้          |
| ตรวจ compliance ทุกครั้งก่อนตอบกลับ     | คำสั่งถาวร             | ถูกฉีดเข้าไปในทุก session โดยอัตโนมัติ           |

### งานตามกำหนดเวลา (Cron) เทียบกับ Heartbeat

| มิติ             | งานตามกำหนดเวลา (Cron)              | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| เวลา            | แน่นอน (cron expression, ครั้งเดียว) | โดยประมาณ (ค่าเริ่มต้นทุก 30 นาที)    |
| บริบท session   | ใหม่ (แยกส่วน) หรือใช้ร่วมกัน       | บริบท session หลักแบบเต็ม             |
| ระเบียนงาน      | สร้างเสมอ                           | ไม่สร้าง                              |
| การส่งมอบ       | ช่องทาง, webhook หรือเงียบ          | แบบ inline ใน session หลัก            |
| เหมาะสำหรับ     | รายงาน, การเตือน, งานเบื้องหลัง     | การตรวจกล่องจดหมาย, ปฏิทิน, การแจ้งเตือน |

ใช้ งานตามกำหนดเวลา (Cron) เมื่อคุณต้องการเวลาที่แม่นยำหรือการดำเนินการแบบแยกส่วน ใช้ Heartbeat เมื่องานได้ประโยชน์จากบริบท session แบบเต็มและเวลาที่ประมาณได้ก็เพียงพอ

## แนวคิดหลัก

### งานตามกำหนดเวลา (cron)

Cron คือ scheduler ในตัวของ Gateway สำหรับเวลาที่แม่นยำ โดยจะคงงานไว้, ปลุก agent ในเวลาที่เหมาะสม และส่งผลลัพธ์ไปยังช่องทางแชตหรือ endpoint ของ webhook ได้ รองรับการเตือนแบบครั้งเดียว, expression แบบเกิดซ้ำ และ trigger ของ webhook ขาเข้า

ดู [งานตามกำหนดเวลา](/th/automation/cron-jobs)

### งาน

บัญชีแยกประเภทของงานเบื้องหลังติดตามงานแยกทั้งหมด: การรัน ACP, การ spawn subagent, การดำเนินการ cron แบบแยกส่วน และการทำงานของ CLI งานเป็นระเบียน ไม่ใช่ scheduler ใช้ `openclaw tasks list` และ `openclaw tasks audit` เพื่อตรวจสอบ

ดู [งานเบื้องหลัง](/th/automation/tasks)

### commitment ที่อนุมานได้

commitment เป็นหน่วยความจำติดตามผลแบบ opt-in และมีอายุสั้น OpenClaw อนุมานจากบทสนทนาปกติ จำกัดขอบเขตไว้ที่ agent และช่องทางเดิม และส่งเช็กอินที่ถึงกำหนดผ่าน heartbeat การเตือนเวลาที่แน่นอนซึ่งผู้ใช้ร้องขอยังคงเป็นหน้าที่ของ cron

ดู [commitment ที่อนุมานได้](/th/concepts/commitments)

### Task Flow

Task Flow คือฐานรองรับการจัดลำดับ flow ที่อยู่เหนือกว่างานเบื้องหลัง จัดการ flow หลายขั้นตอนที่คงทนด้วยโหมด sync แบบ managed และ mirrored, การติดตาม revision และ `openclaw tasks flow list|show|cancel` สำหรับการตรวจสอบ

ดู [Task Flow](/th/automation/taskflow)

### คำสั่งถาวร

คำสั่งถาวรมอบอำนาจการปฏิบัติงานแบบถาวรให้ agent สำหรับโปรแกรมที่กำหนดไว้ คำสั่งเหล่านี้อยู่ในไฟล์ workspace (โดยทั่วไปคือ `AGENTS.md`) และถูกฉีดเข้าไปในทุก session ใช้ร่วมกับ cron สำหรับการบังคับใช้ตามเวลา

ดู [คำสั่งถาวร](/th/automation/standing-orders)

### Hook

hook ภายในคือสคริปต์ที่ขับเคลื่อนด้วย event ซึ่งถูก trigger โดย lifecycle event ของ agent (`/new`, `/reset`, `/stop`), session compaction, การเริ่มต้น gateway และ message flow ระบบจะค้นพบโดยอัตโนมัติจากไดเรกทอรีและจัดการได้ด้วย `openclaw hooks` สำหรับการดัก tool-call ในกระบวนการ ให้ใช้ [Plugin hook](/th/plugins/hooks)

ดู [Hook](/th/automation/hooks)

### Heartbeat

Heartbeat คือ turn ของ session หลักที่เกิดขึ้นเป็นระยะ (ค่าเริ่มต้นทุก 30 นาที) โดยรวมการตรวจหลายอย่าง (กล่องจดหมาย, ปฏิทิน, การแจ้งเตือน) ไว้ใน turn เดียวของ agent พร้อมบริบท session แบบเต็ม turn ของ Heartbeat จะไม่สร้างระเบียนงานและไม่ต่ออายุความสดของการรีเซ็ต session รายวัน/ว่าง ใช้ `HEARTBEAT.md` สำหรับเช็กลิสต์สั้น ๆ หรือบล็อก `tasks:` เมื่อคุณต้องการการตรวจเป็นระยะเฉพาะรายการที่ถึงกำหนดภายใน heartbeat เอง ไฟล์ heartbeat ว่างจะข้ามเป็น `empty-heartbeat-file`; โหมดงานเฉพาะที่ถึงกำหนดจะข้ามเป็น `no-tasks-due` Heartbeat จะเลื่อนออกไปขณะงาน cron กำลังทำงานหรืออยู่ในคิว และ `heartbeat.skipWhenBusy` ยังสามารถเลื่อน agent ออกไปเมื่อ subagent ที่อิง session-key หรือ lane ซ้อนของ agent เดียวกันกำลังยุ่งอยู่ได้

ดู [Heartbeat](/th/gateway/heartbeat)

## วิธีที่สิ่งเหล่านี้ทำงานร่วมกัน

- **Cron** จัดการกำหนดเวลาที่แม่นยำ (รายงานรายวัน, รีวิวรายสัปดาห์) และการเตือนแบบครั้งเดียว การดำเนินการ cron ทั้งหมดสร้างระเบียนงาน
- **Heartbeat** จัดการการเฝ้าตรวจตามปกติ (กล่องจดหมาย, ปฏิทิน, การแจ้งเตือน) ใน turn แบบรวมชุดหนึ่งครั้งทุก 30 นาที
- **Hook** ตอบสนองต่อ event เฉพาะ (การรีเซ็ต session, compaction, message flow) ด้วยสคริปต์ที่กำหนดเอง Plugin hook ครอบคลุม tool call
- **คำสั่งถาวร** ให้บริบทถาวรและขอบเขตอำนาจแก่ agent
- **Task Flow** ประสาน flow หลายขั้นตอนที่อยู่เหนือกว่างานแต่ละรายการ
- **งาน** ติดตามงานแยกทั้งหมดโดยอัตโนมัติเพื่อให้คุณตรวจสอบและ audit ได้

## ที่เกี่ยวข้อง

- [งานตามกำหนดเวลา](/th/automation/cron-jobs) — การกำหนดเวลาที่แม่นยำและการเตือนแบบครั้งเดียว
- [commitment ที่อนุมานได้](/th/concepts/commitments) — การเช็กอินติดตามผลแบบคล้ายหน่วยความจำ
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีแยกประเภทของงานสำหรับงานแยกทั้งหมด
- [Task Flow](/th/automation/taskflow) — การจัดลำดับ flow หลายขั้นตอนที่คงทน
- [Hook](/th/automation/hooks) — สคริปต์ lifecycle ที่ขับเคลื่อนด้วย event
- [Plugin hook](/th/plugins/hooks) — hook ในกระบวนการสำหรับ tool, prompt, message และ lifecycle
- [คำสั่งถาวร](/th/automation/standing-orders) — คำสั่ง agent แบบถาวร
- [Heartbeat](/th/gateway/heartbeat) — turn ของ session หลักที่เกิดขึ้นเป็นระยะ
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config ทั้งหมด
