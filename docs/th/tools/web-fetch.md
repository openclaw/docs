---
read_when:
    - คุณต้องการดึงข้อมูลจาก URL และแยกเนื้อหาที่อ่านได้
    - คุณต้องกำหนดค่า web_fetch หรือกลไกสำรองที่ใช้ Firecrawl
    - คุณต้องการทำความเข้าใจข้อจำกัดและการแคชของ web_fetch
sidebarTitle: Web Fetch
summary: เครื่องมือ web_fetch -- การดึงข้อมูล HTTP พร้อมการแยกเนื้อหาที่อ่านได้
title: การดึงข้อมูลจากเว็บ
x-i18n:
    generated_at: "2026-05-04T02:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

เครื่องมือ `web_fetch` ทำ HTTP GET แบบธรรมดาและดึงเนื้อหาที่อ่านได้
(HTML เป็นมาร์กดาวน์หรือข้อความ) เครื่องมือนี้ **ไม่** รัน JavaScript

สำหรับไซต์ที่พึ่งพา JS หนักหรือหน้าที่ป้องกันด้วยการเข้าสู่ระบบ ให้ใช้
[เว็บเบราว์เซอร์](/th/tools/browser) แทน

## เริ่มต้นอย่างรวดเร็ว

`web_fetch` **เปิดใช้งานตามค่าเริ่มต้น** -- ไม่ต้องกำหนดค่า เอเจนต์สามารถ
เรียกใช้ได้ทันที:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="url" type="string" required>
URL ที่จะดึงข้อมูล รองรับเฉพาะ `http(s)`
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
รูปแบบเอาต์พุตหลังจากดึงเนื้อหาหลักแล้ว
</ParamField>

<ParamField path="maxChars" type="number">
ตัดเอาต์พุตให้เหลือจำนวนอักขระเท่านี้
</ParamField>

## วิธีการทำงาน

<Steps>
  <Step title="ดึงข้อมูล">
    ส่ง HTTP GET พร้อม User-Agent ที่คล้าย Chrome และส่วนหัว `Accept-Language`
    บล็อกชื่อโฮสต์ส่วนตัว/ภายใน และตรวจสอบการเปลี่ยนเส้นทางซ้ำ
  </Step>
  <Step title="ดึงเนื้อหา">
    รัน Readability (การดึงเนื้อหาหลัก) กับการตอบกลับ HTML
  </Step>
  <Step title="ตัวเลือกสำรอง (ไม่บังคับ)">
    หาก Readability ล้มเหลวและมีการกำหนดค่า Firecrawl ไว้ จะลองใหม่ผ่าน
    Firecrawl API ด้วยโหมดหลบเลี่ยงบอต
  </Step>
  <Step title="แคช">
    ผลลัพธ์จะถูกแคชไว้ 15 นาที (กำหนดค่าได้) เพื่อลดการดึงข้อมูลซ้ำ
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

## ตัวเลือกสำรอง Firecrawl

หากการดึงเนื้อหาด้วย Readability ล้มเหลว `web_fetch` สามารถใช้
[Firecrawl](/th/tools/firecrawl) เป็นตัวเลือกสำรองสำหรับการหลบเลี่ยงบอตและการดึงเนื้อหาที่ดีกว่า:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` รองรับอ็อบเจ็กต์ SecretRef
การกำหนดค่าเดิม `tools.web.fetch.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`

<Note>
  หาก Firecrawl เปิดใช้งานอยู่และ SecretRef ของมันแก้ค่าไม่ได้โดยไม่มี
  env สำรอง `FIRECRAWL_API_KEY` การเริ่มต้น gateway จะล้มเหลวอย่างรวดเร็ว
</Note>

<Note>
  การ override `baseUrl` ของ Firecrawl ถูกจำกัดอย่างเข้มงวด: ทราฟฟิกแบบโฮสต์ใช้
  `https://api.firecrawl.dev`; การ override แบบ self-hosted ต้องชี้ไปยัง
  endpoint ส่วนตัวหรือภายใน และยอมรับ `http://` เฉพาะสำหรับเป้าหมายส่วนตัวเหล่านั้น
</Note>

พฤติกรรมรันไทม์ปัจจุบัน:

- `tools.web.fetch.provider` เลือกผู้ให้บริการตัวเลือกสำรองสำหรับการดึงข้อมูลอย่างชัดเจน
- หากละเว้น `provider` OpenClaw จะตรวจจับผู้ให้บริการ web-fetch รายแรกที่พร้อมใช้งาน
  จากข้อมูลรับรองที่มีโดยอัตโนมัติ `web_fetch` ที่ไม่อยู่ในแซนด์บ็อกซ์สามารถใช้
  plugins ที่ติดตั้งซึ่งประกาศ `contracts.webFetchProviders` และลงทะเบียน
  ผู้ให้บริการที่ตรงกันในรันไทม์ได้ ปัจจุบันผู้ให้บริการที่บันเดิลมาคือ Firecrawl
- การเรียก `web_fetch` แบบแซนด์บ็อกซ์ยังคงจำกัดไว้เฉพาะผู้ให้บริการที่บันเดิลมา
- หากปิดใช้งาน Readability `web_fetch` จะข้ามไปยังตัวเลือกสำรองจากผู้ให้บริการที่เลือกทันที
  หากไม่มีผู้ให้บริการที่พร้อมใช้งาน จะล้มเหลวแบบปิด

## พร็อกซี Env ที่เชื่อถือได้

หากการปรับใช้ของคุณต้องให้ `web_fetch` ผ่านพร็อกซี HTTP(S) ขาออก
ที่เชื่อถือได้ ให้ตั้งค่า `tools.web.fetch.useTrustedEnvProxy: true`

ในโหมดนี้ OpenClaw ยังคงใช้การตรวจสอบ SSRF ตามชื่อโฮสต์ก่อนส่งคำขอ
แต่จะให้พร็อกซีแก้ DNS แทนการทำ DNS pinning ภายในเครื่อง
เปิดใช้งานเฉพาะเมื่อพร็อกซีอยู่ภายใต้การควบคุมของผู้ปฏิบัติการและบังคับใช้นโยบาย
ขาออกหลังจากการแก้ DNS แล้ว

<Note>
  หากไม่มีการกำหนดค่า env var ของพร็อกซี HTTP(S) หรือโฮสต์เป้าหมายถูกยกเว้นโดย
  `NO_PROXY` `web_fetch` จะกลับไปใช้เส้นทางเข้มงวดปกติพร้อม DNS
  pinning ภายในเครื่อง
</Note>

## ข้อจำกัดและความปลอดภัย

- `maxChars` ถูกจำกัดไม่ให้เกิน `tools.web.fetch.maxCharsCap`
- เนื้อหาการตอบกลับถูกจำกัดที่ `maxResponseBytes` ก่อนแยกวิเคราะห์; การตอบกลับที่ใหญ่เกินไป
  จะถูกตัดพร้อมคำเตือน
- ชื่อโฮสต์ส่วนตัว/ภายในถูกบล็อก
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` เป็นการ opt-in แบบแคบ
  สำหรับสแต็กพร็อกซี fake-IP ที่เชื่อถือได้; ปล่อยว่างไว้ เว้นแต่พร็อกซีของคุณจะเป็นเจ้าของ
  ช่วงสังเคราะห์เหล่านั้นและบังคับใช้นโยบายปลายทางของตัวเอง
- การเปลี่ยนเส้นทางถูกตรวจสอบและจำกัดโดย `maxRedirects`
- `useTrustedEnvProxy` เป็นการ opt-in อย่างชัดเจน และควรเปิดใช้งานเฉพาะสำหรับ
  พร็อกซีที่ผู้ปฏิบัติการควบคุมซึ่งยังคงบังคับใช้นโยบายขาออกหลังการแก้ DNS
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

- [ค้นเว็บ](/th/tools/web) -- ค้นหาเว็บด้วยผู้ให้บริการหลายราย
- [เว็บเบราว์เซอร์](/th/tools/browser) -- การทำงานอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับไซต์ที่พึ่งพา JS หนัก
- [Firecrawl](/th/tools/firecrawl) -- เครื่องมือค้นหาและ scrape ของ Firecrawl
