---
read_when:
    - คุณต้องการ fallback ที่เชื่อถือได้เมื่อ API providers ล้มเหลว
    - คุณกำลังใช้งาน Codex CLI หรือ AI CLI ในเครื่องอื่น ๆ และต้องการนำกลับมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจ local loopback bridge ของ MCP สำหรับการเข้าถึงเครื่องมือของแบ็กเอนด์ CLI
summary: 'แบ็กเอนด์ CLI: การ fallback ไปใช้ AI CLI ในเครื่องพร้อมบริดจ์เครื่องมือ MCP แบบไม่บังคับ'
title: แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-04-25T13:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClaw สามารถรัน **AI CLI ในเครื่อง** เป็น **fallback แบบข้อความล้วน** ได้เมื่อ API providers ล่ม,
ติด rate limit หรือมีปัญหาชั่วคราว โดยแนวทางนี้ตั้งใจให้ระมัดระวังเป็นพิเศษ:

- **เครื่องมือของ OpenClaw จะไม่ถูก inject โดยตรง** แต่แบ็กเอนด์ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือของ Gateway ผ่านบริดจ์ MCP แบบ local loopback ได้
- รองรับ **JSONL streaming** สำหรับ CLI ที่รองรับ
- รองรับ **เซสชัน** (เพื่อให้เทิร์นติดตามผลยังคงสอดคล้องกัน)
- สามารถ **ส่งภาพผ่านต่อได้** หาก CLI รับพาธของภาพได้

สิ่งนี้ถูกออกแบบให้เป็น **ตาข่ายนิรภัย** มากกว่าเส้นทางหลัก ใช้เมื่อคุณ
ต้องการการตอบกลับแบบข้อความที่ “ใช้งานได้เสมอ” โดยไม่ต้องพึ่ง API ภายนอก

หากคุณต้องการรันไทม์แบบ harness เต็มรูปแบบพร้อมการควบคุม ACP session, background tasks,
thread/conversation binding และเซสชันโค้ดดิ้งภายนอกแบบคงทน ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน CLI backends ไม่ใช่ ACP

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI ได้ **โดยไม่ต้องมี config ใด ๆ** (OpenAI Plugin ที่มาพร้อมระบบ
จะลงทะเบียน backend เริ่มต้นไว้ให้):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

หาก Gateway ของคุณรันภายใต้ launchd/systemd และ PATH มีน้อย ให้เพิ่มเพียงพาธของคำสั่ง:

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

เพียงเท่านี้ ไม่ต้องใช้คีย์ ไม่ต้องมี config การยืนยันตัวตนเพิ่มเติมนอกเหนือจากตัว CLI เอง

หากคุณใช้ bundled CLI backend เป็น **provider ข้อความหลัก** บน
โฮสต์ Gateway ตอนนี้ OpenClaw จะโหลด bundled Plugin ที่เป็นเจ้าของโดยอัตโนมัติเมื่อ config ของคุณ
อ้างอิง backend นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้เป็น fallback

เพิ่ม CLI backend ลงในรายการ fallback เพื่อให้มันทำงานเฉพาะเมื่อโมเดลหลักล้มเหลว:

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

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องรวมโมเดลของ CLI backend ไว้ที่นั่นด้วย
- หาก provider หลักล้มเหลว (auth, rate limits, timeouts) OpenClaw จะ
  ลอง CLI backend ถัดไป

## ภาพรวมการกำหนดค่า

CLI backends ทั้งหมดอยู่ภายใต้:

```
agents.defaults.cliBackends
```

แต่ละรายการใช้คีย์เป็น **provider id** (เช่น `codex-cli`, `my-cli`)
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
          // สำหรับ CLI ที่มีแฟล็ก prompt-file โดยเฉพาะ:
          // systemPromptFileArg: "--system-file",
          // CLI แบบ Codex สามารถชี้ไปยังไฟล์ prompt แทนได้:
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

1. **เลือก backend** ตาม provider prefix (`codex-cli/...`)
2. **สร้าง system prompt** โดยใช้ prompt + บริบทของ workspace แบบเดียวกับ OpenClaw
3. **รัน CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   แบ็กเอนด์ `claude-cli` ที่มาพร้อมระบบจะคงโปรเซส Claude stdio ไว้หนึ่งตัวต่อ
   OpenClaw session และส่งเทิร์นติดตามผลผ่าน stream-json stdin
4. **แยกวิเคราะห์ผลลัพธ์** (JSON หรือข้อความธรรมดา) และส่งคืนข้อความสุดท้าย
5. **เก็บ session ids ถาวร** แยกตาม backend เพื่อให้การติดตามผลนำ CLI session เดิมกลับมาใช้ซ้ำ

<Note>
แบ็กเอนด์ `claude-cli` ของ Anthropic ที่มาพร้อมระบบกลับมารองรับอีกครั้งแล้ว ทีมงาน Anthropic
แจ้งกับเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้งาน `claude -p` เป็นแนวทางที่ได้รับอนุมัติสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

แบ็กเอนด์ `codex-cli` ของ OpenAI ที่มาพร้อมระบบจะส่ง system prompt ของ OpenClaw ผ่าน
config override `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่มีแฟล็ก
`--append-system-prompt` แบบ Claude ดังนั้น OpenClaw จึงเขียน prompt ที่ประกอบแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละ Codex CLI session ใหม่

แบ็กเอนด์ `claude-cli` ของ Anthropic ที่มาพร้อมระบบจะได้รับ snapshot ของ Skills ของ OpenClaw
สองทาง: แค็ตตาล็อก Skills แบบกะทัดรัดของ OpenClaw ใน appended system prompt และ
Claude Code Plugin ชั่วคราวที่ส่งผ่าน `--plugin-dir` Plugin นี้มีเฉพาะ Skills
ที่เข้าเกณฑ์สำหรับเอเจนต์/เซสชันนั้น ดังนั้นตัวแก้ไข Skills แบบเนทีฟของ Claude Code จะเห็นชุดเดียวกับ
ที่ OpenClaw จะโฆษณาใน prompt ตามปกติ การ override env/API key ของ Skill ยังคงถูกใช้โดย OpenClaw กับสภาพแวดล้อมของ child process สำหรับการรันนั้น

Claude CLI ยังมี noninteractive permission mode ของตัวเองด้วย OpenClaw จะจับคู่สิ่งนี้
เข้ากับนโยบาย exec ที่มีอยู่ แทนที่จะเพิ่ม config เฉพาะของ Claude: เมื่อ effective
exec policy ที่ร้องขอเป็น YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`), OpenClaw จะเพิ่ม `--permission-mode bypassPermissions`
การตั้งค่า `agents.list[].tools.exec` รายเอเจนต์จะ override `tools.exec` แบบโกลบอลสำหรับ
เอเจนต์นั้น หากต้องการบังคับโหมด Claude อื่น ให้ตั้งค่า raw backend args แบบ explicit
เช่น `--permission-mode default` หรือ `--permission-mode acceptEdits` ภายใต้
`agents.defaults.cliBackends.claude-cli.args` และ `resumeArgs` ที่ตรงกัน

ก่อนที่ OpenClaw จะใช้ bundled `claude-cli` backend ได้ Claude Code เอง
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
  เข้าไปในหลายแฟล็ก
- หาก CLI ใช้ **resume subcommand** พร้อมแฟล็กที่แตกต่างกัน ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และเลือกตั้ง `resumeOutput`
  (สำหรับการ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (UUID ใหม่หากยังไม่มีการจัดเก็บ)
  - `existing`: ส่ง session id เฉพาะเมื่อเคยจัดเก็บไว้ก่อน
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้เทิร์นติดตามผลนำโปรเซส Claude ที่กำลังทำงานอยู่กลับมาใช้ซ้ำ
  ขณะยังทำงานอยู่ stdio แบบอุ่นเป็นค่าเริ่มต้นแล้วตอนนี้ รวมถึงสำหรับ config แบบกำหนดเอง
  ที่ไม่ได้ระบุฟิลด์ transport หาก Gateway รีสตาร์ต หรือโปรเซสที่ idle
  ปิดตัวลง OpenClaw จะ resume จาก Claude session id ที่จัดเก็บไว้ session ids ที่เก็บไว้จะถูกตรวจสอบเทียบกับ project transcript ที่อ่านได้และมีอยู่จริงก่อน
  จึงจะ resume ได้ ดังนั้นการผูกที่เป็น phantom จะถูกล้างด้วย `reason=transcript-missing`
  แทนที่จะเริ่ม Claude CLI session ใหม่ภายใต้ `--resume` แบบเงียบ ๆ
- CLI sessions ที่เก็บไว้เป็นความต่อเนื่องที่ provider เป็นเจ้าของ การรีเซ็ตเซสชันรายวันแบบโดยนัย
  จะไม่ตัดมัน; `/reset` และนโยบาย `session.reset` แบบ explicit ยังคงตัดได้

หมายเหตุเกี่ยวกับการ serialize:

- `serialize: true` จะคงลำดับของการรันใน lane เดียวกัน
- CLI ส่วนใหญ่ serialize บน provider lane เดียว
- OpenClaw จะยกเลิกการนำ stored CLI session กลับมาใช้ซ้ำเมื่ออัตลักษณ์ auth ที่เลือกเปลี่ยนไป
  รวมถึงเมื่อ auth profile id เปลี่ยน, API key แบบคงที่เปลี่ยน, token แบบคงที่เปลี่ยน หรือ OAuth
  account identity เปลี่ยนเมื่อ CLI เปิดเผยสิ่งนั้น การหมุนเวียน OAuth access และ refresh token
  จะไม่ตัด stored CLI session หาก CLI ไม่เปิดเผย OAuth account id ที่เสถียร
  OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้สิทธิ์การ resume เอง

## ภาพ (pass-through)

หาก CLI ของคุณรับพาธรูปภาพได้ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนภาพ base64 ลงในไฟล์ชั่วคราว หากตั้งค่า `imageArg` พาธเหล่านั้น
จะถูกส่งเป็น CLI args หากไม่มี `imageArg` OpenClaw จะผนวก
พาธไฟล์เข้ากับ prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ในเครื่องจากพาธธรรมดาโดยอัตโนมัติ

## อินพุต / เอาต์พุต

- `output: "json"` (ค่าเริ่มต้น) จะพยายาม parse JSON และดึงข้อความ + session id
- สำหรับเอาต์พุต JSON ของ Gemini CLI, OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  การใช้งานจาก `stats` เมื่อ `usage` ไม่มีหรือว่าง
- `output: "jsonl"` จะ parse สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความ agent สุดท้ายพร้อมตัวระบุเซสชัน
  เมื่อมี
- `output: "text"` จะถือว่า stdout เป็นคำตอบสุดท้าย

โหมดอินพุต:

- `input: "arg"` (ค่าเริ่มต้น) ส่ง prompt เป็น CLI arg ตัวสุดท้าย
- `input: "stdin"` ส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (provider เป็นเจ้าของ)

OpenAI Plugin ที่มาพร้อมระบบยังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Google Plugin ที่มาพร้อมระบบยังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: Gemini CLI ในเครื่องต้องถูกติดตั้งและพร้อมใช้งานเป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุเกี่ยวกับ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะถูกอ่านจากฟิลด์ JSON `response`
- การใช้งานจะ fallback ไปที่ `stats` เมื่อ `usage` ไม่มีหรือว่าง
- `stats.cached` จะถูกทำให้เป็นมาตรฐานไปเป็น `cacheRead` ของ OpenClaw
- หาก `stats.input` ไม่มี OpenClaw จะคำนวณโทเค็นขาเข้าจาก
  `stats.input_tokens - stats.cached`

override เฉพาะเมื่อจำเป็น (โดยทั่วไปคือพาธ `command` แบบสัมบูรณ์)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ค่าเริ่มต้นของ CLI backend ตอนนี้เป็นส่วนหนึ่งของพื้นผิว Plugin:

- Plugins ลงทะเบียนด้วย `api.registerCliBackend(...)`
- `id` ของ backend จะกลายเป็น provider prefix ใน model refs
- config ของผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคง override ค่าเริ่มต้นของ Plugin
- การล้าง config เฉพาะ backend ยังคงเป็นความรับผิดชอบของ Plugin ผ่าน
  hook `normalizeConfig` ที่เป็นทางเลือก

Plugins ที่ต้องการ shims ด้านความเข้ากันได้ของ prompt/message ขนาดเล็ก สามารถประกาศ
text transforms แบบสองทางได้โดยไม่ต้องแทนที่ provider หรือ CLI backend:

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

`input` จะเขียน system prompt และ user prompt ใหม่ก่อนส่งไปยัง CLI ส่วน `output`
จะเขียน assistant deltas ที่สตรีมมาและข้อความสุดท้ายที่ parse แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
control markers ของตัวเองและการส่งมอบไปยังแชนเนล

สำหรับ CLI ที่ปล่อย JSONL ซึ่งเข้ากันได้กับ stream-json ของ Claude Code ให้ตั้งค่า
`jsonlDialect: "claude-stream-json"` บน config ของ backend นั้น

## MCP overlays ที่มาพร้อมระบบ

CLI backends จะ **ไม่ได้รับ** tool calls ของ OpenClaw โดยตรง แต่ backend สามารถ
เลือกใช้ MCP config overlay ที่สร้างขึ้นได้ด้วย `bundleMcp: true`

พฤติกรรมแบบ bundled ในปัจจุบัน:

- `claude-cli`: ไฟล์ config MCP แบบเข้มงวดที่สร้างขึ้น
- `codex-cli`: config overrides แบบอินไลน์สำหรับ `mcp_servers`; เซิร์ฟเวอร์ loopback ของ OpenClaw
  ที่สร้างขึ้นจะถูกทำเครื่องหมายด้วยโหมดการอนุมัติเครื่องมือรายเซิร์ฟเวอร์ของ Codex
  เพื่อให้การเรียก MCP ไม่ค้างรอพรอมต์การอนุมัติในเครื่อง
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบของ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้ bundle MCP, OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผยเครื่องมือของ Gateway ให้กับโปรเซส CLI
- ยืนยันตัวตนของบริดจ์ด้วยโทเค็นรายเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือให้สอดคล้องกับบริบทของเซสชัน บัญชี และแชนเนลปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้งานอยู่สำหรับ workspace ปัจจุบัน
- รวมเข้ากับรูปร่าง config/การตั้งค่า MCP ของ backend ที่มีอยู่เดิม
- เขียน config การเปิดใช้งานใหม่โดยใช้โหมดการผสานรวมที่ backend เป็นเจ้าของจากส่วนขยายเจ้าของนั้น

หากไม่มีการเปิดใช้ MCP servers ใด ๆ OpenClaw ก็ยังคง inject config แบบเข้มงวดเมื่อ
backend เลือกใช้ bundle MCP เพื่อให้การรันเบื้องหลังยังคงแยกจากกัน

รันไทม์ bundled MCP แบบผูกกับเซสชันจะถูกแคชเพื่อนำกลับมาใช้ซ้ำภายในเซสชัน จากนั้น
จะถูกเก็บกวาดหลังไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่า `0` เพื่อปิดใช้งาน) การรันแบบฝังครั้งเดียว เช่น auth probes,
การสร้าง slug และการเรียก Active Memory จะขอการล้างข้อมูลเมื่อจบการรัน เพื่อไม่ให้ stdio
children และสตรีม Streamable HTTP/SSE คงอยู่ต่อหลังการรันสิ้นสุด

## ข้อจำกัด

- **ไม่มีการเรียกใช้เครื่องมือของ OpenClaw โดยตรง** OpenClaw จะไม่ inject tool calls เข้าไปใน
  โปรโตคอลของ CLI backend แบ็กเอนด์จะเห็นเครื่องมือของ Gateway ได้ก็ต่อเมื่อเลือกใช้
  `bundleMcp: true`
- **การสตรีมขึ้นอยู่กับ backend** บาง backend สตรีม JSONL; บางตัวบัฟเฟอร์
  จนกว่าจะออกจากระบบ
- **Structured outputs** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชันของ Codex CLI** resume ผ่านเอาต์พุตแบบข้อความ (ไม่ใช่ JSONL) ซึ่งมีโครงสร้าง
  น้อยกว่าการรัน `--json` ครั้งแรก แต่เซสชันของ OpenClaw ยังคงทำงานได้
  ตามปกติ

## การแก้ปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธแบบเต็ม
- **ชื่อโมเดลไม่ถูกต้อง**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดลของ CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบว่าได้ตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none` (ปัจจุบัน Codex CLI ไม่สามารถ resume พร้อมเอาต์พุต JSON ได้)
- **ภาพถูกเพิกเฉย**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway)
- [โมเดลในเครื่อง](/th/gateway/local-models)
