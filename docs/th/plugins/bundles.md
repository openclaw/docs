---
read_when:
    - คุณต้องการติดตั้งบันเดิลที่เข้ากันได้กับ Codex, Claude หรือ Cursor
    - คุณจำเป็นต้องเข้าใจว่า OpenClaw แมปเนื้อหาในบันเดิลไปเป็นฟีเจอร์เนทีฟอย่างไร
    - คุณกำลังดีบักการตรวจจับบันเดิลหรือความสามารถที่ขาดหายไป
summary: ติดตั้งและใช้บันเดิล Codex, Claude และ Cursor เป็น Plugin ของ OpenClaw
title: ชุดรวม Plugin
x-i18n:
    generated_at: "2026-06-27T17:51:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw สามารถติดตั้ง Plugin จากระบบนิเวศภายนอกได้สามแบบ: **Codex**, **Claude**,
และ **Cursor** สิ่งเหล่านี้เรียกว่า **บันเดิล** ซึ่งเป็นแพ็กเนื้อหาและเมตาดาต้าที่
OpenClaw แมปเข้ากับฟีเจอร์เนทีฟ เช่น Skills, ฮุก และเครื่องมือ MCP

<Info>
  บันเดิล **ไม่ใช่** สิ่งเดียวกับ Plugin แบบเนทีฟของ OpenClaw Plugin แบบเนทีฟทำงาน
  ในโปรเซสเดียวกันและสามารถลงทะเบียนความสามารถใดก็ได้ บันเดิลเป็นแพ็กเนื้อหาที่มี
  การแมปฟีเจอร์แบบคัดเลือกและมีขอบเขตความเชื่อถือที่แคบกว่า
</Info>

## เหตุผลที่มีบันเดิล

Plugin ที่มีประโยชน์จำนวนมากเผยแพร่ในรูปแบบ Codex, Claude หรือ Cursor แทนที่จะ
บังคับให้ผู้เขียนเขียนใหม่เป็น Plugin แบบเนทีฟของ OpenClaw, OpenClaw
จะตรวจจับรูปแบบเหล่านี้และแมปเนื้อหาที่รองรับเข้าไปในชุดฟีเจอร์เนทีฟ ซึ่งหมายความว่า
คุณสามารถติดตั้งแพ็กคำสั่ง Claude หรือบันเดิล Skills ของ Codex แล้วใช้งานได้ทันที

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

  <Step title="รีสตาร์ตและใช้งาน">
    ```bash
    openclaw gateway restart
    ```

    ฟีเจอร์ที่แมปแล้ว (Skills, ฮุก, เครื่องมือ MCP, ค่าเริ่มต้น LSP) จะพร้อมใช้งานในเซสชันถัดไป

  </Step>
</Steps>

## สิ่งที่ OpenClaw แมปจากบันเดิล

ไม่ใช่ทุกฟีเจอร์ของบันเดิลจะทำงานใน OpenClaw ตอนนี้ ต่อไปนี้คือสิ่งที่ใช้งานได้และสิ่งที่
ตรวจพบแล้วแต่ยังไม่ได้เชื่อมต่อ

### รองรับแล้วตอนนี้

| ฟีเจอร์       | วิธีที่แมป                                                                                       | ใช้กับ     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| เนื้อหา Skills | ราก Skills ของบันเดิลโหลดเป็น Skills ปกติของ OpenClaw                                                 | ทุกรูปแบบ    |
| คำสั่ง      | `commands/` และ `.cursor/commands/` ถูกจัดการเป็นราก Skills                                        | Claude, Cursor |
| แพ็กฮุก    | เลย์เอาต์ `HOOK.md` + `handler.ts` ในรูปแบบ OpenClaw                                                   | Codex          |
| เครื่องมือ MCP     | คอนฟิก MCP ของบันเดิลถูกผสานเข้าในการตั้งค่า OpenClaw แบบฝังตัว; โหลดเซิร์ฟเวอร์ stdio และ HTTP ที่รองรับ | ทุกรูปแบบ    |
| เซิร์ฟเวอร์ LSP   | Claude `.lsp.json` และ `lspServers` ที่ประกาศใน manifest ถูกผสานเข้าในค่าเริ่มต้น LSP ของ OpenClaw แบบฝังตัว  | Claude         |
| การตั้งค่า      | นำเข้า Claude `settings.json` เป็นค่าเริ่มต้น OpenClaw แบบฝังตัว                                     | Claude         |

#### เนื้อหา Skills

- ราก Skills ของบันเดิลโหลดเป็นราก Skills ปกติของ OpenClaw
- ราก `commands` ของ Claude ถูกจัดการเป็นราก Skills เพิ่มเติม
- ราก `.cursor/commands` ของ Cursor ถูกจัดการเป็นราก Skills เพิ่มเติม

ซึ่งหมายความว่าไฟล์คำสั่ง markdown ของ Claude ทำงานผ่านตัวโหลด Skills ปกติของ
OpenClaw ส่วน markdown คำสั่งของ Cursor ทำงานผ่านเส้นทางเดียวกัน

#### แพ็กฮุก

- รากฮุกของบันเดิลทำงาน **เฉพาะ** เมื่อใช้เลย์เอาต์แพ็กฮุก OpenClaw ปกติ
  ปัจจุบันกรณีนี้คือกรณีที่เข้ากันได้กับ Codex เป็นหลัก:
  - `HOOK.md`
  - `handler.ts` หรือ `handler.js`

#### MCP สำหรับ OpenClaw แบบฝังตัว

- บันเดิลที่เปิดใช้งานสามารถเพิ่มคอนฟิกเซิร์ฟเวอร์ MCP ได้
- OpenClaw ผสานคอนฟิก MCP ของบันเดิลเข้าในการตั้งค่า OpenClaw แบบฝังตัวที่มีผลใช้งานเป็น
  `mcpServers`
- OpenClaw เปิดให้ใช้เครื่องมือ MCP ของบันเดิลที่รองรับระหว่างเทิร์นของเอเจนต์ OpenClaw แบบฝังตัว โดย
  เปิดเซิร์ฟเวอร์ stdio หรือเชื่อมต่อกับเซิร์ฟเวอร์ HTTP
- โปรไฟล์เครื่องมือ `coding` และ `messaging` รวมเครื่องมือ MCP ของบันเดิลไว้
  ตามค่าเริ่มต้น; ใช้ `tools.deny: ["bundle-mcp"]` เพื่อไม่ใช้สำหรับเอเจนต์หรือ Gateway
- การตั้งค่าเอเจนต์แบบฝังตัวเฉพาะโปรเจกต์ยังคงมีผลหลังค่าเริ่มต้นของบันเดิล ดังนั้นการตั้งค่าพื้นที่ทำงาน
  สามารถแทนที่รายการ MCP ของบันเดิลได้เมื่อจำเป็น
- แคตตาล็อกเครื่องมือ MCP ของบันเดิลถูกเรียงอย่างกำหนดแน่นอนก่อนลงทะเบียน ดังนั้น
  การเปลี่ยนลำดับ `listTools()` จากต้นทางจะไม่ทำให้บล็อกเครื่องมือในพรอมป์แคชสั่นไหว

##### ทรานสปอร์ต

เซิร์ฟเวอร์ MCP สามารถใช้ทรานสปอร์ต stdio หรือ HTTP:

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

**HTTP** เชื่อมต่อกับเซิร์ฟเวอร์ MCP ที่กำลังทำงานผ่าน `sse` ตามค่าเริ่มต้น หรือ `streamable-http` เมื่อร้องขอ:

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

- `transport` อาจตั้งเป็น `"streamable-http"` หรือ `"sse"`; เมื่อไม่ได้ระบุ OpenClaw จะใช้ `sse`
- `type: "http"` เป็นรูปทรง downstream แบบเนทีฟของ CLI; ใช้ `transport: "streamable-http"` ในคอนฟิก OpenClaw `openclaw mcp set` และ `openclaw doctor --fix` จะทำให้ alias ทั่วไปเป็นรูปแบบมาตรฐาน
- อนุญาตเฉพาะ URL scheme `http:` และ `https:`
- ค่า `headers` รองรับการแทรกค่า `${ENV_VAR}`
- รายการเซิร์ฟเวอร์ที่มีทั้ง `command` และ `url` จะถูกปฏิเสธ
- ข้อมูลรับรองใน URL (userinfo และ query params) จะถูกปกปิดจากคำอธิบายเครื่องมือ
  และล็อก
- `connectionTimeoutMs` จะแทนที่ค่า timeout การเชื่อมต่อเริ่มต้น 30 วินาทีสำหรับ
  ทรานสปอร์ตทั้ง stdio และ HTTP

##### การตั้งชื่อเครื่องมือ

OpenClaw ลงทะเบียนเครื่องมือ MCP ของบันเดิลด้วยชื่อที่ปลอดภัยสำหรับ provider ในรูปแบบ
`serverName__toolName` ตัวอย่างเช่น เซิร์ฟเวอร์ที่ใช้คีย์ `"vigil-harbor"` และเปิดเผยเครื่องมือ
`memory_search` จะลงทะเบียนเป็น `vigil-harbor__memory_search`

- อักขระนอกเหนือจาก `A-Za-z0-9_-` จะถูกแทนที่ด้วย `-`
- ชิ้นส่วนที่อาจขึ้นต้นด้วยอักขระที่ไม่ใช่ตัวอักษรจะได้รับคำนำหน้าเป็นตัวอักษร ดังนั้นคีย์เซิร์ฟเวอร์แบบตัวเลข
  เช่น `12306` จะกลายเป็นคำนำหน้าเครื่องมือที่ปลอดภัยสำหรับ provider
- คำนำหน้าเซิร์ฟเวอร์จำกัดไว้ที่ 30 อักขระ
- ชื่อเครื่องมือเต็มจำกัดไว้ที่ 64 อักขระ
- ชื่อเซิร์ฟเวอร์ว่างจะใช้ `mcp` แทน
- ชื่อที่ผ่านการ sanitize แล้วชนกันจะถูกแยกด้วย suffix ตัวเลข
- ลำดับเครื่องมือสุดท้ายที่เปิดเผยถูกกำหนดแน่นอนตามชื่อที่ปลอดภัย เพื่อให้เทิร์นเอเจนต์แบบฝังตัวซ้ำๆ
  มีแคชที่เสถียร
- การกรองโปรไฟล์ถือว่าเครื่องมือทั้งหมดจากเซิร์ฟเวอร์ MCP ของบันเดิลเดียวเป็นของ Plugin
  โดย `bundle-mcp` ดังนั้น allowlist และ deny list ของโปรไฟล์สามารถรวมได้ทั้ง
  ชื่อเครื่องมือที่เปิดเผยรายตัว หรือคีย์ Plugin `bundle-mcp`

#### การตั้งค่า OpenClaw แบบฝังตัว

- `settings.json` ของ Claude ถูกนำเข้าเป็นการตั้งค่าเริ่มต้นของ OpenClaw แบบฝังตัวเมื่อ
  เปิดใช้งานบันเดิล
- OpenClaw sanitize คีย์ shell override ก่อนนำไปใช้

คีย์ที่ sanitize แล้ว:

- `shellPath`
- `shellCommandPrefix`

#### LSP ของ OpenClaw แบบฝังตัว

- บันเดิล Claude ที่เปิดใช้งานสามารถเพิ่มคอนฟิกเซิร์ฟเวอร์ LSP ได้
- OpenClaw โหลด `.lsp.json` พร้อมพาธ `lspServers` ที่ประกาศใน manifest
- คอนฟิก LSP ของบันเดิลถูกผสานเข้าในค่าเริ่มต้น LSP ของ OpenClaw แบบฝังตัวที่มีผลใช้งาน
- ปัจจุบันเฉพาะเซิร์ฟเวอร์ LSP ที่รองรับและใช้ stdio เท่านั้นที่เรียกใช้งานได้; ทรานสปอร์ตที่ไม่รองรับ
  ยังแสดงใน `openclaw plugins inspect <id>`

### ตรวจพบแต่ไม่เรียกใช้งาน

สิ่งเหล่านี้ถูกจดจำและแสดงในการวินิจฉัย แต่ OpenClaw ไม่เรียกใช้งาน:

- Claude `agents`, automation `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- เมตาดาต้า inline/app ของ Codex นอกเหนือจากการรายงานความสามารถ

## รูปแบบบันเดิล

<AccordionGroup>
  <Accordion title="บันเดิล Codex">
    ตัวบ่งชี้: `.codex-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    บันเดิล Codex เข้ากับ OpenClaw ได้ดีที่สุดเมื่อใช้ราก Skills และไดเรกทอรี
    แพ็กฮุกแบบ OpenClaw (`HOOK.md` + `handler.ts`)

  </Accordion>

  <Accordion title="บันเดิล Claude">
    โหมดการตรวจจับสองแบบ:

    - **อิง manifest:** `.claude-plugin/plugin.json`
    - **ไม่มี manifest:** เลย์เอาต์ Claude เริ่มต้น (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    พฤติกรรมเฉพาะของ Claude:

    - `commands/` ถูกจัดการเป็นเนื้อหา Skills
    - `settings.json` ถูกนำเข้าในการตั้งค่า OpenClaw แบบฝังตัว (คีย์ shell override จะถูก sanitize)
    - `.mcp.json` เปิดเผยเครื่องมือ stdio ที่รองรับไปยัง OpenClaw แบบฝังตัว
    - `.lsp.json` พร้อมพาธ `lspServers` ที่ประกาศใน manifest จะโหลดเข้าในค่าเริ่มต้น LSP ของ OpenClaw แบบฝังตัว
    - `hooks/hooks.json` ถูกตรวจพบแต่ไม่เรียกใช้งาน
    - พาธคอมโพเนนต์แบบกำหนดเองใน manifest เป็นแบบเพิ่มต่อยอด (ขยายค่าเริ่มต้น ไม่ใช่แทนที่)

  </Accordion>

  <Accordion title="บันเดิล Cursor">
    ตัวบ่งชี้: `.cursor-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` ถูกจัดการเป็นเนื้อหา Skills
    - `.cursor/rules/`, `.cursor/agents/`, และ `.cursor/hooks.json` เป็นแบบตรวจจับเท่านั้น

  </Accordion>
</AccordionGroup>

## ลำดับความสำคัญในการตรวจจับ

OpenClaw ตรวจหารูปแบบ Plugin แบบเนทีฟก่อน:

1. `openclaw.plugin.json` หรือ `package.json` ที่ถูกต้องพร้อม `openclaw.extensions` — ถูกจัดการเป็น **Plugin แบบเนทีฟ**
2. ตัวบ่งชี้บันเดิล (`.codex-plugin/`, `.claude-plugin/` หรือเลย์เอาต์ Claude/Cursor เริ่มต้น) — ถูกจัดการเป็น **บันเดิล**

หากไดเรกทอรีมีทั้งสองแบบ OpenClaw จะใช้เส้นทางเนทีฟ วิธีนี้ป้องกันไม่ให้
แพ็กเกจแบบสองรูปแบบถูกติดตั้งบางส่วนเป็นบันเดิล

## การพึ่งพารันไทม์และการล้างข้อมูล

- บันเดิลจากภายนอกที่เข้ากันได้จะไม่ได้รับการซ่อมแซม `npm install` ตอนเริ่มต้นระบบ บันเดิลเหล่านี้
  ควรถูกติดตั้งผ่าน `openclaw plugins install` และจัดส่งทุกอย่าง
  ที่ต้องใช้ไว้ในไดเรกทอรี Plugin ที่ติดตั้งแล้ว
- Plugin แบบบันเดิลที่ OpenClaw เป็นเจ้าของจะถูกจัดส่งแบบเบาใน core หรือ
  ดาวน์โหลดได้ผ่านตัวติดตั้ง Plugin การเริ่มต้น Gateway จะไม่เรียกใช้
  package manager สำหรับสิ่งเหล่านี้
- `openclaw doctor --fix` จะลบไดเรกทอรี dependency แบบ staged เดิม และสามารถ
  กู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งหายไปจากดัชนี Plugin ในเครื่องเมื่อ
  คอนฟิกอ้างอิงถึงสิ่งเหล่านั้น

## ความปลอดภัย

บันเดิลมีขอบเขตความเชื่อถือที่แคบกว่า Plugin แบบเนทีฟ:

- OpenClaw **ไม่** โหลดโมดูลรันไทม์ของบันเดิลตามอำเภอใจในโปรเซสเดียวกัน
- พาธ Skills และแพ็กฮุกต้องอยู่ภายในราก Plugin (ตรวจสอบขอบเขตแล้ว)
- ไฟล์การตั้งค่าถูกอ่านด้วยการตรวจสอบขอบเขตแบบเดียวกัน
- เซิร์ฟเวอร์ MCP แบบ stdio ที่รองรับอาจถูกเปิดเป็น subprocess

สิ่งนี้ทำให้บันเดิลปลอดภัยกว่าโดยค่าเริ่มต้น แต่คุณยังควรถือว่าบันเดิลจากภายนอก
เป็นเนื้อหาที่เชื่อถือได้สำหรับฟีเจอร์ที่เปิดเผยอยู่ดี

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ตรวจพบบันเดิลแต่ความสามารถไม่ทำงาน">
    เรียกใช้ `openclaw plugins inspect <id>` หากความสามารถถูกระบุไว้แต่ถูกทำเครื่องหมายว่า
    ยังไม่ได้เชื่อมต่อ นั่นคือข้อจำกัดของผลิตภัณฑ์ ไม่ใช่การติดตั้งที่เสีย
  </Accordion>

  <Accordion title="ไฟล์คำสั่ง Claude ไม่ปรากฏ">
    ตรวจสอบให้แน่ใจว่าบันเดิลเปิดใช้งานแล้ว และไฟล์ markdown อยู่ภายในราก
    `commands/` หรือ `skills/` ที่ตรวจพบ
  </Accordion>

  <Accordion title="การตั้งค่า Claude ไม่มีผล">
    รองรับเฉพาะการตั้งค่า OpenClaw แบบฝังตัวจาก `settings.json` เท่านั้น OpenClaw
    ไม่ถือว่าการตั้งค่าบันเดิลเป็นแพตช์คอนฟิกดิบ
  </Accordion>

  <Accordion title="ฮุก Claude ไม่ทำงาน">
    `hooks/hooks.json` เป็นแบบตรวจจับเท่านั้น หากคุณต้องการฮุกที่เรียกใช้งานได้ ให้ใช้
    เลย์เอาต์แพ็กฮุก OpenClaw หรือจัดส่ง Plugin แบบเนทีฟ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin)
- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้าง Plugin แบบเนทีฟ
- [Manifest ของ Plugin](/th/plugins/manifest) — schema manifest แบบเนทีฟ
