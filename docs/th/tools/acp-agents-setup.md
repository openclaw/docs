---
read_when:
    - การติดตั้งหรือกำหนดค่า acpx harness สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้ MCP bridge ของ plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ของ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: config ของ acpx harness, การตั้งค่า Plugin, สิทธิ์การใช้งาน'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-04-26T11:42:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

สำหรับภาพรวม คู่มือปฏิบัติการสำหรับผู้ดูแล และแนวคิดต่าง ๆ ดู [เอเจนต์ ACP](/th/tools/acp-agents)

หัวข้อด้านล่างครอบคลุม config ของ acpx harness การตั้งค่า Plugin สำหรับ MCP bridge และการกำหนดค่าสิทธิ์

ใช้หน้านี้เฉพาะเมื่อคุณกำลังตั้งค่าเส้นทาง ACP/acpx สำหรับ config รันไทม์
app-server ของ Codex แบบ native ให้ใช้ [Codex harness](/th/plugins/codex-harness) สำหรับ
OpenAI API key หรือ config ผู้ให้บริการโมเดลแบบ Codex OAuth ให้ใช้
[OpenAI](/th/providers/openai)

Codex มี 2 เส้นทางใน OpenClaw:

| เส้นทาง                      | Config/คำสั่ง                                         | หน้าการตั้งค่า                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native Codex app-server    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/th/plugins/codex-harness) |
| Explicit Codex ACP adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | หน้านี้                               |

ควรใช้เส้นทาง native เว้นแต่คุณต้องการพฤติกรรม ACP/acpx โดยชัดเจน

## การรองรับ acpx harness (ปัจจุบัน)

alias ของ harness แบบ built-in ใน acpx ปัจจุบัน:

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

เมื่อ OpenClaw ใช้ backend ของ acpx ควรใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่ config acpx ของคุณจะกำหนด alias ของเอเจนต์แบบกำหนดเองไว้
หากการติดตั้ง Cursor ในเครื่องของคุณยังคงเปิดเผย ACP เป็น `agent acp` ให้ override คำสั่งเอเจนต์ `cursor` ใน config acpx ของคุณแทนการเปลี่ยนค่าเริ่มต้นแบบ built-in

การใช้งาน acpx CLI โดยตรงยังสามารถกำหนดเป้าหมาย adapter แบบใดก็ได้ผ่าน `--agent <command>` แต่ช่องทางดิบนี้เป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

การควบคุมโมเดลขึ้นอยู่กับความสามารถของ adapter Codex ACP model ref จะถูก
normalize โดย OpenClaw ก่อนเริ่มต้น harness อื่นต้องการ ACP `models` พร้อม
การรองรับ `session/set_model`; หาก harness ไม่เปิดเผยทั้งความสามารถ ACP ดังกล่าว
และไม่ได้มีแฟล็กโมเดลตอนเริ่มต้นของตัวเอง OpenClaw/acpx ก็จะไม่สามารถบังคับการเลือกโมเดลได้

## Config ที่จำเป็น

baseline หลักของ ACP:

```json5
{
  acp: {
    enabled: true,
    // ไม่บังคับ ค่าเริ่มต้นคือ true; ตั้งเป็น false เพื่อหยุด ACP dispatch ชั่วคราวโดยยังคงการควบคุม /acp ไว้
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

config ของการผูกเธรดจะขึ้นอยู่กับ channel adapter ตัวอย่างสำหรับ Discord:

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

หากการ spawn ACP แบบผูกกับเธรดไม่ทำงาน ให้ตรวจสอบแฟล็กฟีเจอร์ของ adapter ก่อน:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

การผูกกับบทสนทนาปัจจุบันไม่ต้องสร้าง child thread แต่ต้องมีบริบทการสนทนาที่กำลังใช้งานอยู่ และมี channel adapter ที่เปิดเผย ACP conversation bindings

ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับ backend ของ acpx

การติดตั้งใหม่จะเปิดใช้ Plugin รันไทม์ `acpx` ที่บันเดิลมาไว้เป็นค่าเริ่มต้น ดังนั้น ACP
จึงมักทำงานได้โดยไม่ต้องติดตั้ง Plugin ด้วยตนเอง

เริ่มต้นด้วย:

```text
/acp doctor
```

หากคุณปิดใช้งาน `acpx` ปฏิเสธมันผ่าน `plugins.allow` / `plugins.deny` หรือ
ต้องการสลับไปใช้ checkout สำหรับการพัฒนาในเครื่อง ให้ใช้เส้นทาง Plugin แบบชัดเจน:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้ง workspace ในเครื่องระหว่างการพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสถานะ backend:

```text
/acp doctor
```

### การกำหนดค่าคำสั่งและเวอร์ชันของ acpx

ตามค่าเริ่มต้น Plugin `acpx` ที่บันเดิลมาจะลงทะเบียน backend ACP แบบฝังไว้โดยไม่
spawn เอเจนต์ ACP ระหว่างการเริ่มต้น Gateway ให้รัน `/acp doctor` เพื่อทำ live probe แบบชัดเจน ตั้งค่า `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` เฉพาะเมื่อคุณต้องการให้
Gateway probe เอเจนต์ที่กำหนดค่าไว้ตอนเริ่มต้นระบบ

override คำสั่งหรือเวอร์ชันได้ใน config ของ Plugin:

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

- `command` รับพาธแบบ absolute พาธแบบ relative (resolve จาก workspace ของ OpenClaw) หรือชื่อคำสั่ง
- `expectedVersion: "any"` จะปิดการจับคู่เวอร์ชันแบบเข้มงวด
- พาธ `command` แบบกำหนดเองจะปิดการติดตั้งอัตโนมัติระดับ local ของ Plugin

ดู [Plugins](/th/tools/plugin)

### การติดตั้ง dependency อัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบ global ด้วย `npm install -g openclaw`, dependency
รันไทม์ของ acpx (binary เฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติ
ผ่าน hook ของ postinstall หากการติดตั้งอัตโนมัติล้มเหลว gateway จะยังคงเริ่มทำงานได้ตามปกติ
และรายงาน dependency ที่ขาดผ่าน `openclaw acp doctor`

### MCP bridge สำหรับ Plugin tools

ตามค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดย Plugin ของ OpenClaw ให้กับ
ACP harness

หากคุณต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้
เครื่องมือ Plugin ของ OpenClaw ที่ติดตั้งแล้ว เช่น memory recall/store ให้เปิดใช้ bridge เฉพาะนี้:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่ทำ:

- inject MCP server แบบ built-in ชื่อ `openclaw-plugin-tools` เข้าไปใน bootstrap ของเซสชัน ACPX
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย Plugin ของ OpenClaw ที่ติดตั้งและเปิดใช้งานอยู่
- ทำให้ฟีเจอร์นี้เป็นแบบชัดเจนและปิดไว้เป็นค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความเชื่อถือ:

- สิ่งนี้ขยายพื้นผิวเครื่องมือของ ACP harness
- เอเจนต์ ACP จะเข้าถึงได้เฉพาะเครื่องมือ Plugin ที่ทำงานอยู่แล้วใน gateway
- ให้ถือว่านี่เป็นขอบเขตความเชื่อถือเดียวกับการอนุญาตให้ Plugin เหล่านั้นทำงานใน
  OpenClaw เอง
- ตรวจทาน Plugin ที่ติดตั้งไว้ก่อนเปิดใช้

`mcpServers` แบบกำหนดเองยังคงทำงานได้เหมือนเดิม bridge แบบ built-in สำหรับ plugin-tools เป็น
เพียงตัวเลือกอำนวยความสะดวกเพิ่มเติม ไม่ใช่สิ่งทดแทน config ของ MCP server ทั่วไป

### MCP bridge สำหรับ OpenClaw tools

ตามค่าเริ่มต้น เซสชัน ACPX ก็ **ไม่** เปิดเผยเครื่องมือ built-in ของ OpenClaw ผ่าน
MCP เช่นกัน ให้เปิดใช้ bridge แยกสำหรับเครื่องมือแกนระบบเมื่อเอเจนต์ ACP ต้องการ
เครื่องมือ built-in บางตัว เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่ทำ:

- inject MCP server แบบ built-in ชื่อ `openclaw-tools` เข้าไปใน bootstrap ของเซสชัน ACPX
- เปิดเผยเครื่องมือ built-in ที่เลือกไว้ของ OpenClaw โดย server แรกเริ่มจะเปิดเผย `cron`
- ทำให้การเปิดเผยเครื่องมือแกนระบบเป็นแบบชัดเจนและปิดไว้เป็นค่าเริ่มต้น

### การกำหนดค่า timeout ของรันไทม์

Plugin `acpx` ที่บันเดิลมาจะตั้ง timeout ของ turn สำหรับรันไทม์แบบฝังไว้เป็น 120 วินาที
โดยค่าเริ่มต้น เพื่อให้ harness ที่ช้ากว่า เช่น Gemini CLI มีเวลาพอในการทำ ACP startup และ initialization ให้เสร็จ override ค่าได้หากโฮสต์ของคุณต้องการ
ขีดจำกัดรันไทม์ที่ต่างออกไป:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่านี้

### การกำหนดค่าเอเจนต์สำหรับ health probe

เมื่อ `/acp doctor` หรือ startup probe ที่เลือกเปิดใช้ตรวจสอบ backend นั้น Plugin
`acpx` ที่บันเดิลมาจะ probe เอเจนต์ harness หนึ่งตัว หากตั้งค่า `acp.allowedAgents` ไว้ ก็จะใช้
เอเจนต์ตัวแรกที่อนุญาตเป็นค่าเริ่มต้น; มิฉะนั้นจะใช้ `codex` เป็นค่าเริ่มต้น หาก deployment ของคุณต้องการเอเจนต์ ACP ตัวอื่นสำหรับ health check ให้ตั้งค่า probe agent อย่างชัดเจน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบไม่โต้ตอบ — ไม่มี TTY สำหรับอนุมัติหรือปฏิเสธพรอมป์ต์สิทธิ์การเขียนไฟล์และการเรียก shell-exec Plugin acpx มีคีย์ config สองตัวที่ควบคุมวิธีจัดการสิทธิ์เหล่านี้:

สิทธิ์ของ ACPX harness เหล่านี้แยกจาก exec approvals ของ OpenClaw และแยกจากแฟล็ก bypass ของผู้จำหน่าย backend แบบ CLI เช่น Claude CLI `--permission-mode bypassPermissions` ACPX `approve-all` คือสวิตช์ฉุกเฉินระดับ harness สำหรับเซสชัน ACP

### `permissionMode`

ควบคุมว่าฮาร์เนสเอเจนต์สามารถทำงานใดได้โดยไม่ต้องมีพรอมป์ต์

| Value           | พฤติกรรม                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่งเชลล์ทั้งหมดโดยอัตโนมัติ          |
| `approve-reads` | อนุมัติการอ่านอัตโนมัติเท่านั้น; การเขียนและ exec ต้องมีพรอมป์ต์ |
| `deny-all`      | ปฏิเสธพรอมป์ต์สิทธิ์ทั้งหมด                              |

### `nonInteractivePermissions`

ควบคุมว่าจะเกิดอะไรขึ้นเมื่อควรแสดงพรอมป์ต์สิทธิ์ แต่ไม่มี interactive TTY ให้ใช้ (ซึ่งเป็นกรณีเสมอสำหรับเซสชัน ACP)

| Value  | พฤติกรรม                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | ยุติเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)**           |
| `deny` | ปฏิเสธสิทธิ์แบบเงียบ ๆ และทำงานต่อไป (degrade อย่างนุ่มนวล) |

### การกำหนดค่า

ตั้งค่าผ่าน config ของ Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต gateway หลังจากเปลี่ยนค่าเหล่านี้

> **สำคัญ:** ปัจจุบัน OpenClaw ใช้ค่าเริ่มต้น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือ exec ใด ๆ ที่ทำให้เกิดพรอมป์ต์สิทธิ์อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`
>
> หากคุณต้องการจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชัน degrade อย่างนุ่มนวลแทนที่จะล้มเหลว

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — ภาพรวม คู่มือปฏิบัติการสำหรับผู้ดูแล แนวคิด
- [Sub-agents](/th/tools/subagents)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
