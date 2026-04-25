---
read_when:
    - คุณใช้ `openclaw browser` และต้องการตัวอย่างสำหรับงานทั่วไป
    - คุณต้องการควบคุมเบราว์เซอร์ที่ทำงานอยู่บนเครื่องอื่นผ่านโฮสต์ node
    - คุณต้องการเชื่อมต่อกับ Chrome ในเครื่องที่ลงชื่อเข้าใช้แล้วของคุณผ่าน Chrome MCP
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw browser` (วงจรชีวิต โปรไฟล์ แท็บ การดำเนินการ สถานะ และการดีบัก)
title: Browser
x-i18n:
    generated_at: "2026-04-25T13:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2157146e54c77fecafcc5e89dd65244bd7ebecc37f86b45921ccea025188a8
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

จัดการพื้นผิวควบคุมเบราว์เซอร์ของ OpenClaw และเรียกใช้การดำเนินการของเบราว์เซอร์ (วงจรชีวิต โปรไฟล์ แท็บ สแนปช็อต ภาพหน้าจอ การนำทาง การป้อนข้อมูล การจำลองสถานะ และการดีบัก)

ที่เกี่ยวข้อง:

- เครื่องมือ Browser + API: [เครื่องมือ Browser](/th/tools/browser)

## แฟล็กที่ใช้บ่อย

- `--url <gatewayWsUrl>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นมาจาก config)
- `--token <token>`: โทเค็นของ Gateway (หากจำเป็น)
- `--timeout <ms>`: เวลาหมดอายุของคำขอ (มิลลิวินาที)
- `--expect-final`: รอการตอบกลับสุดท้ายจาก Gateway
- `--browser-profile <name>`: เลือกโปรไฟล์เบราว์เซอร์ (ค่าเริ่มต้นมาจาก config)
- `--json`: เอาต์พุตแบบ machine-readable (ในกรณีที่รองรับ)

## เริ่มต้นอย่างรวดเร็ว (ในเครื่อง)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

เอเจนต์สามารถเรียกใช้การตรวจสอบความพร้อมแบบเดียวกันได้ด้วย `browser({ action: "doctor" })`

## การแก้ปัญหาเบื้องต้นอย่างรวดเร็ว

หาก `start` ล้มเหลวพร้อม `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่า control plane ของเบราว์เซอร์ยังปกติดี และความล้มเหลวมักเกิดจากนโยบาย SSRF สำหรับการนำทาง

ลำดับขั้นต่ำ:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

คำแนะนำแบบละเอียด: [การแก้ปัญหา Browser](/th/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## วงจรชีวิต

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

หมายเหตุ:

- สำหรับโปรไฟล์ `attachOnly` และ CDP ระยะไกล `openclaw browser stop` จะปิดเซสชันควบคุมที่กำลังทำงานอยู่และล้างการแทนที่การจำลองชั่วคราว แม้ในกรณีที่ OpenClaw ไม่ได้เป็นผู้เปิดโปรเซสเบราว์เซอร์เอง
- สำหรับโปรไฟล์ที่จัดการในเครื่อง `openclaw browser stop` จะหยุดโปรเซสเบราว์เซอร์ที่ถูกสตาร์ตขึ้นมา
- `openclaw browser start --headless` มีผลกับคำขอ start นั้นเท่านั้น และมีผลเฉพาะเมื่อ OpenClaw เป็นผู้เปิดเบราว์เซอร์แบบจัดการในเครื่อง จะไม่เขียนทับ `browser.headless` หรือ config ของโปรไฟล์ และจะไม่ทำอะไรเลยหากเบราว์เซอร์ทำงานอยู่แล้ว
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการในเครื่องจะทำงานแบบ headless โดยอัตโนมัติ เว้นแต่มีการขอเบราว์เซอร์แบบมองเห็นได้อย่างชัดเจนผ่าน `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` หรือ `browser.profiles.<name>.headless=false`

## หากไม่มีคำสั่งนี้

หาก `openclaw browser` เป็นคำสั่งที่ไม่รู้จัก ให้ตรวจสอบ `plugins.allow` ใน
`~/.openclaw/openclaw.json`

เมื่อมี `plugins.allow` ปลั๊กอิน browser ที่มากับระบบต้องถูกระบุ
อย่างชัดเจน:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` จะไม่ทำให้ CLI subcommand กลับมาเมื่อ allowlist ของปลั๊กอินไม่รวม `browser`

ที่เกี่ยวข้อง: [เครื่องมือ Browser](/th/tools/browser#missing-browser-command-or-tool)

## โปรไฟล์

โปรไฟล์คือ config การกำหนดเส้นทางเบราว์เซอร์แบบมีชื่อ ในทางปฏิบัติ:

- `openclaw`: เปิดหรือเชื่อมต่อกับ Chrome ที่ OpenClaw จัดการโดยเฉพาะ (isolated user data dir)
- `user`: ควบคุมเซสชัน Chrome ที่ลงชื่อเข้าใช้แล้วของคุณผ่าน Chrome DevTools MCP
- โปรไฟล์ CDP แบบกำหนดเอง: ชี้ไปยัง CDP endpoint ในเครื่องหรือระยะไกล

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

ใช้โปรไฟล์เฉพาะ:

```bash
openclaw browser --browser-profile work tabs
```

## แท็บ

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` จะคืนค่า `suggestedTargetId` ก่อน จากนั้นจึงเป็น `tabId` แบบคงที่ เช่น `t1`,
ตามด้วย label แบบไม่บังคับ และ `targetId` ดิบ เอเจนต์ควรส่ง
`suggestedTargetId` กลับเข้าไปใน `focus`, `close`, snapshots และ actions คุณสามารถ
กำหนด label ได้ด้วย `open --label`, `tab new --label` หรือ `tab label`; โดยรองรับ labels,
tab ids, raw target ids และ prefix ของ target-id ที่ไม่ซ้ำกันทั้งหมด

## สแนปช็อต / ภาพหน้าจอ / การดำเนินการ

สแนปช็อต:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

ภาพหน้าจอ:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

หมายเหตุ:

- `--full-page` ใช้สำหรับการจับภาพทั้งหน้าเท่านั้น; ไม่สามารถใช้ร่วมกับ `--ref`
  หรือ `--element` ได้
- โปรไฟล์ `existing-session` / `user` รองรับภาพหน้าจอระดับหน้าและภาพหน้าจอแบบ `--ref`
  จากเอาต์พุตของ snapshot แต่ไม่รองรับภาพหน้าจอแบบ CSS `--element`
- `--labels` จะซ้อน refs ของ snapshot ปัจจุบันลงบนภาพหน้าจอ
- `snapshot --urls` จะต่อท้ายปลายทางลิงก์ที่ค้นพบลงใน AI snapshot เพื่อให้
  เอเจนต์สามารถเลือกเป้าหมายการนำทางโดยตรงแทนการเดาจากข้อความลิงก์เพียงอย่างเดียว

นำทาง/คลิก/พิมพ์ (UI automation แบบอิง ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

ตัวช่วยสำหรับไฟล์และไดอะล็อก:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

โปรไฟล์ Chrome ที่จัดการไว้จะบันทึกการดาวน์โหลดทั่วไปที่ถูกเรียกโดยการคลิกลงในไดเรกทอรีดาวน์โหลดของ OpenClaw
(ค่าเริ่มต้นคือ `/tmp/openclaw/downloads` หรือ temp root ที่กำหนดค่าไว้) ใช้ `waitfordownload` หรือ `download` เมื่อเอเจนต์ต้องรอไฟล์เฉพาะและคืนพาธของไฟล์นั้น; ตัวรอแบบ explicit เหล่านี้จะเป็นเจ้าของการดาวน์โหลดถัดไป

## สถานะและที่เก็บข้อมูล

Viewport + การจำลอง:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

คุกกี้ + ที่เก็บข้อมูล:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## การดีบัก

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome ที่มีอยู่แล้วผ่าน MCP

ใช้โปรไฟล์ `user` ที่มีมาให้ หรือสร้างโปรไฟล์ `existing-session` ของคุณเอง:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

เส้นทางนี้ใช้ได้เฉพาะบนโฮสต์เท่านั้น สำหรับ Docker, เซิร์ฟเวอร์ headless, Browserless หรือการตั้งค่าระยะไกลอื่น ๆ ให้ใช้โปรไฟล์ CDP แทน

ข้อจำกัดปัจจุบันของ existing-session:

- การดำเนินการที่ขับเคลื่อนด้วย snapshot ใช้ refs ไม่ใช่ CSS selectors
- `browser.actionTimeoutMs` จะกำหนดค่าเริ่มต้นให้คำขอ `act` ที่รองรับเป็น 60000 ms เมื่อ
  ผู้เรียกไม่ได้ระบุ `timeoutMs`; แต่ `timeoutMs` รายครั้งยังคงมีลำดับความสำคัญสูงกว่า
- `click` รองรับเฉพาะคลิกซ้าย
- `type` ไม่รองรับ `slowly=true`
- `press` ไม่รองรับ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` และ `evaluate` จะปฏิเสธ
  การแทนที่ timeout รายครั้ง
- `select` รองรับค่าเดียวเท่านั้น
- `wait --load networkidle` ไม่รองรับ
- การอัปโหลดไฟล์ต้องใช้ `--ref` / `--input-ref`, ไม่รองรับ CSS
  `--element` และขณะนี้รองรับครั้งละหนึ่งไฟล์
- hook ของ dialog ไม่รองรับ `--timeout`
- ภาพหน้าจอรองรับการจับภาพระดับหน้าและ `--ref` แต่ไม่รองรับ CSS `--element`
- `responsebody`, การดักจับการดาวน์โหลด, การส่งออก PDF และ batch actions ยังคง
  ต้องใช้เบราว์เซอร์ที่ถูกจัดการหรือโปรไฟล์ CDP แบบดิบ

## การควบคุมเบราว์เซอร์ระยะไกล (พร็อกซีโฮสต์ node)

หาก Gateway ทำงานอยู่คนละเครื่องกับเบราว์เซอร์ ให้รัน **โฮสต์ node** บนเครื่องที่มี Chrome/Brave/Edge/Chromium Gateway จะพร็อกซีการดำเนินการของเบราว์เซอร์ไปยัง node นั้น (ไม่ต้องมีเซิร์ฟเวอร์ควบคุมเบราว์เซอร์แยกต่างหาก)

ใช้ `gateway.nodes.browser.mode` เพื่อควบคุมการกำหนดเส้นทางอัตโนมัติ และใช้ `gateway.nodes.browser.node` เพื่อตรึงไปยัง node เฉพาะหากมีหลาย node เชื่อมต่ออยู่

ความปลอดภัย + การตั้งค่าระยะไกล: [เครื่องมือ Browser](/th/tools/browser), [การเข้าถึงระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [ความปลอดภัย](/th/gateway/security)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Browser](/th/tools/browser)
