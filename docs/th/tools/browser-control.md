---
read_when:
    - การเขียนสคริปต์หรือการดีบักเบราว์เซอร์ของเอเจนต์ผ่าน API ควบคุมภายในเครื่อง
    - กำลังมองหาเอกสารอ้างอิง CLI ของ `openclaw browser`
    - การเพิ่มระบบอัตโนมัติของเบราว์เซอร์แบบกำหนดเองด้วยสแนปช็อตและการอ้างอิง
summary: API การควบคุมเบราว์เซอร์ของ OpenClaw, เอกสารอ้างอิง CLI และการดำเนินการสคริปต์
title: API สำหรับควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-05-11T20:38:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ไขปัญหา โปรดดู [เบราว์เซอร์](/th/tools/browser)
หน้านี้เป็นเอกสารอ้างอิงสำหรับ API HTTP ควบคุมภายในเครื่อง, CLI `openclaw browser`
และรูปแบบการเขียนสคริปต์ (สแนปชอต, refs, การรอ, โฟลว์ดีบัก)

## API ควบคุม (ไม่บังคับ)

สำหรับการผสานรวมภายในเครื่องเท่านั้น Gateway เปิดเผย API HTTP loopback ขนาดเล็ก:

- สถานะ/เริ่ม/หยุด: `GET /`, `POST /start`, `POST /stop`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- สแนปชอต/ภาพหน้าจอ: `GET /snapshot`, `POST /screenshot`
- การดำเนินการ: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- การดาวน์โหลด: `POST /download`, `POST /wait/download`
- สิทธิ์: `POST /permissions/grant`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ทุก endpoint ยอมรับ `?profile=<name>` `POST /start?headless=true` ขอให้เปิดแบบ
headless ครั้งเดียวสำหรับโปรไฟล์ที่จัดการภายในเครื่อง โดยไม่เปลี่ยนการกำหนดค่า
เบราว์เซอร์ที่บันทึกไว้ถาวร โปรไฟล์แบบ attach-only, remote CDP และ existing-session
จะปฏิเสธการแทนที่นั้น เพราะ OpenClaw ไม่ได้เปิดโปรเซสเบราว์เซอร์เหล่านั้นเอง

หากมีการกำหนดค่า auth ของ gateway แบบ shared-secret เส้นทาง HTTP ของเบราว์เซอร์ก็ต้องใช้ auth เช่นกัน:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth ด้วยรหัสผ่านนั้น

หมายเหตุ:

- API เบราว์เซอร์ loopback แบบสแตนด์อโลนนี้ **ไม่** ใช้ headers ระบุตัวตนแบบ trusted-proxy หรือ
  Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` เส้นทางเบราว์เซอร์
  loopback เหล่านี้จะไม่สืบทอดโหมดที่มีตัวตนเหล่านั้น ให้คงไว้เป็น loopback-only

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้คำตอบข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบความถูกต้องระดับ route และ
ความล้มเหลวของนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` หายไปหรือไม่รู้จัก
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของ action ไม่ผ่านการ normalization หรือการตรวจสอบความถูกต้อง
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): มีการใช้ `selector` กับชนิด action ที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดใช้งานโดย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือแบบ batch ขัดแย้งกับ target ของ request
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action ไม่รองรับสำหรับโปรไฟล์ existing-session

ความล้มเหลวขณะ runtime อื่น ๆ อาจยังคืนค่า `{ "error": "<message>" }` โดยไม่มีฟิลด์
`code`

### ข้อกำหนดของ Playwright

ฟีเจอร์บางอย่าง (navigate/act/สแนปชอต AI/สแนปชอต role, ภาพหน้าจอ element,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright endpoint เหล่านั้นจะคืน
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังใช้งานได้โดยไม่มี Playwright:

- สแนปชอต ARIA
- สแนปชอต accessibility แบบ role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) เมื่อมี CDP WebSocket ต่อแท็บพร้อมใช้งาน นี่เป็น
  fallback สำหรับการตรวจสอบและการค้นหา ref; Playwright ยังคงเป็น engine หลัก
  สำหรับ action
- ภาพหน้าจอหน้าเว็บสำหรับเบราว์เซอร์ `openclaw` ที่จัดการ เมื่อมี CDP
  WebSocket ต่อแท็บพร้อมใช้งาน
- ภาพหน้าจอหน้าเว็บสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- ภาพหน้าจอแบบอิง ref ของ `existing-session` (`--ref`) จาก output ของสแนปชอต

สิ่งที่ยังต้องใช้ Playwright:

- `navigate`
- `act`
- สแนปชอต AI ที่ขึ้นอยู่กับรูปแบบสแนปชอต AI แบบ native ของ Playwright
- ภาพหน้าจอ element ด้วย CSS selector (`--element`)
- การ export PDF ของเบราว์เซอร์เต็มรูปแบบ

ภาพหน้าจอ element จะปฏิเสธ `--full-page` ด้วยเช่นกัน route จะคืนค่า `fullPage is
not supported for element screenshots`

หากคุณเห็น `Playwright is not available in this gateway build` แสดงว่า Gateway
ที่แพ็กเกจไว้ขาด dependency runtime เบราว์เซอร์หลัก ให้ติดตั้งใหม่หรืออัปเดต
OpenClaw แล้วรีสตาร์ท gateway สำหรับ Docker ให้ติดตั้ง binary เบราว์เซอร์
Chromium ตามที่แสดงด้านล่างด้วย

#### การติดตั้ง Playwright สำหรับ Docker

หาก Gateway ของคุณรันใน Docker ให้หลีกเลี่ยง `npx playwright` (ขัดแย้งกับ npm override)
สำหรับ image แบบกำหนดเอง ให้ bake Chromium เข้าไปใน image:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

สำหรับ image ที่มีอยู่แล้ว ให้ติดตั้งผ่าน CLI ที่ bundle มาแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

เพื่อคงการดาวน์โหลดเบราว์เซอร์ไว้ ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (เช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกคงไว้ผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount OpenClaw ตรวจพบ Chromium ที่คงไว้บน Linux
โดยอัตโนมัติ ดู [Docker](/th/install/docker)

## วิธีการทำงาน (ภายใน)

เซิร์ฟเวอร์ควบคุม loopback ขนาดเล็กรับ HTTP requests และเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium ผ่าน CDP การดำเนินการขั้นสูง (click/type/snapshot/PDF) ทำงานผ่าน Playwright บน CDP เมื่อไม่มี Playwright จะใช้ได้เฉพาะการดำเนินการที่ไม่ใช่ Playwright เท่านั้น agent เห็นอินเทอร์เฟซที่เสถียรหนึ่งเดียว ขณะที่เบราว์เซอร์และโปรไฟล์แบบ local/remote ถูกสลับอยู่ด้านล่างได้อย่างอิสระ

## ข้อมูลอ้างอิงด่วนของ CLI

ทุกคำสั่งยอมรับ `--browser-profile <name>` เพื่อระบุโปรไฟล์เฉพาะ และ `--json` สำหรับ output ที่เครื่องอ่านได้

<AccordionGroup>

<Accordion title="พื้นฐาน: สถานะ, แท็บ, เปิด/โฟกัส/ปิด">

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

<Accordion title="การตรวจสอบ: ภาพหน้าจอ, สแนปชอต, คอนโซล, ข้อผิดพลาด, requests">

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

<Accordion title="การดำเนินการ: navigate, click, type, drag, wait, evaluate">

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

- `upload` และ `dialog` เป็นการเรียกแบบ **arming** ให้รันก่อน click/press ที่ trigger ตัวเลือก/dialog
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (ตัวเลข `12`, role ref `e12` หรือ actionable ARIA ref `ax12`) ไม่รองรับ CSS selectors สำหรับ actions โดยเจตนา ใช้ `click-coords` เมื่อตำแหน่ง viewport ที่มองเห็นเป็น target ที่เชื่อถือได้เพียงอย่างเดียว
- เส้นทาง download, trace และ upload ถูกจำกัดอยู่ภายใต้ temp roots ของ OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` ยังสามารถตั้งค่า file inputs โดยตรงผ่าน `--input-ref` หรือ `--element` ได้

tab ids และ labels ที่เสถียรจะยังอยู่รอดจากการแทนที่ raw-target ของ Chromium เมื่อ OpenClaw
พิสูจน์แท็บที่ถูกแทนที่ได้ เช่น URL เดียวกัน หรือแท็บเก่าเพียงแท็บเดียวกลายเป็น
แท็บใหม่เพียงแท็บเดียวหลังการส่งฟอร์ม raw target ids ยังคงเปลี่ยนแปลงได้ง่าย ควรใช้
`suggestedTargetId` จาก `tabs` ในสคริปต์

ภาพรวม flags ของสแนปชอต:

- `--format ai` (ค่าเริ่มต้นเมื่อใช้ Playwright): สแนปชอต AI พร้อม refs แบบตัวเลข (`aria-ref="<n>"`)
- `--format aria`: accessibility tree พร้อม refs `axN` เมื่อมี Playwright พร้อมใช้งาน OpenClaw จะ bind refs ด้วย backend DOM ids เข้ากับหน้า live เพื่อให้ action ต่อเนื่องใช้ได้ มิฉะนั้นให้ถือว่า output ใช้สำหรับการตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): preset สแนปชอต role แบบกะทัดรัด ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อให้เป็นค่าเริ่มต้น (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` บังคับให้ใช้สแนปชอต role พร้อม refs `ref=e12` `--frame "<iframe>"` จำกัดขอบเขตสแนปชอต role ไว้ที่ iframe
- `--labels` เพิ่มภาพหน้าจอเฉพาะ viewport พร้อม labels ref ที่วางทับ (พิมพ์ `MEDIA:<path>`)
- `--urls` ต่อท้ายปลายทางลิงก์ที่ค้นพบลงในสแนปชอต AI

## สแนปชอตและ refs

OpenClaw รองรับสไตล์ "snapshot" สองแบบ:

- **สแนปชอต AI (refs แบบตัวเลข)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - Output: สแนปชอตข้อความที่มี refs แบบตัวเลข
  - Actions: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ref จะถูก resolve ผ่าน `aria-ref` ของ Playwright

- **สแนปชอต role (role refs เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: รายการ/tree แบบอิง role พร้อม `[ref=e12]` (และ `[nth=1]` แบบไม่บังคับ)
  - Actions: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ref จะถูก resolve ผ่าน `getByRole(...)` (บวก `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวมภาพหน้าจอ viewport พร้อม labels `e12` ที่วางทับ
  - เพิ่ม `--urls` เมื่อข้อความลิงก์กำกวมและ agent ต้องการ
    target การนำทางที่เป็นรูปธรรม

- **สแนปช็อต ARIA (ARIA refs เช่น `ax12`)**: `openclaw browser snapshot --format aria`
  - เอาต์พุต: accessibility tree ในรูปแบบโหนดที่มีโครงสร้าง
  - การดำเนินการ: `openclaw browser click ax12` ใช้งานได้เมื่อเส้นทางสแนปช็อตสามารถผูก
    ref ผ่าน Playwright และ DOM ids ของแบ็กเอนด์ Chrome ได้
- หาก Playwright ไม่พร้อมใช้งาน สแนปช็อต ARIA ยังคงมีประโยชน์สำหรับ
  การตรวจสอบ แต่ refs อาจไม่สามารถใช้ดำเนินการได้ สร้างสแนปช็อตใหม่ด้วย `--format ai`
  หรือ `--interactive` เมื่อคุณต้องการ refs สำหรับดำเนินการ
- หลักฐาน Docker สำหรับเส้นทางสำรอง raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  เริ่ม Chromium พร้อม CDP, รัน `browser doctor --deep`, และตรวจสอบว่า
  สแนปช็อตบทบาทมี URL ของลิงก์, องค์ประกอบที่คลิกได้ซึ่งถูกยกระดับจากเคอร์เซอร์, และเมตาดาตา iframe

พฤติกรรมของ ref:

- Refs **ไม่เสถียรข้ามการนำทาง**; หากบางอย่างล้มเหลว ให้รัน `snapshot` อีกครั้งและใช้ ref ใหม่
- `/act` ส่งคืน raw `targetId` ปัจจุบันหลังจากการแทนที่ที่เกิดจากการดำเนินการ
  เมื่อสามารถพิสูจน์แท็บที่แทนที่ได้ ใช้ ids/labels ของแท็บที่เสถียรต่อไปสำหรับ
  คำสั่งถัดไป
- หากสแนปช็อตบทบาทถูกถ่ายด้วย `--frame` role refs จะถูกจำกัดขอบเขตไว้ที่ iframe นั้นจนกว่าจะมีสแนปช็อตบทบาทครั้งถัดไป
- Refs `axN` ที่ไม่รู้จักหรือล้าสมัยจะล้มเหลวทันทีแทนที่จะตกผ่านไปยัง
  selector `aria-ref` ของ Playwright ให้รันสแนปช็อตใหม่บนแท็บเดียวกันเมื่อ
  เกิดเหตุการณ์นี้

## ความสามารถเสริมของการรอ

คุณสามารถรอได้มากกว่าแค่เวลา/ข้อความ:

- รอ URL (รองรับ globs โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
- รอ JS predicate:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ selector มองเห็นได้:
  - `openclaw browser wait "#main"`

สิ่งเหล่านี้สามารถรวมกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์การดีบัก

เมื่อการดำเนินการล้มเหลว (เช่น "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (แนะนำให้ใช้ role refs ในโหมดโต้ตอบ)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายอะไร
4. หากหน้าทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำซ้ำปัญหา
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

สแนปช็อตบทบาทใน JSON มี `refs` พร้อมบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือสามารถพิจารณาขนาดและความหนาแน่นของ payload ได้

## ตัวปรับแต่งสถานะและสภาพแวดล้อม

สิ่งเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์แบบ "ทำให้ไซต์ทำงานเหมือน X":

- คุกกี้: `cookies`, `cookies set`, `cookies clear`
- พื้นที่จัดเก็บ: `storage local|session get|set|clear`
- ออฟไลน์: `set offline on|off`
- เฮดเดอร์: `set headers --headers-json '{"X-Debug":"1"}'` (ยังรองรับแบบเดิม `set headers --json '{"X-Debug":"1"}'`)
- HTTP basic auth: `set credentials user pass` (หรือ `--clear`)
- ตำแหน่งทางภูมิศาสตร์: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- สื่อ: `set media dark|light|no-preference|none`
- เขตเวลา / locale: `set timezone ...`, `set locale ...`
- อุปกรณ์ / viewport:
  - `set device "iPhone 14"` (ค่าล่วงหน้าอุปกรณ์ของ Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ของ openclaw อาจมีเซสชันที่ล็อกอินอยู่; ให้ถือว่าเป็นข้อมูลละเอียดอ่อน
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  เรียกใช้ JavaScript ตามอำเภอใจในบริบทของหน้า Prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่ต้องการใช้
- สำหรับหมายเหตุเกี่ยวกับการเข้าสู่ระบบและการป้องกันบอต (X/Twitter เป็นต้น) ดู [การเข้าสู่ระบบเบราว์เซอร์ + การโพสต์ X/Twitter](/th/tools/browser-login)
- เก็บโฮสต์ Gateway/node ให้เป็นส่วนตัว (loopback หรือเฉพาะ tailnet)
- ปลายทาง CDP ระยะไกลมีอำนาจมาก; ให้ทำ tunnel และป้องกันไว้

ตัวอย่าง strict-mode (บล็อกปลายทางส่วนตัว/ภายในโดยค่าเริ่มต้น):

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

- [เบราว์เซอร์](/th/tools/browser) - ภาพรวม, การกำหนดค่า, โปรไฟล์, ความปลอดภัย
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login) - การลงชื่อเข้าใช้ไซต์
- [การแก้ไขปัญหา Browser บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ไขปัญหา Browser บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
