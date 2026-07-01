---
read_when:
    - คุณต้องการตัวเลือกสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังใช้งาน AI CLI ในเครื่องและต้องการนำมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจบริดจ์ MCP local loopback สำหรับการเข้าถึงเครื่องมือแบ็กเอนด์ของ CLI
summary: 'แบ็กเอนด์ CLI: การสำรองไปใช้ CLI AI ภายในเครื่องพร้อมสะพานเครื่องมือ MCP แบบไม่บังคับ'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-07-01T08:43:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **CLI AI แบบ local** เป็น **ทางเลือกสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ล่ม,
ถูกจำกัดอัตรา, หรือทำงานผิดปกติชั่วคราว แนวทางนี้ตั้งใจให้รอบคอบเป็นพิเศษ:

- **เครื่องมือ OpenClaw จะไม่ถูกฉีดเข้าไปโดยตรง** แต่ backend ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือ gateway ผ่านสะพาน MCP แบบ local loopback ได้
- **JSONL streaming** สำหรับ CLI ที่รองรับ
- **รองรับ session** (เพื่อให้รอบสนทนาต่อเนื่องยังคงสอดคล้องกัน)
- **สามารถส่งภาพผ่านได้** หาก CLI รับ path ของภาพ

สิ่งนี้ออกแบบมาเป็น **ตาข่ายนิรภัย** มากกว่าจะเป็นเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบข้อความที่ "ใช้งานได้เสมอ" โดยไม่ต้องพึ่งพา API ภายนอก

หากคุณต้องการ runtime harness เต็มรูปแบบพร้อมการควบคุม session ของ ACP, งานเบื้องหลัง,
การผูก thread/conversation, และ session การเขียนโค้ดภายนอกแบบถาวร ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน CLI backend ไม่ใช่ ACP

<Tip>
  กำลังสร้าง Plugin backend ใหม่อยู่หรือไม่ ใช้
  [Plugin backend CLI](/th/plugins/cli-backend-plugins) หน้านี้มีไว้สำหรับผู้ใช้
  ที่กำหนดค่าและใช้งาน backend ที่ลงทะเบียนไว้แล้ว
</Tip>

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Claude Code CLI **โดยไม่ต้องมี config ใดๆ** (Plugin Anthropic ที่มาพร้อมชุด
จะลงทะเบียน backend เริ่มต้นไว้):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` คือ agent id เริ่มต้นเมื่อไม่มีการกำหนดรายการ agent อย่างชัดเจน หาก
คุณใช้หลาย agent ให้แทนที่ด้วย agent id ที่คุณต้องการเรียกใช้

หาก gateway ของคุณทำงานภายใต้ launchd/systemd และ PATH มีค่าน้อยที่สุด ให้เพิ่มเฉพาะ
path ของคำสั่ง:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

เท่านี้ก็พอ ไม่ต้องมี key และไม่ต้องมี config การยืนยันตัวตนเพิ่มเติมนอกเหนือจาก CLI เอง

หากคุณใช้ CLI backend ที่มาพร้อมชุดเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่มาพร้อมชุดซึ่งเป็นเจ้าของโดยอัตโนมัติ เมื่อ config ของคุณ
อ้างอิง backend นั้นอย่างชัดเจนใน model ref หรือใต้
`agents.defaults.cliBackends`

## การใช้เป็นทางเลือกสำรอง

เพิ่ม CLI backend เข้าในรายการ fallback เพื่อให้ทำงานเฉพาะเมื่อ model หลักล้มเหลว:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

หมายเหตุ:

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องรวม model ของ CLI backend ไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (auth, rate limits, timeouts) OpenClaw จะ
  ลองใช้ CLI backend ถัดไป

## ภาพรวมการกำหนดค่า

CLI backend ทั้งหมดอยู่ใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการใช้ **provider id** เป็น key (เช่น `claude-cli`, `my-cli`)
provider id จะกลายเป็นฝั่งซ้ายของ model ref ของคุณ:

```
<provider>/<model>
```

### ตัวอย่างการกำหนดค่า

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## วิธีการทำงาน

1. **เลือก backend** ตาม prefix ของผู้ให้บริการ (`claude-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt ของ OpenClaw และ context ของ workspace เดียวกัน
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังสอดคล้องกัน
   backend `claude-cli` ที่มาพร้อมชุดจะคง process stdio ของ Claude ไว้หนึ่ง process ต่อ
   session ของ OpenClaw และส่งรอบสนทนาต่อเนื่องผ่าน stream-json stdin
4. **แยกวิเคราะห์ output** (JSON หรือข้อความธรรมดา) แล้วส่งคืนข้อความสุดท้าย
5. **คง session id ไว้** ต่อ backend เพื่อให้รอบสนทนาต่อเนื่องใช้ session CLI เดิมซ้ำ

<Note>
รองรับ backend Anthropic `claude-cli` ที่มาพร้อมชุดอีกครั้งแล้ว เจ้าหน้าที่ Anthropic
แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw อนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้งาน `claude -p` ได้รับอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

backend Anthropic `claude-cli` ที่มาพร้อมชุดจะเลือกใช้ resolver ของ skill แบบ native ของ Claude Code
สำหรับ Skills ของ OpenClaw เมื่อ snapshot ของ skills ปัจจุบันมี skill ที่เลือกอย่างน้อย
หนึ่งรายการพร้อม path ที่ materialized แล้ว OpenClaw จะส่ง Plugin Claude
Code ชั่วคราวพร้อม `--plugin-dir` และละเว้น catalog Skills ของ OpenClaw ที่ซ้ำกัน
จาก system prompt ที่ต่อท้าย หาก snapshot ไม่มี plugin
skill ที่ materialized OpenClaw จะเก็บ catalog ใน prompt ไว้เป็น fallback ค่า override ของ env/API key ของ skill
ยังคงถูก OpenClaw นำไปใช้กับ environment ของ process ลูกสำหรับการรัน

Claude CLI ยังมีโหมด permission แบบ noninteractive ของตัวเอง OpenClaw จับคู่โหมดนั้น
กับนโยบาย exec ที่มีอยู่แทนการเพิ่ม config นโยบายเฉพาะ Claude
สำหรับ session Claude live ที่ OpenClaw จัดการ นโยบาย exec ของ OpenClaw ที่มีผล
ถือเป็นตัวกำหนดหลัก: YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`) จะเปิด Claude ด้วย
`--permission-mode bypassPermissions` ในขณะที่นโยบาย exec ที่มีผลแบบจำกัด
จะเปิด Claude ด้วย `--permission-mode default` การตั้งค่า
`agents.list[].tools.exec` ต่อ agent จะ override `tools.exec` ส่วนกลางสำหรับ
agent นั้น args ดิบของ backend Claude ยังอาจมี `--permission-mode` ได้ แต่การเปิดใช้งาน Claude แบบ live
จะ normalize flag นั้นให้ตรงกับนโยบาย exec ของ OpenClaw ที่มีผล

backend Anthropic `claude-cli` ที่มาพร้อมชุดยังจับคู่ระดับ OpenClaw `/think`
กับ flag native `--effort` ของ Claude Code สำหรับระดับที่ไม่ใช่ off `minimal` และ
`low` จับคู่กับ `low`, `adaptive` และ `medium` จับคู่กับ `medium`, และ `high`,
`xhigh`, และ `max` จับคู่โดยตรง CLI backend อื่นต้องให้ Plugin เจ้าของ
ประกาศ argv mapper ที่เทียบเท่าก่อนที่ `/think` จะส่งผลต่อ CLI ที่ spawn ได้

ก่อนที่ OpenClaw จะใช้ backend `claude-cli` ที่มาพร้อมชุดได้ Claude Code เอง
ต้องเข้าสู่ระบบไว้แล้วบนโฮสต์เดียวกัน:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

การติดตั้ง Docker ต้องติดตั้ง Claude Code และเข้าสู่ระบบไว้ภายใน home ของ container
ที่คงอยู่ ไม่ใช่เฉพาะบนโฮสต์ ดู
[backend Claude CLI ใน Docker](/th/install/docker#claude-cli-backend-in-docker)

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อ binary `claude`
ยังไม่ได้อยู่บน `PATH`

## Session

- หาก CLI รองรับ session ให้ตั้งค่า `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  เข้าในหลาย flag
- หาก CLI ใช้ **subcommand สำหรับ resume** พร้อม flag ที่ต่างกัน ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และตั้งค่า `resumeOutput`
  เพิ่มเติมได้ (สำหรับ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (UUID ใหม่หากไม่มีที่จัดเก็บไว้)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยจัดเก็บไว้ก่อนหน้า
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้รอบสนทนาต่อเนื่องใช้ process Claude แบบ live ซ้ำขณะที่
  ยังทำงานอยู่ Warm stdio เป็นค่าเริ่มต้นแล้ว รวมถึง custom config
  ที่ละเว้น field transport หาก Gateway restart หรือ process ที่ idle
  ออก OpenClaw จะ resume จาก session id ของ Claude ที่จัดเก็บไว้ session
  id ที่จัดเก็บไว้จะถูกตรวจสอบกับ transcript ของโปรเจกต์ที่มีอยู่และอ่านได้ก่อน
  resume ดังนั้น binding ที่ไม่มีจริงจะถูกล้างด้วย `reason=transcript-missing`
  แทนการเริ่ม session Claude CLI ใหม่แบบเงียบๆ ใต้ `--resume`
- session Claude live จะคง guard output JSONL แบบมีขอบเขต ค่าเริ่มต้นอนุญาตสูงสุด
  8 MiB และ 20,000 บรรทัด JSONL ดิบต่อรอบสนทนา รอบสนทนา Claude ที่ใช้เครื่องมือมากสามารถเพิ่ม
  ค่าเหล่านี้ต่อ backend ด้วย
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  และ `maxTurnLines`; OpenClaw จะ clamp การตั้งค่าเหล่านั้นไว้ที่ 64 MiB และ 100,000
  บรรทัด
- session CLI ที่จัดเก็บไว้คือความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การ reset session รายวัน
  โดยนัยจะไม่ตัด session เหล่านั้น; `/reset` และนโยบาย `session.reset` ที่ชัดเจนยังคง
  ตัด session
- session CLI ใหม่โดยปกติจะ reseed เฉพาะจากสรุป Compaction ของ OpenClaw
  บวก tail หลัง compaction เพื่อกู้คืน session สั้นที่ถูกทำให้ใช้ไม่ได้
  ก่อน compaction backend สามารถ opt in ด้วย
  `reseedFromRawTranscriptWhenUncompacted: true` OpenClaw ยังคงจำกัด raw
  transcript reseed และจำกัดไว้สำหรับการทำให้ใช้ไม่ได้ที่ปลอดภัย เช่น transcript
  CLI หายไป, การเปลี่ยน system-prompt/MCP, หรือ retry จาก session-expired; การเปลี่ยน
  auth profile หรือ credential-epoch จะไม่ reseed ประวัติ raw transcript

หมายเหตุเกี่ยวกับ serialization:

- `serialize: true` จะรักษาลำดับการรันใน lane เดียวกัน
- CLI ส่วนใหญ่ serialize บน lane ผู้ให้บริการเดียว
- OpenClaw จะเลิกใช้ session CLI ที่จัดเก็บไว้ซ้ำเมื่อ identity การยืนยันตัวตนที่เลือกเปลี่ยน
  รวมถึง auth profile id, static API key, static token, หรือ identity ของบัญชี OAuth
  ที่เปลี่ยนไปเมื่อ CLI เปิดเผยค่า OAuth access และ refresh token
  ที่หมุนเวียนจะไม่ตัด session CLI ที่จัดเก็บไว้ หาก CLI ไม่เปิดเผย
  OAuth account id ที่เสถียร OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้ permission สำหรับ resume

## Prelude fallback จาก session claude-cli

เมื่อความพยายาม `claude-cli` fail over ไปยัง candidate ที่ไม่ใช่ CLI ใน
[`agents.defaults.model.fallbacks`](/th/concepts/model-failover), OpenClaw จะ seed
ความพยายามถัดไปด้วย context prelude ที่เก็บจาก transcript JSONL ในเครื่องของ Claude Code
ที่ `~/.claude/projects/` หากไม่มี seed นี้ ผู้ให้บริการ fallback
จะเริ่มแบบเย็นเพราะ transcript session ของ OpenClaw เองว่างเปล่า
สำหรับการรัน `claude-cli`

- prelude จะเลือกสรุป `/compact` ล่าสุดหรือ marker `compact_boundary`
  ก่อน แล้วต่อท้ายรอบสนทนาหลัง boundary ล่าสุดเท่าที่อยู่ในงบอักขระ
  รอบสนทนาก่อน boundary จะถูกทิ้งเพราะสรุปเป็นตัวแทนของรอบเหล่านั้นแล้ว
- บล็อกเครื่องมือจะถูกรวมเป็น hint ขนาดกะทัดรัด `(tool call: name)` และ
  `(tool result: …)` เพื่อรักษางบ prompt ให้ตรงจริง สรุปจะถูกติดป้าย
  `(truncated)` หากเกินขนาด
- fallback จาก `claude-cli` ไป `claude-cli` ผู้ให้บริการเดียวกันจะพึ่งพา
  `--resume` ของ Claude เองและข้าม prelude
- seed ใช้การตรวจสอบ path ของ session-file Claude ที่มีอยู่ซ้ำ ดังนั้น
  จึงไม่สามารถอ่าน path ตามอำเภอใจได้

## ภาพ (ส่งผ่าน)

หาก CLI ของคุณรับ path ของภาพ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนภาพ base64 ลงไฟล์ temp หากตั้งค่า `imageArg` ไว้ path เหล่านั้น
จะถูกส่งเป็น args ของ CLI หากไม่มี `imageArg` OpenClaw จะต่อท้าย
path ของไฟล์เข้ากับ prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ local จาก path ธรรมดาโดยอัตโนมัติ

## Input / output

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับ output JSON ของ Gemini CLI, OpenClaw อ่านข้อความตอบกลับจาก `response` และ usage
  จาก `stats` เมื่อ `usage` หายไปหรือว่างเปล่า ค่าเริ่มต้น Gemini CLI ที่มาพร้อมชุด
  ใช้ `stream-json` แต่ override เก่า `--output-format json` ยังคงใช้
  parser JSON
- `output: "jsonl"` แยกวิเคราะห์ stream JSONL และดึงข้อความ agent สุดท้ายพร้อม session
  identifier เมื่อมี
- `output: "text"` ถือว่า stdout เป็นคำตอบสุดท้าย

โหมด input:

- `input: "arg"` (ค่าเริ่มต้น) ส่งพรอมป์เป็นอาร์กิวเมนต์ CLI ตัวสุดท้าย
- `input: "stdin"` ส่งพรอมป์ผ่าน stdin
- หากพรอมป์ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (เป็นของ Plugin)

ค่าเริ่มต้นของแบ็กเอนด์ CLI ที่รวมมาอยู่กับ Plugin เจ้าของ ตัวอย่างเช่น
Anthropic เป็นเจ้าของ `claude-cli` และ Google เป็นเจ้าของ `google-gemini-cli` การรันเอเจนต์ OpenAI Codex
ใช้ฮาร์เนส app-server ของ Codex ผ่าน `openai/*`; OpenClaw
ไม่ลงทะเบียนแบ็กเอนด์ `codex-cli` ที่รวมมาอีกต่อไป

Plugin Anthropic ที่รวมมาลงทะเบียนค่าเริ่มต้นสำหรับ `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Plugin Google ที่รวมมาก็ลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` เช่นกัน:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI ในเครื่องและเรียกใช้ได้เป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุเอาต์พุต Gemini CLI:

- ตัวแยกวิเคราะห์ `stream-json` ค่าเริ่มต้นอ่านเหตุการณ์ `message` ของผู้ช่วย เหตุการณ์เครื่องมือ
  การใช้งาน `result` สุดท้าย และเหตุการณ์ข้อผิดพลาดร้ายแรงของ Gemini
- หากคุณเขียนทับอาร์กิวเมนต์ Gemini เป็น `--output-format json` OpenClaw จะปรับ
  แบ็กเอนด์นั้นกลับเป็น `output: "json"` และอ่านข้อความตอบกลับจากฟิลด์ JSON `response`
- การใช้งานจะย้อนกลับไปใช้ `stats` เมื่อ `usage` ไม่มีอยู่หรือว่าง
- `stats.cached` ถูกปรับให้เป็น `cacheRead` ของ OpenClaw
- หาก `stats.input` ขาดหาย OpenClaw จะคำนวณโทเค็นอินพุตจาก
  `stats.input_tokens - stats.cached`

เขียนทับเฉพาะเมื่อจำเป็นเท่านั้น (ที่พบบ่อย: พาธ `command` แบบสมบูรณ์)

## ค่าเริ่มต้นที่เป็นของ Plugin

ค่าเริ่มต้นของแบ็กเอนด์ CLI ตอนนี้เป็นส่วนหนึ่งของพื้นผิว Plugin:

- Plugins ลงทะเบียนด้วย `api.registerCliBackend(...)`
- `id` ของแบ็กเอนด์กลายเป็นคำนำหน้าผู้ให้บริการใน model refs
- การกำหนดค่าผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคงเขียนทับค่าเริ่มต้นของ Plugin
- การล้างค่ากำหนดเฉพาะแบ็กเอนด์ยังคงเป็นของ Plugin ผ่านฮุกเสริม
  `normalizeConfig`

Plugins ที่ต้องการชิมความเข้ากันได้ของพรอมป์/ข้อความขนาดเล็กสามารถประกาศ
การแปลงข้อความสองทางได้โดยไม่ต้องแทนที่ผู้ให้บริการหรือแบ็กเอนด์ CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` เขียนพรอมป์ระบบและพรอมป์ผู้ใช้ที่ส่งให้ CLI ใหม่ `output`
เขียนข้อความผู้ช่วยที่สตรีมและข้อความสุดท้ายที่แยกวิเคราะห์แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
มาร์กเกอร์ควบคุมของตัวเองและการส่งมอบผ่านช่องทาง สำหรับการเรียกโมเดลที่มีผู้ให้บริการหนุนหลัง
`output` ยังคืนค่าข้อความภายในอาร์กิวเมนต์ tool-call แบบมีโครงสร้าง หลังจาก
ซ่อมแซมสตรีมและก่อนการเรียกใช้เครื่องมือ เศษ JSON ดิบจากผู้ให้บริการยังคง
ไม่เปลี่ยนแปลง ผู้บริโภคควรใช้เพย์โหลดบางส่วน สิ้นสุด หรือผลลัพธ์แบบมีโครงสร้าง

สำหรับ CLI ที่ปล่อยเหตุการณ์ JSONL เฉพาะผู้ให้บริการ ให้ตั้งค่า `jsonlDialect` ใน
ค่ากำหนดของแบ็กเอนด์นั้น ไดอะเล็กต์ที่รองรับคือ `claude-stream-json` สำหรับสตรีมที่เข้ากันได้กับ Claude
Code และ `gemini-stream-json` สำหรับเหตุการณ์ `stream-json` ของ Gemini CLI

## ความเป็นเจ้าของ Compaction แบบเนทีฟ

แบ็กเอนด์ CLI บางตัวรันเอเจนต์ที่ทำ Compaction ทรานสคริปต์ของ **ตัวเอง** ดังนั้น OpenClaw ต้อง
ไม่รันตัวสรุปป้องกันกับแบ็กเอนด์เหล่านั้น - การทำเช่นนั้นจะขัดกับ Compaction ของแบ็กเอนด์เอง
และอาจทำให้เทิร์นล้มเหลวอย่างหนัก

`claude-cli` ไม่มีเอ็นด์พอยต์ฮาร์เนส - Claude Code ทำ Compaction ภายใน - ดังนั้นจึงประกาศ
`ownsNativeCompaction: true` และ OpenClaw จะคืนค่า no-op จากเส้นทาง Compaction
เซสชัน native-harness เช่น Codex จะยังคงส่งต่อไปยังเอ็นด์พอยต์ Compaction ของฮาร์เนส
แทน

เนื่องจากแบ็กเอนด์เป็นเจ้าของ Compaction วิธีแก้ชั่วคราวเดิมของการตั้งค่า
`contextTokens: 1_000_000` เพียงเพื่อกันไม่ให้การป้องกันของ OpenClaw ทำงานบน
เซสชัน claude-cli จึง **ไม่จำเป็นอีกต่อไป** - การเลือกไม่ใช้มาแทนที่แล้ว

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

ประกาศ `ownsNativeCompaction` เฉพาะสำหรับแบ็กเอนด์ที่เป็นเจ้าของ Compaction ของตัวเองจริง ๆ เท่านั้น: ต้อง
จำกัดทรานสคริปต์ของตัวเองได้อย่างน่าเชื่อถือเมื่อเข้าใกล้หน้าต่างบริบท และคง
เซสชันที่กลับมาทำต่อได้ไว้ (เช่น `--resume` / `--session-id`); มิฉะนั้นเซสชันที่เลื่อนออกไปอาจ
ยังเกินงบประมาณอยู่ เซสชัน `agentHarnessId` ที่ตรงกันยังคงส่งต่อไปยังเอ็นด์พอยต์ฮาร์เนส

## โอเวอร์เลย์ Bundle MCP

แบ็กเอนด์ CLI **ไม่ได้** รับ tool calls ของ OpenClaw โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้โอเวอร์เลย์ค่ากำหนด MCP ที่สร้างขึ้นด้วย `bundleMcp: true`

พฤติกรรมที่รวมมาในปัจจุบัน:

- `claude-cli`: ไฟล์ค่ากำหนด MCP แบบเข้มงวดที่สร้างขึ้น
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้งาน bundle MCP, OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผยเครื่องมือ Gateway ให้กระบวนการ CLI
- ยืนยันตัวตนบริดจ์ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือตามเซสชัน บัญชี และบริบทช่องทางปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานสำหรับ workspace ปัจจุบัน
- รวมเข้ากับรูปร่างค่ากำหนด/การตั้งค่า MCP ของแบ็กเอนด์ที่มีอยู่
- เขียนค่ากำหนดการเปิดใช้งานใหม่โดยใช้โหมดการผสานรวมที่เป็นของแบ็กเอนด์จากส่วนขยายเจ้าของ

หากไม่มีเซิร์ฟเวอร์ MCP ที่เปิดใช้งาน OpenClaw ยังคงฉีดค่ากำหนดแบบเข้มงวดเมื่อ
แบ็กเอนด์เลือกใช้ bundle MCP เพื่อให้การรันเบื้องหลังยังแยกขอบเขตอยู่

รันไทม์ MCP ที่รวมมาแบบจำกัดตามเซสชันถูกแคชเพื่อนำมาใช้ซ้ำภายในเซสชัน จากนั้น
ถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่า `0` เพื่อปิดใช้งาน) การรันแบบฝังครั้งเดียว เช่น โพรบการยืนยันตัวตน
การสร้าง slug และคำขอเรียกคืน active-memory จะล้างข้อมูลเมื่อสิ้นสุดการรัน เพื่อให้ลูก stdio
และสตรีม Streamable HTTP/SSE ไม่อยู่ยาวกว่าการรัน

## ขีดจำกัดประวัติ reseed

เมื่อเซสชัน CLI ใหม่ถูก seed จากทรานสคริปต์ OpenClaw ก่อนหน้า (เช่น
หลังจาก retry `session_expired`) บล็อก
`<conversation_history>` ที่เรนเดอร์จะถูกจำกัดขนาดเพื่อไม่ให้พรอมป์ reseed
ขยายตัวมากเกินไป ค่าเริ่มต้นคือ `12288` อักขระ (ประมาณ 3000 โทเค็น)

แบ็กเอนด์ Claude CLI ใช้ขีดจำกัดที่ใหญ่ขึ้นโดยอัตโนมัติ ซึ่งคำนวณจาก
ระดับบริบท Claude ที่ resolve แล้ว การรัน Claude มาตรฐาน 200K-token จะเก็บชิ้นส่วนทรานสคริปต์
ที่ใหญ่กว่า และการรัน Claude 1M-token จะเก็บชิ้นส่วนที่ใหญ่ขึ้นไปอีก ขณะที่แบ็กเอนด์ CLI
อื่น ๆ ใช้ค่าเริ่มต้นแบบอนุรักษ์นิยม

- ขีดจำกัดนี้ควบคุมเฉพาะบล็อก prior-history ของพรอมป์ reseed เท่านั้น ขีดจำกัดเอาต์พุต
  live-session ถูกปรับแยกต่างหากภายใต้ `reliability.outputLimits`
  (ดู [เซสชัน](#sessions))

## ข้อจำกัด

- **ไม่มี tool calls ของ OpenClaw โดยตรง** OpenClaw ไม่ฉีด tool calls เข้าไปใน
  โปรโตคอลแบ็กเอนด์ CLI แบ็กเอนด์จะเห็นเครื่องมือ Gateway เฉพาะเมื่อเลือกใช้
  `bundleMcp: true`
- **การสตรีมขึ้นกับแบ็กเอนด์** บางแบ็กเอนด์สตรีม JSONL; บางตัวบัฟเฟอร์
  จนกว่าจะออก
- **เอาต์พุตแบบมีโครงสร้าง** ขึ้นกับรูปแบบ JSON ของ CLI

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธเต็ม
- **ชื่อโมเดลผิด**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดล CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบให้แน่ใจว่าตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none`
- **รูปภาพถูกเพิกเฉย**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway)
- [โมเดลในเครื่อง](/th/gateway/local-models)
