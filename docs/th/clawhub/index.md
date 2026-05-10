---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา การติดตั้ง หรือการอัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugins ไปยังรีจิสทรี
    - การเลือกระหว่างโฟลว์ CLI ของ openclaw และ clawhub
sidebarTitle: ClawHub
summary: ภาพรวมสาธารณะของ ClawHub สำหรับการค้นพบ การติดตั้ง การเผยแพร่ ความปลอดภัย และ CLI ของ clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:26:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub คือ registry สาธารณะสำหรับ OpenClaw Skills และ plugins

- ใช้คำสั่ง `openclaw` แบบ native เพื่อค้นหา ติดตั้ง และอัปเดต skills รวมถึงติดตั้ง plugins จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับ workflows ด้านการยืนยันตัวตนกับ registry, publishing, delete/undelete, rescans และ sync

ไซต์: [clawhub.ai](https://clawhub.ai)

## เริ่มต้นอย่างรวดเร็ว

ค้นหาและติดตั้ง skills ด้วย OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

ค้นหาและติดตั้ง plugins ด้วย OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ติดตั้ง ClawHub CLI เมื่อต้องการ workflows ที่ยืนยันตัวตนกับ registry เช่น
publish, sync, delete/undelete หรือ rescans ที่ owner ร้องขอ:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## สิ่งที่ ClawHub โฮสต์

| Surface        | สิ่งที่จัดเก็บ                                               | คำสั่งทั่วไป                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | ชุดข้อความแบบมีเวอร์ชันที่มี `SKILL.md` พร้อมไฟล์สนับสนุน | `openclaw skills install <slug>`             |
| Code plugins   | แพ็กเกจ OpenClaw plugin พร้อม metadata ความเข้ากันได้         | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | ชุด plugin ที่แพ็กไว้สำหรับการกระจาย OpenClaw            | `clawhub package publish <source>`           |
| Souls          | ชุด `SOUL.md` ที่แสดงบน onlycrabs.ai                      | flows การ publish ผ่าน Web และ API                    |

ClawHub ติดตามเวอร์ชัน semver, tags เช่น `latest`, changelogs, ไฟล์,
downloads, stars และสรุปการสแกนความปลอดภัย หน้าสาธารณะแสดงสถานะ registry
ปัจจุบันเพื่อให้ผู้ใช้ตรวจสอบ skill หรือ plugin ก่อนติดตั้งได้

## Flows แบบ native ของ OpenClaw

คำสั่ง OpenClaw แบบ native จะติดตั้งลงใน workspace ของ OpenClaw ที่ใช้งานอยู่ และคง
metadata ของแหล่งที่มาไว้เพื่อให้คำสั่งอัปเดตภายหลังยังคงอยู่บน ClawHub ได้

ใช้ `clawhub:<package>` เมื่อการติดตั้ง plugin ควรถูก resolve ผ่าน ClawHub
สเปก plugin แบบ bare ที่ปลอดภัยสำหรับ npm อาจ resolve ผ่าน npm ระหว่างช่วงเปลี่ยนผ่านตอน launch และ
`npm:<package>` จะยังคงเป็น npm-only เมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนเริ่มติดตั้ง archive เมื่อเวอร์ชันแพ็กเกจ publish artifact
ClawPack แล้ว OpenClaw จะเลือก npm-pack `.tgz` ที่อัปโหลดไว้แบบตรงตัว ตรวจสอบ
header digest ของ ClawHub และ bytes ที่ดาวน์โหลดมา และบันทึก metadata ของ artifact สำหรับ
การอัปเดตภายหลัง

## ClawHub CLI

ClawHub CLI ใช้สำหรับงานที่ยืนยันตัวตนกับ registry:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

CLI ยังมีคำสั่งติดตั้ง/อัปเดต skill สำหรับ workflows ที่ทำงานกับ registry โดยตรง:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

คำสั่งเหล่านั้นติดตั้ง skills ลงใน `./skills` ภายใต้ไดเรกทอรีการทำงานปัจจุบัน
และบันทึกเวอร์ชันที่ติดตั้งไว้ใน `.clawhub/lock.json`

## การเผยแพร่

เผยแพร่ skills จากโฟลเดอร์ภายในเครื่องที่มี `SKILL.md`:

```bash
clawhub skill publish <path>
```

ตัวเลือก publish ที่ใช้บ่อย:

- `--slug <slug>`: slug ของ skill
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความ changelog
- `--tags <tags>`: tags คั่นด้วยจุลภาค โดยค่าเริ่มต้นเป็น `latest`

เผยแพร่ plugins จากโฟลเดอร์ภายในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ GitHub
URL:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผน publish ที่ตรงจริงโดยไม่อัปโหลด และใช้ `--json`
สำหรับผลลัพธ์ที่เป็นมิตรกับ CI

Code plugins ต้องมี metadata ความเข้ากันได้ของ OpenClaw ที่จำเป็นใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดู [CLI](/th/clawhub/cli) สำหรับข้อมูลอ้างอิงคำสั่ง
ฉบับเต็ม และ [รูปแบบ Skill](/th/clawhub/skill-format) สำหรับ metadata ของ skill

## ความปลอดภัยและการดูแล

ClawHub เปิดเป็นค่าเริ่มต้น: ใครก็อัปโหลดได้ แต่การ publish ต้องใช้บัญชี GitHub
ที่มีอายุเพียงพอให้ผ่าน upload gate หน้ารายละเอียดสาธารณะจะสรุปสถานะการสแกน
ล่าสุดก่อนติดตั้งหรือดาวน์โหลด

ClawHub รันการตรวจสอบอัตโนมัติบน skills ที่ publish และ releases ของ plugin
releases ที่ถูก hold จากการสแกนหรือถูกบล็อกอาจหายไปจากแค็ตตาล็อกสาธารณะและพื้นที่ติดตั้ง
แต่ยังคงมองเห็นได้สำหรับ owner ใน `/dashboard`

Owners สามารถขอ rescans แบบจำกัดเพื่อกู้คืนจาก false positive ได้ Platform
moderators และ admins สามารถขอ rescans สำหรับ skill หรือ package ใดก็ได้เมื่อจัดการ
รายงาน support:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

ผู้ใช้ที่ลงชื่อเข้าใช้สามารถรายงาน skills และ packages ได้ Moderators สามารถตรวจสอบ reports,
ซ่อนหรือกู้คืนเนื้อหา, resolve appeals และแบนบัญชีที่ใช้งานในทางที่ผิด ดู
[การใช้งานที่ยอมรับได้](/th/clawhub/acceptable-usage) และ
[ความปลอดภัย + การดูแล](/th/clawhub/security) สำหรับรายละเอียดนโยบายและการบังคับใช้

## Telemetry และ environment

เมื่อคุณรัน `clawhub sync` ขณะเข้าสู่ระบบ CLI จะส่ง snapshot ขั้นต่ำเพื่อให้
ClawHub คำนวณจำนวนการติดตั้งได้ ปิดใช้งานสิ่งนี้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

environment overrides ที่มีประโยชน์:

| Variable                      | ผลลัพธ์                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL ของไซต์ที่ใช้สำหรับ browser login     |
| `CLAWHUB_REGISTRY`            | Override URL ของ registry API                    |
| `CLAWHUB_CONFIG_PATH`         | Override ตำแหน่งที่ CLI เก็บ token/config state |
| `CLAWHUB_WORKDIR`             | Override ไดเรกทอรีการทำงานเริ่มต้น           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งาน telemetry บน `sync`                      |

ดู [Telemetry](/th/clawhub/telemetry), [HTTP API](/th/clawhub/http-api) และ
[การแก้ไขปัญหา](/th/clawhub/troubleshooting) สำหรับข้อมูลอ้างอิงเชิงลึกเพิ่มเติม
