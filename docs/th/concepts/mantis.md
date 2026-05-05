---
read_when:
    - การสร้างหรือเรียกใช้ QA ด้านภาพแบบสดสำหรับบั๊กของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึง
    - การเพิ่มสถานการณ์การรับส่งข้อมูลแบบสดสำหรับ Discord, Slack, WhatsApp หรือช่องทางอื่น ๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ การทำงานอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบแบบครบวงจรเชิงภาพสำหรับทำซ้ำบั๊กของ OpenClaw บนทรานสปอร์ตจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์กับ PR
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-05T08:25:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis คือระบบตรวจสอบแบบ end-to-end ของ OpenClaw สำหรับบั๊กที่ต้องใช้
รันไทม์จริง ทรานสปอร์ตจริง และหลักฐานที่มองเห็นได้ ระบบจะรันสถานการณ์กับ ref
ที่ทราบว่าเสีย เก็บหลักฐาน รันสถานการณ์เดิมกับ ref ผู้สมัคร แล้วเผยแพร่การเปรียบเทียบ
เป็นอาร์ติแฟกต์ที่ผู้ดูแลสามารถตรวจสอบได้จาก PR หรือจากคำสั่งในเครื่อง

Mantis เริ่มจาก Discord เพราะ Discord ให้เลนแรกที่มีคุณค่าสูงแก่เรา:
การยืนยันตัวตนบอตจริง ช่อง guild จริง reaction, thread, คำสั่ง native และ
UI บนเบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่าทรานสปอร์ตแสดงอะไร

## เป้าหมาย

- สร้างบั๊กจาก GitHub issue หรือ PR ซ้ำด้วยรูปแบบทรานสปอร์ตเดียวกับที่ผู้ใช้
  เห็น
- เก็บอาร์ติแฟกต์ **ก่อน** บน ref พื้นฐานก่อนใช้การแก้ไข
- เก็บอาร์ติแฟกต์ **หลัง** บน ref ผู้สมัครหลังใช้การแก้ไข
- ใช้ oracle แบบกำหนดแน่นอนเมื่อเป็นไปได้ เช่น การอ่าน Discord REST reaction
  หรือการตรวจ transcript ของ channel
- เก็บภาพหน้าจอเมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันในเครื่องจาก CLI ที่เอเจนต์ควบคุม และรันระยะไกลจาก GitHub
- เก็บสถานะเครื่องไว้เพียงพอสำหรับการกู้คืนผ่าน VNC เมื่อการล็อกอิน ระบบอัตโนมัติของเบราว์เซอร์ หรือ
  การยืนยันตัวตนของผู้ให้บริการติดขัด
- โพสต์สถานะอย่างกระชับไปยัง channel Discord ของโอเปอเรเตอร์เมื่อการรันถูกบล็อก
  ต้องใช้ความช่วยเหลือ VNC แบบแมนนวล หรือเสร็จสิ้น

## สิ่งที่ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit test โดยปกติการรัน Mantis ควรถูกย่อให้เป็น
  regression test ที่เล็กลงหลังจากเข้าใจการแก้ไขแล้ว
- Mantis ไม่ใช่ gate CI ปกติที่รวดเร็ว มันช้ากว่า ใช้ credential สด และ
  สงวนไว้สำหรับบั๊กที่สภาพแวดล้อมสดมีความสำคัญ
- Mantis ไม่ควรต้องใช้มนุษย์สำหรับการทำงานปกติ VNC แบบแมนนวลเป็นเส้นทางกู้คืน
  ไม่ใช่เส้นทางปกติ
- Mantis ไม่จัดเก็บ secret ดิบในอาร์ติแฟกต์ log ภาพหน้าจอ รายงาน Markdown
  หรือคอมเมนต์ PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแตก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของรันไทม์สถานการณ์ อะแดปเตอร์ทรานสปอร์ต สคีมาหลักฐาน และ
  CLI ในเครื่องภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของชิ้นส่วน harness ของทรานสปอร์ตสด helper สำหรับจับภาพเบราว์เซอร์ และ
  writer สำหรับอาร์ติแฟกต์
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นไว้เมื่อจำเป็นต้องใช้ VM ระยะไกล
- GitHub Actions เป็นเจ้าของ entrypoint ของ workflow ระยะไกลและการเก็บรักษาอาร์ติแฟกต์
- ClawSweeper เป็นเจ้าของการกำหนดเส้นทางคอมเมนต์ GitHub: การแยกคำสั่งของผู้ดูแล
  การ dispatch workflow และการโพสต์คอมเมนต์ PR สุดท้าย
- เอเจนต์ OpenClaw ขับเคลื่อน Mantis ผ่าน Codex เมื่อสถานการณ์ต้องการการตั้งค่าแบบ agentic
  การดีบัก หรือการรายงานสถานะติดขัด

ขอบเขตนี้ทำให้ความรู้ด้านทรานสปอร์ตอยู่ใน OpenClaw การจัดตารางเครื่องอยู่ใน
Crabbox และ glue ของ workflow ผู้ดูแลอยู่ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่งในเครื่องแรกตรวจสอบบอต Discord, guild, channel, การส่ง message,
การส่ง reaction และ path อาร์ติแฟกต์:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ตัวรันก่อนและหลังในเครื่องรับรูปแบบนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ตัวรันสร้าง worktree พื้นฐานและผู้สมัครแบบ detached ใต้ไดเรกทอรี output
ติดตั้ง dependencies สร้างแต่ละ ref รันสถานการณ์ด้วย
`--allow-failures` จากนั้นเขียน `baseline/`, `candidate/`, `comparison.json`,
และ `mantis-report.md` สำหรับสถานการณ์ Discord แรก การตรวจสอบที่สำเร็จหมายถึง
สถานะพื้นฐานเป็น `fail` และสถานะผู้สมัครเป็น `pass`

primitive VM/เบราว์เซอร์แรกคือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

มันเช่าหรือนำเครื่องเดสก์ท็อป Crabbox กลับมาใช้ใหม่ เริ่มเบราว์เซอร์ที่มองเห็นได้ภายใน
session VNC จับภาพเดสก์ท็อป ดึงอาร์ติแฟกต์กลับมายังไดเรกทอรี output ในเครื่อง
และเขียนคำสั่งเชื่อมต่อใหม่ลงในรายงาน คำสั่งใช้ผู้ให้บริการ Hetzner เป็นค่าเริ่มต้น
เพราะเป็นผู้ให้บริการรายแรกที่มี coverage เดสก์ท็อป/VNC ที่ใช้งานได้ในเลน Mantis
แทนที่ได้ด้วย `--provider`, `--crabbox-bin` หรือ
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อรันกับ fleet Crabbox อื่น

flag desktop smoke ที่มีประโยชน์:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` นำเดสก์ท็อปที่อุ่นไว้กลับมาใช้ใหม่
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดในเบราว์เซอร์ที่มองเห็นได้
- `--html-file <path>` render อาร์ติแฟกต์ HTML ใน repo-local ในเบราว์เซอร์ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อจับ timeline reaction สถานะ Discord ที่สร้างขึ้นผ่านเดสก์ท็อป Crabbox จริง
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` เก็บ lease ที่สร้างใหม่และผ่านไว้เปิดอยู่สำหรับการตรวจสอบผ่าน VNC การรันที่ล้มเหลวจะเก็บ lease ไว้โดยค่าเริ่มต้นเมื่อมีการสร้างไว้ เพื่อให้โอเปอเรเตอร์สามารถเชื่อมต่อใหม่ได้
- `--class`, `--idle-timeout` และ `--ttl` ปรับขนาดเครื่องและอายุของ lease

primitive ทรานสปอร์ตเดสก์ท็อปเต็มรูปแบบแรกคือ Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

มันเช่าหรือนำเครื่องเดสก์ท็อป Crabbox กลับมาใช้ใหม่ sync checkout ปัจจุบันเข้าไปใน
VM รัน `pnpm openclaw qa slack` ภายใน VM นั้น เปิด Slack Web ในเบราว์เซอร์ VNC
จับภาพเดสก์ท็อปที่มองเห็นได้ และคัดลอกทั้งอาร์ติแฟกต์ Slack QA และ
ภาพหน้าจอ VNC กลับมายังไดเรกทอรี output ในเครื่อง นี่คือรูปแบบ Mantis แรก
ที่ทั้ง SUT OpenClaw gateway และเบราว์เซอร์อยู่ภายใน VM เดสก์ท็อป Linux เดียวกัน

ด้วย `--gateway-setup` คำสั่งจะเตรียม OpenClaw home แบบใช้แล้วทิ้งที่คงอยู่
ที่ `$HOME/.openclaw-mantis/slack-openclaw` patch การกำหนดค่า Slack Socket Mode
สำหรับ channel ที่เลือก เริ่ม `openclaw gateway run` บนพอร์ต
`38973` และคง Chrome ไว้ใน session VNC นี่คือโหมด "ทิ้งเดสก์ท็อป
Linux ที่มี Slack และ claw ทำงานอยู่ไว้ให้ฉัน"; เลน Slack QA แบบบอตถึงบอต
ยังคงเป็นค่าเริ่มต้นเมื่อไม่ได้ระบุ `--gateway-setup`

input ที่จำเป็นสำหรับ `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับเลนโมเดลระยะไกล หากตั้งค่าเพียง
  `OPENAI_API_KEY` ในเครื่อง Mantis จะ map ไปยัง `OPENCLAW_LIVE_OPENAI_KEY`
  ก่อนเรียก Crabbox เพื่อให้การ forward env `OPENCLAW_*` ของ Crabbox ส่งต่อไป
  ยัง VM ได้

flag Slack desktop ที่มีประโยชน์:

- `--lease-id <cbx_...>` รันซ้ำกับเครื่องที่โอเปอเรเตอร์ล็อกอินเข้า Slack Web ผ่าน VNC ไว้แล้ว
- `--gateway-setup` เริ่ม OpenClaw Slack gateway แบบคงอยู่ใน VM แทนที่จะรันเพียงเลน QA แบบบอตถึงบอต
- `--slack-url <url>` เปิด URL Slack Web เฉพาะ หากไม่มี Mantis จะอนุมาน `https://app.slack.com/client/<team>/<channel>` จาก Slack `auth.test` เมื่อมี token บอต SUT
- `--slack-channel-id <id>` ควบคุม allowlist ของ channel Slack ที่ใช้โดยการตั้งค่า gateway
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุมโปรไฟล์ Chrome แบบคงอยู่ภายใน VM ค่าเริ่มต้นคือ `$HOME/.config/openclaw-mantis/slack-chrome-profile` ดังนั้นการล็อกอิน Slack Web แบบแมนนวลจะอยู่รอดในการรันซ้ำบน lease เดียวกัน
- `--credential-source convex --credential-role ci` ใช้พูล credential ที่แชร์แทน token env ของ Slack โดยตรง
- `--provider-mode`, `--model`, `--alt-model` และ `--fast` ส่งผ่านไปยังเลน Slack live

workflow smoke ของ GitHub คือ `Mantis Discord Smoke` workflow GitHub ก่อนและหลัง
สำหรับสถานการณ์จริงแรกคือ `Mantis Discord Status Reactions` มันรับ:

- `baseline_ref`: ref ที่คาดว่าจะสร้างพฤติกรรม queued-only ซ้ำ
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

มัน checkout ref ของ workflow harness สร้าง worktree พื้นฐานและผู้สมัครแยกกัน
รัน `discord-status-reactions-tool-only` กับแต่ละ worktree และ
upload `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` เป็น
อาร์ติแฟกต์ Actions นอกจากนี้ยัง render timeline HTML ของแต่ละเลนในเบราว์เซอร์เดสก์ท็อป
Crabbox และเผยแพร่ภาพหน้าจอ VNC เหล่านั้นข้าง PNG timeline แบบกำหนดแน่นอน
ในคอมเมนต์ PR คอมเมนต์ PR เดียวกันฝัง preview GIF น้ำหนักเบาที่ตัดส่วนเคลื่อนไหว
ซึ่งสร้างโดย `crabbox media preview` ลิงก์ไปยังคลิป MP4 ที่ตัดส่วนเคลื่อนไหวตรงกัน
และเก็บไฟล์ MP4 เดสก์ท็อปเต็มไว้สำหรับการตรวจสอบเชิงลึก ภาพหน้าจอคงอยู่แบบ inline
เพื่อให้ตรวจสอบได้รวดเร็ว workflow สร้าง Crabbox CLI จาก
`openclaw/crabbox` main เพื่อให้ใช้ flag lease เดสก์ท็อป/เบราว์เซอร์ปัจจุบันได้
ก่อนจะตัด release ไบนารี Crabbox ถัดไป

`Mantis Scenario` คือ entrypoint แมนนวลแบบ generic มันรับ `scenario_id`,
`candidate_ref`, `baseline_ref` ที่เป็นทางเลือก และ `pr_number` ที่เป็นทางเลือก จากนั้น
dispatch workflow ที่สถานการณ์เป็นเจ้าของ wrapper ถูกตั้งใจให้บาง:
workflow ของสถานการณ์ยังคงเป็นเจ้าของการตั้งค่าทรานสปอร์ต credential คลาส VM
oracle ที่คาดหวัง และ manifest อาร์ติแฟกต์ของตน

`Mantis Slack Desktop Smoke` คือ workflow Slack VM แรก มัน checkout
ref ผู้สมัครที่เชื่อถือได้ใน worktree แยก เช่าเดสก์ท็อป Linux ของ Crabbox
รัน `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` กับ
ผู้สมัครนั้น เปิด Slack Web ในเบราว์เซอร์ VNC บันทึกเดสก์ท็อป สร้าง
preview ที่ตัดส่วนเคลื่อนไหวด้วย `crabbox media preview` upload ไดเรกทอรีอาร์ติแฟกต์เต็ม
และโพสต์คอมเมนต์หลักฐาน inline บน PR เป้าหมายได้ตามทางเลือก ใช้เลนนี้เมื่อคุณต้องการ
"เดสก์ท็อป Linux ที่มี Slack และ claw ทำงานอยู่" แทนที่จะเป็นเพียง transcript Slack แบบบอตถึงบอต

ทุกสถานการณ์ที่เผยแพร่ไปยัง PR จะเขียน `mantis-evidence.json` ถัดจากรายงาน
สคีมานี้คือการส่งต่อระหว่างโค้ดสถานการณ์และคอมเมนต์ GitHub:

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

ค่า `path` ของอาร์ติแฟกต์เป็น path ที่สัมพันธ์กับไดเรกทอรี manifest ค่า `targetPath`
เป็น path สัมพัทธ์ใต้ไดเรกทอรีเผยแพร่ของ branch `qa-artifacts`
publisher ปฏิเสธ path traversal และข้าม entry ที่ทำเครื่องหมาย
`"required": false` เมื่อ preview หรือวิดีโอที่เป็นทางเลือกไม่พร้อมใช้งาน

ชนิดอาร์ติแฟกต์ที่รองรับ:

- `timeline`: ภาพหน้าจอสถานการณ์แบบกำหนดแน่นอน โดยปกติเป็นก่อน/หลัง
- `desktopScreenshot`: ภาพหน้าจอเดสก์ท็อป VNC/เบราว์เซอร์
- `motionPreview`: GIF เคลื่อนไหว inline ที่สร้างจากการบันทึกเดสก์ท็อป
- `motionClip`: MP4 ที่ตัดส่วนเคลื่อนไหวซึ่งลบช่วงนิ่งตอนเริ่มและท้าย
- `fullVideo`: การบันทึก MP4 เต็มสำหรับการตรวจสอบเชิงลึก
- `metadata`: JSON/log sidecar
- `report`: รายงาน Markdown

publisher ที่ใช้ซ้ำได้คือ `scripts/mantis/publish-pr-evidence.mjs` workflow
เรียกมันด้วย manifest, PR เป้าหมาย, root เป้าหมาย `qa-artifacts`, marker คอมเมนต์,
URL อาร์ติแฟกต์ Actions, URL การรัน และแหล่งที่มาของคำขอ มันคัดลอกอาร์ติแฟกต์ที่ประกาศ
ไปยัง branch `qa-artifacts` สร้างคอมเมนต์ PR แบบสรุปก่อนพร้อมรูปภาพ/preview inline
และวิดีโอที่ลิงก์ไว้ จากนั้นอัปเดตคอมเมนต์ marker ที่มีอยู่หรือสร้างใหม่

คุณยังสามารถ trigger การรัน status-reactions ได้โดยตรงจากคอมเมนต์ PR:

```text
@Mantis discord status reactions
```

trigger คอมเมนต์ถูกตั้งใจให้แคบ มันรันเฉพาะบนคอมเมนต์ pull request
จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และรู้จักเฉพาะคำขอ
status-reaction ของ Discord โดยค่าเริ่มต้นมันใช้ ref พื้นฐานที่ทราบว่าเสีย
และ SHA head ของ PR ปัจจุบันเป็นผู้สมัคร ผู้ดูแลสามารถ override
ref ใดก็ได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกเป็นคำสั่งที่ระบุชัดเจนและมุ่งเน้นสถานการณ์ทดสอบ คำสั่งที่สองภายหลังสามารถแมป PR
หรือ issue ไปยังสถานการณ์ Mantis ที่แนะนำจาก label, ไฟล์ที่เปลี่ยนแปลง และ
ผลการรีวิวของ ClawSweeper ได้

## วงจรการรัน

1. รับข้อมูลประจำตัว
2. จัดสรรหรือใช้ VM เดิม
3. เตรียมโปรไฟล์เดสก์ท็อป/เบราว์เซอร์เมื่อสถานการณ์ต้องใช้หลักฐาน UI
4. เตรียม checkout ที่สะอาดสำหรับ ref ฐาน
5. ติดตั้ง dependencies และ build เฉพาะส่วนที่สถานการณ์ต้องใช้
6. เริ่ม OpenClaw Gateway ลูกด้วยไดเรกทอรีสถานะแบบแยก
7. กำหนดค่า live transport, provider, model และโปรไฟล์เบราว์เซอร์
8. รันสถานการณ์และเก็บหลักฐานฐาน
9. หยุด gateway และเก็บรักษา log
10. เตรียม ref ของ candidate ใน VM เดียวกัน
11. รันสถานการณ์เดิมและเก็บหลักฐาน candidate
12. เปรียบเทียบผล oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, log, screenshot และ artifact trace แบบไม่บังคับ
14. อัปโหลด artifact ของ GitHub Actions
15. โพสต์ข้อความสถานะ PR หรือ Discord แบบกระชับ

สถานการณ์ควรล้มเหลวได้สองแบบที่ต่างกัน:

- **จำลองบั๊กได้แล้ว**: baseline ล้มเหลวในแบบที่คาดไว้
- **harness ล้มเหลว**: การตั้งค่าสภาพแวดล้อม, ข้อมูลประจำตัว, Discord API, เบราว์เซอร์ หรือ
  provider ล้มเหลวก่อนที่ bug oracle จะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้ออกจากกัน เพื่อให้ maintainer ไม่สับสนระหว่างสภาพแวดล้อมที่ไม่เสถียร
กับพฤติกรรมของผลิตภัณฑ์

## Discord MVP

สถานการณ์แรกควรเจาะจง reaction สถานะของ Discord ในช่อง guild ที่
โหมดการส่ง reply ต้นทางเป็น `message_tool_only`

เหตุผลที่เหมาะเป็น seed แรกของ Mantis:

- มองเห็นได้ใน Discord เป็น reaction บนข้อความที่ trigger
- มี REST oracle ที่แข็งแรงผ่านสถานะ reaction ของข้อความ Discord
- ทดสอบ OpenClaw Gateway จริง, auth ของบอต Discord, การ dispatch ข้อความ,
  โหมดการส่ง reply ต้นทาง, สถานะ reaction, และวงจรชีวิตของ model turn
- แคบพอที่จะทำให้ implementation แรกตรงไปตรงมา

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

หลักฐาน baseline ควรแสดง acknowledgement reaction ที่เข้าคิวไว้ แต่ไม่มี
การเปลี่ยนสถานะวงจรชีวิตในโหมดเฉพาะ tool หลักฐาน candidate ควรแสดง reaction
สถานะวงจรชีวิตที่ทำงานเมื่อ `messages.statusReactions.enabled` เป็น
true อย่างชัดเจน

ส่วนแรกที่รันได้คือสถานการณ์ QA สดของ Discord แบบ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

คำสั่งนี้กำหนดค่า SUT ด้วยการจัดการ guild แบบเปิดตลอด, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และ reaction สถานะที่ระบุชัดเจน oracle
poll ข้อความ Discord จริงที่ trigger และคาดหวังลำดับที่สังเกตได้
`👀 -> 🤔 -> 👍` Artifact มี `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` และ
`discord-status-reactions-tool-only-timeline.png`

## ชิ้นส่วน QA ที่มีอยู่

Mantis ควรต่อยอดจาก stack QA ส่วนตัวที่มีอยู่ แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รัน lane Discord สดพร้อมบอต driver และ
  SUT อยู่แล้ว
- live transport runner เขียนรายงานและ artifact ข้อความที่สังเกตได้ไว้ใต้
  `.artifacts/qa-e2e/` อยู่แล้ว
- lease ข้อมูลประจำตัวของ Convex ให้สิทธิ์เข้าถึงข้อมูลประจำตัว live
  transport ที่ใช้ร่วมกันแบบ exclusive อยู่แล้ว
- บริการควบคุมเบราว์เซอร์รองรับ screenshot, snapshot,
  โปรไฟล์ managed แบบ headless และโปรไฟล์ CDP ระยะไกลอยู่แล้ว
- QA Lab มี UI debugger และ bus สำหรับการทดสอบที่มีรูปแบบตาม transport อยู่แล้ว

implementation แรกของ Mantis สามารถเป็น runner ก่อน/หลังแบบบาง ๆ บนชิ้นส่วนเหล่านี้
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

`mantis-summary.json` ควรเป็นแหล่งความจริงที่เครื่องอ่านได้ รายงาน
Markdown มีไว้สำหรับคอมเมนต์ PR และการรีวิวโดยมนุษย์

summary ต้องมี:

- ref และ SHA ที่ทดสอบ
- transport และ id สถานการณ์
- provider เครื่องและ id เครื่องหรือ id lease
- แหล่งข้อมูลประจำตัวโดยไม่มีค่าลับ
- ผล baseline
- ผล candidate
- บั๊กถูกจำลองบน baseline หรือไม่
- candidate แก้บั๊กได้หรือไม่
- path ของ artifact
- ปัญหาการตั้งค่าหรือ cleanup ที่ sanitize แล้ว

screenshot เป็นหลักฐาน ไม่ใช่ความลับ แต่ยังต้องมีวินัยในการ redact:
ชื่อช่องส่วนตัว, ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏได้ สำหรับ PR สาธารณะ
ให้ใช้ลิงก์ artifact ของ GitHub Actions แทนรูปภาพ inline จนกว่าแนวทางการ redact
จะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

lane เบราว์เซอร์มีสองโหมด:

- **ระบบอัตโนมัติแบบ headless**: ค่าเริ่มต้นสำหรับ CI Chrome รันโดยเปิด CDP และ
  Playwright หรือการควบคุมเบราว์เซอร์ของ OpenClaw เก็บ screenshot
- **การช่วยเหลือผ่าน VNC**: เปิดใช้บน VM เดียวกันเมื่อการ login, MFA, การป้องกันระบบอัตโนมัติของ Discord
  หรือการ debug ภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ observer ของ Discord ควร persistent พอที่จะไม่ต้อง
login ทุกครั้งที่รัน แต่แยกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์เป็นของ pool เครื่อง
Mantis ไม่ใช่ของ laptop นักพัฒนา

เมื่อ Mantis ค้าง จะโพสต์ข้อความสถานะ Discord พร้อม:

- run id
- scenario id
- provider เครื่อง
- ไดเรกทอรี artifact
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความ blocker สั้น ๆ

deployment ส่วนตัวแรกสามารถโพสต์ข้อความเหล่านี้ไปยังช่อง operator ที่มีอยู่
แล้วค่อยย้ายไปช่อง Mantis เฉพาะภายหลัง

## เครื่อง

Mantis ควรเลือก AWS ผ่าน Crabbox สำหรับ implementation ระยะไกลแรก
Crabbox ให้เครื่องที่ warm แล้ว, การติดตาม lease, hydration, log, ผลลัพธ์ และ
cleanup หาก capacity ของ AWS ช้าหรือไม่พร้อม ให้เพิ่ม provider Hetzner
ไว้หลัง interface เครื่องเดียวกัน

ข้อกำหนดขั้นต่ำของ VM:

- Linux พร้อม Chrome หรือ Chromium ที่รองรับเดสก์ท็อป
- การเข้าถึง CDP สำหรับ automation ของเบราว์เซอร์
- VNC หรือ noVNC สำหรับการช่วยเหลือ
- Node 22 และ pnpm
- checkout ของ OpenClaw และ cache dependency
- cache เบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และ memory เพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว, เบราว์เซอร์หนึ่งตัว และการรัน model หนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, model provider และ credential broker

VM ไม่ควรเก็บความลับดิบที่มีอายุยาวไว้นอก store ข้อมูลประจำตัวหรือโปรไฟล์เบราว์เซอร์ที่คาดไว้

## ความลับ

ความลับอยู่ใน secret ระดับ organization หรือ repository ของ GitHub สำหรับการรันระยะไกล และอยู่ใน
ไฟล์ secret ที่ operator ควบคุมในเครื่องสำหรับการรัน local

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

ในระยะยาว pool ข้อมูลประจำตัวของ Convex ควรยังเป็นแหล่งปกติสำหรับข้อมูลประจำตัว
live transport GitHub secrets ใช้ bootstrap broker และ lane fallback
workflow Discord status-reactions แมป secret Mantis Crabbox กลับไปยัง
environment variable `CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN`
ที่ Crabbox CLI คาดหวัง ชื่อ GitHub secret แบบธรรมดา `CRABBOX_*` ยังถูกรับเป็น
fallback เพื่อความเข้ากันได้

Mantis runner ต้องไม่พิมพ์:

- token บอต Discord
- API key ของ provider
- cookie ของเบราว์เซอร์
- เนื้อหา auth profile
- รหัสผ่าน VNC
- payload ข้อมูลประจำตัวดิบ

การอัปโหลด artifact สาธารณะควร redact metadata เป้าหมายของ Discord ด้วย เช่น id ของ bot,
guild, channel และ message workflow smoke ของ GitHub เปิดใช้
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หาก token ถูกวางลงใน issue, PR, chat หรือ log โดยไม่ตั้งใจ ให้ rotate หลังจาก
เก็บ secret ใหม่แล้ว

## Artifact ของ GitHub และคอมเมนต์ PR

workflow ของ Mantis ควรอัปโหลด bundle หลักฐานทั้งหมดเป็น artifact ของ Actions ที่มีอายุสั้น
เมื่อ workflow ถูกรันสำหรับรายงานบั๊กหรือ PR แก้ไข ควรเผยแพร่ screenshot PNG ที่ redact แล้ว
ไปยัง branch `qa-artifacts` ด้วย และ upsert คอมเมนต์บนบั๊กหรือ PR แก้ไขนั้นพร้อม screenshot
ก่อน/หลังแบบ inline อย่าโพสต์หลักฐานหลักไว้เฉพาะบน PR automation QA ทั่วไป
log ดิบ, ข้อความที่สังเกตได้ และหลักฐานขนาดใหญ่อื่น ๆ อยู่ใน artifact ของ Actions

workflow production ควรโพสต์คอมเมนต์เหล่านั้นด้วย Mantis GitHub App ไม่ใช่
`github-actions[bot]` เก็บ app id และ private key เป็น GitHub Actions
secrets `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY`
workflow ใช้ marker ที่ซ่อนอยู่เป็น upsert key, อัปเดตคอมเมนต์นั้นเมื่อ token แก้ไขได้
และสร้างคอมเมนต์ใหม่ที่ Mantis เป็นเจ้าของเมื่อ marker เก่าที่ bot เป็นเจ้าของแก้ไขไม่ได้

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

## หมายเหตุ deployment ส่วนตัว

deployment ส่วนตัวอาจมี application Discord ของ Mantis อยู่แล้ว ให้ใช้
application นั้นซ้ำแทนการสร้าง app ใหม่เมื่อมี permission ของ bot ที่ถูกต้อง
และ rotate ได้อย่างปลอดภัย

ตั้งค่าช่องแจ้งเตือน operator เริ่มต้นผ่าน secret หรือ configuration ของ deployment
ช่องนี้สามารถชี้ไปยังช่อง maintainer หรือ operations ที่มีอยู่ก่อน แล้วค่อยย้ายไปยังช่อง
Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่ guild id, channel id, token บอต, cookie ของเบราว์เซอร์ หรือรหัสผ่าน VNC
ในเอกสารนี้ ให้เก็บไว้ใน GitHub secrets, credential broker หรือ secret store
local ของ operator

## การเพิ่มสถานการณ์

สถานการณ์ Mantis ควรประกาศ:

- id และ title
- transport
- ข้อมูลประจำตัวที่ต้องใช้
- นโยบาย ref ของ baseline
- นโยบาย ref ของ candidate
- patch config ของ OpenClaw
- ขั้นตอนการตั้งค่า
- stimulus
- oracle baseline ที่คาดไว้
- oracle candidate ที่คาดไว้
- เป้าหมายการเก็บภาพ
- งบเวลา timeout
- ขั้นตอน cleanup

สถานการณ์ควรเลือกใช้ oracle ขนาดเล็กและ typed:

- สถานะ reaction ของ Discord สำหรับบั๊ก reaction
- reference ข้อความ Discord สำหรับบั๊ก threading
- thread ts และสถานะ reaction API ของ Slack สำหรับบั๊ก Slack
- id ข้อความอีเมลและ header สำหรับบั๊กอีเมล
- screenshot เบราว์เซอร์เมื่อ UI เป็น observable ที่เชื่อถือได้เพียงอย่างเดียว

การตรวจด้วย vision ควรเป็นส่วนเสริม หาก API ของ platform สามารถพิสูจน์บั๊กได้ ให้ใช้
API เป็น oracle pass/fail และเก็บ screenshot ไว้เพื่อเพิ่มความมั่นใจของมนุษย์

## การขยาย Provider

หลังจาก Discord runner เดียวกันสามารถเพิ่ม:

- Slack: ปฏิกิริยา, เธรด, การกล่าวถึงแอป, โมดัล, การอัปโหลดไฟล์.
- อีเมล: การยืนยันตัวตน Gmail และการจัดข้อความเป็นเธรดโดยใช้ `gog` เมื่อคอนเนกเตอร์
  ไม่เพียงพอ.
- WhatsApp: การเข้าสู่ระบบด้วย QR, การระบุตัวตนซ้ำ, การส่งข้อความ, สื่อ, ปฏิกิริยา.
- Telegram: การควบคุมการกล่าวถึงในกลุ่ม, คำสั่ง, ปฏิกิริยาเมื่อพร้อมใช้งาน.
- Matrix: ห้องที่เข้ารหัส, ความสัมพันธ์ของเธรดหรือการตอบกลับ, การกลับมาทำงานต่อหลังรีสตาร์ต.

แต่ละทรานสปอร์ตควรมีสถานการณ์ smoke แบบต้นทุนต่ำหนึ่งรายการ และสถานการณ์ตามประเภทของบั๊ก
อย่างน้อยหนึ่งรายการ สถานการณ์ด้านภาพที่มีต้นทุนสูงควรยังคงเป็นแบบเลือกใช้เอง.

## คำถามที่ยังเปิดอยู่

- บอต Discord ตัวใดควรเป็นไดรเวอร์ และตัวใดควรเป็น SUT เมื่อมีการนำบอต Mantis
  ที่มีอยู่กลับมาใช้?
- การเข้าสู่ระบบเบราว์เซอร์ของผู้สังเกตการณ์ควรใช้บัญชี Discord ของมนุษย์, บัญชีทดสอบ,
  หรือใช้เฉพาะหลักฐาน REST ที่บอตอ่านได้สำหรับระยะแรก?
- GitHub ควรเก็บอาร์ติแฟกต์ Mantis สำหรับ PR ไว้นานแค่ไหน?
- เมื่อใด ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติ แทนที่จะรอคำสั่งจาก
  ผู้ดูแล?
- ควรปกปิดหรือตัดครอบภาพหน้าจอก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่?
