---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา การติดตั้ง หรือการอัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การเลือกระหว่างโฟลว์ CLI ของ openclaw และ clawhub
sidebarTitle: ClawHub
summary: ภาพรวม ClawHub สาธารณะสำหรับการค้นพบ การติดตั้ง การเผยแพร่ ความปลอดภัย และ clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-05-13T04:18:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub คือรีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills รวมถึงติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนกับรีจิสทรี การเผยแพร่ การลบ/ยกเลิกการลบ และการซิงก์

ไซต์: [clawhub.ai](https://clawhub.ai)

## เริ่มต้นอย่างรวดเร็ว

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

ติดตั้ง ClawHub CLI เมื่อต้องการเวิร์กโฟลว์ที่ผ่านการยืนยันตัวตนกับรีจิสทรี เช่น
การเผยแพร่ การซิงก์ หรือการลบ/ยกเลิกการลบ:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## สิ่งที่ ClawHub โฮสต์

| พื้นผิว        | สิ่งที่จัดเก็บ                                               | คำสั่งทั่วไป                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | ชุดข้อความแบบมีเวอร์ชันพร้อม `SKILL.md` และไฟล์สนับสนุน | `openclaw skills install <slug>`             |
| Code plugins   | แพ็กเกจ Plugin ของ OpenClaw พร้อมเมทาดาต้าความเข้ากันได้         | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | ชุด Plugin ที่แพ็กเกจแล้วสำหรับการแจกจ่าย OpenClaw            | `clawhub package publish <source>`           |
| Souls          | ชุด `SOUL.md` ที่แสดงบน onlycrabs.ai                      | โฟลว์การเผยแพร่ผ่านเว็บและ API                    |

ClawHub ติดตามเวอร์ชัน semver แท็ก เช่น `latest` บันทึกการเปลี่ยนแปลง ไฟล์
ยอดดาวน์โหลด ดาว และสรุปการสแกนความปลอดภัย หน้าสาธารณะแสดงสถานะรีจิสทรีปัจจุบัน
เพื่อให้ผู้ใช้ตรวจสอบ Skill หรือ Plugin ก่อนติดตั้งได้

## โฟลว์แบบเนทีฟของ OpenClaw

คำสั่ง OpenClaw แบบเนทีฟจะติดตั้งลงในเวิร์กสเปซ OpenClaw ที่ใช้งานอยู่ และคง
เมทาดาต้าแหล่งที่มาไว้ เพื่อให้คำสั่งอัปเดตภายหลังยังคงอยู่บน ClawHub ได้

ใช้ `clawhub:<package>` เมื่อต้องการให้การติดตั้ง Plugin resolve ผ่าน ClawHub
สเปก Plugin แบบ bare ที่ปลอดภัยสำหรับ npm อาจ resolve ผ่าน npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว และ
`npm:<package>` จะยังคงเป็น npm เท่านั้นเมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนเรียกใช้การติดตั้งจากอาร์ไคฟ์ เมื่อเวอร์ชันแพ็กเกจเผยแพร่อาร์ติแฟกต์
ClawPack OpenClaw จะเลือก npm-pack `.tgz` ที่อัปโหลดไว้ตรงเวอร์ชัน ตรวจสอบ
เฮดเดอร์ digest ของ ClawHub และไบต์ที่ดาวน์โหลด และบันทึกเมทาดาต้าอาร์ติแฟกต์สำหรับ
การอัปเดตภายหลัง

## ClawHub CLI

ClawHub CLI ใช้สำหรับงานที่ผ่านการยืนยันตัวตนกับรีจิสทรี:

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

เผยแพร่ Skills จากโฟลเดอร์ในเครื่องที่มี `SKILL.md`:

```bash
clawhub skill publish <path>
```

ตัวเลือกการเผยแพร่ที่ใช้บ่อย:

- `--slug <slug>`: slug ของ Skill
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความบันทึกการเปลี่ยนแปลง
- `--tags <tags>`: แท็กที่คั่นด้วยจุลภาค โดยค่าเริ่มต้นเป็น `latest`

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ URL
ของ GitHub:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผนการเผยแพร่ที่ตรงจริงโดยไม่อัปโหลด และใช้ `--json`
สำหรับเอาต์พุตที่เหมาะกับ CI

Code plugins ต้องมีเมทาดาต้าความเข้ากันได้ของ OpenClaw ที่จำเป็นใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดู [CLI](/th/clawhub/cli) สำหรับเอกสารอ้างอิงคำสั่ง
ฉบับเต็ม และ [รูปแบบ Skill](/th/clawhub/skill-format) สำหรับเมทาดาต้าของ Skill

## ความปลอดภัยและการกลั่นกรอง

ClawHub เปิดเป็นค่าเริ่มต้น: ทุกคนสามารถอัปโหลดได้ แต่การเผยแพร่ต้องใช้บัญชี GitHub
ที่มีอายุเก่าเพียงพอให้ผ่านเกตการอัปโหลด หน้ารายละเอียดสาธารณะจะสรุปสถานะ
การสแกนล่าสุดก่อนติดตั้งหรือดาวน์โหลด

ClawHub เรียกใช้การตรวจสอบอัตโนมัติกับ Skills และรีลีส Plugin ที่เผยแพร่แล้ว รีลีสที่ถูกระงับ
จากการสแกนหรือถูกบล็อกอาจหายไปจากแค็ตตาล็อกสาธารณะและพื้นผิวการติดตั้ง ในขณะที่
ยังคงมองเห็นได้สำหรับเจ้าของใน `/dashboard`

ผู้ใช้ที่ลงชื่อเข้าใช้สามารถรายงาน Skills และแพ็กเกจได้ ผู้กลั่นกรองสามารถตรวจสอบรายงาน
ซ่อนหรือกู้คืนเนื้อหา และแบนบัญชีที่ละเมิดได้ ดู
[การใช้งานที่ยอมรับได้](/th/clawhub/acceptable-usage) และ
[ความปลอดภัย + การกลั่นกรอง](/th/clawhub/security) สำหรับรายละเอียดนโยบายและการบังคับใช้

## เทเลเมทรีและสภาพแวดล้อม

เมื่อคุณเรียกใช้ `clawhub sync` ขณะเข้าสู่ระบบ CLI จะส่งสแนปช็อตขั้นต่ำเพื่อให้
ClawHub คำนวณจำนวนการติดตั้งได้ ปิดใช้งานสิ่งนี้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

การ override สภาพแวดล้อมที่มีประโยชน์:

| ตัวแปร                      | ผล                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL ของไซต์ที่ใช้สำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์     |
| `CLAWHUB_REGISTRY`            | Override URL ของ API รีจิสทรี                    |
| `CLAWHUB_CONFIG_PATH`         | Override ตำแหน่งที่ CLI จัดเก็บสถานะ token/config |
| `CLAWHUB_WORKDIR`             | Override ไดเรกทอรีทำงานเริ่มต้น           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งานเทเลเมทรีใน `sync`                      |

ดู [เทเลเมทรี](/th/clawhub/telemetry), [HTTP API](/th/clawhub/http-api) และ
[การแก้ไขปัญหา](/th/clawhub/troubleshooting) สำหรับเอกสารอ้างอิงเชิงลึกเพิ่มเติม
