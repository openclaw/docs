---
read_when:
    - คุณต้องการใช้ Brave Search สำหรับ web_search
    - คุณต้องมี BRAVE_API_KEY หรือรายละเอียดของแผน
summary: การตั้งค่า Brave Search API สำหรับ web_search
title: การค้นหาด้วย Brave
x-i18n:
    generated_at: "2026-05-02T10:29:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw รองรับ Brave Search API เป็นผู้ให้บริการ `web_search`

## รับ API key

1. สร้างบัญชี Brave Search API ที่ [https://brave.com/search/api/](https://brave.com/search/api/)
2. ในแดชบอร์ด เลือกแผน **Search** แล้วสร้าง API key
3. เก็บ key ไว้ใน config หรือตั้งค่า `BRAVE_API_KEY` ในสภาพแวดล้อมของ Gateway

## ตัวอย่าง Config

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

ตอนนี้การตั้งค่าการค้นหา Brave เฉพาะผู้ให้บริการอยู่ภายใต้ `plugins.entries.brave.config.webSearch.*`
`tools.web.search.apiKey` แบบเดิมยังโหลดผ่านชิมความเข้ากันได้ แต่ไม่ใช่เส้นทาง config หลักอีกต่อไป

`webSearch.mode` ควบคุมการส่งข้อมูลของ Brave:

- `web` (ค่าเริ่มต้น): การค้นหาเว็บ Brave ปกติพร้อมชื่อเรื่อง, URL และสรุปย่อ
- `llm-context`: Brave LLM Context API พร้อมชิ้นส่วนข้อความและแหล่งที่มาที่สกัดไว้ล่วงหน้าสำหรับการยึดโยงข้อมูล

`webSearch.baseUrl` สามารถชี้คำขอ Brave ไปยังพร็อกซีที่เข้ากันได้กับ Brave
หรือ gateway ที่เชื่อถือได้ OpenClaw จะต่อท้าย `/res/v1/web/search` หรือ `/res/v1/llm/context` กับ
URL ฐานที่กำหนดค่าไว้ และเก็บ URL ฐานไว้ใน cache key ปลายทางสาธารณะ
ต้องใช้ `https://`; `http://` ยอมรับเฉพาะสำหรับ loopback ที่เชื่อถือได้
หรือโฮสต์พร็อกซีเครือข่ายส่วนตัวเท่านั้น

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่จะส่งคืน (1–10)
</ParamField>

<ParamField path="country" type="string">
รหัสประเทศ ISO 2 ตัวอักษร (เช่น `US`, `DE`)
</ParamField>

<ParamField path="language" type="string">
รหัสภาษา ISO 639-1 สำหรับผลการค้นหา (เช่น `en`, `de`, `fr`)
</ParamField>

<ParamField path="search_lang" type="string">
รหัสภาษาค้นหาของ Brave (เช่น `en`, `en-gb`, `zh-hans`)
</ParamField>

<ParamField path="ui_lang" type="string">
รหัสภาษา ISO สำหรับองค์ประกอบ UI
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
ตัวกรองเวลา — `day` คือ 24 ชั่วโมง
</ParamField>

<ParamField path="date_after" type="string">
เฉพาะผลลัพธ์ที่เผยแพร่หลังวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

<ParamField path="date_before" type="string">
เฉพาะผลลัพธ์ที่เผยแพร่ก่อนวันที่นี้ (`YYYY-MM-DD`)
</ParamField>

**ตัวอย่าง:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## หมายเหตุ

- OpenClaw ใช้แผน **Search** ของ Brave หากคุณมีการสมัครสมาชิกแบบเดิม (เช่น แผน Free ดั้งเดิมที่มี 2,000 คำค้น/เดือน) การสมัครสมาชิกนั้นยังใช้งานได้ แต่จะไม่มีฟีเจอร์ใหม่กว่า เช่น LLM Context หรือขีดจำกัดอัตราที่สูงขึ้น
- แผนของ Brave แต่ละแผนมี **เครดิตใช้ฟรี \$5/เดือน** (ต่ออายุอัตโนมัติ) แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตจึงครอบคลุม 1,000 คำค้น/เดือน ตั้งค่าขีดจำกัดการใช้งานของคุณในแดชบอร์ด Brave เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด ดูแผนปัจจุบันได้ที่ [พอร์ทัล Brave API](https://brave.com/search/api/)
- แผน Search มีปลายทาง LLM Context และสิทธิ์การอนุมาน AI การจัดเก็บผลลัพธ์เพื่อฝึกหรือปรับแต่งโมเดลต้องใช้แผนที่มีสิทธิ์การจัดเก็บอย่างชัดเจน ดู [ข้อกำหนดในการให้บริการ](https://api-dashboard.search.brave.com/terms-of-service) ของ Brave
- โหมด `llm-context` ส่งคืนรายการแหล่งที่มาที่มีการยึดโยงข้อมูล แทนรูปแบบสรุปย่อของการค้นหาเว็บปกติ
- โหมด `llm-context` รองรับ `freshness` และช่วง `date_after` + `date_before` ที่มีขอบเขต โหมดนี้ไม่รองรับ `ui_lang`; `date_before` ที่ไม่มี `date_after` จะถูกปฏิเสธ เพราะ Brave กำหนดให้ช่วงความสดใหม่แบบกำหนดเองต้องมีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
- `ui_lang` ต้องมี subtag ภูมิภาค เช่น `en-US`
- ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)
- ค่า `webSearch.baseUrl` แบบกำหนดเองจะถูกรวมไว้ในอัตลักษณ์แคชของ Brave ดังนั้น
  การตอบกลับเฉพาะพร็อกซีจะไม่ชนกัน
- เปิดใช้แฟล็กวินิจฉัย `brave.http` เพื่อบันทึก URL/พารามิเตอร์คำค้นของคำขอ Brave, สถานะ/เวลาตอบกลับ และเหตุการณ์ hit/miss/write ของแคชการค้นหาระหว่างการแก้ปัญหา แฟล็กนี้จะไม่บันทึก API key หรือเนื้อหาการตอบกลับ แต่คำค้นหาอาจเป็นข้อมูลละเอียดอ่อน

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบนิวรัลพร้อมการสกัดเนื้อหา
