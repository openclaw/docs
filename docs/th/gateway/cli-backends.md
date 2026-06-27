---
read_when:
    - คุณต้องการตัวเลือกสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังเรียกใช้ AI CLI ในเครื่องและต้องการนำกลับมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจบริดจ์ลูปแบ็ก MCP สำหรับการเข้าถึงเครื่องมือแบ็กเอนด์ของ CLI
summary: 'แบ็กเอนด์ CLI: การสำรองเป็น AI CLI ในเครื่องพร้อมบริดจ์เครื่องมือ MCP แบบเลือกได้'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-06-27T17:32:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **AI CLI ภายในเครื่อง** เป็น **ทางเลือกสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ล่ม,
ถูกจำกัดอัตรา, หรือทำงานผิดปกติชั่วคราว แนวทางนี้ตั้งใจให้ระมัดระวัง:

- **เครื่องมือของ OpenClaw จะไม่ถูกฉีดเข้าไปโดยตรง** แต่ backend ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือ Gateway ผ่านสะพาน MCP แบบ local loopback ได้
- **การสตรีม JSONL** สำหรับ CLI ที่รองรับ
- **รองรับ session** (เพื่อให้รอบสนทนาต่อเนื่องยังคงสอดคล้องกัน)
- **สามารถส่งรูปภาพผ่านได้** หาก CLI รับ path ของรูปภาพ

สิ่งนี้ออกแบบมาเป็น **ตาข่ายนิรภัย** มากกว่าจะเป็นเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบแบบข้อความที่ "ใช้งานได้เสมอ" โดยไม่ต้องพึ่งพา API ภายนอก

หากคุณต้องการ runtime harness เต็มรูปแบบที่มีการควบคุม session ของ ACP, งานเบื้องหลัง,
การผูก thread/conversation, และ session การเขียนโค้ดภายนอกแบบถาวร ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน CLI backend ไม่ใช่ ACP

<Tip>
  กำลังสร้าง backend plugin ใหม่อยู่หรือไม่ ใช้
  [CLI backend plugins](/th/plugins/cli-backend-plugins) หน้านี้มีไว้สำหรับผู้ใช้
  ที่กำหนดค่าและปฏิบัติการ backend ที่ลงทะเบียนไว้แล้ว
</Tip>

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Claude Code CLI **โดยไม่ต้องมี config ใดๆ** (Anthropic plugin ที่บันเดิลมา
จะลงทะเบียน backend เริ่มต้นไว้):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` คือ agent id เริ่มต้นเมื่อไม่ได้กำหนดรายการ agent อย่างชัดเจน หาก
คุณใช้หลาย agent ให้แทนที่ด้วย agent id ที่คุณต้องการเรียกใช้

หาก Gateway ของคุณทำงานภายใต้ launchd/systemd และ PATH มีค่าน้อยมาก ให้เพิ่มเฉพาะ
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

เท่านี้ก็พอ ไม่ต้องมี key ไม่ต้องมี auth config เพิ่มเติมนอกเหนือจาก CLI เอง

หากคุณใช้ CLI backend ที่บันเดิลมาเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ Gateway ตอนนี้ OpenClaw จะโหลด plugin ที่บันเดิลมาและเป็นเจ้าของโดยอัตโนมัติเมื่อ config ของคุณ
อ้างอิง backend นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้เป็นทางเลือกสำรอง

เพิ่ม CLI backend ลงในรายการ fallback เพื่อให้ทำงานเฉพาะเมื่อ model หลักล้มเหลว:

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

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องรวม model ของ CLI backend ไว้ในนั้นด้วย
- หากผู้ให้บริการหลักล้มเหลว (auth, rate limit, timeout) OpenClaw จะ
  ลอง CLI backend เป็นลำดับถัดไป

## ภาพรวมการกำหนดค่า

CLI backend ทั้งหมดอยู่ภายใต้:

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

1. **เลือก backend** ตาม provider prefix (`claude-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt ของ OpenClaw และบริบท workspace ชุดเดียวกัน
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   backend `claude-cli` ที่บันเดิลมาจะคง process Claude stdio ไว้ต่อ
   session ของ OpenClaw และส่งรอบสนทนาต่อเนื่องผ่าน stream-json stdin
4. **แยกวิเคราะห์ output** (JSON หรือข้อความธรรมดา) และส่งคืนข้อความสุดท้าย
5. **คง session id ไว้** ต่อ backend เพื่อให้รอบสนทนาต่อเนื่องใช้ session CLI เดิมซ้ำ

<Note>
backend Anthropic `claude-cli` ที่บันเดิลมากลับมารองรับอีกครั้ง เจ้าหน้าที่ Anthropic
แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้ `claude -p` ได้รับการรับรองสำหรับ integration นี้ เว้นแต่ว่า Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

backend Anthropic `claude-cli` ที่บันเดิลมาจะเลือกใช้ตัวแก้ Skills แบบเนทีฟของ Claude Code
สำหรับ Skills ของ OpenClaw เมื่อ snapshot ของ Skills ปัจจุบันมี
skill ที่เลือกไว้อย่างน้อยหนึ่งรายการพร้อม path ที่ materialize แล้ว OpenClaw จะส่ง Claude
Code plugin ชั่วคราวพร้อม `--plugin-dir` และละเว้นแคตตาล็อก Skills ของ OpenClaw ที่ซ้ำกัน
จาก system prompt ที่ต่อท้าย หาก snapshot ไม่มี plugin
skill ที่ materialize แล้ว OpenClaw จะเก็บแคตตาล็อกใน prompt ไว้เป็น fallback การ override env/API key
ของ skill ยังคงถูก OpenClaw นำไปใช้กับสภาพแวดล้อมของ process ลูกสำหรับการ
รัน

Claude CLI ยังมีโหมด permission แบบ noninteractive ของตัวเอง OpenClaw map สิ่งนั้น
เข้ากับ exec policy ที่มีอยู่แทนที่จะเพิ่ม config policy เฉพาะ Claude
สำหรับ session Claude live ที่ OpenClaw จัดการ exec policy ของ OpenClaw ที่มีผลบังคับใช้เป็น
ตัวกำหนดหลัก: YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`) จะเปิด Claude ด้วย
`--permission-mode bypassPermissions` ขณะที่ exec policy ที่มีผลบังคับใช้แบบจำกัด
จะเปิด Claude ด้วย `--permission-mode default` การตั้งค่า
`agents.list[].tools.exec` ต่อ agent จะ override `tools.exec` ส่วนกลางสำหรับ
agent นั้น args ดิบของ Claude backend อาจยังมี `--permission-mode` ได้ แต่การเปิด Claude แบบ live
จะ normalize flag นั้นให้ตรงกับ exec policy ของ OpenClaw ที่มีผลบังคับใช้

backend Anthropic `claude-cli` ที่บันเดิลมายัง map ระดับ `/think` ของ OpenClaw
ไปยัง flag `--effort` แบบเนทีฟของ Claude Code สำหรับระดับที่ไม่ใช่ off `minimal` และ
`low` map ไปที่ `low`, `adaptive` และ `medium` map ไปที่ `medium`, และ `high`,
`xhigh`, และ `max` map โดยตรง CLI backend อื่นต้องให้ plugin เจ้าของ
ประกาศ argv mapper ที่เทียบเท่าก่อนที่ `/think` จะส่งผลต่อ CLI ที่ spawn ได้

ก่อนที่ OpenClaw จะใช้ backend `claude-cli` ที่บันเดิลมาได้ Claude Code เอง
ต้อง login อยู่แล้วบนโฮสต์เดียวกัน:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

การติดตั้ง Docker ต้องติดตั้ง Claude Code และ login ภายใน home ของ container ที่คงอยู่
ไม่ใช่เฉพาะบนโฮสต์ ดู
[Claude CLI backend ใน Docker](/th/install/docker#claude-cli-backend-in-docker)

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อ binary `claude`
ไม่ได้อยู่ใน `PATH` อยู่แล้ว

## Session

- หาก CLI รองรับ session ให้ตั้งค่า `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  ลงในหลาย flag
- หาก CLI ใช้ **resume subcommand** พร้อม flag ที่แตกต่างกัน ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และจะตั้งค่า `resumeOutput`
  ด้วยก็ได้ (สำหรับการ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (UUID ใหม่หากยังไม่มีที่เก็บไว้)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยมีที่เก็บไว้ก่อนหน้า
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้รอบสนทนาต่อเนื่องใช้ process Claude แบบ live ซ้ำขณะที่
  ยังทำงานอยู่ warm stdio เป็นค่าเริ่มต้นในตอนนี้ รวมถึงสำหรับ custom config
  ที่ละเว้น transport field หาก Gateway restart หรือ process ที่ idle
  ออก OpenClaw จะ resume จาก session id ของ Claude ที่เก็บไว้ session
  id ที่เก็บไว้จะถูกตรวจสอบกับ transcript โปรเจกต์ที่อ่านได้ที่มีอยู่ก่อน
  resume ดังนั้น phantom binding จะถูกล้างพร้อม `reason=transcript-missing`
  แทนที่จะเริ่ม session Claude CLI ใหม่อย่างเงียบๆ ภายใต้ `--resume`
- session Claude แบบ live จะคง guard ของ output JSONL แบบมีขอบเขตไว้ ค่าเริ่มต้นอนุญาตสูงสุด
  8 MiB และ 20,000 บรรทัด JSONL ดิบต่อรอบสนทนา รอบสนทนา Claude ที่ใช้เครื่องมือมากสามารถเพิ่ม
  ค่าเหล่านี้ต่อ backend ด้วย
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  และ `maxTurnLines`; OpenClaw จะ clamp การตั้งค่าเหล่านั้นไว้ที่ 64 MiB และ 100,000
  บรรทัด
- session CLI ที่เก็บไว้เป็นความต่อเนื่องที่ provider เป็นเจ้าของ การ reset session รายวันโดยนัย
  จะไม่ตัด session เหล่านั้น; `/reset` และ policy `session.reset` ที่ชัดเจนยังคง
  ตัดได้
- session CLI ใหม่โดยปกติจะ reseed เฉพาะจากสรุป Compaction ของ OpenClaw
  รวมกับ tail หลัง Compaction เพื่อกู้คืน session สั้นๆ ที่ถูกทำให้ใช้ไม่ได้
  ก่อน Compaction backend สามารถ opt in ด้วย
  `reseedFromRawTranscriptWhenUncompacted: true` OpenClaw ยังคงจำกัดขอบเขต
  การ reseed transcript ดิบและจำกัดไว้เฉพาะ invalidation ที่ปลอดภัย เช่น transcript
  CLI หายไป, การเปลี่ยน system-prompt/MCP, หรือ retry จาก session-expired; การเปลี่ยน
  auth profile หรือ credential-epoch จะไม่ reseed ประวัติ transcript ดิบ

หมายเหตุเกี่ยวกับ serialization:

- `serialize: true` ทำให้การรันใน lane เดียวกันเรียงลำดับกัน
- CLI ส่วนใหญ่ serialize บน provider lane เดียว
- OpenClaw จะยกเลิกการใช้ session CLI ที่เก็บไว้ซ้ำเมื่อ identity สำหรับ auth ที่เลือกเปลี่ยนไป
  รวมถึง auth profile id, static API key, static token, หรือ identity ของบัญชี OAuth
  ที่เปลี่ยนเมื่อ CLI เปิดเผยให้เห็น การหมุนเวียน OAuth access และ refresh token
  จะไม่ตัด session CLI ที่เก็บไว้ หาก CLI ไม่เปิดเผย
  OAuth account id ที่เสถียร OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้ permission สำหรับ resume เอง

## Fallback prelude จาก session claude-cli

เมื่อความพยายาม `claude-cli` fail over ไปยัง candidate ที่ไม่ใช่ CLI ใน
[`agents.defaults.model.fallbacks`](/th/concepts/model-failover) OpenClaw จะ seed
ความพยายามถัดไปด้วย context prelude ที่เก็บเกี่ยวจาก transcript JSONL ภายในเครื่องของ Claude Code
ที่ `~/.claude/projects/` หากไม่มี seed นี้ ผู้ให้บริการ fallback
จะเริ่มแบบ cold เพราะ transcript session ของ OpenClaw เองว่างเปล่า
สำหรับการรัน `claude-cli`

- prelude จะเลือกสรุป `/compact` ล่าสุดหรือ marker `compact_boundary`
  ก่อน แล้วจึงต่อท้ายรอบสนทนาหลัง boundary ล่าสุดเท่าที่อยู่ในงบประมาณ
  จำนวนอักขระ รอบสนทนาก่อน boundary จะถูกทิ้งเพราะสรุปได้แทนสิ่งเหล่านั้นแล้ว
- บล็อกเครื่องมือจะถูกรวมให้เป็น hint แบบกะทัดรัด `(tool call: name)` และ
  `(tool result: …)` เพื่อรักษางบประมาณ prompt อย่างซื่อตรง สรุปจะถูก
  ติดป้าย `(truncated)` หากเกินขนาด
- fallback จาก `claude-cli` ไป `claude-cli` ที่เป็น provider เดียวกันจะพึ่งพา
  `--resume` ของ Claude เองและข้าม prelude
- seed ใช้การตรวจสอบ path ของไฟล์ session Claude ที่มีอยู่ซ้ำ ดังนั้น
  จะไม่สามารถอ่าน path ตามอำเภอใจได้

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณรับ path ของรูปภาพ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงในไฟล์ชั่วคราว หากตั้งค่า `imageArg` ไว้ path
เหล่านั้นจะถูกส่งเป็น args ของ CLI หากไม่มี `imageArg` OpenClaw จะต่อท้าย
path ของไฟล์ลงใน prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ภายในเครื่องจาก path ธรรมดาโดยอัตโนมัติ

## Input / output

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับ output JSON ของ Gemini CLI OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ usage
  จาก `stats` เมื่อ `usage` หายไปหรือว่างเปล่า ค่าเริ่มต้นของ Gemini CLI ที่บันเดิลมา
  ใช้ `stream-json` แต่ override `--output-format json` แบบเก่ายังคงใช้
  parser JSON
- `output: "jsonl"` แยกวิเคราะห์ stream JSONL และดึงข้อความ agent สุดท้ายพร้อมตัวระบุ session
  เมื่อมีอยู่
- `output: "text"` ถือว่า stdout เป็นคำตอบสุดท้าย

โหมด input:

- `input: "arg"` (ค่าเริ่มต้น) ส่งพรอมป์เป็นอาร์กิวเมนต์ CLI ตัวสุดท้าย
- `input: "stdin"` ส่งพรอมป์ผ่าน stdin
- หากพรอมป์ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (Plugin เป็นเจ้าของ)

ค่าเริ่มต้นของ CLI backend ที่บันเดิลมาจะอยู่กับ Plugin ที่เป็นเจ้าของ ตัวอย่างเช่น
Anthropic เป็นเจ้าของ `claude-cli` และ Google เป็นเจ้าของ `google-gemini-cli` การรัน
เอเจนต์ OpenAI Codex ใช้แอปเซิร์ฟเวอร์ฮาร์เนสของ Codex ผ่าน `openai/*`; OpenClaw
จะไม่ลงทะเบียน backend `codex-cli` ที่บันเดิลมาอีกต่อไป

Plugin Anthropic ที่บันเดิลมาลงทะเบียนค่าเริ่มต้นสำหรับ `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Plugin Google ที่บันเดิลมาก็ลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

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

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI ในเครื่องและพร้อมใช้งานเป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุเกี่ยวกับเอาต์พุต Gemini CLI:

- ตัวแยกวิเคราะห์ `stream-json` ค่าเริ่มต้นจะอ่านเหตุการณ์ `message` ของผู้ช่วย เหตุการณ์ของเครื่องมือ
  การใช้งาน `result` สุดท้าย และเหตุการณ์ข้อผิดพลาดร้ายแรงของ Gemini
- หากคุณแทนที่อาร์กิวเมนต์ Gemini เป็น `--output-format json` OpenClaw จะปรับ
  backend นั้นกลับเป็น `output: "json"` และอ่านข้อความตอบกลับจากฟิลด์ `response`
  ของ JSON
- การใช้งานจะ fallback ไปที่ `stats` เมื่อไม่มี `usage` หรือค่าว่าง
- `stats.cached` จะถูกทำให้เป็นมาตรฐานเป็น `cacheRead` ของ OpenClaw
- หากไม่มี `stats.input` OpenClaw จะอนุมานโทเค็นอินพุตจาก
  `stats.input_tokens - stats.cached`

แทนที่เฉพาะเมื่อจำเป็นเท่านั้น (ที่พบบ่อย: พาธ `command` แบบสัมบูรณ์)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ตอนนี้ค่าเริ่มต้นของ CLI backend เป็นส่วนหนึ่งของพื้นผิว Plugin:

- Plugin ลงทะเบียนค่าเหล่านี้ด้วย `api.registerCliBackend(...)`
- `id` ของ backend จะกลายเป็นคำนำหน้าผู้ให้บริการใน model refs
- การกำหนดค่าผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคงแทนที่ค่าเริ่มต้นของ Plugin
- การล้างค่ากำหนดเฉพาะ backend ยังคงเป็นของ Plugin ผ่านฮุกเสริม
  `normalizeConfig`

Plugin ที่ต้องการ shim ความเข้ากันได้ของพรอมป์/ข้อความขนาดเล็กสามารถประกาศ
การแปลงข้อความแบบสองทิศทางโดยไม่ต้องแทนที่ผู้ให้บริการหรือ CLI backend:

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

`input` เขียน system prompt และ user prompt ที่ส่งให้ CLI ใหม่ `output`
เขียนเดลตาของผู้ช่วยที่สตรีมมาและข้อความสุดท้ายที่แยกวิเคราะห์แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
เครื่องหมายควบคุมของตัวเองและการส่งผ่านช่องทาง

สำหรับ CLI ที่ปล่อยเหตุการณ์ JSONL เฉพาะผู้ให้บริการ ให้ตั้งค่า `jsonlDialect` บน
ค่ากำหนดของ backend นั้น ไดอะเล็กต์ที่รองรับคือ `claude-stream-json` สำหรับสตรีมที่เข้ากันได้กับ Claude
Code และ `gemini-stream-json` สำหรับเหตุการณ์ `stream-json` ของ Gemini CLI

## ความเป็นเจ้าของ Compaction แบบเนทีฟ

CLI backend บางตัวรันเอเจนต์ที่ compact transcript **ของตัวเอง** ดังนั้น OpenClaw ต้อง
ไม่รันตัวสรุป safeguard กับ backend เหล่านั้น - การทำเช่นนั้นจะขัดกับ compaction ของ backend เอง
และอาจทำให้ turn ล้มเหลวแบบ hard-fail

`claude-cli` ไม่มี harness endpoint - Claude Code compact ภายในเอง - ดังนั้นจึงประกาศ
`ownsNativeCompaction: true` และ OpenClaw จะส่งคืน no-op จากเส้นทาง compaction
เซสชัน native-harness เช่น Codex ยังคง route ไปยัง harness compaction endpoint
แทน

เพราะ backend เป็นเจ้าของ compaction วิธีแก้ชั่วคราวเก่าที่ตั้งค่า
`contextTokens: 1_000_000` เพียงเพื่อกันไม่ให้ safeguard ของ OpenClaw ทำงานกับ
เซสชัน claude-cli จึง **ไม่จำเป็นอีกต่อไป** - การ opt-out นี้มาแทนที่แล้ว

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

ประกาศ `ownsNativeCompaction` เฉพาะสำหรับ backend ที่เป็นเจ้าของ compaction ของตนจริง ๆ เท่านั้น: ต้อง
จำกัด transcript ของตัวเองได้อย่างเชื่อถือได้เมื่อเข้าใกล้ context window และคงสถานะ
เซสชันที่ resume ได้ไว้ (เช่น `--resume` / `--session-id`); มิฉะนั้นเซสชันที่เลื่อนออกไปอาจ
ยังเกินงบประมาณอยู่ เซสชันที่ตรงกับ `agentHarnessId` ยังคง route ไปยัง harness endpoint

## โอเวอร์เลย์ MCP แบบบันเดิล

CLI backend **ไม่ได้** รับการเรียกเครื่องมือ OpenClaw โดยตรง แต่ backend สามารถ
opt in เข้าสู่โอเวอร์เลย์ค่ากำหนด MCP ที่สร้างขึ้นด้วย `bundleMcp: true`

พฤติกรรมที่บันเดิลมาในปัจจุบัน:

- `claude-cli`: ไฟล์ค่ากำหนด MCP แบบเข้มงวดที่สร้างขึ้น
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้ MCP แบบบันเดิล OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผย gateway tools ให้กับกระบวนการ CLI
- ตรวจสอบสิทธิ์ bridge ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือไว้ที่เซสชัน บัญชี และบริบทช่องทางปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานสำหรับ workspace ปัจจุบัน
- ผสานกับรูปแบบค่ากำหนด/การตั้งค่า MCP ของ backend ที่มีอยู่
- เขียนค่ากำหนดการเปิดใช้งานใหม่โดยใช้โหมดการผสานรวมที่ backend เป็นเจ้าของจาก extension ที่เป็นเจ้าของ

หากไม่มีเซิร์ฟเวอร์ MCP ที่เปิดใช้งาน OpenClaw ยังจะฉีดค่ากำหนดแบบเข้มงวดเมื่อ
backend opt in เข้าสู่ MCP แบบบันเดิล เพื่อให้การรันเบื้องหลังยังคงแยกขาดจากกัน

รันไทม์ MCP ที่บันเดิลมาและมีขอบเขตต่อเซสชันจะถูกแคชเพื่อใช้ซ้ำภายในเซสชัน แล้ว
ถูกเก็บกวาดหลังจากว่างเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่า `0` เพื่อปิดใช้งาน) การรันแบบฝังครั้งเดียว เช่น auth probes,
slug generation และคำขอ active-memory recall จะล้างข้อมูลเมื่อจบการรัน เพื่อไม่ให้ stdio
children และสตรีม Streamable HTTP/SSE อยู่ยาวกว่าการรัน

## ขีดจำกัดประวัติ reseed

เมื่อเซสชัน CLI ใหม่ถูก seed จาก transcript OpenClaw ก่อนหน้า (เช่น
หลังการ retry จาก `session_expired`) บล็อก
`<conversation_history>` ที่เรนเดอร์จะถูกจำกัดขนาดเพื่อไม่ให้พรอมป์ reseed
ขยายตัวเกินไป ค่าเริ่มต้นคือ `12288` อักขระ (ประมาณ 3000 โทเค็น)

backend Claude CLI จะใช้ขีดจำกัดที่ใหญ่ขึ้นโดยอัตโนมัติ ซึ่งอนุมานจาก
ระดับ context ของ Claude ที่ resolve แล้ว การรัน Claude มาตรฐาน 200K-token จะเก็บชิ้นส่วน transcript
ที่ใหญ่ขึ้น และการรัน Claude 1M-token จะเก็บชิ้นส่วนที่ใหญ่ขึ้นอีก ขณะที่ CLI
backend อื่นจะคงค่าเริ่มต้นแบบอนุรักษนิยมไว้

- ขีดจำกัดนี้ควบคุมเฉพาะบล็อกประวัติก่อนหน้าของพรอมป์ reseed เท่านั้น ขีดจำกัดเอาต์พุต
  ของ live-session จะถูกปรับแยกต่างหากภายใต้ `reliability.outputLimits`
  (ดู [เซสชัน](#sessions))

## ข้อจำกัด

- **ไม่มีการเรียกเครื่องมือ OpenClaw โดยตรง** OpenClaw ไม่ฉีดการเรียกเครื่องมือเข้าไปใน
  โปรโตคอล CLI backend backend จะเห็น gateway tools ก็ต่อเมื่อ opt in เข้าสู่
  `bundleMcp: true` เท่านั้น
- **การสตรีมเป็นแบบเฉพาะ backend** backend บางตัวสตรีม JSONL; ตัวอื่น buffer
  จนกว่าจะออก
- **เอาต์พุตแบบมีโครงสร้าง** ขึ้นอยู่กับรูปแบบ JSON ของ CLI

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธแบบเต็ม
- **ชื่อโมเดลผิด**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดล CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบให้แน่ใจว่าตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none`
- **รูปภาพถูกละเว้น**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway)
- [โมเดลในเครื่อง](/th/gateway/local-models)
