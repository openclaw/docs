---
read_when:
    - คุณต้องการทำความเข้าใจการทำ Compaction อัตโนมัติและ /compact
    - คุณกำลังดีบักเซสชันที่ยาวจนถึงขีดจำกัดบริบท
summary: OpenClaw สรุปบทสนทนายาว ๆ อย่างไรเพื่อให้อยู่ภายในขีดจำกัดของโมเดล
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

ทุกโมเดลมีหน้าต่างบริบท: จำนวนโทเค็นสูงสุดที่โมเดลสามารถประมวลผลได้ เมื่อบทสนทนาเข้าใกล้ขีดจำกัดนั้น OpenClaw จะ **compact** ข้อความเก่าให้เป็นสรุป เพื่อให้แชตดำเนินต่อได้

## วิธีทำงาน

1. เทิร์นบทสนทนาเก่าจะถูกสรุปเป็นรายการแบบ compact
2. สรุปจะถูกบันทึกไว้ในทรานสคริปต์ของเซสชัน
3. ข้อความล่าสุดจะถูกเก็บไว้ครบถ้วน

เมื่อ OpenClaw แบ่งประวัติเป็นก้อน compaction จะเก็บการเรียกเครื่องมือของผู้ช่วยไว้คู่กับรายการ `toolResult` ที่ตรงกัน หากจุดแบ่งตกอยู่ภายในบล็อกเครื่องมือ OpenClaw จะเลื่อนขอบเขตเพื่อให้คู่อยู่ด้วยกัน และรักษาส่วนท้ายปัจจุบันที่ยังไม่ถูกสรุปไว้

ประวัติบทสนทนาทั้งหมดยังคงอยู่บนดิสก์ Compaction เปลี่ยนเฉพาะสิ่งที่โมเดลเห็นในเทิร์นถัดไป

## Auto-compaction

Auto-compaction เปิดใช้งานโดยค่าเริ่มต้น ระบบจะทำงานเมื่อเซสชันเข้าใกล้ขีดจำกัดบริบท หรือเมื่อโมเดลส่งคืนข้อผิดพลาด context-overflow ซึ่งในกรณีนั้น OpenClaw จะ compact แล้วลองใหม่

คุณจะเห็น:

- `embedded run auto-compaction start` / `complete` ในบันทึก Gateway ปกติ
- `🧹 Auto-compaction complete` ในโหมด verbose
- `/status` แสดง `🧹 Compactions: <count>`

<Info>
ก่อน compact OpenClaw จะเตือนเอเจนต์โดยอัตโนมัติให้บันทึกโน้ตสำคัญลงในไฟล์ [memory](/th/concepts/memory) วิธีนี้ช่วยป้องกันการสูญเสียบริบท
</Info>

<AccordionGroup>
  <Accordion title="ลายเซ็น overflow ที่รู้จัก">
    OpenClaw ตรวจจับ context overflow จากรูปแบบข้อผิดพลาดของผู้ให้บริการเหล่านี้:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## การ compact ด้วยตนเอง

พิมพ์ `/compact` ในแชตใดก็ได้เพื่อบังคับ compaction เพิ่มคำสั่งเพื่อกำหนดแนวทางสรุป:

```
/compact Focus on the API design decisions
```

เมื่อตั้งค่า `agents.defaults.compaction.keepRecentTokens` แล้ว manual compaction จะเคารพจุดตัด Pi นั้นและเก็บส่วนท้ายล่าสุดไว้ในบริบทที่สร้างใหม่ หากไม่มีงบประมาณ keep ที่ชัดเจน manual compaction จะทำงานเหมือน checkpoint แบบแข็ง และดำเนินต่อจากสรุปใหม่เพียงอย่างเดียว

## การกำหนดค่า

กำหนดค่า compaction ภายใต้ `agents.defaults.compaction` ใน `openclaw.json` ของคุณ ตัวปรับที่ใช้บ่อยที่สุดแสดงไว้ด้านล่าง สำหรับข้อมูลอ้างอิงฉบับเต็ม โปรดดู [เจาะลึกการจัดการเซสชัน](/th/reference/session-management-compaction)

### การใช้โมเดลอื่น

โดยค่าเริ่มต้น compaction ใช้โมเดลหลักของเอเจนต์ ตั้งค่า `agents.defaults.compaction.model` เพื่อมอบหมายการสรุปให้โมเดลที่มีความสามารถมากกว่าหรือเฉพาะทางกว่า ค่า override รับสตริง `provider/model-id` ใดก็ได้:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

วิธีนี้ใช้กับโมเดลภายในเครื่องได้เช่นกัน เช่น โมเดล Ollama ตัวที่สองที่ใช้สำหรับการสรุปโดยเฉพาะ:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

หากไม่ได้ตั้งค่า compaction จะเริ่มด้วยโมเดลเซสชันที่ใช้งานอยู่ หากการสรุปล้มเหลวด้วยข้อผิดพลาดจากผู้ให้บริการที่เข้าเกณฑ์ model-fallback OpenClaw จะลอง compaction ครั้งนั้นอีกครั้งผ่านสาย fallback ของโมเดลเดิมของเซสชัน ตัวเลือก fallback เป็นแบบชั่วคราวและจะไม่ถูกเขียนกลับไปยังสถานะเซสชัน ค่า override `agents.defaults.compaction.model` ที่ชัดเจนยังคงตรงตัวและไม่สืบทอดสาย fallback ของเซสชัน

### การรักษาตัวระบุ

การสรุป compaction จะรักษาตัวระบุทึบแสงไว้โดยค่าเริ่มต้น (`identifierPolicy: "strict"`) Override ด้วย `identifierPolicy: "off"` เพื่อปิดใช้งาน หรือ `identifierPolicy: "custom"` พร้อม `identifierInstructions` สำหรับคำแนะนำที่กำหนดเอง

### ตัวป้องกันไบต์ของทรานสคริปต์ที่ใช้งานอยู่

เมื่อตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` แล้ว OpenClaw จะทริกเกอร์ compaction ภายในเครื่องแบบปกติก่อนรัน หาก JSONL ที่ใช้งานอยู่ถึงขนาดนั้น สิ่งนี้มีประโยชน์สำหรับเซสชันที่ทำงานยาวนาน ซึ่งการจัดการบริบทฝั่งผู้ให้บริการอาจทำให้บริบทโมเดลยังสมบูรณ์อยู่ ขณะที่ทรานสคริปต์ภายในเครื่องยังคงโตขึ้นเรื่อยๆ ระบบไม่ได้แบ่งไบต์ JSONL ดิบ แต่ขอให้ pipeline compaction ปกติสร้างสรุปเชิงความหมาย

<Warning>
ตัวป้องกันไบต์ต้องใช้ `truncateAfterCompaction: true` หากไม่มีการหมุนเวียนทรานสคริปต์ ไฟล์ที่ใช้งานอยู่จะไม่เล็กลงและตัวป้องกันจะยังไม่ทำงาน
</Warning>

### ทรานสคริปต์ successor

เมื่อเปิดใช้งาน `agents.defaults.compaction.truncateAfterCompaction` OpenClaw จะไม่เขียนทับทรานสคริปต์เดิมแบบ in place แต่จะสร้างทรานสคริปต์ successor ที่ใช้งานอยู่ใหม่จากสรุป compaction สถานะที่เก็บรักษาไว้ และส่วนท้ายที่ยังไม่ถูกสรุป จากนั้นเก็บ JSONL ก่อนหน้าไว้เป็นแหล่ง checkpoint ที่ถูกเก็บถาวร
ทรานสคริปต์ successor ยังทิ้งเทิร์นผู้ใช้ยาวๆ ที่ซ้ำกันแบบตรงตัวซึ่งมาถึง
ภายในหน้าต่าง retry สั้นๆ เพื่อไม่ให้ retry storm ของช่องทางถูกส่งต่อไปยัง
ทรานสคริปต์ที่ใช้งานอยู่ถัดไปหลัง compaction

checkpoint ก่อน compaction จะถูกเก็บไว้เฉพาะในขณะที่ยังต่ำกว่า
ขีดจำกัดขนาด checkpoint ของ OpenClaw เท่านั้น ทรานสคริปต์ที่ใช้งานอยู่ซึ่งมีขนาดใหญ่เกินยังคง compact ได้ แต่ OpenClaw
จะข้าม snapshot ดีบักขนาดใหญ่แทนที่จะเพิ่มการใช้ดิสก์เป็นสองเท่า

### ประกาศ compaction

โดยค่าเริ่มต้น compaction จะทำงานอย่างเงียบๆ ตั้งค่า `notifyUser` เพื่อแสดงข้อความสถานะสั้นๆ เมื่อ compaction เริ่มและเสร็จสิ้น:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Memory flush

ก่อน compaction OpenClaw สามารถรันเทิร์น **silent memory flush** เพื่อเก็บโน้ตถาวรลงดิสก์ได้ ตั้งค่า `agents.defaults.compaction.memoryFlush.model` เมื่อต้องการให้เทิร์น housekeeping นี้ใช้โมเดลภายในเครื่องแทนโมเดลบทสนทนาที่ใช้งานอยู่:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

ค่า override ของโมเดล memory-flush เป็นแบบตรงตัวและไม่สืบทอดสาย fallback ของเซสชันที่ใช้งานอยู่ ดูรายละเอียดและการกำหนดค่าได้ที่ [Memory](/th/concepts/memory)

## ผู้ให้บริการ compaction แบบเสียบเพิ่มได้

Plugins สามารถลงทะเบียนผู้ให้บริการ compaction แบบกำหนดเองผ่าน `registerCompactionProvider()` บน API ของ Plugin ได้ เมื่อผู้ให้บริการถูกลงทะเบียนและกำหนดค่าแล้ว OpenClaw จะมอบหมายการสรุปให้ผู้ให้บริการนั้นแทน pipeline LLM ในตัว

หากต้องการใช้ผู้ให้บริการที่ลงทะเบียนแล้ว ให้ตั้งค่า id ของผู้ให้บริการใน config ของคุณ:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

การตั้งค่า `provider` จะบังคับ `mode: "safeguard"` โดยอัตโนมัติ ผู้ให้บริการได้รับคำสั่ง compaction และนโยบายการรักษาตัวระบุเหมือนกับ path ในตัว และ OpenClaw ยังคงรักษาบริบทส่วนท้ายของเทิร์นล่าสุดและเทิร์นที่ถูกแบ่งหลังจากเอาต์พุตของผู้ให้บริการ

<Note>
หากผู้ให้บริการล้มเหลวหรือส่งคืนผลลัพธ์ว่าง OpenClaw จะ fallback กลับไปใช้การสรุปด้วย LLM ในตัว
</Note>

## Compaction เทียบกับ pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **ทำอะไร** | สรุปบทสนทนาเก่า | ตัดผลลัพธ์เครื่องมือเก่า           |
| **บันทึกหรือไม่**       | ใช่ (ในทรานสคริปต์เซสชัน)   | ไม่ (เฉพาะในหน่วยความจำ ต่อคำขอ) |
| **ขอบเขต**        | บทสนทนาทั้งหมด           | เฉพาะผลลัพธ์เครื่องมือ                |

[Session pruning](/th/concepts/session-pruning) เป็นส่วนเสริมที่เบากว่า ซึ่งตัดเอาต์พุตเครื่องมือโดยไม่สรุป

## การแก้ไขปัญหา

**Compact บ่อยเกินไปหรือไม่** หน้าต่างบริบทของโมเดลอาจเล็ก หรือเอาต์พุตเครื่องมืออาจมีขนาดใหญ่ ลองเปิดใช้งาน [session pruning](/th/concepts/session-pruning)

**บริบทรู้สึกเก่าหลัง compaction หรือไม่** ใช้ `/compact Focus on <topic>` เพื่อกำหนดแนวทางสรุป หรือเปิดใช้งาน [memory flush](/th/concepts/memory) เพื่อให้โน้ตคงอยู่

**ต้องการเริ่มใหม่ทั้งหมดหรือไม่** `/new` เริ่มเซสชันใหม่โดยไม่ compact

สำหรับการกำหนดค่าขั้นสูง เช่น reserve tokens, การรักษาตัวระบุ, เครื่องมือบริบทแบบกำหนดเอง และ compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI โปรดดู [เจาะลึกการจัดการเซสชัน](/th/reference/session-management-compaction)

## ที่เกี่ยวข้อง

- [Session](/th/concepts/session): การจัดการเซสชันและ lifecycle
- [Session pruning](/th/concepts/session-pruning): การตัดผลลัพธ์เครื่องมือ
- [Context](/th/concepts/context): วิธีสร้างบริบทสำหรับเทิร์นของเอเจนต์
- [Hooks](/th/automation/hooks): lifecycle hooks ของ compaction (`before_compaction`, `after_compaction`)
