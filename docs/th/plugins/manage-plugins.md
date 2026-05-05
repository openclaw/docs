---
read_when:
    - คุณต้องการตัวอย่างการติดตั้ง แสดงรายการ อัปเดต หรือถอนการติดตั้ง Plugin แบบรวดเร็ว
    - คุณต้องการเลือกระหว่าง ClawHub กับการเผยแพร่ Plugin ผ่าน npm
    - คุณกำลังเผยแพร่แพ็กเกจ Plugin
sidebarTitle: Manage plugins
summary: ตัวอย่างแบบย่อสำหรับการติดตั้ง การแสดงรายการ การถอนการติดตั้ง การอัปเดต และการเผยแพร่ Plugin ของ OpenClaw
title: จัดการ Plugin
x-i18n:
    generated_at: "2026-05-05T01:49:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

เวิร์กโฟลว์ของ Plugin ส่วนใหญ่มีเพียงไม่กี่คำสั่ง: ค้นหา ติดตั้ง รีสตาร์ท Gateway,
ตรวจสอบ และถอนการติดตั้งเมื่อคุณไม่ต้องการใช้ Plugin นั้นแล้ว

## แสดงรายการ Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--json` สำหรับสคริปต์ โดยจะรวมการวินิจฉัยรีจิสทรีและ
`dependencyStatus` แบบคงที่ของแต่ละ Plugin เมื่อแพ็กเกจ Plugin ประกาศ `dependencies` หรือ
`optionalDependencies`

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` เป็นการตรวจสอบรายการสินค้าคงคลังแบบ cold โดยจะแสดงสิ่งที่ OpenClaw ค้นพบได้
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

ใช้ `inspect --runtime` เมื่อคุณต้องการหลักฐานว่า Plugin ได้ลงทะเบียนพื้นผิวรันไทม์
เช่น tools, hooks, services, เมธอด Gateway หรือคำสั่ง CLI
ที่ Plugin เป็นเจ้าของ

## อัปเดต Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

หากติดตั้ง Plugin จาก npm dist-tag เช่น `@beta` การเรียก
`update <plugin-id>` ในภายหลังจะใช้แท็กที่บันทึกไว้นั้นซ้ำ การส่ง npm spec อย่างชัดเจน
จะเปลี่ยนการติดตั้งที่ติดตามอยู่ให้ใช้ spec นั้นสำหรับการอัปเดตในอนาคต

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

คำสั่งที่สองจะย้าย Plugin กลับไปยังสายรีลีสเริ่มต้นของรีจิสทรี
เมื่อก่อนหน้านี้ถูกปักไว้กับเวอร์ชันหรือแท็กที่แน่นอน

เมื่อ `openclaw update` ทำงานบนช่องทาง beta ระเบียน Plugin ของ npm และ ClawHub
ในสายเริ่มต้นจะลองใช้รีลีส `@beta` ของ Plugin ที่ตรงกันก่อน หากไม่มี
รีลีส beta นั้น OpenClaw จะย้อนกลับไปใช้ spec default/latest ที่บันทึกไว้
สำหรับ Plugin npm นั้น OpenClaw จะย้อนกลับเช่นกันเมื่อมีแพ็กเกจ beta อยู่แต่ไม่ผ่าน
การตรวจสอบการติดตั้ง เวอร์ชันที่แน่นอนและแท็กที่ระบุชัดเจน เช่น `@rc` หรือ `@beta`
จะถูกคงไว้

## ถอนการติดตั้ง Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

การถอนการติดตั้งจะลบรายการการกำหนดค่าของ Plugin, ระเบียนดัชนี Plugin, รายการ allow/deny
และพาธการโหลดที่ลิงก์ไว้เมื่อเกี่ยวข้อง ไดเรกทอรีการติดตั้งที่จัดการอยู่จะ
ถูกลบ เว้นแต่คุณจะส่ง `--keep-files`

## เผยแพร่ Plugin

คุณสามารถเผยแพร่ Plugin ภายนอกไปยัง [ClawHub](https://clawhub.ai), npmjs.com หรือ
ทั้งสองที่ได้

### เผยแพร่ไปยัง ClawHub

ClawHub เป็นพื้นผิวการค้นพบสาธารณะหลักสำหรับ Plugin ของ OpenClaw โดยให้
เมทาดาทาที่ค้นหาได้ ประวัติเวอร์ชัน และผลการสแกนรีจิสทรีแก่ผู้ใช้ก่อน
การติดตั้ง

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

รูปแบบ bare จะยังคงตรวจสอบ ClawHub ก่อน

### เผยแพร่ไปยัง npmjs.com

Plugin npm แบบเนทีฟต้องมี manifest ของ Plugin และเมทาดาทา entrypoint ของ OpenClaw
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

ผู้ใช้ติดตั้งแบบ npm-only ด้วย:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

หากแพ็กเกจเดียวกันมีอยู่บน ClawHub ด้วย `npm:` จะข้ามการค้นหา ClawHub และ
บังคับใช้การ resolve ของ npm

## การเลือกแหล่งที่มา

- **ClawHub**: ใช้เมื่อคุณต้องการการค้นพบแบบเนทีฟของ OpenClaw, สรุปการสแกน,
  เวอร์ชัน และคำแนะนำการติดตั้ง
- **npmjs.com**: ใช้เมื่อคุณเผยแพร่แพ็กเกจ JavaScript อยู่แล้ว หรือต้องใช้เวิร์กโฟลว์
  dist-tag/รีจิสทรีส่วนตัวของ npm
- **Git**: ใช้เมื่อคุณต้องการติดตั้งโดยตรงจาก branch, tag หรือ commit
- **พาธในเครื่อง**: ใช้เมื่อคุณกำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน

## ที่เกี่ยวข้อง

- [Plugins](/th/tools/plugin) - ภาพรวมและการแก้ไขปัญหา
- [`openclaw plugins`](/th/cli/plugins) - เอกสารอ้างอิง CLI ฉบับเต็ม
- [ClawHub](/th/tools/clawhub) - การเผยแพร่และการดำเนินการกับรีจิสทรี
- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้างแพ็กเกจ Plugin
- [manifest ของ Plugin](/th/plugins/manifest) - manifest และเมทาดาทาแพ็กเกจ
