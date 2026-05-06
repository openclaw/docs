---
read_when:
    - คุณต้องมีเอกสารอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่างการกำหนดค่าหรือคำสั่ง CLI สำหรับการเริ่มต้นใช้งานผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่า + ขั้นตอนการทำงานของ CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-05-06T09:09:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับ**ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องแชทอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models)

## กฎฉบับย่อ

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` ทำหน้าที่เป็นรายการอนุญาตเมื่อมีการตั้งค่าไว้
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` แทนที่ค่าเหล่านั้นต่อโมเดล
    - กฎ fallback, การ probe ช่วง cooldown และการคงอยู่ของ session override: [Model failover](/th/concepts/model-failover)

  </Accordion>
  <Accordion title="การเพิ่ม auth ของผู้ให้บริการจะไม่เปลี่ยนโมเดลหลักของคุณ">
    `openclaw configure` จะรักษา `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อคุณเพิ่มหรือ reauth ผู้ให้บริการ Plugin ของผู้ให้บริการยังอาจส่งคืนโมเดลเริ่มต้นที่แนะนำใน auth config patch ได้ แต่ configure จะตีความสิ่งนั้นว่าเป็น "ทำให้โมเดลนี้พร้อมใช้งาน" เมื่อมีโมเดลหลักอยู่แล้ว ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน"

    หากต้องการสลับโมเดลเริ่มต้นโดยเจตนา ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`

  </Accordion>
  <Accordion title="การแยก provider/runtime ของ OpenAI">
    route ตระกูล OpenAI จะเจาะจงตาม prefix:

    - `openai/<model>` ร่วมกับ `agents.defaults.agentRuntime.id: "codex"` ใช้ native Codex app-server harness นี่คือการตั้งค่าปกติสำหรับ subscription ของ ChatGPT/Codex
    - `openai-codex/<model>` ใช้ Codex OAuth ใน PI
    - `openai/<model>` ที่ไม่มีการ override runtime ของ Codex ใช้ผู้ให้บริการ API key ของ OpenAI โดยตรงใน PI

    ดู [OpenAI](/th/providers/openai) และ [Codex harness](/th/plugins/codex-harness) หากการแยก provider/runtime ทำให้สับสน ให้อ่าน [Agent runtimes](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้ Plugin อัตโนมัติทำตามขอบเขตเดียวกัน: `openai-codex/<model>` เป็นของ Plugin OpenAI ส่วน Plugin Codex จะถูกเปิดใช้โดย `agentRuntime.id: "codex"` หรือการอ้างอิง legacy `codex/<model>`

    GPT-5.5 พร้อมใช้งานผ่าน native Codex app-server harness เมื่อมีการตั้งค่า `agentRuntime.id: "codex"`, ผ่าน `openai-codex/gpt-5.5` ใน PI สำหรับ Codex OAuth และผ่าน `openai/gpt-5.5` ใน PI สำหรับ traffic แบบ API key โดยตรงเมื่อบัญชีของคุณเปิดให้ใช้

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI runtimes ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดล canonical เช่น `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` จากนั้นตั้ง `agents.defaults.agentRuntime.id` เป็น `claude-cli`, `google-gemini-cli` หรือ `codex-cli` เมื่อต้องการ backend CLI ภายในเครื่อง

    การอ้างอิง legacy `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` จะ migrate กลับเป็นการอ้างอิงผู้ให้บริการ canonical พร้อมบันทึก runtime แยกต่างหาก

  </Accordion>
</AccordionGroup>

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน Plugin ของผู้ให้บริการ (`registerProvider(...)`) ขณะที่ OpenClaw รักษา inference loop ทั่วไปไว้ Plugin เป็นเจ้าของ onboarding, catalog โมเดล, การแมป auth env-var, การทำ transport/config normalization, การ cleanup tool-schema, การจัดประเภท failover, การ refresh OAuth, การรายงาน usage, profile การคิด/reasoning และอื่นๆ

รายการ hook ของ provider-SDK และตัวอย่าง bundled-plugin ทั้งหมดอยู่ใน [Provider plugins](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องการ request executor แบบ custom ทั้งหมดเป็น extension surface ที่แยกออกไปและลึกกว่า

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน hook ผู้ให้บริการแบบชัดเจน เช่น replay policy, tool-schema normalization, stream wrapping และ transport/request helpers ถุง static แบบ legacy `ProviderPlugin.capabilities` มีไว้เพื่อความเข้ากันได้เท่านั้น และ shared runner logic จะไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียน API key

<AccordionGroup>
  <Accordion title="แหล่งที่มาของ key และลำดับความสำคัญ">
    กำหนดค่า key หลายรายการผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (single live override, ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วยคอมมาหรือเซมิโคลอน)
    - `<PROVIDER>_API_KEY` (key หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีเลขกำกับ เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือก key จะรักษาลำดับความสำคัญและตัดค่าที่ซ้ำกันออก

  </Accordion>
  <Accordion title="เมื่อใดที่การหมุนเวียนเริ่มทำงาน">
    - คำขอจะถูกลองใหม่ด้วย key ถัดไปเฉพาะเมื่อมีการตอบกลับ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความ usage-limit เป็นระยะ)
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่พยายามหมุนเวียน key
    - เมื่อ key ผู้สมัครทั้งหมดล้มเหลว ข้อผิดพลาดสุดท้ายจะถูกส่งคืนจากความพยายามครั้งสุดท้าย

  </Accordion>
</AccordionGroup>

## ผู้ให้บริการในตัว (catalog pi-ai)

OpenClaw มาพร้อมกับ catalog pi-ai ผู้ให้บริการเหล่านี้ไม่ต้องใช้ config `models.providers` **ใดๆ**; เพียงตั้งค่า auth และเลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- Auth: `OPENAI_API_KEY`
- การหมุนเวียนแบบเลือกได้: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (single override)
- โมเดลตัวอย่าง: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หาก install หรือ API key เฉพาะทำงานต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override ต่อโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- ค่าเริ่มต้นของ OpenAI Responses WebSocket warm-up เปิดใช้งานผ่าน `params.openaiWsWarmup` (`true`/`false`)
- สามารถเปิดใช้ OpenAI priority processing ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะแมปคำขอ direct `openai/*` Responses เป็น `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อต้องการ tier แบบชัดเจนแทน toggle `/fast` ที่ใช้ร่วมกัน
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับ traffic OpenAI native ไปยัง `api.openai.com` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- route OpenAI native ยังคงรักษา Responses `store`, hint ของ prompt-cache และการจัดรูป payload reasoning-compat ของ OpenAI; route proxy ไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` ถูกซ่อนไว้โดยเจตนาใน OpenClaw เพราะคำขอ OpenAI API แบบ live ปฏิเสธโมเดลนี้ และ catalog Codex ปัจจุบันไม่เปิดเผยโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- การหมุนเวียนแบบเลือกได้: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (single override)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะโดยตรงรองรับ toggle `/fast` ที่ใช้ร่วมกันและ `params.fastMode` รวมถึง traffic แบบ API key และ OAuth-authenticated ที่ส่งไปยัง `api.anthropic.com`; OpenClaw จะแมปสิ่งนั้นเป็น Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- config Claude CLI ที่แนะนำจะเก็บการอ้างอิงโมเดลให้เป็น canonical และเลือก CLI
  backend แยกต่างหาก: `anthropic/claude-opus-4-7` พร้อม
  `agents.defaults.agentRuntime.id: "claude-cli"` การอ้างอิง legacy
  `claude-cli/claude-opus-4-7` ยังทำงานได้เพื่อความเข้ากันได้

<Note>
พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI มาใช้ซ้ำและการใช้ `claude -p` ได้รับอนุญาตสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ setup-token ของ Anthropic ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw จะเลือกใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- Auth: OAuth (ChatGPT)
- การอ้างอิงโมเดล PI: `openai-codex/gpt-5.5`
- การอ้างอิง native Codex app-server harness: `openai/gpt-5.5` พร้อม `agents.defaults.agentRuntime.id: "codex"`
- เอกสาร native Codex app-server harness: [Codex harness](/th/plugins/codex-harness)
- การอ้างอิงโมเดล legacy: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` โหลด Plugin OpenAI; Plugin native Codex app-server จะถูกเลือกโดย runtime ของ Codex harness หรือการอ้างอิง legacy `codex/*` เท่านั้น
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override ต่อโมเดล PI ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` ถูกส่งต่อบนคำขอ native Codex Responses ด้วย (`chatgpt.com/backend-api`)
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) จะถูกแนบเฉพาะกับ traffic Codex native ไปยัง `chatgpt.com/backend-api` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- ใช้ toggle `/fast` และ config `params.fastMode` เดียวกันกับ direct `openai/*`; OpenClaw จะแมปสิ่งนั้นเป็น `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้ `contextWindow = 400000` แบบ native ของ catalog Codex และ runtime เริ่มต้น `contextTokens = 272000`; override cap ของ runtime ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/workflow ภายนอกอย่าง OpenClaw
- สำหรับ route subscription บวก native Codex runtime ที่พบบ่อย ให้ลงชื่อเข้าใช้ด้วย auth `openai-codex` แต่กำหนดค่า `openai/gpt-5.5` พร้อม `agents.defaults.agentRuntime.id: "codex"`
- ใช้ `openai-codex/gpt-5.5` เฉพาะเมื่อคุณต้องการ route Codex OAuth/subscription ผ่าน PI; ใช้ `openai/gpt-5.5` โดยไม่มีการ override runtime ของ Codex เมื่อการตั้งค่า API key และ catalog ภายในเครื่องของคุณเปิดให้ใช้ route API สาธารณะ
- การอ้างอิง `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` และ `openai-codex/gpt-5.3*` ที่เก่ากว่าจะถูกซ่อนไว้ เพราะบัญชี ChatGPT/Codex OAuth ปฏิเสธโมเดลเหล่านั้น; ใช้ `openai-codex/gpt-5.5` หรือ route native Codex runtime แทน

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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

### ตัวเลือก hosted แบบ subscription-style อื่นๆ

<CardGroup cols={3}>
  <Card title="โมเดล GLM" href="/th/providers/glm">
    Z.AI Coding Plan หรือ endpoint API ทั่วไป
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    MiniMax Coding Plan OAuth หรือการเข้าถึงด้วย API key
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    surface ของผู้ให้บริการ Qwen Cloud รวมถึงการแมป endpoint ของ Alibaba DashScope และ Coding Plan
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการ Zen runtime: `opencode`
- ผู้ให้บริการ Go runtime: `opencode-go`
- โมเดลตัวอย่าง: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนเสริม: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, สำรอง `GOOGLE_API_KEY`, และ `OPENCLAW_LIVE_GEMINI_KEY` (การเขียนทับเดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: การกำหนดค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกทำให้เป็นมาตรฐานเป็น `google/gemini-3-flash-preview`
- นามแฝง: `google/gemini-3.1-pro` ได้รับการยอมรับและถูกทำให้เป็นมาตรฐานเป็นรหัส Gemini API สดของ Google คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การคิด: `/think adaptive` ใช้การคิดแบบไดนามิกของ Google Gemini 3/3.1 ละ `thinkingLevel` แบบคงที่; Gemini 2.5 ส่ง `thinkingBudget: -1`
- การรัน Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อแฮนเดิล `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; การพบแคชของ Gemini จะแสดงเป็น `cacheRead` ของ OpenClaw

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตน

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานการทำงานที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานข้อจำกัดบัญชี Google หลังจากใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
</Warning>

Gemini CLI OAuth ถูกจัดส่งเป็นส่วนหนึ่งของ Plugin `google` ที่รวมมาให้

<Steps>
  <Step title="Install Gemini CLI">
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
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่ต้อง** วางรหัสไคลเอนต์หรือความลับลงใน `openclaw.json` โฟลว์ล็อกอินของ CLI จะจัดเก็บโทเค็นในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway

  </Step>
  <Step title="Set project (if needed)">
    หากคำขอล้มเหลวหลังล็อกอิน ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

การตอบกลับ JSON ของ Gemini CLI ถูกแยกวิเคราะห์จาก `response`; การใช้งานจะย้อนกลับไปใช้ `stats` โดย `stats.cached` จะถูกทำให้เป็นมาตรฐานเป็น `cacheRead` ของ OpenClaw

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - นามแฝง: `z.ai/*` และ `z-ai/*` จะถูกทำให้เป็นมาตรฐานเป็น `zai/*`
  - `zai-api-key` ตรวจจับปลายทาง Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global`, และ `zai-cn` บังคับใช้พื้นผิวเฉพาะ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- การยืนยันตัวตน: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ผู้ให้บริการ: `kilocode`
- การยืนยันตัวตน: `KILOCODE_API_KEY`
- โมเดลตัวอย่าง: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL ฐาน: `https://api.kilo.ai/api/gateway/`
- แค็ตตาล็อกสำรองแบบคงที่จัดส่ง `kilocode/kilo/auto`; การค้นพบสด `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อกรันไทม์เพิ่มเติมได้
- การกำหนดเส้นทางอัปสตรีมที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นความรับผิดชอบของ Kilo Gateway ไม่ได้ถูกเขียนตายตัวใน OpenClaw

ดูรายละเอียดการตั้งค่าที่ [/providers/kilocode](/th/providers/kilocode)

### Plugin ผู้ให้บริการอื่นที่รวมมาให้

| ผู้ให้บริการ            | รหัส                             | env การยืนยันตัวตน                                          | โมเดลตัวอย่าง                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` หรือ `KIMICODE_API_KEY`                       | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### ข้อควรทราบ

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้เฮดเดอร์การระบุแอปและเครื่องหมาย `cache_control` ของ Anthropic เฉพาะบนเส้นทาง `openrouter.ai` ที่ตรวจสอบแล้วเท่านั้น DeepSeek, Moonshot และ ZAI refs มีสิทธิ์ใช้ cache-TTL สำหรับการแคชพรอมป์ที่ OpenRouter จัดการ แต่จะไม่ได้รับเครื่องหมายแคชของ Anthropic ในฐานะเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI จึงข้ามการจัดรูปแบบที่มีเฉพาะ OpenAI แบบเนทีฟ (`serviceTier`, Responses `store`, คำแนะนำ prompt-cache, ความเข้ากันได้ของเหตุผลกับ OpenAI) refs ที่รองรับด้วย Gemini จะคงเฉพาะการทำความสะอาด thought-signature ของ proxy-Gemini ไว้
  </Accordion>
  <Accordion title="Kilo Gateway">
    refs ที่รองรับด้วย Gemini ใช้เส้นทางการทำความสะอาด proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และ refs อื่นที่ไม่รองรับ proxy-reasoning จะข้ามการฉีด proxy reasoning
  </Accordion>
  <Accordion title="MiniMax">
    การเริ่มต้นใช้งานด้วย API key จะเขียนนิยามโมเดลแชต M2.7 แบบข้อความเท่านั้นอย่างชัดเจน; ความเข้าใจรูปภาพยังคงอยู่บนผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    รหัสโมเดลใช้เนมสเปซ `nvidia/<vendor>/<model>` (เช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกจะคงองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษรไว้ ขณะที่คีย์มาตรฐานที่ส่งไปยัง API ยังคงมีคำนำหน้าเดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง xAI Responses `grok-4.3` เป็นโมเดลแชตเริ่มต้นที่มาพร้อมแพ็กเกจ `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` ของโมเดลเหล่านั้น `tool_stream` เปิดเป็นค่าเริ่มต้น; ปิดได้ผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
  <Accordion title="Cerebras">
    จัดส่งเป็น Plugin ผู้ให้บริการ `cerebras` ที่มาพร้อมแพ็กเกจ GLM ใช้ `zai-glm-4.7`; URL พื้นฐานที่เข้ากันได้กับ OpenAI คือ `https://api.cerebras.ai/v1`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (URL แบบกำหนดเอง/พื้นฐาน)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **แบบกำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่มาพร้อมแพ็กเกจจำนวนมากด้านล่างเผยแพร่แค็ตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL พื้นฐาน เฮดเดอร์ หรือรายการโมเดลเริ่มต้นเท่านั้น

การตรวจสอบความสามารถของโมเดล Gateway จะอ่านเมทาดาทา `models.providers.<id>.models[]` แบบชัดเจนด้วย หากโมเดลแบบกำหนดเองหรือพร็อกซียอมรับรูปภาพ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้เส้นทางไฟล์แนบจาก WebChat และ node-origin ส่งรูปภาพเป็นอินพุตโมเดลแบบเนทีฟแทน refs สื่อแบบข้อความเท่านั้น

### Moonshot AI (Kimi)

Moonshot จัดส่งเป็น Plugin ผู้ให้บริการที่มาพร้อมแพ็กเกจ ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL พื้นฐานหรือเมทาดาทาโมเดล:

- ผู้ให้บริการ: `moonshot`
- การยืนยันตัวตน: `MOONSHOT_API_KEY`
- โมเดลตัวอย่าง: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

รหัสโมเดล Kimi K2:

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

### Kimi coding

Kimi Coding ใช้เอนด์พอยต์ที่เข้ากันได้กับ Anthropic ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- การยืนยันตัวตน: `KIMI_API_KEY`
- โมเดลตัวอย่าง: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Legacy `kimi/k2p5` ยังคงได้รับการยอมรับในฐานะ id โมเดลเพื่อความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่น ๆ ในจีน

- ผู้ให้บริการ: `volcengine` (การเขียนโค้ด: `volcengine-plan`)
- การยืนยันตัวตน: `VOLCANO_ENGINE_API_KEY`
- ตัวอย่างโมเดล: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding ใช้พื้นผิวการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือกการยืนยันตัวตน Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดตามผู้ให้บริการแต่ไม่มีรายการ

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="โมเดลเขียนโค้ด (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (ระหว่างประเทศ)

BytePlus ARK ให้การเข้าถึงโมเดลเดียวกับ Volcano Engine สำหรับผู้ใช้ระหว่างประเทศ

- ผู้ให้บริการ: `byteplus` (การเขียนโค้ด: `byteplus-plan`)
- การยืนยันตัวตน: `BYTEPLUS_API_KEY`
- ตัวอย่างโมเดล: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding ใช้พื้นผิวการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `byteplus/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือกการยืนยันตัวตน BytePlus จะให้ความสำคัญกับทั้งแถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดตามผู้ให้บริการแต่ไม่มีรายการ

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="โมเดลเขียนโค้ด (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic ให้โมเดลที่เข้ากันได้กับ Anthropic ภายใต้ผู้ให้บริการ `synthetic`:

- ผู้ให้บริการ: `synthetic`
- การยืนยันตัวตน: `SYNTHETIC_API_KEY`
- ตัวอย่างโมเดล: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้ endpoint แบบกำหนดเอง:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดู [/providers/minimax](/th/providers/minimax) สำหรับรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่างการกำหนดค่า

<Note>
บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ของ MiniMax OpenClaw จะปิดการคิดเป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าอย่างชัดเจน และ `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแบ่งความสามารถที่เป็นของ Plugin:

- ค่าเริ่มต้นของ text/chat อยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- ความเข้าใจภาพเป็น `MiniMax-VL-01` ที่เป็นของ Plugin บนเส้นทางการยืนยันตัวตน MiniMax ทั้งสองแบบ
- การค้นเว็บยังอยู่บน id ผู้ให้บริการ `minimax`

### LM Studio

LM Studio มาพร้อมเป็น Plugin ผู้ให้บริการที่รวมมาให้ ซึ่งใช้ API แบบเนทีฟ:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- URL ฐานการอนุมานเริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ส่งคืนโดย `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบเนทีฟของ LM Studio สำหรับการค้นพบ + โหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานเป็นค่าเริ่มต้น หากคุณต้องการให้การโหลด JIT, TTL และการขับออกอัตโนมัติของ LM Studio เป็นผู้ดูแล lifecycle ของโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดู [/providers/lmstudio](/th/providers/lmstudio) สำหรับการตั้งค่าและการแก้ปัญหา

### Ollama

Ollama มาพร้อมเป็น Plugin ผู้ให้บริการที่รวมมาให้ และใช้ API แบบเนทีฟของ Ollama:

- ผู้ให้บริการ: `ollama`
- การยืนยันตัวตน: ไม่จำเป็น (เซิร์ฟเวอร์ภายในเครื่อง)
- ตัวอย่างโมเดล: `ollama/llama3.3`
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

Ollama ถูกตรวจพบภายในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการที่รวมมาให้จะเพิ่ม Ollama เข้าสู่ `openclaw onboard` และตัวเลือกโมเดลโดยตรง ดู [/providers/ollama](/th/providers/ollama) สำหรับ onboarding, โหมด cloud/local และการกำหนดค่าแบบกำหนดเอง

### vLLM

vLLM มาพร้อมเป็น Plugin ผู้ให้บริการที่รวมมาให้สำหรับเซิร์ฟเวอร์ภายในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติภายในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ส่งคืนโดย `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดู [/providers/vllm](/th/providers/vllm) สำหรับรายละเอียด

### SGLang

SGLang มาพร้อมเป็น Plugin ผู้ให้บริการที่รวมมาให้สำหรับเซิร์ฟเวอร์โฮสต์เองที่รวดเร็วและเข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติภายในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ส่งคืนโดย `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

ดู [/providers/sglang](/th/providers/sglang) สำหรับรายละเอียด

### พร็อกซีภายในเครื่อง (LM Studio, vLLM, LiteLLM ฯลฯ)

ตัวอย่าง (เข้ากันได้กับ OpenAI):

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
        timeoutSeconds: 300,
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

<AccordionGroup>
  <Accordion title="ฟิลด์ไม่บังคับเริ่มต้น">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์ไม่บังคับ เมื่อเว้นไว้ OpenClaw จะใช้ค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าที่ชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="กฎการจัดรูปแบบเส้นทางพร็อกซี">
    - สำหรับ `api: "openai-completions"` บน endpoint ที่ไม่ใช่แบบเนทีฟ (ค่า `baseUrl` ที่ไม่ว่างซึ่งโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI จะข้ามการจัดรูปแบบคำขอที่มีเฉพาะ OpenAI แบบเนทีฟด้วย: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้ prompt-cache, ไม่มีการจัดรูปแบบ payload ความเข้ากันได้ด้าน reasoning ของ OpenAI และไม่มี header attribution ของ OpenClaw ที่ซ่อนอยู่
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องการฟิลด์เฉพาะผู้ขาย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อผสาน JSON เพิ่มเติมเข้าไปใน body ของคำขอขาออก
    - สำหรับการควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับการคิดของเซสชันปิดอยู่
    - สำหรับโมเดลภายในเครื่องที่ช้าหรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` ค่านี้ขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึง connect, headers, body streaming และการยกเลิก guarded-fetch ทั้งหมด โดยไม่เพิ่ม timeout runtime ทั้งหมดของ agent
    - การเรียก HTTP ของผู้ให้บริการโมเดลอนุญาตคำตอบ DNS fake-IP ของ Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์ `baseUrl` ของผู้ให้บริการที่กำหนดค่าไว้เท่านั้น ปลายทาง private, loopback, link-local และ metadata อื่น ๆ ยังคงต้องเลือกใช้อย่างชัดเจนด้วย `models.providers.<id>.request.allowPrivateNetwork: true`
    - หาก `baseUrl` ว่างหรือถูกละไว้ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่ง resolve ไปที่ `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ตั้งค่าไว้อย่างชัดเจนก็ยังถูก override บน endpoint `openai-completions` ที่ไม่ใช่แบบเนทีฟ
    - สำหรับ `api: "anthropic-messages"` บน endpoint ที่ไม่ใช่โดยตรง (ผู้ให้บริการใด ๆ ที่ไม่ใช่ `anthropic` ตามมาตรฐาน หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่โฮสต์ไม่ใช่ endpoint สาธารณะของ `api.anthropic.com`) OpenClaw จะระงับ header Anthropic beta โดยนัย เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และเครื่องหมาย OAuth เพื่อให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ไม่ปฏิเสธ beta flag ที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีของคุณต้องการฟีเจอร์ beta เฉพาะ

  </Accordion>
</AccordionGroup>

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - คีย์การกำหนดค่าโมเดล
- [Model failover](/th/concepts/model-failover) - ลำดับ fallback และพฤติกรรม retry
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและ alias
- [ผู้ให้บริการ](/th/providers) - คู่มือการตั้งค่าแยกตามผู้ให้บริการ
