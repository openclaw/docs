---
read_when:
    - การติดตั้งหรือกำหนดค่าฮาร์เนส acpx สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้งานบริดจ์ MCP ของ plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ของ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: การกำหนดค่าชุดควบคุม acpx, การตั้งค่า Plugin และสิทธิ์อนุญาต'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-07-20T06:14:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a1742373d9e65733a2f969422253c3b2c0aa33e0b4caa4d5ab769dc2cc5d97
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

สำหรับภาพรวม คู่มือปฏิบัติงานสำหรับผู้ดูแลระบบ และแนวคิด โปรดดู [เอเจนต์ ACP](/th/tools/acp-agents)

หน้านี้ครอบคลุมการกำหนดค่าฮาร์เนส acpx การตั้งค่า Plugin สำหรับบริดจ์ MCP และการกำหนดค่าสิทธิ์

ใช้หน้านี้เฉพาะเมื่อตั้งค่าเส้นทาง ACP/acpx สำหรับการกำหนดค่ารันไทม์ app-server แบบเนทีฟของ Codex
ให้ใช้ [ฮาร์เนส Codex](/th/plugins/codex-harness) สำหรับคีย์ OpenAI API หรือการกำหนดค่าผู้ให้บริการโมเดลด้วย Codex OAuth ให้ใช้
[OpenAI](/th/providers/openai)

Codex มีเส้นทาง OpenClaw สองแบบ:

| เส้นทาง                      | การกำหนดค่า/คำสั่ง                                         | หน้าการตั้งค่า                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Codex app-server แบบเนทีฟ    | `/codex ...`, การอ้างอิงเอเจนต์ `openai/gpt-*`                | [ฮาร์เนส Codex](/th/plugins/codex-harness) |
| อะแดปเตอร์ Codex ACP แบบระบุชัดเจน | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | หน้านี้                               |

ควรเลือกเส้นทางแบบเนทีฟ เว้นแต่จำเป็นต้องใช้ลักษณะการทำงานของ ACP/acpx โดยเฉพาะ

## การรองรับฮาร์เนส acpx (ปัจจุบัน)

นามแฝงฮาร์เนส acpx ที่มีมาให้ในตัว (จากการอ้างอิง `acpx` ที่ตรึงเวอร์ชันไว้):

| นามแฝง        | ครอบ                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | บริดจ์ OpenClaw ACP (`openclaw acp` แบบเนทีฟ)                                                                     |
| `pi`         | [เอเจนต์เขียนโค้ด Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` และ `factorydroid` จะถูกแก้ไขไปยังอะแดปเตอร์ `droid` ที่มีมาให้ในตัวด้วย

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ควรใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่การกำหนดค่า acpx จะกำหนดนามแฝงเอเจนต์แบบกำหนดเองไว้
หากการติดตั้ง Cursor ภายในเครื่องยังคงเปิดเผย ACP เป็น `agent acp` ให้เขียนทับคำสั่งเอเจนต์ `cursor` ในการกำหนดค่า acpx แทนการเปลี่ยนค่าเริ่มต้นที่มีมาให้ในตัว

การใช้ acpx CLI โดยตรงสามารถกำหนดเป้าหมายไปยังอะแดปเตอร์ใดก็ได้ผ่าน `--agent <command>` แต่ช่องทางหลีกเลี่ยงแบบดิบนี้เป็นคุณสมบัติของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ตามปกติของ OpenClaw)

การควบคุมโมเดลขึ้นอยู่กับความสามารถของอะแดปเตอร์ การอ้างอิงโมเดล Codex ACP จะได้รับการปรับให้เป็นมาตรฐานโดย OpenClaw ก่อนเริ่มต้น ฮาร์เนสอื่นต้องรองรับทั้ง ACP `models` และ
`session/set_model`; หากฮาร์เนสไม่เปิดเผยทั้งความสามารถ ACP ดังกล่าวและแฟล็กโมเดลสำหรับเริ่มต้นของตนเอง OpenClaw/acpx จะไม่สามารถบังคับเลือกโมเดลได้

## การกำหนดค่าที่จำเป็น

ค่าพื้นฐานของ ACP ส่วนแกนหลัก:

```json5
{
  acp: {
    enabled: true,
    // ไม่บังคับ ค่าเริ่มต้นคือ true; ตั้งเป็น false เพื่อหยุดการส่งงาน ACP ชั่วคราวโดยยังคงการควบคุม /acp ไว้
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
      "qwen",
    ],
    stream: {
      deliveryMode: "live",
    },
  },
}
```

การกำหนดค่าการผูกเธรดขึ้นอยู่กับอะแดปเตอร์ของช่องทาง ตัวอย่างสำหรับ Discord:

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
        // ค่าเริ่มต้นเป็น true อยู่แล้ว; แสดงไว้อย่างชัดเจนที่นี่
        spawnSessions: true,
      },
    },
  },
}
```

หากการสร้าง ACP ที่ผูกกับเธรดไม่ทำงาน ให้ตรวจสอบแฟล็กคุณสมบัติของอะแดปเตอร์ก่อน:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

การผูกกับบทสนทนาปัจจุบันไม่จำเป็นต้องสร้างเธรดย่อย แต่ต้องมีบริบทบทสนทนาที่ใช้งานอยู่และอะแดปเตอร์ช่องทางที่เปิดเผยการผูกบทสนทนา ACP

โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับแบ็กเอนด์ acpx

การติดตั้งแบบแพ็กเกจใช้ Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการสำหรับ ACP
ให้ติดตั้งและเปิดใช้งานก่อนใช้เซสชันฮาร์เนส ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

การเช็กเอาต์ซอร์สยังสามารถใช้ Plugin เวิร์กสเปซภายในเครื่องได้หลังจาก `pnpm install`

เริ่มต้นด้วย:

```text
/acp doctor
```

หากปิดใช้งาน `acpx` ปฏิเสธผ่าน `plugins.allow` / `plugins.deny` หรือต้องการ
เปลี่ยนกลับไปใช้ Plugin แบบแพ็กเกจ ให้ใช้พาธแพ็กเกจแบบระบุชัดเจน:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้งเวิร์กสเปซภายในเครื่องระหว่างการพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสถานะแบ็กเอนด์:

```text
/acp doctor
```

### การตรวจสอบการเริ่มต้นรันไทม์ acpx

Plugin `acpx` ฝังรันไทม์ ACP โดยตรง (ไม่มีไบนารีหรือเวอร์ชัน `acpx` แยกต่างหากให้กำหนดค่า) โดยค่าเริ่มต้น Plugin จะลงทะเบียนแบ็กเอนด์ที่ฝังไว้ระหว่างการเริ่มต้น
Gateway และรอการตรวจสอบการเริ่มต้นก่อนสัญญาณ `ready` ของ Gateway
ตั้งค่า `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` หรือ
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` เฉพาะสำหรับสคริปต์หรือสภาพแวดล้อมที่ตั้งใจปิดใช้งานการตรวจสอบการเริ่มต้นไว้ เรียกใช้ `/acp doctor` เพื่อทำการตรวจสอบตามต้องการอย่างชัดเจน

เขียนทับคำสั่งของเอเจนต์ ACP แต่ละตัวด้วยอาร์กิวเมนต์แบบมีโครงสร้าง เมื่อพาธ
หรือค่าแฟล็กควรคงเป็นโทเค็น argv เดียว:

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
- `agents.<id>.args` ไม่บังคับ แต่ละรายการในอาร์เรย์จะถูกใส่อัญประกาศสำหรับเชลล์ก่อนที่ OpenClaw จะส่งผ่านรีจิสทรีสตริงคำสั่ง acpx ปัจจุบัน

โปรดดู [Plugins](/th/tools/plugin)

### การดาวน์โหลดอะแดปเตอร์อัตโนมัติ

`acpx` จะดาวน์โหลดอะแดปเตอร์ ACP โดยอัตโนมัติ (เช่น บริดจ์ Claude และ Codex ACP)
ผ่าน `npx` เมื่อใช้งานครั้งแรก ไม่จำเป็นต้องติดตั้งแพ็กเกจอะแดปเตอร์
ด้วยตนเอง และไม่มีขั้นตอนหลังการติดตั้งแยกต่างหากสำหรับ OpenClaw หากการดาวน์โหลดหรือการสร้างโปรเซสอะแดปเตอร์ล้มเหลว `/acp doctor` จะรายงานความล้มเหลว

### บริดจ์ MCP สำหรับเครื่องมือ Plugin

โดยค่าเริ่มต้น เซสชัน ACPX จะ**ไม่**เปิดเผยเครื่องมือที่ลงทะเบียนโดย Plugin ของ OpenClaw ให้แก่
ฮาร์เนส ACP

หากต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้เครื่องมือของ Plugin
OpenClaw ที่ติดตั้งไว้ เช่น การเรียกคืน/จัดเก็บหน่วยความจำ ให้เปิดใช้งานบริดจ์เฉพาะ:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- แทรกเซิร์ฟเวอร์ MCP ที่มีมาให้ในตัวชื่อ `openclaw-plugin-tools` ลงในการบูตเซสชัน
  ACPX
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย Plugin ของ OpenClaw
  ที่ติดตั้งและเปิดใช้งานอยู่
- ส่งข้อมูลประจำตัวของเซสชัน ACP ที่ใช้งานอยู่ให้แก่แฟกทอรีเครื่องมือ Plugin เพื่อให้
  เครื่องมือที่มีขอบเขตระดับเอเจนต์ยังคงอยู่ในเนมสเปซของเอเจนต์นั้น
- กำหนดให้คุณสมบัตินี้ต้องเปิดใช้งานอย่างชัดเจนและปิดไว้โดยค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความเชื่อถือ:

- การตั้งค่านี้ขยายพื้นผิวเครื่องมือของฮาร์เนส ACP
- เอเจนต์ ACP จะเข้าถึงได้เฉพาะเครื่องมือ Plugin ที่ใช้งานอยู่ใน Gateway แล้วเท่านั้น
- ให้ถือว่านี่เป็นขอบเขตความเชื่อถือเดียวกับการอนุญาตให้ Plugin เหล่านั้นทำงานภายใน
  OpenClaw เอง
- ตรวจสอบ Plugin ที่ติดตั้งไว้ก่อนเปิดใช้งาน

`mcpServers` แบบกำหนดเองยังคงทำงานเหมือนเดิม บริดจ์เครื่องมือ Plugin ที่มีมาให้ในตัวเป็น
ความสะดวกเพิ่มเติมที่เลือกเปิดใช้ได้ ไม่ใช่สิ่งทดแทนการกำหนดค่าเซิร์ฟเวอร์ MCP ทั่วไป

### บริดจ์ MCP สำหรับเครื่องมือ OpenClaw

โดยค่าเริ่มต้น เซสชัน ACPX จะ**ไม่**เปิดเผยเครื่องมือ OpenClaw ที่มีมาให้ในตัวผ่าน
MCP เช่นกัน ให้เปิดใช้งานบริดจ์เครื่องมือส่วนแกนหลักแยกต่างหาก เมื่อเอเจนต์ ACP ต้องใช้เครื่องมือ
ที่มีมาให้ในตัวบางรายการ เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- แทรกเซิร์ฟเวอร์ MCP ที่มีมาให้ในตัวชื่อ `openclaw-tools` ลงในการบูตเซสชัน
  ACPX
- เปิดเผยเครื่องมือ OpenClaw ที่มีมาให้ในตัวบางรายการ เซิร์ฟเวอร์เริ่มต้นเปิดเผย `cron`
- กำหนดให้การเปิดเผยเครื่องมือส่วนแกนหลักต้องเปิดใช้งานอย่างชัดเจนและปิดไว้โดยค่าเริ่มต้น

### การกำหนดค่าเวลาหมดอายุของการดำเนินการรันไทม์

Plugin `acpx` กำหนดเวลา 120 วินาทีโดยค่าเริ่มต้นสำหรับการเริ่มต้นรันไทม์แบบฝังและการดำเนินการควบคุม ซึ่งช่วยให้ฮาร์เนสที่ช้ากว่า เช่น Gemini CLI มีเวลาเพียงพอ
ในการเริ่มต้นและกำหนดค่าเริ่มต้น ACP ให้เสร็จสิ้น เขียนทับค่านี้หากโฮสต์ต้องใช้
ขีดจำกัดการดำเนินการอื่น:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รอบการทำงานของรันไทม์ใช้เวลาหมดอายุของเอเจนต์/การเรียกใช้ของ OpenClaw รวมถึง `/acp timeout`
`sessions_spawn` ไม่รับการเขียนทับเวลาหมดอายุเป็นรายครั้ง เส้นทางสำหรับผู้ดูแลระบบ
คือ `agents.defaults.subagents.runTimeoutSeconds` ให้รีสตาร์ต Gateway หลังจาก
เปลี่ยน `timeoutSeconds`

### การกำหนดค่าเอเจนต์สำหรับการตรวจสอบสถานะ

เมื่อ `/acp doctor` หรือการตรวจสอบการเริ่มต้นตรวจสอบแบ็กเอนด์ Plugin `acpx`
ที่รวมมาให้จะตรวจสอบเอเจนต์ฮาร์เนสหนึ่งตัว หากตั้งค่า `acp.allowedAgents` ไว้ ค่าเริ่มต้นจะเป็น
เอเจนต์ตัวแรกที่อนุญาต มิฉะนั้นค่าเริ่มต้นจะเป็น `codex` หากการติดตั้งใช้งาน
ต้องใช้เอเจนต์ ACP อื่นสำหรับการตรวจสอบสถานะ ให้ตั้งค่าเอเจนต์สำหรับตรวจสอบอย่างชัดเจน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบไม่โต้ตอบ โดยไม่มี TTY สำหรับอนุมัติหรือปฏิเสธพรอมต์ขอสิทธิ์เขียนไฟล์และเรียกใช้เชลล์ Plugin acpx มีคีย์การกำหนดค่าสองคีย์ที่ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ของ harness ACPX เหล่านี้แยกจากการอนุมัติ exec ของ OpenClaw และแยกจากแฟล็กข้ามข้อจำกัดของผู้ให้บริการแบ็กเอนด์ CLI เช่น Claude CLI `--permission-mode bypassPermissions` โดย ACPX `approve-all` เป็นสวิตช์ฉุกเฉินระดับ harness สำหรับเซสชัน ACP

สำหรับการเปรียบเทียบในภาพรวมระหว่าง OpenClaw `tools.exec.mode`, การอนุมัติของ Codex Guardian
และสิทธิ์ของ harness ACPX โปรดดู
[โหมดสิทธิ์](/th/tools/permission-modes)

### `permissionMode`

ควบคุมการดำเนินการที่เอเจนต์ของ harness สามารถทำได้โดยไม่ต้องแจ้งขอ

| ค่า           | ลักษณะการทำงาน                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่งเชลล์ทั้งหมดโดยอัตโนมัติ          |
| `approve-reads` | อนุมัติเฉพาะการอ่านโดยอัตโนมัติ ส่วนการเขียนและ exec ต้องแจ้งขอ |
| `deny-all`      | ปฏิเสธคำขอสิทธิ์ทั้งหมด                              |

### `nonInteractivePermissions`

ควบคุมสิ่งที่จะเกิดขึ้นเมื่อควรแสดงคำขอสิทธิ์ แต่ไม่มี TTY แบบโต้ตอบให้ใช้งาน (ซึ่งเป็นกรณีของเซสชัน ACP เสมอ)

| ค่า  | ลักษณะการทำงาน                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | ยุติเซสชันพร้อม `PermissionPromptUnavailableError` **(ค่าเริ่มต้น)** |
| `deny` | ปฏิเสธสิทธิ์โดยไม่แจ้งและดำเนินการต่อ (ลดระดับการทำงานอย่างราบรื่น)        |

### การกำหนดค่า

ตั้งค่าผ่านการกำหนดค่า Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่าเหล่านี้

<Warning>
ค่าเริ่มต้นของ OpenClaw คือ `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือ exec ใดๆ ที่ทำให้เกิดคำขอสิทธิ์อาจล้มเหลวด้วย `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`

หากต้องการจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับการทำงานอย่างราบรื่นแทนที่จะขัดข้อง
</Warning>

## เนื้อหาที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — ภาพรวม คู่มือการปฏิบัติงานสำหรับผู้ดูแลระบบ และแนวคิด
- [เอเจนต์ย่อย](/th/tools/subagents)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
