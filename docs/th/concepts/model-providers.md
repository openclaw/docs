---
read_when:
    - คุณต้องการคู่มืออ้างอิงการตั้งค่าโมเดลแบบแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่างไฟล์กำหนดค่าหรือคำสั่งเริ่มต้นใช้งาน CLI สำหรับผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่า + ขั้นตอนการใช้งาน CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-05-03T21:30:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2c94e8f0c8d70cd772990e4d9d41a5670855eef4aea5162e021f18d5ee6c899
    source_path: concepts/model-providers.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models)

## กฎแบบย่อ

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` ทำหน้าที่เป็นรายการอนุญาตเมื่อมีการตั้งค่า
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` จะแทนที่ค่าเหล่านั้นแยกตามโมเดล
    - กฎ fallback, การ probe ช่วง cooldown และการคงอยู่ของการ override ระดับเซสชัน: [การ failover ของโมเดล](/th/concepts/model-failover)

  </Accordion>
  <Accordion title="การเพิ่มการยืนยันตัวตนของผู้ให้บริการไม่เปลี่ยนโมเดลหลักของคุณ">
    `openclaw configure` จะคงค่า `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อคุณเพิ่มหรือยืนยันตัวตนผู้ให้บริการใหม่ Plugin ของผู้ให้บริการยังอาจส่งคืนโมเดลเริ่มต้นที่แนะนำในแพตช์คอนฟิกการยืนยันตัวตนได้ แต่ configure จะตีความสิ่งนั้นว่าเป็น "ทำให้โมเดลนี้พร้อมใช้งาน" เมื่อมีโมเดลหลักอยู่แล้ว ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน"

    หากต้องการสลับโมเดลเริ่มต้นโดยตั้งใจ ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`

  </Accordion>
  <Accordion title="การแยกผู้ให้บริการ/รันไทม์ของ OpenAI">
    เส้นทางตระกูล OpenAI แยกตาม prefix:

    - `openai/<model>` ร่วมกับ `agents.defaults.agentRuntime.id: "codex"` ใช้ harness ของ app-server Codex แบบ native นี่คือการตั้งค่าปกติสำหรับการสมัครสมาชิก ChatGPT/Codex
    - `openai-codex/<model>` ใช้ Codex OAuth ใน PI
    - `openai/<model>` ที่ไม่มีการ override รันไทม์ Codex ใช้ผู้ให้บริการ OpenAI แบบ API key โดยตรงใน PI

    ดู [OpenAI](/th/providers/openai) และ [Codex harness](/th/plugins/codex-harness) หากการแยกผู้ให้บริการ/รันไทม์ทำให้สับสน ให้อ่าน [รันไทม์ของ Agent](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้งาน Plugin อัตโนมัติใช้ขอบเขตเดียวกัน: `openai-codex/<model>` เป็นของ Plugin OpenAI ส่วน Plugin Codex จะเปิดใช้งานโดย `agentRuntime.id: "codex"` หรือการอ้างอิงแบบเดิม `codex/<model>`

    GPT-5.5 พร้อมใช้งานผ่าน harness ของ app-server Codex แบบ native เมื่อตั้งค่า `agentRuntime.id: "codex"` ผ่าน `openai-codex/gpt-5.5` ใน PI สำหรับ Codex OAuth และผ่าน `openai/gpt-5.5` ใน PI สำหรับทราฟฟิก API key โดยตรงเมื่อบัญชีของคุณเปิดให้ใช้งาน

  </Accordion>
  <Accordion title="รันไทม์ CLI">
    รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดลมาตรฐาน เช่น `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` แล้วตั้งค่า `agents.defaults.agentRuntime.id` เป็น `claude-cli`, `google-gemini-cli` หรือ `codex-cli` เมื่อต้องการ backend CLI ภายในเครื่อง

    การอ้างอิงแบบเดิม `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` จะ migrate กลับไปเป็นการอ้างอิงผู้ให้บริการมาตรฐานโดยบันทึกรันไทม์ไว้แยกต่างหาก

  </Accordion>
</AccordionGroup>

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน Plugin ของผู้ให้บริการ (`registerProvider(...)`) ในขณะที่ OpenClaw เก็บลูป inference ทั่วไปไว้ Plugin เป็นเจ้าของ onboarding, catalog โมเดล, การแมป env-var สำหรับการยืนยันตัวตน, การ normalize transport/config, การล้าง tool-schema, การจำแนก failover, การ refresh OAuth, การรายงานการใช้งาน, โปรไฟล์ thinking/reasoning และอื่นๆ

รายการ hook ของ provider-SDK และตัวอย่าง bundled-plugin ทั้งหมดอยู่ใน [Plugin ของผู้ให้บริการ](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ request executor แบบกำหนดเองทั้งหมดเป็นพื้นผิวส่วนขยายที่แยกต่างหากและลึกกว่า

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน hook ของผู้ให้บริการที่ชัดเจน เช่น replay policy, การ normalize tool-schema, stream wrapping และตัวช่วย transport/request ถุง static แบบเดิม `ProviderPlugin.capabilities` มีไว้เพื่อความเข้ากันได้เท่านั้น และตรรกะ runner ร่วมจะไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียน API key

<AccordionGroup>
  <Accordion title="แหล่งที่มาของ key และลำดับความสำคัญ">
    กำหนดค่าหลาย key ผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override สดรายการเดียว ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วย comma หรือ semicolon)
    - `<PROVIDER>_API_KEY` (key หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือก key จะรักษาลำดับความสำคัญและตัดค่าซ้ำออก

  </Accordion>
  <Accordion title="เมื่อการหมุนเวียนเริ่มทำงาน">
    - คำขอจะ retry ด้วย key ถัดไปเฉพาะเมื่อมีการตอบกลับแบบ rate-limit (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความ usage-limit เป็นระยะ)
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที และจะไม่พยายามหมุนเวียน key
    - เมื่อ key ผู้สมัครทั้งหมดล้มเหลว ข้อผิดพลาดสุดท้ายจะถูกส่งคืนจากความพยายามครั้งล่าสุด

  </Accordion>
</AccordionGroup>

## ผู้ให้บริการในตัว (catalog pi-ai)

OpenClaw มาพร้อม catalog pi‑ai ผู้ให้บริการเหล่านี้ไม่ต้องใช้คอนฟิก `models.providers` **ใดๆ** เพียงตั้งค่าการยืนยันตัวตนและเลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: `OPENAI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (override รายการเดียว)
- โมเดลตัวอย่าง: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือ API key บางรายการทำงานต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override แยกตามโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- การ warm-up WebSocket ของ OpenAI Responses เปิดใช้งานเป็นค่าเริ่มต้นผ่าน `params.openaiWsWarmup` (`true`/`false`)
- สามารถเปิดใช้การประมวลผลลำดับความสำคัญของ OpenAI ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะ map คำขอ Responses แบบ direct `openai/*` ไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อต้องการ tier แบบชัดเจนแทน toggle `/fast` ที่ใช้ร่วมกัน
- header แสดงที่มา OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบ native ไปยัง `api.openai.com` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- เส้นทาง OpenAI แบบ native ยังเก็บ Responses `store`, hint ของ prompt-cache และการปรับ payload ให้เข้ากันได้กับ reasoning ของ OpenAI; เส้นทาง proxy ไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` ถูกซ่อนไว้โดยตั้งใจใน OpenClaw เพราะคำขอ OpenAI API สดปฏิเสธโมเดลนี้ และ catalog Codex ปัจจุบันไม่เปิดเผยโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- การยืนยันตัวตน: `ANTHROPIC_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (override รายการเดียว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอสาธารณะ Anthropic โดยตรงรองรับ toggle `/fast` ที่ใช้ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย API key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw map สิ่งนั้นไปยัง Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- คอนฟิก Claude CLI ที่แนะนำจะเก็บการอ้างอิงโมเดลเป็นมาตรฐานและเลือก CLI
  backend แยกต่างหาก: `anthropic/claude-opus-4-7` พร้อม
  `agents.defaults.agentRuntime.id: "claude-cli"` การอ้างอิงแบบเดิม
  `claude-cli/claude-opus-4-7` ยังทำงานเพื่อความเข้ากันได้

<Note>
พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI กลับมาใช้และการใช้งาน `claude -p` ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ setup-token ของ Anthropic ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw แนะนำการนำ Claude CLI กลับมาใช้และ `claude -p` เมื่อพร้อมใช้งาน
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- การยืนยันตัวตน: OAuth (ChatGPT)
- การอ้างอิงโมเดล PI: `openai-codex/gpt-5.5`
- การอ้างอิง harness ของ app-server Codex แบบ native: `openai/gpt-5.5` พร้อม `agents.defaults.agentRuntime.id: "codex"`
- เอกสาร harness ของ app-server Codex แบบ native: [Codex harness](/th/plugins/codex-harness)
- การอ้างอิงโมเดลแบบเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` โหลด Plugin OpenAI; Plugin app-server Codex แบบ native จะถูกเลือกเฉพาะโดยรันไทม์ Codex harness หรือการอ้างอิงแบบเดิม `codex/*`
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override แยกตามโมเดล PI ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูก forward ด้วยในคำขอ Codex Responses แบบ native (`chatgpt.com/backend-api`)
- header แสดงที่มา OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`) จะแนบเฉพาะกับทราฟฟิก Codex แบบ native ไปยัง `chatgpt.com/backend-api` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- ใช้คอนฟิก toggle `/fast` และ `params.fastMode` เดียวกับ direct `openai/*`; OpenClaw map สิ่งนั้นไปยัง `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้ catalog Codex แบบ native `contextWindow = 400000` และรันไทม์เริ่มต้น `contextTokens = 272000`; override เพดานรันไทม์ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอก เช่น OpenClaw
- สำหรับเส้นทางทั่วไปแบบ subscription ร่วมกับรันไทม์ Codex แบบ native ให้ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex` แต่กำหนดค่า `openai/gpt-5.5` พร้อม `agents.defaults.agentRuntime.id: "codex"`
- ใช้ `openai-codex/gpt-5.5` เฉพาะเมื่อต้องการเส้นทาง Codex OAuth/subscription ผ่าน PI; ใช้ `openai/gpt-5.5` โดยไม่มีการ override รันไทม์ Codex เมื่อการตั้งค่า API key และ catalog ภายในเครื่องของคุณเปิดเผยเส้นทาง API สาธารณะ

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

### ตัวเลือก hosted แบบ subscription อื่นๆ

<CardGroup cols={3}>
  <Card title="โมเดล GLM" href="/th/providers/glm">
    Z.AI Coding Plan หรือ endpoint API ทั่วไป
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    MiniMax Coding Plan OAuth หรือการเข้าถึงด้วย API key
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    พื้นผิวผู้ให้บริการ Qwen Cloud พร้อมการแมป endpoint ของ Alibaba DashScope และ Coding Plan
  </Card>
</CardGroup>

### OpenCode

- การยืนยันตัวตน: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการรันไทม์ Zen: `opencode`
- ผู้ให้บริการรันไทม์ Go: `opencode-go`
- โมเดลตัวอย่าง: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ผู้ให้บริการ: `google`
- Auth: `GEMINI_API_KEY`
- การหมุนเวียนที่เป็นทางเลือก: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback ของ `GOOGLE_API_KEY` และ `OPENCLAW_LIVE_GEMINI_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: การกำหนดค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกทำให้เป็น `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` ได้รับการยอมรับและทำให้เป็น id Gemini API สดของ Google คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` ใช้การคิดแบบไดนามิกของ Google Gemini 3/3.1 ไม่ใส่ `thinkingLevel` แบบคงที่; Gemini 2.5 ส่ง `thinkingBudget: -1`
- การรัน Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อแฮนเดิล `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; การพบ cache ของ Gemini จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- Auth: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตนเอง

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานข้อจำกัดของบัญชี Google หลังจากใช้ไคลเอนต์ของบุคคลที่สาม ตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
</Warning>

Gemini CLI OAuth จัดส่งเป็นส่วนหนึ่งของ Plugin `google` ที่รวมมาให้

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

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่ต้อง** วาง client id หรือ secret ลงใน `openclaw.json` โฟลว์การเข้าสู่ระบบของ CLI จะเก็บโทเค็นไว้ใน auth profiles บนโฮสต์ Gateway

  </Step>
  <Step title="ตั้งค่าโปรเจกต์ (ถ้าจำเป็น)">
    หากคำขอล้มเหลวหลังจากเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

การตอบกลับ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; usage จะ fallback ไปที่ `stats` โดย `stats.cached` จะถูกทำให้เป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- Auth: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` และ `z-ai/*` จะถูกทำให้เป็น `zai/*`
  - `zai-api-key` ตรวจจับ endpoint ของ Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` บังคับใช้พื้นผิวที่ระบุ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ผู้ให้บริการ: `kilocode`
- Auth: `KILOCODE_API_KEY`
- โมเดลตัวอย่าง: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- แค็ตตาล็อก fallback แบบคงที่จัดส่ง `kilocode/kilo/auto`; การค้นพบแบบสดที่ `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อก runtime เพิ่มเติมได้
- การกำหนดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้ hard-code ใน OpenClaw

ดูรายละเอียดการตั้งค่าที่ [/providers/kilocode](/th/providers/kilocode)

### Plugin ผู้ให้บริการอื่นที่รวมมาให้

| ผู้ให้บริการ            | Id                               | env สำหรับ Auth                                             | โมเดลตัวอย่าง                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
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
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### ลักษณะเฉพาะที่ควรรู้

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้เฮดเดอร์ระบุแอปของตนและมาร์กเกอร์ Anthropic `cache_control` เฉพาะบนเส้นทาง `openrouter.ai` ที่ตรวจสอบแล้วเท่านั้น refs ของ DeepSeek, Moonshot และ ZAI มีสิทธิ์ใช้ cache-TTL สำหรับการแคชพรอมป์ที่ OpenRouter จัดการ แต่ไม่ได้รับมาร์กเกอร์แคชของ Anthropic ในฐานะเส้นทางสไตล์พร็อกซีที่เข้ากันได้กับ OpenAI จึงข้ามการปรับรูปแบบที่มีเฉพาะ native-OpenAI (`serviceTier`, Responses `store`, คำใบ้ prompt-cache, OpenAI reasoning-compat) refs ที่ใช้ Gemini เป็นแบ็กเอนด์จะคงไว้เฉพาะการล้างข้อมูลลายเซ็นความคิดแบบ proxy-Gemini เท่านั้น
  </Accordion>
  <Accordion title="Kilo Gateway">
    refs ที่ใช้ Gemini เป็นแบ็กเอนด์จะใช้เส้นทางล้างข้อมูลแบบ proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และ refs อื่นที่พร็อกซีไม่รองรับการให้เหตุผลจะข้ามการฉีดการให้เหตุผลของพร็อกซี
  </Accordion>
  <Accordion title="MiniMax">
    การเริ่มใช้งานด้วย API-key จะเขียนคำจำกัดความโมเดลแชท M2.7 แบบข้อความเท่านั้นอย่างชัดเจน; การทำความเข้าใจภาพยังคงอยู่บนผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    ID โมเดลใช้เนมสเปซ `nvidia/<vendor>/<model>` (เช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกจะรักษาองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษรไว้ ขณะที่คีย์มาตรฐานที่ส่งไปยัง API ยังคงมีคำนำหน้าเดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง xAI Responses `grok-4.3` เป็นโมเดลแชทเริ่มต้นที่รวมมาให้ `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` ของแต่ละตัว `tool_stream` เปิดเป็นค่าเริ่มต้น; ปิดได้ผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
  <Accordion title="Cerebras">
    จัดส่งเป็น Plugin ผู้ให้บริการ `cerebras` ที่รวมมาให้ GLM ใช้ `zai-glm-4.7`; base URL ที่เข้ากันได้กับ OpenAI คือ `https://api.cerebras.ai/v1`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (URL แบบกำหนดเอง/base URL)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **แบบกำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่รวมมาให้จำนวนมากด้านล่างเผยแพร่แคตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` ที่ระบุอย่างชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ base URL เริ่มต้น, เฮดเดอร์ หรือรายการโมเดล

การตรวจสอบความสามารถของโมเดลใน Gateway ยังอ่านเมทาดาทา `models.providers.<id>.models[]` ที่ระบุไว้อย่างชัดเจนด้วย หากโมเดลแบบกำหนดเองหรือพร็อกซียอมรับรูปภาพ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้เส้นทางไฟล์แนบจาก WebChat และต้นทาง Node ส่งรูปภาพเป็นอินพุตโมเดลดั้งเดิม แทนที่จะเป็น refs สื่อแบบข้อความเท่านั้น

### Moonshot AI (Kimi)

Moonshot จัดส่งเป็น Plugin ผู้ให้บริการที่รวมมาให้ ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` อย่างชัดเจนเฉพาะเมื่อคุณต้องแทนที่ base URL หรือเมทาดาทาโมเดล:

- ผู้ให้บริการ: `moonshot`
- การยืนยันตัวตน: `MOONSHOT_API_KEY`
- โมเดลตัวอย่าง: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

ID โมเดล Kimi K2:

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

รหัสโมเดลเดิม `kimi/k2p5` ยังคงถูกยอมรับเป็นรหัสโมเดลสำหรับความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่น ๆ ในจีน

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

การเริ่มต้นใช้งานจะใช้พื้นผิวการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลสำหรับการเริ่มต้นใช้งาน/กำหนดค่า ตัวเลือกการยืนยันตัวตนของ Volcengine จะให้ความสำคัญกับแถวทั้ง `volcengine/*` และ `volcengine-plan/*` หากยังไม่ได้โหลดโมเดลเหล่านั้น OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการแบบว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="โมเดลสำหรับการเขียนโค้ด (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (นานาชาติ)

BytePlus ARK ให้การเข้าถึงโมเดลเดียวกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

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

การเริ่มต้นใช้งานจะใช้พื้นผิวการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `byteplus/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลสำหรับการเริ่มต้นใช้งาน/กำหนดค่า ตัวเลือกการยืนยันตัวตนของ BytePlus จะให้ความสำคัญกับแถวทั้ง `byteplus/*` และ `byteplus-plan/*` หากยังไม่ได้โหลดโมเดลเหล่านั้น OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการแบบว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="โมเดลสำหรับการเขียนโค้ด (byteplus-plan)">
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

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้ปลายทางแบบกำหนดเอง:

- MiniMax OAuth (ทั่วโลก): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- คีย์ API ของ MiniMax (ทั่วโลก): `--auth-choice minimax-global-api`
- คีย์ API ของ MiniMax (CN): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดูรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่างการกำหนดค่าได้ที่ [/providers/minimax](/th/providers/minimax)

<Note>
บนเส้นทางการสตรีมที่เข้ากันได้กับ Anthropic ของ MiniMax OpenClaw จะปิดการคิดเป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าอย่างชัดเจน และ `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแยกความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังคงอยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การเข้าใจภาพคือ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนเส้นทางการยืนยันตัวตนของ MiniMax ทั้งสองเส้นทาง
- การค้นหาเว็บยังคงอยู่บนรหัสผู้ให้บริการ `minimax`

### LM Studio

LM Studio จัดส่งเป็น Plugin ผู้ให้บริการแบบรวมมาด้วย ซึ่งใช้ API ดั้งเดิม:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- URL ฐานการอนุมานเริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งคืนโดย `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` ดั้งเดิมของ LM Studio สำหรับการค้นหาและการโหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานเป็นค่าเริ่มต้น หากคุณต้องการให้การโหลดแบบ JIT, TTL และการไล่ออกอัตโนมัติของ LM Studio เป็นเจ้าของวงจรชีวิตของโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดูการตั้งค่าและการแก้ปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama จัดส่งเป็น Plugin ผู้ให้บริการแบบรวมมาด้วย และใช้ API ดั้งเดิมของ Ollama:

- ผู้ให้บริการ: `ollama`
- การยืนยันตัวตน: ไม่จำเป็น (เซิร์ฟเวอร์ภายในเครื่อง)
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

Ollama จะถูกตรวจพบภายในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการแบบรวมมาด้วยจะเพิ่ม Ollama ลงใน `openclaw onboard` และตัวเลือกโมเดลโดยตรง ดูการเริ่มต้นใช้งาน โหมดคลาวด์/ภายในเครื่อง และการกำหนดค่าแบบกำหนดเองได้ที่ [/providers/ollama](/th/providers/ollama)

### vLLM

vLLM จัดส่งเป็น Plugin ผู้ให้บริการแบบรวมมาด้วยสำหรับเซิร์ฟเวอร์ภายในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติภายในเครื่อง (ค่าใดก็ได้ใช้ได้ หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งคืนโดย `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/vllm](/th/providers/vllm)

### SGLang

SGLang จัดส่งเป็น Plugin ผู้ให้บริการแบบรวมมาด้วยสำหรับเซิร์ฟเวอร์โฮสต์เองที่เข้ากันได้กับ OpenAI และทำงานรวดเร็ว:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติภายในเครื่อง (ค่าใดก็ได้ใช้ได้ หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งคืนโดย `/v1/models`):

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
  <Accordion title="ฟิลด์ไม่บังคับเริ่มต้น">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์ไม่บังคับ เมื่อไม่ระบุ OpenClaw จะใช้ค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าที่ชัดเจนให้ตรงกับข้อจำกัดของพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="กฎการปรับรูปแบบเส้นทางพร็อกซี">
    - สำหรับ `api: "openai-completions"` บนปลายทางที่ไม่ใช่แบบดั้งเดิม (มี `baseUrl` ที่ไม่ว่างและโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI จะข้ามการปรับรูปแบบคำขอที่มีเฉพาะ OpenAI ดั้งเดิมด้วย: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้ prompt-cache, ไม่มีการปรับรูปแบบเพย์โหลดความเข้ากันได้ของ reasoning ของ OpenAI และไม่มีส่วนหัวระบุที่มาของ OpenClaw แบบซ่อน
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องการฟิลด์เฉพาะผู้ขาย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อรวม JSON เพิ่มเติมเข้าไปในเนื้อหาคำขอขาออก
    - สำหรับการควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM แบบรวมมาด้วยจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับการคิดของเซสชันปิดอยู่
    - สำหรับโมเดลภายในเครื่องที่ช้าหรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` ค่านี้จะขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึงการเชื่อมต่อ ส่วนหัว การสตรีมเนื้อหา และการยกเลิก guarded-fetch ทั้งหมด โดยไม่เพิ่ม timeout ของรันไทม์เอเจนต์ทั้งหมด
    - การเรียก HTTP ของผู้ให้บริการโมเดลอนุญาตให้คำตอบ DNS แบบ fake-IP ของ Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์ `baseUrl` ของผู้ให้บริการที่กำหนดค่าไว้เท่านั้น ปลายทาง private, loopback, link-local และ metadata อื่น ๆ ยังคงต้องเลือกใช้ `models.providers.<id>.request.allowPrivateNetwork: true` อย่างชัดเจน
    - หาก `baseUrl` ว่าง/ไม่ได้ระบุ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่ง resolve ไปยัง `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ระบุชัดเจนยังคงถูกแทนที่บนปลายทาง `openai-completions` ที่ไม่ใช่แบบดั้งเดิม
    - สำหรับ `api: "anthropic-messages"` บนปลายทางที่ไม่ใช่แบบตรง (ผู้ให้บริการใดก็ตามที่ไม่ใช่ `anthropic` ตามแบบแผน หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่โฮสต์ไม่ใช่ปลายทาง `api.anthropic.com` สาธารณะ) OpenClaw จะระงับส่วนหัว Anthropic beta แบบนัย เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และเครื่องหมาย OAuth เพื่อให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ไม่ปฏิเสธแฟล็ก beta ที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจน หากพร็อกซีของคุณต้องการฟีเจอร์ beta เฉพาะ

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

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์การกำหนดค่าโมเดล
- [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover) — เชนสำรองและพฤติกรรมการลองใหม่
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและนามแฝง
- [ผู้ให้บริการ](/th/providers) — คู่มือการตั้งค่ารายผู้ให้บริการ
