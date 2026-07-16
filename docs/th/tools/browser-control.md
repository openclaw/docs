---
read_when:
    - การเขียนสคริปต์หรือการดีบักเบราว์เซอร์ของเอเจนต์ผ่าน API ควบคุมภายในเครื่อง
    - กำลังมองหาเอกสารอ้างอิง CLI ของ `openclaw browser`
    - การเพิ่มระบบอัตโนมัติของเบราว์เซอร์แบบกำหนดเองด้วยสแนปชอตและ refs
summary: API ควบคุมเบราว์เซอร์ของ OpenClaw, เอกสารอ้างอิง CLI และการดำเนินการสคริปต์
title: API ควบคุมเบราว์เซอร์
x-i18n:
    generated_at: "2026-07-16T19:49:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

สำหรับการตั้งค่า การกำหนดค่า และการแก้ไขปัญหา โปรดดู [เบราว์เซอร์](/th/tools/browser)
หน้านี้เป็นเอกสารอ้างอิงสำหรับ HTTP API ควบคุมภายในเครื่อง, `openclaw browser`
CLI และรูปแบบการเขียนสคริปต์ (สแนปช็อต, ref, การรอ, โฟลว์การดีบัก)

## API ควบคุม (ไม่บังคับ)

สำหรับการผสานรวมภายในเครื่องเท่านั้น Gateway จะเปิดเผย HTTP API แบบลูปแบ็กขนาดเล็ก
เซิร์ฟเวอร์แบบสแตนด์อโลนนี้ต้องเลือกเปิดใช้งาน — ตั้งค่าตัวแปรสภาพแวดล้อม
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` ในสภาพแวดล้อมของบริการ Gateway
และรีสตาร์ต Gateway ก่อนที่ปลายทาง HTTP จะพร้อมใช้งาน หากไม่มี
ตัวแปรนี้ รันไทม์ควบคุมเบราว์เซอร์ยังคงทำงานผ่าน CLI และ
เครื่องมือเอเจนต์ แต่จะไม่มีสิ่งใดรับฟังบนพอร์ตควบคุมแบบลูปแบ็ก

- สถานะ/เริ่ม/หยุด: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- โปรไฟล์: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- แท็บ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- สแนปช็อต/ภาพหน้าจอ: `GET /snapshot`, `POST /screenshot`
- การดำเนินการ: `POST /navigate`, `POST /act`
- ฮุก: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- การดาวน์โหลด: `POST /download`, `POST /wait/download`
- สิทธิ์: `POST /permissions/grant`
- การดีบัก: `GET /console`, `POST /pdf`
- การดีบัก: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- เครือข่าย: `POST /response/body`
- สถานะ: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- สถานะ: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- การตั้งค่า: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` เป็นรูปแบบแบบแบตช์ที่ CLI ใช้ภายในสำหรับ
คำสั่งย่อย `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
เมื่อเขียนสคริปต์โดยตรง ควรใช้เส้นทางแท็บแบบวัตถุประสงค์เดียวด้านบน

ปลายทางทั้งหมดรองรับ `?profile=<name>` ส่วน `POST /start?headless=true` จะร้องขอ
การเปิดใช้งานแบบ headless ครั้งเดียวสำหรับโปรไฟล์ที่จัดการภายในเครื่อง โดยไม่เปลี่ยนการกำหนดค่า
เบราว์เซอร์ที่บันทึกไว้ โปรไฟล์แบบแนบเท่านั้น, CDP ระยะไกล และเซสชันที่มีอยู่
จะปฏิเสธการแทนค่านี้ เนื่องจาก OpenClaw ไม่ได้เปิดใช้โพรเซสเบราว์เซอร์เหล่านั้น

สำหรับปลายทางแท็บ `targetId` คือชื่อฟิลด์เพื่อความเข้ากันได้ ควรส่ง
`suggestedTargetId` จาก `GET /tabs` หรือ `POST /tabs/open`; นอกจากนี้ยังรองรับป้ายกำกับและแฮนเดิล `tabId`
เช่น `t1` รหัสเป้าหมาย CDP แบบดิบและคำนำหน้ารหัสเป้าหมายแบบดิบ
ที่ไม่ซ้ำกันยังคงใช้งานได้ แต่เป็นแฮนเดิลการวินิจฉัยที่ไม่คงที่

หากกำหนดค่าการตรวจสอบสิทธิ์ Gateway ด้วยข้อมูลลับที่ใช้ร่วมกัน เส้นทาง HTTP ของเบราว์เซอร์จะต้องมีการตรวจสอบสิทธิ์ด้วย:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` หรือการตรวจสอบสิทธิ์ HTTP Basic ด้วยรหัสผ่านนั้น

หมายเหตุ:

- API เบราว์เซอร์แบบลูปแบ็กสแตนด์อโลนนี้ **ไม่** ใช้ส่วนหัวข้อมูลประจำตัวจากพร็อกซีที่เชื่อถือได้หรือ
  Tailscale Serve
- หาก `gateway.auth.mode` เป็น `none` หรือ `trusted-proxy` เส้นทางเบราว์เซอร์แบบลูปแบ็กเหล่านี้
  จะไม่สืบทอดโหมดที่มีข้อมูลประจำตัวดังกล่าว ให้จำกัดไว้เฉพาะลูปแบ็กเท่านั้น

### สัญญาข้อผิดพลาดของ `/act`

`POST /act` ใช้การตอบกลับข้อผิดพลาดแบบมีโครงสร้างสำหรับการตรวจสอบความถูกต้องระดับเส้นทางและ
ความล้มเหลวตามนโยบาย:

```json
{ "error": "<message>", "code": "ACT_*" }
```

ค่า `code` ปัจจุบัน:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` ขาดหายไปหรือไม่รู้จัก
- `ACT_INVALID_REQUEST` (HTTP 400): เพย์โหลดการดำเนินการไม่ผ่านการทำให้เป็นมาตรฐานหรือการตรวจสอบความถูกต้อง
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): ใช้ `selector` กับชนิดการดำเนินการที่ไม่รองรับ
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (หรือ `wait --fn`) ถูกปิดใช้งานโดยการกำหนดค่า
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` ระดับบนสุดหรือแบบแบตช์ขัดแย้งกับเป้าหมายของคำขอ
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): ไม่รองรับการดำเนินการสำหรับโปรไฟล์เซสชันที่มีอยู่

ความล้มเหลวของรันไทม์อื่นอาจยังคงส่งคืน `{ "error": "<message>" }` โดยไม่มี
ฟิลด์ `code`

### ข้อกำหนด Playwright

คุณสมบัติบางอย่าง (การนำทาง/การดำเนินการ/สแนปช็อต AI/สแนปช็อตตามบทบาท, ภาพหน้าจอองค์ประกอบ,
PDF) ต้องใช้ Playwright หากไม่ได้ติดตั้ง Playwright ปลายทางเหล่านั้นจะส่งคืน
ข้อผิดพลาด 501 ที่ชัดเจน

สิ่งที่ยังคงทำงานได้โดยไม่มี Playwright:

- สแนปช็อต ARIA
- สแนปช็อตการช่วยการเข้าถึงแบบตามบทบาท (`--interactive`, `--compact`,
  `--depth`, `--efficient`) เมื่อมี CDP WebSocket ต่อแท็บพร้อมใช้งาน นี่เป็น
  ทางเลือกสำรองสำหรับการตรวจสอบและการค้นหา ref โดย Playwright ยังคงเป็นกลไกหลัก
  สำหรับการดำเนินการ
- ภาพหน้าจอเพจสำหรับเบราว์เซอร์ `openclaw` ที่จัดการ เมื่อมี CDP
  WebSocket ต่อแท็บพร้อมใช้งาน
- ภาพหน้าจอเพจสำหรับโปรไฟล์ `existing-session` / Chrome MCP
- ภาพหน้าจอแบบอิง ref ของ `existing-session` (`--ref`) จากผลลัพธ์สแนปช็อต

สิ่งที่ยังคงต้องใช้ Playwright:

- `navigate`
- `act`
- สแนปช็อต AI ที่ขึ้นอยู่กับรูปแบบสแนปช็อต AI ดั้งเดิมของ Playwright
- ภาพหน้าจอองค์ประกอบด้วยตัวเลือก CSS (`--element`)
- การส่งออก PDF ของเบราว์เซอร์แบบเต็ม

ภาพหน้าจอองค์ประกอบจะปฏิเสธ `--full-page` ด้วย โดยเส้นทางจะส่งคืน `fullPage is
not supported for element screenshots`

หากพบ `Playwright is not available in this gateway build` แสดงว่า Gateway
ที่แพ็กเกจไว้ไม่มีการพึ่งพารันไทม์เบราว์เซอร์หลัก ให้ติดตั้งใหม่หรืออัปเดต
OpenClaw แล้วรีสตาร์ต Gateway สำหรับ Docker ให้ติดตั้งไบนารีเบราว์เซอร์
Chromium ตามที่แสดงด้านล่างด้วย

#### การติดตั้ง Playwright สำหรับ Docker

หาก Gateway ทำงานใน Docker ให้หลีกเลี่ยง `npx playwright` (เกิดข้อขัดแย้งของการแทนค่าจาก npm)
สำหรับอิมเมจที่กำหนดเอง ให้รวม Chromium ไว้ในอิมเมจ:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

สำหรับอิมเมจที่มีอยู่ ให้ติดตั้งผ่าน CLI ที่รวมมาให้แทน:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

หากต้องการเก็บการดาวน์โหลดเบราว์เซอร์ไว้อย่างถาวร ให้ตั้งค่า `PLAYWRIGHT_BROWSERS_PATH` (ตัวอย่างเช่น
`/home/node/.cache/ms-playwright`) และตรวจสอบให้แน่ใจว่า `/home/node` ถูกเก็บไว้อย่างถาวรผ่าน
`OPENCLAW_HOME_VOLUME` หรือ bind mount โดย OpenClaw จะตรวจหา
Chromium ที่เก็บไว้บน Linux โดยอัตโนมัติ โปรดดู [Docker](/th/install/docker)

## วิธีการทำงาน (ภายใน)

เซิร์ฟเวอร์ควบคุมแบบลูปแบ็กขนาดเล็กรับคำขอ HTTP และเชื่อมต่อกับเบราว์เซอร์ที่ใช้ Chromium ผ่าน CDP การดำเนินการขั้นสูง (คลิก/พิมพ์/สแนปช็อต/PDF) ทำงานผ่าน Playwright ที่อยู่บน CDP เมื่อไม่มี Playwright จะใช้ได้เฉพาะการดำเนินการที่ไม่ต้องใช้ Playwright เอเจนต์จะเห็นอินเทอร์เฟซที่เสถียรเพียงหนึ่งเดียว ขณะที่สามารถสลับเบราว์เซอร์และโปรไฟล์ภายในเครื่อง/ระยะไกลที่อยู่เบื้องหลังได้อย่างอิสระ

## ข้อมูลอ้างอิงฉบับย่อสำหรับ CLI

คำสั่งทั้งหมดรองรับ `--browser-profile <name>` เพื่อกำหนดเป้าหมายไปยังโปรไฟล์ที่ระบุ และ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้

<AccordionGroup>

<Accordion title="พื้นฐาน: สถานะ, แท็บ, เปิด/โฟกัส/ปิด">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # เพิ่มโพรบสแนปช็อตแบบสด
openclaw browser start
openclaw browser start --headless # เปิดใช้งานแบบ headless ครั้งเดียวที่จัดการภายในเครื่อง
openclaw browser stop            # ล้างการจำลองบน CDP แบบแนบเท่านั้น/ระยะไกลด้วย
openclaw browser reset-profile   # ย้ายข้อมูลเบราว์เซอร์ของโปรไฟล์ไปยังถังขยะ
openclaw browser tabs
openclaw browser tab             # ทางลัดสำหรับแท็บปัจจุบัน
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="โปรไฟล์: แสดงรายการ, สร้าง, ลบ">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="การตรวจสอบ: ภาพหน้าจอ, สแนปช็อต, คอนโซล, ข้อผิดพลาด, คำขอ">

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
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="การดำเนินการ: นำทาง, คลิก, พิมพ์, ลาก, รอ, ประเมินค่า">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # หรือ e12 สำหรับ ref ตามบทบาท
openclaw browser click-coords 120 340        # พิกัดวิวพอร์ต
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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

<Accordion title="สถานะ: คุกกี้, พื้นที่จัดเก็บ, ออฟไลน์, ส่วนหัว, ตำแหน่งทางภูมิศาสตร์, อุปกรณ์">

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

- เครื่องมือ `browser` สำหรับเอเจนต์เปิดให้ใช้ `action=download` (ต้องระบุ `ref` และ
  `path`) และ `action=waitfordownload` (ระบุ `path` ได้ตามต้องการ) ทั้งสองรายการจะส่งคืน URL ดาวน์โหลดที่บันทึกไว้
  ชื่อไฟล์ที่แนะนำ และพาธภายในเครื่องที่มีการป้องกัน การดักจับการดาวน์โหลด
  แบบชัดเจนพร้อมใช้งานสำหรับโปรไฟล์ Playwright ที่มีการจัดการ ส่วนโปรไฟล์
  ที่ใช้เซสชันเดิมจะส่งคืนข้อผิดพลาดว่าไม่รองรับการดำเนินการ
- ควรใช้อัปโหลดผ่านตัวเลือกไฟล์แบบอะตอมิก โดยส่งทริกเกอร์ `--ref` ไปพร้อมกับการอัปโหลด เพื่อให้ OpenClaw เตรียมพร้อมและคลิกภายในคำขอเดียว ยังคงรองรับ `upload` ที่มีเฉพาะพาธ เมื่อตั้งใจจะใช้ทริกเกอร์ในภายหลัง ใช้ `--input-ref` หรือ `--element` เพื่อตั้งค่าอินพุตไฟล์โดยตรง `dialog` เป็นคำสั่งเตรียมพร้อม ให้เรียกใช้ก่อนการคลิก/กดที่เรียกกล่องโต้ตอบ หากการดำเนินการเปิดโมดัล การตอบกลับของการดำเนินการจะมี `blockedByDialog` และ `browserState.dialogs.pending` ให้ส่ง `dialogId` นั้นเพื่อตอบกลับโดยตรง กล่องโต้ตอบที่จัดการภายนอก OpenClaw จะปรากฏใต้ `browserState.dialogs.recent`
- `click`/`type`/ฯลฯ ต้องใช้ `ref` จาก `snapshot` (`12` แบบตัวเลข, การอ้างอิงบทบาท `e12` หรือการอ้างอิง ARIA ที่ดำเนินการได้ `ax12`) การดำเนินการตั้งใจไม่รองรับตัวเลือก CSS ใช้ `click-coords` เมื่อตำแหน่งในวิวพอร์ตที่มองเห็นเป็นเป้าหมายเดียวที่เชื่อถือได้
- พาธดาวน์โหลดและพาธการติดตามถูกจำกัดให้อยู่ภายในรากชั่วคราวของ OpenClaw: `/tmp/openclaw{,/downloads}` (สำรอง: `${os.tmpdir()}/openclaw/...`)
- `upload` รับไฟล์จากรากการอัปโหลดชั่วคราวของ OpenClaw และ
  สื่อขาเข้าที่ OpenClaw จัดการ สามารถอ้างอิงสื่อขาเข้าที่มีการจัดการเป็น
  `media://inbound/<id>`, `media/inbound/<id>` ที่สัมพันธ์กับแซนด์บ็อกซ์ หรือพาธ
  ที่แก้ไขแล้วภายในไดเรกทอรีสื่อขาเข้าที่มีการจัดการ การอ้างอิงสื่อแบบซ้อน
  การข้ามไดเรกทอรี ลิงก์สัญลักษณ์ ฮาร์ดลิงก์ และพาธภายในเครื่องที่กำหนดเองยังคงถูกปฏิเสธ
- `upload` ยังสามารถตั้งค่าอินพุตไฟล์โดยตรงผ่าน `--input-ref` หรือ `--element` ได้ด้วย

รหัสและป้ายกำกับแท็บที่เสถียรจะยังคงอยู่เมื่อ Chromium แทนที่เป้าหมายดิบ หาก OpenClaw
พิสูจน์แท็บที่มาแทนได้ เช่น คู่เก่า/ใหม่ที่ไม่ซ้ำกันสำหรับ URL เดียวกัน หรือ
แท็บเก่าหนึ่งแท็บกลายเป็นแท็บใหม่หนึ่งแท็บหลังส่งแบบฟอร์ม การแทนที่ที่กำกวม
เนื่องจากมี URL ซ้ำจะได้รับแฮนเดิลใหม่ รหัสเป้าหมายดิบยังคง
เปลี่ยนแปลงได้ ในสคริปต์ควรใช้ `suggestedTargetId` จาก `tabs`

ภาพรวมแฟล็กสแนปช็อต:

- `--format ai` (ค่าเริ่มต้นเมื่อใช้ Playwright): สแนปช็อต AI พร้อมการอ้างอิงแบบตัวเลข (`aria-ref="<n>"`)
- `--format aria`: โครงสร้างการช่วยการเข้าถึงพร้อมการอ้างอิง `axN` เมื่อ Playwright พร้อมใช้งาน OpenClaw จะผูกการอ้างอิงกับรหัส DOM แบ็กเอนด์ของหน้าเว็บสด เพื่อให้การดำเนินการถัดไปใช้งานได้ มิฉะนั้นให้ถือว่าเอาต์พุตใช้สำหรับตรวจสอบเท่านั้น
- `--efficient` (หรือ `--mode efficient`): ค่าที่ตั้งไว้ล่วงหน้าสำหรับสแนปช็อตบทบาทแบบกะทัดรัด ตั้งค่า `browser.snapshotDefaults.mode: "efficient"` เพื่อกำหนดให้เป็นค่าเริ่มต้น (ดู [การกำหนดค่า Gateway](/th/gateway/configuration-reference#browser))
- `--interactive`, `--compact`, `--depth`, `--selector` บังคับใช้สแนปช็อตบทบาทพร้อมการอ้างอิง `ref=e12` โดย `--frame "<iframe>"` จะจำกัดขอบเขตสแนปช็อตบทบาทไว้ที่ iframe
- เมื่อใช้ Playwright `--labels` จะเพิ่มภาพหน้าจอที่ซ้อนป้ายกำกับการอ้างอิง
  (แสดง `MEDIA:<path>`) พร้อมอาร์เรย์ `annotations` ที่มีกล่องขอบเขตของแต่ละการอ้างอิง
  สำหรับ `screenshot` ป้ายกำกับที่ทำงานผ่าน Playwright ใช้ได้กับ `--full-page`,
  `--ref` และ `--element` ส่วนสำหรับ `snapshot` ภาพหน้าจอที่แนบมาจะยังคง
  จำกัดเฉพาะวิวพอร์ต โปรไฟล์ existing-session/chrome-mcp จะแสดงป้ายกำกับซ้อนบน
  ภาพหน้าจอของหน้า แต่จะไม่ส่งคืน `annotations` หรือใช้ตัวช่วยการฉายภาพ
  แบบเต็มหน้า/การอ้างอิง/องค์ประกอบของ Playwright หากไม่มี Playwright หรือ chrome-mcp
  จะไม่สามารถใช้ภาพหน้าจอที่มีป้ายกำกับได้
- `--urls` จะเพิ่มปลายทางลิงก์ที่ค้นพบต่อท้ายสแนปช็อต AI

## สแนปช็อตและการอ้างอิง

OpenClaw รองรับ "สแนปช็อต" สองรูปแบบ:

- **สแนปช็อต AI (การอ้างอิงแบบตัวเลข)**: `openclaw browser snapshot` (ค่าเริ่มต้น; `--format ai`)
  - เอาต์พุต: สแนปช็อตข้อความที่มีการอ้างอิงแบบตัวเลข
  - การดำเนินการ: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - ภายในระบบ การอ้างอิงจะถูกแก้ไขผ่าน `aria-ref` ของ Playwright

- **สแนปช็อตบทบาท (การอ้างอิงบทบาท เช่น `e12`)**: `openclaw browser snapshot --interactive` (หรือ `--compact`, `--depth`, `--selector`, `--frame`)
  - เอาต์พุต: รายการ/โครงสร้างแบบอิงบทบาทพร้อม `[ref=e12]` (และ `[nth=1]` ที่ระบุได้ตามต้องการ)
  - การดำเนินการ: `openclaw browser click e12`, `openclaw browser highlight e12`
  - ภายในระบบ การอ้างอิงจะถูกแก้ไขผ่าน `getByRole(...)` (พร้อม `nth()` สำหรับรายการซ้ำ)
  - เพิ่ม `--labels` เพื่อรวมภาพหน้าจอที่ซ้อนป้ายกำกับ `e12` สำหรับ
    โปรไฟล์ที่ทำงานผ่าน Playwright การดำเนินการนี้จะส่งคืนข้อมูลเมตาของกล่องขอบเขตต่อการอ้างอิงด้วย
    (`annotations[]`)
  - เพิ่ม `--urls` เมื่อข้อความลิงก์กำกวมและเอเจนต์ต้องการ
    เป้าหมายการนำทางที่เจาะจง

- **สแนปช็อต ARIA (การอ้างอิง ARIA เช่น `ax12`)**: `openclaw browser snapshot --format aria`
  - เอาต์พุต: โครงสร้างการช่วยการเข้าถึงในรูปแบบโหนดที่มีโครงสร้าง
  - การดำเนินการ: `openclaw browser click ax12` ใช้งานได้เมื่อพาธสแนปช็อตสามารถผูก
    การอ้างอิงผ่าน Playwright และรหัส DOM แบ็กเอนด์ของ Chrome
- หาก Playwright ไม่พร้อมใช้งาน สแนปช็อต ARIA ยังคงมีประโยชน์สำหรับ
  การตรวจสอบ แต่การอ้างอิงอาจไม่สามารถนำไปดำเนินการได้ ให้สร้างสแนปช็อตใหม่ด้วย `--format ai`
  หรือ `--interactive` เมื่อต้องการการอ้างอิงสำหรับดำเนินการ
- หลักฐาน Docker สำหรับพาธสำรอง raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  เริ่ม Chromium พร้อม CDP เรียกใช้ `browser doctor --deep` และตรวจสอบว่าสแนปช็อตบทบาท
  มี URL ของลิงก์ องค์ประกอบที่เคอร์เซอร์บ่งชี้ว่าคลิกได้ และข้อมูลเมตาของ iframe

ลักษณะการทำงานของการอ้างอิง:

- การอ้างอิง **ไม่เสถียรข้ามการนำทาง** หากเกิดความล้มเหลว ให้เรียกใช้ `snapshot` อีกครั้งและใช้การอ้างอิงใหม่
- `/act` จะส่งคืน `targetId` ดิบปัจจุบันหลังการแทนที่ที่เกิดจากการดำเนินการ
  เมื่อพิสูจน์แท็บที่มาแทนได้ ให้ใช้รหัส/ป้ายกำกับแท็บที่เสถียรต่อไปสำหรับ
  คำสั่งถัดไป
- หากสร้างสแนปช็อตบทบาทด้วย `--frame` การอ้างอิงบทบาทจะถูกจำกัดขอบเขตไว้ที่ iframe นั้นจนกว่าจะสร้างสแนปช็อตบทบาทครั้งถัดไป
- การอ้างอิง `axN` ที่ไม่รู้จักหรือล้าสมัยจะล้มเหลวทันที แทนที่จะส่งต่อไปยัง
  ตัวเลือก `aria-ref` ของ Playwright เมื่อเกิดกรณีนี้ ให้สร้างสแนปช็อตใหม่บนแท็บเดิม

## ความสามารถเพิ่มเติมสำหรับการรอ

สามารถรอได้มากกว่าแค่เวลา/ข้อความ:

- รอ URL (รองรับ glob โดย Playwright):
  - `openclaw browser wait --url "**/dash"`
- รอสถานะการโหลด:
  - `openclaw browser wait --load networkidle`
  - รองรับบน `openclaw` ที่มีการจัดการและโปรไฟล์ CDP แบบดิบ/ระยะไกล โปรไฟล์ที่ใช้ไดรเวอร์ `existing-session` (รวมถึงโปรไฟล์ `user` เริ่มต้น) จะปฏิเสธ `networkidle`; ให้ใช้การรอ `--url`, `--text`, ตัวเลือก หรือ `--fn` แทน
- รอเพรดิเคต JS:
  - `openclaw browser wait --fn "window.ready===true"`
- รอให้ตัวเลือกปรากฏ:
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

เมื่อการดำเนินการล้มเหลว (เช่น "มองไม่เห็น", "ละเมิดโหมดเข้มงวด", "ถูกบดบัง"):

1. `openclaw browser snapshot --interactive`
2. ใช้ `click <ref>` / `type <ref>` (ควรใช้การอ้างอิงบทบาทในโหมดโต้ตอบ)
3. หากยังล้มเหลว: ใช้ `openclaw browser highlight <ref>` เพื่อดูว่า Playwright กำลังกำหนดเป้าหมายอะไร
4. หากหน้าเว็บทำงานผิดปกติ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. สำหรับการดีบักเชิงลึก ให้บันทึกการติดตาม:
   - `openclaw browser trace start`
   - จำลองปัญหาอีกครั้ง
   - `openclaw browser trace stop` (แสดง `TRACE:<path>`)

## เอาต์พุต JSON

`--json` มีไว้สำหรับการเขียนสคริปต์และเครื่องมือแบบมีโครงสร้าง

ตัวอย่าง:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

สแนปช็อตบทบาทใน JSON มี `refs` พร้อมบล็อก `stats` ขนาดเล็ก (บรรทัด/อักขระ/การอ้างอิง/แบบโต้ตอบ) เพื่อให้เครื่องมือประเมินขนาดและความหนาแน่นของเพย์โหลดได้

## ตัวเลือกควบคุมสถานะและสภาพแวดล้อม

รายการต่อไปนี้มีประโยชน์สำหรับเวิร์กโฟลว์ "ทำให้เว็บไซต์ทำงานเหมือน X":

- คุกกี้: `cookies`, `cookies set`, `cookies clear`
- พื้นที่จัดเก็บ: `storage local|session get|set|clear`
- ออฟไลน์: `set offline on|off`
- ส่วนหัว: `set headers --headers-json '{"X-Debug":"1"}'` (หรือรูปแบบระบุตามตำแหน่ง `set headers '{"X-Debug":"1"}'`)
- การตรวจสอบสิทธิ์พื้นฐานของ HTTP: `set credentials user pass` (หรือ `--clear`)
- ตำแหน่งทางภูมิศาสตร์: `set geo <lat> <lon> --origin "https://example.com"` (หรือ `--clear`)
- สื่อ: `set media dark|light|no-preference|none`
- เขตเวลา / โลแคล: `set timezone ...`, `set locale ...`
- อุปกรณ์ / วิวพอร์ต:
  - `set device "iPhone 14"` (ค่าที่ตั้งไว้ล่วงหน้าสำหรับอุปกรณ์ Playwright)
  - `set viewport 1280 720`

## ความปลอดภัยและความเป็นส่วนตัว

- โปรไฟล์เบราว์เซอร์ openclaw อาจมีเซสชันที่เข้าสู่ระบบแล้ว ให้ถือว่าเป็นข้อมูลละเอียดอ่อน
- `browser act kind=evaluate` / `openclaw browser evaluate` และ `wait --fn`
  เรียกใช้ JavaScript ใดๆ ในบริบทของหน้าเว็บได้ การแทรกพรอมต์อาจควบคุม
  การทำงานนี้ ปิดใช้งานด้วย `browser.evaluateEnabled=false` หากไม่จำเป็นต้องใช้
- `openclaw browser evaluate --fn` รับซอร์สของฟังก์ชัน นิพจน์ หรือ
  เนื้อหาคำสั่ง เนื้อหาคำสั่งจะถูกห่อเป็นฟังก์ชันแบบอะซิงโครนัส ดังนั้นให้ใช้
  `return` สำหรับค่าที่ต้องการรับกลับ ใช้ `--timeout-ms <ms>` เมื่อ
  ฟังก์ชันฝั่งหน้าเว็บอาจต้องใช้เวลานานกว่าการหมดเวลาประเมินค่าเริ่มต้น
- สำหรับการเข้าสู่ระบบและหมายเหตุเกี่ยวกับการป้องกันบอต (X/Twitter เป็นต้น) โปรดดู [การเข้าสู่ระบบเบราว์เซอร์และการโพสต์บน X/Twitter](/th/tools/browser-login)
- เก็บโฮสต์ Gateway/node ให้เป็นส่วนตัว (เฉพาะ loopback หรือ tailnet)
- ปลายทาง CDP ระยะไกลมีอำนาจสูง ควรใช้ทันเนลและป้องกันให้เหมาะสม

ตัวอย่างโหมดเข้มงวด (บล็อกปลายทางส่วนตัว/ภายในเป็นค่าเริ่มต้น):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // อนุญาตแบบตรงกันทุกประการได้ตามต้องการ
    },
  },
}
```

## ที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser) - ภาพรวม การกำหนดค่า โปรไฟล์ และความปลอดภัย
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login) - การเข้าสู่ระบบเว็บไซต์
- [การแก้ไขปัญหาเบราว์เซอร์บน Linux](/th/tools/browser-linux-troubleshooting)
- [การแก้ไขปัญหาเบราว์เซอร์บน WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
