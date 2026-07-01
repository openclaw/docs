---
read_when:
    - คุณต้องการลดต้นทุนโทเค็นของพรอมป์ด้วยการคงแคชไว้
    - คุณต้องการพฤติกรรมแคชแยกตามเอเจนต์ในการตั้งค่าแบบหลายเอเจนต์
    - คุณกำลังปรับแต่ง Heartbeat และการตัด cache-ttl ร่วมกัน
summary: ตัวปรับแต่งการแคชพรอมป์, ลำดับการผสาน, พฤติกรรมของผู้ให้บริการ และรูปแบบการปรับแต่ง
title: การแคชพรอมป์
x-i18n:
    generated_at: "2026-07-01T20:40:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

Prompt caching หมายถึงผู้ให้บริการโมเดลสามารถนำ prefix ของ prompt ที่ไม่เปลี่ยนแปลงกลับมาใช้ซ้ำได้ (โดยปกติคือคำสั่ง system/developer และบริบทเสถียรอื่น ๆ) ข้าม turn แทนที่จะประมวลผลใหม่ทุกครั้ง OpenClaw ทำให้การใช้งานจากผู้ให้บริการเป็นรูปแบบเดียวกันเป็น `cacheRead` และ `cacheWrite` เมื่อ API ต้นทางเปิดเผยตัวนับเหล่านั้นโดยตรง

พื้นผิวสถานะยังสามารถกู้คืนตัวนับ cache จาก usage log ของ transcript ล่าสุด
เมื่อ snapshot ของ session สดไม่มีข้อมูลเหล่านั้นได้ เพื่อให้ `/status` ยัง
แสดงบรรทัด cache ต่อได้หลังจาก metadata ของ session บางส่วนสูญหาย ค่า cache สด
ที่ไม่เป็นศูนย์ซึ่งมีอยู่แล้วยังคงมีลำดับความสำคัญเหนือค่ fallback จาก transcript

เหตุผลที่สำคัญ: ค่า token ต่ำลง การตอบสนองเร็วขึ้น และประสิทธิภาพที่คาดการณ์ได้มากขึ้นสำหรับ session ที่ทำงานยาวนาน หากไม่มี caching prompt ที่ซ้ำจะเสียต้นทุน prompt เต็มทุก turn แม้ input ส่วนใหญ่จะไม่เปลี่ยนก็ตาม

ส่วนด้านล่างครอบคลุมปุ่มปรับทั้งหมดที่เกี่ยวกับ cache ซึ่งส่งผลต่อการนำ prompt กลับมาใช้ซ้ำและต้นทุน token

ข้อมูลอ้างอิงของผู้ให้บริการ:

- Prompt caching ของ Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Prompt caching ของ OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- header ของ OpenAI API และ request ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- request ID และข้อผิดพลาดของ Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## ตัวปรับหลัก

### `cacheRetention` (ค่าเริ่มต้น global, โมเดล, และต่อ agent)

ตั้งค่าการเก็บ cache เป็นค่าเริ่มต้น global สำหรับทุกโมเดล:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

override ต่อโมเดล:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

override ต่อ agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

ลำดับการ merge config:

1. `agents.defaults.params` (ค่าเริ่มต้น global — ใช้กับทุกโมเดล)
2. `agents.defaults.models["provider/model"].params` (override ต่อโมเดล)
3. `agents.list[].params` (id ของ agent ที่ตรงกัน; override ตาม key)

### `contextPruning.mode: "cache-ttl"`

ตัดบริบทผลลัพธ์เครื่องมือเก่าหลังหน้าต่าง TTL ของ cache เพื่อให้คำขอหลัง idle ไม่ต้อง re-cache ประวัติที่ใหญ่เกินไป

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

ดูพฤติกรรมฉบับเต็มได้ที่ [การตัด Session](/th/concepts/session-pruning)

### ทำให้ Heartbeat อุ่นอยู่เสมอ

Heartbeat สามารถทำให้หน้าต่าง cache อุ่นอยู่เสมอและลดการเขียน cache ซ้ำหลังช่วง idle ได้

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

รองรับ heartbeat ต่อ agent ที่ `agents.list[].heartbeat`

## พฤติกรรมของผู้ให้บริการ

### Anthropic (API โดยตรง)

- รองรับ `cacheRetention`
- ด้วย profile การยืนยันตัวตนแบบ API key ของ Anthropic, OpenClaw จะ seed `cacheRetention: "short"` สำหรับ ref โมเดล Anthropic เมื่อไม่ได้ตั้งค่า
- response ของ Anthropic Messages แบบ native เปิดเผยทั้ง `cache_read_input_tokens` และ `cache_creation_input_tokens` ดังนั้น OpenClaw จึงแสดงได้ทั้ง `cacheRead` และ `cacheWrite`
- สำหรับคำขอ Anthropic แบบ native, `cacheRetention: "short"` map ไปยัง ephemeral cache ค่าเริ่มต้น 5 นาที และ `cacheRetention: "long"` อัปเกรดเป็น TTL 1 ชั่วโมงเฉพาะบน host โดยตรงของ `api.anthropic.com`

### OpenAI (API โดยตรง)

- Prompt caching เป็นอัตโนมัติบนโมเดลรุ่นใหม่ที่รองรับ OpenClaw ไม่จำเป็นต้อง inject marker cache ระดับ block
- OpenClaw ใช้ `prompt_cache_key` เพื่อให้การ route cache เสถียรข้าม turn host โดยตรงของ OpenAI ใช้ `prompt_cache_retention: "24h"` เมื่อเลือก `cacheRetention: "long"`
- ผู้ให้บริการ Completions ที่เข้ากันได้กับ OpenAI จะได้รับ `prompt_cache_key` เฉพาะเมื่อ config โมเดลของตนตั้งค่า `compat.supportsPromptCacheKey: true` อย่างชัดเจน การ forward การเก็บรักษาระยะยาวเป็น capability แยกต่างหาก: `cacheRetention: "long"` ที่ระบุชัดเจนจะส่ง `prompt_cache_retention: "24h"` เฉพาะเมื่อ entry ของ compat นั้นรองรับการเก็บ cache ระยะยาวด้วย ผู้ให้บริการเช่น Mistral สามารถเลือกใช้ cache key ขณะตั้งค่า `compat.supportsLongCacheRetention: false` เพื่อระงับ field การเก็บรักษาระยะยาว `cacheRetention: "none"` จะระงับทั้งสอง field
- response ของ OpenAI เปิดเผย token ของ prompt ที่ถูก cache ผ่าน `usage.prompt_tokens_details.cached_tokens` (หรือ `input_tokens_details.cached_tokens` บน event ของ Responses API) OpenClaw map ค่านั้นเป็น `cacheRead`
- usage ของ GPT-5.6 Responses ยังสามารถเปิดเผย `input_tokens_details.cache_write_tokens` ได้ OpenClaw map ค่านั้นเป็น `cacheWrite` และคิดราคาตามอัตรา cache-write ของโมเดล; Responses ที่ไม่ใส่ field นี้จะคง `cacheWrite` ไว้ที่ `0`
- OpenAI ส่งคืน header ที่มีประโยชน์สำหรับ tracing และ rate limit เช่น `x-request-id`, `openai-processing-ms`, และ `x-ratelimit-*` แต่การนับ cache hit ควรมาจาก payload ของ usage ไม่ใช่จาก header
- ในทางปฏิบัติ OpenAI มักทำงานเหมือน cache ของ prefix เริ่มต้นมากกว่าการ reuse ประวัติเต็มแบบเคลื่อนที่สไตล์ Anthropic turn ที่มีข้อความ prefix ยาวและเสถียรสามารถไปอยู่ใกล้ plateau ที่ `4864` cached-token ใน probe สดปัจจุบัน ขณะที่ transcript ที่ใช้เครื่องมือหนักหรือสไตล์ MCP มัก plateau ใกล้ `4608` cached token แม้จะทำซ้ำตรงกันทุกประการ

### Anthropic Vertex

- โมเดล Anthropic บน Vertex AI (`anthropic-vertex/*`) รองรับ `cacheRetention` แบบเดียวกับ Anthropic โดยตรง
- `cacheRetention: "long"` map ไปยัง TTL prompt-cache จริง 1 ชั่วโมงบน endpoint ของ Vertex AI
- ค่าเริ่มต้นการเก็บ cache สำหรับ `anthropic-vertex` ตรงกับค่าเริ่มต้นของ Anthropic โดยตรง
- คำขอ Vertex ถูก route ผ่านการจัดรูป cache ที่รู้ขอบเขต เพื่อให้การ reuse cache สอดคล้องกับสิ่งที่ผู้ให้บริการได้รับจริง

### Amazon Bedrock

- ref โมเดล Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) รองรับการ pass-through `cacheRetention` ที่ระบุชัดเจน
- โมเดล Bedrock ที่ไม่ใช่ Anthropic จะถูกบังคับเป็น `cacheRetention: "none"` ตอน runtime

### โมเดล OpenRouter

สำหรับ ref โมเดล `openrouter/anthropic/*`, OpenClaw inject
`cache_control` บน block ของ prompt system/developer เพื่อปรับปรุงการ reuse
prompt-cache เฉพาะเมื่อคำขอยังคงกำหนดเป้าหมายไปยัง route OpenRouter ที่ตรวจสอบแล้ว
(`openrouter` บน endpoint ค่าเริ่มต้นของมัน หรือ provider/base URL ใด ๆ ที่ resolve
เป็น `openrouter.ai`)

สำหรับ ref โมเดล `openrouter/deepseek/*`, `openrouter/moonshot*/*`, และ `openrouter/zai/*`,
อนุญาตให้ใช้ `contextPruning.mode: "cache-ttl"` เพราะ OpenRouter
จัดการ prompt caching ฝั่งผู้ให้บริการโดยอัตโนมัติ OpenClaw ไม่ inject
marker `cache_control` ของ Anthropic เข้าไปในคำขอเหล่านั้น

การสร้าง cache ของ DeepSeek เป็นแบบ best-effort และอาจใช้เวลาสองสามวินาที
การ follow-up ทันทีอาจยังแสดง `cached_tokens: 0`; ตรวจสอบด้วยคำขอ
prefix เดิมซ้ำหลังรอสั้น ๆ และใช้ `usage.prompt_tokens_details.cached_tokens`
เป็นสัญญาณ cache-hit

หากคุณชี้โมเดลไปยัง URL proxy ที่เข้ากันได้กับ OpenAI แบบใดก็ได้ OpenClaw
จะหยุด inject marker cache ของ Anthropic เฉพาะ OpenRouter เหล่านั้น

### ผู้ให้บริการอื่น

หากผู้ให้บริการไม่รองรับโหมด cache นี้ `cacheRetention` จะไม่มีผล

### Google Gemini direct API

- transport Gemini โดยตรง (`api: "google-generative-ai"`) รายงาน cache hit
  ผ่าน `cachedContentTokenCount` จากต้นทาง; OpenClaw map ค่านั้นเป็น `cacheRead`
- เมื่อมีการตั้ง `cacheRetention` บนโมเดล Gemini โดยตรง OpenClaw จะสร้าง
  reuse และ refresh resource `cachedContents` สำหรับ system prompt
  บนการรัน Google AI Studio โดยอัตโนมัติ ซึ่งหมายความว่าคุณไม่จำเป็นต้องสร้าง
  handle cached-content ไว้ล่วงหน้าด้วยตนเองอีกต่อไป
- คุณยังสามารถส่ง handle cached-content ของ Gemini ที่มีอยู่แล้วผ่านเป็น
  `params.cachedContent` (หรือ legacy `params.cached_content`) บนโมเดล
  ที่กำหนดค่าไว้ได้
- สิ่งนี้แยกจาก prompt-prefix caching ของ Anthropic/OpenAI สำหรับ Gemini,
  OpenClaw จัดการ resource `cachedContents` แบบ native ของผู้ให้บริการ แทนที่จะ
  inject marker cache เข้าไปในคำขอ

### การใช้งาน Gemini CLI

- output `stream-json` ของ Gemini CLI สามารถแสดง cache hit ผ่าน `stats.cached`;
  OpenClaw map ค่านั้นเป็น `cacheRead` override legacy `--output-format json` ใช้
  การ normalize usage เดียวกัน
- หาก CLI ไม่ใส่ค่า `stats.input` โดยตรง OpenClaw จะคำนวณ token input
  จาก `stats.input_tokens - stats.cached`
- นี่เป็นเพียงการ normalize usage เท่านั้น ไม่ได้หมายความว่า OpenClaw กำลังสร้าง
  marker prompt-cache สไตล์ Anthropic/OpenAI สำหรับ Gemini CLI

## ขอบเขต cache ของ system-prompt

OpenClaw แยก system prompt ออกเป็น **prefix เสถียร** และ **suffix ผันผวน**
คั่นด้วยขอบเขต cache-prefix ภายใน เนื้อหาเหนือขอบเขต
(นิยามเครื่องมือ, metadata ของ Skills, ไฟล์ workspace, และบริบทอื่น ๆ
ที่ค่อนข้างคงที่) ถูกจัดลำดับเพื่อให้ byte-identical ข้าม turn
เนื้อหาใต้ขอบเขต (เช่น `HEARTBEAT.md`, timestamp runtime, และ
metadata ต่อ turn อื่น ๆ) สามารถเปลี่ยนได้โดยไม่ทำให้ prefix ที่ cache ไว้
ใช้งานไม่ได้

ตัวเลือกการออกแบบสำคัญ:

- ไฟล์ project-context ของ workspace ที่เสถียรถูกจัดลำดับก่อน `HEARTBEAT.md` เพื่อให้
  churn ของ heartbeat ไม่ทำลาย prefix ที่เสถียร
- ขอบเขตนี้ถูกใช้กับการจัดรูป transport ตระกูล Anthropic, ตระกูล OpenAI, Google, และ
  CLI เพื่อให้ผู้ให้บริการที่รองรับทั้งหมดได้ประโยชน์จากความเสถียรของ prefix เดียวกัน
- คำขอ Codex Responses และ Anthropic Vertex ถูก route ผ่าน
  การจัดรูป cache ที่รู้ขอบเขต เพื่อให้การ reuse cache สอดคล้องกับสิ่งที่ผู้ให้บริการ
  ได้รับจริง
- fingerprint ของ system-prompt ถูก normalize (ช่องว่าง, line ending,
  บริบทที่ hook เพิ่ม, การจัดลำดับ capability ของ runtime) เพื่อให้ prompt
  ที่ไม่เปลี่ยนในเชิงความหมายใช้ KV/cache ร่วมกันข้าม turn

หากคุณเห็น spike ของ `cacheWrite` ที่ไม่คาดคิดหลังเปลี่ยน config หรือ workspace
ให้ตรวจสอบว่าการเปลี่ยนนั้นอยู่เหนือหรือใต้ขอบเขต cache การย้าย
เนื้อหาที่ผันผวนลงใต้ขอบเขต (หรือทำให้มันเสถียร) มักแก้ปัญหาได้

## guard ความเสถียรของ cache ใน OpenClaw

OpenClaw ยังทำให้รูป payload หลายรายการที่อ่อนไหวต่อ cache deterministic ก่อน
คำขอจะไปถึงผู้ให้บริการ:

- catalog เครื่องมือ MCP ของ bundle ถูก sort แบบ deterministic ก่อนการ
  ลงทะเบียนเครื่องมือ ดังนั้นการเปลี่ยนลำดับ `listTools()` จะไม่ทำให้ block เครื่องมือ churn และ
  ไม่ทำลาย prefix ของ prompt-cache
- session legacy ที่มี block รูปภาพคงอยู่จะรักษา **3 turn ที่เสร็จสมบูรณ์ล่าสุด**
  ไว้ครบถ้วน; block รูปภาพเก่าที่ประมวลผลแล้วอาจถูกแทนที่ด้วย marker
  เพื่อให้ follow-up ที่มีรูปภาพจำนวนมากไม่ต้องส่ง payload เก่าขนาดใหญ่ซ้ำต่อไป

## รูปแบบการปรับแต่ง

### traffic ผสม (ค่าเริ่มต้นที่แนะนำ)

รักษา baseline อายุยาวไว้บน agent หลักของคุณ ปิด caching บน agent แจ้งเตือนที่ bursty:

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

### baseline เน้นต้นทุน

- ตั้ง baseline `cacheRetention: "short"`
- เปิดใช้ `contextPruning.mode: "cache-ttl"`
- ให้ heartbeat ต่ำกว่า TTL ของคุณเฉพาะสำหรับ agent ที่ได้ประโยชน์จาก cache อุ่น

## การวินิจฉัย cache

OpenClaw เปิดเผยการวินิจฉัย cache-trace เฉพาะสำหรับการรัน agent แบบ embedded

สำหรับการวินิจฉัยที่ผู้ใช้ทั่วไปเห็นได้ `/status` และสรุป usage อื่น ๆ สามารถใช้
entry usage ของ transcript ล่าสุดเป็นแหล่ง fallback สำหรับ `cacheRead` /
`cacheWrite` เมื่อ entry ของ session สดไม่มีตัวนับเหล่านั้น

## การทดสอบ regression สด

OpenClaw มี gate regression cache สดแบบรวมหนึ่งชุดสำหรับ prefix ที่ซ้ำ, turn เครื่องมือ, turn รูปภาพ, transcript เครื่องมือสไตล์ MCP, และ control แบบ no-cache ของ Anthropic

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

รัน gate สดแบบแคบด้วย:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ไฟล์ baseline เก็บตัวเลข live ล่าสุดที่สังเกตได้ รวมถึง regression floor เฉพาะผู้ให้บริการที่การทดสอบใช้
runner ยังใช้ ID เซสชันและ namespace ของพรอมป์แบบใหม่สำหรับแต่ละรัน เพื่อให้สถานะแคชก่อนหน้าไม่ปนเปื้อนตัวอย่าง regression ปัจจุบัน

การทดสอบเหล่านี้ตั้งใจไม่ใช้เกณฑ์ความสำเร็จที่เหมือนกันทุกประการระหว่างผู้ให้บริการ

### ความคาดหวัง live สำหรับ Anthropic

- คาดว่าจะมีการเขียน warmup อย่างชัดเจนผ่าน `cacheWrite`
- คาดว่าจะนำประวัติเกือบทั้งหมดกลับมาใช้ซ้ำในเทิร์นที่ซ้ำกัน เพราะการควบคุมแคชของ Anthropic จะเลื่อนจุดแบ่งแคชไปตามบทสนทนา
- assertion live ปัจจุบันยังใช้เกณฑ์อัตรา hit สูงสำหรับเส้นทาง stable, tool และ image

### ความคาดหวัง live สำหรับ OpenAI

- คาดว่าจะมีเฉพาะ `cacheRead` ส่วน `cacheWrite` ยังคงเป็น `0`
- ให้ถือว่าการนำแคชกลับมาใช้ซ้ำในเทิร์นที่ซ้ำกันเป็น plateau เฉพาะผู้ให้บริการ ไม่ใช่การนำประวัติเต็มรูปแบบที่เลื่อนไปเรื่อย ๆ แบบ Anthropic
- assertion live ปัจจุบันใช้การตรวจสอบ floor แบบอนุรักษ์นิยมที่ได้มาจากพฤติกรรม live ที่สังเกตบน `gpt-5.4-mini`:
  - stable prefix: `cacheRead >= 4608`, อัตรา hit `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, อัตรา hit `>= 0.85`
  - image transcript: `cacheRead >= 3840`, อัตรา hit `>= 0.82`
  - MCP-style transcript: `cacheRead >= 4096`, อัตรา hit `>= 0.85`

การตรวจสอบ live แบบรวมล่าสุดเมื่อ 2026-04-04 ได้ผลดังนี้:

- stable prefix: `cacheRead=4864`, อัตรา hit `0.966`
- tool transcript: `cacheRead=4608`, อัตรา hit `0.896`
- image transcript: `cacheRead=4864`, อัตรา hit `0.954`
- MCP-style transcript: `cacheRead=4608`, อัตรา hit `0.891`

เวลา wall-clock ล่าสุดในเครื่องสำหรับ gate แบบรวมอยู่ที่ประมาณ `88s`

เหตุผลที่ assertion แตกต่างกัน:

- Anthropic เปิดเผยจุดแบ่งแคชอย่างชัดเจนและการนำประวัติบทสนทนาที่เลื่อนไปเรื่อย ๆ กลับมาใช้ซ้ำ
- การแคชพรอมป์ของ OpenAI ยังอ่อนไหวต่อ exact-prefix แต่ prefix ที่นำกลับมาใช้ซ้ำได้จริงในทราฟฟิก Responses แบบ live อาจ plateau ก่อนถึงพรอมป์เต็ม
- ด้วยเหตุนี้ การเปรียบเทียบ Anthropic และ OpenAI ด้วยเกณฑ์เปอร์เซ็นต์เดียวข้ามผู้ให้บริการจึงสร้าง regression เทียม

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

### toggle ของ env (การดีบักแบบครั้งเดียว)

- `OPENCLAW_CACHE_TRACE=1` เปิดใช้การติดตามแคช
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` แทนที่พาธเอาต์พุต
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` สลับการจับ payload ข้อความแบบเต็ม
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` สลับการจับข้อความพรอมป์
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` สลับการจับ system prompt

### สิ่งที่ควรตรวจสอบ

- เหตุการณ์ cache trace เป็น JSONL และมี snapshot ตามขั้น เช่น `session:loaded`, `prompt:before`, `stream:context` และ `session:after`
- ผลกระทบของโทเค็นแคชต่อเทิร์นมองเห็นได้ในพื้นผิวการใช้งานปกติผ่าน `cacheRead` และ `cacheWrite` (เช่น `/usage tokens`, `/status`, สรุปการใช้งานเซสชัน และเลย์เอาต์ `messages.usageTemplate` แบบกำหนดเอง)
- สำหรับ Anthropic ให้คาดว่าจะมีทั้ง `cacheRead` และ `cacheWrite` เมื่อการแคชทำงานอยู่
- สำหรับ OpenAI ให้คาดว่าจะมี `cacheRead` เมื่อ cache hit นอกจากนี้ GPT-5.6 Responses ยังสามารถรายงาน `cacheWrite` ขณะเขียนส่วนของพรอมป์ได้ ส่วน payload ของ Responses อื่นที่ละเว้นตัวนับการเขียนจะคงค่าไว้ที่ `0`
- หากคุณต้องการการติดตามคำขอ ให้บันทึก ID คำขอและ header ของ rate-limit แยกจากเมตริกแคช เอาต์พุต cache-trace ปัจจุบันของ OpenClaw มุ่งเน้นที่รูปทรงของพรอมป์/เซสชันและการใช้โทเค็นที่ทำให้เป็นมาตรฐานแล้ว มากกว่า header การตอบกลับดิบจากผู้ให้บริการ

## การแก้ปัญหาอย่างรวดเร็ว

- `cacheWrite` สูงในเทิร์นส่วนใหญ่: ตรวจสอบอินพุต system-prompt ที่เปลี่ยนแปลงบ่อย และยืนยันว่าโมเดล/ผู้ให้บริการรองรับการตั้งค่าแคชของคุณ
- `cacheWrite` สูงบน Anthropic: มักหมายความว่าจุดแบ่งแคชไปตกบนเนื้อหาที่เปลี่ยนทุกคำขอ
- `cacheRead` ต่ำบน OpenAI: ยืนยันว่า stable prefix อยู่ด้านหน้า, repeated prefix มีอย่างน้อย 1024 โทเค็น และมีการนำ `prompt_cache_key` เดิมกลับมาใช้ซ้ำสำหรับเทิร์นที่ควรแชร์แคช
- `cacheRetention` ไม่มีผล: ยืนยันว่า key ของโมเดลตรงกับ `agents.defaults.models["provider/model"]`
- คำขอ Bedrock Nova/Mistral ที่มีการตั้งค่าแคช: คาดว่ารันไทม์จะบังคับเป็น `none`

เอกสารที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การตัดแต่งเซสชัน](/th/concepts/session-pruning)
- [ข้อมูลอ้างอิงการตั้งค่า Gateway](/th/gateway/configuration-reference)

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
