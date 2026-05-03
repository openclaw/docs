---
read_when:
    - คุณต้องมีเอกสารอ้างอิงการตั้งค่าโมเดลแบบแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่างคอนฟิกหรือคำสั่งเริ่มต้นใช้งานผ่าน CLI สำหรับผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่า + ขั้นตอนการใช้งาน CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-05-03T10:10:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfb12090228ec89bc116558fe3e0bf9977c750550ef8efbf55b1af6c873c9825
    source_path: concepts/model-providers.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับ**ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models).

## กฎอย่างย่อ

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` ทำหน้าที่เป็น allowlist เมื่อตั้งค่าไว้.
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` จะแทนที่ค่าเหล่านั้นต่อโมเดล.
    - กฎ fallback, การตรวจสอบ cooldown และการคงอยู่ของการ override เซสชัน: [การ failover ของโมเดล](/th/concepts/model-failover).

  </Accordion>
  <Accordion title="การเพิ่มการยืนยันตัวตนของผู้ให้บริการไม่เปลี่ยนโมเดลหลักของคุณ">
    `openclaw configure` จะรักษา `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อคุณเพิ่มหรือยืนยันตัวตนผู้ให้บริการอีกครั้ง Plugin ผู้ให้บริการอาจยังคงส่งคืนโมเดลเริ่มต้นที่แนะนำในแพตช์ config การยืนยันตัวตน แต่ configure จะตีความว่าเป็น "ทำให้โมเดลนี้พร้อมใช้งาน" เมื่อมีโมเดลหลักอยู่แล้ว ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน."

    หากต้องการสลับโมเดลเริ่มต้นโดยตั้งใจ ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="การแยกผู้ให้บริการ/รันไทม์ของ OpenAI">
    เส้นทางตระกูล OpenAI จะแยกตาม prefix:

    - `openai/<model>` พร้อม `agents.defaults.agentRuntime.id: "codex"` ใช้ harness app-server ของ Codex แบบเนทีฟ นี่คือการตั้งค่าการสมัครสมาชิก ChatGPT/Codex ตามปกติ.
    - `openai-codex/<model>` ใช้ Codex OAuth ใน PI.
    - `openai/<model>` โดยไม่มีการ override รันไทม์ Codex ใช้ผู้ให้บริการคีย์ API ของ OpenAI โดยตรงใน PI.

    ดู [OpenAI](/th/providers/openai) และ [Codex harness](/th/plugins/codex-harness). หากการแยกผู้ให้บริการ/รันไทม์ทำให้สับสน ให้อ่าน [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) ก่อน.

    การเปิดใช้งาน Plugin อัตโนมัติเป็นไปตามขอบเขตเดียวกัน: `openai-codex/<model>` เป็นของ OpenAI plugin ขณะที่ Codex plugin จะเปิดใช้งานโดย `agentRuntime.id: "codex"` หรือการอ้างอิง `codex/<model>` แบบเดิม.

    GPT-5.5 พร้อมใช้งานผ่าน harness app-server ของ Codex แบบเนทีฟเมื่อตั้งค่า `agentRuntime.id: "codex"`, ผ่าน `openai-codex/gpt-5.5` ใน PI สำหรับ Codex OAuth, และผ่าน `openai/gpt-5.5` ใน PI สำหรับทราฟฟิกคีย์ API โดยตรงเมื่อบัญชีของคุณเปิดให้ใช้งาน.

  </Accordion>
  <Accordion title="รันไทม์ CLI">
    รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดล canonical เช่น `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` จากนั้นตั้งค่า `agents.defaults.agentRuntime.id` เป็น `claude-cli`, `google-gemini-cli` หรือ `codex-cli` เมื่อต้องการ backend CLI ภายในเครื่อง.

    การอ้างอิง `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` แบบเดิมจะ migrate กลับไปเป็นการอ้างอิงผู้ให้บริการ canonical โดยบันทึกรันไทม์แยกต่างหาก.

  </Accordion>
</AccordionGroup>

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน Plugin ผู้ให้บริการ (`registerProvider(...)`) ขณะที่ OpenClaw ดูแลลูป inference ทั่วไป Plugin เป็นเจ้าของ onboarding, แคตตาล็อกโมเดล, การแมป env-var การยืนยันตัวตน, การ normalize transport/config, การล้าง tool-schema, การจัดประเภท failover, การ refresh OAuth, การรายงานการใช้งาน, โปรไฟล์ thinking/reasoning และอื่นๆ.

รายการ hook ของ provider-SDK และตัวอย่าง bundled-plugin ทั้งหมดอยู่ใน [Provider plugins](/th/plugins/sdk-provider-plugins). ผู้ให้บริการที่ต้องการตัวดำเนินการคำขอแบบกำหนดเองทั้งหมดเป็นพื้นผิวส่วนขยายที่แยกต่างหากและลึกกว่า.

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน hook ผู้ให้บริการที่ชัดเจน เช่น นโยบาย replay, การ normalize tool-schema, การห่อ stream และตัวช่วย transport/request. static bag `ProviderPlugin.capabilities` แบบเดิมมีไว้เพื่อความเข้ากันได้เท่านั้น และตรรกะ runner ที่ใช้ร่วมกันจะไม่อ่านอีกต่อไป.
</Note>

## การหมุนเวียนคีย์ API

<AccordionGroup>
  <Accordion title="แหล่งที่มาของคีย์และลำดับความสำคัญ">
    กำหนดค่าหลายคีย์ผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override สดแบบเดี่ยว ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วยจุลภาคหรืออัฒภาค)
    - `<PROVIDER>_API_KEY` (คีย์หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการลำดับเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือกคีย์จะรักษาลำดับความสำคัญและกำจัดค่าที่ซ้ำกัน.

  </Accordion>
  <Accordion title="เมื่อการหมุนเวียนเริ่มทำงาน">
    - คำขอจะ retry ด้วยคีย์ถัดไปเฉพาะเมื่อมีการตอบกลับ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความขีดจำกัดการใช้งานเป็นระยะ).
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่พยายามหมุนเวียนคีย์.
    - เมื่อคีย์ที่เป็นตัวเลือกทั้งหมดล้มเหลว ระบบจะส่งคืนข้อผิดพลาดสุดท้ายจากความพยายามครั้งสุดท้าย.

  </Accordion>
</AccordionGroup>

## ผู้ให้บริการในตัว (แคตตาล็อก pi-ai)

OpenClaw มาพร้อมแคตตาล็อก pi‑ai ผู้ให้บริการเหล่านี้ไม่ต้องใช้ config `models.providers`; เพียงตั้งค่าการยืนยันตัวตนและเลือกโมเดล.

### OpenAI

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: `OPENAI_API_KEY`
- การหมุนเวียนที่เลือกได้: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (override เดี่ยว)
- ตัวอย่างโมเดล: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือคีย์ API บางรายการทำงานต่างออกไป.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override ต่อโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- ค่าเริ่มต้นของการ warm-up WebSocket ของ OpenAI Responses เปิดใช้งานผ่าน `params.openaiWsWarmup` (`true`/`false`)
- การประมวลผลลำดับความสำคัญของ OpenAI สามารถเปิดใช้งานผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` แมปคำขอ Responses แบบ direct `openai/*` เป็น `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อต้องการ tier ที่ชัดเจนแทน toggle `/fast` ที่ใช้ร่วมกัน
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบเนทีฟไปยัง `api.openai.com` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- เส้นทาง OpenAI แบบเนทีฟยังคงรักษา Responses `store`, hint ของ prompt-cache และการจัดรูป payload เพื่อความเข้ากันได้กับ reasoning ของ OpenAI; เส้นทาง proxy จะไม่ทำ
- `openai/gpt-5.3-codex-spark` ถูกกดไว้โดยตั้งใจใน OpenClaw เพราะคำขอ OpenAI API สดปฏิเสธโมเดลนี้ และแคตตาล็อก Codex ปัจจุบันไม่เปิดให้ใช้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- การยืนยันตัวตน: `ANTHROPIC_API_KEY`
- การหมุนเวียนที่เลือกได้: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (override เดี่ยว)
- ตัวอย่างโมเดล: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะโดยตรงรองรับ toggle `/fast` และ `params.fastMode` ที่ใช้ร่วมกัน รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วยคีย์ API และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw แมปสิ่งนั้นเป็น `service_tier` ของ Anthropic (`auto` เทียบกับ `standard_only`)
- config Claude CLI ที่แนะนำจะเก็บการอ้างอิงโมเดลให้เป็น canonical และเลือก
  backend CLI แยกต่างหาก: `anthropic/claude-opus-4-7` พร้อม
  `agents.defaults.agentRuntime.id: "claude-cli"`. การอ้างอิง
  `claude-cli/claude-opus-4-7` แบบเดิมยังคงใช้ได้เพื่อความเข้ากันได้.

<Note>
พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ว่า Anthropic จะเผยแพร่นโยบายใหม่ setup-token ของ Anthropic ยังคงพร้อมใช้งานเป็นเส้นทางโทเค็นที่รองรับของ OpenClaw แต่ตอนนี้ OpenClaw แนะนำให้ใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน.
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
- การอ้างอิง harness app-server ของ Codex แบบเนทีฟ: `openai/gpt-5.5` พร้อม `agents.defaults.agentRuntime.id: "codex"`
- เอกสาร harness app-server ของ Codex แบบเนทีฟ: [Codex harness](/th/plugins/codex-harness)
- การอ้างอิงโมเดลแบบเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` โหลด OpenAI plugin; plugin app-server ของ Codex แบบเนทีฟจะถูกเลือกเฉพาะโดยรันไทม์ Codex harness หรือการอ้างอิง `codex/*` แบบเดิม.
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override ต่อโมเดล PI ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อในคำขอ Codex Responses แบบเนทีฟด้วย (`chatgpt.com/backend-api`)
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) จะแนบเฉพาะกับทราฟฟิก Codex แบบเนทีฟไปยัง `chatgpt.com/backend-api` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- ใช้ toggle `/fast` และ config `params.fastMode` เดียวกันกับ direct `openai/*`; OpenClaw แมปสิ่งนั้นเป็น `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้แคตตาล็อก Codex แบบเนทีฟ `contextWindow = 400000` และรันไทม์เริ่มต้น `contextTokens = 272000`; override ขีดจำกัดรันไทม์ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw.
- สำหรับเส้นทางการสมัครสมาชิกทั่วไปพร้อมรันไทม์ Codex แบบเนทีฟ ให้ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex` แต่กำหนดค่า `openai/gpt-5.5` พร้อม `agents.defaults.agentRuntime.id: "codex"`.
- ใช้ `openai-codex/gpt-5.5` เฉพาะเมื่อต้องการเส้นทาง Codex OAuth/การสมัครสมาชิกผ่าน PI; ใช้ `openai/gpt-5.5` โดยไม่มีการ override รันไทม์ Codex เมื่อการตั้งค่าคีย์ API และแคตตาล็อกภายในเครื่องของคุณเปิดเผยเส้นทาง API สาธารณะ.

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
    Z.AI Coding Plan หรือ endpoint API ทั่วไป.
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    MiniMax Coding Plan OAuth หรือการเข้าถึงด้วยคีย์ API.
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    พื้นผิวผู้ให้บริการ Qwen Cloud รวมถึงการแมป endpoint ของ Alibaba DashScope และ Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- การยืนยันตัวตน: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการรันไทม์ Zen: `opencode`
- ผู้ให้บริการรันไทม์ Go: `opencode-go`
- ตัวอย่างโมเดล: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (คีย์ API)

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนที่เลือกใช้ได้: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, สำรองไปใช้ `GOOGLE_API_KEY` และ `OPENCLAW_LIVE_GEMINI_KEY` (การแทนที่เดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: คอนฟิก OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกปรับมาตรฐานเป็น `google/gemini-3-flash-preview`
- นามแฝง: `google/gemini-3.1-pro` ใช้ได้และจะถูกปรับมาตรฐานเป็นรหัส Gemini API แบบใช้งานจริงของ Google คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การคิด: `/think adaptive` ใช้การคิดแบบไดนามิกของ Google Gemini 3/3.1 จะละเว้น `thinkingLevel` แบบคงที่; Gemini 2.5 จะส่ง `thinkingBudget: -1`
- การรัน Gemini โดยตรงยังรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อแฮนเดิล `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; cache hit ของ Gemini จะแสดงเป็น `cacheRead` ของ OpenClaw

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตนเอง

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานว่ามีข้อจำกัดบัญชี Google หลังจากใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
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

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่** ต้องวางรหัสไคลเอนต์หรือข้อมูลลับลงใน `openclaw.json` โฟลว์เข้าสู่ระบบของ CLI จะเก็บโทเค็นไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway

  </Step>
  <Step title="ตั้งค่าโปรเจกต์ (หากจำเป็น)">
    หากคำขอล้มเหลวหลังจากเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

คำตอบ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; การใช้งานจะสำรองไปใช้ `stats` โดย `stats.cached` จะถูกปรับมาตรฐานเป็น `cacheRead` ของ OpenClaw

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - นามแฝง: `z.ai/*` และ `z-ai/*` จะปรับมาตรฐานเป็น `zai/*`
  - `zai-api-key` ตรวจหาเอนด์พอยต์ Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` บังคับใช้พื้นผิวเฉพาะ

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
- แคตตาล็อกสำรองแบบคงที่จัดส่ง `kilocode/kilo/auto`; การค้นพบแบบใช้งานจริงที่ `https://api.kilo.ai/api/gateway/models` สามารถขยายแคตตาล็อกรันไทม์เพิ่มเติมได้
- การกำหนดเส้นทางต้นทางที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้ฮาร์ดโค้ดใน OpenClaw

ดูรายละเอียดการตั้งค่าที่ [/providers/kilocode](/th/providers/kilocode)

### Plugin ผู้ให้บริการอื่นๆ ที่รวมมาให้

| ผู้ให้บริการ            | Id                               | env การยืนยันตัวตน                                        | โมเดลตัวอย่าง                                |
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

#### รายละเอียดเฉพาะที่ควรรู้

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้เฮดเดอร์การระบุแหล่งที่มาของแอปและมาร์กเกอร์ `cache_control` ของ Anthropic เฉพาะบนเส้นทาง `openrouter.ai` ที่ได้รับการยืนยันแล้วเท่านั้น รายการอ้างอิง DeepSeek, Moonshot และ ZAI มีสิทธิ์ใช้ cache-TTL สำหรับการแคช prompt ที่ OpenRouter จัดการ แต่จะไม่ได้รับมาร์กเกอร์แคชของ Anthropic ในฐานะเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI จึงข้ามการจัดรูปแบบที่ใช้เฉพาะ OpenAI แบบเนทีฟ (`serviceTier`, Responses `store`, คำใบ้ prompt-cache, OpenAI reasoning-compat) รายการอ้างอิงที่หนุนด้วย Gemini จะคงไว้เฉพาะการทำความสะอาด thought-signature ของ proxy-Gemini เท่านั้น
  </Accordion>
  <Accordion title="Kilo Gateway">
    รายการอ้างอิงที่หนุนด้วย Gemini ใช้เส้นทางการทำความสะอาด proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และรายการอ้างอิงอื่นที่ไม่รองรับ proxy-reasoning จะข้ามการแทรก proxy reasoning
  </Accordion>
  <Accordion title="MiniMax">
    การเริ่มต้นใช้งานด้วยคีย์ API จะเขียนนิยามโมเดลแชท M2.7 แบบข้อความเท่านั้นอย่างชัดเจน; ความเข้าใจรูปภาพยังคงอยู่บนผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    รหัสโมเดลใช้เนมสเปซ `nvidia/<vendor>/<model>` (เช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกจะคงองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษรไว้ ขณะที่คีย์มาตรฐานที่ส่งไปยัง API ยังคงมีคำนำหน้าเพียงชั้นเดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง Responses ของ xAI `grok-4.3` คือโมเดลแชทเริ่มต้นที่รวมมาให้ `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` ของแต่ละรายการ `tool_stream` เปิดเป็นค่าเริ่มต้น; ปิดได้ผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
  <Accordion title="Cerebras">
    จัดส่งเป็น Plugin ผู้ให้บริการ `cerebras` ที่รวมมาให้ GLM ใช้ `zai-glm-4.7`; URL ฐานที่เข้ากันได้กับ OpenAI คือ `https://api.cerebras.ai/v1`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (URL แบบกำหนดเอง/ฐาน)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **แบบกำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่รวมมาให้จำนวนมากด้านล่างเผยแพร่แค็ตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` อย่างชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL ฐาน เฮดเดอร์ หรือรายการโมเดลเริ่มต้น

การตรวจสอบความสามารถของโมเดลใน Gateway จะอ่านเมตาดาต้า `models.providers.<id>.models[]` ที่กำหนดไว้อย่างชัดเจนด้วย หากโมเดลแบบกำหนดเองหรือพร็อกซีรับรูปภาพได้ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้เส้นทางไฟล์แนบจาก WebChat และต้นทางโหนดส่งรูปภาพเป็นอินพุตโมเดลแบบเนทีฟแทน media refs แบบข้อความเท่านั้น

### Moonshot AI (Kimi)

Moonshot จัดส่งเป็น Plugin ผู้ให้บริการที่รวมมาให้ ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` อย่างชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL ฐานหรือเมตาดาต้าโมเดล:

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

`kimi/k2p5` แบบเก่ายังคงยอมรับเป็น id โมเดลเพื่อความเข้ากันได้ย้อนหลัง

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่น ๆ ในจีน

- ผู้ให้บริการ: `volcengine` (งานเขียนโค้ด: `volcengine-plan`)
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

การเริ่มต้นใช้งานใช้พื้นที่งานเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตน Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ได้โหลด OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ได้กรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการซึ่งว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="โมเดลสำหรับงานเขียนโค้ด (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (นานาชาติ)

BytePlus ARK ให้การเข้าถึงโมเดลเดียวกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

- ผู้ให้บริการ: `byteplus` (งานเขียนโค้ด: `byteplus-plan`)
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

การเริ่มต้นใช้งานใช้พื้นที่งานเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `byteplus/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตน BytePlus จะให้ความสำคัญกับทั้งแถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ได้โหลด OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ได้กรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการซึ่งว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="โมเดลสำหรับงานเขียนโค้ด (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic ให้โมเดลที่เข้ากันได้กับ Anthropic ผ่านผู้ให้บริการ `synthetic`:

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
- คีย์ MiniMax API (ทั่วโลก): `--auth-choice minimax-global-api`
- คีย์ MiniMax API (CN): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดูรายละเอียดการตั้งค่า ตัวเลือกโมเดล และส่วนย่อยการกำหนดค่าได้ที่ [/providers/minimax](/th/providers/minimax)

<Note>
บนเส้นทางการสตรีมที่เข้ากันได้กับ Anthropic ของ MiniMax OpenClaw จะปิดการคิดโดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าอย่างชัดเจน และ `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแยกความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นข้อความ/แชตยังคงอยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- ความเข้าใจภาพเป็น `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนเส้นทางการยืนยันตัวตน MiniMax ทั้งสองแบบ
- การค้นหาเว็บยังคงอยู่บน id ผู้ให้บริการ `minimax`

### LM Studio

LM Studio มาพร้อมเป็น Plugin ผู้ให้บริการแบบรวม ซึ่งใช้ API ดั้งเดิม:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- URL ฐานสำหรับการอนุมานค่าเริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน ID ที่ส่งคืนโดย `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` ดั้งเดิมของ LM Studio สำหรับการค้นพบ + โหลดอัตโนมัติ และใช้ `/v1/chat/completions` สำหรับการอนุมานโดยค่าเริ่มต้น หากคุณต้องการให้การโหลด JIT, TTL และการขับออกอัตโนมัติของ LM Studio เป็นเจ้าของวงจรชีวิตโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดูการตั้งค่าและการแก้ไขปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama มาพร้อมเป็น Plugin ผู้ให้บริการแบบรวม และใช้ API ดั้งเดิมของ Ollama:

- ผู้ให้บริการ: `ollama`
- การยืนยันตัวตน: ไม่จำเป็น (เซิร์ฟเวอร์ในเครื่อง)
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

Ollama จะถูกตรวจพบในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการแบบรวมจะเพิ่ม Ollama โดยตรงไปยัง `openclaw onboard` และตัวเลือกโมเดล ดูการเริ่มต้นใช้งาน โหมดคลาวด์/ในเครื่อง และการกำหนดค่าแบบกำหนดเองได้ที่ [/providers/ollama](/th/providers/ollama)

### vLLM

vLLM มาพร้อมเป็น Plugin ผู้ให้บริการแบบรวมสำหรับเซิร์ฟเวอร์ในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานค่าเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติในเครื่อง (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน):

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

ดูรายละเอียดได้ที่ [/providers/vllm](/th/providers/vllm)

### SGLang

SGLang มาพร้อมเป็น Plugin ผู้ให้บริการแบบรวมสำหรับเซิร์ฟเวอร์โฮสต์เองที่เข้ากันได้กับ OpenAI และรวดเร็ว:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานค่าเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติในเครื่อง (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน):

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

ดูรายละเอียดได้ที่ [/providers/sglang](/th/providers/sglang)

### พร็อกซีในเครื่อง (LM Studio, vLLM, LiteLLM ฯลฯ)

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
  <Accordion title="ฟิลด์ไม่บังคับค่าเริ่มต้น">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์ไม่บังคับ เมื่อไม่ระบุ OpenClaw จะใช้ค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าชัดเจนให้ตรงกับขีดจำกัดพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="กฎการจัดรูปเส้นทางพร็อกซี">
    - สำหรับ `api: "openai-completions"` บนปลายทางที่ไม่ใช่ปลายทางดั้งเดิม (ทุก `baseUrl` ที่ไม่ว่างซึ่งโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซีจะข้ามการจัดรูปคำขอเฉพาะ OpenAI ดั้งเดิมด้วย: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้ prompt-cache, ไม่มีการจัดรูปเพย์โหลด reasoning-compat ของ OpenAI และไม่มีส่วนหัวการระบุแหล่งที่มา OpenClaw แบบซ่อน
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องการฟิลด์เฉพาะผู้ขาย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อรวม JSON เพิ่มเติมเข้ากับ body คำขอขาออก
    - สำหรับการควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM แบบรวมจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` สำหรับ `vllm/nemotron-3-*` โดยอัตโนมัติเมื่อระดับการคิดของเซสชันปิดอยู่
    - สำหรับโมเดลในเครื่องที่ช้าหรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` การตั้งค่านี้จะขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึงการเชื่อมต่อ ส่วนหัว การสตรีม body และการยกเลิก guarded-fetch ทั้งหมด โดยไม่เพิ่ม timeout ของรันไทม์เอเจนต์ทั้งหมด
    - หาก `baseUrl` ว่าง/ไม่ระบุ OpenClaw จะคงพฤติกรรมค่าเริ่มต้นของ OpenAI ไว้ (ซึ่งจะ resolve เป็น `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ระบุอย่างชัดเจนยังคงถูกแทนที่บนปลายทาง `openai-completions` ที่ไม่ใช่ปลายทางดั้งเดิม
    - สำหรับ `api: "anthropic-messages"` บนปลายทางที่ไม่ใช่โดยตรง (ผู้ให้บริการใด ๆ ที่ไม่ใช่ `anthropic` ตามมาตรฐาน หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่โฮสต์ไม่ใช่ปลายทางสาธารณะ `api.anthropic.com`) OpenClaw จะระงับส่วนหัวเบต้า Anthropic โดยนัย เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และตัวทำเครื่องหมาย OAuth เพื่อให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ไม่ปฏิเสธแฟล็กเบต้าที่ไม่รองรับ ให้ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีของคุณต้องการฟีเจอร์เบต้าเฉพาะ

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
- [การสลับโมเดลเมื่อทำงานล้มเหลว](/th/concepts/model-failover) — เชนสำรองและพฤติกรรมการลองใหม่
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและนามแฝง
- [ผู้ให้บริการ](/th/providers) — คู่มือการตั้งค่าแยกตามผู้ให้บริการ
