---
read_when:
    - การอธิบายการใช้โทเค็น ค่าใช้จ่าย หรือหน้าต่างบริบท
    - การดีบักการเพิ่มขึ้นของบริบทหรือพฤติกรรม Compaction
summary: วิธีที่ OpenClaw สร้างบริบทของพรอมป์และรายงานการใช้โทเค็น + ค่าใช้จ่าย
title: การใช้โทเค็นและค่าใช้จ่าย
x-i18n:
    generated_at: "2026-07-01T20:40:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw ติดตาม **tokens** ไม่ใช่อักขระ Tokens ขึ้นกับโมเดล แต่โมเดลส่วนใหญ่
ที่เป็นแบบ OpenAI เฉลี่ยประมาณ 4 อักขระต่อ token สำหรับข้อความภาษาอังกฤษ.

## วิธีสร้างพรอมป์ระบบ

OpenClaw ประกอบพรอมป์ระบบของตัวเองในทุกการรัน โดยประกอบด้วย:

- รายการเครื่องมือ + คำอธิบายสั้น
- รายการ Skills (เฉพาะเมทาดาทา; คำสั่งจะถูกโหลดตามต้องการด้วย `read`).
  เทิร์นของ Codex แบบเนทีฟจะได้รับบล็อก Skills แบบกะทัดรัดเป็นคำสั่งสำหรับนักพัฒนา
  ด้านการทำงานร่วมกันที่มีขอบเขตเฉพาะเทิร์น; harness อื่นจะได้รับสิ่งนี้ในพื้นผิว
  พรอมป์ปกติ โดยถูกจำกัดด้วย `skills.limits.maxSkillsPromptChars` พร้อม
  การ override ต่อ agent ที่เป็นทางเลือกได้ที่ `agents.list[].skillsLimits.maxSkillsPromptChars`.
- คำสั่งสำหรับการอัปเดตตัวเอง
- Workspace + ไฟล์ bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` เมื่อเป็นไฟล์ใหม่, รวมถึง `MEMORY.md` เมื่อมีอยู่). เทิร์นของ Codex แบบเนทีฟจะไม่วาง `MEMORY.md` ดิบจาก workspace ของ agent ที่กำหนดค่าไว้เมื่อมีเครื่องมือหน่วยความจำให้ใช้สำหรับ workspace นั้น; แต่จะรวมตัวชี้หน่วยความจำขนาดเล็กไว้ในคำสั่งสำหรับนักพัฒนาด้านการทำงานร่วมกันที่มีขอบเขตเฉพาะเทิร์น และใช้เครื่องมือหน่วยความจำตามต้องการ หากปิดใช้เครื่องมือ, ค้นหาหน่วยความจำไม่ได้, หรือ workspace ที่ใช้งานอยู่ต่างจาก workspace หน่วยความจำของ agent, `MEMORY.md` จะใช้เส้นทางบริบทเทิร์นแบบมีขอบเขตตามปกติ รากตัวพิมพ์เล็ก `memory.md` จะไม่ถูกฉีดเข้าไป; เป็นอินพุตซ่อมแซมแบบเดิมสำหรับ `openclaw doctor --fix` เมื่อจับคู่กับ `MEMORY.md` ไฟล์ขนาดใหญ่ที่ฉีดเข้าไปจะถูกตัดทอนโดย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 20000) และการฉีด bootstrap รวมทั้งหมดถูกจำกัดโดย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) ไฟล์รายวัน `memory/*.md` ไม่ได้เป็นส่วนหนึ่งของพรอมป์ bootstrap ปกติ; ไฟล์เหล่านี้ยังคงพร้อมใช้งานตามต้องการผ่านเครื่องมือหน่วยความจำในเทิร์นปกติ แต่การรันโมเดลแบบ reset/startup สามารถเติมบล็อกบริบทเริ่มต้นแบบใช้ครั้งเดียวพร้อมหน่วยความจำรายวันล่าสุดไว้ข้างหน้าสำหรับเทิร์นแรกนั้นได้ คำสั่งแชทล้วน `/new` และ `/reset` จะได้รับการตอบรับโดยไม่เรียกใช้โมเดล บทนำเริ่มต้นถูกควบคุมโดย `agents.defaults.startupContext` ข้อความตัดตอน AGENTS.md หลัง Compaction แยกต่างหากและต้อง opt-in อย่างชัดเจนด้วย `agents.defaults.compaction.postCompactionSections`.
- เวลา (UTC + เขตเวลาของผู้ใช้)
- แท็กตอบกลับ + พฤติกรรม Heartbeat
- เมทาดาทารันไทม์ (โฮสต์/OS/โมเดล/thinking)

ดูรายละเอียดทั้งหมดได้ใน [พรอมป์ระบบ](/th/concepts/system-prompt).

เมื่อจัดทำเอกสารเกี่ยวกับ credentials หรือ auth snippets ให้ใช้
[ข้อตกลง Secret Placeholder](/th/reference/secret-placeholder-conventions) เพื่อ
หลีกเลี่ยง false positive จาก secret-scanner ในการเปลี่ยนแปลงเฉพาะเอกสาร.

## สิ่งที่นับรวมในหน้าต่างบริบท

ทุกอย่างที่โมเดลได้รับจะนับรวมในขีดจำกัดบริบท:

- พรอมป์ระบบ (ทุกส่วนที่ระบุไว้ข้างต้น)
- ประวัติการสนทนา (ข้อความของผู้ใช้ + assistant)
- การเรียกใช้เครื่องมือและผลลัพธ์เครื่องมือ
- ไฟล์แนบ/transcripts (รูปภาพ, เสียง, ไฟล์)
- สรุป Compaction และ artifacts จากการตัดแต่ง
- wrappers ของผู้ให้บริการหรือส่วนหัวความปลอดภัย (มองไม่เห็น แต่ยังถูกนับ)

พื้นผิวบางส่วนที่ใช้รันไทม์หนักมีขีดจำกัดชัดเจนของตัวเอง:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

การ override ต่อ agent อยู่ภายใต้ `agents.list[].contextLimits` knobs เหล่านี้
ใช้สำหรับข้อความตัดตอนรันไทม์แบบมีขอบเขตและบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูกฉีดเข้าไป
แยกจากขีดจำกัด bootstrap, ขีดจำกัดบริบทเริ่มต้น, และขีดจำกัดพรอมป์ Skills.

`toolResultMaxChars` เป็นเพดานขั้นสูง (สูงสุด `1000000` อักขระ). เมื่อไม่ได้ตั้งค่าไว้ OpenClaw จะเลือก
ขีดจำกัดผลลัพธ์เครื่องมือแบบสดจากหน้าต่างบริบทของโมเดลที่มีผล: `16000` อักขระ
เมื่ออยู่ต่ำกว่า 100K tokens, `32000` อักขระที่ 100K+ tokens, และ `64000` อักขระที่ 200K+
tokens โดยยังถูกจำกัดด้วยตัวป้องกันส่วนแบ่งบริบทของรันไทม์.

สำหรับรูปภาพ OpenClaw จะย่อขนาด payload รูปภาพของ transcript/tool ก่อนเรียกผู้ให้บริการ
ใช้ `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`) เพื่อปรับแต่งสิ่งนี้:

- ค่าที่ต่ำลงมักลดการใช้ vision-token และขนาด payload.
- ค่าที่สูงขึ้นรักษารายละเอียดภาพไว้มากขึ้นสำหรับภาพหน้าจอที่หนักด้าน OCR/UI.

สำหรับรายละเอียดเชิงปฏิบัติ (ต่อไฟล์ที่ฉีดเข้าไป, เครื่องมือ, Skills, และขนาดพรอมป์ระบบ) ให้ใช้ `/context list` หรือ `/context detail` ดู [บริบท](/th/concepts/context).

## วิธีดูการใช้ token ปัจจุบัน

ใช้สิ่งเหล่านี้ในแชท:

- `/status` → **การ์ดสถานะแบบมีอีโมจิหลากหลาย** พร้อมโมเดลของเซสชัน, การใช้บริบท,
  tokens อินพุต/เอาต์พุตของคำตอบล่าสุด, และ **ต้นทุนโดยประมาณ** เมื่อมีการกำหนดค่าราคาในเครื่อง
  สำหรับโมเดลที่ใช้งานอยู่.
- `/usage off|tokens|full` → เพิ่ม **ส่วนท้ายการใช้งานต่อคำตอบ** ในทุกคำตอบ.
  - คงอยู่ต่อเซสชัน (จัดเก็บเป็น `responseUsage`).
  - `/usage reset` (aliases: `inherit`, `clear`, `default`) — ล้างการ override ของเซสชัน
    เพื่อให้เซสชันกลับไปรับค่าเริ่มต้นที่กำหนดค่าไว้อีกครั้ง.
  - `/usage tokens` แสดงรายละเอียด token/cache ของเทิร์น.
  - `/usage full` แสดงรายละเอียดโมเดล/บริบท/ต้นทุนแบบกะทัดรัด; ต้นทุนโดยประมาณจะปรากฏ
    เฉพาะเมื่อ OpenClaw มีเมทาดาทาการใช้งานและราคาท้องถิ่นสำหรับโมเดลที่ใช้งานอยู่.
    เลย์เอาต์ `messages.usageTemplate` แบบกำหนดเองสามารถรวมฟิลด์ token/cache ได้.
- `/usage cost` → แสดงสรุปต้นทุนในเครื่องจากบันทึกเซสชันของ OpenClaw.

พื้นผิวอื่น:

- **TUI/Web TUI:** รองรับ `/status` + `/usage`.
- **CLI:** `openclaw status --usage` และ `openclaw channels list` แสดง
  หน้าต่างโควตาผู้ให้บริการแบบ normalize (`X% left`, ไม่ใช่ต้นทุนต่อคำตอบ).
  ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, และ z.ai.

พื้นผิวการใช้งานจะ normalize aliases ของฟิลด์เนทีฟของผู้ให้บริการที่พบบ่อยก่อนแสดงผล.
สำหรับทราฟฟิก Responses ตระกูล OpenAI สิ่งนี้รวมทั้ง `input_tokens` /
`output_tokens` และ `prompt_tokens` / `completion_tokens` ดังนั้นชื่อฟิลด์เฉพาะ transport
จะไม่เปลี่ยน `/status`, `/usage`, หรือสรุปเซสชัน.
การใช้งาน Gemini CLI ก็ถูก normalize เช่นกัน: parser เริ่มต้น `stream-json` อ่าน
เหตุการณ์ `message` ของ assistant และ `stats.cached` map ไปยัง `cacheRead` โดยใช้
`stats.input_tokens - stats.cached` เมื่อ CLI ไม่ระบุฟิลด์ `stats.input` อย่างชัดเจน
การ override JSON แบบเดิมยังอ่านข้อความตอบกลับจาก
`response`.
สำหรับทราฟฟิก Responses ตระกูล OpenAI แบบเนทีฟ aliases การใช้งานของ WebSocket/SSE จะถูก
normalize แบบเดียวกัน และยอดรวมจะ fallback ไปที่อินพุต + เอาต์พุตที่ normalize แล้วเมื่อ
`total_tokens` หายไปหรือเป็น `0`.
เมื่อ snapshot เซสชันปัจจุบันมีข้อมูลเบาบาง, `/status` และ `session_status` ยังสามารถ
กู้คืนตัวนับ token/cache และป้ายกำกับโมเดลรันไทม์ที่ใช้งานอยู่จาก
บันทึกการใช้งาน transcript ล่าสุดได้ด้วย ค่าสดที่ไม่เป็นศูนย์ที่มีอยู่ยังคง
มีลำดับความสำคัญเหนือค่า fallback จาก transcript และยอดรวม transcript ที่เน้น prompt และมีขนาดใหญ่กว่า
สามารถชนะได้เมื่อยอดรวมที่จัดเก็บหายไปหรือเล็กกว่า.
auth การใช้งานสำหรับหน้าต่างโควตาผู้ให้บริการมาจาก hooks เฉพาะผู้ให้บริการเมื่อ
พร้อมใช้งาน; มิฉะนั้น OpenClaw จะ fallback ไปจับคู่ credentials แบบ OAuth/API-key
จาก auth profiles, env, หรือ config.
รายการ transcript ของ assistant จะเก็บรูปทรงการใช้งานที่ normalize แบบเดียวกัน รวมถึง
`usage.cost` เมื่อโมเดลที่ใช้งานอยู่มีการกำหนดราคาไว้และผู้ให้บริการ
ส่งคืนเมทาดาทาการใช้งาน สิ่งนี้ทำให้ `/usage cost` และสถานะเซสชันที่อิง transcript
มีแหล่งข้อมูลที่เสถียรแม้หลังจากสถานะรันไทม์สดหายไปแล้ว.

OpenClaw แยกการคำนวณการใช้งานของผู้ให้บริการออกจาก snapshot บริบทปัจจุบัน.
`usage.total` ของผู้ให้บริการอาจรวมอินพุตที่ cache, เอาต์พุต, และการเรียกโมเดล
ในลูปเครื่องมือหลายครั้ง ดังนั้นจึงมีประโยชน์ต่อการคำนวณต้นทุนและ telemetry แต่อาจประเมิน
หน้าต่างบริบทสดสูงเกินจริง การแสดงบริบทและ diagnostics ใช้ snapshot พรอมป์ล่าสุด
(`promptTokens`, หรือการเรียกโมเดลล่าสุดเมื่อไม่มี snapshot พรอมป์
พร้อมใช้งาน) สำหรับ `context.used`.

## การประมาณต้นทุน (เมื่อแสดง)

ต้นทุนประมาณจากการกำหนดค่าราคาโมเดลของคุณ:

```
models.providers.<provider>.models[].cost
```

ค่าเหล่านี้คือ **USD ต่อ 1M tokens** สำหรับ `input`, `output`, `cacheRead`, และ
`cacheWrite` หากไม่มีราคา `/usage full` จะละเว้นต้นทุน; ใช้ `/usage tokens`
หรือ `messages.usageTemplate` แบบกำหนดเองเมื่อคุณต้องการรายละเอียด token/cache ในทุก
คำตอบ การแสดงต้นทุนไม่ได้จำกัดอยู่ที่ auth แบบ API-key: ผู้ให้บริการที่ไม่ใช่ API-key เช่น
`aws-sdk` สามารถแสดงต้นทุนโดยประมาณได้เมื่อรายการโมเดลที่กำหนดค่าไว้มี
ราคาท้องถิ่นและผู้ให้บริการส่งคืนเมทาดาทาการใช้งาน.

หลังจาก sidecars และช่องทางเข้าสู่เส้นทาง Gateway ready แล้ว OpenClaw จะเริ่ม
bootstrap ราคาพื้นหลังแบบทางเลือกสำหรับ refs โมเดลที่กำหนดค่าไว้ซึ่งยังไม่มี
ราคาท้องถิ่น bootstrap นั้นดึง catalogs ราคาจาก OpenRouter และ LiteLLM ระยะไกล
ตั้งค่า `models.pricing.enabled: false` เพื่อข้ามการดึง catalogs เหล่านั้น
บนเครือข่ายออฟไลน์หรือถูกจำกัด; รายการ
`models.providers.*.models[].cost` ที่ระบุชัดเจนยังคงใช้ขับเคลื่อนการประมาณต้นทุน
ในเครื่อง.

## ผลกระทบของ Cache TTL และการตัดแต่ง

การ cache พรอมป์ของผู้ให้บริการมีผลเฉพาะภายในหน้าต่าง cache TTL เท่านั้น OpenClaw สามารถ
เลือกเรียกใช้ **cache-ttl pruning**: โดยจะตัดแต่งเซสชันเมื่อ cache TTL
หมดอายุ จากนั้นรีเซ็ตหน้าต่าง cache เพื่อให้คำขอถัดไปสามารถใช้บริบทที่เพิ่ง cache ใหม่
แทนการ cache ประวัติทั้งหมดซ้ำ สิ่งนี้ช่วยลดต้นทุน cache write
เมื่อเซสชันว่างเกิน TTL.

กำหนดค่าใน [การกำหนดค่า Gateway](/th/gateway/configuration) และดู
รายละเอียดพฤติกรรมใน [การตัดแต่งเซสชัน](/th/concepts/session-pruning).

Heartbeat สามารถทำให้ cache **warm** ข้ามช่วงว่างได้ หาก cache TTL ของโมเดลคุณ
คือ `1h` การตั้งช่วง Heartbeat ให้ต่ำกว่านั้นเล็กน้อย (เช่น `55m`) สามารถหลีกเลี่ยง
การ cache พรอมป์ทั้งหมดซ้ำ และลดต้นทุน cache write.

ในการตั้งค่าแบบหลาย agent คุณสามารถใช้ config โมเดลร่วมหนึ่งชุดและปรับพฤติกรรม cache
ต่อ agent ด้วย `agents.list[].params.cacheRetention`.

สำหรับคู่มือแบบครบทุก knob โปรดดู [การ Cache พรอมป์](/th/reference/prompt-caching).

สำหรับราคา Anthropic API การอ่าน cache ถูกกว่า input
tokens อย่างมีนัยสำคัญ ขณะที่การเขียน cache ถูกเรียกเก็บด้วยตัวคูณที่สูงกว่า ดูราคา
prompt caching ของ Anthropic สำหรับอัตราและตัวคูณ TTL ล่าสุด:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### ตัวอย่าง: ทำให้ cache 1h warm ด้วย Heartbeat

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

### ตัวอย่าง: ทราฟฟิกผสมพร้อมกลยุทธ์ cache ต่อ agent

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

`agents.list[].params` merge ทับ `params` ของโมเดลที่เลือก ดังนั้นคุณจึงสามารถ
override เฉพาะ `cacheRetention` และรับค่าเริ่มต้นอื่นของโมเดลไว้เหมือนเดิม.

### บริบท 1M ของ Anthropic

OpenClaw กำหนดขนาดโมเดล Claude 4.x ที่รองรับ GA เช่น Opus 4.8, Opus 4.7, Opus 4.6, และ
Sonnet 4.6 ด้วยหน้าต่างบริบท 1M ของ Anthropic คุณไม่จำเป็นต้องใช้
`params.context1m: true` สำหรับโมเดลเหล่านั้น.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

config รุ่นเก่าสามารถคง `context1m: true` ไว้ได้ แต่ OpenClaw จะไม่ส่ง
beta header `context-1m-2025-08-07` ที่ Anthropic เลิกใช้แล้วสำหรับการตั้งค่านี้อีกต่อไป และ
จะไม่ขยายโมเดล Claude รุ่นเก่าที่ไม่รองรับเป็น 1M.

ข้อกำหนด: credential ต้องมีสิทธิ์ใช้งาน long-context หากไม่ใช่
Anthropic จะตอบกลับด้วยข้อผิดพลาด rate limit ฝั่งผู้ให้บริการสำหรับคำขอนั้น.

หากคุณ authenticate Anthropic ด้วย tokens แบบ OAuth/subscription (`sk-ant-oat-*`),
OpenClaw จะเก็บ Anthropic beta headers ที่ OAuth ต้องใช้ไว้ ขณะเดียวกันก็ลบ
beta `context-1m-*` ที่เลิกใช้แล้วหากยังคงอยู่ใน config รุ่นเก่า.

## เคล็ดลับในการลดแรงกดดันของ token

- ใช้ `/compact` เพื่อสรุปเซสชันที่ยาว
- ตัดทอนเอาต์พุตจากเครื่องมือที่มีขนาดใหญ่ในเวิร์กโฟลว์ของคุณ
- ลด `agents.defaults.imageMaxDimensionPx` สำหรับเซสชันที่มีภาพหน้าจอจำนวนมาก
- ทำให้คำอธิบาย Skills สั้น (รายการ Skills จะถูกฉีดเข้าไปในพรอมป์)
- เลือกใช้โมเดลที่เล็กกว่าสำหรับงานเชิงสำรวจที่มีข้อความจำนวนมาก

ดู [Skills](/th/tools/skills) สำหรับสูตรคำนวณโอเวอร์เฮดของรายการ Skills ที่แน่นอน

## ที่เกี่ยวข้อง

- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
- [การแคชพรอมป์](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
