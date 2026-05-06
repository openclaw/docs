---
read_when:
    - อธิบายว่าข้อความขาเข้ากลายเป็นการตอบกลับได้อย่างไร
    - การอธิบายให้ชัดเจนเกี่ยวกับเซสชัน โหมดการจัดคิว หรือพฤติกรรมการสตรีม
    - การจัดทำเอกสารเกี่ยวกับการมองเห็นการให้เหตุผลและผลกระทบต่อการใช้งาน
summary: โฟลว์ข้อความ เซสชัน การจัดคิว และการแสดงการให้เหตุผล
title: ข้อความ
x-i18n:
    generated_at: "2026-05-06T09:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw จัดการข้อความขาเข้าผ่าน pipeline ของการระบุเซสชัน การจัดคิว การสตรีม การเรียกใช้เครื่องมือ และการมองเห็นการให้เหตุผล หน้านี้แสดงเส้นทางตั้งแต่ข้อความขาเข้าไปจนถึงการตอบกลับ

## โฟลว์ข้อความ (ระดับสูง)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

ปุ่มปรับหลักอยู่ในการกำหนดค่า:

- `messages.*` สำหรับ prefix การจัดคิว และพฤติกรรมของกลุ่ม
- `agents.defaults.*` สำหรับค่าเริ่มต้นของ block streaming และการแบ่ง chunk
- การ override รายช่องทาง (`channels.whatsapp.*`, `channels.telegram.*` ฯลฯ) สำหรับขีดจำกัดและตัวเปิดปิดการสตรีม

ดู schema เต็มได้ที่ [การกำหนดค่า](/th/gateway/configuration)

## การตัดข้อความขาเข้าซ้ำ

ช่องทางอาจส่งข้อความเดิมซ้ำหลังจากเชื่อมต่อใหม่ OpenClaw เก็บ cache อายุสั้น
โดยใช้ channel/account/peer/session/message id เป็น key เพื่อไม่ให้การส่งซ้ำ
ทำให้เกิดการรันเอเจนต์อีกครั้ง

## การ debounce ข้อความขาเข้า

ข้อความต่อเนื่องอย่างรวดเร็วจาก **ผู้ส่งเดียวกัน** สามารถถูกรวมเป็น turn เดียว
ของเอเจนต์ผ่าน `messages.inbound` การ debounce มีขอบเขตต่อช่องทาง + การสนทนา
และใช้ข้อความล่าสุดสำหรับ reply threading/IDs

การกำหนดค่า (ค่าเริ่มต้น global + การ override รายช่องทาง):

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

- Debounce ใช้กับข้อความ **เฉพาะข้อความล้วน**; สื่อ/ไฟล์แนบจะ flush ทันที
- คำสั่งควบคุมจะข้ามการ debounce เพื่อให้ยังคงเป็นรายการเดี่ยว ยกเว้นเมื่อช่องทางเลือกใช้การรวม DM จากผู้ส่งเดียวกันอย่างชัดเจน (เช่น [BlueBubbles `coalesceSameSenderDms`](/th/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)) ซึ่งคำสั่ง DM จะรออยู่ในหน้าต่าง debounce เพื่อให้ payload ที่ส่งแบบแยกสามารถรวมเข้า turn เดียวกันของเอเจนต์ได้

## เซสชันและอุปกรณ์

เซสชันเป็นของ Gateway ไม่ใช่ของ client

- แชทโดยตรงจะถูกรวมเป็น key เซสชันหลักของเอเจนต์
- กลุ่ม/ช่องทางจะมี key เซสชันของตัวเอง
- session store และ transcript อยู่บนโฮสต์ Gateway

อุปกรณ์/ช่องทางหลายรายการสามารถ map ไปยังเซสชันเดียวกันได้ แต่ประวัติไม่ได้
sync กลับไปยัง client ทุกตัวอย่างสมบูรณ์ คำแนะนำ: ใช้อุปกรณ์หลักหนึ่งตัวสำหรับ
การสนทนายาวเพื่อหลีกเลี่ยง context ที่แตกต่างกัน Control UI และ TUI จะแสดง
transcript เซสชันที่อิงกับ Gateway เสมอ จึงเป็นแหล่งข้อมูลจริง

รายละเอียด: [การจัดการเซสชัน](/th/concepts/session)

## metadata ของผลลัพธ์เครื่องมือ

`content` ของผลลัพธ์เครื่องมือคือผลลัพธ์ที่โมเดลมองเห็นได้ `details` ของผลลัพธ์เครื่องมือคือ
metadata runtime สำหรับการ render UI การวินิจฉัย การส่งสื่อ และ plugins

OpenClaw รักษาขอบเขตนี้ไว้อย่างชัดเจน:

- `toolResult.details` จะถูกตัดออกก่อน provider replay และอินพุตของ Compaction
- transcript เซสชันที่ persist แล้วจะเก็บเฉพาะ `details` ที่มีขอบเขต; metadata ที่ใหญ่เกินไป
  จะถูกแทนที่ด้วยสรุปแบบกระชับที่ทำเครื่องหมาย `persistedDetailsTruncated: true`
- Plugins และเครื่องมือควรใส่ข้อความที่โมเดลต้องอ่านไว้ใน `content` ไม่ใช่เฉพาะ
  ใน `details`

## body ขาเข้าและ context ประวัติ

OpenClaw แยก **prompt body** ออกจาก **command body**:

- `BodyForAgent`: ข้อความหลักที่หันหน้าเข้าหาโมเดลสำหรับข้อความปัจจุบัน Plugin
  ของช่องทางควรรักษาส่วนนี้ให้โฟกัสที่ข้อความปัจจุบันของผู้ส่งซึ่งมี prompt
- `Body`: fallback prompt แบบเดิม ส่วนนี้อาจรวม envelope ของช่องทางและ
  wrapper ประวัติแบบเลือกได้ แต่ช่องทางปัจจุบันไม่ควรพึ่งพาส่วนนี้เป็น
  อินพุตหลักของโมเดลเมื่อมี `BodyForAgent`
- `CommandBody`: ข้อความผู้ใช้ดิบสำหรับการ parse directive/command
- `RawBody`: alias เดิมของ `CommandBody` (เก็บไว้เพื่อความเข้ากันได้)

เมื่อช่องทางส่งประวัติมา จะใช้ wrapper ร่วมกัน:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

สำหรับ **แชทที่ไม่ใช่โดยตรง** (กลุ่ม/ช่องทาง/ห้อง) **body ของข้อความปัจจุบัน** จะถูกนำหน้าด้วย
label ผู้ส่ง (สไตล์เดียวกับที่ใช้กับรายการประวัติ) สิ่งนี้ทำให้ข้อความแบบ real-time และแบบ queued/history
สอดคล้องกันใน prompt ของเอเจนต์

บัฟเฟอร์ประวัติเป็นแบบ **pending-only**: รวมข้อความกลุ่มที่ _ไม่ได้_
trigger การรัน (เช่น ข้อความที่ถูก mention-gated) และ **ไม่รวม** ข้อความ
ที่อยู่ใน transcript เซสชันแล้ว

การตัด directive ใช้กับส่วน **ข้อความปัจจุบัน** เท่านั้นเพื่อให้ประวัติ
ยังคงสมบูรณ์ ช่องทางที่ wrap ประวัติควรตั้งค่า `CommandBody` (หรือ
`RawBody`) เป็นข้อความต้นฉบับ และคง `Body` เป็น prompt ที่รวมแล้ว
ประวัติแบบ structured, reply, forwarded และ metadata ของช่องทางจะถูก render เป็น
บล็อก context ที่ไม่น่าเชื่อถือของบทบาทผู้ใช้ระหว่างประกอบ prompt
บัฟเฟอร์ประวัติกำหนดค่าได้ผ่าน `messages.groupChat.historyLimit` (ค่าเริ่มต้น
global) และการ override รายช่องทาง เช่น `channels.slack.historyLimit` หรือ
`channels.telegram.accounts.<id>.historyLimit` (ตั้ง `0` เพื่อปิดใช้)

## การจัดคิวและ followups

หากมีการรันที่ active อยู่แล้ว ข้อความขาเข้าสามารถถูกจัดคิว ถูก steer เข้าไปยัง
การรันปัจจุบัน หรือถูกรวบรวมไว้สำหรับ turn followup

- กำหนดค่าผ่าน `messages.queue` (และ `messages.queue.byChannel`)
- mode เริ่มต้นคือ `steer` พร้อม followup debounce 500ms เมื่อ steering fallback
  ไปเป็นการส่ง followup ที่จัดคิวไว้
- Modes: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` และ
  mode `queue` แบบเดิมที่ทำทีละรายการ

รายละเอียด: [คิวคำสั่ง](/th/concepts/queue) และ [คิว Steering](/th/concepts/queue-steering)

## ความเป็นเจ้าของการรันของช่องทาง

Plugin ของช่องทางอาจรักษาลำดับ debounce อินพุต และใช้ backpressure ของ transport
ก่อนที่ข้อความจะเข้าสู่คิวเซสชัน แต่ไม่ควรกำหนด timeout แยกรอบ turn ของเอเจนต์เอง
เมื่อข้อความถูก route ไปยังเซสชันแล้ว งานที่ใช้เวลานานจะถูกควบคุมโดย lifecycle
ของเซสชัน เครื่องมือ และ runtime เพื่อให้ทุกช่องทางรายงานและกู้คืนจาก turn ที่ช้าได้สอดคล้องกัน

## การสตรีม การแบ่ง chunk และการ batch

Block streaming ส่งคำตอบบางส่วนขณะที่โมเดลผลิตบล็อกข้อความ
การแบ่ง chunk เคารพขีดจำกัดข้อความของช่องทางและหลีกเลี่ยงการตัด fenced code

การตั้งค่าหลัก:

- `agents.defaults.blockStreamingDefault` (`on|off`, ค่าเริ่มต้น off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (การ batch ตาม idle)
- `agents.defaults.humanDelay` (การพักแบบคล้ายมนุษย์ระหว่าง block replies)
- การ override ช่องทาง: `*.blockStreaming` และ `*.blockStreamingCoalesce` (ช่องทางที่ไม่ใช่ Telegram ต้องมี `*.blockStreaming: true` อย่างชัดเจน)

รายละเอียด: [การสตรีม + การแบ่ง chunk](/th/concepts/streaming)

## การมองเห็นการให้เหตุผลและ token

OpenClaw สามารถเปิดเผยหรือซ่อนการให้เหตุผลของโมเดลได้:

- `/reasoning on|off|stream` ควบคุมการมองเห็น
- เนื้อหาการให้เหตุผลยังคงนับรวมในการใช้ token เมื่อโมเดลผลิตขึ้น
- Telegram รองรับ reasoning stream เข้าไปยัง draft bubble ชั่วคราวที่จะถูกลบหลังการส่งขั้นสุดท้าย; ใช้ `/reasoning on` สำหรับเอาต์พุตการให้เหตุผลแบบคงอยู่

รายละเอียด: [directive การคิด + การให้เหตุผล](/th/tools/thinking) และ [การใช้ token](/th/reference/token-use)

## Prefix, threading และ replies

การจัดรูปแบบข้อความขาออกถูกรวมศูนย์ไว้ใน `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` และ `channels.<channel>.accounts.<id>.responsePrefix` (ลำดับ cascade ของ prefix ขาออก) รวมถึง `channels.whatsapp.messagePrefix` (prefix ขาเข้าของ WhatsApp)
- Reply threading ผ่าน `replyToMode` และค่าเริ่มต้นรายช่องทาง

รายละเอียด: [การกำหนดค่า](/th/gateway/config-agents#messages) และเอกสารช่องทาง

## replies แบบเงียบ

silent token ที่ตรงตัว `NO_REPLY` / `no_reply` หมายถึง "อย่าส่ง reply ที่ผู้ใช้มองเห็นได้"
เมื่อ turn มี tool media ที่รออยู่ด้วย เช่น เสียง TTS ที่สร้างขึ้น OpenClaw
จะตัด silent text ออกแต่ยังคงส่ง media attachment
OpenClaw ตัดสินพฤติกรรมนั้นตามประเภทการสนทนา:

- การสนทนาโดยตรงไม่อนุญาตความเงียบโดยค่าเริ่มต้น และเขียน bare silent
  reply ใหม่เป็น fallback สั้นๆ ที่มองเห็นได้
- กลุ่ม/ช่องทางอนุญาตความเงียบโดยค่าเริ่มต้น
- การ orchestration ภายในอนุญาตความเงียบโดยค่าเริ่มต้น

OpenClaw ยังใช้ silent replies สำหรับความล้มเหลวของ internal runner ที่เกิดขึ้น
ก่อน assistant reply ใดๆ ในแชทที่ไม่ใช่โดยตรง เพื่อให้กลุ่ม/ช่องทางไม่เห็น
boilerplate ข้อผิดพลาดของ Gateway แชทโดยตรงจะแสดงข้อความความล้มเหลวแบบกระชับโดยค่าเริ่มต้น;
รายละเอียด runner ดิบจะแสดงเฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`

ค่าเริ่มต้นอยู่ใต้ `agents.defaults.silentReply` และ
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` และ
`surfaces.<id>.silentReplyRewrite` สามารถ override ต่อ surface ได้

เมื่อเซสชัน parent มี spawned subagent runs ที่รออยู่หนึ่งรายการขึ้นไป bare
silent replies จะถูกทิ้งบนทุก surface แทนที่จะถูกเขียนใหม่ เพื่อให้
parent เงียบไว้จนกว่าเหตุการณ์ child completion จะส่ง reply จริง

## ที่เกี่ยวข้อง

- [refactor lifecycle ข้อความ](/th/concepts/message-lifecycle-refactor) - เป้าหมายการออกแบบการส่งและรับที่ทนทาน
- [การสตรีม](/th/concepts/streaming) — การส่งข้อความแบบ real-time
- [การลองใหม่](/th/concepts/retry) — พฤติกรรมการลองส่งข้อความใหม่
- [คิว](/th/concepts/queue) — คิวประมวลผลข้อความ
- [ช่องทาง](/th/channels) — การผสานรวมกับแพลตฟอร์มรับส่งข้อความ
