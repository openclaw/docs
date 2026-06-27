---
read_when:
    - การใช้ /steer หรือ /tell ขณะที่เอเจนต์กำลังทำงานอยู่
    - การเปรียบเทียบโหมด /steer กับ /queue
    - การตัดสินใจว่าจะกำกับการรันปัจจุบันหรือเซสชัน ACP
sidebarTitle: Steer
summary: กำกับการรันที่กำลังทำงานอยู่โดยไม่เปลี่ยนโหมดคิว
title: นำทาง
x-i18n:
    generated_at: "2026-06-27T18:31:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` จะพยายามส่งคำแนะนำไปยังรันที่ทำงานอยู่แล้วก่อน ใช้สำหรับช่วงเวลาที่ต้องการ
"ปรับรันนี้ระหว่างที่ยังทำงานอยู่" หากรันไทม์ปัจจุบัน
ไม่สามารถรับการ steering ได้ OpenClaw จะส่งข้อความเป็น prompt ปกติแทน
การทิ้งข้อความนั้น

## เซสชันปัจจุบัน

ใช้ `/steer` ระดับบนสุดเพื่อกำหนดเป้าหมายไปยังรันที่ทำงานอยู่ของเซสชันปัจจุบัน:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

ลักษณะการทำงาน:

- กำหนดเป้าหมายเฉพาะรันที่ทำงานอยู่ของเซสชันปัจจุบันเท่านั้น
- ทำงานเป็นอิสระจากโหมด `/queue` ของเซสชัน
- เริ่ม turn ปกติด้วยข้อความเดียวกันเมื่อเซสชันว่างอยู่ หรือเมื่อรันที่ทำงานอยู่
  ไม่สามารถรับการ steering ได้
- ใช้เส้นทาง steering ของรันไทม์ที่ทำงานอยู่ ดังนั้นโมเดลจะเห็นคำแนะนำที่
  ขอบเขตรันไทม์ถัดไปที่รองรับ

## Steer เทียบกับ queue

`/queue steer` ทำให้ข้อความขาเข้าปกติพยายาม steering รันที่ทำงานอยู่เมื่อ
ข้อความมาถึงขณะที่มีรันกำลังทำงานอยู่ `/steer <message>` เป็นคำสั่งโดยตรง
ที่พยายามฉีดข้อความของคำสั่งนั้นเข้าไปในรันที่ทำงานอยู่ ณ ขอบเขตรันไทม์ถัดไป
ที่รองรับ โดยไม่ขึ้นกับการตั้งค่า `/queue` ที่จัดเก็บไว้ เมื่อ
การฉีดดังกล่าวใช้ไม่ได้ prefix ของคำสั่งจะถูกลบออก และ `<message>`
จะดำเนินต่อเป็น prompt ปกติ

ใช้:

- `/steer <message>` เมื่อคุณต้องการนำทางรันที่ทำงานอยู่ตอนนี้
- `/queue steer` เมื่อคุณต้องการให้ข้อความปกติในอนาคต steering รันที่ทำงานอยู่
  ตามค่าเริ่มต้น
- `/queue collect` หรือ `/queue followup` เมื่อข้อความปกติในอนาคตควรรอ
  turn ภายหลังแทนการ steering รันที่ทำงานอยู่
- `/queue interrupt` เมื่อข้อความล่าสุดควรแทนที่รันที่ทำงานอยู่
  แทนการ steering รันนั้น

สำหรับโหมด queue และขอบเขตการ steering โปรดดู [queue คำสั่ง](/th/concepts/queue) และ
[queue การ steering](/th/concepts/queue-steering)

## เอเจนต์ย่อย

`/steer` ระดับบนสุดกำหนดเป้าหมายไปยังรันที่ทำงานอยู่ของเซสชันปัจจุบัน เอเจนต์ย่อยรายงาน
กลับไปยังเซสชันพาเรนต์/ผู้ร้องขอของตน; `/subagents` มีไว้เพื่อการมองเห็นเท่านั้น

## เซสชัน ACP

ใช้ `/acp steer` เมื่อเป้าหมายคือเซสชัน harness ของ ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

ดู [เอเจนต์ ACP](/th/tools/acp-agents) สำหรับการเลือกเซสชัน ACP และลักษณะการทำงานของรันไทม์

## ที่เกี่ยวข้อง

- [คำสั่ง Slash](/th/tools/slash-commands)
- [queue คำสั่ง](/th/concepts/queue)
- [queue การ steering](/th/concepts/queue-steering)
- [เอเจนต์ย่อย](/th/tools/subagents)
