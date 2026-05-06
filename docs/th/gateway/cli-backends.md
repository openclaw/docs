---
read_when:
    - คุณต้องการทางเลือกสำรองที่เชื่อถือได้เมื่อผู้ให้บริการ API ล้มเหลว
    - คุณกำลังใช้งาน Codex CLI หรือ CLI ด้าน AI ภายในเครื่องอื่น ๆ และต้องการนำกลับมาใช้ซ้ำ
    - คุณต้องการทำความเข้าใจบริดจ์ลูปแบ็กของ MCP สำหรับการเข้าถึงเครื่องมือแบ็กเอนด์ของ CLI
summary: 'แบ็กเอนด์ CLI: กลไกสำรอง AI CLI ภายในเครื่องพร้อมตัวเชื่อมเครื่องมือ MCP ที่เลือกใช้ได้'
title: แบ็กเอนด์ของ CLI
x-i18n:
    generated_at: "2026-05-06T09:12:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **CLI AI แบบ local** เป็น **ทางเลือกสำรองแบบข้อความเท่านั้น** เมื่อผู้ให้บริการ API ล่ม,
ถูกจำกัดอัตรา, หรือทำงานผิดปกติชั่วคราว แนวทางนี้ตั้งใจให้เป็นแบบระมัดระวัง:

- **เครื่องมือของ OpenClaw จะไม่ถูก inject โดยตรง** แต่ backend ที่มี `bundleMcp: true`
  สามารถรับเครื่องมือ Gateway ผ่านสะพาน MCP แบบ loopback ได้
- **การสตรีม JSONL** สำหรับ CLI ที่รองรับ
- **รองรับเซสชัน** (เพื่อให้เทิร์นติดตามผลยังคงต่อเนื่องกัน)
- **สามารถส่งผ่านรูปภาพได้** หาก CLI รับพาธรูปภาพ

สิ่งนี้ถูกออกแบบให้เป็น **ตาข่ายนิรภัย** มากกว่าจะเป็นเส้นทางหลัก ใช้เมื่อคุณ
ต้องการคำตอบแบบข้อความที่ "ใช้งานได้เสมอ" โดยไม่ต้องพึ่งพา API ภายนอก

หากคุณต้องการ runtime แบบ harness เต็มรูปแบบพร้อมการควบคุมเซสชัน ACP, งานเบื้องหลัง,
การผูก thread/conversation, และเซสชันเขียนโค้ดภายนอกแบบถาวร ให้ใช้
[ACP Agents](/th/tools/acp-agents) แทน backend CLI ไม่ใช่ ACP

## เริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

คุณสามารถใช้ Codex CLI **โดยไม่ต้องมี config ใดๆ** (Plugin OpenAI ที่มาพร้อมชุด
จะลงทะเบียน backend เริ่มต้นไว้):

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

เท่านี้ก็พอ ไม่ต้องมี key ไม่ต้องมี config การยืนยันตัวตนเพิ่มเติมนอกเหนือจากตัว CLI เอง

หากคุณใช้ backend CLI ที่มาพร้อมชุดเป็น **ผู้ให้บริการข้อความหลัก** บน
โฮสต์ Gateway ตอนนี้ OpenClaw จะโหลด Plugin ที่มาพร้อมชุดซึ่งเป็นเจ้าของให้อัตโนมัติ เมื่อ config ของคุณ
อ้างอิง backend นั้นอย่างชัดเจนใน model ref หรือภายใต้
`agents.defaults.cliBackends`

## การใช้เป็นทางเลือกสำรอง

เพิ่ม backend CLI ลงในรายการ fallback ของคุณ เพื่อให้มันรันเฉพาะเมื่อโมเดลหลักล้มเหลว:

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

- หากคุณใช้ `agents.defaults.models` (allowlist) คุณต้องใส่โมเดล backend CLI ของคุณไว้ที่นั่นด้วย
- หากผู้ให้บริการหลักล้มเหลว (การยืนยันตัวตน, ขีดจำกัดอัตรา, timeout) OpenClaw จะ
  ลองใช้ backend CLI ถัดไป

## ภาพรวมการกำหนดค่า

backend CLI ทั้งหมดอยู่ภายใต้:

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
2. **สร้าง system prompt** โดยใช้ prompt ของ OpenClaw และ context workspace เดียวกัน
3. **เรียกใช้ CLI** พร้อม session id (หากรองรับ) เพื่อให้ประวัติยังคงสอดคล้องกัน
   backend `claude-cli` ที่มาพร้อมชุดจะคงโปรเซส Claude stdio ไว้ต่อหนึ่ง
   เซสชัน OpenClaw และส่งเทิร์นติดตามผลผ่าน stream-json stdin
4. **แยกวิเคราะห์ output** (JSON หรือข้อความธรรมดา) และส่งคืนข้อความสุดท้าย
5. **บันทึก session id** ต่อ backend เพื่อให้เทิร์นติดตามผลใช้เซสชัน CLI เดิมซ้ำ

<Note>
รองรับ backend Anthropic `claude-cli` ที่มาพร้อมชุดอีกครั้งแล้ว เจ้าหน้าที่ Anthropic
แจ้งเราว่าการใช้งาน Claude CLI ในรูปแบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่า
การใช้ `claude -p` ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่
นโยบายใหม่
</Note>

backend OpenAI `codex-cli` ที่มาพร้อมชุดจะส่ง system prompt ของ OpenClaw ผ่าน
การ override config `model_instructions_file` ของ Codex (`-c
model_instructions_file="..."`) Codex ไม่ได้เปิดเผย flag แบบ Claude ที่ชื่อ
`--append-system-prompt` ดังนั้น OpenClaw จะเขียน prompt ที่ประกอบแล้วลงใน
ไฟล์ชั่วคราวสำหรับแต่ละเซสชัน Codex CLI ใหม่

backend Anthropic `claude-cli` ที่มาพร้อมชุดรับสแนปชอต Skills ของ OpenClaw
สองทาง: แคตตาล็อก Skills ของ OpenClaw แบบกะทัดรัดใน system prompt ที่ต่อท้าย และ
Plugin Claude Code ชั่วคราวที่ส่งผ่าน `--plugin-dir` Plugin มีเฉพาะ
Skills ที่มีสิทธิ์สำหรับ agent/เซสชันนั้น ดังนั้นตัว resolver Skills ดั้งเดิมของ Claude Code
จะเห็นชุดที่กรองแล้วชุดเดียวกับที่ OpenClaw จะประกาศใน prompt ตามปกติ
การ override env/API key ของ Skill ยังคงถูก OpenClaw นำไปใช้กับ
สภาพแวดล้อมของโปรเซสลูกสำหรับการรัน

Claude CLI ยังมีโหมดสิทธิ์แบบ noninteractive ของตัวเองด้วย OpenClaw map สิ่งนั้น
เข้ากับนโยบาย exec ที่มีอยู่แทนการเพิ่ม config เฉพาะ Claude: เมื่อ
นโยบาย exec ที่ร้องขอจริงเป็น YOLO (`tools.exec.security: "full"` และ
`tools.exec.ask: "off"`) OpenClaw จะเพิ่ม `--permission-mode bypassPermissions`
การตั้งค่า `agents.list[].tools.exec` ราย agent จะ override `tools.exec` ระดับ global สำหรับ
agent นั้น หากต้องการบังคับใช้โหมด Claude อื่น ให้ตั้งค่า raw backend args อย่างชัดเจน
เช่น `--permission-mode default` หรือ `--permission-mode acceptEdits` ภายใต้
`agents.defaults.cliBackends.claude-cli.args` และ `resumeArgs` ที่ตรงกัน

backend Anthropic `claude-cli` ที่มาพร้อมชุดยัง map ระดับ OpenClaw `/think`
ไปยัง flag ดั้งเดิม `--effort` ของ Claude Code สำหรับระดับที่ไม่ใช่ off ด้วย `minimal` และ
`low` map เป็น `low`, `adaptive` และ `medium` map เป็น `medium`, และ `high`,
`xhigh`, และ `max` map โดยตรง backend CLI อื่นต้องให้ Plugin เจ้าของ
ประกาศ argv mapper ที่เทียบเท่าก่อน `/think` จึงจะมีผลต่อ CLI ที่ spawn ได้

ก่อนที่ OpenClaw จะใช้ backend `claude-cli` ที่มาพร้อมชุดได้ ตัว Claude Code เอง
ต้องล็อกอินไว้แล้วบนโฮสต์เดียวกัน:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

ใช้ `agents.defaults.cliBackends.claude-cli.command` เฉพาะเมื่อ binary `claude`
ไม่ได้อยู่บน `PATH` อยู่แล้ว

## เซสชัน

- หาก CLI รองรับเซสชัน ให้ตั้งค่า `sessionArg` (เช่น `--session-id`) หรือ
  `sessionArgs` (placeholder `{sessionId}`) เมื่อจำเป็นต้องแทรก ID
  ลงในหลาย flag
- หาก CLI ใช้ **subcommand สำหรับ resume** พร้อม flag ที่แตกต่างกัน ให้ตั้งค่า
  `resumeArgs` (แทนที่ `args` เมื่อ resume) และอาจตั้งค่า `resumeOutput`
  (สำหรับ resume ที่ไม่ใช่ JSON)
- `sessionMode`:
  - `always`: ส่ง session id เสมอ (UUID ใหม่หากยังไม่มีที่บันทึกไว้)
  - `existing`: ส่ง session id เฉพาะเมื่อมีที่บันทึกไว้ก่อนหน้า
  - `none`: ไม่ส่ง session id เลย
- `claude-cli` มีค่าเริ่มต้นเป็น `liveSession: "claude-stdio"`, `output: "jsonl"`,
  และ `input: "stdin"` เพื่อให้เทิร์นติดตามผลใช้โปรเซส Claude แบบ live ซ้ำในขณะที่
  โปรเซสนั้นยัง active อยู่ ตอนนี้ warm stdio เป็นค่าเริ่มต้นแล้ว รวมถึงสำหรับ custom config
  ที่ละเว้นฟิลด์ transport หาก Gateway restart หรือโปรเซส idle
  ออก OpenClaw จะ resume จาก session id ของ Claude ที่บันทึกไว้ session
  id ที่บันทึกไว้จะถูกตรวจสอบกับ transcript โปรเจกต์ที่อ่านได้ซึ่งมีอยู่ก่อน
  resume ดังนั้นการผูกที่ไม่มีอยู่จริงจะถูกล้างด้วย `reason=transcript-missing`
  แทนที่จะเริ่มเซสชัน Claude CLI ใหม่แบบเงียบๆ ภายใต้ `--resume`
- เซสชัน Claude แบบ live มีตัวป้องกัน output JSONL แบบมีขอบเขต ค่าเริ่มต้นอนุญาตสูงสุด
  8 MiB และ 20,000 บรรทัด JSONL ดิบต่อเทิร์น เทิร์น Claude ที่ใช้เครื่องมือหนักสามารถเพิ่ม
  ค่าเหล่านี้ต่อ backend ได้ด้วย
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  และ `maxTurnLines`; OpenClaw จะ clamp การตั้งค่าเหล่านั้นไว้ที่ 64 MiB และ 100,000
  บรรทัด
- เซสชัน CLI ที่บันทึกไว้เป็นความต่อเนื่องที่ผู้ให้บริการเป็นเจ้าของ การรีเซ็ตเซสชันรายวันแบบ implicit
  จะไม่ตัดมัน; `/reset` และนโยบาย `session.reset` ที่ชัดเจนยังคง
  ทำงาน

หมายเหตุเกี่ยวกับ serialization:

- `serialize: true` ทำให้การรันใน lane เดียวกันยังคงเรียงตามลำดับ
- CLI ส่วนใหญ่ serialize บน lane ผู้ให้บริการเดียว
- OpenClaw จะยกเลิกการใช้เซสชัน CLI ที่บันทึกไว้ซ้ำเมื่อ identity การยืนยันตัวตนที่เลือกเปลี่ยนไป
  รวมถึง auth profile id ที่เปลี่ยน, static API key, static token, หรือ identity
  บัญชี OAuth เมื่อ CLI เปิดเผยให้เห็น การหมุนเวียน OAuth access และ refresh token
  จะไม่ตัดเซสชัน CLI ที่บันทึกไว้ หาก CLI ไม่เปิดเผย
  stable OAuth account id OpenClaw จะปล่อยให้ CLI นั้นบังคับใช้สิทธิ์การ resume เอง

## prelude fallback จากเซสชัน claude-cli

เมื่อความพยายาม `claude-cli` fail over ไปยัง candidate ที่ไม่ใช่ CLI ใน
[`agents.defaults.model.fallbacks`](/th/concepts/model-failover) OpenClaw จะ seed
ความพยายามถัดไปด้วย context prelude ที่เก็บจาก transcript JSONL local ของ Claude Code
ที่ `~/.claude/projects/` หากไม่มี seed นี้ ผู้ให้บริการ fallback
จะเริ่มแบบ cold เพราะ transcript เซสชันของ OpenClaw เองว่างเปล่า
สำหรับการรัน `claude-cli`

- prelude จะเลือก summary `/compact` ล่าสุดหรือ marker `compact_boundary`
  ก่อน จากนั้นต่อท้ายเทิร์น post-boundary ล่าสุดเท่าที่ char
  budget อนุญาต เทิร์น pre-boundary จะถูกละทิ้งเพราะ summary แสดงแทน
  เทิร์นเหล่านั้นแล้ว
- บล็อกเครื่องมือจะถูกรวมให้เป็น hint แบบกะทัดรัด `(tool call: name)` และ
  `(tool result: …)` เพื่อรักษางบประมาณ prompt อย่างตรงไปตรงมา summary จะถูก
  ติดป้าย `(truncated)` หากล้น
- fallback จาก `claude-cli` ไป `claude-cli` ที่เป็นผู้ให้บริการเดียวกันจะพึ่งพา
  `--resume` ของ Claude เองและข้าม prelude
- seed ใช้การตรวจสอบพาธไฟล์เซสชัน Claude ที่มีอยู่ซ้ำ ดังนั้น
  จึงไม่สามารถอ่านพาธตามอำเภอใจได้

## รูปภาพ (ส่งผ่าน)

หาก CLI ของคุณรับพาธรูปภาพ ให้ตั้งค่า `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw จะเขียนรูปภาพ base64 ลงไฟล์ชั่วคราว หากตั้งค่า `imageArg` ไว้
พาธเหล่านั้นจะถูกส่งเป็น args ของ CLI หากไม่มี `imageArg` OpenClaw จะต่อท้าย
พาธไฟล์ลงใน prompt (path injection) ซึ่งเพียงพอสำหรับ CLI ที่โหลด
ไฟล์ local จากพาธธรรมดาโดยอัตโนมัติ

## input / output

- `output: "json"` (ค่าเริ่มต้น) จะพยายามแยกวิเคราะห์ JSON และดึงข้อความ + session id
- สำหรับ output JSON ของ Gemini CLI OpenClaw จะอ่านข้อความตอบกลับจาก `response` และ
  usage จาก `stats` เมื่อ `usage` หายไปหรือว่างเปล่า
- `output: "jsonl"` แยกวิเคราะห์สตรีม JSONL (เช่น Codex CLI `--json`) และดึงข้อความ agent สุดท้ายพร้อม session
  identifier เมื่อมี
- `output: "text"` ถือว่า stdout เป็นคำตอบสุดท้าย

โหมด input:

- `input: "arg"` (ค่าเริ่มต้น) ส่ง prompt เป็น arg สุดท้ายของ CLI
- `input: "stdin"` ส่ง prompt ผ่าน stdin
- หาก prompt ยาวมากและตั้งค่า `maxPromptArgChars` ไว้ จะใช้ stdin

## ค่าเริ่มต้น (Plugin เป็นเจ้าของ)

Plugin OpenAI ที่มาพร้อมชุดยังลงทะเบียนค่าเริ่มต้นสำหรับ `codex-cli` ด้วย:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google ที่มาพร้อมชุดยังลงทะเบียนค่าเริ่มต้นสำหรับ `google-gemini-cli` ด้วย:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

ข้อกำหนดเบื้องต้น: ต้องติดตั้ง Gemini CLI แบบ local และพร้อมใช้งานเป็น
`gemini` บน `PATH` (`brew install gemini-cli` หรือ
`npm install -g @google/gemini-cli`)

หมายเหตุ JSON ของ Gemini CLI:

- ข้อความตอบกลับจะถูกอ่านจากฟิลด์ JSON `response`
- การใช้งานจะถอยกลับไปใช้ `stats` เมื่อไม่มี `usage` หรือค่าว่าง
- `stats.cached` จะถูกปรับรูปแบบเป็น `cacheRead` ของ OpenClaw
- หากไม่มี `stats.input` OpenClaw จะคำนวณโทเค็นอินพุตจาก
  `stats.input_tokens - stats.cached`

แทนที่เฉพาะเมื่อจำเป็นเท่านั้น (ที่พบบ่อย: พาธ `command` แบบสัมบูรณ์)

## ค่าเริ่มต้นที่ Plugin เป็นเจ้าของ

ค่าเริ่มต้นของแบ็กเอนด์ CLI ตอนนี้เป็นส่วนหนึ่งของพื้นผิว Plugin:

- Plugin ลงทะเบียนค่าเหล่านี้ด้วย `api.registerCliBackend(...)`
- `id` ของแบ็กเอนด์จะกลายเป็นคำนำหน้าผู้ให้บริการใน model refs
- การตั้งค่าผู้ใช้ใน `agents.defaults.cliBackends.<id>` ยังคงแทนที่ค่าเริ่มต้นของ Plugin
- การล้างค่ากำหนดเฉพาะแบ็กเอนด์ยังคงเป็นของ Plugin ผ่านฮุก
  `normalizeConfig` ที่เลือกใช้ได้

Plugin ที่ต้องใช้ชิมความเข้ากันได้ของพรอมป์/ข้อความขนาดเล็กสามารถประกาศ
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

`input` จะเขียนพรอมป์ระบบและพรอมป์ผู้ใช้ที่ส่งให้ CLI ใหม่ ส่วน `output`
จะเขียน assistant deltas ที่สตรีมมาและข้อความสุดท้ายที่แยกวิเคราะห์แล้วใหม่ ก่อนที่ OpenClaw จะจัดการ
เครื่องหมายควบคุมของตัวเองและการส่งไปยังช่องทาง

สำหรับ CLI ที่ปล่อย JSONL ที่เข้ากันได้กับ Claude Code stream-json ให้ตั้งค่า
`jsonlDialect: "claude-stream-json"` ในค่ากำหนดของแบ็กเอนด์นั้น

## โอเวอร์เลย์ MCP แบบบันเดิล

แบ็กเอนด์ CLI **ไม่ได้** รับการเรียกเครื่องมือของ OpenClaw โดยตรง แต่แบ็กเอนด์สามารถ
เลือกใช้โอเวอร์เลย์ค่ากำหนด MCP ที่สร้างขึ้นด้วย `bundleMcp: true`

พฤติกรรมที่บันเดิลอยู่ในปัจจุบัน:

- `claude-cli`: ไฟล์ค่ากำหนด MCP แบบเข้มงวดที่สร้างขึ้น
- `codex-cli`: การแทนที่ค่ากำหนดแบบอินไลน์สำหรับ `mcp_servers`; เซิร์ฟเวอร์
  loopback ของ OpenClaw ที่สร้างขึ้นจะถูกทำเครื่องหมายด้วยโหมดอนุมัติเครื่องมือรายเซิร์ฟเวอร์ของ Codex
  เพื่อให้การเรียก MCP ไม่ค้างที่พรอมป์อนุมัติในเครื่อง
- `google-gemini-cli`: ไฟล์การตั้งค่าระบบ Gemini ที่สร้างขึ้น

เมื่อเปิดใช้ MCP แบบบันเดิล OpenClaw จะ:

- สร้างเซิร์ฟเวอร์ HTTP MCP แบบ loopback ที่เปิดเผยเครื่องมือ Gateway ให้กระบวนการ CLI
- ยืนยันตัวตนบริดจ์ด้วยโทเค็นต่อเซสชัน (`OPENCLAW_MCP_TOKEN`)
- จำกัดขอบเขตการเข้าถึงเครื่องมือไว้ที่เซสชัน บัญชี และบริบทช่องทางปัจจุบัน
- โหลดเซิร์ฟเวอร์ bundle-MCP ที่เปิดใช้สำหรับเวิร์กสเปซปัจจุบัน
- รวมเซิร์ฟเวอร์เหล่านั้นเข้ากับรูปร่างค่ากำหนด/การตั้งค่า MCP ของแบ็กเอนด์ที่มีอยู่
- เขียนค่ากำหนดการเปิดใช้งานใหม่โดยใช้โหมดการผสานรวมที่แบ็กเอนด์เป็นเจ้าของจากส่วนขยายเจ้าของ

หากไม่มีเซิร์ฟเวอร์ MCP ที่เปิดใช้ OpenClaw ยังคงฉีดค่ากำหนดแบบเข้มงวดเมื่อ
แบ็กเอนด์เลือกใช้ MCP แบบบันเดิล เพื่อให้การรันเบื้องหลังยังคงแยกออกจากกัน

รันไทม์ MCP แบบบันเดิลที่มีขอบเขตตามเซสชันจะถูกแคชไว้เพื่อใช้ซ้ำภายในเซสชัน จากนั้น
จะถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10
นาที; ตั้งค่าเป็น `0` เพื่อปิดใช้) การรันแบบฝังครั้งเดียว เช่น การตรวจสอบ auth,
การสร้าง slug และคำขอเรียกคืน Active Memory จะล้างข้อมูลเมื่อสิ้นสุดการรัน เพื่อให้ลูกของ stdio
และสตรีม Streamable HTTP/SSE ไม่คงอยู่นานกว่าการรัน

## ข้อจำกัด

- **ไม่มีการเรียกเครื่องมือ OpenClaw โดยตรง** OpenClaw จะไม่ฉีดการเรียกเครื่องมือเข้าไปใน
  โปรโตคอลแบ็กเอนด์ CLI แบ็กเอนด์จะเห็นเครื่องมือ Gateway เฉพาะเมื่อเลือกใช้
  `bundleMcp: true`
- **การสตรีมขึ้นอยู่กับแบ็กเอนด์** บางแบ็กเอนด์สตรีม JSONL; บางแบ็กเอนด์บัฟเฟอร์
  จนกว่าจะออก
- **เอาต์พุตแบบมีโครงสร้าง** ขึ้นอยู่กับรูปแบบ JSON ของ CLI
- **เซสชัน Codex CLI** ทำงานต่อผ่านเอาต์พุตข้อความ (ไม่มี JSONL) ซึ่งมีโครงสร้างน้อยกว่า
  การรัน `--json` ครั้งแรก เซสชัน OpenClaw ยังคงทำงานได้
  ตามปกติ

## การแก้ไขปัญหา

- **ไม่พบ CLI**: ตั้งค่า `command` เป็นพาธเต็ม
- **ชื่อโมเดลผิด**: ใช้ `modelAliases` เพื่อแมป `provider/model` → โมเดล CLI
- **ไม่มีความต่อเนื่องของเซสชัน**: ตรวจสอบว่าได้ตั้งค่า `sessionArg` แล้ว และ `sessionMode` ไม่ใช่
  `none` (ปัจจุบัน Codex CLI ยังไม่สามารถทำงานต่อพร้อมเอาต์พุต JSON ได้)
- **รูปภาพถูกละเว้น**: ตั้งค่า `imageArg` (และตรวจสอบว่า CLI รองรับพาธไฟล์)

## ที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway)
- [โมเดลในเครื่อง](/th/gateway/local-models)
