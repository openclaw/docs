---
read_when:
    - คุณต้องการการค้นหาเว็บที่ใช้ Tavily เป็นแบ็กเอนด์
    - คุณต้องมีคีย์ API ของ Tavily
    - คุณต้องการใช้ Tavily เป็นผู้ให้บริการ web_search
    - คุณต้องการแยกเนื้อหาจาก URL
summary: เครื่องมือค้นหาและแยกข้อมูลของ Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-27T18:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) เป็น API ค้นหาที่ออกแบบมาสำหรับแอปพลิเคชัน AI OpenClaw เปิดให้ใช้งานได้สองวิธี:

- เป็นผู้ให้บริการ `web_search` สำหรับเครื่องมือค้นหาทั่วไป
- เป็นเครื่องมือ Plugin โดยตรง: `tavily_search` และ `tavily_extract`

Tavily ส่งคืนผลลัพธ์แบบมีโครงสร้างที่ปรับให้เหมาะกับการใช้งานของ LLM พร้อมความลึกของการค้นหาที่กำหนดค่าได้ การกรองหัวข้อ ตัวกรองโดเมน สรุปคำตอบที่สร้างโดย AI และการดึงเนื้อหาจาก URL (รวมถึงหน้าที่เรนเดอร์ด้วย JavaScript)

| คุณสมบัติ | ค่า                                 |
| --------- | ----------------------------------- |
| รหัส Plugin | `tavily`                            |
| แพ็กเกจ   | `@openclaw/tavily-plugin`           |
| การยืนยันตัวตน | `TAVILY_API_KEY` หรือ config `apiKey` |
| URL ฐาน   | `https://api.tavily.com` (ค่าเริ่มต้น) |
| เครื่องมือ | `tavily_search`, `tavily_extract`   |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="รับคีย์ API">
    สร้างบัญชี Tavily ที่ [tavily.com](https://tavily.com) จากนั้นสร้างคีย์ API ในแดชบอร์ด
  </Step>
  <Step title="กำหนดค่า Plugin และผู้ให้บริการ">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่าการค้นหาทำงาน">
    ทริกเกอร์ `web_search` จากเอเจนต์ใดก็ได้ หรือเรียก `tavily_search` โดยตรง
  </Step>
</Steps>

<Tip>
การเลือก Tavily ใน onboarding หรือ `openclaw configure --section web` จะติดตั้งและเปิดใช้งาน Plugin Tavily อย่างเป็นทางการเมื่อจำเป็น
</Tip>

## อ้างอิงเครื่องมือ

### `tavily_search`

ใช้รายการนี้เมื่อคุณต้องการตัวควบคุมการค้นหาเฉพาะของ Tavily แทน `web_search` ทั่วไป

| พารามิเตอร์       | ประเภท       | ข้อจำกัด / ค่าเริ่มต้น                 | คำอธิบาย                                      |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | จำเป็น                                 | สตริงคำค้นหา จำกัดไม่เกิน 400 อักขระ |
| `search_depth`    | enum         | `basic` (ค่าเริ่มต้น), `advanced`      | `advanced` ช้ากว่าแต่มีความเกี่ยวข้องสูงกว่า |
| `topic`           | enum         | `general` (ค่าเริ่มต้น), `news`, `finance` | กรองตามกลุ่มหัวข้อ |
| `max_results`     | integer      | 1-20                                   | จำนวนผลลัพธ์ |
| `include_answer`  | boolean      | ค่าเริ่มต้น `false`                    | รวมสรุปคำตอบที่สร้างโดย AI ของ Tavily |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | กรองผลลัพธ์ตามความใหม่ |
| `include_domains` | string array | (ไม่มี)                                | รวมเฉพาะผลลัพธ์จากโดเมนเหล่านี้ |
| `exclude_domains` | string array | (ไม่มี)                                | ไม่รวมผลลัพธ์จากโดเมนเหล่านี้ |

ข้อแลกเปลี่ยนของความลึกการค้นหา:

| ความลึก    | ความเร็ว | ความเกี่ยวข้อง | เหมาะที่สุดสำหรับ |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | เร็วกว่า | สูง      | คำค้นหาทั่วไป (ค่าเริ่มต้น) |
| `advanced` | ช้ากว่า | สูงที่สุด | งานวิจัยที่ต้องการความแม่นยำและการค้นหาข้อเท็จจริง |

### `tavily_extract`

ใช้รายการนี้เพื่อดึงเนื้อหาที่สะอาดจาก URL หนึ่งรายการขึ้นไป รองรับหน้าที่เรนเดอร์ด้วย JavaScript และรองรับการแบ่งก้อนตามคำค้นหาเพื่อการดึงเนื้อหาแบบเจาะจง

| พารามิเตอร์         | ประเภท       | ข้อจำกัด / ค่าเริ่มต้น        | คำอธิบาย |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | จำเป็น, 1-20                  | URL ที่ต้องการดึงเนื้อหา |
| `query`             | string       | (ไม่บังคับ)                  | จัดอันดับก้อนเนื้อหาที่ดึงมาใหม่ตามความเกี่ยวข้องกับคำค้นหานี้ |
| `extract_depth`     | enum         | `basic` (ค่าเริ่มต้น), `advanced` | ใช้ `advanced` สำหรับหน้าที่ใช้ JS หนัก, SPA หรือ table แบบไดนามิก |
| `chunks_per_source` | integer      | 1-5; **ต้องมี `query`**       | จำนวนก้อนที่ส่งคืนต่อ URL เกิดข้อผิดพลาดหากตั้งค่าโดยไม่มี `query` |
| `include_images`    | boolean      | ค่าเริ่มต้น `false`           | รวม URL รูปภาพในผลลัพธ์ |

ข้อแลกเปลี่ยนของความลึกการดึงเนื้อหา:

| ความลึก    | ควรใช้เมื่อ |
| ---------- | ------------------------------------------ |
| `basic`    | หน้าง่าย ๆ ลองใช้ตัวเลือกนี้ก่อน |
| `advanced` | SPA ที่เรนเดอร์ด้วย JS, เนื้อหาไดนามิก, table |

<Tip>
แบ่งรายการ URL ขนาดใหญ่เป็นการเรียก `tavily_extract` หลายครั้ง (สูงสุด 20 รายการต่อคำขอ) ใช้ `query` ร่วมกับ `chunks_per_source` เพื่อรับเฉพาะเนื้อหาที่เกี่ยวข้องแทนที่จะรับทั้งหน้า
</Tip>

## การเลือกเครื่องมือที่เหมาะสม

| ความต้องการ | เครื่องมือ |
| ------------------------------------ | ---------------- |
| ค้นหาเว็บอย่างรวดเร็ว ไม่มีตัวเลือกพิเศษ | `web_search` |
| ค้นหาพร้อมความลึก หัวข้อ และคำตอบจาก AI | `tavily_search` |
| ดึงเนื้อหาจาก URL เฉพาะ | `tavily_extract` |

<Note>
เครื่องมือ `web_search` ทั่วไปที่ใช้ Tavily เป็นผู้ให้บริการรองรับ `query` และ `count` (สูงสุด 20 ผลลัพธ์) สำหรับตัวควบคุมเฉพาะของ Tavily (`search_depth`, `topic`, `include_answer`, ตัวกรองโดเมน, ช่วงเวลา) ให้ใช้ `tavily_search` แทน
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ลำดับการค้นหาคีย์ API">
    ไคลเอนต์ Tavily ค้นหาคีย์ API ตามลำดับนี้:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (แก้ค่าผ่าน SecretRefs)
    2. `TAVILY_API_KEY` จากสภาพแวดล้อม Gateway

    `tavily_extract` จะแจ้งข้อผิดพลาดการตั้งค่าหากไม่มีทั้งสองรายการ

  </Accordion>

  <Accordion title="URL ฐานแบบกำหนดเอง">
    แทนที่ `plugins.entries.tavily.config.webSearch.baseUrl` หากคุณให้ Tavily ผ่านพร็อกซี ค่าเริ่มต้นคือ `https://api.tavily.com`
  </Accordion>

  <Accordion title="`chunks_per_source` ต้องมี `query`">
    `tavily_extract` ปฏิเสธการเรียกที่ส่ง `chunks_per_source` โดยไม่มี `query` Tavily จัดอันดับก้อนตามความเกี่ยวข้องกับคำค้นหา ดังนั้นพารามิเตอร์นี้จึงไม่มีความหมายหากไม่มีคำค้นหา
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ภาพรวมการค้นหาเว็บ" href="/th/tools/web" icon="magnifying-glass">
    ผู้ให้บริการทั้งหมดและกฎการตรวจจับอัตโนมัติ
  </Card>
  <Card title="Firecrawl" href="/th/tools/firecrawl" icon="fire">
    การค้นหาพร้อมการ scraping และการดึงเนื้อหา
  </Card>
  <Card title="Exa Search" href="/th/tools/exa-search" icon="binoculars">
    การค้นหาแบบ neural พร้อมการดึงเนื้อหา
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    สคีมา config แบบเต็มสำหรับรายการ Plugin และการกำหนดเส้นทางเครื่องมือ
  </Card>
</CardGroup>
