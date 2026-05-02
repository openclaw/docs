---
read_when:
    - คุณต้องการใช้ Grok สำหรับ web_search
    - คุณต้องมี XAI_API_KEY สำหรับการค้นหาเว็บ
summary: การค้นเว็บของ Grok ผ่านคำตอบที่อิงเว็บของ xAI
title: การค้นหา Grok
x-i18n:
    generated_at: "2026-05-02T10:31:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw รองรับ Grok เป็นผู้ให้บริการ `web_search` โดยใช้คำตอบที่อ้างอิงเว็บของ xAI
เพื่อสร้างคำตอบที่ AI สังเคราะห์ขึ้น ซึ่งรองรับด้วยผลการค้นหาสด
พร้อมการอ้างอิง

`XAI_API_KEY` เดียวกันยังสามารถขับเคลื่อนเครื่องมือ `x_search` ในตัวสำหรับการค้นหาโพสต์บน X
(เดิมคือ Twitter) ได้ด้วย หากคุณเก็บคีย์ไว้ใต้
`plugins.entries.xai.config.webSearch.apiKey` ตอนนี้ OpenClaw จะนำคีย์นั้นกลับมาใช้เป็น
fallback สำหรับผู้ให้บริการโมเดล xAI ที่รวมมาด้วยเช่นกัน

สำหรับเมตริกระดับโพสต์ของ X เช่น การรีโพสต์ การตอบกลับ บุ๊กมาร์ก หรือจำนวนการดู ให้เลือกใช้
`x_search` พร้อม URL โพสต์ที่แน่นอนหรือ status ID แทนการใช้คำค้นหา
แบบกว้าง

## การเริ่มต้นใช้งานและกำหนดค่า

หากคุณเลือก **Grok** ระหว่าง:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw สามารถแสดงขั้นตอนติดตามผลแยกต่างหากเพื่อเปิดใช้ `x_search` ด้วย
`XAI_API_KEY` เดียวกัน ขั้นตอนติดตามผลนั้น:

- จะปรากฏเฉพาะหลังจากที่คุณเลือก Grok สำหรับ `web_search`
- ไม่ใช่ตัวเลือกผู้ให้บริการค้นหาเว็บระดับบนสุดแยกต่างหาก
- สามารถตั้งค่าโมเดล `x_search` ระหว่างโฟลว์เดียวกันได้ตามต้องการ

หากคุณข้ามขั้นตอนนี้ คุณสามารถเปิดใช้หรือเปลี่ยน `x_search` ภายหลังได้ในการกำหนดค่า

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

## วิธีทำงาน

Grok ใช้คำตอบที่อ้างอิงเว็บของ xAI เพื่อสังเคราะห์คำตอบพร้อมการอ้างอิงแบบ inline
คล้ายกับแนวทางการอ้างอิง Google Search ของ Gemini

## พารามิเตอร์ที่รองรับ

การค้นหาของ Grok รองรับ `query`

`count` ได้รับการยอมรับเพื่อความเข้ากันได้กับ `web_search` ที่ใช้ร่วมกัน แต่ Grok ยังคง
ส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการพร้อมการอ้างอิง แทนที่จะเป็นรายการผลลัพธ์จำนวน N รายการ

ขณะนี้ยังไม่รองรับตัวกรองเฉพาะผู้ให้บริการ

Grok ใช้ timeout เริ่มต้นเฉพาะผู้ให้บริการที่ 60 วินาที เพราะการค้นหาที่อ้างอิงเว็บผ่าน xAI Responses
อาจใช้เวลานานกว่าค่าเริ่มต้นของ `web_search` ที่ใช้ร่วมกัน ตั้งค่า
`tools.web.search.timeoutSeconds` เพื่อแทนที่ค่านี้

## การแทนที่ Base URL

ตั้งค่า `plugins.entries.xai.config.webSearch.baseUrl` เมื่อการค้นหาเว็บของ Grok ควร
ส่งผ่านพร็อกซีของผู้ปฏิบัติการหรือ endpoint Responses ที่เข้ากันได้กับ xAI OpenClaw
จะโพสต์ไปยัง `<baseUrl>/responses` หลังจากตัดเครื่องหมายทับท้ายออกแล้ว `x_search`
จะใช้ fallback `webSearch.baseUrl` เดียวกัน เว้นแต่จะตั้งค่า
`plugins.entries.xai.config.xSearch.baseUrl`

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [`x_search` ใน Web Search](/th/tools/web#x_search) -- การค้นหา X ระดับ first-class ผ่าน xAI
- [Gemini Search](/th/tools/gemini-search) -- คำตอบที่ AI สังเคราะห์ผ่านการอ้างอิงของ Google
