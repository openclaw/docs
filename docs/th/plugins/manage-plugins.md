---
read_when:
    - คุณต้องการตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต หรือถอนการติดตั้ง Plugin
    - คุณต้องการเลือกว่าจะเผยแพร่ Plugin ผ่าน ClawHub หรือ npm
    - คุณกำลังเผยแพร่แพ็กเกจ Plugin
sidebarTitle: Manage plugins
summary: ตัวอย่างสั้น ๆ สำหรับการติดตั้ง การแสดงรายการ การถอนการติดตั้ง การอัปเดต และการเผยแพร่ Plugin ของ OpenClaw
title: จัดการ Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

เวิร์กโฟลว์ Plugin ส่วนใหญ่ใช้เพียงไม่กี่คำสั่ง: ค้นหา ติดตั้ง รีสตาร์ท Gateway ตรวจสอบ และถอนการติดตั้งเมื่อคุณไม่ต้องใช้ Plugin นั้นแล้ว.

## แสดงรายการ Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--json` สำหรับสคริปต์ ซึ่งรวม diagnostics ของรีจิสทรีและ `dependencyStatus`
แบบคงที่ของ Plugin แต่ละตัว เมื่อแพ็กเกจ Plugin ประกาศ `dependencies` หรือ
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` เป็นการตรวจสอบคลังรายการแบบ cold inventory โดยแสดงสิ่งที่ OpenClaw ค้นพบได้
จาก config, manifests และรีจิสทรี Plugin; คำสั่งนี้ไม่ได้พิสูจน์ว่า
กระบวนการ Gateway ที่กำลังรันอยู่นำเข้า runtime ของ Plugin แล้ว.

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
openclaw plugins install npm:@openclaw/codex@beta

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

ใช้ `inspect --runtime` เมื่อคุณต้องการหลักฐานว่า Plugin ได้ลงทะเบียนพื้นผิว runtime
เช่น tools, hooks, services, เมธอดของ Gateway หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของ.

## อัปเดต Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

หาก Plugin ติดตั้งจาก npm dist-tag เช่น `@beta` การเรียก
`update <plugin-id>` ในภายหลังจะใช้แท็กที่บันทึกไว้นั้นซ้ำ การส่ง npm spec แบบชัดเจน
จะสลับการติดตั้งที่ติดตามไว้ไปใช้ spec นั้นสำหรับการอัปเดตในอนาคต.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

คำสั่งที่สองย้าย Plugin กลับไปยังสายรุ่นเริ่มต้นของรีจิสทรี
เมื่อก่อนหน้านี้ถูกปักไว้กับเวอร์ชันหรือแท็กที่เจาะจง.

เมื่อ `openclaw update` รันบนช่อง beta ระเบียน Plugin ของ npm และ ClawHub
ที่อยู่บนสายเริ่มต้นจะลองใช้รุ่น `@beta` ของ Plugin ที่ตรงกันก่อน หากรุ่น beta
นั้นไม่มีอยู่ OpenClaw จะถอยกลับไปใช้ default/latest spec ที่บันทึกไว้
เวอร์ชันที่เจาะจงและแท็กแบบชัดเจน เช่น `@rc` หรือ `@beta` จะถูกคงไว้.

## ถอนการติดตั้ง Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

การถอนการติดตั้งจะลบ config entry ของ Plugin, ระเบียนดัชนี Plugin, รายการ allow/deny list
และ linked load paths เมื่อเกี่ยวข้อง ไดเรกทอรีติดตั้งที่จัดการไว้จะถูกลบ
เว้นแต่คุณส่ง `--keep-files`.

## เผยแพร่ Plugin

คุณสามารถเผยแพร่ Plugin ภายนอกไปยัง [ClawHub](https://clawhub.ai), npmjs.com หรือ
ทั้งสองที่ได้.

### เผยแพร่ไปยัง ClawHub

ClawHub เป็นพื้นผิวค้นพบสาธารณะหลักสำหรับ Plugin ของ OpenClaw ซึ่งให้
metadata ที่ค้นหาได้, ประวัติเวอร์ชัน และผลลัพธ์การสแกนรีจิสทรีแก่ผู้ใช้ก่อน
ติดตั้ง.

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

รูปแบบ bare ยังคงตรวจสอบ ClawHub ก่อน.

### เผยแพร่ไปยัง npmjs.com

Plugin npm แบบ native ต้องมี manifest ของ Plugin และ metadata entrypoint ของ OpenClaw
ใน `package.json`.

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
บังคับให้ resolve ผ่าน npm.

## การเลือกแหล่งที่มา

- **ClawHub**: ใช้เมื่อคุณต้องการการค้นพบแบบ native ของ OpenClaw, สรุปการสแกน,
  เวอร์ชัน และคำแนะนำการติดตั้ง.
- **npmjs.com**: ใช้เมื่อคุณจัดส่งแพ็กเกจ JavaScript อยู่แล้ว หรือต้องใช้เวิร์กโฟลว์
  npm dist-tags/รีจิสทรีส่วนตัว.
- **Git**: ใช้เมื่อคุณต้องการติดตั้งโดยตรงจาก branch, tag หรือ commit.
- **Local path**: ใช้เมื่อคุณกำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน.

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin) - ภาพรวมและการแก้ปัญหา
- [`openclaw plugins`](/th/cli/plugins) - เอกสารอ้างอิง CLI ฉบับเต็ม
- [ClawHub](/th/tools/clawhub) - การเผยแพร่และการดำเนินการกับรีจิสทรี
- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้างแพ็กเกจ Plugin
- [manifest ของ Plugin](/th/plugins/manifest) - manifest และ metadata ของแพ็กเกจ
