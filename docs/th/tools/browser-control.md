---
read_when:
    - การเขียนสคริปต์หรือการดีบักเบราว์เซอร์ของเอเจนต์ผ่าน API ควบคุมภายในเครื่อง
    - กำลังมองหาเอกสารอ้างอิง CLI ของ `openclaw browser`
    - การเพิ่มการทำงานอัตโนมัติบนเบราว์เซอร์แบบกำหนดเองด้วยสแนปช็อตและการอ้างอิง
summary: API การควบคุมเบราว์เซอร์ของ OpenClaw, เอกสารอ้างอิง CLI และแอ็กชันสำหรับการเขียนสคริปต์
title: API การควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-05-10T19:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: eec952e6befed8911b83fc554b1c08cc5f20d3deff9c6cc791cb8a009bb9e7f3
    source_path: tools/browser-control.md
    workflow: 16
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ปัญหา ดูที่ [เบราว์เซอร์](/th/tools/browser)
หน้านี้เป็นเอกสารอ้างอิงสำหรับ API HTTP ควบคุมในเครื่อง, CLI `openclaw browser`
และรูปแบบการเขียนสคริปต์ (สแนปช็อต, refs, waits, โฟลว์ดีบัก)

## API ควบคุม (ไม่บังคับ)

สำหรับการผสานรวมในเครื่องเท่านั้น Gateway จะเปิดเผย API HTTP แบบ local loopback ขนาดเล็ก:

- สถานะ/เริ่ม/หยุด: `GET /`, `POST /start`, `POST /stop`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- สแนปช็อต/สกรีนช็อต: `GET /snapshot`, `POST /screenshot`
- การกระทำ: `POST /navigate`, `POST /act`
- ฮุก: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- ดาวน์โหลด: `POST /download`, `POST /wait/download`
- สิทธิ์: `POST /permissions/grant`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ทุก endpoint รองรับ `?profile=<name>` `POST /start?headless=true` จะขอการเปิดใช้งานแบบ headless
ครั้งเดียวสำหรับโปรไฟล์ที่จัดการในเครื่อง โดยไม่เปลี่ยนค่ากำหนด
เบราว์เซอร์ที่บันทึกถาวร โปรไฟล์แบบ attach-only, CDP ระยะไกล และ existing-session
จะปฏิเสธการแทนที่ค่านี้ เพราะ OpenClaw ไม่ได้เปิดกระบวนการเบราว์เซอร์เหล่านั้น

หากกำหนดค่าการยืนยันตัวตนของ Gateway ด้วย shared-secret ไว้ เส้นทาง HTTP ของเบราว์เซอร์ก็ต้องใช้การยืนยันตัวตนด้วย:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth ด้วยรหัสผ่านนั้น

หมายเหตุ:

- API เบราว์เซอร์แบบ local loopback แยกเดี่ยวนี้ **ไม่** ใช้ header ระบุตัวตนของ trusted-proxy หรือ
  Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` เส้นทางเบราว์เซอร์แบบ local loopback
  เหล่านี้จะไม่สืบทอดโหมดที่มีตัวตนเหล่านั้น ให้คงไว้เป็นแบบ local loopback เท่านั้น

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบความถูกต้องระดับ route และ
ความล้มเหลวของนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): ไม่มี `kind` หรือไม่รู้จัก
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของ action ไม่ผ่านการ normalization หรือ validation
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): มีการใช้ `selector` กับชนิด action ที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดใช้งานด้วย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือใน batch ขัดแย้งกับเป้าหมายของ request
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action ไม่รองรับสำหรับโปรไฟล์ existing-session

ความล้มเหลวขณะ runtime อื่นๆ อาจยังคงส่งคืน `{ "error": "<message>" }` โดยไม่มี
ฟิลด์ `code`

### ข้อกำหนด Playwright

บางฟีเจอร์ (navigate/act/สแนปช็อต AI/สแนปช็อต role, สกรีนช็อต element,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright endpoint เหล่านั้นจะส่งคืน
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังใช้งานได้โดยไม่มี Playwright:

- สแนปช็อต ARIA
- สแนปช็อต accessibility แบบ role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) เมื่อมี CDP WebSocket รายแท็บ ใช้เป็น
  fallback สำหรับการตรวจสอบและการค้นหา ref ส่วน Playwright ยังคงเป็น
  engine หลักสำหรับการกระทำ
- สกรีนช็อตหน้าสำหรับเบราว์เซอร์ `openclaw` ที่จัดการอยู่ เมื่อมี CDP
  WebSocket รายแท็บ
- สกรีนช็อตหน้าสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- สกรีนช็อตแบบอิง ref ของ `existing-session` (`--ref`) จากเอาต์พุตสแนปช็อต

สิ่งที่ยังต้องใช้ Playwright:

- `navigate`
- `act`
- สแนปช็อต AI ที่ขึ้นกับรูปแบบสแนปช็อต AI ดั้งเดิมของ Playwright
- สกรีนช็อต element ด้วย CSS selector (`--element`)
- การส่งออก PDF แบบเต็มเบราว์เซอร์

สกรีนช็อต element จะปฏิเสธ `--full-page` ด้วย route จะส่งคืน `fullPage is
not supported for element screenshots`

หากคุณเห็น `Playwright is not available in this gateway build` แสดงว่า Gateway
ที่แพ็กมาขาด dependency runtime เบราว์เซอร์หลัก ให้ติดตั้ง OpenClaw ใหม่หรืออัปเดต
แล้วรีสตาร์ต gateway สำหรับ Docker ให้ติดตั้ง binary ของเบราว์เซอร์ Chromium
ตามที่แสดงด้านล่างด้วย

#### การติดตั้ง Docker Playwright

หาก Gateway ของคุณรันใน Docker ให้หลีกเลี่ยง `npx playwright` (มีข้อขัดแย้งกับ npm override)
ใช้ CLI ที่รวมมาแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

เพื่อคงการดาวน์โหลดเบราว์เซอร์ไว้ ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (ตัวอย่างเช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกเก็บแบบถาวรผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount OpenClaw จะตรวจหา
Chromium ที่เก็บถาวรไว้บน Linux โดยอัตโนมัติ ดู [Docker](/th/install/docker)

## วิธีทำงาน (ภายใน)

เซิร์ฟเวอร์ควบคุมแบบ local loopback ขนาดเล็กรับ request HTTP และเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium ผ่าน CDP การกระทำขั้นสูง (click/type/snapshot/PDF) จะผ่าน Playwright บน CDP เมื่อไม่มี Playwright จะมีเฉพาะการทำงานที่ไม่ใช้ Playwright เท่านั้น agent จะเห็นอินเทอร์เฟซที่เสถียรหนึ่งชุด ขณะที่เบราว์เซอร์และโปรไฟล์ทั้งในเครื่อง/ระยะไกลสลับกันได้อย่างอิสระอยู่ด้านล่าง

## อ้างอิง CLI แบบย่อ

ทุกคำสั่งรองรับ `--browser-profile <name>` เพื่อระบุโปรไฟล์เป้าหมาย และ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้

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

<Accordion title="การตรวจสอบ: สกรีนช็อต สแนปช็อต คอนโซล ข้อผิดพลาด request">

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

<Accordion title="การกระทำ: navigate, click, type, drag, wait, evaluate">

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

- `upload` และ `dialog` เป็นคำสั่ง **arming** ให้รันก่อนการ click/press ที่ทริกเกอร์ chooser/dialog
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (ตัวเลข `12`, role ref `e12` หรือ actionable ARIA ref `ax12`) ไม่รองรับ CSS selector สำหรับ action โดยตั้งใจ ใช้ `click-coords` เมื่อมุมมอง viewport ที่เห็นเป็นเป้าหมายเดียวที่เชื่อถือได้
- เส้นทาง download, trace และ upload ถูกจำกัดให้อยู่ใน root ชั่วคราวของ OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` ยังตั้งค่า file input ได้โดยตรงผ่าน `--input-ref` หรือ `--element`

id และ label ของแท็บที่เสถียรจะอยู่รอดจากการแทนที่ raw-target ของ Chromium เมื่อ OpenClaw
พิสูจน์แท็บที่แทนที่ได้ เช่น URL เดิม หรือแท็บเก่าเพียงแท็บเดียวกลายเป็น
แท็บใหม่เพียงแท็บเดียวหลังส่งฟอร์ม raw target ids ยังคงเปลี่ยนได้ง่าย ควรใช้
`suggestedTargetId` จาก `tabs` ในสคริปต์

ภาพรวม flag ของสแนปช็อต:

- `--format ai` (ค่าเริ่มต้นเมื่อมี Playwright): สแนปช็อต AI พร้อม ref แบบตัวเลข (`aria-ref="<n>"`)
- `--format aria`: tree ของ accessibility พร้อม ref `axN` เมื่อมี Playwright OpenClaw จะผูก refs ด้วย backend DOM ids กับหน้าจริง เพื่อให้ action ต่อเนื่องใช้ได้ ไม่เช่นนั้นให้ถือว่าเอาต์พุตมีไว้สำหรับการตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): preset สแนปช็อต role แบบกะทัดรัด ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อทำให้เป็นค่าเริ่มต้น (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` บังคับใช้สแนปช็อต role พร้อม ref `ref=e12` `--frame "<iframe>"` จำกัด scope ของสแนปช็อต role ไปที่ iframe
- `--labels` เพิ่มสกรีนช็อตเฉพาะ viewport พร้อม label ref ที่ซ้อนทับอยู่ (พิมพ์ `MEDIA:<path>`)
- `--urls` ต่อท้ายปลายทางลิงก์ที่ค้นพบไปยังสแนปช็อต AI

## สแนปช็อตและ refs

OpenClaw รองรับรูปแบบ "snapshot" สองแบบ:

- **สแนปช็อต AI (refs แบบตัวเลข)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - เอาต์พุต: สแนปช็อตข้อความที่มี refs แบบตัวเลข
  - การกระทำ: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ref จะถูก resolve ผ่าน `aria-ref` ของ Playwright

- **สแนปช็อต role (role refs เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - เอาต์พุต: รายการ/tree แบบอิง role พร้อม `[ref=e12]` (และ `[nth=1]` ที่ไม่บังคับ)
  - การกระทำ: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ref จะถูก resolve ผ่าน `getByRole(...)` (รวมถึง `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวมสกรีนช็อต viewport พร้อม label `e12` ที่ซ้อนทับอยู่
  - เพิ่ม `--urls` เมื่อข้อความลิงก์กำกวมและ agent ต้องการ
    เป้าหมาย navigation ที่ชัดเจน

- **สแนปช็อต ARIA (ARIA refs เช่น `ax12`)**: `openclaw browser snapshot --format aria`
  - เอาต์พุต: accessibility tree เป็น node แบบมีโครงสร้าง
  - การกระทำ: `openclaw browser click ax12` ใช้ได้เมื่อ path ของสแนปช็อตสามารถผูก
    ref ผ่าน Playwright และ Chrome backend DOM ids ได้
- หาก Playwright ใช้งานไม่ได้ สแนปช็อต ARIA ยังมีประโยชน์สำหรับ
  การตรวจสอบ แต่ refs อาจนำไปใช้ action ไม่ได้ ให้สแนปช็อตใหม่ด้วย `--format ai`
  หรือ `--interactive` เมื่อต้องการ action refs
- หลักฐาน Docker สำหรับ path fallback แบบ raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  เริ่ม Chromium ด้วย CDP, รัน `browser doctor --deep` และตรวจสอบว่าสแนปช็อต role
  มี URL ของลิงก์, clickable ที่ถูกยกระดับจาก cursor และ metadata ของ iframe

พฤติกรรมของ ref:

- Refs **ไม่เสถียรข้ามการนำทาง**; หากมีบางอย่างล้มเหลว ให้รัน `snapshot` อีกครั้งและใช้ ref ใหม่
- `/act` จะคืนค่า `targetId` ดิบปัจจุบันหลังการแทนที่ที่ถูกทริกเกอร์โดยแอ็กชัน
  เมื่อสามารถพิสูจน์แท็บที่ถูกแทนที่ได้ ให้ใช้ id/ป้ายกำกับแท็บที่เสถียรต่อไปสำหรับ
  คำสั่งติดตามผล
- หาก role snapshot ถูกถ่ายด้วย `--frame` role refs จะถูกจำกัดขอบเขตอยู่ใน iframe นั้นจนกว่าจะมี role snapshot ถัดไป
- ref `axN` ที่ไม่รู้จักหรือล้าสมัยจะล้มเหลวทันที แทนที่จะตกผ่านไปยัง
  selector `aria-ref` ของ Playwright ให้รัน snapshot ใหม่บนแท็บเดียวกันเมื่อ
  เหตุการณ์นี้เกิดขึ้น

## ตัวเสริมพลังการรอ

คุณสามารถรอได้มากกว่าแค่เวลา/ข้อความ:

- รอ URL (รองรับ globs โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอ load state:
  - `openclaw browser wait --load networkidle`
- รอ JS predicate:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ selector มองเห็นได้:
  - `openclaw browser wait "#main"`

สามารถรวมสิ่งเหล่านี้ได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์การดีบัก

เมื่อแอ็กชันล้มเหลว (เช่น "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (แนะนำให้ใช้ role refs ในโหมดโต้ตอบ)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังเล็งไปที่อะไร
4. หากหน้าทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำซ้ำปัญหา
   - `openclaw browser trace stop` (พิมพ์ `TRACE:<path>`)

## เอาต์พุต JSON

`--json` มีไว้สำหรับสคริปต์และเครื่องมือเชิงโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots ใน JSON มี `refs` พร้อมบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือสามารถให้เหตุผลเกี่ยวกับขนาดและความหนาแน่นของ payload ได้

## สถานะและปุ่มปรับแต่งสภาพแวดล้อม

สิ่งเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์แบบ "ทำให้ไซต์ทำงานเหมือน X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (ยังรองรับรูปแบบเดิม `set headers --json '{"X-Debug":"1"}'`)
- HTTP basic auth: `set credentials user pass` (หรือ `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (ค่าพรีเซ็ตอุปกรณ์ของ Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ของ openclaw อาจมีเซสชันที่ล็อกอินอยู่ ให้ถือว่าเป็นข้อมูลอ่อนไหว
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  จะเรียกใช้ JavaScript ใดๆ ก็ได้ในบริบทของหน้า Prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่ต้องการใช้
- สำหรับการล็อกอินและหมายเหตุเกี่ยวกับ anti-bot (X/Twitter ฯลฯ) ดู [การล็อกอินเบราว์เซอร์ + การโพสต์ X/Twitter](/th/tools/browser-login)
- เก็บโฮสต์ Gateway/node ให้เป็นส่วนตัว (loopback หรือ tailnet-only)
- endpoint CDP ระยะไกลมีอำนาจสูง ให้ tunnel และปกป้อง endpoint เหล่านั้น

ตัวอย่าง strict-mode (บล็อกปลายทาง private/internal เป็นค่าเริ่มต้น):

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
- [การล็อกอินเบราว์เซอร์](/th/tools/browser-login) - การลงชื่อเข้าใช้ไซต์
- [การแก้ปัญหาเบราว์เซอร์บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ปัญหาเบราว์เซอร์บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
