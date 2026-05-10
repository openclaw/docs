---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มีเครื่องมือใดให้ใช้บ้าง
    - คุณต้องกำหนดค่า อนุญาต หรือปฏิเสธเครื่องมือ
    - คุณกำลังตัดสินใจเลือกระหว่างเครื่องมือในตัว Skills และ Plugin
summary: 'ภาพรวมเครื่องมือและ Plugin ของ OpenClaw: เอเจนต์ทำอะไรได้บ้างและวิธีขยายความสามารถ'
title: เครื่องมือและ Plugin
x-i18n:
    generated_at: "2026-05-10T20:00:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

ทุกสิ่งที่เอเจนต์ทำนอกเหนือจากการสร้างข้อความเกิดขึ้นผ่าน **เครื่องมือ**
เครื่องมือคือวิธีที่เอเจนต์ใช้อ่านไฟล์ รันคำสั่ง ท่องเว็บ ส่งข้อความ
และโต้ตอบกับอุปกรณ์

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
    Skills ให้บริบท ข้อจำกัด และคำแนะนำทีละขั้นตอนแก่เอเจนต์สำหรับ
    การใช้เครื่องมืออย่างมีประสิทธิภาพ Skills อยู่ในเวิร์กสเปซของคุณ ในโฟลเดอร์ที่แชร์
    หรือมาพร้อมภายใน Plugin

    [อ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugin รวมทุกอย่างไว้ด้วยกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนความสามารถต่าง ๆ ได้ทุกแบบ:
    ช่องทาง, ผู้ให้บริการโมเดล, เครื่องมือ, Skills, เสียงพูด, การถอดเสียงแบบเรียลไทม์,
    เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ,
    web fetch, web search และอื่น ๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ
    OpenClaw) ส่วนตัวอื่นเป็น **ภายนอก** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## เครื่องมือในตัว

เครื่องมือเหล่านี้มาพร้อมกับ OpenClaw และพร้อมใช้งานโดยไม่ต้องติดตั้ง Plugin ใด ๆ:

| เครื่องมือ                                  | ทำอะไร                                                               | หน้า                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | รันคำสั่ง shell, จัดการโปรเซสเบื้องหลัง                              | [Exec](/th/tools/exec), [การอนุมัติ Exec](/th/tools/exec-approvals) |
| `code_execution`                           | รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed                           | [การรันโค้ด](/th/tools/code-execution)                         |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (นำทาง, คลิก, ถ่ายภาพหน้าจอ)              | [เบราว์เซอร์](/th/tools/browser)                               |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ, ค้นหาโพสต์ X, ดึงเนื้อหาหน้าเว็บ                          | [เว็บ](/th/tools/web), [Web Fetch](/th/tools/web-fetch)            |
| `read` / `write` / `edit`                  | File I/O ในเวิร์กสเปซ                                                 |                                                              |
| `apply_patch`                              | แพตช์ไฟล์หลาย hunk                                                    | [Apply Patch](/th/tools/apply-patch)                           |
| `message`                                  | ส่งข้อความข้ามทุกช่องทาง                                             | [Agent Send](/th/tools/agent-send)                             |
| `nodes`                                    | ค้นหาและกำหนดเป้าหมายอุปกรณ์ที่จับคู่ไว้                             |                                                              |
| `cron` / `gateway`                         | จัดการงานตามกำหนดเวลา; ตรวจสอบ, แพตช์, รีสตาร์ต หรืออัปเดต Gateway |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างภาพ                                                | [การสร้างภาพ](/th/tools/image-generation)                      |
| `music_generate`                           | สร้างแทร็กเพลง                                                       | [การสร้างเพลง](/th/tools/music-generation)                     |
| `video_generate`                           | สร้างวิดีโอ                                                          | [การสร้างวิดีโอ](/th/tools/video-generation)                   |
| `tts`                                      | แปลงข้อความเป็นเสียงแบบครั้งเดียว                                    | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน, สถานะ และการประสานงานเอเจนต์ย่อย                   | [เอเจนต์ย่อย](/th/tools/subagents)                             |
| `session_status`                           | การอ่านกลับแบบเบาสไตล์ `/status` และการแทนที่โมเดลของเซสชัน         | [เครื่องมือเซสชัน](/th/concepts/session-tool)                  |

สำหรับงานภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายเป็น `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการภาพอื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานเพลง ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมายเป็น `google/*`, `minimax/*` หรือผู้ให้บริการเพลงอื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมายเป็น `qwen/*` หรือผู้ให้บริการวิดีโออื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงที่ขับเคลื่อนด้วยเวิร์กโฟลว์ ให้ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนไว้ สิ่งนี้แยกจาก `tts` ซึ่งเป็นการแปลงข้อความเป็นเสียง

`session_status` คือเครื่องมือสถานะ/อ่านกลับแบบเบาในกลุ่มเซสชัน
มันตอบคำถามสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่าการแทนที่โมเดลรายเซสชันได้ด้วย; `model=default` จะล้าง
การแทนที่นั้น เช่นเดียวกับ `/status` มันสามารถเติมค่าย้อนหลังให้ตัวนับ token/cache ที่มีข้อมูลน้อย และป้ายกำกับโมเดล runtime ที่ใช้งานอยู่จากรายการ usage ล่าสุดใน transcript

`gateway` คือเครื่องมือ runtime เฉพาะเจ้าของสำหรับการดำเนินการของ Gateway:

- `config.schema.lookup` สำหรับ config subtree ที่จำกัดขอบเขตด้วย path หนึ่งรายการก่อนแก้ไข
- `config.get` สำหรับสแนปช็อต config ปัจจุบัน + hash
- `config.patch` สำหรับการอัปเดต config บางส่วนพร้อมรีสตาร์ต
- `config.apply` สำหรับการแทนที่ config ทั้งหมดเท่านั้น
- `update.run` สำหรับ self-update + รีสตาร์ตอย่างชัดเจน

สำหรับการเปลี่ยนแปลงบางส่วน ให้ใช้ `config.schema.lookup` แล้วตามด้วย `config.patch` ใช้
`config.apply` เฉพาะเมื่อคุณตั้งใจจะแทนที่ config ทั้งหมด
สำหรับเอกสาร config ที่กว้างขึ้น อ่าน [การกำหนดค่า](/th/gateway/configuration) และ
[อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เครื่องมือนี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security`;
alias ดั้งเดิม `tools.bash.*` จะ normalize ไปยัง exec paths ที่ได้รับการป้องกันเดียวกัน

### เครื่องมือที่ Plugin จัดหาให้

Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Canvas](/th/plugins/reference/canvas) — Plugin แบบ bundled เชิงทดลองสำหรับการควบคุม node Canvas และการเรนเดอร์ A2UI
- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON เท่านั้นสำหรับเอาต์พุตแบบมีโครงสร้าง
- [Lobster](/th/tools/lobster) — runtime เวิร์กโฟลว์แบบมีชนิดพร้อมการอนุมัติที่กลับมาทำต่อได้
- [การสร้างเพลง](/th/tools/music-generation) — เครื่องมือ `music_generate` ที่ใช้ร่วมกันพร้อมผู้ให้บริการที่รองรับด้วยเวิร์กโฟลว์
- [OpenProse](/th/prose) — การประสานเวิร์กโฟลว์ที่ยึด markdown เป็นหลัก
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์เครื่องมือ `exec` และ `bash` ที่มีสัญญาณรบกวน

เครื่องมือ Plugin ยังเขียนด้วย `api.registerTool(...)` และประกาศใน
รายการ `contracts.tools` ของ manifest ของ Plugin OpenClaw จะจับ tool descriptor ที่ผ่านการตรวจสอบแล้ว
ระหว่าง discovery และแคชตามแหล่งที่มาของ Plugin และ contract ดังนั้น
การวางแผนเครื่องมือภายหลังจึงสามารถข้ามการโหลด runtime ของ Plugin ได้ การรันเครื่องมือยังคงโหลด
Plugin เจ้าของและเรียก implementation ที่ลงทะเบียนแบบ live

[การค้นหาเครื่องมือ](/th/tools/tool-search) คือพื้นผิวแบบกะทัดรัด
สำหรับแค็ตตาล็อกขนาดใหญ่ แทนที่จะใส่ schema ของเครื่องมือ OpenClaw, MCP หรือ client ทุกตัว
ลงใน prompt, OpenClaw สามารถให้ runtime Node แบบแยกแก่โมเดล
พร้อม `openclaw.tools.search`, `openclaw.tools.describe` และ
`openclaw.tools.call` การเรียกยังคงไหลกลับผ่าน Gateway ดังนั้นนโยบายเครื่องมือ,
การอนุมัติ, hooks และบันทึกเซสชันยังคงเป็นแหล่งอ้างอิงหลัก

## การกำหนดค่าเครื่องมือ

### รายการอนุญาตและรายการปฏิเสธ

ควบคุมว่าเอเจนต์สามารถเรียกเครื่องมือใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config รายการปฏิเสธมีผลเหนือกว่ารายการอนุญาตเสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw จะ fail closed เมื่อ allowlist ที่ระบุชัดเจน resolve แล้วไม่มีเครื่องมือที่เรียกได้
ตัวอย่างเช่น `tools.allow: ["query_db"]` จะทำงานเฉพาะเมื่อ Plugin ที่โหลดอยู่ลงทะเบียน
`query_db` จริง ๆ หากไม่มีเครื่องมือในตัว, Plugin หรือเครื่องมือ MCP แบบ bundled ใดตรงกับ
allowlist การรันจะหยุดก่อนการเรียกโมเดล แทนที่จะดำเนินต่อเป็นการรันแบบ
ข้อความเท่านั้นที่อาจหลอนผลลัพธ์เครื่องมือขึ้นมา

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อนนำ `allow`/`deny` ไปใช้
การแทนที่รายเอเจนต์: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | เครื่องมือ core และ Plugin เสริมทั้งหมด; baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | เฉพาะ `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` จงใจให้แคบสำหรับเอเจนต์ที่เน้นช่องทาง
มันไม่รวมเครื่องมือ command/control ที่กว้างกว่า เช่น filesystem, runtime,
browser, canvas, nodes, cron และการควบคุม Gateway ใช้ `tools.profile: "full"`
เป็น baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น แล้วจึงลด
การเข้าถึงด้วย `tools.allow` / `tools.deny` เมื่อจำเป็น
</Note>

`coding` รวมเครื่องมือเว็บแบบเบา (`web_search`, `web_fetch`, `x_search`)
แต่ไม่รวมเครื่องมือควบคุมเบราว์เซอร์เต็มรูปแบบ ระบบอัตโนมัติของเบราว์เซอร์สามารถขับเคลื่อน
เซสชันจริงและโปรไฟล์ที่ล็อกอินไว้ได้ ดังนั้นให้เพิ่มอย่างชัดเจนด้วย
`tools.alsoAllow: ["browser"]` หรือรายเอเจนต์
`agents.list[].tools.alsoAllow: ["browser"]`

<Note>
การกำหนดค่า `tools.exec` หรือ `tools.fs` ภายใต้โปรไฟล์แบบจำกัด (`messaging`, `minimal`) จะไม่ขยาย allowlist ของโปรไฟล์โดยนัย เพิ่มรายการ `tools.alsoAllow` อย่างชัดเจน (เช่น `["exec", "process"]` สำหรับ exec หรือ `["read", "write", "edit"]` สำหรับ fs) เมื่อคุณต้องการให้โปรไฟล์แบบจำกัดใช้ส่วนที่กำหนดค่าเหล่านั้น OpenClaw จะบันทึกคำเตือนตอนเริ่มต้นเมื่อมีส่วน config อยู่โดยไม่มี grant `alsoAllow` ที่ตรงกัน
</Note>

โปรไฟล์ `coding` และ `messaging` ยังอนุญาตเครื่องมือ bundle MCP ที่กำหนดค่าไว้
ภายใต้คีย์ Plugin `bundle-mcp` เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คงเครื่องมือในตัวตามปกติ แต่ซ่อนเครื่องมือ MCP ที่กำหนดค่าไว้ทั้งหมด
โปรไฟล์ `minimal` ไม่รวมเครื่องมือ bundle MCP

ตัวอย่าง (พื้นผิวเครื่องมือที่กว้างที่สุดโดยค่าเริ่มต้น):

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
| `group:runtime`    | exec, process, code_execution (`bash` ใช้ได้ในฐานะนามแฝงของ `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas เมื่อเปิดใช้งาน Plugin Canvas ที่รวมมาให้                                                 |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | เครื่องมือ OpenClaw ในตัวทั้งหมด (ไม่รวมเครื่องมือ Plugin)                                                       |

`sessions_history` ส่งคืนมุมมองการเรียกคืนที่มีขอบเขตและผ่านการกรองด้านความปลอดภัยแล้ว โดยจะลบ
แท็กการคิด โครงประกอบ `<relevant-memories>` เพย์โหลด XML
การเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน),
โครงประกอบการเรียกเครื่องมือที่ถูกลดระดับ โทเค็นควบคุมโมเดลแบบ ASCII/เต็มความกว้าง
ที่รั่วไหล และ XML การเรียกเครื่องมือ MiniMax ที่มีรูปแบบผิดจากข้อความของผู้ช่วย จากนั้นจึงใช้
การปกปิด/ตัดทอน และอาจใช้ตัวแทนแถวที่มีขนาดใหญ่เกินไป แทนที่จะทำงาน
เหมือนการดัมพ์ทรานสคริปต์ดิบ

### ข้อจำกัดเฉพาะผู้ให้บริการ

ใช้ `tools.byProvider` เพื่อจำกัดเครื่องมือสำหรับผู้ให้บริการบางรายโดยไม่
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
