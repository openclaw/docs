---
read_when:
    - คุณต้องการจัดการ hooks ของ agent
    - คุณต้องการตรวจสอบความพร้อมใช้งานของ hook หรือเปิดใช้ hooks ของ workspace
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw hooks` (agent hooks)
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

จัดการ hooks ของ agent (ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งอย่าง `/new`, `/reset` และการเริ่มต้น Gateway)

การรัน `openclaw hooks` โดยไม่มี subcommand จะเทียบเท่ากับ `openclaw hooks list`

ที่เกี่ยวข้อง:

- Hooks: [Hooks](/th/automation/hooks)
- Plugin hooks: [Plugin hooks](/th/plugins/hooks)

## แสดง Hooks ทั้งหมด

```bash
openclaw hooks list
```

แสดง hooks ที่ค้นพบทั้งหมดจากไดเรกทอรี workspace, managed, extra และ bundled
การเริ่มต้น Gateway จะไม่โหลด internal hook handlers จนกว่าจะมีการกำหนดค่า internal hook อย่างน้อยหนึ่งรายการ

**ตัวเลือก:**

- `--eligible`: แสดงเฉพาะ hooks ที่พร้อมใช้งาน (ผ่านข้อกำหนดแล้ว)
- `--json`: ส่งออกเป็น JSON
- `-v, --verbose`: แสดงข้อมูลโดยละเอียด รวมถึงข้อกำหนดที่ยังขาดอยู่

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

แสดงข้อกำหนดที่ยังขาดอยู่สำหรับ hooks ที่ยังไม่พร้อมใช้งาน

**ตัวอย่าง (JSON):**

```bash
openclaw hooks list --json
```

ส่งคืน JSON แบบมีโครงสร้างสำหรับการใช้งานเชิงโปรแกรม

## ดูข้อมูล Hook

```bash
openclaw hooks info <name>
```

แสดงข้อมูลโดยละเอียดของ hook ที่ระบุ

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

## ตรวจสอบความพร้อมของ Hooks

```bash
openclaw hooks check
```

แสดงสรุปสถานะความพร้อมของ hooks (จำนวนที่พร้อมเทียบกับจำนวนที่ยังไม่พร้อม)

**ตัวเลือก:**

- `--json`: ส่งออกเป็น JSON

**ตัวอย่างเอาต์พุต:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## เปิดใช้ Hook

```bash
openclaw hooks enable <name>
```

เปิดใช้ hook ที่ระบุโดยเพิ่มลงใน config ของคุณ (ค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`)

**หมายเหตุ:** hooks ของ workspace จะถูกปิดไว้เป็นค่าเริ่มต้นจนกว่าจะเปิดใช้ที่นี่หรือใน config hooks ที่จัดการโดย plugins จะแสดง `plugin:<id>` ใน `openclaw hooks list` และไม่สามารถเปิด/ปิดได้ที่นี่ ให้เปิด/ปิด plugin แทน

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

- ตรวจสอบว่า hook มีอยู่และพร้อมใช้งาน
- อัปเดต `hooks.internal.entries.<name>.enabled = true` ใน config ของคุณ
- บันทึก config ลงดิสก์

หาก hook มาจาก `<workspace>/hooks/` จำเป็นต้องมีขั้นตอน opt-in นี้ก่อน
ที่ Gateway จะโหลดมัน

**หลังจากเปิดใช้แล้ว:**

- รีสตาร์ต Gateway เพื่อให้ hooks โหลดใหม่ (รีสตาร์ตแอป menu bar บน macOS หรือรีสตาร์ตกระบวนการ gateway ของคุณในโหมด dev)

## ปิดใช้ Hook

```bash
openclaw hooks disable <name>
```

ปิดใช้ hook ที่ระบุโดยอัปเดต config ของคุณ

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

**หลังจากปิดใช้แล้ว:**

- รีสตาร์ต Gateway เพื่อให้ hooks โหลดใหม่

## หมายเหตุ

- `openclaw hooks list --json`, `info --json` และ `check --json` จะเขียน JSON แบบมีโครงสร้างไปยัง stdout โดยตรง
- hooks ที่จัดการโดย plugin ไม่สามารถเปิดหรือปิดได้ที่นี่; ให้เปิดหรือปิด plugin เจ้าของแทน

## ติดตั้ง Hook Packs

```bash
openclaw plugins install <package>        # ClawHub ก่อน แล้วค่อย npm
openclaw plugins install <package> --pin  # pin เวอร์ชัน
openclaw plugins install <path>           # พาธภายในเครื่อง
```

ติดตั้ง hook packs ผ่านตัวติดตั้ง plugins แบบรวม

`openclaw hooks install` ยังใช้งานได้ในฐานะ compatibility alias แต่จะแสดงคำเตือน deprecation และส่งต่อไปยัง `openclaw plugins install`

สเปกของ npm เป็นแบบ **registry-only** (ชื่อแพ็กเกจ + **เวอร์ชันแบบ exact** หรือ
**dist-tag** แบบไม่บังคับ) ระบบจะปฏิเสธสเปกแบบ Git/URL/file และ semver ranges การติดตั้ง dependency จะรันพร้อม `--ignore-scripts` เพื่อความปลอดภัย

สเปกเปล่าและ `@latest` จะคงอยู่ในสาย stable หาก npm resolve อย่างใดอย่างหนึ่งนั้นเป็น prerelease OpenClaw จะหยุดและขอให้คุณเลือกใช้งานอย่างชัดเจนด้วย prerelease tag เช่น `@beta`/`@rc` หรือเวอร์ชัน prerelease แบบ exact

**สิ่งที่คำสั่งนี้ทำ:**

- คัดลอก hook pack ไปยัง `~/.openclaw/hooks/<id>`
- เปิดใช้ hooks ที่ติดตั้งแล้วใน `hooks.internal.entries.*`
- บันทึกการติดตั้งไว้ใน `hooks.internal.installs`

**ตัวเลือก:**

- `-l, --link`: ลิงก์ไดเรกทอรีภายในเครื่องแทนการคัดลอก (เพิ่มลงใน `hooks.internal.load.extraDirs`)
- `--pin`: บันทึกการติดตั้งจาก npm เป็น `name@version` ที่ resolve แล้วแบบ exact ใน `hooks.internal.installs`

**ไฟล์เก็บถาวรที่รองรับ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**ตัวอย่าง:**

```bash
# ไดเรกทอรีภายในเครื่อง
openclaw plugins install ./my-hook-pack

# ไฟล์เก็บถาวรภายในเครื่อง
openclaw plugins install ./my-hook-pack.zip

# แพ็กเกจ NPM
openclaw plugins install @openclaw/my-hook-pack

# ลิงก์ไดเรกทอรีภายในเครื่องโดยไม่คัดลอก
openclaw plugins install -l ./my-hook-pack
```

hook packs ที่ลิงก์ไว้จะถือเป็น managed hooks จากไดเรกทอรีที่ผู้ดูแลระบบกำหนดค่า
ไม่ใช่ hooks ของ workspace

## อัปเดต Hook Packs

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

อัปเดต hook packs แบบ npm ที่ติดตามอยู่ผ่านตัวอัปเดต plugins แบบรวม

`openclaw hooks update` ยังใช้งานได้ในฐานะ compatibility alias แต่จะแสดงคำเตือน deprecation และส่งต่อไปยัง `openclaw plugins update`

**ตัวเลือก:**

- `--all`: อัปเดต hook packs ที่ติดตามอยู่ทั้งหมด
- `--dry-run`: แสดงสิ่งที่จะเปลี่ยนโดยไม่เขียนข้อมูล

เมื่อมี stored integrity hash อยู่แล้ว และ hash ของ artifact ที่ดึงมาเปลี่ยนไป
OpenClaw จะพิมพ์คำเตือนและขอการยืนยันก่อนดำเนินการต่อ ใช้ `--yes` แบบ global เพื่อข้าม prompt ในการรันแบบ CI/ไม่โต้ตอบ

## Bundled Hooks

### session-memory

บันทึกบริบทของเซสชันลงใน memory เมื่อคุณใช้ `/new` หรือ `/reset`

**เปิดใช้:**

```bash
openclaw hooks enable session-memory
```

**เอาต์พุต:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**ดูเพิ่มเติม:** [เอกสาร session-memory](/th/automation/hooks#session-memory)

### bootstrap-extra-files

แทรกไฟล์ bootstrap เพิ่มเติม (เช่น `AGENTS.md` / `TOOLS.md` ภายใน monorepo) ระหว่าง `agent:bootstrap`

**เปิดใช้:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ดูเพิ่มเติม:** [เอกสาร bootstrap-extra-files](/th/automation/hooks#bootstrap-extra-files)

### command-logger

บันทึก events ของคำสั่งทั้งหมดลงในไฟล์ audit แบบรวมศูนย์

**เปิดใช้:**

```bash
openclaw hooks enable command-logger
```

**เอาต์พุต:** `~/.openclaw/logs/commands.log`

**ดูบันทึก:**

```bash
# คำสั่งล่าสุด
tail -n 20 ~/.openclaw/logs/commands.log

# พิมพ์แบบอ่านง่าย
cat ~/.openclaw/logs/commands.log | jq .

# กรองตาม action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**ดูเพิ่มเติม:** [เอกสาร command-logger](/th/automation/hooks#command-logger)

### boot-md

รัน `BOOT.md` เมื่อ Gateway เริ่มต้น (หลังจาก channels เริ่มแล้ว)

**Events**: `gateway:startup`

**เปิดใช้**:

```bash
openclaw hooks enable boot-md
```

**ดูเพิ่มเติม:** [เอกสาร boot-md](/th/automation/hooks#boot-md)

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Automation hooks](/th/automation/hooks)
