---
doc-schema-version: 1
read_when:
    - คุณต้องการเรียกดู ติดตั้ง เปิดใช้งาน หรือปิดใช้งาน Plugin ใน UI การควบคุม
    - คุณต้องการตัวอย่างสั้น ๆ สำหรับการแสดงรายการ Plugin การติดตั้ง การอัปเดต การตรวจสอบ หรือการถอนการติดตั้ง
    - คุณต้องการเลือกแหล่งที่มาสำหรับติดตั้ง Plugin
    - คุณต้องการเอกสารอ้างอิงที่ถูกต้องสำหรับการเผยแพร่แพ็กเกจ Plugin
sidebarTitle: Manage plugins
summary: จัดการ Plugin ของ OpenClaw จาก UI ควบคุมหรือ CLI
title: จัดการ Plugin
x-i18n:
    generated_at: "2026-07-12T16:24:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI ครอบคลุมเวิร์กโฟลว์ทั่วไปสำหรับการค้นหา ติดตั้ง เปิดใช้งาน และปิดใช้งาน
ส่วน CLI เพิ่มความสามารถในการอัปเดต ถอนการติดตั้ง กำหนดค่าขั้นสูง และควบคุม
แหล่งติดตั้งอย่างชัดเจน สำหรับสัญญาคำสั่งทั้งหมด แฟล็ก กฎการเลือกแหล่ง
และกรณีขอบ โปรดดู [`openclaw plugins`](/th/cli/plugins)

เวิร์กโฟลว์ CLI ทั่วไป: ค้นหาแพ็กเกจ ติดตั้งจาก ClawHub, npm, git หรือ
พาธภายในเครื่อง ปล่อยให้ Gateway ที่มีการจัดการรีสตาร์ตโดยอัตโนมัติ (หรือรีสตาร์ตด้วยตนเอง)
จากนั้นตรวจสอบการลงทะเบียนรันไทม์ของ Plugin

## ใช้ Control UI

เปิด **Plugins** ใน Control UI หรือใช้ `/settings/plugins` ต่อท้ายพาธฐาน
ของ Control UI ที่กำหนดค่าไว้ ตัวอย่างเช่น พาธฐาน `/openclaw` จะใช้
`/openclaw/settings/plugins` หน้านี้มีสองแท็บ:

- **ติดตั้งแล้ว** แสดงรายการทั้งหมดในเครื่องโดยจัดกลุ่มตามหมวดหมู่ (ช่องทาง
  ผู้ให้บริการโมเดล หน่วยความจำ เครื่องมือ) แต่ละแถวเปิดมุมมองรายละเอียด เมนูรายการเพิ่มเติม
  (`…`) ใช้เปิดหรือปิด Plugin และสำหรับ Plugin ที่ติดตั้งจากภายนอก
  จะมีตัวเลือก **ลบ** แท็บนี้ยังแสดงรายการ
  [เซิร์ฟเวอร์ MCP](/th/cli/mcp) ที่กำหนดค่าไว้ พร้อมการเปิด ปิด และลบ
  ผ่านเมนูในรูปแบบเดียวกัน โดยแก้ไข `mcp.servers` ในการกำหนดค่า Gateway
- **ค้นพบ** คือร้านค้า: Plugin แนะนำที่มาพร้อมกับ OpenClaw, Plugin ภายนอก
  อย่างเป็นทางการ และชั้นรวมตัวเชื่อมต่อที่ผ่านการคัดสรร การ์ดตัวเชื่อมต่อจะเพิ่ม
  เซิร์ฟเวอร์ MCP แบบโฮสต์ได้ด้วยคลิกเดียว (GitHub, Notion, Linear, Sentry,
  Home Assistant) หรือไปยังการค้นหา ClawHub ที่กรอกไว้ล่วงหน้า การพิมพ์ในช่องค้นหา
  จะค้นหา [ClawHub](https://clawhub.ai/plugins) ภายในหน้าและเพิ่มส่วน **จาก
  ClawHub** พร้อมจำนวนการดาวน์โหลดและป้ายยืนยันแหล่งที่มา

Plugin ที่มาพร้อมระบบไม่จำเป็นต้องติดตั้งแพ็กเกจ การดำเนินการในเมนูคือ **เปิดใช้งาน**
หรือ **ปิดใช้งาน** ตัวอย่างเช่น Workboard มาพร้อมกับ OpenClaw และถูกปิดใช้งาน
โดยค่าเริ่มต้น ดังนั้นให้เลือก **เปิดใช้งาน** เพื่อเปิดใช้ Plugin ที่รวมมาในชุด
ไม่สามารถลบได้ ทำได้เพียงปิดใช้งานเท่านั้น

การเข้าถึงแค็ตตาล็อกและการค้นหาต้องมี `operator.read` การติดตั้ง เปิดใช้งาน ปิดใช้งาน
ลบ และเปลี่ยนแปลงเซิร์ฟเวอร์ MCP ต้องมี `operator.admin` การติดตั้งจาก ClawHub
ดำเนินการโดย Gateway และยังคงใช้การตรวจสอบนโยบายความน่าเชื่อถือ ความสมบูรณ์
และการติดตั้ง Plugin

การติดตั้งหรือลบโค้ด Plugin ต้องรีสตาร์ต Gateway การเปลี่ยนแปลงสถานะการเปิดใช้งาน
สามารถนำไปใช้ได้โดยไม่ต้องรีสตาร์ต เมื่อ Plugin ที่ติดตั้งและรันไทม์ Gateway ปัจจุบัน
รองรับ มิฉะนั้น UI จะแจ้งว่าจำเป็นต้องรีสตาร์ต ตัวเชื่อมต่อ MCP ที่ใช้ OAuth
ยังคงต้องเรียก `openclaw mcp login <name>` หนึ่งครั้งจาก CLI หลังจากเพิ่มแล้ว

Control UI ไม่รองรับการติดตั้งจากแหล่ง npm, git หรือพาธภายในเครื่องใด ๆ
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
การกำหนดค่า แมนิเฟสต์ และรีจิสทรี Plugin ที่จัดเก็บถาวร คำสั่งนี้ไม่ได้พิสูจน์ว่า
Gateway ที่กำลังทำงานได้นำเข้ารันไทม์ Plugin แล้ว เอาต์พุต JSON มี
ข้อมูลวินิจฉัยรีจิสทรีและ `dependencyStatus` ของแต่ละ Plugin (ระบุว่า
`dependencies`/`optionalDependencies` ที่ประกาศไว้สามารถแก้ไขตำแหน่งบนดิสก์ได้หรือไม่)

`plugins search` ค้นหาแพ็กเกจ Plugin ที่ติดตั้งได้จาก ClawHub และแสดง
คำแนะนำการติดตั้ง (`openclaw plugins install clawhub:<package>`) สำหรับแต่ละผลลัพธ์

## เปิดใช้งานและปิดใช้งาน Plugin

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

สลับรายการกำหนดค่าของ Plugin โดยไม่แก้ไขไฟล์ที่ติดตั้ง Plugin บางตัว
ที่รวมมาในชุด (ผู้ให้บริการโมเดล/เสียงพูดที่รวมมาในชุด และ Plugin เบราว์เซอร์ที่รวมมาในชุด)
จะเปิดใช้งานโดยค่าเริ่มต้น ส่วน Plugin อื่นต้องใช้ `enable` หลังการติดตั้ง

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

# ติดตั้งจาก git หรือเช็กเอาต์เพื่อการพัฒนาภายในเครื่อง
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

ข้อกำหนดแพ็กเกจที่ไม่มีคำนำหน้าจะติดตั้งจาก npm ระหว่างการเปลี่ยนผ่านตอนเริ่มใช้งาน
เว้นแต่ชื่อจะตรงกับรหัส Plugin ที่รวมมาในชุดหรือเป็นทางการ ซึ่งในกรณีนั้น OpenClaw
จะใช้สำเนาภายในเครื่อง/อย่างเป็นทางการแทน ใช้ `clawhub:`, `npm:`, `git:` หรือ
`npm-pack:` เพื่อเลือกแหล่งที่มาอย่างแน่นอน

ใช้ `--force` เฉพาะเมื่อต้องการเขียนทับเป้าหมายการติดตั้งเดิมจากแหล่งอื่น
สำหรับการอัปเกรดตามปกติของการติดตั้ง npm, ClawHub หรือ hook-pack ที่ติดตามอยู่
ให้ใช้ `openclaw plugins update` แทน `--force` ไม่รองรับการใช้ร่วมกับ
`--link`

## รีสตาร์ตและตรวจสอบ

Gateway ที่มีการจัดการและกำลังทำงานโดยเปิดใช้งานการโหลดการกำหนดค่าใหม่ จะรีสตาร์ต
โดยอัตโนมัติหลังจากติดตั้ง อัปเดต หรือถอนการติดตั้งโค้ด Plugin หาก Gateway
ไม่มีการจัดการหรือปิดใช้งานการโหลดใหม่ ให้รีสตาร์ตด้วยตนเองก่อนตรวจสอบ
พื้นผิวรันไทม์ที่ทำงานจริง:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` โหลดโมดูล Plugin และพิสูจน์ว่าโมดูลได้ลงทะเบียนพื้นผิวรันไทม์
(เครื่องมือ ฮุก บริการ เมธอด Gateway เส้นทาง HTTP คำสั่ง CLI
ที่ Plugin เป็นเจ้าของ) ส่วน `inspect` และ `list` แบบปกติเป็นเพียงการตรวจสอบ
แมนิเฟสต์/การกำหนดค่า/รีจิสทรีแบบไม่โหลดรันไทม์

## อัปเดต Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

การส่งรหัส Plugin จะนำข้อกำหนดการติดตั้งที่ติดตามไว้กลับมาใช้ใหม่ โดย dist-tag
ที่จัดเก็บไว้ (`@beta`) และเวอร์ชันที่ตรึงแบบเจาะจงจะถูกใช้ต่อในการเรียก
`update <plugin-id>` ครั้งถัดไป

`openclaw plugins update --all` เป็นเส้นทางการบำรุงรักษาแบบกลุ่ม คำสั่งนี้ยังคง
เคารพข้อกำหนดการติดตั้งที่ติดตามไว้ตามปกติ แต่ระเบียน Plugin OpenClaw อย่างเป็นทางการ
ที่เชื่อถือได้จะซิงค์ไปยังเป้าหมายแค็ตตาล็อกอย่างเป็นทางการปัจจุบัน แทนที่จะ
ตรึงอยู่กับแพ็กเกจอย่างเป็นทางการเวอร์ชันเก่าที่ระบุไว้แบบเจาะจง เมื่อ `update.channel`
เป็น `beta` การซิงค์นั้นจะเลือกสายรุ่นเบต้าก่อน ใช้
`update <plugin-id>` แบบระบุเป้าหมายเพื่อคงข้อกำหนดอย่างเป็นทางการแบบเจาะจง
หรือแบบมีแท็กไว้โดยไม่เปลี่ยนแปลง

สำหรับการติดตั้งจาก npm ให้ส่งข้อกำหนดแพ็กเกจอย่างชัดเจนเพื่อเปลี่ยนระเบียน
ที่ติดตาม:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

คำสั่งที่สองจะย้าย Plugin กลับไปยังสายรุ่นเริ่มต้นของรีจิสทรี เมื่อก่อนหน้านี้
ถูกตรึงไว้กับเวอร์ชันหรือแท็กที่ระบุอย่างเจาะจง

โปรดดู [`openclaw plugins`](/th/cli/plugins#update) สำหรับกฎการใช้ทางเลือกสำรอง
และการตรึงเวอร์ชันที่แน่นอน

## ถอนการติดตั้ง Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

การถอนการติดตั้งจะลบรายการกำหนดค่าของ Plugin ระเบียนดัชนี Plugin ที่จัดเก็บถาวร
รายการในรายชื่ออนุญาต/ปฏิเสธ และรายการ `plugins.load.paths` ที่เชื่อมโยงไว้
เมื่อเกี่ยวข้อง ไดเรกทอรีการติดตั้งที่มีการจัดการจะถูกลบ เว้นแต่จะส่ง
`--keep-files` Gateway ที่มีการจัดการและกำลังทำงานจะรีสตาร์ตโดยอัตโนมัติ
เมื่อการถอนการติดตั้งเปลี่ยนแหล่งที่มาของ Plugin

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การติดตั้ง อัปเดต ถอนการติดตั้ง
เปิดใช้งาน และปิดใช้งาน Plugin จะถูกปิดทั้งหมด ให้จัดการตัวเลือกเหล่านั้น
ในซอร์ส Nix ของการติดตั้งแทน

## เลือกแหล่งที่มา

| แหล่งที่มา | ใช้เมื่อ                                                                      | ตัวอย่าง                                                        |
| ----------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | คุณต้องการการค้นหาแบบเนทีฟของ OpenClaw สรุปผลการสแกน เวอร์ชัน และคำแนะนำ    | `openclaw plugins install clawhub:<package>`                   |
| git         | คุณต้องการแบรนช์ แท็ก หรือคอมมิตจากรีโพซิทอรี                                | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| พาธภายในเครื่อง | คุณกำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน                         | `openclaw plugins install --link ./my-plugin`                  |
| มาร์เก็ตเพลส | คุณกำลังติดตั้ง Plugin จากมาร์เก็ตเพลสที่เข้ากันได้กับ Claude                | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | คุณกำลังพิสูจน์อาร์ติแฟกต์แพ็กเกจภายในเครื่องผ่านรูปแบบการติดตั้งของ npm     | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | คุณเผยแพร่แพ็กเกจ JavaScript อยู่แล้ว หรือต้องใช้ dist-tag/รีจิสทรีส่วนตัวของ npm | `openclaw plugins install npm:@acme/openclaw-plugin`           |

การติดตั้งจากพาธภายในเครื่องที่มีการจัดการต้องเป็นไดเรกทอรีหรือไฟล์เก็บถาวรของ Plugin
ให้นำไฟล์ Plugin แบบเดี่ยวไปไว้ใน `plugins.load.paths` แทนการติดตั้งด้วย
`plugins install`

## เผยแพร่ Plugin

ClawHub เป็นพื้นผิวหลักสำหรับการค้นหา Plugin OpenClaw แบบสาธารณะ เผยแพร่ที่นั่น
เมื่อคุณต้องการให้ผู้ใช้ค้นพบเมทาดาทาของ Plugin ประวัติเวอร์ชัน ผลการสแกนรีจิสทรี
และคำแนะนำการติดตั้งก่อนที่จะติดตั้ง

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugin npm แบบเนทีฟต้องมีแมนิเฟสต์ Plugin (`openclaw.plugin.json`) พร้อมกับ
เมทาดาทา `package.json` ก่อนเผยแพร่:

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

ใช้หน้าเหล่านี้สำหรับสัญญาการเผยแพร่ฉบับเต็ม แทนการถือว่าหน้านี้
เป็นเอกสารอ้างอิงสำหรับการเผยแพร่:

- [การเผยแพร่บน ClawHub](/th/clawhub/publishing) อธิบายเจ้าของ ขอบเขต
  รุ่น การตรวจสอบ การตรวจสอบความถูกต้องของแพ็กเกจ และการโอนแพ็กเกจ
- [การสร้าง Plugin](/th/plugins/building-plugins) แสดงโครงสร้างแพ็กเกจ Plugin
  แบบเต็ม (รวมถึง `openclaw.plugin.json`) และเวิร์กโฟลว์การเผยแพร่ครั้งแรก
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) กำหนดฟิลด์แมนิเฟสต์ของ Plugin
  แบบเนทีฟ

หากแพ็กเกจเดียวกันมีทั้งบน ClawHub และ npm ให้ใช้คำนำหน้า
`clawhub:` หรือ `npm:` อย่างชัดเจนเพื่อบังคับใช้แหล่งใดแหล่งหนึ่ง

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin) - ติดตั้ง กำหนดค่า รีสตาร์ต และแก้ไขปัญหา
- [`openclaw plugins`](/th/cli/plugins) - เอกสารอ้างอิง CLI ฉบับเต็ม
- [Plugin ชุมชน](/th/plugins/community) - การค้นหาแบบสาธารณะและการเผยแพร่บน ClawHub
- [ClawHub](/th/clawhub/cli) - การดำเนินการ CLI ของรีจิสทรี
- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้างแพ็กเกจ Plugin
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) - แมนิเฟสต์และเมทาดาทาแพ็กเกจ
