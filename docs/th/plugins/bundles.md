---
read_when:
    - คุณต้องการติดตั้ง bundle ที่เข้ากันได้กับ Codex, Claude หรือ Cursor
    - คุณต้องเข้าใจว่า OpenClaw แมปเนื้อหาในบันเดิลไปเป็นฟีเจอร์เนทีฟอย่างไร
    - คุณกำลังแก้ไขข้อบกพร่องเกี่ยวกับการตรวจจับบันเดิลหรือความสามารถที่ขาดหายไป
summary: ติดตั้งและใช้บันเดิล Codex, Claude และ Cursor เป็น Plugin ของ OpenClaw
title: ชุดรวม Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw สามารถติดตั้ง Plugin จากระบบนิเวศภายนอกได้สามแบบ: **Codex**, **Claude**,
และ **Cursor** สิ่งเหล่านี้เรียกว่า **บันเดิล** ซึ่งเป็นแพ็กเนื้อหาและเมทาดาทาที่
OpenClaw จับคู่เข้ากับฟีเจอร์เนทีฟ เช่น skills, hooks และเครื่องมือ MCP

<Info>
  บันเดิล **ไม่ใช่** สิ่งเดียวกับ Plugin เนทีฟของ OpenClaw Plugin เนทีฟทำงาน
  ในโปรเซสเดียวกันและสามารถลงทะเบียนความสามารถใดก็ได้ ส่วนบันเดิลเป็นแพ็กเนื้อหาที่มี
  การจับคู่ฟีเจอร์แบบเลือกเฉพาะและขอบเขตความเชื่อถือที่แคบกว่า
</Info>

## เหตุผลที่มีบันเดิล

Plugin ที่มีประโยชน์จำนวนมากเผยแพร่ในรูปแบบ Codex, Claude หรือ Cursor แทนที่
จะบังคับให้ผู้เขียนเขียนใหม่เป็น Plugin เนทีฟของ OpenClaw OpenClaw จะตรวจจับ
รูปแบบเหล่านี้และจับคู่เนื้อหาที่รองรับเข้ากับชุดฟีเจอร์เนทีฟ ซึ่งหมายความว่าคุณสามารถ
ติดตั้งแพ็กคำสั่ง Claude หรือบันเดิล skill ของ Codex แล้วใช้งานได้ทันที

## ติดตั้งบันเดิล

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
    ```bash
    # ไดเรกทอรีภายในเครื่อง
    openclaw plugins install ./my-bundle

    # ไฟล์เก็บถาวร
    openclaw plugins install ./my-bundle.tgz

    # ตลาด Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    บันเดิลจะแสดงเป็น `Format: bundle` พร้อมประเภทย่อยเป็น `codex`, `claude` หรือ `cursor`

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    ฟีเจอร์ที่ถูกจับคู่ (skills, hooks, เครื่องมือ MCP, ค่าเริ่มต้น LSP) จะพร้อมใช้งานในเซสชันถัดไป

  </Step>
</Steps>

## สิ่งที่ OpenClaw จับคู่จากบันเดิล

ไม่ใช่ทุกฟีเจอร์ของบันเดิลจะทำงานใน OpenClaw ได้ในวันนี้ ด้านล่างคือสิ่งที่ใช้งานได้และสิ่งที่
ตรวจพบแล้วแต่ยังไม่ได้เชื่อมต่อ

### รองรับแล้วในตอนนี้

| ฟีเจอร์       | วิธีที่จับคู่                                                                                 | ใช้กับ     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| เนื้อหา Skill | รูท skill ของบันเดิลโหลดเป็น skills ปกติของ OpenClaw                                           | ทุกรูปแบบ    |
| คำสั่ง      | `commands/` และ `.cursor/commands/` ถูกถือเป็นรูท skill                                  | Claude, Cursor |
| แพ็ก Hook    | เลย์เอาต์แบบ OpenClaw `HOOK.md` + `handler.ts`                                             | Codex          |
| เครื่องมือ MCP     | คอนฟิก MCP ของบันเดิลถูกรวมเข้ากับการตั้งค่า Pi แบบฝัง; โหลดเซิร์ฟเวอร์ stdio และ HTTP ที่รองรับ | ทุกรูปแบบ    |
| เซิร์ฟเวอร์ LSP   | `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศใน manifest ถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝัง  | Claude         |
| การตั้งค่า      | `settings.json` ของ Claude ถูกนำเข้าเป็นค่าเริ่มต้นของ Pi แบบฝัง                                     | Claude         |

#### เนื้อหา Skill

- รูท skill ของบันเดิลโหลดเป็นรูท skill ปกติของ OpenClaw
- รูท `commands` ของ Claude ถูกถือเป็นรูท skill เพิ่มเติม
- รูท `.cursor/commands` ของ Cursor ถูกถือเป็นรูท skill เพิ่มเติม

ซึ่งหมายความว่าไฟล์คำสั่ง markdown ของ Claude ทำงานผ่านตัวโหลด skill ปกติของ OpenClaw
markdown คำสั่งของ Cursor ทำงานผ่านเส้นทางเดียวกัน

#### แพ็ก Hook

- รูท hook ของบันเดิลทำงานได้ **เฉพาะ** เมื่อใช้เลย์เอาต์ hook-pack ปกติของ OpenClaw
  ปัจจุบันกรณีนี้คือแบบที่เข้ากันได้กับ Codex เป็นหลัก:
  - `HOOK.md`
  - `handler.ts` หรือ `handler.js`

#### MCP สำหรับ Pi

- บันเดิลที่เปิดใช้งานสามารถส่งคอนฟิกเซิร์ฟเวอร์ MCP เพิ่มได้
- OpenClaw รวมคอนฟิก MCP ของบันเดิลเข้ากับการตั้งค่า Pi แบบฝังที่มีผลจริงในชื่อ
  `mcpServers`
- OpenClaw เปิดเผยเครื่องมือ MCP ของบันเดิลที่รองรับระหว่างเทิร์นของเอเจนต์ Pi แบบฝัง โดย
  เปิดเซิร์ฟเวอร์ stdio หรือเชื่อมต่อกับเซิร์ฟเวอร์ HTTP
- โปรไฟล์เครื่องมือ `coding` และ `messaging` รวมเครื่องมือ MCP ของบันเดิลโดย
  ค่าเริ่มต้น; ใช้ `tools.deny: ["bundle-mcp"]` เพื่อเลือกไม่ใช้สำหรับเอเจนต์หรือ gateway
- การตั้งค่า Pi ภายในโปรเจกต์ยังคงมีผลหลังค่าเริ่มต้นของบันเดิล ดังนั้นการตั้งค่า
  workspace สามารถแทนที่รายการ MCP ของบันเดิลได้เมื่อจำเป็น
- แค็ตตาล็อกเครื่องมือ MCP ของบันเดิลถูกเรียงอย่างกำหนดแน่นอนก่อนการลงทะเบียน ดังนั้น
  การเปลี่ยนลำดับ `listTools()` จากต้นทางจะไม่ทำให้บล็อกเครื่องมือของ prompt-cache เปลี่ยนไปมา

##### การขนส่ง

เซิร์ฟเวอร์ MCP สามารถใช้ stdio หรือการขนส่ง HTTP:

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

**HTTP** เชื่อมต่อกับเซิร์ฟเวอร์ MCP ที่กำลังทำงานผ่าน `sse` โดยค่าเริ่มต้น หรือ `streamable-http` เมื่อต้องการ:

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
- `type: "http"` เป็นรูปแบบปลายทางแบบ CLI-native; ใช้ `transport: "streamable-http"` ในคอนฟิก OpenClaw `openclaw mcp set` และ `openclaw doctor --fix` จะปรับ alias ทั่วไปให้เป็นมาตรฐาน
- อนุญาตเฉพาะ URL scheme `http:` และ `https:`
- ค่า `headers` รองรับการแทนค่า `${ENV_VAR}`
- รายการเซิร์ฟเวอร์ที่มีทั้ง `command` และ `url` จะถูกปฏิเสธ
- ข้อมูลรับรองใน URL (userinfo และ query params) จะถูกปกปิดจากคำอธิบายเครื่องมือ
  และบันทึก
- `connectionTimeoutMs` แทนที่ค่า timeout การเชื่อมต่อเริ่มต้น 30 วินาทีสำหรับ
  การขนส่งทั้ง stdio และ HTTP

##### การตั้งชื่อเครื่องมือ

OpenClaw ลงทะเบียนเครื่องมือ MCP ของบันเดิลด้วยชื่อที่ปลอดภัยสำหรับ provider ในรูปแบบ
`serverName__toolName` ตัวอย่างเช่น เซิร์ฟเวอร์ที่ใช้คีย์ `"vigil-harbor"` และเปิดเผยเครื่องมือ
`memory_search` จะลงทะเบียนเป็น `vigil-harbor__memory_search`

- อักขระนอก `A-Za-z0-9_-` จะถูกแทนที่ด้วย `-`
- คำนำหน้าเซิร์ฟเวอร์จำกัดไว้ที่ 30 อักขระ
- ชื่อเครื่องมือเต็มจำกัดไว้ที่ 64 อักขระ
- ชื่อเซิร์ฟเวอร์ว่างจะ fallback เป็น `mcp`
- ชื่อที่ผ่านการ sanitize แล้วซ้ำกันจะถูกแยกความแตกต่างด้วย suffix ตัวเลข
- ลำดับเครื่องมือที่เปิดเผยสุดท้ายกำหนดแน่นอนตามชื่อปลอดภัย เพื่อให้เทิร์น Pi ซ้ำๆ
  มีแคชที่เสถียร
- การกรองโปรไฟล์ถือว่าเครื่องมือทั้งหมดจากเซิร์ฟเวอร์ MCP ของบันเดิลเดียวเป็นของ plugin
  โดย `bundle-mcp` ดังนั้น allowlists และ deny lists ของโปรไฟล์สามารถรวมได้ทั้ง
  ชื่อเครื่องมือที่เปิดเผยรายตัวหรือคีย์ Plugin `bundle-mcp`

#### การตั้งค่า Pi แบบฝัง

- `settings.json` ของ Claude ถูกนำเข้าเป็นการตั้งค่า Pi แบบฝังเริ่มต้นเมื่อ
  เปิดใช้งานบันเดิล
- OpenClaw sanitize คีย์ shell override ก่อนนำไปใช้

คีย์ที่ถูก sanitize:

- `shellPath`
- `shellCommandPrefix`

#### LSP ของ Pi แบบฝัง

- บันเดิล Claude ที่เปิดใช้งานสามารถส่งคอนฟิกเซิร์ฟเวอร์ LSP เพิ่มได้
- OpenClaw โหลด `.lsp.json` รวมถึงพาธ `lspServers` ที่ประกาศใน manifest
- คอนฟิก LSP ของบันเดิลถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝังที่มีผลจริง
- ปัจจุบันรันได้เฉพาะเซิร์ฟเวอร์ LSP แบบ stdio-backed ที่รองรับ; การขนส่งที่ไม่รองรับ
  ยังแสดงใน `openclaw plugins inspect <id>`

### ตรวจพบแล้วแต่ไม่ถูกเรียกใช้งาน

รายการเหล่านี้ถูกรู้จักและแสดงในการวินิจฉัย แต่ OpenClaw ไม่ได้รัน:

- `agents`, อัตโนมัติ `hooks.json`, `outputStyles` ของ Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` ของ Cursor
- เมทาดาทา inline/app ของ Codex นอกเหนือจากการรายงานความสามารถ

## รูปแบบบันเดิล

<AccordionGroup>
  <Accordion title="Codex bundles">
    ตัวบ่งชี้: `.codex-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    บันเดิล Codex เข้ากับ OpenClaw ได้ดีที่สุดเมื่อใช้รูท skill และไดเรกทอรี
    hook-pack แบบ OpenClaw (`HOOK.md` + `handler.ts`)

  </Accordion>

  <Accordion title="Claude bundles">
    โหมดการตรวจจับสองแบบ:

    - **อิง Manifest:** `.claude-plugin/plugin.json`
    - **ไม่มี Manifest:** เลย์เอาต์ Claude เริ่มต้น (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    พฤติกรรมเฉพาะของ Claude:

    - `commands/` ถูกถือเป็นเนื้อหา skill
    - `settings.json` ถูกนำเข้าไปในการตั้งค่า Pi แบบฝัง (คีย์ shell override จะถูก sanitize)
    - `.mcp.json` เปิดเผยเครื่องมือ stdio ที่รองรับไปยัง Pi แบบฝัง
    - `.lsp.json` รวมถึงพาธ `lspServers` ที่ประกาศใน manifest โหลดเข้าเป็นค่าเริ่มต้น LSP ของ Pi แบบฝัง
    - `hooks/hooks.json` ถูกตรวจพบแต่ไม่ถูกเรียกใช้งาน
    - พาธคอมโพเนนต์แบบกำหนดเองใน manifest เป็นแบบเพิ่มเข้าไป (ขยายค่าเริ่มต้น ไม่ใช่แทนที่)

  </Accordion>

  <Accordion title="Cursor bundles">
    ตัวบ่งชี้: `.cursor-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` ถูกถือเป็นเนื้อหา skill
    - `.cursor/rules/`, `.cursor/agents/`, และ `.cursor/hooks.json` เป็นแบบตรวจพบเท่านั้น

  </Accordion>
</AccordionGroup>

## ลำดับความสำคัญในการตรวจจับ

OpenClaw ตรวจสอบรูปแบบ Plugin เนทีฟก่อน:

1. `openclaw.plugin.json` หรือ `package.json` ที่ถูกต้องพร้อม `openclaw.extensions` — ถือเป็น **Plugin เนทีฟ**
2. ตัวบ่งชี้บันเดิล (`.codex-plugin/`, `.claude-plugin/`, หรือเลย์เอาต์ Claude/Cursor เริ่มต้น) — ถือเป็น **บันเดิล**

หากไดเรกทอรีมีทั้งสองอย่าง OpenClaw จะใช้เส้นทางเนทีฟ วิธีนี้ป้องกันไม่ให้
แพ็กเกจสองรูปแบบถูกติดตั้งเป็นบันเดิลเพียงบางส่วน

## การพึ่งพารันไทม์และการล้างข้อมูล

- บันเดิลที่เข้ากันได้จากบุคคลที่สามจะไม่ได้รับการซ่อมแซม `npm install` ตอนเริ่มต้น
  ควรติดตั้งผ่าน `openclaw plugins install` และจัดส่งทุกอย่างที่จำเป็น
  ภายในไดเรกทอรี Plugin ที่ติดตั้งแล้ว
- Plugin แบบบันเดิลที่ OpenClaw เป็นเจ้าของจะถูกจัดส่งแบบเบาใน core หรือ
  ดาวน์โหลดผ่านตัวติดตั้ง Plugin การเริ่มต้น Gateway จะไม่รัน
  package manager ให้รายการเหล่านั้น
- `openclaw doctor --fix` ลบไดเรกทอรี dependency ที่ stage ไว้แบบเดิม และสามารถ
  กู้คืน Plugin ที่ดาวน์โหลดได้ซึ่งหายไปจากดัชนี Plugin ภายในเครื่องเมื่อ
  คอนฟิกอ้างถึงรายการเหล่านั้น

## ความปลอดภัย

บันเดิลมีขอบเขตความเชื่อถือที่แคบกว่า Plugin เนทีฟ:

- OpenClaw **ไม่** โหลดโมดูลรันไทม์ของบันเดิลตามอำเภอใจเข้าในโปรเซส
- พาธ Skills และ hook-pack ต้องอยู่ภายในรูท Plugin (ตรวจสอบขอบเขตแล้ว)
- ไฟล์การตั้งค่าถูกอ่านด้วยการตรวจสอบขอบเขตแบบเดียวกัน
- เซิร์ฟเวอร์ stdio MCP ที่รองรับอาจถูกเปิดเป็น subprocesses

สิ่งนี้ทำให้บันเดิลปลอดภัยกว่าโดยค่าเริ่มต้น แต่คุณยังควรถือว่าบันเดิลจากบุคคลที่สาม
เป็นเนื้อหาที่เชื่อถือได้สำหรับฟีเจอร์ที่มันเปิดเผย

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    รัน `openclaw plugins inspect <id>` หากความสามารถถูกระบุไว้แต่ทำเครื่องหมายว่า
    ยังไม่ได้เชื่อมต่อ นั่นเป็นข้อจำกัดของผลิตภัณฑ์ ไม่ใช่การติดตั้งที่เสีย
  </Accordion>

  <Accordion title="Claude command files do not appear">
    ตรวจสอบให้แน่ใจว่าบันเดิลเปิดใช้งานแล้วและไฟล์ markdown อยู่ภายในรูท
    `commands/` หรือ `skills/` ที่ตรวจพบ
  </Accordion>

  <Accordion title="Claude settings do not apply">
    รองรับเฉพาะการตั้งค่า Pi แบบฝังจาก `settings.json` เท่านั้น OpenClaw ไม่ได้
    ถือว่าการตั้งค่าบันเดิลเป็น raw config patches
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` เป็นแบบตรวจพบเท่านั้น หากคุณต้องการ hooks ที่รันได้ ให้ใช้
    เลย์เอาต์ hook-pack ของ OpenClaw หรือจัดส่ง Plugin เนทีฟ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugins](/th/tools/plugin)
- [การสร้าง Plugins](/th/plugins/building-plugins) — สร้าง Plugin เนทีฟ
- [Plugin Manifest](/th/plugins/manifest) — สคีมา manifest เนทีฟ
