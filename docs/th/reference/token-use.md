---
read_when:
    - การอธิบายการใช้โทเค็น ต้นทุน หรือหน้าต่างบริบท
    - การดีบักการเพิ่มขึ้นของบริบทหรือพฤติกรรมของ Compaction
summary: วิธีที่ OpenClaw สร้างบริบทของพร้อมต์และรายงานการใช้โทเค็น + ต้นทุน
title: การใช้โทเค็นและต้นทุน
x-i18n:
    generated_at: "2026-04-26T11:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# การใช้โทเค็นและต้นทุน

OpenClaw ติดตาม **โทเค็น** ไม่ใช่อักขระ โทเค็นขึ้นอยู่กับแต่ละโมเดล แต่โดยทั่วไป
โมเดลสไตล์ OpenAI ส่วนใหญ่จะเฉลี่ยประมาณ ~4 อักขระต่อโทเค็นสำหรับข้อความภาษาอังกฤษ

## วิธีสร้าง system prompt

OpenClaw จะประกอบ system prompt ของตัวเองใหม่ทุกครั้งที่รัน โดยประกอบด้วย:

- รายการเครื่องมือ + คำอธิบายสั้น ๆ
- รายการ Skills (เฉพาะเมทาดาทา; คำสั่งจะถูกโหลดตามต้องการด้วย `read`)
  บล็อก Skills แบบย่อถูกจำกัดด้วย `skills.limits.maxSkillsPromptChars`
  และสามารถ override ต่อเอเจนต์ได้ที่
  `agents.list[].skillsLimits.maxSkillsPromptChars`
- คำสั่งสำหรับการอัปเดตตัวเอง
- ไฟล์ workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` เมื่อเป็นไฟล์ใหม่ และ `MEMORY.md` เมื่อมีอยู่) ไฟล์ `memory.md` ตัวพิมพ์เล็กที่ root จะไม่ถูก inject; เป็นอินพุตสำหรับการซ่อมแซมแบบ legacy ของ `openclaw doctor --fix` เมื่อใช้คู่กับ `MEMORY.md` ไฟล์ขนาดใหญ่จะถูกตัดทอนด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และการ inject bootstrap รวมทั้งหมดถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) ไฟล์รายวัน `memory/*.md` ไม่ได้เป็นส่วนหนึ่งของ bootstrap prompt ปกติ; ไฟล์เหล่านี้ยังคงถูกเรียกใช้ตามต้องการผ่านเครื่องมือหน่วยความจำในเทิร์นปกติ แต่ `/new` และ `/reset` แบบไม่มีอาร์กิวเมนต์สามารถเพิ่มบล็อก startup-context แบบใช้ครั้งเดียวพร้อมหน่วยความจำรายวันล่าสุดสำหรับเทิร์นแรกนั้นได้ บทนำ startup นี้ควบคุมด้วย `agents.defaults.startupContext`
- เวลา (UTC + เขตเวลาของผู้ใช้)
- แท็กการตอบกลับ + พฤติกรรม Heartbeat
- เมทาดาทารันไทม์ (โฮสต์/OS/โมเดล/thinking)

ดูรายละเอียดแบบเต็มได้ที่ [System Prompt](/th/concepts/system-prompt)

## อะไรบ้างที่นับรวมใน context window

ทุกอย่างที่โมเดลได้รับจะนับรวมในขีดจำกัด context:

- System prompt (ทุกส่วนที่ระบุไว้ข้างต้น)
- ประวัติการสนทนา (ข้อความของผู้ใช้ + ผู้ช่วย)
- การเรียกใช้เครื่องมือและผลลัพธ์จากเครื่องมือ
- ไฟล์แนบ/ทรานสคริปต์ (รูปภาพ เสียง ไฟล์)
- สรุป Compaction และอาร์ติแฟกต์จากการ pruning
- wrapper ของผู้ให้บริการหรือ safety header (มองไม่เห็น แต่ยังถูกนับ)

บางพื้นผิวที่ใช้รันไทม์หนักมีเพดานกำหนดไว้แยกต่างหาก:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

การ override ต่อเอเจนต์อยู่ภายใต้ `agents.list[].contextLimits` ปุ่มปรับเหล่านี้
ใช้สำหรับข้อความตัดตอนของรันไทม์ที่มีขอบเขตชัดเจนและบล็อกที่ inject โดยรันไทม์เอง
ซึ่งแยกจาก bootstrap limits, startup-context limits และ skills prompt
limits

สำหรับรูปภาพ OpenClaw จะย่อขนาด payload รูปภาพจาก transcript/tool ก่อนเรียกผู้ให้บริการ
ใช้ `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`) เพื่อปรับแต่งค่า:

- ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision token และขนาด payload
- ค่าที่สูงกว่าจะเก็บรายละเอียดภาพได้มากกว่า สำหรับสกรีนช็อตที่มี OCR/UI หนัก

หากต้องการดูรายละเอียดเชิงปฏิบัติ (ต่อไฟล์ที่ inject แต่ละไฟล์ เครื่องมือ Skills และขนาด system prompt) ให้ใช้ `/context list` หรือ `/context detail` ดู [Context](/th/concepts/context)

## วิธีดูการใช้โทเค็นปัจจุบัน

ใช้คำสั่งเหล่านี้ในแชต:

- `/status` → **การ์ดสถานะแบบอีโมจิ** ที่แสดงโมเดลของเซสชัน การใช้ context
  โทเค็น input/output ของการตอบกลับล่าสุด และ **ต้นทุนโดยประมาณ** (เฉพาะคีย์ API)
- `/usage off|tokens|full` → เพิ่ม **ส่วนท้ายการใช้งานต่อการตอบกลับ** ให้กับทุกคำตอบ
  - คงค่าไว้ต่อเซสชัน (เก็บเป็น `responseUsage`)
  - การยืนยันตัวตนแบบ OAuth **จะซ่อนต้นทุน** (แสดงเฉพาะโทเค็น)
- `/usage cost` → แสดงสรุปต้นทุนในเครื่องจาก session logs ของ OpenClaw

พื้นผิวอื่น ๆ:

- **TUI/Web TUI:** รองรับ `/status` + `/usage`
- **CLI:** `openclaw status --usage` และ `openclaw channels list` แสดง
  หน้าต่างโควต้าของผู้ให้บริการที่ถูกปรับรูปแบบให้เป็นมาตรฐาน (`X% left` ไม่ใช่ต้นทุนต่อการตอบกลับ)
  ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai

พื้นผิวการใช้งานจะปรับ field alias ทั่วไปของผู้ให้บริการให้เป็นมาตรฐานก่อนแสดงผล
สำหรับทราฟฟิก OpenAI-family Responses นั้น รวมทั้ง `input_tokens` /
`output_tokens` และ `prompt_tokens` / `completion_tokens` ด้วย ดังนั้นชื่อฟิลด์
ที่ต่างกันตาม transport จะไม่เปลี่ยนผลลัพธ์ของ `/status`, `/usage` หรือสรุปเซสชัน
การใช้งาน JSON ของ Gemini CLI ก็ถูกปรับมาตรฐานเช่นกัน: ข้อความตอบกลับมาจาก `response` และ
`stats.cached` จะถูกแมปเป็น `cacheRead` โดยใช้ `stats.input_tokens - stats.cached`
เมื่อ CLI ไม่ได้ส่งฟิลด์ `stats.input` แบบชัดเจนมา
สำหรับทราฟฟิก Responses แบบ native ของ OpenAI-family, alias การใช้งานจาก WebSocket/SSE
ก็ถูกปรับมาตรฐานเช่นเดียวกัน และค่ารวมจะ fallback ไปใช้ input + output ที่ผ่านการปรับมาตรฐานแล้วเมื่อ
`total_tokens` ไม่มีอยู่หรือเป็น `0`
เมื่อ snapshot ของเซสชันปัจจุบันมีข้อมูลไม่ครบ `/status` และ `session_status` ยังสามารถ
กู้ตัวนับ token/cache และป้ายชื่อโมเดลรันไทม์ที่ใช้งานอยู่กลับมาจาก
usage log ล่าสุดใน transcript ได้ ค่าที่มีอยู่จริงและไม่เป็นศูนย์จะยังคงมีสิทธิ์เหนือกว่า
ค่าที่ได้จาก transcript และค่ารวมเชิง prompt-oriented ที่มากกว่าจาก transcript
อาจชนะได้เมื่อค่ารวมที่เก็บไว้ไม่มีอยู่หรือมีค่าน้อยกว่า
auth การใช้งานสำหรับหน้าต่างโควต้าของผู้ให้บริการมาจาก hook เฉพาะผู้ให้บริการเมื่อมี
มิฉะนั้น OpenClaw จะ fallback ไปใช้ข้อมูลรับรอง OAuth/API-key ที่ตรงกันจาก
auth profiles, env หรือ config
รายการ transcript ของผู้ช่วยจะเก็บรูปแบบการใช้งานที่ผ่านการปรับมาตรฐานแบบเดียวกันไว้ด้วย รวมถึง
`usage.cost` เมื่อโมเดลที่ใช้งานอยู่มีการกำหนดราคาไว้และผู้ให้บริการส่งเมทาดาทาการใช้งานกลับมา
สิ่งนี้ทำให้ `/usage cost` และสถานะเซสชันที่อิง transcript มีแหล่งข้อมูลที่คงเสถียร
แม้ว่าสถานะรันไทม์สดจะหายไปแล้วก็ตาม

OpenClaw แยกการบัญชีการใช้งานของผู้ให้บริการออกจาก snapshot ของ context ปัจจุบัน
`usage.total` ของผู้ให้บริการอาจรวม cached input, output และการเรียกโมเดลหลายครั้งภายใน tool-loop จึงมีประโยชน์สำหรับต้นทุนและ telemetry แต่สามารถทำให้ขนาด context window สดดูมากเกินจริงได้ การแสดงผล context และการวินิจฉัยจะใช้ prompt snapshot ล่าสุด (`promptTokens` หรือการเรียกโมเดลครั้งล่าสุดเมื่อไม่มี prompt snapshot) สำหรับ `context.used`

## การประเมินต้นทุน (เมื่อมีการแสดง)

ต้นทุนจะถูกประเมินจากการกำหนดค่าราคาโมเดลของคุณ:

```
models.providers.<provider>.models[].cost
```

ค่านี้คือ **USD ต่อ 1M โทเค็น** สำหรับ `input`, `output`, `cacheRead` และ
`cacheWrite` หากไม่มีข้อมูลราคา OpenClaw จะแสดงเฉพาะโทเค็น โทเค็น OAuth
จะไม่แสดงต้นทุนเป็นดอลลาร์

## ผลกระทบของ cache TTL และการ pruning

การแคชพร้อมต์ของผู้ให้บริการจะใช้ได้เฉพาะภายในช่วง cache TTL เท่านั้น OpenClaw สามารถ
รัน **cache-ttl pruning** แบบเลือกได้: มันจะ prune เซสชันเมื่อ cache TTL
หมดอายุ จากนั้นรีเซ็ตหน้าต่าง cache เพื่อให้คำขอถัดไปสามารถนำ context ที่เพิ่งแคชใหม่กลับมาใช้ซ้ำได้
แทนที่จะต้องแคชประวัติทั้งหมดใหม่ วิธีนี้ช่วยลดต้นทุน cache write
เมื่อเซสชันปล่อยว่างเกิน TTL

กำหนดค่าได้ใน [การกำหนดค่า Gateway](/th/gateway/configuration) และดูรายละเอียด
พฤติกรรมได้ใน [การ pruning เซสชัน](/th/concepts/session-pruning)

Heartbeat สามารถช่วยให้ cache **อุ่นอยู่เสมอ** ระหว่างช่วงที่ไม่มีการใช้งานได้ หาก cache TTL ของโมเดลคุณ
เป็น `1h` การตั้งช่วงเวลา Heartbeat ให้น้อยกว่านั้นเล็กน้อย (เช่น `55m`) จะช่วยหลีกเลี่ยงการ
แคชพร้อมต์ทั้งหมดใหม่ จึงลดต้นทุน cache write ได้

ในชุดการตั้งค่าแบบหลายเอเจนต์ คุณสามารถใช้การกำหนดค่าโมเดลร่วมกันหนึ่งชุด และปรับพฤติกรรม cache
แยกต่อเอเจนต์ได้ด้วย `agents.list[].params.cacheRetention`

สำหรับคู่มือแบบครบทุกปุ่มปรับ ดู [Prompt Caching](/th/reference/prompt-caching)

สำหรับราคาของ Anthropic API ค่า cache read ถูกกว่าค่า input
token อย่างมาก ในขณะที่ cache write จะคิดค่าบริการด้วยตัวคูณที่สูงกว่า ดูอัตราล่าสุดและตัวคูณ TTL ได้ที่เอกสาร prompt caching ของ Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### ตัวอย่าง: รักษา cache 1h ให้อุ่นด้วย Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### ตัวอย่าง: ทราฟฟิกแบบผสมพร้อมกลยุทธ์ cache รายเอเจนต์

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # ค่าพื้นฐานเริ่มต้นสำหรับเอเจนต์ส่วนใหญ่
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # รักษา long cache ให้อุ่นสำหรับเซสชันเชิงลึก
    - id: "alerts"
      params:
        cacheRetention: "none" # หลีกเลี่ยง cache write สำหรับการแจ้งเตือนที่มาเป็นช่วง ๆ
```

`agents.list[].params` จะ merge ทับบน `params` ของโมเดลที่เลือก ดังนั้นคุณสามารถ
override เฉพาะ `cacheRetention` และสืบทอดค่าเริ่มต้นอื่นของโมเดลได้โดยไม่เปลี่ยนแปลง

### ตัวอย่าง: เปิดใช้ beta header สำหรับบริบท 1M ของ Anthropic

context window 1M ของ Anthropic ปัจจุบันยังถูกจำกัดด้วย beta OpenClaw สามารถ inject ค่า `anthropic-beta` ที่ต้องใช้ได้เมื่อคุณเปิด `context1m` บนโมเดล Opus
หรือ Sonnet ที่รองรับ

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

ค่านี้จะถูกแมปไปยัง beta header `context-1m-2025-08-07` ของ Anthropic

สิ่งนี้จะมีผลเฉพาะเมื่อมีการตั้ง `context1m: true` บนรายการโมเดลนั้น

ข้อกำหนด: ข้อมูลรับรองต้องมีสิทธิ์ใช้งาน long-context หากไม่เป็นเช่นนั้น
Anthropic จะตอบกลับด้วยข้อผิดพลาด rate limit จากฝั่งผู้ให้บริการสำหรับคำขอนั้น

หากคุณยืนยันตัวตนกับ Anthropic โดยใช้โทเค็น OAuth/subscription (`sk-ant-oat-*`)
OpenClaw จะข้าม beta header `context-1m-*` เนื่องจากปัจจุบัน Anthropic
ปฏิเสธการใช้งานชุดค่านี้ด้วย HTTP 401

## เคล็ดลับในการลดแรงกดดันด้านโทเค็น

- ใช้ `/compact` เพื่อสรุปเซสชันที่ยาว
- ตัดผลลัพธ์ของเครื่องมือที่มีขนาดใหญ่ในเวิร์กโฟลว์ของคุณ
- ลด `agents.defaults.imageMaxDimensionPx` สำหรับเซสชันที่ใช้สกรีนช็อตจำนวนมาก
- ทำให้คำอธิบาย Skills สั้นเข้าไว้ (รายการ Skills ถูก inject เข้าไปใน prompt)
- เลือกใช้โมเดลขนาดเล็กกว่าสำหรับงานที่ต้องสำรวจหรือมีความยืดเยื้อ

ดู [Skills](/th/tools/skills) สำหรับสูตร overhead ของรายการ Skills แบบละเอียด

## ที่เกี่ยวข้อง

- [การใช้งาน API และต้นทุน](/th/reference/api-usage-costs)
- [Prompt Caching](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
