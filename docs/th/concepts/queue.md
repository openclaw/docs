---
read_when:
    - การเปลี่ยนการดำเนินการหรือการทำงานพร้อมกันของการตอบกลับอัตโนมัติ
    - การอธิบายโหมด /queue หรือพฤติกรรมการกำหนดทิศทางข้อความ
summary: โหมดคิวการตอบกลับอัตโนมัติ ค่าเริ่มต้น และการแทนที่ต่อเซสชัน
title: คิวคำสั่ง
x-i18n:
    generated_at: "2026-04-30T18:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

เรา serialize การรัน auto-reply ขาเข้า (ทุกช่องทาง) ผ่านคิวขนาดเล็กในโปรเซส เพื่อป้องกันไม่ให้การรัน agent หลายรายการชนกัน ขณะเดียวกันยังคงอนุญาตให้ทำงานแบบขนานข้าม session ได้อย่างปลอดภัย

## เหตุผล

- การรัน auto-reply อาจมีค่าใช้จ่ายสูง (การเรียก LLM) และอาจชนกันเมื่อมีข้อความขาเข้าหลายข้อความเข้ามาในเวลาใกล้เคียงกัน
- การ serialize ช่วยหลีกเลี่ยงการแย่งใช้ทรัพยากรร่วมกัน (ไฟล์ session, log, CLI stdin) และลดโอกาสเกิด rate limit จาก upstream

## วิธีการทำงาน

- คิว FIFO ที่รับรู้ lane จะ drain แต่ละ lane ด้วยเพดาน concurrency ที่กำหนดค่าได้ (ค่าเริ่มต้น 1 สำหรับ lane ที่ไม่ได้กำหนดค่า; main มีค่าเริ่มต้นเป็น 4, subagent เป็น 8)
- `runEmbeddedPiAgent` enqueue ตาม **session key** (lane `session:<key>`) เพื่อรับประกันว่ามีการรันที่ active ได้เพียงรายการเดียวต่อ session
- จากนั้นการรันแต่ละ session จะถูกจัดคิวเข้า **global lane** (`main` เป็นค่าเริ่มต้น) เพื่อจำกัด parallelism โดยรวมด้วย `agents.defaults.maxConcurrent`
- เมื่อเปิดใช้ verbose logging การรันที่อยู่ในคิวจะ emit notice สั้น ๆ หากรอนานกว่า ~2s ก่อนเริ่ม
- typing indicator ยังทำงานทันทีเมื่อ enqueue (เมื่อช่องทางรองรับ) ดังนั้นประสบการณ์ผู้ใช้จะไม่เปลี่ยนแปลงระหว่างที่รอคิว

## ค่าเริ่มต้น

เมื่อไม่ได้ตั้งค่า surface ของช่องทางขาเข้าทั้งหมดจะใช้:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` เป็นค่าเริ่มต้นเพราะช่วยให้ turn ของ model ที่ active ยังตอบสนองได้ดีโดยไม่ต้อง
เริ่มการรัน session ที่สอง มันจะ drain ข้อความ steering ทั้งหมดที่เข้ามา
ก่อน boundary ของ model ถัดไป หากการรันปัจจุบันไม่สามารถรับ steering ได้
OpenClaw จะ fallback ไปเป็นรายการคิว followup

## โหมดคิว

ข้อความขาเข้าสามารถ steer การรันปัจจุบัน รอ turn followup หรือทำทั้งสองอย่างได้:

- `steer`: จัดคิวข้อความ steering เข้าไปใน runtime ที่ active Pi จะส่งข้อความ steering ที่ pending ทั้งหมด **หลังจาก assistant turn ปัจจุบันดำเนินการเรียก tool เสร็จแล้ว** ก่อนการเรียก LLM ถัดไป; Codex app-server จะได้รับ `turn/steer` แบบ batch หนึ่งรายการ หากการรันไม่ได้ streaming อย่าง active หรือ steering ไม่พร้อมใช้งาน OpenClaw จะ fallback ไปเป็นรายการคิว followup
- `queue` (legacy): steering แบบเดิมทีละรายการ Pi จะส่งข้อความ steering ที่จัดคิวไว้หนึ่งรายการที่แต่ละ model boundary; Codex app-server จะได้รับคำขอ `turn/steer` แยกกัน ควรใช้ `steer` เว้นแต่คุณต้องการพฤติกรรม serialized แบบก่อนหน้า
- `followup`: enqueue แต่ละข้อความสำหรับ agent turn ภายหลังหลังจากการรันปัจจุบันสิ้นสุด
- `collect`: รวมข้อความที่จัดคิวไว้เป็น turn followup **รายการเดียว** หลัง quiet window หากข้อความมุ่งไปยังช่องทาง/thread ต่างกัน ข้อความจะ drain แยกกันเพื่อรักษา routing
- `steer-backlog` (หรือ `steer+backlog`): steer ตอนนี้ **และ** เก็บข้อความเดียวกันไว้สำหรับ turn followup
- `interrupt` (legacy): abort การรันที่ active สำหรับ session นั้น แล้วรันข้อความล่าสุด

Steer-backlog หมายความว่าคุณอาจได้รับ response followup หลังจากการรันที่ถูก steer ดังนั้น
surface แบบ streaming อาจดูเหมือนมีรายการซ้ำ ควรใช้ `collect`/`steer` หากคุณต้องการ
หนึ่ง response ต่อหนึ่งข้อความขาเข้า

สำหรับ timing และพฤติกรรม dependency เฉพาะ runtime โปรดดู
[คิว steering](/th/concepts/queue-steering)

กำหนดค่าระดับ global หรือรายช่องทางผ่าน `messages.queue`:

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

ตัวเลือกมีผลกับ `followup`, `collect`, และ `steer-backlog` (และกับ `steer` หรือ legacy `queue` เมื่อ steering fallback ไปเป็น followup):

- `debounceMs`: quiet window ก่อน drain followup ที่จัดคิวไว้ ตัวเลขล้วนคือมิลลิวินาที; ตัวเลือก `/queue` รองรับหน่วย `ms`, `s`, `m`, `h`, และ `d`
- `cap`: จำนวนข้อความสูงสุดที่จัดคิวได้ต่อ session ค่าต่ำกว่า `1` จะถูกละเว้น
- `drop: "summarize"`: ค่าเริ่มต้น drop รายการที่เก่าที่สุดในคิวตามจำเป็น เก็บ summary แบบกระชับไว้ และ inject เป็น prompt followup สังเคราะห์
- `drop: "old"`: drop รายการที่เก่าที่สุดในคิวตามจำเป็น โดยไม่เก็บ summary
- `drop: "new"`: ปฏิเสธข้อความล่าสุดเมื่อคิวเต็มแล้ว

ค่าเริ่มต้น: `debounceMs: 500`, `cap: 20`, `drop: summarize`

## ลำดับความสำคัญ

สำหรับการเลือกโหมด OpenClaw จะ resolve ตามลำดับ:

1. override `/queue` แบบ inline หรือที่บันทึกไว้ต่อ session
2. `messages.queue.byChannel.<channel>`
3. `messages.queue.mode`
4. ค่าเริ่มต้น `steer`

สำหรับตัวเลือก ตัวเลือก `/queue` แบบ inline หรือที่บันทึกไว้จะชนะ config จากนั้น
จะใช้ debounce เฉพาะช่องทาง (`messages.queue.debounceMsByChannel`), ค่าเริ่มต้น debounce ของ Plugin,
ตัวเลือก global `messages.queue`, และค่าเริ่มต้นในตัวตามลำดับ `cap` และ `drop` เป็นตัวเลือกระดับ global/session ไม่ใช่ config key
รายช่องทาง

## Override ต่อ session

- ส่ง `/queue <mode>` เป็นคำสั่งเดี่ยวเพื่อบันทึกโหมดสำหรับ session ปัจจุบัน
- สามารถรวมตัวเลือกได้: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` หรือ `/queue reset` จะล้าง override ของ session

## ขอบเขตและการรับประกัน

- มีผลกับการรัน auto-reply agent ในทุกช่องทางขาเข้าที่ใช้ gateway reply pipeline (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat ฯลฯ)
- lane ค่าเริ่มต้น (`main`) เป็นระดับทั้งโปรเซสสำหรับ inbound + Heartbeat หลัก; ตั้งค่า `agents.defaults.maxConcurrent` เพื่ออนุญาตให้หลาย session ทำงานขนานกัน
- อาจมี lane เพิ่มเติม (เช่น `cron`, `cron-nested`, `nested`, `subagent`) เพื่อให้งานเบื้องหลังทำงานขนานกันได้โดยไม่ block การตอบกลับขาเข้า agent turn ของ Cron ที่แยกตัวจะถือ slot `cron` ไว้ ขณะที่การดำเนินการ agent ภายในใช้ `cron-nested`; ทั้งสองใช้ `cron.maxConcurrentRuns` flow `nested` ที่ไม่ใช่ Cron แบบ shared จะรักษาพฤติกรรม lane ของตัวเอง การรันแบบ detached เหล่านี้ถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)
- lane ต่อ session รับประกันว่ามี agent run เพียงรายการเดียวที่แตะ session ที่กำหนดในแต่ละครั้ง
- ไม่มี external dependency หรือ background worker thread; เป็น TypeScript + promise ล้วน

## การแก้ไขปัญหา

- หากคำสั่งดูเหมือนค้าง ให้เปิด verbose log และมองหาบรรทัด “queued for …ms” เพื่อยืนยันว่าคิวกำลัง drain
- หากคุณต้องการ queue depth ให้เปิด verbose log และดูบรรทัด timing ของคิว
- การรัน Codex app-server ที่รับ turn แล้วหยุด emit progress จะถูก interrupt โดย Codex adapter เพื่อให้ lane ของ session ที่ active สามารถ release ได้แทนที่จะรอ timeout ของการรันภายนอก
- เมื่อเปิดใช้ diagnostics แล้ว session ที่ยังอยู่ใน `processing` เกิน `diagnostics.stuckSessionWarnMs` จะ log คำเตือน stuck-session การรัน embedded ที่ active, การดำเนินการ reply ที่ active, และงาน lane ที่ active จะยังเป็นเพียงคำเตือนตามค่าเริ่มต้น; bookkeeping ตอน startup ที่ stale โดยไม่มีงาน session ที่ active สามารถ release lane ของ session ที่ได้รับผลกระทบเพื่อให้งานที่จัดคิวไว้ drain ได้

## ที่เกี่ยวข้อง

- [การจัดการ session](/th/concepts/session)
- [คิว steering](/th/concepts/queue-steering)
- [นโยบายการ retry](/th/concepts/retry)
