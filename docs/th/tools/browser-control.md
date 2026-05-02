---
read_when:
    - การเขียนสคริปต์หรือดีบักเบราว์เซอร์ของเอเจนต์ผ่าน API ควบคุมภายในเครื่อง
    - กำลังค้นหาเอกสารอ้างอิง CLI ของ `openclaw browser`
    - การเพิ่มการทำงานอัตโนมัติของเบราว์เซอร์แบบกำหนดเองด้วยสแนปช็อตและการอ้างอิง
summary: API การควบคุมเบราว์เซอร์ของ OpenClaw, เอกสารอ้างอิง CLI และการดำเนินการสคริปต์
title: API การควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-05-02T10:30:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ไขปัญหา ดู [เบราว์เซอร์](/th/tools/browser)
หน้านี้เป็นเอกสารอ้างอิงสำหรับ API HTTP ควบคุมในเครื่อง, CLI `openclaw browser`
และรูปแบบการเขียนสคริปต์ (snapshot, ref, wait, debug flow)

## API ควบคุม (ไม่บังคับ)

สำหรับการผสานรวมในเครื่องเท่านั้น Gateway เปิดเผย HTTP API แบบ loopback ขนาดเล็ก:

- สถานะ/เริ่ม/หยุด: `GET /`, `POST /start`, `POST /stop`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- การกระทำ: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- การดาวน์โหลด: `POST /download`, `POST /wait/download`
- สิทธิ์: `POST /permissions/grant`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ทุก endpoint รับ `?profile=<name>` ได้ `POST /start?headless=true` ขอให้เปิดแบบ headless
ครั้งเดียวสำหรับโปรไฟล์ที่จัดการในเครื่อง โดยไม่เปลี่ยนการกำหนดค่า
เบราว์เซอร์ที่บันทึกถาวรไว้; โปรไฟล์แบบ attach-only, CDP ระยะไกล และ existing-session
จะปฏิเสธการ override นั้น เพราะ OpenClaw ไม่ได้เปิดโปรเซสเบราว์เซอร์เหล่านั้น

หากมีการกำหนดค่า auth ของ gateway แบบ shared-secret เส้นทาง HTTP ของเบราว์เซอร์ต้องใช้ auth ด้วย:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth ด้วยรหัสผ่านนั้น

หมายเหตุ:

- local loopback browser API แบบ standalone นี้ **ไม่** ใช้ trusted-proxy หรือ
  header ตัวตนของ Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` เส้นทางเบราว์เซอร์แบบ loopback
  เหล่านี้จะไม่สืบทอดโหมดที่มีตัวตนเหล่านั้น; ให้คงไว้เป็น loopback-only

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบระดับ route และ
ความล้มเหลวจากนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` หายไปหรือไม่รู้จัก
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของ action ไม่ผ่านการ normalization หรือ validation
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): ใช้ `selector` กับชนิด action ที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดใช้งานโดย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนหรือแบบ batch ขัดแย้งกับ target ของคำขอ
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): ไม่รองรับ action สำหรับโปรไฟล์ existing-session

ความล้มเหลวระหว่าง runtime อื่นๆ อาจยังส่งคืน `{ "error": "<message>" }` โดยไม่มี
ฟิลด์ `code`

### ข้อกำหนด Playwright

บางฟีเจอร์ (navigate/act/AI snapshot/role snapshot, screenshot ของ element,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright endpoint เหล่านั้นจะส่งคืน
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังทำงานได้โดยไม่มี Playwright:

- ARIA snapshot
- snapshot การเข้าถึงแบบ role-style (`--interactive`, `--compact`,
  `--depth`, `--efficient`) เมื่อมี CDP WebSocket ต่อแท็บ นี่เป็น
  fallback สำหรับการตรวจสอบและการค้นหา ref; Playwright ยังคงเป็น engine หลัก
  สำหรับ action
- screenshot ของหน้าสำหรับเบราว์เซอร์ `openclaw` ที่จัดการ เมื่อมี CDP
  WebSocket ต่อแท็บ
- screenshot ของหน้าสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- screenshot แบบ ref-based ของ `existing-session` (`--ref`) จาก output ของ snapshot

สิ่งที่ยังต้องใช้ Playwright:

- `navigate`
- `act`
- AI snapshot ที่พึ่งพารูปแบบ AI snapshot ดั้งเดิมของ Playwright
- screenshot ของ element ด้วย CSS selector (`--element`)
- การ export PDF ของเบราว์เซอร์ทั้งหน้า

screenshot ของ element จะปฏิเสธ `--full-page` ด้วย; route จะส่งคืน `fullPage is
not supported for element screenshots`

หากคุณเห็น `Playwright is not available in this gateway build` แปลว่า Gateway
ที่แพ็กเกจมาขาด dependency runtime ของเบราว์เซอร์หลัก ให้ติดตั้งหรืออัปเดต
OpenClaw ใหม่ แล้วรีสตาร์ต gateway สำหรับ Docker ให้ติดตั้ง binary ของเบราว์เซอร์
Chromium ตามที่แสดงด้านล่างด้วย

#### การติดตั้ง Playwright บน Docker

หาก Gateway ของคุณรันใน Docker ให้หลีกเลี่ยง `npx playwright` (มีความขัดแย้งกับ npm override)
ใช้ CLI ที่ bundle มาแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

เพื่อเก็บการดาวน์โหลดเบราว์เซอร์ไว้ถาวร ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (เช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกเก็บถาวรผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount ดู [Docker](/th/install/docker)

## วิธีทำงาน (ภายใน)

control server แบบ loopback ขนาดเล็กรับคำขอ HTTP และเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium ผ่าน CDP action ขั้นสูง (click/type/snapshot/PDF) ทำงานผ่าน Playwright บน CDP อีกชั้นหนึ่ง; เมื่อไม่มี Playwright จะใช้ได้เฉพาะการทำงานที่ไม่ใช่ Playwright เท่านั้น agent เห็น interface ที่เสถียรหนึ่งชุด ขณะที่เบราว์เซอร์และโปรไฟล์ในเครื่อง/ระยะไกลสลับกันได้อิสระด้านล่าง

## คู่มืออ้างอิง CLI แบบเร็ว

ทุกคำสั่งรับ `--browser-profile <name>` เพื่อกำหนดเป้าหมายไปยังโปรไฟล์เฉพาะ และ `--json` สำหรับ output ที่เครื่องอ่านได้

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

<Accordion title="การตรวจสอบ: screenshot, snapshot, console, error, request">

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

<Accordion title="Action: navigate, click, type, drag, wait, evaluate">

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

<Accordion title="สถานะ: cookie, storage, offline, header, geo, device">

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

- `upload` และ `dialog` เป็นการเรียกแบบ **arming**; ให้รันก่อน click/press ที่จะเปิด chooser/dialog
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (ตัวเลข `12`, role ref `e12`, หรือ actionable ARIA ref `ax12`) โดยตั้งใจไม่รองรับ CSS selector สำหรับ action ใช้ `click-coords` เมื่อพิกัด viewport ที่มองเห็นเป็นเป้าหมายเดียวที่เชื่อถือได้
- path สำหรับ download, trace และ upload ถูกจำกัดไว้ที่ temp root ของ OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` ยังสามารถตั้งค่า file input ได้โดยตรงผ่าน `--input-ref` หรือ `--element`

id และ label ของแท็บที่เสถียรจะคงอยู่หลังการแทนที่ raw-target ของ Chromium เมื่อ OpenClaw
พิสูจน์แท็บที่แทนที่ได้ เช่น URL เดียวกัน หรือแท็บเก่าเพียงแท็บเดียวกลายเป็น
แท็บใหม่เพียงแท็บเดียวหลังการ submit ฟอร์ม raw target id ยังผันผวนอยู่; ในสคริปต์ให้ใช้
`suggestedTargetId` จาก `tabs`

สรุป flag ของ snapshot:

- `--format ai` (ค่าเริ่มต้นเมื่อมี Playwright): AI snapshot พร้อม ref ตัวเลข (`aria-ref="<n>"`)
- `--format aria`: accessibility tree พร้อม ref `axN` เมื่อมี Playwright, OpenClaw จะผูก ref ด้วย backend DOM id เข้ากับหน้าจริงเพื่อให้ action ถัดไปใช้ได้; มิฉะนั้นให้ถือว่า output ใช้สำหรับตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): preset ของ role snapshot แบบ compact ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อทำให้เป็นค่าเริ่มต้น (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` บังคับให้ใช้ role snapshot พร้อม ref แบบ `ref=e12` `--frame "<iframe>"` จำกัดขอบเขต role snapshot ไปยัง iframe
- `--labels` เพิ่ม screenshot เฉพาะ viewport พร้อม label ref ซ้อนทับ (พิมพ์ `MEDIA:<path>`)
- `--urls` ต่อท้ายปลายทาง link ที่ค้นพบให้กับ AI snapshot

## Snapshot และ ref

OpenClaw รองรับ “snapshot” สองรูปแบบ:

- **AI snapshot (ref ตัวเลข)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - Output: snapshot แบบข้อความที่มี ref ตัวเลข
  - Action: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ref จะถูก resolve ผ่าน `aria-ref` ของ Playwright

- **Role snapshot (role ref เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: รายการ/tree แบบอิง role พร้อม `[ref=e12]` (และ `[nth=1]` ที่เป็นทางเลือก)
  - Action: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ref จะถูก resolve ผ่าน `getByRole(...)` (รวมถึง `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวม screenshot ของ viewport พร้อม label `e12` ซ้อนทับ
  - เพิ่ม `--urls` เมื่อข้อความ link กำกวม และ agent ต้องการ
    เป้าหมายการนำทางที่เป็นรูปธรรม

- **ARIA snapshot (ARIA ref เช่น `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: accessibility tree เป็น node แบบมีโครงสร้าง
  - Action: `openclaw browser click ax12` ใช้ได้เมื่อ path ของ snapshot สามารถผูก
    ref ผ่าน Playwright และ Chrome backend DOM id ได้
- หากไม่มี Playwright, ARIA snapshot ยังมีประโยชน์สำหรับ
  การตรวจสอบ แต่ ref อาจไม่สามารถใช้เป็น action ได้ ให้ snapshot ใหม่ด้วย `--format ai`
  หรือ `--interactive` เมื่อคุณต้องการ ref สำหรับ action
- หลักฐาน Docker สำหรับ path fallback แบบ raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  เปิด Chromium ด้วย CDP, รัน `browser doctor --deep` และตรวจสอบว่า role
  snapshot มี URL ของ link, clickable ที่เลื่อนสถานะจาก cursor และ metadata ของ iframe

พฤติกรรมของ ref:

- ref **ไม่คงที่ข้ามการนำทาง**; หากมีบางอย่างล้มเหลว ให้รัน `snapshot` อีกครั้งและใช้ ref ใหม่
- `/act` จะคืนค่า `targetId` ดิบปัจจุบันหลังการแทนที่ที่เกิดจากการกระทำ
  เมื่อสามารถพิสูจน์แท็บที่ถูกแทนที่ได้ ให้ใช้รหัส/ป้ายกำกับแท็บที่คงที่ต่อไปสำหรับ
  คำสั่งถัดไป
- หาก snapshot ของบทบาทถูกถ่ายด้วย `--frame` ref ของบทบาทจะถูกจำกัดขอบเขตอยู่ใน iframe นั้นจนกว่าจะมี snapshot ของบทบาทครั้งถัดไป
- ref `axN` ที่ไม่รู้จักหรือล้าสมัยจะล้มเหลวทันทีแทนที่จะปล่อยให้ไหลต่อไปยัง
  ตัวเลือก `aria-ref` ของ Playwright ให้รัน snapshot ใหม่บนแท็บเดียวกันเมื่อ
  สิ่งนั้นเกิดขึ้น

## ความสามารถเสริมของการรอ

คุณสามารถรอได้มากกว่าแค่เวลา/ข้อความ:

- รอ URL (รองรับ glob โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
- รอเพรดิเคต JS:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ตัวเลือกมองเห็นได้:
  - `openclaw browser wait "#main"`

สิ่งเหล่านี้สามารถใช้ร่วมกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์การดีบัก

เมื่อการกระทำล้มเหลว (เช่น “มองไม่เห็น”, “ละเมิดโหมดเข้มงวด”, “ถูกบัง”):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (แนะนำ ref ของบทบาทในโหมดโต้ตอบ)
3. หากยังล้มเหลว: `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายสิ่งใด
4. หากหน้าทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำให้เกิดปัญหาซ้ำ
   - `openclaw browser trace stop` (พิมพ์ `TRACE:<path>`)

## เอาต์พุต JSON

`--json` มีไว้สำหรับสคริปต์และเครื่องมือแบบมีโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

snapshot ของบทบาทใน JSON จะมี `refs` พร้อมบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือใช้เหตุผลเกี่ยวกับขนาดและความหนาแน่นของเพย์โหลดได้

## ตัวปรับสถานะและสภาพแวดล้อม

สิ่งเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์แบบ “ทำให้ไซต์ทำงานเหมือน X”:

- คุกกี้: `cookies`, `cookies set`, `cookies clear`
- พื้นที่จัดเก็บ: `storage local|session get|set|clear`
- ออฟไลน์: `set offline on|off`
- ส่วนหัว: `set headers --headers-json '{"X-Debug":"1"}'` (ยังรองรับแบบเดิม `set headers --json '{"X-Debug":"1"}'`)
- HTTP basic auth: `set credentials user pass` (หรือ `--clear`)
- ตำแหน่งทางภูมิศาสตร์: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- สื่อ: `set media dark|light|no-preference|none`
- เขตเวลา / โลเคล: `set timezone ...`, `set locale ...`
- อุปกรณ์ / วิวพอร์ต:
  - `set device "iPhone 14"` (ค่าล่วงหน้าของอุปกรณ์ใน Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ของ openclaw อาจมีเซสชันที่ล็อกอินอยู่ ให้ถือว่าเป็นข้อมูลอ่อนไหว
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  จะรัน JavaScript ใดก็ได้ในบริบทของหน้า prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่ต้องการใช้
- สำหรับการล็อกอินและหมายเหตุเกี่ยวกับการป้องกันบอต (X/Twitter ฯลฯ) ดู [การล็อกอินเบราว์เซอร์ + การโพสต์ X/Twitter](/th/tools/browser-login)
- รักษาโฮสต์ Gateway/Node ให้เป็นส่วนตัว (ลูปแบ็กหรือเฉพาะเครือข่ายส่วนตัวของ Tailscale เท่านั้น)
- endpoint CDP ระยะไกลมีอำนาจสูง ให้ทำอุโมงค์และปกป้อง endpoint เหล่านั้น

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

- [เบราว์เซอร์](/th/tools/browser) — ภาพรวม การกำหนดค่า โปรไฟล์ ความปลอดภัย
- [การล็อกอินเบราว์เซอร์](/th/tools/browser-login) — การลงชื่อเข้าใช้ไซต์
- [การแก้ไขปัญหาเบราว์เซอร์บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ไขปัญหาเบราว์เซอร์บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
