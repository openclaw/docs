---
read_when:
    - การเขียนสคริปต์หรือการดีบักเบราว์เซอร์ของเอเจนต์ผ่าน API ควบคุมภายในเครื่อง
    - กำลังมองหาเอกสารอ้างอิง CLI ของ `openclaw browser`
    - การเพิ่มระบบอัตโนมัติของเบราว์เซอร์แบบกำหนดเองด้วยสแนปช็อตและการอ้างอิง
summary: API ควบคุมเบราว์เซอร์ของ OpenClaw, ข้อมูลอ้างอิง CLI และการดำเนินการสำหรับสคริปต์
title: API การควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-05-06T09:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ปัญหา โปรดดู [Browser](/th/tools/browser)
หน้านี้เป็นเอกสารอ้างอิงสำหรับ HTTP API ควบคุมภายในเครื่อง, `openclaw browser`
CLI และรูปแบบการเขียนสคริปต์ (snapshot, ref, การรอ, โฟลว์ debug)

## API ควบคุม (ไม่บังคับ)

สำหรับการผสานรวมภายในเครื่องเท่านั้น Gateway จะเปิด HTTP API แบบ loopback ขนาดเล็ก:

- สถานะ/เริ่ม/หยุด: `GET /`, `POST /start`, `POST /stop`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- การกระทำ: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- ดาวน์โหลด: `POST /download`, `POST /wait/download`
- สิทธิ์: `POST /permissions/grant`
- การ debug: `GET /console`, `POST /pdf`
- การ debug: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Endpoint ทั้งหมดยอมรับ `?profile=<name>` `POST /start?headless=true` จะขอการเปิดแบบ
headless ครั้งเดียวสำหรับโปรไฟล์ที่จัดการภายในเครื่อง โดยไม่เปลี่ยนการกำหนดค่า
browser ที่บันทึกไว้ถาวร โปรไฟล์แบบ attach-only, remote CDP และ existing-session จะปฏิเสธ
การ override นั้น เพราะ OpenClaw ไม่ได้เปิดกระบวนการ browser เหล่านั้น

หากกำหนดค่า auth ของ gateway แบบ shared-secret แล้ว route HTTP ของ browser ก็ต้องใช้ auth ด้วย:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth ด้วยรหัสผ่านนั้น

หมายเหตุ:

- API browser loopback แบบสแตนด์อโลนนี้ **ไม่** ใช้ header ตัวตนของ trusted-proxy หรือ
  Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` route browser แบบ loopback
  เหล่านี้จะไม่สืบทอดโหมดที่มีตัวตนเหล่านั้น ให้คงไว้เป็น loopback-only

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบความถูกต้องระดับ route และ
ความล้มเหลวของนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` หายไปหรือไม่รู้จัก
- `ACT_INVALID_REQUEST` (HTTP 400): payload การกระทำ normalize หรือตรวจสอบความถูกต้องไม่ผ่าน
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): มีการใช้ `selector` กับชนิดการกระทำที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดใช้งานโดย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือแบบ batch ขัดแย้งกับ target ของคำขอ
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): การกระทำนี้ไม่รองรับสำหรับโปรไฟล์ existing-session

ความล้มเหลวระหว่าง runtime อื่น ๆ อาจยังคงส่งคืน `{ "error": "<message>" }` โดยไม่มี
ฟิลด์ `code`

### ข้อกำหนด Playwright

บางฟีเจอร์ (navigate/act/AI snapshot/role snapshot, screenshot ของ element,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright endpoint เหล่านั้นจะส่งคืน
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังใช้งานได้โดยไม่มี Playwright:

- ARIA snapshot
- snapshot การช่วยการเข้าถึงแบบ role-style (`--interactive`, `--compact`,
  `--depth`, `--efficient`) เมื่อมี WebSocket CDP ต่อแท็บ นี่เป็น
  fallback สำหรับการตรวจสอบและการค้นหา ref; Playwright ยังคงเป็น engine การกระทำหลัก
- screenshot ของหน้าสำหรับ browser `openclaw` ที่จัดการ เมื่อมี WebSocket CDP
  ต่อแท็บ
- screenshot ของหน้าสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- screenshot แบบอ้างอิง ref ของ `existing-session` (`--ref`) จาก output snapshot

สิ่งที่ยังต้องใช้ Playwright:

- `navigate`
- `act`
- AI snapshot ที่ขึ้นกับรูปแบบ AI snapshot ดั้งเดิมของ Playwright
- screenshot ของ element ด้วย CSS-selector (`--element`)
- การ export PDF ทั้ง browser

screenshot ของ element ยังปฏิเสธ `--full-page` ด้วย route จะส่งคืน `fullPage is
not supported for element screenshots`

หากคุณเห็น `Playwright is not available in this gateway build` แสดงว่า Gateway
ที่แพ็กมาขาด dependency runtime หลักของ browser ให้ติดตั้งใหม่หรืออัปเดต
OpenClaw แล้ว restart gateway สำหรับ Docker ให้ติดตั้ง binary ของ browser
Chromium ตามที่แสดงด้านล่างด้วย

#### การติดตั้ง Docker Playwright

หาก Gateway ของคุณรันใน Docker ให้หลีกเลี่ยง `npx playwright` (มีความขัดแย้งกับ npm override)
ใช้ CLI ที่รวมมาแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

เพื่อเก็บการดาวน์โหลด browser ไว้ถาวร ให้ตั้ง `PLAYWRIGHT_BROWSERS_PATH` (เช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกเก็บถาวรผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount ดู [Docker](/th/install/docker)

## วิธีทำงาน (ภายใน)

control server แบบ loopback ขนาดเล็กรับคำขอ HTTP และเชื่อมต่อกับ browser ที่ใช้ Chromium ผ่าน CDP การกระทำขั้นสูง (click/type/snapshot/PDF) จะผ่าน Playwright บน CDP; เมื่อไม่มี Playwright จะมีเฉพาะการทำงานที่ไม่ใช้ Playwright เท่านั้น agent จะเห็น interface ที่เสถียรหนึ่งชุด ขณะที่ browser และโปรไฟล์ภายในเครื่อง/ระยะไกลสลับกันได้อย่างอิสระอยู่ด้านล่าง

## อ้างอิง CLI แบบย่อ

คำสั่งทั้งหมดรับ `--browser-profile <name>` เพื่อกำหนดเป้าหมายโปรไฟล์ที่เฉพาะเจาะจง และ `--json` สำหรับ output ที่เครื่องอ่านได้

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

- `upload` และ `dialog` เป็นการเรียกแบบ **arming**; ให้รันก่อน click/press ที่ trigger chooser/dialog
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (`12` แบบตัวเลข, role ref `e12` หรือ actionable ARIA ref `ax12`) ไม่รองรับ CSS selector สำหรับการกระทำโดยตั้งใจ ใช้ `click-coords` เมื่อ viewport position ที่มองเห็นเป็น target ที่เชื่อถือได้เพียงอย่างเดียว
- เส้นทาง Download, trace และ upload ถูกจำกัดไว้ที่ temp root ของ OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` ยังสามารถตั้ง file input ได้โดยตรงผ่าน `--input-ref` หรือ `--element`

id และ label ของแท็บที่เสถียรจะอยู่รอดจากการแทนที่ raw-target ของ Chromium เมื่อ OpenClaw
พิสูจน์แท็บที่แทนที่ได้ เช่น URL เดียวกัน หรือแท็บเก่าเพียงแท็บเดียวกลายเป็น
แท็บใหม่เพียงแท็บเดียวหลังส่งฟอร์ม raw target id ยังคงไม่เสถียร; ในสคริปต์ควรใช้
`suggestedTargetId` จาก `tabs`

สรุป flag ของ snapshot:

- `--format ai` (ค่าเริ่มต้นเมื่อมี Playwright): AI snapshot พร้อม ref ตัวเลข (`aria-ref="<n>"`)
- `--format aria`: accessibility tree พร้อม ref `axN` เมื่อมี Playwright, OpenClaw จะ bind ref ด้วย backend DOM id เข้ากับหน้าจริง เพื่อให้การกระทำต่อเนื่องใช้ ref เหล่านั้นได้; ไม่เช่นนั้นให้ถือว่า output ใช้สำหรับตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): preset role snapshot แบบ compact ตั้ง `browser.snapshotDefaults.mode: "efficient"` เพื่อทำให้เป็นค่าเริ่มต้น (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` บังคับ role snapshot พร้อม ref `ref=e12` `--frame "<iframe>"` จำกัดขอบเขต role snapshot ให้อยู่ใน iframe
- `--labels` เพิ่ม screenshot เฉพาะ viewport พร้อม label ref ที่ overlay อยู่ (พิมพ์ `MEDIA:<path>`)
- `--urls` ต่อท้ายปลายทาง link ที่ค้นพบไปยัง AI snapshot

## Snapshot และ ref

OpenClaw รองรับรูปแบบ "snapshot" สองแบบ:

- **AI snapshot (ref ตัวเลข)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - Output: snapshot แบบข้อความที่มี ref ตัวเลข
  - การกระทำ: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ref จะถูก resolve ผ่าน `aria-ref` ของ Playwright

- **Role snapshot (role ref เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: รายการ/tree ตาม role พร้อม `[ref=e12]` (และ `[nth=1]` แบบไม่บังคับ)
  - การกระทำ: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ref จะถูก resolve ผ่าน `getByRole(...)` (รวมถึง `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อใส่ screenshot ของ viewport พร้อม label `e12` ที่ overlay อยู่
  - เพิ่ม `--urls` เมื่อข้อความ link กำกวมและ agent ต้องการ
    target การนำทางที่เป็นรูปธรรม

- **ARIA snapshot (ARIA ref เช่น `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: accessibility tree เป็น node แบบมีโครงสร้าง
  - การกระทำ: `openclaw browser click ax12` ใช้งานได้เมื่อ path ของ snapshot สามารถ bind
    ref ผ่าน Playwright และ Chrome backend DOM id
- หากไม่มี Playwright, ARIA snapshot ยังมีประโยชน์สำหรับ
  การตรวจสอบ แต่ ref อาจนำไปใช้เป็นการกระทำไม่ได้ ให้ snapshot ใหม่ด้วย `--format ai`
  หรือ `--interactive` เมื่อต้องการ ref สำหรับการกระทำ
- หลักฐาน Docker สำหรับ path fallback ของ raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  จะเริ่ม Chromium ด้วย CDP, รัน `browser doctor --deep` และตรวจสอบว่า role
  snapshot มี URL ของ link, clickable ที่โปรโมตจาก cursor และ metadata ของ iframe

พฤติกรรมของ ref:

- การอ้างอิง **ไม่เสถียรข้ามการนำทาง**; หากบางอย่างล้มเหลว ให้เรียก `snapshot` ใหม่แล้วใช้การอ้างอิงใหม่
- `/act` จะคืนค่า `targetId` ดิบปัจจุบันหลังการแทนที่ที่เกิดจากการกระทำ
  เมื่อสามารถพิสูจน์แท็บที่ถูกแทนที่ได้ ให้ใช้รหัส/ป้ายกำกับแท็บที่เสถียรสำหรับ
  คำสั่งติดตามต่อไป
- หากสแนปช็อตบทบาทถูกถ่ายด้วย `--frame` การอ้างอิงบทบาทจะถูกจำกัดขอบเขตไว้ที่ iframe นั้นจนกว่าจะมีสแนปช็อตบทบาทครั้งถัดไป
- การอ้างอิง `axN` ที่ไม่รู้จักหรือหมดอายุจะล้มเหลวทันที แทนที่จะไหลต่อไปยัง
  selector `aria-ref` ของ Playwright ให้เรียกสแนปช็อตใหม่บนแท็บเดียวกันเมื่อ
  เหตุการณ์นั้นเกิดขึ้น

## ความสามารถเสริมสำหรับการรอ

คุณสามารถรอได้มากกว่าแค่เวลา/ข้อความ:

- รอ URL (รองรับ globs โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
- รอเพรดิเคต JS:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ selector มองเห็นได้:
  - `openclaw browser wait "#main"`

สามารถใช้ร่วมกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์ดีบัก

เมื่อการกระทำล้มเหลว (เช่น "มองไม่เห็น", "ละเมิดโหมดเข้มงวด", "ถูกบดบัง"):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (ควรใช้การอ้างอิงบทบาทในโหมดอินเทอร์แอกทีฟ)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายอะไร
4. หากหน้าเว็บทำงานผิดปกติ:
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

สแนปช็อตบทบาทใน JSON จะรวม `refs` พร้อมบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือให้เหตุผลเกี่ยวกับขนาดและความหนาแน่นของ payload ได้

## สถานะและตัวปรับสภาพแวดล้อม

สิ่งเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์ "ทำให้ไซต์ทำงานเหมือน X":

- คุกกี้: `cookies`, `cookies set`, `cookies clear`
- พื้นที่จัดเก็บ: `storage local|session get|set|clear`
- ออฟไลน์: `set offline on|off`
- ส่วนหัว: `set headers --headers-json '{"X-Debug":"1"}'` (ยังรองรับแบบเก่า `set headers --json '{"X-Debug":"1"}'`)
- การยืนยันตัวตนพื้นฐานของ HTTP: `set credentials user pass` (หรือ `--clear`)
- ตำแหน่งภูมิศาสตร์: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- สื่อ: `set media dark|light|no-preference|none`
- เขตเวลา / ภาษาและภูมิภาค: `set timezone ...`, `set locale ...`
- อุปกรณ์ / viewport:
  - `set device "iPhone 14"` (ค่าล่วงหน้าอุปกรณ์ของ Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ของ openclaw อาจมีเซสชันที่เข้าสู่ระบบอยู่ ให้ถือว่าเป็นข้อมูลละเอียดอ่อน
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  เรียกใช้ JavaScript ใดก็ได้ในบริบทของหน้าเว็บ Prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่ต้องใช้
- สำหรับการเข้าสู่ระบบและหมายเหตุป้องกันบอต (X/Twitter ฯลฯ) ดู [การเข้าสู่ระบบเบราว์เซอร์ + การโพสต์ X/Twitter](/th/tools/browser-login)
- ให้โฮสต์ Gateway/node เป็นส่วนตัว (loopback หรือเฉพาะ tailnet)
- ปลายทาง CDP ระยะไกลมีอำนาจสูง ให้ทำ tunnel และป้องกันไว้

ตัวอย่างโหมดเข้มงวด (บล็อกปลายทางส่วนตัว/ภายในตามค่าเริ่มต้น):

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
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login) - การลงชื่อเข้าใช้ไซต์
- [การแก้ปัญหาเบราว์เซอร์บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ปัญหาเบราว์เซอร์ WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
