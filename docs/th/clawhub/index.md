---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การเลือกระหว่างโฟลว์ CLI ของ OpenClaw และ ClawHub
sidebarTitle: ClawHub
summary: ภาพรวม ClawHub สาธารณะสำหรับการค้นหา การติดตั้ง การเผยแพร่ ความปลอดภัย และ CLI ของ clawhub
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T15:58:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub คือรีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills รวมถึงติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับการยืนยันตัวตนกับรีจิสทรี การเผยแพร่ และเวิร์กโฟลว์การลบ/กู้คืน

เว็บไซต์: [clawhub.ai](https://clawhub.ai)

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

ติดตั้ง CLI ของ ClawHub เมื่อต้องการใช้เวิร์กโฟลว์ที่ผ่านการยืนยันตัวตนกับรีจิสทรี เช่น
การเผยแพร่หรือการลบ/กู้คืน:

```bash
npm i -g clawhub
# หรือ
pnpm add -g clawhub
```

## สิ่งที่ ClawHub ให้บริการ

| ส่วนประกอบ        | สิ่งที่จัดเก็บ                                               | คำสั่งที่ใช้ทั่วไป                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | ชุดข้อความที่มีเวอร์ชัน ประกอบด้วย `SKILL.md` และไฟล์สนับสนุน | `openclaw skills install @openclaw/demo`     |
| Plugin แบบโค้ด   | แพ็กเกจ Plugin ของ OpenClaw พร้อมข้อมูลเมตาความเข้ากันได้         | `openclaw plugins install clawhub:<package>` |
| Plugin แบบบันเดิล | บันเดิล Plugin ที่จัดแพ็กเกจเพื่อเผยแพร่ OpenClaw            | `clawhub package publish <source>`           |

ClawHub ติดตามเวอร์ชันตาม semver แท็ก เช่น `latest` บันทึกการเปลี่ยนแปลง ไฟล์
ยอดดาวน์โหลด ดาว และข้อมูลสรุปการสแกนความปลอดภัย หน้าสาธารณะแสดงสถานะรีจิสทรี
ปัจจุบัน เพื่อให้ผู้ใช้ตรวจสอบ Skill หรือ Plugin ก่อนติดตั้งได้

## โฟลว์แบบเนทีฟของ OpenClaw

คำสั่งแบบเนทีฟของ OpenClaw จะติดตั้งลงในเวิร์กสเปซ OpenClaw ที่ใช้งานอยู่ และบันทึก
ข้อมูลเมตาของแหล่งที่มาอย่างถาวร เพื่อให้คำสั่งอัปเดตในภายหลังยังคงใช้ ClawHub ได้

ใช้ `clawhub:<package>` เมื่อต้องการให้การติดตั้ง Plugin ดำเนินการผ่าน ClawHub
ข้อกำหนด Plugin แบบไม่ระบุแหล่งที่มาซึ่งใช้กับ npm ได้ อาจดำเนินการผ่าน npm ระหว่างช่วงเปลี่ยนผ่านของการเปิดตัว และ
`npm:<package>` จะใช้เฉพาะ npm เมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนเริ่มติดตั้งไฟล์เก็บถาวร เมื่อเวอร์ชันแพ็กเกจเผยแพร่อาร์ติแฟกต์
ClawPack แล้ว OpenClaw จะเลือกใช้ `.tgz` จาก npm-pack ที่อัปโหลดไว้ตรงตามเวอร์ชัน ตรวจสอบ
ส่วนหัวไดเจสต์ของ ClawHub และไบต์ที่ดาวน์โหลดมา และบันทึกข้อมูลเมตาของอาร์ติแฟกต์ไว้สำหรับ
การอัปเดตในภายหลัง

## CLI ของ ClawHub

CLI ของ ClawHub ใช้สำหรับงานที่ผ่านการยืนยันตัวตนกับรีจิสทรี:

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

CLI ยังมีคำสั่งติดตั้ง/อัปเดต Skill สำหรับเวิร์กโฟลว์ที่ทำงานกับรีจิสทรีโดยตรง:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

คำสั่งเหล่านี้จะติดตั้ง Skills ลงใน `./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบัน
และบันทึกเวอร์ชันที่ติดตั้งไว้ใน `.clawhub/lock.json`

## การเผยแพร่

เผยแพร่ Skills จากโฟลเดอร์ภายในเครื่องที่มี `SKILL.md`:

```bash
clawhub skill publish <path>
```

ตัวเลือกการเผยแพร่ที่ใช้บ่อย:

- `--slug <slug>`: ชื่อ URL ของ Skill ที่เผยแพร่
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชันตาม semver
- `--changelog <text>`: ข้อความบันทึกการเปลี่ยนแปลง
- `--tags <tags>`: แท็กที่คั่นด้วยจุลภาค โดยมีค่าเริ่มต้นเป็น `latest`

เผยแพร่ Plugin จากโฟลเดอร์ภายในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ URL ของ GitHub:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผนการเผยแพร่ที่ตรงตามจริงโดยไม่อัปโหลด และใช้ `--json`
เพื่อให้ได้เอาต์พุตที่เหมาะกับ CI

Plugin แบบโค้ดต้องมีข้อมูลเมตาความเข้ากันได้ของ OpenClaw ที่จำเป็นใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดูข้อมูลอ้างอิงคำสั่งฉบับเต็มที่ [CLI](/th/clawhub/cli)
และดูข้อมูลเมตาของ Skill ที่ [รูปแบบ Skill](/clawhub/skill-format)

## ความปลอดภัยและการกำกับดูแล

ClawHub เปิดให้ใช้งานโดยค่าเริ่มต้น: ทุกคนสามารถอัปโหลดได้ แต่การเผยแพร่ต้องใช้บัญชี
GitHub ที่มีอายุเพียงพอให้ผ่านเกณฑ์การอัปโหลด หน้ารายละเอียดสาธารณะสรุป
สถานะการสแกนล่าสุดก่อนการติดตั้งหรือดาวน์โหลด

ClawHub เรียกใช้การตรวจสอบอัตโนมัติกับ Skills และรุ่นของ Plugin ที่เผยแพร่แล้ว รุ่นที่ถูก
ระงับไว้เพื่อตรวจสอบหรือถูกบล็อกอาจหายไปจากแค็ตตาล็อกสาธารณะและส่วนติดตั้ง แต่
เจ้าของยังคงมองเห็นได้ใน `/dashboard`

ผู้ใช้ที่ลงชื่อเข้าใช้แล้วสามารถรายงาน Skills และแพ็กเกจได้ ผู้ดูแลสามารถตรวจสอบรายงาน
ซ่อนหรือกู้คืนเนื้อหา และแบนบัญชีที่มีพฤติกรรมไม่เหมาะสม ดูรายละเอียดนโยบายและการบังคับใช้ที่
[ความปลอดภัย](/clawhub/security),
[การตรวจสอบความปลอดภัย](/th/clawhub/security-audits),
[การกำกับดูแลและความปลอดภัยของบัญชี](/clawhub/moderation) และ
[การใช้งานที่ยอมรับได้](/clawhub/acceptable-usage)

## เทเลเมทรีและสภาพแวดล้อม

เมื่อเรียกใช้ `clawhub install` ขณะลงชื่อเข้าใช้ CLI อาจส่งเหตุการณ์การติดตั้ง
แบบพยายามอย่างดีที่สุด เพื่อให้ ClawHub คำนวณจำนวนการติดตั้งรวมได้ ปิดใช้งานได้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

การกำหนดค่าสภาพแวดล้อมทับที่มีประโยชน์:

| ตัวแปร                      | ผล                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | กำหนด URL เว็บไซต์ที่ใช้สำหรับการเข้าสู่ระบบผ่านเบราว์เซอร์ทับค่าเดิม     |
| `CLAWHUB_REGISTRY`            | กำหนด URL ของ API รีจิสทรีทับค่าเดิม                    |
| `CLAWHUB_CONFIG_PATH`         | กำหนดตำแหน่งที่ CLI จัดเก็บสถานะโทเค็น/การกำหนดค่าทับค่าเดิม |
| `CLAWHUB_WORKDIR`             | กำหนดไดเรกทอรีทำงานเริ่มต้นทับค่าเดิม           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งานเทเลเมทรีการติดตั้ง                        |

ดูข้อมูลอ้างอิงเชิงลึกเพิ่มเติมที่ [เทเลเมทรี](/th/clawhub/telemetry), [HTTP API](/clawhub/http-api) และ
[การแก้ไขปัญหา](/clawhub/troubleshooting)
