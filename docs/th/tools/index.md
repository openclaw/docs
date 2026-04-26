---
read_when:
    - คุณต้องการเข้าใจว่า OpenClaw มีเครื่องมืออะไรให้บ้าง
    - คุณต้องการกำหนดค่า อนุญาต หรือปฏิเสธเครื่องมือ
    - คุณกำลังตัดสินใจเลือกระหว่างเครื่องมือในตัว Skills และ Plugins
summary: 'ภาพรวมของเครื่องมือและ Plugins ใน OpenClaw: เอเจนต์ทำอะไรได้บ้าง และจะขยายความสามารถได้อย่างไร'
title: เครื่องมือและ Plugins
x-i18n:
    generated_at: "2026-04-26T11:43:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

ทุกอย่างที่เอเจนต์ทำได้นอกเหนือจากการสร้างข้อความจะเกิดขึ้นผ่าน **tools**
Tools คือวิธีที่เอเจนต์ใช้ในการอ่านไฟล์ รันคำสั่ง ท่องเว็บ ส่ง
ข้อความ และโต้ตอบกับอุปกรณ์

## Tools, Skills และ Plugins

OpenClaw มีสามชั้นที่ทำงานร่วมกัน:

<Steps>
  <Step title="Tools คือสิ่งที่เอเจนต์เรียกใช้">
    tool คือฟังก์ชันแบบมี type ที่เอเจนต์สามารถเรียกใช้ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อมกับ **built-in tools** ชุดหนึ่ง และ
    plugins สามารถลงทะเบียน tools เพิ่มเติมได้

    เอเจนต์มอง tools เป็นคำจำกัดความของฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง model API

  </Step>

  <Step title="Skills สอนเอเจนต์ว่าควรใช้เมื่อไรและอย่างไร">
    Skill คือไฟล์ markdown (`SKILL.md`) ที่ถูก inject เข้าไปใน system prompt
    Skills ให้บริบท ข้อจำกัด และคำแนะนำทีละขั้นตอนแก่เอเจนต์
    เพื่อใช้ tools ได้อย่างมีประสิทธิภาพ Skills อยู่ได้ใน workspace ของคุณ ในโฟลเดอร์ที่ใช้ร่วมกัน
    หรือมาพร้อมกับ plugins

    [ข้อมูลอ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugins รวมทุกอย่างไว้ด้วยกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนความสามารถแบบผสมกันได้:
    channels, model providers, tools, skills, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, web search และอีกมากมาย บาง plugins เป็น **core** (มาพร้อมกับ
    OpenClaw) บางตัวเป็น **external** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า plugins](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## Built-in tools

tools เหล่านี้มาพร้อมกับ OpenClaw และใช้งานได้โดยไม่ต้องติดตั้ง plugins ใด ๆ:

| Tool                                       | สิ่งที่ทำได้                                                          | หน้า                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | รันคำสั่ง shell จัดการ background processes                       | [Exec](/th/tools/exec), [Exec Approvals](/th/tools/exec-approvals) |
| `code_execution`                           | รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed                                  | [Code Execution](/th/tools/code-execution)                      |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (นำทาง คลิก จับภาพหน้าจอ)              | [Browser](/th/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ ค้นหาโพสต์ X ดึงเนื้อหาของหน้าเว็บ                    | [Web](/th/tools/web), [Web Fetch](/th/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O ไฟล์ใน workspace                                             |                                                              |
| `apply_patch`                              | แพตช์ไฟล์หลาย hunk                                               | [Apply Patch](/th/tools/apply-patch)                            |
| `message`                                  | ส่งข้อความข้ามทุก channels                                     | [Agent Send](/th/tools/agent-send)                              |
| `canvas`                                   | ควบคุม node Canvas (present, eval, snapshot)                           |                                                              |
| `nodes`                                    | ค้นหาและกำหนดเป้าหมายอุปกรณ์ที่จับคู่แล้ว                                    |                                                              |
| `cron` / `gateway`                         | จัดการงานตามเวลา; ตรวจสอบ แพตช์ รีสตาร์ต หรืออัปเดต Gateway |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างภาพ                                            | [Image Generation](/th/tools/image-generation)                  |
| `music_generate`                           | สร้างแทร็กเพลง                                                 | [Music Generation](/th/tools/music-generation)                  |
| `video_generate`                           | สร้างวิดีโอ                                                       | [Video Generation](/th/tools/video-generation)                  |
| `tts`                                      | แปลงข้อความเป็นเสียงแบบครั้งเดียว                                    | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน สถานะ และการ orchestration ของ sub-agent               | [Sub-agents](/th/tools/subagents)                               |
| `session_status`                           | การอ่านสถานะสไตล์ `/status` แบบ lightweight และการ override โมเดลของเซสชัน       | [Session Tools](/th/concepts/session-tool)                      |

สำหรับงานเกี่ยวกับภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายไปที่ `openai/*`, `google/*`, `fal/*` หรือ image provider ที่ไม่ใช่ค่าเริ่มต้นอื่น ๆ ให้กำหนดค่า auth/API key ของ provider นั้นก่อน

สำหรับงานเกี่ยวกับเพลง ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมายไปที่ `google/*`, `minimax/*` หรือ music provider ที่ไม่ใช่ค่าเริ่มต้นอื่น ๆ ให้กำหนดค่า auth/API key ของ provider นั้นก่อน

สำหรับงานเกี่ยวกับวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมายไปที่ `qwen/*` หรือ video provider ที่ไม่ใช่ค่าเริ่มต้นอื่น ๆ ให้กำหนดค่า auth/API key ของ provider นั้นก่อน

สำหรับการสร้างเสียงที่ขับเคลื่อนด้วย workflow ให้ใช้ `music_generate` เมื่อ plugin เช่น
ComfyUI ลงทะเบียนมันไว้ ซึ่งแยกจาก `tts` ที่เป็น text-to-speech

`session_status` คือ tool สำหรับสถานะ/การอ่านกลับแบบ lightweight ในกลุ่ม sessions
มันตอบคำถามสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่า per-session model override ได้แบบ optional; `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` มันสามารถเติมค่ากลับให้ตัวนับ token/cache ที่กระจัดกระจาย และ
ป้ายกำกับโมเดล runtime ที่กำลังใช้งานจากรายการ usage ล่าสุดใน transcript

`gateway` คือ runtime tool แบบ owner-only สำหรับการดำเนินการเกี่ยวกับ Gateway:

- `config.schema.lookup` สำหรับ config subtree แบบระบุพาธหนึ่งชุดก่อนแก้ไข
- `config.get` สำหรับ snapshot + hash ของ config ปัจจุบัน
- `config.patch` สำหรับการอัปเดต config บางส่วนพร้อมการรีสตาร์ต
- `config.apply` ใช้เฉพาะสำหรับการแทนที่ config ทั้งชุด
- `update.run` สำหรับการ self-update + restart แบบ explicit

สำหรับการเปลี่ยนแปลงบางส่วน ให้เลือกใช้ `config.schema.lookup` แล้วตามด้วย `config.patch` ใช้
`config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่ config ทั้งหมด
สำหรับเอกสาร config ที่กว้างขึ้น ให้อ่าน [Configuration](/th/gateway/configuration) และ
[Configuration reference](/th/gateway/configuration-reference)
tool นี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security`; นามแฝงแบบ legacy `tools.bash.*` จะถูก normalize ไปยังพาธ exec ที่ได้รับการปกป้องเดียวกัน

### Tools ที่มาจาก plugins

plugins สามารถลงทะเบียน tools เพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON-only สำหรับ structured output
- [Lobster](/th/tools/lobster) — runtime ของ workflow แบบมี type พร้อม approvals ที่ทำต่อได้
- [Music Generation](/th/tools/music-generation) — tool `music_generate` แบบใช้ร่วมกันพร้อม providers ที่ขับเคลื่อนด้วย workflow
- [OpenProse](/th/prose) — การ orchestration ของ workflow แบบ markdown-first
- [Tokenjuice](/th/tools/tokenjuice) — ทำผลลัพธ์ของ tool `exec` และ `bash` ที่มีสัญญาณรบกวนมากให้กระชับ

## การกำหนดค่า tool

### รายการ allow และ deny

ควบคุมว่าเอเจนต์สามารถเรียก tools ใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config โดย deny จะมีผลเหนือ allow เสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw จะ fail closed เมื่อ allowlist แบบ explicit resolve แล้วไม่เหลือ tools ที่เรียกใช้ได้
ตัวอย่างเช่น `tools.allow: ["query_db"]` จะใช้ได้ก็ต่อเมื่อ plugin ที่โหลดอยู่ลงทะเบียน
`query_db` จริงเท่านั้น หากไม่มี built-in, plugin หรือ bundled MCP tool ใดตรงกับ
allowlist การรันจะหยุดก่อน model call แทนที่จะดำเนินต่อเป็นการรันแบบ text-only ที่อาจทำให้หลอนผลลัพธ์ของ tool

### โปรไฟล์ tool

`tools.profile` กำหนด base allowlist ก่อนจะใช้ `allow`/`deny`
override ต่อ agent: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ตั้งค่า)                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` เท่านั้น                                                                                                                             |

`coding` รวม web tools แบบ lightweight (`web_search`, `web_fetch`, `x_search`)
แต่ไม่รวม tool สำหรับควบคุมเบราว์เซอร์เต็มรูปแบบ Browser automation สามารถขับเคลื่อนเซสชันจริงและโปรไฟล์ที่ล็อกอินอยู่ได้ ดังนั้นให้เพิ่มแบบ explicit ด้วย
`tools.alsoAllow: ["browser"]` หรือ
`agents.list[].tools.alsoAllow: ["browser"]` แบบต่อ agent

โปรไฟล์ `coding` และ `messaging` ยังอนุญาต bundle MCP tools ที่กำหนดค่าไว้
ภายใต้คีย์ plugin `bundle-mcp` ด้วย เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์ยังคงมี built-ins ปกติ แต่ซ่อน MCP tools ที่กำหนดค่าไว้ทั้งหมด
โปรไฟล์ `minimal` ไม่รวม bundle MCP tools

### กลุ่ม tool

ใช้คำย่อ `group:*` ในรายการ allow/deny:

| กลุ่ม              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` ยอมรับเป็น alias ของ `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | built-in tools ทั้งหมดของ OpenClaw (ไม่รวม plugin tools)                                                       |

`sessions_history` จะคืนมุมมอง recall แบบมีขอบเขตและผ่านการกรองด้านความปลอดภัยแล้ว โดยจะตัด
thinking tags, โครง `<relevant-memories>`, payload XML ของการเรียก tool แบบ plain-text
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียก tool ที่ถูกตัดทอน),
โครงของการเรียก tool ที่ถูกลดระดับแล้ว, model control
tokens ที่รั่วออกมาแบบ ASCII/full-width และ MiniMax tool-call XML ที่ผิดรูปแบบออกจากข้อความของ assistant จากนั้นจึงใช้
redaction/truncation และอาจใช้ placeholders สำหรับแถวที่มีขนาดใหญ่เกิน แทนที่จะทำหน้าที่
เป็นการ dump transcript แบบดิบ

### ข้อจำกัดเฉพาะ provider

ใช้ `tools.byProvider` เพื่อจำกัด tools สำหรับ provider ที่เฉพาะเจาะจงโดยไม่ต้อง
เปลี่ยนค่าเริ่มต้นส่วนกลาง:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
