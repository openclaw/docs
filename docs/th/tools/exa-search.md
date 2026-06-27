---
read_when:
    - คุณต้องการใช้ Exa สำหรับ web_search
    - คุณต้องมี EXA_API_KEY
    - คุณต้องการการค้นหาแบบนิวรัลหรือการดึงเนื้อหา
summary: การค้นหา Exa AI -- การค้นหาแบบนิวรัลและคีย์เวิร์ดพร้อมการดึงเนื้อหา
title: Exa search
x-i18n:
    generated_at: "2026-06-27T18:26:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw รองรับ [Exa AI](https://exa.ai/) ในฐานะผู้ให้บริการ `web_search` Exa
มีโหมดค้นหาแบบนิวรัล คีย์เวิร์ด และไฮบริด พร้อมการดึงเนื้อหาในตัว
(ไฮไลต์ ข้อความ สรุป)

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ จากนั้นรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## รับคีย์ API

<Steps>
  <Step title="สร้างบัญชี">
    สมัครใช้งานที่ [exa.ai](https://exa.ai/) และสร้างคีย์ API จาก
    แดชบอร์ดของคุณ
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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**ทางเลือกผ่านสภาพแวดล้อม:** ตั้งค่า `EXA_API_KEY` ในสภาพแวดล้อมของ Gateway
สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## การแทนที่ URL ฐาน

ตั้งค่า `plugins.entries.exa.config.webSearch.baseUrl` เมื่อคำขอค้นหาของ Exa
ควรผ่านพร็อกซีที่เข้ากันได้หรือปลายทาง Exa ทางเลือก OpenClaw
จะทำให้โฮสต์เปล่าเป็นรูปแบบปกติโดยเติม `https://` ไว้ข้างหน้า และเติม `/search` เว้นแต่
พาธจะลงท้ายด้วยส่วนนั้นอยู่แล้ว ปลายทางที่แก้ไขแล้วจะถูกรวมไว้ในคีย์แคชการค้นหา
ดังนั้นผลลัพธ์จากปลายทาง Exa คนละแห่งจะไม่ถูกใช้ร่วมกัน

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number">
จำนวนผลลัพธ์ที่จะส่งคืน (1–100)
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
โหมดค้นหา
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
ตัวกรองเวลา
</ParamField>

<ParamField path="date_after" type="string">
ผลลัพธ์หลังวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="date_before" type="string">
ผลลัพธ์ก่อนวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="contents" type="object">
ตัวเลือกการดึงเนื้อหา (ดูด้านล่าง)
</ParamField>

### การดึงเนื้อหา

Exa สามารถส่งคืนเนื้อหาที่ดึงมาแล้วพร้อมผลลัพธ์การค้นหา ส่งอ็อบเจกต์ `contents`
เพื่อเปิดใช้งาน:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| ตัวเลือก Contents | ประเภท                                                               | คำอธิบาย                      |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | ดึงข้อความเต็มของหน้า |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | ดึงประโยคสำคัญ         |
| `summary`       | `boolean \| { query }`                                                | สรุปที่สร้างโดย AI     |

### โหมดค้นหา

| โหมด             | คำอธิบาย                                |
| ---------------- | --------------------------------- |
| `auto`           | Exa เลือกโหมดที่ดีที่สุด (ค่าเริ่มต้น) |
| `neural`         | การค้นหาเชิงความหมาย/อิงความหมาย       |
| `fast`           | การค้นหาคีย์เวิร์ดแบบรวดเร็ว             |
| `deep`           | การค้นหาเชิงลึกอย่างละเอียด             |
| `deep-reasoning` | การค้นหาเชิงลึกพร้อมการให้เหตุผล        |
| `instant`        | ผลลัพธ์ที่เร็วที่สุด                    |

## หมายเหตุ

- หากไม่ได้ระบุตัวเลือก `contents` Exa จะใช้ค่าเริ่มต้นเป็น `{ highlights: true }`
  ดังนั้นผลลัพธ์จึงมีข้อความตัดตอนจากประโยคสำคัญ
- ผลลัพธ์จะคงฟิลด์ `highlightScores` และ `summary` จากการตอบกลับของ Exa API
  เมื่อมีให้ใช้งาน
- คำอธิบายผลลัพธ์จะมาจากไฮไลต์ก่อน จากนั้นเป็นสรุป แล้วจึงเป็น
  ข้อความเต็ม แล้วแต่ว่าอะไรมีให้ใช้งาน
- ไม่สามารถใช้ `freshness` ร่วมกับ `date_after`/`date_before` ได้ ให้ใช้
  โหมดตัวกรองเวลาเพียงแบบเดียว
- สามารถส่งคืนผลลัพธ์ได้สูงสุด 100 รายการต่อคำค้นหา (ขึ้นอยู่กับขีดจำกัด
  ของประเภทการค้นหา Exa)
- ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน
  `cacheTtlMinutes`)
- Exa เป็นการผสานรวม API อย่างเป็นทางการที่มีการตอบกลับ JSON แบบมีโครงสร้าง

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมตัวกรองประเทศ/ภาษา
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
