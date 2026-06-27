---
read_when:
    - คุณต้องการใช้โมเดล Ollama แบบโฮสต์โดยไม่มีเซิร์ฟเวอร์ Ollama ภายในเครื่อง
    - คุณต้องมี id, คีย์ หรือ endpoint ของผู้ให้บริการ ollama-cloud
summary: ใช้ Ollama Cloud โดยตรงกับ OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:14:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud คือ API โมเดลแบบโฮสต์ของ Ollama ซึ่งช่วยให้ OpenClaw เรียกใช้โมเดลที่ Ollama โฮสต์ไว้ได้โดยตรง โดยไม่ต้องติดตั้งเซิร์ฟเวอร์ Ollama ในเครื่องหรือเข้าสู่ระบบแอป Ollama ในเครื่องเป็นโหมดคลาวด์ ใช้ ID ผู้ให้บริการ `ollama-cloud` และการอ้างอิงโมเดล เช่น `ollama-cloud/kimi-k2.6`

หน้านี้ใช้สำหรับการกำหนดเส้นทางแบบคลาวด์เท่านั้นโดยตรง ผู้ให้บริการใช้รูปแบบเนทีฟของ Ollama แบบ `/api/chat` ไม่ใช่เส้นทาง `/v1` ที่เข้ากันได้กับ OpenAI OpenClaw ลงทะเบียนสิ่งนี้เป็น ID ผู้ให้บริการแยกต่างหาก เพื่อไม่ให้ข้อมูลรับรองเฉพาะคลาวด์ การค้นพบแค็ตตาล็อกสด และการเลือกโมเดลปะปนกับโฮสต์ `ollama` ในเครื่อง

ใช้หน้านี้เมื่อคุณต้องการการกำหนดเส้นทางแบบคลาวด์เท่านั้น สำหรับ Ollama ในเครื่อง การกำหนดเส้นทางแบบคลาวด์ร่วมกับในเครื่อง embeddings และรายละเอียดโฮสต์แบบกำหนดเอง ดูที่ [Ollama](/th/providers/ollama)

## การตั้งค่า

สร้างคีย์ API ของ Ollama Cloud ที่ [ollama.com/settings/keys](https://ollama.com/settings/keys) แล้วเรียกใช้:

```bash
openclaw onboard --auth-choice ollama-cloud
```

หรือกำหนด:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## ค่าเริ่มต้น

- ผู้ให้บริการ: `ollama-cloud`
- URL ฐาน: `https://ollama.com`
- ตัวแปรสภาพแวดล้อม: `OLLAMA_API_KEY`
- รูปแบบ API: เนทีฟของ Ollama `/api/chat`
- โมเดลตัวอย่าง: `ollama-cloud/kimi-k2.6`

## เมื่อใดควรเลือก Ollama Cloud

- คุณต้องการโมเดล Ollama แบบโฮสต์โดยไม่ต้องเรียกใช้ `ollama serve` ในเครื่อง
- คุณต้องการรูปแบบ API แชตเนทีฟของ Ollama แบบเดียวกับที่ OpenClaw ใช้กับ Ollama ในเครื่อง แต่ชี้ไปที่ `https://ollama.com`
- คุณต้องการเส้นทางคลาวด์ที่เรียบง่ายสำหรับโมเดลที่มีอยู่แล้วในแค็ตตาล็อกแบบโฮสต์ของ Ollama
- คุณไม่ต้องการการดึงโมเดลลงเครื่อง การควบคุม GPU ในเครื่อง หรือการอนุมานเฉพาะบน LAN

ใช้ [Ollama](/th/providers/ollama) แทนเมื่อคุณต้องการการกำหนดเส้นทางเฉพาะในเครื่องหรือแบบคลาวด์ร่วมกับในเครื่องผ่านโฮสต์ Ollama ที่เข้าสู่ระบบแล้ว ใช้ผู้ให้บริการที่เข้ากันได้กับ OpenAI แทนเมื่อคุณต้องการความหมายแบบ `/v1/chat/completions` หรือฟีเจอร์เฉพาะผู้ให้บริการแบบ OpenAI

## โมเดล

OpenClaw ค้นพบโมเดล Ollama Cloud จากแค็ตตาล็อกแบบโฮสต์สด ID แบบโฮสต์ที่มักพร้อมใช้งานมีดังนี้:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

ใช้ ID โมเดลจากแค็ตตาล็อกแบบโฮสต์ปัจจุบันของคุณ:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

ID โมเดลคือ ID ในแค็ตตาล็อกคลาวด์ ไม่ใช่ชื่อที่ใช้ดึงในเครื่อง หากชื่อโมเดลใช้งานได้ในโฮสต์ Ollama ในเครื่อง แต่ไม่มีอยู่ในแค็ตตาล็อกแบบโฮสต์ ให้ใช้ผู้ให้บริการ `ollama` กับโฮสต์ในเครื่องนั้นแทน

## การทดสอบสด

สำหรับการทดสอบเบื้องต้นด้วยคีย์ API ของ Ollama Cloud ให้ชี้การทดสอบสดของ Ollama ไปยัง endpoint แบบโฮสต์และเลือกโมเดลจากแค็ตตาล็อกปัจจุบันของคุณ:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

การทดสอบเบื้องต้นบนคลาวด์เรียกใช้ข้อความ สตรีมเนทีฟ และการค้นหาเว็บ โดยค่าเริ่มต้นจะข้าม embeddings สำหรับ `https://ollama.com` เพราะคีย์ API ของ Ollama Cloud อาจไม่ได้อนุญาต `/api/embed`

## การแก้ไขปัญหา

- ข้อผิดพลาด `Set OLLAMA_API_KEY`: ระบุคีย์ API คลาวด์จริง เครื่องหมาย `ollama-local` ในเครื่องใช้สำหรับโฮสต์ Ollama ในเครื่องหรือโฮสต์ส่วนตัวเท่านั้น
- ข้อผิดพลาดโมเดลไม่รู้จัก: เรียกใช้ `openclaw models list --provider ollama-cloud` แล้วคัดลอก ID โมเดลแบบโฮสต์ให้ตรงทุกตัวอักษร
- ปัญหาการเรียกใช้เครื่องมือหรือ JSON ดิบบนโฮสต์ Ollama แบบกำหนดเอง: ตรวจสอบว่าคุณเผลอใช้ URL `/v1` ที่เข้ากันได้กับ OpenAI อยู่หรือไม่ เส้นทาง Ollama ควรใช้ URL ฐานแบบเนทีฟโดยไม่มี suffix `/v1`

## ที่เกี่ยวข้อง

- [Ollama](/th/providers/ollama)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการทั้งหมด](/th/providers/index)
