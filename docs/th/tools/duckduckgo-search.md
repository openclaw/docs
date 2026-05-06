---
read_when:
    - คุณต้องการผู้ให้บริการค้นหาเว็บที่ไม่ต้องใช้คีย์ API
    - คุณต้องการใช้ DuckDuckGo สำหรับ web_search
    - คุณต้องมีกลไกสำรองสำหรับการค้นหาแบบไม่ต้องกำหนดค่า
summary: การค้นหาเว็บ DuckDuckGo -- ผู้ให้บริการสำรองที่ไม่ต้องใช้คีย์ (ทดลอง, อิงตาม HTML)
title: การค้นหาด้วย DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T09:33:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw รองรับ DuckDuckGo เป็นผู้ให้บริการ `web_search` แบบ **ไม่ต้องใช้คีย์** ไม่จำเป็นต้องมีคีย์ API
หรือบัญชี

<Warning>
  DuckDuckGo เป็นการผสานรวมแบบ **ทดลองและไม่เป็นทางการ** ที่ดึงผลลัพธ์
  จากหน้าค้นหาแบบไม่ใช้ JavaScript ของ DuckDuckGo - ไม่ใช่ API อย่างเป็นทางการ คาดว่า
  อาจเกิดปัญหาเป็นครั้งคราวจากหน้าท้าทายบอตหรือการเปลี่ยนแปลง HTML
</Warning>

## การตั้งค่า

ไม่ต้องใช้คีย์ API - เพียงตั้งค่า DuckDuckGo เป็นผู้ให้บริการของคุณ:

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## การกำหนดค่า

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

การตั้งค่าระดับ Plugin ที่ไม่บังคับสำหรับภูมิภาคและ SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
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
จำนวนผลลัพธ์ที่จะส่งคืน (1-10)
</ParamField>

<ParamField path="region" type="string">
รหัสภูมิภาคของ DuckDuckGo (เช่น `us-en`, `uk-en`, `de-de`)
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
ระดับ SafeSearch
</ParamField>

ภูมิภาคและ SafeSearch สามารถตั้งค่าใน config ของ Plugin ได้เช่นกัน (ดูด้านบน) - พารามิเตอร์
ของเครื่องมือจะแทนที่ค่า config เป็นรายคำค้นหา

## หมายเหตุ

- **ไม่ต้องใช้คีย์ API** - ใช้งานได้ทันทีโดยไม่ต้องกำหนดค่า
- **ทดลอง** - รวบรวมผลลัพธ์จากหน้า HTML ค้นหาแบบไม่ใช้ JavaScript
  ของ DuckDuckGo ไม่ใช่ API หรือ SDK อย่างเป็นทางการ
- **ความเสี่ยงจากการท้าทายบอต** - DuckDuckGo อาจแสดง CAPTCHA หรือบล็อกคำขอ
  ภายใต้การใช้งานหนักหรือแบบอัตโนมัติ
- **การแยกวิเคราะห์ HTML** - ผลลัพธ์ขึ้นอยู่กับโครงสร้างหน้า ซึ่งอาจเปลี่ยนแปลงได้โดยไม่
  แจ้งให้ทราบ
- **ลำดับการตรวจจับอัตโนมัติ** - DuckDuckGo เป็น fallback แบบไม่ต้องใช้คีย์ตัวแรก
  (ลำดับ 100) ในการตรวจจับอัตโนมัติ ผู้ให้บริการที่ใช้ API พร้อมคีย์ที่กำหนดค่าไว้จะทำงาน
  ก่อน จากนั้น Ollama Web Search (ลำดับ 110) แล้วจึง SearXNG (ลำดับ 200)
- **SafeSearch ใช้ค่าเริ่มต้นเป็น moderate** เมื่อไม่ได้กำหนดค่า

<Tip>
  สำหรับการใช้งานจริงใน production ให้พิจารณา [Brave Search](/th/tools/brave-search) (มี tier ฟรี
  ให้ใช้) หรือผู้ให้บริการรายอื่นที่ใช้ API
</Tip>

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อม tier ฟรี
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบ neural พร้อมการดึงเนื้อหา
