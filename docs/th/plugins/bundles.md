---
read_when:
    - คุณต้องการติดตั้ง bundle ที่เข้ากันได้กับ Codex, Claude หรือ Cursor
    - คุณต้องการทำความเข้าใจว่า OpenClaw แมปเนื้อหาใน bundle ไปเป็นฟีเจอร์เนทีฟอย่างไร
    - คุณกำลังดีบักการตรวจจับ bundle หรือความสามารถที่หายไป
summary: ติดตั้งและใช้งาน bundle ของ Codex, Claude และ Cursor เป็น plugin ของ OpenClaw
title: Plugin Bundles
x-i18n:
    generated_at: "2026-04-23T10:20:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin Bundles

OpenClaw สามารถติดตั้ง plugin จาก 3 ecosystem ภายนอกได้: **Codex**, **Claude**
และ **Cursor** ซึ่งเรียกว่า **bundle** — แพ็กเนื้อหาและ metadata ที่
OpenClaw นำมาแมปเป็นฟีเจอร์เนทีฟ เช่น Skills, hook และ MCP tool

<Info>
  bundle **ไม่ใช่** native plugin ของ OpenClaw แบบเดียวกัน Native plugin จะทำงาน
  ในโปรเซสเดียวกันและสามารถลงทะเบียน capability ใดก็ได้ ส่วน bundle เป็นแพ็กเนื้อหา
  ที่มีการแมปฟีเจอร์แบบเลือกเฉพาะและมีขอบเขตความเชื่อถือที่แคบกว่า
</Info>

## เหตุผลที่มี bundle

มี plugin ที่มีประโยชน์จำนวนมากถูกเผยแพร่ในรูปแบบ Codex, Claude หรือ Cursor แทน
ที่จะบังคับให้ผู้เขียนเขียนใหม่เป็น native plugin ของ OpenClaw ทาง OpenClaw
จะตรวจจับฟอร์แมตเหล่านี้และแมปเนื้อหาที่รองรับไปยังชุดฟีเจอร์เนทีฟ ซึ่งหมายความว่าคุณสามารถติดตั้ง Claude command pack หรือ Codex skill bundle
แล้วใช้งานได้ทันที

## ติดตั้ง bundle

<Steps>
  <Step title="ติดตั้งจากไดเรกทอรี, archive หรือ marketplace">
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

    bundle จะแสดงเป็น `Format: bundle` พร้อม subtype เป็น `codex`, `claude` หรือ `cursor`

  </Step>

  <Step title="รีสตาร์ตและใช้งาน">
    ```bash
    openclaw gateway restart
    ```

    ฟีเจอร์ที่ถูกแมปแล้ว (Skills, hook, MCP tool, ค่าเริ่มต้นของ LSP) จะพร้อมใช้งานในเซสชันถัดไป

  </Step>
</Steps>

## สิ่งที่ OpenClaw แมปจาก bundle

ฟีเจอร์ทุกอย่างของ bundle ยังไม่สามารถทำงานใน OpenClaw ได้ในตอนนี้ ด้านล่างคือสิ่งที่ใช้ได้แล้วและสิ่งที่ตรวจจับได้แต่ยังไม่ได้เชื่อมการทำงาน

### รองรับแล้วในตอนนี้

| Feature       | วิธีการแมป                                                                                  | ใช้กับ         |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| เนื้อหา Skills | root ของ skill ใน bundle จะถูกโหลดเป็น Skills ของ OpenClaw ตามปกติ                        | ทุกรูปแบบ      |
| Commands      | `commands/` และ `.cursor/commands/` ถูกมองเป็น root ของ skill                              | Claude, Cursor |
| Hook pack     | เลย์เอาต์แบบ OpenClaw ของ `HOOK.md` + `handler.ts`                                         | Codex          |
| MCP tool      | คอนฟิก MCP ของ bundle จะถูกรวมเข้ากับการตั้งค่า Pi แบบ embedded; เซิร์ฟเวอร์ stdio และ HTTP ที่รองรับจะถูกโหลด | ทุกรูปแบบ      |
| LSP server    | `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศใน manifest จะถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบ embedded | Claude         |
| Settings      | `settings.json` ของ Claude จะถูกนำเข้าเป็นค่าเริ่มต้นของ Pi แบบ embedded                   | Claude         |

#### เนื้อหา Skills

- root ของ skill ใน bundle จะถูกโหลดเป็น root ของ Skills ของ OpenClaw ตามปกติ
- root `commands` ของ Claude จะถูกมองเป็น root ของ Skills เพิ่มเติม
- root `.cursor/commands` ของ Cursor จะถูกมองเป็น root ของ Skills เพิ่มเติม

ซึ่งหมายความว่าไฟล์ command markdown ของ Claude จะทำงานผ่านตัวโหลด Skills ปกติของ OpenClaw
ส่วน command markdown ของ Cursor ก็ทำงานผ่านเส้นทางเดียวกันนี้

#### Hook pack

- root ของ hook ใน bundle จะทำงานได้ **เฉพาะ** เมื่อใช้เลย์เอาต์ hook-pack
  แบบปกติของ OpenClaw ทุกวันนี้กรณีหลักคือแบบที่เข้ากันได้กับ Codex:
  - `HOOK.md`
  - `handler.ts` หรือ `handler.js`

#### MCP สำหรับ Pi

- bundle ที่เปิดใช้งานสามารถเพิ่มคอนฟิกเซิร์ฟเวอร์ MCP ได้
- OpenClaw จะรวมคอนฟิก MCP ของ bundle เข้ากับการตั้งค่า Pi แบบ embedded ที่มีผลจริงในชื่อ
  `mcpServers`
- OpenClaw จะแสดง MCP tool ของ bundle ที่รองรับระหว่างเทิร์นของเอเจนต์ Pi แบบ embedded โดย
  เริ่มเซิร์ฟเวอร์ stdio หรือเชื่อมต่อกับเซิร์ฟเวอร์ HTTP
- โปรไฟล์ tool `coding` และ `messaging` จะรวม MCP tool ของ bundle โดยค่าเริ่มต้น; ใช้ `tools.deny: ["bundle-mcp"]` เพื่อปิดสำหรับเอเจนต์หรือ Gateway
- การตั้งค่า Pi ระดับโปรเจกต์ยังคงถูกใช้หลังค่าเริ่มต้นจาก bundle ดังนั้นการตั้งค่าของ workspace จึงสามารถแทนที่รายการ MCP ของ bundle ได้เมื่อจำเป็น
- แค็ตตาล็อก MCP tool ของ bundle จะถูกจัดเรียงแบบกำหนดแน่นอนก่อนลงทะเบียน ดังนั้นการเปลี่ยนลำดับ `listTools()` จากต้นทางจะไม่ทำให้บล็อก tool ของ prompt-cache สั่นไหว

##### การขนส่ง

เซิร์ฟเวอร์ MCP สามารถใช้การขนส่งแบบ stdio หรือ HTTP:

**Stdio** จะเริ่ม child process:

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

**HTTP** จะเชื่อมต่อไปยังเซิร์ฟเวอร์ MCP ที่กำลังรันอยู่ผ่าน `sse` โดยค่าเริ่มต้น หรือ `streamable-http` เมื่อมีการขอใช้:

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

- `transport` สามารถตั้งเป็น `"streamable-http"` หรือ `"sse"`; หากไม่ตั้ง OpenClaw จะใช้ `sse`
- อนุญาตเฉพาะ URL scheme แบบ `http:` และ `https:`
- ค่าใน `headers` รองรับการแทรก `${ENV_VAR}`
- รายการเซิร์ฟเวอร์ที่มีทั้ง `command` และ `url` จะถูกปฏิเสธ
- credential ใน URL (userinfo และ query params) จะถูกปกปิดจากคำอธิบายของ tool
  และ log
- `connectionTimeoutMs` จะใช้แทน timeout เริ่มต้น 30 วินาทีสำหรับ
  ทั้งการขนส่งแบบ stdio และ HTTP

##### การตั้งชื่อ tool

OpenClaw จะลงทะเบียน MCP tool ของ bundle ด้วยชื่อที่ปลอดภัยต่อ provider ในรูปแบบ
`serverName__toolName` เช่น เซิร์ฟเวอร์ที่คีย์เป็น `"vigil-harbor"` และมี
tool `memory_search` จะถูกลงทะเบียนเป็น `vigil-harbor__memory_search`

- อักขระที่อยู่นอก `A-Za-z0-9_-` จะถูกแทนที่ด้วย `-`
- คำนำหน้าของเซิร์ฟเวอร์ถูกจำกัดที่ 30 อักขระ
- ชื่อ tool แบบเต็มถูกจำกัดที่ 64 อักขระ
- ชื่อเซิร์ฟเวอร์ที่ว่างจะ fallback เป็น `mcp`
- ชื่อที่ sanitize แล้วชนกันจะถูกแยกด้วย suffix ตัวเลข
- ลำดับสุดท้ายของ tool ที่แสดงจะเป็นแบบกำหนดแน่นอนตามชื่อที่ปลอดภัย เพื่อให้เทิร์นของ Pi ซ้ำ ๆ
  คงเสถียรต่อแคช
- การกรองโปรไฟล์จะถือว่า tool ทั้งหมดจากเซิร์ฟเวอร์ MCP ของ bundle หนึ่งตัวเป็นของ plugin
  ที่ชื่อ `bundle-mcp` ดังนั้น allowlist และ deny list ของโปรไฟล์สามารถรวมได้ทั้ง
  ชื่อ tool ที่เปิดเผยเป็นรายตัวหรือคีย์ plugin `bundle-mcp`

#### การตั้งค่า Pi แบบ embedded

- `settings.json` ของ Claude จะถูกนำเข้าเป็นค่าเริ่มต้นของการตั้งค่า Pi แบบ embedded เมื่อ
  bundle ถูกเปิดใช้งาน
- OpenClaw จะ sanitize คีย์ shell override ก่อนนำไปใช้

คีย์ที่ถูก sanitize:

- `shellPath`
- `shellCommandPrefix`

#### LSP ของ Pi แบบ embedded

- bundle Claude ที่เปิดใช้งานสามารถเพิ่มคอนฟิกเซิร์ฟเวอร์ LSP ได้
- OpenClaw จะโหลด `.lsp.json` รวมถึง path `lspServers` ที่ประกาศใน manifest
- คอนฟิก LSP ของ bundle จะถูกรวมเข้ากับค่าเริ่มต้น LSP ของ Pi แบบ embedded ที่มีผลจริง
- ปัจจุบันสามารถรันได้เฉพาะเซิร์ฟเวอร์ LSP แบบ stdio ที่รองรับ; การขนส่งที่ไม่รองรับ
  จะยังคงแสดงใน `openclaw plugins inspect <id>`

### ตรวจจับได้แต่ยังไม่รัน

สิ่งเหล่านี้ถูกจดจำและแสดงใน diagnostics แต่ OpenClaw ยังไม่รัน:

- `agents`, ระบบอัตโนมัติ `hooks.json`, `outputStyles` ของ Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` ของ Cursor
- metadata แบบ inline/app ของ Codex ที่เกินกว่าการรายงาน capability

## รูปแบบของ bundle

<AccordionGroup>
  <Accordion title="bundle ของ Codex">
    ตัวบ่งชี้: `.codex-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    bundle ของ Codex เหมาะกับ OpenClaw มากที่สุดเมื่อใช้ root ของ skill และ
    ไดเรกทอรี hook-pack แบบ OpenClaw (`HOOK.md` + `handler.ts`)

  </Accordion>

  <Accordion title="bundle ของ Claude">
    มีการตรวจจับ 2 โหมด:

    - **แบบอิง manifest:** `.claude-plugin/plugin.json`
    - **ไม่มี manifest:** เลย์เอาต์มาตรฐานของ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    พฤติกรรมเฉพาะของ Claude:

    - `commands/` ถูกมองเป็นเนื้อหา Skills
    - `settings.json` จะถูกนำเข้าไปยังการตั้งค่า Pi แบบ embedded (คีย์ shell override จะถูก sanitize)
    - `.mcp.json` จะแสดง stdio tool ที่รองรับไปยัง Pi แบบ embedded
    - `.lsp.json` รวมถึง path `lspServers` ที่ประกาศใน manifest จะถูกโหลดเข้าสู่ค่าเริ่มต้น LSP ของ Pi แบบ embedded
    - `hooks/hooks.json` ถูกตรวจจับได้แต่ไม่ถูกรัน
    - path ของ component แบบกำหนดเองใน manifest เป็นแบบ additive (ขยายค่าปกติ ไม่ใช่แทนที่)

  </Accordion>

  <Accordion title="bundle ของ Cursor">
    ตัวบ่งชี้: `.cursor-plugin/plugin.json`

    เนื้อหาเสริม: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` ถูกมองเป็นเนื้อหา Skills
    - `.cursor/rules/`, `.cursor/agents/` และ `.cursor/hooks.json` เป็นแบบตรวจจับอย่างเดียว

  </Accordion>
</AccordionGroup>

## ลำดับความสำคัญของการตรวจจับ

OpenClaw จะตรวจสอบฟอร์แมต native plugin ก่อน:

1. `openclaw.plugin.json` หรือ `package.json` ที่ถูกต้องพร้อม `openclaw.extensions` — จะถูกมองเป็น **native plugin**
2. ตัวบ่งชี้ของ bundle (`.codex-plugin/`, `.claude-plugin/` หรือเลย์เอาต์มาตรฐานของ Claude/Cursor) — จะถูกมองเป็น **bundle**

หากไดเรกทอรีหนึ่งมีทั้งสองแบบ OpenClaw จะใช้เส้นทางแบบ native เพื่อป้องกันไม่ให้
แพ็กเกจแบบสองฟอร์แมตถูกติดตั้งเป็น bundle เพียงบางส่วน

## dependency ของรันไทม์และการล้างข้อมูล

- dependency ของรันไทม์สำหรับ bundled plugin จะมาพร้อมในแพ็กเกจ OpenClaw ภายใต้
  `dist/*` OpenClaw จะ **ไม่** รัน `npm install` ตอนเริ่มต้นสำหรับ bundled
  plugin; ไปป์ไลน์ release เป็นผู้รับผิดชอบในการจัดส่ง payload ของ dependency แบบ bundled
  ให้ครบถ้วน (ดูข้อกำหนดการตรวจสอบหลังเผยแพร่ใน
  [การออก release](/th/reference/RELEASING))

## ความปลอดภัย

bundle มีขอบเขตความเชื่อถือที่แคบกว่า native plugin:

- OpenClaw จะ **ไม่** โหลดโมดูลรันไทม์ของ bundle แบบกำหนดเองโดยพลการในโปรเซส
- path ของ Skills และ hook-pack ต้องอยู่ภายใน root ของ plugin เท่านั้น (มีการตรวจสอบขอบเขต)
- ไฟล์การตั้งค่าจะถูกอ่านด้วยการตรวจสอบขอบเขตแบบเดียวกัน
- เซิร์ฟเวอร์ MCP แบบ stdio ที่รองรับอาจถูกเริ่มเป็น subprocess

สิ่งนี้ทำให้ bundle ปลอดภัยขึ้นโดยค่าเริ่มต้น แต่คุณก็ควรมอง bundle จาก third-party ว่าเป็นเนื้อหาที่เชื่อถือได้สำหรับฟีเจอร์ที่มันเปิดเผยอยู่ดี

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ตรวจพบบundle แล้วแต่ capability ไม่ทำงาน">
    รัน `openclaw plugins inspect <id>` หาก capability ถูกแสดงอยู่แต่ระบุว่ายัง
    ไม่ได้เชื่อมการทำงาน นั่นเป็นข้อจำกัดของผลิตภัณฑ์ — ไม่ใช่การติดตั้งเสีย
  </Accordion>

  <Accordion title="ไฟล์ command ของ Claude ไม่ปรากฏ">
    ตรวจสอบให้แน่ใจว่า bundle ถูกเปิดใช้งานแล้ว และไฟล์ markdown อยู่ภายใน
    root `commands/` หรือ `skills/` ที่ตรวจพบ
  </Accordion>

  <Accordion title="การตั้งค่า Claude ไม่ถูกนำไปใช้">
    รองรับเฉพาะการตั้งค่า Pi แบบ embedded จาก `settings.json` เท่านั้น OpenClaw จะ
    ไม่มองการตั้งค่าของ bundle เป็น patch คอนฟิกดิบ
  </Accordion>

  <Accordion title="hook ของ Claude ไม่ทำงาน">
    `hooks/hooks.json` เป็นแบบตรวจจับอย่างเดียว หากคุณต้องการ hook ที่รันได้ ให้ใช้
    เลย์เอาต์ hook-pack ของ OpenClaw หรือจัดส่งเป็น native plugin
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugins](/th/tools/plugin)
- [การสร้าง Plugins](/th/plugins/building-plugins) — สร้าง native plugin
- [Plugin Manifest](/th/plugins/manifest) — สคีมา manifest แบบเนทีฟ
