---
read_when:
    - คุณต้องการใช้ Brave Search สำหรับ web_search
    - คุณต้องมี BRAVE_API_KEY หรือรายละเอียดแพ็กเกจ
summary: การตั้งค่า Brave Search API สำหรับ web_search
title: การค้นหาของ Brave
x-i18n:
    generated_at: "2026-07-20T06:06:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52168db93abb564eda5868584261e0530ce3cff57c3463a2fc1eded351df30f2
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw รองรับ Brave Search API เป็นผู้ให้บริการ `web_search`

## รับคีย์ API

1. สร้างบัญชี Brave Search API ที่ [https://brave.com/search/api/](https://brave.com/search/api/)
2. ในแดชบอร์ด ให้เลือกแผน **Search** และสร้างคีย์ API
3. จัดเก็บคีย์ไว้ในการกำหนดค่า หรือตั้งค่า `BRAVE_API_KEY` ในสภาพแวดล้อมของ Gateway

## ตัวอย่างการกำหนดค่า

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // หรือ "llm-context"
            baseUrl: "https://api.search.brave.com", // การแทนที่พร็อกซี/URL ฐานที่ไม่บังคับ
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

การตั้งค่าการค้นหาเฉพาะผู้ให้บริการของ Brave อยู่ภายใต้ `plugins.entries.brave.config.webSearch.*` ซึ่งเป็นพาธการกำหนดค่ามาตรฐาน

`webSearch.mode` ควบคุมการรับส่งข้อมูลของ Brave:

- `web` (ค่าเริ่มต้น): การค้นหาเว็บ Brave ตามปกติ พร้อมชื่อเรื่อง URL และข้อความย่อ
- `llm-context`: Brave LLM Context API พร้อมส่วนข้อความและแหล่งข้อมูลที่แยกไว้ล่วงหน้าสำหรับใช้อ้างอิงข้อเท็จจริง

`webSearch.baseUrl` สามารถกำหนดให้ส่งคำขอ Brave ไปยังพร็อกซี
หรือ Gateway ที่เชื่อถือได้และเข้ากันได้กับ Brave โดย OpenClaw จะต่อท้าย `/res/v1/web/search` หรือ `/res/v1/llm/context` เข้ากับ
URL ฐานที่กำหนดค่าไว้ และรวม URL ฐานไว้ในคีย์แคช ปลายทาง
สาธารณะต้องใช้ `https://`; ยอมรับ `http://` เฉพาะสำหรับโฮสต์พร็อกซีแบบลูปแบ็ก
หรือเครือข่ายส่วนตัวที่เชื่อถือได้เท่านั้น

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่ต้องการส่งคืน (1–10)
</ParamField>

<ParamField path="country" type="string">
รหัสประเทศ ISO แบบ 2 ตัวอักษร (เช่น `US`, `DE`)
</ParamField>

<ParamField path="language" type="string">
รหัสภาษา ISO 639-1 สำหรับผลการค้นหา (เช่น `en`, `de`, `fr`)
</ParamField>

<ParamField path="search_lang" type="string">
รหัสภาษาสำหรับการค้นหาของ Brave (เช่น `en`, `en-gb`, `zh-hans`)
</ParamField>

<ParamField path="ui_lang" type="string">
รหัสภาษา ISO สำหรับองค์ประกอบ UI
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
ตัวกรองเวลา — `day` หมายถึง 24 ชั่วโมง
</ParamField>

<ParamField path="date_after" type="string">
เฉพาะผลลัพธ์ที่เผยแพร่หลังวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="date_before" type="string">
เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

**ตัวอย่าง:**

```javascript
// การค้นหาเฉพาะประเทศและภาษา
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// ผลลัพธ์ล่าสุด (สัปดาห์ที่ผ่านมา)
await web_search({
  query: "AI news",
  freshness: "week",
});

// การค้นหาตามช่วงวันที่
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## หมายเหตุ

- OpenClaw ใช้แผน **Search** ของ Brave หากมีการสมัครสมาชิกแบบเดิม (เช่น แผน Free ดั้งเดิมที่ให้ 2,000 คำค้นหาต่อเดือน) แผนนั้นจะยังคงใช้ได้ แต่ไม่รวมคุณสมบัติใหม่กว่า เช่น LLM Context หรือขีดจำกัดอัตราที่สูงขึ้น
- แต่ละแผนของ Brave มี **เครดิตฟรี \$5 ต่อเดือน** (ต่ออายุทุกเดือน) แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตจึงครอบคลุม 1,000 คำค้นหาต่อเดือน ตั้งค่าขีดจำกัดการใช้งานในแดชบอร์ด Brave เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด ดูแผนปัจจุบันได้ที่ [พอร์ทัล Brave API](https://brave.com/search/api/)
- แผน Search รวมปลายทาง LLM Context และสิทธิ์ในการอนุมานด้วย AI การจัดเก็บผลลัพธ์เพื่อฝึกหรือปรับแต่งโมเดลต้องใช้แผนที่ให้สิทธิ์ในการจัดเก็บอย่างชัดเจน ดู[ข้อกำหนดในการให้บริการ](https://api-dashboard.search.brave.com/terms-of-service)ของ Brave
- โหมด `llm-context` ส่งคืนรายการแหล่งข้อมูลที่ใช้อ้างอิงข้อเท็จจริง แทนรูปแบบข้อความย่อจากการค้นหาเว็บตามปกติ
- โหมด `llm-context` รองรับ `freshness` และช่วง `date_after` + `date_before` ที่มีขอบเขตจำกัด แต่ไม่รองรับ `ui_lang`; ระบบจะปฏิเสธ `date_before` ที่ไม่มี `date_after` เนื่องจาก Brave กำหนดให้ช่วงเวลาความใหม่แบบกำหนดเองต้องมีทั้งวันที่เริ่มต้นและสิ้นสุด
- `ui_lang` ต้องมีแท็กย่อยของภูมิภาค เช่น `en-US`
- โดยค่าเริ่มต้น ระบบจะแคชผลลัพธ์ไว้ 15 นาที (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)
- ค่า `webSearch.baseUrl` ที่กำหนดเองจะรวมอยู่ในข้อมูลระบุตัวตนของแคช Brave ดังนั้น
  การตอบกลับเฉพาะพร็อกซีจึงไม่ทับซ้อนกัน
- เปิดใช้แฟล็กการวินิจฉัย `brave.http` เพื่อบันทึก URL/พารามิเตอร์คำค้นหาของคำขอ Brave, สถานะ/ระยะเวลาการตอบกลับ และเหตุการณ์พบ/ไม่พบ/เขียนแคชการค้นหาระหว่างการแก้ไขปัญหา แฟล็กนี้จะไม่บันทึกคีย์ API หรือเนื้อหาการตอบกลับ แต่คำค้นหาอาจเป็นข้อมูลละเอียดอ่อน

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบโครงข่ายประสาทพร้อมการแยกเนื้อหา
