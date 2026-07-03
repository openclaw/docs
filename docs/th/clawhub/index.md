---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยัง registry
    - การเลือกระหว่างโฟลว์ CLI ของ openclaw และ clawhub
sidebarTitle: ClawHub
summary: ภาพรวม ClawHub สาธารณะสำหรับการค้นพบ การติดตั้ง การเผยแพร่ ความปลอดภัย และ clawhub CLI
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T01:05:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub คือ registry สาธารณะสำหรับ Skills และ plugins ของ OpenClaw

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต skills และเพื่อติดตั้ง plugins จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนกับ registry การเผยแพร่ และการลบ/กู้คืนรายการที่ลบ

ไซต์: [clawhub.ai](https://clawhub.ai)

## เริ่มต้นอย่างรวดเร็ว

ค้นหาและติดตั้ง skills ด้วย OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

ค้นหาและติดตั้ง plugins ด้วย OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

ติดตั้ง ClawHub CLI เมื่อต้องการเวิร์กโฟลว์ที่ยืนยันตัวตนกับ registry เช่น
การเผยแพร่ หรือการลบ/กู้คืนรายการที่ลบ:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## สิ่งที่ ClawHub โฮสต์

| พื้นผิว        | สิ่งที่จัดเก็บ                                               | คำสั่งทั่วไป                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | ชุดข้อความแบบมีเวอร์ชันพร้อม `SKILL.md` และไฟล์สนับสนุน | `openclaw skills install @openclaw/demo`     |
| Code plugins   | แพ็กเกจ plugin ของ OpenClaw พร้อมข้อมูลเมตาความเข้ากันได้         | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | ชุด plugin ที่แพ็กเกจไว้สำหรับการแจกจ่าย OpenClaw            | `clawhub package publish <source>`           |

ClawHub ติดตามเวอร์ชัน semver แท็ก เช่น `latest` changelog ไฟล์
การดาวน์โหลด ดาว และสรุปการสแกนความปลอดภัย หน้าเว็บสาธารณะแสดงสถานะ registry
ปัจจุบันเพื่อให้ผู้ใช้ตรวจสอบ skill หรือ plugin ก่อนติดตั้งได้

## โฟลว์ OpenClaw แบบเนทีฟ

คำสั่ง OpenClaw แบบเนทีฟจะติดตั้งลงในพื้นที่ทำงาน OpenClaw ที่ใช้งานอยู่และบันทึก
ข้อมูลเมตาของแหล่งที่มาไว้ เพื่อให้คำสั่งอัปเดตในภายหลังยังคงใช้ ClawHub ได้

ใช้ `clawhub:<package>` เมื่อการติดตั้ง plugin ควรถูก resolve ผ่าน ClawHub
สเปก plugin แบบ bare ที่ปลอดภัยสำหรับ npm อาจ resolve ผ่าน npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว และ
`npm:<package>` จะยังคงเป็น npm-only เมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนการติดตั้ง archive จะทำงาน เมื่อเวอร์ชันแพ็กเกจเผยแพร่ artifact
ClawPack OpenClaw จะเลือกใช้ npm-pack `.tgz` ที่อัปโหลดตรงกันทุกประการ ตรวจสอบ
ส่วนหัว digest ของ ClawHub และไบต์ที่ดาวน์โหลด และบันทึกข้อมูลเมตา artifact สำหรับ
การอัปเดตในภายหลัง

## ClawHub CLI

ClawHub CLI ใช้สำหรับงานที่ต้องยืนยันตัวตนกับ registry:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI ยังมีคำสั่งติดตั้ง/อัปเดต skill สำหรับเวิร์กโฟลว์ registry โดยตรง:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

คำสั่งเหล่านั้นจะติดตั้ง skills ลงใน `./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบัน
และบันทึกเวอร์ชันที่ติดตั้งไว้ใน `.clawhub/lock.json`

## การเผยแพร่

เผยแพร่ skills จากโฟลเดอร์ในเครื่องที่มี `SKILL.md`:

```bash
clawhub skill publish <path>
```

ตัวเลือกการเผยแพร่ที่ใช้บ่อย:

- `--slug <slug>`: ชื่อ URL ของ skill ที่เผยแพร่
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความ changelog
- `--tags <tags>`: แท็กคั่นด้วยจุลภาค โดยค่าเริ่มต้นคือ `latest`

เผยแพร่ plugins จากโฟลเดอร์ในเครื่อง `owner/repo` `owner/repo@ref` หรือ URL
GitHub:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผนการเผยแพร่ที่แน่นอนโดยไม่อัปโหลด และใช้ `--json`
สำหรับเอาต์พุตที่เหมาะกับ CI

Code plugins ต้องมีข้อมูลเมตาความเข้ากันได้ของ OpenClaw ที่จำเป็นใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดู [CLI](/th/clawhub/cli) สำหรับเอกสารอ้างอิงคำสั่ง
ฉบับเต็ม และ [รูปแบบ Skill](/clawhub/skill-format) สำหรับข้อมูลเมตา skill

## ความปลอดภัยและการควบคุมดูแล

ClawHub เปิดเป็นค่าเริ่มต้น: ทุกคนอัปโหลดได้ แต่การเผยแพร่ต้องใช้บัญชี GitHub
ที่มีอายุมากพอจะผ่านด่านการอัปโหลด หน้ารายละเอียดสาธารณะสรุปสถานะการสแกน
ล่าสุดก่อนการติดตั้งหรือดาวน์โหลด

ClawHub เรียกใช้การตรวจสอบอัตโนมัติกับ skills ที่เผยแพร่และรุ่นของ plugin
รุ่นที่ถูกระงับโดยการสแกนหรือถูกบล็อกอาจหายไปจากแคตตาล็อกสาธารณะและพื้นผิวการติดตั้ง
ขณะที่ยังคงมองเห็นได้สำหรับเจ้าของใน `/dashboard`

ผู้ใช้ที่ลงชื่อเข้าใช้สามารถรายงาน skills และแพ็กเกจได้ ผู้ดูแลสามารถตรวจสอบรายงาน
ซ่อนหรือกู้คืนเนื้อหา และแบนบัญชีที่ใช้งานในทางที่ผิด ดู
[ความปลอดภัย](/th/clawhub/security),
[การตรวจสอบความปลอดภัย](/clawhub/security-audits),
[การควบคุมดูแลและความปลอดภัยของบัญชี](/clawhub/moderation), และ
[การใช้งานที่ยอมรับได้](/th/clawhub/acceptable-usage) สำหรับรายละเอียดนโยบายและการบังคับใช้

## Telemetry และสภาพแวดล้อม

เมื่อคุณเรียกใช้ `clawhub install` ขณะลงชื่อเข้าใช้ CLI อาจส่งเหตุการณ์การติดตั้ง
แบบ best-effort เพื่อให้ ClawHub คำนวณจำนวนการติดตั้งรวมได้ ปิดใช้งานได้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

การ override สภาพแวดล้อมที่มีประโยชน์:

| ตัวแปร                      | ผล                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL ไซต์ที่ใช้สำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์     |
| `CLAWHUB_REGISTRY`            | Override URL API ของ registry                    |
| `CLAWHUB_CONFIG_PATH`         | Override ตำแหน่งที่ CLI จัดเก็บสถานะ token/config |
| `CLAWHUB_WORKDIR`             | Override ไดเรกทอรีทำงานเริ่มต้น           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งาน telemetry การติดตั้ง                        |

ดู [Telemetry](/clawhub/telemetry), [HTTP API](/clawhub/http-api), และ
[การแก้ไขปัญหา](/th/clawhub/troubleshooting) สำหรับเอกสารอ้างอิงเชิงลึกเพิ่มเติม
