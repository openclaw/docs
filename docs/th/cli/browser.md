---
read_when:
    - คุณใช้ `openclaw browser` และต้องการตัวอย่างสำหรับงานทั่วไป
    - คุณต้องการควบคุมเบราว์เซอร์ที่ทำงานอยู่บนเครื่องอื่นผ่านโฮสต์ Node
    - คุณต้องการเชื่อมต่อกับ Chrome ในเครื่องที่ลงชื่อเข้าใช้ไว้ผ่าน Chrome MCP
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw browser` (วงจรชีวิต โปรไฟล์ แท็บ การดำเนินการ สถานะ และการดีบัก)
title: เบราว์เซอร์
x-i18n:
    generated_at: "2026-07-16T18:49:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

จัดการพื้นผิวควบคุมเบราว์เซอร์ของ OpenClaw และเรียกใช้การดำเนินการของเบราว์เซอร์ ได้แก่ วงจรชีวิต โปรไฟล์ แท็บ สแนปช็อต ภาพหน้าจอ การนำทาง การป้อนข้อมูล การจำลองสถานะ และการดีบัก

ที่เกี่ยวข้อง: [เครื่องมือเบราว์เซอร์](/th/tools/browser)

## แฟล็กทั่วไป

- `--url <gatewayWsUrl>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นมาจากการกำหนดค่า)
- `--token <token>`: โทเค็น Gateway (หากจำเป็น)
- `--timeout <ms>`: ระยะหมดเวลาของคำขอเป็นมิลลิวินาที (ค่าเริ่มต้น: `30000`)
- `--expect-final`: รอการตอบกลับสุดท้ายจาก Gateway
- `--browser-profile <name>`: เลือกโปรไฟล์เบราว์เซอร์ (ค่าเริ่มต้น: `openclaw` หรือ `browser.defaultProfile`)
- `--json`: เอาต์พุตที่เครื่องอ่านได้ (เมื่อรองรับ) ตัวเลือกนี้เป็นตัวเลือกระดับเบราว์เซอร์ ดังนั้น
  ให้วางไว้ก่อนคำสั่งย่อยเพื่อให้รูปแบบไม่กำกวม เช่น
  `openclaw browser --json status` การวางไว้ท้ายคำสั่ง เช่น
  `openclaw browser status --json` ก็ใช้ได้เช่นกันเมื่อคำสั่งลูกที่เลือกไม่ได้
  กำหนด `--json` ของตัวเอง

## เริ่มต้นอย่างรวดเร็ว (ภายในเครื่อง)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

เอเจนต์สามารถเรียกใช้การตรวจสอบความพร้อมแบบเดียวกันด้วย `browser({ action: "doctor" })`

## การแก้ไขปัญหาอย่างรวดเร็ว

หาก `start` ล้มเหลวพร้อม `not reachable after start` ให้แก้ไขปัญหาความพร้อมของ CDP ก่อน หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่าระนาบควบคุมเบราว์เซอร์ทำงานปกติ และโดยทั่วไปความล้มเหลวเกิดจากนโยบาย SSRF ที่บล็อกการนำทาง

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

- `doctor --deep` เพิ่มการตรวจสอบสแนปช็อตแบบสด ซึ่งมีประโยชน์เมื่อความพร้อมพื้นฐานของ CDP เป็นปกติ แต่ต้องการหลักฐานว่าสามารถตรวจสอบแท็บปัจจุบันได้
- สำหรับโปรไฟล์ที่จัดการภายในเครื่องซึ่งกำลังทำงานอยู่ `status` และ `doctor` จะรายงาน
  ข้อมูลวินิจฉัยกราฟิกที่แคชไว้จาก Chrome ได้แก่ การจำแนกฮาร์ดแวร์/ซอฟต์แวร์ ตัวเรนเดอร์
  แบ็กเอนด์ อุปกรณ์/ไดรเวอร์ รายละเอียดฟีเจอร์และสถานะที่ปิดใช้งาน ตลอดจน
  ความสามารถด้านวิดีโอแบบเร่งความเร็ว `openclaw browser --json status` จะคืนเพย์โหลดแบบมีโครงสร้างทั้งหมด
  สถานะแบบพาสซีฟจะไม่เปิด Chrome เพียงเพื่อรวบรวมข้อมูลเหล่านี้
- `stop` ปิดเซสชันควบคุมที่ใช้งานอยู่และล้างการแทนที่การจำลองชั่วคราว แม้แต่สำหรับโปรไฟล์ `attachOnly` และโปรไฟล์ CDP ระยะไกลที่ OpenClaw ไม่ได้เปิดกระบวนการเบราว์เซอร์เอง สำหรับโปรไฟล์ที่จัดการภายในเครื่อง `stop` จะหยุดกระบวนการเบราว์เซอร์ที่เปิดขึ้นด้วย
- `start --headless` ใช้เฉพาะกับคำขอเริ่มต้นนั้น และเฉพาะเมื่อ OpenClaw เปิดเบราว์เซอร์ที่จัดการภายในเครื่อง ตัวเลือกนี้จะไม่เขียน `browser.headless` หรือการกำหนดค่าโปรไฟล์ใหม่ และจะไม่มีผลกับเบราว์เซอร์ที่กำลังทำงานอยู่แล้ว
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการภายในเครื่องจะทำงานแบบไม่มีส่วนหัวโดยอัตโนมัติ เว้นแต่ `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` หรือ `browser.profiles.<name>.headless=false` จะร้องขอเบราว์เซอร์ที่มองเห็นได้อย่างชัดเจน

## หากไม่มีคำสั่งนี้

หาก `openclaw browser` เป็นคำสั่งที่ไม่รู้จัก ให้ตรวจสอบ `plugins.allow` ใน `~/.openclaw/openclaw.json` เมื่อมี `plugins.allow` ให้ระบุ Plugin เบราว์เซอร์ที่รวมมาอย่างชัดเจน เว้นแต่การกำหนดค่าจะมีบล็อก `browser` ระดับรากอยู่แล้ว:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` ระดับรากที่ระบุอย่างชัดเจน (เช่น `browser.enabled=true` หรือ `browser.profiles.<name>`) จะเปิดใช้งาน Plugin เบราว์เซอร์ที่รวมมาภายใต้รายการอนุญาต Plugin แบบจำกัดด้วย

ที่เกี่ยวข้อง: [เครื่องมือเบราว์เซอร์](/th/tools/browser#missing-browser-command-or-tool)

## โปรไฟล์

โปรไฟล์คือการกำหนดค่าการกำหนดเส้นทางเบราว์เซอร์ที่มีชื่อ:

- `openclaw` (ค่าเริ่มต้น): เปิดหรือเชื่อมต่อกับอินสแตนซ์ Chrome เฉพาะที่ OpenClaw จัดการ (ไดเรกทอรีข้อมูลผู้ใช้แยกต่างหาก)
- `user`: ควบคุมเซสชัน Chrome ที่ลงชื่อเข้าใช้อยู่แล้วผ่าน Chrome DevTools MCP
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

ใช้โปรไฟล์เฉพาะด้วย `--browser-profile <name>` กับคำสั่งย่อยใดก็ได้ เช่น `openclaw browser --browser-profile work tabs`

บน macOS คำสั่ง `system-profiles` จะแสดงโปรไฟล์ Chrome, Brave, Edge หรือ Chromium จริงที่มีอยู่บนโฮสต์ คำสั่ง `import-profile` จะถอดรหัสคุกกี้หลังจากมีพรอมต์ขอความยินยอมจาก macOS Keychain/Touch ID หนึ่งครั้ง แล้วแทรกคุกกี้ลงในโปรไฟล์ใหม่ที่ OpenClaw จัดการ โดยจะนำเข้าเฉพาะคุกกี้ ส่วนที่จัดเก็บในเครื่องและ IndexedDB จะไม่เปลี่ยนแปลง เซสชัน Google บางรายการใช้ข้อมูลประจำตัวของเซสชันที่ผูกกับอุปกรณ์ (DBSC) และอาจยังต้องยืนยันตัวตนอีกครั้งหลังนำเข้า

เมื่อแอป macOS ใช้ Gateway ภายในเครื่อง แอปสามารถเสนอการนำเข้านี้ได้หนึ่งครั้ง และตั้งโปรไฟล์แยกที่นำเข้าเป็นค่าเริ่มต้นสำหรับการท่องเว็บของเอเจนต์ การนำเข้าต้องมีการคลิกอย่างชัดเจนเสมอ การนำเข้าสำเร็จหรือการปิดพรอมต์จะระงับพรอมต์อัตโนมัติในภายหลัง และ **Settings → General → Browser login** ยังคงพร้อมใช้งานสำหรับการนำเข้าอีกครั้ง

การนำเข้าโปรไฟล์ระบบเปิดใช้งานโดยค่าเริ่มต้น ตั้งค่า `browser.allowSystemProfileImport=false` เพื่อปิดใช้งานทั้งการนำเข้าที่เรียกจาก CLI และเอเจนต์ การนำเข้าเป็นการดำเนินการภายในโฮสต์และไม่สามารถทำผ่านพร็อกซี Node ของเบราว์เซอร์ได้

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

`tabs` คืนค่า `suggestedTargetId` ก่อน ตามด้วย `tabId` ที่เสถียร (เช่น `t1`) ป้ายกำกับที่มีหรือไม่มีก็ได้ และ `targetId` แบบดิบ ส่ง `suggestedTargetId` กลับไปยัง `focus`, `close`, สแนปช็อต และการดำเนินการ กำหนดป้ายกำกับด้วย `open --label`, `tab new --label` หรือ `tab label`; ระบบรองรับป้ายกำกับ รหัสแท็บ รหัสเป้าหมายแบบดิบ และคำนำหน้ารหัสเป้าหมายที่ไม่ซ้ำกันทั้งหมด ฟิลด์คำขอยังคงชื่อ `targetId` เพื่อความเข้ากันได้ แต่รองรับการอ้างอิงแท็บเหล่านี้ทุกรูปแบบ

รหัสเป้าหมายแบบดิบเป็นแฮนเดิลวินิจฉัยที่เปลี่ยนแปลงได้ ไม่ใช่หน่วยความจำถาวรของเอเจนต์: เมื่อ Chromium แทนที่เป้าหมายดิบเบื้องหลังระหว่างการนำทางหรือการส่งฟอร์ม OpenClaw จะคง `tabId`/ป้ายกำกับที่เสถียรไว้กับแท็บที่ใช้แทน เมื่อสามารถพิสูจน์ได้ว่าตรงกัน ควรใช้ `suggestedTargetId`

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

- `--full-page` ใช้สำหรับจับภาพหน้าเว็บเท่านั้น และไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element`
- โปรไฟล์ `existing-session` / `user` รองรับภาพหน้าจอของหน้าเว็บและภาพหน้าจอ `--ref` จากเอาต์พุตสแนปช็อต แต่ไม่รองรับภาพหน้าจอ CSS `--element`
- `--labels` ซ้อนทับการอ้างอิงสแนปช็อตปัจจุบันบนภาพหน้าจอ สำหรับโปรไฟล์ที่ใช้ Playwright ตัวเลือกนี้ทำงานร่วมกับ `--full-page` (การซ้อนทับแบบเต็มหน้า), `--ref` (การซ้อนทับแบบตัดตามองค์ประกอบด้วยการอ้างอิง ARIA) และ `--element` (การซ้อนทับแบบตัดตามองค์ประกอบด้วยตัวเลือก CSS); ในโหมดตัดตามองค์ประกอบ ป้ายกำกับจะถูกฉายตำแหน่งโดยสัมพันธ์กับองค์ประกอบ การตอบกลับยังมีอาร์เรย์ `annotations` (ละไว้เมื่อว่าง) ซึ่งประกอบด้วยกรอบล้อมรอบของแต่ละการอ้างอิง ได้แก่ `ref`, `number`, `role`, `name` ที่มีหรือไม่มีก็ได้ และ `box: {x, y, width, height}` ในพื้นที่พิกัดของภาพที่จับได้ (วิวพอร์ต / เต็มหน้า / สัมพันธ์กับองค์ประกอบ)
  โปรไฟล์ `existing-session` แสดงโอเวอร์เลย์ chrome-mcp บนภาพหน้าจอของหน้าเว็บ แต่ไม่ใช้ตัวช่วยฉายตำแหน่งของ Playwright และไม่มี `annotations`; ภาพหน้าจอ CSS `--element` ไม่รองรับในโปรไฟล์ดังกล่าว หากไม่มี Playwright หรือ chrome-mcp จะไม่สามารถใช้ภาพหน้าจอที่มีป้ายกำกับได้
- `snapshot --urls` เพิ่มปลายทางลิงก์ที่ค้นพบต่อท้ายสแนปช็อตสำหรับ AI เพื่อให้เอเจนต์เลือกเป้าหมายการนำทางโดยตรงแทนการคาดเดาจากข้อความลิงก์เพียงอย่างเดียว

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

`evaluate --fn` รองรับซอร์สของฟังก์ชัน นิพจน์ หรือเนื้อความคำสั่ง เนื้อความคำสั่งจะถูกห่อเป็นฟังก์ชันแบบอะซิงโครนัส ดังนั้นให้ใช้ `return` สำหรับค่าที่ต้องการส่งกลับ ใช้ `--timeout-ms` เมื่อฟังก์ชันฝั่งหน้าเว็บอาจต้องใช้เวลานานกว่าระยะหมดเวลาประเมินค่าเริ่มต้น `browser.evaluateEnabled=false` (ค่าเริ่มต้น: `true`) จะปิดใช้งานทั้ง `evaluate` และ `wait --fn`

การตอบกลับจากการดำเนินการจะคืน `targetId` แบบดิบในปัจจุบันหลังการแทนที่หน้าเว็บที่เกิดจากการดำเนินการ เมื่อ OpenClaw สามารถพิสูจน์แท็บที่ใช้แทนได้ สคริปต์ควรจัดเก็บและส่ง `suggestedTargetId`/ป้ายกำกับสำหรับเวิร์กโฟลว์ระยะยาวต่อไป

ตัวช่วยไฟล์และกล่องโต้ตอบ:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

โปรไฟล์ Chrome ที่จัดการจะบันทึกไฟล์ดาวน์โหลดทั่วไปซึ่งเกิดจากการคลิกไว้ในไดเรกทอรีดาวน์โหลดของ OpenClaw (ค่าเริ่มต้นคือ `/tmp/openclaw/downloads` หรือรูทชั่วคราวที่กำหนดค่าไว้) ใช้ `waitfordownload` หรือ `download` เมื่อเอเจนต์ต้องรอไฟล์เฉพาะและส่งคืนพาธของไฟล์ ตัวรอที่ระบุอย่างชัดเจนเหล่านี้จะรับผิดชอบการดาวน์โหลดครั้งถัดไป การอัปโหลดรองรับไฟล์จากรูทการอัปโหลดชั่วคราวของ OpenClaw และสื่อขาเข้าที่ OpenClaw จัดการ รวมถึงการอ้างอิง `media://inbound/<id>` และ `media/inbound/<id>` ที่สัมพันธ์กับแซนด์บ็อกซ์ ระบบจะปฏิเสธการอ้างอิงสื่อแบบซ้อน การท่องข้ามไดเรกทอรี และพาธภายในเครื่องโดยพลการ

เมื่อการดำเนินการเปิดกล่องโต้ตอบแบบโมดัล การตอบกลับจากการดำเนินการจะคืน `blockedByDialog` พร้อม `browserState.dialogs.pending`; ส่ง `--dialog-id` เพื่อตอบกลับโดยตรง กล่องโต้ตอบที่จัดการภายนอก OpenClaw จะปรากฏภายใต้ `browserState.dialogs.recent`

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

คุกกี้และพื้นที่จัดเก็บ:

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

พาธเริ่มต้นของ existing-session คือการเชื่อมต่อ Chrome MCP อัตโนมัติเฉพาะบนโฮสต์ หากเบราว์เซอร์กำลังทำงานพร้อมปลายทาง DevTools อยู่แล้ว ให้ส่ง `--cdp-url` เพื่อให้ Chrome MCP เชื่อมต่อกับปลายทางนั้นแทน สำหรับ Docker, Browserless หรือการตั้งค่าระยะไกลอื่นๆ ที่ไม่จำเป็นต้องใช้ลักษณะการทำงานของ Chrome MCP ให้ใช้โปรไฟล์ CDP แทน

ข้อจำกัดปัจจุบันของ existing-session:

- การดำเนินการที่อิงสแนปช็อตใช้ refs ไม่ใช่ตัวเลือก CSS
- `browser.actionTimeoutMs` กำหนดค่าเริ่มต้นให้คำขอ `act` ที่รองรับเป็น 60000 ms เมื่อผู้เรียกไม่ได้ระบุ `timeoutMs`; `timeoutMs` ต่อการเรียกยังคงมีผลเหนือกว่า
- `click` รองรับเฉพาะการคลิกซ้าย
- `type` ไม่รองรับ `slowly=true`
- `press` ไม่รองรับ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select` และ `fill` ปฏิเสธการกำหนดเวลาหมดเวลาทับเป็นรายครั้ง; `evaluate` ยอมรับ `--timeout-ms`
- `select` รองรับค่าเดียวเท่านั้น
- ไม่รองรับ `wait --load networkidle` (ใช้งานได้กับโปรไฟล์ CDP แบบมีการจัดการและแบบดิบ/ระยะไกล)
- การอัปโหลดไฟล์ต้องใช้ `--ref` / `--input-ref`, ไม่รองรับ CSS `--element` และรองรับครั้งละหนึ่งไฟล์
- ฮุกกล่องโต้ตอบไม่รองรับ `--timeout`
- ภาพหน้าจอรองรับการจับภาพหน้าและ `--ref` แต่ไม่รองรับ CSS `--element`
- `responsebody`, การดักจับการดาวน์โหลด, การส่งออก PDF และการดำเนินการแบบกลุ่มยังคงต้องใช้เบราว์เซอร์แบบมีการจัดการหรือโปรไฟล์ CDP แบบดิบ

## การควบคุมเบราว์เซอร์ระยะไกล (พร็อกซีโฮสต์ Node)

หาก Gateway ทำงานบนเครื่องคนละเครื่องกับเบราว์เซอร์ ให้เรียกใช้ **โฮสต์ Node** บนเครื่องที่มี Chrome/Brave/Edge/Chromium โดย Gateway จะพร็อกซีการดำเนินการของเบราว์เซอร์ไปยัง Node นั้น จึงไม่จำเป็นต้องมีเซิร์ฟเวอร์ควบคุมเบราว์เซอร์แยกต่างหาก

ใช้ `gateway.nodes.browser.mode` เพื่อควบคุมการกำหนดเส้นทางอัตโนมัติ และใช้ `gateway.nodes.browser.node` เพื่อปักหมุด Node ที่ระบุหากเชื่อมต่อไว้หลาย Node

การตั้งค่าความปลอดภัยและระยะไกล: [เครื่องมือเบราว์เซอร์](/th/tools/browser), [การเข้าถึงระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [ความปลอดภัย](/th/gateway/security)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [เบราว์เซอร์](/th/tools/browser)
