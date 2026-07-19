---
read_when:
    - การย้ายความเป็นเจ้าของโฮสต์ Canvas เครื่องมือ คำสั่ง เอกสาร หรือโปรโตคอล
    - ตรวจสอบว่า Canvas ยังคงอยู่ภายใต้การดูแลของคอร์หรือไม่
    - การเตรียมหรือรีวิว PR ของ Plugin Canvas รุ่นทดลอง
summary: แผนและรายการตรวจสอบการตรวจประเมินสำหรับการย้าย Canvas ออกจากแกนหลักไปยัง Plugin รุ่นทดลองที่รวมมาในชุด
title: การปรับโครงสร้าง Plugin Canvas
x-i18n:
    generated_at: "2026-07-19T08:00:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ead3f865ea80acb1e47f45a5ab07acf19a6470035c00c81006b2b1230bedd71e
    source_path: refactor/canvas.md
    workflow: 16
---

# การปรับโครงสร้าง Plugin Canvas

Canvas มีการใช้งานน้อยและอยู่ในขั้นทดลอง ให้ถือว่าเป็น Plugin ที่รวมมาในชุด ไม่ใช่ฟีเจอร์หลัก ส่วนแกนอาจคงระบบเชื่อมต่อทั่วไปสำหรับ Gateway, Node, HTTP, การยืนยันตัวตน, การกำหนดค่า และไคลเอนต์เนทีฟไว้ได้ แต่พฤติกรรมเฉพาะของ Canvas ควรอยู่ภายใต้ `extensions/canvas`

## เป้าหมาย

ย้ายความเป็นเจ้าของ Canvas ไปยัง `extensions/canvas` โดยคงพฤติกรรม Node ที่จับคู่ไว้ในปัจจุบัน:

- เครื่องมือ `canvas` สำหรับเอเจนต์ได้รับการลงทะเบียนโดย Plugin Canvas
- อนุญาตคำสั่ง Node ของ Canvas เฉพาะเมื่อ Plugin Canvas ลงทะเบียนคำสั่งเหล่านั้น
- ไฟล์โฮสต์/ซอร์สของ A2UI อยู่ภายใต้ Plugin Canvas
- การสร้างเอกสาร Canvas ให้อยู่ในรูปที่ใช้งานได้อยู่ภายใต้ Plugin Canvas
- การใช้งานคำสั่ง CLI อยู่ภายใต้ Plugin Canvas หรือมอบหมายผ่าน runtime barrel ที่ Plugin เป็นเจ้าของ
- เอกสารและรายการ Plugin ระบุว่า Canvas เป็นฟีเจอร์ทดลองที่ทำงานผ่าน Plugin

## สิ่งที่ไม่ใช่เป้าหมาย

- อย่าออกแบบ UI Canvas ของแอปเนทีฟใหม่ในการปรับโครงสร้างครั้งนี้
- อย่าลบการรองรับโปรโตคอล/ไคลเอนต์ Canvas ออกจาก iOS, Android หรือ macOS เว้นแต่จะมีการตัดสินใจด้านผลิตภัณฑ์แยกต่างหากให้ลบ Canvas
- อย่าสร้างเฟรมเวิร์กบริการ Plugin แบบกว้างเพียงเพื่อ Canvas เว้นแต่จะมี Plugin อื่นที่รวมมาในชุดอย่างน้อยหนึ่งรายการต้องใช้จุดเชื่อมเดียวกัน

## สถานะของบรานช์ปัจจุบัน

เสร็จแล้ว:

- เพิ่มแพ็กเกจ Plugin ที่รวมมาในชุดใน `extensions/canvas`
- เพิ่ม `extensions/canvas/openclaw.plugin.json`
- ย้ายเครื่องมือ `canvas` ของเอเจนต์จาก `src/agents/tools/canvas-tool.ts` ไปยัง `extensions/canvas/src/tool.ts`
- ลบการลงทะเบียน `createCanvasTool` ในแกนออกจาก `src/agents/openclaw-tools.ts`
- ย้ายการใช้งานโฮสต์ Canvas จาก `src/canvas-host` ไปยัง `extensions/canvas/src/host`
- คง `extensions/canvas/runtime-api.ts` ไว้เป็น compatibility barrel ที่ Plugin เป็นเจ้าของ สำหรับการทดสอบ การจัดแพ็กเกจ และตัวช่วย Canvas สาธารณะภายนอก
- ย้ายการสร้างเอกสาร Canvas ให้อยู่ในรูปที่ใช้งานได้จาก `src/gateway/canvas-documents.ts` ไปยัง `extensions/canvas/src/documents.ts`
- ย้ายการใช้งาน CLI ของ Canvas และตัวช่วย JSONL ของ A2UI ไปไว้ใน `extensions/canvas/src/cli.ts`
- ย้าย URL โฮสต์ Canvas และตัวช่วยความสามารถแบบจำกัดขอบเขตไปไว้ใน `extensions/canvas/src`
- ย้ายค่าเริ่มต้นของคำสั่ง Node สำหรับ Canvas ออกจากรายการที่ฮาร์ดโค้ดในแกนไปไว้ใน `nodeInvokePolicies` ของ Plugin
- เพิ่มการกำหนดค่าโฮสต์ Canvas ที่ Plugin เป็นเจ้าของใน `plugins.entries.canvas.config.host`
- ย้ายการให้บริการ HTTP ของ Canvas และ A2UI ไปอยู่เบื้องหลังการลงทะเบียนเส้นทาง HTTP ของ Plugin Canvas
- เพิ่มการส่งต่อการอัปเกรด WebSocket แบบทั่วไปสำหรับเส้นทาง HTTP ที่ Plugin เป็นเจ้าของ
- แทนที่ URL โฮสต์ Canvas และการยืนยันสิทธิ์ความสามารถของ Node ที่เฉพาะเจาะจงกับ Canvas ใน Gateway ด้วยพื้นผิว Plugin แบบโฮสต์และตัวช่วยความสามารถของ Node ที่เป็นแบบทั่วไป
- เพิ่มตัวแก้ไขสื่อที่โฮสต์ซึ่ง Plugin เป็นเจ้าของ เพื่อให้ URL เอกสาร Canvas แก้ไขผ่าน Plugin Canvas แทนที่แกนจะนำเข้ารายละเอียดภายในของเอกสาร Canvas
- เพิ่ม `api.registerNodeCliFeature(...)` เพื่อให้ Canvas สามารถประกาศ `openclaw nodes canvas` เป็นฟีเจอร์ Node ที่ Plugin เป็นเจ้าของได้โดยไม่ต้องระบุพาธคำสั่งแม่ด้วยตนเอง
- ลบการนำเข้า `extensions/canvas/runtime-api.js` ของ `src/**` ในโปรดักชัน
- ย้ายซอร์สบันเดิล A2UI จาก `apps/shared/OpenClawKit/Tools/CanvasA2UI` ไปยัง `extensions/canvas/src/host/a2ui-app`
- ย้ายการใช้งานสำหรับสร้าง/คัดลอก A2UI ไปไว้ภายใต้ `extensions/canvas/scripts` และแทนที่การเชื่อมต่อระบบสร้างที่รูทด้วยฮุกแอสเซ็ต Plugin ที่รวมมาในชุดแบบทั่วไป
- ลบชื่อแทนการกำหนดค่าระดับบนสุด `canvasHost` แบบเก่าที่ runtime ใช้ออก
- คงการย้ายข้อมูล Canvas ของ doctor ไว้ เพื่อให้ `openclaw doctor --fix` เขียนการกำหนดค่า `canvasHost` แบบเก่าใหม่เป็น `plugins.entries.canvas.config.host`
- ลบความเข้ากันได้ของโปรโตคอล Canvas สำหรับเอเจนต์รุ่นเก่าภายใต้โปรโตคอล Gateway v4 ขณะนี้ไคลเอนต์เนทีฟและ Gateway ใช้เฉพาะ `pluginSurfaceUrls.canvas` ร่วมกับ `node.pluginSurface.refresh` เท่านั้น โดยพาธ `canvasHostUrl`, `canvasCapability` และ `node.canvas.capability.refresh` ที่เลิกใช้แล้วไม่ได้รับการรองรับโดยเจตนาในการปรับโครงสร้างเชิงทดลองครั้งนี้
- อัปเดตรายการ Plugin ที่สร้างขึ้นให้รวม Canvas
- เพิ่มเอกสารอ้างอิง Plugin ที่ `docs/plugins/reference/canvas.md`

พื้นผิว Canvas ที่แกนยังเป็นเจ้าของและทราบว่ายังคงเหลืออยู่:

- ตัวจัดการ Canvas ของแอปเนทีฟภายใต้ `apps/` ยังคงใช้งานพื้นผิวของ Plugin Canvas โดยเจตนา
- ตัวจัดการโปรโตคอล/ไคลเอนต์ Canvas ของแอปเนทีฟภายใต้ `apps/`
- เอาต์พุตอาร์ติแฟกต์ที่เผยแพร่ยังคงใช้ `dist/canvas-host/a2ui` สำหรับการค้นหา runtime ที่เข้ากันได้ย้อนหลัง แต่ขณะนี้ขั้นตอนการคัดลอกเป็นของ Plugin แล้ว

## โครงสร้างเป้าหมาย

`extensions/canvas` ควรเป็นเจ้าของ:

- ไฟล์ manifest และข้อมูลเมตาของแพ็กเกจ Plugin
- การลงทะเบียนเครื่องมือของเอเจนต์
- นโยบายคำสั่งเรียกใช้ Node
- โฮสต์ Canvas และ runtime ของ A2UI
- ซอร์สบันเดิล A2UI ของ Canvas และสคริปต์สร้าง/คัดลอกแอสเซ็ต
- การสร้างเอกสาร Canvas และการแก้ไขแอสเซ็ต
- การใช้งาน CLI ของ Canvas
- หน้าเอกสาร Canvas และรายการในบัญชี Plugin

แกนควรเป็นเจ้าของเฉพาะจุดเชื่อมทั่วไป:

- การค้นหาและลงทะเบียน Plugin
- รีจิสทรีเครื่องมือของเอเจนต์แบบทั่วไป
- รีจิสทรีนโยบายการเรียกใช้ Node แบบทั่วไป
- HTTP/การยืนยันตัวตนของ Gateway และการส่งต่อการอัปเกรด WebSocket แบบทั่วไป
- การแก้ไข URL ของพื้นผิว Plugin แบบโฮสต์โดยทั่วไป
- การลงทะเบียนตัวแก้ไขสื่อแบบโฮสต์โดยทั่วไป
- การขนส่งความสามารถของ Node แบบทั่วไป
- ระบบเชื่อมต่อการกำหนดค่าแบบทั่วไป
- การค้นหาฮุกแอสเซ็ตของ Plugin ที่รวมมาในชุดแบบทั่วไป

แอปเนทีฟอาจคงตัวจัดการคำสั่ง Canvas ไว้ในฐานะไคลเอนต์ของโปรโตคอล แอปเหล่านี้ไม่ใช่เจ้าของ runtime ของ Plugin

## ขั้นตอนการย้าย

1. ถือว่า `plugins.entries.canvas.config.host` เป็นพื้นผิวการกำหนดค่าที่ Plugin เป็นเจ้าของ
2. อัปเดตเอกสารเพื่ออธิบายว่า Canvas เป็น Plugin แบบทดลองที่รวมมาในชุด
3. เรียกใช้การทดสอบ Canvas แบบเจาะจง การตรวจสอบรายการ Plugin การตรวจสอบ API ของ Plugin SDK และเกตการสร้าง/ชนิดข้อมูลที่ได้รับผลกระทบจากขอบเขต runtime

## รายการตรวจสอบการตรวจประเมิน

ก่อนระบุว่าการปรับโครงสร้างเสร็จสมบูรณ์:

- `rg "src/canvas-host|../canvas-host"` ไม่พบการนำเข้าซอร์สที่ใช้งานอยู่
- `rg "canvas-tool|createCanvasTool" src` ไม่พบการใช้งานเครื่องมือ Canvas ที่แกนเป็นเจ้าของ
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` ไม่พบค่าเริ่มต้นของรายการอนุญาตที่ฮาร์ดโค้ดไว้นอกการทดสอบนโยบาย Plugin แบบทั่วไป
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` ว่างเปล่า
- `rg "canvas-documents" src` ว่างเปล่า
- `rg "registerNodesCanvasCommands|nodes-canvas" src` ว่างเปล่า โดย Plugin Canvas ลงทะเบียน `openclaw nodes canvas` ผ่านข้อมูลเมตา CLI ของ Plugin แบบซ้อน
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` ไม่พบความเป็นเจ้าของ runtime ของ Gateway
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` พบเฉพาะตัวห่อหุ้มเพื่อความเข้ากันได้หรือพาธที่ Plugin เป็นเจ้าของ
- `pnpm plugins:inventory:check` ผ่าน
- `pnpm plugin-sdk:api:check` ผ่าน หรือระเบียนสัญญา API ที่สร้างขึ้นได้รับการอัปเดตและตรวจทานโดยเจตนา
- การทดสอบ Canvas แบบเจาะจงผ่าน
- การทดสอบ changed-lanes สำหรับพาธโฮสต์ Canvas/A2UI ผ่าน
- เนื้อหา PR ระบุอย่างชัดเจนว่า Canvas เป็นฟีเจอร์ทดลองและทำงานผ่าน Plugin

## คำสั่งตรวจสอบ

ใช้การตรวจสอบภายในเครื่องแบบเจาะจงระหว่างการปรับแก้:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

เรียกใช้ `pnpm build` ก่อน push หาก runtime barrel, การนำเข้าแบบ lazy, การจัดแพ็กเกจ หรือพื้นผิว Plugin ที่เผยแพร่มีการเปลี่ยนแปลง
