---
read_when:
    - คุณต้องการทางเลือกสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังใช้งาน Codex CLI หรือ CLI AI ภายในเครื่องอื่น ๆ และต้องการนำมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจบริดจ์ลูปแบ็ก MCP สำหรับการเข้าถึงเครื่องมือแบ็กเอนด์ของ CLI
summary: 'แบ็กเอนด์ CLI: กลไกสำรอง AI CLI ในเครื่องพร้อมบริดจ์เครื่องมือ MCP แบบเลือกใช้ได้'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-05-10T19:36:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **AI CLI ภายในเครื่อง** เป็น **ทางสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ล่ม
ถูกจำกัดอัตรา หรือทำงานผิดปกติชั่วคราว แนวทางนี้ตั้งใจให้เป็นแบบระมัดระวัง:

- **เครื่องมือ OpenClaw จะไม่ถูกฉีดเข้าไปโดยตรง** แต่แบ็กเอนด์ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือ Gateway ผ่านสะพาน MCP แบบ local loopback ได้
- **การสตรีม JSONL** สำหรับ CLI ที่รองรับ
- **รองรับเซสชัน** (ดังนั้นรอบสนทนาต่อเนื่องจึงยังสอดคล้องกัน)
- **สามารถส่งรูปภาพผ่านได้** หาก CLI รับพาธรูปภาพ

สิ่งนี้ออกแบบมาเป็น **ตาข่ายนิรภัย** มากกว่าจะเป็นเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบข้อความที่ "ใช้งานได้เสมอ" โดยไม่ต้องพึ่งพา API ภายนอก

หากคุณต้องการรันไทม์ harness แบบเต็มพร้อมการควบคุมเซสชัน ACP, งานเบื้องหลัง,
การผูกเธรด/การสนทนา และเซสชันการเขียนโค้ดภายนอกแบบถาวร ให้ใช้
[เอเจนต์ ACP](/th/tools/acp-agents) แทน แบ็กเอนด์ CLI ไม่ใช่ ACP

<Tip>
  กำลังสร้าง Plugin แบ็กเอนด์ใหม่อยู่หรือไม่ ใช้
  [Plugin แบ็กเอนด์ CLI](/th/plugins/cli-backend-plugins) หน้านี้มีไว้สำหรับผู้ใช้
  ที่กำลังกำหนดค่าและใช้งานแบ็กเอนด์ที่ลงทะเบียนไว้แล้ว
</Tip>

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI **ได้โดยไม่ต้องมีการกำหนดค่าใดๆ** (Plugin OpenAI ที่รวมมา
จะลงทะเบียนแบ็กเอนด์เริ่มต้น):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

หาก Gateway ของคุณรันภายใต้ launchd/systemd และ PATH มีค่าน้อยที่สุด ให้เพิ่มแค่
พาธคำสั่ง:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

เท่านี้ก็พอ ไม่ต้องมีคีย์ ไม่ต้องมีการกำหนดค่า auth เพิ่มเติมนอกเหนือจาก CLI เอง

หากคุณใช้แบ็กเอนด์ CLI ที่รวมมาเป็น **ผู้ให้บริการข้อความหลัก** บนโฮสต์
Gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่รวมมาและเป็นเจ้าของโดยอัตโนมัติเมื่อ config
ของคุณอ้างอิงแบ็กเอนด์นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## ใช้เป็นทางสำรอง

เพิ่มแบ็กเอนด์ CLI ลงในรายการทางสำรองเพื่อให้รันเฉพาะเมื่อโมเดลหลักล้มเหลว:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

หมายเหตุ:

- หากคุณใช้ `agents.defaults.models` (รายการอนุญาต) คุณต้องใส่โมเดลของแบ็กเอนด์ CLI ของคุณไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (auth, การจำกัดอัตรา, timeout) OpenClaw จะ
  ลองใช้แบ็กเอนด์ CLI ถัดไป

## ภาพรวมการกำหนดค่า

แบ็กเอนด์ CLI ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการใช้ **provider id** เป็นคีย์ (เช่น `codex-cli`, `my-cli`)
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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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

1. **เลือกแบ็กเอนด์** ตาม prefix ของผู้ให้บริการ (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt ของ OpenClaw เดียวกัน + บริบท workspace
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังสอดคล้องกัน
   แบ็กเอนด์ `claude-cli` ที่รวมมาจะคงโปรเซส Claude stdio หนึ่งโปรเซสไว้ต่อ
   เซสชัน OpenClaw และส่งรอบสนทนาต่อเนื่องผ่าน stream-json stdin
4. **แยกวิเคราะห์ output** (JSON หรือข้อความธรรมดา) แล้วส่งข้อความสุดท้ายกลับ
5. **คง session id ไว้** ต่อแบ็กเอนด์ เพื่อให้รอบติดตามผลใช้เซสชัน CLI เดิมซ้ำ

<Note>
แบ็กเอนด์ Anthropic `claude-cli` ที่รวมมากลับมารองรับอีกครั้งแล้ว เจ้าหน้าที่ Anthropic
บอกเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้ `claude -p` ได้รับอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
</Note>

แบ็กเอนด์ OpenAI `codex-cli` ที่รวมมาจะส่ง system prompt ของ OpenClaw ผ่าน
การ override config `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่เปิดเผย flag แบบ Claude อย่าง
`--append-system-prompt` ดังนั้น OpenClaw จึงเขียน prompt ที่ประกอบแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละเซสชัน Codex CLI ใหม่

แบ็กเอนด์ Anthropic `claude-cli` ที่รวมมาจะรับ snapshot Skills ของ OpenClaw
สองทาง: แค็ตตาล็อก Skills ของ OpenClaw แบบกะทัดรัดใน system prompt ที่แนบเพิ่ม และ
Plugin Claude Code ชั่วคราวที่ส่งผ่าน `--plugin-dir` Plugin นี้มีเฉพาะ
Skills ที่มีสิทธิ์สำหรับเอเจนต์/เซสชันนั้น ดังนั้นตัว resolve skill ภายในของ Claude Code
จึงเห็นชุดที่กรองแล้วชุดเดียวกับที่ OpenClaw จะประกาศใน prompt อยู่แล้ว
OpenClaw ยังคงใช้การ override env/คีย์ API ของ Skill กับ
สภาพแวดล้อมของโปรเซสลูกสำหรับการรัน

Claude CLI ยังมีโหมดสิทธิ์แบบ noninteractive ของตัวเอง OpenClaw แมปสิ่งนั้น
เข้ากับนโยบาย exec ที่มีอยู่แทนการเพิ่ม config เฉพาะ Claude: เมื่อ
นโยบาย exec ที่ร้องขอแบบมีผลเป็น YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`) OpenClaw จะเพิ่ม `--permission-mode bypassPermissions`
การตั้งค่า `agents.list[].tools.exec` รายเอเจนต์จะแทนที่ `tools.exec` ส่วนกลางสำหรับ
เอเจนต์นั้น หากต้องการบังคับใช้โหมด Claude อื่น ให้ตั้งค่า args แบ็กเอนด์ดิบอย่างชัดเจน
เช่น `--permission-mode default` หรือ `--permission-mode acceptEdits` ภายใต้
`agents.defaults.cliBackends.claude-cli.args` และ `resumeArgs` ที่ตรงกัน

แบ็กเอนด์ Anthropic `claude-cli` ที่รวมมายังแมประดับ `/think` ของ OpenClaw
ไปยัง flag `--effort` ภายในของ Claude Code สำหรับระดับที่ไม่ใช่ off ด้วย `minimal` และ
`low` แมปเป็น `low`, `adaptive` และ `medium` แมปเป็น `medium` และ `high`,
`xhigh` และ `max` แมปโดยตรง แบ็กเอนด์ CLI อื่นๆ ต้องให้ Plugin เจ้าของ
ประกาศ argv mapper ที่เทียบเท่าก่อน `/think` จึงจะมีผลกับ CLI ที่ spawn

ก่อนที่ OpenClaw จะใช้แบ็กเอนด์ `claude-cli` ที่รวมมาได้ Claude Code เอง
ต้องล็อกอินบนโฮสต์เดียวกันไว้แล้ว:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อไบนารี `claude`
ยังไม่ได้อยู่บน `PATH`

## เซสชัน

- หาก CLI รองรับเซสชัน ให้ตั้งค่า `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  ลงใน flag หลายตัว
- หาก CLI ใช้ **resume subcommand** พร้อม flag ที่ต่างกัน ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และอาจตั้งค่า `resumeOutput`
  (สำหรับ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (UUID ใหม่หากยังไม่มีที่เก็บไว้)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยมีที่เก็บไว้ก่อนหน้า
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้รอบสนทนาต่อเนื่องใช้โปรเซส Claude ที่ยังทำงานอยู่ซ้ำ
  ขณะที่ยัง active อยู่ ตอนนี้ warm stdio เป็นค่าเริ่มต้นแล้ว รวมถึง config แบบกำหนดเอง
  ที่ละเว้นฟิลด์ transport หาก Gateway รีสตาร์ตหรือโปรเซส idle ออก OpenClaw จะ resume
  จาก session id ของ Claude ที่เก็บไว้ session id ที่เก็บไว้จะถูกตรวจสอบกับ transcript
  โปรเจกต์ที่มีอยู่และอ่านได้ก่อน resume ดังนั้นการผูก phantom จะถูกล้างด้วย
  `reason=transcript-missing` แทนที่จะเริ่มเซสชัน Claude CLI ใหม่อย่างเงียบๆ ภายใต้ `--resume`
- เซสชัน live ของ Claude เก็บ guard ของ output JSONL แบบจำกัดขอบเขต ค่าเริ่มต้นอนุญาตสูงสุด
  8 MiB และ 20,000 บรรทัด JSONL ดิบต่อรอบ รอบ Claude ที่ใช้เครื่องมือหนักสามารถเพิ่มค่าเหล่านี้
  ต่อแบ็กเอนด์ได้ด้วย
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  และ `maxTurnLines`; OpenClaw จะ clamp การตั้งค่าเหล่านั้นไว้ที่ 64 MiB และ 100,000
  บรรทัด
- เซสชัน CLI ที่เก็บไว้คือความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การรีเซ็ตเซสชันรายวันโดยนัย
  จะไม่ตัดเซสชันเหล่านั้น; `/reset` และนโยบาย `session.reset` ที่ชัดเจนยังคงตัด
- โดยปกติเซสชัน CLI ใหม่จะ reseed เฉพาะจากสรุป Compaction ของ OpenClaw
  รวมกับ tail หลัง Compaction หากต้องการกู้เซสชันสั้นที่ถูกทำให้ invalid
  ก่อน Compaction แบ็กเอนด์สามารถ opt in ด้วย
  `reseedFromRawTranscriptWhenUncompacted: true` OpenClaw ยังคงจำกัดขอบเขต
  raw transcript reseed และจำกัดไว้เฉพาะการ invalidation ที่ปลอดภัย เช่น
  transcript ของ CLI หาย, การเปลี่ยนแปลง system-prompt/MCP หรือการ retry จาก session-expired;
  การเปลี่ยนแปลง auth profile หรือ credential-epoch จะไม่ reseed ประวัติ raw transcript

หมายเหตุการทำ serialization:

- `serialize: true` ทำให้การรันใน lane เดียวกันเรียงตามลำดับ
- CLI ส่วนใหญ่ serialize บน lane ผู้ให้บริการเดียว
- OpenClaw จะเลิกใช้ซ้ำเซสชัน CLI ที่เก็บไว้เมื่อ auth identity ที่เลือกเปลี่ยนไป
  รวมถึง auth profile id, static API key, static token หรือ OAuth
  account identity ที่เปลี่ยนเมื่อ CLI เปิดเผยตัวตนดังกล่าว การหมุนเวียน OAuth access token
  และ refresh token จะไม่ตัดเซสชัน CLI ที่เก็บไว้ หาก CLI ไม่เปิดเผย
  OAuth account id ที่เสถียร OpenClaw จะให้ CLI นั้นบังคับใช้สิทธิ์ resume เอง

## พรีลูดทางสำรองจากเซสชัน claude-cli

เมื่อความพยายาม `claude-cli` fail over ไปยัง candidate ที่ไม่ใช่ CLI ใน
[`agents.defaults.model.fallbacks`](/th/concepts/model-failover) OpenClaw จะ seed
ความพยายามถัดไปด้วย context prelude ที่เก็บมาจาก transcript JSONL ภายในเครื่องของ Claude Code
ที่ `~/.claude/projects/` หากไม่มี seed นี้ ผู้ให้บริการ fallback จะเริ่มแบบ cold
เพราะ transcript เซสชันของ OpenClaw เองว่างเปล่าสำหรับการรัน `claude-cli`

- prelude จะเลือกสรุป `/compact` ล่าสุดหรือ marker `compact_boundary`
  ก่อน จากนั้นแนบรอบสนทนาหลัง boundary ล่าสุดจนถึงงบประมาณจำนวนอักขระ
  รอบก่อน boundary จะถูกทิ้งเพราะสรุปเป็นตัวแทนรอบเหล่านั้นอยู่แล้ว
- บล็อกเครื่องมือจะถูกรวมเป็นคำใบ้แบบกะทัดรัด `(tool call: name)` และ
  `(tool result: …)` เพื่อรักษางบประมาณ prompt ให้ตรงความจริง สรุปจะถูกติดป้าย
  `(truncated)` หากล้น
- fallback จาก `claude-cli` ไป `claude-cli` ผู้ให้บริการเดียวกันจะพึ่งพา
  `--resume` ของ Claude เองและข้าม prelude
- seed ใช้การตรวจสอบพาธไฟล์เซสชัน Claude ที่มีอยู่ซ้ำ ดังนั้น
  จึงไม่สามารถอ่านพาธตามอำเภอใจได้

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณรับพาธรูปภาพ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงในไฟล์ชั่วคราว หากตั้งค่า `imageArg` ไว้ พาธเหล่านั้น
จะถูกส่งเป็น args ของ CLI หากไม่มี `imageArg` OpenClaw จะแนบ
พาธไฟล์ต่อท้าย prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลดไฟล์ภายในเครื่อง
จากพาธธรรมดาโดยอัตโนมัติ

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับ output JSON ของ Gemini CLI, OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` หายไปหรือว่าง
- `output: "jsonl"` แยกวิเคราะห์สตรีม JSONL (ตัวอย่างเช่น Codex CLI `--json`) และดึงข้อความสุดท้ายของเอเจนต์พร้อม session
  identifiers เมื่อมี
- `output: "text"` ถือว่า stdout เป็นคำตอบสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) ส่ง prompt เป็น arg สุดท้ายของ CLI
- `input: "stdin"` ส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (Plugin เป็นเจ้าของ)

Plugin OpenAI ที่รวมมายังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google ที่บันเดิลมาด้วยยังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI ภายในเครื่องและให้เรียกใช้ได้เป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะถูกอ่านจากฟิลด์ JSON `response`
- การใช้งานจะถอยไปใช้ `stats` เมื่อ `usage` ไม่มีอยู่หรือว่างเปล่า
- `stats.cached` จะถูกทำให้เป็นรูปแบบ OpenClaw `cacheRead`
- หาก `stats.input` หายไป OpenClaw จะอนุมานโทเค็นอินพุตจาก
  `stats.input_tokens - stats.cached`

เขียนทับเฉพาะเมื่อจำเป็นเท่านั้น (กรณีทั่วไป: พาธ `command` แบบสมบูรณ์)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ค่าเริ่มต้นของแบ็กเอนด์ CLI ตอนนี้เป็นส่วนหนึ่งของพื้นผิว Plugin:

- Plugins ลงทะเบียนค่าเหล่านี้ด้วย `api.registerCliBackend(...)`
- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้าผู้ให้บริการใน model refs
- การกำหนดค่าผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังเขียนทับค่าเริ่มต้นของ Plugin ได้
- การล้างการกำหนดค่าเฉพาะแบ็กเอนด์ยังคงเป็นของ Plugin ผ่าน hook
  `normalizeConfig` ที่เป็นตัวเลือก

Plugins ที่ต้องใช้ shim ความเข้ากันได้ของพรอมป์/ข้อความขนาดเล็กสามารถประกาศ
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

`input` จะเขียนพรอมป์ระบบและพรอมป์ผู้ใช้ที่ส่งไปยัง CLI ใหม่ `output`
จะเขียนเดลตาผู้ช่วยที่สตรีมมาและข้อความสุดท้ายที่แยกวิเคราะห์แล้วใหม่ก่อนที่ OpenClaw จะจัดการ
เครื่องหมายควบคุมและการส่งมอบช่องทางของตัวเอง

สำหรับ CLI ที่ปล่อย JSONL ที่เข้ากันได้กับ Claude Code stream-json ให้ตั้งค่า
`jsonlDialect: "claude-stream-json"` ในการกำหนดค่าของแบ็กเอนด์นั้น

## โอเวอร์เลย์ MCP ของบันเดิล

แบ็กเอนด์ CLI **ไม่ได้** รับ tool calls ของ OpenClaw โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้โอเวอร์เลย์การกำหนดค่า MCP ที่สร้างขึ้นได้ด้วย `bundleMcp: true`

พฤติกรรมที่บันเดิลอยู่ในปัจจุบัน:

- `claude-cli`: ไฟล์การกำหนดค่า MCP แบบเข้มงวดที่สร้างขึ้น
- `codex-cli`: การเขียนทับการกำหนดค่าแบบอินไลน์สำหรับ `mcp_servers`; เซิร์ฟเวอร์
  local loopback ของ OpenClaw ที่สร้างขึ้นจะถูกทำเครื่องหมายด้วยโหมดอนุมัติเครื่องมือต่อเซิร์ฟเวอร์ของ Codex
  เพื่อไม่ให้การเรียก MCP ค้างอยู่ที่พรอมป์อนุมัติภายในเครื่อง
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้ bundle MCP แล้ว OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผยเครื่องมือ Gateway ให้กับโปรเซส CLI
- ตรวจสอบสิทธิ์บริดจ์ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือไว้ที่บริบทเซสชัน บัญชี และช่องทางปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานสำหรับเวิร์กสเปซปัจจุบัน
- รวมเข้ากับรูปแบบการกำหนดค่า/การตั้งค่า MCP ของแบ็กเอนด์ที่มีอยู่
- เขียนการกำหนดค่าเริ่มทำงานใหม่โดยใช้โหมดการผสานรวมที่แบ็กเอนด์เป็นเจ้าของจาก extension เจ้าของ

หากไม่มีเซิร์ฟเวอร์ MCP ที่เปิดใช้งาน OpenClaw จะยังฉีดการกำหนดค่าแบบเข้มงวดเมื่อ
แบ็กเอนด์เลือกใช้ bundle MCP เพื่อให้การรันเบื้องหลังยังแยกโดดเดี่ยวอยู่

รันไทม์ MCP ที่บันเดิลและจำกัดขอบเขตตามเซสชันจะถูกแคชเพื่อนำกลับมาใช้ซ้ำภายในเซสชัน แล้ว
ถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่า `0` เพื่อปิดใช้งาน) การรันแบบฝังตัวครั้งเดียว เช่น การตรวจสอบ auth,
การสร้าง slug และการเรียกคืน Active Memory จะร้องขอการล้างข้อมูลเมื่อจบการรัน เพื่อไม่ให้ stdio
children และสตรีม Streamable HTTP/SSE มีอายุยาวกว่าการรัน

## ข้อจำกัด

- **ไม่มี tool calls ของ OpenClaw โดยตรง** OpenClaw ไม่ฉีด tool calls เข้าไปใน
  โปรโตคอลแบ็กเอนด์ CLI แบ็กเอนด์จะเห็นเครื่องมือ Gateway เฉพาะเมื่อเลือกใช้
  `bundleMcp: true` เท่านั้น
- **การสตรีมขึ้นอยู่กับแบ็กเอนด์** บางแบ็กเอนด์สตรีม JSONL; ส่วนอื่นบัฟเฟอร์
  จนกว่าจะออก
- **เอาต์พุตแบบมีโครงสร้าง** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชัน Codex CLI** ดำเนินต่อผ่านเอาต์พุตข้อความ (ไม่มี JSONL) ซึ่งมีโครงสร้างน้อยกว่า
  การรัน `--json` ครั้งแรก เซสชัน OpenClaw ยังคงทำงานได้
  ตามปกติ

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธเต็ม
- **ชื่อโมเดลผิด**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดล CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบว่าได้ตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none` (ขณะนี้ Codex CLI ยังไม่สามารถดำเนินต่อด้วยเอาต์พุต JSON ได้)
- **รูปภาพถูกละเว้น**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
