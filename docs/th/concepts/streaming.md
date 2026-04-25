---
read_when:
    - กำลังอธิบายวิธีการทำงานของการสตรีมหรือการแบ่ง chunk บนช่อง
    - กำลังเปลี่ยนพฤติกรรมการสตรีมแบบ block หรือการแบ่ง chunk ของช่อง
    - กำลังดีบักการตอบกลับแบบ block ที่ซ้ำหรือมาเร็วเกินไป หรือการสตรีมพรีวิวของช่อง
summary: พฤติกรรมการสตรีม + การแบ่ง chunk (การตอบกลับแบบ block, การสตรีมพรีวิวของช่อง, การแมปโหมด)
title: การสตรีมและการแบ่ง chunk
x-i18n:
    generated_at: "2026-04-25T13:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw มีเลเยอร์การสตรีมแยกกันอยู่ 2 แบบ:

- **การสตรีมแบบ block (ช่อง):** ส่ง **blocks** ที่เสร็จสมบูรณ์ออกไปขณะที่ผู้ช่วยกำลังเขียน นี่คือข้อความของช่องตามปกติ (ไม่ใช่ token delta)
- **การสตรีมแบบ preview (Telegram/Discord/Slack):** อัปเดต **ข้อความ preview ชั่วคราว** ระหว่างการสร้างข้อความ

ปัจจุบันยัง **ไม่มีการสตรีมแบบ token-delta จริง** ไปยังข้อความในช่อง การสตรีมแบบ preview เป็นแบบอิงข้อความ (ส่ง + แก้ไข/ต่อท้าย)

## การสตรีมแบบ block (ข้อความในช่อง)

การสตรีมแบบ block จะส่งเอาต์พุตของผู้ช่วยออกไปเป็นก้อนหยาบ ๆ เมื่อพร้อมใช้งาน

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

คำอธิบาย:

- `text_delta/events`: เหตุการณ์สตรีมจาก model (อาจมีน้อยสำหรับ model ที่ไม่สตรีม)
- `chunker`: `EmbeddedBlockChunker` ที่ใช้ min/max bounds + break preference
- `channel send`: ข้อความขาออกจริง (block replies)

**ตัวควบคุม:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (ค่าเริ่มต้นคือ off)
- การแทนที่รายช่อง: `*.blockStreaming` (และตัวแปรรายบัญชี) เพื่อบังคับ `"on"`/`"off"` ต่อช่อง
- `agents.defaults.blockStreamingBreak`: `"text_end"` หรือ `"message_end"`
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (รวม block ที่สตรีมก่อนส่ง)
- hard cap ของช่อง: `*.textChunkLimit` (เช่น `channels.whatsapp.textChunkLimit`)
- โหมดการแบ่ง chunk ของช่อง: `*.chunkMode` (`length` เป็นค่าเริ่มต้น, `newline` จะแบ่งตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว)
- soft cap ของ Discord: `channels.discord.maxLinesPerMessage` (ค่าเริ่มต้น 17) แบ่งคำตอบที่ยาวเป็นแนวตั้งเพื่อหลีกเลี่ยงการถูก UI ตัด

**ความหมายของขอบเขต:**

- `text_end`: สตรีม blocks ทันทีที่ chunker ส่งออก; flush ทุก `text_end`
- `message_end`: รอจนข้อความของผู้ช่วยเสร็จสิ้น แล้วจึง flush เอาต์พุตที่บัฟเฟอร์ไว้

`message_end` ยังใช้ chunker หากข้อความที่บัฟเฟอร์ไว้ยาวเกิน `maxChars` ดังนั้นมันจึงอาจส่งออกหลาย chunk ได้ตอนท้าย

### การส่งสื่อพร้อมการสตรีมแบบ block

คำสั่ง `MEDIA:` เป็น metadata สำหรับการส่งแบบปกติ เมื่อการสตรีมแบบ block ส่ง
media block ออกไปก่อน OpenClaw จะจดจำการส่งนั้นไว้สำหรับเทิร์นนั้น หาก payload
สุดท้ายของผู้ช่วยมี URL สื่อเดิมซ้ำอีกครั้ง การส่งขั้นสุดท้ายจะตัดสื่อที่ซ้ำออกแทน
ที่จะส่งไฟล์แนบซ้ำอีกครั้ง

payload ขั้นสุดท้ายที่ซ้ำกันทุกประการจะถูกระงับ หาก payload ขั้นสุดท้ายเพิ่ม
ข้อความที่แตกต่างรอบสื่อที่ถูกสตรีมไปแล้ว OpenClaw จะยังคงส่งข้อความใหม่
นั้น ขณะเดียวกันยังคงให้สื่อถูกส่งเพียงครั้งเดียว วิธีนี้ช่วยป้องกันโน้ตเสียงหรือไฟล์ซ้ำ
บนช่องอย่าง Telegram เมื่อเอเจนต์ส่ง `MEDIA:` ระหว่างการสตรีม และ provider ก็รวม
สื่อนั้นมาในคำตอบที่เสร็จสมบูรณ์ด้วย

## อัลกอริทึมการแบ่ง chunk (ขอบเขตต่ำ/สูง)

การแบ่ง block chunk ถูกติดตั้งผ่าน `EmbeddedBlockChunker`:

- **ขอบเขตต่ำ:** อย่าส่งออกจนกว่าบัฟเฟอร์จะมีขนาด >= `minChars` (เว้นแต่จะถูกบังคับ)
- **ขอบเขตสูง:** พยายามแบ่งก่อนถึง `maxChars`; หากถูกบังคับ จะแบ่งที่ `maxChars`
- **ลำดับความสำคัญของการแบ่ง:** `paragraph` → `newline` → `sentence` → `whitespace` → hard break
- **Code fence:** ห้ามแบ่งภายใน fence; เมื่อถูกบังคับที่ `maxChars` จะปิด + เปิด fence ใหม่เพื่อให้ Markdown ยังถูกต้อง

`maxChars` จะถูกบีบให้ไม่เกิน `textChunkLimit` ของช่อง ดังนั้นจึงไม่สามารถเกินขีดจำกัดรายช่องได้

## การรวม (merge streamed blocks)

เมื่อเปิดใช้การสตรีมแบบ block, OpenClaw สามารถ **รวม block chunk ที่ต่อเนื่องกัน**
ก่อนส่งออกจริง วิธีนี้ช่วยลด “สแปมบรรทัดเดียว” แต่ยังคงให้
เอาต์พุตแบบค่อยเป็นค่อยไป

- การรวมจะรอ **ช่วงว่าง** (`idleMs`) ก่อน flush
- บัฟเฟอร์จะถูกจำกัดด้วย `maxChars` และจะ flush หากเกินค่านั้น
- `minChars` ป้องกันไม่ให้ fragment เล็ก ๆ ถูกส่งออกจนกว่าจะสะสมข้อความได้มากพอ
  (การ flush สุดท้ายจะส่งข้อความที่เหลือเสมอ)
- ตัวเชื่อม derive มาจาก `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → เว้นวรรค)
- รองรับการแทนที่รายช่องผ่าน `*.blockStreamingCoalesce` (รวมถึง config รายบัญชี)
- ค่าเริ่มต้นของ coalesce `minChars` จะถูกเพิ่มเป็น 1500 สำหรับ Signal/Slack/Discord เว้นแต่จะมีการแทนที่

## จังหวะหน่วงแบบมนุษย์ระหว่าง blocks

เมื่อเปิดใช้การสตรีมแบบ block คุณสามารถเพิ่ม **ช่วงพักแบบสุ่ม**
ระหว่าง block replies ได้ (หลัง block แรก) วิธีนี้ทำให้การตอบแบบหลายบับเบิลดู
เป็นธรรมชาติมากขึ้น

- Config: `agents.defaults.humanDelay` (แทนที่รายเอเจนต์ได้ผ่าน `agents.list[].humanDelay`)
- โหมด: `off` (ค่าเริ่มต้น), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`)
- ใช้กับ **block replies** เท่านั้น ไม่ใช้กับ final replies หรือสรุปเครื่องมือ

## "สตรีมเป็นก้อนหรือส่งทั้งหมด"

สิ่งนี้แมปเป็น:

- **สตรีมเป็นก้อน:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ส่งออกระหว่างไป) ช่องที่ไม่ใช่ Telegram ต้องตั้ง `*.blockStreaming: true` ด้วย
- **สตรีมทั้งหมดตอนจบ:** `blockStreamingBreak: "message_end"` (flush ครั้งเดียว แต่อาจหลาย chunk หากยาวมาก)
- **ไม่มีการสตรีมแบบ block:** `blockStreamingDefault: "off"` (มีเฉพาะคำตอบสุดท้าย)

**หมายเหตุของช่อง:** การสตรีมแบบ block จะเป็น **ปิด เว้นแต่**
มีการตั้ง `*.blockStreaming` เป็น `true` อย่างชัดเจน ช่องต่าง ๆ สามารถสตรีม preview แบบสด
(`channels.<channel>.streaming`) ได้โดยไม่ต้องมี block replies

ย้ำตำแหน่ง config: ค่าเริ่มต้น `blockStreaming*` อยู่ภายใต้
`agents.defaults` ไม่ใช่ที่ root config

## โหมดการสตรีมแบบ preview

คีย์มาตรฐาน: `channels.<channel>.streaming`

โหมด:

- `off`: ปิดการสตรีมแบบ preview
- `partial`: preview เดียวที่ถูกแทนที่ด้วยข้อความล่าสุด
- `block`: อัปเดต preview แบบแบ่งก้อน/ต่อท้าย
- `progress`: preview แสดงความคืบหน้า/สถานะระหว่างสร้าง และแสดงคำตอบสุดท้ายเมื่อเสร็จ

### การแมปตามช่อง

| ช่อง | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | แมปเป็น `partial` |
| Discord    | ✅    | ✅        | ✅      | แมปเป็น `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

เฉพาะ Slack:

- `channels.slack.streaming.nativeTransport` ใช้เปิด/ปิดการเรียก Slack native streaming API เมื่อ `channels.slack.streaming.mode="partial"` (ค่าเริ่มต้น: `true`)
- Slack native streaming และสถานะเธรด Slack assistant ต้องใช้เป้าหมายเป็น reply thread; DM ระดับบนสุดจะไม่แสดง preview แบบสไตล์ thread นั้น

การย้ายคีย์แบบเดิม:

- Telegram: `streamMode` แบบเดิมและค่า `streaming` แบบ scalar/boolean จะถูกตรวจพบและย้ายโดย doctor/เส้นทางความเข้ากันได้ของ config ไปยัง `streaming.mode`
- Discord: `streamMode` + `streaming` แบบ boolean จะถูกย้ายอัตโนมัติไปยัง enum `streaming`
- Slack: `streamMode` จะถูกย้ายอัตโนมัติไปยัง `streaming.mode`; `streaming` แบบ boolean จะถูกย้ายอัตโนมัติไปยัง `streaming.mode` พร้อม `streaming.nativeTransport`; `nativeStreaming` แบบเดิมจะถูกย้ายอัตโนมัติไปยัง `streaming.nativeTransport`

### พฤติกรรมระหว่างรัน

Telegram:

- ใช้ `sendMessage` + `editMessageText` สำหรับอัปเดต preview ทั้งใน DM และกลุ่ม/หัวข้อ
- จะข้ามการสตรีมแบบ preview เมื่อเปิด Telegram block streaming อย่างชัดเจน (เพื่อหลีกเลี่ยงการสตรีมซ้ำ)
- `/reasoning stream` สามารถเขียน reasoning ลงใน preview ได้

Discord:

- ใช้การส่ง + แก้ไขข้อความ preview
- โหมด `block` ใช้การแบ่ง draft (`draftChunk`)
- จะข้ามการสตรีมแบบ preview เมื่อเปิด Discord block streaming อย่างชัดเจน
- payload ขั้นสุดท้ายแบบสื่อ, ข้อผิดพลาด และ explicit-reply จะยกเลิก preview ที่ค้างอยู่โดยไม่ flush draft ใหม่ แล้วใช้การส่งแบบปกติแทน

Slack:

- `partial` สามารถใช้ Slack native streaming (`chat.startStream`/`append`/`stop`) ได้เมื่อพร้อมใช้งาน
- `block` ใช้ draft preview แบบต่อท้าย
- `progress` ใช้ข้อความ preview สถานะ แล้วตามด้วยคำตอบสุดท้าย
- Native และ draft preview streaming จะระงับ block replies สำหรับเทิร์นนั้น ดังนั้นคำตอบใน Slack จะถูกสตรีมโดยเส้นทางการส่งเพียงเส้นทางเดียว
- payload ขั้นสุดท้ายแบบสื่อ/ข้อผิดพลาด และ progress final จะไม่สร้าง draft ชั่วคราวที่ต้องทิ้ง; มีเพียง final แบบข้อความ/block ที่สามารถแก้ไข preview ได้เท่านั้นที่จะ flush ข้อความ draft ที่ค้างอยู่

Mattermost:

- สตรีมความคิด กิจกรรมของเครื่องมือ และข้อความตอบกลับบางส่วนลงในโพสต์ preview แบบร่างเดียว ซึ่งจะ finalize ในที่เดิมเมื่อคำตอบสุดท้ายปลอดภัยที่จะส่ง
- หากโพสต์ preview ถูกลบหรือไม่พร้อมใช้งานในเวลาที่ finalize จะ fallback ไปส่งโพสต์สุดท้ายใหม่
- payload ขั้นสุดท้ายแบบสื่อ/ข้อผิดพลาดจะยกเลิกการอัปเดต preview ที่ค้างอยู่ก่อนการส่งแบบปกติ แทนการ flush โพสต์ preview ชั่วคราว

Matrix:

- draft preview จะ finalize ในที่เดิมเมื่อข้อความสุดท้ายสามารถใช้ event preview เดิมซ้ำได้
- final แบบสื่ออย่างเดียว, ข้อผิดพลาด และ reply-target-mismatch จะยกเลิกการอัปเดต preview ที่ค้างอยู่ก่อนการส่งแบบปกติ; preview เก่าที่มองเห็นอยู่แล้วจะถูก redact

### การอัปเดต preview แบบ tool-progress

การสตรีมแบบ preview ยังสามารถรวมการอัปเดต **tool-progress** ได้ด้วย — บรรทัดสถานะสั้น ๆ เช่น "กำลังค้นหาเว็บ", "กำลังอ่านไฟล์" หรือ "กำลังเรียกใช้เครื่องมือ" — ซึ่งจะปรากฏในข้อความ preview เดียวกันขณะที่เครื่องมือกำลังทำงาน ก่อนคำตอบสุดท้าย วิธีนี้ช่วยให้เทิร์นของเครื่องมือหลายขั้นตอนดูมีชีวิตชีวาแทนที่จะเงียบอยู่ระหว่าง preview ความคิดแรกกับคำตอบสุดท้าย

พื้นผิวที่รองรับ:

- **Discord**, **Slack** และ **Telegram** จะสตรีม tool-progress ลงในการแก้ไข preview แบบสดเป็นค่าเริ่มต้นเมื่อ preview streaming ทำงานอยู่
- Telegram เปิดใช้งานการอัปเดต preview แบบ tool-progress มาแล้วตั้งแต่ `v2026.4.22`; การคงเปิดใช้งานไว้จะรักษาพฤติกรรมที่ปล่อยใช้งานแล้วนี้
- **Mattermost** รวมกิจกรรมของเครื่องมือไว้ในโพสต์ preview แบบร่างเดียวอยู่แล้ว (ดูด้านบน)
- การแก้ไข tool-progress จะเป็นไปตามโหมด preview streaming ที่ใช้งานอยู่; จะถูกข้ามเมื่อ preview streaming เป็น `off` หรือเมื่อ block streaming เข้ามาควบคุมข้อความแล้ว
- หากต้องการคง preview streaming แต่ซ่อนบรรทัด tool-progress ให้ตั้ง `streaming.preview.toolProgress` เป็น `false` สำหรับช่องนั้น หากต้องการปิดการแก้ไข preview ทั้งหมด ให้ตั้ง `streaming.mode` เป็น `off`

ตัวอย่าง:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## ที่เกี่ยวข้อง

- [Messages](/th/concepts/messages) — วงจรชีวิตและการส่งข้อความ
- [Retry](/th/concepts/retry) — พฤติกรรมการลองใหม่เมื่อการส่งล้มเหลว
- [Channels](/th/channels) — การรองรับการสตรีมรายช่อง
