---
read_when:
    - คุณต้องการใช้ Gemini สำหรับ web_search
    - คุณต้องมี GEMINI_API_KEY หรือ models.providers.google.apiKey
    - คุณต้องการการอ้างอิงพื้นฐานจาก Google Search
summary: การค้นหาเว็บของ Gemini พร้อมการยึดโยงกับ Google Search
title: การค้นหา Gemini
x-i18n:
    generated_at: "2026-06-27T18:28:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw รองรับโมเดล Gemini พร้อม
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
ในตัว ซึ่งส่งคืนคำตอบที่ AI สังเคราะห์โดยอ้างอิงจากผลลัพธ์ Google Search แบบสดพร้อม
การอ้างอิง

## รับคีย์ API

<Steps>
  <Step title="สร้างคีย์">
    ไปที่ [Google AI Studio](https://aistudio.google.com/apikey) แล้วสร้าง
    คีย์ API
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `GEMINI_API_KEY` ในสภาพแวดล้อมของ Gateway ใช้
    `models.providers.google.apiKey` ซ้ำ หรือกำหนดค่าคีย์สำหรับการค้นหาเว็บโดยเฉพาะผ่าน:

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

**ลำดับความสำคัญของข้อมูลประจำตัว:** การค้นหาเว็บของ Gemini ใช้
`plugins.entries.google.config.webSearch.apiKey` ก่อน จากนั้นจึงใช้ `GEMINI_API_KEY`
แล้วจึงใช้ `models.providers.google.apiKey` สำหรับ URL พื้นฐาน ค่าเฉพาะ
`plugins.entries.google.config.webSearch.baseUrl` จะมีผลก่อน
`models.providers.google.baseUrl`

สำหรับการติดตั้ง Gateway ให้วางคีย์สภาพแวดล้อมไว้ใน `~/.openclaw/.env`

## วิธีการทำงาน

ต่างจากผู้ให้บริการค้นหาแบบดั้งเดิมที่ส่งคืนรายการลิงก์และข้อความตัวอย่าง
Gemini ใช้ Google Search grounding เพื่อสร้างคำตอบที่ AI สังเคราะห์พร้อม
การอ้างอิงแบบอินไลน์ ผลลัพธ์มีทั้งคำตอบที่สังเคราะห์แล้วและ URL แหล่งที่มา

- URL การอ้างอิงจาก Gemini grounding จะถูกแปลงจาก URL เปลี่ยนเส้นทางของ Google
  เป็น URL โดยตรงโดยอัตโนมัติ
- การแปลงการเปลี่ยนเส้นทางใช้เส้นทางป้องกัน SSRF (HEAD + การตรวจสอบการเปลี่ยนเส้นทาง +
  การตรวจสอบ http/https) ก่อนส่งคืน URL การอ้างอิงสุดท้าย
- การแปลงการเปลี่ยนเส้นทางใช้ค่าเริ่มต้น SSRF แบบเข้มงวด ดังนั้นการเปลี่ยนเส้นทางไปยัง
  เป้าหมายส่วนตัว/ภายในจะถูกบล็อก

## พารามิเตอร์ที่รองรับ

การค้นหา Gemini รองรับ `query`, `freshness`, `date_after` และ `date_before`

`count` รองรับเพื่อความเข้ากันได้กับ `web_search` ที่ใช้ร่วมกัน แต่ Gemini grounding
ยังคงส่งคืนคำตอบที่สังเคราะห์หนึ่งรายการพร้อมการอ้างอิง แทนที่จะเป็นรายการผลลัพธ์ N รายการ

`freshness` รองรับ `day`, `week`, `month`, `year` และชอร์ตคัตที่ใช้ร่วมกัน
`pd`, `pw`, `pm` และ `py` `day`/`pd` จะเพิ่มคำสั่งความใหม่ให้กับ query ของ Gemini
แทนช่วงเวลา 24 ชั่วโมงแบบตายตัว `week`, `month`, `year` และช่วง
`date_after`/`date_before` ที่ระบุชัดเจนจะตั้งค่า
`timeRangeFilter` ของ Google Search grounding ของ Gemini ไม่รองรับ `country`, `language` และ `domain_filter`

## การเลือกโมเดล

โมเดลเริ่มต้นคือ `gemini-2.5-flash` (รวดเร็วและคุ้มค่า) สามารถใช้โมเดล Gemini
ใดก็ได้ที่รองรับ grounding ผ่าน
`plugins.entries.google.config.webSearch.model`

## การแทนที่ URL พื้นฐาน

ตั้งค่า `plugins.entries.google.config.webSearch.baseUrl` เมื่อการค้นหาเว็บของ Gemini
ต้องกำหนดเส้นทางผ่านพร็อกซีของผู้ปฏิบัติการหรือปลายทางแบบกำหนดเองที่เข้ากันได้กับ Gemini หาก
ไม่ได้ตั้งค่าไว้ การค้นหาเว็บของ Gemini จะใช้ `models.providers.google.baseUrl` ซ้ำ ค่า
`https://generativelanguage.googleapis.com` แบบธรรมดาจะถูกทำให้เป็น
`https://generativelanguage.googleapis.com/v1beta`; เส้นทางพร็อกซีแบบกำหนดเองจะถูกเก็บไว้
ตามที่ระบุหลังจากตัดเครื่องหมายทับท้ายออก

## ที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมข้อความตัวอย่าง
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้าง + การดึงเนื้อหา
