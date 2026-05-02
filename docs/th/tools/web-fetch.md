---
read_when:
    - คุณต้องการดึงข้อมูลจาก URL และแยกเนื้อหาที่อ่านได้
    - คุณต้องกำหนดค่า web_fetch หรือ Firecrawl ซึ่งเป็นทางเลือกสำรองของมัน
    - คุณต้องการทำความเข้าใจข้อจำกัดและการแคชของ web_fetch
sidebarTitle: Web Fetch
summary: เครื่องมือ web_fetch -- การดึงข้อมูลผ่าน HTTP พร้อมการสกัดเนื้อหาที่อ่านได้
title: การดึงข้อมูลจากเว็บ
x-i18n:
    generated_at: "2026-05-02T10:32:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

เครื่องมือ `web_fetch` ทำ HTTP GET แบบธรรมดาและแยกเนื้อหาที่อ่านได้
(HTML เป็น markdown หรือข้อความ) เครื่องมือนี้ **ไม่** เรียกใช้ JavaScript

สำหรับไซต์ที่พึ่งพา JS มากหรือหน้าที่ป้องกันด้วยการเข้าสู่ระบบ ให้ใช้
[เว็บเบราว์เซอร์](/th/tools/browser) แทน

## เริ่มต้นอย่างรวดเร็ว

`web_fetch` **เปิดใช้งานโดยค่าเริ่มต้น** -- ไม่ต้องกำหนดค่า Agent สามารถ
เรียกใช้ได้ทันที:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="url" type="string" required>
URL ที่จะดึงข้อมูล รองรับเฉพาะ `http(s)` เท่านั้น
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
รูปแบบเอาต์พุตหลังการแยกเนื้อหาหลัก
</ParamField>

<ParamField path="maxChars" type="number">
ตัดเอาต์พุตให้เหลือจำนวนอักขระเท่านี้
</ParamField>

## วิธีการทำงาน

<Steps>
  <Step title="Fetch">
    ส่ง HTTP GET พร้อม User-Agent ที่คล้าย Chrome และ header `Accept-Language`
    บล็อกชื่อโฮสต์ส่วนตัว/ภายใน และตรวจสอบ redirect ซ้ำ
  </Step>
  <Step title="Extract">
    รัน Readability (การแยกเนื้อหาหลัก) บนการตอบกลับ HTML
  </Step>
  <Step title="Fallback (optional)">
    หาก Readability ล้มเหลวและมีการกำหนดค่า Firecrawl ไว้ จะลองใหม่ผ่าน
    Firecrawl API ด้วยโหมดหลบเลี่ยงบอท
  </Step>
  <Step title="Cache">
    ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาที (กำหนดค่าได้) เพื่อลดการดึงข้อมูล
    URL เดิมซ้ำ
  </Step>
</Steps>

## การกำหนดค่า

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl fallback

หากการแยกด้วย Readability ล้มเหลว `web_fetch` สามารถ fallback ไปยัง
[Firecrawl](/th/tools/firecrawl) เพื่อหลบเลี่ยงบอทและแยกเนื้อหาได้ดีขึ้น:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` รองรับอ็อบเจกต์ SecretRef
การกำหนดค่าเดิม `tools.web.fetch.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`

<Note>
  หากเปิดใช้งาน Firecrawl และ SecretRef ของมันยัง resolve ไม่ได้โดยไม่มี
  env fallback `FIRECRAWL_API_KEY` การเริ่มต้น Gateway จะล้มเหลวอย่างรวดเร็ว
</Note>

<Note>
  การ override `baseUrl` ของ Firecrawl ถูกจำกัดอย่างเข้มงวด: ทราฟฟิกที่โฮสต์ไว้ใช้
  `https://api.firecrawl.dev`; การ override แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัวหรือ
  ภายใน และ `http://` จะยอมรับเฉพาะสำหรับเป้าหมายส่วนตัวเหล่านั้นเท่านั้น
</Note>

พฤติกรรม runtime ปัจจุบัน:

- `tools.web.fetch.provider` เลือกผู้ให้บริการ fetch fallback อย่างชัดเจน
- หากละ `provider` ไว้ OpenClaw จะตรวจหา web-fetch
  provider ตัวแรกที่พร้อมใช้งานจากข้อมูลรับรองที่มีโดยอัตโนมัติ `web_fetch` แบบไม่อยู่ใน sandbox สามารถใช้
  Plugin ที่ติดตั้งซึ่งประกาศ `contracts.webFetchProviders` และลงทะเบียน
  provider ที่ตรงกันใน runtime ได้ ปัจจุบัน provider ที่รวมมาให้คือ Firecrawl
- การเรียก `web_fetch` แบบ sandbox จำกัดอยู่ที่ provider ที่รวมมาให้เท่านั้น
- หากปิดใช้งาน Readability `web_fetch` จะข้ามไปยัง
  provider fallback ที่เลือกไว้ทันที หากไม่มี provider ที่พร้อมใช้งาน จะล้มเหลวแบบปิด

## ขีดจำกัดและความปลอดภัย

- `maxChars` ถูก clamp ไว้ที่ `tools.web.fetch.maxCharsCap`
- เนื้อหา response ถูกจำกัดที่ `maxResponseBytes` ก่อนแยกวิเคราะห์ response
  ที่ใหญ่เกินจะถูกตัดพร้อมคำเตือน
- ชื่อโฮสต์ส่วนตัว/ภายในถูกบล็อก
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` เป็น opt-in แบบแคบ
  สำหรับสแต็กพร็อกซี fake-IP ที่เชื่อถือได้ ให้เว้นว่างไว้ เว้นแต่พร็อกซีของคุณจะเป็นเจ้าของ
  ช่วงสังเคราะห์เหล่านั้นและบังคับใช้นโยบายปลายทางของตัวเอง
- Redirect ถูกตรวจสอบและจำกัดโดย `maxRedirects`
- `web_fetch` เป็นแบบ best-effort -- บางไซต์ต้องใช้ [เว็บเบราว์เซอร์](/th/tools/browser)

## โปรไฟล์เครื่องมือ

หากคุณใช้โปรไฟล์เครื่องมือหรือ allowlist ให้เพิ่ม `web_fetch` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## ที่เกี่ยวข้อง

- [Web Search](/th/tools/web) -- ค้นหาเว็บด้วยหลาย provider
- [เว็บเบราว์เซอร์](/th/tools/browser) -- การทำงานอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับไซต์ที่พึ่งพา JS มาก
- [Firecrawl](/th/tools/firecrawl) -- เครื่องมือค้นหาและ scrape ของ Firecrawl
