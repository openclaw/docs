---
read_when:
    - คุณต้องมีข้อมูลอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการ
    - คุณต้องการการกำหนดค่าตัวอย่างหรือคำสั่ง CLI สำหรับการเริ่มต้นใช้งานผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมการกำหนดค่าตัวอย่าง + ขั้นตอนการทำงาน CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-05-10T19:33:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 643ee88e7d0cf4f9fe148ae8e390a1d7bba4986c29dd4fda6074f048f58dd7bb
    source_path: concepts/model-providers.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models)

## กฎแบบรวดเร็ว

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` ทำหน้าที่เป็นรายการที่อนุญาตเมื่อมีการตั้งค่า
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` แทนที่ค่าเหล่านั้นรายโมเดล
    - กฎสำรอง การตรวจสอบช่วงพัก และการคงอยู่ของการแทนที่ระดับเซสชัน: [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)

  </Accordion>
  <Accordion title="การเพิ่มการยืนยันตัวตนของผู้ให้บริการไม่เปลี่ยนโมเดลหลักของคุณ">
    `openclaw configure` จะคง `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อคุณเพิ่มหรือยืนยันตัวตนผู้ให้บริการใหม่ Plugin ของผู้ให้บริการอาจยังคืนค่าโมเดลเริ่มต้นที่แนะนำในแพตช์การกำหนดค่าการยืนยันตัวตน แต่ configure จะมองค่านั้นเป็น "ทำให้โมเดลนี้พร้อมใช้งาน" เมื่อมีโมเดลหลักอยู่แล้ว ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน"

    หากต้องการเปลี่ยนโมเดลเริ่มต้นโดยตั้งใจ ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`

  </Accordion>
  <Accordion title="การแยกผู้ให้บริการ/รันไทม์ของ OpenAI">
    เส้นทางตระกูล OpenAI ระบุด้วยคำนำหน้าเฉพาะ:

    - `openai/<model>` ใช้ Codex app-server harness แบบเนทีฟสำหรับเทิร์นของเอเจนต์ตามค่าเริ่มต้น นี่คือการตั้งค่าสมัครสมาชิก ChatGPT/Codex โดยทั่วไป
    - `openai-codex/<model>` เป็นการกำหนดค่าเดิมที่ doctor เขียนใหม่เป็น `openai/<model>`
    - `openai/<model>` พร้อมผู้ให้บริการ/โมเดล `agentRuntime.id: "pi"` ใช้ PI สำหรับเส้นทางที่ระบุ API key หรือเส้นทางความเข้ากันได้อย่างชัดเจน

    ดู [OpenAI](/th/providers/openai) และ [Codex harness](/th/plugins/codex-harness) หากการแยกผู้ให้บริการ/รันไทม์ทำให้สับสน ให้อ่าน [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้ Plugin อัตโนมัติใช้ขอบเขตเดียวกัน: การอ้างอิงเอเจนต์ `openai/*` จะเปิดใช้ Plugin Codex สำหรับเส้นทางเริ่มต้น และผู้ให้บริการ/โมเดลที่ระบุ `agentRuntime.id: "codex"` อย่างชัดเจน หรือการอ้างอิงเดิม `codex/<model>` ก็ต้องใช้ Plugin นี้เช่นกัน

    GPT-5.5 พร้อมใช้งานผ่าน Codex app-server harness แบบเนทีฟตามค่าเริ่มต้นบน `openai/gpt-5.5` และผ่าน PI เฉพาะเมื่อ policy รันไทม์ของผู้ให้บริการ/โมเดลเลือก `pi` อย่างชัดเจนเท่านั้น

  </Accordion>
  <Accordion title="รันไทม์ CLI">
    รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดลมาตรฐาน เช่น `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` จากนั้นตั้งค่า policy รันไทม์ของผู้ให้บริการ/โมเดลเป็น `claude-cli`, `google-gemini-cli` หรือ `codex-cli` เมื่อคุณต้องการแบ็กเอนด์ CLI ภายในเครื่อง

    การอ้างอิงเดิม `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` จะย้ายกลับไปยังการอ้างอิงผู้ให้บริการมาตรฐาน โดยบันทึกรันไทม์แยกไว้ต่างหาก

  </Accordion>
</AccordionGroup>

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน Plugin ของผู้ให้บริการ (`registerProvider(...)`) ขณะที่ OpenClaw คงลูปอนุมานทั่วไปไว้ Plugin เป็นเจ้าของการเริ่มต้นใช้งาน แค็ตตาล็อกโมเดล การแมป env var สำหรับการยืนยันตัวตน การปรับ transport/config ให้เป็นมาตรฐาน การล้างสคีมาเครื่องมือ การจำแนกการสลับเมื่อขัดข้อง การรีเฟรช OAuth การรายงานการใช้งาน โปรไฟล์การคิด/การให้เหตุผล และอื่นๆ

รายการ hook ของ provider-SDK ทั้งหมดและตัวอย่าง Plugin ที่มาพร้อมระบบอยู่ใน [Plugin ของผู้ให้บริการ](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ตัวดำเนินการคำขอแบบกำหนดเองทั้งหมดเป็นพื้นผิวส่วนขยายที่แยกต่างหากและลึกกว่า

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน hook ของผู้ให้บริการที่ระบุอย่างชัดเจน เช่น policy การเล่นซ้ำ การปรับสคีมาเครื่องมือให้เป็นมาตรฐาน การห่อสตรีม และตัวช่วย transport/request ถุงสแตติก `ProviderPlugin.capabilities` แบบเดิมมีไว้เพื่อความเข้ากันได้เท่านั้น และตรรกะ runner ที่ใช้ร่วมกันจะไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียน API key

<AccordionGroup>
  <Accordion title="แหล่งที่มาของ key และลำดับความสำคัญ">
    กำหนดค่า key หลายรายการผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (การแทนที่สดรายการเดียว ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วยจุลภาคหรืออัฒภาค)
    - `<PROVIDER>_API_KEY` (key หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือก key จะรักษาลำดับความสำคัญและตัดค่าซ้ำออก

  </Accordion>
  <Accordion title="เมื่อใดที่การหมุนเวียนเริ่มทำงาน">
    - คำขอจะถูกลองใหม่ด้วย key ถัดไปเฉพาะเมื่อได้รับคำตอบแบบจำกัดอัตราเท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความจำกัดการใช้งานเป็นระยะ)
    - ความล้มเหลวที่ไม่ใช่การจำกัดอัตราจะล้มเหลวทันที; จะไม่มีการพยายามหมุนเวียน key
    - เมื่อ key ผู้สมัครทั้งหมดล้มเหลว ข้อผิดพลาดสุดท้ายจะถูกคืนจากความพยายามครั้งสุดท้าย

  </Accordion>
</AccordionGroup>

## ผู้ให้บริการในตัว (แค็ตตาล็อก pi-ai)

OpenClaw มาพร้อมแค็ตตาล็อก pi-ai ผู้ให้บริการเหล่านี้ไม่ต้องใช้การกำหนดค่า `models.providers` **เลย**; เพียงตั้งค่าการยืนยันตัวตนและเลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: `OPENAI_API_KEY`
- การหมุนเวียนที่เป็นทางเลือก: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (การแทนที่รายการเดียว)
- โมเดลตัวอย่าง: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือ API key เฉพาะทำงานต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto`; OpenClaw ส่งตัวเลือก transport ให้ pi-ai
- แทนที่รายโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- การประมวลผลลำดับความสำคัญของ OpenAI เปิดใช้ได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` แมปคำขอ Responses แบบ `openai/*` โดยตรงไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อคุณต้องการระดับที่ระบุชัดเจนแทนสวิตช์ `/fast` ที่ใช้ร่วมกัน
- header แสดงที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบเนทีฟไปยัง `api.openai.com` ไม่ใช่พร็อกซีที่เข้ากันได้กับ OpenAI ทั่วไป
- เส้นทาง OpenAI แบบเนทีฟยังคงเก็บ Responses `store`, คำใบ้ prompt-cache และการปรับรูปแบบ payload เพื่อความเข้ากันได้กับการให้เหตุผลของ OpenAI; เส้นทางพร็อกซีไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` ถูกระงับโดยตั้งใจใน OpenClaw เพราะคำขอ OpenAI API แบบสดปฏิเสธโมเดลนี้ และแค็ตตาล็อก Codex ปัจจุบันไม่แสดงโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- การยืนยันตัวตน: `ANTHROPIC_API_KEY`
- การหมุนเวียนที่เป็นทางเลือก: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (การแทนที่รายการเดียว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะโดยตรงรองรับสวิตช์ `/fast` ที่ใช้ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิกที่ใช้ API key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw แมปค่านั้นไปยัง `service_tier` ของ Anthropic (`auto` เทียบกับ `standard_only`)
- การกำหนดค่า Claude CLI ที่แนะนำคงการอ้างอิงโมเดลให้เป็นมาตรฐานและเลือกแบ็กเอนด์ CLI
  แยกต่างหาก: `anthropic/claude-opus-4-7` พร้อม
  `agentRuntime.id: "claude-cli"` ในขอบเขตโมเดล การอ้างอิงเดิม
  `claude-cli/claude-opus-4-7` ยังคงทำงานเพื่อความเข้ากันได้

<Note>
เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI กลับมาใช้ซ้ำและการใช้ `claude -p` ได้รับการอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่ policy ใหม่ setup-token ของ Anthropic ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw เลือกใช้การนำ Claude CLI กลับมาใช้ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- การยืนยันตัวตน: OAuth (ChatGPT)
- การอ้างอิงโมเดล PI เดิม: `openai-codex/gpt-5.5`
- การอ้างอิง Codex app-server harness แบบเนทีฟ: `openai/gpt-5.5`
- เอกสาร Codex app-server harness แบบเนทีฟ: [Codex harness](/th/plugins/codex-harness)
- การอ้างอิงโมเดลเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` โหลด Plugin OpenAI; Plugin Codex app-server แบบเนทีฟจะถูกเลือกเฉพาะโดยรันไทม์ Codex harness หรือการอ้างอิงเดิม `codex/*`
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE เป็น fallback)
- แทนที่รายโมเดล PI ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อบนคำขอ Codex Responses แบบเนทีฟด้วย (`chatgpt.com/backend-api`)
- header แสดงที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`) จะแนบเฉพาะกับทราฟฟิก Codex แบบเนทีฟไปยัง `chatgpt.com/backend-api` ไม่ใช่พร็อกซีที่เข้ากันได้กับ OpenAI ทั่วไป
- ใช้สวิตช์ `/fast` และการกำหนดค่า `params.fastMode` เดียวกันกับ `openai/*` โดยตรง; OpenClaw แมปค่านั้นไปยัง `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้ `contextWindow = 400000` แบบเนทีฟของแค็ตตาล็อก Codex และรันไทม์เริ่มต้น `contextTokens = 272000`; แทนที่เพดานรันไทม์ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุ policy: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw
- สำหรับเส้นทางทั่วไปแบบ subscription บวกกับรันไทม์ Codex แบบเนทีฟ ให้ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai-codex` แต่กำหนดค่า `openai/gpt-5.5`; เทิร์นเอเจนต์ OpenAI จะเลือก Codex ตามค่าเริ่มต้น
- ใช้ผู้ให้บริการ/โมเดล `agentRuntime.id: "pi"` เฉพาะเมื่อคุณต้องการเส้นทางความเข้ากันได้ผ่าน PI; มิฉะนั้นให้คง `openai/gpt-5.5` ไว้บน Codex harness เริ่มต้น
- การอ้างอิง `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` และ `openai-codex/gpt-5.3*` รุ่นเก่าถูกระงับ เพราะบัญชี ChatGPT/Codex OAuth ปฏิเสธโมเดลเหล่านี้; ใช้ `openai-codex/gpt-5.5` หรือเส้นทางรันไทม์ Codex แบบเนทีฟแทน

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

### ตัวเลือกโฮสต์แบบ subscription อื่นๆ

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
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, การสำรองไปใช้ `GOOGLE_API_KEY`, และ `OPENCLAW_LIVE_GEMINI_KEY` (การแทนที่ค่าเดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: การกำหนดค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกปรับให้เป็น `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` ได้รับการยอมรับและถูกปรับให้เป็น ID Gemini API แบบสดของ Google คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` ใช้ Google dynamic thinking Gemini 3/3.1 จะละ `thinkingLevel` แบบคงที่ไว้; Gemini 2.5 ส่ง `thinkingBudget: -1`
- การรัน Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือแบบเดิม `cached_content`) เพื่อส่งต่อแฮนเดิล `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; การ hit แคชของ Gemini จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตนเอง

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมอย่างไม่เป็นทางการ ผู้ใช้บางรายรายงานว่าบัญชี Google ถูกจำกัดหลังจากใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
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

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่** ต้องวาง client id หรือ secret ลงใน `openclaw.json` โฟลว์การเข้าสู่ระบบของ CLI จะเก็บโทเค็นไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway

  </Step>
  <Step title="Set project (if needed)">
    หากคำขอล้มเหลวหลังเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

การตอบกลับ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; การใช้งานจะ fallback ไปที่ `stats` โดย `stats.cached` จะถูกปรับให้เป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` และ `z-ai/*` จะถูกปรับให้เป็น `zai/*`
  - `zai-api-key` ตรวจหาเอ็นด์พอยต์ Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global`, และ `zai-cn` บังคับใช้พื้นผิวเฉพาะ

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
- แค็ตตาล็อกสำรองแบบคงที่จัดส่ง `kilocode/kilo/auto`; การค้นพบแบบสดที่ `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อกรันไทม์เพิ่มเติมได้
- การกำหนดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้ hard-code ไว้ใน OpenClaw

ดูรายละเอียดการตั้งค่าที่ [/providers/kilocode](/th/providers/kilocode)

### Provider Plugin อื่นๆ ที่รวมมาให้

| ผู้ให้บริการ            | รหัส                             | env สำหรับการยืนยันตัวตน                                    | โมเดลตัวอย่าง                                  |
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
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` หรือ `KIMICODE_API_KEY`                       | `kimi/kimi-for-coding`                        |
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

#### สิ่งเฉพาะที่ควรรู้

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้ส่วนหัว app-attribution และมาร์กเกอร์ Anthropic `cache_control` เฉพาะบนเส้นทาง `openrouter.ai` ที่ผ่านการตรวจสอบแล้วเท่านั้น รีเฟอเรนซ์ DeepSeek, Moonshot และ ZAI เข้าเกณฑ์ cache-TTL สำหรับการแคชพรอมป์ที่ OpenRouter จัดการ แต่จะไม่ได้รับมาร์กเกอร์แคชของ Anthropic ในฐานะเส้นทางสไตล์พร็อกซีที่เข้ากันได้กับ OpenAI จึงข้ามการจัดรูปแบบที่ใช้เฉพาะ native-OpenAI (`serviceTier`, Responses `store`, คำใบ้ prompt-cache, OpenAI reasoning-compat) รีเฟอเรนซ์ที่มี Gemini อยู่เบื้องหลังจะคงไว้เฉพาะการทำความสะอาด thought-signature แบบ proxy-Gemini
  </Accordion>
  <Accordion title="Kilo Gateway">
    รีเฟอเรนซ์ที่มี Gemini อยู่เบื้องหลังจะใช้เส้นทางการทำความสะอาด proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และรีเฟอเรนซ์อื่นที่พร็อกซีไม่รองรับ reasoning จะข้ามการฉีด proxy reasoning
  </Accordion>
  <Accordion title="MiniMax">
    การเริ่มใช้งานด้วย API key จะเขียนนิยามโมเดลแชต M2.7 แบบข้อความเท่านั้นไว้อย่างชัดเจน; ความเข้าใจภาพยังคงอยู่บนผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    รหัสโมเดลใช้เนมสเปซ `nvidia/<vendor>/<model>` (เช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกจะรักษาองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษร ขณะที่คีย์ canonical ที่ส่งไปยัง API ยังคงมีคำนำหน้าเดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง xAI Responses `grok-4.3` เป็นโมเดลแชตเริ่มต้นที่บันเดิลมา `/fast` หรือ `params.fastMode: true` จะเขียน `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` ของแต่ละรายการ `tool_stream` เปิดตามค่าเริ่มต้น; ปิดได้ผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
  <Accordion title="Cerebras">
    จัดส่งเป็น Plugin ผู้ให้บริการ `cerebras` ที่บันเดิลมา GLM ใช้ `zai-glm-4.7`; OpenAI-compatible base URL คือ `https://api.cerebras.ai/v1`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (กำหนดเอง/URL พื้นฐาน)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **กำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่บันเดิลมาหลายรายการด้านล่างเผยแพร่แค็ตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` ที่ระบุชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL พื้นฐาน ส่วนหัว หรือรายการโมเดลเริ่มต้น

การตรวจสอบความสามารถของโมเดล Gateway จะอ่านเมทาดาทา `models.providers.<id>.models[]` ที่ระบุชัดเจนด้วย หากโมเดลกำหนดเองหรือโมเดลพร็อกซียอมรับรูปภาพ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้ WebChat และเส้นทางไฟล์แนบที่มีต้นทางจากโหนดส่งรูปภาพเป็นอินพุตโมเดลแบบเนทีฟ แทนที่จะเป็นรีเฟอเรนซ์สื่อแบบข้อความเท่านั้น

`agents.defaults.models["provider/model"]` ควบคุมเฉพาะการมองเห็นโมเดล นามแฝง และเมทาดาทาต่อโมเดลสำหรับเอเจนต์เท่านั้น โดยตัวมันเองจะไม่ลงทะเบียนโมเดลรันไทม์ใหม่ สำหรับโมเดลผู้ให้บริการกำหนดเอง ให้เพิ่ม `models.providers.<provider>.models[]` พร้อม `id` ที่ตรงกันเป็นอย่างน้อยด้วย

### Moonshot AI (Kimi)

Moonshot จัดส่งเป็น Plugin ผู้ให้บริการที่บันเดิลมา ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` ที่ระบุชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL พื้นฐานหรือเมทาดาทาโมเดล:

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

Kimi Coding ใช้ endpoint ที่เข้ากันได้กับ Anthropic ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- การยืนยันตัวตน: `KIMI_API_KEY`
- ตัวอย่างโมเดล: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

`kimi/kimi-code` และ `kimi/k2p5` รุ่นเดิมยังคงยอมรับเป็นรหัสโมเดลเพื่อความเข้ากันได้ และจะถูกทำให้เป็นรหัสโมเดล API เสถียรของ Kimi

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่น ๆ ในจีน

- ผู้ให้บริการ: `volcengine` (สำหรับเขียนโค้ด: `volcengine-plan`)
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

การเริ่มต้นใช้งานจะใช้พื้นผิวสำหรับการเขียนโค้ดเป็นค่าเริ่มต้น แต่แคตตาล็อกทั่วไป `volcengine/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตน Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด OpenClaw จะย้อนกลับไปใช้แคตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดตามผู้ให้บริการซึ่งว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="โมเดลสำหรับเขียนโค้ด (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (นานาชาติ)

BytePlus ARK ให้การเข้าถึงโมเดลเดียวกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

- ผู้ให้บริการ: `byteplus` (สำหรับเขียนโค้ด: `byteplus-plan`)
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

การเริ่มต้นใช้งานจะใช้พื้นผิวสำหรับการเขียนโค้ดเป็นค่าเริ่มต้น แต่แคตตาล็อกทั่วไป `byteplus/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตน BytePlus จะให้ความสำคัญกับทั้งแถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด OpenClaw จะย้อนกลับไปใช้แคตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดตามผู้ให้บริการซึ่งว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="โมเดลสำหรับเขียนโค้ด (byteplus-plan)">
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

- MiniMax OAuth (ทั่วโลก): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- คีย์ API MiniMax (ทั่วโลก): `--auth-choice minimax-global-api`
- คีย์ API MiniMax (CN): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดู [/providers/minimax](/th/providers/minimax) สำหรับรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่างการกำหนดค่า

<Note>
บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ของ MiniMax OpenClaw จะปิด thinking เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าไว้อย่างชัดเจน และ `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแบ่งขีดความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังอยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การเข้าใจภาพคือ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนทั้งสองเส้นทางการยืนยันตัวตนของ MiniMax
- การค้นเว็บยังอยู่บนรหัสผู้ให้บริการ `minimax`

### LM Studio

LM Studio มาพร้อมเป็น Plugin ผู้ให้บริการแบบ bundled ซึ่งใช้ API ดั้งเดิม:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- URL ฐานสำหรับการอนุมานค่าเริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งกลับจาก `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` ดั้งเดิมของ LM Studio สำหรับการค้นพบและการโหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานเป็นค่าเริ่มต้น หากคุณต้องการให้การโหลด JIT, TTL และการขับออกอัตโนมัติของ LM Studio เป็นผู้จัดการวงจรชีวิตโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดู [/providers/lmstudio](/th/providers/lmstudio) สำหรับการตั้งค่าและการแก้ไขปัญหา

### Ollama

Ollama มาพร้อมเป็น Plugin ผู้ให้บริการแบบ bundled และใช้ API ดั้งเดิมของ Ollama:

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

Ollama จะถูกตรวจพบภายในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการแบบ bundled จะเพิ่ม Ollama เข้าใน `openclaw onboard` และตัวเลือกโมเดลโดยตรง ดู [/providers/ollama](/th/providers/ollama) สำหรับการเริ่มต้นใช้งาน โหมดคลาวด์/ภายในเครื่อง และการกำหนดค่าแบบกำหนดเอง

### vLLM

vLLM มาพร้อมเป็น Plugin ผู้ให้บริการแบบ bundled สำหรับเซิร์ฟเวอร์ภายในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานค่าเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติภายในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับการยืนยันตัวตน):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งกลับจาก `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดู [/providers/vllm](/th/providers/vllm) สำหรับรายละเอียด

### SGLang

SGLang มาพร้อมเป็น Plugin ผู้ให้บริการแบบ bundled สำหรับเซิร์ฟเวอร์ที่โฮสต์เองและเข้ากันได้กับ OpenAI ที่รวดเร็ว:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานค่าเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติภายในเครื่อง (ใช้ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับการยืนยันตัวตน):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งในรหัสที่ส่งกลับจาก `/v1/models`):

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
  <Accordion title="ฟิลด์เสริมค่าเริ่มต้น">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์เสริมได้ เมื่อไม่ระบุ OpenClaw จะใช้ค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าที่ชัดเจนซึ่งตรงกับขีดจำกัดของพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="กฎการจัดรูปเส้นทางพร็อกซี">
    - สำหรับ `api: "openai-completions"` บน endpoint ที่ไม่ใช่ดั้งเดิม (ทุก `baseUrl` ที่ไม่ว่างและโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซีจะข้ามการจัดรูปคำขอเฉพาะ OpenAI ดั้งเดิมด้วย: ไม่มี `service_tier`, ไม่มี `store` ของ Responses, ไม่มี `store` ของ Completions, ไม่มีคำใบ้ prompt-cache, ไม่มีการจัดรูป payload ความเข้ากันได้ของ reasoning ของ OpenAI และไม่มี header การระบุแหล่งที่มาของ OpenClaw แบบซ่อน
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ฟิลด์เฉพาะผู้ขาย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อรวม JSON เพิ่มเติมเข้าในเนื้อหาคำขอขาออก
    - สำหรับตัวควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM แบบ bundled จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับ thinking ของเซสชันปิดอยู่
    - สำหรับโมเดลภายในเครื่องที่ช้าหรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` ค่านี้จะขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึง connect, headers, body streaming และการยกเลิก guarded-fetch ทั้งหมด โดยไม่เพิ่ม timeout ของรันไทม์เอเจนต์ทั้งหมด
    - การเรียก HTTP ของผู้ให้บริการโมเดลอนุญาตคำตอบ DNS แบบ fake-IP ของ Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์ `baseUrl` ของผู้ให้บริการที่กำหนดค่าไว้เท่านั้น ปลายทางส่วนตัว local loopback link-local และ metadata อื่น ๆ ยังต้องเลือกใช้ `models.providers.<id>.request.allowPrivateNetwork: true` อย่างชัดเจน
    - หาก `baseUrl` ว่าง/ไม่ระบุ OpenClaw จะคงพฤติกรรม OpenAI ค่าเริ่มต้นไว้ (ซึ่ง resolve ไปที่ `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ระบุอย่างชัดเจนยังคงถูกแทนที่บน endpoint `openai-completions` ที่ไม่ใช่ดั้งเดิม
    - สำหรับ `api: "anthropic-messages"` บน endpoint ที่ไม่ใช่โดยตรง (ผู้ให้บริการใด ๆ ที่ไม่ใช่ `anthropic` แบบ canonical หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่โฮสต์ไม่ใช่ endpoint สาธารณะ `api.anthropic.com`) OpenClaw จะระงับ header เบต้า Anthropic โดยนัย เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และเครื่องหมาย OAuth เพื่อให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ไม่ปฏิเสธธงเบต้าที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีของคุณต้องใช้ฟีเจอร์เบต้าเฉพาะ

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
- [การสลับโมเดลเมื่อทำงานล้มเหลว](/th/concepts/model-failover) - เชน fallback และพฤติกรรมการลองใหม่
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและ alias
- [ผู้ให้บริการ](/th/providers) - คู่มือการตั้งค่าแยกตามผู้ให้บริการ
