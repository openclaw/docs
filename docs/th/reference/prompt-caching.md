---
read_when:
    - คุณต้องการลดต้นทุนโทเค็นของพรอมป์ด้วยการคงแคชไว้
    - คุณต้องมีพฤติกรรมแคชแยกตามเอเจนต์ในการตั้งค่าแบบหลายเอเจนต์
    - คุณกำลังปรับแต่ง Heartbeat และการตัด cache-ttl ร่วมกัน
summary: ตัวควบคุม Prompt caching, ลำดับการผสาน, พฤติกรรมของผู้ให้บริการ และรูปแบบการปรับแต่ง
title: การแคชพรอมต์
x-i18n:
    generated_at: "2026-07-01T08:46:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

การแคชพรอมป์หมายถึงผู้ให้บริการโมเดลสามารถนำคำนำหน้าพรอมป์ที่ไม่เปลี่ยนแปลงกลับมาใช้ซ้ำได้ (โดยปกติคือคำสั่ง system/developer และบริบทที่เสถียรอื่นๆ) ข้ามรอบการสนทนา แทนที่จะประมวลผลใหม่ทุกครั้ง OpenClaw ทำให้การใช้งานของผู้ให้บริการอยู่ในรูปมาตรฐานเป็น `cacheRead` และ `cacheWrite` เมื่อ API ต้นทางเปิดเผยตัวนับเหล่านั้นโดยตรง

พื้นผิวสถานะยังสามารถกู้คืนตัวนับแคชจากบันทึกการใช้งาน transcript
ล่าสุดได้เมื่อสแนปช็อตเซสชันสดไม่มีข้อมูลเหล่านั้น ดังนั้น `/status` จึงยังคง
แสดงบรรทัดแคชได้หลังจากข้อมูลเมตาเซสชันสูญหายบางส่วน ค่าแคชสดที่ไม่เป็นศูนย์
ที่มีอยู่ยังคงมีความสำคัญเหนือกว่าค่าสำรองจาก transcript

เหตุผลที่สำคัญ: ต้นทุนโทเค็นต่ำลง การตอบกลับเร็วขึ้น และประสิทธิภาพที่คาดเดาได้มากขึ้นสำหรับเซสชันที่ทำงานยาวนาน หากไม่มีการแคช พรอมป์ที่ซ้ำกันจะต้องจ่ายต้นทุนพรอมป์เต็มในทุกเทิร์น แม้อินพุตส่วนใหญ่จะไม่เปลี่ยนแปลงก็ตาม

ส่วนด้านล่างครอบคลุมปุ่มปรับแต่งที่เกี่ยวข้องกับแคชทั้งหมดซึ่งมีผลต่อการนำพรอมป์กลับมาใช้ซ้ำและต้นทุนโทเค็น

เอกสารอ้างอิงของผู้ให้บริการ:

- การแคชพรอมป์ของ Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- การแคชพรอมป์ของ OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- ส่วนหัว API และรหัสคำขอของ OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- รหัสคำขอและข้อผิดพลาดของ Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## ปุ่มปรับแต่งหลัก

### `cacheRetention` (ค่าเริ่มต้นแบบรวม โมเดล และต่อเอเจนต์)

ตั้งค่าการคงแคชเป็นค่าเริ่มต้นแบบรวมสำหรับทุกโมเดล:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

เขียนทับต่อโมเดล:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

เขียนทับต่อเอเจนต์:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ลำดับการผสานการตั้งค่า:

1. `agents.defaults.params` (ค่าเริ่มต้นแบบรวม — ใช้กับทุกโมเดล)
2. `agents.defaults.models["provider/model"].params` (การเขียนทับต่อโมเดล)
3. `agents.list[].params` (รหัสเอเจนต์ที่ตรงกัน; เขียนทับตามคีย์)

### `contextPruning.mode: "cache-ttl"`

ตัดบริบทผลลัพธ์เครื่องมือเก่าหลังหน้าต่าง TTL ของแคช เพื่อให้คำขอหลังช่วงว่างไม่ต้องแคชประวัติที่ใหญ่เกินอีกครั้ง

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

ดูพฤติกรรมเต็มได้ที่ [การตัดแต่งเซสชัน](/th/concepts/session-pruning)

### การทำให้อุ่นไว้ด้วย Heartbeat

Heartbeat สามารถทำให้หน้าต่างแคชอุ่นอยู่เสมอและลดการเขียนแคชซ้ำหลังช่วงว่างได้

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

รองรับ Heartbeat ต่อเอเจนต์ที่ `agents.list[].heartbeat`

## พฤติกรรมของผู้ให้บริการ

### Anthropic (API โดยตรง)

- รองรับ `cacheRetention`
- สำหรับโปรไฟล์การตรวจสอบสิทธิ์ด้วยคีย์ API ของ Anthropic, OpenClaw จะตั้งค่าเริ่มต้น `cacheRetention: "short"` ให้กับการอ้างอิงโมเดล Anthropic เมื่อยังไม่ได้ตั้งค่า
- คำตอบ Messages แบบเนทีฟของ Anthropic เปิดเผยทั้ง `cache_read_input_tokens` และ `cache_creation_input_tokens` ดังนั้น OpenClaw จึงแสดงได้ทั้ง `cacheRead` และ `cacheWrite`
- สำหรับคำขอ Anthropic แบบเนทีฟ, `cacheRetention: "short"` จะแมปกับแคชชั่วคราวเริ่มต้น 5 นาที และ `cacheRetention: "long"` จะอัปเกรดเป็น TTL 1 ชั่วโมงเฉพาะบนโฮสต์ `api.anthropic.com` โดยตรงเท่านั้น

### OpenAI (API โดยตรง)

- การแคชพรอมป์เป็นอัตโนมัติบนโมเดลรุ่นใหม่ที่รองรับ OpenClaw ไม่จำเป็นต้องแทรกเครื่องหมายแคชระดับบล็อก
- OpenClaw ใช้ `prompt_cache_key` เพื่อให้การกำหนดเส้นทางแคชเสถียรข้ามเทิร์น โฮสต์ OpenAI โดยตรงใช้ `prompt_cache_retention: "24h"` เมื่อเลือก `cacheRetention: "long"`
- ผู้ให้บริการ Completions ที่เข้ากันได้กับ OpenAI จะได้รับ `prompt_cache_key` เฉพาะเมื่อการตั้งค่าโมเดลของผู้ให้บริการนั้นตั้งค่า `compat.supportsPromptCacheKey: true` อย่างชัดเจน การส่งต่อการคงไว้ระยะยาวเป็นความสามารถแยกต่างหาก: การตั้งค่า `cacheRetention: "long"` อย่างชัดเจนจะส่ง `prompt_cache_retention: "24h"` เฉพาะเมื่อรายการ compat นั้นรองรับการคงแคชระยะยาวด้วย ผู้ให้บริการอย่าง Mistral สามารถเลือกใช้คีย์แคชพร้อมตั้งค่า `compat.supportsLongCacheRetention: false` เพื่อระงับฟิลด์การคงไว้ระยะยาวได้ `cacheRetention: "none"` จะระงับทั้งสองฟิลด์
- คำตอบของ OpenAI เปิดเผยโทเค็นพรอมป์ที่ถูกแคชผ่าน `usage.prompt_tokens_details.cached_tokens` (หรือ `input_tokens_details.cached_tokens` ในเหตุการณ์ Responses API) OpenClaw แมปค่านั้นเป็น `cacheRead`
- การใช้งาน Responses ของ GPT-5.6 ยังสามารถเปิดเผย `input_tokens_details.cache_write_tokens` ได้ด้วย OpenClaw แมปค่านั้นเป็น `cacheWrite` และคิดราคาตามอัตราการเขียนแคชของโมเดล; Responses ที่ไม่มีฟิลด์นี้จะคง `cacheWrite` ไว้ที่ `0`
- OpenAI ส่งคืนส่วนหัวสำหรับการติดตามและการจำกัดอัตราที่มีประโยชน์ เช่น `x-request-id`, `openai-processing-ms` และ `x-ratelimit-*` แต่การนับ cache hit ควรมาจาก payload การใช้งาน ไม่ใช่จากส่วนหัว
- ในทางปฏิบัติ OpenAI มักทำงานคล้ายแคชคำนำหน้าเริ่มต้นมากกว่าการนำประวัติเต็มแบบเลื่อนไปมาในสไตล์ Anthropic กลับมาใช้ซ้ำ เทิร์นข้อความคำนำหน้ายาวที่เสถียรสามารถเข้าใกล้ระดับคงที่ของโทเค็นที่แคช `4864` ในการ probe สดปัจจุบัน ขณะที่ transcript ที่ใช้เครื่องมือหนักหรือสไตล์ MCP มักคงที่ใกล้ `4608` โทเค็นที่แคช แม้จะทำซ้ำแบบตรงกันทุกประการ

### Anthropic Vertex

- โมเดล Anthropic บน Vertex AI (`anthropic-vertex/*`) รองรับ `cacheRetention` เช่นเดียวกับ Anthropic โดยตรง
- `cacheRetention: "long"` แมปกับ TTL แคชพรอมป์ 1 ชั่วโมงจริงบนปลายทาง Vertex AI
- ค่าการคงแคชเริ่มต้นสำหรับ `anthropic-vertex` ตรงกับค่าเริ่มต้นของ Anthropic โดยตรง
- คำขอ Vertex ถูกกำหนดเส้นทางผ่านการจัดรูปแคชที่ตระหนักถึงขอบเขต เพื่อให้การนำแคชกลับมาใช้ซ้ำสอดคล้องกับสิ่งที่ผู้ให้บริการได้รับจริง

### Amazon Bedrock

- การอ้างอิงโมเดล Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) รองรับการส่งผ่าน `cacheRetention` อย่างชัดเจน
- โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ขณะรันไทม์

### โมเดล OpenRouter

สำหรับการอ้างอิงโมเดล `openrouter/anthropic/*`, OpenClaw จะแทรก
`cache_control` ของ Anthropic บนบล็อกพรอมป์ system/developer เพื่อปรับปรุงการนำ
แคชพรอมป์กลับมาใช้ซ้ำ เฉพาะเมื่อคำขอยังคงมุ่งไปยังเส้นทาง OpenRouter
ที่ตรวจสอบแล้ว (`openrouter` บนปลายทางเริ่มต้นของมัน หรือผู้ให้บริการ/base URL ใดๆ ที่ resolve
เป็น `openrouter.ai`)

สำหรับการอ้างอิงโมเดล `openrouter/deepseek/*`, `openrouter/moonshot*/*` และ `openrouter/zai/*`
อนุญาตให้ใช้ `contextPruning.mode: "cache-ttl"` เพราะ OpenRouter
จัดการการแคชพรอมป์ฝั่งผู้ให้บริการโดยอัตโนมัติ OpenClaw จะไม่แทรก
เครื่องหมาย `cache_control` ของ Anthropic เข้าไปในคำขอเหล่านั้น

การสร้างแคชของ DeepSeek เป็นแบบ best-effort และอาจใช้เวลาสองสามวินาที
การติดตามผลทันทีอาจยังแสดง `cached_tokens: 0`; ให้ตรวจสอบด้วยคำขอ
คำนำหน้าเดียวกันที่ทำซ้ำหลังหน่วงเวลาสั้นๆ และใช้ `usage.prompt_tokens_details.cached_tokens`
เป็นสัญญาณ cache hit

หากคุณชี้โมเดลไปยัง URL proxy ที่เข้ากันได้กับ OpenAI แบบใดก็ได้ OpenClaw
จะหยุดแทรกเครื่องหมายแคช Anthropic เฉพาะของ OpenRouter เหล่านั้น

### ผู้ให้บริการอื่นๆ

หากผู้ให้บริการไม่รองรับโหมดแคชนี้ `cacheRetention` จะไม่มีผล

### Google Gemini API โดยตรง

- การขนส่ง Gemini โดยตรง (`api: "google-generative-ai"`) รายงาน cache hit
  ผ่าน `cachedContentTokenCount` ต้นทาง; OpenClaw แมปค่านั้นเป็น `cacheRead`
- เมื่อกำหนด `cacheRetention` บนโมเดล Gemini โดยตรง OpenClaw จะสร้าง
  ใช้ซ้ำ และรีเฟรชทรัพยากร `cachedContents` สำหรับพรอมป์ระบบโดยอัตโนมัติ
  ในการรัน Google AI Studio ซึ่งหมายความว่าคุณไม่จำเป็นต้องสร้าง handle
  cached-content ไว้ล่วงหน้าด้วยตนเองอีกต่อไป
- คุณยังสามารถส่ง handle cached-content ของ Gemini ที่มีอยู่แล้วผ่าน
  `params.cachedContent` (หรือ `params.cached_content` แบบเดิม) บนโมเดล
  ที่กำหนดค่าไว้ได้
- สิ่งนี้แยกจากการแคชคำนำหน้าพรอมป์ของ Anthropic/OpenAI สำหรับ Gemini,
  OpenClaw จัดการทรัพยากร `cachedContents` แบบเนทีฟของผู้ให้บริการ แทนที่จะ
  แทรกเครื่องหมายแคชเข้าไปในคำขอ

### การใช้งาน Gemini CLI

- เอาต์พุต `stream-json` ของ Gemini CLI สามารถแสดง cache hit ผ่าน `stats.cached`;
  OpenClaw แมปค่านั้นเป็น `cacheRead` การเขียนทับ `--output-format json` แบบเดิมใช้
  การทำให้การใช้งานเป็นมาตรฐานแบบเดียวกัน
- หาก CLI ไม่มีค่า `stats.input` โดยตรง OpenClaw จะอนุมานโทเค็นอินพุต
  จาก `stats.input_tokens - stats.cached`
- นี่เป็นเพียงการทำให้การใช้งานเป็นมาตรฐานเท่านั้น ไม่ได้หมายความว่า OpenClaw กำลังสร้าง
  เครื่องหมายแคชพรอมป์แบบ Anthropic/OpenAI สำหรับ Gemini CLI

## ขอบเขตแคชของพรอมป์ระบบ

OpenClaw แบ่งพรอมป์ระบบเป็น **คำนำหน้าที่เสถียร** และ **ส่วนท้ายที่เปลี่ยนแปลงได้**
โดยคั่นด้วยขอบเขตคำนำหน้าแคชภายใน เนื้อหาที่อยู่เหนือ
ขอบเขต (นิยามเครื่องมือ เมตาดาตา Skills ไฟล์เวิร์กสเปซ และบริบทอื่นที่
ค่อนข้างคงที่) จะถูกจัดลำดับเพื่อให้ยังคงเหมือนกันทุกไบต์ข้ามเทิร์น
เนื้อหาที่อยู่ใต้ขอบเขต (เช่น `HEARTBEAT.md`, timestamp ขณะรันไทม์ และ
เมตาดาตาอื่นๆ ต่อเทิร์น) สามารถเปลี่ยนแปลงได้โดยไม่ทำให้คำนำหน้า
ที่แคชไว้ใช้ไม่ได้

ตัวเลือกการออกแบบหลัก:

- ไฟล์บริบทโปรเจกต์ของเวิร์กสเปซที่เสถียรถูกจัดลำดับก่อน `HEARTBEAT.md` เพื่อให้
  การเปลี่ยนแปลงของ Heartbeat ไม่ทำลายคำนำหน้าที่เสถียร
- ขอบเขตนี้ถูกใช้กับการจัดรูปการขนส่งตระกูล Anthropic, ตระกูล OpenAI, Google และ
  CLI เพื่อให้ผู้ให้บริการที่รองรับทั้งหมดได้ประโยชน์จากความเสถียรของคำนำหน้าเดียวกัน
- คำขอ Codex Responses และ Anthropic Vertex ถูกกำหนดเส้นทางผ่าน
  การจัดรูปแคชที่ตระหนักถึงขอบเขต เพื่อให้การนำแคชกลับมาใช้ซ้ำสอดคล้องกับสิ่งที่ผู้ให้บริการ
  ได้รับจริง
- ลายนิ้วมือพรอมป์ระบบถูกทำให้เป็นมาตรฐาน (ช่องว่าง line endings
  บริบทที่ hook เพิ่ม และการจัดลำดับความสามารถขณะรันไทม์) เพื่อให้พรอมป์
  ที่ความหมายไม่เปลี่ยนแปลงใช้ KV/cache ร่วมกันข้ามเทิร์น

หากคุณเห็น `cacheWrite` พุ่งสูงอย่างไม่คาดคิดหลังการเปลี่ยนแปลงการตั้งค่าหรือเวิร์กสเปซ
ให้ตรวจสอบว่าการเปลี่ยนแปลงนั้นอยู่เหนือหรือใต้ขอบเขตแคช การย้าย
เนื้อหาที่เปลี่ยนแปลงได้ไปไว้ใต้ขอบเขต (หรือทำให้มันเสถียร) มักแก้ปัญหาได้

## ตัวป้องกันความเสถียรของแคชใน OpenClaw

OpenClaw ยังทำให้รูปแบบ payload หลายอย่างที่ไวต่อแคชเป็นแบบกำหนดได้ก่อน
คำขอจะไปถึงผู้ให้บริการ:

- แค็ตตาล็อกเครื่องมือ MCP แบบบันเดิลถูกจัดเรียงอย่างกำหนดได้ก่อนการ
  ลงทะเบียนเครื่องมือ ดังนั้นการเปลี่ยนลำดับ `listTools()` จะไม่ทำให้บล็อกเครื่องมือเปลี่ยนไปมาและ
  ทำลายคำนำหน้าแคชพรอมป์
- เซสชันเดิมที่มีบล็อกรูปภาพที่ persist ไว้จะคง **3 เทิร์นที่เสร็จสมบูรณ์ล่าสุด**
  ไว้ครบถ้วน; บล็อกรูปภาพเก่าที่ประมวลผลแล้วอาจถูก
  แทนที่ด้วยเครื่องหมาย เพื่อให้การติดตามผลที่ใช้รูปภาพมากไม่ต้องส่ง payload เก่า
  ขนาดใหญ่ซ้ำไปเรื่อยๆ

## รูปแบบการปรับแต่ง

### ทราฟฟิกแบบผสม (ค่าเริ่มต้นที่แนะนำ)

คง baseline อายุยาวไว้บนเอเจนต์หลัก และปิดการแคชบนเอเจนต์แจ้งเตือนที่มีทราฟฟิกเป็นช่วงๆ:

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

### Baseline ที่เน้นต้นทุน

- ตั้ง baseline `cacheRetention: "short"`
- เปิดใช้ `contextPruning.mode: "cache-ttl"`
- รักษา Heartbeat ให้ต่ำกว่า TTL ของคุณเฉพาะสำหรับเอเจนต์ที่ได้ประโยชน์จากแคชอุ่น

## การวินิจฉัยแคช

OpenClaw เปิดเผยการวินิจฉัย cache-trace เฉพาะสำหรับการรันเอเจนต์แบบฝัง

สำหรับการวินิจฉัยปกติที่ผู้ใช้เห็น `/status` และสรุปการใช้งานอื่นๆ สามารถใช้
รายการการใช้งาน transcript ล่าสุดเป็นแหล่งสำรองสำหรับ `cacheRead` /
`cacheWrite` เมื่อรายการเซสชันสดไม่มีตัวนับเหล่านั้น

## การทดสอบ regression แบบสด

OpenClaw มี gate regression แคชแบบสดรวมหนึ่งรายการสำหรับคำนำหน้าที่ซ้ำ เทิร์นเครื่องมือ เทิร์นรูปภาพ transcript เครื่องมือสไตล์ MCP และตัวควบคุม no-cache ของ Anthropic

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

รัน gate สดแบบแคบด้วย:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ไฟล์ baseline จัดเก็บตัวเลข live ที่สังเกตได้ล่าสุด รวมถึง regression floors เฉพาะผู้ให้บริการที่ใช้โดยการทดสอบ
runner ยังใช้ session IDs และ prompt namespaces แบบใหม่ต่อการรันแต่ละครั้ง เพื่อไม่ให้สถานะแคชก่อนหน้าปนเปื้อนตัวอย่าง regression ปัจจุบัน

การทดสอบเหล่านี้ตั้งใจไม่ใช้เกณฑ์ความสำเร็จที่เหมือนกันทุกผู้ให้บริการ

### ความคาดหวัง live ของ Anthropic

- คาดว่าจะมีการเขียน warmup อย่างชัดเจนผ่าน `cacheWrite`
- คาดว่าจะใช้ประวัติซ้ำได้เกือบทั้งหมดในเทิร์นที่ทำซ้ำ เพราะ cache control ของ Anthropic เลื่อน cache breakpoint ไปตามบทสนทนา
- assertion แบบ live ปัจจุบันยังใช้เกณฑ์อัตราฮิตสูงสำหรับเส้นทาง stable, tool และ image

### ความคาดหวัง live ของ OpenAI

- คาดว่าจะมีเฉพาะ `cacheRead` เท่านั้น `cacheWrite` ยังคงเป็น `0`
- มองการใช้แคชซ้ำในเทิร์นที่ทำซ้ำเป็น plateau เฉพาะผู้ให้บริการ ไม่ใช่การใช้ประวัติเต็มแบบเลื่อนไปเรื่อยในสไตล์ Anthropic
- assertion แบบ live ปัจจุบันใช้การตรวจสอบ floor แบบระมัดระวัง ซึ่งได้มาจากพฤติกรรม live ที่สังเกตได้บน `gpt-5.4-mini`:
  - stable prefix: `cacheRead >= 4608`, อัตราฮิต `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, อัตราฮิต `>= 0.85`
  - image transcript: `cacheRead >= 3840`, อัตราฮิต `>= 0.82`
  - transcript สไตล์ MCP: `cacheRead >= 4096`, อัตราฮิต `>= 0.85`

การตรวจสอบ live แบบรวมล่าสุดเมื่อ 2026-04-04 ได้ผลที่:

- stable prefix: `cacheRead=4864`, อัตราฮิต `0.966`
- tool transcript: `cacheRead=4608`, อัตราฮิต `0.896`
- image transcript: `cacheRead=4864`, อัตราฮิต `0.954`
- transcript สไตล์ MCP: `cacheRead=4608`, อัตราฮิต `0.891`

เวลา wall-clock ล่าสุดในเครื่องสำหรับ gate แบบรวมอยู่ที่ประมาณ `88s`

เหตุผลที่ assertion แตกต่างกัน:

- Anthropic เปิดเผย cache breakpoints อย่างชัดเจนและการใช้ประวัติบทสนทนาซ้ำแบบเลื่อนไปเรื่อย
- prompt caching ของ OpenAI ยังไวต่อ exact-prefix แต่ prefix ที่นำกลับมาใช้ซ้ำได้จริงในทราฟฟิก Responses แบบ live อาจ plateau เร็วกว่าพรอมป์เต็ม
- ด้วยเหตุนี้ การเปรียบเทียบ Anthropic และ OpenAI ด้วยเกณฑ์เปอร์เซ็นต์เดียวข้ามผู้ให้บริการจะสร้าง regression เทียม

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
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` เขียนทับเส้นทางเอาต์พุต
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` สลับการจับ payload ข้อความแบบเต็ม
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` สลับการจับข้อความพรอมป์
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` สลับการจับ system prompt

### สิ่งที่ต้องตรวจสอบ

- เหตุการณ์ cache trace เป็น JSONL และรวม snapshot ตามช่วง เช่น `session:loaded`, `prompt:before`, `stream:context` และ `session:after`
- ผลกระทบของ cache token ต่อเทิร์นมองเห็นได้ในพื้นผิวการใช้งานปกติผ่าน `cacheRead` และ `cacheWrite` (เช่น `/usage full` และสรุปการใช้งานของเซสชัน)
- สำหรับ Anthropic คาดว่าจะเห็นทั้ง `cacheRead` และ `cacheWrite` เมื่อการแคชทำงานอยู่
- สำหรับ OpenAI คาดว่าจะเห็น `cacheRead` เมื่อแคชฮิต GPT-5.6 Responses ยังสามารถรายงาน `cacheWrite` ได้ขณะที่กำลังเขียน prompt segments; payload ของ Responses อื่นที่ละเว้นตัวนับการเขียนจะคงค่าไว้ที่ `0`
- หากคุณต้องการการติดตามคำขอ ให้บันทึก request IDs และ rate-limit headers แยกจาก cache metrics เอาต์พุต cache-trace ปัจจุบันของ OpenClaw มุ่งเน้นที่รูปร่างของ prompt/session และการใช้งาน token ที่ normalize แล้ว แทนที่จะเป็นส่วนหัวการตอบกลับดิบจากผู้ให้บริการ

## การแก้ปัญหาอย่างรวดเร็ว

- `cacheWrite` สูงในเทิร์นส่วนใหญ่: ตรวจสอบอินพุต system-prompt ที่เปลี่ยนแปลงง่าย และยืนยันว่า model/provider รองรับการตั้งค่าแคชของคุณ
- `cacheWrite` สูงบน Anthropic: มักหมายความว่า cache breakpoint ไปอยู่บนเนื้อหาที่เปลี่ยนทุกคำขอ
- `cacheRead` ต่ำของ OpenAI: ยืนยันว่า stable prefix อยู่ด้านหน้า, prefix ที่ทำซ้ำมีอย่างน้อย 1024 tokens และมีการใช้ `prompt_cache_key` เดียวกันซ้ำสำหรับเทิร์นที่ควรแชร์แคช
- `cacheRetention` ไม่มีผล: ยืนยันว่า model key ตรงกับ `agents.defaults.models["provider/model"]`
- คำขอ Bedrock Nova/Mistral ที่มีการตั้งค่าแคช: คาดว่าจะถูก runtime บังคับเป็น `none`

เอกสารที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้ token และค่าใช้จ่าย](/th/reference/token-use)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [ข้อมูลอ้างอิงการกำหนดค่า Gateway](/th/gateway/configuration-reference)

## ที่เกี่ยวข้อง

- [การใช้ token และค่าใช้จ่าย](/th/reference/token-use)
- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
