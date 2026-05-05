---
read_when:
    - คุณต้องการจัดการฮุกของเอเจนต์
    - คุณต้องการตรวจสอบความพร้อมใช้งานของฮุกหรือเปิดใช้งานฮุกของเวิร์กสเปซ
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw hooks` (ฮุกของเอเจนต์)
title: ฮุก
x-i18n:
    generated_at: "2026-05-05T08:25:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

จัดการ agent hooks (ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งอย่าง `/new`, `/reset` และการเริ่มต้น Gateway)

การรัน `openclaw hooks` โดยไม่มี subcommand จะเทียบเท่ากับ `openclaw hooks list`

ที่เกี่ยวข้อง:

- Hooks: [Hooks](/th/automation/hooks)
- Plugin hooks: [Plugin hooks](/th/plugins/hooks)

## แสดงรายการ hooks ทั้งหมด

```bash
openclaw hooks list
```

แสดงรายการ hooks ทั้งหมดที่ค้นพบจากไดเรกทอรี workspace, managed, extra และ bundled
การเริ่มต้น Gateway จะไม่โหลดตัวจัดการ hook ภายในจนกว่าจะมี hook ภายในอย่างน้อยหนึ่งรายการถูกกำหนดค่าไว้

**ตัวเลือก:**

- `--eligible`: แสดงเฉพาะ hooks ที่พร้อมใช้ (ผ่านข้อกำหนด)
- `--json`: แสดงผลเป็น JSON
- `-v, --verbose`: แสดงข้อมูลโดยละเอียด รวมถึงข้อกำหนดที่ยังขาดอยู่

**ตัวอย่างผลลัพธ์:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**ตัวอย่าง (verbose):**

```bash
openclaw hooks list --verbose
```

แสดงข้อกำหนดที่ยังขาดอยู่สำหรับ hooks ที่ยังไม่พร้อมใช้

**ตัวอย่าง (JSON):**

```bash
openclaw hooks list --json
```

ส่งคืน JSON ที่มีโครงสร้างสำหรับใช้งานเชิงโปรแกรม

## ดูข้อมูล hook

```bash
openclaw hooks info <name>
```

แสดงข้อมูลโดยละเอียดเกี่ยวกับ hook ที่ระบุ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook หรือคีย์ hook (เช่น `session-memory`)

**ตัวเลือก:**

- `--json`: แสดงผลเป็น JSON

**ตัวอย่าง:**

```bash
openclaw hooks info session-memory
```

**ผลลัพธ์:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## ตรวจสอบความพร้อมใช้ของ hooks

```bash
openclaw hooks check
```

แสดงสรุปสถานะความพร้อมใช้ของ hooks (จำนวนที่พร้อมเทียบกับไม่พร้อม)

**ตัวเลือก:**

- `--json`: แสดงผลเป็น JSON

**ตัวอย่างผลลัพธ์:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## เปิดใช้งาน Hook

```bash
openclaw hooks enable <name>
```

เปิดใช้งาน hook ที่ระบุโดยเพิ่มลงในการกำหนดค่าของคุณ (`~/.openclaw/openclaw.json` ตามค่าเริ่มต้น)

**หมายเหตุ:** Workspace hooks จะถูกปิดใช้งานตามค่าเริ่มต้นจนกว่าจะเปิดใช้งานที่นี่หรือในการกำหนดค่า Hooks ที่จัดการโดย plugins จะแสดง `plugin:<id>` ใน `openclaw hooks list` และไม่สามารถเปิด/ปิดใช้งานที่นี่ได้ ให้เปิด/ปิดใช้งาน plugin แทน

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook (เช่น `session-memory`)

**ตัวอย่าง:**

```bash
openclaw hooks enable session-memory
```

**ผลลัพธ์:**

```
✓ Enabled hook: 💾 session-memory
```

**สิ่งที่ทำ:**

- ตรวจสอบว่า hook มีอยู่และพร้อมใช้หรือไม่
- อัปเดต `hooks.internal.entries.<name>.enabled = true` ในการกำหนดค่าของคุณ
- บันทึกการกำหนดค่าลงดิสก์

หาก hook มาจาก `<workspace>/hooks/` ต้องทำขั้นตอน opt-in นี้ก่อน
Gateway จึงจะโหลด hook นั้น

**หลังเปิดใช้งาน:**

- รีสตาร์ท gateway เพื่อให้ hooks โหลดใหม่ (รีสตาร์ทแอปแถบเมนูบน macOS หรือรีสตาร์ทโปรเซส gateway ของคุณใน dev)

## ปิดใช้งาน Hook

```bash
openclaw hooks disable <name>
```

ปิดใช้งาน hook ที่ระบุโดยอัปเดตการกำหนดค่าของคุณ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook (เช่น `command-logger`)

**ตัวอย่าง:**

```bash
openclaw hooks disable command-logger
```

**ผลลัพธ์:**

```
⏸ Disabled hook: 📝 command-logger
```

**หลังปิดใช้งาน:**

- รีสตาร์ท gateway เพื่อให้ hooks โหลดใหม่

## หมายเหตุ

- `openclaw hooks list --json`, `info --json` และ `check --json` เขียน JSON ที่มีโครงสร้างไปยัง stdout โดยตรง
- Hooks ที่จัดการโดย Plugin ไม่สามารถเปิดหรือปิดใช้งานที่นี่ได้ ให้เปิดหรือปิดใช้งาน plugin เจ้าของแทน

## ติดตั้ง hook packs

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

ติดตั้ง hook packs ผ่านตัวติดตั้ง plugins แบบรวม

`openclaw hooks install` ยังใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่จะแสดง
คำเตือนการเลิกใช้งานและส่งต่อไปยัง `openclaw plugins install`

สเปก npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** ที่เลือกได้ หรือ
**dist-tag**) สเปก Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency
จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ว่า
shell ของคุณจะมีการตั้งค่า global npm install อยู่ก็ตาม

สเปกเปล่าและ `@latest` จะอยู่บนแทร็กเสถียร หาก npm resolve ค่าใดค่าหนึ่ง
เป็น prerelease OpenClaw จะหยุดและขอให้คุณ opt in อย่างชัดเจนด้วย
แท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน

**สิ่งที่ทำ:**

- คัดลอก hook pack ไปยัง `~/.openclaw/hooks/<id>`
- เปิดใช้งาน hooks ที่ติดตั้งใน `hooks.internal.entries.*`
- บันทึกการติดตั้งไว้ใต้ `hooks.internal.installs`

**ตัวเลือก:**

- `-l, --link`: ลิงก์ไดเรกทอรีภายในแทนการคัดลอก (เพิ่มไปยัง `hooks.internal.load.extraDirs`)
- `--pin`: บันทึกการติดตั้ง npm เป็น `name@version` ที่ resolve แล้วแบบแน่นอนใน `hooks.internal.installs`

**ไฟล์ archive ที่รองรับ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**ตัวอย่าง:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Hook packs ที่ลิงก์ไว้จะถูกถือว่าเป็น managed hooks จากไดเรกทอรี
ที่ผู้ดูแลระบบกำหนดค่า ไม่ใช่ workspace hooks

## อัปเดต hook packs

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

อัปเดต hook packs ที่อิง npm และถูกติดตามไว้ผ่านตัวอัปเดต plugins แบบรวม

`openclaw hooks update` ยังใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่จะแสดง
คำเตือนการเลิกใช้งานและส่งต่อไปยัง `openclaw plugins update`

**ตัวเลือก:**

- `--all`: อัปเดต hook packs ทั้งหมดที่ถูกติดตาม
- `--dry-run`: แสดงสิ่งที่จะเปลี่ยนโดยไม่เขียนข้อมูล

เมื่อมีแฮช integrity ที่จัดเก็บไว้และแฮชของ artifact ที่ดึงมาเปลี่ยนไป
OpenClaw จะแสดงคำเตือนและขอการยืนยันก่อนดำเนินการต่อ ใช้
global `--yes` เพื่อข้าม prompt ใน CI/การรันแบบไม่โต้ตอบ

## Bundled hooks

### session-memory

บันทึก context ของ session ลงใน memory เมื่อคุณใช้ `/new` หรือ `/reset`

**เปิดใช้งาน:**

```bash
openclaw hooks enable session-memory
```

**ผลลัพธ์:** `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md` ตามค่าเริ่มต้น ตั้งค่า `hooks.internal.entries.session-memory.llmSlug: true` สำหรับ slug ชื่อไฟล์ที่สร้างโดย model

**ดู:** [เอกสาร session-memory](/th/automation/hooks#session-memory)

### bootstrap-extra-files

แทรกไฟล์ bootstrap เพิ่มเติม (เช่น `AGENTS.md` / `TOOLS.md` เฉพาะ monorepo-local) ระหว่าง `agent:bootstrap`

**เปิดใช้งาน:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ดู:** [เอกสาร bootstrap-extra-files](/th/automation/hooks#bootstrap-extra-files)

### command-logger

บันทึกเหตุการณ์คำสั่งทั้งหมดไปยังไฟล์ audit รวมศูนย์

**เปิดใช้งาน:**

```bash
openclaw hooks enable command-logger
```

**ผลลัพธ์:** `~/.openclaw/logs/commands.log`

**ดู logs:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**ดู:** [เอกสาร command-logger](/th/automation/hooks#command-logger)

### boot-md

รัน `BOOT.md` เมื่อ gateway เริ่มทำงาน (หลังจาก channels เริ่มแล้ว)

**เหตุการณ์**: `gateway:startup`

**เปิดใช้งาน**:

```bash
openclaw hooks enable boot-md
```

**ดู:** [เอกสาร boot-md](/th/automation/hooks#boot-md)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Automation hooks](/th/automation/hooks)
