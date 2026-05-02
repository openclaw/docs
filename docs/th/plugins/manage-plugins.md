---
read_when:
    - คุณต้องการตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต หรือถอนการติดตั้ง Plugin
    - คุณต้องการเลือกระหว่าง ClawHub กับการเผยแพร่ Plugin ผ่าน npm
    - คุณกำลังเผยแพร่แพ็กเกจ Plugin
sidebarTitle: Manage plugins
summary: ตัวอย่างสั้น ๆ สำหรับการติดตั้ง การแสดงรายการ การถอนการติดตั้ง การอัปเดต และการเผยแพร่ Plugin ของ OpenClaw
title: จัดการ Plugin
x-i18n:
    generated_at: "2026-05-02T22:19:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

เวิร์กโฟลว์ Plugin ส่วนใหญ่มีเพียงไม่กี่คำสั่ง: ค้นหา ติดตั้ง รีสตาร์ท Gateway
ตรวจสอบ และถอนการติดตั้งเมื่อคุณไม่ต้องการใช้ Plugin นั้นอีกต่อไป

## แสดงรายการ Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--json` สำหรับสคริปต์ ซึ่งรวมการวินิจฉัยรีจิสทรีและ
`dependencyStatus` แบบคงที่ของแต่ละ Plugin เมื่อแพ็กเกจ Plugin ประกาศ
`dependencies` หรือ `optionalDependencies`

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` เป็นการตรวจสอบคลังรายการแบบเย็น โดยแสดงสิ่งที่ OpenClaw ค้นพบได้
จากการกำหนดค่า แมนิเฟสต์ และรีจิสทรี Plugin แต่ไม่ได้พิสูจน์ว่า
โปรเซส Gateway ที่กำลังทำงานอยู่ได้นำเข้า runtime ของ Plugin แล้ว

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

ใช้ `inspect --runtime` เมื่อคุณต้องการหลักฐานว่า Plugin ได้ลงทะเบียนพื้นผิว
runtime เช่น เครื่องมือ hooks บริการ เมธอด Gateway หรือคำสั่ง CLI
ที่ Plugin เป็นเจ้าของ

## อัปเดต Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

หาก Plugin ถูกติดตั้งจาก npm dist-tag เช่น `@beta` การเรียก
`update <plugin-id>` ในภายหลังจะใช้แท็กที่บันทึกไว้นั้นซ้ำ การส่ง npm spec
ที่ระบุชัดเจนจะเปลี่ยนการติดตั้งที่ติดตามอยู่ไปเป็น spec นั้นสำหรับการอัปเดตในอนาคต

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

คำสั่งที่สองจะย้าย Plugin กลับไปยังสายการเผยแพร่เริ่มต้นของรีจิสทรี
เมื่อก่อนหน้านี้เคยตรึงไว้กับเวอร์ชันหรือแท็กที่ระบุแน่นอน

เมื่อ `openclaw update` ทำงานบนช่อง beta รายการ Plugin npm และ ClawHub
ที่อยู่ในสายเริ่มต้นจะลองใช้รุ่น `@beta` ของ Plugin ที่ตรงกันก่อน หากรุ่น beta
นั้นไม่มีอยู่ OpenClaw จะย้อนกลับไปใช้ spec เริ่มต้น/ล่าสุดที่บันทึกไว้
เวอร์ชันที่ระบุแน่นอนและแท็กที่ระบุชัดเจน เช่น `@rc` หรือ `@beta` จะยังคงถูกรักษาไว้

## ถอนการติดตั้ง Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

การถอนการติดตั้งจะลบรายการกำหนดค่าของ Plugin ระเบียนดัชนี Plugin รายการ
allow/deny และพาธโหลดที่ลิงก์ไว้เมื่อเกี่ยวข้อง ไดเรกทอรีติดตั้งที่จัดการอยู่จะถูกลบ
เว้นแต่คุณจะส่ง `--keep-files`

## เผยแพร่ Plugin

คุณสามารถเผยแพร่ Plugin ภายนอกไปยัง [ClawHub](https://clawhub.ai), npmjs.com
หรือทั้งสองที่ได้

### เผยแพร่ไปยัง ClawHub

ClawHub เป็นพื้นผิวค้นพบสาธารณะหลักสำหรับ Plugin ของ OpenClaw โดยให้
เมทาดาทาที่ค้นหาได้ ประวัติเวอร์ชัน และผลการสแกนรีจิสทรีแก่ผู้ใช้ก่อนติดตั้ง

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

รูปแบบเปล่ายังคงตรวจสอบ ClawHub ก่อน

### เผยแพร่ไปยัง npmjs.com

Plugin npm แบบเนทีฟต้องมีแมนิเฟสต์ Plugin และเมทาดาทา entrypoint ของ OpenClaw
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

หากแพ็กเกจเดียวกันมีอยู่บน ClawHub ด้วย `npm:` จะข้ามการค้นหา ClawHub และ
บังคับให้ใช้การแก้ไขผ่าน npm

## การเลือกแหล่งที่มา

- **ClawHub**: ใช้เมื่อคุณต้องการการค้นพบแบบ OpenClaw-native สรุปการสแกน
  เวอร์ชัน และคำแนะนำการติดตั้ง
- **npmjs.com**: ใช้เมื่อคุณจัดส่งแพ็กเกจ JavaScript อยู่แล้ว หรือต้องการ
  เวิร์กโฟลว์ npm dist-tags/รีจิสทรีส่วนตัว
- **Git**: ใช้เมื่อคุณต้องการติดตั้งโดยตรงจาก branch, tag หรือ commit
- **พาธในเครื่อง**: ใช้เมื่อคุณกำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน

## ที่เกี่ยวข้อง

- [Plugins](/th/tools/plugin) - ภาพรวมและการแก้ไขปัญหา
- [`openclaw plugins`](/th/cli/plugins) - ข้อมูลอ้างอิง CLI ฉบับเต็ม
- [ClawHub](/th/tools/clawhub) - การเผยแพร่และการดำเนินงานรีจิสทรี
- [Building plugins](/th/plugins/building-plugins) - สร้างแพ็กเกจ Plugin
- [Plugin manifest](/th/plugins/manifest) - แมนิเฟสต์และเมทาดาทาแพ็กเกจ
