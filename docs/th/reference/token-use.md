---
read_when:
    - กำลังอธิบายการใช้โทเค็น ค่าใช้จ่าย หรือหน้าต่างบริบท
    - การดีบักการขยายตัวของบริบทหรือพฤติกรรม Compaction
summary: OpenClaw สร้างบริบทพรอมป์และรายงานการใช้โทเค็น + ค่าใช้จ่ายอย่างไร
title: การใช้โทเค็นและค่าใช้จ่าย
x-i18n:
    generated_at: "2026-06-27T18:22:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw ติดตาม **โทเค็น** ไม่ใช่อักขระ โทเค็นขึ้นอยู่กับโมเดล แต่โมเดลแบบ OpenAI ส่วนใหญ่มีค่าเฉลี่ยประมาณ 4 อักขระต่อโทเค็นสำหรับข้อความภาษาอังกฤษ

## วิธีสร้างพรอมป์ระบบ

OpenClaw ประกอบพรอมป์ระบบของตัวเองในทุกครั้งที่รัน โดยมี:

- รายการเครื่องมือ + คำอธิบายสั้น
- รายการ Skills (เฉพาะเมทาดาทา; คำแนะนำจะโหลดเมื่อต้องใช้ด้วย `read`)
  เทิร์น Codex แบบเนทีฟจะได้รับบล็อก Skills แบบย่อเป็นคำแนะนำสำหรับนักพัฒนาเพื่อการทำงานร่วมกันที่จำกัดเฉพาะเทิร์นนั้น ส่วน harness อื่นจะได้รับในพื้นผิวพรอมป์ปกติ รายการนี้ถูกจำกัดด้วย `skills.limits.maxSkillsPromptChars` และมีการแทนที่ราย agent แบบเลือกได้ที่ `agents.list[].skillsLimits.maxSkillsPromptChars`
- คำแนะนำสำหรับการอัปเดตตัวเอง
- ไฟล์ workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` เมื่อเป็นไฟล์ใหม่ รวมถึง `MEMORY.md` เมื่อมีอยู่) เทิร์น Codex แบบเนทีฟจะไม่วาง `MEMORY.md` ดิบจาก workspace ของ agent ที่กำหนดไว้เมื่อเครื่องมือหน่วยความจำพร้อมใช้งานสำหรับ workspace นั้น แต่จะใส่ตัวชี้หน่วยความจำขนาดเล็กไว้ในคำแนะนำสำหรับนักพัฒนาเพื่อการทำงานร่วมกันที่จำกัดเฉพาะเทิร์น และใช้เครื่องมือหน่วยความจำเมื่อต้องการ หากเครื่องมือถูกปิดใช้งาน การค้นหาหน่วยความจำไม่พร้อมใช้งาน หรือ workspace ที่ใช้งานอยู่แตกต่างจาก workspace หน่วยความจำของ agent, `MEMORY.md` จะใช้เส้นทางบริบทของเทิร์นแบบปกติที่มีขอบเขตจำกัด `memory.md` ตัวพิมพ์เล็กที่ root จะไม่ถูกฉีดเข้าไป แต่เป็นอินพุตซ่อมแซมแบบเดิมสำหรับ `openclaw doctor --fix` เมื่อจับคู่กับ `MEMORY.md` ไฟล์ขนาดใหญ่ที่ถูกฉีดจะถูกตัดทอนด้วย `agents.defaults.bootstrapMaxChars` (ค่าเริ่มต้น: 20000) และการฉีด bootstrap ทั้งหมดถูกจำกัดด้วย `agents.defaults.bootstrapTotalMaxChars` (ค่าเริ่มต้น: 60000) ไฟล์รายวัน `memory/*.md` ไม่ใช่ส่วนหนึ่งของพรอมป์ bootstrap ปกติ แต่ยังคงเรียกใช้ตามต้องการผ่านเครื่องมือหน่วยความจำในเทิร์นทั่วไป อย่างไรก็ตาม การรันโมเดลแบบ reset/startup สามารถนำหน้าด้วยบล็อก startup-context แบบครั้งเดียวที่มีหน่วยความจำรายวันล่าสุดสำหรับเทิร์นแรกนั้น คำสั่งแชตเปล่า `/new` และ `/reset` จะได้รับการรับทราบโดยไม่เรียกใช้โมเดล บทนำ startup ควบคุมโดย `agents.defaults.startupContext` ส่วนคัดลอก AGENTS.md หลัง Compaction แยกต่างหากและต้องเปิดใช้โดยชัดเจนด้วย `agents.defaults.compaction.postCompactionSections`
- เวลา (UTC + เขตเวลาของผู้ใช้)
- แท็กการตอบกลับ + พฤติกรรม Heartbeat
- เมทาดาทา runtime (host/OS/model/thinking)

ดูรายละเอียดทั้งหมดได้ใน [พรอมป์ระบบ](/th/concepts/system-prompt)

เมื่อจัดทำเอกสารข้อมูลประจำตัวหรือ snippet การยืนยันตัวตน ให้ใช้
[แบบแผนตัวแทนความลับ](/th/reference/secret-placeholder-conventions) เพื่อหลีกเลี่ยงผลบวกลวงจาก secret-scanner ในการเปลี่ยนแปลงเฉพาะเอกสาร

## สิ่งที่นับรวมในหน้าต่างบริบท

ทุกอย่างที่โมเดลได้รับจะนับรวมในขีดจำกัดบริบท:

- พรอมป์ระบบ (ทุกส่วนที่ระบุไว้ด้านบน)
- ประวัติการสนทนา (ข้อความผู้ใช้ + assistant)
- การเรียกใช้เครื่องมือและผลลัพธ์เครื่องมือ
- ไฟล์แนบ/ทรานสคริปต์ (รูปภาพ เสียง ไฟล์)
- สรุป Compaction และ artifact จากการตัดแต่ง
- wrapper ของ provider หรือ safety header (มองไม่เห็น แต่ยังคงนับรวม)

บางพื้นผิวที่ใช้ runtime หนักมีขีดจำกัดชัดเจนของตัวเอง:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

การแทนที่ราย agent อยู่ใต้ `agents.list[].contextLimits` knob เหล่านี้ใช้สำหรับข้อความ runtime แบบมีขอบเขตและบล็อกที่ runtime เป็นเจ้าของซึ่งถูกฉีดเข้าไป โดยแยกจากขีดจำกัด bootstrap, ขีดจำกัด startup-context และขีดจำกัดพรอมป์ Skills

`toolResultMaxChars` เป็นเพดานขั้นสูง (สูงสุด `1000000` อักขระ) เมื่อไม่ได้ตั้งค่า OpenClaw จะเลือกเพดานผลลัพธ์เครื่องมือสดจากหน้าต่างบริบทโมเดลที่มีผล: `16000` อักขระเมื่อต่ำกว่า 100K โทเค็น, `32000` อักขระเมื่อ 100K+ โทเค็น และ `64000` อักขระเมื่อ 200K+ โทเค็น โดยยังคงถูกจำกัดด้วยตัวป้องกันส่วนแบ่งบริบท runtime

สำหรับรูปภาพ OpenClaw จะลดขนาด payload รูปภาพของทรานสคริปต์/เครื่องมือก่อนเรียก provider
ใช้ `agents.defaults.imageMaxDimensionPx` (ค่าเริ่มต้น: `1200`) เพื่อปรับค่านี้:

- ค่าที่ต่ำลงมักลดการใช้โทเค็น vision และขนาด payload
- ค่าที่สูงขึ้นรักษารายละเอียดภาพได้มากขึ้นสำหรับ screenshot ที่เน้น OCR/UI

สำหรับรายละเอียดเชิงปฏิบัติ (ต่อไฟล์ที่ฉีด เครื่องมือ Skills และขนาดพรอมป์ระบบ) ให้ใช้ `/context list` หรือ `/context detail` ดู [บริบท](/th/concepts/context)

## วิธีดูการใช้โทเค็นปัจจุบัน

ใช้สิ่งเหล่านี้ในแชต:

- `/status` → **การ์ดสถานะที่มีอีโมจิหลากหลาย** พร้อมโมเดลของเซสชัน การใช้บริบท โทเค็นอินพุต/เอาต์พุตของการตอบกลับล่าสุด และ **ต้นทุนโดยประมาณ** เมื่อมีการกำหนดราคาในเครื่องสำหรับโมเดลที่ใช้งานอยู่
- `/usage off|tokens|full` → ต่อท้าย **footer การใช้งานรายคำตอบ** ในทุกคำตอบ
  - คงอยู่ต่อเซสชัน (จัดเก็บเป็น `responseUsage`)
  - `/usage reset` (alias: `inherit`, `clear`, `default`) — ล้างการแทนที่ของเซสชันเพื่อให้เซสชันกลับไปรับค่าเริ่มต้นที่กำหนดไว้อีกครั้ง
  - `/usage full` แสดงต้นทุนโดยประมาณเฉพาะเมื่อ OpenClaw มีเมทาดาทาการใช้งานและราคาภายในเครื่องสำหรับโมเดลที่ใช้งานอยู่ มิฉะนั้นจะแสดงเฉพาะโทเค็น
- `/usage cost` → แสดงสรุปต้นทุนในเครื่องจาก log เซสชัน OpenClaw

พื้นผิวอื่น:

- **TUI/Web TUI:** รองรับ `/status` + `/usage`
- **CLI:** `openclaw status --usage` และ `openclaw channels list` แสดงหน้าต่าง quota ของ provider ที่ normalize แล้ว (`X% left` ไม่ใช่ต้นทุนรายคำตอบ)
  provider หน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi และ z.ai

พื้นผิวการใช้งาน normalize alias ฟิลด์เนทีฟของ provider ที่พบบ่อยก่อนแสดงผล
สำหรับทราฟฟิก Responses ตระกูล OpenAI จะรวมทั้ง `input_tokens` / `output_tokens` และ `prompt_tokens` / `completion_tokens` ดังนั้นชื่อฟิลด์เฉพาะ transport จะไม่เปลี่ยน `/status`, `/usage` หรือสรุปเซสชัน
การใช้งาน Gemini CLI ก็ถูก normalize เช่นกัน: parser `stream-json` ค่าเริ่มต้นอ่าน event `message` ของ assistant และ `stats.cached` map ไปยัง `cacheRead` โดยใช้ `stats.input_tokens - stats.cached` เมื่อ CLI ละฟิลด์ `stats.input` ที่ชัดเจน การแทนที่ JSON แบบเดิมยังคงอ่านข้อความตอบกลับจาก `response`
สำหรับทราฟฟิก Responses ตระกูล OpenAI แบบเนทีฟ alias การใช้งาน WebSocket/SSE จะถูก normalize ในลักษณะเดียวกัน และยอดรวมจะ fallback ไปเป็นอินพุต + เอาต์พุตที่ normalize แล้วเมื่อ `total_tokens` หายไปหรือเป็น `0`
เมื่อ snapshot ของเซสชันปัจจุบันมีข้อมูลน้อย `/status` และ `session_status` ยังสามารถกู้คืนตัวนับโทเค็น/แคชและ label โมเดล runtime ที่ใช้งานอยู่จาก log การใช้งานทรานสคริปต์ล่าสุดได้ด้วย ค่าสดที่ไม่เป็นศูนย์ที่มีอยู่ยังคงมีลำดับความสำคัญเหนือค่า fallback จากทรานสคริปต์ และยอดรวมทรานสคริปต์ที่เน้นพรอมป์และมีขนาดใหญ่กว่าสามารถชนะได้เมื่อยอดรวมที่จัดเก็บไว้หายไปหรือน้อยกว่า
การยืนยันตัวตนการใช้งานสำหรับหน้าต่าง quota ของ provider มาจาก hook เฉพาะ provider เมื่อมีให้ใช้งาน มิฉะนั้น OpenClaw จะ fallback ไปจับคู่ข้อมูลประจำตัว OAuth/API-key จากโปรไฟล์การยืนยันตัวตน env หรือ config
รายการทรานสคริปต์ของ assistant จะคงรูปแบบการใช้งานที่ normalize แล้วแบบเดียวกันไว้ รวมถึง `usage.cost` เมื่อโมเดลที่ใช้งานอยู่มีการกำหนดราคาไว้และ provider ส่งคืนเมทาดาทาการใช้งาน สิ่งนี้ทำให้ `/usage cost` และสถานะเซสชันที่อิงทรานสคริปต์มีแหล่งข้อมูลที่เสถียรแม้หลังจากสถานะ runtime สดหายไปแล้ว

OpenClaw แยกการทำบัญชีการใช้งานของ provider ออกจาก snapshot บริบทปัจจุบัน `usage.total` ของ provider อาจรวมอินพุตที่แคชไว้ เอาต์พุต และการเรียกโมเดลหลายครั้งในลูปเครื่องมือ ดังนั้นจึงมีประโยชน์สำหรับต้นทุนและ telemetry แต่อาจนับเกินหน้าต่างบริบทสด การแสดงผลและ diagnostics ของบริบทใช้ snapshot พรอมป์ล่าสุด (`promptTokens` หรือการเรียกโมเดลล่าสุดเมื่อไม่มี snapshot พรอมป์) สำหรับ `context.used`

## การประมาณต้นทุน (เมื่อแสดง)

ต้นทุนถูกประมาณจาก config ราคาของโมเดลของคุณ:

```
models.providers.<provider>.models[].cost
```

ค่าเหล่านี้คือ **USD ต่อ 1M โทเค็น** สำหรับ `input`, `output`, `cacheRead` และ `cacheWrite` หากไม่มีราคา OpenClaw จะแสดงเฉพาะโทเค็น การแสดงต้นทุนไม่ได้จำกัดเฉพาะการยืนยันตัวตนแบบ API-key: provider ที่ไม่ใช่ API-key เช่น `aws-sdk` สามารถแสดงต้นทุนโดยประมาณได้เมื่อรายการโมเดลที่กำหนดไว้มีราคาภายในเครื่องและ provider ส่งคืนเมทาดาทาการใช้งาน

หลังจาก sidecar และช่องทางเข้าสู่เส้นทางพร้อมใช้งานของ Gateway แล้ว OpenClaw จะเริ่ม pricing bootstrap เบื้องหลังแบบเลือกได้สำหรับ model ref ที่กำหนดไว้ซึ่งยังไม่มีราคาภายในเครื่องอยู่แล้ว bootstrap นั้นดึง catalog ราคา OpenRouter และ LiteLLM จากระยะไกล ตั้งค่า `models.pricing.enabled: false` เพื่อข้ามการดึง catalog เหล่านั้นบนเครือข่ายออฟไลน์หรือถูกจำกัด รายการ `models.providers.*.models[].cost` ที่ระบุชัดเจนยังคงขับเคลื่อนการประมาณต้นทุนภายในเครื่องต่อไป

## Cache TTL และผลกระทบจากการตัดแต่ง

การแคชพรอมป์ของ provider ใช้ได้เฉพาะภายในหน้าต่าง Cache TTL เท่านั้น OpenClaw สามารถรัน **การตัดแต่ง cache-ttl** แบบเลือกได้: ระบบจะตัดแต่งเซสชันเมื่อ Cache TTL หมดอายุ จากนั้นรีเซ็ตหน้าต่างแคชเพื่อให้คำขอถัดไปสามารถใช้บริบทที่เพิ่งแคชใหม่ได้แทนการแคชประวัติทั้งหมดใหม่ วิธีนี้ช่วยลดต้นทุนการเขียนแคชเมื่อเซสชันว่างเกิน TTL

กำหนดค่าได้ใน [การกำหนดค่า Gateway](/th/gateway/configuration) และดูรายละเอียดพฤติกรรมใน [การตัดแต่งเซสชัน](/th/concepts/session-pruning)

Heartbeat สามารถทำให้แคช **อุ่น** ข้ามช่วงว่างได้ หาก Cache TTL ของโมเดลของคุณคือ `1h` การตั้งช่วง Heartbeat ให้ต่ำกว่านั้นเล็กน้อย (เช่น `55m`) สามารถหลีกเลี่ยงการแคชพรอมป์ทั้งหมดใหม่ และลดต้นทุนการเขียนแคชได้

ในการตั้งค่า multi-agent คุณสามารถใช้ config โมเดลร่วมหนึ่งชุดและปรับพฤติกรรมแคชราย agent ด้วย `agents.list[].params.cacheRetention`

สำหรับคู่มือแบบ knob-by-knob ฉบับเต็ม ดู [การแคชพรอมป์](/th/reference/prompt-caching)

สำหรับราคา Anthropic API การอ่านแคชมีราคาถูกกว่าโทเค็นอินพุตอย่างมาก ขณะที่การเขียนแคชถูกเรียกเก็บเงินด้วยตัวคูณที่สูงกว่า ดูราคาการแคชพรอมป์ของ Anthropic สำหรับอัตราและตัวคูณ TTL ล่าสุด:
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

`agents.list[].params` merge อยู่เหนือ `params` ของโมเดลที่เลือก ดังนั้นคุณสามารถแทนที่เฉพาะ `cacheRetention` และสืบทอดค่าเริ่มต้นอื่นของโมเดลไว้ตามเดิม

### บริบท Anthropic 1M

OpenClaw กำหนดขนาดโมเดล Claude 4.x ที่รองรับ GA เช่น Opus 4.8, Opus 4.7, Opus 4.6 และ Sonnet 4.6 ด้วยหน้าต่างบริบท 1M ของ Anthropic คุณไม่จำเป็นต้องใช้ `params.context1m: true` สำหรับโมเดลเหล่านั้น

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

config รุ่นเก่าสามารถเก็บ `context1m: true` ไว้ได้ แต่ OpenClaw จะไม่ส่ง beta header `context-1m-2025-08-07` ที่ Anthropic เลิกใช้แล้วสำหรับการตั้งค่านี้อีกต่อไป และจะไม่ขยายโมเดล Claude รุ่นเก่าที่ไม่รองรับเป็น 1M

ข้อกำหนด: ข้อมูลประจำตัวต้องมีสิทธิ์ใช้งาน long-context หากไม่ใช่ Anthropic จะตอบกลับด้วยข้อผิดพลาด rate limit ฝั่ง provider สำหรับคำขอนั้น

หากคุณยืนยันตัวตน Anthropic ด้วยโทเค็น OAuth/subscription (`sk-ant-oat-*`) OpenClaw จะคง beta header ของ Anthropic ที่ OAuth ต้องใช้ไว้ ขณะลบ beta `context-1m-*` ที่เลิกใช้แล้วออกหากยังคงอยู่ใน config รุ่นเก่า

## เคล็ดลับในการลดแรงกดดันด้านโทเค็น

- ใช้ `/compact` เพื่อสรุปเซสชันยาว
- ตัดผลลัพธ์เครื่องมือขนาดใหญ่ใน workflow ของคุณ
- ลด `agents.defaults.imageMaxDimensionPx` สำหรับเซสชันที่มี screenshot จำนวนมาก
- รักษาคำอธิบาย Skills ให้สั้น (รายการ Skills ถูกฉีดเข้าไปในพรอมป์)
- เลือกใช้โมเดลขนาดเล็กกว่าสำหรับงานสำรวจที่มีข้อความมาก

ดู [Skills](/th/tools/skills) สำหรับสูตร overhead ของรายการ Skills ที่แน่นอน

## ที่เกี่ยวข้อง

- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
- [การแคชพรอมต์](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
