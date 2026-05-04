---
read_when:
    - คุณต้องการทางเลือกสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังใช้งาน Codex CLI หรือ CLI ปัญญาประดิษฐ์ภายในเครื่องอื่น ๆ และต้องการนำมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจสะพานเชื่อมลูปแบ็ก MCP สำหรับการเข้าถึงเครื่องมือแบ็กเอนด์ของ CLI
summary: 'แบ็กเอนด์ CLI: ตัวสำรอง AI CLI ภายในเครื่องพร้อมบริดจ์เครื่องมือ MCP แบบเลือกใช้ได้'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-05-04T18:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw สามารถรัน **AI CLI ภายในเครื่อง** เป็น **เส้นทางสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ล่ม,
ถูกจำกัดอัตรา, หรือทำงานผิดปกติชั่วคราว แนวทางนี้ตั้งใจให้ระมัดระวัง:

- **เครื่องมือ OpenClaw จะไม่ถูกฉีดเข้าโดยตรง** แต่ backend ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือ Gateway ผ่านบริดจ์ MCP แบบ local loopback ได้
- **การสตรีม JSONL** สำหรับ CLI ที่รองรับ
- **รองรับเซสชัน** (เพื่อให้รอบสนทนาต่อเนื่องยังสอดคล้องกัน)
- **สามารถส่งรูปภาพผ่านได้** หาก CLI ยอมรับพาธรูปภาพ

สิ่งนี้ออกแบบมาเป็น **ตาข่ายนิรภัย** มากกว่าเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบแบบข้อความที่ “ใช้งานได้เสมอ” โดยไม่ต้องพึ่ง API ภายนอก

หากคุณต้องการ runtime แบบ harness เต็มรูปแบบพร้อมการควบคุมเซสชัน ACP, งานเบื้องหลัง,
การผูกเธรด/การสนทนา, และเซสชันเขียนโค้ดภายนอกแบบถาวร ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน backend แบบ CLI ไม่ใช่ ACP

## เริ่มต้นอย่างง่ายสำหรับมือใหม่

คุณสามารถใช้ Codex CLI **โดยไม่ต้องมี config ใดๆ** (OpenAI Plugin ที่บันเดิลมา
จะลงทะเบียน backend เริ่มต้นไว้):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

หาก gateway ของคุณรันภายใต้ launchd/systemd และ PATH มีค่าน้อยที่สุด ให้เพิ่มเฉพาะ
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

เท่านี้ก็พอ ไม่ต้องใช้คีย์ ไม่ต้องมี config ยืนยันตัวตนเพิ่มเติมนอกเหนือจากตัว CLI เอง

หากคุณใช้ backend แบบ CLI ที่บันเดิลมาเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่บันเดิลมาและเป็นเจ้าของ backend นั้นให้อัตโนมัติเมื่อ config ของคุณ
อ้างถึง backend นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้เป็นเส้นทางสำรอง

เพิ่ม backend แบบ CLI เข้าไปในรายการสำรองของคุณ เพื่อให้รันเฉพาะเมื่อโมเดลหลักล้มเหลว:

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

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องใส่โมเดล backend แบบ CLI ของคุณไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (การยืนยันตัวตน, การจำกัดอัตรา, timeout) OpenClaw จะ
  ลอง backend แบบ CLI ถัดไป

## ภาพรวมการกำหนดค่า

backend แบบ CLI ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการใช้ **provider id** เป็นคีย์ (เช่น `codex-cli`, `my-cli`)
provider id จะกลายเป็นด้านซ้ายของ model ref ของคุณ:

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

## วิธีทำงาน

1. **เลือก backend** ตาม prefix ของผู้ให้บริการ (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt ของ OpenClaw ชุดเดียวกัน + บริบท workspace
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   backend `claude-cli` ที่บันเดิลมาจะคง process Claude stdio ไว้ต่อ
   เซสชัน OpenClaw และส่งรอบสนทนาต่อเนื่องผ่าน stream-json stdin
4. **แยกวิเคราะห์ output** (JSON หรือข้อความธรรมดา) แล้วส่งข้อความสุดท้ายกลับ
5. **บันทึก session id แบบถาวร** ต่อ backend เพื่อให้รอบสนทนาต่อเนื่องใช้เซสชัน CLI เดิมซ้ำ

<Note>
backend Anthropic `claude-cli` ที่บันเดิลมารองรับอีกครั้งแล้ว เจ้าหน้าที่ Anthropic
บอกเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้งาน `claude -p` ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

backend OpenAI `codex-cli` ที่บันเดิลมาจะส่ง system prompt ของ OpenClaw ผ่าน
config override `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่มี flag แบบ Claude
`--append-system-prompt` ดังนั้น OpenClaw จะเขียน prompt ที่ประกอบแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละเซสชัน Codex CLI ใหม่

backend Anthropic `claude-cli` ที่บันเดิลมารับสแนปช็อต Skills ของ OpenClaw
สองทาง: แค็ตตาล็อก Skills ของ OpenClaw แบบกะทัดรัดใน system prompt ที่ append เข้าไป และ
Claude Code Plugin ชั่วคราวที่ส่งด้วย `--plugin-dir` Plugin มีเฉพาะ
Skills ที่เข้าเงื่อนไขสำหรับ agent/เซสชันนั้น ดังนั้นตัว resolver Skills แบบ native ของ Claude Code
จะเห็นชุดที่กรองแล้วเดียวกันกับที่ OpenClaw จะโฆษณาไว้ใน
prompt แทน ค่า override ของ env/API key สำหรับ Skill ยังคงถูก OpenClaw นำไปใช้กับ
สภาพแวดล้อมของ process ลูกสำหรับการรัน

Claude CLI ยังมีโหมดสิทธิ์แบบ noninteractive ของตัวเองด้วย OpenClaw map โหมดนั้น
เข้ากับนโยบาย exec ที่มีอยู่ แทนที่จะเพิ่ม config เฉพาะ Claude: เมื่อ
นโยบาย exec ที่ร้องขอมีผลเป็น YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`) OpenClaw จะเพิ่ม `--permission-mode bypassPermissions`
การตั้งค่า `agents.list[].tools.exec` ราย agent จะแทนที่ `tools.exec` ส่วนกลางสำหรับ
agent นั้น หากต้องการบังคับโหมด Claude อื่น ให้ตั้งค่า raw backend args อย่างชัดเจน
เช่น `--permission-mode default` หรือ `--permission-mode acceptEdits` ภายใต้
`agents.defaults.cliBackends.claude-cli.args` และ `resumeArgs` ที่ตรงกัน

backend Anthropic `claude-cli` ที่บันเดิลมายัง map ระดับ OpenClaw `/think`
ไปยัง flag native `--effort` ของ Claude Code สำหรับระดับที่ไม่ใช่ off ด้วย `minimal` และ
`low` map เป็น `low`, `adaptive` และ `medium` map เป็น `medium`, และ `high`,
`xhigh`, และ `max` map โดยตรง backend แบบ CLI อื่นต้องให้ Plugin ที่เป็นเจ้าของ
ประกาศ argv mapper ที่เทียบเท่าก่อน `/think` จึงจะส่งผลต่อ CLI ที่ spawn ได้

ก่อนที่ OpenClaw จะใช้ backend `claude-cli` ที่บันเดิลมาได้ ตัว Claude Code เอง
ต้องล็อกอินไว้แล้วบนโฮสต์เดียวกัน:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อ binary `claude`
ไม่ได้อยู่บน `PATH` อยู่แล้ว

## เซสชัน

- หาก CLI รองรับเซสชัน ให้ตั้ง `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  ลงในหลาย flag
- หาก CLI ใช้ **resume subcommand** พร้อม flag ที่แตกต่างกัน ให้ตั้ง
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และอาจตั้ง `resumeOutput`
  (สำหรับการ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (UUID ใหม่หากยังไม่มีที่บันทึกไว้)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยบันทึกไว้ก่อนหน้า
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้รอบสนทนาต่อเนื่องใช้ process Claude แบบ live ซ้ำขณะที่
  ยังทำงานอยู่ ตอนนี้ warm stdio เป็นค่าเริ่มต้นแล้ว รวมถึงสำหรับ config แบบกำหนดเอง
  ที่ละเว้น field transport หาก Gateway รีสตาร์ตหรือ process ที่ idle
  ออกไป OpenClaw จะ resume จาก session id ของ Claude ที่เก็บไว้ session
  id ที่เก็บไว้จะถูกตรวจสอบกับ transcript โปรเจกต์ที่มีอยู่และอ่านได้ก่อน
  resume ดังนั้นการผูกที่เป็นภาพลวงจะถูกล้างด้วย `reason=transcript-missing`
  แทนที่จะเริ่มเซสชัน Claude CLI ใหม่อย่างเงียบๆ ภายใต้ `--resume`
- เซสชัน Claude แบบ live จะเก็บ guard output JSONL แบบมีขอบเขต ค่าเริ่มต้นอนุญาตสูงสุด
  8 MiB และ 20,000 บรรทัด JSONL ดิบต่อรอบสนทนา รอบสนทนา Claude ที่ใช้เครื่องมือหนักสามารถเพิ่ม
  ได้ราย backend ด้วย
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  และ `maxTurnLines`; OpenClaw จะ clamp การตั้งค่าเหล่านั้นไว้ที่ 64 MiB และ 100,000
  บรรทัด
- เซสชัน CLI ที่เก็บไว้เป็นความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การ reset เซสชันรายวัน
  โดยนัยจะไม่ตัดเซสชันเหล่านั้น; `/reset` และนโยบาย `session.reset` ที่ชัดเจนยังคง
  ทำเช่นนั้น

หมายเหตุเรื่อง serialization:

- `serialize: true` รักษาลำดับการรันในเลนเดียวกัน
- CLI ส่วนใหญ่ serialize บนเลนผู้ให้บริการเดียว
- OpenClaw จะเลิกใช้เซสชัน CLI ที่เก็บไว้ซ้ำเมื่อ identity การยืนยันตัวตนที่เลือกเปลี่ยน
  รวมถึง auth profile id, static API key, static token, หรือ identity
  บัญชี OAuth ที่เปลี่ยนไปเมื่อ CLI เปิดเผยให้ใช้ การหมุน access token และ refresh token
  ของ OAuth จะไม่ตัดเซสชัน CLI ที่เก็บไว้ หาก CLI ไม่เปิดเผย
  OAuth account id ที่เสถียร OpenClaw จะให้ CLI นั้นบังคับใช้สิทธิ์ resume เอง

## prelude สำรองจากเซสชัน claude-cli

เมื่อความพยายาม `claude-cli` fail over ไปยังตัวเลือกที่ไม่ใช่ CLI ใน
[`agents.defaults.model.fallbacks`](/th/concepts/model-failover) OpenClaw จะ seed
ความพยายามถัดไปด้วย context prelude ที่เก็บจาก transcript JSONL ภายในเครื่องของ Claude Code
ที่ `~/.claude/projects/` หากไม่มี seed นี้ ผู้ให้บริการสำรอง
จะเริ่มแบบไม่มีบริบท เพราะ transcript เซสชันของ OpenClaw เองว่างเปล่า
สำหรับการรัน `claude-cli`

- prelude จะเลือก summary `/compact` ล่าสุดหรือ marker `compact_boundary`
  ก่อน จากนั้น append รอบสนทนาหลัง boundary ล่าสุดเท่าที่ char
  budget อนุญาต รอบสนทนาก่อน boundary จะถูกทิ้ง เพราะ summary แทน
  รอบสนทนาเหล่านั้นอยู่แล้ว
- บล็อกเครื่องมือจะถูกรวมเป็น hint แบบกะทัดรัด `(tool call: name)` และ
  `(tool result: …)` เพื่อรักษา prompt budget ให้ตรงจริง summary จะถูก
  ติดป้าย `(truncated)` หากล้น
- fallback จาก `claude-cli` ไป `claude-cli` ที่เป็นผู้ให้บริการเดียวกันพึ่งพา
  `--resume` ของ Claude เองและข้าม prelude
- seed ใช้การตรวจสอบพาธ session-file ของ Claude ที่มีอยู่ซ้ำ ดังนั้น
  จึงไม่สามารถอ่านพาธใดๆ ตามอำเภอใจได้

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณยอมรับพาธรูปภาพ ให้ตั้ง `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงไฟล์ชั่วคราว หากตั้ง `imageArg` ไว้
พาธเหล่านั้นจะถูกส่งเป็น arg ของ CLI หากไม่มี `imageArg` OpenClaw จะ append
พาธไฟล์เข้าไปใน prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ภายในเครื่องอัตโนมัติจากพาธธรรมดา

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับ output JSON ของ Gemini CLI OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` หายไปหรือว่าง
- `output: "jsonl"` แยกวิเคราะห์สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความ agent สุดท้ายพร้อม session
  identifier เมื่อมี
- `output: "text"` ถือว่า stdout เป็นคำตอบสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) ส่ง prompt เป็น arg สุดท้ายของ CLI
- `input: "stdin"` ส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและตั้ง `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (เป็นของ Plugin)

OpenAI Plugin ที่บันเดิลมายังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Google Plugin ที่บันเดิลมายังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

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

- ข้อความตอบกลับถูกอ่านจากฟิลด์ JSON `response`
- การใช้งานจะ fallback ไปที่ `stats` เมื่อ `usage` ไม่มีอยู่หรือว่างเปล่า
- `stats.cached` ถูก normalize เป็น OpenClaw `cacheRead`
- หาก `stats.input` หายไป OpenClaw จะคำนวณโทเค็นอินพุตจาก
  `stats.input_tokens - stats.cached`

Override เฉพาะเมื่อจำเป็นเท่านั้น (ที่พบบ่อย: พาธ `command` แบบสัมบูรณ์)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ค่าเริ่มต้นของแบ็กเอนด์ CLI เป็นส่วนหนึ่งของพื้นผิว Plugin แล้ว:

- Plugin ลงทะเบียนด้วย `api.registerCliBackend(...)`
- `id` ของแบ็กเอนด์จะกลายเป็น prefix ของ provider ในการอ้างอิงโมเดล
- การกำหนดค่าผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคง override ค่าเริ่มต้นของ Plugin
- การล้างการกำหนดค่าเฉพาะแบ็กเอนด์ยังคงเป็นของ Plugin ผ่าน hook
  `normalizeConfig` แบบไม่บังคับ

Plugin ที่ต้องการ shim ความเข้ากันได้ของพรอมป์/ข้อความขนาดเล็กสามารถประกาศ
การแปลงข้อความสองทิศทางได้โดยไม่ต้องแทนที่ provider หรือแบ็กเอนด์ CLI:

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
เขียน streamed assistant deltas และข้อความสุดท้ายที่ parse แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
control markers และการส่งมอบไปยังช่องทางของตัวเอง

สำหรับ CLI ที่ปล่อย JSONL ที่เข้ากันได้กับ Claude Code stream-json ให้ตั้งค่า
`jsonlDialect: "claude-stream-json"` ในการกำหนดค่าของแบ็กเอนด์นั้น

## overlay MCP แบบบันเดิล

แบ็กเอนด์ CLI จะ **ไม่ได้** รับ tool calls ของ OpenClaw โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้ overlay การกำหนดค่า MCP ที่สร้างขึ้นได้ด้วย `bundleMcp: true`

พฤติกรรมที่บันเดิลอยู่ในปัจจุบัน:

- `claude-cli`: ไฟล์กำหนดค่า MCP แบบเข้มงวดที่สร้างขึ้น
- `codex-cli`: การ override การกำหนดค่าแบบ inline สำหรับ `mcp_servers`; เซิร์ฟเวอร์
  loopback ของ OpenClaw ที่สร้างขึ้นจะถูกทำเครื่องหมายด้วยโหมดอนุมัติเครื่องมือต่อเซิร์ฟเวอร์ของ Codex
  เพื่อให้การเรียก MCP ไม่หยุดค้างที่พรอมป์อนุมัติในเครื่อง
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้ bundle MCP OpenClaw จะ:

- spawn เซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผยเครื่องมือ Gateway ให้กับกระบวนการ CLI
- ตรวจสอบสิทธิ์ bridge ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือไว้ที่บริบทของเซสชัน บัญชี และช่องทางปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้สำหรับ workspace ปัจจุบัน
- ผสานเซิร์ฟเวอร์เหล่านั้นกับรูปแบบการกำหนดค่า/การตั้งค่า MCP ของแบ็กเอนด์ที่มีอยู่
- เขียนการกำหนดค่าการเปิดใช้งานใหม่โดยใช้โหมด integration ที่แบ็กเอนด์เป็นเจ้าของจากส่วนขยายเจ้าของ

หากไม่มีเซิร์ฟเวอร์ MCP ที่เปิดใช้ OpenClaw ยังคง inject การกำหนดค่าแบบเข้มงวดเมื่อ
แบ็กเอนด์เลือกใช้ bundle MCP เพื่อให้การรันเบื้องหลังยังคงถูกแยกออกจากกัน

runtime MCP แบบบันเดิลที่มีขอบเขตตามเซสชันจะถูกแคชไว้เพื่อนำกลับมาใช้ซ้ำภายในเซสชัน จากนั้น
ถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่า `0` เพื่อปิดใช้) การรันแบบฝังตัวครั้งเดียว เช่น auth probes,
การสร้าง slug และคำขอ recall active-memory จะล้างข้อมูลเมื่อการรันสิ้นสุด เพื่อไม่ให้ stdio
children และสตรีม Streamable HTTP/SSE มีอายุยาวกว่าการรัน

## ข้อจำกัด

- **ไม่มี tool calls ของ OpenClaw โดยตรง** OpenClaw ไม่ inject tool calls เข้าไปใน
  โปรโตคอลแบ็กเอนด์ CLI แบ็กเอนด์จะเห็นเครื่องมือ Gateway เฉพาะเมื่อเลือกใช้
  `bundleMcp: true`
- **Streaming ขึ้นอยู่กับแบ็กเอนด์** บางแบ็กเอนด์ stream JSONL; บางแบ็กเอนด์ buffer
  จนกว่าจะออก
- **Structured outputs** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชัน Codex CLI** resume ผ่านเอาต์พุตข้อความ (ไม่มี JSONL) ซึ่งมีโครงสร้างน้อยกว่า
  การรัน `--json` ครั้งแรก เซสชัน OpenClaw ยังคงทำงานได้ตามปกติ

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธเต็ม
- **ชื่อโมเดลไม่ถูกต้อง**: ใช้ `modelAliases` เพื่อ map `provider/model` → โมเดล CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบให้แน่ใจว่าตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none` (ขณะนี้ Codex CLI ยังไม่สามารถ resume ด้วยเอาต์พุต JSON ได้)
- **รูปภาพถูกละเว้น**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [คู่มือการดำเนินงาน Gateway](/th/gateway)
- [โมเดลในเครื่อง](/th/gateway/local-models)
