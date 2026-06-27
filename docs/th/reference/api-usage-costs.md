---
read_when:
    - คุณต้องการทำความเข้าใจว่าฟีเจอร์ใดบ้างอาจเรียกใช้ API แบบเสียค่าใช้จ่าย
    - คุณต้องตรวจสอบคีย์ ค่าใช้จ่าย และการมองเห็นข้อมูลการใช้งาน
    - คุณกำลังอธิบายการรายงานค่าใช้จ่ายของ /status หรือ /usage
summary: ตรวจสอบสิ่งที่สามารถใช้เงินได้ คีย์ใดที่ถูกใช้ และวิธีดูการใช้งาน
title: การใช้งาน API และค่าใช้จ่าย
x-i18n:
    generated_at: "2026-06-27T18:19:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

เอกสารนี้ระบุ **ฟีเจอร์ที่สามารถเรียกใช้ API keys** และตำแหน่งที่ต้นทุนของฟีเจอร์เหล่านั้นแสดงขึ้น โดยมุ่งเน้น
ฟีเจอร์ของ OpenClaw ที่สามารถสร้างการใช้งาน provider หรือการเรียก API แบบมีค่าใช้จ่ายได้

## ต้นทุนแสดงที่ใด (แชต + CLI)

**ภาพรวมต้นทุนต่อเซสชัน**

- `/status` แสดงโมเดลของเซสชันปัจจุบัน การใช้บริบท และโทเค็นของคำตอบล่าสุด
- หาก OpenClaw มีเมทาดาทาการใช้งานและราคาภายในเครื่องสำหรับโมเดลที่ใช้งานอยู่
  `/status` จะแสดง **ต้นทุนโดยประมาณ** สำหรับคำตอบล่าสุดด้วย ซึ่งอาจรวมถึง
  provider ที่ไม่ใช้ API key แต่มีราคากำหนดไว้อย่างชัดเจน เช่น โมเดล Bedrock `aws-sdk`
- หากเมทาดาทาเซสชันสดมีข้อมูลน้อย `/status` สามารถกู้คืนตัวนับโทเค็น/แคช
  และป้ายชื่อโมเดล runtime ที่ใช้งานอยู่จากรายการการใช้งานใน transcript ล่าสุดได้
  ค่าสดเดิมที่ไม่ใช่ศูนย์ยังคงมีลำดับความสำคัญก่อน และยอดรวม transcript ขนาดเท่าพรอมป์
  อาจชนะเมื่อยอดรวมที่จัดเก็บหายไปหรือมีค่าน้อยกว่า

**ส่วนท้ายต้นทุนต่อข้อความ**

- `/usage full` เพิ่มส่วนท้ายการใช้งานลงในทุกคำตอบ รวมถึง **ต้นทุนโดยประมาณ**
  เมื่อมีการกำหนดราคาภายในเครื่องสำหรับโมเดลที่ใช้งานอยู่และมีเมทาดาทาการใช้งาน
- `/usage tokens` แสดงเฉพาะโทเค็นเท่านั้น โฟลว์ OAuth/token และ CLI แบบ subscription
  ยังคงแสดงเฉพาะโทเค็น เว้นแต่ runtime นั้นจะให้เมทาดาทาการใช้งานที่เข้ากันได้
  และมีการกำหนดราคาภายในเครื่องไว้อย่างชัดเจน
- หมายเหตุ Gemini CLI: เอาต์พุตเริ่มต้น `stream-json` และการ override JSON รุ่นเก่า
  ต่างอ่านการใช้งานจาก `stats`, normalize `stats.cached` เป็น `cacheRead`, และ
  คำนวณโทเค็นอินพุตจาก `stats.input_tokens - stats.cached` เมื่อจำเป็น

หมายเหตุ Anthropic: พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p`
ได้รับอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
Anthropic ยังไม่เปิดเผยค่าประมาณเป็นดอลลาร์ต่อข้อความที่ OpenClaw สามารถ
แสดงใน `/usage full` ได้

**หน้าต่างการใช้งาน CLI (โควตา provider)**

- `openclaw status --usage` และ `openclaw channels list` แสดง **หน้าต่างการใช้งาน**
  ของ provider (ภาพรวมโควตา ไม่ใช่ต้นทุนต่อข้อความ)
- เอาต์พุตสำหรับมนุษย์ถูก normalize เป็น `เหลือ X%` เหมือนกันทุก provider
- provider ของหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai
- หมายเหตุ MiniMax: ฟิลด์ดิบ `usage_percent` / `usagePercent` หมายถึงโควตาที่เหลือ
  ดังนั้น OpenClaw จะกลับค่าเหล่านั้นก่อนแสดงผล ฟิลด์แบบนับจำนวนยังคงชนะ
  เมื่อมีอยู่ หาก provider ส่งคืน `model_remains` OpenClaw จะเลือกเอนทรีโมเดลแชต
  คำนวณป้ายชื่อหน้าต่างจาก timestamp เมื่อจำเป็น และรวมชื่อโมเดลไว้ในป้ายชื่อแผน
- การยืนยันตัวตนการใช้งานสำหรับหน้าต่างโควตาเหล่านั้นมาจาก hook เฉพาะ provider เมื่อมี
  ไม่เช่นนั้น OpenClaw จะ fallback ไปจับคู่ข้อมูลรับรอง OAuth/API-key
  จาก auth profiles, env หรือ config

ดูรายละเอียดและตัวอย่างที่ [การใช้โทเค็นและต้นทุน](/th/reference/token-use)

## วิธีค้นพบ key

OpenClaw สามารถรับข้อมูลรับรองจาก:

- **Auth profiles** (ต่อ agent, จัดเก็บใน `auth-profiles.json`)
- **ตัวแปรสภาพแวดล้อม** (เช่น `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`)
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`)
- **Skills** (`skills.entries.<name>.apiKey`) ซึ่งอาจ export key ไปยัง env ของโปรเซส skill

## ฟีเจอร์ที่สามารถใช้ key จนเกิดค่าใช้จ่าย

### 1) คำตอบจากโมเดลหลัก (แชต + เครื่องมือ)

ทุกคำตอบหรือการเรียกเครื่องมือใช้ **provider โมเดลปัจจุบัน** (OpenAI, Anthropic ฯลฯ) นี่คือ
แหล่งหลักของการใช้งานและต้นทุน

ซึ่งยังรวมถึง provider แบบ hosted subscription ที่ยังคงเรียกเก็บเงินนอก
UI ภายในเครื่องของ OpenClaw เช่น **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** และ
เส้นทางเข้าสู่ระบบ OpenClaw Claude ของ Anthropic เมื่อเปิดใช้ **Extra Usage**

ดูการกำหนดราคาที่ [โมเดล](/th/providers/models) และการแสดงผลที่ [การใช้โทเค็นและต้นทุน](/th/reference/token-use)

### 2) การทำความเข้าใจสื่อ (เสียง/รูปภาพ/วิดีโอ)

สื่อขาเข้าสามารถถูกสรุป/ถอดเสียงก่อนที่คำตอบจะทำงาน ซึ่งใช้ API ของโมเดล/provider

- เสียง: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral
- รูปภาพ: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI
- วิดีโอ: Google / Qwen / Moonshot

ดู [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)

### 3) การสร้างรูปภาพและวิดีโอ

ความสามารถในการสร้างแบบ shared สามารถใช้ key ของ provider จนเกิดค่าใช้จ่ายได้เช่นกัน:

- การสร้างรูปภาพ: OpenAI / Google / DeepInfra / fal / MiniMax
- การสร้างวิดีโอ: DeepInfra / Qwen

การสร้างรูปภาพสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth หนุนหลังได้เมื่อ
ไม่ได้ตั้งค่า `agents.defaults.imageGenerationModel` การสร้างวิดีโอในปัจจุบัน
ต้องระบุ `agents.defaults.videoGenerationModel` อย่างชัดเจน เช่น
`qwen/wan2.6-t2v`

ดู [การสร้างรูปภาพ](/th/tools/image-generation), [Qwen Cloud](/th/providers/qwen),
และ [โมเดล](/th/concepts/models)

### 4) Memory embeddings + การค้นหาเชิงความหมาย

การค้นหา memory เชิงความหมายใช้ **embedding APIs** เมื่อกำหนดค่าสำหรับ provider ระยะไกล:

- `memorySearch.provider = "openai"` → embeddings ของ OpenAI
- `memorySearch.provider = "gemini"` → embeddings ของ Gemini
- `memorySearch.provider = "voyage"` → embeddings ของ Voyage
- `memorySearch.provider = "mistral"` → embeddings ของ Mistral
- `memorySearch.provider = "deepinfra"` → embeddings ของ DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddings ของ LM Studio (ภายในเครื่อง/self-hosted)
- `memorySearch.provider = "ollama"` → embeddings ของ Ollama (ภายในเครื่อง/self-hosted; โดยทั่วไปไม่มีการเรียกเก็บ API แบบ hosted)
- fallback เสริมไปยัง provider ระยะไกลหาก embeddings ภายในเครื่องล้มเหลว

คุณสามารถให้ทำงานภายในเครื่องได้ด้วย `memorySearch.provider = "local"` (ไม่มีการใช้ API)

ดู [Memory](/th/concepts/memory)

### 5) เครื่องมือค้นหาเว็บ

`web_search` อาจมีค่าใช้จ่ายการใช้งาน ขึ้นอยู่กับ provider ของคุณ:

- **Brave Search API**: `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` หรือ `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: โปรไฟล์ OAuth ของ xAI, `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: ไม่ต้องใช้ key สำหรับโฮสต์ Ollama ภายในเครื่องที่ลงชื่อเข้าใช้และเข้าถึงได้ การค้นหา `https://ollama.com` โดยตรงใช้ `OLLAMA_API_KEY` และโฮสต์ที่ป้องกันด้วย auth สามารถนำ bearer auth ของ provider Ollama ปกติมาใช้ซ้ำได้
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: provider ที่ไม่ต้องใช้ key เมื่อเลือกอย่างชัดเจน (ไม่มีการเรียกเก็บ API แต่ไม่เป็นทางการและอิง HTML)
- **SearXNG**: `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ไม่ต้องใช้ key/self-hosted; ไม่มีการเรียกเก็บ API แบบ hosted)

เส้นทาง provider รุ่นเก่า `tools.web.search.*` ยังคงโหลดผ่าน compatibility shim ชั่วคราว
แต่ไม่ใช่พื้นผิว config ที่แนะนำอีกต่อไป

**เครดิตฟรีของ Brave Search:** แต่ละแผน Brave มีเครดิตฟรีแบบต่ออายุ \$5/เดือน
แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 requests ดังนั้นเครดิตฟรีจะครอบคลุม
1,000 requests/เดือนโดยไม่มีค่าใช้จ่าย ตั้งค่าขีดจำกัดการใช้งานในแดชบอร์ด Brave
เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด

ดู [เครื่องมือเว็บ](/th/tools/web)

### 5) เครื่องมือดึงข้อมูลเว็บ (Firecrawl)

`web_fetch` สามารถเรียก **Firecrawl** ด้วยสิทธิ์เริ่มต้นแบบไม่ใช้ key ได้ เพิ่ม API key
เพื่อให้ได้ขีดจำกัดที่สูงขึ้น:

- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webFetch.apiKey`

หากไม่ได้กำหนดค่า Firecrawl เครื่องมือจะ fallback ไปยังการดึงข้อมูลโดยตรงพร้อม Plugin `web-readability` ที่ bundled มา (ไม่มี API แบบเสียเงิน) ปิดใช้งาน `plugins.entries.web-readability.enabled` เพื่อข้ามการแยก Readability ภายในเครื่อง

ดู [เครื่องมือเว็บ](/th/tools/web)

### 6) ภาพรวมการใช้งาน provider (สถานะ/สุขภาพ)

คำสั่งสถานะบางคำสั่งเรียก **endpoint การใช้งานของ provider** เพื่อแสดงหน้าต่างโควตาหรือสุขภาพของ auth
โดยทั่วไปเป็นการเรียกปริมาณต่ำ แต่ยังคงกระทบ API ของ provider:

- `openclaw status --usage`
- `openclaw models status --json`

ดู [Models CLI](/th/cli/models)

### 7) การสรุปเพื่อป้องกัน Compaction

การป้องกัน Compaction สามารถสรุปประวัติเซสชันโดยใช้ **โมเดลปัจจุบัน** ซึ่ง
เรียก API ของ provider เมื่อทำงาน

ดู [การจัดการเซสชัน + Compaction](/th/reference/session-management-compaction)

### 8) การสแกน / probe โมเดล

`openclaw models scan` สามารถ probe โมเดล OpenRouter และใช้ `OPENROUTER_API_KEY` เมื่อ
เปิดใช้งานการ probe

ดู [Models CLI](/th/cli/models)

### 9) Talk (เสียงพูด)

โหมด Talk สามารถเรียก **ElevenLabs** เมื่อกำหนดค่าไว้:

- `ELEVENLABS_API_KEY` หรือ `talk.providers.elevenlabs.apiKey`

ดู [โหมด Talk](/th/nodes/talk)

### 10) Skills (API ของบุคคลที่สาม)

Skills สามารถจัดเก็บ `apiKey` ใน `skills.entries.<name>.apiKey` หาก skill ใช้ key นั้นกับ
API ภายนอก อาจเกิดค่าใช้จ่ายตาม provider ของ skill นั้น

ดู [Skills](/th/tools/skills)

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและต้นทุน](/th/reference/token-use)
- [การแคชพรอมป์](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
