---
read_when:
    - การย้ายความเป็นเจ้าของโฮสต์ เครื่องมือ คำสั่ง เอกสาร หรือโปรโตคอลของ Canvas
    - การตรวจสอบว่า Canvas ยังอยู่ในความรับผิดชอบของแกนหลักหรือไม่
    - การเตรียมหรือการตรวจสอบ PR ของ Plugin Canvas รุ่นทดลอง
summary: แผนและเช็กลิสต์การตรวจสอบสำหรับการย้าย Canvas ออกจากแกนหลักไปเป็น Plugin แบบทดลองที่รวมมาให้
title: การปรับโครงสร้าง Plugin Canvas
x-i18n:
    generated_at: "2026-05-07T13:26:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# การรีแฟกเตอร์ Canvas Plugin

Canvas มีการใช้งานต่ำและยังเป็นเชิงทดลอง ให้ถือว่าเป็น Plugin ที่มาพร้อมชุด ไม่ใช่ฟีเจอร์แกนหลัก แกนหลักอาจเก็บระบบเชื่อมต่อทั่วไปของ Gateway, Node, HTTP, การยืนยันตัวตน, การกำหนดค่า และไคลเอนต์เนทีฟไว้ได้ แต่พฤติกรรมเฉพาะของ Canvas ควรอยู่ภายใต้ `extensions/canvas`

## เป้าหมาย

ย้ายความเป็นเจ้าของ Canvas ไปยัง `extensions/canvas` โดยยังคงรักษาพฤติกรรม Node ที่จับคู่กันในปัจจุบันไว้:

- เครื่องมือ `canvas` ฝั่งเอเจนต์ลงทะเบียนโดย Canvas Plugin
- อนุญาตคำสั่ง Node ของ Canvas เฉพาะเมื่อ Canvas Plugin ลงทะเบียนคำสั่งเหล่านั้น
- ไฟล์โฮสต์/ซอร์สของ A2UI อยู่ภายใต้ Canvas Plugin
- การสร้างเอกสาร Canvas ให้อยู่ภายใต้ Canvas Plugin
- การใช้งานคำสั่ง CLI อยู่ภายใต้ Canvas Plugin หรือมอบหมายผ่าน runtime barrel ที่ Plugin เป็นเจ้าของ
- เอกสารและรายการคลัง Plugin อธิบายว่า Canvas เป็นเชิงทดลองและมี Plugin รองรับ

## สิ่งที่ไม่ใช่เป้าหมาย

- อย่าออกแบบ UI Canvas ของแอปเนทีฟใหม่ในการรีแฟกเตอร์นี้
- อย่าลบการรองรับโปรโตคอล/ไคลเอนต์ Canvas จาก iOS, Android หรือ macOS เว้นแต่จะมีการตัดสินใจด้านผลิตภัณฑ์แยกต่างหากว่าให้ลบ Canvas
- อย่าสร้างเฟรมเวิร์กบริการ Plugin ขนาดกว้างเพียงเพื่อ Canvas เว้นแต่มี Plugin ที่มาพร้อมชุดอย่างน้อยหนึ่งรายการอื่นที่ต้องใช้ seam เดียวกัน

## สถานะสาขาปัจจุบัน

เสร็จแล้ว:

- เพิ่มแพ็กเกจ Plugin ที่มาพร้อมชุดใน `extensions/canvas`
- เพิ่ม `extensions/canvas/openclaw.plugin.json`
- ย้ายเครื่องมือ `canvas` ของเอเจนต์จาก `src/agents/tools/canvas-tool.ts` ไปยัง `extensions/canvas/src/tool.ts`
- ลบการลงทะเบียนแกนหลักของ `createCanvasTool` ออกจาก `src/agents/openclaw-tools.ts`
- ย้ายการใช้งานโฮสต์ Canvas จาก `src/canvas-host` ไปยัง `extensions/canvas/src/host`
- คง `extensions/canvas/runtime-api.ts` ไว้เป็น compatibility barrel ที่ Plugin เป็นเจ้าของสำหรับการทดสอบ การทำแพ็กเกจ และตัวช่วย Canvas สาธารณะภายนอก
- ย้ายการสร้างเอกสาร Canvas จาก `src/gateway/canvas-documents.ts` ไปยัง `extensions/canvas/src/documents.ts`
- ย้ายการใช้งาน CLI ของ Canvas และตัวช่วย JSONL ของ A2UI ไปยัง `extensions/canvas/src/cli.ts`
- ย้าย URL โฮสต์ Canvas และตัวช่วยความสามารถแบบมีขอบเขตไปยัง `extensions/canvas/src`
- ย้ายค่าเริ่มต้นคำสั่ง Node ของ Canvas ออกจากรายการแกนหลักที่ฮาร์ดโค้ดไว้ และไปไว้ใน `nodeInvokePolicies` ของ Plugin
- เพิ่มการกำหนดค่าโฮสต์ Canvas ที่ Plugin เป็นเจ้าของที่ `plugins.entries.canvas.config.host`
- ย้ายการให้บริการ HTTP ของ Canvas และ A2UI ไปอยู่หลังการลงทะเบียนเส้นทาง HTTP ของ Canvas Plugin
- เพิ่มการส่งต่อการอัปเกรด WebSocket ของ Plugin ทั่วไปสำหรับเส้นทาง HTTP ที่ Plugin เป็นเจ้าของ
- แทนที่ URL โฮสต์ Gateway และการยืนยันตัวตนความสามารถ Node เฉพาะ Canvas ด้วยพื้นผิว Plugin ที่โฮสต์แบบทั่วไปและตัวช่วยความสามารถ Node
- เพิ่มตัวแก้ไขสื่อที่โฮสต์ซึ่ง Plugin เป็นเจ้าของ เพื่อให้ URL เอกสาร Canvas ถูกแก้ผ่าน Canvas Plugin แทนที่แกนหลักจะนำเข้ารายละเอียดภายในของเอกสาร Canvas
- เพิ่ม `api.registerNodeCliFeature(...)` เพื่อให้ Canvas ประกาศ `openclaw nodes canvas` เป็นฟีเจอร์ Node ที่ Plugin เป็นเจ้าของได้โดยไม่ต้องระบุพาธคำสั่งแม่เอง
- ลบการนำเข้า `extensions/canvas/runtime-api.js` ของ `src/**` ฝั่งโปรดักชัน
- ย้ายซอร์สบันเดิล A2UI จาก `apps/shared/OpenClawKit/Tools/CanvasA2UI` ไปยัง `extensions/canvas/src/host/a2ui-app`
- ย้ายการใช้งานการ build/copy ของ A2UI ไปไว้ใต้ `extensions/canvas/scripts` และแทนที่การต่อสาย build ที่รูทด้วยฮุก asset ของ Plugin ที่มาพร้อมชุดแบบทั่วไป
- ลบ alias การกำหนดค่า `canvasHost` ระดับบนเดิมในรันไทม์
- คงการย้ายค่า doctor ของ Canvas ไว้ เพื่อให้ `openclaw doctor --fix` เขียนค่ากำหนด `canvasHost` เก่าใหม่เป็น `plugins.entries.canvas.config.host`
- ลบความเข้ากันได้ของโปรโตคอล Canvas สำหรับเอเจนต์เก่าหลัง Gateway protocol v4 ตอนนี้ไคลเอนต์เนทีฟและ Gateway ใช้เฉพาะ `pluginSurfaceUrls.canvas` พร้อม `node.pluginSurface.refresh`; พาธที่เลิกใช้แล้วอย่าง `canvasHostUrl`, `canvasCapability` และ `node.canvas.capability.refresh` ไม่ได้รับการรองรับโดยตั้งใจในการรีแฟกเตอร์เชิงทดลองนี้
- อัปเดตรายการคลัง Plugin ที่สร้างขึ้นให้รวม Canvas
- เพิ่มเอกสารอ้างอิง Plugin ที่ `docs/plugins/reference/canvas.md`

พื้นผิว Canvas ที่แกนหลักยังเป็นเจ้าของอยู่และทราบแล้ว:

- ตัวจัดการ Canvas ของแอปเนทีฟภายใต้ `apps/` ยังตั้งใจใช้พื้นผิว Canvas Plugin
- ตัวจัดการโปรโตคอล/ไคลเอนต์ Canvas ของแอปเนทีฟภายใต้ `apps/`
- เอาต์พุต artifact ที่เผยแพร่แล้วยังใช้ `dist/canvas-host/a2ui` สำหรับการค้นหารันไทม์ที่เข้ากันได้ย้อนหลัง แต่ขั้นตอน copy ตอนนี้เป็นของ Plugin แล้ว

## รูปร่างเป้าหมาย

`extensions/canvas` ควรเป็นเจ้าของ:

- manifest ของ Plugin และเมทาดาทาแพ็กเกจ
- การลงทะเบียนเครื่องมือเอเจนต์
- นโยบายคำสั่ง invoke ของ Node
- โฮสต์ Canvas และรันไทม์ A2UI
- ซอร์สบันเดิล Canvas A2UI และสคริปต์ build/copy ของ asset
- การสร้างเอกสาร Canvas และการแก้ไข asset
- การใช้งาน CLI ของ Canvas
- หน้าเอกสาร Canvas และรายการคลัง Plugin

แกนหลักควรเป็นเจ้าของเฉพาะ seam ทั่วไป:

- การค้นพบและการลงทะเบียน Plugin
- registry เครื่องมือเอเจนต์ทั่วไป
- registry นโยบาย invoke ของ Node ทั่วไป
- การส่งต่อการอัปเกรด Gateway HTTP/auth และ WebSocket ทั่วไป
- การแก้ URL พื้นผิว Plugin ที่โฮสต์ทั่วไป
- การลงทะเบียนตัวแก้ไขสื่อที่โฮสต์ทั่วไป
- การขนส่งความสามารถ Node ทั่วไป
- ระบบเชื่อมต่อการกำหนดค่าทั่วไป
- การค้นพบฮุก asset ของ Plugin ที่มาพร้อมชุดทั่วไป

แอปเนทีฟอาจคงตัวจัดการคำสั่ง Canvas ไว้ในฐานะไคลเอนต์ของโปรโตคอล แอปเหล่านั้นไม่ใช่เจ้าของรันไทม์ Plugin

## ขั้นตอนการย้าย

1. ถือว่า `plugins.entries.canvas.config.host` เป็นพื้นผิวการกำหนดค่าที่ Plugin เป็นเจ้าของ
2. อัปเดตเอกสารให้ Canvas ถูกอธิบายว่าเป็น Plugin ที่มาพร้อมชุดเชิงทดลอง
3. รันการทดสอบ Canvas แบบเจาะจง การตรวจสอบรายการคลัง Plugin การตรวจ API ของ Plugin SDK และ gate build/type ที่ได้รับผลกระทบจากขอบเขตรันไทม์

## เช็กลิสต์ตรวจสอบ

ก่อนเรียกว่าการรีแฟกเตอร์เสร็จสมบูรณ์:

- `rg "src/canvas-host|../canvas-host"` ไม่คืนค่าการนำเข้าซอร์สที่ยังใช้งานอยู่
- `rg "canvas-tool|createCanvasTool" src` ไม่พบการใช้งานเครื่องมือ Canvas ที่แกนหลักเป็นเจ้าของ
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` ไม่พบค่าเริ่มต้น allowlist ที่ฮาร์ดโค้ดไว้นอกการทดสอบนโยบาย Plugin ทั่วไป
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` ว่างเปล่า
- `rg "canvas-documents" src` ว่างเปล่า
- `rg "registerNodesCanvasCommands|nodes-canvas" src` ว่างเปล่า; Canvas Plugin ลงทะเบียน `openclaw nodes canvas` ผ่านเมทาดาทา CLI ของ Plugin แบบซ้อน
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` ไม่คืนค่าความเป็นเจ้าของรันไทม์ Gateway
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` พบเฉพาะ wrapper ความเข้ากันได้หรือพาธที่ Plugin เป็นเจ้าของ
- `pnpm plugins:inventory:check` ผ่าน
- `pnpm plugin-sdk:api:check` ผ่าน หรือ baseline API ที่สร้างขึ้นถูกอัปเดตและตรวจทานโดยตั้งใจ
- การทดสอบ Canvas แบบเจาะจงผ่าน
- การทดสอบ changed-lanes ผ่านสำหรับพาธโฮสต์ Canvas/A2UI
- เนื้อหา PR ระบุอย่างชัดเจนว่า Canvas เป็นเชิงทดลองและมี Plugin รองรับ

## คำสั่งตรวจสอบ

ใช้การตรวจแบบเจาะจงในเครื่องระหว่างวนปรับแก้:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

รัน `pnpm build` ก่อน push หาก runtime barrel, lazy import, การทำแพ็กเกจ หรือพื้นผิว Plugin ที่เผยแพร่เปลี่ยนแปลง
