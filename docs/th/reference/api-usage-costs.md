---
read_when:
    - คุณต้องการเข้าใจว่าฟีเจอร์ใดบ้างที่อาจเรียกใช้ API แบบมีค่าใช้จ่าย
    - คุณต้องตรวจสอบคีย์ ค่าใช้จ่าย และการมองเห็นข้อมูลการใช้งาน
    - คุณกำลังอธิบายการรายงานค่าใช้จ่ายของ /status หรือ /usage
summary: ตรวจสอบว่าสิ่งใดสามารถก่อค่าใช้จ่ายได้ ใช้คีย์ใดบ้าง และวิธีดูปริมาณการใช้งาน
title: การใช้งาน API และค่าใช้จ่าย
x-i18n:
    generated_at: "2026-05-06T09:29:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

เอกสารนี้แสดงรายการ **ฟีเจอร์ที่สามารถเรียกใช้คีย์ API** และตำแหน่งที่ค่าใช้จ่ายของฟีเจอร์เหล่านั้นแสดงขึ้น โดยเน้นที่ฟีเจอร์ของ OpenClaw ที่สามารถสร้างการใช้งานผู้ให้บริการหรือการเรียก API แบบมีค่าใช้จ่ายได้

## ตำแหน่งที่ค่าใช้จ่ายแสดงขึ้น (แชต + CLI)

**สแนปช็อตค่าใช้จ่ายต่อเซสชัน**

- `/status` แสดงโมเดลของเซสชันปัจจุบัน การใช้บริบท และโทเค็นของคำตอบล่าสุด
- หากโมเดลใช้ **การยืนยันตัวตนด้วยคีย์ API** `/status` จะแสดง **ค่าใช้จ่ายโดยประมาณ** สำหรับคำตอบล่าสุดด้วย
- หากเมตาดาต้าเซสชันสดมีน้อย `/status` สามารถกู้ตัวนับโทเค็น/แคช
  และป้ายกำกับโมเดลรันไทม์ที่ใช้งานอยู่จากรายการการใช้งานทรานสคริปต์ล่าสุดได้
  ค่าสดที่มีอยู่และไม่เป็นศูนย์ยังคงมีลำดับความสำคัญก่อน และยอดรวมทรานสคริปต์
  ขนาดพรอมต์อาจชนะเมื่อยอดรวมที่จัดเก็บไว้หายไปหรือน้อยกว่า

**ส่วนท้ายค่าใช้จ่ายต่อข้อความ**

- `/usage full` เพิ่มส่วนท้ายการใช้งานให้ทุกคำตอบ รวมถึง **ค่าใช้จ่ายโดยประมาณ** (เฉพาะคีย์ API)
- `/usage tokens` แสดงเฉพาะโทเค็น; โฟลว์ OAuth/โทเค็นแบบสมัครสมาชิกและ CLI จะซ่อนค่าใช้จ่ายเป็นดอลลาร์
- หมายเหตุ Gemini CLI: เมื่อ CLI ส่งคืนเอาต์พุต JSON, OpenClaw จะอ่านการใช้งานจาก
  `stats`, ทำให้ `stats.cached` เป็น `cacheRead` ตามรูปแบบมาตรฐาน และคำนวณโทเค็นอินพุต
  จาก `stats.input_tokens - stats.cached` เมื่อจำเป็น

หมายเหตุ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p`
ได้รับอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
Anthropic ยังไม่เปิดเผยค่าประมาณดอลลาร์ต่อข้อความที่ OpenClaw สามารถ
แสดงใน `/usage full` ได้

**หน้าต่างการใช้งาน CLI (โควตาผู้ให้บริการ)**

- `openclaw status --usage` และ `openclaw channels list` แสดง **หน้าต่างการใช้งาน** ของผู้ให้บริการ
  (สแนปช็อตโควตา ไม่ใช่ค่าใช้จ่ายต่อข้อความ)
- เอาต์พุตสำหรับมนุษย์ถูกทำให้เป็นรูปแบบมาตรฐานเป็น `X% left` ข้ามผู้ให้บริการ
- ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai
- หมายเหตุ MiniMax: ฟิลด์ดิบ `usage_percent` / `usagePercent` หมายถึงโควตาที่เหลืออยู่
  ดังนั้น OpenClaw จะกลับค่าก่อนแสดงผล ฟิลด์แบบนับจำนวนยังคงชนะ
  เมื่อมีอยู่ หากผู้ให้บริการส่งคืน `model_remains`, OpenClaw จะใช้รายการ
  โมเดลแชตก่อน คำนวณป้ายกำกับหน้าต่างจากไทม์สแตมป์เมื่อจำเป็น และ
  รวมชื่อโมเดลในป้ายกำกับแผน
- การยืนยันตัวตนสำหรับการใช้งานของหน้าต่างโควตาเหล่านั้นมาจากฮุกเฉพาะผู้ให้บริการเมื่อ
  มีให้ใช้; มิฉะนั้น OpenClaw จะย้อนกลับไปใช้ข้อมูลประจำตัว OAuth/คีย์ API
  ที่ตรงกันจากโปรไฟล์การยืนยันตัวตน env หรือ config

ดูรายละเอียดและตัวอย่างที่ [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)

## วิธีค้นพบคีย์

OpenClaw สามารถรับข้อมูลประจำตัวจาก:

- **โปรไฟล์การยืนยันตัวตน** (ต่อเอเจนต์ จัดเก็บใน `auth-profiles.json`)
- **ตัวแปรสภาพแวดล้อม** (เช่น `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`)
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`)
- **Skills** (`skills.entries.<name>.apiKey`) ซึ่งอาจส่งออกคีย์ไปยัง env ของโปรเซสสกิล

## ฟีเจอร์ที่สามารถใช้คีย์และเกิดค่าใช้จ่าย

### 1) คำตอบโมเดลหลัก (แชต + เครื่องมือ)

ทุกคำตอบหรือการเรียกเครื่องมือใช้ **ผู้ให้บริการโมเดลปัจจุบัน** (OpenAI, Anthropic ฯลฯ) นี่คือ
แหล่งหลักของการใช้งานและค่าใช้จ่าย

รายการนี้ยังรวมถึงผู้ให้บริการแบบโฮสต์สไตล์สมัครสมาชิกที่ยังคงคิดค่าบริการนอก
UI ภายในเครื่องของ OpenClaw เช่น **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** และ
เส้นทางเข้าสู่ระบบ Claude ของ OpenClaw ของ Anthropic ที่เปิดใช้ **การใช้งานเพิ่มเติม**

ดูการตั้งค่าราคาที่ [โมเดล](/th/providers/models) และการแสดงผลที่ [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)

### 2) การทำความเข้าใจสื่อ (เสียง/ภาพ/วิดีโอ)

สื่อขาเข้าสามารถถูกสรุป/ถอดเสียงก่อนที่คำตอบจะทำงานได้ สิ่งนี้ใช้ API ของโมเดล/ผู้ให้บริการ

- เสียง: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral
- ภาพ: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI
- วิดีโอ: Google / Qwen / Moonshot

ดู [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)

### 3) การสร้างภาพและวิดีโอ

ความสามารถการสร้างแบบใช้ร่วมกันสามารถใช้คีย์ผู้ให้บริการและเกิดค่าใช้จ่ายได้เช่นกัน:

- การสร้างภาพ: OpenAI / Google / DeepInfra / fal / MiniMax
- การสร้างวิดีโอ: DeepInfra / Qwen

การสร้างภาพสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้เมื่อ
ไม่ได้ตั้งค่า `agents.defaults.imageGenerationModel` ปัจจุบันการสร้างวิดีโอ
ต้องใช้ `agents.defaults.videoGenerationModel` ที่ระบุชัดเจน เช่น
`qwen/wan2.6-t2v`

ดู [การสร้างภาพ](/th/tools/image-generation), [Qwen Cloud](/th/providers/qwen),
และ [โมเดล](/th/concepts/models)

### 4) เอ็มเบดดิงของหน่วยความจำ + การค้นหาเชิงความหมาย

การค้นหาหน่วยความจำเชิงความหมายใช้ **embedding APIs** เมื่อกำหนดค่าสำหรับผู้ให้บริการระยะไกล:

- `memorySearch.provider = "openai"` → เอ็มเบดดิง OpenAI
- `memorySearch.provider = "gemini"` → เอ็มเบดดิง Gemini
- `memorySearch.provider = "voyage"` → เอ็มเบดดิง Voyage
- `memorySearch.provider = "mistral"` → เอ็มเบดดิง Mistral
- `memorySearch.provider = "deepinfra"` → เอ็มเบดดิง DeepInfra
- `memorySearch.provider = "lmstudio"` → เอ็มเบดดิง LM Studio (ภายในเครื่อง/โฮสต์เอง)
- `memorySearch.provider = "ollama"` → เอ็มเบดดิง Ollama (ภายในเครื่อง/โฮสต์เอง; โดยทั่วไปไม่มีการคิดค่าบริการ API แบบโฮสต์)
- ตัวเลือกย้อนกลับไปยังผู้ให้บริการระยะไกลหากเอ็มเบดดิงภายในเครื่องล้มเหลว

คุณสามารถเก็บไว้ภายในเครื่องด้วย `memorySearch.provider = "local"` (ไม่มีการใช้งาน API)

ดู [หน่วยความจำ](/th/concepts/memory)

### 5) เครื่องมือค้นเว็บ

`web_search` อาจมีค่าใช้จ่ายการใช้งาน ขึ้นอยู่กับผู้ให้บริการของคุณ:

- **Brave Search API**: `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` หรือ `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: ไม่ต้องใช้คีย์สำหรับโฮสต์ Ollama ภายในเครื่องที่เข้าถึงได้และลงชื่อเข้าใช้อยู่; การค้นหา `https://ollama.com` โดยตรงใช้ `OLLAMA_API_KEY` และโฮสต์ที่ป้องกันด้วยการยืนยันตัวตนสามารถใช้ bearer auth ปกติของผู้ให้บริการ Ollama ซ้ำได้
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: ทางเลือกสำรองที่ไม่ต้องใช้คีย์ (ไม่มีการคิดค่าบริการ API แต่ไม่เป็นทางการและอิง HTML)
- **SearXNG**: `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ไม่ต้องใช้คีย์/โฮสต์เอง; ไม่มีการคิดค่าบริการ API แบบโฮสต์)

เส้นทางผู้ให้บริการ `tools.web.search.*` แบบเดิมยังคงโหลดผ่านชิมความเข้ากันได้ชั่วคราว แต่ไม่ใช่พื้นผิว config ที่แนะนำอีกต่อไป

**เครดิตฟรีของ Brave Search:** แต่ละแผนของ Brave รวมเครดิตฟรีที่ต่ออายุ
\$5/เดือน แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตจะครอบคลุม
1,000 คำขอ/เดือนโดยไม่มีค่าใช้จ่าย ตั้งขีดจำกัดการใช้งานของคุณในแดชบอร์ด Brave
เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด

ดู [เครื่องมือเว็บ](/th/tools/web)

### 5) เครื่องมือดึงเว็บ (Firecrawl)

`web_fetch` สามารถเรียก **Firecrawl** เมื่อมีคีย์ API:

- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webFetch.apiKey`

หากไม่ได้กำหนดค่า Firecrawl เครื่องมือจะย้อนกลับไปใช้การดึงโดยตรงร่วมกับ Plugin `web-readability` ที่บันเดิลมา (ไม่มี API แบบมีค่าใช้จ่าย) ปิดใช้ `plugins.entries.web-readability.enabled` เพื่อข้ามการดึงข้อมูล Readability ภายในเครื่อง

ดู [เครื่องมือเว็บ](/th/tools/web)

### 6) สแนปช็อตการใช้งานผู้ให้บริการ (สถานะ/สุขภาพ)

คำสั่งสถานะบางคำสั่งเรียก **ปลายทางการใช้งานของผู้ให้บริการ** เพื่อแสดงหน้าต่างโควตาหรือสุขภาพการยืนยันตัวตน
โดยทั่วไปเป็นการเรียกปริมาณต่ำ แต่ยังคงเข้าถึง API ของผู้ให้บริการ:

- `openclaw status --usage`
- `openclaw models status --json`

ดู [CLI โมเดล](/th/cli/models)

### 7) การสรุปของมาตรการป้องกัน Compaction

มาตรการป้องกัน Compaction สามารถสรุปประวัติเซสชันโดยใช้ **โมเดลปัจจุบัน** ซึ่ง
เรียก API ของผู้ให้บริการเมื่อทำงาน

ดู [การจัดการเซสชัน + Compaction](/th/reference/session-management-compaction)

### 8) การสแกน / โพรบโมเดล

`openclaw models scan` สามารถโพรบโมเดล OpenRouter และใช้ `OPENROUTER_API_KEY` เมื่อ
เปิดใช้การโพรบ

ดู [CLI โมเดล](/th/cli/models)

### 9) การพูดคุย (เสียงพูด)

โหมดพูดคุยสามารถเรียก **ElevenLabs** เมื่อกำหนดค่าไว้:

- `ELEVENLABS_API_KEY` หรือ `talk.providers.elevenlabs.apiKey`

ดู [โหมดพูดคุย](/th/nodes/talk)

### 10) Skills (API บุคคลที่สาม)

Skills สามารถจัดเก็บ `apiKey` ใน `skills.entries.<name>.apiKey` ได้ หากสกิลใช้คีย์นั้นสำหรับ
API ภายนอก อาจเกิดค่าใช้จ่ายตามผู้ให้บริการของสกิล

ดู [Skills](/th/tools/skills)

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การแคชพรอมต์](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
