---
read_when:
    - คุณต้องการลดต้นทุนโทเค็นของพรอมป์ต์ด้วยการเก็บแคชไว้ต่อไป
    - คุณต้องการพฤติกรรมแคชแบบต่อเอเจนต์ในชุดการทำงานหลายเอเจนต์
    - คุณกำลังปรับ Heartbeat และการล้าง `cache-ttl` ร่วมกัน
summary: ตัวเลือกการควบคุมการแคชพรอมป์ต์ ลำดับการผสาน พฤติกรรมของผู้ให้บริการ และรูปแบบการปรับแต่ง
title: การแคชพรอมป์ต์
x-i18n:
    generated_at: "2026-04-25T13:58:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

การแคชพรอมป์ต์หมายความว่าผู้ให้บริการโมเดลสามารถนำคำนำหน้าพรอมป์ต์ที่ไม่เปลี่ยนแปลงกลับมาใช้ซ้ำได้ (โดยปกติคือคำสั่ง system/developer และบริบทคงที่อื่น ๆ) ข้ามหลายเทิร์น แทนที่จะประมวลผลใหม่ทุกครั้ง OpenClaw จะทำให้การใช้งานของผู้ให้บริการเป็นมาตรฐานในรูปของ `cacheRead` และ `cacheWrite` เมื่อ API ต้นทางเปิดเผยตัวนับเหล่านั้นโดยตรง

พื้นผิวสถานะยังสามารถกู้คืนตัวนับแคชจาก
บันทึกการใช้งานใน transcript ล่าสุดได้เมื่อ snapshot ของเซสชันสดไม่มีข้อมูลเหล่านั้น ทำให้ `/status` ยังสามารถ
แสดงบรรทัดแคชต่อไปได้หลังจากข้อมูลเมตาของเซสชันสูญหายบางส่วน โดยค่าการใช้งานแคชสดที่ไม่เป็นศูนย์
จะยังคงมีความสำคัญเหนือกว่าค่าทดแทนจาก transcript

เหตุผลที่สำคัญ: ต้นทุนโทเค็นต่ำลง การตอบกลับเร็วขึ้น และประสิทธิภาพที่คาดการณ์ได้มากขึ้นสำหรับเซสชันที่ทำงานระยะยาว หากไม่มีการแคช พรอมป์ต์ที่ซ้ำกันจะต้องจ่ายต้นทุนพรอมป์ต์เต็มในทุกเทิร์น แม้ว่าอินพุตส่วนใหญ่จะไม่เปลี่ยนแปลงก็ตาม

ส่วนด้านล่างครอบคลุมตัวเลือกที่เกี่ยวข้องกับแคชทั้งหมดที่มีผลต่อการนำพรอมป์ต์กลับมาใช้ซ้ำและต้นทุนโทเค็น

ข้อมูลอ้างอิงของผู้ให้บริการ:

- การแคชพรอมป์ต์ของ Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- การแคชพรอมป์ต์ของ OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- ส่วนหัว API และ request ID ของ OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- request ID และข้อผิดพลาดของ Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## ตัวเลือกหลัก

### `cacheRetention` (ค่าเริ่มต้นส่วนกลาง ระดับโมเดล และต่อเอเจนต์)

ตั้งค่า retention ของแคชเป็นค่าเริ่มต้นส่วนกลางสำหรับทุกโมเดล:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Override ต่อโมเดล:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Override ต่อเอเจนต์:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ลำดับการผสานการตั้งค่า:

1. `agents.defaults.params` (ค่าเริ่มต้นส่วนกลาง — ใช้กับทุกโมเดล)
2. `agents.defaults.models["provider/model"].params` (override ต่อโมเดล)
3. `agents.list[].params` (ตรงกับ id ของเอเจนต์; override ตามคีย์)

### `contextPruning.mode: "cache-ttl"`

ลบบริบทผลลัพธ์ของเครื่องมือเก่าหลังหน้าต่าง TTL ของแคช เพื่อให้คำขอหลังช่วงว่างไม่ต้องสร้างแคชใหม่สำหรับประวัติที่ใหญ่เกินไป

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

ดู [Session Pruning](/th/concepts/session-pruning) สำหรับพฤติกรรมทั้งหมด

### Heartbeat keep-warm

Heartbeat สามารถทำให้หน้าต่างแคชอุ่นอยู่เสมอและลดการเขียนแคชซ้ำหลังช่วงว่างได้

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

รองรับ Heartbeat ต่อเอเจนต์ที่ `agents.list[].heartbeat`

## พฤติกรรมของผู้ให้บริการ

### Anthropic (direct API)

- รองรับ `cacheRetention`
- สำหรับโปรไฟล์การยืนยันตัวตนด้วยคีย์ API ของ Anthropic, OpenClaw จะตั้งต้น `cacheRetention: "short"` สำหรับการอ้างอิงโมเดล Anthropic เมื่อไม่ได้กำหนดค่า
- การตอบกลับ Messages แบบเนทีฟของ Anthropic เปิดเผยทั้ง `cache_read_input_tokens` และ `cache_creation_input_tokens` ดังนั้น OpenClaw จึงสามารถแสดงทั้ง `cacheRead` และ `cacheWrite`
- สำหรับคำขอ Anthropic แบบเนทีฟ, `cacheRetention: "short"` จะถูกแมปไปยังแคชชั่วคราว 5 นาทีตามค่าเริ่มต้น และ `cacheRetention: "long"` จะอัปเกรดเป็น TTL 1 ชั่วโมงเฉพาะบนโฮสต์ `api.anthropic.com` โดยตรงเท่านั้น

### OpenAI (direct API)

- การแคชพรอมป์ต์เป็นอัตโนมัติในโมเดลรุ่นใหม่ที่รองรับ OpenClaw ไม่จำเป็นต้องแทรกตัวทำเครื่องหมายแคชระดับบล็อก
- OpenClaw ใช้ `prompt_cache_key` เพื่อให้การกำหนดเส้นทางแคชคงที่ข้ามเทิร์น และใช้ `prompt_cache_retention: "24h"` เฉพาะเมื่อเลือก `cacheRetention: "long"` บนโฮสต์ OpenAI โดยตรง
- ผู้ให้บริการ Completions ที่เข้ากันได้กับ OpenAI จะได้รับ `prompt_cache_key` เฉพาะเมื่อการตั้งค่าโมเดลระบุ `compat.supportsPromptCacheKey: true` อย่างชัดเจน; `cacheRetention: "none"` จะยังคงปิดการส่งค่านี้
- การตอบกลับของ OpenAI เปิดเผยโทเค็นพรอมป์ต์ที่ถูกแคชผ่าน `usage.prompt_tokens_details.cached_tokens` (หรือ `input_tokens_details.cached_tokens` บน event ของ Responses API) OpenClaw จะแมปค่านั้นไปยัง `cacheRead`
- OpenAI ไม่เปิดเผยตัวนับโทเค็นการเขียนแคชแยกต่างหาก ดังนั้น `cacheWrite` จะยังเป็น `0` บนเส้นทาง OpenAI แม้ว่าผู้ให้บริการจะกำลังอุ่นแคชอยู่ก็ตาม
- OpenAI ส่งส่วนหัวสำหรับการติดตามและการจำกัดอัตราที่มีประโยชน์กลับมา เช่น `x-request-id`, `openai-processing-ms` และ `x-ratelimit-*` แต่การคำนวณ cache hit ควรมาจาก payload การใช้งาน ไม่ใช่จากส่วนหัว
- ในทางปฏิบัติ OpenAI มักทำงานเหมือนแคชคำนำหน้าเริ่มต้น มากกว่าการใช้ประวัติเต็มแบบเลื่อนตำแหน่งสไตล์ Anthropic เท็กซ์คำนำหน้าที่ยาวและคงที่อาจไปอยู่ใกล้ plateau ของ cached token ที่ `4864` ในการทดสอบจริงปัจจุบัน ขณะที่ transcript แบบเน้นเครื่องมือหรือสไตล์ MCP มัก plateau ใกล้ `4608` cached token แม้จะส่งซ้ำแบบตรงกันทุกประการก็ตาม

### Anthropic Vertex

- โมเดล Anthropic บน Vertex AI (`anthropic-vertex/*`) รองรับ `cacheRetention` แบบเดียวกับ Anthropic โดยตรง
- `cacheRetention: "long"` ถูกแมปไปยัง TTL ของ prompt cache 1 ชั่วโมงจริงบน endpoint ของ Vertex AI
- ค่า retention ของแคชเริ่มต้นสำหรับ `anthropic-vertex` ตรงกับค่าเริ่มต้นของ Anthropic โดยตรง
- คำขอ Vertex ถูกกำหนดเส้นทางผ่านการจัดรูปแคชที่รับรู้ boundary เพื่อให้การนำแคชกลับมาใช้ซ้ำสอดคล้องกับสิ่งที่ผู้ให้บริการได้รับจริง

### Amazon Bedrock

- การอ้างอิงโมเดล Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) รองรับการส่งผ่าน `cacheRetention` แบบชัดเจน
- โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ขณะรันไทม์

### โมเดล OpenRouter

สำหรับการอ้างอิงโมเดล `openrouter/anthropic/*` OpenClaw จะฉีด
Anthropic `cache_control` ลงในบล็อกพรอมป์ต์ system/developer เพื่อปรับปรุงการนำ prompt-cache
กลับมาใช้ซ้ำ เฉพาะเมื่อคำขอยังคงกำหนดเป้าหมายไปยังเส้นทาง OpenRouter ที่ผ่านการตรวจสอบแล้ว
(`openrouter` บน endpoint เริ่มต้นของมัน หรือผู้ให้บริการ/`base URL` ใดก็ตามที่ resolve
ไปยัง `openrouter.ai`)

สำหรับ `openrouter/deepseek/*`, `openrouter/moonshot*/*` และ `openrouter/zai/*`
สามารถใช้ `contextPruning.mode: "cache-ttl"` ได้ เพราะ OpenRouter
จัดการการแคชพรอมป์ต์ฝั่งผู้ให้บริการโดยอัตโนมัติ OpenClaw จะไม่ฉีดตัวทำเครื่องหมาย `cache_control` แบบ Anthropic ลงในคำขอเหล่านั้น

การสร้างแคชของ DeepSeek เป็นแบบ best-effort และอาจใช้เวลาสองสามวินาที
การติดตามผลทันทีอาจยังแสดง `cached_tokens: 0`; ให้ตรวจสอบอีกครั้งด้วยคำขอคำนำหน้าเดิมซ้ำ
หลังจากหน่วงสั้น ๆ และใช้ `usage.prompt_tokens_details.cached_tokens`
เป็นสัญญาณของ cache hit

หากคุณเปลี่ยนเส้นทางโมเดลไปยัง URL พร็อกซีที่เข้ากันได้กับ OpenAI แบบกำหนดเอง
OpenClaw จะหยุดฉีดตัวทำเครื่องหมายแคชแบบ Anthropic ที่เฉพาะกับ OpenRouter เหล่านั้น

### ผู้ให้บริการอื่น ๆ

หากผู้ให้บริการไม่รองรับโหมดแคชนี้ `cacheRetention` จะไม่มีผล

### Google Gemini direct API

- ทรานสปอร์ต Gemini โดยตรง (`api: "google-generative-ai"`) รายงาน cache hit
  ผ่าน `cachedContentTokenCount` จากต้นทาง; OpenClaw จะแมปค่านั้นไปยัง `cacheRead`
- เมื่อตั้งค่า `cacheRetention` บนโมเดล Gemini โดยตรง OpenClaw จะสร้าง
  นำกลับมาใช้ซ้ำ และรีเฟรชทรัพยากร `cachedContents` สำหรับ system prompt โดยอัตโนมัติ
  ในการรันบน Google AI Studio ซึ่งหมายความว่าคุณไม่จำเป็นต้องสร้าง
  handle ของ cached-content ไว้ล่วงหน้าด้วยตนเองอีกต่อไป
- คุณยังสามารถส่ง handle ของ Gemini cached-content ที่มีอยู่แล้วผ่าน
  `params.cachedContent` (หรือ `params.cached_content` แบบเดิม) บน
  โมเดลที่กำหนดค่าไว้
- สิ่งนี้แยกจากการแคช prompt-prefix แบบ Anthropic/OpenAI สำหรับ Gemini
  OpenClaw จะจัดการทรัพยากร `cachedContents` แบบเนทีฟของผู้ให้บริการ แทนที่จะ
  ฉีดตัวทำเครื่องหมายแคชลงในคำขอ

### การใช้งาน JSON ของ Gemini CLI

- เอาต์พุต JSON ของ Gemini CLI สามารถแสดง cache hit ผ่าน `stats.cached` ได้เช่นกัน
  OpenClaw จะแมปค่านั้นไปยัง `cacheRead`
- หาก CLI ไม่ได้ระบุค่า `stats.input` โดยตรง OpenClaw จะคำนวณโทเค็น input
  จาก `stats.input_tokens - stats.cached`
- นี่เป็นเพียงการทำให้การใช้งานเป็นมาตรฐานเท่านั้น ไม่ได้หมายความว่า OpenClaw กำลังสร้าง
  ตัวทำเครื่องหมาย prompt-cache แบบ Anthropic/OpenAI สำหรับ Gemini CLI

## ขอบเขตแคชของ system prompt

OpenClaw แยก system prompt ออกเป็น **คำนำหน้าคงที่**
และ **ส่วนต่อท้ายที่เปลี่ยนแปลงได้** โดยคั่นด้วยขอบเขต cache-prefix ภายใน เนื้อหาที่อยู่เหนือ
ขอบเขต (คำจำกัดความของเครื่องมือ ข้อมูลเมตาของ Skills ไฟล์ workspace และบริบทที่ค่อนข้างคงที่อื่น ๆ)
จะถูกจัดลำดับให้คง byte เดิมข้ามหลายเทิร์น
เนื้อหาที่อยู่ใต้ขอบเขต (เช่น `HEARTBEAT.md`, เวลา runtime และ
ข้อมูลเมตาต่อเทิร์นอื่น ๆ) สามารถเปลี่ยนแปลงได้โดยไม่ทำให้คำนำหน้าที่แคชไว้เป็นโมฆะ

ตัวเลือกการออกแบบหลัก:

- ไฟล์ project-context ของ workspace ที่คงที่จะถูกจัดไว้ก่อน `HEARTBEAT.md` ดังนั้น
  การเปลี่ยนแปลงจาก heartbeat จะไม่ทำให้ stable prefix เสีย
- ขอบเขตนี้ถูกใช้กับการจัดรูปแคชของตระกูล Anthropic, ตระกูล OpenAI, Google และ CLI
  ทำให้ผู้ให้บริการที่รองรับทั้งหมดได้รับประโยชน์จากความคงที่ของ prefix แบบเดียวกัน
- คำขอ Codex Responses และ Anthropic Vertex ถูกกำหนดเส้นทางผ่าน
  การจัดรูปแคชที่รับรู้ boundary เพื่อให้การนำแคชกลับมาใช้ซ้ำสอดคล้องกับสิ่งที่ผู้ให้บริการได้รับจริง
- fingerprint ของ system prompt จะถูกทำให้เป็นมาตรฐาน (ช่องว่าง, line ending,
  บริบทที่ hook เพิ่มเข้ามา, การเรียงลำดับความสามารถ runtime) เพื่อให้พรอมป์ต์ที่
  มีความหมายเหมือนเดิมแชร์ KV/cache ข้ามหลายเทิร์นได้

หากคุณพบการพุ่งขึ้นของ `cacheWrite` ที่ไม่คาดคิดหลังจากเปลี่ยนการตั้งค่าหรือ workspace
ให้ตรวจสอบว่าการเปลี่ยนแปลงนั้นอยู่เหนือหรือต่ำกว่าขอบเขตแคช การย้าย
เนื้อหาที่เปลี่ยนแปลงได้ลงไปใต้ขอบเขต (หรือทำให้มันคงที่) มักช่วยแก้ปัญหาได้

## ตัวป้องกันความคงที่ของแคชใน OpenClaw

OpenClaw ยังทำให้รูปแบบ payload ที่ไวต่อแคชหลายรายการมีลักษณะกำหนดแน่นอน
ก่อนที่คำขอจะไปถึงผู้ให้บริการ:

- แค็ตตาล็อกเครื่องมือ MCP แบบ bundle จะถูกเรียงลำดับอย่างกำหนดแน่นอนก่อน
  ลงทะเบียนเครื่องมือ ดังนั้นการเปลี่ยนลำดับ `listTools()` จะไม่ทำให้บล็อกเครื่องมือเปลี่ยนและ
  ไม่ทำให้คำนำหน้า prompt-cache เสีย
- เซสชันแบบเดิมที่มีบล็อกรูปภาพถูกเก็บถาวรไว้ จะคง **3 เทิร์นล่าสุดที่เสร็จสมบูรณ์**
  ไว้ตามเดิม; บล็อกรูปภาพเก่าที่ประมวลผลเสร็จแล้วอาจ
  ถูกแทนที่ด้วยตัวทำเครื่องหมาย เพื่อให้การติดตามผลที่ใช้รูปภาพมากไม่ต้องส่ง
  payload เก่าขนาดใหญ่ซ้ำอีก

## รูปแบบการปรับแต่ง

### ทราฟฟิกผสม (ค่าเริ่มต้นที่แนะนำ)

คง baseline ระยะยาวไว้บนเอเจนต์หลักของคุณ และปิดการแคชบนเอเจนต์แจ้งเตือนที่ทำงานเป็นช่วง ๆ:

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

### baseline ที่เน้นต้นทุนเป็นหลัก

- ตั้ง baseline `cacheRetention: "short"`
- เปิดใช้ `contextPruning.mode: "cache-ttl"`
- ให้ Heartbeat ต่ำกว่า TTL ของคุณเฉพาะกับเอเจนต์ที่ได้ประโยชน์จากแคชอุ่นเท่านั้น

## การวินิจฉัยแคช

OpenClaw แสดงการวินิจฉัย cache-trace โดยเฉพาะสำหรับการรันเอเจนต์แบบฝังตัว

สำหรับการวินิจฉัยทั่วไปที่ผู้ใช้มองเห็นได้ `/status` และสรุปการใช้งานอื่น ๆ สามารถใช้
รายการการใช้งานใน transcript ล่าสุดเป็นแหล่งข้อมูลทดแทนสำหรับ `cacheRead` /
`cacheWrite` ได้เมื่อรายการของเซสชันสดไม่มีตัวนับเหล่านั้น

## การทดสอบ regression แบบจริง

OpenClaw มีเกต regression ของแคชแบบจริงรวมชุดเดียวสำหรับคำนำหน้าที่ซ้ำ เทิร์นเครื่องมือ เทิร์นรูปภาพ transcript เครื่องมือสไตล์ MCP และตัวควบคุม Anthropic แบบไม่แคช

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

รัน live gate แบบแคบด้วย:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ไฟล์ baseline จะเก็บตัวเลขจริงล่าสุดที่สังเกตได้ พร้อม regression floor เฉพาะผู้ให้บริการที่ใช้โดยการทดสอบ
runner ยังใช้ session ID และ namespace ของพรอมป์ต์ใหม่ในแต่ละรอบด้วย เพื่อไม่ให้สถานะแคชก่อนหน้าไปรบกวนตัวอย่าง regression ปัจจุบัน

การทดสอบเหล่านี้ตั้งใจไม่ใช้เกณฑ์ความสำเร็จแบบเดียวกันกับทุกผู้ให้บริการ

### ความคาดหวังแบบจริงของ Anthropic

- คาดหวังการเขียน warmup แบบชัดเจนผ่าน `cacheWrite`
- คาดหวังการนำประวัติกลับมาใช้ซ้ำเกือบทั้งหมดในเทิร์นที่ซ้ำ เพราะการควบคุมแคชของ Anthropic จะเลื่อนจุดแบ่งแคชไปตามบทสนทนา
- การยืนยันแบบจริงปัจจุบันยังคงใช้เกณฑ์อัตรา hit สูงสำหรับเส้นทางแบบคงที่ แบบเครื่องมือ และแบบรูปภาพ

### ความคาดหวังแบบจริงของ OpenAI

- คาดหวังเฉพาะ `cacheRead` เท่านั้น `cacheWrite` จะยังคงเป็น `0`
- ให้ถือว่าการนำแคชกลับมาใช้ซ้ำในเทิร์นที่ซ้ำเป็น plateau เฉพาะผู้ให้บริการ ไม่ใช่การนำประวัติเต็มกลับมาใช้ซ้ำแบบเลื่อนตำแหน่งสไตล์ Anthropic
- การยืนยันแบบจริงปัจจุบันใช้การตรวจสอบ floor แบบอนุรักษ์นิยมที่อิงจากพฤติกรรมจริงที่สังเกตได้บน `gpt-5.4-mini`:
  - stable prefix: `cacheRead >= 4608`, อัตรา hit `>= 0.90`
  - transcript แบบเครื่องมือ: `cacheRead >= 4096`, อัตรา hit `>= 0.85`
  - transcript แบบรูปภาพ: `cacheRead >= 3840`, อัตรา hit `>= 0.82`
  - transcript แบบสไตล์ MCP: `cacheRead >= 4096`, อัตรา hit `>= 0.85`

การยืนยันแบบจริงรวมชุดใหม่เมื่อ 2026-04-04 ได้ผลลัพธ์ดังนี้:

- stable prefix: `cacheRead=4864`, อัตรา hit `0.966`
- transcript แบบเครื่องมือ: `cacheRead=4608`, อัตรา hit `0.896`
- transcript แบบรูปภาพ: `cacheRead=4864`, อัตรา hit `0.954`
- transcript แบบสไตล์ MCP: `cacheRead=4608`, อัตรา hit `0.891`

เวลา wall-clock ในเครื่องล่าสุดสำหรับเกตรวมชุดนี้อยู่ที่ประมาณ `88s`

เหตุผลที่การยืนยันต่างกัน:

- Anthropic เปิดเผยจุดแบ่งแคชแบบชัดเจนและการนำประวัติการสนทนากลับมาใช้ซ้ำแบบเลื่อนตำแหน่ง
- การแคชพรอมป์ต์ของ OpenAI ยังคงไวต่อ exact-prefix แต่ prefix ที่นำกลับมาใช้ซ้ำได้จริงในทราฟฟิก Responses แบบจริงอาจไปถึง plateau ได้ก่อนพรอมป์ต์เต็ม
- ด้วยเหตุนี้ การเปรียบเทียบ Anthropic และ OpenAI ด้วยเกณฑ์เปอร์เซ็นต์เดียวกันข้ามผู้ให้บริการจึงทำให้เกิด regression ปลอมได้

### การตั้งค่า `diagnostics.cacheTrace`

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

### ตัวสลับ env (สำหรับดีบักแบบครั้งเดียว)

- `OPENCLAW_CACHE_TRACE=1` เปิดใช้ cache tracing
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` override path ของเอาต์พุต
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` สลับการเก็บ payload ของข้อความเต็ม
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` สลับการเก็บข้อความพรอมป์ต์
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` สลับการเก็บ system prompt

### สิ่งที่ควรตรวจสอบ

- event ของ cache trace เป็น JSONL และมี snapshot ตามลำดับขั้น เช่น `session:loaded`, `prompt:before`, `stream:context` และ `session:after`
- ผลกระทบของโทเค็นแคชต่อเทิร์นสามารถดูได้ในพื้นผิวการใช้งานปกติผ่าน `cacheRead` และ `cacheWrite` (เช่น `/usage full` และสรุปการใช้งานของเซสชัน)
- สำหรับ Anthropic ให้คาดหวังทั้ง `cacheRead` และ `cacheWrite` เมื่อการแคชทำงานอยู่
- สำหรับ OpenAI ให้คาดหวัง `cacheRead` เมื่อเกิด cache hit และ `cacheWrite` จะยังคงเป็น `0`; OpenAI ไม่เผยแพร่ฟิลด์โทเค็น cache-write แยกต่างหาก
- หากคุณต้องการ request tracing ให้บันทึก request ID และส่วนหัว rate-limit แยกจากเมตริกแคช เอาต์พุต cache-trace ปัจจุบันของ OpenClaw มุ่งเน้นที่รูปร่างของพรอมป์ต์/เซสชันและการใช้งานโทเค็นที่ทำให้เป็นมาตรฐาน แทนส่วนหัวการตอบกลับดิบของผู้ให้บริการ

## การแก้ไขปัญหาอย่างรวดเร็ว

- `cacheWrite` สูงในเกือบทุกเทิร์น: ตรวจสอบอินพุต system prompt ที่เปลี่ยนแปลงได้ และยืนยันว่าโมเดล/ผู้ให้บริการรองรับการตั้งค่าแคชของคุณ
- `cacheWrite` สูงบน Anthropic: มักหมายความว่าจุดแบ่งแคชไปตกอยู่บนเนื้อหาที่เปลี่ยนทุกคำขอ
- `cacheRead` ของ OpenAI ต่ำ: ตรวจสอบว่า stable prefix อยู่ด้านหน้า repeated prefix ยาวอย่างน้อย 1024 โทเค็น และมีการใช้ `prompt_cache_key` เดิมซ้ำในเทิร์นที่ควรแชร์แคช
- ไม่มีผลจาก `cacheRetention`: ยืนยันว่าคีย์โมเดลตรงกับ `agents.defaults.models["provider/model"]`
- คำขอ Bedrock Nova/Mistral ที่มีการตั้งค่าแคช: เป็นพฤติกรรมที่คาดไว้ซึ่ง runtime จะบังคับเป็น `none`

เอกสารที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและต้นทุน](/th/reference/token-use)
- [Session pruning](/th/concepts/session-pruning)
- [ข้อมูลอ้างอิงการตั้งค่า Gateway](/th/gateway/configuration-reference)

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและต้นทุน](/th/reference/token-use)
- [การใช้งาน API และต้นทุน](/th/reference/api-usage-costs)
