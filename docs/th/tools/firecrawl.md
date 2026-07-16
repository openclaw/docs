---
read_when:
    - คุณต้องการการดึงข้อมูลเว็บที่ทำงานด้วย Firecrawl
    - คุณต้องการใช้ Firecrawl Search แบบไม่ใช้คีย์ (ฟรี) หรือ web_fetch แบบไม่ใช้คีย์
    - คุณต้องใช้คีย์ Firecrawl API สำหรับการค้นหาหรือขีดจำกัดที่สูงขึ้น
    - คุณต้องการใช้ Firecrawl เป็นผู้ให้บริการ web_search
    - คุณต้องการการดึงข้อมูลที่หลีกเลี่ยงระบบป้องกันบอตสำหรับ web_fetch
summary: การค้นหาและดึงข้อมูลด้วย Firecrawl รวมถึงการสำรองไปใช้ web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T19:50:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw สามารถใช้ **Firecrawl** ได้สามวิธี:

- เป็นผู้ให้บริการ `web_search`
- เป็นเครื่องมือ Plugin ที่เรียกใช้โดยตรง: `firecrawl_search` และ `firecrawl_scrape`
- เป็นตัวแยกข้อมูลสำรองสำหรับ `web_fetch`

บริการนี้เป็นบริการแยกข้อมูล/ค้นหาแบบโฮสต์ ซึ่งรองรับการหลบเลี่ยงบอตและการแคช จึงช่วยจัดการเว็บไซต์ที่ใช้ JS อย่างหนักหรือหน้าที่บล็อกการดึงข้อมูลผ่าน HTTP แบบปกติ

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## การเข้าถึงแบบไม่ใช้คีย์และคีย์ API

Firecrawl ลงทะเบียนผู้ให้บริการ `web_search` สองราย:

- **Firecrawl Search** (`firecrawl`) — ใช้ API `/v2/search` แบบโฮสต์ร่วมกับ
  คีย์ของคุณ และจะตรวจพบโดยอัตโนมัติเมื่อมีคีย์
- **Firecrawl Search (Free)** (`firecrawl-free`) — ใช้แพ็กเกจเริ่มต้นแบบโฮสต์ที่ไม่ต้องใช้คีย์
  โดยไม่ต้องมีคีย์ API ตัวเลือกนี้ **ต้องเลือกใช้โดยชัดแจ้งเท่านั้น** และจะไม่ถูกเลือกโดยอัตโนมัติ เนื่องจาก
  การเลือกตัวเลือกนี้จะส่งคำค้นหาของคุณไปยังแพ็กเกจฟรีของ Firecrawl

ตัวสำรอง `web_fetch` ของ Firecrawl ที่เลือกไว้อย่างชัดแจ้งก็ไม่ต้องใช้คีย์เช่นกัน ส่วนเครื่องมือ `firecrawl_search` และ `firecrawl_scrape` ที่เรียกใช้โดยตรงต้องใช้คีย์ API เพิ่ม
`FIRECRAWL_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าเพื่อรับขีดจำกัดที่สูงขึ้น

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

- การเลือก Firecrawl ระหว่างการเริ่มต้นใช้งานหรือ `openclaw configure --section web` จะเปิดใช้ Plugin Firecrawl ที่ติดตั้งไว้โดยอัตโนมัติ
- เลือก **Firecrawl Search (Free)** ระหว่างการเริ่มต้นใช้งาน (หรือตั้งค่า `provider: "firecrawl-free"`) เพื่อทำงานแบบไม่ใช้คีย์โดยไม่ต้องมีคีย์ API ผู้ให้บริการ **Firecrawl Search** แบบใช้คีย์จะส่ง `plugins.entries.firecrawl.config.webSearch.apiKey` หรือ `FIRECRAWL_API_KEY`
- `web_search` ที่ใช้ร่วมกับ Firecrawl รองรับ `query` และ `count`
- สำหรับการควบคุมเฉพาะของ Firecrawl เช่น `sources`, `categories` หรือการดึงข้อมูลจากผลลัพธ์ ให้ใช้ `firecrawl_search`
- `baseUrl` มีค่าเริ่มต้นเป็น Firecrawl แบบโฮสต์ที่ `https://api.firecrawl.dev` อนุญาตให้แทนที่ด้วยระบบที่โฮสต์เองได้เฉพาะปลายทางส่วนตัว/ภายในเท่านั้น และยอมรับ HTTP เฉพาะเป้าหมายส่วนตัวเหล่านั้น
- `FIRECRAWL_BASE_URL` เป็นค่าทดแทนจากตัวแปรสภาพแวดล้อมที่ใช้ร่วมกันสำหรับ URL ฐานของการค้นหาและการดึงข้อมูลด้วย Firecrawl
- คำขอค้นหาของ Firecrawl มีระยะหมดเวลาเริ่มต้น 30 วินาที โดยพารามิเตอร์ `timeoutSeconds` ของ `firecrawl_search` จะแทนที่ค่านี้สำหรับแต่ละการเรียกใช้

## กำหนดค่าตัวสำรอง Firecrawl สำหรับ web_fetch

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

- ตัวสำรอง `web_fetch` ของ Firecrawl ที่เลือกไว้อย่างชัดแจ้งทำงานได้โดยไม่ต้องใช้คีย์ API เมื่อกำหนดค่าแล้ว OpenClaw จะส่ง `plugins.entries.firecrawl.config.webFetch.apiKey` หรือ `FIRECRAWL_API_KEY` เพื่อรับขีดจำกัดที่สูงขึ้น
- การเลือก Firecrawl ระหว่างการเริ่มต้นใช้งานหรือ `openclaw configure --section web` จะเปิดใช้ Plugin และเลือก Firecrawl สำหรับ `web_fetch` เว้นแต่จะกำหนดค่าผู้ให้บริการดึงข้อมูลรายอื่นไว้แล้ว
- `firecrawl_scrape` ต้องใช้คีย์ API
- `maxAgeMs` ควบคุมอายุสูงสุดของผลลัพธ์ที่แคชไว้ (มิลลิวินาที) ค่าเริ่มต้นคือ 172,800,000 มิลลิวินาที (2 วัน)
- `onlyMainContent` มีค่าเริ่มต้นเป็น `true`; `timeoutSeconds` มีค่าเริ่มต้นเป็น 60
- การกำหนดค่า `tools.web.fetch.firecrawl.*` และ `tools.web.search.firecrawl.*` แบบเดิมจะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`
- การแทนที่ URL สำหรับการดึงข้อมูล/URL ฐานของ Firecrawl ใช้กฎแบบโฮสต์/ส่วนตัวเช่นเดียวกับการค้นหา: การรับส่งข้อมูลสาธารณะแบบโฮสต์ใช้ `https://api.firecrawl.dev`; การแทนที่ด้วยระบบที่โฮสต์เองต้องแก้ไขไปยังปลายทางส่วนตัว/ภายใน
- `firecrawl_scrape` จะปฏิเสธ URL เป้าหมายที่เห็นได้ชัดว่าเป็นเครือข่ายส่วนตัว ลูปแบ็ก เมทาดาทา และไม่ใช่ HTTP(S) ก่อนส่งต่อไปยัง Firecrawl ซึ่งสอดคล้องกับสัญญาความปลอดภัยของเป้าหมาย `web_fetch` สำหรับการเรียกดึงข้อมูลด้วย Firecrawl โดยตรง

`firecrawl_scrape` ใช้การตั้งค่าและตัวแปรสภาพแวดล้อม `plugins.entries.firecrawl.config.webFetch.*` ชุดเดียวกันซ้ำ รวมถึงคีย์ API ที่จำเป็น

### Firecrawl ที่โฮสต์เอง

ตั้งค่า `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` หรือ `FIRECRAWL_BASE_URL` เมื่อคุณเรียกใช้ Firecrawl ด้วยตนเอง OpenClaw ยอมรับ `http://` เฉพาะสำหรับเป้าหมายลูปแบ็ก เครือข่ายส่วนตัว `.local`, `.internal` หรือ `.localhost` เท่านั้น ระบบจะปฏิเสธโฮสต์สาธารณะที่กำหนดเอง เพื่อป้องกันไม่ให้คีย์ API ของ Firecrawl ถูกส่งไปยังปลายทางใดๆ โดยไม่ตั้งใจ

## เครื่องมือ Plugin ของ Firecrawl

### `firecrawl_search`

ใช้เครื่องมือนี้เมื่อต้องการการควบคุมการค้นหาเฉพาะของ Firecrawl แทน `web_search` แบบทั่วไป ต้องใช้คีย์ API

พารามิเตอร์:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (เฉพาะชื่อโฮสต์ และใช้ร่วมกันไม่ได้)
- `tbs` (ตัวกรองเวลา เช่น `qdr:d`, `qdr:w`, `sbd:1`)
- `location` และ `country` (การกำหนดเป้าหมายตามภูมิศาสตร์)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

ใช้เครื่องมือนี้สำหรับหน้าที่ใช้ JS อย่างหนักหรือมีการป้องกันบอต ซึ่ง `web_fetch` แบบปกติทำงานได้ไม่ดี

พารามิเตอร์:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## โหมดซ่อนตัว / การหลบเลี่ยงบอต

`firecrawl_scrape` และตัวสำรอง Firecrawl สำหรับ `web_fetch` มีค่าเริ่มต้นเป็น `proxy: "auto"` ร่วมกับ `storeInCache: true` เว้นแต่ผู้เรียกใช้จะแทนที่พารามิเตอร์เหล่านั้น `firecrawl_search` และผู้ให้บริการ Firecrawl สำหรับ `web_search` ไม่มีการควบคุม `proxy`/`storeInCache`; โหมดพร็อกซีซ่อนตัวใช้กับคำขอดึงข้อมูล/เรียกข้อมูลเท่านั้น

โหมด `proxy` ของ Firecrawl ควบคุมการหลบเลี่ยงบอต (`basic`, `stealth` หรือ `auto`) `auto` จะลองใหม่ด้วยพร็อกซีซ่อนตัวหากความพยายามแบบพื้นฐานล้มเหลว ซึ่งอาจใช้เครดิตมากกว่าการดึงข้อมูลแบบพื้นฐานเท่านั้น

## วิธีที่ `web_fetch` ใช้ Firecrawl

ลำดับการแยกข้อมูลของ `web_fetch`:

1. Readability (ภายในเครื่อง)
2. ผู้ให้บริการดึงข้อมูลที่กำหนดค่าไว้ เช่น Firecrawl (เมื่อเลือกไว้หรือตรวจพบโดยอัตโนมัติจากข้อมูลประจำตัวที่กำหนดค่าไว้)
3. การล้าง HTML ขั้นพื้นฐาน (ตัวสำรองสุดท้าย)

ตัวควบคุมการเลือกคือ `tools.web.fetch.provider` หากละเว้น OpenClaw จะตรวจหาผู้ให้บริการดึงข้อมูลเว็บรายแรกที่พร้อมใช้งานจากข้อมูลประจำตัวที่มีอยู่โดยอัตโนมัติ Plugin Firecrawl อย่างเป็นทางการจะเป็นผู้จัดเตรียมตัวสำรองดังกล่าว

## ที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [การดึงข้อมูลเว็บ](/th/tools/web-fetch) -- เครื่องมือ web_fetch พร้อมตัวสำรอง Firecrawl
- [Tavily](/th/tools/tavily) -- เครื่องมือค้นหาและแยกข้อมูล
