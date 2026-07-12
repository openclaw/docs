---
read_when:
    - คุณต้องการผู้ให้บริการค้นหาเว็บที่ไม่ต้องใช้คีย์ API
    - คุณต้องการใช้ DuckDuckGo สำหรับ web_search
    - คุณต้องการผู้ให้บริการการค้นหาแบบไม่ใช้คีย์ที่เลือกไว้อย่างชัดเจน
summary: การค้นหาเว็บด้วย DuckDuckGo -- ผู้ให้บริการที่ไม่ต้องใช้คีย์ (ทดลองใช้งาน, ทำงานผ่าน HTML)
title: การค้นหาด้วย DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T16:51:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw รองรับ DuckDuckGo ในฐานะผู้ให้บริการ `web_search` แบบ **ไม่ต้องใช้คีย์** โดยไม่จำเป็นต้องมีคีย์ API หรือบัญชี

<Warning>
  DuckDuckGo เป็นการผสานรวมแบบ **ทดลองและไม่เป็นทางการ** ซึ่งดึงข้อมูลจากหน้าค้นหา HTML ที่ไม่ใช้ JavaScript ของ DuckDuckGo ไม่ใช่ API อย่างเป็นทางการ จึงอาจใช้งานไม่ได้เป็นครั้งคราวเนื่องจากหน้าตรวจสอบบอตหรือการเปลี่ยนแปลง HTML
</Warning>

## การตั้งค่า

DuckDuckGo จะไม่ถูกเลือกโดยอัตโนมัติ เนื่องจากการตรวจหาอัตโนมัติจะพิจารณาเฉพาะผู้ให้บริการที่มีข้อมูลประจำตัวที่ใช้งานได้เท่านั้น โปรดกำหนดอย่างชัดเจน:

<Steps>
  <Step title="กำหนดค่า">
    ```bash
    openclaw configure --section web
    # เลือก "duckduckgo" เป็นผู้ให้บริการ
    ```
  </Step>
</Steps>

## การกำหนดค่า

กำหนดผู้ให้บริการโดยตรงในการกำหนดค่า:

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

การตั้งค่าระดับ Plugin สำหรับภูมิภาคและ SafeSearch ซึ่งกำหนดหรือไม่ก็ได้:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // รหัสภูมิภาคของ DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" หรือ "off"
          },
        },
      },
    },
  },
}
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่ส่งคืน (1-10)
</ParamField>

<ParamField path="region" type="string">
รหัสภูมิภาคของ DuckDuckGo (เช่น `us-en`, `uk-en`, `de-de`)
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
ระดับ SafeSearch
</ParamField>

พารามิเตอร์เครื่องมือ `region` และ `safeSearch` จะแทนที่ค่าการกำหนดค่า Plugin ข้างต้นสำหรับแต่ละคำค้นหา

## หมายเหตุ

- **ไม่ต้องใช้คีย์ API** -- ใช้งานได้เมื่อเลือก DuckDuckGo เป็นผู้ให้บริการ `web_search`
- **อยู่ในขั้นทดลอง** -- ดึงข้อมูลจากหน้าค้นหา HTML ที่ไม่ใช้ JavaScript ของ DuckDuckGo ไม่ใช่ API หรือ SDK อย่างเป็นทางการ ผลลัพธ์ขึ้นอยู่กับโครงสร้างของหน้า ซึ่งอาจเปลี่ยนแปลงได้โดยไม่แจ้งให้ทราบ
- **ความเสี่ยงจากการตรวจสอบบอต** -- DuckDuckGo อาจแสดง CAPTCHA หรือบล็อกคำขอเมื่อมีการใช้งานจำนวนมากหรือใช้งานแบบอัตโนมัติ
- **ต้องเลือกอย่างชัดเจนเท่านั้น** -- การตรวจหาอัตโนมัติของ OpenClaw จะพิจารณาเฉพาะผู้ให้บริการที่มีข้อมูลประจำตัวที่ใช้งานได้ ดังนั้นผู้ให้บริการแบบไม่ต้องใช้คีย์อย่าง DuckDuckGo จะไม่ถูกเลือกโดยอัตโนมัติ คุณต้องกำหนด `provider: "duckduckgo"`
- **SafeSearch มีค่าเริ่มต้นเป็น `moderate`** เมื่อไม่ได้กำหนดค่า

<Tip>
  สำหรับการใช้งานจริง โปรดพิจารณา [Brave Search](/th/tools/brave-search) (มีระดับใช้งานฟรี) หรือผู้ให้บริการรายอื่นที่รองรับด้วย API
</Tip>

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์ที่มีโครงสร้างพร้อมระดับใช้งานฟรี
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบโครงข่ายประสาทพร้อมการแยกเนื้อหา
