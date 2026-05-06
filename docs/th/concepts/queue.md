---
read_when:
    - การเปลี่ยนการดำเนินการตอบกลับอัตโนมัติหรือการทำงานพร้อมกัน
    - การอธิบายโหมด /queue หรือพฤติกรรมการกำหนดทิศทางข้อความ
summary: โหมดคิวการตอบกลับอัตโนมัติ ค่าเริ่มต้น และการกำหนดทับแบบรายเซสชัน
title: คิวคำสั่ง
x-i18n:
    generated_at: "2026-05-06T09:10:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

เราจัดลำดับการรันการตอบกลับอัตโนมัติขาเข้า (ทุกช่องทาง) ผ่านคิวขนาดเล็กในโปรเซส เพื่อป้องกันไม่ให้การรันเอเจนต์หลายรายการชนกัน ขณะเดียวกันยังอนุญาตให้ทำงานขนานระหว่างเซสชันได้อย่างปลอดภัย

## เหตุผล

- การรันการตอบกลับอัตโนมัติอาจมีค่าใช้จ่ายสูง (การเรียก LLM) และอาจชนกันเมื่อมีข้อความขาเข้าหลายข้อความเข้ามาในเวลาที่ใกล้กัน
- การจัดลำดับช่วยหลีกเลี่ยงการแข่งขันเพื่อใช้ทรัพยากรร่วมกัน (ไฟล์เซสชัน, ล็อก, CLI stdin) และลดโอกาสเกิด rate limit จาก upstream

## วิธีการทำงาน

- คิว FIFO ที่รับรู้ lane จะระบายแต่ละ lane ด้วยขีดจำกัด concurrency ที่กำหนดค่าได้ (ค่าเริ่มต้น 1 สำหรับ lane ที่ไม่ได้กำหนดค่า; main มีค่าเริ่มต้นเป็น 4, subagent เป็น 8)
- `runEmbeddedPiAgent` เข้าคิวตาม **session key** (lane `session:<key>`) เพื่อรับประกันว่ามีการรันที่ทำงานอยู่ได้เพียงหนึ่งรายการต่อเซสชัน
- จากนั้นการรันแต่ละเซสชันจะถูกเข้าคิวใน **global lane** (`main` โดยค่าเริ่มต้น) เพื่อให้ parallelism โดยรวมถูกจำกัดด้วย `agents.defaults.maxConcurrent`
- เมื่อเปิดใช้การบันทึกแบบ verbose การรันที่อยู่ในคิวจะส่งประกาศสั้น ๆ หากรอนานกว่า ~2s ก่อนเริ่ม
- ตัวบ่งชี้การพิมพ์ยังทำงานทันทีเมื่อเข้าคิว (เมื่อช่องทางรองรับ) ดังนั้นประสบการณ์ผู้ใช้จึงไม่เปลี่ยนแปลงระหว่างรอคิว

## ค่าเริ่มต้น

เมื่อไม่ได้ตั้งค่า พื้นผิวช่องทางขาเข้าทั้งหมดจะใช้:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` เป็นค่าเริ่มต้นเพราะช่วยให้ turn ของโมเดลที่ทำงานอยู่ตอบสนองได้ดีโดยไม่ต้อง
เริ่มการรันเซสชันที่สอง โดยจะระบายข้อความ steering ทั้งหมดที่มาถึง
ก่อนขอบเขตโมเดลถัดไป หากการรันปัจจุบันไม่สามารถรับ steering ได้
OpenClaw จะถอยกลับไปใช้รายการคิว followup

## โหมดคิว

ข้อความขาเข้าสามารถ steer การรันปัจจุบัน รอ turn followup หรือทำทั้งสองอย่างได้:

- `steer`: เข้าคิวข้อความ steering เข้าสู่ runtime ที่ทำงานอยู่ Pi จะส่งข้อความ steering ที่รอดำเนินการทั้งหมด **หลังจาก turn ของผู้ช่วยปัจจุบันรัน tool calls เสร็จแล้ว** ก่อนการเรียก LLM ครั้งถัดไป; Codex app-server ได้รับ `turn/steer` แบบรวมชุดหนึ่งรายการ หากการรันไม่ได้ streaming อย่างทำงานอยู่ หรือ steering ไม่พร้อมใช้งาน OpenClaw จะถอยกลับไปใช้รายการคิว followup
- `queue` (legacy): steering แบบเก่าที่ทำทีละรายการ Pi จะส่งข้อความ steering ที่เข้าคิวหนึ่งข้อความในแต่ละขอบเขตโมเดล; Codex app-server ได้รับคำขอ `turn/steer` แยกกัน ควรใช้ `steer` เว้นแต่คุณต้องการพฤติกรรม serialized แบบเดิม
- `followup`: เข้าคิวแต่ละข้อความสำหรับ turn เอเจนต์ภายหลังหลังจากการรันปัจจุบันสิ้นสุด
- `collect`: รวมข้อความที่เข้าคิวเป็น turn followup **เดียว** หลังจากช่วง quiet window หากข้อความมีเป้าหมายเป็นช่องทาง/เธรดต่างกัน ข้อความเหล่านั้นจะถูกระบายทีละรายการเพื่อคง routing ไว้
- `steer-backlog` (หรือ `steer+backlog`): steer ตอนนี้ **และ** เก็บข้อความเดียวกันไว้สำหรับ turn followup
- `interrupt` (legacy): ยกเลิกการรันที่ทำงานอยู่สำหรับเซสชันนั้น แล้วรันข้อความล่าสุด

Steer-backlog หมายความว่าคุณอาจได้รับการตอบกลับ followup หลังจากการรันที่ถูก steer ดังนั้น
พื้นผิว streaming อาจดูเหมือนซ้ำกัน ควรใช้ `collect`/`steer` หากคุณต้องการ
การตอบกลับหนึ่งรายการต่อข้อความขาเข้าหนึ่งข้อความ

สำหรับ timing และพฤติกรรม dependency เฉพาะ runtime โปรดดู
[คิว Steering](/th/concepts/queue-steering) สำหรับคำสั่ง `/steer <message>`
แบบชัดเจน โปรดดู [Steer](/th/tools/steer)

กำหนดค่าแบบ global หรือรายช่องทางผ่าน `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## ตัวเลือกคิว

ตัวเลือกใช้กับ `followup`, `collect`, และ `steer-backlog` (และกับ `steer` หรือ legacy `queue` เมื่อ steering ถอยกลับไปเป็น followup):

- `debounceMs`: quiet window ก่อนระบาย followup ที่เข้าคิว ตัวเลขล้วนคือมิลลิวินาที; ตัวหน่วย `ms`, `s`, `m`, `h`, และ `d` รองรับโดยตัวเลือก `/queue`
- `cap`: จำนวนข้อความที่เข้าคิวสูงสุดต่อเซสชัน ค่าต่ำกว่า `1` จะถูกละเว้น
- `drop: "summarize"`: ค่าเริ่มต้น ทิ้งรายการที่เข้าคิวเก่าที่สุดตามจำเป็น เก็บสรุปแบบกะทัดรัดไว้ และแทรกเป็น prompt followup สังเคราะห์
- `drop: "old"`: ทิ้งรายการที่เข้าคิวเก่าที่สุดตามจำเป็น โดยไม่เก็บสรุปไว้
- `drop: "new"`: ปฏิเสธข้อความใหม่ล่าสุดเมื่อคิวเต็มอยู่แล้ว

ค่าเริ่มต้น: `debounceMs: 500`, `cap: 20`, `drop: summarize`

## ลำดับความสำคัญ

สำหรับการเลือกโหมด OpenClaw จะ resolve ตามลำดับ:

1. override `/queue` แบบ inline หรือที่จัดเก็บไว้รายเซสชัน
2. `messages.queue.byChannel.<channel>`
3. `messages.queue.mode`
4. ค่าเริ่มต้น `steer`

สำหรับตัวเลือก ตัวเลือก `/queue` แบบ inline หรือที่จัดเก็บไว้จะชนะ config จากนั้น
จะใช้ debounce เฉพาะช่องทาง (`messages.queue.debounceMsByChannel`), ค่าเริ่มต้น debounce ของ Plugin,
ตัวเลือก global `messages.queue`, และค่าเริ่มต้นในตัว
`cap` และ `drop` เป็นตัวเลือก global/session ไม่ใช่คีย์ config รายช่องทาง

## override รายเซสชัน

- ส่ง `/queue <mode>` เป็นคำสั่งเดี่ยวเพื่อจัดเก็บโหมดสำหรับเซสชันปัจจุบัน
- สามารถรวมตัวเลือกได้: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` หรือ `/queue reset` จะล้าง override ของเซสชัน

## ขอบเขตและการรับประกัน

- ใช้กับการรันเอเจนต์ตอบกลับอัตโนมัติในทุกช่องทางขาเข้าที่ใช้ gateway reply pipeline (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat ฯลฯ)
- lane เริ่มต้น (`main`) ครอบคลุมทั้งโปรเซสสำหรับ inbound + main heartbeats; ตั้งค่า `agents.defaults.maxConcurrent` เพื่ออนุญาตให้หลายเซสชันทำงานขนานกัน
- อาจมี lane เพิ่มเติม (เช่น `cron`, `cron-nested`, `nested`, `subagent`) เพื่อให้งานพื้นหลังทำงานขนานได้โดยไม่บล็อกการตอบกลับขาเข้า turn ของเอเจนต์ cron แบบ isolated จะถือ slot `cron` ขณะที่การดำเนินการเอเจนต์ภายในใช้ `cron-nested`; ทั้งสองใช้ `cron.maxConcurrentRuns` โฟลว์ `nested` แบบ shared non-cron จะรักษาพฤติกรรม lane ของตัวเอง การรันแบบ detached เหล่านี้ถูกติดตามเป็น [งานพื้นหลัง](/th/automation/tasks)
- lane รายเซสชันรับประกันว่ามีการรันเอเจนต์เพียงหนึ่งรายการเท่านั้นที่แตะเซสชันใดเซสชันหนึ่งในแต่ละครั้ง
- ไม่มี dependency ภายนอกหรือ background worker threads; ใช้ TypeScript + promises ล้วน

## การแก้ไขปัญหา

- หากคำสั่งดูเหมือนค้าง ให้เปิดใช้ล็อก verbose และมองหาบรรทัด "queued for ...ms" เพื่อยืนยันว่าคิวกำลังระบาย
- หากคุณต้องการ queue depth ให้เปิดใช้ล็อก verbose และดูบรรทัด timing ของคิว
- การรัน Codex app-server ที่รับ turn แล้วหยุดส่ง progress จะถูก interrupt โดย Codex adapter เพื่อให้ lane ของเซสชันที่ทำงานอยู่ปล่อยได้ แทนที่จะรอ timeout ของการรันชั้นนอก
- เมื่อเปิดใช้ diagnostics เซสชันที่คงอยู่ใน `processing` เกิน `diagnostics.stuckSessionWarnMs` โดยไม่มี reply, tool, status, block หรือ ACP progress ที่สังเกตเห็น จะถูกจัดประเภทตามกิจกรรมปัจจุบัน งานที่ทำงานอยู่จะล็อกเป็น `session.long_running`; งานที่ทำงานอยู่แต่ไม่มี progress ล่าสุดจะล็อกเป็น `session.stalled`; `session.stuck` สงวนไว้สำหรับการทำ bookkeeping ของเซสชันที่เก่าและไม่มีงานที่ทำงานอยู่ และมีเพียง path นั้นเท่านั้นที่ปล่อย lane ของเซสชันที่ได้รับผลกระทบได้เพื่อให้คิวงานระบาย diagnostic `session.stuck` ที่เกิดซ้ำจะ back off ขณะที่เซสชันยังไม่เปลี่ยนแปลง

## ที่เกี่ยวข้อง

- [การจัดการเซสชัน](/th/concepts/session)
- [คิว Steering](/th/concepts/queue-steering)
- [Steer](/th/tools/steer)
- [นโยบายการ retry](/th/concepts/retry)
