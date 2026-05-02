---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มีเครื่องมืออะไรให้ใช้บ้าง
    - คุณต้องกำหนดค่า อนุญาต หรือปฏิเสธเครื่องมือ
    - คุณกำลังตัดสินใจเลือกระหว่างเครื่องมือในตัว, Skills และ Plugin
summary: 'ภาพรวมเครื่องมือและ Plugin ของ OpenClaw: สิ่งที่เอเจนต์ทำได้และวิธีขยายความสามารถของเอเจนต์'
title: เครื่องมือและ Plugin
x-i18n:
    generated_at: "2026-05-02T21:00:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

ทุกอย่างที่เอเจนต์ทำนอกเหนือจากการสร้างข้อความจะเกิดขึ้นผ่าน **เครื่องมือ**
เครื่องมือคือวิธีที่เอเจนต์ใช้อ่านไฟล์ รันคำสั่ง เรียกดูเว็บ ส่ง
ข้อความ และโต้ตอบกับอุปกรณ์

## เครื่องมือ, Skills และ Plugin

OpenClaw มีสามชั้นที่ทำงานร่วมกัน:

<Steps>
  <Step title="เครื่องมือคือสิ่งที่เอเจนต์เรียกใช้">
    เครื่องมือคือฟังก์ชันแบบมีชนิดที่เอเจนต์สามารถเรียกใช้ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อมชุด **เครื่องมือในตัว** และ
    Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้

    เอเจนต์มองเห็นเครื่องมือเป็นนิยามฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง model API

  </Step>

  <Step title="Skills สอนเอเจนต์ว่าเมื่อใดและอย่างไร">
    Skill คือไฟล์ markdown (`SKILL.md`) ที่ถูกฉีดเข้าไปใน system prompt
    Skills ให้บริบท ข้อจำกัด และคำแนะนำแบบทีละขั้นตอนแก่เอเจนต์สำหรับ
    การใช้เครื่องมืออย่างมีประสิทธิภาพ Skills อยู่ใน workspace ของคุณ ในโฟลเดอร์ที่ใช้ร่วมกัน
    หรือมาพร้อมภายใน Plugin

    [Skills reference](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugin รวมทุกอย่างไว้ด้วยกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนความสามารถแบบใดก็ได้ผสมกัน:
    channels, model providers, เครื่องมือ, Skills, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, web search และอื่นๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ
    OpenClaw) ส่วนตัวอื่นเป็น **external** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## เครื่องมือในตัว

เครื่องมือเหล่านี้มาพร้อมกับ OpenClaw และพร้อมใช้งานโดยไม่ต้องติดตั้ง Plugin ใดๆ:

| เครื่องมือ                                  | สิ่งที่ทำ                                                              | หน้า                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | รันคำสั่ง shell, จัดการ background processes                          | [Exec](/th/tools/exec), [Exec Approvals](/th/tools/exec-approvals) |
| `code_execution`                           | รันการวิเคราะห์ Python ระยะไกลใน sandbox                              | [Code Execution](/th/tools/code-execution)                      |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (navigate, click, screenshot)              | [Browser](/th/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ, ค้นหาโพสต์ X, ดึงเนื้อหาหน้าเว็บ                           | [Web](/th/tools/web), [Web Fetch](/th/tools/web-fetch)             |
| `read` / `write` / `edit`                  | File I/O ใน workspace                                                  |                                                              |
| `apply_patch`                              | แพตช์ไฟล์แบบหลาย hunk                                                  | [Apply Patch](/th/tools/apply-patch)                            |
| `message`                                  | ส่งข้อความข้ามทุก channel                                              | [Agent Send](/th/tools/agent-send)                              |
| `canvas`                                   | ขับเคลื่อน node Canvas (present, eval, snapshot)                       |                                                              |
| `nodes`                                    | ค้นพบและกำหนดเป้าหมายอุปกรณ์ที่จับคู่ไว้                              |                                                              |
| `cron` / `gateway`                         | จัดการงานตามกำหนดเวลา; ตรวจสอบ, patch, restart หรือ update gateway    |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างรูปภาพ                                               | [Image Generation](/th/tools/image-generation)                  |
| `music_generate`                           | สร้างแทร็กเพลง                                                         | [Music Generation](/th/tools/music-generation)                  |
| `video_generate`                           | สร้างวิดีโอ                                                            | [Video Generation](/th/tools/video-generation)                  |
| `tts`                                      | แปลงข้อความเป็นเสียงแบบครั้งเดียว                                      | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการ session, สถานะ และการประสานงาน sub-agent                    | [Sub-agents](/th/tools/subagents)                               |
| `session_status`                           | การอ่านกลับแบบเบาในสไตล์ `/status` และการ override โมเดลของ session   | [Session Tools](/th/concepts/session-tool)                      |

สำหรับงานรูปภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายเป็น `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการรูปภาพที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานเพลง ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมายเป็น `google/*`, `minimax/*` หรือผู้ให้บริการเพลงที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมายเป็น `qwen/*` หรือผู้ให้บริการวิดีโอที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงที่ขับเคลื่อนด้วย workflow ให้ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนไว้ สิ่งนี้แยกจาก `tts` ซึ่งเป็น text-to-speech

`session_status` คือเครื่องมือสถานะ/อ่านกลับแบบเบาในกลุ่ม sessions
เครื่องมือนี้ตอบคำถามสไตล์ `/status` เกี่ยวกับ session ปัจจุบัน และสามารถ
ตั้งค่า per-session model override ได้ตามต้องการ; `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` เครื่องมือนี้สามารถเติมกลับตัวนับ token/cache ที่มีข้อมูลเบาบาง และ
ป้ายกำกับโมเดล runtime ที่ใช้งานอยู่จากรายการการใช้งาน transcript ล่าสุด

`gateway` คือเครื่องมือ runtime สำหรับเจ้าของเท่านั้นสำหรับการดำเนินงาน gateway:

- `config.schema.lookup` สำหรับ config subtree ที่จำกัดตาม path หนึ่งรายการก่อนแก้ไข
- `config.get` สำหรับ snapshot + hash ของ config ปัจจุบัน
- `config.patch` สำหรับการอัปเดต config บางส่วนพร้อม restart
- `config.apply` เฉพาะสำหรับการแทนที่ config ทั้งหมด
- `update.run` สำหรับ self-update + restart แบบชัดเจน

สำหรับการเปลี่ยนแปลงบางส่วน ให้ใช้ `config.schema.lookup` แล้วจึง `config.patch` ใช้
`config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่ config ทั้งหมด
สำหรับเอกสาร config ที่กว้างขึ้น อ่าน [Configuration](/th/gateway/configuration) และ
[Configuration reference](/th/gateway/configuration-reference)
เครื่องมือนี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security`;
alias เดิม `tools.bash.*` จะ normalize เป็น exec paths ที่ได้รับการป้องกันเดียวกัน

### เครื่องมือที่ Plugin จัดหาให้

Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON เท่านั้นสำหรับผลลัพธ์แบบมีโครงสร้าง
- [Lobster](/th/tools/lobster) — runtime workflow แบบมีชนิดพร้อม approvals ที่ resume ได้
- [Music Generation](/th/tools/music-generation) — เครื่องมือ `music_generate` ที่ใช้ร่วมกันพร้อมผู้ให้บริการที่มี workflow รองรับ
- [OpenProse](/th/prose) — การประสานงาน workflow ที่ใช้ markdown เป็นหลัก
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์เครื่องมือ `exec` และ `bash` ที่มี noise

เครื่องมือของ Plugin ยังคงเขียนด้วย `api.registerTool(...)` และประกาศใน
รายการ `contracts.tools` ของ manifest ของ Plugin OpenClaw จะจับ
tool descriptor ที่ validate แล้วระหว่าง discovery และ cache ตามแหล่งที่มาของ Plugin และ contract เพื่อให้
การวางแผนเครื่องมือในภายหลังข้ามการโหลด runtime ของ Plugin ได้ การดำเนินการเครื่องมือยังคงโหลด
Plugin ที่เป็นเจ้าของและเรียก implementation ที่ลงทะเบียนจริง

## การกำหนดค่าเครื่องมือ

### รายการอนุญาตและปฏิเสธ

ควบคุมว่าเอเจนต์สามารถเรียกเครื่องมือใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config Deny ชนะ allow เสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw จะปิดแบบปลอดภัยเมื่อ allowlist ที่ระบุชัดเจนไม่ resolve เป็นเครื่องมือที่เรียกใช้ได้เลย
ตัวอย่างเช่น `tools.allow: ["query_db"]` จะทำงานก็ต่อเมื่อ Plugin ที่โหลดอยู่ลงทะเบียน
`query_db` จริงๆ หากไม่มีเครื่องมือในตัว, Plugin หรือเครื่องมือ MCP แบบ bundled ใดตรงกับ
allowlist การรันจะหยุดก่อนการเรียกโมเดล แทนที่จะดำเนินต่อเป็นการรันแบบ
text-only ที่อาจ hallucinate ผลลัพธ์เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อนนำ `allow`/`deny` ไปใช้
override รายเอเจนต์: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | baseline ไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น; เหมือนกับการปล่อย `tools.profile` ไว้ไม่ตั้งค่า                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | เฉพาะ `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` ตั้งใจให้แคบสำหรับเอเจนต์ที่เน้น channel
โดยละเว้นเครื่องมือ command/control ที่กว้างกว่า เช่น filesystem, runtime,
browser, canvas, nodes, cron และการควบคุม gateway ใช้ `tools.profile: "full"`
เป็น baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น จากนั้นค่อยตัด
การเข้าถึงด้วย `tools.allow` / `tools.deny` เมื่อต้องการ
</Note>

`coding` รวมเครื่องมือเว็บแบบเบา (`web_search`, `web_fetch`, `x_search`)
แต่ไม่รวมเครื่องมือควบคุมเบราว์เซอร์เต็มรูปแบบ Browser automation สามารถขับเคลื่อน
session จริงและโปรไฟล์ที่ล็อกอินอยู่ได้ ดังนั้นให้เพิ่มอย่างชัดเจนด้วย
`tools.alsoAllow: ["browser"]` หรือแบบรายเอเจนต์
`agents.list[].tools.alsoAllow: ["browser"]`

<Note>
การกำหนดค่า `tools.exec` หรือ `tools.fs` ภายใต้โปรไฟล์ที่จำกัด (`messaging`, `minimal`) จะไม่ขยาย allowlist ของโปรไฟล์นั้นโดยอัตโนมัติ เพิ่มรายการ `tools.alsoAllow` ที่ชัดเจน (เช่น `["exec", "process"]` สำหรับ exec หรือ `["read", "write", "edit"]` สำหรับ fs) เมื่อคุณต้องการให้โปรไฟล์ที่จำกัดใช้ส่วนที่กำหนดค่าเหล่านั้น OpenClaw จะบันทึกคำเตือนตอน startup เมื่อมีส่วน config อยู่โดยไม่มี grant `alsoAllow` ที่ตรงกัน
</Note>

โปรไฟล์ `coding` และ `messaging` ยังอนุญาตเครื่องมือ bundle MCP ที่กำหนดค่าไว้
ภายใต้ key ของ Plugin `bundle-mcp` เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คง built-ins ปกติไว้แต่ซ่อนเครื่องมือ MCP ที่กำหนดค่าไว้ทั้งหมด
โปรไฟล์ `minimal` ไม่รวมเครื่องมือ bundle MCP

ตัวอย่าง (พื้นผิวเครื่องมือกว้างที่สุดโดยค่าเริ่มต้น):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### กลุ่มเครื่องมือ

ใช้ shorthand `group:*` ในรายการ allow/deny:

| กลุ่ม              | เครื่องมือ                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` ยอมรับให้ใช้เป็นนามแฝงของ `exec`)                                 |
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
| `group:openclaw`   | เครื่องมือ OpenClaw ในตัวทั้งหมด (ไม่รวมเครื่องมือ Plugin)                                                       |

`sessions_history` ส่งคืนมุมมองการเรียกคืนที่มีขอบเขตและผ่านการกรองด้านความปลอดภัย โดยจะลบ
แท็กการคิด โครงร่าง `<relevant-memories>` เพย์โหลด XML ของการเรียกเครื่องมือแบบข้อความธรรมดา
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน),
โครงร่างการเรียกเครื่องมือที่ถูกลดระดับ โทเค็นควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วไหล
และ XML การเรียกเครื่องมือ MiniMax ที่ผิดรูปแบบจากข้อความของผู้ช่วย จากนั้นจึงใช้
การปกปิด/ตัดทอน และอาจใช้ตัวยึดตำแหน่งสำหรับแถวที่มีขนาดใหญ่เกินไปแทนการทำหน้าที่
เป็นการดัมพ์บันทึกบทสนทนาดิบ

### ข้อจำกัดเฉพาะผู้ให้บริการ

ใช้ `tools.byProvider` เพื่อจำกัดเครื่องมือสำหรับผู้ให้บริการเฉพาะโดยไม่
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
