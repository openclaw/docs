---
read_when:
    - คุณต้องการดึงข้อมูลจาก URL และแยกเนื้อหาที่อ่านได้
    - คุณต้องกำหนดค่า `web_fetch` หรือ fallback ของ Firecrawl
    - คุณต้องการทำความเข้าใจข้อจำกัดและการแคชของ web_fetch
sidebarTitle: Web Fetch
summary: เครื่องมือ web_fetch -- การดึงข้อมูลผ่าน HTTP พร้อมการแยกเนื้อหาที่อ่านได้
title: การดึงข้อมูลจากเว็บ
x-i18n:
    generated_at: "2026-05-06T18:01:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

เครื่องมือ `web_fetch` ทำ HTTP GET แบบธรรมดาและดึงเนื้อหาที่อ่านได้
(HTML เป็น markdown หรือข้อความ) เครื่องมือนี้ **ไม่** เรียกใช้ JavaScript.

สำหรับเว็บไซต์ที่ใช้ JS หนักหรือหน้าที่ป้องกันด้วยการเข้าสู่ระบบ ให้ใช้
[เว็บเบราว์เซอร์](/th/tools/browser) แทน

## เริ่มต้นอย่างรวดเร็ว

`web_fetch` **เปิดใช้งานตามค่าเริ่มต้น** -- ไม่ต้องกำหนดค่า Agent สามารถ
เรียกใช้ได้ทันที:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="url" type="string" required>
URL ที่จะดึงข้อมูล รองรับเฉพาะ `http(s)` เท่านั้น
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
รูปแบบเอาต์พุตหลังจากดึงเนื้อหาหลักแล้ว
</ParamField>

<ParamField path="maxChars" type="number">
ตัดเอาต์พุตให้เหลือจำนวนอักขระเท่านี้
</ParamField>

## วิธีการทำงาน

<Steps>
  <Step title="Fetch">
    ส่ง HTTP GET พร้อม User-Agent ที่คล้าย Chrome และส่วนหัว `Accept-Language`
    บล็อกชื่อโฮสต์ส่วนตัว/ภายในและตรวจสอบการเปลี่ยนเส้นทางซ้ำ
  </Step>
  <Step title="Extract">
    รัน Readability (การดึงเนื้อหาหลัก) กับการตอบกลับ HTML
  </Step>
  <Step title="Fallback (optional)">
    หาก Readability ล้มเหลวและมีการกำหนดค่า Firecrawl ไว้ จะลองใหม่ผ่าน
    Firecrawl API ด้วยโหมดหลบเลี่ยงบอต
  </Step>
  <Step title="Cache">
    ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาที (กำหนดค่าได้) เพื่อลดการดึงข้อมูลซ้ำ
    จาก URL เดิม
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

## Firecrawl สำรอง

หากการดึงข้อมูลด้วย Readability ล้มเหลว `web_fetch` สามารถสำรองไปใช้
[Firecrawl](/th/tools/firecrawl) เพื่อหลบเลี่ยงบอตและดึงข้อมูลได้ดีขึ้น:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` รองรับออบเจ็กต์ SecretRef
การกำหนดค่าเดิม `tools.web.fetch.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`

<Note>
  หากเปิดใช้งาน Firecrawl และ SecretRef ของมันยัง resolve ไม่ได้โดยไม่มี
  `FIRECRAWL_API_KEY` env สำรอง การเริ่มต้น Gateway จะล้มเหลวทันที
</Note>

<Note>
  การ override `baseUrl` ของ Firecrawl ถูกจำกัดอย่างเข้มงวด: ทราฟฟิกที่โฮสต์จะใช้
  `https://api.firecrawl.dev`; การ override แบบ self-hosted ต้องชี้ไปยัง endpoint
  ส่วนตัวหรือภายใน และ `http://` จะยอมรับเฉพาะสำหรับเป้าหมายส่วนตัวเหล่านั้น
</Note>

พฤติกรรม runtime ปัจจุบัน:

- `tools.web.fetch.provider` เลือกผู้ให้บริการสำรองสำหรับการดึงข้อมูลอย่างชัดเจน
- หากละ `provider` ไว้ OpenClaw จะตรวจหา provider สำหรับ web-fetch ตัวแรกที่พร้อมใช้งาน
  จากข้อมูลรับรองที่มีโดยอัตโนมัติ `web_fetch` ที่ไม่อยู่ใน sandbox สามารถใช้
  plugins ที่ติดตั้งไว้ซึ่งประกาศ `contracts.webFetchProviders` และลงทะเบียน
  provider ที่ตรงกันใน runtime ได้ ปัจจุบัน provider ที่รวมมาให้คือ Firecrawl
- การเรียก `web_fetch` แบบ sandboxed ยังคงจำกัดไว้เฉพาะ provider ที่รวมมาให้
- หากปิดใช้งาน Readability `web_fetch` จะข้ามตรงไปยัง provider สำรองที่เลือกไว้
  หากไม่มี provider ที่พร้อมใช้งาน จะล้มเหลวแบบปิด

## พร็อกซี env ที่เชื่อถือได้

หาก deployment ของคุณต้องให้ `web_fetch` ผ่านพร็อกซีขาออก
HTTP(S) ที่เชื่อถือได้ ให้ตั้งค่า `tools.web.fetch.useTrustedEnvProxy: true`

ในโหมดนี้ OpenClaw ยังคงใช้การตรวจ SSRF ตามชื่อโฮสต์ก่อนส่งคำขอ
แต่จะให้พร็อกซี resolve DNS แทนการทำ DNS pinning ภายในเครื่อง
เปิดใช้สิ่งนี้เฉพาะเมื่อพร็อกซีถูกควบคุมโดยผู้ปฏิบัติการและบังคับใช้นโยบาย
ขาออกหลังจากการ resolve DNS แล้วเท่านั้น

<Note>
  หากไม่ได้กำหนดค่าตัวแปร env สำหรับพร็อกซี HTTP(S) หรือโฮสต์เป้าหมายถูกยกเว้นโดย
  `NO_PROXY` `web_fetch` จะย้อนกลับไปใช้เส้นทางเข้มงวดปกติพร้อม DNS pinning ภายในเครื่อง
</Note>

## ขีดจำกัดและความปลอดภัย

- `maxChars` ถูกจำกัดไม่ให้เกิน `tools.web.fetch.maxCharsCap`
- เนื้อหาการตอบกลับถูกจำกัดที่ `maxResponseBytes` ก่อน parsing; การตอบกลับที่ใหญ่เกินไป
  จะถูกตัดพร้อมคำเตือน
- ชื่อโฮสต์ส่วนตัว/ภายในถูกบล็อก
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` เป็นการ opt-in แบบจำกัด
  สำหรับสแต็กพร็อกซี fake-IP ที่เชื่อถือได้; อย่าตั้งค่าเว้นแต่พร็อกซีของคุณเป็นเจ้าของ
  ช่วงสังเคราะห์เหล่านั้นและบังคับใช้นโยบายปลายทางของตัวเอง
- การเปลี่ยนเส้นทางจะถูกตรวจสอบและจำกัดด้วย `maxRedirects`
- `useTrustedEnvProxy` เป็นการ opt-in ที่ชัดเจน และควรเปิดใช้เฉพาะกับ
  พร็อกซีที่ถูกควบคุมโดยผู้ปฏิบัติการซึ่งยังคงบังคับใช้นโยบายขาออกหลังจาก
  การ resolve DNS
- `web_fetch` เป็นแบบ best-effort -- บางเว็บไซต์ต้องใช้ [เว็บเบราว์เซอร์](/th/tools/browser)

## โปรไฟล์เครื่องมือ

หากคุณใช้โปรไฟล์เครื่องมือหรือ allowlists ให้เพิ่ม `web_fetch` หรือ `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## ที่เกี่ยวข้อง

- [การค้นหาเว็บ](/th/tools/web) -- ค้นหาเว็บด้วย provider หลายตัว
- [เว็บเบราว์เซอร์](/th/tools/browser) -- ระบบอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับเว็บไซต์ที่ใช้ JS หนัก
- [Firecrawl](/th/tools/firecrawl) -- เครื่องมือค้นหาและ scrape ของ Firecrawl
