---
read_when:
    - คุณต้องการค้นหาเว็บโดยไม่ใช้คีย์ API
    - คุณต้องการ Search API แบบชำระเงินของ Parallel
    - คุณต้องการข้อความคัดตอนที่กระชับและจัดอันดับตามประสิทธิภาพในการใช้บริบทของ LLM
summary: การค้นหาแบบขนาน -- ข้อความคัดย่อแบบกระชับจากแหล่งข้อมูลบนเว็บที่ปรับให้เหมาะกับ LLM
title: การค้นหาแบบขนาน
x-i18n:
    generated_at: "2026-07-12T16:52:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel มีผู้ให้บริการ `web_search` ของ [Parallel](https://parallel.ai/) สองราย โดยทั้งคู่ส่งคืนข้อความคัดย่อที่จัดอันดับและปรับให้เหมาะกับ LLM จากดัชนีเว็บที่สร้างขึ้นสำหรับเอเจนต์ AI:

| ผู้ให้บริการ            | id              | การยืนยันตัวตน                                                                            |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search (ฟรี)  | `parallel-free` | ไม่ต้องใช้ -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) ฟรีของ Parallel |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- Search API แบบชำระเงิน มีขีดจำกัดอัตราที่สูงกว่าและปรับแต่งตามวัตถุประสงค์ได้ |

ตั้งค่า `tools.web.search.provider` เป็น `parallel-free` หรือ `parallel` เพื่อเลือก
อย่างใดอย่างหนึ่งอย่างชัดเจน โดยระบบจะไม่ตรวจหาโดยอัตโนมัติทั้งสองแบบ

<Note>
  โมเดล OpenAI Responses แบบโดยตรง (`api: "openai-responses"`, ผู้ให้บริการ
  `openai`, URL ฐานของ API อย่างเป็นทางการ) จะใช้การค้นหาเว็บแบบเนทีฟที่โฮสต์โดย OpenAI
  โดยอัตโนมัติเมื่อไม่ได้ตั้งค่า `tools.web.search.provider`, ตั้งเป็นค่าว่าง, `"auto"`
  หรือ `"openai"` ดังนั้นโดยค่าเริ่มต้นโมเดลเหล่านี้จะข้าม Parallel ให้ตั้งค่า
  `tools.web.search.provider` เป็น `parallel-free` หรือ `parallel` เพื่อกำหนดเส้นทาง
  ผ่าน Parallel แทน ดู [ภาพรวมการค้นหาเว็บ](/th/tools/web)
</Note>

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## คีย์ API (ผู้ให้บริการแบบชำระเงิน)

`parallel-free` ไม่ต้องใช้คีย์ แต่ยังคงต้องเลือกอย่างชัดเจน ส่วนผู้ให้บริการแบบชำระเงิน
`parallel` ต้องใช้คีย์ API:

<Steps>
  <Step title="สร้างบัญชี">
    ลงทะเบียนที่ [platform.parallel.ai](https://platform.parallel.ai) และ
    สร้างคีย์ API จากแดชบอร์ดของคุณ
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `PARALLEL_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

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
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" for the free Search MCP, or "parallel" for the
        // paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**ทางเลือกด้วยตัวแปรสภาพแวดล้อม:** ตั้งค่า `PARALLEL_API_KEY` ในสภาพแวดล้อมของ
Gateway สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## การแทนที่ URL ฐาน

ใช้กับผู้ให้บริการแบบชำระเงิน `parallel` เท่านั้น ส่วน `parallel-free` จะใช้
`https://search.parallel.ai/mcp` เสมอและไม่สนใจการตั้งค่านี้

ตั้งค่า `plugins.entries.parallel.config.webSearch.baseUrl` เพื่อกำหนดเส้นทางคำขอ
แบบชำระเงินผ่านพร็อกซีที่เข้ากันได้หรือปลายทางอื่น (ตัวอย่างเช่น
Cloudflare AI Gateway) OpenClaw จะปรับโฮสต์เปล่าให้เป็นรูปแบบมาตรฐานโดยเติม
`https://` ไว้ข้างหน้า และเติม `/v1/search` ต่อท้าย เว้นแต่พาธจะลงท้ายด้วยส่วนดังกล่าวอยู่แล้ว
ปลายทางที่ได้จากการแก้ค่าจะเป็นส่วนหนึ่งของคีย์แคชการค้นหา ดังนั้นผลลัพธ์จากปลายทาง
ที่แตกต่างกันจะไม่ถูกใช้ร่วมกัน

## พารามิเตอร์ของเครื่องมือ

ผู้ให้บริการทั้งสองเปิดเผยรูปแบบการค้นหาแบบเนทีฟของ Parallel เพื่อให้โมเดลกรอก
เป้าหมายด้วยภาษาธรรมชาติพร้อมคำค้นแบบคีย์เวิร์ดสั้น ๆ จำนวนหนึ่ง ซึ่งเป็นการจับคู่ที่
Parallel [แนะนำ](https://docs.parallel.ai/search/best-practices) เพื่อให้ได้
ผลลัพธ์ที่ดีที่สุด

<ParamField path="objective" type="string" required>
คำอธิบายด้วยภาษาธรรมชาติของคำถามหรือเป้าหมายเบื้องหลัง (สูงสุด 5,000
อักขระ) ควรมีข้อมูลครบถ้วนในตัวเอง
</ParamField>

<ParamField path="search_queries" type="string[]" required>
คำค้นแบบคีย์เวิร์ดที่กระชับ คำละ 3-6 คำ (1-5 รายการ สูงสุดรายการละ 200
อักขระ) ระบุคำค้นที่หลากหลาย 2-3 รายการเพื่อให้ได้ผลลัพธ์ที่ดีที่สุด
</ParamField>

<ParamField path="count" type="number">
จำนวนผลลัพธ์ที่จะส่งคืน (1-40)
</ParamField>

<ParamField path="session_id" type="string">
รหัสเซสชัน Parallel ที่เลือกใช้ได้จาก `sessionId` ของผลลัพธ์ก่อนหน้า ส่งรหัสนี้
ในการค้นหาต่อเนื่องภายในงานเดียวกัน เพื่อให้ Parallel จัดกลุ่มการเรียกที่เกี่ยวข้องและ
ปรับปรุงผลลัพธ์ถัดไป จำกัดสูงสุด 1,000 อักขระสำหรับ `parallel` ส่วน Search MCP
แบบฟรี `parallel-free` จำกัดไว้ที่ 100 อักขระ รหัสที่เกินขีดจำกัดจะถูกตัดทิ้ง
(แบบชำระเงิน) หรือสร้างรหัสใหม่ (แบบฟรี)
</ParamField>

<ParamField path="client_model" type="string">
ตัวระบุของโมเดลที่เรียกใช้งานซึ่งเลือกใช้ได้ (เช่น `claude-opus-4-7`,
`gpt-5.6-sol`) สูงสุด 100 อักขระ ช่วยให้ Parallel ปรับการตั้งค่าเริ่มต้นให้เหมาะกับ
ความสามารถของโมเดลของคุณ ส่ง slug ที่ตรงกับโมเดลที่ใช้งานอยู่ทุกประการ อย่าย่อเป็น
นามแฝงของตระกูลโมเดล
</ParamField>

## หมายเหตุ

- Parallel จัดอันดับและบีบอัดผลลัพธ์เพื่อประโยชน์ต่อการให้เหตุผลของ LLM ไม่ใช่เพื่อให้มนุษย์
  คลิกเข้าไปอ่าน โดยควรคาดหวังข้อความคัดย่อที่มีเนื้อหาเข้มข้นต่อผลลัพธ์ แทนเนื้อหา
  แบบเต็มหน้า
- ข้อความคัดย่อของผลลัพธ์จะส่งกลับมาในอาร์เรย์ `excerpts` และยังถูกรวมไว้ใน
  `description` เพื่อให้เข้ากันได้กับสัญญาทั่วไปของ `web_search`
- ผู้ให้บริการทั้งสองส่งคืน `session_id` โดย OpenClaw จะแสดงค่านี้เป็น `sessionId` ใน
  เพย์โหลดของเครื่องมือ เพื่อให้ผู้เรียกจัดกลุ่มการค้นหาต่อเนื่องได้ รหัสเซสชันที่
  Parallel สร้างขึ้น (ซึ่งผู้เรียกไม่ได้ระบุเอง) จะไม่รวมอยู่ในรายการแคช เนื่องจาก
  งานที่ไม่เกี่ยวข้องกันแต่ใช้คำค้นเหมือนกันไม่ควรรับช่วงรหัสดังกล่าว
- ค่า `searchId`, `warnings` และ `usage` จาก Parallel จะถูกส่งผ่านเมื่อมีค่าเหล่านี้
- OpenClaw จะส่งต่อจำนวนผลลัพธ์ที่แก้ค่าแล้วไปยัง Parallel เป็น
  `advanced_settings.max_results` (`parallel`) เสมอ หรือใช้ `count`
  ฝั่งไคลเอนต์หลังจากได้รับการตอบกลับขนาดคงที่จาก Parallel (`parallel-free`)
  อาร์กิวเมนต์ `count` ของผู้เรียกมีลำดับความสำคัญสูงสุด ตามด้วย `tools.web.search.maxResults`
  หากไม่มีทั้งคู่จะใช้ค่าเริ่มต้นทั่วไปของ `web_search` ใน OpenClaw (5) ขณะที่ API
  ของ Parallel เองมีค่าเริ่มต้นเป็น 10
- โดยค่าเริ่มต้น ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาที (`cacheTtlMinutes`)
- `parallel-free` จะสร้าง `session_id` ใหม่สำหรับการเรียกแต่ละครั้งผ่านการจับมือของ MCP
  เมื่อผู้เรียกไม่ได้ระบุค่า ส่วน `parallel` จะปล่อยค่าไว้โดยไม่ตั้งในกรณีดังกล่าว

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [การค้นหาด้วย Exa](/th/tools/exa-search) -- การค้นหาแบบโครงข่ายประสาทพร้อมการแยกเนื้อหา
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
