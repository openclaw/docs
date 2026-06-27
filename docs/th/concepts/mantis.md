---
read_when:
    - การสร้างหรือเรียกใช้ QA แบบภาพสดสำหรับบั๊กของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับ pull request
    - การเพิ่มสถานการณ์การขนส่งแบบสดสำหรับ Discord, Slack, WhatsApp หรือบริการอื่นๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ ระบบอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบยืนยันแบบครบวงจรเชิงภาพสำหรับจำลองบั๊กของ OpenClaw บนทรานสปอร์ตที่ใช้งานจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์เข้ากับ PRs.
title: Mantis
x-i18n:
    generated_at: "2026-06-27T17:27:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis คือระบบตรวจสอบแบบครบวงจรของ OpenClaw สำหรับบั๊กที่ต้องใช้
รันไทม์จริง ทรานสปอร์ตจริง และหลักฐานที่มองเห็นได้ ระบบจะรันสถานการณ์กับ ref ที่ทราบว่า
เสีย จับหลักฐาน รันสถานการณ์เดียวกันกับ ref ผู้สมัคร แล้ว
เผยแพร่การเปรียบเทียบเป็นอาร์ติแฟกต์ที่ผู้ดูแลสามารถตรวจสอบได้จาก PR หรือ
จากคำสั่งในเครื่อง

Mantis เริ่มจาก Discord เพราะ Discord ให้เลนแรกที่มีมูลค่าสูงแก่เรา:
การยืนยันตัวตนบอตจริง ช่องกิลด์จริง รีแอ็กชัน เธรด คำสั่งเนทีฟ และ
UI เบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่าทรานสปอร์ตแสดงอะไร

## เป้าหมาย

- จำลองบั๊กจาก GitHub issue หรือ PR ด้วยรูปทรานสปอร์ตเดียวกับที่ผู้ใช้
  เห็น
- จับอาร์ติแฟกต์ **ก่อน** บน ref ฐานก่อนใช้การแก้ไข
- จับอาร์ติแฟกต์ **หลัง** บน ref ผู้สมัครหลังใช้การแก้ไข
- ใช้ตัวตัดสินแบบกำหนดแน่นอนเมื่อเป็นไปได้ เช่น การอ่านรีแอ็กชันผ่าน Discord REST
  หรือการตรวจทรานสคริปต์ของช่อง
- จับภาพหน้าจอเมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันในเครื่องจาก CLI ที่เอเจนต์ควบคุม และรันระยะไกลจาก GitHub
- เก็บสถานะเครื่องให้เพียงพอสำหรับกู้ผ่าน VNC เมื่อการล็อกอิน ระบบอัตโนมัติของเบราว์เซอร์ หรือ
  การยืนยันตัวตนผู้ให้บริการติดขัด
- โพสต์สถานะอย่างกระชับไปยังช่อง Discord ของโอเปอเรเตอร์เมื่อการรันถูกบล็อก
  ต้องการความช่วยเหลือ VNC แบบแมนนวล หรือเสร็จสิ้น

## สิ่งที่ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit tests โดยปกติการรัน Mantis ควรถูกแปลงเป็น
  regression test ที่เล็กกว่าหลังจากเข้าใจการแก้ไขแล้ว
- Mantis ไม่ใช่เกต CI เร็วตามปกติ มันช้ากว่า ใช้ข้อมูลรับรองสด และ
  สงวนไว้สำหรับบั๊กที่สภาพแวดล้อมจริงมีความสำคัญ
- Mantis ไม่ควรต้องใช้มนุษย์สำหรับการทำงานปกติ VNC แบบแมนนวลเป็นเส้นทางกู้คืน
  ไม่ใช่เส้นทางปกติที่คาดหวัง
- Mantis ไม่เก็บความลับดิบในอาร์ติแฟกต์ ล็อก ภาพหน้าจอ รายงาน Markdown
  หรือคอมเมนต์ PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแตก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของรันไทม์สถานการณ์ อะแดปเตอร์ทรานสปอร์ต สคีมาหลักฐาน และ
  CLI ในเครื่องภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของชิ้นส่วน harness ทรานสปอร์ตสด ตัวช่วยจับภาพเบราว์เซอร์ และ
  ตัวเขียนอาร์ติแฟกต์
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นไว้เมื่อจำเป็นต้องใช้ VM ระยะไกล
- GitHub Actions เป็นเจ้าของ entrypoint ของเวิร์กโฟลว์ระยะไกลและการเก็บรักษาอาร์ติแฟกต์
- ClawSweeper เป็นเจ้าของการกำหนดเส้นทางคอมเมนต์ GitHub: การแยกวิเคราะห์คำสั่งผู้ดูแล
  การ dispatch เวิร์กโฟลว์ และการโพสต์คอมเมนต์ PR สุดท้าย
- เอเจนต์ OpenClaw ขับเคลื่อน Mantis ผ่าน Codex เมื่อสถานการณ์ต้องการการตั้งค่าแบบเอเจนต์
  การดีบัก หรือการรายงานสถานะติดขัด

ขอบเขตนี้เก็บความรู้เรื่องทรานสปอร์ตไว้ใน OpenClaw การจัดตารางเครื่องไว้ใน
Crabbox และกาวเชื่อมเวิร์กโฟลว์ผู้ดูแลไว้ใน ClawSweeper

## รูปคำสั่ง

คำสั่งในเครื่องแรกตรวจสอบบอต Discord, กิลด์, ช่อง, การส่งข้อความ,
การส่งรีแอ็กชัน และพาธอาร์ติแฟกต์:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ตัวรันก่อนและหลังในเครื่องยอมรับรูปนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ตัวรันสร้าง worktree ฐานและผู้สมัครแบบ detached ภายใต้ไดเรกทอรีเอาต์พุต
ติดตั้ง dependencies สร้างแต่ละ ref รันสถานการณ์พร้อม
`--allow-failures` จากนั้นเขียน `baseline/`, `candidate/`, `comparison.json`,
และ `mantis-report.md` สำหรับสถานการณ์ Discord แรก การตรวจสอบที่สำเร็จ
หมายความว่าสถานะฐานคือ `fail` และสถานะผู้สมัครคือ `pass`

โพรบก่อน/หลัง Discord ตัวที่สองเจาะจงไฟล์แนบของเธรด:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

สถานการณ์นั้นโพสต์ข้อความแม่ด้วยบอตไดรเวอร์ สร้างเธรด Discord จริง
เรียกแอ็กชัน `message.thread-reply` ของ OpenClaw ด้วย `filePath` ที่อยู่ใน repo
จากนั้น poll เธรดเพื่อหาการตอบกลับของ SUT และชื่อไฟล์แนบ ภาพหน้าจอฐาน
แสดงการตอบกลับที่ไม่มีไฟล์แนบ ภาพหน้าจอผู้สมัคร
แสดงไฟล์แนบ `mantis-thread-report.md` ที่คาดไว้

primitive VM/เบราว์เซอร์แรกคือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

มันเช่าหรือใช้เครื่องเดสก์ท็อป Crabbox ซ้ำ เริ่มเบราว์เซอร์ที่มองเห็นได้ภายใน
เซสชัน VNC จับภาพเดสก์ท็อป ดึงอาร์ติแฟกต์กลับมายังไดเรกทอรีเอาต์พุตในเครื่อง
และเขียนคำสั่ง reconnect ลงในรายงาน คำสั่งมีค่าเริ่มต้นเป็น
ผู้ให้บริการ Hetzner เพราะเป็นผู้ให้บริการรายแรกที่มี coverage เดสก์ท็อป/VNC
ที่ใช้งานได้ในเลน Mantis แทนที่ได้ด้วย `--provider`, `--crabbox-bin`, หรือ
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อรันกับ fleet Crabbox อื่น

แฟล็ก desktop smoke ที่มีประโยชน์:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ใช้เดสก์ท็อปที่อุ่นไว้ซ้ำ
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดในเบราว์เซอร์ที่มองเห็นได้
- `--html-file <path>` เรนเดอร์อาร์ติแฟกต์ HTML ที่อยู่ใน repo ในเบราว์เซอร์ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อจับไทม์ไลน์รีแอ็กชันสถานะ Discord ที่สร้างขึ้นผ่านเดสก์ท็อป Crabbox จริง
- `--browser-profile-dir <remote-path>` ใช้ Chrome user-data-dir ระยะไกลซ้ำ เพื่อให้เดสก์ท็อป Mantis แบบถาวรยังล็อกอินอยู่ระหว่างการรัน ใช้สิ่งนี้สำหรับโปรไฟล์ตัวดู Discord Web ที่ใช้งานระยะยาว
- `--browser-profile-archive-env <name>` กู้คืน archive Chrome user-data-dir แบบ `.tgz` ใน base64 จากตัวแปรสภาพแวดล้อมที่ระบุก่อนเปิดเบราว์เซอร์ ใช้สิ่งนี้สำหรับพยานที่ล็อกอินไว้ เช่น Discord Web ตัวแปร env เริ่มต้นคือ `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`
- `--video-duration <seconds>` ควบคุมความยาวการจับภาพ MP4 ใช้ระยะเวลาที่ยาวขึ้นสำหรับเว็บแอปที่ล็อกอินแล้วซึ่งช้าและต้องการเวลาให้เสถียร
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` เปิด lease ที่สร้างใหม่และผ่านไว้ต่อเพื่อการตรวจสอบผ่าน VNC การรันที่ล้มเหลวจะเก็บ lease ไว้โดยค่าเริ่มต้นเมื่อมีการสร้างไว้ เพื่อให้โอเปอเรเตอร์ reconnect ได้
- `--class`, `--idle-timeout`, และ `--ttl` ปรับขนาดเครื่องและอายุ lease

สำหรับหลักฐาน Discord Web, Mantis ใช้บัญชีตัวดูเฉพาะแทน
โทเคนบอต สถานการณ์ Discord API สดยังคงเป็นตัวตัดสิน: มันสร้าง
เธรดจริง ส่ง `thread-reply` ของ SUT และตรวจไฟล์แนบผ่าน Discord
REST เมื่อกำหนด `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` สถานการณ์จะ
เขียนอาร์ติแฟกต์ URL Discord Web ด้วย เมื่อกำหนด `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
มันจะปล่อยให้เธรดนั้นพร้อมใช้นานพอให้เบราว์เซอร์ที่ล็อกอินไว้เปิด
และบันทึกได้

เวิร์กโฟลว์ GitHub เปิด URL เธรดผู้สมัครใน Discord Web จับ
ภาพหน้าจอ บันทึก MP4 และสร้างตัวอย่าง GIF ที่ตัดเฉพาะช่วงเคลื่อนไหวเมื่อมีเครื่องมือสื่อของ Crabbox
พร้อมใช้งาน ควรใช้พาธโปรไฟล์ตัวดูแบบถาวรที่กำหนดค่าผ่าน
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` เพราะ archive โปรไฟล์ Chrome เต็ม
อาจมีขนาดเกินขีดจำกัดขนาด secret ของ GitHub สำหรับโปรไฟล์ขนาดเล็ก/บูตสแตรป
เวิร์กโฟลว์ยังสามารถกู้คืน archive `.tgz` ใน base64 จาก
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ได้ หากไม่ได้กำหนดค่าแหล่งโปรไฟล์ใดเลย
เวิร์กโฟลว์ยังคงเผยแพร่ภาพหน้าจอไฟล์แนบฐาน/ผู้สมัครแบบกำหนดแน่นอน
และบันทึก notice ว่าข้ามพยาน Discord Web ที่ล็อกอินไว้

primitive ทรานสปอร์ตเดสก์ท็อปแบบเต็มตัวแรกคือ Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

มันเช่าหรือใช้เครื่องเดสก์ท็อป Crabbox ซ้ำ ซิงก์ checkout ปัจจุบันเข้าไปใน
VM รัน `pnpm openclaw qa slack` ภายใน VM นั้น เปิด Slack Web ในเบราว์เซอร์
VNC จับภาพเดสก์ท็อปที่มองเห็นได้ และคัดลอกทั้งอาร์ติแฟกต์ Slack QA และ
ภาพหน้าจอ VNC กลับมายังไดเรกทอรีเอาต์พุตในเครื่อง นี่คือรูปแบบ Mantis แรก
ที่ Gateway OpenClaw ของ SUT และเบราว์เซอร์อยู่ภายใน VM เดสก์ท็อป Linux
เดียวกัน

ด้วย `--gateway-setup` คำสั่งจะเตรียม OpenClaw home แบบใช้แล้วทิ้งที่ถาวร
ที่ `$HOME/.openclaw-mantis/slack-openclaw` แพตช์การกำหนดค่า Slack Socket Mode
สำหรับช่องที่เลือก เริ่ม `openclaw gateway run` บนพอร์ต
`38973` และคง Chrome ให้รันอยู่ในเซสชัน VNC นี่คือโหมด "ทิ้งเดสก์ท็อป
Linux ที่มี Slack และ claw รันอยู่ไว้ให้ฉัน"; เลน Slack QA แบบบอตถึงบอต
ยังคงเป็นค่าเริ่มต้นเมื่อไม่ระบุ `--gateway-setup`

อินพุตที่จำเป็นสำหรับ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับเลนโมเดลระยะไกล หากมีเพียง
  `OPENAI_API_KEY` ที่ตั้งค่าไว้ในเครื่อง Mantis จะ map ไปยัง `OPENCLAW_LIVE_OPENAI_KEY`
  ก่อนเรียก Crabbox เพื่อให้การ forward env `OPENCLAW_*` ของ Crabbox ส่งต่อมัน
  เข้าไปใน VM ได้

ด้วย `--gateway-setup --credential-source convex` Mantis จะเช่าข้อมูลรับรอง Slack SUT
จากพูลที่ใช้ร่วมกันก่อนสร้าง VM และ forward channel id ที่เช่า
โทเคนแอป Socket Mode และโทเคนบอตเป็น env รันไทม์ `OPENCLAW_MANTIS_SLACK_*`
ภายในเดสก์ท็อป สิ่งนี้ทำให้เวิร์กโฟลว์ GitHub บางลง: ต้องการเพียง
secret ของ broker Convex ไม่ใช่โทเคนบอตหรือแอป Slack ดิบ

แฟล็ก Slack desktop ที่มีประโยชน์:

- `--lease-id <cbx_...>` รันซ้ำกับเครื่องที่โอเปอเรเตอร์ล็อกอิน Slack Web ผ่าน VNC ไว้แล้ว
- `--gateway-setup` เริ่ม Gateway Slack ของ OpenClaw แบบถาวรใน VM แทนที่จะรันเฉพาะเลน QA แบบบอตถึงบอต
- `--keep-lease` คง VM Gateway ให้เปิดอยู่เพื่อการตรวจสอบผ่าน VNC หลังสำเร็จ; `--no-keep-lease` หยุด VM หลังเก็บอาร์ติแฟกต์
- `--slack-url <url>` เปิด URL Slack Web ที่เจาะจง หากไม่มี Mantis จะ derive `https://app.slack.com/client/<team>/<channel>` จาก Slack `auth.test` เมื่อมีโทเคนบอต SUT
- `--slack-channel-id <id>` ควบคุม allowlist ช่อง Slack ที่ใช้โดยการตั้งค่า Gateway
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุมโปรไฟล์ Chrome ถาวรภายใน VM ค่าเริ่มต้นคือ `$HOME/.config/openclaw-mantis/slack-chrome-profile` ดังนั้นการล็อกอิน Slack Web แบบแมนนวลจะยังอยู่ข้ามการรันซ้ำบน lease เดียวกัน
- `--credential-source convex --credential-role ci` ใช้พูลข้อมูลรับรองที่ใช้ร่วมกันแทนโทเคน env Slack โดยตรง
- `--provider-mode`, `--model`, `--alt-model`, และ `--fast` ส่งผ่านไปยังเลนสด Slack

การรัน approval checkpoint จะเรนเดอร์ snapshot ข้อความ Slack API เป็น PNG checkpoint
สำหรับหลักฐานภาพที่ปลอดภัยต่อ CI `slack-desktop-smoke.png` เป็นเพียงหลักฐานของ Slack Web
เมื่อ lease ใช้โปรไฟล์เบราว์เซอร์อุ่นที่ล็อกอินไว้แล้ว

เวิร์กโฟลว์ smoke ของ GitHub คือ `Mantis Discord Smoke` เวิร์กโฟลว์ GitHub ก่อนและหลัง
สำหรับสถานการณ์จริงแรกคือ `Mantis Discord Status Reactions` มันยอมรับ:

- `baseline_ref`: ref ที่คาดว่าจะจำลองพฤติกรรม queued-only
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

มัน checkout ref ของ workflow harness สร้าง worktree ฐานและผู้สมัครแยกกัน
รัน `discord-status-reactions-tool-only` กับแต่ละ worktree และ
อัปโหลด `baseline/`, `candidate/`, `comparison.json`, และ `mantis-report.md` เป็น
อาร์ติแฟกต์ Actions มันยังเรนเดอร์ HTML ไทม์ไลน์ของแต่ละเลนในเบราว์เซอร์เดสก์ท็อป
Crabbox และเผยแพร่ภาพหน้าจอ VNC เหล่านั้นข้าง PNG ไทม์ไลน์แบบกำหนดแน่นอน
ในคอมเมนต์ PR คอมเมนต์ PR เดียวกันฝังตัวอย่าง GIF ขนาดเบาที่ตัดเฉพาะช่วงเคลื่อนไหว
ซึ่งสร้างโดย `crabbox media preview` ลิงก์ไปยังคลิป MP4 ที่ตัดเฉพาะช่วงเคลื่อนไหวที่ตรงกัน
และเก็บไฟล์ MP4 เดสก์ท็อปเต็มไว้สำหรับการตรวจสอบเชิงลึก ภาพหน้าจอคงอยู่แบบ inline
เพื่อการรีวิวอย่างรวดเร็ว เวิร์กโฟลว์สร้าง Crabbox CLI จาก
`openclaw/crabbox` main เพื่อให้ใช้แฟล็ก lease เดสก์ท็อป/เบราว์เซอร์ปัจจุบันได้
ก่อนที่จะตัด release ไบนารี Crabbox ถัดไป

`Mantis Scenario` คือ entrypoint แบบแมนวลทั่วไป โดยรับ `scenario_id`,
`candidate_ref`, `baseline_ref` ที่ไม่บังคับ และ `pr_number` ที่ไม่บังคับ จากนั้น
ส่งต่อไปยัง workflow ที่ scenario เป็นเจ้าของ wrapper นี้ตั้งใจให้บาง:
scenario workflows ยังคงเป็นเจ้าของการตั้งค่า transport, credentials, คลาส VM,
oracle ที่คาดหวัง และ artifact manifest ของตนเอง

`Mantis Slack Desktop Smoke` คือ workflow VM ของ Slack ตัวแรก โดย checkout ref
candidate ที่เชื่อถือได้ใน worktree แยกต่างหาก, lease เดสก์ท็อป Linux ของ Crabbox,
รัน `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` กับ
candidate นั้น, เปิด Slack Web ในเบราว์เซอร์ VNC, บันทึกเดสก์ท็อป, สร้าง preview
ที่ตัดเฉพาะช่วงมีการเคลื่อนไหวด้วย `crabbox media preview`, อัปโหลดไดเรกทอรี
artifact ทั้งหมด และเลือกโพสต์คอมเมนต์หลักฐานแบบ inline บน PR เป้าหมายได้
ค่าเริ่มต้นใช้ AWS สำหรับ desktop lease และมี input ผู้ให้บริการแบบแมนวลเพื่อให้
operators สลับไป Hetzner ได้เมื่อ capacity ของ AWS ช้าหรือไม่พร้อมใช้งาน ใช้
lane นี้เมื่อคุณต้องการ "เดสก์ท็อป Linux ที่มี Slack และ claw กำลังทำงาน" แทนที่จะมี
เพียง transcript Slack ระหว่างบอตกับบอต

`Mantis Telegram Live` ห่อ lane QA สดของ Telegram ที่มีอยู่เข้าใน pipeline
หลักฐาน PR เดียวกัน โดย checkout ref candidate ที่เชื่อถือได้ใน worktree แยกต่างหาก,
รัน `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, เขียน manifest `mantis-evidence.json` จากสรุป QA ของ
Telegram, `qa-evidence.json`, และ report artifacts, render HTML หลักฐานที่ redact
แล้วผ่านเบราว์เซอร์เดสก์ท็อปของ Crabbox, สร้าง GIF ที่ตัดเฉพาะช่วงมีการเคลื่อนไหวด้วย
`crabbox media preview`, และโพสต์คอมเมนต์หลักฐาน PR แบบ inline เมื่อมีหมายเลข PR
lane นี้เป็นภาพหลักฐานจาก QA ไม่ใช่ proof ของ Telegram Web ที่ล็อกอินอยู่:
Telegram Bot API ให้หลักฐานข้อความสดที่เสถียร แต่สถานะล็อกอินของ Telegram Web
ไม่จำเป็นสำหรับ automation ปกติของ Mantis

`Mantis Telegram Desktop Proof` คือ wrapper agentic native Telegram Desktop
แบบ before/after maintainer สามารถ trigger จากคอมเมนต์ PR ด้วย
`@openclaw-mantis telegram desktop proof`, จาก Actions UI ด้วยคำสั่ง freeform,
หรือผ่าน dispatcher ทั่วไป `Mantis Scenario` workflow จะส่ง PR, baseline ref,
candidate ref และคำสั่งของ maintainer ให้ Codex agent อ่าน PR, ตัดสินว่า
พฤติกรรมที่มองเห็นได้ใน Telegram แบบใดพิสูจน์การเปลี่ยนแปลง, รัน lane proof
Crabbox Telegram Desktop แบบผู้ใช้จริงสำหรับ baseline และ candidate, iterate
จนกว่า native GIFs จะใช้งานได้ดี, เขียน artifacts `motionPreview` แบบจับคู่ลงใน
`mantis-evidence.json`, อัปโหลด bundle และโพสต์ตารางหลักฐาน PR แบบ 2 คอลัมน์
เมื่อมีหมายเลข PR

สำหรับการตั้งค่า Telegram desktop แบบ human-in-the-loop ให้ใช้ scenario builder:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

builder จะ lease หรือ reuse เดสก์ท็อป Crabbox, ติดตั้ง binary Telegram Desktop
native สำหรับ Linux, เลือก restore archive ของ user-session ได้, ตั้งค่า
OpenClaw ด้วย token ของบอต Telegram SUT ที่ lease มา, เริ่ม `openclaw gateway run`
บนพอร์ต `38974`, โพสต์ข้อความความพร้อมของ driver-bot ไปยังกลุ่ม private ที่ lease,
จากนั้นจับ screenshot และ MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้ token ของบอตจะไม่
ล็อกอินเข้า Telegram Desktop เลย; ใช้สำหรับตั้งค่า OpenClaw เท่านั้น desktop viewer
เป็น session ผู้ใช้ Telegram แยกต่างหากที่ restore จาก
`--telegram-profile-archive-env <name>` หรือสร้างด้วยตนเองผ่าน VNC และคงไว้ด้วย
`--keep-lease`

flags ที่มีประโยชน์ของ Telegram desktop builder:

- `--lease-id <cbx_...>` รันซ้ำกับ VM ที่ operator ได้ล็อกอินเข้า Telegram Desktop ไว้แล้ว
- `--telegram-profile-archive-env <name>` อ่าน archive โปรไฟล์ Telegram Desktop แบบ base64 `.tgz` จาก env var นั้นและ restore ก่อน launch
- `--telegram-profile-dir <remote-path>` ควบคุมไดเรกทอรีโปรไฟล์ Telegram Desktop ระยะไกล ค่าเริ่มต้นคือ `$HOME/.local/share/TelegramDesktop`
- `--no-gateway-setup` ติดตั้งและเปิด Telegram Desktop โดยไม่ตั้งค่า OpenClaw
- `--credential-source convex --credential-role ci` ใช้ broker credentials ที่แชร์ร่วมกันแทน token env ของ Telegram โดยตรง

ทุก scenario ที่ publish ไปยัง PR จะเขียน `mantis-evidence.json` ไว้ข้าง report
schema นี้คือ handoff ระหว่างโค้ด scenario กับคอมเมนต์ GitHub:

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

ค่า `path` ของ artifact เป็น path ที่สัมพันธ์กับไดเรกทอรี manifest ค่า `targetPath`
เป็น relative paths ภายใต้ prefix artifact Mantis R2/S3 ที่ตั้งค่าไว้ publisher
จะปฏิเสธ path traversal และข้าม entries ที่ทำเครื่องหมาย `"required": false`
เมื่อ previews หรือ videos ที่ไม่บังคับไม่พร้อมใช้งาน

ชนิด artifact ที่รองรับ:

- `timeline`: screenshot scenario แบบ deterministic โดยปกติเป็น before/after
- `desktopScreenshot`: screenshot เดสก์ท็อป VNC/browser
- `motionPreview`: GIF animation แบบ inline ที่สร้างจากการบันทึกเดสก์ท็อป
- `motionClip`: MP4 ที่ตัดเฉพาะช่วงมีการเคลื่อนไหว โดยลบช่วงนิ่งตอนต้นและท้าย
- `fullVideo`: การบันทึก MP4 แบบเต็มสำหรับตรวจสอบเชิงลึก
- `metadata`: JSON/log sidecar
- `report`: report Markdown

publisher ที่ reuse ได้คือ `scripts/mantis/publish-pr-evidence.mjs` Workflows
เรียกใช้ด้วย manifest, PR เป้าหมาย, root เป้าหมายของ artifact, comment marker,
Actions artifact URL, run URL และแหล่งที่มาของคำขอ โดยจะอัปโหลด artifacts ที่ประกาศไว้
ไปยัง bucket Mantis R2/S3 ที่ตั้งค่าไว้, สร้างคอมเมนต์ PR ที่ขึ้นต้นด้วย summary
พร้อม images/previews แบบ inline และ videos ที่ลิงก์ไว้ จากนั้น update คอมเมนต์ marker
ที่มีอยู่หรือสร้างใหม่ workflows publish ไปที่ `openclaw-crabbox-artifacts`
พร้อม public URLs ภายใต้ `https://artifacts.openclaw.ai` โดยให้ค่า bucket,
region และ public URL โดยตรง publisher ที่ reuse ได้ต้องมี:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

คุณสามารถ trigger การรัน status-reactions โดยตรงจากคอมเมนต์ PR ได้ด้วย:

```text
@openclaw-mantis discord status reactions
```

comment trigger นี้ตั้งใจให้แคบ โดยจะรันเฉพาะบนคอมเมนต์ pull request
จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และจะรู้จักเฉพาะคำขอ
status-reaction ของ Discord เท่านั้น โดยค่าเริ่มต้นจะใช้ baseline ref ที่ทราบว่าเสีย
และ SHA ของ head PR ปัจจุบันเป็น candidate maintainer สามารถ override ref ใดก็ได้:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA สามารถ trigger จากคอมเมนต์ PR ได้เช่นกัน:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

โดยค่าเริ่มต้นจะใช้ SHA ของ head PR ปัจจุบันเป็น candidate และรัน
`telegram-status-command` maintainer สามารถ override `candidate=...`,
`provider=aws|hetzner`, และ `lease=<cbx_...>` เมื่อจำเป็นต้องใช้ ref เฉพาะหรือ
เดสก์ท็อป Crabbox ที่ pre-warm ไว้

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกชัดเจนและเน้น scenario ส่วนคำสั่งที่สองภายหลังสามารถ map PR หรือ issue
ไปยัง scenarios Mantis ที่แนะนำจาก labels, files ที่เปลี่ยน และ findings review
ของ ClawSweeper

## วงจรชีวิตการรัน

1. รับ credentials
2. จัดสรรหรือ reuse VM
3. เตรียมโปรไฟล์เดสก์ท็อป/browser เมื่อ scenario ต้องการหลักฐาน UI
4. เตรียม checkout ที่สะอาดสำหรับ baseline ref
5. ติดตั้ง dependencies และ build เฉพาะสิ่งที่ scenario ต้องการ
6. เริ่ม OpenClaw Gateway ลูกด้วยไดเรกทอรี state ที่แยกออกมา
7. ตั้งค่า live transport, provider, model และ browser profile
8. รัน scenario และจับหลักฐาน baseline
9. หยุด gateway และเก็บ logs ไว้
10. เตรียม candidate ref ใน VM เดียวกัน
11. รัน scenario เดียวกันและจับหลักฐาน candidate
12. เปรียบเทียบผลลัพธ์ oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, logs, screenshots และ trace artifacts ที่ไม่บังคับ
14. อัปโหลด GitHub Actions artifacts
15. โพสต์ข้อความสถานะ PR หรือ Discord แบบกระชับ

scenario ควร fail ได้สองแบบที่ต่างกัน:

- **จำลองบั๊กซ้ำได้**: baseline fail ตามรูปแบบที่คาดไว้
- **Harness failure**: การตั้งค่า environment, credentials, Discord API, browser หรือ
  provider fail ก่อนที่ bug oracle จะมีความหมาย

report สุดท้ายต้องแยกกรณีเหล่านี้ เพื่อให้ maintainer ไม่สับสนระหว่าง environment
ที่ไม่เสถียรกับพฤติกรรมของผลิตภัณฑ์

## Discord MVP

scenario แรกควร target status reactions ของ Discord ใน guild channels ที่
source reply delivery mode เป็น `message_tool_only`

เหตุผลที่เป็น seed ของ Mantis ที่ดี:

- มองเห็นได้ใน Discord เป็น reactions บนข้อความที่ trigger
- มี REST oracle ที่แข็งแรงผ่านสถานะ reaction ของข้อความ Discord
- ทดสอบ OpenClaw Gateway จริง, auth บอต Discord, message dispatch,
  source reply delivery mode, สถานะ status reaction และวงจรชีวิต model turn
- แคบพอที่จะทำให้ implementation แรกซื่อตรงต่อขอบเขต

รูปแบบ scenario ที่คาดหวัง:

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

หลักฐาน baseline ควรแสดง queued acknowledgement reaction แต่ไม่มี lifecycle
transition ในโหมด tool-only หลักฐาน candidate ควรแสดง lifecycle status reactions
ที่ทำงานเมื่อ `messages.statusReactions.enabled` เป็น true อย่างชัดเจน

slice แรกที่ executable ได้คือ scenario Discord live QA แบบ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

โดยตั้งค่า SUT ให้มี guild handling แบบ always-on, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และ status reactions อย่างชัดเจน oracle
จะ poll ข้อความ Discord จริงที่ trigger และคาดหวัง sequence ที่สังเกตได้
`👀 -> 🤔 -> 👍` Artifacts รวมถึง `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` และ
`discord-status-reactions-tool-only-timeline.png`

## ส่วน QA ที่มีอยู่

Mantis ควรต่อยอดจาก private QA stack ที่มีอยู่ แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รัน lane Discord สดพร้อม driver และบอต SUT อยู่แล้ว
- live transport runner เขียน reports, QA evidence และ artifacts เฉพาะ transport
  ไว้ภายใต้ `.artifacts/qa-e2e/` อยู่แล้ว
- Convex credential leases ให้สิทธิ์เข้าถึง credentials live transport ที่แชร์ร่วมกัน
  แบบ exclusive อยู่แล้ว
- browser control service รองรับ screenshots, snapshots, headless managed profiles
  และ remote CDP profiles อยู่แล้ว
- QA Lab มี debugger UI และ bus สำหรับการทดสอบที่มีรูปทรงแบบ transport อยู่แล้ว

implementation แรกของ Mantis สามารถเป็น before/after runner แบบบางบนส่วนเหล่านี้
พร้อมชั้นหลักฐานภาพหนึ่งชั้น

## โมเดลหลักฐาน

ทุก run จะเขียนไดเรกทอรี artifact ที่เสถียร:

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

`mantis-summary.json` ควรเป็นแหล่งข้อมูลจริงที่เครื่องอ่านได้ รายงาน
Markdown มีไว้สำหรับคอมเมนต์ PR และการตรวจทานโดยมนุษย์

สรุปต้องประกอบด้วย:

- refs และ SHA ที่ทดสอบ
- transport และรหัสสถานการณ์
- ผู้ให้บริการเครื่องและรหัสเครื่องหรือรหัส lease
- แหล่งที่มาของข้อมูลประจำตัวโดยไม่มีค่าลับ
- ผลลัพธ์ baseline
- ผลลัพธ์ candidate
- บั๊กเกิดซ้ำบน baseline หรือไม่
- candidate แก้ไขได้หรือไม่
- พาธ artifact
- ปัญหาการตั้งค่าหรือการล้างข้อมูลที่ผ่านการทำให้ปลอดภัยแล้ว

ภาพหน้าจอเป็นหลักฐาน ไม่ใช่ความลับ แต่ยังต้องมีวินัยในการปกปิดข้อมูล:
ชื่อช่องส่วนตัว ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏได้ สำหรับ PR สาธารณะ
ให้เลือกใช้ลิงก์ artifact ของ GitHub Actions แทนรูปภาพแบบ inline จนกว่าแนวทาง
การปกปิดข้อมูลจะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

เลนเบราว์เซอร์มีสองโหมด:

- **การทำงานอัตโนมัติแบบ headless**: ค่าเริ่มต้นสำหรับ CI Chrome ทำงานโดยเปิด CDP และ
  Playwright หรือการควบคุมเบราว์เซอร์ของ OpenClaw จับภาพหน้าจอ
- **การกู้คืนผ่าน VNC**: เปิดใช้บน VM เดียวกันเมื่อการเข้าสู่ระบบ, MFA, การป้องกันระบบอัตโนมัติของ Discord,
  หรือการดีบักด้วยภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ผู้สังเกตการณ์ Discord ควรถาวรพอที่จะหลีกเลี่ยง
การเข้าสู่ระบบทุกครั้งที่รัน แต่ต้องแยกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์หนึ่ง
เป็นของพูลเครื่อง Mantis ไม่ใช่แล็ปท็อปของนักพัฒนา

เมื่อ Mantis ค้าง ระบบจะโพสต์ข้อความสถานะ Discord พร้อม:

- รหัสการรัน
- รหัสสถานการณ์
- ผู้ให้บริการเครื่อง
- ไดเรกทอรี artifact
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความตัวบล็อกสั้น ๆ

การปรับใช้แบบส่วนตัวครั้งแรกสามารถโพสต์ข้อความเหล่านี้ไปยังช่องผู้ปฏิบัติงาน
ที่มีอยู่ แล้วค่อยย้ายไปยังช่อง Mantis เฉพาะในภายหลัง

## เครื่อง

Mantis ควรเลือกใช้ AWS ผ่าน Crabbox สำหรับการใช้งานระยะไกลครั้งแรก
Crabbox ให้เครื่องที่เตรียมพร้อมไว้แล้ว การติดตาม lease การ hydrate ล็อก ผลลัพธ์ และ
การล้างข้อมูล หากความจุ AWS ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่มผู้ให้บริการ Hetzner
ไว้หลังอินเทอร์เฟซเครื่องเดียวกัน

ข้อกำหนด VM ขั้นต่ำ:

- Linux ที่ติดตั้ง Chrome หรือ Chromium ซึ่งรองรับเดสก์ท็อป
- การเข้าถึง CDP สำหรับระบบอัตโนมัติของเบราว์เซอร์
- VNC หรือ noVNC สำหรับการกู้คืน
- Node 22 และ pnpm
- checkout ของ OpenClaw และแคช dependency
- แคชเบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และหน่วยความจำเพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว เบราว์เซอร์หนึ่งตัว และการรันโมเดลหนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, ผู้ให้บริการโมเดล และ credential broker

VM ไม่ควรเก็บความลับดิบที่มีอายุยาวไว้นอกพื้นที่จัดเก็บข้อมูลประจำตัวหรือ
โปรไฟล์เบราว์เซอร์ที่คาดไว้

## ความลับ

ความลับอยู่ใน GitHub organization หรือ repository secrets สำหรับการรันระยะไกล และใน
ไฟล์ความลับที่ผู้ปฏิบัติงานควบคุมในเครื่องสำหรับการรันภายในเครื่อง

ชื่อความลับที่แนะนำ:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลด artifact GitHub สาธารณะ
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

ในระยะยาว พูลข้อมูลประจำตัว Convex ควรยังเป็นแหล่งปกติสำหรับข้อมูลประจำตัว
transport แบบสด GitHub secrets ใช้ bootstrap broker และเลน fallback
เวิร์กโฟลว์ปฏิกิริยาสถานะ Discord จะ map ความลับ Mantis Crabbox กลับไปยัง
ตัวแปรสภาพแวดล้อม `CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN`
ที่ Crabbox CLI คาดหวัง ชื่อ GitHub secret แบบธรรมดา `CRABBOX_*` ยังคง
ยอมรับเป็น fallback เพื่อความเข้ากันได้

Mantis runner ต้องไม่พิมพ์:

- โทเค็นบ็อต Discord
- คีย์ API ของผู้ให้บริการ
- คุกกี้เบราว์เซอร์
- เนื้อหาโปรไฟล์ auth
- รหัสผ่าน VNC
- payload ข้อมูลประจำตัวดิบ

การอัปโหลด artifact สาธารณะควรปกปิด metadata เป้าหมาย Discord เช่นรหัสบ็อต,
guild, channel และ message ด้วย เวิร์กโฟลว์ smoke ของ GitHub เปิดใช้
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หากโทเค็นถูกวางลงใน issue, PR, แชต หรือ log โดยไม่ตั้งใจ ให้หมุนเวียนโทเค็น
หลังจากบันทึกความลับใหม่แล้ว

## Artifact ของ GitHub และคอมเมนต์ PR

เวิร์กโฟลว์ Mantis ควรอัปโหลดชุดหลักฐานเต็มเป็น artifact ของ Actions
ที่มีอายุสั้น เมื่อเวิร์กโฟลว์รันสำหรับรายงานบั๊กหรือ PR แก้ไข ก็ควร
เผยแพร่สื่อ inline ที่ปกปิดข้อมูลแล้วไปยัง bucket Mantis R2/S3 ที่กำหนดค่าไว้ และ upsert
คอมเมนต์บนบั๊กหรือ PR แก้ไขนั้นพร้อมภาพหน้าจอก่อน/หลังแบบ inline อย่าโพสต์
หลักฐานหลักไว้เฉพาะบน PR ระบบอัตโนมัติ QA ทั่วไป ล็อกดิบ ข้อความที่สังเกตได้
และหลักฐานขนาดใหญ่อื่น ๆ ให้อยู่ใน artifact ของ Actions

เวิร์กโฟลว์ production ควรโพสต์คอมเมนต์เหล่านั้นด้วย Mantis GitHub App ไม่ใช่
ด้วย `github-actions[bot]` เก็บ app id และ private key เป็น GitHub Actions
secrets ชื่อ `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY`
เวิร์กโฟลว์ใช้ marker ที่ซ่อนอยู่เป็นคีย์ upsert อัปเดตคอมเมนต์นั้นเมื่อ
โทเค็นสามารถแก้ไขได้ และสร้างคอมเมนต์ใหม่ที่ Mantis เป็นเจ้าของเมื่อ
marker เก่าที่บ็อตเป็นเจ้าของไม่สามารถแก้ไขได้

คอมเมนต์ PR ควรสั้นและเน้นภาพ:

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

เมื่อการรันล้มเหลวเพราะ harness ล้มเหลว คอมเมนต์ต้องระบุเช่นนั้นแทนที่จะ
สื่อว่า candidate ล้มเหลว

## หมายเหตุการปรับใช้แบบส่วนตัว

การปรับใช้แบบส่วนตัวอาจมีแอปพลิเคชัน Mantis Discord อยู่แล้ว ให้นำ
แอปพลิเคชันนั้นมาใช้ซ้ำแทนการสร้างแอปอีกตัว เมื่อแอปมีสิทธิ์บ็อต
ที่ถูกต้องและสามารถหมุนเวียนได้อย่างปลอดภัย

ตั้งค่าช่องแจ้งเตือนผู้ปฏิบัติงานเริ่มต้นผ่าน secrets หรือการกำหนดค่าการปรับใช้
ในตอนแรกสามารถชี้ไปยังช่อง maintainer หรือ operations ที่มีอยู่ แล้วค่อยย้ายไปยัง
ช่อง Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่ guild ids, channel ids, bot tokens, browser cookies หรือ VNC passwords
ไว้ในเอกสารนี้ ให้เก็บไว้ใน GitHub secrets, credential broker หรือพื้นที่เก็บความลับ
ภายในเครื่องของผู้ปฏิบัติงาน

## การเพิ่มสถานการณ์

สถานการณ์ Mantis ควรประกาศ:

- id และชื่อเรื่อง
- transport
- ข้อมูลประจำตัวที่ต้องใช้
- นโยบาย ref ของ baseline
- นโยบาย ref ของ candidate
- แพตช์การกำหนดค่า OpenClaw
- ขั้นตอนการตั้งค่า
- สิ่งกระตุ้น
- oracle baseline ที่คาดหวัง
- oracle candidate ที่คาดหวัง
- เป้าหมายการจับภาพ
- งบประมาณ timeout
- ขั้นตอนการล้างข้อมูล

สถานการณ์ควรเลือกใช้ oracle ขนาดเล็กและมี type:

- สถานะปฏิกิริยา Discord สำหรับบั๊กปฏิกิริยา
- การอ้างอิงข้อความ Discord สำหรับบั๊ก threading
- thread ts ของ Slack และสถานะ reaction API สำหรับบั๊ก Slack
- รหัสข้อความอีเมลและ headers สำหรับบั๊กอีเมล
- ภาพหน้าจอเบราว์เซอร์เมื่อ UI เป็นสิ่งที่สังเกตได้อย่างน่าเชื่อถือเพียงอย่างเดียว

การตรวจด้วย vision ควรเป็นส่วนเสริม หาก API ของแพลตฟอร์มสามารถพิสูจน์บั๊กได้ ให้ใช้
API เป็น oracle ผ่าน/ไม่ผ่าน และเก็บภาพหน้าจอไว้เพื่อความมั่นใจของมนุษย์

## การขยายผู้ให้บริการ

หลังจาก Discord runner เดียวกันสามารถเพิ่ม:

- Slack: ปฏิกิริยา, threads, app mentions, modals, การอัปโหลดไฟล์
- อีเมล: การ auth Gmail และ message threading โดยใช้ `gog` เมื่อ connectors ไม่เพียงพอ
- WhatsApp: การเข้าสู่ระบบด้วย QR, การระบุตัวตนซ้ำ, การส่งข้อความ, สื่อ, ปฏิกิริยา
- Telegram: group mention gating, คำสั่ง, ปฏิกิริยาเมื่อพร้อมใช้งาน
- Matrix: ห้องที่เข้ารหัส, ความสัมพันธ์ thread หรือ reply, การ resume หลัง restart

แต่ละ transport ควรมีสถานการณ์ smoke ราคาถูกหนึ่งรายการและสถานการณ์ตามกลุ่มบั๊ก
อย่างน้อยหนึ่งรายการ สถานการณ์ภาพที่มีค่าใช้จ่ายสูงควรเป็นแบบ opt-in

## คำถามที่ยังเปิดอยู่

- บ็อต Discord ตัวใดควรเป็น driver และตัวใดควรเป็น SUT เมื่อมีการนำ
  บ็อต Mantis ที่มีอยู่มาใช้ซ้ำ?
- การเข้าสู่ระบบเบราว์เซอร์ผู้สังเกตการณ์ควรใช้บัญชี Discord ของมนุษย์ บัญชีทดสอบ
  หรือใช้เฉพาะหลักฐาน REST ที่บ็อตอ่านได้สำหรับเฟสแรก?
- GitHub ควรเก็บ artifact Mantis สำหรับ PR ไว้นานเท่าใด?
- เมื่อใด ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติแทนการรอ
  คำสั่งจาก maintainer?
- ควรปกปิดหรือตัดภาพหน้าจอก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่?
