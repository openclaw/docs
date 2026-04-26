---
read_when:
    - คุณต้องการจัดการ hook ของเอเจนต์
    - คุณต้องการตรวจสอบการพร้อมใช้งานของ hook หรือเปิดใช้ workspace hook
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw hooks` (hook ของเอเจนต์)
title: Hook
x-i18n:
    generated_at: "2026-04-26T11:26:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

จัดการ hook ของเอเจนต์ (ระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งอย่าง `/new`, `/reset` และการเริ่มต้น Gateway)

การรัน `openclaw hooks` โดยไม่มี subcommand จะเทียบเท่ากับ `openclaw hooks list`

ที่เกี่ยวข้อง:

- Hook: [Hook](/th/automation/hooks)
- hook ของ Plugin: [hook ของ Plugin](/th/plugins/hooks)

## แสดงรายการ hook ทั้งหมด

```bash
openclaw hooks list
```

แสดง hook ที่ค้นพบทั้งหมดจากไดเรกทอรี workspace, managed, extra และ bundled
การเริ่มต้น Gateway จะไม่โหลดตัวจัดการ hook ภายในจนกว่าจะมีการตั้งค่า internal hook อย่างน้อยหนึ่งรายการ

**ตัวเลือก:**

- `--eligible`: แสดงเฉพาะ hook ที่มีสิทธิ์ใช้งาน (ตรงตามข้อกำหนด)
- `--json`: ส่งออกเป็น JSON
- `-v, --verbose`: แสดงข้อมูลโดยละเอียด รวมถึงข้อกำหนดที่ขาดหายไป

**ตัวอย่างเอาต์พุต:**

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

แสดงข้อกำหนดที่ขาดหายไปสำหรับ hook ที่ไม่มีสิทธิ์ใช้งาน

**ตัวอย่าง (JSON):**

```bash
openclaw hooks list --json
```

ส่งคืน JSON แบบมีโครงสร้างสำหรับการใช้งานเชิงโปรแกรม

## ดูข้อมูล hook

```bash
openclaw hooks info <name>
```

แสดงข้อมูลโดยละเอียดเกี่ยวกับ hook ที่ระบุ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook หรือคีย์ของ hook (เช่น `session-memory`)

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

## ตรวจสอบสิทธิ์ใช้งานของ hook

```bash
openclaw hooks check
```

แสดงสรุปสถานะสิทธิ์ใช้งานของ hook (มีพร้อมใช้กี่รายการ เทียบกับไม่พร้อมใช้กี่รายการ)

**ตัวเลือก:**

- `--json`: ส่งออกเป็น JSON

**ตัวอย่างเอาต์พุต:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## เปิดใช้ hook

```bash
openclaw hooks enable <name>
```

เปิดใช้ hook ที่ระบุโดยเพิ่มเข้าไปในคอนฟิกของคุณ (ค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`)

**หมายเหตุ:** workspace hook จะถูกปิดใช้งานเป็นค่าเริ่มต้นจนกว่าจะเปิดใช้ที่นี่หรือในคอนฟิก hook ที่ถูกจัดการโดย Plugin จะแสดง `plugin:<id>` ใน `openclaw hooks list` และไม่สามารถเปิด/ปิดได้ที่นี่ ให้เปิด/ปิด Plugin นั้นแทน

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook (เช่น `session-memory`)

**ตัวอย่าง:**

```bash
openclaw hooks enable session-memory
```

**เอาต์พุต:**

```
✓ Enabled hook: 💾 session-memory
```

**สิ่งที่คำสั่งนี้ทำ:**

- ตรวจสอบว่า hook มีอยู่และมีสิทธิ์ใช้งาน
- อัปเดต `hooks.internal.entries.<name>.enabled = true` ในคอนฟิกของคุณ
- บันทึกคอนฟิกลงดิสก์

หาก hook มาจาก `<workspace>/hooks/` ขั้นตอนการเลือกเปิดใช้นี้เป็นสิ่งจำเป็นก่อน
ที่ Gateway จะโหลดมัน

**หลังเปิดใช้:**

- รีสตาร์ต gateway เพื่อให้ hook โหลดใหม่ (รีสตาร์ตแอปบน menu bar บน macOS หรือรีสตาร์ตโพรเซส gateway ของคุณในสภาพแวดล้อม dev)

## ปิดใช้ hook

```bash
openclaw hooks disable <name>
```

ปิดใช้ hook ที่ระบุโดยอัปเดตคอนฟิกของคุณ

**อาร์กิวเมนต์:**

- `<name>`: ชื่อ hook (เช่น `command-logger`)

**ตัวอย่าง:**

```bash
openclaw hooks disable command-logger
```

**เอาต์พุต:**

```
⏸ Disabled hook: 📝 command-logger
```

**หลังปิดใช้:**

- รีสตาร์ต gateway เพื่อให้ hook โหลดใหม่

## หมายเหตุ

- `openclaw hooks list --json`, `info --json` และ `check --json` จะเขียน JSON แบบมีโครงสร้างไปยัง stdout โดยตรง
- hook ที่จัดการโดย Plugin ไม่สามารถเปิดหรือปิดได้ที่นี่; ให้เปิดหรือปิด Plugin เจ้าของแทน

## ติดตั้งชุด hook

```bash
openclaw plugins install <package>        # ClawHub ก่อน แล้วจึง npm
openclaw plugins install <package> --pin  # ปักหมุดเวอร์ชัน
openclaw plugins install <path>           # path ในเครื่อง
```

ติดตั้งชุด hook ผ่านตัวติดตั้ง plugins แบบรวมศูนย์

`openclaw hooks install` ยังใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่จะพิมพ์คำเตือนว่าเลิกใช้แล้ว และส่งต่อไปยัง `openclaw plugins install`

สเปก npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบตรงตัว** หรือ
**dist-tag** แบบเลือกได้) ระบบจะปฏิเสธสเปกแบบ Git/URL/file และช่วง semver การติดตั้ง dependency
จะรันแบบ project-local พร้อม `--ignore-scripts` เพื่อความปลอดภัย แม้เชลล์ของคุณจะมีการตั้งค่า npm install แบบ global ก็ตาม

สเปกแบบเปล่าและ `@latest` จะอยู่ในสาย stable หาก npm resolve อย่างใดอย่างหนึ่ง
ไปยัง prerelease, OpenClaw จะหยุดและขอให้คุณเลือกใช้อย่างชัดเจนด้วย
prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบตรงตัว

**สิ่งที่คำสั่งนี้ทำ:**

- คัดลอกชุด hook ไปยัง `~/.openclaw/hooks/<id>`
- เปิดใช้ hook ที่ติดตั้งแล้วใน `hooks.internal.entries.*`
- บันทึกการติดตั้งไว้ภายใต้ `hooks.internal.installs`

**ตัวเลือก:**

- `-l, --link`: ลิงก์ไดเรกทอรีในเครื่องแทนการคัดลอก (เพิ่มลงใน `hooks.internal.load.extraDirs`)
- `--pin`: บันทึกการติดตั้ง npm เป็น `name@version` ที่ resolve แล้วแบบตรงตัวใน `hooks.internal.installs`

**ไฟล์ archive ที่รองรับ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**ตัวอย่าง:**

```bash
# ไดเรกทอรีในเครื่อง
openclaw plugins install ./my-hook-pack

# archive ในเครื่อง
openclaw plugins install ./my-hook-pack.zip

# แพ็กเกจ NPM
openclaw plugins install @openclaw/my-hook-pack

# ลิงก์ไดเรกทอรีในเครื่องโดยไม่คัดลอก
openclaw plugins install -l ./my-hook-pack
```

ชุด hook ที่ลิงก์ไว้จะถือเป็น hook แบบ managed จาก
ไดเรกทอรีที่ผู้ดูแลกำหนดค่า ไม่ใช่ workspace hook

## อัปเดตชุด hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

อัปเดตชุด hook แบบใช้ npm ที่ติดตามไว้ผ่านตัวอัปเดต plugins แบบรวมศูนย์

`openclaw hooks update` ยังใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่จะพิมพ์คำเตือนว่าเลิกใช้แล้ว และส่งต่อไปยัง `openclaw plugins update`

**ตัวเลือก:**

- `--all`: อัปเดตชุด hook ที่ติดตามไว้ทั้งหมด
- `--dry-run`: แสดงสิ่งที่จะเปลี่ยนโดยไม่เขียนข้อมูลจริง

เมื่อมีการเก็บ integrity hash ไว้ และ hash ของ artifact ที่ดึงมาเปลี่ยนไป
OpenClaw จะพิมพ์คำเตือนและขอการยืนยันก่อนดำเนินการต่อ ใช้ global `--yes` เพื่อข้ามพรอมป์ในรันแบบ CI/ไม่โต้ตอบ

## hook ที่มาพร้อมในชุด

### session-memory

บันทึกบริบทเซสชันลงในหน่วยความจำเมื่อคุณใช้ `/new` หรือ `/reset`

**เปิดใช้:**

```bash
openclaw hooks enable session-memory
```

**เอาต์พุต:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**ดูเพิ่มเติม:** [เอกสาร session-memory](/th/automation/hooks#session-memory)

### bootstrap-extra-files

inject ไฟล์ bootstrap เพิ่มเติม (เช่น `AGENTS.md` / `TOOLS.md` ภายใน monorepo) ระหว่าง `agent:bootstrap`

**เปิดใช้:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ดูเพิ่มเติม:** [เอกสาร bootstrap-extra-files](/th/automation/hooks#bootstrap-extra-files)

### command-logger

บันทึกเหตุการณ์คำสั่งทั้งหมดลงในไฟล์ audit ส่วนกลาง

**เปิดใช้:**

```bash
openclaw hooks enable command-logger
```

**เอาต์พุต:** `~/.openclaw/logs/commands.log`

**ดู log:**

```bash
# คำสั่งล่าสุด
tail -n 20 ~/.openclaw/logs/commands.log

# แสดงผลแบบอ่านง่าย
cat ~/.openclaw/logs/commands.log | jq .

# กรองตาม action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**ดูเพิ่มเติม:** [เอกสาร command-logger](/th/automation/hooks#command-logger)

### boot-md

รัน `BOOT.md` เมื่อ gateway เริ่มต้น (หลังจาก channel เริ่มต้นแล้ว)

**เหตุการณ์**: `gateway:startup`

**เปิดใช้**:

```bash
openclaw hooks enable boot-md
```

**ดูเพิ่มเติม:** [เอกสาร boot-md](/th/automation/hooks#boot-md)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [automation hook](/th/automation/hooks)
