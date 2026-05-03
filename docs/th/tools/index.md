---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มีเครื่องมืออะไรให้ใช้งานบ้าง
    - คุณต้องกำหนดค่า อนุญาต หรือปฏิเสธเครื่องมือ
    - คุณกำลังตัดสินใจเลือกระหว่างเครื่องมือในตัว, Skills และ Plugin
summary: 'ภาพรวมเครื่องมือและ Plugin ของ OpenClaw: เอเจนต์ทำอะไรได้บ้างและวิธีขยายความสามารถ'
title: เครื่องมือและ Plugin
x-i18n:
    generated_at: "2026-05-03T21:39:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

ทุกสิ่งที่เอเจนต์ทำนอกเหนือจากการสร้างข้อความเกิดขึ้นผ่าน **เครื่องมือ**
เครื่องมือคือวิธีที่เอเจนต์อ่านไฟล์ รันคำสั่ง เรียกดูเว็บ ส่ง
ข้อความ และโต้ตอบกับอุปกรณ์

## เครื่องมือ Skills และ Plugin

OpenClaw มีสามชั้นที่ทำงานร่วมกัน:

<Steps>
  <Step title="เครื่องมือคือสิ่งที่เอเจนต์เรียกใช้">
    เครื่องมือคือฟังก์ชันแบบมีชนิดที่เอเจนต์สามารถเรียกใช้ได้ (เช่น `exec`, `browser`,
    `web_search`, `message`) OpenClaw มาพร้อมชุด **เครื่องมือในตัว** และ
    Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้

    เอเจนต์เห็นเครื่องมือเป็นนิยามฟังก์ชันแบบมีโครงสร้างที่ส่งไปยัง API ของโมเดล

  </Step>

  <Step title="Skills สอนเอเจนต์ว่าเมื่อไรและอย่างไร">
    Skill คือไฟล์ markdown (`SKILL.md`) ที่ฉีดเข้าไปในพรอมป์ระบบ
    Skills ให้บริบท ข้อจำกัด และคำแนะนำทีละขั้นตอนแก่เอเจนต์สำหรับ
    การใช้เครื่องมืออย่างมีประสิทธิภาพ Skills อยู่ใน workspace ของคุณ ในโฟลเดอร์ที่แชร์
    หรือมากับ Plugin

    [อ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugin รวมทุกอย่างไว้ด้วยกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนความสามารถแบบใดก็ได้ร่วมกัน:
    channel, ผู้ให้บริการโมเดล, เครื่องมือ, Skills, speech, realtime transcription,
    realtime voice, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ,
    web fetch, web search และอื่น ๆ Plugin บางตัวเป็น **core** (มาพร้อมกับ
    OpenClaw) ส่วนบางตัวเป็น **external** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## เครื่องมือในตัว

เครื่องมือเหล่านี้มาพร้อมกับ OpenClaw และพร้อมใช้งานโดยไม่ต้องติดตั้ง Plugin ใด ๆ:

| เครื่องมือ                                  | สิ่งที่ทำ                                                            | หน้า                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | รันคำสั่ง shell จัดการกระบวนการเบื้องหลัง                            | [Exec](/th/tools/exec), [การอนุมัติ Exec](/th/tools/exec-approvals) |
| `code_execution`                           | รันการวิเคราะห์ Python ระยะไกลใน sandbox                             | [การรันโค้ด](/th/tools/code-execution)                          |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (นำทาง คลิก จับภาพหน้าจอ)                 | [เบราว์เซอร์](/th/tools/browser)                                |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ ค้นหาโพสต์ X ดึงเนื้อหาหน้าเว็บ                            | [เว็บ](/th/tools/web), [Web Fetch](/th/tools/web-fetch)            |
| `read` / `write` / `edit`                  | File I/O ใน workspace                                                 |                                                              |
| `apply_patch`                              | แพตช์ไฟล์แบบหลาย hunk                                                | [Apply Patch](/th/tools/apply-patch)                            |
| `message`                                  | ส่งข้อความข้ามทุก channel                                            | [Agent Send](/th/tools/agent-send)                              |
| `canvas`                                   | ขับเคลื่อน node Canvas (นำเสนอ ประเมินค่า snapshot)                  |                                                              |
| `nodes`                                    | ค้นหาและระบุเป้าหมายอุปกรณ์ที่จับคู่ไว้                              |                                                              |
| `cron` / `gateway`                         | จัดการงานตามกำหนดเวลา ตรวจสอบ แพตช์ รีสตาร์ท หรืออัปเดต Gateway       |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างภาพ                                                | [การสร้างภาพ](/th/tools/image-generation)                       |
| `music_generate`                           | สร้างแทร็กเพลง                                                       | [การสร้างเพลง](/th/tools/music-generation)                      |
| `video_generate`                           | สร้างวิดีโอ                                                          | [การสร้างวิดีโอ](/th/tools/video-generation)                    |
| `tts`                                      | แปลงข้อความเป็นเสียงแบบครั้งเดียว                                    | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน สถานะ และการประสานงานเอเจนต์ย่อย                    | [เอเจนต์ย่อย](/th/tools/subagents)                              |
| `session_status`                           | การอ่านกลับแบบเบาสไตล์ `/status` และการ override โมเดลของเซสชัน      | [เครื่องมือเซสชัน](/th/concepts/session-tool)                   |

สำหรับงานภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายเป็น `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการภาพอื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานเพลง ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมายเป็น `google/*`, `minimax/*` หรือผู้ให้บริการเพลงอื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมายเป็น `qwen/*` หรือผู้ให้บริการวิดีโออื่นที่ไม่ใช่ค่าเริ่มต้น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงที่ขับเคลื่อนด้วย workflow ให้ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนเครื่องมือนี้ไว้ ซึ่งแยกจาก `tts` ที่เป็นการแปลงข้อความเป็นเสียง

`session_status` คือเครื่องมือสถานะ/อ่านกลับแบบเบาในกลุ่มเซสชัน
มันตอบคำถามสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่า override โมเดลต่อเซสชันได้แบบเลือกได้ `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` มันสามารถ backfill ตัวนับ token/cache ที่เบาบาง และป้ายกำกับโมเดล runtime ที่ใช้งานอยู่จากรายการ usage ของ transcript ล่าสุด

`gateway` คือเครื่องมือ runtime เฉพาะเจ้าของสำหรับการดำเนินการ Gateway:

- `config.schema.lookup` สำหรับ subtree การกำหนดค่าที่จำกัดตาม path หนึ่งรายการก่อนแก้ไข
- `config.get` สำหรับ snapshot การกำหนดค่าปัจจุบัน + hash
- `config.patch` สำหรับการอัปเดตการกำหนดค่าบางส่วนพร้อมรีสตาร์ท
- `config.apply` สำหรับการแทนที่การกำหนดค่าทั้งหมดเท่านั้น
- `update.run` สำหรับ self-update + รีสตาร์ทอย่างชัดเจน

สำหรับการเปลี่ยนแปลงบางส่วน ให้ใช้ `config.schema.lookup` แล้วตามด้วย `config.patch` ใช้
`config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่การกำหนดค่าทั้งหมด
สำหรับเอกสารการกำหนดค่าที่กว้างขึ้น ให้อ่าน [การกำหนดค่า](/th/gateway/configuration) และ
[อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เครื่องมือนี้ยังปฏิเสธการเปลี่ยนแปลง `tools.exec.ask` หรือ `tools.exec.security`;
alias เดิม `tools.bash.*` จะ normalize ไปยัง path exec ที่ได้รับการป้องกันเดียวกัน

### เครื่องมือที่ Plugin จัดหาให้

Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [LLM Task](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON เท่านั้นสำหรับ output แบบมีโครงสร้าง
- [Lobster](/th/tools/lobster) — runtime workflow แบบมีชนิดพร้อมการอนุมัติที่ทำต่อได้
- [การสร้างเพลง](/th/tools/music-generation) — เครื่องมือ `music_generate` ที่ใช้ร่วมกันพร้อมผู้ให้บริการที่มี workflow รองรับ
- [OpenProse](/th/prose) — การประสาน workflow ที่ใช้ markdown เป็นหลัก
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์เครื่องมือ `exec` และ `bash` ที่มีสัญญาณรบกวน

เครื่องมือของ Plugin ยังคงเขียนด้วย `api.registerTool(...)` และประกาศใน
รายการ `contracts.tools` ของ manifest ของ Plugin OpenClaw จับ descriptor
เครื่องมือที่ตรวจสอบแล้วระหว่างการค้นพบ และแคชตามแหล่งที่มาของ Plugin และ contract เพื่อให้
การวางแผนเครื่องมือภายหลังสามารถข้ามการโหลด runtime ของ Plugin ได้ การดำเนินการเครื่องมือยังคงโหลด
Plugin เจ้าของและเรียก implementation ที่ลงทะเบียนจริง

## การกำหนดค่าเครื่องมือ

### รายการอนุญาตและรายการปฏิเสธ

ควบคุมว่าเอเจนต์สามารถเรียกเครื่องมือใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config รายการปฏิเสธชนะรายการอนุญาตเสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw ปิดอย่างปลอดภัยเมื่อ allowlist ที่ระบุชัดเจน resolve แล้วไม่มีเครื่องมือที่เรียกได้
ตัวอย่างเช่น `tools.allow: ["query_db"]` จะทำงานก็ต่อเมื่อ Plugin ที่โหลดแล้ว
ลงทะเบียน `query_db` จริง ๆ หากไม่มีเครื่องมือในตัว Plugin หรือเครื่องมือ MCP ที่ bundled ตรงกับ
allowlist การรันจะหยุดก่อนการเรียกโมเดล แทนที่จะดำเนินต่อเป็นการรันแบบ
ข้อความเท่านั้นที่อาจจินตนาการผลลัพธ์เครื่องมือขึ้นมาได้

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อนนำ `allow`/`deny` ไปใช้
การ override ต่อเอเจนต์: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | เครื่องมือ core และเครื่องมือ Plugin แบบ optional ทั้งหมด baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` เท่านั้น                                                                                                                         |

<Note>
`tools.profile: "messaging"` ตั้งใจให้แคบสำหรับเอเจนต์ที่เน้น channel
มันไม่รวมเครื่องมือ command/control ที่กว้างกว่า เช่น filesystem, runtime,
browser, canvas, nodes, cron และการควบคุม Gateway ใช้ `tools.profile: "full"`
เป็น baseline แบบไม่จำกัดสำหรับการเข้าถึง command/control ที่กว้างขึ้น แล้วค่อยตัด
สิทธิ์ด้วย `tools.allow` / `tools.deny` เมื่อจำเป็น
</Note>

`coding` รวมเครื่องมือเว็บแบบเบา (`web_search`, `web_fetch`, `x_search`)
แต่ไม่รวมเครื่องมือควบคุมเบราว์เซอร์เต็มรูปแบบ Browser automation สามารถขับเคลื่อน
เซสชันจริงและโปรไฟล์ที่ล็อกอินอยู่ได้ ดังนั้นให้เพิ่มอย่างชัดเจนด้วย
`tools.alsoAllow: ["browser"]` หรือแบบต่อเอเจนต์
`agents.list[].tools.alsoAllow: ["browser"]`

<Note>
การกำหนดค่า `tools.exec` หรือ `tools.fs` ภายใต้โปรไฟล์ที่จำกัด (`messaging`, `minimal`) จะไม่ขยาย allowlist ของโปรไฟล์โดยปริยาย เพิ่มรายการ `tools.alsoAllow` ที่ชัดเจน (เช่น `["exec", "process"]` สำหรับ exec หรือ `["read", "write", "edit"]` สำหรับ fs) เมื่อคุณต้องการให้โปรไฟล์ที่จำกัดใช้ส่วนที่กำหนดค่าเหล่านั้น OpenClaw บันทึกคำเตือนตอนเริ่มต้นเมื่อมีส่วน config อยู่แต่ไม่มี grant `alsoAllow` ที่ตรงกัน
</Note>

โปรไฟล์ `coding` และ `messaging` ยังอนุญาตเครื่องมือ bundle MCP ที่กำหนดค่าไว้
ภายใต้คีย์ Plugin `bundle-mcp` เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คงเครื่องมือในตัวตามปกติไว้ แต่ซ่อนเครื่องมือ MCP ที่กำหนดค่าทั้งหมด
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

ใช้ชวเลข `group:*` ในรายการอนุญาต/ปฏิเสธ:

| กลุ่ม              | เครื่องมือ                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` ใช้เป็นนามแฝงของ `exec` ได้)                                 |
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

`sessions_history` ส่งคืนมุมมองการเรียกคืนที่มีขอบเขตและผ่านการกรองความปลอดภัย โดยจะลบ
แท็ก thinking, โครง `\<relevant-memories>` payload XML
การเรียกเครื่องมือแบบข้อความธรรมดา (รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน),
โครงสร้างการเรียกเครื่องมือที่ถูกลดระดับ, โทเค็นควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วไหล,
และ XML การเรียกเครื่องมือ MiniMax ที่มีรูปแบบไม่ถูกต้องจากข้อความของผู้ช่วย จากนั้นจึงใช้
การปกปิด/การตัดทอนและอาจใช้ placeholder สำหรับแถวที่ใหญ่เกินไปแทนการทำหน้าที่เป็น
การดัมพ์ transcript ดิบ

### ข้อจำกัดเฉพาะผู้ให้บริการ

ใช้ `tools.byProvider` เพื่อจำกัดเครื่องมือสำหรับผู้ให้บริการเฉพาะโดยไม่
เปลี่ยนค่าเริ่มต้นแบบสากล:

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
