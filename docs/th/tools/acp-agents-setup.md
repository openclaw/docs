---
read_when:
    - การติดตั้งหรือกำหนดค่าฮาร์เนส acpx สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้งานบริดจ์ MCP สำหรับ plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ของ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: การกำหนดค่าชุดควบคุม acpx, การตั้งค่า Plugin, สิทธิ์การเข้าถึง'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-07-16T19:46:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

สำหรับภาพรวม คู่มือปฏิบัติงานสำหรับผู้ดูแลระบบ และแนวคิด โปรดดู [เอเจนต์ ACP](/th/tools/acp-agents)

หน้านี้ครอบคลุมการกำหนดค่าฮาร์เนส acpx การตั้งค่า Plugin สำหรับบริดจ์ MCP และการกำหนดค่าสิทธิ์

ใช้หน้านี้เฉพาะเมื่อตั้งค่าเส้นทาง ACP/acpx สำหรับการกำหนดค่ารันไทม์ app-server แบบเนทีฟของ Codex ให้ใช้ [ฮาร์เนส Codex](/th/plugins/codex-harness) สำหรับคีย์ OpenAI API หรือการกำหนดค่าผู้ให้บริการโมเดลผ่าน Codex OAuth ให้ใช้ [OpenAI](/th/providers/openai)

Codex มีเส้นทาง OpenClaw สองเส้นทาง:

| เส้นทาง                      | การกำหนดค่า/คำสั่ง                                         | หน้าการตั้งค่า                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Codex app-server แบบเนทีฟ    | การอ้างอิงเอเจนต์ `/codex ...`, `openai/gpt-*`                | [ฮาร์เนส Codex](/th/plugins/codex-harness) |
| อะแดปเตอร์ Codex ACP แบบระบุชัดเจน | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | หน้านี้                               |

ควรใช้เส้นทางแบบเนทีฟ เว้นแต่ต้องการพฤติกรรม ACP/acpx โดยเฉพาะ

## การรองรับฮาร์เนส acpx (ปัจจุบัน)

นามแฝงฮาร์เนส acpx ที่มีมาให้ในตัว (จากดีเพนเดนซี `acpx` ที่ตรึงเวอร์ชันไว้):

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

`factory-droid` และ `factorydroid` จะถูกแปลงเป็นอะแดปเตอร์ `droid` ที่มีมาให้ในตัวเช่นกัน

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ควรใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่การกำหนดค่า acpx จะกำหนดนามแฝงเอเจนต์แบบกำหนดเอง
หากการติดตั้ง Cursor ภายในเครื่องยังคงเปิดเผย ACP เป็น `agent acp` ให้แทนที่คำสั่งเอเจนต์ `cursor` ในการกำหนดค่า acpx แทนการเปลี่ยนค่าเริ่มต้นที่มีมาให้ในตัว

การใช้ acpx CLI โดยตรงยังสามารถกำหนดเป้าหมายอะแดปเตอร์ใดก็ได้ผ่าน `--agent <command>` แต่ช่องทางเลี่ยงแบบดิบดังกล่าวเป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

การควบคุมโมเดลขึ้นอยู่กับความสามารถของอะแดปเตอร์ การอ้างอิงโมเดล Codex ACP จะถูกทำให้เป็นมาตรฐานโดย OpenClaw ก่อนเริ่มทำงาน ฮาร์เนสอื่นต้องรองรับทั้ง ACP `models` และ `session/set_model`; หากฮาร์เนสไม่เปิดเผยทั้งความสามารถ ACP ดังกล่าวและแฟล็กโมเดลสำหรับเริ่มทำงานของตนเอง OpenClaw/acpx จะไม่สามารถบังคับการเลือกโมเดลได้

## การกำหนดค่าที่จำเป็น

ค่าพื้นฐาน ACP ของแกนหลัก:

```json5
{
  acp: {
    enabled: true,
    // ไม่บังคับ ค่าเริ่มต้นคือ true; ตั้งเป็น false เพื่อหยุดการส่งงาน ACP ชั่วคราวโดยยังคงตัวควบคุม /acp ไว้
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

หากการสร้าง ACP ที่ผูกกับเธรดไม่ทำงาน ให้ตรวจสอบแฟล็กฟีเจอร์ของอะแดปเตอร์ก่อน:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

การผูกกับการสนทนาปัจจุบันไม่จำเป็นต้องสร้างเธรดย่อย แต่ต้องมีบริบทการสนทนาที่ใช้งานอยู่และอะแดปเตอร์ช่องทางที่เปิดเผยการผูกการสนทนา ACP

โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับแบ็กเอนด์ acpx

การติดตั้งแบบแพ็กเกจใช้ Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการสำหรับ ACP
ติดตั้งและเปิดใช้งานก่อนใช้เซสชันฮาร์เนส ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

เช็กเอาต์ซอร์สยังสามารถใช้ Plugin ในเวิร์กสเปซภายในเครื่องได้หลังจาก `pnpm install`

เริ่มต้นด้วย:

```text
/acp doctor
```

หากปิดใช้งาน `acpx` ปฏิเสธผ่าน `plugins.allow` / `plugins.deny` หรือต้องการสลับกลับไปใช้ Plugin แบบแพ็กเกจ ให้ใช้พาธแพ็กเกจที่ระบุชัดเจน:

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

### โพรบการเริ่มทำงานของรันไทม์ acpx

Plugin `acpx` ฝังรันไทม์ ACP โดยตรง (ไม่มีไบนารีหรือเวอร์ชัน `acpx` แยกต่างหากให้กำหนดค่า) โดยค่าเริ่มต้น Plugin จะลงทะเบียนแบ็กเอนด์ที่ฝังไว้ระหว่างการเริ่มทำงานของ Gateway และรอโพรบการเริ่มทำงานก่อนสัญญาณ `ready` ของ Gateway ตั้งค่า `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` หรือ `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` เฉพาะสำหรับสคริปต์หรือสภาพแวดล้อมที่ตั้งใจปิดใช้งานโพรบการเริ่มทำงานเท่านั้น เรียกใช้ `/acp doctor` เพื่อเรียกโพรบแบบตามคำขออย่างชัดเจน

แทนที่คำสั่งของเอเจนต์ ACP แต่ละตัวด้วยอาร์กิวเมนต์แบบมีโครงสร้าง เมื่อพาธหรือค่าแฟล็กควรคงเป็นโทเค็น argv เดียว:

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
- `agents.<id>.args` เป็นตัวเลือก แต่ละรายการในอาร์เรย์จะถูกใส่เครื่องหมายคำพูดสำหรับเชลล์ก่อนที่ OpenClaw จะส่งผ่านรีจิสทรีสตริงคำสั่ง acpx ปัจจุบัน

โปรดดู [Plugin](/th/tools/plugin)

### การดาวน์โหลดอะแดปเตอร์อัตโนมัติ

`acpx` ดาวน์โหลดอะแดปเตอร์ ACP โดยอัตโนมัติ (ตัวอย่างเช่นบริดจ์ Claude และ Codex ACP) ผ่าน `npx` เมื่อใช้งานครั้งแรก ไม่จำเป็นต้องติดตั้งแพ็กเกจอะแดปเตอร์ด้วยตนเอง และไม่มีขั้นตอน postinstall แยกต่างหากสำหรับ OpenClaw หากการดาวน์โหลดหรือการสร้างอะแดปเตอร์ล้มเหลว `/acp doctor` จะรายงานความล้มเหลว

### บริดจ์ MCP สำหรับเครื่องมือ Plugin

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดย Plugin ของ OpenClaw ให้แก่ฮาร์เนส ACP

หากต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้เครื่องมือของ Plugin OpenClaw ที่ติดตั้งไว้ เช่น การเรียกคืน/จัดเก็บหน่วยความจำ ให้เปิดใช้งานบริดจ์เฉพาะ:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่จะเกิดขึ้น:

- แทรกเซิร์ฟเวอร์ MCP ที่มีมาให้ในตัวชื่อ `openclaw-plugin-tools` ลงในการบูตสแตรปเซสชัน ACPX
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย Plugin OpenClaw ที่ติดตั้งและเปิดใช้งานอยู่
- ส่งข้อมูลระบุตัวตนของเซสชัน ACP ที่ใช้งานอยู่ไปยังแฟกทอรีเครื่องมือ Plugin เพื่อให้เครื่องมือที่กำหนดขอบเขตตามเอเจนต์ยังคงอยู่ในเนมสเปซของเอเจนต์นั้น
- กำหนดให้ฟีเจอร์นี้ต้องเปิดใช้งานอย่างชัดเจนและปิดไว้โดยค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความเชื่อถือ:

- การดำเนินการนี้ขยายพื้นผิวเครื่องมือของฮาร์เนส ACP
- เอเจนต์ ACP เข้าถึงได้เฉพาะเครื่องมือ Plugin ที่ทำงานอยู่แล้วใน Gateway
- ให้ถือว่าสิ่งนี้มีขอบเขตความเชื่อถือเดียวกับการอนุญาตให้ Plugin เหล่านั้นทำงานภายใน OpenClaw เอง
- ตรวจสอบ Plugin ที่ติดตั้งไว้ก่อนเปิดใช้งาน

`mcpServers` แบบกำหนดเองยังคงทำงานเหมือนเดิม บริดจ์เครื่องมือ Plugin ที่มีมาให้ในตัวเป็นความสะดวกเพิ่มเติมแบบเลือกใช้ ไม่ใช่สิ่งทดแทนการกำหนดค่าเซิร์ฟเวอร์ MCP ทั่วไป

### บริดจ์ MCP สำหรับเครื่องมือ OpenClaw

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือ OpenClaw ที่มีมาให้ในตัวผ่าน MCP เช่นกัน เปิดใช้งานบริดจ์เครื่องมือแกนหลักแยกต่างหากเมื่อเอเจนต์ ACP ต้องใช้เครื่องมือที่มีมาให้ในตัวบางรายการ เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่จะเกิดขึ้น:

- แทรกเซิร์ฟเวอร์ MCP ที่มีมาให้ในตัวชื่อ `openclaw-tools` ลงในการบูตสแตรปเซสชัน ACPX
- เปิดเผยเครื่องมือ OpenClaw ที่มีมาให้ในตัวบางรายการ เซิร์ฟเวอร์เริ่มต้นเปิดเผย `cron`
- กำหนดให้การเปิดเผยเครื่องมือแกนหลักต้องเปิดใช้งานอย่างชัดเจนและปิดไว้โดยค่าเริ่มต้น

### การกำหนดค่าระยะหมดเวลาการดำเนินงานของรันไทม์

Plugin `acpx` ให้เวลาการเริ่มทำงานของรันไทม์แบบฝังและการดำเนินการควบคุม 120 วินาทีโดยค่าเริ่มต้น ซึ่งทำให้ฮาร์เนสที่ทำงานช้ากว่า เช่น Gemini CLI มีเวลาเพียงพอในการเริ่มทำงานและเตรียมใช้งาน ACP ให้เสร็จสมบูรณ์ แทนที่ค่านี้หากโฮสต์ต้องการขีดจำกัดการดำเนินงานที่แตกต่างออกไป:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รอบการทำงานของรันไทม์ใช้ระยะหมดเวลาของเอเจนต์/การทำงาน OpenClaw รวมถึง `/acp timeout`
`sessions_spawn` ไม่ยอมรับการแทนที่ระยะหมดเวลาต่อการเรียก พาธสำหรับผู้ดูแลระบบคือ `agents.defaults.subagents.runTimeoutSeconds` รีสตาร์ต Gateway หลังจากเปลี่ยน `timeoutSeconds`

### การกำหนดค่าเอเจนต์สำหรับโพรบสถานะ

เมื่อ `/acp doctor` หรือโพรบการเริ่มทำงานตรวจสอบแบ็กเอนด์ Plugin `acpx` ที่รวมมาให้จะโพรบเอเจนต์ฮาร์เนสหนึ่งตัว หากตั้งค่า `acp.allowedAgents` ค่าเริ่มต้นจะเป็นเอเจนต์ตัวแรกที่อนุญาต มิฉะนั้นค่าเริ่มต้นจะเป็น `codex` หากการติดตั้งใช้งานต้องใช้เอเจนต์ ACP อื่นสำหรับการตรวจสอบสถานะ ให้ตั้งค่าเอเจนต์โพรบอย่างชัดเจน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบไม่โต้ตอบ — ไม่มี TTY สำหรับอนุมัติหรือปฏิเสธพรอมต์ขอสิทธิ์เขียนไฟล์และเรียกใช้เชลล์ Plugin acpx มีคีย์การกำหนดค่า 2 คีย์ที่ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ของชุดควบคุม ACPX เหล่านี้แยกจากการอนุมัติการเรียกใช้ของ OpenClaw และแยกจากแฟล็กข้ามข้อจำกัดของผู้ให้บริการแบ็กเอนด์ CLI เช่น Claude CLI `--permission-mode bypassPermissions` โดย ACPX `approve-all` เป็นสวิตช์ฉุกเฉินระดับชุดควบคุมสำหรับเซสชัน ACP

สำหรับการเปรียบเทียบโดยรวมระหว่าง OpenClaw `tools.exec.mode`, การอนุมัติของ Codex Guardian
และสิทธิ์ของชุดควบคุม ACPX โปรดดู
[โหมดสิทธิ์](/th/tools/permission-modes)

### `permissionMode`

ควบคุมว่าตัวแทนของชุดควบคุมสามารถดำเนินการใดได้โดยไม่ต้องแสดงพรอมต์

| ค่า           | ลักษณะการทำงาน                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่งเชลล์ทั้งหมดโดยอัตโนมัติ          |
| `approve-reads` | อนุมัติเฉพาะการอ่านโดยอัตโนมัติ ส่วนการเขียนและการเรียกใช้ต้องแสดงพรอมต์ |
| `deny-all`      | ปฏิเสธพรอมต์ขอสิทธิ์ทั้งหมด                              |

### `nonInteractivePermissions`

ควบคุมสิ่งที่จะเกิดขึ้นเมื่อควรแสดงพรอมต์ขอสิทธิ์ แต่ไม่มี TTY แบบโต้ตอบให้ใช้งาน (ซึ่งเป็นกรณีของเซสชัน ACP เสมอ)

| ค่า  | ลักษณะการทำงาน                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | ยกเลิกเซสชันด้วย `PermissionPromptUnavailableError` **(ค่าเริ่มต้น)** |
| `deny` | ปฏิเสธสิทธิ์โดยไม่แจ้งและดำเนินการต่อ (ลดระดับการทำงานอย่างราบรื่น)        |

### การกำหนดค่า

ตั้งค่าผ่านการกำหนดค่าของ Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่าเหล่านี้

<Warning>
ค่าเริ่มต้นของ OpenClaw คือ `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือการเรียกใช้ใด ๆ ที่กระตุ้นพรอมต์ขอสิทธิ์อาจล้มเหลวด้วย `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`

หากจำเป็นต้องจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับการทำงานอย่างราบรื่นแทนที่จะหยุดทำงาน
</Warning>

## ที่เกี่ยวข้อง

- [ตัวแทน ACP](/th/tools/acp-agents) — ภาพรวม คู่มือการปฏิบัติงาน แนวคิด
- [ตัวแทนย่อย](/th/tools/subagents)
- [การกำหนดเส้นทางหลายตัวแทน](/th/concepts/multi-agent)
