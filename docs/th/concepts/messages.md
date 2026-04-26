---
read_when:
    - อธิบายว่าข้อความขาเข้ากลายเป็นคำตอบได้อย่างไร
    - ชี้แจงเรื่องเซสชัน โหมดการเข้าคิว หรือพฤติกรรมการสตรีม
    - อธิบายการมองเห็น reasoning และผลกระทบต่อการใช้งาน
summary: ลำดับการไหลของข้อความ เซสชัน การเข้าคิว และการมองเห็น reasoning
title: ข้อความ
x-i18n:
    generated_at: "2026-04-26T11:27:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

หน้านี้เชื่อมโยงภาพรวมการจัดการข้อความขาเข้า เซสชัน การเข้าคิว
การสตรีม และการมองเห็น reasoning ของ OpenClaw เข้าด้วยกัน

## ลำดับการไหลของข้อความ (ระดับสูง)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

ตัวควบคุมหลักอยู่ใน configuration:

- `messages.*` สำหรับ prefixes, การเข้าคิว และพฤติกรรมของกลุ่ม
- `agents.defaults.*` สำหรับค่าเริ่มต้นของ block streaming และ chunking
- การ override ระดับ channel (`channels.whatsapp.*`, `channels.telegram.*` และอื่น ๆ) สำหรับ caps และการเปิด/ปิดการสตรีม

ดู schema แบบเต็มได้ที่ [Configuration](/th/gateway/configuration)

## การกำจัดข้อความขาเข้าซ้ำ

Channels อาจส่งข้อความเดิมซ้ำหลังจากเชื่อมต่อใหม่ OpenClaw จะเก็บ cache ระยะสั้นที่อิงตาม channel/account/peer/session/message id เพื่อไม่ให้การส่งซ้ำกระตุ้นการรันเอเจนต์อีกครั้ง

## การหน่วงรวมข้อความขาเข้า

ข้อความที่ส่งมาติดกันอย่างรวดเร็วจาก **ผู้ส่งคนเดียวกัน** สามารถถูกรวมเป็น agent turn เดียวได้ผ่าน `messages.inbound` การหน่วงรวมจะทำงานแยกตาม channel + conversation และจะใช้ข้อความล่าสุดสำหรับ reply threading/IDs

Config (ค่าเริ่มต้นแบบ global + การ override ราย channel):

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

- Debounce ใช้กับข้อความแบบ **text-only**; media/attachments จะ flush ทันที
- control commands จะข้ามการหน่วงรวมเพื่อให้ยังคงแยกเป็นข้อความเดี่ยว — **ยกเว้น** เมื่อ channel เลือกเปิดใช้ same-sender DM coalescing อย่างชัดเจน (เช่น [BlueBubbles `coalesceSameSenderDms`](/th/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)) ซึ่งในกรณีนั้น DM commands จะรออยู่ในช่วง debounce window เพื่อให้ payload ที่ส่งแยกกันสามารถรวมอยู่ใน agent turn เดียวได้

## เซสชันและอุปกรณ์

เซสชันเป็นของ Gateway ไม่ใช่ของ clients

- แชทโดยตรงจะถูกรวมเข้า session key หลักของเอเจนต์
- กลุ่ม/channels จะมี session key ของตัวเอง
- session store และ transcripts จะอยู่บนโฮสต์ของ Gateway

อุปกรณ์/channels หลายตัวสามารถแมปไปยังเซสชันเดียวกันได้ แต่ประวัติจะไม่ถูกซิงก์กลับไปยังทุก client อย่างสมบูรณ์ คำแนะนำคือให้ใช้อุปกรณ์หลักเพียงเครื่องเดียวสำหรับบทสนทนายาว ๆ เพื่อหลีกเลี่ยงบริบทที่แยกจากกัน Control UI และ TUI จะแสดง session transcript ที่อิงจาก Gateway เสมอ ดังนั้นจึงเป็นแหล่งข้อมูลจริง

รายละเอียด: [การจัดการเซสชัน](/th/concepts/session)

## metadata ของผลลัพธ์เครื่องมือ

`content` ของผลลัพธ์เครื่องมือคือผลลัพธ์ที่โมเดลมองเห็นได้ ส่วน `details` ของผลลัพธ์เครื่องมือคือ metadata ระดับรันไทม์สำหรับการเรนเดอร์ UI, diagnostics, การส่ง media และ Plugins

OpenClaw แยกขอบเขตนี้ไว้อย่างชัดเจน:

- `toolResult.details` จะถูกตัดออกก่อนการ replay ไปยัง provider และก่อนป้อนเข้า Compaction
- session transcripts ที่บันทึกไว้จะเก็บเฉพาะ `details` ที่มีขนาดจำกัด; metadata ที่ใหญ่เกินไปจะถูกแทนด้วยสรุปแบบกระชับที่มีเครื่องหมาย `persistedDetailsTruncated: true`
- Plugins และเครื่องมือควรใส่ข้อความที่โมเดลจำเป็นต้องอ่านไว้ใน `content` ไม่ใช่ใส่ไว้เฉพาะใน `details`

## เนื้อหาขาเข้าและบริบทประวัติ

OpenClaw แยก **prompt body** ออกจาก **command body**:

- `Body`: ข้อความ prompt ที่ส่งให้เอเจนต์ ซึ่งอาจมี channel envelopes และ history wrappers แบบเลือกได้
- `CommandBody`: ข้อความดิบจากผู้ใช้สำหรับการ parse directives/commands
- `RawBody`: ชื่อเดิมที่คงไว้เพื่อความเข้ากันได้ของ `CommandBody`

เมื่อ channel ส่ง history มา จะใช้ wrapper ร่วมกันดังนี้:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

สำหรับ **แชทที่ไม่ใช่ direct** (groups/channels/rooms) **เนื้อหาของข้อความปัจจุบัน** จะถูกเติม sender label ไว้ข้างหน้า (ใช้รูปแบบเดียวกับที่ใช้ในรายการ history) เพื่อให้ข้อความแบบเรียลไทม์และข้อความแบบ queued/history มีความสอดคล้องกันใน prompt ของเอเจนต์

history buffers เป็นแบบ **pending-only**: กล่าวคือจะรวมข้อความกลุ่มที่ _ไม่ได้_
กระตุ้นการรัน (เช่น ข้อความที่ถูกกำหนดให้ต้องมี mention) และจะ **ไม่รวม** ข้อความ
ที่อยู่ใน session transcript แล้ว

การตัด directives จะใช้เฉพาะกับส่วน **ข้อความปัจจุบัน** เท่านั้น เพื่อให้ history ยังคงครบถ้วน Channels ที่ห่อ history ควรตั้ง `CommandBody` (หรือ `RawBody`) เป็นข้อความต้นฉบับของผู้ใช้ และคง `Body` เป็น prompt แบบรวม history buffers สามารถกำหนดค่าได้ผ่าน `messages.groupChat.historyLimit` (ค่าเริ่มต้นแบบ global) และการ override ราย channel เช่น `channels.slack.historyLimit` หรือ `channels.telegram.accounts.<id>.historyLimit` (ตั้งค่า `0` เพื่อปิดใช้งาน)

## การเข้าคิวและ followups

หากมีการรันที่กำลังทำงานอยู่แล้ว ข้อความขาเข้าสามารถถูกนำไปเข้าคิว ชี้เข้าไปยังการรันปัจจุบัน หรือรวบรวมไว้สำหรับ followup turn

- กำหนดค่าผ่าน `messages.queue` (และ `messages.queue.byChannel`)
- โหมด: `interrupt`, `steer`, `followup`, `collect` พร้อมรูปแบบ backlog

รายละเอียด: [Queueing](/th/concepts/queue)

## การสตรีม การแบ่ง chunk และการรวมชุด

Block streaming จะส่งคำตอบบางส่วนออกไปเมื่อโมเดลสร้าง text blocks ขึ้นมา
Chunking จะเคารพข้อจำกัดข้อความของ channel และหลีกเลี่ยงการตัด fenced code กลางคัน

การตั้งค่าหลัก:

- `agents.defaults.blockStreamingDefault` (`on|off`, ค่าเริ่มต้น off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (การรวมชุดตาม idle)
- `agents.defaults.humanDelay` (ช่วงหน่วงแบบมนุษย์ระหว่าง block replies)
- การ override ราย channel: `*.blockStreaming` และ `*.blockStreamingCoalesce` (channels ที่ไม่ใช่ Telegram ต้องตั้ง `*.blockStreaming: true` อย่างชัดเจน)

รายละเอียด: [Streaming + chunking](/th/concepts/streaming)

## การมองเห็น reasoning และโทเค็น

OpenClaw สามารถแสดงหรือซ่อน reasoning ของโมเดลได้:

- `/reasoning on|off|stream` ใช้ควบคุมการมองเห็น
- เนื้อหา reasoning ยังคงถูกนับรวมในการใช้โทเค็นเมื่อโมเดลสร้างขึ้น
- Telegram รองรับการสตรีม reasoning ไปยัง draft bubble

รายละเอียด: [Thinking + reasoning directives](/th/tools/thinking) และ [การใช้โทเค็น](/th/reference/token-use)

## Prefixes, threading และคำตอบ

การจัดรูปแบบข้อความขาออกถูกรวมศูนย์ไว้ใน `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` และ `channels.<channel>.accounts.<id>.responsePrefix` (ลำดับการสืบทอดของ outbound prefix) รวมถึง `channels.whatsapp.messagePrefix` (inbound prefix ของ WhatsApp)
- reply threading ผ่าน `replyToMode` และค่าเริ่มต้นราย channel

รายละเอียด: [Configuration](/th/gateway/config-agents#messages) และเอกสารของแต่ละ channel

## คำตอบแบบเงียบ

โทเค็นแบบเงียบที่ตรงตัว `NO_REPLY` / `no_reply` หมายถึง “ไม่ต้องส่งคำตอบที่ผู้ใช้มองเห็นได้”
เมื่อ turn นั้นยังมี tool media ที่รออยู่ เช่น เสียง TTS ที่สร้างขึ้น OpenClaw
จะตัดข้อความเงียบออก แต่ยังคงส่ง media attachment นั้นต่อไป
OpenClaw จะกำหนดพฤติกรรมนี้ตามประเภทของ conversation:

- การสนทนาแบบ direct ไม่อนุญาตให้เงียบโดยค่าเริ่มต้น และจะเขียนคำตอบเงียบล้วนใหม่เป็นข้อความ fallback แบบสั้นที่มองเห็นได้
- กลุ่ม/channels อนุญาตให้เงียบได้โดยค่าเริ่มต้น
- orchestration ภายในอนุญาตให้เงียบได้โดยค่าเริ่มต้น

OpenClaw ยังใช้คำตอบแบบเงียบสำหรับความล้มเหลวภายในของ runner ที่เกิดขึ้น
ก่อนมีคำตอบจากผู้ช่วยในแชทที่ไม่ใช่ direct เพื่อไม่ให้กลุ่ม/channels เห็นข้อความ error boilerplate จาก Gateway แชทแบบ direct จะแสดงข้อความความล้มเหลวแบบกระชับโดยค่าเริ่มต้น; รายละเอียดดิบของ runner จะแสดงเฉพาะเมื่อ `/verbose` เป็น `on` หรือ `full`

ค่าเริ่มต้นอยู่ภายใต้ `agents.defaults.silentReply` และ
`agents.defaults.silentReplyRewrite`; โดย `surfaces.<id>.silentReply` และ
`surfaces.<id>.silentReplyRewrite` สามารถ override ได้ราย surface

เมื่อ parent session มี spawned subagent runs ที่ยังรออยู่หนึ่งรายการหรือมากกว่า
คำตอบเงียบล้วนจะถูกทิ้งบนทุก surfaces แทนที่จะถูกเขียนใหม่ เพื่อให้ parent
ยังคงเงียบจนกว่าเหตุการณ์เสร็จสิ้นของ child จะส่งคำตอบจริงกลับมา

## ที่เกี่ยวข้อง

- [Streaming](/th/concepts/streaming) — การส่งข้อความแบบเรียลไทม์
- [Retry](/th/concepts/retry) — พฤติกรรมการลองส่งข้อความใหม่
- [Queue](/th/concepts/queue) — คิวการประมวลผลข้อความ
- [Channels](/th/channels) — การเชื่อมต่อกับแพลตฟอร์มส่งข้อความ
