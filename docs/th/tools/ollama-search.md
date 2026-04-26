---
read_when:
    - คุณต้องการใช้ Ollama กับ `web_search`
    - คุณต้องการ provider `web_search` ที่ไม่ต้องใช้คีย์
    - คุณต้องการคำแนะนำในการตั้งค่า Ollama Web Search
summary: Ollama Web Search ผ่านโฮสต์ Ollama ที่คุณกำหนดค่าไว้
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-26T11:44:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw รองรับ **Ollama Web Search** ในฐานะ provider `web_search` แบบ bundled โดย
ใช้ API สำหรับ web-search ของ Ollama และส่งคืนผลลัพธ์แบบมีโครงสร้างพร้อม title, URL
และ snippet

ต่างจาก provider โมเดลของ Ollama การตั้งค่านี้โดยค่าเริ่มต้นไม่ต้องใช้ API key
แต่ต้องมี:

- โฮสต์ Ollama ที่ OpenClaw เข้าถึงได้
- `ollama signin`

## การตั้งค่า

<Steps>
  <Step title="เริ่ม Ollama">
    ตรวจสอบให้แน่ใจว่าได้ติดตั้งและรัน Ollama แล้ว
  </Step>
  <Step title="ลงชื่อเข้าใช้">
    รัน:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="เลือก Ollama Web Search">
    รัน:

    ```bash
    openclaw configure --section web
    ```

    จากนั้นเลือก **Ollama Web Search** เป็น provider

  </Step>
</Steps>

หากคุณใช้ Ollama สำหรับโมเดลอยู่แล้ว Ollama Web Search จะใช้โฮสต์ที่
กำหนดค่าไว้เดิมร่วมกัน

## คอนฟิก

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

override โฮสต์ Ollama แบบเลือกได้:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

หากไม่ได้ตั้งค่า Ollama base URL อย่างชัดเจน OpenClaw จะใช้ `http://127.0.0.1:11434`

หากโฮสต์ Ollama ของคุณคาดหวัง bearer auth, OpenClaw จะนำ
`models.providers.ollama.apiKey` (หรือ auth ของ provider ที่อิง env ตรงกัน)
กลับมาใช้กับคำขอ web-search ด้วย

## หมายเหตุ

- provider นี้ไม่ต้องใช้ฟิลด์ API key เฉพาะสำหรับ web-search
- หากโฮสต์ Ollama ถูกป้องกันด้วย auth, OpenClaw จะใช้ API key ปกติของ
  provider Ollama ซ้ำเมื่อมีอยู่
- OpenClaw จะเตือนระหว่างการตั้งค่าหากเข้าถึง Ollama ไม่ได้หรือยังไม่ได้ sign in แต่
  จะไม่บล็อกการเลือก
- การตรวจหาอัตโนมัติขณะ runtime สามารถ fallback ไปยัง Ollama Web Search ได้ เมื่อไม่มี provider ที่ใช้ข้อมูลรับรองและมีลำดับความสำคัญสูงกว่าถูกตั้งค่าไว้
- provider นี้ใช้ endpoint `/api/web_search` ของ Ollama

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- provider ทั้งหมดและการตรวจหาอัตโนมัติ
- [Ollama](/th/providers/ollama) -- การตั้งค่าโมเดล Ollama และโหมด cloud/local
