---
read_when:
    - คุณต้องการทำความเข้าใจว่าฟีเจอร์ใดอาจเรียกใช้ API แบบมีค่าใช้จ่าย
    - คุณต้องตรวจสอบคีย์ ค่าใช้จ่าย และการมองเห็นการใช้งาน
    - คุณกำลังอธิบายการรายงานค่าใช้จ่ายสำหรับ /status หรือ /usage
summary: ตรวจสอบสิ่งที่สามารถก่อให้เกิดค่าใช้จ่าย คีย์ที่ใช้ และวิธีดูปริมาณการใช้งาน
title: การใช้งาน API และค่าใช้จ่าย
x-i18n:
    generated_at: "2026-04-30T10:14:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# การใช้งาน API และค่าใช้จ่าย

เอกสารนี้แสดงรายการ **ฟีเจอร์ที่สามารถเรียกใช้คีย์ API** และตำแหน่งที่ค่าใช้จ่ายของฟีเจอร์เหล่านั้นปรากฏ โดยเน้นฟีเจอร์ของ
OpenClaw ที่สามารถสร้างการใช้งานผู้ให้บริการหรือการเรียก API แบบมีค่าใช้จ่ายได้

## ตำแหน่งที่ค่าใช้จ่ายปรากฏ (แชท + CLI)

**ภาพรวมค่าใช้จ่ายต่อเซสชัน**

- `/status` แสดงโมเดลของเซสชันปัจจุบัน การใช้งานคอนเท็กซ์ และโทเค็นของคำตอบล่าสุด
- หากโมเดลใช้ **การยืนยันตัวตนด้วยคีย์ API** `/status` จะแสดง **ค่าใช้จ่ายโดยประมาณ** สำหรับคำตอบล่าสุดด้วย
- หากเมตาดาต้าเซสชันแบบสดมีข้อมูลน้อย `/status` สามารถกู้คืนตัวนับโทเค็น/แคช
  และป้ายชื่อโมเดลรันไทม์ที่ใช้งานอยู่จากรายการการใช้งานในทรานสคริปต์ล่าสุดได้
  ค่าจริงแบบสดที่ไม่เป็นศูนย์ซึ่งมีอยู่แล้วจะยังคงมีลำดับความสำคัญสูงกว่า และยอดรวมทรานสคริปต์
  ขนาดพรอมป์สามารถชนะได้เมื่อยอดรวมที่จัดเก็บหายไปหรือน้อยกว่า

**ส่วนท้ายค่าใช้จ่ายต่อข้อความ**

- `/usage full` เพิ่มส่วนท้ายการใช้งานให้ทุกคำตอบ รวมถึง **ค่าใช้จ่ายโดยประมาณ** (เฉพาะคีย์ API)
- `/usage tokens` แสดงเฉพาะโทเค็น ส่วนโฟลว์ OAuth/โทเค็นแบบสมัครสมาชิกและ CLI จะซ่อนค่าใช้จ่ายเป็นเงิน
- หมายเหตุ Gemini CLI: เมื่อ CLI ส่งคืนเอาต์พุต JSON, OpenClaw จะอ่านการใช้งานจาก
  `stats`, ปรับ `stats.cached` ให้เป็น `cacheRead`, และคำนวณโทเค็นอินพุต
  จาก `stats.input_tokens - stats.cached` เมื่อจำเป็น

หมายเหตุ Anthropic: เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw
ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p`
ได้รับการอนุมัติสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
Anthropic ยังไม่เปิดเผยค่าประมาณเป็นเงินต่อข้อความที่ OpenClaw สามารถ
แสดงใน `/usage full` ได้

**หน้าต่างการใช้งาน CLI (โควตาผู้ให้บริการ)**

- `openclaw status --usage` และ `openclaw channels list` แสดง **หน้าต่างการใช้งาน** ของผู้ให้บริการ
  (ภาพรวมโควตา ไม่ใช่ค่าใช้จ่ายต่อข้อความ)
- เอาต์พุตสำหรับมนุษย์ถูกปรับให้เป็น `X% left` เหมือนกันทุกผู้ให้บริการ
- ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi และ z.ai
- หมายเหตุ MiniMax: ฟิลด์ดิบ `usage_percent` / `usagePercent` หมายถึงโควตาที่เหลือ
  ดังนั้น OpenClaw จะกลับค่าก่อนแสดง ฟิลด์แบบนับจำนวนยังคงชนะ
  เมื่อมีอยู่ หากผู้ให้บริการส่งคืน `model_remains`, OpenClaw จะเลือก
  รายการโมเดลแชท คำนวณป้ายชื่อหน้าต่างจากไทม์สแตมป์เมื่อจำเป็น และ
  รวมชื่อโมเดลไว้ในป้ายชื่อแผน
- การยืนยันตัวตนสำหรับหน้าต่างโควตาเหล่านั้นมาจากฮุกเฉพาะผู้ให้บริการเมื่อ
  มีให้ใช้ มิฉะนั้น OpenClaw จะถอยกลับไปจับคู่ข้อมูลรับรอง OAuth/คีย์ API
  จากโปรไฟล์การยืนยันตัวตน, env หรือคอนฟิก

ดูรายละเอียดและตัวอย่างที่ [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)

## วิธีค้นพบคีย์

OpenClaw สามารถรับข้อมูลรับรองได้จาก:

- **โปรไฟล์การยืนยันตัวตน** (ต่อเอเจนต์ จัดเก็บใน `auth-profiles.json`)
- **ตัวแปรสภาพแวดล้อม** (เช่น `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`)
- **คอนฟิก** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`)
- **Skills** (`skills.entries.<name>.apiKey`) ซึ่งอาจส่งออกคีย์ไปยัง env ของโปรเซส Skills

## ฟีเจอร์ที่สามารถใช้คีย์แบบมีค่าใช้จ่าย

### 1) คำตอบจากโมเดลหลัก (แชท + เครื่องมือ)

ทุกคำตอบหรือการเรียกเครื่องมือใช้ **ผู้ให้บริการโมเดลปัจจุบัน** (OpenAI, Anthropic เป็นต้น) นี่คือ
แหล่งที่มาหลักของการใช้งานและค่าใช้จ่าย

ส่วนนี้ยังรวมถึงผู้ให้บริการโฮสต์แบบสมัครสมาชิกที่ยังคงเรียกเก็บเงินภายนอก
UI ภายในของ OpenClaw เช่น **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** และ
เส้นทางเข้าสู่ระบบ Claude ของ OpenClaw ผ่าน Anthropic เมื่อเปิดใช้ **Extra Usage**

ดูคอนฟิกราคาที่ [โมเดล](/th/providers/models) และการแสดงผลที่ [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)

### 2) การทำความเข้าใจสื่อ (เสียง/รูปภาพ/วิดีโอ)

สื่อขาเข้าสามารถถูกสรุป/ถอดเสียงก่อนที่คำตอบจะทำงาน ขั้นตอนนี้ใช้ API ของโมเดล/ผู้ให้บริการ

- เสียง: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral
- รูปภาพ: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI
- วิดีโอ: Google / Qwen / Moonshot

ดู [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)

### 3) การสร้างรูปภาพและวิดีโอ

ความสามารถการสร้างแบบใช้ร่วมกันสามารถใช้คีย์ผู้ให้บริการแบบมีค่าใช้จ่ายได้เช่นกัน:

- การสร้างรูปภาพ: OpenAI / Google / DeepInfra / fal / MiniMax
- การสร้างวิดีโอ: DeepInfra / Qwen

การสร้างรูปภาพสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้เมื่อ
ไม่ได้ตั้งค่า `agents.defaults.imageGenerationModel` การสร้างวิดีโอในปัจจุบัน
ต้องมี `agents.defaults.videoGenerationModel` แบบระบุชัดเจน เช่น
`qwen/wan2.6-t2v`

ดู [การสร้างรูปภาพ](/th/tools/image-generation), [Qwen Cloud](/th/providers/qwen),
และ [โมเดล](/th/concepts/models)

### 4) เอ็มเบดดิงหน่วยความจำ + การค้นหาเชิงความหมาย

การค้นหาหน่วยความจำเชิงความหมายใช้ **API เอ็มเบดดิง** เมื่อคอนฟิกสำหรับผู้ให้บริการระยะไกล:

- `memorySearch.provider = "openai"` → เอ็มเบดดิง OpenAI
- `memorySearch.provider = "gemini"` → เอ็มเบดดิง Gemini
- `memorySearch.provider = "voyage"` → เอ็มเบดดิง Voyage
- `memorySearch.provider = "mistral"` → เอ็มเบดดิง Mistral
- `memorySearch.provider = "deepinfra"` → เอ็มเบดดิง DeepInfra
- `memorySearch.provider = "lmstudio"` → เอ็มเบดดิง LM Studio (ภายในเครื่อง/โฮสต์เอง)
- `memorySearch.provider = "ollama"` → เอ็มเบดดิง Ollama (ภายในเครื่อง/โฮสต์เอง โดยทั่วไปไม่มีการเรียกเก็บเงิน API แบบโฮสต์)
- ตัวเลือกถอยกลับไปยังผู้ให้บริการระยะไกลหากเอ็มเบดดิงภายในเครื่องล้มเหลว

คุณสามารถคงไว้ภายในเครื่องด้วย `memorySearch.provider = "local"` (ไม่มีการใช้งาน API)

ดู [หน่วยความจำ](/th/concepts/memory)

### 5) เครื่องมือค้นหาเว็บ

`web_search` อาจเกิดค่าการใช้งาน ขึ้นอยู่กับผู้ให้บริการของคุณ:

- **Brave Search API**: `BRAVE_API_KEY` หรือ `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` หรือ `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` หรือ `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` หรือ `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` หรือ `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: ไม่ต้องใช้คีย์สำหรับโฮสต์ Ollama ภายในเครื่องที่เข้าถึงได้และลงชื่อเข้าใช้แล้ว การค้นหาโดยตรงผ่าน `https://ollama.com` ใช้ `OLLAMA_API_KEY` และโฮสต์ที่ป้องกันด้วยการยืนยันตัวตนสามารถใช้ bearer auth ปกติของผู้ให้บริการ Ollama ซ้ำได้
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` หรือ `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` หรือ `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: ตัวเลือกถอยกลับที่ไม่ต้องใช้คีย์ (ไม่มีการเรียกเก็บเงิน API แต่ไม่เป็นทางการและอิง HTML)
- **SearXNG**: `SEARXNG_BASE_URL` หรือ `plugins.entries.searxng.config.webSearch.baseUrl` (ไม่ต้องใช้คีย์/โฮสต์เอง ไม่มีการเรียกเก็บเงิน API แบบโฮสต์)

เส้นทางผู้ให้บริการ `tools.web.search.*` แบบเดิมยังโหลดผ่านชิมความเข้ากันได้ชั่วคราว แต่ไม่ใช่พื้นผิวคอนฟิกที่แนะนำอีกต่อไป

**เครดิตฟรีของ Brave Search:** แผน Brave แต่ละแผนมีเครดิตฟรีที่ต่ออายุ
\$5/เดือน แผน Search มีค่าใช้จ่าย \$5 ต่อ 1,000 คำขอ ดังนั้นเครดิตนี้ครอบคลุม
1,000 คำขอ/เดือนโดยไม่เสียค่าใช้จ่าย ตั้งค่าขีดจำกัดการใช้งานของคุณในแดชบอร์ด Brave
เพื่อหลีกเลี่ยงค่าใช้จ่ายที่ไม่คาดคิด

ดู [เครื่องมือเว็บ](/th/tools/web)

### 5) เครื่องมือดึงข้อมูลเว็บ (Firecrawl)

`web_fetch` สามารถเรียก **Firecrawl** เมื่อมีคีย์ API:

- `FIRECRAWL_API_KEY` หรือ `plugins.entries.firecrawl.config.webFetch.apiKey`

หากไม่ได้คอนฟิก Firecrawl เครื่องมือจะถอยกลับไปใช้การดึงข้อมูลโดยตรงร่วมกับ Plugin `web-readability` ที่มาพร้อมกัน (ไม่มี API แบบมีค่าใช้จ่าย) ปิดใช้ `plugins.entries.web-readability.enabled` เพื่อข้ามการแยกข้อมูล Readability ภายในเครื่อง

ดู [เครื่องมือเว็บ](/th/tools/web)

### 6) ภาพรวมการใช้งานผู้ให้บริการ (สถานะ/สุขภาพ)

คำสั่งสถานะบางคำสั่งเรียก **ปลายทางการใช้งานของผู้ให้บริการ** เพื่อแสดงหน้าต่างโควตาหรือสุขภาพการยืนยันตัวตน
โดยทั่วไปเป็นการเรียกปริมาณต่ำ แต่ยังคงเรียก API ของผู้ให้บริการ:

- `openclaw status --usage`
- `openclaw models status --json`

ดู [CLI โมเดล](/th/cli/models)

### 7) การสรุปป้องกันของ Compaction

ตัวป้องกัน Compaction สามารถสรุปประวัติเซสชันโดยใช้ **โมเดลปัจจุบัน** ซึ่ง
จะเรียก API ของผู้ให้บริการเมื่อทำงาน

ดู [การจัดการเซสชัน + Compaction](/th/reference/session-management-compaction)

### 8) การสแกน / โพรบโมเดล

`openclaw models scan` สามารถโพรบโมเดล OpenRouter และใช้ `OPENROUTER_API_KEY` เมื่อ
เปิดใช้การโพรบ

ดู [CLI โมเดล](/th/cli/models)

### 9) การพูดคุย (เสียงพูด)

โหมดพูดคุยสามารถเรียก **ElevenLabs** เมื่อคอนฟิกไว้:

- `ELEVENLABS_API_KEY` หรือ `talk.providers.elevenlabs.apiKey`

ดู [โหมดพูดคุย](/th/nodes/talk)

### 10) Skills (API ของบุคคลที่สาม)

Skills สามารถจัดเก็บ `apiKey` ใน `skills.entries.<name>.apiKey` หาก Skills ใช้คีย์นั้นสำหรับ API ภายนอก
อาจเกิดค่าใช้จ่ายตามผู้ให้บริการของ Skills นั้น

ดู [Skills](/th/tools/skills)

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การแคชพรอมป์](/th/reference/prompt-caching)
- [การติดตามการใช้งาน](/th/concepts/usage-tracking)
