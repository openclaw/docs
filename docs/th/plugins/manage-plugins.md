---
doc-schema-version: 1
read_when:
    - คุณต้องการตัวอย่างอย่างรวดเร็วสำหรับการแสดงรายการ Plugin การติดตั้ง การอัปเดต การตรวจสอบ หรือการถอนการติดตั้ง
    - คุณต้องการเลือกแหล่งติดตั้ง Plugin
    - คุณต้องการเอกสารอ้างอิงที่ถูกต้องสำหรับการเผยแพร่แพ็กเกจ Plugin
sidebarTitle: Manage plugins
summary: ตัวอย่างสั้น ๆ สำหรับการแสดงรายการ การติดตั้ง การอัปเดต การตรวจสอบ และการถอนการติดตั้ง Plugin ของ OpenClaw
title: จัดการ Plugin
x-i18n:
    generated_at: "2026-06-27T17:56:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

ใช้หน้านี้สำหรับคำสั่งจัดการ Plugin ที่พบบ่อย สำหรับสัญญาคำสั่ง
แฟล็ก กฎการเลือกแหล่งที่มา และกรณีขอบทั้งหมดแบบครบถ้วน โปรดดู
[`openclaw plugins`](/th/cli/plugins)

เวิร์กโฟลว์การติดตั้งส่วนใหญ่คือ:

1. ค้นหาแพ็กเกจ
2. ติดตั้งจาก ClawHub, npm, git หรือพาธภายในเครื่อง
3. ปล่อยให้ Gateway ที่จัดการอยู่รีสตาร์ตอัตโนมัติ หรือรีสตาร์ตเองเมื่อไม่ได้จัดการ
4. ตรวจสอบการลงทะเบียนรันไทม์ของ Plugin

## แสดงรายการและค้นหา Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

ใช้ `--json` สำหรับสคริปต์:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` เป็นการตรวจสอบรายการแบบเย็น แสดงสิ่งที่ OpenClaw ค้นพบได้
จาก config, manifest และรีจิสทรีของ Plugin โดยไม่ได้พิสูจน์ว่า
Gateway ที่กำลังทำงานอยู่ได้นำเข้ารันไทม์ของ Plugin แล้ว เอาต์พุต JSON มี
การวินิจฉัยรีจิสทรีและ `dependencyStatus` แบบสแตติกของแต่ละ Plugin เมื่อ
แพ็กเกจ Plugin ประกาศ `dependencies` หรือ `optionalDependencies`

`plugins search` คิวรี ClawHub เพื่อหาแพ็กเกจ Plugin ที่ติดตั้งได้ และพิมพ์
คำแนะนำการติดตั้ง เช่น `openclaw plugins install clawhub:<package>`

## ติดตั้ง Plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

สเปกแพ็กเกจแบบไม่มีคำนำหน้าจะติดตั้งจาก npm ระหว่างการตัดเข้าสู่ระบบใหม่ ใช้ `clawhub:`,
`npm:`, `git:` หรือ `npm-pack:` เมื่อต้องการเลือกแหล่งที่มาแบบกำหนดแน่นอน
ถ้าชื่อแบบไม่มีคำนำหน้าตรงกับรหัส Plugin ทางการ OpenClaw จะติดตั้ง
รายการแคตตาล็อกได้โดยตรง

ใช้ `--force` เฉพาะเมื่อคุณตั้งใจเขียนทับเป้าหมายการติดตั้งที่มีอยู่แล้ว
สำหรับการอัปเกรดตามปกติของการติดตั้ง npm, ClawHub หรือ hook-pack ที่ติดตามอยู่ ให้ใช้
`openclaw plugins update`

## รีสตาร์ตและตรวจสอบ

หลังติดตั้ง อัปเดต หรือถอนการติดตั้งโค้ด Plugin แล้ว Gateway ที่จัดการอยู่
และเปิดใช้การโหลด config ใหม่จะรีสตาร์ตโดยอัตโนมัติ หาก Gateway ไม่ได้ถูกจัดการ
หรือปิดการโหลดใหม่อยู่ ให้รีสตาร์ตด้วยตนเองก่อนตรวจสอบพื้นผิวรันไทม์สด:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

ใช้ `inspect --runtime` เมื่อต้องการหลักฐานว่า Plugin ได้ลงทะเบียนพื้นผิวรันไทม์
เช่น เครื่องมือ hook, service, เมธอด Gateway, เส้นทาง HTTP หรือ
คำสั่ง CLI ที่ Plugin เป็นเจ้าของแล้ว `inspect` และ `list` แบบปกติเป็นการตรวจสอบ manifest,
config และรีจิสทรีแบบเย็น

## อัปเดต Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

เมื่อส่งรหัส Plugin OpenClaw จะใช้สเปกการติดตั้งที่ติดตามอยู่ซ้ำ
dist-tag ที่จัดเก็บไว้ เช่น `@beta` และเวอร์ชันที่ปักหมุดแบบแน่นอนจะยังถูกใช้ต่อ
ในการรัน `update <plugin-id>` ภายหลัง

`openclaw plugins update --all` เป็นพาธการบำรุงรักษาแบบกลุ่ม โดยยังคงเคารพ
สเปกการติดตั้งที่ติดตามอยู่ตามปกติ แต่ระเบียน Plugin ทางการของ OpenClaw ที่เชื่อถือได้สามารถ
ซิงก์ไปยังเป้าหมายแคตตาล็อกทางการปัจจุบันแทนที่จะค้างอยู่บนแพ็กเกจทางการแบบระบุแน่นอนที่ล้าสมัย
หากตั้งค่า `update.channel` เป็น `beta` การซิงก์ทางการแบบกลุ่มนั้น
จะใช้บริบทของช่อง beta ใช้ `update <plugin-id>` แบบเจาะจงเมื่อคุณ
ตั้งใจคงสเปกทางการแบบระบุแน่นอนหรือแบบแท็กไว้ไม่ให้ถูกแตะต้อง

สำหรับการติดตั้ง npm คุณสามารถส่งสเปกแพ็กเกจอย่างชัดเจนเพื่อสลับระเบียนที่ติดตามอยู่:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

คำสั่งที่สองจะย้าย Plugin กลับไปยังสายรุ่นเริ่มต้นของรีจิสทรี
เมื่อก่อนหน้านี้ถูกปักหมุดไว้กับเวอร์ชันหรือแท็กที่ระบุแน่นอน

เมื่อ `openclaw update` ทำงานบนช่อง beta ระเบียน Plugin อาจเลือก
รุ่น `@beta` ที่ตรงกันก่อน สำหรับกฎ fallback และการปักหมุดแบบละเอียด โปรดดู
[`openclaw plugins`](/th/cli/plugins#update)

## ถอนการติดตั้ง Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

การถอนการติดตั้งจะลบรายการ config ของ Plugin, ระเบียนดัชนี Plugin ที่เก็บถาวร,
รายการ allow/deny และพาธโหลดที่ลิงก์ไว้เมื่อเกี่ยวข้อง ไดเรกทอรีติดตั้งที่จัดการอยู่
จะถูกลบ เว้นแต่คุณจะส่ง `--keep-files` Gateway ที่จัดการอยู่และกำลังทำงาน
จะรีสตาร์ตโดยอัตโนมัติเมื่อการถอนการติดตั้งเปลี่ยนแหล่งที่มาของ Plugin

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) คำสั่งติดตั้ง อัปเดต ถอนการติดตั้ง เปิดใช้
และปิดใช้ Plugin จะถูกปิดใช้งาน ให้จัดการตัวเลือกเหล่านั้นในซอร์ส Nix สำหรับ
การติดตั้งแทน

## เลือกแหล่งที่มา

| แหล่งที่มา | ใช้เมื่อ | ตัวอย่าง |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | คุณต้องการการค้นพบแบบ OpenClaw-native, สรุปการสแกน, เวอร์ชัน และคำแนะนำ     | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | คุณส่งแพ็กเกจ JavaScript อยู่แล้ว หรือต้องใช้ npm dist-tag/รีจิสทรีส่วนตัว | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | คุณต้องการ branch, tag หรือ commit จากรีโพสิทอรี                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| พาธภายในเครื่อง  | คุณกำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน                  | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | คุณกำลังพิสูจน์ artifact ของแพ็กเกจภายในเครื่องผ่าน semantics การติดตั้ง npm      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | คุณกำลังติดตั้ง Plugin marketplace ที่เข้ากันได้กับ Claude                   | `openclaw plugins install <plugin> --marketplace <source>`     |

การติดตั้งพาธภายในเครื่องแบบจัดการต้องเป็นไดเรกทอรีหรือ archive ของ Plugin ใส่
ไฟล์ Plugin แบบสแตนด์อโลนใน `plugins.load.paths` แทนการติดตั้งด้วย
`plugins install`

## เผยแพร่ Plugin

ClawHub เป็นพื้นผิวค้นพบสาธารณะหลักสำหรับ Plugin ของ OpenClaw เผยแพร่
ที่นั่นเมื่อคุณต้องการให้ผู้ใช้พบ metadata ของ Plugin, ประวัติเวอร์ชัน, ผลการสแกนรีจิสทรี
และคำแนะนำการติดตั้งก่อนที่พวกเขาจะติดตั้ง

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugin แบบ native npm ต้องมี manifest ของ Plugin และ metadata ของแพ็กเกจก่อน
เผยแพร่:

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

ใช้หน้าเหล่านี้สำหรับสัญญาการเผยแพร่แบบเต็ม แทนการถือว่าหน้านี้
เป็นเอกสารอ้างอิงการเผยแพร่:

- [การเผยแพร่ ClawHub](/th/clawhub/publishing) อธิบายเจ้าของ, scope, release,
  review, การตรวจสอบแพ็กเกจ และการโอนแพ็กเกจ
- [การสร้าง Plugin](/th/plugins/building-plugins) แสดงรูปแบบแพ็กเกจ Plugin
  และเวิร์กโฟลว์เผยแพร่ครั้งแรก
- [manifest ของ Plugin](/th/plugins/manifest) กำหนดฟิลด์ manifest ของ Plugin แบบ native

หากแพ็กเกจเดียวกันมีทั้งบน ClawHub และ npm ให้ใช้คำนำหน้า
`clawhub:` หรือ `npm:` อย่างชัดเจนเมื่อต้องการบังคับใช้แหล่งที่มาหนึ่ง

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin) - ติดตั้ง กำหนดค่า รีสตาร์ต และแก้ไขปัญหา
- [`openclaw plugins`](/th/cli/plugins) - เอกสารอ้างอิง CLI แบบเต็ม
- [Plugin ชุมชน](/th/plugins/community) - การค้นพบสาธารณะและการเผยแพร่บน ClawHub
- [ClawHub](/th/clawhub/cli) - การดำเนินการ CLI ของรีจิสทรี
- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้างแพ็กเกจ Plugin
- [manifest ของ Plugin](/th/plugins/manifest) - manifest และ metadata ของแพ็กเกจ
