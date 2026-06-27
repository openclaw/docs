---
read_when:
    - การทดสอบโฟลว์การเริ่มต้นใช้งานหรือการตั้งค่ากับ Plugin ที่แพ็กไว้ในเครื่อง
    - กำลังตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่
    - การแทนที่การติดตั้ง Plugin อัตโนมัติด้วยอาร์ติแฟกต์ทดสอบ
sidebarTitle: Install overrides
summary: ทดสอบการแทนที่ค่า Plugin ที่แพ็กเกจแล้วด้วยโฟลว์การติดตั้งระหว่างการตั้งค่า
title: การกำหนดทับการติดตั้ง Plugin
x-i18n:
    generated_at: "2026-06-27T17:56:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

การ override การติดตั้ง Plugin ช่วยให้ผู้ดูแลทดสอบการติดตั้ง Plugin ในช่วงตั้งค่ากับ
แพ็กเกจ npm เฉพาะหรือ tarball `npm-pack` ภายในเครื่องได้ ใช้สำหรับ E2E และการตรวจสอบ
ความถูกต้องของแพ็กเกจเท่านั้น ผู้ใช้ทั่วไปควรติดตั้ง Plugin ด้วย
[`openclaw plugins install`](/th/cli/plugins).

<Warning>
การ override จะเรียกใช้โค้ด Plugin จากแหล่งที่คุณระบุ ใช้เฉพาะในไดเรกทอรีสถานะ
ที่แยกไว้ หรือเครื่องทดสอบแบบทิ้งได้เท่านั้น
</Warning>

## สภาพแวดล้อม

การ override จะถูกปิดใช้งาน เว้นแต่จะตั้งค่าตัวแปรทั้งสองรายการนี้:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

แผนที่ override เป็น JSON ที่ใช้ id ของ Plugin เป็นคีย์ ค่ารองรับ:

- `npm:<registry-spec>` สำหรับแพ็กเกจ registry และเวอร์ชันหรือแท็กแบบเจาะจง
- `npm-pack:<path.tgz>` สำหรับ tarball ภายในเครื่องที่สร้างโดย `npm pack`

พาธ `npm-pack:` แบบสัมพัทธ์จะถูก resolve จากไดเรกทอรีทำงานปัจจุบัน

## พฤติกรรม

เมื่อโฟลว์ในช่วงตั้งค่าขอติดตั้ง Plugin ที่มี id อยู่ในแผนที่
OpenClaw จะใช้แหล่ง override แทนแหล่งจาก catalog, bundled หรือแหล่ง npm
ค่าเริ่มต้น สิ่งนี้มีผลกับ onboarding และโฟลว์อื่นๆ ที่ใช้ตัวติดตั้ง Plugin
ร่วมกันในช่วงตั้งค่า

การ override ยังคงบังคับใช้ id ของ Plugin ที่คาดไว้ tarball ที่แมปกับ `codex`
ต้องติดตั้ง Plugin ที่มี manifest id เป็น `codex`

การ override จะไม่สืบทอดสถานะแหล่งที่เชื่อถือได้อย่างเป็นทางการ แม้เมื่อรายการ catalog
โดยปกติแทนแพ็กเกจที่ OpenClaw เป็นเจ้าของ การ override จะถูกปฏิบัติเป็น
อินพุตทดสอบที่ผู้ดำเนินการจัดหาให้

ไฟล์ `.env` ของ workspace ไม่สามารถเปิดใช้งานการ override การติดตั้งได้ ให้ตั้งค่าตัวแปรเหล่านี้ใน
shell ที่เชื่อถือได้, งาน CI หรือคำสั่งทดสอบระยะไกลที่เรียกใช้ OpenClaw

## E2E ของแพ็กเกจ

ใช้ไดเรกทอรีสถานะที่แยกไว้ เพื่อให้การติดตั้งแพ็กเกจและบันทึกการติดตั้งไม่
แตะต้องสถานะ OpenClaw ปกติของคุณ:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

ตรวจสอบแพ็กเกจที่ติดตั้งภายใต้ไดเรกทอรีสถานะ:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

สำหรับ E2E ของ provider แบบ live ให้ source คีย์ API จริงจาก shell ที่เชื่อถือได้หรือ secret ของ CI
ก่อนเรียกใช้คำสั่งทดสอบ อย่าพิมพ์คีย์ออกมา ให้รายงานเฉพาะแหล่งที่มาและ
มีคีย์อยู่หรือไม่
