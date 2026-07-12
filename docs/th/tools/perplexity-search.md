---
read_when:
    - คุณต้องการใช้ Perplexity Search สำหรับการค้นหาเว็บ
    - คุณต้องตั้งค่า `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY`
summary: ความเข้ากันได้ของ Perplexity Search API และ Sonar/OpenRouter สำหรับ web_search
title: การค้นหาด้วย Perplexity
x-i18n:
    generated_at: "2026-07-12T16:52:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw รองรับ Perplexity Search API ในฐานะผู้ให้บริการ `web_search` โดยจะส่งคืนผลลัพธ์แบบมีโครงสร้างพร้อมฟิลด์ `title`, `url` และ `snippet`

เพื่อความเข้ากันได้ OpenClaw ยังรองรับการตั้งค่า Perplexity Sonar/OpenRouter แบบเดิมด้วย หากคุณใช้ `OPENROUTER_API_KEY`, ใช้คีย์ `sk-or-...` ใน `plugins.entries.perplexity.config.webSearch.apiKey` หรือตั้งค่า `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` ผู้ให้บริการจะสลับไปใช้เส้นทางการเติมข้อความแชต และส่งคืนคำตอบที่ AI สังเคราะห์พร้อมการอ้างอิง แทนผลลัพธ์แบบมีโครงสร้างจาก Search API

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วเริ่ม Gateway ใหม่:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## การรับคีย์ Perplexity API

1. สร้างบัญชี Perplexity ที่ [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. สร้างคีย์ API ในแดชบอร์ด
3. จัดเก็บคีย์ไว้ในการกำหนดค่า หรือตั้งค่า `PERPLEXITY_API_KEY` ในสภาพแวดล้อมของ Gateway

## ความเข้ากันได้กับ OpenRouter

หากคุณใช้ OpenRouter สำหรับ Perplexity Sonar อยู่แล้ว ให้คง `provider: "perplexity"` ไว้ และตั้งค่า `OPENROUTER_API_KEY` ในสภาพแวดล้อมของ Gateway หรือจัดเก็บคีย์ `sk-or-...` ไว้ใน `plugins.entries.perplexity.config.webSearch.apiKey`

ตัวควบคุมความเข้ากันได้เพิ่มเติม:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## ตัวอย่างการกำหนดค่า

### Perplexity Search API แบบเนทีฟ

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### ความเข้ากันได้กับ OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## ตำแหน่งที่ตั้งค่าคีย์

**ผ่านการกำหนดค่า:** เรียกใช้ `openclaw configure --section web` ระบบจะจัดเก็บคีย์ไว้ใน `~/.openclaw/openclaw.json` ภายใต้ `plugins.entries.perplexity.config.webSearch.apiKey` ฟิลด์นี้รองรับออบเจ็กต์ SecretRef ด้วย

**ผ่านสภาพแวดล้อม:** ตั้งค่า `PERPLEXITY_API_KEY` หรือ `OPENROUTER_API_KEY` ในสภาพแวดล้อมของโปรเซส Gateway สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env` (หรือสภาพแวดล้อมของบริการของคุณ) ดู [ตัวแปรสภาพแวดล้อม](/th/help/faq#env-vars-and-env-loading)

หากกำหนดค่า `provider: "perplexity"` และไม่สามารถแก้ไข SecretRef ของคีย์ Perplexity ได้โดยไม่มีค่าทดแทนจากสภาพแวดล้อม การเริ่มทำงานหรือโหลดใหม่จะล้มเหลวทันที

## พารามิเตอร์เครื่องมือ

พารามิเตอร์เหล่านี้ใช้กับเส้นทาง Perplexity Search API แบบเนทีฟ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่ส่งคืน (1-10)
</ParamField>

<ParamField path="country" type="string">
รหัสประเทศ ISO แบบ 2 ตัวอักษร (เช่น `US`, `DE`)
</ParamField>

<ParamField path="language" type="string">
รหัสภาษา ISO 639-1 (เช่น `en`, `de`, `fr`)
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
ตัวกรองเวลา โดย `day` หมายถึง 24 ชั่วโมง
</ParamField>

<ParamField path="date_after" type="string">
เฉพาะผลลัพธ์ที่เผยแพร่หลังวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="date_before" type="string">
เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="domain_filter" type="string[]">
อาร์เรย์รายการโดเมนที่อนุญาต/ปฏิเสธ (สูงสุด 20 รายการ)
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
งบประมาณเนื้อหาทั้งหมด (สูงสุด 1000000)
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
ขีดจำกัดโทเค็นต่อหน้า
</ParamField>

สำหรับเส้นทางความเข้ากันได้กับ Sonar/OpenRouter แบบเดิม:

- รองรับ `query`, `count` และ `freshness`
- ในเส้นทางนี้ `count` มีไว้เพื่อความเข้ากันได้เท่านั้น การตอบกลับยังคงเป็นคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการพร้อมการอ้างอิง ไม่ใช่รายการผลลัพธ์จำนวน N รายการ
- ตัวกรองที่ใช้ได้เฉพาะกับ Search API (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) จะส่งคืนข้อผิดพลาดอย่างชัดเจน

**ตัวอย่าง:**

```javascript
// การค้นหาเฉพาะประเทศและภาษา
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// ผลลัพธ์ล่าสุด (สัปดาห์ที่ผ่านมา)
await web_search({
  query: "AI news",
  freshness: "week",
});

// การค้นหาตามช่วงวันที่
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// การกรองโดเมน (รายการที่อนุญาต)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// การกรองโดเมน (รายการที่ปฏิเสธ โดยเติม - นำหน้า)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// การดึงเนื้อหาเพิ่มเติม
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### กฎการกรองโดเมน

- ตัวกรองหนึ่งรายการรองรับโดเมนสูงสุด 20 โดเมน
- ไม่สามารถผสมรายการที่อนุญาตและรายการที่ปฏิเสธในคำขอเดียวกัน
- ใช้คำนำหน้า `-` สำหรับรายการที่ปฏิเสธ (เช่น `["-reddit.com"]`)

## หมายเหตุ

- Perplexity Search API ส่งคืนผลลัพธ์การค้นหาเว็บแบบมีโครงสร้าง (`title`, `url`, `snippet`)
- OpenRouter หรือการกำหนดค่า `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` อย่างชัดเจน จะสลับ Perplexity กลับไปใช้การเติมข้อความแชตของ Sonar เพื่อความเข้ากันได้
- ความเข้ากันได้กับ Sonar/OpenRouter จะส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งรายการพร้อมการอ้างอิง ไม่ใช่แถวผลลัพธ์แบบมีโครงสร้าง
- ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ภาพรวมการค้นหาเว็บ" href="/th/tools/web" icon="globe">
    ผู้ให้บริการทั้งหมดและกฎการตรวจหาอัตโนมัติ
  </Card>
  <Card title="การค้นหาด้วย Brave" href="/th/tools/brave-search" icon="shield">
    ผลลัพธ์แบบมีโครงสร้างพร้อมตัวกรองประเทศและภาษา
  </Card>
  <Card title="การค้นหาด้วย Exa" href="/th/tools/exa-search" icon="magnifying-glass">
    การค้นหาแบบโครงข่ายประสาทพร้อมการดึงเนื้อหา
  </Card>
  <Card title="เอกสาร Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    คู่มือเริ่มต้นฉบับย่อและเอกสารอ้างอิงอย่างเป็นทางการของ Perplexity Search API
  </Card>
</CardGroup>
