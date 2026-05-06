---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มีเครื่องมืออะไรให้ใช้งานบ้าง
    - คุณต้องกำหนดค่า อนุญาต หรือปฏิเสธเครื่องมือ
    - คุณกำลังตัดสินใจเลือกระหว่างเครื่องมือในตัว, Skills และ Plugin
summary: 'ภาพรวมเครื่องมือและ Plugin ของ OpenClaw: สิ่งที่เอเจนต์ทำได้และวิธีขยายความสามารถของเอเจนต์'
title: เครื่องมือและ Plugin
x-i18n:
    generated_at: "2026-05-06T09:34:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 894f6dc7e840f3153e95696a63c470a200886af7d3dc8399e87446cf0fb1b027
    source_path: tools/index.md
    workflow: 16
---

ทุกสิ่งที่เอเจนต์ทำนอกเหนือจากการสร้างข้อความเกิดขึ้นผ่าน **เครื่องมือ**
เครื่องมือคือวิธีที่เอเจนต์อ่านไฟล์ เรียกใช้คำสั่ง ท่องเว็บ ส่งข้อความ
และโต้ตอบกับอุปกรณ์

## เครื่องมือ, Skills และ Plugin

OpenClaw มีสามเลเยอร์ที่ทำงานร่วมกัน:

<Steps>
  <Step title="เครื่องมือคือสิ่งที่เอเจนต์เรียกใช้">
    เครื่องมือคือฟังก์ชันแบบมีชนิดที่เอเจนต์สามารถเรียกใช้ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อมชุด **เครื่องมือในตัว** และ
    Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้

    เอเจนต์มองเห็นเครื่องมือเป็นคำจำกัดความฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง API ของโมเดล

  </Step>

  <Step title="Skills สอนเอเจนต์ว่าเมื่อใดและอย่างไร">
    Skill คือไฟล์ markdown (`SKILL.md`) ที่ถูกแทรกเข้าไปใน system prompt
    Skills ให้บริบท ข้อจำกัด และคำแนะนำแบบทีละขั้นตอนแก่เอเจนต์สำหรับ
    การใช้เครื่องมืออย่างมีประสิทธิภาพ Skills อยู่ในเวิร์กสเปซของคุณ ในโฟลเดอร์ที่ใช้ร่วมกัน
    หรือมาพร้อมภายใน Plugin

    [ข้อมูลอ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugin รวมทุกอย่างไว้ด้วยกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนความสามารถต่าง ๆ ได้ทุกแบบรวมกัน:
    ช่องทาง ผู้ให้บริการโมเดล เครื่องมือ Skills เสียง การถอดเสียงแบบเรียลไทม์
    เสียงพูดแบบเรียลไทม์ การทำความเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ
    การดึงข้อมูลเว็บ การค้นหาเว็บ และอื่น ๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ
    OpenClaw) ส่วนบางตัวเป็น **ภายนอก** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## เครื่องมือในตัว

เครื่องมือเหล่านี้มาพร้อมกับ OpenClaw และพร้อมใช้งานโดยไม่ต้องติดตั้ง Plugin ใด ๆ:

| เครื่องมือ                                  | สิ่งที่ทำ                                                              | หน้า                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | เรียกใช้คำสั่ง shell, จัดการกระบวนการเบื้องหลัง                       | [Exec](/th/tools/exec), [การอนุมัติ Exec](/th/tools/exec-approvals) |
| `code_execution`                           | เรียกใช้การวิเคราะห์ Python ระยะไกลใน sandbox                         | [การดำเนินการโค้ด](/th/tools/code-execution)                      |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (นำทาง คลิก จับภาพหน้าจอ)                 | [เบราว์เซอร์](/th/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ ค้นหาโพสต์ X ดึงเนื้อหาหน้าเว็บ                            | [เว็บ](/th/tools/web), [การดึงข้อมูลเว็บ](/th/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O ของไฟล์ในเวิร์กสเปซ                                             |                                                              |
| `apply_patch`                              | แพตช์ไฟล์หลาย hunk                                                   | [Apply Patch](/th/tools/apply-patch)                            |
| `message`                                  | ส่งข้อความข้ามทุกช่องทาง                                             | [ส่งเอเจนต์](/th/tools/agent-send)                              |
| `canvas`                                   | ขับเคลื่อน node Canvas (present, eval, snapshot)                      |                                                              |
| `nodes`                                    | ค้นหาและกำหนดเป้าหมายอุปกรณ์ที่จับคู่ไว้                              |                                                              |
| `cron` / `gateway`                         | จัดการงานที่ตั้งเวลาไว้; ตรวจสอบ แพตช์ รีสตาร์ต หรืออัปเดต Gateway |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างภาพ                                                | [การสร้างภาพ](/th/tools/image-generation)                  |
| `music_generate`                           | สร้างแทร็กเพลง                                                       | [การสร้างเพลง](/th/tools/music-generation)                  |
| `video_generate`                           | สร้างวิดีโอ                                                          | [การสร้างวิดีโอ](/th/tools/video-generation)                  |
| `tts`                                      | การแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว                              | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน สถานะ และการประสานงาน sub-agent                      | [Sub-agents](/th/tools/subagents)                               |
| `session_status`                           | การอ่านกลับแบบเบาของสไตล์ `/status` และการแทนที่โมเดลของเซสชัน       | [เครื่องมือเซสชัน](/th/concepts/session-tool)                      |

สำหรับงานภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมาย `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการภาพที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานเพลง ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมาย `google/*`, `minimax/*` หรือผู้ให้บริการเพลงที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมาย `qwen/*` หรือผู้ให้บริการวิดีโอที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงที่ขับเคลื่อนด้วยเวิร์กโฟลว์ ให้ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนเครื่องมือนี้ไว้ สิ่งนี้แยกจาก `tts` ซึ่งเป็นการแปลงข้อความเป็นเสียงพูด

`session_status` คือเครื่องมือสถานะ/อ่านกลับแบบเบาในกลุ่มเซสชัน
เครื่องมือนี้ตอบคำถามสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่าการแทนที่โมเดลรายเซสชันได้ตามต้องการ; `model=default` จะล้าง
การแทนที่นั้น เช่นเดียวกับ `/status` เครื่องมือนี้สามารถเติมตัวนับ token/cache ที่กระจัดกระจายย้อนหลัง และป้ายกำกับโมเดลรันไทม์ที่ใช้งานอยู่จากรายการ usage ของ transcript ล่าสุด

`gateway` คือเครื่องมือรันไทม์สำหรับเจ้าของเท่านั้นสำหรับการทำงานของ Gateway:

- `config.schema.lookup` สำหรับ subtree การกำหนดค่าที่มีขอบเขตตาม path หนึ่งรายการก่อนแก้ไข
- `config.get` สำหรับ snapshot การกำหนดค่าปัจจุบัน + hash
- `config.patch` สำหรับการอัปเดตการกำหนดค่าบางส่วนพร้อมรีสตาร์ต
- `config.apply` เฉพาะสำหรับการแทนที่การกำหนดค่าเต็มรูปแบบ
- `update.run` สำหรับการอัปเดตตัวเอง + รีสตาร์ตแบบชัดเจน

สำหรับการเปลี่ยนแปลงบางส่วน ให้ใช้ `config.schema.lookup` แล้วจึง `config.patch` ใช้
`config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่การกำหนดค่าทั้งหมดเท่านั้น
สำหรับเอกสารการกำหนดค่าที่กว้างขึ้น อ่าน [การกำหนดค่า](/th/gateway/configuration) และ
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เครื่องมือนี้ยังปฏิเสธการเปลี่ยน `tools.exec.ask` หรือ `tools.exec.security`;
alias เดิมของ `tools.bash.*` จะ normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน

### เครื่องมือที่ Plugin จัดเตรียมให้

Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและ renderer diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON เท่านั้นสำหรับเอาต์พุตที่มีโครงสร้าง
- [Lobster](/th/tools/lobster) — รันไทม์เวิร์กโฟลว์แบบมีชนิดพร้อมการอนุมัติที่ดำเนินต่อได้
- [การสร้างเพลง](/th/tools/music-generation) — เครื่องมือ `music_generate` ที่ใช้ร่วมกันพร้อมผู้ให้บริการที่หนุนด้วยเวิร์กโฟลว์
- [OpenProse](/th/prose) — การประสานงานเวิร์กโฟลว์ที่ใช้ markdown เป็นหลัก
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์เครื่องมือ `exec` และ `bash` ที่มีสัญญาณรบกวน

เครื่องมือของ Plugin ยังคงถูกเขียนด้วย `api.registerTool(...)` และประกาศใน
รายการ `contracts.tools` ของ manifest ของ Plugin OpenClaw จับ descriptor
เครื่องมือที่ผ่านการตรวจสอบแล้วระหว่างการค้นพบ และแคชตามแหล่งที่มาของ Plugin และ contract เพื่อให้
การวางแผนเครื่องมือภายหลังสามารถข้ามการโหลดรันไทม์ของ Plugin ได้ การดำเนินการเครื่องมือยังคงโหลด
Plugin เจ้าของและเรียก implementation ที่ลงทะเบียนจริง

## การกำหนดค่าเครื่องมือ

### รายการอนุญาตและรายการปฏิเสธ

ควบคุมว่าเอเจนต์สามารถเรียกใช้เครื่องมือใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config การปฏิเสธชนะการอนุญาตเสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw จะปิดแบบปลอดภัยเมื่อ allowlist แบบชัดเจน resolve แล้วไม่มีเครื่องมือที่เรียกใช้ได้
ตัวอย่างเช่น `tools.allow: ["query_db"]` จะทำงานก็ต่อเมื่อ Plugin ที่โหลดอยู่ลงทะเบียน
`query_db` จริง ๆ หากไม่มีเครื่องมือในตัว, Plugin หรือเครื่องมือ MCP แบบ bundled ที่ตรงกับ
allowlist การรันจะหยุดก่อนการเรียกโมเดล แทนที่จะดำเนินต่อเป็นการรันแบบข้อความเท่านั้น
ที่อาจสร้างผลลัพธ์เครื่องมือที่ไม่จริง

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อนใช้ `allow`/`deny`
การแทนที่รายเอเจนต์: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | เครื่องมือ core และ Plugin ทางเลือกทั้งหมด; baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | เฉพาะ `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` ถูกตั้งใจให้แคบสำหรับเอเจนต์ที่เน้นช่องทาง
โปรไฟล์นี้ไม่รวมเครื่องมือ command/control ที่กว้างกว่า เช่น filesystem, runtime,
browser, canvas, nodes, cron และการควบคุม Gateway ใช้ `tools.profile: "full"`
เป็น baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น แล้วจึงตัด
การเข้าถึงด้วย `tools.allow` / `tools.deny` เมื่อจำเป็น
</Note>

`coding` รวมเครื่องมือเว็บแบบเบา (`web_search`, `web_fetch`, `x_search`)
แต่ไม่รวมเครื่องมือควบคุมเบราว์เซอร์เต็มรูปแบบ การทำงานอัตโนมัติของเบราว์เซอร์สามารถขับเคลื่อน
เซสชันจริงและโปรไฟล์ที่ล็อกอินอยู่ได้ ดังนั้นให้เพิ่มอย่างชัดเจนด้วย
`tools.alsoAllow: ["browser"]` หรือรายเอเจนต์
`agents.list[].tools.alsoAllow: ["browser"]`

<Note>
การกำหนดค่า `tools.exec` หรือ `tools.fs` ภายใต้โปรไฟล์ที่จำกัด (`messaging`, `minimal`) ไม่ได้ขยาย allowlist ของโปรไฟล์โดยนัย เพิ่มรายการ `tools.alsoAllow` อย่างชัดเจน (เช่น `["exec", "process"]` สำหรับ exec หรือ `["read", "write", "edit"]` สำหรับ fs) เมื่อคุณต้องการให้โปรไฟล์ที่จำกัดใช้ส่วนที่กำหนดค่าเหล่านั้น OpenClaw บันทึกคำเตือนตอนเริ่มต้นเมื่อมีส่วนการกำหนดค่าอยู่โดยไม่มี grant `alsoAllow` ที่ตรงกัน
</Note>

โปรไฟล์ `coding` และ `messaging` ยังอนุญาตเครื่องมือ bundle MCP ที่กำหนดค่าไว้
ภายใต้ key ของ Plugin `bundle-mcp` เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คงเครื่องมือในตัวตามปกติไว้แต่ซ่อนเครื่องมือ MCP ที่กำหนดค่าทั้งหมด
โปรไฟล์ `minimal` ไม่รวมเครื่องมือ bundle MCP

ตัวอย่าง (พื้นผิวเครื่องมือกว้างที่สุดตามค่าเริ่มต้น):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### กลุ่มเครื่องมือ

ใช้ shorthand `group:*` ในรายการอนุญาต/ปฏิเสธ:

| กลุ่ม              | เครื่องมือ                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` ได้รับการยอมรับเป็นนามแฝงของ `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | เครื่องมือ OpenClaw ในตัวทั้งหมด (ไม่รวมเครื่องมือ Plugin)                                                       |

`sessions_history` ส่งคืนมุมมองการเรียกคืนที่มีขอบเขตและผ่านการกรองความปลอดภัย โดยจะลบ
แท็กการคิด, โครงประกอบ `<relevant-memories>`, payload XML การเรียกเครื่องมือแบบข้อความล้วน
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน),
โครงประกอบการเรียกเครื่องมือที่ถูกลดระดับ, token ควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วไหล,
และ XML การเรียกเครื่องมือ MiniMax ที่ผิดรูปแบบจากข้อความของผู้ช่วย จากนั้นจึงใช้
การปกปิด/ตัดทอนและตัวยึดตำแหน่งสำหรับแถวที่อาจมีขนาดใหญ่เกินไป แทนการทำหน้าที่
เป็นการ dump transcript ดิบ

### ข้อจำกัดเฉพาะผู้ให้บริการ

ใช้ `tools.byProvider` เพื่อจำกัดเครื่องมือสำหรับผู้ให้บริการเฉพาะโดยไม่เปลี่ยน
ค่าเริ่มต้นส่วนกลาง:

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
