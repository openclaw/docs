---
read_when:
    - คุณต้องมีเอกสารอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่างการกำหนดค่าหรือคำสั่ง CLI สำหรับการเริ่มต้นใช้งานผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่าและขั้นตอนการใช้งาน CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-07-04T04:12:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models).

## กฎแบบรวดเร็ว

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` ทำหน้าที่เป็น allowlist เมื่อตั้งค่าไว้
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` เขียนทับค่าเหล่านั้นต่อโมเดล
    - กฎ fallback, โพรบ cooldown และการคงอยู่ของการเขียนทับเซสชัน: [การ failover ของโมเดล](/th/concepts/model-failover).

  </Accordion>
  <Accordion title="การเพิ่มการยืนยันตัวตนของผู้ให้บริการไม่เปลี่ยนโมเดลหลักของคุณ">
    `openclaw configure` จะรักษา `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อคุณเพิ่มหรือยืนยันตัวตนผู้ให้บริการอีกครั้ง `openclaw models auth login` ก็ทำเช่นเดียวกัน เว้นแต่คุณจะส่ง `--set-default` Plugin ของผู้ให้บริการยังอาจคืนโมเดลเริ่มต้นที่แนะนำในแพตช์การกำหนดค่าการยืนยันตัวตนของตน แต่ OpenClaw จะถือว่านั่นหมายถึง "ทำให้โมเดลนี้พร้อมใช้งาน" เมื่อมีโมเดลหลักอยู่แล้ว ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน"

    หากต้องการสลับโมเดลเริ่มต้นโดยตั้งใจ ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="การแยกผู้ให้บริการ/รันไทม์ของ OpenAI">
    เส้นทางตระกูล OpenAI เจาะจงตามคำนำหน้า:

    - `openai/<model>` ใช้ฮาร์เนส app-server ของ Codex แบบเนทีฟสำหรับรอบการทำงานของเอเจนต์ตามค่าเริ่มต้น นี่คือการตั้งค่าการสมัครสมาชิก ChatGPT/Codex ตามปกติ
    - การอ้างอิงโมเดล Codex แบบเดิมคือการกำหนดค่าเก่าที่ doctor เขียนใหม่เป็น `openai/<model>`
    - `openai/<model>` พร้อม `agentRuntime.id: "openclaw"` ระดับผู้ให้บริการ/โมเดล ใช้รันไทม์ในตัวของ OpenClaw สำหรับเส้นทาง API-key หรือความเข้ากันได้แบบชัดเจน

    โปรดดู [OpenAI](/th/providers/openai) และ [ฮาร์เนส Codex](/th/plugins/codex-harness) หากการแยกผู้ให้บริการ/รันไทม์ทำให้สับสน ให้อ่าน [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้งาน Plugin อัตโนมัติทำตามขอบเขตเดียวกัน: การอ้างอิงเอเจนต์ `openai/*` เปิดใช้งาน Plugin Codex สำหรับเส้นทางเริ่มต้น และ `agentRuntime.id: "codex"` ระดับผู้ให้บริการ/โมเดลแบบชัดเจน หรือการอ้างอิง `codex/<model>` แบบเดิม ก็ต้องใช้ Plugin นี้เช่นกัน

    GPT-5.5 พร้อมใช้งานผ่านฮาร์เนส app-server ของ Codex แบบเนทีฟตามค่าเริ่มต้นบน `openai/gpt-5.5` และผ่านรันไทม์ OpenClaw เมื่อนโยบายรันไทม์ระดับผู้ให้บริการ/โมเดลเลือกระบุ `openclaw` อย่างชัดเจน

  </Accordion>
  <Accordion title="รันไทม์ CLI">
    รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดลแบบ canonical เช่น `anthropic/claude-*` หรือ `google/gemini-*` จากนั้นตั้งค่านโยบายรันไทม์ระดับผู้ให้บริการ/โมเดลเป็น `claude-cli` หรือ `google-gemini-cli` เมื่อคุณต้องการแบ็กเอนด์ CLI ในเครื่อง

    การอ้างอิง `claude-cli/*` และ `google-gemini-cli/*` แบบเดิมจะย้ายกลับไปยังการอ้างอิงผู้ให้บริการแบบ canonical โดยบันทึกรันไทม์แยกไว้ต่างหาก การอ้างอิง `codex-cli/*` แบบเดิมจะย้ายไปที่ `openai/*` และใช้เส้นทาง app-server ของ Codex; OpenClaw ไม่เก็บแบ็กเอนด์ Codex CLI แบบ bundled อีกต่อไป

  </Accordion>
</AccordionGroup>

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน Plugin ของผู้ให้บริการ (`registerProvider(...)`) ขณะที่ OpenClaw รักษาลูป inference ทั่วไปไว้ Plugin เป็นเจ้าของการเริ่มต้นใช้งาน, แคตตาล็อกโมเดล, การแมป env-var สำหรับการยืนยันตัวตน, การทำให้ transport/config เป็นมาตรฐาน, การล้าง tool-schema, การจัดประเภท failover, การ refresh OAuth, การรายงานการใช้งาน, โปรไฟล์ thinking/reasoning และอื่น ๆ

รายการ hook ของ provider-SDK และตัวอย่าง Plugin แบบ bundled ทั้งหมดอยู่ใน [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องการตัวดำเนินการคำขอแบบกำหนดเองทั้งหมดคือพื้นผิวส่วนขยายที่แยกต่างหากและลึกกว่า

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน hook ของผู้ให้บริการแบบชัดเจน เช่น นโยบาย replay, การทำให้ tool-schema เป็นมาตรฐาน, การห่อ stream และตัวช่วย transport/request ถุงคงที่ `ProviderPlugin.capabilities` แบบเดิมมีไว้เพื่อความเข้ากันได้เท่านั้น และตรรกะ runner ที่ใช้ร่วมกันไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียน API key

<AccordionGroup>
  <Accordion title="แหล่งที่มาของ key และลำดับความสำคัญ">
    กำหนดค่า key หลายรายการผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (การเขียนทับ live รายการเดียว ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วยจุลภาคหรืออัฒภาค)
    - `<PROVIDER>_API_KEY` (key หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือก key จะรักษาลำดับความสำคัญและลบค่าซ้ำ

  </Accordion>
  <Accordion title="เมื่อการหมุนเวียนเริ่มทำงาน">
    - คำขอจะถูกลองใหม่ด้วย key ถัดไปเฉพาะเมื่อเจอการตอบกลับแบบ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความจำกัดการใช้งานเป็นระยะ)
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่มีการพยายามหมุนเวียน key
    - เมื่อ key ผู้สมัครทั้งหมดล้มเหลว ข้อผิดพลาดสุดท้ายจะถูกคืนจากความพยายามครั้งสุดท้าย

  </Accordion>
</AccordionGroup>

## Plugin ผู้ให้บริการอย่างเป็นทางการ

Plugin ผู้ให้บริการอย่างเป็นทางการเผยแพร่แถวแคตตาล็อกโมเดลของตนเอง ผู้ให้บริการเหล่านี้ **ไม่** ต้องมีรายการโมเดลใน `models.providers`; เปิดใช้งาน Plugin ผู้ให้บริการ ตั้งค่าการยืนยันตัวตน แล้วเลือกโมเดล ใช้ `models.providers` เฉพาะสำหรับผู้ให้บริการแบบกำหนดเองอย่างชัดเจนหรือการตั้งค่าคำขอที่จำกัด เช่น timeout

### OpenAI

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: `OPENAI_API_KEY`
- การหมุนเวียนเสริม: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` และ `OPENCLAW_LIVE_OPENAI_KEY` (การเขียนทับรายการเดียว)
- โมเดลตัวอย่าง: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือ API key เฉพาะทำงานต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto`; OpenClaw ส่งตัวเลือก transport ไปยังรันไทม์โมเดลที่ใช้ร่วมกัน
- เขียนทับต่อโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- การประมวลผลลำดับความสำคัญของ OpenAI เปิดใช้งานได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะแมปคำขอ Responses แบบตรงของ `openai/*` ไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อคุณต้องการ tier แบบชัดเจนแทนปุ่มสลับ `/fast` ที่ใช้ร่วมกัน
- ส่วนหัว attribution ที่ซ่อนอยู่ของ OpenClaw (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบเนทีฟไปยัง `api.openai.com` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- เส้นทาง OpenAI แบบเนทีฟยังคงรักษา Responses `store`, คำใบ้ prompt-cache และการจัดรูป payload reasoning-compat ของ OpenAI; เส้นทาง proxy ไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` พร้อมใช้งานผ่านการยืนยันตัวตนแบบสมัครสมาชิก OAuth ของ ChatGPT/Codex เมื่อบัญชีที่ลงชื่อเข้าใช้ของคุณเปิดเผยโมเดลนี้; OpenClaw ยังคงระงับเส้นทาง OpenAI API-key และ Azure API-key แบบตรงสำหรับโมเดลนี้ เพราะ transport เหล่านั้นปฏิเสธโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- การยืนยันตัวตน: `ANTHROPIC_API_KEY`
- การหมุนเวียนเสริม: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` และ `OPENCLAW_LIVE_ANTHROPIC_KEY` (การเขียนทับรายการเดียว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะแบบตรงรองรับปุ่มสลับ `/fast` ที่ใช้ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิก API-key และ OAuth-authenticated ที่ส่งไปยัง `api.anthropic.com`; OpenClaw แมปสิ่งนั้นไปยัง `service_tier` ของ Anthropic (`auto` เทียบกับ `standard_only`)
- การกำหนดค่า Claude CLI ที่แนะนำจะเก็บการอ้างอิงโมเดลให้เป็น canonical และเลือกแบ็กเอนด์ CLI
  แยกต่างหาก: `anthropic/claude-opus-4-8` พร้อม
  `agentRuntime.id: "claude-cli"` แบบเจาะจงโมเดล การอ้างอิง
  `claude-cli/claude-opus-4-7` แบบเดิมยังคงใช้งานได้เพื่อความเข้ากันได้

<Note>
เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` ได้รับการอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ setup-token ของ Anthropic ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw แนะนำให้ใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: OAuth (ChatGPT)
- การอ้างอิงโมเดล OpenAI Codex แบบเดิม: `openai/gpt-5.5`
- การอ้างอิงฮาร์เนส app-server ของ Codex แบบเนทีฟ: `openai/gpt-5.5`
- เอกสารฮาร์เนส app-server ของ Codex แบบเนทีฟ: [ฮาร์เนส Codex](/th/plugins/codex-harness)
- การอ้างอิงโมเดลแบบเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai/*` โหลด Plugin OpenAI; Plugin app-server ของ Codex แบบเนทีฟถูกเลือกโดยรันไทม์ฮาร์เนส Codex
- CLI: `openclaw onboard --auth-choice openai` หรือ `openclaw models auth login --provider openai`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE เป็น fallback)
- เขียนทับต่อโมเดล OpenAI Codex ผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อบนคำขอ Responses ของ Codex แบบเนทีฟด้วย (`chatgpt.com/backend-api`)
- ส่วนหัว attribution ที่ซ่อนอยู่ของ OpenClaw (`originator`, `version`, `User-Agent`) จะถูกแนบเฉพาะกับทราฟฟิก Codex แบบเนทีฟไปยัง `chatgpt.com/backend-api` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- ใช้ปุ่มสลับ `/fast` และการกำหนดค่า `params.fastMode` เดียวกันกับ `openai/*` แบบตรง; OpenClaw แมปสิ่งนั้นไปยัง `service_tier=priority`
- `openai/gpt-5.5` ใช้ `contextWindow = 400000` แบบเนทีฟของแคตตาล็อก Codex และรันไทม์เริ่มต้น `contextTokens = 272000`; เขียนทับเพดานรันไทม์ด้วย `models.providers.openai.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw
- สำหรับเส้นทางสมัครสมาชิกทั่วไปพร้อมรันไทม์ Codex แบบเนทีฟ ให้ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai` และกำหนดค่า `openai/gpt-5.5`; รอบการทำงานของเอเจนต์ OpenAI จะเลือก Codex ตามค่าเริ่มต้น
- ใช้ `agentRuntime.id: "openclaw"` ระดับผู้ให้บริการ/โมเดล เฉพาะเมื่อคุณต้องการเส้นทาง OpenClaw ในตัว; มิฉะนั้นให้คง `openai/gpt-5.5` ไว้บนฮาร์เนส Codex เริ่มต้น
- การอ้างอิง Codex GPT แบบเดิมเป็นสถานะเก่า ไม่ใช่เส้นทางผู้ให้บริการที่ใช้งานอยู่ ใช้ `openai/gpt-5.5` บนรันไทม์ Codex แบบเนทีฟสำหรับการกำหนดค่าเอเจนต์ใหม่ และรัน `openclaw doctor --fix` เพื่อย้ายการอ้างอิงโมเดล Codex แบบเดิมไปยังการอ้างอิง `openai/*` แบบ canonical

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
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### ตัวเลือกโฮสต์แบบสมัครสมาชิกอื่น ๆ

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/th/providers/zai">
    Z.AI Coding Plan หรือ endpoint API ทั่วไป
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    OAuth ของ MiniMax Coding Plan หรือการเข้าถึงด้วย API key
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    พื้นผิวผู้ให้บริการ Qwen Cloud พร้อม Alibaba DashScope และการแมป endpoint ของ Coding Plan
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
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback ของ `GOOGLE_API_KEY` และ `OPENCLAW_LIVE_GEMINI_KEY` (เขียนทับเดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: config OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกปรับเป็น `google/gemini-3-flash-preview`
- นามแฝง: ยอมรับ `google/gemini-3.1-pro` และปรับเป็น id Gemini API แบบสดของ Google คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` ใช้ dynamic thinking ของ Google Gemini 3/3.1 ละเว้น `thinkingLevel` แบบคงที่; Gemini 2.5 ส่ง `thinkingBudget: -1`
- การรัน Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อแฮนเดิล `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; cache hit ของ Gemini จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตน

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานข้อจำกัดบัญชี Google หลังใช้ไคลเอนต์บุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
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

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่** ต้องวาง client id หรือ secret ลงใน `openclaw.json` โฟลว์เข้าสู่ระบบของ CLI จะจัดเก็บโทเค็นไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway

  </Step>
  <Step title="ตั้งค่าโปรเจกต์ (หากจำเป็น)">
    หากคำขอล้มเหลวหลังเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

Gemini CLI ใช้ `stream-json` เป็นค่าเริ่มต้น OpenClaw อ่านข้อความสตรีมของ assistant
และปรับ `stats.cached` เป็น `cacheRead`; การเขียนทับ `--output-format json` แบบเดิม
ยังคงอ่านข้อความตอบกลับจาก `response`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - การอ้างอิงโมเดลใช้ ID ผู้ให้บริการ `zai/*` แบบมาตรฐาน
  - `zai-api-key` ตรวจหา endpoint Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` บังคับใช้ surface เฉพาะ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- การยืนยันตัวตน: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Plugin ผู้ให้บริการที่รวมมาให้อื่น ๆ

| ผู้ให้บริการ                                | Id                               | env สำหรับการยืนยันตัวตน                                             | โมเดลตัวอย่าง                                              |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/th/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth หรือ `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/th/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth หรือ `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### เกร็ดที่ควรรู้

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้ส่วนหัว app-attribution และมาร์กเกอร์ Anthropic `cache_control` เฉพาะบนเส้นทาง `openrouter.ai` ที่ตรวจสอบแล้วเท่านั้น การอ้างอิง DeepSeek, Moonshot และ ZAI มีสิทธิ์ใช้ cache-TTL สำหรับ prompt caching ที่ OpenRouter จัดการ แต่จะไม่ได้รับมาร์กเกอร์ cache ของ Anthropic ในฐานะเส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI ระบบจะข้ามการจัดรูปเฉพาะ native-OpenAI เท่านั้น (`serviceTier`, Responses `store`, คำใบ้ prompt-cache, OpenAI reasoning-compat) การอ้างอิงที่มี Gemini อยู่เบื้องหลังจะคงไว้เฉพาะการล้าง thought-signature แบบ proxy-Gemini
  </Accordion>
  <Accordion title="Kilo Gateway">
    การอ้างอิงที่มี Gemini อยู่เบื้องหลังใช้เส้นทางการล้าง proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และการอ้างอิงอื่นที่พร็อกซีไม่รองรับ reasoning จะข้ามการฉีด proxy reasoning
  </Accordion>
  <Accordion title="MiniMax">
    การ onboarding ด้วย API key เขียนนิยามโมเดลแชต M3 และ M2.7 อย่างชัดเจน; ความเข้าใจรูปภาพยังคงอยู่บนผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    id โมเดลใช้ namespace แบบ `nvidia/<vendor>/<model>` (ตัวอย่างเช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกจะคงองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษร ขณะที่คีย์มาตรฐานที่ส่งไปยัง API ยังคงมีคำนำหน้าเดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง xAI Responses เส้นทางที่แนะนำคือ SuperGrok/X Premium OAuth; API key ยังคงใช้งานได้ผ่าน `XAI_API_KEY` หรือ config ของ Plugin และ Grok `web_search` ใช้โปรไฟล์การยืนยันตัวตนเดียวกันก่อน fallback ไป API key `grok-4.3` เป็นโมเดลแชตเริ่มต้นที่รวมมาให้ และ `grok-build-0.1` เลือกได้สำหรับงานที่เน้นการ build/coding `/fast` หรือ `params.fastMode: true` เขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` ของแต่ละรายการ `tool_stream` เปิดเป็นค่าเริ่มต้น; ปิดผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (URL แบบกำหนดเอง/ฐาน)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **แบบกำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่รวมมาด้านล่างจำนวนมากเผยแพร่แค็ตตาล็อกเริ่มต้นไว้อยู่แล้ว ใช้รายการ `models.providers.<id>` แบบชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL ฐานเริ่มต้น, ส่วนหัว หรือรายการโมเดล

การตรวจสอบความสามารถของโมเดล Gateway จะอ่านเมตาดาต้า `models.providers.<id>.models[]` ที่ระบุไว้อย่างชัดเจนด้วย หากโมเดลแบบกำหนดเองหรือพร็อกซียอมรับรูปภาพ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้ WebChat และเส้นทางไฟล์แนบจากต้นทาง node ส่งรูปภาพเป็นอินพุตโมเดลดั้งเดิม แทนที่จะเป็นการอ้างอิงสื่อแบบข้อความเท่านั้น

`agents.defaults.models["provider/model"]` ควบคุมเฉพาะการมองเห็นโมเดล นามแฝง และเมตาดาต้ารายโมเดลสำหรับเอเจนต์เท่านั้น มันไม่ได้ลงทะเบียนโมเดลรันไทม์ใหม่ด้วยตัวเอง สำหรับโมเดลผู้ให้บริการแบบกำหนดเอง ให้เพิ่ม `models.providers.<provider>.models[]` พร้อม `id` ที่ตรงกันเป็นอย่างน้อยด้วย

### Moonshot AI (Kimi)

ติดตั้ง `@openclaw/moonshot-provider` ก่อนเริ่มออนบอร์ด เพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณต้องแทนที่ URL ฐานหรือเมตาดาต้าโมเดล:

- ผู้ให้บริการ: `moonshot`
- การยืนยันตัวตน: `MOONSHOT_API_KEY`
- โมเดลตัวอย่าง: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

ID โมเดล Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

Kimi Coding ใช้เอนด์พอยต์ของ Moonshot AI ที่เข้ากันได้กับ Anthropic:

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

`kimi/kimi-code` และ `kimi/k2p5` แบบเดิมยังคงยอมรับเป็น ID โมเดลเพื่อความเข้ากันได้ และจะถูกปรับให้เป็น ID โมเดล API ที่เสถียรของ Kimi

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

การเริ่มต้นใช้งานตั้งค่าเริ่มต้นเป็นพื้นผิวสำหรับการเขียนโค้ด แต่แค็ตตาล็อกทั่วไป `volcengine/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตนของ Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากยังไม่ได้โหลดโมเดลเหล่านั้น OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดตามผู้ให้บริการแต่ไม่มีรายการ

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

### BytePlus (สากล)

BytePlus ARK ให้การเข้าถึงโมเดลเดียวกับ Volcano Engine สำหรับผู้ใช้สากล

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

การเริ่มต้นใช้งานตั้งค่าเริ่มต้นเป็นพื้นผิวสำหรับการเขียนโค้ด แต่แค็ตตาล็อกทั่วไป `byteplus/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตนของ BytePlus จะให้ความสำคัญกับทั้งแถว `byteplus/*` และ `byteplus-plan/*` หากยังไม่ได้โหลดโมเดลเหล่านั้น OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดตามผู้ให้บริการแต่ไม่มีรายการ

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

MiniMax กำหนดค่าผ่าน `models.providers` เพราะใช้ปลายทางแบบกำหนดเอง:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- คีย์ API ของ MiniMax (Global): `--auth-choice minimax-global-api`
- คีย์ API ของ MiniMax (CN): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดูรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่างการกำหนดค่าได้ที่ [/providers/minimax](/th/providers/minimax)

<Note>
บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ของ MiniMax OpenClaw จะปิดการคิดตามค่าเริ่มต้นสำหรับตระกูล M2.x เว้นแต่คุณจะตั้งค่าไว้อย่างชัดเจน; MiniMax-M3 (และ M3.x) จะยังคงใช้เส้นทางการคิดแบบละไว้/ปรับอัตโนมัติของผู้ให้บริการตามค่าเริ่มต้น `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแบ่งความสามารถที่เป็นของ Plugin:

- ค่าเริ่มต้นของข้อความ/แชตยังคงอยู่ที่ `minimax/MiniMax-M3`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การเข้าใจภาพเป็น `MiniMax-VL-01` ที่เป็นของ Plugin บนเส้นทางการยืนยันตัวตน MiniMax ทั้งสองแบบ
- การค้นหาเว็บยังคงอยู่บนรหัสผู้ให้บริการ `minimax`

### LM Studio

LM Studio จัดส่งเป็น Plugin ผู้ให้บริการแบบบันเดิลที่ใช้ API แบบเนทีฟ:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- URL ฐานสำหรับการอนุมานเริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งคืนโดย `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบเนทีฟของ LM Studio สำหรับการค้นหา + โหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานตามค่าเริ่มต้น หากคุณต้องการให้การโหลดแบบ JIT, TTL และการขับออกอัตโนมัติของ LM Studio เป็นเจ้าของวงจรชีวิตโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดูการตั้งค่าและการแก้ปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama จัดส่งเป็น Plugin ผู้ให้บริการแบบบันเดิลและใช้ API แบบเนทีฟของ Ollama:

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

Ollama จะถูกตรวจพบในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการแบบบันเดิลจะเพิ่ม Ollama เข้าไปใน `openclaw onboard` และตัวเลือกโมเดลโดยตรง ดูการเริ่มต้นใช้งาน โหมดคลาวด์/ภายในเครื่อง และการกำหนดค่าแบบกำหนดเองได้ที่ [/providers/ollama](/th/providers/ollama)

### vLLM

vLLM จัดส่งเป็น Plugin ผู้ให้บริการแบบบันเดิลสำหรับเซิร์ฟเวอร์ภายในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติในเครื่อง (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับการยืนยันตัวตน):

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

SGLang จัดส่งเป็น Plugin ผู้ให้บริการแบบบันเดิลสำหรับเซิร์ฟเวอร์ที่โฮสต์เองและเข้ากันได้กับ OpenAI ที่รวดเร็ว:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติในเครื่อง (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับการยืนยันตัวตน):

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
  <Accordion title="Default optional fields">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์ไม่บังคับ เมื่อละไว้ OpenClaw จะตั้งค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าอย่างชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - สำหรับ `api: "openai-completions"` บนปลายทางที่ไม่ใช่เนทีฟ (ค่า `baseUrl` ที่ไม่ว่างใด ๆ ซึ่งโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซียังข้ามการจัดรูปคำขอเฉพาะ OpenAI แบบเนทีฟ: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้ prompt-cache, ไม่มีการจัดรูปเพย์โหลดสำหรับความเข้ากันได้ด้านการคิดของ OpenAI และไม่มีส่วนหัวการระบุที่มาของ OpenClaw แบบซ่อน
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ฟิลด์เฉพาะผู้ขาย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อรวม JSON เพิ่มเติมเข้าในเนื้อหาคำขอขาออก
    - สำหรับตัวควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM แบบบันเดิลจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับการคิดของเซสชันปิดอยู่
    - สำหรับโมเดลภายในเครื่องที่ช้า หรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` ค่านี้จะขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึงการเชื่อมต่อ ส่วนหัว การสตรีมเนื้อหา และการยกเลิก guarded-fetch ทั้งหมด โดยไม่เพิ่มระยะหมดเวลาของรันเอเจนต์ทั้งชุด หาก `agents.defaults.timeoutSeconds` หรือระยะหมดเวลาเฉพาะรันต่ำกว่า ให้เพิ่มเพดานนั้นด้วย; ระยะหมดเวลาของผู้ให้บริการไม่สามารถขยายทั้งรันได้
    - การเรียก HTTP ของผู้ให้บริการโมเดลอนุญาตคำตอบ DNS แบบ fake-IP ของ Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์ `baseUrl` ของผู้ให้บริการที่กำหนดค่าไว้เท่านั้น ปลายทางผู้ให้บริการแบบกำหนดเอง/ภายในเครื่องยังเชื่อถือ origin `scheme://host:port` ที่กำหนดค่าไว้อย่างตรงตัวสำหรับคำขอโมเดลที่มีการป้องกัน รวมถึงโฮสต์ loopback, LAN และ tailnet นี่ไม่ใช่ตัวเลือกการกำหนดค่าใหม่; `baseUrl` ที่คุณกำหนดค่าจะขยายนโยบายคำขอเฉพาะสำหรับ origin นั้นเท่านั้น การอนุญาตชื่อโฮสต์ fake-IP และความเชื่อถือ origin ตรงตัวเป็นกลไกอิสระจากกัน ปลายทางส่วนตัว, loopback, link-local, metadata และพอร์ตอื่น ๆ ยังคงต้องเลือกใช้อย่างชัดเจนด้วย `models.providers.<id>.request.allowPrivateNetwork: true` ตั้งค่า `models.providers.<id>.request.allowPrivateNetwork: false` เพื่อยกเลิกความเชื่อถือ origin ตรงตัว
    - หาก `baseUrl` ว่าง/ละไว้ OpenClaw จะคงพฤติกรรมเริ่มต้นของ OpenAI ไว้ (ซึ่ง resolve ไปที่ `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ตั้งไว้อย่างชัดเจนยังคงถูกแทนที่บนปลายทาง `openai-completions` ที่ไม่ใช่เนทีฟ
    - สำหรับ `api: "anthropic-messages"` บนปลายทางที่ไม่ใช่โดยตรง (ผู้ให้บริการใด ๆ ที่ไม่ใช่ `anthropic` ตามมาตรฐาน หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่โฮสต์ไม่ใช่ปลายทาง `api.anthropic.com` สาธารณะ) OpenClaw จะระงับส่วนหัว Anthropic beta โดยนัย เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และเครื่องหมาย OAuth เพื่อให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ไม่ปฏิเสธแฟล็ก beta ที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีของคุณต้องใช้ฟีเจอร์ beta เฉพาะ

  </Accordion>
</AccordionGroup>

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบครบถ้วน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) - คีย์การกำหนดค่าโมเดล
- [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover) - เชนสำรองและพฤติกรรมการลองใหม่
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและนามแฝง
- [ผู้ให้บริการ](/th/providers) - คู่มือการตั้งค่าแยกตามผู้ให้บริการ
