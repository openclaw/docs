---
read_when:
    - การเพิ่ม capability ใหม่ใน core และพื้นผิวการลงทะเบียนของ Plugin
    - การตัดสินใจว่าโค้ดควรอยู่ใน core, vendor Plugin หรือ feature Plugin
    - การต่อเชื่อมตัวช่วยรันไทม์ใหม่สำหรับ channels หรือ tools
sidebarTitle: Adding Capabilities
summary: คู่มือสำหรับผู้มีส่วนร่วมในการเพิ่มความสามารถแบบใช้ร่วมกันใหม่ให้กับระบบ Plugin ของ OpenClaw
title: การเพิ่ม capabilities (คู่มือผู้มีส่วนร่วม)
x-i18n:
    generated_at: "2026-04-25T14:00:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  นี่คือ **คู่มือสำหรับผู้มีส่วนร่วม** สำหรับนักพัฒนา core ของ OpenClaw หากคุณกำลัง
  สร้าง Plugin ภายนอก ให้ดู [Building Plugins](/th/plugins/building-plugins)
  แทน
</Info>

ใช้หน้านี้เมื่อ OpenClaw ต้องการโดเมนใหม่ เช่น การสร้างภาพ การสร้างวิดีโอ
หรือพื้นที่ฟีเจอร์ใหม่ในอนาคตที่มี vendor รองรับ

กฎคือ:

- plugin = ขอบเขตความเป็นเจ้าของ
- capability = สัญญาของ core แบบใช้ร่วมกัน

นั่นหมายความว่าคุณไม่ควรเริ่มจากการต่อ vendor เข้ากับ channel หรือ
tool โดยตรง ให้เริ่มจากการนิยาม capability ก่อน

## เมื่อใดควรสร้าง capability

สร้าง capability ใหม่เมื่อเงื่อนไขทั้งหมดต่อไปนี้เป็นจริง:

1. มี vendor มากกว่าหนึ่งรายที่อาจสามารถ implement ได้อย่างสมเหตุสมผล
2. channels, tools หรือ feature Plugins ควรใช้งานมันได้โดยไม่ต้องสนใจว่าเป็น
   vendor ใด
3. core จำเป็นต้องเป็นเจ้าของพฤติกรรม fallback, policy, config หรือ delivery

หากงานนั้นเป็นเรื่องของ vendor เพียงอย่างเดียวและยังไม่มีสัญญาแบบใช้ร่วมกัน ให้หยุดและนิยาม
สัญญานั้นก่อน

## ลำดับมาตรฐาน

1. นิยามสัญญาแบบมีชนิดข้อมูลใน core
2. เพิ่มการลงทะเบียน Plugin สำหรับสัญญานั้น
3. เพิ่มตัวช่วยรันไทม์แบบใช้ร่วมกัน
4. ต่อ Plugin vendor จริงหนึ่งตัวเป็นหลักฐาน
5. ย้าย consumer ของ feature/channel มาใช้ตัวช่วยรันไทม์
6. เพิ่มการทดสอบของสัญญา
7. จัดทำเอกสาร config ที่ operator มองเห็น และโมเดลความเป็นเจ้าของ

## อะไรควรอยู่ที่ไหน

Core:

- ชนิดข้อมูลของ request/response
- registry ของ provider + การ resolve
- พฤติกรรม fallback
- config schema พร้อมเมทาดาทาเอกสาร `title` / `description` ที่ propagate ไปยัง nested object, wildcard, array-item และ composition nodes
- พื้นผิวของตัวช่วยรันไทม์

Vendor Plugin:

- การเรียก API ของ vendor
- การจัดการ auth ของ vendor
- การ normalize request เฉพาะของ vendor
- การลงทะเบียน implementation ของ capability

Feature/channel Plugin:

- เรียก `api.runtime.*` หรือตัวช่วย `plugin-sdk/*-runtime` ที่ตรงกัน
- ห้ามเรียก implementation ของ vendor โดยตรง

## จุดเชื่อมของ provider และ harness

ใช้ provider hooks เมื่อพฤติกรรมเป็นส่วนหนึ่งของสัญญา provider ของโมเดล
มากกว่าลูป agent แบบทั่วไป ตัวอย่างได้แก่ request params เฉพาะของ provider หลังการเลือก transport,
การตั้งค่าความชอบของ auth-profile, prompt overlays และการกำหนดเส้นทาง fallback ถัดไปหลังจาก model/profile failover

ใช้ agent harness hooks เมื่อพฤติกรรมเป็นของรันไทม์ที่กำลังรัน turn อยู่
Harnesses สามารถจัดประเภทผลลัพธ์ของความพยายามที่ “สำเร็จแต่ใช้งานไม่ได้”
เช่น คำตอบว่าง คำตอบที่มีแต่ reasoning หรือคำตอบที่มีแต่การวางแผน เพื่อให้นโยบาย fallback ของโมเดลชั้นนอก
ตัดสินใจว่าจะ retry หรือไม่

รักษาจุดเชื่อมทั้งสองให้แคบ:

- core เป็นเจ้าของนโยบาย retry/fallback
- provider Plugins เป็นเจ้าของคำใบ้ด้าน request/auth/routing เฉพาะของ provider
- harness Plugins เป็นเจ้าของการจัดประเภทความพยายามเฉพาะของ runtime
- Plugins ภายนอกคืนค่าเป็น hints ไม่ใช่การกลายพันธุ์สถานะของ core โดยตรง

## เช็กลิสต์ไฟล์

สำหรับ capability ใหม่ ให้คาดว่าจะต้องแตะพื้นที่เหล่านี้:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- แพ็กเกจ Plugin แบบ bundled อย่างน้อยหนึ่งรายการหรือมากกว่า
- config/docs/tests

## ตัวอย่าง: การสร้างภาพ

การสร้างภาพเป็นไปตามรูปแบบมาตรฐาน:

1. core นิยาม `ImageGenerationProvider`
2. core เปิดเผย `registerImageGenerationProvider(...)`
3. core เปิดเผย `runtime.imageGeneration.generate(...)`
4. Plugins `openai`, `google`, `fal` และ `minimax` ลงทะเบียน implementations ที่มี vendor รองรับ
5. vendor ในอนาคตสามารถลงทะเบียนสัญญาเดียวกันนี้ได้โดยไม่ต้องเปลี่ยน channels/tools

คีย์ config นี้แยกจากการกำหนดเส้นทางของ vision-analysis:

- `agents.defaults.imageModel` = วิเคราะห์ภาพ
- `agents.defaults.imageGenerationModel` = สร้างภาพ

ให้แยกสองส่วนนี้ออกจากกัน เพื่อให้ fallback และ policy ยังคงชัดเจน

## เช็กลิสต์การรีวิว

ก่อนปล่อย capability ใหม่ ให้ตรวจสอบว่า:

- ไม่มี channel/tool ใด import โค้ดของ vendor โดยตรง
- ตัวช่วยรันไทม์คือเส้นทางแบบใช้ร่วมกัน
- มีการทดสอบสัญญาอย่างน้อยหนึ่งรายการที่ยืนยันความเป็นเจ้าของของ bundled
- เอกสาร config ระบุชื่อ model/config key ใหม่
- เอกสาร Plugin อธิบายขอบเขตความเป็นเจ้าของ

หาก PR ข้ามชั้น capability และ hardcode พฤติกรรมของ vendor ลงใน
channel/tool ให้ส่งกลับและนิยามสัญญาก่อน

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin)
- [Creating skills](/th/tools/creating-skills)
- [Tools and plugins](/th/tools)
