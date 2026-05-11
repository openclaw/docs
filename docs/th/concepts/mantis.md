---
read_when:
    - การสร้างหรือเรียกใช้การตรวจสอบคุณภาพเชิงภาพแบบสดสำหรับบั๊กของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึง
    - การเพิ่มสถานการณ์การรับส่งข้อมูลแบบสดสำหรับ Discord, Slack, WhatsApp หรืออื่นๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ การทำงานอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบแบบภาพตั้งแต่ต้นจนจบสำหรับทำซ้ำบั๊กของ OpenClaw บนทรานสปอร์ตจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์กับ PR
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-11T20:28:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis เป็นระบบตรวจสอบแบบ end-to-end ของ OpenClaw สำหรับบั๊กที่ต้องใช้ runtime จริง, transport จริง และหลักฐานที่มองเห็นได้ โดยจะรันสถานการณ์กับ ref ที่ทราบว่าเสีย จับหลักฐาน รันสถานการณ์เดียวกันกับ ref ผู้สมัคร แล้วเผยแพร่การเปรียบเทียบเป็น artifacts ที่ maintainer สามารถตรวจสอบได้จาก PR หรือจากคำสั่งในเครื่อง

Mantis เริ่มจาก Discord เพราะ Discord ให้ lane แรกที่มีมูลค่าสูงกับเรา: การยืนยันตัวตนของบอตจริง, ช่อง guild จริง, reactions, threads, คำสั่ง native และ UI เบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่า transport แสดงอะไร

## เป้าหมาย

- ทำซ้ำบั๊กจาก GitHub issue หรือ PR ด้วยรูปแบบ transport เดียวกับที่ผู้ใช้เห็น
- จับ artifact **ก่อน** บน baseline ref ก่อนใช้การแก้ไข
- จับ artifact **หลัง** บน candidate ref หลังใช้การแก้ไข
- ใช้ oracle ที่กำหนดแน่นอนเมื่อเป็นไปได้ เช่น การอ่าน reaction ผ่าน Discord REST หรือการตรวจ transcript ของช่อง
- จับภาพหน้าจอเมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันในเครื่องจาก CLI ที่ควบคุมโดย agent และรันระยะไกลจาก GitHub
- เก็บสถานะเครื่องให้เพียงพอสำหรับการกู้ผ่าน VNC เมื่อการเข้าสู่ระบบ, browser automation หรือการยืนยันตัวตนของ provider ติดขัด
- โพสต์สถานะอย่างกระชับไปยังช่อง Discord ของผู้ปฏิบัติงานเมื่อการรันถูกบล็อก, ต้องการความช่วยเหลือผ่าน VNC แบบ manual หรือเสร็จสิ้น

## สิ่งที่ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit tests โดยปกติการรัน Mantis ควรถูกแปลงเป็น regression test ที่เล็กลงหลังจากเข้าใจการแก้ไขแล้ว
- Mantis ไม่ใช่ gate CI แบบเร็วตามปกติ มันช้ากว่า ใช้ credentials จริง และสงวนไว้สำหรับบั๊กที่สภาพแวดล้อมจริงมีความสำคัญ
- Mantis ไม่ควรต้องใช้มนุษย์ในการทำงานปกติ Manual VNC เป็นเส้นทางกู้คืน ไม่ใช่ happy path
- Mantis ไม่เก็บ secrets ดิบไว้ใน artifacts, logs, screenshots, รายงาน Markdown หรือความคิดเห็น PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแต็ก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของ scenario runtime, transport adapters, evidence schema และ CLI ในเครื่องภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของส่วน live transport harness, helpers สำหรับจับภาพเบราว์เซอร์ และ artifact writers
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นเครื่องไว้เมื่อจำเป็นต้องใช้ VM ระยะไกล
- GitHub Actions เป็นเจ้าของ remote workflow entrypoint และการเก็บรักษา artifact
- ClawSweeper เป็นเจ้าของการ routing ความคิดเห็น GitHub: การแยกคำสั่ง maintainer, การ dispatch workflow และการโพสต์ความคิดเห็น PR สุดท้าย
- OpenClaw agents ขับเคลื่อน Mantis ผ่าน Codex เมื่อสถานการณ์ต้องการการตั้งค่าแบบ agentic, การดีบัก หรือการรายงานสถานะติดขัด

ขอบเขตนี้ทำให้ความรู้ด้าน transport อยู่ใน OpenClaw, การจัดตารางเครื่องอยู่ใน Crabbox และ glue ของ workflow สำหรับ maintainer อยู่ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่งในเครื่องแรกตรวจสอบบอต Discord, guild, channel, การส่งข้อความ, การส่ง reaction และเส้นทาง artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

runner แบบก่อนและหลังในเครื่องยอมรับรูปแบบนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner จะสร้าง worktrees แบบ detached สำหรับ baseline และ candidate ใต้ไดเรกทอรี output, ติดตั้ง dependencies, build แต่ละ ref, รันสถานการณ์ด้วย `--allow-failures` แล้วเขียน `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` สำหรับสถานการณ์ Discord แรก การตรวจสอบที่สำเร็จหมายความว่า baseline status เป็น `fail` และ candidate status เป็น `pass`

probe ก่อน/หลังของ Discord ตัวที่สองมุ่งเป้าไปที่ thread attachments:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

สถานการณ์นั้นโพสต์ข้อความ parent ด้วย driver bot, สร้าง Discord thread จริง, เรียก action `message.thread-reply` ของ OpenClaw ด้วย `filePath` ภายใน repo แล้ว poll thread เพื่อหา reply ของ SUT และชื่อไฟล์ attachment ภาพหน้าจอ baseline แสดง reply ที่ไม่มี attachment; ภาพหน้าจอ candidate แสดง attachment `mantis-thread-report.md` ตามที่คาดไว้

primitive VM/เบราว์เซอร์ตัวแรกคือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

มัน lease หรือ reuse เครื่องเดสก์ท็อป Crabbox, เริ่มเบราว์เซอร์ที่มองเห็นได้ภายใน session VNC, จับภาพเดสก์ท็อป, ดึง artifacts กลับมายังไดเรกทอรี output ในเครื่อง และเขียนคำสั่ง reconnect ลงในรายงาน คำสั่งมีค่าเริ่มต้นเป็น provider Hetzner เพราะเป็น provider แรกที่มี coverage desktop/VNC ที่ใช้งานได้ใน lane ของ Mantis Override ด้วย `--provider`, `--crabbox-bin` หรือ `OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อรันกับ fleet Crabbox อื่น

flags ที่มีประโยชน์สำหรับ desktop smoke:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reuse เดสก์ท็อปที่อุ่นเครื่องไว้
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดในเบราว์เซอร์ที่มองเห็นได้
- `--html-file <path>` render artifact HTML ภายใน repo ในเบราว์เซอร์ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อจับ timeline ของ Discord status-reaction ที่สร้างขึ้นผ่านเดสก์ท็อป Crabbox จริง
- `--browser-profile-dir <remote-path>` reuse remote Chrome user-data-dir เพื่อให้เดสก์ท็อป Mantis แบบ persistent สามารถคงสถานะ logged in ระหว่างการรัน ใช้สำหรับ profile viewer Discord Web ที่ใช้งานระยะยาว
- `--browser-profile-archive-env <name>` restore archive Chrome user-data-dir แบบ base64 `.tgz` จาก environment variable ที่ระบุชื่อก่อนเปิดเบราว์เซอร์ ใช้สำหรับพยานที่ logged in เช่น Discord Web ค่าเริ่มต้นของ env var คือ `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`
- `--video-duration <seconds>` ควบคุมความยาวการจับ MP4 ใช้ duration ที่ยาวขึ้นสำหรับ web apps ที่ logged in แล้วแต่ช้าและต้องใช้เวลาให้เสถียร
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` ทำให้ lease ที่สร้างใหม่และผ่านยังคงเปิดไว้สำหรับการตรวจสอบผ่าน VNC การรันที่ล้มเหลวจะเก็บ lease ไว้เป็นค่าเริ่มต้นเมื่อมีการสร้าง lease เพื่อให้ผู้ปฏิบัติงาน reconnect ได้
- `--class`, `--idle-timeout` และ `--ttl` ปรับขนาดเครื่องและอายุ lease

สำหรับหลักฐาน Discord Web, Mantis ใช้บัญชี viewer เฉพาะแทน bot token สถานการณ์ Discord API จริงยังคงเป็น oracle: มันสร้าง thread จริง, ส่ง `thread-reply` ของ SUT และตรวจ attachment ผ่าน Discord REST เมื่อกำหนด `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` สถานการณ์จะเขียน artifact URL ของ Discord Web ด้วย เมื่อกำหนด `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` มันจะปล่อย thread นั้นไว้นานพอให้เบราว์เซอร์ที่ logged in เปิดและบันทึกได้

workflow ของ GitHub เปิด URL ของ candidate thread ใน Discord Web, จับภาพหน้าจอ, บันทึก MP4 และสร้าง GIF preview ที่ตัดแต่งตาม motion เมื่อมี media tooling ของ Crabbox แนะนำให้ใช้เส้นทาง profile viewer แบบ persistent ที่กำหนดผ่าน `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` เพราะ archive ของ Chrome profile แบบเต็มอาจใหญ่เกินขนาด secret ของ GitHub สำหรับ profile ขนาดเล็ก/สำหรับ bootstrap workflow ยังสามารถ restore archive `.tgz` แบบ base64 จาก `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ได้เช่นกัน หากไม่ได้กำหนดแหล่ง profile ใดเลย workflow จะยังเผยแพร่ภาพหน้าจอ attachment ของ baseline/candidate ที่กำหนดแน่นอน และ log notice ว่าข้ามพยาน Discord Web ที่ logged in แล้ว

primitive desktop transport แบบเต็มตัวแรกคือ Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

มัน lease หรือ reuse เครื่องเดสก์ท็อป Crabbox, sync checkout ปัจจุบันเข้า VM, รัน `pnpm openclaw qa slack` ภายใน VM นั้น, เปิด Slack Web ในเบราว์เซอร์ VNC, จับภาพเดสก์ท็อปที่มองเห็นได้ และคัดลอกทั้ง Slack QA artifacts และภาพหน้าจอ VNC กลับมายังไดเรกทอรี output ในเครื่อง นี่เป็นรูปแบบ Mantis แรกที่ Gateway ของ SUT OpenClaw และเบราว์เซอร์อยู่ภายใน VM เดสก์ท็อป Linux เครื่องเดียวกัน

เมื่อใช้ `--gateway-setup` คำสั่งจะเตรียม OpenClaw home แบบ disposable และ persistent ที่ `$HOME/.openclaw-mantis/slack-openclaw`, patch การกำหนดค่า Slack Socket Mode สำหรับช่องที่เลือก, เริ่ม `openclaw gateway run` บนพอร์ต `38973` และทำให้ Chrome ยังคงรันอยู่ใน session VNC นี่คือโหมด "ปล่อยเดสก์ท็อป Linux ที่มี Slack และ claw กำลังรันอยู่ไว้ให้ฉัน"; lane Slack QA แบบ bot-to-bot ยังคงเป็นค่าเริ่มต้นเมื่อไม่ได้ระบุ `--gateway-setup`

inputs ที่จำเป็นสำหรับ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับ lane model ระยะไกล หากมีเพียง
  `OPENAI_API_KEY` ที่ตั้งค่าในเครื่อง Mantis จะ map ไปยัง `OPENCLAW_LIVE_OPENAI_KEY`
  ก่อนเรียก Crabbox เพื่อให้การส่งต่อ env `OPENCLAW_*` ของ Crabbox สามารถพาเข้าไปใน VM ได้

เมื่อใช้ `--gateway-setup --credential-source convex` Mantis จะ lease credential ของ Slack SUT จาก shared pool ก่อนสร้าง VM และส่งต่อ leased channel id, Socket Mode app token และ bot token เป็น runtime env `OPENCLAW_MANTIS_SLACK_*` ภายในเดสก์ท็อป สิ่งนี้ทำให้ GitHub workflows บางลง: พวกมันต้องการเพียง secret ของ Convex broker ไม่ใช่ bot หรือ app tokens ของ Slack แบบดิบ

flags ที่มีประโยชน์สำหรับ Slack desktop:

- `--lease-id <cbx_...>` รันซ้ำกับเครื่องที่ผู้ปฏิบัติงานได้เข้าสู่ระบบ Slack Web ผ่าน VNC ไว้แล้ว
- `--gateway-setup` เริ่ม Gateway Slack ของ OpenClaw แบบ persistent ใน VM แทนที่จะรันเฉพาะ lane QA แบบ bot-to-bot
- `--keep-lease` ทำให้ gateway VM ยังคงเปิดไว้สำหรับการตรวจสอบผ่าน VNC หลังสำเร็จ; `--no-keep-lease` หยุด VM หลังรวบรวม artifacts
- `--slack-url <url>` เปิด URL ของ Slack Web ที่เฉพาะเจาะจง หากไม่มี Mantis จะ derive `https://app.slack.com/client/<team>/<channel>` จาก Slack `auth.test` เมื่อมี SUT bot token
- `--slack-channel-id <id>` ควบคุม allowlist ช่อง Slack ที่ใช้โดย gateway setup
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุม Chrome profile แบบ persistent ภายใน VM ค่าเริ่มต้นคือ `$HOME/.config/openclaw-mantis/slack-chrome-profile` ดังนั้นการเข้าสู่ระบบ Slack Web แบบ manual จะอยู่รอดจากการรันซ้ำบน lease เดียวกัน
- `--credential-source convex --credential-role ci` ใช้ shared credential pool แทน Slack env tokens โดยตรง
- `--provider-mode`, `--model`, `--alt-model` และ `--fast` pass through ไปยัง lane live ของ Slack

workflow smoke ของ GitHub คือ `Mantis Discord Smoke` workflow GitHub แบบก่อนและหลังสำหรับสถานการณ์จริงแรกคือ `Mantis Discord Status Reactions` โดยรับ:

- `baseline_ref`: ref ที่คาดว่าจะทำซ้ำพฤติกรรม queued-only
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

มัน checkout ref ของ workflow harness, build worktrees ของ baseline และ candidate แยกกัน, รัน `discord-status-reactions-tool-only` กับแต่ละ worktree และอัปโหลด `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` เป็น Actions artifacts นอกจากนี้ยัง render timeline HTML ของแต่ละ lane ในเบราว์เซอร์เดสก์ท็อป Crabbox และเผยแพร่ภาพหน้าจอ VNC เหล่านั้นไว้ข้าง PNG timeline ที่กำหนดแน่นอนในความคิดเห็น PR ความคิดเห็น PR เดียวกัน embed GIF preview แบบเบาที่ตัดแต่งตาม motion ซึ่งสร้างโดย `crabbox media preview`, ลิงก์ไปยังคลิป MP4 ที่ตัดแต่งตาม motion ที่ตรงกัน และเก็บไฟล์ MP4 เดสก์ท็อปแบบเต็มไว้สำหรับการตรวจสอบเชิงลึก ภาพหน้าจอยังคงอยู่ inline เพื่อการ review อย่างรวดเร็ว workflow build Crabbox CLI จาก `openclaw/crabbox` main เพื่อให้สามารถใช้ flags lease desktop/browser ปัจจุบันได้ก่อนที่จะตัด release binary Crabbox ถัดไป

`Mantis Scenario` คือ entrypoint manual แบบ generic โดยรับ `scenario_id`, `candidate_ref`, `baseline_ref` แบบ optional และ `pr_number` แบบ optional แล้ว dispatch workflow ที่สถานการณ์เป็นเจ้าของ wrapper ตั้งใจให้บาง: scenario workflows ยังคงเป็นเจ้าของการตั้งค่า transport, credentials, VM class, oracle ที่คาดหวัง และ artifact manifest ของตัวเอง

`Mantis Slack Desktop Smoke` เป็นเวิร์กโฟลว์ VM ของ Slack รายการแรก โดยจะ checkout
ref ของแคนดิเดตที่เชื่อถือได้ใน worktree แยกต่างหาก, เช่าเดสก์ท็อป Linux ของ Crabbox,
รัน `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` กับแคนดิเดตนั้น,
เปิด Slack Web ในเบราว์เซอร์ VNC, บันทึกเดสก์ท็อป, สร้างตัวอย่างที่ตัดเฉพาะช่วงมีการเคลื่อนไหวด้วย `crabbox media preview`, อัปโหลดไดเรกทอรี artifact แบบเต็ม,
และอาจโพสต์คอมเมนต์หลักฐานแบบ inline บน PR เป้าหมายด้วยก็ได้
ค่าเริ่มต้นใช้ AWS สำหรับการเช่าเดสก์ท็อป และมีอินพุต provider แบบ manual เพื่อให้
operator สลับไปใช้ Hetzner ได้เมื่อความจุของ AWS ช้าหรือไม่พร้อมใช้งาน ใช้
lane นี้เมื่อคุณต้องการ "เดสก์ท็อป Linux ที่มี Slack และ claw กำลังรันอยู่" แทนที่จะมีเพียง transcript Slack แบบ bot-to-bot

`Mantis Telegram Live` ห่อ lane QA แบบสดของ Telegram ที่มีอยู่ไว้ใน pipeline
หลักฐาน PR เดียวกัน โดยจะ checkout ref ของแคนดิเดตที่เชื่อถือได้ใน worktree แยกต่างหาก,
รัน `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, เขียน manifest `mantis-evidence.json` จาก summary ของ Telegram QA และ artifact ข้อความที่สังเกตได้, render HTML transcript ที่ redact แล้วผ่านเบราว์เซอร์เดสก์ท็อป Crabbox, สร้าง GIF ที่ตัดเฉพาะช่วงมีการเคลื่อนไหว
ด้วย `crabbox media preview`, และโพสต์คอมเมนต์หลักฐาน PR แบบ inline เมื่อมีหมายเลข PR
lane นี้เป็นภาพ transcript ไม่ใช่หลักฐาน Telegram Web ที่ล็อกอินอยู่: Telegram Bot API ให้หลักฐานข้อความสดที่เสถียร แต่สถานะล็อกอินของ Telegram Web ไม่จำเป็นสำหรับ automation ปกติของ Mantis

`Mantis Telegram Desktop Proof` คือ wrapper ก่อน/หลังแบบ agentic สำหรับ Telegram Desktop แบบ native maintainer สามารถ trigger ได้จากคอมเมนต์ PR ด้วย
`@Mantis telegram desktop proof`, จาก UI ของ Actions พร้อมคำสั่งแบบ freeform,
หรือผ่าน dispatcher ทั่วไป `Mantis Scenario` เวิร์กโฟลว์จะส่ง PR, ref baseline, ref แคนดิเดต และคำสั่งของ maintainer ให้ Codex
agent จะอ่าน PR, ตัดสินใจว่าพฤติกรรมที่มองเห็นได้ใน Telegram แบบใดที่พิสูจน์การเปลี่ยนแปลง,
รัน lane หลักฐาน Telegram Desktop ของ Crabbox แบบผู้ใช้จริงสำหรับ baseline และ
แคนดิเดต, ทำซ้ำจนกว่า GIF แบบ native จะมีประโยชน์, เขียน artifact
`motionPreview` แบบจับคู่ลงใน `mantis-evidence.json`, อัปโหลด bundle, และ
โพสต์ตารางหลักฐาน PR แบบ 2 คอลัมน์เมื่อมีหมายเลข PR

สำหรับการตั้งค่า Telegram desktop แบบ human-in-the-loop ให้ใช้ scenario builder:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

builder จะเช่าหรือนำเดสก์ท็อป Crabbox กลับมาใช้ซ้ำ, ติดตั้ง binary Telegram Desktop แบบ native สำหรับ Linux, อาจ restore archive session ของผู้ใช้, กำหนดค่า
OpenClaw ด้วย token ของ Telegram SUT bot ที่เช่าไว้, เริ่ม `openclaw gateway run`
บนพอร์ต `38974`, โพสต์ข้อความความพร้อมของ driver-bot ไปยังกลุ่ม private ที่เช่าไว้,
จากนั้นจับภาพ screenshot และ MP4 จากเดสก์ท็อป VNC ที่มองเห็นได้ bot token
จะไม่ล็อกอิน Telegram Desktop โดยเด็ดขาด; ใช้เพียงกำหนดค่า OpenClaw เท่านั้น viewer เดสก์ท็อปเป็น session ผู้ใช้ Telegram แยกต่างหากที่ restore จาก
`--telegram-profile-archive-env <name>` หรือสร้างแบบ manual ผ่าน VNC และคงไว้ด้วย
`--keep-lease`

flag ที่มีประโยชน์สำหรับ Telegram desktop builder:

- `--lease-id <cbx_...>` รันซ้ำกับ VM ที่ operator ล็อกอิน Telegram Desktop ไว้แล้ว
- `--telegram-profile-archive-env <name>` อ่าน archive โปรไฟล์ Telegram Desktop แบบ `.tgz` ที่เข้ารหัส base64 จาก env var นั้นและ restore ก่อนเปิดใช้งาน
- `--telegram-profile-dir <remote-path>` ควบคุมไดเรกทอรีโปรไฟล์ Telegram Desktop บนเครื่อง remote ค่าเริ่มต้นคือ `$HOME/.local/share/TelegramDesktop`
- `--no-gateway-setup` ติดตั้งและเปิด Telegram Desktop โดยไม่กำหนดค่า OpenClaw
- `--credential-source convex --credential-role ci` ใช้ credential broker ที่ใช้ร่วมกันแทน token env ของ Telegram โดยตรง

ทุก scenario ที่เผยแพร่ไปยัง PR จะเขียน `mantis-evidence.json` ถัดจากรายงาน
schema นี้คือจุดส่งต่อระหว่างโค้ด scenario กับคอมเมนต์ GitHub:

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
เป็น path สัมพัทธ์ใต้ไดเรกทอรี publish ของ branch `qa-artifacts`
publisher จะปฏิเสธ path traversal และข้ามรายการที่ทำเครื่องหมาย
`"required": false` เมื่อ preview หรือ video แบบ optional ไม่พร้อมใช้งาน

ชนิด artifact ที่รองรับ:

- `timeline`: screenshot ของ scenario แบบ deterministic โดยปกติเป็นก่อน/หลัง
- `desktopScreenshot`: screenshot เดสก์ท็อป VNC/เบราว์เซอร์
- `motionPreview`: GIF แบบ animated สำหรับ inline ที่สร้างจากการบันทึกเดสก์ท็อป
- `motionClip`: MP4 ที่ตัดเฉพาะช่วงมีการเคลื่อนไหว โดยลบช่วงนิ่งตอนต้นและท้าย
- `fullVideo`: การบันทึก MP4 แบบเต็มสำหรับการตรวจสอบเชิงลึก
- `metadata`: sidecar JSON/log
- `report`: รายงาน Markdown

publisher ที่นำกลับมาใช้ซ้ำได้คือ `scripts/mantis/publish-pr-evidence.mjs` เวิร์กโฟลว์
เรียกใช้พร้อม manifest, PR เป้าหมาย, root เป้าหมายของ `qa-artifacts`, marker คอมเมนต์,
URL artifact ของ Actions, URL run และแหล่งที่มาของ request โดยจะคัดลอก artifact ที่ประกาศไว้
ไปยัง branch `qa-artifacts`, สร้างคอมเมนต์ PR แบบ summary-first พร้อมรูปภาพ/preview แบบ inline
และ video ที่ลิงก์ไว้ จากนั้นอัปเดตคอมเมนต์ marker ที่มีอยู่หรือสร้างคอมเมนต์ใหม่

คุณยังสามารถ trigger การรัน status-reactions ได้โดยตรงจากคอมเมนต์ PR:

```text
@Mantis discord status reactions
```

comment trigger นี้ตั้งใจให้มีขอบเขตแคบ โดยจะรันเฉพาะบนคอมเมนต์ pull request
จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และรู้จักเฉพาะ request ของ Discord status-reaction เท่านั้น ค่าเริ่มต้นใช้ ref baseline ที่รู้ว่าเสีย
และ SHA ของ head PR ปัจจุบันเป็นแคนดิเดต maintainer สามารถ override ref ใดก็ได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA สามารถ trigger จากคอมเมนต์ PR ได้เช่นกัน:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

ค่าเริ่มต้นจะใช้ SHA ของ head PR ปัจจุบันเป็นแคนดิเดตและรัน
`telegram-status-command` maintainer สามารถ override `candidate=...`,
`provider=aws|hetzner`, และ `lease=<cbx_...>` เมื่อจำเป็นต้องใช้ ref เฉพาะหรือ
เดสก์ท็อป Crabbox ที่อุ่นเครื่องไว้แล้ว

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกชัดเจนและเน้น scenario คำสั่งที่สองสามารถ map PR
หรือ issue ไปยัง scenario ของ Mantis ที่แนะนำจาก label, ไฟล์ที่เปลี่ยนแปลง และ
finding จากรีวิวของ ClawSweeper ได้ในภายหลัง

## วงจรชีวิตการรัน

1. รับ credential
2. จัดสรรหรือนำ VM กลับมาใช้ซ้ำ
3. เตรียมโปรไฟล์เดสก์ท็อป/เบราว์เซอร์เมื่อ scenario ต้องใช้หลักฐาน UI
4. เตรียม checkout ที่สะอาดสำหรับ ref baseline
5. ติดตั้ง dependency และ build เฉพาะสิ่งที่ scenario ต้องใช้
6. เริ่ม OpenClaw Gateway child พร้อมไดเรกทอรีสถานะแบบแยก
7. กำหนดค่า transport แบบสด, provider, model และโปรไฟล์เบราว์เซอร์
8. รัน scenario และจับหลักฐาน baseline
9. หยุด Gateway และเก็บ log ไว้
10. เตรียม ref แคนดิเดตใน VM เดียวกัน
11. รัน scenario เดียวกันและจับหลักฐานแคนดิเดต
12. เปรียบเทียบผล oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, log, screenshot และ artifact trace แบบ optional
14. อัปโหลด artifact ของ GitHub Actions
15. โพสต์ข้อความสถานะ PR หรือ Discord แบบกระชับ

scenario ควรล้มเหลวได้สองรูปแบบที่ต่างกัน:

- **จำลอง bug ได้สำเร็จ**: baseline ล้มเหลวตามรูปแบบที่คาดไว้
- **harness ล้มเหลว**: การตั้งค่าสภาพแวดล้อม, credential, Discord API, เบราว์เซอร์ หรือ
  provider ล้มเหลวก่อนที่ bug oracle จะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้ เพื่อไม่ให้ maintainer สับสนระหว่างสภาพแวดล้อมที่ flaky
กับพฤติกรรมของผลิตภัณฑ์

## MVP ของ Discord

scenario แรกควรเล็งไปที่ reaction สถานะของ Discord ใน channel ของ guild ที่
โหมดการส่ง source reply คือ `message_tool_only`

เหตุผลที่เป็น seed ของ Mantis ที่ดี:

- มองเห็นได้ใน Discord เป็น reaction บนข้อความที่ trigger
- มี REST oracle ที่แข็งแรงผ่านสถานะ reaction ของข้อความ Discord
- ทดสอบ OpenClaw Gateway จริง, auth ของ Discord bot, การ dispatch ข้อความ,
  โหมดการส่ง source reply, สถานะ reaction และวงจรชีวิตของ turn ของ model
- มีขอบเขตแคบพอที่จะทำให้ implementation แรกตรงไปตรงมา

รูปแบบ scenario ที่คาดไว้:

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
transition วงจรชีวิตในโหมด tool-only หลักฐานแคนดิเดตควรแสดง reaction
สถานะวงจรชีวิตที่รันเมื่อ `messages.statusReactions.enabled` เป็น true อย่างชัดเจน

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

จะกำหนดค่า SUT ให้จัดการ guild แบบ always-on, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และ reaction สถานะอย่างชัดเจน oracle
จะ poll ข้อความ trigger จริงของ Discord และคาดว่าจะสังเกตลำดับ
`👀 -> 🤔 -> 👍` ได้ Artifact ประกอบด้วย `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` และ
`discord-status-reactions-tool-only-timeline.png`

## ส่วน QA ที่มีอยู่

Mantis ควรต่อยอดจาก stack QA แบบ private ที่มีอยู่แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รัน lane Discord แบบสดพร้อม bot driver และ
  SUT อยู่แล้ว
- live transport runner เขียนรายงานและ artifact ข้อความที่สังเกตได้
  ใต้ `.artifacts/qa-e2e/` อยู่แล้ว
- lease credential ของ Convex ให้สิทธิ์เข้าถึงแบบ exclusive ไปยัง
  credential transport สดที่ใช้ร่วมกันอยู่แล้ว
- service ควบคุมเบราว์เซอร์รองรับ screenshot, snapshot,
  managed profile แบบ headless และ remote CDP profile อยู่แล้ว
- QA Lab มี UI debugger และ bus สำหรับการทดสอบตามรูปทรง transport อยู่แล้ว

implementation แรกของ Mantis สามารถเป็น runner ก่อน/หลังแบบบาง ๆ เหนือส่วนเหล่านี้
บวกชั้นหลักฐานภาพหนึ่งชั้น

## โมเดลหลักฐาน

ทุก run เขียนไดเรกทอรี artifact ที่เสถียร:

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

`mantis-summary.json` ควรเป็นแหล่งความจริงที่เครื่องอ่านได้
รายงาน Markdown มีไว้สำหรับคอมเมนต์ PR และการรีวิวของมนุษย์

summary ต้องมี:

- ref และ SHA ที่ทดสอบ
- transport และ scenario id
- provider เครื่องและ machine id หรือ lease id
- แหล่งที่มาของ credential โดยไม่มีค่าลับ
- ผล baseline
- ผลแคนดิเดต
- bug จำลองได้บน baseline หรือไม่
- แคนดิเดตแก้ไขได้หรือไม่
- path ของ artifact
- ปัญหาการตั้งค่าหรือ cleanup ที่ sanitize แล้ว

ภาพหน้าจอเป็นหลักฐาน ไม่ใช่ความลับ ถึงอย่างนั้นก็ยังต้องมีวินัยในการปกปิดข้อมูล:
ชื่อช่องส่วนตัว ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏได้ สำหรับ PR สาธารณะ
ให้ใช้ลิงก์อาร์ติแฟกต์ของ GitHub Actions แทนรูปภาพแบบฝัง จนกว่าแนวทางการปกปิดข้อมูล
จะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

เลนเบราว์เซอร์มีสองโหมด:

- **การทำงานอัตโนมัติแบบ Headless**: ค่าเริ่มต้นสำหรับ CI Chrome ทำงานโดยเปิด CDP และ
  Playwright หรือการควบคุมเบราว์เซอร์ของ OpenClaw จะจับภาพหน้าจอ
- **การกู้สถานการณ์ด้วย VNC**: เปิดใช้งานบน VM เดียวกันเมื่อการเข้าสู่ระบบ, MFA, การป้องกันระบบอัตโนมัติของ Discord,
  หรือการดีบักด้วยภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ของผู้สังเกตการณ์ Discord ควรคงอยู่มากพอที่จะหลีกเลี่ยง
การเข้าสู่ระบบในทุกการรัน แต่ต้องแยกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์
เป็นของพูลเครื่อง Mantis ไม่ใช่แล็ปท็อปของนักพัฒนา

เมื่อ Mantis ค้าง ระบบจะโพสต์ข้อความสถานะ Discord พร้อม:

- id การรัน
- id สถานการณ์
- ผู้ให้บริการเครื่อง
- ไดเรกทอรีอาร์ติแฟกต์
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความสั้นๆ ระบุสิ่งที่บล็อกอยู่

การปรับใช้แบบส่วนตัวครั้งแรกสามารถโพสต์ข้อความเหล่านี้ไปยังช่องผู้ปฏิบัติการ
ที่มีอยู่ แล้วค่อยย้ายไปยังช่อง Mantis เฉพาะในภายหลัง

## เครื่อง

Mantis ควรเลือกใช้ AWS ผ่าน Crabbox สำหรับการใช้งานระยะไกลครั้งแรก
Crabbox ให้เครื่องที่เตรียมพร้อมไว้แล้ว การติดตามการเช่า การเตรียมสภาพแวดล้อม บันทึก ผลลัพธ์ และ
การล้างข้อมูลแก่เรา หากความจุของ AWS ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่มผู้ให้บริการ Hetzner
ไว้หลังอินเทอร์เฟซเครื่องเดียวกัน

ข้อกำหนดขั้นต่ำของ VM:

- Linux พร้อมการติดตั้ง Chrome หรือ Chromium ที่รองรับเดสก์ท็อป
- การเข้าถึง CDP สำหรับการทำงานอัตโนมัติของเบราว์เซอร์
- VNC หรือ noVNC สำหรับการกู้สถานการณ์
- Node 22 และ pnpm
- เช็กเอาต์ OpenClaw และแคช dependency
- แคชเบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และหน่วยความจำเพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว เบราว์เซอร์หนึ่งตัว และการรันโมเดลหนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, ผู้ให้บริการโมเดล และโบรกเกอร์ข้อมูลรับรอง

VM ไม่ควรเก็บความลับดิบระยะยาวไว้นอกที่เก็บข้อมูลรับรองหรือ
ที่เก็บโปรไฟล์เบราว์เซอร์ที่คาดไว้

## ความลับ

ความลับอยู่ในความลับระดับองค์กรหรือ repository ของ GitHub สำหรับการรันระยะไกล และอยู่ใน
ไฟล์ความลับที่ควบคุมโดยผู้ปฏิบัติการในเครื่องสำหรับการรันในเครื่อง

ชื่อความลับที่แนะนำ:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลดอาร์ติแฟกต์ GitHub สาธารณะ
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

ระยะยาว พูลข้อมูลรับรอง Convex ควรยังเป็นแหล่งปกติสำหรับข้อมูลรับรอง
การขนส่งแบบสด ความลับ GitHub ใช้บูตสแตรปโบรกเกอร์และเลนสำรอง
เวิร์กโฟลว์ปฏิกิริยาสถานะ Discord จะแมปความลับ Mantis Crabbox กลับไปยัง
ตัวแปรสภาพแวดล้อม `CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN`
ที่ Crabbox CLI คาดหวัง ชื่อความลับ GitHub แบบธรรมดา `CRABBOX_*` ยังคง
ยอมรับเป็นทางสำรองเพื่อความเข้ากันได้

ตัวรัน Mantis ต้องไม่พิมพ์:

- โทเค็นบอต Discord
- คีย์ API ของผู้ให้บริการ
- คุกกี้เบราว์เซอร์
- เนื้อหาโปรไฟล์การยืนยันตัวตน
- รหัสผ่าน VNC
- payload ข้อมูลรับรองดิบ

การอัปโหลดอาร์ติแฟกต์สาธารณะควรปกปิดเมทาดาทาเป้าหมาย Discord ด้วย เช่น id ของบอต,
guild, ช่อง และข้อความ เวิร์กโฟลว์ smoke ของ GitHub เปิดใช้
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หากโทเค็นถูกวางลงใน issue, PR, แชต หรือบันทึกโดยไม่ตั้งใจ ให้หมุนเวียนโทเค็นนั้น
หลังจากเก็บความลับใหม่แล้ว

## อาร์ติแฟกต์ GitHub และความคิดเห็น PR

เวิร์กโฟลว์ Mantis ควรอัปโหลดชุดหลักฐานเต็มเป็นอาร์ติแฟกต์ Actions
อายุสั้น เมื่อเวิร์กโฟลว์ถูกรันสำหรับรายงานบั๊กหรือ PR แก้ไข ก็ควร
เผยแพร่ภาพหน้าจอ PNG ที่ปกปิดแล้วไปยัง branch `qa-artifacts` และ upsert
ความคิดเห็นบนบั๊กหรือ PR แก้ไขนั้น พร้อมภาพหน้าจอก่อน/หลังแบบฝัง อย่าโพสต์
หลักฐานหลักไว้เฉพาะบน PR ระบบอัตโนมัติ QA ทั่วไป บันทึกดิบ ข้อความที่สังเกตได้
และหลักฐานขนาดใหญ่อื่นๆ ให้อยู่ในอาร์ติแฟกต์ Actions

เวิร์กโฟลว์ production ควรโพสต์ความคิดเห็นเหล่านั้นด้วย Mantis GitHub App ไม่ใช่
ด้วย `github-actions[bot]` เก็บ app id และ private key เป็นความลับ GitHub Actions
`MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY`
เวิร์กโฟลว์ใช้ marker ที่ซ่อนไว้เป็นคีย์ upsert อัปเดตความคิดเห็นนั้นเมื่อ
โทเค็นสามารถแก้ไขได้ และสร้างความคิดเห็นใหม่ที่ Mantis เป็นเจ้าของเมื่อ
marker เก่าที่บอตเป็นเจ้าของไม่สามารถแก้ไขได้

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

เมื่อการรันล้มเหลวเพราะ harness ล้มเหลว ความคิดเห็นต้องบอกเช่นนั้น
แทนที่จะสื่อว่าตัว candidate ล้มเหลว

## หมายเหตุการปรับใช้แบบส่วนตัว

การปรับใช้แบบส่วนตัวอาจมีแอปพลิเคชัน Mantis Discord อยู่แล้ว ให้นำแอปพลิเคชันนั้นมาใช้ซ้ำ
แทนการสร้างแอปใหม่ เมื่อแอปนั้นมีสิทธิ์บอตที่ถูกต้อง
และสามารถหมุนเวียนได้อย่างปลอดภัย

ตั้งช่องแจ้งเตือนผู้ปฏิบัติการเริ่มต้นผ่านความลับหรือการกำหนดค่าการปรับใช้
ช่องนี้สามารถชี้ไปยังช่องผู้ดูแลหรือปฏิบัติการที่มีอยู่ก่อน
แล้วค่อยย้ายไปยังช่อง Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่ guild id, channel id, โทเค็นบอต, คุกกี้เบราว์เซอร์ หรือรหัสผ่าน VNC
ไว้ในเอกสารนี้ ให้เก็บไว้ในความลับ GitHub, โบรกเกอร์ข้อมูลรับรอง หรือ
ที่เก็บความลับในเครื่องของผู้ปฏิบัติการ

## การเพิ่มสถานการณ์

สถานการณ์ Mantis ควรประกาศ:

- id และชื่อเรื่อง
- การขนส่ง
- ข้อมูลรับรองที่ต้องใช้
- นโยบาย ref ของ baseline
- นโยบาย ref ของ candidate
- แพตช์การกำหนดค่า OpenClaw
- ขั้นตอนการตั้งค่า
- สิ่งกระตุ้น
- oracle ของ baseline ที่คาดหวัง
- oracle ของ candidate ที่คาดหวัง
- เป้าหมายการจับภาพ
- งบประมาณ timeout
- ขั้นตอนการล้างข้อมูล

สถานการณ์ควรเลือกใช้ oracle ขนาดเล็กและมีชนิดข้อมูล:

- สถานะ reaction ของ Discord สำหรับบั๊ก reaction
- การอ้างอิงข้อความ Discord สำหรับบั๊ก threading
- ts ของเธรด Slack และสถานะ API reaction สำหรับบั๊ก Slack
- id ข้อความอีเมลและ headers สำหรับบั๊กอีเมล
- ภาพหน้าจอเบราว์เซอร์เมื่อ UI เป็นสิ่งสังเกตได้ที่เชื่อถือได้เพียงอย่างเดียว

การตรวจสอบด้วย vision ควรเป็นส่วนเสริม หาก API ของแพลตฟอร์มสามารถพิสูจน์บั๊กได้ ให้ใช้
API เป็น oracle ผ่าน/ไม่ผ่าน และเก็บภาพหน้าจอไว้เพื่อความมั่นใจของมนุษย์

## การขยายผู้ให้บริการ

หลังจาก Discord ตัวรันเดียวกันสามารถเพิ่ม:

- Slack: reactions, threads, app mentions, modals, file uploads.
- อีเมล: การยืนยันตัวตน Gmail และ threading ของข้อความโดยใช้ `gog` เมื่อ connector ไม่
  เพียงพอ
- WhatsApp: การเข้าสู่ระบบด้วย QR, การระบุตัวตนซ้ำ, การส่งข้อความ, สื่อ, reactions
- Telegram: การควบคุมการ mention กลุ่ม, คำสั่ง, reactions เมื่อพร้อมใช้งาน
- Matrix: ห้องเข้ารหัส, ความสัมพันธ์ของ thread หรือ reply, การกลับมาทำงานต่อหลัง restart

แต่ละการขนส่งควรมีสถานการณ์ smoke ราคาถูกหนึ่งรายการ และสถานการณ์ตามคลาสบั๊กหนึ่งรายการขึ้นไป
สถานการณ์ภาพที่มีค่าใช้จ่ายสูงควรเป็นแบบ opt-in

## คำถามที่ยังเปิดอยู่

- บอต Discord ใดควรเป็น driver และบอตใดควรเป็น SUT เมื่อใช้บอต Mantis
  ที่มีอยู่ซ้ำ?
- การเข้าสู่ระบบเบราว์เซอร์ของผู้สังเกตการณ์ควรใช้บัญชี Discord ของมนุษย์ บัญชีทดสอบ
  หรือเฉพาะหลักฐาน REST ที่บอตอ่านได้สำหรับเฟสแรก?
- GitHub ควรเก็บอาร์ติแฟกต์ Mantis สำหรับ PR นานเท่าใด?
- เมื่อใดที่ ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติแทนการรอ
  คำสั่งจากผู้ดูแล?
- ภาพหน้าจอควรถูกปกปิดหรือตัดก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่?
