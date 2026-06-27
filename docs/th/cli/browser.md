---
read_when:
    - คุณใช้ `openclaw browser` และต้องการตัวอย่างสำหรับงานทั่วไป
    - คุณต้องการควบคุมเบราว์เซอร์ที่ทำงานอยู่บนเครื่องอื่นผ่านโฮสต์ Node
    - คุณต้องการเชื่อมต่อกับ Chrome ในเครื่องที่ลงชื่อเข้าใช้อยู่ผ่าน Chrome MCP
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw browser` (วงจรชีวิต, โปรไฟล์, แท็บ, การดำเนินการ, สถานะ และการดีบัก)
title: เบราว์เซอร์
x-i18n:
    generated_at: "2026-06-27T17:20:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

จัดการพื้นผิวการควบคุมเบราว์เซอร์ของ OpenClaw และเรียกใช้การกระทำของเบราว์เซอร์ (วงจรชีวิต, โปรไฟล์, แท็บ, สแนปช็อต, ภาพหน้าจอ, การนำทาง, อินพุต, การจำลองสถานะ และการดีบัก)

ที่เกี่ยวข้อง:

- เครื่องมือเบราว์เซอร์ + API: [เครื่องมือเบราว์เซอร์](/th/tools/browser)

## แฟล็กทั่วไป

- `--url <gatewayWsUrl>`: URL ของ Gateway WebSocket (ค่าเริ่มต้นมาจาก config)
- `--token <token>`: โทเค็น Gateway (หากจำเป็น)
- `--timeout <ms>`: หมดเวลาคำขอ (มิลลิวินาที)
- `--expect-final`: รอการตอบกลับสุดท้ายจาก Gateway
- `--browser-profile <name>`: เลือกโปรไฟล์เบราว์เซอร์ (ค่าเริ่มต้นจาก config)
- `--json`: เอาต์พุตที่เครื่องอ่านได้ (ในจุดที่รองรับ)

## เริ่มต้นอย่างรวดเร็ว (ภายในเครื่อง)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

เอเจนต์สามารถเรียกใช้การตรวจสอบความพร้อมเดียวกันด้วย `browser({ action: "doctor" })`

## การแก้ปัญหาอย่างรวดเร็ว

หาก `start` ล้มเหลวด้วย `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่า control plane ของเบราว์เซอร์ปกติดี และความล้มเหลวมักเกิดจากนโยบาย SSRF ของการนำทาง

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

- `doctor --deep` เพิ่มโพรบสแนปช็อตแบบสด มีประโยชน์เมื่อความพร้อมพื้นฐานของ CDP
  เป็นสีเขียว แต่คุณต้องการหลักฐานว่าสามารถตรวจสอบแท็บปัจจุบันได้
- สำหรับโปรไฟล์ `attachOnly` และ CDP ระยะไกล `openclaw browser stop` จะปิด
  เซสชันควบคุมที่ใช้งานอยู่และล้างการแทนที่การจำลองชั่วคราว แม้ว่า
  OpenClaw จะไม่ได้เปิดโปรเซสเบราว์เซอร์เองก็ตาม
- สำหรับโปรไฟล์ที่จัดการภายในเครื่อง `openclaw browser stop` จะหยุดโปรเซสเบราว์เซอร์
  ที่ถูกสร้างขึ้น
- `openclaw browser start --headless` ใช้กับคำขอเริ่มนั้นเท่านั้น และ
  เฉพาะเมื่อ OpenClaw เปิดเบราว์เซอร์ที่จัดการภายในเครื่องเท่านั้น คำสั่งนี้ไม่เขียนทับ
  `browser.headless` หรือ config โปรไฟล์ และไม่มีผลกับเบราว์เซอร์ที่กำลังทำงานอยู่แล้ว
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการภายในเครื่อง
  จะทำงานแบบ headless โดยอัตโนมัติ เว้นแต่ `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` หรือ `browser.profiles.<name>.headless=false`
  จะขอเบราว์เซอร์แบบมองเห็นได้อย่างชัดเจน

## หากคำสั่งหายไป

หาก `openclaw browser` เป็นคำสั่งที่ไม่รู้จัก ให้ตรวจสอบ `plugins.allow` ใน
`~/.openclaw/openclaw.json`

เมื่อมี `plugins.allow` ให้ระบุ Plugin เบราว์เซอร์ที่บันเดิลมาอย่างชัดเจน
เว้นแต่ config จะมีบล็อก `browser` ที่รากอยู่แล้ว:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` ที่รากอย่างชัดเจน เช่น `browser.enabled=true` หรือ
`browser.profiles.<name>` จะเปิดใช้งาน Plugin เบราว์เซอร์ที่บันเดิลมาภายใต้
allowlist ของ Plugin ที่จำกัดเช่นกัน

ที่เกี่ยวข้อง: [เครื่องมือเบราว์เซอร์](/th/tools/browser#missing-browser-command-or-tool)

## โปรไฟล์

โปรไฟล์คือ config การกำหนดเส้นทางเบราว์เซอร์ที่มีชื่อ ในทางปฏิบัติ:

- `openclaw`: เปิดหรือแนบกับอินสแตนซ์ Chrome เฉพาะที่ OpenClaw จัดการ (ไดเรกทอรีข้อมูลผู้ใช้แบบแยก)
- `user`: ควบคุมเซสชัน Chrome ที่คุณลงชื่อเข้าใช้อยู่ผ่าน Chrome DevTools MCP
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

`tabs` ส่งคืน `suggestedTargetId` ก่อน แล้วตามด้วย `tabId` ที่เสถียร เช่น `t1`,
ป้ายกำกับทางเลือก และ `targetId` ดิบ เอเจนต์ควรส่ง
`suggestedTargetId` กลับเข้าไปยัง `focus`, `close`, สแนปช็อต และการกระทำ คุณสามารถ
กำหนดป้ายกำกับด้วย `open --label`, `tab new --label` หรือ `tab label`; ป้ายกำกับ,
รหัสแท็บ, รหัสเป้าหมายดิบ และคำนำหน้ารหัสเป้าหมายที่ไม่ซ้ำกันล้วนใช้ได้
ฟิลด์คำขอยังคงชื่อ `targetId` เพื่อความเข้ากันได้ แต่ฟิลด์นี้ยอมรับ
การอ้างอิงแท็บเหล่านี้ ให้ถือว่ารหัสเป้าหมายดิบเป็นแฮนเดิลสำหรับวินิจฉัย ไม่ใช่
หน่วยความจำเอเจนต์ที่คงทน
เมื่อ Chromium แทนที่เป้าหมายดิบที่อยู่ข้างใต้ระหว่างการนำทางหรือการส่งฟอร์ม
OpenClaw จะคง `tabId`/ป้ายกำกับที่เสถียรไว้กับแท็บทดแทน
เมื่อสามารถพิสูจน์การจับคู่ได้ รหัสเป้าหมายดิบยังคงไม่เสถียร; ควรใช้
`suggestedTargetId`

## สแนปช็อต / ภาพหน้าจอ / การกระทำ

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
  จากเอาต์พุตสแนปช็อต แต่ไม่รองรับภาพหน้าจอ CSS `--element`
- `--labels` ซ้อน ref ของสแนปช็อตปัจจุบันบนภาพหน้าจอ บน
  โปรไฟล์ที่มี Playwright รองรับ จะทำงานกับ `--full-page` (การซ้อนป้ายกำกับแบบเต็มหน้า),
  `--ref` (การซ้อนป้ายกำกับแบบคลิปองค์ประกอบตาม ref ARIA) และ `--element`
  (การซ้อนป้ายกำกับแบบคลิปองค์ประกอบตามตัวเลือก CSS); ในโหมดคลิปองค์ประกอบ ป้ายกำกับ
  จะถูกฉายโดยสัมพันธ์กับองค์ประกอบ การตอบกลับยังมีอาร์เรย์
  `annotations` พร้อมกล่องขอบของแต่ละ ref แต่ละรายการมี `ref`,
  `number`, `role`, `name` ที่ไม่บังคับ และ `box: {x, y, width, height}`;
  พิกัดอยู่ในพื้นที่ของภาพที่จับมา (viewport / fullpage /
  สัมพันธ์กับองค์ประกอบ) ฟิลด์นี้จะถูกละไว้เมื่อว่าง
  โปรไฟล์ `existing-session` จะแสดงโอเวอร์เลย์ chrome-mcp บนภาพหน้าจอของหน้า
  แต่ไม่ได้ใช้ตัวช่วยการฉายของ Playwright และไม่มี
  `annotations`; ภาพหน้าจอ CSS `--element` ไม่รองรับในโปรไฟล์เหล่านั้น หากไม่มี
  Playwright หรือ chrome-mcp ภาพหน้าจอแบบมีป้ายกำกับจะใช้งานไม่ได้ รุ่นก่อนหน้า
  ละเว้น `--full-page`, `--ref` และ `--element` บนภาพหน้าจอ Playwright
  แบบมีป้ายกำกับ และส่งคืนการจับภาพ viewport เสมอ; ตอนนี้ภาพหน้าจอ
  แบบมีป้ายกำกับเคารพขอบเขตเหล่านั้นแล้ว
- `snapshot --urls` ต่อท้ายปลายทางลิงก์ที่ค้นพบเข้ากับสแนปช็อต AI เพื่อให้
  เอเจนต์สามารถเลือกเป้าหมายการนำทางโดยตรงแทนการเดาจากข้อความลิงก์อย่างเดียว

นำทาง/คลิก/พิมพ์ (ระบบอัตโนมัติ UI ตาม ref):

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` ยอมรับซอร์สของฟังก์ชัน นิพจน์ หรือเนื้อความของสเตตเมนต์
เนื้อความของสเตตเมนต์จะถูกครอบเป็นฟังก์ชัน async ดังนั้นให้ใช้ `return` สำหรับค่าที่
คุณต้องการส่งกลับ ใช้ `evaluate --timeout-ms <ms>` เมื่อฟังก์ชันฝั่งหน้าอาจ
ต้องใช้เวลานานกว่า timeout เริ่มต้นของ evaluate

การตอบกลับของการกระทำจะส่งคืน `targetId` ดิบปัจจุบันหลังจากการแทนที่หน้า
ที่เกิดจากการกระทำ เมื่อ OpenClaw สามารถพิสูจน์แท็บทดแทนได้ สคริปต์ควรยังคง
จัดเก็บและส่ง `suggestedTargetId`/ป้ายกำกับสำหรับเวิร์กโฟลว์ระยะยาว

ตัวช่วยไฟล์ + กล่องโต้ตอบ:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

โปรไฟล์ Chrome ที่จัดการจะบันทึกการดาวน์โหลดปกติที่เกิดจากการคลิกไปยังไดเรกทอรี
ดาวน์โหลดของ OpenClaw (`/tmp/openclaw/downloads` โดยค่าเริ่มต้น หรือราก temp ที่ตั้งค่าไว้)
ใช้ `waitfordownload` หรือ `download` เมื่อเอเจนต์ต้องรอไฟล์
เฉพาะและส่งคืนพาธของไฟล์; ตัวรอแบบชัดเจนเหล่านี้เป็นเจ้าของการดาวน์โหลดถัดไป
การอัปโหลดยอมรับไฟล์จากราก temp uploads ของ OpenClaw และสื่อขาเข้าที่ OpenClaw จัดการ
รวมถึงการอ้างอิง `media://inbound/<id>` และ `media/inbound/<id>`
ที่สัมพันธ์กับแซนด์บ็อกซ์ ref สื่อซ้อนกัน การไล่พาธ และพาธภายในเครื่องใดๆ
ยังคงถูกปฏิเสธ
เมื่อการกระทำเปิดกล่องโต้ตอบแบบ modal การตอบกลับของการกระทำจะส่งคืน
`blockedByDialog` พร้อม `browserState.dialogs.pending`; ส่ง `--dialog-id` เพื่อ
ตอบโดยตรง กล่องโต้ตอบที่จัดการภายนอก OpenClaw จะปรากฏใต้
`browserState.dialogs.recent`

## สถานะและพื้นที่จัดเก็บ

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

คุกกี้ + พื้นที่จัดเก็บ:

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
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

พาธเริ่มต้นของ existing-session คือการเชื่อมต่ออัตโนมัติ Chrome MCP แบบเฉพาะโฮสต์ หากเบราว์เซอร์กำลัง
ทำงานอยู่แล้วพร้อมปลายทาง DevTools ให้ส่ง `--cdp-url` เพื่อให้ Chrome MCP แนบกับปลายทางนั้นแทน
สำหรับ Docker, Browserless หรือการตั้งค่าระยะไกลอื่นๆ ที่ไม่จำเป็นต้องใช้ความหมายของ Chrome MCP ให้ใช้
โปรไฟล์ CDP

ขีดจำกัดปัจจุบันของ existing-session:

- การดำเนินการที่ขับเคลื่อนด้วยสแนปชอตใช้ refs ไม่ใช่ตัวเลือก CSS
- `browser.actionTimeoutMs` ตั้งค่าเริ่มต้นให้คำขอ `act` ที่รองรับเป็น 60000 ms เมื่อ
  ผู้เรียกไม่ได้ระบุ `timeoutMs`; `timeoutMs` รายครั้งยังคงมีผลเหนือกว่า
- `click` เป็นการคลิกซ้ายเท่านั้น
- `type` ไม่รองรับ `slowly=true`
- `press` ไม่รองรับ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` และ `evaluate` ปฏิเสธ
  การ override timeout รายครั้ง
- `select` รองรับค่าเดียวเท่านั้น
- `wait --load networkidle` ไม่รองรับบนโปรไฟล์เซสชันที่มีอยู่แล้ว (ใช้งานได้บน CDP แบบจัดการและแบบดิบ/ระยะไกล)
- การอัปโหลดไฟล์ต้องใช้ `--ref` / `--input-ref` ไม่รองรับ CSS
  `--element` และปัจจุบันรองรับครั้งละหนึ่งไฟล์
- ฮุกกล่องโต้ตอบไม่รองรับ `--timeout`
- สกรีนช็อตรองรับการจับภาพหน้าและ `--ref` แต่ไม่รองรับ CSS `--element`
- `responsebody`, การดักจับดาวน์โหลด, การส่งออก PDF และการดำเนินการแบบแบตช์ยังคง
  ต้องใช้เบราว์เซอร์แบบจัดการหรือโปรไฟล์ CDP แบบดิบ

## การควบคุมเบราว์เซอร์ระยะไกล (พร็อกซีโฮสต์ Node)

หาก Gateway ทำงานอยู่คนละเครื่องกับเบราว์เซอร์ ให้รัน **โฮสต์ Node** บนเครื่องที่มี Chrome/Brave/Edge/Chromium Gateway จะพร็อกซีการดำเนินการของเบราว์เซอร์ไปยัง Node นั้น (ไม่จำเป็นต้องมีเซิร์ฟเวอร์ควบคุมเบราว์เซอร์แยกต่างหาก)

ใช้ `gateway.nodes.browser.mode` เพื่อควบคุมการกำหนดเส้นทางอัตโนมัติ และใช้ `gateway.nodes.browser.node` เพื่อตรึง Node เฉพาะหากมีหลาย Node เชื่อมต่ออยู่

ความปลอดภัย + การตั้งค่าระยะไกล: [เครื่องมือเบราว์เซอร์](/th/tools/browser), [การเข้าถึงระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [ความปลอดภัย](/th/gateway/security)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [เบราว์เซอร์](/th/tools/browser)
