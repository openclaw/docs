---
read_when:
    - การสร้างหรือเรียกใช้การตรวจสอบคุณภาพเชิงภาพแบบสดสำหรับบั๊กของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึง
    - การเพิ่มสถานการณ์การส่งผ่านข้อมูลแบบใช้งานจริงสำหรับ Discord, Slack, WhatsApp หรืออื่นๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ การทำงานอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบแบบ end-to-end ด้วยภาพ สำหรับทำซ้ำบั๊กของ OpenClaw บนทรานสปอร์ตแบบใช้งานจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์ไปยัง PRs.
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-06T09:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis คือระบบตรวจสอบแบบ end-to-end ของ OpenClaw สำหรับบั๊กที่ต้องใช้
runtime จริง, transport จริง, และหลักฐานที่มองเห็นได้ ระบบจะรัน scenario กับ ref
ที่ทราบว่าเสีย, เก็บหลักฐาน, รัน scenario เดิมกับ ref ผู้สมัคร, แล้วเผยแพร่การเปรียบเทียบเป็น artifact ที่ maintainer สามารถตรวจสอบได้จาก PR หรือ
จากคำสั่งในเครื่อง

Mantis เริ่มจาก Discord เพราะ Discord ให้เลนแรกที่มีคุณค่าสูงแก่เรา:
การยืนยันตัวตนบอทจริง, ช่อง guild จริง, reactions, threads, คำสั่ง native, และ
UI เบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยตาได้ว่า transport แสดงอะไร

## เป้าหมาย

- สร้างบั๊กจาก GitHub issue หรือ PR ซ้ำด้วยรูปแบบ transport เดียวกับที่ผู้ใช้
  เห็น
- เก็บ artifact **ก่อน** บน ref baseline ก่อนนำ fix ไปใช้
- เก็บ artifact **หลัง** บน ref ผู้สมัครหลังนำ fix ไปใช้
- ใช้ oracle ที่กำหนดผลได้ซ้ำเมื่อเป็นไปได้ เช่น การอ่าน reaction ผ่าน Discord REST
  หรือการตรวจ transcript ของช่อง
- เก็บ screenshot เมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันในเครื่องจาก CLI ที่ agent ควบคุม และรันระยะไกลจาก GitHub
- เก็บสถานะของเครื่องให้เพียงพอสำหรับกู้ผ่าน VNC เมื่อการเข้าสู่ระบบ, browser automation, หรือ
  auth ของ provider ติดขัด
- โพสต์สถานะสั้น ๆ ไปยังช่อง Discord ของ operator เมื่อการรันถูกบล็อก,
  ต้องการความช่วยเหลือ VNC แบบ manual, หรือเสร็จสิ้น

## สิ่งที่ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่ตัวแทนของ unit test โดยปกติการรัน Mantis ควรถูกแปลงเป็น
  regression test ที่เล็กลงหลังจากเข้าใจ fix แล้ว
- Mantis ไม่ใช่ gate CI แบบเร็วตามปกติ มันช้ากว่า, ใช้ credentials สด, และ
  สงวนไว้สำหรับบั๊กที่ live environment มีความสำคัญ
- Mantis ไม่ควรต้องมีมนุษย์สำหรับการทำงานปกติ Manual VNC เป็นเส้นทางกู้คืน
  ไม่ใช่เส้นทางหลัก
- Mantis ไม่เก็บ secret ดิบไว้ใน artifacts, logs, screenshots, รายงาน Markdown
  หรือคอมเมนต์ PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแต็ก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของ scenario runtime, transport adapters, evidence schema, และ
  CLI ในเครื่องภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของชิ้นส่วน live transport harness, helper สำหรับ browser capture, และ
  artifact writers
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นเครื่องไว้เมื่อจำเป็นต้องใช้ VM ระยะไกล
- GitHub Actions เป็นเจ้าของ workflow entrypoint ระยะไกลและการเก็บรักษา artifact
- ClawSweeper เป็นเจ้าของการ routing คอมเมนต์ GitHub: แยกวิเคราะห์คำสั่งของ maintainer,
  dispatch workflow, และโพสต์คอมเมนต์ PR สุดท้าย
- Agent ของ OpenClaw ขับ Mantis ผ่าน Codex เมื่อ scenario ต้องการการ setup แบบ agentic,
  การ debug, หรือการรายงานสถานะติดขัด

ขอบเขตนี้ทำให้ความรู้ด้าน transport อยู่ใน OpenClaw, การจัดตารางเครื่องอยู่ใน
Crabbox, และกาวของ workflow สำหรับ maintainer อยู่ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่งในเครื่องคำสั่งแรกตรวจสอบบอท Discord, guild, channel, การส่ง message,
การส่ง reaction, และ path ของ artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ตัวรันก่อนและหลังในเครื่องยอมรับรูปแบบนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ตัวรันสร้าง baseline และ candidate worktrees แบบ detached ใต้ไดเรกทอรี output,
ติดตั้ง dependencies, build แต่ละ ref, รัน scenario ด้วย
`--allow-failures`, จากนั้นเขียน `baseline/`, `candidate/`, `comparison.json`,
และ `mantis-report.md` สำหรับ Discord scenario แรก การตรวจสอบที่สำเร็จ
หมายถึงสถานะ baseline เป็น `fail` และสถานะ candidate เป็น `pass`

probe ก่อน/หลังของ Discord ตัวที่สองมุ่งเป้าไปที่ attachment ใน thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

scenario นั้นโพสต์ parent message ด้วย driver bot, สร้าง thread Discord จริง,
เรียก action `message.thread-reply` ของ OpenClaw ด้วย `filePath` ที่อยู่ใน repo,
จากนั้น poll thread เพื่อหา reply ของ SUT และชื่อไฟล์ attachment
screenshot ของ baseline แสดง reply ที่ไม่มี attachment; screenshot ของ candidate
แสดง attachment `mantis-thread-report.md` ตามที่คาดไว้

primitive VM/browser ตัวแรกคือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

มัน lease หรือ reuse เครื่อง desktop Crabbox, เริ่มเบราว์เซอร์ที่มองเห็นได้ภายใน
session VNC, จับภาพ desktop, ดึง artifact กลับมายังไดเรกทอรี output ในเครื่อง,
และเขียนคำสั่ง reconnect ลงในรายงาน คำสั่งตั้งค่าเริ่มต้นเป็น provider Hetzner
เพราะเป็น provider แรกที่มี coverage desktop/VNC ที่ทำงานได้ในเลน Mantis
override ด้วย `--provider`, `--crabbox-bin`, หรือ
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อรันกับ fleet Crabbox อื่น

flag ของ desktop smoke ที่มีประโยชน์:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reuse desktop ที่อุ่นเครื่องไว้
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดในเบราว์เซอร์ที่มองเห็นได้
- `--html-file <path>` render artifact HTML ใน repo ในเบราว์เซอร์ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อจับ timeline reaction สถานะ Discord ที่สร้างขึ้นผ่าน desktop Crabbox จริง
- `--browser-profile-dir <remote-path>` reuse Chrome user-data-dir ระยะไกล เพื่อให้ desktop Mantis แบบ persistent คงสถานะ logged in ระหว่างการรัน ใช้สิ่งนี้สำหรับ profile viewer Discord Web ที่ใช้งานระยะยาว
- `--browser-profile-archive-env <name>` restore archive Chrome user-data-dir `.tgz` แบบ base64 จาก environment variable ที่ระบุชื่อก่อน launch เบราว์เซอร์ ใช้สิ่งนี้สำหรับ witness ที่ logged in เช่น Discord Web env var เริ่มต้นคือ `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`
- `--video-duration <seconds>` ควบคุมความยาวการจับภาพ MP4 ใช้ระยะเวลาที่ยาวขึ้นสำหรับ web app ที่ logged in และช้า ซึ่งต้องใช้เวลา settle
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` คง lease ที่สร้างใหม่และผ่านไว้เปิดอยู่สำหรับการตรวจสอบผ่าน VNC การรันที่ล้มเหลวจะคง lease ไว้ตามค่าเริ่มต้นเมื่อมีการสร้างไว้ เพื่อให้ operator reconnect ได้
- `--class`, `--idle-timeout`, และ `--ttl` ปรับขนาดเครื่องและอายุของ lease

สำหรับหลักฐาน Discord Web, Mantis ใช้บัญชี viewer เฉพาะแทน
bot token live Discord API scenario ยังคงเป็น oracle: มันสร้าง
thread จริง, ส่ง `thread-reply` ของ SUT, และตรวจ attachment ผ่าน Discord
REST เมื่อกำหนด `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, scenario จะเขียน
artifact URL ของ Discord Web ด้วย เมื่อกำหนด `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`,
มันจะปล่อยให้ thread นั้นพร้อมใช้นานพอให้เบราว์เซอร์ที่ logged in เปิด
และบันทึกได้

workflow GitHub เปิด URL thread ของ candidate ใน Discord Web, จับภาพ
screenshot, บันทึก MP4, และสร้าง preview GIF ที่ trim แล้วเมื่อมี tooling media ของ Crabbox
พร้อมใช้งาน ควรใช้ path profile viewer แบบ persistent ที่กำหนดผ่าน
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, เพราะ archive profile Chrome เต็ม
อาจใหญ่เกินขีดจำกัดขนาด secret ของ GitHub สำหรับ profile ขนาดเล็ก/bootstrap,
workflow ยังสามารถ restore archive `.tgz` แบบ base64 จาก
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` ได้ด้วย หากไม่ได้กำหนด profile source
ใดไว้ workflow จะยังเผยแพร่ screenshot attachment baseline/candidate
แบบ deterministic และ log notice ว่าข้าม witness Discord Web ที่ logged in

primitive transport desktop แบบเต็มตัวแรกคือ Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

มัน lease หรือ reuse เครื่อง desktop Crabbox, sync checkout ปัจจุบันเข้าไปใน
VM, รัน `pnpm openclaw qa slack` ภายใน VM นั้น, เปิด Slack Web ในเบราว์เซอร์ VNC,
จับภาพ desktop ที่มองเห็นได้, และ copy ทั้ง artifact QA ของ Slack และ
screenshot VNC กลับมายังไดเรกทอรี output ในเครื่อง นี่คือรูปแบบ Mantis แรก
ที่ SUT OpenClaw gateway และเบราว์เซอร์ทั้งคู่อยู่ภายใน Linux desktop VM เดียวกัน

เมื่อใช้ `--gateway-setup`, คำสั่งจะเตรียม OpenClaw home แบบ disposable persistent
ที่ `$HOME/.openclaw-mantis/slack-openclaw`, patch การกำหนดค่า Slack Socket Mode
สำหรับช่องที่เลือก, start `openclaw gateway run` บน port
`38973`, และคง Chrome ให้รันอยู่ใน session VNC นี่คือ mode "ทิ้ง Linux desktop
พร้อม Slack และ claw ที่กำลังรันไว้ให้ฉัน"; เลน QA Slack แบบ bot-to-bot
ยังคงเป็นค่าเริ่มต้นเมื่อไม่ระบุ `--gateway-setup`

input ที่จำเป็นสำหรับ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับเลน model ระยะไกล หากตั้งค่าเฉพาะ
  `OPENAI_API_KEY` ในเครื่อง, Mantis จะ map ไปยัง `OPENCLAW_LIVE_OPENAI_KEY`
  ก่อนเรียก Crabbox เพื่อให้การ forward env `OPENCLAW_*` ของ Crabbox นำมัน
  เข้าไปใน VM ได้

เมื่อใช้ `--gateway-setup --credential-source convex`, Mantis จะ lease credential
Slack SUT จาก shared pool ก่อนสร้าง VM และ forward channel id, Socket Mode app token,
และ bot token ที่ lease มาเป็น runtime env `OPENCLAW_MANTIS_SLACK_*`
ภายใน desktop วิธีนี้ทำให้ workflow GitHub บางลง: ต้องการเพียง secret ของ
Convex broker ไม่ใช่ token ดิบของ Slack bot หรือ app

flag ของ Slack desktop ที่มีประโยชน์:

- `--lease-id <cbx_...>` rerun กับเครื่องที่ operator เข้าสู่ Slack Web ผ่าน VNC ไว้แล้ว
- `--gateway-setup` start OpenClaw Slack gateway แบบ persistent ใน VM แทนที่จะรันเฉพาะเลน QA แบบ bot-to-bot
- `--keep-lease` คง gateway VM ให้เปิดไว้สำหรับการตรวจสอบผ่าน VNC หลังสำเร็จ; `--no-keep-lease` หยุดเครื่องหลังเก็บ artifact
- `--slack-url <url>` เปิด URL Slack Web ที่ระบุ หากไม่มี Mantis จะ derive `https://app.slack.com/client/<team>/<channel>` จาก Slack `auth.test` เมื่อมี SUT bot token
- `--slack-channel-id <id>` ควบคุม allowlist ช่อง Slack ที่ใช้โดย gateway setup
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุม profile Chrome แบบ persistent ภายใน VM ค่าเริ่มต้นคือ `$HOME/.config/openclaw-mantis/slack-chrome-profile` ดังนั้นการ login Slack Web แบบ manual จะยังอยู่รอดในการ rerun บน lease เดียวกัน
- `--credential-source convex --credential-role ci` ใช้ shared credential pool แทน token env ของ Slack โดยตรง
- `--provider-mode`, `--model`, `--alt-model`, และ `--fast` ส่งต่อไปยังเลน live ของ Slack

workflow smoke ของ GitHub คือ `Mantis Discord Smoke` workflow GitHub ก่อนและหลัง
สำหรับ scenario จริงตัวแรกคือ `Mantis Discord Status Reactions` มันรับ:

- `baseline_ref`: ref ที่คาดว่าจะสร้างพฤติกรรม queued-only ซ้ำได้
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

มัน checkout ref ของ workflow harness, build worktrees baseline และ candidate
แยกกัน, รัน `discord-status-reactions-tool-only` กับแต่ละ worktree, และ
upload `baseline/`, `candidate/`, `comparison.json`, และ `mantis-report.md` เป็น
artifact ของ Actions มันยัง render timeline HTML ของแต่ละเลนในเบราว์เซอร์ desktop
Crabbox และเผยแพร่ screenshot VNC เหล่านั้นข้าง PNG timeline แบบ deterministic
ในคอมเมนต์ PR คอมเมนต์ PR เดียวกัน embed preview GIF แบบเบาที่ trim ตาม motion
ซึ่งสร้างโดย `crabbox media preview`, link ไปยัง clip MP4 ที่ trim ตาม motion
ตรงกัน, และเก็บไฟล์ MP4 desktop เต็มไว้สำหรับการตรวจสอบเชิงลึก screenshot
ยังอยู่ inline เพื่อการ review อย่างรวดเร็ว workflow build Crabbox CLI จาก
`openclaw/crabbox` main เพื่อให้ใช้ flag lease desktop/browser ปัจจุบันได้
ก่อนตัด release binary Crabbox ถัดไป

`Mantis Scenario` คือ entrypoint แบบ manual ทั่วไป มันรับ `scenario_id`,
`candidate_ref`, `baseline_ref` ที่ optional, และ `pr_number` ที่ optional, จากนั้น
dispatch workflow ที่ scenario เป็นเจ้าของ wrapper นี้ตั้งใจให้บาง:
workflow ของ scenario ยังคงเป็นเจ้าของ transport setup, credentials, VM class,
oracle ที่คาดไว้, และ manifest ของ artifact ของตัวเอง

`Mantis Slack Desktop Smoke` เป็น workflow VM สำหรับ Slack ตัวแรก โดย checkout ref ผู้สมัครที่เชื่อถือได้ใน worktree แยกต่างหาก เช่าเดสก์ท็อป Crabbox Linux รัน `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` กับผู้สมัครนั้น เปิด Slack Web ในเบราว์เซอร์ VNC บันทึกเดสก์ท็อป สร้างตัวอย่างที่ตัดเฉพาะช่วงมีการเคลื่อนไหวด้วย `crabbox media preview` อัปโหลดไดเรกทอรี artifact ทั้งหมด และเลือกโพสต์คอมเมนต์หลักฐานแบบ inline บน PR เป้าหมายได้ ค่าเริ่มต้นใช้ AWS สำหรับการเช่าเดสก์ท็อป และเปิดอินพุต provider แบบ manual เพื่อให้ผู้ปฏิบัติงานสลับไป Hetzner ได้เมื่อความจุ AWS ช้าหรือไม่พร้อมใช้งาน ใช้ lane นี้เมื่อคุณต้องการ “เดสก์ท็อป Linux ที่มี Slack และ claw กำลังรันอยู่” แทนที่จะมีเพียง transcript Slack แบบ bot-to-bot

ทุก scenario ที่เผยแพร่ไปยัง PR จะเขียน `mantis-evidence.json` ไว้ถัดจากรายงาน schema นี้เป็นจุดส่งต่อระหว่างโค้ด scenario และคอมเมนต์ GitHub:

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

ค่า `path` ของ artifact เป็น path ที่สัมพันธ์กับไดเรกทอรี manifest ค่า `targetPath` เป็น relative path ภายใต้ไดเรกทอรีเผยแพร่ของ branch `qa-artifacts` publisher จะปฏิเสธ path traversal และข้ามรายการที่ทำเครื่องหมาย `"required": false` เมื่อ preview หรือวิดีโอแบบ optional ไม่พร้อมใช้งาน

ชนิด artifact ที่รองรับ:

- `timeline`: ภาพหน้าจอ scenario แบบ deterministic โดยปกติใช้ก่อน/หลัง
- `desktopScreenshot`: ภาพหน้าจอเดสก์ท็อป VNC/เบราว์เซอร์
- `motionPreview`: GIF แบบเคลื่อนไหว inline ที่สร้างจากการบันทึกเดสก์ท็อป
- `motionClip`: MP4 ที่ตัดเฉพาะช่วงมีการเคลื่อนไหว โดยลบช่วงนิ่งตอนต้นและตอนท้าย
- `fullVideo`: การบันทึก MP4 ฉบับเต็มสำหรับตรวจสอบเชิงลึก
- `metadata`: sidecar JSON/log
- `report`: รายงาน Markdown

publisher ที่ใช้ซ้ำได้คือ `scripts/mantis/publish-pr-evidence.mjs` Workflows เรียกใช้งานพร้อม manifest, PR เป้าหมาย, root เป้าหมาย `qa-artifacts`, marker ของคอมเมนต์, URL artifact ของ Actions, URL run และแหล่งที่มาของคำขอ โดยจะคัดลอก artifact ที่ประกาศไว้ไปยัง branch `qa-artifacts` สร้างคอมเมนต์ PR แบบ summary-first พร้อมรูปภาพ/preview แบบ inline และวิดีโอที่ลิงก์ไว้ จากนั้นอัปเดตคอมเมนต์ marker ที่มีอยู่หรือสร้างใหม่

คุณยังสามารถเรียกใช้ status-reactions run ได้โดยตรงจากคอมเมนต์ PR:

```text
@Mantis discord status reactions
```

ตัว trigger จากคอมเมนต์ตั้งใจให้มีขอบเขตแคบ โดยจะรันเฉพาะบนคอมเมนต์ pull request จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และจะรู้จักเฉพาะคำขอ status-reaction ของ Discord เท่านั้น ค่าเริ่มต้นใช้ ref baseline ที่ทราบว่าเสีย และ SHA ของ head PR ปัจจุบันเป็น candidate maintainer สามารถ override ref ใด ref หนึ่งได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกระบุชัดเจนและมุ่งเน้น scenario คำสั่งที่สองในภายหลังสามารถ map PR หรือ issue ไปยัง scenario Mantis ที่แนะนำจาก labels, ไฟล์ที่เปลี่ยนแปลง และผลการ review ของ ClawSweeper

## วงจรชีวิตการรัน

1. รับ credentials
2. จัดสรรหรือนำ VM กลับมาใช้ซ้ำ
3. เตรียมเดสก์ท็อป/โปรไฟล์เบราว์เซอร์เมื่อ scenario ต้องการหลักฐาน UI
4. เตรียม checkout ที่สะอาดสำหรับ ref baseline
5. ติดตั้ง dependencies และ build เฉพาะสิ่งที่ scenario ต้องใช้
6. เริ่ม OpenClaw Gateway ลูกด้วยไดเรกทอรี state ที่แยกไว้
7. กำหนดค่า live transport, provider, model และโปรไฟล์เบราว์เซอร์
8. รัน scenario และบันทึกหลักฐาน baseline
9. หยุด Gateway และเก็บรักษา logs
10. เตรียม ref candidate ใน VM เดียวกัน
11. รัน scenario เดียวกันและบันทึกหลักฐาน candidate
12. เปรียบเทียบผล oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, logs, ภาพหน้าจอ และ artifact trace แบบ optional
14. อัปโหลด artifact ของ GitHub Actions
15. โพสต์ข้อความสถานะ PR หรือ Discord แบบกระชับ

scenario ควรล้มเหลวได้สองแบบที่แตกต่างกัน:

- **พบ bug ซ้ำได้**: baseline ล้มเหลวในรูปแบบที่คาดไว้
- **harness ล้มเหลว**: การตั้งค่าสภาพแวดล้อม, credentials, Discord API, เบราว์เซอร์ หรือ provider ล้มเหลวก่อนที่ bug oracle จะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้ออกจากกัน เพื่อไม่ให้ maintainer สับสนระหว่างสภาพแวดล้อมที่ flaky กับพฤติกรรมของผลิตภัณฑ์

## Discord MVP

scenario แรกควรมุ่งเป้าไปที่ status reactions ของ Discord ใน guild channels ที่โหมดส่ง reply ต้นทางคือ `message_tool_only`

เหตุผลที่เหมาะเป็น seed Mantis:

- มองเห็นได้ใน Discord เป็น reactions บนข้อความที่ trigger
- มี REST oracle ที่แข็งแรงผ่านสถานะ reaction ของข้อความ Discord
- ครอบคลุม OpenClaw Gateway จริง, auth ของ bot Discord, การ dispatch ข้อความ, โหมดส่ง reply ต้นทาง, สถานะ status reaction และวงจรชีวิต model turn
- แคบพอที่จะทำให้ implementation แรกตรงไปตรงมา

รูปทรง scenario ที่คาดไว้:

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

หลักฐาน baseline ควรแสดง acknowledgement reaction ที่อยู่ในคิว แต่ไม่มี lifecycle transition ในโหมด tool-only หลักฐาน candidate ควรแสดง status reactions ของ lifecycle ที่รันเมื่อ `messages.statusReactions.enabled` เป็น true อย่างชัดเจน

ส่วนแรกที่ executable คือ scenario Discord live QA แบบ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

โดยจะกำหนดค่า SUT ด้วยการจัดการ guild แบบ always-on, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และ status reactions แบบชัดเจน oracle จะ poll ข้อความจริงใน Discord ที่ trigger และคาดหวังลำดับที่สังเกตได้คือ `👀 -> 🤔 -> 👍` Artifacts ได้แก่ `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` และ `discord-status-reactions-tool-only-timeline.png`

## ชิ้นส่วน QA ที่มีอยู่

Mantis ควรต่อยอดจาก private QA stack ที่มีอยู่ แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รัน live Discord lane พร้อม driver และ bot SUT อยู่แล้ว
- live transport runner เขียนรายงานและ artifact observed-message ไว้ภายใต้ `.artifacts/qa-e2e/` อยู่แล้ว
- lease credentials ของ Convex ให้สิทธิ์เข้าถึง credentials ของ shared live transport แบบ exclusive อยู่แล้ว
- browser control service รองรับ screenshots, snapshots, โปรไฟล์ managed แบบ headless และโปรไฟล์ CDP ระยะไกลอยู่แล้ว
- QA Lab มี debugger UI และ bus สำหรับการทดสอบที่มีรูปทรงแบบ transport อยู่แล้ว

implementation แรกของ Mantis สามารถเป็น before/after runner แบบบาง ๆ ครอบชิ้นส่วนเหล่านี้ พร้อมชั้นหลักฐานภาพหนึ่งชั้น

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

`mantis-summary.json` ควรเป็นแหล่งความจริงที่ machine-readable รายงาน Markdown มีไว้สำหรับคอมเมนต์ PR และการ review โดยมนุษย์

summary ต้องมี:

- refs และ SHAs ที่ทดสอบ
- transport และ scenario id
- provider ของเครื่อง และ machine id หรือ lease id
- แหล่งที่มาของ credential โดยไม่มีค่า secret
- ผลลัพธ์ baseline
- ผลลัพธ์ candidate
- bug เกิดซ้ำบน baseline หรือไม่
- candidate แก้ได้หรือไม่
- path ของ artifact
- ปัญหาการตั้งค่าหรือ cleanup ที่ sanitize แล้ว

ภาพหน้าจอเป็นหลักฐาน ไม่ใช่ secrets อย่างไรก็ตามยังต้องมีวินัยในการ redact: ชื่อ channel ส่วนตัว, ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏได้ สำหรับ PR สาธารณะ ให้ใช้ลิงก์ artifact ของ GitHub Actions แทนรูปภาพ inline จนกว่าแนวทาง redaction จะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

browser lane มีสองโหมด:

- **การทำงานอัตโนมัติแบบ headless**: ค่าเริ่มต้นสำหรับ CI Chrome รันโดยเปิด CDP และ Playwright หรือ browser control ของ OpenClaw บันทึกภาพหน้าจอ
- **VNC rescue**: เปิดใช้บน VM เดียวกันเมื่อ login, MFA, การป้องกัน automation ของ Discord หรือการ debug ภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ Discord observer ควร persistent พอที่จะหลีกเลี่ยงการเข้าสู่ระบบทุก run แต่แยกจาก state เบราว์เซอร์ส่วนตัว โปรไฟล์เป็นของ machine pool ของ Mantis ไม่ใช่แล็ปท็อปของ developer

เมื่อ Mantis ติดค้าง จะโพสต์ข้อความสถานะ Discord พร้อม:

- run id
- scenario id
- machine provider
- ไดเรกทอรี artifact
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความ blocker สั้น ๆ

deployment ส่วนตัวแรกสามารถโพสต์ข้อความเหล่านี้ไปยัง channel operator ที่มีอยู่ และย้ายไป channel Mantis เฉพาะในภายหลัง

## เครื่อง

Mantis ควรเลือก AWS ผ่าน Crabbox สำหรับ implementation ระยะไกลตัวแรก Crabbox ให้เครื่องที่ warm ไว้, การติดตาม lease, hydration, logs, results และ cleanup หากความจุ AWS ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่ม provider Hetzner ภายใต้ machine interface เดียวกัน

ข้อกำหนดขั้นต่ำของ VM:

- Linux ที่มี Chrome หรือ Chromium install ซึ่งรองรับเดสก์ท็อป
- การเข้าถึง CDP สำหรับ browser automation
- VNC หรือ noVNC สำหรับ rescue
- Node 22 และ pnpm
- checkout ของ OpenClaw และ dependency cache
- cache เบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และหน่วยความจำเพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว, เบราว์เซอร์หนึ่งตัว และ model run หนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, model providers และ credential broker

VM ไม่ควรเก็บ raw secrets ที่มีอายุยาวไว้นอก credential store หรือ browser profile store ที่คาดไว้

## Secrets

Secrets อยู่ใน GitHub organization หรือ repository secrets สำหรับ remote runs และอยู่ในไฟล์ secret ที่ operator ควบคุมในเครื่องสำหรับ local runs

ชื่อ secret ที่แนะนำ:

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

ระยะยาว credential pool ของ Convex ควรยังคงเป็นแหล่งปกติสำหรับ live transport credentials GitHub secrets ใช้ bootstrap broker และ fallback lanes workflow status-reactions ของ Discord จะ map secrets Mantis Crabbox กลับไปเป็น environment variables `CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN` ที่ Crabbox CLI คาดหวัง ชื่อ GitHub secret แบบ plain `CRABBOX_*` ยังรองรับเป็น compatibility fallback

Mantis runner ต้องไม่พิมพ์:

- token ของ bot Discord
- API keys ของ provider
- cookies ของเบราว์เซอร์
- เนื้อหา auth profile
- รหัสผ่าน VNC
- raw credential payloads

การอัปโหลด artifact สาธารณะควร redact metadata เป้าหมายของ Discord เช่น bot, guild, channel และ message ids ด้วย workflow smoke ของ GitHub เปิดใช้ `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หาก token ถูกวางลงใน issue, PR, chat หรือ log โดยไม่ได้ตั้งใจ ให้ rotate token หลังจากเก็บ secret ใหม่แล้ว

## Artifacts ของ GitHub และคอมเมนต์ PR

เวิร์กโฟลว์ Mantis ควรอัปโหลดชุดหลักฐานเต็มรูปแบบเป็น artifact ของ Actions ที่มีอายุสั้น เมื่อเวิร์กโฟลว์ถูกรันสำหรับรายงานบั๊กหรือ PR แก้ไข ก็ควรเผยแพร่ภาพหน้าจอ PNG ที่ปกปิดข้อมูลแล้วไปยังแบรนช์ `qa-artifacts` และอัปเซิร์ตความคิดเห็นในบั๊กหรือ PR แก้ไขนั้นพร้อมภาพหน้าจอแบบอินไลน์ก่อน/หลัง อย่าโพสต์หลักฐานหลักไว้เฉพาะบน PR อัตโนมัติ QA ทั่วไปเท่านั้น บันทึกดิบ ข้อความที่สังเกตได้ และหลักฐานขนาดใหญ่อื่นๆ ให้อยู่ใน artifact ของ Actions

เวิร์กโฟลว์ Production ควรโพสต์ความคิดเห็นเหล่านั้นด้วย Mantis GitHub App ไม่ใช่ด้วย `github-actions[bot]` เก็บ app id และ private key เป็น GitHub Actions secrets ชื่อ `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY` เวิร์กโฟลว์ใช้ marker ที่ซ่อนไว้เป็นคีย์สำหรับการอัปเซิร์ต อัปเดตความคิดเห็นนั้นเมื่อ token สามารถแก้ไขได้ และสร้างความคิดเห็นใหม่ที่เป็นของ Mantis เมื่อ marker เก่าที่เป็นของบอตไม่สามารถแก้ไขได้

ความคิดเห็นใน PR ควรสั้นและเน้นภาพ:

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

เมื่อการรันล้มเหลวเพราะ harness ล้มเหลว ความคิดเห็นต้องระบุเช่นนั้น แทนที่จะสื่อว่าตัว candidate ล้มเหลว

## หมายเหตุการดีพลอยแบบส่วนตัว

การดีพลอยแบบส่วนตัวอาจมีแอปพลิเคชัน Mantis Discord อยู่แล้ว ให้ใช้แอปพลิเคชันนั้นซ้ำแทนการสร้างแอปใหม่เมื่อมีสิทธิ์บอตที่ถูกต้องและสามารถหมุนเวียนข้อมูลลับได้อย่างปลอดภัย

ตั้งค่าช่องทางแจ้งเตือน operator เริ่มต้นผ่าน secrets หรือการกำหนดค่าการดีพลอย ช่องทางนี้สามารถชี้ไปยังช่องทาง maintainer หรือ operations ที่มีอยู่ก่อน แล้วค่อยย้ายไปยังช่องทาง Mantis เฉพาะเมื่อมีช่องทางนั้นแล้ว

อย่าใส่ guild ids, channel ids, bot tokens, browser cookies หรือ VNC passwords ไว้ในเอกสารนี้ ให้เก็บไว้ใน GitHub secrets, credential broker หรือที่เก็บ secret ภายในเครื่องของ operator

## การเพิ่ม scenario

scenario ของ Mantis ควรประกาศ:

- id และชื่อเรื่อง
- transport
- credentials ที่จำเป็น
- นโยบาย baseline ref
- นโยบาย candidate ref
- แพตช์การกำหนดค่า OpenClaw
- ขั้นตอน setup
- stimulus
- baseline oracle ที่คาดหวัง
- candidate oracle ที่คาดหวัง
- เป้าหมาย visual capture
- งบประมาณ timeout
- ขั้นตอน cleanup

scenario ควรเลือกใช้ oracle ขนาดเล็กและมีชนิดข้อมูลชัดเจน:

- สถานะ reaction ของ Discord สำหรับบั๊ก reaction
- การอ้างอิงข้อความ Discord สำหรับบั๊ก threading
- thread ts และสถานะ reaction API ของ Slack สำหรับบั๊ก Slack
- message ids และ headers ของอีเมลสำหรับบั๊กอีเมล
- ภาพหน้าจอเบราว์เซอร์เมื่อ UI เป็น observable เดียวที่เชื่อถือได้

การตรวจด้วย vision ควรเป็นส่วนเสริม หาก platform API สามารถพิสูจน์บั๊กได้ ให้ใช้ API เป็น oracle แบบผ่าน/ไม่ผ่าน และเก็บภาพหน้าจอไว้เพื่อเพิ่มความมั่นใจให้มนุษย์

## การขยาย Provider

หลังจาก Discord รันเนอร์เดียวกันสามารถเพิ่ม:

- Slack: reactions, threads, app mentions, modals, file uploads
- Email: การยืนยันตัวตน Gmail และ message threading โดยใช้ `gog` เมื่อ connectors ไม่เพียงพอ
- WhatsApp: QR login, re-identification, message delivery, media, reactions
- Telegram: group mention gating, commands, reactions เมื่อพร้อมใช้งาน
- Matrix: encrypted rooms, thread หรือ reply relations, restart resume

แต่ละ transport ควรมี scenario smoke ราคาถูกหนึ่งรายการ และ scenario ตามกลุ่มบั๊กอย่างน้อยหนึ่งรายการ scenario เชิงภาพที่มีต้นทุนสูงควรเป็นแบบ opt-in

## คำถามที่ยังเปิดอยู่

- บอต Discord ใดควรเป็น driver และบอตใดควรเป็น SUT เมื่อใช้บอต Mantis ที่มีอยู่ซ้ำ?
- การเข้าสู่ระบบเบราว์เซอร์ observer ควรใช้บัญชี Discord ของมนุษย์ บัญชีทดสอบ หรือใช้เฉพาะหลักฐาน REST ที่บอตอ่านได้สำหรับเฟสแรก?
- GitHub ควรเก็บ artifact ของ Mantis สำหรับ PR ไว้นานเท่าใด?
- ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติเมื่อใด แทนที่จะรอคำสั่งจาก maintainer?
- ควรปกปิดข้อมูลหรือครอปภาพหน้าจอก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่?
