---
read_when:
    - การสร้างหรือเรียกใช้การตรวจสอบคุณภาพด้านภาพแบบสดสำหรับข้อบกพร่องของ OpenClaw
    - การเพิ่มการตรวจสอบก่อนและหลังสำหรับคำขอดึงโค้ด
    - การเพิ่มสถานการณ์การทดสอบการส่งผ่านแบบสดสำหรับ Discord, Slack, WhatsApp หรือช่องทางอื่น ๆ
    - กำลังเรียกใช้การพิสูจน์ผ่านเบราว์เซอร์สำหรับ Control UI แบบเจาะจงกับข้อมูลอ้างอิงตัวเลือกหนึ่งรายการ
    - การดีบักการรัน QA ที่ต้องใช้ภาพหน้าจอ ระบบอัตโนมัติของเบราว์เซอร์ หรือการเข้าถึง VNC
summary: Mantis บันทึกหลักฐานแบบครบวงจรเชิงภาพสำหรับการเปรียบเทียบการรับส่งข้อมูลจริงและการพิสูจน์ผ่านเบราว์เซอร์ที่มุ่งเน้นเฉพาะรายการที่พิจารณา จากนั้นแนบอาร์ติแฟกต์ไปยัง PR ต่าง ๆ
title: แมนทิส
x-i18n:
    generated_at: "2026-07-12T15:58:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis เผยแพร่หลักฐาน CI แบบภาพและความคิดเห็นใน PR สำหรับพฤติกรรมของ OpenClaw
สถานการณ์การรับส่งข้อมูลจริงจะเปรียบเทียบเส้นฐานที่ทราบว่ามีปัญหากับ ref ของตัวเลือก
ส่วนเลนเบราว์เซอร์เฉพาะจุดอาจพิสูจน์ตัวเลือกหนึ่งกับการรับส่งข้อมูลจำลอง
ที่กำหนดผลลัพธ์ได้แน่นอนแทน Discord เป็นระบบแรกที่เผยแพร่ โดยใช้การยืนยันตัวตนของบอตจริง ช่องกิลด์
รีแอ็กชัน เธรด และพยานจากเบราว์เซอร์ นอกจากนี้ยังมีเลน Slack, Telegram และแชต Control
UI แบบเฉพาะจุด ส่วน WhatsApp และ Matrix ยังไม่ได้พัฒนา

## ความเป็นเจ้าของ

- OpenClaw (`extensions/qa-lab/src/mantis/*`): รันไทม์ของสถานการณ์, CLI `pnpm openclaw qa mantis <command>`, สคีมาหลักฐาน
- QA Lab (`extensions/qa-lab/src/live-transports/*`): ชุดทดสอบการรับส่งข้อมูลจริง, บอตไดรเวอร์/SUT, ตัวเขียนรายงาน/หลักฐาน
- Crabbox (`openclaw/crabbox`): เครื่อง Linux ที่อุ่นเครื่องแล้ว, สัญญาเช่า, VNC, `crabbox media preview`
- GitHub Actions (`.github/workflows/mantis-*.yml`): จุดเริ่มต้นการทำงานระยะไกล, การเก็บรักษาอาร์ติแฟกต์
- ClawSweeper: แยกวิเคราะห์คำสั่ง PR ของผู้ดูแล, สั่งเรียกเวิร์กโฟลว์, โพสต์ความคิดเห็นสุดท้ายใน PR

## คำสั่ง CLI

คำสั่งทั้งหมดอยู่ในรูป `pnpm openclaw qa mantis <command>` ซึ่งกำหนดไว้ใน
`extensions/qa-lab/src/mantis/cli.ts` ต้องมี `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
ในเวลาบิลด์/รัน (เวิร์กโฟลว์ที่รวมมาให้จะตั้ง `OPENCLAW_BUILD_PRIVATE_QA=1` และ
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` ก่อนบิลด์)

| คำสั่ง                          | วัตถุประสงค์                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | ตรวจสอบว่าบอต Mantis Discord สามารถมองเห็นกิลด์/ช่อง โพสต์ และเพิ่มรีแอ็กชันได้                                                                                 |
| `run`                           | รันสถานการณ์ก่อน/หลังกับ ref เส้นฐานและตัวเลือก (เฉพาะ Discord)                                                                           |
| `desktop-browser-smoke`         | เช่าหรือนำเดสก์ท็อป Crabbox กลับมาใช้ใหม่ เปิดเบราว์เซอร์ที่มองเห็นได้ บันทึกภาพหน้าจอและวิดีโอ                                                                        |
| `slack-desktop-smoke`           | เช่าหรือนำเดสก์ท็อป Crabbox กลับมาใช้ใหม่ รัน QA ของ Slack ภายใน เปิด Slack Web และบันทึกหลักฐาน                                                                  |
| `telegram-desktop-builder`      | เช่าหรือนำเดสก์ท็อป Crabbox กลับมาใช้ใหม่ ติดตั้ง Telegram Desktop และเลือกกำหนดค่า Gateway ของ OpenClaw ได้                                                        |
| `visual-task` / `visual-driver` | การบันทึกเดสก์ท็อป Crabbox แบบทั่วไปพร้อมการตรวจสอบยืนยันด้วยความเข้าใจภาพซึ่งเลือกใช้ได้ โดย `visual-driver` เป็นส่วนไดรเวอร์ที่เริ่มทำงานภายใต้ `crabbox record --while` |

ทุกคำสั่งรองรับ `--repo-root <path>` และ `--output-dir <path>` ส่วนคำสั่ง Crabbox
ยังรองรับ `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` และ `--keep-lease` ค่าเริ่มต้นของ CLI ภายในเครื่อง
สำหรับผู้ให้บริการ/คลาสคือ `hetzner`/`beast` เว้นแต่ระบุไว้เป็นอย่างอื่น ส่วนเวิร์กโฟลว์ CI
มักแทนที่ทั้งสองค่า

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

เรียก Discord REST API (`https://discord.com/api/v10`) เพื่อดึงข้อมูลผู้ใช้บอต
กิลด์ ช่องต่าง ๆ ของกิลด์ และช่องเป้าหมาย ตรวจสอบยืนยันว่าช่องนั้นเป็นของกิลด์
จากนั้นโพสต์ข้อความและเพิ่มรีแอ็กชัน `👀` (เว้นแต่ใช้ `--skip-post`) เขียนไฟล์
`mantis-discord-smoke-summary.json` และ `mantis-discord-smoke-report.md`

ลำดับการค้นหาโทเค็น: ค่าจาก `--token-file` ตามด้วย `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(แทนที่ด้วย `--token-env`) จากนั้นจึงเป็นไฟล์ที่ระบุชื่อโดย `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(แทนที่ด้วย `--token-file-env`) รหัสกิลด์/ช่องมาจาก
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (แทนที่ด้วย
`--guild-id` / `--channel-id`) และต้องเป็น Discord snowflake 17-20 หลัก ตั้งค่า
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` เพื่อแทนรหัส
และชื่อของบอต/กิลด์/ช่อง/ข้อความด้วย `<redacted>` ในข้อมูลสรุปและรายงานที่เผยแพร่

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ปัจจุบัน `--transport` รองรับเฉพาะ `discord` ส่วน `--scenario` เป็นหนึ่งในสอง
รหัสที่มีมาให้ในตัว โดยแต่ละรหัสมี ref เส้นฐานเริ่มต้นและป้ายกำกับก่อน/หลังที่คาดหวัง
ของตนเอง (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| สถานการณ์                                   | เส้นฐานเริ่มต้น                           | สิ่งที่คาดหวังจากเส้นฐาน                         | สิ่งที่คาดหวังจากตัวเลือก            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | การตอบกลับในเธรดไม่มีไฟล์แนบ `filePath` | การตอบกลับในเธรดมีไฟล์แนบดังกล่าว     |

ค่าเริ่มต้นของ `--candidate` คือ `HEAD` แฟล็กอื่น ๆ ได้แก่ `--credential-source`
(ค่าเริ่มต้น `convex`), `--credential-role` (ค่าเริ่มต้น `ci`), `--provider-mode`
(ค่าเริ่มต้น `live-frontier`), `--fast` (เปิดเป็นค่าเริ่มต้น), `--skip-install`, `--skip-build`

ตัวรันเนอร์สร้างเช็กเอาต์ `git worktree` แบบแยกออกมาสำหรับเส้นฐานและ
ตัวเลือกภายใต้ `<output-dir>/worktrees/` รัน `pnpm install`/`pnpm build` ใน
แต่ละรายการ (เว้นแต่ข้าม) จากนั้นรัน
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
กับแต่ละ worktree แต่ละเลนจะเขียน `discord-qa-reaction-timelines.json`
พร้อมคู่ไฟล์ `<scenario-id>-timeline.html`/`.png` ตัวรันเนอร์จะคัดลอก
หลักฐานนี้กลับไปภายใต้ `baseline/`/`candidate/` เขียน `comparison.json`,
`mantis-report.md` และ `mantis-evidence.json` ในไดเรกทอรีเอาต์พุต และ
จบการทำงานด้วยรหัสที่ไม่ใช่ศูนย์หากการเปรียบเทียบไม่ผ่าน (เส้นฐานเป็น `fail` และตัวเลือก
เป็น `pass`)

สถานการณ์ Discord ที่สอง (`discord-thread-reply-filepath-attachment`) จะโพสต์
ข้อความต้นทางด้วยบอตไดรเวอร์ สร้างเธรดจริง เรียกการดำเนินการ
`message.thread-reply` ของ SUT ด้วย `filePath` ที่อยู่ภายในรีโพ จากนั้นตรวจสอบ
เธรดเป็นระยะเพื่อหารายการตอบกลับและชื่อไฟล์แนบ โดยคาดหวังไฟล์แนบ
ชื่อ `mantis-thread-report.md`

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

เช่าหรือนำเดสก์ท็อป Crabbox กลับมาใช้ใหม่ เปิดเบราว์เซอร์ภายในเซสชัน VNC
โดยชี้ไปยัง `--browser-url` (ค่าเริ่มต้น `https://openclaw.ai`) หรือ
`--html-file` ที่เรนเดอร์แล้ว รอ จับภาพหน้าจอด้วย `scrot` เลือกบันทึก MP4 ด้วย
`ffmpeg` ได้ และ rsync ไฟล์ `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
กลับไปยัง `--output-dir`

แฟล็ก:

- `--lease-id <cbx_...>` นำเดสก์ท็อปที่อุ่นเครื่องแล้วกลับมาใช้ใหม่แทนการสร้างใหม่
- `--browser-profile-dir <remote-path>` นำไดเรกทอรีข้อมูลผู้ใช้ Chrome ระยะไกลกลับมาใช้ใหม่ เพื่อให้เดสก์ท็อปแบบถาวรคงสถานะการเข้าสู่ระบบระหว่างการรัน (ใช้สำหรับโปรไฟล์ผู้ชม Discord Web ที่ใช้งานระยะยาว)
- `--browser-profile-archive-env <name>` กู้คืนอาร์ไคฟ์โปรไฟล์ Chrome `.tgz` แบบ base64 จากตัวแปรสภาพแวดล้อมนั้นก่อนเริ่มทำงาน (ค่าเริ่มต้น `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`) ใช้สำหรับพยานที่เข้าสู่ระบบแล้ว เช่น Discord Web
- `--video-duration <seconds>` ควบคุมระยะเวลาการบันทึก MP4 (ค่าเริ่มต้น 10 วินาที)
- `--keep-lease` (หรือ `OPENCLAW_MANTIS_KEEP_VM=1`) เปิดสัญญาเช่าที่การรันนี้สร้างไว้เพื่อการตรวจสอบผ่าน VNC ส่วนการรันที่ล้มเหลวและได้สร้างสัญญาเช่าจะเปิดสัญญาเช่าไว้เป็นค่าเริ่มต้นเช่นกัน

สำหรับหลักฐาน Discord Web นั้น Mantis ใช้บัญชีผู้ชมเฉพาะ ไม่ใช่โทเค็น
ของบอต ตัวตรวจสอบผลลัพธ์ Discord REST (ผ่าน `qa discord`) ยังคงเป็นแหล่งอ้างอิงหลัก เมื่อ
ตั้งค่า `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` สถานการณ์จะเขียน
อาร์ติแฟกต์ URL ของ Discord Web เพิ่มเติม และ `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` จะคง
เธรดให้เปิดอยู่นานพอที่เบราว์เซอร์จะเปิดได้

เวิร์กโฟลว์ GitHub เลือกใช้โปรไฟล์ผู้ชมแบบถาวรผ่าน
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ก่อน (อาร์ไคฟ์โปรไฟล์แบบเต็มอาจมีขนาดเกิน
ขีดจำกัดขนาดข้อมูลลับของ GitHub) ส่วนโปรไฟล์ขนาดเล็ก/สำหรับเริ่มต้น สามารถกู้คืน
ไฟล์ `.tgz` แบบ base64 จาก `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` แทนได้ หาก
ไม่ได้กำหนดค่าทั้งสองแหล่ง เวิร์กโฟลว์จะยังคงเผยแพร่ภาพหน้าจอเส้นฐาน/ตัวเลือก
ที่กำหนดผลลัพธ์ได้แน่นอน และบันทึกว่าข้ามพยานที่เข้าสู่ระบบแล้ว

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

เช่าหรือนำเดสก์ท็อป Crabbox กลับมาใช้ใหม่ ซิงค์เช็กเอาต์เข้า VM รัน
`pnpm openclaw qa slack` ภายใน เปิด Slack Web ในเบราว์เซอร์ VNC
บันทึกเดสก์ท็อป และคัดลอกทั้งอาร์ติแฟกต์ QA ของ Slack (`slack-qa/`) และ
ภาพหน้าจอ/วิดีโอ VNC กลับมายังเครื่อง นี่เป็นรูปแบบเดียวของ Mantis ที่ทั้ง
Gateway ของ SUT และเบราว์เซอร์ทำงานภายใน VM เดียวกัน

เมื่อใช้ `--gateway-setup` คำสั่งจะสร้างโฮม OpenClaw ชั่วคราวแบบถาวร
ที่ `$HOME/.openclaw-mantis/slack-openclaw` ภายใน VM แพตช์การกำหนดค่า Slack
Socket Mode สำหรับช่องเป้าหมาย เริ่ม
`openclaw gateway run --dev --allow-unconfigured --port 38973` และปล่อยให้
Chrome ทำงานต่อในเซสชัน VNC หากไม่ใช้ `--gateway-setup` ระบบจะรัน
เลน QA ของ Slack แบบบอตถึงบอตตามปกติแทน

ตัวแปรสภาพแวดล้อมที่จำเป็นสำหรับ `--credential-source env` (ค่าเริ่มต้นภายในเครื่องคือ `env` และบทบาท
เริ่มต้นคือ `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` สำหรับเลนโมเดลระยะไกล (หากตั้งค่าเฉพาะ `OPENAI_API_KEY`
  ภายในเครื่อง Mantis จะคัดลอกค่าไปยัง `OPENCLAW_LIVE_OPENAI_KEY` ก่อน
  เรียกใช้ Crabbox)

เมื่อใช้ `--credential-source convex` Mantis จะเช่าข้อมูลรับรอง Slack SUT จาก
พูลที่ใช้ร่วมกันก่อนสร้าง VM และส่งต่อรหัสช่อง โทเค็นแอป และ
โทเค็นบอตเข้า VM เป็นตัวแปรสภาพแวดล้อม `OPENCLAW_MANTIS_SLACK_*` ดังนั้นเวิร์กโฟลว์
GitHub จึงต้องใช้เพียงข้อมูลลับของนายหน้า Convex ไม่ใช่โทเค็น Slack โดยตรง

แฟล็กอื่น ๆ: `--slack-url <url>` เปิด URL ที่ระบุ (มิฉะนั้น Mantis จะสร้าง
`https://app.slack.com/client/<team>/<channel>` จาก `auth.test`);
`--slack-channel-id <id>` ตั้งค่าช่องในรายการอนุญาตของ Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` ควบคุมโปรไฟล์ Chrome แบบถาวร
ภายใน VM (ค่าเริ่มต้น `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` รันสถานการณ์การอนุมัติแบบเนทีฟของ Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) และเรนเดอร์
ภาพหน้าจอจุดตรวจสอบที่รอดำเนินการ/เสร็จสิ้น แทนการตั้งค่า Gateway (ใช้ร่วมกับ
`--gateway-setup` ไม่ได้); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` และ `--fast` จะถูกส่งผ่านไปยัง
เลนการทำงานจริงของ Slack

ภาพหน้าจอจุดตรวจสอบการอนุมัติจะเรนเดอร์จากข้อความ Slack API ที่
สถานการณ์ตรวจพบ ไม่ใช่ UI ของ Slack จริง ส่วน `slack-desktop-smoke.png` เป็นเพียง
หลักฐานของ Slack Web เองเมื่อโปรไฟล์เบราว์เซอร์ของสัญญาเช่าเข้าสู่ระบบไว้แล้ว

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

เช่าหรือนำเดสก์ท็อป Crabbox กลับมาใช้ใหม่ ติดตั้ง Telegram Desktop สำหรับ Linux แบบเนทีฟ
กู้คืนไฟล์เก็บถาวรของเซสชันผู้ใช้หากต้องการ กำหนดค่า OpenClaw ด้วย
โทเค็นบอต Telegram ของระบบภายใต้การทดสอบ (SUT) ที่เช่ามา เริ่ม
`openclaw gateway run --dev --allow-unconfigured --port 38974` โพสต์
ข้อความแจ้งความพร้อมของบอตไดรเวอร์ไปยังกลุ่มส่วนตัวที่เช่ามา จากนั้นบันทึก
ภาพหน้าจอและ MP4 โทเค็นบอตใช้กำหนดค่า OpenClaw เท่านั้น และจะไม่ใช้
เข้าสู่ระบบ Telegram Desktop โปรแกรมดูเดสก์ท็อปเป็นเซสชันผู้ใช้ Telegram
แยกต่างหาก ซึ่งกู้คืนจาก `--telegram-profile-archive-env <name>` หรือเข้าสู่ระบบ
ด้วยตนเองผ่าน VNC และคงการทำงานไว้ด้วย `--keep-lease`

แฟล็ก: `--lease-id <cbx_...>` เรียกใช้อีกครั้งกับ VM ที่เข้าสู่ระบบ
Telegram Desktop ไว้แล้ว; `--telegram-profile-archive-env <name>` กู้คืนไฟล์เก็บถาวร
โปรไฟล์ `.tgz` ที่เข้ารหัสแบบ base64 ก่อนเปิดใช้งาน; `--telegram-profile-dir <remote-path>`
กำหนดไดเรกทอรีโปรไฟล์ระยะไกล (ค่าเริ่มต้น `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` ติดตั้งและเปิด Telegram Desktop เท่านั้น;
`--credential-source`/`--credential-role` มีค่าเริ่มต้นเป็น `convex`/`maintainer`

## แมนิเฟสต์หลักฐาน

ทุกสถานการณ์ที่เผยแพร่ไปยัง PR จะเขียน `mantis-evidence.json` ไว้ข้าง
รายงาน:

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

`path` ของอาร์ติแฟกต์เป็นพาธสัมพัทธ์จากไดเรกทอรีของแมนิเฟสต์ ส่วน `targetPath`
เป็นพาธสัมพัทธ์จากคำนำหน้าสำหรับอาร์ติแฟกต์ R2/S3 ที่กำหนดค่าไว้ `scripts/mantis/publish-pr-evidence.mjs`
จะปฏิเสธการไล่ย้อนพาธและข้ามรายการที่มี `"required": false` เมื่อ
ไม่พบไฟล์

ชนิดของอาร์ติแฟกต์: `timeline` (ภาพหน้าจอก่อน/หลังที่สร้างแบบกำหนดแน่นอน),
`desktopScreenshot` (ภาพหน้าจอ VNC/เบราว์เซอร์), `motionPreview` (GIF เคลื่อนไหว
จากการบันทึกสำหรับแสดงแบบอินไลน์), `motionClip` (MP4 ที่ตัดช่วงตามการเคลื่อนไหว), `fullVideo` (การบันทึก
ฉบับเต็ม), `metadata` (ไฟล์ประกอบ JSON/บันทึก), `report` (รายงาน Markdown)

โครงสร้างอาร์ติแฟกต์บนดิสก์ของการเรียกใช้:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

ภาพหน้าจอเป็นหลักฐาน ไม่ใช่ข้อมูลลับ แต่ยังคงต้องมีวินัยในการปกปิดข้อมูล:
ชื่อช่องส่วนตัว ชื่อผู้ใช้ หรือเนื้อหาข้อความอาจปรากฏขึ้นได้ ตั้งค่า
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลดอาร์ติแฟกต์สาธารณะ โดย
เวิร์กโฟลว์ GitHub ของ Discord/Slack/Telegram จะเปิดใช้งานค่านี้เป็นค่าเริ่มต้น

## ระบบอัตโนมัติของ GitHub

`scripts/mantis/publish-pr-evidence.mjs` เป็นตัวเผยแพร่ที่นำกลับมาใช้ซ้ำได้ เวิร์กโฟลว์
จะเรียกใช้โดยส่งแมนิเฟสต์, PR เป้าหมาย, รากปลายทางของอาร์ติแฟกต์, เครื่องหมายกำกับความคิดเห็น,
URL อาร์ติแฟกต์, URL การเรียกใช้ และแหล่งที่มาของคำขอ สคริปต์จะอัปโหลดอาร์ติแฟกต์ที่ประกาศไว้ไปยัง
บักเก็ต Mantis R2 สร้างความคิดเห็น PR ที่แสดงสรุปก่อน พร้อม
รูปภาพ/ตัวอย่างแบบอินไลน์และวิดีโอที่เชื่อมโยง จากนั้นอัปเดตความคิดเห็นที่มีเครื่องหมายกำกับเดิมหรือ
สร้างความคิดเห็นใหม่ ตัวแปรสภาพแวดล้อมที่จำเป็น:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (เวิร์กโฟลว์ตั้งค่าเป็น `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (เวิร์กโฟลว์ตั้งค่าเป็น `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (เวิร์กโฟลว์ตั้งค่าเป็น `https://artifacts.openclaw.ai`)

ความคิดเห็นจะโพสต์ผ่านแอป Mantis GitHub (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`) ไม่ใช่ `github-actions[bot]` โดยใช้ความคิดเห็น
เครื่องหมายกำกับที่ซ่อนไว้เป็นคีย์สำหรับการแทรกหรืออัปเดต

| เวิร์กโฟลว์                          | ทริกเกอร์                                                                                    | สิ่งที่ทำ                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | สั่งทำงานด้วยตนเอง                                                                            | เรียกใช้ `discord-smoke` กับการอ้างอิงที่เลือก                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | ความคิดเห็นใน PR หรือสั่งทำงานด้วยตนเอง                                                              | สร้างเวิร์กทรี baseline/candidate แยกกัน เรียกใช้ `discord-status-reactions-tool-only` กับแต่ละเวิร์กทรี แสดงผลไทม์ไลน์ของแต่ละเลนในเบราว์เซอร์เดสก์ท็อป Crabbox สร้างตัวอย่าง GIF/MP4 ที่ตัดช่วงตามการเคลื่อนไหวด้วย `crabbox media preview` อัปโหลดอาร์ติแฟกต์ และโพสต์หลักฐาน PR แบบอินไลน์                                 |
| `Mantis Scenario`                 | สั่งทำงานด้วยตนเอง                                                                            | ตัวกระจายงานทั่วไป: รับ `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` แล้วส่งต่อไปยังเวิร์กโฟลว์สถานการณ์ที่ตรงกัน |
| `Mantis Slack Desktop Smoke`      | สั่งทำงานด้วยตนเอง                                                                            | เช่าเดสก์ท็อป Linux ของ Crabbox (ค่าเริ่มต้นคือ `aws` และเลือก `hetzner` ได้) เรียกใช้ `slack-desktop-smoke --gateway-setup` กับ candidate บันทึกเดสก์ท็อป สร้างตัวอย่างการเคลื่อนไหว อัปโหลดอาร์ติแฟกต์ และโพสต์หลักฐาน PR เมื่อระบุหมายเลข PR                                                      |
| `Mantis Telegram Live`            | ความคิดเห็นใน PR หรือสั่งทำงานด้วยตนเอง                                                              | เรียกใช้เลน QA สดของ Telegram ผ่าน API บอต (`openclaw qa telegram`) เขียน `mantis-evidence.json` จากสรุป QA แสดงผล HTML หลักฐานที่ปกปิดข้อมูลแล้วผ่านเบราว์เซอร์เดสก์ท็อป Crabbox สร้าง GIF การเคลื่อนไหว และโพสต์หลักฐาน PR เลนนี้ไม่จำเป็นต้องเข้าสู่ระบบ Telegram Web                               |
| `Mantis Telegram Desktop Proof`   | ป้ายกำกับ PR ของผู้ดูแล (`mantis: telegram-visible-proof`) ร่วมกับความคิดเห็นใน PR หรือสั่งทำงานด้วยตนเอง | หลักฐานก่อน/หลังแบบทำงานอัตโนมัติด้วยเอเจนต์บน Telegram Desktop แบบเนทีฟ ส่ง PR, การอ้างอิง baseline/candidate และคำแนะนำจากผู้ดูแลให้ Codex ซึ่งจะเรียกใช้เลนหลักฐาน Telegram Desktop ของผู้ใช้จริงผ่าน Crabbox สำหรับการอ้างอิงทั้งสองรายการ และโพสต์ตารางหลักฐาน PR แบบ 2 คอลัมน์                                                              |
| `Mantis Web UI Chat Proof`        | ความคิดเห็นใน PR หรือสั่งทำงานด้วยตนเอง                                                              | เรียกใช้หลักฐาน Playwright แบบเจาะจงสำหรับแชตใน Control UI ของ OpenClaw กับ candidate ตรวจสอบว่าเบราว์เซอร์ส่งข้อมูลผ่าน Gateway จำลอง บันทึกอาร์ติแฟกต์ภาพหน้าจอ/วิดีโอ และโพสต์หลักฐาน PR เลนนี้ใช้เป็นหลักฐานสำหรับเว็บแชตเท่านั้น ไม่ใช่ WinUI/แอปเนทีฟหรือหลักฐานภาพทั่วไป                           |

ทั้ง `Mantis Discord Status Reactions` และ `Mantis Telegram Live` รองรับ
`baseline_ref`/`candidate_ref` (หรือ `baseline=`/`candidate=` ในความคิดเห็น PR)
และตรวจสอบว่า SHA ที่แก้ไขแล้วเป็นบรรพบุรุษของ `origin/main`, เป็น
แท็กรีลีส (`v*`) หรือเป็น head ของ PR ที่เปิดอยู่ ก่อนเรียกใช้ด้วย
ข้อมูลรับรองที่มีข้อมูลลับ

ทริกเกอร์จากความคิดเห็นใน PR ที่มีสิทธิ์เขียน/ดูแล/ผู้ดูแลระบบ:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

ทริกเกอร์ความคิดเห็นของ Telegram ใช้ SHA ของ head ใน PR เป็น candidate และใช้
`telegram-status-command` เป็นสถานการณ์โดยค่าเริ่มต้น และรองรับ `provider=aws|hetzner` กับ
`lease=<cbx_...>` เพื่อระบุผู้ให้บริการ Crabbox หรือเดสก์ท็อปที่
อุ่นเครื่องไว้ล่วงหน้า `Mantis Telegram Desktop Proof` จะตอบสนองต่อความคิดเห็น PR เฉพาะเมื่อ
PR มีป้ายกำกับ `mantis: telegram-visible-proof` อยู่แล้ว

ทริกเกอร์ความคิดเห็นของเว็บแชต UI ใช้ SHA ของ head ใน PR เป็น candidate โดยค่าเริ่มต้น ทริกเกอร์เหล่านี้จะเรียกใช้
หลักฐานแชต Control UI ผ่าน Gateway จำลองและเผยแพร่อาร์ติแฟกต์ของเบราว์เซอร์ สำหรับ
หน้าเว็บอื่นและพื้นผิวแอปเนทีฟ ให้ใช้หลักฐาน Playwright/เบราว์เซอร์ตามปกติ ภาพหน้าจอจากผู้ดูแล Crabbox หรือ
อาร์ติแฟกต์ในเครื่อง

ClawSweeper สามารถสั่งเรียกใช้สถานการณ์โดยตรงได้เช่นกัน:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## เครื่องและข้อมูลลับ

ค่าเริ่มต้น Crabbox ของ CLI ในเครื่องคือ `--provider hetzner --class beast`; เขียนทับ
ด้วย `--provider`, `--class`/`--machine-class` หรือ
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` โดยทั่วไปเวิร์กโฟลว์
GitHub จะเขียนทับทั้งสองค่า (ตัวอย่างเช่น `--class standard` และอินพุตเลือกผู้ให้บริการ
`aws`/`hetzner` ของเวิร์กโฟลว์ Slack) หากผู้ให้บริการช้าเกินไป
หรือไม่พร้อมใช้งาน ให้เพิ่มผู้ให้บริการนั้นภายใต้อินเทอร์เฟซ Crabbox เดิม แทนการ
ฮาร์ดโค้ดการสำรองไปใช้ตัวอื่น

ข้อมูลพื้นฐานของ VM: Linux ที่มี Chrome/Chromium ซึ่งรองรับเดสก์ท็อป, การเข้าถึง CDP, VNC/
noVNC, Node 22+ และ pnpm, เช็กเอาต์ OpenClaw และสิทธิ์ขาออกไปยัง
การขนส่งเป้าหมาย, GitHub, ผู้ให้บริการโมเดล และโบรกเกอร์ข้อมูลรับรอง

ชื่อข้อมูลลับที่ใช้ในเวิร์กโฟลว์ Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` สำหรับการอัปโหลดอาร์ติแฟกต์สาธารณะ
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (เวิร์กโฟลว์ยังรองรับ
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` เป็นค่าสำรอง และแมป
  ค่าเหล่านี้ไปยังชื่อแบบปกติก่อนเรียกใช้ Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

ตัวเรียกใช้ Mantis ต้องไม่พิมพ์โทเค็นบอต Discord/Slack/Telegram,
คีย์ API ของผู้ให้บริการ, คุกกี้เบราว์เซอร์, เนื้อหาโปรไฟล์การยืนยันตัวตน, รหัสผ่าน VNC หรือ
เพย์โหลดข้อมูลรับรองดิบ หากโทเค็นรั่วไหลไปยัง issue, PR, แชต หรือบันทึก
ให้หมุนเวียนโทเค็นหลังจากจัดเก็บข้อมูลลับทดแทนแล้ว

## ผลลัพธ์การเรียกใช้

สถานการณ์การขนส่งแบบก่อน/หลังจะแยกแยะผลลัพธ์เหล่านี้ เพื่อไม่ให้
สภาพแวดล้อมที่ไม่เสถียรถูกตีความว่าเป็นการถดถอยของผลิตภัณฑ์:

- **เกิดข้อบกพร่องซ้ำได้**: baseline ล้มเหลวในลักษณะที่สถานการณ์คาดไว้
- **ความล้มเหลวของชุดทดสอบ**: การตั้งค่าสภาพแวดล้อม, ข้อมูลรับรอง, API การขนส่ง, เบราว์เซอร์
  หรือผู้ให้บริการล้มเหลวก่อนที่เกณฑ์ตัดสินจะให้ผลที่มีความหมาย

หลักฐานจากเบราว์เซอร์เฉพาะ candidate จะรายงานว่า candidate ผ่าน Gateway จำลอง
และการตรวจสอบ UI ที่มองเห็นได้หรือไม่ โดยจะไม่อ้างว่าสามารถทำให้ baseline เกิดปัญหาซ้ำได้

## การเพิ่มสถานการณ์

สถานการณ์การขนส่งแบบสดกำหนดด้วย TypeScript แยกตามการขนส่ง (ดู
`MANTIS_SCENARIO_CONFIGS` ใน `extensions/qa-lab/src/mantis/run.runtime.ts` สำหรับ
รูปแบบก่อน/หลังของ Discord) ไม่ใช่รูปแบบไฟล์ประกาศแบบแยกเดี่ยว
แต่ละสถานการณ์ต้องมี: รหัสและชื่อ, การขนส่ง, ข้อมูลรับรองที่จำเป็น, นโยบายการอ้างอิง baseline,
นโยบายการอ้างอิง candidate, แพตช์การกำหนดค่า OpenClaw, ขั้นตอนการตั้งค่า/กระตุ้น,
เกณฑ์ตัดสินที่คาดหวังสำหรับ baseline และ candidate, เป้าหมายการบันทึกภาพ, งบประมาณ
เวลาหมด และขั้นตอนการล้างข้อมูล

การพิสูจน์ผ่านเบราว์เซอร์ที่มุ่งเฉพาะรุ่นที่พิจารณาสามารถใช้การทดสอบ E2E แบบกำหนดผลลัพธ์ได้โดยเฉพาะ
และเวิร์กโฟลว์เฉพาะได้ กำหนดขอบเขตให้ชัดเจน ตรวจสอบความถูกต้องของ ref ของรุ่นที่พิจารณาก่อน
ดำเนินการ แยกการเผยแพร่ที่อาศัยข้อมูลลับออกจากกัน และส่งออกสัญญา
แมนิเฟสต์หลักฐานแบบเดียวกัน

เลือกใช้ออราเคิลขนาดเล็กที่มีชนิดข้อมูลชัดเจนแทนการตรวจสอบด้วยภาพ เช่น สถานะรีแอ็กชันของ Discord หรือ
การอ้างอิงข้อความ สถานะ `ts` ของเธรด/รีแอ็กชันจาก API ของ Slack ตลอดจนรหัสข้อความอีเมล
และส่วนหัว ใช้ภาพหน้าจอเบราว์เซอร์เมื่อ UI เป็นสิ่งที่สังเกตได้อย่างน่าเชื่อถือเพียงอย่างเดียว
และให้การตรวจสอบด้วยภาพเป็นส่วนเสริมของออราเคิลจาก API ของแพลตฟอร์ม หากมีออราเคิลดังกล่าว

หลังจาก Discord, Slack และ Telegram รูปแบบตัวดำเนินการเดียวกันนี้สามารถขยายไปยัง WhatsApp
(การเข้าสู่ระบบด้วย QR, การระบุตัวตนอีกครั้ง, การส่งมอบ, สื่อ, รีแอ็กชัน) และ Matrix
(ห้องที่เข้ารหัส, ความสัมพันธ์ของเธรด/การตอบกลับ, การทำงานต่อหลังรีสตาร์ต) แต่ทั้งสองรายการ
ยังไม่ได้รับการนำไปใช้

## คำถามที่ยังไม่มีข้อสรุป

- ควรใช้บอต Discord ตัวใดเป็นตัวขับ และตัวใดเป็นระบบภายใต้การทดสอบ (SUT) เมื่อนำบอต Mantis
  ที่มีอยู่มาใช้ซ้ำ?
- GitHub ควรเก็บรักษาอาร์ติแฟกต์ Mantis สำหรับ PR ไว้นานเท่าใด?
- ClawSweeper ควรแนะนำสถานการณ์ทดสอบ Mantis โดยอัตโนมัติเมื่อใด แทนที่จะ
  รอคำสั่งจากผู้ดูแล?
- ควรปกปิดข้อมูลหรือตัดภาพหน้าจอก่อนอัปโหลดไปยัง PR สาธารณะหรือไม่?
