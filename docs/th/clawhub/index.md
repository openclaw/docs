---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การเลือกระหว่างโฟลว์ CLI ของ openclaw และ clawhub
sidebarTitle: ClawHub
summary: ภาพรวม ClawHub แบบสาธารณะสำหรับการค้นพบ การติดตั้ง การเผยแพร่ ความปลอดภัย และ clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T00:57:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub คือรีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw.

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills และติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนกับรีจิสทรี การเผยแพร่ การลบ/กู้คืน และการซิงก์

ไซต์: [clawhub.ai](https://clawhub.ai)

## เริ่มต้นใช้งานอย่างรวดเร็ว

ค้นหาและติดตั้ง Skills ด้วย OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

ค้นหาและติดตั้ง Plugin ด้วย OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ติดตั้ง ClawHub CLI เมื่อคุณต้องการเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรี เช่น
การเผยแพร่ การซิงก์ หรือการลบ/กู้คืน:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## สิ่งที่ ClawHub โฮสต์

| พื้นผิว       | สิ่งที่จัดเก็บ                                                  | คำสั่งทั่วไป                                  |
| ------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Skills        | ชุดข้อความแบบมีเวอร์ชันที่มี `SKILL.md` พร้อมไฟล์สนับสนุน      | `openclaw skills install <slug>`             |
| Plugin แบบโค้ด | แพ็กเกจ Plugin ของ OpenClaw พร้อมเมตาดาต้าความเข้ากันได้        | `openclaw plugins install clawhub:<package>` |
| Plugin แบบบันเดิล | บันเดิล Plugin ที่แพ็กเกจไว้สำหรับการแจกจ่าย OpenClaw          | `clawhub package publish <source>`           |
| Souls         | บันเดิล `SOUL.md` ที่แสดงบน onlycrabs.ai                        | เวิร์กโฟลว์การเผยแพร่ผ่านเว็บและ API        |

ClawHub ติดตามเวอร์ชัน semver แท็ก เช่น `latest` บันทึกการเปลี่ยนแปลง ไฟล์
การดาวน์โหลด ดาว และสรุปการสแกนความปลอดภัย หน้าสาธารณะแสดงสถานะรีจิสทรีปัจจุบัน
เพื่อให้ผู้ใช้ตรวจสอบ Skill หรือ Plugin ก่อนติดตั้งได้

## โฟลว์ OpenClaw แบบเนทีฟ

คำสั่ง OpenClaw แบบเนทีฟจะติดตั้งลงในเวิร์กสเปซ OpenClaw ที่ใช้งานอยู่และบันทึก
เมตาดาต้าต้นทางไว้ เพื่อให้คำสั่งอัปเดตภายหลังยังคงอยู่บน ClawHub ได้

ใช้ `clawhub:<package>` เมื่อการติดตั้ง Plugin ควรถูก resolve ผ่าน ClawHub
สเปก Plugin ที่ปลอดภัยสำหรับ npm แบบไม่ระบุแหล่งที่มาอาจ resolve ผ่าน npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว และ
`npm:<package>` จะยังคงเป็น npm-only เมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนการติดตั้ง archive จะทำงาน เมื่อเวอร์ชันแพ็กเกจเผยแพร่
อาร์ติแฟกต์ ClawPack OpenClaw จะเลือกใช้ `.tgz` แบบ npm-pack ที่อัปโหลดไว้อย่างตรงเวอร์ชัน ตรวจสอบ
ส่วนหัว digest ของ ClawHub และไบต์ที่ดาวน์โหลด แล้วบันทึกเมตาดาต้าอาร์ติแฟกต์สำหรับ
การอัปเดตภายหลัง

## ClawHub CLI

ClawHub CLI มีไว้สำหรับงานที่ยืนยันตัวตนกับรีจิสทรี:

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

CLI ยังมีคำสั่งติดตั้ง/อัปเดต Skill สำหรับเวิร์กโฟลว์รีจิสทรีโดยตรง:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

คำสั่งเหล่านั้นจะติดตั้ง Skills ลงใน `./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบัน
และบันทึกเวอร์ชันที่ติดตั้งไว้ใน `.clawhub/lock.json`

## การเผยแพร่

เผยแพร่ Skills จากโฟลเดอร์ภายในเครื่องที่มี `SKILL.md`:

```bash
clawhub skill publish <path>
```

ตัวเลือกการเผยแพร่ที่ใช้บ่อย:

- `--slug <slug>`: slug ของ Skill
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความบันทึกการเปลี่ยนแปลง
- `--tags <tags>`: แท็กที่คั่นด้วยจุลภาค โดยค่าเริ่มต้นเป็น `latest`

เผยแพร่ Plugin จากโฟลเดอร์ภายในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ GitHub
URL:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผนการเผยแพร่ที่ตรงตามจริงโดยไม่อัปโหลด และใช้ `--json`
สำหรับเอาต์พุตที่เป็นมิตรกับ CI

Plugin แบบโค้ดต้องมีเมตาดาต้าความเข้ากันได้ของ OpenClaw ที่กำหนดใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดูข้อมูลอ้างอิงคำสั่งฉบับเต็มได้ที่ [CLI](/th/clawhub/cli)
และดูเมตาดาต้า Skill ได้ที่ [รูปแบบ Skill](/th/clawhub/skill-format)

## ความปลอดภัยและการดูแล

ClawHub เปิดเป็นค่าเริ่มต้น: ทุกคนสามารถอัปโหลดได้ แต่การเผยแพร่ต้องใช้บัญชี GitHub
ที่มีอายุเพียงพอให้ผ่านด่านการอัปโหลด หน้ารายละเอียดสาธารณะจะสรุปสถานะการสแกน
ล่าสุดก่อนติดตั้งหรือดาวน์โหลด

ClawHub เรียกใช้การตรวจสอบอัตโนมัติกับ Skills และรีลีส Plugin ที่เผยแพร่แล้ว รีลีสที่ถูกพักไว้จากการสแกน
หรือถูกบล็อกอาจหายไปจากแคตตาล็อกสาธารณะและพื้นผิวการติดตั้ง ขณะที่ยังคงมองเห็นได้
สำหรับเจ้าของใน `/dashboard`

ผู้ใช้ที่ลงชื่อเข้าใช้สามารถรายงาน Skills และแพ็กเกจได้ ผู้ดูแลสามารถตรวจสอบรายงาน
ซ่อนหรือกู้คืนเนื้อหา และแบนบัญชีที่ใช้งานในทางที่ผิด ดูรายละเอียดนโยบายและการบังคับใช้ได้ที่
[การใช้งานที่ยอมรับได้](/th/clawhub/acceptable-usage) และ
[ความปลอดภัย + การดูแล](/th/clawhub/security)

## Telemetry และสภาพแวดล้อม

เมื่อคุณเรียกใช้ `clawhub sync` ขณะลงชื่อเข้าใช้ CLI จะส่งสแนปช็อตขั้นต่ำเพื่อให้
ClawHub สามารถคำนวณจำนวนการติดตั้งได้ ปิดใช้งานสิ่งนี้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

การ override สภาพแวดล้อมที่มีประโยชน์:

| ตัวแปร                       | ผลลัพธ์                                           |
| ---------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`               | Override URL ของไซต์ที่ใช้สำหรับการล็อกอินผ่านเบราว์เซอร์ |
| `CLAWHUB_REGISTRY`           | Override URL ของ registry API                     |
| `CLAWHUB_CONFIG_PATH`        | Override ตำแหน่งที่ CLI จัดเก็บสถานะ token/config |
| `CLAWHUB_WORKDIR`            | Override ไดเรกทอรีทำงานเริ่มต้น                  |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งาน telemetry บน `sync`                     |

ดูเอกสารอ้างอิงเชิงลึกเพิ่มเติมได้ที่ [Telemetry](/th/clawhub/telemetry), [HTTP API](/th/clawhub/http-api) และ
[การแก้ไขปัญหา](/th/clawhub/troubleshooting)
