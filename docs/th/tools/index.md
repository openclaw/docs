---
read_when:
    - คุณต้องการเข้าใจว่า OpenClaw มี tools อะไรบ้าง
    - คุณต้องกำหนดค่า อนุญาต หรือปฏิเสธ tools
    - คุณกำลังตัดสินใจเลือกระหว่าง tools, Skills และ plugins ที่มีมาในตัว
summary: 'ภาพรวมของ tools และ plugins ใน OpenClaw: สิ่งที่ agent ทำได้และวิธีขยายความสามารถของมัน'
title: Tools และ plugins
x-i18n:
    generated_at: "2026-04-25T14:00:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

ทุกสิ่งที่ agent ทำได้นอกเหนือจากการสร้างข้อความ จะเกิดขึ้นผ่าน **tools**
Tools คือวิธีที่ agent ใช้อ่านไฟล์ รันคำสั่ง ท่องเว็บ ส่ง
ข้อความ และโต้ตอบกับอุปกรณ์

## Tools, Skills และ plugins

OpenClaw มีสามชั้นที่ทำงานร่วมกัน:

<Steps>
  <Step title="Tools คือสิ่งที่ agent เรียกใช้">
    tool คือฟังก์ชันแบบมีชนิดข้อมูลที่ agent สามารถเรียกใช้ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อม **tools ในตัว**
    ชุดหนึ่ง และ plugins สามารถลงทะเบียน tools เพิ่มเติมได้

    agent มอง tools เป็นนิยามฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง model API

  </Step>

  <Step title="Skills สอน agent ว่าควรใช้เมื่อไรและอย่างไร">
    Skill คือไฟล์ markdown (`SKILL.md`) ที่ถูก inject เข้าไปใน system prompt
    Skills ให้บริบท ข้อจำกัด และคำแนะนำทีละขั้นตอนแก่ agent
    เพื่อใช้ tools ได้อย่างมีประสิทธิภาพ Skills อาจอยู่ใน workspace ของคุณ ในโฟลเดอร์ที่ใช้ร่วมกัน
    หรือมาพร้อมอยู่ภายใน plugins

    [เอกสารอ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugins รวมทุกอย่างเข้าด้วยกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนชุดความสามารถได้หลายแบบ:
    channels, model providers, tools, skills, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, web search และอื่น ๆ บาง plugins เป็น **core** (มาพร้อมกับ
    OpenClaw) ส่วนบางตัวเป็น **external** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า plugins](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## tools ในตัว

tools เหล่านี้มาพร้อมกับ OpenClaw และใช้งานได้โดยไม่ต้องติดตั้ง plugins เพิ่มเติม:

| Tool                                       | สิ่งที่ทำได้                                                         | หน้า                                                         |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | รันคำสั่ง shell, จัดการโปรเซสเบื้องหลัง                            | [Exec](/th/tools/exec), [Exec Approvals](/th/tools/exec-approvals) |
| `code_execution`                           | รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed                        | [Code Execution](/th/tools/code-execution)                      |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (นำทาง, คลิก, จับภาพหน้าจอ)            | [Browser](/th/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ, ค้นหาโพสต์บน X, ดึงเนื้อหาหน้าเว็บ                      | [Web](/th/tools/web), [Web Fetch](/th/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O ไฟล์ใน workspace                                                |                                                              |
| `apply_patch`                              | แพตช์ไฟล์หลายช่วง                                                   | [Apply Patch](/th/tools/apply-patch)                            |
| `message`                                  | ส่งข้อความข้ามทุก channels                                          | [Agent Send](/th/tools/agent-send)                              |
| `canvas`                                   | ควบคุม Canvas ของ node (present, eval, snapshot)                    |                                                              |
| `nodes`                                    | ค้นหาและกำหนดเป้าหมายอุปกรณ์ที่จับคู่ไว้                           |                                                              |
| `cron` / `gateway`                         | จัดการงานตามกำหนดเวลา; ตรวจสอบ, แพตช์, รีสตาร์ต หรืออัปเดต gateway |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างภาพ                                               | [Image Generation](/th/tools/image-generation)                  |
| `music_generate`                           | สร้างแทร็กเพลง                                                      | [Music Generation](/th/tools/music-generation)                  |
| `video_generate`                           | สร้างวิดีโอ                                                         | [Video Generation](/th/tools/video-generation)                  |
| `tts`                                      | แปลงข้อความเป็นเสียงแบบครั้งเดียว                                   | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน, สถานะ และ orchestration ของ sub-agent              | [Sub-agents](/th/tools/subagents)                               |
| `session_status`                           | การอ่านสถานะแบบเบาในสไตล์ `/status` และ override โมเดลต่อเซสชัน    | [Session Tools](/th/concepts/session-tool)                      |

สำหรับงานด้านภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายเป็น `openai/*`, `google/*`, `fal/*` หรือ provider ภาพอื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของ provider นั้นก่อน

สำหรับงานด้านดนตรี ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมายเป็น `google/*`, `minimax/*` หรือ provider เพลงอื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของ provider นั้นก่อน

สำหรับงานด้านวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมายเป็น `qwen/*` หรือ provider วิดีโออื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของ provider นั้นก่อน

สำหรับการสร้างเสียงที่ขับเคลื่อนด้วย workflow ให้ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนมันไว้ สิ่งนี้แยกจาก `tts` ซึ่งเป็น text-to-speech

`session_status` คือ tool สำหรับสถานะ/การอ่านกลับแบบเบาในกลุ่ม sessions
มันตอบคำถามแบบ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่า override โมเดลระดับเซสชันได้ตามต้องการ; `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` มันสามารถเติมค่าตัวนับ token/cache ที่เบาบางกลับเข้าไป และ
ป้ายกำกับโมเดลรันไทม์ที่กำลังใช้งานจาก usage entry ล่าสุดในทรานสคริปต์

`gateway` คือ runtime tool สำหรับ owner เท่านั้นสำหรับงานของ gateway:

- `config.schema.lookup` สำหรับ subtree ของ config แบบจำกัดตาม path ก่อนแก้ไข
- `config.get` สำหรับ snapshot ของ config ปัจจุบัน + hash
- `config.patch` สำหรับการอัปเดต config บางส่วนพร้อม restart
- `config.apply` ใช้เฉพาะเมื่อแทนที่ config ทั้งหมด
- `update.run` สำหรับการอัปเดตตัวเอง + restart แบบชัดเจน

สำหรับการเปลี่ยนแปลงบางส่วน ให้ใช้ `config.schema.lookup` แล้วตามด้วย
`config.patch` ใช้ `config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่ config ทั้งหมด
tool นี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security` ด้วย;
alias แบบเดิม `tools.bash.*` จะถูก normalize ไปยัง exec paths ที่ได้รับการปกป้องเดียวกัน

### tools ที่ Plugin จัดให้

Plugins สามารถลงทะเบียน tools เพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON-only สำหรับ structured output
- [Lobster](/th/tools/lobster) — runtime ของ workflow แบบมีชนิดข้อมูลพร้อม approvals ที่กลับมาทำต่อได้
- [Music Generation](/th/tools/music-generation) — tool `music_generate` แบบใช้ร่วมกันพร้อม providers ที่ขับเคลื่อนด้วย workflow
- [OpenProse](/th/prose) — orchestration ของ workflow แบบ markdown-first
- [Tokenjuice](/th/tools/tokenjuice) — ทำให้ผลลัพธ์ของ tool `exec` และ `bash` ที่มีสัญญาณรบกวนมากกระชับลง

## การกำหนดค่า tools

### รายการ allow และ deny

ควบคุมว่า agent สามารถเรียก tools ใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config โดย deny จะชนะ allow เสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw จะ fail-closed เมื่อ allowlist แบบชัดเจน resolve แล้วไม่พบ callable tools
ตัวอย่างเช่น `tools.allow: ["query_db"]` จะใช้งานได้ก็ต่อเมื่อมี Plugin ที่โหลดอยู่
ลงทะเบียน `query_db` ไว้จริงเท่านั้น หากไม่มี built-in, Plugin หรือ bundled MCP tool ใดตรงกับ
allowlist การรันจะหยุดก่อน model call แทนที่จะทำงานต่อเป็นการรันแบบ
text-only ที่อาจหลอนผลลัพธ์ของ tool ขึ้นมา

### โปรไฟล์ของ tools

`tools.profile` จะตั้งค่า allowlist พื้นฐานก่อนนำ `allow`/`deny` มาใช้
override ต่อ agent: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | ไม่จำกัด (เหมือนกับไม่ตั้งค่า)                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                             |
| `minimal`   | `session_status` เท่านั้น                                                                                                                              |

โปรไฟล์ `coding` และ `messaging` ยังอนุญาต bundle MCP tools ที่ตั้งค่าไว้
ภายใต้คีย์ Plugin `bundle-mcp` ด้วย เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คง built-ins ปกติไว้ แต่ซ่อน MCP tools ที่ตั้งค่าไว้ทั้งหมด
โปรไฟล์ `minimal` จะไม่รวม bundle MCP tools

### กลุ่มของ tools

ใช้ shorthand แบบ `group:*` ในรายการ allow/deny:

| กลุ่ม              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` ยอมรับเป็น alias ของ `exec`)                                        |
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
| `group:openclaw`   | tools ในตัวทั้งหมดของ OpenClaw (ไม่รวม plugin tools)                                                     |

`sessions_history` จะคืนมุมมองการเรียกคืนแบบจำกัดขอบเขตและผ่านตัวกรองความปลอดภัย
มันจะลบแท็ก thinking, โครง `<relevant-memories>`, payload XML ของ tool-call แบบ plain-text
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน),
โครง tool-call ที่ถูกลดระดับ, model control tokens ที่เป็น ASCII/full-width ที่รั่วออกมา
และ MiniMax tool-call XML ที่ผิดรูปจากข้อความของ assistant จากนั้นจึงใช้
การปกปิดข้อมูล/การตัดทอน และ placeholder สำหรับแถวที่ใหญ่เกินไปตามความเหมาะสม แทนการทำงาน
เสมือนเป็นการ dump ทรานสคริปต์ดิบ

### ข้อจำกัดเฉพาะ provider

ใช้ `tools.byProvider` เพื่อจำกัด tools สำหรับ providers เฉพาะโดยไม่ต้อง
เปลี่ยนค่าเริ่มต้นแบบ global:

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
