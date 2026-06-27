---
read_when:
    - คุณต้องการผู้ให้บริการค้นเว็บที่ไม่ต้องใช้คีย์ API
    - คุณต้องการใช้ DuckDuckGo สำหรับ web_search
    - คุณต้องการผู้ให้บริการค้นหาแบบไม่ใช้คีย์ที่เลือกไว้อย่างชัดเจน
summary: การค้นหาเว็บ DuckDuckGo -- ผู้ให้บริการแบบไม่ต้องใช้คีย์ (เชิงทดลอง, ใช้ HTML)
title: การค้นหา DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:26:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw รองรับ DuckDuckGo ในฐานะผู้ให้บริการ `web_search` แบบ **ไม่ต้องใช้คีย์** ไม่จำเป็นต้องมีคีย์ API
หรือบัญชี

<Warning>
  DuckDuckGo เป็นการผสานรวมแบบ **ทดลองและไม่เป็นทางการ** ที่ดึงผลลัพธ์
  จากหน้าค้นหาแบบไม่ใช้ JavaScript ของ DuckDuckGo ไม่ใช่ API อย่างเป็นทางการ โปรดคาดว่าจะมี
  การหยุดทำงานเป็นครั้งคราวจากหน้าท้าทายบอตหรือการเปลี่ยนแปลง HTML
</Warning>

## การตั้งค่า

ไม่ต้องใช้คีย์ API เพียงตั้งค่า DuckDuckGo เป็นผู้ให้บริการของคุณ:

<Steps>
  <Step title="กำหนดค่า">
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

การตั้งค่าระดับ Plugin ที่เป็นตัวเลือกสำหรับภูมิภาคและ SafeSearch:

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
ผลลัพธ์ที่จะส่งคืน (1-10)
</ParamField>

<ParamField path="region" type="string">
รหัสภูมิภาคของ DuckDuckGo (เช่น `us-en`, `uk-en`, `de-de`)
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
ระดับ SafeSearch
</ParamField>

สามารถตั้งค่าภูมิภาคและ SafeSearch ในการกำหนดค่า Plugin ได้ด้วย (ดูด้านบน) โดยพารามิเตอร์ของเครื่องมือ
จะเขียนทับค่าการกำหนดค่าในแต่ละคำค้นหา

## หมายเหตุ

- **ไม่ต้องใช้คีย์ API** ทำงานได้หลังจากคุณเลือก DuckDuckGo เป็นผู้ให้บริการ `web_search`
  ของคุณ
- **ทดลอง** รวบรวมผลลัพธ์จากหน้าค้นหา HTML แบบไม่ใช้ JavaScript
  ของ DuckDuckGo ไม่ใช่ API หรือ SDK อย่างเป็นทางการ
- **ความเสี่ยงจากหน้าท้าทายบอต** DuckDuckGo อาจแสดง CAPTCHA หรือบล็อกคำขอ
  เมื่อมีการใช้งานหนักหรือเป็นอัตโนมัติ
- **การแยกวิเคราะห์ HTML** ผลลัพธ์ขึ้นอยู่กับโครงสร้างของหน้า ซึ่งอาจเปลี่ยนแปลงได้โดยไม่
  แจ้งให้ทราบ
- **การเลือกอย่างชัดเจน** OpenClaw จะไม่เลือก DuckDuckGo โดยอัตโนมัติ
  เมื่อไม่ได้กำหนดค่าผู้ให้บริการที่รองรับ API
- **SafeSearch มีค่าเริ่มต้นเป็น moderate** เมื่อไม่ได้กำหนดค่า

<Tip>
  สำหรับการใช้งานจริง โปรดพิจารณา [Brave Search](/th/tools/brave-search) (มีระดับฟรี
  ให้ใช้) หรือผู้ให้บริการอื่นที่รองรับ API
</Tip>

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Brave Search](/th/tools/brave-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมระดับฟรี
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบนิวรัลพร้อมการดึงเนื้อหา
