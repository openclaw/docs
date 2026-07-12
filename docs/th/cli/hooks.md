---
read_when:
    - คุณต้องการจัดการฮุกของเอเจนต์
    - คุณต้องการตรวจสอบความพร้อมใช้งานของฮุกหรือเปิดใช้งานฮุกสำหรับพื้นที่ทำงาน
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw hooks` (ฮุกของเอเจนต์)
title: ฮุก
x-i18n:
    generated_at: "2026-07-12T15:54:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

จัดการฮุกของเอเจนต์ (ระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่ง เช่น `/new`, `/reset` และการเริ่มต้น Gateway) การใช้ `openclaw hooks` โดยไม่มีอาร์กิวเมนต์เทียบเท่ากับ `openclaw hooks list`

ที่เกี่ยวข้อง: [ฮุก](/th/automation/hooks) - [ฮุกของ Plugin](/th/plugins/hooks)

## แสดงรายการฮุก

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

แสดงรายการฮุกที่ค้นพบจากไดเรกทอรีเวิร์กสเปซ ไดเรกทอรีที่มีการจัดการ ไดเรกทอรีเพิ่มเติม และไดเรกทอรีที่รวมมาให้

- `--eligible`: แสดงเฉพาะฮุกที่มีคุณสมบัติตามข้อกำหนดครบถ้วน
- `--json`: แสดงผลลัพธ์แบบมีโครงสร้าง
- `-v, --verbose`: เพิ่มคอลัมน์ Missing ซึ่งแสดงข้อกำหนดที่ยังไม่ครบถ้วน

```
ฮุก (พร้อมใช้งาน 4/5)

พร้อมใช้งาน:
  🚀 boot-md ✓ - เรียกใช้ BOOT.md เมื่อ Gateway เริ่มต้น
  📎 bootstrap-extra-files ✓ - แทรกไฟล์บูตสแตรปเพิ่มเติมของเวิร์กสเปซระหว่างการบูตสแตรปเอเจนต์
  📝 command-logger ✓ - บันทึกเหตุการณ์คำสั่งทั้งหมดลงในไฟล์ตรวจสอบแบบรวมศูนย์
  💾 session-memory ✓ - บันทึกบริบทเซสชันลงในหน่วยความจำเมื่อมีการเรียกใช้คำสั่ง /new หรือ /reset
```

## ดูข้อมูลฮุก

```bash
openclaw hooks info <name> [--json]
```

`<name>` คือชื่อฮุกหรือคีย์ฮุก (ตัวอย่างเช่น `session-memory`) แสดงแหล่งที่มา พาธไฟล์/ตัวจัดการ โฮมเพจ เหตุการณ์ และสถานะของข้อกำหนดแต่ละรายการ (ไบนารี สภาพแวดล้อม การกำหนดค่า ระบบปฏิบัติการ)

## ตรวจสอบคุณสมบัติ

```bash
openclaw hooks check [--json]
```

แสดงสรุปจำนวนที่พร้อมใช้งาน/ไม่พร้อมใช้งาน หากมีฮุกที่ไม่พร้อมใช้งาน จะแสดงแต่ละฮุกพร้อมเหตุผลที่ทำให้ไม่สามารถใช้งานได้

## เปิดใช้งานฮุก

```bash
openclaw hooks enable <name>
```

เพิ่ม/อัปเดต `hooks.internal.entries.<name>.enabled = true` ในการกำหนดค่า และเปิดสวิตช์หลัก `hooks.internal.enabled` ด้วย (Gateway จะไม่โหลดตัวจัดการฮุกภายในใด ๆ จนกว่าจะกำหนดค่าอย่างน้อยหนึ่งรายการ) คำสั่งจะล้มเหลวหากไม่มีฮุกดังกล่าว ฮุกอยู่ภายใต้การจัดการของ Plugin หรือฮุกมีคุณสมบัติไม่ครบถ้วน (ขาดข้อกำหนด)

ฮุกที่อยู่ภายใต้การจัดการของ Plugin จะแสดง `plugin:<id>` ใน `hooks list` และไม่สามารถเปิด/ปิดใช้งานได้ที่นี่ ให้เปิดหรือปิดใช้งาน Plugin ที่เป็นเจ้าของแทน

รีสตาร์ต Gateway หลังจากเปิดใช้งาน (รีสตาร์ตแอปแถบเมนู macOS หรือรีสตาร์ตกระบวนการ Gateway ในสภาพแวดล้อมการพัฒนา) เพื่อให้โหลดฮุกใหม่

## ปิดใช้งานฮุก

```bash
openclaw hooks disable <name>
```

ตั้งค่า `hooks.internal.entries.<name>.enabled = false` จากนั้นรีสตาร์ต Gateway

## ติดตั้งและอัปเดตแพ็กฮุก

```bash
openclaw plugins install <package>        # ใช้ npm ตามค่าเริ่มต้น
openclaw plugins install npm:<package>    # ใช้ npm เท่านั้น
openclaw plugins install <package> --pin  # ตรึงเวอร์ชันที่แก้ไขแล้ว
openclaw plugins install <path>           # ไดเรกทอรีหรือไฟล์บีบอัดในเครื่อง
openclaw plugins install -l <path>        # ลิงก์ไดเรกทอรีในเครื่องแทนการคัดลอก

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

แพ็กฮุกติดตั้งผ่านตัวติดตั้ง/ตัวอัปเดต Plugin แบบรวมศูนย์ ส่วน `openclaw hooks install` / `openclaw hooks update` ยังคงใช้งานได้ในฐานะนามแฝงที่เลิกแนะนำแล้ว ซึ่งจะแสดงคำเตือนและส่งต่อไปยังคำสั่ง `plugins`

- ข้อกำหนด Npm รองรับเฉพาะรีจิสทรี: ชื่อแพ็กเกจและเวอร์ชันแบบเจาะจงหรือ dist-tag ที่เป็นตัวเลือก ข้อกำหนด Git/URL/ไฟล์และช่วง semver จะถูกปฏิเสธ การติดตั้งการพึ่งพาจะทำงานภายในโปรเจกต์ด้วย `--ignore-scripts`
- ข้อกำหนดเปล่าและ `@latest` จะอยู่บนช่องทางเสถียร หาก npm แก้ไขไปยังรุ่นก่อนเผยแพร่ OpenClaw จะหยุดและขอให้คุณยินยอมอย่างชัดเจน (`@beta`, `@rc` หรือเวอร์ชันก่อนเผยแพร่แบบเจาะจง)
- ไฟล์บีบอัดที่รองรับ: `.zip`, `.tgz`, `.tar.gz`, `.tar`
- `-l, --link` ลิงก์ไดเรกทอรีในเครื่องแทนการคัดลอก (เพิ่มลงใน `hooks.internal.load.extraDirs`) แพ็กฮุกที่ลิงก์ไว้เป็นฮุกที่มีการจัดการจากไดเรกทอรีที่ผู้ดำเนินการกำหนดค่า ไม่ใช่ฮุกของเวิร์กสเปซ
- `--pin` บันทึกการติดตั้ง npm เป็น `name@version` ของเวอร์ชันที่แก้ไขแล้วแบบเจาะจงใน `hooks.internal.installs`
- การติดตั้งจะคัดลอกแพ็กไปยัง `~/.openclaw/hooks/<id>` เปิดใช้งานฮุกภายใต้ `hooks.internal.entries.*` และบันทึกการติดตั้งภายใต้ `hooks.internal.installs`
- หากแฮชความสมบูรณ์ที่จัดเก็บไว้ไม่ตรงกับอาร์ติแฟกต์ที่ดึงมาอีกต่อไป OpenClaw จะแจ้งเตือนและถามยืนยันก่อนดำเนินการต่อ ให้ส่งแฟล็กส่วนกลาง `--yes` เพื่อข้ามคำถามยืนยัน (ตัวอย่างเช่นใน CI)

## ฮุกที่รวมมาให้

| ฮุก                   | เหตุการณ์                                         | การทำงาน                                                                                               |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| boot-md               | `gateway:startup`                                 | เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มต้นสำหรับขอบเขตเอเจนต์แต่ละรายการที่กำหนดค่าไว้                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | แทรกไฟล์บูตสแตรปเพิ่มเติม (ตัวอย่างเช่น `AGENTS.md`/`TOOLS.md` ของ monorepo) ระหว่างการบูตสแตรปเอเจนต์ |
| command-logger        | `command`                                         | บันทึกเหตุการณ์คำสั่งลงใน `~/.openclaw/logs/commands.log`                                              |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | ส่งข้อความแจ้งเตือนที่มองเห็นได้ในแชตเมื่อ Compaction ของเซสชันเริ่มต้นและเสร็จสิ้น                    |
| session-memory        | `command:new`, `command:reset`                    | บันทึกบริบทเซสชันลงในหน่วยความจำเมื่อใช้ `/new` หรือ `/reset`                                         |

เปิดใช้งานฮุกที่รวมมาให้รายการใดก็ได้ด้วย `openclaw hooks enable <hook-name>` รายละเอียดทั้งหมด คีย์การกำหนดค่า และค่าเริ่มต้น: [ฮุกที่รวมมาให้](/th/automation/hooks#bundled-hooks)

### ไฟล์บันทึกของ command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # คำสั่งล่าสุด
cat ~/.openclaw/logs/commands.log | jq .          # แสดงผลให้อ่านง่าย
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # กรองตามการดำเนินการ
```

## หมายเหตุ

- `hooks list --json`, `info --json` และ `check --json` เขียน JSON แบบมีโครงสร้างไปยัง stdout โดยตรง

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ฮุกระบบอัตโนมัติ](/th/automation/hooks)
