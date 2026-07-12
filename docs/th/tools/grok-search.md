---
read_when:
    - คุณต้องการใช้ Grok สำหรับ web_search
    - คุณต้องการใช้ xAI OAuth หรือ XAI_API_KEY สำหรับการค้นหาเว็บ
summary: การค้นหาเว็บด้วย Grok ผ่านคำตอบของ xAI ที่อ้างอิงข้อมูลจากเว็บ
title: การค้นหาด้วย Grok
x-i18n:
    generated_at: "2026-07-12T16:51:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw รองรับ Grok ในฐานะผู้ให้บริการ `web_search` โดยใช้การตอบกลับของ xAI
ที่อิงข้อมูลจากเว็บ เพื่อสร้างคำตอบที่ AI สังเคราะห์ขึ้นและมีผลการค้นหาแบบสด
พร้อมการอ้างอิงรองรับ

การค้นหาเว็บด้วย Grok จะเลือกใช้การลงชื่อเข้าใช้ xAI ผ่าน OAuth ที่มีอยู่ก่อน หากมี
หากไม่มีโปรไฟล์ OAuth คีย์ API ของ xAI เดียวกันนี้ยังใช้ขับเคลื่อนเครื่องมือ
`x_search` ในตัวสำหรับค้นหาโพสต์บน X (เดิมคือ Twitter) และเครื่องมือ
`code_execution` ด้วย การจัดเก็บคีย์ไว้ที่ `plugins.entries.xai.config.webSearch.apiKey`
ยังช่วยให้ OpenClaw นำคีย์นั้นกลับมาใช้เป็นทางเลือกสำรองสำหรับผู้ให้บริการโมเดล xAI
ที่รวมมาในชุดได้ด้วย

สำหรับเมตริกระดับโพสต์บน X (การรีโพสต์ การตอบกลับ บุ๊กมาร์ก และยอดดู) ให้ใช้
[`x_search`](/th/tools/web#x_search) พร้อม URL ของโพสต์หรือ ID สถานะที่ตรงกัน
แทนคำค้นหาแบบกว้าง

## การเริ่มต้นใช้งานและการกำหนดค่า

การเลือก **Grok** ระหว่าง `openclaw onboard` หรือ `openclaw configure --section
web` ช่วยให้ OpenClaw นำโปรไฟล์ OAuth ของ xAI ที่มีอยู่กลับมาใช้ได้ โดยไม่ถามหา
คีย์สำหรับการค้นหาเว็บแยกต่างหาก หากไม่มี OAuth ระบบจะกลับไปใช้การตั้งค่าคีย์ API
ของ xAI

จากนั้น OpenClaw จะเสนอขั้นตอนต่อเนื่องเพื่อเปิดใช้ `x_search` ด้วยข้อมูลประจำตัว
xAI ชุดเดียวกัน ขั้นตอนต่อเนื่องดังกล่าว:

- จะปรากฏเฉพาะหลังจากที่คุณเลือก Grok สำหรับ `web_search`
- ไม่ใช่ตัวเลือกผู้ให้บริการค้นหาเว็บระดับบนสุดที่แยกต่างหาก
- สามารถตั้งค่าโมเดล `x_search` ในขั้นตอนเดียวกันได้ตามต้องการ

ข้ามขั้นตอนนี้เพื่อเปิดใช้หรือเปลี่ยน `x_search` ในการกำหนดค่าภายหลัง

## ลงชื่อเข้าใช้หรือรับคีย์ API

<Steps>
  <Step title="ใช้ OAuth ของ xAI">
    หากคุณลงชื่อเข้าใช้ด้วย xAI ระหว่างการเริ่มต้นใช้งานหรือการยืนยันตัวตนของโมเดล
    แล้ว ให้เลือก Grok เป็นผู้ให้บริการ `web_search` โดยไม่จำเป็นต้องใช้คีย์ API
    แยกต่างหาก:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="ใช้คีย์ API เป็นทางเลือกสำรอง">
    รับคีย์ API จาก [xAI](https://console.x.ai/) เมื่อ OAuth ไม่พร้อมใช้งาน
    หรือเมื่อคุณตั้งใจใช้การกำหนดค่าการค้นหาเว็บที่รองรับด้วยคีย์
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `XAI_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // ไม่บังคับ หากมี OAuth ของ xAI หรือ XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // ไม่บังคับ ใช้แทน URL พร็อกซี/ฐานของ Responses API
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**ทางเลือกสำหรับข้อมูลประจำตัว:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` ในสภาพแวดล้อมของ Gateway หรือ
`plugins.entries.xai.config.webSearch.apiKey` สำหรับการติดตั้ง Gateway ให้ใส่
ตัวแปรสภาพแวดล้อมไว้ใน `~/.openclaw/.env`

## วิธีการทำงาน

Grok ใช้การตอบกลับของ xAI ที่อิงข้อมูลจากเว็บเพื่อสังเคราะห์คำตอบพร้อมการอ้างอิง
ภายในข้อความ คล้ายกับแนวทางการอิงข้อมูลจาก Google Search ของ Gemini

## พารามิเตอร์ที่รองรับ

การค้นหาด้วย Grok รองรับ `query` โดยยอมรับ `count` เพื่อให้เข้ากันได้กับ
`web_search` ที่ใช้ร่วมกัน แต่ Grok จะส่งคืนคำตอบที่สังเคราะห์ขึ้นหนึ่งคำตอบ
พร้อมการอ้างอิงเสมอ แทนรายการผลลัพธ์จำนวน N รายการ ไม่รองรับตัวกรองเฉพาะ
ผู้ให้บริการ

ค่าเริ่มต้นของ Grok คือหมดเวลาหลัง 60 วินาที เนื่องจากการค้นหาที่อิงข้อมูลจากเว็บ
ผ่าน Responses ของ xAI อาจใช้เวลานานกว่าค่าเริ่มต้นของ `web_search` ที่ใช้ร่วมกัน
ปรับค่านี้ได้ด้วย `tools.web.search.timeoutSeconds`

## การใช้ URL ฐานแทนค่าเริ่มต้น

ตั้งค่า `plugins.entries.xai.config.webSearch.baseUrl` เพื่อกำหนดเส้นทาง
การค้นหาเว็บด้วย Grok ผ่านพร็อกซีของผู้ดำเนินการหรือปลายทาง Responses
ที่เข้ากันได้กับ xAI โดย OpenClaw จะส่งคำขอ POST ไปยัง `<baseUrl>/responses`
หลังจากตัดเครื่องหมายทับท้ายออก `x_search` จะกลับไปใช้ `webSearch.baseUrl`
เดียวกัน เว้นแต่จะตั้งค่า `plugins.entries.xai.config.xSearch.baseUrl`

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [x_search ในการค้นหาเว็บ](/th/tools/web#x_search) -- การค้นหา X ระดับหลักผ่าน xAI
- [การค้นหาด้วย Gemini](/th/tools/gemini-search) -- คำตอบที่ AI สังเคราะห์ขึ้นโดยอิงข้อมูลจาก Google
