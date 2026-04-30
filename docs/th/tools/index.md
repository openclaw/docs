---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มีเครื่องมืออะไรให้บ้าง
    - คุณต้องกำหนดค่า อนุญาต หรือปฏิเสธเครื่องมือ
    - คุณกำลังตัดสินใจเลือกระหว่างเครื่องมือในตัว, Skills และ Plugin
summary: 'ภาพรวมเครื่องมือและ Plugin ของ OpenClaw: เอเจนต์ทำอะไรได้บ้างและวิธีขยายความสามารถ'
title: เครื่องมือและ Plugin
x-i18n:
    generated_at: "2026-04-30T16:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

ทุกสิ่งที่เอเจนต์ทำนอกเหนือจากการสร้างข้อความเกิดขึ้นผ่าน **เครื่องมือ**
เครื่องมือคือวิธีที่เอเจนต์อ่านไฟล์ เรียกใช้คำสั่ง ท่องเว็บ ส่งข้อความ และโต้ตอบกับอุปกรณ์

## เครื่องมือ, Skills และ Plugin

OpenClaw มีสามชั้นที่ทำงานร่วมกัน:

<Steps>
  <Step title="เครื่องมือคือสิ่งที่เอเจนต์เรียกใช้">
    เครื่องมือคือฟังก์ชันที่มีชนิดกำกับซึ่งเอเจนต์สามารถเรียกใช้ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อมชุด **เครื่องมือในตัว** และ
    Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้

    เอเจนต์มองเห็นเครื่องมือเป็นนิยามฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง model API

  </Step>

  <Step title="Skills สอนเอเจนต์ว่าเมื่อใดและอย่างไร">
    Skill คือไฟล์ markdown (`SKILL.md`) ที่ถูกฉีดเข้าไปใน system prompt
    Skills ให้บริบท ข้อจำกัด และคำแนะนำทีละขั้นตอนแก่เอเจนต์สำหรับ
    การใช้เครื่องมืออย่างมีประสิทธิภาพ Skills อยู่ใน workspace ของคุณ ในโฟลเดอร์ที่ใช้ร่วมกัน
    หรือมาพร้อมภายใน Plugin

    [อ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugin รวมทุกอย่างเข้าด้วยกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนความสามารถชุดใดก็ได้:
    channels, model providers, tools, skills, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, web search และอื่นๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ
    OpenClaw) ส่วนตัวอื่นเป็น **external** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## เครื่องมือในตัว

เครื่องมือเหล่านี้มาพร้อมกับ OpenClaw และพร้อมใช้งานโดยไม่ต้องติดตั้ง Plugin ใดๆ:

| เครื่องมือ                                  | สิ่งที่ทำ                                                             | หน้า                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | เรียกใช้คำสั่ง shell จัดการกระบวนการเบื้องหลัง                       | [Exec](/th/tools/exec), [การอนุมัติ Exec](/th/tools/exec-approvals) |
| `code_execution`                           | เรียกใช้การวิเคราะห์ Python ระยะไกลแบบ sandboxed                     | [การเรียกใช้โค้ด](/th/tools/code-execution)                      |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (นำทาง คลิก ภาพหน้าจอ)                    | [เบราว์เซอร์](/th/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ ค้นหาโพสต์ X ดึงเนื้อหาหน้าเว็บ                            | [เว็บ](/th/tools/web), [Web Fetch](/th/tools/web-fetch)             |
| `read` / `write` / `edit`                  | File I/O ใน workspace                                                 |                                                              |
| `apply_patch`                              | แพตช์ไฟล์หลาย hunk                                                    | [Apply Patch](/th/tools/apply-patch)                            |
| `message`                                  | ส่งข้อความข้ามทุก channels                                            | [ส่งโดยเอเจนต์](/th/tools/agent-send)                              |
| `canvas`                                   | ขับเคลื่อน node Canvas (present, eval, snapshot)                      |                                                              |
| `nodes`                                    | ค้นพบและกำหนดเป้าหมายอุปกรณ์ที่จับคู่แล้ว                            |                                                              |
| `cron` / `gateway`                         | จัดการงานตามกำหนดเวลา; ตรวจสอบ แพตช์ รีสตาร์ต หรืออัปเดต Gateway     |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างรูปภาพ                                             | [การสร้างรูปภาพ](/th/tools/image-generation)                  |
| `music_generate`                           | สร้างแทร็กเพลง                                                        | [การสร้างเพลง](/th/tools/music-generation)                  |
| `video_generate`                           | สร้างวิดีโอ                                                           | [การสร้างวิดีโอ](/th/tools/video-generation)                  |
| `tts`                                      | แปลงข้อความเป็นเสียงแบบครั้งเดียว                                    | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน สถานะ และการประสานงาน sub-agent                      | [Sub-agents](/th/tools/subagents)                               |
| `session_status`                           | การอ่านกลับแบบเบาในสไตล์ `/status` และการ override โมเดลของเซสชัน    | [เครื่องมือเซสชัน](/th/concepts/session-tool)                      |

สำหรับงานรูปภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายเป็น `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการรูปภาพที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานเพลง ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมายเป็น `google/*`, `minimax/*` หรือผู้ให้บริการเพลงที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมายเป็น `qwen/*` หรือผู้ให้บริการวิดีโอที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงที่ขับเคลื่อนด้วย workflow ให้ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนไว้ สิ่งนี้แยกจาก `tts` ซึ่งเป็น text-to-speech

`session_status` คือเครื่องมือสถานะ/อ่านกลับแบบเบาในกลุ่ม sessions
มันตอบคำถามสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่า per-session model override ได้ตามต้องการ; `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` มันสามารถเติมย้อนหลังตัวนับ token/cache ที่เบาบาง และป้ายกำกับโมเดล runtime ที่ใช้งานอยู่จากรายการ usage ของ transcript ล่าสุด

`gateway` คือเครื่องมือ runtime สำหรับเจ้าของเท่านั้นสำหรับการดำเนินการ Gateway:

- `config.schema.lookup` สำหรับ config subtree ที่จำกัดขอบเขตตาม path หนึ่งรายการก่อนแก้ไข
- `config.get` สำหรับ snapshot config ปัจจุบัน + hash
- `config.patch` สำหรับการอัปเดต config บางส่วนพร้อมรีสตาร์ต
- `config.apply` สำหรับการแทนที่ full-config เท่านั้น
- `update.run` สำหรับ self-update + restart แบบระบุชัดเจน

สำหรับการเปลี่ยนแปลงบางส่วน ให้ใช้ `config.schema.lookup` แล้วตามด้วย `config.patch` หากต้องการใช้
`config.apply` ให้ใช้เฉพาะเมื่อคุณตั้งใจแทนที่ config ทั้งหมด
สำหรับเอกสาร config ที่กว้างขึ้น ให้อ่าน [การกำหนดค่า](/th/gateway/configuration) และ
[อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เครื่องมือนี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security`;
alias เดิม `tools.bash.*` จะ normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน

### เครื่องมือที่ Plugin จัดเตรียมให้

Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON-only สำหรับ output ที่มีโครงสร้าง
- [Lobster](/th/tools/lobster) — runtime ของ workflow แบบมีชนิดกำกับพร้อมการอนุมัติที่กลับมาทำต่อได้
- [การสร้างเพลง](/th/tools/music-generation) — เครื่องมือ `music_generate` ที่ใช้ร่วมกันพร้อมผู้ให้บริการที่รองรับด้วย workflow
- [OpenProse](/th/prose) — การประสานงาน workflow ที่ยึด markdown เป็นหลัก
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์เครื่องมือ `exec` และ `bash` ที่มีสัญญาณรบกวนให้กะทัดรัด

## การกำหนดค่าเครื่องมือ

### รายการอนุญาตและรายการปฏิเสธ

ควบคุมว่าเอเจนต์สามารถเรียกใช้เครื่องมือใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config รายการปฏิเสธมีสิทธิ์เหนือรายการอนุญาตเสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw จะ fail closed เมื่อ allowlist ที่ระบุชัดเจนไม่ resolve เป็นเครื่องมือที่เรียกใช้ได้
ตัวอย่างเช่น `tools.allow: ["query_db"]` จะทำงานก็ต่อเมื่อ Plugin ที่โหลดอยู่
ลงทะเบียน `query_db` จริงๆ หากไม่มีเครื่องมือในตัว, Plugin หรือ bundled MCP tool ใดตรงกับ
allowlist การรันจะหยุดก่อนการเรียกโมเดล แทนที่จะดำเนินต่อเป็นการรันแบบ
text-only ที่อาจ hallucinate ผลลัพธ์เครื่องมือได้

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อนนำ `allow`/`deny` ไปใช้
การ override รายเอเจนต์: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น; เหมือนกับการปล่อย `tools.profile` ไม่ได้ตั้งค่า                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | เฉพาะ `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` แคบโดยตั้งใจสำหรับเอเจนต์ที่เน้น channel
มันละเครื่องมือ command/control ที่กว้างกว่า เช่น filesystem, runtime,
browser, canvas, nodes, cron และการควบคุม Gateway ออกไป ใช้ `tools.profile: "full"`
เป็น baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น จากนั้นตัดแต่ง
การเข้าถึงด้วย `tools.allow` / `tools.deny` เมื่อจำเป็น
</Note>

`coding` รวมเครื่องมือเว็บแบบเบา (`web_search`, `web_fetch`, `x_search`)
แต่ไม่รวมเครื่องมือควบคุมเบราว์เซอร์เต็มรูปแบบ การทำ browser automation สามารถควบคุม
เซสชันจริงและโปรไฟล์ที่เข้าสู่ระบบไว้แล้วได้ ดังนั้นให้เพิ่มอย่างชัดเจนด้วย
`tools.alsoAllow: ["browser"]` หรือแบบรายเอเจนต์
`agents.list[].tools.alsoAllow: ["browser"]`

<Note>
การกำหนดค่า `tools.exec` หรือ `tools.fs` ภายใต้โปรไฟล์ที่จำกัด (`messaging`, `minimal`) ไม่ได้ขยาย allowlist ของโปรไฟล์โดยอัตโนมัติ เพิ่มรายการ `tools.alsoAllow` อย่างชัดเจน (เช่น `["exec", "process"]` สำหรับ exec หรือ `["read", "write", "edit"]` สำหรับ fs) เมื่อคุณต้องการให้โปรไฟล์ที่จำกัดใช้ส่วนที่กำหนดค่าเหล่านั้น OpenClaw จะบันทึก startup warning เมื่อมีส่วน config อยู่โดยไม่มี grant `alsoAllow` ที่ตรงกัน
</Note>

โปรไฟล์ `coding` และ `messaging` ยังอนุญาต bundle MCP tools ที่กำหนดค่าไว้
ภายใต้คีย์ Plugin `bundle-mcp` เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คงเครื่องมือในตัวตามปกติไว้ แต่ซ่อน MCP tools ที่กำหนดค่าไว้ทั้งหมด
โปรไฟล์ `minimal` ไม่รวม bundle MCP tools

ตัวอย่าง (พื้นผิวเครื่องมือกว้างที่สุดตามค่าเริ่มต้น):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### กลุ่มเครื่องมือ

ใช้ตัวย่อ `group:*` ในรายการ allow/deny:

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
| `group:openclaw`   | เครื่องมือในตัวทั้งหมดของ OpenClaw (ไม่รวมเครื่องมือ Plugin)                                                       |

`sessions_history` จะส่งคืนมุมมองการเรียกคืนแบบมีขอบเขตและผ่านการกรองด้านความปลอดภัย โดยจะลบ
แท็กความคิด, โครงประกอบ `<relevant-memories>`, เพย์โหลด XML การเรียกเครื่องมือแบบข้อความล้วน
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน),
โครงประกอบการเรียกเครื่องมือที่ถูกลดระดับ, โทเค็นควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วไหล,
และ XML การเรียกเครื่องมือของ MiniMax ที่ผิดรูปแบบจากข้อความของผู้ช่วย จากนั้นจึงใช้
การปกปิด/ตัดทอน และอาจใช้ตัวยึดตำแหน่งสำหรับแถวที่ใหญ่เกินไป แทนการทำหน้าที่
เป็นการดัมป์ทรานสคริปต์ดิบ

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
