---
read_when:
    - คุณต้องการติดตั้งบันเดิลที่เข้ากันได้กับ Codex, Claude หรือ Cursor
    - คุณต้องเข้าใจว่า OpenClaw แมปเนื้อหาของบันเดิลเข้ากับฟีเจอร์เนทีฟอย่างไร
    - คุณกำลังดีบักการตรวจจับบันเดิลหรือความสามารถที่ขาดหายไป
summary: ติดตั้งและใช้บันเดิล Codex, Claude และ Cursor เป็น Plugin ของ OpenClaw
title: บันเดิล Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw สามารถติดตั้ง Plugin จากระบบนิเวศภายนอกได้สามแหล่ง: **Codex**, **Claude**,
และ **Cursor** สิ่งเหล่านี้เรียกว่า **บันเดิล** — แพ็กเนื้อหาและเมทาดาทาที่
OpenClaw แมปเป็นฟีเจอร์เนทีฟ เช่น Skills, hook และเครื่องมือ MCP

<Info>
  บันเดิล **ไม่ใช่** สิ่งเดียวกับ Plugin เนทีฟของ OpenClaw Plugin เนทีฟทำงาน
  ภายในโปรเซสและสามารถลงทะเบียนความสามารถใดก็ได้ บันเดิลคือแพ็กเนื้อหาที่มี
  การแมปฟีเจอร์แบบเลือกเฉพาะและมีขอบเขตความไว้วางใจที่แคบกว่า
</Info>

## เหตุผลที่มีบันเดิล

Plugin ที่มีประโยชน์จำนวนมากถูกเผยแพร่ในรูปแบบ Codex, Claude หรือ Cursor แทนที่
จะบังคับให้ผู้เขียนเขียนใหม่เป็น Plugin เนทีฟของ OpenClaw, OpenClaw
จะตรวจจับรูปแบบเหล่านี้และแมปเนื้อหาที่รองรับเข้าไปในชุดฟีเจอร์เนทีฟ
หมายความว่าคุณสามารถติดตั้งแพ็กคำสั่ง Claude หรือบันเดิล Skills ของ Codex
แล้วใช้งานได้ทันที

## ติดตั้งบันเดิล

<Steps>
  <Step title="ติดตั้งจากไดเรกทอรี อาร์ไคฟ์ หรือมาร์เก็ตเพลซ">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="ตรวจสอบการตรวจจับ">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    บันเดิลจะแสดงเป็น `Format: bundle` พร้อมชนิดย่อยเป็น `codex`, `claude` หรือ `cursor`

  </Step>

  <Step title="รีสตาร์ทและใช้งาน">
    ```bash
    openclaw gateway restart
    ```

    ฟีเจอร์ที่แมปแล้ว (Skills, hook, เครื่องมือ MCP, ค่าเริ่มต้น LSP) จะพร้อมใช้งานในเซสชันถัดไป

  </Step>
</Steps>

## สิ่งที่ OpenClaw แมปจากบันเดิล

ปัจจุบันไม่ใช่ทุกฟีเจอร์ของบันเดิลที่จะทำงานใน OpenClaw นี่คือสิ่งที่ใช้งานได้
และสิ่งที่ตรวจพบแล้วแต่ยังไม่ได้เชื่อมต่อ

### รองรับแล้วในตอนนี้

| ฟีเจอร์       | วิธีแมป                                                                                 | ใช้กับ     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| เนื้อหา Skills | รูท Skills ของบันเดิลโหลดเป็น Skills ปกติของ OpenClaw                                           | ทุกรูปแบบ    |
| คำสั่ง      | `commands/` และ `.cursor/commands/` ถูกถือเป็นรูท Skills                                  | Claude, Cursor |
| แพ็ก hook    | เลย์เอาต์ `HOOK.md` + `handler.ts` แบบ OpenClaw                                             | Codex          |
| เครื่องมือ MCP     | คอนฟิก MCP ของบันเดิลถูกรวมเข้ากับการตั้งค่า Pi แบบฝัง; โหลดเซิร์ฟเวอร์ stdio และ HTTP ที่รองรับ | ทุกรูปแบบ    |
| เซิร์ฟเวอร์ LSP   | `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศใน manifest ถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝัง  | Claude         |
| การตั้งค่า      | `settings.json` ของ Claude ถูกนำเข้าเป็นค่าเริ่มต้นของ Pi แบบฝัง                                     | Claude         |

#### เนื้อหา Skills

- รูท Skills ของบันเดิลโหลดเป็นรูท Skills ปกติของ OpenClaw
- รูท `commands` ของ Claude ถูกถือเป็นรูท Skills เพิ่มเติม
- รูท `.cursor/commands` ของ Cursor ถูกถือเป็นรูท Skills เพิ่มเติม

หมายความว่าไฟล์คำสั่ง Markdown ของ Claude ทำงานผ่านตัวโหลด Skills ปกติของ
OpenClaw Markdown คำสั่งของ Cursor ทำงานผ่านเส้นทางเดียวกัน

#### แพ็ก hook

- รูท hook ของบันเดิลทำงาน **เฉพาะ** เมื่อใช้เลย์เอาต์ hook-pack ปกติของ
  OpenClaw ปัจจุบันกรณีนี้เป็นกรณีที่เข้ากันได้กับ Codex เป็นหลัก:
  - `HOOK.md`
  - `handler.ts` หรือ `handler.js`

#### MCP สำหรับ Pi

- บันเดิลที่เปิดใช้งานสามารถเพิ่มคอนฟิกเซิร์ฟเวอร์ MCP ได้
- OpenClaw รวมคอนฟิก MCP ของบันเดิลเข้ากับการตั้งค่า Pi แบบฝังที่มีผลจริงเป็น
  `mcpServers`
- OpenClaw แสดงเครื่องมือ MCP ของบันเดิลที่รองรับระหว่างเทิร์นของเอเจนต์ Pi แบบฝังโดย
  เปิดเซิร์ฟเวอร์ stdio หรือเชื่อมต่อกับเซิร์ฟเวอร์ HTTP
- โปรไฟล์เครื่องมือ `coding` และ `messaging` รวมเครื่องมือ MCP ของบันเดิลไว้โดย
  ค่าเริ่มต้น; ใช้ `tools.deny: ["bundle-mcp"]` เพื่อเลือกไม่ใช้สำหรับเอเจนต์หรือ Gateway
- การตั้งค่า Pi เฉพาะโปรเจกต์ยังคงมีผลหลังค่าเริ่มต้นของบันเดิล ดังนั้นการตั้งค่า
  เวิร์กสเปซสามารถแทนที่รายการ MCP ของบันเดิลได้เมื่อจำเป็น
- แคตตาล็อกเครื่องมือ MCP ของบันเดิลถูกจัดเรียงแบบกำหนดแน่นอนก่อนการลงทะเบียน ดังนั้น
  การเปลี่ยนลำดับ `listTools()` จากต้นทางจะไม่ทำให้บล็อกเครื่องมือของ prompt-cache ผันผวน

##### การขนส่ง

เซิร์ฟเวอร์ MCP สามารถใช้การขนส่งแบบ stdio หรือ HTTP:

**Stdio** เปิดโปรเซสลูก:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** เชื่อมต่อกับเซิร์ฟเวอร์ MCP ที่กำลังทำงานผ่าน `sse` โดยค่าเริ่มต้น หรือ `streamable-http` เมื่อร้องขอ:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` สามารถตั้งเป็น `"streamable-http"` หรือ `"sse"`; เมื่อไม่ได้ระบุ OpenClaw จะใช้ `sse`
- `type: "http"` เป็นรูปทรงปลายทางแบบเนทีฟของ CLI; ใช้ `transport: "streamable-http"` ในคอนฟิก OpenClaw `openclaw mcp set` และ `openclaw doctor --fix` จะปรับ alias ทั่วไปให้เป็นมาตรฐาน
- อนุญาตเฉพาะรูปแบบ URL `http:` และ `https:`
- ค่าของ `headers` รองรับการแทรกค่า `${ENV_VAR}`
- รายการเซิร์ฟเวอร์ที่มีทั้ง `command` และ `url` จะถูกปฏิเสธ
- ข้อมูลรับรองใน URL (userinfo และ query params) จะถูกปกปิดจากคำอธิบายเครื่องมือ
  และบันทึก
- `connectionTimeoutMs` แทนที่ค่า timeout การเชื่อมต่อเริ่มต้น 30 วินาทีสำหรับ
  การขนส่งทั้ง stdio และ HTTP

##### การตั้งชื่อเครื่องมือ

OpenClaw ลงทะเบียนเครื่องมือ MCP ของบันเดิลด้วยชื่อที่ปลอดภัยต่อผู้ให้บริการในรูปแบบ
`serverName__toolName` ตัวอย่างเช่น เซิร์ฟเวอร์ที่มีคีย์ `"vigil-harbor"` และเปิดเผย
เครื่องมือ `memory_search` จะลงทะเบียนเป็น `vigil-harbor__memory_search`

- อักขระนอกเหนือจาก `A-Za-z0-9_-` จะถูกแทนที่ด้วย `-`
- ส่วนย่อยที่เริ่มต้นด้วยอักขระที่ไม่ใช่ตัวอักษรจะได้รับคำนำหน้าที่เป็นตัวอักษร ดังนั้นคีย์
  เซิร์ฟเวอร์ที่เป็นตัวเลข เช่น `12306` จะกลายเป็นคำนำหน้าเครื่องมือที่ปลอดภัยต่อผู้ให้บริการ
- คำนำหน้าเซิร์ฟเวอร์จำกัดไว้ที่ 30 อักขระ
- ชื่อเครื่องมือเต็มจำกัดไว้ที่ 64 อักขระ
- ชื่อเซิร์ฟเวอร์ว่างจะ fallback เป็น `mcp`
- ชื่อที่ผ่านการทำให้สะอาดแล้วซ้ำกันจะแยกความแตกต่างด้วย suffix ตัวเลข
- ลำดับเครื่องมือที่เปิดเผยสุดท้ายกำหนดแน่นอนตามชื่อที่ปลอดภัย เพื่อให้เทิร์น Pi ที่ทำซ้ำ
  มี cache ที่เสถียร
- การกรองโปรไฟล์ถือว่าเครื่องมือทั้งหมดจากเซิร์ฟเวอร์ MCP ของบันเดิลเดียวเป็นของ Plugin
  โดย `bundle-mcp` ดังนั้น allowlist และ deny list ของโปรไฟล์สามารถรวมได้ทั้ง
  ชื่อเครื่องมือที่เปิดเผยรายตัวหรือคีย์ Plugin `bundle-mcp`

#### การตั้งค่า Pi แบบฝัง

- `settings.json` ของ Claude ถูกนำเข้าเป็นการตั้งค่า Pi แบบฝังเริ่มต้นเมื่อ
  เปิดใช้งานบันเดิล
- OpenClaw ทำความสะอาดคีย์ override ของเชลล์ก่อนนำไปใช้

คีย์ที่ทำความสะอาดแล้ว:

- `shellPath`
- `shellCommandPrefix`

#### LSP ของ Pi แบบฝัง

- บันเดิล Claude ที่เปิดใช้งานสามารถเพิ่มคอนฟิกเซิร์ฟเวอร์ LSP ได้
- OpenClaw โหลด `.lsp.json` พร้อมพาธ `lspServers` ใดๆ ที่ประกาศใน manifest
- คอนฟิก LSP ของบันเดิลถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝังที่มีผลจริง
- ปัจจุบันมีเฉพาะเซิร์ฟเวอร์ LSP ที่รองรับและมี stdio หนุนหลังเท่านั้นที่รันได้; การขนส่ง
  ที่ไม่รองรับยังคงแสดงใน `openclaw plugins inspect <id>`

### ตรวจพบแต่ไม่ได้ดำเนินการ

รายการเหล่านี้ถูกจดจำและแสดงในการวินิจฉัย แต่ OpenClaw ไม่รัน:

- `agents`, automation `hooks.json`, `outputStyles` ของ Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` ของ Cursor
- เมทาดาทา inline/app ของ Codex นอกเหนือจากการรายงานความสามารถ

## รูปแบบบันเดิล

<AccordionGroup>
  <Accordion title="บันเดิล Codex">
    ตัวระบุ: `.codex-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    บันเดิล Codex เข้ากับ OpenClaw ได้ดีที่สุดเมื่อใช้รูท Skills และไดเรกทอรี
    hook-pack แบบ OpenClaw (`HOOK.md` + `handler.ts`)

  </Accordion>

  <Accordion title="บันเดิล Claude">
    โหมดการตรวจจับสองแบบ:

    - **อิง manifest:** `.claude-plugin/plugin.json`
    - **ไม่มี manifest:** เลย์เอาต์ Claude เริ่มต้น (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    พฤติกรรมเฉพาะของ Claude:

    - `commands/` ถูกถือเป็นเนื้อหา Skills
    - `settings.json` ถูกนำเข้าไปในการตั้งค่า Pi แบบฝัง (คีย์ override ของเชลล์จะถูกทำความสะอาด)
    - `.mcp.json` เปิดเผยเครื่องมือ stdio ที่รองรับให้กับ Pi แบบฝัง
    - `.lsp.json` พร้อมพาธ `lspServers` ที่ประกาศใน manifest โหลดเข้าไปในค่าเริ่มต้น LSP ของ Pi แบบฝัง
    - `hooks/hooks.json` ถูกตรวจพบแต่ไม่ถูกดำเนินการ
    - พาธคอมโพเนนต์แบบกำหนดเองใน manifest เป็นแบบเพิ่มเติม (ขยายค่าเริ่มต้น ไม่ใช่แทนที่)

  </Accordion>

  <Accordion title="บันเดิล Cursor">
    ตัวระบุ: `.cursor-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` ถูกถือเป็นเนื้อหา Skills
    - `.cursor/rules/`, `.cursor/agents/` และ `.cursor/hooks.json` เป็นแบบตรวจจับเท่านั้น

  </Accordion>
</AccordionGroup>

## ลำดับความสำคัญในการตรวจจับ

OpenClaw ตรวจหารูปแบบ Plugin เนทีฟก่อน:

1. `openclaw.plugin.json` หรือ `package.json` ที่ถูกต้องพร้อม `openclaw.extensions` — ถือเป็น **Plugin เนทีฟ**
2. ตัวระบุบันเดิล (`.codex-plugin/`, `.claude-plugin/` หรือเลย์เอาต์ Claude/Cursor เริ่มต้น) — ถือเป็น **บันเดิล**

หากไดเรกทอรีมีทั้งสองอย่าง OpenClaw จะใช้เส้นทางเนทีฟ วิธีนี้ป้องกันไม่ให้
แพ็กเกจสองรูปแบบถูกติดตั้งบางส่วนเป็นบันเดิล

## การขึ้นต่อกันขณะรันไทม์และการล้างข้อมูล

- บันเดิลที่เข้ากันได้จากบุคคลที่สามจะไม่ได้รับการซ่อมแซม `npm install` ตอนเริ่มทำงาน
  ควรถูกติดตั้งผ่าน `openclaw plugins install` และจัดส่งทุกอย่างที่จำเป็น
  ไว้ในไดเรกทอรี Plugin ที่ติดตั้งแล้ว
- Plugin แบบบันเดิลที่ OpenClaw เป็นเจ้าของจะถูกจัดส่งแบบเบาใน core หรือ
  ดาวน์โหลดได้ผ่านตัวติดตั้ง Plugin การเริ่มทำงานของ Gateway จะไม่รัน
  package manager สำหรับสิ่งเหล่านี้
- `openclaw doctor --fix` ลบไดเรกทอรี dependency แบบ staged รุ่นเก่า และสามารถ
  กู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งหายไปจากดัชนี Plugin ภายในเครื่องเมื่อ
  คอนฟิกอ้างอิงถึงสิ่งเหล่านั้น

## ความปลอดภัย

บันเดิลมีขอบเขตความไว้วางใจที่แคบกว่า Plugin เนทีฟ:

- OpenClaw **ไม่** โหลดโมดูลรันไทม์ของบันเดิลใดๆ แบบ arbitrary เข้าในโปรเซส
- พาธ Skills และ hook-pack ต้องอยู่ภายในรูท Plugin (ตรวจสอบขอบเขตแล้ว)
- ไฟล์การตั้งค่าถูกอ่านด้วยการตรวจสอบขอบเขตแบบเดียวกัน
- เซิร์ฟเวอร์ MCP แบบ stdio ที่รองรับอาจถูกเปิดเป็น subprocess

สิ่งนี้ทำให้บันเดิลปลอดภัยกว่าโดยค่าเริ่มต้น แต่คุณยังควรถือว่าบันเดิลจากบุคคลที่สาม
เป็นเนื้อหาที่เชื่อถือได้สำหรับฟีเจอร์ที่มันเปิดเผย

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ตรวจพบบันเดิลแต่ความสามารถไม่ทำงาน">
    รัน `openclaw plugins inspect <id>` หากความสามารถอยู่ในรายการแต่ถูกทำเครื่องหมายว่า
    ยังไม่ได้เชื่อมต่อ นั่นคือข้อจำกัดของผลิตภัณฑ์ — ไม่ใช่การติดตั้งที่เสีย
  </Accordion>

  <Accordion title="ไฟล์คำสั่ง Claude ไม่ปรากฏ">
    ตรวจสอบให้แน่ใจว่าบันเดิลเปิดใช้งานอยู่ และไฟล์ Markdown อยู่ภายในรูท
    `commands/` หรือ `skills/` ที่ตรวจพบ
  </Accordion>

  <Accordion title="การตั้งค่า Claude ไม่มีผล">
    รองรับเฉพาะการตั้งค่า Pi แบบฝังจาก `settings.json` เท่านั้น OpenClaw ไม่ได้
    ถือว่าการตั้งค่าบันเดิลเป็นแพตช์คอนฟิกดิบ
  </Accordion>

  <Accordion title="hook ของ Claude ไม่ดำเนินการ">
    `hooks/hooks.json` เป็นแบบตรวจจับเท่านั้น หากคุณต้องการ hook ที่รันได้ ให้ใช้
    เลย์เอาต์ hook-pack ของ OpenClaw หรือจัดส่ง Plugin เนทีฟ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin)
- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้าง Plugin เนทีฟ
- [Plugin Manifest](/th/plugins/manifest) — สคีมา manifest เนทีฟ
