---
read_when:
    - คุณต้องการดึงข้อมูลจาก URL และแยกเนื้อหาที่อ่านได้
    - คุณต้องกำหนดค่า web_fetch หรือ Firecrawl ซึ่งเป็นทางเลือกสำรองของมัน
    - คุณต้องการทำความเข้าใจขีดจำกัดและการแคชของ web_fetch
sidebarTitle: Web Fetch
summary: เครื่องมือ web_fetch -- การดึงข้อมูลผ่าน HTTP พร้อมการแยกเนื้อหาที่อ่านได้
title: การดึงข้อมูลจากเว็บ
x-i18n:
    generated_at: "2026-04-30T10:23:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

เครื่องมือ `web_fetch` ทำ HTTP GET แบบธรรมดาและแยกเนื้อหาที่อ่านได้
(HTML เป็น markdown หรือข้อความ) โดยจะ **ไม่** เรียกใช้ JavaScript.

สำหรับไซต์ที่พึ่งพา JS อย่างมากหรือหน้าที่ป้องกันด้วยการเข้าสู่ระบบ ให้ใช้
[เว็บเบราว์เซอร์](/th/tools/browser) แทน.

## เริ่มต้นอย่างรวดเร็ว

`web_fetch` **เปิดใช้งานตามค่าเริ่มต้น** -- ไม่ต้องกำหนดค่า Agent สามารถ
เรียกใช้ได้ทันที:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="url" type="string" required>
URL ที่จะดึงข้อมูล รองรับเฉพาะ `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
รูปแบบผลลัพธ์หลังการแยกเนื้อหาหลัก.
</ParamField>

<ParamField path="maxChars" type="number">
ตัดผลลัพธ์ให้เหลือจำนวนอักขระเท่านี้.
</ParamField>

## วิธีทำงาน

<Steps>
  <Step title="ดึงข้อมูล">
    ส่ง HTTP GET พร้อม User-Agent แบบ Chrome และส่วนหัว `Accept-Language`.
    บล็อกชื่อโฮสต์ส่วนตัว/ภายใน และตรวจสอบการเปลี่ยนเส้นทางอีกครั้ง.
  </Step>
  <Step title="แยกเนื้อหา">
    เรียกใช้ Readability (การแยกเนื้อหาหลัก) กับการตอบกลับ HTML.
  </Step>
  <Step title="Fallback (ไม่บังคับ)">
    หาก Readability ล้มเหลวและมีการกำหนดค่า Firecrawl ไว้ จะลองใหม่ผ่าน
    API ของ Firecrawl ด้วยโหมดหลบเลี่ยงบอต.
  </Step>
  <Step title="แคช">
    ผลลัพธ์จะถูกแคชไว้ 15 นาที (กำหนดค่าได้) เพื่อลดการดึงข้อมูล
    URL เดิมซ้ำ.
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

หากการแยกเนื้อหาด้วย Readability ล้มเหลว `web_fetch` สามารถ fallback ไปยัง
[Firecrawl](/th/tools/firecrawl) เพื่อหลบเลี่ยงบอตและแยกเนื้อหาได้ดีขึ้น:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` รองรับออบเจ็กต์ SecretRef.
การกำหนดค่าเดิม `tools.web.fetch.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`.

<Note>
  หากเปิดใช้งาน Firecrawl และ SecretRef ของ Firecrawl ยังแก้ค่าไม่ได้โดยไม่มี
  env fallback `FIRECRAWL_API_KEY` การเริ่มต้น gateway จะล้มเหลวอย่างรวดเร็ว.
</Note>

<Note>
  การ override `baseUrl` ของ Firecrawl ถูกจำกัดอย่างเข้มงวด: ต้องใช้ `https://` และ
  โฮสต์ Firecrawl อย่างเป็นทางการ (`api.firecrawl.dev`).
</Note>

พฤติกรรม runtime ปัจจุบัน:

- `tools.web.fetch.provider` เลือกผู้ให้บริการ fetch fallback อย่างชัดเจน.
- หากละเว้น `provider` OpenClaw จะตรวจจับผู้ให้บริการ web-fetch รายแรกที่พร้อมใช้งาน
  จาก credentials ที่มีโดยอัตโนมัติ ปัจจุบันผู้ให้บริการที่มาพร้อมระบบคือ Firecrawl.
- หากปิดใช้งาน Readability `web_fetch` จะข้ามตรงไปยัง
  provider fallback ที่เลือก หากไม่มี provider ที่พร้อมใช้งาน จะล้มเหลวแบบปิด.

## ขีดจำกัดและความปลอดภัย

- `maxChars` จะถูกจำกัดไว้ที่ `tools.web.fetch.maxCharsCap`
- เนื้อหาการตอบกลับถูกจำกัดที่ `maxResponseBytes` ก่อนแยกวิเคราะห์; การตอบกลับที่ใหญ่เกินไป
  จะถูกตัดพร้อมคำเตือน
- ชื่อโฮสต์ส่วนตัว/ภายในจะถูกบล็อก
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` เป็น opt-in แบบจำกัด
  สำหรับสแตกพร็อกซี fake-IP ที่เชื่อถือได้เท่านั้น; เว้นว่างไว้เว้นแต่พร็อกซีของคุณจะเป็นเจ้าของ
  ช่วงสังเคราะห์เหล่านั้นและบังคับใช้นโยบายปลายทางของตนเอง
- การเปลี่ยนเส้นทางจะถูกตรวจสอบและจำกัดด้วย `maxRedirects`
- `web_fetch` เป็นความพยายามให้ดีที่สุด -- บางไซต์ต้องใช้ [เว็บเบราว์เซอร์](/th/tools/browser)

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

- [Web Search](/th/tools/web) -- ค้นหาเว็บด้วยผู้ให้บริการหลายราย
- [เว็บเบราว์เซอร์](/th/tools/browser) -- ระบบอัตโนมัติเบราว์เซอร์เต็มรูปแบบสำหรับไซต์ที่พึ่งพา JS อย่างมาก
- [Firecrawl](/th/tools/firecrawl) -- เครื่องมือค้นหาและ scrape ของ Firecrawl
