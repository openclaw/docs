---
read_when:
    - การย้ายความเป็นเจ้าของโฮสต์ Canvas, เครื่องมือ, คำสั่ง, เอกสาร หรือโปรโตคอล
    - การตรวจสอบว่า Canvas ยังคงอยู่ภายใต้การดูแลของส่วนแกนหลักหรือไม่
    - การเตรียมหรือตรวจสอบ PR ของ Plugin Canvas รุ่นทดลอง
summary: แผนและรายการตรวจสอบสำหรับการย้าย Canvas ออกจากแกนหลักไปยัง Plugin รุ่นทดลองที่รวมมาในชุดการติดตั้ง
title: การปรับโครงสร้าง Plugin Canvas
x-i18n:
    generated_at: "2026-07-12T16:42:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# การปรับโครงสร้าง Plugin Canvas

Canvas มีการใช้งานน้อยและอยู่ในขั้นทดลอง ให้ถือว่าเป็น Plugin ที่รวมมากับระบบ ไม่ใช่ฟีเจอร์หลัก ส่วนแกนกลางอาจคงโครงสร้างพื้นฐานทั่วไปสำหรับ Gateway, Node, HTTP, การตรวจสอบสิทธิ์, การกำหนดค่า และไคลเอนต์แบบเนทีฟไว้ได้ แต่พฤติกรรมเฉพาะของ Canvas ควรอยู่ภายใต้ `extensions/canvas`

## เป้าหมาย

ย้ายความเป็นเจ้าของ Canvas ไปยัง `extensions/canvas` โดยคงพฤติกรรม Node ที่จับคู่ไว้ในปัจจุบัน:

- เครื่องมือ `canvas` ที่เอเจนต์ใช้งานได้รับการลงทะเบียนโดย Plugin Canvas
- อนุญาตคำสั่ง Node ของ Canvas เฉพาะเมื่อ Plugin Canvas ลงทะเบียนคำสั่งเหล่านั้น
- ไฟล์โฮสต์/ซอร์สของ A2UI อยู่ภายใต้ Plugin Canvas
- การจัดทำเอกสาร Canvas ให้อยู่ในรูปแบบพร้อมใช้งานอยู่ภายใต้ Plugin Canvas
- การติดตั้งใช้งานคำสั่ง CLI อยู่ภายใต้ Plugin Canvas หรือมอบหมายผ่าน runtime barrel ที่ Plugin เป็นเจ้าของ
- เอกสารและบัญชีรายการ Plugin อธิบายว่า Canvas เป็นฟีเจอร์ทดลองและทำงานผ่าน Plugin

## สิ่งที่ไม่ใช่เป้าหมาย

- ห้ามออกแบบ UI ของ Canvas ในแอปแบบเนทีฟใหม่ในการปรับโครงสร้างครั้งนี้
- ห้ามนำการรองรับโปรโตคอล/ไคลเอนต์ Canvas ออกจาก iOS, Android หรือ macOS เว้นแต่จะมีการตัดสินใจด้านผลิตภัณฑ์แยกต่างหากว่าควรลบ Canvas
- ห้ามสร้างเฟรมเวิร์กบริการ Plugin แบบครอบคลุมเพื่อ Canvas เท่านั้น เว้นแต่มี Plugin ที่รวมมากับระบบอื่นอย่างน้อยหนึ่งรายการที่ต้องใช้จุดเชื่อมต่อเดียวกัน

## สถานะของบรานช์ปัจจุบัน

เสร็จแล้ว:

- เพิ่มแพ็กเกจ Plugin ที่รวมมากับระบบใน `extensions/canvas`
- เพิ่ม `extensions/canvas/openclaw.plugin.json`
- ย้ายเครื่องมือ `canvas` ของเอเจนต์จาก `src/agents/tools/canvas-tool.ts` ไปยัง `extensions/canvas/src/tool.ts`
- นำการลงทะเบียน `createCanvasTool` ในแกนกลางออกจาก `src/agents/openclaw-tools.ts`
- ย้ายการติดตั้งใช้งานโฮสต์ Canvas จาก `src/canvas-host` ไปยัง `extensions/canvas/src/host`
- คง `extensions/canvas/runtime-api.ts` ไว้เป็น compatibility barrel ที่ Plugin เป็นเจ้าของ สำหรับการทดสอบ การจัดแพ็กเกจ และตัวช่วย Canvas สาธารณะภายนอก
- ย้ายการจัดทำเอกสาร Canvas ให้อยู่ในรูปแบบพร้อมใช้งานจาก `src/gateway/canvas-documents.ts` ไปยัง `extensions/canvas/src/documents.ts`
- ย้ายการติดตั้งใช้งาน CLI ของ Canvas และตัวช่วย JSONL ของ A2UI ไปยัง `extensions/canvas/src/cli.ts`
- ย้าย URL โฮสต์ Canvas และตัวช่วยความสามารถที่จำกัดขอบเขตไปยัง `extensions/canvas/src`
- ย้ายค่าเริ่มต้นของคำสั่ง Node ของ Canvas ออกจากรายการแกนกลางที่เขียนค่าตายตัว ไปยัง `nodeInvokePolicies` ของ Plugin
- เพิ่มการกำหนดค่าโฮสต์ Canvas ที่ Plugin เป็นเจ้าของไว้ที่ `plugins.entries.canvas.config.host`
- ย้ายการให้บริการ HTTP ของ Canvas และ A2UI ไปอยู่หลังการลงทะเบียนเส้นทาง HTTP ของ Plugin Canvas
- เพิ่มการส่งต่อการอัปเกรด WebSocket ของ Plugin แบบทั่วไปสำหรับเส้นทาง HTTP ที่ Plugin เป็นเจ้าของ
- แทนที่ URL โฮสต์ Gateway และการตรวจสอบสิทธิ์ความสามารถของ Node ที่เจาะจงกับ Canvas ด้วยพื้นผิว Plugin แบบโฮสต์และตัวช่วยความสามารถของ Node ที่ใช้ร่วมกันได้
- เพิ่มตัวแก้ไขสื่อแบบโฮสต์ที่ Plugin เป็นเจ้าของ เพื่อให้ URL เอกสาร Canvas แก้ไขผ่าน Plugin Canvas แทนที่แกนกลางจะนำเข้ารายละเอียดภายในของเอกสาร Canvas
- เพิ่ม `api.registerNodeCliFeature(...)` เพื่อให้ Canvas สามารถประกาศ `openclaw nodes canvas` เป็นฟีเจอร์ Node ที่ Plugin เป็นเจ้าของ โดยไม่ต้องระบุเส้นทางคำสั่งแม่ด้วยตนเอง
- นำการนำเข้า `extensions/canvas/runtime-api.js` จาก `src/**` ในโค้ดที่ใช้จริงออก
- ย้ายซอร์สบันเดิล A2UI จาก `apps/shared/OpenClawKit/Tools/CanvasA2UI` ไปยัง `extensions/canvas/src/host/a2ui-app`
- ย้ายการติดตั้งใช้งานสำหรับการบิลด์/คัดลอก A2UI ไปไว้ภายใต้ `extensions/canvas/scripts` และแทนที่การเชื่อมโยงการบิลด์ระดับรากด้วยฮุกแอสเซ็ต Plugin ที่รวมมากับระบบแบบทั่วไป
- นำชื่อแทนการกำหนดค่าระดับบนแบบเก่า `canvasHost` ออกจาก runtime
- คงการย้ายข้อมูล Canvas ของ doctor ไว้ เพื่อให้ `openclaw doctor --fix` เขียนการกำหนดค่า `canvasHost` แบบเก่าใหม่เป็น `plugins.entries.canvas.config.host`
- นำความเข้ากันได้ของโปรโตคอล Canvas สำหรับเอเจนต์รุ่นเก่าที่อยู่หลังโปรโตคอล Gateway v4 ออก ปัจจุบันไคลเอนต์แบบเนทีฟและ Gateway ใช้เพียง `pluginSurfaceUrls.canvas` ร่วมกับ `node.pluginSurface.refresh` เท่านั้น ส่วนเส้นทาง `canvasHostUrl`, `canvasCapability` และ `node.canvas.capability.refresh` ที่เลิกใช้แล้วจะไม่ได้รับการรองรับโดยเจตนาในการปรับโครงสร้างเชิงทดลองครั้งนี้
- อัปเดตบัญชีรายการ Plugin ที่สร้างขึ้นให้รวม Canvas
- เพิ่มเอกสารอ้างอิง Plugin ที่ `docs/plugins/reference/canvas.md`

พื้นผิว Canvas ที่แกนกลางยังคงเป็นเจ้าของและทราบอยู่แล้ว:

- ตัวจัดการ Canvas ของแอปแบบเนทีฟภายใต้ `apps/` ยังคงใช้พื้นผิว Plugin Canvas โดยเจตนา
- ตัวจัดการโปรโตคอล/ไคลเอนต์ Canvas ของแอปแบบเนทีฟภายใต้ `apps/`
- เอาต์พุตอาร์ติแฟกต์ที่เผยแพร่ยังคงใช้ `dist/canvas-host/a2ui` เพื่อให้การค้นหา runtime เข้ากันได้กับเวอร์ชันก่อนหน้า แต่ขณะนี้ขั้นตอนการคัดลอกเป็นของ Plugin แล้ว

## รูปแบบเป้าหมาย

`extensions/canvas` ควรเป็นเจ้าของ:

- ไฟล์ manifest และข้อมูลเมตาของแพ็กเกจ Plugin
- การลงทะเบียนเครื่องมือของเอเจนต์
- นโยบายคำสั่งเรียกใช้ Node
- โฮสต์ Canvas และ runtime ของ A2UI
- ซอร์สบันเดิล Canvas A2UI และสคริปต์บิลด์/คัดลอกแอสเซ็ต
- การสร้างเอกสาร Canvas และการแก้ไขแอสเซ็ต
- การติดตั้งใช้งาน CLI ของ Canvas
- หน้าเอกสาร Canvas และรายการในบัญชีรายการ Plugin

แกนกลางควรเป็นเจ้าของเฉพาะจุดเชื่อมต่อทั่วไป:

- การค้นหาและลงทะเบียน Plugin
- รีจิสทรีเครื่องมือของเอเจนต์แบบทั่วไป
- รีจิสทรีนโยบายการเรียกใช้ Node แบบทั่วไป
- การส่งต่อ HTTP/การตรวจสอบสิทธิ์ของ Gateway และการอัปเกรด WebSocket แบบทั่วไป
- การแก้ไข URL พื้นผิว Plugin แบบโฮสต์ที่ใช้ร่วมกันได้
- การลงทะเบียนตัวแก้ไขสื่อแบบโฮสต์ที่ใช้ร่วมกันได้
- การขนส่งความสามารถของ Node แบบทั่วไป
- โครงสร้างพื้นฐานการกำหนดค่าแบบทั่วไป
- การค้นหาฮุกแอสเซ็ต Plugin ที่รวมมากับระบบแบบทั่วไป

แอปแบบเนทีฟอาจคงตัวจัดการคำสั่ง Canvas ไว้ในฐานะไคลเอนต์ของโปรโตคอล แอปเหล่านี้ไม่ใช่เจ้าของ runtime ของ Plugin

## ขั้นตอนการย้าย

1. ถือว่า `plugins.entries.canvas.config.host` เป็นพื้นผิวการกำหนดค่าที่ Plugin เป็นเจ้าของ
2. อัปเดตเอกสารให้อธิบายว่า Canvas เป็น Plugin ที่รวมมากับระบบและอยู่ในขั้นทดลอง
3. เรียกใช้การทดสอบ Canvas แบบเจาะจง การตรวจสอบบัญชีรายการ Plugin การตรวจสอบ API ของ SDK Plugin และเกตการบิลด์/ประเภทที่ได้รับผลกระทบจากขอบเขตของ runtime

## รายการตรวจสอบการตรวจประเมิน

ก่อนระบุว่าการปรับโครงสร้างเสร็จสมบูรณ์:

- `rg "src/canvas-host|../canvas-host"` ต้องไม่พบการนำเข้าซอร์สที่ยังใช้งานอยู่
- `rg "canvas-tool|createCanvasTool" src` ต้องไม่พบการติดตั้งใช้งานเครื่องมือ Canvas ที่แกนกลางเป็นเจ้าของ
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` ต้องไม่พบค่าเริ่มต้นของรายการอนุญาตที่เขียนค่าตายตัวนอกการทดสอบนโยบาย Plugin แบบทั่วไป
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` ต้องไม่มีผลลัพธ์
- `rg "canvas-documents" src` ต้องไม่มีผลลัพธ์
- `rg "registerNodesCanvasCommands|nodes-canvas" src` ต้องไม่มีผลลัพธ์ โดย Plugin Canvas จะลงทะเบียน `openclaw nodes canvas` ผ่านข้อมูลเมตา CLI ของ Plugin แบบซ้อน
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` ต้องไม่พบความเป็นเจ้าของ runtime ของ Gateway
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` ต้องพบเฉพาะ wrapper สำหรับความเข้ากันได้หรือเส้นทางที่ Plugin เป็นเจ้าของ
- `pnpm plugins:inventory:check` ผ่าน
- `pnpm plugin-sdk:api:check` ผ่าน หรือมีการอัปเดตและตรวจทานค่าฐาน API ที่สร้างขึ้นโดยเจตนา
- การทดสอบ Canvas แบบเจาะจงผ่าน
- การทดสอบเลนที่เปลี่ยนแปลงสำหรับเส้นทางโฮสต์ Canvas/A2UI ผ่าน
- เนื้อหา PR ระบุอย่างชัดเจนว่า Canvas อยู่ในขั้นทดลองและทำงานผ่าน Plugin

## คำสั่งตรวจสอบ

ใช้การตรวจสอบในเครื่องแบบเจาะจงระหว่างการปรับแก้:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

เรียกใช้ `pnpm build` ก่อนพุช หากมีการเปลี่ยนแปลง runtime barrel, การนำเข้าแบบ lazy, การจัดแพ็กเกจ หรือพื้นผิว Plugin ที่เผยแพร่
