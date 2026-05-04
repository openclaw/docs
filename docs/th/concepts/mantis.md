---
read_when:
    - การสร้างหรือเรียกใช้การตรวจสอบคุณภาพด้านภาพแบบสดสำหรับข้อบกพร่องของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึง
    - การเพิ่มสถานการณ์การรับส่งแบบสดสำหรับ Discord, Slack, WhatsApp หรืออื่นๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ การทำงานอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบด้วยภาพแบบต้นทางถึงปลายทางสำหรับจำลองบั๊กของ OpenClaw ซ้ำบนทรานสปอร์ตที่ใช้งานจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์ไปยัง PR
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-04T02:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis คือระบบตรวจสอบแบบต้นทางถึงปลายทางของ OpenClaw สำหรับบั๊กที่ต้องใช้แรนไทม์จริง ทรานสปอร์ตจริง และหลักฐานที่มองเห็นได้ ระบบจะรันสถานการณ์กับ ref ที่ทราบว่ามีปัญหา เก็บหลักฐาน รันสถานการณ์เดียวกันกับ ref candidate แล้วเผยแพร่การเปรียบเทียบเป็นอาร์ติแฟกต์ที่ผู้ดูแลสามารถตรวจสอบได้จาก PR หรือจากคำสั่งภายในเครื่อง

Mantis เริ่มจาก Discord เพราะ Discord ให้เลนแรกที่มีคุณค่าสูงแก่เรา: การยืนยันตัวตนบอตจริง ช่องกิลด์จริง รีแอ็กชัน เธรด คำสั่งเนทีฟ และ UI บนเบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่าทรานสปอร์ตแสดงอะไร

## เป้าหมาย

- ทำซ้ำบั๊กจาก issue หรือ PR บน GitHub ด้วยรูปแบบทรานสปอร์ตเดียวกับที่ผู้ใช้เห็น
- เก็บอาร์ติแฟกต์ **ก่อน** บน ref พื้นฐานก่อนใช้การแก้ไข
- เก็บอาร์ติแฟกต์ **หลัง** บน ref candidate หลังใช้การแก้ไข
- ใช้ oracle แบบกำหนดแน่นอนเมื่อทำได้ เช่น การอ่านรีแอ็กชันผ่าน Discord REST หรือการตรวจทรานสคริปต์ของช่อง
- เก็บภาพหน้าจอเมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันภายในเครื่องจาก CLI ที่ agent ควบคุม และรันระยะไกลจาก GitHub
- เก็บสถานะเครื่องให้เพียงพอสำหรับการกู้ผ่าน VNC เมื่อการเข้าสู่ระบบ ระบบอัตโนมัติของเบราว์เซอร์ หรือการยืนยันตัวตนของผู้ให้บริการติดขัด
- โพสต์สถานะอย่างกระชับไปยังช่อง Discord ของโอเปอเรเตอร์เมื่อการรันถูกบล็อก ต้องการความช่วยเหลือผ่าน VNC แบบแมนนวล หรือเสร็จสิ้น

## สิ่งที่ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit test โดยปกติการรัน Mantis ควรถูกแปลงเป็น regression test ที่เล็กลงหลังจากเข้าใจการแก้ไขแล้ว
- Mantis ไม่ใช่ gate CI ที่รวดเร็วตามปกติ ระบบนี้ช้ากว่า ใช้ข้อมูลประจำตัวจริง และสงวนไว้สำหรับบั๊กที่สภาพแวดล้อมจริงมีความสำคัญ
- Mantis ไม่ควรต้องพึ่งมนุษย์ในการทำงานตามปกติ VNC แบบแมนนวลเป็นเส้นทางกู้คืน ไม่ใช่เส้นทางปกติ
- Mantis ไม่เก็บความลับดิบไว้ในอาร์ติแฟกต์ ล็อก ภาพหน้าจอ รายงาน Markdown หรือคอมเมนต์ PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแต็ก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของแรนไทม์สถานการณ์ อะแดปเตอร์ทรานสปอร์ต สคีมาหลักฐาน และ CLI ภายในเครื่องภายใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของชิ้นส่วนฮาร์เนสของทรานสปอร์ตจริง ตัวช่วยเก็บภาพเบราว์เซอร์ และตัวเขียนอาร์ติแฟกต์
- Crabbox เป็นเจ้าของเครื่อง Linux ที่วอร์มไว้เมื่อจำเป็นต้องใช้ VM ระยะไกล
- GitHub Actions เป็นเจ้าของจุดเข้าของเวิร์กโฟลว์ระยะไกลและการเก็บรักษาอาร์ติแฟกต์
- ClawSweeper เป็นเจ้าของการกำหนดเส้นทางคอมเมนต์ GitHub: การแยกคำสั่งผู้ดูแล การ dispatch เวิร์กโฟลว์ และการโพสต์คอมเมนต์ PR สุดท้าย
- agent ของ OpenClaw ขับเคลื่อน Mantis ผ่าน Codex เมื่อสถานการณ์ต้องการการตั้งค่าแบบ agentic การดีบัก หรือการรายงานสถานะค้าง

ขอบเขตนี้ทำให้ความรู้ด้านทรานสปอร์ตอยู่ใน OpenClaw การจัดกำหนดการเครื่องอยู่ใน Crabbox และกาวเชื่อมเวิร์กโฟลว์ผู้ดูแลอยู่ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่งภายในเครื่องแรกตรวจสอบบอต Discord, กิลด์, ช่อง, การส่งข้อความ, การส่งรีแอ็กชัน และพาธอาร์ติแฟกต์:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ตัวรันก่อนและหลังภายในเครื่องรับรูปแบบนี้:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ตัวรันสร้าง worktree แบบ detached สำหรับ baseline และ candidate ภายใต้ไดเรกทอรีเอาต์พุต ติดตั้ง dependency บิลด์แต่ละ ref รันสถานการณ์ด้วย `--allow-failures` จากนั้นเขียน `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` สำหรับสถานการณ์ Discord แรก การตรวจสอบที่สำเร็จหมายความว่าสถานะ baseline คือ `fail` และสถานะ candidate คือ `pass`

primitive แรกของ VM/เบราว์เซอร์คือ desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

คำสั่งนี้เช่าหรือนำเครื่องเดสก์ท็อป Crabbox มาใช้ซ้ำ เริ่มเบราว์เซอร์ที่มองเห็นได้ภายในเซสชัน VNC เก็บภาพเดสก์ท็อป ดึงอาร์ติแฟกต์กลับมายังไดเรกทอรีเอาต์พุตภายในเครื่อง และเขียนคำสั่งเชื่อมต่อใหม่ลงในรายงาน คำสั่งตั้งค่าเริ่มต้นเป็นผู้ให้บริการ Hetzner เพราะเป็นผู้ให้บริการรายแรกที่มี desktop/VNC coverage ที่ทำงานได้ในเลน Mantis แทนที่ได้ด้วย `--provider`, `--crabbox-bin` หรือ `OPENCLAW_MANTIS_CRABBOX_PROVIDER` เมื่อรันกับฟลีต Crabbox อื่น

แฟล็ก desktop smoke ที่มีประโยชน์:

- `--lease-id <cbx_...>` หรือ `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` นำเดสก์ท็อปที่วอร์มไว้มาใช้ซ้ำ
- `--browser-url <url>` เปลี่ยนหน้าที่เปิดในเบราว์เซอร์ที่มองเห็นได้
- `--html-file <path>` เรนเดอร์อาร์ติแฟกต์ HTML ภายใน repo ในเบราว์เซอร์ที่มองเห็นได้ Mantis ใช้สิ่งนี้เพื่อเก็บภาพไทม์ไลน์ Discord status-reaction ที่สร้างขึ้นผ่านเดสก์ท็อป Crabbox จริง
- `--keep-lease` หรือ `OPENCLAW_MANTIS_KEEP_VM=1` คง lease ที่สร้างใหม่และผ่านไว้สำหรับการตรวจสอบผ่าน VNC การรันที่ล้มเหลวจะคง lease ไว้ตามค่าเริ่มต้นเมื่อมีการสร้าง lease เพื่อให้โอเปอเรเตอร์เชื่อมต่อใหม่ได้
- `--class`, `--idle-timeout` และ `--ttl` ปรับขนาดเครื่องและอายุของ lease

เวิร์กโฟลว์ smoke บน GitHub คือ `Mantis Discord Smoke` เวิร์กโฟลว์ก่อนและหลังบน GitHub สำหรับสถานการณ์จริงแรกคือ `Mantis Discord Status Reactions` โดยรับ:

- `baseline_ref`: ref ที่คาดว่าจะทำซ้ำพฤติกรรม queued-only
- `candidate_ref`: ref ที่คาดว่าจะแสดง `queued -> thinking -> done`

เวิร์กโฟลว์ checkout ref ของฮาร์เนสเวิร์กโฟลว์ บิลด์ worktree baseline และ candidate แยกกัน รัน `discord-status-reactions-tool-only` กับแต่ละ worktree และอัปโหลด `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` เป็นอาร์ติแฟกต์ของ Actions นอกจากนี้ยังเรนเดอร์ HTML ไทม์ไลน์ของแต่ละเลนในเบราว์เซอร์เดสก์ท็อป Crabbox และเผยแพร่ภาพหน้าจอ VNC เหล่านั้นคู่กับ PNG ไทม์ไลน์แบบกำหนดแน่นอนในคอมเมนต์ PR เวิร์กโฟลว์บิลด์ Crabbox CLI จาก `openclaw/crabbox` main เพื่อให้ใช้แฟล็ก desktop/browser lease ปัจจุบันได้ก่อนที่จะตัด release ไบนารี Crabbox ถัดไป

คุณยังสามารถทริกเกอร์การรัน status-reactions โดยตรงจากคอมเมนต์ PR:

```text
@Mantis discord status reactions
```

ทริกเกอร์คอมเมนต์นี้ตั้งใจให้แคบ โดยจะรันเฉพาะบนคอมเมนต์ pull request จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และจะรู้จักเฉพาะคำขอ Discord status-reaction เท่านั้น ตามค่าเริ่มต้นจะใช้ ref พื้นฐานที่ทราบว่ามีปัญหาและ SHA ของหัว PR ปัจจุบันเป็น candidate ผู้ดูแลสามารถแทนที่ ref ใดก็ได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกระบุชัดเจนและมุ่งเน้นสถานการณ์ คำสั่งที่สองสามารถแมป PR หรือ issue ไปยังสถานการณ์ Mantis ที่แนะนำได้ในภายหลังจากป้ายกำกับ ไฟล์ที่เปลี่ยน และข้อค้นพบจากรีวิวของ ClawSweeper

## วงจรชีวิตการรัน

1. รับข้อมูลประจำตัว
2. จัดสรรหรือนำ VM มาใช้ซ้ำ
3. เตรียมโปรไฟล์เดสก์ท็อป/เบราว์เซอร์เมื่อสถานการณ์ต้องการหลักฐาน UI
4. เตรียม checkout ที่สะอาดสำหรับ ref พื้นฐาน
5. ติดตั้ง dependency และบิลด์เฉพาะสิ่งที่สถานการณ์ต้องใช้
6. เริ่ม OpenClaw Gateway ลูกด้วยไดเรกทอรีสถานะแบบแยก
7. กำหนดค่าทรานสปอร์ตจริง ผู้ให้บริการ โมเดล และโปรไฟล์เบราว์เซอร์
8. รันสถานการณ์และเก็บหลักฐาน baseline
9. หยุด gateway และเก็บรักษาล็อก
10. เตรียม ref candidate ใน VM เดียวกัน
11. รันสถานการณ์เดียวกันและเก็บหลักฐาน candidate
12. เปรียบเทียบผลลัพธ์ oracle และหลักฐานภาพ
13. เขียน Markdown, JSON, ล็อก, ภาพหน้าจอ และอาร์ติแฟกต์ trace ที่เป็นตัวเลือก
14. อัปโหลดอาร์ติแฟกต์ GitHub Actions
15. โพสต์ข้อความสถานะ PR หรือ Discord แบบกระชับ

สถานการณ์ควรล้มเหลวได้สองแบบที่แตกต่างกัน:

- **ทำซ้ำบั๊กได้**: baseline ล้มเหลวในแบบที่คาดไว้
- **ฮาร์เนสล้มเหลว**: การตั้งค่าสภาพแวดล้อม ข้อมูลประจำตัว Discord API เบราว์เซอร์ หรือผู้ให้บริการล้มเหลวก่อนที่ bug oracle จะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้เพื่อให้ผู้ดูแลไม่สับสนระหว่างสภาพแวดล้อมที่ไม่นิ่งกับพฤติกรรมของผลิตภัณฑ์

## MVP ของ Discord

สถานการณ์แรกควรมุ่งเป้าไปที่ Discord status reactions ในช่องกิลด์ที่โหมดส่ง reply ต้นทางคือ `message_tool_only`

เหตุผลที่เป็น seed ที่ดีสำหรับ Mantis:

- มองเห็นได้ใน Discord เป็นรีแอ็กชันบนข้อความที่ทริกเกอร์
- มี REST oracle ที่แข็งแรงผ่านสถานะรีแอ็กชันของข้อความ Discord
- ครอบคลุม OpenClaw Gateway จริง การยืนยันตัวตนบอต Discord การ dispatch ข้อความ โหมดส่ง reply ต้นทาง สถานะรีแอ็กชัน และวงจรชีวิต turn ของโมเดล
- แคบพอที่จะทำให้การติดตั้งใช้งานครั้งแรกตรงไปตรงมา

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

หลักฐาน baseline ควรแสดงรีแอ็กชัน acknowledgement แบบ queued แต่ไม่มี lifecycle transition ในโหมด tool-only หลักฐาน candidate ควรแสดง lifecycle status reactions ที่ทำงานเมื่อ `messages.statusReactions.enabled` เป็น true อย่างชัดเจน

slice แรกที่รันได้คือสถานการณ์ QA จริงของ Discord แบบ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

คำสั่งนี้กำหนดค่า SUT ให้จัดการกิลด์แบบเปิดตลอด, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` และ status reactions ที่ระบุชัดเจน oracle จะ poll ข้อความ Discord ที่ทริกเกอร์จริงและคาดหวังลำดับที่สังเกตได้คือ `👀 -> 🤔 -> 👍` อาร์ติแฟกต์ประกอบด้วย `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` และ `discord-status-reactions-tool-only-timeline.png`

## ส่วนประกอบ QA ที่มีอยู่

Mantis ควรต่อยอดจากสแต็ก QA ส่วนตัวที่มีอยู่แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รันเลน Discord จริงพร้อมบอต driver และ SUT อยู่แล้ว
- ตัวรันทรานสปอร์ตจริงเขียนรายงานและอาร์ติแฟกต์ observed-message ภายใต้ `.artifacts/qa-e2e/` อยู่แล้ว
- lease ข้อมูลประจำตัว Convex ให้สิทธิ์เข้าถึงข้อมูลประจำตัวทรานสปอร์ตจริงที่ใช้ร่วมกันแบบเอกสิทธิ์อยู่แล้ว
- บริการควบคุมเบราว์เซอร์รองรับภาพหน้าจอ สแนปช็อต โปรไฟล์ managed แบบ headless และโปรไฟล์ CDP ระยะไกลอยู่แล้ว
- QA Lab มี UI ดีบักเกอร์และ bus สำหรับการทดสอบที่มีรูปแบบเหมือนทรานสปอร์ตอยู่แล้ว

การติดตั้ง Mantis ครั้งแรกสามารถเป็นตัวรันก่อน/หลังแบบบางบนชิ้นส่วนเหล่านี้ พร้อมชั้นหลักฐานภาพหนึ่งชั้น

## โมเดลหลักฐาน

ทุกการรันเขียนไดเรกทอรีอาร์ติแฟกต์ที่เสถียร:

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

`mantis-summary.json` ควรเป็นแหล่งความจริงที่เครื่องอ่านได้ รายงาน Markdown ใช้สำหรับคอมเมนต์ PR และการรีวิวโดยมนุษย์

summary ต้องมี:

- ref และ SHA ที่ทดสอบ
- ทรานสปอร์ตและรหัสสถานการณ์
- ผู้ให้บริการเครื่องและรหัสเครื่องหรือรหัส lease
- แหล่งข้อมูลประจำตัวโดยไม่มีค่าความลับ
- ผลลัพธ์ baseline
- ผลลัพธ์ candidate
- บั๊กถูกทำซ้ำบน baseline หรือไม่
- candidate แก้ไขได้หรือไม่
- พาธอาร์ติแฟกต์
- ปัญหาการตั้งค่าหรือการล้างข้อมูลที่ผ่านการทำให้ปลอดภัยแล้ว

ภาพหน้าจอคือหลักฐาน ไม่ใช่ความลับ แต่ยังต้องมีวินัยด้านการ redact: ชื่อช่องส่วนตัว ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏ สำหรับ PR สาธารณะ ให้ใช้ลิงก์อาร์ติแฟกต์ GitHub Actions แทนภาพ inline จนกว่าเรื่องการ redact จะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

เลนเบราว์เซอร์มีสองโหมด:

- **ระบบอัตโนมัติแบบ headless**: ค่าเริ่มต้นสำหรับ CI Chrome รันโดยเปิด CDP และ Playwright หรือการควบคุมเบราว์เซอร์ของ OpenClaw จะเก็บภาพหน้าจอ
- **การกู้ผ่าน VNC**: เปิดใช้บน VM เดียวกันเมื่อการเข้าสู่ระบบ MFA ระบบป้องกันอัตโนมัติของ Discord หรือการดีบักภาพต้องใช้มนุษย์

โปรไฟล์เบราว์เซอร์ผู้สังเกตการณ์ Discord ควรคงอยู่เพียงพอเพื่อหลีกเลี่ยง
การเข้าสู่ระบบทุกครั้งที่รัน แต่ต้องแยกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์
เป็นของพูลเครื่อง Mantis ไม่ใช่แล็ปท็อปของนักพัฒนา

เมื่อ Mantis ติดขัด ระบบจะโพสต์ข้อความสถานะ Discord พร้อมข้อมูลต่อไปนี้:

- id การรัน
- id สถานการณ์
- ผู้ให้บริการเครื่อง
- ไดเรกทอรีอาร์ติแฟกต์
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความตัวบล็อกสั้น ๆ

การปรับใช้แบบส่วนตัวครั้งแรกสามารถโพสต์ข้อความเหล่านี้ไปยังช่องผู้ปฏิบัติงาน
ที่มีอยู่ แล้วค่อยย้ายไปยังช่อง Mantis เฉพาะในภายหลัง

## เครื่อง

Mantis ควรเลือกใช้ AWS ผ่าน Crabbox สำหรับการใช้งานระยะไกลครั้งแรก
Crabbox ให้เครื่องที่อุ่นไว้แล้ว การติดตามสัญญาเช่า การเติมสภาพแวดล้อม ล็อก ผลลัพธ์ และ
การทำความสะอาด หากความจุของ AWS ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่มผู้ให้บริการ Hetzner
ไว้หลังอินเทอร์เฟซเครื่องเดียวกัน

ข้อกำหนด VM ขั้นต่ำ:

- Linux ที่มี Chrome หรือ Chromium ซึ่งรองรับเดสก์ท็อปติดตั้งอยู่
- การเข้าถึง CDP สำหรับการทำงานอัตโนมัติของเบราว์เซอร์
- VNC หรือ noVNC สำหรับการกู้คืน
- Node 22 และ pnpm
- การ checkout OpenClaw และแคช dependency
- แคชเบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และหน่วยความจำเพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว เบราว์เซอร์หนึ่งตัว และการรันโมเดลหนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, ผู้ให้บริการโมเดล และโบรกเกอร์ข้อมูลรับรอง

VM ไม่ควรเก็บความลับดิบที่มีอายุยาวนอกเหนือจากที่เก็บข้อมูลรับรองหรือ
ที่เก็บโปรไฟล์เบราว์เซอร์ที่คาดไว้

## ความลับ

ความลับอยู่ใน GitHub organization หรือ repository secrets สำหรับการรันระยะไกล และอยู่ใน
ไฟล์ความลับภายในเครื่องที่ควบคุมโดยผู้ปฏิบัติงานสำหรับการรันภายในเครื่อง

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

ในระยะยาว พูลข้อมูลรับรอง Convex ควรยังคงเป็นแหล่งปกติสำหรับข้อมูลรับรอง
การขนส่งแบบสด GitHub secrets ใช้บูตสแตรปโบรกเกอร์และเลนสำรอง
เวิร์กโฟลว์สถานะ-รีแอ็กชันของ Discord จับคู่ความลับ Mantis Crabbox กลับไปยัง
ตัวแปรสภาพแวดล้อม `CRABBOX_COORDINATOR` และ `CRABBOX_COORDINATOR_TOKEN`
ที่ Crabbox CLI คาดหวัง ชื่อ GitHub secret แบบธรรมดา `CRABBOX_*` ยังคง
ได้รับการยอมรับเป็น fallback เพื่อความเข้ากันได้

ตัวรัน Mantis ต้องไม่พิมพ์สิ่งต่อไปนี้:

- โทเค็นบอต Discord
- คีย์ API ของผู้ให้บริการ
- คุกกี้เบราว์เซอร์
- เนื้อหาโปรไฟล์การยืนยันตัวตน
- รหัสผ่าน VNC
- payload ข้อมูลรับรองดิบ

การอัปโหลดอาร์ติแฟกต์สาธารณะควรปกปิดเมทาดาทาเป้าหมาย Discord ด้วย เช่น id ของบอต,
กิลด์, ช่อง และข้อความ เวิร์กโฟลว์ smoke ของ GitHub เปิดใช้
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หากโทเค็นถูกวางลงใน issue, PR, แชต หรือบันทึกโดยไม่ได้ตั้งใจ ให้หมุนเวียนโทเค็นนั้น
หลังจากเก็บความลับใหม่แล้ว

## GitHub Artifacts และความคิดเห็น PR

เวิร์กโฟลว์ Mantis ควรอัปโหลดชุดหลักฐานเต็มเป็นอาร์ติแฟกต์ Actions
ที่มีอายุสั้น เมื่อเวิร์กโฟลว์ถูกรันสำหรับรายงานบั๊กหรือ PR แก้ไข ควร
เผยแพร่ภาพหน้าจอ PNG ที่ปกปิดแล้วไปยัง branch `qa-artifacts` และ upsert
ความคิดเห็นบนบั๊กหรือ PR แก้ไขนั้นพร้อมภาพหน้าจอแบบ inline ก่อน/หลัง อย่าโพสต์
หลักฐานหลักไว้เฉพาะบน PR ระบบอัตโนมัติ QA ทั่วไป ล็อกดิบ ข้อความที่สังเกตเห็น
และหลักฐานขนาดใหญ่อื่น ๆ ให้อยู่ในอาร์ติแฟกต์ Actions

เวิร์กโฟลว์โปรดักชันควรโพสต์ความคิดเห็นเหล่านั้นด้วย Mantis GitHub App ไม่ใช่
ด้วย `github-actions[bot]` เก็บ app id และ private key เป็น GitHub Actions
secrets ชื่อ `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY`
เวิร์กโฟลว์ใช้ marker ที่ซ่อนอยู่เป็นคีย์ upsert อัปเดตความคิดเห็นนั้นเมื่อ
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

เมื่อการรันล้มเหลวเพราะ harness ล้มเหลว ความคิดเห็นต้องระบุเช่นนั้น
แทนที่จะสื่อว่าตัวเลือก candidate ล้มเหลว

## หมายเหตุการปรับใช้แบบส่วนตัว

การปรับใช้แบบส่วนตัวอาจมีแอปพลิเคชัน Discord ของ Mantis อยู่แล้ว ให้นำ
แอปพลิเคชันนั้นกลับมาใช้แทนการสร้างแอปใหม่ เมื่อแอปนั้นมีสิทธิ์บอตที่ถูกต้อง
และสามารถหมุนเวียนได้อย่างปลอดภัย

ตั้งค่าช่องแจ้งเตือนผู้ปฏิบัติงานเริ่มต้นผ่าน secrets หรือการกำหนดค่าการปรับใช้
ช่องนี้สามารถชี้ไปยังช่องผู้ดูแลหรือปฏิบัติการที่มีอยู่ก่อน แล้วค่อยย้ายไปยัง
ช่อง Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่ guild ids, channel ids, bot tokens, browser cookies หรือ VNC passwords
ในเอกสารนี้ ให้เก็บไว้ใน GitHub secrets, โบรกเกอร์ข้อมูลรับรอง หรือที่เก็บ
ความลับภายในเครื่องของผู้ปฏิบัติงาน

## การเพิ่มสถานการณ์

สถานการณ์ Mantis ควรประกาศ:

- id และชื่อเรื่อง
- การขนส่ง
- ข้อมูลรับรองที่ต้องใช้
- นโยบาย baseline ref
- นโยบาย candidate ref
- patch การกำหนดค่า OpenClaw
- ขั้นตอนการตั้งค่า
- สิ่งกระตุ้น
- oracle baseline ที่คาดหวัง
- oracle candidate ที่คาดหวัง
- เป้าหมายการจับภาพ
- งบประมาณเวลา timeout
- ขั้นตอนการทำความสะอาด

สถานการณ์ควรเลือกใช้ oracle ขนาดเล็กที่มี type:

- สถานะรีแอ็กชัน Discord สำหรับบั๊กรีแอ็กชัน
- การอ้างอิงข้อความ Discord สำหรับบั๊ก threading
- thread ts ของ Slack และสถานะ API รีแอ็กชันสำหรับบั๊ก Slack
- id ข้อความอีเมลและส่วนหัวสำหรับบั๊กอีเมล
- ภาพหน้าจอเบราว์เซอร์เมื่อ UI เป็นสิ่งที่สังเกตได้อย่างน่าเชื่อถือเพียงอย่างเดียว

การตรวจด้วย vision ควรเป็นแบบเพิ่มเติม หาก API ของแพลตฟอร์มสามารถพิสูจน์บั๊กได้ ให้ใช้
API เป็น oracle ผ่าน/ไม่ผ่าน และเก็บภาพหน้าจอไว้เพื่อเพิ่มความมั่นใจของมนุษย์

## การขยายผู้ให้บริการ

หลังจาก Discord ตัวรันเดียวกันสามารถเพิ่ม:

- Slack: รีแอ็กชัน, thread, app mentions, modals, การอัปโหลดไฟล์
- อีเมล: การยืนยันตัวตน Gmail และ message threading โดยใช้ `gog` เมื่อ connector
  ไม่เพียงพอ
- WhatsApp: การเข้าสู่ระบบ QR, การระบุตัวตนใหม่, การส่งข้อความ, สื่อ, รีแอ็กชัน
- Telegram: group mention gating, คำสั่ง, รีแอ็กชันเมื่อพร้อมใช้งาน
- Matrix: ห้องที่เข้ารหัส, ความสัมพันธ์ของ thread หรือ reply, การ resume หลัง restart

แต่ละการขนส่งควรมีสถานการณ์ smoke ราคาถูกหนึ่งรายการ และสถานการณ์ตามกลุ่มบั๊กหนึ่งรายการขึ้นไป
สถานการณ์ภาพที่มีค่าใช้จ่ายสูงควรเป็นแบบ opt-in

## คำถามที่ยังเปิดอยู่

- บอต Discord ใดควรเป็น driver และบอตใดควรเป็น SUT เมื่อมีการนำ
  บอต Mantis ที่มีอยู่กลับมาใช้
- การเข้าสู่ระบบเบราว์เซอร์ผู้สังเกตการณ์ควรใช้บัญชี Discord ของมนุษย์ บัญชีทดสอบ
  หรือใช้เฉพาะหลักฐาน REST ที่บอตอ่านได้สำหรับเฟสแรก
- GitHub ควรเก็บอาร์ติแฟกต์ Mantis สำหรับ PR ไว้นานเท่าใด
- เมื่อใด ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติแทนการรอคำสั่ง
  จากผู้ดูแล
- ภาพหน้าจอควรถูกปกปิดหรือตัดก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่
