---
read_when:
    - การสร้างหรือเรียกใช้ QA เชิงภาพแบบสดสำหรับบั๊กของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึงการเปลี่ยนแปลง
    - การเพิ่มสถานการณ์การรับส่งแบบสดสำหรับ Discord, Slack, WhatsApp หรืออื่น ๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ การทำงานอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบแบบ end-to-end ด้วยภาพสำหรับจำลองบั๊กของ OpenClaw บนทรานสปอร์ตที่ใช้งานจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์ไปยัง PRs.
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-10T19:33:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis คือระบบยืนยันความถูกต้องแบบครบวงจรของ OpenClaw สำหรับบั๊กที่ต้องใช้
runtime จริง, การขนส่งจริง, และหลักฐานที่มองเห็นได้ ระบบจะเรียกใช้สถานการณ์กับ
ref ที่ทราบว่าเสีย, บันทึกหลักฐาน, เรียกใช้สถานการณ์เดียวกันกับ ref ผู้สมัคร, และ
เผยแพร่การเปรียบเทียบเป็น artifact ที่ maintainer สามารถตรวจสอบได้จาก PR หรือ
จากคำสั่งในเครื่อง

Mantis เริ่มจาก Discord เพราะ Discord ให้ lane แรกที่มีมูลค่าสูงแก่เรา:
การยืนยันตัวตนของบอตจริง, ช่อง guild จริง, reaction, thread, คำสั่ง native, และ
UI เบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่าสิ่งที่การขนส่งแสดงคืออะไร

## เป้าหมาย

- ทำซ้ำบั๊กจาก GitHub issue หรือ PR ด้วยรูปแบบการขนส่งเดียวกับที่ผู้ใช้
  เห็น
- บันทึก artifact **ก่อน** บน ref พื้นฐานก่อนใช้การแก้ไข
- บันทึก artifact **หลัง** บน ref ผู้สมัครหลังใช้การแก้ไข
- ใช้ oracle ที่กำหนดได้แน่นอนเมื่อเป็นไปได้ เช่น การอ่าน Discord REST reaction
  หรือการตรวจสอบ transcript ของช่อง
- บันทึก screenshot เมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- เรียกใช้ในเครื่องจาก CLI ที่ agent ควบคุม และเรียกใช้ระยะไกลจาก GitHub
- เก็บสถานะของเครื่องให้เพียงพอสำหรับกู้คืนผ่าน VNC เมื่อการเข้าสู่ระบบ, การทำงานอัตโนมัติของเบราว์เซอร์, หรือ
  การยืนยันตัวตนของ provider ติดขัด
- โพสต์สถานะสั้น ๆ ไปยังช่อง Discord ของ operator เมื่อการรันถูกบล็อก,
  ต้องการความช่วยเหลือ VNC แบบ manual, หรือเสร็จสิ้น

## สิ่งที่ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit test โดยปกติแล้วการรัน Mantis ควรถูกเปลี่ยนเป็น
  regression test ที่เล็กลงหลังจากเข้าใจการแก้ไขแล้ว
- Mantis ไม่ใช่ gate CI ที่เร็วตามปกติ มันช้ากว่า, ใช้ credential จริง, และ
  สงวนไว้สำหรับบั๊กที่สภาพแวดล้อมจริงมีความสำคัญ
- Mantis ไม่ควรต้องใช้มนุษย์สำหรับการทำงานปกติ VNC แบบ manual เป็นเส้นทางกู้คืน
  ไม่ใช่เส้นทางหลัก
- Mantis ไม่เก็บ secret ดิบไว้ใน artifact, log, screenshot, รายงาน Markdown
  หรือคอมเมนต์ PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแตก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของ runtime ของสถานการณ์, adapter การขนส่ง, schema หลักฐาน, และ
  CLI ในเครื่องภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของชิ้นส่วน harness การขนส่งจริง, helper การจับภาพเบราว์เซอร์, และ
  writer ของ artifact
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นไว้เมื่อจำเป็นต้องใช้ VM ระยะไกล
- GitHub Actions เป็นเจ้าของ entrypoint ของ workflow ระยะไกลและการเก็บรักษา artifact
- ClawSweeper เป็นเจ้าของการ route คอมเมนต์ GitHub: การ parse คำสั่งของ maintainer,
  การ dispatch workflow, และการโพสต์คอมเมนต์ PR สุดท้าย
- agent ของ OpenClaw ขับเคลื่อน Mantis ผ่าน Codex เมื่อสถานการณ์ต้องการการตั้งค่าแบบ agentic,
  การดีบัก, หรือการรายงานสถานะที่ติดขัด

ขอบเขตนี้ทำให้ความรู้ด้านการขนส่งอยู่ใน OpenClaw, การจัดตารางเครื่องอยู่ใน
Crabbox, และ glue ของ workflow maintainer อยู่ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่งในเครื่องคำสั่งแรกยืนยันความถูกต้องของบอต Discord, guild, ช่อง, การส่งข้อความ,
การส่ง reaction, และ path ของ artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

runner ก่อนและหลังในเครื่องรับรูปแบบนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner สร้าง worktree พื้นฐานและผู้สมัครแบบ detached ใต้ไดเรกทอรี output,
ติดตั้ง dependency, build แต่ละ ref, เรียกใช้สถานการณ์ด้วย
`--allow-failures`, จากนั้นเขียน `baseline/`, `candidate/`, `comparison.json`,
และ `mantis-report.md` สำหรับสถานการณ์ Discord แรก การยืนยันความถูกต้องที่สำเร็จ
หมายความว่าสถานะพื้นฐานเป็น `fail` และสถานะผู้สมัครเป็น `pass`

probe ก่อน/หลังตัวที่สองของ Discord เจาะจง attachment ใน thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

สถานการณ์นั้นโพสต์ข้อความ parent ด้วยบอต driver, สร้าง thread Discord จริง,
เรียก action `message.thread-reply` ของ OpenClaw ด้วย `filePath` ภายใน repo,
จากนั้น poll thread เพื่อหา reply ของ SUT และชื่อไฟล์ attachment
screenshot พื้นฐานแสดง reply ที่ไม่มี attachment; screenshot ผู้สมัคร
แสดง attachment `mantis-thread-report.md` ตามที่คาดไว้

primitive VM/เบราว์เซอร์แรกคือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

มัน lease หรือ reuse เครื่อง desktop ของ Crabbox, เริ่มเบราว์เซอร์ที่มองเห็นได้ภายใน
session VNC, จับภาพ desktop, ดึง artifact กลับมายังไดเรกทอรี output ในเครื่อง,
และเขียนคำสั่ง reconnect ลงในรายงาน คำสั่งมีค่าเริ่มต้นเป็น provider Hetzner
เพราะเป็น provider แรกที่มี coverage desktop/VNC ที่ใช้งานได้ใน lane ของ Mantis
override ได้ด้วย `--provider`, `--crabbox-bin`, หรือ
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อเรียกใช้กับ fleet Crabbox อื่น

flag desktop smoke ที่มีประโยชน์:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reuse desktop ที่อุ่นไว้
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดในเบราว์เซอร์ที่มองเห็นได้
- `--html-file <path>` render artifact HTML ภายใน repo ในเบราว์เซอร์ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อจับภาพ timeline ของ Discord status-reaction ที่สร้างขึ้นผ่าน desktop Crabbox จริง
- `--browser-profile-dir <remote-path>` reuse user-data-dir ของ Chrome ระยะไกล เพื่อให้ desktop Mantis แบบ persistent ยังคง logged in ระหว่างการรัน ใช้สิ่งนี้สำหรับ profile ตัวดู Discord Web ที่มีอายุยาว
- `--browser-profile-archive-env <name>` restore archive user-data-dir ของ Chrome แบบ base64 `.tgz` จาก environment variable ชื่อที่กำหนดก่อนเปิดเบราว์เซอร์ ใช้สิ่งนี้สำหรับพยานที่ logged in เช่น Discord Web env var เริ่มต้นคือ `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`
- `--video-duration <seconds>` ควบคุมความยาวการจับภาพ MP4 ใช้ระยะเวลาที่ยาวขึ้นสำหรับ web app ที่ logged in และช้า ซึ่งต้องใช้เวลาให้เสถียร
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` เปิด lease ที่สร้างใหม่และผ่านไว้สำหรับการตรวจสอบ VNC การรันที่ล้มเหลวจะเก็บ lease ไว้ตามค่าเริ่มต้นเมื่อมีการสร้างไว้ เพื่อให้ operator reconnect ได้
- `--class`, `--idle-timeout`, และ `--ttl` ปรับขนาดเครื่องและอายุของ lease

สำหรับหลักฐาน Discord Web, Mantis ใช้บัญชี viewer เฉพาะแทน
bot token สถานการณ์ Discord API จริงยังคงเป็น oracle: มันสร้าง thread จริง,
ส่ง `thread-reply` ของ SUT, และตรวจสอบ attachment ผ่าน Discord
REST เมื่อมีการตั้งค่า `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` สถานการณ์จะ
เขียน artifact URL ของ Discord Web ด้วย เมื่อมีการตั้งค่า `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
มันจะปล่อยให้ thread นั้นพร้อมใช้นานพอสำหรับเบราว์เซอร์ที่ logged in เพื่อเปิด
และบันทึก

workflow GitHub เปิด URL thread ผู้สมัครใน Discord Web, จับภาพ
screenshot, บันทึก MP4, และสร้าง preview GIF ที่ trim ตาม motion เมื่อมี tooling media ของ Crabbox
พร้อมใช้งาน ควรใช้ path profile viewer แบบ persistent ที่กำหนดค่า
ผ่าน `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` เพราะ archive profile Chrome เต็ม
อาจใหญ่เกินขีดจำกัดขนาด secret ของ GitHub สำหรับ profile ขนาดเล็ก/bootstrap,
workflow ยังสามารถ restore archive base64 `.tgz` จาก
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ได้ด้วย หากไม่ได้กำหนดค่าแหล่ง profile ใดเลย
workflow ยังคงเผยแพร่ screenshot attachment พื้นฐาน/ผู้สมัครที่กำหนดได้แน่นอน
และ log notice ว่าข้ามพยาน Discord Web ที่ logged in

primitive การขนส่ง desktop แบบเต็มแรกคือ Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

มัน lease หรือ reuse เครื่อง desktop ของ Crabbox, sync checkout ปัจจุบันเข้าไปใน
VM, รัน `pnpm openclaw qa slack` ภายใน VM นั้น, เปิด Slack Web ในเบราว์เซอร์ VNC,
จับภาพ desktop ที่มองเห็นได้, และ copy ทั้ง artifact QA ของ Slack และ
screenshot VNC กลับมายังไดเรกทอรี output ในเครื่อง นี่คือรูปแบบ Mantis แรก
ที่ SUT OpenClaw gateway และเบราว์เซอร์อยู่ภายใน VM desktop Linux เดียวกัน

ด้วย `--gateway-setup`, คำสั่งเตรียม OpenClaw home แบบ disposable ที่ persistent
ไว้ที่ `$HOME/.openclaw-mantis/slack-openclaw`, patch การกำหนดค่า Slack Socket Mode
สำหรับช่องที่เลือก, เริ่ม `openclaw gateway run` บน port
`38973`, และเปิด Chrome ค้างไว้ใน session VNC นี่คือโหมด "ปล่อย desktop Linux
ที่มี Slack และ claw กำลังรันไว้ให้ฉัน"; lane QA Slack แบบบอตต่อบอตยังคงเป็น
ค่าเริ่มต้นเมื่อไม่ได้ระบุ `--gateway-setup`

input ที่จำเป็นสำหรับ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับ lane model ระยะไกล หากตั้งค่าเฉพาะ
  `OPENAI_API_KEY` ในเครื่อง, Mantis จะ map ไปยัง `OPENCLAW_LIVE_OPENAI_KEY`
  ก่อนเรียก Crabbox เพื่อให้การ forward env `OPENCLAW_*` ของ Crabbox พาเข้าไป
  ใน VM ได้

ด้วย `--gateway-setup --credential-source convex`, Mantis lease credential Slack SUT
จาก pool ที่ใช้ร่วมกันก่อนสร้าง VM และ forward channel id ที่ lease,
Socket Mode app token, และ bot token เป็น env runtime `OPENCLAW_MANTIS_SLACK_*`
ภายใน desktop สิ่งนี้ทำให้ workflow GitHub บางลง: ต้องใช้เพียง
secret ของ broker Convex ไม่ใช่ bot token หรือ app token ดิบของ Slack

flag Slack desktop ที่มีประโยชน์:

- `--lease-id <cbx_...>` รันซ้ำกับเครื่องที่ operator เข้าสู่ระบบ Slack Web ผ่าน VNC ไว้แล้ว
- `--gateway-setup` เริ่ม Gateway Slack ของ OpenClaw แบบ persistent ใน VM แทนที่จะรันเฉพาะ lane QA แบบบอตต่อบอต
- `--keep-lease` เปิด VM Gateway ค้างไว้สำหรับการตรวจสอบ VNC หลังสำเร็จ; `--no-keep-lease` หยุด VM หลังรวบรวม artifact
- `--slack-url <url>` เปิด URL Slack Web เฉพาะ หากไม่มี Mantis จะ derive `https://app.slack.com/client/<team>/<channel>` จาก Slack `auth.test` เมื่อมี bot token ของ SUT พร้อมใช้งาน
- `--slack-channel-id <id>` ควบคุม allowlist ช่อง Slack ที่ใช้โดยการตั้งค่า Gateway
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุม profile Chrome แบบ persistent ภายใน VM ค่าเริ่มต้นคือ `$HOME/.config/openclaw-mantis/slack-chrome-profile` ดังนั้นการ login Slack Web แบบ manual จะอยู่รอดหลังการรันซ้ำบน lease เดียวกัน
- `--credential-source convex --credential-role ci` ใช้ pool credential ที่ใช้ร่วมกันแทน token env ของ Slack โดยตรง
- `--provider-mode`, `--model`, `--alt-model`, และ `--fast` pass through ไปยัง lane live ของ Slack

workflow smoke ของ GitHub คือ `Mantis Discord Smoke` workflow GitHub ก่อนและหลัง
สำหรับสถานการณ์จริงแรกคือ `Mantis Discord Status Reactions` โดยรับ:

- `baseline_ref`: ref ที่คาดว่าจะทำซ้ำพฤติกรรม queued-only
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

มัน checkout ref harness workflow, build worktree พื้นฐานและผู้สมัครแยกกัน,
รัน `discord-status-reactions-tool-only` กับแต่ละ worktree, และ
upload `baseline/`, `candidate/`, `comparison.json`, และ `mantis-report.md` เป็น
artifact ของ Actions นอกจากนี้ยัง render HTML timeline ของแต่ละ lane ในเบราว์เซอร์
desktop Crabbox และเผยแพร่ screenshot VNC เหล่านั้นเคียงข้าง PNG timeline
ที่กำหนดได้แน่นอนในคอมเมนต์ PR คอมเมนต์ PR เดียวกันฝัง preview GIF แบบเบา
ที่ trim ตาม motion ซึ่งสร้างโดย `crabbox media preview`, ลิงก์ไปยัง
clip MP4 ที่ trim ตาม motion ที่ตรงกัน, และเก็บไฟล์ MP4 desktop แบบเต็มไว้สำหรับ
การตรวจสอบเชิงลึก screenshot จะยังอยู่ inline เพื่อให้ review ได้เร็ว workflow build
Crabbox CLI จาก
`openclaw/crabbox` main เพื่อให้ใช้ flag lease desktop/เบราว์เซอร์ปัจจุบันได้
ก่อนที่จะตัด release binary Crabbox ถัดไป

`Mantis Scenario` คือ entrypoint manual แบบ generic โดยรับ `scenario_id`,
`candidate_ref`, `baseline_ref` ที่เป็น optional, และ `pr_number` ที่เป็น optional จากนั้น
dispatch workflow ที่สถานการณ์เป็นเจ้าของ wrapper นี้ตั้งใจให้บาง:
workflow ของสถานการณ์ยังคงเป็นเจ้าของการตั้งค่าการขนส่ง, credential, class VM,
oracle ที่คาดหวัง, และ manifest artifact

`Mantis Slack Desktop Smoke` เป็นเวิร์กโฟลว์ Slack VM แรก โดยจะเช็กเอาต์
ref ตัวเลือกที่เชื่อถือได้ใน worktree แยกต่างหาก เช่าเดสก์ท็อป Linux ของ Crabbox,
รัน `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` กับ
ตัวเลือกนั้น เปิด Slack Web ในเบราว์เซอร์ VNC บันทึกเดสก์ท็อป สร้างพรีวิวที่ตัดช่วงเคลื่อนไหวด้วย `crabbox media preview` อัปโหลดไดเรกทอรีอาร์ติแฟกต์เต็ม
และเลือกโพสต์คอมเมนต์หลักฐานแบบอินไลน์บน PR เป้าหมายได้
ค่าเริ่มต้นใช้ AWS สำหรับการเช่าเดสก์ท็อป และเปิดอินพุต provider แบบแมนนวลเพื่อให้
ผู้ปฏิบัติงานสลับไปใช้ Hetzner ได้เมื่อความจุ AWS ช้าหรือไม่พร้อมใช้งาน ใช้
lane นี้เมื่อคุณต้องการ "เดสก์ท็อป Linux ที่มี Slack และ claw กำลังรันอยู่" แทนที่จะเป็น
เพียงทรานสคริปต์ Slack แบบบอตถึงบอต

`Mantis Telegram Live` ครอบ lane Telegram live QA ที่มีอยู่ในไปป์ไลน์หลักฐาน PR
เดียวกัน โดยจะเช็กเอาต์ ref ตัวเลือกที่เชื่อถือได้ใน worktree แยกต่างหาก
รัน `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` เขียน manifest `mantis-evidence.json` จากสรุป Telegram QA
และอาร์ติแฟกต์ข้อความที่สังเกตได้ เรนเดอร์ HTML ทรานสคริปต์ที่ปกปิดข้อมูลแล้วผ่านเบราว์เซอร์เดสก์ท็อป Crabbox สร้าง GIF ที่ตัดช่วงเคลื่อนไหว
ด้วย `crabbox media preview` และโพสต์คอมเมนต์หลักฐาน PR แบบอินไลน์เมื่อมีหมายเลข PR
lane นี้เป็นหลักฐานภาพทรานสคริปต์ ไม่ใช่หลักฐาน Telegram Web ที่ล็อกอินแล้ว:
Telegram Bot API ให้หลักฐานข้อความ live ที่เสถียร แต่
สถานะการล็อกอิน Telegram Web ไม่จำเป็นสำหรับระบบอัตโนมัติ Mantis ปกติ

สำหรับการตั้งค่าเดสก์ท็อป Telegram แบบมีมนุษย์ร่วมในลูป ให้ใช้ตัวสร้างสถานการณ์:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

ตัวสร้างจะเช่าหรือนำเดสก์ท็อป Crabbox กลับมาใช้ซ้ำ ติดตั้งไบนารี Telegram Desktop
สำหรับ Linux แบบ native เลือกกู้คืนอาร์ไคฟ์เซสชันผู้ใช้ได้ กำหนดค่า
OpenClaw ด้วยโทเค็นบอต Telegram SUT ที่เช่าไว้ เริ่ม `openclaw gateway run`
บนพอร์ต `38974` โพสต์ข้อความความพร้อมของบอตไดรเวอร์ไปยังกลุ่มส่วนตัวที่เช่าไว้
จากนั้นจับภาพหน้าจอและ MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้ โทเค็นบอต
ไม่เคยใช้ล็อกอินเข้า Telegram Desktop; ใช้เพื่อกำหนดค่า OpenClaw เท่านั้น เดสก์ท็อป
viewer เป็นเซสชันผู้ใช้ Telegram แยกต่างหากที่กู้คืนจาก
`--telegram-profile-archive-env <name>` หรือสร้างด้วยตนเองผ่าน VNC และคงไว้
ด้วย `--keep-lease`

แฟล็กที่มีประโยชน์ของตัวสร้างเดสก์ท็อป Telegram:

- `--lease-id <cbx_...>` รันซ้ำกับ VM ที่ผู้ปฏิบัติงานล็อกอินเข้า Telegram Desktop ไว้แล้ว
- `--telegram-profile-archive-env <name>` อ่านอาร์ไคฟ์โปรไฟล์ Telegram Desktop แบบ `.tgz` ในรูป base64 จาก env var นั้นและกู้คืนก่อนเปิดใช้งาน
- `--telegram-profile-dir <remote-path>` ควบคุมไดเรกทอรีโปรไฟล์ Telegram Desktop ระยะไกล ค่าเริ่มต้นคือ `$HOME/.local/share/TelegramDesktop`
- `--no-gateway-setup` ติดตั้งและเปิด Telegram Desktop โดยไม่กำหนดค่า OpenClaw
- `--credential-source convex --credential-role ci` ใช้ credential broker ที่ใช้ร่วมกันแทนโทเค็น env ของ Telegram โดยตรง

ทุกสถานการณ์ที่เผยแพร่ไปยัง PR จะเขียน `mantis-evidence.json` ไว้ข้างรายงานของตน
schema นี้เป็นการส่งต่อระหว่างโค้ดสถานการณ์และคอมเมนต์ GitHub:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

ค่า `path` ของอาร์ติแฟกต์เป็นพาธที่สัมพันธ์กับไดเรกทอรี manifest ค่า `targetPath`
เป็นพาธสัมพัทธ์ภายใต้ไดเรกทอรีเผยแพร่ของ branch `qa-artifacts`
publisher จะปฏิเสธ path traversal และข้ามรายการที่ทำเครื่องหมาย
`"required": false` เมื่อพรีวิวหรือวิดีโอแบบไม่บังคับไม่พร้อมใช้งาน

ชนิดอาร์ติแฟกต์ที่รองรับ:

- `timeline`: ภาพหน้าจอสถานการณ์แบบกำหนดได้แน่นอน โดยมักเป็นก่อน/หลัง
- `desktopScreenshot`: ภาพหน้าจอเดสก์ท็อป VNC/เบราว์เซอร์
- `motionPreview`: GIF เคลื่อนไหวแบบอินไลน์ที่สร้างจากการบันทึกเดสก์ท็อป
- `motionClip`: MP4 ที่ตัดช่วงเคลื่อนไหวและลบช่วงนิ่งตอนต้นกับท้ายออก
- `fullVideo`: การบันทึก MP4 เต็มสำหรับการตรวจสอบเชิงลึก
- `metadata`: JSON/log sidecar
- `report`: รายงาน Markdown

publisher ที่ใช้ซ้ำได้คือ `scripts/mantis/publish-pr-evidence.mjs` เวิร์กโฟลว์
เรียกใช้พร้อม manifest, PR เป้าหมาย, root เป้าหมาย `qa-artifacts`, marker คอมเมนต์,
URL อาร์ติแฟกต์ Actions, URL การรัน และแหล่งที่มาคำขอ โดยจะคัดลอกอาร์ติแฟกต์ที่ประกาศไว้
ไปยัง branch `qa-artifacts` สร้างคอมเมนต์ PR แบบสรุปก่อนพร้อมรูปภาพ/พรีวิวอินไลน์
และวิดีโอที่ลิงก์ไว้ จากนั้นอัปเดตคอมเมนต์ marker ที่มีอยู่หรือสร้างคอมเมนต์ใหม่

คุณยังสามารถทริกเกอร์การรัน status-reactions ได้โดยตรงจากคอมเมนต์ PR:

```text
@Mantis discord status reactions
```

ทริกเกอร์คอมเมนต์ตั้งใจให้มีขอบเขตแคบ โดยจะรันเฉพาะบนคอมเมนต์ pull request
จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และจะรู้จักเฉพาะคำขอ
status-reaction ของ Discord เท่านั้น ค่าเริ่มต้นใช้ ref baseline ที่ทราบว่าเสีย
และ SHA ของ head PR ปัจจุบันเป็น candidate maintainer สามารถ override ref ใดก็ได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA ยังสามารถทริกเกอร์จากคอมเมนต์ PR ได้เช่นกัน:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

ค่าเริ่มต้นใช้ SHA ของ head PR ปัจจุบันเป็น candidate และรัน
`telegram-status-command` maintainer สามารถ override `candidate=...`,
`provider=aws|hetzner` และ `lease=<cbx_...>` ได้เมื่อต้องการ ref เฉพาะหรือ
เดสก์ท็อป Crabbox ที่วอร์มไว้ล่วงหน้า

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกระบุชัดเจนและเน้นสถานการณ์ คำสั่งที่สองภายหลังสามารถแมป PR
หรือ issue ไปยังสถานการณ์ Mantis ที่แนะนำจาก label, ไฟล์ที่เปลี่ยน และ
ผลการรีวิวของ ClawSweeper

## วงจรชีวิตการรัน

1. รับ credentials
2. จัดสรรหรือนำ VM กลับมาใช้ซ้ำ
3. เตรียมโปรไฟล์เดสก์ท็อป/เบราว์เซอร์เมื่อสถานการณ์ต้องการหลักฐาน UI
4. เตรียม checkout ที่สะอาดสำหรับ ref baseline
5. ติดตั้ง dependencies และ build เฉพาะสิ่งที่สถานการณ์ต้องใช้
6. เริ่ม OpenClaw Gateway ลูกด้วยไดเรกทอรีสถานะแยก
7. กำหนดค่า transport live, provider, model และโปรไฟล์เบราว์เซอร์
8. รันสถานการณ์และจับหลักฐาน baseline
9. หยุด gateway และเก็บ logs ไว้
10. เตรียม ref candidate ใน VM เดียวกัน
11. รันสถานการณ์เดียวกันและจับหลักฐาน candidate
12. เปรียบเทียบผลลัพธ์ oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, logs, ภาพหน้าจอ และอาร์ติแฟกต์ trace แบบไม่บังคับ
14. อัปโหลดอาร์ติแฟกต์ GitHub Actions
15. โพสต์ข้อความสถานะ PR หรือ Discord แบบกระชับ

สถานการณ์ควรล้มเหลวได้สองแบบที่ต่างกัน:

- **สร้างบั๊กซ้ำได้**: baseline ล้มเหลวในแบบที่คาดไว้
- **ความล้มเหลวของ harness**: การตั้งค่าสภาพแวดล้อม, credentials, Discord API, เบราว์เซอร์ หรือ
  provider ล้มเหลวก่อนที่ bug oracle จะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้เพื่อให้ maintainer ไม่สับสนระหว่างสภาพแวดล้อมที่ไม่นิ่ง
กับพฤติกรรมของผลิตภัณฑ์

## Discord MVP

สถานการณ์แรกควรมุ่งไปที่ status reactions ของ Discord ในช่อง guild ที่
โหมดการส่ง reply จากแหล่งที่มาคือ `message_tool_only`

เหตุผลที่เป็นเมล็ดตั้งต้น Mantis ที่ดี:

- มองเห็นได้ใน Discord เป็น reactions บนข้อความที่ทริกเกอร์
- มี REST oracle ที่แข็งแรงผ่านสถานะ reaction ของข้อความ Discord
- ครอบคลุม OpenClaw Gateway จริง, auth ของบอต Discord, การส่งข้อความ,
  โหมดการส่ง reply จากแหล่งที่มา, สถานะ status reaction และวงจรชีวิต turn ของ model
- แคบพอที่จะทำให้การใช้งานครั้งแรกตรงไปตรงมา

รูปแบบสถานการณ์ที่คาดไว้:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

หลักฐาน baseline ควรแสดง reaction รับทราบแบบ queued แต่ไม่มี
การเปลี่ยนผ่านวงจรชีวิตในโหมด tool-only หลักฐาน candidate ควรแสดง status reactions
ของวงจรชีวิตที่รันเมื่อ `messages.statusReactions.enabled` เป็น
true อย่างชัดเจน

slice แรกที่รันได้คือสถานการณ์ Discord live QA แบบ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

โดยจะกำหนดค่า SUT ด้วยการจัดการ guild แบบเปิดตลอด, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และ status reactions แบบชัดเจน oracle
จะ poll ข้อความ Discord ที่ทริกเกอร์จริงและคาดหวังลำดับที่สังเกตได้
`👀 -> 🤔 -> 👍` อาร์ติแฟกต์ประกอบด้วย `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` และ
`discord-status-reactions-tool-only-timeline.png`

## ชิ้นส่วน QA ที่มีอยู่

Mantis ควรสร้างต่อจากสแต็ก QA ส่วนตัวที่มีอยู่ แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รัน lane Discord แบบ live ที่มีบอต driver และ
  SUT อยู่แล้ว
- runner ของ live transport เขียนรายงานและอาร์ติแฟกต์ข้อความที่สังเกตได้
  ไว้ใต้ `.artifacts/qa-e2e/` อยู่แล้ว
- credential leases ของ Convex ให้สิทธิ์เข้าถึงแบบเอกสิทธิ์ไปยัง
  credentials ของ live transport ที่ใช้ร่วมกันอยู่แล้ว
- บริการควบคุมเบราว์เซอร์รองรับภาพหน้าจอ, snapshots,
  managed profiles แบบ headless และโปรไฟล์ CDP ระยะไกลอยู่แล้ว
- QA Lab มี UI debugger และ bus สำหรับการทดสอบตามรูปแบบ transport อยู่แล้ว

การใช้งาน Mantis แรกสามารถเป็น runner แบบก่อน/หลังบาง ๆ บนชิ้นส่วนเหล่านี้
พร้อมชั้นหลักฐานภาพหนึ่งชั้น

## โมเดลหลักฐาน

ทุกการรันจะเขียนไดเรกทอรีอาร์ติแฟกต์ที่เสถียร:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` ควรเป็นแหล่งข้อมูลจริงแบบ machine-readable
รายงาน Markdown ใช้สำหรับคอมเมนต์ PR และการรีวิวโดยมนุษย์

สรุปต้องมี:

- refs และ SHAs ที่ทดสอบ
- transport และ scenario id
- provider ของเครื่องและ machine id หรือ lease id
- แหล่งที่มา credential โดยไม่มีค่าลับ
- ผลลัพธ์ baseline
- ผลลัพธ์ candidate
- บั๊กถูกสร้างซ้ำบน baseline หรือไม่
- candidate แก้ไขแล้วหรือไม่
- พาธอาร์ติแฟกต์
- ปัญหาการตั้งค่าหรือ cleanup ที่ทำให้ปลอดภัยแล้ว

ภาพหน้าจอเป็นหลักฐาน ไม่ใช่ความลับ แต่ยังต้องมีวินัยในการปกปิดข้อมูล:
ชื่อช่องส่วนตัว ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏได้ สำหรับ PR สาธารณะ
ให้ใช้ลิงก์อาร์ติแฟกต์ GitHub Actions แทนรูปภาพอินไลน์จนกว่าเรื่องการปกปิดข้อมูล
จะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

lane เบราว์เซอร์มีสองโหมด:

- **ระบบอัตโนมัติแบบ headless**: ค่าเริ่มต้นสำหรับ CI Chrome รันโดยเปิด CDP และ
  Playwright หรือการควบคุมเบราว์เซอร์ของ OpenClaw จะจับภาพหน้าจอ
- **VNC rescue**: เปิดใช้งานบน VM เดียวกันเมื่อการล็อกอิน, MFA, การต่อต้านระบบอัตโนมัติของ Discord
  หรือการดีบักภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ observer ของ Discord ควรคงอยู่พอที่จะหลีกเลี่ยง
การล็อกอินทุกครั้งที่รัน แต่แยกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์
เป็นของ machine pool ของ Mantis ไม่ใช่แล็ปท็อปของนักพัฒนา

เมื่อ Mantis ติดขัด จะโพสต์ข้อความสถานะ Discord พร้อม:

- รหัสการรัน
- รหัสสถานการณ์
- ผู้ให้บริการเครื่อง
- ไดเรกทอรีอาร์ติแฟกต์
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความสั้นของตัวบล็อก

การปรับใช้แบบส่วนตัวครั้งแรกสามารถโพสต์ข้อความเหล่านี้ไปยังช่องผู้ปฏิบัติงานที่มีอยู่
และย้ายไปยังช่อง Mantis เฉพาะในภายหลังได้

## เครื่อง

Mantis ควรเลือกใช้ AWS ผ่าน Crabbox สำหรับการใช้งานระยะไกลครั้งแรก
Crabbox ให้เครื่องที่อุ่นไว้แล้ว การติดตามสัญญาเช่า การเติมสภาพแวดล้อม บันทึก ผลลัพธ์ และ
การล้างข้อมูล หากความจุของ AWS ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่มผู้ให้บริการ Hetzner
ไว้ด้านหลังอินเทอร์เฟซเครื่องเดียวกัน

ข้อกำหนดขั้นต่ำของ VM:

- Linux ที่ติดตั้ง Chrome หรือ Chromium ซึ่งรองรับเดสก์ท็อป
- การเข้าถึง CDP สำหรับการทำงานอัตโนมัติของเบราว์เซอร์
- VNC หรือ noVNC สำหรับการกู้คืน
- Node 22 และ pnpm
- เช็กเอาต์ OpenClaw และแคชการพึ่งพา
- แคชเบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และหน่วยความจำเพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว เบราว์เซอร์หนึ่งตัว และการรันโมเดลหนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, ผู้ให้บริการโมเดล และโบรกเกอร์ข้อมูลลับ

VM ไม่ควรเก็บข้อมูลลับดิบที่มีอายุยาวไว้นอกแหล่งจัดเก็บข้อมูลลับหรือ
โปรไฟล์เบราว์เซอร์ที่คาดไว้

## ข้อมูลลับ

ข้อมูลลับอยู่ในข้อมูลลับระดับองค์กรหรือคลังของ GitHub สำหรับการรันระยะไกล และอยู่ใน
ไฟล์ข้อมูลลับที่ผู้ปฏิบัติงานควบคุมในเครื่องสำหรับการรันภายในเครื่อง

ชื่อข้อมูลลับที่แนะนำ:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลดอาร์ติแฟกต์ GitHub แบบสาธารณะ
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

ระยะยาว พูลข้อมูลลับ Convex ควรยังเป็นแหล่งปกติสำหรับข้อมูลลับของทรานสปอร์ตแบบสด
ข้อมูลลับ GitHub ใช้บูตสแตรปโบรกเกอร์และเลนสำรอง
เวิร์กโฟลว์รีแอกชันสถานะ Discord แมปข้อมูลลับ Mantis Crabbox กลับไปยัง
ตัวแปรสภาพแวดล้อม `CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN`
ที่ Crabbox CLI คาดไว้ ชื่อข้อมูลลับ GitHub แบบ `CRABBOX_*` ธรรมดายังคง
ยอมรับเป็นทางเลือกสำรองเพื่อความเข้ากันได้

ตัวรัน Mantis ต้องไม่พิมพ์:

- โทเค็นบอต Discord
- คีย์ API ของผู้ให้บริการ
- คุกกี้เบราว์เซอร์
- เนื้อหาโปรไฟล์การยืนยันตัวตน
- รหัสผ่าน VNC
- เพย์โหลดข้อมูลลับดิบ

การอัปโหลดอาร์ติแฟกต์สาธารณะควรปกปิดเมตาดาต้าเป้าหมาย Discord เช่น บอต
กิลด์ ช่อง และรหัสข้อความด้วย เวิร์กโฟลว์ smoke ของ GitHub เปิดใช้
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หากมีการวางโทเค็นลงใน issue, PR, แชต หรือบันทึกโดยไม่ตั้งใจ ให้หมุนเวียนโทเค็นนั้น
หลังจากจัดเก็บข้อมูลลับใหม่แล้ว

## อาร์ติแฟกต์ GitHub และความคิดเห็น PR

เวิร์กโฟลว์ Mantis ควรอัปโหลดชุดหลักฐานเต็มเป็นอาร์ติแฟกต์ Actions
อายุสั้น เมื่อรันเวิร์กโฟลว์สำหรับรายงานบั๊กหรือ PR แก้ไข เวิร์กโฟลว์ควร
เผยแพร่ภาพหน้าจอ PNG ที่ปกปิดแล้วไปยังสาขา `qa-artifacts` และอัปเซิร์ต
ความคิดเห็นในบั๊กหรือ PR แก้ไขนั้นพร้อมภาพหน้าจอแบบอินไลน์ก่อน/หลัง อย่าโพสต์
หลักฐานหลักไว้เฉพาะบน PR ระบบอัตโนมัติ QA ทั่วไป บันทึกดิบ ข้อความที่สังเกตได้
และหลักฐานขนาดใหญ่อื่น ๆ ให้อยู่ในอาร์ติแฟกต์ Actions

เวิร์กโฟลว์โปรดักชันควรโพสต์ความคิดเห็นเหล่านั้นด้วย Mantis GitHub App ไม่ใช่
ด้วย `github-actions[bot]` ให้เก็บรหัสแอปและคีย์ส่วนตัวเป็นข้อมูลลับ GitHub Actions
ชื่อ `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY`
เวิร์กโฟลว์ใช้มาร์กเกอร์ที่ซ่อนอยู่เป็นคีย์อัปเซิร์ต อัปเดตความคิดเห็นนั้น
เมื่อโทเค็นสามารถแก้ไขได้ และสร้างความคิดเห็นใหม่ที่ Mantis เป็นเจ้าของเมื่อ
มาร์กเกอร์เก่าที่บอตเป็นเจ้าของไม่สามารถแก้ไขได้

ความคิดเห็น PR ควรสั้นและเน้นภาพ:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

เมื่อการรันล้มเหลวเพราะฮาร์เนสล้มเหลว ความคิดเห็นต้องระบุเช่นนั้น
แทนที่จะสื่อว่าผู้สมัครล้มเหลว

## หมายเหตุการปรับใช้แบบส่วนตัว

การปรับใช้แบบส่วนตัวอาจมีแอปพลิเคชัน Mantis Discord อยู่แล้ว ให้นำ
แอปพลิเคชันนั้นกลับมาใช้แทนการสร้างแอปอื่น เมื่อแอปมีสิทธิ์บอตที่เหมาะสม
และสามารถหมุนเวียนได้อย่างปลอดภัย

ตั้งค่าช่องแจ้งเตือนผู้ปฏิบัติงานครั้งแรกผ่านข้อมูลลับหรือการกำหนดค่าการปรับใช้
ช่องนี้สามารถชี้ไปยังช่องผู้ดูแลหรือช่องปฏิบัติการที่มีอยู่ก่อน แล้วจึงย้ายไปยัง
ช่อง Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่รหัสกิลด์ รหัสช่อง โทเค็นบอต คุกกี้เบราว์เซอร์ หรือรหัสผ่าน VNC
ไว้ในเอกสารนี้ ให้เก็บไว้ในข้อมูลลับ GitHub, โบรกเกอร์ข้อมูลลับ หรือ
แหล่งจัดเก็บข้อมูลลับภายในเครื่องของผู้ปฏิบัติงาน

## การเพิ่มสถานการณ์

สถานการณ์ Mantis ควรประกาศ:

- รหัสและชื่อเรื่อง
- ทรานสปอร์ต
- ข้อมูลลับที่จำเป็น
- นโยบาย ref ของ baseline
- นโยบาย ref ของผู้สมัคร
- แพตช์การกำหนดค่า OpenClaw
- ขั้นตอนการตั้งค่า
- สิ่งกระตุ้น
- ออราเคิล baseline ที่คาดไว้
- ออราเคิลผู้สมัครที่คาดไว้
- เป้าหมายการจับภาพ
- งบประมาณเวลาหมด
- ขั้นตอนการล้างข้อมูล

สถานการณ์ควรเลือกใช้ออราเคิลขนาดเล็กที่มีชนิดข้อมูล:

- สถานะรีแอกชัน Discord สำหรับบั๊กรีแอกชัน
- การอ้างอิงข้อความ Discord สำหรับบั๊กเธรด
- ts ของเธรด Slack และสถานะ API รีแอกชันสำหรับบั๊ก Slack
- รหัสข้อความอีเมลและส่วนหัวสำหรับบั๊กอีเมล
- ภาพหน้าจอเบราว์เซอร์เมื่อ UI เป็นสิ่งที่สังเกตได้อย่างน่าเชื่อถือเพียงอย่างเดียว

การตรวจด้วยวิชันควรเป็นแบบเสริม หาก API ของแพลตฟอร์มสามารถพิสูจน์บั๊กได้ ให้ใช้
API เป็นออราเคิลผ่าน/ไม่ผ่าน และเก็บภาพหน้าจอไว้เพื่อความมั่นใจของมนุษย์

## การขยายผู้ให้บริการ

หลังจาก Discord ตัวรันเดียวกันสามารถเพิ่ม:

- Slack: รีแอกชัน เธรด การกล่าวถึงแอป โมดัล การอัปโหลดไฟล์
- อีเมล: การยืนยันตัวตน Gmail และการจัดเธรดข้อความโดยใช้ `gog` เมื่อคอนเนกเตอร์
  ไม่เพียงพอ
- WhatsApp: การเข้าสู่ระบบด้วย QR การระบุตัวตนซ้ำ การส่งข้อความ สื่อ รีแอกชัน
- Telegram: การกั้นด้วยการกล่าวถึงกลุ่ม คำสั่ง รีแอกชันเมื่อพร้อมใช้งาน
- Matrix: ห้องที่เข้ารหัส ความสัมพันธ์ของเธรดหรือการตอบกลับ การกลับมาทำงานต่อหลังรีสตาร์ต

แต่ละทรานสปอร์ตควรมีสถานการณ์ smoke ราคาถูกหนึ่งรายการ และสถานการณ์ระดับชนิดบั๊กอย่างน้อยหนึ่งรายการ
สถานการณ์ที่ใช้ภาพและมีค่าใช้จ่ายสูงควรเป็นแบบเลือกเปิดใช้เท่านั้น

## คำถามที่เปิดอยู่

- บอต Discord ใดควรเป็นไดรเวอร์ และบอตใดควรเป็น SUT เมื่อมีการนำ
  บอต Mantis ที่มีอยู่กลับมาใช้?
- การเข้าสู่ระบบเบราว์เซอร์ของผู้สังเกตการณ์ควรใช้บัญชี Discord ของมนุษย์ บัญชีทดสอบ
  หรือใช้เฉพาะหลักฐาน REST ที่บอตอ่านได้สำหรับเฟสแรก?
- GitHub ควรเก็บอาร์ติแฟกต์ Mantis สำหรับ PR ไว้นานเท่าใด?
- เมื่อใด ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติแทนที่จะรอ
  คำสั่งจากผู้ดูแล?
- ควรปกปิดหรือตัดภาพหน้าจอก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่?
