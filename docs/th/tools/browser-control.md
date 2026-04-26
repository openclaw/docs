---
read_when:
    - การเขียนสคริปต์หรือดีบักเบราว์เซอร์ของ agent ผ่าน API ควบคุมในเครื่อง
    - กำลังมองหาเอกสารอ้างอิง CLI `openclaw browser`
    - การเพิ่มระบบอัตโนมัติเบราว์เซอร์แบบกำหนดเองด้วย snapshots และ refs
summary: API การควบคุมเบราว์เซอร์ของ OpenClaw, เอกสารอ้างอิง CLI และแอ็กชันสำหรับสคริปต์
title: API การควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-04-26T11:42:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ไขปัญหา โปรดดู [Browser](/th/tools/browser)
หน้านี้เป็นเอกสารอ้างอิงสำหรับ local control HTTP API, CLI `openclaw browser`
และรูปแบบการเขียนสคริปต์ (snapshots, refs, waits, debug flows)

## Control API (ไม่บังคับ)

สำหรับการเชื่อมต่อภายในเครื่องเท่านั้น Gateway จะเปิดเผย loopback HTTP API ขนาดเล็ก:

- สถานะ/เริ่มต้น/หยุด: `GET /`, `POST /start`, `POST /stop`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- แอ็กชัน: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- การดาวน์โหลด: `POST /download`, `POST /wait/download`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ทุก endpoint รองรับ `?profile=<name>` `POST /start?headless=true` จะร้องขอ
การเปิดแบบ headless แบบ one-shot สำหรับ local managed profiles โดยไม่เปลี่ยน
config เบราว์เซอร์ที่บันทึกไว้; โปรไฟล์แบบ attach-only, remote CDP และ existing-session จะปฏิเสธ
การแทนที่นี้ เพราะ OpenClaw ไม่ได้เป็นผู้เปิดโปรเซสเบราว์เซอร์เหล่านั้น

หากมีการกำหนดค่า shared-secret gateway auth ไว้ เส้นทาง HTTP ของเบราว์เซอร์ก็ต้องยืนยันตัวตนด้วย:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth ที่ใช้รหัสผ่านนั้น

หมายเหตุ:

- loopback browser API แบบสแตนด์อโลนนี้ **ไม่** ใช้ trusted-proxy หรือ
  เฮดเดอร์ระบุตัวตนของ Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` เส้นทางเบราว์เซอร์ loopback เหล่านี้
  จะไม่สืบทอดโหมดที่มีการระบุตัวตนเหล่านั้น; ให้คงไว้แบบ loopback-only

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบระดับ route และ
ความล้มเหลวของนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ที่มีในปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): ไม่มี `kind` หรือระบบไม่รู้จัก
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของ action ไม่ผ่านการทำให้เป็นมาตรฐานหรือการตรวจสอบ
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): มีการใช้ `selector` กับ action kind ที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดใช้งานโดย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือแบบ batch ขัดแย้งกับ target ของคำขอ
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action นี้ไม่รองรับสำหรับโปรไฟล์ existing-session

ความล้มเหลวขณะรันไทม์อื่น ๆ อาจยังคงคืนค่า `{ "error": "<message>" }` โดยไม่มี
ฟิลด์ `code`

### ข้อกำหนดของ Playwright

บางฟีเจอร์ (navigate/act/AI snapshot/role snapshot, screenshots ระดับ element,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright endpoint เหล่านั้นจะคืน
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังใช้งานได้โดยไม่ต้องมี Playwright:

- ARIA snapshots
- snapshots การช่วยการเข้าถึงแบบ role-style (`--interactive`, `--compact`,
  `--depth`, `--efficient`) เมื่อมี WebSocket CDP ต่อแท็บพร้อมใช้งาน ซึ่งเป็น
  fallback สำหรับการตรวจสอบและการค้นหา ref; Playwright ยังคงเป็นเอนจินแอ็กชันหลัก
- screenshots ของหน้าสำหรับเบราว์เซอร์ `openclaw` ที่ถูกจัดการ เมื่อมี CDP WebSocket
  ต่อแท็บพร้อมใช้งาน
- screenshots ของหน้าสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- screenshots แบบอ้างอิง ref ของ `existing-session` (`--ref`) จากผลลัพธ์ snapshot

สิ่งที่ยังคงต้องใช้ Playwright:

- `navigate`
- `act`
- AI snapshots ที่พึ่งพารูปแบบ AI snapshot แบบเนทีฟของ Playwright
- screenshots ของ element ผ่าน CSS selector (`--element`)
- การ export PDF เต็มรูปแบบของเบราว์เซอร์

screenshots ของ element จะปฏิเสธ `--full-page` ด้วยเช่นกัน; route จะคืนค่า `fullPage is
not supported for element screenshots`

หากคุณเห็น `Playwright is not available in this gateway build` ให้ซ่อมแซม
runtime dependencies ของ bundled browser plugin เพื่อให้มีการติดตั้ง `playwright-core`
จากนั้นรีสตาร์ต gateway สำหรับการติดตั้งแบบแพ็กเกจ ให้รัน `openclaw doctor --fix`
สำหรับ Docker ให้ติดตั้ง Chromium browser binaries เพิ่มเติมตามตัวอย่างด้านล่าง

#### การติดตั้ง Docker Playwright

หาก Gateway ของคุณทำงานใน Docker ให้หลีกเลี่ยง `npx playwright` (มีความขัดแย้งกับ npm override)
ให้ใช้ CLI ที่มากับระบบแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

หากต้องการคงการดาวน์โหลดของเบราว์เซอร์ไว้ ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (เช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` มีการคงอยู่ผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount โปรดดู [Docker](/th/install/docker)

## วิธีการทำงาน (ภายใน)

เซิร์ฟเวอร์ควบคุม loopback ขนาดเล็กรับคำขอ HTTP และเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium ผ่าน CDP แอ็กชันขั้นสูง (click/type/snapshot/PDF) จะผ่าน Playwright บน CDP; เมื่อไม่มี Playwright จะมีเพียงการดำเนินการที่ไม่ใช้ Playwright เท่านั้น Agent จะเห็นอินเทอร์เฟซที่เสถียรหนึ่งเดียว ขณะที่เบราว์เซอร์และโปรไฟล์แบบ local/remote สามารถสลับอยู่ด้านล่างได้อย่างอิสระ

## เอกสารอ้างอิง CLI แบบย่อ

ทุกคำสั่งรองรับ `--browser-profile <name>` เพื่อกำหนดเป้าหมายไปยังโปรไฟล์เฉพาะ และ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้

<AccordionGroup>

<Accordion title="พื้นฐาน: สถานะ, แท็บ, เปิด/โฟกัส/ปิด">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # การเปิดแบบ headless ที่จัดการในเครื่องแบบ one-shot
openclaw browser stop            # ล้าง emulation บนโปรไฟล์ attach-only/remote CDP ด้วย
openclaw browser tabs
openclaw browser tab             # ทางลัดสำหรับแท็บปัจจุบัน
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="การตรวจสอบ: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # หรือ --ref e12 สำหรับ role refs
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

<Accordion title="แอ็กชัน: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # หรือ e12 สำหรับ role refs
openclaw browser click-coords 120 340        # พิกัด viewport
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
openclaw browser set credentials user pass            # --clear เพื่อลบออก
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

หมายเหตุ:

- `upload` และ `dialog` เป็นคำสั่งแบบ **arming**; ให้รันก่อน click/press ที่จะทริกเกอร์ file chooser/dialog
- `click`/`type`/อื่น ๆ ต้องใช้ `ref` จาก `snapshot` (ตัวเลข `12`, role ref `e12` หรือ actionable ARIA ref `ax12`) ระบบตั้งใจไม่รองรับ CSS selectors สำหรับ actions ใช้ `click-coords` เมื่อตำแหน่งบน viewport ที่มองเห็นได้เป็น target ที่เชื่อถือได้เพียงอย่างเดียว
- พาธสำหรับ download, trace และ upload ถูกจำกัดไว้ที่ OpenClaw temp roots: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` ยังสามารถตั้งค่า file inputs ได้โดยตรงผ่าน `--input-ref` หรือ `--element`

tab ids และ labels แบบเสถียรจะคงอยู่แม้ Chromium จะเปลี่ยน raw-target เมื่อ OpenClaw
สามารถพิสูจน์ได้ว่าเป็นแท็บทดแทนเดียวกัน เช่น URL เดียวกัน หรือมีแท็บเก่าเพียงหนึ่งแท็บกลายเป็นแท็บใหม่เพียงหนึ่งแท็บหลังการ submit ฟอร์ม raw target ids ยังคงเปลี่ยนแปลงได้; ในสคริปต์ควรใช้
`suggestedTargetId` จาก `tabs`

ภาพรวมของ flags สำหรับ snapshot:

- `--format ai` (ค่าเริ่มต้นเมื่อมี Playwright): AI snapshot พร้อม numeric refs (`aria-ref="<n>"`)
- `--format aria`: accessibility tree พร้อม `axN` refs เมื่อมี Playwright OpenClaw จะ bind refs เข้ากับ backend DOM ids ของหน้าที่กำลังใช้งานเพื่อให้ actions ถัดไปใช้ได้; หากไม่มี ให้ถือว่าเอาต์พุตนี้มีไว้เพื่อตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): preset ของ role snapshot แบบกะทัดรัด ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อให้สิ่งนี้เป็นค่าเริ่มต้น (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` จะบังคับให้เป็น role snapshot พร้อม `ref=e12` refs `--frame "<iframe>"` ใช้กำหนดขอบเขตของ role snapshots ไปยัง iframe
- `--labels` จะเพิ่ม screenshot เฉพาะ viewport พร้อม overlay ป้ายกำกับ ref (พิมพ์ `MEDIA:<path>`)
- `--urls` จะเพิ่มปลายทางลิงก์ที่ค้นพบต่อท้าย AI snapshots

## Snapshots และ refs

OpenClaw รองรับ “snapshot” อยู่สองรูปแบบ:

- **AI snapshot (numeric refs)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - เอาต์พุต: snapshot แบบข้อความที่มี numeric refs
  - แอ็กชัน: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ระบบจะแยก ref ผ่าน `aria-ref` ของ Playwright

- **Role snapshot (role refs เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - เอาต์พุต: รายการ/ต้นไม้แบบ role-based พร้อม `[ref=e12]` (และ `[nth=1]` แบบไม่บังคับ)
  - แอ็กชัน: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ระบบจะแยก ref ผ่าน `getByRole(...)` (รวม `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวม screenshot ของ viewport พร้อม overlay ป้ายกำกับ `e12`
  - เพิ่ม `--urls` เมื่อข้อความลิงก์คลุมเครือและ agent ต้องการ
    target การนำทางที่ชัดเจน

- **ARIA snapshot (ARIA refs เช่น `ax12`)**: `openclaw browser snapshot --format aria`
  - เอาต์พุต: accessibility tree เป็นโหนดแบบมีโครงสร้าง
  - แอ็กชัน: `openclaw browser click ax12` ใช้ได้เมื่อเส้นทาง snapshot สามารถ bind
    ref ผ่าน Playwright และ Chrome backend DOM ids
- หากไม่มี Playwright ARIA snapshots ก็ยังมีประโยชน์สำหรับ
  การตรวจสอบได้ แต่ refs อาจใช้เป็นแอ็กชันไม่ได้ ให้ทำ snapshot ใหม่ด้วย `--format ai`
  หรือ `--interactive` เมื่อต้องการ action refs
- หลักฐานใน Docker สำหรับเส้นทาง fallback แบบ raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  จะเริ่ม Chromium พร้อม CDP รัน `browser doctor --deep` และตรวจสอบว่า role
  snapshots มี URL ของลิงก์ clickables ที่ถูกยกระดับด้วยเคอร์เซอร์ และข้อมูลเมตาของ iframe

พฤติกรรมของ ref:

- refs **ไม่เสถียรข้ามการนำทาง**; หากมีบางอย่างล้มเหลว ให้รัน `snapshot` ใหม่และใช้ ref ชุดใหม่
- `/act` จะคืนค่า `targetId` ดิบปัจจุบันหลังการแทนที่ที่ถูกทริกเกอร์ด้วย action
  เมื่อระบบสามารถพิสูจน์ได้ว่าเป็นแท็บทดแทนเดียวกัน ให้ใช้ tab ids/labels แบบเสถียร
  ต่อไปสำหรับคำสั่งถัดไป
- หาก role snapshot ถูกถ่ายด้วย `--frame` role refs จะถูกกำหนดขอบเขตอยู่ใน iframe นั้นจนกว่าจะมี role snapshot ถัดไป
- refs แบบ `axN` ที่ไม่รู้จักหรือหมดอายุจะล้มเหลวทันทีแทนที่จะตกไปใช้
  ตัวเลือก `aria-ref` ของ Playwright ให้รัน snapshot ใหม่บนแท็บเดิมเมื่อ
  สิ่งนั้นเกิดขึ้น

## ความสามารถเพิ่มเติมของ wait

คุณสามารถรอมากกว่าแค่เวลา/ข้อความได้:

- รอ URL (รองรับ globs โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
- รอ JS predicate:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ selector มองเห็นได้:
  - `openclaw browser wait "#main"`

สามารถรวมกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## ขั้นตอนการดีบัก

เมื่อ action ล้มเหลว (เช่น “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (ควรใช้ role refs ในโหมด interactive)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายอะไร
4. หากหน้าทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำให้ปัญหาเกิดซ้ำ
   - `openclaw browser trace stop` (พิมพ์ `TRACE:<path>`)

## เอาต์พุต JSON

`--json` มีไว้สำหรับการเขียนสคริปต์และเครื่องมือแบบมีโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

role snapshots ในรูปแบบ JSON จะมี `refs` พร้อมบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือสามารถพิจารณาขนาดและความหนาแน่นของ payload ได้

## ตัวเลือกสำหรับสถานะและสภาพแวดล้อม

ตัวเลือกเหล่านี้มีประโยชน์สำหรับ workflow แบบ “ทำให้ไซต์มีพฤติกรรมเหมือน X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- โหมดออฟไลน์: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (แบบเดิม `set headers --json '{"X-Debug":"1"}'` ยังรองรับอยู่)
- HTTP basic auth: `set credentials user pass` (หรือ `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (Playwright device presets)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ openclaw อาจมีเซสชันที่ล็อกอินอยู่; ให้ถือว่าเป็นข้อมูลอ่อนไหว
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  จะรัน JavaScript แบบกำหนดเองในบริบทของหน้า Prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่ต้องการใช้
- สำหรับการล็อกอินและหมายเหตุเรื่อง anti-bot (X/Twitter ฯลฯ) โปรดดู [การล็อกอิน Browser + การโพสต์ X/Twitter](/th/tools/browser-login)
- ให้โฮสต์ Gateway/node เป็นแบบส่วนตัว (loopback หรือ tailnet-only)
- endpoint ของ Remote CDP มีอำนาจสูง; ให้ทำ tunnel และป้องกันไว้

ตัวอย่าง strict-mode (บล็อกปลายทางส่วนตัว/ภายในเป็นค่าเริ่มต้น):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // อนุญาตแบบ exact โดยไม่บังคับ
    },
  },
}
```

## ที่เกี่ยวข้อง

- [Browser](/th/tools/browser) — ภาพรวม การกำหนดค่า โปรไฟล์ ความปลอดภัย
- [การล็อกอิน Browser](/th/tools/browser-login) — การลงชื่อเข้าใช้เว็บไซต์
- [การแก้ไขปัญหา Browser บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ไขปัญหา Browser บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
