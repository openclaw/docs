---
read_when:
    - คุณต้องการใช้ Kimi สำหรับ web_search
    - คุณต้องมี KIMI_API_KEY หรือ MOONSHOT_API_KEY
summary: การค้นหาเว็บของ Kimi ผ่านการค้นหาเว็บของ Moonshot
title: การค้นหาด้วย Kimi
x-i18n:
    generated_at: "2026-07-12T16:51:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi เป็นผู้ให้บริการ `web_search` ที่ทำงานด้วยการค้นหาเว็บแบบเนทีฟของ Moonshot โดย Moonshot
จะสังเคราะห์คำตอบเดียวพร้อมการอ้างอิงแบบอินไลน์ คล้ายกับผู้ให้บริการคำตอบ
ที่มีข้อมูลอ้างอิงของ Gemini และ Grok แทนที่จะส่งคืนรายการผลลัพธ์ที่จัดอันดับ

## การตั้งค่า

<Steps>
  <Step title="สร้างคีย์">
    รับคีย์ API จาก [Moonshot AI](https://platform.moonshot.cn/)
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` ในสภาพแวดล้อมของ Gateway (สำหรับการ
    ติดตั้ง Gateway ให้เพิ่มลงใน `~/.openclaw/.env`) หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

การเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
จะแจ้งให้ระบุข้อมูลต่อไปนี้ด้วย:

- ภูมิภาค API ของ Moonshot: `https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`
- โมเดลค้นหาเว็บ (ค่าเริ่มต้นคือ `kimi-k2.6`)

## การกำหนดค่า

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // ไม่บังคับ หากตั้งค่า KIMI_API_KEY หรือ MOONSHOT_API_KEY แล้ว
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

ระบบจะตรวจหา `tools.web.search.provider` โดยอัตโนมัติจากคีย์ API ที่มีอยู่เมื่อไม่ได้ระบุค่า
หากกำหนดข้อมูลรับรองการค้นหาไว้หลายชุด ให้ตั้งค่าเป็น `kimi` อย่างชัดเจน

รูปแบบที่กำหนดขอบเขตเทียบเท่าภายใต้ `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`)
ก็ใช้งานได้เช่นกัน โดยทั้งสองรูปแบบจะถูกรวมเป็นการกำหนดค่าที่ผ่านการแก้ค่าเดียวกัน

ค่าเริ่มต้น: หากไม่ระบุ `baseUrl` ค่าเริ่มต้นคือ `https://api.moonshot.ai/v1` ส่วน `model`
มีค่าเริ่มต้นเป็น `kimi-k2.6`

หากการรับส่งข้อมูลแชตใช้โฮสต์จีน (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) `web_search` ของ Kimi จะใช้โฮสต์ดังกล่าวซ้ำโดยอัตโนมัติ
เมื่อไม่ได้ตั้งค่า `baseUrl` ของตัวเอง เพื่อป้องกันไม่ให้คีย์ `.cn` ส่งคำขอไปยัง
ปลายทางระหว่างประเทศโดยไม่ตั้งใจ (ซึ่งจะส่งคืน HTTP 401 สำหรับคีย์เหล่านั้น) ให้ตั้งค่า
`baseUrl` ของ Kimi อย่างชัดเจนเพื่อแทนที่การสืบทอดนี้

## ข้อกำหนดด้านข้อมูลอ้างอิง

OpenClaw จะส่งคืนผลลัพธ์ `web_search` ของ Kimi หลังจากการตอบกลับของ Moonshot
มีหลักฐานข้อมูลอ้างอิงจากการค้นหาเว็บแบบเนทีฟเท่านั้น เช่น การเล่นซ้ำการเรียกเครื่องมือ
`$web_search`, `search_results` หรือ URL อ้างอิง หาก Kimi ตอบโดยตรงโดยไม่มี
ข้อมูลอ้างอิง (ตัวอย่างเช่น "ฉันไม่สามารถเรียกดูอินเทอร์เน็ตได้") OpenClaw จะส่งคืนข้อผิดพลาด
`kimi_web_search_ungrounded` แทนการถือว่าข้อความดังกล่าวเป็นผลการค้นหา
ให้ลองส่งคำค้นหาอีกครั้ง เปลี่ยนไปใช้ผู้ให้บริการแบบมีโครงสร้าง เช่น Brave หรือใช้
`web_fetch` / เครื่องมือเบราว์เซอร์เมื่อคุณมี URL เป้าหมายอยู่แล้ว

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์                                                    | รองรับ                                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | ใช่                                                                                                                       |
| `count`                                                         | ยอมรับเพื่อความเข้ากันได้ข้ามผู้ให้บริการ แต่จะไม่ถูกนำไปใช้: Kimi จะส่งคืนคำตอบที่สังเคราะห์แล้วหนึ่งคำตอบเสมอ ไม่ใช่รายการผลลัพธ์จำนวน N รายการ |
| `country`, `language`, `freshness`, `date_after`, `date_before` | ไม่                                                                                                                       |

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) - ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Moonshot AI](/th/providers/moonshot) - เอกสารผู้ให้บริการโมเดล Moonshot และ Kimi Coding
- [การค้นหาด้วย Gemini](/th/tools/gemini-search) - คำตอบที่ AI สังเคราะห์ผ่านข้อมูลอ้างอิงของ Google
- [การค้นหาด้วย Grok](/th/tools/grok-search) - คำตอบที่ AI สังเคราะห์ผ่านข้อมูลอ้างอิงของ xAI
