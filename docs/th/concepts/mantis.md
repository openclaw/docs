---
read_when:
    - การสร้างหรือเรียกใช้ QA เชิงภาพแบบสดสำหรับบั๊กของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึงข้อมูล
    - การเพิ่มสถานการณ์ของ Discord, Slack, WhatsApp หรือระบบรับส่งแบบสดอื่น ๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ ระบบอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบยืนยันแบบครบวงจรด้วยภาพสำหรับทำซ้ำบั๊กของ OpenClaw บนทรานสปอร์ตจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์ไปยังคำขอดึง (PR)
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-05T06:16:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis คือระบบตรวจสอบแบบครบวงจรของ OpenClaw สำหรับบั๊กที่ต้องใช้
runtime จริง, transport จริง และหลักฐานที่มองเห็นได้ ระบบจะรัน scenario กับ ref
ที่ทราบว่าเสีย จับหลักฐาน รัน scenario เดียวกันกับ ref ผู้สมัคร แล้ว
เผยแพร่การเปรียบเทียบเป็น artifact ที่ maintainer สามารถตรวจสอบได้จาก PR หรือ
จากคำสั่ง local

Mantis เริ่มจาก Discord เพราะ Discord ให้ lane แรกที่มีมูลค่าสูงแก่เรา:
การยืนยันตัวตนบอตจริง, ช่อง guild จริง, reaction, thread, คำสั่ง native และ
UI บนเบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่า transport แสดงอะไร

## เป้าหมาย

- ทำซ้ำบั๊กจาก GitHub issue หรือ PR ด้วยรูปแบบ transport เดียวกับที่ผู้ใช้
  เห็น
- จับ artifact **ก่อน** บน ref พื้นฐานก่อนใช้การแก้ไข
- จับ artifact **หลัง** บน ref ผู้สมัครหลังใช้การแก้ไข
- ใช้ oracle ที่กำหนดผลได้แน่นอนเมื่อเป็นไปได้ เช่น การอ่าน reaction ผ่าน
  Discord REST หรือการตรวจ transcript ของช่อง
- จับ screenshot เมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันแบบ local จาก CLI ที่ agent ควบคุม และรันแบบ remote จาก GitHub
- เก็บสถานะเครื่องให้เพียงพอสำหรับการกู้ผ่าน VNC เมื่อการเข้าสู่ระบบ,
  browser automation หรือการยืนยันตัวตน provider ติดขัด
- โพสต์สถานะที่กระชับไปยังช่อง Discord ของ operator เมื่อการรันถูกบล็อก,
  ต้องการความช่วยเหลือผ่าน VNC แบบ manual หรือเสร็จสิ้น

## ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit test โดยปกติการรัน Mantis ควรกลายเป็น
  regression test ที่เล็กลงหลังเข้าใจการแก้ไขแล้ว
- Mantis ไม่ใช่ gate CI แบบเร็วตามปกติ มันช้ากว่า ใช้ credential สด และ
  สงวนไว้สำหรับบั๊กที่สภาพแวดล้อมจริงมีความสำคัญ
- Mantis ไม่ควรต้องใช้มนุษย์ในการทำงานตามปกติ VNC แบบ manual เป็นเส้นทางกู้ภัย
  ไม่ใช่เส้นทางปกติ
- Mantis ไม่เก็บ secret ดิบไว้ใน artifact, log, screenshot, รายงาน Markdown
  หรือความคิดเห็น PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแต็ก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของ scenario runtime, transport adapter, schema หลักฐาน และ
  CLI local ภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของส่วน harness ของ transport สด, helper สำหรับจับภาพเบราว์เซอร์ และ
  artifact writer
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นไว้เมื่อจำเป็นต้องใช้ VM remote
- GitHub Actions เป็นเจ้าของ entrypoint ของ workflow remote และการเก็บรักษา artifact
- ClawSweeper เป็นเจ้าของการ routing ความคิดเห็น GitHub: การ parse คำสั่ง maintainer,
  dispatch workflow และโพสต์ความคิดเห็น PR สุดท้าย
- agent ของ OpenClaw ขับเคลื่อน Mantis ผ่าน Codex เมื่อ scenario ต้องการการตั้งค่าแบบ agentic,
  การดีบัก หรือการรายงานสถานะติดขัด

ขอบเขตนี้เก็บความรู้ด้าน transport ไว้ใน OpenClaw, การจัดตารางเครื่องไว้ใน
Crabbox และ glue ของ workflow maintainer ไว้ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่ง local แรกตรวจสอบบอต Discord, guild, ช่อง, การส่งข้อความ,
การส่ง reaction และ path artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

runner ก่อนและหลังแบบ local รับรูปแบบนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner สร้าง worktree พื้นฐานและผู้สมัครแบบ detached ภายใต้ไดเรกทอรี output,
ติดตั้ง dependency, build แต่ละ ref, รัน scenario ด้วย `--allow-failures` แล้วเขียน
`baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` สำหรับ
scenario Discord แรก การตรวจสอบที่สำเร็จหมายถึงสถานะ baseline คือ `fail`
และสถานะ candidate คือ `pass`

primitive VM/browser แรกคือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

มัน lease หรือ reuse เครื่องเดสก์ท็อป Crabbox, เริ่มเบราว์เซอร์ที่มองเห็นได้ภายใน
เซสชัน VNC, จับภาพเดสก์ท็อป, ดึง artifact กลับมาที่ไดเรกทอรี output local
และเขียนคำสั่ง reconnect ลงในรายงาน คำสั่ง default เป็น provider Hetzner
เพราะเป็น provider แรกที่มี coverage เดสก์ท็อป/VNC ที่ทำงานได้ใน lane Mantis
Override ได้ด้วย `--provider`, `--crabbox-bin` หรือ
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อรันกับ fleet Crabbox อื่น

flag desktop smoke ที่มีประโยชน์:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reuse เดสก์ท็อปที่อุ่นไว้
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดในเบราว์เซอร์ที่มองเห็นได้
- `--html-file <path>` render artifact HTML ภายใน repo ในเบราว์เซอร์ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อจับ timeline ของ Discord status-reaction ที่สร้างขึ้นผ่านเดสก์ท็อป Crabbox จริง
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` คง lease ที่สร้างใหม่และผ่านไว้สำหรับตรวจสอบผ่าน VNC การรันที่ล้มเหลวจะคง lease ไว้โดย default เมื่อมีการสร้างขึ้นเพื่อให้ operator reconnect ได้
- `--class`, `--idle-timeout` และ `--ttl` ปรับขนาดเครื่องและอายุ lease

primitive transport เดสก์ท็อปแบบเต็มแรกคือ Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

มัน lease หรือ reuse เครื่องเดสก์ท็อป Crabbox, sync checkout ปัจจุบันเข้าไปใน
VM, รัน `pnpm openclaw qa slack` ภายใน VM นั้น, เปิด Slack Web ในเบราว์เซอร์ VNC,
จับภาพเดสก์ท็อปที่มองเห็นได้ และคัดลอกทั้ง artifact Slack QA และ
screenshot VNC กลับมายังไดเรกทอรี output local นี่คือรูปแบบ Mantis แรก
ที่ Gateway OpenClaw ของ SUT และเบราว์เซอร์อยู่ภายใน VM เดสก์ท็อป Linux เดียวกัน

เมื่อใช้ `--gateway-setup` คำสั่งจะเตรียม home ของ OpenClaw แบบใช้แล้วทิ้งแต่คงอยู่ที่
`$HOME/.openclaw-mantis/slack-openclaw`, patch configuration ของ Slack Socket Mode
สำหรับช่องที่เลือก, เริ่ม `openclaw gateway run` บนพอร์ต
`38973` และคง Chrome ให้รันอยู่ในเซสชัน VNC นี่คือโหมด "ทิ้งเดสก์ท็อป
Linux ที่มี Slack และ claw รันอยู่ไว้ให้ฉัน"; lane Slack QA แบบ bot-to-bot
ยังคงเป็น default เมื่อไม่ได้ระบุ `--gateway-setup`

input ที่จำเป็นสำหรับ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับ lane model remote หากมีเพียง
  `OPENAI_API_KEY` ถูกตั้งค่าไว้แบบ local, Mantis จะ map ไปเป็น `OPENCLAW_LIVE_OPENAI_KEY`
  ก่อนเรียก Crabbox เพื่อให้การ forward env `OPENCLAW_*` ของ Crabbox นำเข้าไป
  ใน VM ได้

flag Slack desktop ที่มีประโยชน์:

- `--lease-id <cbx_...>` rerun กับเครื่องที่ operator เข้าสู่ระบบ Slack Web ผ่าน VNC ไว้แล้ว
- `--gateway-setup` เริ่ม Gateway Slack ของ OpenClaw แบบคงอยู่ใน VM แทนที่จะรันเฉพาะ lane QA แบบ bot-to-bot
- `--slack-url <url>` เปิด URL Slack Web ที่ระบุ หากไม่มี Mantis จะ derive `https://app.slack.com/client/<team>/<channel>` จาก Slack `auth.test` เมื่อมี token บอต SUT
- `--slack-channel-id <id>` ควบคุม allowlist ช่อง Slack ที่ใช้โดยการตั้งค่า Gateway
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุม profile Chrome แบบคงอยู่ภายใน VM ค่า default คือ `$HOME/.config/openclaw-mantis/slack-chrome-profile` ดังนั้นการเข้าสู่ระบบ Slack Web แบบ manual จะคงอยู่ข้ามการ rerun บน lease เดียวกัน
- `--credential-source convex --credential-role ci` ใช้ pool credential ร่วมแทน token env Slack โดยตรง
- `--provider-mode`, `--model`, `--alt-model` และ `--fast` pass through ไปยัง lane สดของ Slack

workflow smoke ของ GitHub คือ `Mantis Discord Smoke` workflow GitHub แบบก่อนและหลัง
สำหรับ scenario จริงแรกคือ `Mantis Discord Status Reactions` มันรับ:

- `baseline_ref`: ref ที่คาดว่าจะทำซ้ำพฤติกรรม queued-only
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

มัน checkout ref ของ workflow harness, build worktree พื้นฐานและผู้สมัครแยกกัน,
รัน `discord-status-reactions-tool-only` กับแต่ละ worktree และ
upload `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` เป็น
artifact ของ Actions นอกจากนี้ยัง render timeline HTML ของแต่ละ lane ในเบราว์เซอร์เดสก์ท็อป
Crabbox และเผยแพร่ screenshot VNC เหล่านั้นข้าง PNG timeline ที่กำหนดผลได้แน่นอน
ในความคิดเห็น PR ความคิดเห็น PR เดียวกัน link ไปยัง recording MP4 เดสก์ท็อป
ที่จับระหว่างการ render เบราว์เซอร์ VNC ส่วน screenshot ยังคง inline
เพื่อให้ review ได้เร็ว workflow build CLI Crabbox จาก
`openclaw/crabbox` main เพื่อให้ใช้ flag lease เดสก์ท็อป/เบราว์เซอร์ปัจจุบัน
ได้ก่อนตัด release binary Crabbox ถัดไป

คุณยังสามารถ trigger การรัน status-reactions โดยตรงจากความคิดเห็น PR:

```text
@Mantis discord status reactions
```

trigger ความคิดเห็นตั้งใจให้แคบ มันรันเฉพาะบนความคิดเห็น pull request
จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และรู้จำเฉพาะคำขอ
Discord status-reaction โดย default มันใช้ ref พื้นฐานที่ทราบว่าเสีย
และ SHA head ของ PR ปัจจุบันเป็นผู้สมัคร maintainer สามารถ override
ref ใดก็ได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกชัดเจนและเน้น scenario คำสั่งที่สองสามารถ map PR
หรือ issue ไปยัง scenario Mantis ที่แนะนำจาก label, ไฟล์ที่เปลี่ยน และ
ผลการ review ของ ClawSweeper ได้ในภายหลัง

## วงจรชีวิตการรัน

1. รับ credential
2. จัดสรรหรือ reuse VM
3. เตรียม profile เดสก์ท็อป/เบราว์เซอร์เมื่อ scenario ต้องการหลักฐาน UI
4. เตรียม checkout ที่สะอาดสำหรับ ref พื้นฐาน
5. ติดตั้ง dependency และ build เฉพาะสิ่งที่ scenario ต้องการ
6. เริ่ม Gateway OpenClaw child ด้วยไดเรกทอรีสถานะแยก
7. ตั้งค่า transport สด, provider, model และ profile เบราว์เซอร์
8. รัน scenario และจับหลักฐาน baseline
9. หยุด Gateway และเก็บ log ไว้
10. เตรียม ref ผู้สมัครใน VM เดียวกัน
11. รัน scenario เดียวกันและจับหลักฐานผู้สมัคร
12. เปรียบเทียบผล oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, log, screenshot และ artifact trace แบบ optional
14. Upload artifact ของ GitHub Actions
15. โพสต์ข้อความสถานะ PR หรือ Discord ที่กระชับ

scenario ควรล้มเหลวได้สองแบบที่ต่างกัน:

- **บั๊กถูกทำซ้ำแล้ว**: baseline ล้มเหลวในแบบที่คาดไว้
- **Harness failure**: การตั้งค่าสภาพแวดล้อม, credential, Discord API, เบราว์เซอร์ หรือ
  provider ล้มเหลวก่อนที่ bug oracle จะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้เพื่อให้ maintainer ไม่สับสนระหว่าง
สภาพแวดล้อมที่ flaky กับพฤติกรรมของผลิตภัณฑ์

## Discord MVP

scenario แรกควร target Discord status reaction ในช่อง guild ที่
source reply delivery mode คือ `message_tool_only`

เหตุผลที่เป็น seed Mantis ที่ดี:

- มองเห็นได้ใน Discord เป็น reaction บนข้อความที่ trigger
- มี REST oracle ที่แข็งแรงผ่านสถานะ reaction ของข้อความ Discord
- ครอบคลุม Gateway OpenClaw จริง, การยืนยันตัวตนบอต Discord, message dispatch,
  source reply delivery mode, สถานะ status reaction และ lifecycle ของ turn model
- แคบพอที่จะทำให้ implementation แรกตรงไปตรงมา

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

หลักฐาน baseline ควรแสดง acknowledgement reaction แบบ queued แต่ไม่มี
การเปลี่ยน lifecycle ในโหมด tool-only หลักฐาน candidate ควรแสดง lifecycle
status reaction ทำงานเมื่อ `messages.statusReactions.enabled` เป็น true
อย่างชัดเจน

slice แรกที่ executable ได้คือ scenario QA สดของ Discord แบบ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

คำสั่งนี้กำหนดค่า SUT ด้วยการจัดการกิลด์แบบเปิดตลอดเวลา, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และรีแอ็กชันสถานะที่ระบุชัดเจน oracle
จะโพลข้อความทริกเกอร์จริงใน Discord และคาดหวังลำดับที่สังเกตได้เป็น
`👀 -> 🤔 -> 👍` อาร์ติแฟกต์ประกอบด้วย `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` และ
`discord-status-reactions-tool-only-timeline.png`

## ส่วนประกอบ QA ที่มีอยู่

Mantis ควรต่อยอดจากสแต็ก QA ส่วนตัวที่มีอยู่ แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รันเลน Discord แบบสดพร้อมบอต driver และบอต
  SUT อยู่แล้ว
- runner ของทรานสปอร์ตสดเขียนรายงานและอาร์ติแฟกต์ข้อความที่สังเกตได้ไว้ใต้
  `.artifacts/qa-e2e/` อยู่แล้ว
- สัญญาเช่าข้อมูลประจำตัวของ Convex ให้สิทธิ์เข้าถึงแบบเอกสิทธิ์ต่อข้อมูลประจำตัวทรานสปอร์ตสดที่ใช้ร่วมกันอยู่แล้ว
- บริการควบคุมเบราว์เซอร์รองรับสกรีนช็อต, snapshot,
  โปรไฟล์ที่จัดการแบบ headless และโปรไฟล์ CDP ระยะไกลอยู่แล้ว
- QA Lab มี UI ดีบักเกอร์และบัสสำหรับการทดสอบที่มีรูปทรงแบบทรานสปอร์ตอยู่แล้ว

การใช้งาน Mantis ระยะแรกอาจเป็น runner แบบก่อน/หลังที่บาง ๆ ครอบส่วนประกอบเหล่านี้
พร้อมชั้นหลักฐานภาพหนึ่งชั้น

## โมเดลหลักฐาน

ทุกรันเขียนไดเรกทอรีอาร์ติแฟกต์ที่เสถียร:

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

`mantis-summary.json` ควรเป็นแหล่งความจริงที่เครื่องอ่านได้ รายงาน Markdown
มีไว้สำหรับคอมเมนต์ใน PR และการรีวิวโดยมนุษย์

สรุปต้องมี:

- refs และ SHA ที่ทดสอบ
- ทรานสปอร์ตและ id ของสถานการณ์
- ผู้ให้บริการเครื่องและ id ของเครื่องหรือ id ของสัญญาเช่า
- แหล่งข้อมูลประจำตัวโดยไม่มีค่าลับ
- ผลลัพธ์ของ baseline
- ผลลัพธ์ของ candidate
- บั๊กเกิดซ้ำบน baseline หรือไม่
- candidate แก้ได้หรือไม่
- พาธอาร์ติแฟกต์
- ปัญหาการตั้งค่าหรือการล้างข้อมูลที่ผ่านการทำให้ปลอดภัยแล้ว

สกรีนช็อตเป็นหลักฐาน ไม่ใช่ความลับ แต่ยังต้องมีวินัยในการปกปิดข้อมูล:
ชื่อช่องส่วนตัว, ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏได้ สำหรับ PR สาธารณะ
ให้ใช้ลิงก์อาร์ติแฟกต์ของ GitHub Actions แทนรูปภาพแบบ inline จนกว่าเรื่องการปกปิดข้อมูลจะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

เลนเบราว์เซอร์มีสองโหมด:

- **การทำงานอัตโนมัติแบบ headless**: ค่าเริ่มต้นสำหรับ CI Chrome รันโดยเปิดใช้ CDP
  และ Playwright หรือการควบคุมเบราว์เซอร์ของ OpenClaw จะจับสกรีนช็อต
- **การช่วยเหลือผ่าน VNC**: เปิดใช้บน VM เดียวกันเมื่อการเข้าสู่ระบบ, MFA,
  การป้องกันระบบอัตโนมัติของ Discord หรือการดีบักภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ observer ของ Discord ควร persistent เพียงพอเพื่อหลีกเลี่ยงการเข้าสู่ระบบทุกครั้ง
แต่แยกออกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์เป็นของพูลเครื่อง Mantis
ไม่ใช่แล็ปท็อปของนักพัฒนา

เมื่อ Mantis ติดขัด จะโพสต์ข้อความสถานะ Discord พร้อม:

- run id
- scenario id
- ผู้ให้บริการเครื่อง
- ไดเรกทอรีอาร์ติแฟกต์
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความตัวบล็อกแบบสั้น

การปรับใช้ส่วนตัวครั้งแรกสามารถโพสต์ข้อความเหล่านี้ไปยังช่อง operator ที่มีอยู่
แล้วค่อยย้ายไปยังช่อง Mantis เฉพาะในภายหลัง

## เครื่อง

Mantis ควรใช้ AWS ผ่าน Crabbox เป็นตัวเลือกหลักสำหรับการใช้งานระยะไกลครั้งแรก
Crabbox ให้เครื่องที่อุ่นไว้แล้ว, การติดตามสัญญาเช่า, hydration, logs, results และ
cleanup หาก AWS capacity ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่มผู้ให้บริการ Hetzner
ไว้หลังอินเทอร์เฟซเครื่องเดียวกัน

ข้อกำหนดขั้นต่ำของ VM:

- Linux พร้อมการติดตั้ง Chrome หรือ Chromium ที่รองรับเดสก์ท็อป
- การเข้าถึง CDP สำหรับการทำงานอัตโนมัติของเบราว์เซอร์
- VNC หรือ noVNC สำหรับการช่วยเหลือ
- Node 22 และ pnpm
- checkout ของ OpenClaw และแคช dependency
- แคชเบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และหน่วยความจำเพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว, เบราว์เซอร์หนึ่งตัว และการรันโมเดลหนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, ผู้ให้บริการโมเดล และ broker ข้อมูลประจำตัว

VM ไม่ควรเก็บ raw secret ที่มีอายุยาวนอก credential store หรือ browser profile store ที่คาดไว้

## ความลับ

ความลับอยู่ใน GitHub organization หรือ repository secrets สำหรับการรันระยะไกล
และอยู่ในไฟล์ลับที่ operator ควบคุมในเครื่องสำหรับการรัน local

ชื่อ secret ที่แนะนำ:

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

ระยะยาว พูลข้อมูลประจำตัวของ Convex ควรยังเป็นแหล่งปกติสำหรับข้อมูลประจำตัวทรานสปอร์ตสด
GitHub secrets ใช้ bootstrap broker และเลน fallback
workflow status-reactions ของ Discord map ความลับ Mantis Crabbox กลับไปเป็นตัวแปรสภาพแวดล้อม
`CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN`
ที่ Crabbox CLI คาดหวัง ชื่อ GitHub secret แบบธรรมดา `CRABBOX_*`
ยังคงรับได้เป็น fallback สำหรับความเข้ากันได้

runner ของ Mantis ต้องไม่พิมพ์:

- โทเค็นบอต Discord
- API key ของผู้ให้บริการ
- คุกกี้เบราว์เซอร์
- เนื้อหาโปรไฟล์ auth
- รหัสผ่าน VNC
- payload ข้อมูลประจำตัวดิบ

การอัปโหลดอาร์ติแฟกต์สาธารณะควรปกปิด metadata เป้าหมายของ Discord เช่น bot,
guild, channel และ message ids ด้วย workflow smoke ของ GitHub เปิดใช้
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หากโทเค็นถูกวางลงใน issue, PR, chat หรือ log โดยไม่ตั้งใจ ให้หมุนเวียนโทเค็นนั้น
หลังจากเก็บ secret ใหม่แล้ว

## อาร์ติแฟกต์ GitHub และคอมเมนต์ PR

workflow ของ Mantis ควรอัปโหลดชุดหลักฐานเต็มเป็นอาร์ติแฟกต์ Actions อายุสั้น
เมื่อ workflow ถูกรันสำหรับรายงานบั๊กหรือ PR แก้ไข ก็ควรเผยแพร่สกรีนช็อต PNG
ที่ปกปิดข้อมูลแล้วไปยัง branch `qa-artifacts` และ upsert คอมเมนต์บนบั๊กหรือ PR แก้ไขนั้น
พร้อมสกรีนช็อต before/after แบบ inline อย่าโพสต์หลักฐานหลักไว้เฉพาะบน PR ระบบอัตโนมัติ QA ทั่วไป
log ดิบ, ข้อความที่สังเกตได้ และหลักฐานขนาดใหญ่อื่น ๆ ให้อยู่ในอาร์ติแฟกต์ Actions

workflow production ควรโพสต์คอมเมนต์เหล่านั้นด้วย Mantis GitHub App
ไม่ใช่ด้วย `github-actions[bot]` เก็บ app id และ private key เป็น GitHub Actions
secrets ชื่อ `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY`
workflow ใช้ marker ที่ซ่อนอยู่เป็น upsert key, อัปเดตคอมเมนต์นั้นเมื่อ token แก้ไขได้
และสร้างคอมเมนต์ใหม่ที่ Mantis เป็นเจ้าของเมื่อ marker เก่าที่บอตเป็นเจ้าของไม่สามารถแก้ไขได้

คอมเมนต์ PR ควรสั้นและเป็นภาพ:

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

เมื่อการรันล้มเหลวเพราะ harness ล้มเหลว คอมเมนต์ต้องบอกเช่นนั้น
แทนที่จะสื่อว่า candidate ล้มเหลว

## หมายเหตุการปรับใช้ส่วนตัว

การปรับใช้ส่วนตัวอาจมีแอปพลิเคชัน Mantis Discord อยู่แล้ว
ให้ใช้แอปพลิเคชันนั้นซ้ำแทนการสร้างแอปอีกตัวเมื่อมีสิทธิ์บอตที่ถูกต้อง
และสามารถหมุนเวียนได้อย่างปลอดภัย

ตั้งค่าช่องแจ้งเตือน operator เริ่มต้นผ่าน secrets หรือการกำหนดค่าการปรับใช้
ตอนแรกอาจชี้ไปที่ช่อง maintainer หรือ operations ที่มีอยู่
จากนั้นค่อยย้ายไปยังช่อง Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่ guild ids, channel ids, bot tokens, browser cookies หรือ VNC passwords
ไว้ในเอกสารนี้ ให้เก็บไว้ใน GitHub secrets, credential broker หรือ secret store local ของ operator

## การเพิ่มสถานการณ์

สถานการณ์ Mantis ควรประกาศ:

- id และ title
- ทรานสปอร์ต
- ข้อมูลประจำตัวที่ต้องใช้
- นโยบาย ref ของ baseline
- นโยบาย ref ของ candidate
- แพตช์ config ของ OpenClaw
- ขั้นตอนการตั้งค่า
- stimulus
- oracle ของ baseline ที่คาดหวัง
- oracle ของ candidate ที่คาดหวัง
- เป้าหมายการจับภาพ
- งบประมาณ timeout
- ขั้นตอน cleanup

สถานการณ์ควรใช้ oracle แบบเล็กและมี type เป็นหลัก:

- สถานะรีแอ็กชัน Discord สำหรับบั๊กรีแอ็กชัน
- reference ข้อความ Discord สำหรับบั๊ก threading
- thread ts ของ Slack และสถานะ reaction API สำหรับบั๊ก Slack
- id ข้อความอีเมลและ header สำหรับบั๊กอีเมล
- สกรีนช็อตเบราว์เซอร์เมื่อ UI เป็นสิ่งที่สังเกตได้อย่างน่าเชื่อถือเพียงอย่างเดียว

การตรวจสอบด้วย vision ควรเป็นแบบเสริม หาก platform API สามารถพิสูจน์บั๊กได้
ให้ใช้ API เป็น oracle ผ่าน/ไม่ผ่าน และเก็บสกรีนช็อตไว้เพื่อความมั่นใจของมนุษย์

## การขยายผู้ให้บริการ

หลังจาก Discord แล้ว runner เดียวกันสามารถเพิ่ม:

- Slack: รีแอ็กชัน, thread, app mention, modal, การอัปโหลดไฟล์
- Email: auth ของ Gmail และการ thread ข้อความโดยใช้ `gog` ในจุดที่ connector ไม่เพียงพอ
- WhatsApp: การเข้าสู่ระบบด้วย QR, การระบุตัวตนซ้ำ, การส่งข้อความ, media, รีแอ็กชัน
- Telegram: การ gate การ mention ในกลุ่ม, คำสั่ง, รีแอ็กชันเมื่อมีให้ใช้
- Matrix: ห้องเข้ารหัส, ความสัมพันธ์ thread หรือ reply, การ resume หลัง restart

แต่ละทรานสปอร์ตควรมีสถานการณ์ smoke ราคาถูกหนึ่งรายการและสถานการณ์ตามคลาสบั๊กหนึ่งรายการขึ้นไป
สถานการณ์ภาพที่มีต้นทุนสูงควรยังเป็นแบบ opt-in

## คำถามที่ยังเปิดอยู่

- บอต Discord ใดควรเป็น driver และบอตใดควรเป็น SUT เมื่อใช้บอต Mantis ที่มีอยู่ซ้ำ?
- การเข้าสู่ระบบเบราว์เซอร์ observer ควรใช้บัญชี Discord ของมนุษย์, บัญชีทดสอบ
  หรือใช้เฉพาะหลักฐาน REST ที่บอตอ่านได้ในเฟสแรก?
- GitHub ควรเก็บอาร์ติแฟกต์ Mantis สำหรับ PR นานเท่าใด?
- ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติเมื่อใด แทนที่จะรอคำสั่งจาก
  maintainer?
- ควรปกปิดหรือตัดครอบสกรีนช็อตก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่?
