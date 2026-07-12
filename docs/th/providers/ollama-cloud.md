---
read_when:
    - คุณต้องการใช้โมเดล Ollama แบบโฮสต์โดยไม่ต้องมีเซิร์ฟเวอร์ Ollama ภายในเครื่อง
    - คุณต้องมี ID ผู้ให้บริการ คีย์ หรือปลายทางของ ollama-cloud
summary: ใช้ Ollama Cloud กับ OpenClaw โดยตรง
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T16:40:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud คือ API โมเดลแบบโฮสต์ของ Ollama ผู้ให้บริการ `ollama-cloud` เรียกใช้ API นี้
โดยตรงที่ `https://ollama.com` ผ่าน API `/api/chat` แบบเนทีฟของ Ollama โดยไม่ต้องมี
เซิร์ฟเวอร์ Ollama ภายในเครื่องและไม่ต้องมีแอป Ollama ภายในเครื่องที่ลงชื่อเข้าใช้โหมดคลาวด์ ใช้การอ้างอิงโมเดล
เช่น `ollama-cloud/kimi-k2.6`

OpenClaw ลงทะเบียน `ollama-cloud` เป็นรหัสผู้ให้บริการแยกต่างหาก เพื่อไม่ให้
ข้อมูลประจำตัวสำหรับคลาวด์เท่านั้น การค้นพบแค็ตตาล็อกแบบสด และการเลือกโมเดลปะปนกับ
โฮสต์ `ollama` ภายในเครื่อง สำหรับ Ollama ภายในเครื่อง การกำหนดเส้นทางแบบไฮบริดระหว่างคลาวด์กับภายในเครื่อง
การฝังเวกเตอร์ และรายละเอียดโฮสต์แบบกำหนดเอง โปรดดู [Ollama](/th/providers/ollama)

## การตั้งค่า

สร้างคีย์ API ของ Ollama Cloud ที่ [ollama.com/settings/keys](https://ollama.com/settings/keys) แล้วเรียกใช้:

```bash
openclaw onboard --auth-choice ollama-cloud
```

หรือตั้งค่า:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

การเริ่มต้นใช้งานแบบไม่โต้ตอบรับคีย์ได้โดยตรง:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

การเริ่มต้นใช้งานจะตั้งโมเดลเริ่มต้นเป็น `ollama-cloud/kimi-k2.5:cloud`

## ค่าเริ่มต้น

- ผู้ให้บริการ: `ollama-cloud`
- URL ฐาน: `https://ollama.com`
- ตัวแปรสภาพแวดล้อม: `OLLAMA_API_KEY`
- รูปแบบ API: `/api/chat` แบบเนทีฟของ Ollama
- โมเดลเริ่มต้นสำหรับการเริ่มต้นใช้งาน: `ollama-cloud/kimi-k2.5:cloud`

## เมื่อใดควรเลือก Ollama Cloud

- คุณต้องการใช้โมเดล Ollama แบบโฮสต์โดยไม่ต้องเรียกใช้ `ollama serve` ภายในเครื่อง
- คุณต้องการรูปแบบ API แชตแบบเนทีฟของ Ollama เช่นเดียวกับที่ OpenClaw ใช้สำหรับ Ollama
  ภายในเครื่อง แต่ชี้ไปที่ `https://ollama.com`
- คุณต้องการเส้นทางคลาวด์ที่เรียบง่ายสำหรับโมเดลที่มีอยู่แล้วในแค็ตตาล็อกแบบโฮสต์
  ของ Ollama
- คุณไม่ต้องการดาวน์โหลดโมเดลภายในเครื่อง ควบคุม GPU ภายในเครื่อง หรืออนุมานเฉพาะภายใน LAN

ให้ใช้ [Ollama](/th/providers/ollama) แทนเมื่อต้องการกำหนดเส้นทางเฉพาะภายในเครื่องหรือ
ระหว่างคลาวด์กับภายในเครื่องผ่านโฮสต์ Ollama ที่ลงชื่อเข้าใช้แล้ว ให้ใช้
ผู้ให้บริการที่เข้ากันได้กับ OpenAI แทนเมื่อต้องการรูปแบบการทำงานของ `/v1/chat/completions`
หรือคุณสมบัติเฉพาะผู้ให้บริการในรูปแบบ OpenAI

## โมเดล

ผู้ให้บริการต้องใช้คีย์ API หากไม่มีคีย์ ผู้ให้บริการจะไม่ทำงาน เมื่อมีคีย์
OpenClaw จะค้นพบโมเดล Ollama Cloud แบบสดจากแค็ตตาล็อกแบบโฮสต์:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

รหัสแบบโฮสต์ในแค็ตตาล็อกสดประกอบด้วย `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` และ `minimax-m2.7` เมื่อการค้นพบแบบสดไม่ส่งคืน
ผลลัพธ์ใด OpenClaw จะถอยกลับไปใช้รายการที่รวมมาให้ ได้แก่ `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` และ `glm-5.2:cloud`

รหัสโมเดลคือรหัสในแค็ตตาล็อกคลาวด์ ไม่ใช่ชื่อสำหรับดาวน์โหลดภายในเครื่อง หากชื่อโมเดลใช้งานได้ใน
โฮสต์ Ollama ภายในเครื่องแต่ไม่มีอยู่ในแค็ตตาล็อกแบบโฮสต์ ให้ใช้ผู้ให้บริการ `ollama`
กับโฮสต์ภายในเครื่องนั้นแทน

## การทดสอบแบบสด

สำหรับการทดสอบเบื้องต้นด้วยคีย์ API ของ Ollama Cloud ให้ชี้การทดสอบแบบสดของ Ollama ไปยังปลายทาง
แบบโฮสต์และเลือกโมเดลจากแค็ตตาล็อกปัจจุบันของคุณ:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

การทดสอบเบื้องต้นบนคลาวด์จะทดสอบข้อความ สตรีมแบบเนทีฟ และการค้นหาเว็บ ตั้งค่า
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` เพื่อข้ามการค้นหาเว็บ โดยค่าเริ่มต้นจะข้ามการฝังเวกเตอร์
สำหรับ `https://ollama.com` เนื่องจากคีย์ API ของ Ollama Cloud อาจไม่มีสิทธิ์
เข้าถึง `/api/embed` หากต้องการบังคับให้ทดสอบ ให้ตั้งค่า `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`

## การแก้ไขปัญหา

- ข้อผิดพลาด `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: ระบุ
  คีย์ API ของคลาวด์จริง เครื่องหมาย `ollama-local` มีไว้สำหรับโฮสต์ Ollama ภายในเครื่องหรือ
  แบบส่วนตัวเท่านั้น
- ข้อผิดพลาดโมเดลที่ไม่รู้จัก: เรียกใช้ `openclaw models list --provider ollama-cloud` แล้ว
  คัดลอกรหัสโมเดลแบบโฮสต์ให้ตรงทุกตัวอักษร
- ปัญหาการเรียกใช้เครื่องมือหรือ JSON ดิบในโฮสต์ Ollama แบบกำหนดเอง: ตรวจสอบว่าคุณ
  เผลอใช้ URL `/v1` ที่เข้ากันได้กับ OpenAI หรือไม่ เส้นทาง Ollama ควรใช้
  URL ฐานแบบเนทีฟโดยไม่มีส่วนต่อท้าย `/v1`

## เนื้อหาที่เกี่ยวข้อง

- [Ollama](/th/providers/ollama)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการทั้งหมด](/th/providers/index)
