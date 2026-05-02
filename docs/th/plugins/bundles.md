---
read_when:
    - คุณต้องการติดตั้งบันเดิลที่เข้ากันได้กับ Codex, Claude หรือ Cursor
    - คุณต้องเข้าใจว่า OpenClaw จับคู่เนื้อหาในบันเดิลกับฟีเจอร์เนทีฟอย่างไร
    - คุณกำลังแก้ไขปัญหาการตรวจจับบันเดิลหรือความสามารถที่ขาดหายไป
summary: ติดตั้งและใช้ชุด Codex, Claude และ Cursor เป็น Plugin ของ OpenClaw
title: ชุด Plugin
x-i18n:
    generated_at: "2026-05-02T10:22:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw สามารถติดตั้ง plugins จากระบบนิเวศภายนอกสามแบบ: **Codex**, **Claude**,
และ **Cursor** สิ่งเหล่านี้เรียกว่า **bundles** — แพ็กเนื้อหาและเมทาดาทาที่
OpenClaw แมปเป็นฟีเจอร์ดั้งเดิม เช่น Skills, hooks และเครื่องมือ MCP

<Info>
  Bundles **ไม่ใช่** สิ่งเดียวกับ native OpenClaw plugins native plugins ทำงาน
  ในโปรเซสเดียวกันและสามารถลงทะเบียนความสามารถใดก็ได้ Bundles เป็นแพ็กเนื้อหาที่มี
  การแมปฟีเจอร์แบบเลือกเฉพาะและขอบเขตความไว้วางใจที่แคบกว่า
</Info>

## เหตุผลที่มี bundles

plugins ที่มีประโยชน์จำนวนมากเผยแพร่ในรูปแบบ Codex, Claude หรือ Cursor แทนที่จะ
กำหนดให้ผู้เขียนเขียนใหม่เป็น native OpenClaw plugins, OpenClaw
ตรวจพบรูปแบบเหล่านี้และแมปเนื้อหาที่รองรับเข้าสู่ชุดฟีเจอร์ดั้งเดิม ซึ่งหมายความว่า
คุณสามารถติดตั้งแพ็กคำสั่ง Claude หรือ bundle Skills ของ Codex
และใช้งานได้ทันที

## ติดตั้ง bundle

<Steps>
  <Step title="ติดตั้งจากไดเรกทอรี อาร์ไคฟ์ หรือ marketplace">
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

    Bundles จะแสดงเป็น `Format: bundle` พร้อมชนิดย่อยเป็น `codex`, `claude` หรือ `cursor`

  </Step>

  <Step title="รีสตาร์ทและใช้งาน">
    ```bash
    openclaw gateway restart
    ```

    ฟีเจอร์ที่แมปแล้ว (Skills, hooks, เครื่องมือ MCP, ค่าเริ่มต้น LSP) จะพร้อมใช้งานในเซสชันถัดไป

  </Step>
</Steps>

## สิ่งที่ OpenClaw แมปจาก bundles

ไม่ใช่ทุกฟีเจอร์ของ bundle ที่ทำงานใน OpenClaw ได้ในวันนี้ นี่คือสิ่งที่ใช้งานได้และสิ่งที่
ตรวจพบแล้วแต่ยังไม่ได้เชื่อมต่อ

### รองรับแล้วตอนนี้

| ฟีเจอร์       | วิธีที่แมป                                                                                 | ใช้กับ     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| เนื้อหา Skills | ราก Skills ของ bundle โหลดเป็น OpenClaw Skills ปกติ                                           | ทุกรูปแบบ    |
| คำสั่ง      | `commands/` และ `.cursor/commands/` ถือเป็นราก Skills                                  | Claude, Cursor |
| แพ็ก hooks    | เลย์เอาต์แบบ OpenClaw `HOOK.md` + `handler.ts`                                             | Codex          |
| เครื่องมือ MCP     | การกำหนดค่า MCP ของ bundle ถูกรวมเข้ากับการตั้งค่า Pi แบบฝังตัว; โหลดเซิร์ฟเวอร์ stdio และ HTTP ที่รองรับ | ทุกรูปแบบ    |
| เซิร์ฟเวอร์ LSP   | Claude `.lsp.json` และ `lspServers` ที่ประกาศใน manifest ถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝังตัว  | Claude         |
| การตั้งค่า      | Claude `settings.json` ถูกนำเข้าเป็นค่าเริ่มต้น Pi แบบฝังตัว                                     | Claude         |

#### เนื้อหา Skills

- ราก Skills ของ bundle โหลดเป็นราก Skills ของ OpenClaw ปกติ
- ราก `commands` ของ Claude ถือเป็นราก Skills เพิ่มเติม
- ราก `.cursor/commands` ของ Cursor ถือเป็นราก Skills เพิ่มเติม

ซึ่งหมายความว่าไฟล์คำสั่ง markdown ของ Claude ทำงานผ่านตัวโหลด Skills ปกติของ OpenClaw
markdown คำสั่งของ Cursor ทำงานผ่านเส้นทางเดียวกัน

#### แพ็ก hooks

- ราก hook ของ bundle ทำงาน **เฉพาะ** เมื่อใช้เลย์เอาต์ hook-pack ปกติของ OpenClaw
  วันนี้กรณีนี้หลัก ๆ คือกรณีที่เข้ากันได้กับ Codex:
  - `HOOK.md`
  - `handler.ts` หรือ `handler.js`

#### MCP สำหรับ Pi

- bundles ที่เปิดใช้งานสามารถเพิ่มการกำหนดค่าเซิร์ฟเวอร์ MCP ได้
- OpenClaw รวมการกำหนดค่า MCP ของ bundle เข้ากับการตั้งค่า Pi แบบฝังตัวที่มีผลเป็น
  `mcpServers`
- OpenClaw เปิดเผยเครื่องมือ MCP ของ bundle ที่รองรับระหว่างเทิร์นของเอเจนต์ Pi แบบฝังตัวโดย
  เรียกใช้เซิร์ฟเวอร์ stdio หรือเชื่อมต่อกับเซิร์ฟเวอร์ HTTP
- โปรไฟล์เครื่องมือ `coding` และ `messaging` รวมเครื่องมือ MCP ของ bundle ตาม
  ค่าเริ่มต้น; ใช้ `tools.deny: ["bundle-mcp"]` เพื่อยกเลิกสำหรับเอเจนต์หรือ Gateway
- การตั้งค่า Pi เฉพาะโปรเจกต์ยังคงมีผลหลังค่าเริ่มต้นของ bundle ดังนั้นการตั้งค่า
  workspace สามารถแทนที่รายการ MCP ของ bundle ได้เมื่อจำเป็น
- แค็ตตาล็อกเครื่องมือ MCP ของ bundle ถูกจัดเรียงแบบกำหนดแน่นอนก่อนลงทะเบียน ดังนั้น
  การเปลี่ยนลำดับ `listTools()` จาก upstream จะไม่ทำให้บล็อกเครื่องมือของ prompt-cache สั่นไหว

##### Transports

เซิร์ฟเวอร์ MCP สามารถใช้ stdio หรือ HTTP transport:

**Stdio** เรียกใช้โปรเซสลูก:

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

- `transport` อาจตั้งเป็น `"streamable-http"` หรือ `"sse"`; เมื่อละไว้ OpenClaw ใช้ `sse`
- `type: "http"` เป็นรูปทรง downstream แบบ CLI-native; ใช้ `transport: "streamable-http"` ในการกำหนดค่า OpenClaw `openclaw mcp set` และ `openclaw doctor --fix` ทำให้ alias ทั่วไปเป็นมาตรฐาน
- อนุญาตเฉพาะ URL scheme `http:` และ `https:`
- ค่า `headers` รองรับการแทรก `${ENV_VAR}`
- รายการเซิร์ฟเวอร์ที่มีทั้ง `command` และ `url` จะถูกปฏิเสธ
- ข้อมูลรับรองใน URL (userinfo และ query params) จะถูกปกปิดจากคำอธิบายเครื่องมือ
  และ logs
- `connectionTimeoutMs` แทนที่เวลา timeout การเชื่อมต่อเริ่มต้น 30 วินาทีสำหรับ
  ทั้ง stdio และ HTTP transports

##### การตั้งชื่อเครื่องมือ

OpenClaw ลงทะเบียนเครื่องมือ MCP ของ bundle ด้วยชื่อที่ปลอดภัยสำหรับ provider ในรูปแบบ
`serverName__toolName` ตัวอย่างเช่น เซิร์ฟเวอร์ที่ใช้คีย์ `"vigil-harbor"` และเปิดเผย
เครื่องมือ `memory_search` จะลงทะเบียนเป็น `vigil-harbor__memory_search`

- อักขระนอก `A-Za-z0-9_-` จะถูกแทนที่ด้วย `-`
- คำนำหน้าเซิร์ฟเวอร์จำกัดที่ 30 อักขระ
- ชื่อเครื่องมือเต็มจำกัดที่ 64 อักขระ
- ชื่อเซิร์ฟเวอร์ว่างจะ fallback เป็น `mcp`
- ชื่อที่ sanitize แล้วชนกันจะถูกแยกความแตกต่างด้วย suffix ตัวเลข
- ลำดับเครื่องมือสุดท้ายที่เปิดเผยเป็นแบบกำหนดแน่นอนตามชื่อที่ปลอดภัย เพื่อให้เทิร์น Pi
  ที่ทำซ้ำมี cache-stable
- การกรองโปรไฟล์ถือว่าเครื่องมือทั้งหมดจากเซิร์ฟเวอร์ MCP ของ bundle หนึ่งเป็นของ plugin
  โดย `bundle-mcp` ดังนั้น allowlists และ deny lists ของโปรไฟล์สามารถรวมได้ทั้ง
  ชื่อเครื่องมือที่เปิดเผยรายตัวหรือคีย์ plugin `bundle-mcp`

#### การตั้งค่า Pi แบบฝังตัว

- Claude `settings.json` ถูกนำเข้าเป็นการตั้งค่า Pi แบบฝังตัวเริ่มต้นเมื่อ
  เปิดใช้งาน bundle
- OpenClaw sanitize คีย์ override ของ shell ก่อนนำไปใช้

คีย์ที่ sanitize:

- `shellPath`
- `shellCommandPrefix`

#### LSP ของ Pi แบบฝังตัว

- bundles ของ Claude ที่เปิดใช้งานสามารถเพิ่มการกำหนดค่าเซิร์ฟเวอร์ LSP ได้
- OpenClaw โหลด `.lsp.json` รวมถึง path `lspServers` ใด ๆ ที่ประกาศใน manifest
- การกำหนดค่า LSP ของ bundle ถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบฝังตัวที่มีผล
- วันนี้เรียกใช้ได้เฉพาะเซิร์ฟเวอร์ LSP ที่รองรับและมี stdio เป็น backing; transports
  ที่ไม่รองรับยังคงแสดงใน `openclaw plugins inspect <id>`

### ตรวจพบแต่ไม่ได้ดำเนินการ

สิ่งเหล่านี้ถูกรับรู้และแสดงใน diagnostics แต่ OpenClaw ไม่ได้เรียกใช้:

- Claude `agents`, automation `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- เมทาดาทา inline/app ของ Codex นอกเหนือจากการรายงานความสามารถ

## รูปแบบ Bundle

<AccordionGroup>
  <Accordion title="Codex bundles">
    ตัวบ่งชี้: `.codex-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundles ของ Codex เข้ากับ OpenClaw ได้ดีที่สุดเมื่อใช้ราก Skills และไดเรกทอรี
    hook-pack แบบ OpenClaw (`HOOK.md` + `handler.ts`)

  </Accordion>

  <Accordion title="Claude bundles">
    โหมดการตรวจพบสองแบบ:

    - **อิง manifest:** `.claude-plugin/plugin.json`
    - **ไม่มี manifest:** เลย์เอาต์ Claude เริ่มต้น (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    พฤติกรรมเฉพาะของ Claude:

    - `commands/` ถือเป็นเนื้อหา Skills
    - `settings.json` ถูกนำเข้าไปยังการตั้งค่า Pi แบบฝังตัว (คีย์ override ของ shell จะถูก sanitize)
    - `.mcp.json` เปิดเผยเครื่องมือ stdio ที่รองรับให้กับ Pi แบบฝังตัว
    - `.lsp.json` รวมถึง path `lspServers` ที่ประกาศใน manifest จะโหลดเข้าไปยังค่าเริ่มต้น LSP ของ Pi แบบฝังตัว
    - `hooks/hooks.json` ถูกตรวจพบแต่ไม่ได้ดำเนินการ
    - path คอมโพเนนต์กำหนดเองใน manifest เป็นแบบเพิ่มเข้าไป (ขยายค่าเริ่มต้น ไม่ใช่แทนที่)

  </Accordion>

  <Accordion title="Cursor bundles">
    ตัวบ่งชี้: `.cursor-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` ถือเป็นเนื้อหา Skills
    - `.cursor/rules/`, `.cursor/agents/`, และ `.cursor/hooks.json` เป็นแบบตรวจพบเท่านั้น

  </Accordion>
</AccordionGroup>

## ลำดับความสำคัญในการตรวจพบ

OpenClaw ตรวจสอบรูปแบบ native plugin ก่อน:

1. `openclaw.plugin.json` หรือ `package.json` ที่ถูกต้องพร้อม `openclaw.extensions` — ถือเป็น **native plugin**
2. ตัวบ่งชี้ bundle (`.codex-plugin/`, `.claude-plugin/` หรือเลย์เอาต์ Claude/Cursor เริ่มต้น) — ถือเป็น **bundle**

หากไดเรกทอรีมีทั้งสองแบบ OpenClaw จะใช้เส้นทาง native วิธีนี้ป้องกันไม่ให้
แพ็กเกจ dual-format ถูกติดตั้งบางส่วนเป็น bundles

## Runtime dependencies และการล้างข้อมูล

- bundles ที่เข้ากันได้จากภายนอกจะไม่ได้รับการซ่อมแซม `npm install` ตอนเริ่มต้น
  ควรติดตั้งผ่าน `openclaw plugins install` และจัดส่งทุกสิ่ง
  ที่ต้องใช้มาในไดเรกทอรี plugin ที่ติดตั้งแล้ว
- bundled plugins ที่ OpenClaw เป็นเจ้าของมีทั้งแบบ lightweight ที่จัดส่งใน core หรือ
  ดาวน์โหลดได้ผ่านตัวติดตั้ง plugin Gateway startup จะไม่เรียกใช้
  package manager สำหรับสิ่งเหล่านี้
- `openclaw doctor --fix` ลบไดเรกทอรี dependency แบบ staged เดิมและสามารถ
  ติดตั้ง plugins ที่ดาวน์โหลดได้ซึ่งกำหนดค่าไว้แต่หายไปจาก local
  plugin index

## ความปลอดภัย

Bundles มีขอบเขตความไว้วางใจแคบกว่า native plugins:

- OpenClaw **ไม่** โหลดโมดูล runtime ของ bundle ใด ๆ แบบ arbitrary เข้าในโปรเซส
- path ของ Skills และ hook-pack ต้องอยู่ภายในราก plugin (ตรวจขอบเขตแล้ว)
- ไฟล์การตั้งค่าถูกอ่านด้วยการตรวจขอบเขตเดียวกัน
- เซิร์ฟเวอร์ MCP แบบ stdio ที่รองรับอาจถูกเรียกใช้เป็น subprocesses

สิ่งนี้ทำให้ bundles ปลอดภัยกว่าโดยค่าเริ่มต้น แต่คุณยังควรมองว่า bundles
จากภายนอกเป็นเนื้อหาที่เชื่อถือได้สำหรับฟีเจอร์ที่สิ่งเหล่านั้นเปิดเผย

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ตรวจพบ bundle แล้วแต่ความสามารถไม่ทำงาน">
    เรียกใช้ `openclaw plugins inspect <id>` หากความสามารถอยู่ในรายการแต่ถูกทำเครื่องหมายว่า
    ยังไม่ได้เชื่อมต่อ นั่นเป็นข้อจำกัดของผลิตภัณฑ์ — ไม่ใช่การติดตั้งที่เสีย
  </Accordion>

  <Accordion title="ไฟล์คำสั่ง Claude ไม่ปรากฏ">
    ตรวจสอบให้แน่ใจว่า bundle เปิดใช้งานอยู่และไฟล์ markdown อยู่ภายในราก
    `commands/` หรือ `skills/` ที่ตรวจพบ
  </Accordion>

  <Accordion title="การตั้งค่า Claude ไม่ถูกนำไปใช้">
    รองรับเฉพาะการตั้งค่า Pi แบบฝังตัวจาก `settings.json` เท่านั้น OpenClaw ไม่ได้
    ถือว่าการตั้งค่า bundle เป็นแพตช์ config ดิบ
  </Accordion>

  <Accordion title="hooks ของ Claude ไม่ทำงาน">
    `hooks/hooks.json` เป็นแบบตรวจพบเท่านั้น หากคุณต้องการ hooks ที่เรียกใช้ได้ ให้ใช้
    เลย์เอาต์ hook-pack ของ OpenClaw หรือจัดส่ง native plugin
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugins](/th/tools/plugin)
- [สร้าง Plugins](/th/plugins/building-plugins) — สร้าง native plugin
- [Plugin Manifest](/th/plugins/manifest) — schema ของ native manifest
