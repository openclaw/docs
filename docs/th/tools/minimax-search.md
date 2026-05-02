---
read_when:
    - คุณต้องการใช้ MiniMax สำหรับ web_search
    - คุณต้องมีคีย์ MiniMax Token Plan หรือโทเค็น OAuth
    - คุณต้องการคำแนะนำเกี่ยวกับโฮสต์การค้นหาของ MiniMax CN/global
summary: การค้นหา MiniMax ผ่าน API การค้นหาของ Token Plan
title: การค้นหา MiniMax
x-i18n:
    generated_at: "2026-05-02T10:31:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw รองรับ MiniMax เป็นผู้ให้บริการ `web_search` ผ่าน API การค้นหา MiniMax
Token Plan โดยส่งคืนผลการค้นหาแบบมีโครงสร้างพร้อมชื่อเรื่อง, URL,
ข้อความตัวอย่าง และคำค้นหาที่เกี่ยวข้อง

## รับข้อมูลรับรอง Token Plan

<Steps>
  <Step title="สร้างคีย์">
    สร้างหรือคัดลอกคีย์ MiniMax Token Plan จาก
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    การตั้งค่า OAuth สามารถใช้ `MINIMAX_OAUTH_TOKEN` ซ้ำแทนได้
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `MINIMAX_CODE_PLAN_KEY` ในสภาพแวดล้อม Gateway หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ยังยอมรับ `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` และ
`MINIMAX_API_KEY` เป็นนามแฝง env ด้วย `MINIMAX_API_KEY` ควรชี้ไปยัง
ข้อมูลรับรอง Token Plan ที่เปิดใช้งานการค้นหาแล้ว; คีย์ API โมเดล MiniMax
ทั่วไปอาจไม่ได้รับการยอมรับโดยปลายทางการค้นหา Token Plan

## การกำหนดค่า

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**ทางเลือกด้วยสภาพแวดล้อม:** ตั้งค่า `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` ในสภาพแวดล้อม Gateway
สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## การเลือกภูมิภาค

MiniMax Search ใช้ปลายทางเหล่านี้:

- ทั่วโลก: `https://api.minimax.io/v1/coding_plan/search`
- จีน: `https://api.minimaxi.com/v1/coding_plan/search`

หากไม่ได้ตั้งค่า `plugins.entries.minimax.config.webSearch.region` ไว้ OpenClaw จะระบุ
ภูมิภาคตามลำดับนี้:

1. `tools.web.search.minimax.region` / `webSearch.region` ที่ Plugin เป็นเจ้าของ
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

นั่นหมายความว่าการเริ่มใช้งานในจีนหรือ `MINIMAX_API_HOST=https://api.minimaxi.com/...`
จะทำให้ MiniMax Search ใช้โฮสต์จีนโดยอัตโนมัติด้วย

แม้คุณจะยืนยันตัวตน MiniMax ผ่านเส้นทาง OAuth `minimax-portal`
การค้นหาเว็บยังคงลงทะเบียนเป็นรหัสผู้ให้บริการ `minimax`; URL ฐานของผู้ให้บริการ OAuth
จะถูกใช้เป็นคำใบ้ภูมิภาคสำหรับการเลือกโฮสต์จีน/ทั่วโลก และ `MINIMAX_OAUTH_TOKEN`
สามารถใช้เป็นข้อมูลรับรอง bearer สำหรับ MiniMax Search ได้

## พารามิเตอร์ที่รองรับ

MiniMax Search รองรับ:

- `query`
- `count` (OpenClaw ตัดรายการผลลัพธ์ที่ส่งคืนให้เหลือจำนวนที่ร้องขอ)

ขณะนี้ยังไม่รองรับตัวกรองเฉพาะผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [MiniMax](/th/providers/minimax) -- การตั้งค่าโมเดล, รูปภาพ, คำพูด และการยืนยันตัวตน
