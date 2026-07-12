---
read_when:
    - คุณต้องการการดึงข้อมูลเว็บที่ใช้ Firecrawl เป็นระบบเบื้องหลัง
    - คุณต้องการใช้ Firecrawl `web_fetch` แบบไม่ใช้คีย์
    - คุณต้องมีคีย์ API ของ Firecrawl เพื่อใช้การค้นหาหรือเพิ่มขีดจำกัดการใช้งาน
    - คุณต้องการใช้ Firecrawl เป็นผู้ให้บริการ web_search
    - คุณต้องการการดึงข้อมูลที่หลีกเลี่ยงระบบป้องกันบอตสำหรับ web_fetch
summary: การค้นหาและดึงข้อมูลด้วย Firecrawl รวมถึงการใช้ `web_fetch` เป็นทางเลือกสำรอง
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T16:51:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw สามารถใช้ **Firecrawl** ได้สามวิธี:

- ใช้เป็นผู้ให้บริการ `web_search`
- ใช้เป็นเครื่องมือ Plugin แบบระบุโดยตรง ได้แก่ `firecrawl_search` และ `firecrawl_scrape`
- ใช้เป็นตัวแยกเนื้อหาสำรองสำหรับ `web_fetch`

Firecrawl เป็นบริการแยกเนื้อหาและค้นหาที่โฮสต์ไว้ ซึ่งรองรับการหลบเลี่ยงบอตและการแคช จึงช่วยจัดการเว็บไซต์ที่ใช้ JS มากหรือหน้าเว็บที่บล็อกการดึงข้อมูลผ่าน HTTP แบบทั่วไปได้

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## `web_fetch` แบบไม่ใช้คีย์และคีย์ API

ตัวสำรอง `web_fetch` ของ Firecrawl แบบโฮสต์ที่เลือกไว้อย่างชัดเจน รองรับการใช้งานระดับเริ่มต้นโดยไม่ต้องใช้คีย์ API เพิ่ม `FIRECRAWL_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าเมื่อคุณต้องการขีดจำกัดที่สูงขึ้น ส่วน `web_search` และ `firecrawl_scrape` ของ Firecrawl ต้องใช้คีย์ API

## กำหนดค่าการค้นหาด้วย Firecrawl

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

- การเลือก Firecrawl ระหว่างการเริ่มต้นใช้งานหรือผ่าน `openclaw configure --section web` จะเปิดใช้งาน Plugin Firecrawl ที่ติดตั้งไว้โดยอัตโนมัติ
- `web_search` ที่ใช้ Firecrawl รองรับ `query` และ `count`
- หากต้องการตัวควบคุมเฉพาะของ Firecrawl เช่น `sources`, `categories` หรือการดึงข้อมูลจากผลลัพธ์ ให้ใช้ `firecrawl_search`
- ค่าเริ่มต้นของ `baseUrl` คือ Firecrawl แบบโฮสต์ที่ `https://api.firecrawl.dev` อนุญาตให้กำหนดค่าทับด้วยบริการที่โฮสต์เองได้เฉพาะปลายทางส่วนตัวหรือภายในเท่านั้น และยอมรับ HTTP เฉพาะสำหรับเป้าหมายส่วนตัวเหล่านั้น
- `FIRECRAWL_BASE_URL` เป็นค่าสภาพแวดล้อมสำรองที่ใช้ร่วมกันสำหรับ URL ฐานของการค้นหาและการดึงข้อมูลด้วย Firecrawl
- คำขอค้นหาของ Firecrawl มีระยะหมดเวลาเริ่มต้น 30 วินาที ส่วนพารามิเตอร์ `timeoutSeconds` ของ `firecrawl_search` จะกำหนดค่าทับเป็นรายคำขอ

## กำหนดค่าตัวสำรอง `web_fetch` ของ Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // การเลือกอย่างชัดเจนจะเปิดใช้ตัวสำรองแบบไม่ใช้คีย์
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

- ตัวสำรอง `web_fetch` ของ Firecrawl ที่เลือกไว้อย่างชัดเจนทำงานได้โดยไม่ต้องใช้คีย์ API เมื่อกำหนดค่าแล้ว OpenClaw จะส่ง `plugins.entries.firecrawl.config.webFetch.apiKey` หรือ `FIRECRAWL_API_KEY` เพื่อใช้ขีดจำกัดที่สูงขึ้น
- การเลือก Firecrawl ระหว่างการเริ่มต้นใช้งานหรือผ่าน `openclaw configure --section web` จะเปิดใช้งาน Plugin และเลือก Firecrawl สำหรับ `web_fetch` เว้นแต่จะกำหนดค่าผู้ให้บริการดึงข้อมูลรายอื่นไว้แล้ว
- `firecrawl_scrape` ต้องใช้คีย์ API
- `maxAgeMs` ควบคุมอายุสูงสุดของผลลัพธ์ที่แคชไว้ (มิลลิวินาที) ค่าเริ่มต้นคือ 172,800,000 มิลลิวินาที (2 วัน)
- ค่าเริ่มต้นของ `onlyMainContent` คือ `true` และค่าเริ่มต้นของ `timeoutSeconds` คือ 60
- การกำหนดค่าแบบเดิม `tools.web.fetch.firecrawl.*` และ `tools.web.search.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
- การกำหนดค่าทับ URL สำหรับการดึงข้อมูลและ URL ฐานของ Firecrawl ใช้กฎบริการแบบโฮสต์/ส่วนตัวเดียวกับการค้นหา กล่าวคือ ทราฟฟิกสาธารณะแบบโฮสต์ใช้ `https://api.firecrawl.dev` ส่วนการกำหนดค่าทับด้วยบริการที่โฮสต์เองต้องชี้ไปยังปลายทางส่วนตัวหรือภายใน
- `firecrawl_scrape` จะปฏิเสธ URL เป้าหมายที่เห็นได้ชัดว่าเป็นแบบส่วนตัว, local loopback, เมทาดาทา หรือไม่ใช่ HTTP(S) ก่อนส่งต่อไปยัง Firecrawl ซึ่งสอดคล้องกับข้อกำหนดด้านความปลอดภัยของเป้าหมายใน `web_fetch` สำหรับการเรียกใช้การดึงข้อมูลด้วย Firecrawl แบบระบุโดยตรง

`firecrawl_scrape` ใช้การตั้งค่าและตัวแปรสภาพแวดล้อม `plugins.entries.firecrawl.config.webFetch.*` ชุดเดียวกันซ้ำ รวมถึงคีย์ API ที่จำเป็น

### Firecrawl ที่โฮสต์เอง

กำหนด `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` หรือ `FIRECRAWL_BASE_URL` เมื่อคุณเรียกใช้ Firecrawl ด้วยตนเอง OpenClaw ยอมรับ `http://` เฉพาะเป้าหมาย local loopback, เครือข่ายส่วนตัว, `.local`, `.internal` หรือ `.localhost` เท่านั้น ระบบจะปฏิเสธโฮสต์แบบกำหนดเองที่เป็นสาธารณะ เพื่อป้องกันไม่ให้คีย์ API ของ Firecrawl ถูกส่งไปยังปลายทางใด ๆ โดยไม่ตั้งใจ

## เครื่องมือ Plugin ของ Firecrawl

### `firecrawl_search`

ใช้เมื่อต้องการตัวควบคุมการค้นหาเฉพาะของ Firecrawl แทน `web_search` แบบทั่วไป

พารามิเตอร์:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

ใช้สำหรับหน้าเว็บที่ใช้ JS มากหรือมีการป้องกันบอต ซึ่ง `web_fetch` แบบทั่วไปทำงานได้ไม่ดี

พารามิเตอร์:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## การทำงานแบบซ่อนตัว / การหลบเลี่ยงบอต

ค่าเริ่มต้นของ `firecrawl_scrape` และตัวสำรอง Firecrawl สำหรับ `web_fetch` คือ `proxy: "auto"` ร่วมกับ `storeInCache: true` เว้นแต่ผู้เรียกจะกำหนดค่าทับพารามิเตอร์เหล่านั้น `firecrawl_search` และผู้ให้บริการ Firecrawl สำหรับ `web_search` ไม่มีตัวควบคุม `proxy`/`storeInCache` โดยโหมดพร็อกซีแบบซ่อนตัวจะมีผลกับคำขอดึงข้อมูลหรือดึงหน้าเว็บเท่านั้น

โหมด `proxy` ของ Firecrawl ควบคุมการหลบเลี่ยงบอต (`basic`, `stealth` หรือ `auto`) โดย `auto` จะลองใหม่ด้วยพร็อกซีแบบซ่อนตัวหากการลองแบบพื้นฐานล้มเหลว ซึ่งอาจใช้เครดิตมากกว่าการดึงข้อมูลแบบพื้นฐานเพียงอย่างเดียว

## วิธีที่ `web_fetch` ใช้ Firecrawl

ลำดับการแยกเนื้อหาของ `web_fetch`:

1. Readability (ภายในเครื่อง)
2. ผู้ให้บริการดึงข้อมูลที่กำหนดค่าไว้ เช่น Firecrawl (เมื่อถูกเลือกหรือตรวจพบโดยอัตโนมัติจากข้อมูลรับรองที่กำหนดค่าไว้)
3. การล้าง HTML ขั้นพื้นฐาน (ตัวสำรองสุดท้าย)

ตัวเลือกสำหรับการเลือกคือ `tools.web.fetch.provider` หากไม่ระบุ OpenClaw จะตรวจหาผู้ให้บริการดึงข้อมูลเว็บรายแรกที่พร้อมใช้งานโดยอัตโนมัติจากข้อมูลรับรองที่มีอยู่ Plugin Firecrawl อย่างเป็นทางการมีตัวสำรองนี้ให้

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [การดึงข้อมูลเว็บ](/th/tools/web-fetch) -- เครื่องมือ `web_fetch` พร้อมตัวสำรอง Firecrawl
- [Tavily](/th/tools/tavily) -- เครื่องมือค้นหาและแยกเนื้อหา
