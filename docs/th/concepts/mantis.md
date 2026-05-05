---
read_when:
    - การสร้างหรือเรียกใช้การประกันคุณภาพด้านภาพแบบสดสำหรับข้อบกพร่องของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึง
    - การเพิ่มสถานการณ์การรับส่งแบบสดสำหรับ Discord, Slack, WhatsApp หรืออื่น ๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ ระบบอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบยืนยันแบบต้นทางถึงปลายทางด้วยภาพ สำหรับจำลองบั๊กของ OpenClaw ซ้ำบนทรานสปอร์ตจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์กับคำขอดึงการเปลี่ยนแปลง
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-05T10:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2db0e0ba75da831f29cc5312e9468db7d3a91d97f0b7a8c8f30c51bd128d148c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis เป็นระบบตรวจสอบแบบ end-to-end ของ OpenClaw สำหรับบั๊กที่ต้องใช้ runtime จริง, transport จริง และหลักฐานที่มองเห็นได้ ระบบจะรัน scenario กับ ref ที่ทราบว่าเสีย เก็บหลักฐาน รัน scenario เดิมกับ candidate ref แล้วเผยแพร่การเปรียบเทียบเป็น artifact ที่ maintainer สามารถตรวจสอบได้จาก PR หรือจากคำสั่ง local

Mantis เริ่มจาก Discord เพราะ Discord ให้ lane แรกที่มีคุณค่าสูงแก่เรา: การยืนยันตัวตน bot จริง, guild channel จริง, reaction, thread, native command และ browser UI ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่า transport แสดงอะไร

## เป้าหมาย

- สร้างบั๊กจาก GitHub issue หรือ PR ซ้ำด้วยรูปทรง transport แบบเดียวกับที่ผู้ใช้เห็น
- เก็บ artifact **ก่อน** บน baseline ref ก่อนนำ fix ไปใช้
- เก็บ artifact **หลัง** บน candidate ref หลังนำ fix ไปใช้
- ใช้ oracle ที่กำหนดซ้ำได้เมื่อเป็นไปได้ เช่น การอ่าน reaction ผ่าน Discord REST หรือการตรวจสอบ channel transcript
- เก็บ screenshot เมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันจาก CLI ที่ agent ควบคุมแบบ local และรันจาก GitHub แบบ remote
- เก็บสถานะเครื่องให้เพียงพอสำหรับการกู้ผ่าน VNC เมื่อ login, browser automation หรือ provider auth ติดขัด
- โพสต์สถานะอย่างกระชับไปยัง operator Discord channel เมื่อ run ถูกบล็อก ต้องการความช่วยเหลือ VNC แบบ manual หรือเสร็จสิ้น

## ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit test โดยปกติ Mantis run ควรถูกย่อเป็น regression test ที่เล็กลงหลังจากเข้าใจ fix แล้ว
- Mantis ไม่ใช่ CI gate แบบเร็วตามปกติ มันช้ากว่า ใช้ credential จริง และสงวนไว้สำหรับบั๊กที่สภาพแวดล้อมจริงมีความสำคัญ
- Mantis ไม่ควรต้องใช้มนุษย์สำหรับการทำงานปกติ VNC แบบ manual เป็นเส้นทางกู้คืน ไม่ใช่ happy path
- Mantis ไม่เก็บ secret ดิบไว้ใน artifact, log, screenshot, รายงาน Markdown หรือ PR comment

## ความเป็นเจ้าของ

Mantis อยู่ในสแตก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของ scenario runtime, transport adapter, evidence schema และ local CLI ภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของชิ้นส่วน live transport harness, browser capture helper และ artifact writer
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นไว้เมื่อจำเป็นต้องใช้ remote VM
- GitHub Actions เป็นเจ้าของ entrypoint ของ remote workflow และการเก็บรักษา artifact
- ClawSweeper เป็นเจ้าของการ route comment ของ GitHub: การ parse คำสั่ง maintainer, dispatch workflow และโพสต์ PR comment สุดท้าย
- OpenClaw agent ขับเคลื่อน Mantis ผ่าน Codex เมื่อ scenario ต้องใช้การตั้งค่าแบบ agentic, debugging หรือรายงานสถานะที่ติดขัด

ขอบเขตนี้เก็บความรู้ด้าน transport ไว้ใน OpenClaw, การจัดตารางเครื่องไว้ใน Crabbox และกาวเชื่อม workflow ของ maintainer ไว้ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่ง local แรกตรวจสอบ Discord bot, guild, channel, การส่ง message, การส่ง reaction และ artifact path:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

runner แบบ local ก่อนและหลังรับรูปแบบนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner สร้าง baseline และ candidate worktree แบบ detached ใต้ output directory, ติดตั้ง dependency, build แต่ละ ref, รัน scenario ด้วย `--allow-failures` จากนั้นเขียน `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` สำหรับ Discord scenario แรก การตรวจสอบที่สำเร็จหมายความว่า baseline status เป็น `fail` และ candidate status เป็น `pass`

primitive VM/browser แรกคือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

คำสั่งนี้เช่าหรือใช้เครื่อง desktop ของ Crabbox ซ้ำ, เปิด browser ที่มองเห็นได้ภายใน VNC session, จับภาพ desktop, ดึง artifact กลับมายัง local output directory และเขียนคำสั่ง reconnect ลงในรายงาน คำสั่งตั้งค่าเริ่มต้นเป็น provider Hetzner เพราะเป็น provider แรกที่มี coverage desktop/VNC ที่ทำงานได้ใน Mantis lane แทนที่ได้ด้วย `--provider`, `--crabbox-bin` หรือ `OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อรันกับ Crabbox fleet อื่น

flag desktop smoke ที่มีประโยชน์:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ใช้ desktop ที่อุ่นไว้ซ้ำ
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดใน browser ที่มองเห็นได้
- `--html-file <path>` render artifact HTML แบบ repo-local ใน browser ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อจับ timeline Discord status-reaction ที่ generate แล้วผ่าน desktop Crabbox จริง
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` คง lease ที่สร้างใหม่และผ่านไว้เปิดอยู่สำหรับการตรวจสอบผ่าน VNC run ที่ล้มเหลวจะคง lease ไว้เป็นค่าเริ่มต้นเมื่อมีการสร้าง lease เพื่อให้ operator reconnect ได้
- `--class`, `--idle-timeout` และ `--ttl` ปรับขนาดเครื่องและอายุ lease

primitive transport desktop แบบเต็มตัวแรกคือ Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

คำสั่งนี้เช่าหรือใช้เครื่อง desktop ของ Crabbox ซ้ำ, sync checkout ปัจจุบันเข้าไปใน VM, รัน `pnpm openclaw qa slack` ภายใน VM นั้น, เปิด Slack Web ใน VNC browser, จับภาพ desktop ที่มองเห็นได้ และคัดลอกทั้ง artifact ของ Slack QA และ VNC screenshot กลับมายัง local output directory นี่เป็นรูปแบบ Mantis แรกที่ SUT OpenClaw gateway และ browser อยู่ภายใน Linux desktop VM เดียวกัน

เมื่อใช้ `--gateway-setup` คำสั่งจะเตรียม home ของ OpenClaw แบบ disposable ที่ persistent ที่ `$HOME/.openclaw-mantis/slack-openclaw`, patch การกำหนดค่า Slack Socket Mode สำหรับ channel ที่เลือก, เริ่ม `openclaw gateway run` บน port `38973` และคง Chrome ให้รันใน VNC session นี่คือโหมด “ทิ้ง Linux desktop ที่มี Slack และ claw กำลังรันไว้ให้ฉัน”; lane Slack QA แบบ bot-to-bot ยังคงเป็นค่าเริ่มต้นเมื่อไม่ระบุ `--gateway-setup`

input ที่จำเป็นสำหรับ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับ lane model แบบ remote หากตั้งค่าเฉพาะ `OPENAI_API_KEY` แบบ local Mantis จะ map ไปเป็น `OPENCLAW_LIVE_OPENAI_KEY` ก่อนเรียก Crabbox เพื่อให้การ forward env `OPENCLAW_*` ของ Crabbox นำเข้า VM ได้

เมื่อใช้ `--gateway-setup --credential-source convex` Mantis จะ lease credential ของ Slack SUT จาก pool ที่ใช้ร่วมกันก่อนสร้าง VM และ forward channel id ที่ lease, Socket Mode app token และ bot token เป็น runtime env `OPENCLAW_MANTIS_SLACK_*` ภายใน desktop วิธีนี้ทำให้ GitHub workflow บางลง: ต้องการแค่ secret ของ Convex broker ไม่ใช่ token ดิบของ Slack bot หรือ app

flag Slack desktop ที่มีประโยชน์:

- `--lease-id <cbx_...>` รันซ้ำกับเครื่องที่ operator login เข้า Slack Web ผ่าน VNC ไว้แล้ว
- `--gateway-setup` เริ่ม OpenClaw Slack gateway แบบ persistent ใน VM แทนที่จะรันเฉพาะ lane QA แบบ bot-to-bot
- `--slack-url <url>` เปิด Slack Web URL เฉพาะ หากไม่มี Mantis จะ derive `https://app.slack.com/client/<team>/<channel>` จาก Slack `auth.test` เมื่อ SUT bot token พร้อมใช้งาน
- `--slack-channel-id <id>` ควบคุม allowlist ของ Slack channel ที่ใช้โดย gateway setup
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุม Chrome profile แบบ persistent ภายใน VM ค่าเริ่มต้นคือ `$HOME/.config/openclaw-mantis/slack-chrome-profile` ดังนั้นการ login Slack Web แบบ manual จะอยู่รอดในการรันซ้ำบน lease เดิม
- `--credential-source convex --credential-role ci` ใช้ shared credential pool แทน token env Slack โดยตรง
- `--provider-mode`, `--model`, `--alt-model` และ `--fast` ส่งต่อไปยัง Slack live lane

GitHub smoke workflow คือ `Mantis Discord Smoke` workflow ของ GitHub แบบก่อนและหลังสำหรับ scenario จริงตัวแรกคือ `Mantis Discord Status Reactions` โดยรับ:

- `baseline_ref`: ref ที่คาดว่าจะสร้างพฤติกรรม queued-only ซ้ำ
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

มัน checkout workflow harness ref, build baseline และ candidate worktree แยกกัน, รัน `discord-status-reactions-tool-only` กับแต่ละ worktree และ upload `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` เป็น artifact ของ Actions นอกจากนี้ยัง render timeline HTML ของแต่ละ lane ใน Crabbox desktop browser และเผยแพร่ VNC screenshot เหล่านั้นไว้ข้าง PNG timeline แบบ deterministic ใน PR comment PR comment เดียวกันฝัง preview GIF น้ำหนักเบาที่ตัด motion แล้วซึ่ง generate โดย `crabbox media preview`, link ไปยังคลิป MP4 ที่ตัด motion แล้วที่ตรงกัน และคงไฟล์ MP4 desktop แบบเต็มไว้สำหรับการตรวจสอบเชิงลึก screenshot ยังคง inline เพื่อการ review อย่างรวดเร็ว workflow build Crabbox CLI จาก `openclaw/crabbox` main เพื่อให้ใช้ flag lease desktop/browser ปัจจุบันได้ก่อนตัด Crabbox binary release ถัดไป

`Mantis Scenario` คือ entrypoint แบบ manual ทั่วไป มันรับ `scenario_id`, `candidate_ref`, `baseline_ref` แบบ optional และ `pr_number` แบบ optional จากนั้น dispatch workflow ที่ scenario เป็นเจ้าของ wrapper ตั้งใจให้บาง: workflow ของ scenario ยังคงเป็นเจ้าของการตั้งค่า transport, credential, VM class, oracle ที่คาดหวัง และ artifact manifest ของตนเอง

`Mantis Slack Desktop Smoke` คือ Slack VM workflow แรก มัน checkout candidate ref ที่ trusted ใน worktree แยก, lease Linux desktop ของ Crabbox, รัน `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` กับ candidate นั้น, เปิด Slack Web ใน VNC browser, บันทึก desktop, generate preview ที่ตัด motion ด้วย `crabbox media preview`, upload artifact directory แบบเต็ม และโพสต์ comment หลักฐาน inline บน PR เป้าหมายแบบ optional ใช้ lane นี้เมื่อคุณต้องการ “Linux desktop ที่มี Slack และ claw กำลังรัน” แทนที่จะมีแค่ transcript Slack แบบ bot-to-bot

ทุก scenario ที่เผยแพร่ไปยัง PR จะเขียน `mantis-evidence.json` ไว้ข้างรายงาน schema นี้คือ handoff ระหว่าง scenario code กับ GitHub comment:

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

ค่า `path` ของ artifact เป็น relative ต่อ directory ของ manifest ค่า `targetPath` เป็น relative path ใต้ publish directory ของ branch `qa-artifacts` publisher ปฏิเสธ path traversal และข้าม entry ที่ทำเครื่องหมาย `"required": false` เมื่อ preview หรือ video แบบ optional ไม่พร้อมใช้งาน

kind ของ artifact ที่รองรับ:

- `timeline`: screenshot ของ scenario แบบ deterministic โดยปกติเป็นก่อน/หลัง
- `desktopScreenshot`: screenshot ของ desktop VNC/browser
- `motionPreview`: GIF แบบ animated inline ที่ generate จาก recording ของ desktop
- `motionClip`: MP4 ที่ตัด motion แล้วซึ่งลบ lead-in และ tail ที่ค้างนิ่ง
- `fullVideo`: recording MP4 แบบเต็มสำหรับการตรวจสอบเชิงลึก
- `metadata`: JSON/log sidecar
- `report`: รายงาน Markdown

publisher ที่นำกลับมาใช้ซ้ำได้คือ `scripts/mantis/publish-pr-evidence.mjs` workflow เรียกด้วย manifest, target PR, target root ของ `qa-artifacts`, comment marker, Actions artifact URL, run URL และ request source มันคัดลอก artifact ที่ประกาศไว้ไปยัง branch `qa-artifacts`, สร้าง PR comment แบบ summary-first พร้อมรูปภาพ/preview inline และ video ที่ลิงก์ไว้ จากนั้นอัปเดต marker comment ที่มีอยู่หรือสร้างใหม่

คุณยัง trigger การรัน status-reactions ได้โดยตรงจาก PR comment:

```text
@Mantis discord status reactions
```

ทริกเกอร์ความคิดเห็นถูกตั้งใจให้มีขอบเขตแคบ โดยจะทำงานเฉพาะกับความคิดเห็นใน pull request จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และจะรู้จำเฉพาะคำขอสถานะ reaction ของ Discord เท่านั้น โดยค่าเริ่มต้นจะใช้ baseline ref ที่ทราบว่าเสีย และ SHA ของหัว PR ปัจจุบันเป็น candidate ผู้ดูแลสามารถ override ref ใดก็ได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกระบุชัดเจนและเน้น scenario โดยตรง ส่วนคำสั่งที่สองภายหลังสามารถ map PR หรือ issue ไปยัง scenario ของ Mantis ที่แนะนำได้จาก label, ไฟล์ที่เปลี่ยนแปลง และผลการ review ของ ClawSweeper

## วงจรชีวิตการรัน

1. รับ credentials
2. จัดสรรหรือใช้ VM เดิม
3. เตรียมโปรไฟล์เดสก์ท็อป/เบราว์เซอร์เมื่อ scenario ต้องการหลักฐานจาก UI
4. เตรียม checkout ที่สะอาดสำหรับ baseline ref
5. ติดตั้ง dependencies และ build เฉพาะสิ่งที่ scenario ต้องใช้
6. เริ่ม OpenClaw Gateway ลูกด้วยไดเรกทอรีสถานะแบบแยกส่วน
7. ตั้งค่า live transport, provider, model และโปรไฟล์เบราว์เซอร์
8. รัน scenario และบันทึกหลักฐาน baseline
9. หยุด gateway และเก็บ logs ไว้
10. เตรียม candidate ref ใน VM เดียวกัน
11. รัน scenario เดิมและบันทึกหลักฐาน candidate
12. เปรียบเทียบผลลัพธ์ของ oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, logs, screenshots และ artifacts trace เสริม
14. อัปโหลด artifacts ของ GitHub Actions
15. โพสต์ข้อความสถานะ PR หรือ Discord แบบกระชับ

scenario ควรสามารถล้มเหลวได้สองแบบที่แตกต่างกัน:

- **พบ bug ซ้ำ**: baseline ล้มเหลวตามรูปแบบที่คาดไว้
- **Harness ล้มเหลว**: การตั้งค่าสภาพแวดล้อม, credentials, Discord API, เบราว์เซอร์ หรือ provider ล้มเหลวก่อนที่ bug oracle จะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้ออกจากกัน เพื่อให้ผู้ดูแลไม่สับสนระหว่างสภาพแวดล้อมที่ไม่เสถียรกับพฤติกรรมของผลิตภัณฑ์

## Discord MVP

scenario แรกควรเจาะจง reaction สถานะของ Discord ในช่อง guild ที่โหมดการส่ง reply ต้นทางคือ `message_tool_only`

เหตุผลที่เหมาะเป็น seed แรกของ Mantis:

- มองเห็นได้ใน Discord เป็น reaction บนข้อความที่ trigger
- มี REST oracle ที่แข็งแรงผ่านสถานะ reaction ของข้อความ Discord
- ทดสอบ OpenClaw Gateway จริง, auth ของบอต Discord, การ dispatch ข้อความ, โหมดการส่ง reply ต้นทาง, สถานะ reaction และวงจรชีวิต turn ของ model
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

หลักฐาน baseline ควรแสดง acknowledgement reaction ที่ถูก queue แล้ว แต่ไม่มี lifecycle transition ในโหมด tool-only หลักฐาน candidate ควรแสดง reaction สถานะของ lifecycle ที่ทำงานเมื่อ `messages.statusReactions.enabled` ถูกตั้งเป็น true อย่างชัดเจน

ส่วนแรกที่ executable คือ scenario QA แบบ live ของ Discord ที่ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

คำสั่งนี้ตั้งค่า SUT ให้จัดการ guild แบบ always-on, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และ reaction สถานะแบบชัดเจน oracle จะ poll ข้อความจริงของ Discord ที่ trigger และคาดหวังลำดับที่สังเกตได้คือ `👀 -> 🤔 -> 👍` Artifacts รวมถึง `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` และ `discord-status-reactions-tool-only-timeline.png`

## ส่วนประกอบ QA ที่มีอยู่

Mantis ควรต่อยอดจาก private QA stack ที่มีอยู่ แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รัน live lane ของ Discord พร้อมบอต driver และ SUT อยู่แล้ว
- live transport runner เขียนรายงานและ artifacts ของ observed-message ไว้ใต้ `.artifacts/qa-e2e/` อยู่แล้ว
- Convex credential leases ให้สิทธิ์เข้าถึง credentials ของ shared live transport แบบ exclusive อยู่แล้ว
- browser control service รองรับ screenshots, snapshots, โปรไฟล์ managed แบบ headless และโปรไฟล์ CDP ระยะไกลอยู่แล้ว
- QA Lab มี debugger UI และ bus สำหรับการทดสอบที่มีรูปทรงเหมือน transport อยู่แล้ว

implementation แรกของ Mantis สามารถเป็น before/after runner บาง ๆ บนครื่องมือเหล่านี้ พร้อมชั้นหลักฐานภาพหนึ่งชั้น

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

`mantis-summary.json` ควรเป็นแหล่งความจริงที่เครื่องอ่านได้ ส่วนรายงาน Markdown มีไว้สำหรับความคิดเห็นใน PR และการ review โดยมนุษย์

summary ต้องมี:

- refs และ SHA ที่ทดสอบ
- transport และ scenario id
- machine provider และ machine id หรือ lease id
- แหล่งที่มาของ credential โดยไม่มีค่า secret
- ผลลัพธ์ baseline
- ผลลัพธ์ candidate
- bug เกิดซ้ำบน baseline หรือไม่
- candidate แก้ไขได้หรือไม่
- paths ของ artifacts
- ปัญหาการตั้งค่าหรือ cleanup ที่ผ่านการ sanitize แล้ว

Screenshots เป็นหลักฐาน ไม่ใช่ secrets แต่ยังต้องมีวินัยในการ redact: ชื่อช่องส่วนตัว, ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏขึ้น สำหรับ PR สาธารณะ ให้ใช้ลิงก์ artifact ของ GitHub Actions แทนรูปภาพ inline จนกว่าเรื่องการ redact จะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

browser lane มีสองโหมด:

- **Headless automation**: ค่าเริ่มต้นสำหรับ CI Chrome รันโดยเปิด CDP และ Playwright หรือ browser control ของ OpenClaw จะจับ screenshots
- **VNC rescue**: เปิดใช้งานบน VM เดียวกันเมื่อ login, MFA, การป้องกัน automation ของ Discord หรือการ debug ด้วยภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ observer ของ Discord ควร persistent พอที่จะไม่ต้อง login ทุกครั้งที่รัน แต่แยกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์เป็นของ machine pool ของ Mantis ไม่ใช่แล็ปท็อปของนักพัฒนา

เมื่อ Mantis ติดขัด จะโพสต์ข้อความสถานะ Discord พร้อม:

- run id
- scenario id
- machine provider
- ไดเรกทอรี artifact
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความ blocker สั้น ๆ

deployment ส่วนตัวแรกสามารถโพสต์ข้อความเหล่านี้ไปยังช่อง operator ที่มีอยู่ แล้วค่อยย้ายไปยังช่อง Mantis เฉพาะภายหลัง

## Machines

Mantis ควรเลือกใช้ AWS ผ่าน Crabbox สำหรับ implementation ระยะไกลแรก Crabbox ให้เครื่องที่ warm ไว้แล้ว, lease tracking, hydration, logs, results และ cleanup หาก capacity ของ AWS ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่ม Hetzner provider ไว้หลัง machine interface เดียวกัน

ข้อกำหนดขั้นต่ำของ VM:

- Linux พร้อม Chrome หรือ Chromium ที่รองรับเดสก์ท็อป
- สิทธิ์เข้าถึง CDP สำหรับ browser automation
- VNC หรือ noVNC สำหรับ rescue
- Node 22 และ pnpm
- OpenClaw checkout และ dependency cache
- cache ของเบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และหน่วยความจำเพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว, เบราว์เซอร์หนึ่งตัว และการรัน model หนึ่งครั้ง
- outbound access ไปยัง Discord, GitHub, model providers และ credential broker

VM ไม่ควรเก็บ raw secrets ระยะยาวนอก stores ของ credential หรือโปรไฟล์เบราว์เซอร์ที่คาดไว้

## Secrets

Secrets อยู่ใน GitHub organization หรือ repository secrets สำหรับการรันระยะไกล และอยู่ในไฟล์ secret ที่ควบคุมโดย operator ในเครื่องสำหรับการรัน local

ชื่อ secret ที่แนะนำ:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลด GitHub artifact สาธารณะ
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

ระยะยาว Convex credential pool ควรยังเป็นแหล่งปกติสำหรับ credentials ของ live transport GitHub secrets ใช้ bootstrap broker และ fallback lanes เวิร์กโฟลว์ Discord status-reactions จะ map secrets ของ Mantis Crabbox กลับไปยัง environment variables `CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN` ที่ Crabbox CLI คาดหวัง ชื่อ GitHub secret แบบ plain `CRABBOX_*` ยังถูกยอมรับเป็น fallback เพื่อความเข้ากันได้

Mantis runner ต้องไม่พิมพ์:

- tokens ของบอต Discord
- API keys ของ provider
- cookies ของเบราว์เซอร์
- เนื้อหาของ auth profile
- รหัสผ่าน VNC
- payload credential ดิบ

การอัปโหลด artifact สาธารณะควร redact metadata เป้าหมายของ Discord เช่น bot, guild, channel และ message ids ด้วย GitHub smoke workflow เปิดใช้ `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หาก token ถูกวางลงใน issue, PR, chat หรือ log โดยไม่ตั้งใจ ให้ rotate หลังจากเก็บ secret ใหม่แล้ว

## GitHub Artifacts และความคิดเห็นใน PR

workflow ของ Mantis ควรอัปโหลด evidence bundle แบบเต็มเป็น artifact ของ Actions อายุสั้น เมื่อ workflow ถูกรันสำหรับรายงาน bug หรือ PR ที่แก้ไข ควรเผยแพร่ PNG screenshots ที่ redact แล้วไปยัง branch `qa-artifacts` ด้วย และ upsert ความคิดเห็นบน bug หรือ PR แก้ไขนั้น พร้อม screenshots before/after แบบ inline อย่าโพสต์หลักฐานหลักไว้เฉพาะบน PR automation QA ทั่วไป Raw logs, observed messages และหลักฐานขนาดใหญ่อื่น ๆ ให้อยู่ใน Actions artifact

workflow ฝั่ง production ควรโพสต์ความคิดเห็นเหล่านั้นด้วย Mantis GitHub App ไม่ใช่ด้วย `github-actions[bot]` เก็บ app id และ private key เป็น GitHub Actions secrets ชื่อ `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY` workflow ใช้ hidden marker เป็น upsert key, อัปเดตความคิดเห็นนั้นเมื่อ token แก้ไขได้ และสร้างความคิดเห็นใหม่ที่เป็นของ Mantis เมื่อ marker เก่าที่เป็นของ bot แก้ไขไม่ได้

ความคิดเห็นใน PR ควรสั้นและเป็นภาพ:

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

เมื่อการรันล้มเหลวเพราะ harness ล้มเหลว ความคิดเห็นต้องระบุเช่นนั้น แทนที่จะสื่อว่า candidate ล้มเหลว

## หมายเหตุการปรับใช้แบบส่วนตัว

deployment ส่วนตัวอาจมีแอปพลิเคชัน Discord ของ Mantis อยู่แล้ว ให้ใช้แอปพลิเคชันนั้นแทนการสร้าง app ใหม่เมื่อมีสิทธิ์ bot ที่ถูกต้องและสามารถ rotate ได้อย่างปลอดภัย

ตั้งค่าช่องแจ้งเตือน operator เริ่มต้นผ่าน secrets หรือ configuration ของ deployment สามารถชี้ไปยังช่อง maintainer หรือ operations ที่มีอยู่ก่อน แล้วจึงย้ายไปยังช่อง Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่ guild ids, channel ids, bot tokens, browser cookies หรือรหัสผ่าน VNC ไว้ในเอกสารนี้ ให้เก็บไว้ใน GitHub secrets, credential broker หรือ local secret store ของ operator

## การเพิ่ม Scenario

scenario ของ Mantis ควรประกาศ:

- id และ title
- transport
- credentials ที่ต้องใช้
- นโยบาย baseline ref
- นโยบาย candidate ref
- patch config ของ OpenClaw
- ขั้นตอน setup
- stimulus
- oracle ของ baseline ที่คาดหวัง
- oracle ของ candidate ที่คาดหวัง
- เป้าหมายการจับภาพ
- timeout budget
- ขั้นตอน cleanup

Scenarios ควรเลือกใช้ oracles ขนาดเล็กที่มี type:

- สถานะ reaction ของ Discord สำหรับ bug ด้าน reaction
- message references ของ Discord สำหรับ bug ด้าน threading
- thread ts และสถานะ reaction API ของ Slack สำหรับ bug ของ Slack
- message ids และ headers ของ email สำหรับ bug ของ email
- screenshots ของเบราว์เซอร์เมื่อ UI เป็นสิ่งสังเกตที่เชื่อถือได้เพียงอย่างเดียว

การตรวจสอบด้วยภาพควรเป็นแบบเพิ่มเติม หาก API ของแพลตฟอร์มสามารถพิสูจน์บั๊กได้ ให้ใช้
API เป็นตัวชี้ขาดผ่าน/ไม่ผ่าน และเก็บภาพหน้าจอไว้เพื่อเสริมความมั่นใจของมนุษย์

## การขยายผู้ให้บริการ

หลังจาก Discord ตัวรันเดียวกันสามารถเพิ่ม:

- Slack: รีแอ็กชัน เธรด การกล่าวถึงแอป โมดัล การอัปโหลดไฟล์
- อีเมล: การตรวจสอบสิทธิ์ Gmail และการจัดเธรดข้อความโดยใช้ `gog` เมื่อคอนเน็กเตอร์ยัง
  ไม่เพียงพอ
- WhatsApp: การเข้าสู่ระบบด้วย QR การระบุตัวตนซ้ำ การส่งข้อความ สื่อ รีแอ็กชัน
- Telegram: การควบคุมการกล่าวถึงในกลุ่ม คำสั่ง รีแอ็กชันเมื่อพร้อมใช้งาน
- Matrix: ห้องที่เข้ารหัส ความสัมพันธ์แบบเธรดหรือการตอบกลับ การกลับมาทำงานต่อหลังรีสตาร์ต

แต่ละทรานสปอร์ตควรมีสถานการณ์ smoke ราคาถูกหนึ่งรายการ และสถานการณ์ตามกลุ่มบั๊กอย่างน้อยหนึ่งรายการ
สถานการณ์เชิงภาพที่มีค่าใช้จ่ายสูงควรคงเป็นแบบเลือกเปิดใช้

## คำถามที่ยังเปิดอยู่

- เมื่อใช้บอต Mantis เดิมซ้ำ บอต Discord ตัวใดควรเป็นไดรเวอร์ และตัวใดควรเป็น SUT?
- การเข้าสู่ระบบเบราว์เซอร์ของผู้สังเกตการณ์ควรใช้บัญชี Discord ของมนุษย์ บัญชีทดสอบ
  หรือใช้เฉพาะหลักฐาน REST ที่บอตอ่านได้สำหรับระยะแรก?
- GitHub ควรเก็บอาร์ติแฟกต์ Mantis สำหรับ PR ไว้นานเท่าใด?
- ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติเมื่อใด แทนที่จะรอคำสั่งจาก
  ผู้ดูแล?
- ควรปกปิดหรือตัดภาพหน้าจอก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่?
