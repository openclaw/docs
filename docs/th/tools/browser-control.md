---
read_when:
    - การทำสคริปต์หรือดีบักเบราว์เซอร์ของ agent ผ่าน API ควบคุมภายในเครื่อง
    - กำลังมองหาข้อมูลอ้างอิง CLI ของ `openclaw browser`
    - การเพิ่มระบบอัตโนมัติเบราว์เซอร์แบบกำหนดเองด้วย snapshots และ refs
summary: API การควบคุมเบราว์เซอร์ของ OpenClaw ข้อมูลอ้างอิง CLI และแอ็กชันสำหรับสคริปต์
title: API การควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-04-25T13:59:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ไขปัญหา ดู [Browser](/th/tools/browser)
หน้านี้เป็นข้อมูลอ้างอิงสำหรับ local control HTTP API, CLI `openclaw browser`
และรูปแบบการทำสคริปต์ (snapshots, refs, waits, debug flows)

## Control API (ไม่บังคับ)

สำหรับ local integrations เท่านั้น Gateway จะเปิด loopback HTTP API ขนาดเล็ก:

- สถานะ/เริ่ม/หยุด: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

ทุก endpoint รองรับ `?profile=<name>` `POST /start?headless=true` ใช้ขอ
การเปิดแบบ headless ครั้งเดียวสำหรับ local managed profiles โดยไม่เปลี่ยน
browser config ที่จัดเก็บไว้ถาวร; attach-only, remote CDP และ existing-session profiles จะปฏิเสธ override นี้ เพราะ OpenClaw ไม่ได้เป็นผู้เปิดโปรเซสเบราว์เซอร์เหล่านั้น

หากมีการกำหนดค่า gateway auth แบบ shared-secret เส้นทาง HTTP ของเบราว์เซอร์ก็ต้องยืนยันตัวตนด้วยเช่นกัน:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือ HTTP Basic auth ที่ใช้รหัสผ่านนั้น

หมายเหตุ:

- loopback browser API แบบแยกนี้จะ **ไม่** ใช้ trusted-proxy หรือ
  Tailscale Serve identity headers
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` เส้นทาง loopback browser เหล่านี้จะไม่สืบทอดโหมดที่มี identity เหล่านั้น; ควรคงไว้เป็น loopback-only

### ข้อตกลงข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับความล้มเหลวด้านการตรวจสอบและนโยบายในระดับ route:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): ไม่มี `kind` หรือไม่รู้จักค่า
- `ACT_INVALID_REQUEST` (HTTP 400): payload ของ action ไม่ผ่านการ normalize หรือ validation
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): มีการใช้ `selector` กับ action kind ที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดด้วย config
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือใน batched ขัดแย้งกับ target ของ request
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action นี้ไม่รองรับสำหรับ existing-session profiles

ความล้มเหลวอื่น ๆ ขณะรันจริงอาจยังคงส่งกลับ `{ "error": "<message>" }` โดยไม่มี
ฟิลด์ `code`

### ข้อกำหนด Playwright

บางฟีเจอร์ (navigate/act/AI snapshot/role snapshot, element screenshots,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright endpoint เหล่านั้นจะส่งกลับข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังใช้งานได้โดยไม่มี Playwright:

- ARIA snapshots
- Page screenshots สำหรับเบราว์เซอร์ `openclaw` ที่ถูกจัดการ เมื่อมี per-tab CDP
  WebSocket ให้ใช้งาน
- Page screenshots สำหรับ `existing-session` / Chrome MCP profiles
- `existing-session` ref-based screenshots (`--ref`) จากเอาต์พุต snapshot

สิ่งที่ยังคงต้องใช้ Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- CSS-selector element screenshots (`--element`)
- full browser PDF export

Element screenshots จะปฏิเสธ `--full-page` เช่นกัน; route จะส่งกลับว่า `fullPage is
not supported for element screenshots`

หากคุณพบ `Playwright is not available in this gateway build` ให้ซ่อมแซม bundled browser plugin runtime dependencies เพื่อให้มีการติดตั้ง `playwright-core`
จากนั้นรีสตาร์ท gateway สำหรับ packaged installs ให้รัน `openclaw doctor --fix`
สำหรับ Docker ให้ติดตั้ง Chromium browser binaries เพิ่มเติมตามตัวอย่างด้านล่าง

#### การติดตั้ง Playwright ใน Docker

หาก Gateway ของคุณรันใน Docker หลีกเลี่ยง `npx playwright` (มีความขัดแย้งกับ npm override)
ให้ใช้ CLI ที่รวมมาแทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

หากต้องการเก็บ browser downloads แบบถาวร ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (เช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบว่า `/home/node` ถูกเก็บถาวรผ่าน `OPENCLAW_HOME_VOLUME` หรือ bind mount ดู [Docker](/th/install/docker)

## วิธีการทำงาน (ภายใน)

เซิร์ฟเวอร์ควบคุม loopback ขนาดเล็กจะรับ HTTP requests และเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium ผ่าน CDP แอ็กชันขั้นสูง (click/type/snapshot/PDF) จะทำผ่าน Playwright ที่ทำงานบน CDP; เมื่อไม่มี Playwright จะมีเฉพาะการดำเนินการที่ไม่ใช้ Playwright เท่านั้น agent จะเห็นอินเทอร์เฟซที่เสถียรเพียงหนึ่งเดียว ขณะที่เบราว์เซอร์และ profiles ทั้งในเครื่อง/ระยะไกลสามารถสลับอยู่ข้างใต้ได้อย่างอิสระ

## ข้อมูลอ้างอิง CLI แบบย่อ

ทุกคำสั่งรองรับ `--browser-profile <name>` เพื่อกำหนดเป้าหมาย profile เฉพาะ และ `--json` สำหรับเอาต์พุตแบบ machine-readable

<AccordionGroup>

<Accordion title="พื้นฐาน: สถานะ, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # เปิด local managed แบบ headless ครั้งเดียว
openclaw browser stop            # ล้าง emulation บน attach-only/remote CDP ด้วย
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
openclaw browser screenshot --ref 12        # หรือ --ref e12
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
openclaw browser set credentials user pass            # ใช้ --clear เพื่อลบ
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

หมายเหตุ:

- `upload` และ `dialog` เป็นการเรียกแบบ **arming**; ให้รันก่อน click/press ที่จะทริกเกอร์ file chooser/dialog
- `click`/`type`/อื่น ๆ ต้องใช้ `ref` จาก `snapshot` (ตัวเลข `12`, role ref `e12` หรือ actionable ARIA ref `ax12`) ไม่รองรับ CSS selectors สำหรับ actions โดยตั้งใจ ใช้ `click-coords` เมื่อพิกัดใน visible viewport เป็นเป้าหมายที่เชื่อถือได้เพียงอย่างเดียว
- เส้นทางของ download, trace และ upload ถูกจำกัดให้อยู่ภายใน OpenClaw temp roots: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`)
- `upload` สามารถตั้งค่า file inputs โดยตรงได้ด้วย `--input-ref` หรือ `--element`

ภาพรวม flags ของ snapshot:

- `--format ai` (ค่าเริ่มต้นเมื่อมี Playwright): AI snapshot พร้อม numeric refs (`aria-ref="<n>"`)
- `--format aria`: accessibility tree พร้อม `axN` refs เมื่อมี Playwright OpenClaw จะ bind refs กับ backend DOM ids ไปยัง live page เพื่อให้ actions ถัดไปใช้งานได้; หากไม่มี ให้ถือว่าเอาต์พุตนี้ใช้เพื่อตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): preset ของ compact role snapshot ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อให้ค่านี้เป็นค่าเริ่มต้น (ดู [Gateway configuration](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` จะบังคับใช้ role snapshot พร้อม `ref=e12` refs `--frame "<iframe>"` ใช้กำหนดขอบเขต role snapshots ไปยัง iframe
- `--labels` จะเพิ่ม viewport-only screenshot พร้อมป้ายกำกับ ref ซ้อนทับ (พิมพ์ `MEDIA:<path>`)
- `--urls` จะต่อท้ายปลายทางลิงก์ที่ค้นพบลงใน AI snapshots

## Snapshots และ refs

OpenClaw รองรับ “snapshot” 2 รูปแบบ:

- **AI snapshot (numeric refs)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - เอาต์พุต: text snapshot ที่มี numeric refs
  - Actions: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายใน ref จะถูก resolve ผ่าน `aria-ref` ของ Playwright

- **Role snapshot (role refs เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - เอาต์พุต: รายการ/ต้นไม้แบบอิง role พร้อม `[ref=e12]` (และอาจมี `[nth=1]`)
  - Actions: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายใน ref จะถูก resolve ผ่าน `getByRole(...)` (พร้อม `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวม viewport screenshot พร้อมป้าย `e12` ซ้อนทับ
  - เพิ่ม `--urls` เมื่อข้อความลิงก์กำกวมและ agent ต้องการเป้าหมายการนำทางที่ชัดเจน

- **ARIA snapshot (ARIA refs เช่น `ax12`)**: `openclaw browser snapshot --format aria`
  - เอาต์พุต: accessibility tree เป็น structured nodes
  - Actions: `openclaw browser click ax12` ใช้งานได้เมื่อเส้นทาง snapshot สามารถ bind
    ref ผ่าน Playwright และ Chrome backend DOM ids
  - หากไม่มี Playwright ARIA snapshots ยังมีประโยชน์สำหรับการตรวจสอบได้
    แต่ refs อาจใช้ action ไม่ได้ ให้ snapshot ใหม่ด้วย `--format ai`
    หรือ `--interactive` เมื่อต้องการ action refs

พฤติกรรมของ ref:

- refs **ไม่เสถียรเมื่อข้าม navigations**; หากมีบางอย่างล้มเหลว ให้รัน `snapshot` ใหม่และใช้ ref ใหม่
- หาก role snapshot ถูกถ่ายพร้อม `--frame` role refs จะถูกกำหนดขอบเขตอยู่ใน iframe นั้นจนกว่าจะมี role snapshot ถัดไป
- `axN` refs ที่ไม่รู้จักหรือหมดอายุจะล้มเหลวทันที แทนที่จะตกกลับไปใช้
  selector `aria-ref` ของ Playwright ให้รัน snapshot ใหม่บนแท็บเดียวกัน
  เมื่อเกิดกรณีนั้น

## ความสามารถเพิ่มเติมของ wait

คุณสามารถรอได้มากกว่าเวลา/ข้อความ:

- รอ URL (รองรับ globs โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
- รอ JS predicate:
  - `openclaw browser wait --fn "window.ready===true"`
- รอ selector จนมองเห็นได้:
  - `openclaw browser wait "#main"`

สามารถใช้ร่วมกันได้:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## เวิร์กโฟลว์การดีบัก

เมื่อ action ล้มเหลว (เช่น “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (ควรใช้ role refs ในโหมด interactive)
3. หากยังล้มเหลว: ใช้ `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายอะไร
4. หากหน้าทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก: บันทึก trace:
   - `openclaw browser trace start`
   - ทำให้ปัญหาเกิดขึ้นอีกครั้ง
   - `openclaw browser trace stop` (พิมพ์ `TRACE:<path>`)

## เอาต์พุต JSON

`--json` ใช้สำหรับการทำสคริปต์และเครื่องมือแบบมีโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

role snapshots ใน JSON จะมี `refs` พร้อมบล็อก `stats` ขนาดเล็ก (lines/chars/refs/interactive) เพื่อให้เครื่องมือสามารถประเมินขนาดและความหนาแน่นของ payload ได้

## ตัวควบคุมสถานะและ environment

ตัวเลือกเหล่านี้มีประโยชน์สำหรับเวิร์กโฟลว์แบบ “ทำให้เว็บไซต์มีพฤติกรรมเหมือน X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (รูปแบบเดิม `set headers --json '{"X-Debug":"1"}'` ยังรองรับอยู่)
- HTTP basic auth: `set credentials user pass` (หรือ `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (Playwright device presets)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ openclaw อาจมีเซสชันที่ลงชื่อเข้าใช้อยู่; ควรถือว่าเป็นข้อมูลอ่อนไหว
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  จะรัน JavaScript ใด ๆ ก็ได้ในบริบทของหน้า Prompt injection สามารถชี้นำ
  สิ่งนี้ได้ ปิดการใช้งานด้วย `browser.evaluateEnabled=false` หากคุณไม่จำเป็นต้องใช้
- สำหรับหมายเหตุเรื่องการเข้าสู่ระบบและการป้องกันบอต (X/Twitter ฯลฯ) ดู [Browser login + X/Twitter posting](/th/tools/browser-login)
- ควรเก็บโฮสต์ Gateway/node ให้เป็นส่วนตัว (loopback หรือ tailnet-only)
- remote CDP endpoints มีความสามารถสูง; ควร tunnel และป้องกันให้ดี

ตัวอย่าง strict-mode (บล็อกปลายทาง private/internal โดยค่าเริ่มต้น):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // exact allow แบบไม่บังคับ
    },
  },
}
```

## ที่เกี่ยวข้อง

- [Browser](/th/tools/browser) — ภาพรวม การกำหนดค่า profiles และความปลอดภัย
- [Browser login](/th/tools/browser-login) — การลงชื่อเข้าใช้เว็บไซต์
- [การแก้ไขปัญหา Browser บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ไขปัญหา Browser บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
