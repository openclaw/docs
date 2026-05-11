---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ Plugin แบบเนทีฟของ Codex
    - คุณกำลังย้าย Plugin ของ Codex ที่คัดสรรโดย openai และติดตั้งจากซอร์ส
    - คุณกำลังแก้ไขปัญหาเกี่ยวกับ codexPlugins, บัญชีรายการแอป, การดำเนินการที่ทำลายข้อมูล, หรือการวินิจฉัยแอป Plugin
summary: กำหนดค่า Plugin เนทีฟของ Codex ที่ย้ายแล้วสำหรับเอเจนต์ OpenClaw ในโหมด Codex
title: Plugin ของ Codex แบบเนทีฟ
x-i18n:
    generated_at: "2026-05-11T20:34:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

การรองรับ Plugin ของ Codex แบบเนทีฟช่วยให้เอเจนต์ OpenClaw ในโหมด Codex ใช้ความสามารถของแอปและ Plugin ของ Codex app-server เองภายในเธรด Codex เดียวกันที่จัดการรอบการทำงานของ OpenClaw

OpenClaw จะไม่แปลง Plugin ของ Codex เป็นเครื่องมือไดนามิก OpenClaw แบบสังเคราะห์ `codex_plugin_*` การเรียก Plugin จะอยู่ในทรานสคริปต์ Codex แบบเนทีฟ และ Codex app-server เป็นเจ้าของการดำเนินการ MCP ที่รองรับโดยแอป

ใช้หน้านี้หลังจาก [Codex harness](/th/plugins/codex-harness) พื้นฐานทำงานแล้ว

## ข้อกำหนด

- รันไทม์เอเจนต์ OpenClaw ที่เลือกต้องเป็น Codex harness แบบเนทีฟ
- `plugins.entries.codex.enabled` ต้องเป็น true
- `plugins.entries.codex.config.codexPlugins.enabled` ต้องเป็น true
- V1 รองรับเฉพาะ Plugin `openai-curated` ที่การย้ายข้อมูลพบว่าติดตั้งจากซอร์สใน Codex home ต้นทาง
- Codex app-server เป้าหมายต้องมองเห็น marketplace, Plugin และคลังแอปที่คาดไว้ได้

`codexPlugins` ไม่มีผลกับการรัน PI, การรันผู้ให้บริการ OpenAI ปกติ, การผูกบทสนทนา ACP หรือ harness อื่นๆ เพราะเส้นทางเหล่านั้นไม่ได้สร้างเธรด Codex app-server ด้วยการกำหนดค่า `apps` แบบเนทีฟ

## เริ่มต้นอย่างรวดเร็ว

ดูตัวอย่างการย้ายข้อมูลจาก Codex home ต้นทาง:

```bash
openclaw migrate codex --dry-run
```

ใช้การย้ายข้อมูลเมื่อแผนดูถูกต้อง:

```bash
openclaw migrate apply codex --yes
```

การย้ายข้อมูลจะเขียนรายการ `codexPlugins` อย่างชัดเจนสำหรับ Plugin ที่เข้าเงื่อนไข และเรียก Codex app-server `plugin/install` สำหรับ Plugin ที่เลือก การกำหนดค่าที่ย้ายข้อมูลแล้วโดยทั่วไปมีลักษณะดังนี้:

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

หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset` หรือรีสตาร์ท gateway เพื่อให้เซสชัน Codex harness ในอนาคตเริ่มต้นด้วยชุดแอปที่อัปเดตแล้ว

## การตั้งค่า Plugin แบบเนทีฟทำงานอย่างไร

การผสานรวมมีสถานะแยกกันสามอย่าง:

- ติดตั้งแล้ว: Codex มีบันเดิล Plugin ภายในเครื่องในรันไทม์ app-server เป้าหมาย
- เปิดใช้แล้ว: การกำหนดค่า OpenClaw อนุญาตให้ทำให้ Plugin พร้อมใช้งานสำหรับรอบการทำงานของ Codex harness
- เข้าถึงได้: Codex app-server ยืนยันว่ารายการแอปของ Plugin พร้อมใช้งานสำหรับบัญชีที่ใช้งานอยู่ และสามารถแมปกับตัวตน Plugin ที่ย้ายข้อมูลมาได้

การย้ายข้อมูลคือขั้นตอนการติดตั้ง/ตรวจสอบคุณสมบัติที่คงทน คลังแอปรันไทม์คือการตรวจสอบการเข้าถึง จากนั้นการตั้งค่าเซสชัน Codex harness จะคำนวณการกำหนดค่าแอปของเธรดแบบจำกัดสำหรับแอป Plugin ที่เปิดใช้และเข้าถึงได้

การกำหนดค่าแอปของเธรดจะถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน Codex harness หรือแทนที่การผูกเธรด Codex ที่หมดอายุแล้ว โดยจะไม่คำนวณใหม่ในทุกรอบการทำงาน

## ขอบเขตการรองรับ V1

V1 ถูกตั้งใจให้มีขอบเขตแคบ:

- เฉพาะ Plugin `openai-curated` ที่ติดตั้งอยู่แล้วในคลัง Codex app-server ต้นทางเท่านั้นที่เข้าเงื่อนไขการย้ายข้อมูล
- การย้ายข้อมูลเขียนตัวตน Plugin อย่างชัดเจนด้วย `marketplaceName` และ `pluginName`; จะไม่เขียนพาธแคช `marketplacePath` ในเครื่อง
- `codexPlugins.enabled` คือสวิตช์เปิดใช้งานส่วนกลาง
- ไม่มีไวลด์การ์ด `plugins["*"]` และไม่มีคีย์การกำหนดค่าที่ให้สิทธิ์ติดตั้งตามอำเภอใจ
- marketplace ที่ไม่รองรับ, บันเดิล Plugin ที่แคชไว้, hook และไฟล์การกำหนดค่า Codex จะถูกเก็บไว้ในรายงานการย้ายข้อมูลเพื่อให้ตรวจสอบด้วยตนเอง

## คลังแอปและความเป็นเจ้าของ

OpenClaw อ่านคลังแอป Codex ผ่าน app-server `app/list` แคชไว้หนึ่งชั่วโมง และรีเฟรชรายการที่หมดอายุหรือหายไปแบบอะซิงโครนัส

แอป Plugin จะถูกเปิดเผยเฉพาะเมื่อ OpenClaw สามารถแมปกลับไปยัง Plugin ที่ย้ายข้อมูลมาได้ผ่านความเป็นเจ้าของที่เสถียร:

- app id ที่ตรงกันจากรายละเอียด Plugin
- ชื่อเซิร์ฟเวอร์ MCP ที่รู้จัก
- เมตาดาต้าที่เสถียรและไม่ซ้ำกัน

ความเป็นเจ้าของที่ตรงกันเฉพาะชื่อที่แสดงหรือกำกวมจะถูกตัดออกจนกว่าการรีเฟรชคลังครั้งถัดไปจะพิสูจน์ความเป็นเจ้าของได้

## การกำหนดค่าแอปของเธรด

OpenClaw แทรกแพตช์ `config.apps` แบบจำกัดสำหรับเธรด Codex:
`_default` จะถูกปิดใช้ และเปิดใช้เฉพาะแอปที่เป็นของ Plugin ที่ย้ายข้อมูลมาและเปิดใช้แล้วเท่านั้น

OpenClaw ตั้งค่า `destructive_enabled` ระดับแอปจากนโยบาย `allow_destructive_actions` ส่วนกลางหรือราย Plugin ที่มีผล และให้ Codex บังคับใช้เมตาดาต้าเครื่องมือแบบทำลายข้อมูลจากคำอธิบายประกอบเครื่องมือแอปแบบเนทีฟของตน การกำหนดค่าแอป `_default` ถูกปิดใช้ด้วย `open_world_enabled: false` แอป Plugin ที่เปิดใช้จะถูกส่งออกด้วย `open_world_enabled: true`; OpenClaw ไม่เปิดเผยปุ่มปรับนโยบาย open-world แยกต่างหากสำหรับ Plugin และไม่ดูแลรายการปฏิเสธชื่อเครื่องมือแบบทำลายข้อมูลราย Plugin

โหมดการอนุมัติเครื่องมือเป็นอัตโนมัติโดยค่าเริ่มต้นสำหรับแอป Plugin เพื่อให้เครื่องมืออ่านที่ไม่ทำลายข้อมูลสามารถรันได้โดยไม่ต้องมี UI อนุมัติในเธรดเดียวกัน เครื่องมือแบบทำลายข้อมูลยังคงถูกควบคุมโดยนโยบาย `destructive_enabled` ของแต่ละแอป

## นโยบายการกระทำแบบทำลายข้อมูล

การร้องขอ Plugin แบบทำลายข้อมูลจะล้มเหลวแบบปิดโดยค่าเริ่มต้น:

- `allow_destructive_actions` ส่วนกลางมีค่าเริ่มต้นเป็น `false`
- `allow_destructive_actions` ราย Plugin จะแทนที่นโยบายส่วนกลางสำหรับ Plugin นั้น
- เมื่อนโยบายเป็น `false` OpenClaw จะส่งคืนการปฏิเสธแบบกำหนดแน่นอน
- เมื่อนโยบายเป็น `true` OpenClaw จะยอมรับอัตโนมัติเฉพาะสคีมาที่ปลอดภัยซึ่งสามารถแมปไปยังคำตอบการอนุมัติได้ เช่น ฟิลด์อนุมัติแบบบูลีน
- ตัวตน Plugin ที่หายไป, ความเป็นเจ้าของที่กำกวม, turn id ที่หายไป, turn id ที่ผิด หรือสคีมาการร้องขอที่ไม่ปลอดภัยจะถูกปฏิเสธแทนการถามยืนยัน

## การแก้ไขปัญหา

**`auth_required`:** การย้ายข้อมูลติดตั้ง Plugin แล้ว แต่หนึ่งในแอปของ Plugin นั้นยังต้องมีการตรวจสอบสิทธิ์ รายการ Plugin ที่ชัดเจนจะถูกเขียนแบบปิดใช้ไว้จนกว่าคุณจะให้สิทธิ์อีกครั้งและเปิดใช้

**`marketplace_missing` หรือ `plugin_missing`:** Codex app-server เป้าหมายมองไม่เห็น marketplace หรือ Plugin `openai-curated` ที่คาดไว้ ให้รันการย้ายข้อมูลอีกครั้งกับรันไทม์เป้าหมาย หรือตรวจสอบสถานะ Plugin ของ Codex app-server

**`app_inventory_missing` หรือ `app_inventory_stale`:** ความพร้อมของแอปมาจากแคชที่ว่างเปล่าหรือหมดอายุ OpenClaw จะกำหนดเวลารีเฟรชแบบอะซิงโครนัสและตัดแอป Plugin ออกจนกว่าจะทราบความเป็นเจ้าของและความพร้อม

**`app_ownership_ambiguous`:** คลังแอปตรงกันเฉพาะจากชื่อที่แสดง ดังนั้นแอปจึงไม่ถูกเปิดเผยต่อเธรด Codex

**การกำหนดค่าเปลี่ยนแล้วแต่เอเจนต์มองไม่เห็น Plugin:** ใช้ `/new`, `/reset` หรือรีสตาร์ท gateway การผูกเธรด Codex ที่มีอยู่จะคงการกำหนดค่าแอปที่เริ่มต้นไว้จนกว่า OpenClaw จะสร้างเซสชัน harness ใหม่หรือแทนที่การผูกที่หมดอายุ

**การกระทำแบบทำลายข้อมูลถูกปฏิเสธ:** ตรวจสอบค่า `allow_destructive_actions` ส่วนกลางและราย Plugin แม้นโยบายจะเป็น true สคีมาการร้องขอที่ไม่ปลอดภัยและตัวตน Plugin ที่กำกวมยังคงล้มเหลวแบบปิด

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)
- [รันไทม์ Codex harness](/th/plugins/codex-harness-runtime)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/th/cli/migrate)
