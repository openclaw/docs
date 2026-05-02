---
read_when:
    - การอธิบายการใช้โทเค็น ค่าใช้จ่าย หรือหน้าต่างบริบท
    - การดีบักการเติบโตของบริบทหรือพฤติกรรม Compaction
summary: วิธีที่ OpenClaw สร้างบริบทพรอมป์และรายงานการใช้งานโทเค็น + ค่าใช้จ่าย
title: การใช้โทเค็นและค่าใช้จ่าย
x-i18n:
    generated_at: "2026-05-02T20:59:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# การใช้โทเค็นและค่าใช้จ่าย

OpenClaw ติดตาม **โทเค็น** ไม่ใช่อักขระ โทเค็นขึ้นอยู่กับแต่ละโมเดล แต่โมเดลแบบ OpenAI ส่วนใหญ่มีค่าเฉลี่ยประมาณ 4 อักขระต่อโทเค็นสำหรับข้อความภาษาอังกฤษ

## วิธีสร้างพรอมป์ระบบ

OpenClaw ประกอบพรอมป์ระบบของตัวเองในทุกครั้งที่รัน โดยประกอบด้วย:

- รายการเครื่องมือ + คำอธิบายสั้นๆ
- รายการ Skills (เฉพาะเมตาดาตาเท่านั้น; คำสั่งจะถูกโหลดเมื่อจำเป็นด้วย `read`)
  บล็อก Skills แบบกระชับถูกจำกัดด้วย `skills.limits.maxSkillsPromptChars`
  พร้อมการ override ราย agent ที่เลือกได้ที่
  `agents.list[].skillsLimits.maxSkillsPromptChars`
- คำสั่งสำหรับอัปเดตตัวเอง
- Workspace + ไฟล์ bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` เมื่อเป็นไฟล์ใหม่ รวมถึง `MEMORY.md` เมื่อมีอยู่) root `memory.md` ตัวพิมพ์เล็กจะไม่ถูกฉีดเข้าไป; เป็นอินพุตซ่อมแซมแบบ legacy สำหรับ `openclaw doctor --fix` เมื่อจับคู่กับ `MEMORY.md` ไฟล์ขนาดใหญ่จะถูกตัดทอนด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และการฉีด bootstrap ทั้งหมดถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) ไฟล์รายวัน `memory/*.md` ไม่ได้เป็นส่วนหนึ่งของพรอมป์ bootstrap ปกติ; ไฟล์เหล่านั้นยังคงเรียกใช้ตามต้องการผ่านเครื่องมือหน่วยความจำในเทิร์นทั่วไป แต่การรันโมเดลแบบรีเซ็ต/เริ่มต้นสามารถเติมบล็อกบริบทเริ่มต้นแบบครั้งเดียวที่มีหน่วยความจำรายวันล่าสุดไว้ด้านหน้าสำหรับเทิร์นแรกนั้นได้ คำสั่งแชทเปล่า `/new` และ `/reset` จะได้รับการตอบรับโดยไม่เรียกใช้โมเดล prelude เริ่มต้นถูกควบคุมโดย `agents.defaults.startupContext`
- เวลา (UTC + เขตเวลาของผู้ใช้)
- แท็กการตอบกลับ + พฤติกรรม Heartbeat
- เมตาดาตารันไทม์ (host/OS/model/thinking)

ดูรายละเอียดแยกส่วนทั้งหมดได้ใน [พรอมป์ระบบ](/th/concepts/system-prompt)

## สิ่งที่นับในหน้าต่างบริบท

ทุกอย่างที่โมเดลได้รับจะนับรวมในขีดจำกัดบริบท:

- พรอมป์ระบบ (ทุกส่วนที่ระบุไว้ด้านบน)
- ประวัติการสนทนา (ข้อความผู้ใช้ + ผู้ช่วย)
- การเรียกใช้เครื่องมือและผลลัพธ์เครื่องมือ
- ไฟล์แนบ/ทรานสคริปต์ (รูปภาพ เสียง ไฟล์)
- สรุป Compaction และอาร์ติแฟกต์การตัดทอน
- wrapper ของผู้ให้บริการหรือ safety header (มองไม่เห็น แต่ยังถูกนับ)

บางพื้นผิวที่ใช้รันไทม์หนักมีขีดจำกัดชัดเจนของตัวเอง:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

การ override ราย agent อยู่ใต้ `agents.list[].contextLimits` knob เหล่านี้ใช้สำหรับข้อความคัดย่อรันไทม์แบบมีขอบเขตและบล็อกที่ถูกฉีดโดยรันไทม์เอง โดยแยกจากขีดจำกัด bootstrap, ขีดจำกัดบริบทเริ่มต้น และขีดจำกัดพรอมป์ Skills

สำหรับรูปภาพ OpenClaw จะย่อขนาด payload รูปภาพในทรานสคริปต์/เครื่องมือก่อนเรียกผู้ให้บริการ
ใช้ `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`) เพื่อปรับค่านี้:

- ค่าที่ต่ำลงมักลดการใช้ vision-token และขนาด payload
- ค่าที่สูงขึ้นจะรักษารายละเอียดภาพไว้มากขึ้นสำหรับภาพหน้าจอที่เน้น OCR/UI

สำหรับรายละเอียดเชิงปฏิบัติ (แยกตามไฟล์ที่ฉีด เครื่องมือ Skills และขนาดพรอมป์ระบบ) ใช้ `/context list` หรือ `/context detail` ดู [บริบท](/th/concepts/context)

## วิธีดูการใช้โทเค็นปัจจุบัน

ใช้คำสั่งเหล่านี้ในแชท:

- `/status` → **การ์ดสถานะที่มีอีโมจิจำนวนมาก** พร้อมโมเดลของเซสชัน การใช้บริบท
  โทเค็นอินพุต/เอาต์พุตของการตอบล่าสุด และ **ค่าใช้จ่ายโดยประมาณ** (เฉพาะ API key)
- `/usage off|tokens|full` → เพิ่ม **footer การใช้งานรายคำตอบ** ต่อท้ายทุกคำตอบ
  - คงอยู่ต่อเซสชัน (จัดเก็บเป็น `responseUsage`)
  - การยืนยันตัวตน OAuth **ซ่อนค่าใช้จ่าย** (แสดงเฉพาะโทเค็น)
- `/usage cost` → แสดงสรุปค่าใช้จ่ายแบบ local จาก log เซสชัน OpenClaw

พื้นผิวอื่นๆ:

- **TUI/Web TUI:** รองรับ `/status` + `/usage`
- **CLI:** `openclaw status --usage` และ `openclaw channels list` แสดง
  หน้าต่างโควตาผู้ให้บริการแบบ normalize (`เหลือ X%` ไม่ใช่ค่าใช้จ่ายรายคำตอบ)
  ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai

พื้นผิวการใช้งานจะ normalize alias ของฟิลด์ native ทั่วไปจากผู้ให้บริการก่อนแสดงผล
สำหรับทราฟฟิก Responses ตระกูล OpenAI ซึ่งรวมทั้ง `input_tokens` /
`output_tokens` และ `prompt_tokens` / `completion_tokens` ดังนั้นชื่อฟิลด์เฉพาะ transport
จะไม่เปลี่ยน `/status`, `/usage` หรือสรุปเซสชัน
การใช้งาน JSON ของ Gemini CLI ก็ถูก normalize เช่นกัน: ข้อความตอบกลับมาจาก `response` และ
`stats.cached` จะ map ไปยัง `cacheRead` โดยใช้ `stats.input_tokens - stats.cached`
เมื่อ CLI ละฟิลด์ `stats.input` ที่ชัดเจน
สำหรับทราฟฟิก Responses native ตระกูล OpenAI alias การใช้งาน WebSocket/SSE จะถูก
normalize แบบเดียวกัน และยอดรวมจะ fallback ไปยังอินพุต + เอาต์พุตที่ normalize แล้วเมื่อ
`total_tokens` ขาดหายหรือเป็น `0`
เมื่อ snapshot เซสชันปัจจุบันมีข้อมูลน้อย `/status` และ `session_status` ยังสามารถ
กู้คืนตัวนับโทเค็น/แคชและป้ายชื่อโมเดลรันไทม์ที่ใช้งานอยู่จาก log การใช้งานทรานสคริปต์
ล่าสุดได้ ค่า live ที่ไม่เป็นศูนย์ที่มีอยู่ยังคงมีลำดับความสำคัญเหนือค่า fallback จากทรานสคริปต์
และยอดรวมทรานสคริปต์ที่เน้นพรอมป์ซึ่งมีค่ามากกว่าสามารถชนะได้เมื่อยอดรวมที่จัดเก็บ
ขาดหายหรือเล็กกว่า
การยืนยันตัวตนการใช้งานสำหรับหน้าต่างโควตาผู้ให้บริการมาจาก hook เฉพาะผู้ให้บริการเมื่อ
พร้อมใช้งาน; ไม่เช่นนั้น OpenClaw จะ fallback ไปจับคู่ข้อมูลประจำตัว OAuth/API-key
จาก auth profile, env หรือ config
รายการทรานสคริปต์ของผู้ช่วยจะคงรูปแบบการใช้งานที่ normalize เดียวกัน รวมถึง
`usage.cost` เมื่อโมเดลที่ใช้งานอยู่มีการกำหนดราคาและผู้ให้บริการ
ส่งคืนเมตาดาตาการใช้งาน ซึ่งทำให้ `/usage cost` และสถานะเซสชันที่อิงทรานสคริปต์
มีแหล่งข้อมูลที่เสถียรแม้หลังจากสถานะรันไทม์ live หายไปแล้ว

OpenClaw แยกการบัญชีการใช้งานของผู้ให้บริการออกจาก snapshot บริบทปัจจุบัน
`usage.total` ของผู้ให้บริการอาจรวมอินพุตที่แคชแล้ว เอาต์พุต และการเรียกโมเดลหลายครั้งใน
tool-loop จึงมีประโยชน์สำหรับค่าใช้จ่ายและ telemetry แต่อาจประเมินหน้าต่างบริบท live
สูงเกินจริง การแสดงบริบทและการวินิจฉัยใช้ snapshot พรอมป์ล่าสุด
(`promptTokens` หรือการเรียกโมเดลล่าสุดเมื่อไม่มี snapshot พรอมป์)
สำหรับ `context.used`

## การประมาณค่าใช้จ่าย (เมื่อแสดง)

ค่าใช้จ่ายประมาณจาก config ราคาของโมเดลของคุณ:

```
models.providers.<provider>.models[].cost
```

ค่านี้คือ **USD ต่อ 1M โทเค็น** สำหรับ `input`, `output`, `cacheRead` และ
`cacheWrite` หากไม่มีราคา OpenClaw จะแสดงเฉพาะโทเค็นเท่านั้น โทเค็น OAuth
จะไม่แสดงค่าใช้จ่ายเป็นดอลลาร์

หลังจาก sidecar และ channel เข้าสู่เส้นทาง Gateway พร้อมใช้งาน OpenClaw จะเริ่ม
pricing bootstrap เบื้องหลังที่เลือกได้สำหรับ model ref ที่กำหนดค่าไว้ซึ่งยังไม่มีราคา local
bootstrap นั้นจะดึง catalog ราคา OpenRouter และ LiteLLM จากระยะไกล ตั้งค่า
`models.pricing.enabled: false` เพื่อข้ามการดึง catalog เหล่านั้นบนเครือข่ายแบบ offline
หรือจำกัดการเข้าถึง; รายการ `models.providers.*.models[].cost` ที่ระบุชัดเจน
ยังคงขับเคลื่อนการประมาณค่าใช้จ่าย local ต่อไป

## Cache TTL และผลกระทบจากการตัดแต่ง

การแคชพรอมป์ของผู้ให้บริการจะใช้ได้เฉพาะภายในหน้าต่าง cache TTL เท่านั้น OpenClaw สามารถ
รัน **การตัดแต่ง cache-ttl** ได้ตามต้องการ: จะตัดแต่งเซสชันเมื่อ cache TTL
หมดอายุแล้ว จากนั้นรีเซ็ตหน้าต่างแคชเพื่อให้คำขอถัดไปสามารถใช้บริบทที่เพิ่งแคชใหม่
แทนการแคชประวัติทั้งหมดซ้ำ วิธีนี้ช่วยลดค่าใช้จ่ายการเขียนแคชเมื่อเซสชันว่างนานกว่า TTL

กำหนดค่าใน [การกำหนดค่า Gateway](/th/gateway/configuration) และดูรายละเอียดพฤติกรรมใน
[การตัดแต่งเซสชัน](/th/concepts/session-pruning)

Heartbeat สามารถทำให้แคช **warm** ข้ามช่วงว่างได้ หาก cache TTL ของโมเดลคุณ
คือ `1h` การตั้งช่วง Heartbeat ให้ต่ำกว่านั้นเล็กน้อย (เช่น `55m`) สามารถหลีกเลี่ยง
การแคชพรอมป์ทั้งหมดซ้ำ ลดค่าใช้จ่ายการเขียนแคชได้

ในการตั้งค่าแบบ multi-agent คุณสามารถใช้ config โมเดลที่ใช้ร่วมกันหนึ่งชุดและปรับพฤติกรรมแคช
ราย agent ด้วย `agents.list[].params.cacheRetention`

สำหรับคู่มือ knob-by-knob ฉบับเต็ม ดู [การแคชพรอมป์](/th/reference/prompt-caching)

สำหรับราคาของ Anthropic API การอ่านแคชมีราคาถูกกว่าโทเค็นอินพุตอย่างมีนัยสำคัญ
ขณะที่การเขียนแคชถูกคิดเงินด้วยตัวคูณที่สูงกว่า ดูราคาการแคชพรอมป์ของ Anthropic
สำหรับอัตราและตัวคูณ TTL ล่าสุด:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### ตัวอย่าง: ทำให้แคช 1h warm ด้วย Heartbeat

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

### ตัวอย่าง: ทราฟฟิกแบบผสมพร้อมกลยุทธ์แคชราย agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` จะ merge ทับบน `params` ของโมเดลที่เลือก ดังนั้นคุณสามารถ
override เฉพาะ `cacheRetention` และสืบทอดค่าเริ่มต้นอื่นๆ ของโมเดลไว้เหมือนเดิม

### ตัวอย่าง: เปิดใช้ header เบต้า Anthropic 1M context

หน้าต่างบริบท 1M ของ Anthropic ขณะนี้ถูกจำกัดด้วยเบต้า OpenClaw สามารถฉีดค่า
`anthropic-beta` ที่จำเป็นเมื่อคุณเปิดใช้ `context1m` บนโมเดล Opus
หรือ Sonnet ที่รองรับ

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

สิ่งนี้ map ไปยัง beta header `context-1m-2025-08-07` ของ Anthropic

สิ่งนี้มีผลเฉพาะเมื่อมีการตั้ง `context1m: true` บนรายการโมเดลนั้น

ข้อกำหนด: ข้อมูลประจำตัวต้องมีสิทธิ์ใช้งาน long-context หากไม่มีสิทธิ์
Anthropic จะตอบกลับด้วยข้อผิดพลาด rate limit ฝั่งผู้ให้บริการสำหรับคำขอนั้น

หากคุณยืนยันตัวตน Anthropic ด้วยโทเค็น OAuth/subscription (`sk-ant-oat-*`)
OpenClaw จะข้าม beta header `context-1m-*` เพราะ Anthropic ในปัจจุบัน
ปฏิเสธชุดค่านี้ด้วย HTTP 401

## เคล็ดลับสำหรับลดแรงกดดันด้านโทเค็น

- ใช้ `/compact` เพื่อสรุปเซสชันยาวๆ
- ตัดเอาต์พุตเครื่องมือขนาดใหญ่ใน workflow ของคุณให้สั้นลง
- ลด `agents.defaults.imageMaxDimensionPx` สำหรับเซสชันที่มีภาพหน้าจอจำนวนมาก
- ทำให้คำอธิบาย Skills สั้น (รายการ Skills ถูกฉีดเข้าในพรอมป์)
- เลือกใช้โมเดลที่เล็กกว่าสำหรับงานสำรวจที่มีข้อความจำนวนมาก

ดู [Skills](/th/tools/skills) สำหรับสูตร overhead ของรายการ Skills ที่แน่นอน

## ที่เกี่ยวข้อง

- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
- [การแคชพรอมป์](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
