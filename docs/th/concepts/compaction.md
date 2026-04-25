---
read_when:
    - คุณต้องการทำความเข้าใจ auto-compaction และ /compact
    - คุณกำลังดีบักเซสชันยาวที่ชนกับขีดจำกัดของบริบท
summary: วิธีที่ OpenClaw สรุปบทสนทนายาวเพื่อให้อยู่ภายในขีดจำกัดของโมเดล
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

ทุกโมเดลมีหน้าต่างบริบท — จำนวนโทเค็นสูงสุดที่โมเดลสามารถประมวลผลได้
เมื่อบทสนทนาเข้าใกล้ขีดจำกัดนั้น OpenClaw จะทำ **Compaction** กับข้อความเก่า
ให้เป็นสรุป เพื่อให้แชตดำเนินต่อไปได้

## วิธีการทำงาน

1. เทิร์นบทสนทนาเก่าจะถูกสรุปเป็นรายการแบบกะทัดรัด
2. สรุปนั้นจะถูกบันทึกไว้ใน session transcript
3. ข้อความล่าสุดจะยังคงอยู่ครบถ้วน

เมื่อ OpenClaw แบ่งประวัติออกเป็นชิ้นสำหรับ Compaction ระบบจะเก็บ assistant tool
calls ให้จับคู่กับรายการ `toolResult` ที่ตรงกันเสมอ หากจุดแบ่งไปตก
อยู่กลางบล็อกเครื่องมือ OpenClaw จะเลื่อนขอบเขตเพื่อให้คู่นั้นอยู่ด้วยกัน และ
คงส่วนท้ายปัจจุบันที่ยังไม่ถูกสรุปไว้

ประวัติบทสนทนาเต็มยังคงอยู่บนดิสก์ Compaction เปลี่ยนเฉพาะสิ่งที่
โมเดลเห็นในเทิร์นถัดไปเท่านั้น

## auto-compaction

auto-compaction เปิดใช้งานเป็นค่าเริ่มต้น โดยจะทำงานเมื่อเซสชันเข้าใกล้ขีดจำกัดของบริบท
หรือเมื่อโมเดลส่งข้อผิดพลาด context-overflow กลับมา (ในกรณีนั้น
OpenClaw จะทำ Compaction แล้วลองใหม่) ลักษณะข้อผิดพลาด overflow ที่พบบ่อย ได้แก่
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` และ `ollama error: context length
exceeded`

<Info>
ก่อนทำ Compaction OpenClaw จะเตือนเอเจนต์โดยอัตโนมัติให้บันทึก
โน้ตสำคัญลงในไฟล์ [memory](/th/concepts/memory) ซึ่งช่วยป้องกันการสูญเสียบริบท
</Info>

ใช้การตั้งค่า `agents.defaults.compaction` ใน `openclaw.json` ของคุณเพื่อกำหนดค่าพฤติกรรมของ Compaction (โหมด จำนวนโทเค็นเป้าหมาย เป็นต้น)
การสรุป Compaction จะคงตัวระบุแบบทึบแสงไว้เป็นค่าเริ่มต้น (`identifierPolicy: "strict"`) คุณสามารถ override ได้ด้วย `identifierPolicy: "off"` หรือกำหนดข้อความเองด้วย `identifierPolicy: "custom"` และ `identifierInstructions`

คุณสามารถระบุโมเดลอื่นสำหรับการสรุป Compaction ได้ผ่าน `agents.defaults.compaction.model` ตัวเลือกนี้มีประโยชน์เมื่อโมเดลหลักของคุณเป็นโมเดล local หรือโมเดลขนาดเล็ก และคุณต้องการให้สรุป Compaction ถูกสร้างโดยโมเดลที่มีความสามารถมากกว่า ค่านี้รับสตริงรูปแบบ `provider/model-id` ใดก็ได้:

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

วิธีนี้ยังใช้ได้กับโมเดล local เช่น โมเดล Ollama ตัวที่สองที่ใช้เฉพาะสำหรับการสรุป หรือโมเดลผู้เชี่ยวชาญด้าน Compaction ที่ fine-tuned มาแล้ว:

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

เมื่อไม่ได้ตั้งค่าไว้ Compaction จะใช้โมเดลหลักของเอเจนต์

## providers ของ Compaction แบบเสียบปลั๊กได้

Plugins สามารถลงทะเบียน provider ของ Compaction แบบกำหนดเองได้ผ่าน `registerCompactionProvider()` บน Plugin API เมื่อมีการลงทะเบียนและกำหนดค่า provider แล้ว OpenClaw จะมอบหมายการสรุปให้ provider นั้นแทนไปป์ไลน์ LLM ในตัว

หากต้องการใช้ provider ที่ลงทะเบียนไว้ ให้ตั้งค่า provider id ใน config ของคุณ:

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

การตั้งค่า `provider` จะบังคับให้ใช้ `mode: "safeguard"` โดยอัตโนมัติ providers จะได้รับคำสั่ง Compaction และนโยบายการคงตัวระบุแบบเดียวกับเส้นทางในตัว และ OpenClaw จะยังคงรักษาบริบทส่วนท้ายของเทิร์นล่าสุดและเทิร์นที่ถูกแยกไว้หลังจากผลลัพธ์จาก provider หาก provider ล้มเหลวหรือส่งผลลัพธ์ว่างกลับมา OpenClaw จะ fallback ไปใช้การสรุปด้วย LLM ในตัว

## auto-compaction (เปิดตามค่าเริ่มต้น)

เมื่อเซสชันเข้าใกล้หรือเกินหน้าต่างบริบทของโมเดล OpenClaw จะทริกเกอร์ auto-compaction และอาจลองคำขอเดิมอีกครั้งโดยใช้บริบทที่ผ่าน Compaction แล้ว

คุณจะเห็น:

- `🧹 Auto-compaction complete` ในโหมด verbose
- `/status` แสดง `🧹 Compactions: <count>`

ก่อนทำ Compaction OpenClaw สามารถรันเทิร์น **silent memory flush** เพื่อเก็บ
โน้ตถาวรลงดิสก์ ดู [Memory](/th/concepts/memory) สำหรับรายละเอียดและการกำหนดค่า

## Compaction แบบ manual

พิมพ์ `/compact` ในแชตใดก็ได้เพื่อบังคับทำ Compaction เพิ่มคำสั่งเพื่อชี้นำ
การสรุปได้:

```
/compact โฟกัสที่การตัดสินใจด้านการออกแบบ API
```

เมื่อมีการตั้งค่า `agents.defaults.compaction.keepRecentTokens` ไว้ Compaction แบบ manual
จะเคารพจุดตัด Pi นั้นและคงส่วนท้ายล่าสุดไว้ในบริบทที่สร้างใหม่ หากไม่มี
งบประมาณสำหรับการเก็บไว้ที่ระบุชัดเจน Compaction แบบ manual จะทำงานเป็น hard checkpoint และ
ดำเนินต่อจากสรุปใหม่เพียงอย่างเดียว

## การใช้โมเดลอื่น

ตามค่าเริ่มต้น Compaction จะใช้โมเดลหลักของเอเจนต์ คุณสามารถใช้โมเดลที่มี
ความสามารถมากกว่าเพื่อให้ได้สรุปที่ดีขึ้น:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## การแจ้งเตือน Compaction

ตามค่าเริ่มต้น Compaction จะทำงานแบบเงียบ หากต้องการแสดงการแจ้งเตือนสั้น ๆ เมื่อ Compaction
เริ่มต้นและเมื่อเสร็จสิ้น ให้เปิดใช้ `notifyUser`:

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

เมื่อเปิดใช้ ผู้ใช้จะเห็นข้อความสถานะสั้น ๆ รอบการทำ Compaction แต่ละครั้ง
(เช่น "กำลังทำ Compaction บริบท..." และ "Compaction เสร็จสมบูรณ์")

## Compaction เทียบกับ pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **สิ่งที่ทำ** | สรุปบทสนทนาเก่า | ตัดผลลัพธ์เครื่องมือเก่าออก |
| **บันทึกไว้หรือไม่?**       | ใช่ (ใน session transcript)   | ไม่ (อยู่ในหน่วยความจำเท่านั้น ต่อคำขอ) |
| **ขอบเขต**        | บทสนทนาทั้งหมด           | เฉพาะผลลัพธ์ของเครื่องมือ                |

[Session pruning](/th/concepts/session-pruning) คือส่วนเสริมที่เบากว่า ซึ่ง
ตัดผลลัพธ์ของเครื่องมือออกโดยไม่สรุป

## การแก้ปัญหา

**ทำ Compaction บ่อยเกินไปหรือไม่?** หน้าต่างบริบทของโมเดลอาจเล็ก หรือผลลัพธ์จากเครื่องมือ
อาจมีขนาดใหญ่ ลองเปิดใช้
[session pruning](/th/concepts/session-pruning)

**บริบทรู้สึกล้าสมัยหลัง Compaction หรือไม่?** ใช้ `/compact โฟกัสที่ <topic>` เพื่อ
ชี้นำการสรุป หรือเปิดใช้ [memory flush](/th/concepts/memory) เพื่อให้โน้ต
คงอยู่

**ต้องการเริ่มใหม่ทั้งหมดหรือไม่?** `/new` จะเริ่มเซสชันใหม่โดยไม่ทำ Compaction

สำหรับการกำหนดค่าขั้นสูง (reserve tokens, การคงตัวระบุ, custom
context engines, Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI) ดู
[Session Management Deep Dive](/th/reference/session-management-compaction)

## ที่เกี่ยวข้อง

- [Session](/th/concepts/session) — การจัดการและวงจรชีวิตของเซสชัน
- [Session Pruning](/th/concepts/session-pruning) — การตัดผลลัพธ์ของเครื่องมือ
- [Context](/th/concepts/context) — วิธีสร้างบริบทสำหรับเทิร์นของเอเจนต์
- [Hooks](/th/automation/hooks) — hooks ของวงจรชีวิต Compaction (`before_compaction`, `after_compaction`)
