---
read_when:
    - คุณต้องการจัดการฮุกของเอเจนต์
    - คุณต้องการตรวจสอบว่าฮุกพร้อมใช้งานหรือไม่ หรือเปิดใช้ฮุกของพื้นที่ทำงาน
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw hooks` (ฮุกของเอเจนต์)
title: ฮุก
x-i18n:
    generated_at: "2026-04-30T09:43:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

จัดการฮุกของเอเจนต์ (ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งอย่าง `/new`, `/reset` และการเริ่มต้น Gateway)

การเรียกใช้ `openclaw hooks` โดยไม่มีคำสั่งย่อยเทียบเท่ากับ `openclaw hooks list`

ที่เกี่ยวข้อง:

- ฮุก: [ฮุก](/th/automation/hooks)
- ฮุกของ Plugin: [ฮุกของ Plugin](/th/plugins/hooks)

## แสดงฮุกทั้งหมด

```bash
openclaw hooks list
```

แสดงฮุกทั้งหมดที่ค้นพบจากเวิร์กสเปซ ไดเรกทอรีที่จัดการอยู่ ไดเรกทอรีเพิ่มเติม และไดเรกทอรีที่มาพร้อมชุดโปรแกรม
การเริ่มต้น Gateway จะไม่โหลดตัวจัดการฮุกภายในจนกว่าจะมีการกำหนดค่าฮุกภายในอย่างน้อยหนึ่งรายการ

**ตัวเลือก:**

- `--eligible`: แสดงเฉพาะฮุกที่พร้อมใช้งานตามเงื่อนไข (ตรงตามข้อกำหนด)
- `--json`: ส่งออกเป็น JSON
- `-v, --verbose`: แสดงข้อมูลโดยละเอียดรวมถึงข้อกำหนดที่ขาดหายไป

**ตัวอย่างเอาต์พุต:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**ตัวอย่าง (แบบละเอียด):**

```bash
openclaw hooks list --verbose
```

แสดงข้อกำหนดที่ขาดหายไปสำหรับฮุกที่ยังไม่พร้อมใช้งานตามเงื่อนไข

**ตัวอย่าง (JSON):**

```bash
openclaw hooks list --json
```

ส่งคืน JSON แบบมีโครงสร้างสำหรับการใช้งานเชิงโปรแกรม

## ดูข้อมูลฮุก

```bash
openclaw hooks info <name>
```

แสดงข้อมูลโดยละเอียดเกี่ยวกับฮุกที่ระบุ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อฮุกหรือคีย์ฮุก (เช่น `session-memory`)

**ตัวเลือก:**

- `--json`: ส่งออกเป็น JSON

**ตัวอย่าง:**

```bash
openclaw hooks info session-memory
```

**เอาต์พุต:**

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

## ตรวจสอบความพร้อมใช้งานของฮุก

```bash
openclaw hooks check
```

แสดงสรุปสถานะความพร้อมใช้งานของฮุก (จำนวนที่พร้อมเทียบกับไม่พร้อม)

**ตัวเลือก:**

- `--json`: ส่งออกเป็น JSON

**ตัวอย่างเอาต์พุต:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## เปิดใช้งานฮุก

```bash
openclaw hooks enable <name>
```

เปิดใช้งานฮุกที่ระบุโดยเพิ่มลงในการกำหนดค่าของคุณ (`~/.openclaw/openclaw.json` ตามค่าเริ่มต้น)

**หมายเหตุ:** ฮุกของเวิร์กสเปซจะถูกปิดใช้งานตามค่าเริ่มต้นจนกว่าจะเปิดใช้งานที่นี่หรือในการกำหนดค่า ฮุกที่จัดการโดย Plugin จะแสดง `plugin:<id>` ใน `openclaw hooks list` และไม่สามารถเปิด/ปิดใช้งานได้ที่นี่ ให้เปิด/ปิดใช้งาน Plugin แทน

**อาร์กิวเมนต์:**

- `<name>`: ชื่อฮุก (เช่น `session-memory`)

**ตัวอย่าง:**

```bash
openclaw hooks enable session-memory
```

**เอาต์พุต:**

```
✓ Enabled hook: 💾 session-memory
```

**สิ่งที่ทำ:**

- ตรวจสอบว่ามีฮุกอยู่และพร้อมใช้งานตามเงื่อนไขหรือไม่
- อัปเดต `hooks.internal.entries.<name>.enabled = true` ในการกำหนดค่าของคุณ
- บันทึกการกำหนดค่าลงดิสก์

หากฮุกมาจาก `<workspace>/hooks/` จะต้องทำขั้นตอนเลือกเข้าร่วมนี้ก่อน
Gateway จึงจะโหลดฮุกนั้น

**หลังจากเปิดใช้งาน:**

- รีสตาร์ท Gateway เพื่อให้โหลดฮุกใหม่ (รีสตาร์ทแอปแถบเมนูบน macOS หรือรีสตาร์ทกระบวนการ Gateway ของคุณในสภาพแวดล้อมพัฒนา)

## ปิดใช้งานฮุก

```bash
openclaw hooks disable <name>
```

ปิดใช้งานฮุกที่ระบุโดยอัปเดตการกำหนดค่าของคุณ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อฮุก (เช่น `command-logger`)

**ตัวอย่าง:**

```bash
openclaw hooks disable command-logger
```

**เอาต์พุต:**

```
⏸ Disabled hook: 📝 command-logger
```

**หลังจากปิดใช้งาน:**

- รีสตาร์ท Gateway เพื่อให้โหลดฮุกใหม่

## หมายเหตุ

- `openclaw hooks list --json`, `info --json` และ `check --json` เขียน JSON แบบมีโครงสร้างไปยัง stdout โดยตรง
- ฮุกที่จัดการโดย Plugin ไม่สามารถเปิดหรือปิดใช้งานที่นี่ได้ ให้เปิดหรือปิดใช้งาน Plugin เจ้าของแทน

## ติดตั้งชุดฮุก

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

ติดตั้งชุดฮุกผ่านตัวติดตั้ง Plugin แบบรวมศูนย์

`openclaw hooks install` ยังคงใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่จะแสดง
คำเตือนการเลิกใช้งานและส่งต่อไปยัง `openclaw plugins install`

สเปก npm เป็นแบบ **เฉพาะ registry** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ
**dist-tag** ที่เป็นทางเลือก) สเปก Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง dependency
ทำงานภายในโปรเจกต์ด้วย `--ignore-scripts` เพื่อความปลอดภัย แม้ว่า
shell ของคุณจะมีการตั้งค่าการติดตั้ง npm แบบ global ก็ตาม

สเปกเปล่าและ `@latest` จะอยู่บนแทร็กเสถียร หาก npm resolve รายการใดรายการหนึ่ง
ไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณเลือกเข้าร่วมอย่างชัดเจนด้วย
แท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน

**สิ่งที่ทำ:**

- คัดลอกชุดฮุกไปยัง `~/.openclaw/hooks/<id>`
- เปิดใช้งานฮุกที่ติดตั้งใน `hooks.internal.entries.*`
- บันทึกการติดตั้งภายใต้ `hooks.internal.installs`

**ตัวเลือก:**

- `-l, --link`: ลิงก์ไดเรกทอรีภายในเครื่องแทนการคัดลอก (เพิ่มลงใน `hooks.internal.load.extraDirs`)
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

ชุดฮุกที่ลิงก์ไว้จะถือเป็นฮุกที่จัดการจากไดเรกทอรีที่ผู้ปฏิบัติการกำหนดค่า
ไม่ใช่ฮุกของเวิร์กสเปซ

## อัปเดตชุดฮุก

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

อัปเดตชุดฮุกแบบ npm ที่ติดตามไว้ผ่านตัวอัปเดต Plugin แบบรวมศูนย์

`openclaw hooks update` ยังคงใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่จะแสดง
คำเตือนการเลิกใช้งานและส่งต่อไปยัง `openclaw plugins update`

**ตัวเลือก:**

- `--all`: อัปเดตชุดฮุกทั้งหมดที่ติดตามไว้
- `--dry-run`: แสดงสิ่งที่จะเปลี่ยนแปลงโดยไม่เขียนข้อมูล

เมื่อมีแฮชความถูกต้องสมบูรณ์ที่เก็บไว้และแฮช artifact ที่ดึงมาเปลี่ยนไป
OpenClaw จะแสดงคำเตือนและขอการยืนยันก่อนดำเนินการต่อ ใช้
`--yes` แบบ global เพื่อข้ามพรอมต์ใน CI/การทำงานแบบไม่โต้ตอบ

## ฮุกที่มาพร้อมชุดโปรแกรม

### session-memory

บันทึกบริบทของเซสชันไปยังหน่วยความจำเมื่อคุณออกคำสั่ง `/new` หรือ `/reset`

**เปิดใช้งาน:**

```bash
openclaw hooks enable session-memory
```

**เอาต์พุต:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**ดูเพิ่มเติม:** [เอกสาร session-memory](/th/automation/hooks#session-memory)

### bootstrap-extra-files

ฉีดไฟล์ bootstrap เพิ่มเติม (ตัวอย่างเช่น `AGENTS.md` / `TOOLS.md` ภายใน monorepo) ระหว่าง `agent:bootstrap`

**เปิดใช้งาน:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ดูเพิ่มเติม:** [เอกสาร bootstrap-extra-files](/th/automation/hooks#bootstrap-extra-files)

### command-logger

บันทึกเหตุการณ์คำสั่งทั้งหมดไปยังไฟล์ audit รวมศูนย์

**เปิดใช้งาน:**

```bash
openclaw hooks enable command-logger
```

**เอาต์พุต:** `~/.openclaw/logs/commands.log`

**ดูบันทึก:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**ดูเพิ่มเติม:** [เอกสาร command-logger](/th/automation/hooks#command-logger)

### boot-md

เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มทำงาน (หลังจากช่องทางเริ่มทำงานแล้ว)

**เหตุการณ์**: `gateway:startup`

**เปิดใช้งาน**:

```bash
openclaw hooks enable boot-md
```

**ดูเพิ่มเติม:** [เอกสาร boot-md](/th/automation/hooks#boot-md)

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [ฮุกอัตโนมัติ](/th/automation/hooks)
