---
read_when:
    - คุณต้องการใช้ Gemini สำหรับ web_search
    - คุณต้องมี `GEMINI_API_KEY` หรือ `models.providers.google.apiKey`
    - คุณต้องการการยึดโยงข้อมูลด้วย Google Search
summary: การค้นหาเว็บด้วย Gemini โดยอ้างอิงข้อมูลจาก Google Search
title: การค้นหาด้วย Gemini
x-i18n:
    generated_at: "2026-07-12T16:48:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw รองรับโมเดล Gemini พร้อม
[การเชื่อมโยงข้อมูลกับ Google Search](https://ai.google.dev/gemini-api/docs/grounding)
ในตัว ซึ่งส่งคืนคำตอบที่ AI สังเคราะห์ขึ้นโดยอ้างอิงผลลัพธ์สดจาก Google Search
พร้อมการอ้างอิงแหล่งที่มา

## รับคีย์ API

<Steps>
  <Step title="สร้างคีย์">
    ไปที่ [Google AI Studio](https://aistudio.google.com/apikey) แล้วสร้าง
    คีย์ API
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `GEMINI_API_KEY` ในสภาพแวดล้อมของ Gateway ใช้
    `models.providers.google.apiKey` ซ้ำ หรือกำหนดค่าคีย์เฉพาะสำหรับการค้นหาเว็บผ่าน:

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // ไม่บังคับ หากตั้งค่า GEMINI_API_KEY หรือ models.providers.google.apiKey ไว้แล้ว
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // ไม่บังคับ หากไม่กำหนดจะใช้ models.providers.google.baseUrl
            model: "gemini-2.5-flash", // ค่าเริ่มต้น
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**ลำดับความสำคัญของข้อมูลประจำตัว:** การค้นหาเว็บด้วย Gemini จะใช้
`plugins.entries.google.config.webSearch.apiKey` ก่อน ตามด้วย `GEMINI_API_KEY`
และ `models.providers.google.apiKey` ตามลำดับ สำหรับ URL ฐาน
`plugins.entries.google.config.webSearch.baseUrl` ที่กำหนดไว้โดยเฉพาะจะมีลำดับความสำคัญเหนือ
`models.providers.google.baseUrl`

สำหรับการติดตั้ง Gateway ให้ใส่คีย์สภาพแวดล้อมไว้ใน `~/.openclaw/.env`

## หลักการทำงาน

ต่างจากผู้ให้บริการค้นหาแบบดั้งเดิมที่ส่งคืนรายการลิงก์และข้อความตัวอย่าง
Gemini ใช้การเชื่อมโยงข้อมูลกับ Google Search เพื่อสร้างคำตอบที่ AI สังเคราะห์ขึ้น
พร้อมการอ้างอิงภายในข้อความ ผลลัพธ์ประกอบด้วยทั้งคำตอบที่สังเคราะห์ขึ้นและ URL
ของแหล่งข้อมูล

- URL การอ้างอิงจากการเชื่อมโยงข้อมูลของ Gemini จะถูกแปลงจาก URL
  เปลี่ยนเส้นทางของ Google เป็น URL โดยตรงโดยอัตโนมัติ ผ่านคำขอ HEAD ที่ใช้เส้นทาง
  ดึงข้อมูลซึ่งมีการป้องกัน SSRF ของ OpenClaw (ติดตามการเปลี่ยนเส้นทางและตรวจสอบ http/https)
- การแปลง URL เปลี่ยนเส้นทางใช้ค่าเริ่มต้น SSRF ที่เข้มงวด ดังนั้นการเปลี่ยนเส้นทางไปยัง
  เป้าหมายส่วนตัวหรือภายในจะถูกบล็อก

## พารามิเตอร์ที่รองรับ

การค้นหาด้วย Gemini รองรับ `query`, `freshness`, `date_after` และ `date_before`

ระบบยอมรับ `count` เพื่อให้เข้ากันได้กับ `web_search` ที่ใช้ร่วมกัน แต่การเชื่อมโยงข้อมูล
ของ Gemini ยังคงส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการพร้อมการอ้างอิง แทนที่จะเป็น
รายการผลลัพธ์จำนวน N รายการ

`freshness` ยอมรับ `day`, `week`, `month`, `year` และรูปแบบย่อที่ใช้ร่วมกัน ได้แก่
`pd`, `pw`, `pm` และ `py` โดย `day`/`pd` จะเพิ่มคำสั่งให้เน้นความใหม่ลงในคำค้นหา
Gemini แทนการกำหนดช่วงเวลา 24 ชั่วโมงแบบตายตัว ส่วน `week`, `month`, `year`
และช่วง `date_after`/`date_before` ที่ระบุอย่างชัดเจนจะตั้งค่า
`timeRangeFilter` ของการเชื่อมโยงข้อมูลกับ Google Search ของ Gemini
ระบบไม่รองรับ `country`, `language` และ `domain_filter`

## การเลือกโมเดล

โมเดลเริ่มต้นคือ `gemini-2.5-flash` (รวดเร็วและคุ้มค่า) สามารถใช้โมเดล Gemini
ใดก็ได้ที่รองรับการเชื่อมโยงข้อมูลผ่าน
`plugins.entries.google.config.webSearch.model`

## การแทนที่ URL ฐาน

ตั้งค่า `plugins.entries.google.config.webSearch.baseUrl` เมื่อการค้นหาเว็บด้วย Gemini
ต้องกำหนดเส้นทางผ่านพร็อกซีของผู้ดูแลระบบหรือปลายทางแบบกำหนดเองที่เข้ากันได้กับ Gemini
หากไม่ได้ตั้งค่าไว้ การค้นหาเว็บด้วย Gemini จะใช้ `models.providers.google.baseUrl`
ซ้ำ ค่า `https://generativelanguage.googleapis.com` แบบไม่มีพาธจะถูกปรับให้อยู่ในรูป
`https://generativelanguage.googleapis.com/v1beta` ส่วนพาธพร็อกซีแบบกำหนดเองจะคงไว้
ตามที่ระบุหลังจากตัดเครื่องหมายทับท้ายออก

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมข้อความตัวอย่าง
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการแยกเนื้อหา
