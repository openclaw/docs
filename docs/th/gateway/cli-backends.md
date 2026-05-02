---
read_when:
    - คุณต้องการตัวเลือกสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังใช้งาน Codex CLI หรือ CLI AI อื่น ๆ ภายในเครื่อง และต้องการนำมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจบริดจ์ลูปแบ็ก MCP สำหรับการเข้าถึงเครื่องมือแบ็กเอนด์ของ CLI
summary: 'แบ็กเอนด์ CLI: ทางสำรอง AI CLI ในเครื่องพร้อมบริดจ์เครื่องมือ MCP แบบเลือกใช้ได้'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-05-02T10:15:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **AI CLI ภายในเครื่อง** เป็น **แผนสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ล่ม,
ถูกจำกัดอัตรา, หรือทำงานผิดปกติชั่วคราว สิ่งนี้ตั้งใจให้อยู่ในแนวทางอนุรักษ์นิยม:

- **เครื่องมือของ OpenClaw จะไม่ถูกฉีดเข้าไปโดยตรง** แต่แบ็กเอนด์ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือ Gateway ผ่านบริดจ์ MCP แบบ loopback ได้
- **การสตรีม JSONL** สำหรับ CLI ที่รองรับ
- **รองรับเซสชัน** (เพื่อให้เทิร์นติดตามต่อเนื่องสอดคล้องกัน)
- **ส่งรูปภาพผ่านได้** หาก CLI รับพาธรูปภาพ

สิ่งนี้ออกแบบมาเป็น **ตาข่ายนิรภัย** มากกว่าจะเป็นเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบข้อความที่ “ใช้งานได้เสมอ” โดยไม่ต้องพึ่งพา API ภายนอก

หากคุณต้องการรันไทม์ฮาร์เนสเต็มรูปแบบที่มีการควบคุมเซสชัน ACP, งานพื้นหลัง,
การผูกเธรด/บทสนทนา, และเซสชันเขียนโค้ดภายนอกแบบคงอยู่ ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน แบ็กเอนด์ CLI ไม่ใช่ ACP

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI **โดยไม่ต้องมีการตั้งค่าใดๆ** (Plugin OpenAI ที่รวมมาให้
จะลงทะเบียนแบ็กเอนด์เริ่มต้น):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

หาก Gateway ของคุณทำงานภายใต้ launchd/systemd และ PATH มีค่าน้อยที่สุด ให้เพิ่มเพียง
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

เท่านี้ก็พอ ไม่ต้องใช้คีย์ และไม่ต้องมีการตั้งค่า auth เพิ่มเติมนอกเหนือจาก CLI เอง

หากคุณใช้แบ็กเอนด์ CLI ที่รวมมาให้เป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ Gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่รวมมาให้ซึ่งเป็นเจ้าของโดยอัตโนมัติ เมื่อการตั้งค่าของคุณ
อ้างอิงแบ็กเอนด์นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้เป็นแผนสำรอง

เพิ่มแบ็กเอนด์ CLI เข้าไปในรายการแผนสำรองของคุณ เพื่อให้ทำงานเฉพาะเมื่อโมเดลหลักล้มเหลว:

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

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องรวมโมเดลแบ็กเอนด์ CLI ของคุณไว้ในนั้นด้วย
- หากผู้ให้บริการหลักล้มเหลว (auth, rate limits, timeouts) OpenClaw จะ
  ลองใช้แบ็กเอนด์ CLI ถัดไป

## ภาพรวมการตั้งค่า

แบ็กเอนด์ CLI ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการใช้ **provider id** เป็นคีย์ (เช่น `codex-cli`, `my-cli`)
provider id จะกลายเป็นฝั่งซ้ายของ model ref ของคุณ:

```
<provider>/<model>
```

### ตัวอย่างการตั้งค่า

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

## วิธีทำงาน

1. **เลือกแบ็กเอนด์** ตามคำนำหน้าผู้ให้บริการ (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้พรอมป์ OpenClaw เดียวกัน + บริบทเวิร์กสเปซ
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   แบ็กเอนด์ `claude-cli` ที่รวมมาให้จะคงกระบวนการ Claude stdio ไว้ต่อหนึ่ง
   เซสชัน OpenClaw และส่งเทิร์นติดตามผ่าน stream-json stdin
4. **แยกวิเคราะห์เอาต์พุต** (JSON หรือข้อความธรรมดา) แล้วคืนข้อความสุดท้าย
5. **คง session id ไว้** ต่อแบ็กเอนด์ เพื่อให้เทิร์นติดตามใช้เซสชัน CLI เดิมซ้ำ

<Note>
แบ็กเอนด์ Anthropic `claude-cli` ที่รวมมาให้ได้รับการรองรับอีกครั้ง เจ้าหน้าที่ Anthropic
แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้งาน
`claude -p` ได้รับการอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

แบ็กเอนด์ OpenAI `codex-cli` ที่รวมมาให้จะส่ง system prompt ของ OpenClaw ผ่าน
การ override การตั้งค่า `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่เปิดเผยแฟล็กแบบ Claude
`--append-system-prompt` ดังนั้น OpenClaw จึงเขียนพรอมป์ที่ประกอบแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละเซสชัน Codex CLI ใหม่

แบ็กเอนด์ Anthropic `claude-cli` ที่รวมมาให้รับสแนปช็อต Skills ของ OpenClaw
สองทาง: แค็ตตาล็อก Skills ของ OpenClaw แบบกระชับใน system prompt ที่ต่อท้าย และ
Plugin Claude Code ชั่วคราวที่ส่งด้วย `--plugin-dir` Plugin นี้มี
เฉพาะ Skills ที่เข้าเกณฑ์สำหรับเอเจนต์/เซสชันนั้น ดังนั้นตัวแก้ไข Skills ดั้งเดิมของ Claude Code
จะเห็นชุดที่กรองแล้วชุดเดียวกับที่ OpenClaw จะประกาศใน
พรอมป์แทน การ override env/API key ของ Skill ยังถูก OpenClaw นำไปใช้กับ
สภาพแวดล้อมของกระบวนการลูกสำหรับการรัน

Claude CLI ยังมีโหมดสิทธิ์แบบไม่โต้ตอบของตัวเอง OpenClaw แมปสิ่งนั้น
กับนโยบาย exec ที่มีอยู่แทนการเพิ่มการตั้งค่าเฉพาะ Claude: เมื่อ
นโยบาย exec ที่ร้องขอและมีผลคือ YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`) OpenClaw จะเพิ่ม `--permission-mode bypassPermissions`
การตั้งค่า `agents.list[].tools.exec` รายเอเจนต์จะแทนที่ `tools.exec` ส่วนกลางสำหรับ
เอเจนต์นั้น หากต้องการบังคับโหมด Claude อื่น ให้ตั้งค่า raw backend args อย่างชัดเจน
เช่น `--permission-mode default` หรือ `--permission-mode acceptEdits` ภายใต้
`agents.defaults.cliBackends.claude-cli.args` และ `resumeArgs` ที่ตรงกัน

ก่อนที่ OpenClaw จะใช้แบ็กเอนด์ `claude-cli` ที่รวมมาให้ได้ Claude Code เอง
ต้องล็อกอินอยู่แล้วบนโฮสต์เดียวกัน:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อไบนารี `claude`
ไม่ได้อยู่บน `PATH` อยู่แล้ว

## เซสชัน

- หาก CLI รองรับเซสชัน ให้ตั้งค่า `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  ลงในหลายแฟล็ก
- หาก CLI ใช้ **คำสั่งย่อย resume** ที่มีแฟล็กต่างกัน ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และอาจตั้งค่า `resumeOutput`
  (สำหรับการ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (UUID ใหม่หากยังไม่มีที่จัดเก็บไว้)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยจัดเก็บไว้ก่อนหน้า
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้เทิร์นติดตามใช้กระบวนการ Claude สดซ้ำขณะที่
  ยังทำงานอยู่ stdio แบบอุ่นเป็นค่าเริ่มต้นแล้วในตอนนี้ รวมถึงสำหรับการตั้งค่าแบบกำหนดเอง
  ที่ละเว้นฟิลด์ transport หาก Gateway รีสตาร์ตหรือกระบวนการที่ idle
  ออก OpenClaw จะ resume จาก session id ของ Claude ที่จัดเก็บไว้ session
  id ที่จัดเก็บไว้จะถูกตรวจสอบกับทรานสคริปต์โปรเจกต์ที่อ่านได้และมีอยู่ก่อน
  resume ดังนั้นการผูกแบบ phantom จะถูกล้างด้วย `reason=transcript-missing`
  แทนที่จะเริ่มเซสชัน Claude CLI ใหม่อย่างเงียบๆ ภายใต้ `--resume`
- เซสชันสดของ Claude จะคงตัวป้องกันเอาต์พุต JSONL แบบมีขอบเขต ค่าเริ่มต้นอนุญาตได้ถึง
  8 MiB และ 20,000 บรรทัด JSONL ดิบต่อเทิร์น เทิร์น Claude ที่ใช้เครื่องมือหนักสามารถเพิ่ม
  ค่าเหล่านี้ต่อแบ็กเอนด์ได้ด้วย
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  และ `maxTurnLines`; OpenClaw จะจำกัดการตั้งค่าเหล่านั้นไว้ที่ 64 MiB และ 100,000
  บรรทัด
- เซสชัน CLI ที่จัดเก็บไว้คือความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การรีเซ็ตเซสชันรายวัน
  โดยนัยจะไม่ตัดเซสชันเหล่านั้น; `/reset` และนโยบาย `session.reset` ที่ชัดเจนยังคง
  ทำเช่นนั้น

หมายเหตุเกี่ยวกับการทำให้เป็นลำดับ:

- `serialize: true` ทำให้การรันในเลนเดียวกันเรียงตามลำดับ
- CLI ส่วนใหญ่ทำให้เป็นลำดับบนเลนผู้ให้บริการเดียว
- OpenClaw จะยกเลิกการใช้เซสชัน CLI ที่จัดเก็บไว้ซ้ำเมื่อ auth identity ที่เลือกเปลี่ยนไป,
  รวมถึง auth profile id ที่เปลี่ยน, static API key, static token, หรือ OAuth
  account identity เมื่อ CLI เปิดเผยค่าใดค่าหนึ่ง การหมุนเวียน OAuth access และ refresh token
  จะไม่ตัดเซสชัน CLI ที่จัดเก็บไว้ หาก CLI ไม่เปิดเผย
  OAuth account id ที่เสถียร OpenClaw จะให้ CLI นั้นบังคับใช้สิทธิ์ resume เอง

## บทนำแผนสำรองจากเซสชัน claude-cli

เมื่อความพยายามของ `claude-cli` fail over ไปยัง candidate ที่ไม่ใช่ CLI ใน
[`agents.defaults.model.fallbacks`](/th/concepts/model-failover) OpenClaw จะเติม seed
ความพยายามถัดไปด้วย context prelude ที่เก็บเกี่ยวจากทรานสคริปต์ JSONL ภายในเครื่องของ Claude Code
ที่ `~/.claude/projects/` หากไม่มี seed นี้ ผู้ให้บริการแผนสำรอง
จะเริ่มแบบเย็น เพราะทรานสคริปต์เซสชันของ OpenClaw เองว่างเปล่า
สำหรับการรัน `claude-cli`

- prelude จะเลือกสรุป `/compact` ล่าสุดหรือ marker `compact_boundary`
  ก่อน แล้วต่อท้ายเทิร์นหลัง boundary ล่าสุดจนถึงงบประมาณอักขระ
  เทิร์นก่อน boundary จะถูกทิ้ง เพราะสรุปนั้นแทนเทิร์นเหล่านั้นแล้ว
- บล็อกเครื่องมือจะถูกรวมเป็นคำใบ้แบบกระชับ `(tool call: name)` และ
  `(tool result: …)` เพื่อรักษางบประมาณพรอมป์อย่างซื่อตรง สรุปจะถูก
  ระบุว่า `(truncated)` หากเกินขนาด
- แผนสำรอง `claude-cli` ไป `claude-cli` ที่เป็นผู้ให้บริการเดียวกันจะพึ่งพา
  `--resume` ของ Claude เองและข้าม prelude
- seed จะใช้การตรวจสอบพาธไฟล์เซสชัน Claude ที่มีอยู่ซ้ำ ดังนั้น
  จึงไม่สามารถอ่านพาธโดยพลการได้

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณรับพาธรูปภาพ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงในไฟล์ชั่วคราว หากตั้งค่า `imageArg` ไว้ พาธเหล่านั้น
จะถูกส่งเป็น args ของ CLI หากไม่มี `imageArg` OpenClaw จะต่อท้าย
พาธไฟล์เข้ากับพรอมป์ (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ภายในเครื่องจากพาธธรรมดาโดยอัตโนมัติ

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับเอาต์พุต JSON ของ Gemini CLI OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` ไม่มีหรือว่าง
- `output: "jsonl"` จะแยกวิเคราะห์สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความเอเจนต์สุดท้ายพร้อมตัวระบุเซสชัน
  เมื่อมี
- `output: "text"` ถือว่า stdout เป็นคำตอบสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) ส่งพรอมป์เป็น arg สุดท้ายของ CLI
- `input: "stdin"` ส่งพรอมป์ผ่าน stdin
- หากพรอมป์ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (Plugin เป็นเจ้าของ)

Plugin OpenAI ที่รวมมาให้ยังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google ที่รวมมาให้ยังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI ภายในเครื่องและพร้อมใช้งานเป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะอ่านจากฟิลด์ JSON `response`
- Usage จะ fallback ไปที่ `stats` เมื่อ `usage` ไม่มีหรือว่าง
- `stats.cached` จะถูก normalize เป็น OpenClaw `cacheRead`
- หาก `stats.input` ไม่มี OpenClaw จะ derive input tokens จาก
  `stats.input_tokens - stats.cached`

Override เฉพาะเมื่อจำเป็น (ที่พบบ่อย: พาธ `command` แบบ absolute)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ค่าเริ่มต้นของแบ็กเอนด์ CLI ตอนนี้เป็นส่วนหนึ่งของพื้นผิว Plugin:

- Plugin ลงทะเบียนรายการเหล่านี้ด้วย `api.registerCliBackend(...)`
- แบ็กเอนด์ `id` จะกลายเป็นคำนำหน้าผู้ให้บริการในข้อมูลอ้างอิงโมเดล
- การกำหนดค่าของผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคงแทนที่ค่าเริ่มต้นของ Plugin
- การล้างการกำหนดค่าเฉพาะแบ็กเอนด์ยังคงเป็นของ Plugin ผ่าน hook เสริม
  `normalizeConfig`

Plugin ที่ต้องการชิมความเข้ากันได้ของพรอมป์/ข้อความขนาดเล็กสามารถประกาศ
การแปลงข้อความแบบสองทิศทางได้โดยไม่ต้องแทนที่ผู้ให้บริการหรือแบ็กเอนด์ CLI:

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

`input` เขียน system prompt และ user prompt ที่ส่งไปยัง CLI ใหม่ `output`
เขียนเดลตาของผู้ช่วยที่สตรีมมาและข้อความสุดท้ายที่แยกวิเคราะห์แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
เครื่องหมายควบคุมและการส่งมอบผ่านช่องทางของตัวเอง

สำหรับ CLI ที่ปล่อย JSONL ซึ่งเข้ากันได้กับ Claude Code stream-json ให้ตั้งค่า
`jsonlDialect: "claude-stream-json"` ในการกำหนดค่าของแบ็กเอนด์นั้น

## โอเวอร์เลย์ MCP แบบบันเดิล

แบ็กเอนด์ CLI **ไม่ได้** รับการเรียกเครื่องมือ OpenClaw โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้โอเวอร์เลย์การกำหนดค่า MCP ที่สร้างขึ้นด้วย `bundleMcp: true`

พฤติกรรมที่บันเดิลอยู่ในปัจจุบัน:

- `claude-cli`: ไฟล์การกำหนดค่า MCP แบบเข้มงวดที่สร้างขึ้น
- `codex-cli`: การแทนที่การกำหนดค่าแบบอินไลน์สำหรับ `mcp_servers`; เซิร์ฟเวอร์
  OpenClaw loopback ที่สร้างขึ้นจะถูกทำเครื่องหมายด้วยโหมดอนุมัติเครื่องมือต่อเซิร์ฟเวอร์ของ Codex
  เพื่อให้การเรียก MCP ไม่ค้างที่พรอมป์อนุมัติในเครื่อง
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้ bundle MCP แล้ว OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผยเครื่องมือ Gateway ให้กับกระบวนการ CLI
- ยืนยันตัวตนของบริดจ์ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือไว้ที่บริบทเซสชัน บัญชี และช่องทางปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้สำหรับเวิร์กสเปซปัจจุบัน
- รวมเซิร์ฟเวอร์เหล่านั้นกับรูปแบบการกำหนดค่า/การตั้งค่า MCP ของแบ็กเอนด์ที่มีอยู่
- เขียนการกำหนดค่าการเปิดใช้งานใหม่โดยใช้โหมดการผสานรวมที่แบ็กเอนด์เป็นเจ้าของจากส่วนขยายเจ้าของ

ถ้าไม่มีเซิร์ฟเวอร์ MCP ที่เปิดใช้ OpenClaw ยังคงแทรกการกำหนดค่าแบบเข้มงวดเมื่อ
แบ็กเอนด์เลือกใช้ bundle MCP เพื่อให้การรันเบื้องหลังยังคงแยกโดดเดี่ยว

รันไทม์ MCP ที่บันเดิลและมีขอบเขตตามเซสชันจะถูกแคชเพื่อนำกลับมาใช้ภายในเซสชัน จากนั้น
ถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่าเป็น `0` เพื่อปิดใช้) การรันแบบฝังครั้งเดียว เช่น การตรวจสอบ auth,
การสร้าง slug และคำขอเรียกคืน active-memory จะทำความสะอาดเมื่อการรันสิ้นสุด เพื่อให้กระบวนการลูกแบบ stdio
และสตรีม Streamable HTTP/SSE ไม่อยู่เกินอายุของการรัน

## ข้อจำกัด

- **ไม่มีการเรียกเครื่องมือ OpenClaw โดยตรง** OpenClaw ไม่แทรกการเรียกเครื่องมือเข้าไปใน
  โปรโตคอลแบ็กเอนด์ CLI แบ็กเอนด์จะเห็นเครื่องมือ Gateway ก็ต่อเมื่อเลือกใช้
  `bundleMcp: true` เท่านั้น
- **การสตรีมขึ้นอยู่กับแบ็กเอนด์** บางแบ็กเอนด์สตรีม JSONL; บางแบ็กเอนด์บัฟเฟอร์
  จนกว่าจะออก
- **เอาต์พุตแบบมีโครงสร้าง** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชัน Codex CLI** ทำงานต่อผ่านเอาต์พุตข้อความ (ไม่มี JSONL) ซึ่งมีโครงสร้างน้อยกว่า
  การรัน `--json` เริ่มต้น เซสชัน OpenClaw ยังคงทำงานได้ตามปกติ

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธเต็ม
- **ชื่อโมเดลไม่ถูกต้อง**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดล CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบให้แน่ใจว่าตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none` (ปัจจุบัน Codex CLI ยังไม่สามารถทำงานต่อด้วยเอาต์พุต JSON ได้)
- **รูปภาพถูกละเว้น**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
