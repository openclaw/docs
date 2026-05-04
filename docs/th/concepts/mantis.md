---
read_when:
    - การสร้างหรือเรียกใช้การตรวจสอบคุณภาพเชิงภาพแบบสดสำหรับข้อบกพร่องของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึง
    - การเพิ่มสถานการณ์การรับส่งแบบสดสำหรับ Discord, Slack, WhatsApp หรืออื่นๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ การทำงานอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบแบบต้นทางถึงปลายทางเชิงภาพสำหรับจำลองบั๊กของ OpenClaw บนทรานสปอร์ตที่ใช้งานจริง เก็บหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์กับ PR
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-04T07:03:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis คือระบบตรวจสอบแบบ end-to-end ของ OpenClaw สำหรับบั๊กที่ต้องใช้ runtime จริง, transport จริง และหลักฐานที่มองเห็นได้ ระบบจะรัน scenario กับ ref ที่ทราบว่าเสีย, จับหลักฐาน, รัน scenario เดียวกันกับ ref ผู้สมัคร, แล้วเผยแพร่การเปรียบเทียบเป็นอาร์ติแฟกต์ที่ maintainer สามารถตรวจสอบได้จาก PR หรือจากคำสั่งภายในเครื่อง

Mantis เริ่มจาก Discord เพราะ Discord ให้ lane แรกที่มีคุณค่าสูงแก่เรา: การยืนยันตัวตนบอทจริง, ช่อง guild จริง, reaction, thread, คำสั่ง native และ UI บนเบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่า transport แสดงอะไร

## เป้าหมาย

- จำลองบั๊กจาก GitHub issue หรือ PR ด้วยรูปแบบ transport เดียวกับที่ผู้ใช้เห็น
- จับอาร์ติแฟกต์ **before** บน ref baseline ก่อนนำ fix มาใช้
- จับอาร์ติแฟกต์ **after** บน ref ผู้สมัครหลังนำ fix มาใช้
- ใช้ oracle แบบ deterministic เมื่อเป็นไปได้ เช่น การอ่าน reaction ผ่าน Discord REST หรือการตรวจสอบ transcript ของช่อง
- จับภาพหน้าจอเมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันภายในเครื่องจาก CLI ที่ agent ควบคุม และรันระยะไกลจาก GitHub
- เก็บสถานะของเครื่องให้เพียงพอสำหรับการกู้ผ่าน VNC เมื่อการเข้าสู่ระบบ, การทำ browser automation หรือการยืนยันตัวตน provider ค้าง
- โพสต์สถานะอย่างกระชับไปยังช่อง Discord สำหรับ operator เมื่อการรันถูกบล็อก, ต้องการความช่วยเหลือผ่าน VNC แบบแมนนวล หรือเสร็จสิ้น

## สิ่งที่ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit tests โดยปกติการรัน Mantis ควรถูกเปลี่ยนเป็น regression test ที่เล็กลงหลังจากเข้าใจ fix แล้ว
- Mantis ไม่ใช่ gate CI ที่เร็วตามปกติ มันช้ากว่า, ใช้ credentials จริง และสงวนไว้สำหรับบั๊กที่สภาพแวดล้อมจริงมีความสำคัญ
- Mantis ไม่ควรต้องใช้มนุษย์สำหรับการทำงานปกติ VNC แบบแมนนวลเป็นเส้นทางกู้สถานการณ์ ไม่ใช่ happy path
- Mantis ไม่เก็บ secrets ดิบในอาร์ติแฟกต์, logs, screenshots, รายงาน Markdown หรือความคิดเห็นใน PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแต็ก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของ scenario runtime, transport adapters, evidence schema และ CLI ภายในเครื่องภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของชิ้นส่วน live transport harness, ตัวช่วยจับภาพเบราว์เซอร์ และ artifact writers
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นไว้แล้วเมื่อจำเป็นต้องใช้ VM ระยะไกล
- GitHub Actions เป็นเจ้าของ remote workflow entrypoint และการเก็บรักษาอาร์ติแฟกต์
- ClawSweeper เป็นเจ้าของการ routing ความคิดเห็น GitHub: การ parse คำสั่ง maintainer, การ dispatch workflow และการโพสต์ความคิดเห็น PR สุดท้าย
- OpenClaw agents ขับเคลื่อน Mantis ผ่าน Codex เมื่อ scenario ต้องมีการตั้งค่าแบบ agentic, การดีบัก หรือการรายงานสถานะค้าง

ขอบเขตนี้ทำให้ความรู้เรื่อง transport อยู่ใน OpenClaw, การจัดตารางเครื่องอยู่ใน Crabbox และส่วนเชื่อม workflow ของ maintainer อยู่ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่งภายในเครื่องคำสั่งแรกตรวจสอบบอท Discord, guild, ช่อง, การส่งข้อความ, การส่ง reaction และ path ของอาร์ติแฟกต์:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

runner before และ after ภายในเครื่องรับรูปแบบนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner สร้าง worktree ของ baseline และ candidate แบบ detached ภายใต้ไดเรกทอรี output, ติดตั้ง dependencies, build แต่ละ ref, รัน scenario ด้วย `--allow-failures` แล้วเขียน `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` สำหรับ scenario Discord แรก การตรวจสอบที่สำเร็จหมายความว่าสถานะ baseline คือ `fail` และสถานะ candidate คือ `pass`

primitive แรกของ VM/เบราว์เซอร์คือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

คำสั่งนี้เช่าหรือใช้เครื่องเดสก์ท็อป Crabbox ซ้ำ, เริ่มเบราว์เซอร์ที่มองเห็นได้ภายใน session VNC, จับภาพเดสก์ท็อป, ดึงอาร์ติแฟกต์กลับมายังไดเรกทอรี output ภายในเครื่อง และเขียนคำสั่ง reconnect ลงในรายงาน คำสั่งตั้งค่าเริ่มต้นเป็น provider Hetzner เพราะเป็น provider แรกที่มี coverage เดสก์ท็อป/VNC ใช้งานได้ใน lane ของ Mantis override ได้ด้วย `--provider`, `--crabbox-bin` หรือ `OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อรันกับ fleet Crabbox อื่น

flags ที่มีประโยชน์สำหรับ desktop smoke:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ใช้เดสก์ท็อปที่อุ่นไว้แล้วซ้ำ
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดในเบราว์เซอร์ที่มองเห็นได้
- `--html-file <path>` render อาร์ติแฟกต์ HTML ภายใน repo ในเบราว์เซอร์ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อจับ timeline reaction สถานะ Discord ที่สร้างขึ้นผ่านเดสก์ท็อป Crabbox จริง
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` คง lease ที่สร้างใหม่และผ่านไว้เปิดอยู่สำหรับการตรวจสอบผ่าน VNC การรันที่ล้มเหลวจะคง lease ไว้โดยค่าเริ่มต้นเมื่อมีการสร้าง lease เพื่อให้ operator reconnect ได้
- `--class`, `--idle-timeout` และ `--ttl` ปรับขนาดเครื่องและอายุของ lease

primitive transport เดสก์ท็อปแบบเต็มตัวแรกคือ Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนี้เช่าหรือใช้เครื่องเดสก์ท็อป Crabbox ซ้ำ, sync checkout ปัจจุบันเข้าไปใน VM, รัน `pnpm openclaw qa slack` ภายใน VM นั้น, เปิด Slack Web ในเบราว์เซอร์ VNC, จับภาพเดสก์ท็อปที่มองเห็นได้ และคัดลอกทั้งอาร์ติแฟกต์ Slack QA และ screenshot VNC กลับมายังไดเรกทอรี output ภายในเครื่อง นี่เป็นรูปแบบ Mantis แรกที่ทั้ง SUT OpenClaw gateway และเบราว์เซอร์อยู่ภายใน Linux desktop VM เดียวกัน

เมื่อใช้ `--gateway-setup` คำสั่งจะเตรียม home ของ OpenClaw แบบ disposable ที่คงอยู่ที่ `$HOME/.openclaw-mantis/slack-openclaw`, patch การกำหนดค่า Slack Socket Mode สำหรับช่องที่เลือก, เริ่ม `openclaw gateway run` บน port `38973` และคง Chrome ให้รันอยู่ใน session VNC นี่คือโหมด "ปล่อยเดสก์ท็อป Linux ที่มี Slack และ claw กำลังรันไว้ให้ฉัน"; lane Slack QA แบบ bot-to-bot ยังคงเป็นค่าเริ่มต้นเมื่อไม่ได้ระบุ `--gateway-setup`

inputs ที่จำเป็นสำหรับ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับ lane model ระยะไกล หากตั้งค่าเฉพาะ `OPENAI_API_KEY` ภายในเครื่อง Mantis จะ map ไปเป็น `OPENCLAW_LIVE_OPENAI_KEY` ก่อนเรียกใช้ Crabbox เพื่อให้การส่งต่อ env `OPENCLAW_*` ของ Crabbox พาเข้าไปใน VM ได้

flags Slack desktop ที่มีประโยชน์:

- `--lease-id <cbx_...>` รันซ้ำกับเครื่องที่ operator ได้เข้าสู่ระบบ Slack Web ผ่าน VNC ไว้แล้ว
- `--gateway-setup` เริ่ม OpenClaw Slack gateway แบบ persistent ใน VM แทนที่จะรันเฉพาะ lane QA แบบ bot-to-bot
- `--slack-url <url>` เปิด Slack Web URL เฉพาะ หากไม่มี Mantis จะ derive `https://app.slack.com/client/<team>/<channel>` จาก Slack `auth.test` เมื่อมี token บอท SUT
- `--slack-channel-id <id>` ควบคุม allowlist ของช่อง Slack ที่ใช้โดย gateway setup
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุมโปรไฟล์ Chrome แบบ persistent ภายใน VM ค่าเริ่มต้นคือ `$HOME/.config/openclaw-mantis/slack-chrome-profile` ดังนั้นการเข้าสู่ระบบ Slack Web แบบแมนนวลจะอยู่รอดในการรันซ้ำบน lease เดียวกัน
- `--credential-source convex --credential-role ci` ใช้ shared credential pool แทน Slack env tokens โดยตรง
- `--provider-mode`, `--model`, `--alt-model` และ `--fast` ส่งผ่านไปยัง Slack live lane

workflow smoke ของ GitHub คือ `Mantis Discord Smoke` workflow before และ after ของ GitHub สำหรับ scenario จริงแรกคือ `Mantis Discord Status Reactions` โดยรับ:

- `baseline_ref`: ref ที่คาดว่าจะจำลองพฤติกรรม queued-only ได้
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

มัน checkout ref ของ workflow harness, build worktree baseline และ candidate แยกกัน, รัน `discord-status-reactions-tool-only` กับแต่ละ worktree และ upload `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` เป็นอาร์ติแฟกต์ Actions นอกจากนี้ยัง render timeline HTML ของแต่ละ lane ในเบราว์เซอร์เดสก์ท็อป Crabbox และเผยแพร่ screenshot VNC เหล่านั้นไว้ข้าง PNG timeline แบบ deterministic ในความคิดเห็น PR workflow นี้ build Crabbox CLI จาก `openclaw/crabbox` main เพื่อให้สามารถใช้ flags lease เดสก์ท็อป/เบราว์เซอร์ปัจจุบันก่อนที่จะตัด release binary Crabbox ถัดไป

คุณยังสามารถ trigger การรัน status-reactions ได้โดยตรงจากความคิดเห็นใน PR:

```text
@Mantis discord status reactions
```

comment trigger นี้จงใจจำกัดขอบเขต มันรันเฉพาะบนความคิดเห็น pull request จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และรู้จักเฉพาะคำขอ status-reaction ของ Discord โดยค่าเริ่มต้นจะใช้ ref baseline ที่ทราบว่าเสีย และ SHA head ของ PR ปัจจุบันเป็น candidate Maintainers สามารถ override ref ใดก็ได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกเป็นคำสั่งแบบ explicit และเน้น scenario คำสั่งที่สองภายหลังสามารถ map PR หรือ issue ไปยัง scenario Mantis ที่แนะนำจาก labels, ไฟล์ที่เปลี่ยน และ findings จากการ review ของ ClawSweeper

## วงจรการรัน

1. ดึง credentials
2. จัดสรรหรือใช้ VM ซ้ำ
3. เตรียมโปรไฟล์เดสก์ท็อป/เบราว์เซอร์เมื่อ scenario ต้องการหลักฐาน UI
4. เตรียม checkout ที่สะอาดสำหรับ ref baseline
5. ติดตั้ง dependencies และ build เฉพาะสิ่งที่ scenario ต้องใช้
6. เริ่ม child OpenClaw Gateway ด้วยไดเรกทอรีสถานะแบบ isolated
7. กำหนดค่า live transport, provider, model และโปรไฟล์เบราว์เซอร์
8. รัน scenario และจับหลักฐาน baseline
9. หยุด gateway และเก็บ logs ไว้
10. เตรียม ref candidate ใน VM เดียวกัน
11. รัน scenario เดียวกันและจับหลักฐาน candidate
12. เปรียบเทียบผล oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, logs, screenshots และอาร์ติแฟกต์ trace แบบ optional
14. Upload อาร์ติแฟกต์ GitHub Actions
15. โพสต์ข้อความสถานะ PR หรือ Discord อย่างกระชับ

scenario ควรสามารถล้มเหลวได้สองแบบที่ต่างกัน:

- **จำลองบั๊กได้แล้ว**: baseline ล้มเหลวในลักษณะที่คาดไว้
- **Harness failure**: การตั้งค่าสภาพแวดล้อม, credentials, Discord API, เบราว์เซอร์ หรือ provider ล้มเหลวก่อนที่ bug oracle จะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้ออกจากกัน เพื่อให้ maintainers ไม่สับสนระหว่างสภาพแวดล้อมที่ flaky กับพฤติกรรมของผลิตภัณฑ์

## Discord MVP

scenario แรกควร target status reactions ของ Discord ในช่อง guild ที่ source reply delivery mode เป็น `message_tool_only`

เหตุผลที่เป็น seed ของ Mantis ที่ดี:

- มองเห็นได้ใน Discord เป็น reactions บนข้อความที่ trigger
- มี REST oracle ที่แข็งแรงผ่านสถานะ reaction ของข้อความ Discord
- ทดสอบ OpenClaw Gateway จริง, การยืนยันตัวตนบอท Discord, การ dispatch ข้อความ, source reply delivery mode, สถานะ status reaction และวงจรชีวิต model turn
- แคบพอที่จะทำให้การ implement แรกซื่อตรงต่อเป้าหมาย

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

หลักฐาน baseline ควรแสดง acknowledgement reaction แบบ queued แต่ไม่มี lifecycle transition ในโหมด tool-only หลักฐาน candidate ควรแสดง lifecycle status reactions ที่ทำงานเมื่อ `messages.statusReactions.enabled` เป็น true อย่าง explicit

slice แรกที่ executable คือ scenario Discord live QA แบบ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

กำหนดค่า SUT ให้เปิดการจัดการกิลด์ตลอดเวลา, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และรีแอ็กชันสถานะแบบชัดเจน oracle
จะโพลข้อความกระตุ้นจริงใน Discord และคาดหวังลำดับที่สังเกตได้
`👀 -> 🤔 -> 👍` artifact ประกอบด้วย `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` และ
`discord-status-reactions-tool-only-timeline.png`

## ชิ้นส่วน QA ที่มีอยู่

Mantis ควรต่อยอดจาก private QA stack ที่มีอยู่ แทนที่จะเริ่มจาก
ศูนย์:

- `pnpm openclaw qa discord` รันเลน Discord แบบ live พร้อมบอต driver และ
  SUT อยู่แล้ว
- live transport runner เขียนรายงานและ artifact ของข้อความที่สังเกตได้
  ไว้ใต้ `.artifacts/qa-e2e/` อยู่แล้ว
- lease ของข้อมูลรับรอง Convex ให้สิทธิ์เข้าถึงแบบเอกสิทธิ์แก่ข้อมูลรับรอง live
  transport ที่ใช้ร่วมกันอยู่แล้ว
- browser control service รองรับ screenshot, snapshot,
  โปรไฟล์ managed แบบ headless และโปรไฟล์ CDP ระยะไกลอยู่แล้ว
- QA Lab มี debugger UI และ bus สำหรับการทดสอบรูปทรง transport อยู่แล้ว

การใช้งาน Mantis ระยะแรกสามารถเป็น runner แบบ thin ก่อน/หลังครอบชิ้นส่วนเหล่านี้
พร้อมชั้นหลักฐานภาพหนึ่งชั้น

## โมเดลหลักฐาน

ทุกการรันเขียนไดเรกทอรี artifact ที่เสถียร:

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

`mantis-summary.json` ควรเป็นแหล่งข้อมูลจริงที่เครื่องอ่านได้
รายงาน Markdown มีไว้สำหรับคอมเมนต์ PR และการตรวจทานโดยมนุษย์

สรุปต้องประกอบด้วย:

- ref และ SHA ที่ทดสอบ
- transport และ scenario id
- ผู้ให้บริการเครื่องและ machine id หรือ lease id
- แหล่งข้อมูลรับรองโดยไม่มีค่าลับ
- ผลลัพธ์ baseline
- ผลลัพธ์ candidate
- บั๊กเกิดซ้ำบน baseline หรือไม่
- candidate แก้ไขได้หรือไม่
- path ของ artifact
- ปัญหาการตั้งค่าหรือการล้างข้อมูลที่ผ่านการทำให้ปลอดภัยแล้ว

Screenshot เป็นหลักฐาน ไม่ใช่ secret แต่ยังต้องมีวินัยในการ redaction:
ชื่อช่องส่วนตัว ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏได้ สำหรับ PR สาธารณะ
ควรใช้ลิงก์ artifact ของ GitHub Actions แทนรูปภาพแบบ inline จนกว่าเรื่อง
redaction จะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

เลนเบราว์เซอร์มีสองโหมด:

- **การทำงานอัตโนมัติแบบ headless**: ค่าเริ่มต้นสำหรับ CI Chrome รันโดยเปิดใช้ CDP
  และ Playwright หรือ browser control ของ OpenClaw จับภาพ screenshot
- **การกู้สถานการณ์ด้วย VNC**: เปิดใช้บน VM เดียวกันเมื่อ login, MFA,
  การป้องกัน automation ของ Discord หรือการ debug ด้วยภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ผู้สังเกตการณ์ Discord ควรมี persistence พอที่จะหลีกเลี่ยง
การ login ทุกการรัน แต่แยกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์เป็นของพูลเครื่อง
Mantis ไม่ใช่ของแล็ปท็อปนักพัฒนา

เมื่อ Mantis ติดขัด จะโพสต์ข้อความสถานะ Discord พร้อม:

- run id
- scenario id
- ผู้ให้บริการเครื่อง
- ไดเรกทอรี artifact
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความ blocker แบบสั้น

การ deploy แบบ private ครั้งแรกสามารถโพสต์ข้อความเหล่านี้ไปยังช่อง operator
ที่มีอยู่ แล้วค่อยย้ายไปช่อง Mantis เฉพาะในภายหลัง

## เครื่อง

Mantis ควรเลือกใช้ AWS ผ่าน Crabbox สำหรับ remote implementation ระยะแรก
Crabbox ให้เครื่องที่อุ่นไว้แล้ว, การติดตาม lease, hydration, log, ผลลัพธ์ และ
การล้างข้อมูล หาก capacity ของ AWS ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่ม provider
ของ Hetzner ไว้หลัง machine interface เดียวกัน

ข้อกำหนดขั้นต่ำของ VM:

- Linux ที่ติดตั้ง Chrome หรือ Chromium ซึ่งรองรับ desktop
- การเข้าถึง CDP สำหรับ browser automation
- VNC หรือ noVNC สำหรับการกู้สถานการณ์
- Node 22 และ pnpm
- checkout ของ OpenClaw และ dependency cache
- cache ของเบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และ memory เพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว เบราว์เซอร์หนึ่งตัว และ model run หนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, model provider และ credential broker

VM ไม่ควรเก็บ raw secret ที่มีอายุยาวนอก credential store หรือ browser profile
store ที่คาดไว้

## Secret

Secret อยู่ใน GitHub organization หรือ repository secrets สำหรับ remote run
และอยู่ในไฟล์ secret ที่ควบคุมโดย operator ในเครื่องสำหรับ local run

ชื่อ secret ที่แนะนำ:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลด artifact สาธารณะของ GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

ในระยะยาว credential pool ของ Convex ควรยังเป็นแหล่งปกติสำหรับข้อมูลรับรอง live
transport GitHub secrets ใช้ bootstrap broker และ fallback lane
workflow สำหรับ status reaction ของ Discord map secret ของ Mantis Crabbox กลับไปยัง
environment variable `CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN`
ที่ Crabbox CLI คาดหวัง ชื่อ GitHub secret แบบ plain `CRABBOX_*` ยังรองรับเป็น
fallback เพื่อความเข้ากันได้

Mantis runner ต้องไม่พิมพ์:

- token ของบอต Discord
- API key ของ provider
- cookie ของเบราว์เซอร์
- เนื้อหา auth profile
- รหัสผ่าน VNC
- payload ข้อมูลรับรองแบบ raw

การอัปโหลด artifact สาธารณะควร redact metadata เป้าหมายของ Discord เช่น bot,
guild, channel และ message id ด้วย GitHub smoke workflow เปิดใช้
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หาก token ถูกวางลงใน issue, PR, chat หรือ log โดยไม่ตั้งใจ ให้ rotate หลังจาก
จัดเก็บ secret ใหม่แล้ว

## GitHub Artifacts และคอมเมนต์ PR

workflow ของ Mantis ควรอัปโหลด evidence bundle ทั้งหมดเป็น artifact ของ Actions
ที่มีอายุสั้น เมื่อ workflow ถูกรันสำหรับรายงานบั๊กหรือ PR แก้ไข ควร publish
screenshot PNG ที่ผ่าน redaction แล้วไปยัง branch `qa-artifacts` และ upsert
คอมเมนต์บนบั๊กหรือ PR แก้ไขนั้นพร้อม screenshot ก่อน/หลังแบบ inline อย่าโพสต์
หลักฐานหลักไว้เฉพาะบน PR automation QA ทั่วไป raw log, ข้อความที่สังเกตได้ และ
หลักฐานขนาดใหญ่อื่น ๆ ให้อยู่ใน artifact ของ Actions

workflow production ควรโพสต์คอมเมนต์เหล่านั้นด้วย Mantis GitHub App ไม่ใช่ด้วย
`github-actions[bot]` เก็บ app id และ private key เป็น GitHub Actions
secrets ชื่อ `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY`
workflow ใช้ marker ที่ซ่อนอยู่เป็น upsert key, อัปเดตคอมเมนต์นั้นเมื่อ token
แก้ไขได้ และสร้างคอมเมนต์ใหม่ที่ Mantis เป็นเจ้าของเมื่อ marker เก่าที่บอตเป็นเจ้าของ
แก้ไขไม่ได้

คอมเมนต์ PR ควรสั้นและมีภาพ:

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

เมื่อการรันล้มเหลวเพราะ harness ล้มเหลว คอมเมนต์ต้องบอกเช่นนั้นแทนที่จะสื่อว่า
candidate ล้มเหลว

## หมายเหตุการ deploy แบบ private

การ deploy แบบ private อาจมี application Discord ของ Mantis อยู่แล้ว ให้ใช้
application นั้นซ้ำแทนการสร้าง app ใหม่เมื่อมี permission ของบอตที่ถูกต้องและสามารถ
rotate ได้อย่างปลอดภัย

ตั้งค่าช่องแจ้งเตือน operator เริ่มต้นผ่าน secret หรือ configuration ของ deployment
ช่องนี้สามารถชี้ไปที่ช่อง maintainer หรือ operations ที่มีอยู่ก่อน แล้วค่อยย้ายไปยัง
ช่อง Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่ guild id, channel id, bot token, cookie ของเบราว์เซอร์ หรือรหัสผ่าน VNC
ไว้ในเอกสารนี้ ให้เก็บไว้ใน GitHub secrets, credential broker หรือ local secret store
ของ operator

## การเพิ่ม scenario

scenario ของ Mantis ควรประกาศ:

- id และชื่อเรื่อง
- transport
- ข้อมูลรับรองที่ต้องใช้
- นโยบาย ref ของ baseline
- นโยบาย ref ของ candidate
- patch config ของ OpenClaw
- ขั้นตอนการตั้งค่า
- stimulus
- oracle ของ baseline ที่คาดหวัง
- oracle ของ candidate ที่คาดหวัง
- เป้าหมายการจับภาพ
- budget timeout
- ขั้นตอนการล้างข้อมูล

scenario ควรเลือกใช้ oracle ที่เล็กและมี type:

- สถานะ reaction ของ Discord สำหรับบั๊ก reaction
- การอ้างอิงข้อความ Discord สำหรับบั๊ก threading
- thread ts ของ Slack และสถานะ reaction API สำหรับบั๊ก Slack
- message id และ header ของอีเมลสำหรับบั๊กอีเมล
- screenshot ของเบราว์เซอร์เมื่อ UI เป็น observable เดียวที่เชื่อถือได้

การตรวจด้วย vision ควรเป็นแบบ additive หาก API ของแพลตฟอร์มสามารถพิสูจน์บั๊กได้
ให้ใช้ API เป็น oracle pass/fail และเก็บ screenshot ไว้เพื่อเพิ่มความมั่นใจให้มนุษย์

## การขยาย Provider

หลังจาก Discord แล้ว runner เดียวกันสามารถเพิ่ม:

- Slack: reaction, thread, app mention, modal, การอัปโหลดไฟล์
- อีเมล: auth ของ Gmail และ message threading โดยใช้ `gog` เมื่อ connector ไม่เพียงพอ
- WhatsApp: การ login ด้วย QR, การระบุตัวตนซ้ำ, การส่งข้อความ, สื่อ, reaction
- Telegram: gating การ mention ในกลุ่ม, command, reaction เมื่อพร้อมใช้งาน
- Matrix: ห้องที่เข้ารหัส, ความสัมพันธ์แบบ thread หรือ reply, การ resume หลัง restart

แต่ละ transport ควรมี smoke scenario ราคาถูกหนึ่งรายการ และ scenario ตามชนิดบั๊ก
หนึ่งรายการขึ้นไป scenario แบบ visual ที่มีค่าใช้จ่ายสูงควรเป็น opt-in

## คำถามเปิด

- บอต Discord ตัวใดควรเป็น driver และตัวใดควรเป็น SUT เมื่อใช้บอต Mantis ที่มีอยู่ซ้ำ?
- การ login เบราว์เซอร์ของ observer ควรใช้บัญชี Discord ของมนุษย์, บัญชีทดสอบ
  หรือใช้เฉพาะหลักฐาน REST ที่บอตอ่านได้สำหรับ phase แรก?
- GitHub ควรเก็บ artifact ของ Mantis สำหรับ PR ไว้นานเท่าใด?
- ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติเมื่อใด แทนที่จะรอ command จาก maintainer?
- ควร redact หรือ crop screenshot ก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่?
