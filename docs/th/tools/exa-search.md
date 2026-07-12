---
read_when:
    - คุณต้องการใช้ Exa สำหรับ web_search
    - คุณต้องมี EXA_API_KEY
    - คุณต้องการการค้นหาเชิงประสาทหรือการสกัดเนื้อหา
summary: การค้นหาด้วย Exa AI — การค้นหาแบบโครงข่ายประสาทและคำสำคัญ พร้อมการแยกเนื้อหา
title: การค้นหาด้วย Exa
x-i18n:
    generated_at: "2026-07-12T16:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) เป็นผู้ให้บริการ `web_search` ที่มีโหมดการค้นหาแบบนิวรัล แบบคำสำคัญ และแบบผสม พร้อมการแยกเนื้อหาในตัว (ข้อความไฮไลต์ ข้อความ และบทสรุป)

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## รับคีย์ API

<Steps>
  <Step title="สร้างบัญชี">
    สมัครใช้งานที่ [exa.ai](https://exa.ai/) และสร้างคีย์ API จากแดชบอร์ดของคุณ
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `EXA_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // ไม่บังคับหากตั้งค่า EXA_API_KEY แล้ว
            baseUrl: "https://api.exa.ai", // ไม่บังคับ; OpenClaw จะเติม /search ต่อท้าย
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**ทางเลือกโดยใช้ตัวแปรสภาพแวดล้อม:** ตั้งค่า `EXA_API_KEY` ในสภาพแวดล้อมของ Gateway สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env` ดู[ตัวแปรสภาพแวดล้อม](/th/help/faq#env-vars-and-env-loading)

## การแทนที่ URL ฐาน

ตั้งค่า `plugins.entries.exa.config.webSearch.baseUrl` เพื่อกำหนดเส้นทางคำขอค้นหาของ Exa ผ่านพร็อกซีที่เข้ากันได้หรือปลายทางอื่น OpenClaw จะปรับโฮสต์เปล่าให้เป็นรูปแบบมาตรฐานโดยเติม `https://` ไว้ข้างหน้า และเติม `/search` ต่อท้าย เว้นแต่พาธจะลงท้ายด้วยค่านี้อยู่แล้ว ปลายทางที่ผ่านการแก้ไขแล้วเป็นส่วนหนึ่งของคีย์แคชการค้นหา ดังนั้นผลลัพธ์จากปลายทางต่างกันจะไม่ถูกใช้ร่วมกัน

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่จะส่งคืน (1-100 โดยขึ้นอยู่กับขีดจำกัดของประเภทการค้นหาของ Exa)
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
โหมดการค้นหา
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
ตัวกรองเวลา ไม่สามารถใช้ร่วมกับ `date_after`/`date_before`
</ParamField>

<ParamField path="date_after" type="string">
ผลลัพธ์หลังจากวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="date_before" type="string">
ผลลัพธ์ก่อนวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="contents" type="object">
ตัวเลือกการแยกเนื้อหา (ดูด้านล่าง)
</ParamField>

### การแยกเนื้อหา

ส่งอ็อบเจกต์ `contents` เพื่อควบคุมเนื้อหาที่แยกออกมาในผลลัพธ์:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // ข้อความเต็มของหน้า
    highlights: { numSentences: 3 }, // ประโยคสำคัญ
    summary: true, // บทสรุปโดย AI
  },
});
```

| ตัวเลือกเนื้อหา | ชนิด                                                                  | คำอธิบาย                 |
| --------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`          | `boolean \| { maxCharacters }`                                        | แยกข้อความเต็มของหน้า    |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | แยกประโยคสำคัญ           |
| `summary`       | `boolean \| { query }`                                                | บทสรุปที่สร้างโดย AI     |

หากละเว้น `contents` ค่าเริ่มต้นของ Exa คือ `{ highlights: true }` เพื่อให้ผลลัพธ์มีข้อความตัดตอนจากประโยคสำคัญ คำอธิบายผลลัพธ์จะเลือกจากข้อความไฮไลต์ก่อน ตามด้วยบทสรุป แล้วจึงเป็นข้อความฉบับเต็ม โดยใช้รายการแรกที่มีอยู่ นอกจากนี้ ผลลัพธ์ยังคงเก็บฟิลด์ดิบ `highlightScores` และ `summary` จากการตอบกลับของ API ของ Exa เมื่อมีข้อมูลดังกล่าว

### โหมดการค้นหา

| โหมด             | คำอธิบาย                                  |
| ---------------- | ----------------------------------------- |
| `auto`           | Exa เลือกโหมดที่เหมาะสมที่สุด (ค่าเริ่มต้น) |
| `neural`         | การค้นหาตามความหมาย/เชิงความหมาย          |
| `fast`           | การค้นหาด้วยคำสำคัญอย่างรวดเร็ว            |
| `deep`           | การค้นหาเชิงลึกอย่างละเอียด                |
| `deep-reasoning` | การค้นหาเชิงลึกพร้อมการให้เหตุผล            |
| `instant`        | ผลลัพธ์ที่รวดเร็วที่สุด                     |

## หมายเหตุ

- `count` รองรับค่าสูงสุด 100 โดยขึ้นอยู่กับขีดจำกัดของประเภทการค้นหาของ Exa
- โดยค่าเริ่มต้น ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาที กำหนดค่า `tools.web.search.cacheTtlMinutes` ที่ใช้ร่วมกัน (หน่วยเป็นนาที) และ `tools.web.search.timeoutSeconds` (ค่าเริ่มต้น 30 วินาที) เพื่อเปลี่ยนระยะเวลาการแคชและเวลาหมดเวลาของคำขอสำหรับผู้ให้บริการ `web_search` ทั้งหมด รวมถึง Exa

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมตัวกรองประเทศ/ภาษา
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
