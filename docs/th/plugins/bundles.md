---
read_when:
    - คุณต้องการติดตั้งบันเดิลที่เข้ากันได้กับ Codex, Claude หรือ Cursor
    - คุณต้องเข้าใจว่า OpenClaw แมปเนื้อหาของบันเดิลเข้ากับฟีเจอร์เนทีฟอย่างไร
    - คุณกำลังดีบักการตรวจจับบันเดิลหรือความสามารถที่หายไป
summary: ติดตั้งและใช้บันเดิล Codex, Claude และ Cursor เป็น Plugin ของ OpenClaw
title: บันเดิล Plugin
x-i18n:
    generated_at: "2026-04-30T10:04:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw สามารถติดตั้ง Plugin จากระบบนิเวศภายนอกได้สามแบบ: **Codex**, **Claude**,
และ **Cursor** สิ่งเหล่านี้เรียกว่า **บันเดิล** ซึ่งเป็นแพ็กเนื้อหาและเมทาดาทาที่
OpenClaw จับคู่เข้ากับฟีเจอร์เนทีฟ เช่น Skills, hook และเครื่องมือ MCP

<Info>
  บันเดิล **ไม่ใช่** สิ่งเดียวกับ Plugin เนทีฟของ OpenClaw Plugin เนทีฟทำงาน
  ในโพรเซสและสามารถลงทะเบียนความสามารถใดก็ได้ บันเดิลคือแพ็กเนื้อหาที่มี
  การจับคู่ฟีเจอร์แบบเลือกเฉพาะและมีขอบเขตความไว้วางใจที่แคบกว่า
</Info>

## เหตุผลที่มีบันเดิล

Plugin ที่มีประโยชน์จำนวนมากเผยแพร่ในรูปแบบ Codex, Claude หรือ Cursor แทนที่จะ
บังคับให้ผู้เขียนต้องเขียนใหม่เป็น Plugin เนทีฟของ OpenClaw, OpenClaw
จะตรวจพบรูปแบบเหล่านี้และจับคู่เนื้อหาที่รองรับเข้ากับชุดฟีเจอร์เนทีฟ
ซึ่งหมายความว่าคุณสามารถติดตั้งแพ็กคำสั่ง Claude หรือบันเดิล Skills ของ Codex
และใช้งานได้ทันที

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

  <Step title="ตรวจสอบการตรวจพบ">
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

    ฟีเจอร์ที่จับคู่แล้ว (Skills, hook, เครื่องมือ MCP, ค่าเริ่มต้น LSP) จะพร้อมใช้งานในเซสชันถัดไป

  </Step>
</Steps>

## สิ่งที่ OpenClaw จับคู่จากบันเดิล

ไม่ใช่ทุกฟีเจอร์ของบันเดิลที่ทำงานใน OpenClaw วันนี้ ต่อไปนี้คือสิ่งที่ใช้งานได้และสิ่งที่
ตรวจพบแล้วแต่ยังไม่ได้เชื่อมต่อ

### รองรับแล้วตอนนี้

| ฟีเจอร์       | วิธีที่จับคู่                                                                                 | ใช้กับ     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| เนื้อหา Skills | รูท Skills ของบันเดิลโหลดเป็น Skills ปกติของ OpenClaw                                           | ทุกรูปแบบ    |
| คำสั่ง      | `commands/` และ `.cursor/commands/` ถูกถือเป็นรูท Skills                                  | Claude, Cursor |
| แพ็ก hook    | เลย์เอาต์ `HOOK.md` + `handler.ts` แบบ OpenClaw                                             | Codex          |
| เครื่องมือ MCP     | รวมคอนฟิก MCP ของบันเดิลเข้ากับการตั้งค่า Pi แบบฝังตัว; โหลดเซิร์ฟเวอร์ stdio และ HTTP ที่รองรับ | ทุกรูปแบบ    |
| เซิร์ฟเวอร์ LSP   | รวม `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศใน manifest เข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝังตัว  | Claude         |
| การตั้งค่า      | นำเข้า `settings.json` ของ Claude เป็นค่าเริ่มต้นของ Pi แบบฝังตัว                                     | Claude         |

#### เนื้อหา Skills

- รูท Skills ของบันเดิลโหลดเป็นรูท Skills ปกติของ OpenClaw
- รูท `commands` ของ Claude ถูกถือเป็นรูท Skills เพิ่มเติม
- รูท `.cursor/commands` ของ Cursor ถูกถือเป็นรูท Skills เพิ่มเติม

ซึ่งหมายความว่าไฟล์คำสั่งมาร์กดาวน์ของ Claude ทำงานผ่านตัวโหลด Skills ปกติของ OpenClaw
มาร์กดาวน์คำสั่งของ Cursor ทำงานผ่านเส้นทางเดียวกัน

#### แพ็ก hook

- รูท hook ของบันเดิลทำงาน **เฉพาะ** เมื่อใช้เลย์เอาต์แพ็ก hook ปกติของ OpenClaw
  วันนี้กรณีนี้หลัก ๆ คือกรณีที่เข้ากันได้กับ Codex:
  - `HOOK.md`
  - `handler.ts` หรือ `handler.js`

#### MCP สำหรับ Pi

- บันเดิลที่เปิดใช้งานสามารถเพิ่มคอนฟิกเซิร์ฟเวอร์ MCP ได้
- OpenClaw รวมคอนฟิก MCP ของบันเดิลเข้ากับการตั้งค่า Pi แบบฝังตัวที่มีผลจริงเป็น
  `mcpServers`
- OpenClaw เปิดเผยเครื่องมือ MCP ของบันเดิลที่รองรับระหว่างเทิร์นของเอเจนต์ Pi แบบฝังตัวโดย
  เรียกใช้เซิร์ฟเวอร์ stdio หรือเชื่อมต่อกับเซิร์ฟเวอร์ HTTP
- โปรไฟล์เครื่องมือ `coding` และ `messaging` รวมเครื่องมือ MCP ของบันเดิลไว้โดย
  ค่าเริ่มต้น; ใช้ `tools.deny: ["bundle-mcp"]` เพื่อเลือกไม่ใช้สำหรับเอเจนต์หรือ Gateway
- การตั้งค่า Pi เฉพาะโปรเจกต์ยังคงมีผลหลังจากค่าเริ่มต้นของบันเดิล ดังนั้นการตั้งค่าของเวิร์กสเปซ
  สามารถแทนที่รายการ MCP ของบันเดิลได้เมื่อจำเป็น
- แคตตาล็อกเครื่องมือ MCP ของบันเดิลถูกจัดเรียงแบบกำหนดแน่นอนก่อนลงทะเบียน ดังนั้น
  การเปลี่ยนแปลงลำดับ `listTools()` จากต้นทางจะไม่ทำให้บล็อกเครื่องมือใน prompt-cache สั่นไหว

##### การขนส่ง

เซิร์ฟเวอร์ MCP สามารถใช้การขนส่งแบบ stdio หรือ HTTP:

**Stdio** เรียกใช้โพรเซสลูก:

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

**HTTP** เชื่อมต่อกับเซิร์ฟเวอร์ MCP ที่กำลังทำงานผ่าน `sse` โดยค่าเริ่มต้น หรือ `streamable-http` เมื่อระบุ:

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
- `type: "http"` เป็นรูปทรงปลายทางแบบ CLI-native; ใช้ `transport: "streamable-http"` ในคอนฟิก OpenClaw `openclaw mcp set` และ `openclaw doctor --fix` จะปรับ alias ทั่วไปให้เป็นรูปแบบมาตรฐาน
- อนุญาตเฉพาะสกีมา URL `http:` และ `https:`
- ค่า `headers` รองรับการแทรกค่า `${ENV_VAR}`
- รายการเซิร์ฟเวอร์ที่มีทั้ง `command` และ `url` จะถูกปฏิเสธ
- ข้อมูลรับรองใน URL (userinfo และพารามิเตอร์ query) จะถูกปกปิดจากคำอธิบายเครื่องมือ
  และล็อก
- `connectionTimeoutMs` แทนที่ค่า timeout การเชื่อมต่อเริ่มต้น 30 วินาทีสำหรับ
  การขนส่งทั้ง stdio และ HTTP

##### การตั้งชื่อเครื่องมือ

OpenClaw ลงทะเบียนเครื่องมือ MCP ของบันเดิลด้วยชื่อที่ปลอดภัยสำหรับผู้ให้บริการในรูปแบบ
`serverName__toolName` ตัวอย่างเช่น เซิร์ฟเวอร์ที่มีคีย์ `"vigil-harbor"` และเปิดเผย
เครื่องมือ `memory_search` จะลงทะเบียนเป็น `vigil-harbor__memory_search`

- อักขระนอก `A-Za-z0-9_-` จะถูกแทนที่ด้วย `-`
- คำนำหน้าเซิร์ฟเวอร์จำกัดที่ 30 อักขระ
- ชื่อเครื่องมือเต็มจำกัดที่ 64 อักขระ
- ชื่อเซิร์ฟเวอร์ว่างจะ fallback เป็น `mcp`
- ชื่อที่ sanitize แล้วซ้ำกันจะถูกแยกความแตกต่างด้วย suffix ตัวเลข
- ลำดับเครื่องมือที่เปิดเผยสุดท้ายกำหนดแน่นอนตามชื่อที่ปลอดภัย เพื่อให้เทิร์น Pi ที่ซ้ำกัน
  มีแคชที่เสถียร
- การกรองโปรไฟล์ถือว่าเครื่องมือทั้งหมดจากเซิร์ฟเวอร์ MCP ของบันเดิลหนึ่งตัวเป็นของ Plugin
  โดย `bundle-mcp` ดังนั้น allowlist และ deny list ของโปรไฟล์จึงสามารถรวมได้ทั้ง
  ชื่อเครื่องมือที่เปิดเผยรายตัวหรือคีย์ Plugin `bundle-mcp`

#### การตั้งค่า Pi แบบฝังตัว

- `settings.json` ของ Claude ถูกนำเข้าเป็นการตั้งค่า Pi แบบฝังตัวเริ่มต้นเมื่อ
  เปิดใช้งานบันเดิล
- OpenClaw sanitize คีย์ override ของ shell ก่อนนำไปใช้

คีย์ที่ sanitize:

- `shellPath`
- `shellCommandPrefix`

#### LSP ของ Pi แบบฝังตัว

- บันเดิล Claude ที่เปิดใช้งานสามารถเพิ่มคอนฟิกเซิร์ฟเวอร์ LSP ได้
- OpenClaw โหลด `.lsp.json` พร้อมพาธ `lspServers` ใด ๆ ที่ประกาศใน manifest
- คอนฟิก LSP ของบันเดิลถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝังตัวที่มีผลจริง
- วันนี้มีเฉพาะเซิร์ฟเวอร์ LSP ที่รองรับและมี stdio เป็นฐานเท่านั้นที่รันได้; การขนส่งที่ไม่รองรับ
  ยังแสดงใน `openclaw plugins inspect <id>`

### ตรวจพบแล้วแต่ไม่ได้ดำเนินการ

รายการเหล่านี้ถูกจดจำและแสดงในการวินิจฉัย แต่ OpenClaw ไม่ได้รัน:

- `agents`, automation `hooks.json`, `outputStyles` ของ Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` ของ Cursor
- เมทาดาทา inline/app ของ Codex นอกเหนือจากการรายงานความสามารถ

## รูปแบบบันเดิล

<AccordionGroup>
  <Accordion title="บันเดิล Codex">
    ตัวบ่งชี้: `.codex-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    บันเดิล Codex เข้ากับ OpenClaw ได้ดีที่สุดเมื่อใช้รูท Skills และ
    ไดเรกทอรีแพ็ก hook แบบ OpenClaw (`HOOK.md` + `handler.ts`)

  </Accordion>

  <Accordion title="บันเดิล Claude">
    โหมดการตรวจพบสองแบบ:

    - **อิง manifest:** `.claude-plugin/plugin.json`
    - **ไม่มี manifest:** เลย์เอาต์ Claude เริ่มต้น (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    พฤติกรรมเฉพาะของ Claude:

    - `commands/` ถูกถือเป็นเนื้อหา Skills
    - `settings.json` ถูกนำเข้าไปยังการตั้งค่า Pi แบบฝังตัว (คีย์ override ของ shell จะถูก sanitize)
    - `.mcp.json` เปิดเผยเครื่องมือ stdio ที่รองรับให้ Pi แบบฝังตัว
    - `.lsp.json` พร้อมพาธ `lspServers` ที่ประกาศใน manifest โหลดเข้าค่าเริ่มต้น LSP ของ Pi แบบฝังตัว
    - `hooks/hooks.json` ถูกตรวจพบแต่ไม่ได้ดำเนินการ
    - พาธคอมโพเนนต์กำหนดเองใน manifest เป็นแบบเพิ่มเข้าไป (ขยายค่าเริ่มต้น ไม่ใช่แทนที่)

  </Accordion>

  <Accordion title="บันเดิล Cursor">
    ตัวบ่งชี้: `.cursor-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` ถูกถือเป็นเนื้อหา Skills
    - `.cursor/rules/`, `.cursor/agents/`, และ `.cursor/hooks.json` เป็นแบบตรวจพบเท่านั้น

  </Accordion>
</AccordionGroup>

## ลำดับความสำคัญการตรวจพบ

OpenClaw ตรวจสอบรูปแบบ Plugin เนทีฟก่อน:

1. `openclaw.plugin.json` หรือ `package.json` ที่ถูกต้องพร้อม `openclaw.extensions` — ถือเป็น **Plugin เนทีฟ**
2. ตัวบ่งชี้บันเดิล (`.codex-plugin/`, `.claude-plugin/` หรือเลย์เอาต์ Claude/Cursor เริ่มต้น) — ถือเป็น **บันเดิล**

หากไดเรกทอรีมีทั้งสองแบบ OpenClaw จะใช้เส้นทางเนทีฟ วิธีนี้ป้องกันไม่ให้
แพ็กเกจสองรูปแบบถูกติดตั้งบางส่วนเป็นบันเดิล

## การพึ่งพารันไทม์และการล้างข้อมูล

- บันเดิลที่เข้ากันได้จากบุคคลที่สามจะไม่ได้รับการ repair ด้วย `npm install` ตอนเริ่มต้น บันเดิลเหล่านี้
  ควรติดตั้งผ่าน `openclaw plugins install` และจัดส่งทุกสิ่งที่ต้องใช้
  ไว้ในไดเรกทอรี Plugin ที่ติดตั้งแล้ว
- Plugin แบบบันเดิลที่แพ็กเกจโดย OpenClaw มีข้อยกเว้นแคบ ๆ: เมื่อเปิดใช้งานตัวใดตัวหนึ่ง
  การเริ่มต้น Gateway สามารถ repair การพึ่งพารันไทม์ที่ประกาศไว้แต่ขาดหาย
  ก่อน import ได้ ผู้ปฏิบัติการสามารถตรวจสอบหรือ repair ขั้นตอนนั้นด้วย
  `openclaw plugins deps`
- release pipeline ยังคงรับผิดชอบในการจัดส่ง payload การพึ่งพาแบบบันเดิลที่สมบูรณ์
  เมื่อทำได้ (ดู rule การตรวจสอบหลัง postpublish ใน
  [การเผยแพร่](/th/reference/RELEASING))

## ความปลอดภัย

บันเดิลมีขอบเขตความไว้วางใจที่แคบกว่า Plugin เนทีฟ:

- OpenClaw **ไม่** โหลดโมดูลรันไทม์ของบันเดิลใด ๆ เข้าโพรเซสโดยพลการ
- พาธ Skills และแพ็ก hook ต้องอยู่ภายในรูท Plugin (ตรวจสอบขอบเขตแล้ว)
- ไฟล์การตั้งค่าถูกอ่านด้วยการตรวจสอบขอบเขตแบบเดียวกัน
- เซิร์ฟเวอร์ MCP แบบ stdio ที่รองรับอาจถูกเรียกใช้เป็น subprocess

สิ่งนี้ทำให้บันเดิลปลอดภัยกว่าโดยค่าเริ่มต้น แต่คุณยังควรถือว่าบันเดิลจากบุคคลที่สาม
เป็นเนื้อหาที่เชื่อถือได้สำหรับฟีเจอร์ที่บันเดิลเหล่านั้นเปิดเผย

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ตรวจพบบันเดิลแล้วแต่ความสามารถไม่ทำงาน">
    รัน `openclaw plugins inspect <id>` หากมีความสามารถแสดงอยู่แต่ถูกระบุว่า
    ยังไม่ได้เชื่อมต่อ นั่นเป็นข้อจำกัดของผลิตภัณฑ์ ไม่ใช่การติดตั้งที่เสีย
  </Accordion>

  <Accordion title="ไฟล์คำสั่ง Claude ไม่ปรากฏ">
    ตรวจสอบให้แน่ใจว่าบันเดิลเปิดใช้งานอยู่ และไฟล์มาร์กดาวน์อยู่ภายในรูท
    `commands/` หรือ `skills/` ที่ตรวจพบ
  </Accordion>

  <Accordion title="การตั้งค่า Claude ไม่มีผล">
    รองรับเฉพาะการตั้งค่า Pi แบบฝังตัวจาก `settings.json` เท่านั้น OpenClaw
    ไม่ถือว่าการตั้งค่าของบันเดิลเป็นแพตช์คอนฟิกดิบ
  </Accordion>

  <Accordion title="hook ของ Claude ไม่ทำงาน">
    `hooks/hooks.json` เป็นแบบตรวจพบเท่านั้น หากคุณต้องการ hook ที่รันได้ ให้ใช้
    เลย์เอาต์แพ็ก hook ของ OpenClaw หรือจัดส่ง Plugin เนทีฟ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin)
- [สร้าง Plugin](/th/plugins/building-plugins) — สร้าง Plugin เนทีฟ
- [Plugin Manifest](/th/plugins/manifest) — สคีมา manifest เนทีฟ
