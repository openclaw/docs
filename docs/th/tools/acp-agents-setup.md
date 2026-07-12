---
read_when:
    - การติดตั้งหรือกำหนดค่าชุดทดสอบ acpx สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้งานบริดจ์ MCP สำหรับเครื่องมือ Plugin หรือเครื่องมือ OpenClaw
    - การกำหนดค่าโหมดสิทธิ์ของ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: การกำหนดค่าชุดควบคุม acpx, การตั้งค่า Plugin และสิทธิ์การเข้าถึง'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-07-12T16:45:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

สำหรับภาพรวม คู่มือปฏิบัติงานสำหรับผู้ดูแลระบบ และแนวคิดต่าง ๆ โปรดดู [เอเจนต์ ACP](/th/tools/acp-agents)

หน้านี้ครอบคลุมการกำหนดค่าชุดควบคุม acpx การตั้งค่า Plugin สำหรับบริดจ์ MCP และการกำหนดค่าสิทธิ์

ใช้หน้านี้เฉพาะเมื่อตั้งค่าเส้นทาง ACP/acpx สำหรับการกำหนดค่ารันไทม์ app-server แบบเนทีฟของ Codex ให้ใช้ [ชุดควบคุม Codex](/th/plugins/codex-harness) สำหรับคีย์ OpenAI API หรือการกำหนดค่าผู้ให้บริการโมเดลด้วย Codex OAuth ให้ใช้ [OpenAI](/th/providers/openai)

Codex มีเส้นทาง OpenClaw สองแบบ:

| เส้นทาง                      | การกำหนดค่า/คำสั่ง                                     | หน้าการตั้งค่า                            |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server แบบเนทีฟของ Codex | `/codex ...`, การอ้างอิงเอเจนต์ `openai/gpt-*`          | [ชุดควบคุม Codex](/th/plugins/codex-harness) |
| อะแดปเตอร์ Codex ACP แบบระบุชัดเจน | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | หน้านี้                                  |

ควรใช้เส้นทางแบบเนทีฟ เว้นแต่คุณต้องการพฤติกรรมของ ACP/acpx อย่างชัดเจน

## การรองรับชุดควบคุม acpx (ปัจจุบัน)

นามแฝงชุดควบคุม acpx ในตัว (จากดีเพนเดนซี `acpx` เวอร์ชันที่ตรึงไว้):

| นามแฝง       | ครอบคลุม                                                                                                         |
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
| `openclaw`   | บริดจ์ OpenClaw ACP (`openclaw acp` แบบเนทีฟ)                                                                   |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` และ `factorydroid` จะถูกจับคู่กับอะแดปเตอร์ `droid` ในตัวเช่นกัน

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ควรใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่การกำหนดค่า acpx ของคุณจะกำหนดนามแฝงเอเจนต์แบบกำหนดเองไว้
หากการติดตั้ง Cursor ในเครื่องของคุณยังคงเปิดเผย ACP เป็น `agent acp` ให้แทนที่คำสั่งเอเจนต์ `cursor` ในการกำหนดค่า acpx แทนการเปลี่ยนค่าเริ่มต้นในตัว

การใช้ acpx CLI โดยตรงยังสามารถระบุอะแดปเตอร์ใด ๆ ผ่าน `--agent <command>` ได้ แต่ช่องทางเลี่ยงข้อจำกัดระดับต่ำนี้เป็นคุณสมบัติของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ตามปกติของ OpenClaw)

การควบคุมโมเดลขึ้นอยู่กับความสามารถของอะแดปเตอร์ การอ้างอิงโมเดล Codex ACP จะถูก OpenClaw ปรับให้อยู่ในรูปแบบมาตรฐานก่อนเริ่มต้น ชุดควบคุมอื่นต้องรองรับ `models` ของ ACP พร้อมกับ `session/set_model` หากชุดควบคุมไม่เปิดเผยทั้งความสามารถ ACP ดังกล่าวและแฟล็กโมเดลสำหรับเริ่มต้นของตัวเอง OpenClaw/acpx จะไม่สามารถบังคับการเลือกโมเดลได้

## การกำหนดค่าที่จำเป็น

ค่าพื้นฐานของ ACP ในแกนหลัก:

```json5
{
  acp: {
    enabled: true,
    // ไม่บังคับ ค่าเริ่มต้นคือ true; ตั้งเป็น false เพื่อหยุดการส่งงาน ACP ชั่วคราวโดยยังคงใช้การควบคุม /acp ได้
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
    maxConcurrentSessions: 8,
    stream: {
      // ค่าเริ่มต้นคือ coalesceIdleMs: 350, maxChunkChars: 1800; แสดงไว้อย่างชัดเจนที่นี่
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

การกำหนดค่าการผูกเธรดขึ้นอยู่กับอะแดปเตอร์ช่องทาง ตัวอย่างสำหรับ Discord:

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

การผูกกับการสนทนาปัจจุบันไม่จำเป็นต้องสร้างเธรดย่อย แต่ต้องมีบริบทการสนทนาที่ใช้งานอยู่และอะแดปเตอร์ช่องทางที่เปิดเผยการผูกการสนทนา ACP

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับแบ็กเอนด์ acpx

การติดตั้งจากแพ็กเกจใช้ Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการสำหรับ ACP
ติดตั้งและเปิดใช้งานก่อนใช้เซสชันชุดควบคุม ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

การเช็กเอาต์ซอร์สยังสามารถใช้ Plugin ในเวิร์กสเปซภายในเครื่องได้หลังจาก `pnpm install`

เริ่มต้นด้วย:

```text
/acp doctor
```

หากคุณปิดใช้งาน `acpx` ปฏิเสธผ่าน `plugins.allow` / `plugins.deny` หรือต้องการเปลี่ยนกลับไปใช้ Plugin จากแพ็กเกจ ให้ใช้พาธแพ็กเกจแบบระบุชัดเจน:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้งจากเวิร์กสเปซภายในเครื่องระหว่างการพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสถานะของแบ็กเอนด์:

```text
/acp doctor
```

### การตรวจสอบการเริ่มต้นรันไทม์ acpx

Plugin `acpx` ฝังรันไทม์ ACP โดยตรง (ไม่มีไบนารีหรือเวอร์ชัน `acpx` แยกต่างหากให้กำหนดค่า) โดยค่าเริ่มต้น Plugin จะลงทะเบียนแบ็กเอนด์แบบฝังระหว่างการเริ่มต้น Gateway และรอการตรวจสอบการเริ่มต้นก่อนส่งสัญญาณ `ready` ของ Gateway ตั้งค่า `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` หรือ `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` เฉพาะสำหรับสคริปต์หรือสภาพแวดล้อมที่ตั้งใจปิดการตรวจสอบการเริ่มต้นไว้เท่านั้น เรียกใช้ `/acp doctor` เพื่อสั่งตรวจสอบตามต้องการอย่างชัดเจน

แทนที่คำสั่งของเอเจนต์ ACP รายตัวด้วยอาร์กิวเมนต์แบบมีโครงสร้าง เมื่อพาธหรือค่าของแฟล็กควรคงเป็นโทเค็น argv เดียว:

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

- `agents.<id>.command` คือไฟล์ที่เรียกใช้งานได้หรือสตริงคำสั่งที่มีอยู่สำหรับเอเจนต์ ACP นั้น
- `agents.<id>.args` เป็นตัวเลือก แต่ละรายการในอาร์เรย์จะถูกใส่เครื่องหมายอัญประกาศสำหรับเชลล์ก่อนที่ OpenClaw จะส่งผ่านรีจิสทรีสตริงคำสั่ง acpx ปัจจุบัน

ดู [Plugin](/th/tools/plugin)

### การดาวน์โหลดอะแดปเตอร์อัตโนมัติ

`acpx` จะดาวน์โหลดอะแดปเตอร์ ACP โดยอัตโนมัติ (ตัวอย่างเช่นบริดจ์ ACP ของ Claude และ Codex) ผ่าน `npx` เมื่อใช้งานครั้งแรก คุณไม่จำเป็นต้องติดตั้งแพ็กเกจอะแดปเตอร์ด้วยตนเอง และไม่มีขั้นตอนหลังการติดตั้งแยกต่างหากสำหรับ OpenClaw เอง หากการดาวน์โหลดหรือการสร้างโปรเซสของอะแดปเตอร์ล้มเหลว `/acp doctor` จะรายงานความล้มเหลว

### บริดจ์ MCP สำหรับเครื่องมือ Plugin

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดย Plugin ของ OpenClaw ให้แก่ชุดควบคุม ACP

หากคุณต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้เครื่องมือของ Plugin OpenClaw ที่ติดตั้งไว้ เช่น การเรียกคืน/จัดเก็บหน่วยความจำ ให้เปิดใช้งานบริดจ์เฉพาะ:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

การดำเนินการนี้จะ:

- แทรกเซิร์ฟเวอร์ MCP ในตัวชื่อ `openclaw-plugin-tools` ลงในการเริ่มต้นเซสชัน ACPX
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย Plugin OpenClaw ที่ติดตั้งและเปิดใช้งานอยู่
- กำหนดให้เปิดใช้คุณสมบัตินี้อย่างชัดเจน และปิดไว้โดยค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความเชื่อถือ:

- การดำเนินการนี้ขยายขอบเขตเครื่องมือของชุดควบคุม ACP
- เอเจนต์ ACP จะเข้าถึงได้เฉพาะเครื่องมือ Plugin ที่ทำงานอยู่ใน Gateway แล้วเท่านั้น
- ให้ถือว่านี่เป็นขอบเขตความเชื่อถือเดียวกับการอนุญาตให้ Plugin เหล่านั้นทำงานภายใน OpenClaw
- ตรวจสอบ Plugin ที่ติดตั้งไว้ก่อนเปิดใช้งาน

`mcpServers` แบบกำหนดเองยังคงทำงานเช่นเดิม บริดจ์เครื่องมือ Plugin ในตัวเป็นความสะดวกเพิ่มเติมที่ต้องเลือกเปิดใช้ ไม่ใช่สิ่งทดแทนการกำหนดค่าเซิร์ฟเวอร์ MCP ทั่วไป

### บริดจ์ MCP สำหรับเครื่องมือ OpenClaw

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือในตัวของ OpenClaw ผ่าน MCP เช่นกัน เปิดใช้งานบริดจ์เครื่องมือแกนหลักแยกต่างหาก เมื่อเอเจนต์ ACP ต้องใช้เครื่องมือในตัวที่เลือก เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

การดำเนินการนี้จะ:

- แทรกเซิร์ฟเวอร์ MCP ในตัวชื่อ `openclaw-tools` ลงในการเริ่มต้นเซสชัน ACPX
- เปิดเผยเครื่องมือในตัวของ OpenClaw ที่เลือกไว้ เซิร์ฟเวอร์เริ่มต้นเปิดเผย `cron`
- กำหนดให้การเปิดเผยเครื่องมือแกนหลักต้องเปิดใช้อย่างชัดเจน และปิดไว้โดยค่าเริ่มต้น

### การกำหนดค่าระยะหมดเวลาของการดำเนินงานรันไทม์

โดยค่าเริ่มต้น Plugin `acpx` ให้เวลา 120 วินาทีสำหรับการเริ่มต้นรันไทม์แบบฝังและการดำเนินงานควบคุม ซึ่งช่วยให้ชุดควบคุมที่ช้ากว่า เช่น Gemini CLI มีเวลาเพียงพอสำหรับการเริ่มต้นและการเตรียมใช้งาน ACP หากโฮสต์ของคุณต้องการขีดจำกัดเวลาการดำเนินงานอื่น ให้แทนที่ค่านี้:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รอบการทำงานของรันไทม์ใช้ระยะหมดเวลาของเอเจนต์/การรันใน OpenClaw รวมถึง `/acp timeout`
`sessions_spawn` ไม่รองรับการแทนที่ระยะหมดเวลาสำหรับแต่ละการเรียกใช้ เส้นทางสำหรับผู้ดูแลระบบคือ `agents.defaults.subagents.runTimeoutSeconds` รีสตาร์ต Gateway หลังจากเปลี่ยน `timeoutSeconds`

### การกำหนดค่าเอเจนต์สำหรับการตรวจสอบสถานะ

เมื่อ `/acp doctor` หรือการตรวจสอบการเริ่มต้นตรวจสอบแบ็กเอนด์ Plugin `acpx` ที่ให้มาพร้อมระบบจะตรวจสอบเอเจนต์ชุดควบคุมหนึ่งตัว หากตั้งค่า `acp.allowedAgents` ระบบจะใช้เอเจนต์ที่อนุญาตตัวแรกเป็นค่าเริ่มต้น มิฉะนั้นจะใช้ `codex` เป็นค่าเริ่มต้น หากการติดตั้งใช้งานของคุณต้องใช้เอเจนต์ ACP อื่นสำหรับการตรวจสอบสถานะ ให้กำหนดเอเจนต์สำหรับตรวจสอบอย่างชัดเจน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบไม่โต้ตอบ — ไม่มี TTY สำหรับอนุมัติหรือปฏิเสธพรอมต์ขอสิทธิ์เขียนไฟล์และเรียกใช้เชลล์ Plugin acpx มีคีย์การกำหนดค่าสองคีย์ที่ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ของชุดควบคุม ACPX เหล่านี้แยกจากการอนุมัติการดำเนินการของ OpenClaw และแยกจากแฟล็กข้ามข้อจำกัดของผู้ให้บริการแบ็กเอนด์ CLI เช่น `--permission-mode bypassPermissions` ของ Claude CLI ค่า `approve-all` ของ ACPX เป็นสวิตช์ฉุกเฉินระดับชุดควบคุมสำหรับเซสชัน ACP

สำหรับการเปรียบเทียบโดยละเอียดระหว่าง `tools.exec.mode` ของ OpenClaw การอนุมัติของ Codex Guardian และสิทธิ์ของชุดควบคุม ACPX โปรดดู [โหมดสิทธิ์](/th/tools/permission-modes)

### `permissionMode`

ควบคุมว่าเอเจนต์ชุดควบคุมสามารถดำเนินการใดได้โดยไม่ต้องแสดงพรอมต์

| ค่า             | ลักษณะการทำงาน                                                  |
| --------------- | --------------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่งเชลล์ทั้งหมดโดยอัตโนมัติ           |
| `approve-reads` | อนุมัติเฉพาะการอ่านโดยอัตโนมัติ ส่วนการเขียนและการเรียกใช้คำสั่งต้องมีการยืนยัน |
| `deny-all`      | ปฏิเสธคำขอสิทธิ์ทั้งหมด                                         |

### `nonInteractivePermissions`

ควบคุมสิ่งที่จะเกิดขึ้นเมื่อควรแสดงคำขอสิทธิ์ แต่ไม่มี TTY แบบโต้ตอบให้ใช้งาน (ซึ่งเป็นกรณีของเซสชัน ACP เสมอ)

| ค่า    | ลักษณะการทำงาน                                                                 |
| ------ | ------------------------------------------------------------------------------ |
| `fail` | ยุติเซสชันด้วย `PermissionPromptUnavailableError` **(ค่าเริ่มต้น)**            |
| `deny` | ปฏิเสธสิทธิ์โดยไม่แจ้งและดำเนินการต่อ (ลดระดับการทำงานอย่างเหมาะสม)            |

### การกำหนดค่า

ตั้งค่าผ่านการกำหนดค่าของ Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่าเหล่านี้

<Warning>
OpenClaw ใช้ค่าเริ่มต้นเป็น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือการเรียกใช้คำสั่งใด ๆ ที่ทำให้เกิดคำขอสิทธิ์อาจล้มเหลวด้วย `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`

หากคุณจำเป็นต้องจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับการทำงานอย่างเหมาะสมแทนที่จะหยุดทำงาน
</Warning>

## เนื้อหาที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — ภาพรวม คู่มือปฏิบัติงานสำหรับผู้ดูแล และแนวคิด
- [เอเจนต์ย่อย](/th/tools/subagents)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
