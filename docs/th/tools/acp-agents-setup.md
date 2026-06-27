---
read_when:
    - การติดตั้งหรือกำหนดค่า harness ของ acpx สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้งานบริดจ์ MCP ของ plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: การกำหนดค่า acpx harness, การตั้งค่า Plugin, สิทธิ์'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-06-27T18:25:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

สำหรับภาพรวม คู่มือปฏิบัติสำหรับผู้ดูแล และแนวคิด โปรดดู [เอเจนต์ ACP](/th/tools/acp-agents).

ส่วนด้านล่างครอบคลุมการตั้งค่าฮาร์เนส acpx, การตั้งค่า Plugin สำหรับบริดจ์ MCP และการกำหนดค่าสิทธิ์

ใช้หน้านี้เฉพาะเมื่อคุณกำลังตั้งค่าเส้นทาง ACP/acpx เท่านั้น สำหรับการตั้งค่ารันไทม์ app-server แบบเนทีฟของ Codex ให้ใช้ [ฮาร์เนส Codex](/th/plugins/codex-harness) สำหรับคีย์ OpenAI API หรือการตั้งค่าผู้ให้บริการโมเดล Codex OAuth ให้ใช้
[OpenAI](/th/providers/openai).

Codex มีเส้นทาง OpenClaw สองแบบ:

| เส้นทาง                    | การตั้งค่า/คำสั่ง                                      | หน้าการตั้งค่า                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server แบบเนทีฟของ Codex | `/codex ...`, `openai/gpt-*` agent refs                | [ฮาร์เนส Codex](/th/plugins/codex-harness) |
| อะแดปเตอร์ Codex ACP แบบระบุชัดเจน | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | หน้านี้                               |

ควรใช้เส้นทางแบบเนทีฟ เว้นแต่คุณต้องการพฤติกรรม ACP/acpx อย่างชัดเจน

## การรองรับฮาร์เนส acpx (ปัจจุบัน)

นามแฝงฮาร์เนสในตัวของ acpx ปัจจุบัน:

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
- `qwen`

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ให้ใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่การตั้งค่า acpx ของคุณจะกำหนดนามแฝงเอเจนต์แบบกำหนดเองไว้
หากการติดตั้ง Cursor ในเครื่องของคุณยังเปิดเผย ACP เป็น `agent acp` ให้แทนที่คำสั่งเอเจนต์ `cursor` ในการตั้งค่า acpx ของคุณ แทนที่จะเปลี่ยนค่าเริ่มต้นในตัว

การใช้ acpx CLI โดยตรงสามารถกำหนดเป้าหมายอะแดปเตอร์ใดก็ได้ผ่าน `--agent <command>` เช่นกัน แต่ช่องทางหลบเลี่ยงดิบนี้เป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

การควบคุมโมเดลขึ้นอยู่กับความสามารถของอะแดปเตอร์ การอ้างอิงโมเดล Codex ACP จะถูกทำให้เป็นรูปแบบมาตรฐานโดย OpenClaw ก่อนเริ่มต้น ฮาร์เนสอื่นต้องมี ACP `models` พร้อมการรองรับ `session/set_model`; หากฮาร์เนสไม่เปิดเผยทั้งความสามารถ ACP นั้นและแฟล็กโมเดลตอนเริ่มต้นของตัวเอง OpenClaw/acpx จะไม่สามารถบังคับการเลือกโมเดลได้

## การตั้งค่าที่จำเป็น

ค่าพื้นฐาน ACP ของคอร์:

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
      "openclaw",
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

การตั้งค่าการผูกเธรดขึ้นอยู่กับอะแดปเตอร์ช่องทาง ตัวอย่างสำหรับ Discord:

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

หากการสปอว์น ACP แบบผูกกับเธรดไม่ทำงาน ให้ตรวจสอบแฟล็กฟีเจอร์ของอะแดปเตอร์ก่อน:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

การผูกกับการสนทนาปัจจุบันไม่ต้องสร้างเธรดลูก ต้องมีบริบทการสนทนาที่ใช้งานอยู่และอะแดปเตอร์ช่องทางที่เปิดเผยการผูกการสนทนา ACP

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับแบ็กเอนด์ acpx

การติดตั้งแบบแพ็กเกจใช้ Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการสำหรับ ACP
ติดตั้งและเปิดใช้งานก่อนใช้เซสชันฮาร์เนส ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

เช็กเอาต์ซอร์สสามารถใช้ Plugin เวิร์กสเปซในเครื่องได้หลังจาก `pnpm install` เช่นกัน

เริ่มด้วย:

```text
/acp doctor
```

หากคุณปิดใช้งาน `acpx`, ปฏิเสธผ่าน `plugins.allow` / `plugins.deny` หรือต้องการเปลี่ยนกลับไปใช้ Plugin แบบแพ็กเกจ ให้ใช้เส้นทางแพ็กเกจแบบระบุชัดเจน:

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

### คำสั่ง acpx และการกำหนดค่าเวอร์ชัน

โดยค่าเริ่มต้น Plugin `acpx` จะลงทะเบียนแบ็กเอนด์ ACP แบบฝังระหว่างการเริ่มต้น Gateway และรอการตรวจสอบเริ่มต้นรันไทม์แบบฝังก่อนสัญญาณ `ready` ของ Gateway ตั้งค่า `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` หรือ
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` เฉพาะสำหรับสคริปต์หรือสภาพแวดล้อมที่ตั้งใจปิดใช้งานการตรวจสอบตอนเริ่มต้นไว้เท่านั้น เรียกใช้ `/acp doctor` สำหรับการตรวจสอบตามคำขออย่างชัดเจน

แทนที่คำสั่งหรือเวอร์ชันในการตั้งค่า Plugin:

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

- `command` รับพาธสัมบูรณ์ พาธสัมพัทธ์ (แก้จากเวิร์กสเปซ OpenClaw) หรือชื่อคำสั่ง
- `expectedVersion: "any"` ปิดการจับคู่เวอร์ชันแบบเข้มงวด
- พาธ `command` แบบกำหนดเองจะปิดการติดตั้งอัตโนมัติภายใน Plugin

แทนที่คำสั่งเอเจนต์ ACP รายตัวด้วยอาร์กิวเมนต์แบบมีโครงสร้างเมื่อพาธหรือค่าแฟล็กควรคงเป็นโทเค็น argv เดียว:

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
- `agents.<id>.args` เป็นทางเลือก แต่ละรายการในอาร์เรย์จะถูกใส่เครื่องหมายอ้างอิงสำหรับเชลล์ก่อนที่ OpenClaw จะส่งผ่านรีจิสทรีสตริงคำสั่ง acpx ปัจจุบัน

ดู [Plugin](/th/tools/plugin)

### การติดตั้งการพึ่งพาอัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบทั่วระบบด้วย `npm install -g openclaw` การพึ่งพารันไทม์ acpx (ไบนารีเฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติผ่านฮุก postinstall หากการติดตั้งอัตโนมัติล้มเหลว Gateway จะยังเริ่มทำงานตามปกติและรายงานการพึ่งพาที่ขาดผ่าน `openclaw acp doctor`

### บริดจ์ MCP สำหรับเครื่องมือ Plugin

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดย Plugin ของ OpenClaw ให้กับฮาร์เนส ACP

หากคุณต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้เครื่องมือ Plugin ของ OpenClaw ที่ติดตั้งไว้ เช่น memory recall/store ให้เปิดใช้งานบริดจ์เฉพาะ:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่ทำ:

- ฉีดเซิร์ฟเวอร์ MCP ในตัวชื่อ `openclaw-plugin-tools` เข้าในบูตสแตรปเซสชัน ACPX
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย Plugin ของ OpenClaw ที่ติดตั้งและเปิดใช้งานอยู่
- ทำให้ฟีเจอร์นี้ต้องเปิดใช้งานอย่างชัดเจนและปิดเป็นค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความเชื่อถือ:

- สิ่งนี้ขยายพื้นผิวเครื่องมือของฮาร์เนส ACP
- เอเจนต์ ACP เข้าถึงได้เฉพาะเครื่องมือ Plugin ที่ใช้งานอยู่แล้วใน Gateway
- ให้ถือว่านี่เป็นขอบเขตความเชื่อถือเดียวกับการอนุญาตให้ Plugin เหล่านั้นทำงานใน OpenClaw เอง
- ตรวจสอบ Plugin ที่ติดตั้งก่อนเปิดใช้งาน

`mcpServers` แบบกำหนดเองยังทำงานเหมือนเดิม บริดจ์เครื่องมือ Plugin ในตัวเป็นความสะดวกเพิ่มเติมแบบเลือกเปิดใช้ ไม่ใช่สิ่งทดแทนการตั้งค่าเซิร์ฟเวอร์ MCP ทั่วไป

### บริดจ์ MCP สำหรับเครื่องมือ OpenClaw

โดยค่าเริ่มต้น เซสชัน ACPX ก็ **ไม่** เปิดเผยเครื่องมือในตัวของ OpenClaw ผ่าน MCP เช่นกัน เปิดใช้งานบริดจ์เครื่องมือคอร์แยกต่างหากเมื่อเอเจนต์ ACP ต้องใช้เครื่องมือในตัวที่เลือก เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่ทำ:

- ฉีดเซิร์ฟเวอร์ MCP ในตัวชื่อ `openclaw-tools` เข้าในบูตสแตรปเซสชัน ACPX
- เปิดเผยเครื่องมือในตัวของ OpenClaw ที่เลือก เซิร์ฟเวอร์เริ่มต้นเปิดเผย `cron`
- ทำให้การเปิดเผยเครื่องมือคอร์ต้องเปิดใช้งานอย่างชัดเจนและปิดเป็นค่าเริ่มต้น

### การกำหนดค่าเวลาหมดเวลาของการดำเนินงานรันไทม์

Plugin `acpx` ให้เวลาการเริ่มต้นรันไทม์แบบฝังและการดำเนินงานควบคุม 120 วินาทีโดยค่าเริ่มต้น สิ่งนี้ให้เวลาฮาร์เนสที่ช้ากว่า เช่น Gemini CLI เพียงพอสำหรับการเริ่มต้นและเตรียมใช้งาน ACP แทนที่ค่านี้หากโฮสต์ของคุณต้องใช้ขีดจำกัดการดำเนินงานต่างออกไป:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

เทิร์นรันไทม์ใช้เวลาหมดเวลาของเอเจนต์/รันของ OpenClaw รวมถึง `/acp timeout`
`sessions_spawn` ไม่รับการแทนที่เวลาหมดเวลารายการเรียก รีสตาร์ต Gateway หลังจากเปลี่ยนค่านี้

### การกำหนดค่าเอเจนต์ตรวจสอบสุขภาพ

เมื่อ `/acp doctor` หรือการตรวจสอบตอนเริ่มต้นตรวจแบ็กเอนด์ Plugin `acpx` ที่รวมมาจะตรวจสอบเอเจนต์ฮาร์เนสหนึ่งตัว หากตั้งค่า `acp.allowedAgents` ไว้ จะใช้เอเจนต์ที่อนุญาตตัวแรกเป็นค่าเริ่มต้น มิฉะนั้นจะใช้ `codex` เป็นค่าเริ่มต้น หากการปรับใช้ของคุณต้องใช้เอเจนต์ ACP อื่นสำหรับการตรวจสุขภาพ ให้ตั้งค่าเอเจนต์ตรวจสอบอย่างชัดเจน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบไม่โต้ตอบ ไม่มี TUI สำหรับอนุมัติหรือปฏิเสธพรอมป์สิทธิ์การเขียนไฟล์และการเรียกใช้เชลล์ Plugin acpx มีคีย์การตั้งค่าสองรายการที่ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ฮาร์เนส ACPX เหล่านี้แยกจากการอนุมัติ exec ของ OpenClaw และแยกจากแฟล็กข้ามของผู้จำหน่ายแบ็กเอนด์ CLI เช่น Claude CLI `--permission-mode bypassPermissions` ACPX `approve-all` คือสวิตช์ฉุกเฉินระดับฮาร์เนสสำหรับเซสชัน ACP

สำหรับการเปรียบเทียบที่กว้างขึ้นระหว่าง OpenClaw `tools.exec.mode`, การอนุมัติ Codex Guardian และสิทธิ์ฮาร์เนส ACPX โปรดดู
[โหมดสิทธิ์](/th/tools/permission-modes)

### `permissionMode`

ควบคุมว่าการดำเนินงานใดที่เอเจนต์ฮาร์เนสสามารถทำได้โดยไม่ต้องถาม

| ค่า             | พฤติกรรม                                                |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่งเชลล์ทั้งหมดโดยอัตโนมัติ |
| `approve-reads` | อนุมัติเฉพาะการอ่านโดยอัตโนมัติ; การเขียนและ exec ต้องมีพรอมป์ |
| `deny-all`      | ปฏิเสธพรอมป์สิทธิ์ทั้งหมด                              |

### `nonInteractivePermissions`

ควบคุมว่าจะเกิดอะไรขึ้นเมื่อควรแสดงพรอมป์สิทธิ์แต่ไม่มี TUI แบบโต้ตอบให้ใช้ (ซึ่งเป็นกรณีเสมอสำหรับเซสชัน ACP)

| ค่า     | พฤติกรรม                                                        |
| ------ | ----------------------------------------------------------------- |
| `fail` | ยกเลิกเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)**           |
| `deny` | ปฏิเสธสิทธิ์อย่างเงียบ ๆ และดำเนินต่อ (ลดระดับอย่างนุ่มนวล) |

### การกำหนดค่า

ตั้งค่าผ่านการตั้งค่า Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่าเหล่านี้

<Warning>
OpenClaw มีค่าเริ่มต้นเป็น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือ exec ใด ๆ ที่ทริกเกอร์พรอมป์สิทธิ์อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`

หากคุณต้องจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับอย่างนุ่มนวลแทนที่จะล่ม
</Warning>

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — ภาพรวม คู่มือปฏิบัติสำหรับผู้ดูแล แนวคิด
- [เอเจนต์ย่อย](/th/tools/subagents)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
