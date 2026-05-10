---
read_when:
    - การทดสอบโฟลว์การเริ่มต้นใช้งานหรือการตั้งค่ากับ Plugin ที่แพ็กไว้ในเครื่อง
    - การตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่
    - แทนที่การติดตั้ง Plugin อัตโนมัติด้วยอาร์ติแฟกต์ทดสอบ
sidebarTitle: Install overrides
summary: ทดสอบการแทนที่ Plugin ที่แพ็กเกจไว้ด้วยโฟลว์การติดตั้งในช่วงตั้งค่า
title: การแทนที่การติดตั้ง Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

การแทนที่การติดตั้ง Plugin ช่วยให้ผู้ดูแลทดสอบการติดตั้ง Plugin ในช่วงตั้งค่าเทียบกับ
แพ็กเกจ npm เฉพาะหรือ tarball จาก `npm-pack` ในเครื่องได้ สิ่งนี้มีไว้สำหรับการตรวจสอบ
E2E และแพ็กเกจเท่านั้น ผู้ใช้ทั่วไปควรติดตั้ง Plugin ด้วย
[`openclaw plugins install`](/th/cli/plugins)

<Warning>
การแทนที่จะรันโค้ด Plugin จากแหล่งที่คุณระบุ ใช้เฉพาะในไดเรกทอรีสถานะที่แยกไว้
หรือเครื่องทดสอบที่ทิ้งได้เท่านั้น
</Warning>

## สภาพแวดล้อม

การแทนที่จะถูกปิดใช้งาน เว้นแต่จะตั้งค่าทั้งสองตัวแปร:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

แมปการแทนที่เป็น JSON ที่ใช้รหัส Plugin เป็นคีย์ ค่ารองรับ:

- `npm:<registry-spec>` สำหรับแพ็กเกจ registry และเวอร์ชันหรือแท็กที่เจาะจง
- `npm-pack:<path.tgz>` สำหรับ tarball ในเครื่องที่สร้างโดย `npm pack`

พาธ `npm-pack:` แบบสัมพัทธ์จะ resolve จากไดเรกทอรีทำงานปัจจุบัน

## ลักษณะการทำงาน

เมื่อโฟลว์ช่วงตั้งค่าขอติดตั้ง Plugin ที่มีรหัสปรากฏในแมป
OpenClaw จะใช้แหล่งการแทนที่แทนแหล่งจากแค็ตตาล็อก แบบ bundled หรือ npm
ค่าเริ่มต้น สิ่งนี้ใช้กับ onboarding และโฟลว์อื่น ๆ ที่ใช้ตัวติดตั้ง Plugin
ช่วงตั้งค่าที่ใช้ร่วมกัน

การแทนที่จะยังบังคับใช้รหัส Plugin ที่คาดไว้ tarball ที่แมปกับ `codex`
ต้องติดตั้ง Plugin ที่มีรหัส manifest เป็น `codex`

การแทนที่จะไม่สืบทอดสถานะ trusted-source อย่างเป็นทางการ แม้เมื่อรายการแค็ตตาล็อก
ปกติแทนแพ็กเกจที่ OpenClaw เป็นเจ้าของ การแทนที่จะถูกถือว่าเป็นอินพุตทดสอบ
ที่ผู้ปฏิบัติงานระบุ

ไฟล์ `.env` ของ workspace ไม่สามารถเปิดใช้การแทนที่การติดตั้งได้ ให้ตั้งค่าตัวแปรเหล่านี้ใน
shell ที่เชื่อถือได้, งาน CI, หรือคำสั่งทดสอบระยะไกลที่เปิดใช้ OpenClaw

## แพ็กเกจ E2E

ใช้ไดเรกทอรีสถานะที่แยกไว้เพื่อให้การติดตั้งแพ็กเกจและเรคคอร์ดการติดตั้งไม่
แตะต้องสถานะ OpenClaw ปกติของคุณ:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

ตรวจสอบแพ็กเกจที่ติดตั้งไว้ภายใต้ไดเรกทอรีสถานะ:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

สำหรับ E2E ของผู้ให้บริการแบบ live ให้ source คีย์ API จริงจาก shell ที่เชื่อถือได้หรือ secret ของ CI
ก่อนเปิดใช้คำสั่งทดสอบ อย่าพิมพ์คีย์; รายงานเฉพาะแหล่งที่มาและ
มีคีย์อยู่หรือไม่เท่านั้น
