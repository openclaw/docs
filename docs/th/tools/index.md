---
read_when:
    - คุณต้องการทำความเข้าใจว่า OpenClaw มีเครื่องมือใดให้ใช้บ้าง
    - คุณต้องกำหนดค่า อนุญาต หรือปฏิเสธเครื่องมือ
    - คุณกำลังตัดสินใจเลือกระหว่างเครื่องมือในตัว, Skills และ Plugin
summary: 'ภาพรวมเครื่องมือและ Plugin ของ OpenClaw: สิ่งที่เอเจนต์ทำได้และวิธีขยายความสามารถ'
title: เครื่องมือและ Plugin
x-i18n:
    generated_at: "2026-04-30T10:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

ทุกสิ่งที่เอเจนต์ทำนอกเหนือจากการสร้างข้อความเกิดขึ้นผ่าน **เครื่องมือ**
เครื่องมือคือวิธีที่เอเจนต์อ่านไฟล์ รันคำสั่ง ท่องเว็บ ส่ง
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
    Skills ให้บริบท ข้อจำกัด และคำแนะนำทีละขั้นตอนแก่เอเจนต์เพื่อ
    ใช้เครื่องมืออย่างมีประสิทธิภาพ Skills อยู่ใน workspace ของคุณ ในโฟลเดอร์ที่แชร์กัน
    หรือมาพร้อมกับ Plugin

    [ข้อมูลอ้างอิง Skills](/th/tools/skills) | [การสร้าง Skills](/th/tools/creating-skills)

  </Step>

  <Step title="Plugin จัดแพ็กเกจทุกอย่างเข้าด้วยกัน">
    Plugin คือแพ็กเกจที่สามารถลงทะเบียนความสามารถได้หลายแบบ:
    ช่องทาง ผู้ให้บริการโมเดล เครื่องมือ Skills เสียง การถอดเสียงแบบเรียลไทม์
    เสียงแบบเรียลไทม์ ความเข้าใจสื่อ การสร้างภาพ การสร้างวิดีโอ
    การดึงข้อมูลเว็บ การค้นหาเว็บ และอื่นๆ Plugin บางตัวเป็น **แกนหลัก** (มาพร้อมกับ
    OpenClaw) ส่วนบางตัวเป็น **ภายนอก** (เผยแพร่บน npm โดยชุมชน)

    [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) | [สร้างของคุณเอง](/th/plugins/building-plugins)

  </Step>
</Steps>

## เครื่องมือในตัว

เครื่องมือเหล่านี้มาพร้อมกับ OpenClaw และพร้อมใช้งานโดยไม่ต้องติดตั้ง Plugin ใดๆ:

| เครื่องมือ                                 | สิ่งที่ทำ                                                             | หน้า                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | รันคำสั่ง shell จัดการกระบวนการเบื้องหลัง                            | [Exec](/th/tools/exec), [การอนุมัติ Exec](/th/tools/exec-approvals) |
| `code_execution`                           | รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed                          | [การรันโค้ด](/th/tools/code-execution)                      |
| `browser`                                  | ควบคุมเบราว์เซอร์ Chromium (นำทาง คลิก ภาพหน้าจอ)                    | [เบราว์เซอร์](/th/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ค้นหาเว็บ ค้นหาโพสต์ X ดึงเนื้อหาหน้าเว็บ                            | [เว็บ](/th/tools/web), [การดึงข้อมูลเว็บ](/th/tools/web-fetch)             |
| `read` / `write` / `edit`                  | File I/O ใน workspace                                                 |                                                              |
| `apply_patch`                              | แพตช์ไฟล์หลาย hunk                                                    | [ใช้แพตช์](/th/tools/apply-patch)                            |
| `message`                                  | ส่งข้อความข้ามทุกช่องทาง                                              | [การส่งของเอเจนต์](/th/tools/agent-send)                              |
| `canvas`                                   | ขับเคลื่อน node Canvas (นำเสนอ ประเมิน snapshot)                     |                                                              |
| `nodes`                                    | ค้นหาและกำหนดเป้าหมายอุปกรณ์ที่จับคู่แล้ว                            |                                                              |
| `cron` / `gateway`                         | จัดการงานที่ตั้งเวลาไว้ ตรวจสอบ แพตช์ รีสตาร์ต หรืออัปเดต Gateway     |                                                              |
| `image` / `image_generate`                 | วิเคราะห์หรือสร้างภาพ                                                | [การสร้างภาพ](/th/tools/image-generation)                  |
| `music_generate`                           | สร้างแทร็กเพลง                                                        | [การสร้างเพลง](/th/tools/music-generation)                  |
| `video_generate`                           | สร้างวิดีโอ                                                           | [การสร้างวิดีโอ](/th/tools/video-generation)                  |
| `tts`                                      | การแปลงข้อความเป็นเสียงแบบครั้งเดียว                                  | [TTS](/th/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | การจัดการเซสชัน สถานะ และการประสานงานเอเจนต์ย่อย                     | [เอเจนต์ย่อย](/th/tools/subagents)                               |
| `session_status`                           | การอ่านกลับแบบเบาในสไตล์ `/status` และการ override โมเดลของเซสชัน    | [เครื่องมือเซสชัน](/th/concepts/session-tool)                      |

สำหรับงานภาพ ให้ใช้ `image` สำหรับการวิเคราะห์ และ `image_generate` สำหรับการสร้างหรือแก้ไข หากคุณกำหนดเป้าหมายเป็น `openai/*`, `google/*`, `fal/*` หรือผู้ให้บริการภาพที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานเพลง ให้ใช้ `music_generate` หากคุณกำหนดเป้าหมายเป็น `google/*`, `minimax/*` หรือผู้ให้บริการเพลงที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับงานวิดีโอ ให้ใช้ `video_generate` หากคุณกำหนดเป้าหมายเป็น `qwen/*` หรือผู้ให้บริการวิดีโอที่ไม่ใช่ค่าเริ่มต้นรายอื่น ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นก่อน

สำหรับการสร้างเสียงที่ขับเคลื่อนด้วย workflow ให้ใช้ `music_generate` เมื่อ Plugin เช่น
ComfyUI ลงทะเบียนเครื่องมือนี้ไว้ สิ่งนี้แยกจาก `tts` ซึ่งเป็นการแปลงข้อความเป็นเสียง

`session_status` คือเครื่องมือสถานะ/อ่านกลับแบบเบาในกลุ่มเซสชัน
เครื่องมือนี้ตอบคำถามสไตล์ `/status` เกี่ยวกับเซสชันปัจจุบัน และสามารถ
ตั้งค่า override โมเดลรายเซสชันได้ตามต้องการ `model=default` จะล้าง
override นั้น เช่นเดียวกับ `/status` เครื่องมือนี้สามารถเติมย้อนหลังให้ตัวนับ token/cache ที่มีข้อมูลน้อย และป้ายกำกับโมเดล runtime ที่ใช้งานอยู่จากรายการการใช้งาน transcript ล่าสุด

`gateway` คือเครื่องมือ runtime สำหรับเจ้าของเท่านั้นสำหรับการดำเนินงาน Gateway:

- `config.schema.lookup` สำหรับ config subtree ที่จำกัดตาม path หนึ่งรายการก่อนแก้ไข
- `config.get` สำหรับ snapshot + hash ของ config ปัจจุบัน
- `config.patch` สำหรับการอัปเดต config บางส่วนพร้อมรีสตาร์ต
- `config.apply` ใช้เฉพาะสำหรับการแทนที่ config ทั้งหมด
- `update.run` สำหรับการ self-update + รีสตาร์ตอย่างชัดเจน

สำหรับการเปลี่ยนแปลงบางส่วน ให้ใช้ `config.schema.lookup` แล้วจึง `config.patch` ใช้
`config.apply` เฉพาะเมื่อคุณตั้งใจแทนที่ config ทั้งหมด
สำหรับเอกสาร config ที่กว้างขึ้น อ่าน [การกำหนดค่า](/th/gateway/configuration) และ
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
เครื่องมือนี้ยังปฏิเสธการเปลี่ยนแปลง `tools.exec.ask` หรือ `tools.exec.security`;
alias เดิมของ `tools.bash.*` จะ normalize เป็น path exec ที่ได้รับการป้องกันเดียวกัน

### เครื่องมือที่ Plugin จัดหาให้

Plugin สามารถลงทะเบียนเครื่องมือเพิ่มเติมได้ ตัวอย่างบางส่วน:

- [Diffs](/th/tools/diffs) — ตัวดูและตัวเรนเดอร์ diff
- [งาน LLM](/th/tools/llm-task) — ขั้นตอน LLM แบบ JSON เท่านั้นสำหรับ output แบบมีโครงสร้าง
- [Lobster](/th/tools/lobster) — runtime ของ workflow แบบมีชนิดพร้อมการอนุมัติที่ดำเนินต่อได้
- [การสร้างเพลง](/th/tools/music-generation) — เครื่องมือ `music_generate` ที่ใช้ร่วมกันพร้อมผู้ให้บริการที่มี workflow รองรับ
- [OpenProse](/th/prose) — การประสานงาน workflow ที่ยึด markdown เป็นหลัก
- [Tokenjuice](/th/tools/tokenjuice) — ย่อผลลัพธ์เครื่องมือ `exec` และ `bash` ที่มีสัญญาณรบกวนมาก

## การกำหนดค่าเครื่องมือ

### รายการอนุญาตและปฏิเสธ

ควบคุมว่าเอเจนต์สามารถเรียกใช้เครื่องมือใดได้ผ่าน `tools.allow` / `tools.deny` ใน
config รายการปฏิเสธชนะรายการอนุญาตเสมอ

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw จะปิดการทำงานอย่างปลอดภัยเมื่อ allowlist ที่ระบุชัดเจน resolve แล้วไม่มีเครื่องมือที่เรียกใช้ได้
ตัวอย่างเช่น `tools.allow: ["query_db"]` จะทำงานก็ต่อเมื่อ Plugin ที่โหลดอยู่ลงทะเบียน
`query_db` จริงๆ หากไม่มีเครื่องมือในตัว Plugin หรือเครื่องมือ MCP ที่ bundled ตรงกับ
allowlist การรันจะหยุดก่อนการเรียกโมเดล แทนที่จะดำเนินต่อเป็นการรันแบบข้อความเท่านั้น
ซึ่งอาจกุผลลัพธ์เครื่องมือขึ้นมาได้

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อนนำ `allow`/`deny` ไปใช้
override รายเอเจนต์: `agents.list[].tools.profile`

| โปรไฟล์     | สิ่งที่รวมอยู่                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | พื้นฐานแบบไม่จำกัดสำหรับการเข้าถึงคำสั่ง/การควบคุมที่กว้างขึ้น เหมือนกับการไม่ตั้งค่า `tools.profile`                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | เฉพาะ `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` ตั้งใจให้แคบสำหรับเอเจนต์ที่เน้นช่องทาง
โปรไฟล์นี้ไม่รวมเครื่องมือคำสั่ง/การควบคุมที่กว้างขึ้น เช่น filesystem, runtime,
browser, canvas, nodes, cron และการควบคุม Gateway ใช้ `tools.profile: "full"`
เป็นพื้นฐานแบบไม่จำกัดสำหรับการเข้าถึงคำสั่ง/การควบคุมที่กว้างขึ้น แล้วจึงลด
การเข้าถึงด้วย `tools.allow` / `tools.deny` เมื่อจำเป็น
</Note>

`coding` รวมเครื่องมือเว็บแบบเบา (`web_search`, `web_fetch`, `x_search`)
แต่ไม่รวมเครื่องมือควบคุมเบราว์เซอร์เต็มรูปแบบ ระบบอัตโนมัติของเบราว์เซอร์สามารถขับเคลื่อน
เซสชันจริงและโปรไฟล์ที่ล็อกอินอยู่ได้ ดังนั้นให้เพิ่มอย่างชัดเจนด้วย
`tools.alsoAllow: ["browser"]` หรือแบบรายเอเจนต์
`agents.list[].tools.alsoAllow: ["browser"]`

โปรไฟล์ `coding` และ `messaging` ยังอนุญาตเครื่องมือ bundle MCP ที่กำหนดค่าไว้
ภายใต้คีย์ Plugin `bundle-mcp` เพิ่ม `tools.deny: ["bundle-mcp"]` เมื่อคุณ
ต้องการให้โปรไฟล์คงเครื่องมือในตัวปกติไว้ แต่ซ่อนเครื่องมือ MCP ที่กำหนดค่าไว้ทั้งหมด
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

ใช้คำย่อ `group:*` ในรายการอนุญาต/ปฏิเสธ:

| กลุ่ม              | เครื่องมือ                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` ยอมรับให้ใช้เป็นชื่อแฝงของ `exec`)                                 |
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

`sessions_history` ส่งคืนมุมมองการเรียกคืนที่มีขอบเขตและผ่านการกรองความปลอดภัย โดยจะลบ
แท็ก thinking, โครงประกอบ `<relevant-memories>`, เพย์โหลด XML การเรียกเครื่องมือแบบข้อความล้วน
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน),
โครงประกอบการเรียกเครื่องมือที่ถูกลดระดับ, โทเค็นควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วไหล,
และ XML การเรียกเครื่องมือ MiniMax ที่ผิดรูปแบบจากข้อความของผู้ช่วย จากนั้นจึงใช้
การปกปิด/ตัดทอนข้อมูล และอาจใช้ตัวแทนแถวที่มีขนาดใหญ่เกินไป แทนที่จะทำหน้าที่
เป็นการดัมป์ทรานสคริปต์ดิบ

### ข้อจำกัดเฉพาะผู้ให้บริการ

ใช้ `tools.byProvider` เพื่อจำกัดเครื่องมือสำหรับผู้ให้บริการที่ระบุ โดยไม่
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
