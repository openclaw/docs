---
read_when:
    - การติดตั้งหรือกำหนดค่าฮาร์เนส acpx สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้งานบริดจ์ MCP ของ plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ของ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: การกำหนดค่า harness ของ acpx, การตั้งค่า Plugin, สิทธิ์'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-04-30T10:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

สำหรับภาพรวม รันบุ๊กของผู้ปฏิบัติงาน และแนวคิด โปรดดู [ACP agents](/th/tools/acp-agents)

ส่วนด้านล่างครอบคลุมการกำหนดค่า acpx harness, การตั้งค่าปลั๊กอินสำหรับ MCP bridges และการกำหนดค่าสิทธิ์

ใช้หน้านี้เฉพาะเมื่อคุณกำลังตั้งค่าเส้นทาง ACP/acpx เท่านั้น สำหรับการกำหนดค่า native Codex app-server runtime ให้ใช้ [Codex harness](/th/plugins/codex-harness) สำหรับ OpenAI API keys หรือการกำหนดค่า Codex OAuth model-provider ให้ใช้ [OpenAI](/th/providers/openai)

Codex มีสองเส้นทางของ OpenClaw:

| เส้นทาง                   | การกำหนดค่า/คำสั่ง                                     | หน้าการตั้งค่า                            |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Native Codex app-server    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/th/plugins/codex-harness) |
| Explicit Codex ACP adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | หน้านี้                                  |

ให้เลือกใช้เส้นทาง native เว้นแต่คุณต้องการพฤติกรรม ACP/acpx อย่างชัดเจน

## การรองรับ acpx harness (ปัจจุบัน)

นามแฝง harness ในตัวของ acpx ปัจจุบัน:

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

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ให้เลือกใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่การกำหนดค่า acpx ของคุณกำหนดนามแฝง agent แบบกำหนดเองไว้
หากการติดตั้ง Cursor ในเครื่องของคุณยังคงเปิดเผย ACP เป็น `agent acp` ให้ override คำสั่ง agent `cursor` ในการกำหนดค่า acpx ของคุณแทนการเปลี่ยนค่าเริ่มต้นในตัว

การใช้งาน acpx CLI โดยตรงยังสามารถระบุ adapter ใดก็ได้ผ่าน `--agent <command>` แต่ช่องทางดิบนี้เป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

การควบคุมโมเดลขึ้นอยู่กับความสามารถของ adapter การอ้างอิงโมเดล Codex ACP จะถูกทำให้เป็นมาตรฐานโดย OpenClaw ก่อนเริ่มต้น harness อื่นต้องมี ACP `models` พร้อมการรองรับ `session/set_model`; หาก harness ไม่เปิดเผยทั้งความสามารถ ACP นั้นและ flag โมเดลตอนเริ่มต้นของตัวเอง OpenClaw/acpx จะไม่สามารถบังคับการเลือกโมเดลได้

## การกำหนดค่าที่จำเป็น

ACP baseline หลัก:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
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

การกำหนดค่า thread binding ขึ้นอยู่กับ channel-adapter ตัวอย่างสำหรับ Discord:

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

หาก ACP spawn ที่ผูกกับเธรดไม่ทำงาน ให้ตรวจสอบ adapter feature flag ก่อน:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

การผูกกับบทสนทนาปัจจุบันไม่จำเป็นต้องสร้าง child-thread แต่ต้องมีบริบทบทสนทนาที่ใช้งานอยู่และ channel adapter ที่เปิดเผย ACP conversation bindings

ดู [Configuration Reference](/th/gateway/configuration-reference)

## การตั้งค่าปลั๊กอินสำหรับแบ็กเอนด์ acpx

การติดตั้งใหม่มาพร้อมปลั๊กอิน runtime `acpx` ที่ bundled และเปิดใช้งานเป็นค่าเริ่มต้น ดังนั้น ACP มักทำงานได้โดยไม่ต้องมีขั้นตอนติดตั้งปลั๊กอินด้วยตนเอง

เริ่มด้วย:

```text
/acp doctor
```

หากคุณปิดใช้งาน `acpx`, ปฏิเสธผ่าน `plugins.allow` / `plugins.deny` หรือต้องการสลับไปใช้ checkout สำหรับการพัฒนาในเครื่อง ให้ใช้เส้นทางปลั๊กอินแบบชัดเจน:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้ง workspace ในเครื่องระหว่างการพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสุขภาพของแบ็กเอนด์:

```text
/acp doctor
```

### การกำหนดค่าคำสั่งและเวอร์ชันของ acpx

โดยค่าเริ่มต้น ปลั๊กอิน `acpx` ที่ bundled จะลงทะเบียนแบ็กเอนด์ ACP แบบฝังโดยไม่ spawn ACP agent ระหว่างการเริ่มต้น Gateway รัน `/acp doctor` เพื่อ probe แบบ live อย่างชัดเจน ตั้งค่า `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` เฉพาะเมื่อคุณต้องการให้ Gateway probe agent ที่กำหนดค่าไว้ตอนเริ่มต้น

Override คำสั่งหรือเวอร์ชันในการกำหนดค่าปลั๊กอิน:

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

- `command` รับ path แบบ absolute, path แบบ relative (resolve จาก workspace ของ OpenClaw) หรือชื่อคำสั่ง
- `expectedVersion: "any"` ปิดการจับคู่เวอร์ชันแบบเข้มงวด
- path `command` แบบกำหนดเองจะปิดการติดตั้งอัตโนมัติภายในปลั๊กอิน

ดู [Plugins](/th/tools/plugin)

### การติดตั้ง dependency อัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบ global ด้วย `npm install -g openclaw` dependency ของ runtime acpx (ไบนารีเฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติผ่าน postinstall hook หากการติดตั้งอัตโนมัติล้มเหลว gateway จะยังเริ่มทำงานตามปกติและรายงาน dependency ที่ขาดผ่าน `openclaw acp doctor`

### MCP bridge สำหรับเครื่องมือปลั๊กอิน

โดยค่าเริ่มต้น เซสชัน ACPX **จะไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดยปลั๊กอิน OpenClaw ให้ ACP harness

หากคุณต้องการให้ ACP agents เช่น Codex หรือ Claude Code เรียกใช้เครื่องมือปลั๊กอิน OpenClaw ที่ติดตั้งไว้ เช่น memory recall/store ให้เปิด bridge เฉพาะนี้:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- ฉีด MCP server ในตัวชื่อ `openclaw-plugin-tools` เข้าไปใน bootstrap ของเซสชัน ACPX
- เปิดเผยเครื่องมือปลั๊กอินที่ลงทะเบียนไว้แล้วโดยปลั๊กอิน OpenClaw ที่ติดตั้งและเปิดใช้งานอยู่
- ทำให้ฟีเจอร์นี้เป็นแบบ explicit และปิดเป็นค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความไว้วางใจ:

- สิ่งนี้ขยายพื้นผิวเครื่องมือของ ACP harness
- ACP agents จะเข้าถึงได้เฉพาะเครื่องมือปลั๊กอินที่ใช้งานอยู่แล้วใน gateway
- ให้ปฏิบัติกับสิ่งนี้เป็น trust boundary เดียวกับการอนุญาตให้ปลั๊กอินเหล่านั้นทำงานใน OpenClaw เอง
- ตรวจสอบปลั๊กอินที่ติดตั้งไว้ก่อนเปิดใช้งาน

`mcpServers` แบบกำหนดเองยังคงทำงานเหมือนเดิม bridge เครื่องมือปลั๊กอินในตัวเป็นความสะดวกเพิ่มเติมแบบ opt-in ไม่ใช่ตัวแทนของการกำหนดค่า MCP server ทั่วไป

### MCP bridge สำหรับเครื่องมือ OpenClaw

โดยค่าเริ่มต้น เซสชัน ACPX ก็ **จะไม่** เปิดเผยเครื่องมือ OpenClaw ในตัวผ่าน MCP เช่นกัน เปิด bridge สำหรับ core-tools แยกต่างหากเมื่อ ACP agent ต้องการเครื่องมือในตัวที่เลือกไว้ เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- ฉีด MCP server ในตัวชื่อ `openclaw-tools` เข้าไปใน bootstrap ของเซสชัน ACPX
- เปิดเผยเครื่องมือ OpenClaw ในตัวที่เลือกไว้ server เริ่มต้นเปิดเผย `cron`
- ทำให้การเปิดเผย core-tool เป็นแบบ explicit และปิดเป็นค่าเริ่มต้น

### การกำหนดค่า timeout ของ runtime

ปลั๊กอิน `acpx` ที่ bundled ตั้งค่าเริ่มต้นให้ turn ของ runtime แบบฝังมี timeout 120 วินาที ค่านี้ให้เวลาเพียงพอแก่ harness ที่ช้ากว่า เช่น Gemini CLI เพื่อทำ ACP startup และ initialization ให้เสร็จ Override ค่านี้หาก host ของคุณต้องการขีดจำกัด runtime ที่แตกต่าง:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รีสตาร์ท gateway หลังเปลี่ยนค่านี้

### การกำหนดค่า agent สำหรับ health probe

เมื่อ `/acp doctor` หรือ startup probe แบบ opt-in ตรวจสอบแบ็กเอนด์ ปลั๊กอิน `acpx` ที่ bundled จะ probe harness agent หนึ่งตัว หากตั้งค่า `acp.allowedAgents` ไว้ จะใช้ agent ตัวแรกที่อนุญาตเป็นค่าเริ่มต้น มิฉะนั้นจะใช้ `codex` เป็นค่าเริ่มต้น หาก deployment ของคุณต้องการ ACP agent อื่นสำหรับ health checks ให้ตั้งค่า probe agent อย่างชัดเจน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ท gateway หลังเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบไม่โต้ตอบ — ไม่มี TTY สำหรับอนุมัติหรือปฏิเสธ prompt สิทธิ์ file-write และ shell-exec ปลั๊กอิน acpx มี key การกำหนดค่าสองรายการที่ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ของ ACPX harness เหล่านี้แยกจากการอนุมัติ exec ของ OpenClaw และแยกจาก flag bypass ของ vendor แบ็กเอนด์ CLI เช่น Claude CLI `--permission-mode bypassPermissions` ACPX `approve-all` คือ break-glass switch ระดับ harness สำหรับเซสชัน ACP

### `permissionMode`

ควบคุมว่า harness agent สามารถดำเนินการใดได้โดยไม่ต้อง prompt

| ค่า             | พฤติกรรม                                                 |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่ง shell ทั้งหมดโดยอัตโนมัติ |
| `approve-reads` | อนุมัติเฉพาะการอ่านโดยอัตโนมัติ; การเขียนและ exec ต้องใช้ prompts |
| `deny-all`      | ปฏิเสธ permission prompts ทั้งหมด                         |

### `nonInteractivePermissions`

ควบคุมสิ่งที่จะเกิดขึ้นเมื่อควรแสดง permission prompt แต่ไม่มี TTY แบบโต้ตอบให้ใช้ (ซึ่งเป็นกรณีเสมอสำหรับเซสชัน ACP)

| ค่า     | พฤติกรรม                                                         |
| ------ | ----------------------------------------------------------------- |
| `fail` | ยกเลิกเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)**             |
| `deny` | ปฏิเสธสิทธิ์แบบเงียบและทำงานต่อ (ลดระดับการทำงานอย่างนุ่มนวล) |

### การกำหนดค่า

ตั้งค่าผ่านการกำหนดค่าปลั๊กอิน:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ท gateway หลังเปลี่ยนค่าเหล่านี้

<Warning>
OpenClaw ตั้งค่าเริ่มต้นเป็น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือ exec ใด ๆ ที่ทำให้เกิด permission prompt อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`

หากคุณต้องจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับการทำงานอย่างนุ่มนวลแทนที่จะ crash
</Warning>

## ที่เกี่ยวข้อง

- [ACP agents](/th/tools/acp-agents) — ภาพรวม, รันบุ๊กของผู้ปฏิบัติงาน, แนวคิด
- [Sub-agents](/th/tools/subagents)
- [Multi-agent routing](/th/concepts/multi-agent)
