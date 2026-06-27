---
read_when:
    - กำลังเริ่มเซสชันเอเจนต์ OpenClaw ใหม่
    - การเปิดใช้งานหรือการตรวจสอบ Skills เริ่มต้น
summary: คำสั่งและบัญชีรายชื่อ Skills เริ่มต้นของเอเจนต์ OpenClaw สำหรับการตั้งค่าผู้ช่วยส่วนตัว
title: AGENTS.md ค่าเริ่มต้น
x-i18n:
    generated_at: "2026-06-27T18:19:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## การเรียกใช้ครั้งแรก (แนะนำ)

OpenClaw ใช้ไดเรกทอรี workspace เฉพาะสำหรับ agent ค่าเริ่มต้น: `~/.openclaw/workspace` (กำหนดค่าได้ผ่าน `agents.defaults.workspace`)

1. สร้าง workspace (หากยังไม่มีอยู่):

```bash
mkdir -p ~/.openclaw/workspace
```

2. คัดลอกเทมเพลต workspace ค่าเริ่มต้นไปยัง workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. ไม่บังคับ: หากคุณต้องการบัญชีรายชื่อ Skills ของผู้ช่วยส่วนตัว ให้แทนที่ AGENTS.md ด้วยไฟล์นี้:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. ไม่บังคับ: เลือก workspace อื่นโดยตั้งค่า `agents.defaults.workspace` (รองรับ `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## ค่าเริ่มต้นด้านความปลอดภัย

- อย่าเทไดเรกทอรีหรือความลับลงในแชต
- อย่ารันคำสั่งที่ทำลายข้อมูล เว้นแต่จะถูกขออย่างชัดเจน
- ก่อนเปลี่ยน config หรือ schedulers (เช่น crontab, systemd units, nginx configs หรือ shell rc files) ให้ตรวจสอบสถานะที่มีอยู่ก่อน และคงไว้/ผสานตามค่าเริ่มต้น
- อย่าส่งการตอบกลับบางส่วน/แบบสตรีมไปยังพื้นผิวข้อความภายนอก (ส่งเฉพาะการตอบกลับสุดท้าย)

## การตรวจสอบเบื้องต้นสำหรับโซลูชันที่มีอยู่

ก่อนเสนอหรือสร้างระบบ ฟีเจอร์ workflow เครื่องมือ การผสานรวม หรือ automation แบบกำหนดเอง ให้ตรวจสอบอย่างสั้นๆ ว่ามีโปรเจกต์โอเพนซอร์ส ไลบรารีที่ยังดูแลอยู่ OpenClaw plugins ที่มีอยู่ หรือแพลตฟอร์มฟรีที่แก้ปัญหาได้ดีพออยู่แล้วหรือไม่ ให้เลือกใช้สิ่งเหล่านั้นเมื่อเหมาะสม สร้างแบบกำหนดเองเฉพาะเมื่อทางเลือกที่มีอยู่ไม่เหมาะสม แพงเกินไป ไม่ได้รับการดูแล ไม่ปลอดภัย ไม่สอดคล้องข้อกำหนด หรือผู้ใช้ขอแบบกำหนดเองอย่างชัดเจน หลีกเลี่ยงการแนะนำบริการแบบเสียเงิน เว้นแต่ผู้ใช้จะอนุมัติค่าใช้จ่ายอย่างชัดเจน ทำให้เบา: เป็นด่านตรวจเบื้องต้น ไม่ใช่งานวิจัยขนาดใหญ่

## เริ่มเซสชัน (จำเป็น)

- อ่าน `SOUL.md`, `USER.md` และวันนี้+เมื่อวานใน `memory/`
- อ่าน `MEMORY.md` เมื่อมีอยู่
- ทำก่อนตอบกลับ

## Soul (จำเป็น)

- `SOUL.md` กำหนดตัวตน น้ำเสียง และขอบเขต รักษาให้เป็นปัจจุบัน
- หากคุณเปลี่ยน `SOUL.md` ให้บอกผู้ใช้
- คุณเป็นอินสแตนซ์ใหม่ในแต่ละเซสชัน ความต่อเนื่องอยู่ในไฟล์เหล่านี้

## พื้นที่ร่วม (แนะนำ)

- คุณไม่ใช่เสียงของผู้ใช้ โปรดระวังในแชตกลุ่มหรือช่องสาธารณะ
- อย่าแชร์ข้อมูลส่วนตัว ข้อมูลติดต่อ หรือบันทึกภายใน

## ระบบหน่วยความจำ (แนะนำ)

- บันทึกรายวัน: `memory/YYYY-MM-DD.md` (สร้าง `memory/` หากจำเป็น)
- หน่วยความจำระยะยาว: `MEMORY.md` สำหรับข้อเท็จจริง ความชอบ และการตัดสินใจที่คงทน
- `memory.md` ตัวพิมพ์เล็กเป็นข้อมูลอินพุตสำหรับซ่อมแซม legacy เท่านั้น อย่าตั้งใจเก็บไฟล์ root ทั้งสองไว้พร้อมกัน
- เมื่อเริ่มเซสชัน ให้อ่านวันนี้ + เมื่อวาน + `MEMORY.md` เมื่อมีอยู่
- ก่อนเขียนไฟล์หน่วยความจำ ให้อ่านไฟล์ก่อน เขียนเฉพาะการอัปเดตที่เป็นรูปธรรม ห้ามเขียน placeholder ว่าง
- บันทึก: การตัดสินใจ ความชอบ ข้อจำกัด งานค้าง
- หลีกเลี่ยงความลับ เว้นแต่จะถูกขออย่างชัดเจน

## เครื่องมือและ Skills

- เครื่องมืออยู่ใน Skills; ทำตาม `SKILL.md` ของแต่ละ Skill เมื่อคุณต้องใช้
- เก็บบันทึกเฉพาะสภาพแวดล้อมไว้ใน `TOOLS.md` (Notes for Skills)

## เคล็ดลับการสำรองข้อมูล (แนะนำ)

หากคุณถือว่า workspace นี้เป็น "หน่วยความจำ" ของ Clawd ให้ทำเป็น git repo (ควรเป็นส่วนตัว) เพื่อให้ `AGENTS.md` และไฟล์หน่วยความจำของคุณถูกสำรองไว้

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw ทำอะไร

- รัน WhatsApp gateway + agent ของ OpenClaw ที่ฝังมา เพื่อให้ผู้ช่วยอ่าน/เขียนแชต ดึง context และรัน Skills ผ่าน Mac โฮสต์ได้
- แอป macOS จัดการสิทธิ์ (การบันทึกหน้าจอ การแจ้งเตือน ไมโครโฟน) และเปิดเผย `openclaw` CLI ผ่านไบนารีที่บันเดิลมา
- แชตโดยตรงจะยุบเข้ากับเซสชัน `main` ของ agent ตามค่าเริ่มต้น กลุ่มจะแยกไว้เป็น `agent:<agentId>:<channel>:group:<id>` (ห้อง/ช่อง: `agent:<agentId>:<channel>:channel:<id>`); heartbeats ช่วยให้งานเบื้องหลังยังทำงานอยู่

## Skills หลัก (เปิดใช้งานใน การตั้งค่า → Skills)

- **mcporter** - รันไทม์/CLI ของเซิร์ฟเวอร์เครื่องมือสำหรับจัดการ backend ของ Skill ภายนอก
- **Peekaboo** - ภาพหน้าจอ macOS ที่รวดเร็ว พร้อมการวิเคราะห์ด้วย AI vision แบบไม่บังคับ
- **camsnap** - จับภาพเฟรม คลิป หรือการแจ้งเตือนการเคลื่อนไหวจากกล้องรักษาความปลอดภัย RTSP/ONVIF
- **oracle** - CLI agent ที่พร้อมใช้กับ OpenAI พร้อมการ replay เซสชันและการควบคุมเบราว์เซอร์
- **eightctl** - ควบคุมการนอนของคุณจาก terminal
- **imsg** - ส่ง อ่าน สตรีม iMessage และ SMS
- **wacli** - WhatsApp CLI: ซิงค์ ค้นหา ส่ง
- **discord** - การทำงานของ Discord: react, stickers, polls ใช้เป้าหมาย `user:<id>` หรือ `channel:<id>` (id ตัวเลขเปล่าๆ กำกวม)
- **gog** - Google Suite CLI: Gmail, Calendar, Drive, Contacts
- **spotify-player** - ไคลเอนต์ Spotify บน terminal สำหรับค้นหา/เข้าคิว/ควบคุมการเล่น
- **sag** - เสียงพูด ElevenLabs พร้อม UX แบบ mac-style say; สตรีมไปยังลำโพงตามค่าเริ่มต้น
- **Sonos CLI** - ควบคุมลำโพง Sonos (ค้นหา/สถานะ/การเล่น/ระดับเสียง/การจัดกลุ่ม) จากสคริปต์
- **blucli** - เล่น จัดกลุ่ม และทำ automation กับเครื่องเล่น BluOS จากสคริปต์
- **OpenHue CLI** - ควบคุมไฟ Philips Hue สำหรับ scenes และ automations
- **OpenAI Whisper** - แปลงเสียงพูดเป็นข้อความแบบ local สำหรับการ dictation อย่างรวดเร็วและถอดข้อความ voicemail
- **Gemini CLI** - โมเดล Google Gemini จาก terminal สำหรับถามตอบอย่างรวดเร็ว
- **agent-tools** - ชุดเครื่องมือ utility สำหรับ automations และสคริปต์ช่วยเหลือ

## หมายเหตุการใช้งาน

- ควรใช้ `openclaw` CLI สำหรับ scripting; แอป Mac จัดการสิทธิ์ให้
- รันการติดตั้งจากแท็บ Skills; แท็บนี้จะซ่อนปุ่มหากมีไบนารีอยู่แล้ว
- เปิด heartbeats ไว้เพื่อให้ผู้ช่วยสามารถตั้งเวลาการเตือน ตรวจสอบ inboxes และทริกเกอร์การจับภาพจากกล้องได้
- Canvas UI รันเต็มหน้าจอพร้อม native overlays หลีกเลี่ยงการวางตัวควบคุมสำคัญไว้ที่ขอบบนซ้าย/บนขวา/ล่าง เพิ่ม gutters ที่ชัดเจนใน layout และอย่าพึ่งพา safe-area insets
- สำหรับการตรวจสอบที่ขับเคลื่อนด้วยเบราว์เซอร์ ให้ใช้ `openclaw browser` (tabs/status/screenshot) กับโปรไฟล์ Chrome ที่ OpenClaw จัดการ
- สำหรับการตรวจสอบ DOM ให้ใช้ `openclaw browser eval|query|dom|snapshot` (และ `--json`/`--out` เมื่อคุณต้องการเอาต์พุตสำหรับเครื่อง)
- สำหรับการโต้ตอบ ให้ใช้ `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type ต้องใช้ snapshot refs; ใช้ `evaluate` สำหรับ CSS selectors)

## ที่เกี่ยวข้อง

- [Workspace ของ agent](/th/concepts/agent-workspace)
- [รันไทม์ของ agent](/th/concepts/agent)
