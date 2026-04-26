---
read_when:
    - คุณต้องการข้อมูลอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่าง config หรือคำสั่ง onboarding ผ่าน CLI สำหรับผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดล พร้อมตัวอย่าง config และโฟลว์ CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-04-26T11:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

ข้อมูลอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล ดู [Models](/th/concepts/models)

## กฎแบบรวดเร็ว

<AccordionGroup>
  <Accordion title="Model refs และตัวช่วย CLI">
    - Model refs ใช้รูปแบบ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` ทำหน้าที่เป็น allowlist เมื่อมีการตั้งค่า
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.models[].contextWindow` คือข้อมูลเมตาเนทีฟของโมเดล; `contextTokens` คือขีดจำกัดรันไทม์ที่มีผลจริง
    - กฎ fallback, cooldown probes และการคงอยู่ของ session-override: [Model failover](/th/concepts/model-failover)
  </Accordion>
  <Accordion title="การแยก provider/runtime ของ OpenAI">
    เส้นทางตระกูล OpenAI แยกตาม prefix:

    - `openai/<model>` ใช้ผู้ให้บริการ direct OpenAI API-key ใน PI
    - `openai-codex/<model>` ใช้ Codex OAuth ใน PI
    - `openai/<model>` ร่วมกับ `agents.defaults.agentRuntime.id: "codex"` ใช้ native Codex app-server harness

    ดู [OpenAI](/th/providers/openai) และ [Codex harness](/th/plugins/codex-harness) หากการแยก provider/runtime ทำให้สับสน ให้เริ่มจาก [Agent runtimes](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้ Plugin อัตโนมัติก็เป็นไปตามขอบเขตเดียวกัน: `openai-codex/<model>` อยู่ภายใต้ OpenAI Plugin ขณะที่ Codex Plugin จะถูกเปิดใช้โดย `agentRuntime.id: "codex"` หรือ model refs แบบเดิม `codex/<model>`

    GPT-5.5 ใช้งานได้ผ่าน `openai/gpt-5.5` สำหรับทราฟฟิก direct API-key, `openai-codex/gpt-5.5` ใน PI สำหรับ Codex OAuth และ native Codex app-server harness เมื่อมีการตั้ง `agentRuntime.id: "codex"`

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI runtimes ใช้การแยกแบบเดียวกัน: เลือก canonical model refs เช่น `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` แล้วตั้ง `agents.defaults.agentRuntime.id` เป็น `claude-cli`, `google-gemini-cli` หรือ `codex-cli` เมื่อต้องการ backend CLI ในเครื่อง

    ref แบบเดิม `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` จะถูกย้ายกลับไปยัง canonical provider refs โดยบันทึกรันไทม์แยกไว้ต่างหาก

  </Accordion>
</AccordionGroup>

## พฤติกรรมของผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะของผู้ให้บริการส่วนใหญ่อยู่ใน provider plugins (`registerProvider(...)`) ขณะที่ OpenClaw เก็บลูปการอนุมานแบบทั่วไปไว้ Plugins เป็นเจ้าของ onboarding, model catalogs, การแมป auth env vars, การทำ transport/config normalization, การล้าง tool-schema, การจัดประเภท failover, การรีเฟรช OAuth, การรายงานการใช้งาน, โปรไฟล์ thinking/reasoning และอื่น ๆ

รายการเต็มของ hooks สำหรับ provider-SDK และตัวอย่าง bundled-plugin อยู่ใน [Provider plugins](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ request executor แบบกำหนดเองทั้งหมดจะเป็นพื้นผิวการขยายอีกแบบที่ลึกกว่า

<Note>
`capabilities` ของ provider runtime คือข้อมูลเมตาของ runner ที่ใช้ร่วมกัน (ตระกูลผู้ให้บริการ, ความพิเศษของ transcript/tooling, คำใบ้ด้าน transport/cache) ไม่ใช่สิ่งเดียวกับ [public capability model](/th/plugins/architecture#public-capability-model) ซึ่งใช้อธิบายว่า Plugin ลงทะเบียนอะไรไว้ (การอนุมานข้อความ, เสียงพูด ฯลฯ)
</Note>

## การหมุนเวียน API key

<AccordionGroup>
  <Accordion title="แหล่งที่มาของ key และลำดับความสำคัญ">
    กำหนดค่า keys หลายตัวผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (single live override, ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วย comma หรือ semicolon)
    - `<PROVIDER>_API_KEY` (key หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะมี `GOOGLE_API_KEY` รวมเป็น fallback ด้วย ลำดับการเลือก key จะรักษาลำดับความสำคัญและตัดค่าที่ซ้ำกันออก

  </Accordion>
  <Accordion title="rotation จะเริ่มทำงานเมื่อใด">
    - คำขอจะถูกลองใหม่ด้วย key ถัดไปเฉพาะเมื่อได้รับการตอบกลับแบบ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความจำกัดการใช้งานเป็นช่วง ๆ)
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่มีการลองหมุนเวียน key
    - เมื่อ key ผู้สมัครทั้งหมดล้มเหลว จะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งล่าสุด
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการในตัว (แค็ตตาล็อก pi-ai)

OpenClaw มาพร้อมแค็ตตาล็อก pi‑ai ผู้ให้บริการเหล่านี้ **ไม่ต้อง** ใช้ config `models.providers`; เพียงตั้งค่า auth + เลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- Auth: `OPENAI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` และ `OPENCLAW_LIVE_OPENAI_KEY` (single override)
- ตัวอย่างโมเดล: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือ API key บางแบบทำงานต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE fallback)
- แทนที่รายโมเดลได้ผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- OpenAI Responses WebSocket warm-up เปิดใช้งานเป็นค่าเริ่มต้นผ่าน `params.openaiWsWarmup` (`true`/`false`)
- OpenAI priority processing เปิดใช้ได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะแมป direct `openai/*` Responses requests ไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อต้องการ tier แบบชัดเจนแทนการใช้สวิตช์ `/fast` ร่วมกัน
- hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`) จะมีผลเฉพาะกับ native OpenAI traffic ไปยัง `api.openai.com` เท่านั้น ไม่ใช้กับ generic OpenAI-compatible proxies
- เส้นทาง native OpenAI จะคง Responses `store`, prompt-cache hints และการจัดรูป payload แบบ reasoning-compat ของ OpenAI; เส้นทาง proxy จะไม่มี
- `openai/gpt-5.3-codex-spark` ถูกซ่อนไว้โดยตั้งใจใน OpenClaw เพราะคำขอ OpenAI API แบบ live ปฏิเสธโมเดลนี้ และแค็ตตาล็อก Codex ปัจจุบันก็ไม่ได้เปิดให้ใช้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` และ `OPENCLAW_LIVE_ANTHROPIC_KEY` (single override)
- ตัวอย่างโมเดล: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะแบบ direct รองรับสวิตช์ `/fast` ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย API key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw จะแมปสิ่งนี้ไปยัง Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- config Claude CLI ที่แนะนำคือคง model ref ให้เป็น canonical และเลือกรันไทม์ CLI backend แยกต่างหาก: `anthropic/claude-opus-4-7` ร่วมกับ `agents.defaults.agentRuntime.id: "claude-cli"` ref แบบเดิม `claude-cli/claude-opus-4-7` ยังใช้งานได้เพื่อความเข้ากันได้

<Note>
ทีมงาน Anthropic แจ้งกับเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นวิธีที่ได้รับอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ โทเค็นตั้งค่า Anthropic ยังใช้งานได้ในฐานะเส้นทางโทเค็นที่รองรับโดย OpenClaw แต่ตอนนี้ OpenClaw จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อใช้งานได้
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI model ref: `openai-codex/gpt-5.5`
- native Codex app-server harness ref: `openai/gpt-5.5` ร่วมกับ `agents.defaults.agentRuntime.id: "codex"`
- เอกสาร native Codex app-server harness: [Codex harness](/th/plugins/codex-harness)
- model refs แบบเดิม: `codex/gpt-*`
- ขอบเขตของ Plugin: `openai-codex/*` จะโหลด OpenAI Plugin; native Codex app-server plugin จะถูกเลือกเฉพาะโดยรันไทม์ Codex harness หรือ ref แบบเดิม `codex/*`
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE fallback)
- แทนที่ราย PI model ได้ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อใน native Codex Responses requests (`chatgpt.com/backend-api`) ด้วย
- hidden OpenClaw attribution headers (`originator`, `version`, `User-Agent`) จะถูกแนบเฉพาะบน native Codex traffic ไปยัง `chatgpt.com/backend-api` เท่านั้น ไม่ใช้กับ generic OpenAI-compatible proxies
- ใช้สวิตช์ `/fast` และ config `params.fastMode` ร่วมกับ direct `openai/*`; OpenClaw จะแมปสิ่งนี้ไปยัง `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้ `contextWindow = 400000` แบบเนทีฟของแค็ตตาล็อก Codex และค่าเริ่มต้นรันไทม์ `contextTokens = 272000`; แทนที่ขีดจำกัดรันไทม์ได้ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw
- ใช้ `openai-codex/gpt-5.5` เมื่อต้องการเส้นทาง Codex OAuth/subscription; ใช้ `openai/gpt-5.5` เมื่อตั้งค่า API key และแค็ตตาล็อกในเครื่องของคุณเปิดให้ใช้เส้นทาง public API

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

### ตัวเลือกแบบโฮสต์สไตล์ subscription อื่น ๆ

<CardGroup cols={3}>
  <Card title="GLM models" href="/th/providers/glm">
    Z.AI Coding Plan หรือ general API endpoints
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    OAuth ของ MiniMax Coding Plan หรือการเข้าถึงด้วย API key
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    พื้นผิวผู้ให้บริการ Qwen Cloud พร้อมการแมป Alibaba DashScope และ Coding Plan endpoint
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการรันไทม์ Zen: `opencode`
- ผู้ให้บริการรันไทม์ Go: `opencode-go`
- ตัวอย่างโมเดล: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ผู้ให้บริการ: `google`
- Auth: `GEMINI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` และ `OPENCLAW_LIVE_GEMINI_KEY` (single override)
- ตัวอย่างโมเดล: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: config OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูก normalize เป็น `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` ใช้ Google dynamic thinking Gemini 3/3.1 จะไม่มี `thinkingLevel` แบบคงที่; Gemini 2.5 จะส่ง `thinkingBudget: -1`
- การรัน Gemini แบบ direct ยังรองรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือแบบเดิม `cached_content`) เพื่อส่งต่อ handle `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; cache hits ของ Gemini จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- Auth: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตัวเอง

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานข้อจำกัดของบัญชี Google หลังจากใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
</Warning>

Gemini CLI OAuth ถูกจัดส่งมาเป็นส่วนหนึ่งของ `google` Plugin ที่รวมมาให้

<Steps>
  <Step title="ติดตั้ง Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="เปิดใช้ Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="เข้าสู่ระบบ">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่ต้อง** วาง client id หรือ secret ลงใน `openclaw.json` โฟลว์การเข้าสู่ระบบของ CLI จะจัดเก็บโทเค็นไว้ใน auth profiles บนโฮสต์ของ gateway

  </Step>
  <Step title="ตั้งค่า project (หากจำเป็น)">
    หากคำขอล้มเหลวหลังจากเข้าสู่ระบบแล้ว ให้ตั้ง `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ของ gateway
  </Step>
</Steps>

การตอบกลับ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; ข้อมูลการใช้งานจะ fallback ไปใช้ `stats` โดย `stats.cached` จะถูก normalize เป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- Auth: `ZAI_API_KEY`
- ตัวอย่างโมเดล: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - alias: `z.ai/*` และ `z-ai/*` จะถูก normalize เป็น `zai/*`
  - `zai-api-key` จะตรวจจับ Z.AI endpoint ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` จะบังคับใช้พื้นผิวที่เฉพาะเจาะจง

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- ตัวอย่างโมเดล: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ผู้ให้บริการ: `kilocode`
- Auth: `KILOCODE_API_KEY`
- ตัวอย่างโมเดล: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- แค็ตตาล็อก fallback แบบสแตติกมาพร้อม `kilocode/kilo/auto`; การค้นหาแบบ live ที่ `https://api.kilo.ai/api/gateway/models` อาจขยายแค็ตตาล็อกรันไทม์เพิ่มเติมได้
- การกำหนดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นสิ่งที่ Kilo Gateway เป็นเจ้าของ ไม่ได้ hard-code ไว้ใน OpenClaw

ดู [/providers/kilocode](/th/providers/kilocode) สำหรับรายละเอียดการตั้งค่า

### provider plugins แบบ bundled อื่น ๆ

| Provider                | Id                               | Auth env                                                     | Example model |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest` |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7` |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | — |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash` |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | — |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | — |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1` |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto` |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` หรือ `KIMICODE_API_KEY`                       | `kimi/kimi-code` |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7` |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest` |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6` |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto` |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2` |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus` |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash` |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5` |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | — |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest` |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4` |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash` |

#### จุดพิเศษที่ควรรู้

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้ app-attribution headers และ Anthropic `cache_control` markers เฉพาะบนเส้นทาง `openrouter.ai` ที่ยืนยันแล้วเท่านั้น ref ของ DeepSeek, Moonshot และ ZAI มีสิทธิ์ใช้ cache-TTL สำหรับ prompt caching ที่จัดการโดย OpenRouter แต่จะไม่ได้รับ Anthropic cache markers ในฐานะเส้นทางแบบ proxy สไตล์ OpenAI-compatible จึงข้ามการจัดรูปแบบที่มีเฉพาะ native OpenAI (`serviceTier`, Responses `store`, prompt-cache hints, OpenAI reasoning-compat`) ref ที่ขับเคลื่อนด้วย Gemini จะคงไว้เฉพาะการทำความสะอาด thought-signature แบบ proxy-Gemini เท่านั้น
  </Accordion>
  <Accordion title="Kilo Gateway">
    ref ที่ขับเคลื่อนด้วย Gemini ใช้เส้นทางการทำความสะอาดแบบ proxy-Gemini เช่นเดียวกัน; `kilocode/kilo/auto` และ ref อื่นที่ proxy ไม่รองรับ reasoning จะข้ามการแทรก proxy reasoning
  </Accordion>
  <Accordion title="MiniMax">
    onboarding แบบ API key จะเขียนนิยามโมเดลแชต M2.7 ที่เป็นข้อความล้วนแบบชัดเจน; การทำความเข้าใจภาพยังคงอยู่กับผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง xAI Responses `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นรุ่น `*-fast` `tool_stream` เปิดใช้เป็นค่าเริ่มต้น; ปิดได้ด้วย `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
  <Accordion title="Cerebras">
    โมเดล GLM ใช้ `zai-glm-4.7` / `zai-glm-4.6`; OpenAI-compatible base URL คือ `https://api.cerebras.ai/v1`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (custom/base URL)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการแบบ **กำหนดเอง** หรือ proxy ที่เข้ากันได้กับ OpenAI/Anthropic

provider plugins แบบ bundled หลายตัวด้านล่างเผยแพร่แค็ตตาล็อกเริ่มต้นไว้อยู่แล้ว ใช้รายการ `models.providers.<id>` แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ default base URL, headers หรือรายการโมเดล

### Moonshot AI (Kimi)

Moonshot มาพร้อมเป็น bundled provider plugin ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ base URL หรือข้อมูลเมตาของโมเดล:

- ผู้ให้บริการ: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- ตัวอย่างโมเดล: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"
__OC_I18N_900009__
### Kimi Coding

Kimi Coding ใช้ endpoint ที่เข้ากันได้กับ Anthropic ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- Auth: `KIMI_API_KEY`
- ตัวอย่างโมเดล: `kimi/kimi-code`
__OC_I18N_900010__
`kimi/k2p5` แบบเดิมยังคงยอมรับได้ในฐานะ model id เพื่อความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) เปิดให้เข้าถึง Doubao และโมเดลอื่น ๆ ในจีน

- ผู้ให้บริการ: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- ตัวอย่างโมเดล: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`
__OC_I18N_900011__
Onboarding จะใช้พื้นผิว coding เป็นค่าเริ่มต้น แต่แค็ตตาล็อก `volcengine/*` ทั่วไปจะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือก auth ของ Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด OpenClaw จะ fallback ไปยังแค็ตตาล็อกที่ไม่ผ่านการกรองแทนการแสดงตัวเลือกแบบกำหนดขอบเขตผู้ให้บริการที่ว่างเปล่า

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)
  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`
  </Tab>
</Tabs>

### BytePlus (International)

BytePlus ARK เปิดให้เข้าถึงโมเดลชุดเดียวกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

- ผู้ให้บริการ: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- ตัวอย่างโมเดล: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`
__OC_I18N_900012__
Onboarding จะใช้พื้นผิว coding เป็นค่าเริ่มต้น แต่แค็ตตาล็อก `byteplus/*` ทั่วไปจะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือก auth ของ BytePlus จะให้ความสำคัญกับทั้งแถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด OpenClaw จะ fallback ไปยังแค็ตตาล็อกที่ไม่ผ่านการกรองแทนการแสดงตัวเลือกแบบกำหนดขอบเขตผู้ให้บริการที่ว่างเปล่า

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)
  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`
  </Tab>
</Tabs>

### Synthetic

Synthetic ให้บริการโมเดลที่เข้ากันได้กับ Anthropic ภายใต้ผู้ให้บริการ `synthetic`:

- ผู้ให้บริการ: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- ตัวอย่างโมเดล: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`
__OC_I18N_900013__
### MiniMax

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้ endpoints แบบกำหนดเอง:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดู [/providers/minimax](/providers/minimax) สำหรับรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่าง config

<Note>
บนเส้นทางสตรีมแบบ Anthropic-compatible ของ MiniMax OpenClaw จะปิด thinking เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าไว้เองอย่างชัดเจน และ `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแยกความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังคงอยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การทำความเข้าใจภาพคือ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนทั้งสองเส้นทาง auth ของ MiniMax
- การค้นหาเว็บยังคงใช้ provider id `minimax`

### LM Studio

LM Studio มาพร้อมเป็น bundled provider plugin ซึ่งใช้ native API:

- ผู้ให้บริการ: `lmstudio`
- Auth: `LM_API_TOKEN`
- base URL เริ่มต้นสำหรับการอนุมาน: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ได้จาก `http://localhost:1234/api/v1/models`):
__OC_I18N_900014__
OpenClaw ใช้ native `/api/v1/models` และ `/api/v1/models/load` ของ LM Studio สำหรับการค้นหา + auto-load และใช้ `/v1/chat/completions` สำหรับการอนุมานเป็นค่าเริ่มต้น ดู [/providers/lmstudio](/providers/lmstudio) สำหรับการตั้งค่าและการแก้ไขปัญหา

### Ollama

Ollama มาพร้อมเป็น bundled provider plugin และใช้ native API ของ Ollama:

- ผู้ให้บริการ: `ollama`
- Auth: ไม่จำเป็น (เซิร์ฟเวอร์ในเครื่อง)
- ตัวอย่างโมเดล: `ollama/llama3.3`
- การติดตั้ง: [https://ollama.com/download](https://ollama.com/download)
__OC_I18N_900015____OC_I18N_900016__
Ollama จะถูกตรวจพบในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ bundled provider plugin จะเพิ่ม Ollama เข้าไปโดยตรงใน `openclaw onboard` และตัวเลือกโมเดล ดู [/providers/ollama](/providers/ollama) สำหรับ onboarding โหมด cloud/local และการกำหนดค่าแบบกำหนดเอง

### vLLM

vLLM มาพร้อมเป็น bundled provider plugin สำหรับเซิร์ฟเวอร์ OpenAI-compatible แบบ local/self-hosted:

- ผู้ให้บริการ: `vllm`
- Auth: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL เริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้ auto-discovery ในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับ auth):
__OC_I18N_900017__
จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ได้จาก `/v1/models`):
__OC_I18N_900018__
ดู [/providers/vllm](/providers/vllm) สำหรับรายละเอียด

### SGLang

SGLang มาพร้อมเป็น bundled provider plugin สำหรับเซิร์ฟเวอร์ OpenAI-compatible แบบ self-hosted ที่รวดเร็ว:

- ผู้ให้บริการ: `sglang`
- Auth: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL เริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้ auto-discovery ในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับ auth):
__OC_I18N_900019__
จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ได้จาก `/v1/models`):
__OC_I18N_900020__
ดู [/providers/sglang](/providers/sglang) สำหรับรายละเอียด

### local proxies (LM Studio, vLLM, LiteLLM ฯลฯ)

ตัวอย่าง (OpenAI-compatible):
__OC_I18N_900021__
<AccordionGroup>
  <Accordion title="ฟิลด์เสริมเริ่มต้น">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์ไม่บังคับ เมื่อไม่ระบุ OpenClaw จะใช้ค่าเริ่มต้นดังนี้:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    คำแนะนำ: ควรตั้งค่าแบบชัดเจนให้ตรงกับขีดจำกัดของ proxy/โมเดลของคุณ

  </Accordion>
  <Accordion title="กฎการจัดรูปแบบเส้นทาง proxy">
    - สำหรับ `api: "openai-completions"` บน endpoints ที่ไม่ใช่ native (คือ `baseUrl` ที่ไม่ว่างและ host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการที่ไม่รองรับ role `developer`
    - เส้นทาง OpenAI-compatible แบบ proxy จะข้ามการจัดรูป request ที่มีเฉพาะ native OpenAI ด้วย: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มี prompt-cache hints, ไม่มีการจัดรูป payload แบบ OpenAI reasoning-compat และไม่มี hidden OpenClaw attribution headers
    - สำหรับ Completions proxies แบบ OpenAI-compatible ที่ต้องใช้ฟิลด์เฉพาะของ vendor ให้ตั้ง `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อ merge JSON เพิ่มเติมเข้าไปใน outbound request body
    - สำหรับตัวควบคุม chat-template ของ vLLM ให้ตั้ง `agents.defaults.models["provider/model"].params.chat_template_kwargs` OpenClaw จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับ thinking ของ session ปิดอยู่
    - หาก `baseUrl` ว่างหรือไม่ระบุ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่งจะ resolve ไปที่ `api.openai.com`)
    - เพื่อความปลอดภัย แม้ตั้ง `compat.supportsDeveloperRole: true` แบบชัดเจน ก็ยังถูก override บน endpoints `openai-completions` ที่ไม่ใช่ native
  </Accordion>
</AccordionGroup>

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [Configuration](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์ config ของโมเดล
- [Model failover](/th/concepts/model-failover) — สาย fallback และพฤติกรรมการลองใหม่
- [Models](/th/concepts/models) — การกำหนดค่าโมเดลและ alias
- [Providers](/th/providers) — คู่มือการตั้งค่าแยกตามผู้ให้บริการ
