---
read_when:
    - การติดตั้งหรือกำหนดค่า acpx harness สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้งานสะพานเชื่อม MCP ของ plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ของ ACP
summary: 'การตั้งค่า Agent ACP: การกำหนดค่า acpx harness การตั้งค่า Plugin และสิทธิ์การใช้งาน'
title: Agent ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-04-25T13:59:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

สำหรับภาพรวม คู่มือปฏิบัติการของผู้ดูแลระบบ และแนวคิดต่างๆ ดูที่ [ACP agents](/th/tools/acp-agents)

ส่วนด้านล่างครอบคลุมการกำหนดค่า acpx harness การตั้งค่า Plugin สำหรับสะพานเชื่อม MCP และการกำหนดค่าสิทธิ์

## การรองรับ acpx harness (ปัจจุบัน)

ชื่อแทน harness แบบ built-in ของ acpx ในปัจจุบัน:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ให้ใช้ค่าเหล่านี้กับ `agentId` เป็นหลัก เว้นแต่การกำหนดค่า acpx ของคุณจะกำหนดชื่อแทน Agent แบบกำหนดเองไว้
หากการติดตั้ง Cursor ในเครื่องของคุณยังคงแสดง ACP เป็น `agent acp` ให้ override คำสั่ง Agent `cursor` ในการกำหนดค่า acpx ของคุณ แทนการเปลี่ยนค่าเริ่มต้นแบบ built-in

การใช้งาน acpx CLI โดยตรงยังสามารถกำหนดเป้าหมายอะแดปเตอร์ใดก็ได้ผ่าน `--agent <command>` แต่ช่องทางดิบนี้เป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

## การกำหนดค่าที่จำเป็น

ค่า baseline หลักของ ACP:

```json5
{
  acp: {
    enabled: true,
    // ไม่บังคับ ค่าเริ่มต้นคือ true; ตั้งเป็น false เพื่อหยุด ACP dispatch ชั่วคราวโดยยังคงให้ใช้ตัวควบคุม /acp ได้
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

การกำหนดค่า thread binding ขึ้นอยู่กับ channel adapter แต่ละตัว ตัวอย่างสำหรับ Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

หากการ spawn ACP แบบผูกกับ thread ไม่ทำงาน ให้ตรวจสอบ feature flag ของ adapter ก่อน:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

การ bind กับบทสนทนาปัจจุบันไม่ต้องสร้าง child thread แต่ต้องมีบริบทบทสนทนาที่กำลังใช้งานอยู่ และ channel adapter ต้องเปิดเผย ACP conversation bindings

ดู [Configuration Reference](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับแบ็กเอนด์ acpx

การติดตั้งใหม่จะเปิดใช้ Plugin runtime `acpx` ที่มาพร้อมกันไว้เป็นค่าเริ่มต้น ดังนั้น ACP
มักจะทำงานได้โดยไม่ต้องติดตั้ง Plugin ด้วยตนเอง

เริ่มจาก:

```text
/acp doctor
```

หากคุณปิดใช้งาน `acpx` ปฏิเสธผ่าน `plugins.allow` / `plugins.deny` หรือต้องการ
สลับไปใช้ checkout สำหรับการพัฒนาในเครื่อง ให้ใช้เส้นทาง Plugin แบบ explicit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้ง workspace ในเครื่องระหว่างการพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสถานะแบ็กเอนด์:

```text
/acp doctor
```

### การกำหนดค่าคำสั่งและเวอร์ชันของ acpx

โดยค่าเริ่มต้น Plugin `acpx` ที่มาพร้อมกันจะใช้ไบนารีแบบ pinned ที่อยู่ภายใน Plugin (`node_modules/.bin/acpx` ภายในแพ็กเกจ Plugin) ระหว่างเริ่มระบบจะลงทะเบียนแบ็กเอนด์เป็น not-ready และงานเบื้องหลังจะตรวจสอบ `acpx --version`; หากไม่พบไบนารีหรือเวอร์ชันไม่ตรงกัน ระบบจะรัน `npm install --omit=dev --no-save acpx@<pinned>` แล้วตรวจสอบอีกครั้ง Gateway จะยังคงไม่บล็อกตลอดกระบวนการนี้

override คำสั่งหรือเวอร์ชันได้ในการกำหนดค่า Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` รับพาธแบบ absolute, พาธแบบ relative (resolve จาก OpenClaw workspace) หรือชื่อคำสั่ง
- `expectedVersion: "any"` จะปิดการตรวจสอบความตรงกันของเวอร์ชันแบบเข้มงวด
- พาธ `command` แบบกำหนดเองจะปิดการติดตั้งอัตโนมัติภายใน Plugin

ดู [Plugins](/th/tools/plugin)

### การติดตั้ง dependency อัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบ global ด้วย `npm install -g openclaw` dependency ของ runtime acpx
(ไบนารีเฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติ
ผ่าน postinstall hook หากการติดตั้งอัตโนมัติล้มเหลว gateway จะยังคงเริ่มทำงานได้ตามปกติ
และรายงาน dependency ที่ขาดหายผ่าน `openclaw acp doctor`

### สะพานเชื่อม MCP ของ plugin tools

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ Plugin ของ OpenClaw ลงทะเบียนไว้ให้กับ
ACP harness

หากคุณต้องการให้ ACP agents เช่น Codex หรือ Claude Code สามารถเรียกใช้
เครื่องมือ Plugin ของ OpenClaw ที่ติดตั้งไว้ เช่น memory recall/store ให้เปิดใช้สะพานเชื่อมนี้โดยเฉพาะ:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- แทรก MCP server แบบ built-in ชื่อ `openclaw-plugin-tools` เข้าไปใน ACPX session
  bootstrap
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย Plugins ของ OpenClaw ที่ติดตั้งและเปิดใช้งานอยู่
- ทำให้ฟีเจอร์นี้เป็นแบบ explicit และปิดไว้เป็นค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความน่าเชื่อถือ:

- การทำเช่นนี้จะขยายพื้นผิวเครื่องมือของ ACP harness
- ACP agents จะเข้าถึงได้เฉพาะเครื่องมือ Plugin ที่ทำงานอยู่แล้วใน gateway
- ให้ถือว่านี่เป็นขอบเขตความน่าเชื่อถือเดียวกับการอนุญาตให้ Plugins เหล่านั้นทำงานใน
  OpenClaw เอง
- ตรวจสอบ Plugins ที่ติดตั้งไว้ก่อนเปิดใช้

`mcpServers` แบบกำหนดเองยังคงทำงานได้ตามเดิม สะพานเชื่อม plugin-tools แบบ built-in เป็น
ความสะดวกแบบเลือกเปิดเพิ่มเติม ไม่ใช่ตัวแทนของการกำหนดค่า MCP server ทั่วไป

### สะพานเชื่อม MCP ของ OpenClaw tools

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือ built-in ของ OpenClaw ผ่าน
MCP เช่นกัน เปิดใช้สะพานเชื่อม core-tools แยกต่างหากเมื่อ ACP agent ต้องการเครื่องมือ built-in
บางตัว เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- แทรก MCP server แบบ built-in ชื่อ `openclaw-tools` เข้าไปใน ACPX session
  bootstrap
- เปิดเผยเครื่องมือ built-in ของ OpenClaw บางรายการ ขณะนี้ server เริ่มต้นเปิดเผย `cron`
- ทำให้การเปิดเผย core-tool เป็นแบบ explicit และปิดไว้เป็นค่าเริ่มต้น

### การกำหนดค่า timeout ของ runtime

Plugin `acpx` ที่มาพร้อมกันจะตั้งค่า timeout ของ embedded runtime turns เป็น
120 วินาทีโดยค่าเริ่มต้น เพื่อให้ harness ที่ช้ากว่า เช่น Gemini CLI มีเวลาพอสำหรับ
การเริ่มต้นและการ initialize ของ ACP override ค่านี้ได้หากโฮสต์ของคุณต้องการ
ขีดจำกัด runtime ที่ต่างออกไป:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่านี้

### การกำหนดค่า Agent สำหรับ health probe

Plugin `acpx` ที่มาพร้อมกันจะ probe harness agent หนึ่งตัวขณะตัดสินว่า
แบ็กเอนด์ embedded runtime พร้อมหรือไม่ หากมีการตั้งค่า `acp.allowedAgents` ระบบจะใช้
Agent ตัวแรกที่อนุญาตเป็นค่าเริ่มต้น มิฉะนั้นจะใช้ `codex` หาก deployment ของคุณ
ต้องการ ACP agent ตัวอื่นสำหรับ health checks ให้ตั้งค่า probe agent โดยตรง:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบ non-interactive — ไม่มี TTY สำหรับอนุมัติหรือปฏิเสธ prompt ขอสิทธิ์การเขียนไฟล์และการรัน shell Plugin acpx มีคีย์การกำหนดค่า 2 ตัวที่ใช้ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ ACPX harness เหล่านี้แยกจากการอนุมัติ exec ของ OpenClaw และแยกจากแฟลก bypass ระดับผู้ให้บริการของแบ็กเอนด์ CLI เช่น Claude CLI `--permission-mode bypassPermissions` ค่า ACPX `approve-all` คือสวิตช์ break-glass ระดับ harness สำหรับเซสชัน ACP

### `permissionMode`

ควบคุมว่าการดำเนินการใดที่ harness agent สามารถทำได้โดยไม่ต้องมี prompt

| ค่า              | พฤติกรรม                                                    |
| ---------------- | ----------------------------------------------------------- |
| `approve-all`    | อนุมัติการเขียนไฟล์และคำสั่ง shell ทั้งหมดโดยอัตโนมัติ      |
| `approve-reads`  | อนุมัติการอ่านอัตโนมัติเท่านั้น; การเขียนและ exec ต้องมี prompt |
| `deny-all`       | ปฏิเสธ prompt ขอสิทธิ์ทั้งหมด                              |

### `nonInteractivePermissions`

ควบคุมสิ่งที่จะเกิดขึ้นเมื่อควรต้องแสดง prompt ขอสิทธิ์ แต่ไม่มี TTY แบบ interactive ให้ใช้ (ซึ่งเป็นกรณีเสมอสำหรับเซสชัน ACP)

| ค่า    | พฤติกรรม                                                            |
| ------ | ------------------------------------------------------------------- |
| `fail` | ยุติเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)**                  |
| `deny` | ปฏิเสธสิทธิ์นั้นแบบเงียบๆ และทำงานต่อไป (ลดระดับการทำงานอย่างนุ่มนวล) |

### การกำหนดค่า

ตั้งค่าผ่านการกำหนดค่า Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่าเหล่านี้

> **สำคัญ:** ปัจจุบัน OpenClaw ใช้ค่าเริ่มต้นเป็น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบ non-interactive การเขียนหรือ exec ใดๆ ที่ทำให้เกิด prompt ขอสิทธิ์อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`
>
> หากคุณต้องการจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับการทำงานอย่างนุ่มนวลแทนที่จะล้มทันที

## ที่เกี่ยวข้อง

- [ACP agents](/th/tools/acp-agents) — ภาพรวม คู่มือปฏิบัติการของผู้ดูแลระบบ และแนวคิด
- [Sub-agents](/th/tools/subagents)
- [Multi-agent routing](/th/concepts/multi-agent)
