---
read_when:
    - คุณต้องการระบบสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังเรียกใช้ Codex CLI หรือ CLI ปัญญาประดิษฐ์ในเครื่องอื่น ๆ และต้องการนำมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจบริดจ์ลูปแบ็ก MCP สำหรับการเข้าถึงเครื่องมือแบ็กเอนด์ของ CLI
summary: 'แบ็กเอนด์ CLI: ทางเลือกสำรองเป็น AI CLI ภายในเครื่องพร้อมบริดจ์เครื่องมือ MCP แบบเลือกใช้ได้'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-05-07T13:16:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **AI CLI แบบโลคัล** เป็น **ตัวสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ล่ม,
ถูกจำกัดอัตราการใช้งาน, หรือทำงานผิดปกติชั่วคราว แนวทางนี้ตั้งใจให้ระมัดระวังเป็นพิเศษ:

- **เครื่องมือ OpenClaw จะไม่ถูกฉีดเข้าไปโดยตรง** แต่แบ็กเอนด์ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือ Gateway ผ่านบริดจ์ MCP แบบ loopback ได้
- **การสตรีม JSONL** สำหรับ CLI ที่รองรับ
- **รองรับเซสชัน** (เพื่อให้เทิร์นติดตามผลยังคงสอดคล้องกัน)
- **ส่งรูปภาพผ่านได้** หาก CLI รองรับพาธรูปภาพ

สิ่งนี้ออกแบบมาเป็น **ตาข่ายนิรภัย** มากกว่าเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบแบบข้อความที่ "ใช้งานได้เสมอ" โดยไม่ต้องพึ่งพา API ภายนอก

หากคุณต้องการรันไทม์ฮาร์เนสเต็มรูปแบบที่มีการควบคุมเซสชัน ACP, งานเบื้องหลัง,
การผูกเธรด/บทสนทนา, และเซสชันเขียนโค้ดภายนอกแบบถาวร ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน แบ็กเอนด์ CLI ไม่ใช่ ACP

<Tip>
  กำลังสร้าง Plugin แบ็กเอนด์ใหม่อยู่หรือไม่ ใช้
  [CLI backend plugins](/th/plugins/cli-backend-plugins) หน้านี้สำหรับผู้ใช้
  ที่กำหนดค่าและใช้งานแบ็กเอนด์ที่ลงทะเบียนไว้แล้ว
</Tip>

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI ได้ **โดยไม่ต้องมี config ใดๆ** (Plugin OpenAI ที่บันเดิลมา
จะลงทะเบียนแบ็กเอนด์เริ่มต้นให้):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

หาก Gateway ของคุณรันภายใต้ launchd/systemd และ PATH มีค่าน้อย ให้เพิ่มเฉพาะ
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

เท่านี้ก็เรียบร้อย ไม่ต้องมีคีย์ ไม่ต้องมี config การยืนยันตัวตนเพิ่มเติมนอกเหนือจาก CLI เอง

หากคุณใช้แบ็กเอนด์ CLI ที่บันเดิลมาเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ Gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่บันเดิลมาซึ่งเป็นเจ้าของให้โดยอัตโนมัติ เมื่อ config ของคุณ
อ้างอิงแบ็กเอนด์นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## ใช้เป็นตัวสำรอง

เพิ่มแบ็กเอนด์ CLI ลงในรายการสำรองของคุณ เพื่อให้รันเฉพาะเมื่อโมเดลหลักล้มเหลว:

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

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องรวมโมเดลแบ็กเอนด์ CLI ของคุณไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (การยืนยันตัวตน, ขีดจำกัดอัตรา, หมดเวลา) OpenClaw จะ
  ลองใช้แบ็กเอนด์ CLI ถัดไป

## ภาพรวมการกำหนดค่า

แบ็กเอนด์ CLI ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการใช้ **รหัสผู้ให้บริการ** เป็นคีย์ (เช่น `codex-cli`, `my-cli`)
รหัสผู้ให้บริการจะกลายเป็นฝั่งซ้ายของ model ref ของคุณ:

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
          serialize: true,
        },
      },
    },
  },
}
```

## วิธีการทำงาน

1. **เลือกแบ็กเอนด์** ตามคำนำหน้าผู้ให้บริการ (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt ของ OpenClaw เดียวกัน + บริบทเวิร์กสเปซ
3. **เรียกใช้ CLI** พร้อมรหัสเซสชัน (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   แบ็กเอนด์ `claude-cli` ที่บันเดิลมาจะคงกระบวนการ Claude stdio ไว้ต่อ
   เซสชัน OpenClaw และส่งเทิร์นติดตามผลผ่าน stream-json stdin
4. **แยกวิเคราะห์เอาต์พุต** (JSON หรือข้อความธรรมดา) แล้วส่งคืนข้อความสุดท้าย
5. **บันทึกรหัสเซสชันแบบถาวร** ต่อแบ็กเอนด์ เพื่อให้เทิร์นติดตามผลใช้เซสชัน CLI เดิมซ้ำ

<Note>
แบ็กเอนด์ Anthropic `claude-cli` ที่บันเดิลมากลับมารองรับอีกครั้ง บุคลากรของ Anthropic
แจ้งเราว่าการใช้งาน Claude CLI ในสไตล์ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้งาน `claude -p` ได้รับอนุมัติสำหรับอินทิเกรชันนี้ เว้นแต่ Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

แบ็กเอนด์ OpenAI `codex-cli` ที่บันเดิลมาจะส่ง system prompt ของ OpenClaw ผ่าน
การ override config `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่มีแฟล็กแบบ Claude อย่าง
`--append-system-prompt` ดังนั้น OpenClaw จะเขียน prompt ที่ประกอบแล้วลงใน
ไฟล์ชั่วคราวสำหรับเซสชัน Codex CLI ใหม่แต่ละครั้ง

แบ็กเอนด์ Anthropic `claude-cli` ที่บันเดิลมาจะรับสแนปชอต Skills ของ OpenClaw
สองวิธี: แค็ตตาล็อก Skills ของ OpenClaw แบบกระชับใน system prompt ที่ต่อท้าย และ
Plugin Claude Code ชั่วคราวที่ส่งผ่าน `--plugin-dir` Plugin นี้มีเฉพาะ
Skills ที่มีสิทธิ์สำหรับเอเจนต์/เซสชันนั้น ดังนั้นตัวแก้ Skills ดั้งเดิมของ Claude Code
จึงเห็นชุดที่กรองแล้วชุดเดียวกับที่ OpenClaw จะประกาศใน
prompt มิฉะนั้น ค่า override env/API key ของ Skills ยังคงถูก OpenClaw นำไปใช้กับ
สภาพแวดล้อมของกระบวนการลูกสำหรับการรัน

Claude CLI ยังมีโหมดสิทธิ์แบบไม่โต้ตอบของตัวเอง OpenClaw แมปโหมดนั้น
เข้ากับนโยบาย exec ที่มีอยู่ แทนที่จะเพิ่ม config เฉพาะ Claude: เมื่อ
นโยบาย exec ที่ร้องขออย่างมีผลเป็น YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`) OpenClaw จะเพิ่ม `--permission-mode bypassPermissions`
การตั้งค่า `agents.list[].tools.exec` ต่อเอเจนต์จะ override `tools.exec` ระดับสากลสำหรับ
เอเจนต์นั้น หากต้องการบังคับโหมด Claude อื่น ให้ตั้งค่าอาร์กิวเมนต์แบ็กเอนด์ดิบอย่างชัดเจน
เช่น `--permission-mode default` หรือ `--permission-mode acceptEdits` ภายใต้
`agents.defaults.cliBackends.claude-cli.args` และ `resumeArgs` ที่สอดคล้องกัน

แบ็กเอนด์ Anthropic `claude-cli` ที่บันเดิลมายังแมประดับ OpenClaw `/think`
ไปยังแฟล็ก `--effort` ดั้งเดิมของ Claude Code สำหรับระดับที่ไม่ใช่ off ด้วย `minimal` และ
`low` แมปเป็น `low`, `adaptive` และ `medium` แมปเป็น `medium`, และ `high`,
`xhigh`, และ `max` แมปโดยตรง แบ็กเอนด์ CLI อื่นๆ ต้องให้ Plugin เจ้าของ
ประกาศตัวแมป argv ที่เทียบเท่าก่อนที่ `/think` จะมีผลต่อ CLI ที่ถูกสร้างขึ้นได้

ก่อนที่ OpenClaw จะใช้แบ็กเอนด์ `claude-cli` ที่บันเดิลมาได้ Claude Code เอง
ต้องเข้าสู่ระบบไว้แล้วบนโฮสต์เดียวกัน:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อไบนารี `claude`
ยังไม่อยู่บน `PATH`

## เซสชัน

- หาก CLI รองรับเซสชัน ให้ตั้งค่า `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  ลงในหลายแฟล็ก
- หาก CLI ใช้ **คำสั่งย่อย resume** ที่มีแฟล็กต่างกัน ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และเลือกตั้งค่า `resumeOutput`
  (สำหรับ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่งรหัสเซสชันเสมอ (UUID ใหม่หากยังไม่มีที่จัดเก็บไว้)
  - `existing`: ส่งรหัสเซสชันเฉพาะเมื่อเคยจัดเก็บไว้ก่อนหน้านี้
  - `none`: ไม่ส่งรหัสเซสชันเลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้เทิร์นติดตามผลใช้กระบวนการ Claude ที่ยังมีชีวิตอยู่ซ้ำขณะที่
  กระบวนการนั้นยังทำงานอยู่ ตอนนี้ stdio ที่อุ่นไว้เป็นค่าเริ่มต้นแล้ว รวมถึงสำหรับ config แบบกำหนดเอง
  ที่ละฟิลด์ transport ไว้ หาก Gateway รีสตาร์ตหรือกระบวนการที่ไม่ได้ใช้งาน
  ออก OpenClaw จะ resume จากรหัสเซสชัน Claude ที่จัดเก็บไว้ รหัสเซสชันที่จัดเก็บไว้
  จะถูกตรวจสอบกับทรานสคริปต์โปรเจกต์ที่อ่านได้และมีอยู่ก่อน
  resume ดังนั้นการผูกที่ไม่มีอยู่จริงจะถูกล้างด้วย `reason=transcript-missing`
  แทนที่จะเริ่มเซสชัน Claude CLI ใหม่อย่างเงียบๆ ภายใต้ `--resume`
- เซสชัน Claude แบบสดจะคงการ์ดเอาต์พุต JSONL แบบมีขอบเขตไว้ ค่าเริ่มต้นอนุญาตสูงสุด
  8 MiB และ 20,000 บรรทัด JSONL ดิบต่อเทิร์น เทิร์น Claude ที่ใช้เครื่องมือหนักสามารถเพิ่ม
  ค่าเหล่านี้ต่อแบ็กเอนด์ด้วย
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  และ `maxTurnLines`; OpenClaw จะ clamp การตั้งค่าเหล่านั้นไว้ที่ 64 MiB และ 100,000
  บรรทัด
- เซสชัน CLI ที่จัดเก็บไว้เป็นความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การรีเซ็ตเซสชันรายวันโดยนัย
  จะไม่ตัดเซสชันเหล่านั้น; `/reset` และนโยบาย `session.reset` ที่ชัดเจนยังคง
  ทำงาน

หมายเหตุการทำ serialization:

- `serialize: true` รักษาลำดับการรันในเลนเดียวกัน
- CLI ส่วนใหญ่ serialize บนเลนผู้ให้บริการเดียว
- OpenClaw จะยกเลิกการใช้เซสชัน CLI ที่จัดเก็บไว้ซ้ำเมื่อ identity การยืนยันตัวตนที่เลือกเปลี่ยน
  รวมถึง auth profile id, static API key, static token, หรือ identity บัญชี OAuth
  ที่เปลี่ยนไปเมื่อ CLI เปิดเผยค่าใดค่าหนึ่ง การหมุนเวียน access token และ refresh token ของ OAuth
  จะไม่ตัดเซสชัน CLI ที่จัดเก็บไว้ หาก CLI ไม่เปิดเผย
  OAuth account id ที่เสถียร OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้สิทธิ์ resume เอง

## พรีลูดสำรองจากเซสชัน claude-cli

เมื่อความพยายามของ `claude-cli` fail over ไปยังตัวเลือกที่ไม่ใช่ CLI ใน
[`agents.defaults.model.fallbacks`](/th/concepts/model-failover) OpenClaw จะ seed
ความพยายามถัดไปด้วยพรีลูดบริบทที่เก็บจากทรานสคริปต์ JSONL โลคัลของ Claude Code
ที่ `~/.claude/projects/` หากไม่มี seed นี้ ผู้ให้บริการสำรอง
จะเริ่มแบบเย็น เพราะทรานสคริปต์เซสชันของ OpenClaw เองว่างเปล่า
สำหรับการรัน `claude-cli`

- พรีลูดจะเลือกสรุป `/compact` ล่าสุดหรือ marker `compact_boundary`
  ก่อน แล้วต่อท้ายเทิร์นหลัง boundary ล่าสุดภายในงบประมาณอักขระ
  เทิร์นก่อน boundary จะถูกตัดทิ้ง เพราะสรุปเป็นตัวแทนของเทิร์นเหล่านั้นอยู่แล้ว
- บล็อกเครื่องมือจะถูกควบรวมเป็นคำใบ้แบบกระชับ `(tool call: name)` และ
  `(tool result: …)` เพื่อรักษางบประมาณ prompt อย่างตรงไปตรงมา สรุปจะถูก
  ติดป้าย `(truncated)` หากล้น
- fallback จาก `claude-cli` ไป `claude-cli` ผู้ให้บริการเดียวกันจะพึ่งพา `--resume`
  ของ Claude เอง และข้ามพรีลูด
- seed จะใช้การตรวจสอบพาธไฟล์เซสชัน Claude ที่มีอยู่ซ้ำ ดังนั้น
  จึงไม่สามารถอ่านพาธตามอำเภอใจได้

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณรองรับพาธรูปภาพ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงไฟล์ชั่วคราว หากตั้งค่า `imageArg` ไว้
พาธเหล่านั้นจะถูกส่งเป็นอาร์กิวเมนต์ CLI หากไม่มี `imageArg` OpenClaw จะต่อท้าย
พาธไฟล์ลงใน prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์โลคัลจากพาธธรรมดาโดยอัตโนมัติ

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) พยายามแยกวิเคราะห์ JSON และดึงข้อความ + รหัสเซสชัน
- สำหรับเอาต์พุต JSON ของ Gemini CLI OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` หายไปหรือว่างเปล่า
- `output: "jsonl"` แยกวิเคราะห์สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความสุดท้ายของเอเจนต์พร้อมกับ
  ตัวระบุเซสชันเมื่อมี
- `output: "text"` ถือว่า stdout เป็นคำตอบสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) ส่ง prompt เป็นอาร์กิวเมนต์ CLI ตัวสุดท้าย
- `input: "stdin"` ส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (Plugin เป็นเจ้าของ)

Plugin OpenAI ที่บันเดิลมายังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google ที่บันเดิลมายังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI ในเครื่องและพร้อมใช้งานเป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะอ่านจากฟิลด์ JSON `response`
- การใช้งานจะ fallback ไปที่ `stats` เมื่อไม่มี `usage` หรือว่างเปล่า
- `stats.cached` จะถูกทำให้เป็น OpenClaw `cacheRead`
- หากไม่มี `stats.input` OpenClaw จะคำนวณโทเค็นอินพุตจาก
  `stats.input_tokens - stats.cached`

Override เฉพาะเมื่อจำเป็น (พบบ่อย: พาธ `command` แบบสัมบูรณ์)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ค่าเริ่มต้นของแบ็กเอนด์ CLI เป็นส่วนหนึ่งของพื้นผิว Plugin แล้ว:

- Plugins ลงทะเบียนค่าเหล่านี้ด้วย `api.registerCliBackend(...)`
- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้าผู้ให้บริการใน model refs
- การตั้งค่าผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคง override ค่าเริ่มต้นของ Plugin
- การล้างค่าคอนฟิกเฉพาะแบ็กเอนด์ยังคงเป็นของ Plugin ผ่าน hook เสริม
  `normalizeConfig`

Plugins ที่ต้องใช้ shim ขนาดเล็กเพื่อความเข้ากันได้ของพรอมป์/ข้อความ สามารถประกาศ
การแปลงข้อความสองทิศทางได้โดยไม่ต้องแทนที่ผู้ให้บริการหรือแบ็กเอนด์ CLI:

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

`input` จะเขียน system prompt และ user prompt ที่ส่งต่อไปยัง CLI ใหม่ `output`
จะเขียน streamed assistant deltas และข้อความสุดท้ายที่ parse แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
control markers และการส่งมอบผ่านแชนเนลของตัวเอง

สำหรับ CLI ที่ปล่อย JSONL ที่เข้ากันได้กับ Claude Code stream-json ให้ตั้งค่า
`jsonlDialect: "claude-stream-json"` ในคอนฟิกของแบ็กเอนด์นั้น

## Bundle MCP overlays

แบ็กเอนด์ CLI **ไม่ได้** รับ OpenClaw tool calls โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้ MCP config overlay ที่สร้างขึ้นด้วย `bundleMcp: true`

พฤติกรรมที่ bundle ในปัจจุบัน:

- `claude-cli`: ไฟล์คอนฟิก MCP แบบ strict ที่สร้างขึ้น
- `codex-cli`: inline config overrides สำหรับ `mcp_servers`; เซิร์ฟเวอร์
  OpenClaw loopback ที่สร้างขึ้นจะถูกทำเครื่องหมายด้วยโหมดการอนุมัติเครื่องมือต่อเซิร์ฟเวอร์ของ Codex
  เพื่อให้ MCP calls ไม่ค้างจากพรอมป์อนุมัติในเครื่อง
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้งาน bundle MCP OpenClaw จะ:

- spawn เซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผย gateway tools ให้กับโปรเซส CLI
- ตรวจสอบสิทธิ์ bridge ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือไว้ที่เซสชัน บัญชี และบริบทแชนเนลปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานสำหรับ workspace ปัจจุบัน
- merge เซิร์ฟเวอร์เหล่านั้นกับรูปแบบคอนฟิก/การตั้งค่า MCP ของแบ็กเอนด์ที่มีอยู่
- เขียน launch config ใหม่โดยใช้โหมดการผสานรวมที่แบ็กเอนด์เป็นเจ้าของจากส่วนขยายที่เป็นเจ้าของ

หากไม่มีเซิร์ฟเวอร์ MCP ที่เปิดใช้งาน OpenClaw ยังคง inject คอนฟิกแบบ strict เมื่อ
แบ็กเอนด์เลือกใช้ bundle MCP เพื่อให้ background runs ยังคงแยกออกจากกัน

รันไทม์ MCP ที่ bundle แบบจำกัดขอบเขตตามเซสชันจะถูกแคชเพื่อนำกลับมาใช้ซ้ำภายในเซสชัน จากนั้น
จะถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่า `0` เพื่อปิดใช้งาน) การรันแบบ embedded ครั้งเดียว เช่น auth probes,
การสร้าง slug และ active-memory recall จะร้องขอการล้างข้อมูลเมื่อจบการรัน เพื่อให้ stdio
children และสตรีม Streamable HTTP/SSE ไม่คงอยู่เกินอายุการรัน

## ข้อจำกัด

- **ไม่มี OpenClaw tool calls โดยตรง** OpenClaw ไม่ inject tool calls เข้าไปใน
  โปรโตคอลแบ็กเอนด์ CLI แบ็กเอนด์จะเห็น gateway tools เฉพาะเมื่อเลือกใช้
  `bundleMcp: true`
- **Streaming ขึ้นอยู่กับแบ็กเอนด์** บางแบ็กเอนด์ stream JSONL; ส่วนอื่น buffer
  จนกว่าจะออก
- **Structured outputs** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชัน Codex CLI** resume ผ่านข้อความเอาต์พุต (ไม่มี JSONL) ซึ่งมีโครงสร้างน้อยกว่า
  การรัน `--json` เริ่มต้น เซสชัน OpenClaw ยังคงทำงานตามปกติ

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธเต็ม
- **ชื่อโมเดลไม่ถูกต้อง**: ใช้ `modelAliases` เพื่อ map `provider/model` → โมเดล CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบให้แน่ใจว่าตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none` (ปัจจุบัน Codex CLI ยัง resume ด้วย JSON output ไม่ได้)
- **รูปภาพถูกละเว้น**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [Runbook ของ Gateway](/th/gateway)
- [โมเดลในเครื่อง](/th/gateway/local-models)
