---
read_when:
    - คุณต้องการการดึงข้อมูลจากเว็บที่รองรับด้วย Firecrawl
    - คุณต้องมีคีย์ API ของ Firecrawl
    - คุณต้องการใช้ Firecrawl เป็นผู้ให้บริการ web_search
    - คุณต้องการการดึงข้อมูลแบบป้องกันบอตสำหรับ web_fetch
summary: การค้นหา การสแครป และการถอยกลับไปใช้ web_fetch ของ Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T10:31:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw สามารถใช้ **Firecrawl** ได้สามวิธี:

- เป็นผู้ให้บริการ `web_search`
- เป็นเครื่องมือ Plugin แบบระบุชัด: `firecrawl_search` และ `firecrawl_scrape`
- เป็นตัวแยกข้อมูลสำรองสำหรับ `web_fetch`

Firecrawl เป็นบริการแยกข้อมูล/ค้นหาแบบโฮสต์ที่รองรับการหลบเลี่ยงบอตและการแคช
ซึ่งช่วยกับเว็บไซต์ที่ใช้ JS หนักหรือหน้าที่บล็อกการ fetch ผ่าน HTTP แบบธรรมดา

## รับ API key

1. สร้างบัญชี Firecrawl และสร้าง API key
2. เก็บไว้ในการกำหนดค่า หรือตั้งค่า `FIRECRAWL_API_KEY` ในสภาพแวดล้อมของ Gateway

## กำหนดค่าการค้นหาของ Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- การเลือก Firecrawl ในการเริ่มต้นใช้งานหรือ `openclaw configure --section web` จะเปิดใช้ Plugin Firecrawl ที่มาพร้อมกับระบบโดยอัตโนมัติ
- `web_search` ที่ใช้ Firecrawl รองรับ `query` และ `count`
- สำหรับการควบคุมเฉพาะของ Firecrawl เช่น `sources`, `categories` หรือการ scrape ผลลัพธ์ ให้ใช้ `firecrawl_search`
- ค่าเริ่มต้นของ `baseUrl` คือ Firecrawl แบบโฮสต์ที่ `https://api.firecrawl.dev` การ override แบบ self-hosted อนุญาตเฉพาะสำหรับ endpoint ส่วนตัว/ภายในเท่านั้น; HTTP จะยอมรับเฉพาะสำหรับเป้าหมายส่วนตัวเหล่านั้น
- `FIRECRAWL_BASE_URL` เป็น env สำรองร่วมสำหรับ URL ฐานของการค้นหาและการ scrape ของ Firecrawl

## กำหนดค่า Firecrawl scrape + ตัวสำรองของ web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

หมายเหตุ:

- ความพยายามใช้ Firecrawl เป็นตัวสำรองจะทำงานเฉพาะเมื่อมี API key (`plugins.entries.firecrawl.config.webFetch.apiKey` หรือ `FIRECRAWL_API_KEY`)
- `maxAgeMs` ควบคุมว่าผลลัพธ์ที่แคชไว้มีอายุได้มากเท่าไร (มิลลิวินาที) ค่าเริ่มต้นคือ 2 วัน
- การกำหนดค่าเก่า `tools.web.fetch.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
- การ override URL สำหรับ Firecrawl scrape/base ใช้กฎแบบโฮสต์/ส่วนตัวเดียวกับการค้นหา: ทราฟฟิกแบบโฮสต์สาธารณะใช้ `https://api.firecrawl.dev`; การ override แบบ self-hosted ต้อง resolve ไปยัง endpoint ส่วนตัว/ภายใน
- `firecrawl_scrape` จะปฏิเสธ URL เป้าหมายที่เห็นได้ชัดว่าเป็นส่วนตัว, loopback, metadata และไม่ใช่ HTTP(S) ก่อนส่งต่อไปยัง Firecrawl โดยตรงตามสัญญาความปลอดภัยของเป้าหมาย `web_fetch` สำหรับการเรียก Firecrawl scrape แบบระบุชัด

`firecrawl_scrape` ใช้การตั้งค่าและ env vars ชุดเดียวกันจาก `plugins.entries.firecrawl.config.webFetch.*`

### Firecrawl แบบ self-hosted

ตั้งค่า `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` หรือ `FIRECRAWL_BASE_URL`
เมื่อคุณรัน Firecrawl เอง OpenClaw ยอมรับ `http://` เฉพาะสำหรับเป้าหมาย loopback,
เครือข่ายส่วนตัว, `.local`, `.internal` หรือ `.localhost` เท่านั้น โฮสต์แบบกำหนดเองสาธารณะ
จะถูกปฏิเสธเพื่อไม่ให้ API key ของ Firecrawl ถูกส่งไปยัง endpoint ใด ๆ โดย
ไม่ตั้งใจ

## เครื่องมือ Plugin ของ Firecrawl

### `firecrawl_search`

ใช้รายการนี้เมื่อคุณต้องการการควบคุมการค้นหาเฉพาะของ Firecrawl แทน `web_search` ทั่วไป

พารามิเตอร์หลัก:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

ใช้รายการนี้สำหรับหน้าที่ใช้ JS หนักหรือมีการป้องกันบอต ซึ่ง `web_fetch` แบบธรรมดายังทำงานได้ไม่ดี

พารามิเตอร์หลัก:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / การหลบเลี่ยงบอต

Firecrawl เปิดเผยพารามิเตอร์ **โหมดพร็อกซี** สำหรับการหลบเลี่ยงบอต (`basic`, `stealth` หรือ `auto`)
OpenClaw ใช้ `proxy: "auto"` พร้อมกับ `storeInCache: true` สำหรับคำขอ Firecrawl เสมอ
หากละเว้น proxy Firecrawl จะใช้ค่าเริ่มต้นเป็น `auto` `auto` จะลองซ้ำด้วยพร็อกซี stealth หากความพยายามแบบ basic ล้มเหลว ซึ่งอาจใช้เครดิตมากกว่า
การ scrape แบบ basic เท่านั้น

## `web_fetch` ใช้ Firecrawl อย่างไร

ลำดับการแยกข้อมูลของ `web_fetch`:

1. Readability (ภายในเครื่อง)
2. Firecrawl (หากเลือกไว้หรือถูกตรวจพบอัตโนมัติว่าเป็นตัวสำรอง web-fetch ที่ใช้งานอยู่)
3. การล้าง HTML แบบพื้นฐาน (ตัวสำรองสุดท้าย)

ตัวเลือกสำหรับการเลือกคือ `tools.web.fetch.provider` หากคุณละเว้น OpenClaw
จะตรวจพบผู้ให้บริการ web-fetch รายแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีอยู่โดยอัตโนมัติ
ปัจจุบันผู้ให้บริการที่มาพร้อมกับระบบคือ Firecrawl

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจพบอัตโนมัติ
- [Web Fetch](/th/tools/web-fetch) -- เครื่องมือ web_fetch พร้อมตัวสำรอง Firecrawl
- [Tavily](/th/tools/tavily) -- เครื่องมือค้นหา + แยกข้อมูล
