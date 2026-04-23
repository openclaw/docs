---
read_when:
    - คุณต้องการทางสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังเรียกใช้ Codex CLI หรือ AI CLI ภายในเครื่องอื่นๆ และต้องการนำกลับมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจ local loopback bridge ของ MCP สำหรับการเข้าถึง tools ของแบ็กเอนด์ CLI
summary: 'แบ็กเอนด์ CLI: local AI CLI fallback พร้อม MCP tool bridge แบบไม่บังคับ'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-04-23T10:17:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# แบ็กเอนด์ CLI (runtime สำรอง)

OpenClaw สามารถรัน **AI CLI ภายในเครื่อง** เป็น **ทางสำรองแบบข้อความล้วน** ได้เมื่อผู้ให้บริการ API ใช้งานไม่ได้
ติด rate limit หรือมีปัญหาชั่วคราว แนวทางนี้ตั้งใจให้ระมัดระวังเป็นพิเศษ:

- **OpenClaw tools จะไม่ถูก inject โดยตรง** แต่แบ็กเอนด์ที่ตั้งค่า `bundleMcp: true`
  สามารถรับ gateway tools ผ่าน MCP bridge แบบ loopback ได้
- **JSONL streaming** สำหรับ CLI ที่รองรับ
- **รองรับ sessions** (ดังนั้นรอบถัดไปของการสนทนาจะยังคงต่อเนื่อง)
- **สามารถส่งผ่านรูปภาพได้** หาก CLI ยอมรับพาธของรูปภาพ

สิ่งนี้ออกแบบมาเป็น **ตาข่ายนิรภัย** มากกว่าเส้นทางหลัก ใช้เมื่อคุณ
ต้องการการตอบกลับแบบข้อความที่ “ใช้งานได้เสมอ” โดยไม่ต้องพึ่ง API ภายนอก

หากคุณต้องการ runtime แบบ harness เต็มรูปแบบพร้อมการควบคุม ACP session, background tasks,
การผูก thread/การสนทนา และ external coding sessions แบบคงอยู่ ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน แบ็กเอนด์ CLI ไม่ใช่ ACP

## การเริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI **ได้โดยไม่ต้องมี config ใดๆ** (OpenAI Plugin ที่มากับระบบ
จะลงทะเบียนแบ็กเอนด์เริ่มต้นให้):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

หาก gateway ของคุณทำงานภายใต้ launchd/systemd และ PATH มีน้อย ให้เพิ่มเพียง
พาธของคำสั่ง:

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

เพียงเท่านี้ ไม่ต้องใช้คีย์ และไม่ต้องมีการกำหนดค่า auth เพิ่มเติมนอกเหนือจากตัว CLI เอง

หากคุณใช้แบ็กเอนด์ CLI ที่มากับระบบเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่เป็นเจ้าของโดยอัตโนมัติเมื่อ config ของคุณ
อ้างถึงแบ็กเอนด์นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้เป็นทางสำรอง

เพิ่มแบ็กเอนด์ CLI เข้าไปในรายการ fallback เพื่อให้มันทำงานเฉพาะเมื่อโมเดลหลักล้มเหลว:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

หมายเหตุ:

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องใส่โมเดลของแบ็กเอนด์ CLI ไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (auth, rate limits, timeouts) OpenClaw จะ
  ลองใช้แบ็กเอนด์ CLI ถัดไป

## ภาพรวมการกำหนดค่า

แบ็กเอนด์ CLI ทั้งหมดอยู่ภายใต้:

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
          // CLIs แบบ Codex สามารถชี้ไปยังไฟล์พรอมป์แทนได้:
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

1. **เลือกแบ็กเอนด์** ตาม prefix ของ provider (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt + workspace context แบบเดียวกับ OpenClaw
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   แบ็กเอนด์ `claude-cli` ที่มากับระบบจะคง Claude stdio process หนึ่งตัวไว้ต่อ
   OpenClaw session และส่งรอบถัดไปผ่าน stream-json stdin
4. **แยกวิเคราะห์ผลลัพธ์** (JSON หรือข้อความล้วน) แล้วส่งคืนข้อความสุดท้าย
5. **บันทึก session ids** แยกตามแบ็กเอนด์ เพื่อให้รอบถัดไปใช้ CLI session เดิมซ้ำ

<Note>
แบ็กเอนด์ `claude-cli` ของ Anthropic ที่มากับระบบกลับมารองรับอีกครั้งแล้ว พนักงานของ Anthropic
แจ้งเราว่าการใช้ Claude CLI ในรูปแบบของ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้ `claude -p` ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบาย
ใหม่
</Note>

แบ็กเอนด์ `codex-cli` ของ OpenAI ที่มากับระบบจะส่ง system prompt ของ OpenClaw ผ่าน
การเขียนทับ config `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่มีแฟล็ก
`--append-system-prompt` แบบ Claude ดังนั้น OpenClaw จึงเขียน prompt ที่ประกอบเสร็จแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละ Codex CLI session ใหม่

แบ็กเอนด์ `claude-cli` ของ Anthropic ที่มากับระบบจะรับ OpenClaw skills snapshot
สองทาง: ผ่าน OpenClaw skills catalog แบบย่อใน appended system prompt และ
ผ่าน Claude Code Plugin ชั่วคราวที่ส่งด้วย `--plugin-dir` ตัว Plugin จะมีเฉพาะ
Skills ที่เข้าเกณฑ์สำหรับ agent/session นั้น ดังนั้นตัวแก้ไข Skills แบบเนทีฟของ Claude Code จะเห็น
ชุดที่ถูกกรองแบบเดียวกับที่ OpenClaw จะประกาศใน prompt อยู่แล้ว การเขียนทับ env/API key ของ Skill
จะยังคงถูกใช้โดย OpenClaw กับสภาพแวดล้อมของ child process ในการรันนั้น

## Sessions

- หาก CLI รองรับ sessions ให้ตั้ง `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  ลงในหลายแฟล็ก
- หาก CLI ใช้ **resume subcommand** พร้อมแฟล็กชุดอื่น ให้ตั้ง
  `resumeArgs` (ใช้แทน `args` เมื่อ resume) และสามารถตั้ง `resumeOutput`
  เพิ่มได้ (สำหรับการ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (สร้าง UUID ใหม่หากยังไม่มีที่จัดเก็บ)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยมีการจัดเก็บไว้ก่อนหน้า
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` ใช้ค่าเริ่มต้น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้รอบถัดไปใช้ Claude process ที่ยังทำงานอยู่ซ้ำ
  Warm stdio เป็นค่าเริ่มต้นแล้วในตอนนี้ รวมถึงสำหรับ config แบบกำหนดเอง
  ที่ไม่ได้ระบุฟิลด์ transport หาก Gateway รีสตาร์ต หรือ idle process ปิดตัวลง
  OpenClaw จะ resume จาก Claude session id ที่จัดเก็บไว้ session ids ที่จัดเก็บไว้
  จะถูกตรวจสอบกับ project transcript ที่อ่านได้และมีอยู่จริงก่อน
  การ resume ดังนั้น phantom bindings จะถูกล้างด้วย `reason=transcript-missing`
  แทนที่จะเริ่ม Claude CLI session ใหม่อย่างเงียบๆ ภายใต้ `--resume`
- CLI sessions ที่จัดเก็บไว้เป็นความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การรีเซ็ตเซสชันรายวันโดยนัย
  จะไม่ตัดมัน; แต่ `/reset` และนโยบาย `session.reset` แบบระบุชัดยังคงตัด

หมายเหตุเรื่อง serialization:

- `serialize: true` จะคงลำดับการรันใน lane เดียวกัน
- CLI ส่วนใหญ่ทำ serialization บน provider lane เดียว
- OpenClaw จะยกเลิกการใช้ CLI session ที่จัดเก็บไว้ซ้ำเมื่อ auth identity ที่เลือกเปลี่ยนไป
  รวมถึงเมื่อ auth profile id, static API key, static token หรือ OAuth
  account identity เปลี่ยนไปในกรณีที่ CLI เปิดเผยได้ การหมุนเวียน OAuth access และ refresh token
  จะไม่ตัด CLI session ที่จัดเก็บไว้ หาก CLI ไม่เปิดเผย OAuth account id ที่คงที่
  OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้สิทธิ์การ resume เอง

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณรับพาธรูปภาพได้ ให้ตั้ง `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงไฟล์ชั่วคราว หากมีการตั้ง `imageArg` ไว้
พาธเหล่านั้นจะถูกส่งเป็น CLI args หากไม่มี `imageArg` OpenClaw จะต่อท้าย
พาธไฟล์เข้าไปใน prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ในเครื่องอัตโนมัติจากพาธข้อความล้วน

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับเอาต์พุต JSON ของ Gemini CLI OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` ไม่มีอยู่หรือว่างเปล่า
- `output: "jsonl"` จะแยกวิเคราะห์สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความ agent สุดท้ายพร้อม session
  identifiers เมื่อมี
- `output: "text"` จะถือว่า stdout คือคำตอบสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) จะส่ง prompt เป็น CLI arg ตัวสุดท้าย
- `input: "stdin"` จะส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและมีการตั้ง `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (Plugin เป็นเจ้าของ)

OpenAI Plugin ที่มากับระบบยังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Google Plugin ที่มากับระบบยังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

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

หมายเหตุเกี่ยวกับ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะถูกอ่านจากฟิลด์ JSON `response`
- Usage จะ fallback ไปใช้ `stats` เมื่อ `usage` ไม่มีหรือว่างเปล่า
- `stats.cached` จะถูกปรับให้เป็น OpenClaw `cacheRead`
- หาก `stats.input` ไม่มี OpenClaw จะคำนวณ input tokens จาก
  `stats.input_tokens - stats.cached`

เขียนทับเฉพาะเมื่อจำเป็นเท่านั้น (พบบ่อย: พาธ `command` แบบ absolute)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ค่าเริ่มต้นของแบ็กเอนด์ CLI ตอนนี้เป็นส่วนหนึ่งของพื้นผิว Plugin แล้ว:

- Plugins ลงทะเบียนด้วย `api.registerCliBackend(...)`
- `id` ของแบ็กเอนด์จะกลายเป็น provider prefix ใน model refs
- config ของผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคงเขียนทับค่าเริ่มต้นของ Plugin ได้
- การ cleanup config แบบเฉพาะแบ็กเอนด์ยังคงเป็นของ Plugin ผ่าน
  hook `normalizeConfig` แบบไม่บังคับ

Plugins ที่ต้องการ shim ความเข้ากันได้ขนาดเล็กสำหรับ prompt/message สามารถประกาศ
text transforms แบบสองทิศทางได้โดยไม่ต้องแทนที่ provider หรือแบ็กเอนด์ CLI:

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

`input` จะเขียนทับ system prompt และ user prompt ที่ส่งไปยัง CLI `output`
จะเขียนทับ assistant deltas แบบสตรีมและ final text ที่แยกวิเคราะห์แล้วก่อนที่ OpenClaw จะจัดการ
control markers ของตัวเองและการส่งผ่านช่องทาง

สำหรับ CLI ที่ปล่อย JSONL ซึ่งเข้ากันได้กับ Claude Code stream-json ให้ตั้ง
`jsonlDialect: "claude-stream-json"` ใน config ของแบ็กเอนด์นั้น

## Bundle MCP overlays

แบ็กเอนด์ CLI จะ **ไม่ได้รับ OpenClaw tool calls โดยตรง** แต่แบ็กเอนด์สามารถ
เลือกใช้ MCP config overlay ที่สร้างขึ้นอัตโนมัติได้ด้วย `bundleMcp: true`

พฤติกรรมของระบบที่มากับปัจจุบัน:

- `claude-cli`: ไฟล์ MCP config แบบ strict ที่สร้างขึ้น
- `codex-cli`: inline config overrides สำหรับ `mcp_servers`
- `google-gemini-cli`: ไฟล์ Gemini system settings ที่สร้างขึ้น

เมื่อเปิดใช้งาน bundle MCP, OpenClaw จะ:

- สร้าง loopback HTTP MCP server ที่เปิดเผย gateway tools ให้กับ CLI process
- ยืนยันตัวตนของ bridge ด้วย token ต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึง tools ให้ตรงกับ session, account และ channel context ปัจจุบัน
- โหลด bundle-MCP servers ที่เปิดใช้งานสำหรับ workspace ปัจจุบัน
- รวมเข้ากับรูปร่าง MCP config/settings ของแบ็กเอนด์ที่มีอยู่แล้ว
- เขียนทับ launch config โดยใช้ integration mode ที่ส่วนขยายเจ้าของเป็นผู้กำหนด

หากไม่มี MCP servers ที่เปิดใช้งาน OpenClaw ก็ยัง inject strict config เมื่อ
แบ็กเอนด์เลือกใช้ bundle MCP เพื่อให้ background runs ยังคงถูกแยกขาด

## ข้อจำกัด

- **ไม่มี OpenClaw tool calls โดยตรง** OpenClaw จะไม่ inject tool calls เข้าไปใน
  protocol ของแบ็กเอนด์ CLI แบ็กเอนด์จะเห็น gateway tools ได้ก็ต่อเมื่อเลือกใช้
  `bundleMcp: true` เท่านั้น
- **การสตรีมขึ้นอยู่กับแบ็กเอนด์** บางแบ็กเอนด์สตรีม JSONL; บางตัวบัฟเฟอร์
  จนกระทั่งออกจากโปรแกรม
- **Structured outputs** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชันของ Codex CLI** resume ผ่านเอาต์พุตข้อความ (ไม่ใช่ JSONL) ซึ่งมี
  โครงสร้างน้อยกว่าการรัน `--json` ครั้งแรก แต่ OpenClaw sessions ยังคงทำงาน
  ได้ตามปกติ

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้ง `command` เป็นพาธแบบเต็ม
- **ชื่อโมเดลไม่ถูกต้อง**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดลของ CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบว่าได้ตั้ง `sessionArg` และ `sessionMode` ไม่ใช่
  `none` (ปัจจุบัน Codex CLI ยังไม่สามารถ resume พร้อมเอาต์พุต JSON ได้)
- **รูปภาพถูกละเว้น**: ตั้ง `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)
