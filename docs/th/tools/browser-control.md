---
read_when:
    - การเขียนสคริปต์หรือดีบักเบราว์เซอร์ของเอเจนต์ผ่าน API ควบคุมภายในเครื่อง
    - กำลังมองหาคู่มืออ้างอิง CLI ของ `openclaw browser`
    - การเพิ่มการทำงานอัตโนมัติของเบราว์เซอร์แบบกำหนดเองด้วยสแนปช็อตและการอ้างอิง
summary: API สำหรับควบคุมเบราว์เซอร์ของ OpenClaw, เอกสารอ้างอิง CLI และการดำเนินการสำหรับสคริปต์
title: API การควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-04-30T10:18:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 16
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ปัญหา โปรดดู [เบราว์เซอร์](/th/tools/browser)
หน้านี้เป็นเอกสารอ้างอิงสำหรับ API HTTP ควบคุมภายในเครื่อง, CLI `openclaw browser`
และรูปแบบการสคริปต์ (สแนปช็อต, refs, การรอ, โฟลว์ดีบัก)

## API ควบคุม (ไม่บังคับ)

สำหรับการผสานรวมภายในเครื่องเท่านั้น Gateway จะเปิด API HTTP loopback ขนาดเล็ก:

- สถานะ/เริ่ม/หยุด: `GET /`, `POST /start`, `POST /stop`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- สแนปช็อต/ภาพหน้าจอ: `GET /snapshot`, `POST /screenshot`
- การกระทำ: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- ดาวน์โหลด: `POST /download`, `POST /wait/download`
- สิทธิ์: `POST /permissions/grant`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ทุก endpoint รองรับ `?profile=<name>` `POST /start?headless=true` จะขอการเปิดแบบ headless
ครั้งเดียวสำหรับโปรไฟล์ที่จัดการภายในเครื่อง โดยไม่เปลี่ยนการกำหนดค่า
เบราว์เซอร์ที่บันทึกถาวรไว้; โปรไฟล์แบบแนบอย่างเดียว, CDP ระยะไกล และเซสชันที่มีอยู่
จะปฏิเสธการ override นี้ เพราะ OpenClaw ไม่ได้เปิดโปรเซสเบราว์เซอร์เหล่านั้น

หากมีการกำหนดค่า auth Gateway แบบ shared-secret เส้นทาง HTTP ของเบราว์เซอร์ต้องใช้ auth ด้วย:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth ด้วยรหัสผ่านนั้น

หมายเหตุ:

- API เบราว์เซอร์ loopback แบบสแตนด์อโลนนี้ **ไม่** ใช้เฮดเดอร์ตัวตนจาก trusted-proxy หรือ
  Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` เส้นทางเบราว์เซอร์ loopback
  เหล่านี้จะไม่สืบทอดโหมดที่มีตัวตนเหล่านั้น; ให้คงเป็น loopback-only

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้คำตอบข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบระดับ route และ
ความล้มเหลวด้านนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): ไม่มี `kind` หรือไม่รู้จักค่า
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของ action ไม่ผ่านการ normalization หรือ validation
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): ใช้ `selector` กับชนิด action ที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดใช้งานโดย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือแบบ batched ขัดแย้งกับเป้าหมายของคำขอ
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action ไม่รองรับโปรไฟล์ existing-session

ความล้มเหลวขณะรันอื่น ๆ อาจยังส่งคืน `{ "error": "<message>" }` โดยไม่มีฟิลด์
`code`

### ข้อกำหนด Playwright

บางฟีเจอร์ (navigate/act/สแนปช็อต AI/สแนปช็อต role, ภาพหน้าจอ element,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright endpoint เหล่านั้นจะส่งคืน
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังใช้ได้โดยไม่มี Playwright:

- สแนปช็อต ARIA
- สแนปช็อต accessibility แบบ role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) เมื่อมี CDP WebSocket ต่อแท็บพร้อมใช้งาน นี่คือ
  fallback สำหรับการตรวจสอบและการค้นหา ref; Playwright ยังคงเป็นเอนจินหลัก
  สำหรับ action
- ภาพหน้าจอหน้าเว็บสำหรับเบราว์เซอร์ `openclaw` ที่จัดการ เมื่อมี CDP
  WebSocket ต่อแท็บพร้อมใช้งาน
- ภาพหน้าจอหน้าเว็บสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- ภาพหน้าจอแบบอิง ref ของ `existing-session` (`--ref`) จาก output ของสแนปช็อต

สิ่งที่ยังต้องใช้ Playwright:

- `navigate`
- `act`
- สแนปช็อต AI ที่พึ่งพารูปแบบสแนปช็อต AI native ของ Playwright
- ภาพหน้าจอ element ด้วย CSS-selector (`--element`)
- การ export PDF ของเบราว์เซอร์แบบเต็ม

ภาพหน้าจอ element จะปฏิเสธ `--full-page` ด้วย; route จะส่งคืน `fullPage is
not supported for element screenshots`

หากคุณเห็น `Playwright is not available in this gateway build` ให้ซ่อมแซม
dependencies ของ runtime Plugin เบราว์เซอร์ที่ bundled เพื่อให้ติดตั้ง
`playwright-core` แล้วรีสตาร์ท Gateway สำหรับการติดตั้งแบบแพ็กเกจ ให้รัน
`openclaw doctor --fix` สำหรับ Docker ให้ติดตั้งไบนารีเบราว์เซอร์ Chromium
ตามที่แสดงด้านล่างด้วย

#### การติดตั้ง Docker Playwright

หาก Gateway ของคุณทำงานใน Docker ให้หลีกเลี่ยง `npx playwright` (มีความขัดแย้งกับ npm override)
ใช้ CLI ที่ bundled แทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

หากต้องการเก็บการดาวน์โหลดเบราว์เซอร์ไว้ถาวร ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (ตัวอย่างเช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกเก็บถาวรผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount ดู [Docker](/th/install/docker)

## วิธีทำงาน (ภายใน)

เซิร์ฟเวอร์ควบคุม loopback ขนาดเล็กรับคำขอ HTTP และเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium ผ่าน CDP การกระทำขั้นสูง (click/type/snapshot/PDF) ทำงานผ่าน Playwright ที่อยู่บน CDP; เมื่อไม่มี Playwright จะมีเฉพาะการดำเนินการที่ไม่ใช้ Playwright เท่านั้น agent เห็นอินเทอร์เฟซที่เสถียรหนึ่งชุด ขณะที่เบราว์เซอร์และโปรไฟล์ภายในเครื่อง/ระยะไกลถูกสลับอยู่ด้านล่างได้อย่างอิสระ

## อ้างอิง CLI แบบย่อ

ทุกคำสั่งรองรับ `--browser-profile <name>` เพื่อระบุโปรไฟล์เฉพาะ และ `--json` สำหรับ output ที่เครื่องอ่านได้

<AccordionGroup>

<Accordion title="พื้นฐาน: สถานะ แท็บ เปิด/โฟกัส/ปิด">

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

<Accordion title="การตรวจสอบ: ภาพหน้าจอ, สแนปช็อต, console, ข้อผิดพลาด, คำขอ">

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

<Accordion title="การกระทำ: นำทาง, คลิก, พิมพ์, ลาก, รอ, evaluate">

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
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="สถานะ: cookies, storage, offline, headers, geo, device">

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

- `upload` และ `dialog` เป็นการเรียกแบบ **arming**; ให้รันก่อน click/press ที่เรียก chooser/dialog
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (`12` แบบตัวเลข, role ref `e12`, หรือ actionable ARIA ref `ax12`) ไม่รองรับ CSS selectors สำหรับ actions โดยเจตนา ใช้ `click-coords` เมื่อเป้าหมายที่เชื่อถือได้มีเพียงตำแหน่งที่มองเห็นใน viewport
- เส้นทาง download, trace และ upload ถูกจำกัดไว้ที่ root ชั่วคราวของ OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` ยังสามารถตั้งค่า file inputs โดยตรงผ่าน `--input-ref` หรือ `--element`

id แท็บและ label ที่เสถียรจะคงอยู่หลัง Chromium เปลี่ยน raw-target เมื่อ OpenClaw
พิสูจน์แท็บที่แทนที่ได้ เช่น URL เดียวกัน หรือแท็บเก่าเดียวกลายเป็น
แท็บใหม่เดียวหลังการส่งแบบฟอร์ม raw target ids ยังเปลี่ยนแปลงได้; ให้ใช้
`suggestedTargetId` จาก `tabs` ในสคริปต์

ภาพรวม flags ของสแนปช็อต:

- `--format ai` (ค่าเริ่มต้นเมื่อมี Playwright): สแนปช็อต AI พร้อม refs แบบตัวเลข (`aria-ref="<n>"`)
- `--format aria`: accessibility tree พร้อม refs `axN` เมื่อมี Playwright, OpenClaw จะ bind refs ด้วย backend DOM ids เข้ากับหน้าจริง เพื่อให้ actions ถัดไปใช้ได้; มิฉะนั้นให้ถือว่า output ใช้สำหรับการตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): preset สแนปช็อต role แบบ compact ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อให้เป็นค่าเริ่มต้น (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` บังคับใช้สแนปช็อต role พร้อม refs `ref=e12` `--frame "<iframe>"` จะจำกัดขอบเขตสแนปช็อต role ไปยัง iframe
- `--labels` เพิ่มภาพหน้าจอเฉพาะ viewport พร้อม label ref ซ้อนทับ (พิมพ์ `MEDIA:<path>`)
- `--urls` ผนวกปลายทาง link ที่ค้นพบเข้ากับสแนปช็อต AI

## สแนปช็อตและ refs

OpenClaw รองรับรูปแบบ “สแนปช็อต” สองแบบ:

- **สแนปช็อต AI (refs แบบตัวเลข)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - Output: สแนปช็อตแบบข้อความที่มี refs แบบตัวเลข
  - Actions: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ref จะถูก resolve ผ่าน `aria-ref` ของ Playwright

- **สแนปช็อต role (role refs เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: รายการ/ต้นไม้แบบ role-based พร้อม `[ref=e12]` (และ `[nth=1]` ที่ไม่บังคับ)
  - Actions: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ref จะถูก resolve ผ่าน `getByRole(...)` (พร้อม `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวมภาพหน้าจอ viewport พร้อม label `e12` ซ้อนทับ
  - เพิ่ม `--urls` เมื่อข้อความ link กำกวมและ agent ต้องการ
    เป้าหมายการนำทางที่เป็นรูปธรรม

- **สแนปช็อต ARIA (ARIA refs เช่น `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: accessibility tree ในรูปแบบ nodes ที่มีโครงสร้าง
  - Actions: `openclaw browser click ax12` ใช้ได้เมื่อเส้นทางสแนปช็อตสามารถ bind
    ref ผ่าน Playwright และ Chrome backend DOM ids
- หากไม่มี Playwright สแนปช็อต ARIA ยังคงมีประโยชน์สำหรับ
  การตรวจสอบ แต่ refs อาจใช้กับ action ไม่ได้ ให้สร้างสแนปช็อตใหม่ด้วย `--format ai`
  หรือ `--interactive` เมื่อต้องการ refs สำหรับ action
- หลักฐาน Docker สำหรับเส้นทาง fallback แบบ raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  เริ่ม Chromium ด้วย CDP, รัน `browser doctor --deep` และตรวจสอบว่า
  สแนปช็อต role มี link URLs, clickables ที่เลื่อนสถานะจาก cursor และ metadata ของ iframe

พฤติกรรมของ ref:

- การอ้างอิง **ไม่คงที่เมื่อมีการนำทางระหว่างหน้า**; หากบางอย่างล้มเหลว ให้รัน `snapshot` ใหม่แล้วใช้การอ้างอิงใหม่
- `/act` จะคืนค่า `targetId` ดิบปัจจุบันหลังการแทนที่ที่เกิดจากการกระทำ
  เมื่อสามารถพิสูจน์แท็บที่ถูกแทนที่ได้ ให้ใช้ id/ป้ายกำกับแท็บที่คงที่ต่อไปสำหรับ
  คำสั่งถัดไป
- หาก snapshot ของ role ถูกสร้างด้วย `--frame` การอ้างอิง role จะถูกจำกัดขอบเขตไว้ที่ iframe นั้นจนกว่าจะมี snapshot ของ role ครั้งถัดไป
- การอ้างอิง `axN` ที่ไม่รู้จักหรือเก่าจะล้มเหลวทันที แทนที่จะตกไปใช้
  selector `aria-ref` ของ Playwright ให้รัน snapshot ใหม่บนแท็บเดียวกันเมื่อ
  เกิดเหตุการณ์นั้น

## ความสามารถเสริมของการรอ

คุณสามารถรอสิ่งอื่นนอกเหนือจากเวลา/ข้อความได้:

- รอ URL (รองรับ glob โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
- รอ predicate ของ JS:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ selector ปรากฏให้เห็น:
  - `openclaw browser wait "#main"`

สามารถรวมสิ่งเหล่านี้เข้าด้วยกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์การดีบัก

เมื่อการกระทำล้มเหลว (เช่น “มองไม่เห็น”, “ละเมิด strict mode”, “ถูกบัง”):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (แนะนำให้ใช้การอ้างอิง role ในโหมด interactive)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายสิ่งใด
4. หากหน้าทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำให้ปัญหาเกิดซ้ำ
   - `openclaw browser trace stop` (พิมพ์ `TRACE:<path>`)

## เอาต์พุต JSON

`--json` ใช้สำหรับสคริปต์และเครื่องมือแบบมีโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

snapshot ของ role ใน JSON มี `refs` พร้อมบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือสามารถใช้เหตุผลเกี่ยวกับขนาดและความหนาแน่นของ payload ได้

## สถานะและปุ่มปรับสภาพแวดล้อม

สิ่งเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์แบบ “ทำให้ไซต์ทำงานเหมือน X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- ออฟไลน์: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` ยังคงรองรับอยู่)
- การยืนยันตัวตนแบบ HTTP basic: `set credentials user pass` (หรือ `--clear`)
- ตำแหน่งทางภูมิศาสตร์: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- Media: `set media dark|light|no-preference|none`
- เขตเวลา / locale: `set timezone ...`, `set locale ...`
- อุปกรณ์ / viewport:
  - `set device "iPhone 14"` (preset อุปกรณ์ของ Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ของ openclaw อาจมี session ที่เข้าสู่ระบบอยู่ ให้ถือว่าเป็นข้อมูลอ่อนไหว
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  จะดำเนินการ JavaScript ใดก็ได้ในบริบทของหน้าเว็บ Prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่ต้องใช้
- สำหรับหมายเหตุเกี่ยวกับการเข้าสู่ระบบและการป้องกันบอต (X/Twitter ฯลฯ) ดู [การเข้าสู่ระบบเบราว์เซอร์ + การโพสต์ X/Twitter](/th/tools/browser-login)
- ทำให้โฮสต์ Gateway/node เป็นส่วนตัวเสมอ (loopback หรือเฉพาะ tailnet)
- endpoint CDP ระยะไกลมีพลังมาก ให้ tunnel และปกป้อง endpoint เหล่านั้น

ตัวอย่าง strict-mode (บล็อกปลายทางส่วนตัว/ภายในเป็นค่าเริ่มต้น):

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

- [เบราว์เซอร์](/th/tools/browser) — ภาพรวม, การกำหนดค่า, โปรไฟล์, ความปลอดภัย
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login) — การลงชื่อเข้าใช้ไซต์
- [การแก้ไขปัญหาเบราว์เซอร์บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ไขปัญหาเบราว์เซอร์บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
