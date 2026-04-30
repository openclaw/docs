---
read_when:
    - คุณต้องการทางเลือกสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังใช้งาน Codex CLI หรือ CLI ของ AI ในเครื่องอื่น ๆ และต้องการนำมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจบริดจ์ลูปแบ็ก MCP สำหรับการเข้าถึงเครื่องมือแบ็กเอนด์ของ CLI
summary: 'แบ็กเอนด์ CLI: ทางเลือกสำรอง AI CLI ในเครื่องพร้อมบริดจ์เครื่องมือ MCP ที่เลือกใช้ได้'
title: แบ็กเอนด์ของ CLI
x-i18n:
    generated_at: "2026-04-30T09:50:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **AI CLI ภายในเครื่อง** เป็น **ทางสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ล่ม,
ถูกจำกัดอัตรา, หรือทำงานผิดปกติชั่วคราว แนวทางนี้ตั้งใจให้ระมัดระวัง:

- **เครื่องมือของ OpenClaw จะไม่ถูกฉีดเข้าโดยตรง** แต่ backend ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือ Gateway ผ่านสะพาน MCP แบบ loopback ได้
- **การสตรีม JSONL** สำหรับ CLI ที่รองรับ
- **รองรับ session** (ดังนั้น turn ต่อเนื่องจะยังคงสอดคล้องกัน)
- **สามารถส่งผ่านรูปภาพได้** หาก CLI รับ path ของรูปภาพ

สิ่งนี้ออกแบบมาเป็น **ตาข่ายนิรภัย** มากกว่าเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบแบบข้อความที่ “ใช้งานได้เสมอ” โดยไม่ต้องพึ่ง API ภายนอก

หากคุณต้องการ runtime harness เต็มรูปแบบที่มีการควบคุม session ของ ACP, งานพื้นหลัง,
การผูก thread/conversation, และ session การเขียนโค้ดภายนอกแบบคงอยู่ ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน backend ของ CLI ไม่ใช่ ACP

## เริ่มต้นใช้งานอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI **โดยไม่ต้องมี config ใดๆ** (OpenAI plugin ที่มาพร้อมกัน
จะลงทะเบียน backend เริ่มต้น):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

หาก Gateway ของคุณทำงานภายใต้ launchd/systemd และ PATH มีค่าน้อยที่สุด ให้เพิ่มเฉพาะ
path ของคำสั่ง:

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

เท่านี้ก็เสร็จ ไม่ต้องใช้ key และไม่ต้องมี config การ auth เพิ่มเติมนอกเหนือจากตัว CLI เอง

หากคุณใช้ backend ของ CLI ที่มาพร้อมกันเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ Gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่มาพร้อมกันซึ่งเป็นเจ้าของโดยอัตโนมัติเมื่อ config ของคุณ
อ้างอิง backend นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้เป็นทางสำรอง

เพิ่ม backend ของ CLI ลงในรายการ fallback เพื่อให้ทำงานเฉพาะเมื่อโมเดลหลักล้มเหลว:

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

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องใส่โมเดล backend ของ CLI ไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (auth, rate limit, timeout) OpenClaw จะ
  ลอง backend ของ CLI ถัดไป

## ภาพรวมการกำหนดค่า

backend ของ CLI ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการใช้ **provider id** เป็น key (เช่น `codex-cli`, `my-cli`)
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
          serialize: true,
        },
      },
    },
  },
}
```

## วิธีการทำงาน

1. **เลือก backend** ตาม prefix ของผู้ให้บริการ (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt ของ OpenClaw และ context ของ workspace เดียวกัน
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติคงความสอดคล้อง
   backend `claude-cli` ที่มาพร้อมกันจะคง process stdio ของ Claude ไว้ต่อ
   session ของ OpenClaw และส่ง turn ต่อเนื่องผ่าน stdin แบบ stream-json
4. **แยกวิเคราะห์ output** (JSON หรือ plain text) แล้วส่งคืนข้อความสุดท้าย
5. **คง session id** แยกตาม backend เพื่อให้ turn ต่อเนื่องใช้ session ของ CLI เดิมซ้ำ

<Note>
รองรับ backend Anthropic `claude-cli` ที่มาพร้อมกันอีกครั้งแล้ว เจ้าหน้าที่ Anthropic
แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้ `claude -p` ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

backend OpenAI `codex-cli` ที่มาพร้อมกันจะส่ง system prompt ของ OpenClaw ผ่าน
config override `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่เปิดเผย flag แบบ Claude ชื่อ
`--append-system-prompt` ดังนั้น OpenClaw จึงเขียน prompt ที่ประกอบแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละ session ใหม่ของ Codex CLI

backend Anthropic `claude-cli` ที่มาพร้อมกันจะรับ snapshot ของ skills จาก OpenClaw
สองทาง: แค็ตตาล็อก skills ของ OpenClaw แบบกะทัดรัดใน system prompt ที่ต่อท้าย และ
Plugin Claude Code ชั่วคราวที่ส่งผ่าน `--plugin-dir` Plugin นี้มี
เฉพาะ skills ที่มีสิทธิ์สำหรับ agent/session นั้น ดังนั้นตัวแก้ skill แบบ native ของ Claude Code
จะเห็นชุดที่ถูกกรองเหมือนกับที่ OpenClaw จะประกาศใน
prompt อยู่แล้ว การ override env/API key ของ Skill ยังคงถูก OpenClaw นำไปใช้กับ
environment ของ child process สำหรับการรัน

Claude CLI ยังมีโหมดสิทธิ์แบบ noninteractive ของตนเอง OpenClaw map สิ่งนั้น
ไปยังนโยบาย exec ที่มีอยู่แทนการเพิ่ม config เฉพาะของ Claude: เมื่อ
นโยบาย exec ที่ร้องขอจริงเป็น YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`) OpenClaw จะเพิ่ม `--permission-mode bypassPermissions`
การตั้งค่า `agents.list[].tools.exec` ต่อ agent จะ override `tools.exec` ระดับ global สำหรับ
agent นั้น หากต้องการบังคับโหมด Claude แบบอื่น ให้ตั้งค่า raw backend args อย่างชัดเจน
เช่น `--permission-mode default` หรือ `--permission-mode acceptEdits` ภายใต้
`agents.defaults.cliBackends.claude-cli.args` และ `resumeArgs` ที่ตรงกัน

ก่อนที่ OpenClaw จะใช้ backend `claude-cli` ที่มาพร้อมกันได้ Claude Code เอง
ต้อง login อยู่แล้วบนโฮสต์เดียวกัน:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อ binary `claude`
ยังไม่อยู่ใน `PATH`

## Session

- หาก CLI รองรับ session ให้ตั้งค่า `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  ลงในหลาย flag
- หาก CLI ใช้ **resume subcommand** พร้อม flag ที่ต่างกัน ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และตั้งค่า `resumeOutput`
  ได้ตามต้องการ (สำหรับ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (UUID ใหม่หากไม่มีที่เก็บไว้)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยมีการเก็บไว้ก่อนหน้า
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้ turn ต่อเนื่องใช้ process Claude ที่ยังทำงานอยู่ซ้ำในขณะที่
  process ยัง active อยู่ ตอนนี้ warm stdio เป็นค่าเริ่มต้นแล้ว รวมถึง custom config
  ที่ละเว้น field ของ transport หาก Gateway restart หรือ process ที่ idle
  ออกไป OpenClaw จะ resume จาก session id ของ Claude ที่เก็บไว้ session
  id ที่เก็บไว้จะถูกตรวจสอบกับ transcript ของ project ที่อ่านได้ซึ่งมีอยู่ก่อน
  resume ดังนั้น binding ลวงจะถูกล้างด้วย `reason=transcript-missing`
  แทนการเริ่ม session Claude CLI ใหม่อย่างเงียบๆ ภายใต้ `--resume`
- session ของ CLI ที่เก็บไว้คือความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การ reset session รายวันแบบ implicit
  จะไม่ตัด session เหล่านั้น; `/reset` และนโยบาย `session.reset` ที่ชัดเจนยังคง
  ทำเช่นนั้น

หมายเหตุเรื่อง serialization:

- `serialize: true` ทำให้การรันใน lane เดียวกันเรียงลำดับกัน
- CLI ส่วนใหญ่จะ serialize บน provider lane เดียว
- OpenClaw จะเลิกใช้ session ของ CLI ที่เก็บไว้ซ้ำเมื่อ auth identity ที่เลือกเปลี่ยน
  รวมถึง auth profile id, static API key, static token ที่เปลี่ยนไป หรือ OAuth
  account identity เมื่อ CLI เปิดเผยข้อมูลนั้น การหมุนเวียน access token และ refresh token ของ OAuth
  จะไม่ตัด session ของ CLI ที่เก็บไว้ หาก CLI ไม่เปิดเผย
  OAuth account id ที่เสถียร OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้สิทธิ์ resume เอง

## prelude สำรองจาก session ของ claude-cli

เมื่อ attempt ของ `claude-cli` failover ไปยัง candidate ที่ไม่ใช่ CLI ใน
[`agents.defaults.model.fallbacks`](/th/concepts/model-failover) OpenClaw จะ seed
attempt ถัดไปด้วย context prelude ที่เก็บจาก transcript JSONL ภายในเครื่องของ Claude Code
ที่ `~/.claude/projects/` หากไม่มี seed นี้ ผู้ให้บริการ fallback
จะเริ่มแบบไม่มี context เพราะ transcript session ของ OpenClaw เองว่างเปล่า
สำหรับการรัน `claude-cli`

- prelude จะเลือก summary `/compact` ล่าสุดหรือ marker `compact_boundary`
  ก่อน แล้วต่อท้าย turn หลัง boundary ล่าสุดจนถึงงบประมาณ char
  ที่กำหนด turn ก่อน boundary จะถูกตัดออกเพราะ summary แทนข้อมูลเหล่านั้นแล้ว
- บล็อก tool จะถูก coalesce เป็น hint แบบกะทัดรัด `(tool call: name)` และ
  `(tool result: …)` เพื่อรักษางบประมาณ prompt ให้ตรงจริง summary จะถูก
  ติดป้าย `(truncated)` หากล้น
- fallback จาก `claude-cli` ไป `claude-cli` ผู้ให้บริการเดียวกันจะพึ่งพา
  `--resume` ของ Claude เองและข้าม prelude
- seed ใช้การตรวจสอบ path ของไฟล์ session Claude ที่มีอยู่ซ้ำ ดังนั้น
  จึงไม่สามารถอ่าน path ใดๆ ตามอำเภอใจได้

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณรับ path รูปภาพ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงในไฟล์ชั่วคราว หากตั้งค่า `imageArg` ไว้
path เหล่านั้นจะถูกส่งเป็น args ของ CLI หากไม่มี `imageArg` OpenClaw จะต่อท้าย
path ของไฟล์ลงใน prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลดไฟล์ภายในเครื่องโดยอัตโนมัติ
จาก path แบบ plain

## Input / output

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับ output แบบ JSON ของ Gemini CLI, OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` หายไปหรือว่างเปล่า
- `output: "jsonl"` แยกวิเคราะห์ stream JSONL (เช่น Codex CLI `--json`) และดึงข้อความ agent สุดท้ายพร้อม session
  identifier เมื่อมี
- `output: "text"` ถือว่า stdout เป็นคำตอบสุดท้าย

โหมด input:

- `input: "arg"` (ค่าเริ่มต้น) ส่ง prompt เป็น arg สุดท้ายของ CLI
- `input: "stdin"` ส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (Plugin เป็นเจ้าของ)

OpenAI plugin ที่มาพร้อมกันยังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Google plugin ที่มาพร้อมกันยังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

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

- ข้อความตอบกลับจะอ่านจาก field JSON `response`
- Usage จะ fallback ไปที่ `stats` เมื่อไม่มี `usage` หรือว่างเปล่า
- `stats.cached` จะถูก normalize เป็น `cacheRead` ของ OpenClaw
- หากไม่มี `stats.input` OpenClaw จะ derive token input จาก
  `stats.input_tokens - stats.cached`

override เฉพาะเมื่อจำเป็น (ที่พบบ่อย: path `command` แบบ absolute)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ตอนนี้ค่าเริ่มต้นของ backend CLI เป็นส่วนหนึ่งของ surface ของ Plugin:

- Plugin ลงทะเบียนด้วย `api.registerCliBackend(...)`
- `id` ของ backend จะกลายเป็น provider prefix ใน model ref
- config ของผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคง override ค่าเริ่มต้นของ Plugin
- การ cleanup config เฉพาะ backend ยังคงเป็นของ Plugin ผ่าน hook
  `normalizeConfig` ที่เป็น optional

Plugin ที่ต้องการชิมความเข้ากันได้ของพรอมป์/ข้อความขนาดเล็กสามารถประกาศการแปลงข้อความสองทิศทางได้โดยไม่ต้องแทนที่ผู้ให้บริการหรือแบ็กเอนด์ CLI:

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
เขียนเดลตาของผู้ช่วยที่สตรีมและข้อความสุดท้ายที่แยกวิเคราะห์แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
เครื่องหมายควบคุมของตัวเองและการส่งผ่านช่องทาง

สำหรับ CLI ที่ปล่อย JSONL ที่เข้ากันได้กับ Claude Code stream-json ให้ตั้งค่า
`jsonlDialect: "claude-stream-json"` ในการกำหนดค่าของแบ็กเอนด์นั้น

## โอเวอร์เลย์ MCP แบบบันเดิล

แบ็กเอนด์ CLI **ไม่ได้**รับการเรียกเครื่องมือ OpenClaw โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้โอเวอร์เลย์การกำหนดค่า MCP ที่สร้างขึ้นได้ด้วย `bundleMcp: true`

ลักษณะการทำงานแบบบันเดิลในปัจจุบัน:

- `claude-cli`: ไฟล์การกำหนดค่า MCP แบบเข้มงวดที่สร้างขึ้น
- `codex-cli`: การแทนที่การกำหนดค่าแบบอินไลน์สำหรับ `mcp_servers`; เซิร์ฟเวอร์
  local loopback ของ OpenClaw ที่สร้างขึ้นจะถูกทำเครื่องหมายด้วยโหมดอนุมัติเครื่องมือรายเซิร์ฟเวอร์ของ Codex
  เพื่อให้การเรียก MCP ไม่ค้างที่พรอมป์อนุมัติภายในเครื่อง
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้งาน MCP แบบบันเดิล OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผยเครื่องมือ Gateway ให้กับกระบวนการ CLI
- ตรวจสอบสิทธิ์บริดจ์ด้วยโทเค็นรายเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือไว้ที่บริบทของเซสชัน บัญชี และช่องทางปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานสำหรับพื้นที่ทำงานปัจจุบัน
- ผสานเข้ากับรูปแบบการกำหนดค่า/การตั้งค่า MCP ของแบ็กเอนด์ที่มีอยู่
- เขียนการกำหนดค่าการเปิดใช้ใหม่โดยใช้โหมดการผสานรวมที่แบ็กเอนด์เป็นเจ้าของจากส่วนขยายเจ้าของ

หากไม่มีเซิร์ฟเวอร์ MCP ที่เปิดใช้งาน OpenClaw ยังคงฉีดการกำหนดค่าแบบเข้มงวดเมื่อ
แบ็กเอนด์เลือกใช้ MCP แบบบันเดิล เพื่อให้การรันเบื้องหลังยังคงถูกแยกไว้

รันไทม์ MCP แบบบันเดิลที่มีขอบเขตตามเซสชันจะถูกแคชเพื่อใช้ซ้ำภายในเซสชัน แล้ว
ถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่า `0` เพื่อปิดใช้งาน) การรันแบบฝังครั้งเดียว เช่น โพรบตรวจสอบสิทธิ์
การสร้าง slug และคำขอเรียกคืน Active Memory จะล้างข้อมูลเมื่อการรันสิ้นสุด เพื่อให้ลูก
stdio และสตรีม Streamable HTTP/SSE ไม่อยู่ต่อหลังการรัน

## ข้อจำกัด

- **ไม่มีการเรียกเครื่องมือ OpenClaw โดยตรง** OpenClaw ไม่ฉีดการเรียกเครื่องมือเข้าไปใน
  โปรโตคอลแบ็กเอนด์ CLI แบ็กเอนด์จะเห็นเครื่องมือ Gateway เฉพาะเมื่อเลือกใช้
  `bundleMcp: true`
- **การสตรีมขึ้นอยู่กับแต่ละแบ็กเอนด์** บางแบ็กเอนด์สตรีม JSONL; บางแบ็กเอนด์บัฟเฟอร์
  จนกว่าจะออก
- **เอาต์พุตแบบมีโครงสร้าง** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชัน Codex CLI** ดำเนินต่อผ่านเอาต์พุตข้อความ (ไม่มี JSONL) ซึ่งมีโครงสร้างน้อยกว่า
  การรัน `--json` ครั้งแรก เซสชัน OpenClaw ยังคงทำงาน
  ตามปกติ

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธเต็ม
- **ชื่อโมเดลผิด**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดล CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบว่าได้ตั้งค่า `sessionArg` และ `sessionMode` ไม่ใช่
  `none` (ปัจจุบัน Codex CLI ยังไม่สามารถดำเนินต่อด้วยเอาต์พุต JSON)
- **รูปภาพถูกละเว้น**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
