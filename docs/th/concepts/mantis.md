---
read_when:
    - การสร้างหรือเรียกใช้การประกันคุณภาพด้านภาพแบบสดสำหรับข้อบกพร่องของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึง
    - การเพิ่มสถานการณ์การรับส่งแบบสดสำหรับ Discord, Slack, WhatsApp หรือช่องทางอื่น ๆ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ การทำงานอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis คือระบบตรวจสอบยืนยันเชิงภาพตั้งแต่ต้นจนจบสำหรับทำซ้ำบั๊กของ OpenClaw บนทรานสปอร์ตจริง บันทึกหลักฐานก่อนและหลัง และแนบอาร์ติแฟกต์ไปยังคำขอรวมโค้ด
title: ตั๊กแตนตำข้าว
x-i18n:
    generated_at: "2026-05-03T21:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis คือระบบตรวจสอบแบบ end-to-end ของ OpenClaw สำหรับบั๊กที่ต้องใช้รันไทม์จริง ทรานสปอร์ตจริง และหลักฐานที่มองเห็นได้ ระบบจะรันสถานการณ์กับเรฟที่ทราบว่าเสีย เก็บหลักฐาน รันสถานการณ์เดียวกันกับเรฟตัวเลือก แล้วเผยแพร่การเปรียบเทียบเป็นอาร์ติแฟกต์ที่ผู้ดูแลสามารถตรวจสอบได้จาก PR หรือจากคำสั่งภายในเครื่อง

Mantis เริ่มจาก Discord เพราะ Discord ให้เลนแรกที่มีคุณค่าสูงแก่เรา: การยืนยันตัวตนบอตจริง แชนเนลกิลด์จริง รีแอ็กชัน เธรด คำสั่งเนทีฟ และ UI บนเบราว์เซอร์ที่มนุษย์สามารถยืนยันด้วยสายตาได้ว่าทรานสปอร์ตแสดงอะไร

## เป้าหมาย

- ทำซ้ำบั๊กจาก issue หรือ PR บน GitHub ด้วยรูปแบบทรานสปอร์ตเดียวกับที่ผู้ใช้เห็น
- เก็บอาร์ติแฟกต์ **ก่อนแก้** บนเรฟฐานก่อนใช้การแก้ไข
- เก็บอาร์ติแฟกต์ **หลังแก้** บนเรฟตัวเลือกหลังใช้การแก้ไข
- ใช้ตัวชี้ขาดที่กำหนดได้แน่นอนเมื่อเป็นไปได้ เช่น การอ่านรีแอ็กชันผ่าน Discord REST หรือการตรวจทรานสคริปต์ของแชนเนล
- เก็บภาพหน้าจอเมื่อบั๊กมีพื้นผิว UI ที่มองเห็นได้
- รันภายในเครื่องจาก CLI ที่เอเจนต์ควบคุม และรันระยะไกลจาก GitHub
- เก็บสถานะเครื่องให้เพียงพอสำหรับการกู้ผ่าน VNC เมื่อการเข้าสู่ระบบ ระบบอัตโนมัติของเบราว์เซอร์ หรือการยืนยันตัวตนกับผู้ให้บริการติดขัด
- โพสต์สถานะที่กระชับไปยังแชนเนล Discord สำหรับผู้ปฏิบัติการเมื่อการรันถูกบล็อก ต้องการความช่วยเหลือผ่าน VNC แบบแมนนวล หรือเสร็จสิ้น

## สิ่งที่ไม่ใช่เป้าหมาย

- Mantis ไม่ใช่สิ่งทดแทน unit tests โดยปกติการรัน Mantis ควรถูกแปลงเป็นการทดสอบถดถอยที่เล็กลงหลังเข้าใจการแก้ไขแล้ว
- Mantis ไม่ใช่เกต CI ปกติที่รวดเร็ว ระบบช้ากว่า ใช้ข้อมูลลับจริง และสงวนไว้สำหรับบั๊กที่สภาพแวดล้อมจริงมีความสำคัญ
- Mantis ไม่ควรต้องมีมนุษย์สำหรับการทำงานปกติ VNC แบบแมนนวลคือเส้นทางกู้คืน ไม่ใช่เส้นทางหลัก
- Mantis ไม่เก็บข้อมูลลับดิบไว้ในอาร์ติแฟกต์ ล็อก ภาพหน้าจอ รายงาน Markdown หรือคอมเมนต์ PR

## ความเป็นเจ้าของ

Mantis อยู่ในสแตก QA ของ OpenClaw

- OpenClaw เป็นเจ้าของรันไทม์สถานการณ์ อะแดปเตอร์ทรานสปอร์ต สคีมาหลักฐาน และ CLI ภายในเครื่องใต้ `pnpm openclaw qa mantis`
- QA Lab เป็นเจ้าของชิ้นส่วนชุดทดสอบทรานสปอร์ตจริง ตัวช่วยจับภาพเบราว์เซอร์ และตัวเขียนอาร์ติแฟกต์
- Crabbox เป็นเจ้าของเครื่อง Linux ที่อุ่นไว้แล้วเมื่อจำเป็นต้องใช้ VM ระยะไกล
- GitHub Actions เป็นเจ้าของจุดเข้าเวิร์กโฟลว์ระยะไกลและการเก็บรักษาอาร์ติแฟกต์
- ClawSweeper เป็นเจ้าของการกำหนดเส้นทางคอมเมนต์ GitHub: การแยกวิเคราะห์คำสั่งผู้ดูแล การ dispatch เวิร์กโฟลว์ และการโพสต์คอมเมนต์ PR สุดท้าย
- เอเจนต์ OpenClaw ขับเคลื่อน Mantis ผ่าน Codex เมื่อสถานการณ์ต้องการการตั้งค่าแบบเอเจนต์ การดีบัก หรือการรายงานสถานะติดขัด

ขอบเขตนี้เก็บความรู้ด้านทรานสปอร์ตไว้ใน OpenClaw การจัดตารางเครื่องไว้ใน Crabbox และกาวเชื่อมเวิร์กโฟลว์ผู้ดูแลไว้ใน ClawSweeper

## รูปแบบคำสั่ง

คำสั่งภายในเครื่องแรกตรวจสอบบอต Discord, กิลด์, แชนเนล, การส่งข้อความ, การส่งรีแอ็กชัน และพาธอาร์ติแฟกต์:

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

ตัวรันสร้าง worktree ฐานและตัวเลือกแบบ detached ใต้ไดเรกทอรีเอาต์พุต ติดตั้ง dependencies สร้างแต่ละเรฟ รันสถานการณ์ด้วย `--allow-failures` จากนั้นเขียน `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` สำหรับสถานการณ์ Discord แรก การตรวจสอบที่สำเร็จหมายถึงสถานะฐานคือ `fail` และสถานะตัวเลือกคือ `pass`

เวิร์กโฟลว์ smoke ของ GitHub คือ `Mantis Discord Smoke` เวิร์กโฟลว์ก่อนและหลังบน GitHub สำหรับสถานการณ์จริงแรกคือ `Mantis Discord Status Reactions` โดยรับค่า:

- `baseline_ref`: เรฟที่คาดว่าจะทำซ้ำพฤติกรรม queued-only
- `candidate_ref`: เรฟที่คาดว่าจะแสดง `queued -> thinking -> done`

ระบบจะเช็คเอาต์เรฟชุดทดสอบเวิร์กโฟลว์ สร้าง worktree ฐานและตัวเลือกแยกกัน รัน `discord-status-reactions-tool-only` กับแต่ละ worktree และอัปโหลด `baseline/`, `candidate/`, `comparison.json` และ `mantis-report.md` เป็นอาร์ติแฟกต์ของ Actions

คุณยังสามารถทริกเกอร์การรัน status-reactions โดยตรงจากคอมเมนต์ PR ได้:

```text
@Mantis discord status reactions
```

ทริกเกอร์คอมเมนต์ถูกจำกัดไว้อย่างตั้งใจ โดยจะรันเฉพาะคอมเมนต์ใน pull request จากผู้ใช้ที่มีสิทธิ์ write, maintain หรือ admin และจะจดจำเฉพาะคำขอ status-reaction ของ Discord เท่านั้น โดยค่าเริ่มต้นจะใช้เรฟฐานที่ทราบว่าเสีย และ SHA ของหัว PR ปัจจุบันเป็นตัวเลือก ผู้ดูแลสามารถแทนที่เรฟใดก็ได้:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ตัวอย่างคำสั่ง ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

คำสั่งแรกระบุชัดเจนและโฟกัสที่สถานการณ์ คำสั่งที่สองสามารถแมป PR หรือ issue ไปยังสถานการณ์ Mantis ที่แนะนำจาก labels, ไฟล์ที่เปลี่ยน และข้อค้นพบจากการรีวิวของ ClawSweeper ได้ในภายหลัง

## วงจรชีวิตการรัน

1. รับ credentials
2. จัดสรรหรือนำ VM มาใช้ซ้ำ
3. เตรียม checkout ที่สะอาดสำหรับเรฟฐาน
4. ติดตั้ง dependencies และ build เฉพาะสิ่งที่สถานการณ์ต้องใช้
5. เริ่ม OpenClaw Gateway ลูกด้วยไดเรกทอรีสถานะแยก
6. กำหนดค่าทรานสปอร์ตจริง ผู้ให้บริการ โมเดล และโปรไฟล์เบราว์เซอร์
7. รันสถานการณ์และเก็บหลักฐานฐาน
8. หยุด Gateway และเก็บล็อกไว้
9. เตรียมเรฟตัวเลือกใน VM เดียวกัน
10. รันสถานการณ์เดียวกันและเก็บหลักฐานตัวเลือก
11. เปรียบเทียบผลตัวชี้ขาดและหลักฐานภาพ
12. เขียน Markdown, JSON, ล็อก, ภาพหน้าจอ และอาร์ติแฟกต์ trace ทางเลือก
13. อัปโหลดอาร์ติแฟกต์ GitHub Actions
14. โพสต์ข้อความสถานะ PR หรือ Discord ที่กระชับ

สถานการณ์ควรล้มเหลวได้สองแบบที่ต่างกัน:

- **ทำซ้ำบั๊กได้**: ฐานล้มเหลวตามวิธีที่คาดไว้
- **ชุดทดสอบล้มเหลว**: การตั้งค่าสภาพแวดล้อม, credentials, Discord API, เบราว์เซอร์ หรือผู้ให้บริการล้มเหลวก่อนที่ตัวชี้ขาดของบั๊กจะมีความหมาย

รายงานสุดท้ายต้องแยกกรณีเหล่านี้เพื่อให้ผู้ดูแลไม่สับสนระหว่างสภาพแวดล้อมที่ไม่เสถียรกับพฤติกรรมของผลิตภัณฑ์

## Discord MVP

สถานการณ์แรกควรมุ่งไปที่รีแอ็กชันสถานะของ Discord ในแชนเนลกิลด์ที่โหมดการส่งคำตอบต้นทางเป็น `message_tool_only`

เหตุผลที่เป็นจุดเริ่มต้น Mantis ที่ดี:

- มองเห็นได้ใน Discord เป็นรีแอ็กชันบนข้อความที่ทริกเกอร์
- มีตัวชี้ขาด REST ที่แข็งแรงผ่านสถานะรีแอ็กชันของข้อความ Discord
- ครอบคลุม OpenClaw Gateway จริง การยืนยันตัวตนบอต Discord การ dispatch ข้อความ โหมดการส่งคำตอบต้นทาง สถานะรีแอ็กชันสถานะ และวงจรชีวิต turn ของโมเดล
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

หลักฐานฐานควรแสดงรีแอ็กชันตอบรับแบบ queued แต่ไม่มีการเปลี่ยนผ่านวงจรชีวิตในโหมด tool-only หลักฐานตัวเลือกควรแสดงรีแอ็กชันสถานะตามวงจรชีวิตที่รันเมื่อ `messages.statusReactions.enabled` เป็น true อย่างชัดเจน

ส่วนแรกที่รันได้คือสถานการณ์ QA จริงของ Discord แบบ opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

ระบบกำหนดค่า SUT ด้วยการจัดการกิลด์แบบเปิดตลอด, `visibleReplies: "message_tool"`, `ackReaction: "👀"` และรีแอ็กชันสถานะอย่างชัดเจน ตัวชี้ขาดจะโพลข้อความ Discord จริงที่ทริกเกอร์ และคาดหวังลำดับที่สังเกตได้ `👀 -> 🤔 -> 👍` อาร์ติแฟกต์ประกอบด้วย `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` และ `discord-status-reactions-tool-only-timeline.png`

## ชิ้นส่วน QA ที่มีอยู่

Mantis ควรต่อยอดจากสแตก QA ส่วนตัวที่มีอยู่แทนที่จะเริ่มจากศูนย์:

- `pnpm openclaw qa discord` รันเลน Discord จริงพร้อมบอต driver และ SUT อยู่แล้ว
- ตัวรันทรานสปอร์ตจริงเขียนรายงานและอาร์ติแฟกต์ observed-message ใต้ `.artifacts/qa-e2e/` อยู่แล้ว
- การเช่า credential ของ Convex ให้สิทธิ์เข้าถึง credentials ทรานสปอร์ตจริงแบบใช้ร่วมกันอย่างเป็นเอกสิทธิ์อยู่แล้ว
- บริการควบคุมเบราว์เซอร์รองรับภาพหน้าจอ สแนปชอต โปรไฟล์แบบจัดการ headless และโปรไฟล์ CDP ระยะไกลอยู่แล้ว
- QA Lab มี UI ดีบักเกอร์และบัสสำหรับการทดสอบที่มีรูปแบบทรานสปอร์ตอยู่แล้ว

การใช้งาน Mantis ครั้งแรกสามารถเป็นตัวรันก่อน/หลังบางๆ บนชิ้นส่วนเหล่านี้ พร้อมชั้นหลักฐานภาพหนึ่งชั้น

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

`mantis-summary.json` ควรเป็นแหล่งความจริงที่เครื่องอ่านได้ รายงาน Markdown มีไว้สำหรับคอมเมนต์ PR และการรีวิวโดยมนุษย์

สรุปต้องมี:

- refs และ SHAs ที่ทดสอบ
- ทรานสปอร์ตและรหัสสถานการณ์
- ผู้ให้บริการเครื่องและรหัสเครื่องหรือรหัส lease
- แหล่งที่มาของ credential โดยไม่มีค่าลับ
- ผลลัพธ์ฐาน
- ผลลัพธ์ตัวเลือก
- บั๊กทำซ้ำบนฐานได้หรือไม่
- ตัวเลือกแก้ไขได้หรือไม่
- พาธอาร์ติแฟกต์
- ปัญหาการตั้งค่าหรือการล้างข้อมูลที่ sanitize แล้ว

ภาพหน้าจอคือหลักฐาน ไม่ใช่ข้อมูลลับ แต่ยังต้องมีวินัยในการ redaction: ชื่อแชนเนลส่วนตัว ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏ สำหรับ PR สาธารณะ ให้ใช้ลิงก์อาร์ติแฟกต์ GitHub Actions แทนภาพแบบ inline จนกว่าเรื่องการ redaction จะแข็งแรงขึ้น

## เบราว์เซอร์และ VNC

เลนเบราว์เซอร์มีสองโหมด:

- **ระบบอัตโนมัติแบบ headless**: ค่าเริ่มต้นสำหรับ CI โดย Chrome รันพร้อมเปิด CDP และ Playwright หรือระบบควบคุมเบราว์เซอร์ของ OpenClaw จะจับภาพหน้าจอ
- **การกู้ผ่าน VNC**: เปิดใช้บน VM เดียวกันเมื่อการเข้าสู่ระบบ, MFA, การป้องกันอัตโนมัติของ Discord หรือการดีบักภาพต้องการมนุษย์

โปรไฟล์เบราว์เซอร์ผู้สังเกตการณ์ Discord ควรคงอยู่เพียงพอเพื่อหลีกเลี่ยงการเข้าสู่ระบบทุกครั้งที่รัน แต่แยกออกจากสถานะเบราว์เซอร์ส่วนตัว โปรไฟล์เป็นของพูลเครื่อง Mantis ไม่ใช่แล็ปท็อปของนักพัฒนา

เมื่อ Mantis ติดขัด ระบบจะโพสต์ข้อความสถานะ Discord พร้อม:

- รหัสการรัน
- รหัสสถานการณ์
- ผู้ให้บริการเครื่อง
- ไดเรกทอรีอาร์ติแฟกต์
- คำแนะนำการเชื่อมต่อ VNC หรือ noVNC หากมี
- ข้อความบล็อกสั้นๆ

การใช้งานส่วนตัวครั้งแรกสามารถโพสต์ข้อความเหล่านี้ไปยังแชนเนลผู้ปฏิบัติการที่มีอยู่ และย้ายไปยังแชนเนล Mantis เฉพาะในภายหลัง

## เครื่อง

Mantis ควรเลือกใช้ AWS ผ่าน Crabbox สำหรับการใช้งานระยะไกลครั้งแรก Crabbox ให้เครื่องที่อุ่นไว้แล้ว การติดตาม lease การเติมสภาพแวดล้อม ล็อก ผลลัพธ์ และการล้างข้อมูล หากความจุ AWS ช้าเกินไปหรือไม่พร้อมใช้งาน ให้เพิ่มผู้ให้บริการ Hetzner ไว้หลังอินเทอร์เฟซเครื่องเดียวกัน

ข้อกำหนดขั้นต่ำของ VM:

- Linux ที่มีการติดตั้ง Chrome หรือ Chromium ที่รองรับเดสก์ท็อป
- การเข้าถึง CDP สำหรับระบบอัตโนมัติของเบราว์เซอร์
- VNC หรือ noVNC สำหรับการกู้
- Node 22 และ pnpm
- OpenClaw checkout และแคช dependency
- แคชเบราว์เซอร์ Playwright Chromium เมื่อใช้ Playwright
- CPU และหน่วยความจำเพียงพอสำหรับ OpenClaw Gateway หนึ่งตัว เบราว์เซอร์หนึ่งตัว และการรันโมเดลหนึ่งครั้ง
- การเข้าถึงขาออกไปยัง Discord, GitHub, ผู้ให้บริการโมเดล และ credential broker

VM ไม่ควรเก็บข้อมูลลับดิบที่มีอายุยืนยาวไว้นอกแหล่งเก็บ credential หรือโปรไฟล์เบราว์เซอร์ที่คาดไว้

## ข้อมูลลับ

ข้อมูลลับอยู่ใน secrets ระดับองค์กรหรือ repository ของ GitHub สำหรับการรันระยะไกล และอยู่ในไฟล์ secret ที่ผู้ปฏิบัติการควบคุมภายในเครื่องสำหรับการรันภายในเครื่อง

ชื่อ secret ที่แนะนำ:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลด artifact ของ GitHub แบบสาธารณะ
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

ในระยะยาว พูลข้อมูลประจำตัวของ Convex ควรยังคงเป็นแหล่งปกติสำหรับข้อมูลประจำตัวของการรับส่งแบบ live
GitHub secrets ใช้ bootstrap broker และเลนสำรอง

Mantis runner ต้องไม่พิมพ์สิ่งต่อไปนี้เด็ดขาด:

- โทเค็นบอต Discord
- คีย์ API ของ provider
- คุกกี้เบราว์เซอร์
- เนื้อหา auth profile
- รหัสผ่าน VNC
- เพย์โหลดข้อมูลประจำตัวแบบ raw

การอัปโหลด artifact แบบสาธารณะควรปกปิด metadata เป้าหมายของ Discord เช่น id ของบอต,
guild, channel และ message ด้วย เวิร์กโฟลว์ smoke ของ GitHub เปิดใช้
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` ด้วยเหตุผลนี้

หากมีการวางโทเค็นลงใน issue, PR, แชต หรือ log โดยไม่ตั้งใจ ให้หมุนเวียนโทเค็นนั้น
หลังจากเก็บ secret ใหม่แล้ว

## GitHub Artifacts และความคิดเห็น PR

เวิร์กโฟลว์ Mantis ควรอัปโหลดชุดหลักฐานครบถ้วนเป็น artifact ของ Actions ที่มีอายุสั้น
เมื่อรันเวิร์กโฟลว์สำหรับรายงานบั๊กหรือ PR แก้ไข ควรเผยแพร่ภาพหน้าจอ PNG ที่ปกปิดข้อมูลแล้วไปยัง branch `qa-artifacts` ด้วย และ upsert
ความคิดเห็นในบั๊กหรือ PR แก้ไขนั้นพร้อมภาพหน้าจอ before/after แบบ inline อย่าโพสต์
หลักฐานหลักไว้เฉพาะบน PR ระบบอัตโนมัติ QA ทั่วไปเท่านั้น log แบบ raw, ข้อความที่สังเกตได้,
และหลักฐานขนาดใหญ่อื่น ๆ ให้อยู่ใน artifact ของ Actions

เวิร์กโฟลว์ production ควรโพสต์ความคิดเห็นเหล่านั้นด้วย Mantis GitHub App ไม่ใช่
`github-actions[bot]` ให้เก็บ app id และ private key เป็น GitHub Actions
secrets ชื่อ `MANTIS_GITHUB_APP_ID` และ `MANTIS_GITHUB_APP_PRIVATE_KEY`
เวิร์กโฟลว์ใช้ marker ที่ซ่อนไว้เป็นคีย์ upsert อัปเดตความคิดเห็นนั้นเมื่อโทเค็นแก้ไขได้
และสร้างความคิดเห็นใหม่ที่ Mantis เป็นเจ้าของเมื่อ marker เก่าที่บอตเป็นเจ้าของไม่สามารถแก้ไขได้

ความคิดเห็น PR ควรสั้นและเน้นภาพ:

```md
Mantis Discord Status Reactions QA

สรุป: Mantis รันบั๊ก status-reaction ของ Discord ที่รายงานอีกครั้งกับ baseline ที่ทราบว่า
เสียและ candidate fix baseline ทำให้เกิดบั๊กซ้ำได้ ส่วน candidate แสดงลำดับ queued -> thinking -> done ตามที่คาดไว้

- สถานการณ์: `discord-status-reactions-tool-only`
- การรัน: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` ที่ `<sha>`
- Candidate: `<status>` ที่ `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

เมื่อการรันล้มเหลวเพราะ harness ล้มเหลว ความคิดเห็นต้องระบุเรื่องนั้นแทน
การสื่อเป็นนัยว่า candidate ล้มเหลว

## หมายเหตุการปรับใช้แบบส่วนตัว

การปรับใช้แบบส่วนตัวอาจมีแอปพลิเคชัน Mantis Discord อยู่แล้ว ให้ใช้ซ้ำ
แอปพลิเคชันนั้นแทนการสร้าง app อีกตัว เมื่อมีสิทธิ์บอตที่ถูกต้อง
และสามารถหมุนเวียนได้อย่างปลอดภัย

ตั้งค่าช่องทางแจ้งเตือน operator เริ่มต้นผ่าน secrets หรือ configuration ของการปรับใช้
ช่องทางนี้สามารถชี้ไปยังช่อง maintainer หรือ operations ที่มีอยู่ก่อน
แล้วจึงย้ายไปยังช่อง Mantis เฉพาะเมื่อมีช่องนั้นแล้ว

อย่าใส่ guild ids, channel ids, bot tokens, browser cookies หรือ VNC passwords
ในเอกสารนี้ ให้เก็บไว้ใน GitHub secrets, credential broker หรือ secret store ภายในเครื่องของ operator

## การเพิ่มสถานการณ์

สถานการณ์ Mantis ควรประกาศ:

- id และ title
- transport
- ข้อมูลประจำตัวที่ต้องใช้
- นโยบาย baseline ref
- นโยบาย candidate ref
- patch การกำหนดค่า OpenClaw
- ขั้นตอนการตั้งค่า
- stimulus
- oracle baseline ที่คาดไว้
- oracle candidate ที่คาดไว้
- เป้าหมาย visual capture
- งบประมาณ timeout
- ขั้นตอน cleanup

สถานการณ์ควรเลือกใช้ oracle ขนาดเล็กที่มี type:

- สถานะ reaction ของ Discord สำหรับบั๊ก reaction
- การอ้างอิงข้อความ Discord สำหรับบั๊ก threading
- thread ts ของ Slack และสถานะ reaction API สำหรับบั๊ก Slack
- id ข้อความอีเมลและ headers สำหรับบั๊กอีเมล
- ภาพหน้าจอเบราว์เซอร์เมื่อ UI เป็นสิ่งที่สังเกตได้อย่างน่าเชื่อถือเพียงอย่างเดียว

การตรวจสอบด้วย vision ควรเป็นแบบเพิ่มเติม หาก API ของแพลตฟอร์มสามารถพิสูจน์บั๊กได้ ให้ใช้
API เป็น oracle pass/fail และเก็บภาพหน้าจอไว้เพื่อเพิ่มความมั่นใจให้มนุษย์

## การขยาย Provider

หลังจาก Discord runner เดียวกันสามารถเพิ่มได้:

- Slack: reactions, threads, app mentions, modals, file uploads
- Email: การ auth ของ Gmail และ message threading โดยใช้ `gog` เมื่อ connectors ไม่เพียงพอ
- WhatsApp: การเข้าสู่ระบบด้วย QR, การระบุตัวตนซ้ำ, การส่งข้อความ, media, reactions
- Telegram: group mention gating, commands, reactions เมื่อพร้อมใช้งาน
- Matrix: ห้องที่เข้ารหัส, ความสัมพันธ์แบบ thread หรือ reply, การ resume หลัง restart

แต่ละ transport ควรมีสถานการณ์ smoke ราคาถูกหนึ่งรายการและสถานการณ์ตามกลุ่มบั๊กอย่างน้อยหนึ่งรายการ
สถานการณ์ visual ที่มีค่าใช้จ่ายสูงควรเป็นแบบ opt-in

## คำถามที่ยังเปิดอยู่

- บอต Discord ตัวใดควรเป็น driver และตัวใดควรเป็น SUT เมื่อ
  ใช้บอต Mantis ที่มีอยู่ซ้ำ
- การเข้าสู่ระบบเบราว์เซอร์ของ observer ควรใช้บัญชี Discord ของมนุษย์, บัญชีทดสอบ,
  หรือใช้เฉพาะหลักฐาน REST ที่บอตอ่านได้สำหรับเฟสแรก
- GitHub ควรเก็บ artifact ของ Mantis สำหรับ PR ไว้นานเท่าใด
- ClawSweeper ควรแนะนำ Mantis โดยอัตโนมัติเมื่อใด แทนที่จะรอ
  คำสั่งจาก maintainer
- ควรปกปิดหรือตัดภาพหน้าจอก่อนอัปโหลดสำหรับ PR สาธารณะหรือไม่
