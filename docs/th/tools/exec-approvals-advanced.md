---
read_when:
    - การกำหนดค่า safe bins หรือโปรไฟล์ safe-bin แบบกำหนดเอง
    - การส่งต่อการอนุมัติไปยัง Slack/Discord/Telegram หรือช่องทางแชตอื่นๆ
    - การติดตั้งใช้งานไคลเอนต์การอนุมัติแบบเนทีฟสำหรับช่องทางหนึ่งๆ
summary: 'การอนุมัติ exec ขั้นสูง: safe bins, การผูก interpreter, การส่งต่อการอนุมัติ, การส่งมอบแบบเนทีฟ'
title: การอนุมัติ Exec — ขั้นสูง
x-i18n:
    generated_at: "2026-04-25T14:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

หัวข้อขั้นสูงของการอนุมัติ exec: fast-path ของ `safeBins`, การผูก interpreter/runtime
และการส่งต่อการอนุมัติไปยังช่องทางแชต (รวมถึงการส่งมอบแบบเนทีฟ)
สำหรับนโยบายหลักและโฟลว์การอนุมัติ ดู [Exec approvals](/th/tools/exec-approvals)

## Safe bins (stdin-only)

`tools.exec.safeBins` กำหนดรายการไบนารี **stdin-only** ขนาดเล็ก (เช่น
`cut`) ที่สามารถทำงานในโหมด allowlist ได้ **โดยไม่ต้อง** มีรายการ allowlist แบบ explicit
Safe bins จะปฏิเสธอาร์กิวเมนต์ไฟล์แบบ positional และโทเค็นที่คล้ายพาธ จึงสามารถ
ทำงานได้เฉพาะกับสตรีมขาเข้าเท่านั้น ให้มองว่านี่เป็น fast-path แบบจำกัดสำหรับ
ตัวกรองสตรีม ไม่ใช่รายการความเชื่อถือทั่วไป

<Warning>
**ห้าม** เพิ่มไบนารีประเภท interpreter หรือ runtime (เช่น `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) ลงใน `safeBins` หากคำสั่งสามารถประเมินโค้ด
รันคำสั่งย่อย หรืออ่านไฟล์ได้โดยธรรมชาติ ให้ใช้รายการ allowlist แบบ explicit
และเปิดใช้ prompt การอนุมัติไว้ต่อไป safe bins แบบกำหนดเองต้องกำหนดโปรไฟล์แบบ explicit
ใน `tools.exec.safeBinProfiles.<bin>`
</Warning>

safe bins เริ่มต้น:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` และ `sort` ไม่อยู่ในรายการเริ่มต้น หากคุณเลือกเปิดใช้ ให้คง
รายการ allowlist แบบ explicit สำหรับเวิร์กโฟลว์ที่ไม่ใช่ stdin ของมันไว้ สำหรับ `grep` ในโหมด safe-bin
ให้ส่งแพตเทิร์นด้วย `-e`/`--regexp`; รูปแบบแพตเทิร์นแบบ positional จะถูกปฏิเสธ
เพื่อไม่ให้สามารถลักลอบส่ง operand ของไฟล์มาเป็น positional ที่กำกวมได้

### การตรวจสอบ argv และแฟลกที่ถูกปฏิเสธ

การตรวจสอบเป็นแบบกำหนดแน่นอนจากรูปแบบ argv เท่านั้น (ไม่มีการตรวจสอบการมีอยู่ของไฟล์ในโฮสต์)
ซึ่งช่วยป้องกันพฤติกรรมแบบ file-existence oracle จากความแตกต่างของ allow/deny
ตัวเลือกที่เกี่ยวกับไฟล์จะถูกปฏิเสธสำหรับ safe bins เริ่มต้น; long
options จะถูกตรวจสอบแบบ fail-closed (แฟลกที่ไม่รู้จักและตัวย่อที่กำกวมจะ
ถูกปฏิเสธ)

แฟลกที่ถูกปฏิเสธตามโปรไฟล์ safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

safe bins ยังบังคับให้โทเค็น argv ถูกตีความเป็น **ข้อความตามตัวอักษร** ในขณะรัน
(ไม่มี globbing และไม่มีการขยาย `$VARS`) สำหรับเซกเมนต์ stdin-only ดังนั้นแพตเทิร์น
อย่าง `*` หรือ `$HOME/...` จึงไม่สามารถใช้ลักลอบอ่านไฟล์ได้

### ไดเรกทอรีไบนารีที่เชื่อถือได้

safe bins ต้อง resolve มาจากไดเรกทอรีไบนารีที่เชื่อถือได้ (ค่าเริ่มต้นของระบบรวมกับ
`tools.exec.safeBinTrustedDirs` แบบไม่บังคับ) รายการใน `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ
ไดเรกทอรีที่เชื่อถือได้เริ่มต้นถูกตั้งใจให้มีน้อยที่สุด: `/bin`, `/usr/bin` หาก
ไฟล์ปฏิบัติการ safe-bin ของคุณอยู่ในพาธแบบ package-manager/user (เช่น
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`) ให้เพิ่ม
พาธเหล่านั้นแบบ explicit ลงใน `tools.exec.safeBinTrustedDirs`

### การเชื่อมคำสั่งของ shell, wrappers และ multiplexers

อนุญาตการเชื่อมคำสั่งของ shell (`&&`, `||`, `;`) ได้เมื่อทุก top-level segment
ผ่าน allowlist (รวม safe bins หรือ skill auto-allow) ยังคงไม่รองรับ redirections
ในโหมด allowlist การแทนที่คำสั่ง (`$()` / backticks) จะถูกปฏิเสธระหว่างการแยกวิเคราะห์ allowlist รวมถึงภายใน double quotes; ใช้ single quotes หากคุณต้องการข้อความ `$()` ตามตัวอักษร

ในการอนุมัติบน macOS companion-app ข้อความ shell ดิบที่มี syntax สำหรับควบคุมหรือขยาย shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) จะ
ถูกมองว่าไม่ตรง allowlist เว้นแต่ตัวไบนารีของ shell เองจะอยู่ใน allowlist

สำหรับ shell wrappers (`bash|sh|zsh ... -c/-lc`) การ override env ระดับคำขอจะ
ถูกลดลงเหลือ allowlist แบบ explicit ขนาดเล็ก (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`)

สำหรับการตัดสินใจ `allow-always` ในโหมด allowlist dispatch wrappers ที่รู้จัก (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) จะคงพาธของไฟล์ปฏิบัติการภายในแทนพาธของ wrapper
shell multiplexers (`busybox`, `toybox`) จะถูกคลี่ออกสำหรับ shell applets (`sh`, `ash` เป็นต้น) ในลักษณะเดียวกัน หากไม่สามารถคลี่ wrapper หรือ multiplexer ได้อย่างปลอดภัย จะไม่มีการบันทึกรายการ allowlist โดยอัตโนมัติ

หากคุณใส่ interpreter อย่าง `python3` หรือ `node` ไว้ใน allowlist ให้ใช้
`tools.exec.strictInlineEval=true` เพื่อให้ inline eval ยังคงต้องใช้การอนุมัติแบบ explicit
ใน strict mode คำตัดสิน `allow-always` ยังสามารถคงการเรียกใช้
interpreter/script ที่ไม่เป็นอันตรายได้ แต่ carrier ของ inline-eval จะไม่ถูกบันทึกอัตโนมัติ

### Safe bins เทียบกับ allowlist

| หัวข้อ           | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| เป้าหมาย         | อนุญาตตัวกรอง stdin แบบจำกัดโดยอัตโนมัติ               | เชื่อถือไฟล์ปฏิบัติการเฉพาะรายการแบบ explicit                                      |
| ประเภทการจับคู่  | ชื่อไฟล์ปฏิบัติการ + นโยบาย argv ของ safe-bin           | glob ของพาธไฟล์ปฏิบัติการที่ resolve แล้ว หรือ glob ของชื่อคำสั่งล้วนสำหรับคำสั่งที่เรียกผ่าน PATH |
| ขอบเขตอาร์กิวเมนต์ | ถูกจำกัดโดยโปรไฟล์ safe-bin และกฎโทเค็นตามตัวอักษร     | จับคู่ตามพาธเท่านั้น; อาร์กิวเมนต์อื่นๆ เป็นความรับผิดชอบของคุณ                    |
| ตัวอย่างทั่วไป   | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI แบบกำหนดเอง                                 |
| การใช้งานที่เหมาะสม | การแปลงข้อความความเสี่ยงต่ำใน pipeline                | เครื่องมือใดๆ ที่มีพฤติกรรมกว้างขึ้นหรือมีผลข้างเคียง                              |

ตำแหน่งการกำหนดค่า:

- `safeBins` มาจาก config (`tools.exec.safeBins` หรือแบบต่อ Agent ที่ `agents.list[].tools.exec.safeBins`)
- `safeBinTrustedDirs` มาจาก config (`tools.exec.safeBinTrustedDirs` หรือแบบต่อ Agent ที่ `agents.list[].tools.exec.safeBinTrustedDirs`)
- `safeBinProfiles` มาจาก config (`tools.exec.safeBinProfiles` หรือแบบต่อ Agent ที่ `agents.list[].tools.exec.safeBinProfiles`) คีย์โปรไฟล์แบบต่อ Agent จะ override คีย์แบบ global
- รายการ allowlist อยู่ใน `~/.openclaw/exec-approvals.json` บนโฮสต์ภายใต้ `agents.<id>.allowlist` (หรือผ่าน Control UI / `openclaw approvals allowlist ...`)
- `openclaw security audit` จะเตือนด้วย `tools.exec.safe_bins_interpreter_unprofiled` เมื่อมีไบนารี interpreter/runtime อยู่ใน `safeBins` โดยไม่มีโปรไฟล์แบบ explicit
- `openclaw doctor --fix` สามารถ scaffold รายการ `safeBinProfiles.<bin>` แบบกำหนดเองที่ขาดหายเป็น `{}` ได้ (จากนั้นให้ตรวจทานและทำให้เข้มงวดขึ้น) ไบนารี interpreter/runtime จะไม่ถูก scaffold อัตโนมัติ

ตัวอย่างโปรไฟล์แบบกำหนดเอง:
__OC_I18N_900000__
หากคุณเลือกเพิ่ม `jq` ลงใน `safeBins` แบบ explicit OpenClaw จะยังคงปฏิเสธ builtin `env` ในโหมด safe-bin
ดังนั้น `jq -n env` จะไม่สามารถดัมป์ environment ของโปรเซสโฮสต์ได้หากไม่มีพาธ allowlist แบบ explicit
หรือ prompt การอนุมัติ

## คำสั่ง interpreter/runtime

การรัน interpreter/runtime แบบอิงการอนุมัติถูกออกแบบให้ระมัดระวังเป็นพิเศษ:

- มีการผูกบริบทของ argv/cwd/env แบบตรงตัวเสมอ
- รูปแบบไฟล์สคริปต์ shell โดยตรงและไฟล์ runtime โดยตรง จะพยายามผูกกับ snapshot ของไฟล์ในเครื่องที่แน่นอนเพียงไฟล์เดียว
- รูปแบบ wrapper ของ package-manager ทั่วไปที่ยัง resolve ไปยังไฟล์ในเครื่องโดยตรงเพียงไฟล์เดียวได้ (เช่น
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) จะถูกคลี่ออกก่อนผูก
- หาก OpenClaw ไม่สามารถระบุไฟล์ในเครื่องที่แน่นอนเพียงไฟล์เดียวสำหรับคำสั่ง interpreter/runtime
  ได้ (เช่น package scripts, รูปแบบ eval, runtime-specific loader chains หรือรูปแบบหลายไฟล์ที่กำกวม)
  การรันแบบอิงการอนุมัติจะถูกปฏิเสธ แทนที่จะอ้างว่าครอบคลุมความหมายของมันได้
- สำหรับเวิร์กโฟลว์เหล่านั้น ให้ใช้ sandboxing, ขอบเขตโฮสต์แยกต่างหาก หรือเวิร์กโฟลว์แบบ trusted
  allowlist/full ที่ explicit ซึ่งผู้ดูแลระบบยอมรับ semantics ของ runtime ที่กว้างขึ้น

เมื่อจำเป็นต้องมีการอนุมัติ เครื่องมือ exec จะตอบกลับทันทีพร้อม approval id ใช้ id นี้เพื่อ
เชื่อมโยงกับ system events ในภายหลัง (`Exec finished` / `Exec denied`) หากไม่มีการตัดสินใจก่อน timeout
คำขอนั้นจะถือว่าเป็น approval timeout และแสดงผลเป็นเหตุผลการปฏิเสธ

### พฤติกรรมการส่งมอบ followup

หลังจาก async exec ที่ได้รับการอนุมัติเสร็จสิ้น OpenClaw จะส่ง turn แบบ `agent` ติดตามผลไปยังเซสชันเดิม

- หากมีเป้าหมายการส่งมอบภายนอกที่ใช้ได้ (ช่องทางที่ส่งมอบได้พร้อม target `to`) followup จะถูกส่งผ่านช่องทางนั้น
- ในโฟลว์ webchat-only หรือ internal-session ที่ไม่มีเป้าหมายภายนอก การส่ง followup จะคงอยู่เฉพาะในเซสชัน (`deliver: false`)
- หากผู้เรียกขอการส่งมอบภายนอกแบบเข้มงวดอย่าง explicit แต่ไม่สามารถ resolve ช่องทางภายนอกได้ คำขอจะล้มเหลวด้วย `INVALID_REQUEST`
- หากเปิดใช้ `bestEffortDeliver` และไม่สามารถ resolve ช่องทางภายนอกได้ การส่งมอบจะถูกลดระดับเป็นแบบ session-only แทนที่จะล้มเหลว

## การส่งต่อการอนุมัติไปยังช่องทางแชต

คุณสามารถส่งต่อ prompt การอนุมัติ exec ไปยังช่องทางแชตใดก็ได้ (รวมถึงช่องทาง Plugin) และอนุมัติ
ได้ด้วย `/approve` โดยใช้ไปป์ไลน์การส่งขาออกตามปกติ

การกำหนดค่า:
__OC_I18N_900001__
ตอบกลับในแชต:
__OC_I18N_900002__
คำสั่ง `/approve` จัดการได้ทั้งการอนุมัติ exec และการอนุมัติ Plugin หาก ID ไม่ตรงกับการอนุมัติ exec ที่รอดำเนินการ ระบบจะตรวจสอบการอนุมัติ Plugin ต่อโดยอัตโนมัติ

### การส่งต่อการอนุมัติ Plugin

การส่งต่อการอนุมัติ Plugin ใช้ไปป์ไลน์การส่งมอบเดียวกับการอนุมัติ exec แต่มี
การกำหนดค่าแยกของตัวเองภายใต้ `approvals.plugin` การเปิดหรือปิดอย่างหนึ่งจะไม่กระทบอีกอย่าง
__OC_I18N_900003__
รูปแบบ config เหมือนกับ `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` และ `targets` ทำงานแบบเดียวกัน

ช่องทางที่รองรับ interactive replies แบบใช้ร่วมกันจะแสดงปุ่มการอนุมัติชุดเดียวกันทั้งสำหรับ exec และ
การอนุมัติ Plugin ช่องทางที่ไม่มี UI แบบโต้ตอบร่วมกันจะ fallback เป็นข้อความธรรมดาพร้อมคำแนะนำ `/approve`

### การอนุมัติในแชตเดียวกันบนทุกช่องทาง

เมื่อคำขอการอนุมัติ exec หรือ Plugin มีต้นทางมาจากพื้นผิวแชตที่ส่งมอบได้ ตอนนี้แชตเดียวกันนั้น
สามารถอนุมัติได้ด้วย `/approve` เป็นค่าเริ่มต้น ใช้ได้กับช่องทางต่างๆ เช่น Slack, Matrix และ
Microsoft Teams นอกเหนือจากโฟลว์ Web UI และ Terminal UI ที่มีอยู่แล้ว

เส้นทางคำสั่งข้อความแบบใช้ร่วมกันนี้ใช้โมเดลการยืนยันตัวตนของช่องทางนั้นสำหรับบทสนทนานั้นตามปกติ หากแชตต้นทาง
สามารถส่งคำสั่งและรับคำตอบได้อยู่แล้ว คำขอการอนุมัติจะไม่จำเป็นต้องมี native delivery adapter แยกต่างหาก
เพียงเพื่อให้คงสถานะรอดำเนินการ

Discord และ Telegram รองรับ `/approve` ในแชตเดียวกันเช่นกัน แต่ช่องทางเหล่านั้นยังคงใช้
resolved approver list ของตนสำหรับการอนุญาต แม้จะปิด native approval delivery อยู่ก็ตาม

สำหรับ Telegram และ native approval clients อื่นๆ ที่เรียก Gateway โดยตรง
fallback นี้ถูกจำกัดไว้โดยตั้งใจเฉพาะกรณีล้มเหลวแบบ "approval not found" เท่านั้น ความล้มเหลว/ข้อผิดพลาดของการอนุมัติ exec จริง
จะไม่ลองใหม่เป็นการอนุมัติ Plugin แบบเงียบๆ

### การส่งมอบการอนุมัติแบบเนทีฟ

บางช่องทางสามารถทำหน้าที่เป็น native approval clients ได้ด้วย Native clients เพิ่ม approver DMs, origin-chat
fanout และ UX การอนุมัติแบบโต้ตอบเฉพาะช่องทางเพิ่มเติมบนโฟลว์ `/approve` ในแชตเดียวกันแบบใช้ร่วมกัน

เมื่อมีการ์ด/ปุ่มการอนุมัติแบบเนทีฟพร้อมใช้งาน UI แบบเนทีฟนั้นคือเส้นทางหลัก
ที่หันหน้าให้ Agent ใช้งาน Agent ไม่ควรสะท้อนคำสั่งแชตแบบ plain `/approve`
ที่ซ้ำกันด้วย เว้นแต่ผลลัพธ์ของเครื่องมือจะระบุว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือ
การอนุมัติแบบแมนนวลคือเส้นทางเดียวที่เหลืออยู่

โมเดลทั่วไป:

- นโยบาย exec ของโฮสต์ยังคงเป็นตัวตัดสินว่าจำเป็นต้องมีการอนุมัติ exec หรือไม่
- `approvals.exec` ควบคุมการส่งต่อ prompt การอนุมัติไปยังปลายทางแชตอื่น
- `channels.<channel>.execApprovals` ควบคุมว่าช่องทางนั้นจะทำหน้าที่เป็น native approval client หรือไม่

native approval clients จะเปิดใช้การส่งแบบ DM-first อัตโนมัติเมื่อทุกเงื่อนไขต่อไปนี้เป็นจริง:

- ช่องทางนั้นรองรับการส่งมอบการอนุมัติแบบเนทีฟ
- สามารถ resolve approvers ได้จาก `execApprovals.approvers` ที่กำหนดแบบ explicit หรือจาก
  แหล่ง fallback ที่มีเอกสารกำกับของช่องทางนั้น
- `channels.<channel>.execApprovals.enabled` ไม่ได้ตั้งค่าไว้ หรือเป็น `"auto"`

ตั้งค่า `enabled: false` เพื่อปิด native approval client แบบ explicit ตั้งค่า `enabled: true` เพื่อบังคับ
ให้เปิดเมื่อ resolve approvers ได้ การส่งไปยัง origin-chat แบบสาธารณะยังคงกำหนดแบบ explicit ผ่าน
`channels.<channel>.execApprovals.target`

คำถามที่พบบ่อย: [เหตุใดจึงมีการกำหนดค่า exec approval สำหรับการอนุมัติในแชตสองชุด?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

native approval clients เหล่านี้เพิ่มการกำหนดเส้นทาง DM และ fanout ไปยังช่องทางแบบไม่บังคับบนโฟลว์ `/approve` ในแชตเดียวกันแบบใช้ร่วมกัน และปุ่มการอนุมัติที่ใช้ร่วมกัน

พฤติกรรมที่ใช้ร่วมกัน:

- Slack, Matrix, Microsoft Teams และแชตที่ส่งมอบได้ลักษณะเดียวกัน ใช้โมเดลการยืนยันตัวตนของช่องทางตามปกติ
  สำหรับ `/approve` ในแชตเดียวกัน
- เมื่อ native approval client เปิดใช้งานอัตโนมัติ เป้าหมายการส่งแบบเนทีฟเริ่มต้นคือ approver DMs
- สำหรับ Discord และ Telegram เฉพาะ approvers ที่ resolve ได้เท่านั้นที่สามารถอนุมัติหรือปฏิเสธได้
- approvers ของ Discord อาจกำหนดแบบ explicit (`execApprovals.approvers`) หรืออนุมานจาก `commands.ownerAllowFrom`
- approvers ของ Telegram อาจกำหนดแบบ explicit (`execApprovals.approvers`) หรืออนุมานจากการกำหนดค่า owner ที่มีอยู่ (`allowFrom` รวมถึง `defaultTo` ของ direct-message เมื่อรองรับ)
- approvers ของ Slack อาจกำหนดแบบ explicit (`execApprovals.approvers`) หรืออนุมานจาก `commands.ownerAllowFrom`
- ปุ่มแบบเนทีฟของ Slack จะคงชนิด approval id ไว้ ดังนั้น id แบบ `plugin:` จึงสามารถ resolve การอนุมัติ Plugin ได้
  โดยไม่ต้องมีชั้น fallback ภายใน Slack ชั้นที่สอง
- การกำหนดเส้นทาง DM/ช่องทางแบบเนทีฟของ Matrix และ reaction shortcuts รองรับทั้งการอนุมัติ exec และ Plugin;
  การอนุญาต Plugin ยังคงมาจาก `channels.matrix.dm.allowFrom`
- ผู้ร้องขอไม่จำเป็นต้องเป็น approver
- แชตต้นทางสามารถอนุมัติได้โดยตรงด้วย `/approve` เมื่อแชตนั้นรองรับคำสั่งและการตอบกลับอยู่แล้ว
- ปุ่มการอนุมัติแบบเนทีฟของ Discord จะกำหนดเส้นทางตามชนิดของ approval id: id แบบ `plugin:` จะไปยังการอนุมัติ Plugin
  โดยตรง ส่วนอย่างอื่นทั้งหมดจะไปยังการอนุมัติ exec
- ปุ่มการอนุมัติแบบเนทีฟของ Telegram ใช้ fallback แบบ bounded exec-to-plugin เดียวกับ `/approve`
- เมื่อ `target` แบบเนทีฟเปิดใช้การส่งไปยัง origin-chat prompt การอนุมัติจะรวมข้อความคำสั่งไว้ด้วย
- การอนุมัติ exec ที่รอดำเนินการจะหมดอายุภายใน 30 นาทีโดยค่าเริ่มต้น
- หากไม่มี UI ของผู้ปฏิบัติงานหรือ approval client ที่กำหนดค่าไว้ซึ่งสามารถรับคำขอได้ prompt จะ fallback ไปที่ `askFallback`

Telegram ใช้ approver DMs เป็นค่าเริ่มต้น (`target: "dm"`) คุณสามารถสลับเป็น `channel` หรือ `both` ได้เมื่อต้องการ
ให้ prompt การอนุมัติปรากฏในแชต/หัวข้อ Telegram ต้นทางด้วย สำหรับหัวข้อฟอรัมของ Telegram
OpenClaw จะคงหัวข้อนั้นไว้ทั้งสำหรับ prompt การอนุมัติและ follow-up หลังการอนุมัติ

ดูเพิ่มเติม:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### โฟลว์ macOS IPC
__OC_I18N_900004__
หมายเหตุด้านความปลอดภัย:

- โหมด Unix socket `0600`, token จัดเก็บไว้ใน `exec-approvals.json`
- การตรวจสอบ peer แบบ same-UID
- Challenge/response (nonce + HMAC token + request hash) + TTL ระยะสั้น

## ที่เกี่ยวข้อง

- [Exec approvals](/th/tools/exec-approvals) — นโยบายหลักและโฟลว์การอนุมัติ
- [Exec tool](/th/tools/exec)
- [Elevated mode](/th/tools/elevated)
- [Skills](/th/tools/skills) — พฤติกรรม auto-allow ที่ขับเคลื่อนด้วย skill
