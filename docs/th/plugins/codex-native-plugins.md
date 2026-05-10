---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ Plugin แบบเนทีฟของ Codex
    - คุณกำลังย้าย Plugin ของ Codex แบบ openai-curated ที่ติดตั้งจากซอร์ส
    - คุณกำลังแก้ไขปัญหาเกี่ยวกับ codexPlugins, รายการแอป, การดำเนินการที่ทำลายข้อมูล หรือการวินิจฉัยแอป Plugin
summary: กำหนดค่า Plugin Codex แบบเนทีฟที่ย้ายแล้วสำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: Plugin ของ Codex แบบเนทีฟ
x-i18n:
    generated_at: "2026-05-10T19:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

การรองรับ Plugin แบบเนทีฟของ Codex ช่วยให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ความสามารถของแอปและ Plugin ของ Codex
app-server เองได้ภายในเธรด Codex เดียวกันกับที่
จัดการรอบการทำงานของ OpenClaw

OpenClaw จะไม่แปล Plugin ของ Codex ให้เป็นเครื่องมือไดนามิกของ OpenClaw
แบบสังเคราะห์ `codex_plugin_*` การเรียก Plugin จะคงอยู่ในบันทึกการทำงานของ Codex แบบเนทีฟ และ
Codex app-server เป็นเจ้าของการดำเนินการ MCP ที่มีแอปรองรับ

ใช้หน้านี้หลังจาก [Codex harness](/th/plugins/codex-harness) พื้นฐานทำงานแล้ว

## ข้อกำหนด

- รันไทม์เอเจนต์ OpenClaw ที่เลือกต้องเป็น Codex harness แบบเนทีฟ
- `plugins.entries.codex.enabled` ต้องเป็น true
- `plugins.entries.codex.config.codexPlugins.enabled` ต้องเป็น true
- V1 รองรับเฉพาะ Plugin `openai-curated` ที่การย้ายข้อมูลตรวจพบว่า
  ติดตั้งจากซอร์สในโฮม Codex ต้นทาง
- Codex app-server เป้าหมายต้องมองเห็นมาร์เก็ตเพลซ,
  Plugin และรายการแอปที่คาดไว้ได้

`codexPlugins` ไม่มีผลกับการรัน PI, การรันผู้ให้บริการ OpenAI ตามปกติ, การผูกการสนทนา ACP
หรือ harness อื่น ๆ เพราะเส้นทางเหล่านั้นไม่ได้สร้าง
เธรด Codex app-server พร้อมคอนฟิก `apps` แบบเนทีฟ

## เริ่มต้นอย่างรวดเร็ว

ดูตัวอย่างการย้ายข้อมูลจากโฮม Codex ต้นทาง:

```bash
openclaw migrate codex --dry-run
```

ใช้การย้ายข้อมูลเมื่อแผนดูถูกต้อง:

```bash
openclaw migrate apply codex --yes
```

การย้ายข้อมูลจะเขียนรายการ `codexPlugins` แบบชัดเจนสำหรับ Plugin ที่เข้าเกณฑ์ และเรียก
Codex app-server `plugin/install` สำหรับ Plugin ที่เลือก คอนฟิกที่ย้ายแล้วโดยทั่วไป
จะมีลักษณะดังนี้:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset` หรือรีสตาร์ต gateway เพื่อให้
เซสชัน Codex harness ในอนาคตเริ่มต้นด้วยชุดแอปที่อัปเดตแล้ว

## การตั้งค่า Plugin แบบเนทีฟทำงานอย่างไร

การผสานรวมมีสถานะแยกกันสามอย่าง:

- ติดตั้งแล้ว: Codex มีบันเดิล Plugin ภายในรันไทม์ app-server เป้าหมาย
- เปิดใช้แล้ว: คอนฟิก OpenClaw อนุญาตให้ Plugin พร้อมใช้งานสำหรับรอบการทำงานของ Codex
  harness
- เข้าถึงได้: Codex app-server ยืนยันว่ารายการแอปของ Plugin พร้อมใช้งาน
  สำหรับบัญชีที่ใช้งานอยู่ และสามารถแมปกับตัวตน Plugin ที่ย้ายมาได้

การย้ายข้อมูลคือขั้นตอนการติดตั้ง/ตรวจคุณสมบัติที่คงทน รายการแอปรันไทม์คือ
การตรวจสอบการเข้าถึงได้ จากนั้นการตั้งค่าเซสชัน Codex harness จะคำนวณ
คอนฟิกแอปของเธรดแบบจำกัดสำหรับแอป Plugin ที่เปิดใช้และเข้าถึงได้

คอนฟิกแอปของเธรดจะถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน Codex harness
หรือแทนที่การผูกเธรด Codex ที่ล้าสมัย โดยจะไม่คำนวณใหม่ทุกครั้งในแต่ละรอบการทำงาน

## ขอบเขตการรองรับ V1

V1 ตั้งใจให้มีขอบเขตแคบ:

- เฉพาะ Plugin `openai-curated` ที่ติดตั้งอยู่แล้วในรายการ Codex
  app-server ต้นทางเท่านั้นที่เข้าเกณฑ์การย้ายข้อมูล
- การย้ายข้อมูลจะเขียนตัวตน Plugin แบบชัดเจนด้วย `marketplaceName` และ
  `pluginName`; ไม่เขียนเส้นทางแคช `marketplacePath` ภายในเครื่อง
- `codexPlugins.enabled` เป็นสวิตช์เปิดใช้ส่วนกลาง
- ไม่มี wildcard `plugins["*"]` และไม่มีคีย์คอนฟิกที่ให้อำนาจติดตั้ง
  โดยพลการ
- มาร์เก็ตเพลซที่ไม่รองรับ, บันเดิล Plugin ที่แคชไว้, hooks และไฟล์คอนฟิก Codex
  จะถูกเก็บไว้ในรายงานการย้ายข้อมูลเพื่อการตรวจสอบด้วยตนเอง

## รายการแอปและความเป็นเจ้าของ

OpenClaw อ่านรายการแอป Codex ผ่าน app-server `app/list`, แคชไว้เป็นเวลา
หนึ่งชั่วโมง และรีเฟรชรายการที่ล้าสมัยหรือขาดหายแบบอะซิงโครนัส

แอปของ Plugin จะถูกเปิดเผยเฉพาะเมื่อ OpenClaw สามารถแมปกลับไปยัง Plugin ที่ย้ายมา
ผ่านความเป็นเจ้าของที่มั่นคงได้:

- รหัสแอปตรงกันจากรายละเอียด Plugin
- ชื่อเซิร์ฟเวอร์ MCP ที่รู้จัก
- เมตาดาทาที่มั่นคงและไม่ซ้ำกัน

ความเป็นเจ้าของที่ตรงกันเฉพาะชื่อแสดงผลหรือกำกวมจะถูกยกเว้นจนกว่าการรีเฟรชรายการครั้งถัดไป
จะพิสูจน์ความเป็นเจ้าของได้

## คอนฟิกแอปของเธรด

OpenClaw แทรกแพตช์ `config.apps` แบบจำกัดสำหรับเธรด Codex:
`_default` ถูกปิดใช้ และเปิดใช้เฉพาะแอปที่เป็นเจ้าของโดย Plugin ที่ย้ายมาและเปิดใช้แล้วเท่านั้น

OpenClaw ตั้งค่า `destructive_enabled` ระดับแอปจากนโยบาย `allow_destructive_actions`
ส่วนกลางหรือราย Plugin ที่มีผล และให้ Codex บังคับใช้
เมตาดาทาเครื่องมือที่ทำลายข้อมูลจากคำอธิบายประกอบเครื่องมือแอปแบบเนทีฟของ Codex คอนฟิกแอป `_default`
ถูกปิดใช้ด้วย `open_world_enabled: false` แอป Plugin ที่เปิดใช้แล้ว
จะถูกส่งออกด้วย `open_world_enabled: true`; OpenClaw ไม่เปิดเผย
ปุ่มปรับนโยบาย open-world แยกสำหรับ Plugin และไม่ดูแลรายการปฏิเสธ
ชื่อเครื่องมือที่ทำลายข้อมูลราย Plugin

โหมดการอนุมัติเครื่องมือจะตั้งเป็นให้ถามตามค่าเริ่มต้นสำหรับแอป Plugin เพราะ OpenClaw
ไม่มี UI การขอข้อมูลจากแอปแบบโต้ตอบในเส้นทางเธรดเดียวกันนี้

## นโยบายการกระทำที่ทำลายข้อมูล

การขอข้อมูลจาก Plugin ที่ทำลายข้อมูลจะปิดกั้นโดยค่าเริ่มต้น:

- `allow_destructive_actions` ส่วนกลางมีค่าเริ่มต้นเป็น `false`
- `allow_destructive_actions` ราย Plugin จะแทนที่นโยบายส่วนกลางสำหรับ
  Plugin นั้น
- เมื่อนโยบายเป็น `false` OpenClaw จะส่งคืนการปฏิเสธแบบกำหนดแน่นอน
- เมื่อนโยบายเป็น `true` OpenClaw จะยอมรับอัตโนมัติเฉพาะสคีมาที่ปลอดภัยซึ่งสามารถแมปเป็น
  คำตอบการอนุมัติได้ เช่น ฟิลด์อนุมัติแบบบูลีน
- ตัวตน Plugin ที่ขาดหาย, ความเป็นเจ้าของที่กำกวม, รหัสรอบการทำงานที่ขาดหาย, รหัสรอบการทำงาน
  ที่ผิด หรือสคีมาการขอข้อมูลที่ไม่ปลอดภัย จะถูกปฏิเสธแทนการถาม

## การแก้ไขปัญหา

**`auth_required`:** การย้ายข้อมูลติดตั้ง Plugin แล้ว แต่แอปหนึ่งของ Plugin ยัง
ต้องการการยืนยันตัวตน รายการ Plugin แบบชัดเจนจะถูกเขียนเป็นปิดใช้จนกว่าคุณจะ
ให้สิทธิ์ใหม่และเปิดใช้รายการนั้น

**`marketplace_missing` หรือ `plugin_missing`:** Codex app-server เป้าหมาย
มองไม่เห็นมาร์เก็ตเพลซหรือ Plugin `openai-curated` ที่คาดไว้ ให้รันการย้ายข้อมูลอีกครั้ง
กับรันไทม์เป้าหมาย หรือตรวจสอบสถานะ Plugin ของ Codex app-server

**`app_inventory_missing` หรือ `app_inventory_stale`:** ความพร้อมของแอปมาจาก
แคชที่ว่างหรือล้าสมัย OpenClaw จะกำหนดการรีเฟรชแบบอะซิงโครนัสและยกเว้นแอป
Plugin จนกว่าจะทราบความเป็นเจ้าของและความพร้อม

**`app_ownership_ambiguous`:** รายการแอปตรงกันเฉพาะตามชื่อแสดงผล ดังนั้น
แอปจะไม่ถูกเปิดเผยต่อเธรด Codex

**คอนฟิกเปลี่ยนแล้วแต่เอเจนต์มองไม่เห็น Plugin:** ใช้ `/new`, `/reset` หรือ
รีสตาร์ต gateway การผูกเธรด Codex ที่มีอยู่จะเก็บคอนฟิกแอปที่
เริ่มต้นไว้ จนกว่า OpenClaw จะสร้างเซสชัน harness ใหม่หรือแทนที่
การผูกที่ล้าสมัย

**การกระทำที่ทำลายข้อมูลถูกปฏิเสธ:** ตรวจสอบค่า `allow_destructive_actions`
ส่วนกลางและราย Plugin แม้นโยบายเป็น true สคีมาการขอข้อมูลที่ไม่ปลอดภัย
และตัวตน Plugin ที่กำกวมก็ยังถูกปิดกั้นอยู่

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)
- [รันไทม์ Codex harness](/th/plugins/codex-harness-runtime)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/th/cli/migrate)
