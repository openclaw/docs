---
read_when:
    - คุณต้องการทำความเข้าใจการบีบอัดอัตโนมัติและ /compact
    - คุณกำลังดีบักเซสชันยาวที่ชนขีดจำกัดของบริบท
summary: OpenClaw สรุปบทสนทนายาว ๆ อย่างไรเพื่อให้อยู่ภายในขีดจำกัดของโมเดล
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:25:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

ทุกโมเดลมีหน้าต่างบริบท: จำนวนโทเค็นสูงสุดที่โมเดลสามารถประมวลผลได้ เมื่อบทสนทนาเข้าใกล้ขีดจำกัดนั้น OpenClaw จะทำ **Compaction** กับข้อความเก่าให้เป็นสรุป เพื่อให้แชตดำเนินต่อได้

## วิธีทำงาน

1. รอบบทสนทนาเก่าจะถูกสรุปเป็นรายการแบบย่อ
2. สรุปจะถูกบันทึกไว้ใน transcript ของเซสชัน
3. ข้อความล่าสุดจะถูกเก็บไว้ครบถ้วน

เมื่อ OpenClaw แบ่งประวัติเป็นชิ้น Compaction ระบบจะเก็บการเรียกเครื่องมือของผู้ช่วยไว้คู่กับรายการ `toolResult` ที่ตรงกัน หากจุดแบ่งตกอยู่ภายในบล็อกเครื่องมือ OpenClaw จะเลื่อนขอบเขตเพื่อให้คู่นั้นอยู่ด้วยกันและรักษาส่วนท้ายล่าสุดที่ยังไม่ถูกสรุปไว้

ประวัติบทสนทนาทั้งหมดยังคงอยู่บนดิสก์ Compaction เปลี่ยนเฉพาะสิ่งที่โมเดลเห็นในรอบถัดไปเท่านั้น

## Auto-compaction

Auto-compaction เปิดใช้งานตามค่าเริ่มต้น ระบบจะทำงานเมื่อเซสชันใกล้ถึงขีดจำกัดบริบท หรือเมื่อโมเดลส่งคืนข้อผิดพลาดบริบทล้น ซึ่งในกรณีนั้น OpenClaw จะทำ Compaction แล้วลองใหม่

คุณจะเห็น:

- `embedded run auto-compaction start` / `complete` ในบันทึก Gateway ปกติ
- `🧹 Auto-compaction complete` ในโหมดละเอียด
- `/status` แสดง `🧹 Compactions: <count>`

<Info>
ก่อนทำ Compaction OpenClaw จะเตือนเอเจนต์โดยอัตโนมัติให้บันทึกโน้ตสำคัญลงในไฟล์ [memory](/th/concepts/memory) วิธีนี้ช่วยป้องกันการสูญเสียบริบท
</Info>

<AccordionGroup>
  <Accordion title="ลายเซ็น overflow ที่รู้จัก">
    OpenClaw ตรวจพบ context overflow จากรูปแบบข้อผิดพลาดของผู้ให้บริการเหล่านี้:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction ด้วยตนเอง

พิมพ์ `/compact` ในแชตใดก็ได้เพื่อบังคับทำ Compaction เพิ่มคำสั่งเพื่อกำกับสรุป:

```
/compact Focus on the API design decisions
```

เมื่อตั้งค่า `agents.defaults.compaction.keepRecentTokens` แล้ว Compaction ด้วยตนเองจะเคารพจุดตัดของ OpenClaw นั้นและเก็บส่วนท้ายล่าสุดไว้ในบริบทที่สร้างใหม่ หากไม่มีงบการเก็บที่ระบุชัดเจน Compaction ด้วยตนเองจะทำงานเหมือน checkpoint แบบเด็ดขาดและดำเนินต่อจากสรุปใหม่เพียงอย่างเดียว

## การกำหนดค่า

กำหนดค่า Compaction ภายใต้ `agents.defaults.compaction` ใน `openclaw.json` ของคุณ ปุ่มควบคุมที่ใช้บ่อยที่สุดแสดงไว้ด้านล่าง; สำหรับข้อมูลอ้างอิงทั้งหมด โปรดดู [เจาะลึกการจัดการเซสชัน](/th/reference/session-management-compaction)

### การใช้โมเดลอื่น

ตามค่าเริ่มต้น Compaction จะใช้โมเดลหลักของเอเจนต์ ตั้งค่า `agents.defaults.compaction.model` เพื่อมอบหมายการสรุปให้โมเดลที่มีความสามารถมากกว่า หรือโมเดลเฉพาะทาง ค่า override รับสตริง `provider/model-id` หรือ alias เปล่าที่กำหนดไว้ภายใต้ `agents.defaults.models`:

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

alias เปล่าที่กำหนดค่าไว้จะ resolve เป็นผู้ให้บริการและโมเดล canonical ก่อนเริ่ม Compaction หากค่าเปล่าตรงกับทั้ง alias และ ID โมเดล literal ที่กำหนดค่าไว้ ID โมเดล literal จะมีสิทธิ์ก่อน ค่าเปล่าที่ไม่ตรงกันจะยังคงเป็น ID โมเดลบนผู้ให้บริการที่ใช้งานอยู่

วิธีนี้ใช้ได้กับโมเดล local ด้วย เช่น โมเดล Ollama ตัวที่สองที่อุทิศให้การสรุป:

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

เมื่อไม่ได้ตั้งค่า Compaction จะเริ่มด้วยโมเดลเซสชันที่ใช้งานอยู่ หากการสรุปล้มเหลวด้วยข้อผิดพลาดจากผู้ให้บริการที่มีสิทธิ์ใช้ model fallback ได้ OpenClaw จะลองทำ Compaction ครั้งนั้นใหม่ผ่านลำดับ fallback ของโมเดลที่มีอยู่ของเซสชัน ตัวเลือก fallback เป็นแบบชั่วคราวและจะไม่ถูกเขียนกลับไปยังสถานะเซสชัน override `agents.defaults.compaction.model` ที่ระบุชัดเจนยังคงตรงตามที่ตั้งไว้และไม่สืบทอดลำดับ fallback ของเซสชัน

### การรักษาตัวระบุ

การสรุป Compaction จะรักษาตัวระบุ opaque ตามค่าเริ่มต้น (`identifierPolicy: "strict"`) override ด้วย `identifierPolicy: "off"` เพื่อปิดใช้งาน หรือ `identifierPolicy: "custom"` ร่วมกับ `identifierInstructions` สำหรับคำแนะนำแบบกำหนดเอง

### ตัวป้องกันขนาดไบต์ของ transcript ที่ใช้งานอยู่

เมื่อตั้งค่า `agents.defaults.compaction.maxActiveTranscriptBytes` แล้ว OpenClaw จะทริกเกอร์ Compaction local ปกติก่อนการรัน หาก JSONL ที่ใช้งานอยู่ถึงขนาดนั้น สิ่งนี้มีประโยชน์สำหรับเซสชันที่ทำงานยาวนานซึ่งการจัดการบริบทฝั่งผู้ให้บริการอาจรักษาบริบทโมเดลให้ดีอยู่ได้ ขณะที่ transcript local ยังโตขึ้นเรื่อยๆ ระบบไม่ได้แบ่งไบต์ JSONL ดิบ แต่ขอให้ pipeline Compaction ปกติสร้างสรุปเชิงความหมาย

<Warning>
ตัวป้องกันขนาดไบต์ต้องใช้ `truncateAfterCompaction: true` หากไม่มีการหมุนเวียน transcript ไฟล์ที่ใช้งานอยู่จะไม่หดลงและตัวป้องกันจะยังไม่ทำงาน
</Warning>

### transcript ตัวสืบทอด

เมื่อเปิดใช้งาน `agents.defaults.compaction.truncateAfterCompaction` OpenClaw จะไม่เขียน transcript ที่มีอยู่ทับในตำแหน่งเดิม ระบบจะสร้าง transcript ตัวสืบทอดใหม่ที่ใช้งานอยู่จากสรุป Compaction, สถานะที่เก็บรักษาไว้, และส่วนท้ายที่ยังไม่ถูกสรุป จากนั้นบันทึก metadata ของ checkpoint ที่ชี้ flow การ branch/restore ไปยังตัวสืบทอดที่ถูกย่อนั้น
transcript ตัวสืบทอดยังลบรอบผู้ใช้ยาวที่ซ้ำกันทุกประการซึ่งเข้ามา
ภายในหน้าต่าง retry สั้นๆ เพื่อไม่ให้พายุ retry ของช่องทางถูกพาเข้าไปใน
transcript ที่ใช้งานอยู่ถัดไปหลังทำ Compaction

OpenClaw จะไม่เขียนสำเนา `.checkpoint.*.jsonl` แยกต่างหากสำหรับ
Compaction ใหม่อีกต่อไป ไฟล์ checkpoint legacy ที่มีอยู่ยังคงใช้ได้ขณะถูกอ้างอิง
และจะถูก prune โดยการล้างเซสชันตามปกติ

### การแจ้งเตือน Compaction

ตามค่าเริ่มต้น Compaction จะทำงานแบบเงียบ ตั้งค่า `notifyUser` เพื่อแสดงข้อความสถานะสั้นๆ เมื่อ Compaction เริ่มและเสร็จสิ้น:

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

### การ flush memory

ก่อนทำ Compaction OpenClaw สามารถรันรอบ **silent memory flush** เพื่อจัดเก็บโน้ตถาวรลงดิสก์ ตั้งค่า `agents.defaults.compaction.memoryFlush.model` เมื่อรอบงาน housekeeping นี้ควรใช้โมเดล local แทนโมเดลบทสนทนาที่ใช้งานอยู่:

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

override โมเดล memory-flush เป็นแบบตรงตามที่ตั้งไว้และไม่สืบทอดลำดับ fallback ของเซสชันที่ใช้งานอยู่ ดูรายละเอียดและ config ได้ที่ [Memory](/th/concepts/memory)

## ผู้ให้บริการ Compaction แบบเสียบต่อได้

Plugins สามารถลงทะเบียนผู้ให้บริการ Compaction แบบกำหนดเองผ่าน `registerCompactionProvider()` บน API ของ plugin เมื่อผู้ให้บริการถูกลงทะเบียนและกำหนดค่าแล้ว OpenClaw จะมอบหมายการสรุปให้ผู้ให้บริการนั้นแทน pipeline LLM ในตัว

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

การตั้งค่า `provider` จะบังคับ `mode: "safeguard"` โดยอัตโนมัติ ผู้ให้บริการจะได้รับคำสั่ง Compaction และนโยบายการรักษาตัวระบุเดียวกับเส้นทางในตัว และ OpenClaw ยังคงรักษาบริบท suffix ของ recent-turn และ split-turn หลัง output ของผู้ให้บริการ

<Note>
หากผู้ให้บริการล้มเหลวหรือส่งคืนผลลัพธ์ว่าง OpenClaw จะ fallback ไปใช้การสรุปด้วย LLM ในตัว
</Note>

## Compaction เทียบกับ pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **ทำอะไร** | สรุปบทสนทนาเก่า | ตัดผลลัพธ์เครื่องมือเก่า           |
| **บันทึกหรือไม่**       | ใช่ (ใน transcript ของเซสชัน)   | ไม่ (อยู่ในหน่วยความจำเท่านั้น ต่อคำขอ) |
| **ขอบเขต**        | บทสนทนาทั้งหมด           | เฉพาะผลลัพธ์เครื่องมือ                |

[Session pruning](/th/concepts/session-pruning) เป็นส่วนเสริมที่เบากว่า ซึ่งตัด output ของเครื่องมือโดยไม่สรุป

## การแก้ไขปัญหา

**ทำ Compaction บ่อยเกินไปหรือไม่** หน้าต่างบริบทของโมเดลอาจเล็ก หรือ output ของเครื่องมืออาจใหญ่ ลองเปิดใช้งาน [session pruning](/th/concepts/session-pruning)

**บริบทรู้สึกเก่าหลังทำ Compaction หรือไม่** ใช้ `/compact Focus on <topic>` เพื่อกำกับสรุป หรือเปิดใช้งาน [memory flush](/th/concepts/memory) เพื่อให้โน้ตยังคงอยู่

**ต้องการเริ่มใหม่ทั้งหมดหรือไม่** `/new` เริ่มเซสชันใหม่โดยไม่ทำ Compaction

สำหรับการกำหนดค่าขั้นสูง (โทเค็นสำรอง, การรักษาตัวระบุ, เอนจินบริบทแบบกำหนดเอง, Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI) โปรดดู [เจาะลึกการจัดการเซสชัน](/th/reference/session-management-compaction)

## ที่เกี่ยวข้อง

- [Session](/th/concepts/session): การจัดการเซสชันและวงจรชีวิต
- [Session pruning](/th/concepts/session-pruning): การตัดผลลัพธ์เครื่องมือ
- [Context](/th/concepts/context): วิธีสร้างบริบทสำหรับรอบของเอเจนต์
- [Hooks](/th/automation/hooks): hooks วงจรชีวิตของ Compaction (`before_compaction`, `after_compaction`)
