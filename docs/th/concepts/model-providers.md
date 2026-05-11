---
read_when:
    - คุณต้องมีเอกสารอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่างการกำหนดค่าหรือคำสั่งเริ่มต้นใช้งาน CLI สำหรับผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมคอนฟิกตัวอย่าง + โฟลว์ CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-05-11T20:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

เอกสารอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models)

## กฎแบบย่อ

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` ทำหน้าที่เป็น allowlist เมื่อตั้งค่าไว้
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` เขียนทับค่าต่อโมเดล
    - กฎ fallback, การ probe cooldown และการคงอยู่ของ session override: [Model failover](/th/concepts/model-failover)

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` จะคง `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อคุณเพิ่มหรือยืนยันตัวตนผู้ให้บริการใหม่ `openclaw models auth login` ก็ทำแบบเดียวกัน เว้นแต่คุณจะส่ง `--set-default` Plugin ผู้ให้บริการยังอาจส่งคืนโมเดลเริ่มต้นที่แนะนำในแพตช์ config การยืนยันตัวตนของตนได้ แต่ OpenClaw จะตีความว่าเป็น "ทำให้โมเดลนี้พร้อมใช้งาน" เมื่อมีโมเดลหลักอยู่แล้ว ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน"

    หากต้องการเปลี่ยนโมเดลเริ่มต้นโดยตั้งใจ ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    เส้นทางตระกูล OpenAI เจาะจงตาม prefix:

    - `openai/<model>` ใช้ harness app-server ของ Codex แบบ native สำหรับรอบของ agent ตามค่าเริ่มต้น นี่คือการตั้งค่าทั่วไปสำหรับการสมัครสมาชิก ChatGPT/Codex
    - `openai-codex/<model>` เป็น config legacy ที่ doctor เขียนใหม่เป็น `openai/<model>`
    - `openai/<model>` พร้อม provider/model `agentRuntime.id: "pi"` ใช้ PI สำหรับเส้นทาง API key แบบชัดเจนหรือเส้นทางความเข้ากันได้

    ดู [OpenAI](/th/providers/openai) และ [Codex harness](/th/plugins/codex-harness) หากการแยก provider/runtime ทำให้สับสน ให้อ่าน [Agent runtimes](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้ Plugin อัตโนมัติทำตามขอบเขตเดียวกัน: การอ้างอิง agent แบบ `openai/*` เปิดใช้ Plugin Codex สำหรับเส้นทางเริ่มต้น และ provider/model `agentRuntime.id: "codex"` แบบชัดเจนหรือการอ้างอิง legacy แบบ `codex/<model>` ก็ต้องใช้เช่นกัน

    GPT-5.5 พร้อมใช้งานผ่าน harness app-server ของ Codex แบบ native ตามค่าเริ่มต้นบน `openai/gpt-5.5` และผ่าน PI เฉพาะเมื่อ policy runtime ของ provider/model เลือก `pi` อย่างชัดเจนเท่านั้น

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI runtimes ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดล canonical เช่น `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` จากนั้นตั้ง policy runtime ของ provider/model เป็น `claude-cli`, `google-gemini-cli` หรือ `codex-cli` เมื่อต้องการ backend CLI ในเครื่อง

    การอ้างอิง legacy แบบ `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` จะ migrate กลับไปเป็นการอ้างอิงผู้ให้บริการ canonical โดยบันทึก runtime แยกไว้

  </Accordion>
</AccordionGroup>

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน Plugin ผู้ให้บริการ (`registerProvider(...)`) ขณะที่ OpenClaw เก็บ loop inference ทั่วไปไว้ Plugin เป็นเจ้าของ onboarding, catalog โมเดล, การแมป env var สำหรับ auth, การปรับ transport/config ให้เป็นมาตรฐาน, การทำความสะอาด tool schema, การจัดประเภท failover, การ refresh OAuth, การรายงาน usage, โปรไฟล์ thinking/reasoning และอื่นๆ

รายการ hook ของ provider-SDK และตัวอย่าง bundled Plugin แบบครบถ้วนอยู่ใน [Provider plugins](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ request executor แบบ custom ทั้งหมดเป็น extension surface ที่แยกต่างหากและลึกกว่า

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน hook ผู้ให้บริการแบบชัดเจน เช่น replay policy, การ normalize tool schema, การ wrap stream และตัวช่วย transport/request ถุง static legacy `ProviderPlugin.capabilities` มีไว้เพื่อความเข้ากันได้เท่านั้น และ shared runner logic ไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียน API key

<AccordionGroup>
  <Accordion title="Key sources and priority">
    กำหนดค่าหลาย key ได้ผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override แบบ live เดี่ยว ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วย comma หรือ semicolon)
    - `<PROVIDER>_API_KEY` (key หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือก key จะรักษาลำดับความสำคัญและ deduplicate ค่า

  </Accordion>
  <Accordion title="When rotation kicks in">
    - คำขอจะถูกลองใหม่ด้วย key ถัดไปเฉพาะเมื่อได้รับการตอบกลับ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความ usage-limit เป็นระยะ)
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะ fail ทันที; จะไม่พยายามหมุนเวียน key
    - เมื่อ key ผู้สมัครทั้งหมด fail ข้อผิดพลาดสุดท้ายจะถูกส่งคืนจากความพยายามครั้งสุดท้าย

  </Accordion>
</AccordionGroup>

## ผู้ให้บริการในตัว (catalog pi-ai)

OpenClaw มาพร้อมกับ catalog pi-ai ผู้ให้บริการเหล่านี้ไม่ต้องใช้ config `models.providers` **เลย**; เพียงตั้งค่า auth + เลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- Auth: `OPENAI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หาก install หรือ API key เฉพาะทำงานต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto`; OpenClaw ส่งตัวเลือก transport ให้ pi-ai
- override ต่อโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- เปิดใช้ OpenAI priority processing ได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` แมปคำขอ Responses แบบ direct `openai/*` เป็น `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อต้องการ tier แบบชัดเจนแทน toggle `/fast` ที่ใช้ร่วมกัน
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบ native ไปยัง `api.openai.com` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- เส้นทาง OpenAI แบบ native ยังคงเก็บ Responses `store`, hint ของ prompt cache และการปรับ payload reasoning-compat ของ OpenAI; เส้นทาง proxy ไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` ถูก suppress ใน OpenClaw โดยตั้งใจ เพราะคำขอ OpenAI API แบบ live ปฏิเสธโมเดลนี้ และ catalog Codex ปัจจุบันไม่ expose โมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic public แบบ direct รองรับ toggle `/fast` ที่ใช้ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิกที่ authenticated ด้วย API key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw แมปสิ่งนั้นเป็น Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- config Claude CLI ที่แนะนำจะเก็บการอ้างอิงโมเดลเป็น canonical และเลือก CLI
  backend แยกต่างหาก: `anthropic/claude-opus-4-7` พร้อม
  `agentRuntime.id: "claude-cli"` ที่ scoped ตามโมเดล การอ้างอิง legacy
  `claude-cli/claude-opus-4-7` ยังคงทำงานเพื่อความเข้ากันได้

<Note>
เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการ reuse Claude CLI และการใช้งาน `claude -p` ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่ policy ใหม่ Anthropic setup-token ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw เลือกใช้การ reuse Claude CLI และ `claude -p` ก่อนเมื่อพร้อมใช้งาน
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- Auth: OAuth (ChatGPT)
- การอ้างอิงโมเดล PI legacy: `openai-codex/gpt-5.5`
- การอ้างอิง harness app-server ของ Codex แบบ native: `openai/gpt-5.5`
- เอกสาร harness app-server ของ Codex แบบ native: [Codex harness](/th/plugins/codex-harness)
- การอ้างอิงโมเดล legacy: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` โหลด Plugin OpenAI; Plugin app-server ของ Codex แบบ native จะถูกเลือกเฉพาะโดย runtime Codex harness หรือการอ้างอิง legacy แบบ `codex/*`
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override ต่อโมเดล PI ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูก forward บนคำขอ Codex Responses แบบ native ด้วย (`chatgpt.com/backend-api`)
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) จะถูกแนบเฉพาะกับทราฟฟิก Codex แบบ native ไปยัง `chatgpt.com/backend-api` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- ใช้ toggle `/fast` และ config `params.fastMode` เดียวกับ direct `openai/*`; OpenClaw แมปสิ่งนั้นเป็น `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้ Codex catalog native `contextWindow = 400000` และ runtime เริ่มต้น `contextTokens = 272000`; override cap ของ runtime ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุ policy: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/workflow ภายนอกอย่าง OpenClaw
- สำหรับเส้นทางทั่วไปแบบ subscription พร้อม runtime Codex แบบ native ให้ลงชื่อเข้าใช้ด้วย auth `openai-codex` แต่กำหนดค่า `openai/gpt-5.5`; รอบของ OpenAI agent จะเลือก Codex ตามค่าเริ่มต้น
- ใช้ provider/model `agentRuntime.id: "pi"` เฉพาะเมื่อต้องการเส้นทางความเข้ากันได้ผ่าน PI; มิฉะนั้นให้คง `openai/gpt-5.5` ไว้บน Codex harness เริ่มต้น
- การอ้างอิง `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` และ `openai-codex/gpt-5.3*` ที่เก่ากว่าจะถูก suppress เพราะบัญชี ChatGPT/Codex OAuth ปฏิเสธโมเดลเหล่านั้น; ใช้ `openai-codex/gpt-5.5` หรือเส้นทาง runtime Codex แบบ native แทน

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
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

### ตัวเลือก hosted แบบ subscription อื่นๆ

<CardGroup cols={3}>
  <Card title="GLM models" href="/th/providers/glm">
    แผน Z.AI Coding หรือ endpoint API ทั่วไป
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    OAuth ของ MiniMax Coding Plan หรือการเข้าถึงด้วย API key
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    surface ผู้ให้บริการ Qwen Cloud พร้อมการแมป endpoint ของ Alibaba DashScope และ Coding Plan
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
- การหมุนเวียนคีย์แบบไม่บังคับ: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` fallback และ `OPENCLAW_LIVE_GEMINI_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: การกำหนดค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกทำให้เป็นรูปแบบปกติเป็น `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` ได้รับการยอมรับและถูกทำให้เป็นรูปแบบปกติเป็นรหัส Gemini API สดของ Google คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การคิด: `/think adaptive` ใช้การคิดแบบไดนามิกของ Google Gemini 3/3.1 จะละเว้น `thinkingLevel` แบบคงที่; Gemini 2.5 ส่ง `thinkingBudget: -1`
- การรัน Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อ handle `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; การเข้าถึงแคชของ Gemini จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตัวเอง

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานว่าบัญชี Google ถูกจำกัดหลังใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
</Warning>

Gemini CLI OAuth ถูกจัดส่งเป็นส่วนหนึ่งของ Plugin `google` ที่บันเดิลมา

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

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่ต้อง** วาง client id หรือ secret ลงใน `openclaw.json` โฟลว์การเข้าสู่ระบบของ CLI จะเก็บโทเค็นไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway

  </Step>
  <Step title="ตั้งค่าโปรเจกต์ (หากจำเป็น)">
    หากคำขอล้มเหลวหลังเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

คำตอบ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; ข้อมูลการใช้งานจะ fallback ไปที่ `stats` โดย `stats.cached` จะถูกทำให้เป็นรูปแบบปกติเป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` และ `z-ai/*` จะถูกทำให้เป็นรูปแบบปกติเป็น `zai/*`
  - `zai-api-key` ตรวจจับ endpoint ของ Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` จะบังคับใช้พื้นผิวเฉพาะ

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
- แค็ตตาล็อก fallback แบบคงที่จัดส่ง `kilocode/kilo/auto`; การค้นพบสดที่ `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อกรันไทม์เพิ่มเติมได้
- การกำหนดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้ hard-code ไว้ใน OpenClaw

ดูรายละเอียดการตั้งค่าที่ [/providers/kilocode](/th/providers/kilocode)

### Plugin ผู้ให้บริการอื่นๆ ที่บันเดิลมา

| ผู้ให้บริการ                | รหัส                               | ตัวแปรแวดล้อมสำหรับการรับรองความถูกต้อง                                                     | โมเดลตัวอย่าง                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` หรือ `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
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

#### ข้อควรรู้เฉพาะทาง

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้ส่วนหัวการระบุแอปของตัวเองและมาร์กเกอร์ Anthropic `cache_control` เฉพาะบนเส้นทาง `openrouter.ai` ที่ผ่านการยืนยันแล้วเท่านั้น refs ของ DeepSeek, Moonshot และ ZAI มีสิทธิ์ใช้ cache-TTL สำหรับการแคชพรอมป์ที่ OpenRouter จัดการ แต่จะไม่ได้รับมาร์กเกอร์แคชของ Anthropic ในฐานะเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI จึงข้ามการปรับรูปแบบที่มีเฉพาะ OpenAI แบบเนทีฟ (`serviceTier`, Responses `store`, คำใบ้ prompt-cache, ความเข้ากันได้ของการให้เหตุผล OpenAI) refs ที่อิง Gemini จะคงไว้เฉพาะการทำความสะอาด thought-signature ของ proxy-Gemini เท่านั้น
  </Accordion>
  <Accordion title="Kilo Gateway">
    refs ที่อิง Gemini ใช้เส้นทางการทำความสะอาด proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และ refs อื่นที่ไม่รองรับการให้เหตุผลผ่านพร็อกซีจะข้ามการฉีดการให้เหตุผลของพร็อกซี
  </Accordion>
  <Accordion title="MiniMax">
    การเริ่มต้นใช้งานด้วยคีย์ API จะเขียนคำนิยามโมเดลแชต M2.7 แบบข้อความเท่านั้นอย่างชัดเจน; ความเข้าใจรูปภาพยังคงอยู่บนผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    รหัสโมเดลใช้เนมสเปซ `nvidia/<vendor>/<model>` (เช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกโมเดลจะคงองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษรไว้ ขณะที่คีย์มาตรฐานที่ส่งไปยัง API ยังคงมีคำนำหน้าเพียงครั้งเดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง xAI Responses `grok-4.3` เป็นโมเดลแชตเริ่มต้นที่รวมมาให้ `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` ของแต่ละรายการ `tool_stream` เปิดเป็นค่าเริ่มต้น; ปิดได้ผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
  <Accordion title="Cerebras">
    จัดส่งในฐานะ Plugin ผู้ให้บริการ `cerebras` ที่รวมมาให้ GLM ใช้ `zai-glm-4.7`; base URL ที่เข้ากันได้กับ OpenAI คือ `https://api.cerebras.ai/v1`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (URL แบบกำหนดเอง/base URL)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **แบบกำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่รวมมาให้จำนวนมากด้านล่างเผยแพร่แคตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ base URL, ส่วนหัว หรือรายการโมเดลเริ่มต้นเท่านั้น

การตรวจสอบความสามารถของโมเดลใน Gateway จะอ่านเมตาดาต้า `models.providers.<id>.models[]` แบบชัดเจนด้วย หากโมเดลแบบกำหนดเองหรือพร็อกซียอมรับรูปภาพ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้เส้นทางไฟล์แนบจาก WebChat และต้นทางโหนดส่งรูปภาพเป็นอินพุตโมเดลแบบเนทีฟแทน refs สื่อแบบข้อความเท่านั้น

`agents.defaults.models["provider/model"]` ควบคุมเฉพาะการมองเห็นโมเดล นามแฝง และเมตาดาต้ารายโมเดลสำหรับเอเจนต์เท่านั้น โดยตัวมันเองไม่ได้ลงทะเบียนโมเดลรันไทม์ใหม่ สำหรับโมเดลผู้ให้บริการแบบกำหนดเอง ให้เพิ่ม `models.providers.<provider>.models[]` พร้อม `id` ที่ตรงกันอย่างน้อยด้วย

### Moonshot AI (Kimi)

Moonshot จัดส่งในฐานะ Plugin ผู้ให้บริการที่รวมมาให้ ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ base URL หรือเมตาดาต้าของโมเดล:

- ผู้ให้บริการ: `moonshot`
- การรับรองความถูกต้อง: `MOONSHOT_API_KEY`
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

### การเขียนโค้ดด้วย Kimi

Kimi Coding ใช้ endpoint ที่เข้ากันได้กับ Anthropic ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- การยืนยันตัวตน: `KIMI_API_KEY`
- โมเดลตัวอย่าง: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

`kimi/kimi-code` และ `kimi/k2p5` รุ่นเดิมยังคงยอมรับเป็นรหัสโมเดลเพื่อความเข้ากันได้ และจะ normalize เป็นรหัสโมเดล API แบบเสถียรของ Kimi

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่นๆ ในประเทศจีน

- ผู้ให้บริการ: `volcengine` (การเขียนโค้ด: `volcengine-plan`)
- การยืนยันตัวตน: `VOLCANO_ENGINE_API_KEY`
- โมเดลตัวอย่าง: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

การเริ่มต้นใช้งานจะใช้ส่วนสำหรับการเขียนโค้ดเป็นค่าเริ่มต้น แต่แคตตาล็อกทั่วไป `volcengine/*` จะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตน Volcengine จะเลือกแถวทั้ง `volcengine/*` และ `volcengine-plan/*` เป็นลำดับแรก หากยังไม่ได้โหลดโมเดลเหล่านั้น OpenClaw จะย้อนกลับไปใช้แคตตาล็อกที่ไม่ได้กรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการซึ่งว่างเปล่า

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

BytePlus ARK ให้การเข้าถึงโมเดลเดียวกันกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

- ผู้ให้บริการ: `byteplus` (การเขียนโค้ด: `byteplus-plan`)
- การยืนยันตัวตน: `BYTEPLUS_API_KEY`
- โมเดลตัวอย่าง: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

การเริ่มต้นใช้งานจะใช้ส่วนสำหรับการเขียนโค้ดเป็นค่าเริ่มต้น แต่แคตตาล็อกทั่วไป `byteplus/*` จะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตน BytePlus จะเลือกแถวทั้ง `byteplus/*` และ `byteplus-plan/*` เป็นลำดับแรก หากยังไม่ได้โหลดโมเดลเหล่านั้น OpenClaw จะย้อนกลับไปใช้แคตตาล็อกที่ไม่ได้กรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการซึ่งว่างเปล่า

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

Synthetic ให้โมเดลที่เข้ากันได้กับ Anthropic ภายใต้ผู้ให้บริการ `synthetic`:

- ผู้ให้บริการ: `synthetic`
- การยืนยันตัวตน: `SYNTHETIC_API_KEY`
- โมเดลตัวอย่าง: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

ดูรายละเอียดการตั้งค่า ตัวเลือกโมเดล และ snippet การกำหนดค่าได้ที่ [/providers/minimax](/th/providers/minimax)

<Note>
บนเส้นทาง streaming ที่เข้ากันได้กับ Anthropic ของ MiniMax นั้น OpenClaw จะปิดการคิดเป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าไว้อย่างชัดเจน และ `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแยกความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังอยู่บน `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- ความเข้าใจภาพเป็น `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนเส้นทางการยืนยันตัวตน MiniMax ทั้งสองเส้นทาง
- การค้นหาเว็บยังอยู่บนรหัสผู้ให้บริการ `minimax`

### LM Studio

LM Studio มาพร้อมเป็น Plugin ผู้ให้บริการแบบ bundled ซึ่งใช้ API แบบ native:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- URL ฐานสำหรับ inference เริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งกลับโดย `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบ native ของ LM Studio สำหรับการค้นหา + การโหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับ inference เป็นค่าเริ่มต้น หากคุณต้องการให้การโหลด JIT, TTL และ auto-evict ของ LM Studio เป็นเจ้าของวงจรชีวิตโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดูการตั้งค่าและการแก้ไขปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama มาพร้อมเป็น Plugin ผู้ให้บริการแบบ bundled และใช้ API แบบ native ของ Ollama:

- ผู้ให้บริการ: `ollama`
- การยืนยันตัวตน: ไม่ต้องใช้ (เซิร์ฟเวอร์ภายในเครื่อง)
- โมเดลตัวอย่าง: `ollama/llama3.3`
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

Ollama จะถูกตรวจพบในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการแบบ bundled จะเพิ่ม Ollama เข้าใน `openclaw onboard` และตัวเลือกโมเดลโดยตรง ดูการเริ่มต้นใช้งาน โหมด cloud/local และการกำหนดค่าแบบกำหนดเองได้ที่ [/providers/ollama](/th/providers/ollama)

### vLLM

vLLM มาพร้อมเป็น Plugin ผู้ให้บริการแบบ bundled สำหรับเซิร์ฟเวอร์ภายในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับการยืนยันตัวตน):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งกลับโดย `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/vllm](/th/providers/vllm)

### SGLang

SGLang มาพร้อมเป็น Plugin ผู้ให้บริการแบบ bundled สำหรับเซิร์ฟเวอร์ที่โฮสต์เองแบบรวดเร็วซึ่งเข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับการยืนยันตัวตน):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งกลับโดย `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/sglang](/th/providers/sglang)

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
  <Accordion title="Default optional fields">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นค่าที่ไม่บังคับ เมื่อละไว้ OpenClaw จะใช้ค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าที่ชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - สำหรับ `api: "openai-completions"` บน endpoint ที่ไม่ใช่ native (ทุก `baseUrl` ที่ไม่ว่างซึ่ง host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซีจะข้ามการปรับรูปแบบคำขอเฉพาะ OpenAI native ด้วย: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้ prompt-cache, ไม่มีการปรับรูปแบบ payload reasoning-compat ของ OpenAI และไม่มีส่วนหัว attribution ของ OpenClaw ที่ซ่อนอยู่
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องการฟิลด์เฉพาะผู้ขาย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อรวม JSON เพิ่มเติมเข้าใน body ของคำขอขาออก
    - สำหรับการควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM แบบ bundled จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับการคิดของเซสชันปิดอยู่
    - สำหรับโมเดลภายในเครื่องที่ช้าหรือ host LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` ค่านี้จะขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ ซึ่งรวมถึงการเชื่อมต่อ ส่วนหัว การ streaming body และการยกเลิก guarded-fetch โดยรวม โดยไม่เพิ่ม timeout ของ runtime เอเจนต์ทั้งหมด
    - การเรียก HTTP ของผู้ให้บริการโมเดลอนุญาตคำตอบ DNS แบบ fake-IP ของ Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อ host ของ `baseUrl` ผู้ให้บริการที่กำหนดค่าไว้เท่านั้น ปลายทาง private, loopback, link-local และ metadata อื่นๆ ยังคงต้องเลือกใช้อย่างชัดเจนด้วย `models.providers.<id>.request.allowPrivateNetwork: true`
    - หาก `baseUrl` ว่าง/ถูกละไว้ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่ง resolve ไปที่ `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ตั้งไว้อย่างชัดเจนยังคงถูก override บน endpoint `openai-completions` ที่ไม่ใช่ native
    - สำหรับ `api: "anthropic-messages"` บน endpoint ที่ไม่ใช่ direct (ผู้ให้บริการใดๆ ที่ไม่ใช่ `anthropic` แบบ canonical หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่ host ไม่ใช่ endpoint สาธารณะ `api.anthropic.com`) OpenClaw จะระงับส่วนหัว Anthropic beta โดยนัย เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และเครื่องหมาย OAuth เพื่อให้พร็อกซีที่เข้ากันได้กับ Anthropic แบบกำหนดเองไม่ปฏิเสธ beta flag ที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีของคุณต้องการฟีเจอร์ beta เฉพาะ

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

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - คีย์การกำหนดค่าโมเดล
- [Model failover](/th/concepts/model-failover) - เชน fallback และพฤติกรรมการลองใหม่
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและ alias
- [ผู้ให้บริการ](/th/providers) - คู่มือการตั้งค่าแยกตามผู้ให้บริการ
