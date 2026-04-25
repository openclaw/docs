---
read_when:
    - คุณต้องการเข้าใจว่าฟีเจอร์ใดบ้างที่อาจเรียกใช้ API แบบมีค่าใช้จ่าย
    - คุณต้องตรวจสอบคีย์ ค่าใช้จ่าย และการมองเห็นการใช้งาน
    - คุณกำลังอธิบายการรายงานค่าใช้จ่ายของ /status หรือ /usage
summary: ตรวจสอบสิ่งที่อาจมีค่าใช้จ่าย คีย์ที่ถูกใช้ และวิธีดูการใช้งาน
title: การใช้งาน API และค่าใช้จ่าย
x-i18n:
    generated_at: "2026-04-25T13:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# การใช้งาน API และค่าใช้จ่าย

เอกสารนี้แสดงรายการ **ฟีเจอร์ที่สามารถเรียกใช้คีย์ API** และตำแหน่งที่ค่าใช้จ่ายของฟีเจอร์เหล่านั้นจะแสดงขึ้น โดยเน้นที่
ฟีเจอร์ของ OpenClaw ที่อาจก่อให้เกิดการใช้งาน provider หรือการเรียก API แบบมีค่าใช้จ่าย

## ค่าใช้จ่ายแสดงที่ไหนบ้าง (แชต + CLI)

**ภาพรวมค่าใช้จ่ายต่อเซสชัน**

- `/status` แสดงโมเดลของเซสชันปัจจุบัน การใช้ context และโทเค็นของคำตอบล่าสุด
- หากโมเดลใช้ **การยืนยันตัวตนด้วยคีย์ API** `/status` จะแสดง **ค่าใช้จ่ายโดยประมาณ** ของคำตอบล่าสุดด้วย
- หากเมทาดาทาของเซสชันแบบเรียลไทม์มีไม่ครบ `/status` สามารถกู้คืนตัวนับ
  โทเค็น/แคชและป้ายกำกับโมเดล runtime ที่ใช้งานอยู่จากรายการการใช้งานล่าสุดใน transcript
  ค่าแบบเรียลไทม์ที่ไม่เป็นศูนย์ที่มีอยู่แล้วจะยังคงมีลำดับความสำคัญสูงกว่า และยอดรวมจาก transcript
  ที่มีขนาดระดับ prompt อาจถูกใช้แทนเมื่อยอดรวมที่จัดเก็บไว้ไม่มีหรือมีค่าน้อยกว่า

**ส่วนท้ายค่าใช้จ่ายต่อข้อความ**

- `/usage full` จะเพิ่มส่วนท้ายการใช้งานให้กับทุกคำตอบ รวมถึง **ค่าใช้จ่ายโดยประมาณ** (เฉพาะคีย์ API)
- `/usage tokens` จะแสดงเฉพาะโทเค็น; โฟลว์แบบ OAuth/token สไตล์ subscription และโฟลว์ CLI จะซ่อนค่าใช้จ่ายเป็นดอลลาร์
- หมายเหตุสำหรับ Gemini CLI: เมื่อ CLI ส่งคืนเอาต์พุตแบบ JSON OpenClaw จะอ่านการใช้งานจาก
  `stats`, ปรับ `stats.cached` ให้เป็น `cacheRead`, และคำนวณโทเค็นขาเข้า
  จาก `stats.input_tokens - stats.cached` เมื่อจำเป็น

หมายเหตุสำหรับ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p`
ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะประกาศนโยบายใหม่
อย่างไรก็ตาม Anthropic ยังไม่เปิดเผยค่าประมาณเป็นดอลลาร์ต่อข้อความที่ OpenClaw
สามารถแสดงใน `/usage full` ได้

**หน้าต่างการใช้งานของ CLI (โควตาของ provider)**

- `openclaw status --usage` และ `openclaw channels list` จะแสดง **หน้าต่างการใช้งาน**
  ของ provider (ภาพรวมโควตา ไม่ใช่ค่าใช้จ่ายต่อข้อความ)
- เอาต์พุตแบบอ่านโดยมนุษย์จะถูกทำให้เป็นรูปแบบ `เหลือ X%` เหมือนกันในทุก provider
- provider หน้าต่างการใช้งานในปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai
- หมายเหตุสำหรับ MiniMax: ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึง
  โควตาที่เหลือ ดังนั้น OpenClaw จะกลับค่าก่อนนำไปแสดง ฟิลด์แบบนับจำนวนจะยังคงมีลำดับความสำคัญ
  สูงกว่าเมื่อมีอยู่ หาก provider ส่งคืน `model_remains` OpenClaw จะเลือกใช้รายการ chat-model,
  สร้างป้ายกำกับหน้าต่างจาก timestamp เมื่อจำเป็น และรวมชื่อโมเดลไว้ในป้ายกำกับแพ็กเกจ
- การยืนยันตัวตนสำหรับหน้าต่างโควตาเหล่านั้นมาจาก hook เฉพาะของ provider เมื่อมีให้ใช้;
  มิฉะนั้น OpenClaw จะย้อนกลับไปใช้ข้อมูลรับรอง OAuth/API-key
  ที่ตรงกันจาก auth profiles, env หรือ config

ดู [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use) สำหรับรายละเอียดและตัวอย่าง

## วิธีค้นหาคีย์

OpenClaw สามารถรับข้อมูลรับรองได้จาก:

- **Auth profiles** (ต่อ agent เก็บไว้ใน `auth-profiles.json`)
- **ตัวแปรสภาพแวดล้อม** (เช่น `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`)
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`)
- **Skills** (`skills.entries.<name>.apiKey`) ซึ่งอาจส่งออกคีย์ไปยัง env ของ process ของ skill

## ฟีเจอร์ที่อาจใช้คีย์จนเกิดค่าใช้จ่าย

### 1) คำตอบของโมเดลหลัก (แชต + tools)

ทุกคำตอบหรือการเรียก tool จะใช้ **provider ของโมเดลปัจจุบัน** (OpenAI, Anthropic ฯลฯ) ซึ่งเป็น
แหล่งหลักของการใช้งานและค่าใช้จ่าย

ซึ่งรวมถึง provider แบบโฮสต์สไตล์ subscription ที่ยังคงคิดค่าบริการนอก
UI ภายในเครื่องของ OpenClaw เช่น **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** และ
เส้นทาง Claude-login ของ OpenClaw บน Anthropic ที่เปิดใช้ **Extra Usage**

ดู [Models](/th/providers/models) สำหรับ config ด้านราคา และ [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use) สำหรับการแสดงผล

### 2) การทำความเข้าใจสื่อ (เสียง/ภาพ/วิดีโอ)

สื่อขาเข้าสามารถถูกสรุปหรือถอดเสียงก่อนที่การตอบกลับจะเริ่มทำงานได้ ซึ่งใช้ API ของโมเดล/provider

- เสียง: OpenAI / Groq / Deepgram / Google / Mistral
- ภาพ: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI
- วิดีโอ: Google / Qwen / Moonshot

ดู [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)

### 3) การสร้างภาพและวิดีโอ

ความสามารถในการสร้างแบบใช้ร่วมกันอาจใช้คีย์ของ provider จนเกิดค่าใช้จ่ายได้เช่นกัน:

- การสร้างภาพ: OpenAI / Google / fal / MiniMax
- การสร้างวิดีโอ: Qwen

การสร้างภาพสามารถอนุมานค่าเริ่มต้นของ provider ที่อาศัยการยืนยันตัวตนได้เมื่อ
ยังไม่ได้ตั้งค่า `agents.defaults.imageGenerationModel` ส่วนการสร้างวิดีโอในปัจจุบัน
ต้องระบุ `agents.defaults.videoGenerationModel` อย่างชัดเจน เช่น
`qwen/wan2.6-t2v`

ดู [การสร้างภาพ](/th/tools/image-generation), [Qwen Cloud](/th/providers/qwen),
และ [Models](/th/concepts/models)

### 4) Embedding ของ memory + การค้นหาเชิงความหมาย

การค้นหา memory เชิงความหมายใช้ **API ของ embedding** เมื่อกำหนดค่าให้ใช้ provider ระยะไกล:

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings (ภายในเครื่อง/โฮสต์เอง)
- `memorySearch.provider = "ollama"` → Ollama embeddings (ภายในเครื่อง/โฮสต์เอง; โดยทั่วไปไม่มีค่าใช้จ่าย API แบบโฮสต์)
- fallback แบบไม่บังคับไปยัง provider ระยะไกลหาก local embeddings ล้มเหลว

คุณสามารถให้ทำงานในเครื่องทั้งหมดได้ด้วย `memorySearch.provider = "local"` (ไม่มีการใช้งาน API)

ดู [Memory](/th/concepts/memory)

### 5) เครื่องมือค้นหาเว็บ

`web_search` อาจก่อให้เกิดค่าบริการการใช้งานขึ้นอยู่กับ provider ของคุณ:

- **Brave Search API**: `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` หรือ `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: ไม่มีคีย์โดยค่าเริ่มต้น แต่ต้องมีโฮสต์ Ollama ที่เข้าถึงได้พร้อม `ollama signin`; ยังสามารถนำ bearer auth ของ provider Ollama ปกติมาใช้ซ้ำได้เมื่อโฮสต์ต้องการ
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback แบบไม่ใช้คีย์ (ไม่มีค่าบริการ API แต่ไม่เป็นทางการและอิง HTML)
- **SearXNG**: `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ไม่ใช้คีย์/โฮสต์เอง; ไม่มีค่าบริการ API แบบโฮสต์)

เส้นทาง provider แบบ legacy `tools.web.search.*` ยังคงโหลดผ่าน compatibility shim ชั่วคราวได้ แต่ไม่ใช่พื้นผิว config ที่แนะนำอีกต่อไป

**เครดิตฟรีของ Brave Search:** แต่ละแพ็กเกจของ Brave มีเครดิตฟรีต่ออายุ
\$5/เดือน แพ็กเกจ Search มีราคา \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตนี้จึงครอบคลุม
1,000 คำขอต่อเดือนโดยไม่มีค่าใช้จ่าย ตั้งค่าขีดจำกัดการใช้งานในแดชบอร์ด Brave
เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด

ดู [เครื่องมือเว็บ](/th/tools/web)

### 5) เครื่องมือดึงข้อมูลเว็บ (Firecrawl)

`web_fetch` สามารถเรียกใช้ **Firecrawl** ได้เมื่อมีคีย์ API:

- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webFetch.apiKey`

หากไม่ได้กำหนดค่า Firecrawl ไว้ เครื่องมือจะ fallback ไปใช้ direct fetch ร่วมกับ plugin `web-readability` ที่บันเดิลมา (ไม่มี API แบบมีค่าใช้จ่าย) ปิด `plugins.entries.web-readability.enabled` เพื่อข้ามการสกัด Readability ภายในเครื่อง

ดู [เครื่องมือเว็บ](/th/tools/web)

### 6) ภาพรวมการใช้งานของ provider (สถานะ/สุขภาพ)

คำสั่งสถานะบางรายการเรียกใช้ **endpoint การใช้งานของ provider** เพื่อแสดงหน้าต่างโควตาหรือสถานะสุขภาพของการยืนยันตัวตน
โดยปกติแล้วเป็นคำขอปริมาณต่ำ แต่ยังคงเข้าถึง API ของ provider:

- `openclaw status --usage`
- `openclaw models status --json`

ดู [Models CLI](/th/cli/models)

### 7) การสรุปเพื่อป้องกัน Compaction

กลไกป้องกัน Compaction สามารถสรุปประวัติเซสชันโดยใช้ **โมเดลปัจจุบัน** ซึ่ง
จะเรียกใช้ API ของ provider เมื่อมันทำงาน

ดู [การจัดการเซสชัน + Compaction](/th/reference/session-management-compaction)

### 8) การสแกน / โพรบโมเดล

`openclaw models scan` สามารถโพรบโมเดล OpenRouter และใช้ `OPENROUTER_API_KEY` เมื่อ
เปิดใช้งานการโพรบ

ดู [Models CLI](/th/cli/models)

### 9) Talk (เสียงพูด)

โหมด Talk สามารถเรียกใช้ **ElevenLabs** เมื่อมีการกำหนดค่า:

- `ELEVENLABS_API_KEY` หรือ `talk.providers.elevenlabs.apiKey`

ดู [โหมด Talk](/th/nodes/talk)

### 10) Skills (API ของบุคคลที่สาม)

Skills สามารถเก็บ `apiKey` ไว้ใน `skills.entries.<name>.apiKey` หาก skill ใช้คีย์นั้นกับ
API ภายนอก ก็อาจก่อให้เกิดค่าใช้จ่ายตาม provider ของ skill นั้นได้

ดู [Skills](/th/tools/skills)

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [Prompt caching](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
