---
read_when:
    - การติดตั้งหรือกำหนดค่าฮาร์เนส acpx สำหรับ Claude Code / Codex / Gemini CLI
    - การเปิดใช้งานบริดจ์ MCP plugin-tools หรือ OpenClaw-tools
    - การกำหนดค่าโหมดสิทธิ์ ACP
summary: 'การตั้งค่าเอเจนต์ ACP: การกำหนดค่า harness ของ acpx, การตั้งค่า Plugin, สิทธิ์'
title: เอเจนต์ ACP — การตั้งค่า
x-i18n:
    generated_at: "2026-05-02T10:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

สำหรับภาพรวม คู่มือปฏิบัติงานของโอเปอเรเตอร์ และแนวคิด โปรดดู [เอเจนต์ ACP](/th/tools/acp-agents).

ส่วนด้านล่างครอบคลุมการกำหนดค่าฮาร์เนส acpx, การตั้งค่า Plugin สำหรับบริดจ์ MCP และการกำหนดค่าสิทธิ์

ใช้หน้านี้เฉพาะเมื่อคุณกำลังตั้งค่าเส้นทาง ACP/acpx สำหรับการกำหนดค่ารันไทม์ app-server ของ Codex แบบเนทีฟ ให้ใช้ [ฮาร์เนส Codex](/th/plugins/codex-harness) สำหรับคีย์ OpenAI API หรือการกำหนดค่า provider โมเดล OAuth ของ Codex ให้ใช้ [OpenAI](/th/providers/openai).

Codex มีเส้นทาง OpenClaw สองเส้นทาง:

| เส้นทาง                      | การกำหนดค่า/คำสั่ง                                         | หน้าการตั้งค่า                              |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| app-server ของ Codex แบบเนทีฟ    | `/codex ...`, `agentRuntime.id: "codex"`               | [ฮาร์เนส Codex](/th/plugins/codex-harness) |
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
- `pi`
- `qwen`

เมื่อ OpenClaw ใช้แบ็กเอนด์ acpx ให้ใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่การกำหนดค่า acpx ของคุณจะกำหนดนามแฝงเอเจนต์แบบกำหนดเอง
หากการติดตั้ง Cursor ในเครื่องของคุณยังคงเปิดเผย ACP เป็น `agent acp` ให้แทนที่คำสั่งเอเจนต์ `cursor` ในการกำหนดค่า acpx ของคุณแทนการเปลี่ยนค่าเริ่มต้นในตัว

การใช้ acpx CLI โดยตรงยังสามารถกำหนดเป้าหมายอะแดปเตอร์ใดก็ได้ผ่าน `--agent <command>` แต่ช่องทางเลี่ยงดิบนี้เป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

การควบคุมโมเดลขึ้นอยู่กับความสามารถของอะแดปเตอร์ การอ้างอิงโมเดล Codex ACP จะถูกทำให้เป็นรูปแบบมาตรฐานโดย OpenClaw ก่อนเริ่มต้น ฮาร์เนสอื่นต้องมี ACP `models` พร้อมการรองรับ `session/set_model`; หากฮาร์เนสไม่เปิดเผยทั้งความสามารถ ACP นั้นหรือแฟล็กโมเดลตอนเริ่มต้นของตัวเอง OpenClaw/acpx จะไม่สามารถบังคับการเลือกโมเดลได้

## การกำหนดค่าที่จำเป็น

พื้นฐาน ACP ของแกนหลัก:

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
        spawnSessions: true,
      },
    },
  },
}
```

หากการ spawn ACP ที่ผูกกับเธรดไม่ทำงาน ให้ตรวจสอบแฟล็กฟีเจอร์ของอะแดปเตอร์ก่อน:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

การผูกกับการสนทนาปัจจุบันไม่จำเป็นต้องสร้างเธรดย่อย แต่ต้องมีบริบทการสนทนาที่ใช้งานอยู่และอะแดปเตอร์ช่องทางที่เปิดเผยการผูกการสนทนา ACP

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

## การตั้งค่า Plugin สำหรับแบ็กเอนด์ acpx

การติดตั้งแบบแพ็กเกจใช้ Plugin รันไทม์ `@openclaw/acpx` อย่างเป็นทางการสำหรับ ACP
ติดตั้งและเปิดใช้งานก่อนใช้เซสชันฮาร์เนส ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

เช็กเอาต์ซอร์สยังสามารถใช้ Plugin เวิร์กสเปซในเครื่องหลังจาก `pnpm install` ได้

เริ่มด้วย:

```text
/acp doctor
```

หากคุณปิดใช้งาน `acpx`, ปฏิเสธผ่าน `plugins.allow` / `plugins.deny` หรือต้องการสลับกลับไปใช้ Plugin แบบแพ็กเกจ ให้ใช้พาธแพ็กเกจแบบระบุชัดเจน:

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

โดยค่าเริ่มต้น Plugin `acpx` จะลงทะเบียนแบ็กเอนด์ ACP แบบฝังโดยไม่ spawn เอเจนต์ ACP ระหว่างการเริ่มต้น Gateway เรียกใช้ `/acp doctor` เพื่อทำการตรวจสดแบบระบุชัดเจน ตั้งค่า `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` เฉพาะเมื่อคุณต้องการให้ Gateway ตรวจเอเจนต์ที่กำหนดค่าไว้ตอนเริ่มต้น

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

- `command` รับพาธแบบสัมบูรณ์ พาธแบบสัมพัทธ์ (resolve จากเวิร์กสเปซ OpenClaw) หรือชื่อคำสั่ง
- `expectedVersion: "any"` ปิดใช้งานการจับคู่เวอร์ชันแบบเข้มงวด
- พาธ `command` แบบกำหนดเองจะปิดใช้งานการติดตั้งอัตโนมัติภายใน Plugin

ดู [Plugin](/th/tools/plugin).

### การติดตั้ง dependency อัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบโกลบอลด้วย `npm install -g openclaw` dependency รันไทม์ acpx (ไบนารีเฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติผ่าน hook postinstall หากการติดตั้งอัตโนมัติล้มเหลว Gateway จะยังคงเริ่มทำงานตามปกติและรายงาน dependency ที่ขาดผ่าน `openclaw acp doctor`

### บริดจ์ MCP สำหรับเครื่องมือ Plugin

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดย Plugin ของ OpenClaw ให้กับฮาร์เนส ACP

หากคุณต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้เครื่องมือ Plugin ของ OpenClaw ที่ติดตั้งไว้ เช่น การเรียกคืน/จัดเก็บหน่วยความจำ ให้เปิดใช้งานบริดจ์เฉพาะ:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- ฉีดเซิร์ฟเวอร์ MCP ในตัวชื่อ `openclaw-plugin-tools` เข้าไปใน bootstrap เซสชัน ACPX
- เปิดเผยเครื่องมือ Plugin ที่ลงทะเบียนไว้แล้วโดย Plugin ของ OpenClaw ที่ติดตั้งและเปิดใช้งานอยู่
- ทำให้ฟีเจอร์นี้เป็นแบบระบุชัดเจนและปิดโดยค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความไว้วางใจ:

- สิ่งนี้ขยายพื้นผิวเครื่องมือของฮาร์เนส ACP
- เอเจนต์ ACP จะเข้าถึงได้เฉพาะเครื่องมือ Plugin ที่ใช้งานอยู่แล้วใน Gateway เท่านั้น
- ถือว่านี่เป็นขอบเขตความไว้วางใจเดียวกับการอนุญาตให้ Plugin เหล่านั้นทำงานใน OpenClaw เอง
- ตรวจสอบ Plugin ที่ติดตั้งไว้ก่อนเปิดใช้งาน

`mcpServers` แบบกำหนดเองยังคงทำงานเหมือนเดิม บริดจ์ plugin-tools ในตัวเป็นความสะดวกเพิ่มเติมแบบ opt-in ไม่ใช่สิ่งทดแทนการกำหนดค่าเซิร์ฟเวอร์ MCP ทั่วไป

### บริดจ์ MCP สำหรับเครื่องมือ OpenClaw

โดยค่าเริ่มต้น เซสชัน ACPX ยัง **ไม่** เปิดเผยเครื่องมือ OpenClaw ในตัวผ่าน MCP เปิดใช้งานบริดจ์ core-tools แยกต่างหากเมื่อเอเจนต์ ACP ต้องใช้เครื่องมือในตัวที่เลือก เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่การตั้งค่านี้ทำ:

- ฉีดเซิร์ฟเวอร์ MCP ในตัวชื่อ `openclaw-tools` เข้าไปใน bootstrap เซสชัน ACPX
- เปิดเผยเครื่องมือ OpenClaw ในตัวที่เลือก เซิร์ฟเวอร์เริ่มต้นเปิดเผย `cron`
- ทำให้การเปิดเผย core-tool เป็นแบบระบุชัดเจนและปิดโดยค่าเริ่มต้น

### การกำหนดค่า timeout ของรันไทม์

Plugin `acpx` ตั้งค่าเริ่มต้นให้เทิร์นรันไทม์แบบฝังมี timeout 120 วินาที สิ่งนี้ให้เวลาฮาร์เนสที่ช้ากว่า เช่น Gemini CLI มากพอที่จะเริ่มต้นและเตรียมใช้งาน ACP ให้เสร็จ แทนที่ค่านี้หากโฮสต์ของคุณต้องการขีดจำกัดรันไทม์ที่แตกต่าง:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่านี้

### การกำหนดค่าเอเจนต์สำหรับ health probe

เมื่อ `/acp doctor` หรือการตรวจตอนเริ่มต้นแบบ opt-in ตรวจแบ็กเอนด์ Plugin `acpx` ที่รวมมาจะตรวจฮาร์เนสเอเจนต์หนึ่งตัว หากตั้งค่า `acp.allowedAgents` ไว้ จะใช้เอเจนต์ตัวแรกที่อนุญาตเป็นค่าเริ่มต้น มิฉะนั้นจะใช้ `codex` เป็นค่าเริ่มต้น หาก deployment ของคุณต้องใช้เอเจนต์ ACP อื่นสำหรับการตรวจสุขภาพ ให้ตั้งค่าเอเจนต์ตรวจอย่างชัดเจน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP ทำงานแบบไม่โต้ตอบ ไม่มี TTY เพื่ออนุมัติหรือปฏิเสธพรอมป์สิทธิ์ file-write และ shell-exec Plugin acpx มีคีย์การกำหนดค่าสองคีย์ที่ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ฮาร์เนส ACPX เหล่านี้แยกจากการอนุมัติ exec ของ OpenClaw และแยกจากแฟล็ก bypass ของผู้ขายแบ็กเอนด์ CLI เช่น Claude CLI `--permission-mode bypassPermissions` ACPX `approve-all` คือสวิตช์ฉุกเฉินระดับฮาร์เนสสำหรับเซสชัน ACP

### `permissionMode`

ควบคุมว่าเอเจนต์ฮาร์เนสสามารถดำเนินการใดได้โดยไม่ต้องแสดงพรอมป์

| ค่า           | พฤติกรรม                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่ง shell ทั้งหมดโดยอัตโนมัติ          |
| `approve-reads` | อนุมัติเฉพาะการอ่านโดยอัตโนมัติ การเขียนและ exec ต้องใช้พรอมป์ |
| `deny-all`      | ปฏิเสธพรอมป์สิทธิ์ทั้งหมด                              |

### `nonInteractivePermissions`

ควบคุมว่าจะเกิดอะไรขึ้นเมื่อควรแสดงพรอมป์สิทธิ์แต่ไม่มี TTY แบบโต้ตอบพร้อมใช้งาน (ซึ่งเป็นกรณีเสมอสำหรับเซสชัน ACP)

| ค่า  | พฤติกรรม                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | ยกเลิกเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)**           |
| `deny` | ปฏิเสธสิทธิ์แบบเงียบและดำเนินการต่อ (การลดระดับอย่างนุ่มนวล) |

### การกำหนดค่า

ตั้งค่าผ่านการกำหนดค่า Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ต Gateway หลังจากเปลี่ยนค่าเหล่านี้

<Warning>
OpenClaw มีค่าเริ่มต้นเป็น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบไม่โต้ตอบ การเขียนหรือ exec ใดก็ตามที่ทำให้เกิดพรอมป์สิทธิ์อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

หากคุณต้องจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชันลดระดับอย่างนุ่มนวลแทนการขัดข้อง
</Warning>

## ที่เกี่ยวข้อง

- [เอเจนต์ ACP](/th/tools/acp-agents) — ภาพรวม คู่มือปฏิบัติงานของโอเปอเรเตอร์ แนวคิด
- [เอเจนต์ย่อย](/th/tools/subagents)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
