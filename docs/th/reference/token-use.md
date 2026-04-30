---
read_when:
    - การอธิบายการใช้งานโทเค็น ค่าใช้จ่าย หรือหน้าต่างบริบท
    - การดีบักการเพิ่มขึ้นของบริบทหรือพฤติกรรมของ Compaction
summary: วิธีที่ OpenClaw สร้างบริบทพรอมป์และรายงานการใช้โทเค็น + ค่าใช้จ่าย
title: การใช้โทเค็นและค่าใช้จ่าย
x-i18n:
    generated_at: "2026-04-30T10:16:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# การใช้โทเค็นและค่าใช้จ่าย

OpenClaw ติดตาม **โทเค็น** ไม่ใช่อักขระ โทเค็นขึ้นอยู่กับแต่ละโมเดล แต่โมเดลส่วนใหญ่
แบบ OpenAI-style โดยเฉลี่ยอยู่ที่ประมาณ 4 อักขระต่อหนึ่งโทเค็นสำหรับข้อความภาษาอังกฤษ

## วิธีสร้างพรอมป์ต์ระบบ

OpenClaw ประกอบพรอมป์ต์ระบบของตัวเองในการรันทุกครั้ง โดยมี:

- รายการเครื่องมือ + คำอธิบายสั้น
- รายการ Skills (เฉพาะ metadata; คำสั่งจะถูกโหลดเมื่อต้องการด้วย `read`)
  บล็อก Skills แบบกะทัดรัดถูกจำกัดโดย `skills.limits.maxSkillsPromptChars`
  พร้อมการ override ต่อ agent ที่เป็นตัวเลือกได้ที่
  `agents.list[].skillsLimits.maxSkillsPromptChars`
- คำสั่งสำหรับอัปเดตตัวเอง
- workspace + ไฟล์ bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` เมื่อเป็นของใหม่ รวมถึง `MEMORY.md` เมื่อมีอยู่) root `memory.md` ตัวพิมพ์เล็กจะไม่ถูกฉีดเข้าไป; มันเป็นอินพุตซ่อมแซม legacy สำหรับ `openclaw doctor --fix` เมื่อจับคู่กับ `MEMORY.md` ไฟล์ขนาดใหญ่จะถูกตัดทอนด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 12000) และการฉีด bootstrap ทั้งหมดถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) ไฟล์รายวัน `memory/*.md` ไม่ได้เป็นส่วนหนึ่งของพรอมป์ต์ bootstrap ปกติ; ไฟล์เหล่านี้ยังคงเรียกใช้ตามต้องการผ่านเครื่องมือ memory ในรอบปกติ แต่การรันโมเดลแบบ reset/startup สามารถเติมบล็อก startup-context แบบครั้งเดียวที่มีหน่วยความจำรายวันล่าสุดไว้ข้างหน้าสำหรับรอบแรกนั้นได้ คำสั่งแชทเปล่า `/new` และ `/reset` จะได้รับการตอบรับโดยไม่เรียกใช้โมเดล startup prelude ถูกควบคุมโดย `agents.defaults.startupContext`
- เวลา (UTC + เขตเวลาของผู้ใช้)
- แท็กตอบกลับ + พฤติกรรม Heartbeat
- metadata ของ runtime (host/OS/model/thinking)

ดูรายละเอียดเต็มใน [พรอมป์ต์ระบบ](/th/concepts/system-prompt)

## สิ่งที่นับในหน้าต่างบริบท

ทุกอย่างที่โมเดลได้รับจะนับรวมในขีดจำกัดบริบท:

- พรอมป์ต์ระบบ (ทุกส่วนที่ระบุไว้ข้างต้น)
- ประวัติการสนทนา (ข้อความของผู้ใช้ + assistant)
- การเรียกเครื่องมือและผลลัพธ์เครื่องมือ
- ไฟล์แนบ/ถอดความ (รูปภาพ เสียง ไฟล์)
- สรุป Compaction และ artifact จากการตัดแต่ง
- wrapper ของผู้ให้บริการหรือ header ความปลอดภัย (มองไม่เห็น แต่ยังถูกนับ)

surface บางอย่างที่หนักด้าน runtime มีขีดจำกัดชัดเจนของตัวเอง:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

การ override ต่อ agent อยู่ใต้ `agents.list[].contextLimits` knob เหล่านี้มีไว้
สำหรับ excerpt runtime ที่มีขอบเขตและบล็อกที่ runtime เป็นเจ้าของซึ่งถูกฉีดเข้าไป
โดยแยกจากขีดจำกัด bootstrap, ขีดจำกัด startup-context และขีดจำกัดพรอมป์ต์ Skills

สำหรับรูปภาพ OpenClaw จะย่อขนาด payload รูปภาพจาก transcript/เครื่องมือก่อนเรียกผู้ให้บริการ
ใช้ `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`) เพื่อปรับค่านี้:

- ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload
- ค่าที่สูงกว่ารักษารายละเอียดภาพได้มากขึ้นสำหรับภาพหน้าจอที่เน้น OCR/UI

สำหรับรายละเอียดเชิงปฏิบัติ (ต่อไฟล์ที่ฉีดเข้าไป เครื่องมือ Skills และขนาดพรอมป์ต์ระบบ) ให้ใช้ `/context list` หรือ `/context detail` ดู [บริบท](/th/concepts/context)

## วิธีดูการใช้โทเค็นปัจจุบัน

ใช้สิ่งเหล่านี้ในแชท:

- `/status` → **การ์ดสถานะที่มีอีโมจิจำนวนมาก** พร้อมโมเดลของเซสชัน การใช้บริบท
  โทเค็นอินพุต/เอาต์พุตของคำตอบล่าสุด และ **ค่าใช้จ่ายโดยประมาณ** (เฉพาะ API key)
- `/usage off|tokens|full` → เพิ่ม **footer การใช้งานต่อคำตอบ** ต่อท้ายทุกคำตอบ
  - คงอยู่ต่อเซสชัน (จัดเก็บเป็น `responseUsage`)
  - การยืนยันตัวตนแบบ OAuth **ซ่อนค่าใช้จ่าย** (แสดงเฉพาะโทเค็น)
- `/usage cost` → แสดงสรุปค่าใช้จ่ายภายในเครื่องจาก log เซสชันของ OpenClaw

surface อื่น:

- **TUI/Web TUI:** รองรับ `/status` + `/usage`
- **CLI:** `openclaw status --usage` และ `openclaw channels list` แสดง
  หน้าต่าง quota ของผู้ให้บริการที่ normalize แล้ว (`X% left` ไม่ใช่ค่าใช้จ่ายต่อคำตอบ)
  ผู้ให้บริการ usage-window ปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai

surface การใช้งานจะ normalize alias ฟิลด์ที่มาจากผู้ให้บริการโดยตรงก่อนแสดงผล
สำหรับ traffic ของ OpenAI-family Responses จะรวมทั้ง `input_tokens` /
`output_tokens` และ `prompt_tokens` / `completion_tokens` ดังนั้นชื่อฟิลด์เฉพาะ transport
จะไม่เปลี่ยน `/status`, `/usage` หรือสรุปเซสชัน
การใช้งาน JSON ของ Gemini CLI ก็ถูก normalize เช่นกัน: ข้อความตอบกลับมาจาก `response` และ
`stats.cached` map ไปยัง `cacheRead` โดยใช้ `stats.input_tokens - stats.cached`
เมื่อ CLI ไม่ได้ให้ฟิลด์ `stats.input` อย่างชัดเจน
สำหรับ traffic ของ OpenAI-family Responses แบบ native alias การใช้งาน WebSocket/SSE จะถูก
normalize ด้วยวิธีเดียวกัน และยอดรวมจะ fallback ไปเป็นอินพุต + เอาต์พุตที่ normalize แล้วเมื่อ
`total_tokens` หายไปหรือเป็น `0`
เมื่อ snapshot ของเซสชันปัจจุบันมีข้อมูลเบาบาง `/status` และ `session_status` ยังสามารถ
กู้คืนตัวนับ token/cache และป้ายกำกับโมเดล runtime ที่ใช้งานอยู่จาก log การใช้งาน transcript
ล่าสุดได้ ค่า live ที่ไม่เป็นศูนย์ซึ่งมีอยู่ยังคงมีลำดับความสำคัญเหนือค่า fallback จาก transcript
และยอดรวม transcript ที่เน้นพรอมป์ต์ซึ่งมีขนาดใหญ่กว่าสามารถชนะได้เมื่อยอดรวมที่จัดเก็บหายไปหรือเล็กกว่า
auth การใช้งานสำหรับหน้าต่าง quota ของผู้ให้บริการมาจาก hook เฉพาะผู้ให้บริการเมื่อมีอยู่
มิฉะนั้น OpenClaw จะ fallback ไปจับคู่ credential แบบ OAuth/API-key
จาก auth profile, env หรือ config
รายการ transcript ของ assistant จะคงรูปแบบการใช้งานที่ normalize แล้วเดียวกัน รวมถึง
`usage.cost` เมื่อโมเดลที่ใช้งานอยู่มีการกำหนดราคาไว้และผู้ให้บริการ
ส่งคืน metadata การใช้งาน สิ่งนี้ทำให้ `/usage cost` และสถานะเซสชันที่อ้างอิง transcript
มีแหล่งข้อมูลที่เสถียรแม้หลังจากสถานะ runtime สดหายไปแล้ว

OpenClaw แยกบัญชีการใช้งานของผู้ให้บริการออกจาก snapshot บริบทปัจจุบัน
`usage.total` ของผู้ให้บริการอาจรวมอินพุตที่แคชไว้ เอาต์พุต และการเรียกโมเดลหลายครั้งใน tool-loop
ดังนั้นจึงมีประโยชน์สำหรับค่าใช้จ่ายและ telemetry แต่อาจประเมินหน้าต่างบริบทสดสูงเกินจริง
การแสดงบริบทและการวินิจฉัยใช้ snapshot พรอมป์ต์ล่าสุด
(`promptTokens` หรือการเรียกโมเดลล่าสุดเมื่อไม่มี snapshot พรอมป์ต์)
สำหรับ `context.used`

## การประเมินค่าใช้จ่าย (เมื่อแสดง)

ค่าใช้จ่ายจะถูกประเมินจาก config ราคาของโมเดลของคุณ:

```
models.providers.<provider>.models[].cost
```

ค่าเหล่านี้คือ **USD ต่อ 1M โทเค็น** สำหรับ `input`, `output`, `cacheRead` และ
`cacheWrite` ถ้าไม่มีราคา OpenClaw จะแสดงเฉพาะโทเค็นเท่านั้น โทเค็น OAuth
จะไม่แสดงค่าใช้จ่ายเป็นดอลลาร์

การเริ่มต้น Gateway ยังทำ bootstrap ราคาเบื้องหลังแบบเป็นตัวเลือกสำหรับ
model refs ที่กำหนดค่าไว้ซึ่งยังไม่มีราคาภายในเครื่อง bootstrap นี้
ดึง catalog ราคา OpenRouter และ LiteLLM จากระยะไกล ตั้งค่า
`models.pricing.enabled: false` เพื่อข้ามการดึง catalog ตอนเริ่มต้นเหล่านั้นบนเครือข่ายแบบ offline
หรือถูกจำกัด; รายการ `models.providers.*.models[].cost` ที่ระบุชัดเจน
ยังคงขับเคลื่อนการประเมินค่าใช้จ่ายภายในเครื่องต่อไป

## Cache TTL และผลกระทบจากการตัดแต่ง

การแคชพรอมป์ต์ของผู้ให้บริการจะใช้ได้เฉพาะภายในหน้าต่าง cache TTL เท่านั้น OpenClaw สามารถ
รัน **cache-ttl pruning** แบบเป็นตัวเลือกได้: มันจะตัดแต่งเซสชันเมื่อ cache TTL
หมดอายุแล้ว จากนั้น reset หน้าต่างแคชเพื่อให้คำขอถัดไปสามารถใช้บริบทที่เพิ่งแคชใหม่
ซ้ำได้ แทนที่จะแคชประวัติทั้งหมดใหม่ สิ่งนี้ช่วยให้ค่าใช้จ่าย cache write ต่ำลง
เมื่อเซสชันว่างนานเกิน TTL

กำหนดค่าใน [การกำหนดค่า Gateway](/th/gateway/configuration) และดูรายละเอียดพฤติกรรมใน
[การตัดแต่งเซสชัน](/th/concepts/session-pruning)

Heartbeat สามารถทำให้แคช **อุ่น** ข้ามช่วงว่างได้ หาก cache TTL ของโมเดลของคุณ
คือ `1h` การตั้งช่วงเวลา Heartbeat ให้ต่ำกว่านั้นเล็กน้อย (เช่น `55m`) สามารถหลีกเลี่ยง
การแคชพรอมป์ต์ทั้งหมดใหม่ ลดค่าใช้จ่าย cache write ได้

ในการตั้งค่าแบบหลาย agent คุณสามารถใช้ config โมเดลร่วมกันหนึ่งชุดและปรับพฤติกรรมแคช
ต่อ agent ด้วย `agents.list[].params.cacheRetention`

สำหรับคู่มือครบถ้วนแบบ knob ต่อ knob ดู [การแคชพรอมป์ต์](/th/reference/prompt-caching)

สำหรับราคาของ Anthropic API การอ่านแคชมีราคาถูกกว่าโทเค็นอินพุตอย่างมีนัยสำคัญ
ขณะที่การเขียนแคชถูกคิดราคาด้วยตัวคูณที่สูงกว่า ดูราคาการแคชพรอมป์ต์ของ Anthropic
สำหรับอัตราล่าสุดและตัวคูณ TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### ตัวอย่าง: ทำให้แคช 1h อุ่นอยู่เสมอด้วย Heartbeat

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

### ตัวอย่าง: traffic แบบผสมพร้อมกลยุทธ์แคชต่อ agent

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

`agents.list[].params` merge ทับ `params` ของโมเดลที่เลือก ดังนั้นคุณสามารถ
override เฉพาะ `cacheRetention` และรับค่าเริ่มต้นอื่นของโมเดลสืบทอดมาโดยไม่เปลี่ยนแปลง

### ตัวอย่าง: เปิดใช้ header beta บริบท 1M ของ Anthropic

หน้าต่างบริบท 1M ของ Anthropic ปัจจุบันถูกกั้นด้วย beta OpenClaw สามารถฉีดค่า
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

สิ่งนี้ map ไปยัง header beta `context-1m-2025-08-07` ของ Anthropic

สิ่งนี้มีผลเฉพาะเมื่อมีการตั้ง `context1m: true` บนรายการโมเดลนั้น

ข้อกำหนด: credential ต้องมีสิทธิ์ใช้งาน long-context หากไม่มีสิทธิ์
Anthropic จะตอบกลับด้วยข้อผิดพลาด rate limit ฝั่งผู้ให้บริการสำหรับคำขอนั้น

หากคุณยืนยันตัวตน Anthropic ด้วยโทเค็น OAuth/subscription (`sk-ant-oat-*`)
OpenClaw จะข้าม header beta `context-1m-*` เพราะปัจจุบัน Anthropic
ปฏิเสธ combination นั้นด้วย HTTP 401

## เคล็ดลับเพื่อลดแรงกดดันด้านโทเค็น

- ใช้ `/compact` เพื่อสรุปเซสชันยาว
- ตัดผลลัพธ์เครื่องมือขนาดใหญ่ใน workflow ของคุณ
- ลด `agents.defaults.imageMaxDimensionPx` สำหรับเซสชันที่มีภาพหน้าจอจำนวนมาก
- ทำให้คำอธิบาย Skills สั้น (รายการ Skills ถูกฉีดเข้าไปในพรอมป์ต์)
- เลือกโมเดลขนาดเล็กกว่าสำหรับงานสำรวจที่มีเนื้อหายาว

ดู [Skills](/th/tools/skills) สำหรับสูตร overhead ที่แน่นอนของรายการ Skills

## ที่เกี่ยวข้อง

- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
- [การแคชพรอมป์ต์](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
