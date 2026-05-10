---
read_when:
    - คุณต้องการใช้ Grok สำหรับ web_search
    - คุณต้องมี XAI_API_KEY สำหรับการค้นหาเว็บ
summary: การค้นหาเว็บของ Grok ผ่านการตอบกลับที่อิงข้อมูลจากเว็บของ xAI
title: การค้นหาด้วย Grok
x-i18n:
    generated_at: "2026-05-10T19:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw รองรับ Grok ในฐานะผู้ให้บริการ `web_search` โดยใช้คำตอบของ xAI ที่อ้างอิงข้อมูลจากเว็บเพื่อสร้างคำตอบที่ AI สังเคราะห์ขึ้น ซึ่งอ้างอิงจากผลการค้นหาสดพร้อมการอ้างอิงแหล่งที่มา

คีย์ xAI API เดียวกันยังใช้ขับเคลื่อนเครื่องมือ `x_search` ในตัวสำหรับการค้นหาโพสต์บน X
(เดิมคือ Twitter) และเครื่องมือ `code_execution` ได้ด้วย หากคุณเก็บคีย์ไว้ใต้
`plugins.entries.xai.config.webSearch.apiKey` ตอนนี้ OpenClaw จะนำคีย์นั้นกลับมาใช้เป็นค่า fallback สำหรับผู้ให้บริการโมเดล xAI ที่รวมมาให้ด้วย

สำหรับเมตริกระดับโพสต์ของ X เช่น การรีโพสต์ การตอบกลับ บุ๊กมาร์ก หรือยอดดู ควรใช้
`x_search` พร้อม URL ของโพสต์หรือ status ID ที่ตรงกัน แทนการใช้คำค้นหาแบบกว้าง

## การเริ่มต้นใช้งานและการกำหนดค่า

หากคุณเลือก **Grok** ระหว่าง:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw สามารถแสดงขั้นตอนติดตามผลแยกต่างหากเพื่อเปิดใช้ `x_search` ด้วย
`XAI_API_KEY` เดียวกัน ขั้นตอนติดตามผลนั้น:

- จะแสดงเฉพาะหลังจากคุณเลือก Grok สำหรับ `web_search`
- ไม่ใช่ตัวเลือกผู้ให้บริการค้นหาเว็บระดับบนสุดแยกต่างหาก
- สามารถตั้งค่าโมเดล `x_search` ระหว่าง flow เดียวกันได้ตามต้องการ

หากคุณข้ามขั้นตอนนี้ คุณสามารถเปิดใช้หรือเปลี่ยน `x_search` ภายหลังในการกำหนดค่าได้

## รับคีย์ API

<Steps>
  <Step title="สร้างคีย์">
    รับคีย์ API จาก [xAI](https://console.x.ai/)
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `XAI_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## การกำหนดค่า

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**ทางเลือกผ่านสภาพแวดล้อม:** ตั้งค่า `XAI_API_KEY` ในสภาพแวดล้อมของ Gateway
สำหรับการติดตั้ง gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## วิธีการทำงาน

Grok ใช้คำตอบของ xAI ที่อ้างอิงข้อมูลจากเว็บเพื่อสังเคราะห์คำตอบพร้อมการอ้างอิงแหล่งที่มาแบบ inline
คล้ายกับแนวทาง grounding ด้วย Google Search ของ Gemini

## พารามิเตอร์ที่รองรับ

การค้นหาของ Grok รองรับ `query`

`count` ได้รับการยอมรับเพื่อความเข้ากันได้กับ `web_search` แบบใช้ร่วมกัน แต่ Grok ยังคง
ส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการพร้อมการอ้างอิงแหล่งที่มา แทนรายการผลลัพธ์จำนวน N รายการ

ตัวกรองเฉพาะผู้ให้บริการยังไม่รองรับในขณะนี้

Grok ใช้ timeout เริ่มต้นเฉพาะผู้ให้บริการที่ 60 วินาที เพราะการค้นหาด้วย xAI Responses
ที่อ้างอิงข้อมูลจากเว็บอาจใช้เวลานานกว่าค่าเริ่มต้นของ `web_search` แบบใช้ร่วมกัน ตั้งค่า
`tools.web.search.timeoutSeconds` เพื่อแทนที่ค่านี้

## การแทนที่ Base URL

ตั้งค่า `plugins.entries.xai.config.webSearch.baseUrl` เมื่อการค้นหาเว็บของ Grok ควร
ส่งผ่านพร็อกซีของผู้ดูแลระบบหรือ endpoint ของ Responses ที่เข้ากันได้กับ xAI OpenClaw
จะโพสต์ไปยัง `<baseUrl>/responses` หลังจากตัดเครื่องหมายสแลชท้ายออก `x_search`
ใช้ fallback `webSearch.baseUrl` เดียวกัน เว้นแต่จะตั้งค่า
`plugins.entries.xai.config.xSearch.baseUrl`

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [`x_search` ใน Web Search](/th/tools/web#x_search) -- การค้นหา X ระดับ first-class ผ่าน xAI
- [Gemini Search](/th/tools/gemini-search) -- คำตอบที่ AI สังเคราะห์ผ่าน Google grounding
