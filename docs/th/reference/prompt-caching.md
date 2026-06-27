---
read_when:
    - คุณต้องการลดต้นทุนโทเค็นของพรอมป์ด้วยการคงแคชไว้
    - การตั้งค่าแบบหลายเอเจนต์ต้องมีพฤติกรรมแคชแยกตามเอเจนต์
    - คุณกำลังปรับแต่งฮาร์ตบีตและการตัดทอน `cache-ttl` ร่วมกัน
summary: ปุ่มปรับการแคชพรอมป์ ลำดับการผสาน พฤติกรรมของผู้ให้บริการ และรูปแบบการปรับแต่ง
title: การแคชพรอมต์
x-i18n:
    generated_at: "2026-06-27T18:19:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

การแคชพรอมป์หมายถึงผู้ให้บริการโมเดลสามารถนำคำนำหน้าพรอมป์ที่ไม่เปลี่ยนแปลงกลับมาใช้ซ้ำได้ (โดยปกติคือคำสั่ง system/developer และบริบทเสถียรอื่นๆ) ข้ามเทิร์น แทนที่จะประมวลผลใหม่ทุกครั้ง OpenClaw ทำให้การใช้งานของผู้ให้บริการเป็นรูปแบบเดียวกันเป็น `cacheRead` และ `cacheWrite` ในกรณีที่ upstream API เปิดเผยตัวนับเหล่านั้นโดยตรง

พื้นผิวสถานะยังสามารถกู้คืนตัวนับแคชจากบันทึกการใช้งาน transcript ล่าสุด
เมื่อสแนปช็อตเซสชันสดไม่มีตัวนับเหล่านั้น เพื่อให้ `/status` ยังคง
แสดงบรรทัดแคชได้หลังจากข้อมูลเมตาของเซสชันสูญหายบางส่วน ค่าแคชสดที่ไม่เป็นศูนย์ที่มีอยู่
ยังคงมีลำดับความสำคัญเหนือค่าทางเลือกจาก transcript

เหตุผลที่สำคัญ: ต้นทุนโทเค็นต่ำลง การตอบกลับเร็วขึ้น และประสิทธิภาพที่คาดการณ์ได้มากขึ้นสำหรับเซสชันที่ทำงานยาวนาน หากไม่มีการแคช พรอมป์ที่ซ้ำกันจะต้องจ่ายต้นทุนพรอมป์เต็มในทุกเทิร์น แม้ว่าอินพุตส่วนใหญ่จะไม่เปลี่ยนก็ตาม

ส่วนด้านล่างครอบคลุมปุ่มปรับที่เกี่ยวข้องกับแคชทั้งหมดซึ่งมีผลต่อการใช้พรอมป์ซ้ำและต้นทุนโทเค็น

เอกสารอ้างอิงของผู้ให้บริการ:

- การแคชพรอมป์ของ Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- การแคชพรอมป์ของ OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- ส่วนหัว OpenAI API และรหัสคำขอ: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- รหัสคำขอและข้อผิดพลาดของ Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## ปุ่มปรับหลัก

### `cacheRetention` (ค่าเริ่มต้นส่วนกลาง โมเดล และรายเอเจนต์)

ตั้งค่าการเก็บแคชเป็นค่าเริ่มต้นส่วนกลางสำหรับทุกโมเดล:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

แทนที่ค่ารายโมเดล:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

แทนที่ค่ารายเอเจนต์:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ลำดับการผสานการกำหนดค่า:

1. `agents.defaults.params` (ค่าเริ่มต้นส่วนกลาง — ใช้กับทุกโมเดล)
2. `agents.defaults.models["provider/model"].params` (การแทนที่รายโมเดล)
3. `agents.list[].params` (รหัสเอเจนต์ที่ตรงกัน; แทนที่ตามคีย์)

### `contextPruning.mode: "cache-ttl"`

ตัดบริบทผลลัพธ์เครื่องมือเก่าหลังจากหน้าต่าง TTL ของแคช เพื่อไม่ให้คำขอหลังช่วงไม่ได้ใช้งานต้องแคชประวัติขนาดใหญ่เกินอีกครั้ง

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

ดู [การตัดแต่งเซสชัน](/th/concepts/session-pruning) สำหรับพฤติกรรมแบบเต็ม

### การอุ่นแคชด้วย Heartbeat

Heartbeat สามารถทำให้หน้าต่างแคชอุ่นอยู่เสมอและลดการเขียนแคชซ้ำหลังจากช่องว่างที่ไม่ได้ใช้งาน

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

รองรับ Heartbeat รายเอเจนต์ที่ `agents.list[].heartbeat`

## พฤติกรรมของผู้ให้บริการ

### Anthropic (API โดยตรง)

- รองรับ `cacheRetention`
- เมื่อใช้โปรไฟล์การตรวจสอบสิทธิ์ด้วยคีย์ API ของ Anthropic, OpenClaw จะตั้งค่าเริ่มต้น `cacheRetention: "short"` สำหรับการอ้างอิงโมเดล Anthropic เมื่อไม่ได้ตั้งค่าไว้
- การตอบกลับ Messages แบบเนทีฟของ Anthropic เปิดเผยทั้ง `cache_read_input_tokens` และ `cache_creation_input_tokens` ดังนั้น OpenClaw จึงแสดงได้ทั้ง `cacheRead` และ `cacheWrite`
- สำหรับคำขอ Anthropic แบบเนทีฟ `cacheRetention: "short"` จะแมปกับแคช ephemeral เริ่มต้น 5 นาที และ `cacheRetention: "long"` จะอัปเกรดเป็น TTL 1 ชั่วโมงเฉพาะบนโฮสต์ `api.anthropic.com` โดยตรงเท่านั้น

### OpenAI (API โดยตรง)

- การแคชพรอมป์เป็นแบบอัตโนมัติในโมเดลรุ่นใหม่ที่รองรับ OpenClaw ไม่จำเป็นต้องแทรกเครื่องหมายแคชระดับบล็อก
- OpenClaw ใช้ `prompt_cache_key` เพื่อให้การกำหนดเส้นทางแคชเสถียรข้ามเทิร์น โฮสต์ OpenAI โดยตรงใช้ `prompt_cache_retention: "24h"` เมื่อเลือก `cacheRetention: "long"`
- ผู้ให้บริการ Completions ที่เข้ากันได้กับ OpenAI จะได้รับ `prompt_cache_key` เฉพาะเมื่อการกำหนดค่าโมเดลของผู้ให้บริการตั้งค่า `compat.supportsPromptCacheKey: true` อย่างชัดเจน การส่งต่อการเก็บรักษาระยะยาวเป็นความสามารถแยกต่างหาก: `cacheRetention: "long"` ที่ระบุอย่างชัดเจนจะส่ง `prompt_cache_retention: "24h"` เฉพาะเมื่อรายการ compat นั้นรองรับการเก็บแคชระยะยาวด้วย ผู้ให้บริการอย่าง Mistral สามารถเลือกใช้คีย์แคชพร้อมตั้งค่า `compat.supportsLongCacheRetention: false` เพื่อระงับฟิลด์การเก็บรักษาระยะยาวได้ `cacheRetention: "none"` จะระงับทั้งสองฟิลด์
- การตอบกลับของ OpenAI เปิดเผยโทเค็นพรอมป์ที่แคชไว้ผ่าน `usage.prompt_tokens_details.cached_tokens` (หรือ `input_tokens_details.cached_tokens` ในอีเวนต์ Responses API) OpenClaw แมปค่านั้นเป็น `cacheRead`
- OpenAI ไม่เปิดเผยตัวนับโทเค็นการเขียนแคชแยกต่างหาก ดังนั้น `cacheWrite` จะคงเป็น `0` บนเส้นทาง OpenAI แม้เมื่อผู้ให้บริการกำลังอุ่นแคช
- OpenAI ส่งคืนส่วนหัวที่มีประโยชน์สำหรับการติดตามและขีดจำกัดอัตรา เช่น `x-request-id`, `openai-processing-ms` และ `x-ratelimit-*` แต่การนับ cache-hit ควรมาจากเพย์โหลดการใช้งาน ไม่ใช่จากส่วนหัว
- ในทางปฏิบัติ OpenAI มักมีพฤติกรรมเหมือนแคชคำนำหน้าเริ่มต้นมากกว่าการนำประวัติเต็มแบบเคลื่อนที่สไตล์ Anthropic กลับมาใช้ซ้ำ เทิร์นที่มีข้อความคำนำหน้ายาวและเสถียรอาจเข้าใกล้ระดับคงที่ `4864` cached-token ในการทดสอบสดปัจจุบัน ขณะที่ transcript ที่ใช้เครื่องมือหนักหรือสไตล์ MCP มักคงที่ใกล้ `4608` โทเค็นที่แคชไว้ แม้จะทำซ้ำเหมือนเดิมทุกประการ

### Anthropic Vertex

- โมเดล Anthropic บน Vertex AI (`anthropic-vertex/*`) รองรับ `cacheRetention` ในแบบเดียวกับ Anthropic โดยตรง
- `cacheRetention: "long"` แมปกับ TTL แคชพรอมป์จริง 1 ชั่วโมงบน endpoint ของ Vertex AI
- ค่าเริ่มต้นการเก็บแคชสำหรับ `anthropic-vertex` ตรงกับค่าเริ่มต้น Anthropic โดยตรง
- คำขอ Vertex ถูกกำหนดเส้นทางผ่านการจัดรูปแคชที่รับรู้ขอบเขต เพื่อให้การใช้แคชซ้ำสอดคล้องกับสิ่งที่ผู้ให้บริการได้รับจริง

### Amazon Bedrock

- การอ้างอิงโมเดล Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) รองรับการส่งผ่าน `cacheRetention` อย่างชัดเจน
- โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ขณะรันไทม์

### โมเดล OpenRouter

สำหรับการอ้างอิงโมเดล `openrouter/anthropic/*`, OpenClaw จะแทรก
`cache_control` ของ Anthropic ในบล็อกพรอมป์ system/developer เพื่อปรับปรุง
การใช้แคชพรอมป์ซ้ำ เฉพาะเมื่อคำขอยังคงกำหนดเป้าหมายไปยังเส้นทาง OpenRouter ที่ยืนยันแล้ว
(`openrouter` บน endpoint เริ่มต้น หรือผู้ให้บริการ/base URL ใดๆ ที่ resolve
เป็น `openrouter.ai`)

สำหรับการอ้างอิงโมเดล `openrouter/deepseek/*`, `openrouter/moonshot*/*` และ `openrouter/zai/*`
อนุญาตให้ใช้ `contextPruning.mode: "cache-ttl"` เพราะ OpenRouter
จัดการการแคชพรอมป์ฝั่งผู้ให้บริการโดยอัตโนมัติ OpenClaw ไม่ได้แทรก
เครื่องหมาย `cache_control` ของ Anthropic ลงในคำขอเหล่านั้น

การสร้างแคชของ DeepSeek เป็นแบบพยายามให้ดีที่สุดและอาจใช้เวลาสองสามวินาที
การติดตามผลทันทีอาจยังแสดง `cached_tokens: 0`; ให้ตรวจสอบด้วยคำขอ
คำนำหน้าเดียวกันซ้ำหลังจากรอสั้นๆ และใช้ `usage.prompt_tokens_details.cached_tokens`
เป็นสัญญาณ cache-hit

หากคุณชี้โมเดลไปยัง URL พร็อกซีที่เข้ากันได้กับ OpenAI แบบกำหนดเอง OpenClaw
จะหยุดแทรกเครื่องหมายแคช Anthropic เฉพาะของ OpenRouter เหล่านั้น

### ผู้ให้บริการอื่น

หากผู้ให้บริการไม่รองรับโหมดแคชนี้ `cacheRetention` จะไม่มีผล

### Google Gemini direct API

- การขนส่ง Gemini โดยตรง (`api: "google-generative-ai"`) รายงาน cache hit
  ผ่าน upstream `cachedContentTokenCount`; OpenClaw แมปค่านั้นเป็น `cacheRead`
- เมื่อมีการตั้งค่า `cacheRetention` บนโมเดล Gemini โดยตรง OpenClaw จะสร้าง
  ใช้ซ้ำ และรีเฟรชทรัพยากร `cachedContents` สำหรับพรอมป์ระบบโดยอัตโนมัติ
  ในการรัน Google AI Studio ซึ่งหมายความว่าคุณไม่จำเป็นต้องสร้าง
  handle cached-content ไว้ล่วงหน้าด้วยตนเองอีกต่อไป
- คุณยังสามารถส่ง handle cached-content ของ Gemini ที่มีอยู่แล้วผ่านเป็น
  `params.cachedContent` (หรือแบบเดิม `params.cached_content`) บนโมเดลที่กำหนดค่าไว้
- สิ่งนี้แยกจากการแคชคำนำหน้าพรอมป์ของ Anthropic/OpenAI สำหรับ Gemini,
  OpenClaw จัดการทรัพยากร `cachedContents` แบบเนทีฟของผู้ให้บริการ แทนที่จะ
  แทรกเครื่องหมายแคชลงในคำขอ

### การใช้งาน Gemini CLI

- เอาต์พุต `stream-json` ของ Gemini CLI สามารถแสดง cache hit ผ่าน `stats.cached`;
  OpenClaw แมปค่านั้นเป็น `cacheRead` การแทนที่แบบเดิม `--output-format json` ใช้
  การทำให้การใช้งานเป็นรูปแบบเดียวกันแบบเดียวกัน
- หาก CLI ไม่ระบุค่า `stats.input` โดยตรง OpenClaw จะอนุมานโทเค็นอินพุต
  จาก `stats.input_tokens - stats.cached`
- นี่เป็นเพียงการทำให้การใช้งานเป็นรูปแบบเดียวกัน ไม่ได้หมายความว่า OpenClaw กำลังสร้าง
  เครื่องหมายแคชพรอมป์สไตล์ Anthropic/OpenAI สำหรับ Gemini CLI

## ขอบเขตแคชของพรอมป์ระบบ

OpenClaw แบ่งพรอมป์ระบบออกเป็น **คำนำหน้าที่เสถียร** และ **คำต่อท้ายที่เปลี่ยนแปลงได้**
ซึ่งคั่นด้วยขอบเขตคำนำหน้าแคชภายใน เนื้อหาเหนือ
ขอบเขต (คำจำกัดความเครื่องมือ เมตาดาต้า Skills ไฟล์เวิร์กสเปซ และบริบทอื่นที่
ค่อนข้างคงที่) จะถูกจัดลำดับเพื่อให้เหมือนกันระดับไบต์ข้ามเทิร์น
เนื้อหาใต้ขอบเขต (เช่น `HEARTBEAT.md`, timestamp ของรันไทม์ และ
เมตาดาต้าอื่นรายเทิร์น) สามารถเปลี่ยนได้โดยไม่ทำให้คำนำหน้าที่แคชไว้
ใช้ไม่ได้

ตัวเลือกการออกแบบหลัก:

- ไฟล์ project-context ของเวิร์กสเปซที่เสถียรถูกจัดลำดับก่อน `HEARTBEAT.md` เพื่อให้
  ความเปลี่ยนแปลงของ heartbeat ไม่ทำลายคำนำหน้าที่เสถียร
- ขอบเขตถูกนำไปใช้ครอบคลุมการจัดรูปการขนส่งตระกูล Anthropic, ตระกูล OpenAI, Google และ
  CLI เพื่อให้ผู้ให้บริการที่รองรับทั้งหมดได้ประโยชน์จากความเสถียรของคำนำหน้าเดียวกัน
- คำขอ Codex Responses และ Anthropic Vertex ถูกกำหนดเส้นทางผ่าน
  การจัดรูปแคชที่รับรู้ขอบเขต เพื่อให้การใช้แคชซ้ำสอดคล้องกับสิ่งที่ผู้ให้บริการ
  ได้รับจริง
- fingerprint ของพรอมป์ระบบถูกทำให้เป็นรูปแบบเดียวกัน (ช่องว่าง การขึ้นบรรทัด
  บริบทที่เพิ่มโดย hook การจัดลำดับความสามารถรันไทม์) เพื่อให้พรอมป์ที่ความหมาย
  ไม่เปลี่ยนแปลงแชร์ KV/cache ข้ามเทิร์น

หากคุณเห็น `cacheWrite` พุ่งขึ้นโดยไม่คาดคิดหลังการเปลี่ยนแปลงการกำหนดค่าหรือเวิร์กสเปซ
ให้ตรวจสอบว่าการเปลี่ยนแปลงนั้นอยู่เหนือหรือใต้ขอบเขตแคช การย้าย
เนื้อหาที่เปลี่ยนแปลงได้ไปไว้ใต้ขอบเขต (หรือทำให้เสถียร) มักแก้ปัญหาได้

## กลไกป้องกันความเสถียรของแคชใน OpenClaw

OpenClaw ยังรักษารูปทรงเพย์โหลดหลายแบบที่ไวต่อแคชให้กำหนดได้แน่นอนก่อน
คำขอถึงผู้ให้บริการ:

- แค็ตตาล็อกเครื่องมือ Bundle MCP ถูกเรียงลำดับอย่างกำหนดได้แน่นอนก่อนการลงทะเบียนเครื่องมือ
  เพื่อให้การเปลี่ยนลำดับ `listTools()` ไม่ทำให้บล็อกเครื่องมือเปลี่ยนแปลงและ
  ทำลายคำนำหน้าแคชพรอมป์
- เซสชันแบบเดิมที่มีบล็อกรูปภาพที่คงอยู่จะเก็บ **3 เทิร์นที่เสร็จสมบูรณ์ล่าสุด**
  ไว้อย่างครบถ้วน; บล็อกรูปภาพที่ประมวลผลแล้วและเก่ากว่าอาจถูก
  แทนที่ด้วยเครื่องหมาย เพื่อให้การติดตามผลที่มีรูปภาพจำนวนมากไม่ต้องส่งเพย์โหลดเก่า
  ขนาดใหญ่ซ้ำๆ

## รูปแบบการปรับแต่ง

### ทราฟฟิกแบบผสม (ค่าเริ่มต้นที่แนะนำ)

คง baseline ที่มีอายุยาวบนเอเจนต์หลักของคุณ ปิดการแคชบนเอเจนต์แจ้งเตือนที่มีทราฟฟิกเป็นช่วงๆ:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Baseline ที่เน้นต้นทุนก่อน

- ตั้งค่า baseline `cacheRetention: "short"`
- เปิดใช้ `contextPruning.mode: "cache-ttl"`
- รักษา heartbeat ให้ต่ำกว่า TTL ของคุณเฉพาะสำหรับเอเจนต์ที่ได้ประโยชน์จากแคชอุ่น

## การวินิจฉัยแคช

OpenClaw เปิดเผยการวินิจฉัย cache-trace เฉพาะสำหรับการรันเอเจนต์แบบฝัง

สำหรับการวินิจฉัยปกติที่ผู้ใช้เห็นได้ `/status` และสรุปการใช้งานอื่นๆ สามารถใช้
รายการการใช้งาน transcript ล่าสุดเป็นแหล่งข้อมูลสำรองสำหรับ `cacheRead` /
`cacheWrite` เมื่อรายการเซสชันสดไม่มีตัวนับเหล่านั้น

## การทดสอบถดถอยแบบสด

OpenClaw มีเกตการทดสอบถดถอยแคชสดแบบรวมหนึ่งชุดสำหรับคำนำหน้าซ้ำ เทิร์นเครื่องมือ เทิร์นรูปภาพ transcript เครื่องมือสไตล์ MCP และตัวควบคุมไม่ใช้แคชของ Anthropic

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

รันเกตสดแบบแคบด้วย:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ไฟล์ baseline เก็บตัวเลขสดที่สังเกตได้ล่าสุด รวมถึง floor การถดถอยเฉพาะผู้ให้บริการที่การทดสอบใช้
runner ยังใช้รหัสเซสชันและ namespace พรอมป์ใหม่สำหรับแต่ละการรัน เพื่อให้สถานะแคชก่อนหน้าไม่ปนเปื้อนตัวอย่างการถดถอยปัจจุบัน

การทดสอบเหล่านี้ตั้งใจไม่ใช้เกณฑ์ความสำเร็จที่เหมือนกันระหว่างผู้ให้บริการ

### ความคาดหวังการทดสอบสดของ Anthropic

- คาดว่าจะมีการเขียนวอร์มอัปอย่างชัดเจนผ่าน `cacheWrite`
- คาดว่าจะใช้ประวัติเกือบทั้งหมดซ้ำได้ในเทิร์นที่ทำซ้ำ เพราะการควบคุมแคชของ Anthropic เลื่อนจุดแบ่งแคชไปตามบทสนทนา
- การยืนยันผลแบบสดในปัจจุบันยังใช้เกณฑ์อัตราแคชฮิตสูงสำหรับเส้นทางที่เสถียร เครื่องมือ และรูปภาพ

### ความคาดหวังการทดสอบสดของ OpenAI

- คาดว่าจะมีเฉพาะ `cacheRead` เท่านั้น `cacheWrite` ยังคงเป็น `0`
- ให้ถือว่าการใช้แคชซ้ำในเทิร์นที่ทำซ้ำเป็นระดับคงตัวเฉพาะผู้ให้บริการ ไม่ใช่การใช้ประวัติเต็มแบบเคลื่อนที่ซ้ำเหมือน Anthropic
- การยืนยันผลแบบสดในปัจจุบันใช้การตรวจสอบค่าขั้นต่ำแบบอนุรักษนิยมที่ได้จากพฤติกรรมสดที่สังเกตได้บน `gpt-5.4-mini`:
  - คำนำหน้าที่เสถียร: `cacheRead >= 4608`, อัตราฮิต `>= 0.90`
  - บันทึกบทสนทนาเครื่องมือ: `cacheRead >= 4096`, อัตราฮิต `>= 0.85`
  - บันทึกบทสนทนารูปภาพ: `cacheRead >= 3840`, อัตราฮิต `>= 0.82`
  - บันทึกบทสนทนาแบบ MCP: `cacheRead >= 4096`, อัตราฮิต `>= 0.85`

การตรวจสอบสดแบบรวมล่าสุดเมื่อ 2026-04-04 ได้ผลเป็น:

- คำนำหน้าที่เสถียร: `cacheRead=4864`, อัตราฮิต `0.966`
- บันทึกบทสนทนาเครื่องมือ: `cacheRead=4608`, อัตราฮิต `0.896`
- บันทึกบทสนทนารูปภาพ: `cacheRead=4864`, อัตราฮิต `0.954`
- บันทึกบทสนทนาแบบ MCP: `cacheRead=4608`, อัตราฮิต `0.891`

เวลานาฬิกาจริงในเครื่องล่าสุดสำหรับเกตรวมอยู่ที่ประมาณ `88s`

เหตุผลที่การยืนยันผลต่างกัน:

- Anthropic เปิดเผยจุดแบ่งแคชอย่างชัดเจนและการใช้ประวัติบทสนทนาแบบเคลื่อนที่ซ้ำ
- การแคชพรอมป์ของ OpenAI ยังคงอ่อนไหวต่อคำนำหน้าที่ตรงกันทุกประการ แต่คำนำหน้าที่นำกลับมาใช้ซ้ำได้จริงในการรับส่งข้อมูล Responses แบบสดอาจคงตัวเร็วกว่าพรอมป์เต็ม
- ด้วยเหตุนี้ การเปรียบเทียบ Anthropic และ OpenAI ด้วยเกณฑ์เปอร์เซ็นต์เดียวข้ามผู้ให้บริการจึงทำให้เกิดการถดถอยเทียม

### การกำหนดค่า `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

ค่าเริ่มต้น:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### ตัวสลับ Env (การดีบักเฉพาะครั้ง)

- `OPENCLAW_CACHE_TRACE=1` เปิดใช้การติดตามแคช
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` แทนที่เส้นทางเอาต์พุต
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` สลับการบันทึกเพย์โหลดข้อความแบบเต็ม
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` สลับการบันทึกข้อความพรอมป์
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` สลับการบันทึกพรอมป์ระบบ

### สิ่งที่ควรตรวจสอบ

- เหตุการณ์ติดตามแคชเป็น JSONL และรวมสแนปช็อตตามขั้น เช่น `session:loaded`, `prompt:before`, `stream:context` และ `session:after`
- ผลกระทบของโทเค็นแคชต่อเทิร์นมองเห็นได้ในพื้นผิวการใช้งานปกติผ่าน `cacheRead` และ `cacheWrite` (เช่น `/usage full` และสรุปการใช้งานเซสชัน)
- สำหรับ Anthropic คาดว่าจะเห็นทั้ง `cacheRead` และ `cacheWrite` เมื่อการแคชทำงานอยู่
- สำหรับ OpenAI คาดว่าจะเห็น `cacheRead` เมื่อแคชฮิต และ `cacheWrite` ยังคงเป็น `0`; OpenAI ไม่เผยแพร่ฟิลด์โทเค็นการเขียนแคชแยกต่างหาก
- หากคุณต้องการติดตามคำขอ ให้บันทึก ID คำขอและส่วนหัว rate-limit แยกจากเมตริกแคช เอาต์พุตติดตามแคชปัจจุบันของ OpenClaw มุ่งเน้นที่รูปแบบพรอมป์/เซสชันและการใช้งานโทเค็นที่ปรับให้เป็นมาตรฐาน มากกว่าส่วนหัวการตอบกลับดิบของผู้ให้บริการ

## การแก้ปัญหาอย่างรวดเร็ว

- `cacheWrite` สูงในเทิร์นส่วนใหญ่: ตรวจสอบอินพุตพรอมป์ระบบที่เปลี่ยนแปลงบ่อย และตรวจสอบว่าโมเดล/ผู้ให้บริการรองรับการตั้งค่าแคชของคุณ
- `cacheWrite` สูงบน Anthropic: มักหมายความว่าจุดแบ่งแคชไปตกบนเนื้อหาที่เปลี่ยนทุกคำขอ
- `cacheRead` ต่ำบน OpenAI: ตรวจสอบว่าคำนำหน้าที่เสถียรอยู่ด้านหน้า คำนำหน้าที่ทำซ้ำมีอย่างน้อย 1024 โทเค็น และมีการใช้ `prompt_cache_key` เดียวกันซ้ำสำหรับเทิร์นที่ควรใช้แคชร่วมกัน
- `cacheRetention` ไม่มีผล: ยืนยันว่าคีย์โมเดลตรงกับ `agents.defaults.models["provider/model"]`
- คำขอ Bedrock Nova/Mistral ที่มีการตั้งค่าแคช: คาดว่ารันไทม์จะบังคับเป็น `none`

เอกสารที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [ข้อมูลอ้างอิงการกำหนดค่า Gateway](/th/gateway/configuration-reference)

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
