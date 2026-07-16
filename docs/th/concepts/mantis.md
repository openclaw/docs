---
read_when:
    - การสร้างหรือเรียกใช้การตรวจสอบคุณภาพด้านภาพแบบสดสำหรับข้อบกพร่องของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับ pull request
    - การเพิ่มสถานการณ์การรับส่งข้อมูลแบบสดสำหรับ Discord, Slack, WhatsApp หรือช่องทางอื่นๆ
    - กำลังดำเนินการพิสูจน์การทำงานบนเบราว์เซอร์ของ Control UI แบบเจาะจงสำหรับ candidate ref
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ ระบบอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis บันทึกหลักฐานแบบภาพตั้งแต่ต้นจนจบสำหรับการเปรียบเทียบการรับส่งข้อมูลจริงและการพิสูจน์ผ่านเบราว์เซอร์ที่มุ่งเน้นเฉพาะรายการที่พิจารณา จากนั้นแนบอาร์ติแฟกต์ไปยัง PRs.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T18:56:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis เผยแพร่หลักฐาน CI แบบภาพและความคิดเห็นใน PR สำหรับพฤติกรรมของ OpenClaw
สถานการณ์การรับส่งข้อมูลแบบสดจะเปรียบเทียบเส้นฐานที่ทราบว่ามีปัญหากับ ref ผู้สมัคร
ส่วนเลนเบราว์เซอร์แบบเฉพาะเจาะจงอาจพิสูจน์ผู้สมัครหนึ่งรายการเทียบกับการรับส่งข้อมูลจำลอง
ที่กำหนดผลลัพธ์ได้แทน Discord รองรับเป็นรายการแรก โดยมีการยืนยันตัวตนของบอตจริง ช่องกิลด์
รีแอ็กชัน เธรด และพยานผ่านเบราว์เซอร์ นอกจากนี้ยังมีเลน Slack, Telegram และแชต Control
UI แบบเฉพาะเจาะจง ส่วน WhatsApp และ Matrix ยังไม่ได้รับการติดตั้งใช้งาน

## ความเป็นเจ้าของ

- OpenClaw (`extensions/qa-lab/src/mantis/*`): รันไทม์ของสถานการณ์, `pnpm openclaw qa mantis <command>` CLI, สคีมาหลักฐาน
- QA Lab (`extensions/qa-lab/src/live-transports/*`): ชุดทดสอบการรับส่งข้อมูลแบบสด, บอตไดรเวอร์/SUT, ตัวเขียนรายงาน/หลักฐาน
- Crabbox (`openclaw/crabbox`): เครื่อง Linux ที่วอร์มไว้, สัญญาเช่า, VNC, `crabbox media preview`
- GitHub Actions (`.github/workflows/mantis-*.yml`): จุดเริ่มต้นระยะไกล, การเก็บรักษาอาร์ติแฟกต์
- ClawSweeper: แยกวิเคราะห์คำสั่ง PR ของผู้ดูแล, สั่งทำงานเวิร์กโฟลว์, โพสต์ความคิดเห็นสุดท้ายใน PR

## คำสั่ง CLI

คำสั่งทั้งหมดคือ `pnpm openclaw qa mantis <command>` ซึ่งกำหนดไว้ใน
`extensions/qa-lab/src/mantis/cli.ts` ต้องใช้ `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
ในขณะบิลด์/รัน (เวิร์กโฟลว์ที่รวมมาให้จะตั้งค่า `OPENCLAW_BUILD_PRIVATE_QA=1` และ
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` ก่อนบิลด์)

| คำสั่ง                         | วัตถุประสงค์                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | ตรวจสอบว่าบอต Mantis Discord สามารถมองเห็นกิลด์/ช่อง โพสต์ และแสดงรีแอ็กชันได้                                                                                 |
| `run`                           | รันสถานการณ์ก่อน/หลังกับ ref เส้นฐานและผู้สมัคร (Discord เท่านั้น)                                                                           |
| `desktop-browser-smoke`         | เช่า/ใช้เดสก์ท็อป Crabbox ซ้ำ เปิดเบราว์เซอร์ที่มองเห็นได้ และบันทึกภาพหน้าจอ + วิดีโอ                                                                        |
| `slack-desktop-smoke`           | เช่า/ใช้เดสก์ท็อป Crabbox ซ้ำ รัน Slack QA ภายในเครื่อง เปิด Slack Web และบันทึกหลักฐาน                                                                  |
| `telegram-desktop-builder`      | เช่า/ใช้เดสก์ท็อป Crabbox ซ้ำ ติดตั้ง Telegram Desktop และเลือกกำหนดค่า Gateway ของ OpenClaw ได้                                                        |
| `visual-task` / `visual-driver` | การบันทึกเดสก์ท็อป Crabbox แบบทั่วไป พร้อมการตรวจยืนยันด้วยการทำความเข้าใจภาพที่เลือกใช้ได้; `visual-driver` คือส่วนไดรเวอร์ที่เปิดภายใต้ `crabbox record --while` |

ทุกคำสั่งรองรับ `--repo-root <path>` และ `--output-dir <path>`; คำสั่ง Crabbox
ยังรองรับ `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` และ `--keep-lease` ค่าเริ่มต้นของ CLI ภายในเครื่อง
สำหรับผู้ให้บริการ/คลาสคือ `hetzner`/`beast` เว้นแต่จะระบุไว้เป็นอย่างอื่น โดยทั่วไปเวิร์กโฟลว์ CI
จะแทนที่ทั้งสองค่า

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

เรียก Discord REST API (`https://discord.com/api/v10`) เพื่อดึงข้อมูลผู้ใช้ของบอต
กิลด์ ช่องต่าง ๆ ของกิลด์ และช่องเป้าหมาย ตรวจยืนยันว่าช่องเป็นของกิลด์
จากนั้นโพสต์ข้อความและเพิ่มรีแอ็กชัน `👀`
(เว้นแต่ใช้ `--skip-post`) เขียน `mantis-discord-smoke-summary.json` และ
`mantis-discord-smoke-report.md`

ลำดับการค้นหาโทเค็น: ค่า `--token-file` จากนั้น `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(แทนที่ด้วย `--token-env`) แล้วจึงไฟล์ที่ตั้งชื่อตาม `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(แทนที่ด้วย `--token-file-env`) ID กิลด์/ช่องมาจาก
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (แทนที่ด้วย
`--guild-id` / `--channel-id`) และต้องเป็น Discord snowflake จำนวน 17-20 หลัก ตั้งค่า
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` เพื่อแทนที่ ID และชื่อของบอต/กิลด์/ช่อง/ข้อความ
ด้วย `<redacted>` ในข้อมูลสรุปและรายงานที่เผยแพร่

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ปัจจุบัน `--transport` รองรับเฉพาะ `discord` เท่านั้น `--scenario` คือหนึ่งในสอง
ID ที่มีมาให้ โดยแต่ละรายการมี ref เส้นฐานเริ่มต้นและป้ายกำกับก่อน/หลัง
ที่คาดไว้เป็นของตนเอง (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| สถานการณ์                                   | เส้นฐานเริ่มต้น                           | สิ่งที่คาดหวังจากเส้นฐาน                         | สิ่งที่คาดหวังจากผู้สมัคร            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | การตอบกลับในเธรดไม่มีไฟล์แนบ `filePath` | การตอบกลับในเธรดมีไฟล์แนบดังกล่าว     |

`--candidate` มีค่าเริ่มต้นเป็น `HEAD` แฟล็กอื่น ๆ ได้แก่ `--credential-source`
(ค่าเริ่มต้น `convex`), `--credential-role` (ค่าเริ่มต้น `ci`), `--provider-mode`
(ค่าเริ่มต้น `live-frontier`), `--fast` (เปิดโดยค่าเริ่มต้น), `--skip-install`, `--skip-build`

ตัวรันสร้าง checkout แบบแยกขาด `git worktree` สำหรับเส้นฐานและ
ผู้สมัครภายใต้ `<output-dir>/worktrees/` รัน `pnpm install`/`pnpm build` ใน
แต่ละรายการ (เว้นแต่ข้าม) จากนั้นรัน
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
กับ worktree แต่ละรายการ แต่ละเลนเขียน `discord-qa-reaction-timelines.json`
พร้อมคู่ `<scenario-id>-timeline.html`/`.png`; ตัวรันจะคัดลอก
หลักฐานนี้กลับไปไว้ภายใต้ `baseline/`/`candidate/` และเขียน `comparison.json`,
`mantis-report.md` และ `mantis-evidence.json` ในไดเรกทอรีเอาต์พุต และ
ออกด้วยรหัสที่ไม่ใช่ศูนย์หากการเปรียบเทียบไม่ผ่าน (เส้นฐาน `fail` และผู้สมัคร
`pass`)

สถานการณ์ Discord รายการที่สอง (`discord-thread-reply-filepath-attachment`) จะโพสต์
ข้อความหลักด้วยบอตไดรเวอร์ สร้างเธรดจริง เรียกการดำเนินการ
`message.thread-reply` ของ SUT ด้วย `filePath` ภายในรีโพ จากนั้นสำรวจ
เธรดเป็นระยะเพื่อหาการตอบกลับและชื่อไฟล์แนบ โดยคาดว่าจะมีไฟล์แนบ
ชื่อ `mantis-thread-report.md`

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

เช่าหรือใช้เดสก์ท็อป Crabbox ซ้ำ เปิดเบราว์เซอร์ภายในเซสชัน VNC
โดยชี้ไปที่ `--browser-url` (ค่าเริ่มต้น `https://openclaw.ai`) หรือ
`--html-file` ที่เรนเดอร์แล้ว รอ บันทึกภาพหน้าจอด้วย `scrot` เลือกบันทึก MP4 ด้วย
`ffmpeg` ได้ และใช้ rsync ส่ง `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
กลับไปยัง `--output-dir`

แฟล็ก:

- `--lease-id <cbx_...>` ใช้เดสก์ท็อปที่วอร์มไว้ซ้ำแทนการสร้างใหม่
- `--browser-profile-dir <remote-path>` ใช้ไดเรกทอรีข้อมูลผู้ใช้ Chrome ระยะไกลซ้ำ เพื่อให้เดสก์ท็อปถาวรยังคงเข้าสู่ระบบระหว่างการรัน (ใช้สำหรับโปรไฟล์ผู้ดู Discord Web ที่ใช้งานระยะยาว)
- `--browser-profile-archive-env <name>` กู้คืนไฟล์เก็บถาวรโปรไฟล์ Chrome แบบ base64 `.tgz` จากตัวแปรสภาพแวดล้อมดังกล่าวก่อนเปิดใช้งาน (ค่าเริ่มต้น `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); ใช้สำหรับพยานที่เข้าสู่ระบบแล้ว เช่น Discord Web
- `--video-duration <seconds>` ควบคุมระยะเวลาการบันทึก MP4 (ค่าเริ่มต้น 10s)
- `--keep-lease` (หรือ `OPENCLAW_MANTIS_KEEP_VM=1`) เปิดสัญญาเช่าที่การรันนี้สร้างไว้ต่อเพื่อการตรวจสอบผ่าน VNC; การรันที่ล้มเหลวและสร้างสัญญาเช่าจะเปิดสัญญาเช่าไว้โดยค่าเริ่มต้นเช่นกัน

สำหรับหลักฐาน Discord Web นั้น Mantis ใช้บัญชีผู้ดูเฉพาะ ไม่ใช่โทเค็น
ของบอต Oracle ของ Discord REST (ผ่าน `qa discord`) ยังคงเป็นแหล่งอ้างอิงที่มีอำนาจตัดสิน; เมื่อ
ตั้งค่า `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` สถานการณ์จะเขียน
อาร์ติแฟกต์ URL ของ Discord Web เพิ่มเติม และ `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` จะเปิด
เธรดไว้นานพอให้เบราว์เซอร์เปิดได้

เวิร์กโฟลว์ GitHub เลือกใช้โปรไฟล์ผู้ดูแบบถาวรผ่าน
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` เป็นหลัก (ไฟล์เก็บถาวรโปรไฟล์แบบเต็มอาจมีขนาดเกิน
ขีดจำกัดขนาด secret ของ GitHub); สำหรับโปรไฟล์ขนาดเล็ก/บูตสแตรป สามารถกู้คืน
`.tgz` แบบ base64 จาก `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` แทนได้ หาก
ไม่ได้กำหนดค่าแหล่งข้อมูลใดเลย เวิร์กโฟลว์จะยังคงเผยแพร่ภาพหน้าจอเส้นฐาน/ผู้สมัคร
ที่กำหนดผลลัพธ์ได้ และบันทึกว่าข้ามพยานที่เข้าสู่ระบบแล้ว

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

เช่าหรือใช้เดสก์ท็อป Crabbox ซ้ำ ซิงค์ checkout เข้า VM รัน
`pnpm openclaw qa slack` ภายใน เปิด Slack Web ในเบราว์เซอร์ VNC
บันทึกภาพเดสก์ท็อป และคัดลอกทั้งอาร์ติแฟกต์ Slack QA (`slack-qa/`) และ
ภาพหน้าจอ/วิดีโอ VNC กลับมายังเครื่อง นี่เป็นรูปแบบเดียวของ Mantis ที่
Gateway ของ SUT และเบราว์เซอร์ทำงานภายใน VM เดียวกัน

เมื่อใช้ `--gateway-setup` คำสั่งจะสร้างโฮม OpenClaw แบบใช้แล้วทิ้งที่คงอยู่
ณ `$HOME/.openclaw-mantis/slack-openclaw` ภายใน VM แพตช์การกำหนดค่า Slack
Socket Mode สำหรับช่องเป้าหมาย เริ่ม
`openclaw gateway run --dev --allow-unconfigured --port 38973` และปล่อยให้
Chrome ทำงานต่อในเซสชัน VNC; การละ `--gateway-setup` จะรันเลน Slack QA
แบบบอตถึงบอตตามปกติแทน

ตัวแปรสภาพแวดล้อมที่จำเป็นสำหรับ `--credential-source env` (ค่าเริ่มต้นภายในเครื่องคือ `env`;
ค่าเริ่มต้นของบทบาทคือ `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับเลนโมเดลระยะไกล (หากตั้งค่าเฉพาะ `OPENAI_API_KEY`
  ภายในเครื่อง Mantis จะคัดลอกไปยัง `OPENCLAW_LIVE_OPENAI_KEY` ก่อน
  เรียกใช้ Crabbox)

เมื่อใช้ `--credential-source convex` Mantis จะเช่าข้อมูลประจำตัวของ Slack SUT จาก
พูลที่ใช้ร่วมกันก่อนสร้าง VM และส่งต่อ ID ช่อง แอปโทเค็น และ
บอตโทเค็นเข้า VM ในรูปตัวแปรสภาพแวดล้อม `OPENCLAW_MANTIS_SLACK_*` เพื่อให้เวิร์กโฟลว์ GitHub
ต้องใช้เพียง secret ของโบรกเกอร์ Convex ไม่ต้องใช้โทเค็น Slack ดิบ

แฟล็กอื่น ๆ: `--slack-url <url>` เปิด URL ที่ระบุ (มิฉะนั้น Mantis จะอนุมาน
`https://app.slack.com/client/<team>/<channel>` จาก `auth.test`);
`--slack-channel-id <id>` ตั้งค่าช่องในรายการอนุญาตของ Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุมโปรไฟล์ Chrome แบบถาวร
ภายใน VM (ค่าเริ่มต้น `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` รันสถานการณ์การอนุมัติดั้งเดิมของ Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) และเรนเดอร์
ภาพหน้าจอจุดตรวจสอบสถานะรอดำเนินการ/แก้ไขแล้วแทนการตั้งค่า Gateway (ใช้ร่วม
กับ `--gateway-setup` ไม่ได้); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` และ `--fast` จะถูกส่งผ่านไปยัง
เลน Slack แบบสด

ภาพหน้าจอจุดตรวจสอบการอนุมัติเรนเดอร์จากข้อความ Slack API ที่
สถานการณ์ตรวจพบ ไม่ใช่ UI ของ Slack แบบสด; `slack-desktop-smoke.png` เป็นเพียง
หลักฐานของ Slack Web เองเมื่อโปรไฟล์เบราว์เซอร์ของสัญญาเช่านั้นเข้าสู่ระบบไว้แล้ว

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

เช่าหรือใช้เดสก์ท็อป Crabbox ซ้ำ ติดตั้ง Telegram Desktop ดั้งเดิมสำหรับ Linux
เลือกกู้คืนไฟล์เก็บถาวรของเซสชันผู้ใช้ กำหนดค่า OpenClaw ด้วย
โทเค็นบอต Telegram SUT ที่เช่ามา เริ่ม
`openclaw gateway run --dev --allow-unconfigured --port 38974` โพสต์
ข้อความแจ้งความพร้อมของบอตไดรเวอร์ไปยังกลุ่มส่วนตัวที่เช่ามา จากนั้นบันทึก
ภาพหน้าจอและ MP4 โทเค็นบอตใช้กำหนดค่า OpenClaw เท่านั้น และไม่เคยใช้
เข้าสู่ระบบ Telegram Desktop ผู้ดูบนเดสก์ท็อปเป็นเซสชันผู้ใช้ Telegram
แยกต่างหาก ซึ่งกู้คืนจาก `--telegram-profile-archive-env <name>` หรือเข้าสู่ระบบด้วยตนเอง
ผ่าน VNC และคงเซสชันไว้ด้วย `--keep-lease`

แฟล็ก: `--lease-id <cbx_...>` รันซ้ำกับ VM ที่เข้าสู่ระบบ
Telegram Desktop ไว้แล้ว; `--telegram-profile-archive-env <name>` กู้คืนไฟล์เก็บถาวรโปรไฟล์
`.tgz` แบบ base64 ก่อนเปิดใช้งาน; `--telegram-profile-dir <remote-path>`
ตั้งค่าไดเรกทอรีโปรไฟล์ระยะไกล (ค่าเริ่มต้น `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` ติดตั้งและเปิด Telegram Desktop เท่านั้น;
`--credential-source`/`--credential-role` มีค่าเริ่มต้นเป็น `convex`/`maintainer`

## ไฟล์รายการหลักฐาน

ทุกสถานการณ์ที่เผยแพร่ไปยัง PR จะเขียน `mantis-evidence.json` ไว้ข้าง
รายงานของตน:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "QA ปฏิกิริยาสถานะ Discord ของ Mantis",
  "summary": "สรุปส่วนบนที่มนุษย์อ่านได้สำหรับความคิดเห็นใน PR",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "เฉพาะ queued" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline เฉพาะ queued",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "ไทม์ไลน์ Discord ของ Baseline",
      "width": 420
    }
  ]
}
```

Artifact `path` เป็นพาธสัมพัทธ์กับไดเรกทอรีของ manifest ส่วน `targetPath`
เป็นพาธสัมพัทธ์กับคำนำหน้าของ Artifact R2/S3 ที่กำหนดค่าไว้ `scripts/mantis/publish-pr-evidence.mjs`
จะปฏิเสธการข้ามพาธและข้ามรายการที่มี `"required": false` เมื่อ
ไม่พบไฟล์

ชนิดของ Artifact: `timeline` (ภาพหน้าจอก่อน/หลังแบบกำหนดผลลัพธ์ได้),
`desktopScreenshot` (ภาพหน้าจอ VNC/เบราว์เซอร์), `motionPreview` (GIF แบบเคลื่อนไหวในบรรทัด
จากการบันทึก), `motionClip` (MP4 ที่ตัดช่วงไม่มีการเคลื่อนไหวออก), `fullVideo` (การบันทึก
ฉบับเต็ม), `metadata` (ไฟล์ JSON/บันทึกประกอบ), `report` (รายงาน Markdown)

โครงสร้าง Artifact บนดิสก์ของการรัน:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

ภาพหน้าจอเป็นหลักฐาน ไม่ใช่ข้อมูลลับ แต่ยังต้องมีวินัยในการปกปิดข้อมูล:
ชื่อช่องส่วนตัว ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏอยู่ ตั้งค่า
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลด Artifact สาธารณะ โดย
จะเปิดใช้งานเป็นค่าเริ่มต้นในเวิร์กโฟลว์ GitHub ของ Discord/Slack/Telegram

## ระบบอัตโนมัติของ GitHub

`scripts/mantis/publish-pr-evidence.mjs` เป็นตัวเผยแพร่ที่นำกลับมาใช้ซ้ำได้ เวิร์กโฟลว์
จะเรียกใช้โดยส่ง manifest, PR เป้าหมาย, รากเป้าหมายของ Artifact, เครื่องหมายความคิดเห็น,
URL ของ Artifact, URL ของการรัน และแหล่งที่มาของคำขอ ระบบจะอัปโหลด Artifact ที่ประกาศไว้ไปยัง
บัคเก็ต R2 ของ Mantis สร้างความคิดเห็นใน PR ที่แสดงสรุปก่อนพร้อม
รูปภาพ/ตัวอย่างในบรรทัดและวิดีโอที่ลิงก์ไว้ จากนั้นอัปเดตความคิดเห็นที่มีเครื่องหมายเดิมหรือ
สร้างความคิดเห็นใหม่ ตัวแปรสภาพแวดล้อมที่จำเป็น:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (เวิร์กโฟลว์ตั้งค่า `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (เวิร์กโฟลว์ตั้งค่า `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (เวิร์กโฟลว์ตั้งค่า `https://artifacts.openclaw.ai`)

ความคิดเห็นจะโพสต์ผ่านแอป GitHub ของ Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`) ไม่ใช่ `github-actions[bot]` โดยใช้ความคิดเห็น
เครื่องหมายที่ซ่อนไว้เป็นคีย์สำหรับ upsert

| เวิร์กโฟลว์                          | ทริกเกอร์                                                                                    | การทำงาน                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | สั่งให้ทำงานด้วยตนเอง                                                                            | รัน `discord-smoke` กับ ref ที่เลือก                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | ความคิดเห็นใน PR หรือสั่งให้ทำงานด้วยตนเอง                                                              | สร้าง worktree สำหรับ baseline/candidate แยกจากกัน รัน `discord-status-reactions-tool-only` ในแต่ละรายการ แสดงไทม์ไลน์ของแต่ละรายการในเบราว์เซอร์เดสก์ท็อป Crabbox สร้างตัวอย่าง GIF/MP4 ที่ตัดช่วงไม่มีการเคลื่อนไหวออกด้วย `crabbox media preview` อัปโหลด Artifact และโพสต์หลักฐานในบรรทัดของ PR                                 |
| `Mantis Scenario`                 | สั่งให้ทำงานด้วยตนเอง                                                                            | ตัวสั่งงานทั่วไป: รับ `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` แล้วส่งต่อไปยังเวิร์กโฟลว์สถานการณ์ที่ตรงกัน |
| `Mantis Slack Desktop Smoke`      | สั่งให้ทำงานด้วยตนเอง                                                                            | เช่าเดสก์ท็อป Linux ของ Crabbox (ค่าเริ่มต้นคือ `aws` และเลือก `hetzner` ได้) รัน `slack-desktop-smoke --gateway-setup` กับ candidate บันทึกเดสก์ท็อป สร้างตัวอย่างการเคลื่อนไหว อัปโหลด Artifact และโพสต์หลักฐานใน PR เมื่อระบุหมายเลข PR                                                      |
| `Mantis Telegram Live`            | ความคิดเห็นใน PR หรือสั่งให้ทำงานด้วยตนเอง                                                              | รันรายการ QA แบบสดของ Telegram ผ่าน API บอต (`openclaw qa telegram`) เขียน `mantis-evidence.json` จากสรุป QA แสดง HTML หลักฐานที่ปกปิดข้อมูลผ่านเบราว์เซอร์เดสก์ท็อป Crabbox สร้าง GIF การเคลื่อนไหว และโพสต์หลักฐานใน PR รายการนี้ไม่จำเป็นต้องเข้าสู่ระบบ Telegram Web                               |
| `Mantis Telegram Desktop Proof`   | ป้ายกำกับ PR ของผู้ดูแล (`mantis: telegram-visible-proof`) ร่วมกับความคิดเห็นใน PR หรือสั่งให้ทำงานด้วยตนเอง | หลักฐานก่อน/หลังแบบ Agentic ด้วย Telegram Desktop เนทีฟ ส่ง PR, ref ของ baseline/candidate และคำสั่งจากผู้ดูแลให้ Codex ซึ่งจะรันรายการพิสูจน์ Telegram Desktop ของผู้ใช้จริงผ่าน Crabbox สำหรับทั้งสอง ref และโพสต์ตารางหลักฐาน PR แบบ 2 คอลัมน์                                                              |
| `Mantis Web UI Chat Proof`        | ความคิดเห็นใน PR หรือสั่งให้ทำงานด้วยตนเอง                                                              | รันหลักฐาน Playwright แบบเจาะจงสำหรับแชตใน OpenClaw Control UI กับ candidate ตรวจสอบว่าเบราว์เซอร์ส่งข้อมูลผ่าน Gateway จำลอง บันทึก Artifact ภาพหน้าจอ/วิดีโอ และโพสต์หลักฐานใน PR รายการนี้พิสูจน์เฉพาะเว็บแชต ไม่ใช่ WinUI/แอปเนทีฟหรือหลักฐานภาพแบบใดก็ได้                           |

ทั้ง `Mantis Discord Status Reactions` และ `Mantis Telegram Live` รองรับ
`baseline_ref`/`candidate_ref` (หรือ `baseline=`/`candidate=` ในความคิดเห็น PR)
และตรวจสอบว่า SHA ที่แก้ไขแล้วเป็นบรรพบุรุษของ `origin/main`, เป็น
แท็กรีลีส (`v*`) หรือเป็น head ของ PR ที่เปิดอยู่ ก่อนรันด้วย
ข้อมูลประจำตัวที่มีข้อมูลลับ

ทริกเกอร์จากความคิดเห็นใน PR ที่มีสิทธิ์ write/maintain/admin:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

ทริกเกอร์จากความคิดเห็นสำหรับ Telegram ใช้ SHA ของ head ของ PR เป็น candidate โดยค่าเริ่มต้น และ
ใช้ `telegram-status-command` เป็นสถานการณ์ โดยรองรับ `provider=aws|hetzner` และ
`lease=<cbx_...>` เพื่อกำหนดผู้ให้บริการ Crabbox หรือเดสก์ท็อป
ที่อุ่นเครื่องไว้ล่วงหน้าโดยเฉพาะ `Mantis Telegram Desktop Proof` จะตอบสนองต่อความคิดเห็นใน PR ก็ต่อเมื่อ
PR มีป้ายกำกับ `mantis: telegram-visible-proof` อยู่แล้วเท่านั้น

ทริกเกอร์จากความคิดเห็นสำหรับแชต Web UI ใช้ SHA ของ head ของ PR เป็น candidate โดยค่าเริ่มต้น โดยจะรัน
หลักฐานแชต Control UI ด้วย Gateway จำลองและเผยแพร่ Artifact จากเบราว์เซอร์ สำหรับ
เว็บเพจอื่นและพื้นผิวแอปเนทีฟ ให้ใช้หลักฐาน Playwright/เบราว์เซอร์ตามปกติ ภาพหน้าจอจากผู้ดูแล Crabbox หรือ Artifact
ในเครื่อง

ClawSweeper สามารถสั่งงานสถานการณ์โดยตรงได้เช่นกัน:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## เครื่องและข้อมูลลับ

ค่าเริ่มต้นของ Crabbox สำหรับ CLI ในเครื่องคือ `--provider hetzner --class beast` สามารถแทนที่
ด้วย `--provider`, `--class`/`--machine-class` หรือ
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` เวิร์กโฟลว์
GitHub มักแทนที่ทั้งสองค่า (ตัวอย่างเช่น `--class standard` และอินพุตเลือกผู้ให้บริการ
`aws`/`hetzner` ของเวิร์กโฟลว์ Slack) หากผู้ให้บริการช้าเกินไป
หรือไม่พร้อมใช้งาน ให้เพิ่มไว้หลังอินเทอร์เฟซ Crabbox เดียวกันแทนการ
ฮาร์ดโค้ด fallback

ค่าพื้นฐานของ VM: Linux ที่มี Chrome/Chromium ซึ่งรองรับเดสก์ท็อป การเข้าถึง CDP, VNC/
noVNC, Node 22.22.3+, 24.15+ หรือ 25.9+ และ pnpm, checkout ของ OpenClaw และ
การเข้าถึงขาออกไปยังระบบขนส่งเป้าหมาย, GitHub, ผู้ให้บริการโมเดล และ
ตัวกลางข้อมูลประจำตัว

ชื่อข้อมูลประจำตัวและตัวแปรสภาพแวดล้อมที่ใช้ในคำสั่งและเวิร์กโฟลว์ของ Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `qa mantis run --credential-source env` ในเครื่องต้องใช้
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  และ `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` ด้วย โดยปกติเวิร์กโฟลว์ GitHub จะใช้
  `--credential-source convex` และข้อมูลประจำตัวของตัวกลางด้านล่างแทนโทเค็น
  บอต Discord แบบดิบ
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลด Artifact สาธารณะ
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (หรือ `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`
  สำหรับการพิสูจน์ Telegram Desktop โดยเฉพาะ)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (เวิร์กโฟลว์ยังรองรับ
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` เป็น fallback และแมป
  ไปยังชื่อแบบธรรมดาก่อนเรียกใช้ Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

ตัวรัน Mantis ต้องไม่พิมพ์โทเค็นบอต Discord/Slack/Telegram,
คีย์ API ของผู้ให้บริการ, คุกกี้เบราว์เซอร์, เนื้อหาโปรไฟล์การยืนยันตัวตน, รหัสผ่าน VNC หรือ
เพย์โหลดข้อมูลประจำตัวแบบดิบ หากโทเค็นรั่วไหลไปยัง issue, PR, แชต หรือบันทึก
ให้หมุนเวียนโทเค็นหลังจากจัดเก็บข้อมูลลับทดแทนแล้ว

## ผลลัพธ์การรัน

สถานการณ์ระบบขนส่งแบบก่อน/หลังจะแยกผลลัพธ์เหล่านี้ เพื่อไม่ให้
สภาพแวดล้อมที่ไม่เสถียรถูกตีความว่าเป็นการถดถอยของผลิตภัณฑ์:

- **ทำให้บั๊กเกิดซ้ำได้**: baseline ล้มเหลวในรูปแบบที่สถานการณ์คาดไว้
- **Harness ล้มเหลว**: การตั้งค่าสภาพแวดล้อม ข้อมูลประจำตัว API ของระบบขนส่ง เบราว์เซอร์
  หรือผู้ให้บริการล้มเหลวก่อนที่ oracle จะมีความหมาย

หลักฐานจากเบราว์เซอร์เฉพาะ candidate จะรายงานว่า candidate ผ่าน Gateway
จำลองและการตรวจสอบ UI ที่มองเห็นได้หรือไม่ โดยไม่ได้อ้างว่าสามารถทำให้ปัญหาเกิดซ้ำใน baseline ได้

## การเพิ่มสถานการณ์

สถานการณ์ระบบขนส่งแบบสดกำหนดด้วย TypeScript แยกตามระบบขนส่ง (ดู
`MANTIS_SCENARIO_CONFIGS` ใน `extensions/qa-lab/src/mantis/run.runtime.ts` สำหรับ
รูปแบบก่อน/หลังของ Discord) ไม่ใช่รูปแบบไฟล์ประกาศแบบสแตนด์อโลน
แต่ละสถานการณ์ต้องมี: id และชื่อ ระบบขนส่ง ข้อมูลประจำตัวที่จำเป็น นโยบาย ref ของ baseline
นโยบาย ref ของ candidate แพตช์การกำหนดค่า OpenClaw ขั้นตอนการตั้งค่า/การกระตุ้น
oracle ที่คาดหวังของ baseline และ candidate เป้าหมายการบันทึกภาพ งบประมาณ
การหมดเวลา และขั้นตอนการล้างข้อมูล

หลักฐานจากเบราว์เซอร์แบบเจาะจงเฉพาะ candidate สามารถใช้การทดสอบ E2E แบบกำหนดผลลัพธ์ได้
และเวิร์กโฟลว์เฉพาะทางได้ ระบุขอบเขตให้ชัดเจน ตรวจสอบ ref ของ candidate ก่อน
ดำเนินการ แยกการเผยแพร่ที่อาศัยข้อมูลลับ และส่งออกตามสัญญา
manifest หลักฐานเดียวกัน

ควรใช้ oracle ขนาดเล็กที่มีชนิดข้อมูลชัดเจนแทนการตรวจสอบด้วยภาพ: สถานะปฏิกิริยา Discord หรือ
การอ้างอิงข้อความ, สถานะ `ts`/API ปฏิกิริยาของเธรด Slack, id
และส่วนหัวของข้อความอีเมล ใช้ภาพหน้าจอเบราว์เซอร์เมื่อ UI เป็นสิ่งที่สังเกตได้อย่างน่าเชื่อถือเพียงอย่างเดียว
และให้การตรวจสอบด้วยภาพเป็นส่วนเสริมของ oracle จาก API แพลตฟอร์ม หากมี

หลังจาก Discord, Slack และ Telegram รูปแบบตัวรันเดียวกันสามารถขยายไปยัง WhatsApp
(การเข้าสู่ระบบด้วย QR, การระบุตัวตนใหม่, การส่ง, สื่อ, ปฏิกิริยา) และ Matrix
(ห้องที่เข้ารหัส, ความสัมพันธ์ของเธรด/การตอบกลับ, การทำงานต่อหลังรีสตาร์ต) โดยขณะนี้
ยังไม่ได้ติดตั้งใช้งานทั้งสองรายการ

## คำถามที่ยังไม่มีข้อสรุป

- เมื่อใช้บอต Mantis ที่มีอยู่ซ้ำ บอต Discord ตัวใดควรเป็นไดรเวอร์ และตัวใดควรเป็น SUT?
- GitHub ควรเก็บอาร์ติแฟกต์ของ Mantis สำหรับ PR ไว้นานเท่าใด?
- ClawSweeper ควรแนะนำสถานการณ์ทดสอบ Mantis โดยอัตโนมัติเมื่อใด แทนที่จะรอคำสั่งจากผู้ดูแล?
- ควรปกปิดข้อมูลหรือตัดภาพหน้าจอก่อนอัปโหลดไปยัง PR สาธารณะหรือไม่?
