---
read_when:
    - คุณต้องการใช้ MiniMax สำหรับ web_search
    - คุณต้องมีคีย์ MiniMax Token Plan หรือโทเค็น OAuth
    - คุณต้องการคำแนะนำเกี่ยวกับโฮสต์การค้นหาของ MiniMax สำหรับจีน/ทั่วโลก
summary: การค้นหาด้วย MiniMax ผ่าน API การค้นหาของ Token Plan
title: การค้นหา MiniMax
x-i18n:
    generated_at: "2026-07-20T06:09:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb851614bbe43f011e07fe3e80d5390f1ba515f3e00ba749c91999617ad2d1e2
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw รองรับ MiniMax เป็นผู้ให้บริการ `web_search` ผ่าน API การค้นหาของ MiniMax
Token Plan โดยจะส่งคืนผลการค้นหาแบบมีโครงสร้าง ซึ่งประกอบด้วยชื่อเรื่อง, URL,
ข้อความตัวอย่าง และคำค้นหาที่เกี่ยวข้อง

## รับข้อมูลประจำตัว Token Plan

<Steps>
  <Step title="สร้างคีย์">
    สร้างหรือคัดลอกคีย์ MiniMax Token Plan จาก
    [แพลตฟอร์ม MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key)
    การตั้งค่า OAuth สามารถนำ `MINIMAX_OAUTH_TOKEN` มาใช้ซ้ำแทนได้
  </Step>
  <Step title="จัดเก็บคีย์">
    ตั้งค่า `MINIMAX_CODE_PLAN_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าผ่าน:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ยังยอมรับ `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` และ
`MINIMAX_API_KEY` เป็นนามแฝงของตัวแปรสภาพแวดล้อม โดยตรวจสอบตามลำดับดังกล่าวหลังจาก
`MINIMAX_CODE_PLAN_KEY` ทั้งนี้ `MINIMAX_API_KEY` ควรชี้ไปยัง
ข้อมูลประจำตัว Token Plan ที่เปิดใช้การค้นหา ส่วนคีย์ API ของโมเดล MiniMax ทั่วไปอาจไม่ได้รับการยอมรับจาก
ปลายทางการค้นหาของ Token Plan

## การกำหนดค่า

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // ไม่บังคับหากตั้งค่าตัวแปรสภาพแวดล้อม MiniMax Token Plan ไว้
            region: "global", // หรือ "cn"
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

**ทางเลือกด้วยตัวแปรสภาพแวดล้อม:** ตั้งค่า `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` ในสภาพแวดล้อมของ Gateway
สำหรับการติดตั้ง Gateway ให้ใส่ไว้ใน `~/.openclaw/.env`

## การเลือกภูมิภาค

MiniMax Search ใช้ปลายทางต่อไปนี้:

- ทั่วโลก: `https://api.minimax.io/v1/coding_plan/search`
- จีน: `https://api.minimaxi.com/v1/coding_plan/search`

หากไม่ได้ตั้งค่า `plugins.entries.minimax.config.webSearch.region` OpenClaw จะระบุ
ภูมิภาคตามลำดับต่อไปนี้:

1. `webSearch.region` ที่ Plugin เป็นเจ้าของ
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

ซึ่งหมายความว่าการเริ่มต้นใช้งานในภูมิภาคจีนหรือ `MINIMAX_API_HOST=https://api.minimaxi.com/...`
จะทำให้ MiniMax Search ใช้โฮสต์ในภูมิภาคจีนโดยอัตโนมัติเช่นกัน

แม้ว่าจะยืนยันตัวตนกับ MiniMax ผ่านเส้นทาง OAuth `minimax-portal`
การค้นหาเว็บยังคงลงทะเบียนด้วย ID ผู้ให้บริการ `minimax`; URL ฐานของผู้ให้บริการ OAuth
จะใช้เป็นคำใบ้ภูมิภาคเพื่อเลือกโฮสต์จีน/ทั่วโลก และ `MINIMAX_OAUTH_TOKEN`
สามารถใช้เป็นข้อมูลประจำตัว bearer สำหรับ MiniMax Search ได้

## พารามิเตอร์ที่รองรับ

| พารามิเตอร์ | ชนิด    | ข้อจำกัด     | คำอธิบาย                                                                 |
| --------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `query`   | string  | จำเป็น        | สตริงคำค้นหา                                                        |
| `count`   | integer | 1-10, ค่าเริ่มต้น 5 | จำนวนผลลัพธ์ที่ส่งคืน OpenClaw จะตัดรายการที่ส่งคืนให้เหลือเท่ากับจำนวนนี้ |

ขณะนี้ยังไม่รองรับตัวกรองเฉพาะผู้ให้บริการ

## ที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [MiniMax](/th/providers/minimax) -- การตั้งค่าโมเดล, รูปภาพ, เสียงพูด และการยืนยันตัวตน
