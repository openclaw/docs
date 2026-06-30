---
read_when:
    - คุณต้องการให้เอเจนต์ OpenClaw ใช้แค็ตตาล็อกเครื่องมือขนาดใหญ่โดยไม่ต้องเพิ่มสคีมาของเครื่องมือทุกตัวลงในพรอมป์
    - คุณต้องการให้เครื่องมือของ OpenClaw, เครื่องมือ MCP และเครื่องมือไคลเอนต์ถูกเปิดเผยผ่านพื้นผิวรันไทม์ที่กระชับเพียงหนึ่งเดียว
    - คุณกำลังใช้งานหรือดีบักการค้นหาเครื่องมือสำหรับการรัน OpenClaw
summary: 'ค้นหาเครื่องมือ: ย่อแค็ตตาล็อกเครื่องมือขนาดใหญ่ของ OpenClaw ไว้เบื้องหลังการค้นหา การอธิบาย และการเรียกใช้'
title: ค้นหาเครื่องมือ
x-i18n:
    generated_at: "2026-06-30T14:34:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search เป็นฟีเจอร์เชิงทดลองของ runtime เอเจนต์ OpenClaw ฟีเจอร์นี้ให้เอเจนต์มีวิธีที่กะทัดรัดเพียงวิธีเดียวในการค้นหาและเรียกใช้แคตตาล็อกเครื่องมือขนาดใหญ่ เหมาะเมื่อรันมีเครื่องมือจำนวนมากให้ใช้ แต่โมเดลน่าจะต้องใช้เพียงไม่กี่รายการเท่านั้น

หน้านี้จัดทำเอกสาร OpenClaw Tool Search ไม่ใช่พื้นผิวการค้นหาเครื่องมือหรือ dynamic-tools แบบเนทีฟของ Codex โหมด code แบบเนทีฟของ Codex, การค้นหาเครื่องมือ, dynamic tools แบบเลื่อนการกำหนด และการเรียกเครื่องมือซ้อนกัน เป็นพื้นผิว Codex harness ที่เสถียร และไม่ขึ้นกับ `tools.toolSearch`

เมื่อเปิดใช้สำหรับรันของ OpenClaw โมเดลจะได้รับเครื่องมือ `tool_search_code` หนึ่งรายการตามค่าเริ่มต้น เครื่องมือนั้นจะรัน body JavaScript สั้น ๆ ใน subprocess Node ที่แยกออกมา พร้อมบริดจ์ `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

แคตตาล็อกสามารถรวมเครื่องมือ OpenClaw, เครื่องมือ Plugin, เครื่องมือ MCP และเครื่องมือที่ไคลเอนต์จัดเตรียมให้ โมเดลจะไม่เห็นสคีมาแบบเต็มทั้งหมดตั้งแต่ต้น แต่จะค้นหาตัวบรรยายแบบกะทัดรัด อธิบายเครื่องมือที่เลือกหนึ่งรายการเมื่อจำเป็นต้องใช้สคีมาที่แน่นอน และเรียกเครื่องมือนั้นผ่าน OpenClaw

รันของ Codex harness จะไม่ได้รับตัวควบคุม OpenClaw Tool Search เชิงทดลองเหล่านี้ OpenClaw ส่งความสามารถของผลิตภัณฑ์ให้ Codex เป็น dynamic tools และ Codex เป็นเจ้าของโหมด code แบบเนทีฟที่เสถียร, การค้นหาเครื่องมือแบบเนทีฟ, dynamic tools แบบเลื่อนการกำหนด และการเรียกเครื่องมือซ้อนกัน

## วิธีที่หนึ่ง turn รัน

ในช่วงวางแผน runner แบบฝังของ OpenClaw จะสร้างแคตตาล็อกที่มีผลสำหรับรัน:

1. แก้ไข policy เครื่องมือที่ใช้งานอยู่สำหรับเอเจนต์, profile, sandbox และ session
2. แสดงรายการเครื่องมือ OpenClaw และ Plugin ที่มีสิทธิ์
3. แสดงรายการเครื่องมือ MCP ที่มีสิทธิ์ผ่าน runtime MCP ของ session
4. เพิ่มเครื่องมือไคลเอนต์ที่มีสิทธิ์ซึ่งจัดเตรียมไว้สำหรับรันปัจจุบัน
5. จัดทำดัชนีตัวบรรยายแบบกะทัดรัดสำหรับการค้นหา
6. เปิดเผยบริดจ์ code ของ OpenClaw, เครื่องมือ fallback แบบมีโครงสร้าง หรือพื้นผิวไดเรกทอรีแบบกะทัดรัดให้โมเดล

ในช่วงดำเนินการ การเรียกเครื่องมือจริงทุกครั้งจะกลับมายัง OpenClaw runtime Node ที่แยกออกมาไม่ได้เก็บ implementation ของ Plugin, object ไคลเอนต์ MCP หรือความลับไว้ `openclaw.tools.call(...)` จะข้ามบริดจ์กลับเข้า Gateway ซึ่งยังคงใช้ policy, approval, hook, logging และการจัดการผลลัพธ์ตามปกติ

## โหมด

`tools.toolSearch` มีโหมดที่แสดงต่อโมเดลสามโหมด:

- `code`: เปิดเผย `tool_search_code` ซึ่งเป็นบริดจ์ JavaScript แบบกะทัดรัดตามค่าเริ่มต้น
- `tools`: เปิดเผย `tool_search`, `tool_describe` และ `tool_call` เป็นเครื่องมือแบบมีโครงสร้างธรรมดาสำหรับ provider ที่ไม่ควรได้รับ code
- `directory`: เปิดเผย `tool_search`, `tool_describe` และ `tool_call` รวมถึงไดเรกทอรี prompt แบบมีขอบเขตของชื่อและคำอธิบายเครื่องมือที่ใช้ได้ สำหรับ provider ที่ควรเห็นชื่อเครื่องมือโดยไม่เห็นสคีมาแบบเต็มทั้งหมด OpenClaw ยังสามารถเปิดเผยชุดสคีมาเครื่องมือขนาดเล็กแบบมีขอบเขตที่น่าจะต้องใช้หรือจำเป็นโดยตรงสำหรับ turn ปัจจุบันได้ด้วย

ทุกโหมดใช้แคตตาล็อกเดียวกันที่ผ่านการกรองด้วย policy และเส้นทางการดำเนินการปกติของ OpenClaw หาก runtime ปัจจุบันไม่สามารถเปิด subprocess ลูกของโหมด code แบบ Node ที่แยกออกมาได้ โหมด `code` ตามค่าเริ่มต้นจะ fallback เป็น `tools` ก่อนทำ compaction แคตตาล็อก ในโหมด `directory` เครื่องมือที่ไคลเอนต์จัดเตรียมให้ยังคงมองเห็นได้โดยตรงสำหรับรันปัจจุบัน ขณะที่เครื่องมือ OpenClaw, เครื่องมือ Plugin และเครื่องมือ MCP สามารถถูก compact ไว้หลังแคตตาล็อกไดเรกทอรีได้ การเรียกโดยตรงไปยังชื่อไดเรกทอรีที่ซ่อนอยู่แบบตรงกันทุกตัวอักษรจะถูก hydrate จากแคตตาล็อกที่ได้รับอนุญาตเดียวกันนั้นก่อนดำเนินการ

ทุกโหมดเป็นเชิงทดลอง ควรเลือกการเปิดเผยเครื่องมือโดยตรงสำหรับแคตตาล็อกเครื่องมือ OpenClaw ขนาดเล็ก และเลือกพื้นผิวที่เสถียรแบบเนทีฟของ Codex สำหรับรันของ Codex harness

ไม่มี config สำหรับเลือกแหล่งที่มาแยกต่างหาก เมื่อเปิดใช้ Tool Search แคตตาล็อกจะรวมเครื่องมือ OpenClaw, MCP และไคลเอนต์ที่มีสิทธิ์หลังจากการกรองด้วย policy ตามปกติ

## เหตุผลที่มีฟีเจอร์นี้

แคตตาล็อกขนาดใหญ่มีประโยชน์แต่มีต้นทุนสูง การส่งสคีมาเครื่องมือทุกตัวให้โมเดลทำให้ request ใหญ่ขึ้น ทำให้การวางแผนช้าลง และเพิ่มโอกาสเลือกเครื่องมือผิดโดยไม่ตั้งใจ

Tool Search เปลี่ยนรูปแบบดังนี้:

- เครื่องมือโดยตรง: โมเดลเห็นสคีมาที่เลือกทั้งหมดก่อน token แรก
- โหมด code ของ Tool Search: โมเดลเห็นเครื่องมือ code แบบกะทัดรัดหนึ่งรายการและสัญญา API สั้น ๆ
- โหมด tools ของ Tool Search: โมเดลเห็นเครื่องมือ fallback แบบมีโครงสร้างกะทัดรัดสามรายการ
- โหมด directory ของ Tool Search: โมเดลเห็นไดเรกทอรีแบบมีขอบเขต พร้อมตัวควบคุม search/describe/call และชุดสคีมาที่น่าจะต้องใช้หรือจำเป็นขนาดเล็กแบบมีขอบเขต
- ระหว่าง turn: โมเดลสามารถโหลดสคีมาที่เหลือตามต้องการ

การเปิดเผยเครื่องมือโดยตรงยังคงเป็นค่าเริ่มต้นที่เหมาะสมสำหรับแคตตาล็อกขนาดเล็ก Tool Search เหมาะที่สุดเมื่อรันหนึ่งสามารถเห็นเครื่องมือจำนวนมาก โดยเฉพาะจากเซิร์ฟเวอร์ MCP หรือเครื่องมือแอปที่ไคลเอนต์จัดเตรียมให้

## API

`openclaw.tools.search(query, options?)`

ค้นหาแคตตาล็อกที่มีผลสำหรับรันปัจจุบัน ผลลัพธ์จะกะทัดรัดและปลอดภัยพอที่จะใส่กลับเข้าไปในบริบท prompt

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

โหลด metadata แบบเต็มสำหรับผลการค้นหาหนึ่งรายการ รวมถึงสคีมา input ที่แน่นอน

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

เรียกเครื่องมือที่เลือกผ่าน OpenClaw

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

โหมด fallback แบบมีโครงสร้างเปิดเผย operation เดียวกันในฐานะเครื่องมือ:

- `tool_search`
- `tool_describe`
- `tool_call`

โหมด Directory เปิดเผย:

- `tool_search`
- `tool_describe`
- `tool_call`

โหมดนี้ยังคงทำให้เครื่องมือที่ไคลเอนต์จัดเตรียมให้มองเห็นได้โดยตรง และอาจเปิดเผยชุดสคีมาเครื่องมือแคตตาล็อกขนาดเล็กแบบมีขอบเขตที่น่าจะต้องใช้หรือจำเป็นโดยตรงสำหรับ turn ปัจจุบัน หากไดเรกทอรีแบบมีขอบเขตละเว้นรายการไว้ ให้ใช้ `tool_search` เพื่อค้นหา หากโมเดลร้องขอชื่อเครื่องมือไดเรกทอรีที่ซ่อนอยู่แบบตรงกันทุกตัวอักษรโดยตรง OpenClaw จะ hydrate จากแคตตาล็อกที่ได้รับอนุญาตก่อนการดำเนินการตามปกติ
ชื่อเครื่องมือไคลเอนต์ในโหมด Directory ต้องไม่ชนกับชื่อเครื่องมือ OpenClaw, Plugin หรือ MCP เพราะการ dispatch แบบเลื่อนการกำหนดที่ตรงกันทุกตัวอักษรใช้ชื่อเหล่านั้น

## ขอบเขต Runtime

บริดจ์ code รันใน subprocess Node อายุสั้น subprocess เริ่มต้นโดยเปิดใช้โหมด permission ของ Node มี environment ว่าง ไม่มีสิทธิ์ filesystem หรือ network และไม่มีสิทธิ์ child-process หรือ worker OpenClaw บังคับใช้ timeout แบบ wall-clock ของ parent-process และ kill subprocess เมื่อ timeout รวมถึงหลัง async continuations

runtime เปิดเผยเฉพาะ:

- `console.log`, `console.warn` และ `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

พฤติกรรมปกติของ OpenClaw ยังคงมีผลกับการเรียกสุดท้าย:

- policy อนุญาตและปฏิเสธเครื่องมือ
- ข้อจำกัดเครื่องมือต่อเอเจนต์และต่อ sandbox
- policy เครื่องมือของ channel/runtime
- approval hooks
- hooks `before_tool_call` ของ Plugin
- identity, logs และ telemetry ของ session

## Config

เปิดใช้ Tool Search สำหรับรันของ OpenClaw ด้วยบริดจ์ code ตามค่าเริ่มต้น:

```bash
openclaw config set tools.toolSearch true
```

JSON ที่เทียบเท่า:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

ใช้เครื่องมือ fallback แบบมีโครงสร้างแทนสำหรับรันของ OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

ใช้พื้นผิวไดเรกทอรีแบบกะทัดรัดแทนสำหรับรันของ OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

ปรับ timeout ของโหมด code และขีดจำกัดผลการค้นหา:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

ปิดใช้:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt และ telemetry

Tool Search บันทึก telemetry เพียงพอสำหรับเปรียบเทียบกับการเปิดเผยเครื่องมือโดยตรง:

- จำนวน byte ของเครื่องมือและ prompt ที่ serialize แล้วทั้งหมดซึ่งส่งไปยัง harness
- ขนาดแคตตาล็อกและการแจกแจงตามแหล่งที่มา
- จำนวน search, describe และ call
- การเรียกเครื่องมือสุดท้ายที่ดำเนินการผ่าน OpenClaw
- id และแหล่งที่มาของเครื่องมือที่เลือก

บันทึก session ควรทำให้ตอบคำถามเหล่านี้ได้:

- โมเดลเห็นสคีมาเครื่องมือกี่รายการตั้งแต่ต้น
- โมเดลดำเนินการ search และ describe กี่ครั้ง
- เครื่องมือสุดท้ายใดถูกเรียก
- ผลลัพธ์มาจาก OpenClaw, MCP หรือเครื่องมือไคลเอนต์

## การตรวจสอบ E2E

สถานการณ์ Gateway ของ QA Lab พิสูจน์ทั้งสองเส้นทางด้วย runtime ของ OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

สถานการณ์นี้สร้าง Plugin ปลอมชั่วคราวพร้อมแคตตาล็อกเครื่องมือขนาดใหญ่ เริ่ม provider OpenAI จำลอง เริ่ม Gateway หนึ่งครั้งในโหมดโดยตรงและอีกครั้งเมื่อเปิดใช้ Tool Search จากนั้นเปรียบเทียบ payload request ของ provider และบันทึก session

regression พิสูจน์ว่า:

1. โหมดโดยตรงสามารถเรียกเครื่องมือ Plugin ปลอมได้
2. Tool Search สามารถเรียกเครื่องมือ Plugin ปลอมเดียวกันได้
3. โหมดโดยตรงเปิดเผยสคีมาเครื่องมือ Plugin ปลอมโดยตรงให้ provider
4. Tool Search เปิดเผยเฉพาะบริดจ์แบบกะทัดรัด
5. payload request ของ Tool Search มีขนาดเล็กกว่าสำหรับแคตตาล็อกปลอมขนาดใหญ่
6. บันทึก session แสดงจำนวนการเรียกเครื่องมือที่คาดไว้และ telemetry ของการเรียกผ่านบริดจ์

## พฤติกรรมเมื่อเกิดความล้มเหลว

Tool Search ควร fail closed:

- หากเครื่องมือไม่ได้อยู่ใน policy ที่มีผล search ไม่ควรส่งคืนเครื่องมือนั้น
- หากเครื่องมือที่เลือกไม่พร้อมใช้งาน `tool_call` ควรล้มเหลว
- หาก policy หรือ approval บล็อกการดำเนินการ ผลลัพธ์การเรียกควรรายงานการบล็อกนั้นแทนที่จะเลี่ยงผ่าน
- หากบริดจ์ code ไม่สามารถสร้าง runtime ที่แยกออกมาได้ ให้ใช้ `mode: "tools"` หรือปิดใช้ Tool Search สำหรับ deployment นั้น

## ที่เกี่ยวข้อง

- [เครื่องมือและ Plugin](/th/tools)
- [Sandbox และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [เครื่องมือ Exec](/th/tools/exec)
- [การตั้งค่าเอเจนต์ ACP](/th/tools/acp-agents-setup)
- [การสร้าง Plugin](/th/plugins/building-plugins)
