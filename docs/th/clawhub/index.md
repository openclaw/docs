---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การเลือกระหว่างโฟลว์ CLI ของ openclaw และ clawhub
sidebarTitle: ClawHub
summary: ภาพรวมสาธารณะของ ClawHub สำหรับการค้นพบ การติดตั้ง การเผยแพร่ ความปลอดภัย และ CLI ของ clawhub
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T00:11:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub คือรีจิสทรีสาธารณะสำหรับ Skills และ plugins ของ OpenClaw

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills และติดตั้ง plugins จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนกับรีจิสทรี การเผยแพร่ และการลบ/ยกเลิกการลบ

ไซต์: [clawhub.ai](https://clawhub.ai)

## เริ่มต้นอย่างรวดเร็ว

ค้นหาและติดตั้ง Skills ด้วย OpenClaw:

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

ติดตั้ง ClawHub CLI เมื่อต้องการเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรี เช่น
การเผยแพร่หรือการลบ/ยกเลิกการลบ:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## สิ่งที่ ClawHub โฮสต์

| พื้นผิว        | สิ่งที่จัดเก็บ                                               | คำสั่งทั่วไป                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | บันเดิลข้อความแบบมีเวอร์ชันพร้อม `SKILL.md` และไฟล์สนับสนุน | `openclaw skills install @openclaw/demo`     |
| Code plugins   | แพ็กเกจ Plugin ของ OpenClaw พร้อมเมทาดาทาความเข้ากันได้         | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | บันเดิล Plugin ที่แพ็กเกจไว้สำหรับการแจกจ่าย OpenClaw            | `clawhub package publish <source>`           |

ClawHub ติดตามเวอร์ชัน semver, แท็ก เช่น `latest`, บันทึกการเปลี่ยนแปลง, ไฟล์,
การดาวน์โหลด, ดาว และสรุปการสแกนความปลอดภัย หน้าเว็บสาธารณะแสดงสถานะรีจิสทรี
ปัจจุบันเพื่อให้ผู้ใช้ตรวจสอบ Skill หรือ Plugin ก่อนติดตั้งได้

## โฟลว์ OpenClaw แบบเนทีฟ

คำสั่ง OpenClaw แบบเนทีฟจะติดตั้งลงในเวิร์กสเปซ OpenClaw ที่ใช้งานอยู่ และคง
เมทาดาทาแหล่งที่มาไว้ เพื่อให้คำสั่งอัปเดตในภายหลังยังคงอยู่บน ClawHub ได้

ใช้ `clawhub:<package>` เมื่อการติดตั้ง Plugin ควรถูก resolve ผ่าน ClawHub
สเปก Plugin แบบ npm-safe ที่ไม่มีคำนำหน้าอาจ resolve ผ่าน npm ในช่วงเปลี่ยนผ่านการเปิดตัว และ
`npm:<package>` จะคงเป็น npm-only เมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ ก่อนที่การติดตั้ง archive จะทำงาน เมื่อเวอร์ชันของแพ็กเกจเผยแพร่
อาร์ติแฟกต์ ClawPack OpenClaw จะเลือก `.tgz` แบบ npm-pack ที่อัปโหลดไว้อย่างตรงเวอร์ชัน ตรวจสอบ
เฮดเดอร์ digest ของ ClawHub และไบต์ที่ดาวน์โหลด แล้วบันทึกเมทาดาทาอาร์ติแฟกต์สำหรับ
การอัปเดตในภายหลัง

## ClawHub CLI

ClawHub CLI ใช้สำหรับงานที่ยืนยันตัวตนกับรีจิสทรี:

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

CLI ยังมีคำสั่งติดตั้ง/อัปเดต Skill สำหรับเวิร์กโฟลว์รีจิสทรีโดยตรง:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

ตัวเลือกการเผยแพร่ทั่วไป:

- `--slug <slug>`: ชื่อ URL ของ Skill ที่เผยแพร่
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความบันทึกการเปลี่ยนแปลง
- `--tags <tags>`: แท็กที่คั่นด้วยจุลภาค โดยค่าเริ่มต้นคือ `latest`

เผยแพร่ plugins จากโฟลเดอร์ภายในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ GitHub
URL:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผนการเผยแพร่ที่ตรงทั้งหมดโดยไม่อัปโหลด และใช้ `--json`
สำหรับเอาต์พุตที่เป็นมิตรกับ CI

Code plugins ต้องมีเมทาดาทาความเข้ากันได้ของ OpenClaw ที่จำเป็นใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดู [CLI](/th/clawhub/cli) สำหรับเอกสารอ้างอิงคำสั่ง
ฉบับเต็ม และ [รูปแบบ Skill](/th/clawhub/skill-format) สำหรับเมทาดาทา Skill

## ความปลอดภัยและการกลั่นกรอง

ClawHub เปิดเป็นค่าเริ่มต้น: ทุกคนสามารถอัปโหลดได้ แต่การเผยแพร่ต้องใช้บัญชี GitHub
ที่เก่าพอจะผ่านเกตการอัปโหลด หน้ารายละเอียดสาธารณะจะสรุปสถานะการสแกน
ล่าสุดก่อนติดตั้งหรือดาวน์โหลด

ClawHub รันการตรวจสอบอัตโนมัติกับ Skills และรุ่น Plugin ที่เผยแพร่แล้ว รุ่นที่ถูกระงับโดยการสแกน
หรือถูกบล็อกอาจหายไปจากแค็ตตาล็อกสาธารณะและพื้นผิวการติดตั้ง ในขณะที่
ยังมองเห็นได้สำหรับเจ้าของใน `/dashboard`

ผู้ใช้ที่ลงชื่อเข้าใช้สามารถรายงาน Skills และแพ็กเกจได้ ผู้ดูแลสามารถตรวจสอบรายงาน,
ซ่อนหรือกู้คืนเนื้อหา และแบนบัญชีที่ละเมิด ดู
[ความปลอดภัย](/th/clawhub/security),
[การตรวจสอบความปลอดภัย](/th/clawhub/security-audits),
[การกลั่นกรองและความปลอดภัยของบัญชี](/th/clawhub/moderation) และ
[การใช้งานที่ยอมรับได้](/th/clawhub/acceptable-usage) สำหรับรายละเอียดนโยบายและการบังคับใช้

## เทเลเมทรีและสภาพแวดล้อม

เมื่อคุณรัน `clawhub install` ขณะลงชื่อเข้าใช้อยู่ CLI อาจส่งเหตุการณ์การติดตั้ง
แบบพยายามให้ดีที่สุด เพื่อให้ ClawHub คำนวณจำนวนการติดตั้งรวมได้ ปิดใช้งานสิ่งนี้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

การ override สภาพแวดล้อมที่มีประโยชน์:

| ตัวแปร                      | ผล                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL ของไซต์ที่ใช้สำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์     |
| `CLAWHUB_REGISTRY`            | Override URL API ของรีจิสทรี                    |
| `CLAWHUB_CONFIG_PATH`         | Override ตำแหน่งที่ CLI เก็บสถานะโทเค็น/การกำหนดค่า |
| `CLAWHUB_WORKDIR`             | Override ไดเรกทอรีทำงานเริ่มต้น           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งานเทเลเมทรีการติดตั้ง                        |

ดู [เทเลเมทรี](/th/clawhub/telemetry), [HTTP API](/th/clawhub/http-api) และ
[การแก้ไขปัญหา](/th/clawhub/troubleshooting) สำหรับเอกสารอ้างอิงที่ลึกขึ้น
