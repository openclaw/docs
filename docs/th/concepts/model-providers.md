---
read_when:
    - คุณต้องมีเอกสารอ้างอิงการตั้งค่าโมเดลแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่างการกำหนดค่าหรือคำสั่ง CLI สำหรับการเริ่มต้นใช้งานผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมของผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่า + โฟลว์ CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-06-27T17:27:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องแชทอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models)

## กฎแบบย่อ

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` ทำหน้าที่เป็น allowlist เมื่อกำหนดค่าไว้
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` จะแทนที่ค่าเหล่านั้นเป็นรายโมเดล
    - กฎ fallback, cooldown probes และการคงอยู่ของการแทนที่ระดับเซสชัน: [Model failover](/th/concepts/model-failover)

  </Accordion>
  <Accordion title="การเพิ่มการยืนยันตัวตนของผู้ให้บริการไม่เปลี่ยนโมเดลหลักของคุณ">
    `openclaw configure` จะคงค่า `agents.defaults.model.primary` ที่มีอยู่ไว้เมื่อคุณเพิ่มหรือยืนยันตัวตนผู้ให้บริการอีกครั้ง `openclaw models auth login` ทำแบบเดียวกัน เว้นแต่คุณจะส่ง `--set-default` Plugin ผู้ให้บริการอาจยังคืนค่าโมเดลเริ่มต้นที่แนะนำในแพตช์การกำหนดค่าการยืนยันตัวตน แต่ OpenClaw จะตีความค่านั้นว่า "ทำให้โมเดลนี้พร้อมใช้งาน" เมื่อมีโมเดลหลักอยู่แล้ว ไม่ใช่ "แทนที่โมเดลหลักปัจจุบัน"

    หากต้องการสลับโมเดลเริ่มต้นโดยตั้งใจ ให้ใช้ `openclaw models set <provider/model>` หรือ `openclaw models auth login --provider <id> --set-default`

  </Accordion>
  <Accordion title="การแยกผู้ให้บริการ/รันไทม์ของ OpenAI">
    เส้นทางตระกูล OpenAI เจาะจงตามคำนำหน้า:

    - `openai/<model>` ใช้ฮาร์เนส app-server ของ Codex แบบเนทีฟสำหรับรอบการทำงานของ agent ตามค่าเริ่มต้น นี่คือการตั้งค่าการสมัครสมาชิก ChatGPT/Codex ที่ใช้กันทั่วไป
    - การอ้างอิงโมเดล Codex แบบเก่าเป็นการกำหนดค่าเดิมที่ doctor เขียนใหม่เป็น `openai/<model>`
    - `openai/<model>` พร้อม provider/model `agentRuntime.id: "openclaw"` ใช้รันไทม์ในตัวของ OpenClaw สำหรับเส้นทาง API-key หรือความเข้ากันได้แบบชัดเจน

    ดู [OpenAI](/th/providers/openai) และ [ฮาร์เนส Codex](/th/plugins/codex-harness) หากการแยกผู้ให้บริการ/รันไทม์ทำให้สับสน ให้อ่าน [รันไทม์ของ Agent](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้ Plugin อัตโนมัติใช้ขอบเขตเดียวกัน: การอ้างอิง agent แบบ `openai/*` เปิดใช้ Plugin Codex สำหรับเส้นทางเริ่มต้น และ provider/model `agentRuntime.id: "codex"` แบบชัดเจนหรือการอ้างอิงเดิม `codex/<model>` ก็ต้องใช้ Plugin นี้เช่นกัน

    GPT-5.5 พร้อมใช้งานผ่านฮาร์เนส app-server ของ Codex แบบเนทีฟตามค่าเริ่มต้นบน `openai/gpt-5.5` และผ่านรันไทม์ OpenClaw เมื่อนโยบายรันไทม์ provider/model เลือก `openclaw` อย่างชัดเจน

  </Accordion>
  <Accordion title="รันไทม์ CLI">
    รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดลมาตรฐาน เช่น `anthropic/claude-*` หรือ `google/gemini-*` จากนั้นตั้งนโยบายรันไทม์ provider/model เป็น `claude-cli` หรือ `google-gemini-cli` เมื่อคุณต้องการแบ็กเอนด์ CLI ในเครื่อง

    การอ้างอิงเดิม `claude-cli/*` และ `google-gemini-cli/*` จะย้ายกลับเป็นการอ้างอิงผู้ให้บริการมาตรฐาน โดยบันทึกรันไทม์แยกต่างหาก การอ้างอิงเดิม `codex-cli/*` จะย้ายเป็น `openai/*` และใช้เส้นทาง app-server ของ Codex; OpenClaw ไม่เก็บแบ็กเอนด์ Codex CLI ที่ bundled ไว้อีกต่อไป

  </Accordion>
</AccordionGroup>

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน Plugin ผู้ให้บริการ (`registerProvider(...)`) ขณะที่ OpenClaw รักษาลูป inference ทั่วไปไว้ Plugin เป็นเจ้าของ onboarding, แค็ตตาล็อกโมเดล, การแมป env-var สำหรับการยืนยันตัวตน, การทำให้ transport/config เป็นมาตรฐาน, การล้าง tool-schema, การจัดประเภท failover, การรีเฟรช OAuth, การรายงานการใช้งาน, โปรไฟล์ thinking/reasoning และอื่นๆ

รายการ hook ของ provider-SDK และตัวอย่าง bundled-plugin ทั้งหมดอยู่ใน [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องใช้ตัวดำเนินการคำขอแบบกำหนดเองทั้งหมดเป็นพื้นผิวส่วนขยายที่แยกต่างหากและลึกกว่า

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน hook ผู้ให้บริการแบบชัดเจน เช่น นโยบาย replay, การทำให้ tool-schema เป็นมาตรฐาน, การห่อ stream และตัวช่วย transport/request ถุง static เดิม `ProviderPlugin.capabilities` มีไว้เพื่อความเข้ากันได้เท่านั้น และตรรกะ runner ที่ใช้ร่วมกันจะไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียนคีย์ API

<AccordionGroup>
  <Accordion title="แหล่งที่มาของคีย์และลำดับความสำคัญ">
    กำหนดค่าหลายคีย์ผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (การแทนที่ live แบบเดี่ยว ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วยจุลภาคหรืออัฒภาค)
    - `<PROVIDER>_API_KEY` (คีย์หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือกคีย์จะรักษาลำดับความสำคัญและตัดค่าซ้ำออก

  </Accordion>
  <Accordion title="เมื่อการหมุนเวียนเริ่มทำงาน">
    - คำขอจะลองใหม่ด้วยคีย์ถัดไปเฉพาะเมื่อได้รับการตอบกลับ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความขีดจำกัดการใช้งานเป็นระยะ)
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่พยายามหมุนเวียนคีย์
    - เมื่อคีย์ผู้สมัครทั้งหมดล้มเหลว ข้อผิดพลาดสุดท้ายจะถูกส่งคืนจากความพยายามครั้งสุดท้าย

  </Accordion>
</AccordionGroup>

## Plugin ผู้ให้บริการทางการ

Plugin ผู้ให้บริการทางการเผยแพร่แถวแค็ตตาล็อกโมเดลของตนเอง ผู้ให้บริการเหล่านี้ไม่ต้องมีรายการโมเดล `models.providers` **เลย**; เปิดใช้ Plugin ผู้ให้บริการ ตั้งค่าการยืนยันตัวตน แล้วเลือกโมเดล ใช้ `models.providers` เฉพาะสำหรับผู้ให้บริการแบบกำหนดเองอย่างชัดเจนหรือการตั้งค่าคำขอเฉพาะทาง เช่น timeout

### OpenAI

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: `OPENAI_API_KEY`
- การหมุนเวียนเสริม: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (การแทนที่แบบเดี่ยว)
- โมเดลตัวอย่าง: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือคีย์ API เฉพาะทำงานแตกต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto`; OpenClaw ส่งตัวเลือก transport ไปยังรันไทม์โมเดลที่ใช้ร่วมกัน
- แทนที่เป็นรายโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- การประมวลผลแบบลำดับความสำคัญของ OpenAI สามารถเปิดใช้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` แมปคำขอ Responses แบบตรง `openai/*` เป็น `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อคุณต้องการ tier แบบชัดเจนแทน toggle `/fast` ที่ใช้ร่วมกัน
- ส่วนหัวแสดงที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบเนทีฟไปยัง `api.openai.com` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- เส้นทาง OpenAI แบบเนทีฟยังคงเก็บ Responses `store`, คำใบ้ prompt-cache และการจัดรูป payload สำหรับความเข้ากันได้กับ reasoning ของ OpenAI; เส้นทาง proxy ไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` พร้อมใช้งานผ่านการยืนยันตัวตนการสมัครสมาชิก OAuth ของ ChatGPT/Codex เมื่อบัญชีที่ลงชื่อเข้าใช้ของคุณเปิดเผยโมเดลนี้; OpenClaw ยังคงระงับเส้นทางคีย์ API ของ OpenAI โดยตรงและคีย์ API ของ Azure สำหรับโมเดลนี้ เพราะ transport เหล่านั้นปฏิเสธโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- การยืนยันตัวตน: `ANTHROPIC_API_KEY`
- การหมุนเวียนเสริม: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (การแทนที่แบบเดี่ยว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะแบบตรงรองรับ toggle `/fast` และ `params.fastMode` ที่ใช้ร่วมกัน รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วยคีย์ API และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw แมปสิ่งนั้นเป็น `service_tier` ของ Anthropic (`auto` เทียบกับ `standard_only`)
- การกำหนดค่า Claude CLI ที่แนะนำจะคงการอ้างอิงโมเดลไว้เป็นมาตรฐานและเลือกแบ็กเอนด์ CLI
  แยกต่างหาก: `anthropic/claude-opus-4-8` พร้อม
  `agentRuntime.id: "claude-cli"` ในขอบเขตโมเดล การอ้างอิงเดิม
  `claude-cli/claude-opus-4-7` ยังคงทำงานเพื่อความเข้ากันได้

<Note>
พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI กลับมาใช้และการใช้งาน `claude -p` ได้รับอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ setup-token ของ Anthropic ยังคงพร้อมใช้งานเป็นเส้นทางโทเค็น OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw แนะนำให้ใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth ของ OpenAI ChatGPT/Codex

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: OAuth (ChatGPT)
- การอ้างอิงโมเดล OpenAI Codex เดิม: `openai/gpt-5.5`
- การอ้างอิงฮาร์เนส app-server ของ Codex แบบเนทีฟ: `openai/gpt-5.5`
- เอกสารฮาร์เนส app-server ของ Codex แบบเนทีฟ: [ฮาร์เนส Codex](/th/plugins/codex-harness)
- การอ้างอิงโมเดลเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai/*` โหลด Plugin OpenAI; Plugin app-server ของ Codex แบบเนทีฟถูกเลือกโดยรันไทม์ฮาร์เนส Codex
- CLI: `openclaw onboard --auth-choice openai` หรือ `openclaw models auth login --provider openai`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, SSE เป็น fallback)
- แทนที่เป็นรายโมเดล OpenAI Codex ผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` ถูกส่งต่อบนคำขอ Responses ของ Codex แบบเนทีฟด้วย (`chatgpt.com/backend-api`)
- ส่วนหัวแสดงที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`) จะแนบเฉพาะกับทราฟฟิก Codex แบบเนทีฟไปยัง `chatgpt.com/backend-api` ไม่ใช่ proxy ที่เข้ากันได้กับ OpenAI แบบทั่วไป
- ใช้ toggle `/fast` และการกำหนดค่า `params.fastMode` เดียวกันกับ `openai/*` แบบตรง; OpenClaw แมปสิ่งนั้นเป็น `service_tier=priority`
- `openai/gpt-5.5` ใช้ `contextWindow = 400000` แบบเนทีฟของแค็ตตาล็อก Codex และรันไทม์เริ่มต้น `contextTokens = 272000`; แทนที่ขีดจำกัดรันไทม์ด้วย `models.providers.openai.models[].contextTokens`
- หมายเหตุนโยบาย: OAuth ของ OpenAI Codex รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอก เช่น OpenClaw
- สำหรับเส้นทางการสมัครสมาชิกทั่วไปพร้อมรันไทม์ Codex แบบเนทีฟ ให้ลงชื่อเข้าใช้ด้วยการยืนยันตัวตน `openai` และกำหนดค่า `openai/gpt-5.5`; รอบการทำงานของ agent OpenAI จะเลือก Codex ตามค่าเริ่มต้น
- ใช้ provider/model `agentRuntime.id: "openclaw"` เฉพาะเมื่อคุณต้องการเส้นทาง OpenClaw ในตัว; มิฉะนั้นให้คง `openai/gpt-5.5` ไว้บนฮาร์เนส Codex เริ่มต้น
- การอ้างอิง GPT ของ Codex เดิมเป็นสถานะเดิม ไม่ใช่เส้นทางผู้ให้บริการ live ใช้ `openai/gpt-5.5` บนรันไทม์ Codex แบบเนทีฟสำหรับการกำหนดค่า agent ใหม่ และเรียกใช้ `openclaw doctor --fix` เพื่อย้ายการอ้างอิงโมเดล Codex เดิมเก่าไปเป็นการอ้างอิงมาตรฐาน `openai/*`

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

### ตัวเลือกโฮสต์แบบสมัครสมาชิกอื่นๆ

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/th/providers/zai">
    แผน Coding ของ Z.AI หรือ endpoint API ทั่วไป
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    OAuth ของแผน Coding ของ MiniMax หรือการเข้าถึงด้วยคีย์ API
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    พื้นผิวผู้ให้บริการ Qwen Cloud พร้อม Alibaba DashScope และการแมป endpoint ของแผน Coding
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

### Google Gemini (คีย์ API)

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนแบบไม่บังคับ: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, การสำรองไปใช้ `GOOGLE_API_KEY`, และ `OPENCLAW_LIVE_GEMINI_KEY` (การเขียนทับเดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: การกำหนดค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูกทำให้เป็นมาตรฐานเป็น `google/gemini-3-flash-preview`
- นามแฝง: ยอมรับ `google/gemini-3.1-pro` และทำให้เป็นมาตรฐานเป็นรหัส Gemini API สดของ Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การคิด: `/think adaptive` ใช้การคิดแบบไดนามิกของ Google Gemini 3/3.1 จะไม่ใส่ `thinkingLevel` แบบคงที่; Gemini 2.5 ส่ง `thinkingBudget: -1`
- การรัน Gemini โดยตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือ `cached_content` แบบเดิม) เพื่อส่งต่อแฮนเดิล `cachedContents/...` แบบเนทีฟของผู้ให้บริการ; การพบแคชของ Gemini จะแสดงเป็น `cacheRead` ของ OpenClaw

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตน

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานข้อจำกัดบัญชี Google หลังใช้ไคลเอนต์ของบุคคลที่สาม ตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
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

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่** ต้องวางรหัสไคลเอนต์หรือข้อมูลลับลงใน `openclaw.json` โฟลว์เข้าสู่ระบบของ CLI จะจัดเก็บโทเค็นไว้ในโปรไฟล์การยืนยันตัวตนบนโฮสต์ Gateway

  </Step>
  <Step title="ตั้งค่าโปรเจกต์ (หากจำเป็น)">
    หากคำขอล้มเหลวหลังเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

Gemini CLI ใช้ `stream-json` เป็นค่าเริ่มต้น OpenClaw อ่านข้อความสตรีมของผู้ช่วย
และทำให้ `stats.cached` เป็นมาตรฐานเป็น `cacheRead`; การเขียนทับแบบเดิม
`--output-format json` ยังอ่านข้อความตอบกลับจาก `response`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - การอ้างอิงโมเดลใช้รหัสผู้ให้บริการมาตรฐาน `zai/*`
  - `zai-api-key` ตรวจจับปลายทาง Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global`, และ `zai-cn` บังคับใช้พื้นผิวที่เฉพาะเจาะจง

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- การยืนยันตัวตน: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Plugin ผู้ให้บริการอื่นที่รวมมาให้

| ผู้ให้บริการ                            | รหัส                             | env การยืนยันตัวตน                                 | โมเดลตัวอย่าง                                             |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/th/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth หรือ `OPENROUTER_API_KEY`           | `openrouter/auto`                                          |
| [Qwen OAuth](/th/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth หรือ `XAI_API_KEY`         | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### ข้อควรรู้เฉพาะบางอย่าง

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้ส่วนหัวการระบุแอปและมาร์กเกอร์ `cache_control` ของ Anthropic เฉพาะบนเส้นทาง `openrouter.ai` ที่ยืนยันแล้วเท่านั้น การอ้างอิง DeepSeek, Moonshot, และ ZAI มีสิทธิ์ใช้ cache-TTL สำหรับการแคชพรอมป์ที่ OpenRouter จัดการ แต่จะไม่ได้รับมาร์กเกอร์แคชของ Anthropic ในฐานะเส้นทางพร็อกซีที่เข้ากันได้กับ OpenAI จะข้ามการปรับรูปแบบที่เป็นเนทีฟของ OpenAI เท่านั้น (`serviceTier`, Responses `store`, คำใบ้แคชพรอมป์, ความเข้ากันได้ของการให้เหตุผลของ OpenAI) การอ้างอิงที่หนุนด้วย Gemini จะคงไว้เฉพาะการทำความสะอาดลายเซ็นความคิดของ proxy-Gemini
  </Accordion>
  <Accordion title="Kilo Gateway">
    การอ้างอิงที่หนุนด้วย Gemini ใช้เส้นทางการทำความสะอาด proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และการอ้างอิงอื่นที่พร็อกซีไม่รองรับการให้เหตุผลจะข้ามการฉีดการให้เหตุผลของพร็อกซี
  </Accordion>
  <Accordion title="MiniMax">
    การเริ่มต้นใช้งานด้วยคีย์ API เขียนคำจำกัดความโมเดลแชต M3 และ M2.7 อย่างชัดเจน; การทำความเข้าใจรูปภาพยังคงอยู่บนผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    รหัสโมเดลใช้เนมสเปซ `nvidia/<vendor>/<model>` (เช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกจะรักษาองค์ประกอบ `<provider>/<model-id>` ตามตัวอักษร ขณะที่คีย์มาตรฐานที่ส่งไปยัง API ยังคงมีคำนำหน้าเดี่ยว
  </Accordion>
  <Accordion title="xAI">
    ใช้เส้นทาง xAI Responses เส้นทางที่แนะนำคือ SuperGrok/X Premium OAuth; คีย์ API ยังใช้งานได้ผ่าน `XAI_API_KEY` หรือการกำหนดค่า Plugin และ Grok `web_search` ใช้โปรไฟล์การยืนยันตัวตนเดียวกันซ้ำก่อนสำรองไปใช้คีย์ API `grok-4.3` เป็นโมเดลแชตเริ่มต้นที่รวมมาให้ และเลือก `grok-build-0.1` ได้สำหรับงานที่เน้นการสร้าง/เขียนโค้ด `/fast` หรือ `params.fastMode: true` เขียน `grok-3`, `grok-3-mini`, `grok-4`, และ `grok-4-0709` ใหม่เป็นตัวแปร `*-fast` ของแต่ละรายการ `tool_stream` เปิดเป็นค่าเริ่มต้น; ปิดผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (URL แบบกำหนดเอง/ฐาน)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **กำหนดเอง** หรือพร็อกซีที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่รวมมาให้หลายรายการด้านล่างเผยแพร่แค็ตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` แบบชัดเจนเฉพาะเมื่อคุณต้องการเขียนทับ URL ฐาน ส่วนหัว หรือรายการโมเดลเริ่มต้นเท่านั้น

การตรวจสอบความสามารถของโมเดลใน Gateway ยังอ่านเมทาดาทา `models.providers.<id>.models[]` ที่ระบุอย่างชัดเจนด้วย หากโมเดลแบบกำหนดเองหรือโมเดล proxy รับรูปภาพได้ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้ WebChat และเส้นทางไฟล์แนบที่มีต้นทางจากโหนดส่งรูปภาพเป็นอินพุตโมเดลแบบเนทีฟ แทนที่จะเป็นการอ้างอิงสื่อแบบข้อความเท่านั้น

`agents.defaults.models["provider/model"]` ควบคุมเฉพาะการมองเห็นโมเดล นามแฝง และเมทาดาทารายโมเดลสำหรับเอเจนต์เท่านั้น ไม่ได้ลงทะเบียนโมเดลรันไทม์ใหม่ด้วยตัวเอง สำหรับโมเดลของผู้ให้บริการแบบกำหนดเอง ให้เพิ่ม `models.providers.<provider>.models[]` ด้วย โดยอย่างน้อยต้องมี `id` ที่ตรงกัน

### Moonshot AI (Kimi)

ติดตั้ง `@openclaw/moonshot-provider` ก่อนเริ่ม onboarding เพิ่มรายการ `models.providers.moonshot` อย่างชัดเจนเฉพาะเมื่อคุณต้องการแทนที่ URL ฐานหรือเมทาดาทาโมเดล:

- ผู้ให้บริการ: `moonshot`
- การยืนยันตัวตน: `MOONSHOT_API_KEY`
- โมเดลตัวอย่าง: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

รหัสโมเดล Kimi K2:

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

Kimi Coding ใช้ endpoint ของ Moonshot AI ที่เข้ากันได้กับ Anthropic:

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

`kimi/kimi-code` และ `kimi/k2p5` แบบเดิมยังคงยอมรับเป็นรหัสโมเดลสำหรับความเข้ากันได้ และจะถูกทำให้เป็นรหัสโมเดล API เสถียรของ Kimi

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่น ๆ ในประเทศจีน

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

onboarding ใช้พื้นผิวสำหรับการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*` จะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือกการยืนยันตัวตนของ Volcengine จะให้ความสำคัญกับแถวทั้ง `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ได้โหลด OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการซึ่งว่างเปล่า

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

BytePlus ARK ให้ผู้ใช้นานาชาติเข้าถึงโมเดลเดียวกับ Volcano Engine

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

Onboarding ใช้ค่าเริ่มต้นเป็นพื้นผิวสำหรับการเขียนโค้ด แต่แค็ตตาล็อกทั่วไป `byteplus/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือกการยืนยันตัวตนของ BytePlus จะให้ความสำคัญกับแถวทั้ง `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ได้โหลด OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่ถูกกรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการซึ่งว่างเปล่า

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

MiniMax กำหนดค่าผ่าน `models.providers` เนื่องจากใช้ปลายทางแบบกำหนดเอง:

- MiniMax OAuth (ทั่วโลก): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (จีน): `--auth-choice minimax-cn-oauth`
- คีย์ API ของ MiniMax (ทั่วโลก): `--auth-choice minimax-global-api`
- คีย์ API ของ MiniMax (จีน): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดู [/providers/minimax](/th/providers/minimax) สำหรับรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่างการกำหนดค่า

<Note>
บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ของ MiniMax OpenClaw จะปิดใช้งาน thinking เป็นค่าเริ่มต้นสำหรับตระกูล M2.x เว้นแต่คุณจะตั้งค่าอย่างชัดเจน; MiniMax-M3 (และ M3.x) จะยังคงอยู่บนเส้นทาง thinking แบบละไว้/ปรับอัตโนมัติของผู้ให้บริการตามค่าเริ่มต้น `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแบ่งความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังคงอยู่บน `minimax/MiniMax-M3`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การทำความเข้าใจภาพคือ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนเส้นทางการยืนยันตัวตน MiniMax ทั้งสองแบบ
- การค้นหาเว็บยังคงอยู่บนรหัสผู้ให้บริการ `minimax`

### LM Studio

LM Studio มาพร้อมเป็น Plugin ผู้ให้บริการแบบบันเดิลซึ่งใช้ API ดั้งเดิม:

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

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` ดั้งเดิมของ LM Studio สำหรับการค้นพบ + โหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานตามค่าเริ่มต้น หากคุณต้องการให้การโหลด JIT, TTL และการขับออกอัตโนมัติของ LM Studio เป็นเจ้าของวงจรชีวิตของโมเดล ให้ตั้งค่า `models.providers.lmstudio.params.preload: false` ดู [/providers/lmstudio](/th/providers/lmstudio) สำหรับการตั้งค่าและการแก้ไขปัญหา

### Ollama

Ollama มาพร้อมเป็น Plugin ผู้ให้บริการแบบบันเดิลและใช้ API ดั้งเดิมของ Ollama:

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

Ollama จะถูกตรวจพบภายในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการแบบบันเดิลจะเพิ่ม Ollama โดยตรงไปยัง `openclaw onboard` และตัวเลือกโมเดล ดู [/providers/ollama](/th/providers/ollama) สำหรับ onboarding โหมดคลาวด์/ภายในเครื่อง และการกำหนดค่าแบบกำหนดเอง

### vLLM

vLLM มาพร้อมเป็น Plugin ผู้ให้บริการแบบบันเดิลสำหรับเซิร์ฟเวอร์ภายในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติภายในเครื่อง (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับการยืนยันตัวตน):

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

SGLang มาพร้อมเป็น Plugin ผู้ให้บริการแบบบันเดิลสำหรับเซิร์ฟเวอร์โฮสต์เองที่รวดเร็วและเข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นพบอัตโนมัติภายในเครื่อง (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับการยืนยันตัวตน):

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
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์ไม่บังคับ เมื่อละไว้ OpenClaw จะตั้งค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าที่ชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="กฎการจัดรูปเส้นทางพร็อกซี">
    - สำหรับ `api: "openai-completions"` บนปลายทางที่ไม่ใช่ดั้งเดิม (ทุก `baseUrl` ที่ไม่ว่างและมีโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI จะข้ามการจัดรูปคำขอที่ใช้เฉพาะ OpenAI ดั้งเดิมด้วย: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้ prompt-cache, ไม่มีการจัดรูป payload เพื่อความเข้ากันได้กับ reasoning ของ OpenAI และไม่มีส่วนหัวแสดงที่มาของ OpenClaw แบบซ่อน
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องใช้ฟิลด์เฉพาะผู้ขาย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อผสาน JSON เพิ่มเติมเข้ากับเนื้อความคำขอขาออก
    - สำหรับการควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM แบบบันเดิลจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับ thinking ของเซสชันปิดอยู่
    - สำหรับโมเดลภายในเครื่องที่ช้าหรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` ค่านี้ขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึงการเชื่อมต่อ ส่วนหัว การสตรีมเนื้อความ และการยกเลิก guarded-fetch ทั้งหมด โดยไม่เพิ่ม timeout ของรันเอเจนต์ทั้งหมด หาก `agents.defaults.timeoutSeconds` หรือ timeout เฉพาะรันต่ำกว่า ให้เพิ่มเพดานนั้นด้วย; timeout ของผู้ให้บริการไม่สามารถขยายรันทั้งหมดได้
    - การเรียก HTTP ของผู้ให้บริการโมเดลอนุญาตคำตอบ DNS แบบ fake-IP ของ Surge, Clash และ sing-box ใน `198.18.0.0/15` และ `fc00::/7` เฉพาะสำหรับชื่อโฮสต์ `baseUrl` ของผู้ให้บริการที่กำหนดค่าไว้เท่านั้น ปลายทางผู้ให้บริการแบบกำหนดเอง/ภายในเครื่องยังเชื่อถือ origin `scheme://host:port` ที่กำหนดค่าไว้อย่างตรงกันสำหรับคำขอโมเดลที่มีการป้องกัน รวมถึงโฮสต์ loopback, LAN และ tailnet นี่ไม่ใช่ตัวเลือกการกำหนดค่าใหม่; `baseUrl` ที่คุณกำหนดค่าจะขยายนโยบายคำขอเฉพาะสำหรับ origin นั้นเท่านั้น การอนุญาตชื่อโฮสต์ fake-IP และการเชื่อถือ exact-origin เป็นกลไกอิสระต่อกัน ปลายทางส่วนตัว, loopback, link-local, metadata อื่น ๆ และพอร์ตที่ต่างกันยังต้องเลือกใช้ `models.providers.<id>.request.allowPrivateNetwork: true` อย่างชัดเจน ตั้งค่า `models.providers.<id>.request.allowPrivateNetwork: false` เพื่อเลือกไม่ใช้การเชื่อถือ exact-origin
    - หาก `baseUrl` ว่าง/ละไว้ OpenClaw จะคงพฤติกรรมเริ่มต้นของ OpenAI (ซึ่งแก้เป็น `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ตั้งอย่างชัดเจนจะยังถูกแทนที่บนปลายทาง `openai-completions` ที่ไม่ใช่ดั้งเดิม
    - สำหรับ `api: "anthropic-messages"` บนปลายทางที่ไม่ใช่แบบตรง (ผู้ให้บริการใด ๆ นอกเหนือจาก `anthropic` ตามแบบแผน หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่มีโฮสต์ไม่ใช่ปลายทาง `api.anthropic.com` สาธารณะ) OpenClaw จะระงับส่วนหัว Anthropic beta แบบแฝง เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และเครื่องหมาย OAuth เพื่อให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ไม่ปฏิเสธแฟล็ก beta ที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีของคุณต้องใช้ฟีเจอร์ beta เฉพาะ

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
- [Model failover](/th/concepts/model-failover) - เชน fallback และพฤติกรรมการลองใหม่
- [โมเดล](/th/concepts/models) - การกำหนดค่าโมเดลและ alias
- [ผู้ให้บริการ](/th/providers) - คู่มือการตั้งค่ารายผู้ให้บริการ
