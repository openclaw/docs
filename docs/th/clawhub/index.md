---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การเลือกระหว่างโฟลว์ CLI ของ openclaw และ ClawHub
sidebarTitle: ClawHub
summary: ภาพรวม ClawHub สาธารณะสำหรับการค้นพบ การติดตั้ง การเผยแพร่ ความปลอดภัย และ clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T20:45:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub คือรีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills และติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับเวิร์กโฟลว์การยืนยันตัวตนกับรีจิสทรี การเผยแพร่ และการลบ/ยกเลิกการลบ

ไซต์: [clawhub.ai](https://clawhub.ai)

## เริ่มต้นอย่างรวดเร็ว

ค้นหาและติดตั้ง Skills ด้วย OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

ค้นหาและติดตั้ง Plugin ด้วย OpenClaw:

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
| Skills         | ชุดข้อความแบบมีเวอร์ชันที่มี `SKILL.md` พร้อมไฟล์สนับสนุน | `openclaw skills install @openclaw/demo`     |
| Plugin โค้ด   | แพ็กเกจ Plugin ของ OpenClaw พร้อมเมทาดาทาความเข้ากันได้         | `openclaw plugins install clawhub:<package>` |
| Plugin บันเดิล | บันเดิล Plugin ที่จัดแพ็กเกจสำหรับการแจกจ่าย OpenClaw            | `clawhub package publish <source>`           |

ClawHub ติดตามเวอร์ชัน semver แท็ก เช่น `latest` บันทึกการเปลี่ยนแปลง ไฟล์
การดาวน์โหลด ดาว และสรุปการสแกนความปลอดภัย หน้าสาธารณะแสดงสถานะรีจิสทรี
ปัจจุบันเพื่อให้ผู้ใช้ตรวจสอบ Skill หรือ Plugin ก่อนติดตั้งได้

## โฟลว์ OpenClaw แบบเนทีฟ

คำสั่ง OpenClaw แบบเนทีฟจะติดตั้งลงในพื้นที่ทำงาน OpenClaw ที่ใช้งานอยู่และคง
เมทาดาทาแหล่งที่มาไว้ เพื่อให้คำสั่งอัปเดตภายหลังยังคงใช้ ClawHub ได้

ใช้ `clawhub:<package>` เมื่อการติดตั้ง Plugin ควร resolve ผ่าน ClawHub
สเปก Plugin เปล่าที่ปลอดภัยสำหรับ npm อาจ resolve ผ่าน npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว และ
`npm:<package>` จะเป็น npm เท่านั้นเมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง Plugin ตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนเรียกใช้การติดตั้งอาร์ไคฟ์ เมื่อเวอร์ชันแพ็กเกจเผยแพร่
อาร์ติแฟกต์ ClawPack OpenClaw จะเลือกใช้ `.tgz` แบบ npm-pack ที่อัปโหลดไว้ตรงรุ่น ตรวจสอบ
ส่วนหัว digest ของ ClawHub และไบต์ที่ดาวน์โหลด และบันทึกเมทาดาทาอาร์ติแฟกต์ไว้สำหรับ
การอัปเดตภายหลัง

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

คำสั่งเหล่านั้นติดตั้ง Skills ลงใน `./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบัน
และบันทึกเวอร์ชันที่ติดตั้งไว้ใน `.clawhub/lock.json`

## การเผยแพร่

เผยแพร่ Skills จากโฟลเดอร์ในเครื่องที่มี `SKILL.md`:

```bash
clawhub skill publish <path>
```

ตัวเลือกการเผยแพร่ที่ใช้บ่อย:

- `--slug <slug>`: ชื่อ URL ของ Skill ที่เผยแพร่
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความบันทึกการเปลี่ยนแปลง
- `--tags <tags>`: แท็กคั่นด้วยจุลภาค ค่าเริ่มต้นเป็น `latest`

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ URL
GitHub:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผนการเผยแพร่ที่ตรงตามจริงโดยไม่อัปโหลด และใช้ `--json`
สำหรับเอาต์พุตที่เหมาะกับ CI

Plugin โค้ดต้องมีเมทาดาทาความเข้ากันได้ของ OpenClaw ที่จำเป็นใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดู [CLI](/th/clawhub/cli) สำหรับข้อมูลอ้างอิงคำสั่ง
ทั้งหมด และ [รูปแบบ Skill](/clawhub/skill-format) สำหรับเมทาดาทา Skill

## ความปลอดภัยและการดูแล

ClawHub เปิดเป็นค่าเริ่มต้น: ทุกคนอัปโหลดได้ แต่การเผยแพร่ต้องใช้บัญชี GitHub
ที่มีอายุเพียงพอจะผ่านเกตการอัปโหลด หน้ารายละเอียดสาธารณะสรุปสถานะการสแกน
ล่าสุดก่อนติดตั้งหรือดาวน์โหลด

ClawHub เรียกใช้การตรวจสอบอัตโนมัติกับ Skills และรุ่น Plugin ที่เผยแพร่ รุ่นที่ถูกพักไว้โดยการสแกน
หรือถูกบล็อกอาจหายไปจากแค็ตตาล็อกสาธารณะและพื้นผิวการติดตั้ง
แต่ยังคงมองเห็นได้สำหรับเจ้าของใน `/dashboard`

ผู้ใช้ที่ลงชื่อเข้าใช้สามารถรายงาน Skills และแพ็กเกจได้ ผู้ดูแลสามารถตรวจสอบรายงาน
ซ่อนหรือกู้คืนเนื้อหา และแบนบัญชีที่ใช้งานในทางที่ผิด ดู
[ความปลอดภัย](/th/clawhub/security),
[การตรวจสอบความปลอดภัย](/clawhub/security-audits),
[การดูแลและความปลอดภัยของบัญชี](/clawhub/moderation) และ
[การใช้งานที่ยอมรับได้](/th/clawhub/acceptable-usage) สำหรับรายละเอียดนโยบายและการบังคับใช้

## เทเลเมทรีและสภาพแวดล้อม

เมื่อคุณเรียกใช้ `clawhub install` ขณะลงชื่อเข้าใช้อยู่ CLI อาจส่งเหตุการณ์
การติดตั้งแบบ best-effort เพื่อให้ ClawHub คำนวณจำนวนการติดตั้งรวมได้ ปิดใช้งานสิ่งนี้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

การ override สภาพแวดล้อมที่มีประโยชน์:

| ตัวแปร                      | ผล                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Override URL ไซต์ที่ใช้สำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์     |
| `CLAWHUB_REGISTRY`            | Override URL API ของรีจิสทรี                    |
| `CLAWHUB_CONFIG_PATH`         | Override ตำแหน่งที่ CLI จัดเก็บสถานะโทเค็น/การกำหนดค่า |
| `CLAWHUB_WORKDIR`             | Override ไดเรกทอรีทำงานเริ่มต้น           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งานเทเลเมทรีการติดตั้ง                        |

ดู [เทเลเมทรี](/clawhub/telemetry), [HTTP API](/clawhub/http-api) และ
[การแก้ไขปัญหา](/th/clawhub/troubleshooting) สำหรับเอกสารอ้างอิงเชิงลึกเพิ่มเติม
