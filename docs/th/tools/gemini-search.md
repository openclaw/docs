---
read_when:
    - คุณต้องการใช้ Gemini สำหรับ web_search
    - คุณต้องมี GEMINI_API_KEY หรือ models.providers.google.apiKey
    - คุณต้องการใช้ข้อมูลอ้างอิงจาก Google Search
summary: การค้นหาเว็บของ Gemini พร้อมการยึดโยงด้วย Google Search
title: การค้นหา Gemini
x-i18n:
    generated_at: "2026-05-02T10:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw รองรับโมเดล Gemini พร้อม
[การยึดโยงกับ Google Search ในตัว](https://ai.google.dev/gemini-api/docs/grounding)
ซึ่งส่งคืนคำตอบที่ AI สังเคราะห์ขึ้นโดยอ้างอิงผลลัพธ์ Google Search แบบสดพร้อม
การอ้างอิงแหล่งที่มา

## รับคีย์ API

<Steps>
  <Step title="Create a key">
    ไปที่ [Google AI Studio](https://aistudio.google.com/apikey) แล้วสร้าง
    คีย์ API
  </Step>
  <Step title="Store the key">
    ตั้งค่า `GEMINI_API_KEY` ในสภาพแวดล้อมของ Gateway, ใช้
    `models.providers.google.apiKey` ซ้ำ, หรือกำหนดค่าคีย์สำหรับค้นหาเว็บโดยเฉพาะผ่าน:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
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

**ลำดับความสำคัญของข้อมูลรับรอง:** การค้นหาเว็บของ Gemini ใช้
`plugins.entries.google.config.webSearch.apiKey` ก่อน จากนั้นจึงใช้ `GEMINI_API_KEY`
แล้วจึงใช้ `models.providers.google.apiKey` สำหรับ URL ฐาน ค่า
`plugins.entries.google.config.webSearch.baseUrl` ที่กำหนดไว้โดยเฉพาะจะมีผลก่อน
`models.providers.google.baseUrl`

สำหรับการติดตั้ง Gateway ให้วางคีย์สภาพแวดล้อมไว้ใน `~/.openclaw/.env`

## วิธีการทำงาน

ต่างจากผู้ให้บริการค้นหาแบบดั้งเดิมที่ส่งคืนรายการลิงก์และข้อความตัวอย่าง
Gemini ใช้การยึดโยงกับ Google Search เพื่อสร้างคำตอบที่ AI สังเคราะห์ขึ้นพร้อม
การอ้างอิงแหล่งที่มาแบบอินไลน์ ผลลัพธ์มีทั้งคำตอบที่สังเคราะห์ขึ้นและ URL
ของแหล่งที่มา

- URL การอ้างอิงจากการยึดโยงของ Gemini จะถูกแปลงจาก URL เปลี่ยนเส้นทางของ Google
  เป็น URL โดยตรงโดยอัตโนมัติ
- การแปลงการเปลี่ยนเส้นทางใช้เส้นทางป้องกัน SSRF (HEAD + การตรวจสอบการเปลี่ยนเส้นทาง +
  การตรวจสอบ http/https) ก่อนส่งคืน URL การอ้างอิงสุดท้าย
- การแปลงการเปลี่ยนเส้นทางใช้ค่าเริ่มต้น SSRF ที่เข้มงวด ดังนั้นการเปลี่ยนเส้นทางไปยัง
  เป้าหมายส่วนตัว/ภายในจะถูกบล็อก

## พารามิเตอร์ที่รองรับ

การค้นหาของ Gemini รองรับ `query`, `freshness`, `date_after`, และ `date_before`

`count` ได้รับการยอมรับเพื่อความเข้ากันได้กับ `web_search` ที่ใช้ร่วมกัน แต่การยึดโยงของ Gemini
ยังคงส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการพร้อมการอ้างอิงแหล่งที่มา แทนที่จะเป็น
รายการผลลัพธ์จำนวน N รายการ

`freshness` รองรับ `day`, `week`, `month`, `year`, และทางลัดที่ใช้ร่วมกัน
`pd`, `pw`, `pm`, และ `py` OpenClaw จะแปลงค่าเหล่านี้ หรือช่วง
`date_after`/`date_before` ที่ระบุชัดเจน ให้เป็น
`timeRangeFilter` ของการยึดโยงกับ Google Search ของ Gemini ไม่รองรับ `country`, `language`, และ `domain_filter`

## การเลือกโมเดล

โมเดลเริ่มต้นคือ `gemini-2.5-flash` (รวดเร็วและคุ้มค่า) สามารถใช้โมเดล Gemini
ใดก็ได้ที่รองรับการยึดโยงผ่าน
`plugins.entries.google.config.webSearch.model`

## การแทนที่ URL ฐาน

ตั้งค่า `plugins.entries.google.config.webSearch.baseUrl` เมื่อการค้นหาเว็บของ Gemini
ต้องกำหนดเส้นทางผ่านพร็อกซีของผู้ปฏิบัติงานหรือปลายทางที่เข้ากันได้กับ Gemini แบบกำหนดเอง หาก
ไม่ได้ตั้งค่านี้ การค้นหาเว็บของ Gemini จะใช้ `models.providers.google.baseUrl` ซ้ำ ค่า
`https://generativelanguage.googleapis.com` แบบธรรมดาจะถูกปรับให้เป็น
`https://generativelanguage.googleapis.com/v1beta`; เส้นทางพร็อกซีแบบกำหนดเองจะคงไว้
ตามที่ระบุหลังจากตัดเครื่องหมายทับท้ายออก

## ที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมข้อความตัวอย่าง
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้าง + การสกัดเนื้อหา
