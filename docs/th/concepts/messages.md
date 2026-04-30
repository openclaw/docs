---
read_when:
    - อธิบายวิธีที่ข้อความขาเข้ากลายเป็นข้อความตอบกลับ
    - การชี้แจงเรื่องเซสชัน โหมดการจัดคิว หรือพฤติกรรมการสตรีม
    - การจัดทำเอกสารเกี่ยวกับการมองเห็นกระบวนการให้เหตุผลและผลกระทบต่อการใช้งาน
summary: โฟลว์ข้อความ เซสชัน การจัดคิว และการมองเห็นการให้เหตุผล
title: ข้อความ
x-i18n:
    generated_at: "2026-04-30T09:47:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw จัดการข้อความขาเข้าผ่านไปป์ไลน์ของการระบุเซสชัน การเข้าคิว การสตรีม การเรียกใช้เครื่องมือ และการแสดงผลการคิดวิเคราะห์ หน้านี้แสดงเส้นทางตั้งแต่ข้อความขาเข้าไปจนถึงคำตอบ

## ลำดับการไหลของข้อความ (ระดับสูง)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

ปุ่มปรับหลักอยู่ในการกำหนดค่า:

- `messages.*` สำหรับ prefix การเข้าคิว และพฤติกรรมกลุ่ม
- `agents.defaults.*` สำหรับค่าเริ่มต้นของการสตรีมแบบบล็อกและการแบ่ง chunk
- การ override ช่องทาง (`channels.whatsapp.*`, `channels.telegram.*` เป็นต้น) สำหรับเพดานและตัวเปิดปิดการสตรีม

ดู schema ทั้งหมดได้ที่ [การกำหนดค่า](/th/gateway/configuration)

## การขจัดข้อความขาเข้าซ้ำ

ช่องทางอาจส่งข้อความเดิมซ้ำหลังจาก reconnect ได้ OpenClaw เก็บแคชอายุสั้นที่ใช้ channel/account/peer/session/message id เป็นคีย์ เพื่อให้การส่งซ้ำไม่ทำให้เกิดการรัน agent อีกรอบ

## การ debounce ข้อความขาเข้า

ข้อความต่อเนื่องอย่างรวดเร็วจาก **ผู้ส่งคนเดียวกัน** สามารถถูกรวมเป็น agent turn เดียวผ่าน `messages.inbound` ได้ การ debounce จำกัดขอบเขตต่อ channel + conversation และใช้ข้อความล่าสุดสำหรับ reply threading/ID

การกำหนดค่า (ค่าเริ่มต้นส่วนกลาง + การ override ต่อช่องทาง):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

หมายเหตุ:

- Debounce ใช้กับข้อความ **แบบข้อความล้วน** เท่านั้น; สื่อ/ไฟล์แนบจะ flush ทันที
- คำสั่งควบคุมข้ามการ debounce เพื่อให้ยังคงเป็นรายการเดี่ยว — **ยกเว้น** เมื่อช่องทางเลือกใช้การรวม DM จากผู้ส่งคนเดียวกันอย่างชัดเจน (เช่น [BlueBubbles `coalesceSameSenderDms`](/th/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)) โดยคำสั่ง DM จะรออยู่ในหน้าต่าง debounce เพื่อให้ payload ที่ส่งแบบแยกส่วนเข้าร่วม agent turn เดียวกันได้

## เซสชันและอุปกรณ์

เซสชันเป็นของ Gateway ไม่ใช่ของไคลเอนต์

- แชทโดยตรงจะถูกรวมเป็นคีย์เซสชันหลักของ agent
- กลุ่ม/ช่องทางจะได้คีย์เซสชันของตัวเอง
- session store และ transcript อยู่บนโฮสต์ Gateway

อุปกรณ์/ช่องทางหลายรายการสามารถแมปไปยังเซสชันเดียวกันได้ แต่ประวัติจะไม่ถูกซิงก์กลับไปยังทุกไคลเอนต์อย่างสมบูรณ์ คำแนะนำ: ใช้อุปกรณ์หลักเครื่องเดียวสำหรับบทสนทนายาว เพื่อหลีกเลี่ยงบริบทที่แยก diverge กัน Control UI และ TUI จะแสดง transcript ของเซสชันที่อิง Gateway เสมอ จึงเป็นแหล่งข้อมูลจริง

รายละเอียด: [การจัดการเซสชัน](/th/concepts/session)

## เมทาดาทาของผลลัพธ์เครื่องมือ

`content` ของผลลัพธ์เครื่องมือคือผลลัพธ์ที่โมเดลมองเห็น `details` ของผลลัพธ์เครื่องมือคือเมทาดาทารันไทม์สำหรับการเรนเดอร์ UI การวินิจฉัย การส่งสื่อ และ plugins

OpenClaw รักษาขอบเขตนี้ไว้อย่างชัดเจน:

- `toolResult.details` จะถูกตัดออกก่อน provider replay และ input ของ Compaction
- transcript ของเซสชันที่ persist แล้วจะเก็บเฉพาะ `details` ที่จำกัดขนาด; เมทาดาทาที่ใหญ่เกินไปจะถูกแทนที่ด้วยสรุปแบบกะทัดรัดที่ทำเครื่องหมาย `persistedDetailsTruncated: true`
- Plugins และเครื่องมือควรใส่ข้อความที่โมเดลต้องอ่านไว้ใน `content` ไม่ใช่เฉพาะใน `details`

## เนื้อหาขาเข้าและบริบทประวัติ

OpenClaw แยก **prompt body** ออกจาก **command body**:

- `Body`: ข้อความ prompt ที่ส่งไปยัง agent อาจรวม channel envelope และ wrapper ประวัติแบบเลือกได้
- `CommandBody`: ข้อความผู้ใช้ดิบสำหรับการ parse directive/command
- `RawBody`: alias เดิมของ `CommandBody` (เก็บไว้เพื่อความเข้ากันได้)

เมื่อช่องทางให้ประวัติมา จะใช้ wrapper ร่วมกัน:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

สำหรับ **แชทที่ไม่ใช่โดยตรง** (กลุ่ม/ช่องทาง/ห้อง) **เนื้อหาข้อความปัจจุบัน** จะมีป้ายชื่อผู้ส่งนำหน้า (รูปแบบเดียวกับที่ใช้กับรายการประวัติ) สิ่งนี้ทำให้ข้อความแบบเรียลไทม์และข้อความที่อยู่ในคิว/ประวัติสอดคล้องกันใน prompt ของ agent

บัฟเฟอร์ประวัติเป็นแบบ **pending-only**: จะรวมข้อความกลุ่มที่ _ไม่ได้_ trigger การรัน (เช่น ข้อความที่ gated ด้วย mention) และ **ไม่รวม** ข้อความที่อยู่ใน transcript ของเซสชันแล้ว

การตัด directive ใช้เฉพาะกับส่วน **ข้อความปัจจุบัน** เพื่อให้ประวัติยังคงครบถ้วน ช่องทางที่ wrap ประวัติควรตั้ง `CommandBody` (หรือ `RawBody`) เป็นข้อความต้นฉบับ และเก็บ `Body` เป็น prompt ที่รวมแล้ว บัฟเฟอร์ประวัติกำหนดค่าได้ผ่าน `messages.groupChat.historyLimit` (ค่าเริ่มต้นส่วนกลาง) และการ override ต่อช่องทาง เช่น `channels.slack.historyLimit` หรือ `channels.telegram.accounts.<id>.historyLimit` (ตั้งเป็น `0` เพื่อปิดใช้งาน)

## การเข้าคิวและ followup

หากมีการรันที่กำลัง active อยู่ ข้อความขาเข้าสามารถถูกเข้าคิว ถูก steer เข้าสู่การรันปัจจุบัน หรือถูกรวบรวมไว้สำหรับ turn followup ได้

- กำหนดค่าผ่าน `messages.queue` (และ `messages.queue.byChannel`)
- โหมดเริ่มต้นคือ `steer` โดยมี followup debounce 500ms เมื่อการ steering fallback ไปเป็นการส่ง followup ที่เข้าคิว
- โหมด: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` และโหมดเดิมแบบทีละรายการ `queue`

รายละเอียด: [คิวคำสั่ง](/th/concepts/queue) และ [คิว Steering](/th/concepts/queue-steering)

## ความเป็นเจ้าของการรันของช่องทาง

Channel plugins อาจรักษาลำดับ debounce input และใช้ transport backpressure ก่อนที่ข้อความจะเข้าสู่คิวเซสชัน แต่ไม่ควรกำหนด timeout แยกต่างหากรอบ agent turn เอง เมื่อข้อความถูก route ไปยังเซสชันแล้ว งานที่ใช้เวลานานจะถูกควบคุมโดย lifecycle ของเซสชัน เครื่องมือ และรันไทม์ เพื่อให้ทุกช่องทางรายงานและกู้คืนจาก turn ที่ช้าได้อย่างสอดคล้องกัน

## การสตรีม การแบ่ง chunk และการ batch

การสตรีมแบบบล็อกส่งคำตอบบางส่วนขณะที่โมเดลสร้างบล็อกข้อความ การแบ่ง chunk เคารพขีดจำกัดข้อความของช่องทางและหลีกเลี่ยงการตัด fenced code

การตั้งค่าหลัก:

- `agents.defaults.blockStreamingDefault` (`on|off`, ค่าเริ่มต้น off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (การ batch ตามเวลาว่าง)
- `agents.defaults.humanDelay` (การหยุดชั่วคราวคล้ายมนุษย์ระหว่างคำตอบแบบบล็อก)
- การ override ช่องทาง: `*.blockStreaming` และ `*.blockStreamingCoalesce` (ช่องทางที่ไม่ใช่ Telegram ต้องตั้ง `*.blockStreaming: true` อย่างชัดเจน)

รายละเอียด: [การสตรีม + การแบ่ง chunk](/th/concepts/streaming)

## การแสดงผลการคิดวิเคราะห์และ token

OpenClaw สามารถแสดงหรือซ่อนการคิดวิเคราะห์ของโมเดลได้:

- `/reasoning on|off|stream` ควบคุมการแสดงผล
- เนื้อหา reasoning ยังคงนับรวมในการใช้ token เมื่อโมเดลสร้างขึ้น
- Telegram รองรับ reasoning stream เข้าไปใน draft bubble

รายละเอียด: [directive สำหรับการคิด + reasoning](/th/tools/thinking) และ [การใช้ token](/th/reference/token-use)

## Prefix, threading และคำตอบ

การจัดรูปแบบข้อความขาออกถูกรวมศูนย์ไว้ใน `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` และ `channels.<channel>.accounts.<id>.responsePrefix` (ลำดับ cascade ของ prefix ขาออก) รวมถึง `channels.whatsapp.messagePrefix` (prefix ขาเข้าของ WhatsApp)
- Reply threading ผ่าน `replyToMode` และค่าเริ่มต้นต่อช่องทาง

รายละเอียด: [การกำหนดค่า](/th/gateway/config-agents#messages) และเอกสารช่องทาง

## คำตอบเงียบ

silent token ที่ตรงตัว `NO_REPLY` / `no_reply` หมายถึง “อย่าส่งคำตอบที่ผู้ใช้มองเห็น”
เมื่อ turn มีสื่อจากเครื่องมือที่ค้างอยู่ด้วย เช่น เสียง TTS ที่สร้างขึ้น OpenClaw จะตัดข้อความเงียบออก แต่ยังส่งไฟล์แนบสื่อนั้นอยู่
OpenClaw resolve พฤติกรรมนี้ตามประเภทบทสนทนา:

- บทสนทนาโดยตรงไม่อนุญาต silence โดยค่าเริ่มต้น และเขียนคำตอบเงียบเปล่าให้เป็น fallback สั้นๆ ที่มองเห็นได้
- กลุ่ม/ช่องทางอนุญาต silence โดยค่าเริ่มต้น
- orchestration ภายในอนุญาต silence โดยค่าเริ่มต้น

OpenClaw ยังใช้คำตอบเงียบสำหรับความล้มเหลวของ runner ภายในที่เกิดก่อนมีคำตอบจาก assistant ในแชทที่ไม่ใช่โดยตรง เพื่อให้กลุ่ม/ช่องทางไม่เห็นข้อความ error boilerplate ของ Gateway แชทโดยตรงจะแสดงข้อความความล้มเหลวแบบกะทัดรัดโดยค่าเริ่มต้น; รายละเอียด runner ดิบจะแสดงเฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`

ค่าเริ่มต้นอยู่ใต้ `agents.defaults.silentReply` และ `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` และ `surfaces.<id>.silentReplyRewrite` สามารถ override ต่อ surface ได้

เมื่อเซสชัน parent มีการรัน subagent ที่ spawn แล้วค้างอยู่หนึ่งรายการขึ้นไป คำตอบเงียบเปล่าจะถูกทิ้งบนทุก surface แทนที่จะถูกเขียนใหม่ เพื่อให้ parent เงียบไว้จนกว่า event การเสร็จสิ้นของ child จะส่งคำตอบจริง

## ที่เกี่ยวข้อง

- [การสตรีม](/th/concepts/streaming) — การส่งข้อความแบบเรียลไทม์
- [การลองใหม่](/th/concepts/retry) — พฤติกรรมการลองส่งข้อความใหม่
- [คิว](/th/concepts/queue) — คิวการประมวลผลข้อความ
- [ช่องทาง](/th/channels) — การเชื่อมต่อกับแพลตฟอร์มรับส่งข้อความ
