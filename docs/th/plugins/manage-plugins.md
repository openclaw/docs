---
read_when:
    - คุณต้องการตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต หรือถอนการติดตั้ง Plugin
    - คุณต้องการเลือกระหว่าง ClawHub กับการเผยแพร่ Plugin ผ่าน npm
    - คุณกำลังเผยแพร่แพ็กเกจ Plugin
sidebarTitle: Manage plugins
summary: ตัวอย่างสั้น ๆ สำหรับการติดตั้ง การแสดงรายการ การถอนการติดตั้ง การอัปเดต และการเผยแพร่ Plugin ของ OpenClaw
title: จัดการ Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

เวิร์กโฟลว์ Plugin ส่วนใหญ่ใช้เพียงไม่กี่คำสั่ง: ค้นหา ติดตั้ง รีสตาร์ท Gateway
ตรวจสอบ และถอนการติดตั้งเมื่อคุณไม่ต้องการ Plugin แล้ว

## แสดงรายการ Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--json` สำหรับสคริปต์ ซึ่งรวมข้อมูลวินิจฉัยรีจิสทรีและ
`dependencyStatus` แบบคงที่ของแต่ละ Plugin เมื่อแพ็กเกจ Plugin ประกาศ `dependencies` หรือ
`optionalDependencies`

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` เป็นการตรวจสอบคลังรายการแบบเย็น โดยแสดงสิ่งที่ OpenClaw ค้นพบได้
จากการกำหนดค่า manifest และรีจิสทรี Plugin แต่ไม่ได้พิสูจน์ว่า
โปรเซส Gateway ที่กำลังทำงานอยู่ได้นำเข้ารันไทม์ของ Plugin แล้ว

## ติดตั้ง Plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

หลังจากติดตั้งโค้ด Plugin แล้ว ให้รีสตาร์ท Gateway ที่ให้บริการช่องทางของคุณ:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

ใช้ `inspect --runtime` เมื่อคุณต้องการหลักฐานว่า Plugin ได้ลงทะเบียนพื้นผิวรันไทม์แล้ว
เช่น เครื่องมือ hook บริการ เมธอด Gateway หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของ

## อัปเดต Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

หากติดตั้ง Plugin จาก npm dist-tag เช่น `@beta` การเรียก
`update <plugin-id>` ในภายหลังจะใช้แท็กที่บันทึกไว้นั้นซ้ำ การส่ง npm spec ที่ระบุอย่างชัดเจน
จะเปลี่ยนการติดตั้งที่ติดตามอยู่ให้ใช้ spec นั้นสำหรับการอัปเดตในอนาคต

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

คำสั่งที่สองจะย้าย Plugin กลับไปยังสายรีลีสเริ่มต้นของรีจิสทรี
เมื่อก่อนหน้านี้ถูกตรึงไว้กับเวอร์ชันหรือแท็กที่ระบุชัดเจน

เมื่อ `openclaw update` ทำงานบนช่องทาง beta ระเบียน Plugin ของ npm และ ClawHub
ในสายเริ่มต้นจะลองใช้รีลีส `@beta` ของ Plugin ที่ตรงกันก่อน หากไม่มีรีลีส beta นั้น
OpenClaw จะถอยกลับไปใช้ spec เริ่มต้น/ล่าสุดที่บันทึกไว้
สำหรับ Plugin ของ npm นั้น OpenClaw จะถอยกลับเช่นกันเมื่อมีแพ็กเกจ beta อยู่แต่ไม่ผ่าน
การตรวจสอบความถูกต้องของการติดตั้ง เวอร์ชันที่ระบุชัดเจนและแท็กที่ระบุชัดเจน เช่น `@rc` หรือ `@beta`
จะยังคงถูกเก็บไว้

## ถอนการติดตั้ง Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

การถอนการติดตั้งจะลบรายการกำหนดค่าของ Plugin ระเบียนดัชนี Plugin รายการ allow/deny list
และเส้นทางโหลดที่ลิงก์ไว้เมื่อเกี่ยวข้อง ไดเรกทอรีติดตั้งที่จัดการไว้จะถูกลบ
เว้นแต่คุณจะส่ง `--keep-files`

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) คำสั่งติดตั้ง อัปเดต ถอนการติดตั้ง เปิดใช้งาน
และปิดใช้งาน Plugin จะถูกปิดใช้งาน ให้จัดการตัวเลือกเหล่านั้นในซอร์ส Nix สำหรับ
การติดตั้งแทน สำหรับ nix-openclaw ให้ใช้
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบเริ่มจากเอเจนต์

## เผยแพร่ Plugin

คุณสามารถเผยแพร่ Plugin ภายนอกไปยัง [ClawHub](https://clawhub.ai), npmjs.com หรือ
ทั้งสองที่ได้

### เผยแพร่ไปยัง ClawHub

ClawHub เป็นพื้นผิวการค้นพบสาธารณะหลักสำหรับ Plugin ของ OpenClaw โดยให้
ผู้ใช้ค้นหาข้อมูลเมตา ประวัติเวอร์ชัน และผลการสแกนรีจิสทรีได้ก่อน
ติดตั้ง

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

ผู้ใช้ติดตั้งจาก ClawHub ด้วย:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

รูปแบบที่ไม่ระบุแหล่งที่มายังคงตรวจสอบ ClawHub ก่อน

### เผยแพร่ไปยัง npmjs.com

Plugin npm แบบเนทีฟต้องมี manifest ของ Plugin และข้อมูลเมตา entrypoint ของ OpenClaw
ใน `package.json`

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
```

ผู้ใช้ติดตั้งแบบ npm เท่านั้นด้วย:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

หากแพ็กเกจเดียวกันมีให้ใช้งานบน ClawHub ด้วย `npm:` จะข้ามการค้นหา ClawHub และ
บังคับใช้การแก้ไขผ่าน npm

## การเลือกแหล่งที่มา

- **ClawHub**: ใช้เมื่อคุณต้องการการค้นพบแบบเนทีฟของ OpenClaw สรุปการสแกน
  เวอร์ชัน และคำแนะนำการติดตั้ง
- **npmjs.com**: ใช้เมื่อคุณจัดส่งแพ็กเกจ JavaScript อยู่แล้ว หรือต้องการเวิร์กโฟลว์
  npm dist-tag/รีจิสทรีส่วนตัว
- **Git**: ใช้เมื่อคุณต้องการติดตั้งโดยตรงจาก branch, tag หรือ commit
- **เส้นทางภายในเครื่อง**: ใช้เมื่อคุณกำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin) - ภาพรวมและการแก้ไขปัญหา
- [`openclaw plugins`](/th/cli/plugins) - เอกสารอ้างอิง CLI ฉบับเต็ม
- [ClawHub](/th/tools/clawhub) - การเผยแพร่และการดำเนินการกับรีจิสทรี
- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้างแพ็กเกจ Plugin
- [manifest ของ Plugin](/th/plugins/manifest) - manifest และข้อมูลเมตาของแพ็กเกจ
