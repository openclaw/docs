---
read_when:
    - คุณต้องการใช้ Brave Search สำหรับ web_search
    - คุณต้องมี BRAVE_API_KEY หรือรายละเอียดแพ็กเกจ
summary: การตั้งค่า Brave Search API สำหรับ web_search
title: การค้นหาด้วย Brave
x-i18n:
    generated_at: "2026-07-12T16:44:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw รองรับ Brave Search API ในฐานะผู้ให้บริการ `web_search`

## รับคีย์ API

1. สร้างบัญชี Brave Search API ที่ [https://brave.com/search/api/](https://brave.com/search/api/)
2. ในแดชบอร์ด ให้เลือกแผน **Search** และสร้างคีย์ API
3. จัดเก็บคีย์ในการกำหนดค่า หรือตั้งค่า `BRAVE_API_KEY` ในสภาพแวดล้อมของ Gateway

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
            baseUrl: "https://api.search.brave.com", // การแทนที่พร็อกซี/URL ฐาน (ไม่บังคับ)
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

การตั้งค่าการค้นหาเฉพาะของผู้ให้บริการ Brave อยู่ภายใต้ `plugins.entries.brave.config.webSearch.*` ซึ่งเป็นพาธการกำหนดค่าหลัก `tools.web.search.apiKey` ระดับบนสุดที่ใช้ร่วมกันและ `tools.web.search.brave.*` ที่จำกัดขอบเขตยังคงโหลดได้ผ่านการผสานเพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรใช้พาธที่จำกัดขอบเขตเฉพาะ Plugin ด้านบน

`webSearch.mode` ควบคุมวิธีรับส่งข้อมูลของ Brave:

- `web` (ค่าเริ่มต้น): การค้นหาเว็บ Brave ตามปกติ พร้อมชื่อเรื่อง URL และข้อความย่อ
- `llm-context`: Brave LLM Context API พร้อมส่วนข้อความและแหล่งข้อมูลที่แยกไว้ล่วงหน้าสำหรับใช้อ้างอิงข้อมูล

`webSearch.baseUrl` สามารถกำหนดให้คำขอ Brave ส่งไปยังพร็อกซีหรือเกตเวย์ที่เข้ากันได้กับ Brave และเชื่อถือได้ OpenClaw จะต่อท้าย `/res/v1/web/search` หรือ `/res/v1/llm/context` เข้ากับ URL ฐานที่กำหนดค่าไว้ และรวม URL ฐานไว้ในคีย์แคช ปลายทางสาธารณะต้องใช้ `https://` ส่วน `http://` ยอมรับเฉพาะโฮสต์พร็อกซี local loopback ที่เชื่อถือได้หรือโฮสต์ในเครือข่ายส่วนตัวเท่านั้น

## พารามิเตอร์ของเครื่องมือ

<ParamField path="query" type="string" required>
คำค้นหา
</ParamField>

<ParamField path="count" type="number" default="5">
จำนวนผลลัพธ์ที่จะส่งคืน (1–10)
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
// ค้นหาเฉพาะประเทศและภาษา
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

// ค้นหาตามช่วงวันที่
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## หมายเหตุ

- OpenClaw ใช้แผน **Search** ของ Brave หากคุณมีการสมัครใช้งานแบบเดิม (เช่น แผน Free ดั้งเดิมที่รองรับ 2,000 คำค้นหาต่อเดือน) การสมัครดังกล่าวจะยังคงใช้ได้ แต่จะไม่รวมคุณสมบัติใหม่กว่า เช่น LLM Context หรือขีดจำกัดอัตราการใช้งานที่สูงขึ้น
- แผน Brave แต่ละแผนมี **เครดิตฟรี \$5 ต่อเดือน** (ต่ออายุใหม่ทุกเดือน) แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตจึงครอบคลุม 1,000 คำค้นหาต่อเดือน ตั้งค่าขีดจำกัดการใช้งานในแดชบอร์ด Brave เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด ดูแผนปัจจุบันได้ที่ [พอร์ทัล Brave API](https://brave.com/search/api/)
- แผน Search มีปลายทาง LLM Context และสิทธิ์การอนุมาน AI การจัดเก็บผลลัพธ์เพื่อฝึกหรือปรับแต่งโมเดลต้องใช้แผนที่ให้สิทธิ์การจัดเก็บไว้อย่างชัดเจน โปรดดู [ข้อกำหนดในการให้บริการ](https://api-dashboard.search.brave.com/terms-of-service) ของ Brave
- โหมด `llm-context` ส่งคืนรายการแหล่งข้อมูลที่ใช้อ้างอิงแทนโครงสร้างข้อความย่อของการค้นหาเว็บตามปกติ
- โหมด `llm-context` รองรับ `freshness` และช่วง `date_after` + `date_before` ที่มีขอบเขตจำกัด แต่ไม่รองรับ `ui_lang` และจะปฏิเสธ `date_before` ที่ไม่มี `date_after` เนื่องจาก Brave กำหนดให้ช่วงเวลาความสดใหม่แบบกำหนดเองต้องมีทั้งวันที่เริ่มต้นและวันที่สิ้นสุด
- `ui_lang` ต้องมีแท็กย่อยของภูมิภาค เช่น `en-US`
- ผลลัพธ์จะถูกแคชไว้ 15 นาทีโดยค่าเริ่มต้น (กำหนดค่าได้ผ่าน `cacheTtlMinutes`)
- ค่า `webSearch.baseUrl` แบบกำหนดเองจะรวมอยู่ในข้อมูลระบุแคชของ Brave ดังนั้นการตอบกลับเฉพาะของแต่ละพร็อกซีจึงไม่ชนกัน
- เปิดใช้งานแฟล็กการวินิจฉัย `brave.http` เพื่อบันทึก URL/พารามิเตอร์คำค้นหาของคำขอ Brave สถานะ/ระยะเวลาการตอบกลับ และเหตุการณ์พบ/ไม่พบ/เขียนแคชการค้นหาในระหว่างการแก้ไขปัญหา แฟล็กนี้จะไม่บันทึกคีย์ API หรือเนื้อหาการตอบกลับ แต่คำค้นหาอาจมีข้อมูลที่ละเอียดอ่อน

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการค้นหาเว็บ](/th/tools/web) -- ผู้ให้บริการทั้งหมดและการตรวจหาอัตโนมัติ
- [การค้นหาด้วย Perplexity](/th/tools/perplexity-search) -- ผลลัพธ์แบบมีโครงสร้างพร้อมการกรองโดเมน
- [การค้นหาด้วย Exa](/th/tools/exa-search) -- การค้นหาแบบโครงข่ายประสาทพร้อมการแยกเนื้อหา
