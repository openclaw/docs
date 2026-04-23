---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มี Tools อะไรให้บ้าง
    - คุณต้องการกำหนดค่า อนุญาต หรือปฏิเสธ Tools
    - คุณกำลังตัดสินใจเลือกระหว่าง Tools ในตัว, Skills และ plugin
summary: 'ภาพรวม Tools และ plugin ของ OpenClaw: เอเจนต์ทำอะไรได้บ้าง และจะขยายความสามารถอย่างไร'
title: Tools และ Plugins
x-i18n:
    generated_at: "2026-04-23T10:24:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Tools และ Plugins

ทุกสิ่งที่เอเจนต์ทำได้นอกเหนือจากการสร้างข้อความเกิดขึ้นผ่าน **Tools**
Tools คือวิธีที่เอเจนต์ใช้ในการอ่านไฟล์ รันคำสั่ง ท่องเว็บ ส่ง
ข้อความ และโต้ตอบกับอุปกรณ์

## Tools, Skills และ Plugins

OpenClaw มี 3 ชั้นที่ทำงานร่วมกัน:

<Steps>
  <Step title="Tools คือสิ่งที่เอเจนต์เรียกใช้">
    tool คือฟังก์ชันแบบมีชนิดข้อมูลที่เอเจนต์สามารถเรียกใช้ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อมกับ **Tools ในตัว** ชุดหนึ่ง และ
    plugin สามารถลงทะเบียน tool เพิ่มเติมได้

    เอเจนต์จะเห็น tool เป็นคำจำกัดความของฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง model API

  </Step>

  <Step title="Skills สอนเอเจนต์ว่าเมื่อไรและอย่างไร">
    skill คือไฟล์ markdown (`SKILL.md`) ที่ถูกแทรกเข้าไปใน system prompt
    Skills ให้บริบท ข้อจำกัด และคำแนะนำแบบทีละขั้นกับเอเจนต์
    เพื่อใช้ tool ได้อย่างมีประสิทธิภาพ Skills อยู่ใน workspace ของคุณ ในโฟลเดอร์ที่ใช้ร่วมกัน
    หรือมาพร้อมอยู่ใน plugin

    [ข้อมูลอ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugins รวมทุกอย่างไว้ด้วยกัน">
    plugin คือแพ็กเกจที่สามารถลงทะเบียน capability ได้หลายแบบร่วมกัน:
    channels, ผู้ให้บริการโมเดล, tools, Skills, เสียงพูด, realtime transcription,
    realtime voice, media understanding, การสร้างภาพ, การสร้างวิดีโอ,
    web fetch, web search และอื่น ๆ บาง plugin เป็นแบบ **core** (มาพร้อมกับ
    OpenClaw) ส่วนบาง plugin เป็นแบบ **external** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า Plugins](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## Tools ในตัว

Tools เหล่านี้มาพร้อมกับ OpenClaw และใช้งานได้โดยไม่ต้องติดตั้ง plugin ใด ๆ:

| Tool                                       | สิ่งที่ทำได้                                                         | หน้า                                                         |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | รันคำสั่งเชลล์ จัดการโปรเซสเบื้องหลัง                               | [Exec](/th/tools/exec), [Exec Approvals](/th/tools/exec-approvals) |
| `code_execution`                           | รันการวิเคราะห์ Python ระยะไกลแบบ sandbox                           | [Code Execution](/th/tools/code-execution)                      |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (นำทาง คลิก จับภาพหน้าจอ)               | [Browser](/th/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ ค้นหาโพสต์บน X ดึงเนื้อหาหน้าเว็บ                         | [Web](/th/tools/web), [Web Fetch](/th/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O ของไฟล์ใน workspace                                              |                                                              |
| `apply_patch`                              | patch ไฟล์แบบหลายช่วง                                                | [Apply Patch](/th/tools/apply-patch)                            |
| `message`                                  | ส่งข้อความข้ามทุกช่องทาง                                            | [Agent Send](/th/tools/agent-send)                              |
| `canvas`                                   | ควบคุม node Canvas (present, eval, snapshot)                        |                                                              |
| `nodes`                                    | ค้นหาและกำหนดเป้าหมายอุปกรณ์ที่จับคู่ไว้                            |                                                              |
| `cron` / `gateway`                         | จัดการงานตามกำหนดเวลา; ตรวจสอบ patch รีสตาร์ต หรืออัปเดต Gateway     |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างภาพ                                               | [Image Generation](/th/tools/image-generation)                  |
| `music_generate`                           | สร้างแทร็กเพลง                                                      | [Music Generation](/th/tools/music-generation)                  |
| `video_generate`                           | สร้างวิดีโอ                                                          | [Video Generation](/th/tools/video-generation)                  |
| `tts`                                      | แปลงข้อความเป็นเสียงพูดแบบครั้งเดียว                                 | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน สถานะ และการประสานงาน sub-agent                     | [Sub-agents](/th/tools/subagents)                               |
| `session_status`                           | การอ่านกลับแบบ `/status` น้ำหนักเบาและ model override รายเซสชัน      | [Session Tools](/th/concepts/session-tool)                      |

สำหรับงานด้านภาพ ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณใช้ `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการภาพที่ไม่ใช่ค่าเริ่มต้นอื่น ๆ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานด้านเพลง ใช้ `music_generate` หากคุณใช้ `google/*`, `minimax/*` หรือผู้ให้บริการเพลงที่ไม่ใช่ค่าเริ่มต้นอื่น ๆ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานด้านวิดีโอ ใช้ `video_generate` หากคุณใช้ `qwen/*` หรือผู้ให้บริการวิดีโอที่ไม่ใช่ค่าเริ่มต้นอื่น ๆ ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงแบบขับเคลื่อนด้วยเวิร์กโฟลว์ ใช้ `music_generate` เมื่อ plugin เช่น
ComfyUI ลงทะเบียนไว้ สิ่งนี้แยกจาก `tts` ซึ่งเป็นการแปลงข้อความเป็นเสียงพูด

`session_status` เป็น tool สำหรับสถานะ/การอ่านกลับแบบน้ำหนักเบาในกลุ่ม sessions
มันตอบคำถามสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่า model override รายเซสชันได้ตามต้องการ; `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` มันสามารถเติมค่า token/cache counter ที่ไม่ครบและ
ป้ายชื่อโมเดลรันไทม์ที่ใช้งานอยู่จาก usage entry ล่าสุดในทรานสคริปต์ได้

`gateway` เป็น tool รันไทม์สำหรับเจ้าของเท่านั้นสำหรับงานของ Gateway:

- `config.schema.lookup` สำหรับ subtree ของคอนฟิกแบบจำกัด path หนึ่งชุดก่อนแก้ไข
- `config.get` สำหรับ snapshot + hash ของคอนฟิกปัจจุบัน
- `config.patch` สำหรับอัปเดตคอนฟิกบางส่วนพร้อมรีสตาร์ต
- `config.apply` ใช้เฉพาะสำหรับการแทนที่คอนฟิกทั้งชุด
- `update.run` สำหรับ self-update + restart แบบชัดเจน

สำหรับการเปลี่ยนบางส่วน ให้ใช้ `config.schema.lookup` แล้วตามด้วย `config.patch`
ใช้ `config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่คอนฟิกทั้งหมด
tool นี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security`;
alias แบบเดิม `tools.bash.*` จะถูก normalize ไปยัง path exec ที่ได้รับการปกป้องแบบเดียวกัน

### Tools ที่ plugin จัดให้

plugin สามารถลงทะเบียน tool เพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON-only สำหรับผลลัพธ์ที่มีโครงสร้าง
- [Lobster](/th/tools/lobster) — รันไทม์เวิร์กโฟลว์แบบมีชนิดข้อมูลพร้อม approval ที่ทำต่อได้
- [Music Generation](/th/tools/music-generation) — tool `music_generate` แบบใช้ร่วมกันกับผู้ให้บริการที่ขับเคลื่อนด้วยเวิร์กโฟลว์
- [OpenProse](/th/prose) — การประสานงานเวิร์กโฟลว์แบบ markdown-first
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์ tool `exec` และ `bash` ที่มีข้อมูลรบกวนมาก

## การกำหนดค่า Tools

### Allowlist และ deny list

ควบคุมว่าเอเจนต์สามารถเรียกใช้ tool ใดได้ผ่าน `tools.allow` / `tools.deny` ใน
คอนฟิก โดย deny จะมีลำดับความสำคัญเหนือ allow เสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### โปรไฟล์ Tools

`tools.profile` จะตั้งค่า allowlist พื้นฐานก่อนนำ `allow`/`deny` มาใช้
การแทนที่รายเอเจนต์: `agents.list[].tools.profile`

| Profile     | สิ่งที่รวมไว้                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | ไม่จำกัด (เหมือนกับไม่ได้ตั้งค่า)                                                                                                                |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` เท่านั้น                                                                                                                          |

โปรไฟล์ `coding` และ `messaging` ยังอนุญาต MCP tool ของ bundle ที่กำหนดค่าไว้
ภายใต้คีย์ plugin `bundle-mcp` ด้วย เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์ยังคงมี tool ในตัวตามปกติ แต่ซ่อน MCP tool ที่กำหนดค่าไว้ทั้งหมด
โปรไฟล์ `minimal` จะไม่รวม MCP tool ของ bundle

### กลุ่ม Tools

ใช้รูปแบบย่อ `group:*` ใน allow/deny list:

| Group              | Tools                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` ยอมรับเป็น alias ของ `exec`)                                       |
| `group:fs`         | read, write, edit, apply_patch                                                                           |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                |
| `group:web`        | web_search, x_search, web_fetch                                                                          |
| `group:ui`         | browser, canvas                                                                                          |
| `group:automation` | cron, gateway                                                                                            |
| `group:messaging`  | message                                                                                                  |
| `group:nodes`      | nodes                                                                                                    |
| `group:agents`     | agents_list                                                                                              |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                               |
| `group:openclaw`   | Tools ในตัวของ OpenClaw ทั้งหมด (ไม่รวม tool จาก plugin)                                                |

`sessions_history` จะคืนมุมมองการเรียกคืนที่ถูกจำกัดขนาดและกรองด้านความปลอดภัย มันจะ strip
แท็ก thinking, scaffolding ของ `<relevant-memories>`, payload XML ของ tool-call
แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัด),
scaffolding ของ tool-call ที่ถูกลดระดับ, token ควบคุมโมเดลแบบ ASCII/full-width ที่รั่วออกมา
และ XML ของ tool-call MiniMax ที่ผิดรูปแบบออกจากข้อความของ assistant จากนั้นจึงใช้
การปกปิด/ตัดทอน และ placeholder สำหรับแถวที่ใหญ่เกินไปตามความเหมาะสม แทนการทำหน้าที่
เป็น raw transcript dump

### ข้อจำกัดเฉพาะผู้ให้บริการ

ใช้ `tools.byProvider` เพื่อจำกัด tool สำหรับผู้ให้บริการเฉพาะรายโดยไม่
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
