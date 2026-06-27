---
read_when:
    - คุณต้องการใช้ Grok สำหรับ web_search
    - คุณต้องการใช้ xAI OAuth หรือ XAI_API_KEY สำหรับการค้นหาเว็บ
summary: การค้นหาเว็บของ Grok ผ่านคำตอบที่อิงข้อมูลจากเว็บของ xAI
title: ค้นหา Grok
x-i18n:
    generated_at: "2026-06-27T18:28:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw รองรับ Grok ในฐานะผู้ให้บริการ `web_search` โดยใช้คำตอบของ xAI ที่อ้างอิงข้อมูลจากเว็บ เพื่อสร้างคำตอบที่ AI สังเคราะห์ขึ้นโดยอิงจากผลการค้นหาสดพร้อมการอ้างอิง

การค้นหาเว็บของ Grok จะเลือกใช้การลงชื่อเข้าใช้ xAI OAuth ที่คุณมีอยู่ก่อน หากพร้อมใช้งาน หากไม่มีโปรไฟล์ OAuth อยู่ คีย์ API ของ xAI เดียวกันยังสามารถใช้ขับเคลื่อนเครื่องมือ `x_search` ในตัวสำหรับค้นหาโพสต์บน X (เดิมคือ Twitter) และเครื่องมือ `code_execution` ได้ด้วย หากคุณเก็บคีย์ไว้ใต้ `plugins.entries.xai.config.webSearch.apiKey` OpenClaw จะนำคีย์นั้นกลับมาใช้เป็นตัวสำรองสำหรับผู้ให้บริการโมเดล xAI ที่รวมมาให้ด้วย

สำหรับเมตริกระดับโพสต์ของ X เช่น การรีโพสต์ การตอบกลับ บุ๊กมาร์ก หรือยอดดู ควรใช้ `x_search` พร้อม URL โพสต์หรือ status ID ที่ตรงกันแทนการใช้คำค้นหาแบบกว้าง

## การเริ่มใช้งานและการกำหนดค่า

หากคุณเลือก **Grok** ระหว่าง:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw สามารถใช้โปรไฟล์ xAI OAuth ที่มีอยู่ได้โดยไม่ต้องถามหาคีย์ค้นหาเว็บแยกต่างหาก หาก OAuth ไม่พร้อมใช้งาน ระบบจะย้อนกลับไปใช้การตั้งค่าคีย์ API ของ xAI แทน OpenClaw ยังสามารถแสดงขั้นตอนติดตามผลแยกต่างหากเพื่อเปิดใช้ `x_search` ด้วยข้อมูลรับรอง xAI เดียวกันได้ด้วย ขั้นตอนติดตามผลนั้น:

- ปรากฏเฉพาะหลังจากที่คุณเลือก Grok สำหรับ `web_search`
- ไม่ใช่ตัวเลือกผู้ให้บริการค้นหาเว็บระดับบนสุดแยกต่างหาก
- สามารถตั้งค่าโมเดล `x_search` ในโฟลว์เดียวกันได้หากต้องการ

หากคุณข้ามขั้นตอนนี้ คุณสามารถเปิดใช้หรือเปลี่ยน `x_search` ภายหลังได้ในการกำหนดค่า

## ลงชื่อเข้าใช้หรือรับคีย์ API

<Steps>
  <Step title="ใช้ xAI OAuth">
    หากคุณลงชื่อเข้าใช้ด้วย xAI แล้วระหว่างการเริ่มใช้งานหรือการยืนยันตัวตนโมเดล ให้เลือก Grok เป็นผู้ให้บริการ `web_search` ไม่จำเป็นต้องใช้คีย์ API แยกต่างหาก:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="ใช้คีย์ API เป็นตัวสำรอง">
    รับคีย์ API จาก [xAI](https://console.x.ai/) เมื่อ OAuth ไม่พร้อมใช้งาน หรือเมื่อคุณตั้งใจต้องการการกำหนดค่าการค้นหาเว็บที่อิงคีย์
  </Step>
  <Step title="เก็บคีย์">
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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

**ทางเลือกของข้อมูลรับรอง:** ลงชื่อเข้าใช้ด้วย `openclaw models auth login
--provider xai --method oauth` ตั้งค่า `XAI_API_KEY` ในสภาพแวดล้อมของ Gateway หรือเก็บ `plugins.entries.xai.config.webSearch.apiKey` สำหรับการติดตั้ง gateway ให้ใส่ตัวแปรสภาพแวดล้อมใน `~/.openclaw/.env`

## วิธีทำงาน

Grok ใช้คำตอบของ xAI ที่อ้างอิงข้อมูลจากเว็บเพื่อสังเคราะห์คำตอบพร้อมการอ้างอิงแบบอินไลน์ คล้ายกับแนวทางการอ้างอิง Google Search ของ Gemini

## พารามิเตอร์ที่รองรับ

การค้นหาของ Grok รองรับ `query`

`count` รองรับเพื่อความเข้ากันได้กับ `web_search` แบบใช้ร่วมกัน แต่ Grok ยังคงส่งคืนคำตอบสังเคราะห์หนึ่งรายการพร้อมการอ้างอิง แทนที่จะเป็นรายการผลลัพธ์ N รายการ

ตัวกรองเฉพาะผู้ให้บริการยังไม่รองรับในขณะนี้

Grok ใช้ค่าหมดเวลาเริ่มต้นเฉพาะผู้ให้บริการที่ 60 วินาที เพราะการค้นหา xAI Responses ที่อ้างอิงข้อมูลจากเว็บอาจทำงานนานกว่าค่าเริ่มต้นของ `web_search` แบบใช้ร่วมกัน ตั้งค่า `tools.web.search.timeoutSeconds` เพื่อแทนที่ค่านี้

## การแทนที่ Base URL

ตั้งค่า `plugins.entries.xai.config.webSearch.baseUrl` เมื่อการค้นหาเว็บของ Grok ควรถูกส่งผ่านพร็อกซีของผู้ปฏิบัติงานหรือปลายทาง Responses ที่เข้ากันได้กับ xAI OpenClaw จะโพสต์ไปยัง `<baseUrl>/responses` หลังจากตัดเครื่องหมายทับท้ายออกแล้ว `x_search` ใช้ตัวสำรอง `webSearch.baseUrl` เดียวกัน เว้นแต่จะตั้งค่า `plugins.entries.xai.config.xSearch.baseUrl`

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [x_search ใน Web Search](/th/tools/web#x_search) -- การค้นหา X ระดับชั้นหนึ่งผ่าน xAI
- [Gemini Search](/th/tools/gemini-search) -- คำตอบที่ AI สังเคราะห์ผ่านการอ้างอิงของ Google
