---
read_when:
    - คุณต้องการดึงข้อมูลจาก URL และแยกเนื้อหาที่อ่านได้
    - คุณต้องกำหนดค่า web_fetch หรือ Firecrawl ที่ใช้เป็นตัวสำรอง
    - คุณต้องการทำความเข้าใจขีดจำกัดและการแคชของ web_fetch
sidebarTitle: Web Fetch
summary: เครื่องมือ web_fetch -- การดึงข้อมูล HTTP พร้อมการแยกเนื้อหาที่อ่านได้
title: การดึงข้อมูลจากเว็บ
x-i18n:
    generated_at: "2026-06-27T18:33:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

เครื่องมือ `web_fetch` ทำ HTTP GET แบบธรรมดาและแยกเนื้อหาที่อ่านได้
(HTML เป็น markdown หรือข้อความ) เครื่องมือนี้ **ไม่** รัน JavaScript

สำหรับไซต์ที่พึ่งพา JS หนักหรือหน้าที่ป้องกันด้วยการเข้าสู่ระบบ ให้ใช้
[เว็บเบราว์เซอร์](/th/tools/browser) แทน

## เริ่มต้นอย่างรวดเร็ว

`web_fetch` **เปิดใช้ตามค่าเริ่มต้น** -- ไม่ต้องกำหนดค่าใดๆ agent สามารถ
เรียกใช้ได้ทันที:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## พารามิเตอร์ของเครื่องมือ

<ParamField path="url" type="string" required>
URL ที่ต้องการดึงข้อมูล รองรับเฉพาะ `http(s)`
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
รูปแบบเอาต์พุตหลังจากแยกเนื้อหาหลักแล้ว
</ParamField>

<ParamField path="maxChars" type="number">
ตัดเอาต์พุตให้เหลือจำนวนอักขระเท่านี้
</ParamField>

## วิธีการทำงาน

<Steps>
  <Step title="Fetch">
    ส่ง HTTP GET พร้อม User-Agent ที่คล้าย Chrome และเฮดเดอร์ `Accept-Language`
    บล็อกชื่อโฮสต์ส่วนตัว/ภายใน และตรวจสอบการเปลี่ยนเส้นทางซ้ำ
  </Step>
  <Step title="Extract">
    รัน Readability (การแยกเนื้อหาหลัก) กับการตอบกลับ HTML
  </Step>
  <Step title="Fallback (optional)">
    หาก Readability ล้มเหลวและเลือก Firecrawl ไว้ จะลองใหม่ผ่าน
    Firecrawl API ด้วยโหมดหลบเลี่ยงบอต
  </Step>
  <Step title="Cache">
    ผลลัพธ์จะถูกแคชเป็นเวลา 15 นาที (กำหนดค่าได้) เพื่อลดการดึงข้อมูลซ้ำ
    จาก URL เดิม
  </Step>
</Steps>

## อัปเดตความคืบหน้า

`web_fetch` ส่งบรรทัดความคืบหน้าแบบสาธารณะเฉพาะเมื่อการดึงข้อมูลยังค้างอยู่
หลังจากห้าวินาที:

```text
Fetching page content...
```

การพบแคชอย่างรวดเร็วและการตอบกลับเครือข่ายที่เร็วจะเสร็จก่อนตัวจับเวลาทำงาน
จึงไม่แสดงบรรทัดความคืบหน้า หากยกเลิกการเรียก ตัวจับเวลาจะถูกล้าง
เมื่อการดึงข้อมูลเสร็จในภายหลัง agent จะได้รับผลลัพธ์เครื่องมือตามปกติ
บรรทัดความคืบหน้าเป็นเพียงสถานะ UI ของช่องทาง และจะไม่มีเนื้อหาหน้าเว็บที่ดึงมา

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

## ทางเลือกสำรอง Firecrawl

หากการแยกด้วย Readability ล้มเหลว `web_fetch` สามารถใช้
[Firecrawl](/th/tools/firecrawl) เป็นทางเลือกสำรองสำหรับการหลบเลี่ยงบอตและการแยกที่ดีกว่า:

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` เป็นตัวเลือกเสริมและรองรับอ็อบเจ็กต์ SecretRef
การกำหนดค่าเดิม `tools.web.fetch.firecrawl.*` จะถูกย้ายโดยอัตโนมัติด้วย `openclaw doctor --fix`

<Note>
  หากคุณกำหนดค่า SecretRef สำหรับคีย์ Firecrawl API แล้วแก้ค่าไม่ได้และไม่มี
  `FIRECRAWL_API_KEY` env สำรอง การเริ่มต้น gateway จะล้มเหลวทันที
</Note>

<Note>
  การ override `baseUrl` ของ Firecrawl ถูกจำกัดอย่างเข้มงวด: ทราฟฟิกที่โฮสต์ใช้
  `https://api.firecrawl.dev`; การ override แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัวหรือ
  ภายใน และยอมรับ `http://` เฉพาะสำหรับเป้าหมายส่วนตัวเหล่านั้น
</Note>

พฤติกรรม runtime ปัจจุบัน:

- `tools.web.fetch.provider` เลือกผู้ให้บริการทางเลือกสำรองสำหรับการดึงข้อมูลอย่างชัดเจน
- หากละเว้น `provider` OpenClaw จะตรวจหา provider สำหรับ web-fetch ตัวแรกที่พร้อมใช้งาน
  จาก credentials ที่กำหนดค่าไว้โดยอัตโนมัติ `web_fetch` แบบไม่ sandbox สามารถใช้
  Plugin ที่ติดตั้งซึ่งประกาศ `contracts.webFetchProviders` และลงทะเบียน
  provider ที่ตรงกันตอน runtime ได้ Plugin Firecrawl อย่างเป็นทางการให้ทางเลือกสำรองนี้
- การเรียก `web_fetch` แบบ sandbox อนุญาต provider ที่ bundled พร้อมกับ provider ที่ติดตั้ง
  ซึ่งยืนยันที่มาอย่างเป็นทางการจาก npm หรือ ClawHub แล้ว ปัจจุบันอนุญาต
  Plugin Firecrawl อย่างเป็นทางการ ส่วน Plugin ดึงข้อมูลภายนอกจากบุคคลที่สามยังถูกตัดออก
- หากปิดใช้ Readability `web_fetch` จะข้ามไปยังทางเลือกสำรอง provider ที่เลือกทันที
  หากไม่มี provider ที่พร้อมใช้งาน จะล้มเหลวแบบปิด

## พร็อกซี env ที่เชื่อถือได้

หาก deployment ของคุณต้องให้ `web_fetch` ออกผ่านพร็อกซี HTTP(S)
ขาออกที่เชื่อถือได้ ให้ตั้งค่า `tools.web.fetch.useTrustedEnvProxy: true`

ในโหมดนี้ OpenClaw ยังคงใช้การตรวจ SSRF ตามชื่อโฮสต์ก่อนส่งคำขอ
แต่ให้พร็อกซี resolve DNS แทนการทำ DNS pinning ภายในเครื่อง
เปิดใช้เฉพาะเมื่อพร็อกซีควบคุมโดย operator และบังคับใช้นโยบายขาออก
หลังจากการ resolve DNS แล้วเท่านั้น

<Note>
  หากไม่มีการกำหนดค่าตัวแปร env สำหรับพร็อกซี HTTP(S) หรือโฮสต์เป้าหมายถูกยกเว้นด้วย
  `NO_PROXY` `web_fetch` จะย้อนกลับไปใช้เส้นทางเข้มงวดตามปกติพร้อม DNS
  pinning ภายในเครื่อง
</Note>

## ขีดจำกัดและความปลอดภัย

- `maxChars` ถูกจำกัดไม่ให้เกิน `tools.web.fetch.maxCharsCap`
- เนื้อหาการตอบกลับถูกจำกัดที่ `maxResponseBytes` ก่อน parse; การตอบกลับที่ใหญ่เกิน
  จะถูกตัดพร้อมคำเตือน
- ชื่อโฮสต์ส่วนตัว/ภายในถูกบล็อก
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` และ
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` เป็น opt-in แบบแคบ
  สำหรับสแต็กพร็อกซี fake-IP ที่เชื่อถือได้เท่านั้น; อย่าตั้งค่าเว้นแต่พร็อกซีของคุณเป็นเจ้าของ
  ช่วงสังเคราะห์เหล่านั้นและบังคับใช้นโยบายปลายทางของตนเอง
- การเปลี่ยนเส้นทางถูกตรวจสอบและจำกัดด้วย `maxRedirects`
- `useTrustedEnvProxy` เป็น opt-in อย่างชัดเจน และควรเปิดใช้เฉพาะกับ
  พร็อกซีที่ควบคุมโดย operator ซึ่งยังบังคับใช้นโยบายขาออกหลังจาก
  การ resolve DNS
- `web_fetch` เป็นแบบ best-effort -- บางไซต์ต้องใช้ [เว็บเบราว์เซอร์](/th/tools/browser)

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

- [ค้นหาเว็บ](/th/tools/web) -- ค้นหาเว็บด้วยหลาย provider
- [เว็บเบราว์เซอร์](/th/tools/browser) -- ระบบอัตโนมัติของเบราว์เซอร์เต็มรูปแบบสำหรับไซต์ที่พึ่งพา JS หนัก
- [Firecrawl](/th/tools/firecrawl) -- เครื่องมือค้นหาและ scrape ของ Firecrawl
