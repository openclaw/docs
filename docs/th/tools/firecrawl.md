---
read_when:
    - คุณต้องการการดึงข้อมูลเว็บที่รองรับด้วย Firecrawl
    - คุณต้องการ Firecrawl web_fetch แบบไม่ใช้คีย์
    - คุณต้องมีคีย์ API ของ Firecrawl สำหรับการค้นหาหรือขีดจำกัดที่สูงขึ้น
    - คุณต้องการ Firecrawl เป็นผู้ให้บริการ web_search
    - คุณต้องการการดึงข้อมูลแบบต้านบอตสำหรับ web_fetch
summary: การค้นหา การสเครป และ fallback ของ web_fetch สำหรับ Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:27:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw สามารถใช้ **Firecrawl** ได้สามวิธี:

- เป็นผู้ให้บริการ `web_search`
- เป็นเครื่องมือ Plugin แบบระบุชัดเจน: `firecrawl_search` และ `firecrawl_scrape`
- เป็นตัวแยกข้อมูลสำรองสำหรับ `web_fetch`

นี่คือบริการค้นหา/แยกข้อมูลแบบโฮสต์ที่รองรับการหลบเลี่ยงบอตและการแคช
ซึ่งช่วยกับไซต์ที่ใช้ JS หนักหรือหน้าที่บล็อกการดึงข้อมูล HTTP แบบธรรมดา

## ติดตั้ง Plugin

ติดตั้ง Plugin ทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch แบบไม่ต้องใช้คีย์และ API keys

ตัวสำรอง `web_fetch` ของ Firecrawl แบบโฮสต์ที่เลือกไว้อย่างชัดเจนรองรับการเข้าถึงระดับเริ่มต้น
โดยไม่ต้องใช้ API key เพิ่ม `FIRECRAWL_API_KEY` ในสภาพแวดล้อมของ Gateway
หรือกำหนดค่าเมื่อคุณต้องการขีดจำกัดที่สูงขึ้น Firecrawl `web_search` และ
`firecrawl_scrape` ต้องใช้ API key

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

- การเลือก Firecrawl ในขั้นตอนเริ่มต้นใช้งานหรือ `openclaw configure --section web` จะเปิดใช้ Firecrawl Plugin ที่ติดตั้งไว้โดยอัตโนมัติ
- `web_search` ที่ใช้ Firecrawl รองรับ `query` และ `count`
- สำหรับการควบคุมเฉพาะของ Firecrawl เช่น `sources`, `categories` หรือการ scrape ผลลัพธ์ ให้ใช้ `firecrawl_search`
- ค่าเริ่มต้นของ `baseUrl` คือ Firecrawl แบบโฮสต์ที่ `https://api.firecrawl.dev` อนุญาตให้แทนที่ด้วยแบบ self-hosted ได้เฉพาะสำหรับปลายทางส่วนตัว/ภายในเท่านั้น และยอมรับ HTTP เฉพาะสำหรับเป้าหมายส่วนตัวเหล่านั้น
- `FIRECRAWL_BASE_URL` คือ env สำรองร่วมสำหรับ URL ฐานของการค้นหาและการ scrape ของ Firecrawl

## กำหนดค่าตัวสำรอง Firecrawl web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- ตัวสำรอง Firecrawl `web_fetch` ที่เลือกไว้อย่างชัดเจนทำงานได้โดยไม่ต้องใช้ API key เมื่อกำหนดค่าแล้ว OpenClaw จะส่ง `plugins.entries.firecrawl.config.webFetch.apiKey` หรือ `FIRECRAWL_API_KEY` สำหรับขีดจำกัดที่สูงขึ้น
- การเลือก Firecrawl ระหว่างขั้นตอนเริ่มต้นใช้งานหรือ `openclaw configure --section web` จะเปิดใช้ Plugin และเลือก Firecrawl สำหรับ `web_fetch` เว้นแต่ว่ามีผู้ให้บริการ fetch รายอื่นกำหนดค่าไว้แล้ว
- `firecrawl_scrape` ต้องใช้ API key
- `maxAgeMs` ควบคุมว่าผลลัพธ์ที่แคชไว้เก่าได้แค่ไหน (มิลลิวินาที) ค่าเริ่มต้นคือ 2 วัน
- การกำหนดค่า legacy `tools.web.fetch.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
- การแทนที่ URL ของ Firecrawl scrape/base ใช้กฎโฮสต์/ส่วนตัวเดียวกับการค้นหา: ทราฟฟิกโฮสต์สาธารณะใช้ `https://api.firecrawl.dev`; การแทนที่แบบ self-hosted ต้อง resolve ไปยังปลายทางส่วนตัว/ภายใน
- `firecrawl_scrape` ปฏิเสธ URL เป้าหมายที่เห็นได้ชัดว่าเป็นส่วนตัว, loopback, metadata และไม่ใช่ HTTP(S) ก่อนส่งต่อไปยัง Firecrawl ให้ตรงกับสัญญาความปลอดภัยของเป้าหมาย `web_fetch` สำหรับการเรียก Firecrawl scrape แบบระบุชัดเจน

`firecrawl_scrape` ใช้การตั้งค่า `plugins.entries.firecrawl.config.webFetch.*` และ env vars เดียวกันซ้ำ รวมถึง API key ที่จำเป็น

### Firecrawl แบบ self-hosted

ตั้งค่า `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` หรือ `FIRECRAWL_BASE_URL`
เมื่อคุณรัน Firecrawl เอง OpenClaw ยอมรับ `http://` เฉพาะสำหรับเป้าหมาย loopback,
เครือข่ายส่วนตัว, `.local`, `.internal` หรือ `.localhost` เท่านั้น โฮสต์แบบกำหนดเองสาธารณะ
จะถูกปฏิเสธ เพื่อไม่ให้ Firecrawl API keys ถูกส่งไปยังปลายทางใดๆ โดยไม่ตั้งใจ

## เครื่องมือ Firecrawl Plugin

### `firecrawl_search`

ใช้สิ่งนี้เมื่อคุณต้องการการควบคุมการค้นหาเฉพาะของ Firecrawl แทน `web_search` ทั่วไป

พารามิเตอร์หลัก:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

ใช้สิ่งนี้กับหน้าที่ใช้ JS หนักหรือป้องกันบอต ซึ่ง `web_fetch` แบบธรรมดาทำงานได้ไม่ดี

พารามิเตอร์หลัก:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## โหมดล่องหน / การหลบเลี่ยงบอต

Firecrawl เปิดเผยพารามิเตอร์ **proxy mode** สำหรับการหลบเลี่ยงบอต (`basic`, `stealth` หรือ `auto`)
OpenClaw ใช้ `proxy: "auto"` พร้อมกับ `storeInCache: true` เสมอสำหรับคำขอ Firecrawl
หากละ `proxy` ไว้ Firecrawl จะใช้ค่าเริ่มต้นเป็น `auto` `auto` จะลองใหม่ด้วยพร็อกซี stealth หากความพยายามแบบ basic ล้มเหลว ซึ่งอาจใช้เครดิตมากกว่า
การ scrape แบบ basic-only

## `web_fetch` ใช้ Firecrawl อย่างไร

ลำดับการแยกข้อมูลของ `web_fetch`:

1. Readability (ภายในเครื่อง)
2. Firecrawl (เมื่อเลือกไว้ หรือเมื่อตรวจพบอัตโนมัติจากข้อมูลรับรองที่กำหนดค่าไว้)
3. การล้าง HTML ขั้นพื้นฐาน (ตัวสำรองสุดท้าย)

ปุ่มเลือกคือ `tools.web.fetch.provider` หากคุณละไว้ OpenClaw
จะตรวจหาผู้ให้บริการ web-fetch รายแรกที่พร้อมใช้งานโดยอัตโนมัติจากข้อมูลรับรองที่มี
Firecrawl Plugin ทางการเป็นผู้จัดเตรียมตัวสำรองนั้น

## ที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Web Fetch](/th/tools/web-fetch) -- เครื่องมือ web_fetch พร้อมตัวสำรอง Firecrawl
- [Tavily](/th/tools/tavily) -- เครื่องมือค้นหา + แยกข้อมูล
