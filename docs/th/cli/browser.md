---
read_when:
    - คุณใช้ `openclaw browser` และต้องการตัวอย่างสำหรับงานทั่วไป
    - คุณต้องการควบคุมเบราว์เซอร์ที่ทำงานอยู่บนเครื่องอื่นผ่านโฮสต์ Node
    - คุณต้องการเชื่อมต่อกับ Chrome ในเครื่องที่ลงชื่อเข้าใช้อยู่ผ่าน Chrome MCP
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw browser` (วงจรชีวิต โปรไฟล์ แท็บ การดำเนินการ สถานะ และการแก้ไขข้อบกพร่อง)
title: เบราว์เซอร์
x-i18n:
    generated_at: "2026-07-20T05:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1cb233c5060c19120ab24b13e166cbd40035c81e6dd6ef0e70a4877a852f3b9a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

จัดการพื้นผิวควบคุมเบราว์เซอร์ของ OpenClaw และเรียกใช้การดำเนินการของเบราว์เซอร์ ได้แก่ วงจรชีวิต โปรไฟล์ แท็บ สแนปช็อต ภาพหน้าจอ การนำทาง อินพุต การจำลองสถานะ และการแก้ไขข้อบกพร่อง

ที่เกี่ยวข้อง: [เครื่องมือเบราว์เซอร์](/th/tools/browser)

## แฟล็กทั่วไป

- `--url <gatewayWsUrl>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นมาจากการกำหนดค่า)
- `--token <token>`: โทเค็น Gateway (หากจำเป็น)
- `--timeout <ms>`: ระยะหมดเวลาของคำขอเป็นมิลลิวินาที (ค่าเริ่มต้น: `30000`)
- `--expect-final`: รอการตอบกลับสุดท้ายจาก Gateway
- `--browser-profile <name>`: เลือกโปรไฟล์เบราว์เซอร์ (ค่าเริ่มต้น: `openclaw` หรือ `browser.defaultProfile`)
- `--json`: เอาต์พุตที่เครื่องอ่านได้ (ในตำแหน่งที่รองรับ) ตัวเลือกนี้เป็นตัวเลือกระดับเบราว์เซอร์ ดังนั้น
  ให้วางไว้ก่อนคำสั่งย่อยเพื่อให้รูปแบบไม่กำกวม เช่น
  `openclaw browser --json status` การวางไว้ท้ายคำสั่ง เช่น
  `openclaw browser status --json` ก็ใช้ได้เช่นกันเมื่อคำสั่งลูกที่เลือกไม่ได้
  กำหนด `--json` ของตนเอง

## เริ่มต้นอย่างรวดเร็ว (ภายในเครื่อง)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

เอเจนต์สามารถเรียกใช้การตรวจสอบความพร้อมแบบเดียวกันด้วย `browser({ action: "doctor" })`

## การแก้ไขปัญหาอย่างรวดเร็ว

หาก `start` ล้มเหลวโดยมี `not reachable after start` ให้แก้ไขปัญหาความพร้อมของ CDP ก่อน หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว ระนาบควบคุมเบราว์เซอร์จะยังทำงานเป็นปกติ และโดยทั่วไปความล้มเหลวเกิดจากนโยบาย SSRF ที่บล็อกการนำทาง

ลำดับขั้นต่ำ:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

คำแนะนำโดยละเอียด: [การแก้ไขปัญหาเบราว์เซอร์](/th/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- `doctor --deep` เพิ่มโพรบสแนปช็อตแบบสด ซึ่งมีประโยชน์เมื่อความพร้อมพื้นฐานของ CDP เป็นปกติ แต่ต้องการหลักฐานว่าสามารถตรวจสอบแท็บปัจจุบันได้
- สำหรับโปรไฟล์ที่จัดการภายในเครื่องและกำลังทำงานอยู่ `status` และ `doctor` จะรายงาน
  ข้อมูลวินิจฉัยกราฟิกที่แคชไว้จาก Chrome ได้แก่ การจัดประเภทฮาร์ดแวร์/ซอฟต์แวร์ ตัวเรนเดอร์
  แบ็กเอนด์ อุปกรณ์/ไดรเวอร์ รายละเอียดฟีเจอร์และสถานะที่ปิดใช้งาน ตลอดจน
  ความสามารถในการเร่งความเร็ววิดีโอ `openclaw browser --json status` จะส่งคืนเพย์โหลดที่มีโครงสร้างแบบเต็ม
  สถานะแบบพาสซีฟจะไม่เปิด Chrome เพียงเพื่อรวบรวมข้อมูลเหล่านี้
- `stop` ปิดเซสชันควบคุมที่ใช้งานอยู่และล้างการแทนที่การจำลองชั่วคราว แม้สำหรับ `attachOnly` และโปรไฟล์ CDP ระยะไกลที่ OpenClaw ไม่ได้เปิดกระบวนการเบราว์เซอร์เอง สำหรับโปรไฟล์ที่จัดการภายในเครื่อง `stop` จะหยุดกระบวนการเบราว์เซอร์ที่สร้างขึ้นด้วย
- `start --headless` มีผลเฉพาะกับคำขอเริ่มต้นนั้น และเฉพาะเมื่อ OpenClaw เปิดเบราว์เซอร์ที่จัดการภายในเครื่องเท่านั้น โดยจะไม่เขียน `browser.headless` หรือการกำหนดค่าโปรไฟล์ใหม่ และจะไม่ดำเนินการใดๆ สำหรับเบราว์เซอร์ที่กำลังทำงานอยู่แล้ว
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการภายในเครื่องจะทำงานแบบไม่มีส่วนติดต่อโดยอัตโนมัติ เว้นแต่ `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` หรือ `browser.profiles.<name>.headless=false` จะระบุอย่างชัดเจนให้ใช้เบราว์เซอร์ที่มองเห็นได้

## หากไม่มีคำสั่งนี้

หาก `openclaw browser` เป็นคำสั่งที่ไม่รู้จัก ให้ตรวจสอบ `plugins.allow` ใน `~/.openclaw/openclaw.json` เมื่อมี `plugins.allow` ให้ระบุ Plugin เบราว์เซอร์ที่รวมมาด้วยอย่างชัดเจน เว้นแต่การกำหนดค่าจะมีบล็อก `browser` ระดับรากอยู่แล้ว:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` ระดับรากที่ระบุอย่างชัดเจน (เช่น `browser.enabled=true` หรือ `browser.profiles.<name>`) จะเปิดใช้งาน Plugin เบราว์เซอร์ที่รวมมาด้วยภายใต้รายการอนุญาต Plugin แบบจำกัดเช่นกัน

ที่เกี่ยวข้อง: [เครื่องมือเบราว์เซอร์](/th/tools/browser#missing-browser-command-or-tool)

## โปรไฟล์

โปรไฟล์คือการกำหนดค่าการกำหนดเส้นทางเบราว์เซอร์ที่มีชื่อ:

- `openclaw` (ค่าเริ่มต้น): เปิดหรือเชื่อมต่อกับอินสแตนซ์ Chrome เฉพาะที่ OpenClaw จัดการ (ไดเรกทอรีข้อมูลผู้ใช้แยกต่างหาก)
- `user`: ควบคุมเซสชัน Chrome ที่เข้าสู่ระบบอยู่แล้วผ่าน Chrome DevTools MCP
- โปรไฟล์ CDP แบบกำหนดเอง: ชี้ไปยังปลายทาง CDP ภายในเครื่องหรือระยะไกล

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

ใช้โปรไฟล์ที่ระบุด้วย `--browser-profile <name>` กับคำสั่งย่อยใดก็ได้ เช่น `openclaw browser --browser-profile work tabs`

บน macOS `system-profiles` จะแสดงรายการโปรไฟล์ Chrome, Brave, Edge หรือ Chromium จริงที่มีอยู่บนโฮสต์ `import-profile` จะถอดรหัสคุกกี้หลังจากมีข้อความแจ้งขอความยินยอมจาก macOS Keychain/Touch ID หนึ่งครั้ง และแทรกคุกกี้ลงในโปรไฟล์ใหม่ที่ OpenClaw จัดการ โดยจะนำเข้าเฉพาะคุกกี้เท่านั้น ส่วนพื้นที่จัดเก็บภายในเครื่องและ IndexedDB จะไม่เปลี่ยนแปลง เซสชัน Google บางรายการใช้ข้อมูลประจำตัวของเซสชันที่ผูกกับอุปกรณ์ (DBSC) และอาจยังต้องยืนยันตัวตนใหม่หลังการนำเข้า

เมื่อแอป macOS ใช้ Gateway ภายในเครื่อง แอปสามารถเสนอการนำเข้านี้หนึ่งครั้ง และกำหนดให้โปรไฟล์แยกที่นำเข้าเป็นค่าเริ่มต้นสำหรับการท่องเว็บของเอเจนต์ การนำเข้าต้องมีการคลิกอย่างชัดเจนเสมอ การนำเข้าสำเร็จหรือการปิดข้อความแจ้งจะระงับข้อความแจ้งอัตโนมัติในภายหลัง และ **Settings → General → Browser login** จะยังคงใช้เพื่อนำเข้าอีกครั้งได้

การนำเข้าโปรไฟล์ระบบจะเปิดใช้งานตามค่าเริ่มต้น ตั้งค่า `browser.allowSystemProfileImport=false` เพื่อปิดใช้งานทั้งการนำเข้าที่ทริกเกอร์โดย CLI และเอเจนต์ การนำเข้าจะทำงานภายในโฮสต์เท่านั้นและไม่สามารถทำงานผ่านพร็อกซี Node ของเบราว์เซอร์ได้

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

`tabs` ส่งคืน `suggestedTargetId` ก่อน ตามด้วย `tabId` ที่คงที่ (เช่น `t1`) ป้ายกำกับที่ไม่บังคับ และ `targetId` แบบดิบ ส่ง `suggestedTargetId` กลับเข้าไปใน `focus`, `close`, สแนปช็อต และการดำเนินการ กำหนดป้ายกำกับด้วย `open --label`, `tab new --label` หรือ `tab label`; ระบบยอมรับทั้งป้ายกำกับ รหัสแท็บ รหัสเป้าหมายแบบดิบ และคำนำหน้ารหัสเป้าหมายที่ไม่ซ้ำกัน ฟิลด์คำขอยังคงใช้ชื่อ `targetId` เพื่อความเข้ากันได้ แต่ยอมรับการอ้างอิงแท็บเหล่านี้ได้ทั้งหมด

รหัสเป้าหมายแบบดิบเป็นแฮนเดิลวินิจฉัยที่เปลี่ยนแปลงได้ ไม่ใช่หน่วยความจำถาวรของเอเจนต์: เมื่อ Chromium แทนที่เป้าหมายแบบดิบพื้นฐานระหว่างการนำทางหรือการส่งแบบฟอร์ม OpenClaw จะคง `tabId`/ป้ายกำกับที่คงที่ไว้กับแท็บที่มาแทน หากสามารถพิสูจน์การจับคู่ได้ ควรใช้ `suggestedTargetId`

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

- `--full-page` ใช้สำหรับจับภาพหน้าเว็บเท่านั้น ไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element` ได้
- โปรไฟล์ `existing-session` / `user` รองรับภาพหน้าจอหน้าเว็บและภาพหน้าจอ `--ref` จากเอาต์พุตสแนปช็อต แต่ไม่รองรับภาพหน้าจอ CSS `--element`
- `--labels` ซ้อนทับการอ้างอิงสแนปช็อตปัจจุบันบนภาพหน้าจอ สำหรับโปรไฟล์ที่ใช้ Playwright ตัวเลือกนี้ทำงานร่วมกับ `--full-page` (การซ้อนทับแบบเต็มหน้า), `--ref` (การซ้อนทับภาพที่ตัดตามองค์ประกอบโดยใช้การอ้างอิง ARIA) และ `--element` (การซ้อนทับภาพที่ตัดตามองค์ประกอบโดยใช้ตัวเลือก CSS); ในโหมดตัดตามองค์ประกอบ ป้ายกำกับจะถูกฉายโดยสัมพันธ์กับองค์ประกอบ การตอบกลับยังรวมอาร์เรย์ `annotations` (ละไว้เมื่อว่าง) พร้อมกรอบล้อมของแต่ละการอ้างอิง ได้แก่ `ref`, `number`, `role`, `name` ที่ไม่บังคับ และ `box: {x, y, width, height}` ในพื้นที่พิกัดของภาพที่จับ (วิวพอร์ต / เต็มหน้า / สัมพันธ์กับองค์ประกอบ)
  โปรไฟล์ `existing-session` จะแสดงการซ้อนทับ chrome-mcp บนภาพหน้าจอหน้าเว็บ แต่ไม่ใช้ตัวช่วยการฉายของ Playwright และไม่รวม `annotations`; ภาพหน้าจอ CSS `--element` ไม่รองรับในโปรไฟล์ดังกล่าว หากไม่มี Playwright หรือ chrome-mcp จะไม่สามารถใช้ภาพหน้าจอที่มีป้ายกำกับได้
- `snapshot --urls` ต่อท้ายปลายทางลิงก์ที่ค้นพบเข้ากับสแนปช็อต AI เพื่อให้เอเจนต์สามารถเลือกเป้าหมายการนำทางโดยตรง แทนการคาดเดาจากข้อความลิงก์เพียงอย่างเดียว

นำทาง/คลิก/พิมพ์ (ระบบอัตโนมัติของ UI ที่อิงการอ้างอิง):

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

`evaluate --fn` ยอมรับซอร์สของฟังก์ชัน นิพจน์ หรือเนื้อหาคำสั่ง เนื้อหาคำสั่งจะถูกครอบเป็นฟังก์ชันแบบอะซิงโครนัส ดังนั้นให้ใช้ `return` สำหรับค่าที่ต้องการรับกลับ ใช้ `--timeout-ms` เมื่อฟังก์ชันฝั่งหน้าเว็บอาจต้องใช้เวลานานกว่าระยะหมดเวลาการประเมินเริ่มต้น `browser.evaluateEnabled=false` (ค่าเริ่มต้น: `true`) ปิดใช้งานทั้ง `evaluate` และ `wait --fn`

การตอบกลับของการดำเนินการจะส่งคืน `targetId` แบบดิบในปัจจุบัน หลังจากการแทนที่หน้าเว็บที่เกิดจากการดำเนินการ เมื่อ OpenClaw สามารถพิสูจน์แท็บที่มาแทนได้ สคริปต์ควรยังคงจัดเก็บและส่ง `suggestedTargetId`/ป้ายกำกับสำหรับเวิร์กโฟลว์ระยะยาว

ตัวช่วยไฟล์และกล่องโต้ตอบ:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

โปรไฟล์ Chrome ที่จัดการจะบันทึกการดาวน์โหลดทั่วไปที่ทริกเกอร์ด้วยการคลิกลงในไดเรกทอรีดาวน์โหลดของ OpenClaw (`/tmp/openclaw/downloads` ตามค่าเริ่มต้น หรือรากชั่วคราวที่กำหนดค่าไว้) ใช้ `waitfordownload` หรือ `download` เมื่อเอเจนต์ต้องรอไฟล์ที่ระบุและส่งคืนพาธของไฟล์ ตัวรอที่ระบุอย่างชัดเจนเหล่านั้นจะรับผิดชอบการดาวน์โหลดครั้งถัดไป การอัปโหลดยอมรับไฟล์จากรากการอัปโหลดชั่วคราวของ OpenClaw และสื่อขาเข้าที่ OpenClaw จัดการ รวมถึงการอ้างอิง `media://inbound/<id>` และ `media/inbound/<id>` ที่สัมพันธ์กับแซนด์บ็อกซ์ ระบบจะปฏิเสธการอ้างอิงสื่อแบบซ้อน การข้ามไดเรกทอรี และพาธภายในเครื่องตามอำเภอใจ

เมื่อการดำเนินการเปิดกล่องโต้ตอบแบบโมดอล การตอบกลับของการดำเนินการจะส่งคืน `blockedByDialog` พร้อม `browserState.dialogs.pending`; ส่ง `--dialog-id` เพื่อตอบกลับโดยตรง กล่องโต้ตอบที่จัดการภายนอก OpenClaw จะปรากฏภายใต้ `browserState.dialogs.recent`

## สถานะและพื้นที่จัดเก็บ

วิวพอร์ตและการจำลอง:

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

## การแก้ไขข้อบกพร่อง

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

ใช้โปรไฟล์ `user` ที่มีมาให้ หรือสร้างโปรไฟล์ `existing-session` ของคุณเอง:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

เส้นทาง existing-session เริ่มต้นคือการเชื่อมต่อ Chrome MCP อัตโนมัติบนโฮสต์เท่านั้น หากเบราว์เซอร์กำลังทำงานอยู่แล้วพร้อมปลายทาง DevTools ให้ส่ง `--cdp-url` เพื่อให้ Chrome MCP เชื่อมต่อกับปลายทางนั้นแทน สำหรับ Docker, Browserless หรือการตั้งค่าระยะไกลอื่น ๆ ที่ไม่จำเป็นต้องใช้ลักษณะการทำงานของ Chrome MCP ให้ใช้โปรไฟล์ CDP แทน

ข้อจำกัดของ existing-session ในปัจจุบัน:

- การดำเนินการที่อิงตาม Snapshot ใช้ refs ไม่ใช่ตัวเลือก CSS
- คำขอ `act` ที่รองรับจะใช้ค่าเริ่มต้นในตัว 60000 ms เมื่อผู้เรียกไม่ระบุ `timeoutMs`; `timeoutMs` ต่อการเรียกยังคงมีลำดับความสำคัญสูงกว่า
- `click` รองรับเฉพาะการคลิกซ้าย
- `type` ไม่รองรับ `slowly=true`
- `press` ไม่รองรับ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select` และ `fill` ปฏิเสธการแทนที่ระยะหมดเวลาต่อการเรียก; `evaluate` ยอมรับ `--timeout-ms`
- `select` รองรับค่าเดียวเท่านั้น
- ไม่รองรับ `wait --load networkidle` (ทำงานได้กับโปรไฟล์ CDP แบบจัดการและแบบดิบ/ระยะไกล)
- การอัปโหลดไฟล์ต้องใช้ `--ref` / `--input-ref`, ไม่รองรับ `--element` แบบ CSS และรองรับครั้งละหนึ่งไฟล์
- ฮุกไดอะล็อกไม่รองรับ `--timeout`
- ภาพหน้าจอรองรับการจับภาพหน้าและ `--ref` แต่ไม่รองรับ `--element` แบบ CSS
- `responsebody`, การสกัดกั้นการดาวน์โหลด, การส่งออก PDF และการดำเนินการแบบกลุ่มยังคงต้องใช้เบราว์เซอร์แบบจัดการหรือโปรไฟล์ CDP แบบดิบ

## การควบคุมเบราว์เซอร์ระยะไกล (พร็อกซีโฮสต์ Node)

หาก Gateway ทำงานบนเครื่องคนละเครื่องกับเบราว์เซอร์ ให้เรียกใช้ **โฮสต์ Node** บนเครื่องที่มี Chrome/Brave/Edge/Chromium โดย Gateway จะพร็อกซีการดำเนินการของเบราว์เซอร์ไปยัง Node นั้น จึงไม่จำเป็นต้องมีเซิร์ฟเวอร์ควบคุมเบราว์เซอร์แยกต่างหาก

ใช้ `gateway.nodes.browser.mode` เพื่อควบคุมการกำหนดเส้นทางอัตโนมัติ และใช้ `gateway.nodes.browser.node` เพื่อระบุ Node ที่ต้องการหากมีการเชื่อมต่อหลาย Node

การรักษาความปลอดภัย + การตั้งค่าระยะไกล: [เครื่องมือเบราว์เซอร์](/th/tools/browser), [การเข้าถึงระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [การรักษาความปลอดภัย](/th/gateway/security)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [เบราว์เซอร์](/th/tools/browser)
