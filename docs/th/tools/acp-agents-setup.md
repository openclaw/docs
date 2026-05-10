---
read_when:
    - การติดตั้งหรือกำหนดค่าฮาร์เนส acpx สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้งานบริดจ์ MCP ของ plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ของ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: การกำหนดค่าฮาร์เนส acpx, การตั้งค่า Plugin, สิทธิ์'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-05-10T19:58:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

สำหรับภาพรวม, runbook สำหรับผู้ปฏิบัติงาน และแนวคิด โปรดดู [เอเจนต์ ACP](/th/tools/acp-agents)

ส่วนด้านล่างครอบคลุมการกำหนดค่า acpx harness, การตั้งค่า Plugin สำหรับบริดจ์ MCP และการกำหนดค่าสิทธิ์

ใช้หน้านี้เฉพาะเมื่อคุณกำลังตั้งค่าเส้นทาง ACP/acpx เท่านั้น สำหรับการกำหนดค่ารันไทม์ app-server ของ Codex แบบเนทีฟ ให้ใช้ [Codex harness](/th/plugins/codex-harness) สำหรับคีย์ OpenAI API หรือการกำหนดค่า model-provider ของ Codex OAuth ให้ใช้
[OpenAI](/th/providers/openai)

Codex มีสองเส้นทางใน OpenClaw:

| เส้นทาง                      | การกำหนดค่า/คำสั่ง                                         | หน้าการตั้งค่า                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server ของ Codex แบบเนทีฟ    | `/codex ...`, `openai/gpt-*` agent refs                | [Codex harness](/th/plugins/codex-harness) |
| อะแดปเตอร์ Codex ACP แบบชัดเจน | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | หน้านี้                               |

ควรใช้เส้นทางเนทีฟ เว้นแต่คุณต้องการพฤติกรรม ACP/acpx อย่างชัดเจน

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

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ให้ใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่การกำหนดค่า acpx ของคุณจะนิยามนามแฝงเอเจนต์แบบกำหนดเองไว้
หากการติดตั้ง Cursor ในเครื่องของคุณยังเปิดเผย ACP เป็น `agent acp` ให้แทนที่คำสั่งของเอเจนต์ `cursor` ในการกำหนดค่า acpx ของคุณแทนการเปลี่ยนค่าเริ่มต้นในตัว

การใช้ acpx CLI โดยตรงยังสามารถกำหนดเป้าหมายไปยังอะแดปเตอร์ใดก็ได้ผ่าน `--agent <command>` แต่ช่องทางดิบนี้เป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

การควบคุมโมเดลขึ้นอยู่กับความสามารถของอะแดปเตอร์ การอ้างอิงโมเดล Codex ACP จะถูกทำให้เป็นรูปแบบมาตรฐานโดย OpenClaw ก่อนเริ่มต้น Harness อื่นต้องใช้ ACP `models` ร่วมกับการรองรับ `session/set_model`; หาก harness ไม่เปิดเผยทั้งความสามารถ ACP นั้นและแฟล็กโมเดลตอนเริ่มต้นของตัวเอง OpenClaw/acpx จะไม่สามารถบังคับการเลือกโมเดลได้

## การกำหนดค่าที่จำเป็น

ค่าพื้นฐาน ACP ของแกนหลัก:

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

การกำหนดค่า thread binding ขึ้นอยู่กับอะแดปเตอร์ของช่องทาง ตัวอย่างสำหรับ Discord:

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
        spawnSessions: true,
      },
    },
  },
}
```

หากการ spawn ACP ที่ผูกกับเธรดไม่ทำงาน ให้ตรวจสอบแฟล็กฟีเจอร์ของอะแดปเตอร์ก่อน:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

การ bind กับบทสนทนาปัจจุบันไม่จำเป็นต้องสร้างเธรดย่อย แต่ต้องมีบริบทบทสนทนาที่ใช้งานอยู่และอะแดปเตอร์ช่องทางที่เปิดเผยการ bind บทสนทนา ACP

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับแบ็กเอนด์ acpx

การติดตั้งแบบแพ็กเกจใช้ Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการสำหรับ ACP
ติดตั้งและเปิดใช้งานก่อนใช้เซสชัน ACP harness:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

เช็กเอาต์ซอร์สยังสามารถใช้ Plugin เวิร์กสเปซในเครื่องหลังจาก `pnpm install` ได้ด้วย

เริ่มด้วย:

```text
/acp doctor
```

หากคุณปิดใช้งาน `acpx`, ปฏิเสธผ่าน `plugins.allow` / `plugins.deny` หรือต้องการสลับกลับไปใช้ Plugin แบบแพ็กเกจ ให้ใช้พาธแพ็กเกจแบบชัดเจน:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้งเวิร์กสเปซในเครื่องระหว่างการพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสุขภาพแบ็กเอนด์:

```text
/acp doctor
```

### การกำหนดค่าคำสั่งและเวอร์ชัน acpx

โดยค่าเริ่มต้น Plugin `acpx` จะ probe แบ็กเอนด์ ACP ที่ฝังอยู่ระหว่างการเริ่มต้น Gateway และรอ probe นั้นก่อนสัญญาณ `ready` ของ Gateway ตั้งค่า `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` เพื่อข้าม probe ตอนเริ่มต้นและลงทะเบียนแบ็กเอนด์แบบ lazy แทน เรียกใช้ `/acp doctor` สำหรับ probe แบบตามคำขออย่างชัดเจน

แทนที่คำสั่งหรือเวอร์ชันในการกำหนดค่า Plugin:

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

- `command` รับพาธสัมบูรณ์, พาธสัมพัทธ์ (resolve จากเวิร์กสเปซ OpenClaw) หรือชื่อคำสั่ง
- `expectedVersion: "any"` ปิดใช้งานการจับคู่เวอร์ชันแบบเข้มงวด
- พาธ `command` แบบกำหนดเองจะปิดใช้งานการติดตั้งอัตโนมัติภายใน Plugin

แทนที่คำสั่งเอเจนต์ ACP รายตัวด้วยอาร์กิวเมนต์แบบมีโครงสร้างเมื่อพาธหรือค่าแฟล็กควรคงเป็นหนึ่งโทเค็น argv:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` คือไฟล์ปฏิบัติการหรือสตริงคำสั่งที่มีอยู่สำหรับเอเจนต์ ACP นั้น
- `agents.<id>.args` เป็นตัวเลือก แต่ละรายการในอาร์เรย์จะถูก quote สำหรับ shell ก่อนที่ OpenClaw จะส่งผ่านไปยังรีจิสทรีสตริงคำสั่ง acpx ปัจจุบัน

ดู [Plugins](/th/tools/plugin)

### การติดตั้ง dependency อัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบโกลบอลด้วย `npm install -g openclaw` dependency รันไทม์ acpx (ไบนารีเฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติผ่าน postinstall hook หากการติดตั้งอัตโนมัติล้มเหลว Gateway จะยังเริ่มทำงานตามปกติและรายงาน dependency ที่ขาดผ่าน `openclaw acp doctor`

### บริดจ์ MCP สำหรับเครื่องมือ Plugin

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดย OpenClaw Plugin ให้กับ ACP harness

หากคุณต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้เครื่องมือ OpenClaw Plugin ที่ติดตั้งไว้ เช่น memory recall/store ให้เปิดใช้งานบริดจ์เฉพาะ:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่ฟีเจอร์นี้ทำ:

- ฉีดเซิร์ฟเวอร์ MCP ในตัวชื่อ `openclaw-plugin-tools` เข้าไปในการ bootstrap เซสชัน ACPX
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย OpenClaw Plugin ที่ติดตั้งและเปิดใช้งานอยู่
- ทำให้ฟีเจอร์นี้เป็นแบบชัดเจนและปิดไว้โดยค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความไว้วางใจ:

- สิ่งนี้ขยายพื้นผิวเครื่องมือของ ACP harness
- เอเจนต์ ACP จะเข้าถึงได้เฉพาะเครื่องมือ Plugin ที่ใช้งานอยู่แล้วใน Gateway
- ให้ถือว่าสิ่งนี้เป็นขอบเขตความไว้วางใจเดียวกับการอนุญาตให้ Plugin เหล่านั้นรันใน OpenClaw เอง
- ตรวจสอบ Plugin ที่ติดตั้งไว้ก่อนเปิดใช้งาน

`mcpServers` แบบกำหนดเองยังคงทำงานเหมือนเดิม บริดจ์ plugin-tools ในตัวเป็นความสะดวกเพิ่มเติมแบบเลือกเปิดใช้งาน ไม่ใช่สิ่งทดแทนการกำหนดค่าเซิร์ฟเวอร์ MCP ทั่วไป

### บริดจ์ MCP สำหรับเครื่องมือ OpenClaw

โดยค่าเริ่มต้น เซสชัน ACPX ก็ **ไม่** เปิดเผยเครื่องมือ OpenClaw ในตัวผ่าน MCP เช่นกัน เปิดใช้งานบริดจ์ core-tools แยกต่างหากเมื่อเอเจนต์ ACP ต้องการเครื่องมือในตัวที่เลือกไว้ เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่ฟีเจอร์นี้ทำ:

- ฉีดเซิร์ฟเวอร์ MCP ในตัวชื่อ `openclaw-tools` เข้าไปในการ bootstrap เซสชัน ACPX
- เปิดเผยเครื่องมือ OpenClaw ในตัวที่เลือกไว้ เซิร์ฟเวอร์เริ่มต้นเปิดเผย `cron`
- ทำให้การเปิดเผยเครื่องมือแกนหลักเป็นแบบชัดเจนและปิดไว้โดยค่าเริ่มต้น

### การกำหนดค่า timeout ของรันไทม์

Plugin `acpx` ตั้งค่าเริ่มต้นให้เทิร์นรันไทม์แบบฝังมี timeout 120 วินาที สิ่งนี้ให้เวลาเพียงพอแก่ harness ที่ช้ากว่า เช่น Gemini CLI เพื่อทำ ACP startup และการเริ่มต้นให้เสร็จสมบูรณ์ แทนที่ค่านี้หากโฮสต์ของคุณต้องการขีดจำกัดรันไทม์ที่ต่างออกไป:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รีสตาร์ท Gateway หลังจากเปลี่ยนค่านี้

### การกำหนดค่าเอเจนต์สำหรับ health probe

เมื่อ `/acp doctor` หรือ probe ตอนเริ่มต้นตรวจสอบแบ็กเอนด์ Plugin `acpx` ที่ bundled มาจะ probe เอเจนต์ harness หนึ่งตัว หากตั้งค่า `acp.allowedAgents` ไว้ ค่าเริ่มต้นจะเป็นเอเจนต์แรกที่อนุญาต มิฉะนั้นจะใช้ค่าเริ่มต้นเป็น `codex` หาก deployment ของคุณต้องใช้เอเจนต์ ACP อื่นสำหรับการตรวจสุขภาพ ให้ตั้งค่าเอเจนต์ probe อย่างชัดเจน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ท Gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบไม่โต้ตอบ จึงไม่มี TTY สำหรับอนุมัติหรือปฏิเสธ prompt สิทธิ์ file-write และ shell-exec Plugin acpx มีคีย์การกำหนดค่าสองคีย์ที่ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ ACPX harness เหล่านี้แยกจากการอนุมัติ exec ของ OpenClaw และแยกจากแฟล็กข้ามของ vendor แบ็กเอนด์ CLI เช่น Claude CLI `--permission-mode bypassPermissions` ACPX `approve-all` คือสวิตช์ break-glass ระดับ harness สำหรับเซสชัน ACP

### `permissionMode`

ควบคุมว่าเอเจนต์ harness สามารถดำเนินการใดได้โดยไม่ต้อง prompt

| ค่า           | พฤติกรรม                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่ง shell ทั้งหมดโดยอัตโนมัติ          |
| `approve-reads` | อนุมัติเฉพาะการอ่านโดยอัตโนมัติ; การเขียนและ exec ต้องใช้ prompt |
| `deny-all`      | ปฏิเสธ prompt สิทธิ์ทั้งหมด                              |

### `nonInteractivePermissions`

ควบคุมว่าจะเกิดอะไรขึ้นเมื่อควรแสดง prompt สิทธิ์แต่ไม่มี TTY แบบโต้ตอบให้ใช้งาน (ซึ่งเป็นกรณีเสมอสำหรับเซสชัน ACP)

| ค่า  | พฤติกรรม                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | ยกเลิกเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)**           |
| `deny` | ปฏิเสธสิทธิ์อย่างเงียบ ๆ และดำเนินการต่อ (การลดระดับอย่างนุ่มนวล) |

### การกำหนดค่า

ตั้งค่าผ่านการกำหนดค่า Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ท Gateway หลังจากเปลี่ยนค่าเหล่านี้

<Warning>
OpenClaw ตั้งค่าเริ่มต้นเป็น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือ exec ใด ๆ ที่เรียก prompt สิทธิ์อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`

หากคุณต้องการจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับอย่างนุ่มนวลแทนที่จะขัดข้อง
</Warning>

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — ภาพรวม, runbook สำหรับผู้ปฏิบัติงาน, แนวคิด
- [เอเจนต์ย่อย](/th/tools/subagents)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
