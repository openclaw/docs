---
doc-schema-version: 1
read_when:
    - คุณต้องการเรียกดู ติดตั้ง เปิดใช้งาน หรือปิดใช้งาน Plugin ใน Control UI
    - ต้องการตัวอย่างแบบรวดเร็วสำหรับการแสดงรายการ Plugin การติดตั้ง การอัปเดต การตรวจสอบ หรือการถอนการติดตั้ง
    - คุณต้องการเลือกแหล่งติดตั้ง Plugin
    - คุณต้องการเอกสารอ้างอิงที่ถูกต้องสำหรับการเผยแพร่แพ็กเกจ Plugin
sidebarTitle: Manage plugins
summary: จัดการ Plugin ของ OpenClaw จาก Control UI หรือ CLI
title: จัดการ Plugin
x-i18n:
    generated_at: "2026-07-16T19:24:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI ครอบคลุมเวิร์กโฟลว์ทั่วไปสำหรับการค้นหา ติดตั้ง เปิดใช้ และปิดใช้
ส่วน CLI เพิ่มการอัปเดต ถอนการติดตั้ง การกำหนดค่าขั้นสูง และการควบคุม
แหล่งติดตั้งอย่างชัดเจน สำหรับสัญญาคำสั่งทั้งหมด แฟล็ก กฎการเลือกแหล่ง
และกรณีขอบ โปรดดู [`openclaw plugins`](/th/cli/plugins)

เวิร์กโฟลว์ CLI โดยทั่วไป: ค้นหาแพ็กเกจ ติดตั้งจาก ClawHub, npm, git หรือ
พาธภายในเครื่อง ปล่อยให้ Gateway ที่มีการจัดการรีสตาร์ตอัตโนมัติ (หรือรีสตาร์ตด้วยตนเอง) จากนั้น
ตรวจสอบการลงทะเบียนรันไทม์ของ Plugin

## ใช้ Control UI

เปิด **Plugins** ใน Control UI หรือใช้ `/settings/plugins` โดยอิงจาก
พาธฐานของ Control UI ที่กำหนดค่าไว้ ตัวอย่างเช่น พาธฐาน `/openclaw` จะใช้
`/openclaw/settings/plugins` หน้านี้มีสองแท็บ:

- **Installed** แสดงรายการทั้งหมดภายในเครื่องซึ่งจัดกลุ่มตามหมวดหมู่ (ช่องทาง
  ผู้ให้บริการโมเดล หน่วยความจำ เครื่องมือ) แต่ละแถวจะเปิดมุมมองรายละเอียด เมนูรายการเพิ่มเติม
  (`…`) ใช้เปิดหรือปิด Plugin และสำหรับ Plugin ที่ติดตั้งจากภายนอก
  จะมี **Remove** แท็บนี้ยังแสดง [เซิร์ฟเวอร์ MCP](/th/cli/mcp) ที่กำหนดค่าไว้
  พร้อมการเปิดใช้ ปิดใช้ และนำออกผ่านเมนูในลักษณะเดียวกัน
  โดยแก้ไข `mcp.servers` ในการกำหนดค่า Gateway
- **Discover** คือร้านค้า: Plugin แนะนำที่รวมมากับ OpenClaw, Plugin
  ภายนอกอย่างเป็นทางการ และชุดตัวเชื่อมต่อที่คัดสรรแล้ว การ์ดตัวเชื่อมต่อสามารถเพิ่ม
  เซิร์ฟเวอร์ MCP แบบโฮสต์ได้ในคลิกเดียว (GitHub, Notion, Linear, Sentry,
  Home Assistant) หรือไปยังการค้นหา ClawHub ที่กรอกไว้ล่วงหน้า การพิมพ์ในช่องค้นหา
  จะค้นหา [ClawHub](https://clawhub.ai/plugins) ภายในหน้าและเพิ่มส่วน **From
  ClawHub** พร้อมจำนวนการดาวน์โหลดและป้ายยืนยันแหล่งที่มา

Plugin ที่รวมมาให้ไม่จำเป็นต้องติดตั้งแพ็กเกจ การดำเนินการในเมนูคือ **Enable**
หรือ **Disable** ตัวอย่างเช่น Workboard รวมมากับ OpenClaw และถูกปิดใช้
โดยค่าเริ่มต้น ดังนั้นให้เลือก **Enable** เพื่อเปิดใช้ Plugin ที่รวมมาในชุดไม่สามารถ
นำออกได้ ทำได้เพียงปิดใช้เท่านั้น

การเข้าถึงแค็ตตาล็อกและการค้นหาต้องใช้ `operator.read` การติดตั้ง เปิดใช้ ปิดใช้
นำออก และการเปลี่ยนแปลงเซิร์ฟเวอร์ MCP ต้องใช้ `operator.admin` การติดตั้งจาก ClawHub
ดำเนินการโดย Gateway และยังคงใช้การตรวจสอบนโยบายความน่าเชื่อถือ ความสมบูรณ์
และการติดตั้ง Plugin การเปิดใช้ Plugin ที่ติดตั้งแล้วในฐานะผู้ดูแลระบบยังบันทึก
ความเชื่อถืออย่างชัดเจนด้วยการเพิ่ม Plugin ที่เลือกลงในรายการ `plugins.allow`
แบบจำกัดที่มีอยู่ รายการ `plugins.deny` ที่ระบุไว้อย่างชัดเจนยังคงมีอำนาจสูงสุดและ
ต้องนำออกก่อนจึงจะเปิดใช้ Plugin ได้

การติดตั้งหรือนำโค้ด Plugin ออกต้องรีสตาร์ต Gateway การเปลี่ยนแปลง
การเปิดใช้สามารถนำไปใช้ได้โดยไม่ต้องรีสตาร์ตเมื่อ Plugin ที่ติดตั้งและรันไทม์
Gateway ปัจจุบันรองรับ มิฉะนั้น UI จะแจ้งว่าจำเป็นต้องรีสตาร์ต
ตัวเชื่อมต่อ MCP ที่ใช้ OAuth ยังคงต้องทำ `openclaw mcp login <name>` หนึ่งครั้ง
จาก CLI หลังจากเพิ่มแล้ว

Control UI ไม่รองรับการติดตั้งจากแหล่ง npm, git หรือพาธภายในเครื่องใดๆ
การอัปเดต Plugin หรือการกำหนดค่า Plugin แบบละเอียด ใช้เวิร์กโฟลว์ CLI
ด้านล่างสำหรับการดำเนินการเหล่านั้น

## แสดงรายการและค้นหา Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` สำหรับสคริปต์:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` เป็นการตรวจสอบรายการแบบไม่โหลดรันไทม์: สิ่งที่ OpenClaw ค้นพบได้จาก
การกำหนดค่า manifest และรีจิสทรี Plugin ที่จัดเก็บถาวร การตรวจสอบนี้ไม่ได้ยืนยันว่า
Gateway ที่กำลังทำงานได้นำเข้ารันไทม์ Plugin แล้ว เอาต์พุต JSON มี
การวินิจฉัยรีจิสทรีและ `dependencyStatus` ของแต่ละ Plugin (ว่า
`dependencies`/`optionalDependencies` ที่ประกาศไว้สามารถค้นพบบนดิสก์หรือไม่)

`plugins search` ค้นหาแพ็กเกจ Plugin ที่ติดตั้งได้จาก ClawHub และแสดง
คำแนะนำการติดตั้ง (`openclaw plugins install clawhub:<package>`) สำหรับแต่ละผลลัพธ์

## เปิดใช้และปิดใช้ Plugin

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

สลับรายการกำหนดค่าของ Plugin โดยไม่แก้ไขไฟล์ที่ติดตั้ง Plugin ที่รวมมาในชุดบางรายการ
(ผู้ให้บริการโมเดล/เสียงพูดที่รวมมาในชุด และ Plugin เบราว์เซอร์ที่รวมมาในชุด)
จะเปิดใช้โดยค่าเริ่มต้น ส่วนรายการอื่นต้องใช้ `enable` หลังติดตั้ง

## ติดตั้ง Plugin

```bash
# ค้นหาแพ็กเกจ Plugin ใน ClawHub
openclaw plugins search "calendar"

# ติดตั้งจาก ClawHub
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# ติดตั้งจาก npm
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# ติดตั้งจากอาร์ติแฟกต์ npm-pack ภายในเครื่อง
openclaw plugins install npm-pack:<path.tgz>

# ติดตั้งจาก git หรือเช็กเอาต์สำหรับการพัฒนาภายในเครื่อง
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

ข้อกำหนดแพ็กเกจที่ไม่มีคำนำหน้าจะติดตั้งจาก npm ระหว่างการเปลี่ยนผ่านช่วงเปิดตัว เว้นแต่
ชื่อจะตรงกับรหัส Plugin ที่รวมมาในชุดหรือเป็นทางการ ซึ่งในกรณีนั้น OpenClaw จะใช้
สำเนาภายในเครื่อง/อย่างเป็นทางการนั้นแทน ใช้ `clawhub:`, `npm:`, `git:` หรือ
`npm-pack:` เพื่อเลือกแหล่งอย่างแน่นอน แพ็กเกจในแค็ตตาล็อกที่รวมมาในชุดและเป็นทางการ
ของ OpenClaw ได้รับความเชื่อถือเช่นเดียวกับแพ็กเกจ ClawHub แหล่ง npm,
git, พาธ/ไฟล์เก็บถาวรภายในเครื่อง, `npm-pack:` หรือตลาดกลางใหม่ที่กำหนดเอง
ต้องใช้ `--force` ในการติดตั้งแบบไม่โต้ตอบหลังจากตรวจสอบ
และเชื่อถือแหล่งแล้ว

`--force` ยืนยันแหล่งที่ไม่ใช่ ClawHub โดยไม่แสดงคำถาม และเขียนทับ
เป้าหมายการติดตั้งที่มีอยู่เมื่อจำเป็น สำหรับการอัปเกรดตามปกติของการติดตั้ง npm,
ClawHub หรือ hook-pack ที่ติดตามไว้ ให้ใช้ `openclaw plugins update` แทน เมื่อใช้
`--link` ค่า `--force` จะยืนยันเฉพาะแหล่งเท่านั้น ไดเรกทอรีที่ลิงก์ไว้จะไม่ถูก
คัดลอกหรือเขียนทับ

## รีสตาร์ตและตรวจสอบ

Gateway ที่มีการจัดการและกำลังทำงานโดยเปิดใช้การโหลดการกำหนดค่าใหม่ จะรีสตาร์ตอัตโนมัติ
หลังจากติดตั้ง อัปเดต หรือถอนการติดตั้งโค้ด Plugin หาก Gateway
ไม่มีการจัดการหรือปิดใช้การโหลดใหม่ ให้รีสตาร์ตด้วยตนเองก่อนตรวจสอบ
พื้นผิวรันไทม์ที่ใช้งานจริง:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` โหลดโมดูล Plugin และยืนยันว่าได้ลงทะเบียนพื้นผิวรันไทม์
(เครื่องมือ hook บริการ เมธอด Gateway เส้นทาง HTTP คำสั่ง CLI
ที่ Plugin เป็นเจ้าของ) ส่วน `inspect` และ `list` แบบปกติเป็นเพียง
การตรวจสอบ manifest/การกำหนดค่า/รีจิสทรีโดยไม่โหลดรันไทม์

## อัปเดต Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

การส่งรหัส Plugin จะนำข้อกำหนดการติดตั้งที่ติดตามไว้กลับมาใช้ใหม่: dist-tag
ที่จัดเก็บไว้ (`@beta`) และเวอร์ชันแบบปักหมุดที่แน่นอนจะถูกใช้ต่อในการเรียก
`update <plugin-id>` ครั้งถัดไป

`openclaw plugins update --all` คือเส้นทางการบำรุงรักษาแบบกลุ่ม โดยยังคง
เคารพข้อกำหนดการติดตั้งที่ติดตามตามปกติ แต่ระเบียน Plugin อย่างเป็นทางการของ OpenClaw
ที่เชื่อถือได้จะซิงค์กับเป้าหมายแค็ตตาล็อกอย่างเป็นทางการปัจจุบัน แทนที่จะ
ปักหมุดอยู่กับแพ็กเกจอย่างเป็นทางการแบบระบุเวอร์ชันที่ล้าสมัย เมื่อ `update.channel` เป็น
`beta` การซิงค์นั้นจะเลือกสายรุ่นเบตาก่อน ใช้ `update <plugin-id>`
แบบระบุเป้าหมายเพื่อคงข้อกำหนดอย่างเป็นทางการแบบระบุเวอร์ชันหรือแท็กไว้โดยไม่เปลี่ยนแปลง

สำหรับการติดตั้ง npm ให้ส่งข้อกำหนดแพ็กเกจอย่างชัดเจนเพื่อเปลี่ยน
ระเบียนที่ติดตาม:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

คำสั่งที่สองจะย้าย Plugin กลับไปยังสายรุ่นเริ่มต้นของรีจิสทรี
หากก่อนหน้านี้ถูกปักหมุดไว้กับเวอร์ชันหรือแท็กที่แน่นอน

โปรดดู [`openclaw plugins`](/th/cli/plugins#update) สำหรับกฎทางเลือกสำรองและ
การปักหมุดโดยละเอียด

## ถอนการติดตั้ง Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

การถอนการติดตั้งจะนำรายการกำหนดค่าของ Plugin ระเบียนดัชนี Plugin ที่จัดเก็บถาวร
รายการอนุญาต/ปฏิเสธ และรายการ `plugins.load.paths` ที่ลิงก์ไว้ออกเมื่อ
เกี่ยวข้อง ไดเรกทอรีติดตั้งที่มีการจัดการจะถูกนำออก เว้นแต่จะส่ง
`--keep-files` Gateway ที่มีการจัดการและกำลังทำงานจะรีสตาร์ตอัตโนมัติเมื่อ
การถอนการติดตั้งเปลี่ยนแหล่งของ Plugin

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การติดตั้ง อัปเดต ถอนการติดตั้ง
เปิดใช้ และปิดใช้ Plugin จะถูกปิดทั้งหมด ให้จัดการตัวเลือกเหล่านั้นในซอร์ส Nix
ของการติดตั้งแทน

## เลือกแหล่ง

| แหล่ง       | ใช้เมื่อ                                                                      | ตัวอย่าง                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | ต้องการการค้นหาแบบเนทีฟของ OpenClaw สรุปการสแกน เวอร์ชัน และคำแนะนำ          | `openclaw plugins install clawhub:<package>`                   |
| git         | ต้องการ branch, tag หรือ commit จาก repository                              | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| พาธภายในเครื่อง | กำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน                              | `openclaw plugins install --link ./my-plugin`                  |
| ตลาดกลาง    | กำลังติดตั้ง Plugin ตลาดกลางที่เข้ากันได้กับ Claude                           | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | กำลังพิสูจน์อาร์ติแฟกต์แพ็กเกจภายในเครื่องผ่านรูปแบบการติดตั้งของ npm          | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | เผยแพร่แพ็กเกจ JavaScript อยู่แล้ว หรือต้องใช้ dist-tag/รีจิสทรีส่วนตัวของ npm | `openclaw plugins install npm:@acme/openclaw-plugin`           |

การติดตั้งพาธภายในเครื่องที่มีการจัดการต้องเป็นไดเรกทอรีหรือไฟล์เก็บถาวรของ Plugin ให้วาง
ไฟล์ Plugin แบบเดี่ยวไว้ใน `plugins.load.paths` แทนการติดตั้งไฟล์เหล่านั้น
ด้วย `plugins install`

## เผยแพร่ Plugin

ClawHub เป็นพื้นผิวการค้นหาสาธารณะหลักสำหรับ Plugin ของ OpenClaw เผยแพร่
ที่นั่นเมื่อต้องการให้ผู้ใช้ค้นหาข้อมูลเมตาของ Plugin ประวัติเวอร์ชัน ผลการสแกน
รีจิสทรี และคำแนะนำการติดตั้งก่อนติดตั้ง

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugin npm แบบเนทีฟต้องมี manifest ของ Plugin (`openclaw.plugin.json`) พร้อม
ข้อมูลเมตา `package.json` ก่อนเผยแพร่:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

ใช้หน้าเหล่านี้สำหรับสัญญาการเผยแพร่ทั้งหมด แทนการใช้หน้านี้
เป็นเอกสารอ้างอิงการเผยแพร่:

- [การเผยแพร่บน ClawHub](/th/clawhub/publishing) อธิบายเจ้าของ ขอบเขต
  รุ่น การตรวจสอบ การตรวจสอบความถูกต้องของแพ็กเกจ และการโอนแพ็กเกจ
- [การสร้าง Plugin](/th/plugins/building-plugins) แสดงโครงสร้างแพ็กเกจ
  Plugin ทั้งหมด (รวมถึง `openclaw.plugin.json`) และเวิร์กโฟลว์
  การเผยแพร่ครั้งแรก
- [Manifest ของ Plugin](/th/plugins/manifest) กำหนดฟิลด์ manifest
  ของ Plugin แบบเนทีฟ

หากแพ็กเกจเดียวกันมีทั้งใน ClawHub และ npm ให้ใช้คำนำหน้า
`clawhub:` หรือ `npm:` อย่างชัดเจนเพื่อบังคับเลือกแหล่งใดแหล่งหนึ่ง

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin) - ติดตั้ง กำหนดค่า รีสตาร์ต และแก้ไขปัญหา
- [`openclaw plugins`](/th/cli/plugins) - เอกสารอ้างอิง CLI ฉบับเต็ม
- [Plugin จากชุมชน](/th/plugins/community) - การค้นหาสาธารณะและการเผยแพร่บน ClawHub
- [ClawHub](/th/clawhub/cli) - การดำเนินการ CLI ของรีจิสทรี
- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้างแพ็กเกจ Plugin
- [Manifest ของ Plugin](/th/plugins/manifest) - manifest และข้อมูลเมตาของแพ็กเกจ
