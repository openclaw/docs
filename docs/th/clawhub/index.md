---
read_when:
    - อธิบายว่า ClawHub คืออะไร
    - การค้นหา ติดตั้ง หรืออัปเดต Skills หรือ Plugin
    - การเผยแพร่ Skills หรือ Plugin ไปยังรีจิสทรี
    - การเลือกระหว่างขั้นตอน CLI ของ OpenClaw และ ClawHub
sidebarTitle: ClawHub
summary: ภาพรวม ClawHub สาธารณะสำหรับการค้นหา การติดตั้ง การเผยแพร่ ความปลอดภัย และ CLI ของ clawhub
title: ClawHub
x-i18n:
    generated_at: "2026-07-19T07:03:35Z"
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
- ใช้ CLI `clawhub` แยกต่างหากสำหรับการยืนยันตัวตนกับรีจิสทรี การเผยแพร่ และขั้นตอนการลบ/ยกเลิกการลบ

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

ติดตั้ง ClawHub CLI เมื่อต้องการใช้ขั้นตอนที่ยืนยันตัวตนกับรีจิสทรี เช่น
การเผยแพร่หรือการลบ/ยกเลิกการลบ:

```bash
npm i -g clawhub
# หรือ
pnpm add -g clawhub
```

## สิ่งที่ ClawHub โฮสต์

| ส่วน            | สิ่งที่จัดเก็บ                                               | คำสั่งที่ใช้โดยทั่วไป                           |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | ชุดข้อความที่มีเวอร์ชันพร้อม `SKILL.md` และไฟล์สนับสนุน | `openclaw skills install @openclaw/demo`     |
| Plugin โค้ด   | แพ็กเกจ Plugin ของ OpenClaw พร้อมข้อมูลเมตาความเข้ากันได้         | `openclaw plugins install clawhub:<package>` |
| Plugin แบบบันเดิล | บันเดิล Plugin ที่จัดทำเป็นแพ็กเกจสำหรับการแจกจ่าย OpenClaw       | `clawhub package publish <source>`           |

ClawHub ติดตามเวอร์ชัน semver, แท็ก เช่น `latest`, บันทึกการเปลี่ยนแปลง, ไฟล์,
จำนวนดาวน์โหลด, ดาว และสรุปผลการสแกนความปลอดภัย หน้าสาธารณะแสดงสถานะรีจิสทรี
ปัจจุบันเพื่อให้ผู้ใช้ตรวจสอบ Skill หรือ Plugin ก่อนติดตั้งได้

## ขั้นตอนแบบเนทีฟของ OpenClaw

คำสั่งแบบเนทีฟของ OpenClaw จะติดตั้งลงในเวิร์กสเปซ OpenClaw ที่ใช้งานอยู่และบันทึก
ข้อมูลเมตาของแหล่งที่มา เพื่อให้คำสั่งอัปเดตในภายหลังยังคงใช้ ClawHub ได้

ใช้ `clawhub:<package>` เมื่อต้องการให้การติดตั้ง Plugin ดำเนินการผ่าน ClawHub
ข้อกำหนด Plugin แบบเปล่าที่ปลอดภัยสำหรับ npm อาจดำเนินการผ่าน npm ระหว่างการเปลี่ยนผ่านช่วงเปิดตัว และ
`npm:<package>` ยังคงใช้เฉพาะ npm เมื่อจำเป็นต้องระบุแหล่งที่มาอย่างชัดเจน

การติดตั้ง Plugin จะตรวจสอบความเข้ากันได้ของ `pluginApi` และ `minGatewayVersion`
ตามที่ประกาศไว้ก่อนเริ่มติดตั้งไฟล์เก็บถาวร เมื่อเวอร์ชันของแพ็กเกจเผยแพร่อาร์ติแฟกต์
ClawPack แล้ว OpenClaw จะเลือก npm-pack `.tgz` ที่อัปโหลดไว้ตรงกันทุกประการ ตรวจสอบ
เฮดเดอร์ไดเจสต์ของ ClawHub และไบต์ที่ดาวน์โหลดมา แล้วบันทึกข้อมูลเมตาของอาร์ติแฟกต์สำหรับ
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

CLI ยังมีคำสั่งติดตั้ง/อัปเดต Skill สำหรับขั้นตอนที่ใช้งานรีจิสทรีโดยตรง:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

คำสั่งเหล่านี้จะติดตั้ง Skills ลงใน `./skills` ภายใต้ไดเรกทอรีการทำงานปัจจุบัน
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
- `--tags <tags>`: แท็กที่คั่นด้วยจุลภาค โดยมีค่าเริ่มต้นเป็น `latest`

เผยแพร่ Plugin จากโฟลเดอร์ในเครื่อง, `owner/repo`, `owner/repo@ref` หรือ URL ของ GitHub:

```bash
clawhub package publish <source>
```

ใช้ `--dry-run` เพื่อสร้างแผนการเผยแพร่ที่แน่นอนโดยไม่อัปโหลด และใช้ `--json`
สำหรับเอาต์พุตที่เหมาะกับ CI

Plugin โค้ดต้องมีข้อมูลเมตาความเข้ากันได้กับ OpenClaw ที่กำหนดไว้ใน
`package.json` รวมถึง `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion` ดูข้อมูลอ้างอิงคำสั่งทั้งหมดที่ [CLI](/th/clawhub/cli)
และดูข้อมูลเมตาของ Skill ที่ [รูปแบบ Skill](/th/clawhub/skill-format)

## ความปลอดภัยและการดูแลเนื้อหา

ClawHub เปิดเป็นสาธารณะโดยค่าเริ่มต้น: ทุกคนสามารถอัปโหลดได้ แต่การเผยแพร่ต้องใช้บัญชี GitHub
ที่มีอายุมากพอจะผ่านเกณฑ์การอัปโหลด หน้ารายละเอียดสาธารณะจะแสดงสรุปสถานะการสแกน
ล่าสุดก่อนการติดตั้งหรือดาวน์โหลด

ClawHub เรียกใช้การตรวจสอบอัตโนมัติกับ Skills และรุ่นของ Plugin ที่เผยแพร่ รุ่นที่ถูกระงับไว้
เพื่อตรวจสอบหรือถูกบล็อกอาจหายไปจากแค็ตตาล็อกสาธารณะและหน้าการติดตั้ง แต่
เจ้าของยังคงมองเห็นได้ใน `/dashboard`

ผู้ใช้ที่ลงชื่อเข้าใช้สามารถรายงาน Skills และแพ็กเกจได้ ผู้ดูแลสามารถตรวจสอบรายงาน
ซ่อนหรือกู้คืนเนื้อหา และแบนบัญชีที่ใช้งานในทางที่ผิด ดูรายละเอียดนโยบายและการบังคับใช้ที่
[ความปลอดภัย](/clawhub/security),
[การตรวจสอบความปลอดภัย](/clawhub/security-audits),
[การดูแลเนื้อหาและความปลอดภัยของบัญชี](/clawhub/moderation) และ
[การใช้งานที่ยอมรับได้](/clawhub/acceptable-usage)

## เทเลเมทรีและสภาพแวดล้อม

เมื่อเรียกใช้ `clawhub install` ขณะลงชื่อเข้าใช้ CLI อาจส่งเหตุการณ์การติดตั้ง
แบบพยายามให้ดีที่สุด เพื่อให้ ClawHub คำนวณจำนวนการติดตั้งโดยรวม ปิดใช้งานได้ด้วย:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

ค่าทดแทนสภาพแวดล้อมที่มีประโยชน์:

| ตัวแปร                      | ผล                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | แทนที่ URL ของเว็บไซต์ที่ใช้สำหรับเข้าสู่ระบบผ่านเบราว์เซอร์ |
| `CLAWHUB_REGISTRY`            | แทนที่ URL ของ API รีจิสทรี                      |
| `CLAWHUB_CONFIG_PATH`         | แทนที่ตำแหน่งที่ CLI จัดเก็บสถานะโทเค็น/การกำหนดค่า |
| `CLAWHUB_WORKDIR`             | แทนที่ไดเรกทอรีการทำงานเริ่มต้น                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | ปิดใช้งานเทเลเมทรีการติดตั้ง                      |

ดูข้อมูลอ้างอิงเชิงลึกเพิ่มเติมที่ [เทเลเมทรี](/clawhub/telemetry), [HTTP API](/clawhub/http-api) และ
[การแก้ไขปัญหา](/clawhub/troubleshooting)
