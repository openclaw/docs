---
read_when:
    - คุณต้องการจัดการฮุกของเอเจนต์
    - คุณต้องการตรวจสอบความพร้อมใช้งานของฮุกหรือเปิดใช้งานฮุกของเวิร์กสเปซ
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw hooks` (ฮุกของเอเจนต์)
title: ฮุก
x-i18n:
    generated_at: "2026-05-02T20:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

จัดการฮุกของเอเจนต์ (ระบบอัตโนมัติที่ขับเคลื่อนด้วยอีเวนต์สำหรับคำสั่งอย่าง `/new`, `/reset` และการเริ่มต้น Gateway)

การรัน `openclaw hooks` โดยไม่มีคำสั่งย่อยจะเทียบเท่ากับ `openclaw hooks list`

ที่เกี่ยวข้อง:

- ฮุก: [ฮุก](/th/automation/hooks)
- ฮุกของ Plugin: [ฮุกของ Plugin](/th/plugins/hooks)

## แสดงฮุกทั้งหมด

```bash
openclaw hooks list
```

แสดงฮุกทั้งหมดที่ค้นพบจากไดเรกทอรีเวิร์กสเปซ ไดเรกทอรีที่จัดการ ไดเรกทอรีเพิ่มเติม และไดเรกทอรีที่บันเดิลมา
การเริ่มต้น Gateway จะไม่โหลดตัวจัดการฮุกภายในจนกว่าจะมีการกำหนดค่าฮุกภายในอย่างน้อยหนึ่งรายการ

**ตัวเลือก:**

- `--eligible`: แสดงเฉพาะฮุกที่พร้อมใช้งาน (ตรงตามข้อกำหนด)
- `--json`: ส่งออกเป็น JSON
- `-v, --verbose`: แสดงข้อมูลโดยละเอียด รวมถึงข้อกำหนดที่ขาดหายไป

**ตัวอย่างผลลัพธ์:**

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

แสดงข้อกำหนดที่ขาดหายไปสำหรับฮุกที่ยังไม่พร้อมใช้งาน

**ตัวอย่าง (JSON):**

```bash
openclaw hooks list --json
```

คืนค่า JSON แบบมีโครงสร้างสำหรับการใช้งานเชิงโปรแกรม

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

## ตรวจสอบความพร้อมใช้งานของฮุก

```bash
openclaw hooks check
```

แสดงสรุปสถานะความพร้อมใช้งานของฮุก (จำนวนที่พร้อมเทียบกับไม่พร้อม)

**ตัวเลือก:**

- `--json`: ส่งออกเป็น JSON

**ตัวอย่างผลลัพธ์:**

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

เปิดใช้งานฮุกที่ระบุโดยเพิ่มลงในการกำหนดค่าของคุณ (`~/.openclaw/openclaw.json` โดยค่าเริ่มต้น)

**หมายเหตุ:** ฮุกของเวิร์กสเปซจะถูกปิดใช้งานโดยค่าเริ่มต้นจนกว่าจะเปิดใช้งานที่นี่หรือในการกำหนดค่า ฮุกที่จัดการโดย plugins จะแสดง `plugin:<id>` ใน `openclaw hooks list` และไม่สามารถเปิด/ปิดใช้งานที่นี่ได้ ให้เปิด/ปิดใช้งาน plugin แทน

**อาร์กิวเมนต์:**

- `<name>`: ชื่อฮุก (เช่น `session-memory`)

**ตัวอย่าง:**

```bash
openclaw hooks enable session-memory
```

**ผลลัพธ์:**

```
✓ Enabled hook: 💾 session-memory
```

**สิ่งที่คำสั่งนี้ทำ:**

- ตรวจสอบว่าฮุกมีอยู่และพร้อมใช้งาน
- อัปเดต `hooks.internal.entries.<name>.enabled = true` ในการกำหนดค่าของคุณ
- บันทึกการกำหนดค่าลงดิสก์

หากฮุกมาจาก `<workspace>/hooks/` ต้องทำขั้นตอนยินยอมใช้งานนี้ก่อน
Gateway จึงจะโหลดฮุกนั้น

**หลังเปิดใช้งาน:**

- รีสตาร์ท Gateway เพื่อให้ฮุกโหลดใหม่ (รีสตาร์ทแอปในแถบเมนูบน macOS หรือรีสตาร์ทกระบวนการ Gateway ของคุณในโหมดพัฒนา)

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

**ผลลัพธ์:**

```
⏸ Disabled hook: 📝 command-logger
```

**หลังปิดใช้งาน:**

- รีสตาร์ท Gateway เพื่อให้ฮุกโหลดใหม่

## หมายเหตุ

- `openclaw hooks list --json`, `info --json` และ `check --json` เขียน JSON แบบมีโครงสร้างไปยัง stdout โดยตรง
- ฮุกที่จัดการโดย Plugin ไม่สามารถเปิดหรือปิดใช้งานที่นี่ได้ ให้เปิดหรือปิดใช้งาน Plugin เจ้าของแทน

## ติดตั้งแพ็กฮุก

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

ติดตั้งแพ็กฮุกผ่านตัวติดตั้ง plugins แบบรวมศูนย์

`openclaw hooks install` ยังคงใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่จะแสดง
คำเตือนการเลิกใช้งานและส่งต่อไปยัง `openclaw plugins install`

สเปก Npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันที่แน่นอน** หรือ
**dist-tag** ที่ไม่บังคับ) สเปก Git/URL/file และช่วง semver จะถูกปฏิเสธ การติดตั้ง
dependency จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้ว่า
เชลล์ของคุณจะมีการตั้งค่าการติดตั้ง npm แบบโกลบอลก็ตาม

สเปกแบบเปล่าและ `@latest` จะอยู่บนแทร็กเสถียร หาก npm resolve อย่างใดอย่างหนึ่ง
ไปเป็น prerelease OpenClaw จะหยุดและขอให้คุณยินยอมอย่างชัดเจนด้วย
แท็ก prerelease เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease ที่แน่นอน

**สิ่งที่คำสั่งนี้ทำ:**

- คัดลอกแพ็กฮุกไปยัง `~/.openclaw/hooks/<id>`
- เปิดใช้งานฮุกที่ติดตั้งใน `hooks.internal.entries.*`
- บันทึกการติดตั้งไว้ใต้ `hooks.internal.installs`

**ตัวเลือก:**

- `-l, --link`: ลิงก์ไดเรกทอรีในเครื่องแทนการคัดลอก (เพิ่มไปยัง `hooks.internal.load.extraDirs`)
- `--pin`: บันทึกการติดตั้ง npm เป็น `name@version` ที่ resolve แล้วแบบแน่นอนใน `hooks.internal.installs`

**ไฟล์เก็บถาวรที่รองรับ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

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

แพ็กฮุกที่ลิงก์จะถือเป็นฮุกที่จัดการจากไดเรกทอรีที่ผู้ปฏิบัติงานกำหนดค่าไว้
ไม่ใช่ฮุกของเวิร์กสเปซ

## อัปเดตแพ็กฮุก

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

อัปเดตแพ็กฮุกแบบ npm ที่ติดตามไว้ผ่านตัวอัปเดต plugins แบบรวมศูนย์

`openclaw hooks update` ยังคงใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่จะแสดง
คำเตือนการเลิกใช้งานและส่งต่อไปยัง `openclaw plugins update`

**ตัวเลือก:**

- `--all`: อัปเดตแพ็กฮุกที่ติดตามไว้ทั้งหมด
- `--dry-run`: แสดงสิ่งที่จะเปลี่ยนโดยไม่เขียนข้อมูล

เมื่อมีแฮช integrity ที่จัดเก็บไว้และแฮชของ artifact ที่ดึงมาเปลี่ยนไป
OpenClaw จะแสดงคำเตือนและขอการยืนยันก่อนดำเนินการต่อ ใช้
`--yes` แบบโกลบอลเพื่อข้ามพรอมต์ใน CI/การรันแบบไม่โต้ตอบ

## ฮุกที่บันเดิลมา

### session-memory

บันทึกบริบทเซสชันไปยังหน่วยความจำเมื่อคุณสั่ง `/new` หรือ `/reset`

**เปิดใช้งาน:**

```bash
openclaw hooks enable session-memory
```

**ผลลัพธ์:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**ดู:** [เอกสาร session-memory](/th/automation/hooks#session-memory)

### bootstrap-extra-files

ฉีดไฟล์ bootstrap เพิ่มเติม (เช่น `AGENTS.md` / `TOOLS.md` แบบ monorepo-local) ระหว่าง `agent:bootstrap`

**เปิดใช้งาน:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ดู:** [เอกสาร bootstrap-extra-files](/th/automation/hooks#bootstrap-extra-files)

### command-logger

บันทึกอีเวนต์คำสั่งทั้งหมดไปยังไฟล์ audit แบบรวมศูนย์

**เปิดใช้งาน:**

```bash
openclaw hooks enable command-logger
```

**ผลลัพธ์:** `~/.openclaw/logs/commands.log`

**ดูบันทึก:**

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

รัน `BOOT.md` เมื่อ Gateway เริ่มทำงาน (หลังจาก channels เริ่มทำงานแล้ว)

**อีเวนต์**: `gateway:startup`

**เปิดใช้งาน**:

```bash
openclaw hooks enable boot-md
```

**ดู:** [เอกสาร boot-md](/th/automation/hooks#boot-md)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [ฮุกระบบอัตโนมัติ](/th/automation/hooks)
