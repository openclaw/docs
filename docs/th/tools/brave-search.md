---
read_when:
    - คุณต้องการใช้ Brave Search สำหรับ web_search
    - คุณต้องมี BRAVE_API_KEY หรือรายละเอียดแผน
summary: การตั้งค่า Brave Search API สำหรับ web_search
title: การค้นหาด้วย Brave
x-i18n:
    generated_at: "2026-05-06T09:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw รองรับ Brave Search API เป็นผู้ให้บริการ `web_search`

## รับคีย์ API

1. สร้างบัญชี Brave Search API ที่ [https://brave.com/search/api/](https://brave.com/search/api/)
2. ในแดชบอร์ด เลือกแพลน **Search** แล้วสร้างคีย์ API
3. เก็บคีย์ไว้ในคอนฟิกหรือตั้งค่า `BRAVE_API_KEY` ในสภาพแวดล้อมของ Gateway

## ตัวอย่างคอนฟิก

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

การตั้งค่าการค้นหา Brave เฉพาะผู้ให้บริการตอนนี้อยู่ใต้ `plugins.entries.brave.config.webSearch.*`
ค่าเดิม `tools.web.search.apiKey` ยังโหลดผ่าน compatibility shim ได้ แต่ไม่ใช่เส้นทางคอนฟิกมาตรฐานอีกต่อไป

`webSearch.mode` ควบคุมการส่งข้อมูลของ Brave:

- `web` (ค่าเริ่มต้น): การค้นหาเว็บ Brave ปกติพร้อมชื่อเรื่อง, URL และข้อความตัวอย่าง
- `llm-context`: Brave LLM Context API พร้อมชิ้นส่วนข้อความและแหล่งที่มาที่ดึงไว้ล่วงหน้าเพื่อใช้เป็นหลักฐานอ้างอิง

`webSearch.baseUrl` สามารถชี้คำขอ Brave ไปยังพร็อกซีหรือ Gateway ที่เข้ากันได้กับ Brave และเชื่อถือได้ OpenClaw จะต่อท้าย `/res/v1/web/search` หรือ `/res/v1/llm/context` เข้ากับ URL ฐานที่กำหนดค่าไว้ และเก็บ URL ฐานไว้ในคีย์แคช ปลายทางสาธารณะต้องใช้ `https://`; ยอมรับ `http://` เฉพาะสำหรับโฮสต์พร็อกซีแบบ loopback หรือเครือข่ายส่วนตัวที่เชื่อถือได้เท่านั้น

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
รหัสภาษาการค้นหาของ Brave (เช่น `en`, `en-gb`, `zh-hans`)
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

- OpenClaw ใช้แพลน **Search** ของ Brave หากคุณมีการสมัครใช้งานแบบเดิม (เช่น แพลน Free ดั้งเดิมที่มี 2,000 คำค้นหา/เดือน) การสมัครใช้งานนั้นยังใช้ได้ แต่จะไม่รวมฟีเจอร์ใหม่กว่า เช่น LLM Context หรือขีดจำกัดอัตราที่สูงขึ้น
- แต่ละแพลนของ Brave มี **\$5/เดือนเป็นเครดิตฟรี** (ต่ออายุใหม่) แพลน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตฟรีจึงครอบคลุม 1,000 คำค้นหา/เดือน ตั้งค่าขีดจำกัดการใช้งานของคุณในแดชบอร์ด Brave เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด ดูแพลนปัจจุบันได้ที่ [พอร์ทัล Brave API](https://brave.com/search/api/)
- แพลน Search รวมปลายทาง LLM Context และสิทธิ์การอนุมาน AI การจัดเก็บผลลัพธ์เพื่อฝึกหรือปรับแต่งโมเดลต้องใช้แพลนที่มีสิทธิ์การจัดเก็บอย่างชัดเจน ดู [ข้อกำหนดการให้บริการ](https://api-dashboard.search.brave.com/terms-of-service) ของ Brave
- โหมด `llm-context` ส่งคืนรายการแหล่งที่มาที่มีหลักฐานอ้างอิงแทนรูปแบบข้อความตัวอย่างการค้นหาเว็บตามปกติ
- โหมด `llm-context` รองรับ `freshness` และช่วง `date_after` + `date_before` ที่มีขอบเขต ไม่รองรับ `ui_lang`; `date_before` ที่ไม่มี `date_after` จะถูกปฏิเสธ เพราะ Brave กำหนดให้ช่วงความสดแบบกำหนดเองต้องมีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
- `ui_lang` ต้องมีแท็กย่อยของภูมิภาค เช่น `en-US`
- ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาทีตามค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)
- ค่า `webSearch.baseUrl` แบบกำหนดเองจะรวมอยู่ในตัวตนแคชของ Brave ดังนั้นการตอบกลับเฉพาะพร็อกซีจะไม่ชนกัน
- เปิดใช้แฟล็กวินิจฉัย `brave.http` เพื่อบันทึก URL/พารามิเตอร์คำค้นหาของคำขอ Brave, สถานะ/เวลาตอบกลับ และเหตุการณ์ hit/miss/write ของแคชการค้นหาระหว่างแก้ปัญหา แฟล็กนี้จะไม่บันทึกคีย์ API หรือเนื้อหาการตอบกลับ แต่คำค้นหาอาจเป็นข้อมูลละเอียดอ่อน

## ที่เกี่ยวข้อง

- [ภาพรวม Web Search](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจจับอัตโนมัติ
- [Perplexity Search](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
- [Exa Search](/th/tools/exa-search) -- การค้นหาแบบนิวรัลพร้อมการดึงเนื้อหา
