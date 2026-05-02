---
read_when:
    - การเปลี่ยนการดำเนินการตอบกลับอัตโนมัติหรือการทำงานพร้อมกัน
    - การอธิบายโหมด /queue หรือพฤติกรรมการกำหนดทิศทางข้อความ
summary: โหมดคิวตอบกลับอัตโนมัติ ค่าเริ่มต้น และการกำหนดทับต่อเซสชัน
title: คิวคำสั่ง
x-i18n:
    generated_at: "2026-05-02T10:14:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

เราทำให้การรันการตอบกลับอัตโนมัติขาเข้า (ทุกช่องทาง) เป็นลำดับผ่านคิวขนาดเล็กภายในโปรเซส เพื่อป้องกันไม่ให้การรัน agent หลายรายการชนกัน ขณะเดียวกันยังอนุญาตให้ทำงานขนานอย่างปลอดภัยข้าม session ได้

## เหตุผล

- การรันการตอบกลับอัตโนมัติอาจมีต้นทุนสูง (การเรียก LLM) และอาจชนกันเมื่อมีข้อความขาเข้าหลายรายการมาถึงในเวลาใกล้กัน
- การทำให้เป็นลำดับช่วยหลีกเลี่ยงการแย่งใช้ทรัพยากรร่วมกัน (ไฟล์ session, บันทึก, stdin ของ CLI) และลดโอกาสเจอ rate limit จากต้นทาง

## วิธีทำงาน

- คิว FIFO ที่รู้จัก lane จะ drain แต่ละ lane ด้วยเพดาน concurrency ที่กำหนดค่าได้ (ค่าเริ่มต้น 1 สำหรับ lane ที่ไม่ได้กำหนดค่า; main มีค่าเริ่มต้นเป็น 4, subagent เป็น 8)
- `runEmbeddedPiAgent` เข้าคิวตาม **session key** (lane `session:<key>`) เพื่อรับประกันว่ามีการรันที่ทำงานอยู่เพียงหนึ่งรายการต่อ session
- จากนั้นการรันของแต่ละ session จะถูกเข้าคิวใน **global lane** (`main` ตามค่าเริ่มต้น) เพื่อจำกัด parallelism โดยรวมด้วย `agents.defaults.maxConcurrent`
- เมื่อเปิดใช้ verbose logging การรันที่เข้าคิวจะส่งประกาศสั้น ๆ หากรอนานกว่า ~2s ก่อนเริ่ม
- typing indicators ยังทำงานทันทีเมื่อเข้าคิว (เมื่อช่องทางรองรับ) ดังนั้นประสบการณ์ผู้ใช้จะไม่เปลี่ยนระหว่างที่รอคิว

## ค่าเริ่มต้น

เมื่อไม่ได้ตั้งค่า พื้นผิวช่องทางขาเข้าทั้งหมดจะใช้:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` เป็นค่าเริ่มต้นเพราะช่วยให้ model turn ที่กำลังทำงานตอบสนองได้ดีโดยไม่ต้อง
เริ่มการรัน session ที่สอง มันจะ drain ข้อความ steering ทั้งหมดที่มาถึง
ก่อนขอบเขต model ถัดไป หากการรันปัจจุบันรับ steering ไม่ได้
OpenClaw จะถอยกลับไปใช้รายการคิว followup

## โหมดคิว

ข้อความขาเข้าสามารถ steer การรันปัจจุบัน รอ turn followup หรือทำทั้งสองอย่างได้:

- `steer`: เข้าคิวข้อความ steering เข้าไปใน runtime ที่ทำงานอยู่ Pi ส่งข้อความ steering ที่ค้างอยู่ทั้งหมด **หลังจาก assistant turn ปัจจุบันรัน tool calls เสร็จ** ก่อนการเรียก LLM ถัดไป; Codex app-server รับ `turn/steer` ที่รวมเป็น batch หนึ่งรายการ หากการรันไม่ได้ streaming อยู่จริงหรือ steering ใช้ไม่ได้ OpenClaw จะถอยกลับไปใช้รายการคิว followup
- `queue` (เดิม): steering แบบเก่าทีละรายการ Pi ส่งข้อความ steering ที่เข้าคิวไว้หนึ่งรายการที่แต่ละขอบเขต model; Codex app-server รับคำขอ `turn/steer` แยกกัน ควรใช้ `steer` เว้นแต่คุณต้องการพฤติกรรมแบบ serialized เดิม
- `followup`: เข้าคิวแต่ละข้อความสำหรับ agent turn ภายหลังหลังจากการรันปัจจุบันจบ
- `collect`: รวมข้อความที่เข้าคิวเป็น turn followup **เดียว** หลังช่วง quiet window หากข้อความมีเป้าหมายเป็นช่องทาง/thread ต่างกัน จะ drain แยกกันเพื่อรักษา routing
- `steer-backlog` (หรือ `steer+backlog`): steer ตอนนี้ **และ** เก็บข้อความเดียวกันไว้สำหรับ turn followup
- `interrupt` (เดิม): ยกเลิกการรันที่ทำงานอยู่สำหรับ session นั้น แล้วรันข้อความล่าสุด

Steer-backlog หมายความว่าคุณอาจได้การตอบกลับ followup หลังการรันที่ถูก steer ดังนั้น
พื้นผิว streaming อาจดูเหมือนซ้ำกัน ควรใช้ `collect`/`steer` หากคุณต้องการ
หนึ่งคำตอบต่อข้อความขาเข้าหนึ่งรายการ

สำหรับ timing และพฤติกรรม dependency เฉพาะ runtime โปรดดู
[คิว Steering](/th/concepts/queue-steering)

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

ตัวเลือกใช้กับ `followup`, `collect`, และ `steer-backlog` (และกับ `steer` หรือ `queue` แบบเดิมเมื่อ steering ถอยกลับไปเป็น followup):

- `debounceMs`: ช่วง quiet window ก่อน drain followup ที่เข้าคิว ตัวเลขล้วนคือมิลลิวินาที; ตัวเลือก `/queue` ยอมรับหน่วย `ms`, `s`, `m`, `h` และ `d`
- `cap`: จำนวนข้อความสูงสุดที่เข้าคิวต่อ session ค่าต่ำกว่า `1` จะถูกละเว้น
- `drop: "summarize"`: ค่าเริ่มต้น ทิ้งรายการที่เก่าที่สุดในคิวตามจำเป็น เก็บสรุปแบบกะทัดรัดไว้ และฉีดเป็น prompt followup สังเคราะห์
- `drop: "old"`: ทิ้งรายการที่เก่าที่สุดในคิวตามจำเป็น โดยไม่เก็บสรุปไว้
- `drop: "new"`: ปฏิเสธข้อความล่าสุดเมื่อคิวเต็มอยู่แล้ว

ค่าเริ่มต้น: `debounceMs: 500`, `cap: 20`, `drop: summarize`

## ลำดับความสำคัญ

สำหรับการเลือกโหมด OpenClaw จะ resolve ตามนี้:

1. override ของ `/queue` แบบ inline หรือที่จัดเก็บไว้ราย session
2. `messages.queue.byChannel.<channel>`
3. `messages.queue.mode`
4. ค่าเริ่มต้น `steer`

สำหรับตัวเลือก ตัวเลือก `/queue` แบบ inline หรือที่จัดเก็บไว้จะชนะ config จากนั้นจึงใช้
debounce เฉพาะช่องทาง (`messages.queue.debounceMsByChannel`), ค่าเริ่มต้น
debounce ของ Plugin, ตัวเลือก `messages.queue` แบบ global และค่าเริ่มต้นในตัว
`cap` และ `drop` เป็นตัวเลือก global/session ไม่ใช่คีย์ config รายช่องทาง

## Override ราย session

- ส่ง `/queue <mode>` เป็นคำสั่งเดี่ยวเพื่อจัดเก็บโหมดสำหรับ session ปัจจุบัน
- รวมตัวเลือกได้: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` หรือ `/queue reset` จะล้าง override ของ session

## ขอบเขตและการรับประกัน

- ใช้กับการรัน agent ตอบกลับอัตโนมัติในทุกช่องทางขาเข้าที่ใช้ไปป์ไลน์ตอบกลับของ Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat ฯลฯ)
- lane ค่าเริ่มต้น (`main`) ครอบคลุมทั้งโปรเซสสำหรับขาเข้า + Heartbeat หลัก; ตั้งค่า `agents.defaults.maxConcurrent` เพื่ออนุญาตให้หลาย session ทำงานขนานกัน
- อาจมี lane เพิ่มเติม (เช่น `cron`, `cron-nested`, `nested`, `subagent`) เพื่อให้งานเบื้องหลังทำงานขนานได้โดยไม่บล็อกการตอบกลับขาเข้า turn ของ agent Cron แบบ isolated จะถือ slot `cron` ไว้ขณะที่การรัน agent ภายในใช้ `cron-nested`; ทั้งสองใช้ `cron.maxConcurrentRuns` flow `nested` ร่วมที่ไม่ใช่ Cron จะคงพฤติกรรม lane ของตนเอง การรันที่แยกออกมาเหล่านี้จะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)
- lane ราย session รับประกันว่ามีการรัน agent เพียงหนึ่งรายการที่แตะ session ที่กำหนดในเวลาเดียวกัน
- ไม่มี dependency ภายนอกหรือเธรด worker เบื้องหลัง; เป็น TypeScript + promises ล้วน

## การแก้ไขปัญหา

- หากคำสั่งดูเหมือนค้าง ให้เปิดใช้ verbose logs และมองหาบรรทัด “queued for …ms” เพื่อยืนยันว่าคิวกำลัง drain
- หากคุณต้องการดู queue depth ให้เปิดใช้ verbose logs และดูบรรทัด timing ของคิว
- การรัน Codex app-server ที่รับ turn แล้วหยุดส่ง progress จะถูกขัดจังหวะโดย Codex adapter เพื่อให้ lane ของ session ที่ทำงานอยู่ปล่อยได้ แทนที่จะรอ timeout ของการรันภายนอก
- เมื่อเปิดใช้ diagnostics แล้ว session ที่ยังอยู่ใน `processing` เกิน `diagnostics.stuckSessionWarnMs` โดยไม่มีการตอบกลับ, tool, status, block หรือ progress ของ ACP ที่สังเกตเห็น จะถูกจัดประเภทตามกิจกรรมปัจจุบัน งานที่ทำงานอยู่จะบันทึกเป็น `session.long_running`; งานที่ทำงานอยู่แต่ไม่มี progress ล่าสุดจะบันทึกเป็น `session.stalled`; `session.stuck` สงวนไว้สำหรับ bookkeeping ของ session ที่ stale และไม่มีงานที่ทำงานอยู่ และมีเพียงเส้นทางนั้นเท่านั้นที่ปล่อย lane ของ session ที่ได้รับผลกระทบเพื่อให้งานที่เข้าคิว drain ได้ diagnostics `session.stuck` ที่เกิดซ้ำจะ back off ตราบใดที่ session ยังไม่เปลี่ยนแปลง

## ที่เกี่ยวข้อง

- [การจัดการ Session](/th/concepts/session)
- [คิว Steering](/th/concepts/queue-steering)
- [นโยบาย Retry](/th/concepts/retry)
