---
read_when:
    - คุณต้องมีเอกสารอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่างการกำหนดค่าหรือคำสั่งเริ่มต้นใช้งานของ CLI สำหรับผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่า + ขั้นตอนการใช้งาน CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-05-02T10:13:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02494bfb71c0e0449eacd9ec028316e7a1479e51c6591aea5885baf3941272d5
    source_path: concepts/model-providers.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models)

## กฎแบบย่อ

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` ทำหน้าที่เป็น allowlist เมื่อตั้งค่าไว้
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` แทนที่ค่าเหล่านั้นเป็นรายโมเดล
    - กฎ fallback, cooldown probes และการคงค่า session override: [การ failover ของโมเดล](/th/concepts/model-failover)

  </Accordion>
  <Accordion title="การเพิ่ม auth ของผู้ให้บริการไม่เปลี่ยนโมเดลหลักของคุณ">
    `openclaw configure` จะคงค่า `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อคุณเพิ่มหรือยืนยันตัวตนผู้ให้บริการใหม่ Provider plugins อาจยังคงส่งคืนโมเดลเริ่มต้นที่แนะนำในแพตช์ config สำหรับ auth ของตน แต่ configure จะตีความสิ่งนั้นว่า "ทำให้โมเดลนี้ใช้งานได้" เมื่อมีโมเดลหลักอยู่แล้ว ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน"

    หากต้องการเปลี่ยนโมเดลเริ่มต้นโดยตั้งใจ ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`

  </Accordion>
  <Accordion title="การแยกผู้ให้บริการ/รันไทม์ของ OpenAI">
    เส้นทางตระกูล OpenAI เจาะจงตาม prefix:

    - `openai/<model>` พร้อม `agents.defaults.agentRuntime.id: "codex"` ใช้ native Codex app-server harness นี่คือการตั้งค่าปกติสำหรับการสมัครสมาชิก ChatGPT/Codex
    - `openai-codex/<model>` ใช้ Codex OAuth ใน PI
    - `openai/<model>` โดยไม่มีการแทนที่รันไทม์ Codex ใช้ผู้ให้บริการ OpenAI แบบ API key โดยตรงใน PI

    ดู [OpenAI](/th/providers/openai) และ [Codex harness](/th/plugins/codex-harness) หากการแยกผู้ให้บริการ/รันไทม์ทำให้สับสน ให้อ่าน [รันไทม์ของ Agent](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้ Plugin อัตโนมัติจะตามขอบเขตเดียวกัน: `openai-codex/<model>` เป็นของ OpenAI plugin ขณะที่ Codex plugin เปิดใช้โดย `agentRuntime.id: "codex"` หรือการอ้างอิงแบบเดิม `codex/<model>`

    GPT-5.5 พร้อมใช้งานผ่าน native Codex app-server harness เมื่อตั้งค่า `agentRuntime.id: "codex"` ผ่าน `openai-codex/gpt-5.5` ใน PI สำหรับ Codex OAuth และผ่าน `openai/gpt-5.5` ใน PI สำหรับทราฟฟิก API key โดยตรงเมื่อบัญชีของคุณเปิดให้ใช้

  </Accordion>
  <Accordion title="รันไทม์ CLI">
    รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดลมาตรฐาน เช่น `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` จากนั้นตั้งค่า `agents.defaults.agentRuntime.id` เป็น `claude-cli`, `google-gemini-cli` หรือ `codex-cli` เมื่อคุณต้องการแบ็กเอนด์ CLI ในเครื่อง

    การอ้างอิงแบบเดิม `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` จะย้ายกลับไปเป็นการอ้างอิงผู้ให้บริการมาตรฐาน โดยบันทึกรันไทม์แยกไว้ต่างหาก

  </Accordion>
</AccordionGroup>

## พฤติกรรมของผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน provider plugins (`registerProvider(...)`) ขณะที่ OpenClaw ดูแลลูป inference ทั่วไป Plugins เป็นเจ้าของ onboarding, แค็ตตาล็อกโมเดล, การแมป env var สำหรับ auth, การทำให้ transport/config เป็นมาตรฐาน, การทำความสะอาด tool schema, การจัดประเภท failover, การรีเฟรช OAuth, การรายงาน usage, โปรไฟล์ thinking/reasoning และอื่น ๆ

รายการทั้งหมดของ provider-SDK hooks และตัวอย่าง bundled-plugin อยู่ใน [Provider plugins](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ request executor แบบปรับแต่งเองทั้งหมดเป็นพื้นผิวส่วนขยายที่แยกต่างหากและลึกกว่า

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน provider hooks ที่ชัดเจน เช่น นโยบาย replay, การทำให้ tool schema เป็นมาตรฐาน, การห่อ stream และตัวช่วย transport/request ถุง static แบบเดิม `ProviderPlugin.capabilities` มีไว้เพื่อความเข้ากันได้เท่านั้น และตรรกะ runner ที่ใช้ร่วมกันจะไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียน API key

<AccordionGroup>
  <Accordion title="แหล่งที่มาของ key และลำดับความสำคัญ">
    กำหนดค่าหลาย key ผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (การแทนที่ live เดี่ยว ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วย comma หรือ semicolon)
    - `<PROVIDER>_API_KEY` (key หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือก key จะรักษาลำดับความสำคัญและตัดค่าซ้ำออก

  </Accordion>
  <Accordion title="เมื่อการหมุนเวียนเริ่มทำงาน">
    - คำขอจะ retry ด้วย key ถัดไปเฉพาะเมื่อได้รับคำตอบแบบ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความ usage-limit เป็นระยะ)
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่พยายามหมุนเวียน key
    - เมื่อ key ที่เป็นตัวเลือกทั้งหมดล้มเหลว ข้อผิดพลาดสุดท้ายจะถูกส่งคืนจากความพยายามครั้งสุดท้าย

  </Accordion>
</AccordionGroup>

## ผู้ให้บริการในตัว (แค็ตตาล็อก pi-ai)

OpenClaw มาพร้อมแค็ตตาล็อก pi‑ai ผู้ให้บริการเหล่านี้ไม่ต้องใช้ config `models.providers` **ใด ๆ**; เพียงตั้งค่า auth แล้วเลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- Auth: `OPENAI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (การแทนที่เดี่ยว)
- ตัวอย่างโมเดล: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือ API key บางรายการทำงานต่างกัน
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto` (ใช้ WebSocket ก่อน, fallback เป็น SSE)
- แทนที่เป็นรายโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- ค่าเริ่มต้นของ OpenAI Responses WebSocket warm-up เปิดใช้งานผ่าน `params.openaiWsWarmup` (`true`/`false`)
- การประมวลผลแบบ priority ของ OpenAI เปิดใช้ได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะแมปคำขอ Responses แบบ direct `openai/*` ไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อคุณต้องการ tier ที่ชัดเจนแทน toggle `/fast` ที่ใช้ร่วมกัน
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบ native ไปยัง `api.openai.com` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI ทั่วไป
- เส้นทาง OpenAI แบบ native ยังคงรักษา Responses `store`, คำใบ้ prompt-cache และการจัดรูป payload สำหรับ reasoning-compat ของ OpenAI; เส้นทาง proxy ไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` ถูกระงับใน OpenClaw โดยตั้งใจ เพราะคำขอ OpenAI API แบบ live ปฏิเสธโมเดลนี้ และแค็ตตาล็อก Codex ปัจจุบันไม่เปิดเผยโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (การแทนที่เดี่ยว)
- ตัวอย่างโมเดล: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะแบบ direct รองรับ toggle `/fast` ที่ใช้ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิก API key และ OAuth-authenticated ที่ส่งไปยัง `api.anthropic.com`; OpenClaw แมปสิ่งนั้นไปยัง Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- config Claude CLI ที่แนะนำจะคงการอ้างอิงโมเดลเป็นแบบมาตรฐานและเลือกแบ็กเอนด์ CLI
  แยกต่างหาก: `anthropic/claude-opus-4-7` พร้อม
  `agents.defaults.agentRuntime.id: "claude-cli"` การอ้างอิงแบบเดิม
  `claude-cli/claude-opus-4-7` ยังใช้งานได้เพื่อความเข้ากันได้

<Note>
เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw อนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI กลับมาใช้และการใช้งาน `claude -p` ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ setup-token ของ Anthropic ยังคงพร้อมใช้งานเป็นเส้นทาง token ที่ OpenClaw รองรับ แต่ตอนนี้ OpenClaw แนะนำให้ใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
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
- การอ้างอิงโมเดลแบบเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` โหลด OpenAI plugin; native Codex app-server plugin จะถูกเลือกเฉพาะโดยรันไทม์ Codex harness หรือการอ้างอิงแบบเดิม `codex/*`
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (ใช้ WebSocket ก่อน, fallback เป็น SSE)
- แทนที่เป็นรายโมเดล PI ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` ถูกส่งต่อบนคำขอ Codex Responses แบบ native ด้วย (`chatgpt.com/backend-api`)
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) จะถูกแนบเฉพาะกับทราฟฟิก Codex แบบ native ไปยัง `chatgpt.com/backend-api` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI ทั่วไป
- แชร์ config toggle `/fast` และ `params.fastMode` เดียวกันกับ direct `openai/*`; OpenClaw แมปสิ่งนั้นไปยัง `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้ Codex catalog native `contextWindow = 400000` และรันไทม์เริ่มต้น `contextTokens = 272000`; แทนที่เพดานรันไทม์ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw
- สำหรับเส้นทางทั่วไปแบบ subscription พร้อม native Codex runtime ให้ลงชื่อเข้าใช้ด้วย auth `openai-codex` แต่กำหนดค่า `openai/gpt-5.5` พร้อม `agents.defaults.agentRuntime.id: "codex"`
- ใช้ `openai-codex/gpt-5.5` เฉพาะเมื่อคุณต้องการเส้นทาง Codex OAuth/subscription ผ่าน PI; ใช้ `openai/gpt-5.5` โดยไม่มีการแทนที่รันไทม์ Codex เมื่อการตั้งค่า API key และแค็ตตาล็อกในเครื่องของคุณเปิดเผยเส้นทาง public API

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex", fallback: "none" },
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

### ตัวเลือกโฮสต์แบบ subscription อื่น ๆ

<CardGroup cols={3}>
  <Card title="โมเดล GLM" href="/th/providers/glm">
    Z.AI Coding Plan หรือ API endpoints ทั่วไป
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    MiniMax Coding Plan OAuth หรือการเข้าถึงด้วย API key
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    พื้นผิวผู้ให้บริการ Qwen Cloud รวมถึงการแมป Alibaba DashScope และ Coding Plan endpoint
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
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนที่เลือกได้: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, การสำรอง `GOOGLE_API_KEY`, และ `OPENCLAW_LIVE_GEMINI_KEY` (การแทนที่เดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: การกำหนดค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกปรับให้เป็น `google/gemini-3-flash-preview`
- นามแฝง: `google/gemini-3.1-pro` ใช้งานได้และจะถูกปรับให้เป็นรหัส Gemini API สดของ Google คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การคิด: `/think adaptive` ใช้การคิดแบบไดนามิกของ Google Gemini 3/3.1 จะไม่ใส่ `thinkingLevel` แบบคงที่; Gemini 2.5 ส่ง `thinkingBudget: -1`
- การรัน Gemini โดยตรงยังรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อแฮนเดิล `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; การพบแคชของ Gemini จะแสดงใน OpenClaw เป็น `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตัวเอง

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานการทำงานที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานว่าบัญชี Google ถูกจำกัดหลังจากใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
</Warning>

Gemini CLI OAuth ถูกจัดส่งเป็นส่วนหนึ่งของ Plugin `google` ที่รวมมาให้

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

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่ต้อง** วางรหัสไคลเอนต์หรือความลับลงใน `openclaw.json` โฟลว์การเข้าสู่ระบบของ CLI จะเก็บโทเคนไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway

  </Step>
  <Step title="ตั้งค่าโปรเจกต์ (หากจำเป็น)">
    หากคำขอล้มเหลวหลังจากเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

การตอบกลับ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; การใช้งานจะถอยกลับไปใช้ `stats` โดยปรับ `stats.cached` ให้เป็น `cacheRead` ของ OpenClaw

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - นามแฝง: `z.ai/*` และ `z-ai/*` จะถูกปรับให้เป็น `zai/*`
  - `zai-api-key` ตรวจหา endpoint ของ Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global`, และ `zai-cn` บังคับใช้พื้นผิวที่เฉพาะเจาะจง

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
- แค็ตตาล็อกสำรองแบบคงที่จัดส่ง `kilocode/kilo/auto`; การค้นพบสดที่ `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อกรันไทม์เพิ่มเติมได้
- การกำหนดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้เขียนตายตัวไว้ใน OpenClaw

ดูรายละเอียดการตั้งค่าที่ [/providers/kilocode](/th/providers/kilocode)

### Plugin ผู้ให้บริการอื่นที่รวมมาให้

| ผู้ให้บริการ            | รหัส                             | env การยืนยันตัวตน                                           | โมเดลตัวอย่าง                                |
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

#### เกร็ดที่ควรรู้

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้ส่วนหัวการระบุแอปและเครื่องหมาย `cache_control` ของ Anthropic เฉพาะบนเส้นทาง `openrouter.ai` ที่ผ่านการยืนยันแล้วเท่านั้น DeepSeek, Moonshot และ ZAI refs มีสิทธิ์ใช้ cache-TTL สำหรับการแคชพรอมป์ที่ OpenRouter จัดการ แต่จะไม่ได้รับเครื่องหมายแคชของ Anthropic ในฐานะเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI เส้นทางนี้จะข้ามการปรับรูปแบบที่มีเฉพาะ OpenAI แบบเนทีฟ (`serviceTier`, Responses `store`, คำใบ้แคชพรอมป์, ความเข้ากันได้ด้านการให้เหตุผลของ OpenAI) ส่วน refs ที่ใช้ Gemini เป็นเบื้องหลังจะคงไว้เฉพาะการทำความสะอาด thought-signature ของ proxy-Gemini เท่านั้น
  </Accordion>
  <Accordion title="Kilo Gateway">
    refs ที่ใช้ Gemini เป็นเบื้องหลังจะใช้เส้นทางการทำความสะอาด proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และ refs อื่นที่ไม่รองรับการให้เหตุผลผ่านพร็อกซีจะข้ามการฉีดการให้เหตุผลผ่านพร็อกซี
  </Accordion>
  <Accordion title="MiniMax">
    การเริ่มต้นใช้งานด้วย API key จะเขียนนิยามโมเดลแชท M2.7 แบบข้อความเท่านั้นอย่างชัดเจน; ความเข้าใจรูปภาพยังคงอยู่บนผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    ID โมเดลใช้เนมสเปซ `nvidia/<vendor>/<model>` (ตัวอย่างเช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกจะรักษาองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษร ขณะที่คีย์มาตรฐานที่ส่งไปยัง API ยังคงมีคำนำหน้าเดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง xAI Responses `grok-4.3` คือโมเดลแชทเริ่มต้นที่รวมมาให้ `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` ของแต่ละโมเดล ค่าเริ่มต้นของ `tool_stream` เปิดอยู่; ปิดได้ผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
  <Accordion title="Cerebras">
    จัดส่งในรูปแบบ Plugin ผู้ให้บริการ `cerebras` ที่รวมมาให้ GLM ใช้ `zai-glm-4.7`; URL พื้นฐานที่เข้ากันได้กับ OpenAI คือ `https://api.cerebras.ai/v1`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (URL แบบกำหนดเอง/พื้นฐาน)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **แบบกำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่รวมมาให้ด้านล่างจำนวนมากเผยแพร่แค็ตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL พื้นฐาน ส่วนหัว หรือรายการโมเดลเริ่มต้นเท่านั้น

การตรวจสอบความสามารถของโมเดล Gateway ยังอ่านเมทาดาทา `models.providers.<id>.models[]` ที่ระบุอย่างชัดเจนด้วย หากโมเดลแบบกำหนดเองหรือพร็อกซียอมรับรูปภาพ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้เส้นทางไฟล์แนบจาก WebChat และต้นทางจาก Node ส่งรูปภาพเป็นอินพุตโมเดลแบบเนทีฟแทน refs สื่อแบบข้อความเท่านั้น

### Moonshot AI (Kimi)

Moonshot จัดส่งในรูปแบบ Plugin ผู้ให้บริการที่รวมมาให้ ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณจำเป็นต้องแทนที่ URL พื้นฐานหรือเมทาดาทาของโมเดล:

- ผู้ให้บริการ: `moonshot`
- การยืนยันตัวตน: `MOONSHOT_API_KEY`
- ตัวอย่างโมเดล: `moonshot/kimi-k2.6`
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

Kimi Coding ใช้ endpoint ที่เข้ากันได้กับ Anthropic ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- การยืนยันตัวตน: `KIMI_API_KEY`
- ตัวอย่างโมเดล: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` รุ่นเก่ายังคงยอมรับในฐานะ id ของโมเดลเพื่อความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่นๆ ในจีน

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

ในตัวเลือกโมเดลสำหรับการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตนของ Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ได้โหลด OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่ได้กรองแทนการแสดงตัวเลือกที่จำกัดตามผู้ให้บริการซึ่งว่างเปล่า

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

ในตัวเลือกโมเดลสำหรับการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตนของ BytePlus จะให้ความสำคัญกับทั้งแถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ได้โหลด OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่ได้กรองแทนการแสดงตัวเลือกที่จำกัดตามผู้ให้บริการซึ่งว่างเปล่า

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

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้ปลายทางแบบกำหนดเอง:

- MiniMax OAuth (ทั่วโลก): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- คีย์ MiniMax API (ทั่วโลก): `--auth-choice minimax-global-api`
- คีย์ MiniMax API (CN): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดูรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่างการกำหนดค่าได้ที่ [/providers/minimax](/th/providers/minimax)

<Note>
บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ของ MiniMax OpenClaw จะปิดการคิดเป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าไว้อย่างชัดเจน และ `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแยกความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังคงอยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- ความเข้าใจภาพคือ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนทั้งสองเส้นทางการยืนยันตัวตนของ MiniMax
- การค้นเว็บยังคงอยู่บน id ผู้ให้บริการ `minimax`

### LM Studio

LM Studio มาพร้อมเป็น Plugin ผู้ให้บริการแบบรวมชุด ซึ่งใช้ API แบบเนทีฟ:

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

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบเนทีฟของ LM Studio สำหรับการค้นพบ + การโหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานเป็นค่าเริ่มต้น หากคุณต้องการให้การโหลด JIT, TTL และการขับออกอัตโนมัติของ LM Studio เป็นเจ้าของวงจรชีวิตของโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดูการตั้งค่าและการแก้ปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama มาพร้อมเป็น Plugin ผู้ให้บริการแบบรวมชุด และใช้ API แบบเนทีฟของ Ollama:

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

Ollama จะถูกตรวจพบในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการแบบรวมชุดจะเพิ่ม Ollama เข้าไปใน `openclaw onboard` และตัวเลือกโมเดลโดยตรง ดูการเริ่มต้นใช้งาน โหมดคลาวด์/ในเครื่อง และการกำหนดค่าแบบกำหนดเองได้ที่ [/providers/ollama](/th/providers/ollama)

### vLLM

vLLM มาพร้อมเป็น Plugin ผู้ให้บริการแบบรวมชุดสำหรับเซิร์ฟเวอร์ในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติในเครื่อง (ค่าใดๆ ก็ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับการยืนยันตัวตน):

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

SGLang มาพร้อมเป็น Plugin ผู้ให้บริการแบบรวมชุดสำหรับเซิร์ฟเวอร์โฮสต์เองที่รวดเร็วและเข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติในเครื่อง (ค่าใดๆ ก็ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับการยืนยันตัวตน):

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
  <Accordion title="Default optional fields">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์ที่ไม่บังคับ เมื่อไม่ได้ระบุ OpenClaw จะใช้ค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าที่ชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - สำหรับ `api: "openai-completions"` บนปลายทางที่ไม่ใช่แบบเนทีฟ (ค่า `baseUrl` ที่ไม่ว่างซึ่งโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 ของผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซียังข้ามการจัดรูปคำขอที่เฉพาะ OpenAI แบบเนทีฟด้วย: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้ prompt-cache, ไม่มีการจัดรูปเพย์โหลด reasoning-compat ของ OpenAI และไม่มีส่วนหัวการระบุแหล่งที่มาของ OpenClaw ที่ซ่อนอยู่
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ฟิลด์เฉพาะผู้ขาย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อรวม JSON เพิ่มเติมเข้าในเนื้อหาคำขอขาออก
    - สำหรับการควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM แบบรวมชุดจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับการคิดของเซสชันปิดอยู่
    - สำหรับโมเดลในเครื่องที่ช้าหรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` สิ่งนี้จะขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึงการเชื่อมต่อ ส่วนหัว การสตรีมเนื้อหา และการยกเลิก guarded-fetch ทั้งหมด โดยไม่เพิ่ม timeout ของรันไทม์เอเจนต์ทั้งหมด
    - หาก `baseUrl` ว่าง/ไม่ได้ระบุ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่ง resolve ไปที่ `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ระบุอย่างชัดเจนจะยังคงถูกแทนที่บนปลายทาง `openai-completions` ที่ไม่ใช่แบบเนทีฟ
    - สำหรับ `api: "anthropic-messages"` บนปลายทางที่ไม่ใช่แบบตรง (ผู้ให้บริการใดๆ นอกเหนือจาก `anthropic` แบบมาตรฐาน หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่โฮสต์ไม่ใช่ปลายทางสาธารณะ `api.anthropic.com`) OpenClaw จะระงับส่วนหัว beta ของ Anthropic ที่แฝงมา เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และตัวทำเครื่องหมาย OAuth เพื่อให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ไม่ปฏิเสธแฟล็ก beta ที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีของคุณต้องใช้ฟีเจอร์ beta เฉพาะ

  </Accordion>
</AccordionGroup>

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าฉบับเต็ม

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์การกำหนดค่าโมเดล
- [การสลับโมเดลเมื่อผิดพลาด](/th/concepts/model-failover) — ลำดับ fallback และพฤติกรรมการลองซ้ำ
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและนามแฝง
- [ผู้ให้บริการ](/th/providers) — คู่มือการตั้งค่ารายผู้ให้บริการ
