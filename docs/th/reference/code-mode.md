---
read_when:
    - คุณต้องการเปิดใช้งานโหมดโค้ดของ OpenClaw สำหรับการรันเอเจนต์
    - คุณต้องอธิบายว่าเหตุใดโหมดโค้ดจึงแตกต่างจากโหมดโค้ดของ Codex
    - คุณกำลังตรวจสอบข้อตกลง exec/wait, แซนด์บ็อกซ์ QuickJS-WASI, การแปลง TypeScript หรือบริดจ์แค็ตตาล็อกเครื่องมือที่ซ่อนอยู่
    - คุณกำลังเพิ่มหรือตรวจสอบการผสานรวมรีจิสทรีเนมสเปซของโหมดโค้ดภายใน
sidebarTitle: Code mode
summary: 'โหมดโค้ดของ OpenClaw: พื้นผิวเครื่องมือ exec/wait แบบเลือกใช้ ซึ่งรองรับด้วย QuickJS-WASI และแค็ตตาล็อกเครื่องมือที่ซ่อนอยู่ซึ่งมีขอบเขตตามการรัน'
title: โหมดโค้ด
x-i18n:
    generated_at: "2026-06-27T18:19:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

โหมดโค้ดเป็นฟีเจอร์ agent-runtime เชิงทดลองของ OpenClaw โดยปิดไว้เป็นค่าเริ่มต้น เมื่อคุณเปิดใช้ OpenClaw จะเปลี่ยนสิ่งที่โมเดลเห็นสำหรับการรันหนึ่งครั้ง: แทนที่จะเปิดเผยสคีมาของเครื่องมือที่เปิดใช้ทุกตัวโดยตรง โมเดลจะเห็นเฉพาะ `exec` และ `wait`

หน้านี้จัดทำเอกสารโหมดโค้ดของ OpenClaw ไม่ใช่โหมดโค้ดของ Codex ฟีเจอร์ทั้งสองใช้ชื่อร่วมกัน แต่ถูกใช้งานโดยรันไทม์คนละชุดและเปิดเผยสัญญา `exec` ที่ต่างกัน:

- โหมดโค้ดของ Codex เปิดใช้สำหรับเธรด app-server ของ Codex เว้นแต่นโยบายเครื่องมือแบบจำกัดจะปิดใช้โหมดโค้ดแบบเนทีฟ โหมดนี้ทำงานในฮาร์เนสเขียนโค้ดของ Codex ซึ่งโมเดลเขียนคำสั่งเชลล์ผ่านสัญญา `exec.command`
- โหมดโค้ดของ OpenClaw จะปิดใช้ไว้ เว้นแต่จะกำหนดค่า `tools.codeMode.enabled: true` โหมดนี้ทำงานในรันไทม์เอเจนต์ทั่วไปของ OpenClaw ซึ่งโมเดลเขียนโปรแกรม JavaScript หรือ TypeScript ผ่านสัญญา `exec.code`

โหมดโค้ดของ Codex และการค้นหาเครื่องมือแบบไดนามิกเนทีฟของ Codex เป็นพื้นผิวฮาร์เนส Codex ที่เสถียร โหมดโค้ดของ OpenClaw เป็นอะแดปเตอร์พื้นผิวเครื่องมือเชิงทดลองที่ OpenClaw เป็นเจ้าของสำหรับการรัน OpenClaw ทั่วไป โหมดนี้ใช้ `quickjs-wasi`, แค็ตตาล็อกเครื่องมือ OpenClaw แบบซ่อน และตัวดำเนินการเครื่องมือ OpenClaw ปกติ

## นี่คืออะไร?

โหมดโค้ดของ OpenClaw ให้โมเดลเขียนโปรแกรม JavaScript หรือ TypeScript ขนาดเล็กแทนการเลือกโดยตรงจากรายการเครื่องมือยาว ๆ

เมื่อโหมดโค้ดทำงาน:

- รายการเครื่องมือที่โมเดลมองเห็นคือ `exec` และ `wait` เท่านั้น
- `exec` ประเมิน JavaScript หรือ TypeScript ที่โมเดลสร้างขึ้นในเวิร์กเกอร์ QuickJS-WASI ที่ถูกจำกัด
- เครื่องมือ OpenClaw ปกติจะถูกซ่อนจากพรอมป์ต์ของโมเดลและเปิดเผยภายในโปรแกรม guest ผ่าน `ALL_TOOLS` และ `tools`
- โค้ด guest สามารถค้นหาแค็ตตาล็อกที่ซ่อน อธิบายเครื่องมือ และเรียกเครื่องมือผ่านเส้นทางการดำเนินการเดียวกับที่ OpenClaw ใช้ในการเทิร์นเอเจนต์ปกติ
- เครื่องมือ MCP ถูกจัดกลุ่มภายใต้เนมสเปซ `MCP` ในโหมดโค้ด เนมสเปซนี้เป็นวิธีเดียวที่รองรับสำหรับการเรียกเครื่องมือ MCP
- `wait` ดำเนินการรันโหมดโค้ดที่ถูกระงับต่อ เมื่อการเรียกเครื่องมือแบบซ้อนยังค้างอยู่

ความแตกต่างสำคัญคือ: โหมดโค้ดเปลี่ยนพื้นผิวการประสานงานที่โมเดลเห็น ไม่ได้แทนที่เครื่องมือ OpenClaw, เครื่องมือ Plugin, เครื่องมือ MCP, การยืนยันตัวตน, นโยบายการอนุมัติ, พฤติกรรมช่องทาง หรือการเลือกโมเดล

## ทำไมสิ่งนี้จึงดี?

โหมดโค้ดทำให้แค็ตตาล็อกเครื่องมือขนาดใหญ่ใช้งานได้ง่ายขึ้นสำหรับโมเดล

- พื้นผิวพรอมป์ต์เล็กลง: ผู้ให้บริการได้รับเครื่องมือควบคุมสองตัวแทนสคีมาเครื่องมือเต็มหลายสิบหรือหลายร้อยรายการ
- การประสานงานดีขึ้น: โมเดลสามารถใช้ลูป การ join การแปลงขนาดเล็ก ตรรกะมีเงื่อนไข และการเรียกเครื่องมือแบบซ้อนขนานภายในเซลล์โค้ดเดียว
- เป็นกลางต่อผู้ให้บริการ: ใช้ได้กับเครื่องมือ OpenClaw, Plugin, MCP และไคลเอนต์ โดยไม่ขึ้นกับการรันโค้ดเนทีฟของผู้ให้บริการ
- นโยบายเดิมยังมีผล: การเรียกเครื่องมือแบบซ้อนยังผ่านนโยบาย OpenClaw การอนุมัติ hook บริบทเซสชัน และเส้นทางการตรวจสอบ
- โหมดล้มเหลวชัดเจน: เมื่อเปิดใช้โหมดโค้ดอย่างชัดเจนและรันไทม์ใช้งานไม่ได้ OpenClaw จะปิดการทำงานอย่างปลอดภัยแทนการย้อนกลับไปเปิดเผยเครื่องมือโดยตรงแบบกว้าง

โหมดโค้ดมีประโยชน์เป็นพิเศษสำหรับเอเจนต์ที่มีแค็ตตาล็อกเครื่องมือที่เปิดใช้จำนวนมาก หรือสำหรับเวิร์กโฟลว์ที่โมเดลต้องค้นหา รวม และเรียกเครื่องมือซ้ำ ๆ ก่อนสร้างคำตอบ

## วิธีเปิดใช้

เพิ่ม `tools.codeMode.enabled: true` ลงในการกำหนดค่าเอเจนต์หรือรันไทม์:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

รองรับรูปแบบย่อด้วย:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

โหมดโค้ดยังคงปิดอยู่เมื่อไม่ระบุ `tools.codeMode`, เป็น `false`, หรือเป็นอ็อบเจกต์ที่ไม่มี `enabled: true`

เมื่อคุณใช้เอเจนต์แบบ sandbox พร้อมเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ ให้ตรวจสอบด้วยว่านโยบายเครื่องมือ sandbox อนุญาต Plugin MCP ที่รวมมา เช่นด้วย `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]` ดู
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)

ใช้ขีดจำกัดแบบชัดเจนเมื่อคุณต้องการขอบเขตที่เข้มงวดขึ้น:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

เพื่อยืนยันรูปทรง payload ของโมเดลระหว่างดีบัก ให้รัน Gateway พร้อมการบันทึกที่เจาะจง:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

เมื่อโหมดโค้ดทำงาน ชื่อเครื่องมือที่โมเดลเห็นในล็อกควรเป็น `exec` และ `wait` หากคุณต้องการ payload ผู้ให้บริการแบบปกปิดข้อมูล ให้เพิ่ม `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` สำหรับเซสชันดีบักสั้น ๆ

## ภาพรวมทางเทคนิค

ส่วนที่เหลือของหน้านี้อธิบายสัญญารันไทม์และรายละเอียดการใช้งาน มีไว้สำหรับผู้ดูแล ผู้เขียน Plugin ที่กำลังดีบักการเปิดเผยเครื่องมือ และผู้ปฏิบัติการที่ตรวจสอบการปรับใช้ที่มีความเสี่ยงสูง

## สถานะรันไทม์

- รันไทม์: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)
- สถานะเริ่มต้น: ปิดใช้
- ความเสถียร: พื้นผิว OpenClaw เชิงทดลอง; โหมดโค้ดของ Codex เป็นพื้นผิวฮาร์เนส Codex ที่เสถียรแยกต่างหาก
- พื้นผิวเป้าหมาย: การรันเอเจนต์ OpenClaw ทั่วไป
- ท่าทีด้านความปลอดภัย: โค้ดจากโมเดลถือว่าไม่ไว้วางใจ
- คำมั่นต่อผู้ใช้: การเปิดใช้โหมดโค้ดจะไม่ย้อนกลับไปเปิดเผยเครื่องมือโดยตรงแบบกว้างอย่างเงียบ ๆ

## ขอบเขต

โหมดโค้ดเป็นเจ้าของรูปทรงการประสานงานที่โมเดลเห็นสำหรับการรันที่เตรียมไว้ ไม่ได้เป็นเจ้าของการเลือกโมเดล พฤติกรรมช่องทาง การยืนยันตัวตน นโยบายเครื่องมือ หรือการใช้งานเครื่องมือ

อยู่ในขอบเขต:

- นิยามเครื่องมือ `exec` และ `wait` ที่โมเดลมองเห็น
- การสร้างแค็ตตาล็อกเครื่องมือแบบซ่อน
- การรัน guest ด้วย JavaScript และ TypeScript
- รันไทม์เวิร์กเกอร์ QuickJS-WASI
- callback ฝั่ง host สำหรับการค้นหาแค็ตตาล็อก การอธิบายสคีมา และการเรียกเครื่องมือ
- สถานะที่ดำเนินต่อได้สำหรับโปรแกรม guest ที่ถูกระงับ
- ขีดจำกัดผลลัพธ์ timeout หน่วยความจำ การเรียกที่ค้างอยู่ และ snapshot
- telemetry และการฉาย trajectory สำหรับการเรียกเครื่องมือแบบซ้อน

อยู่นอกขอบเขต:

- การรันโค้ดระยะไกลแบบเนทีฟของผู้ให้บริการ
- ความหมายการรันเชลล์
- การเปลี่ยนการอนุญาตเครื่องมือที่มีอยู่
- สคริปต์ถาวรที่ผู้ใช้เขียน
- การเข้าถึง package manager, ไฟล์, เครือข่าย หรือโมดูลในโค้ด guest
- การนำ internals ของโหมดโค้ด Codex มาใช้ซ้ำโดยตรง

เครื่องมือที่ผู้ให้บริการเป็นเจ้าของ เช่น sandbox Python ระยะไกล ยังคงเป็นเครื่องมือแยกต่างหาก ดู
[การรันโค้ด](/th/tools/code-execution)

## คำศัพท์

**โหมดโค้ด** คือโหมดรันไทม์ของ OpenClaw ที่ซ่อนเครื่องมือโมเดลปกติและเปิดเผยเฉพาะ `exec` และ `wait`

**รันไทม์ guest** คือ VM JavaScript ของ QuickJS-WASI ที่ประเมินโค้ดโมเดล

**บริดจ์ host** คือพื้นผิว callback แบบเข้ากันได้กับ JSON ที่แคบ จากโค้ด guest กลับเข้า OpenClaw

**แค็ตตาล็อก** คือรายการเครื่องมือที่มีผลในขอบเขตการรัน หลังจากการแก้ไขนโยบายเครื่องมือ Plugin, MCP และเครื่องมือไคลเอนต์ตามปกติ

**การเรียกเครื่องมือแบบซ้อน** คือการเรียกเครื่องมือที่ทำจากโค้ด guest ผ่านบริดจ์ host

**Snapshot** คือสถานะ VM QuickJS-WASI ที่ serialize ไว้เพื่อให้ `wait` สามารถดำเนินการรันโหมดโค้ดที่ถูกระงับต่อได้

## การกำหนดค่า

`tools.codeMode.enabled` คือเกตการเปิดใช้งาน การตั้งค่าฟิลด์โหมดโค้ดอื่น ๆ จะไม่เปิดใช้ฟีเจอร์นี้

ฟิลด์ที่รองรับ:

- `enabled`: boolean ค่าเริ่มต้น `false` เปิดใช้โหมดโค้ดเฉพาะเมื่อเป็น `true`
- `runtime`: `"quickjs-wasi"` รันไทม์เดียวที่รองรับ
- `mode`: `"only"` เปิดเผย `exec` และ `wait`, ซ่อนเครื่องมือโมเดลปกติ
- `languages`: อาร์เรย์ของ `"javascript"` และ `"typescript"` ค่าเริ่มต้นรวมทั้งสองภาษา
- `timeoutMs`: เพดานเวลา wall-clock สำหรับ `exec` หรือ `wait` หนึ่งครั้ง ค่าเริ่มต้น `10000`
  ขอบเขตรันไทม์: `100` ถึง `60000`
- `memoryLimitBytes`: เพดาน heap ของ QuickJS ค่าเริ่มต้น `67108864` ขอบเขตรันไทม์:
  `1048576` ถึง `1073741824`
- `maxOutputBytes`: เพดานสำหรับข้อความ JSON และล็อกที่ส่งคืน ค่าเริ่มต้น `65536`
  ขอบเขตรันไทม์: `1024` ถึง `10485760`
- `maxSnapshotBytes`: เพดานสำหรับ snapshot ของ VM ที่ serialize แล้ว ค่าเริ่มต้น `10485760`
  ขอบเขตรันไทม์: `1024` ถึง `268435456`
- `maxPendingToolCalls`: เพดานสำหรับการเรียกเครื่องมือแบบซ้อนที่เกิดพร้อมกัน ค่าเริ่มต้น `16`
  ขอบเขตรันไทม์: `1` ถึง `128`
- `snapshotTtlSeconds`: ระยะเวลาที่ VM ที่ถูกระงับสามารถดำเนินต่อได้ ค่าเริ่มต้น `900`
  ขอบเขตรันไทม์: `1` ถึง `86400`
- `searchDefaultLimit`: จำนวนผลลัพธ์การค้นหาแค็ตตาล็อกแบบซ่อนเริ่มต้น ค่าเริ่มต้น `8`
  รันไทม์จำกัดค่านี้ไว้ที่ `maxSearchLimit`
- `maxSearchLimit`: จำนวนผลลัพธ์การค้นหาแค็ตตาล็อกแบบซ่อนสูงสุด ค่าเริ่มต้น `50`
  ขอบเขตรันไทม์: `1` ถึง `50`

หากเปิดใช้โหมดโค้ดแต่ QuickJS-WASI โหลดไม่ได้ OpenClaw จะปิดการทำงานอย่างปลอดภัยสำหรับการรันนั้น และจะไม่เปิดเผยเครื่องมือปกติอย่างเงียบ ๆ เป็น fallback

## การเปิดใช้งาน

โหมดโค้ดถูกประเมินหลังจากทราบนโยบายเครื่องมือที่มีผล และก่อนประกอบคำขอโมเดลขั้นสุดท้าย

ลำดับการเปิดใช้งาน:

1. แก้ไขเอเจนต์ โมเดล ผู้ให้บริการ sandbox ช่องทาง ผู้ส่ง และนโยบายการรัน
2. สร้างรายการเครื่องมือ OpenClaw ที่มีผล
3. เพิ่มเครื่องมือ Plugin, MCP และไคลเอนต์ที่มีสิทธิ์
4. ใช้นโยบายอนุญาตและปฏิเสธ
5. หาก `tools.codeMode.enabled` เป็น false ให้ดำเนินต่อด้วยการเปิดเผยเครื่องมือปกติ
6. หากเปิดใช้และเครื่องมือทำงานสำหรับการรัน ให้ลงทะเบียนเครื่องมือที่มีผลในแค็ตตาล็อกโหมดโค้ด
7. ลบเครื่องมือปกติทั้งหมดออกจากรายการเครื่องมือที่โมเดลมองเห็น
8. เพิ่ม `exec` และ `wait` ของโหมดโค้ด

การรันที่ตั้งใจให้ไม่มีเครื่องมือ เช่น การเรียกโมเดลดิบ `disableTools` หรือ allowlist ว่าง จะไม่เปิดใช้งานพื้นผิวโหมดโค้ด แม้การกำหนดค่าจะมี `tools.codeMode.enabled: true`

แค็ตตาล็อกโหมดโค้ดมีขอบเขตต่อการรัน ต้องไม่รั่วเครื่องมือจากเอเจนต์ เซสชัน ผู้ส่ง หรือการรันอื่น

## เครื่องมือที่โมเดลมองเห็น

เมื่อโหมดโค้ดทำงาน โมเดลจะเห็นเครื่องมือระดับบนสุดเหล่านี้เท่านั้น:

- `exec`
- `wait`

เครื่องมืออื่นทั้งหมดที่เปิดใช้จะถูกซ่อนจากรายการเครื่องมือที่โมเดลเห็นและลงทะเบียนในแค็ตตาล็อกโหมดโค้ด

โมเดลควรใช้ `exec` สำหรับการประสานงานเครื่องมือ การ join ข้อมูล ลูป การเรียกแบบซ้อนขนาน และการแปลงแบบมีโครงสร้าง โมเดลควรใช้ `wait` เฉพาะเมื่อ `exec` ส่งคืนผลลัพธ์ `waiting` ที่ดำเนินต่อได้

## `exec`

`exec` เริ่มเซลล์โหมดโค้ดและส่งคืนผลลัพธ์หนึ่งรายการ โค้ดอินพุตสร้างโดยโมเดลและต้องถือว่าไม่ไว้วางใจ

อินพุต:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

กฎอินพุต:

- ต้องมีหนึ่งใน `code` หรือ `command` ที่ไม่ว่าง
- `code` คือฟิลด์ที่จัดทำเอกสารไว้สำหรับโมเดล
- รองรับ `command` เป็น alias ที่เข้ากันได้กับ exec สำหรับนโยบาย hook และการเขียนใหม่ที่เชื่อถือได้; เมื่อมีทั้งสองค่า ค่าต้องตรงกัน
- เหตุการณ์ hook `exec` ของโหมดโค้ดชั้นนอกรวม `toolKind: "code_mode_exec"` และรวม `toolInputKind: "javascript" | "typescript"` เมื่อทราบภาษาอินพุต เพื่อให้นโยบายแยกเซลล์โหมดโค้ดออกจากการเรียก `exec` แบบเชลล์ที่ใช้ชื่อเครื่องมือเดียวกันได้
- `language` มีค่าเริ่มต้นเป็น `"javascript"`
- หาก `language` เป็น `"typescript"` OpenClaw จะ transpile ก่อนประเมิน
- `exec` ปฏิเสธ `import`, `require`, dynamic import และรูปแบบ module-loader ใน v1
- `exec` ไม่เปิดเผยการใช้งาน `exec` ของเชลล์ปกติแบบ recursive

ผลลัพธ์:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` ส่งคืน `waiting` เมื่อ QuickJS VM ระงับพร้อมสถานะที่ดำเนินต่อได้ซึ่งยังต้องการการดำเนินต่อที่โมเดลมองเห็น ผลลัพธ์มี `runId` สำหรับ `wait` การเรียกบริดจ์เนมสเปซ รวมถึงการเรียกเนมสเปซ MCP จะถูกระบายอัตโนมัติภายในการเรียก `exec`/`wait` เดียวกันเมื่อพร้อม ดังนั้นบล็อกโค้ดแบบกะทัดรัดสามารถตรวจสอบ `$api()` และเรียกเครื่องมือ MCP ได้โดยไม่บังคับให้มีการเรียกเครื่องมือโมเดลหนึ่งครั้งต่อการ await เนมสเปซ

`exec` คืนค่า `completed` เฉพาะเมื่อ VM ฝั่ง guest ไม่มีงานที่ค้างอยู่ และค่า
สุดท้ายเข้ากันได้กับ JSON หลังจาก adapter เอาต์พุตของ OpenClaw ทำงานแล้ว

## `wait`

`wait` ดำเนินการต่อกับ VM โหมดโค้ดที่ถูกระงับไว้

อินพุต:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

เอาต์พุตคือ union `CodeModeResult` เดียวกับที่ `exec` คืนค่า

`wait` มีอยู่เพราะเครื่องมือ OpenClaw ที่ซ้อนกันอาจช้า เป็นแบบโต้ตอบ ต้องผ่าน
การอนุมัติ หรือสตรีมการอัปเดตบางส่วน โมเดลไม่ควรต้องเปิดการเรียก `exec` ยาว ๆ
ไว้หนึ่งครั้งในขณะที่ host รองานภายนอก

snapshot และ restore ของ QuickJS-WASI คือกลไก resume ใน v1:

1. `exec` ประเมินโค้ดจนเสร็จสมบูรณ์ ล้มเหลว หรือถูกระงับ
2. เมื่อถูกระงับ OpenClaw จะ snapshot VM ของ QuickJS และบันทึกงานฝั่ง host
   ที่ค้างอยู่
3. เมื่องานที่ค้างอยู่เสร็จสิ้น `wait` จะ restore snapshot ของ VM
4. OpenClaw ลงทะเบียน callback ฝั่ง host ใหม่ด้วยชื่อที่เสถียร
5. OpenClaw ส่งผลลัพธ์ของเครื่องมือที่ซ้อนกันเข้าไปใน VM ที่ restore แล้ว
6. OpenClaw drain งานที่ค้างอยู่ของ QuickJS
7. `wait` คืนค่า `completed`, `failed` หรือผลลัพธ์ `waiting` อีกรายการหนึ่ง

Snapshot เป็นสถานะ runtime ไม่ใช่ artifact ของผู้ใช้ Snapshot มีการจำกัดขนาด
หมดอายุได้ และถูกจำกัดขอบเขตไว้กับ run และ session ที่สร้างมันขึ้นมา

`wait` ล้มเหลวเมื่อ:

- ไม่รู้จัก `runId`
- snapshot หมดอายุ
- run หรือ session แม่ถูก abort
- caller ไม่อยู่ในขอบเขต run/session เดียวกัน
- การ restore ของ QuickJS-WASI ล้มเหลว
- การ restore จะเกินขีดจำกัดที่กำหนดค่าไว้

## API runtime ฝั่ง guest

runtime ฝั่ง guest เปิดเผย API global ขนาดเล็ก:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` คือ metadata แบบกระชับสำหรับ catalog ที่จำกัดขอบเขตตาม run โดย
ค่าเริ่มต้นจะไม่มี schema แบบเต็ม

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Schema แบบเต็มจะโหลดเมื่อจำเป็นเท่านั้น:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

ตัวช่วย catalog:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

ฟังก์ชันเครื่องมือแบบสะดวกจะถูกติดตั้งเฉพาะสำหรับชื่อที่ปลอดภัยและไม่กำกวม:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

รายการ catalog ของ MCP ไม่สามารถเรียกผ่าน `tools.call(...)` หรือฟังก์ชัน
แบบสะดวกในโหมดโค้ดได้ รายการเหล่านี้ถูกเปิดเผยผ่าน namespace `MCP` ที่สร้างขึ้น
เท่านั้น ไฟล์ declaration แบบ TypeScript มีให้ผ่านพื้นผิวไฟล์เสมือน `API`
แบบอ่านอย่างเดียว เพื่อให้ agent ตรวจสอบ signature ของ MCP ได้โดยไม่ต้องเพิ่ม
schema ของ MCP ลงใน prompt:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` คืนค่า declaration แบบกระชับที่อนุมานจาก
metadata เครื่องมือ MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

ไฟล์ declaration เป็นไฟล์เสมือน ไม่ใช่ไฟล์ที่ถูกเขียนไว้ใต้ workspace หรือ
ไดเรกทอรี state สำหรับการเรียก `exec` ในโหมดโค้ดแต่ละครั้ง OpenClaw จะสร้าง
catalog เครื่องมือที่จำกัดขอบเขตตาม run เก็บรายการ MCP ที่มองเห็นได้ render
`mcp/index.d.ts` รวมถึง declaration `mcp/<server>.d.ts` หนึ่งรายการต่อ server
ที่มองเห็นได้ แล้ว inject ตารางอ่านอย่างเดียวขนาดเล็กนั้นเข้าไปใน worker ของ
QuickJS โค้ดฝั่ง guest จะเห็นเฉพาะอ็อบเจ็กต์ `API`: `API.list(prefix?)` คืนค่า
metadata ของไฟล์ และ `API.read(path)` คืนค่าเนื้อหา declaration ที่เลือก path
ที่ไม่รู้จักและ segment `.` / `..` จะถูกปฏิเสธ

สิ่งนี้ช่วยกัน schema ขนาดใหญ่ของ MCP ออกจาก prompt ของโมเดล agent จะเรียนรู้ว่า
API เสมือนมีอยู่จากคำอธิบายเครื่องมือ `exec` อ่านเฉพาะไฟล์ declaration ที่จำเป็น
จากนั้นเรียก `MCP.<server>.<tool>()` ด้วย argument อ็อบเจ็กต์หนึ่งรายการ
`MCP.<server>.$api()` ยังพร้อมใช้งานเป็น fallback แบบ inline เมื่อ agent
ต้องการ schema response ของเครื่องมือเดียวภายในโปรแกรม

runtime ฝั่ง guest ต้องไม่เปิดเผยอ็อบเจ็กต์ฝั่ง host โดยตรง อินพุตและเอาต์พุต
ข้าม bridge เป็นค่าที่เข้ากันได้กับ JSON พร้อมขีดจำกัดขนาดที่ชัดเจน

## Namespace ภายใน

Namespace ภายในทำให้โหมดโค้ดมี API โดเมนที่กระชับโดยไม่ต้องเพิ่มเครื่องมือ
ที่โมเดลมองเห็นได้อีก integration ที่ loader เป็นเจ้าของสามารถลงทะเบียน
namespace เช่น `Issues`, `Fictions` หรือ `Calendar`; จากนั้นโค้ดฝั่ง guest
จะเรียก namespace นั้นภายในโปรแกรม QuickJS ขณะที่ OpenClaw ยังแสดงเฉพาะ
`exec` และ `wait` ต่อโมเดล

ตอนนี้ namespace เป็นภายใน ยังไม่มี API namespace ของ SDK Plugin สาธารณะ:
namespace ของ Plugin ภายนอกต้องมี contract ที่ loader เป็นเจ้าของ เพื่อให้
identity ของ Plugin, manifest ที่ติดตั้งแล้ว, สถานะ auth และ descriptor ของ
catalog ที่แคชไว้ไม่ drift จากเครื่องมือ Plugin ที่หนุน namespace นั้น โหมดโค้ด
ของ core เป็นเจ้าของเฉพาะ sandbox, serialization, catalog gating และ bridge
dispatch

จากนั้นโค้ดฝั่ง guest สามารถใช้ได้ทั้ง global โดยตรงหรือ map `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Lifecycle ของ registry

Registry ของ namespace เป็นแบบ process-local และ keyed ด้วย id ของ namespace
run ทั่วไปจะเป็นไปตามเส้นทางนี้:

1. loader ที่เชื่อถือได้เรียก `registerCodeModeNamespaceForPlugin(pluginId, registration)`
2. โหมดโค้ดสร้าง `ToolSearchRuntime` ที่ซ่อนอยู่สำหรับ run และอ่าน catalog
   ที่จำกัดขอบเขตตาม run ของมัน
3. `createCodeModeNamespaceRuntime(ctx, catalog)` เก็บเฉพาะ registration
   ที่ `requiredToolNames` ทั้งหมดมองเห็นได้และมี `pluginId` เดียวกันเป็นเจ้าของ
4. namespace ที่มองเห็นได้แต่ละรายการเรียก `createScope(ctx)` สำหรับ run ปัจจุบัน
   scope ได้รับ context ของ run เช่น `agentId`, `sessionKey`, `sessionId`,
   `runId`, config และสถานะ abort
5. ข้อมูล scope ถูก serialize เป็น descriptor ธรรมดา และ inject เข้า QuickJS
   เป็น global โดยตรงและ `namespaces.<globalName>`
6. การเรียกจาก guest จะ suspend ผ่าน bridge ของ worker, resolve path ของ
   namespace บน host, map การเรียกไปยังเครื่องมือ catalog ที่ Plugin เป็นเจ้าของ
   และประกาศไว้ แล้ว execute เครื่องมือนั้นผ่าน `ToolSearchRuntime.call`
7. OpenClaw auto-drain การเรียก bridge ของ namespace ที่พร้อมแล้วภายในการเรียก
   เครื่องมือ `exec`/`wait` ที่ active หากงาน namespace ยัง pending เมื่อถึง
   timeout หรือ guest yield อย่างชัดเจน `wait` จะ resume runtime ของ namespace
   เดิมในภายหลัง
8. การ rollback หรือ uninstall Plugin เรียก `clearCodeModeNamespacesForPlugin(pluginId)`
   เพื่อไม่ให้ global ที่ stale อยู่รอดหลังจากการโหลด Plugin ล้มเหลว

Invariant สำคัญ: การเรียก namespace คือการเรียกเครื่องมือ catalog การเรียกเหล่านี้
ใช้ policy hook, approval, การจัดการ abort, telemetry, transcript projection
และพฤติกรรม suspend/resume เดียวกับ `tools.call(...)`

### รูปทรงการลงทะเบียน

ลงทะเบียน namespace จาก integration ที่เป็นเจ้าของเครื่องมือที่หนุนอยู่ รักษา
scope ให้เล็ก และเปิดเผยเฉพาะ verb ของโดเมนที่ map ไปยังเครื่องมือ catalog
ที่ประกาศไว้

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` ทำเครื่องหมาย member ของ
scope ให้เป็นฟังก์ชัน namespace ที่เรียกได้ `inputMapper` แบบ optional จะรับ
argument จาก guest และคืนค่าอ็อบเจ็กต์อินพุตสำหรับเครื่องมือ catalog ที่หนุนอยู่
หากไม่มี input mapper จะใช้ argument แรกจาก guest หรือ `{}` เมื่อถูกละไว้

ฟังก์ชัน host ดิบจะถูกปฏิเสธก่อนที่โค้ดฝั่ง guest จะทำงาน:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Ownership และ visibility

Ownership ของ namespace ผูกกับ `pluginId` ของ caller ที่ลงทะเบียน
`requiredToolNames` เป็นทั้ง visibility gate และการตรวจสอบ ownership:

- เครื่องมือที่ required ทุกตัวต้องมีอยู่ใน catalog ของ run
- เครื่องมือที่ required ทุกตัวต้องมี `sourceName === pluginId`
- namespace จะถูกซ่อนเมื่อเครื่องมือที่ required ใด ๆ หายไป หรือมี Plugin อื่น
  เป็นเจ้าของ
- path ที่เรียกได้แต่ละรายการอาจ target ได้เฉพาะเครื่องมือที่มีชื่ออยู่ใน
  `requiredToolNames`

สิ่งนี้ป้องกันไม่ให้ Plugin อื่นเปิดเผย namespace ด้วยการลงทะเบียนเครื่องมือ
ที่ชื่อเดียวกัน และยังทำให้ namespace สอดคล้องกับ policy ของ agent ตามปกติ:
หาก run มองไม่เห็นเครื่องมือที่หนุนอยู่ ก็จะมองไม่เห็น namespace

ตัวอย่างเช่น namespace ของ GitHub ควรอยู่หลัง extension ที่ GitHub เป็นเจ้าของ
ซึ่งเป็นเจ้าของ auth ของ GitHub, client ของ REST หรือ GraphQL, rate limit,
approval สำหรับการเขียน และการทดสอบ โหมดโค้ดของ core ไม่ควร embed API เฉพาะ
ของ GitHub, การจัดการ token หรือ policy ของ provider

### กฎการ serialize scope

`createScope(ctx)` อาจคืนค่าอ็อบเจ็กต์ธรรมดาที่มีค่าที่เข้ากันได้กับ JSON,
array, อ็อบเจ็กต์ซ้อน และ marker การเรียก `createCodeModeNamespaceTool(...)`
อ็อบเจ็กต์ฝั่ง host จะไม่เข้า QuickJS โดยตรง

Serializer ปฏิเสธ:

- ฟังก์ชันดิบ
- object graph ที่เป็นวงจร
- segment ของ path ที่ไม่ปลอดภัย: `__proto__`, `constructor`, `prototype`,
  key ว่าง หรือ key ที่มีตัวคั่น path ภายใน
- ค่า `globalName` ที่ไม่ใช่ JavaScript identifier
- การชนกันของ `globalName` กับ global built-in ของโหมดโค้ด เช่น `tools`,
  `namespaces`, `text`, `json`, `yield_control` หรือ `__openclaw*`

ค่าที่ไม่สามารถ serialize เป็น JSON ได้จะถูกแปลงเป็น fallback value ที่ปลอดภัย
สำหรับ JSON ก่อนข้าม bridge ข้อมูล binary, handle, socket, client และ instance
ของ class ควรอยู่หลังเครื่องมือ catalog ตามปกติ

### Prompt

`description` ของ namespace และ `prompt` แบบ optional จะถูกเพิ่มต่อท้าย schema
`exec` ที่โมเดลมองเห็นได้ เฉพาะเมื่อ namespace นั้นมองเห็นได้สำหรับ run นั้น
ใช้สิ่งเหล่านี้เพื่อสอนพื้นผิวที่มีประโยชน์น้อยที่สุด:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

ให้ prompt กล่าวถึง contract ของ namespace ไม่ใช่การตั้งค่า auth, ประวัติ
การ implement หรือพฤติกรรม Plugin อื่นที่ไม่เกี่ยวข้อง

### การล้างข้อมูล

Namespaces เป็นการลงทะเบียนเฉพาะในกระบวนการ ลบออกเมื่อ Plugin ที่เป็นเจ้าของ
ถูกปิดใช้งาน ถอนการติดตั้ง หรือย้อนกลับ:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

การล้างโหมดโค้ดเป็นความรับผิดชอบของ Plugin; ล้างการลงทะเบียน namespace
ของ Plugin เมื่อวงจรชีวิตของมันสิ้นสุดลง แทนที่จะเก็บ handle teardown
แยกตาม namespace การทดสอบสามารถเรียก `clearCodeModeNamespacesForTest()`
เพื่อหลีกเลี่ยงการรั่วไหลของการลงทะเบียนข้ามกรณีทดสอบ

### รายการตรวจสอบการทดสอบ

การเปลี่ยนแปลง namespace ควรครอบคลุมขอบเขตความปลอดภัยและพฤติกรรมของ guest:

- ข้อความ prompt ของ namespace ปรากฏเฉพาะเมื่อเครื่องมือเบื้องหลังมองเห็นได้
- เครื่องมือชื่อเดียวกันจาก `sourceName` อื่นไม่เปิดเผย namespace
- ฟังก์ชัน scope ดิบถูกปฏิเสธ
- id ของ namespace ที่ปลอมแปลงและ path ที่ปลอมแปลงถูกปฏิเสธ
- path ที่เรียกได้ไม่สามารถชี้ไปยังเครื่องมือที่ไม่ได้ประกาศ
- object ที่ซ้อนกันและ reference ที่ใช้ร่วมกัน serialize ได้ถูกต้อง
- การเรียก namespace ทำงานผ่านเครื่องมือ catalog และส่งคืนรายละเอียดที่ปลอดภัยกับ JSON
- failure สามารถถูกจับได้โดยโค้ด guest
- การเรียก namespace ที่ถูกพักไว้ resume ผ่าน `wait`
- การ rollback Plugin ล้างการลงทะเบียน namespace ที่เป็นเจ้าของ

Namespaces เสริม catalog ทั่วไป `tools.search` / `tools.call` ใช้
catalog สำหรับเครื่องมือ OpenClaw, Plugin และ client ใด ๆ ที่เปิดใช้งาน; ใช้ `MCP` สำหรับ
เครื่องมือ MCP; ใช้ namespace อื่นสำหรับ API ด้านโดเมนที่เป็นของ Plugin และมีเอกสารกำกับ
ซึ่งโค้ดที่กระชับเชื่อถือได้มากกว่าการค้นหา schema ซ้ำ ๆ

## Output API

`text(value)` ผนวก output ที่มนุษย์อ่านได้ลงใน array `output`

`json(value)` ผนวกรายการ output แบบมีโครงสร้างหลังจาก serialization
ที่เข้ากันได้กับ JSON

ค่าที่ส่งคืนสุดท้ายของโค้ด guest จะกลายเป็น `value` ในผลลัพธ์ `completed`

รายการ output:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

กฎของ output:

- ลำดับ output ตรงกับการเรียกของ guest
- output ถูกจำกัดด้วย `maxOutputBytes`
- ค่าที่ serialize ไม่ได้จะถูกแปลงเป็น string ธรรมดาหรือ error
- ไม่รองรับค่า binary ใน v1
- image และ file ส่งผ่านเครื่องมือ OpenClaw ปกติ ไม่ผ่าน
  bridge ของโหมดโค้ด

## Catalog ของเครื่องมือ

catalog ที่ซ่อนอยู่มีเครื่องมือหลังจากการกรอง policy ที่มีผล:

1. เครื่องมือ core ของ OpenClaw
2. เครื่องมือ Plugin ที่ bundled มา
3. เครื่องมือ Plugin ภายนอก
4. เครื่องมือ MCP
5. เครื่องมือที่ client จัดหาให้สำหรับ run ปัจจุบัน

id ของ catalog มีความคงที่ภายใน run หนึ่ง และเป็น deterministic ข้ามชุดเครื่องมือ
ที่เทียบเท่ากันเมื่อเป็นไปได้

รูปแบบ id ที่แนะนำ:

```text
<source>:<owner>:<tool-name>
```

ตัวอย่าง:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

catalog ไม่รวมเครื่องมือควบคุมโหมดโค้ด:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

สิ่งนี้ป้องกัน recursion และทำให้ contract ที่แสดงต่อโมเดลแคบลง

รายการ MCP อยู่ใน catalog ที่ scoped ตาม run เพื่อให้ policy, approval, hook,
telemetry, transcript projection และ id เครื่องมือที่แน่นอนยังคงใช้ร่วมกับ
การทำงานของเครื่องมือปกติ มุมมองสำหรับ guest อย่าง `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` และ `tools.call(...)` จะไม่รวมรายการ MCP namespace
`MCP.<server>.<tool>({ ...input })` ที่สร้างขึ้นจะ resolve กลับไปยัง
id catalog ที่แน่นอน แล้ว dispatch ผ่าน path executor เดียวกัน

## การโต้ตอบกับการค้นหาเครื่องมือ

โหมดโค้ดแทนที่ surface ของโมเดล OpenClaw Tool Search สำหรับ run ที่เปิดใช้งาน

เมื่อ `tools.codeMode.enabled` เป็น true และโหมดโค้ด activate:

- OpenClaw ไม่เปิดเผย `tool_search_code`, `tool_search`, `tool_describe`,
  หรือ `tool_call` เป็นเครื่องมือที่โมเดลมองเห็นได้
- แนวคิด cataloging เดียวกันย้ายเข้าไปอยู่ใน runtime ของ guest
- runtime ของ guest ได้รับ metadata `ALL_TOOLS` แบบกะทัดรัด และ helper สำหรับ search, describe
  และ call สำหรับเครื่องมือที่ไม่ใช่ MCP
- การเรียก MCP ใช้ namespace `MCP` ที่สร้างขึ้นและ header `$api()` ของมันแทน
  `tools.call(...)`
- การเรียกที่ซ้อนกัน dispatch ผ่าน path executor ของ OpenClaw เดียวกับที่ Tool Search
  ใช้

หน้า [การค้นหาเครื่องมือ](/th/tools/tool-search) ที่มีอยู่ อธิบาย bridge catalog แบบกะทัดรัด
ของ OpenClaw โหมดโค้ดคือทางเลือกทั่วไปของ OpenClaw สำหรับ run ที่สามารถ
ใช้ `exec` และ `wait`

## ชื่อเครื่องมือและการชนกัน

เครื่องมือ `exec` ที่โมเดลมองเห็นได้คือเครื่องมือโหมดโค้ด หากเครื่องมือ shell `exec`
ปกติของ OpenClaw ถูกเปิดใช้งาน เครื่องมือนั้นจะถูกซ่อนจากโมเดลและถูก catalog
เหมือนเครื่องมืออื่น ๆ

ภายใน runtime ของ guest:

- `tools.call("openclaw:core:exec", input)` สามารถเรียกเครื่องมือ shell exec ได้หาก
  policy อนุญาต
- `tools.exec(...)` ถูกติดตั้งเฉพาะเมื่อรายการ catalog ของ shell exec มี
  ชื่อที่ปลอดภัยและไม่กำกวม
- เครื่องมือ `exec` ของโหมดโค้ดไม่สามารถใช้งานแบบ recursive ผ่าน `tools` ได้เลย

หากเครื่องมือสองรายการ normalize เป็นชื่อ convenience ที่ปลอดภัยเดียวกัน OpenClaw จะละเว้น
ฟังก์ชัน convenience และกำหนดให้ใช้ `tools.call(id, input)`

## การทำงานของเครื่องมือที่ซ้อนกัน

การเรียกเครื่องมือที่ซ้อนกันทุกครั้งข้าม bridge ของ host และ re-enter OpenClaw

การทำงานแบบซ้อนรักษา:

- id ของ agent ที่ active
- id ของ session และ session key
- context ของ sender และ channel
- policy ของ sandbox
- policy ของ approval
- hook `before_tool_call` ของ Plugin
- abort signal
- streaming update เมื่อมี
- trajectory และ audit event

การเรียกที่ซ้อนกัน project เข้า transcript เป็นการเรียกเครื่องมือจริง เพื่อให้ support bundle
แสดงสิ่งที่เกิดขึ้นได้ projection จะระบุการเรียกเครื่องมือโหมดโค้ด parent
และ id เครื่องมือที่ซ้อนกัน

อนุญาตให้เรียกแบบซ้อนใน parallel ได้สูงสุด `maxPendingToolCalls`

## สถานะ runtime

run โหมดโค้ดแต่ละรายการมี state machine:

- `running`: VM กำลัง execute หรือมีการเรียกแบบซ้อนที่ยังดำเนินอยู่
- `waiting`: มี snapshot ของ VM และสามารถ resume ด้วย `wait`
- `completed`: ส่งคืนค่าสุดท้ายแล้ว; snapshot ถูกลบ
- `failed`: ส่งคืน error แล้ว; snapshot ถูกลบ
- `expired`: snapshot หรือ pending state เกิน retention; resume ไม่ได้
- `aborted`: parent run/session ถูก cancel; snapshot ถูกลบ

สถานะถูก scoped ด้วย agent run, session และ id การเรียกเครื่องมือ การเรียก `wait` จาก
run หรือ session อื่นจะ fail

การเก็บ snapshot มีขอบเขตจำกัด:

- จำนวน byte สูงสุดของ snapshot ต่อ run
- จำนวน snapshot ที่ live สูงสุดต่อกระบวนการ
- TTL ของ snapshot
- การล้างเมื่อ run สิ้นสุด
- การล้างเมื่อ Gateway shutdown ในที่ที่ไม่รองรับ persistence

## Runtime QuickJS-WASI

OpenClaw โหลด `quickjs-wasi` เป็น dependency โดยตรงใน package ที่เป็นเจ้าของ
runtime ไม่พึ่งพา copy แบบ transitive ที่ติดตั้งไว้สำหรับ proxy, PAC หรือ dependency
อื่นที่ไม่เกี่ยวข้อง

ความรับผิดชอบของ runtime:

- compile หรือโหลดโมดูล WebAssembly ของ QuickJS-WASI
- สร้าง VM ที่ isolated หนึ่งตัวต่อ run หรือ resume ของโหมดโค้ด
- ลงทะเบียน callback ของ host ด้วยชื่อที่ stable
- ตั้งค่าขีดจำกัด memory และ interrupt
- evaluate JavaScript
- drain job ที่ pending
- snapshot สถานะ VM ที่ถูกพักไว้
- restore snapshot สำหรับ `wait`
- dispose handle ของ VM และ snapshot หลัง terminal state

runtime ทำงานนอก main event loop ของ OpenClaw ใน worker infinite loop ของ guest
ต้องไม่ block กระบวนการ Gateway อย่างไม่มีกำหนด

## TypeScript

การรองรับ TypeScript เป็นเพียง source transform เท่านั้น:

- input ที่รับ: string โค้ด TypeScript หนึ่งรายการ
- output: string JavaScript ที่ evaluate โดย QuickJS-WASI
- ไม่มี typechecking
- ไม่มี module resolution
- ไม่มี `import` หรือ `require` ใน v1
- diagnostic ถูกส่งคืนเป็นผลลัพธ์ `failed`

compiler ของ TypeScript ถูกโหลดแบบ lazy เฉพาะสำหรับ cell TypeScript cell
JavaScript ธรรมดาและโหมดโค้ดที่ปิดใช้งานจะไม่โหลด compiler

transform ควรรักษาเลขบรรทัดที่มีประโยชน์ไว้เมื่อทำได้

## ขอบเขตความปลอดภัย

โค้ดของโมเดลถือว่าเป็น hostile runtime ใช้ defense in depth:

- run QuickJS-WASI นอก main event loop
- โหลด `quickjs-wasi` เป็น dependency โดยตรง ไม่ผ่าน Codex หรือ package
  แบบ transitive
- ไม่มี filesystem, network, subprocess, module import, environment variable หรือ
  host global object ใน guest
- ใช้ขีดจำกัด memory และ interrupt ของ QuickJS
- บังคับใช้ timeout แบบ wall-clock ของ parent process
- บังคับใช้ cap สำหรับ output, snapshot, log และ pending-call
- serialize ค่า bridge ของ host ผ่าน adapter JSON ที่แคบ
- แปลง error ของ host เป็น error ของ guest ธรรมดา ไม่ใช้ object จาก realm ของ host
- ทิ้ง snapshot เมื่อ timeout, abort, session end หรือ expiry
- ปฏิเสธการเข้าถึงแบบ recursive ไปยัง `exec`, `wait` และเครื่องมือควบคุม Tool Search
- ป้องกันการชนกันของ convenience-name ไม่ให้ shadow helper ของ catalog

sandbox เป็น security layer หนึ่ง ผู้ปฏิบัติการอาจยังต้องใช้การ hardening ระดับ OS
สำหรับ deployment ที่มีความเสี่ยงสูง

## รหัสข้อผิดพลาด

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

error ที่ส่งคืนให้ guest เป็นข้อมูลธรรมดา instance `Error` ของ host, stack
object, prototype และฟังก์ชันของ host ไม่ข้ามเข้า QuickJS

## Telemetry

โหมดโค้ดรายงาน:

- ชื่อเครื่องมือที่มองเห็นได้ซึ่งส่งให้โมเดล
- ขนาด catalog ที่ซ่อนอยู่และการแจกแจงตาม source
- จำนวน `exec` และ `wait`
- จำนวน search, describe และ call ที่ซ้อนกัน
- id ของเครื่องมือที่ซ้อนกันซึ่งถูกเรียก
- failure จาก cap ของ timeout, memory, snapshot และ output
- event วงจรชีวิตของ snapshot

Telemetry ต้องไม่มี secret, ค่า environment ดิบ หรือ input เครื่องมือที่ไม่ redact
นอกเหนือจาก policy trajectory ที่มีอยู่ของ OpenClaw

## การดีบัก

ใช้การ logging ของ model transport แบบเจาะจงเมื่อโหมดโค้ดมีพฤติกรรมต่างจาก
run เครื่องมือปกติ:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

สำหรับการดีบัก payload-shape ให้ใช้ `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`
สิ่งนี้ log snapshot JSON ของคำขอโมเดลที่ถูกจำกัดขนาดและ redact แล้ว; ควรใช้เฉพาะ
ระหว่างดีบัก เพราะ prompt และข้อความ message ยังอาจปรากฏได้

สำหรับการดีบัก stream ให้ใช้ `OPENCLAW_DEBUG_SSE=peek` เพื่อ log event SSE
ที่ redact แล้วห้ารายการแรก โหมดโค้ดยัง fail closed หาก payload สุดท้ายของ provider
ไม่มี `exec` และ `wait` อย่างครบถ้วนหลังจาก surface ของโหมดโค้ด
activate แล้ว

## Layout การติดตั้งใช้งาน

หน่วยการติดตั้งใช้งาน:

- contract ของ config: `tools.codeMode`
- catalog builder: เครื่องมือที่มีผลไปเป็น entry แบบกะทัดรัดและ map ของ id
- adapter ของ model-surface: แทนที่เครื่องมือที่มองเห็นด้วย `exec` และ `wait`
- adapter runtime QuickJS-WASI: load, eval, snapshot, restore, dispose
- worker supervisor: timeout, abort, crash isolation
- bridge adapter: callback ของ host ที่ปลอดภัยกับ JSON และการส่งมอบผลลัพธ์
- adapter transform TypeScript
- store ของ snapshot: TTL, cap ขนาด, scoping ตาม run/session
- trajectory projection สำหรับการเรียกเครื่องมือที่ซ้อนกัน
- counter telemetry และ diagnostic

การติดตั้งใช้งาน reuse แนวคิด catalog และ executor จาก Tool Search แต่
ไม่ใช้ child `node:vm` เป็น sandbox

## รายการตรวจสอบการตรวจสอบความถูกต้อง

coverage ของโหมดโค้ดควรพิสูจน์:

- การกำหนดค่าที่ปิดใช้งานจะปล่อยให้การเปิดเผยเครื่องมือที่มีอยู่ไม่เปลี่ยนแปลง
- การกำหนดค่าแบบออบเจ็กต์ที่ไม่มี `enabled: true` จะปล่อยให้โหมดโค้ดถูกปิดใช้งาน
- การกำหนดค่าที่เปิดใช้งานจะเปิดเผยเฉพาะ `exec` และ `wait` ให้โมเดลเมื่อเครื่องมือ
  เปิดใช้งานอยู่สำหรับการรัน
- การรันแบบดิบที่ไม่มีเครื่องมือ, `disableTools`, และรายการอนุญาตที่ว่างเปล่าจะไม่ทริกเกอร์
  การบังคับใช้เพย์โหลดของโหมดโค้ด
- เครื่องมือที่มีผลทั้งหมดซึ่งไม่ใช่ MCP จะปรากฏใน `ALL_TOOLS`
- เครื่องมือที่ถูกปฏิเสธจะไม่ปรากฏใน `ALL_TOOLS`
- `tools.search`, `tools.describe`, และ `tools.call` ใช้งานได้กับเครื่องมือของ OpenClaw
- `API.list("mcp")` และ `API.read("mcp/<server>.d.ts")` เปิดเผยประกาศ MCP
  สไตล์ TypeScript โดยไม่ต้องมีการเรียก bridge/เครื่องมือ
- เนมสเปซ MCP `$api()` ยังคงพร้อมใช้งานเป็นทางเลือกสำรองแบบอินไลน์สำหรับสคีมา
- การเรียกเนมสเปซ MCP ใช้งานได้กับเครื่องมือ MCP ที่มองเห็นได้ซึ่งมีอินพุตแบบออบเจ็กต์หนึ่งรายการ ขณะที่
  รายการแค็ตตาล็อก MCP โดยตรงไม่มีอยู่ใน `tools.*`
- เครื่องมือควบคุมการค้นหาเครื่องมือถูกซ่อนจากทั้งพื้นผิวของโมเดลและแค็ตตาล็อกที่ซ่อนอยู่
- การเรียกแบบซ้อนจะรักษาพฤติกรรมการอนุมัติและ hook ไว้
- shell `exec` ถูกซ่อนจากโมเดล แต่เรียกได้ด้วย id ของแค็ตตาล็อกเมื่อได้รับอนุญาต
- `exec` และ `wait` ของโหมดโค้ดแบบเรียกซ้ำไม่สามารถเรียกจากโค้ด guest ได้
- อินพุต TypeScript ถูกแปลงและประเมินผลโดยไม่โหลด TypeScript บนเส้นทางที่ปิดใช้งานหรือ JavaScript เท่านั้น
- `import`, `require`, ระบบไฟล์, เครือข่าย, และการเข้าถึงสภาพแวดล้อมล้มเหลว
- ลูปไม่สิ้นสุดจะหมดเวลาและไม่สามารถบล็อก Gateway ได้
- ความล้มเหลวของขีดจำกัดหน่วยความจำจะยุติ VM ของ guest
- ขีดจำกัดเอาต์พุตและสแนปช็อตถูกบังคับใช้สำหรับการเรียกที่เสร็จสมบูรณ์และถูกระงับ
- `wait` ดำเนินสแนปช็อตที่ถูกระงับต่อและส่งคืนค่าสุดท้าย
- ค่า `runId` ที่หมดอายุ, ถูกยกเลิก, ผิดเซสชัน, และไม่รู้จักจะล้มเหลว
- การเล่นซ้ำ transcript และการคงอยู่จะรักษาการเรียกควบคุมโหมดโค้ดไว้
- transcript และ telemetry แสดงการเรียกเครื่องมือแบบซ้อนอย่างชัดเจน

## แผนการทดสอบ E2E

เรียกใช้สิ่งเหล่านี้เป็นการทดสอบแบบผสานรวมหรือ end-to-end เมื่อเปลี่ยนรันไทม์:

1. เริ่ม Gateway ด้วย `tools.codeMode.enabled: false`
2. ส่งเทิร์นของ agent พร้อมชุดเครื่องมือโดยตรงขนาดเล็ก
3. ยืนยันว่าเครื่องมือที่โมเดลมองเห็นไม่เปลี่ยนแปลง
4. รีสตาร์ตด้วย `tools.codeMode.enabled: true`
5. ส่งเทิร์นของ agent พร้อมเครื่องมือทดสอบ OpenClaw, Plugin, MCP, และ client
6. ยืนยันว่ารายการเครื่องมือที่โมเดลมองเห็นคือ `exec`, `wait` เท่านั้น
7. ใน `exec` อ่าน `ALL_TOOLS` และยืนยันว่ามีเครื่องมือทดสอบที่มีผลอยู่
8. ใน `exec` เรียกเครื่องมือ OpenClaw/Plugin/client ผ่าน `tools.search`,
   `tools.describe`, และ `tools.call`
9. ใน `exec` เรียก `API.list("mcp")` และ `API.read("mcp/<server>.d.ts")` และ
   ยืนยันว่าไฟล์ประกาศอธิบายเครื่องมือ MCP ที่มองเห็นได้
10. ใน `exec` เรียกเครื่องมือ MCP ผ่าน `MCP.<server>.<tool>({ ...input })` และ
    ยืนยันว่ารายการแค็ตตาล็อก MCP โดยตรงไม่มีอยู่ใน `ALL_TOOLS` และ `tools.*`
11. ยืนยันว่าเครื่องมือที่ถูกปฏิเสธไม่มีอยู่และไม่สามารถเรียกด้วย id ที่คาดเดาได้
12. เริ่มการเรียกเครื่องมือแบบซ้อนที่จะ resolve หลังจาก `exec` ส่งคืน `waiting`
13. เรียก `wait` และยืนยันว่า VM ที่กู้คืนได้รับผลลัพธ์ของเครื่องมือ
14. ยืนยันว่าคำตอบสุดท้ายมีเอาต์พุตที่สร้างขึ้นหลังจากการกู้คืน
15. ยืนยันว่าการหมดเวลา, การยกเลิก, และการหมดอายุของสแนปช็อตล้างสถานะรันไทม์
16. ส่งออก trajectory และยืนยันว่าการเรียกแบบซ้อนมองเห็นได้ภายใต้การเรียก
    โหมดโค้ดหลัก

การเปลี่ยนแปลงเฉพาะเอกสารในหน้านี้ยังควรเรียกใช้ `pnpm check:docs`

## ที่เกี่ยวข้อง

- [การค้นหาเครื่องมือ](/th/tools/tool-search)
- [รันไทม์ของ agent](/th/concepts/agent-runtimes)
- [เครื่องมือ Exec](/th/tools/exec)
- [การดำเนินการโค้ด](/th/tools/code-execution)
