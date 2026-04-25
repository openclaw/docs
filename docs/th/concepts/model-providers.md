---
read_when:
    - คุณต้องการเอกสารอ้างอิงการตั้งค่า model แยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่าง config หรือคำสั่งเริ่มต้นใช้งานผ่าน CLI สำหรับผู้ให้บริการ model
summary: ภาพรวมของผู้ให้บริการ model พร้อมตัวอย่าง config + โฟลว์ CLI
title: ผู้ให้บริการ model
x-i18n:
    generated_at: "2026-04-25T13:45:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

เอกสารอ้างอิงสำหรับ **ผู้ให้บริการ LLM/model** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือก model ดู [Models](/th/concepts/models)

## กฎแบบรวดเร็ว

- model ref ใช้รูปแบบ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
- `agents.defaults.models` จะทำหน้าที่เป็น allowlist เมื่อมีการตั้งค่าไว้
- ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
- `models.providers.*.models[].contextWindow` คือข้อมูลเมตา native ของ model; `contextTokens` คือค่าขีดจำกัดรันไทม์ที่มีผลจริง
- กฎ fallback, cooldown probes และการคงอยู่ของ session-override: [Model failover](/th/concepts/model-failover)
- เส้นทางตระกูล OpenAI แยกตาม prefix: `openai/<model>` ใช้ provider แบบ API key ของ OpenAI โดยตรงใน PI, `openai-codex/<model>` ใช้ Codex OAuth ใน PI, และ `openai/<model>` ร่วมกับ `agents.defaults.embeddedHarness.runtime: "codex"` จะใช้ native Codex app-server harness ดู [OpenAI](/th/providers/openai)
  และ [Codex harness](/th/plugins/codex-harness) หากการแยกระหว่าง provider/runtime
  ทำให้สับสน ให้อ่าน [Agent runtimes](/th/concepts/agent-runtimes) ก่อน
- การเปิดใช้ Plugin อัตโนมัติก็เป็นไปตามขอบเขตเดียวกัน: `openai-codex/<model>` อยู่ใน OpenAI Plugin ส่วน Codex Plugin จะถูกเปิดใช้โดย
  `embeddedHarness.runtime: "codex"` หรือ `codex/<model>` refs แบบเดิม
- รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือก canonical model refs เช่น
  `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` จากนั้นตั้งค่า
  `agents.defaults.embeddedHarness.runtime` เป็น `claude-cli`,
  `google-gemini-cli` หรือ `codex-cli` เมื่อคุณต้องการ backend แบบ CLI ในเครื่อง
  `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` refs แบบเดิมจะถูกย้าย
  กลับไปเป็น canonical provider refs โดยบันทึกรันไทม์ไว้แยกต่างหาก
- GPT-5.5 ใช้งานได้ผ่าน `openai-codex/gpt-5.5` ใน PI, native
  Codex app-server harness และ OpenAI API สาธารณะเมื่อ PI
  catalog ที่รวมมาเปิดเผย `openai/gpt-5.5` สำหรับการติดตั้งของคุณ

## พฤติกรรมของผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะของผู้ให้บริการส่วนใหญ่อยู่ใน provider plugins (`registerProvider(...)`) ขณะที่ OpenClaw ดูแลลูป inference แบบทั่วไป Plugins เป็นเจ้าของ onboarding, model catalogs, การแมป auth env-var, การทำ normalization สำหรับ transport/config, การล้าง tool-schema, การจัดประเภท failover, การรีเฟรช OAuth, การรายงานการใช้งาน, โปรไฟล์ thinking/reasoning และอื่น ๆ

รายการทั้งหมดของ provider-SDK hooks และตัวอย่าง bundled-plugin อยู่ใน [Provider plugins](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ request executor แบบกำหนดเองทั้งหมดจะเป็นพื้นผิวการขยายอีกแบบหนึ่งที่ลึกกว่า

<Note>
`capabilities` ของรันไทม์ผู้ให้บริการคือข้อมูลเมตาของ runner ที่ใช้ร่วมกัน (ตระกูลผู้ให้บริการ, ลักษณะพิเศษของ transcript/tooling, คำใบ้ด้าน transport/cache) มันไม่เหมือนกับ [public capability model](/th/plugins/architecture#public-capability-model) ซึ่งอธิบายว่า Plugin ลงทะเบียนอะไรไว้ (text inference, speech ฯลฯ)
</Note>

## การหมุนเวียน API key

- รองรับการหมุนเวียนผู้ให้บริการแบบทั่วไปสำหรับผู้ให้บริการที่เลือกไว้
- กำหนดค่าหลายคีย์ได้ผ่าน:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (live override เดี่ยว ลำดับความสำคัญสูงสุด)
  - `<PROVIDER>_API_KEYS` (รายการคั่นด้วย comma หรือ semicolon)
  - `<PROVIDER>_API_KEY` (คีย์หลัก)
  - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)
- สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย
- ลำดับการเลือกคีย์จะรักษาลำดับความสำคัญและลบค่าซ้ำ
- คำขอจะถูกลองใหม่ด้วยคีย์ถัดไปเฉพาะเมื่อได้รับการตอบกลับแบบ rate-limit เท่านั้น (เช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` หรือข้อความ periodic usage-limit)
- ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่มีการพยายามหมุนเวียนคีย์
- เมื่อคีย์ตัวเลือกทั้งหมดล้มเหลว จะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งสุดท้าย

## ผู้ให้บริการในตัว (pi-ai catalog)

OpenClaw มาพร้อมกับ pi‑ai catalog ผู้ให้บริการเหล่านี้ **ไม่ต้อง**
ใช้ config `models.providers`; เพียงตั้งค่า auth + เลือก model

### OpenAI

- ผู้ให้บริการ: `openai`
- Auth: `OPENAI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (override เดี่ยว)
- model ตัวอย่าง: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- การรองรับ GPT-5.5 ผ่าน direct API ขึ้นอยู่กับเวอร์ชันของ bundled PI catalog สำหรับ
  การติดตั้งของคุณ; ตรวจสอบด้วย `openclaw models list --provider openai` ก่อน
  ใช้ `openai/gpt-5.5` โดยไม่มีรันไทม์ Codex app-server
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport ค่าเริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- แทนที่ต่อ model ได้ผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- OpenAI Responses WebSocket warm-up เปิดใช้งานเป็นค่าเริ่มต้นผ่าน `params.openaiWsWarmup` (`true`/`false`)
- OpenAI priority processing สามารถเปิดใช้ได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะ map คำขอ Responses แบบ direct `openai/*` ไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อคุณต้องการ tier แบบระบุชัดเจนแทนการใช้สวิตช์ `/fast` ร่วมกัน
- hidden OpenClaw attribution headers (`originator`, `version`,
  `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบ native ไปยัง `api.openai.com` ไม่ใช้กับ
  generic OpenAI-compatible proxies
- เส้นทาง OpenAI แบบ native ยังคงเก็บ Responses `store`, prompt-cache hints และ
  การจัดรูป payload เพื่อความเข้ากันได้กับ OpenAI reasoning; เส้นทาง proxy จะไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` ถูกซ่อนไว้ใน OpenClaw โดยตั้งใจ เพราะคำขอ OpenAI API แบบ live ปฏิเสธมัน และ Codex catalog ปัจจุบันก็ไม่เปิดเผยโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (override เดี่ยว)
- model ตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะแบบ direct รองรับสวิตช์ `/fast` ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย API key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw จะ map ค่านี้ไปยัง Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- หมายเหตุสำหรับ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นแนวทางที่ได้รับอนุญาตสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic setup-token ยังใช้งานได้ในฐานะเส้นทางโทเค็นที่รองรับของ OpenClaw แต่ปัจจุบัน OpenClaw แนะนำการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI model ref: `openai-codex/gpt-5.5`
- native Codex app-server harness ref: `openai/gpt-5.5` พร้อม `agents.defaults.embeddedHarness.runtime: "codex"`
- เอกสาร native Codex app-server harness: [Codex harness](/th/plugins/codex-harness)
- model refs แบบเดิม: `codex/gpt-*`
- ขอบเขตของ Plugin: `openai-codex/*` จะโหลด OpenAI Plugin; native Codex
  app-server plugin จะถูกเลือกเฉพาะโดยรันไทม์ Codex harness หรือ
  `codex/*` refs แบบเดิม
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport ค่าเริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- แทนที่ต่อ PI model ได้ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อด้วยในคำขอ native Codex Responses (`chatgpt.com/backend-api`)
- hidden OpenClaw attribution headers (`originator`, `version`,
  `User-Agent`) จะถูกแนบเฉพาะกับทราฟฟิก Codex แบบ native ไปยัง
  `chatgpt.com/backend-api` ไม่ใช้กับ generic OpenAI-compatible proxies
- ใช้สวิตช์ `/fast` ร่วมกันและ config `params.fastMode` แบบเดียวกับ `openai/*` แบบ direct; OpenClaw จะ map เป็น `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้ค่าจาก Codex catalog แบบ native `contextWindow = 400000` และค่าเริ่มต้นรันไทม์ `contextTokens = 272000`; แทนที่ขีดจำกัดรันไทม์ได้ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth ได้รับการรองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw
- ใช้ `openai-codex/gpt-5.5` เมื่อคุณต้องการเส้นทาง Codex OAuth/subscription; ใช้ `openai/gpt-5.5` เมื่อการตั้งค่า API key และ local catalog ของคุณเปิดเผยเส้นทาง public API

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### ตัวเลือกแบบโฮสต์ลักษณะ subscription อื่น ๆ

- [Qwen Cloud](/th/providers/qwen): พื้นผิวผู้ให้บริการ Qwen Cloud พร้อมการแมปเอ็นด์พอยต์ Alibaba DashScope และ Coding Plan
- [MiniMax](/th/providers/minimax): การเข้าถึง MiniMax Coding Plan ผ่าน OAuth หรือ API key
- [GLM models](/th/providers/glm): เอ็นด์พอยต์ Z.AI Coding Plan หรือ general API

### OpenCode

- Auth: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการ Zen runtime: `opencode`
- ผู้ให้บริการ Go runtime: `opencode-go`
- model ตัวอย่าง: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ผู้ให้บริการ: `google`
- Auth: `GEMINI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` และ `OPENCLAW_LIVE_GEMINI_KEY` (override เดี่ยว)
- model ตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: config OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูก normalize เป็น `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` ใช้ Google dynamic thinking Gemini 3/3.1 จะไม่ส่ง
  `thinkingLevel` แบบคงที่; Gemini 2.5 จะส่ง `thinkingBudget: -1`
- การรัน Gemini แบบ direct ยังรับ `agents.defaults.models["google/<model>"].params.cachedContent`
  (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อ handle แบบ native ของ provider
  `cachedContents/...`; cache hits ของ Gemini จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- Auth: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของมันเอง
- ข้อควรระวัง: Gemini CLI OAuth ใน OpenClaw เป็นการเชื่อมต่อที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานว่าบัญชี Google ถูกจำกัดหลังใช้ไคลเอนต์ของบุคคลที่สาม ตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
- Gemini CLI OAuth มาพร้อมเป็นส่วนหนึ่งของ `google` Plugin ที่รวมมาให้
  - ติดตั้ง Gemini CLI ก่อน:
    - `brew install gemini-cli`
    - หรือ `npm install -g @google/gemini-cli`
  - เปิดใช้: `openclaw plugins enable google`
  - เข้าสู่ระบบ: `openclaw models auth login --provider google-gemini-cli --set-default`
  - model ค่าเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview`
  - หมายเหตุ: คุณ **ไม่** ต้องวาง client id หรือ secret ลงใน `openclaw.json` โฟลว์การเข้าสู่ระบบของ CLI จะเก็บ
    โทเค็นไว้ใน auth profiles บนโฮสต์ของ gateway
  - หากคำขอล้มเหลวหลังเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ของ gateway
  - คำตอบ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; การใช้งานจะ fallback ไปที่
    `stats` โดย `stats.cached` จะถูก normalize เป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- Auth: `ZAI_API_KEY`
- model ตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - aliases: `z.ai/*` และ `z-ai/*` จะถูก normalize เป็น `zai/*`
  - `zai-api-key` จะตรวจจับเอ็นด์พอยต์ Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` จะบังคับใช้พื้นผิวเฉพาะ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- model ตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ผู้ให้บริการ: `kilocode`
- Auth: `KILOCODE_API_KEY`
- model ตัวอย่าง: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- static fallback catalog มาพร้อม `kilocode/kilo/auto`; การค้นหาแบบสดจาก
  `https://api.kilo.ai/api/gateway/models` สามารถขยาย runtime
  catalog เพิ่มเติมได้
- การกำหนดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นสิ่งที่ Kilo Gateway เป็นเจ้าของ
  ไม่ได้ถูก hard-code ไว้ใน OpenClaw

ดูรายละเอียดการตั้งค่าได้ที่ [/providers/kilocode](/th/providers/kilocode)

### bundled provider plugins อื่น ๆ

| Provider                | Id                               | Auth env                                                     | model ตัวอย่าง                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                              |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                         |

ลักษณะเฉพาะที่ควรรู้:

- **OpenRouter** จะใช้ app-attribution headers และตัวทำเครื่องหมาย Anthropic `cache_control` เฉพาะบนเส้นทาง `openrouter.ai` ที่ได้รับการยืนยันเท่านั้น refs ของ DeepSeek, Moonshot และ ZAI มีสิทธิ์ใช้ cache TTL สำหรับ prompt caching ที่ OpenRouter จัดการ แต่จะไม่ได้รับตัวทำเครื่องหมายแคชของ Anthropic เนื่องจากเป็นเส้นทางแบบ proxy สไตล์ OpenAI-compatible มันจึงข้ามการจัดรูปแบบที่มีเฉพาะ native OpenAI (`serviceTier`, Responses `store`, prompt-cache hints, ความเข้ากันได้กับ OpenAI reasoning) refs ที่อิง Gemini จะคงไว้เฉพาะการทำความสะอาด thought-signature แบบ proxy-Gemini เท่านั้น
- **Kilo Gateway** refs ที่อิง Gemini จะใช้เส้นทางการทำความสะอาดแบบ proxy-Gemini เช่นเดียวกัน; `kilocode/kilo/auto` และ refs อื่น ๆ ที่ proxy ไม่รองรับ reasoning จะข้ามการ inject reasoning ของ proxy
- **MiniMax** การเริ่มต้นใช้งานด้วย API key จะเขียนคำจำกัดความ model แชต M2.7 แบบข้อความล้วนอย่างชัดเจน; ความเข้าใจภาพยังคงอยู่กับ media provider `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- **xAI** ใช้เส้นทาง xAI Responses `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นรุ่น `*-fast` โดย `tool_stream` เปิดอยู่เป็นค่าเริ่มต้น; ปิดได้ด้วย `agents.defaults.models["xai/<model>"].params.tool_stream=false`
- **Cerebras** models GLM ใช้ `zai-glm-4.7` / `zai-glm-4.6`; base URL แบบ OpenAI-compatible คือ `https://api.cerebras.ai/v1`

## ผู้ให้บริการผ่าน `models.providers` (กำหนดเอง/base URL)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการแบบ **กำหนดเอง** หรือ
proxy ที่เข้ากันได้กับ OpenAI/Anthropic

bundled provider plugins หลายตัวด้านล่างมี default catalog เผยแพร่อยู่แล้ว
ให้ใช้รายการ `models.providers.<id>` แบบชัดเจนก็ต่อเมื่อคุณต้องการแทนที่
default base URL, headers หรือรายการ model

### Moonshot AI (Kimi)

Moonshot มาพร้อมเป็น bundled provider plugin ใช้ผู้ให้บริการในตัวเป็น
ค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณ
ต้องการแทนที่ base URL หรือ metadata ของ model:

- ผู้ให้บริการ: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- model ตัวอย่าง: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding ใช้เอ็นด์พอยต์แบบ Anthropic-compatible ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- Auth: `KIMI_API_KEY`
- model ตัวอย่าง: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` แบบเดิมยังคงยอมรับได้ในฐานะ model id เพื่อความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และ models อื่น ๆ ในจีน

- ผู้ให้บริการ: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- model ตัวอย่าง: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

การเริ่มต้นใช้งานจะใช้พื้นผิวสำหรับ coding เป็นค่าเริ่มต้น แต่ catalog แบบทั่วไป `volcengine/*`
ก็จะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือก model ของ onboarding/configure นั้น ตัวเลือก auth ของ Volcengine จะให้ความสำคัญกับทั้ง
แถว `volcengine/*` และ `volcengine-plan/*` หากยังไม่ได้โหลด models เหล่านั้น
OpenClaw จะ fallback ไปใช้ catalog ที่ไม่ได้กรองแทนที่จะ
แสดงตัวเลือกเฉพาะ provider ที่ว่างเปล่า

models ที่ใช้งานได้:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

models สำหรับ coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (International)

BytePlus ARK ให้การเข้าถึง models ชุดเดียวกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

- ผู้ให้บริการ: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- model ตัวอย่าง: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

การเริ่มต้นใช้งานจะใช้พื้นผิวสำหรับ coding เป็นค่าเริ่มต้น แต่ catalog แบบทั่วไป `byteplus/*`
ก็จะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือก model ของ onboarding/configure นั้น ตัวเลือก auth ของ BytePlus จะให้ความสำคัญกับทั้ง
แถว `byteplus/*` และ `byteplus-plan/*` หากยังไม่ได้โหลด models เหล่านั้น
OpenClaw จะ fallback ไปใช้ catalog ที่ไม่ได้กรองแทนที่จะ
แสดงตัวเลือกเฉพาะ provider ที่ว่างเปล่า

models ที่ใช้งานได้:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

models สำหรับ coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic ให้บริการ models แบบ Anthropic-compatible ภายใต้ผู้ให้บริการ `synthetic`:

- ผู้ให้บริการ: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- model ตัวอย่าง: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้เอ็นด์พอยต์แบบกำหนดเอง:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ
  `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดูรายละเอียดการตั้งค่า ตัวเลือก model และตัวอย่าง config ได้ที่ [/providers/minimax](/th/providers/minimax)

บนเส้นทางการสตรีมแบบ Anthropic-compatible ของ MiniMax นั้น OpenClaw จะปิด thinking เป็น
ค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าไว้อย่างชัดเจน และ `/fast on` จะเขียน
`MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

การแยกความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังคงใช้ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- ความเข้าใจภาพใช้ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนทั้งสองเส้นทางการยืนยันตัวตนของ MiniMax
- การค้นหาเว็บยังคงใช้ provider id `minimax`

### LM Studio

LM Studio มาพร้อมเป็น bundled provider plugin ซึ่งใช้ API แบบ native:

- ผู้ให้บริการ: `lmstudio`
- Auth: `LM_API_TOKEN`
- base URL ค่าเริ่มต้นสำหรับ inference: `http://localhost:1234/v1`

จากนั้นตั้งค่า model (แทนที่ด้วยหนึ่งใน IDs ที่ส่งกลับจาก `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบ native ของ LM Studio สำหรับการค้นหา + การโหลดอัตโนมัติ และใช้ `/v1/chat/completions` สำหรับ inference เป็นค่าเริ่มต้น
ดูการตั้งค่าและการแก้ปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama มาพร้อมเป็น bundled provider plugin และใช้ API แบบ native ของ Ollama:

- ผู้ให้บริการ: `ollama`
- Auth: ไม่ต้องใช้ (เซิร์ฟเวอร์ในเครื่อง)
- model ตัวอย่าง: `ollama/llama3.3`
- การติดตั้ง: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama จะถูกตรวจพบในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ผ่าน
`OLLAMA_API_KEY` และ bundled provider plugin จะเพิ่ม Ollama เข้าไปใน
`openclaw onboard` และตัวเลือก model โดยตรง ดู [/providers/ollama](/th/providers/ollama)
สำหรับ onboarding, โหมด cloud/local และการกำหนดค่าแบบกำหนดเอง

### vLLM

vLLM มาพร้อมเป็น bundled provider plugin สำหรับเซิร์ฟเวอร์แบบ OpenAI-compatible
ในเครื่อง/โฮสต์เอง:

- ผู้ให้บริการ: `vllm`
- Auth: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL ค่าเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับ auth):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่า model (แทนที่ด้วยหนึ่งใน IDs ที่ส่งกลับจาก `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/vllm](/th/providers/vllm)

### SGLang

SGLang มาพร้อมเป็น bundled provider plugin สำหรับเซิร์ฟเวอร์แบบ OpenAI-compatible
ที่โฮสต์เองและทำงานได้รวดเร็ว:

- ผู้ให้บริการ: `sglang`
- Auth: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL ค่าเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่
บังคับ auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่า model (แทนที่ด้วยหนึ่งใน IDs ที่ส่งกลับจาก `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/sglang](/th/providers/sglang)

### พร็อกซีในเครื่อง (LM Studio, vLLM, LiteLLM ฯลฯ)

ตัวอย่าง (OpenAI-compatible):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

หมายเหตุ:

- สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นค่าไม่บังคับ
  หากไม่ระบุ OpenClaw จะใช้ค่าเริ่มต้นดังนี้:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- แนะนำ: ตั้งค่าที่ชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/model ของคุณ
- สำหรับ `api: "openai-completions"` บนเอ็นด์พอยต์ที่ไม่ใช่ native (ทุก `baseUrl` ที่ไม่ว่างซึ่ง host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จาก provider ที่ไม่รองรับบทบาท `developer`
- เส้นทาง OpenAI-compatible แบบพร็อกซีจะข้ามการจัดรูปคำขอที่มีเฉพาะ native OpenAI เช่นกัน:
  ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มี
  prompt-cache hints, ไม่มีการจัดรูป payload เพื่อความเข้ากันได้กับ OpenAI reasoning และไม่มี
  hidden OpenClaw attribution headers
- สำหรับพร็อกซีแบบ OpenAI-compatible Completions ที่ต้องการฟิลด์เฉพาะของผู้ให้บริการ
  ให้ตั้ง `agents.defaults.models["provider/model"].params.extra_body` (หรือ
  `extraBody`) เพื่อ merge JSON เพิ่มเติมเข้าไปใน request body ขาออก
- หาก `baseUrl` ว่างหรือไม่ระบุ OpenClaw จะคงพฤติกรรม OpenAI ค่าเริ่มต้นไว้ (ซึ่งจะ resolve ไปที่ `api.openai.com`)
- เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ระบุอย่างชัดเจนจะยังคงถูก override บนเอ็นด์พอยต์ `openai-completions` ที่ไม่ใช่ native

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [Configuration](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [Models](/th/concepts/models) — การกำหนดค่า model และ aliases
- [Model failover](/th/concepts/model-failover) — ลำดับ fallback และพฤติกรรมการลองใหม่
- [Configuration reference](/th/gateway/config-agents#agent-defaults) — คีย์ config ของ model
- [Providers](/th/providers) — คู่มือการตั้งค่าแยกตามผู้ให้บริการ
