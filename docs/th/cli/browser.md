---
read_when:
    - คุณใช้ `openclaw browser` และต้องการตัวอย่างสำหรับงานทั่วไป
    - คุณต้องการควบคุมเบราว์เซอร์ที่ทำงานบนเครื่องอื่นผ่านโฮสต์ Node
    - คุณต้องการเชื่อมต่อกับ Chrome ในเครื่องที่ลงชื่อเข้าใช้ไว้ผ่าน Chrome MCP
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw browser` (วงจรชีวิต, โปรไฟล์, แท็บ, การดำเนินการ, สถานะ และการดีบัก)
title: เบราว์เซอร์
x-i18n:
    generated_at: "2026-04-30T09:41:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

จัดการพื้นผิวควบคุมเบราว์เซอร์ของ OpenClaw และเรียกใช้การทำงานของเบราว์เซอร์ (วงจรชีวิต, โปรไฟล์, แท็บ, สแนปช็อต, ภาพหน้าจอ, การนำทาง, อินพุต, การจำลองสถานะ และการดีบัก)

ที่เกี่ยวข้อง:

- เครื่องมือเบราว์เซอร์ + API: [เครื่องมือเบราว์เซอร์](/th/tools/browser)

## แฟล็กทั่วไป

- `--url <gatewayWsUrl>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นมาจากการกำหนดค่า)
- `--token <token>`: โทเค็นของ Gateway (ถ้าจำเป็น)
- `--timeout <ms>`: ระยะหมดเวลาของคำขอ (มิลลิวินาที)
- `--expect-final`: รอการตอบกลับสุดท้ายจาก Gateway
- `--browser-profile <name>`: เลือกโปรไฟล์เบราว์เซอร์ (ค่าเริ่มต้นมาจากการกำหนดค่า)
- `--json`: เอาต์พุตที่เครื่องอ่านได้ (เมื่อรองรับ)

## เริ่มใช้งานอย่างรวดเร็ว (ภายในเครื่อง)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

เอเจนต์สามารถเรียกใช้การตรวจสอบความพร้อมแบบเดียวกันด้วย `browser({ action: "doctor" })`

## การแก้ปัญหาอย่างรวดเร็ว

ถ้า `start` ล้มเหลวด้วย `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน ถ้า `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว ระนาบควบคุมเบราว์เซอร์ถือว่าปกติ และความล้มเหลวมักเป็นนโยบาย SSRF สำหรับการนำทาง

ลำดับขั้นต่ำ:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

คำแนะนำโดยละเอียด: [การแก้ปัญหาเบราว์เซอร์](/th/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## วงจรชีวิต

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

หมายเหตุ:

- `doctor --deep` เพิ่มการตรวจสอบสแนปช็อตแบบสด มีประโยชน์เมื่อความพร้อมพื้นฐานของ CDP
  เป็นสีเขียว แต่คุณต้องการหลักฐานว่าแท็บปัจจุบันสามารถตรวจสอบได้
- สำหรับโปรไฟล์ `attachOnly` และ CDP ระยะไกล `openclaw browser stop` จะปิด
  เซสชันควบคุมที่ใช้งานอยู่และล้างการแทนที่การจำลองชั่วคราว แม้เมื่อ
  OpenClaw ไม่ได้เปิดโปรเซสเบราว์เซอร์เอง
- สำหรับโปรไฟล์ภายในเครื่องที่จัดการโดยระบบ `openclaw browser stop` จะหยุดโปรเซสเบราว์เซอร์
  ที่ถูกสร้างขึ้น
- `openclaw browser start --headless` มีผลเฉพาะกับคำขอเริ่มนั้น และ
  เฉพาะเมื่อ OpenClaw เปิดเบราว์เซอร์ภายในเครื่องที่จัดการโดยระบบเท่านั้น คำสั่งนี้จะไม่เขียนทับ
  `browser.headless` หรือการกำหนดค่าโปรไฟล์ และจะไม่มีผลกับเบราว์เซอร์
  ที่กำลังทำงานอยู่แล้ว
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ภายในเครื่อง
  ที่จัดการโดยระบบจะทำงานแบบ headless โดยอัตโนมัติ เว้นแต่ `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` หรือ `browser.profiles.<name>.headless=false`
  จะขอเบราว์เซอร์แบบมองเห็นได้อย่างชัดเจน

## ถ้าไม่มีคำสั่งนี้

ถ้า `openclaw browser` เป็นคำสั่งที่ไม่รู้จัก ให้ตรวจสอบ `plugins.allow` ใน
`~/.openclaw/openclaw.json`

เมื่อมี `plugins.allow` ให้ระบุ Plugin เบราว์เซอร์ที่มาพร้อมระบบอย่างชัดเจน
เว้นแต่การกำหนดค่าจะมีบล็อก `browser` ที่รากอยู่แล้ว:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` ที่รากแบบชัดเจน เช่น `browser.enabled=true` หรือ
`browser.profiles.<name>` จะเปิดใช้งาน Plugin เบราว์เซอร์ที่มาพร้อมระบบภายใต้
รายการอนุญาต Plugin ที่จำกัดด้วยเช่นกัน

ที่เกี่ยวข้อง: [เครื่องมือเบราว์เซอร์](/th/tools/browser#missing-browser-command-or-tool)

## โปรไฟล์

โปรไฟล์คือการกำหนดค่าการกำหนดเส้นทางเบราว์เซอร์ที่มีชื่อ ในทางปฏิบัติ:

- `openclaw`: เปิดหรือแนบกับอินสแตนซ์ Chrome เฉพาะที่ OpenClaw จัดการ (ไดเรกทอรีข้อมูลผู้ใช้แยกต่างหาก)
- `user`: ควบคุมเซสชัน Chrome ที่ลงชื่อเข้าใช้แล้วของคุณผ่าน Chrome DevTools MCP
- โปรไฟล์ CDP แบบกำหนดเอง: ชี้ไปยังปลายทาง CDP ภายในเครื่องหรือระยะไกล

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

`tabs` จะส่งคืน `suggestedTargetId` ก่อน จากนั้นจึงเป็น `tabId` ที่เสถียร เช่น `t1`,
ป้ายกำกับเสริม และ `targetId` ดิบ เอเจนต์ควรส่ง
`suggestedTargetId` กลับไปยัง `focus`, `close`, สแนปช็อต และการทำงานต่างๆ คุณสามารถ
กำหนดป้ายกำกับด้วย `open --label`, `tab new --label` หรือ `tab label`; ป้ายกำกับ,
รหัสแท็บ, รหัสเป้าหมายดิบ และคำนำหน้า target-id ที่ไม่ซ้ำกันล้วนใช้ได้
เมื่อ Chromium แทนที่เป้าหมายดิบพื้นฐานระหว่างการนำทางหรือการส่งฟอร์ม
OpenClaw จะรักษา `tabId`/ป้ายกำกับที่เสถียรให้ติดกับแท็บทดแทน
เมื่อพิสูจน์การจับคู่ได้ รหัสเป้าหมายดิบยังคงเปลี่ยนแปลงได้; ควรใช้
`suggestedTargetId`

## สแนปช็อต / ภาพหน้าจอ / การทำงาน

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

- `--full-page` ใช้สำหรับการจับภาพหน้าเท่านั้น; ไม่สามารถใช้ร่วมกับ `--ref`
  หรือ `--element` ได้
- โปรไฟล์ `existing-session` / `user` รองรับภาพหน้าจอของหน้าและภาพหน้าจอ `--ref`
  จากเอาต์พุตสแนปช็อต แต่ไม่รองรับภาพหน้าจอ `--element` ของ CSS
- `--labels` ซ้อนทับ ref ของสแนปช็อตปัจจุบันบนภาพหน้าจอ
- `snapshot --urls` เพิ่มปลายทางลิงก์ที่ค้นพบต่อท้ายสแนปช็อต AI เพื่อให้
  เอเจนต์เลือกเป้าหมายการนำทางโดยตรงได้ แทนที่จะเดาจากข้อความลิงก์เพียงอย่างเดียว

นำทาง/คลิก/พิมพ์ (ระบบอัตโนมัติ UI แบบอิง ref):

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

การตอบกลับของการทำงานจะส่งคืน `targetId` ดิบปัจจุบันหลังจากมีการแทนที่หน้า
ที่ถูกกระตุ้นโดยการทำงาน เมื่อ OpenClaw พิสูจน์แท็บทดแทนได้ สคริปต์ยังควร
จัดเก็บและส่ง `suggestedTargetId`/ป้ายกำกับสำหรับเวิร์กโฟลว์ระยะยาว

ตัวช่วยไฟล์ + กล่องโต้ตอบ:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

โปรไฟล์ Chrome ที่จัดการโดยระบบจะบันทึกการดาวน์โหลดปกติที่ถูกกระตุ้นจากการคลิกไปยังไดเรกทอรี
ดาวน์โหลดของ OpenClaw (`/tmp/openclaw/downloads` เป็นค่าเริ่มต้น หรือราก temp ที่กำหนดค่าไว้)
ใช้ `waitfordownload` หรือ `download` เมื่อเอเจนต์จำเป็นต้องรอไฟล์
เฉพาะและส่งคืนพาธของไฟล์; ตัวรอแบบชัดเจนเหล่านี้จะเป็นเจ้าของการดาวน์โหลดถัดไป

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

## Chrome ที่มีอยู่ผ่าน MCP

ใช้โปรไฟล์ `user` ในตัว หรือสร้างโปรไฟล์ `existing-session` ของคุณเอง:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

เส้นทางนี้ใช้ได้เฉพาะโฮสต์เท่านั้น สำหรับ Docker, เซิร์ฟเวอร์แบบ headless, Browserless หรือการตั้งค่าระยะไกลอื่นๆ ให้ใช้โปรไฟล์ CDP แทน

ข้อจำกัดปัจจุบันของ existing-session:

- การทำงานที่ขับเคลื่อนด้วยสแนปช็อตใช้ ref ไม่ใช่ตัวเลือก CSS
- `browser.actionTimeoutMs` ตั้งค่าเริ่มต้นให้คำขอ `act` ที่รองรับเป็น 60000 ms เมื่อ
  ผู้เรียกละ `timeoutMs`; `timeoutMs` ต่อครั้งยังคงมีผลเหนือกว่า
- `click` เป็นการคลิกซ้ายเท่านั้น
- `type` ไม่รองรับ `slowly=true`
- `press` ไม่รองรับ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` และ `evaluate` ปฏิเสธ
  การแทนที่ระยะหมดเวลาต่อครั้ง
- `select` รองรับค่าเดียวเท่านั้น
- ไม่รองรับ `wait --load networkidle`
- การอัปโหลดไฟล์ต้องใช้ `--ref` / `--input-ref`, ไม่รองรับ CSS
  `--element` และปัจจุบันรองรับครั้งละหนึ่งไฟล์
- ฮุกกล่องโต้ตอบไม่รองรับ `--timeout`
- ภาพหน้าจอรองรับการจับภาพหน้าและ `--ref` แต่ไม่รองรับ CSS `--element`
- `responsebody`, การดักจับการดาวน์โหลด, การส่งออก PDF และการทำงานแบบแบตช์ยังคง
  ต้องใช้เบราว์เซอร์ที่จัดการโดยระบบหรือโปรไฟล์ CDP ดิบ

## การควบคุมเบราว์เซอร์ระยะไกล (พร็อกซีโฮสต์โหนด)

ถ้า Gateway ทำงานบนเครื่องคนละเครื่องกับเบราว์เซอร์ ให้เรียกใช้ **โฮสต์โหนด** บนเครื่องที่มี Chrome/Brave/Edge/Chromium Gateway จะพร็อกซีการทำงานของเบราว์เซอร์ไปยังโหนดนั้น (ไม่ต้องมีเซิร์ฟเวอร์ควบคุมเบราว์เซอร์แยกต่างหาก)

ใช้ `gateway.nodes.browser.mode` เพื่อควบคุมการกำหนดเส้นทางอัตโนมัติ และใช้ `gateway.nodes.browser.node` เพื่อปักหมุดโหนดเฉพาะถ้ามีหลายโหนดเชื่อมต่ออยู่

ความปลอดภัย + การตั้งค่าระยะไกล: [เครื่องมือเบราว์เซอร์](/th/tools/browser), [การเข้าถึงระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [ความปลอดภัย](/th/gateway/security)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [เบราว์เซอร์](/th/tools/browser)
