---
read_when:
    - คุณต้องการใช้ Kimi สำหรับ web_search
    - คุณต้องมี KIMI_API_KEY หรือ MOONSHOT_API_KEY
summary: การค้นหาเว็บของ Kimi ผ่านการค้นหาเว็บของ Moonshot
title: การค้นหา Kimi
x-i18n:
    generated_at: "2026-05-02T10:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw รองรับ Kimi ในฐานะผู้ให้บริการ `web_search` โดยใช้การค้นหาเว็บของ Moonshot
เพื่อสร้างคำตอบที่ AI สังเคราะห์ขึ้นพร้อมการอ้างอิง

## รับคีย์ API

<Steps>
  <Step title="Create a key">
    รับคีย์ API จาก [Moonshot AI](https://platform.moonshot.cn/)
  </Step>
  <Step title="Store the key">
    ตั้งค่า `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` ในสภาพแวดล้อมของ Gateway หรือ
    กำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

เมื่อคุณเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ
`openclaw configure --section web` OpenClaw ยังสามารถถามถึง:

- ภูมิภาค API ของ Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- โมเดลการค้นหาเว็บเริ่มต้นของ Kimi (ค่าเริ่มต้นคือ `kimi-k2.6`)

## การกำหนดค่า

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

หากคุณใช้โฮสต์ API จีนสำหรับแชต (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) OpenClaw จะใช้โฮสต์เดียวกันนั้นซ้ำสำหรับ Kimi
`web_search` เมื่อไม่ได้ระบุ `tools.web.search.kimi.baseUrl` ดังนั้นคีย์จาก
[platform.moonshot.cn](https://platform.moonshot.cn/) จะไม่ไปยังปลายทางสากล
โดยไม่ตั้งใจ (ซึ่งมักส่งคืน HTTP 401) ให้แทนที่ด้วย
`tools.web.search.kimi.baseUrl` เมื่อคุณต้องการ URL ฐานสำหรับการค้นหาที่แตกต่างกัน

**ทางเลือกสภาพแวดล้อม:** ตั้งค่า `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` ใน
สภาพแวดล้อมของ Gateway สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

หากคุณไม่ระบุ `baseUrl` OpenClaw จะใช้ค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1`
หากคุณไม่ระบุ `model` OpenClaw จะใช้ค่าเริ่มต้นเป็น `kimi-k2.6`

## วิธีการทำงาน

Kimi ใช้การค้นหาเว็บของ Moonshot เพื่อสังเคราะห์คำตอบพร้อมการอ้างอิงแบบอินไลน์
คล้ายกับแนวทางการตอบสนองแบบอ้างอิงข้อมูลพื้นฐานของ Gemini และ Grok

OpenClaw จะถือว่า Kimi `web_search` สำเร็จก็ต่อเมื่อ Moonshot ส่งคืน
หลักฐานการอ้างอิงจากการค้นหาเว็บแบบเนทีฟ เช่น payload ของเครื่องมือ `$web_search`
ที่เล่นซ้ำได้, `search_results` หรือ URL การอ้างอิง หาก Kimi หยุดทันทีด้วย
คำตอบแชตธรรมดาอย่าง "I cannot browse the internet" และไม่มีหลักฐานการอ้างอิง
OpenClaw จะส่งคืนข้อผิดพลาดแบบมีโครงสร้าง `kimi_web_search_ungrounded` แทนการ
ห่อข้อความนั้นเป็นผลการค้นหา ให้ลองค้นหาใหม่ เปลี่ยนไปใช้ผู้ให้บริการแบบมีโครงสร้าง
เช่น Brave หรือใช้ `web_fetch` / เครื่องมือเบราว์เซอร์เมื่อคุณมี URL เป้าหมายอยู่แล้ว

## พารามิเตอร์ที่รองรับ

การค้นหาของ Kimi รองรับ `query`

มีการยอมรับ `count` เพื่อความเข้ากันได้กับ `web_search` แบบใช้ร่วมกัน แต่ Kimi ยังคง
ส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการพร้อมการอ้างอิง แทนที่จะเป็นรายการผลลัพธ์จำนวน N รายการ

ขณะนี้ยังไม่รองรับตัวกรองเฉพาะผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Moonshot AI](/th/providers/moonshot) -- เอกสารผู้ให้บริการโมเดล Moonshot + Kimi Coding
- [Gemini Search](/th/tools/gemini-search) -- คำตอบที่ AI สังเคราะห์ผ่านการอ้างอิงข้อมูลพื้นฐานของ Google
- [Grok Search](/th/tools/grok-search) -- คำตอบที่ AI สังเคราะห์ผ่านการอ้างอิงข้อมูลพื้นฐานของ xAI
