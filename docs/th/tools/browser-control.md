---
read_when:
    - การเขียนสคริปต์หรือการดีบักเบราว์เซอร์ของเอเจนต์ผ่าน API ควบคุมภายในเครื่อง
    - กำลังมองหาเอกสารอ้างอิง CLI ของ `openclaw browser`
    - การเพิ่มระบบอัตโนมัติของเบราว์เซอร์แบบกำหนดเองด้วยสแนปชอตและ refs
summary: API ควบคุมเบราว์เซอร์ของ OpenClaw, เอกสารอ้างอิง CLI และการดำเนินการสคริปต์
title: API การควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-06-27T18:25:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ไขปัญหา โปรดดู [เบราว์เซอร์](/th/tools/browser)
หน้านี้เป็นเอกสารอ้างอิงสำหรับ API HTTP ควบคุมภายในเครื่อง, CLI `openclaw browser`
และรูปแบบการเขียนสคริปต์ (สแนปช็อต, refs, การรอ, โฟลว์ดีบัก)

## API ควบคุม (ไม่บังคับ)

สำหรับการผสานการทำงานภายในเครื่องเท่านั้น Gateway จะเปิดเผย API HTTP แบบ local loopback ขนาดเล็ก
เซิร์ฟเวอร์แบบสแตนด์อโลนนี้เป็นแบบเลือกเปิดใช้ — ตั้งค่าตัวแปรสภาพแวดล้อม
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` ในสภาพแวดล้อมของบริการ gateway
แล้วรีสตาร์ต gateway ก่อนที่ปลายทาง HTTP จะพร้อมใช้งาน หากไม่มี
ตัวแปรนี้ รันไทม์ควบคุมเบราว์เซอร์ยังคงทำงานผ่าน CLI และ
เครื่องมือเอเจนต์ได้ แต่จะไม่มีสิ่งใดฟังอยู่บนพอร์ตควบคุม loopback

- สถานะ/เริ่ม/หยุด: `GET /`, `POST /start`, `POST /stop`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- สแนปช็อต/ภาพหน้าจอ: `GET /snapshot`, `POST /screenshot`
- การกระทำ: `POST /navigate`, `POST /act`
- ฮุก: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- การดาวน์โหลด: `POST /download`, `POST /wait/download`
- สิทธิ์: `POST /permissions/grant`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ปลายทางทั้งหมดรับ `?profile=<name>` ได้ `POST /start?headless=true` จะร้องขอการเปิดแบบ headless หนึ่งครั้ง
สำหรับโปรไฟล์ที่ OpenClaw จัดการภายในเครื่อง โดยไม่เปลี่ยนค่ากำหนดเบราว์เซอร์ที่บันทึกถาวรไว้
โปรไฟล์แบบ attach-only, remote CDP และ existing-session จะปฏิเสธการ override
ดังกล่าว เพราะ OpenClaw ไม่ได้เปิดโปรเซสเบราว์เซอร์เหล่านั้น

สำหรับปลายทางแท็บ `targetId` คือชื่อฟิลด์เพื่อความเข้ากันได้ แนะนำให้ส่ง
`suggestedTargetId` จาก `GET /tabs` หรือ `POST /tabs/open`; ป้ายกำกับและ handle `tabId`
เช่น `t1` ก็รับได้เช่นกัน Raw CDP target ids และ prefix ของ raw
target-id ที่ไม่ซ้ำกันยังคงใช้ได้ แต่เป็น handle เพื่อการวินิจฉัยที่เปลี่ยนแปลงได้

หากกำหนดค่า auth ของ gateway แบบ shared-secret ไว้ เส้นทาง HTTP ของเบราว์เซอร์ก็ต้องใช้ auth ด้วย:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth ด้วยรหัสผ่านนั้น

หมายเหตุ:

- API เบราว์เซอร์ loopback แบบสแตนด์อโลนนี้ **ไม่** ใช้ trusted-proxy หรือ
  เฮดเดอร์ตัวตนของ Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` เส้นทางเบราว์เซอร์ loopback
  เหล่านี้จะไม่สืบทอดโหมดที่พกตัวตนดังกล่าวมา ให้คงไว้เป็น loopback-only

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบความถูกต้องระดับเส้นทางและ
ความล้มเหลวตามนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): ไม่มี `kind` หรือไม่รู้จัก
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของการกระทำ normalize หรือตรวจสอบความถูกต้องไม่ผ่าน
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): มีการใช้ `selector` กับชนิดการกระทำที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดใช้โดย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนหรือแบบแบตช์ขัดแย้งกับ target ของคำขอ
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): ไม่รองรับการกระทำนี้สำหรับโปรไฟล์ existing-session

ความล้มเหลวอื่น ๆ ระหว่างรันไทม์อาจยังส่งคืน `{ "error": "<message>" }` โดยไม่มีฟิลด์
`code`

### ข้อกำหนด Playwright

บางฟีเจอร์ (navigate/act/AI snapshot/role snapshot, ภาพหน้าจอองค์ประกอบ,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright ปลายทางเหล่านั้นจะส่งคืน
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังทำงานได้โดยไม่มี Playwright:

- สแนปช็อต ARIA
- สแนปช็อต accessibility แบบ role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) เมื่อมี per-tab CDP WebSocket ให้ใช้ นี่เป็น
  fallback สำหรับการตรวจสอบและการค้นหา ref; Playwright ยังคงเป็น
  เอนจินหลักสำหรับการกระทำ
- ภาพหน้าจอหน้าเว็บสำหรับเบราว์เซอร์ `openclaw` ที่จัดการไว้ เมื่อมี per-tab CDP
  WebSocket ให้ใช้
- ภาพหน้าจอหน้าเว็บสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- ภาพหน้าจอแบบ ref-based ของ `existing-session` (`--ref`) จากผลลัพธ์สแนปช็อต

สิ่งที่ยังต้องใช้ Playwright:

- `navigate`
- `act`
- สแนปช็อต AI ที่ขึ้นกับรูปแบบ AI snapshot ดั้งเดิมของ Playwright
- ภาพหน้าจอองค์ประกอบด้วย CSS-selector (`--element`)
- การส่งออก PDF ของเบราว์เซอร์เต็มรูปแบบ

ภาพหน้าจอองค์ประกอบยังปฏิเสธ `--full-page` ด้วย; เส้นทางจะส่งคืน `fullPage is
not supported for element screenshots`

หากคุณเห็น `Playwright is not available in this gateway build` แสดงว่า Gateway
ที่แพ็กเกจมาขาด dependency รันไทม์เบราว์เซอร์หลัก ติดตั้งใหม่หรืออัปเดต
OpenClaw แล้วรีสตาร์ต gateway สำหรับ Docker ให้ติดตั้งไบนารีเบราว์เซอร์ Chromium
ตามที่แสดงด้านล่างด้วย

#### การติดตั้ง Docker Playwright

หาก Gateway ของคุณทำงานใน Docker ให้หลีกเลี่ยง `npx playwright` (เกิดความขัดแย้งกับ npm override)
สำหรับอิมเมจแบบกำหนดเอง ให้ฝัง Chromium ลงในอิมเมจ:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

สำหรับอิมเมจที่มีอยู่แล้ว ให้ติดตั้งผ่าน CLI ที่บันเดิลมาแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

หากต้องการเก็บการดาวน์โหลดเบราว์เซอร์ไว้ถาวร ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (เช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกเก็บถาวรผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount OpenClaw จะตรวจจับ Chromium ที่เก็บถาวรไว้บน Linux
โดยอัตโนมัติ ดู [Docker](/th/install/docker)

## วิธีทำงาน (ภายใน)

เซิร์ฟเวอร์ควบคุม loopback ขนาดเล็กรับคำขอ HTTP และเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium ผ่าน CDP การกระทำขั้นสูง (click/type/snapshot/PDF) จะผ่าน Playwright บน CDP; เมื่อไม่มี Playwright จะใช้ได้เฉพาะการดำเนินการที่ไม่ใช่ Playwright เอเจนต์เห็นอินเทอร์เฟซที่เสถียรหนึ่งชุด ขณะที่เบราว์เซอร์และโปรไฟล์ในเครื่อง/ระยะไกลสลับกันอยู่เบื้องล่างได้อย่างอิสระ

## อ้างอิงด่วน CLI

คำสั่งทั้งหมดรับ `--browser-profile <name>` เพื่อระบุโปรไฟล์เฉพาะ และ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

หมายเหตุ:

- `upload` และ `dialog` เป็นการเรียกแบบ **arming**; ให้เรียกก่อน click/press ที่จะเปิด chooser/dialog หากการกระทำเปิด modal การตอบกลับของการกระทำจะมี `blockedByDialog` และ `browserState.dialogs.pending`; ส่ง `dialogId` นั้นเพื่อโต้ตอบโดยตรง Dialog ที่จัดการนอก OpenClaw จะปรากฏใต้ `browserState.dialogs.recent`
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (ตัวเลข `12`, role ref `e12` หรือ actionable ARIA ref `ax12`) โดยตั้งใจไม่รองรับ CSS selectors สำหรับการกระทำ ใช้ `click-coords` เมื่อตำแหน่งที่มองเห็นได้ใน viewport เป็นเป้าหมายเดียวที่เชื่อถือได้
- เส้นทางดาวน์โหลดและ trace ถูกจำกัดให้อยู่ใน temp roots ของ OpenClaw: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` รับไฟล์จาก temp uploads root ของ OpenClaw และ
  สื่อ inbound ที่ OpenClaw จัดการ สื่อ inbound ที่จัดการไว้สามารถอ้างอิงได้เป็น
  `media://inbound/<id>`, `media/inbound/<id>` แบบสัมพันธ์กับ sandbox หรือเส้นทางที่ resolve แล้ว
  ภายในไดเรกทอรีสื่อ inbound ที่จัดการไว้ nested media refs,
  traversal, symlinks, hardlinks และเส้นทางภายในเครื่องใด ๆ ยังคงถูกปฏิเสธ
- `upload` ยังสามารถตั้งค่า file inputs โดยตรงผ่าน `--input-ref` หรือ `--element`

รหัสแท็บและป้ายกำกับที่เสถียรจะคงอยู่หลัง Chromium แทนที่ raw-target เมื่อ OpenClaw
พิสูจน์แท็บที่มาแทนได้ เช่น URL เดียวกัน หรือแท็บเก่าเพียงแท็บเดียวกลายเป็น
แท็บใหม่เพียงแท็บเดียวหลังส่งฟอร์ม Raw target ids ยังคงเปลี่ยนแปลงได้; ในสคริปต์ให้เลือกใช้
`suggestedTargetId` จาก `tabs`

สรุปแฟล็กสแนปช็อต:

- `--format ai` (ค่าเริ่มต้นเมื่อใช้ Playwright): สแนปช็อต AI พร้อม refs แบบตัวเลข (`aria-ref="<n>"`)
- `--format aria`: ต้นไม้การช่วยการเข้าถึงพร้อม refs แบบ `axN` เมื่อมี Playwright พร้อมใช้งาน OpenClaw จะผูก refs กับรหัส DOM ฝั่งแบ็กเอนด์เข้ากับหน้าสด เพื่อให้การดำเนินการถัดไปใช้งานได้ ไม่เช่นนั้นให้ถือว่าผลลัพธ์ใช้สำหรับตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): พรีเซ็ตสแนปช็อตบทบาทแบบกะทัดรัด ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อให้เป็นค่าเริ่มต้น (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` บังคับใช้สแนปช็อตบทบาทพร้อม refs แบบ `ref=e12` `--frame "<iframe>"` จำกัดขอบเขตสแนปช็อตบทบาทไว้ที่ iframe
- เมื่อใช้ Playwright, `--labels` จะเพิ่มภาพหน้าจอพร้อมป้าย ref ที่ซ้อนทับ
  (พิมพ์ `MEDIA:<path>`) รวมถึงอาร์เรย์ `annotations` พร้อมกรอบขอบเขตของแต่ละ ref
  สำหรับ `screenshot` ป้ายที่รองรับโดย Playwright ใช้งานได้กับ `--full-page`,
  `--ref` และ `--element`; สำหรับ `snapshot` ภาพหน้าจอที่มาพร้อมกันยังคง
  เป็นเฉพาะวิวพอร์ต โปรไฟล์ existing-session/chrome-mcp แสดงป้ายซ้อนทับบน
  ภาพหน้าจอของหน้า แต่ไม่คืนค่า `annotations` หรือใช้ตัวช่วยการฉายภาพแบบ
  full-page/ref/element ของ Playwright หากไม่มี Playwright หรือ chrome-mcp
  จะไม่สามารถใช้ภาพหน้าจอที่มีป้ายได้
- `--urls` ต่อท้ายปลายทางลิงก์ที่ค้นพบเข้ากับสแนปช็อต AI

## สแนปช็อตและ refs

OpenClaw รองรับรูปแบบ "สแนปช็อต" สองแบบ:

- **สแนปช็อต AI (refs แบบตัวเลข)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - ผลลัพธ์: สแนปช็อตข้อความที่รวม refs แบบตัวเลข
  - การดำเนินการ: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ระบบจะแก้ ref ผ่าน `aria-ref` ของ Playwright

- **สแนปช็อตบทบาท (refs บทบาทอย่าง `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - ผลลัพธ์: รายการ/ต้นไม้ตามบทบาทพร้อม `[ref=e12]` (และอาจมี `[nth=1]`)
  - การดำเนินการ: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ระบบจะแก้ ref ผ่าน `getByRole(...)` (รวมถึง `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวมภาพหน้าจอพร้อมป้าย `e12` ที่ซ้อนทับ บนโปรไฟล์
    ที่รองรับโดย Playwright คำสั่งนี้จะคืนเมทาดาทากรอบขอบเขตต่อ ref ด้วย
    (`annotations[]`)
  - เพิ่ม `--urls` เมื่อข้อความลิงก์กำกวมและเอเจนต์ต้องการเป้าหมายการนำทาง
    ที่ชัดเจน

- **สแนปช็อต ARIA (refs ARIA อย่าง `ax12`)**: `openclaw browser snapshot --format aria`
  - ผลลัพธ์: ต้นไม้การช่วยการเข้าถึงเป็นโหนดแบบมีโครงสร้าง
  - การดำเนินการ: `openclaw browser click ax12` ใช้งานได้เมื่อพาธสแนปช็อตสามารถผูก
    ref ผ่าน Playwright และรหัส DOM ฝั่งแบ็กเอนด์ของ Chrome
- หากไม่มี Playwright สแนปช็อต ARIA ยังมีประโยชน์สำหรับการตรวจสอบได้
  แต่ refs อาจนำไปใช้ดำเนินการไม่ได้ ถ่ายสแนปช็อตใหม่ด้วย `--format ai`
  หรือ `--interactive` เมื่อคุณต้องการ refs สำหรับการดำเนินการ
- หลักฐาน Docker สำหรับพาธสำรอง raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  เริ่ม Chromium ด้วย CDP, รัน `browser doctor --deep` และตรวจสอบว่าสแนปช็อตบทบาท
  มี URL ของลิงก์ รายการที่คลิกได้ซึ่งเลื่อนสถานะจากเคอร์เซอร์ และเมทาดาทา iframe

พฤติกรรมของ ref:

- Refs **ไม่คงที่ข้ามการนำทาง**; หากมีบางอย่างล้มเหลว ให้รัน `snapshot` อีกครั้งและใช้ ref ใหม่
- `/act` คืนค่า `targetId` ดิบปัจจุบันหลังการแทนที่ที่เกิดจากการดำเนินการ
  เมื่อพิสูจน์แท็บทดแทนได้ ใช้รหัส/ป้ายแท็บที่เสถียรต่อไปสำหรับ
  คำสั่งถัดไป
- หากสแนปช็อตบทบาทถูกถ่ายด้วย `--frame` refs บทบาทจะถูกจำกัดขอบเขตไว้ที่ iframe นั้นจนกว่าจะมีสแนปช็อตบทบาทครั้งถัดไป
- Refs แบบ `axN` ที่ไม่รู้จักหรือล้าสมัยจะล้มเหลวทันทีแทนที่จะปล่อยต่อไปยัง
  selector `aria-ref` ของ Playwright ให้รันสแนปช็อตใหม่บนแท็บเดียวกันเมื่อ
  เกิดกรณีนี้

## ความสามารถเสริมของการรอ

คุณสามารถรอมากกว่าเวลา/ข้อความได้:

- รอ URL (รองรับ globs โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
  - รองรับบนโปรไฟล์ `openclaw` แบบจัดการ และโปรไฟล์ CDP แบบ raw/remote โปรไฟล์ `user` และ `existing-session` ปฏิเสธ `networkidle`; ให้ใช้ `--url`, `--text`, selector หรือการรอด้วย `--fn` ที่นั่น
- รอ predicate ของ JS:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ selector มองเห็นได้:
  - `openclaw browser wait "#main"`

สามารถรวมสิ่งเหล่านี้เข้าด้วยกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์ดีบัก

เมื่อการดำเนินการล้มเหลว (เช่น "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (แนะนำ refs บทบาทในโหมดโต้ตอบ)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำหนดเป้าหมายอะไร
4. หากหน้าทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำซ้ำปัญหา
   - `openclaw browser trace stop` (พิมพ์ `TRACE:<path>`)

## ผลลัพธ์ JSON

`--json` ใช้สำหรับสคริปต์และเครื่องมือแบบมีโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

สแนปช็อตบทบาทใน JSON มี `refs` พร้อมบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือประเมินขนาดและความหนาแน่นของ payload ได้

## ปุ่มปรับสถานะและสภาพแวดล้อม

สิ่งเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์แบบ "ทำให้ไซต์ทำงานเหมือน X":

- คุกกี้: `cookies`, `cookies set`, `cookies clear`
- ที่จัดเก็บ: `storage local|session get|set|clear`
- ออฟไลน์: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (ยังรองรับแบบเดิม `set headers --json '{"X-Debug":"1"}'`)
- การยืนยันตัวตนพื้นฐาน HTTP: `set credentials user pass` (หรือ `--clear`)
- ตำแหน่งภูมิศาสตร์: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- สื่อ: `set media dark|light|no-preference|none`
- เขตเวลา / locale: `set timezone ...`, `set locale ...`
- อุปกรณ์ / วิวพอร์ต:
  - `set device "iPhone 14"` (พรีเซ็ตอุปกรณ์ของ Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ openclaw อาจมีเซสชันที่เข้าสู่ระบบอยู่ ให้ถือว่าเป็นข้อมูลละเอียดอ่อน
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  รัน JavaScript ตามอำเภอใจในบริบทของหน้า Prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่ต้องการใช้
- `openclaw browser evaluate --fn` รับซอร์สของฟังก์ชัน นิพจน์ หรือ
  เนื้อความของคำสั่ง เนื้อความของคำสั่งจะถูกห่อเป็นฟังก์ชัน async ดังนั้นให้ใช้
  `return` สำหรับค่าที่คุณต้องการคืน ใช้ `--timeout-ms <ms>` เมื่อฟังก์ชัน
  ฝั่งหน้าอาจต้องใช้เวลานานกว่าค่า timeout เริ่มต้นของ evaluate
- สำหรับหมายเหตุเกี่ยวกับการเข้าสู่ระบบและการป้องกันบอต (X/Twitter เป็นต้น) ดู [การเข้าสู่ระบบเบราว์เซอร์ + การโพสต์ X/Twitter](/th/tools/browser-login)
- ทำให้โฮสต์ Gateway/node เป็นส่วนตัว (loopback หรือเฉพาะ tailnet)
- ปลายทาง CDP ระยะไกลมีอำนาจสูง ให้ทำ tunnel และป้องกันไว้

ตัวอย่างโหมดเข้มงวด (บล็อกปลายทางส่วนตัว/ภายในเป็นค่าเริ่มต้น):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## ที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser) - ภาพรวม การกำหนดค่า โปรไฟล์ ความปลอดภัย
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login) - การลงชื่อเข้าใช้เว็บไซต์
- [การแก้ปัญหาเบราว์เซอร์บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ปัญหาเบราว์เซอร์บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
