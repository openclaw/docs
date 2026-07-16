---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การเลือกระหว่างขั้นตอนการทำงานของ CLI สำหรับ OpenClaw และ ClawHub
sidebarTitle: ClawHub
summary: ภาพรวม ClawHub สาธารณะสำหรับการค้นหา การติดตั้ง การเผยแพร่ การรักษาความปลอดภัย และ CLI ของ clawhub
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T18:46:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub คือรีจิสทรีสาธารณะสำหรับ Skills และ Plugin ของ OpenClaw

- ใช้คำสั่ง `openclaw` แบบเนทีฟเพื่อค้นหา ติดตั้ง และอัปเดต Skills รวมถึงติดตั้ง Plugin จาก ClawHub
- ใช้ CLI `clawhub` แยกต่างหากสำหรับการยืนยันตัวตนกับรีจิสทรี การเผยแพร่ และเวิร์กโฟลว์การลบ/กู้คืนการลบ

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

ติดตั้ง ClawHub CLI เมื่อต้องการเวิร์กโฟลว์ที่ยืนยันตัวตนกับรีจิสทรี เช่น
การเผยแพร่หรือการลบ/กู้คืนการลบ:

```bash
npm i -g clawhub
# หรือ
pnpm add -g clawhub
```

## สิ่งที่ ClawHub โฮสต์

| พื้นผิว        | สิ่งที่จัดเก็บ                                               | คำสั่งทั่วไป                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | บันเดิลข้อความที่มีการกำหนดเวอร์ชัน พร้อม `SKILL.md` และไฟล์สนับสนุน | `openclaw skills install @openclaw/demo`     |
| Plugin โค้ด   | แพ็กเกจ Plugin ของ OpenClaw พร้อมข้อมูลเมตาความเข้ากันได้         | `openclaw plugins install clawhub:<package>` |
| Plugin แบบบันเดิล | บันเดิล Plugin ที่จัดแพ็กเกจสำหรับการเผยแพร่ OpenClaw            | `clawhub package publish <source>`           |

ClawHub ติดตามเวอร์ชัน semver, แท็ก เช่น `latest`, บันทึกการเปลี่ยนแปลง, ไฟล์,
จำนวนดาวน์โหลด, ดาว และสรุปการสแกนความปลอดภัย หน้าสาธารณะแสดงสถานะรีจิสทรี
ปัจจุบันเพื่อให้ผู้ใช้ตรวจสอบ Skill หรือ Plugin ก่อนติดตั้งได้

## โฟลว์แบบเนทีฟของ OpenClaw

คำสั่งแบบเนทีฟของ OpenClaw จะติดตั้งลงในเวิร์กสเปซ OpenClaw ที่ใช้งานอยู่และจัดเก็บ
ข้อมูลเมตาของแหล่งที่มาไว้ เพื่อให้คำสั่งอัปเดตในภายหลังยังคงใช้ ClawHub ได้

ใช้ `clawhub:<package>` เมื่อต้องการให้การติดตั้ง Plugin ดำเนินการแก้ไขผ่าน ClawHub
ข้อกำหนด Plugin แบบเปล่าที่ปลอดภัยสำหรับ npm อาจแก้ไขผ่าน npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว และ
`npm:<package>` จะยังคงใช้เฉพาะ npm เมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ที่ประกาศไว้ก่อนดำเนินการติดตั้งจากอาร์ไคฟ์ เมื่อเวอร์ชันแพ็กเกจเผยแพร่อาร์ติแฟกต์
ClawPack แล้ว OpenClaw จะเลือกใช้ npm-pack `.tgz` ที่อัปโหลดตรงตามเวอร์ชัน ตรวจสอบ
ส่วนหัวไดเจสต์ของ ClawHub และไบต์ที่ดาวน์โหลดมา แล้วบันทึกข้อมูลเมตาของอาร์ติแฟกต์สำหรับ
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

คำสั่งเหล่านี้จะติดตั้ง Skills ลงใน `./skills` ภายใต้ไดเรกทอรีทำงานปัจจุบัน
และบันทึกเวอร์ชันที่ติดตั้งไว้ใน `.clawhub/lock.json`

## การเผยแพร่

เผยแพร่ Skills จากโฟลเดอร์ภายในเครื่องที่มี `SKILL.md`:

```bash
clawhub skill publish <path>
```

ตัวเลือกการเผยแพร่ที่ใช้บ่อย:

- `--slug <slug>`: ชื่อใน URL ของ Skill ที่เผยแพร่
- `--name <name>`: ชื่อที่แสดง
- `--version <version>`: เวอร์ชัน semver
- `--changelog <text>`: ข้อความบันทึกการเปลี่ยนแปลง
- `--tags <tags>`: แท็กที่คั่นด้วยจุลภาค โดยมีค่าเริ่มต้นเป็น `latest`

เผยแพร่ Plugin จากโฟลเดอร์ภายในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ URL ของ GitHub:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผนการเผยแพร่ที่แน่นอนโดยไม่อัปโหลด และใช้ `--json`
สำหรับเอาต์พุตที่เหมาะกับ CI

Plugin โค้ดต้องมีข้อมูลเมตาความเข้ากันได้กับ OpenClaw ที่จำเป็นใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดูข้อมูลอ้างอิงคำสั่งทั้งหมดได้ที่ [CLI](/th/clawhub/cli)
และดูข้อมูลเมตาของ Skill ได้ที่ [รูปแบบ Skill](/clawhub/skill-format)

## ความปลอดภัยและการดูแลเนื้อหา

ClawHub เปิดให้ใช้งานโดยค่าเริ่มต้น ทุกคนสามารถอัปโหลดได้ แต่การเผยแพร่ต้องใช้บัญชี
GitHub ที่มีอายุเพียงพอให้ผ่านเกณฑ์การอัปโหลด หน้ารายละเอียดสาธารณะจะสรุป
สถานะการสแกนล่าสุดก่อนการติดตั้งหรือดาวน์โหลด

ClawHub ดำเนินการตรวจสอบอัตโนมัติกับ Skills และรุ่นของ Plugin ที่เผยแพร่ รุ่นที่ถูกระงับ
ไว้เพื่อตรวจสอบหรือถูกบล็อกอาจหายไปจากแค็ตตาล็อกสาธารณะและพื้นผิวการติดตั้ง ขณะที่
เจ้าของยังคงมองเห็นได้ใน `/dashboard`

ผู้ใช้ที่เข้าสู่ระบบสามารถรายงาน Skills และแพ็กเกจได้ ผู้ดูแลสามารถตรวจสอบรายงาน
ซ่อนหรือกู้คืนเนื้อหา และระงับบัญชีที่ใช้งานในทางที่ผิด ดูรายละเอียดนโยบายและการบังคับใช้ได้ที่
[ความปลอดภัย](/th/clawhub/security),
[การตรวจสอบความปลอดภัย](/clawhub/security-audits),
[การดูแลเนื้อหาและความปลอดภัยของบัญชี](/clawhub/moderation) และ
[การใช้งานที่ยอมรับได้](/clawhub/acceptable-usage)

## ข้อมูลการใช้งานและสภาพแวดล้อม

เมื่อเรียกใช้ `clawhub install` ขณะเข้าสู่ระบบ CLI อาจส่งเหตุการณ์
การติดตั้งแบบพยายามให้ดีที่สุด เพื่อให้ ClawHub คำนวณจำนวนการติดตั้งรวมได้ ปิดใช้งานได้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

ตัวแปรสภาพแวดล้อมสำหรับแทนค่าที่มีประโยชน์:

| ตัวแปร                      | ผลลัพธ์                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | แทนที่ URL ของเว็บไซต์ที่ใช้เข้าสู่ระบบผ่านเบราว์เซอร์     |
| `CLAWHUB_REGISTRY`            | แทนที่ URL ของ API รีจิสทรี                    |
| `CLAWHUB_CONFIG_PATH`         | แทนที่ตำแหน่งที่ CLI จัดเก็บสถานะโทเค็น/การกำหนดค่า |
| `CLAWHUB_WORKDIR`             | แทนที่ไดเรกทอรีทำงานเริ่มต้น           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้ข้อมูลการใช้งานสำหรับการติดตั้ง                        |

ดูข้อมูลอ้างอิงเชิงลึกเพิ่มเติมได้ที่ [ข้อมูลการใช้งาน](/clawhub/telemetry), [HTTP API](/clawhub/http-api) และ
[การแก้ไขปัญหา](/th/clawhub/troubleshooting)
