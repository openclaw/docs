---
read_when:
    - คุณต้องการตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง แสดงรายการ อัปเดต หรือถอนการติดตั้ง Plugin
    - คุณต้องการเลือกระหว่าง ClawHub กับการเผยแพร่ Plugin ผ่าน npm
    - คุณกำลังเผยแพร่แพ็กเกจ Plugin
sidebarTitle: Manage plugins
summary: ตัวอย่างแบบรวดเร็วสำหรับการติดตั้ง การแสดงรายการ การถอนการติดตั้ง การอัปเดต และการเผยแพร่ Plugin ของ OpenClaw
title: จัดการ Plugin
x-i18n:
    generated_at: "2026-05-10T19:48:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

เวิร์กโฟลว์ Plugin ส่วนใหญ่มีเพียงไม่กี่คำสั่ง: ค้นหา ติดตั้ง รีสตาร์ต Gateway
ตรวจสอบยืนยัน และถอนการติดตั้งเมื่อคุณไม่ต้องการใช้ Plugin นั้นอีกต่อไป

## แสดงรายการ Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

ใช้ `--json` สำหรับสคริปต์ ซึ่งรวมการวินิจฉัยรีจิสทรีและ
`dependencyStatus` แบบคงที่ของแต่ละ Plugin เมื่อแพ็กเกจ Plugin ประกาศ `dependencies` หรือ
`optionalDependencies`

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` เป็นการตรวจสอบรายการแบบเย็น แสดงสิ่งที่ OpenClaw ค้นพบได้
จาก config, manifests และรีจิสทรี Plugin แต่ไม่ได้พิสูจน์ว่า
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

หลังจากติดตั้งโค้ด Plugin แล้ว ให้รีสตาร์ต Gateway ที่ให้บริการช่องทางของคุณ:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

ใช้ `inspect --runtime` เมื่อคุณต้องการหลักฐานว่า Plugin ได้ลงทะเบียนพื้นผิว runtime
เช่น tools, hooks, services, เมธอด Gateway หรือคำสั่ง CLI
ที่ Plugin เป็นเจ้าของ

## อัปเดต Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

หากติดตั้ง Plugin จาก npm dist-tag เช่น `@beta` การเรียก
`update <plugin-id>` ในภายหลังจะใช้แท็กที่บันทึกไว้นั้นซ้ำ การส่ง npm spec แบบชัดเจน
จะเปลี่ยนการติดตั้งที่ติดตามอยู่ไปยัง spec นั้นสำหรับการอัปเดตในอนาคต

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

คำสั่งที่สองจะย้าย Plugin กลับไปยังสายรีลีสเริ่มต้นของรีจิสทรี
เมื่อก่อนหน้านี้ถูกตรึงไว้กับเวอร์ชันหรือแท็กที่แน่นอน

เมื่อ `openclaw update` ทำงานบนช่องทางเบต้า รายการ Plugin ของ npm และ ClawHub
ในสายเริ่มต้นจะลองใช้รีลีส Plugin `@beta` ที่ตรงกันก่อน หากไม่มีรีลีสเบต้านั้น
OpenClaw จะถอยกลับไปใช้ spec เริ่มต้น/ล่าสุดที่บันทึกไว้
สำหรับ Plugin ของ npm OpenClaw จะถอยกลับเช่นกันเมื่อมีแพ็กเกจเบต้าอยู่แต่ไม่ผ่าน
การตรวจสอบความถูกต้องของการติดตั้ง เวอร์ชันที่แน่นอนและแท็กแบบชัดเจน เช่น `@rc` หรือ `@beta`
จะถูกคงไว้

## ถอนการติดตั้ง Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

การถอนการติดตั้งจะลบรายการ config ของ Plugin, ระเบียนดัชนี Plugin, รายการ allow/deny list
และเส้นทางโหลดที่ลิงก์ไว้เมื่อมีผล ไดเรกทอรีการติดตั้งที่จัดการอยู่จะ
ถูกลบออก เว้นแต่คุณจะส่ง `--keep-files`

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) คำสั่งติดตั้ง อัปเดต ถอนการติดตั้ง เปิดใช้
และปิดใช้ Plugin จะถูกปิดใช้งาน ให้จัดการตัวเลือกเหล่านั้นในซอร์ส Nix สำหรับ
การติดตั้งแทน สำหรับ nix-openclaw ให้ใช้
[เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบเน้น agent ก่อน

## เผยแพร่ Plugin

คุณสามารถเผยแพร่ Plugin ภายนอกไปยัง [ClawHub](https://clawhub.ai), npmjs.com หรือ
ทั้งสองที่ได้

### เผยแพร่ไปยัง ClawHub

ClawHub เป็นพื้นผิวการค้นพบสาธารณะหลักสำหรับ Plugin ของ OpenClaw โดยให้
ข้อมูลเมตาที่ค้นหาได้ ประวัติเวอร์ชัน และผลการสแกนรีจิสทรีแก่ผู้ใช้ก่อน
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

รูปแบบเปล่ายังคงตรวจสอบ ClawHub ก่อน

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

ผู้ใช้ติดตั้งเฉพาะ npm ด้วย:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

หากแพ็กเกจเดียวกันมีอยู่บน ClawHub ด้วย `npm:` จะข้ามการค้นหา ClawHub และ
บังคับใช้การแก้ไขผ่าน npm

## การเลือกซอร์ส

- **ClawHub**: ใช้เมื่อคุณต้องการการค้นพบแบบเนทีฟของ OpenClaw, สรุปการสแกน,
  เวอร์ชัน และคำแนะนำการติดตั้ง
- **npmjs.com**: ใช้เมื่อคุณจัดส่งแพ็กเกจ JavaScript อยู่แล้ว หรือต้องการเวิร์กโฟลว์
  npm dist-tags/รีจิสทรีส่วนตัว
- **Git**: ใช้เมื่อคุณต้องการติดตั้งโดยตรงจาก branch, tag หรือ commit
- **เส้นทางภายในเครื่อง**: ใช้เมื่อคุณกำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin) - ภาพรวมและการแก้ไขปัญหา
- [`openclaw plugins`](/th/cli/plugins) - อ้างอิง CLI ฉบับเต็ม
- [ClawHub](/th/clawhub/cli) - การเผยแพร่และการดำเนินการรีจิสทรี
- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้างแพ็กเกจ Plugin
- [manifest ของ Plugin](/th/plugins/manifest) - manifest และข้อมูลเมตาแพ็กเกจ
