---
read_when:
    - คุณต้องการใช้ Kimi สำหรับ web_search
    - คุณต้องมี KIMI_API_KEY หรือ MOONSHOT_API_KEY
summary: การค้นหาเว็บของ Kimi ผ่านการค้นหาเว็บของ Moonshot
title: การค้นหาของ Kimi
x-i18n:
    generated_at: "2026-07-20T06:06:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 65e5f8c9f3b607dbcc3256c51a6a083864e31f65ed2a751d2d500abeb35ba844
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi เป็นผู้ให้บริการ `web_search` ที่ทำงานบนการค้นหาเว็บแบบเนทีฟของ Moonshot โดย Moonshot
จะสังเคราะห์คำตอบเดียวพร้อมการอ้างอิงในข้อความ คล้ายกับผู้ให้บริการคำตอบที่อิงข้อมูล
ของ Gemini และ Grok แทนที่จะส่งคืนรายการผลลัพธ์ที่จัดอันดับแล้ว

## การตั้งค่า

<Steps>
  <Step title="สร้างคีย์">
    รับคีย์ API จาก [Moonshot AI](https://platform.moonshot.cn/)
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` ในสภาพแวดล้อมของ Gateway (สำหรับการติดตั้ง
    Gateway ให้เพิ่มลงใน `~/.openclaw/.env`) หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

การเลือก **Kimi** ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web`
จะแจ้งให้ระบุข้อมูลต่อไปนี้ด้วย:

- ภูมิภาคของ Moonshot API: `https://api.moonshot.ai/v1` หรือ `https://api.moonshot.cn/v1`
- โมเดลการค้นหาเว็บ (ค่าเริ่มต้นคือ `kimi-k2.6`)

## การกำหนดค่า

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // ไม่บังคับ หากตั้งค่า KIMI_API_KEY หรือ MOONSHOT_API_KEY ไว้
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

ระบบจะตรวจหา `tools.web.search.provider` โดยอัตโนมัติจากคีย์ API ที่มีอยู่เมื่อไม่ได้ระบุไว้
ให้ตั้งค่าเป็น `kimi` อย่างชัดเจนหากกำหนดข้อมูลประจำตัวสำหรับการค้นหาไว้หลายรายการ

กำหนดค่า `apiKey`, `baseUrl` และ `model` สำหรับ Kimi โดยเฉพาะภายใต้
`plugins.entries.moonshot.config.webSearch`

ค่าเริ่มต้น: `baseUrl` มีค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1` เมื่อไม่ได้ระบุ และ `model`
มีค่าเริ่มต้นเป็น `kimi-k2.6`

หากทราฟฟิกแชตใช้โฮสต์จีน (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) `web_search` ของ Kimi จะใช้โฮสต์นั้นโดยอัตโนมัติ
เมื่อไม่ได้ตั้งค่า `baseUrl` ของตัวเอง เพื่อไม่ให้คีย์ `.cn` ส่งคำขอไปยัง
เอนด์พอยต์สากลโดยไม่ตั้งใจ (ซึ่งจะส่งคืน HTTP 401 สำหรับคีย์เหล่านั้น) ตั้งค่า
`baseUrl` ของ Kimi อย่างชัดเจนเพื่อแทนที่การสืบทอดนี้

## ข้อกำหนดด้านการอ้างอิงข้อมูล

OpenClaw จะส่งคืนผลลัพธ์ `web_search` ของ Kimi หลังจากการตอบกลับของ Moonshot
มีหลักฐานการอ้างอิงข้อมูลจากการค้นหาเว็บแบบเนทีฟเท่านั้น เช่น การเล่นซ้ำการเรียกใช้เครื่องมือ
`$web_search`, `search_results` หรือ URL อ้างอิง หาก Kimi ตอบโดยตรงโดยไม่มี
การอ้างอิงข้อมูล (ตัวอย่างเช่น "ฉันไม่สามารถเรียกดูอินเทอร์เน็ตได้") OpenClaw จะส่งคืน
ข้อผิดพลาด `kimi_web_search_ungrounded` แทนที่จะถือว่าข้อความนั้นเป็นผลลัพธ์
การค้นหา ให้ลองส่งคำค้นอีกครั้ง เปลี่ยนไปใช้ผู้ให้บริการแบบมีโครงสร้าง เช่น Brave หรือใช้
`web_fetch` / เครื่องมือเบราว์เซอร์เมื่อมี URL เป้าหมายอยู่แล้ว

## พารามิเตอร์ของเครื่องมือ

| พารามิเตอร์                                                       | รองรับ                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | ใช่                                                                                                                      |
| `count`                                                         | ยอมรับเพื่อความเข้ากันได้ระหว่างผู้ให้บริการ แต่จะไม่ถูกนำมาใช้: Kimi จะส่งคืนคำตอบที่สังเคราะห์แล้วหนึ่งคำตอบเสมอ ไม่ใช่รายการผลลัพธ์ N รายการ |
| `country`, `language`, `freshness`, `date_after`, `date_before` | ไม่                                                                                                                       |

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) - ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Moonshot AI](/th/providers/moonshot) - เอกสารเกี่ยวกับโมเดล Moonshot และผู้ให้บริการ Kimi Coding
- [การค้นหาด้วย Gemini](/th/tools/gemini-search) - คำตอบที่ AI สังเคราะห์ผ่านการอ้างอิงข้อมูลของ Google
- [การค้นหาด้วย Grok](/th/tools/grok-search) - คำตอบที่ AI สังเคราะห์ผ่านการอ้างอิงข้อมูลของ xAI
